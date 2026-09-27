#!/usr/bin/env node
/*
 * creator_check.mjs -- the character creation window (module/chargen, v0.52.0).
 *
 * What it holds, in order:
 *   1. MIRRORS. rules.mjs carries the system's own copies of rules the macro
 *      library owns for the flat macros (skill catalogue, cap, Expertise
 *      ladder, Ability Score rule, Talent lookup and Item shape, the table
 *      range reading, the Ability Score double). Each is run side by side
 *      with the library's over its whole input space. A mutation drifts one
 *      and confirms the sweep sees it.
 *   2. EVERY PAGE RENDERS for every race x career, every sub-tab, and prints
 *      no "undefined" or "NaN".
 *   3. NO DEAD INPUT, NO UNREACHABLE CHOICE (CLAUDE.md rule 2). Every
 *      data-bind names a draft field, and every draft field derive() reads is
 *      set by some input or action. A mutation removes the True Name box and
 *      confirms the check fails.
 *   4. SEQUENCES (rule 9). Change race, career, culture, an Ability Score, a
 *      Life Event: the picks that stop making sense are cleared, the ones
 *      that still do are kept.
 *   5. SILENCE. A finished draft has nothing open; Goals and Status are never
 *      open (the book marks both optional).
 *   6. CREATE writes what the sheet shows: the payload is read off derive(),
 *      and without permission nothing at all is written (rule 6, and the
 *      multiplayer rule 2). A mutation that skips the permission question is
 *      caught.
 *   7. THE REAL WINDOW in headless Chromium, behind a small ApplicationV2
 *      shim: click through all twelve steps like a player, type into a
 *      points box and keep the caret, Create, then close half way and
 *      resume. Screenshots to test-screenshots/creator/.
 */
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SYS = path.join(__dirname, "system", "the-broken-empires");
const CG = path.join(SYS, "module", "chargen");
let pass = 0, fail = 0;
const check = (cond, label, extra) => {
  if (cond) { pass++; console.log("  PASS  " + label); }
  else { fail++; console.log("  FAIL  " + label + (extra !== undefined ? "  <- " + JSON.stringify(extra).slice(0, 500) : "")); }
};
const imp = (f) => import(pathToFileURL(path.join(CG, f)).href + "?t=" + Date.now());

const { TABLES } = await imp("tables.mjs");
const R = await imp("rules.mjs");
const DR = await imp("draft.mjs");
const S = await imp("steps.mjs");
const A = await imp("actions.mjs");
const C = await imp("creator.mjs");
const CM = await imp("commit.mjs");
const T = Object.assign({}, TABLES, { skillGroups: R.SKILL_GROUPS });

/* The macro library, loaded the way concepts_check.mjs loads it. */
let scripted = [];
globalThis.Roll = class { constructor(f) { this.formula = f; } async evaluate() { this.total = scripted.length ? scripted.shift() : 1; return this; } };
const TBE = new Function(fs.readFileSync(path.join(__dirname, "macros/_lib.js"), "utf8") + "\n;return TBE;")();

/* ------------------------------------------------------------------------ */
console.log("\n1. The system's rule copies equal the macro library's");
{
  check(JSON.stringify(R.SKILL_GROUPS) === JSON.stringify(TBE.SKILL_GROUPS), "skill catalogue, name for name and in order");
  check(R.CHARGEN_SKILL_CAP === TBE.CHARGEN_SKILL_CAP && R.CHARGEN_SKILL_CAP === 70, "creation cap 70 (p.80)");
  check([0, 1, 2, 3, 4, 5].every((n) => R.raiseExpertise(n) === TBE.raiseExpertise(n)), "Expertise ladder at every rung");
  const score = T.chargen.abilityScores;
  let same = true;
  for (const s of score) for (const ex of [null, ...s.skills]) for (const start of [20, 30, 67, 70]) {
    const mk = () => Object.fromEntries(R.SKILL_ALL.map((n) => [n, { value: start, expertise: n === ex ? 2 : 0 }]));
    const a = mk(), b = mk();
    const la = R.applyAbilityScore(a, s, ex, 70), lb = TBE.applyAbilityScore(b, s, ex, 70);
    if (la !== lb || JSON.stringify(a) !== JSON.stringify(b)) same = false;
  }
  check(same, "Ability Score rule, every score x every Expertise pick x four starting values");
  const names = T.talents.map((t) => t.name).concat(["Armor Training III", "armor training i", "Literate", "Nope", "", "Savvy"]);
  check(names.every((n) => (R.talentNamed(T.talents, n)?.name ?? null) === (TBE.talentNamed(T.talents, n)?.name ?? null)), "Talent lookup, every catalogue name and the rank-suffix forms");
  check(T.talents.every((t) => JSON.stringify(R.talentItem(t, "spec")) === JSON.stringify(TBE.talentItem(t, "spec"))), "Talent Item shape, effects included, for all " + T.talents.length);

  /* The Wizard's range reading, sliced out of the macro. */
  const w = fs.readFileSync(path.join(__dirname, "macros/tbe-character-wizard.js"), "utf8");
  const src = w.slice(w.indexOf("function parseD100Range"), w.indexOf("function raceForRoll"));
  const W = new Function(src + "; return { parseD100Range, forRoll };")();
  const tables = [[T.chargen.races, "d100", 100], [T.chargen.humanCultures, "range", 100], [T.chargen.culturalBackgrounds, "range", 10],
    ...["origin", "youth", "recent"].map((k) => [T.lifeEvents[k], "range", 100])];
  let diff = [], covered = true;
  for (const [tab, key, max] of tables) for (let r = 1; r <= max; r++) {
    const a = R.rowForRoll(tab, r, key, max), b = W.forRoll(tab, r, key, max);
    if (a !== b) diff.push(key + " " + r);
    if (!a) covered = false;
  }
  check(!diff.length, "table ranges read the same as the Wizard's, every face of every table", diff.slice(0, 5));
  check(covered, "every face of every table lands on a row (the trailing-0 rule)");

  const scores = T.chargen.abilityScores;
  let pairOk = true;
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) {
    scripted = [a, b];
    const lib = await TBE.rollAbilityPair(scores);
    const mine = R.abilityPairFromRolls(scores, a, b);
    if (lib.picks[0]?.name !== mine[0]?.name || lib.picks[1]?.name !== mine[1]?.name) pairOk = false;
  }
  check(pairOk, "Ability Score pair, all 36 rolls, doubles included");
  /* Mutation: a pair reader that lets a double stand. */
  const drift = (L, a, b) => [L[a - 1], L[b - 1]];
  let caught = false;
  for (let a = 1; a <= 6; a++) { scripted = [a, a]; const lib = await TBE.rollAbilityPair(scores); if (lib.picks[1]?.name !== drift(scores, a, a)[1]?.name) caught = true; }
  check(caught, "mutation: a reader that keeps a double is told apart from the library's");
}

