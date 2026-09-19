/* migration_fixtures_check.mjs -- the migration fixture-world matrix named in
 * BACKLOG.md's "Second outside audit" section: "worlds at 0.21, 0.22, 0.27,
 * 0.28 migrated forward and asserted."
 *
 * audit_check.mjs section 7 already drives the real migration.mjs module
 * SEQUENTIALLY (run, fail, retry, inspect) and is the right shape of test for
 * the commit-ordering claim. What it does NOT do is use fixtures that look
 * like an actual world at a real past version -- its actors and journals are
 * each built to exercise one code path in isolation. This file is the
 * complement: whole-world snapshots, each grounded in what CHANGELOG.md
 * actually says was true of a world at that version (probed before building,
 * the same discipline as every data extractor in this project), run through
 * the real migrateAll() as one GM's actual upgrade would run it.
 *
 * What CHANGELOG.md establishes about each named version, checked before
 * writing a single fixture:
 *   - 0.21.0 (Tier 0): initiative/riders/Haggle/rank-scaling fixes. None of
 *     it touches persisted actor data shape. A 0.21.0 world's actors have
 *     ordinary data and -- since nothing had written flags.tbe.toughness yet,
 *     that bug not being found until 0.22.0's own development -- essentially
 *     never carry the legacy flag.
 *   - 0.22.0: the version STEPS actually targets. "The arrival Infection
 *     check has been running at Toughness 0 for every character. It read
 *     flags.tbe.toughness, which the native system never writes." A 0.22.0
 *     world may carry the flag ONLY on an actor a GM hand-patched as a
 *     workaround before the real fix shipped.
 *   - 0.27.0 (Divine Magic): adds a Divine sheet block, Piety-spending
 *     macros, and reads an existing "Piety" skill Item. New fields with
 *     defaults, not a rename or a move -- Foundry's own schema defaults
 *     handle that for free, which is exactly why STEPS has never needed a
 *     second entry for it. A 0.27.0 world's actors need nothing done to them.
 *   - 0.28.0: the last pre-migration-layer release, where TBE: Clocks turned
 *     into an Extended-Roll converter. A 0.28.0 world is exactly the shape
 *     that can carry real open clocks on journal flags.
 *   - 0.32.0 (added in 0.33.0): any world played in, at any version up to
 *     0.32.0, whose GM opened a creature sheet and saved it. The sheet had two
 *     inputs named system.initiative, so the value was stored comma-joined and
 *     the creature's derived Initiative fell to 0. The fixture that matters is
 *     a SCENE fixture, not an actor one: the corruption lands on the synthetic
 *     actor behind an unlinked token, because that is the copy a GM edits.
 * So the matrix below is not four versions each getting their own STEPS
 * entry -- it is confirming, against realistic data, that three of the four
 * genuinely need nothing (and that "nothing to do" still correctly advances
 * the recorded version rather than looping forever) and that the fourth
 * (0.28.0) is exactly where the stranded-clocks path has to fire correctly.
 *
 * Run: node migration_fixtures_check.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");

let pass = 0, fail = 0;
const check = (cond, label, extra) => {
  if (cond) { pass++; console.log("  PASS  " + label); }
  else { fail++; console.log("  FAIL  " + label + (extra !== undefined ? "  <- " + JSON.stringify(extra) : "")); }
};

const SYS = "system/the-broken-empires";

/* --- Minimal, honest world/actor stubs -- same shape audit_check.mjs's
 * section 7 uses, kept local so this file stands on its own. --- */
const cmp = (a, b) => {
  const pa = String(a).split(".").map(Number), pb = String(b).split(".").map(Number);
  for (let i = 0; i < 3; i++) { if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0) ? 1 : -1; }
  return 0;
};
globalThis.foundry = { utils: { isNewerVersion: (a, b) => cmp(a, b) > 0 } };
const quietErr = console.error; console.error = () => {};

const MIGMOD = await import(`./${SYS}/module/migration/migration.mjs`);

const CURRENT = JSON.parse(read(`${SYS}/system.json`)).version;

const col = (arr) => { const a = arr.slice(); a.size = arr.length; return a; };

const mkWorld = ({ version, actors = [], items = [], journal = [], scenes = [] } = {}) => {
  const store = { "the-broken-empires.worldSchemaVersion": version };
  return {
    settings: {
      get: (s, k) => store[`${s}.${k}`],
      set: async (s, k, v) => { store[`${s}.${k}`] = v; return v; },
      register: () => {}
    },
    actors: col(actors), items: col(items), journal: col(journal),
    scenes: col(scenes), tables: col([]), macros: col([]), playlists: col([]),
    system: { version: CURRENT },
    user: { isGM: true },
    __store: store
  };
};

