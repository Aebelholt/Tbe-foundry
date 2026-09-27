#!/usr/bin/env node
/* wizard_visual_check.mjs
 *
 * Headless-browser regression check for TBE: Character Wizard's DOM/UI
 * layer -- the one thing simtest.js and smoke_wizard.js don't cover, since
 * both test the wizard's pure data functions (roll tables, skill math,
 * talent resolution) without ever rendering the actual Application v1
 * dialog. That gap is exactly how the Skill Points prefill bug (fields
 * showing a nonzero even split instead of 0) shipped and had to be caught
 * by a user screenshot instead of a test run.
 *
 * This script:
 *   1. runs `node build.js` so it tests the current source, not a stale
 *      build artifact
 *   2. pulls the real, fully-assembled "TBE: Character Wizard" macro
 *      command straight out of data/solo_docs.json (the exact string
 *      Foundry would eval -- _lib.js + chargen data + the wizard file,
 *      concatenated exactly as build.js does it)
 *   3. runs that command in real headless Chromium behind a small shim
 *      that implements just enough of Foundry v11's Application v1
 *      lifecycle (render/renderInner/activateListeners) plus the handful
 *      of globals the wizard actually touches (Roll, ChatMessage, CONFIG,
 *      ui.notifications, canvas.tokens, game.user.character) -- NOT a
 *      general Foundry mock, just this macro's real call graph
 *   4. clicks through every step like a person would, screenshotting
 *      each one, and asserts the Skill Points step specifically: starts
 *      at 0 (not prefilled), "Spread what is left" respects typed values,
 *      and typed values survive a Next+Back round trip
 *   5. fails loudly (nonzero exit, printed evidence) on any console error,
 *      uncaught page error, or failed assertion
 *
 * Deliberately out of scope: commit()/Create Character. That path writes
 * to a real Actor document (createEmbeddedDocuments, compendium lookups)
 * which needs a real or much heavier Foundry stub to be meaningful --
 * simtest.js and smoke_wizard.js already cover that logic at the data
 * layer. This script's job is the DOM layer only.
 *
 * Run: node wizard_visual_check.mjs
 * Screenshots land in test-screenshots/wizard/.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "test-screenshots", "wizard");
const CHROMIUM_PATH = "/opt/pw-browsers/chromium";

fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

let failures = 0;
const fail = (msg) => { failures++; console.error("FAIL: " + msg); };
const check = (cond, msg) => { if (cond) console.log("  ok: " + msg); else fail(msg); };

/* Known, confirmed, not-yet-fixed defects (see BACKLOG.md "Wizard fidelity
 * audit"). These assert the CORRECT behavior, so they read as "still
 * broken" until the fix lands and then flip to "ok" on their own. They
 * deliberately do NOT increment the failure count: this harness's job is
 * to stop *regressions*, and a tracked defect failing the build every run
 * trains people to ignore a red result. Once a defect is fixed, move its
 * line from knownDefect() to check() so it can never come back. */
let stillBroken = 0;
const knownDefect = (cond, msg) => {
  if (cond) console.log("  ok (defect appears FIXED, promote this to check()): " + msg);
  else { stillBroken++; console.log("  STILL BROKEN (tracked, not failing build): " + msg); }
};

console.log("== 1. Rebuilding data/solo_docs.json from current macro source ==");
execFileSync("node", ["build.js"], { cwd: __dirname, stdio: "inherit" });

console.log("== 2. Extracting the real TBE: Character Wizard macro command ==");
const solo = JSON.parse(fs.readFileSync(path.join(__dirname, "data/solo_docs.json"), "utf8"));
const macro = solo.macros.find((m) => m.name === "TBE: Character Wizard");
if (!macro) { console.error("TBE: Character Wizard not found in data/solo_docs.json"); process.exit(1); }

/* ---- the shim: just enough Application v1 + globals for this macro's
 * actual call graph (confirmed by grepping the wizard source for every
 * Foundry global it touches). All top-level names are wrapped in an IIFE
 * so nothing here can collide with the macro's own top-level consts
 * (TBE, TBE_DATA, TBE_CHARGEN, TBE_TALENTS, SKILLS, SKILL_ALL,
 * RELATIONSHIP_TYPES, CHARGEN_SKILL_CAP, actor). */
const SHIM = `
(function () {
  function mergeObject(orig, other) { return Object.assign({}, orig, other); }
  window.foundry = { utils: { mergeObject: mergeObject, duplicate: function (o) { return JSON.parse(JSON.stringify(o)); } } };

  window.$ = function (html) {
    if (typeof html === "string") {
      const div = document.createElement("div");
      div.innerHTML = html.trim();
      return [div.firstElementChild];
    }
    return [html];
  };

  class Application {
    constructor(options) {
      options = options || {};
      this.options = Object.assign({}, this.constructor.defaultOptions, options);
      this.rendered = false;
      this.element = null;
    }
    static get defaultOptions() { return { width: 400, height: 400, id: "", title: "", classes: [] }; }
    activateListeners(html) {}
    async getData() { return {}; }
    async render(force) {
      if (!this.rendered) {
        const win = document.createElement("div");
        win.className = "window-app " + (this.options.classes || []).join(" ");
        if (this.options.id) win.id = this.options.id;
        win.innerHTML = '<header class="window-header"><h4 class="window-title"></h4></header><section class="window-content"></section>';
        win.querySelector(".window-title").textContent = this.options.title || "";
        document.body.appendChild(win);
        this.element = win;
        this.rendered = true;
      }
      const data = await this.getData();
      const inner = await this._renderInner(data);
      const innerEl = Array.isArray(inner) ? inner[0] : inner;
      const content = this.element.querySelector(".window-content");
      content.innerHTML = "";
      content.appendChild(innerEl);
      this.activateListeners([innerEl]);
      window.__wizard = this;
      return this;
    }
    close() { if (this.element) this.element.remove(); this.rendered = false; }
  }
  window.Application = Application;

  /* Deterministic PRNG so re-runs are reproducible -- this harness cares
   * about DOM/state correctness, not genuine randomness. */
  let seed = 7;
  function rand() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
  class Roll {
    constructor(formula) { this.formula = formula; }
    async evaluate() {
      const m = /(\\d*)d(\\d+)([+-]\\d+)?/.exec(this.formula);
      if (!m) { this.total = 0; return this; }
      const n = Number(m[1] || 1), faces = Number(m[2]), mod = Number(m[3] || 0);
      let total = mod;
      for (let i = 0; i < n; i++) total += 1 + Math.floor(rand() * faces);
      this.total = total;
      return this;
    }
  }
  window.Roll = Roll;

  window.ChatMessage = {
    create: async function (data) {
      console.log("[chat] " + String(data.content || "").replace(/<[^>]+>/g, " ").replace(/\\s+/g, " ").trim().slice(0, 140));
      return data;
    },
    getSpeaker: function () { return {}; }
  };
  window.CONFIG = { sounds: { dice: null }, statusEffects: [] };
  window.ui = {
    notifications: {
      warn: function (m) { console.warn("[notify:warn] " + m); },
      error: function (m) { console.error("[notify:error] " + m); },
      info: function (m) { console.log("[notify:info] " + m); }
    }
  };
  window.canvas = { tokens: { controlled: [] } };
  window.game = {
    user: {
      character: {
        id: "harness-actor-1", name: "Harness Test Subject", type: "character",
        items: [], system: {},
        update: async function () { return {}; },
        createEmbeddedDocuments: async function () { return []; },
        deleteEmbeddedDocuments: async function () { return []; }
      }
    },
    packs: { get: function () { return null; } },
    /* A real in-memory store, not a stub returning null: the concept-table
       editor round-trips through game.settings, so a stub would make the
       test pass without proving anything. */
    settings: (function () {
      const store = {};
      return {
        get: function (ns, key) { return store[ns + "." + key]; },
        set: async function (ns, key, value) { store[ns + "." + key] = value; return value; },
        register: function () {}
      };
    })()
  };
})();
`;

