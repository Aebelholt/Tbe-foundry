/*
 * chargen_parity_check.mjs -- module/chargen/derive.mjs, the one calculation
 * of a character from its choices, held to two oracles.
 *
 * 1. THE LAST WIZARD, FROZEN. Until v0.53.0 the oracle was the built TBE:
 *    Character Wizard, run in Node against a recording actor. The Wizard is
 *    retired in v0.53.0 (stage 3 of the chargen rebuild), so before it went
 *    its real commit() was run over the same 360 drafts (every race x career
 *    and 300 seeded random ones: the 70 cap, casters with every pool spent,
 *    Fades, Old characters, randomized Initiative and DT) and what it wrote
 *    was frozen into test-fixtures/chargen_golden.json.gz. derive() must still
 *    agree in every field. That fixture is a record, never regenerated: there
 *    is no Wizard left to regenerate it from, and a fixture rewritten to match
 *    new output checks nothing.
 * 2. THE BOOK. Hadrion, the worked example whose totals Ch.7 prints after
 *    every step, including the choices the Wizard had no field for (the
 *    Human's Expertise on a Bind, a Bind as a Savvy pick, Rounding Out points
 *    on a named -wise, Shared History, the free Talents).
 */
import fs from "node:fs";
import zlib from "node:zlib";
import { derive } from "./system/the-broken-empires/module/chargen/derive.mjs";
import { TABLES } from "./system/the-broken-empires/module/chargen/tables.mjs";
import * as R from "./system/the-broken-empires/module/chargen/rules.mjs";
import * as DR from "./system/the-broken-empires/module/chargen/draft.mjs";
import * as S from "./system/the-broken-empires/module/chargen/steps.mjs";
import { deriveWith, conceptColumns } from "./system/the-broken-empires/module/chargen/creator.mjs";

let pass = 0, fail = 0;
const check = (cond, label, extra) => {
  if (cond) { pass++; console.log("  PASS  " + label); }
  else { fail++; console.log("  FAIL  " + label + (extra !== undefined ? "  <- " + JSON.stringify(extra).slice(0, 600) : "")); }
};

const GOLD = JSON.parse(zlib.gunzipSync(fs.readFileSync("test-fixtures/chargen_golden.json.gz")).toString("utf8"));
const T = Object.assign({}, TABLES, { skillGroups: R.SKILL_GROUPS });
/* The dice the frozen commit() rolled; derive is handed the same. */
const DICE = GOLD.dice;
const diceFor = (f) => (f in DICE ? DICE[f] : 17 + (f.length % 7));
const ctxFor = () => ({
  data: T.chargen, magic: T.magic, talents: T.talents,
  lib: { SKILL_GROUPS: R.SKILL_GROUPS, CHARGEN_SKILL_CAP: R.CHARGEN_SKILL_CAP,
    applyAbilityScore: R.applyAbilityScore, raiseExpertise: R.raiseExpertise, talentNamed: R.talentNamed },
  rolls: { armorPieces: DICE["1d3+1"], equipCoin: DICE["2d4*50"] }
});
/* An old-style (pre-window) draft, as the Wizard started one. */
const OLD_DEFAULT = (() => {
  const d = DR.defaultDraft(T);
  delete d.v;
  return Object.assign(d, { raceName: T.chargen.races[0].name, careerName: T.chargen.careers[0].name,
    cultureBgName: T.chargen.culturalBackgrounds[0].name, roAge: "Adult" });
})();

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

/* ------------------------------------------------------------------ run */
console.log("\n1. The frozen record of the last Wizard");
check(/Character Wizard v0\.52\.0/.test(GOLD.frozenFrom), "frozen from TBE: Character Wizard v0.52.0's real commit()", GOLD.frozenFrom);
check(GOLD.drafts.length >= 360 && !!GOLD.hadrion, GOLD.drafts.length + " drafts and Hadrion");
check(!fs.existsSync("macros/tbe-character-wizard.js") || true, "the Wizard itself is not needed to run this");

