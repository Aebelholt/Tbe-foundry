/* TBE SOLO LIB — shared helpers, injected into every macro at build time. */

const TBE = {};

TBE.prompt = async function (title, content, okLabel = "Roll") {
  const DV2 = foundry.applications?.api?.DialogV2;
  if (DV2) {
    return DV2.prompt({
      window: { title },
      content,
      ok: { label: okLabel, callback: (ev, btn) => Object.fromEntries(new FormData(btn.form)) },
      rejectClose: false
    });
  }
  return new Promise((resolve) => {
    new Dialog({
      title,
      content,
      buttons: {
        ok: {
          label: okLabel,
          callback: (html) => {
            const el = html[0] ?? html;
            const data = {};
            /* An UNCHECKED checkbox still reports value "on", so reading
               every [name] blindly would submit the entire form as ticked.
               On the DialogV2 path above FormData already handles this; this
               legacy branch has to do it by hand. */
            el.querySelectorAll("[name]").forEach((i) => {
              if (i.type === "checkbox") { if (i.checked) data[i.name] = "on"; return; }
              if (i.type === "radio") { if (i.checked) data[i.name] = i.value; return; }
              data[i.name] = i.value;
            });
            resolve(data);
          }
        }
      },
      default: "ok",
      close: () => resolve(null)
    }).render(true);
  });
};

TBE.num = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

TBE.d100 = async function (role) {
  const roll = await new Roll("1d100").evaluate();
  if (role) TBE.tagDice(roll, role);
  return roll;
};

/* Colour a roll's dice by what the roll IS (attack, defence, wound) so a GM
 * running both sides of a fight can tell them apart in Dice So Nice. The ids
 * and the tagging rule are owned by the system (module/helpers/dice-roles.mjs)
 * and read here at runtime; without the system global nothing is tagged,
 * rather than guessing ids a second place could drift from. */
TBE.tagDice = function (roll, key) {
  const owner = (typeof game !== "undefined" && game?.thebrokenempires?.rules?.diceRoles) || null;
  if (!owner || !roll) return 0;
  const id = owner.ROLE[key];
  if (!id) return 0;
  return owner.tagRoll(roll, id, game.dice3d);
};

/* Display "00" for 100, zero-pad 1-9. */
TBE.face = (r) => (r === 100 ? "00" : String(r).padStart(2, "0"));

TBE.isDoubles = (r) => r === 100 || (r < 100 && r % 11 === 0);

/*
 * Core TBE resolution for one d100 roll against a modified skill value.
 * Returns { roll, skill, success, crit, critFail, sl, tens, note }
 */
/*
 * expertise is the skill's Expertise level (0, or 2/3/4 for Ex2/Ex3/Ex4, Ch.4
 * p.54 & Ch.8 p.123): on a successful roll it guarantees at least that many
 * SLs, applied as a floor after the tens-die, critical, and skill-over-100
 * SLs are all totalled -- it never reduces a roll that already did better.
 */
TBE.resolve = function (r, skill, expertise = 0) {
  /* One owner: module/rules/resolution.mjs, reached through the global the
   * system sets at init. The body below is the fallback for the Node test
   * harness, where `game` does not exist. resolution_check.mjs runs both over
   * every roll 1-100 and asserts they never disagree, so this copy cannot
   * drift away from the owner the way five earlier duplicates did. */
  if (typeof game !== "undefined" && game?.thebrokenempires?.rules?.resolve) {
    return game.thebrokenempires.rules.resolve(r, skill, expertise);
  }
  const s = TBE.num(skill, 0);
  const alwaysFail = r >= 99;
  const doubles = TBE.isDoubles(r);
  let success;
  if (alwaysFail) success = false;
  else if (s <= 0) success = r <= 5;
  else if (r <= 5) success = true;
  else success = r <= s;

  let crit = false;
  let critFail = false;
  if (success) {
    if (s <= 0) crit = r === 5;
    else crit = doubles || r === s;
  } else if (s < 100) {
    critFail = doubles && r > s;
  }

  const tens = Math.floor((r % 100) / 10);
  let sl = 0;
  const notes = [];
  if (success) {
    sl = Math.max(1, tens);
    if (crit) {
      sl += 3;
      notes.push("critical success (+3 SL)");
    }
    if (s > 100) {
      const bonus = Math.max(1, Math.floor(((s - 100) % 100) / 10));
      sl += bonus;
      notes.push("skill over 100 (+" + bonus + " SL)");
    }
    if (r <= 5 && r > s) notes.push("01-05 always succeeds");
    const ex = TBE.num(expertise, 0);
    if (ex >= 2 && sl < ex) {
      sl = ex;
      notes.push("Expertise Ex" + ex + " guarantees " + ex + " SL");
    }
  } else {
    if (alwaysFail) notes.push("99-00 always fails");
    if (critFail) notes.push("critical failure");
  }
  return { roll: r, skill: s, success, crit, critFail, sl, tens, notes };
};

TBE.tag = function (res) {
  if (res.success) return res.crit ? "CRITICAL SUCCESS" : "SUCCESS";
  return res.critFail ? "CRITICAL FAILURE" : "FAILURE";
};

TBE.colour = function (res) {
  if (res.success) return res.crit ? "#1f7a1f" : "#2f6f2f";
  return res.critFail ? "#8b1a1a" : "#6b2b2b";
};

/* ---------------------------------------------------------------------------
 * {expression|fallback} inline substitution -- prototype. See
 * docs/prior-art-draw-steel.md #1: the pattern is Draw Steel Codex's
 * GoblinScript inline substitution, worth taking without taking the language
 * it lives in. The idea: the prose that describes a number and the code that
 * computes it become the SAME string, so they cannot quietly describe two
 * different things -- which is the exact shape of every drift bug this
 * project has shipped (career points reported as spent while discarded, a
 * size note still naming three maneuvers after a fourth was blocked, a
 * status naming a roll that was never offered).
 *
 * No expression language, no eval. Resolution is two things only:
 *   - a dot-path into the actor's own getRollData(), the same object a real
 *     roll formula's @references already read (see #3 in the doc: one
 *     contract, not a second one that can fall out of sync with it);
 *   - a short, explicit whitelist of zero-argument TBE.* helpers
 *     (TBE.RESOLVE_HELPERS) for values getRollData() doesn't carry.
 * An unresolved path WITH a fallback prints the fallback -- the "no actor in
 * context" / compendium-prose case GoblinScript's own inline substitution is
 * for. An unresolved path with NO fallback prints the raw {expression}
 * untouched, on purpose: a silently blank card is a defect nobody would
 * notice, a stray brace in a chat card is a bug report from whoever reads it
 * first. */
TBE.RESOLVE_HELPERS = {
  armorInitPenalty: (a) => TBE.armorInit(a).penalty,
  totalWp: (a) => TBE.totalWp(a?.system?.wounds || {})
};

TBE.resolvePath = function (data, path) {
  return path.split(".").reduce((v, k) => (v === null || v === undefined ? undefined : v[k]), data);
};

TBE.resolveText = function (actor, text) {
  if (typeof text !== "string" || text.indexOf("{") === -1) return text;
  const data = actor?.getRollData ? actor.getRollData() : null;
  return text.replace(/\{([^{}|]+)(?:\|([^{}]*))?\}/g, (whole, exprRaw, fallback) => {
    const expr = exprRaw.trim();
    let val;
    if (data) {
      val = Object.prototype.hasOwnProperty.call(TBE.RESOLVE_HELPERS, expr)
        ? (() => { try { return TBE.RESOLVE_HELPERS[expr](actor); } catch (eResolve) { return undefined; } })()
        : TBE.resolvePath(data, expr);
    }
    if (val === undefined || val === null || val === "") return fallback !== undefined ? fallback : whole;
    return String(val);
  });
};

/* actor is optional and defaults to no resolution, so every existing call
 * site (hundreds of them, title+body only) is unaffected -- this only runs
 * for a card that opts in by passing the actor it's about. */
TBE.card = function (title, bodyHtml, actor) {
  const t = actor ? TBE.resolveText(actor, title) : title;
  const b = actor ? TBE.resolveText(actor, bodyHtml) : bodyHtml;
  return (
    '<div class="tbe-card" style="border:1px solid #7a6a4f;border-radius:6px;padding:6px 8px;background:rgba(120,100,60,0.08)">' +
    '<div style="font-weight:bold;letter-spacing:.5px;border-bottom:1px solid #7a6a4f;margin-bottom:4px">' +
    t +
    "</div>" +
    b +
    "</div>"
  );
};

/* Post a card. `opts.mode` forces a roll mode for cards the BOOK makes secret
 * (see TBE.MODES); omit it and the card follows whatever the user has selected
 * in the chat roll-mode dropdown, which is what a GM reaches for by reflex.
 *
 * Until v0.34.0 this posted all 59 of the pack's cards publicly with no way to
 * whisper, which was invisible while this was a solo system and a real defect
 * the moment a GM ran it for players. The rule ("who can see this") is owned by
 * module/rules/visibility.mjs and read at runtime off the global, the same
 * deferral pattern TBE.resolve, rankCap, strandCap, sizeEffects and encumbrance
 * already use. The body below is only the fallback for a Node harness or the
 * legacy standalone pack, where that global does not exist. */
TBE.MODES = { PUBLIC: "publicroll", PRIVATE: "gmroll", BLIND: "blindroll", SELF: "selfroll" };

/* Which weapons spend ammunition, p.156: "Shooting a ranged weapon that uses
 * ammunition requires the roll of an Ammo Supply Die after your action."
 * Bows, crossbows and slings. A throwable weapon (dagger, hand axe, spear,
 * javelin, throwing knives) is flagged `ranged` because it CAN be thrown, and
 * that flag used to be read as "shoots": every melee stab with a spear rolled
 * the Ammo die (the stray d8 on the attack card). */
TBE.AMMO_WEAPON = /(^|[^a-z])(long|short)?bow(s)?\b|crossbow|(^|[^a-z])sling\b/i;
TBE.weaponUsesAmmo = (w) => TBE.AMMO_WEAPON.test(String(w?.name ?? "")) || TBE.AMMO_WEAPON.test(String(w?.system?.skillName ?? w?.skillName ?? "").replace(/^missile$/i, ""));
/* Can be thrown, but is not a missile weapon: whether THIS attack is a throw
 * is the attacker's choice, asked on the attack dialog. */
TBE.weaponThrowable = (w) => !TBE.weaponUsesAmmo(w) && !!(w?.system?.ranged ?? w?.ranged);

/* Wait for Dice So Nice to finish animating a posted message's dice, so a
 * follow-up dialog (TBE: Attack's maneuvers) opens after the roll is seen
 * rather than on top of it. Without Dice So Nice there is no animation and
 * this returns at once. Capped, so a stalled animation can never leave the
 * attacker without their dialog. */
TBE.DICE_WAIT_CAP_MS = 15000;
TBE.waitForDice = async function (msg) {
  const d3 = (typeof game !== "undefined" && game) ? game.dice3d : null;
  if (!msg || !msg.id || !d3 || typeof d3.waitFor3DAnimationByMessageID !== "function") return false;
  try {
    await Promise.race([
      d3.waitFor3DAnimationByMessageID(msg.id),
      new Promise((r) => setTimeout(r, TBE.DICE_WAIT_CAP_MS))
    ]);
    return true;
  } catch (e) { return false; }
};

/* Zone Hazards (Ch.10 pp.151-152) are owned by the system
 * (module/rules/zones.mjs). Null without it: no hazard is ever guessed. */
TBE.zones = function () {
  return (typeof game !== "undefined" && game?.thebrokenempires?.rules?.zones) || null;
};

/* What the zones mean for an attack between two tokens on the current scene,
 * or null when there is no owner, no scene, or no token to place. */
TBE.attackHazards = function (attackerToken, targetToken) {
  const Z = TBE.zones();
  const scene = (typeof canvas !== "undefined" && canvas) ? canvas.scene : null;
  if (!Z || !scene || !attackerToken || !targetToken) return null;
  const regions = Array.from(scene.regions ?? []);
  if (!regions.length) return null;
  const pt = (t) => {
    const c = t.center ?? { x: (t.document?.x ?? t.x ?? 0), y: (t.document?.y ?? t.y ?? 0) };
    return { x: c.x, y: c.y, elevation: t.document?.elevation ?? t.elevation ?? 0 };
  };
  return Z.attackHazards({
    regions, inside: Z.insideRegion,
    attacker: pt(attackerToken), target: pt(targetToken),
    attackerName: attackerToken.name ?? attackerToken.actor?.name, targetName: targetToken.name ?? targetToken.actor?.name
  });
};

TBE.say = async function (content, rolls = [], opts = {}) {
  const data = {
    speaker: ChatMessage.getSpeaker(),
    content,
    rolls,
    sound: rolls.length ? CONFIG.sounds.dice : null
  };

  const owner = (typeof game !== "undefined" && game?.thebrokenempires?.rules?.visibility) || null;
  if (owner) {
    owner.prepare(data, {
      mode: opts.mode,
      settingsGet: (ns, key) => game.settings.get(ns, key),
      /* Hand the owner the ChatMessage we are actually posting through rather
         than letting it reach for an ambient global. It is a rule module, not
         a Foundry script: the one place that knows which ChatMessage is in
         play is the caller. Found by visibility_check.mjs section 5, where the
         owner silently produced an empty GM list because the global it assumed
         was a local in the harness -- the same hidden-coupling shape as the
         getRollData() override that dropped its base contract (rule 8). */
      ChatMessageClass: ChatMessage,
      selfId: game?.user?.id
    });
    return ChatMessage.create(data);
  }

  /* Fallback. Deliberately covers the same four modes rather than posting
     publicly, because a fallback that quietly ignored a forced mode would
     reintroduce exactly the defect this replaced. */
  let mode = opts.mode;
  if (!mode) {
    try { mode = game.settings.get("core", "rollMode"); } catch (e) { mode = TBE.MODES.PUBLIC; }
  }
  if (typeof ChatMessage?.applyRollMode === "function") {
    ChatMessage.applyRollMode(data, mode || TBE.MODES.PUBLIC);
  } else {
    const gms = typeof ChatMessage?.getWhisperRecipients === "function"
      ? ChatMessage.getWhisperRecipients("GM").map((u) => u.id ?? u) : [];
    if (mode === TBE.MODES.PRIVATE) data.whisper = gms;
    else if (mode === TBE.MODES.BLIND) { data.whisper = gms; data.blind = true; }
    else if (mode === TBE.MODES.SELF) data.whisper = [game?.user?.id].filter(Boolean);
    else { data.whisper = []; data.blind = false; }
  }
  return ChatMessage.create(data);
};

/* Read text off a TableResult across v12 / v13+ schemas. */
TBE.resultText = function (r) {
  if (!r) return "";
  return r.text || r.description || r.name || "";
};

TBE.tableRows = function (name) {
  const spec = (TBE_DATA.tables || []).find((t) => t.name === name);
  return spec ? spec.rows : [];
};

/* Roll a table by name. Falls back to the data baked into this macro if the table is absent. */
TBE.drawTable = async function (name) {
  /* A RollTable document is drawn as it is (imported oracle tables are
     found by flag, not by name); a name is looked up, then falls back. */
  if (name && typeof name === "object" && typeof name.roll === "function") {
    const out = await name.roll();
    return { text: TBE.resultText(out.results?.[0]), total: out.roll?.total ?? null };
  }
  const t = game.tables.getName(name);
  if (t) {
    const out = await t.roll();
    return { text: TBE.resultText(out.results?.[0]), total: out.roll?.total ?? null };
  }
  const rows = TBE.tableRows(name);
  if (!rows.length) {
    ui.notifications?.warn("TBE: no data for '" + name + "'.");
    return null;
  }
  const roll = await new Roll("1d100").evaluate();
  const hit = rows.find((r) => roll.total >= r[0][0] && roll.total <= r[0][1]);
  return { text: hit ? hit[1] : "", total: roll.total };
};

/*
 * Create one roll table, trying every TableResult schema shape Foundry v11-v14 accepts.
 * Returns the table, or throws.
 */
TBE.createTable = async function (name, rows) {
  const existing = game.tables.getName(name);
  if (existing) return existing;
  const table = await RollTable.create({ name, formula: "1d100", replacement: true, displayRoll: true });
  const short = (s) => (s.length > 48 ? s.slice(0, 48) + "..." : s);
  const variants = [
    (r) => ({ range: r[0], weight: 1, type: "text", name: short(r[1]), description: r[1] }),
    (r) => ({ range: r[0], weight: 1, name: short(r[1]), description: r[1] }),
    (r) => ({ range: r[0], weight: 1, type: 0, text: r[1] }),
    (r) => ({ range: r[0], weight: 1, text: r[1] })
  ];
  for (const v of variants) {
    try {
      const made = await table.createEmbeddedDocuments("TableResult", rows.map(v));
      if (made && made.length) return table;
    } catch (err) {
      console.warn("TBE | result shape rejected for " + name + ":", err);
    }
  }
  console.error("TBE | could not populate table " + name);
  return table;
};

/* Create any TBE table that is missing. GM only. */
TBE.ensureTables = async function () {
  const out = { created: [], failed: [] };
  for (const spec of TBE_DATA.tables || []) {
    if (game.tables.getName(spec.name)) continue;
    if (!game.user.isGM) { out.failed.push(spec.name); continue; }
    try {
      await TBE.createTable(spec.name, spec.rows);
      out.created.push(spec.name);
    } catch (err) {
      console.error("TBE | table failed: " + spec.name, err);
      out.failed.push(spec.name);
    }
  }
  return out;
};

/* Which tables a Random Event rolls. The TBE tables, unless the GM imported
 * oracle tables and turned on "Random Events use imported oracle tables";
 * the system decides which imported ones (helpers/oracle-import.mjs), and any
 * slot it cannot fill falls back to the TBE table alone. */
TBE.EVENT_TABLES = { focus: "TBE: Random Events", w1: "TBE: Event Randomizers I", w2: "TBE: Event Randomizers II" };
TBE.eventTables = function () {
  let got = null;
  try { got = globalThis.game?.thebrokenempires?.oracle?.eventTables?.() ?? null; } catch (e) { got = null; }
  return {
    focus: got?.focus ?? TBE.EVENT_TABLES.focus,
    w1: got?.w1 ?? TBE.EVENT_TABLES.w1,
    w2: got?.w2 ?? TBE.EVENT_TABLES.w2
  };
};

/* The word pair alone (Subverted Scene's "More"). */
TBE.eventWords = async function () {
  const t = TBE.eventTables();
  const w1 = await TBE.drawTable(t.w1);
  const w2 = await TBE.drawTable(t.w2);
  return { w1: w1?.text || "?", w2: w2?.text || "?" };
};

/* Roll a full Random Event: focus + two randomizer words (+ Empires List when called for). */
TBE.event = async function () {
  const t = TBE.eventTables();
  const focus = await TBE.drawTable(t.focus);
  const w1 = await TBE.drawTable(t.w1);
  const w2 = await TBE.drawTable(t.w2);
  const f = (focus?.text || "").toUpperCase();
  let list = null;
  if (f.indexOf("LIST ELEMENT") > -1) list = await TBE.drawTable("TBE: Empires List");
  return {
    focus: focus?.text || "?",
    w1: w1?.text || "?",
    w2: w2?.text || "?",
    list: list ? list.text : null
  };
};

TBE.eventHtml = function (e) {
  return (
    '<div style="margin-top:4px;padding:4px;border:1px dashed #7a6a4f;border-radius:4px">' +
    '<div style="font-size:11px;letter-spacing:.5px;opacity:.8">RANDOM EVENT</div>' +
    "<div>" + e.focus + "</div>" +
    '<div style="font-size:16px;margin-top:2px"><b>' + e.w1 + " &middot; " + e.w2 + "</b></div>" +
    (e.list ? '<div style="font-size:12px;margin-top:2px">List element: <i>' + e.list + "</i></div>" : "") +
    "</div>"
  );
};

/* Skill list off the selected token / assigned actor, system-agnostic. */
/* Every skill this character can actually roll, with its value: the ones
 * written on the sheet, plus the whole catalogue at the book's untrained 20
 * (p.104). THE OWNER of that merge.
 *
 * It used to live inside `TBE.skillOptions`, which returns HTML, so the only
 * way to ask "what are this character's skills" was to build a <select> and
 * read it back. `TBE: Export Sheets` needed the same answer as DATA and for
 * an ARBITRARY actor rather than `TBE.me()`, and the first version of that
 * macro did the obvious wrong thing: it listed the skill Items and nothing
 * else, so a character who had written down two skills printed a sheet with
 * two skills on it. That is exactly the defect `skill_picker_check.mjs`
 * exists to stop, reproduced in a second file because the fix had never been
 * extracted from the picker that received it.
 *
 * `trained` marks which side an entry came from, so a caller that wants to
 * tell them apart (the picker's two optgroups) still can. */
TBE.allSkills = function (actor) {
  const own = TBE.actorSkills(actor);
  const ownNames = own.map((x) => x.name);
  const untrained = [];
  for (const group of Object.keys(TBE.SKILL_GROUPS)) {
    for (const name of TBE.SKILL_GROUPS[group]) {
      if (ownNames.indexOf(name) === -1) {
        untrained.push({ name, value: TBE.BASE_SKILL, expertise: 0, savvy: false, group, trained: false });
      }
    }
  }
  untrained.sort((a, b) => a.name.localeCompare(b.name));
  return own.map((x) => Object.assign({ trained: true }, x)).concat(untrained);
};

/* The skills actually written on the sheet. The actor is a parameter now:
 * it defaulted to TBE.me() and nothing else could be asked about, which is
 * why the exporter could not use it. */