/* Apply an update the way Foundry would, so a second pass sees what the first
   one wrote. Idempotence is a claim about the SECOND run, and a stub that
   swallows writes cannot test it.

   Handles two shapes the 0.39.0 flag move needs and the original stub did not:
   a dotted `flags.<scope>.<key>` path, and Foundry's `-=` key-deletion prefix
   (`flags.tbe.-=weave` removes `weave`). A stub that ignored the deletion
   would report a perfectly clean migration while leaving every legacy key in
   place, which is the exact failure the move exists to prevent. */
function applyUpdate(doc, u) {
  for (const [k, v] of Object.entries(u)) {
    const parts = k.split(".");
    const leafRaw = parts.pop();
    const deleting = leafRaw.startsWith("-=");
    const leaf = deleting ? leafRaw.slice(2) : leafRaw;

    let target = doc;
    for (const seg of parts) {
      if (target[seg] === undefined || target[seg] === null) target[seg] = {};
      target = target[seg];
    }
    if (deleting) delete target[leaf];
    else target[leaf] = v;
  }
}

const mkActor = (name, flags = {}, system = {}, type = "character") => ({
  name, flags, system, type, updates: [],
  update: async function (u) {
    this.updates.push(u);
    applyUpdate(this, u);
  }
});

/* Journal fixtures were plain literals with no `update`, which was fine while
   no step wrote to a journal. The 0.39.0 move does, and a missing `update`
   would land in runSteps' try/catch and be reported as a FAILED step rather
   than a migrated one -- green-looking for the wrong reason. */
const mkJournal = (name, flags = {}, extra = {}) => ({
  name, id: "j-" + name.toLowerCase().replace(/\W+/g, "-"), flags, updates: [], ...extra,
  update: async function (u) {
    this.updates.push(u);
    applyUpdate(this, u);
  }
});

/* An unlinked token: what a GM drags onto a battle map and then edits. Its
   .actor is a synthetic document, and updating it writes to the token's
   delta, not to the sidebar actor. */
const mkToken = (actor) => ({ isLinked: false, actor });
const mkScene = (name, tokens = []) => ({ name, tokens: col(tokens) });

const withWorld = async (world, fn) => { globalThis.game = world; try { return await fn(); } finally { globalThis.game = undefined; } };

console.log(`\n0. Sanity: the STEPS list is exactly what the header above claims`);
check(MIGMOD.STEPS.map((s) => s.version).join(",") === "0.22.0,0.33.0,0.39.0,0.39.0",
  "confirms the scope claim above rather than assuming it", MIGMOD.STEPS.map((s) => s.version));

/* ===================================================================
 * Fixture A: a 0.21.0 world, upgraded straight to current.
 * Ordinary actors, nobody has the legacy flag (nothing wrote it yet at
 * this version). Expect: nothing touched, but the version still advances --
 * this is the real experience of most players between 0.21.0 and 0.27.0.
 * =================================================================== */
console.log("\nA. A 0.21.0 world (pre-bug, nothing to migrate) still advances cleanly");
{
  const party = ["Eira", "Bram", "Casilda"].map((n) => mkActor(n, {}, { toughness: 0 }));
  const w = mkWorld({ version: "0.21.0", actors: party });
  const r = await withWorld(w, () => MIGMOD.migrateAll());
  check(r.touched === 0, "nothing needed changing on any of the three actors", r.touched);
  check(r.committed === true, "the version still commits");
  check(w.__store["the-broken-empires.worldSchemaVersion"] === CURRENT,
    "and lands on the current version, not stuck partway", w.__store["the-broken-empires.worldSchemaVersion"]);
  check(party.every((a) => a.updates.length === 0), "no actor received a write it didn't need");
}

/* ===================================================================
 * Fixture B: a 0.22.0-boundary world. One actor a GM hand-patched with the
 * legacy flag as a workaround before the real fix shipped (the step's own
 * doc comment: "A world that DID acquire the flag by hand is honoured").
 * One actor where the GM instead set the real field directly, and the stale
 * flag disagrees with it -- the real value must win.
 * =================================================================== */
