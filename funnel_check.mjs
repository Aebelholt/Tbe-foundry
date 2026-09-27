/* funnel_check.mjs — verification for the shared skill catalogue, the Ability
 * Score rule, and the funnel tables.
 *
 * Three kinds of check here, in the order that matters:
 *   1. Against the book: every skill name is defined in its own "<Category>
 *      Skills" section of /tmp/tbe.txt and in no other. This is the check that
 *      makes TBE.SKILL_GROUPS a claim about the rulebook rather than a guess.
 *   2. Against the repo: the catalogue exists in exactly one place, and the
 *      macros that used to carry private copies no longer do.
 *   3. Against behaviour: the rules themselves (Expertise ladder, +5 per
 *      Ability Score, the trade brackets, the derived fighting flag), plus the
 *      funnel table's d100 coverage.
 *
 * The last block deliberately breaks each data check and asserts it fails,
 * because a validator nobody has watched fail is not a validator. */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let pass = 0, fail = 0, skip = 0;
const check = (cond, label, extra) => {
  if (cond) { pass++; console.log("  PASS  " + label); }
  else { fail++; console.log("  FAIL  " + label + (extra !== undefined ? "  <- " + JSON.stringify(extra) : "")); }
};
const section = (t) => console.log("\n" + t);

/* ---- load the real _lib.js, the same way simtest.js does ---- */
const libSrc = fs.readFileSync(path.join(__dirname, "macros/_lib.js"), "utf8");
let rollQueue = [];
class RollStub {
  constructor(f) { this.formula = f; }
  async evaluate() { this.total = rollQueue.length ? rollQueue.shift() : 1; return this; }
}
const TBE = new Function("Roll", "return (function(){\n" + libSrc + "\nreturn TBE;\n})()")(RollStub);
const FUNNEL = JSON.parse(fs.readFileSync(path.join(__dirname, "data/funnel.json"), "utf8"));
const CHARGEN = JSON.parse(fs.readFileSync(path.join(__dirname, "data/chargen.json"), "utf8"));

/* ---- 1. the catalogue against the rulebook ---- */
section("Skill catalogue vs /tmp/tbe.txt (Ch.3, p.30-32)");
function bookCheck(groups) {
  const p = "/tmp/tbe.txt";
  if (!fs.existsSync(p)) return { skipped: true };
  const lines = fs.readFileSync(p, "utf8").split("\n");
  const heads = [];
  for (let i = 0; i < lines.length; i++) {
    for (const g of Object.keys(groups)) {
      if (i > 2000 && lines[i].trim() === g + " Skills" && !heads.some((h) => h.g === g)) heads.push({ g, i });
    }
  }
  heads.sort((a, b) => a.i - b.i);
  if (heads.length !== Object.keys(groups).length) return { headings: heads.length };
  const owner = {};
  for (const g of Object.keys(groups)) for (const s of groups[g]) owner[s] = g;
  const missing = [], stray = [];
  heads.forEach((h, idx) => {
    const end = idx + 1 < heads.length ? heads[idx + 1].i : h.i + 300;
    const seg = lines.slice(h.i, end).join("\n").toLowerCase().replace(/\s+/g, " ");
    const defined = (s) => seg.includes(s.toLowerCase() + " - ") || seg.includes(s.toLowerCase() + "* - ");
    for (const s of groups[h.g]) if (!defined(s)) missing.push(h.g + "/" + s);
    for (const s of Object.keys(owner)) if (owner[s] !== h.g && defined(s)) stray.push(h.g + "/" + s);
  });
  return { missing, stray };
}
const book = bookCheck(TBE.SKILL_GROUPS);
if (book.skipped) { skip++; console.log("  SKIP  /tmp/tbe.txt not present, book verification not run"); }
else {
  check(book.missing && book.missing.length === 0, "every catalogue skill is defined in its own category's section", book.missing);
  check(book.stray && book.stray.length === 0, "no skill is defined inside another category's section", book.stray);
  check(TBE.SKILL_ALL.length === 37, "the catalogue is the book's 37 skills", TBE.SKILL_ALL.length);
}

