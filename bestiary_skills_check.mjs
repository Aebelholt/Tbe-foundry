/*
 * bestiary_skills_check.mjs -- the Ch.18 creatures' skills, read out of the
 * BUILT tbe-bestiary pack, not out of the script that builds it.
 *
 * Three defects, all in the same six lines of build_packs.mjs:
 *   1. every creature skill was stamped group "Adventuring", so a Dragon's
 *      Dodge sat under the Adventuring heading and was not a fighting skill;
 *   2. Expertise was glued onto the name ("Might Ex4"), where resolve() never
 *      saw it, and the picker then offered "Might Ex4" at 90 AND an untrained
 *      "Might" at 20;
 *   3. an attack's Expertise ("Broadsword 90 Ex3") was matched and discarded.
 * The group rule has one owner, TBE.creatureSkillGroup in macros/_lib.js,
 * which defers to TBE.skillGroup for the catalogue.
 */
import { ClassicLevel } from "classic-level";
import { readFileSync, cpSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

let pass = 0, fail = 0;
const check = (cond, label, extra) => {
  if (cond) { pass++; console.log("  PASS  " + label); }
  else { fail++; console.log("  FAIL  " + label + (extra !== undefined ? "  <- " + JSON.stringify(extra).slice(0, 300) : "")); }
};

const LIB = readFileSync("macros/_lib.js", "utf8");
const loadTBE = (src = LIB) => new Function("canvas", "game", "foundry", "ui", "CONFIG", src + "\n;return TBE;")(
  { tokens: { controlled: [] } }, { user: { character: null } },
  { utils: { duplicate: (o) => JSON.parse(JSON.stringify(o)) } },
  { notifications: { warn() {}, error() {}, info() {} } }, undefined);
const TBE = loadTBE();

/* The sheet's headings, from the system's own config. */
const cfg = readFileSync("system/the-broken-empires/module/helpers/config.mjs", "utf8");
const HEADINGS = JSON.parse(cfg.match(/TBE\.SKILL_GROUPS\s*=\s*(\[[^\]]*\])/)[1].replace(/'/g, '"'));

/* The real pack. */
/* Read a COPY: opening a LevelDB writes LOCK and LOG files, and those must
 * never appear inside the shipped tree (audit_check section 6). */
const TMP = mkdtempSync(path.join(tmpdir(), "tbe-bestiary-"));
cpSync("system/the-broken-empires/packs/tbe-bestiary", TMP, { recursive: true });
const db = new ClassicLevel(TMP, { valueEncoding: "json" });
const actors = {}, items = [];
for await (const [k, v] of db.iterator()) {
  if (k.startsWith("!actors!")) actors[v._id] = v;
  else if (k.startsWith("!actors.items!")) items.push(Object.assign({ actorId: k.slice(14).split(".")[0] }, v));
}
await db.close();
rmSync(TMP, { recursive: true, force: true });
const creatures = Object.values(actors).map((a) => Object.assign({}, a, {
  items: items.filter((i) => i.actorId === a._id)
}));
const byName = Object.fromEntries(creatures.map((c) => [c.name, c]));
const skillOf = (cn, sn) => (byName[cn]?.items || []).find((i) => i.type === "skill" && i.name === sn);

/* Every invariant, as a function of the creature list, so a mutation can
 * feed it a broken copy and watch it fail. Returns the failures. */
function invariants(list, T = TBE) {
  const bad = [];
  for (const c of list) {
    const skills = c.items.filter((i) => i.type === "skill");
    const skillNames = skills.map((s) => s.name);
    for (const s of skills) {
      const where = c.name + ": " + s.name;
      if (!HEADINGS.includes(s.system.group)) bad.push(["heading the sheet does not have", where, s.system.group]);
      const cat = T.skillGroup(s.name);
      if (cat && s.system.group !== cat) bad.push(["disagrees with the catalogue", where, s.system.group + " vs " + cat]);
      if (s.system.fighting !== (s.system.group === "Combat")) bad.push(["fighting not derived from group", where]);
      if (/\sEx\d\b/.test(s.name)) bad.push(["Expertise in the name", where]);
      if (!(s.system.expertise >= 0 && s.system.expertise <= 4)) bad.push(["expertise out of range", where, s.system.expertise]);
    }
    for (const w of c.items.filter((i) => i.type === "weapon")) {
      const s = skills.find((x) => x.name === w.system.skillName);
      if (s && s.system.group !== "Combat") bad.push(["weapon skill not Combat", c.name + ": " + s.name, s.system.group]);
    }
    if (new Set(skillNames).size !== skillNames.length) bad.push(["duplicate skill", c.name]);
  }
  return bad;
}

console.log("\n1. The pack is the one this check thinks it is");
check(creatures.length === 56, "56 creatures in tbe-bestiary", creatures.length);
check(items.filter((i) => i.type === "skill").length > 400, "skill Items present", items.filter((i) => i.type === "skill").length);

console.log("\n2. Every invariant holds over the real pack");
{
  const bad = invariants(creatures);
  check(bad.length === 0, "no creature skill breaks an invariant", bad.slice(0, 8));
}

console.log("\n3. The catalogue decides, and it decides what the book says");
{
  const dodge = creatures.map((c) => skillOf(c.name, "Dodge")).filter(Boolean);
  const might = creatures.map((c) => skillOf(c.name, "Might")).filter(Boolean);
  check(dodge.length >= 50 && dodge.every((s) => s.system.group === "Combat" && s.system.fighting),
    "every Dodge is Combat and a fighting skill (" + dodge.length + ")");
  check(might.length >= 50 && might.every((s) => s.system.group === "Combat" && s.system.fighting),
    "every Might is Combat and a fighting skill (" + might.length + ")");
  const ins = creatures.map((c) => skillOf(c.name, "Insight")).filter(Boolean);
  check(ins.length > 0 && ins.every((s) => s.system.group === "Social" && !s.system.fighting), "Insight is Social", ins.length);
  const per = creatures.map((c) => skillOf(c.name, "Perception")).filter(Boolean);
  check(per.every((s) => s.system.group === "Adventuring"), "Perception stays Adventuring, where the book puts it");
  check(skillOf("Guard Captain", "Law-wise")?.system.group === "Wise", "Guard Captain's Law-wise is a Wise");
  check(skillOf("Bandit Lord", "Spear")?.system.group === "Combat", "a weapon-named skill (Bandit Lord's Spear) is Combat");
  check(skillOf("Werewolf", "Claw")?.system.group === "Combat", "a natural attack (Werewolf's Claw) is Combat");
}

console.log("\n4. Skills the extractor files under skills but the book prints as attacks");
{
  for (const [c, s] of [["Orc", "Mace"], ["Orc", "Shortbow"], ["Hobgoblin", "Bearded Axe"],
                        ["Tical Dondallan Soldier", "Halberd"], ["Lich", "Touch"]]) {
    const it = skillOf(c, s);
    check(it && it.system.group === "Combat" && it.system.fighting, c + "'s " + s + " is a Combat fighting skill", it?.system);
  }
}

console.log("\n5. Expertise lives where the roll reads it");
{
  const cases = [["Dragon", "Might", 90, 4], ["Werewolf", "Stealth", 90, 4], ["Husk", "Endurance", 105, 3],
                 ["Bounty Hunter", "Track", 75, 2], ["Bandit Lord", "Broadsword", 90, 3],
                 ["Werewolf", "Claw", 70, 2], ["Ursowl", "Bite", 60, 2], ["Thessian Bear", "Bite", 40, 2]];
  for (const [c, s, v, ex] of cases) {
    const it = skillOf(c, s);
    check(it && it.system.value === v && it.system.expertise === ex,
      c + " " + s + " " + v + " Ex" + ex, it ? { value: it.system.value, ex: it.system.expertise } : "missing");
  }
  const withEx = items.filter((i) => i.type === "skill" && i.system.expertise > 0).length;
  check(withEx === 33, "33 creature skills carry Expertise (20 printed on skills, 13 on attacks)", withEx);
  const plain = skillOf("Bandit Lord", "Dodge");
  check(plain && plain.system.expertise === 0, "a skill printed without Ex gets 0, not a guess");
}

console.log("\n6. The roll picker sees one Might, not two");
{
  const dragon = byName["Dragon"];
  const actor = { items: dragon.items.map((i) => ({ type: i.type, name: i.name, system: i.system })) };
  const all = TBE.allSkills(actor);
  const mights = all.filter((s) => /^Might\b/.test(s.name));
  check(mights.length === 1 && mights[0].value === 90 && mights[0].trained, "Dragon: one Might, at 90, trained", mights);
  check(!all.some((s) => / Ex\d/.test(s.name)), "no \"Ex\" suffixed name reaches the picker");
}

console.log("\n7. The owner's contract");
{
  check(TBE.creatureSkillGroup("Dodge", false) === "Combat", "catalogue name -> its group");
  check(TBE.creatureSkillGroup("Dodge", true) === "Combat", "catalogue wins even when printed as an attack");
  check(TBE.creatureSkillGroup("Insight", true) === "Social", "catalogue wins over the attack signature");
  check(TBE.creatureSkillGroup("Law-wise", false) === "Wise", "a -wise is Wise");
  check(TBE.creatureSkillGroup("Spear", true) === "Combat", "an attack is Combat");
  check(TBE.creatureSkillGroup("Spear", false) === null, "an unknown name with no signature is null, never a guess");
  const bp = readFileSync("build_packs.mjs", "utf8");
  check(!/group:\s*"Adventuring",\s*value/.test(bp), "build_packs.mjs no longer hardcodes the group");
  check(/LIBTBE\.creatureSkillGroup\(/.test(bp), "build_packs.mjs asks the owner");
  check(/unclassified/.test(bp) && /throw new Error/.test(bp), "an unclassified skill stops the build");
}

console.log("\n8. Mutations");
{
  const clone = () => JSON.parse(JSON.stringify(creatures));
  const m1 = clone(); for (const c of m1) for (const i of c.items) if (i.type === "skill") { i.system.group = "Adventuring"; i.system.fighting = false; }
  check(invariants(m1).length > 0, "the old hardcoded \"Adventuring\" is caught");
  const m2 = clone(); for (const c of m2) for (const i of c.items) if (i.type === "skill") i.system.fighting = false;
  check(invariants(m2).length > 0, "fighting passed by hand and disagreeing with group is caught");
  const m3 = clone(); for (const c of m3) for (const i of c.items) if (i.type === "skill" && i.system.expertise) { i.name += " Ex" + i.system.expertise; }
  check(invariants(m3).length > 0, "Expertise glued back onto the name is caught");
  const m4 = clone(); for (const c of m4) for (const i of c.items) if (i.type === "skill" && i.system.group === "Wise") i.system.group = "Adventuring";
  check(invariants(m4).length === 0, "(control) a -wise mis-filed as Adventuring is NOT an invariant break, section 3 pins it instead");
  const guessing = loadTBE(LIB.replace('if (isAttack) return "Combat";\n  return null;', 'return "Combat";'));
  check(guessing.creatureSkillGroup("Spear", false) !== null,
    "an owner that guesses a heading is caught by section 7's null contract");
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
