/*
 * chargen_parity_check.mjs -- the new chargen calculation against the Wizard
 * that is actually shipping (v0.51.0, stage 1 of the chargen rebuild).
 *
 * module/chargen/derive.mjs works the whole character out from the player's
 * choices. The oracle is not a hand-written expectation: it is the BUILT TBE:
 * Character Wizard (data/solo_docs.json, the text the tbe-macros pack ships),
 * run in Node with a stub Application, handed each draft, and made to run its
 * real commit() against a stand-in actor that records every Item and every
 * field it writes. The two results are compared field for field.
 *
 * Drafts: every race x every career, plus seeded random drafts that push
 * pools into the 70 cap, casters with every magic pool spent, Fades, Old
 * characters with the Lore pool and Expertise, randomized Initiative and DT.
 *
 * A mismatch is not automatically derive's fault. The book applies the steps
 * in order (p.78) and caps an increase at 70 when it happens (p.80); the
 * Wizard applied Career points BEFORE racial modifiers. Every mismatch is
 * explained or it fails:
 *   ORDER    a skill with a racial PENALTY that the Wizard capped at 70 before
 *            applying the penalty. Reported, counted, not a failure: derive
 *            follows the book, and this is a Wizard defect to retire in stage 2.
 *   anything else fails the check.
 *
 * Section 3 also holds the Wizard's own Attributes PAGE against what its
 * commit() writes, which is how the racial-Toughness drift was found.
 */
import fs from "node:fs";
import { derive } from "./system/the-broken-empires/module/chargen/derive.mjs";

let pass = 0, fail = 0;
const check = (cond, label, extra) => {
  if (cond) { pass++; console.log("  PASS  " + label); }
  else { fail++; console.log("  FAIL  " + label + (extra !== undefined ? "  <- " + JSON.stringify(extra).slice(0, 600) : "")); }
};

/* ---------------------------------------------------------------- harness */
const docs = JSON.parse(fs.readFileSync("data/solo_docs.json", "utf8"));
const COMMAND = docs.macros.find((m) => m.name === "TBE: Character Wizard").command;
const AF = Object.getPrototypeOf(async function () {}).constructor;

/* Deterministic dice: commit() rolls these four, and derive is handed the same. */
const DICE = { "1d3+1": 3, "2d4*50": 250 };
const diceFor = (f) => (f in DICE ? DICE[f] : 17 + (f.length % 7));

function loadWizard() {
  let captured = null;
  class Application {
    constructor(opts) { this.options = opts || {}; captured = this; }
    static get defaultOptions() { return {}; }
    render() { return this; }
    close() { return this; }
  }
  class Roll {
    constructor(f) { this.formula = f; }
    async evaluate() { this.total = diceFor(this.formula); this.dice = [{ options: {} }]; return this; }
  }
  const actor = mkActor();
  const game = {
    user: { id: "U", isGM: true, character: actor, getFlag() {}, async setFlag() {} },
    settings: { get: () => ({ roles: [], streaks: [], troubles: [] }) },
    macros: { getName: () => null },
    packs: { get: () => ({ getDocuments: async () => [{ toObject: () => ({ name: "Dagger", type: "weapon", system: {} }) }] }) }
  };
  const foundry = { utils: { mergeObject: (a, b) => Object.assign({}, a, b), duplicate: (o) => JSON.parse(JSON.stringify(o)) } };
  const ChatMessage = { getSpeaker: () => ({}), applyRollMode: (d) => d, async create() { return {}; } };
  const ui = { notifications: { warn() {}, info() {}, error() {} } };
  const canvas = { tokens: { controlled: [] } };
  const body = "{" + COMMAND + "\n;return { TBE, TBE_CHARGEN, TBE_TALENTS, TBE_MAGIC: (typeof TBE_MAGIC !== 'undefined' ? TBE_MAGIC : null), " +
    "TBE_LIFE_EVENTS: (typeof TBE_LIFE_EVENTS !== 'undefined' ? TBE_LIFE_EVENTS : null) };\n}";
  const fn = new AF("canvas", "game", "foundry", "ui", "ChatMessage", "Roll", "Application", "CONFIG",
    "speaker", "actor", "token", "character", "scope", "event", body);
  return { fn, args: [canvas, game, foundry, ui, ChatMessage, Roll, Application, { sounds: {} }], getWizard: () => captured, actor };
}

