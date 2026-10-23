#!/usr/bin/env node
/*
 * flag_scope_check.mjs -- nothing writes the illegal "tbe" flag scope again.
 *
 * Foundry accepts "core", "world", the system id and module ids as flag
 * scopes. "tbe" was never legal: setFlag/getFlag("tbe", ...) throw, and a
 * hand-written update({"flags.tbe.x": v}) writes happily and splits the data
 * (CLAUDE.md, migration_fixtures_check.mjs K-O). v0.39.0 moved everything to
 * TBE.FLAG_SCOPE. Since then every site writes paths directly, so the scope
 * validation that would have caught it can never fire: this is that check.
 *
 * Allowed: deleting a legacy key ("flags.tbe.-=x"), migration.mjs (it moves
 * the named keys), and comments. Everything else in macros/ and the system's
 * module/ is a failure, named by file and line.
 */
import fs from "node:fs";
import path from "node:path";

let pass = 0, fail = 0;
const check = (cond, label, extra) => {
  if (cond) { pass++; console.log("  PASS  " + label); }
  else { fail++; console.log("  FAIL  " + label + (extra !== undefined ? "  <- " + JSON.stringify(extra).slice(0, 800) : "")); }
};

/* Strip comments, keeping line numbers. Good enough for this codebase:
   no regex literals or strings contain comment markers at these sites. */
export function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:"'\\])\/\/[^\n]*/g, (m, p) => p + " ".repeat(m.length - p.length));
}
const BAD = [
  [/flags\.tbe\.(?!-=)[A-Za-z_]/, "writes or reads a flags.tbe.* path"],
  [/\b(?:get|set|unset)Flag\(\s*["'`]tbe["'`]/, "uses the illegal \"tbe\" scope with the flag API"],
  [/flags\s*:\s*\{\s*["']?tbe["']?\s*:/, "creates a document with a flags.tbe object"],
  [/flags\[\s*["'`]tbe["'`]\s*\]\s*(?:\.[A-Za-z_$]+\s*)?=(?!=)/, "assigns into flags[\"tbe\"]"]
];
export function scan(file, src) {
  const out = [];
  stripComments(src).split("\n").forEach((line, i) => {
    for (const [re, why] of BAD) if (re.test(line)) out.push(file + ":" + (i + 1) + " " + why + ": " + line.trim().slice(0, 120));
  });
  return out;
}
const files = [];
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(m?js)$/.test(e.name) && !/[\\/]migration[\\/]migration\.mjs$/.test(p)) files.push(p);
  }
};
walk("macros"); walk("system/the-broken-empires/module");

const found = files.flatMap((f) => scan(f, fs.readFileSync(f, "utf8")));
check(files.length > 60, "scanned every macro and system module (" + files.length + " files)");
check(!found.length, "nothing reads or writes the \"tbe\" flag scope outside migration.mjs", found);

/* The allowed shapes stay allowed... */
check(!scan("x", 'await j.update({ [TBE.flagPath("clocks")]: [], "flags.tbe.-=clocks": null });').length, "deleting a legacy key is allowed");
check(!scan("x", "/* flags.tbe.weave used to live here */\n// setFlag(\"tbe\", x)").length, "comments are allowed");
check(!scan("x", 'const legacy = doc?.flags?.tbe?.[key];').length, "the tolerant legacy read in TBE.flagOf is allowed");
/* ...and each forbidden shape is caught (the check broken on purpose). */
const mutants = [
  'await actor.update({ "flags.tbe.weave": w });',
  'await a.setFlag("tbe", "funnel", f);',
  'const f = a.getFlag("tbe", "funnel");',
  'await Actor.create({ name, flags: { tbe: { funnel: f } } });',
  'doc.flags["tbe"].perRank = true;'
];
for (const m of mutants) check(scan("mutant.js", m).length === 1, "caught: " + m);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