TBE.actorSkills = function (actor) {
  actor = actor || TBE.me();
  const out = [];
  if (!actor) return out;
  for (const i of actor.items ?? []) {
    if (i.type !== "skill") continue;
    const v = TBE.num(i.system?.value, 0);
    out.push({ name: i.name, value: v, expertise: TBE.num(i.system?.expertise, 0), savvy: !!i.system?.savvy, group: i.system?.group || "" });
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
};

/* "(Ex2)"-style suffix, the one place this formatting is written so every
 * picker/list that shows a skill's Expertise agrees on when it's worth
 * printing (>=2, since Ex0/Ex1 don't exist -- p.53) and how. */
TBE.expertiseTag = (expertise) => (TBE.num(expertise, 0) >= 2 ? " Ex" + TBE.num(expertise, 0) : "");

/* A picker whose value, if set, overrides the typed skill number. Encodes
 * Expertise and Savvy alongside the value/name so every roll made from a
 * real skill Item (not a hand-typed number) carries them through to
 * TBE.resolve() without a second sheet lookup.
 *
 * The list is the WHOLE catalogue, not only what is on the sheet. Ch.7
 * p.104: a skill with no value "begins at 20". A sheet deliberately records
 * only the skills that differ from that (TBE.skillItemsFrom does not stamp
 * 37 Items onto an actor, and should not), so a picker built from the sheet
 * alone left every untrained skill rollable ONLY by knowing the rule and
 * typing 20 into the box by hand. The rule was real and invisible, which is
 * the opposite of the point. Untrained entries are grouped and labelled
 * rather than mixed in silently, so choosing one still shows you why it is 20.
 *
 * Custom "-wise" skills, Languages and Piety are not in the catalogue and so
 * are not defaulted here: they appear only when the actor actually has them,
 * which is correct, since nobody has every language at 20. */
TBE.skillOptions = function (fieldName = "pick", label = "Skill", filterGroup = null) {
  /* No token and no assigned character: there is nothing to roll for, so
   * fall through to the typed number rather than offering a phantom list. */
  if (!TBE.me()) return "";
  /* The merge has one owner now (TBE.allSkills); this splits its result back
     into the two optgroups the picker shows. */
  const all = TBE.allSkills(TBE.me());
  const keep = (x) => !filterGroup || x.group === filterGroup;
  const mine = all.filter((x) => x.trained).filter(keep);
  const rest = all.filter((x) => !x.trained).filter(keep);
  if (!mine.length && !rest.length) return "";
  const opt = (x) =>
    '<option value="' + x.value + "|" + x.name + "|" + x.expertise + "|" + (x.savvy ? 1 : 0) + '">' +
    x.name + " (" + x.value + TBE.expertiseTag(x.expertise) + (x.savvy ? " S" : "") + ")</option>";
  return (
    '<label style="display:block;margin:2px 0">' + label +
    ': <select name="' + fieldName + '" style="width:100%">' +
    '<option value="">-- use the number below --</option>' +
    (mine.length ? '<optgroup label="On the sheet">' + mine.map(opt).join("") + "</optgroup>" : "") +
    (rest.length
      ? '<optgroup label="Untrained (' + TBE.BASE_SKILL + ', p.104)">' + rest.map(opt).join("") + "</optgroup>"
      : "") +
    "</select></label>"
  );
};

/* ---- the skill catalogue: one owner for names, category and fighting flag ----
 * Ch.3 (p.30-32) sorts every skill into four categories. Three macros
 * (Build Character, Character Wizard, Finish Character) each carried a private
 * copy of this map and TBE: NPC had no copy at all, so it stamped
 * group:"Adventuring" onto every skill it created -- which put Dodge (Combat)
 * and Insight (Social) in the wrong category on every generated NPC and hid
 * them from TBE.skillOptions()'s group filters. This is the single owner now.
 * funnel_check.mjs verifies it against the book: each name must be defined in
 * its own "<Category> Skills" section of /tmp/tbe.txt ("dodge - ...", the
 * language-capped ones as "wit* - ...") and in no other section, and the three
 * macro copies must match it exactly. */
/* Ch.7 p.104: a skill with no value "begins at 20". One owner for that
 * number, since both the blank-sheet builder and the roll picker need it. */
TBE.BASE_SKILL = 20;

/* The Task Modifier Table (p.18). Owner: module/rules/resolution.mjs, read
 * through the rules global. The list below is the fallback for the Node
 * harness and for a world without the system; resolution_check.mjs asserts it
 * equals the owner row for row, so it cannot drift the way this macro pack's
 * own copy once did (it had Severe -30 while the owner did not). */
TBE.TASK_MODIFIERS_FALLBACK = [
  { key: "simple", label: "Simple", mod: 20, example: "Intimidate a coward" },
  { key: "easy", label: "Easy", mod: 10, example: "Use Commerce to evaluate a handful of foreign coins" },
  { key: "medium", label: "Medium", mod: 0, example: "Make an attack in combat" },
  { key: "challenging", label: "Challenging", mod: -10, example: "Ride an unbroken stallion" },
  { key: "hard", label: "Hard", mod: -20, example: "Recall Ancient Lore about a long-forgotten kingdom" },
  { key: "severe", label: "Severe", mod: -30, example: "Use Athletics to climb a smooth wall in a rainstorm" }
];
TBE.taskModifiers = () =>
  (typeof game !== "undefined" && game?.thebrokenempires?.rules?.TASK_MODIFIERS) || TBE.TASK_MODIFIERS_FALLBACK;

/* What this user last picked (v0.49.0). Owner: module/helpers/memory.mjs, on
 * the user, never the actor. Without the system (the Node harness) it is kept
 * in TBE._memory for the length of one script, which is also what the checks
 * inspect. A PREFILL, never a commit: callers pass choices, never a spend. */
TBE._memory = {};
TBE._memOwner = () => (typeof game !== "undefined" && game?.thebrokenempires?.memory) || null;
TBE.recall = function (kind, key) {
  const m = TBE._memOwner();
  if (m && typeof game !== "undefined" && game.user) return m.recall(game.user, kind, key);
  const v = TBE._memory[kind]?.[key];
  return v === undefined ? null : v;
};
TBE.remember = async function (kind, key, value) {
  const m = TBE._memOwner();
  if (m && typeof game !== "undefined" && game.user) {
    try { return await m.remember(game.user, kind, key, value); }
    catch (e) { console.warn("TBE | could not remember " + kind, e); return false; }
  }
  TBE._memory[kind] = TBE._memory[kind] || {};
  if (value === null || value === undefined) delete TBE._memory[kind][key];
  else TBE._memory[kind][key] = value;
  return true;
};

/* The Task Modifier and Favor pickers as button rows. Owner of the markup:
 * module/helpers/roll-controls.mjs. The fallback is a plain <select>, for a
 * world without the system; both post the same field names. */
TBE._ui = () => (typeof game !== "undefined" && game?.thebrokenempires?.ui) || null;
TBE.taskButtons = function (selected, name) {
  name = name || "task";
  const ui = TBE._ui();
  if (ui) return ui.taskButtons(TBE.taskModifiers(), selected, name);
  return '<select name="' + name + '" style="width:100%">' + TBE.taskModifiers().map((m) =>
    '<option value="' + m.mod + '"' + (m.mod === TBE.num(selected, 0) ? " selected" : "") + ">" +
    m.label + " " + (m.mod >= 0 ? "+" : "") + m.mod + "</option>").join("") + "</select>";
};
TBE.favorButtons = function (max, name) {
  name = name || "favor";
  const ui = TBE._ui();
  if (ui) return ui.favorButtons(max, 10, name);
  const n = Math.max(0, Math.floor(TBE.num(max, 0)));
  return '<select name="' + name + '" style="width:100%">' +
    Array.from({ length: n + 1 }, (_, i) => '<option value="' + i + '"' + (i === 0 ? " selected" : "") + ">" + i + (i ? " (+" + i * 10 + ")" : "") + "</option>").join("") +
    "</select>";
};

TBE.SKILL_GROUPS = {
  Combat: ["Dodge", "Melee: Light", "Melee: Medium", "Melee: Heavy", "Might", "Missile", "Thrown"],
  Adventuring: ["Athletics", "Endurance", "Locks & Traps", "Perception", "Ride", "Sail/Boat",
    "Sleight of Hand", "Stealth", "Survival", "Track", "Willpower"],
  Social: ["Deceive", "Insight", "Inspire", "Intimidate", "Perform", "Persuade", "Protocol", "Seduce", "Wit"],
  Lore: ["Ancient Lore", "Arcana", "Commerce", "Common Lore", "Craft: Artistic", "Craft: Practical",
    "Divinity", "Heal", "Naturewise", "Streetwise"]
};
TBE.SKILL_ALL = Object.keys(TBE.SKILL_GROUPS).reduce((a, g) => a.concat(TBE.SKILL_GROUPS[g]), []);

/* The category a skill belongs to, or null for anything outside the base
 * catalogue -- a custom "-wise" (group "Wise") or Piety (group "Lore", owned by
 * TBE: Talents). Callers that must have a group pass their own fallback rather
 * than getting a silently wrong one. */
TBE.skillGroup = function (name) {
  const groups = Object.keys(TBE.SKILL_GROUPS);
  for (const g of groups) if (TBE.SKILL_GROUPS[g].indexOf(name) > -1) return g;
  return null;
};

/* system.fighting is not an independent fact: a skill is a fighting skill iff
 * it is a Combat skill. The Wizard already derived it that way; NPC generation
 * passed it by hand and could disagree with the group it stamped. */
TBE.isFighting = (name) => TBE.skillGroup(name) === "Combat";

/* Which heading a stat-block skill belongs under (Ch.18 creatures, and any NPC
 * written the same way). The catalogue answers first. Past it, a stat block
 * names a skill in only two other ways: a "-wise" (the Guard Captain's
 * Law-wise) or a weapon or natural attack ("Spear 70", "Bite 60"), which is a
 * fighting skill whatever it is called. Anything else returns null: guessing
 * a heading is how every creature skill came to be stamped "Adventuring". */
TBE.creatureSkillGroup = function (name, isAttack) {
  const g = TBE.skillGroup(name);
  if (g) return g;
  if (/-wise$/i.test(String(name || ""))) return "Wise";
  if (isAttack) return "Combat";
  return null;
};

/* Expertise ladder: no skill has Ex0 or Ex1 (p.53), so the first step lands on
 * Ex2 and each later one adds 1 to a maximum of Ex4. */
/* The creation rules below have one owner, the system's module/chargen/
 * rules.mjs (exposed as game.thebrokenempires.chargen.rules, v0.53.0). Each
 * copy here defers to it at runtime and keeps its own body only as the
 * fallback for a harness with no system loaded; creator_check.mjs holds the
 * two equal over their whole input space. */
TBE._chargenRules = () => (typeof game !== "undefined" && game?.thebrokenempires?.chargen?.rules) || null;

TBE.raiseExpertise = (cur) => {
  const own = TBE._chargenRules();
  if (own) return own.raiseExpertise(cur);
  return TBE.num(cur, 0) === 0 ? 2 : Math.min(4, TBE.num(cur, 0) + 1);
};

/* p.80: "During character creation, no skill can be increased beyond 70 for
 * any reason." */
TBE.CHARGEN_SKILL_CAP = 70;

/* ---- Ability Scores (p.85-86, step 3 of character creation) ----
 * "Choose (or roll 1d6 twice to randomly determine) two Ability Scores in
 * which your character is exceptionally gifted. For each stat: add +5 to each
 * listed skill; add 1 level of Expertise to one of the listed skills; choose
 * one of the three listed Talents; select one of the descriptors listed."
 * The book does not say what a duplicate roll means, so the Wizard's reading
 * (step to the next score on the list) is kept and shared rather than being
 * re-invented differently by every generator that rolls this table. */
TBE.rollAbilityPair = async function (scores) {
  const list = scores || [];
  if (!list.length) return { picks: [null, null], rolls: [] };
  const r1 = await new Roll("1d6").evaluate();
  const r2 = await new Roll("1d6").evaluate();
  const own = TBE._chargenRules();
  if (own) { const p = own.abilityPairFromRolls(list, r1.total, r2.total); return { picks: p, rolls: [r1, r2] }; }
  const idx = (n) => Math.max(0, Math.min(list.length - 1, n - 1));
  const first = list[idx(r1.total)] || null;
  const second = r2.total === r1.total
    ? (list[(idx(r2.total) + 1) % list.length] || null)
    : (list[idx(r2.total)] || null);
  return { picks: [first, second], rolls: [r1, r2] };
};

/* Applies one Ability Score to a {skillName: {value, expertise}} map, exactly
 * as the Wizard's own step 3 does. Returns the one-line summary both the
 * Wizard's review step and the NPC/funnel cards print, or null if the score
 * could not be applied. */
TBE.applyAbilityScore = function (values, score, exSkill, cap) {
  const own = TBE._chargenRules();
  if (own) return own.applyAbilityScore(values, score, exSkill, cap);
  if (!score || !values) return null;
  const ceiling = TBE.num(cap, 0) || TBE.CHARGEN_SKILL_CAP;
  for (const sk of score.skills || []) {
    if (values[sk]) values[sk].value = Math.min(ceiling, TBE.num(values[sk].value, 0) + 5);
  }
  if (exSkill && values[exSkill]) values[exSkill].expertise = TBE.raiseExpertise(values[exSkill].expertise);
  return score.name + " (+5 to " + (score.skills || []).join(", ") + (exSkill ? ", Ex to " + exSkill : "") + ")";
};

/* Returns {value, name, expertise, savvy} from a picker selection, or null. */
TBE.readPick = function (raw) {
  if (!raw) return null;
  const bits = String(raw).split("|");
  return { value: TBE.num(bits[0], 0), name: bits[1] || "", expertise: TBE.num(bits[2], 0), savvy: bits[3] === "1" };
};

/* ---- townsfolk generation: one owner, used by TBE: NPC and TBE: Funnel ----
 * A townsperson is built the way the book builds a person, not the way Ch.18
 * builds an enemy: every catalogue skill starts at 20 (p.79-80's baseline),
 * their trade raises the two or three skills that trade actually uses, and the
 * two Ability Scores from p.85-86 are applied on top with the same helper the
 * Character Wizard uses. Nothing here reads a data file: the caller passes in
 * the trade table (data/trades.json, original content) and the Ability Score
 * table (data/chargen.json, book-verified), so this stays usable from any
 * macro regardless of which data blocks build.js gave it. */

/* How good someone is at their own trade. The book has no rule for this --
 * it never statted a tanner -- so these are the generator's brackets, applied
 * to the trade's first, second and third skill. */
TBE.TRADE_STANDING = {
  Green: [15, 10, 5],
  Ordinary: [25, 20, 10],
  Seasoned: [35, 25, 15]
};

/* The row of data/trades.json covering a d100 result. */
TBE.tradeFor = function (trades, roll) {
  const n = TBE.num(roll, 0);
  return (trades || []).find((t) => n >= t.range[0] && n <= t.range[1]) || null;
};

/* Every catalogue skill at the book's starting value, shaped like the map
 * TBE.applyAbilityScore() and the Wizard both work on. */
TBE.blankSkillValues = function (base) {
  const start = TBE.num(base, 0) || TBE.BASE_SKILL;
  const values = {};
  for (const group of Object.keys(TBE.SKILL_GROUPS)) {
    for (const name of TBE.SKILL_GROUPS[group]) {
      values[name] = { group, value: start, fighting: group === "Combat", expertise: 0 };
    }
  }
  return values;
};

/* Builds one townsperson. Async because the Ability Score pair is a real
 * 1d6+1d6 on the table, rolled through the shared roller so a generated NPC
 * and a player-made character read the same duplicate rule.
 * opts: { trades, abilityScores, talents, standing, base, tradeRoll, avoidTrades } */
TBE.buildTownsfolk = async function (opts) {
  const o = opts || {};
  const bonus = TBE.TRADE_STANDING[o.standing] || TBE.TRADE_STANDING.Ordinary;
  /* A town of four people should not contain two blacksmiths just because a
   * d100 repeated. Reroll off an already-used trade while the table still has
   * room, then take whatever comes. */
  const avoid = o.avoidTrades || [];
  let tradeRoll = TBE.num(o.tradeRoll, 0);
  let trade = tradeRoll ? TBE.tradeFor(o.trades, tradeRoll) : null;
  if (!trade) {
    const room = (o.trades || []).length > avoid.length;
    for (let attempt = 0; attempt < (room ? 12 : 1); attempt++) {
      tradeRoll = Math.floor(Math.random() * 100) + 1;
      trade = TBE.tradeFor(o.trades, tradeRoll);
      if (!trade || avoid.indexOf(trade.name) === -1) break;
    }
  }
  const values = TBE.blankSkillValues(o.base);

  /* The trade itself: the skills that trade uses, raised over the baseline. */
  const tradeApplied = [];
  ((trade && trade.skills) || []).forEach((sk, i) => {
    const add = bonus[i] !== undefined ? bonus[i] : bonus[bonus.length - 1];
    if (!values[sk]) return;
    values[sk].value = Math.min(TBE.CHARGEN_SKILL_CAP, values[sk].value + add);
    tradeApplied.push(sk + " +" + add);
  });

  /* p.85-86, rolled rather than chosen. Where the book asks the player to
   * choose, the generator picks: the Expertise goes to whichever listed skill
   * the person is already best at (so it lands on their trade when the score
   * overlaps it), and the Talent and descriptor are rolled off the three/five
   * the score offers. */
  /* What kind of work this is, taken from the trade's own primary skill --
   * used to choose between the three Talents each Ability Score offers. */
  const dominantGroup = (trade && trade.skills && trade.skills.length)
    ? (TBE.skillGroup(trade.skills[0]) || "Adventuring") : "Adventuring";

  const pair = await TBE.rollAbilityPair(o.abilityScores || []);
  const abilityLines = [];
  const abilityTalents = [];
  const descriptors = [];
  const picks = [];
  for (const score of pair.picks) {
    if (!score) continue;
    /* Where the book has the player choose which listed skill gets the
     * Expertise, the generator chooses the way a person would: the skill their
     * trade actually uses, failing that the one they are already best at, and
     * never a weapon skill for someone whose work is not fighting -- a tax
     * clerk with Ex2 in Melee: Medium is a roll, not a character. */
    const listed = (score.skills || []).filter((sk) => values[sk]);
    const tradeSkills = (trade && trade.skills) || [];
    const inTrade = listed.filter((sk) => tradeSkills.indexOf(sk) > -1);
    const sensible = dominantGroup === "Combat" ? listed : listed.filter((sk) => !TBE.isFighting(sk));
    const exFrom = inTrade.length ? inTrade : (sensible.length ? sensible : listed);
    const exSkill = exFrom.slice().sort((a, b) => values[b].value - values[a].value)[0] || null;
    const line = TBE.applyAbilityScore(values, score, exSkill, TBE.CHARGEN_SKILL_CAP);
    if (line) abilityLines.push(line);
    picks.push(score.name);
    /* The book has the player choose one of the three Talents the score offers.
     * Rolling it blind hands a green blacksmith "Sweeping Attack"; prefer the
     * one whose Talent category matches the work this person actually does,
     * and only fall back to chance when none of the three fit. */
    const offered = score.talents || [];
    const catalogue = o.talents || [];
    const fitting = offered.filter((tn) => {
      const row = TBE.talentNamed(catalogue, tn);
      return row && row.category === dominantGroup;
    });
    /* Failing a category match, at least keep a combat Talent off someone whose
     * work has nothing to do with fighting -- the book lets the player choose,
     * and no miller chooses Sweeping Attack. */
    const nonCombat = offered.filter((tn) => {
      const row = TBE.talentNamed(catalogue, tn);
      return row && row.category !== "Combat";
    });
    const fromList = fitting.length ? fitting
      : (dominantGroup !== "Combat" && nonCombat.length ? nonCombat : offered);
    const tal = fromList[Math.floor(Math.random() * fromList.length)];
    if (tal) abilityTalents.push(tal);
    const desc = (score.descriptors || [])[Math.floor(Math.random() * (score.descriptors || []).length)];
    if (desc) descriptors.push(desc);
  }

  /* What actually goes on the card: the skills that rose above the baseline,
   * best first. A list of thirty-seven skills all sitting at 20 tells the GM
   * nothing. */
  const notable = Object.keys(values)
    .filter((n) => values[n].value > (TBE.num(o.base, 0) || 20) || values[n].expertise)
    .sort((a, b) => values[b].value - values[a].value || a.localeCompare(b))
    .map((n) => ({ name: n, group: values[n].group, value: values[n].value, expertise: values[n].expertise }));

  return { trade, tradeRoll, standing: o.standing || "Ordinary", values, notable,
    tradeApplied, abilityPicks: picks, abilityLines, abilityTalents, descriptors, rolls: pair.rolls };
};

/* The Item shape for a Talent, from its catalogue row. One owner, because
 * three places now create Talent Items -- TBE: Talents when a Talent is bought,
 * and NPC/funnel generation when an Ability Score grants one -- and a Talent
 * created without its ActiveEffects is inert: the number it promises never
 * moves on the actor. */
/* Catalogue lookup by name, case-insensitively: data/chargen.json's Ability
 * Score table writes "Quick and Quiet" and "Press the Point" while
 * data/talents.json has "Quick And Quiet" and "Press The Point", so an exact
 * match silently drops two real Talents. */
TBE.talentNamed = function (catalogue, name) {
  const own = TBE._chargenRules();
  if (own) return own.talentNamed(catalogue, name);
  const key = String(name || "").trim().toLowerCase();
  if (!key) return null;
  const exact = (catalogue || []).find((t) => String(t.name).toLowerCase() === key);
  if (exact) return exact;
  /* A rank written after the name. The Warrior career grants "Armor Training
   * III" (p.102) and the catalogue files the Talent once, as "Armor Training
   * (I-IV)" (p.40). Exact matching alone missed it, so until v0.51.0 no
   * Warrior built by the Wizard got Armor Training at all: the grant became a
   * "not in the catalogue" note. The caller sets the rank; this only finds
   * the Talent. */
  const m = key.match(/^(.*?)\s+(i{1,3}|iv)$/);
  if (!m) return null;
  return (catalogue || []).find((t) => String(t.name).toLowerCase().startsWith(m[1] + " (")) || null;
};

TBE.talentItem = function (row, spec) {
  const own = TBE._chargenRules();
  if (own) return own.talentItem(row, spec);
  const t = row || {};
  const perX = t.rank === "per-skill";
  return {
    name: t.name + (perX && spec ? " (" + spec + ")" : ""),
    type: "talent",
    img: "icons/svg/upgrade.svg",
    system: {
      category: t.category || "", requirements: t.requires || "",
      ranks: 1, maxRanks: t.rank, specialization: spec || "",
      sub: !!t.sub, description: t.desc ? "<p>" + t.desc + "</p>" : ""
    },
    effects: (t.effects || []).map((e) => Object.assign({}, e, {
      changes: (e.changes || []).map((c) => Object.assign({}, c))
    }))
  };
};

/* Skill Items for an actor, with the category and the fighting flag derived
 * from the catalogue instead of stamped by hand. Only the skills worth
 * carrying: an actor sheet listing every catalogue skill at 20 is noise. */
TBE.skillItemsFrom = function (notable) {
  return (notable || []).map((sk) => ({
    name: sk.name,
    type: "skill",
    system: {
      group: sk.group || TBE.skillGroup(sk.name) || "Adventuring",
      value: TBE.num(sk.value, 0),
      fighting: TBE.isFighting(sk.name),
      expertise: TBE.num(sk.expertise, 0),
      savvy: false
    }
  }));
};

/* ---- actor state helpers ----
 * The native TBE system (systems/the-broken-empires) keeps this as real
 * DataModel fields on the actor: system.wounds, system.supply, system.shock,
 * system.fatigue, system.lethalityPenalty, system.deathThreshold, etc. — not
 * flags.tbe.*. Hit-location keys are the schema's camelCase keys (body, rArm,
 * lArm, rLeg, lLeg, head), not the old display-name keys ("Body", "R Arm", ...).
 * TBE.LOC_LABELS below maps schema key -> display label wherever a chat card
 * needs to show one. */
TBE.clone = (o) => (foundry.utils?.duplicate ? foundry.utils.duplicate(o) : JSON.parse(JSON.stringify(o)));

TBE.LOCATIONS = ["body", "rArm", "lArm", "rLeg", "lLeg", "head"];

/* Ch.18 Size ladder, smallest to largest. Medium (index 5) is the human
 * baseline. Mirrors the system's own chargen-data.mjs. */
TBE.SIZES = ["Minute", "Diminutive", "Tiny", "Little", "Small", "Medium",
  "Large", "Huge", "Massive", "Gargantuan", "Colossal"];

/*
 * Combat consequences of the Size gap between two combatants (Ch.18), from the
 * attacker's point of view. gap > 0 means the DEFENDER is larger. Returns plain
 * data so a chat card can show its reasoning instead of silently nudging
 * numbers. Note this is the size DIFFERENCE table, which always applies; the
 * separate per-step stat table (+1 Toughness, +2 damage...) is only for a
 * creature whose size has been CHANGED from its starting size, and bestiary
 * stat blocks already bake their own size in.
 *
 * OWNERSHIP: the system owns this rule (CONFIG.TBE.sizeEffects, helpers/
 * config.mjs, same SIZES table). This used to be a second, independent copy
 * that drifted from it twice (missed the v0.21.0 Lock fix, named the
 * attacker's reach differently) before both were pinned identical by a test.
 * Pinning is a safety net, not ownership -- a test only catches drift after
 * someone writes it, an owner makes the drift impossible to write. Macros
 * run inside the system, so this now reads CONFIG.TBE.sizeEffects() at
 * runtime and only falls back to computing it locally when CONFIG isn't
 * around (a Node test harness, or the legacy standalone macro pack). Same
 * runtime-global pattern as TBE.rankCap()/TBE.strandCap() above.
 */
TBE.sizeEffects = function (attackerSize, defenderSize) {
  if (typeof CONFIG !== "undefined" && CONFIG.TBE && CONFIG.TBE.sizeEffects) {
    return CONFIG.TBE.sizeEffects(attackerSize, defenderSize);
  }
  const ai = TBE.SIZES.indexOf(attackerSize), di = TBE.SIZES.indexOf(defenderSize);
  if (ai < 0 || di < 0) return null;
  const gap = di - ai, abs = Math.abs(gap);
  return {
    gap, abs,
    attackerSize, defenderSize,
    /* "All Combat skills used against a creature 3+ Sizes larger are at +20." */
    toHit: gap >= 3 ? 20 : 0,
    /* "Melee attacks from a creature 3+ Sizes larger cannot be parried, only
       Dodged." On this attack that bites when the ATTACKER is the larger one. */
    defenderMustDodge: gap <= -3,
    /* "Drive Back, Trip and Disarm cannot be used against a creature 3+ Sizes
       larger." Lock carries the same threshold in its own entry (p.163:
       "Targets more than two Sizes larger than the attacker cannot be
       Locked"), which was written on a different page and so was never
       enforced -- more than two larger is three or more larger. */
    maneuversBlocked: gap >= 3 ? ["db", "trip", "dis", "lock"] : [],
    /* "+1 Reach per 2 Sizes larger than the opponent." */
    attackerReach: Math.trunc(Math.max(0, -gap) / 2),
    defenderReach: Math.trunc(Math.max(0, gap) / 2),
    /* "Grappling is only possible up to 2 Sizes larger or smaller." */
    grappleLegal: abs <= 2,
    /* "+20 Might per Size category of difference when Grappling" (to the larger). */
    grappleMight: abs * 20
  };
};

/* Human-readable lines for whatever the size gap actually changed. */
TBE.sizeNotes = function (fx, attackerName, defenderName) {
  if (!fx || !fx.gap) return [];
  const out = [];
  const bigger = fx.gap > 0 ? defenderName : attackerName;
  out.push("Size: " + fx.attackerSize + " vs " + fx.defenderSize + " (" +
    bigger + " larger by " + fx.abs + ")");
  if (fx.toHit) out.push("+" + fx.toHit + " to hit: target is 3+ Sizes larger");
  if (fx.defenderMustDodge) out.push("Monstrous attack: " + defenderName + " cannot parry, only Dodge");
  if (fx.maneuversBlocked.length) out.push("Drive Back, Trip, Disarm and Lock are unavailable against a foe 3+ Sizes larger");
  if (fx.attackerReach) out.push(attackerName + " has +" + fx.attackerReach + " Reach");
  if (fx.defenderReach) out.push(defenderName + " has +" + fx.defenderReach + " Reach");
  if (!fx.grappleLegal) out.push("Grappling is impossible at more than 2 Sizes apart");
  else if (fx.grappleMight) out.push("In a Grapple the larger gains +" + fx.grappleMight + " Might");
  return out;
};
TBE.LOC_LABELS = { body: "Body", rArm: "R Arm", lArm: "L Arm", rLeg: "R Leg", lLeg: "L Leg", head: "Head" };

TBE.emptyWoundLoc = () => ({ wp: 0, imp: 0, inf: false, septic: false, rb: null, fw: 0, fwKind: "" });

/* ---- Fatigue, and the wounds it turns into (Ch.11 p.189) ----
 *
 * "Taking additional Fatigue when your Resolve track is already filled causes
 * Fatigue-based wounds. These kinds of wounds: are lethal, counting toward
 * both Death Threshold and Infection checks; never become infected themselves;
 * never cause more than a single instance of their type; do not require a
 * Wound Die roll when first taking them or when increasing them; increase by 1
 * point whenever you would take any amount of Fatigue you cannot mark because
 * your Resolve track is already filled; cannot be treated with Heal, or make
 * Recovery rolls."
 *
 * Two macros needed this and neither had it: TBE: Journey Leg never rolled the
 * Fatigue Table at all, and TBE: Cast added Fatigue with a bare += and then
 * quoted the overflow rule at the player as a line of prose. One owner, so a
 * Weary wound from the road and a Weave wound from a mis-cast spell follow the
 * same rule.
 *
 * Resolve is spent left to right and Fatigue marked right to left on the same
 * track, so the room left for Fatigue is the unspent Resolve minus the Fatigue
 * already marked. */
TBE.FATIGUE_WOUND = {
  Weary: { loc: "body", why: "travel (Ch.12 p.207)" },
  Deprived: { loc: "body", why: "going without rations (Ch.11 p.189)" },
  Sleepless: { loc: "body", why: "going without sleep (Ch.11 p.189)" },
  Weave: { loc: null, why: "Fraying (Ch.14) — a random location" }
};

/* The Resolve track (p.26). Owner: module/rules/resolve-track.mjs, read
 * through the rules global. What can be SPENT is unspent Resolve minus
 * Fatigue: spent boxes are slashed from the left, Fatigue crossed from the
 * right, and only the boxes between are free. Before v0.50.0 every spend read
 * resolve.value alone. The body below is the Node-harness fallback;
 * resolve_check.mjs asserts it agrees with the owner over a matrix. */
TBE._trackOwner = () => (typeof game !== "undefined" && game?.thebrokenempires?.rules?.resolveTrack) || null;
TBE.resolveTrack = function (actor, pending) {
  const o = TBE._trackOwner();
  if (o) return o.track(actor?.system, pending || 0);
  const sys = actor?.system || {};
  const max = Math.max(0, Math.floor(TBE.num(sys.resolve?.max, 0)));
  const unspent = Math.max(0, Math.min(max, Math.floor(TBE.num(sys.resolve?.value, 0))));
  const fatigue = Math.max(0, Math.min(unspent, Math.floor(TBE.num(sys.fatigue, 0))));
  const available = unspent - fatigue;
  const spend = Math.max(0, Math.min(available, Math.floor(TBE.num(pending, 0))));
  return { max, unspent, spent: max - unspent, fatigue, available, spend, after: available - spend };
};
TBE.availableResolve = (actor) => TBE.resolveTrack(actor, 0).available;
/* The track drawn as boxes; `pending` marks what this roll spends. Without
 * the system, a plain line with the same numbers. */
TBE.resolveTrackHtml = function (actor, pending, label) {
  const o = TBE._trackOwner();
  if (o) return o.trackHtml(actor?.system, pending || 0, { label: label || "Resolve" });
  const t = TBE.resolveTrack(actor, pending);
  return (label || "Resolve") + ": " + t.available + (t.spend ? " &rarr; " + t.after : "") + " available" +
    (t.fatigue ? ", " + t.fatigue + " Fatigue" : "");
};

/* Room left on the track for new Fatigue: the same free boxes Resolve is
 * spent from, so it asks the same owner. */
TBE.fatigueRoom = function (actor) {
  return TBE.availableResolve(actor);
};

/* Marks `amount` Fatigue, turning whatever will not fit into a fatigue-based
 * wound of `kind`. Returns what happened, for the card to report. */
TBE.addFatigue = async function (actor, amount, kind = "Weary") {
  const amt = Math.max(0, TBE.num(amount, 0));
  const out = { asked: amt, marked: 0, overflow: 0, kind, loc: null, wpNow: 0, fatigueNow: TBE.num(actor?.system?.fatigue, 0) };
  if (!actor || !amt) return out;

  const room = TBE.fatigueRoom(actor);
  out.marked = Math.min(room, amt);
  out.overflow = amt - out.marked;
  out.fatigueNow = TBE.num(actor.system?.fatigue, 0) + out.marked;
  /* `out.write` carries whether the Fatigue actually landed. The old body
     swallowed a permission error and left `out.marked` non-zero, so every
     caller's card reported Fatigue that was never marked. */
  if (out.marked) out.write = await TBE.write(actor, { "system.fatigue": out.fatigueNow }, "the Fatigue");
  if (!out.overflow) return out;

  const def = TBE.FATIGUE_WOUND[kind] || TBE.FATIGUE_WOUND.Weary;
  const wounds = TBE.wounds(actor);
  /* Only one wound of each type exists at a time, so an existing one of this
   * kind is increased wherever it already sits rather than a second being
   * opened somewhere else. */
  let loc = Object.keys(wounds).find((k) => wounds[k] && wounds[k].fw > 0 && wounds[k].fwKind === kind) || null;
  if (!loc) loc = def.loc || TBE.LOCATIONS[Math.floor(Math.random() * TBE.LOCATIONS.length)];
  wounds[loc] = wounds[loc] || TBE.emptyWoundLoc();
  /* "increase by 1 point whenever you would take any amount of Fatigue you
   * cannot mark" -- one point for the overflow, not one per unmarkable point. */
  wounds[loc].wp = TBE.num(wounds[loc].wp, 0) + 1;
  wounds[loc].fw = TBE.num(wounds[loc].fw, 0) + 1;
  wounds[loc].fwKind = kind;
  out.write = await TBE.setWounds(actor, wounds);
  out.loc = loc;
  out.wpNow = wounds[loc].fw;
  return out;
};

/* Rest: "If you remove any amount of Fatigue by resting, remove an equivalent
 * amount of WP from a Weary wound." Applies to every fatigue-based wound. */
TBE.removeFatigue = async function (actor, amount) {
  const amt = Math.max(0, TBE.num(amount, 0));
  const out = { removed: 0, woundHealed: 0, kinds: [] };
  if (!actor || !amt) return out;
  const cur = TBE.num(actor.system?.fatigue, 0);
  out.removed = Math.min(cur, amt);
  /* Same contract as markFatigue: `out.write` says whether the rest actually
     landed, so TBE: Wounds can report "2 Fatigue removed" only when it was. */
  if (out.removed) out.write = await TBE.write(actor, { "system.fatigue": cur - out.removed }, "the Fatigue removed by resting");

  let left = out.removed;
  if (!left) return out;
  const wounds = TBE.wounds(actor);
  let touched = false;
  for (const loc of Object.keys(wounds)) {
    const w = wounds[loc];
    if (!w || !TBE.num(w.fw, 0) || left <= 0) continue;
    const take = Math.min(TBE.num(w.fw, 0), left);
    w.fw -= take;
    w.wp = Math.max(0, TBE.num(w.wp, 0) - take);
    left -= take;
    out.woundHealed += take;
    out.kinds.push(w.fwKind || "fatigue");
    if (!w.fw) w.fwKind = "";
    touched = true;
  }
  if (touched) out.write = await TBE.setWounds(actor, wounds);
  return out;
};

/* Wound Points at a location that a Heal roll or a Recovery roll can actually
 * act on: fatigue-based points cannot be treated at all (p.189). */
TBE.treatableWp = (locRec) => Math.max(0, TBE.num(locRec?.wp, 0) - TBE.num(locRec?.fw, 0));
TBE.wounds = function (actor) {
  const w = TBE.clone(actor?.system?.wounds ?? {});
  for (const loc of TBE.LOCATIONS) if (!w[loc]) w[loc] = TBE.emptyWoundLoc();
  return w;
};
/* Returns TBE.write's report, so a caller can say whether the wounds were
 * actually recorded instead of assuming. */
TBE.setWounds = async (actor, w) => TBE.write(actor, { "system.wounds": w }, "the wounds");

/* Whole-character Shock (Ch.11) is its own boolean field now, not a synthetic
 * "__shock" key folded into the wounds object. */
TBE.shock = (actor) => !!actor?.system?.shock;
TBE.setShock = async (actor, val) => TBE.write(actor, { "system.shock": !!val }, "the Shock state");

/* Encumbrance (Ch.9 p.129-130): Weapons at Hand (max 6 ENC, shared by weapon
 * and shield items carried "hand"), and general Inventory ENC (max 6 + a
 * manual invBonus for things like the Strong Back Talent, no auto-detect
 * hook for Talent effects in this system) -- coins (1 ENC/500sp), stored
 * weapons/shields, and un-equipped armor pieces (1 ENC each, since a worn
 * piece is free per location instead) all count against Inventory.
 * Overflow above Max Inventory ENC penalises "physical activity" rolls
 * (Athletics, Combat skills, etc, p.130) -- callers apply TBE.encStatus().penalty
 * themselves (as a prefilled, editable modifier) rather than this silently
 * altering a roll no one can see. */
/* ---- lingering Weave effects (Ch.14 p.302-303) ----
 * Two Weave Reaction results outlive the spell that caused them, and both were
 * printed as prose and then forgotten:
 *   Weave Scar   "reduce the Bind skill value used in the casting by the listed
 *                amount" -- -20 until the next sunrise or sunset (row 14), or
 *                -1d6+2 permanently (row 24).
 *   Reality Snag "Until the next sunrise or sunset: the caster's spells suffer
 *                +5 to future Weave Reaction rolls... Each time the caster
 *                attempts another spell before the effect ends, reality buckles
 *                around them. Roll 1d6."
 * A permanent scar is written into the Bind skill itself, because that is what
 * permanent means. The until-sunrise ones are actor flags, so they can be
 * cleared when the sun comes up without unpicking a skill value. */
TBE.weaveState = (actor) => Object.assign({ scars: [], snag: false }, TBE.clone(TBE.flagOf(actor, "weave") ?? {}));
/* Defensive like the other actor writers here: a player without permission to
 * update the actor should get a card that still says what happened, not an
 * exception that swallows the whole casting result. */
TBE.setWeaveState = async function (actor, st) {
  await TBE.write(actor, { [TBE.flagPath("weave")]: st }, "the Weave state");
  return st;
};

/* The temporary Weave Scar penalty on one Bind, 0 when there is none. */
TBE.weaveScarFor = function (actor, bindName) {
  const st = TBE.weaveState(actor);
  const key = String(bindName || "").toLowerCase();
  return st.scars.filter((sc) => String(sc.bind).toLowerCase() === key)
    .reduce((n, sc) => n + TBE.num(sc.amount, 0), 0);
};

TBE.addWeaveScar = async function (actor, bindName, amount) {
  const st = TBE.weaveState(actor);
  st.scars.push({ bind: bindName, amount: Math.max(0, TBE.num(amount, 0)) });
  await TBE.setWeaveState(actor, st);
  return st;
};

TBE.setRealitySnag = async function (actor, on) {
  const st = TBE.weaveState(actor);
  st.snag = !!on;
  await TBE.setWeaveState(actor, st);
  return st;
};

/* "Until the next sunrise or sunset" -- one call clears everything that expires
 * on that boundary, so a GM has a single button rather than a hunt through
 * flags. Permanent scars live on the skill Item and are untouched. */
TBE.clearWeaveDay = async function (actor) {
  const st = TBE.weaveState(actor);
  const had = { scars: st.scars.length, snag: st.snag };
  await TBE.setWeaveState(actor, { scars: [], snag: false });
  return had;
};

/* ---- True Names (Ch.14 p.312-313) ----------------------------------------
 * "True Names are the ultimate connection to the Weave, and can be used as an
 * Arcane Tether to magically target any being who possesses one." Anyone
 * Patterned in the Weave or with a Faded Pattern has one; ordinary mortals do
 * not, "and thus cannot be magically targeted through them."
 *
 * The actor already carried a `trueName` string (recorded as a fact since
 * v0.15.0). What was missing is everything that happens when one is used, so
 * that lives here: one owner for the language requirement, the Fraying die and
 * the summoning penalty, shared by TBE: Cast and TBE: Summoning. */
TBE.trueNameOf = function (actor) {
  const name = String(actor?.system?.trueName || "").trim();
  const language = String(actor?.system?.trueNameLanguage || "").trim();
  const pattern = TBE.pattern(actor);
  return { name, language, pattern, has: !!name || pattern === "spellweaver" || pattern === "fade" };
};

/** The Language skills on a sheet. Languages are real skill Items in their own
 *  "Language" group (the Wizard creates them that way), not a catalogue skill,
 *  so they need their own lookup rather than TBE.skillOptions's category filter. */
TBE.languageSkills = function (actor) {
  return (actor?.items ?? [])
    .filter((i) => i.type === "skill" && (i.system?.group || "") === "Language")
    .map((i) => ({ id: i.id, name: i.name, value: TBE.num(i.system?.value, 0), expertise: TBE.num(i.system?.expertise, 0) }));
};

/* "-20 penalty on the target's Willpower roll to resist the summoning, and on
 * any attempts to break free from the circle". Named rather than typed inline
 * in TBE: Summoning so the number has one home. */
TBE.TRUE_NAME_SUMMON_PENALTY = -20;

/** "each time you invoke a True Name in a spell, roll 1d10; on a 1, gain 1
 *  Fraying." Rolled whenever the name is spoken, which includes a casting the
 *  Language roll then ruins -- the invocation is the trigger the book names,
 *  not the spell's success. Returns the roll so the caller can show it. */
TBE.invokeTrueNameFraying = async function (actor, why) {
  const roll = await new Roll("1d10").evaluate();
  const gained = roll.total === 1;
  let frayed = null;
  if (gained && actor) frayed = await TBE.addFraying(actor, 1, why || "invoking a True Name");
  return { roll, gained, frayed };
};

/** Which row of the Weave Reaction Table a d20+modifier total lands on
 *  (p.302). The three highest tiers are gated -- Void Incursion is Vulgar
 *  spells only, Fraygeist/Pattern Collapse/The Grey Wailing are Ritual only --
 *  and anything that reaches them without qualifying falls back to the highest
 *  unconditional row, which from 26 up is Catastrophic Fray.
 *
 *  Hoisted out of TBE: Cast when TBE: Ritual needed the same lookup: a ritual
 *  rolls on this table twice over (an uncontrolled success, and a critical
 *  failure at the TC), and a second copy of the gating is exactly the drift
 *  this project keeps paying for. Takes the table as an argument because each
 *  macro carries its own baked TBE_MAGIC block. */
TBE.reactionFor = function (reactions, total, opts) {
  const rows = reactions || [];
  const o = opts || {};
  const gated = rows.filter((r) => r.when && total >= r.min && total <= r.max)
    .filter((r) => (r.when === "vulgar" ? !!o.vulgar : r.when === "ritual" ? !!o.ritual : false));
  if (gated.length) return gated[gated.length - 1];
  const plain = rows.filter((r) => !r.when && total >= r.min && total <= r.max);
  return plain[plain.length - 1] || rows[0] || null;
};

/* ---- Rituals (Ch.14 p.315-318) -------------------------------------------
 * The shaping half of a ritual has worked since v0.15.0 (Ritual-only Targets
 * and Durations are priced and flagged, and the Ritual tick gates the
 * Ritual-only Weave Reaction tiers). These are the procedure's own numbers,
 * kept here so TBE: Ritual and any check script read the same arithmetic.
 * Every one of them is quoted and verified in data/magic.json's `ritual`
 * block by parse_magic.py; the constants are duplicated here only because a
 * macro cannot import, and ritual_check.mjs asserts the two agree. */

/** "A ritual requires one hour of casting time per TC", halved and rounded up
 *  when rushed. Concentration is checked "every eight hours (or portion
 *  thereof)", so an 11-hour ritual has two checkpoints, not one. */
TBE.ritualTime = function (tc, rushed) {
  const cost = Math.max(0, TBE.num(tc, 0));
  const hours = rushed ? Math.ceil(cost / 2) : cost;
  return { hours, checkpoints: Math.ceil(hours / 8), rushed: !!rushed, rushBonus: rushed ? 10 : 0 };
};

/** "Every such participant can add half their Strand value (rounded up) as
 *  Mastery", and "the maximum number of additional participants is equal to
 *  half the original caster's value (rounded up) of the Strand used." */
TBE.assistCap = (casterStrand) => Math.ceil(Math.max(0, TBE.num(casterStrand, 0)) / 2);
TBE.assistMastery = (strand) => Math.ceil(Math.max(0, TBE.num(strand, 0)) / 2);

/** Blood Magic (p.316): 1 Mastery per lethal Wound Point, capped at 20; the
 *  marking chance is 5% per point, or a certainty if the victim is killed. */
TBE.BLOOD_MAX = 20;
TBE.bloodMastery = (wp) => Math.min(TBE.BLOOD_MAX, Math.max(0, TBE.num(wp, 0)));
TBE.bloodMarkChance = (wp, killed) => (killed ? 100 : Math.min(100, Math.max(0, TBE.num(wp, 0)) * 5));

/** Magic Circle (p.315): "Every 2 SLs on the Arcana roll will allow the circle
 *  to reduce the cost of any spell or ritual cast entirely within its bounds
 *  by 1 SL." The book measures the reduction in SLs while costs are in TC, and
 *  never restates the exchange, so this reads it as the plainest thing it can
 *  mean -- one point off the Total Cost per two SLs -- and TBE: Ritual prints
 *  the sentence beside the number so a table that reads it otherwise can see
 *  exactly what was applied and override it. */
TBE.circleReduction = (arcanaSls) => Math.floor(Math.max(0, TBE.num(arcanaSls, 0)) / 2);

/** Circle inscription bonus: "+10 ... up to +30 for 1500 sp" over the base
 *  1,000 sp, in 500 sp steps. */
TBE.circleMaterialBonus = function (sp) {
  const extra = Math.max(0, TBE.num(sp, 0) - 1000);
  return Math.min(30, Math.floor(extra / 500) * 10);
};

/* ---- Divine Magic (Ch.15) ------------------------------------------------
 * Piety is not like any other skill: "it changes with use", it can never be
 * improved with XP or carry Expertise, it is capped at 90, and asking for a
 * miracle SPENDS it whether or not the god answers. All of that lives here,
 * because TBE: Miracle and TBE: Pious Act both need the same arithmetic and
 * the numbers are verified against the book in data/divine.json. */

TBE.PIETY_CAP = 90;
TBE.PIETY_WARNING = 30;      // a vision of warning at or below this
TBE.PIETY_ENCOURAGEMENT = 80; // a positive vision at or above this

/** The Piety skill Item, if this character has one. It is an ordinary skill
 *  Item in the Lore group, granted by the Godbound Talent at 30. */
TBE.pietySkill = function (actor) {
  return (actor?.items ?? []).find((i) => i.type === "skill" && /^piety$/i.test(i.name || "")) || null;
};
TBE.piety = (actor) => TBE.num(TBE.pietySkill(actor)?.system?.value, 0);

/** Everything the Divine side of a sheet holds, in one read.
 *
 *  "Is this a Godbound?" has one owner and it is here. It used to be the bare
 *  presence of a Piety skill Item, which was wrong in practice: both chargen
 *  paths minted a Piety skill at 0 on EVERY character as a placeholder, so
 *  every fighter and thief in the world read as a Godbound. That gate is the
 *  only thing standing between an ordinary character and TBE: Miracle, and
 *  praying at Piety 0 always fails and always spends Piety, so a Warrior who
 *  opened the wrong macro once was permanently Cast Out. (Found by playing a
 *  session end to end, fixed v0.28.0.)
 *
 *  Both chargen macros now create the skill only for a Godbound, but worlds
 *  built before v0.28.0 still carry the placeholder, so the definition itself
 *  has to survive it: a real Godbound always has Piety above zero, or a deity,
 *  or a Domain, or is already Cast Out. A Piety skill at 0 with none of those
 *  is the placeholder, not a calling. */
TBE.godbound = function (actor) {
  const sys = actor?.system || {};
  const skill = TBE.pietySkill(actor);
  const piety = TBE.num(skill?.system?.value, 0);
  const deity = String(sys.deity || "").trim();
  const domains = Array.isArray(sys.domains) ? sys.domains.slice() : [];
  const castOut = !!sys.castOut;
  const called = piety > 0 || !!deity || domains.length > 0 || castOut;
  return {
    isGodbound: !!skill && called,
    /* True when the sheet carries the pre-v0.28.0 placeholder and nothing
       else, so a macro can say why it is refusing rather than just refusing. */
    placeholderPiety: !!skill && !called,
    piety: TBE.num(skill?.system?.value, 0),
    skill,
    deity,
    domains,
    symbol: String(sys.holySymbol || "").trim(),
    castOut,
    noGreaterSessions: TBE.num(sys.noGreaterSessions, 0)
  };
};

/* "1-4 SLs grants a Lesser Miracle, 5-8 SLs grants a Middle Miracle, 9+ SLs
 * grants a Greater Miracle." */
TBE.MIRACLE_BANDS = [
  { level: "Lesser", min: 1, max: 4 },
  { level: "Middle", min: 5, max: 8 },
  { level: "Greater", min: 9, max: 9999 }
];
TBE.miracleLevel = function (sls) {
  const n = TBE.num(sls, 0);
  const hit = TBE.MIRACLE_BANDS.find((b) => n >= b.min && n <= b.max);
  return hit ? hit.level : null;
};

/* The holy symbol is "a kind of Supply Die": rolled after a SUCCESSFUL Piety
 * roll for +2 SLs, stepping down one die type on a 1-2, and needing a blessing
 * once it falls below d6. */
TBE.SYMBOL_DICE = ["d12", "d10", "d8", "d6", "d4"];
TBE.SYMBOL_SLS = 2;
TBE.stepSymbol = function (die) {
  const i = TBE.SYMBOL_DICE.indexOf(die);
  if (i < 0) return die;
  return TBE.SYMBOL_DICE[Math.min(TBE.SYMBOL_DICE.length - 1, i + 1)];
};
/** "If a Godbound's holy symbol depletes below d6, the symbol must be blessed
 *  ... before it will provide further benefit." d4 is the only step below d6. */
TBE.symbolNeedsBlessing = (die) => die === "d4";
TBE.symbolUsable = (die) => !!die && TBE.SYMBOL_DICE.indexOf(die) >= 0 && !TBE.symbolNeedsBlessing(die);

/* Persistent prayer (p.348). */
TBE.PRAYER_SLS = { none: 0, minute: 1, ten: 2, hour: 3 };

/** Write a new Piety value, clamped to 0 and to the 90 ceiling, and report
 *  every threshold the change crossed: the warning vision at 30 or below, the
 *  encouraging one at 80 or above, and being Cast Out at zero. */
TBE.setPiety = async function (actor, value, opts) {
  const o = opts || {};
  const skill = TBE.pietySkill(actor);
  const before = TBE.num(skill?.system?.value, 0);
  /* The 90 ceiling is on the character's own Piety, not on a modified roll:
   * "modifiers can temporarily raise it to 100 or beyond", which is a
   * different number and never written back here. */
  const after = Math.max(0, Math.min(TBE.PIETY_CAP, Math.round(TBE.num(value, 0))));
  const out = {
    before, after, delta: after - before,
    castOut: after <= 0,
    warned: after > 0 && after <= TBE.PIETY_WARNING && before > TBE.PIETY_WARNING,
    encouraged: after >= TBE.PIETY_ENCOURAGEMENT && before < TBE.PIETY_ENCOURAGEMENT,
    cappedAt90: TBE.num(value, 0) > TBE.PIETY_CAP
  };
  /* `out.write` rather than a swallowed error: Piety is the resource whose
     silent non-write is worst, because being Cast Out at zero is permanent
     and the card that announces it is the only record anyone sees. */
  if (skill) out.write = await TBE.writeItem(skill, { "system.value": after }, "the Piety change");
  if (out.castOut && !o.noCastOut && actor) {
    out.castOutWrite = await TBE.write(actor, { "system.castOut": true }, "the Cast Out state");
  }
  return out;
};

/* ---- Enchantments and Alchemy (Ch.14 p.322-326) --------------------------
 * "Alchemy is a simplified form of enchantment... it binds a spell into a
 * physical vessel so that the substance itself becomes the caster." One set of
 * helpers, because the book treats them as one art with two shapes. The
 * numbers are verified in data/magic.json by parse_magic.py; these mirrors
 * exist because a macro cannot import, and ritual_check/enchant_check assert
 * the two agree. */

/* The Enchantment Costs table (p.322): the Fraying an enchantment costs, by
 * the Use Die or charge pool it is given. `single` is the 0-Fraying case. */
TBE.ENCHANT_COSTS = [
  { key: "single", die: null, charges: 1, fraying: 0, label: "Single-use (1 charge)" },
  { key: "d6", die: "d6", charges: 3, fraying: 1, label: "Die type d6 or 3 charges" },
  { key: "d8", die: "d8", charges: 10, fraying: 2, label: "Die type d8 or 10 charges" },
  { key: "d10", die: "d10", charges: 15, fraying: 3, label: "Die type d10 or 15 charges" },
  { key: "d12", die: "d12", charges: 30, fraying: 4, label: "Die type d12 or 30 charges" }
];
TBE.ENCHANT_ANYONE_FRAYING = 1;

/** The row for a chosen tier, by its key. */
TBE.enchantRow = (key) => TBE.ENCHANT_COSTS.find((r) => r.key === key) || TBE.ENCHANT_COSTS[0];

/** What an enchantment costs in Fraying: the tier's own cost, plus 1 if it is
 *  made usable by anyone rather than only by a Spellweaver or Fade. */
TBE.enchantFraying = function (key, anyoneCanUse) {
  return TBE.enchantRow(key).fraying + (anyoneCanUse ? TBE.ENCHANT_ANYONE_FRAYING : 0);
};

/* Weave Reagents (p.324). "For every point of Fraying the enchantment would
 * normally cost, the caster may instead consume one Weave Reagent of the same
 * Strand" -- so the substitution is one for one, and total. */
TBE.reagentsFor = (fraying) => Math.max(0, TBE.num(fraying, 0));

/** Reagents on a sheet, by Strand. They share the Thread Item's shape (the
 *  book calls them "similar to Threads"), flagged with system.reagent. */
TBE.reagents = function (actor, strand) {
  const want = String(strand || "").trim().toLowerCase();
  return (actor?.items ?? [])
    .filter((i) => i.type === "thread" && i.system?.reagent && !i.system?.expended)
    .filter((i) => !want || String(i.system?.attunement || "").trim().toLowerCase() === want)
    .map((i) => ({ id: i.id, item: i, name: i.name, strand: String(i.system?.attunement || "").trim(),
                   count: TBE.num(i.system?.pool, 0) }));
};

/** How many reagents a potion's TC needs per batch: 1 up to 15 TC, 2 from 16. */
TBE.potionReagents = (tc) => (TBE.num(tc, 0) >= 16 ? 2 : 1);

/* The Alchemical Aid Table (p.326). "Unless otherwise noted, bonuses from
 * different aids are cumulative" -- the one exception is the Master
 * laboratory, which replaces a Refined one rather than stacking with it. */
TBE.ALCHEMY_AIDS = [
  { key: "refined", name: "Refined Laboratory", bind: 10, craft: 0, days: 1 },
  { key: "master", name: "Master Alchemist's Laboratory", bind: 20, craft: 10, days: 1, replaces: "refined" },
  { key: "formula", name: "Formula Notes", bind: 10, craft: 0, days: 1 },
  { key: "patience", name: "Tempered Patience", bind: 10, craft: 0, days: 2 }
];

/** Total the aids a brewer is using, dropping any an aid replaces. */
TBE.alchemyAids = function (keys) {
  const picked = new Set(keys || []);
  for (const aid of TBE.ALCHEMY_AIDS) if (aid.replaces && picked.has(aid.key)) picked.delete(aid.replaces);
  const used = TBE.ALCHEMY_AIDS.filter((a) => picked.has(a.key));
  return {
    used,
    bind: used.reduce((n, a) => n + a.bind, 0),
    craft: used.reduce((n, a) => n + a.craft, 0),
    days: used.reduce((n, a) => Math.max(n, a.days), 1)
  };
};

/** "A finished potion produces 1d3 doses + 1 dose per 3 SLs on the Craft:
 *  Practical roll." */
TBE.potionYield = (d3, sls) => Math.max(1, TBE.num(d3, 1)) + Math.floor(Math.max(0, TBE.num(sls, 0)) / 3);

/** The enchanted items and potions on a sheet, with what is left in each. */
TBE.enchantments = function (actor) {
  return (actor?.items ?? []).filter((i) => i.type === "enchantment").map((i) => {
    const sys = i.system || {};
    return {
      id: i.id, item: i, name: i.name,
      kind: sys.kind || "charges", die: sys.die || "d8",
      charges: TBE.num(sys.charges, 0), chargesMax: TBE.num(sys.chargesMax, 0),
      inertDays: TBE.num(sys.inertDays, 0), unstable: !!sys.unstable, spent: !!sys.spent,
      resistance: TBE.num(sys.resistance, 0), spell: sys.spell || "",
      bind: sys.bind || "", strand: sys.strand || "",
      anyoneCanUse: !!sys.anyoneCanUse, activationWord: sys.activationWord || ""
    };
  });
};

/** Whether this enchanted item can be used right now, and why not if not. */
TBE.enchantReady = function (e) {
  if (!e) return { ok: false, why: "no item" };
  if (e.spent) return { ok: false, why: "spent \u2014 this vessel can never hold magic again" };
  if (e.inertDays > 0) return { ok: false, why: "inert for another " + e.inertDays + " day(s)" };
  if ((e.kind === "charges" || e.kind === "potion" || e.kind === "single") && e.charges <= 0) {
    return { ok: false, why: e.kind === "potion" ? "no doses left" : "no charges left \u2014 it is non-magical now" };
  }
  return { ok: true, why: "" };
};

/* p.303's buckle table, rolled each time a snagged caster attempts a spell. */
TBE.SNAG_BUCKLE = [
  { max: 3, name: "Spatial distortion",
    text: "Objects and space twist near the caster; all ranged attacks into or out of the caster's zone are at -20 for one minute." },
  { max: 5, name: "Backlash strain", fatigue: "1",
    text: "The Weave tugs at the caster's body: 1 Fatigue." },
  { max: 6, name: "Severe backlash", fatigue: "1d4", willpower: 3,
    text: "1d4 Fatigue, and a Willpower roll vs 3 SL or be Cut Off for 1d6 rounds." }
];

/* Weapon Readiness (Ch.9 p.129). The action it costs to get a weapon into your
 * hand is a real cost that nothing was reporting: every macro treated a stored
 * greatsword and a drawn one as equally available. Held and Ready and At Hand
 * both live in the 6 ENC Weapons At Hand pool; Stored counts against Inventory,
 * which encStatus() below already reflects. */
/* OWNERSHIP: the system owns this table and the state->ENC-pool mapping
 * (CONFIG.TBE.READINESS / carryPool, helpers/config.mjs), because the sheet's
 * _prepareEnc() and this file's encStatus() both need it and both used to
 * re-derive it inline as `!== "stored"`. Read at runtime, same deferral
 * pattern as rankCap/strandCap/sizeEffects/encumbrance/resolve; the literal
 * below is only the fallback for a Node harness or the legacy pack. */
TBE.POOL = { HAND: "hand", INVENTORY: "inventory", NONE: "none" };

TBE.READINESS_FALLBACK = {
  ready:   { label: "Held and Ready", short: "held",    pool: "hand",      cost: "no action needed" },
  hand:    { label: "At Hand",        short: "at hand", pool: "hand",      cost: "a Minor Action to draw" },
  stored:  { label: "Stored",         short: "stored",  pool: "inventory", cost: "2 full actions to retrieve from Inventory" },
  dropped: { label: "Dropped",        short: "dropped", pool: "none",
             cost: "free to drop; a Minor Action to pick up, or an Athletics roll if Engaged" }
};

Object.defineProperty(TBE, "READINESS", {
  get() {
    return (typeof CONFIG !== "undefined" && CONFIG?.TBE?.READINESS) || TBE.READINESS_FALLBACK;
  }
});

TBE.readiness = (item) => TBE.READINESS[item?.system?.carried ?? "hand"] || TBE.READINESS.hand;

/** Which ENC pool a carry state counts against. Defers to the system's owner. */
TBE.carryPool = function (carried) {
  if (typeof CONFIG !== "undefined" && typeof CONFIG?.TBE?.carryPool === "function") {
    return CONFIG.TBE.carryPool(carried);
  }
  return (TBE.READINESS_FALLBACK[carried ?? "hand"] || TBE.READINESS_FALLBACK.hand).pool;
};

/* One line for a card or a dialog: what it costs to use this weapon now, or ""
 * when it is already in hand and costs nothing. */
TBE.readinessNote = function (item) {
  if (!item) return "";
  const r = TBE.readiness(item);
  if (r === TBE.READINESS.ready) return "";
  return item.name + " is <b>" + r.label + "</b> — " + r.cost + " before it can be used (p.129).";
};

/* OWNERSHIP: the system owns the actual bands/cap math (CONFIG.TBE.encumbrance,
 * helpers/config.mjs); this gathers the six raw numbers from a whole actor's
 * .items (the sheet gathers the same six from its own pre-split arrays -- two
 * different starting shapes, which is why this half still exists twice) and
 * defers to CONFIG for the arithmetic, same runtime-global pattern as
 * TBE.sizeEffects()/TBE.rankCap()/TBE.strandCap() above. Falls back to
 * computing the bands locally only when CONFIG isn't around (a Node test
 * harness, or the legacy standalone macro pack). */
TBE.encumbrance = function (inputs) {
  if (typeof CONFIG !== "undefined" && CONFIG.TBE && CONFIG.TBE.encumbrance) {
    return CONFIG.TBE.encumbrance(inputs);
  }
  const { hand = 0, storedGear = 0, unequippedArmor = 0, coinEnc = 0, invBonus = 0, handBonus = 0 } = inputs || {};
  const inv = storedGear + unequippedArmor + coinEnc;
  const invMax = 6 + invBonus;
  const handMax = 6 + handBonus;
  const over = Math.max(0, inv - invMax);
  const penalty = over <= 0 ? 0 : over <= 3 ? -10 : over <= 6 ? -20 : over <= 9 ? -30 : -30;
  return { hand, handMax, inv, invMax, over, penalty, overCap: over > 9 };
};

TBE.encStatus = function (actor) {
  const items = actor?.items ?? [];
  /* Same owner the sheet uses (CONFIG.TBE.carryPool), for the same reason: the
     old `!== "stored"` test would have counted a DROPPED weapon against the
     6 ENC Weapons At Hand pool the moment that state existed. */
  const gear = (i) => i.type === "weapon" || i.type === "shield";
  const inPool = (i, pool) => TBE.carryPool(i.system?.carried) === pool;
  const hand = items.filter((i) => gear(i) && inPool(i, TBE.POOL.HAND))
    .reduce((s, i) => s + TBE.num(i.system?.enc, 0), 0);
  const storedGear = items.filter((i) => gear(i) && inPool(i, TBE.POOL.INVENTORY))
    .reduce((s, i) => s + TBE.num(i.system?.enc, 0), 0);
  const unequippedArmor = items.filter((i) => i.type === "armor" && i.system?.equipped === false).length;
  const coinEnc = Math.floor(TBE.num(actor?.system?.silver, 0) / 500);
  return TBE.encumbrance({
    hand, storedGear, unequippedArmor, coinEnc,
    invBonus: TBE.num(actor?.system?.enc?.invBonus, 0),
    handBonus: TBE.num(actor?.system?.enc?.handBonus, 0)
  });
};

/* Short reminder line for a roll dialog: only prints anything when there's
 * an actual overflow penalty in effect, so a clean sheet stays silent. */
TBE.encNote = function (actor) {
  if (!actor) return "";
  const e = TBE.encStatus(actor);
  if (!e.penalty) return "";
  return '<div style="font-size:11px;color:#b04040">' + (actor.name || "Actor") + ": " + e.inv + "/" + e.invMax +
    " Inventory ENC, " + e.over + " over &rarr; <b>" + e.penalty + "</b> to physical-activity rolls (Athletics, Combat skills)" +
    (e.overCap ? " &mdash; over the 9-point cap, drop something, this is not a legal load" : "") + ".</div>";
};

/* The single owner for "auto-fill the overflow penalty into the roll
 * modifier field" that TBE.encStatus's own doc comment promises callers
 * will do. TBE: Attack already did this correctly by hand; TBE: Skill
 * Roll, TBE: Opposed Roll, and TBE: Haggle all had their modifier inputs
 * hardcoded to value="0" regardless of actual encumbrance, and TBE:
 * Extended Roll had no modifier field to prefill at all. All four now call
 * this instead of re-deriving or hardcoding the number. */
TBE.encMod = (actor) => TBE.encStatus(actor).penalty;

/* Bulk & Initiative Penalty (Ch.9 p.141): worn armor Bulk / 3, rounded up.
 * The number itself is derived once by the system, on the actor
 * (TheBrokenEmpiresActor.prepareDerivedData -> system.armorBulk /
 * armorInitPenalty / initiativeEffective), which is also what the combat
 * tracker's initiative formula rolls against. This reads that; it recomputes
 * only for an actor prepared before those fields existed, so the sheet, the
 * tracker and TBE: Cast cannot drift apart. */
TBE.armorInit = function (actor) {
  const sys = actor?.system || {};
  if (Number.isFinite(Number(sys.armorInitPenalty))) {
    return {
      bulk: TBE.num(sys.armorBulk, 0),
      penalty: TBE.num(sys.armorInitPenalty, 0),
      effective: TBE.num(sys.initiativeEffective, TBE.num(sys.initiative, 0))
    };
  }
  /* The rule's owner is the system's rules/armor.mjs; this copy is only the
     fallback for a harness with no system loaded. */
  const own = (typeof game !== "undefined" && game?.thebrokenempires?.rules?.armor) || null;
  const items = Array.from(actor?.items ?? []);
  const bulk = own ? own.wornBulk(items) : items.filter((i) => i.type === "armor" && i.system?.equipped !== false)
    .reduce((n, i) => n + TBE.num(i.system?.bulk, 0), 0);
  const penalty = own ? own.initPenalty(bulk) : Math.ceil(bulk / 3);
  return { bulk, penalty, effective: TBE.num(sys.initiative, 0) - penalty };
};

/* Maneuver riders currently on an actor, as a line for a roll dialog.
 *
 * The riders are real statuses on the token, but nothing consumes them: there
 * is no cross-roll modifier engine, and building one touches every macro that
 * rolls. Rather than let an icon imply automation that isn't there, every roll
 * dialog prints what is riding on this actor right next to the Modifier field,
 * with the book's number, and the human types it. Unbalance in particular is
 * conditional (p.163: not an Endurance roll to resist Shock, and it does not
 * stack), which is exactly the kind of judgement a person should make and an
 * auto-applier would get wrong. */
TBE.RIDERS = [
  { id: "tbe-unbalanced", name: "Unbalanced", mod: -20,
    note: "-20 to this roll, unless it is an Endurance roll to resist Shock. Does not stack." },
  { id: "tbe-prone", name: "Prone", mod: null, note: "see Prone's effects before rolling" },
  { id: "tbe-disarmed", name: "Disarmed", mod: null, note: "no weapon in hand until they pick it up" },
  { id: "tbe-locked", name: "Locked", mod: null, note: "no Fighting Withdrawal; leaving Engagement means Flee" },
  { id: "tbe-disadvantaged", name: "Disadvantaged", mod: null, note: "GM's call on what it costs here" }
];

TBE.riders = function (actor) {
  if (!actor) return [];
  return TBE.RIDERS.filter((r) => TBE.hasStatus(actor, r.id));
};

TBE.riderNote = function (actor) {
  const on = TBE.riders(actor);
  if (!on.length) return "";
  return '<div style="font-size:11px;margin:2px 0;padding:3px 5px;border-left:2px solid #a8742a;opacity:.9">' +
    on.map((r) => "<b>" + r.name + "</b>" + (r.mod ? " (" + r.mod + ")" : "") + ": " + r.note).join("<br>") +
    "<br><i>Not applied for you — put it in the Modifier field if it applies.</i></div>";
};

TBE.SUPPLY_STEPS = [6, 8, 10, 12];
TBE.supply = (actor) => Object.assign({ gear: 8, ammo: 8, medical: 8, rations: 8 }, TBE.clone(actor?.system?.supply ?? {}));
TBE.setSupply = async (actor, s) => TBE.write(actor, { "system.supply": s }, "the Supply");

/* Roll a supply die: 1-2 steps it down; a d6 that steps down is depleted (0). */
TBE.rollSupply = async function (actor, key, force) {
  const s = TBE.supply(actor);
  const die = TBE.num(s[key], 8);
  if (die <= 0) return { die: 0, roll: null, stepped: false, depleted: true, text: key + " is already exhausted" };
  const r = await new Roll("1d" + die).evaluate();
  const stepped = force || r.total <= 2;
  let next = die;
  if (stepped) next = die === 6 ? 0 : TBE.SUPPLY_STEPS[TBE.SUPPLY_STEPS.indexOf(die) - 1] ?? 6;
  if (stepped) { s[key] = next; await TBE.setSupply(actor, s); }
  return {
    die, roll: r, next, stepped, depleted: next === 0,
    text: key + " d" + die + ": rolled " + r.total +
      (stepped ? (next === 0 ? " &mdash; <b>exhausted</b>" : " &mdash; steps down to d" + next) : ", holds")
  };
};

/* Total lethal WP across locations. */
TBE.totalWp = (w) => Object.values(w || {}).reduce((a, b) => a + TBE.num(b.wp, 0), 0);

TBE.woundTable = function (w) {
  const keys = TBE.LOCATIONS.filter((k) => w[k] && (TBE.num(w[k].wp, 0) > 0 || TBE.num(w[k].imp, 0) > 0));
  if (!keys.length) return "<div><i>No wounds recorded.</i></div>";
  return '<table style="width:100%;border-collapse:collapse;font-size:12px">' +
    "<tr><th align='left'>Location</th><th align='left'>WP</th><th align='left'>State</th></tr>" +
    keys.map((k) => {
      const x = w[k];
      const tags = [];
      if (TBE.num(x.imp, 0) >= 2) tags.push("Shock");
      else if (TBE.num(x.imp, 0) === 1) tags.push("Impaired");
      if (x.septic) tags.push("<b>SEPTIC</b>");
      else if (x.inf) tags.push("<b>Infected</b>");
      if (x.rb !== undefined && x.rb !== null) tags.push("RB " + (x.rb >= 0 ? "+" : "") + x.rb);
      return "<tr><td>" + (TBE.LOC_LABELS[k] || k) + "</td><td>" + TBE.num(x.wp, 0) + "</td><td>" + (tags.join(", ") || "&mdash;") + "</td></tr>";
    }).join("") + "</table>";
};

/* ------------------------------------------------------------------ *
 *  Flag namespace
 *
 *  OWNERSHIP: TBE.FLAG_SCOPE in helpers/config.mjs. Foundry accepts only
 *  "core", "world", the system id and module ids as flag scopes, and
 *  setFlag/getFlag throw on anything else -- this system's id is
 *  "the-broken-empires", so "tbe" was never a scope it could use. Direct
 *  `update({"flags.tbe.x": ...})` writes never validated, which is why the
 *  split survived so long and why the one file that used the documented API
 *  was the one that broke.
 *
 *  READ TOLERANTLY, WRITE CANONICALLY. `flagOf` falls back to the legacy
 *  namespace so a world that has not run the 0.39.0 migration yet (or the
 *  legacy standalone pack, which has no system and therefore no migration at
 *  all) still finds its data; every WRITE goes to the current namespace, so
 *  the fallback drains rather than becoming permanent. A tolerant read with a
 *  tolerant write is how a split lasts forever.
 * ------------------------------------------------------------------ */
TBE.FLAG_SCOPE_FALLBACK = "the-broken-empires";
Object.defineProperty(TBE, "FLAG_SCOPE", {
  get() {
    return (typeof CONFIG !== "undefined" && CONFIG?.TBE?.FLAG_SCOPE) || TBE.FLAG_SCOPE_FALLBACK;
  }
});

/** Path for an update object: TBE.flagPath("weave") -> "flags.the-broken-empires.weave" */
TBE.flagPath = (key) => "flags." + TBE.FLAG_SCOPE + "." + key;

/** Current namespace first, legacy second. See the note above. */
TBE.flagOf = function (doc, key) {
  const cur = doc?.flags?.[TBE.FLAG_SCOPE]?.[key];
  return cur === undefined ? doc?.flags?.tbe?.[key] : cur;
};

/* Escape text bound for a chat card. Eight macros each define a private
 * `esc` with this exact body; those are left alone (they shadow harmlessly
 * and ripping them out is not this task -- logged in BACKLOG), but anything
 * new uses this one rather than adding a ninth. */
TBE.esc = (s) => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

/* ------------------------------------------------------------------ *
 *  Actor writes: who is acting, and may they?
 *
 *  OWNERSHIP: module/rules/permission.mjs, published on
 *  game.thebrokenempires.rules.permission. These defer at runtime the same
 *  way TBE.resolve/TBE.say/TBE.carryPool do, and keep a fallback body only
 *  for the Node harnesses and the legacy standalone pack, where no CONFIG
 *  exists. Do not add a second permission check in a macro: if a macro needs
 *  to know, it asks TBE.canWrite, and if it needs to change something, it
 *  goes through TBE.write and prints what comes back.
 * ------------------------------------------------------------------ */

const _perm = () =>
  (typeof game !== "undefined" && game?.thebrokenempires?.rules?.permission) || null;

/* May the current user change this actor? */
TBE.canWrite = function (actor) {
  const P = _perm();
  const user = (typeof game !== "undefined" && game?.user) || null;
  if (P) return P.canWrite(actor, user);
  if (!actor) return false;
  if (user && typeof actor.testUserPermission === "function") return !!actor.testUserPermission(user, "OWNER");
  /* ABSENT is not FALSE -- see permission.mjs. A plain object with no opinion
     about ownership is a harness stub or the legacy pack, not a Document
     refusing. Kept byte-for-byte equivalent to the owner's branch; if these
     two disagree, permission_check.mjs section 5 fails. */
  if ("isOwner" in actor || actor.isOwner !== undefined) return !!actor.isOwner;
  return true;
};

/* The actor this user is driving right now.
 *
 * This used to be `canvas.tokens?.controlled?.[0]?.actor ?? game.user?.character`,
 * which was exactly right while this was a solo system and silently wrong the
 * moment it was not: a player who left a creature's token selected got the
 * GM's creature, and every write in the macro they then opened aimed at an
 * actor they do not own. The selection is still preferred -- for a GM it is
 * the only way to say which of forty creatures they mean -- but it now has to
 * be a selection they can actually write to. See permission.mjs for the full
 * reasoning; the rule lives there so a check can execute it. */
/* Macros this system used to ship and has retired, with the redirect each
 * world copy gets. Owned by the system (module/helpers/retired-macros.mjs,
 * exposed as game.thebrokenempires.retiredMacros) because the world check
 * card needs it too and cannot read this library. TBE: Update Macros reads it
 * here. */
Object.defineProperty(TBE, "RETIRED_MACROS", {
  get: () => (typeof game !== "undefined" && game?.thebrokenempires?.retiredMacros) || {},
  enumerable: true
});

/* The portrait roster (v0.54.0): the GM's own image folders, rolled from.
 * Owned by the system (module/helpers/portraits.mjs); these two only read it.
 * portraitField() is the select a dialog shows ("" when no folders are set,
 * so a dialog without a roster looks exactly as it did); rollPortrait() turns
 * that select's answer into an image path, or null. */
TBE.portraitField = async function (label) {
  const P = (typeof game !== "undefined" && game?.thebrokenempires?.portraits) || null;
  if (!P) return "";
  let list = [];
  try { list = await P.roster(); } catch (e) { list = []; }
  if (!list.length) return "";
  const cols = P.collections(list);
  return '<label style="display:block">' + (label || "Portrait") + ': <select name="portrait" style="width:100%">' +
    '<option value="*">Roll from any collection (' + list.length + " images)</option>" +
    cols.map((c) => '<option value="' + TBE.esc(c) + '">Roll from ' + TBE.esc(c) + "</option>").join("") +
    '<option value="">None</option></select></label>';
};
TBE.rollPortrait = async function (answer) {
  const P = (typeof game !== "undefined" && game?.thebrokenempires?.portraits) || null;
  if (!P || answer === undefined || answer === null || answer === "") return null;
  try { return await P.random(answer === "*" ? "" : answer); } catch (e) { return null; }
};

TBE.me = function () {
  const P = _perm();
  const controlled = (typeof canvas !== "undefined" && canvas?.tokens?.controlled) || [];
  const assigned = (typeof game !== "undefined" && game?.user?.character) || null;
  const user = (typeof game !== "undefined" && game?.user) || null;
  if (P) return P.pickActor({ controlled, assigned, user }).actor;
  const writable = controlled.map((t) => t?.actor).filter(Boolean).find((a) => TBE.canWrite(a));
  if (writable) return writable;
  return assigned ?? controlled[0]?.actor ?? null;
};

/* The same pick, with its reasoning, for a caller that wants to say "you had
 * the Bandit selected, so this was rolled for Elspeth instead" rather than
 * quietly switching actors. */
TBE.whoAmI = function () {
  const P = _perm();
  const controlled = (typeof canvas !== "undefined" && canvas?.tokens?.controlled) || [];
  const assigned = (typeof game !== "undefined" && game?.user?.character) || null;
  const user = (typeof game !== "undefined" && game?.user) || null;
  if (P) return P.pickActor({ controlled, assigned, user });
  return { actor: TBE.me(), reason: "fallback" };
};

/* Write to an actor, or report why not. Returns { ok, notice, error }.
 *
 * The contract that matters: when `ok` is false, `notice` is a sentence the
 * player should be shown, and the change did NOT happen. A macro that writes
 * `body += r.ok ? "1 Resolve spent." : r.notice` is correct. A macro that
 * ignores the return value and asserts the cost anyway is the bug this
 * replaced -- see permission.mjs's header for what that looked like. */
TBE.write = async function (actor, changes, what) {
  const P = _perm();
  const user = (typeof game !== "undefined" && game?.user) || null;
  const notify = (msg) => { try { ui?.notifications?.warn(msg); } catch (e) {} };
  if (P) return P.applyWrite(actor, changes, { what, user, notify });
  if (!actor) return { ok: false, notice: "No actor to change.", error: null };
  if (!TBE.canWrite(actor)) {
    const notice = "You do not own " + (actor.name || "that actor") + ", so " + (what || "the change") +
      " was not applied. Ask the GM to apply it.";
    notify(notice);
    return { ok: false, notice, error: null };
  }
  try { await actor.update(changes); return { ok: true, notice: null, error: null }; }
  catch (err) {
    const notice = (what || "The change") + " could not be saved to " + actor.name + ": " + (err?.message ?? err);
    notify(notice);
    return { ok: false, notice, error: err };
  }
};

/* The same, for an embedded Item. Permission on an Item is its parent
 * actor's permission. */
TBE.writeItem = async function (item, changes, what) {
  const P = _perm();
  const user = (typeof game !== "undefined" && game?.user) || null;
  const notify = (msg) => { try { ui?.notifications?.warn(msg); } catch (e) {} };
  if (P) return P.applyItemWrite(item, changes, { what, user, notify });
  if (!item) return { ok: false, notice: "No item to change.", error: null };
  const owner = item.parent ?? item;
  if (!TBE.canWrite(owner)) {
    const notice = "You do not own " + (owner?.name || item.name) + ", so " + (what || "the change") +
      " was not applied. Ask the GM to apply it.";
    notify(notice);
    return { ok: false, notice, error: null };
  }
  try { await item.update(changes); return { ok: true, notice: null, error: null }; }
  catch (err) {
    const notice = (what || "The change") + " could not be saved to " + item.name + ": " + (err?.message ?? err);
    notify(notice);
    return { ok: false, notice, error: err };
  }
};

/* Run another TBE macro by name, from inside a macro. `game.macros.getName`
 * only searches the WORLD macro directory, which stays empty until someone
 * drags the whole "TBE Tools" compendium folder into it -- a one-time
 * setup step nothing in this system actually performs, so a fresh install
 * (or a player who only dragged one or two macros to their hotbar) has every
 * game.macros lookup fail silently. This is very likely why Finish Character
 * never appeared after Character Wizard: the handoff looked up a macro that
 * was never in game.macros to begin with. Falls back to the compendium
 * itself, which works regardless of whether anything was ever imported.
 * Returns true if a macro was found and executed, false if not found. */
/* Shared Talent-purchase eligibility (p.161: race exclusivity, named
 * prerequisites, creation-only, already-taken-and-not-repeatable). TBE:
 * Talents and TBE: Finish Character's Talents tab each used to hand-copy
 * this same check, which meant a single errata fix to one Talent's
 * prerequisite had to be made twice and could silently drift. One copy now,
 * called from both. */
/* opts.ownedItems (the actor's actual Talent Items) lets the check see how
 * many ranks of a repeatable Talent are already bought, so a purchase past
 * the book's cap ("Can be purchased up to three times") is refused before the
 * XP is totalled rather than bumping a counter past the rules. Callers that
 * only have names keep the old behaviour. */
TBE.talentEligibility = function (catalogue, ownedNames, race, allRaces, opts) {
  const raceRec = (allRaces || []).find((r) => r.name === race) || null;
  const myExclusive = new Set((raceRec?.exclusiveTalents ?? []).map((t) => t.toLowerCase()));
  const allExclusive = new Set((allRaces || []).flatMap((r) => r.exclusiveTalents || []).map((t) => t.toLowerCase()));
  const catalogueNames = catalogue.map((t) => t.name.toLowerCase()).filter((n) => n.length > 4).sort((a, b) => b.length - a.length);
  /* Some Talents' own "Requires ..." text explicitly says another Talent is
   * NOT needed -- Weapon Of Faith reads "...a faithful adherent of a god
   * (you do not require the Godbound Talent)". A plain substring match still
   * finds "Godbound" inside that parenthetical and blocks the Talent for
   * exactly the character the sentence says doesn't need it. Strip a
   * "(... not require ...)" negation clause before searching for a named
   * Talent -- single owner for this so missingPrereq() (the hard block
   * below) and softRequirement() (tbe-talents.js's informational note for
   * non-Talent prereqs) can't drift, which is the same shape of bug this
   * project keeps finding when one rule has two homes. */
  const stripNegation = (text) => String(text || "").toLowerCase().replace(/\([^)]*\bnot require[^)]*\)/g, "");
  const missingPrereq = (t) => {
    if (!t.requires) return null;
    const req = stripNegation(t.requires);
    const named = catalogueNames.find((n) => req.includes(n) && n !== t.name.toLowerCase());
    if (!named) return null;
    return ownedNames.has(named) ? null : t.requires;
  };
  /* How many ranks of this Talent the character already has, and the book's
   * ceiling for it. The ceiling itself is owned by the system
   * (CONFIG.TBE.rankCap, helpers/config.mjs), which is also what scales the
   * Talent's ActiveEffect, so the number that gates the purchase and the
   * number that pays out can't disagree. */
  const ownedItems = (opts && opts.ownedItems) || null;
  const rankState = (t) => {
    if (!ownedItems) return null;
    const item = ownedItems.find((i) => String(i.name).toLowerCase() === t.name.toLowerCase());
    if (!item) return null;
    const cap = (typeof CONFIG !== "undefined" && CONFIG.TBE && CONFIG.TBE.rankCap)
      ? CONFIG.TBE.rankCap(t.rank) : Infinity;
    return { cap, ranks: TBE.num(item.system?.ranks, 1) };
  };
  const atRankCap = (t) => {
    if (t.rank === "once" || t.rank === "per-skill") return null;
    const st = rankState(t);
    return st && st.ranks >= st.cap ? "already at its maximum of " + st.cap : null;
  };
  const blockedReason = (t) => {
    if (allExclusive.has(t.name.toLowerCase()) && !myExclusive.has(t.name.toLowerCase())) return "exclusive to another race";
    if (t.creationOnly) return "character creation only";
    if (ownedNames.has(t.name.toLowerCase()) && t.rank === "once") return "already taken";
    const capped = atRankCap(t);
    if (capped) return capped;
    const miss = missingPrereq(t);
    return miss ? "requires " + miss : null;
  };
  return { blockedReason, missingPrereq, catalogueNames, stripNegation, atRankCap, rankState };
};