/* ------------------------------------------------------------------------ */
let seed = 11;
const rnd = (n) => { seed = (seed * 9301 + 49297) % 233280; return Math.floor((seed / 233280) * n) + 1; };
const fakeRoll = async (f) => {
  const m = String(f).match(/^(\d+)d(\d+)(?:\*(\d+))?(?:\+(\d+))?$/);
  let t = 0;
  for (let i = 0; i < +m[1]; i++) t += rnd(+m[2]);
  if (m[3]) t *= +m[3];
  if (m[4]) t += +m[4];
  return { total: t, roll: { formula: f, total: t } };
};
const chat = [];
const mkEnv = (d, ui = {}) => {
  const ch = C.deriveWith(T, d);
  return { d, T, ch, st: DR.stepStatus(T, d, ch), ui, isGM: true, actorName: "Check", concepts: C.conceptColumns(T, null), customConcepts: null,
    roll: fakeRoll, say: async (t, b, r) => chat.push({ t, b, r }), random: rnd, notify: () => {}, settings: { get: () => null, set: async () => {} } };
};
const SUBS = { life: ["events", "npcs", "shared"], career: ["points", "slots", "talents", "magic"], rounding: ["Combat", "Other", "Magic"] };
function renderAll(d, steps = S) {
  const out = [];
  for (const st of DR.STEPS) {
    const keys = SUBS[st.key] || [null];
    for (const k of keys) {
      const ui = { lifeSub: k, careerSub: k, roCat: k, lifeTable: "origin", sheetAll: true, conceptEditor: true };
      out.push({ step: st.key, sub: k, html: steps.renderStep(st.key, mkEnv(d, ui)) });
    }
  }
  return out;
}

console.log("\n2. Every page renders, for every race and career");
{
  const bad = [];
  let pages = 0;
  for (const race of T.chargen.races) for (const career of T.chargen.careers) {
    const d = DR.defaultDraft(T);
    d.raceName = race.name; d.careerName = career.name; d.takeFade = career.name !== "Spellweaver";
    d.cultureBgName = T.chargen.culturalBackgrounds[0].name; d.roAge = "Old"; d.humanCultureRange = "59-64";
    d.lifeEvents = { origin: T.lifeEvents.origin[0], youth: T.lifeEvents.youth[3], recent: T.lifeEvents.recent[5] };
    d.lifeChoice = { origin: 0, youth: 1, recent: 0 };
    try {
      for (const p of renderAll(d)) {
        pages++;
        if (/\bundefined\b|\bNaN\b/.test(p.html.replace(/<[^>]*>/g, " "))) bad.push(race.name + "/" + career.name + "/" + p.step + "/" + p.sub);
      }
    } catch (e) { bad.push(race.name + "/" + career.name + ": " + e.message); }
  }
  check(!bad.length, pages + " pages rendered with no error, no 'undefined', no 'NaN'", bad.slice(0, 5));
  const d = DR.defaultDraft(T);
  d.concept = "<script>alert(1)</script>";
  const html = S.renderStep("concept", mkEnv(d));
  check(!html.includes("<script>alert") && html.includes("&lt;script&gt;"), "typed text is escaped, not injected");
}