const HTML = `<!doctype html><html><head><meta charset="utf-8"><title>TBE Wizard visual check</title>
<style>
  html, body { margin: 0; background: #2b2b2b; }
  .window-app { width: 640px; margin: 14px auto; background: #f2e9d5; border: 1px solid #7a6a4f; border-radius: 6px;
                box-shadow: 0 2px 10px rgba(0,0,0,.5); font-family: Signika, sans-serif; }
  .window-header { background: #7a6a4f; color: #fff; padding: 6px 10px; border-radius: 6px 6px 0 0; }
  .window-header h4 { margin: 0; font-size: 14px; }
  .window-content { padding: 8px 10px; }
  input, select, button { font-family: inherit; }
  form { color: #2b2318; }
</style></head>
<body>
<script>${SHIM}</script>
<script>
/* Foundry runs a macro body inside an async function (Macro#execute), so
   top-level await and return are legal in it. A bare <script> is not that,
   and v0.49.0's draft-resume prompt was the first top-level await in this
   macro. An error inside is re-thrown on a timer so it still reaches
   pageerror, which section 5 counts. */
(async () => {
${macro.command}
})().catch((e) => setTimeout(() => { throw e; }));
</script>
</body></html>`;

const htmlPath = path.join(OUT_DIR, "_harness.html");
fs.writeFileSync(htmlPath, HTML);

console.log("== 3. Driving the real wizard in headless Chromium ==");
const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 700, height: 900 } });

const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (err) => { consoleErrors.push("pageerror: " + err.message); });

await page.goto("file://" + htmlPath);
await page.waitForSelector(".window-app", { timeout: 5000 }).catch(() => {});

const shot = async (name) => page.screenshot({ path: path.join(OUT_DIR, name), fullPage: true });

const windowExists = await page.$(".window-app");
if (!windowExists) {
  fail("wizard window never rendered -- actor resolution or an early script error likely broke before the first render");
  console.log(JSON.stringify({ consoleErrors }, null, 2));
  await browser.close();
  process.exit(1);
}
check(true, "wizard window rendered on first load");

/* Twelve steps since v0.12.0: Equip, Goals and Status moved to
 * TBE: Finish Character, which runs after Create Character when the rolled
 * totals actually exist. */
const stepDefs = [
  "concept", "race", "ability", "attributes", "culture", "life", "career",
  "skillPoints", "rounding", "talents", "personality", "review"
];

for (let i = 0; i < stepDefs.length; i++) {
  const key = stepDefs[i];
  const n = String(i + 1).padStart(2, "0");
  try {
  await shot(`${n}-${key}.png`);

  /* The progress bar always renders all 15 step labels (only the
   * background color distinguishes the current one, see _progressHtml()
   * in tbe-character-wizard.js), so checking the text merely *contains*
   * "N. Label" proves nothing -- it's true every iteration by
   * construction. Check which div actually carries the "current step"
   * inline style instead, and that it's the one at index i. */
  const progressCellStyles = await page.locator(".window-content form > div").first().locator("div").evaluateAll((els) => els.map((e) => e.getAttribute("style") || ""));
  check(progressCellStyles.length === stepDefs.length, `progress bar renders all ${stepDefs.length} step cells (found ${progressCellStyles.length})`);
  const highlightedIdx = progressCellStyles.findIndex((s) => s.includes("7a6a4f") && s.includes("font-weight:bold"));
  check(highlightedIdx === i, `progress bar highlights step ${i + 1} specifically (${key}), not a different one (highlighted index: ${highlightedIdx})`);

  if (key === "skillPoints") {
    console.log("-- Skill Points step: the exact spot the reported bug lived --");

    const allocInputs = page.locator(".tbe-alloc");
    const count = await allocInputs.count();
    if (count === 0) {
      fail("skillPoints step rendered no .tbe-alloc inputs -- default career (Warrior) should have 4 non-Magic pools");
    } else {
      const values = await allocInputs.evaluateAll((els) => els.map((e) => e.value));
      check(values.every((v) => v === "0"), `all ${count} skill fields start at 0, not prefilled (${JSON.stringify(values.slice(0, 6))}${values.length > 6 ? "..." : ""})`);

      const bodyText = await page.locator(".window-content").innerText();
      const overBy = /over by/.test(bodyText);
      check(!overBy, "no category shows an over-pool warning before any input");

      /* type into the first two fields of the first category and confirm
       * the values persist through a Next -> Back round trip (the wizard
       * has no live-input listener; state is read on the next action, so
       * this is the real path a player exercises when they tab away and
       * come back) */
      const firstCat = await page.locator('[data-action="even-split-cat"]').first().getAttribute("data-cat");
      const catInputs = page.locator(`.tbe-alloc[data-cat="${firstCat}"]`);
      await catInputs.nth(0).fill("15");
      await catInputs.nth(1).fill("20");

      await page.locator('[data-action="next"]').click();
      await shot(`${n}b-skillPoints-next.png`);
      await page.locator('[data-action="back"]').click();
      await shot(`${n}c-skillPoints-back.png`);

      const roundTripped = await page.locator(`.tbe-alloc[data-cat="${firstCat}"]`).evaluateAll((els) => els.map((e) => e.value));
      check(roundTripped[0] === "15" && roundTripped[1] === "20", `typed values (15, 20) survive a Next+Back round trip, got ${JSON.stringify(roundTripped.slice(0, 2))}`);

      const statusAfter = await page.locator(".window-content").innerText();
      check(statusAfter.includes("35 / "), `spent total (35) recomputed correctly after the round trip for ${firstCat}`);

      /* "Spread what is left" must respect deliberate entries: it fills only
       * the boxes still on 0, with only the unspent remainder. Overwriting
       * the player's own numbers was the old behaviour, and the separate
       * Clear button that existed to undo it is gone. */
      await page.locator(`[data-action="even-split-cat"][data-cat="${firstCat}"]`).click();
      await shot(`${n}d-skillPoints-spread.png`);
      const spreadVals = await page.locator(`.tbe-alloc[data-cat="${firstCat}"]`).evaluateAll((els) => els.map((e) => Number(e.value)));
      check(spreadVals[0] === 15 && spreadVals[1] === 20,
        `spreading the remainder leaves hand-typed values untouched (got ${spreadVals.slice(0, 2)})`);
      const spreadSum = spreadVals.reduce((a, b) => a + b, 0);
      const poolMatch = /(\d+)\s*\/\s*(\d+)\s*spent/.exec(await page.locator(".window-content").innerText());
      check(!!poolMatch, "spent/pool status text is parseable after spreading");
      if (poolMatch) check(spreadSum === Number(poolMatch[2]),
        `spreading fills the category exactly to its pool (${spreadSum} == ${poolMatch[2]})`);
      check((await page.$('[data-action="clear-cat"]')) === null,
        "the Clear button is gone, it only existed to undo the old overwrite");
    }
  }

  if (key === "race") {
    /* exercise the roll-race path: Roll + TBE.say must not throw */
    await page.locator('[data-action="roll-race"]').click();
    await shot(`${n}b-race-rolled.png`);
    const note = await page.locator(".window-content").innerText();
    check(/Rolled 1d100/.test(note), "Roll 1d100 for Race produces a roll note without throwing");
  }

  if (i < stepDefs.length - 1) {
    await page.locator('[data-action="next"]').click();
  }
  } catch (err) {
    /* A stuck-navigation or crashed-render bug can leave later locators
     * (e.g. a step-specific button that never appears because the DOM
     * never advanced) waiting for the full Playwright timeout. Record it
     * as a normal failure and stop driving the wizard instead of dying
     * with an unhandled stack trace and losing the summary/exit code. */
    fail(`step ${i + 1} (${key}) threw: ${err.message.split("\n")[0]}`);
    await shot(`${n}-ERROR-${key}.png`).catch(() => {});
    break;
  }
}

