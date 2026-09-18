/* loadout_check.mjs — carry state, the ENC pool it counts against, and the
 * TBE: Loadout panel.
 *
 * The bug this exists to prevent is specific and was live: "which pool does a
 * carry state count toward" was implemented twice, inline, as a NEGATIVE
 * filter -- `(carried ?? 'hand') !== 'stored'` in both actor-sheet.mjs's
 * _prepareEnc() and _lib.js's encStatus(). That reads an open enum as a
 * binary. The moment `dropped` existed, a weapon lying on the floor would have
 * counted against the 6 ENC Weapons At Hand pool, in the sheet AND in every
 * macro, with no error anywhere -- you would simply have been encumbered by
 * something you were not carrying. Seb asked the question that found it
 * ("removing load, when not explicitly carried") off the back of his own TOR2e
 * Loadout macro, which excludes dropped gear from its load total.
 *
 * So the checks below do not read the filters. They run the real pool owner
 * over every state, run the real `encStatus` out of macros/_lib.js against stub
 * actors, and compare the sheet's gathering against the macro pack's across a
 * loadout matrix -- the same shape audit_check.mjs uses to pin those two
 * against each other. The mutation restores the negative filter and confirms a
 * dropped weapon starts weighing you down again.
 *
 * Run: node loadout_check.mjs
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

const LIB = read("macros/_lib.js");
const MACRO = read("macros/tbe-loadout.js");
const CONFIG_SRC = read("system/the-broken-empires/module/helpers/config.mjs");
const SHEET = read("system/the-broken-empires/module/sheets/actor-sheet.mjs");

/* The real CONFIG.TBE: import the shipped module rather than re-evaluating a
   mangled copy of it, so what is tested is what ships. */
const TBE_CONFIG = (await import("./system/the-broken-empires/module/helpers/config.mjs")).TBE;

/* The real macro library, with CONFIG present (deferral) or absent (fallback). */
const loadTBE = ({ withConfig = true, configTBE = TBE_CONFIG } = {}) => {
  const CONFIG = withConfig ? { TBE: configTBE, sounds: { dice: "d.wav" } } : { sounds: { dice: "d.wav" } };
  const game = { user: { id: "u1", character: null }, settings: { get: () => "publicroll" } };
  return new Function("canvas", "game", "foundry", "ui", "CONFIG", "ChatMessage",
    LIB + "\n;return TBE;")(
    { tokens: { controlled: [] } }, game,
    { utils: { duplicate: (o) => JSON.parse(JSON.stringify(o)) } },
    { notifications: { warn() {}, error() {}, info() {} } },
    CONFIG,
    { create: () => {}, getSpeaker: () => ({}), applyRollMode: (d) => d, getWhisperRecipients: () => [] });
};

const STATES = ["ready", "hand", "stored", "dropped"];

console.log("\n1. The book's own words, and which of these states are its");
{
  const DUMP = "/tmp/tbe.txt";
  if (fs.existsSync(DUMP)) {
    const book = fs.readFileSync(DUMP, "utf8").replace(/\s+/g, " ");
    check(book.includes("Weapons can be in one of three states"),
      "the book says THREE states, so `dropped` is ours and must be labelled as such");
    check(book.includes("Dropping a weapon is a free action"),
      "...but dropping is a real rule: 'Dropping a weapon is a free action.'");
    check(/picking a weapon up off the ground is an action/.test(book),
      "...and so is picking it back up");
    check(book.includes("6 ENC worth of weapons or shields"),
      "the 6 ENC Weapons At Hand pool is the book's number");
    /* The comment must not claim `dropped` is RAW. */
    check(/NOT one of the book's three named states|NOT a fourth state the book names/.test(CONFIG_SRC),
      "config.mjs says out loud that `dropped` is not one of the book's three");
    check(/Weapons can be in one of three states|names three/.test(CONFIG_SRC),
      "...and quotes or cites the three-state line it is departing from");
  } else {
    console.log("  SKIP  /tmp/tbe.txt absent — book quotes not verified this run");
  }
}

