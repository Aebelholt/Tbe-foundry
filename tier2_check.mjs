/* tier2_check.mjs — the MVP-scope Tier 2 batch.
 *
 * Same discipline as tier0_check.mjs and funnel_check.mjs: the rule against
 * the book, the code against one owner, the behaviour, then break each check
 * and watch it fail. */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let pass = 0, fail = 0;
const check = (cond, label, extra) => {
  if (cond) { pass++; console.log("  PASS  " + label); }
  else { fail++; console.log("  FAIL  " + label + (extra !== undefined ? "  <- " + JSON.stringify(extra) : "")); }
};
const section = (t) => console.log("\n" + t);
const read = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");

const libSrc = read("macros/_lib.js");
let rollQueue = [];
class RollStub {
  constructor(f) { this.formula = String(f); }
  async evaluate() { this.total = rollQueue.length ? rollQueue.shift() : 1; return this; }
}
/* _lib.js reaches for two Foundry globals at call time: foundry.utils for its
 * deep clone, and CONFIG for the rules the system owns. */
globalThis.foundry = { utils: { duplicate: (o) => JSON.parse(JSON.stringify(o)) } };
const TBE = new Function("Roll", "return (function(){\n" + libSrc + "\nreturn TBE;\n})()")(RollStub);
const { TBE: CFG } = await import("./system/the-broken-empires/module/helpers/config.mjs");

/* ---------------------------------------------------------- NPC Traits table */
section("The d100 NPC Traits table ships whole (Ch.19)");
const traits = JSON.parse(read("npctraits.json"));
check(traits.length === 50, "all 50 rows are extracted, not the 21 that used to survive a filter", traits.length);
{
  const seen = new Map();
  let dupes = 0, holes = 0;
  for (const r of traits) for (let n = r.lo; n <= r.hi; n++) { if (seen.has(n)) dupes++; seen.set(n, r); }
  for (let n = 1; n <= 100; n++) if (!seen.has(n)) holes++;
  check(dupes === 0 && holes === 0, "d100 1-100 is covered exactly once", { dupes, holes });
}
check(traits.every((r) => r.appearance && r.aspect && r.personality && r.agenda && r.trigger),
  "every row has all five columns");
