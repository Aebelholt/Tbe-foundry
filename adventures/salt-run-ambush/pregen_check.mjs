/* ============================================================== *
 *  DO NOT PASTE THIS FILE INTO FOUNDRY. It is a Node script.     *
 *  It uses `import`, which a Foundry macro cannot, and you will  *
 *  get: "import declarations may only appear at top level of a   *
 *  module".                                                      *
 *                                                                *
 *  The file you paste into Foundry is:                           *
 *      TBE-Salt-Run-Ambush-Installer.js                          *
 *                                                                *
 *  Run THIS one on the machine that has the repo:                *
 *      node adventures/salt-run-ambush/pregen_check.mjs          *
 * ============================================================== */

/* pregen_check.mjs, verifies the Salt-Run Ambush actor data in
 * TBE-Salt-Run-Ambush-Installer.js against this project's own verified
 * sources, rather than against the handout's prose.
 *
 * What this can and cannot prove. It CANNOT prove the handout is right: only
 * the GM can proof-read that. What it proves is that the transcription into
 * Foundry data is consistent with the things that are already verified
 * against the book here:
 *   - the skill catalogue and the fighting-flag rule (macros/_lib.js, itself
 *     verified against /tmp/tbe.txt by funnel_check.mjs),
 *   - every weapon, armour and shield stat line (equipment.json, verified by
 *     equipment.py's own __main__ block),
 *   - every Talent name and category (data/talents.json, self-verifying via
 *     parse_talents.py),
 *   - race size, racial Toughness cap and the schema's race enum
 *     (data/chargen.json + module/data/actor-character.mjs),
 *   - Lethality Level, computed by the REAL getter sliced out of
 *     module/data/base-actor.mjs, not reimplemented here,
 *   - effective Initiative, computed by the REAL prepareDerivedData sliced
 *     out of module/documents/actor.mjs.
 * Plus one double-entry check: the handout's headline numbers are typed a
 * second time below, independently of the installer, so a single typo in
 * either copy fails instead of shipping.
 *
 * Run: node adventures/salt-run-ambush/pregen_check.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");

let pass = 0, fail = 0;
const check = (cond, label, extra) => {
  if (cond) { pass++; console.log("  PASS  " + label); }
  else { fail++; console.log("  FAIL  " + label + (extra !== undefined ? "  <- " + JSON.stringify(extra) : "")); }
};

const INSTALLER = read("adventures/salt-run-ambush/TBE-Salt-Run-Ambush-Installer.js");
const LIB = read("macros/_lib.js");
const BASE_ACTOR = read("system/the-broken-empires/module/data/base-actor.mjs");
const ACTOR_DOC = read("system/the-broken-empires/module/documents/actor.mjs");
const CHARACTER = read("system/the-broken-empires/module/data/actor-character.mjs");
const EQUIP = JSON.parse(read("equipment.json"));
const TALENTS = JSON.parse(read("data/talents.json"));
const CHARGEN = JSON.parse(read("data/chargen.json"));

/* Slice a whole `const NAME = <literal>;` statement out of real source by
 * tracking (){}[] together from just after the marker and stopping at the
 * first TOP-LEVEL semicolon. Brace-only matching breaks on destructured
 * defaults and on regex literals; this is the same fix audit_check.mjs
 * carries for the same reason. */
const liftValue = (src, marker) => {
  const i = src.indexOf(marker);
  if (i < 0) throw new Error("marker not found: " + marker);
  let j = i + marker.length, depth = 0, inStr = null;
  const start = j;
  for (; j < src.length; j++) {
    const c = src[j], prev = src[j - 1];
    if (inStr) { if (c === inStr && prev !== "\\") inStr = null; continue; }
    if (c === '"' || c === "'" || c === "`") { inStr = c; continue; }
    if ("({[".includes(c)) depth++;
    else if (")}]".includes(c)) depth--;
    else if (c === ";" && depth === 0) break;
  }
  return src.slice(start, j);
};

const evalLiteral = (text) => new Function("return (" + text.trim() + ");")();

const PREGENS = evalLiteral(liftValue(INSTALLER, "const PREGENS ="));
const WEAPON_LINES = evalLiteral(liftValue(INSTALLER, "const WEAPON_LINES ="));
const ARMOR_LINES = evalLiteral(liftValue(INSTALLER, "const ARMOR_LINES ="));
const SHIELD_LINES = evalLiteral(liftValue(INSTALLER, "const SHIELD_LINES ="));

/* The real skill catalogue and fighting rule, sliced out of their one owner. */
const SKILL_GROUPS = evalLiteral(liftValue(LIB, "TBE.SKILL_GROUPS ="));
const skillGroup = (name) => Object.keys(SKILL_GROUPS).find((g) => SKILL_GROUPS[g].includes(name)) ?? null;
const isFighting = (name) => skillGroup(name) === "Combat";

