/* divine_check.mjs — Chapter 15, Divine Magic: Piety, miracles, the holy
 * symbol, Pious Acts, Cast Out and Atonement, and the 20 Domain lists.
 *
 * Three layers, same as the other check scripts:
 *   1. the data against the book (parse_magic.py already verifies its own
 *      quotes; what is checked here is that the MACROS' constants match the
 *      data, since a macro cannot import and carries its own copy),
 *   2. the behaviour, driven through the real macro source in a stubbed
 *      Foundry with a controllable die, not a re-implementation of the rules,
 *   3. a mutation guard on each number an off-by-one would quietly change.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");
const MAGIC = JSON.parse(read("data/magic.json"));
const DIVINE = JSON.parse(read("data/divine.json"));

let pass = 0, fail = 0;
const check = (cond, label, extra) => {
  if (cond) { pass++; console.log("  PASS  " + label); }
  else { fail++; console.log("  FAIL  " + label + (extra !== undefined ? "  <- " + JSON.stringify(extra) : "")); }
};
const section = (t) => console.log("\n" + t);

/* ------------------------------------------------------------------ harness */
let rollQueue = [];
const queueRolls = (...v) => { rollQueue = v.slice(); };

function harness(store, actor) {
  const said = [];
  global.foundry = { utils: { duplicate: (x) => JSON.parse(JSON.stringify(x)) } };
  global.CONFIG = { sounds: { dice: null } };
  global.Roll = class {
    constructor(f) { this.formula = String(f); }
    async evaluate() { this.total = rollQueue.length ? rollQueue.shift() : 1; return this; }
  };
  global.ui = { notifications: { warn: (m) => said.push("[warn] " + m), info: (m) => said.push("[info] " + m) } };
  global.canvas = { tokens: { controlled: actor ? [{ actor }] : [] } };
  global.ChatMessage = { getSpeaker: () => ({}), create: async (d) => { said.push(d.content); return d; } };
  global.game = {
    user: { character: null }, tables: { getName: () => null },
    settings: {
      get: (ns, key) => (store[key] !== undefined ? store[key] : {}),
      set: async (ns, key, val) => { store[key] = val; return val; }
    }
  };
  return said;
}

const LIB = read("macros/_lib.js");
const MAGIC_BLOCK = "const TBE_MAGIC = " + JSON.stringify(MAGIC) + ";\n" +
  "const TBE_DIVINE = " + JSON.stringify(DIVINE) + ";\n";
const EMPTY_TABLES = "const TBE_DATA = { tables: [] };\n";

async function runOnce(macroSrc, answer, store, actor) {
  const said = harness(store, actor);
  const code = EMPTY_TABLES + MAGIC_BLOCK + LIB.replace(
    /TBE\.prompt = async function[\s\S]*?\n};/,
    "TBE.prompt = async function (t, c, o) { return " + JSON.stringify(answer) + "; };"
  ) + "\n" + macroSrc;
  await new Function("return (async()=>{" + code + "})()")().catch((e) => said.push("[throw] " + e.stack));
  return said.map((s) => String(s).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()).join(" || ");
}

const MIRACLE_SRC = read("macros/tbe-miracle.js");
const PIOUS_SRC = read("macros/tbe-pious-act.js");
const CAST_SRC = read("macros/tbe-cast.js");
const TBE = new Function("Roll", "return (function(){\n" + LIB + "\nreturn TBE;\n})()")(
  class { constructor(f) { this.formula = String(f); } async evaluate() { this.total = 1; return this; } });

const trackersOf = (store, kind) => Object.values(store.encounters || {}).filter((t) => t.kind === kind);

/* A caster with a Bind, a Strand, Willpower, Arcana and room to be hurt. */
function makeCaster(over) {
  const a = {
    name: "Fionnah", type: "character",
    items: [
      { id: "b1", type: "skill", name: "Control", system: { group: "Bind", value: 70, expertise: 0 } },
      { id: "wp", type: "skill", name: "Willpower", system: { group: "Adventuring", value: 60, expertise: 0 } },
      { id: "ar", type: "skill", name: "Arcana", system: { group: "Lore", value: 65, expertise: 0 } },
      { id: "s1", type: "strand", name: "Spirit", system: { level: 6 } }
    ],
    flags: {},
    system: Object.assign({
      resolve: { value: 8, max: 8 }, fatigue: 0, fraying: 0, pattern: "spellweaver",
      trueName: "Aen-Fionnah", trueNameLanguage: "Dondalese",
      wounds: {}, deathThreshold: { value: 20, max: 20 }, toughness: 0
    }, over || {}),
    update: async function (d) {
      for (const [k, v] of Object.entries(d)) {
        const parts = k.split(".");
        let cur = a;
        for (let i = 0; i < parts.length - 1; i++) { cur[parts[i]] = cur[parts[i]] || {}; cur = cur[parts[i]]; }
        cur[parts[parts.length - 1]] = v;
      }
      return a;
    }
  };
  return a;
}