function mkActor() {
  const rec = { created: [], updates: [], deleted: 0 };
  return {
    id: "A", name: "Test", type: "character", rec,
    items: { filter: () => [] }, system: { status: 0, fraying: 0 },
    async deleteEmbeddedDocuments() {},
    async createEmbeddedDocuments(type, arr) { rec.created.push(...JSON.parse(JSON.stringify(arr))); return arr; },
    async update(ch) { rec.updates.push(JSON.parse(JSON.stringify(ch))); return this; }
  };
}

/* ------------------------------------------------------------ normalise */
function fromWizard(rec) {
  const out = { skills: {}, strands: {}, thread: null, talents: {}, gear: [], update: {} };
  for (const it of rec.created) {
    if (it.type === "skill") out.skills[it.name] = { group: it.system.group, value: it.system.value, expertise: it.system.expertise || 0, savvy: !!it.system.savvy, fighting: !!it.system.fighting };
    else if (it.type === "strand") out.strands[it.name] = { level: it.system.level, thin: !!it.system.thin };
    else if (it.type === "thread") out.thread = { name: it.name, attunement: it.system.attunement, die: it.system.die };
    else if (it.type === "talent") out.talents[it.name] = { ranks: it.system.ranks, specialization: it.system.specialization || "" };
    else out.gear.push(it.name);
  }
  for (const u of rec.updates) for (const [k, v] of Object.entries(u)) {
    if (k === "system.notes" || k === "flags.the-broken-empires.chargenLedger") continue;
    out.update[k] = v;
  }
  return out;
}
function fromDerive(c, actorStatus) {
  const out = { skills: {}, strands: {}, thread: null, talents: {}, gear: c.equipment.free.slice(), update: {} };
  for (const [n, v] of Object.entries(c.skills)) out.skills[n] = { group: v.group, value: v.value, expertise: v.expertise || 0, savvy: !!v.savvy, fighting: !!v.fighting };
  for (const v of c.extraSkills) out.skills[v.name] = { group: v.group, value: v.value, expertise: v.expertise || 0, savvy: !!v.savvy, fighting: false };
  for (const s of c.strands) out.strands[s.name] = { level: s.level, thin: !!s.thin };
  if (c.thread) out.thread = { name: c.thread.name, attunement: c.thread.attunement, die: c.thread.die };
  for (const t of c.talents) out.talents[t.name] = { ranks: t.ranks, specialization: t.specialization || "" };
  const A = c.attributes;
  Object.assign(out.update, {
    "system.race": c.identity.race, "system.career": c.identity.career, "system.culture": c.identity.culture,
    "system.size": c.identity.size, "system.toughness": A.toughness.value,
    "system.deathThreshold.value": A.deathThreshold.value, "system.deathThreshold.max": A.deathThreshold.value,
    "system.resolve.value": A.resolveMax.value, "system.resolve.max": A.resolveMax.value,
    "system.initiative": A.initiative.value, "system.lethalityBonus": A.lethalityBonus.value, "system.fatigue": 0,
    "system.silver": c.silver.total, "system.status": Math.max(actorStatus, A.status.value),
    "system.supply.gear": 12, "system.supply.ammo": 12, "system.supply.rations": 12, "system.supply.medical": 12,
    "flags.the-broken-empires.freeArmor": c.equipment.freeArmorPieces, "system.enc.invBonus": A.invBonus.value,
    "system.pattern": c.identity.pattern, "system.convocation": c.identity.convocation,
    "system.trueName": c.identity.trueName, "system.fraying": 0
  });
  if (c.personality.length) out.update["system.personalityTraits"] = c.personality;
  return out;
}
function diff(a, b, path = "") {
  const out = [];
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  for (const k of keys) {
    const x = a?.[k], y = b?.[k], p = path ? path + "." + k : k;
    if (x && y && typeof x === "object" && typeof y === "object" && !Array.isArray(x)) out.push(...diff(x, y, p));
    else if (JSON.stringify(x) !== JSON.stringify(y)) out.push({ path: p, wizard: x, derive: y });
  }
  return out;
}

