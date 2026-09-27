/*
 * qol_check.mjs -- the v0.49.0 quality-of-life batch.
 *
 * Every item came from the first played session's notes: "remember the last
 * attack", "modifiers as radial buttons ... with a memory", "changing from at
 * hand, to stored to dropped should be easier than editing the item", and a
 * Wizard that lost a half-built character when its window closed. Two
 * correctness bugs turned up while building them and are covered here too:
 * the Task Modifier owner was missing Severe -30, and an untrained Endurance
 * or Dodge (20, p.104) was treated as no skill at all.
 *
 * What it runs, and why that way:
 *   1. The memory owner, SEQUENTIALLY (rule 9): remember, recall, overwrite,
 *      forget, cap, against a setFlag that MERGES like Foundry's does. The
 *      mutation stores an object instead of a string and shows a forgotten
 *      key coming back.
 *   2. The button rows: six Task Modifier steps, the picked one checked, and
 *      Favor that always opens on 0.
 *   3. The BUILT TBE: Skill Roll, twice: the second opening is on the first
 *      one's modifier, and never on its Favor.
 *   4. The BUILT TBE: Attack, twice: weapon, Wound Die and defence remembered;
 *      the defence only for the same target; a character target with no Dodge
 *      or Endurance written down dodges and rolls Endurance at 20.
 *   5. The sheet: the carry picker lists the owner's states, and the roll
 *      dialog remembers the modifier and never the Favor.
 *   6. Character creation's resume path (the Create Character window since
 *      v0.53.0), by reading how it stores and
 *      restores (the window itself is driven by wizard_visual_check.mjs).
 */
import fs from "node:fs";
import * as memory from "./system/the-broken-empires/module/helpers/memory.mjs";
import * as controls from "./system/the-broken-empires/module/helpers/roll-controls.mjs";
import * as resolution from "./system/the-broken-empires/module/rules/resolution.mjs";
import * as diceRoles from "./system/the-broken-empires/module/helpers/dice-roles.mjs";
import * as zones from "./system/the-broken-empires/module/rules/zones.mjs";
import { TBE as CFG } from "./system/the-broken-empires/module/helpers/config.mjs";

let pass = 0, fail = 0;
const check = (cond, label, extra) => {
  if (cond) { pass++; console.log("  PASS  " + label); }
  else { fail++; console.log("  FAIL  " + label + (extra !== undefined ? "  <- " + JSON.stringify(extra).slice(0, 400) : "")); }
};
const read = (f) => fs.readFileSync(f, "utf8");

/* A User whose setFlag MERGES objects, the way Foundry's update does. */
const deepMerge = (a, b) => {
  if (!b || typeof b !== "object" || Array.isArray(b)) return b;
  const out = (a && typeof a === "object" && !Array.isArray(a)) ? { ...a } : {};
  for (const [k, v] of Object.entries(b)) out[k] = deepMerge(out[k], v);
  return out;
};
function mkUser(id = "U") {
  const flags = {};
  return {
    id, flags, writes: 0,
    getFlag(scope, key) { return flags[scope]?.[key]; },
    async setFlag(scope, key, v) { this.writes++; flags[scope] = flags[scope] || {}; flags[scope][key] = deepMerge(flags[scope][key], v); return this; }
  };
}

