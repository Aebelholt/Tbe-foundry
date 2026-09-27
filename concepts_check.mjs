/*
 * concepts_check.mjs -- the step-1 concept roller's table (data/concepts.json).
 *
 * The table is ORIGINAL content, not the book's (p.79 asks for a rough
 * concept and gives no table), and v0.51.0 grew it from 10 rows a column to
 * 60 roles, 40 streaks and 40 troubles. Nothing in it is mechanical, but its
 * skill suggestions feed the four category-30 pickers on step 1, and the
 * Create Character window DROPS a suggestion whose name or category it does not recognise
 * (conceptSkillHints) without a word. A typo would ship as a suggestion that
 * silently never appears. This makes it fail the build instead.
 *
 * It also keeps the table honest about what it is: labelled original,
 * rolled at its real size, and readable as the sentence the window builds.
 */
import fs from "node:fs";

let pass = 0, fail = 0;
const check = (cond, label, extra) => {
  if (cond) { pass++; console.log("  PASS  " + label); }
  else { fail++; console.log("  FAIL  " + label + (extra !== undefined ? "  <- " + JSON.stringify(extra).slice(0, 400) : "")); }
};
const T = new Function(fs.readFileSync("macros/_lib.js", "utf8") + "\n;return TBE;")();
const SK = T.SKILL_GROUPS;
const C = JSON.parse(fs.readFileSync("data/concepts.json", "utf8"));
const cols = ["roles", "streaks", "troubles"];

console.log("\n1. Labelled for what it is");
check(/ORIGINAL CONTENT, NOT FROM THE RULEBOOK/.test(C._provenance || ""), "the file says it is original content, not the book's");
check(/no character, place or phrase is taken from any particular work/.test(C._sources || ""), "and that its archetypes borrow no names");

console.log("\n2. Every suggestion is a real skill, in the category it is filed under");
{
  const bad = [];
  for (const k of cols) for (const r of C[k]) for (const [cat, v] of Object.entries(r.skills || {})) {
    for (const name of [].concat(v)) if (!(SK[cat] || []).includes(name)) bad.push(k + ": " + r.text + " -> " + cat + "/" + name);
  }
  check(bad.length === 0, "all " + cols.reduce((n, k) => n + C[k].length, 0) + " rows' suggestions resolve", bad);
  const none = cols.flatMap((k) => C[k].filter((r) => !Object.keys(r.skills || {}).length).map((r) => r.text));
  check(none.length === 0, "every row suggests at least one skill", none);
}

console.log("\n3. The table reads as the sentence the window builds");
{
  for (const k of cols) {
    const texts = C[k].map((r) => r.text.toLowerCase());
    check(new Set(texts).size === texts.length, k + ": no duplicate rows", texts.filter((t, i) => texts.indexOf(t) !== i));
    check(C[k].every((r, i) => r.d10 === i + 1), k + ": rows numbered 1..N in order, so a roll lands on exactly one");
  }
  check(C.roles.length >= 50 && C.streaks.length >= 40 && C.troubles.length >= 40, "at least 50 roles, 40 streaks, 40 troubles",
    cols.map((k) => C[k].length));
  check(C.streaks.every((r) => /^(with|who) /.test(r.text)), "every streak follows a role (\"Duelist with ...\", \"... who ...\")",
    C.streaks.filter((r) => !/^(with|who) /.test(r.text)).map((r) => r.text));
  check(C.troubles.every((r) => r.text[0] === r.text[0].toLowerCase()), "every trouble follows a comma, so starts lower-case");
  check(C.roles.every((r) => r.text[0] === r.text[0].toUpperCase()), "every role starts the sentence");
}

console.log("\n4. The Create Character window rolls the table at its real size");
{
  /* The Wizard that used to roll it retired in v0.53.0. */
  const act = fs.readFileSync("system/the-broken-empires/module/chargen/actions.mjs", "utf8");
  check(/env\.roll\("1d" \+ list\.length\)/.test(act), "the roll is 1d(rows in the column), not a hardcoded d10");
  const tabs = fs.readFileSync("system/the-broken-empires/module/chargen/tables.mjs", "utf8");
  check(tabs.includes('"text":"Nameless wandering blade"'), "the window's tables carry the current rows (run node build.js after editing)");
  const { conceptColumns } = await import("./system/the-broken-empires/module/chargen/creator.mjs");
  const cols = conceptColumns({ concepts: C }, { roles: [{ text: "Fallen inquisitor", skills: { Social: ["Insight"] } }] });
  check(cols.role.length === C.roles.length + 1 && cols.role[cols.role.length - 1].d10 === cols.role.length,
    "a world's own rows are appended and numbered on, so the roll stays a clean 1..N");
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