console.log("== 4. Book-fidelity / dead-input checks (see CLAUDE.md priorities 1-4) ==");

/* Priority 2, no dead input. Step 1 used to ask for a Cultural background
 * and a native language; both were unreachable or overridden at commit
 * time. Fixed by removing both fields, adding the book's actual step-1
 * "rough concept" (p.79), and giving The Replaced the Human Culture
 * picker so the language question has a real home for every race that
 * needs one. These are now hard checks, not tracked defects. */
const step1 = await page.evaluate(() => {
  const w = window.__wizard;
  if (!w) return { error: "no wizard instance on window" };
  w.step = 0; // back to Concept
  return w.render(true).then(() => {
    const root = w.element.querySelector(".window-content");
    return {
      hasCulture: !!root.querySelector('[name="culture"]'),
      hasLang: !!root.querySelector('[name="lang"]'),
      hasConcept: !!root.querySelector('[name="concept"]'),
      draftHasDeadKeys: ("culture" in w.draft) || ("lang" in w.draft)
    };
  });
});
if (step1.error) fail("step-1 probe: " + step1.error);
else {
  check(!step1.hasCulture && !step1.hasLang,
    "step 1 no longer asks for Cultural background or Native language (both were dead input)");
  check(step1.hasConcept,
    "step 1 asks for the book's rough concept (p.79), which it previously omitted entirely");
  check(!step1.draftHasDeadKeys,
    "the removed fields are gone from the draft too, no stale keys left behind");
}

/* Step-1 concept roller (ORIGINAL content, data/concepts.json). Three
 * independent d10 columns, merged skill hints for the four category-30
 * pickers on the same step. Checks the pairing is actually independent
 * and that "Use these" only ever writes valid skills into the right
 * category. */
await page.evaluate(() => { window.__wizard.step = 0; return window.__wizard.render(true); });
const hasRoller = await page.$('[data-action="roll-concept"]');
check(!!hasRoller, "step 1 offers the concept roller");
if (hasRoller) {
  await page.locator('[data-action="roll-concept"]').click();
  const first = await page.locator('[name="concept"]').inputValue();
  check(first.trim().length > 0, `"Roll a concept" fills the concept field (got "${first}")`);

  /* reroll one column only: the trouble clause should be the only part
   * that can change, proving the columns are genuinely independent */
  const seen = new Set();
  for (let i = 0; i < 12; i++) {
    await page.locator('[data-action="roll-concept-col"][data-col="trouble"]').click();
    seen.add((await page.locator('[name="concept"]').inputValue()).split(", ").slice(1).join(", "));
  }
  check(seen.size > 1, `rerolling one column varies only that column (${seen.size} distinct troubles over 12 rerolls)`);
  const headStable = await page.evaluate(() => {
    const w = window.__wizard;
    return w.draft.conceptPicks.role && w.draft.conceptPicks.streak ? "kept" : "lost";
  });
  check(headStable === "kept", "rerolling trouble leaves role and streak untouched");

  /* No "Use these" button any more: the book gives one skill per category
   * at 30 and that pick is the player's. The roller offers candidates. */
  const sugg = await page.locator(".window-content").innerText();
  check(/candidates for your/i.test(sugg),
    "the roller frames its skills as candidates for the one pick per category");
  check((await page.$('[data-action="apply-concept-skills"]')) === null,
    "there is no button that fills the category-30 pickers for you");
  const untouched = await page.evaluate(() => JSON.stringify(window.__wizard.draft.boost));
  check(!/[A-Za-z]{3}/.test(JSON.parse(untouched).Combat || ""),
    `rolling a concept does not set the category-30 pickers by itself (boost=${untouched})`);
}

/* Priority 3, player preparedness. The two allocation steps used to be
 * impossible to do without a calculator: you typed points into a box with no
 * indication whether the skill was at 20 or already at 68 and about to hit
 * the creation cap. Every box now carries its skill's running value, and the
 * per-category spend counter updates as you type. Reported directly by the
 * user after doing a real chargen; no earlier test caught it because they
 * all checked that the DOM was correct, never that it was sufficient. */
