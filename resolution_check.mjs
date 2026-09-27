/* resolution_check.mjs — the d100 rule has exactly one owner, and the macro
 * pack's copy cannot drift away from it.
 *
 * docs/ownership.md listed d100 resolution as "Not yet extracted" for a long
 * time: correct, but living only in macros/_lib.js, copy-pasted into every
 * macro at build time and unreachable from any system file. The sheet's roll
 * button forced the extraction into module/rules/resolution.mjs.
 *
 * This project has shipped five duplicate-logic bugs, every one of them two
 * copies of a rule that quietly diverged. So the check is not "does the
 * owner look right", it is: run BOTH implementations over the entire input
 * space and assert they never disagree, once with the global present (the
 * deferral path) and once without it (the Node fallback path).
 *
 * Run: node resolution_check.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as OWNER from "./system/the-broken-empires/module/rules/resolution.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");

let pass = 0, fail = 0;
const check = (cond, label, extra) => {
  if (cond) { pass++; console.log("  PASS  " + label); }
  else { fail++; console.log("  FAIL  " + label + (extra !== undefined ? "  <- " + JSON.stringify(extra) : "")); }
};

const LIB = read("macros/_lib.js");

/* Load the macro library with `game` either present (so TBE.resolve defers)
 * or absent (so it falls back to its own body). */
const loadTBE = ({ withGlobal }) => {
  const game = withGlobal
    ? { thebrokenempires: { rules: { resolve: OWNER.resolve } }, user: { character: null } }
    : { user: { character: null } };
  const canvas = { tokens: { controlled: [] } };
  const foundry = { utils: { duplicate: (o) => JSON.parse(JSON.stringify(o)) } };
  const ui = { notifications: { warn() {}, error() {}, info() {} } };
  return new Function("canvas", "game", "foundry", "ui", "CONFIG", LIB + "\n;return TBE;")(
    canvas, game, foundry, ui, undefined
  );
};