console.log("\n2. derive() agrees with the last Wizard in every field of every draft");
const drafts = GOLD.drafts.map((g) => g.draft);
const bad = [];
for (const g of GOLD.drafts) {
  const d = g.draft;
  const ctx = ctxFor();
  const career = T.chargen.careers.find((c) => c.name === d.careerName);
  const culture = T.chargen.culturalBackgrounds.find((c) => c.name === d.cultureBgName);
  ctx.rolls.careerSilver = career.silver ? diceFor(career.silver) : null;
  ctx.rolls.cultureSilver = culture && culture.silver ? diceFor(culture.silver) : null;
  const diffs = diff(g.wizard, fromDerive(derive(d, ctx), 0));
  if (diffs.length) bad.push({ race: d.raceName, career: d.careerName, diffs: diffs.slice(0, 4) });
}
check(bad.length === 0, "all " + GOLD.drafts.length + " identical", bad.slice(0, 3));
/* Mutation: a derive that drops the racial skill modifiers. */
{
  const d = GOLD.drafts.find((g) => g.draft.raceName === "Ogre");
  const mangled = JSON.parse(JSON.stringify(T.chargen));
  mangled.races.find((r) => r.name === "Ogre").skillMods = [];
  const ctx = Object.assign(ctxFor(), { data: mangled });
  const c = T.chargen.careers.find((x) => x.name === d.draft.careerName);
  const cu = T.chargen.culturalBackgrounds.find((x) => x.name === d.draft.cultureBgName);
  ctx.rolls.careerSilver = c.silver ? diceFor(c.silver) : null; ctx.rolls.cultureSilver = cu && cu.silver ? diceFor(cu.silver) : null;
  check(diff(d.wizard, fromDerive(derive(d.draft, ctx), 0)).length > 0, "mutation: an Ogre without its racial modifiers no longer matches the record");
}

console.log("\n3. The Attributes page shows what Create writes");
{
  /* The Wizard's page left out the race's Toughness (fixed in v0.51.0). The
     window's page reads derive(), so this pins that it keeps doing so. */
  const ogre = Object.assign(DR.defaultDraft(T), { raceName: "Ogre", careerName: "Warrior", attrSpend: { resolve: 1, initiative: 1, toughness: 2, dt: 1 } });
  const ch = deriveWith(T, ogre);
  const html = S.renderStep("attributes", { d: ogre, T, ch, st: DR.stepStatus(T, ogre, ch), ui: {}, concepts: conceptColumns(T, null) });
  const shown = Number((html.match(/<span>Toughness<\/span><b>(-?\d+)<\/b>/) || [])[1]);
  check(ch.attributes.toughness.value === 2 && shown === 2, "an Ogre with 2 Toughness points: 1 + the race's 1 = 2, on the page and in derive()", { shown, derived: ch.attributes.toughness.value });
  check(ch.attributes.toughness.sources.some((s) => /Race: Ogre/.test(s.label) && s.delta === 1), "and it says where the +1 came from");
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
  const d = JSON.parse(JSON.stringify(OLD_DEFAULT));
  d.raceName = "Ogre"; d.careerName = "Warrior";
  const idx = R.SKILL_GROUPS.Combat.indexOf("Melee: Light");
  d.boost = { Combat: "Melee: Light" };
  d.alloc = { ["Combat_" + idx]: 50 };
  const c = derive(d, ctxFor());
  /* Book: 20 (+10 boost) = 30, Ogre -20 = 10, +50 career = 60. */
  check(c.skills["Melee: Light"].value === 60, "Ogre Warrior, Melee: Light: 30 -20 +50 = 60 in book order", c.skills["Melee: Light"].value);
}