const alloc = await page.evaluate(() => {
  const w = window.__wizard;
  w.draft.raceName = "Ogre";
  w.draft.careerName = "Warrior";
  w.draft.boost = { Combat: "Might", Adventuring: "Athletics", Social: "Intimidate", Lore: "Common Lore" };
  w.draft.alloc = {}; w.draft.allocFor = null;
  /* Earlier cases in this run walked all 15 steps and rolled a race, so
   * ability/culture bonuses have accumulated on the draft. Clear the inputs
   * that feed skill values so the baseline here is deterministic. */
  w.draft.abilityPicks = [null, null];
  w.draft.abilityExpertise = [null, null];
  w.draft.cultureBgPicks = {}; w.draft.cultureBgFor = null;
  w.draft.roAlloc = {}; w.draft.roLoreAlloc = {}; w.draft.roAllocFor = null;
  w.draft.roAge = "Adult";
  w.step = 7;                                   // Career Skill Points
  const read = (sel) => { const e = w.element.querySelector(sel); return e ? e.innerText.trim() : null; };
  const out = {};
  return w.render(true).then(() => {
    out.chipsOnSkillPoints = w.element.querySelectorAll("[data-cur-skill]").length;
    out.poolBefore = read('[data-cur-pool="Combat"]');
    out.dodgeBefore = read('[data-cur-skill="Dodge"]');
    // type 45 into Might (index 4 of the Combat list) and fire the listener
    const inp = w.element.querySelectorAll('.tbe-alloc[data-cat="Combat"]')[4];
    inp.value = "45";
    inp.dispatchEvent(new Event("input", { bubbles: true }));
    out.poolAfter = read('[data-cur-pool="Combat"]');
    out.mightAfter = read('[data-cur-skill="Might"]');
    w.step = 8;                                 // Rounding Out
    return w.render(true);
  }).then(() => {
    out.chipsOnRounding = w.element.querySelectorAll("[data-cur-skill]").length;
    out.roPool = read('[data-cur-ropool="any"]');
    return out;
  });
});
check(alloc.chipsOnSkillPoints > 20,
  `Career Skill Points shows a running value beside every box (${alloc.chipsOnSkillPoints} chips)`);
check(alloc.chipsOnRounding > 20,
  `Rounding Out shows a running value beside every box (${alloc.chipsOnRounding} chips)`);
check(alloc.dodgeBefore === "20", `an untouched skill reads its real starting value (Dodge ${alloc.dodgeBefore})`);
check(/^0 \/ 80 spent/.test(alloc.poolBefore || ""), `the pool counter starts at 0 / 80 (got "${alloc.poolBefore}")`);
check(/^45 \/ 80 spent/.test(alloc.poolAfter || ""),
  `the pool counter updates live while typing, without a re-render (got "${alloc.poolAfter}")`);
check(!!alloc.roPool, `Rounding Out has a live pool counter too (got "${alloc.roPool}")`);

/* The chips surfaced a real bug the moment they existed: computeSkillValues
 * clamped career points to 70 and then added racial modifiers on top, so an
 * Ogre's +10 Might read 80. Same defect fixed in TBE: Build Character in
 * v0.9.0; the wizard's own copy had been missed. */
check(alloc.mightAfter === "70 cap",
  `the 70 creation cap holds after racial modifiers (Ogre Might, 45 spent + racial +10, reads "${alloc.mightAfter}")`);

/* The concept roller suggests candidates; it must not fill the pickers for
 * you. The book gives one skill per category at 30 and that choice is the
 * player's. */
const wizSrcUI = fs.readFileSync(path.join(__dirname, "macros/tbe-character-wizard.js"), "utf8");
check(!wizSrcUI.includes("apply-concept-skills"),
  "the concept roller has no button that fills the category-30 pickers for you");

/* Life Events are now APPLIED, not just named. parse_life_events.py extracts
 * all 151 events with their 335 real options; the step offers the rolled
 * event's own choices and commit()/computeSkillValues act on the pick. */
const life = await page.evaluate(async () => {
  const w = window.__wizard;
  w.draft.raceName = "Human"; w.draft.careerName = "Warrior";
  w.draft.abilityPicks = [null, null]; w.draft.cultureBgPicks = {}; w.draft.cultureBgFor = null;
  w.draft.alloc = {}; w.draft.allocFor = null; w.draft.roAlloc = {}; w.draft.roLoreAlloc = {};
  w.step = 5;
  await w.render(true);
  const btn = w.element.querySelector('[data-action="roll-life"][data-life-key="origin"]');
  btn.click();
  await new Promise((r) => setTimeout(r, 60));
  const ev = w.draft.lifeEvents.origin;
  if (!ev) return { error: "no event rolled" };
  const per = ev.options.map((o, i) => {
    w.draft.lifeChoice.origin = i;
    const v = w.liveValues();
    const nm = o.kind === "skill" ? o.name : (o.kind === "skill-any" ? (o.options || [])[0] : null);
    return { kind: o.kind, skill: nm, value: nm ? v[nm]?.value : null };
  });
  return {
    name: ev.name, hasDesc: !!(ev.desc && ev.desc.length > 20), optCount: ev.options.length, per,
    tableCollapsed: w.element.querySelectorAll(".window-content tr").length === 0
  };
});
if (life.error) fail("life-event probe: " + life.error);
else {
  check(life.optCount >= 2, `a rolled Life Event offers its real options (${life.name}, ${life.optCount})`);
  check(life.hasDesc, "the rolled event shows its own description, so the book is not needed");
  const applied = life.per.filter((p) => p.skill && p.value === 30);
  check(applied.length > 0,
    `choosing an option actually raises that skill (${JSON.stringify(life.per.filter((p) => p.skill))})`);
  check(life.tableCollapsed,
    "the 50-row d100 table is collapsed by default, so the roll buttons stay on screen");
}

/* Culture picks used to default to their first entry, so walking through
 * without choosing stacked every "choose" pick onto Deceive and capped it. */
const cult = await page.evaluate(async () => {
  const w = window.__wizard;
  w.draft.cultureBgPicks = {}; w.draft.cultureBgFor = null;
  w.step = 4;
  await w.render(true);
  const sels = [...w.element.querySelectorAll("[data-culture-pick]")];
  const openOnes = sels.filter((s) => [...s.options].some((o) => o.value === ""));
  return {
    total: sels.length,
    openStartEmpty: openOnes.every((s) => s.value === ""),
    openCount: openOnes.length,
    deceive: w.liveValues()["Deceive"]?.value
  };
});
check(cult.openCount > 0 && cult.openStartEmpty,
  `every "choose" culture pick starts empty rather than on its first entry (${cult.openCount} of ${cult.total})`);
