/* release_baseline.mjs — snapshot this repo BEFORE unattended work runs, so a
 * probe afterwards can say what actually changed rather than guessing.
 *
 * WHY IT EXISTS. Three scheduled runs (2026-09-17 multiplayer readiness,
 * 2026-09-18 combat pass, 2026-09-19 backlog #5-#7) will each modify this
 * codebase with nobody watching. Each was given explicit constraints -- stay in
 * scope, do not delete or stub any macro, do not add a second implementation of
 * a rule that has an owner. Afterwards those claims need checking, and almost
 * none of them can be checked from the end state alone: "no macro was removed"
 * is a statement about a DIFFERENCE. Without a snapshot taken first, a probe
 * can only report what is there, not what left.
 *
 * DO NOT REGENERATE THIS AFTER A SCHEDULED RUN. Overwriting the baseline with
 * the post-run state makes every subsequent comparison read clean, which is the
 * worst possible failure: a green report that checked nothing. If you genuinely
 * need a new baseline (a new stretch of unattended work, starting fresh), say
 * so in the file's `note` when you take it.
 *
 * Run: node release_baseline.mjs
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

const OUT = "data/release_baseline.json";

/* Every file whose disappearance or hollowing-out would matter. Directories are
   walked; a file that is added later shows up as "added" rather than breaking. */
const WATCH_DIRS = [
  "macros",
  "system/the-broken-empires/module",
  "system/the-broken-empires/templates"
];
const WATCH_GLOB = [".js", ".mjs", ".hbs", ".json"];

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(R(dir))) {
    const rel = path.posix.join(dir, name);
    const st = fs.statSync(R(rel));
    if (st.isDirectory()) walk(rel, acc);
    else if (WATCH_GLOB.includes(path.extname(name))) acc.push(rel);
  }
  return acc;
}

const files = {};
for (const dir of WATCH_DIRS) {
  for (const rel of walk(dir)) {
    const text = read(rel);
    files[rel] = { bytes: text.length, sha: sha(text), lines: text.split("\n").length };
  }
}

/* Repo-root scripts and docs, listed explicitly because the root has plenty of
   files that are not interesting. */
for (const rel of fs.readdirSync(__dirname)) {
  if (!/_check\.mjs$|^simtest\.js$|^build\.js$|^build_packs\.mjs$|^CLAUDE\.md$|^BACKLOG\.md$|^ROADMAP\.md$/.test(rel)) continue;
  const text = read(rel);
  files[rel] = { bytes: text.length, sha: sha(text), lines: text.split("\n").length };
}
for (const rel of ["docs/ownership.md", "system/the-broken-empires/system.json",
                   "system/the-broken-empires/CHANGELOG.md", "TBE-Session-Probe.js"]) {
  if (!fs.existsSync(R(rel))) continue;
  const text = read(rel);
  files[rel] = { bytes: text.length, sha: sha(text), lines: text.split("\n").length };
}

/* The macro roster, which the parity constraint is about: "do not delete,
   deprecate, hollow out, or stub any macro." Name + size, so a macro that is
   still present but gutted is visible. */