console.log("\n0. The data actually came out of the shipped installer");
check(Array.isArray(PREGENS) && PREGENS.length === 8, "eight pregens lifted from the installer", PREGENS.length);
check(Object.keys(SKILL_GROUPS).length === 4, "the real skill catalogue lifted from macros/_lib.js", Object.keys(SKILL_GROUPS));
check(/TBE\.isFighting = \(name\) => TBE\.skillGroup\(name\) === "Combat"/.test(LIB),
  "the fighting rule in _lib.js is still 'Combat group iff fighting', which is what the installer stamps");

console.log("\n1. Every skill name and group matches the one owner");
for (const p of PREGENS) {
  for (const [sname, value, group] of p.skills) {
    const canonical = skillGroup(sname);
    check(canonical !== null, `${p.name}: "${sname}" is a real skill in the catalogue`, sname);
    check(canonical === group, `${p.name}: "${sname}" is stamped ${group}, catalogue says ${canonical}`, { sname, group, canonical });
    check(isFighting(sname) === (group === "Combat"), `${p.name}: "${sname}" fighting flag follows the group`, sname);
  }
}

console.log("\n2. Expertise respects the Skill Expertise Limits table (p.53)");
/* below 40 none, 40-59 caps at Ex2, 60-79 at Ex3, 80+ at Ex4, and there is
 * no Ex1 tier. */
const expertiseCap = (v) => (v < 40 ? 0 : v < 60 ? 2 : v < 80 ? 3 : 4);
for (const p of PREGENS) {
  for (const [sname, value, , expertise] of p.skills) {
    const ex = expertise || 0;
    check(ex === 0 || ex >= 2, `${p.name}: ${sname} Expertise ${ex} is not the nonexistent Ex1`, ex);
    check(ex <= expertiseCap(value), `${p.name}: ${sname} at ${value} may hold Ex${ex} (cap Ex${expertiseCap(value)})`, { sname, value, ex });
  }
  const exCount = p.skills.filter((s) => (s[3] || 0) > 0).length;
  check(exCount === 1, `${p.name} has exactly one Expertise skill, like every other sheet on the roster`, exCount);
}

console.log("\n3. Lethality Level, computed by the real getter, matches each Death Threshold");
/* Slice the real getter body rather than restating ceil(dt/3). */
const llBody = (() => {
  const i = BASE_ACTOR.indexOf("get lethalityLevel()");
  const open = BASE_ACTOR.indexOf("{", i);
  let depth = 0, j = open;
  for (; j < BASE_ACTOR.length; j++) {
    if (BASE_ACTOR[j] === "{") depth++;
    else if (BASE_ACTOR[j] === "}") { depth--; if (!depth) break; }
  }
  return BASE_ACTOR.slice(open + 1, j);
})();
check(llBody.includes("Math.ceil"), "lethalityLevel getter body lifted from base-actor.mjs");
const lethalityLevel = (dtMax, bonus = 0, penalty = 0) =>
  new Function(llBody).call({ deathThreshold: { max: dtMax }, lethalityBonus: bonus, lethalityPenalty: penalty });

console.log("\n4. Weapon, armour and shield lines match equipment.json exactly");
const weaponRow = (name) => EQUIP.weapons.find((r) => r[0] === name);
const armorRow = (name) => EQUIP.armor.find((r) => r[0] === name);
const shieldRow = (name) => EQUIP.shields.find((r) => r[0] === name);
/* equipment.json weapon columns: Name, Category, Cost, Reach, Dmg, CL, CS, Dis, T, Enc, Range, Notes */
for (const [wname, line] of Object.entries(WEAPON_LINES)) {
  const row = weaponRow(line.book);
  check(!!row, `weapon "${wname}" cites a real equipment.json row ("${line.book}")`, line.book);
  if (!row) continue;
  const dmg = parseInt(String(row[4]), 10);
  check(line.dmg === dmg, `${wname}: Dmg ${line.dmg} matches the book's ${row[4]}`, { wname, line: line.dmg, book: row[4] });
  check(line.cl === Number(row[5]), `${wname}: CL matches`, { line: line.cl, book: row[5] });
  check(line.cs === Number(row[6]), `${wname}: CS matches`, { line: line.cs, book: row[6] });
  check(line.dis === Number(row[7]), `${wname}: Dis matches`, { line: line.dis, book: row[7] });
  check(line.t === Number(row[8]), `${wname}: T matches`, { line: line.t, book: row[8] });
  /* The weapon's skill must be the one its book category implies. */
  const CATEGORY_SKILL = { Light: "Melee: Light", Medium: "Melee: Medium", Heavy: "Melee: Heavy", Missile: "Missile", Thrown: "Thrown", Might: "Might" };
  check(line.skillName === CATEGORY_SKILL[row[1]],
    `${wname}: skillName "${line.skillName}" matches its book category "${row[1]}"`, { wname, skill: line.skillName, category: row[1] });
}
/* equipment.json armor columns: Name, Cost, AP, Bulk, ... */
for (const [aname, line] of Object.entries(ARMOR_LINES)) {
  const row = armorRow(aname);
  check(!!row, `armour "${aname}" is a real equipment.json row`, aname);
  if (!row) continue;
  check(line.ap === Number(row[2]), `${aname}: AP ${line.ap} matches the book's ${row[2]}`, { line: line.ap, book: row[2] });
  check(line.bulk === Number(row[3]), `${aname}: Bulk ${line.bulk} matches the book's ${row[3]}`, { line: line.bulk, book: row[3] });
}
/* equipment.json shield columns: Name, Cost, AP, ShB, Enc, Notes */
for (const [sname, line] of Object.entries(SHIELD_LINES)) {
  const row = shieldRow(sname);
  check(!!row, `shield "${sname}" is a real equipment.json row`, sname);
  if (!row) continue;
  check(line.ap === Number(String(row[2]).replace("+", "")), `${sname}: AP matches the book`, { line: line.ap, book: row[2] });
  check(line.shb === Number(row[3]), `${sname}: Shield Bash SL matches the book`, { line: line.shb, book: row[3] });
  check(line.enc === Number(row[4]), `${sname}: ENC matches the book`, { line: line.enc, book: row[4] });
}

