/**
 * World migration.
 *
 * This system spent its first twenty-odd releases moving data out of flags and
 * into real schema fields. Every one of those releases answered "what does a
 * NEW world look like" and none answered "what happens to a world someone
 * already built".
 *
 * Design rules, in order of importance:
 *
 *   1. NEVER destroy data you cannot reconstruct. A step that cannot
 *      confidently convert a value leaves it alone and says so.
 *   2. ONE transaction boundary. The recorded version advances only when the
 *      WHOLE pass succeeded -- not when one stage of it did. The v0.29.0 build
 *      got this wrong: migrateWorld() committed the version itself and the
 *      clock stage ran after it, so a clock failure left a world stamped
 *      "migrated" with its clocks stranded and no way back, because the next
 *      load would see an up-to-date version and return immediately. There is
 *      now exactly one function that writes the version, and it runs last.
 *   3. Idempotent. Running twice is indistinguishable from running once,
 *      because a failed pass WILL be run again.
 *   4. Additive. A step copies legacy data to its modern home and leaves the
 *      legacy copy alone. Removal is a separate decision for a later release.
 *   5. Do not reimplement a conversion that already has an owner. See the
 *      clock stage below for why this rule is in the list.
 *
 * Steps are grouped by the collection they walk, rather than "actor" being
 * baked into the abstraction, so an Item or Journal migration has somewhere
 * to go that is not a special case.
 */
import { RETIRED_MACROS } from "../helpers/retired-macros.mjs";

const FLAG_SCOPE = "the-broken-empires";

/* Mirrors CONFIG.TBE.OWNED_FLAGS for the Node harnesses, which have no CONFIG.
   If these two lists drift, migration_fixtures_check.mjs section 0 fails. */
const OWNED_FLAGS_FALLBACK = ["weave", "clocks", "session", "funnel", "toughness"];
const VERSION_KEY = "worldSchemaVersion";

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

/* --------------------------------------------------------------------------
 * Steps.
 *
 * { version, label, collection, apply(doc) -> updateData|null }
 *
 * `collection` names what the step walks: "actors", "items", "journal", or
 * "world" for anything that is not a document sweep. `apply` returns a flat
 * update object or null; null is the common case and is not a failure.
 * ----------------------------------------------------------------------- */
/**
 * Move this system's own flags out of the legacy `tbe` namespace and into the
 * system id, which is the only scope Foundry will accept from us.
 *
 * Shared by the two 0.39.0 steps below, which differ only in the collection
 * they walk (actors-and-token-actors, and journal entries). One body, so the
 * actor sweep and the journal sweep cannot come to disagree about what a move
 * means -- the exact class of bug `docs/ownership.md` exists to track.
 */
export function moveOwnedFlags(doc) {
  const legacy = doc.flags?.tbe;
  if (!legacy || typeof legacy !== "object") return null;

  const owned = (typeof CONFIG !== "undefined" && CONFIG?.TBE?.OWNED_FLAGS) || OWNED_FLAGS_FALLBACK;
  const scope = (typeof CONFIG !== "undefined" && CONFIG?.TBE?.FLAG_SCOPE) || FLAG_SCOPE;
  const current = doc.flags?.[scope] ?? {};
  const update = {};

  for (const key of owned) {
    if (!(key in legacy)) continue;
    /* Delete the legacy copy whether or not the value is carried across:
       leaving it behind is what lets the two namespaces drift apart again,
       which is the whole defect. Foundry's `-=` prefix removes a key. */
    update["flags.tbe.-=" + key] = null;
    if (current[key] === undefined) update["flags." + scope + "." + key] = legacy[key];
  }
  return Object.keys(update).length ? update : null;
}

