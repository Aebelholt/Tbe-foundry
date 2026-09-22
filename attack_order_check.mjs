/*
 * attack_order_check.mjs -- TBE: Attack posts the roll before it asks about
 * maneuvers, and waits for the dice to land first.
 *
 * SEQUENTIAL (CLAUDE.md rule 9): the claim is about the ORDER of four events,
 * so the check runs the real, fully built macro (data/solo_docs.json, the
 * same text the tbe-macros pack ships) against stubbed Foundry globals and
 * records a timeline: chat card posted, dice animation finished, maneuver
 * dialog opened, outcome card posted. Reading the source would show the calls
 * are present; it cannot show they happen in this order.
 *
 * Before v0.43.0 the dialog opened straight after the silent roll and every
 * die appeared at the very end, in one card.
 */
import { readFileSync } from "node:fs";
import * as diceRoles from "./system/the-broken-empires/module/helpers/dice-roles.mjs";
import * as zones from "./system/the-broken-empires/module/rules/zones.mjs";

let pass = 0, fail = 0;
const check = (cond, label, extra) => {
  if (cond) { pass++; console.log("  PASS  " + label); }
  else { fail++; console.log("  FAIL  " + label + (extra !== undefined ? "  <- " + JSON.stringify(extra).slice(0, 400) : "")); }
};

const docs = JSON.parse(readFileSync("data/solo_docs.json", "utf8"));
const COMMAND = docs.macros.find((m) => m.name === "TBE: Attack").command;
const AF = Object.getPrototypeOf(async function () {}).constructor;

const skill = (name, value, fighting = true) => ({ type: "skill", name, system: { value, fighting, expertise: 0 } });

function world({ rolls, dsn = true, dsnHangs = false, command = COMMAND, maneuverAnswer = {}, system = true, regions = null, bow = false, attackAnswer = null }) {
  const timeline = [];
  const queue = rolls.slice();
  class Roll {
    constructor(formula) { this.formula = formula; }
    async evaluate() { this.total = queue.length ? queue.shift() : 1; this.dice = [{ options: {} }]; return this; }
  }
  const wounds = {};
  for (const k of ["head", "body", "rArm", "lArm", "rLeg", "lLeg"]) wounds[k] = { wp: 0, imp: 0, inf: false, septic: false, rb: null };
  const target = {
    id: "T", name: "Orc", type: "creature", isOwner: true,
    items: [skill("Dodge", 20)],
    system: { armour: {}, toughness: 0, size: "Medium", wounds, deathThreshold: { value: 15, max: 15 }, shock: false, resolve: { value: 0, max: 0 } },
    async update() { return this; }, getFlag() { return undefined; }, async setFlag() {}, statuses: new Set(),
    effects: [], async toggleStatusEffect() {}, async createEmbeddedDocuments() { return []; }
  };
  const attacker = {
    id: "A", name: "Renn", type: "character", isOwner: true,
    items: bow
      ? [skill("Missile", 70), { type: "weapon", id: "w1", name: "Shortbow",
          system: { dmg: 2, skillName: "Missile", cl: 6, cs: 5, dis: 5, t: 5, ranged: true, carried: "hand" } }]
      : [skill("Melee: Medium", 80), { type: "weapon", id: "w1", name: "Broadsword",
          system: { dmg: 4, skillName: "Melee: Medium", cl: 3, cs: 3, dis: 4, t: 5, carried: "hand" } }],
    system: { size: "Medium", wounds, supply: { ammo: 8 } },
    async update() { return this; }, getFlag() { return undefined; }, statuses: new Set()
  };
  let msgN = 0;
  const ChatMessage = {
    getSpeaker: () => ({ alias: "Renn" }),
    applyRollMode(data) { return data; },
    async create(data) {
      const id = "m" + (++msgN);
      timeline.push({ ev: "post", id, rolls: (data.rolls || []).length, content: data.content,
        roles: (data.rolls || []).map((r) => r.dice?.[0]?.options?.dsnRole ?? null) });
      return { id };
    }
  };
  const game = {
    user: { id: "U", isGM: true, character: null, targets: new Set([{ actor: target, name: "Orc", center: { x: 950, y: 50 }, document: { elevation: 0 } }]) },
    settings: { get: () => "publicroll" },
    dice3d: dsn ? {
      addRole() {},
      waitFor3DAnimationByMessageID: (id) => dsnHangs ? new Promise(() => {}) :
        new Promise((r) => setTimeout(() => { timeline.push({ ev: "dice done", id }); r(true); }, 20))
    } : undefined,
    thebrokenempires: system ? { rules: { diceRoles: { ROLE: diceRoles.ROLE, tagRoll: diceRoles.tagRoll },
      zones: { SCOPE: zones.SCOPE, HAZARDS: zones.HAZARDS, PENALTY: zones.PENALTY, hazardsOf: zones.hazardsOf,
        attackHazards: zones.attackHazards, resolveHazardMods: zones.resolveHazardMods, insideRegion: zones.insideRegion } } } : undefined
  };
  const foundry = {
    utils: { duplicate: (o) => JSON.parse(JSON.stringify(o)), deepClone: (o) => JSON.parse(JSON.stringify(o)) },
    applications: { api: { DialogV2: { prompt: async (o) => {
      const title = o.window.title;
      timeline.push({ ev: "dialog", title });
      if (title === "TBE Attack") { timeline.push({ ev: "attack dialog", content: o.content }); return attackAnswer ?? { weapon: "0", def: "0", atkMod: "0", defMod: "0" }; }
      if (title === "Combat Maneuvers") return maneuverAnswer;
      return {};
    } } } }
  };
  const ui = { notifications: { warn: (m) => timeline.push({ ev: "warn", m }), error: (m) => timeline.push({ ev: "error", m }), info() {} } };
  const canvas = { scene: regions ? { regions } : null,
    tokens: { controlled: [{ actor: attacker, name: "Renn", center: { x: 50, y: 50 }, document: { elevation: 0 } }] } };
  const CONFIG = { sounds: { dice: "dice.wav" }, statusEffects: [] };
  const fn = new AF("canvas", "game", "foundry", "ui", "ChatMessage", "Roll", "CONFIG",
    "speaker", "actor", "token", "character", "scope", "event", "{" + command + "\n}");
  return { timeline, run: () => fn(canvas, game, foundry, ui, ChatMessage, Roll, CONFIG) };
}