/* --------------------------------------------------------------- drafts */
let seed = 20260927;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const pickN = (a, n) => { const c = a.slice(), o = []; while (o.length < n && c.length) o.push(c.splice(Math.floor(rnd() * c.length), 1)[0]); return o; };
function spend(total, keys, lumpy) {
  const out = {};
  let left = total;
  while (left > 0 && keys.length) {
    const k = pick(keys);
    const amt = Math.min(left, lumpy ? pick([5, 10, 20, 30, 40, 50]) : pick([1, 2, 5, 10]));
    out[k] = (out[k] || 0) + amt;
    left -= amt;
  }
  return out;
}

function makeDraft(W, G, raceName, careerName) {
  const { TBE, TBE_CHARGEN: CG, TBE_MAGIC: MAGIC, TBE_LIFE_EVENTS: LE } = G;
  const SK = TBE.SKILL_GROUPS;
  const d = JSON.parse(JSON.stringify(W.defaultDraft));
  d.raceName = raceName; d.careerName = careerName;
  d.concept = "Parity " + raceName + " " + careerName;
  for (const cat of ["Combat", "Adventuring", "Social", "Lore"]) d.boost[cat] = rnd() < 0.9 ? pick(SK[cat]) : null;
  const career = CG.careers.find((c) => c.name === careerName);
  const lumpy = rnd() < 0.5;
  d.alloc = {};
  for (const [cat, pool] of Object.entries(career.pools || {})) {
    if (!pool || cat === "Magic" || !SK[cat]) continue;
    const idx = SK[cat].map((_, i) => i);
    for (const [i, v] of Object.entries(spend(pool, lumpy ? idx.slice(0, 3) : idx, lumpy))) d.alloc[cat + "_" + i] = v;
  }
  const scores = pickN(CG.abilityScores, 2);
  d.abilityPicks = scores.map((s) => s.name);
  d.abilityExpertise = scores.map((s) => pick(s.skills));
  d.abilityTalent = scores.map((s) => pick(s.talents));
  d.abilityDescriptor = scores.map((s) => pick(s.descriptors));
  const a = pickN(["resolve", "initiative", "toughness", "dt"], 4);
  d.attrSpend = { resolve: 0, initiative: 0, toughness: 0, dt: 0 };
  let pts = 5; while (pts > 0) { d.attrSpend[pick(a)]++; pts--; }
  if (rnd() < 0.15) { d.randomizedInit = true; d.initRoll = 6 + 1 + Math.floor(rnd() * 6); }
  if (rnd() < 0.15) { d.randomizedDT = true; d.dtRoll = 15 + 2 + Math.floor(rnd() * 7); }
  const culture = pick(CG.culturalBackgrounds);
  d.cultureBgName = culture.name; d.cultureBgFor = culture.name;
  d.cultureBgPicks = {};
  culture.picks.forEach((p, i) => {
    const opts = Array.isArray(p.options) ? p.options
      : String(p.options).slice(4).split("+").reduce((o, c) => o.concat(SK[c] || []), []);
    d.cultureBgPicks[i] = pickN(opts, p.count || 1);
  });
  if (["Human", "The Replaced"].includes(raceName)) {
    const hc = pick(CG.humanCultures);
    d.humanCultureName = hc.name; d.humanCultureLang = hc.language; d.humanCultureRange = hc.range;
    d.raceExpertisePick = raceName === "Human" ? pick(SK.Social) : "";
  }
  const race = CG.races.find((r) => r.name === raceName);
  if ((race.savvy || []).length && !(race.savvy.length === 1 && Object.values(SK).flat().includes(race.savvy[0]))) {
    const named = race.savvy.filter((x) => Object.values(SK).flat().includes(x));
    d.raceSavvyPick = named.length ? pick(named) : pick(Object.values(SK).flat());
  }
  for (const key of ["origin", "youth", "recent"]) {
    const ev = pick(LE[key]);
    d.lifeEvents[key] = ev;
    d.lifeChoice[key] = Math.floor(rnd() * Math.max(1, (ev.options || []).length));
    const opt = (ev.options || [])[d.lifeChoice[key]];
    if (opt && opt.kind === "skill-any") d.lifeChoiceExtra[key] = pick(opt.options || [""]);
    if (opt && (opt.kind === "bind" || opt.kind === "strand") && !opt.name && MAGIC)
      d.lifeChoiceExtra[key] = pick((opt.kind === "bind" ? MAGIC.binds : MAGIC.strands).map((x) => x.name));
  }
  const age = pick(CG.roundingOutAges);
  d.roAge = age.key;
  d.roAlloc = spend(age.anyPoints || 0, Object.values(SK).flat(), lumpy);
  if (age.lorePoints) d.roLoreAlloc = spend(age.lorePoints, SK.Lore.slice(), lumpy);
  if (age.expertise) d.roOldExpertiseSkill = pick(Object.values(SK).flat());
  d.roSavvy = pickN(Object.values(SK).flat(), 3);
  d.roBonusChoice = pick(["talent", "status", "money"]);
  d.wises = Math.floor(rnd() * 3);
  d.personalityPicks = pickN(CG.personalityTraits.map((t) => t.name || t), 2);
  if (MAGIC) {
    const binds = MAGIC.binds.map((b) => b.name), strands = MAGIC.strands.map((x) => x.name);
    if (/Bind skill of their choice/i.test(race.bonus || "")) d.raceBindPick = pick(binds);
    if (careerName === "Spellweaver") {
      d.convocation = pick(MAGIC.convocations).name;
      d.swBinds = pickN(binds, 2);
      d.swStrands = pickN(strands, 4);
      d.swThin = pickN(strands.filter((s) => !d.swStrands.includes(s)), 2);
      d.magicAlloc = spend(100, binds.slice(), true);
      d.strandAlloc = spend(10, d.swStrands.slice(), false);
      d.strandExtra = spend(3, d.swStrands.slice(), false);
      d.threadAttunement = "Bind:" + d.swBinds[0];
      d.bindExpertise = pick(binds);
      d.trueName = rnd() < 0.5 ? "Ashvel" : "";
    } else if (rnd() < 0.2) {
      d.takeFade = true;
      d.fadeStrands = spend(5, strands.slice(), false);
    }
    if (rnd() < 0.3) { d.roBindAlloc = spend(20, binds.slice(), true); d.roStrandAlloc = spend(2, strands.slice(), false); }
  }
  return d;
}