console.log("\n3. No dead input, no unreachable choice");
function boundTops(steps) {
  const tops = new Set();
  const d = DR.defaultDraft(T);
  d.raceName = "Human"; d.careerName = "Spellweaver"; d.cultureBgName = T.chargen.culturalBackgrounds[0].name; d.roAge = "Old"; d.humanCultureRange = "13-24";
  d.swStrands = ["Air", "Earth", "Fire", "Water"].filter((n) => (T.magic.strands || []).some((x) => x.name === n));
  d.randomizedInit = true; d.randomizedDT = true; d.roBonusChoice = "talent"; d.abilityPicks = ["Strength", "Wisdom"];
  d.lifeEvents = { origin: T.lifeEvents.origin.find((e) => (e.options || []).some((o) => o.kind === "skill-any")) || T.lifeEvents.origin[0], youth: T.lifeEvents.youth[0], recent: T.lifeEvents.recent[0] };
  d.lifeChoice = { origin: (d.lifeEvents.origin.options || []).findIndex((o) => o.kind === "skill-any"), youth: 0, recent: 0 };
  d.relationshipNpcs = [{ type: "Friend", name: "", note: "" }]; d.sharedHistory = [{ with: "", skill: "", group: "Wise" }]; d.goals = [{ text: "x", kind: "individual" }];
  d.statusAdjust = 1; d.freeTalents = [{ slot: "rounding", name: "Savvy", spec: "" }];
  const d2 = Object.assign(DR.defaultDraft(T), { raceName: "Bolg Fiir", careerName: "Warrior", takeFade: true });
  for (const dd of [d, d2]) for (const p of renderAll(dd, steps)) {
    for (const m of p.html.matchAll(/data-bind="([^"]+)"/g)) tops.add(m[1].split(".")[0]);
  }
  return tops;
}
{
  const tops = boundTops(S);
  const draftKeys = new Set(Object.keys(DR.defaultDraft(T)).concat(["freeTalent", "initRoll", "dtRoll", "nameList", "abilityPick", "lifeEvent"]));
  const stray = [...tops].filter((k) => !draftKeys.has(k));
  check(!stray.length, "every data-bind (" + tops.size + " fields) names a field of the draft", stray);

  const dsrc = fs.readFileSync(path.join(CG, "derive.mjs"), "utf8");
  const reads = new Set([...dsrc.matchAll(/\bd\.(\w+)/g)].map((m) => m[1]));
  /* Set by a button rather than a box: rolls and the lists you add to. */
  const byAction = new Set(["rolls", "lifeEvents", "initRoll", "dtRoll", "conceptPicks", "purchases", "freeArmor", "goals", "freeTalents", "relationshipNpcs", "sharedHistory", "personalityPicks", "swBinds", "swStrands", "swThin", "abilityPicks"]);
  /* v: the draft's own version. binds: the count of blank Bind slots, read
     only when the magic tables are missing, which they never are in the
     system (tables.mjs always carries them). */
  const internal = new Set(["v", "binds"]);
  const unreachable = [...reads].filter((k) => !tops.has(k) && !byAction.has(k) && !internal.has(k));
  check(!unreachable.length, "every one of the " + reads.size + " draft fields derive() reads has a box or a button", unreachable);
  const asrc = fs.readFileSync(path.join(CG, "actions.mjs"), "utf8");
  const actionSets = [...byAction].filter((k) => !new RegExp("d\\." + k + "\\b|\"" + k + "\"").test(asrc) && !tops.has(k));
  check(!actionSets.length, "and every field claimed to be set by a button really is set in actions.mjs", actionSets);

  /* Mutation: drop the True Name box. */
  const mutPath = path.join(CG, "_mut_steps.mjs");
  fs.writeFileSync(mutPath, fs.readFileSync(path.join(CG, "steps.mjs"), "utf8").replace(/W\.text\("trueName"[^)]*\)/, '""'));
  try {
    const M = await import(pathToFileURL(mutPath).href + "?m=" + Date.now());
    const t2 = boundTops(M);
    check(!t2.has("trueName") && reads.has("trueName"), "mutation: with the True Name box gone, the check reports it unreachable");
  } finally { fs.rmSync(mutPath, { force: true }); }
}

