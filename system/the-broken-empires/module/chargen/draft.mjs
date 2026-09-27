/* The character-creation draft, the book's twelve steps, and what each step
 * still needs (v0.52.0).
 *
 * The draft is every choice the player has made and nothing else. It has the
 * same shape as the old Wizard's (so derive.mjs reads either, and a draft
 * saved by one resumes in the other), plus the fields the old Wizard had no
 * place for. Everything a player sees is worked out from it by derive(); the
 * draft never holds a computed number.
 *
 * stepStatus() answers "is this step done, and if not, what is missing" for
 * the rail and the "still to choose" list. It follows the old Wizard's
 * pending panel (pending_check.mjs) on one point above all: silence. An entry
 * must be a decision the book says is the player's and that the draft does
 * not hold yet, never a nag about something that is fine.
 */

const num = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
const blank = (v) => v === null || v === undefined || String(v).trim() === "";

/** The book's twelve steps (p.78), and a last page to review and create. */
export const STEPS = [
  { key: "concept", n: 1, label: "Concept", page: 80 },
  { key: "race", n: 2, label: "Race", page: 81 },
  { key: "ability", n: 3, label: "Ability Scores", page: 86 },
  { key: "attributes", n: 4, label: "Attributes", page: 87 },
  { key: "culture", n: 5, label: "Culture", page: 89 },
  { key: "life", n: 6, label: "Life Events", page: 91 },
  { key: "career", n: 7, label: "Career", page: 102 },
  { key: "rounding", n: 8, label: "Rounding Out", page: 108 },
  { key: "equip", n: 9, label: "Equipment", page: 109 },
  { key: "personality", n: 10, label: "Personality", page: 110 },
  { key: "goals", n: 11, label: "Goals", page: 111 },
  { key: "status", n: 12, label: "Status", page: 114 },
  { key: "review", n: null, label: "Review & Create", page: null }
];

export function defaultDraft(T) {
  const CG = T.chargen;
  return {
    v: 2,
    /* Same keys as the old Wizard's draft. */
    concept: "", conceptPicks: {}, base: 20, wises: 0, binds: 2,
    boost: { Combat: null, Adventuring: null, Social: null, Lore: null },
    wipe: true, seedNotes: true,
    raceName: "", careerName: "",
    allocFor: null, alloc: {},
    abilityPicks: [null, null], abilityExpertise: [null, null], abilityTalent: [null, null], abilityDescriptor: [null, null],
    attrSpend: { resolve: 0, initiative: 0, toughness: 0, dt: 0 }, randomizedInit: false, randomizedDT: false,
    cultureBgName: "", cultureBgFor: null, cultureBgPicks: {},
    humanCultureName: "", humanCultureLang: "", humanCultureRange: "",
    lifeEvents: { origin: null, youth: null, recent: null },
    lifeChoice: { origin: null, youth: null, recent: null },
    lifeChoiceExtra: { origin: "", youth: "", recent: "" },
    relationshipNpcs: [],
    roBonusChoice: "talent", roAge: "", roAlloc: {}, roLoreAlloc: {}, roExtraAlloc: {}, roAllocFor: null, roOldExpertiseSkill: "",
    roSavvy: [null, null, null],
    personalityPicks: [], personalityCustom: "",
    raceSavvyPick: "", raceExpertisePick: "", raceBindPick: "",
    takeFade: false, convocation: "",
    swBinds: [], swStrands: [], swThin: [],
    magicAlloc: {}, strandAlloc: {}, strandExtra: {}, fadeStrands: {},
    bindExpertise: "", threadAttunement: "", threadName: "", trueName: "",
    roBindAlloc: {}, roStrandAlloc: {},
    /* New in the window: places for choices the old Wizard sent elsewhere. */
    name: "", sex: "",
    rolls: {},                 // dice the player has rolled: careerSilver, cultureSilver, equipCoin, armorPieces
    freeTalents: [],           // [{slot, name, spec}] the free Talent picks (career, Human, Rounding Out)
    wiseNames: {},             // slot label -> the name the player gave it
    purchases: [],             // [{name, kind, sp, qty, loc}] bought with starting silver
    freeArmor: [],             // [{name, loc}] the 1d3+1 free pieces (p.109)
    goals: [],                 // [{text, kind}]
    statusAdjust: 0,           // Status set by hand on step 12, over what the choices grant
    careerTalentSwap: "",      // "auto:<Talent>" or "slot:<id>": one Career Talent swapped for +2 Status (p.102)
    sharedHistory: [],         // [{with, skill}] +5 each (p.94)
    stepSeen: {}               // steps the player has opened, so the rail can tell "not started" from "done"
  };
}