/* ------------------------------------------------------------------ run */
console.log("\n1. The built Wizard loads in Node, and hands over its data");
const H = loadWizard();
const G = await H.fn(...H.args);
const W0 = H.getWizard();
check(!!W0 && typeof W0.commit === "function", "the Wizard class was constructed, with its real commit()");
check(G && G.TBE && G.TBE_CHARGEN && G.TBE_TALENTS && G.TBE_LIFE_EVENTS, "and its data blocks are reachable");
const defaultDraft = JSON.parse(JSON.stringify(W0.draft));
const ctxFor = () => ({
  data: G.TBE_CHARGEN, magic: G.TBE_MAGIC, talents: G.TBE_TALENTS,
  lib: { SKILL_GROUPS: G.TBE.SKILL_GROUPS, CHARGEN_SKILL_CAP: G.TBE.CHARGEN_SKILL_CAP,
    applyAbilityScore: G.TBE.applyAbilityScore, raiseExpertise: G.TBE.raiseExpertise, talentNamed: G.TBE.talentNamed },
  rolls: { armorPieces: DICE["1d3+1"], equipCoin: DICE["2d4*50"] }
});

async function runWizard(draft) {
  const W = H.getWizard();
  const actor = mkActor();
  W.actor = actor;
  W.draft = JSON.parse(JSON.stringify(draft));
  W._committed = false;
  await W.commit();
  return fromWizard(actor.rec);
}

console.log("\n2. Every race x career, plus random drafts: commit() and derive() agree");
const CG = G.TBE_CHARGEN;
const drafts = [];
for (const r of CG.races) for (const c of CG.careers) drafts.push(makeDraft({ defaultDraft }, G, r.name, c.name));
for (let i = 0; i < 300; i++) drafts.push(makeDraft({ defaultDraft }, G, pick(CG.races).name, pick(CG.careers).name));