console.log("\n4. Sequences: what a change clears, and what it keeps");
{
  const d = DR.defaultDraft(T);
  const set = (bind, value, key) => A.setBound(d, T, { bind, key, value });
  set("raceName", "Human"); set("humanCultureRange", "13-24"); set("raceSavvyPick", "Stealth"); set("raceExpertisePick", "Perception");
  check(d.humanCultureName === "Angevarre" && d.humanCultureLang === "Angevarran", "homeland sets its name and the first Language offered", [d.humanCultureName, d.humanCultureLang]);
  A.setBound(d, T, { bind: "freeTalent", key: "race", sub: "name", value: "Tough", source: "Race: Human" });
  check(d.freeTalents.length === 1, "Human's extra Talent is held");
  set("raceName", "Ogre");
  check(!d.humanCultureRange && !d.raceSavvyPick && !d.raceExpertisePick && !d.freeTalents.some((f) => f.slot === "race"),
    "changing to Ogre clears the homeland, the Savvy and Expertise picks, and the Human's extra Talent", d);
  set("raceName", "Bolg Fiir"); set("raceSavvyPick", "Missile");
  set("raceName", "Bolg Fiir");
  check(d.raceSavvyPick === "Missile", "re-choosing the same race keeps its picks");

  set("careerName", "Warrior"); set("alloc", 20, "Combat_0");
  A.setBound(d, T, { bind: "freeTalent", key: "career0_0", sub: "name", value: "Tough", source: "Career" });
  A.setBound(d, T, { bind: "freeTalent", key: "rounding", sub: "name", value: "Savvy", source: "RO" });
  set("careerTalentSwap", "auto:Armor Training III");
  set("careerName", "Rogue");
  check(!Object.keys(d.alloc).length && !d.freeTalents.some((f) => /^career/.test(f.slot)) && d.freeTalents.some((f) => f.slot === "rounding") && !d.careerTalentSwap,
    "changing career clears its points, its free picks and its swap, and keeps the Rounding Out Talent", d.freeTalents);

  set("cultureBgName", T.chargen.culturalBackgrounds[0].name); set("cultureBgPicks.0", "Deceive", 0);
  set("cultureBgName", T.chargen.culturalBackgrounds[1].name);
  check(!Object.keys(d.cultureBgPicks).length, "changing culture clears its picks");

  set("abilityPicks", "Strength", 0); set("abilityExpertise", "Thrown", 0); set("abilityTalent", "Strong Back", 0);
  set("abilityPicks", "Dexterity", 1); set("abilityExpertise", "Dodge", 1);
  set("abilityPicks", "Wisdom", 0);
  check(d.abilityExpertise[0] === null && d.abilityTalent[0] === null && d.abilityExpertise[1] === "Dodge", "swapping Ability Score 1 clears its sub-picks and leaves score 2's alone");

  const env = mkEnv(d);
  const ev = T.lifeEvents.origin.find((e) => (e.options || []).length > 1);
  await A.act("life-pick", { key: "origin", value: ev.range }, env);
  check(d.lifeEvents.origin.name === ev.name && d.lifeChoice.origin === null, "a Life Event with a choice starts unchosen (not silently on its first option)");
  const one = T.lifeEvents.youth.find((e) => (e.options || []).length === 1);
  if (one) { await A.act("life-pick", { key: "youth", value: one.range }, env); check(d.lifeChoice.youth === 0, "a one-option Life Event is taken, there is nothing to choose"); }

  /* Rolling fills, and never clobbers a concept typed by hand. */
  d.concept = "my own idea";
  await A.act("roll-concept", {}, mkEnv(d));
  check(d.concept === "my own idea" && d.conceptPicks.role, "rolling a concept leaves a hand-typed one alone");
  d.concept = "";
  await A.act("roll-concept", {}, mkEnv(d));
  check(d.concept.length > 5, "and fills an empty one");

  /* Spreading only fills what is left, only on boxes at 0. */
  const e2 = DR.defaultDraft(T);
  A.setBound(e2, T, { bind: "careerName", value: "Warrior" });
  e2.alloc = { Combat_0: 30 };
  await A.act("spread", { cat: "Combat" }, mkEnv(e2));
  const got = T.skillGroups.Combat.map((_, i) => e2.alloc["Combat_" + i] || 0);
  check(got[0] === 30 && got.reduce((a, b) => a + b, 0) === 80, "Spread what is left keeps a typed 30 and spends exactly the other 50", got);

  /* Buying spends the silver the sheet shows; without silver it refuses. */
  const e3 = DR.defaultDraft(T);
  A.setBound(e3, T, { bind: "careerName", value: "Warrior" }); A.setBound(e3, T, { bind: "cultureBgName", value: "Barbarian" });
  const ui = { buy: { kind: "weapon", name: "Spear", qty: 2 } };
  await A.act("buy", {}, Object.assign(mkEnv(e3, ui), { ui }));
  check(!e3.purchases.length, "buying before the silver is rolled does nothing");
  await A.act("roll-silver", {}, mkEnv(e3));
  const before = C.deriveWith(T, e3).silver.left;
  await A.act("buy", {}, Object.assign(mkEnv(e3, ui), { ui }));
  const spear = T.equipment.weapons.find((x) => x.name === "Spear");
  check(C.deriveWith(T, e3).silver.left === before - 2 * spear.sp, "two Spears cost what the table says, off the total the sheet shows");
  await A.act("roll-armor", {}, mkEnv(e3));
  const ui2 = { freePick: { name: "Mail", loc: "body" } };
  await A.act("take-free", {}, Object.assign(mkEnv(e3, ui2), { ui: ui2 }));
  check(e3.freeArmor.length === 1 && e3.freeArmor[0].name === "Mail", "a Warrior (Armor Training III) may take Mail free");
  const e4 = DR.defaultDraft(T);
  A.setBound(e4, T, { bind: "careerName", value: "Speaker" });
  e4.rolls = { armorPieces: 3 };
  await A.act("take-free", {}, Object.assign(mkEnv(e4, ui2), { ui: ui2 }));
  check(!e4.freeArmor.length, "a Speaker (no training) may not (p.109: \"as long as they have whatever training the armor requires\")");
  const ogre = { name: "Bone", training: "Y" };
  check(R.armorAllowedFree(ogre, [{ name: "Armor Training (I-IV)", ranks: 1 }], "Ogre") && !R.armorAllowedFree({ name: "Mail", training: "Y" }, [{ name: "Armor Training (I-IV)", ranks: 1 }], "Ogre"),
    "an Ogre's one rank covers Bone and nothing else (Ch.5)");
}

