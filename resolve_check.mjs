/*
 * resolve_check.mjs -- what can be spent from the Resolve track (v0.50.0).
 *
 * p.26: spent Resolve is slashed from the left of the track, Fatigue is
 * crossed from the right, and once the two meet "there is no more Resolve
 * available". So the spendable amount is unspent Resolve MINUS Fatigue. Until
 * v0.50.0 every spend read unspent Resolve alone: a character with 5 unspent
 * and 4 Fatigue could still spend 3 Favor, or 3 Resolve to refuse Shock.
 *
 *   1. VERIFIED: the p.26 sentences are in the book, on p.26.
 *   2. The owner (rules/resolve-track.mjs) over every track up to 12 boxes.
 *   3. The macro pack's fallback agrees with it everywhere, and defers to it.
 *   4. The drawn track has the right boxes in the right places.
 *   5. The BUILT TBE: Skill Roll against a fatigued character, plus a
 *      mutation that restores the old cap and must be caught.
 *   6. The BUILT TBE: Attack's Shock save: not offered when Fatigue leaves
 *      fewer than 3 free boxes, offered (with the track) when it does not.
 *   7. Every spend site asks the owner; none caps on resolve.value.
 */
import fs from "node:fs";
import * as RT from "./system/the-broken-empires/module/rules/resolve-track.mjs";
import * as resolution from "./system/the-broken-empires/module/rules/resolution.mjs";
import * as diceRoles from "./system/the-broken-empires/module/helpers/dice-roles.mjs";
import * as zones from "./system/the-broken-empires/module/rules/zones.mjs";
import * as controls from "./system/the-broken-empires/module/helpers/roll-controls.mjs";

let pass = 0, fail = 0;
const check = (cond, label, extra) => {
  if (cond) { pass++; console.log("  PASS  " + label); }
  else { fail++; console.log("  FAIL  " + label + (extra !== undefined ? "  <- " + JSON.stringify(extra).slice(0, 400) : "")); }
};
const read = (f) => fs.readFileSync(f, "utf8");
const sys = (value, max, fatigue) => ({ resolve: { value, max }, fatigue });

console.log("\n1. The rule is the book's (p.26)");
{
  const BOOK = process.env.TBE_BOOK || "/tmp/tbe.txt";
  if (!fs.existsSync(BOOK)) {
    console.log("  SKIP  no rulebook text at " + BOOK);
  } else {
    const raw = fs.readFileSync(BOOK, "utf8");
    const flat = raw.replace(/\s+/g, " ");
    const quotes = [
      /* The book hyphenates "box-es" across a line, so the quote stops short of it. */
      "Indicate spent Resolve with a single slash in the box",
      "character sheet’s Resolve track, from left to right.",
      "For every Fatigue you take, mark one “X” in a Resolve box on the track, from right to left.",
      "If your Resolve track becomes filled with spent Resolve or Fatigue (or some combination of the two)"
    ];
    for (const q of quotes) check(flat.includes(q), "in the book: " + q.slice(0, 60) + "...");
    /* A bare page number FOLLOWS its page's text in this dump (the contents
       page puts Favor and Resolve on 26, and these lines sit above the 26). */
    const lines = raw.split("\n");
    const at = lines.findIndex((l) => l.includes("For every Fatigue you take, mark"));
    let page = null;
    for (let i = at; i > -1 && i < lines.length; i++) if (/^\s*\d{1,3}\s*$/.test(lines[i])) { page = Number(lines[i].trim()); break; }
    check(page === 26 || page === 27, "the passage is at p.26 (the number after it: " + page + ")", page);
    check(read("system/the-broken-empires/module/rules/resolve-track.mjs").includes("For every\n * Fatigue you take, mark one \"X\" in a Resolve box on the track, from right to\n * left."),
      "the owner carries the book's sentence beside the rule");
  }
}

