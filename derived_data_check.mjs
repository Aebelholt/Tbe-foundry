/* derived_data_check.mjs -- enforces CLAUDE.md's derived-data rule: a field
 * computed every load must never be trusted from what was saved.
 *
 * TheBrokenEmpiresActor.prepareDerivedData() writes armorBulk,
 * armorInitPenalty and initiativeEffective onto this.system with no schema
 * field behind them, because a roll formula's @initiativeEffective needs
 * somewhere to resolve from and three different callers (the sheet, TBE:
 * Cast, the combat tracker) read them. Nothing stops actor.update({
 * "system.initiativeEffective": 4 }) from writing a number that looks real
 * and isn't -- the rule instead of a structural fix (a _derived namespace,
 * logged as still open in BACKLOG, bigger blast radius than three fields
 * justify right now) is: these are recomputed UNCONDITIONALLY every pass, so
 * even a poisoned value never survives past the next load. That is checked
 * here by actually poisoning one first, not by reading the source and
 * trusting the comment.
 *
 * Run: node derived_data_check.mjs
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

const SYS = "system/the-broken-empires";
const ACTORMJS = read(`${SYS}/module/documents/actor.mjs`);
const BASEACTORMJS = read(`${SYS}/module/data/base-actor.mjs`);

const EPHEMERAL_FIELDS = ["armorBulk", "armorInitPenalty", "initiativeEffective"];

console.log("\n1. The three live derived fields are exactly what the rule names");
for (const f of EPHEMERAL_FIELDS) {
  check(new RegExp(`this\\.system\\.${f}\\s*=`).test(ACTORMJS), `${f} is assigned in prepareDerivedData()`, f);
}
check(/DERIVED-DATA RULE/.test(ACTORMJS), "the rule is written down at the point where it matters, not only in CLAUDE.md");

console.log("\n2. Nothing writes to a derived path through actor.update()");
const UPDATE_TO_DERIVED = new RegExp(
  `update\\(\\s*\\{[^}]*["']system\\.(${EPHEMERAL_FIELDS.join("|")})["']`
);
const TREE = ["macros", `${SYS}/module`];
const walk = (dir, out = []) => {
  for (const entry of fs.readdirSync(path.join(__dirname, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(rel, out);
    else if (/\.m?js$/.test(entry.name)) out.push(rel);
  }
  return out;
};
const offenders = [];
for (const dir of TREE) {
  for (const f of walk(dir)) {
    const src = read(f);
    if (UPDATE_TO_DERIVED.test(src)) offenders.push(f);
  }
}
check(offenders.length === 0, "no macro or module file writes a derived path via .update()", offenders);

console.log("\n3. The dead eager copies (wp/ll/isDying/sizeIdx) are gone, the real getters still work");
check(!/this\.wp\s*=|this\.ll\s*=|this\.isDying\s*=|this\.sizeIdx\s*=/.test(BASEACTORMJS),
  "base-actor.mjs no longer eagerly copies the getters onto undeclared properties nothing read");
check(/get totalWp\(\)/.test(BASEACTORMJS) && /get lethalityLevel\(\)/.test(BASEACTORMJS) &&
  /get dying\(\)/.test(BASEACTORMJS) && /get sizeIndex\(\)/.test(BASEACTORMJS),
  "...but the getters themselves are still there for callers that want them live");

console.log("\n4. prepareDerivedData() overwrites a poisoned value, sequentially checked");

/* Extract the real method body and run it bound to a stub actor, the same
 * brace-matching technique audit_check.mjs uses elsewhere in this project. */
const extractMethod = (src, marker) => {
  const i = src.indexOf(marker);
  let depth = 0, j = src.indexOf("{", i);
  const start = j;
  for (; j < src.length; j++) {
    if (src[j] === "{") depth++;
    else if (src[j] === "}") { depth--; if (!depth) break; }
  }
  return src.slice(start + 1, j);
};

const mkActor = (armorBulkTotal) => ({
  items: [{ type: "armor", system: { equipped: true, bulk: armorBulkTotal } }],
  system: {
    initiative: 10,
    // Poisoned on purpose: values a stray write could have left behind,
    // deliberately wrong for this actor's real armor.
    armorBulk: 999, armorInitPenalty: 999, initiativeEffective: -999
  }
});

const runPrepareDerived = (body, actor) => new Function(body).call(actor);

const body = extractMethod(ACTORMJS, "prepareDerivedData() {");
check(body.length > 100, "prepareDerivedData() body extracted");

{
  const actor = mkActor(6); // Bulk 6 -> penalty ceil(6/3) = 2
  runPrepareDerived(body, actor);
  check(actor.system.armorBulk === 6, "a poisoned armorBulk is overwritten with the real total", actor.system.armorBulk);
  check(actor.system.armorInitPenalty === 2, "...and armorInitPenalty is recomputed from it, not left at its poisoned value", actor.system.armorInitPenalty);
  check(actor.system.initiativeEffective === 8, "...and initiativeEffective follows (10 - 2), not the poisoned -999", actor.system.initiativeEffective);
}

/* Idempotency: running it again on an already-correct actor changes nothing
 * further -- the unconditional overwrite recomputes the same answer, it
 * doesn't accumulate. */
{
  const actor = mkActor(9); // Bulk 9 -> penalty 3
  runPrepareDerived(body, actor);
  const once = { ...actor.system };
  runPrepareDerived(body, actor);
  check(JSON.stringify(actor.system) === JSON.stringify(once), "running it twice in a row is a no-op, not a drift");
}

/* MUTATION: a version that only computes when nothing is there yet -- the
 * exact bug class the "unconditionally" wording in the rule exists to
 * forbid -- must leave a poisoned value in place, and this check must catch it. */
{
  const brokenBody = body.replace(
    'this.system.armorBulk = bulk;\n    this.system.armorInitPenalty = penalty;',
    'if (!Number.isFinite(this.system.armorBulk) || this.system.armorBulk === 999) { /* mutated: guarded */ }\n' +
    '    this.system.armorBulk = this.system.armorBulk === 999 ? this.system.armorBulk : bulk;\n' +
    '    this.system.armorInitPenalty = this.system.armorInitPenalty === 999 ? this.system.armorInitPenalty : penalty;'
  );
  check(brokenBody !== body, "the mutation actually changed the source");
  const actor = mkActor(6);
  runPrepareDerived(brokenBody, actor);
  check(actor.system.armorBulk === 999,
    "confirms a conditional (guarded) version DOES let a poisoned value survive -- proving the real code's unconditional overwrite is what protects against it",
    actor.system.armorBulk);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