console.log("\n5. Every carried item on a sheet resolves to a defined line");
for (const p of PREGENS) {
  for (const w of p.weapons) check(!!WEAPON_LINES[w], `${p.name} carries "${w}", which has a stat line`, w);
  for (const [a] of p.armor) check(!!ARMOR_LINES[a], `${p.name} wears "${a}", which has a stat line`, a);
  for (const s of p.shields) check(!!SHIELD_LINES[s], `${p.name} carries "${s}", which has a stat line`, s);
}

console.log("\n6. Every Talent is a real Talent, with the book's own category");
const talentByName = Object.fromEntries(TALENTS.map((t) => [t.name, t]));
for (const p of PREGENS) {
  for (const [tname, category] of p.talents) {
    const t = talentByName[tname];
    check(!!t, `${p.name}: "${tname}" exists in data/talents.json`, tname);
    if (!t) continue;
    check(t.category === category, `${p.name}: "${tname}" category ${category} matches the book's ${t.category}`, { tname, category, book: t.category });
  }
}

console.log("\n7. Race, size and the racial Toughness cap");
const raceEnum = (CHARACTER.match(/choices:\s*\[([^\]]*)\]/) || [])[1] || "";
const raceByName = Object.fromEntries(CHARGEN.races.map((r) => [r.name, r]));
for (const p of PREGENS) {
  check(raceEnum.includes(`"${p.race}"`), `${p.name}: race "${p.race}" is in the schema's enum`, p.race);
  const r = raceByName[p.race];
  check(!!r, `${p.name}: race "${p.race}" exists in chargen data`, p.race);
  if (!r) continue;
  check(r.size === "Medium", `${p.name}: ${p.race} is Medium, so the installer's hardcoded size is right`, r.size);
  if (r.toughnessCap !== null && r.toughnessCap !== undefined) {
    check(p.toughness <= r.toughnessCap,
      `${p.name}: Toughness ${p.toughness} respects the ${p.race} cap of ${r.toughnessCap}`, { t: p.toughness, cap: r.toughnessCap });
  }
  check(p.toughness >= (r.toughness || 0),
    `${p.name}: Toughness ${p.toughness} is at least the ${p.race} racial ${r.toughness || 0}`, { t: p.toughness, racial: r.toughness });
}

console.log("\n8. Effective Initiative, run through the real prepareDerivedData");
/* The armour penalty is not cosmetic: ceil(total Bulk / 3) comes off
 * Initiative, so ANY worn armour costs at least 1, including Padding at 0.5
 * Bulk. Two sheets describe their armour as not slowing them down, which the
 * book's own rounding makes impossible. This asserts the real numbers so the
 * GM sees them rather than discovering them mid-combat. */
const derivedBody = (() => {
  const i = ACTOR_DOC.indexOf("prepareDerivedData() {");
  const open = ACTOR_DOC.indexOf("{", i);
  let depth = 0, j = open;
  for (; j < ACTOR_DOC.length; j++) {
    if (ACTOR_DOC[j] === "{") depth++;
    else if (ACTOR_DOC[j] === "}") { depth--; if (!depth) break; }
  }
  return ACTOR_DOC.slice(open + 1, j);
})();
check(derivedBody.includes("armorInitPenalty"), "prepareDerivedData body lifted from documents/actor.mjs");