console.log("\n1. The memory owner, in sequence");
{
  const u = mkUser();
  check(memory.recall(u, "task", "A") === null, "nothing remembered yet reads as null");
  await memory.remember(u, "task", "A", -20);
  check(memory.recall(u, "task", "A") === -20, "remembered");
  check(typeof u.flags["the-broken-empires"].memory === "string", "stored as one JSON string on the user");
  await memory.remember(u, "attack", "A", { weapon: "Spear", def: { T: "Dodge" } });
  await memory.remember(u, "attack", "A", { weapon: "Axe", def: {} });
  const a = memory.recall(u, "attack", "A");
  check(a.weapon === "Axe" && !a.def.T, "an overwrite REPLACES, even under a merging setFlag (the old defence is gone)", a);
  await memory.forget(u, "task", "A");
  check(memory.recall(u, "task", "A") === null, "forgotten");
  check(memory.recall(u, "attack", "A")?.weapon === "Axe", "forgetting one kind leaves the others");
  const u2 = mkUser("U2");
  check(memory.recall(u2, "attack", "A") === null, "a second user does not share the first user's memory");
  for (let i = 0; i < memory.MAX_PER_KIND + 5; i++) await memory.remember(u, "task", "k" + i, i);
  const bucket = JSON.parse(u.flags["the-broken-empires"].memory).task;
  check(Object.keys(bucket).length === memory.MAX_PER_KIND && !("k0" in bucket) && ("k" + (memory.MAX_PER_KIND + 4)) in bucket,
    "capped per kind, oldest dropped first", Object.keys(bucket).length);
  u.flags["the-broken-empires"].memory = "{not json";
  check(memory.recall(u, "task", "k9") === null, "a corrupt flag reads as empty rather than throwing");
  check(await memory.remember({}, "task", "A", 1) === false, "a user that cannot write is refused, not thrown at");

  /* Mutation: an object flag under a merging setFlag keeps what was deleted. */
  const m = mkUser();
  await m.setFlag("the-broken-empires", "memory", { attack: { A: { def: { T: "Dodge" } } } });
  await m.setFlag("the-broken-empires", "memory", { attack: { A: { def: {} } } });
  check(m.getFlag("the-broken-empires", "memory").attack.A.def.T === "Dodge",
    "(mutation) as a nested object the forgotten defence survives the merge, which is why it is a string");
}

console.log("\n2. The button rows");
{
  const html = controls.taskButtons(resolution.TASK_MODIFIERS, -20);
  const radios = html.match(/type="radio" name="task"/g) || [];
  check(radios.length === 6, "six Task Modifier buttons, Severe included", radios.length);
  check(/value="-30"/.test(html), "Severe -30 is a button");
  check(/value="-20" checked/.test(html) && (html.match(/checked/g) || []).length === 1, "the remembered step is the one checked");
  check(/value="0" checked/.test(controls.taskButtons(resolution.TASK_MODIFIERS, 999)), "an unknown remembered value falls back to Medium");
  check(/title="[^"]*Ride an unbroken stallion"/.test(html), "the book's example is the tooltip");
  const fav = controls.favorButtons(2, 10);
  check((fav.match(/name="favor"/g) || []).length === 3 && /value="0" checked/.test(fav) && !/value="[12]" checked/.test(fav),
    "Favor 0-2 for 2 Resolve left, opening on 0");
  check((controls.favorButtons(0, 10).match(/name="favor"/g) || []).length === 1, "no Resolve left: only 0 is offered");
  const form = { querySelector: (sel) => (sel === 'input[name="task"]:checked' ? { value: "-10" } : null) };
  check(controls.readRadio(form, "task") === "-10" && controls.readRadio(form, "favor") === null, "readRadio reads the picked value, null when none");
}

/* ---------- Built macros ---------- */
const docs = JSON.parse(read("data/solo_docs.json"));
const cmd = (name) => docs.macros.find((m) => m.name === name).command;
const AF = Object.getPrototypeOf(async function () {}).constructor;
const skill = (name, value, fighting = true) => ({ type: "skill", name, system: { value, fighting, expertise: 0 } });
const woundsBlank = () => {
  const w = {};
  for (const k of ["head", "body", "rArm", "lArm", "rLeg", "lLeg"]) w[k] = { wp: 0, imp: 0, inf: false, septic: false, rb: null };
  return w;
};