console.log("\n2. The owner, over every track up to 12 boxes");
{
  let bad = [];
  for (let max = 0; max <= 12; max++)
    for (let value = 0; value <= max; value++)
      for (let fat = 0; fat <= max; fat++)
        for (let pend = 0; pend <= 4; pend++) {
          const t = RT.track(sys(value, max, fat), pend);
          const want = Math.max(0, value - fat);
          if (t.available !== want || t.spent + t.fatigue + t.available !== max && fat <= value ||
              t.spend !== Math.min(pend, want) || t.after !== want - t.spend) bad.push({ max, value, fat, pend, t });
        }
  check(bad.length === 0, "available = unspent - Fatigue, never negative; a spend never exceeds it", bad.slice(0, 3));
  check(RT.availableResolve(sys(5, 10, 4)) === 1, "5 unspent, 4 Fatigue: 1 can be spent");
  check(RT.availableResolve(sys(3, 10, 5)) === 0, "more Fatigue than unspent: nothing, not a negative");
  check(RT.availableResolve(sys(12, 10, 0)) === 10, "an over-full value is clamped to the track");
  check(RT.availableResolve({}) === 0 && RT.availableResolve(undefined) === 0, "no data reads as 0, not NaN");
}

console.log("\n3. The macro pack's fallback agrees, and defers");
{
  const LIB = read("macros/_lib.js");
  const T = new Function("canvas", "game", "foundry", "ui", "CONFIG", LIB + "\n;return TBE;")(undefined, undefined, undefined, undefined, undefined);
  let bad = [];
  for (let max = 0; max <= 10; max++) for (let value = 0; value <= max; value++) for (let fat = 0; fat <= max; fat++) for (let p = 0; p <= 3; p++) {
    const a = { system: sys(value, max, fat) };
    if (JSON.stringify(T.resolveTrack(a, p)) !== JSON.stringify(RT.track(a.system, p))) bad.push({ max, value, fat, p });
  }
  check(bad.length === 0, "fallback == owner over the whole matrix", bad.slice(0, 3));
  check(T.fatigueRoom({ system: sys(5, 10, 4) }) === 1, "room for new Fatigue is the same free boxes");
  const sentinel = { track: () => ({ available: 99, sentinel: true }), availableResolve: () => 99, trackHtml: () => "SENTINEL" };
  const game = { thebrokenempires: { rules: { resolveTrack: sentinel } }, user: {} };
  const T2 = new Function("canvas", "game", "foundry", "ui", "CONFIG", LIB + "\n;return TBE;")(undefined, game, undefined, undefined, undefined);
  check(T2.availableResolve({ system: sys(1, 1, 0) }) === 99 && T2.resolveTrackHtml({ system: {} }, 0) === "SENTINEL",
    "with the system present the macro pack asks the owner");
}

console.log("\n4. The track as drawn");
{
  const html = RT.trackHtml(sys(7, 10, 2), 2);
  const boxes = [...html.matchAll(/class="tbe-rbox (\w+)"/g)].map((m) => m[1]);
  check(boxes.length === 10, "one box per point of Max Resolve", boxes.length);
  check(boxes.join(",") === "spent,spent,spent,pending,pending,free,free,free,fatigue,fatigue",
    "spent from the left, this roll's spend next, Fatigue from the right", boxes.join(","));
  check(/5 → <b>3<\/b> available, 2 Fatigue/.test(html), "and says the before and after in words", html.slice(-120));
  check(!/pending/.test(RT.trackHtml(sys(7, 10, 2), 0)), "no pending boxes when nothing is spent");
  check(/no track/.test(RT.trackHtml(sys(0, 0, 0), 0)), "a creature with no Resolve track says so rather than drawing nothing");
}

