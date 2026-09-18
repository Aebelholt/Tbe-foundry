/* release_probe_check.mjs — the release probe's detectors actually fire.
 *
 * The probe's whole failure mode is silence. It runs after unattended work, and
 * a detector whose pattern matches nothing produces a clean report that looks
 * exactly like a clean codebase. That is not hypothetical: the session probe
 * shipped with a regex reading the wrong field and returned `{"(none)": 65}`
 * for a whole played session, and the curated 13-script suite list hid
 * `tier3_check.mjs` being red across two releases.
 *
 * So this check does not read the probe. It builds a fake repo, seeds ONE
 * violation at a time, runs the real probe against it, and asserts the finding
 * comes out. Each seed is a defect a scheduled run could plausibly introduce.
 *
 * Run: node release_probe_check.mjs
 */

import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let pass = 0, fail = 0;
const check = (cond, label, extra) => {
  if (cond) { pass++; console.log("  PASS  " + label); }
  else { fail++; console.log("  FAIL  " + label + (extra !== undefined ? "  <- " + JSON.stringify(extra) : "")); }
};

/* ---- a minimal fake repo the probe can be pointed at ---- */
const W = (root, rel, text) => {
  fs.mkdirSync(path.join(root, path.dirname(rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), text);
};

function makeRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tbe-probe-"));
  W(root, "system/the-broken-empires/system.json", JSON.stringify({ version: "1.0.0" }));
  W(root, "system/the-broken-empires/CHANGELOG.md", "# 1.0.0 — 2026-01-01\n\nBase.\n");
  W(root, "docs/ownership.md", "| a | b | c |\n");
  W(root, "CLAUDE.md", "# doc\n\n- `node alpha_check.mjs` — the one check.\n");
  W(root, "BACKLOG.md", "# Backlog\n\nIntro prose.\n\n## Existing section\n\nbody\n");
  W(root, "build.js", 'const MACROS = [\n  ["TBE: Alpha", "tbe-alpha.js", "i.svg"],\n  ["TBE: Beta", "tbe-beta.js", "i.svg"]\n];\n');
  W(root, "macros/tbe-alpha.js", "// alpha\n" + "const x = 1;\n".repeat(40));
  W(root, "macros/tbe-beta.js", "// beta\n" + "const y = 2;\n".repeat(40));
  W(root, "macros/_lib.js", "const TBE = {};\n/* fallback */\nif (0) { data.whisper = []; }\n");
  W(root, "system/the-broken-empires/module/rules/visibility.mjs", "export const x = 1;\ndata.whisper = [];\n");
  W(root, "system/the-broken-empires/module/the-broken-empires.mjs", "const y = 1;\n");
  W(root, "system/the-broken-empires/templates/actor/actor-character-sheet.hbs",
    '<form><input name="system.a" /></form>\n');
  W(root, "alpha_check.mjs", 'console.log("\\n1 passed, 0 failed");\n');
  /* Copy the two scripts under test in, so the probe runs on the fake repo. */
  for (const f of ["release_baseline.mjs", "release_probe.mjs"]) {
    fs.copyFileSync(path.join(__dirname, f), path.join(root, f));
  }
  return root;
}

const node = (root, script, args = []) =>
  execFileSync(process.execPath, [script, ...args], { cwd: root, encoding: "utf8", timeout: 120000 });

const baseline = (root) => node(root, "release_baseline.mjs");
const probe = (root, dry = true) => node(root, "release_probe.mjs", dry ? ["--dry"] : []);

console.log("\n1. A clean repo produces no findings");
let cleanRoot;
{
  cleanRoot = makeRepo();
  baseline(cleanRoot);
  const out = probe(cleanRoot);
  check(/FINDINGS: 0 high, 0 medium, 0 low/.test(out), "an unchanged repo is reported clean",
    (/FINDINGS:.*/.exec(out) ?? [])[0]);
  check(/does and does not mean/.test(out),
    "...and says what 'clean' does not cover, rather than implying it checked everything");
}

console.log("\n2. Refuses to run without a baseline, rather than inventing one");
{
  const root = makeRepo();
  let code = 0, out = "";
  try { out = probe(root); } catch (e) { code = e.status; out = String(e.stdout) + String(e.stderr); }
  check(code === 2, "exits non-zero when no baseline exists", code);
  check(/must be captured BEFORE/.test(out), "...and says why a later baseline would be worthless", out.slice(0, 120));
}

console.log("\n3. Each detector fires on a seeded violation");

const seeded = (mutate) => {
  const root = makeRepo();
  baseline(root);
  mutate(root);
  return probe(root);
};

