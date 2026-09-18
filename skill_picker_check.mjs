/* skill_picker_check.mjs — the roll picker offers every skill a character
 * can actually roll, not just the ones written on the sheet.
 *
 * Ch.7 p.104: a skill with no value "begins at 20". A TBE sheet deliberately
 * records only the skills that differ from 20 (TBE.skillItemsFrom does not
 * stamp 37 Items onto an actor, and an actor sheet listing every catalogue
 * skill at 20 is noise). The picker used to be built from the sheet alone,
 * so an untrained skill could be rolled only by knowing the rule and typing
 * 20 into the number box by hand. The rule was real and invisible.
 *
 * This runs the REAL TBE.skillOptions out of macros/_lib.js against stub
 * actors, rather than reading the source and trusting it.
 *
 * Run: node skill_picker_check.mjs
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

/* Load the real library with only the Foundry globals it touches stubbed.
 * `src` lets a mutation test load a deliberately broken copy. */
const loadTBE = (actor, src = LIB) => {
  const canvas = { tokens: { controlled: actor ? [{ actor }] : [] } };
  const game = { user: { character: null } };
  const foundry = { utils: { duplicate: (o) => JSON.parse(JSON.stringify(o)) } };
  const ui = { notifications: { warn() {}, error() {}, info() {} } };
  return new Function("canvas", "game", "foundry", "ui", "CONFIG", src + "\n;return TBE;")(
    canvas, game, foundry, ui, undefined
  );
};

const skill = (name, value, group, expertise = 0, savvy = false) =>
  ({ type: "skill", name, system: { value, group, expertise, savvy, fighting: group === "Combat" } });

/* Renn Kestrel's real sheet, trimmed to what this check needs. */
const RENN = { items: [
  skill("Common Lore", 70, "Lore", 2),
  skill("Perception", 65, "Adventuring"),
  skill("Melee: Light", 40, "Combat"),
  skill("Endurance", 40, "Adventuring", 0, true)
] };

console.log("\n1. The starting value has one owner");
{
  const TBE = loadTBE(RENN);
  check(TBE.BASE_SKILL === 20, "TBE.BASE_SKILL is the book's 20", TBE.BASE_SKILL);
  check(!/\|\|\s*20;/.test(LIB), "blankSkillValues no longer carries its own literal 20");
  check(TBE.blankSkillValues()["Intimidate"].value === 20, "a blank sheet still starts every catalogue skill at 20");
}

console.log("\n2. The picker offers the whole catalogue, not just the sheet");
{
  const TBE = loadTBE(RENN);
  const html = TBE.skillOptions();
  const CATALOGUE = Object.values(TBE.SKILL_GROUPS).flat();
  check(CATALOGUE.length === 37, "the catalogue is the book's 37 core skills", CATALOGUE.length);
  for (const name of CATALOGUE) {
    check(html.includes(">" + name + " ("), `"${name}" is offered`, name);
  }
}

console.log("\n3. Sheet values win, untrained shows 20, and nothing is listed twice");
{
  const TBE = loadTBE(RENN);
  const html = TBE.skillOptions();
  const opts = [...html.matchAll(/<option value="([^"]*)">([^<]*)<\/option>/g)]
    .map((m) => ({ value: m[1], text: m[2] })).filter((o) => o.value !== "");
  const names = opts.map((o) => o.value.split("|")[1]);
  check(new Set(names).size === names.length, "no skill appears twice across the two groups", names.length);
  check(opts.length === 37, "exactly 37 rollable options, one per catalogue skill", opts.length);

  const byName = Object.fromEntries(opts.map((o) => {
    const [value, name, expertise, savvy] = o.value.split("|");
    return [name, { value: Number(value), expertise: Number(expertise), savvy: savvy === "1", text: o.text }];
  }));
  check(byName["Common Lore"].value === 70, "Common Lore uses the sheet's 70, not 20", byName["Common Lore"].value);
  check(byName["Common Lore"].expertise === 2 && byName["Common Lore"].text.includes("Ex2"),
    "...and carries its Expertise through to the roll and the label");
  check(byName["Endurance"].savvy === true && byName["Endurance"].text.includes(" S"),
    "Endurance carries its Savvy mark through");
  check(byName["Intimidate"].value === 20 && byName["Intimidate"].expertise === 0 && byName["Intimidate"].savvy === false,
    "Intimidate, absent from the sheet, is offered at a clean 20", byName["Intimidate"]);
  check(byName["Melee: Heavy"].value === 20, "Melee: Heavy likewise", byName["Melee: Heavy"].value);
}