const idx = (t, pred) => t.findIndex(pred);

console.log("\n1. A hit: roll card, dice land, THEN the maneuver dialog, then the outcome");
{
  /* attack 12 vs 80 (success), defence 95 vs 20 (fail), wound die 6 */
  const w = world({ rolls: [12, 95, 6, 6, 6] });
  await w.run();
  const t = w.timeline;
  const firstPost = idx(t, (e) => e.ev === "post");
  const diceDone = idx(t, (e) => e.ev === "dice done");
  const dialog = idx(t, (e) => e.ev === "dialog" && e.title === "Combat Maneuvers");
  const lastPost = t.map((e) => e.ev).lastIndexOf("post");
  check(firstPost > -1 && dialog > -1, "both the roll card and the maneuver dialog happen", t.map((e) => e.ev + (e.title ? ":" + e.title : "")));
  check(firstPost < dialog, "the roll card is posted BEFORE the maneuver dialog opens");
  check(t[firstPost]?.rolls >= 2, "the first card carries the attack and defence dice", t[firstPost]?.rolls);
  check(/The attack lands/.test(t[firstPost]?.content || ""), "the first card says the attack landed");
  check(diceDone > firstPost && diceDone < dialog, "the dialog waits for the dice animation to finish");
  check(lastPost > dialog, "the outcome card comes after the dialog");
  check(!/Attack: <b>/.test(t[lastPost]?.content || ""), "the outcome card does not repeat the attack roll");
  check(/Hit<\/b>/.test(t[lastPost]?.content || ""), "the outcome card carries the hit location and damage");
  const errs = t.filter((e) => e.ev === "error" || e.ev === "warn");
  check(errs.length === 0, "no warning or error along the way", errs);
}

console.log("\n2. Without Dice So Nice nothing waits");
{
  const w = world({ rolls: [12, 95, 6, 6, 6], dsn: false });
  await w.run();
  const t = w.timeline;
  check(idx(t, (e) => e.ev === "post") < idx(t, (e) => e.ev === "dialog" && e.title === "Combat Maneuvers"),
    "roll card still comes first");
  check(!t.some((e) => e.ev === "dice done"), "no dice wait recorded");
}

console.log("\n3. A stalled animation cannot trap the attacker");
{
  const w = world({ rolls: [12, 95, 6, 6, 6], dsnHangs: true,
    command: COMMAND.replace("TBE.DICE_WAIT_CAP_MS = 15000;", "TBE.DICE_WAIT_CAP_MS = 50;") });
  const done = await Promise.race([w.run().then(() => "ran"), new Promise((r) => setTimeout(() => r("stuck"), 2000))]);
  check(done === "ran", "the macro finishes when Dice So Nice never resolves (capped wait)");
  check(w.timeline.some((e) => e.ev === "dialog" && e.title === "Combat Maneuvers"), "and the dialog still opens");
}