{
  /* a) a macro deleted -- the parity constraint every run was given */
  const out = seeded((r) => fs.unlinkSync(path.join(r, "macros/tbe-beta.js")));
  check(/\[HIGH\] parity.*tbe-beta\.js/s.test(out), "a deleted macro file is caught", (/\[HIGH\] parity.*/.exec(out) ?? [])[0]);
}
{
  /* b) a macro dropped from build.js, so it stops shipping while the file remains */
  const out = seeded((r) => {
    const p = path.join(r, "build.js");
    fs.writeFileSync(p, fs.readFileSync(p, "utf8").replace(/\n\s*\["TBE: Beta"[^\n]*\n/, "\n"));
  });
  check(/\[HIGH\] parity.*TBE: Beta.*no longer registered/s.test(out),
    "a macro de-registered from build.js is caught", (/\[HIGH\] parity.*/.exec(out) ?? [])[0]);
}
{
  /* c) a macro hollowed out to a stub */
  const out = seeded((r) => fs.writeFileSync(path.join(r, "macros/tbe-alpha.js"), "// TODO\n"));
  check(/\[MED\] parity.*shrank/s.test(out), "a macro gutted to a stub is flagged", (/\[MED\] parity.*/.exec(out) ?? [])[0]);
  check(/a real simplification looks the same/.test(out),
    "...and admits it cannot tell a stub from a genuine simplification");
}
{
  /* d) the negative carry filter reintroduced -- the v0.35.0 bug */
  const out = seeded((r) => fs.appendFileSync(path.join(r, "macros/tbe-alpha.js"),
    '\nconst s = items.filter((i) => i.system.carried !== "stored");\n'));
  check(/\[HIGH\] ownership.*negative filter/s.test(out),
    "a reintroduced `!== \"stored\"` filter is caught", (/\[HIGH\] ownership.*/.exec(out) ?? [])[0]);
  check(/dropped shield went on defending/.test(out),
    "...and the finding says what the bug DOES, not just which pattern matched");
}
{
  /* e) whisper logic outside the owner -- the v0.34.0 rule */
  const out = seeded((r) => fs.appendFileSync(path.join(r, "macros/tbe-beta.js"),
    "\nconst w = ChatMessage.getWhisperRecipients('GM');\n"));
  check(/\[HIGH\] ownership.*visibility owner/s.test(out),
    "a second whisper implementation is caught", (/\[HIGH\] ownership.*/.exec(out) ?? [])[0]);
}
{
  /* f) ...but the three files that are ALLOWED to do it must not be flagged */
  const out = seeded((r) => fs.appendFileSync(path.join(r, "macros/_lib.js"),
    "\ndata.whisper = gms;\n"));
  check(!/\[HIGH\] ownership.*visibility owner/s.test(out),
    "_lib.js's documented fallback is NOT reported — a detector that cries wolf gets ignored");
}
{
  /* g) two form controls sharing a name -- the v0.33.0 corruption */
  const out = seeded((r) => W(r, "system/the-broken-empires/templates/actor/actor-character-sheet.hbs",
    '<form><input name="system.a" /><input name="system.a" /></form>\n'));
  check(/\[HIGH\] ownership.*sharing a name/s.test(out),
    "a duplicated form field name is caught", (/\[HIGH\] ownership.*/.exec(out) ?? [])[0]);
  check(/rolled Initiative 0/.test(out), "...and cites what that did to a real world");
}
{
  /* h) a check script deleted -- removing the evidence */
  const out = seeded((r) => fs.unlinkSync(path.join(r, "alpha_check.mjs")));
  check(/\[HIGH\] verification.*DELETED/s.test(out),
    "a deleted check script is caught", (/\[HIGH\] verification.*/.exec(out) ?? [])[0]);
}
{
  /* i) a check that goes from green to red */
  const out = seeded((r) => fs.writeFileSync(path.join(r, "alpha_check.mjs"),
    'console.log("\\n0 passed, 1 failed");\n'));
  check(/\[HIGH\] verification.*green at baseline/s.test(out),
    "a newly-red check is HIGH, and says it was green before",
    (/\[HIGH\] verification.*/.exec(out) ?? [])[0]);
}
{
  /* j) a check that was ALREADY red stays medium -- severity has to be honest,
        or a pre-existing failure drowns a new one */
  const root = makeRepo();
  fs.writeFileSync(path.join(root, "alpha_check.mjs"), 'console.log("\\n0 passed, 1 failed");\n');
  baseline(root);
  const out = probe(root);
  check(/\[MED\] verification.*ALREADY failing/s.test(out),
    "a check red at baseline is MEDIUM, not HIGH", (/\[MED\] verification.*/.exec(out) ?? [])[0]);
}
{
  /* k) a new check added without a CLAUDE.md bullet -- how tier3 got lost */
  const out = seeded((r) => fs.writeFileSync(path.join(r, "beta_check.mjs"),
    'console.log("\\n1 passed, 0 failed");\n'));
  check(/\[MED\] docs.*beta_check\.mjs/s.test(out),
    "an undocumented new check is caught", (/\[MED\] docs.*/.exec(out) ?? [])[0]);
  check(/tier3_check\.mjs stayed red/.test(out), "...and cites the release where that actually happened");
}
{
  /* l) a version bump with no changelog entry */
  const out = seeded((r) => W(r, "system/the-broken-empires/system.json", JSON.stringify({ version: "1.1.0" })));
  check(/\[HIGH\] changelog.*no entry/s.test(out),
    "shipping a version with nothing said about it is caught", (/\[HIGH\] changelog.*/.exec(out) ?? [])[0]);
}

console.log("\n4. It reports deferrals the runs declared, rather than only failures");
{
  const out = seeded((r) => {
    W(r, "system/the-broken-empires/system.json", JSON.stringify({ version: "1.1.0" }));
    const p = path.join(r, "system/the-broken-empires/CHANGELOG.md");
    fs.writeFileSync(p, "# 1.1.0 — 2026-01-02\n\n- B4 did not land: the sheet work needs a decision from Seb first.\n\n" +
      fs.readFileSync(p, "utf8"));
  });
  check(/did not land: the sheet work needs a decision/.test(out),
    "a deferral written into a changelog entry is surfaced", (/7\. Deferred[\s\S]{0,300}/.exec(out) ?? [])[0]);
}

console.log("\n5. It writes findings into BACKLOG.md, idempotently");
{
  const root = makeRepo();
  baseline(root);
  fs.unlinkSync(path.join(root, "macros/tbe-beta.js"));
  probe(root, false);
  const first = fs.readFileSync(path.join(root, "BACKLOG.md"), "utf8");
  check(/## Release probe — unattended-run audit/.test(first), "a section is written");
  check(/tbe-beta\.js/.test(first), "...carrying the finding");
  check(/Existing section/.test(first), "...without eating the rest of the file");
  check(/regenerated in place/.test(first), "...and warning that editing it in place is pointless");

  probe(root, false);
  const second = fs.readFileSync(path.join(root, "BACKLOG.md"), "utf8");
  const count = (second.match(/## Release probe — unattended-run audit/g) ?? []).length;
  check(count === 1, "running twice REPLACES its section rather than stacking duplicates", count);
  check(/Existing section/.test(second), "...and still does not eat the rest of the file");
}
{
  /* A clean run must not write at all -- an empty section is noise that trains
     people to skip the real one. */
  const before = fs.readFileSync(path.join(cleanRoot, "BACKLOG.md"), "utf8");
  probe(cleanRoot, false);
  const after = fs.readFileSync(path.join(cleanRoot, "BACKLOG.md"), "utf8");
  check(before === after, "a clean run leaves BACKLOG.md untouched");
}
{
  const root = makeRepo();
  baseline(root);
  fs.unlinkSync(path.join(root, "macros/tbe-beta.js"));
  const before = fs.readFileSync(path.join(root, "BACKLOG.md"), "utf8");
  probe(root, true);
  check(before === fs.readFileSync(path.join(root, "BACKLOG.md"), "utf8"),
    "--dry writes nothing even when there are findings");
}

console.log("\n6. It never fails a build, and never edits anything but BACKLOG.md");
{
  const root = makeRepo();
  baseline(root);
  fs.unlinkSync(path.join(root, "macros/tbe-beta.js"));
  const snap = {};
  for (const f of ["build.js", "CLAUDE.md", "macros/tbe-alpha.js", "docs/ownership.md",
                   "system/the-broken-empires/system.json", "system/the-broken-empires/CHANGELOG.md"]) {
    snap[f] = fs.readFileSync(path.join(root, f), "utf8");
  }
  let code = 0;
  try { probe(root, false); } catch (e) { code = e.status ?? 1; }
  check(code === 0, "exits 0 even with HIGH findings — it reports, a human decides", code);
  for (const [f, text] of Object.entries(snap)) {
    check(fs.readFileSync(path.join(root, f), "utf8") === text, `${f} was not modified`);
  }
}

console.log("\n7. It is not part of the suite, and says so");
{
  const SRC = fs.readFileSync(path.join(__dirname, "release_probe.mjs"), "utf8");
  check(/NOT PART OF THE SUITE/.test(SRC), "the probe says it must not be added to the verification list");
  const CLAUDE = fs.readFileSync(path.join(__dirname, "CLAUDE.md"), "utf8");
  check(!/node release_probe\.mjs/.test(CLAUDE),
    "and CLAUDE.md does not list it — a scheduled run that kept it green would be grading its own homework");
  const BASE_SRC = fs.readFileSync(path.join(__dirname, "release_baseline.mjs"), "utf8");
  check(/DO NOT REGENERATE/.test(BASE_SRC),
    "the baseline warns against being retaken after a run, which would silently void every comparison");
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