console.log("\nB. A 0.22.0-boundary world: the hand-patched flag is honoured, a real value is not");
{
  const handPatched = mkActor("Wren", { tbe: { toughness: 3 } }, { toughness: 0 });
  const gmSetReal = mkActor("Pike", { tbe: { toughness: 1 } }, { toughness: 4 });
  const untouched = mkActor("Sable", {}, { toughness: 0 });
  const w = mkWorld({ version: "0.21.5", actors: [handPatched, gmSetReal, untouched] });
  await withWorld(w, () => MIGMOD.migrateAll());
  check(handPatched.system.toughness === 3, "the hand-patched flag reaches the real field", handPatched.system.toughness);
  check(gmSetReal.system.toughness === 4, "a real sheet value beats a disagreeing stale flag", gmSetReal.system.toughness);
  check(untouched.updates.length === 0, "an actor with neither is left alone");
}

/* ===================================================================
 * Fixture C: a 0.27.0 world -- Divine Magic actors. Piety already exists as
 * a skill Item (as it has since v0.15.0); nothing here is a schema-shape
 * change, so nothing should need migrating.
 * =================================================================== */
console.log("\nC. A 0.27.0 world (Divine Magic actors, nothing schema-relevant added)");
{
  const godbound = mkActor("Sister Rowan", {}, { toughness: 2 });
  godbound.items = [{ name: "Piety", type: "skill", system: { value: 30, group: "Adventuring" } }];
  const w = mkWorld({ version: "0.27.0", actors: [godbound] });
  const r = await withWorld(w, () => MIGMOD.migrateAll());
  check(r.touched === 0, "a Godbound actor needs no migration", r.touched);
  check(r.committed === true, "and the version still advances");
}

/* ===================================================================
 * Fixture D: a 0.28.0 world with a real, live campaign clock -- the last
 * pre-migration-layer release, exactly where TBE: Clocks existed but the
 * migration layer (and its v0.29.0 bug) did not yet. Mixed open/done/failed
 * clocks, the same shape TBE: Clocks itself writes.
 * =================================================================== */
console.log("\nD. A 0.28.0 world with an in-progress campaign clock");
{
  const j = mkJournal("Session 4 Notes", { tbe: { clocks: [
    { name: "The Watch Grows Suspicious", have: 2, need: 6 },
    { name: "Escape the City", have: 6, need: 6, done: true },
    { name: "Raise the Militia", have: 1, need: 8, failed: true }
  ] } }, { id: "j-s4" });
  const party = ["Eira", "Bram"].map((n) => mkActor(n, {}, { toughness: 0 }));
  const w = mkWorld({ version: "0.28.0", actors: party, journal: [j] });
  const r = await withWorld(w, () => MIGMOD.migrateAll());
  check(r.clocks.length === 1, "only the genuinely open clock is stranded, done/failed excluded", r.clocks.map((c) => c.name));
  check(r.clocks[0].name === "The Watch Grows Suspicious" && r.clocks[0].have === 2 && r.clocks[0].need === 6,
    "and it is reported with the real values a GM would recognise");
  check(r.committed === false, "the version is held while a real clock is stranded");
  check(party.every((a) => a.updates.length === 0), "the unrelated actors in the same world are untouched");
  const html = MIGMOD.reportToHtml(r);
  check(/The Watch Grows Suspicious/.test(html) && /TBE: Clocks/.test(html),
    "the chat report names the actual clock and the macro that owns converting it");
}

/* ===================================================================
 * Fixture E: the real scenario -- a GM who skipped every intermediate
 * release and is upgrading a single 0.21.0-era world straight to current in
 * one jump, actors AND a live clock together. Confirms one fixture's data
 * cannot leak into another's outcome within the same pass.
 * =================================================================== */
console.log("\nE. One real GM's world: everything above, together, in a single pass");
{
  const handPatched = mkActor("Wren", { tbe: { toughness: 3 } }, { toughness: 0 });
  const ordinary = mkActor("Eira", {}, { toughness: 0 });
  const j = { name: "Campaign Clocks", id: "j-camp", flags: { tbe: { clocks: [
    { name: "The Duke's Patience", have: 4, need: 6 }
  ] } } };
  const w = mkWorld({ version: "0.20.0", actors: [handPatched, ordinary], journal: [j] });
  const r = await withWorld(w, () => MIGMOD.migrateAll());
  check(handPatched.system.toughness === 3, "the toughness recovery still fires alongside a stranded clock", handPatched.system.toughness);
  check(r.clocks.length === 1 && r.clocks[0].name === "The Duke's Patience", "the clock is still found");
  check(r.committed === false, "held for the clock even though the toughness stage succeeded cleanly",
    { failed: r.failed.length, clocks: r.clocks.length });
  check(w.__store["the-broken-empires.worldSchemaVersion"] === "0.20.0",
    "the world stays recorded at its old version until the GM runs TBE: Clocks and reloads");
}