const BUILD = read("build.js");
const registered = [...BUILD.matchAll(/\["([^"]+)",\s*"([^"]+\.js)"/g)].map(([, name, file]) => ({ name, file }));
const macros = registered.map((m) => {
  const rel = "macros/" + m.file;
  const exists = fs.existsSync(R(rel));
  return { ...m, exists, bytes: exists ? read(rel).length : 0 };
});

/* The check suite as it stands, and what CLAUDE.md claims about it. A run that
   adds a check must add a bullet; a run that DELETES a check is a finding on
   its own. */
const checks = fs.readdirSync(__dirname).filter((f) => /_check\.mjs$/.test(f)).sort();
const CLAUDE = read("CLAUDE.md");
const documentedChecks = checks.filter((c) => CLAUDE.includes(c));

/* Invariants each scheduled run was explicitly told to preserve. All of these
   should be zero now; the probe re-counts them and any rise is a regression
   against a named instruction, not a vague code-smell. */
const codeOf = (t) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const macroSrc = fs.readdirSync(R("macros")).filter((f) => f.endsWith(".js"))
  .map((f) => ({ file: "macros/" + f, code: codeOf(read("macros/" + f)) }));
const moduleSrc = Object.keys(files).filter((f) => f.startsWith("system/the-broken-empires/module") && f.endsWith(".mjs"))
  .map((f) => ({ file: f, code: codeOf(read(f)) }));

const invariants = {
  /* v0.35.0: a negative filter over an open enum. */
  negativeCarryFilter: [...macroSrc, ...moduleSrc]
    .filter((s) => /!==\s*["']stored["']/.test(s.code)).map((s) => s.file),
  /* v0.34.0: visibility has one owner. Three files are allowed to name whisper
     machinery -- the owner, the entry point that publishes it, and `_lib.js`,
     which holds TBE.say's deliberate and documented Node/legacy fallback. A
     FOURTH is a second implementation. Kept identical to the probe's allowance
     in release_probe.mjs; if these two lists drift, the baseline and the probe
     disagree about what clean means, which is worse than either being wrong. */
  whisperOutsideOwner: [...macroSrc, ...moduleSrc]
    .filter((s) => ![/rules\/visibility\.mjs$/, /the-broken-empires\.mjs$/, /macros\/_lib\.js$/]
      .some((re) => re.test(s.file)))
    .filter((s) => /getWhisperRecipients|\bwhisper\s*[:=]/.test(s.code)).map((s) => s.file),
  /* There was a `constActorInMacro` invariant here, on the claim that `actor`
     is a parameter Foundry passes to every script macro and so cannot be
     redeclared. It is NOT an invariant: Foundry wraps a macro's command in a
     block, so a top-level `const actor` shadows the parameter legally, and
     three shipped macros have done that for months. Removed rather than
     silently dropped, so the next reader knows it was tested and disproved
     instead of forgotten. */
  /* v0.33.0: a repeated form field name corrupts a DataModel silently. */
  duplicateFieldNames: (() => {
    const out = [];
    const parts = {};
    for (const f of Object.keys(files).filter((k) => k.endsWith(".hbs"))) parts[f] = read(f);
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
      for (const [n, c] of seen) if (c > 1) out.push(sheet + ":" + n);
    }
    return out;
  })()
};

/* The suite's current state, so "still green" is measurable rather than
   asserted. Slow Chromium-driven checks are skipped by default; they are named
   so the probe can say they were not covered rather than implying they passed. */
const SLOW = ["cast_check.mjs", "wizard_visual_check.mjs", "finish_check.mjs", "magic_check.mjs"];
const suite = {};
for (const c of checks) {
  if (SLOW.includes(c)) { suite[c] = { skipped: "slow (Chromium)" }; continue; }
  try {
    const out = execSync(`node ${c} 2>&1 | tail -1`, { cwd: __dirname, encoding: "utf8", timeout: 120000 });
    const m = /(\d+) passed, (\d+) failed/.exec(out);
    suite[c] = m ? { passed: +m[1], failed: +m[2] } : { raw: out.trim().slice(0, 120) };
  } catch (err) {
    suite[c] = { error: String(err.message).slice(0, 120) };
  }
}

/* Whether a delivered artifact existed at all, so the probe can tell "no zip,
   and there never was one" (not a finding) from "the zip was deleted" (one). */
let zipVersion = null;
try {
  if (fs.existsSync(R("The-Broken-Empires-System.zip"))) {
    const o = execSync(`unzip -p The-Broken-Empires-System.zip the-broken-empires/system.json | grep '"version"'`,
      { cwd: __dirname, encoding: "utf8" });
    zipVersion = (/"version":\s*"([^"]+)"/.exec(o) ?? [])[1] ?? "unreadable";
  }
} catch { zipVersion = "unreadable"; }

const baseline = {
  takenAt: new Date().toISOString(),
  zipVersion,
  note: "Taken before the three scheduled runs of 2026-09-17/18/19. DO NOT REGENERATE after a run.",
  version: JSON.parse(read("system/the-broken-empires/system.json")).version,
  changelogVersions: [...read("system/the-broken-empires/CHANGELOG.md").matchAll(/^# (\d+\.\d+\.\d+)/gm)].map((m) => m[1]),
  ownershipRows: (read("docs/ownership.md").match(/^\|/gm) ?? []).length,
  macros,
  macroCount: macros.length,
  checks,
  documentedChecks,
  undocumentedChecks: checks.filter((c) => !documentedChecks.includes(c)),
  invariants,
  suite,
  files,
  fileCount: Object.keys(files).length,
  /* What each scheduled run was told NOT to do, so the probe can check the
     claim rather than re-deriving it from prose months later. */
  scheduled: [
    { when: "2026-09-17T22:00Z", name: "multiplayer readiness",
      outOfScope: ["backlog #5-#7", "blind rolls", "player-presence panel",
                   "readiness control", "Friday's combat pass"] },
    { when: "2026-09-18T22:00Z", name: "combat pass + table-feel notes",
      outOfScope: ["backlog #5-#7", "player-presence panel", "action-economy enforcement",
                   "Stored retrieval flow", "pick-up-while-Engaged"] },
    { when: "2026-09-19T22:00Z", name: "backlog #5-#7",
      outOfScope: ["#8 ApplicationV2", "Weapon Readiness"] }
  ]
};

fs.mkdirSync(R("data"), { recursive: true });
fs.writeFileSync(R(OUT), JSON.stringify(baseline, null, 1));

console.log(`Baseline written to ${OUT}`);
console.log(`  version        ${baseline.version}`);
console.log(`  macros         ${baseline.macroCount}`);
console.log(`  checks         ${baseline.checks.length} (${baseline.undocumentedChecks.length} not in CLAUDE.md)`);
console.log(`  files watched  ${baseline.fileCount}`);
const dirty = Object.entries(invariants).filter(([, v]) => v.length);
console.log(`  invariants     ${dirty.length ? "NOT CLEAN: " + JSON.stringify(Object.fromEntries(dirty)) : "all clean (0 violations)"}`);
const red = Object.entries(suite).filter(([, v]) => v.failed > 0 || v.error);
console.log(`  suite          ${red.length ? "RED: " + red.map(([k]) => k).join(", ") : "green across " + Object.keys(suite).filter((k) => suite[k].passed !== undefined).length + " scripts"}`);