console.log("\n2. The pool mapping, run rather than read");
{
  const want = { ready: "hand", hand: "hand", stored: "inventory", dropped: "none" };
  for (const st of STATES) {
    check(TBE_CONFIG.carryPool(st) === want[st], `${st} counts toward the ${want[st]} pool`, TBE_CONFIG.carryPool(st));
  }
  check(TBE_CONFIG.carryPool(undefined) === "hand", "an unset state defaults the way the schema does (hand)");
  check(TBE_CONFIG.carryPool("nonsense") === "hand", "an unknown state degrades to the default rather than throwing");
  /* The invariant Seb actually asked about. */
  check(TBE_CONFIG.carryPool("dropped") === "none",
    "DROPPED COUNTS AGAINST NEITHER POOL — the whole point: load on the floor is not carried");
  check(STATES.every((s) => TBE_CONFIG.READINESS[s] && TBE_CONFIG.READINESS[s].cost),
    "every state carries the action cost the book prices it at");
}

console.log("\n3. The macro pack asks the owner instead of keeping its own copy");
{
  const withCfg = loadTBE({ withConfig: true });
  for (const st of STATES) {
    check(withCfg.carryPool(st) === TBE_CONFIG.carryPool(st),
      `deferral path agrees on ${st}`, { macro: withCfg.carryPool(st), owner: TBE_CONFIG.carryPool(st) });
  }
  /* Sentinel: prove it is really reading the global, not coincidentally
     matching its own literal. Same technique audit_check.mjs uses. */
  const sentinel = { ...TBE_CONFIG, carryPool: () => "SENTINEL" };
  const spy = loadTBE({ withConfig: true, configTBE: sentinel });
  check(spy.carryPool("dropped") === "SENTINEL",
    "CONFIRMED by sentinel: the macro pack really defers, it does not just happen to agree");

  const noCfg = loadTBE({ withConfig: false });
  for (const st of STATES) {
    check(noCfg.carryPool(st) === TBE_CONFIG.carryPool(st),
      `Node/legacy fallback agrees on ${st}`, noCfg.carryPool(st));
  }
}

console.log("\n4. encStatus, executed over a loadout matrix");
{
  const TBE = loadTBE({ withConfig: true });
  const mkActor = (gear) => ({
    system: { silver: 0, enc: { invBonus: 0, handBonus: 0 } },
    items: gear.map(([type, carried, enc], n) => ({ type, system: { carried, enc }, name: "g" + n }))
  });

  const base = TBE.encStatus(mkActor([["weapon", "hand", 3], ["shield", "ready", 2]]));
  check(base.hand === 5 && base.inv === 0, "held and at-hand both fill the Weapons At Hand pool", base);

  const stored = TBE.encStatus(mkActor([["weapon", "stored", 3]]));
  check(stored.hand === 0 && stored.inv === 3, "stored moves to Inventory ENC, not the hand pool", stored);

  /* The headline: dropping a weapon must REMOVE its load from both pools. */
  const carrying = TBE.encStatus(mkActor([["weapon", "hand", 4], ["weapon", "hand", 3]]));
  const dropped = TBE.encStatus(mkActor([["weapon", "hand", 4], ["weapon", "dropped", 3]]));
  check(carrying.hand === 7, "two at-hand weapons total 7 ENC", carrying.hand);
  check(dropped.hand === 4, "dropping one leaves 4 ENC in hand, not 7", dropped.hand);
  check(dropped.inv === 0, "...and the dropped weapon does not reappear in Inventory either", dropped.inv);

  /* Over the cap and back, since the penalty is what a player feels. */
  const heavy = TBE.encStatus(mkActor([["weapon", "stored", 5], ["weapon", "stored", 5]]));
  check(heavy.over === 4 && heavy.penalty === -20, "an overloaded Inventory still bands correctly", heavy);
  const relieved = TBE.encStatus(mkActor([["weapon", "stored", 5], ["weapon", "dropped", 5]]));
  check(relieved.over === 0 && relieved.penalty === 0,
    "dropping half of it clears the overload penalty", relieved);
}