console.log("\n5. Silence: a finished character has nothing open");
async function finishedDraft() {
  const d = DR.defaultDraft(T);
  const set = (bind, value, key) => A.setBound(d, T, { bind, key, value });
  d.concept = "Duelist"; for (const [c, n] of Object.entries({ Combat: "Dodge", Adventuring: "Stealth", Social: "Wit", Lore: "Heal" })) set("boost", n, c);
  set("raceName", "Human"); set("humanCultureRange", "01-12"); set("raceSavvyPick", "Stealth"); set("raceExpertisePick", "Dodge");
  A.setBound(d, T, { bind: "freeTalent", key: "race", sub: "name", value: "Tough" });
  set("abilityPicks", "Strength", 0); set("abilityExpertise", "Thrown", 0); set("abilityTalent", "Strong Back", 0); set("abilityDescriptor", "Strong", 0);
  set("abilityPicks", "Dexterity", 1); const dex = T.chargen.abilityScores.find((a) => a.name === "Dexterity");
  set("abilityExpertise", dex.skills[0], 1); set("abilityTalent", dex.talents[0], 1); set("abilityDescriptor", dex.descriptors[0], 1);
  d.attrSpend = { resolve: 2, initiative: 1, toughness: 2, dt: 0 };
  set("cultureBgName", "Barbarian");
  T.chargen.culturalBackgrounds.find((c) => c.name === "Barbarian").picks.forEach((p, pi) => {
    const opts = S.pickOptions(T, p.options);
    for (let s = 0; s < p.count; s++) set("cultureBgPicks." + pi, opts[s % opts.length], s);
  });
  for (const k of ["origin", "youth", "recent"]) {
    const ev = T.lifeEvents[k].find((e) => (e.options || []).length && e.options[0].kind === "skill");
    await A.act("life-pick", { key: k, value: ev.range }, mkEnv(d));
    set("lifeChoice", 0, k);
  }
  set("careerName", "Warrior");
  for (const cat of ["Combat", "Adventuring", "Social", "Lore"]) await A.act("spread", { cat }, mkEnv(d));
  A.setBound(d, T, { bind: "freeTalent", key: "career0_0", sub: "name", value: "Sweeping Attack" });
  set("roAge", "Adult"); set("roBonusChoice", "status");
  d.roAlloc = { Athletics: 20, Perception: 20, Ride: 20, Survival: 20, Track: 20 };
  d.roSavvy = ["Dodge", "Wit", "Heal"];
  d.rolls = { careerSilver: 20, cultureSilver: 30, equipCoin: 300, armorPieces: 2 };
  d.freeArmor = [{ name: "Leather", loc: "head" }, { name: "Mail", loc: "body" }];
  d.personalityPicks = ["Altruistic", "Brave"].filter((t) => T.chargen.personalityTraits.includes(t));
  if (!d.personalityPicks.length) d.personalityPicks = T.chargen.personalityTraits.slice(0, 2);
  return d;
}
{
  const d = await finishedDraft();
  const env = mkEnv(d);
  const open = Object.entries(env.st).filter(([, v]) => v.open.length).map(([k, v]) => k + ": " + v.open.join("; "));
  check(!open.length && env.st.review.done, "a finished Human Warrior has nothing open and Review reads complete", open);
  const d0 = DR.defaultDraft(T);
  const st0 = DR.stepStatus(T, d0, C.deriveWith(T, d0));
  check(st0.goals.done && st0.status.done && !st0.goals.open.length && !st0.status.open.length, "Goals and Status are never open (both optional in the book)");
  const spellOnly = T.lifeEvents.origin.find((e) => (e.options || []).some((o) => o.kind === "strand" || o.kind === "bind"));
  const nc = await finishedDraft();
  nc.lifeEvents.origin = spellOnly; nc.lifeChoice.origin = spellOnly.options.findIndex((o) => o.kind === "strand" || o.kind === "bind");
  const stn = DR.stepStatus(T, nc, C.deriveWith(T, nc));
  check(stn.life.open.some((x) => /Spellweaver or Fade/.test(x)), "a Warrior holding a Life Event's Spellweaver option is told it gives them nothing", stn.life.open);
  const sheetMod = await imp("sheet.mjs");
  const tough = await finishedDraft();
  tough.freeTalents = [{ slot: "race", name: "Tough", spec: "" }];
  const tch = C.deriveWith(T, tough);
  const fx = sheetMod.talentEffects(tch, T);
  check(tch.attributes.toughness.value === 1 && fx["system.toughness"]?.total === 1, "Tough stays out of the written base (1, from two Attribute points; its effect adds the rest) and the sheet counts it",
    [tch.attributes.toughness.value, fx]);
  check(/Tough<\/span><b>2</.test(sheetMod.renderSheet(tch, mkEnv(tough)).replace(/<sup[^>]*>\*<\/sup>/g, "")), "so the live sheet reads Toughness 2, what the actor will show");
  const ogre = Object.assign(DR.defaultDraft(T), { raceName: "Ogre" });
  const sto = DR.stepStatus(T, ogre, C.deriveWith(T, ogre));
  check(!sto.race.open.length, "an Ogre (nothing to pick) is not asked for a Savvy, an Expertise or a homeland", sto.race.open);
}