export const STEPS = [
  {
    version: "0.22.0",
    collection: "actors",
    label: "Toughness read from a flag nothing ever wrote",
    /* TBE: Journey Leg's arrival Infection check read flags.tbe.toughness,
       which no code path ever set, so it ran at Toughness 0 for every
       character. Fixed in the macro in v0.22.0. A world that DID acquire the
       flag by hand is honoured, but only when the real field is still at its
       default, so a deliberate sheet value is never overwritten. */
    apply(actor) {
      const legacy = actor.flags?.tbe?.toughness;
      if (legacy === undefined || legacy === null) return null;
      if (num(actor.system?.toughness, 0) !== 0) return null;
      return { "system.toughness": num(legacy, 0) };
    }
  },
  {
    version: "0.33.0",
    collection: "tokens",
    label: "Creature Initiative corrupted into a comma-joined string",
    /* The creature sheet carried TWO inputs named system.initiative (its own
       header and the shared actor-wounds.hbs chip). FormDataExtended hands a
       repeated name to the DataModel as an ARRAY; the StringField cast it to
       "14,14", and every later save appended again -- "14,14,NaN", then
       "14,14,NaN,NaN". prepareDerivedData does num(system.initiative, 0) on
       that, gets NaN, and falls back to 0, so `@initiativeEffective` resolved
       to 0 and every corrupted creature rolled Initiative 0 and acted dead
       last. A real session shipped five rounds of combat that way before the
       after-action probe found it.

       Repair, not reconstruction: the duplicate inputs always submitted the
       same stored value, so the leading segment IS the number the GM typed.
       Where no segment is a number at all (a blank creature saved twice gives
       the literal string ","), the honest answer is blank, which is what it
       was. Anything that is already a clean value is left alone, which is what
       makes this idempotent. */
    apply(actor) {
      if (actor.type !== "creature") return null;
      const raw = actor.system?.initiative;
      if (typeof raw !== "string") return null;
      if (!raw.includes(",") && raw !== "NaN") return null;   // already clean
      const good = raw.split(",").map((p) => p.trim()).filter((p) => p !== "" && Number.isFinite(Number(p)));
      return { "system.initiative": good.length ? good[0] : "" };
    }
  },
  {
    version: "0.39.0",
    collection: "tokens",
    label: "Flags split across two namespaces, one of them not a valid scope",
    /* The system id is "the-broken-empires". Foundry accepts "core", "world",
       the system id and installed module ids as flag scopes, and `setFlag` /
       `getFlag` throw on anything else. This codebase wrote BOTH
       `flags.tbe.*` and `flags.the-broken-empires.*` for its whole life,
       decided per line by which spelling whoever wrote it reached for.

       It went unnoticed because `update({ "flags.tbe.weave": x })` does not
       validate the scope -- only setFlag/getFlag do. So all the direct-update
       sites worked, and the single file that used the documented API,
       tbe-funnel-roster.js, is the one that was broken. The incentive was
       exactly backwards: using the API correctly was the thing that failed.

       WHAT THIS MOVES: the keys in TBE.OWNED_FLAGS, one at a time, and
       nothing else. The temptation is to move the whole `flags.tbe` object in
       one go, and that would be wrong: the Salt-Run Ambush adventure stores
       its live tracker in `flags.tbe.saltRunAmbush`, ships as its own
       installer, and is NOT updated by a system upgrade. A whole-namespace
       sweep would move state out from under a running adventure whose code
       still reads the old path, and whose copy in the GM's world we have no
       way to update. Tidying a namespace is not worth breaking somebody's
       session over, so keys this system does not own stay exactly where they
       are.

       CONFLICT RULE: if a key somehow exists under both, the CURRENT namespace
       wins and the legacy copy is dropped. The only way to hold both is a
       half-finished earlier run, and in that case the new one is the value
       today's code has been reading and writing.

       IDEMPOTENT: a document with no legacy keys returns null. Running it
       twice is indistinguishable from running it once, which fixture K
       asserts by doing exactly that.

       ORDER: this sits after the 0.22.0 Toughness step, which READS
       `flags.tbe.toughness`. runSteps applies each step's update before the
       next step sees the document, so on a 0.21.0 world the Toughness value
       is harvested into `system.toughness` first and the leftover flag is
       cleared here. Reversing the order would silently skip the Toughness
       repair on exactly the oldest worlds that need it. */
    apply: moveOwnedFlags
  },
  {
    version: "0.39.0",
    collection: "journal",
    label: "Journal flags split across two namespaces",
    /* Clocks and the session counter live on a JournalEntry, not an actor, so
       the same move needs a second pass over a different collection. Same
       body, same owned-key list; `COLLECTIONS` decides what it walks. */
    apply: moveOwnedFlags
  }
];

const COLLECTIONS = {
  actors: () => game.actors ?? [],
  items: () => game.items ?? [],
  journal: () => game.journal ?? [],
  /* Every actor a sheet can be opened on, world actors AND the synthetic
     actors behind unlinked tokens. The distinction is not academic: the
     0.33.0 corruption below lived almost entirely on token actors, because a
     GM edits the thing on the battle map, not the thing in the sidebar. A
     sweep over game.actors alone would have reported "nothing needed
     changing" on a world where every enemy in play was broken. Updating a
     synthetic actor writes to its token's delta, which is where the bad value
     is. */
  tokens: () => {
    const out = [...(game.actors ?? [])];
    for (const scene of game.scenes ?? []) {
      for (const token of scene.tokens ?? []) {
        if (token.isLinked) continue;                 // already covered above
        if (token.actor) out.push(token.actor);
      }
    }
    return out;
  }
};