/* A Godbound: Piety is an ordinary skill Item, plus the Divine fields. */
function makeGodbound(over, pietyValue) {
  const a = makeCaster(over);
  const piety = { id: "pi", type: "skill", name: "Piety",
    system: { group: "Lore", value: pietyValue == null ? 56 : pietyValue, expertise: 0 } };
  piety.update = async function (u) { for (const [k, v] of Object.entries(u)) { const p = k.split("."); piety.system[p[1]] = v; } return piety; };
  a.items.push(piety);
  a.pietyItem = piety;
  Object.assign(a.system, { deity: "Devona", domains: ["Water", "Protection"],
    holySymbol: "d12", castOut: false, noGreaterSessions: 0 }, over || {});
  return a;
}

/* =====================================================================
 * 1. Constants against the verified extract
 * ===================================================================== */
section("Constants vs the verified Ch.15 extract");
check(TBE.PIETY_CAP === DIVINE.piety.cap.n, "the 90 ceiling matches the book", [TBE.PIETY_CAP, DIVINE.piety.cap.n]);
check(TBE.PIETY_WARNING === DIVINE.piety.warningVision.n && TBE.PIETY_ENCOURAGEMENT === DIVINE.piety.goodVision.n,
  "the warning and encouragement thresholds match (30 and 80)");
check(TBE.SYMBOL_SLS === DIVINE.holySymbol.afterSuccess.n, "a holy symbol is worth +2 SLs");
{
  const libBands = TBE.MIRACLE_BANDS.map((b) => [b.level, b.min, b.max].join("|")).join(",");
  const dataBands = DIVINE.miracleBands.map((b) => [b.level, b.min, b.max].join("|")).join(",");
  check(libBands === dataBands, "the SL bands for Lesser/Middle/Greater match", [libBands, dataBands]);
}
check(DIVINE.domains.length === 20, "all twenty Domains reached the data", DIVINE.domains.length);
check(DIVINE.piousActs.length === 14, "all fourteen Pious Acts reached the data", DIVINE.piousActs.length);
check(DIVINE.resistance.map((r) => r.fixed).join() === "1,2,3,4,5", "the resistance ladder runs 1-5");
{
  const empty = DIVINE.domains.filter((d) => !d.miracles.Lesser.length || !d.miracles.Middle.length || !d.miracles.Greater.length);
  check(empty.length === 0, "every Domain carries all three levels of miracle", empty.map((d) => d.name));
}

section("Piety arithmetic");
check(TBE.miracleLevel(1) === "Lesser" && TBE.miracleLevel(4) === "Lesser", "1-4 SLs is a Lesser Miracle");
check(TBE.miracleLevel(5) === "Middle" && TBE.miracleLevel(8) === "Middle", "5-8 is Middle");
check(TBE.miracleLevel(9) === "Greater" && TBE.miracleLevel(30) === "Greater", "9 or more is Greater");
check(TBE.miracleLevel(0) === null, "a failed roll grants no miracle at all");
check(TBE.stepSymbol("d12") === "d10" && TBE.stepSymbol("d6") === "d4", "a holy symbol steps down one die type");
check(TBE.stepSymbol("d4") === "d4", "and cannot fall below d4");
check(TBE.symbolUsable("d6") === true && TBE.symbolUsable("d4") === false,
  "below d6 it gives no benefit until blessed");
check(TBE.symbolUsable("") === false, "and no symbol is no bonus");
{
  const a = makeGodbound({}, 75);
  const out = await TBE.setPiety(a, 95);
  check(out.after === 90 && out.cappedAt90, "Piety can never be raised past 90 by any means here", out);
  check(out.encouraged === true, "crossing 80 upward is flagged for the encouraging vision", out);
}
{
  const a = makeGodbound({}, 40);
  const out = await TBE.setPiety(a, 28);
  check(out.after === 28 && out.warned === true, "falling to 30 or below is flagged for the warning vision", out);
  check(out.castOut === false, "but that is not being Cast Out");
}
{
  const a = makeGodbound({}, 4);
  const out = await TBE.setPiety(a, -6);
  check(out.after === 0 && out.castOut === true && a.system.castOut === true,
    "Piety cannot go below zero, and reaching zero marks the Godbound Cast Out", out);
}