console.log("\n5. The sheet gathers the same way the macro pack does");
{
  /* Slice the real _prepareEnc out of the sheet and run it, rather than
     trusting that two edits were made consistently. */
  /* Anchor on the DEFINITION, not the first mention -- the call site appears
     earlier in the file and slicing from it produced a syntax error rather
     than a wrong answer, which is the good failure mode but still a failure. */
  const start = SHEET.indexOf("\n  _prepareEnc(weapons, shields, armor, system) {");
  const src = SHEET.slice(start + 1, SHEET.indexOf("\n  }", start) + 4);
  check(start !== -1 && /inPool/.test(src), "_prepareEnc was found and uses the pool owner", src.slice(0, 120));
  /* Strip comments before looking for the banned pattern: the doc comment
     explaining why the filter was removed necessarily contains the filter. */
  const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  check(!/!==\s*'stored'/.test(code) && !/!==\s*"stored"/.test(code),
    "the sheet no longer tests `!== 'stored'` in code — that negative filter IS the bug");

  const body = src.replace(/^\s*_prepareEnc\(/, "function _prepareEnc(");
  const fn = new Function("TBE", body + "\n;return _prepareEnc;")(TBE_CONFIG);
  const TBE_MACRO = loadTBE({ withConfig: true });

  const matrix = [];
  for (const a of STATES) for (const b of STATES) for (const enc of [1, 4]) {
    matrix.push([["weapon", a, enc], ["shield", b, 2]]);
  }
  let agreed = 0;
  for (const gear of matrix) {
    const weapons = gear.filter((g) => g[0] === "weapon").map(([, carried, enc]) => ({ system: { carried, enc } }));
    const shields = gear.filter((g) => g[0] === "shield").map(([, carried, enc]) => ({ system: { carried, enc } }));
    const fromSheet = fn(weapons, shields, [], { silver: 0, enc: {} });
    const fromMacro = TBE_MACRO.encStatus({
      system: { silver: 0, enc: {} },
      items: gear.map(([type, carried, enc]) => ({ type, system: { carried, enc } }))
    });
    if (fromSheet.hand === fromMacro.hand && fromSheet.inv === fromMacro.inv) agreed++;
    else check(false, `sheet and macro disagree on ${JSON.stringify(gear)}`, { fromSheet, fromMacro });
  }
  check(agreed === matrix.length,
    `sheet and macro agree across all ${matrix.length} loadouts`, `${agreed}/${matrix.length}`);
}

console.log("\n6. The panel itself");
{
  const AF = Object.getPrototypeOf(async function () {}).constructor;
  let err = null;
/* Foundry compiles a script macro as an AsyncFunction whose body is WRAPPED IN
   A BLOCK -- roughly `new AsyncFunction(...params, "{" + command + "\n}")`. That
   matters: inside the block, a top-level `const actor` SHADOWS the `actor`
   parameter perfectly legally, which is why TBE: Skill Roll and TBE: Character
   Wizard have done exactly that for months and run fine. An earlier version of
   this harness compiled the body bare, concluded `const actor` was illegal, and
   that false claim reached a changelog and two scheduled prompts before the
   release baseline caught it. Compile it the way Foundry does. */
  try { new AF("speaker", "actor", "token", "character", "scope", "event", "{" + MACRO + "\n}"); }
  catch (e) { err = e.message; }
  check(err === null, "compiles as a Foundry script macro", err);
  check(!/^\s*import\s/m.test(MACRO), "carries no import declaration");
  check(!/\breturn\b\s*;/.test(MACRO.split("\n")[0]), "no bare top-level return on line 1");

  /* This macro uses `const me = TBE.me()`, which is the house convention and
     reads better beside `me.isOwner`. It is NOT required: Foundry's block
     wrapper makes `const actor` legal too (see the note above section 6's
     compile). The earlier claim that it was illegal was wrong. */
  check(/if \(!me\.isOwner\)/.test(MACRO), "refuses when the user does not own the actor");
  check(/do not own " \+ me\.name/.test(MACRO),
    "...and names the actor in the refusal, rather than failing silently");
  check(/TBE\.carryPool\(/.test(MACRO), "computes its totals through the pool owner");
  const macroCode = MACRO.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  check(!/!==\s*"stored"/.test(macroCode), "and carries no negative-filter copy of its own");
  check(/counted against neither pool|carried by nobody/.test(MACRO),
    "says out loud that dropped load is in neither pool — the footer Seb's TOR2e version has");
  check(/TBE\.say\(/.test(MACRO), "announces changes to chat so the table sees state without opening sheets");
  check(!/whisper|getWhisperRecipients/.test(MACRO),
    "and does not implement visibility itself — that has an owner");
  check(/updateEmbeddedDocuments/.test(MACRO) && /catch \(err\)/.test(MACRO),
    "wraps the write and reports failure rather than swallowing it");

  /* Level 2, not level 3 or 4: costs shown, never charged. Seb's call. */
  check(!/game\.combat|combat\.round|\.turns\b/.test(MACRO),
    "does NOT track turns or rounds — costs are shown, never enforced (Seb, 2026-09-17)");
  check(/never charged/.test(MACRO), "and says so in the UI, not only in a comment");
  check(/p\.153/.test(MACRO) && /p\.159/.test(MACRO), "cites the pages it is quoting prices from");
  check(/bookkeeping, not a claim|bookkeeping change, not a claim/.test(MACRO),
    "is honest that setting Stored is not a retrieval — the 2-actions flow is out of scope");
}

console.log("\n7. Registered where a player can reach it");
{
  const BUILD = read("build.js");
  check(/\["TBE: Loadout", "tbe-loadout\.js"/.test(BUILD), "build.js ships it");
  const PANEL = read("macros/tbe-solo-panel.js");
  check(/TBE: Loadout/.test(PANEL), "and the Solo Panel lists it under Fight");
}

console.log("\n8. Mutation: restore the negative filter, watch the floor weigh you down");
{
  /* This is the defect exactly as it was. If section 4 cannot see it, section 4
     is not doing its job. */
  const broken = LIB.replace(
    'const hand = items.filter((i) => gear(i) && inPool(i, TBE.POOL.HAND))',
    'const hand = items.filter((i) => gear(i) && (i.system?.carried ?? "hand") !== "stored")');
  check(broken !== LIB, "the mutation actually changed the source");

  const CONFIG = { TBE: TBE_CONFIG, sounds: { dice: "d.wav" } };
  const TBE = new Function("canvas", "game", "foundry", "ui", "CONFIG", "ChatMessage",
    broken + "\n;return TBE;")(
    { tokens: { controlled: [] } }, { user: { id: "u1" }, settings: { get: () => "publicroll" } },
    { utils: { duplicate: (o) => JSON.parse(JSON.stringify(o)) } },
    { notifications: { warn() {}, error() {}, info() {} } }, CONFIG,
    { create: () => {}, getSpeaker: () => ({}) });

  const out = TBE.encStatus({
    system: { silver: 0, enc: {} },
    items: [{ type: "weapon", system: { carried: "hand", enc: 4 } },
            { type: "weapon", system: { carried: "dropped", enc: 3 } }]
  });
  check(out.hand === 7,
    "CONFIRMED: with the negative filter back, a weapon on the ground counts against Weapons At Hand again",
    out.hand);
}

console.log("\n9. Mutation: a schema that forgot the new state");
{
  /* If `dropped` is not in the enum, Foundry silently cleans it back to the
     initial value on save -- the panel would look like it worked and the state
     would not stick. Cheap to check, invisible at runtime. */
  for (const f of ["item-weapon.mjs", "item-shield.mjs"]) {
    const src = read("system/the-broken-empires/module/data/" + f);
    check(/choices: \["ready", "hand", "stored", "dropped"\]/.test(src),
      `${f} accepts the dropped state`);
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