export function currentVersion(system) {
  return system?.version ?? game.system?.version ?? "0.0.0";
}

export function worldVersion() {
  return game.settings.get(FLAG_SCOPE, VERSION_KEY) || "0.0.0";
}

export function registerSettings() {
  game.settings.register(FLAG_SCOPE, VERSION_KEY, {
    name: "World schema version",
    scope: "world",
    config: false,
    type: String,
    default: ""
  });
}

const isOlder = (a, b) => foundry.utils.isNewerVersion(b, a);

/** Steps due for a world at `from`. Exported so a test can ask without running. */
export function stepsDue(from) {
  return STEPS.filter((s) => isOlder(from, s.version));
}

/**
 * Run the document-sweep steps. Does NOT touch the recorded version: that is
 * migrateAll()'s job and only its job. Returns a report.
 */
export async function runSteps(from, { dryRun = false } = {}) {
  const due = stepsDue(from);
  const report = { steps: [], touched: 0, failed: [] };

  for (const step of due) {
    if (step.collection === "world") { report.steps.push({ version: step.version, label: step.label, changed: [] }); continue; }
    const docs = (COLLECTIONS[step.collection] ?? (() => []))();
    const changed = [];
    for (const doc of docs) {
      let update = null;
      try {
        update = step.apply(doc);
      } catch (err) {
        console.error(`TBE | migration ${step.version} failed on ${doc.name}`, err);
        report.failed.push({ step: step.version, doc: doc.name, err: String(err) });
        continue;
      }
      if (!update || !Object.keys(update).length) continue;
      changed.push(doc.name);
      if (!dryRun) {
        try {
          await doc.update(update);
        } catch (err) {
          console.error(`TBE | migration ${step.version} could not write ${doc.name}`, err);
          report.failed.push({ step: step.version, doc: doc.name, err: String(err) });
        }
      }
    }
    report.steps.push({ version: step.version, label: step.label, changed });
    report.touched += changed.length;
  }
  return report;
}

/**
 * Stranded clocks: DETECT AND REPORT ONLY. This deliberately writes nothing.
 *
 * The v0.29.0 build tried to convert them here and got it wrong in four
 * separate ways at once: it wrote to a setting named "trackers" when the store
 * is "encounters"; it treated that store as an Array when it is an object,
 * which would have written an array straight over every existing tracker in the
 * world; it used field names (label/filled/size) that the tracker shape does
 * not have (name/slsRequired/total/intervalsUsed/status); and it dropped the
 * `failed` filter so dead clocks would have come back to life.
 *
 * The conversion already had a correct, tested owner -- the retired TBE: Clocks
 * macro, which v0.28.0 turned into exactly this migrator. Writing a second
 * implementation of it here was the same duplicate-ownership mistake this
 * project keeps finding in its own history, made while building the thing meant
 * to prevent that class of mistake.
 *
 * So: find them, count them, tell the GM which journal they are on and which
 * macro converts them. One owner for the conversion, and a migration layer that
 * cannot corrupt a tracker store it does not write to.
 */
export function findStrandedClocks() {
  const found = [];
  for (const entry of game.journal ?? []) {
    /* Both namespaces on purpose. This is a DETECTOR, and it runs on the ready
       hook against a world at any version -- including one that has not taken
       the 0.39.0 move yet, and one that took it seconds ago. A detector that
       reads only the post-migration path reports "no stranded clocks" on
       precisely the old worlds it exists to warn. */
    const scope = (typeof CONFIG !== "undefined" && CONFIG?.TBE?.FLAG_SCOPE) || FLAG_SCOPE;
    const clocks = entry.flags?.[scope]?.clocks ?? entry.flags?.tbe?.clocks;
    if (!Array.isArray(clocks) || !clocks.length) continue;
    for (const [i, c] of clocks.entries()) {
      if (!c || c.done || c.failed) continue;      // same filter the macro uses
      found.push({
        journal: entry.name,
        journalId: entry.id,
        index: i,
        name: (c.name || "Clock").trim(),
        have: num(c.have, 0),
        need: num(c.need, 6)
      });
    }
  }
  return found;
}