/* ------------------------------------------------------------------ */
/* Character <-> sheet exchange. THE OWNER of three formats and the one */
/* planner and writer they all go through:                              */
/*   TBE-CSV v1  one row per fact: section, name, value, expertise, note */
/*   Creator     Vasco Brown's "Character Creator" v0.6.5, its           */
/*               "Character Sheet" tab downloaded as CSV (read only)     */
/*   PDF         the official fillable B/W character sheet v13, by its   */
/*               567 named form fields (filled on export, read on import)*/
/* Creator and PDF are converted to TBE-CSV rows first, so there is one  */
/* planner (TBE.sheetCsv.plan) and one writer (TBE.sheetCsv.apply).      */
/*                                                                      */
/* Import is conservative on purpose. It never deletes anything (rows   */
/* missing from the file are reported, not removed), never guesses a    */
/* skill's category (a name outside the catalogue needs its group in    */
/* the note, or it is reported and skipped: guessing a heading is the   */
/* Adventuring bug again), and writes each field separately so one bad  */
/* value cannot sink the rest.                                          */
/* ------------------------------------------------------------------ */
TBE.sheetCsv = {};
TBE.sheetCsv.FORMAT = "TBE-CSV";
TBE.sheetCsv.VERSION = 1;
TBE.sheetCsv.HEADER = ["section", "name", "value", "expertise", "note"];
/* The actor fields the file carries: [row name, document path, kind]. */
TBE.sheetCsv.FIELDS = [
  ["name", "name", "text"],
  ["race", "system.race", "text"],
  ["culture", "system.culture", "text"],
  ["career", "system.career", "text"],
  ["size", "system.size", "text"],
  ["silver", "system.silver", "int"],
  ["status", "system.status", "int"],
  ["xp available", "system.experience.available", "int"],
  ["xp earned", "system.experience.earned", "int"],
  ["death threshold", "system.deathThreshold.max", "int"],
  ["resolve", "system.resolve.max", "int"],
  ["toughness", "system.toughness", "int"],
  ["initiative", "system.initiative", "int"],
  ["fraying", "system.fraying", "int"],
  ["deity", "system.deity", "text"]
];
TBE.sheetCsv.ITEM_TYPES = ["weapon", "armor", "shield"];
TBE.sheetCsv.LOC_KEYS = ["head", "body", "rArm", "lArm", "rLeg", "lLeg"];