/* ===================================================================
 * Fixture G: a 0.32.0 world that was actually PLAYED IN. The GM opened each
 * enemy's sheet on the battle map and saved it, sometimes several times, so
 * system.initiative arrived at the DataModel as an array and was stored
 * comma-joined. The sidebar copies are untouched, because nobody edits those.
 * This is reconstructed from a real session's probe output, not invented:
 * the strings below are the ones that world was carrying.
 * =================================================================== */
console.log("\nG. A played 0.32.0 world: creature Initiative repaired where it actually broke");
{
  const sidebarElspeth = mkActor("Elspeth Dunmore", {}, { initiative: "14" }, "creature");
  const tokElspeth = mkActor("Elspeth Dunmore", {}, { initiative: "14,14,NaN,NaN,NaN,NaN,NaN,NaN,NaN,NaN,NaN,NaN,NaN,NaN" }, "creature");
  const tokMorrk = mkActor("Morrk", {}, { initiative: "14,14,NaN,NaN,NaN,NaN,NaN,NaN" }, "creature");
  const tokRenn = mkActor("Renn Kestral", {}, { initiative: "12,12" }, "creature");
  const tokArmand = mkActor("Armand Alarcon", {}, { initiative: "," }, "creature");
  const tokRann = mkActor("Rann", {}, { initiative: 9 }, "character");
  const scene = mkScene("The ambush", [tokElspeth, tokMorrk, tokRenn, tokArmand, tokRann].map(mkToken));

  const w = mkWorld({ version: "0.32.0", actors: [sidebarElspeth], scenes: [scene] });
  const r = await withWorld(w, () => MIGMOD.migrateAll());

  check(tokElspeth.system.initiative === "14", "the fabled warrior gets her 14 back", tokElspeth.system.initiative);
  check(tokMorrk.system.initiative === "14", "and Morrk his", tokMorrk.system.initiative);
  check(tokRenn.system.initiative === "12", "a single-save corruption repairs too", tokRenn.system.initiative);
  check(tokArmand.system.initiative === "", "a blank saved twice goes back to blank, not to a guess", tokArmand.system.initiative);
  check(tokRann.updates.length === 0, "a character's NumberField Initiative is never touched", tokRann.updates);
  check(sidebarElspeth.updates.length === 0, "an already-clean sidebar actor is left alone", sidebarElspeth.updates);
  check(r.committed === true, "with nothing stranded, the world advances", { failed: r.failed, clocks: r.clocks });

  /* Idempotence is a claim about the second run, so run it. */
  const before = tokElspeth.updates.length;
  const w2 = mkWorld({ version: "0.32.0", actors: [sidebarElspeth], scenes: [scene] });
  await withWorld(w2, () => MIGMOD.migrateAll());
  check(tokElspeth.updates.length === before, "a second pass writes nothing: repair is idempotent",
    tokElspeth.updates.length - before);
}

/* ===================================================================
 * Fixture H: the same world, but the migration walks game.actors only --
 * the shape this step nearly shipped as. Everything that fought stays
 * broken and the report says "nothing needed changing".
 * =================================================================== */
console.log("\nH. Mutation: a sidebar-only sweep reports a clean world while every enemy on the map is broken");
{
  const MIGSRC0 = read(`${SYS}/module/migration/migration.mjs`);
  const sidebarOnly = MIGSRC0.replace('collection: "tokens",', 'collection: "actors",');
  check(sidebarOnly !== MIGSRC0, "the mutation actually changed the source");
  fs.writeFileSync("/tmp/tbe_sidebar_only_migration.mjs", sidebarOnly);
  const SIDEBAR = await import("file:///tmp/tbe_sidebar_only_migration.mjs");
  const tok = mkActor("Elspeth Dunmore", {}, { initiative: "14,14,NaN" }, "creature");
  const scene = mkScene("The ambush", [mkToken(tok)]);
  const w = mkWorld({ version: "0.32.0", actors: [], scenes: [scene] });
  const r = await withWorld(w, () => SIDEBAR.migrateAll());
  check(tok.system.initiative === "14,14,NaN",
    "CONFIRMED: the token actor that fought is left corrupted", tok.system.initiative);
  check(r.touched === 0 && r.committed === true,
    "...and the world is stamped migrated with a clean bill of health, which is the worst outcome available",
    { touched: r.touched, committed: r.committed });
}