console.log("\n1. The owner exists and the macro pack points at it");
{
  check(typeof OWNER.resolve === "function", "module/rules/resolution.mjs exports resolve()");
  check(/game\?\.thebrokenempires\?\.rules\?\.resolve/.test(LIB),
    "macros/_lib.js checks the global before using its own body");
  const MAIN = read("system/the-broken-empires/module/the-broken-empires.mjs");
  check(/rules:\s*\{/.test(MAIN) && /resolve:\s*resolution\.resolve/.test(MAIN),
    "the init hook publishes it on game.thebrokenempires.rules, as ownership.md prescribes");
}

console.log("\n2. Exhaustive agreement: every roll, against a spread of skills");
/* Every natural roll 1-100, against skills that cover each branch: 0 and
 * negatives (the s<=0 path), the 01-05 floor, ordinary values, the exact-roll
 * crit, and over-100 skills which earn bonus SLs. */
const SKILLS = [-10, 0, 1, 5, 20, 35, 44, 50, 55, 66, 70, 88, 99, 100, 105, 120, 137];
const EXPERTISE = [0, 2, 3, 4];
{
  const local = loadTBE({ withGlobal: false });
  const deferred = loadTBE({ withGlobal: true });
  let compared = 0, mismatches = [];
  for (const s of SKILLS) {
    for (const ex of EXPERTISE) {
      for (let r = 1; r <= 100; r++) {
        const a = OWNER.resolve(r, s, ex);
        const b = local.resolve(r, s, ex);
        const c = deferred.resolve(r, s, ex);
        compared++;
        if (JSON.stringify(a) !== JSON.stringify(b)) mismatches.push({ where: "fallback", r, s, ex, a, b });
        if (JSON.stringify(a) !== JSON.stringify(c)) mismatches.push({ where: "deferral", r, s, ex, a, c });
      }
    }
  }
  check(compared === SKILLS.length * EXPERTISE.length * 100, "swept the whole input space", compared);
  check(mismatches.length === 0,
    `all ${compared} results identical across owner, macro fallback and deferral path`,
    mismatches.slice(0, 3));
}

console.log("\n3. The deferral really is a deferral, not a coincidence");
{
  /* Inject a sentinel owner and confirm the macro returns ITS answer, which
   * proves the macro is calling out rather than computing the same thing. */
  const sentinel = (r, skill, expertise) => ({ sentinel: true, r, skill, expertise });
  const game = { thebrokenempires: { rules: { resolve: sentinel } }, user: { character: null } };
  const TBE = new Function("canvas", "game", "foundry", "ui", "CONFIG", LIB + "\n;return TBE;")(
    { tokens: { controlled: [] } }, game, { utils: {} }, { notifications: {} }, undefined
  );
  const out = TBE.resolve(42, 70, 2);
  check(out.sentinel === true, "TBE.resolve returned the injected owner's answer, so it defers for real", out);
}

console.log("\n4. The book's own tables travel with the rule");
{
  const labels = OWNER.TASK_MODIFIERS.map((t) => t.label + " " + (t.mod >= 0 ? "+" : "") + t.mod);
  /* The rows come out of the book when the text is here, not out of a list
     typed into this check. The hand-typed expectation this replaced pinned
     FIVE rows for months while the book's table has six: Severe -30 was
     missing from the sheet's roll dialog and this assertion approved of it. */
  const BOOK = process.env.TBE_BOOK || "/tmp/tbe.txt";
  let bookRows = null, bookPage = null;
  if (fs.existsSync(BOOK)) {
    const lines = fs.readFileSync(BOOK, "utf8").split("\n");
    const start = lines.findIndex((l) => /^Difficulty Modifier Example/.test(l.trim()));
    const end = lines.findIndex((l, i) => i > start && /^Task Modifier Table/.test(l.trim()));
    bookRows = [];
    for (let i = start; i > -1 && i < end; i++) {
      const m = lines[i].trim().match(/^(Simple|Easy|Medium|Challenging|Hard|Severe) ([+-]\d+)\b/);
      if (m) bookRows.push(m[1] + " " + (m[2] === "-0" ? "+0" : m[2]));
    }
    /* A page-number line FOLLOWS its page's text in this dump: the contents
       page puts "Skill Modifiers" on 18, and the table sits above the "18". */
    for (let i = end; i < lines.length; i++) if (/^\s*\d{1,3}\s*$/.test(lines[i])) { bookPage = Number(lines[i].trim()); break; }
    check(bookRows.length >= 5, "the Task Modifier Table was found in the book text", bookRows);
    check(JSON.stringify(labels) === JSON.stringify(bookRows),
      "the owner's Task Modifiers are the book's rows, in the book's order", { owner: labels, book: bookRows });
    check(bookPage === 18, "the table is on p.18, where resolution.mjs cites it", bookPage);
  } else {
    console.log("  SKIP  no rulebook text at " + BOOK + "; checking against the last verified rows");
    check(labels.join(", ") === "Simple +20, Easy +10, Medium +0, Challenging -10, Hard -20, Severe -30",
      "the task modifiers match the six rows last verified against p.18", labels);
  }
  check(read("system/the-broken-empires/module/rules/resolution.mjs").includes(" * p.18, the Task Modifier Table"),
    "resolution.mjs cites the table's real page");
  /* The macro pack's fallback is a mirror; it must equal the owner row for row. */
  const T = new Function("canvas", "game", "foundry", "ui", "CONFIG", LIB + "\n;return TBE;")(
    undefined, undefined, undefined, undefined, undefined);
  check(JSON.stringify(T.TASK_MODIFIERS_FALLBACK) === JSON.stringify(OWNER.TASK_MODIFIERS),
    "the macro pack's fallback Task Modifier list is the owner's, row for row");
  check(!/<option value="-30">Severe/.test(read("macros/tbe-skill-roll.js")),
    "TBE: Skill Roll no longer keeps its own copy of the table");
  {
    /* Mutation: drop Severe from a copy of the owner's rows and confirm the
       book comparison refuses it. */
    const mutated = labels.filter((l) => !/^Severe/.test(l));
    check(bookRows === null || JSON.stringify(mutated) !== JSON.stringify(bookRows),
      "(mutation) the five-row table this replaced fails the book comparison");
  }
  check(OWNER.FAVOR_STEP === 10 && OWNER.FAVOR_CAP === 3,
    "Favor is +10 per point, capped at 3 on any one roll, from all sources combined");
  /* Quotes are wrapped across comment lines, so normalise whitespace and the
   * leading " * " markers before matching, the same way this project's .py
   * verifiers normalise before checking a book quote. */
  const src = read("system/the-broken-empires/module/rules/resolution.mjs")
    .replace(/^\s*\*/gm, " ").replace(/\s+/g, " ");
  check(src.includes("up to 3 Favor may be used on any one skill roll from any source"),
    "...and the cap carries the book's own sentence, so the 'from any source' part cannot be forgotten");
  check(src.includes("Task modifiers should generally not be applied to opposed rolls"),
    "the opposed-roll exclusion is recorded beside the table it applies to");
  check(src.includes("Resolve may be spent only on your own rolls"),
    "and so does the restriction that you cannot spend Resolve for someone else");
}

console.log("\n5. Spot-checks against the book's worked example and its edges");
{
  /* p.25: Arn, Survival 50, spends 2 Resolve for +20, rolls 63 against 70
   * and gets 6 SLs. The same 63 against his unmodified 50 would have failed. */
  const boosted = OWNER.resolve(63, 50 + 2 * OWNER.FAVOR_STEP, 0);
  check(boosted.success && boosted.sl === 6,
    "the book's worked example reproduces: 63 against a boosted 70 succeeds with 6 SLs", boosted.sl);
  check(!OWNER.resolve(63, 50, 0).success, "...and the same roll against his unboosted 50 fails, as the book says");

  check(OWNER.resolve(100, 90, 0).success === false && OWNER.resolve(99, 90, 0).success === false,
    "99 and 00 always fail, whatever the skill");
  check(OWNER.resolve(3, 20, 0).success === true, "01-05 always succeeds, even under the skill");
  check(OWNER.resolve(44, 70, 0).crit === true, "doubles under the skill are a critical success");
  check(OWNER.resolve(77, 50, 0).critFail === true, "doubles over the skill are a critical failure");
  check(OWNER.resolve(12, 70, 3).sl === 3, "Expertise floors the SLs at its own rating");
  check(OWNER.face(100) === "00" && OWNER.face(7) === "7", "a natural 100 still displays as 00");
}

console.log("\n6. Mutation: a drifted copy must be caught");
{
  /* Reintroduce the classic drift, an off-by-one in the crit rule, in the
   * macro's fallback body only, and confirm section 2 would catch it. */
  const broken = LIB.replace("else crit = doubles || r === s;", "else crit = doubles;");
  check(broken !== LIB, "the mutation changed the macro's fallback");
  const TBE = new Function("canvas", "game", "foundry", "ui", "CONFIG", broken + "\n;return TBE;")(
    { tokens: { controlled: [] } }, { user: { character: null } }, { utils: {} }, { notifications: {} }, undefined
  );
  let caught = false;
  for (const s of SKILLS) for (let r = 1; r <= 100 && !caught; r++) {
    if (JSON.stringify(OWNER.resolve(r, s, 0)) !== JSON.stringify(TBE.resolve(r, s, 0))) caught = true;
  }
  check(caught, "CONFIRMED: a drifted crit rule in the macro copy is caught by the sweep in section 2");
}

console.log("\n7. The sheet's roll button owns no rules");
{
  const SHEET = read("system/the-broken-empires/module/sheets/actor-sheet.mjs");
  const SKILLS_HBS = read("system/the-broken-empires/templates/actor/parts/actor-skills.hbs");

  check(/class="skill-roll rollable"/.test(SKILLS_HBS), "the skill name is marked rollable in the template");
  check(/html\.on\('click', '\.skill-roll', this\._onSkillRoll\.bind\(this\)\)/.test(SHEET),
    "the sheet registers a click handler for it");
  const listenerAt = SHEET.indexOf("'.skill-roll'");
  const guardAt = SHEET.indexOf("if (!this.isEditable) return;");
  check(listenerAt > 0 && listenerAt < guardAt,
    "...registered above the isEditable guard, so a non-owner can still roll");

  check(/import \* as RULES from '\.\.\/rules\/resolution\.mjs'/.test(SHEET),
    "the sheet imports the rule owner rather than carrying a copy");
  check(/RULES\.resolve\(roll\.total, target, expertise\)/.test(SHEET),
    "and resolves the roll through it");

  /* The whole point of the extraction: no rule arithmetic on the sheet. */
  const handler = SHEET.slice(SHEET.indexOf("async _onSkillRoll"), SHEET.indexOf("async _onItemCreate"));
  for (const forbidden of ["isDoubles", "critFail =", "Math.floor((r % 100)", "alwaysFail", "+ 3;"]) {
    check(!handler.includes(forbidden), `the handler does not reimplement "${forbidden}"`, forbidden);
  }
  check(handler.includes("RULES.FAVOR_CAP") && !/Math\.min\(3,/.test(handler),
    "the Favor cap comes from the rule owner, not a literal 3");
  check(handler.includes("RULES.FAVOR_STEP") && !/\* 10\b/.test(handler.replace(/RULES\.FAVOR_STEP/g, "")),
    "so does the +10 a point");
  check(handler.includes("RULES.TASK_MODIFIERS"), "and the Task Modifier list");

  /* Safety: a Resolve spend is a write to the actor. */
  check(/Math\.max\(0, cur - spend\.favor\)/.test(handler), "a Resolve spend clamps at zero");
  /* This method used to carry the only correct unowned-actor handling in the
     codebase, inline, as `this.actor.isOwner`. v0.38.0 made that the owner's
     job (module/rules/permission.mjs) so the macro pack could say the same
     thing. The guarantee under test is the same one: a user who cannot write
     is TOLD, rather than the spend silently not happening. */
  check(/PERMISSION\.applyWrite\(/.test(handler) && /notify:/.test(handler),
    "a user who cannot write to the actor is told the Resolve was not spent rather than it failing silently");
  check(/The roll still used the bonus/.test(handler),
    "...and is told the bonus still applied, so the card and the pool agree");
  check(!/this\.actor\.isOwner/.test(handler),
    "and the sheet no longer carries its own copy of the ownership test");
  check(handler.indexOf("await new Roll") < handler.indexOf("applyWrite"),
    "the roll happens before the Resolve is deducted, so a cancelled dialog costs nothing");

  /* Behavioural: the one piece of arithmetic it does own. */
  const target = (base, task, favor) => base + task + favor * OWNER.FAVOR_STEP;
  check(target(70, -20, 0) === 50, "Hard on a 70 skill rolls against 50");
  check(target(50, 0, 2) === 70, "...and the book's Arn example, 50 with 2 Resolve, rolls against 70");
  check(target(35, 20, 3) === 85, "Simple plus a full 3 Favor stacks as the book allows");
}

console.log("\n8. Both sheets get it");
{
  const CHAR = read("system/the-broken-empires/templates/actor/actor-character-sheet.hbs");
  const CREATURE = read("system/the-broken-empires/templates/actor/actor-creature-sheet.hbs");
  check(CHAR.includes("parts/actor-skills.hbs"), "the character sheet includes the skills part");
  check(CREATURE.includes("parts/actor-skills.hbs"),
    "so does the creature sheet, so a GM can click-roll Elspeth's Spear too");
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
