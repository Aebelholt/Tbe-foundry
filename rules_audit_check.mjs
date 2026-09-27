#!/usr/bin/env node
/*
 * rules_audit_check.mjs -- the TBE: Rules Audit journal is current, and its
 * generator still runs (v0.53.1).
 *
 * Why it exists: nothing ran parse_core_rules.py, so when the rulebook dump
 * was regenerated its hand-typed line windows all went stale and the script
 * could not run at all. The journal kept shipping from an old
 * data/core_rules.json, with every page one early and, after v0.53.0, three
 * rows naming a retired macro, and every check stayed green. This runs the
 * generator and the journal builder and fails if what they produce differs
 * from what is committed, so the journal cannot drift from its source again.
 *
 * The generator verifies itself (quotes found by search, pages from the page
 * marker that follows, each page inside its contents-page range, the heading
 * the nearest one above the quote, every "used by" macro shipping, and two
 * self-mutations). This check does not repeat that; it makes sure it runs.
 *
 * Needs the rulebook text at /tmp/tbe.txt; without it, it says so and fails.
 */
import fs from "node:fs";
import { execFileSync } from "node:child_process";

let pass = 0, fail = 0;
const check = (cond, label, extra) => {
  if (cond) { pass++; console.log("  PASS  " + label); }
  else { fail++; console.log("  FAIL  " + label + (extra !== undefined ? "  <- " + String(extra).slice(0, 400) : "")); }
};

console.log("\n1. The generator runs and verifies");
const before = { rules: fs.readFileSync("data/core_rules.json", "utf8"), html: fs.readFileSync("rules_audit.html", "utf8") };
let out = "", ok = true;
if (!fs.existsSync("/tmp/tbe.txt")) { check(false, "the rulebook text is at /tmp/tbe.txt (needed to verify the audit)"); ok = false; }
else {
  try { out = execFileSync("python3", ["parse_core_rules.py"], { encoding: "utf8" }); }
  catch (e) { ok = false; out = (e.stdout || "") + (e.stderr || ""); }
  check(ok && /^verified: 20 /m.test(out), "parse_core_rules.py verifies all 20 rules against the book", out);
  check(/old page reading fails on [1-9]\d* rule/.test(out), "and its self-test catches the old page reading");
}

console.log("\n2. What is committed is what the generator makes");
if (ok) {
  execFileSync("python3", ["build_rules_audit.py"], { encoding: "utf8" });
  const after = { rules: fs.readFileSync("data/core_rules.json", "utf8"), html: fs.readFileSync("rules_audit.html", "utf8") };
  check(after.rules === before.rules, "data/core_rules.json is current (regenerate and commit it if this fails)");
  check(after.html === before.html, "rules_audit.html is current");
  /* Leave the tree as it was, so a failing run shows up in git diff. */
  fs.writeFileSync("data/core_rules.json", before.rules);
  fs.writeFileSync("rules_audit.html", before.html);
}

console.log("\n3. The journal says what the contents page says");
{
  const rules = JSON.parse(before.rules).rules;
  const at = (k) => rules.find((r) => r.key === k) || {};
  check(at("markWound").page === 172 && at("woundDie").page === 173 && at("shock").page === 173 && at("successLevels").page === 19 && at("standardRoll").page === 20,
    "Marking a Wound 172, The Wound Die and Shock 173, Success Levels 19, Standard and Opposed Rolls 20: the contents page's numbers",
    JSON.stringify(rules.map((r) => r.key + ":" + r.page)));
  check(rules.every((r) => r.heading), "every row carries the heading it was checked under");
  check(!/Character Wizard|Finish Character|Build Character/.test(before.html), "no row names a retired macro");
  const docs = JSON.parse(fs.readFileSync("data/solo_docs.json", "utf8"));
  const find = (o) => (o && typeof o === "object" ? (o.name === "TBE: Rules Audit" && typeof o.content === "string" ? o : Object.values(o).map(find).find(Boolean)) : null);
  const page = find(docs);
  check(!!page && page.content === before.html, "the built journal pack carries exactly this page (run node build.js after regenerating)");
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