/* ===================================================================
 * Fixture I: SEB'S ACTUAL WORLD, and the upgrade he is actually about to do.
 *
 * He confirmed on 2026-09-17: "None past .29". So his world sits at 0.29.x --
 * the migration layer exists and has run -- and he is about to jump straight to
 * current, skipping 0.30 through 0.35. Every other fixture here tests a path
 * nobody is standing on; this one tests the path a real person will take
 * tonight, with the data his own session probe actually reported.
 *
 * Two things are being asserted, and the second is the one that matters:
 *   1. The 0.33.0 Initiative repair is still DUE from 0.29.0 (it is newer, so
 *      it should be), and fires on the token actors where the corruption lives.
 *   2. A stranded clock -- which a world that has been PLAYED in is likely to
 *      have -- blocks the version commit but must NOT block the repair. If it
 *      did, his enemies would keep rolling Initiative 0 and the only signal
 *      would be a chat notice about clocks. That is a SEQUENTIAL property
 *      (CLAUDE.md rule 9): it is about the ORDER of runSteps vs the clock scan
 *      vs the commit, and reading any one of those three shows nothing wrong.
 * =================================================================== */
console.log("\nI. Seb's world: 0.29.x -> current, in one jump, with a clock still open");
{
  const tokElspeth = mkActor("Elspeth Dunmore", {}, { initiative: "14,14,NaN,NaN,NaN,NaN,NaN,NaN,NaN,NaN,NaN,NaN,NaN,NaN" }, "creature");
  const tokMorrk = mkActor("Morrk", {}, { initiative: "14,14,NaN,NaN,NaN,NaN,NaN,NaN" }, "creature");
  const tokRenn = mkActor("Renn Kestral", {}, { initiative: "12,12" }, "creature");
  const tokArmand = mkActor("Armand Alarcon", {}, { initiative: "," }, "creature");
  const rann = mkActor("Rann", {}, { initiative: 9 }, "character");
  const scene = mkScene("The ambush", [tokElspeth, tokMorrk, tokRenn, tokArmand, rann].map(mkToken));

  /* A world that has been played in tends to have one of these. */
  const j = mkJournal("Campaign Clocks", { tbe: { clocks: [
    { name: "The Salt-Run", have: 2, need: 6 }
  ] } }, { id: "j-seb" });

  const w = mkWorld({ version: "0.29.0", actors: [], scenes: [scene], journal: [j] });
  const due = await withWorld(w, () => MIGMOD.stepsDue("0.29.0"));

  check(due.map((x) => x.version).join(",") === "0.33.0,0.39.0,0.39.0",
    "from 0.29.0 the Initiative repair and both halves of the flag move are due -- 0.22.0 is already behind him",
    due.map((x) => x.version));

  const r = await withWorld(w, () => MIGMOD.migrateAll());

  check(tokElspeth.system.initiative === "14", "Elspeth is repaired on the jump", tokElspeth.system.initiative);
  check(tokMorrk.system.initiative === "14", "so is Morrk", tokMorrk.system.initiative);
  check(tokRenn.system.initiative === "12", "so is Renn Kestral", tokRenn.system.initiative);
  check(tokArmand.system.initiative === "", "and Armand's blank goes back to blank", tokArmand.system.initiative);
  check(rann.updates.length === 0, "the player character is untouched", rann.updates);

  /* THE ONE THAT MATTERS. */
  /* Five, not four: the four creatures plus his Campaign Clocks journal, whose
     clocks move out of the legacy namespace in the same pass. Worth stating
     rather than loosening the number -- this fixture is the closest thing the
     suite has to Seb's real world, so what it touches is what his upgrade
     touches. */
  check(r.touched === 5, "the four corrupted creatures AND the clocks journal are handled in the one pass", r.touched);
  check(j.flags["the-broken-empires"].clocks.length === 1 && j.flags.tbe?.clocks === undefined,
    "his clocks moved to the valid namespace and the legacy copy is gone",
    { moved: j.flags["the-broken-empires"]?.clocks, legacy: j.flags.tbe });
  check(r.clocks.length === 1, "the open clock is still found and reported", r.clocks);
  check(r.committed === false, "the version is held back because of the clock");
  check(r.blockedBy === "stranded clocks", "...and says which of the two reasons held it", r.blockedBy);
  check(tokElspeth.system.initiative === "14",
    "CONFIRMED: the clock blocking the COMMIT did not block the REPAIR -- the enemies are fixed either way");

  /* And running again, as the next load will, must not undo or double it. */
  const before = tokElspeth.updates.length;
  const w2 = mkWorld({ version: "0.29.0", actors: [], scenes: [scene], journal: [j] });
  const r2 = await withWorld(w2, () => MIGMOD.migrateAll());
  check(tokElspeth.updates.length === before,
    "the next world load writes nothing further: already-clean values are left alone", tokElspeth.updates.length - before);
  check(r2.clocks.length === 1, "and still nags about the clock until TBE: Clocks is run");
}

