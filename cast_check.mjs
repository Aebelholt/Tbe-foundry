/* cast_check.mjs — drives the real TBE: Cast window in headless Chromium.
 *
 * TBE: Cast is now a calculator, so the failure mode that matters is a Total
 * Cost that is off by one row, a Mastery that quietly ignores a Thread, or a
 * Weave Reaction row that fires when the book says it cannot. Every expected
 * value below is hand-computed from Ch.14, including the book's own worked
 * example (Fionnah's 17 TC bolt, p.290), so a wrong table fails here.
 *
 * Run: node cast_check.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "test-screenshots/cast");
fs.mkdirSync(OUT, { recursive: true });

let fails = 0;
const check = (ok, msg, extra) => {
  if (ok) console.log("  ok: " + msg);
  else { fails++; console.error("FAIL: " + msg + (extra !== undefined ? " | " + JSON.stringify(extra) : "")); }
};

const solo = JSON.parse(fs.readFileSync(path.join(__dirname, "data/solo_docs.json"), "utf8"));
const macro = solo.macros.find((m) => m.name === "TBE: Cast");
if (!macro) { console.error("TBE: Cast not found in data/solo_docs.json"); process.exit(1); }

/* The shim. `__d100` and `__dice` are settable from the test so a specific
 * Bind roll, ones die and Thread Die can be forced -- the point is to check
 * arithmetic, not randomness. */
const SHIM = `
(function () {
  window.foundry = { utils: {
    mergeObject: (a, b) => Object.assign({}, a, b),
    duplicate: (o) => JSON.parse(JSON.stringify(o))
  } };
  window.$ = (html) => {
    if (typeof html === "string") { const d = document.createElement("div"); d.innerHTML = html.trim(); return [d.firstElementChild]; }
    return [html];
  };
  class Application {
    constructor(options) { this.options = Object.assign({}, this.constructor.defaultOptions, options || {}); this.rendered = false; this.element = null; }
    static get defaultOptions() { return { width: 400, height: 400, id: "", title: "", classes: [] }; }
    activateListeners() {}
    async getData() { return {}; }
    async render() {
      if (!this.rendered) {
        const win = document.createElement("div");
        win.className = "window-app";
        win.innerHTML = '<header class="window-header"><h4 class="window-title"></h4></header><section class="window-content"></section>';
        win.querySelector(".window-title").textContent = this.options.title || "";
        document.body.appendChild(win); this.element = win; this.rendered = true;
      }
      const inner = await this._renderInner(await this.getData());
      const el = Array.isArray(inner) ? inner[0] : inner;
      const content = this.element.querySelector(".window-content");
      content.innerHTML = ""; content.appendChild(el);
      this.activateListeners([el]);
      window.__cast = this;
      return this;
    }
    close() { window.__closed = true; }
  }
  window.Application = Application;

  window.__d100 = 42;          // the Bind roll
  window.__dice = {};          // formula -> forced total
  window.__rolled = [];
  class Roll {
    constructor(f) { this.formula = f; }
    async evaluate() {
      window.__rolled.push(this.formula);
      if (window.__dice[this.formula] !== undefined) { this.total = window.__dice[this.formula]; return this; }
      if (/d100/.test(this.formula)) { this.total = window.__d100; return this; }
      const m = /(\\d*)d(\\d+)([+-]\\d+)?/.exec(this.formula);
      if (!m) { this.total = 0; return this; }
      this.total = Number(m[1] || 1) * 1 + Number(m[3] || 0);   // deterministic: every die shows 1
      return this;
    }
  }
  window.Roll = Roll;
  window.__chat = [];
  window.ChatMessage = { create: async (d) => { window.__chat.push(d.content); return d; }, getSpeaker: () => ({}) };
  window.CONFIG = { sounds: { dice: null }, statusEffects: [] };
  window.__notify = [];
  window.ui = { notifications: {
    warn: (m) => window.__notify.push("warn:" + m),
    error: (m) => window.__notify.push("error:" + m),
    info: (m) => window.__notify.push("info:" + m)
  } };
  window.__updates = [];
  const mkItem = (o) => Object.assign({}, o, {
    update: async (u) => { window.__updates.push([o.name, u]);
      for (const [k, v] of Object.entries(u)) { const key = k.replace("system.", ""); o.system[key] = v; } return u; }
  });
  window.__mkActor = (spec) => {
    const a = {
      id: "a", name: "Fionnah", type: "character",
      system: Object.assign({ resolve: { value: 20, max: 23 }, fraying: 0, fatigue: 0, pattern: "spellweaver",
        supply: { gear: 12, ammo: 12, medical: 12, rations: 12 } }, spec.system || {}),
      items: (spec.items || []).map(mkItem),
      statuses: new Set(),
      update: async (u) => { window.__updates.push(["actor", u]);
        for (const [k, v] of Object.entries(u)) {
          const parts = k.split(".").slice(1); let t = a.system;
          while (parts.length > 1) t = t[parts.shift()];
          t[parts[0]] = v;
        } return u; },
      createEmbeddedDocuments: async (t, p) => p,
      updateEmbeddedDocuments: async () => [],
      deleteEmbeddedDocuments: async () => [],
      toggleStatusEffect: async () => true
    };
    return a;
  };
  window.game = { user: { character: null }, macros: { getName: () => null },
    packs: { get: () => null }, settings: { get: () => null, set: async () => null } };
  window.canvas = { tokens: { controlled: [] } };
})();
`;

const HTML = `<!doctype html><html><head><meta charset="utf-8"><title>TBE Cast check</title>
<style>
  html, body { margin: 0; background: #2b2b2b; }
  .window-app { width: 660px; margin: 14px auto; background: #f2e9d5; border: 1px solid #7a6a4f; border-radius: 6px; font-family: Signika, sans-serif; }
  .window-header { background: #7a6a4f; color: #fff; padding: 6px 10px; }
  .window-header h4 { margin: 0; font-size: 14px; }
  .window-content { padding: 8px 10px; }
  form { color: #2b2318; }
</style></head><body>
<script>${SHIM}</script>
<script id="setup"></script>
<script id="macro"></script>
</body></html>`;
const htmlPath = path.join(OUT, "_harness.html");
fs.writeFileSync(htmlPath, HTML);

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 720, height: 1100 } });
const errs = [];
page.on("pageerror", (e) => errs.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text()); });
await page.goto("file://" + htmlPath);