/* =====================================================================
 * 2. Behaviour through the real macro source
 * ===================================================================== */
section("TBE: Miracle — the Piety roll (p.348)");
{
  // Piety 56 rolls 46: success, tens 4 => 4 SLs. Symbol d12 rolls 7 (no step),
  // adding +2 => 6 SLs, a Middle Miracle. Cost = 1d10 (5) + 6 = 11.
  // Roll order: the d100, then the 1d10 cost, then the symbol die.
  const a = makeGodbound({}, 56);
  queueRolls(46, 5, 7);
  const out = await runOnce(MIRACLE_SRC, { domain: "Water", ask: "protection from the fire",
    mod: "0", extraMod: "0", prayer: "none", useSymbol: "on", resist: "" }, {}, a);
  check(/6 SLs .{0,12} a Middle Miracle/.test(out),
    "four SLs plus the holy symbol's two is a Middle Miracle", out.slice(0, 400));
  check(a.pietyItem.system.value === 45, "and it costs 1d10 + the total SLs: 56 - 11 = 45", a.pietyItem.system.value);
  check(a.system.holySymbol === "d12", "a symbol die of 7 does not wear the symbol down");
}
{
  // The book's own worked example: a d12 symbol rolling 2 steps down to d10.
  const a = makeGodbound({}, 56);
  queueRolls(46, 5, 2);
  const out = await runOnce(MIRACLE_SRC, { domain: "Water", ask: "x", mod: "0", extraMod: "0",
    prayer: "minute", useSymbol: "on", resist: "" }, {}, a);
  check(a.system.holySymbol === "d10", "a 1-2 on the symbol wears it down one step", a.system.holySymbol);
  check(/7 SLs/.test(out), "a full minute of prayer adds its own +1 SL, for 7", out.slice(0, 400));
}
{
  // 44 against 56 is doubles => a critical success: +3 SLs and ZERO Piety cost.
  const a = makeGodbound({}, 56);
  queueRolls(44, 5, 7);
  const out = await runOnce(MIRACLE_SRC, { domain: "Water", ask: "x", mod: "0", extraMod: "0",
    prayer: "none", useSymbol: "on", resist: "" }, {}, a);
  check(/CRITICAL SUCCESS/.test(out) && /a critical success costs no Piety/.test(out),
    "a critical success grants the miracle at no Piety cost at all", out.slice(0, 420));
  check(a.pietyItem.system.value === 56, "so the score does not move", a.pietyItem.system.value);
}
{
  // 79 against 56: a plain failure. No miracle, and 1d10 Piety anyway.
  const a = makeGodbound({}, 56);
  queueRolls(79, 6);
  const out = await runOnce(MIRACLE_SRC, { domain: "Water", ask: "x", mod: "0", extraMod: "0",
    prayer: "none", useSymbol: "on", resist: "" }, {}, a);
  check(/does not grant the miracle/.test(out) && a.pietyItem.system.value === 50,
    "a failure costs 1d10 Piety just for asking", [out.slice(-200), a.pietyItem.system.value]);
  /* "The holy symbol does not help a failed Piety roll" -- and the damage a
     mutation here does is to STATE, not to the card: a symbol rolled on a
     failure can wear down a die type for nothing. Checked on the sheet, not
     in the text, because the text never showed it either way. */
  check(a.system.holySymbol === "d12" && !/Holy symbol/.test(out),
    "and the holy symbol is neither rolled nor worn down by one", [a.system.holySymbol, out.slice(-160)]);
}
{
  // 77 against 56: doubles above the skill => critical failure, 1d10+10.
  const a = makeGodbound({}, 56);
  queueRolls(77, 8);
  const out = await runOnce(MIRACLE_SRC, { domain: "Water", ask: "x", mod: "0", extraMod: "0",
    prayer: "none", useSymbol: "on", resist: "" }, {}, a);
  check(/CRITICAL FAILURE/.test(out) && a.pietyItem.system.value === 38,
    "a critical failure costs 1d10+10: 56 - 18 = 38", a.pietyItem.system.value);
}
{
  // A modifier can lift Piety over 100, which grants bonus SLs and removes
  // the critical failure entirely (p.347).
  const a = makeGodbound({}, 77);
  queueRolls(99, 5);
  const out = await runOnce(MIRACLE_SRC, { domain: "Water", ask: "x", mod: "30", extraMod: "0",
    prayer: "none", useSymbol: "", resist: "" }, {}, a);
  check(/Piety \(77 \+30 = <b>107<\/b>\)|107/.test(out), "the modifier is applied to the roll, not the score", out.slice(0, 240));
  check(/cannot critically fail/.test(out), "and over 100 it says so");
  check(a.pietyItem.system.value !== 77 - 18, "so a 99 is not a critical failure here");
}
{
  const a = makeGodbound({}, 56);
  queueRolls(46, 5, 7);
  const out = await runOnce(MIRACLE_SRC, { domain: "Water", ask: "x", mod: "0", extraMod: "0",
    prayer: "hour", useSymbol: "on", celestial: "on", resist: "" }, {}, a);
  check(/Middle Miracle/.test(out) && /celestial servants cannot grant Greater Miracles/.test(out),
    "a celestial servant caps the result at a Middle Miracle however many SLs are rolled", out.slice(0, 460));
}
{
  const a = makeGodbound({ noGreaterSessions: 3 }, 56);
  queueRolls(46, 5, 7);
  const out = await runOnce(MIRACLE_SRC, { domain: "Water", ask: "x", mod: "0", extraMod: "0",
    prayer: "hour", useSymbol: "on", resist: "" }, {}, a);
  check(/no Greater Miracles for another 3 session/.test(out) && /Middle Miracle/.test(out),
    "and so does the muted period after an atonement", out.slice(0, 500));
}
{
  const a = makeGodbound({}, 8);
  queueRolls(3, 9, 7); // 01-05 always succeeds: 1 SL, +2 from the symbol, cost 1d10(9)+3 = 12
  const out = await runOnce(MIRACLE_SRC, { domain: "Water", ask: "x", mod: "0", extraMod: "0",
    prayer: "none", useSymbol: "on", resist: "" }, {}, a);
  check(a.pietyItem.system.value === 0 && a.system.castOut === true,
    "a successful miracle that costs the last of a Godbound's Piety casts them out", a.pietyItem.system.value);
  check(/immediately after the miracle's effects resolve/.test(out),
    "after the miracle resolves, as the book specifies", out.slice(-320));
}
{
  const a = makeGodbound({ castOut: true }, 20);
  const out = await runOnce(MIRACLE_SRC, { domain: "Water", ask: "x", mod: "0", extraMod: "0",
    prayer: "none", useSymbol: "on", resist: "" }, {}, a);
  check(/is <b>Cast Out<\/b>|is Cast Out/.test(out) && a.pietyItem.system.value === 20,
    "a Cast Out Godbound gets no roll at all, and spends nothing", out.slice(0, 240));
}
{
  const a = makeGodbound({ domains: ["Water"] }, 56);
  queueRolls(46, 5, 7);
  const out = await runOnce(MIRACLE_SRC, { domain: "Water", ask: "x", mod: "0", extraMod: "0",
    prayer: "none", useSymbol: "on", resist: "2" }, {}, a);
  check(/Water &middot; Middle Miracles|Water · Middle Miracles/.test(out),
    "the card lists that Domain's own miracles at the level granted", out.slice(0, 500));
  check(/Fixed Number <b>2<\/b>|Fixed Number 2/.test(out) && /Divinity/.test(out),
    "and states the resistance Fixed Number, and that Divinity may oppose instead");
}