/**
 * Stale and duplicated world macros: DETECT AND REPORT ONLY, like the clocks
 * above. This writes nothing and deletes nothing, on purpose.
 *
 * The problem it exists for. Upgrading the system updates the `tbe-macros`
 * COMPENDIUM. It does not touch copies a GM already dragged into their world
 * macro directory or onto a hotbar -- those are frozen at whatever version
 * they were imported. So a GM can install 0.35.0, open a world, and still be
 * running the 0.28.0 build of TBE: Attack, with none of the fixes, and nothing
 * anywhere says so. The playtest world was reported carrying nine copies of
 * TBE: Character Wizard, five of TBE: Attack and five of TBE: Finish Character,
 * because re-importing the compendium ADDS rather than replaces.
 *
 * That is the "looks built but silently isn't" failure this project's MVP bar
 * is written against, one level up: the system is fixed and the thing the
 * player actually clicks is not.
 *
 * Why it only reports: a differing command is not proof of staleness. A GM is
 * perfectly entitled to edit their own copy, and deleting someone's customised
 * macro because it does not match the shipped one would be exactly the kind of
 * damage CLAUDE.md rule 6 forbids. So this counts, names, and leaves the
 * decision to the human -- the same call `findStrandedClocks` makes.
 */
export async function findStaleMacros() {
  const out = { scanned: 0, duplicates: [], differing: [], retired: [], checked: false };
  try {
    const pack = game.packs?.get("the-broken-empires.tbe-macros");
    if (!pack) return out;
    const shipped = new Map();
    for (const doc of await pack.getDocuments()) shipped.set(doc.name, doc.command ?? "");
    if (!shipped.size) return out;
    out.checked = true;

    const byName = new Map();
    for (const m of game.macros ?? []) {
      if (!shipped.has(m.name)) continue;          // not ours; none of our business
      if (!byName.has(m.name)) byName.set(m.name, []);
      byName.get(m.name).push(m);
    }

    for (const [name, copies] of byName) {
      out.scanned += copies.length;
      if (copies.length > 1) out.duplicates.push({ name, count: copies.length });
      const behind = copies.filter((m) => (m.command ?? "") !== shipped.get(name)).length;
      if (behind) out.differing.push({ name, behind, total: copies.length });
    }
    /* Copies of macros this system has RETIRED still run their old code.
       Counted here only when they still hold it: a copy TBE: Update Macros
       already pointed at its replacement is not reported again. */
    const retired = new Map();
    for (const m of game.macros ?? []) {
      const r = RETIRED_MACROS[m.name];
      if (!r || (m.command ?? "") === r.command) continue;
      retired.set(m.name, (retired.get(m.name) || 0) + 1);
    }
    out.retired = [...retired].map(([name, count]) => ({ name, count, replacement: RETIRED_MACROS[name].replacement }))
      .sort((a, b) => b.count - a.count);
    out.duplicates.sort((a, b) => b.count - a.count);
    out.differing.sort((a, b) => b.behind - a.behind);
  } catch (err) {
    console.warn("TBE | could not compare world macros against the compendium", err);
  }
  return out;
}

/** The macro notice, or null when there is nothing to say. */
export function staleMacrosToHtml(found) {
  if (!found?.checked) return null;
  if (!found.duplicates.length && !found.differing.length && !(found.retired || []).length) return null;

  const dupes = found.duplicates.length
    ? `<div><b>${found.duplicates.length} macro(s) exist more than once</b> in this world: ` +
      found.duplicates.slice(0, 6).map((d) => `${d.name} &times;${d.count}`).join(", ") +
      (found.duplicates.length > 6 ? ", ..." : "") + "</div>"
    : "";

  const old = found.differing.length
    ? `<div style="margin-top:4px"><b>${found.differing.reduce((n, d) => n + d.behind, 0)} copy(ies) ` +
      `differ from the versions this release ships</b>: ` +
      found.differing.slice(0, 6).map((d) => `${d.name} (${d.behind} of ${d.total})`).join(", ") +
      (found.differing.length > 6 ? ", ..." : "") + "</div>"
    : "";

  const gone = (found.retired || []).length
    ? `<div style="margin-top:4px"><b>${found.retired.reduce((n, r) => n + r.count, 0)} copy(ies) of retired macros ` +
      `still run their old code</b>: ` +
      found.retired.map((r) => `${r.name} &times;${r.count} (replaced by ${r.replacement})`).join(", ") +
      `. TBE: Update Macros points each one at its replacement in place; it deletes none of them.</div>`
    : "";

  return `<div style="margin-top:6px;border-top:1px solid #7a6a4f;padding-top:4px">` +
    `<b>Macros in this world are not updated by a system upgrade.</b>` + dupes + old + gone +
    `<div style="font-size:11px;opacity:.85;margin-top:4px">Copies in your world macro directory are ` +
    `frozen at whatever version you imported them, so an old copy keeps its old bugs no matter what ` +
    `the system is at. Run <b>TBE: Update Macros</b> (in the <b>TBE Tools</b> compendium) to overwrite ` +
    `them in place from what this release ships &mdash; it matches on name and updates rather than ` +
    `importing another copy, and it keeps hotbar slots, folders and permissions intact. Nothing here has ` +
    `been changed or removed. A macro can also differ simply because you edited it yourself, and this ` +
    `cannot tell the difference &mdash; rename yours and both this notice and that macro will leave it ` +
    `alone.</div></div>`;
}