const effectiveInit = (p) => {
  const items = p.armor.map(([aname]) => ({ type: "armor", system: { equipped: true, bulk: ARMOR_LINES[aname].bulk } }));
  const stub = { items, system: { initiative: p.initiative } };
  new Function(derivedBody).call(stub);
  return stub.system;
};
const initTable = [];
for (const p of PREGENS) {
  const d = effectiveInit(p);
  initTable.push({ name: p.name, sheet: p.initiative, penalty: d.armorInitPenalty, effective: d.initiativeEffective });
  const expected = p.initiative - Math.ceil(p.armor.reduce((s, [a]) => s + ARMOR_LINES[a].bulk, 0) / 3);
  check(d.initiativeEffective === expected,
    `${p.name}: sheet Initiative ${p.initiative}, armour penalty ${d.armorInitPenalty}, tracker rolls 1d10+${d.initiativeEffective}`,
    { expected, got: d.initiativeEffective });
}
console.log("\n    Initiative the players will actually see:");
for (const r of initTable) {
  console.log(`      ${r.name.padEnd(24)} sheet +${r.sheet}  armour -${r.penalty}  ->  1d10 + ${r.effective}`);
}

console.log("\n9. Double-entry: the handout's headline numbers, typed independently");
/* Re-transcribed straight from "Riona's Reach, Pick Your Brigand" without
 * looking at the installer, so a single typo in either copy fails here.
 * [Max Resolve, Initiative, Toughness, Death Threshold, Lethality Level] */
const HANDOUT = {
  "Renn Kestrel":            [14, 11, 1, 20, 7],
  "Sela Voss":               [12, 13, 0, 20, 7],
  "Grael Ashbeard":          [10, 10, 2, 24, 8],
  "Dags Farrow":             [12, 12, 1, 20, 7],
  "Ysolt Vane":              [16, 10, 0, 20, 7],
  "Uisdean Fen":             [12, 10, 2, 20, 7],
  "\"Mother\" Mairwen Coll": [14, 10, 1, 22, 8],
  "Old Ambrose Duff":        [12, 11, 1, 20, 7]
};
check(Object.keys(HANDOUT).length === PREGENS.length, "the handout table covers every pregen", Object.keys(HANDOUT).length);
for (const p of PREGENS) {
  const h = HANDOUT[p.name];
  check(!!h, `${p.name} appears in the independently typed handout table`, p.name);
  if (!h) continue;
  const [resolve, init, tough, dt, ll] = h;
  check(p.resolve === resolve, `${p.name}: Max Resolve ${p.resolve} matches the handout's ${resolve}`, { p: p.resolve, h: resolve });
  check(p.initiative === init, `${p.name}: Initiative ${p.initiative} matches the handout's ${init}`, { p: p.initiative, h: init });
  check(p.toughness === tough, `${p.name}: Toughness ${p.toughness} matches the handout's ${tough}`, { p: p.toughness, h: tough });
  check(p.dt === dt, `${p.name}: Death Threshold ${p.dt} matches the handout's ${dt}`, { p: p.dt, h: dt });
  /* And the handout's printed Lethality Level must be what the system will
   * actually derive from that Death Threshold, or the sheet lies to the player. */
  check(lethalityLevel(p.dt) === ll,
    `${p.name}: handout prints Lethality Level ${ll}, the real getter derives ${lethalityLevel(p.dt)} from DT ${p.dt}`,
    { printed: ll, derived: lethalityLevel(p.dt) });
}

console.log("\n10. Mutation guards: break it on purpose, confirm these checks catch it");
{
  /* A skill stamped with the wrong group is the exact defect this whole
   * section exists to prevent (NPC generation once hardcoded every skill to
   * "Adventuring"). */
  const broken = skillGroup("Heal") === "Adventuring";
  check(!broken && skillGroup("Heal") === "Lore", "sanity: Heal really is a Lore skill, not Adventuring");
  const wouldCatch = (() => {
    const stamped = "Adventuring";
    return skillGroup("Heal") !== stamped; // section 1 asserts equality, so this being true means it fails
  })();
  check(wouldCatch, "a Heal skill mis-stamped as Adventuring WOULD fail section 1");
}
{
  /* An Expertise above the p.53 cap must fail, not pass quietly. */
  check(expertiseCap(35) === 0, "a skill at 35 can hold no Expertise at all");
  check(expertiseCap(70) === 3 && 4 > expertiseCap(70), "Ex4 on a 70 skill WOULD fail the cap check");
}
{
  /* A Lethality Level that does not follow from Death Threshold must fail. */
  check(lethalityLevel(24) === 8 && lethalityLevel(24) !== 7,
    "a Grael typed with DT 24 but Lethality Level 7 WOULD fail section 9");
}
{
  /* A weapon line silently off by one must fail against equipment.json. */
  const rapierish = EQUIP.weapons.find((r) => r[0] === "Broadsword / Mace / Scimitar / Flail");
  check(Number(rapierish[4]) === 4 && Number(rapierish[4]) !== 5,
    "a Longsword line typed as Dmg 5 WOULD fail against the book's Medium row");
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);