/** Racial grants that need a pick, detected from the verified race text. */
export function raceChoices(T, raceName) {
  const races = T.chargen.races;
  const r = races.find((x) => x.name === raceName) || null;
  if (!r) return { choosesSavvy: false, savvyOptions: [], extraExpertise: false, bindBonus: false, extraTalent: false, usesHumanCulture: false };
  const all = Object.values(T.skillGroups).flat();
  const named = (r.savvy || []).filter((x) => all.includes(x));
  let bonus = String(r.bonus || "");
  if (/Traits of a Human/i.test(bonus)) bonus += " " + String((races.find((x) => x.name === "Human") || {}).bonus || "");
  return {
    choosesSavvy: (r.savvy || []).length > 0 && named.length !== 1,
    savvyOptions: named.length ? named : all,
    extraExpertise: /additional level of Expertise/i.test(bonus),
    bindBonus: /\+10 to one Bind skill/i.test(bonus),
    extraTalent: /one additional Talent/i.test(bonus),
    usesHumanCulture: ["Human", "The Replaced"].includes(r.name)
  };
}

export function raceBarsMagic(T, raceName) {
  const r = T.chargen.races.find((x) => x.name === raceName);
  return (r?.restrictions || []).some((t) => /never (become any type of |be )?spellweavers? or fades?/i.test(t));
}
export function patternOf(T, d) {
  if (raceBarsMagic(T, d.raceName)) return "none";
  if (d.careerName === "Spellweaver") return "spellweaver";
  return d.takeFade ? "fade" : "none";
}

/** The career's free Talent choices, plus the Human and Rounding Out ones. */
export function freeTalentSlots(T, d) {
  const out = [];
  const career = T.chargen.careers.find((c) => c.name === d.careerName);
  (career?.talentPicks?.picks || []).forEach((p, pi) => {
    for (let i = 0; i < num(p.count, 1); i++) {
      const id = "career" + pi + "_" + i;
      if (d.careerTalentSwap === "slot:" + id) continue;   /* swapped for +2 Status (p.102) */
      out.push({ id, step: "career", source: "Career: " + career.name, rule: p });
    }
  });
  if (raceChoices(T, d.raceName).extraTalent) out.push({ id: "race", step: "race", source: "Race: " + d.raceName, rule: { any: true } });
  if (d.roBonusChoice === "talent") out.push({ id: "rounding", step: "rounding", source: "Rounding Out bonus", rule: { any: true } });
  return out;
}

const sum = (o) => Object.values(o || {}).reduce((n, v) => n + Math.max(0, num(v, 0)), 0);

/** Rounding Out's any-category pool is ONE budget (p.108): catalogue skills,
 *  -wises and Languages, Binds (casters only) and Strand levels at five
 *  points a level all draw on it. */
export function roAnySpent(T, d) {
  const cost = (T.magic?.rules || {}).roundingOutStrandCost || 5;
  const caster = patternOf(T, d) !== "none";
  return sum(d.roAlloc) + sum(d.roExtraAlloc) + (caster ? sum(d.roBindAlloc) + cost * sum(d.roStrandAlloc) : 0);
}

/**
 * Per step: done, and the list of what is still open. `ch` is derive()'s
 * character for the same draft (the pools and caps come from it).
 */