/* ===================================================================
 * Fixture J: the OTHER half of Seb's upgrade, and the one the migration
 * cannot fix. Upgrading the system updates the tbe-macros COMPENDIUM; it does
 * not touch copies already sitting in a world's macro directory. His probe
 * reported nine TBE: Character Wizard, five TBE: Attack and five TBE: Finish
 * Character, because re-importing adds rather than replaces -- so after the
 * upgrade he would still be clicking frozen old builds while the system
 * underneath them was current, with nothing anywhere saying so.
 *
 * Detect and report only, like the clocks. A differing command may simply be a
 * GM's own edit, and deleting it would be the damage rule 6 forbids.
 * =================================================================== */
console.log("\nJ. Macros in the world are not updated by a system upgrade");
{
  const shipped = { "TBE: Attack": "NEW-ATTACK", "TBE: Character Wizard": "NEW-WIZARD", "TBE: Cast": "NEW-CAST" };
  const mkMacro = (name, command) => ({ name, command });
  const packStub = {
    getDocuments: async () => Object.entries(shipped).map(([name, command]) => mkMacro(name, command))
  };

  const worldWith = (macros) => ({
    packs: { get: (id) => (id === "the-broken-empires.tbe-macros" ? packStub : null) },
    macros: col(macros)
  });

  /* Seb's shape: many copies, all stale. */
  const sebs = worldWith([
    ...Array.from({ length: 9 }, () => mkMacro("TBE: Character Wizard", "OLD-WIZARD")),
    ...Array.from({ length: 5 }, () => mkMacro("TBE: Attack", "OLD-ATTACK")),
    mkMacro("TBE: Cast", "NEW-CAST"),
    mkMacro("My Own Thing", "whatever")
  ]);
  const found = await withWorld(sebs, () => MIGMOD.findStaleMacros());

  check(found.checked === true, "the compendium was readable, so the scan means something");
  check(found.scanned === 15, "counted only OUR macros, ignoring the GM's own", found.scanned);
  const wiz = found.duplicates.find((d) => d.name === "TBE: Character Wizard");
  check(wiz?.count === 9, "nine copies of the Character Wizard are reported as duplicates", found.duplicates);
  const atk = found.differing.find((d) => d.name === "TBE: Attack");
  check(atk?.behind === 5 && atk?.total === 5, "all five Attack copies differ from what ships", found.differing);
  check(!found.differing.some((d) => d.name === "TBE: Cast"),
    "an up-to-date copy is not reported as stale", found.differing);
  check(!found.duplicates.some((d) => d.name === "My Own Thing"),
    "and a macro that is not ours is left entirely alone");

  const html = MIGMOD.staleMacrosToHtml(found);
  check(/not updated by a system upgrade/.test(html), "the notice explains the actual mechanism");
  check(/TBE Tools/.test(html), "and names the compendium to re-import from");
  check(/you edited it yourself/.test(html),
    "and admits it cannot tell a stale copy from one the GM customised");

  /* A clean world must say nothing at all rather than nagging. */
  const clean = worldWith([mkMacro("TBE: Cast", "NEW-CAST")]);
  const none = await withWorld(clean, () => MIGMOD.findStaleMacros());
  check(MIGMOD.staleMacrosToHtml(none) === null, "a world with current macros gets no notice");

  /* No compendium (a broken or partial install) must degrade quietly, not throw
     and take the whole ready hook down with it. */
  const noPack = { packs: { get: () => null }, macros: col([]) };
  const missing = await withWorld(noPack, () => MIGMOD.findStaleMacros());
  check(missing.checked === false && MIGMOD.staleMacrosToHtml(missing) === null,
    "no compendium means no claim, rather than a false all-clear or a thrown error");

  /* It must never write. This is the whole promise. */
  const writes = [];
  const spy = worldWith([Object.assign(mkMacro("TBE: Attack", "OLD-ATTACK"),
    { update: async () => writes.push("update"), delete: async () => writes.push("delete") })]);
  await withWorld(spy, () => MIGMOD.findStaleMacros());
  check(writes.length === 0, "the scan wrote nothing and deleted nothing", writes);
}

/* ===================================================================
 * Mutation guard: the step's own "never overwrite a real value" check
 * removed -- the exact class of bug design rule #1 in migration.mjs's own
 * header exists to prevent ("NEVER destroy data you cannot reconstruct").
 * Confirms fixture B would have caught it.
 * =================================================================== */