/* ---------- Built macros ---------- */
const docs = JSON.parse(read("data/solo_docs.json"));
const cmd = (name) => docs.macros.find((m) => m.name === name).command;
const AF = Object.getPrototypeOf(async function () {}).constructor;
const woundsBlank = () => {
  const w = {};
  for (const k of ["head", "body", "rArm", "lArm", "rLeg", "lLeg"]) w[k] = { wp: 0, imp: 0, inf: false, septic: false, rb: null };
  return w;
};
const actorStub = (o) => Object.assign({
  isOwner: true, hasPlayerOwner: true, statuses: new Set(), effects: [],
  async update(ch) { this.updates = (this.updates || []).concat([ch]);
    if ("system.resolve.value" in ch) this.system.resolve.value = ch["system.resolve.value"]; return this; },
  getFlag() { return undefined; }, async setFlag() {}, async toggleStatusEffect() {}, async createEmbeddedDocuments() { return []; }
}, o);
function harness({ rolls = [], answers = {}, attacker, target, withSystem = true }) {
  const log = [];
  const queue = rolls.slice();
  class Roll {
    constructor(f) { this.formula = f; }
    async evaluate() { this.total = queue.length ? queue.shift() : 50; this.dice = [{ options: {} }]; return this; }
    async roll() { return this.evaluate(); }
  }
  const ChatMessage = { getSpeaker: () => ({}), applyRollMode(d) { return d; },
    async create(d) { log.push({ ev: "post", content: d.content }); return { id: "m" + log.length }; } };
  const targets = target ? new Set([{ actor: target, name: target.name, center: { x: 0, y: 0 }, document: { elevation: 0 } }]) : new Set();
  const game = {
    user: { id: "U", isGM: true, character: null, targets, getFlag() {}, async setFlag() {} },
    settings: { get: () => "publicroll" },
    thebrokenempires: withSystem ? {
      ui: { taskButtons: controls.taskButtons, favorButtons: controls.favorButtons, readRadio: controls.readRadio },
      rules: {
        resolveTrack: { track: RT.track, availableResolve: RT.availableResolve, trackHtml: RT.trackHtml },
        TASK_MODIFIERS: resolution.TASK_MODIFIERS, resolve: resolution.resolve,
        diceRoles: { ROLE: diceRoles.ROLE, tagRoll: diceRoles.tagRoll },
        zones: { SCOPE: zones.SCOPE, HAZARDS: zones.HAZARDS, PENALTY: zones.PENALTY, hazardsOf: zones.hazardsOf,
          attackHazards: zones.attackHazards, resolveHazardMods: zones.resolveHazardMods, insideRegion: zones.insideRegion }
      } } : undefined
  };
  const foundry = { utils: { duplicate: (o) => JSON.parse(JSON.stringify(o)), deepClone: (o) => JSON.parse(JSON.stringify(o)) },
    applications: { api: { DialogV2: { prompt: async (o) => {
      log.push({ ev: "dialog", title: o.window.title, content: o.content });
      return answers[o.window.title] ?? {};
    } } } } };
  const ui = { notifications: { warn: (m) => log.push({ ev: "warn", m }), error: (m) => log.push({ ev: "error", m }), info: (m) => log.push({ ev: "info", m }) } };
  const canvas = { scene: null, tokens: { controlled: attacker ? [{ actor: attacker, name: attacker.name, center: { x: 0, y: 0 }, document: { elevation: 0 } }] : [] } };
  return { log, run: (command) => new AF("canvas", "game", "foundry", "ui", "ChatMessage", "Roll", "CONFIG",
    "speaker", "actor", "token", "character", "scope", "event", "{" + command + "\n}")(canvas, game, foundry, ui, ChatMessage, Roll, { statusEffects: [], sounds: { dice: "d.wav" } }) };
}

console.log("\n5. TBE: Skill Roll against a fatigued character");
{
  const runSkill = async (command) => {
    const hero = actorStub({ id: "H", name: "Hero", type: "character", items: [],
      system: { resolve: { value: 5, max: 10 }, fatigue: 4, wounds: woundsBlank() } });
    const h = harness({ rolls: [30], attacker: hero,
      answers: { "TBE Skill Roll": { pick: "", skill: "50", mod: "0", extra: "0", favor: "3", label: "Climb" } } });
    await h.run(command);
    return { hero, h };
  };
  const { hero, h } = await runSkill(cmd("TBE: Skill Roll"));
  const dlg = h.log.find((e) => e.ev === "dialog")?.content || "";
  check((dlg.match(/name="favor"/g) || []).length === 2, "5 unspent and 4 Fatigue: Favor offers 0 and 1 only", (dlg.match(/name="favor" value="\d"/g) || []));
  check(/class="tbe-rtrack"/.test(dlg) && (dlg.match(/tbe-rbox fatigue/g) || []).length === 4, "the dialog draws the track, 4 Fatigue boxes crossed");
  check(hero.system.resolve.value === 4, "asking for 3 Favor spends the 1 free box, not 3", hero.system.resolve.value);
  const card = h.log.filter((e) => e.ev === "post").map((e) => e.content).join(" ");
  check(/1 Resolve spent as Favor \(\+10\)/.test(card), "the card reports the 1 actually spent");
  check(/1 → <b>0<\/b> available, 4 Fatigue/.test(card) && (card.match(/tbe-rbox pending/g) || []).length === 1,
    "and draws the track, before and after, with the one box it slashed");
  check(h.log.some((e) => e.ev === "info" && /Fatigue boxes cannot be spent/.test(e.m)), "the player is told why it was fewer");

  /* Mutation: the fatigue-blind cap this release removed. */
  const blind = cmd("TBE: Skill Roll").split("TBE.availableResolve(actor)").join("TBE.num(actor.system?.resolve?.value, 0)");
  check(blind !== cmd("TBE: Skill Roll"), "(sanity) the mutation changed the macro");
  const m = await runSkill(blind);
  check(m.hero.system.resolve.value !== 4, "(mutation) the old cap spends Fatigue-crossed boxes and this section would fail", m.hero.system.resolve.value);
}