function harness({ user, rolls = [], answers = {}, attacker, target }) {
  const log = [];
  const queue = rolls.slice();
  class Roll {
    constructor(formula) { this.formula = formula; }
    async evaluate() { this.total = queue.length ? queue.shift() : 50; this.dice = [{ options: {} }]; return this; }
    async roll() { return this.evaluate(); }
  }
  const ChatMessage = {
    getSpeaker: () => ({ alias: "x" }), applyRollMode(d) { return d; },
    async create(d) { log.push({ ev: "post", content: d.content }); return { id: "m" + log.length }; }
  };
  const targets = target ? new Set([{ actor: target, name: target.name, center: { x: 0, y: 0 }, document: { elevation: 0 } }]) : new Set();
  const game = {
    user: Object.assign(user, { isGM: true, character: null, targets }),
    settings: { get: () => "publicroll" },
    thebrokenempires: {
      memory: { recall: memory.recall, remember: memory.remember, forget: memory.forget },
      ui: { taskButtons: controls.taskButtons, favorButtons: controls.favorButtons, readRadio: controls.readRadio },
      rules: {
        TASK_MODIFIERS: resolution.TASK_MODIFIERS, resolve: resolution.resolve,
        diceRoles: { ROLE: diceRoles.ROLE, tagRoll: diceRoles.tagRoll },
        zones: { SCOPE: zones.SCOPE, HAZARDS: zones.HAZARDS, PENALTY: zones.PENALTY, hazardsOf: zones.hazardsOf,
          attackHazards: zones.attackHazards, resolveHazardMods: zones.resolveHazardMods, insideRegion: zones.insideRegion }
      }
    }
  };
  const foundry = {
    utils: { duplicate: (o) => JSON.parse(JSON.stringify(o)), deepClone: (o) => JSON.parse(JSON.stringify(o)) },
    applications: { api: { DialogV2: { prompt: async (o) => {
      const title = o.window.title;
      log.push({ ev: "dialog", title, content: o.content });
      return answers[title] ?? {};
    } } } }
  };
  const ui = { notifications: { warn: (m) => log.push({ ev: "warn", m }), error: (m) => log.push({ ev: "error", m }), info() {} } };
  const canvas = { scene: null, tokens: { controlled: attacker ? [{ actor: attacker, name: attacker.name, center: { x: 0, y: 0 }, document: { elevation: 0 } }] : [] } };
  const CONFIG = { sounds: { dice: "d.wav" }, statusEffects: [] };
  return {
    log,
    run: (command) => new AF("canvas", "game", "foundry", "ui", "ChatMessage", "Roll", "CONFIG",
      "speaker", "actor", "token", "character", "scope", "event", "{" + command + "\n}")(canvas, game, foundry, ui, ChatMessage, Roll, CONFIG)
  };
}
const actorStub = (o) => Object.assign({
  isOwner: true, statuses: new Set(), effects: [],
  async update(ch) { this.updates = (this.updates || []).concat([ch]); return this; },
  getFlag() { return undefined; }, async setFlag() {}, async toggleStatusEffect() {}, async createEmbeddedDocuments() { return []; }
}, o);

console.log("\n3. TBE: Skill Roll remembers the modifier, never the Favor");
{
  const user = mkUser();
  const hero = actorStub({ id: "H", name: "Hero", type: "character", items: [skill("Stealth", 55, false)],
    system: { resolve: { value: 5, max: 5 }, wounds: woundsBlank() } });
  const h1 = harness({ user, rolls: [30], attacker: hero, answers: { "TBE Skill Roll": { pick: "", skill: "55", mod: "-20", extra: "0", favor: "1", label: "Stealth" } } });
  await h1.run(cmd("TBE: Skill Roll"));
  const d1 = h1.log.find((e) => e.ev === "dialog");
  check(/value="0" checked/.test(d1?.content || "") && (d1.content.match(/name="mod"/g) || []).length === 6,
    "first opening: six buttons, on Medium", (d1?.content || "").slice(0, 200));
  check(hero.updates?.some((u) => u["system.resolve.value"] === 4), "the Favor was spent once, as asked");
  const h2 = harness({ user, rolls: [30], attacker: hero, answers: {} });
  await h2.run(cmd("TBE: Skill Roll"));
  const d2 = h2.log.find((e) => e.ev === "dialog")?.content || "";
  check(/name="mod" value="-20" checked/.test(d2), "second opening: on the Hard -20 used last time");
  check(/name="favor" value="0" checked/.test(d2) && !/name="favor" value="1" checked/.test(d2), "and Favor back on 0, not the 1 spent last time");
  const other = actorStub({ id: "O", name: "Other", type: "character", items: [], system: { resolve: { value: 1, max: 1 }, wounds: woundsBlank() } });
  const h3 = harness({ user, rolls: [30], attacker: other });
  await h3.run(cmd("TBE: Skill Roll"));
  check(/name="mod" value="0" checked/.test(h3.log.find((e) => e.ev === "dialog")?.content || ""), "a different character opens on its own memory (Medium)");
}