check(cult.deceive === 20,
  `walking through without choosing no longer stacks bonuses onto Deceive (Deceive ${cult.deceive})`);

/* Priority 4, book values must reach the actor. Ogre Death Threshold is 22
 * (Ch.7 p.83, "Toughness 1 and a Death Threshold of 22"), and chargen.json
 * carries dt=22, but commit() used to hardcode a base of 20 and never read
 * race.dt. Checked live off the step-4 preview, which shares the same
 * expression, rather than by grepping the source. */
const dtByRace = await page.evaluate(() => {
  const w = window.__wizard;
  const read = () => {
    const t = w.element.querySelector(".window-content").innerText;
    const m = /Death Threshold\s*<?b?>?\s*(\d+)/.exec(t) || /Threshold[^0-9]{0,40}(\d+)/.exec(t);
    return m ? Number(m[1]) : null;
  };
  const out = {};
  w.step = 3;                       // Attributes, where DT is previewed
  w.draft.attrSpend = { resolve: 0, initiative: 0, toughness: 0, dt: 0 };
  w.draft.randomizedDT = false;
  w.draft.raceName = "Ogre";
  return w.render(true).then(() => {
    out.ogre = read();
    w.draft.raceName = "Human";
    return w.render(true);
  }).then(() => { out.human = read(); return out; });
});
check(dtByRace.ogre === 22, `an Ogre previews Death Threshold 22, not 20 (got ${dtByRace.ogre})`);
check(dtByRace.human === 20, `a Human still previews Death Threshold 20 (got ${dtByRace.human})`);

/* Remaining commit()-only values, checked at source because commit() needs
 * a real Actor document to run. */
const wizSrc = fs.readFileSync(path.join(__dirname, "macros/tbe-character-wizard.js"), "utf8");
const commitBody = wizSrc.slice(wizSrc.indexOf("async commit()"));
check(/dtBase = d\.randomizedDT \? TBE\.num\(d\.dtRoll, 15\) : TBE\.num\(race\?\.dt, 20\)/.test(commitBody),
  "commit() derives Death Threshold from race.dt, not a hardcoded 20");
/* Until v0.28.0 this read `career.name === "Godbound" ? 50 : 0`, which handed
   EVERY character a Piety skill at 0. TBE.godbound() treats the presence of a
   Piety skill as the answer to "is this a Godbound?", so that placeholder
   opened TBE: Miracle to every character in the world, and praying at Piety 0
   always fails and always spends Piety -- one click Cast Out a Warrior for
   good. The grant is now gated, and both halves are asserted: a Godbound gets
   50, and nobody else gets the skill at all. */
check(/if \(career\.name === "Godbound"\) payload\.push\(mk\("Lore", "Piety", 50\)\);/.test(commitBody),
  "commit() gives a Godbound Piety 50 (career pool 20 + the Godbound Talent's 30)");
check(!/"Piety", career\.name === "Godbound" \? 50 : 0/.test(commitBody),
  "and gives no one else a Piety-0 placeholder, which used to read as a Godbound");
check(/mk\("Wise", "Wise: subject " \+ \(i \+ 1\), 0\)/.test(commitBody),
  'commit() creates blank -wise slots at 0 (p.80: "leave them at zero for now")');