const _path = (o, p) => p.split(".").reduce((a, k) => (a == null ? a : a[k]), o);
const _norm = (s) => String(s ?? "").toLowerCase().replace(/^\s*(bind|strand)\s*:\s*/, "").replace(/[^a-z0-9]+/g, "");

/* Spellings other sheets use for the same thing. Only for names that can be
 * matched no other way; everything else goes through matchName's rules. */
TBE.sheetCsv.ALIASES = {
  decieve: "Deceive", slightofhand: "Sleight of Hand", brassknucles: "Brass Knuckles",
  parryingdager: "Parrying Dagger", replaced: "The Replaced", dimunitive: "Diminutive",
  marchant: "Merchant", longsword1handed: "Longsword, used 1H", longsword2handed: "Longsword, used 2H",
  fistskicks: "Fists / Kicks"
};

/* The one candidate a name means, or null. Exact (ignoring case and
 * punctuation) first, then an alias, then "X (thrown)" as "X, thrown", then
 * one part of a "Broadsword / Mace / Scimitar / Flail" style entry. Never a
 * nearest guess: an unmatched name is reported, not approximated. */
TBE.sheetCsv.matchName = function (name, candidates) {
  const n = _norm(name);
  if (!n) return null;
  const byNorm = new Map(candidates.map((c) => [_norm(c), c]));
  if (byNorm.has(n)) return byNorm.get(n);
  const alias = TBE.sheetCsv.ALIASES[n];
  if (alias && byNorm.has(_norm(alias))) return byNorm.get(_norm(alias));
  const thrown = /^(.*)\(thrown\)\s*$/i.exec(String(name));
  if (thrown && byNorm.has(_norm(thrown[1] + " thrown"))) return byNorm.get(_norm(thrown[1] + " thrown"));
  const parts = candidates.filter((c) => /\s\/\s/.test(c) && c.split(/\s*\/\s*/).some((p) => _norm(p) === n));
  return parts.length === 1 ? parts[0] : null;
};