/* Fionnah as the book describes her on p.290: Conjure 65, Spheres 5. */
const FIONNAH = {
  items: [
    { id: "b1", name: "Bind: Conjure", type: "skill", system: { group: "Bind", value: 65, expertise: 0 } },
    { id: "b2", name: "Bind: Control", type: "skill", system: { group: "Bind", value: 50, expertise: 2 } },
    { id: "s1", name: "Spheres", type: "strand", system: { level: 5, thin: false } },
    { id: "s2", name: "Body", type: "strand", system: { level: 2, thin: false } }
  ]
};

async function boot(spec, d100 = 42) {
  await page.evaluate(({ spec, d100, src }) => {
    document.querySelectorAll(".window-app").forEach((e) => e.remove());
    window.__chat = []; window.__updates = []; window.__notify = []; window.__rolled = []; window.__dice = {};
    window.__d100 = d100;
    const actor = window.__mkActor(spec);
    window.game.user.character = actor;
    window.canvas.tokens.controlled = [{ actor }];
    const s = document.createElement("script");
    s.textContent = "(async()=>{try{" + src + "}catch(e){window.__err=String(e&&e.message||e);}})();";
    document.body.appendChild(s);
  }, { spec, d100, src: macro.command });
  await page.waitForFunction(() => !!window.__cast || window.__err, null, { timeout: 5000 });
  const err = await page.evaluate(() => window.__err || null);
  if (err) throw new Error("macro threw: " + err);
}

const setShape = (patch) => page.evaluate(async (patch) => {
  Object.assign(window.__cast.state, patch);
  await window.__cast.render(true);
  return window.__cast.tc();
}, patch);

console.log("== 1. The shaping calculator ==");
await boot(FIONNAH);
check(errs.length === 0, "the window opens with no page errors", errs);

/* p.290, the book's own worked example: "Fionnah casts magical blue bolts
 * (Conjure 65, Spheres 5) at a raider in her zone. This is an External Attack
 * spell. The Magnitude is Vulgar (10), the Duration is Instant (0 TC), the
 * Range is Close (2 TC), the Target is One Individual (2 TC), the Damage is 7
 * (3 TC), for a total cost of 17 TC." Damage 7 against a Strand of 5 is the
 * base (1 TC) plus 2 extra points (2 TC) = 3 TC, exactly as the book totals. */
const worked = await page.evaluate(async () => {
  const c = window.__cast;
  const s = c.state;
  const idx = (list, name) => list.findIndex((r) => r.name === name);
  const SH = window.__cast.constructor;
  s.bindId = "b1"; s.strandId = "s1";
  s.magnitude = 3;          // Vulgar
  s.duration = 0;           // Instant
  s.range = 2;              // Close/Short
  s.target = 1;             // 1 individual
  s.armorTc = 0;
  s.picked = [
    { group: "Attack: External damage", label: "Damage equal to your Strand value", tc: 1, count: 1, fraying: 0 },
    { group: "Attack: External damage", label: "Each extra point of damage above your Strand value", tc: 1, count: 2, fraying: 0 }
  ];
  await c.render(true);
  return { tc: c.tc(), text: c.element.querySelector(".window-content").textContent };
});
check(worked.tc.total === 17,
  "the book's worked example totals 17 TC (Vulgar 10 + Instant 0 + Close 2 + 1 individual 2 + damage 3)", worked.tc.total);
check(/Total Cost\s*17 TC/.test(worked.text.replace(/\s+/g, " ")),
  "and the window prints that total rather than making the player add it up");