console.log("\n4. A miss is one card, no maneuver dialog");
{
  const w = world({ rolls: [95, 10] });
  await w.run();
  const t = w.timeline;
  check(t.filter((e) => e.ev === "post").length === 1, "exactly one card", t.map((e) => e.ev));
  check(!t.some((e) => e.ev === "dialog" && e.title === "Combat Maneuvers"), "no maneuver dialog on a miss");
}

console.log("\n5. Dice So Nice colours: attack, defence and Wound Die are told apart");
{
  const w = world({ rolls: [12, 95, 6, 6, 6] });
  await w.run();
  const posts = w.timeline.filter((e) => e.ev === "post");
  check(JSON.stringify(posts[0].roles) === JSON.stringify(["tbe-attack", "tbe-defence"]),
    "roll card: the attack die is tbe-attack, the defence die tbe-defence", posts[0].roles);
  check(posts[posts.length - 1].roles.includes("tbe-wound"), "outcome card: the Wound Die is tbe-wound", posts[posts.length - 1].roles);
  const bare = world({ rolls: [12, 95, 6, 6, 6], system: false });
  await bare.run();
  check(bare.timeline.filter((e) => e.ev === "post").every((p) => p.roles.every((r) => r === null)),
    "without the system global nothing is tagged, and the attack still runs");
}

console.log("\n6. Zone Hazards reach the roll");
{
  const fog = { name: "Reeds", flags: { [zones.SCOPE]: { hazards: { obscured: true } } },
    testPoint(p) { return p.x >= 400 && p.x <= 600 && p.y >= 0 && p.y <= 100; } };
  /* Missile 70, roll 60: a hit in clear air, a miss at -20 through the reeds. */
  const clear = world({ rolls: [60, 95, 6, 6, 6], bow: true, regions: [] });
  await clear.run();
  check(clear.timeline.some((e) => e.ev === "post" && /The attack lands/.test(e.content)), "clear air: 60 vs Missile 70 lands");
  const w = world({ rolls: [60, 95, 6, 6, 6], bow: true, regions: [fog],
    attackAnswer: { weapon: "0", def: "0", atkMod: "0", defMod: "0", hz_obscured: "on" } });
  await w.run();
  const dlg = w.timeline.find((e) => e.ev === "attack dialog");
  check(/name="hz_obscured" checked/.test(dlg?.content || ""), "the attack dialog offers Obscured, pre-ticked");
  check(/p\.151/.test(dlg?.content || ""), "...citing p.151");
  const post = w.timeline.find((e) => e.ev === "post");
  check(/turned aside/.test(post?.content || "") && /Missile 50/.test(post?.content || ""),
    "through the reeds: Missile 70 becomes 50 and the 60 misses", post?.content?.slice(0, 300));
  check(/Zone: Obscured zone between/.test(post?.content || ""), "the card says why");
  const gm = world({ rolls: [60, 95, 6, 6, 6], bow: true, regions: [fog],
    attackAnswer: { weapon: "0", def: "0", atkMod: "0", defMod: "0" } });
  await gm.run();
  check(gm.timeline.some((e) => e.ev === "post" && /The attack lands/.test(e.content)), "GM unticks it (target clearly seen): the shot lands");
  const sword = world({ rolls: [60, 95, 6, 6, 6], regions: [fog],
    attackAnswer: { weapon: "0", def: "0", atkMod: "0", defMod: "0", hz_obscured: "on" } });
  await sword.run();
  check(sword.timeline.some((e) => e.ev === "post" && /Melee: Medium 80/.test(e.content)), "a sword through the same fog is not penalised");
}

console.log("\n7. Mutation: the old order is caught");
{
  /* Remove the early post: the dialog then opens before anything reaches chat. */
  const mutated = COMMAND.replace(/const rollMsg = await TBE\.say\([\s\S]*?\), rolls\);/, "const rollMsg = null;");
  check(mutated !== COMMAND, "(sanity) mutation applied");
  const w = world({ rolls: [12, 95, 6, 6, 6], command: mutated });
  await w.run();
  const t = w.timeline;
  const firstPost = idx(t, (e) => e.ev === "post");
  const dialog = idx(t, (e) => e.ev === "dialog" && e.title === "Combat Maneuvers");
  check(!(firstPost > -1 && firstPost < dialog), "without the early post, section 1's ordering assertion fails");
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