console.log("\n11. Rules as Written: enemy Initiative and the Beat 6 tie");
/* p.161: "Enemies typically do not roll; they have a static Initiative
 * value... Ties go to the PC." Both NPCs are therefore creature-type
 * actors, whose Initiative field is used verbatim as the tracker formula.
 * That is not a cosmetic choice: the "ties go to the PC" tie-break is
 * implemented as actor.type === "character", so a character-type NPC would
 * be indistinguishable from a PC and would win ties on the alphabetical
 * fallback underneath. Assert the real comparator's real answer. */
const MAIN = read("system/the-broken-empires/module/the-broken-empires.mjs");
const sliceBody = (src, marker) => {
  const i = src.indexOf(marker);
  const open = src.indexOf("{", i);
  let depth = 0, j = open;
  for (; j < src.length; j++) {
    if (src[j] === "{") depth++;
    else if (src[j] === "}") { depth--; if (!depth) break; }
  }
  return src.slice(open + 1, j);
};
const sortBody = sliceBody(MAIN, "_sortCombatants(a, b) {");
check(sortBody.includes("pcA"), "_sortCombatants body lifted from the init hook");

globalThis.Number.isNumeric = (n) => Number.isFinite(Number(n)); // Foundry's helper
const sortCombatants = new Function("a", "b", sortBody);
const combatant = (name, type, init) => ({ name, initiative: init, actor: { type } });

/* Both NPCs really are creature-type in the shipped installer. */
const dunchadhBlock = INSTALLER.slice(INSTALLER.indexOf('name: "Dunchadh Reave"'), INSTALLER.indexOf('name: "Dunchadh Reave"') + 2500);
check(/type:\s*"creature"/.test(dunchadhBlock), "Dunchadh is a creature-type actor, so RAW he does not roll Initiative");
check(/initiative:\s*"10"/.test(dunchadhBlock), "...with a static Initiative of 10, used verbatim as his tracker formula");
const elspethBlock = INSTALLER.slice(INSTALLER.indexOf('name: "Elspeth Dunmore"'), INSTALLER.indexOf('name: "Elspeth Dunmore"') + 2000);
check(/type:\s*"creature"/.test(elspethBlock) && /initiative:\s*"14"/.test(elspethBlock), "Elspeth likewise, static 14");

{
  /* The duel, as it will actually resolve: Ambrose +11 less 1 for his
   * leather is an effective 10, against Dunchadh's static 10. */
  const ambrose = combatant("Old Ambrose Duff", "character", 10);
  const dunchadh = combatant("Dunchadh Reave", "creature", 10);
  const order = [dunchadh, ambrose].sort(sortCombatants).map((c) => c.name);
  check(order[0] === "Old Ambrose Duff",
    "RAW HOLDS: on the Beat 6 Initiative tie, Ambrose acts first, because ties go to the PC",
    order);
}
{
  /* The mutation: had Dunchadh stayed a character-type actor (the earlier
   * build, per ticket 3's "rolls normally"), the same tie would have gone
   * the other way on alphabetical order, silently breaking a book rule. */
  const ambrose = combatant("Old Ambrose Duff", "character", 10);
  const dunchadhAsPC = combatant("Dunchadh Reave", "character", 10);
  const order = [ambrose, dunchadhAsPC].sort(sortCombatants).map((c) => c.name);
  check(order[0] === "Dunchadh Reave",
    "...and confirms why: as a character-type actor he WOULD have taken the tie from the PC, which is the defect the creature type avoids",
    order);
}

/* The real portrait helpers, lifted rather than stubbed, so the builders
 * below exercise the actual img/token wiring the installer ships. */
const ART = evalLiteral(liftValue(INSTALLER, "const ART ="));
const ART_BASE = evalLiteral(liftValue(INSTALLER, "const ART_BASE ="));
const portrait = (name) => (ART[name] ? ART_BASE + ART[name] : "icons/svg/mystery-man.svg");
const withArt = (name) => ({
  img: portrait(name),
  prototypeToken: { name, texture: { src: portrait(name) }, displayName: 20 }
});

console.log("\n12. The real builder, run: every weapon is rollable with a real skill");
/* Rather than re-describing what makePregens does, run the shipped function
 * against a stub Actor.create and assert on the documents it actually
 * produces. p.104: a skill with no value "begins at 20", so a weapon whose
 * skill is missing from a sheet must come out with that skill at 20 rather
 * than with no skill at all. */
const makeBody = sliceBody(INSTALLER, "async function makePregens() {");
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const created = [];
const stubActor = { create: async (data) => { created.push(data); return data; } };
const stubGame = { actors: { getName: () => null } };
const stubUi = { notifications: { error: (m) => { throw new Error("installer reported: " + m); } } };
await new AsyncFunction("PREGENS", "WEAPON_LINES", "WEAPON_NOTES", "ARMOR_LINES", "SHIELD_LINES", "Actor", "game", "ui", "note", "withArt", makeBody)(
  PREGENS, WEAPON_LINES, evalLiteral(liftValue(INSTALLER, "const WEAPON_NOTES =")), ARMOR_LINES, SHIELD_LINES, stubActor, stubGame, stubUi, () => {}, withArt
);
check(created.length === 8, "the real makePregens produced eight actor documents", created.length);