console.log("\n4. The untrained ones are labelled, not smuggled in");
{
  const TBE = loadTBE(RENN);
  const html = TBE.skillOptions();
  check(html.includes('<optgroup label="On the sheet">'), "the sheet's own skills are grouped first");
  check(/<optgroup label="Untrained \(20, p\.104\)">/.test(html),
    "the rest sit under a group that names the number and cites the rule");
  const sheetBlock = html.slice(html.indexOf("On the sheet"), html.indexOf("Untrained ("));
  check(sheetBlock.includes("Common Lore") && !sheetBlock.includes("Intimidate"),
    "Common Lore is in the sheet group and Intimidate is not");
}

console.log("\n5. Group filters and the no-actor case still behave");
{
  const TBE = loadTBE(RENN);
  const combat = TBE.skillOptions("pick", "Skill", "Combat");
  const names = [...combat.matchAll(/<option value="[^|]*\|([^|]*)\|/g)].map((m) => m[1]);
  check(names.length === TBE.SKILL_GROUPS.Combat.length,
    "a Combat filter returns exactly the Combat skills, trained and not", names);
  check(names.includes("Melee: Light") && names.includes("Melee: Heavy"),
    "...including Renn's own Melee: Light and the Melee: Heavy he has never touched");
  check(!names.includes("Perception"), "...and nothing from another group");
}
{
  const TBE = loadTBE(null);
  check(TBE.skillOptions() === "", "no token and no assigned character offers no list at all");
}

console.log("\n6. Skills outside the catalogue are not invented");
{
  /* Languages, custom -wise skills and Piety have no universal 20: you have
   * them or you do not. They must appear only when the actor really has one. */
  const uisdean = { items: [
    skill("Ancient Lore", 70, "Lore", 2),
    skill("Fionnan (Low Court)", 70, "Language"),
    skill("Saltwise", 30, "Wise")
  ] };
  const TBE = loadTBE(uisdean);
  const html = TBE.skillOptions();
  check(html.includes("Fionnan (Low Court) (70"), "a Language he actually has is offered at its real value");
  check(html.includes("Saltwise (30"), "so is a custom -wise skill");
  check(!html.includes("Orcish"), "a language he does not have is NOT invented at 20");
  /* Count parsed options, not raw string hits: the name appears in both the
   * option's value attribute and its label, so a substring count sees two. */
  const parsed = [...html.matchAll(/<option value="([^"]+)">/g)]
    .map((m) => m[1].split("|")[1]).filter(Boolean);
  const langs = parsed.filter((n) => n === "Fionnan (Low Court)").length;
  check(langs === 1, "and the ones he has are not duplicated into the untrained group", parsed);
  check(parsed.filter((n) => n === "Ancient Lore").length === 1,
    "a catalogue skill that IS on the sheet appears once, in the sheet group only");
}

console.log("\n7. Mutation: the old sheet-only picker must fail these checks");
{
  /* Rebuild the library with skillOptions reverted to its previous
   * behaviour and confirm the untrained skills vanish. */
  const start = LIB.indexOf("TBE.skillOptions = function (");
  const end = LIB.indexOf("\n};", start) + 3;
  const broken = LIB.slice(0, start) + `TBE.skillOptions = function (fieldName = "pick", label = "From sheet", filterGroup = null) {
  const s = TBE.actorSkills().filter((x) => !filterGroup || x.group === filterGroup);
  if (!s.length) return "";
  return '<select name="' + fieldName + '">' + s.map((x) =>
    '<option value="' + x.value + "|" + x.name + "|" + x.expertise + "|" + (x.savvy ? 1 : 0) + '">' +
    x.name + " (" + x.value + ")</option>").join("") + "</select>";
};` + LIB.slice(end);
  const TBE = loadTBE(RENN, broken);
  const html = TBE.skillOptions();
  check(!html.includes(">Intimidate ("),
    "CONFIRMED: the old picker really did omit Intimidate, so section 2 would have failed on it");
  check(html.includes(">Common Lore ("), "...while still offering the skills that were on the sheet");
  const count = [...html.matchAll(/<option /g)].length;
  check(count === 4, "the old picker offered only the sheet's four skills, not 37", count);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