export function stepStatus(T, d, ch) {
  const S = T.skillGroups;
  const rc = raceChoices(T, d.raceName);
  const career = T.chargen.careers.find((c) => c.name === d.careerName) || null;
  const culture = T.chargen.culturalBackgrounds.find((c) => c.name === d.cultureBgName) || null;
  const age = T.chargen.roundingOutAges.find((a) => a.key === d.roAge) || null;
  const pattern = patternOf(T, d);
  const SW = (T.magic?.rules || {}).spellweaverChargen || {};
  const open = {};
  const add = (k, label) => { (open[k] = open[k] || []).push(label); };

  if (blank(d.concept)) add("concept", "Write or roll a rough concept");
  for (const cat of Object.keys(S)) if (blank(d.boost?.[cat])) add("concept", "Pick your " + cat + " skill at 30");

  if (blank(d.raceName)) add("race", "Choose or roll a race");
  else {
    if (rc.choosesSavvy && blank(d.raceSavvyPick)) add("race", "Choose your bonus Savvy skill");
    if (rc.extraExpertise && blank(d.raceExpertisePick)) add("race", "Choose the skill for your extra Expertise level");
    if (rc.bindBonus && pattern !== "none" && blank(d.raceBindPick)) add("race", "Choose which Bind gets your +10");
    if (rc.usesHumanCulture && blank(d.humanCultureRange)) add("race", "Roll or choose your homeland (sets your native Language)");
  }

  for (let i = 0; i < 2; i++) {
    if (blank(d.abilityPicks?.[i])) { add("ability", "Pick Ability Score " + (i + 1)); continue; }
    const who = d.abilityPicks[i];
    if (blank(d.abilityExpertise?.[i])) add("ability", "Expertise skill for " + who);
    if (blank(d.abilityTalent?.[i])) add("ability", "Talent for " + who);
    if (blank(d.abilityDescriptor?.[i])) add("ability", "Descriptor for " + who);
  }

  const attrLeft = 5 - sum(d.attrSpend);
  if (attrLeft > 0) add("attributes", attrLeft + " Attribute point" + (attrLeft > 1 ? "s" : "") + " to spend");
  if (attrLeft < 0) add("attributes", "Over by " + -attrLeft + " Attribute point" + (attrLeft < -1 ? "s" : ""));
  if (d.randomizedInit && !num(d.initRoll)) add("attributes", "Roll your randomized Initiative");
  if (d.randomizedDT && !num(d.dtRoll)) add("attributes", "Roll your randomized Death Threshold");

  if (!culture) add("culture", "Choose or roll a Cultural Background");
  else culture.picks.forEach((p, i) => {
    const got = ((d.cultureBgPicks || {})[i] || []).filter((x) => !blank(x)).length;
    if (got < num(p.count, 1)) add("culture", (p.expertise ? "Expertise" : "+" + p.amount) + " pick " + (i + 1) + ": " + (num(p.count, 1) - got) + " to choose");
  });

  for (const k of ["origin", "youth", "recent"]) {
    const ev = d.lifeEvents?.[k];
    if (!ev) { add("life", "Roll your " + k + " Life Event"); continue; }
    const pick = d.lifeChoice?.[k];
    const opt = pick === null || pick === undefined || pick === "" ? null : (ev.options || [])[num(pick, -1)];
    if ((ev.options || []).length && !opt) add("life", "Choose what " + ev.name + " gives you");
    else if (opt && opt.kind === "skill-any" && blank(d.lifeChoiceExtra?.[k])) add("life", "Choose the skill for " + ev.name);
    else if (opt && (opt.kind === "bind" || opt.kind === "strand") && !opt.name && blank(d.lifeChoiceExtra?.[k])) add("life", "Name the " + opt.kind + " for " + ev.name);
    /* The Spellweaver branch of an event gives a non-caster nothing at all;
       saying nothing would let them keep an option worth zero. */
    if (opt && (opt.kind === "bind" || opt.kind === "strand") && pattern === "none") add("life", ev.name + ": that option is for a Spellweaver or Fade; take the other one");
  }

  if (!career) add("career", "Choose or roll a Previous Career");
  else {
    for (const cp of ch.careerPoints || []) {
      if (cp.allocated < cp.pool) add("career", cp.cat + ": " + (cp.pool - cp.allocated) + " points to spend");
      if (cp.allocated > cp.pool) add("career", cp.cat + ": over by " + (cp.allocated - cp.pool));
    }
    if (pattern === "spellweaver") {
      if ((d.swBinds || []).filter(Boolean).length < (SW.binds || 2)) add("career", "Choose your " + (SW.binds || 2) + " Binds");
      if ((d.swStrands || []).filter(Boolean).length < (SW.strands || 4)) add("career", "Choose your " + (SW.strands || 4) + " Strands");
      if ((d.swThin || []).filter(Boolean).length < (SW.thinStrands || 2)) add("career", "Choose your " + (SW.thinStrands || 2) + " Thin Strands");
      const mp = sum(d.magicAlloc), sl = sum(d.strandAlloc), se = sum(d.strandExtra);
      if (mp < (SW.magicPool || 100)) add("career", ((SW.magicPool || 100) - mp) + " Magic points to spend");
      if (sl < (SW.strandLevels || 10)) add("career", ((SW.strandLevels || 10) - sl) + " Strand levels to place");
      if (se < (SW.extraStrandLevels || 3)) add("career", ((SW.extraStrandLevels || 3) - se) + " extra Strand levels to place");
      if (blank(d.bindExpertise)) add("career", "Choose the Bind for your Expertise level");
      if (blank(d.threadAttunement)) add("career", "Choose your d8 Thread Die");
    }
    if (pattern === "fade") {
      const fs = sum(d.fadeStrands), pool = (T.magic?.rules || {}).fadeChargenStrands || 5;
      if (fs < pool) add("career", (pool - fs) + " Faded Pattern Strand levels to place");
    }
    if (pattern !== "none" && blank(d.trueName)) add("career", "Choose your True Name");
  }

  if (!age) add("rounding", "Choose or roll your age");
  else {
    const anySpent = roAnySpent(T, d);
    if (anySpent < num(age.anyPoints)) add("rounding", (num(age.anyPoints) - anySpent) + " bonus points to spend");
    if (anySpent > num(age.anyPoints)) add("rounding", "Bonus points over by " + (anySpent - num(age.anyPoints)));
    if (num(age.lorePoints) && sum(d.roLoreAlloc) < num(age.lorePoints)) add("rounding", (num(age.lorePoints) - sum(d.roLoreAlloc)) + " Lore points to spend");
    if (age.expertise && blank(d.roOldExpertiseSkill)) add("rounding", "Choose the skill for Old's Expertise");
  }
  const savvyLeft = (d.roSavvy || []).filter(blank).length;
  if (savvyLeft) add("rounding", savvyLeft + " bonus Savvy skill" + (savvyLeft > 1 ? "s" : "") + " to choose");

  if (ch.silver.total === null) add("equip", "Roll your starting silver");
  if (ch.equipment.freeArmorPieces === null) add("equip", "Roll your free armour pieces");
  else if ((d.freeArmor || []).length < ch.equipment.freeArmorPieces) add("equip", (ch.equipment.freeArmorPieces - (d.freeArmor || []).length) + " free armour piece(s) to take");
  for (const slot of freeTalentSlots(T, d)) {
    const got = (d.freeTalents || []).find((x) => x.slot === slot.id && !blank(x.name));
    if (!got) add(slot.step, "Free Talent (" + slot.source + ")");
  }

  if (!(d.personalityPicks || []).length && blank(d.personalityCustom)) add("personality", "Pick or roll two or three Personality Traits");

  /* Goals (p.111) and Status (p.114) are optional: "It is fine to leave goals
     blank and discover them in play", and Status is marked (Optional). They
     never appear as open. */

  const status = {};
  for (const s of STEPS) status[s.key] = { done: !(open[s.key] || []).length, open: open[s.key] || [] };
  status.review.done = STEPS.filter((s) => s.key !== "review").every((s) => status[s.key].done);
  return status;
}