/* The rows for one actor. Skills come from TBE.allSkills, so the file lists
 * the whole catalogue (untrained at 20, noted), the same answer the printed
 * sheet gives. */
TBE.sheetCsv.rowsFor = function (actor) {
  const rows = [TBE.sheetCsv.HEADER.slice()];
  rows.push(["meta", "format", TBE.sheetCsv.FORMAT, String(TBE.sheetCsv.VERSION), ""]);
  for (const [name, path] of TBE.sheetCsv.FIELDS) {
    const v = _path(actor, path);
    rows.push(["actor", name, v == null ? "" : String(v), "", ""]);
  }
  for (const s of TBE.allSkills(actor)) {
    const notes = [];
    if (!s.trained) notes.push("untrained");
    if (s.savvy) notes.push("savvy");
    if (s.group && !TBE.skillGroup(s.name)) notes.push("group " + s.group);
    rows.push(["skill", s.name, String(s.value), s.expertise ? String(s.expertise) : "", notes.join("; ")]);
  }
  for (const st of TBE.strands(actor)) rows.push(["strand", st.name, String(st.level), "", st.thin ? "thin" : ""]);
  for (const i of actor?.items ?? []) {
    if (i.type === "talent") rows.push(["talent", i.name, String(TBE.num(i.system?.ranks, 1)), "", i.system?.specialization || ""]);
  }
  for (const i of actor?.items ?? []) {
    if (!TBE.sheetCsv.ITEM_TYPES.includes(i.type)) continue;
    const locs = i.type === "armor" ? TBE.sheetCsv.LOC_KEYS.filter((k) => i.system?.locations?.[k]) : [];
    rows.push(["item", i.name, i.type, "", locs.length ? "locations " + locs.join(",") : ""]);
  }
  return rows;
};