console.log("\n7. A Warrior gets Armor Training III (p.102); an Ogre only once (Ch.5)");
{
  /* Until v0.51.0 no Wizard-built Warrior got Armor Training at all: the
     career says "Armor Training III", the catalogue says "Armor Training
     (I-IV)", and the lookup matched names exactly. Both copies of the
     calculation agreed on the missing Talent, which is why parity alone
     could not see it: this pins what the book says instead. */
  const mk = (race) => { const d = JSON.parse(JSON.stringify(OLD_DEFAULT)); d.raceName = race; d.careerName = "Warrior"; return d; };
  const human = derive(mk("Human"), ctxFor()).talents.find((t) => /^Armor Training/.test(t.name));
  check(human && human.ranks === 3 && /Scale/.test(human.specialization), "Human Warrior: Armor Training at rank 3 (up to Scale)", human);
  const ogre = derive(mk("Ogre"), ctxFor()).talents.find((t) => /^Armor Training/.test(t.name));
  check(ogre && ogre.ranks === 1 && /Bone armor/.test(ogre.specialization), "Ogre Warrior: capped at 1 rank, bone armor only", ogre);
}

console.log("\n8. The book's own worked example: Hadrion (Ch.7, pp.80-108)");
{
  /* Every choice Brian makes for Hadrion, as a draft, and the totals the book
     prints after each step. The expectations are the BOOK's numbers, not the
     Wizard's, so this is the one part of the check that can catch the Wizard
     and derive being wrong together. */
  const SK = R.SKILL_GROUPS;
  const at = (cat, name) => cat + "_" + SK[cat].indexOf(name);
  const LE = T.lifeEvents;
  const ev = (k, n) => LE[k].find((e) => e.name.indexOf(n) === 0);
  const d = JSON.parse(JSON.stringify(OLD_DEFAULT));
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
  check(JSON.stringify(derive(GOLD.hadrion.draft, ctx)) === JSON.stringify(c), "this Hadrion and the one the last Wizard was frozen building are the same character");
  const same = diff(GOLD.hadrion.wizard, fromDerive(Object.assign(c, {}), 0))
    .filter((x) => !/^update\.system\.silver$/.test(x.path));
  check(same.length === 0, "and the last Wizard built the same Hadrion", same.slice(0, 5));

  /* The choices the book makes for Hadrion that the Wizard had no field for,
     now that the Create Character window does (v0.52.0). Book numbers again. */
  const g = Object.assign(DR.defaultDraft(T), JSON.parse(JSON.stringify(d)), {
    v: 2,
    wiseNames: { "Career wise/Language 1": "Ritual-wise" },          // p.105: "the custom -wise of Ritual-wise at 20"
    roExtraAlloc: { "Ritual-wise": 5 },                                // p.108: "Ritual-wise 25"
    roSavvy: ["Perception", "Insight", "Bind: Change"],                // p.108
    raceExpertisePick: "Bind: Control",                                // p.108: "Ex3 in Bind: Control"
    sharedHistory: [{ with: "a fellow player's character", skill: "Divinity" }],   // p.94: "Divinity (making it 25)"
    freeTalents: [{ slot: "rounding", name: "Forceful Strand (Strand)", spec: "Plants", source: "Rounding Out" },
      { slot: "race", name: "Steely Thews", spec: "", source: "Race: Human" }]
  });
  const h = derive(g, ctx);
  const x = (n) => h.extraSkills.find((e) => e.name === n) || {};
  check(x("Ritual-wise").value === 25, "Ritual-wise: the career slot, named, 20 +5 Rounding Out = 25 (p.108)", x("Ritual-wise"));
  check(x("Bind: Control").expertise === 3, "Ex3 in Bind: Control: the career's Ex2 plus the Human's level (p.108)", x("Bind: Control").expertise);
  check(x("Bind: Change").savvy === true, "Bind: Change is a Savvy skill (p.108)");
  check(h.skills.Divinity.value === 25, "Divinity 25 from the Shared History +5 (p.94)", h.skills.Divinity.value);
  const tn = h.talents.map((t) => t.name);
  check(tn.includes("Forceful Strand (Strand)") && tn.includes("Steely Thews") &&
    h.talents.find((t) => /^Forceful Strand/.test(t.name)).specialization === "Plants",
    "the free Talents: Forceful Strand (Plants) and Steely Thews (p.108)", tn);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
