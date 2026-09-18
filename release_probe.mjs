/* release_probe.mjs — what did the unattended runs actually do to this repo?
 *
 * Run this AFTER a stretch of scheduled work, against the snapshot
 * `release_baseline.mjs` took before it. Three runs (2026-09-17 multiplayer
 * readiness, 2026-09-18 combat pass, 2026-09-19 backlog #5-#7) each modify this
 * codebase with nobody watching, each having been given constraints they can
 * only be checked against afterwards.
 *
 * NOT PART OF THE SUITE. Do not add this to CLAUDE.md's verification list and
 * do not "keep it green" -- it is an after-the-fact audit, and a scheduled run
 * that tried to satisfy it would be grading its own homework.
 *
 * THE FAILURE MODE THIS IS WRITTEN AGAINST is the one the session probe already
 * taught: a report that comes back tidy because its detectors silently matched
 * nothing. Three specific defences:
 *   1. It ENUMERATES what is on disk rather than iterating a list. The curated
 *      13-script list this project was using turned out to be a subset of 26
 *      real check files, and `tier3_check.mjs` had been red across two releases
 *      because nothing was running it.
 *   2. Every detector is proved to fire by `release_probe_check.mjs`, which
 *      seeds each violation and confirms it is reported.
 *   3. Where it cannot know something, it says so rather than reporting clean.
 *      A skipped slow check is "not covered", never "passed".
 *
 * It writes its findings into BACKLOG.md so nothing evaporates -- idempotently,
 * replacing its own previous section rather than stacking duplicates. It changes
 * nothing else, ever.
 *
 * Run: node release_probe.mjs            (report + write findings)
 *      node release_probe.mjs --dry      (report only, touch nothing)
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const R = (f) => path.join(__dirname, f);
const read = (f) => fs.readFileSync(R(f), "utf8");
const sha = (t) => crypto.createHash("sha256").update(t).digest("hex").slice(0, 16);
const exists = (f) => fs.existsSync(R(f));
const DRY = process.argv.includes("--dry");

const BASELINE_PATH = "data/release_baseline.json";
if (!exists(BASELINE_PATH)) {
  console.error(`No baseline at ${BASELINE_PATH}. It must be captured BEFORE the runs ` +
    `(node release_baseline.mjs). Without it this probe cannot tell what left, only what is here.`);
  process.exit(2);
}
const BASE = JSON.parse(read(BASELINE_PATH));

/* Findings, each with a severity so the write-up can be ordered by what
   actually matters rather than by the order checks happen to run. */
const findings = [];
const finding = (severity, area, text) => findings.push({ severity, area, text });
const HIGH = "high", MED = "med", LOW = "low";

const out = [];
const say = (s = "") => { out.push(s); console.log(s); };
const codeOf = (t) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

/* ------------------------------------------------------------------ */
say(`\nRELEASE PROBE — against a baseline taken ${BASE.takenAt}`);
say(`  baseline version ${BASE.version}`);