console.log("\nF. Mutation guard: a step that forgets not to overwrite a real value is caught");
const MIGSRC = read(`${SYS}/module/migration/migration.mjs`);
const mutated = MIGSRC.replace(
  "if (num(actor.system?.toughness, 0) !== 0) return null;",
  "/* mutated: guard removed */"
);
check(mutated !== MIGSRC, "the mutation actually changed the source");
fs.writeFileSync("/tmp/tbe_mutated_migration.mjs", mutated);
const BROKEN = await import("file:///tmp/tbe_mutated_migration.mjs");
{
  const gmSetReal = mkActor("Pike", { tbe: { toughness: 1 } }, { toughness: 4 });
  const w = mkWorld({ version: "0.21.5", actors: [gmSetReal] });
  await withWorld(w, () => BROKEN.migrateAll());
  check(gmSetReal.system.toughness !== 4,
    "confirms the mutated build DOES overwrite a real value fixture B's own assertion would have caught",
    gmSetReal.system.toughness);
}

console.error = quietErr;
/* ===================================================================
 * Fixture K: the flag namespace move (0.39.0), on an actor.
 *
 * The system id is "the-broken-empires". Foundry accepts "core", "world", the
 * system id and installed module ids as flag scopes and throws on anything
 * else, so `flags.tbe.*` was never a namespace this system could legally use
 * via setFlag/getFlag -- and it used both spellings for its whole life,
 * because a direct `update({"flags.tbe.x": v})` does not validate.
 *
 * What makes this a migration rather than a rename is that the data is live:
 * a played world has Weave scars and funnel townsfolk sitting under the old
 * path, and nothing will ever re-create them.
 * =================================================================== */
console.log("\nK. The 0.39.0 flag move: owned keys move, foreign keys are left alone");
{
  const scarred = mkActor("Elspeth", { tbe: { weave: { scars: [{ bind: "Fire", amount: 2 }], snag: true } } });
  const townsfolk = mkActor("Wren", { tbe: { funnel: { town: "Saltmarsh", status: "alive" } } });
  const clean = mkActor("Bram", { "the-broken-empires": { chargenLedger: { xp: 5 } } });
  const w = mkWorld({ version: "0.38.0", actors: [scarred, townsfolk, clean] });
  await withWorld(w, () => MIGMOD.migrateAll());

  check(scarred.flags["the-broken-empires"].weave.scars[0].bind === "Fire",
    "a Weave scar moves across with its value intact", scarred.flags["the-broken-empires"].weave);
  check(scarred.flags.tbe?.weave === undefined,
    "and the legacy copy is DELETED, not merely duplicated -- leaving it is how the split comes back",
    scarred.flags.tbe);
  check(townsfolk.flags["the-broken-empires"].funnel.status === "alive",
    "a funnel townsfolk moves too", townsfolk.flags["the-broken-empires"].funnel);
  check(clean.updates.length === 0,
    "an actor already on the current namespace is not touched at all", clean.updates);
}

/* ===================================================================
 * Fixture L: the key that must NOT move, and why the step names its keys.
 *
 * The Salt-Run Ambush adventure keeps its live tracker in
 * `flags.tbe.saltRunAmbush`. It ships as its own installer, a system upgrade
 * does not touch it, and the copy in a GM's world cannot be updated by us. A
 * whole-namespace sweep -- the obvious implementation -- would move that state
 * out from under a running adventure whose code still reads the old path.
 *
 * So the step moves a NAMED LIST (TBE.OWNED_FLAGS) and leaves everything else
 * exactly where it found it. This fixture is the reason that list exists.
 * =================================================================== */
console.log("\nL. A key this system does not own is left where the adventure put it");
{
  const both = mkActor("Renn", { tbe: {
    weave: { scars: [], snag: false },
    saltRunAmbush: { talkedDown: true },
    somebodyElsesModule: { keep: "me" }
  } });
  const j = mkJournal("The Salt-Run Ambush", { tbe: {
    clocks: [{ name: "The caravan escapes", have: 1, need: 4 }],
    saltRunAmbush: { hazard: "Obscured", beat: 3 }
  } });
  const w = mkWorld({ version: "0.38.0", actors: [both], journal: [j] });
  await withWorld(w, () => MIGMOD.migrateAll());

  check(both.flags.tbe.saltRunAmbush.talkedDown === true,
    "the adventure's own actor flag is untouched", both.flags.tbe.saltRunAmbush);
  check(both.flags.tbe.somebodyElsesModule.keep === "me",
    "so is a flag belonging to something we have never heard of", both.flags.tbe.somebodyElsesModule);
  check(both.flags["the-broken-empires"].weave !== undefined && both.flags.tbe.weave === undefined,
    "while the key we DO own moved out from beside it");
  check(j.flags.tbe.saltRunAmbush.hazard === "Obscured",
    "the adventure's journal tracker survives the journal sweep too", j.flags.tbe.saltRunAmbush);
  check(j.flags["the-broken-empires"].clocks.length === 1 && j.flags.tbe.clocks === undefined,
    "and the clocks beside it still moved");
}