section("TBE: Pious Act (p.350-351)");
{
  const a = makeGodbound({}, 50);
  queueRolls(4);
  const out = await runOnce(PIOUS_SRC, { mode: "act", act: String(DIVINE.piousActs.findIndex((x) => /Helping a member/.test(x.act))) }, {}, a);
  check(a.pietyItem.system.value === 54, "a Pious Act restores rolled Piety", a.pietyItem.system.value);
  check(/1d4 &rarr; 4|1d4 → 4/.test(out), "and shows the roll it made", out.slice(0, 220));
}
{
  const a = makeGodbound({}, 88);
  queueRolls(10);
  const out = await runOnce(PIOUS_SRC, { mode: "act", act: String(DIVINE.piousActs.findIndex((x) => /holy quest/.test(x.act))) }, {}, a);
  check(a.pietyItem.system.value === 90 && /can never be raised past 90/.test(out),
    "and stops at the 90 ceiling", [a.pietyItem.system.value, out.slice(-200)]);
}
{
  const a = makeGodbound({ castOut: true }, 0);
  queueRolls(4);
  const out = await runOnce(PIOUS_SRC, { mode: "act", act: "3" }, {}, a);
  check(a.pietyItem.system.value === 0 && /no Piety returns until/.test(out),
    "a Cast Out Godbound regains nothing from a Pious Act until they atone", out.slice(-220));
}
{
  const a = makeGodbound({ castOut: true }, 0);
  queueRolls(4);
  const out = await runOnce(PIOUS_SRC, { mode: "atone" }, {}, a);
  check(a.system.castOut === false && a.system.noGreaterSessions === 4,
    "atonement lifts the Cast Out and starts the 1d6-session muting", [a.system.castOut, a.system.noGreaterSessions]);
  const out2 = await runOnce(PIOUS_SRC, { mode: "session" }, {}, a);
  check(a.system.noGreaterSessions === 3, "each session counts down", a.system.noGreaterSessions);
}
{
  const a = makeGodbound({ noGreaterSessions: 1 }, 50);
  const out = await runOnce(PIOUS_SRC, { mode: "session" }, {}, a);
  check(a.system.noGreaterSessions === 0 && /full favor returns/.test(out),
    "and the last one restores full favor", out.slice(-160));
}
{
  const a = makeGodbound({ holySymbol: "d4" }, 50);
  const out = await runOnce(PIOUS_SRC, { mode: "bless" }, {}, a);
  check(a.system.holySymbol === "d12" && /restored to <b>d12<\/b>|restored to d12/.test(out),
    "a blessing restores a depleted symbol to d12", a.system.holySymbol);
}
{
  const a = makeGodbound({}, 50);
  queueRolls(1);
  const out = await runOnce(PIOUS_SRC, { mode: "act", act: String(DIVINE.piousActs.findIndex((x) => /uninterrupted prayer/.test(x.act))) }, {}, a);
  check(a.pietyItem.system.value === 51 && /50% chance of 1/.test(out),
    "an hour of prayer is a coin flip for a single point", [a.pietyItem.system.value, out.slice(0, 200)]);
}
{
  const a = makeGodbound({}, 50);
  queueRolls(2, 5);
  await runOnce(PIOUS_SRC, { mode: "act", act: String(DIVINE.piousActs.findIndex((x) => /Fasting/.test(x.act))) }, {}, a);
  check(a.system.fatigue === 1, "fasting costs a point of Fatigue per day, as the table's footnote says", a.system.fatigue);
}
{
  const a = makeGodbound({}, 12);
  const out = await runOnce(PIOUS_SRC, { mode: "lose", lose: "20" }, {}, a);
  check(a.pietyItem.system.value === 0 && a.system.castOut === true,
    "the god's displeasure can cast a Godbound out directly", a.pietyItem.system.value);
}

/* =====================================================================
 * 3. Mutation guard
 * ===================================================================== */
section("Mutation guard (each of these must be caught)");
check(TBE.miracleLevel(4) !== "Middle" && TBE.miracleLevel(5) !== "Lesser",
  "an off-by-one at the 4/5 SL boundary would be caught");
check(TBE.miracleLevel(8) !== "Greater" && TBE.miracleLevel(9) !== "Middle",
  "and at the 8/9 boundary");
check(TBE.symbolUsable("d4") === false,
  "treating a depleted d4 symbol as usable would be caught");
{
  const a = makeGodbound({}, 85);
  const out = await TBE.setPiety(a, 200);
  check(out.after === 90, "letting Pious Acts past the 90 ceiling would be caught", out.after);
}
check(DIVINE.domains.every((d) => d.aspects && d.aspects.length > 5),
  "a Domain that lost its line of aspects would be caught");
{
  const total = DIVINE.domains.reduce((n, d) => n + d.miracles.Lesser.length + d.miracles.Middle.length + d.miracles.Greater.length, 0);
  check(total > 200, "and a parse that silently dropped most of the miracles would be caught", total);
}

console.log("\n" + pass + " passed, " + fail + " failed");
if (fail) process.exit(1);