for (const a of created) {
  const skills = a.items.filter((i) => i.type === "skill");
  const weapons = a.items.filter((i) => i.type === "weapon");
  const names = skills.map((i) => i.name);
  check(new Set(names).size === names.length, `${a.name}: no duplicate skill Items`, names);
  for (const w of weapons) {
    const sk = skills.find((i) => i.name === w.system.skillName);
    check(!!sk, `${a.name}: "${w.name}" is rolled with ${w.system.skillName}, which is on the sheet`, w.system.skillName);
    if (sk && !PREGENS.find((p) => p.name === a.name).skills.some((r) => r[0] === sk.name)) {
      check(sk.system.value === 20, `${a.name}: ${sk.name} was backfilled at the book's starting value of 20`, sk.system.value);
      check(sk.system.group === "Combat" && sk.system.fighting === true, `${a.name}: the backfilled ${sk.name} is a Combat skill and flagged fighting`);
    }
  }
  check(a.type === "character", `${a.name} is a character-type actor, so RAW they roll 1d10 + Initiative`, a.type);
}
{
  /* The book's free single dagger: "A single dagger may always be at hand
   * with no ENC cost." Sela carries two, so exactly one is free. */
  const sela = created.find((a) => a.name === "Sela Voss");
  const daggers = sela.items.filter((i) => i.name === "Dagger");
  check(daggers.length === 2, "Sela carries two daggers", daggers.length);
  check(daggers.filter((d) => d.system.enc === 0).length === 1 && daggers.filter((d) => d.system.enc === 1).length === 1,
    "exactly one of them is ENC 0, per the book's single-free-dagger note",
    daggers.map((d) => d.system.enc));
}
{
  /* Ambrose fights the duel with a weapon his own skill covers. */
  const ambrose = created.find((a) => a.name === "Old Ambrose Duff");
  const blade = ambrose.items.find((i) => i.type === "weapon");
  const skill = ambrose.items.find((i) => i.name === blade.system.skillName);
  check(blade.name === "Broadsword" && blade.system.skillName === "Melee: Medium" && skill.system.value === 70,
    "Ambrose's blade is a Broadsword, a Medium weapon, rolled on his Melee: Medium 70, exactly as Beat 6 assumes",
    { weapon: blade.name, skill: blade.system.skillName, value: skill.system.value });
  check(!ambrose.items.some((i) => i.name === "Melee: Heavy"),
    "...and he needs no Melee: Heavy, because nothing he carries is a Heavy weapon");
}

console.log("\n13. The installer really is pasteable into Foundry");
/* `node -c` is NOT the same test. Foundry compiles a script macro's command
 * as the body of an async function, so a top-level `import` or a top-level
 * `return` fails there while passing a plain CommonJS syntax check. This
 * section compiles the shipped installer, and both macros it creates, the
 * way Foundry actually will.
 *
 * It exists because the check script below it uses `import` and was once
 * pasted into a macro by mistake, producing exactly Foundry's "import
 * declarations may only appear at top level of a module". The installer was
 * fine; the wrong file had been pasted. Now the suite states which file is
 * which, in code. */
/* Foundry passes these into a script macro's scope. AsyncFunction is
 * already in scope from section 12, which runs the real builder. */
const MACRO_ARGS = ["speaker", "actor", "token", "character", "scope", "event"];
const compilesAsMacro = (src) => {
  try { new AsyncFunction(...MACRO_ARGS, src); return null; }
  catch (e) { return e.message; }
};