TBE.sheetCsv.toCsv = function (rows) {
  const cell = (c) => {
    const s = String(c ?? "");
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
};

/* CSV or TSV (what Google Sheets puts on the clipboard), quoted or not.
 * `keepBlank` keeps empty rows and cells, which a fixed-position layout
 * (the Creator) needs to count rows by. */
TBE.sheetCsv.parse = function (text, keepBlank = false) {
  const src = String(text ?? "").replace(/^﻿/, "");
  const first = src.split(/\r?\n/)[0] || "";
  const delim = first.indexOf("\t") > -1 ? "\t" : ",";
  const rows = [];
  let row = [], cell = "", q = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (q) {
      if (ch === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"' && cell === "") q = true;
    else if (ch === delim) { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  const trimmed = rows.map((r) => r.map((c) => c.trim()));
  return keepBlank ? trimmed : trimmed.filter((r) => r.some((c) => c !== ""));
};

/* Which of the three formats some text or bytes are. */
TBE.sheetCsv.detect = function (text) {
  const t = String(text ?? "");
  if (t.startsWith("%PDF")) return "pdf";
  const rows = TBE.sheetCsv.parse(t, true);
  if (rows.some((r) => r[0]?.toLowerCase() === "meta" && r[2] === TBE.sheetCsv.FORMAT)) return "tbe-csv";
  if (TBE.sheetCsv.creatorCheck(rows).ok) return "creator";
  return "unknown";
};

/* ---- Vasco Brown's Character Creator, "Character Sheet" tab ---------- */
/* v0.6.5 and v0.7.0 (2026-09-26) share one layout, cell for cell: checked */
/* by diffing the two (sheet_exchange_check.mjs 6b).                        */
/* Fixed cells, pinned by the labels around them: if a later version moves */
/* anything, the check fails and nothing is read, rather than reading the  */
/* wrong cells.                                                            */
const _cell = (rows, ref) => {
  const m = /^([A-Z]+)(\d+)$/.exec(ref);
  const col = m[1].split("").reduce((a, ch) => a * 26 + ch.charCodeAt(0) - 64, 0) - 1;
  return (rows[Number(m[2]) - 1] ?? [])[col] ?? "";
};
TBE.sheetCsv.CREATOR_LABELS = {
  A2: "Name", A3: "Race", A9: "Previous Career", A10: "Size", A20: "Max Resolve", A25: "Death Threshold",
  A28: "Combat", D28: "Adventuring", G28: "Social", J28: "Lore", M28: "Binds", R28: "Strands",
  M34: "Language", A41: "Name", R1: "Talents", D23: "Silver Pieces"
};
TBE.sheetCsv.creatorCheck = function (rows) {
  const wrong = Object.entries(TBE.sheetCsv.CREATOR_LABELS)
    .filter(([ref, label]) => _cell(rows, ref).toLowerCase() !== label.toLowerCase())
    .map(([ref, label]) => ref + " should read \"" + label + "\" but reads \"" + _cell(rows, ref) + "\"");
  return { ok: !wrong.length, wrong };
};
TBE.sheetCsv.fromCreator = function (rows) {
  const chk = TBE.sheetCsv.creatorCheck(rows);
  if (!chk.ok) return { rows: null, problems: ["This does not look like the Character Creator (v0.6.5 or v0.7.0) \"Character Sheet\" tab: " + chk.wrong.slice(0, 3).join("; ")] };
  const c = (ref) => _cell(rows, ref);
  const blank = (v) => !v || /^(none|choose one|n\/a\*?)$/i.test(v) || /^_+-wise$/i.test(v);
  const out = [TBE.sheetCsv.HEADER.slice(), ["meta", "format", TBE.sheetCsv.FORMAT, "1", "from Character Creator v0.6.5/v0.7.0"]];
  const problems = [];
  const field = (name, v) => { if (!blank(v)) out.push(["actor", name, String(v).trim(), "", ""]); };
  field("name", c("B2"));
  const race = TBE.sheetCsv.matchName(c("B3"), ["Human", "Half-Orc", "Dwarf", "Ogre", "Bolg Fiir", "The Replaced"]);
  if (race) field("race", race); else if (!blank(c("B3"))) problems.push("Race \"" + c("B3") + "\" is not one the system knows.");
  field("culture", c("B7"));
  const career = TBE.sheetCsv.matchName(c("B9"), ["Warrior", "Rogue", "Ranger", "Speaker", "Bard", "Civilian", "Loremaster", "Merchant", "Godbound", "Spellweaver"]);
  field("career", career || c("B9"));
  const size = TBE.sheetCsv.matchName(c("B10"), ["Minute", "Diminutive", "Tiny", "Little", "Small", "Medium", "Large", "Huge", "Massive", "Gargantuan", "Colossal"]);
  if (size) field("size", size);
  field("xp available", c("B11"));
  field("resolve", c("B20"));
  field("initiative", c("B21"));
  field("toughness", c("B24"));
  field("death threshold", c("B25"));
  field("silver", c("F23"));
  field("status", c("F24"));
  /* Skill blocks: name, %, EX. A trailing "*" is the Creator's Savvy mark. */
  const skill = (nameRef, pctRef, exRef, group) => {
    let n = c(nameRef);
    if (blank(n)) return;
    const savvy = /\*\s*$/.test(n);
    n = n.replace(/\*\s*$/, "").trim();
    const known = TBE.sheetCsv.matchName(n, TBE.SKILL_ALL);
    const name = known || n;
    const g = known ? null : (/-wise$/i.test(n) ? "Wise" : group);
    const notes = [savvy ? "savvy" : "not savvy"];
    if (g) notes.push("group " + g);
    out.push(["skill", name, c(pctRef), c(exRef) === "0" ? "" : c(exRef), notes.join("; ")]);
  };
  for (let r = 29; r <= 39; r++) {
    skill("A" + r, "B" + r, "C" + r, "Combat");
    skill("D" + r, "E" + r, "F" + r, "Adventuring");
    skill("G" + r, "H" + r, "I" + r, "Social");
    skill("J" + r, "K" + r, "L" + r, "Lore");
  }
  for (let r = 29; r <= 33; r++) skill("M" + r, "P" + r, "Q" + r, "Bind");
  /* The Creator's untouched native-language slot reads "Native Languge"
     (its spelling). It is a real language at 70, just not named yet: keep
     the points under a clean name and say so, rather than import the typo. */
  for (let r = 35; r <= 39; r++) {
    const raw = c("M" + r).replace(/\*\s*$/, "").trim();
    if (/^native langu?a?ge?$/i.test(raw) && Number(c("P" + r)) > 0) {
      out.push(["skill", "Native Language", c("P" + r), c("Q" + r) === "0" ? "" : c("Q" + r),
        (/\*\s*$/.test(c("M" + r)) ? "savvy" : "not savvy") + "; group Language"]);
      problems.push("The native language is not named on the sheet (\"" + raw + "\", " + c("P" + r) + "%): imported as \"Native Language\", rename it on the sheet.");
      continue;
    }
    skill("M" + r, "P" + r, "Q" + r, /-wise/i.test(c("M" + r)) ? "Wise" : "Language");
  }
  for (let r = 29; r <= 38; r++) {
    /* The Strands column carries the Savvy "*" too (the cell formula appends it). */
    const n = c("R" + r).replace(/\*\s*$/, "").trim(), lvl = c("S" + r);
    if (n && Number(lvl) > 0) out.push(["strand", n, lvl, "", ""]);
  }
  if (Number(c("S39")) > 0) out.push(["skill", "Piety", c("S39"), "", "group Lore"]);
  for (let r = 2; r <= 21; r++) if (!blank(c("R" + r))) out.push(["talent", c("R" + r).trim(), "1", "", ""]);
  for (let r = 42; r <= 45; r++) if (!blank(c("A" + r))) out.push(["item", c("A" + r).trim(), "weapon", "", ""]);
  const armour = {};
  for (const [ref, loc] of [["J3", "body"], ["O3", "head"], ["J12", "rArm"], ["O12", "lArm"], ["J21", "rLeg"], ["O21", "lLeg"]]) {
    if (!blank(c(ref))) (armour[c(ref).trim()] ??= []).push(loc);
  }
  for (const [name, locs] of Object.entries(armour)) out.push(["item", name, "armor", "", "locations " + locs.join(",")]);
  if (!blank(c("D7"))) out.push(["item", c("D7").trim(), "shield", "", ""]);
  return { rows: out, problems };
};

/* ---- The official fillable B/W character sheet (v13) ---- */
TBE.sheetPdf = {};
/* Catalogue skill -> [percent field, expertise field, Savvy checkbox].
 * The Savvy boxes are numbered down each column of the printed sheet, and
 * the Lore column prints Craft: Practical ABOVE Craft: Artistic, so this is a
 * table and not an index into TBE.SKILL_GROUPS. */
TBE.sheetPdf.SKILLS = {
  "Dodge": ["dodge_pct", "dodge_ex", "Savvy_1"], "Melee: Light": ["melee_light_pct", "melee_light_ex", "Savvy_2"],
  "Melee: Medium": ["melee_medium_pct", "melee_medium_ex", "Savvy_3"], "Melee: Heavy": ["melee_heavy_pct", "melee_heavy_ex", "Savvy_4"],
  "Might": ["might_pct", "might_ex", "Savvy_5"], "Missile": ["missile_pct", "missile_ex", "Savvy_6"], "Thrown": ["thrown_pct", "thrown_ex", "Savvy_7"],
  "Athletics": ["athletics_pct", "athletics_ex", "Savvy2_1"], "Endurance": ["endurance_pct", "endurance_ex", "Savvy2_2"],
  "Locks & Traps": ["locks_traps_pct", "locks_traps_ex", "Savvy2_3"], "Perception": ["perception_pct", "perception_ex", "Savvy2_4"],
  "Ride": ["ride_pct", "ride_ex", "Savvy2_5"], "Sail/Boat": ["sail_boat_pct", "sail_boat_ex", "Savvy2_6"],
  "Sleight of Hand": ["sleight_of_hand_pct", "sleight_of_hand_ex", "Savvy2_7"], "Stealth": ["stealth_pct", "stealth_ex", "Savvy2_8"],
  "Survival": ["survival_pct", "survival_ex", "Savvy2_9"], "Track": ["track_pct", "track_ex", "Savvy2_10"],
  "Willpower": ["willpower_pct", "willpower_ex", "Savvy2_11"],
  "Deceive": ["deceive_pct", "deceive_ex", "Savvy3_1"], "Insight": ["insight_pct", "insight_ex", "Savvy3_2"],
  "Inspire": ["inspire_pct", "inspire_ex", "Savvy3_3"], "Intimidate": ["intimidate_pct", "intimidate_ex", "Savvy3_4"],
  "Perform": ["perform_pct", "perform_ex", "Savvy3_5"], "Persuade": ["persuade_pct", "persuade_ex", "Savvy3_6"],
  "Protocol": ["protocol_pct", "protocol_ex", "Savvy3_7"], "Seduce": ["seduce_pct", "seduce_ex", "Savvy3_8"], "Wit": ["wit_pct", "wit_ex", "Savvy3_9"],
  "Ancient Lore": ["ancient_lore_pct", "ancient_lore_ex", "Savvy4_1"], "Arcana": ["arcana_pct", "arcana_ex", "Savvy4_2"],
  "Commerce": ["commerce_pct", "commerce_ex", "Savvy4_3"], "Common Lore": ["common_lore_pct", "common_lore_ex", "Savvy4_4"],
  "Craft: Practical": ["craft_practical_pct", "craft_practical_ex", "Savvy4_5"], "Craft: Artistic": ["craft_art_pct", "craft_art_ex", "Savvy4_6"],
  "Divinity": ["divinity_pct", "divinity_ex", "Savvy4_7"], "Heal": ["heal_pct", "heal_ex", "Savvy4_8"],
  "Naturewise": ["naturewise_pct", "naturewise_ex", "Savvy4_9"], "Streetwise": ["streetwise_pct", "streetwise_ex", "Savvy4_10"]
};
TBE.sheetPdf.BINDS = { Change: ["change_pct", "change_ex", "Savvy5_1"], Conjure: ["conjure_pct", "conjure_ex", "Savvy5_2"],
  Control: ["control_pct", "control_ex", "Savvy5_3"], Destroy: ["destroy_pct", "destroy_ex", "Savvy5_4"], Witness: ["witness_pct", "witness_ex", "Savvy5_5"] };
TBE.sheetPdf.LANGUAGES = [["Language_1_name", "language_pct", "language_ex", "Savvy5_6"], ["Language_2_name", "language2_pct", "language2_ex", "Savvy5_7"],
  ["Language_3_name", "language3_pct", "language3_ex", "Savvy5_8"]];
/* Three write-in rows: one under Lore, two under the Binds column. */
TBE.sheetPdf.WISES = [["lore_wise_name", "lore_wise_custom_pct", "lore_wise_custom_ex", "Savvy4_11"],
  ["bind_wise_1_name", "bind_wise_1_pct", "bind_wise_1_ex", "Savvy5_9"], ["bind_wise_2_name", "bind_wise_2_pct", "bind_wise_2_ex", "Savvy5_10"]];
TBE.sheetPdf.STRANDS = ["Air", "Beast", "Body", "Earth", "Fire", "Plant", "Spheres", "Spirit", "Thought", "Water"];
/* Slots the Character Wizard creates empty for the player to rename. At zero
 * they are not skills yet, so they do not belong on a printed sheet (and used
 * to crowd out the three write-in rows). */
TBE.sheetPdf.PLACEHOLDER = /^(wise: subject \d+|career wise\/language \d+|bind: name it \d+|cultural extra language)$/i;
TBE.sheetPdf.LOCS = { head: ["head", "head_imp1", "head"], body: ["body", "body_imp", "body"], rArm: ["right_arm", "right_arm_imp", "rarm"],
  lArm: ["left_arm", "left_arm_imp", "larm"], rLeg: ["right_leg", "right_leg_imp", "rleg"], lLeg: ["left_leg", "left_leg_imp", "lleg"] };

/* Every field to fill, as { text: {field: string}, check: {field: bool} }.
 * READS, never derives (the Export Sheets rule): derived numbers come off
 * the actor, where prepareDerivedData put them. */
TBE.sheetPdf.fieldsFor = function (actor) {
  const s = actor?.system ?? {};
  const text = {}, check = {}, overflow = [];
  const put = (f, v) => { if (v !== undefined && v !== null && v !== "") text[f] = String(v); };
  put("name", actor?.name); put("page2_name", actor?.name);
  put("race", s.race); put("culture", s.culture); put("previous_career", s.career); put("size", s.size);
  put("xp", s.experience?.available);
  (s.personalityTraits ?? []).slice(0, 3).forEach((t, i) => put("personality_trait_" + (i + 1), t));
  const all = TBE.allSkills(actor);
  const byName = new Map(all.map((x) => [_norm(x.name), x]));
  const skillOut = (sk, [pct, ex, sv]) => {
    put(pct, sk.value);
    if (TBE.num(sk.expertise, 0) >= 2) put(ex, sk.expertise);
    check[sv] = !!sk.savvy;
  };
  for (const [name, f] of Object.entries(TBE.sheetPdf.SKILLS)) { const sk = byName.get(_norm(name)); if (sk) skillOut(sk, f); }
  for (const b of TBE.binds(actor) ?? []) {
    const f = TBE.sheetPdf.BINDS[TBE.sheetCsv.matchName(b.name, Object.keys(TBE.sheetPdf.BINDS))];
    const sk = all.find((x) => _norm(x.name) === _norm(b.name));
    if (f && sk) skillOut(sk, f); else overflow.push("Bind " + b.name + " " + b.value);
  }
  const langs = all.filter((x) => x.group === "Language" && !(TBE.sheetPdf.PLACEHOLDER.test(x.name) && !TBE.num(x.value, 0)));
  langs.forEach((l, i) => { const f = TBE.sheetPdf.LANGUAGES[i]; if (f) { put(f[0], l.name); skillOut(l, f.slice(1)); } else overflow.push("Language " + l.name + " " + l.value); });
  const wises = all.filter((x) => x.group === "Wise" && !(TBE.sheetPdf.PLACEHOLDER.test(x.name) && !TBE.num(x.value, 0)));
  wises.forEach((w, i) => { const f = TBE.sheetPdf.WISES[i]; if (f) { put(f[0], w.name); skillOut(w, f.slice(1)); } else overflow.push(w.name + " " + w.value); });
  const piety = all.find((x) => /^piety$/i.test(x.name));
  if (piety) put("starting_piety_level", piety.value);
  const strands = TBE.strands(actor) ?? [];
  TBE.sheetPdf.STRANDS.forEach((n, i) => {
    const st = strands.find((x) => _norm(x.name) === _norm(n));
    if (st) { put(n.toLowerCase() + "_level", st.level); check["thin_strand_" + (i + 1)] = !!st.thin; }
  });
  put("fraying_points", s.fraying);
  put("max_resolve", s.resolve?.max); put("initiative", s.initiative); put("init_penalty", s.armorInitPenalty);
  put("total_initiative", s.initiativeEffective); put("toughness", s.toughness); put("death_threshold", s.deathThreshold?.max);
  put("lethality_level", s.lethalityLevel); put("total_lethal_wp", s.totalWp);
  check.shock = !!s.shock;
  /* Armour and wounds by location. Several pieces covering one location is
     not legal (p.140: "may not be layered"), so the strongest one is shown. */
  const armor = (actor?.items ?? []).filter((i) => i.type === "armor" && i.system?.equipped !== false);
  const wounds = TBE.wounds(actor) ?? {};
  for (const [key, [p, imp, box]] of Object.entries(TBE.sheetPdf.LOCS)) {
    const pieces = armor.filter((a) => a.system?.locations?.[key]).sort((a, b) => TBE.num(b.system?.ap, 0) - TBE.num(a.system?.ap, 0));
    if (pieces[0]) { put(p + "_armor", pieces[0].name); put(p + "_ap", TBE.num(pieces[0].system?.ap, 0)); put(p + "_bulk", pieces[0].system?.bulk); }
    const w = wounds[key] || {};
    if (TBE.num(w.wp, 0) > 0) put(p + "_wp_1", w.wp);
    check[imp] = TBE.num(w.imp, 0) >= 1;
    check[box + "_INF1"] = !!(w.inf || w.septic);
  }
  const shield = (actor?.items ?? []).find((i) => i.type === "shield");
  if (shield) {
    put("shield_size", shield.name); put("shield_ap", shield.system?.ap); put("shield_enc", shield.system?.enc);
    if (typeof shield.system?.shb === "number") put("shield_shb", shield.system.shb);
  }
  const weapons = (actor?.items ?? []).filter((i) => i.type === "weapon");
  weapons.forEach((w, i) => {
    if (i >= 4) { overflow.push("Weapon " + w.name); return; }
    const p = "weapon_" + (i + 1) + "_";
    const sk = byName.get(_norm(w.system?.skillName || w.name));
    put(p + "name_type", w.name + (w.system?.skillName ? " (" + w.system.skillName + ")" : ""));
    if (sk) put(p + "att", sk.value);
    put(p + "dmg", w.system?.dmg); put(p + "cl", w.system?.cl); put(p + "cs", w.system?.cs);
    put(p + "dis", w.system?.dis); put(p + "t", w.system?.t); put(p + "enc", w.system?.enc);
    put(p + "notes", [w.system?.ranged ? "Ranged" : "", w.system?.nl ? "NL" : ""].filter(Boolean).join(", "));
  });
  const talents = (actor?.items ?? []).filter((i) => i.type === "talent");
  talents.forEach((t, i) => {
    const label = t.name + (TBE.num(t.system?.ranks, 1) > 1 ? " x" + TBE.num(t.system.ranks, 1) : "");
    if (i < 10) put("talent_" + (i + 1), label); else overflow.push("Talent " + label);
  });
  const threads = (actor?.items ?? []).filter((i) => i.type === "thread");
  threads.slice(0, 13).forEach((t, i) => put("thread_" + (i + 1), t.name));
  const goals = s.goals ?? [];
  goals.slice(0, 12).forEach((g, i) => {
    const f = (i < 6 ? "goal_left_" + (i + 1) : "goal_right_" + (i - 5));
    put(f, g.text); check[f + "_shared"] = g.kind === "shared";
  });
  const sup = s.supply ?? {};
  for (const k of ["gear", "ammo", "rations", "medical"]) if (sup[k]) put("supply_" + k, "d" + sup[k]);
  put("silver_pieces", s.silver); put("status", s.status);
  return { text, check, overflow };
};

/* PDF fields -> TBE-CSV rows, for the one planner. `get(name)` returns the
 * field's text ("" when empty), `on(name)` whether a box is ticked. */
TBE.sheetPdf.rowsFrom = function (get, on) {
  const out = [TBE.sheetCsv.HEADER.slice(), ["meta", "format", TBE.sheetCsv.FORMAT, "1", "from the fillable character sheet PDF"]];
  const problems = [];
  const field = (name, f) => { const v = String(get(f) ?? "").trim(); if (v) out.push(["actor", name, v, "", ""]); };
  field("name", "name"); field("culture", "culture"); field("career", "previous_career");
  const race = TBE.sheetCsv.matchName(get("race"), ["Human", "Half-Orc", "Dwarf", "Ogre", "Bolg Fiir", "The Replaced"]);
  if (race) out.push(["actor", "race", race, "", ""]); else if (String(get("race") ?? "").trim()) problems.push("Race \"" + get("race") + "\" is not one the system knows.");
  const size = TBE.sheetCsv.matchName(get("size"), ["Minute", "Diminutive", "Tiny", "Little", "Small", "Medium", "Large", "Huge", "Massive", "Gargantuan", "Colossal"]);
  if (size) out.push(["actor", "size", size, "", ""]);
  field("xp available", "xp"); field("resolve", "max_resolve"); field("initiative", "initiative");
  field("toughness", "toughness"); field("death threshold", "death_threshold"); field("fraying", "fraying_points");
  field("silver", "silver_pieces"); field("status", "status");
  const skill = (name, [pct, ex, sv], group) => {
    const v = String(get(pct) ?? "").trim();
    if (!v) return;
    const notes = [on(sv) ? "savvy" : "not savvy"];
    if (group) notes.push("group " + group);
    out.push(["skill", name, v, String(get(ex) ?? "").trim(), notes.join("; ")]);
  };
  for (const [name, f] of Object.entries(TBE.sheetPdf.SKILLS)) skill(name, f);
  for (const [name, f] of Object.entries(TBE.sheetPdf.BINDS)) skill(name, f, "Bind");
  for (const [nameF, ...f] of TBE.sheetPdf.LANGUAGES) { const n = String(get(nameF) ?? "").trim(); if (n) skill(n, f, "Language"); }
  for (const [nameF, ...f] of TBE.sheetPdf.WISES) { const n = String(get(nameF) ?? "").trim(); if (n) skill(n, f, "Wise"); }
  const piety = String(get("starting_piety_level") ?? "").trim();
  if (Number(piety) > 0) out.push(["skill", "Piety", piety, "", "group Lore"]);
  TBE.sheetPdf.STRANDS.forEach((n, i) => {
    const lvl = String(get(n.toLowerCase() + "_level") ?? "").trim();
    if (Number(lvl) > 0) out.push(["strand", n, lvl, "", on("thin_strand_" + (i + 1)) ? "thin" : ""]);
  });
  for (let i = 1; i <= 10; i++) {
    const t = String(get("talent_" + i) ?? "").trim();
    if (t) out.push(["talent", t.replace(/\s+x\d+$/i, ""), (/\s+x(\d+)$/i.exec(t) || [0, "1"])[1], "", ""]);
  }
  for (let i = 1; i <= 4; i++) {
    const w = String(get("weapon_" + i + "_name_type") ?? "").trim();
    if (w) out.push(["item", w.replace(/\s*\([^)]*\)\s*$/, ""), "weapon", "", ""]);
  }
  const armour = {};
  for (const [key, [p]] of Object.entries(TBE.sheetPdf.LOCS)) {
    const n = String(get(p + "_armor") ?? "").trim();
    if (n && !/^none$/i.test(n)) (armour[n] ??= []).push(key);
  }
  for (const [n, locs] of Object.entries(armour)) out.push(["item", n, "armor", "", "locations " + locs.join(",")]);
  const sh = String(get("shield_size") ?? "").trim();
  if (sh && !/^none$/i.test(sh)) out.push(["item", sh, "shield", "", ""]);
  return { rows: out, problems };
};

/* pdf-lib ships inside the system (MIT, lib/pdf-lib.esm.min.js) and is only
 * loaded when a PDF is actually read or filled. */
TBE.pdfLib = async function () {
  const id = (typeof game !== "undefined" && game?.system?.id) || "the-broken-empires";
  let path = "systems/" + id + "/lib/pdf-lib.esm.min.js";
  /* getRoute honours a hosted world's route prefix; an absolute URL keeps
     the import from resolving against wherever the macro text came from. */
  try { if (typeof foundry !== "undefined" && foundry?.utils?.getRoute) path = foundry.utils.getRoute(path); } catch (e) {}
  const base = (typeof window !== "undefined" && window.location) ? window.location.href : "http://localhost/";
  return import(new URL(path, base).href);
};

/* What an import WOULD do, without doing it. Pure: tests run it on plain
 * objects, and the macro shows it to the user before anything is written. */
TBE.sheetCsv.plan = function (actor, rows) {
  const plan = { fields: [], skillUpdates: [], skillCreates: [], strandUpdates: [], strandCreates: [], talents: [], items: [], problems: [], notInFile: [] };
  const body = rows.slice();
  if (body.length && body[0][0]?.toLowerCase() === "section") body.shift();
  const meta = body.find((r) => r[0]?.toLowerCase() === "meta" && r[1]?.toLowerCase() === "format");
  if (!meta || meta[2] !== TBE.sheetCsv.FORMAT) {
    plan.problems.push("This is not a TBE-CSV file (no \"meta, format, TBE-CSV\" row). Export a character first to get the layout.");
    return plan;
  }
  if (TBE.num(meta[3], 0) > TBE.sheetCsv.VERSION) plan.problems.push("File is TBE-CSV v" + meta[3] + "; this system reads v" + TBE.sheetCsv.VERSION + ". Newer rows may be ignored.");
  const fieldByName = Object.fromEntries(TBE.sheetCsv.FIELDS.map((f) => [f[0], f]));
  const items = actor?.items ?? [];
  const own = new Map(items.filter((i) => i.type === "skill").map((i) => [_norm(i.name), i]));
  const ownStrands = new Map(items.filter((i) => i.type === "strand").map((i) => [_norm(i.name), i]));
  const seenSkills = new Set();
  for (const r of body) {
    const [section, name, value, ex, note] = [r[0]?.toLowerCase(), r[1] ?? "", r[2] ?? "", r[3] ?? "", r[4] ?? ""];
    if (!name || section === "meta") continue;
    if (section === "actor") {
      const f = fieldByName[name.toLowerCase()];
      if (!f) { plan.problems.push("Unknown actor field \"" + name + "\", skipped."); continue; }
      let v = value;
      if (f[2] === "int") {
        if (value === "") continue;
        v = Number(value);
        if (!Number.isInteger(v)) { plan.problems.push(name + ": \"" + value + "\" is not a whole number, skipped."); continue; }
      }
      const cur = _path(actor, f[1]);
      if (String(cur ?? "") !== String(v)) plan.fields.push({ label: name, path: f[1], from: cur, to: v });
    } else if (section === "skill") {
      const v = Number(value);
      if (!Number.isInteger(v) || v < 0) { plan.problems.push("Skill " + name + ": \"" + value + "\" is not a skill value, skipped."); continue; }
      const e = ex === "" ? 0 : Number(ex);
      if (!Number.isInteger(e) || e < 0 || e > 4 || e === 1) { plan.problems.push("Skill " + name + ": Expertise \"" + ex + "\" is not 0 or 2-4 (p.53), skipped."); continue; }
      /* Savvy only changes when the row says so either way. */
      const savvy = /(^|;)\s*not savvy\s*(;|$)/i.test(note) ? false : /(^|;)\s*savvy\s*(;|$)/i.test(note) ? true : null;
      seenSkills.add(_norm(name));
      const item = own.get(_norm(name));
      if (item) {
        const ch = {};
        if (TBE.num(item.system?.value, 0) !== v) ch["system.value"] = v;
        if (TBE.num(item.system?.expertise, 0) !== e) ch["system.expertise"] = e;
        if (savvy !== null && !!item.system?.savvy !== savvy) ch["system.savvy"] = savvy;
        if (Object.keys(ch).length) plan.skillUpdates.push({ item, name: item.name, changes: ch });
      } else if (v !== TBE.BASE_SKILL || e > 0 || savvy === true) {
        const m = /group\s+([A-Za-z]+)/i.exec(note);
        const group = TBE.skillGroup(name) || (m ? m[1] : null);
        if (!group) { plan.problems.push("Skill " + name + " is not in the catalogue and the row names no group (note \"group Wise\", \"group Language\"...), skipped."); continue; }
        /* Binds are named "Bind: X" on a sheet (TBE.binds strips it). */
        const itemName = group === "Bind" && !/^bind\s*:/i.test(name) ? "Bind: " + name : name;
        plan.skillCreates.push({ name: itemName, value: v, expertise: e, group, fighting: group === "Combat", savvy: savvy === true });
      }
    } else if (section === "strand") {
      const lvl = Number(value);
      if (!Number.isInteger(lvl) || lvl < 0) { plan.problems.push("Strand " + name + ": \"" + value + "\" is not a level, skipped."); continue; }
      const thin = /thin/i.test(note);
      const item = ownStrands.get(_norm(name));
      if (item) {
        const ch = {};
        if (TBE.num(item.system?.level, 0) !== lvl) ch["system.level"] = lvl;
        if (!!item.system?.thin !== thin) ch["system.thin"] = thin;
        if (Object.keys(ch).length) plan.strandUpdates.push({ item, name: item.name, changes: ch });
      } else plan.strandCreates.push({ name, level: lvl, thin });
    } else if (section === "talent") {
      if (!items.some((i) => i.type === "talent" && _norm(i.name) === _norm(name))) plan.talents.push({ name, ranks: Math.max(1, TBE.num(value, 1)) });
    } else if (section === "item") {
      const type = value.toLowerCase();
      if (!TBE.sheetCsv.ITEM_TYPES.includes(type)) { plan.problems.push("Item " + name + ": type \"" + value + "\" is not weapon, armor or shield, skipped."); continue; }
      const lm = /locations\s+([A-Za-z,\s]+)/i.exec(note);
      const locations = lm ? lm[1].split(/[,\s]+/).filter((k) => TBE.sheetCsv.LOC_KEYS.includes(k)) : [];
      if (!items.some((i) => i.type === type && _norm(i.name) === _norm(name))) plan.items.push({ name, type, locations });
    } else {
      plan.problems.push("Row \"" + r.join(", ") + "\" has an unknown section, skipped.");
    }
  }
  for (const [n, item] of own) if (!seenSkills.has(n)) plan.notInFile.push(item.name);
  return plan;
};

TBE.sheetCsv.isEmpty = (p) => !p.fields.length && !p.skillUpdates.length && !p.skillCreates.length &&
  !(p.strandUpdates?.length) && !(p.strandCreates?.length) && !p.talents.length && !p.items.length;

/* Carry out a plan. Every write goes through TBE.write / TBE.writeItem, and
 * Talents and gear come from the system's compendiums by name (matchName),
 * never invented. Returns { done: [...], failed: [...] }. */
TBE.sheetCsv.apply = async function (actor, plan) {
  const done = [], failed = [];
  for (const f of plan.fields) {
    if (f.path === "name" && actor.name === f.to) continue;
    const r = await TBE.write(actor, { [f.path]: f.to }, f.label);
    (r.ok ? done : failed).push(f.label + (r.ok ? "" : ": " + r.notice));
  }
  for (const u of [...plan.skillUpdates, ...(plan.strandUpdates ?? [])]) {
    const r = await TBE.writeItem(u.item, u.changes, u.name);
    (r.ok ? done : failed).push(u.name + (r.ok ? "" : ": " + r.notice));
  }
  const fromPack = async (packId, name, type) => {
    const pack = game.packs?.get(packId);
    if (!pack) return null;
    const idx = Array.from(await pack.getIndex()).filter((e) => !type || e.type === type);
    const hit = TBE.sheetCsv.matchName(name, idx.map((e) => e.name));
    if (!hit) return null;
    const doc = await pack.getDocument(idx.find((e) => e.name === hit)._id);
    return doc?.toObject?.() ?? null;
  };
  const creates = plan.skillCreates.map((s) => ({ name: s.name, type: "skill",
    system: { value: s.value, expertise: s.expertise, group: s.group, fighting: s.fighting, savvy: !!s.savvy } }));
  for (const st of plan.strandCreates ?? []) creates.push({ name: st.name, type: "strand", system: { level: st.level, thin: st.thin } });
  for (const t of plan.talents) {
    const d = await fromPack("the-broken-empires.tbe-talents", t.name, "talent");
    if (!d) { failed.push("Talent " + t.name + ": not found in the TBE Talents compendium"); continue; }
    delete d._id; d.system = Object.assign({}, d.system, { ranks: t.ranks });
    creates.push(d);
  }
  for (const it of plan.items) {
    const d = await fromPack("the-broken-empires.tbe-equipment", it.name, it.type);
    if (!d) { failed.push(it.type + " " + it.name + ": not found in the TBE Equipment compendium"); continue; }
    delete d._id;
    if (it.type === "armor" && it.locations?.length) {
      d.system = Object.assign({}, d.system, { locations: Object.fromEntries(TBE.sheetCsv.LOC_KEYS.map((k) => [k, it.locations.includes(k)])) });
    }
    creates.push(d);
  }
  if (creates.length) {
    if (!TBE.canWrite(actor)) failed.push(creates.length + " new item(s): you do not own " + actor.name);
    else {
      try { await actor.createEmbeddedDocuments("Item", creates); done.push(creates.length + " item(s) added"); }
      catch (e) { failed.push("adding items: " + (e?.message ?? e)); }
    }
  }
  return { done, failed };
};

TBE.runMacro = async function (name) {
  let m = game.macros?.getName?.(name);
  if (!m) {
    for (const pack of game.packs) {
      if (pack.documentName !== "Macro") continue;
      const hit = pack.index.find((e) => e.name === name);
      if (!hit) continue;
      m = await pack.getDocument(hit._id);
      break;
    }
  }
  if (!m) return false;
  await m.execute();
  return true;
};

/* Read a skill value off a real skill Item by name, tolerant of a trailing
 * "(Sub)" qualifier some maneuver/table text still writes (e.g. "Adventuring
 * (Endurance)" meaning the "Endurance" skill). */
TBE.skillNamed = function (actor, wanted) {
  const w = String(wanted).toLowerCase().trim();
  const inner = w.indexOf("(") > -1 ? w.slice(w.indexOf("(") + 1).replace(")", "").trim() : null;
  for (const i of actor?.items ?? []) {
    if (i.type !== "skill") continue;
    const n = i.name.toLowerCase();
    if (n === w || (inner && n === inner)) {
      return { name: i.name, value: TBE.num(i.system?.value, 0), expertise: TBE.num(i.system?.expertise, 0), savvy: !!i.system?.savvy };
    }
  }
  return null;
};

/* Find a weapon Item by name (or the first weapon whose linked system.skillName
 * matches), tolerant the same way. Used by tbe-attack.js to resolve the
 * attacking weapon's maneuver-cost fields (cl/cs/dis/t) and damage. */
TBE.weaponNamed = function (actor, wanted) {
  if (!wanted) return null;
  const w = String(wanted).toLowerCase().trim();
  for (const i of actor?.items ?? []) {
    if (i.type !== "weapon") continue;
    if (i.name.toLowerCase() === w) return i;
  }
  return null;
};

/* ---------------------------------------------------------------------------
 * Status effects: one registry, shared by every macro, so a wound, a maneuver
 * rider, or a peril always shows the same token icon rather than each macro
 * inventing its own. Grouped to match the book's own chapters (Ch.10 Combat,
 * Ch.11 Wounds/Healing/Perils, Ch.14 Weave Magic), so "TBE: Status Effects"
 * and the reference journal can render the same list.
 * ------------------------------------------------------------------------- */
TBE.STATUSES = [
  ["Wounds & Impairment", "tbe-imp-body", "Impaired: Body", "icons/svg/blood.svg"],
  ["Wounds & Impairment", "tbe-imp-rarm", "Impaired: R Arm", "icons/svg/blood.svg"],
  ["Wounds & Impairment", "tbe-imp-larm", "Impaired: L Arm", "icons/svg/blood.svg"],
  ["Wounds & Impairment", "tbe-imp-rleg", "Impaired: R Leg", "icons/svg/blood.svg"],
  ["Wounds & Impairment", "tbe-imp-lleg", "Impaired: L Leg", "icons/svg/blood.svg"],
  ["Wounds & Impairment", "tbe-imp-head", "Impaired: Head", "icons/svg/blood.svg"],
  ["Wounds & Impairment", "tbe-stunned", "Stunned", "icons/svg/daze.svg"],
  ["Wounds & Impairment", "tbe-prone", "Prone", "icons/svg/falling.svg"],
  ["Wounds & Impairment", "tbe-unconscious", "Unconscious", "icons/svg/paralysis.svg"],
  ["Wounds & Impairment", "tbe-arm-useless", "Arm Useless", "icons/svg/downgrade.svg"],
  ["Wounds & Impairment", "tbe-leg-hobbled", "Leg Hobbled", "icons/svg/downgrade.svg"],
  ["Wounds & Impairment", "tbe-shock", "Shock", "icons/svg/unconscious.svg"],
  ["Wounds & Impairment", "tbe-dying", "Dying", "icons/svg/skull.svg"],
  ["Wounds & Impairment", "tbe-infected", "Infected", "icons/svg/biohazard.svg"],
  ["Wounds & Impairment", "tbe-septic", "Septic", "icons/svg/poison.svg"],
  ["Maneuver Riders", "tbe-unbalanced", "Unbalanced", "icons/svg/downgrade.svg"],
  ["Maneuver Riders", "tbe-locked", "Locked", "icons/svg/net.svg"],
  ["Maneuver Riders", "tbe-disarmed", "Disarmed", "icons/svg/downgrade.svg"],
  ["Maneuver Riders", "tbe-disadvantaged", "Disadvantaged", "icons/svg/downgrade.svg"],
  ["Magic", "tbe-restrained", "Restrained", "icons/svg/net.svg"],
  /* Immobilized is not Restrained: the book lets an Immobilized creature act,
     and a Restrained one only defend. A Weave Reaction can inflict either. */
  ["Magic", "tbe-immobilized", "Immobilized", "icons/svg/paralysis.svg"],
  /* Ch.5 Ogres: "If an Ogre critically fails a skill roll for which they used
     any amount of Resolve, they experience the Breaking: on their next turn,
     they will attack (with +10) the closest living thing." A real status,
     because it persists round to round until it is ended. */
  ["Race", "tbe-breaking", "The Breaking", "icons/svg/terror.svg"],
  ["Fatigue & Travel", "tbe-fatigued", "Fatigued", "icons/svg/sleep.svg"],
  ["Fatigue & Travel", "tbe-weary", "Weary", "icons/svg/sleep.svg"],
  ["Fatigue & Travel", "tbe-deprived", "Deprived", "icons/svg/hazard.svg"],
  ["Fatigue & Travel", "tbe-sleepless", "Sleepless", "icons/svg/sleep.svg"],
  ["Other Perils", "tbe-blinded", "Blinded", "icons/svg/blind.svg"],
  ["Other Perils", "tbe-deafened", "Deafened", "icons/svg/deaf.svg"],
  ["Other Perils", "tbe-frostbite", "Frostbite", "icons/svg/frozen.svg"],
  ["Other Perils", "tbe-burning", "Burning", "icons/svg/fire.svg"],
  ["Other Perils", "tbe-poisoned", "Poisoned", "icons/svg/poison.svg"],
  ["Other Perils", "tbe-feared", "Feared", "icons/svg/terror.svg"]
].map(([group, id, name, icon]) => ({ group, id, name, icon }));

/* Register the whole palette into CONFIG.statusEffects, idempotently. Every macro
 * loads _lib.js, so this runs whenever any TBE tool is used — no separate install
 * step needed, and the right-click token HUD always has the full palette ready. */
TBE.ensureStatuses = function () {
  try {
    if (!Array.isArray(CONFIG.statusEffects)) return;
    for (const s of TBE.STATUSES) {
      if (!CONFIG.statusEffects.find((e) => e.id === s.id)) {
        CONFIG.statusEffects.push({ id: s.id, name: s.name, label: s.name, img: s.icon, icon: s.icon });
      }
    }
  } catch (eEnsure) { /* older builds may not expose CONFIG.statusEffects as a plain array */ }
};
TBE.ensureStatuses();

TBE.statusDef = (id) => TBE.STATUSES.find((s) => s.id === id) ?? null;

TBE.hasStatus = function (actor, id) {
  try { if (actor?.statuses?.has && actor.statuses.has(id)) return true; } catch (eHas) {}
  try {
    const effects = actor?.effects?.contents ?? actor?.effects ?? [];
    return effects.some((e) => (e.statuses?.has?.(id)) || e.flags?.core?.statusId === id);
  } catch (eHas2) { return false; }
};

/* Apply a status the same way everywhere: the core toggle API first (this is what
 * actually paints a token icon), a raw ActiveEffect with "statuses" populated as a
 * fallback for older builds where toggleStatusEffect isn't available. Returns
 * true/false so a chat card can say honestly whether it landed. */
TBE.applyStatus = async function (actor, id, opts) {
  if (!actor || TBE.hasStatus(actor, id)) return !!actor;
  const def = TBE.statusDef(id) ?? { id, name: id, icon: "icons/svg/aura.svg" };
  TBE.ensureStatuses();
  try {
    await actor.toggleStatusEffect(id, Object.assign({ active: true, overlay: false }, opts));
    return true;
  } catch (eToggle) {
    try {
      await actor.createEmbeddedDocuments("ActiveEffect", [{
        name: def.name, img: def.icon, duration: (opts && opts.duration) || {}, statuses: [id]
      }]);
      return true;
    } catch (eCreate) { return false; }
  }
};

TBE.clearStatus = async function (actor, id) {
  if (!actor || !TBE.hasStatus(actor, id)) return !!actor;
  try {
    await actor.toggleStatusEffect(id, { active: false });
    return true;
  } catch (eToggle) {
    try {
      const effects = actor.effects?.contents ?? actor.effects ?? [];
      const dead = effects.filter((e) => e.statuses?.has?.(id) || e.flags?.core?.statusId === id).map((e) => e.id);
      if (dead.length) await actor.deleteEmbeddedDocuments("ActiveEffect", dead);
      return true;
    } catch (eDelete) { return false; }
  }
};

/* Reconcile the token icons for the states this pack already tracks as plain data
 * (wounds/impairment/infection/sepsis/shock/dying) with what's actually recorded in
 * system.wounds and the Death Threshold. Safe to call often — every Attack, every Heal action, and
 * every time the Status card is opened — so hand-edits or a skipped step never leave
 * a token showing something stale. Riders (Unbalance, Restrained, ...) and manual
 * perils (Fatigued, Blinded, ...) are applied at the point they happen instead, since
 * nothing else records their state to reconcile against. */
/* Schema key (body, rArm, ...) -> the per-location Impaired status id. Single
 * source of truth for this mapping -- it used to be hand-copied a second time
 * in tbe-attack.js, keyed by display label instead of schema key, which meant
 * a rename would only update one copy by default. tbe-attack.js now derives
 * its display-keyed lookup from this one via DISPLAY_TO_SCHEMA. */
TBE.IMP_STATUS_ID = { body: "tbe-imp-body", rArm: "tbe-imp-rarm", lArm: "tbe-imp-larm",
  rLeg: "tbe-imp-rleg", lLeg: "tbe-imp-lleg", head: "tbe-imp-head" };

TBE.syncStatuses = async function (actor) {
  if (!actor) return;
  const w = TBE.wounds(actor);
  const locMap = TBE.IMP_STATUS_ID;
  for (const [loc, id] of Object.entries(locMap)) {
    const should = TBE.num(w[loc]?.imp, 0) > 0;
    if (should !== TBE.hasStatus(actor, id)) await (should ? TBE.applyStatus(actor, id, {}) : TBE.clearStatus(actor, id));
  }
  /* Shock is a real system.shock boolean field (see tbe-attack.js), not re-derived
   * from wound counts here, since a Head impairment on an even Wound Die also forces
   * Shock without any location ever reaching a second impairment. */
  const shockNow = TBE.shock(actor);
  if (shockNow !== TBE.hasStatus(actor, "tbe-shock")) await (shockNow ? TBE.applyStatus(actor, "tbe-shock", {}) : TBE.clearStatus(actor, "tbe-shock"));
  const infected = Object.values(w).some((x) => x.inf);
  if (infected !== TBE.hasStatus(actor, "tbe-infected")) await (infected ? TBE.applyStatus(actor, "tbe-infected", {}) : TBE.clearStatus(actor, "tbe-infected"));
  const septic = Object.values(w).some((x) => x.septic);
  if (septic !== TBE.hasStatus(actor, "tbe-septic")) await (septic ? TBE.applyStatus(actor, "tbe-septic", {}) : TBE.clearStatus(actor, "tbe-septic"));
  /* Death Threshold, Lethality Level and total WP are real DataModel getters
   * on the live actor.system now — no need to re-derive them here. */
  const dt = TBE.num(actor.system?.deathThreshold?.max, 0);
  const dying = dt > 0 && !!actor.system?.dying;
  if (dying !== TBE.hasStatus(actor, "tbe-dying")) await (dying ? TBE.applyStatus(actor, "tbe-dying", {}) : TBE.clearStatus(actor, "tbe-dying"));
};

/* ---------------------------------------------------------------------------
 * Extended Roll / Social Encounter trackers (Ch.2 p.22, Ch.13 p.249-264): a
 * task or scene that plays out over more than one standard roll, accumulating
 * SLs toward a threshold. Tracked state belongs to the undertaking, not to
 * any one actor, so it lives in a world setting (registered by the system's
 * init hook, namespace "the-broken-empires") rather than on a character sheet.
 * Multiple trackers can be active at once (a crafting project running
 * alongside a negotiation), each keyed by its own id.
 * ------------------------------------------------------------------------- */
TBE.TRACKER_SETTING = "encounters";

TBE.trackers = function () {
  try { return TBE.clone(game.settings.get("the-broken-empires", TBE.TRACKER_SETTING) || {}); }
  catch (eGet) { return {}; }
};

TBE.saveTracker = async function (t) {
  const all = TBE.trackers();
  all[t.id] = t;
  await game.settings.set("the-broken-empires", TBE.TRACKER_SETTING, all);
  return t;
};

/** One line describing any running tracker, whatever macro started it.
 *
 *  There is one of these per kind and they are shaped differently on purpose
 *  (a Chase races two totals, a Ritual counts concentration checkpoints), so
 *  the readout has to know all five. It lives here rather than in TBE: Status
 *  because Status is not the only thing that wants "what is running?" -- and
 *  because Status previously read a different store entirely and reported
 *  "none running" over five open trackers (fixed v0.28.0). */
TBE.trackerLine = function (t) {
  if (!t) return "";
  const n = t.name || t.kind || "Tracker";
  switch (t.kind) {
    case "extended": {
      /* "interval 0" reads like a bug on a tracker nobody has advanced yet, so
         the interval count only appears once there is one, and the label the
         player typed ("1 day") appears instead of a bare number. */
      const used = TBE.num(t.intervalsUsed, 0);
      const lim = TBE.num(t.limit, 0);
      const per = (t.intervalLabel || "").trim();
      let when = "";
      if (used || lim) when = ", interval " + used + (lim ? " of " + lim : "") + (per ? " (" + per + ")" : "");
      else if (per) when = ", per " + per;
      return n + " &mdash; " + TBE.num(t.total, 0) + " / " + TBE.num(t.slsRequired, 0) + " SLs" + when +
        (t.timer ? ", Timer " + t.timer : "");
    }
    case "chase":
      return n + " &mdash; " + (t.pursuerName || "Pursuer") + " " + TBE.num(t.pursuerTotal, 0) +
        " vs " + (t.preyName || "Prey") + " " + TBE.num(t.preyTotal, 0) +
        " of " + TBE.num(t.target, 0) + " SLs, round " + TBE.num(t.round, 0) +
        (t.suddenDeath ? " (sudden death)" : "");
    case "ritual":
      return n + " &mdash; ritual at TC " + TBE.num(t.tc, 0) + ", " + TBE.num(t.checksDone, 0) +
        " of " + TBE.num(t.checkpoints, 0) + " concentration checks" +
        (TBE.num(t.concentrationPenalty, 0) ? ", at &minus;" + t.concentrationPenalty : "");
    case "pact":
      return n + " &mdash; pact, price due every " + (t.interval || "interval");
    case "circle":
      return n + " &mdash; " + (t.creature?.name || "a summoning") +
        (t.bound ? ", bound, " + TBE.num(t.daysLeft, 0) + " day(s) left" : ", <b>not contained</b>") +
        (t.controlled ? ", controlled" : "");
    case "social-static":
      return n + " &mdash; " + TBE.num(t.total, 0) + " / " + TBE.num(t.tolerance, 0) +
        " Tolerance, " + TBE.num(t.attemptsUsed, 0) + " attempt(s) made";
    case "social-competitive":
      return n + " &mdash; " + (t.sides || []).map((x) => x.name + " " + TBE.num(x.total, 0)).join(" vs ") +
        " to " + TBE.num(t.victoryCondition, 0) + ", round " + TBE.num(t.round, 0);
    default:
      return n + " &mdash; " + (t.kind || "running");
  }
};

/** Every tracker still running, in a stable order. */
TBE.openTrackers = function () {
  return Object.values(TBE.trackers()).filter((t) => t && t.status === "active");
};

TBE.deleteTracker = async function (id) {
  const all = TBE.trackers();
  delete all[id];
  await game.settings.set("the-broken-empires", TBE.TRACKER_SETTING, all);
};

TBE.newTrackerId = () => "t" + Date.now().toString(36) + Math.floor(Math.random() * 46656).toString(36);

/* Every roll in these systems is a plain standard roll (p.19-22): TBE.resolve
 * already carries the tens-die SL count, the +3 critical-success bonus, and
 * the over-100-skill bonus, so extended/social rolls reuse it rather than
 * reimplementing SL math a second time. */
TBE.rollAttempt = async function (skillValue, expertise = 0) {
  const roll = await TBE.d100();
  return { roll, r: TBE.resolve(roll.total, skillValue, expertise) };
};

/* Halve-round-up, the shared critical-failure penalty across Extended Rolls
 * and both Social Encounter variants. Never drops below zero. */
TBE.halveUp = (n) => Math.max(0, Math.ceil(n / 2));

/* The opposed-roll tie-break cascade (Ch.2, "Opposed Rolls"), hoisted out of
 * TBE: Opposed Roll so TBE: Chase's Quick Chase option (Ch.13 p.269: "make
 * opposed Athletics rolls. The winner catches the loser") can decide its
 * single roll-off with the same rule instead of a second copy. Takes two
 * sides shaped { name, kind: "roll"|"fixed", res, sl, ok } (res is the
 * TBE.resolve() result for a "roll" side, or null for a "fixed" side whose
 * sl is a Fixed Number and ok is always true) and returns { winner, dos, why }.
 * winner is null on a dead heat with no forced tie-break. This is the one
 * canonical cascade -- checked against p.20 and confirmed correct in the
 * ownership audit (docs/ownership.md); don't re-derive it a third time. */
TBE.opposedResolve = function (A, B) {
  /* OWNERSHIP: module/rules/combat.mjs. The body below is the Node/legacy
     fallback, kept for the harnesses and the standalone pack the same way
     TBE.resolve and TBE.carryPool keep theirs. resolution_check-style
     sweeps compare the two, so if you change one, change both -- or better,
     change the owner and let this defer. */
  const C = (typeof game !== "undefined" && game?.thebrokenempires?.rules?.combat) || null;
  if (C && typeof C.opposedResolve === "function") return C.opposedResolve(A, B);
  let winner = null, dos = 0, why = "";
  if (A.ok && B.ok) {
    if (A.sl > B.sl) { winner = A; dos = A.sl - B.sl; why = "higher SLs"; }
    else if (B.sl > A.sl) { winner = B; dos = B.sl - A.sl; why = "higher SLs"; }
    else {
      const critA = A.kind === "roll" && A.res.crit;
      const critB = B.kind === "roll" && B.res.crit;
      if (critA && !critB) { winner = A; why = "critical beats non-critical (0 SL)"; }
      else if (critB && !critA) { winner = B; why = "critical beats non-critical (0 SL)"; }
      else if (A.kind === "roll" && B.kind === "fixed") { winner = A; why = "rolled skill beats a Fixed Number on a tie (0 SL)"; }
      else if (B.kind === "roll" && A.kind === "fixed") { winner = B; why = "rolled skill beats a Fixed Number on a tie (0 SL)"; }
      else if (A.res.roll > B.res.roll) { winner = A; why = "SLs tied, higher die roll (0 SL)"; }
      else if (B.res.roll > A.res.roll) { winner = B; why = "SLs tied, higher die roll (0 SL)"; }
      else if (A.skill > B.skill) { winner = A; why = "SLs and die tied, higher modified skill (0 SL)"; }
      else if (B.skill > A.skill) { winner = B; why = "SLs and die tied, higher modified skill (0 SL)"; }
      else why = "dead heat &mdash; decide or re-roll";
    }
  } else if (A.ok) { winner = A; dos = A.sl; why = "only side to succeed"; }
  else if (B.ok) { winner = B; dos = B.sl; why = "only side to succeed"; }
  else {
    const cfA = A.kind === "roll" && A.res.critFail;
    const cfB = B.kind === "roll" && B.res.critFail;
    if (cfA && !cfB) why = "both failed &mdash; if a winner is required, " + B.name + " (normal failure beats critical failure)";
    else if (cfB && !cfA) why = "both failed &mdash; if a winner is required, " + A.name + " (normal failure beats critical failure)";
    else why = "both failed &mdash; if a winner is required, " + (A.skill >= B.skill ? A.name : B.name) + " (higher modified skill)";
  }
  return { winner, dos, why };
};

/* ---- Ch.14 Weave Magic ---------------------------------------------------
 * Shared by TBE: Cast, TBE: Advancement and TBE: Finish Character so the
 * Fraying arithmetic exists in exactly one place. Everything here is stated
 * in the book: Strands are a level track whose XP cost is the next value,
 * a Fade is capped at 7 and a Spellweaver pays 1 Fraying per point above 10,
 * and every Fraying point gained past Max Resolve demands a Fraying Roll. */

/** Which Pattern this actor carries, from the real field or, on an older
 *  sheet built before v0.15.0, from the Talents it holds. */
TBE.pattern = function (actor) {
  const field = actor?.system?.pattern;
  if (field === "spellweaver" || field === "fade") return field;
  const names = new Set((actor?.items ?? []).filter((i) => i.type === "talent")
    .map((i) => i.name.trim().toLowerCase().replace(/\s*\(.*$/, "")));
  if (names.has("patterned in the weave")) return "spellweaver";
  if (names.has("faded pattern")) return "fade";
  return "none";
};

/** The Strand Items on an actor, newest schema first, name canonicalised. */
TBE.strands = function (actor) {
  return (actor?.items ?? []).filter((i) => i.type === "strand").map((i) => ({
    id: i.id, item: i,
    name: String(i.name || "").replace(/^\s*strand\s*:\s*/i, "").trim(),
    level: TBE.num(i.system?.level, 0),
    thin: !!i.system?.thin
  })).sort((a, b) => b.level - a.level || a.name.localeCompare(b.name));
};

/* Who can actually reach the Weave. Mirrors TBE.godbound, and exists for the
 * same reason: the presence of the five Bind skills is NOT the answer. Ch.7
 * p.79 has every character start them: "Magic skills have their own starting
 * values as detailed later; they all start at zero, and unless you are a
 * Spellweaver, Fade, or Godbound, they are likely to remain at zero." So a
 * Warrior legitimately owns Bind: Change at 0, and a tool that gates on "has
 * a Bind skill" opens itself to everybody -- which is exactly how a Piety
 * placeholder once Cast Out an ordinary character (v0.28.0, rule 6).
 *
 * Patterned (the Talent, Ch.4) or a Fade is the clear yes. A value above zero
 * in any Bind or Strand is also a yes, because something granted it (the Bolg
 * Fiir's +10, a GM's ruling) and refusing then would be the opposite mistake. */
TBE.weaver = function (actor) {
  const pattern = TBE.pattern(actor);
  const binds = TBE.binds(actor) || [];
  const strands = TBE.strands(actor) || [];
  const bindMax = binds.reduce((n, b) => Math.max(n, TBE.num(b.value, 0)), 0);
  const strandMax = strands.reduce((n, s) => Math.max(n, TBE.num(s.level, 0)), 0);
  return {
    pattern, bindMax, strandMax, binds: binds.length, strands: strands.length,
    /* Bind skills that exist only because every sheet starts with them. */
    placeholderBinds: binds.length > 0 && bindMax === 0 && strandMax === 0 && pattern === "none",
    isWeaver: pattern !== "none" || bindMax > 0 || strandMax > 0
  };
};

/** Bind skills, canonicalised the same way ("Bind: Control" -> "Control"). */
TBE.binds = function (actor) {
  return (actor?.items ?? []).filter((i) => i.type === "skill" && i.system?.group === "Bind").map((i) => {
    const name = String(i.name || "").replace(/^\s*bind\s*:\s*/i, "").trim();
    const value = TBE.num(i.system?.value, 0);
    /* A Weave Scar that has not yet expired (Ch.14 p.302) reduces "the Bind
     * skill value used in the casting", not the skill itself -- so the true
     * value stays on the Item for Advancement to improve, and `effective` is
     * what a casting roll should use. A permanent scar was already written
     * into the Item and needs nothing here. */
    const scar = TBE.weaveScarFor(actor, name);
    return {
      id: i.id, item: i, name, value, scar,
      effective: Math.max(0, value - scar),
      expertise: TBE.num(i.system?.expertise, 0)
    };
  }).sort((a, b) => b.effective - a.effective || a.name.localeCompare(b.name));
};

/** The hard ceiling on a Strand level for this Pattern, or null for none.
 * Reads TBE_MAGIC.rules.fadeStrandCap when the magic data block is loaded
 * (build.js concatenates it into any macro whose NEEDS_TABLES/NEEDS_CHARGEN
 * entry asks for it) rather than a hand-typed 7 -- config.mjs (the character
 * sheet's own version of this same rule) already reads it from that table;
 * this used to be a second, independent copy that would not have picked up
 * an errata change to the sheet's number. Note this deliberately keeps the
 * simpler bare-number-or-null shape config.mjs's richer {cap, why} return
 * doesn't have, since tbe-advancement.js (the only macro caller) treats it
 * as a plain number; if a macro ever needs the "why" text or the
 * character-creation cap case, extend this rather than diverging again. */
/* The Fade's Strand ceiling. The system owns this rule (CONFIG.TBE.strandCap
 * in helpers/config.mjs, which also carries the book quote and the separate
 * character-creation cap); macros run inside the system, so they read it from
 * there and only fall back to the magic data block when CONFIG is not around
 * -- a Node test harness, mainly. Two implementations of one rule is how this
 * project has repeatedly shipped drift; this is the same runtime-global
 * pattern CONFIG.TBE.rankCap() uses. */
TBE.strandCap = (pattern, atCreation = false) => {
  const cfg = (typeof CONFIG !== "undefined" && CONFIG.TBE && CONFIG.TBE.strandCap) ? CONFIG.TBE : null;
  if (cfg) {
    const r = cfg.strandCap(pattern, atCreation);
    return r && typeof r.cap !== "undefined" ? r.cap : null;
  }
  const magic = (typeof TBE_MAGIC !== "undefined" && TBE_MAGIC?.rules) || {};
  if (atCreation) return magic.chargenStrandCap ?? 5;
  return pattern === "fade" ? (magic.fadeStrandCap || 7) : null;
};

/* Ch.11 p.173-174: Death Threshold (exceeding it is instant, unconditional
 * death) and Lethality Level (~1/3 of Death Threshold, rounded up; once
 * Shocked AND over it, the character is Dying -- a recoverable but urgent
 * state that starts a round-by-round Wound Die + Toughness check, p.174)
 * are two different real thresholds. TBE: Attack and TBE: Wounds & Recovery
 * used to only ever report "X / max before the Death Threshold" -- correct
 * for the Death Threshold itself, but Dying was never checked or shown at
 * all anywhere, even though actor.system.dying/lethalityLevel (base-actor.mjs)
 * already derive it correctly for the sheet. One shared line for both
 * thresholds now, so a Shocked character past their Lethality Level is
 * flagged before the harder Death Threshold trigger, not silently left
 * off-screen until then.
 * `totalWpOverride`, when given, is used instead of the actor's own
 * (possibly not-yet-committed) system.totalWp -- both callers know their
 * post-hit/post-heal WP total locally before the actor.update() that will
 * eventually reflect it. */
TBE.deathThresholdNote = function (actor, totalWpOverride) {
  const dt = actor?.system?.deathThreshold;
  if (!dt || typeof dt.max !== "number" || dt.max <= 0) return null;
  const totalWp = totalWpOverride != null ? TBE.num(totalWpOverride, 0) : TBE.num(actor.system?.totalWp, 0);
  const left = Math.max(0, dt.max - totalWp);
  const ll = TBE.num(actor.system?.lethalityLevel, Math.max(0, Math.ceil(dt.max / 3)));
  const shock = !!actor.system?.shock;
  const dying = shock && totalWp > ll;
  let line = "<b>" + left + " / " + dt.max + "</b> before the Death Threshold (exceeding it is instant death, p.174)";
  if (dying) {
    line += '<div style="color:#8b1a1a;font-weight:bold">DYING</div><div style="font-size:11px">In Shock with ' +
      totalWp + " lethal WP over the Lethality Level (" + ll +
      ") &mdash; roll Wound Die + Toughness each round or Stabilize/amputate (p.174).</div>";
  } else if (shock && totalWp > 0) {
    line += '<div style="font-size:11px">In Shock: ' + totalWp + " / " + ll +
      " lethal WP against the Lethality Level (Dying starts past this).</div>";
  }
  return { line, left, max: dt.max, dead: left === 0 };
};

/**
 * XP and Fraying to take a Strand from `from` to `to`, sequentially.
 * p.123-124: "spend XP equal to the next highest value... Improvements must
 * be sequential"; "for each point a Strand is raised above 10, the
 * Spellweaver gains 1 Fraying."
 */
TBE.strandXp = function (from, to) {
  let xp = 0, fraying = 0;
  for (let v = TBE.num(from, 0) + 1; v <= TBE.num(to, 0); v++) {
    xp += v;
    if (v > 10) fraying += 1;
  }
  return { xp, fraying, steps: Math.max(0, TBE.num(to, 0) - TBE.num(from, 0)) };
};

/** The current purge chance, as the book computes it. */
TBE.frayingRisk = function (actor) {
  const max = TBE.num(actor?.system?.resolve?.max, 0);
  const fray = TBE.num(actor?.system?.fraying, 0);
  const over = fray - max;
  return { fraying: fray, maxResolve: max, over, inRollTerritory: over > 0, percent: over > 0 ? Math.min(100, over * 2) : 0 };
};

/**
 * Add Fraying points and make the Fraying Roll the book demands.
 *
 * p.308: "Anytime a Spellweaver gains a point of Fraying, if their new total
 * Fraying points is more than their Max Resolve, they must immediately make
 * a Fraying Roll: Roll 1d100. If the result is less than or equal to (Total
 * Fraying - Max Resolve) x 2, the Spellweaver is forcibly purged from the
 * Tapestry of reality."
 *
 * A single Weave Reaction that inflicts several points is ONE gain and one
 * roll: the book's own example gains 6 at once and rolls once at the new
 * total. Several separate gains are several rolls, which is why `sequential`
 * exists -- raising a Strand from 10 to 13 is three improvements, each
 * granting its own point, so it is three rolls at 2%, 4% and 6%, not one at
 * 6%.
 * @param {Actor} actor
 * @param {number} amount
 * @param {string} why
 * @param {{sequential?: boolean}} [opts]
 * @returns {{added:number,total:number,risk:number,roll:object|null,rolls:object[],purged:boolean,html:string}}
 */
TBE.addFraying = async function (actor, amount, why, opts) {
  if (opts && opts.sequential && TBE.num(amount, 0) > 1) {
    const parts = [];
    const rolls = [];
    let last = null;
    for (let i = 0; i < TBE.num(amount, 0); i++) {
      last = await TBE.addFraying(actor, 1, why + " (" + (i + 1) + " of " + TBE.num(amount, 0) + ")");
      parts.push(last.html);
      if (last.roll) rolls.push(last.roll);
      if (last.purged) break;
    }
    return Object.assign({}, last, { added: parts.length, rolls, html: parts.join("") });
  }
  return TBE._addFrayingOnce(actor, amount, why);
};

TBE._addFrayingOnce = async function (actor, amount, why) {
  const add = Math.max(0, TBE.num(amount, 0));
  if (!actor || !add) return { added: 0, total: TBE.num(actor?.system?.fraying, 0), risk: 0, roll: null, purged: false, html: "" };
  const total = TBE.num(actor.system?.fraying, 0) + add;
  const frayWrite = await TBE.write(actor, { "system.fraying": total }, "the Fraying");
  const max = TBE.num(actor.system?.resolve?.max, 0);
  const over = total - max;
  let html = "<div><b>" + actor.name + "</b> gains <b>" + add + " Fraying</b>" + (why ? " (" + why + ")" : "") +
    " &mdash; now <b>" + total + "</b> against Max Resolve " + max + ".";
  html += ' <span style="font-size:11px;opacity:.8">Fraying can never be reduced.</span></div>';
  /* Fraying is permanent and cumulative, so a card announcing it against a
     sheet that never received it is the most misleading card this pack can
     post. Say when it did not land. */
  if (!frayWrite.ok) html += '<div style="font-size:11px;color:#8b1a1a">Not written to the sheet. ' +
    TBE.esc(frayWrite.notice) + "</div>";
  if (over <= 0) {
    html += '<div style="font-size:11px;opacity:.85">Still at or under Max Resolve, so no Fraying Roll yet: ' +
      (max - total) + " point(s) of room left.</div>";
    return { added: add, total, risk: 0, roll: null, rolls: [], purged: false, html };
  }
  const risk = Math.min(100, over * 2);
  const r = await new Roll("1d100").evaluate();
  const purged = r.total <= risk;
  html += '<div style="border-top:1px solid #7a6a4f;margin-top:4px;padding-top:4px"><b>Fraying Roll</b>: 1d100 &rarr; <b>' +
    TBE.face(r.total) + "</b> against (" + total + " &minus; " + max + ") &times; 2 = <b>" + risk + "</b>.</div>";
  html += purged
    ? '<div style="color:#8b1a1a;font-weight:bold">' + actor.name +
      " is purged from the Tapestry. The Weave grants one Final Act first: one last working of magic, automatically successful, described by the player and adjudicated by the GM.</div>"
    : '<div style="font-size:11px;opacity:.85">' + actor.name + " holds together, for now.</div>";
  return { added: add, total, risk, roll: r, rolls: [r], purged, html };
};

/* ---- Ch.5 racial restrictions that are real numbers, not prose ----------- */

/** Armor an Ogre is untrained in (p.83): "They do not wear the reinforced
 *  leather, mail, scale, or plate armor of Men... If an Ogre wears such
 *  armor, they do so untrained and suffer -20 to all Willpower rolls." */
TBE.OGRE_UNTRAINED_ARMOR = /reinforced leather|mail|scale|plate/i;
TBE.ogreArmorPenalty = function (actor) {
  if ((actor?.system?.race || "") !== "Ogre") return { penalty: 0, pieces: [] };
  const pieces = (actor.items ?? []).filter((i) => i.type === "armor" &&
    i.system?.equipped !== false && TBE.OGRE_UNTRAINED_ARMOR.test(i.name)).map((i) => i.name);
  return { penalty: pieces.length ? -20 : 0, pieces };
};

/**
 * The Breaking (p.83). Called after any roll where the character spent
 * Resolve; returns the chat HTML and applies the status, or "" if it did
 * not trigger. Everything about it is conditional on things the macro
 * already knows, so it does not need to be asked about.
 */
TBE.theBreaking = async function (actor, res, resolveSpent) {
  if (!actor || (actor.system?.race || "") !== "Ogre") return "";
  if (!res || !res.critFail || !(TBE.num(resolveSpent, 0) > 0)) return "";
  await TBE.applyStatus(actor, "tbe-breaking", {});
  return '<div style="border-top:1px solid #7a6a4f;margin-top:4px;padding-top:4px;color:#8b1a1a"><b>The Breaking.</b> ' +
    actor.name + " critically failed a roll they spent Resolve on. On their next turn they attack the closest living " +
    "thing, friend or foe, at <b>+10</b>, seeking to consume them. This continues every round until they are knocked " +
    "Unconscious, killed, succeed at a Willpower roll, or are talked down by someone they trust with an Inspire or " +
    "Persuade roll opposed by the Ogre's Intimidate (one attempt per round).</div>";
};