const ORDER_EXPLAINED = [];
const unexplained = [];
let matched = 0;
for (const d of drafts) {
  const w = await runWizard(d);
  const ctx = ctxFor();
  const career = CG.careers.find((c) => c.name === d.careerName);
  const culture = CG.culturalBackgrounds.find((c) => c.name === d.cultureBgName);
  ctx.rolls.careerSilver = career.silver ? diceFor(career.silver) : null;
  ctx.rolls.cultureSilver = culture && culture.silver ? diceFor(culture.silver) : null;
  const c = derive(d, ctx);
  const x = fromDerive(c, 0);
  const diffs = diff(w, x);
  if (!diffs.length) { matched++; continue; }
  const race = CG.races.find((r) => r.name === d.raceName);
  const penal = new Set((race.skillMods || []).filter((m) => m.mod < 0).map((m) => m.skill));
  const rest = diffs.filter((df) => {
    const m = df.path.match(/^skills\.(.+)\.value$/);
    /* ORDER: a racially penalised skill, where derive (race first, then the
       increases, capped) lands HIGHER than the Wizard (increases capped at 70
       first, then the penalty). */
    return !(m && penal.has(m[1]) && df.derive > df.wizard);
  });
  if (rest.length) unexplained.push({ race: d.raceName, career: d.careerName, diffs: rest.slice(0, 6) });
  else ORDER_EXPLAINED.push({ race: d.raceName, career: d.careerName, diffs });
}
check(drafts.length >= 360, drafts.length + " drafts run through both");
check(unexplained.length === 0, "no mismatch the book's step order does not explain", unexplained.slice(0, 3));
console.log("  INFO  " + matched + " drafts identical; " + ORDER_EXPLAINED.length +
  " differ only where the Wizard capped a skill at 70 before applying a racial penalty");
if (ORDER_EXPLAINED.length) console.log("  INFO  e.g. " + JSON.stringify(ORDER_EXPLAINED[0]).slice(0, 300));
/* v0.51.0 moved the Wizard's Career step to the book's place, so the
   classifier above should now find nothing to explain. */
check(ORDER_EXPLAINED.length === 0 && matched === drafts.length, "every draft is identical in every field", { matched, order: ORDER_EXPLAINED.length });

console.log("\n3. The Wizard's own Attributes page against its own commit()");
{
  /* Found while scoping stage 1: the page leaves out the race's Toughness. */
  const ogre = makeDraft({ defaultDraft }, G, "Ogre", "Warrior");
  ogre.attrSpend = { resolve: 1, initiative: 1, toughness: 2, dt: 1 };
  const W = H.getWizard();
  W.draft = JSON.parse(JSON.stringify(ogre));
  const page = W._step_attributes();
  const shown = Number((page.match(/Toughness <b>(-?\d+)<\/b>/) || [])[1]);
  const written = (await runWizard(ogre)).update["system.toughness"];
  const derived = derive(ogre, ctxFor()).attributes.toughness;
  check(derived.value === written, "derive gives the Toughness commit() writes for an Ogre (" + written + ")", derived.value);
  check(derived.sources.some((s) => /Race: Ogre/.test(s.label) && s.delta === 1), "and says where the +1 came from", derived.sources);
  check(shown === written, "the Attributes page shows the Toughness commit() writes (it left out the race's until v0.51.0)", { shown, written });
}

console.log("\n4. Provenance: every number says where it came from");
{
  let missing = [];
  for (const d of drafts.slice(0, 120)) {
    const c = derive(d, (() => { const x = ctxFor(); x.rolls.careerSilver = 1; x.rolls.cultureSilver = 1; return x; })());
    for (const [n, v] of Object.entries(c.skills)) {
      const sum = 20 + v.sources.reduce((a, s) => a + (s.delta || 0), 0);
      if (sum !== v.value) missing.push({ n, value: v.value, sum, sources: v.sources });
    }
    for (const [k, a] of Object.entries(c.attributes)) {
      const sum = a.sources.reduce((x, s) => x + (s.delta || 0), 0);
      if (sum !== a.value) missing.push({ k, value: a.value, sum });
    }
  }
  check(missing.length === 0, "every skill and attribute equals the sum of its sources", missing.slice(0, 3));
  const d = drafts.find((x) => x.raceName === "Ogre");
  const c = derive(d, ctxFor());
  check(c.skills["Melee: Light"].sources.some((s) => s.label === "Race: Ogre" && s.delta < 0),
    "an Ogre's Melee: Light names the racial -20 as a source");
  check(c.silver.total === null, "silver is null, not a guess, while a die is still unrolled");
}