/* ===================================================================
 * Fixture M: idempotence and conflict, the two ways a move goes wrong twice.
 * =================================================================== */
console.log("\nM. Running the move twice is indistinguishable from running it once");
{
  const a = mkActor("Elspeth", { tbe: { weave: { scars: [{ bind: "Fire", amount: 2 }] } } });
  const w1 = mkWorld({ version: "0.38.0", actors: [a] });
  await withWorld(w1, () => MIGMOD.migrateAll());
  const after = a.updates.length;

  const w2 = mkWorld({ version: "0.38.0", actors: [a] });
  await withWorld(w2, () => MIGMOD.migrateAll());
  check(a.updates.length === after, "the second pass writes nothing", a.updates.length - after);
  check(a.flags["the-broken-empires"].weave.scars.length === 1,
    "and the value is still there, once", a.flags["the-broken-empires"].weave);

  /* A half-finished earlier run is the only way to hold both. The current
     namespace is what today's code reads and writes, so it wins. */
  const split = mkActor("Pike", {
    tbe: { weave: { scars: ["stale"] } },
    "the-broken-empires": { weave: { scars: ["current"] } }
  });
  const w3 = mkWorld({ version: "0.38.0", actors: [split] });
  await withWorld(w3, () => MIGMOD.migrateAll());
  check(split.flags["the-broken-empires"].weave.scars[0] === "current",
    "on a conflict the current namespace wins", split.flags["the-broken-empires"].weave);
  check(split.flags.tbe?.weave === undefined,
    "and the stale legacy copy is dropped rather than left to be found later");
}

/* ===================================================================
 * Fixture N: mutation -- the whole-namespace sweep that would have been
 * written if nobody had looked for foreign keys.
 * =================================================================== */
console.log("\nN. Mutation: a whole-namespace sweep breaks the running adventure");
{
  const naive = (doc) => {
    const legacy = doc.flags?.tbe;
    if (!legacy) return null;
    return { "flags.the-broken-empires": { ...legacy }, "flags.-=tbe": null };
  };
  const victim = { flags: { tbe: { weave: {}, saltRunAmbush: { hazard: "Rough" } } } };
  const u = naive(victim);
  check(u["flags.-=tbe"] === null && u["flags.the-broken-empires"].saltRunAmbush !== undefined,
    "CONFIRMED: the obvious implementation moves the adventure's state too");
  const careful = MIGMOD.moveOwnedFlags(victim);
  check(careful["flags.tbe.-=weave"] === null && careful["flags.tbe.-=saltRunAmbush"] === undefined,
    "...and the shipped one touches only what it owns", Object.keys(careful));
}

/* ===================================================================
 * Fixture O: the owned-key list exists twice and must not drift.
 * =================================================================== */
console.log("\nO. The Node fallback list matches the system's own");
{
  const CFG = await import(`file://${process.cwd()}/${SYS}/module/helpers/config.mjs`);
  const MIGSRC = read(`${SYS}/module/migration/migration.mjs`);
  const fallback = /OWNED_FLAGS_FALLBACK = \[([^\]]+)\]/.exec(MIGSRC)?.[1] ?? "";
  const parsed = fallback.split(",").map((x) => x.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
  check(parsed.join(",") === CFG.TBE.OWNED_FLAGS.join(","),
    "migration.mjs's fallback list matches CONFIG.TBE.OWNED_FLAGS exactly",
    { fallback: parsed, owner: CFG.TBE.OWNED_FLAGS });
  check(CFG.TBE.FLAG_SCOPE === "the-broken-empires",
    "and the scope is the system id, which is the only one Foundry will accept from us");
  check(!CFG.TBE.OWNED_FLAGS.includes("saltRunAmbush") && !CFG.TBE.OWNED_FLAGS.includes("perRank"),
    "the adventure's key and the regenerated perRank are deliberately NOT owned",
    CFG.TBE.OWNED_FLAGS);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