/* 1. Version and changelog ------------------------------------------ */
say("\n1. Version and changelog");
const nowVersion = JSON.parse(read("system/the-broken-empires/system.json")).version;
const changelog = read("system/the-broken-empires/CHANGELOG.md");
const nowVersions = [...changelog.matchAll(/^# (\d+\.\d+\.\d+)/gm)].map((m) => m[1]);
const newVersions = nowVersions.filter((v) => !BASE.changelogVersions.includes(v));

say(`  version ${BASE.version} -> ${nowVersion}`);
say(`  changelog entries added: ${newVersions.length ? newVersions.join(", ") : "none"}`);

if (nowVersion === BASE.version && newVersions.length === 0) {
  say("  nothing shipped a version bump — either the runs did internal work only, or they did not run");
} else if (!nowVersions.includes(nowVersion)) {
  finding(HIGH, "changelog", `system.json is at ${nowVersion} but CHANGELOG.md has no entry for it. ` +
    `Something shipped without saying what changed.`);
}
/* The zip is the delivered artifact; if it is stale the GM installs the wrong thing. */
if (exists("The-Broken-Empires-System.zip")) {
  try {
    const zipVersion = execSync(`unzip -p The-Broken-Empires-System.zip the-broken-empires/system.json | grep '"version"'`,
      { cwd: __dirname, encoding: "utf8" });
    if (!zipVersion.includes(nowVersion)) {
      finding(HIGH, "release", `The delivered zip carries ${zipVersion.trim()} but system.json says ${nowVersion}. ` +
        `The artifact and the source disagree — rebuild before anyone installs it.`);
    } else say(`  zip matches system.json (${nowVersion})`);
  } catch { say("  zip present but could not be read"); }
} else if (BASE.zipVersion) {
  finding(HIGH, "release", `The-Broken-Empires-System.zip existed at baseline (${BASE.zipVersion}) and is now gone.`);
} else {
  /* Absent then, absent now. A probe is a diff: reporting a state that did not
     change would train the reader to skim past real findings. */
  say("  no delivered zip, and there was none at baseline either — not a change");
}

/* 2. The suite, enumerated rather than listed ------------------------ */
say("\n2. Check suite (every *_check.mjs on disk, not a curated list)");
const checksNow = fs.readdirSync(__dirname).filter((f) => /_check\.mjs$/.test(f)).sort();
const added = checksNow.filter((c) => !BASE.checks.includes(c));
const removed = BASE.checks.filter((c) => !checksNow.includes(c));

if (removed.length) {
  finding(HIGH, "verification", `Check script(s) DELETED: ${removed.join(", ")}. ` +
    `A run that removes a check removes the evidence for whatever it was asserting.`);
}
say(`  ${checksNow.length} check scripts (${added.length} new, ${removed.length} removed)`);
if (added.length) say(`  new: ${added.join(", ")}`);

/* Slow ones are named, not silently skipped — "not covered" beats "passed". */
const SLOW = ["cast_check.mjs", "wizard_visual_check.mjs", "finish_check.mjs", "magic_check.mjs"];
const results = {};
for (const c of checksNow) {
  if (SLOW.includes(c)) { results[c] = { skipped: true }; continue; }
  try {
    const o = execSync(`node ${c} 2>&1 | tail -3`, { cwd: __dirname, encoding: "utf8", timeout: 180000 });
    const m = /(\d+) passed, (\d+) failed/.exec(o);
    if (m) results[c] = { passed: +m[1], failed: +m[2] };
    else if (/ALL .*PASSED/i.test(o)) results[c] = { passed: null, failed: 0 };
    else results[c] = { unknown: o.trim().split("\n").pop().slice(0, 90) };
  } catch (err) {
    results[c] = { failed: 1, error: String(err.message).split("\n")[0].slice(0, 90) };
  }
}
const red = Object.entries(results).filter(([, v]) => v.failed > 0);
const murky = Object.entries(results).filter(([, v]) => v.unknown);
for (const [name, v] of red) {
  const was = BASE.suite[name];
  const wasRed = was && (was.failed > 0 || was.error);
  finding(wasRed ? MED : HIGH, "verification",
    `${name} is failing${v.error ? " (" + v.error + ")" : ""}` +
    (wasRed ? " — it was ALREADY failing at baseline, so this is not new, but it is still shipping red."
            : " — it was green at baseline, so something in these runs broke it."));
}
for (const [name, v] of murky) {
  finding(LOW, "verification", `${name} produced no readable pass/fail line (${v.unknown}) — cannot be scored.`);
}
say(`  green: ${Object.values(results).filter((v) => v.failed === 0).length}` +
    `  red: ${red.length}  skipped(slow): ${SLOW.filter((s) => checksNow.includes(s)).length}  unreadable: ${murky.length}`);
if (SLOW.some((s) => checksNow.includes(s))) {
  say(`  NOT COVERED by this run: ${SLOW.filter((s) => checksNow.includes(s)).join(", ")} — run them separately before release`);
}

/* 3. Parity: no macro removed, deprecated or hollowed out ------------ */
say("\n3. Macro parity (every run was told: do not delete, deprecate, hollow out or stub any macro)");
const BUILD = read("build.js");
const registeredNow = [...BUILD.matchAll(/\["([^"]+)",\s*"([^"]+\.js)"/g)].map(([, name, file]) => ({ name, file }));
const namesNow = new Set(registeredNow.map((m) => m.name));

for (const m of BASE.macros) {
  if (!namesNow.has(m.name)) {
    finding(HIGH, "parity", `Macro "${m.name}" is no longer registered in build.js. It was at baseline.`);
    continue;
  }
  const rel = "macros/" + m.file;
  if (!exists(rel)) {
    finding(HIGH, "parity", `Macro file ${rel} ("${m.name}") has been deleted.`);
    continue;
  }
  const bytes = read(rel).length;
  /* A macro that lost more than 40% of itself is the shape of a stub. Reported
     as something to look at, never asserted to be wrong — a genuine
     simplification looks identical from here. */
  if (m.bytes && bytes < m.bytes * 0.6) {
    finding(MED, "parity", `Macro "${m.name}" shrank from ${m.bytes} to ${bytes} bytes ` +
      `(${Math.round(100 - (bytes / m.bytes) * 100)}% smaller). Worth reading: that is the shape of a stub, ` +
      `though a real simplification looks the same from here.`);
  }
}
const newMacros = registeredNow.filter((m) => !BASE.macros.some((b) => b.name === m.name));
say(`  ${registeredNow.length} registered (${newMacros.length} new, baseline had ${BASE.macroCount})`);
if (newMacros.length) say(`  new: ${newMacros.map((m) => m.name).join(", ")}`);

/* 4. Named invariants ------------------------------------------------ */
say("\n4. Invariants each run was explicitly told to preserve");
const macroFiles = fs.readdirSync(R("macros")).filter((f) => f.endsWith(".js")).map((f) => "macros/" + f);
const moduleFiles = [];
(function walk(d) {
  for (const n of fs.readdirSync(R(d))) {
    const rel = path.posix.join(d, n);
    if (fs.statSync(R(rel)).isDirectory()) walk(rel);
    else if (rel.endsWith(".mjs")) moduleFiles.push(rel);
  }
})("system/the-broken-empires/module");
const src = [...macroFiles, ...moduleFiles].map((f) => ({ file: f, code: codeOf(read(f)) }));

/* `_lib.js` holds TBE.say's deliberate Node/legacy fallback, and visibility.mjs
   and the entry point are the owner and its publisher. Those three are allowed
   to name whisper machinery; a fourth file is a second implementation. */
const WHISPER_ALLOWED = [/rules\/visibility\.mjs$/, /the-broken-empires\.mjs$/, /macros\/_lib\.js$/];

const invariantsNow = {
  negativeCarryFilter: src.filter((s) => /!==\s*["']stored["']/.test(s.code)).map((s) => s.file),
  whisperOutsideOwner: src.filter((s) => !WHISPER_ALLOWED.some((re) => re.test(s.file)))
    .filter((s) => /getWhisperRecipients|\bwhisper\s*[:=]/.test(s.code)).map((s) => s.file),
  duplicateFieldNames: (() => {
    const res = [];
    const parts = {};
    (function walkT(d) {
      for (const n of fs.readdirSync(R(d))) {
        const rel = path.posix.join(d, n);
        if (fs.statSync(R(rel)).isDirectory()) walkT(rel);
        else if (rel.endsWith(".hbs")) parts[rel] = read(rel);
      }
    })("system/the-broken-empires/templates");
    for (const sheet of Object.keys(parts).filter((k) => /-sheet\.hbs$/.test(k))) {
      let html = parts[sheet];
      for (let i = 0; i < 6; i++) {
        html = html.replace(/\{\{>\s*"systems\/the-broken-empires\/(templates\/[^"]+)"\s*\}\}/g,
          (_m, p) => parts["system/the-broken-empires/" + p] ?? "");
      }
      const seen = new Map();
      for (const m of html.matchAll(/<(?:input|select|textarea)\b[^>]*\bname="([^"]+)"[^>]*>/g)) {
        if (m[1].includes("{{")) continue;
        seen.set(m[1], (seen.get(m[1]) ?? 0) + 1);
      }
      for (const [n, c] of seen) if (c > 1) res.push(sheet + ":" + n);
    }
    return res;
  })()
};

const LABEL = {
  negativeCarryFilter: "a `carried !== \"stored\"` negative filter (v0.35.0: silently wrong once a fourth state exists — a dropped shield went on defending)",
  whisperOutsideOwner: "whisper machinery outside the visibility owner (v0.34.0: chat visibility has exactly one owner)",
  duplicateFieldNames: "two form controls sharing a name in one sheet (v0.33.0: FormDataExtended hands the DataModel an array, and every creature rolled Initiative 0)"
};
for (const [key, hits] of Object.entries(invariantsNow)) {
  const was = BASE.invariants[key] ?? [];
  const isNew = hits.filter((h) => !was.includes(h));
  if (isNew.length) {
    finding(HIGH, "ownership", `NEW violation — ${LABEL[key]} — in: ${isNew.join(", ")}`);
  }
  const fixed = was.filter((h) => !hits.includes(h));
  say(`  ${key}: ${hits.length} (baseline ${was.length}` +
      `${isNew.length ? `, ${isNew.length} NEW` : ""}${fixed.length ? `, ${fixed.length} cleared` : ""})`);
}

/* 5. Scope adherence ------------------------------------------------- */
say("\n5. What changed on disk");
const filesNow = {};
for (const rel of Object.keys(BASE.files)) if (exists(rel)) filesNow[rel] = sha(read(rel));
const changed = Object.keys(BASE.files).filter((f) => exists(f) && filesNow[f] !== BASE.files[f].sha);
const gone = Object.keys(BASE.files).filter((f) => !exists(f));

say(`  ${changed.length} changed, ${gone.length} removed`);
for (const g of gone) {
  if (/_check\.mjs$/.test(g)) continue;              // already reported above
  finding(MED, "scope", `File removed since baseline: ${g}`);
}
if (changed.length) say(`  changed: ${changed.slice(0, 20).join(", ")}${changed.length > 20 ? ", ..." : ""}`);

/* The out-of-scope lists are prose, so this cannot be exact. It reports what a
   human should eyeball, and says that is what it is doing. */
say("\n  Declared out-of-scope, for eyeballing against the list above:");
for (const run of BASE.scheduled ?? []) {
  say(`    ${run.when} ${run.name}: ${run.outOfScope.join("; ")}`);
}

/* 6. Documentation currency ------------------------------------------ */
say("\n6. Docs kept current");
const CLAUDE = read("CLAUDE.md");
const undocumented = checksNow.filter((c) => !CLAUDE.includes(c) && c !== "release_probe_check.mjs");
if (undocumented.length) {
  const baseUndoc = BASE.undocumentedChecks ?? [];
  const newlyUndoc = undocumented.filter((c) => !baseUndoc.includes(c));
  if (newlyUndoc.length) {
    finding(MED, "docs", `Check script(s) added without a bullet in CLAUDE.md's Verification section: ` +
      `${newlyUndoc.join(", ")}. A check nobody knows to run is a check nobody runs — which is how ` +
      `tier3_check.mjs stayed red across two releases.`);
  }
  say(`  ${undocumented.length} check(s) not mentioned in CLAUDE.md (${newlyUndoc.length} new)`);
} else say("  every check on disk is documented");

const ownershipRows = (read("docs/ownership.md").match(/^\|/gm) ?? []).length;
say(`  docs/ownership.md rows: ${ownershipRows} (baseline ${BASE.ownershipRows})`);

/* 7. What the runs said they deferred -------------------------------- */
say("\n7. Deferred, per the new changelog entries");
const deferrals = [];
for (const v of newVersions) {
  const start = changelog.indexOf(`# ${v}`);
  const next = changelog.indexOf("\n# ", start + 1);
  const body = changelog.slice(start, next === -1 ? undefined : next);
  for (const line of body.split("\n")) {
    if (/not built|deferred|out of scope|did not land|dropped|needs a decision|still open/i.test(line) && line.trim().length > 30) {
      deferrals.push(`${v}: ${line.trim().replace(/^[-*]\s*/, "").slice(0, 160)}`);
    }
  }
}
if (deferrals.length) { for (const d of deferrals) say("  " + d); }
else say("  nothing flagged as deferred in the new entries (or no new entries)");

/* ------------------------------------------------------------------ */
say("\n" + "=".repeat(64));
const bySev = (s) => findings.filter((f) => f.severity === s);
say(`FINDINGS: ${bySev(HIGH).length} high, ${bySev(MED).length} medium, ${bySev(LOW).length} low`);
for (const s of [HIGH, MED, LOW]) {
  for (const f of bySev(s)) say(`  [${s.toUpperCase()}] ${f.area}: ${f.text}`);
}
if (!findings.length) {
  say("  none. Note what that does and does not mean: the slow Chromium checks were not run, and " +
      "the out-of-scope lists in section 5 are prose this cannot verify mechanically.");
}

/* 8. Write findings into BACKLOG.md ---------------------------------- */
const HEADING = "## Release probe — unattended-run audit";
if (DRY) {
  say("\n--dry: BACKLOG.md not written.");
} else if (!findings.length) {
  say("\nNo findings, so BACKLOG.md was not touched.");
} else {
  const backlog = read("BACKLOG.md");
  const section =
    `${HEADING}\n\n` +
    `Written by \`release_probe.mjs\` on ${new Date().toISOString().slice(0, 10)}, comparing this repo ` +
    `against the baseline taken ${BASE.takenAt.slice(0, 10)} (${BASE.version} → ${nowVersion}). ` +
    `**This section is regenerated in place on every run — edit findings into their proper home rather ` +
    `than editing them here, or the next run will overwrite you.**\n\n` +
    findings.map((f) => `- **[${f.severity.toUpperCase()}] ${f.area}** — ${f.text}`).join("\n") +
    `\n\nNot verified by this probe: the slow Chromium checks ` +
    `(${SLOW.filter((s) => checksNow.includes(s)).join(", ") || "none present"}), and whether each run ` +
    `stayed inside its declared scope — that list is prose and needs a human against section 5 of the ` +
    `probe output.\n\n`;

  let next;
  const at = backlog.indexOf(HEADING);
  if (at === -1) {
    /* Put it directly under the file's intro so it is the first thing read. */
    const firstSection = backlog.indexOf("\n## ");
    next = backlog.slice(0, firstSection + 1) + section + backlog.slice(firstSection + 1);
  } else {
    const end = backlog.indexOf("\n## ", at + 1);
    next = backlog.slice(0, at) + section + (end === -1 ? "" : backlog.slice(end + 1));
  }
  fs.writeFileSync(R("BACKLOG.md"), next);
  say(`\n${findings.length} finding(s) written into BACKLOG.md under "${HEADING}" (replacing any previous run's section).`);
}

/* The probe itself never fails a build. It reports; a human decides. */
process.exit(0);