{
  const err = compilesAsMacro(INSTALLER);
  check(err === null, "TBE-Salt-Run-Ambush-Installer.js compiles as a Foundry script macro", err);
  check(!/^\s*import\s/m.test(INSTALLER), "the installer contains no import declaration anywhere");
  check(/THIS IS THE FILE YOU PASTE INTO FOUNDRY/.test(INSTALLER),
    "...and says so on its first line, so it cannot be confused with the check script");
}
{
  /* The two macros the installer creates are themselves macro bodies. */
  const blocks = [...INSTALLER.matchAll(/const command = `([\s\S]*?)`\.trim\(\);/g)]
    .map((m) => m[1].replace(/\\`/g, "`").replace(/\\\$/g, "$"));
  check(blocks.length === 2, "both macro commands lifted out of the installer", blocks.length);
  const names = ["TBE: Salt-Run Trackers", "TBE: Dunchadh's Talisman"];
  blocks.forEach((b, i) => {
    const err = compilesAsMacro(b);
    check(err === null, `the "${names[i]}" macro it creates also compiles as a Foundry macro`, err);
    check(!/^\s*return\s*;?\s*$/m.test(b),
      `..."${names[i]}" uses no bare top-level return, matching every other macro in this repo`);
  });
}
{
  /* And the converse, asserted rather than assumed: this file is a Node
   * script and must NOT be pasted into Foundry. */
  const selfSrc = read("adventures/salt-run-ambush/pregen_check.mjs");
  const err = compilesAsMacro(selfSrc);
  check(err !== null, "pregen_check.mjs is correctly NOT a valid Foundry macro (it is a Node script)", err);
  check(/DO NOT PASTE THIS FILE INTO FOUNDRY/.test(selfSrc),
    "...and carries a first-line banner saying so, naming the installer as the file to paste instead");
}

console.log("\n14. Elspeth is a faithful reskin of a real bestiary entry");
/* She was rebuilt from the book's own "Barbarian Warrior" (Ch.18) rather
 * than hand-tuned, because eight Engaged brigands get +20 each against an
 * outnumbered foe (p.163) and ticket 2's civilian stat line did not survive
 * contact with that. This checks the reskin against bestiary.json, the
 * verified source, so the numbers cannot quietly drift from the block they
 * claim to come from. */
const BEAST = JSON.parse(read("bestiary.json"));
const beastList = Array.isArray(BEAST) ? BEAST : (BEAST.creatures || []);
const SOURCE = beastList.find((b) => b.name === "Barbarian Warrior");
check(!!SOURCE, "the Barbarian Warrior entry exists in bestiary.json");

/* Lift her real actor data by running the shipped creator against a stub. */
const elspethBody = sliceBody(INSTALLER, "async function makeElspeth() {");
let elspethDoc = null;
await new AsyncFunction("game", "Actor", "note", "withArt", elspethBody)(
  { actors: { getName: () => null } },
  { create: async (d) => { elspethDoc = d; return d; } },
  () => {}, withArt
);
check(!!elspethDoc, "the real makeElspeth produced an actor document");

const eSkill = (n) => elspethDoc.items.find((i) => i.type === "skill" && i.name === n);
const srcSkill = (n) => (SOURCE.skills.find((s) => s.name === n) || {}).value;

/* Every combat-relevant number she took from the block matches the block. */
for (const n of ["Dodge", "Might", "Athletics", "Endurance", "Perception", "Willpower", "Insight", "Intimidate"]) {
  check(eSkill(n) && eSkill(n).system.value === srcSkill(n),
    `${n} ${eSkill(n) ? eSkill(n).system.value : "missing"} matches the Barbarian Warrior's ${srcSkill(n)}`,
    { her: eSkill(n) && eSkill(n).system.value, block: srcSkill(n) });
}
/* The block writes its weapons as "Spear 70" / "Longbow 70"; this build maps
 * those onto the PC skill catalogue instead, so check the VALUES carry over. */
const blockAttackValue = (weapon) => {
  const line = SOURCE.attacks.find((a) => a.startsWith(weapon));
  return Number((line.match(/^\w+\s+(\d+)/) || [])[1]);
};
check(eSkill("Melee: Medium").system.value === blockAttackValue("Spear"),
  `her Melee: Medium ${eSkill("Melee: Medium").system.value} carries the block's Spear ${blockAttackValue("Spear")}`);
check(eSkill("Missile").system.value === blockAttackValue("Longbow"),
  `her Missile ${eSkill("Missile").system.value} carries the block's Longbow ${blockAttackValue("Longbow")}`);
check(eSkill("Survival").system.value === 60 && eSkill("Ride").system.value === 55,
  "her own non-combat skills from ticket 2 survived the reskin (Survival 60, Ride 55)");

/* Armour grid, the thing that actually makes her a fight. */
const LOCMAP = { Body: "body", Head: "head", "R Arm": "rArm", "L Arm": "lArm", "R Leg": "rLeg", "L Leg": "lLeg" };
for (const row of SOURCE.armour) {
  const key = LOCMAP[row.loc];
  const got = elspethDoc.system.armour[key];
  check(got && got.natural === Number(row.natural) && got.worn === Number(row.worn),
    `armour ${row.loc}: ${row.natural}+${row.worn} AP matches the block`, { loc: row.loc, got });
}
check(elspethDoc.system.armour.body.natural + elspethDoc.system.armour.body.worn === 8,
  "...which is 8 AP on the body, the reason most PC weapons now chip rather than cut");

/* Ferocity, Initiative, Difficulty and the deliberate +1. */
check(elspethDoc.system.difficulty === SOURCE.difficulty, `Difficulty ${elspethDoc.system.difficulty} matches the block`);
check(elspethDoc.system.initiative === String(SOURCE.init), `static Initiative ${elspethDoc.system.initiative} matches the block`);
check(elspethDoc.system.move === SOURCE.move, `Move ${elspethDoc.system.move} matches the block`);
check(Number(elspethDoc.system.ferocity) === Number(SOURCE.ferocity) + 1,
  `Ferocity ${elspethDoc.system.ferocity} is the block's ${SOURCE.ferocity} plus the p.440 modifier for defending kin`,
  { hers: elspethDoc.system.ferocity, block: SOURCE.ferocity });
check(Number(elspethDoc.system.ferocity) <= 6, "Ferocity stays inside the book's 1-6 scale");

/* Her weapons still resolve to skills she has, and to real book rows. */
for (const w of elspethDoc.items.filter((i) => i.type === "weapon")) {
  check(!!eSkill(w.system.skillName), `"${w.name}" is rolled with ${w.system.skillName}, which is on her sheet`);
}
const spear = elspethDoc.items.find((i) => i.name.startsWith("Spear"));
const bookSpear = EQUIP.weapons.find((r) => r[0] === "Spear");
check(spear.system.dmg === Number(bookSpear[4]) && spear.system.cl === Number(bookSpear[5]) &&
      spear.system.cs === Number(bookSpear[6]) && spear.system.dis === Number(bookSpear[7]) &&
      spear.system.t === Number(bookSpear[8]),
  "her spear carries the book's Spear line exactly (Dmg 3, CL 3, CS 3, Dis 5, T 5)");
const bow = elspethDoc.items.find((i) => i.name === "Longbow");
const bookBow = EQUIP.weapons.find((r) => r[0] === "Longbow");
check(bow.system.dmg === Number(bookBow[4]) && bow.system.ranged === true,
  "her longbow carries the book's Longbow line and is flagged ranged");
const shield = elspethDoc.items.find((i) => i.type === "shield");
const bookShield = EQUIP.shields.find((r) => r[0] === "Medium Shield");
check(shield.system.ap === Number(String(bookShield[2]).replace("+", "")) && shield.system.shb === Number(bookShield[3]),
  "her medium shield carries the book's line (+4 AP, Shield Bash 6 SL)");

/* Her skill groups still come from the one owner, same as the PCs. */
for (const sk of elspethDoc.items.filter((i) => i.type === "skill")) {
  check(skillGroup(sk.name) === sk.system.group, `${sk.name} is stamped ${sk.system.group}, catalogue agrees`, sk.name);
  /* BooleanField({initial:false}) supplies the default, so an omitted flag
   * is false in a live world. Assert the effective value, not redundancy. */
  check((sk.system.fighting ?? false) === (sk.system.group === "Combat"),
    `${sk.name}: fighting flag follows the group`, sk.system.fighting);
}

/* And the derived number that has to stay true on the sheet. */
check(lethalityLevel(20) === 7, "Death Threshold 20 still derives Lethality Level 7, unchanged from ticket 2");

console.log("\n15. Portraits point at files that actually exist");
/* A mistyped filename is a broken image in Foundry and nothing else: no
 * error, no warning, just a blank portrait somebody notices at the table.
 * Cheap to check here, so check it. */
const artDir = path.join(ROOT, "adventures/salt-run-ambush/art");
check(ART_BASE.endsWith("/"), "ART_BASE ends in a slash, so paths concatenate cleanly", ART_BASE);
for (const [who, file] of Object.entries(ART)) {
  check(fs.existsSync(path.join(artDir, file)), `${who}: "${file}" exists in the art folder`, file);
}
/* Every name with art must be a real actor this installer creates. */
const builtNames = new Set([...PREGENS.map((p) => p.name), "Elspeth Dunmore", "Dunchadh Reave"]);
for (const who of Object.keys(ART)) {
  check(builtNames.has(who), `"${who}" is an actor this installer actually creates`, who);
}
/* And the three with no match fall back to the silhouette rather than to
 * a broken path or an empty string. */
const portraitFor = new Function("ART", "ART_BASE", "name",
  'return (ART[name] ? ART_BASE + ART[name] : "icons/svg/mystery-man.svg");');
for (const who of ["Dags Farrow", "Ysolt Vane", '"Mother" Mairwen Coll']) {
  check(portraitFor(ART, ART_BASE, who) === "icons/svg/mystery-man.svg",
    `${who} has no art and falls back to Foundry's own silhouette`, portraitFor(ART, ART_BASE, who));
}
check(Object.keys(ART).length === 7, "seven of the ten actors are cast", Object.keys(ART).length);
/* Credit is not optional: the artist's name has to survive in the filename. */
for (const file of Object.values(ART)) {
  check(/--(calebisdrawing|art-adams-2023)\./.test(file),
    `"${file}" carries its artist's credit in the filename`, file);
}
check(fs.existsSync(path.join(artDir, "README.md")), "the art folder carries a README with full credit and licence notes");
check(fs.existsSync(path.join(artDir, "pair-original--calebisdrawing.jpg")),
  "the untouched two-figure original is kept beside the two crops taken from it");

console.log(`\nfinal: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