/* ---- 2. one owner ---- */
section("Ownership: the catalogue exists once");
const macroDir = path.join(__dirname, "macros");
const macroFiles = fs.readdirSync(macroDir).filter((f) => f.endsWith(".js"));
const carriers = macroFiles.filter((f) =>
  fs.readFileSync(path.join(macroDir, f), "utf8").includes('Combat: ["Dodge", "Melee: Light"'));
check(carriers.length === 1 && carriers[0] === "_lib.js",
  "the skill map literal appears only in _lib.js", carriers);
/* The three chargen macros that read it retired in v0.53.0. The system's own
   copy (module/chargen/rules.mjs) is held equal to _lib.js by creator_check.mjs. */
{
  const sys = fs.readFileSync(path.join(__dirname, "system/the-broken-empires/module/chargen/rules.mjs"), "utf8");
  check(sys.includes('Combat: ["Dodge", "Melee: Light"'), "the system's chargen/rules.mjs carries the one other copy, held equal by creator_check.mjs");
}
const npcSrc = fs.readFileSync(path.join(macroDir, "tbe-npc.js"), "utf8");
check(!npcSrc.includes('group: "Adventuring"'), "TBE: NPC no longer stamps every skill Adventuring");
check(!/name: "Weapon", type: "skill"/.test(npcSrc) && !/mkSkill\("Weapon"/.test(npcSrc),
  "TBE: NPC no longer creates a skill called \"Weapon\"");
const ladders = macroFiles.filter((f) => /\? 2 : Math\.min\(4/.test(fs.readFileSync(path.join(macroDir, f), "utf8")));
check(ladders.length === 1 && ladders[0] === "_lib.js", "the Expertise ladder exists only in _lib.js", ladders);

/* ---- 3. behaviour ---- */
section("Rules");
check(TBE.skillGroup("Dodge") === "Combat" && TBE.skillGroup("Insight") === "Social" &&
  TBE.skillGroup("Willpower") === "Adventuring" && TBE.skillGroup("Heal") === "Lore",
  "skillGroup() places the four skills TBE: NPC used to mislabel");
check(TBE.skillGroup("Piety") === null && TBE.skillGroup("Fishing-wise") === null,
  "skillGroup() returns null outside the catalogue rather than guessing");
check(TBE.SKILL_GROUPS.Combat.every((s) => TBE.isFighting(s)) &&
  TBE.SKILL_ALL.filter((s) => TBE.isFighting(s)).length === TBE.SKILL_GROUPS.Combat.length,
  "isFighting() is true for exactly the Combat skills");
check(TBE.raiseExpertise(0) === 2 && TBE.raiseExpertise(2) === 3 && TBE.raiseExpertise(3) === 4 &&
  TBE.raiseExpertise(4) === 4, "Expertise ladder: 0 -> 2 -> 3 -> 4, capped (p.53)");

const scores = CHARGEN.abilityScores;
const con = scores.find((a) => a.name === "Constitution");
{
  const values = TBE.blankSkillValues(20);
  const line = TBE.applyAbilityScore(values, con, "Endurance", 70);
  check(con.skills.every((s) => values[s].value === 25), "+5 to every skill the Ability Score lists (p.86)",
    con.skills.map((s) => values[s].value));
  check(values.Endurance.expertise === 2, "+1 Expertise level to the chosen listed skill");
  check(values.Dodge.value === 20, "skills the score does not list are untouched");
  check(typeof line === "string" && line.startsWith("Constitution (+5 to "), "returns the summary line the cards print");
}
{
  const values = TBE.blankSkillValues(68);
  TBE.applyAbilityScore(values, con, null, 70);
  check(con.skills.every((s) => values[s].value === 70), "the +5 is clamped at the creation cap of 70 (p.80)");
}
{
  rollQueue = [2, 5];
  const pair = await TBE.rollAbilityPair(scores);
  check(pair.picks[0].name === scores[1].name && pair.picks[1].name === scores[4].name,
    "1d6 twice reads the table in order", pair.picks.map((p) => p.name));
  rollQueue = [3, 3];
  const dup = await TBE.rollAbilityPair(scores);
  check(dup.picks[0].name !== dup.picks[1].name, "a duplicate roll steps to the next score, never the same one twice",
    dup.picks.map((p) => p.name));
}

section("Townsfolk build");
{
  rollQueue = [1, 2];
  const t = await TBE.buildTownsfolk({ trades: FUNNEL.trades, abilityScores: scores, standing: "Ordinary", tradeRoll: 1 });
  const trade = FUNNEL.trades[0];
  check(t.trade.name === trade.name, "the d100 roll selects the right trade row", t.trade.name);
  const bumps = [25, 20, 10];
  const expected = trade.skills.map((s, i) => 20 + bumps[i] + (t.values[s].value - 20 - bumps[i] >= 5 ? 0 : 0));
  check(trade.skills.every((s, i) => t.values[s].value >= 20 + bumps[i]),
    "the trade raises its own skills by the standing's brackets", trade.skills.map((s) => t.values[s].value));
  const untouched = TBE.SKILL_ALL.filter((s) => !trade.skills.includes(s) &&
    !t.abilityPicks.some((n) => scores.find((a) => a.name === n).skills.includes(s)));
  check(untouched.every((s) => t.values[s].value === 20), "everything the trade and the scores did not touch stays at 20");
  check(t.notable.every((n) => n.value > 20 || n.expertise) && t.notable.length > 0,
    "the card lists only what rose above the baseline", t.notable.length);
  check(t.notable.every((n, i, a) => i === 0 || a[i - 1].value >= n.value), "notable skills are ordered best first");
  check(Object.values(t.values).every((v) => v.value <= 70), "no generated value exceeds the creation cap");
  check(t.abilityTalents.length === 2 && t.descriptors.length === 2,
    "each Ability Score contributes one Talent and one descriptor");
  const items = TBE.skillItemsFrom(t.notable);
  check(items.every((i) => i.system.group === TBE.skillGroup(i.name)),
    "skill Items carry the catalogue's category, not a hardcoded one");
  check(items.every((i) => i.system.fighting === (TBE.skillGroup(i.name) === "Combat")),
    "the fighting flag is derived from the category");
  check(items.every((i) => i.type === "skill" && typeof i.system.value === "number"), "skill Items are well-formed");
}
{
  const row = { name: "Mettle", category: "Adventuring", rank: "once", requires: "", desc: "x",
    effects: [{ changes: [{ key: "system.toughness", value: 1 }] }] };
  const item = TBE.talentItem(row, "");
  item.effects[0].changes[0].value = 99;
  check(row.effects[0].changes[0].value === 1, "talentItem() deep-copies effects instead of aliasing the catalogue");
  check(item.type === "talent" && item.system.category === "Adventuring" && item.system.ranks === 1,
    "talentItem() produces the Item shape TBE: Talents produces");
}

section("Talent selection");
{
  const TAL = JSON.parse(fs.readFileSync(path.join(__dirname, "data/talents.json"), "utf8"));
  check(TBE.talentNamed(TAL, "Quick and Quiet") && TBE.talentNamed(TAL, "Press the Point"),
    "talentNamed() matches across the case difference between chargen.json and talents.json");
  check(TBE.talentNamed(TAL, "No Such Talent") === null, "talentNamed() returns null for a name that is not there");
  const names = new Set(TAL.map((t) => t.name));
  const abilityTalents = CHARGEN.abilityScores.flatMap((a) => a.talents);
  const unresolved = abilityTalents.filter((n) => !TBE.talentNamed(TAL, n));
  check(unresolved.length === 0, "every Talent the Ability Score table offers exists in the catalogue", unresolved);

  /* A townsperson whose trade is not fighting should not be handed a combat
   * Talent when the score offers a non-combat one. Strength offers two Combat
   * Talents and Strong Back (Miscellaneous); a miller must get Strong Back. */
  let combatOnNonFighter = 0;
  for (let i = 0; i < 40; i++) {
    rollQueue = [1, 1];
    const t = await TBE.buildTownsfolk({ trades: FUNNEL.trades, abilityScores: CHARGEN.abilityScores,
      talents: TAL, standing: "Ordinary", tradeRoll: 5 });
    for (const tn of t.abilityTalents) {
      const row = TBE.talentNamed(TAL, tn);
      if (row && row.category === "Combat") combatOnNonFighter++;
    }
  }
  check(combatOnNonFighter === 0, "a non-fighting trade is never handed a Combat Talent when the score offers another",
    combatOnNonFighter);
}
{
  /* Two people in one small town should not share a trade while the table has
   * forty-nine others going spare. */
  const used = [];
  for (let i = 0; i < 12; i++) {
    rollQueue = [1, 2];
    const t = await TBE.buildTownsfolk({ trades: FUNNEL.trades, abilityScores: CHARGEN.abilityScores,
      standing: "Ordinary", avoidTrades: used });
    used.push(t.trade.name);
  }
  check(new Set(used).size === used.length, "avoidTrades keeps a roster's trades distinct", used.length - new Set(used).size);
}

/* ---- 4. the funnel tables ---- */
section("data/funnel.json");
function validateTrades(trades) {
  const errs = [];
  const seen = new Map();
  for (const t of trades) {
    if (!t.name || !t.kit || !t.knows || !t.stake) errs.push("incomplete row: " + t.name);
    if (!Array.isArray(t.skills) || t.skills.length < 2 || t.skills.length > 4) errs.push("skill count: " + t.name);
    for (const s of t.skills || []) if (!TBE.SKILL_ALL.includes(s)) errs.push("not a real skill: " + s + " (" + t.name + ")");
    for (let n = t.range[0]; n <= t.range[1]; n++) {
      if (seen.has(n)) errs.push("d100 " + n + " claimed twice: " + seen.get(n) + " / " + t.name);
      seen.set(n, t.name);
    }
  }
  for (let n = 1; n <= 100; n++) if (!seen.has(n)) errs.push("d100 " + n + " uncovered");
  const names = trades.map((t) => t.name);
  if (new Set(names).size !== names.length) errs.push("duplicate trade name");
  return errs;
}
check(validateTrades(FUNNEL.trades).length === 0, "50 trades cover d100 1-100 exactly once, with real skills only",
  validateTrades(FUNNEL.trades).slice(0, 3));
check(FUNNEL.bonds.length >= 10 && FUNNEL.bonds.every((b) => b.relation && b.tie), "the Bond table is populated");
check(FUNNEL.scars.length >= 5 && FUNNEL.scars.every((s) => s.name && s.line), "the Scar table is populated");
check(/ORIGINAL CONTENT, NOT FROM THE RULEBOOK/.test(FUNNEL._provenance),
  "the table is labelled original content, like data/concepts.json");

/* ---- 5. break each check and watch it fail ---- */
section("Mutation guard (each of these must be caught)");
const clone = (o) => JSON.parse(JSON.stringify(o));
{
  const bad = clone(FUNNEL.trades); bad[3].range = [7, 9];
  check(validateTrades(bad).length > 0, "an overlapping d100 range is caught");
}
{
  const bad = clone(FUNNEL.trades); bad[10].skills[0] = "Blacksmithing";
  check(validateTrades(bad).some((e) => e.includes("not a real skill")), "a skill name that is not in the catalogue is caught");
}
{
  const bad = clone(FUNNEL.trades); bad.pop();
  check(validateTrades(bad).some((e) => e.includes("uncovered")), "a gap in the d100 coverage is caught");
}
{
  const bad = clone(FUNNEL.trades); bad[5].stake = "";
  check(validateTrades(bad).some((e) => e.includes("incomplete")), "a row missing its stake is caught");
}
if (!book.skipped) {
  const bad = JSON.parse(JSON.stringify(TBE.SKILL_GROUPS));
  bad.Combat.push("Heal");
  const r = bookCheck(bad);
  check((r.stray || []).length > 0 || (r.missing || []).length > 0,
    "moving a skill into the wrong category is caught by the book check");
}

console.log("\n" + pass + " passed, " + fail + " failed" + (skip ? ", " + skip + " skipped" : ""));
process.exit(fail ? 1 : 0);