check(/Mastery will be 6.15/.test(worked.text.replace(/\s+/g, " ")),
  "Mastery is previewed as Strand 5 + the ones die, so 6-15, before any roll",
  (worked.text.replace(/\s+/g, " ").match(/Mastery will be [^(]*/) || [""])[0]);
check(/You need 12 or better on the ones die/.test(worked.text) === false,
  "a cost above Strand + 10 is not reported as a needed ones die");
check(/leaves you 2 short/.test(worked.text.replace(/\s+/g, " ")),
  "17 TC against a best-case Mastery of 15 is reported as 2 short, exactly the book's example");
await page.screenshot({ path: path.join(OUT, "01-shape.png"), fullPage: true });

/* Every Shaping row must be priced from the verified table, not guessed. */
const shapeTotals = await page.evaluate(async () => {
  const c = window.__cast;
  const out = {};
  const base = { magnitude: 0, target: 0, range: 0, duration: 0, picked: [], armorTc: 0,
    extraIndividuals: 0, chooseLocation: 0, exemptIndividuals: 0, ignoreShield: 0, ignoreArmor: 0, trigger: 0 };
  const run = async (patch) => { Object.assign(c.state, base, patch); await c.render(true); return c.tc().total; };
  out.free = await run({});
  out.vulgar = await run({ magnitude: 3 });
  out.threeZones = await run({ target: 4 });
  out.arcaneTether = await run({ range: 6 });
  out.permanent = await run({ duration: 10 });
  out.twoExtraTargets = await run({ target: 1, extraIndividuals: 2 });
  out.chooseLoc = await run({ chooseLocation: 3 });
  out.ignoreArmor = await run({ ignoreArmor: 2 });
  out.armor = await run({ armorTc: 5 });
  out.permanentFray = (Object.assign(c.state, base, { duration: 10 }), await c.render(true), c.tc().frayFormulas);
  return out;
});
check(shapeTotals.free === 0, "Self / Instant / Self / Discreet costs nothing", shapeTotals.free);
check(shapeTotals.vulgar === 10, "Vulgar Magnitude is +10 TC", shapeTotals.vulgar);
check(shapeTotals.threeZones === 7, "three zones cost 7 TC", shapeTotals.threeZones);
check(shapeTotals.arcaneTether === 6, "Arcane Tether Range costs 6 TC", shapeTotals.arcaneTether);
check(shapeTotals.permanent === 10, "a Permanent Duration costs 10 TC", shapeTotals.permanent);
check(shapeTotals.twoExtraTargets === 6, "1 individual + 2 more is 2 + 2 + 2 = 6 TC", shapeTotals.twoExtraTargets);
check(shapeTotals.chooseLoc === 6, "choosing the location on 3 targets is 2 each", shapeTotals.chooseLoc);
check(shapeTotals.ignoreArmor === 2, "ignoring 6 armor AP costs 1 TC per 3 points", shapeTotals.ignoreArmor);
check(shapeTotals.armor === 5, "worn armor's Initiative penalty is added to the TC (p.282)", shapeTotals.armor);
check(shapeTotals.permanentFray.join(" ").includes("2d6"),
  "a Permanent Duration is flagged as accruing 2d6 Fraying before any Reaction", shapeTotals.permanentFray);

/* The armor penalty must be READ off the sheet, not asked for. */
await boot({ items: FIONNAH.items.concat([
  { id: "ar", name: "Mail", type: "armor", system: { bulk: 7, equipped: true } }
]) });
const armorRead = await page.evaluate(() => ({ tc: window.__cast.state.armorTc, bulk: window.__cast.state.armorBulk }));
check(armorRead.tc === 3 && armorRead.bulk === 7,
  "the window reads worn armor's Bulk 7 as an Initiative penalty of 3 and prices it, unprompted", armorRead);

console.log("== 2. The Law of Limitation (requisites) ==");
await boot(FIONNAH);
const req = await setShape({ strandId: "s1", requisiteId: "s2" });
const reqUsed = await page.evaluate(() => window.__cast.effectiveStrand().name);
check(reqUsed === "Body", "a requisite makes the LOWER of the two Strands cover the cost (p.276)", reqUsed);
const reqText = await page.evaluate(() => window.__cast.element.querySelector(".window-content").textContent);
check(/use the lower value/.test(reqText), "and the window says so where the choice is made");

console.log("== 3. Casting: Mastery, control, and the Weave Reaction ==");
/* Bind roll 42 succeeds against Conjure 65. Ones die 2, Strand 5 -> Mastery 7
 * against 17 TC = 10 short, which is the book's own conclusion for this
 * example ("Fionnah will be 11 TC short" there, because she paid 1 more TC
 * after the roll to ignore armor; before that surcharge it is 10). */
await boot(FIONNAH, 42);
await page.evaluate(async () => {
  const c = window.__cast;
  Object.assign(c.state, { bindId: "b1", strandId: "s1", magnitude: 3, duration: 0, range: 2, target: 1, armorTc: 0,
    picked: [{ group: "Attack", label: "Damage 7", tc: 3, count: 1, fraying: 0 }] });
  await c.rollBind();
});
const afterRoll = await page.evaluate(() => ({
  ones: window.__cast.state.ones,
  success: window.__cast.state.res.success,
  text: window.__cast.element.querySelector(".window-content").textContent.replace(/\s+/g, " ")
}));
check(afterRoll.ones === 2, "a roll of 42 gives a ones die of 2", afterRoll.ones);
check(afterRoll.success, "42 succeeds against Conjure 65");
check(/Mastery 7 against TC 17/.test(afterRoll.text),
  "Mastery is ones die 2 + Strand 5 = 7 against the shaped 17 TC", afterRoll.text.slice(0, 200));
check(/Uncontrolled by 10/.test(afterRoll.text), "and the shortfall of 10 is named as the Weave Reaction Modifier");
await page.screenshot({ path: path.join(OUT, "02-after-roll.png"), fullPage: true });

/* p.281: "Remember a '0' on the ones die counts as 10." */
await boot(FIONNAH, 30);
await page.evaluate(async () => { window.__cast.state.bindId = "b1"; await window.__cast.rollBind(); });
const zeroOnes = await page.evaluate(() => window.__cast.state.ones);
check(zeroOnes === 10, "a 0 on the ones die counts as 10, not 0", zeroOnes);

/* Mitigation: each Resolve spent reduces the modifier by 1, and reaching
 * zero cancels the Reaction entirely. */
await boot(FIONNAH, 42);
const mitigated = await page.evaluate(async () => {
  const c = window.__cast;
  Object.assign(c.state, { bindId: "b1", strandId: "s1", magnitude: 3, duration: 0, range: 2, target: 1, armorTc: 0,
    picked: [{ group: "Attack", label: "Damage 7", tc: 3, count: 1, fraying: 0 }] });
  await c.rollBind();
  c.state.mitigate = 10;
  await c.finish();
  return { chat: window.__chat.join(" "), updates: window.__updates };
});
check(/The cost is covered/.test(mitigated.chat), "spending 10 Resolve on mitigation cancels the Weave Reaction");
const resolveSpend = mitigated.updates.filter((u) => u[0] === "actor" && "system.resolve.value" in u[1]);
check(resolveSpend.some((u) => u[1]["system.resolve.value"] === 10),
  "and those 10 Resolve actually leave the sheet (20 - 10)", resolveSpend);
check(!/Weave Reaction<\/b>: d20/.test(mitigated.chat), "no Weave Reaction is rolled once the modifier is zero");

/* Unmitigated: the Reaction is rolled and the named result is applied. */
await boot(FIONNAH, 42);
const reacted = await page.evaluate(async () => {
  const c = window.__cast;
  Object.assign(c.state, { bindId: "b1", strandId: "s1", magnitude: 3, duration: 0, range: 2, target: 1, armorTc: 0,
    picked: [{ group: "Attack", label: "Damage 7", tc: 3, count: 1, fraying: 0 }] });
  await c.rollBind();
  window.__dice["1d20"] = 10;   // 10 + WRM 10 = 20 -> "1d3 Fraying"
  window.__dice["1d3"] = 3;
  await c.finish();
  return { chat: window.__chat.join(" "), updates: window.__updates };
});
check(/= <b>20<\/b>/.test(reacted.chat), "the Weave Reaction rolls d20 + the modifier",
  (reacted.chat.match(/Weave Reaction[\s\S]{0,120}/) || [""])[0]);
check(/1d3 Fraying/.test(reacted.chat), "20 on the Weave Reaction Table is 1d3 Fraying");
const frayUpd = reacted.updates.find((u) => u[0] === "actor" && "system.fraying" in u[1]);
check(frayUpd && frayUpd[1]["system.fraying"] === 3,
  "and those Fraying points reach the actor rather than being narrated", frayUpd);
check(!/<b>Fraying Roll<\/b>: 1d100/.test(reacted.chat),
  "3 Fraying against Max Resolve 23 needs no Fraying Roll yet");

console.log("== 4. The Weave Reaction Table's gated tiers ==");
/* The old flat-range copy gave 30 to Void Incursion on any spell and 31-35 to
 * Fraygeist outside a ritual. The book gates both. */
for (const [d20, wrm, vulgar, ritual, want] of [
  [20, 12, false, false, "Catastrophic Fray"],
  [20, 12, true, false, "Void Incursion"],
  [20, 13, false, true, "Fraygeist"],
  [20, 13, false, false, "Catastrophic Fray"],
  [20, 18, false, true, "Pattern Collapse"],
  [20, 25, false, true, "The Grey Wailing"],
  [20, 25, false, false, "Catastrophic Fray"]
]) {
  await boot(FIONNAH, 42);
  const out = await page.evaluate(async ({ d20, wrm, vulgar, ritual }) => {
    const c = window.__cast;
    Object.assign(c.state, { bindId: "b1", strandId: "s1", magnitude: vulgar ? 3 : 0, duration: 0, range: 0, target: 0,
      armorTc: 0, ritual, picked: [{ group: "x", label: "cost", tc: wrm + 7, count: 1, fraying: 0 }] });
    await c.rollBind();
    window.__dice["1d20"] = d20;
    await c.finish();
    return window.__chat.join(" ");
  }, { d20, wrm, vulgar, ritual });
  check(new RegExp(want.replace(/ /g, "\\s+")).test(out),
    `d20 ${d20} + modifier, ${vulgar ? "Vulgar" : "not Vulgar"}, ${ritual ? "Ritual" : "not a Ritual"} -> ${want}`,
    (out.match(/Weave Reaction[\s\S]{0,120}/) || [""])[0].replace(/<[^>]+>/g, " ").slice(0, 120));
}

console.log("== 5. Threads ==");
await boot({ items: FIONNAH.items.concat([
  { id: "t1", name: "Crystal Ball", type: "thread", system: { attunement: "Spheres", kind: "die", die: "d8", pool: 0, bonus: 0, expended: false } },
  { id: "t2", name: "Chalk Stub", type: "thread", system: { attunement: "Conjure", kind: "consumable", die: "d8", pool: 5, bonus: 0, expended: false } },
  { id: "t3", name: "Ash Wand", type: "thread", system: { attunement: "Fire", kind: "die", die: "d8", pool: 0, bonus: 0, expended: false } }
]) }, 42);
const threads = await page.evaluate(async () => {
  const c = window.__cast;
  Object.assign(c.state, { bindId: "b1", strandId: "s1", magnitude: 0, duration: 0, range: 0, target: 0, armorTc: 0,
    picked: [{ group: "x", label: "cost", tc: 12, count: 1, fraying: 0 }] });
  await c.rollBind();
  const root = c.element.querySelector(".window-content");
  const offered = Array.from(root.querySelectorAll("[data-thread]")).map((e) => e.dataset.thread);
  window.__dice["1d8"] = 2;      // a 2 still counts, but steps the die down
  root.querySelector('[data-thread="t1"]').checked = true;
  root.querySelector('[data-thread="t2"]').checked = true;
  root.querySelector('[data-thread-amt="t2"]').value = "4";
  await c.useThreads(root);
  return { offered, mastery: c.state.threadMastery, notes: c.state.threadNotes,
    updates: window.__updates.filter((u) => u[0] !== "actor"),
    text: c.element.querySelector(".window-content").textContent.replace(/\s+/g, " ") };
});
check(JSON.stringify(threads.offered) === '["t1","t2"]',
  "only Threads attuned to the Bind or Strand in use are offered", threads.offered);
check(threads.mastery === 6, "a d8 rolling 2 plus 4 from a consumable is 6 Mastery", threads.mastery);
check(threads.updates.some((u) => u[0] === "Crystal Ball" && u[1]["system.die"] === "d6"),
  "a Thread Die that rolls a 2 steps down to the next die type", threads.updates);
check(threads.updates.some((u) => u[0] === "Chalk Stub" && u[1]["system.pool"] === 1),
  "a consumable Thread's pool is drawn down on the Item", threads.updates);
check(/Mastery 13/.test(threads.text), "Mastery now reads ones die 2 + Strand 5 + Threads 6 = 13", threads.text.slice(0, 200));
check(/The cost is covered|Controlled/.test(threads.text), "which covers the 12 TC and controls the spell");

/* A d6 Thread that rolls a 2 crumbles outright rather than stepping down. */
await boot({ items: FIONNAH.items.concat([
  { id: "t4", name: "Last Ember", type: "thread", system: { attunement: "Spheres", kind: "die", die: "d6", pool: 0, bonus: 0, expended: false } }
]) }, 42);
const crumble = await page.evaluate(async () => {
  const c = window.__cast;
  Object.assign(c.state, { bindId: "b1", strandId: "s1" });
  await c.rollBind();
  const root = c.element.querySelector(".window-content");
  window.__dice["1d6"] = 1;
  root.querySelector('[data-thread="t4"]').checked = true;
  await c.useThreads(root);
  return window.__updates.filter((u) => u[0] === "Last Ember");
});
check(crumble.some((u) => u[1]["system.expended"] === true),
  "a d6 Thread rolling 1 or 2 is fully expended and crumbles to dust", crumble);

console.log("== 6. Failure, critical failure, and a Fade's extra Fraying ==");
await boot(FIONNAH, 99);
const failed = await page.evaluate(async () => {
  const c = window.__cast;
  Object.assign(c.state, { bindId: "b1", strandId: "s1" });
  await c.rollBind();
  await c.finish();
  return { chat: window.__chat.join(" "), res: c.state.res };
});
check(failed.res.success === false, "99 fails against Conjure 65");
check(/The spell is not cast\. 1 Resolve spent/.test(failed.chat), "a failure costs 1 Resolve and nothing else");

/* A critical failure rolls on the table at + the Magnitude cost, and a Fade
 * also gains 1 Fraying. 100 is a critical failure at any skill below 100. */
await boot({ system: { pattern: "fade", resolve: { value: 20, max: 23 }, fraying: 0 }, items: FIONNAH.items }, 100);
const critFail = await page.evaluate(async () => {
  const c = window.__cast;
  Object.assign(c.state, { bindId: "b1", strandId: "s1", magnitude: 3 });
  await c.rollBind();
  window.__dice["1d20"] = 5;
  await c.finish();
  return { chat: window.__chat.join(" "), updates: window.__updates, crit: c.state.res.critFail };
});
check(critFail.crit, "a natural 100 is a critical failure");
check(/at \+10 for the spell's Magnitude/.test(critFail.chat),
  "the Reaction rolls at + the spell's Magnitude cost (p.283)", critFail.chat.slice(0, 300));
const fadeFray = critFail.updates.find((u) => u[0] === "actor" && "system.fraying" in u[1]);
check(fadeFray && fadeFray[1]["system.fraying"] === 1,
  "and a Fade gains 1 Fraying on top of the other effects", fadeFray);

console.log("== 7. The Fraying Roll fires from a casting, not only from Advancement ==");
await boot({ system: { pattern: "spellweaver", resolve: { value: 20, max: 10 }, fraying: 10 }, items: FIONNAH.items }, 42);
const frayRoll = await page.evaluate(async () => {
  const c = window.__cast;
  Object.assign(c.state, { bindId: "b1", strandId: "s1", duration: 10, ritual: true });   // Permanent: +2d6 Fraying
  await c.rollBind();
  window.__dice["2d6"] = 6;
  window.__dice["1d100"] = 99;
  await c.finish();
  return window.__chat.join(" ");
});
check(/gains <b>6 Fraying<\/b>/.test(frayRoll), "a Permanent Duration's 2d6 Fraying is rolled and applied", frayRoll.slice(0, 200));
check(/Fraying Roll<\/b>: 1d100/.test(frayRoll), "and crossing Max Resolve triggers the Fraying Roll here too");
check(/× 2 = <b>12<\/b>/.test(frayRoll) || /&times; 2 = <b>12<\/b>/.test(frayRoll),
  "at (16 - 10) x 2 = 12%", (frayRoll.match(/&times; 2 = <b>\d+<\/b>/) || [""])[0]);

console.log("== 8. The Effect tables, driven through the real picker ==");
/* Every earlier test handed `picked` literal costs. That leaves all 17 Effect
 * groups unexercised: the window could price every Effect at 0 and nothing
 * would notice. Drive the real dropdowns and the real Add button. */
await boot(FIONNAH);
const effects = await page.evaluate(async () => {
  const c = window.__cast;
  const root = () => c.element.querySelector(".window-content");
  const out = { rows: [] };
  const pick = async (group, label, count) => {
    const g = root().querySelector('[data-shape="effGroup"]');
    g.value = group; g.dispatchEvent(new Event("change", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 20));
    const rowSel = root().querySelector('[data-shape="effRow"]');
    const opt = Array.from(rowSel.options).findIndex((o) => o.textContent.indexOf(label) === 0);
    rowSel.value = String(opt); rowSel.dispatchEvent(new Event("change", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 20));
    if (count !== undefined) {
      const n = root().querySelector('[data-shape="effCount"]');
      if (n) { n.value = String(count); n.dispatchEvent(new Event("change", { bubbles: true })); await new Promise((r) => setTimeout(r, 20)); }
    }
    const before = c.tc().total;
    root().querySelector('[data-action="add-effect"]').click();
    await new Promise((r) => setTimeout(r, 30));
    out.rows.push({ group, label, delta: c.tc().total - before });
  };
  // Zero the shaping so each delta is the Effect's own price.
  Object.assign(c.state, { magnitude: 0, target: 0, range: 0, duration: 0, armorTc: 0, picked: [] });
  await c.render(true);
  await pick("ap", "+4 AP");
  await pick("enhanceWeapon", "+3 damage");
  await pick("size", "+/- 2 Size categories");
  await pick("skill", "+/- 30");
  await pick("senses", "All senses");
  await pick("mental", "Dominate");
  await pick("substanceValue", "up to 1,000 sp");
  await pick("heal", "Per 1 Wound Point healed", 4);
  out.total = c.tc().total;
  out.listed = root().textContent.replace(/\s+/g, " ");
  return out;
});
const want = { "+4 AP": 6, "+3 damage": 6, "+/- 2 Size categories": 5, "+/- 30": 5,
  "All senses": 8, "Dominate": 8, "up to 1,000 sp": 6, "Per 1 Wound Point healed": 4 };
for (const row of effects.rows) {
  const expect = Object.entries(want).find(([k]) => row.label.indexOf(k) === 0)[1];
  check(row.delta === expect,
    `the Effect picker prices "${row.label}" at ${expect} TC`, row.delta);
}
check(effects.total === 48, `eight Effects total 48 TC (6+6+5+5+8+8+6+4)`, effects.total);
check(/Per 1 Wound Point healed ×4/.test(effects.listed) || /Per 1 Wound Point healed &times;4/.test(effects.listed),
  "a per-point Effect shows the count it was bought at");

console.log("== 9. The odds line, which is the whole point of the window ==");
/* `_coverageNote`'s "You need N or better: X%" branch had no assertion at
 * all -- an off-by-one in `faces` would have shipped silently. */
const odds = await page.evaluate(async () => {
  const c = window.__cast;
  const read = async (tc) => {
    Object.assign(c.state, { magnitude: 0, target: 0, range: 0, duration: 0, armorTc: 0,
      strandId: "s1", picked: [{ group: "x", label: "cost", tc, count: 1, fraying: 0 }] });
    await c.render(true);
    return c.element.querySelector(".window-content").textContent.replace(/\s+/g, " ");
  };
  return { at6: await read(6), at10: await read(10), at15: await read(15), at16: await read(16) };
});
// Strand 5. TC 6 needs a ones die of 1: every face works, so there is no risk.
check(/no Weave Reaction is possible/.test(odds.at6),
  "a cost the worst ones die already covers is reported as risk-free", odds.at6.slice(0, 160));
// TC 10 needs 5 or better on a flat d10: 6 faces, 60%.
check(/You need 5 or better on the ones die: 60%/.test(odds.at10),
  "10 TC against Strand 5 needs a 5 or better, which is 60%", (odds.at10.match(/You need[^<]*/) || [""])[0]);
// TC 15 needs exactly a 10: one face, 10%.
check(/You need 10 or better on the ones die: 10%/.test(odds.at15),
  "15 TC needs the maximum ones die, which is 10%", (odds.at15.match(/You need[^<]*/) || [""])[0]);
check(/leaves you 1 short/.test(odds.at16), "16 TC is out of reach entirely and says so by how much");

console.log("== 10. Failure and critical failure ==");
/* p.283: "Failure: The spell is not cast. Spend 1 Resolve with no further
 * effect." A Permanent Duration's 2d6 Fraying is part of the shaping, and a
 * spell that was never cast does not shape anything. */
await boot(FIONNAH, 70);
const failNoFray = await page.evaluate(async () => {
  const c = window.__cast;
  Object.assign(c.state, { bindId: "b1", strandId: "s1", duration: 10, ritual: true });
  await c.rollBind();
  window.__dice["2d6"] = 7;
  await c.finish();
  return { chat: window.__chat.join(" "), updates: window.__updates, success: c.state.res.success };
});
check(failNoFray.success === false, "70 fails against Conjure 65");
check(!failNoFray.updates.some((u) => u[0] === "actor" && "system.fraying" in u[1]),
  "a spell that was never cast accrues none of its shaping's Fraying",
  failNoFray.updates.filter((u) => u[0] === "actor"));
check(!/gains <b>7 Fraying<\/b>/.test(failNoFray.chat), "and the card does not claim otherwise");

/* A critical failure has no Weave Reaction Modifier, so there is nothing for
 * Resolve to mitigate. The box used to appear, print "cancelled", take no
 * Resolve, and let the Reaction happen anyway. */
await boot(FIONNAH, 100);
const critFailMit = await page.evaluate(async () => {
  const c = window.__cast;
  Object.assign(c.state, { bindId: "b1", strandId: "s1", magnitude: 3, range: 2, target: 1,
    picked: [{ group: "x", label: "cost", tc: 3, count: 1, fraying: 0 }] });
  await c.rollBind();
  const root = c.element.querySelector(".window-content");
  const out = {
    hasMitigationBox: !!root.querySelector('[data-shape="mitigate"]'),
    saysCancelled: /cancelled/.test(root.textContent),
    text: root.textContent.replace(/\s+/g, " ")
  };
  window.__dice["1d20"] = 5;
  await c.finish();
  out.chat = window.__chat.join(" ");
  out.updates = window.__updates;
  return out;
});
check(!critFailMit.hasMitigationBox,
  "a critical failure offers no mitigation box, because there is no modifier to mitigate");
check(!critFailMit.saysCancelled, "and never prints \"cancelled\" over a Reaction that then happens");
check(/no Weave Reaction Modifier to mitigate/.test(critFailMit.text),
  "it says why instead", critFailMit.text.slice(0, 200));
check(/= <b>15<\/b>/.test(critFailMit.chat),
  "the Reaction rolls d20 + the Magnitude cost (5 + 10)", (critFailMit.chat.match(/Weave Reaction[\s\S]{0,90}/) || [""])[0]);

console.log("== 11. The Ch.18 NPC shortcut ==");
/* A critical success is doubles at or under the skill, so it needs a Strand
 * low enough that the ones die would otherwise have been uncontrolled --
 * otherwise the test proves nothing about the crit branch. Spheres 2 with a
 * roll of 33 is exactly that case. */
const LOW_STRAND = { items: [
  { id: "b1", name: "Bind: Conjure", type: "skill", system: { group: "Bind", value: 65, expertise: 0 } },
  { id: "s1", name: "Spheres", type: "strand", system: { level: 2, thin: false } }
] };
await boot(LOW_STRAND, 33);
const npcCrit = await page.evaluate(async () => {
  const c = window.__cast;
  Object.assign(c.state, { bindId: "b1", strandId: "s1" });
  window.__dice["1d20"] = 4;
  await c.npcShortcut();
  return window.__chat.join(" ");
});
check(/Critical success: \+3 SL, and no Weave Reaction/.test(npcCrit),
  "the NPC shortcut handles a critical success", npcCrit.replace(/<[^>]+>/g, " ").slice(0, 170));
check(!/Weave Reaction<\/b>: d20/.test(npcCrit),
  "...and rolls no Weave Reaction for it, even though the ones die beat the Strand");

for (const [d100, label, expect, notExpect] of [
  [100, "a critical failure", /the spell fails and the Weave lashes out at \+5/, null],
  [70, "a plain failure", /The spell fails\. No Weave Reaction occurs/, /Weave Reaction<\/b>: d20/],
  [42, "a controlled success", /controlled, no Weave Reaction/, /Weave Reaction<\/b>: d20/],
  [48, "an uncontrolled success", /<b>uncontrolled<\/b>/, null]
]) {
  await boot(FIONNAH, d100);
  const out = await page.evaluate(async () => {
    const c = window.__cast;
    Object.assign(c.state, { bindId: "b1", strandId: "s1" });
    window.__dice["1d20"] = 4;
    await c.npcShortcut();
    return window.__chat.join(" ");
  });
  check(expect.test(out), `the NPC shortcut handles ${label}`, out.replace(/<[^>]+>/g, " ").slice(0, 160));
  if (notExpect) check(!notExpect.test(out), `...and rolls no Weave Reaction for ${label}`);
}
/* "or a natural '0' regardless of Strand value" -- the 0-counts-as-10 rule
 * would otherwise make a Strand of 10 swallow this case. */
await boot({ items: [
  { id: "b1", name: "Bind: Conjure", type: "skill", system: { group: "Bind", value: 65, expertise: 0 } },
  { id: "s1", name: "Spheres", type: "strand", system: { level: 10, thin: false } }
] }, 40);
const natZero = await page.evaluate(async () => {
  const c = window.__cast;
  Object.assign(c.state, { bindId: "b1", strandId: "s1" });
  window.__dice["1d20"] = 4;
  await c.npcShortcut();
  return window.__chat.join(" ");
});
check(/a natural 0 is uncontrolled whatever the Strand/.test(natZero),
  "a natural 0 on the ones die is uncontrolled even at Strand 10",
  natZero.replace(/<[^>]+>/g, " ").slice(0, 200));

console.log("== 12. Bind requisites, after-the-roll purchases, and magic Talents ==");
/* The chapter's headline example is a BIND requisite: "a Change Earth spell
 * with a Control requisite, so Fane will use the lower of his Change or
 * Control". Only Strand requisites existed. */
await boot(FIONNAH, 42);
const bindReq = await page.evaluate(async () => {
  const c = window.__cast;
  c.state.bindId = "b1";           // Conjure 65
  c.state.requisiteBindId = "b2";  // Control 50
  await c.render(true);
  const eff = c.effectiveBind();
  await c.rollBind();
  return { name: eff.name, value: eff.value, against: c.state.res.against,
    text: c.element.querySelector(".window-content").textContent.replace(/\s+/g, " ") };
});
check(bindReq.name === "Control" && bindReq.value === 50,
  "a Bind requisite makes you roll the LOWER of the two Binds", bindReq);
check(bindReq.against === 50, "and the roll is actually made against it", bindReq.against);

/* p.290: Fionnah pays +1 TC AFTER the roll to ignore 3 armor AP, taking the
 * spell from 17 to 18. That purchase existed only before the roll. */
await boot(FIONNAH, 42);
const postBuys = await page.evaluate(async () => {
  const c = window.__cast;
  Object.assign(c.state, { bindId: "b1", strandId: "s1", magnitude: 3, duration: 0, range: 2, target: 1, armorTc: 0,
    picked: [{ group: "Attack", label: "Damage 7", tc: 3, count: 1, fraying: 0 }] });
  await c.rollBind();
  const before = c.tc().total;
  const box = c.element.querySelector('[data-shape="postArmor"]');
  const had = !!box;
  if (box) { box.value = "1"; box.dispatchEvent(new Event("change", { bubbles: true })); }
  await new Promise((r) => setTimeout(r, 40));
  return { had, before, after: c.tc().total,
    text: c.element.querySelector(".window-content").textContent.replace(/\s+/g, " ") };
});
check(postBuys.had, "the after-the-roll purchases are offered after the roll");
check(postBuys.before === 17 && postBuys.after === 18,
  "bypassing 3 armor AP takes the book's 17 TC spell to 18, exactly as the example does", postBuys);

/* Ch.4's magic Talents are flat numbers already on the sheet and every one
 * modifies a roll this window makes itself. */
const talented = FIONNAH.items.concat([
  { id: "tw", name: "Weave Shadow", type: "talent", system: { ranks: 2, specialization: "" } },
  { id: "tr", name: "Ritual Caster", type: "talent", system: { ranks: 1, specialization: "" } },
  { id: "te", name: "Enduring Caster (Conjure)", type: "talent", system: { ranks: 2, specialization: "Conjure" } }
]);
await boot({ items: talented }, 42);
const talents = await page.evaluate(async () => {
  const c = window.__cast;
  Object.assign(c.state, { bindId: "b1", strandId: "s1", ritual: true, magnitude: 0, duration: 0, range: 0, target: 0,
    armorTc: 0, picked: [{ group: "x", label: "cost", tc: 14, count: 1, fraying: 0 }] });
  await c.render(true);
  const shapeText = c.element.querySelector(".window-content").textContent.replace(/\s+/g, " ");
  await c.rollBind();
  c.state.mitigate = 3;
  window.__dice["1d20"] = 10;
  await c.finish();
  return { shapeText, against: c.state.res.against, chat: window.__chat.join(" "), updates: window.__updates };
});
check(/Weave Shadow −2|Weave Shadow &minus;2/.test(talents.shapeText.replace(/\u2212/g, "−")),
  "the shaping page names the Talents that will apply", talents.shapeText.slice(0, 240));
check(talents.against === 75, "Ritual Caster adds +10 to a ritual's Bind roll (65 + 10)", talents.against);
const resolveUpd = talents.updates.filter((u) => u[0] === "actor" && "system.resolve.value" in u[1]);
check(resolveUpd.some((u) => u[1]["system.resolve.value"] === 19),
  "Enduring Caster ×2 means a 3-point mitigation costs only 1 Resolve (20 - 1)", resolveUpd);
check(/Weave Shadow/.test(talents.chat) && /= <b>12<\/b>/.test(talents.chat),
  "and Weave Shadow lowers the Weave Reaction roll (d20 10 + 4 - 2)",
  (talents.chat.match(/Weave Reaction[\s\S]{0,110}/) || [""])[0]);

console.log("== 13. The book's hard prerequisites ==");
for (const [label, spec, expect] of [
  ["a Bind at 0", { items: [
    { id: "b1", name: "Bind: Witness", type: "skill", system: { group: "Bind", value: 0, expertise: 0 } },
    { id: "s1", name: "Spheres", type: "strand", system: { level: 5 } }] }, /value of zero cannot be used/],
  ["a Strand at 0", { items: [
    { id: "b1", name: "Bind: Conjure", type: "skill", system: { group: "Bind", value: 65, expertise: 0 } },
    { id: "s1", name: "Spheres", type: "strand", system: { level: 0 } }] }, /cannot be used in spellcasting/],
  ["no Resolve left", { system: { resolve: { value: 0, max: 23 } }, items: FIONNAH.items },
    /at least 1 available Resolve/]
]) {
  await boot(spec, 42);
  const out = await page.evaluate(() => {
    const root = window.__cast.element.querySelector(".window-content");
    return { text: root.textContent.replace(/\s+/g, " "),
      disabled: !!root.querySelector('[data-action="cast"]').disabled };
  });
  check(expect.test(out.text), `${label} is named as a blocker`, out.text.slice(-260));
  check(out.disabled, `...and the Bind roll button is disabled for ${label}`);
}
await boot(FIONNAH, 42);
const ritualGate = await page.evaluate(async () => {
  const c = window.__cast;
  Object.assign(c.state, { duration: 10, ritual: false });   // Permanent
  await c.render(true);
  const root = c.element.querySelector(".window-content");
  const before = { text: root.textContent.replace(/\s+/g, " "), disabled: !!root.querySelector('[data-action="cast"]').disabled };
  c.state.ritual = true;
  await c.render(true);
  return { before, afterDisabled: !!c.element.querySelector('[data-action="cast"]').disabled };
});
check(/can only be done as a Ritual/.test(ritualGate.before.text) && ritualGate.before.disabled,
  "a Ritual-only Duration without the Ritual tick blocks the casting");
check(!ritualGate.afterDisabled, "and ticking Cast as a Ritual unblocks it");

const durationGate = await page.evaluate(async () => {
  const c = window.__cast;
  Object.assign(c.state, { duration: 3, ritual: false,      // 1 Minute
    picked: [{ group: "Attack: External damage", label: "Damage equal to your Strand value", tc: 1, count: 1, fraying: 0 }] });
  await c.render(true);
  return c.element.querySelector(".window-content").textContent.replace(/\s+/g, " ");
});
check(/All attack spells must have a Duration of Instant/.test(durationGate),
  "an attack spell with a non-Instant Duration is caught", durationGate.slice(-220));

const trigger = await page.evaluate(async () => {
  const c = window.__cast;
  Object.assign(c.state, { duration: 0, picked: [], trigger: 0, magnitude: 0, target: 0, range: 0, armorTc: 0 });
  await c.render(true);
  const sel = c.element.querySelector('[data-shape="trigger"]');
  const opts = Array.from(sel.options).map((o) => o.textContent);
  sel.value = "8"; sel.dispatchEvent(new Event("change", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 40));
  return { opts, total: c.tc().total };
});
check(trigger.opts.length === 11 && /Month \(\+8 TC\)/.test(trigger.opts.join("|")),
  "a Triggered Effect is priced off the Duration table, not a free-text number", trigger.opts.slice(0, 4));
check(trigger.total === 8, "and a Month-long trigger costs its Duration row's 8 TC", trigger.total);

/* p.280: "A Spellweaver must both make the correct gestures with at least one
 * hand and speak the required magical words to cast any spell." */
await boot(FIONNAH, 42);
const hands = await page.evaluate(async () => {
  const c = window.__cast;
  Object.assign(c.state, { bindId: "b1", strandId: "s1", handsFull: true, silenced: false });
  await c.render(true);
  const noTalent = { text: c.element.querySelector(".window-content").textContent.replace(/\s+/g, " "),
    disabled: !!c.element.querySelector('[data-action="cast"]').disabled };
  Object.assign(c.state, { handsFull: false, silenced: true });
  await c.render(true);
  return { noTalent, silencedBlocked: !!c.element.querySelector('[data-action="cast"]').disabled };
});
check(hands.noTalent.disabled && /at least one free hand/.test(hands.noTalent.text),
  "with both hands occupied and no Words Alone, the casting is blocked", hands.noTalent.text.slice(-200));
check(hands.silencedBlocked, "and a caster who cannot speak is blocked too");

await boot({ items: FIONNAH.items.concat([
  { id: "tw", name: "Words Alone", type: "talent", system: { ranks: 1, specialization: "" } },
  { id: "tf", name: "Forceful Strand (Spheres)", type: "talent", system: { ranks: 2, specialization: "Spheres" } }
]) }, 42);
const wordsAlone = await page.evaluate(async () => {
  const c = window.__cast;
  Object.assign(c.state, { bindId: "b1", strandId: "s1", handsFull: true });
  await c.render(true);
  const disabled = !!c.element.querySelector('[data-action="cast"]').disabled;
  await c.rollBind();
  const against = c.state.res.against;
  await c.finish();
  return { disabled, against, chat: window.__chat.join(" ") };
});
check(!wordsAlone.disabled, "Words Alone unblocks a caster with both hands occupied");
check(wordsAlone.against === 45, "at the Talent's -20 (Conjure 65 - 20)", wordsAlone.against);
check(/Forceful Strand \(Spheres\)/.test(wordsAlone.chat) && /&minus;20/.test(wordsAlone.chat),
  "and Forceful Strand ×2 states the -20 the target resists at",
  (wordsAlone.chat.match(/Forceful[^<]*/) || [""])[0]);

console.log("== 14. Every Weave Reaction result carries the book's prose ==");
/* `detailFor` matched "does the row name contain the prose entry's name",
 * which is the wrong direction for seven of the thirty rows: the table says
 * "1d4 Fatigue" and the prose entry is headed "fatigued". Those rows printed
 * a bare label. Exercise the real mapping over the real table. */
{
  const magicData = JSON.parse(fs.readFileSync(path.join(__dirname, "data/magic.json"), "utf8"));
  /* Drive a real uncontrolled casting onto each unconditional row of the d20
     and assert the card carries an explanation as well as the label. */
  const missing = [];
  for (const row of magicData.weaveReactions.filter((r) => !r.when && r.min >= 1 && r.min <= 25)) {
    await boot(FIONNAH, 42);
    const out = await page.evaluate(async (target) => {
      const c = window.__cast;
      Object.assign(c.state, { bindId: "b1", strandId: "s1", magnitude: 0, duration: 0, range: 0, target: 0,
        armorTc: 0, ritual: false, picked: [{ group: "x", label: "cost", tc: 7 + target - 1, count: 1, fraying: 0 }] });
      await c.rollBind();          // ones die 2 + Strand 5 = Mastery 7
      window.__dice["1d20"] = 1;
      await c.finish();
      return window.__chat.join(" ");
    }, row.min);
    // The label is bold; the explanation follows in a dimmed div.
    const hasLabel = out.indexOf(row.name.slice(0, 18)) > -1;
    const hasProse = /font-size:11px;opacity:\.9">/.test(out);
    /* Row 13 is the one result the book states in full on the table itself
     * and gives no separate paragraph for, so it legitimately has none. */
    const bookHasNoProse = /^Additional spells cost/.test(row.name);
    if (!hasLabel || (!hasProse && !bookHasNoProse)) missing.push(row.name + (hasLabel ? " (no prose)" : " (not reached)"));
  }
  check(missing.length === 0,
    "every Weave Reaction result on the d20 prints the book's explanation, not just its label", missing);
}

console.log("== 8. Page errors ==");
check(errs.length === 0, "no uncaught page errors across the whole run", errs.slice(0, 4));

await browser.close();
console.log("\n" + (fails ? fails + " FAILURE(S)" : "ALL CAST CHECKS PASSED") + `  Screenshots: ${OUT}`);
process.exit(fails ? 1 : 0);