console.log("\n5. derive is pure");
{
  const d = drafts[7];
  const before = JSON.stringify(d);
  const a = JSON.stringify(derive(d, ctxFor())), b = JSON.stringify(derive(d, ctxFor()));
  check(a === b, "the same choices give the same character");
  check(JSON.stringify(d) === before, "and the draft is not modified");
  const src = fs.readFileSync("system/the-broken-empires/module/chargen/derive.mjs", "utf8");
  check(!/\b(game|canvas|ui|CONFIG|Roll|Math\.random)\b/.test(src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "")),
    "it reads no Foundry global and rolls nothing");
}

console.log("\n6. Book order, pinned by hand where the cap bites");
{
  /* A racial penalty on a skill the career then maxes: book order keeps the
     increase, the Wizard's order loses it. Pinned by hand so it cannot pass
     by the random drafts simply not reaching the cap. */
  const d = JSON.parse(JSON.stringify(defaultDraft));
  d.raceName = "Ogre"; d.careerName = "Warrior";
  const idx = G.TBE.SKILL_GROUPS.Combat.indexOf("Melee: Light");
  d.boost = { Combat: "Melee: Light" };
  d.alloc = { ["Combat_" + idx]: 50 };
  const c = derive(d, ctxFor());
  /* Book: 20 (+10 boost) = 30, Ogre -20 = 10, +50 career = 60. */
  check(c.skills["Melee: Light"].value === 60, "Ogre Warrior, Melee: Light: 30 -20 +50 = 60 in book order", c.skills["Melee: Light"].value);
  const w = await runWizard(d);
  check(w.skills["Melee: Light"].value === 60, "and so does the shipping Wizard (it wrote 50 before v0.51.0: 30 +50 capped at 70, then -20)", w.skills["Melee: Light"].value);
}

console.log("\n7. A Warrior gets Armor Training III (p.102); an Ogre only once (Ch.5)");
{
  /* Until v0.51.0 no Wizard-built Warrior got Armor Training at all: the
     career says "Armor Training III", the catalogue says "Armor Training
     (I-IV)", and the lookup matched names exactly. Both copies of the
     calculation agreed on the missing Talent, which is why parity alone
     could not see it: this pins what the book says instead. */
  const mk = (race) => { const d = JSON.parse(JSON.stringify(defaultDraft)); d.raceName = race; d.careerName = "Warrior"; return d; };
  const human = derive(mk("Human"), ctxFor()).talents.find((t) => /^Armor Training/.test(t.name));
  check(human && human.ranks === 3 && /Scale/.test(human.specialization), "Human Warrior: Armor Training at rank 3 (up to Scale)", human);
  const wHuman = (await runWizard(mk("Human"))).talents["Armor Training (I-IV)"];
  check(wHuman && wHuman.ranks === 3, "and the shipping Wizard now writes it too", wHuman);
  const ogre = derive(mk("Ogre"), ctxFor()).talents.find((t) => /^Armor Training/.test(t.name));
  check(ogre && ogre.ranks === 1 && /Bone armor/.test(ogre.specialization), "Ogre Warrior: capped at 1 rank, bone armor only", ogre);
}