console.log("\n6. Create writes what the sheet shows, and nothing without permission");
{
  const d = await finishedDraft();
  d.name = "Edda Vale"; d.goals = [{ text: "I will find my brother.", kind: "individual" }];
  const ch = C.deriveWith(T, d);
  const p = CM.buildPayload(ch, d, T, { actor: { name: "Hero", type: "character", system: { status: 0 } }, open: [] });
  const skills = p.items.filter((i) => i.type === "skill");
  check(R.SKILL_ALL.every((n) => skills.find((s) => s.name === n)?.system.value === ch.skills[n].value), "every catalogue skill is written at the value the sheet shows");
  check(ch.extraSkills.every((x) => skills.some((s) => s.name === x.name && s.system.value === x.value)), "and every Language, -wise and Bind");
  const tals = p.items.filter((i) => i.type === "talent");
  check(ch.talents.every((t) => tals.some((i) => i.name.startsWith(t.name) && i.system.ranks === t.ranks)) && tals.length === ch.talents.length, "every Talent, ranks included", ch.talents.map((t) => t.name));
  check(tals.some((i) => /^Armor Training/.test(i.name) && i.system.ranks === 3), "the Warrior's Armor Training III arrives as three ranks");
  const armor = p.items.filter((i) => i.type === "armor");
  check(armor.length === 2 && armor.every((a) => Object.values(a.system.locations).filter(Boolean).length === 1), "each free armour piece covers exactly one location");
  check(p.items.some((i) => i.type === "weapon" && i.name === "Dagger"), "the starting Dagger");
  const U = p.update;
  check(U["system.resolve.max"] === ch.attributes.resolveMax.value && U["system.deathThreshold.max"] === ch.attributes.deathThreshold.value &&
    U["system.toughness"] === ch.attributes.toughness.value && U["system.initiative"] === ch.attributes.initiative.value, "Resolve, Death Threshold, Toughness and Initiative as the sheet shows them");
  check(U["system.silver"] === ch.silver.left && U["system.silver"] === 350, "silver is what is left after shopping (20 + 30 + 300)", U["system.silver"]);
  check(U["system.status"] === 1 && U.name === "Edda Vale" && U["system.goals"].length === 1, "Status from the Rounding Out bonus, the name, the goal");
  check(U["flags.the-broken-empires.freeArmor"] === 0, "no free pieces left to claim later");
  const p2 = CM.buildPayload(ch, d, T, { actor: { name: "Hero", type: "character", system: { status: 4 } }, open: [] });
  check(p2.update["system.status"] === 4, "never lowers a Status already earned in play");

  const log = [];
  const stub = (owner) => ({ id: "A", name: "Hero", type: "character", items: [{ id: "i1", type: "skill" }, { id: "i2", type: "weapon" }, { id: "i3", type: "loot" }],
    deleteEmbeddedDocuments: async (t, ids) => log.push(["delete", ids]), createEmbeddedDocuments: async (t, arr) => { log.push(["create", arr.length]); return arr; },
    update: async (u) => log.push(["update", Object.keys(u).length]), _owner: owner });
  const perm = await import(pathToFileURL(path.join(SYS, "module/rules/permission.mjs")).href);
  const canWrite = (a) => perm.canWrite(Object.assign({ isOwner: a._owner }, a));
  const r1 = await CM.writeCharacter(stub(false), p, { canWrite, wipe: true });
  check(!r1.ok && /permission/.test(r1.notice) && log.length === 0, "a player who does not own the actor gets a sentence and NOTHING is written or deleted", [r1, log]);
  const r2 = await CM.writeCharacter(stub(true), p, { canWrite, wipe: true });
  check(r2.ok && JSON.stringify(log[0]) === JSON.stringify(["delete", ["i1", "i2"]]) && log[1][0] === "create" && log[2][0] === "update",
    "an owner's Create replaces skills and weapons, keeps other Items, then creates and updates", log);
  /* Mutation: a writer that does not ask. */
  log.length = 0;
  const careless = async (actor, payload) => { await actor.createEmbeddedDocuments("Item", payload.items); return { ok: true }; };
  await careless(stub(false), p);
  check(log.length > 0, "mutation: a writer that skips the permission question writes to an actor it does not own (so the check above is live)");
}