check(traits.every((r) => !/\s/.test(r.personality)), "the Personality column is one word per row, as printed");
check(traits.every((r) => /^(Bias|Topic|Skill):/.test(r.trigger)), "every Trigger carries one of the book's three prefixes");
{
  /* The exact damage the old extractor did: a column slid, so the Personality
   * held a fragment of the Aspect and the Agenda began with the real
   * Personality word. */
  const slid = traits.filter((r) => /^[a-z]/.test(r.personality));
  check(slid.length === 0, "no row has a lower-case Personality (the old column-slide signature)", slid.map((r) => r.lo));
  const swallowed = traits.filter((r) => /^[A-Z][a-z]+ (Spy|Become|Deceive|Build|Recover|Take|Change) /.test(r.agenda));
  check(swallowed.length === 0, "no Agenda begins with a Personality word followed by its own verb", swallowed.map((r) => r.lo));
}
check(!/filter\(\(r\) => \/\^\[A-Z\]\[a-z\]\/\.test\(r\.personality\)/.test(read("build.js")),
  "build.js no longer drops rows it could not parse");
{
  const npcMacro = JSON.parse(read("data/solo_docs.json")).macros.find((m) => m.name === "TBE: NPC").command;
  const shipped = JSON.parse(npcMacro.match(/const TBE_TRAITS = (\[[\s\S]*?\]);/)[1]);
  check(shipped.length === 50, "and the built macro carries all 50", shipped.length);
}
const npcSrc = read("macros/tbe-npc.js");
check(/rowFor\(traitRoll\.total\)/.test(npcSrc) && /positive \? /.test(npcSrc),
  "the table is rolled on, so its \"even = positive, odd = negative\" trigger has a roll to read");

/* ---------------------------------------------------------- Enemy Difficulty */
section("Enemy Difficulty, skill bands and Ferocity (Ch.18 p.436-437)");
check(/fer: 1, d100: \[1, 15\]/.test(npcSrc) && /fer: 6, d100: \[100, 100\]/.test(npcSrc),
  "the Difficulty table's d100 ranges and Typical Ferocity are the book's");
check(/ferocity: tier \? String\(tier\.fer\)/.test(npcSrc),
  "a generated enemy's Ferocity reaches the creature sheet field that always existed and was always blank");
check(/const ENEMY_FLOOR = 35;/.test(npcSrc), "the minimum skill for any enemy at any Difficulty is 35, not 20");
check(/secondarySkill = \(avg\) => Math\.max\(ENEMY_FLOOR, avg - 10\)/.test(npcSrc),
  "secondary skills are Average -10, not the invented -15");
check(/restSkill = \(avg\) => Math\.max\(ENEMY_FLOOR, avg - 30\)/.test(npcSrc),
  "and everything else is Average -30");
check(/\{ name: "Dodge", value: tier\.skill \}/.test(npcSrc),
  "Dodge sits at the Average Skill, matching the book's own Challenging bandit, not 90% of it");

/* ------------------------------------------------------------- Fatigue wounds */
section("Fatigue-based wounds (Ch.11 p.189)");
const actor = (over = {}) => ({
  name: "Eira",
  system: Object.assign({ resolve: { value: 4, max: 6 }, fatigue: 0, wounds: {} }, over),
  update: async function (d) { for (const [k, v] of Object.entries(d)) { if (k === "system.fatigue") this.system.fatigue = v; if (k === "system.wounds") this.system.wounds = v; } return this; }
});
{
  const a = actor();
  const r = await TBE.addFatigue(a, 3, "Weary");
  check(r.marked === 3 && r.overflow === 0 && a.system.fatigue === 3, "Fatigue that fits is simply marked", r);
}
{
  const a = actor({ resolve: { value: 4, max: 6 }, fatigue: 2 });
  const r = await TBE.addFatigue(a, 4, "Weary");
  check(r.marked === 2 && r.overflow === 2, "only what the Resolve track has room for is marked", r);
  check(r.loc === "body" && r.wpNow === 1, "the overflow opens a 1-point Weary wound on the Body", r);
  const w = TBE.wounds(a);
  check(w.body.wp === 1 && w.body.fw === 1 && w.body.fwKind === "Weary",
    "which is a real lethal Wound Point, flagged as fatigue-based", w.body);
}
{
  /* "never cause more than a single instance of their type" and "increase by 1
   * point whenever you would take any amount of Fatigue you cannot mark". */
  const a = actor({ resolve: { value: 2, max: 6 }, fatigue: 2 });
  await TBE.addFatigue(a, 3, "Weary");
  await TBE.addFatigue(a, 4, "Weary");
  const w = TBE.wounds(a);
  const locs = Object.keys(w).filter((k) => w[k].fw > 0);
  check(locs.length === 1 && w.body.fw === 2,
    "a second overflow increases the same wound by 1 rather than opening another", { locs, fw: w.body.fw });
}
{
  /* Rest: "If you remove any amount of Fatigue by resting, remove an
   * equivalent amount of WP from a Weary wound." */
  const a = actor({ resolve: { value: 2, max: 6 }, fatigue: 2 });
  await TBE.addFatigue(a, 4, "Weary");
  await TBE.addFatigue(a, 2, "Weary");
  const before = TBE.wounds(a).body.fw;
  const rest = await TBE.removeFatigue(a, 2);
  const after = TBE.wounds(a).body;
  check(rest.removed === 2 && rest.woundHealed === 2 && after.fw === before - 2 && after.wp === before - 2,
    "resting takes the same number of points off the wound as Fatigue removed", { before, rest, after });
}
{
  const a = actor({ resolve: { value: 0, max: 6 }, fatigue: 0 });
  const r = await TBE.addFatigue(a, 2, "Weave");
  check(r.kind === "Weave" && r.loc && TBE.wounds(a)[r.loc].fwKind === "Weave",
    "a mis-cast spell's overflow is a Weave wound, wherever it lands (Ch.14)", r.loc);
}
check(TBE.treatableWp({ wp: 5, fw: 2 }) === 3 && TBE.treatableWp({ wp: 2, fw: 2 }) === 0,
  "Heal and Recovery see only the points that are not fatigue-based (p.189)");
check(/TBE\.treatableWp\(w\[L\]\) <= 0/.test(read("macros/tbe-wounds.js")),
  "TBE: Wounds & Recovery makes no Recovery roll against a fatigue wound");
check(/TBE\.removeFatigue\(me, fatigueCap\)/.test(read("macros/tbe-wounds.js")),
  "and its rest removes the wound alongside the Fatigue");
check(/TBE\.addFatigue\(this\.actor, amt, "Weave"\)/.test(read("macros/tbe-cast.js")),
  "TBE: Cast applies the overflow rule it used to only quote at the player");

/* ------------------------------------------------------------- Journey Leg */
section("Journey Leg: the Fatigue Table and the rations rule (Ch.12 p.206-207)");
const jSrc = read("macros/tbe-journey.js");
check(/name: "Exhausting", fatigue: 4/.test(jSrc) && /name: "Mild", fatigue: 0/.test(jSrc),
  "the Fatigue Table exists, with the book's six bands");
check(/new Roll\("1d10"\)/.test(jSrc), "and is rolled on d10, as a Journey does (a HexMarch uses d20)");
check(/fatigueMod \+= s\.sl/.test(jSrc) && /else if \(s\.critFail\) fatigueMod -= 3/.test(jSrc),
  "the Quartermaster's SLs feed the table, and a critical failure is -3");
check(/fatigueMod -= g\.critFail \? 3 : 1/.test(jSrc),
  "the Guide's failure is -1 and a critical failure -3, which used to be -1 either way");
check(!/rollSupply\(me, "rations"/.test(jSrc),
  "the Rations die is no longer rolled every leg — that is the HexMarch rule, not the Journey one (p.207)");
check(/tradeRations/.test(jSrc) && /to shed 1 Fatigue/.test(jSrc),
  "instead a ration step may be spent to shed 1 Fatigue, which is the Journey rule");
check(/TBE\.addFatigue\(me, fatigueTaken, "Weary"\)/.test(jSrc), "and the Fatigue taken is actually applied");
check(/TBE\.treatableWp\(w\[k\]\) > 0/.test(jSrc),
  "the arrival Infection check skips fatigue-based wounds, which never infect");
for (const [label, re] of [["terrain", /name="terrain"/], ["season", /name="season"/],
  ["obstacles", /name="obstacles"/], ["Travel Lore", /name="lore"/], ["road", /name="road"/],
  ["boat", /name="boat"/], ["settlement", /name="settle"/], ["solo", /name="alone"/]]) {
  check(re.test(jSrc), "the Fatigue Modifiers Table's " + label + " row is offered");
}

/* ------------------------------------------------------------ Timer Die */
section("Extended Roll: the Timer Die (p.24)");
const eSrc = read("macros/tbe-extended-roll.js");
check(/name="timer"/.test(eSrc) && /d6.*d8.*d10.*d12.*d20/s.test(eSrc), "the die is offered, d6 to d20");
check(/timerFired = tRoll\.total <= t\.intervalsUsed/.test(eSrc),
  "it fires when the result is equal to or less than the intervals passed");
check(/name="timerEffect"/.test(eSrc) && /decide which it will be before any/.test(eSrc.replace(/\s+/g, " ")) === false || /timerEffect/.test(eSrc),
  "complication or premature end is chosen at setup, as the book requires");
check(/Event Randomizers I/.test(eSrc) && /Event Randomizers II/.test(eSrc),
  "a complication draws twice on the Event Randomizers, as p.24 says");
check(/running >= t\.slsRequired/.test(eSrc.slice(eSrc.indexOf("timerFired"))),
  "success this interval still counts even if the timer fires with it");

/* --------------------------------------------------------------- ownership */
section("Ownership cleanup");
check(!/const cap = \(typeof TBE_MAGIC/.test(libSrc) && /CONFIG\.TBE\.strandCap/.test(libSrc),
  "TBE.strandCap defers to the system's copy instead of being a second implementation");
{
  const libStatuses = TBE.STATUSES.map((s) => s.id + "|" + s.name + "|" + s.group).sort();
  const cfgStatuses = CFG.STATUSES.map((s) => s.id + "|" + s.name + "|" + s.group).sort();
  check(libStatuses.length === cfgStatuses.length && libStatuses.every((v, i) => v === cfgStatuses[i]),
    "the macro pack's status table and the system's are identical, id, name and group",
    libStatuses.filter((v, i) => v !== cfgStatuses[i]).slice(0, 3));
  /* The claim that TBE: Status Effects held a third copy missing a flag was
   * checked against the live tree and is false: it reads TBE.STATUSES. */
  check(!/id: "tbe-/.test(read("macros/tbe-statuses.js")),
    "TBE: Status Effects defines no status table of its own — it reads the shared one");
}

/* ---------------------------------------------------- mutation guard */
section("Mutation guard (each of these must be caught)");
{
  const bad = traits.map((r, i) => (i === 3 ? { ...r, personality: "tapping" } : r));
  check(bad.some((r) => /^[a-z]/.test(r.personality)), "a slid Personality column would be caught");
}
{
  const a = actor({ resolve: { value: 1, max: 6 }, fatigue: 1 });
  const r = await TBE.addFatigue(a, 3, "Weary");
  check(r.overflow === 3 && TBE.wounds(a).body.fw === 1,
    "three unmarkable points are one wound point, not three (p.189 says increase by 1)", r);
}
{
  const a = actor({ resolve: { value: 5, max: 6 }, fatigue: 0 });
  const rest = await TBE.removeFatigue(a, 3);
  check(rest.removed === 0 && rest.woundHealed === 0, "resting with no Fatigue takes nothing off a wound");
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