console.log("\n4. TBE: Attack remembers the last attack; untrained Dodge and Endurance are 20");
{
  const user = mkUser();
  const mkAttacker = () => actorStub({ id: "A", name: "Renn", type: "character",
    items: [skill("Melee: Medium", 80), skill("Melee: Heavy", 60),
      { type: "weapon", id: "w1", name: "Broadsword", system: { dmg: 4, skillName: "Melee: Medium", cl: 3, cs: 3, dis: 4, t: 5, carried: "hand" } },
      { type: "weapon", id: "w2", name: "Greataxe", system: { dmg: 6, skillName: "Melee: Heavy", cl: 3, cs: 3, dis: 4, t: 5, carried: "hand" } }],
    system: { size: "Medium", wounds: woundsBlank(), supply: {} } });
  /* A character with NOTHING written down: no Dodge, no Endurance. */
  const mkTarget = (id) => actorStub({ id, name: "Mara", type: "character", items: [],
    system: { size: "Medium", wounds: woundsBlank(), toughness: 0, shock: false, resolve: { value: 0, max: 0 },
      deathThreshold: { value: 20, max: 20 } } });
  const attacker = mkAttacker();
  const t1 = mkTarget("T1");
  /* attack 12 vs 60 (hit, ones 2 = Body), defence 95 vs 20 (fail), Wound Die 1 (impairs), Endurance 15 vs 20 (success) */
  const h1 = harness({ user, rolls: [12, 95, 1, 15], attacker, target: t1,
    answers: { "TBE Attack": { weapon: "1", def: "0", atkMod: "0", defMod: "0", d20: "on" }, "Combat Maneuvers": {} } });
  await h1.run(cmd("TBE: Attack"));
  const d1 = h1.log.find((e) => e.ev === "dialog" && e.title === "TBE Attack")?.content || "";
  check(/Dodge \(untrained\) \(20\)/.test(d1), "a character with no Dodge skill is offered Dodge at 20, not left undefended");
  const posts = h1.log.filter((e) => e.ev === "post").map((e) => e.content).join(" ");
  check(/Body impaired: Endurance 20 \(untrained, p\.104\) roll/.test(posts), "a first Body impairment ROLLS Endurance at 20 for a character with none written down");
  check(!/roll Endurance or drop in Shock/.test(posts), "and no longer hands the roll back as a reminder");
  const errs = h1.log.filter((e) => e.ev === "error" || e.ev === "warn");
  check(errs.length === 0, "no warning or error", errs);

  const h2 = harness({ user, rolls: [99, 95], attacker, target: t1,
    answers: { "TBE Attack": { weapon: "0", def: "0", atkMod: "0", defMod: "0" } } });
  await h2.run(cmd("TBE: Attack"));
  const d2 = h2.log.find((e) => e.ev === "dialog" && e.title === "TBE Attack")?.content || "";
  check(/<option value="1" selected>Greataxe/.test(d2), "second attack opens on the Greataxe used last time");
  check(/name="d20" checked/.test(d2), "and on the d20 Wound Die choice");
  check(/Opened on your last attack with Renn/.test(d2), "and says it did");
  check(/<option value="0" selected>Dodge/.test(d2), "the defence remembered for this target is preselected");

  const t2 = mkTarget("T2");
  const h3 = harness({ user, rolls: [99, 95], attacker, target: t2,
    answers: { "TBE Attack": { weapon: "0", def: "0", atkMod: "0", defMod: "0" } } });
  await h3.run(cmd("TBE: Attack"));
  const d3 = h3.log.find((e) => e.ev === "dialog" && e.title === "TBE Attack")?.content || "";
  check(!/<option value="0" selected>Dodge/.test(d3), "a new target gets no remembered defence");
  const saved = memory.recall(user, "attack", "A");
  check(saved && Object.keys(saved).sort().join(",") === "d20,def,thrown,weapon,weaponId",
    "only choices are stored: weapon, throw, Wound Die, defence (no modifier, no spend)", saved);

  const src = read("macros/tbe-attack.js");
  check(!/remember\([^)]*(resolve|favor|atkMod|defMod)/i.test(src), "nothing in Attack remembers a spend or a modifier");
}