check(/Math\.max\(TBE\.num\(this\.actor\.system\?\.status, 0\)/.test(commitBody),
  "commit() never lowers a Status the character already earned");
check(/\.concat\(d\.abilityDescriptor\.filter\(Boolean\)\)/.test(commitBody),
  "Ability Score descriptors reach the real personalityTraits list (Ch.8), not just Notes prose");

/* Talent catalogue, fixed in parse_talents.py and re-verified there. */
const talents = JSON.parse(fs.readFileSync(path.join(__dirname, "data/talents.json"), "utf8"));
/* 150, not 149. The catalogue grew in v0.29.0 because a Talent that had never
 * been in it was recovered: "...BUT IT IS NOT THIS DAY!" opens with punctuation
 * ("\u201c\u2026BUT"), the header pattern required a capital letter as the very first
 * character, so it was never seen as a heading and its whole entry sat inside
 * the description of Anti-Venom Blood above it. If this assertion ever wants to
 * go back down to 149, the parser has lost it again -- see audit_check.mjs. */
check(talents.length === 150, `Talent catalogue holds all 150 entries (got ${talents.length})`);
for (const n of ["Run For Your Life", "Allow Me To Introduce"]) {
  check(talents.some((t) => t.name.toLowerCase().startsWith(n.toLowerCase())),
    `catalogue contains "${n}", previously dropped by the header regex`);
}
const stillOnce = ["Armor Training", "Enhanced Defense", "Shield Beat", "Inner Strength", "Unkillable", "Tough"]
  .filter((n) => (talents.find((t) => t.name.toLowerCase().startsWith(n.toLowerCase())) || {}).rank === "once");
check(stillOnce.length === 0,
  `every Talent the book calls repeatable is repeatable (${stillOnce.join(", ") || "all correct"})`);

/* ---- Weave Magic (v0.15.0) --------------------------------------------
 * Chargen used to hand a Spellweaver a "Bind: name it 1" skill at 0 and a
 * single "Strand, name it" -- a whole character type the system could not
 * build. These checks drive the real Magic step in the real DOM. */
console.log("-- Weave Magic step: the Spellweaver and Fade paths --");

const magicWalk = await page.evaluate(async () => {
  const w = window.__wizard;
  const out = {};
  const root = () => w.element.querySelector(".window-content");
  const go = async (key) => {
    const idx = w.steps().findIndex((s) => s.key === key);
    w.step = idx;
    await w.render(true);
    return idx;
  };

  // A non-caster must not see the step at all.
  w.draft.careerName = "Warrior";
  w.draft.takeFade = false;
  await w.render(true);
  out.noStepForWarrior = w.steps().every((s) => s.key !== "magic");

  // The Spellweaver career turns it on.
  w.draft.careerName = "Spellweaver";
  await w.render(true);
  out.stepForSpellweaver = w.steps().some((s) => s.key === "magic");
  out.stepIndex = await go("magic");
  out.hasConvocationPicker = !!root().querySelector('[name="convocation"]');
  out.bindCheckboxes = root().querySelectorAll("[data-sw-bind]").length;
  out.strandCheckboxes = root().querySelectorAll("[data-sw-strand]").length;

  // Applying a Convocation must fill the picks, not merely name one.
  w.draft.convocation = "Druid";
  await w.render(true);
  const applyBtn = root().querySelector('[data-action="apply-convocation"]');
  out.hasApplyButton = !!applyBtn;
  if (applyBtn) applyBtn.click();
  await w.render(true);
  out.afterApply = {
    binds: w.draft.swBinds.slice(), strands: w.draft.swStrands.slice(), thin: w.draft.swThin.slice()
  };

  // The chosen Binds carry the book's +10 before a single pool point is spent.
  const chipFor = (attr, name) => {
    const el = root().querySelector("[data-cur-" + attr + '="' + name + '"]');
    return el ? el.textContent.trim() : null;
  };
  out.changeChipBeforeSpend = chipFor("magic-bind", "Change");
  out.witnessChipBeforeSpend = chipFor("magic-bind", "Witness");

  // Type into the pool and confirm the live chip and the pool counter move.
  const input = root().querySelector('[data-magic-bind="Change"]');
  input.value = "30";
  input.dispatchEvent(new Event("input", { bubbles: true }));
  out.changeChipAfterSpend = chipFor("magic-bind", "Change");
  const poolEl = root().querySelector("[data-cur-magicpool]");
  out.poolChip = poolEl ? poolEl.textContent.trim() : null;

  // The creation cap must bite on the live chip, not only at commit.
  input.value = "200";
  input.dispatchEvent(new Event("input", { bubbles: true }));
  out.changeChipOverCap = chipFor("magic-bind", "Change");
  input.value = "30";
  input.dispatchEvent(new Event("input", { bubbles: true }));

  // Strand levels: the four chosen Strands each get a box, Thin ones are
  // excluded from the three extra levels.
  await w.render(true);
  out.strandAllocBoxes = Array.from(root().querySelectorAll("[data-strand-alloc]")).map((e) => e.dataset.strandAlloc);
  out.extraBoxes = Array.from(root().querySelectorAll("[data-strand-extra]")).map((e) => e.dataset.strandExtra);

  // Spread-what-is-left must stop at the cap and never overwrite a choice.
  root().querySelector('[data-action="spread-magic"]').click();
  await w.render(true);
  out.afterSpread = Object.assign({}, w.draft.magicAlloc);
  const mAfter = (() => { const el = root().querySelector('[data-cur-magic-bind="Change"]'); return el ? el.textContent.trim() : null; })();
  out.changeAfterSpread = mAfter;

  // Rounding Out must offer Binds and Strands to a caster.
  await go("rounding");
  out.roundingHasBind = !!root().querySelector("[data-ro-bind]");
  out.roundingHasStrand = !!root().querySelector("[data-ro-strand]");
  const roStrand = root().querySelector('[data-ro-strand="Fire"]');
  roStrand.value = "2";
  roStrand.dispatchEvent(new Event("input", { bubbles: true }));
  const roPool = root().querySelector('[data-cur-ropool="any"]');
  out.roPoolAfterStrand = roPool ? roPool.textContent.trim() : null;
  roStrand.value = "0";
  roStrand.dispatchEvent(new Event("input", { bubbles: true }));

  // The Fade path.
  w.draft.careerName = "Warrior";
  w.draft.takeFade = true;
  await w.render(true);
  out.fadeStepAppears = w.steps().some((s) => s.key === "magic");
  await go("magic");
  out.fadeBoxes = root().querySelectorAll("[data-fade-strand]").length;
  out.fadeMentionsCap = /never pass 70|capped at 7/i.test(root().textContent);
  out.fadeHasNoConvocation = !root().querySelector('[name="convocation"]');

  // The Career step is where a Fade is declared, so the box has to be there.
  await go("career");
  out.careerHasFadeBox = !!root().querySelector('[name="takeFade"]');

  return out;
});

check(magicWalk.noStepForWarrior, "a non-caster never sees the Magic step");
check(magicWalk.stepForSpellweaver, "choosing the Spellweaver career adds the Magic step");
check(magicWalk.hasConvocationPicker, "the Magic step offers the book's Convocation table");
check(magicWalk.bindCheckboxes === 5, `all five Binds are offered (got ${magicWalk.bindCheckboxes})`);
check(magicWalk.strandCheckboxes === 10, `all ten Strands are offered (got ${magicWalk.strandCheckboxes})`);
check(magicWalk.hasApplyButton, "a chosen Convocation can be applied, not just displayed");
check(JSON.stringify(magicWalk.afterApply.binds) === '["Change","Control"]',
  `applying Druid fills its two Binds (got ${JSON.stringify(magicWalk.afterApply.binds)})`);
check(JSON.stringify(magicWalk.afterApply.strands) === '["Beast","Earth","Plant","Water"]',
  `applying Druid fills its four Strands (got ${JSON.stringify(magicWalk.afterApply.strands)})`);
check(JSON.stringify(magicWalk.afterApply.thin) === '["Spheres","Spirit"]',
  `applying Druid fills its two Thin Strands (got ${JSON.stringify(magicWalk.afterApply.thin)})`);
check(magicWalk.changeChipBeforeSpend === "10",
  `a chosen Bind already reads its +10 before any pool spend (got ${magicWalk.changeChipBeforeSpend})`);
check(magicWalk.witnessChipBeforeSpend === "0",
  `an unchosen Bind still reads 0 (got ${magicWalk.witnessChipBeforeSpend})`);
check(magicWalk.changeChipAfterSpend === "40",
  `spending 30 on Change reads 40 live, +10 included (got ${magicWalk.changeChipAfterSpend})`);
check(/30 \/ 100 spent/.test(magicWalk.poolChip || ""),
  `the Magic pool counter tracks what is spent (got "${magicWalk.poolChip}")`);
check(magicWalk.changeChipOverCap === "70 cap",
  `the 70 creation cap shows live on the Magic step (got ${magicWalk.changeChipOverCap})`);
check(JSON.stringify(magicWalk.strandAllocBoxes) === '["Beast","Earth","Plant","Water"]',
  `the ten Strand levels can only go to the four chosen Strands (got ${JSON.stringify(magicWalk.strandAllocBoxes)})`);
check(!magicWalk.extraBoxes.includes("Spheres") && !magicWalk.extraBoxes.includes("Spirit"),
  `the three extra levels exclude the Thin Strands (offered: ${JSON.stringify(magicWalk.extraBoxes)})`);
check(magicWalk.afterSpread.Change === 30,
  `spreading the Magic pool leaves a deliberate entry alone (Change ${magicWalk.afterSpread.Change})`);
check(magicWalk.afterSpread.Control === 60,
  `spreading fills the untouched Bind up to its 70 ceiling, +10 included (Control ${magicWalk.afterSpread.Control})`);
check(magicWalk.changeAfterSpread === "70 cap" || Number(magicWalk.changeAfterSpread) <= 70,
  `spreading never pushes a Bind past 70 (Change now ${magicWalk.changeAfterSpread})`);
check(magicWalk.roundingHasBind && magicWalk.roundingHasStrand,
  "Rounding Out lets a caster spend bonus points on Binds and Strands (p.108)");
check(/10 \/ 100 spent/.test(magicWalk.roPoolAfterStrand || ""),
  `two Strand levels cost ten Rounding Out points, not two (got "${magicWalk.roPoolAfterStrand}")`);
check(magicWalk.fadeStepAppears, "ticking Faded Pattern gives a non-Spellweaver the Magic step");
check(magicWalk.fadeBoxes === 10, `a Fade may put its 5 levels in any Strand (got ${magicWalk.fadeBoxes} boxes)`);
check(magicWalk.fadeMentionsCap, "the Fade step states the ceilings the Talent imposes");
check(magicWalk.fadeHasNoConvocation, "a Fade is not offered a Convocation, which is a Spellweaver template");
check(magicWalk.careerHasFadeBox, "the Career step is where Faded Pattern is declared, since it costs Talent slots");

/* Ch.5: an Ogre "may never become any type of Spellweaver or Fade", and The
 * Replaced "can never be Spellweavers or Fades". Both were prose in the race
 * entry with nothing enforcing them, so the new Magic step had to learn it. */
const barred = await page.evaluate(async () => {
  const w = window.__wizard;
  const out = {};
  for (const race of ["Ogre", "The Replaced"]) {
    w.draft.raceName = race;
    w.draft.careerName = "Spellweaver";
    w.draft.takeFade = true;
    await w.render(true);
    out[race] = { caster: w.isCaster(), pattern: w.pattern() };
  }
  w.draft.raceName = "Ogre"; w.draft.careerName = "Warrior"; w.draft.takeFade = false;
  w.step = w.steps().findIndex((s) => s.key === "career");
  await w.render(true);
  out.careerText = w.element.querySelector(".window-content").textContent;
  out.ogreHasFadeBox = !!w.element.querySelector('[name="takeFade"]');
  w.draft.raceName = "Human";
  await w.render(true);
  return out;
});
for (const race of ["Ogre", "The Replaced"]) {
  check(barred[race].caster === false && barred[race].pattern === "none",
    `a ${race} can never become a Spellweaver or Fade, even with the career and the Talent ticked`, barred[race]);
}
check(!barred.ogreHasFadeBox, "an Ogre is not even offered the Faded Pattern tickbox");
check(/never become any kind of Spellweaver or Fade/.test(barred.careerText),
  "and the Career step says so where the choice is made");

/* The concept table is original content and was asked to be expandable; a
 * roller you cannot add to is one you stop using after the tenth character. */
const conceptEditor = await page.evaluate(async () => {
  const w = window.__wizard;
  w.step = 0;
  w.draft.conceptEditorOpen = true;
  await w.render(true);
  const root = () => w.element.querySelector(".window-content");
  const out = { hasEditor: !!root().querySelector('[name="conceptNewText"]') };
  root().querySelector('[name="conceptNewCol"]').value = "role";
  root().querySelector('[name="conceptNewText"]').value = "fallen inquisitor";
  root().querySelector('[name="conceptNewSkills"]').value = "Insight, Intimidate, Nonsense Skill";
  root().querySelector('[data-action="add-concept"]').click();
  await new Promise((r) => setTimeout(r, 60));
  await w.render(true);
  out.stored = window.game.settings.get("the-broken-empires", "customConcepts");
  out.listed = root().textContent.includes("fallen inquisitor");
  return out;
});
check(conceptEditor.hasEditor, "step 1 offers an editor for the concept table");
check(conceptEditor.stored && conceptEditor.stored.roles.length === 1,
  "a new row is stored in the world, not in the shipped data file", conceptEditor.stored);
check(conceptEditor.stored && JSON.stringify(conceptEditor.stored.roles[0].skills) === '{"Social":["Insight","Intimidate"]}',
  "its skill hints are kept only for names that are real skills", conceptEditor.stored?.roles?.[0]);
check(conceptEditor.listed, "and the row shows in the editor so it can be removed again");

const conceptRollable = await page.evaluate(async () => {
  /* The roller must include the added row on the very next roll, and roll the
     column's real length rather than a hardcoded d10. */
  const w = window.__wizard;
  /* Roll until the custom row comes up. 40 rolls were enough for a 10-row
     column; since v0.51.0 the column has 60 rows plus this one, so a fixed
     count turned into a coin toss. The harness die is seeded, so this is
     still deterministic; the cap only stops a broken roller looping. */
  const lens = [];
  for (let i = 0; i < 600 && !lens.includes("fallen inquisitor"); i++) {
    w.element.querySelector('[data-action="roll-concept-col"][data-col="role"]').click();
    await new Promise((r) => setTimeout(r, 4));
    const pick = w.draft.conceptPicks.role;
    if (pick) lens.push(pick.text);
  }
  return { sawCustom: lens.includes("fallen inquisitor"), distinct: new Set(lens).size };
});
check(conceptRollable.sawCustom,
  "and the added row actually comes up when the column is rolled", conceptRollable);

/* Screenshot the finished Spellweaver step, since this is the one place the
 * whole point is "can a player read this and decide". */
await page.evaluate(async () => {
  const w = window.__wizard;
  w.draft.careerName = "Spellweaver";
  w.draft.takeFade = false;
  w.draft.trueName = "Varimaxx Cusoris";
  w.draft.bindExpertise = "Control";
  w.draft.threadAttunement = "Strand:Beast";
  w.draft.threadName = "a wolf's tooth";
  w.draft.strandAlloc = { Beast: 4, Earth: 1, Plant: 3, Water: 2 };
  w.draft.strandExtra = { Body: 2, Thought: 1 };
  w.step = w.steps().findIndex((s) => s.key === "magic");
  await w.render(true);
});
await shot("13-magic-spellweaver.png");
await page.evaluate(async () => {
  const w = window.__wizard;
  w.step = w.steps().findIndex((s) => s.key === "review");
  await w.render(true);
});
await shot("14-magic-review.png");


check(/for \(const n of BINDS\) \{\s*payload\.push\(mk\("Bind", "Bind: " \+ n/.test(commitBody),
  'commit() creates the five real Binds, not "Bind: name it 1" placeholders');
check(!/mk\("Bind", "Strand, name it", 0\)/.test(commitBody),
  'commit() no longer creates the dead "Strand, name it" skill');
check(/type: "strand"/.test(commitBody),
  "commit() creates real Strand Items with a level");
check(/type: "thread"/.test(commitBody),
  "commit() creates the Spellweaver's starting d8 Thread Die as a real Item");
check(/"system\.pattern"\] = magicOut\.pattern/.test(commitBody),
  "commit() records the Pattern, which is what sets the Strand and Bind ceilings");

/* v0.13.0 made stat Talents apply through transfer:true ActiveEffects, but
 * only TBE: Talents copied them onto the Item it created. The wizard grants
 * Patterned in the Weave from the Spellweaver career text, and dropped the
 * effect -- so the +5 Max Resolve that is the denominator of every Fraying
 * number in Ch.14 never reached a wizard-built Spellweaver. */
const wizTalents = JSON.parse(fs.readFileSync(path.join(__dirname, "data/talent_docs.json"), "utf8")).items;
const pitw = wizTalents.find((t) => /^patterned in the weave$/i.test(t.name));
check(pitw && (pitw.effects || []).some((e) => (e.changes || []).some((c) => c.key === "system.resolve.max" && String(c.value) === "5")),
  "Patterned in the Weave carries its +5 Max Resolve as a real ActiveEffect", pitw && pitw.effects);
/* The Item shape (effects included) moved to _lib.js in v0.20.0, so that TBE:
 * Talents, the wizard, and NPC/funnel generation cannot build a Talent three
 * different ways. The guard is the same guard: whatever creates the Item must
 * carry the ActiveEffects, so assert the wizard delegates AND that the owner
 * copies them. */
check(/TBE\.talentItem\(rec, ""\)/.test(wizSrc),
  "the wizard builds granted Talents through the shared TBE.talentItem()");
const libSrcTalent = fs.readFileSync(path.join(__dirname, "macros/_lib.js"), "utf8");
check(/effects: \(t\.effects \|\| \[\]\)/.test(libSrcTalent),
  "and TBE.talentItem() copies a Talent's effects onto the Item it creates");
check(/const resolveMax = 10 \+ 2 \* TBE\.num\(s\.resolve, 0\);/.test(commitBody),
  "commit() writes the BASE Max Resolve, leaving the Talent's effect to add on top");
const builtWizard = JSON.parse(fs.readFileSync(path.join(__dirname, "data/solo_docs.json"), "utf8"))
  .macros.find((m) => m.name === "TBE: Character Wizard").command;
check(/"name":"Patterned In The Weave"[\s\S]{0,400}?"key":"system\.resolve\.max"/.test(builtWizard),
  "and the built macro actually carries that effect in its baked Talent catalogue");

/* Launcher discoverability. */
const panel = fs.readFileSync(path.join(__dirname, "macros/tbe-solo-panel.js"), "utf8");
check(panel.includes('"TBE: Character Wizard"'),
  "the Solo Panel lists the Character Wizard (it previously offered only Build Character)");

console.log("== 4b. A draft survives closing the window (v0.49.0, SEQUENTIAL) ==");
{
  /* Fill part of a character, close the window, run the macro again: it must
     offer to resume and put the draft back on the same page. Then close and
     choose Start over: the draft must be gone. The memory owner is the real
     module, loaded into the page; a user whose setFlag MERGES stands in for
     Foundry's. */
  const memSrc = fs.readFileSync(path.join(__dirname, "system/the-broken-empires/module/helpers/memory.mjs"), "utf8")
    .replace(/export /g, "");
  await page.addScriptTag({ content: `
    (function () {
      ${memSrc}
      const merge = (a, b) => (b && typeof b === "object" && !Array.isArray(b))
        ? Object.keys(b).reduce((o, k) => { o[k] = merge(o[k], b[k]); return o; }, Object.assign({}, a || {})) : b;
      const flags = {};
      window.game.user.getFlag = (sc, k) => flags[sc] && flags[sc][k];
      window.game.user.setFlag = async (sc, k, v) => { flags[sc] = flags[sc] || {}; flags[sc][k] = merge(flags[sc][k], v); };
      window.game.thebrokenempires = Object.assign(window.game.thebrokenempires || {},
        { memory: { recall, remember, forget } });
      window.__prompts = [];
      window.__answer = { start: "resume" };
      window.foundry.applications = { api: { DialogV2: { prompt: async (o) => {
        window.__prompts.push(o.window.title); return window.__answer; } } } };
    })();` });
  const rerun = async () => {
    await page.addScriptTag({ content: "(async () => {\n" + macro.command + "\n})().catch((e) => setTimeout(() => { throw e; }));" });
    await page.waitForTimeout(400);
  };
  const before = await page.evaluate(async () => {
    const w = window.__wizard;
    w.draft.concept = "Resume test: a salt smuggler";
    w.step = 3;
    await w.render(true);
    const key = w.steps()[w.step].key;
    await w.close();
    return { key, open: !!document.querySelector(".window-app") };
  });
  check(!before.open, "the wizard window closed");
  await rerun();
  const after = await page.evaluate(() => ({
    prompts: window.__prompts.slice(),
    concept: window.__wizard && window.__wizard.draft.concept,
    key: window.__wizard && window.__wizard.steps()[window.__wizard.step].key,
    open: !!document.querySelector(".window-app")
  }));
  check(after.prompts.includes("TBE: Character Wizard"), "reopening asks whether to resume", after.prompts);
  check(after.open && after.concept === "Resume test: a salt smuggler", "Resume brings the typed concept back", after.concept);
  check(after.key === before.key, "and opens on the page that was left (" + before.key + ")", after.key);

  const fresh = await page.evaluate(async () => {
    await window.__wizard.close();
    window.__answer = { start: "fresh" };
    window.__prompts = [];
    return true;
  });
  await rerun();
  const afterFresh = await page.evaluate(() => ({
    concept: window.__wizard && window.__wizard.draft.concept,
    step: window.__wizard && window.__wizard.step,
    prompts: window.__prompts.slice()
  }));
  check(fresh && afterFresh.concept === "" && afterFresh.step === 0, "Start over opens a blank draft on page one", afterFresh);
  await page.evaluate(async () => { window.__wizard.draft.concept = ""; await window.__wizard.close(); window.__prompts = []; });
  await rerun();
  const noAsk = await page.evaluate(() => window.__prompts.slice());
  check(!noAsk.includes("TBE: Character Wizard"), "a draft nobody touched is not offered back: nothing to resume, nothing to ask", noAsk);
}

console.log("== 5. Console/page errors captured during the run ==");
if (consoleErrors.length) {
  for (const e of consoleErrors) fail("console/page error: " + e);
} else {
  check(true, "zero console errors or uncaught page errors across every step");
}

await browser.close();

console.log("\n" + (failures ? `${failures} FAILURE(S)` : "ALL REGRESSION CHECKS PASSED") + (stillBroken ? `, ${stillBroken} tracked defect(s) still open (see BACKLOG.md)` : "") + `. Screenshots: ${OUT_DIR}`);
process.exit(failures ? 1 : 0);