/**
 * The whole pass, and the ONLY place the recorded version is written.
 * Runs every stage first, then commits once, and only if nothing failed.
 */
export async function migrateAll({ dryRun = false } = {}) {
  const from = worldVersion();
  const target = currentVersion(game.system);
  const report = { from, target, steps: [], touched: 0, failed: [], clocks: [], committed: false };

  if (!isOlder(from, target)) { report.upToDate = true; return report; }

  const stepReport = await runSteps(from, { dryRun });
  Object.assign(report, {
    steps: stepReport.steps, touched: stepReport.touched, failed: stepReport.failed
  });

  try {
    report.clocks = findStrandedClocks();
  } catch (err) {
    console.error("TBE | could not scan for stranded clocks", err);
    report.failed.push({ step: "clock-scan", doc: "-", err: String(err) });
  }

  /* Stranded clocks are not a failure -- nothing here converts them, and a GM
     running one macro finishes the job. But the version must not advance while
     they are still stranded, or the next load will skip the notice entirely and
     the GM will never learn they are there. */
  const blocked = report.failed.length > 0 || report.clocks.length > 0;
  if (!dryRun && !blocked) {
    await game.settings.set(FLAG_SCOPE, VERSION_KEY, target);
    report.committed = true;
  }
  report.blockedBy = report.failed.length ? "failures"
    : report.clocks.length ? "stranded clocks"
    : null;
  return report;
}

/** Chat summary. Says what happened, including when nothing did. */
export function reportToHtml(report) {
  if (report.upToDate) return null;
  const rows = report.steps.map((s) =>
    `<div><b>${s.version}</b> ${s.label}<br>` +
    `<span style="font-size:11px;opacity:.8">${s.changed.length
      ? s.changed.length + " document(s): " + s.changed.slice(0, 8).join(", ") +
        (s.changed.length > 8 ? ", ..." : "")
      : "nothing needed changing"}</span></div>`).join("");

  const clocks = report.clocks.length
    ? `<div style="margin-top:4px"><b>${report.clocks.length} open clock(s)</b> still on journal flags: ` +
      report.clocks.slice(0, 6).map((c) => `${c.name} (${c.have}/${c.need})`).join(", ") +
      (report.clocks.length > 6 ? ", ..." : "") +
      `<br><span style="font-size:11px;opacity:.85">Run <b>TBE: Clocks</b> once to convert them into ` +
      `Extended Rolls. This migration deliberately does not convert them itself -- that macro is the ` +
      `one tested owner of that conversion.</span></div>`
    : "";

  const failed = report.failed.length
    ? `<div style="color:#8b1a1a"><b>${report.failed.length} problem(s)</b> — see the console.</div>`
    : "";

  const held = report.committed
    ? ""
    : `<div style="font-size:11px;opacity:.85;margin-top:4px">The world is still recorded at ` +
      `<b>${report.from}</b>, so this check runs again on the next load` +
      (report.blockedBy ? ` (held by: ${report.blockedBy})` : "") + `.</div>`;

  return `<div style="font-size:13px"><b>The Broken Empires — world check</b>` +
    `<div style="font-size:11px;opacity:.8">${report.from} → ${report.target}` +
    `${report.committed ? "" : " (not yet recorded)"}</div>` +
    rows + clocks + failed + held +
    `<div style="font-size:11px;opacity:.7;margin-top:4px">Legacy values are copied, never deleted.</div></div>`;
}