console.log("\n8. The book's own worked example: Hadrion (Ch.7, pp.80-108)");
{
  /* Every choice Brian makes for Hadrion, as a draft, and the totals the book
     prints after each step. The expectations are the BOOK's numbers, not the
     Wizard's, so this is the one part of the check that can catch the Wizard
     and derive being wrong together. */
  const SK = G.TBE.SKILL_GROUPS;
  const at = (cat, name) => cat + "_" + SK[cat].indexOf(name);
  const LE = G.TBE_LIFE_EVENTS;
  const ev = (k, n) => LE[k].find((e) => e.name.indexOf(n) === 0);
  const d = JSON.parse(JSON.stringify(defaultDraft));
  Object.assign(d, {
    raceName: "Human", careerName: "Spellweaver", concept: "a druid from the fading southern lands of Old Vestria",
    boost: { Combat: "Dodge", Adventuring: "Willpower", Social: "Protocol", Lore: "Arcana" },
    raceSavvyPick: "Arcana",
    humanCultureName: "Old Vestrians", humanCultureRange: "59-64", humanCultureLang: "Low Vestrian",
    abilityPicks: ["Intelligence", "Charisma"], abilityExpertise: ["Ancient Lore", "Persuade"],
    abilityTalent: ["Inner Strength", "Press the Point"], abilityDescriptor: ["Well-read", "Affable"],
    attrSpend: { resolve: 2, initiative: 1, toughness: 2, dt: 0 },
    cultureBgName: "Civilized, Urban", cultureBgFor: "Civilized, Urban",
    cultureBgPicks: { 0: ["Protocol"], 1: ["Common Lore"], 2: ["Missile", "Dodge"], 3: ["Perception"],
      4: ["Deceive", "Insight", "Intimidate", "Wit"], 5: ["Arcana"], 6: ["Commerce"], 7: ["Craft: Artistic"],
      8: ["Heal"], 9: ["Streetwise"], 10: ["Perception"], 11: ["Arcana"] },
    lifeEvents: { origin: ev("origin", "Heretic"), youth: ev("youth", "Strange Flora"), recent: ev("recent", "Fortune Dealer") },
    lifeChoice: { origin: 2, youth: 0, recent: 0 }, lifeChoiceExtra: { origin: "", youth: "", recent: "" },
    alloc: { [at("Combat", "Dodge")]: 10, [at("Combat", "Missile")]: 10,
      [at("Adventuring", "Endurance")]: 5, [at("Adventuring", "Perception")]: 10, [at("Adventuring", "Willpower")]: 5,
      [at("Social", "Insight")]: 20,
      [at("Lore", "Ancient Lore")]: 10, [at("Lore", "Arcana")]: 15, [at("Lore", "Craft: Artistic")]: 15 },
    convocation: "Druid", swBinds: ["Change", "Control"], swStrands: ["Beast", "Earth", "Plant", "Water"], swThin: ["Spheres", "Spirit"],
    magicAlloc: { Change: 30, Control: 40, Destroy: 20, Witness: 10 },
    strandAlloc: { Beast: 4, Earth: 1, Plant: 3, Water: 2 }, strandExtra: { Body: 2, Thought: 1 },
    bindExpertise: "Control", trueName: "Varimaxx Cusoris", threadAttunement: "Strand:Beast",
    roAge: "Adult", roAlloc: { Missile: 20, Endurance: 20, Willpower: 15, Protocol: 10 },
    roBindAlloc: { Change: 10, Witness: 5 }, roStrandAlloc: { Beast: 1 }, roSavvy: ["Perception", "Insight", null],
    roBonusChoice: "talent"
  });
  const ctx = ctxFor(); ctx.rolls.careerSilver = 25; ctx.rolls.cultureSilver = 30;
  const c = derive(d, ctx);
  const upTo = (name, prefixes) => 20 + c.skills[name].sources
    .filter((s) => prefixes.some((p) => s.label.indexOf(p) === 0)).reduce((n, s) => n + (s.delta || 0), 0);
  const expectAt = (label, prefixes, book) => {
    const bad = Object.entries(book).filter(([n, v]) => upTo(n, prefixes) !== v).map(([n, v]) => n + " book " + v + ", derive " + upTo(n, prefixes));
    check(bad.length === 0, label, bad);
  };
  const P1 = ["Starting skill", "Race"], P3 = P1.concat(["Ability Score"]), P5 = P3.concat(["Culture"]),
    P6 = P5.concat(["Life Event"]), P7 = P6.concat(["Career"]);
  expectAt("after Ability Scores (p.86)", P3, { "Locks & Traps": 25, Protocol: 35, Wit: 25, "Ancient Lore": 25, Arcana: 35,
    Commerce: 25, "Common Lore": 25, Deceive: 25, Inspire: 25, Perform: 25, Persuade: 25, Seduce: 25, Streetwise: 25 });
  expectAt("after Cultural Background (p.90)", P5, { "Common Lore": 45, Protocol: 55, Missile: 30, Dodge: 40, Perception: 30,
    Deceive: 35, Insight: 30, Intimidate: 30, Wit: 35, Arcana: 45, Commerce: 35, "Craft: Artistic": 30, Heal: 30, Streetwise: 35 });
  expectAt("after Life Events (p.91)", P6, { Willpower: 40, Arcana: 55 });
  expectAt("after Previous Career (p.106)", P7, { Dodge: 50, Missile: 40, Endurance: 25, Perception: 40, Willpower: 45,
    Insight: 50, "Ancient Lore": 35, Arcana: 70, "Craft: Artistic": 45 });
  expectAt("after Rounding Out (p.108)", P7.concat(["Rounding Out"]), { Missile: 60, Endurance: 45, Willpower: 60, Protocol: 65 });
  const ex = ["Ancient Lore", "Persuade", "Perception", "Arcana"].filter((n) => c.skills[n].expertise !== 2);
  check(ex.length === 0, "Ex2 in Ancient Lore, Persuade (Ability Scores), Perception and Arcana (Culture)", ex);
  const bind = (n) => (c.extraSkills.find((x) => x.name === "Bind: " + n) || {});
  check(bind("Change").value === 50 && bind("Control").value === 50 && bind("Destroy").value === 20 && bind("Witness").value === 15,
    "Binds: Change 50, Control 50, Destroy 20, Witness 15 (p.106, then Rounding Out)", ["Change", "Control", "Destroy", "Witness"].map((n) => bind(n).value));
  check(bind("Control").expertise === 2, "Ex2 in Bind: Control");
  const lv = Object.fromEntries(c.strands.map((x) => [x.name, x.level]));
  check(JSON.stringify(lv) === JSON.stringify({ Beast: 5, Body: 2, Earth: 1, Plant: 5, Thought: 1, Water: 2 }) ||
        (lv.Beast === 5 && lv.Earth === 1 && lv.Plant === 5 && lv.Water === 2 && lv.Body === 2 && lv.Thought === 1 && c.strands.length === 6),
    "Strands: Beast 5, Earth 1, Plant 5 (with the Life Event +2), Water 2, Body 2, Thought 1", lv);
  const A = c.attributes;
  check(A.resolveMax.value === 14, "Max Resolve 14 before Inner Strength's +1 (p.87 makes it 15; that Talent adds it on the actor)", A.resolveMax.value);
  check(A.toughness.value === 1 && A.initiative.value === 11 && A.deathThreshold.value === 20 && Math.ceil(A.deathThreshold.value / 3) === 7,
    "Toughness +1, Initiative +11, Death Threshold 20, Lethality Level 7 (p.87)",
    { t: A.toughness.value, i: A.initiative.value, dt: A.deathThreshold.value });
  const tal = c.talents.map((t) => t.name.toLowerCase());
  check(["Patterned in the Weave", "Literate", "Inner Strength", "Press the Point"].every((n) => tal.includes(n.toLowerCase())),
    "Talents: Patterned in the Weave, Literate (career), Inner Strength, Press the Point (Ability Scores)", tal);
  const langs = c.extraSkills.filter((x) => x.group === "Language").map((x) => x.name + " " + x.value);
  check(langs.length === 2 && langs.includes("Low Vestrian (Old Vestrian) 70") && langs.includes("High Vestrian 20"),
    "Old Vestrian: Low Vestrian 70 and High Vestrian 20 INSTEAD of the usual two (p.81)", langs);
  const same = diff(await runWizard(d), fromDerive(Object.assign(c, {}), 0))
    .filter((x) => !/^update\.system\.silver$/.test(x.path));
  check(same.length === 0, "and the shipping Wizard builds the same Hadrion", same.slice(0, 5));
  /* Choices the book makes for Hadrion that the Wizard has no field for.
     Reported so they are not mistaken for passes; stage 2 is where they go. */
  console.log("  GAP   not representable in today's Wizard: the Human's extra Expertise on a Bind (Ex3 Bind: Control, p.108),");
  console.log("        a Bind as a Savvy pick (Bind: Change), Rounding Out points on a custom -wise (Ritual-wise +5),");
  console.log("        the Shared History +5 Divinity, and the free Talents (Forceful Strand: Plants, Steely Thews).");
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