console.log("\n5. The sheet: carry picker and roll dialog");
{
  const sheet = read("system/the-broken-empires/module/sheets/actor-sheet.mjs");
  const tpl = read("system/the-broken-empires/templates/actor/parts/actor-items.hbs");
  check((tpl.match(/class="carry-select"/g) || []).length === 2, "weapons and shields both get the carry picker");
  check(!/<select[^>]*class="carry-select"[^>]*name=/.test(tpl), "the picker has no form name, so it cannot collide in the sheet form (rule 12)");
  check(/Object\.entries\(TBE\.READINESS\)/.test(sheet), "its options come from the owner, TBE.READINESS");
  check(Object.keys(CFG.READINESS).join(",") === "ready,hand,stored,dropped", "which knows all four states", Object.keys(CFG.READINESS));
  check(/html\.on\('change', '\.carry-select'[\s\S]{0,700}PERMISSION\.applyItemWrite/.test(sheet),
    "a change is written through the permission owner, so a refusal is said out loud");
  check(/MEMORY\.remember\(game\.user, 'task', memKey, spend\.task\)/.test(sheet), "the roll dialog remembers the Task Modifier");
  check(!/MEMORY\.remember\([^)]*favor/i.test(sheet), "and never the Favor");
  check(/CONTROLS\.favorButtons\(maxSpend/.test(sheet) && /CONTROLS\.taskButtons\(RULES\.TASK_MODIFIERS/.test(sheet),
    "both pickers are the shared button rows, fed by the rule owner");
}

console.log("\n6. Character creation keeps its draft");
{
  /* The Wizard that carried this retired in v0.53.0; the Create Character
     window keeps it the same way. creator_check.mjs section 7 runs the
     sequence (close half way, reopen, resume) in a browser; this pins the
     shape of it. */
  const w = fs.readFileSync("system/the-broken-empires/module/chargen/creator.mjs", "utf8");
  check(/memory\.remember\(game\.user, DRAFT_KIND, this\.actor\.id, pristine \? null : \{ draft: this\.d/.test(w),
    "the draft is saved on the user through the memory owner, keyed by the actor (and an untouched one is not)");
  check(/_onInput\(ev\)[\s\S]{0,400}this\._save\(\)/.test(w) && /_onChange\(ev\)[\s\S]{0,400}this\._save\(\)/.test(w), "after every change");
  check(/async close\(options\) \{[\s\S]{0,500}memory\.remember/.test(w), "and on close");
  check(/this\._created = true;[\s\S]{0,80}memory\.remember\(game\.user, DRAFT_KIND, this\.actor\.id, null\)/.test(w), "Create discards it");
  check(/"Resume it"/.test(w) && /"Start over"/.test(w), "reopening offers Resume or Start over");
  check(/Object\.assign\(defaultDraft\(T\), JSON\.parse\(JSON\.stringify\(saved/.test(w), "a restored draft goes over the defaults, so newer fields keep theirs");
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