/* ------------------------------------------------------------------------ */
console.log("\n7. The real window, in headless Chromium");
let chromium = null;
try { ({ chromium } = await import("playwright")); } catch (e) { chromium = null; }
if (!chromium) {
  check(false, "playwright is installed (npm install)");
} else {
  const OUT = path.join(__dirname, "test-screenshots", "creator");
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const shim = fs.readFileSync(path.join(__dirname, "test-fixtures", "appv2_shim.js"), "utf8");
  const server = http.createServer((req, res) => {
    const u = decodeURIComponent(req.url.split("?")[0]);
    if (u === "/" || u === "/index.html") {
      res.writeHead(200, { "content-type": "text/html" });
      res.end('<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/css/the-broken-empires.css">' +
        '<style>body{margin:0;font-family:sans-serif;background:#e8e2d4;color:#222}.application{position:absolute;left:10px;top:10px;background:#f4efe4;border:1px solid #888}' +
        '.application>header{padding:4px 8px;background:#333;color:#fff}button{font:inherit}</style>' +
        "<script>" + shim + '</script></head><body><script type="module">import("/module/chargen/creator.mjs").then((m)=>{window.CREATOR=m;window.READY=true;}).catch((e)=>{window.LOADERR=String(e.stack||e)});</script></body></html>');
      return;
    }
    if (u === "/favicon.ico") { res.writeHead(204); res.end(); return; }
    const f = path.join(SYS, u);
    if (!f.startsWith(SYS) || !fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "content-type": f.endsWith(".css") ? "text/css" : "text/javascript" });
    res.end(fs.readFileSync(f));
  });
  await new Promise((r) => server.listen(0, r));
  const port = server.address().port;
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const page = await browser.newPage({ viewport: { width: 1160, height: 820 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e.stack || e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text() + " " + JSON.stringify(m.location())); });
  await page.goto("http://127.0.0.1:" + port + "/");
  await page.waitForFunction(() => window.READY || window.LOADERR, null, { timeout: 15000 });
  const loadErr = await page.evaluate(() => window.LOADERR || null);
  check(!loadErr, "creator.mjs loads in a browser (every import resolves)", loadErr);
  let shot = 0;
  const snap = async (name) => page.locator(".tbe-creator").screenshot({ path: path.join(OUT, String(++shot).padStart(2, "0") + "-" + name + ".png") });
  const click = async (sel) => { await page.locator(sel).first().click(); await page.waitForTimeout(40); };
  const stepIs = async (k) => page.evaluate((k) => !!document.querySelector('.tbe-cc-rail-step.cur[data-step="' + k + '"]'), k);
  const next = async () => { await click('[data-action="next"]'); };

  await page.evaluate(() => window.CREATOR.openCreator(window.ACTOR));
  await page.waitForSelector(".tbe-cc-layout");
  check(await page.locator(".tbe-cc-rail-step").count() === 13, "the rail lists the book's twelve steps and Review");
  await snap("concept-empty");
  await click('[data-action="roll-concept"]:not([data-col])');
  check((await page.inputValue('input[data-bind="concept"]')).length > 5, "Roll a concept fills the concept");
  const name = page.locator('input[data-bind="name"]');
  await name.click(); await name.pressSequentially("Edda Vale", { delay: 5 });
  check(await page.evaluate(() => document.activeElement?.dataset?.bind === "name"), "typing a name keeps the caret in the box");
  check((await page.textContent(".tbe-cc-name")) === "Edda Vale", "and the sheet's name follows as you type");
  for (const [cat, n] of Object.entries({ Combat: "Dodge", Adventuring: "Stealth", Social: "Wit", Lore: "Heal" })) await page.selectOption('select[data-bind="boost"][data-key="' + cat + '"]', n);
  check(/30/.test(await page.textContent('.tbe-cc-sk[data-name="Dodge"]')), "Dodge at 30 on the live sheet");
  await snap("concept");

  await next(); check(await stepIs("race"), "Next goes to Race");
  await click('tr[data-bind="raceName"][data-value="Human"]');
  check(await page.locator('tr.picked[data-value="Human"]').count() === 1, "clicking the Human row picks it");
  await click('tr[data-bind="humanCultureRange"][data-value="01-12"]');
  await page.selectOption('select[data-bind="raceSavvyPick"]', "Stealth");
  await page.selectOption('select[data-bind="raceExpertisePick"]', "Dodge");
  await page.selectOption('select[data-bind="freeTalent"][data-key="race"]', "Tough");
  check(/Westronne/.test(await page.textContent(".tbe-cc-sheet")), "the homeland's Language reaches the sheet");
  await snap("race");

  await next();
  await click('tr[data-action="ability-pick"][data-value="Strength"]');
  await click('tr[data-action="ability-pick"][data-value="Dexterity"]');
  for (const i of [0, 1]) for (const b of ["abilityExpertise", "abilityTalent", "abilityDescriptor"]) {
    const sel = 'select[data-bind="' + b + '"][data-key="' + i + '"]';
    const v = await page.locator(sel + " option:nth-child(2)").getAttribute("value");
    await page.selectOption(sel, v);
  }
  check(!(await page.locator(".tbe-cc-body .tbe-cc-open").count()), "both Ability Scores complete, nothing open on the page");
  await snap("ability");

  await next();
  for (let i = 0; i < 5; i++) await click('[data-action="bump"][data-key="resolve"][data-by="1"]');
  check(/20/.test(await page.textContent(".tbe-cc-results")), "five points in Resolve: Max Resolve 20");
  check(await page.locator('[data-action="bump"][data-key="resolve"][data-by="1"]').count() === 1 && /all spent/.test(await page.textContent('[data-live="attr"]')), "the pool reads all spent");
  await snap("attributes");

  await next();
  await click('tr[data-bind="cultureBgName"][data-value="Barbarian"]');
  const cselects = page.locator('select[data-bind^="cultureBgPicks."]');
  for (let i = 0; i < await cselects.count(); i++) {
    const s = cselects.nth(i);
    const opts = await s.locator("option").evaluateAll((os) => os.map((o) => o.value).filter(Boolean));
    await s.selectOption(opts[i % opts.length]);
  }
  await snap("culture");

  await next();
  for (const k of ["origin", "youth", "recent"]) {
    await click('[data-action="roll-life"][data-life="' + k + '"]');
    const radio = page.locator('input[type="radio"][data-bind="lifeChoice"][data-key="' + k + '"]');
    if (await radio.count()) { await radio.first().check(); await page.waitForTimeout(40); }
    const extra = page.locator('select[data-bind="lifeChoiceExtra"][data-key="' + k + '"]');
    if (await extra.count()) { const v = await extra.locator("option:nth-child(2)").getAttribute("value"); await extra.selectOption(v); }
  }
  await snap("life");
  await click('[data-action="ui-set"][data-value="npcs"]');
  await click('[data-action="roll-npc"]');
  check(await page.locator('input[data-bind="relationshipNpcs.0.name"]').count() === 1, "a rolled Relationship NPC gets a name box");
  await snap("life-npcs");

  await next();
  await click('tr[data-bind="careerName"][data-value="Warrior"]');
  for (const cat of ["Combat", "Adventuring", "Social", "Lore"]) await click('[data-action="spread"][data-cat="' + cat + '"]');
  const box = page.locator('input[data-bind="alloc"][data-key="Combat_0"]');
  await box.click(); await box.fill(""); await box.pressSequentially("25", { delay: 10 });
  check(await page.evaluate(() => document.activeElement?.dataset?.key === "Combat_0"), "typing into a points box keeps the caret there");
  check(/over by/.test(await page.textContent('[data-live="pool:Combat"]')), "and the Combat pool updates live to 'over by'");
  await box.fill("12"); await page.waitForTimeout(40);
  check(/all spent/.test(await page.textContent('[data-live="pool:Combat"]')), "back to 12: all spent again");
  await snap("career-points");
  await click('[data-action="ui-set"][data-value="slots"]');
  await page.fill('input[data-bind="wiseNames"]', "Horse-wise");
  await click('[data-action="ui-set"][data-value="talents"]');
  const ts = page.locator('select[data-bind="freeTalent"][data-key="career0_0"]');
  const tv = await ts.locator("option:not([disabled])").evaluateAll((os) => os.map((o) => o.value).filter(Boolean));
  await ts.selectOption(tv[0]);
  check(/Horse-wise/.test(await page.textContent(".tbe-cc-sheet")), "a named career slot reaches the sheet under its new name");
  await snap("career-talents");

  await next();
  await click('tr[data-bind="roAge"][data-value="Adult"]');
  await click('input[type="radio"][data-bind="roBonusChoice"][value="status"]');
  for (const n of ["Athletics", "Perception", "Ride", "Survival", "Track"]) {
    await click('[data-action="ui-set"][data-value="Adventuring"]');
    await page.fill('input[data-bind="roAlloc"][data-key="' + n + '"]', "20");
  }
  for (const [i, n] of [[0, "Dodge"], [1, "Wit"], [2, "Heal"]]) await page.selectOption('select[data-bind="roSavvy"][data-key="' + i + '"]', n);
  await snap("rounding");

  await next();
  await click('[data-action="roll-silver"]');
  await click('[data-action="roll-armor"]');
  await page.selectOption('select[data-ui="freePick.name"]', "Leather");
  await click('[data-action="take-free"]');
  check(await page.locator('[data-list="freeArmor"]').count() === 1, "a free Leather piece is taken");
  await page.selectOption('select[data-ui="buy.name"]', "Spear");
  await click('[data-action="buy"]');
  check(/Spear/.test(await page.textContent(".tbe-cc-sheet")), "a bought Spear is on the sheet");
  await snap("equip");

  await next(); await click('[data-action="roll-personality"]');
  check(await page.locator(".tbe-cc-chip.on").count() === 2, "Roll two picks two traits");
  await snap("personality");
  await next();
  await page.fill('input[data-ui="goal.want"]', "find my brother");
  check(/find my brother/.test(await page.textContent('[data-live="goal-sentence"]')), "the goal sentence builds as you type");
  await click('[data-action="add-goal"]');
  await snap("goals");
  await next(); await snap("status");
  await next(); check(await stepIs("review"), "Review is the last page");
  await snap("review");
  const openLeft = await page.locator(".tbe-cc-body .tbe-cc-open").count();
  await click('[data-action="create"]');
  await page.waitForFunction(() => window.LOG.some((x) => x[0] === "update"), null, { timeout: 5000 }).catch(() => {});
  const log = await page.evaluate(() => window.LOG);
  const upd = (log.find((x) => x[0] === "update") || [])[1] || {};
  check(upd.name === "Edda Vale" && upd["system.resolve.max"] === 20 && upd["system.status"] >= 1, "Create writes the name, Resolve 20 and the Status bonus", upd);
  check(log.some((x) => x[0] === "create" && x[1] > 40), "and creates the Items (skills, Talents, gear)");
  check(await page.evaluate(() => !document.querySelector(".tbe-creator")), "the window closes after Create");
  check(await page.evaluate(() => !JSON.parse(window.USER.flags.memory || "{}").creatorDraft?.A1), "the saved draft is discarded after Create");
  check(openLeft === 0 || log.some((x) => x[0] === "dialog"), "open choices, if any, were confirmed first");

  /* Close half way, reopen, resume. */
  await page.evaluate(() => { window.ACTOR2 = Object.assign({}, window.ACTOR, { id: "B2", name: "Second" }); return window.CREATOR.openCreator(window.ACTOR2); });
  await page.waitForSelector(".tbe-cc-layout");
  await page.fill('input[data-bind="concept"]', "Half-built smuggler");
  await next(); await click('tr[data-bind="raceName"][data-value="Dwarf"]');
  await page.evaluate(() => window.foundry.applications.instances.get("tbe-creator-B2").close());
  await page.waitForTimeout(100);
  const savedD = await page.evaluate(() => JSON.parse(window.USER.flags.memory || "{}").creatorDraft?.B2);
  check(savedD?.draft?.raceName === "Dwarf" && savedD.stepKey === "race", "closing half way saves the draft and the step");
  await page.evaluate(() => window.CREATOR.openCreator(window.ACTOR2));
  await page.waitForSelector(".tbe-cc-layout");
  check(await stepIs("race") && await page.locator('tr.picked[data-value="Dwarf"]').count() === 1, "reopening resumes on the same step with the same choices");
  await snap("resumed");

  /* A player who does not own the actor is told so, and no window opens. */
  await page.evaluate(() => { window.foundry.applications.instances.get("tbe-creator-B2").close(); window.ACTOR3 = Object.assign({}, window.ACTOR, { id: "C3", name: "Not Yours", isOwner: false, testUserPermission: () => false }); return window.CREATOR.openCreator(window.ACTOR3); });
  await page.waitForTimeout(80);
  check(await page.evaluate(() => !document.querySelector(".tbe-creator") && window.NOTES.some((n) => /permission/.test(n))), "opening a character you do not own: a sentence, no window");
  check(!errors.length, "no page or console errors", errors.slice(0, 3));
  await browser.close();
  server.close();
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