console.log("\n6. TBE: Attack's Shock save counts only free boxes");
{
  const attackOnce = async (value, fatigue) => {
    const attacker = actorStub({ id: "A", name: "Renn", type: "character",
      items: [{ type: "skill", name: "Melee: Medium", system: { value: 80, fighting: true, expertise: 0 } },
        { type: "weapon", id: "w1", name: "Broadsword", system: { dmg: 4, skillName: "Melee: Medium", cl: 3, cs: 3, dis: 4, t: 5, carried: "hand" } }],
      system: { size: "Medium", wounds: woundsBlank(), supply: {} } });
    const w = woundsBlank(); w.body.imp = 1; w.body.wp = 2;
    const target = actorStub({ id: "T", name: "Mara", type: "character", items: [],
      system: { size: "Medium", wounds: w, toughness: 0, shock: false, resolve: { value, max: 10 }, fatigue,
        deathThreshold: { value: 20, max: 20 } } });
    /* attack 12 (Body), defence 95 fails, Wound Die 1: a second Body impairment, so Shock */
    const h = harness({ rolls: [12, 95, 1], attacker, target,
      answers: { "TBE Attack": { weapon: "0", def: "0", atkMod: "0", defMod: "0" }, "Combat Maneuvers": {}, "Shock!": { spend: "on" } } });
    await h.run(cmd("TBE: Attack"));
    return { target, h };
  };
  const a = await attackOnce(4, 2);
  check(!a.h.log.some((e) => e.ev === "dialog" && e.title === "Shock!"), "4 unspent and 2 Fatigue (2 free): the 3-Resolve save is not offered");
  check(a.target.system.resolve.value === 4, "and nothing is spent", a.target.system.resolve.value);
  const b = await attackOnce(6, 2);
  const shock = b.h.log.find((e) => e.ev === "dialog" && e.title === "Shock!");
  check(!!shock, "6 unspent and 2 Fatigue (4 free): it is offered");
  check(/class="tbe-rtrack"/.test(shock?.content || "") && (shock.content.match(/tbe-rbox pending/g) || []).length === 3,
    "with the track showing the 3 boxes it would take");
  check(b.target.system.resolve.value === 3, "taken off unspent Resolve when chosen", b.target.system.resolve.value);
  const card = b.h.log.filter((e) => e.ev === "post").map((e) => e.content).join(" ");
  check(/refuses the Shock/.test(card) && /4 → <b>1<\/b> available, 2 Fatigue/.test(card), "and the card shows the track, before and after");
}

console.log("\n7. Every spend asks the owner");
{
  const spenders = fs.readdirSync("macros").filter((f) => f.endsWith(".js") && f !== "_lib.js")
    .filter((f) => /"system\.resolve\.value":[^\n]*\s-\s/.test(read("macros/" + f)));
  check(["tbe-attack.js", "tbe-cast.js", "tbe-counterspell.js", "tbe-skill-roll.js"].every((f) => spenders.includes(f)),
    "found the four macros that spend Resolve", spenders);
  check(/const resolveNow = me \? TBE\.availableResolve\(me\) : 0;/.test(read("macros/tbe-ritual.js")),
    "tbe-ritual.js's 'at least one available Resolve' gate reads available Resolve");
  for (const f of spenders) check(read("macros/" + f).includes("TBE.availableResolve("), f + " reads available Resolve");
  const sheet = read("system/the-broken-empires/module/sheets/actor-sheet.mjs");
  check(/const resolveLeft = RTRACK\.availableResolve\(this\.actor\.system\)/.test(sheet), "the sheet's Favor cap asks the owner");
  check(/canAttempt: pattern !== 'none' && C\.availableResolve\(system\) >= 1/.test(sheet), "and so does its 'can cast' line");
  check(!/Math\.min\(RULES\.FAVOR_CAP, Number\(this\.actor\.system\?\.resolve\?\.value\)/.test(sheet), "no fatigue-blind cap is left on the sheet");
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
