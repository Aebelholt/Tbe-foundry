/* The whole character, worked out from the player's choices (v0.51.0, stage 1).
 *
 * WHY THIS EXISTS. TBE: Character Wizard worked the character out twice: once
 * per page, to show the player, and once more inside commit(), to write the
 * actor. The two drifted. The Attributes page showed an Ogre's Toughness as 0
 * while commit() wrote 1 (the racial Toughness was only in the second copy),
 * and CLAUDE.md's rule 4 ("book values reach the actor") lists earlier cases
 * of the same shape. The fix is structural: ONE function takes the choices and
 * returns the character. A live sheet shows what it returns; Create writes
 * what it returns. There is nothing left to disagree.
 *
 * WHAT IT IS NOT. It holds no rules of its own that already have an owner:
 * the skill catalogue, the 70 cap, the Ability Score rule, the Expertise
 * ladder and Talent lookup come in through `ctx.lib`, and the book's tables
 * through `ctx.data`. It rolls nothing: every die the book asks for is a
 * choice the player already made, carried in `draft` or `ctx.rolls`. It reads
 * no globals (a rule module does not assume ambient state), so a Node check
 * can run it as easily as Foundry can.
 *
 * ORDER. The book builds a character cumulatively in twelve steps (p.78) and
 * "during character creation, no skill can be increased beyond 70 for any
 * reason" (p.80). The cap bites at the moment of an increase, so the order of
 * a penalty and a capped increase changes the result. This applies the steps
 * in the book's order: starting skills (1), race (2), Ability Scores (3),
 * Cultural Background (5), Life Events (6), Career (7), Rounding Out (8).
 * The pre-v0.51.0 Wizard applied the Career points BEFORE the racial
 * modifiers; chargen_parity_check.mjs reports every draft where that
 * produces a different number.
 *
 * PROVENANCE. Every step runs through `step(label, fn)`, which diffs the
 * skills before and after, so each number carries the list of choices that
 * moved it ("Race: Ogre -20", "Career: Warrior +15"). Nobody writes those by
 * hand, so none can be missing or wrong.
 */

const num = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
const clone = (o) => JSON.parse(JSON.stringify(o));
const LIFE_KEYS = ["origin", "youth", "recent"];
const OLD_VESTRIAN_RANGE = "59-64";

/**
 * @param {object} draft  the Wizard's draft (every choice the player made)
 * @param {object} ctx
 *   data:  { races, careers, abilityScores, culturalBackgrounds, roundingOutAges }
 *   magic: the verified Ch.14 block (binds, strands, convocations, rules), or null
 *   talents: the Talent catalogue (for lookup by name)
 *   lib:   { SKILL_GROUPS, CHARGEN_SKILL_CAP, applyAbilityScore, raiseExpertise, talentNamed }
 *   rolls: { armorPieces, equipCoin, careerSilver, cultureSilver } already rolled, or null each
 * @returns {object} the character: identity, skills, extraSkills, strands,
 *   thread, talents, attributes, silver, equipment, personality, notes
 */
export function derive(draft, ctx) {
  const d = draft || {};
  const { data, lib } = ctx;
  const MAGIC = ctx.magic || null;
  const CAP = num(lib.CHARGEN_SKILL_CAP, 70);
  const SKILLS = lib.SKILL_GROUPS;
  const notes = [];

  const races = data.races || [], careers = data.careers || [];
  /* A draft from the character creation window (v >= 2) may not have chosen
     yet, and a blank must stay blank: the live sheet must never show a
     Human's languages or a Warrior's Talent nobody picked. The old Wizard
     fell back to the first race and career; its drafts (no v) still do, so
     chargen_parity_check.mjs is untouched. */
  const fresh = num(d.v, 1) >= 2;
  const NONE_RACE = { name: "", size: "Medium", toughness: 0, dt: 20, lethalityBonus: 0, skillMods: [], savvy: [], languages: [],
    exclusiveTalents: [], restrictions: [], startingSkills: [], talentLimits: [], invBonus: 0 };
  const NONE_CAREER = { name: "", pools: {}, customs: [], talents: "", talentPicks: { auto: [], picks: [] } };
  const race = races.find((r) => r.name === d.raceName) || (fresh ? NONE_RACE : races[0]);
  const career = careers.find((c) => c.name === d.careerName) || (fresh ? NONE_CAREER : careers[0]);
  const culture = (data.culturalBackgrounds || []).find((c) => c.name === d.cultureBgName) || null;
  const age = (data.roundingOutAges || []).find((a) => a.key === d.roAge) || null;

  /* ---- skills, with provenance --------------------------------------- */
  const values = {};
  const base = num(d.base, 20);
  for (const group of Object.keys(SKILLS)) {
    for (const name of SKILLS[group]) values[name] = { group, value: base, fighting: group === "Combat", expertise: 0, savvy: false };
  }
  const sources = {};
  for (const n of Object.keys(values)) sources[n] = [];
  const step = (label, fn) => {
    const before = clone(values);
    fn();
    for (const n of Object.keys(values)) {
      const a = before[n], b = values[n];
      const dv = b.value - a.value;
      if (dv) sources[n].push({ label, delta: dv });
      if (b.expertise !== a.expertise) sources[n].push({ label, expertise: b.expertise });
      if (b.savvy && !a.savvy) sources[n].push({ label, savvy: true });
    }
  };
  /* Returns the points the cap swallowed, so an allocation can say so. */
  const raise = (sk, amount) => {
    const before = values[sk].value;
    values[sk].value = Math.min(CAP, before + amount);
    return Math.max(0, before + amount - values[sk].value);
  };

  /* 1. Starting skills: one per category raised to 30 (p.79). */
  for (const [cat, sk] of Object.entries(d.boost || {})) {
    if (sk && values[sk]) step("Starting skill (" + cat + ")", () => raise(sk, 10));
  }

  /* 2. Race: skill modifiers, Savvy (named, or chosen), the Human Expertise. */
  step("Race: " + race.name, () => {
    for (const m of race.skillMods || []) {
      if (!values[m.skill]) { notes.push("Racial modifier to " + m.skill + ": not a catalogue skill, apply it by hand."); continue; }
      values[m.skill].value = Math.min(CAP, Math.max(0, values[m.skill].value + m.mod));
    }
    for (const sk of race.savvy || []) if (values[sk]) values[sk].savvy = true;
    const savvyPick = String(d.raceSavvyPick || "").trim();
    if (savvyPick && values[savvyPick]) values[savvyPick].savvy = true;
    const exPick = String(d.raceExpertisePick || "").trim();
    if (exPick && values[exPick]) values[exPick].expertise = lib.raiseExpertise(values[exPick].expertise);
  });

  /* 3. Ability Scores: +5 to each listed skill, +1 Expertise to one (p.85-86).
     The rule is the macro library's (TBE.applyAbilityScore), passed in. */
  (d.abilityPicks || []).forEach((scoreName, i) => {
    if (!scoreName) return;
    const score = (data.abilityScores || []).find((a) => a.name === scoreName);
    if (score) step("Ability Score: " + scoreName, () => lib.applyAbilityScore(values, score, (d.abilityExpertise || [])[i], CAP));
  });

  /* 5. Cultural Background picks. */
  if (culture) {
    (culture.picks || []).forEach((pick, pi) => {
      for (const sk of ((d.cultureBgPicks || {})[pi] || [])) {
        if (!sk || !values[sk]) continue;
        step("Culture: " + culture.name, () => {
          if (pick.expertise) values[sk].expertise = lib.raiseExpertise(values[sk].expertise);
          else raise(sk, num(pick.amount, 0));
        });
      }
    });
  }

  /* 6. Life Events: the chosen option of each, where it is a skill. */
  const lifeOpt = (key) => {
    const ev = (d.lifeEvents || {})[key];
    if (!ev || !(ev.options || []).length) return null;
    const pick = (d.lifeChoice || {})[key];
    if (fresh && (pick === null || pick === undefined || pick === "")) return null;
    return ev.options[Math.max(0, Math.min(ev.options.length - 1, num(pick, 0)))] || null;
  };
  for (const key of LIFE_KEYS) {
    const opt = lifeOpt(key);
    if (!opt) continue;
    let target = null;
    if (opt.kind === "skill") target = opt.name;
    else if (opt.kind === "skill-any") target = (d.lifeChoiceExtra || {})[key] || (opt.options || [])[0];
    if (target && values[target]) step("Life Event (" + key + "): " + d.lifeEvents[key].name, () => raise(target, num(opt.amount, 10)));
    else if (target) notes.push("Life Event (" + key + "): +" + num(opt.amount, 10) + " to " + target + ", not a catalogue skill.");
  }

  /* 6, continued. Shared History (p.94): "both of you add +5 to a skill
     that came out of it". A catalogue skill here; a -wise or Language that
     does not exist yet is created at 20 below and takes the +5 there. */
  for (const sh of d.sharedHistory || []) {
    if (sh && sh.skill && values[sh.skill]) step("Shared History" + (sh.with ? " with " + sh.with : ""), () => raise(sh.skill, 5));
  }

  /* 7. Career: the skill point pools, spent by the player. */
  const spent = [];
  for (const [cat, pool] of Object.entries(career.pools || {})) {
    if (!pool || cat === "Magic") continue;
    const names = SKILLS[cat] || [];
    let allocated = 0, lost = 0;
    names.forEach((n, idx) => {
      const add = Math.max(0, num((d.alloc || {})[cat + "_" + idx], 0));
      if (!add) return;
      allocated += add;
      step("Career: " + career.name + " (" + cat + " points)", () => { lost += raise(n, add); });
    });
    /* p.80: nothing passes 70 at creation, so points typed past it are
       gone. Said, not swallowed (phase5_check.mjs, v0.28.0). */
    spent.push({ cat, allocated, pool, lost });
    if (lost) notes.push(cat + ": " + lost + " career point(s) went past the 70 creation cap and are lost.");
    if (allocated !== pool) notes.push(cat + ": " + allocated + " of " + pool + " career points allocated.");
  }

  /* 8. Rounding Out: age, the Old Expertise, the bonus pools, the Savvy picks. */
  let roundingLost = 0;
  if (age) {
    if (age.endurance && values.Endurance) {
      step("Rounding Out: " + age.key, () => {
        values.Endurance.value = Math.max(0, Math.min(CAP, values.Endurance.value + age.endurance));
      });
    }
    if (age.expertise && d.roOldExpertiseSkill && values[d.roOldExpertiseSkill]) {
      step("Rounding Out: Old (Expertise)", () => {
        values[d.roOldExpertiseSkill].expertise = lib.raiseExpertise(values[d.roOldExpertiseSkill].expertise);
      });
    }
    for (const [sk, pts] of Object.entries(d.roAlloc || {})) {
      const add = Math.max(0, num(pts, 0));
      if (add && values[sk]) step("Rounding Out: bonus points", () => { roundingLost += raise(sk, add); });
    }
    for (const [sk, pts] of Object.entries(d.roLoreAlloc || {})) {
      const add = Math.max(0, num(pts, 0));
      if (add && values[sk] && (SKILLS.Lore || []).includes(sk)) step("Rounding Out: Old Lore points", () => { roundingLost += raise(sk, add); });
    }
    if (roundingLost) notes.push("Rounding Out: " + roundingLost + " bonus point(s) went past the 70 creation cap and are lost.");
  }
  for (const sk of d.roSavvy || []) if (sk && values[sk]) step("Rounding Out: Savvy", () => { values[sk].savvy = true; });

  /* ---- skills that are not in the catalogue --------------------------- */
  const extra = [];
  const addExtra = (group, name, value, why, more) =>
    extra.push(Object.assign({ group, name, value: Math.max(0, num(value, 0)), expertise: 0, savvy: false, sources: [{ label: why }] }, more || {}));
  const humanCulture = ["Human", "The Replaced"].includes(race.name);
  const native = String(d.humanCultureLang || "Westronne").trim();
  const oldVestrian = humanCulture && d.humanCultureRange === OLD_VESTRIAN_RANGE;
  /* p.81: "The cultural Language of the region at 70 and Low Vestrian at 20.
     Old Vestrian characters INSTEAD assign Low Vestrian 70 and High Vestrian
     20." Instead, not as well: before v0.51.0 an Old Vestrian got Low
     Vestrian three times (70, 20 and 70). */
  if (!oldVestrian) for (const l of race.languages || []) {
    const isCultural = /cultural|their cultural/i.test(l.name);
    addExtra("Language", isCultural ? native : l.name, l.value, "Race: " + race.name);
  }
  if (culture && culture.extraLanguage) addExtra("Language", "Cultural extra Language", culture.extraLanguage, "Culture: " + culture.name);
  if (oldVestrian) {
    addExtra("Language", "Low Vestrian (Old Vestrian)", 70, "Human Culture: Old Vestrian");
    addExtra("Language", "High Vestrian", 20, "Human Culture: Old Vestrian");
  }
  for (const sk of race.startingSkills || []) addExtra("Lore", sk.name, sk.value, "Race: " + race.name);
  for (let i = 0; i < Math.max(0, num(d.wises, 0)); i++) addExtra("Wise", "Wise: subject " + (i + 1), 0, "Starting skills (unnamed -wise)");

  /* ---- Weave Magic ------------------------------------------------------ */
  const magic = MAGIC ? deriveMagic(d, race, MAGIC, lifeOpt, notes) : null;
  if (MAGIC) {
    for (const n of (MAGIC.binds || []).map((b) => b.name)) {
      extra.push({ group: "Bind", name: "Bind: " + n, value: magic.binds[n], expertise: d.bindExpertise === n ? 2 : 0,
        savvy: false, sources: magic.bindSources[n].length ? magic.bindSources[n] : [{ label: "Binds start at 0 (p.79)" }] });
    }
  } else {
    for (let i = 0; i < Math.max(0, num(d.binds, 2)); i++) addExtra("Bind", "Bind: name it " + (i + 1), 0, "Starting skills");
  }
  if (career.name === "Godbound") addExtra("Lore", "Piety", 50, "Career: Godbound (20) and the Godbound Talent (30)");
  for (const [count, value] of career.customs || []) {
    for (let i = 0; i < count; i++) addExtra("Wise", "Career wise/Language " + (i + 1), value, "Career: " + career.name);
  }

  /* Choices on skills outside the catalogue, which the old Wizard had no
     place for (the book's own Hadrion example needs every one of them):
     naming a -wise or Language slot, Rounding Out points on one, a Shared
     History +5 on one, a Bind as a Savvy pick, and the Human's extra
     Expertise on a Bind (p.108 gives Hadrion Ex3 Bind: Control). */
  const extraCap = (x) => (x.group === "Bind" ? num(((MAGIC || {}).rules || {}).spellweaverChargen?.bindCapAtChargen, 70) : CAP);
  const bumpExtra = (x, amount, label) => {
    const before = x.value;
    x.value = Math.min(extraCap(x), x.value + amount);
    if (x.value !== before) x.sources.push({ label, delta: x.value - before });
  };
  for (const x of extra) {
    const named = String((d.wiseNames || {})[x.name] || "").trim();
    if (named) { x.sources.push({ label: "Named: " + x.name }); x.slot = x.name; x.name = named; }
  }
  const findExtra = (key) => extra.find((x) => x.name === key || x.slot === key) || null;
  for (const [key, pts] of Object.entries(d.roExtraAlloc || {})) {
    const x = findExtra(key), add = Math.max(0, num(pts, 0));
    if (x && add) bumpExtra(x, add, "Rounding Out: bonus points");
  }
  for (const sh of d.sharedHistory || []) {
    if (!sh || !sh.skill || values[sh.skill]) continue;
    let x = findExtra(sh.skill);
    if (!x) { addExtra(/language/i.test(sh.group || "") ? "Language" : "Wise", sh.skill, 20, "Shared History (created at 20, p.94)"); x = extra[extra.length - 1]; }
    bumpExtra(x, 5, "Shared History" + (sh.with ? " with " + sh.with : ""));
  }
  for (const sk of d.roSavvy || []) {
    const x = sk && !values[sk] ? findExtra(sk) : null;
    if (x && !x.savvy) { x.savvy = true; x.sources.push({ label: "Rounding Out: Savvy", savvy: true }); }
  }
  {
    const exPick = String(d.raceExpertisePick || "").trim();
    const x = exPick && !values[exPick] ? findExtra(exPick) : null;
    if (x) { x.expertise = lib.raiseExpertise(x.expertise); x.sources.push({ label: "Race: " + race.name, expertise: x.expertise }); }
  }

  /* Life Event outcomes that are not a catalogue skill. */
  let lifeStatus = 0;
  for (const key of LIFE_KEYS) {
    const opt = lifeOpt(key);
    if (!opt) continue;
    const label = "Life Event (" + key + "): " + d.lifeEvents[key].name;
    if (opt.kind === "status") lifeStatus += num(opt.amount, 1);
    else if (opt.kind === "wise") addExtra("Wise", opt.name, num(opt.value, 20), label);
    else if (opt.kind === "piety" && career.name !== "Godbound") notes.push(label + ": needs the Godbound Talent, so the other option applies.");
  }

  /* ---- Talents ------------------------------------------------------------ */
  const wanted = [];
  for (const t of race.exclusiveTalents || []) wanted.push({ name: t, why: "Race: " + race.name });
  /* p.102: "You may swap out one of your Previous Career Talents for +2
     Status." The swap names either a Talent the career grants outright
     ("auto:Literate") or one of its free-pick slots ("slot:career0_0"). */
  const swap = String(d.careerTalentSwap || "");
  for (const t of (career.talentPicks || {}).auto || []) {
    if (swap === "auto:" + t) continue;
    wanted.push({ name: t, why: "Career: " + career.name });
  }
  (d.abilityTalent || []).forEach((t) => { if (t) wanted.push({ name: t, why: "Ability Score" }); });
  const talents = [];
  const seen = new Set();
  for (const w of wanted) {
    const key = w.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const rec = lib.talentNamed(ctx.talents || [], w.name);
    if (!rec) { notes.push("Talent '" + w.name + "' (" + w.why + ") is not in the catalogue."); continue; }
    talents.push({ name: rec.name, ranks: 1, specialization: "", why: w.why });
  }
  const romanRank = String(career.talents || "").match(/Armor Training (I{1,3}V?|IV)/i);
  if (romanRank) {
    const r = { I: 1, II: 2, III: 3, IV: 4 }[romanRank[1].toUpperCase()] || 1;
    const at = talents.find((t) => /^armor training/i.test(t.name));
    if (at) { at.ranks = r; at.specialization = "up to " + ["Reinforced Leather", "Mail", "Scale", "Plate"][r - 1]; }
  }
  for (const lim of race.talentLimits || []) {
    const hit = talents.find((t) => t.name.toLowerCase().indexOf(lim.talent.toLowerCase()) > -1);
    if (hit && hit.ranks > lim.maxRanks) {
      notes.push(race.name + " caps " + lim.talent + " at " + lim.maxRanks + " rank (" + lim.note + ").");
      hit.ranks = lim.maxRanks;
      hit.specialization = lim.note;
    }
  }
  /* The free picks: the career's "one Combat Talent" slots, the Human's
     extra Talent, the Rounding Out bonus Talent. Chosen in the window; the
     old Wizard sent them to Finish Character. */
  for (const f of d.freeTalents || []) {
    if (!f || !f.name) continue;
    if (swap && swap === "slot:" + f.slot) continue;
    const rec = lib.talentNamed(ctx.talents || [], f.name);
    if (!rec) { notes.push("Talent '" + f.name + "' is not in the catalogue."); continue; }
    if (talents.some((t) => t.name.toLowerCase() === rec.name.toLowerCase() && rec.rank === "once")) continue;
    talents.push({ name: rec.name, ranks: 1, specialization: String(f.spec || ""), why: f.source || "Free pick" });
    /* The Savvy Talent: "Pick one skill and mark an S next to it." */
    const target = String(f.spec || "").trim();
    if (/^savvy$/i.test(rec.name) && values[target] && !values[target].savvy) {
      values[target].savvy = true;
      sources[target].push({ label: "Talent: Savvy", savvy: true });
    }
  }
  if (magic && magic.pattern === "fade") {
    const rec = (ctx.talents || []).find((t) => /^faded pattern$/i.test(t.name));
    if (rec) talents.push({ name: rec.name, ranks: 1, specialization: "", why: "Faded Pattern (two Talent selections, p.48)" });
  }

  /* ---- Attributes (p.87), with provenance -------------------------------- */
  const s = d.attrSpend || {};
  const attrs = {};
  const put = (key, value, parts) => { attrs[key] = { value, sources: parts.filter((p) => p.delta !== 0 || p.base) }; };
  /* The BASE Max Resolve. Talents that raise it apply through their own
     ActiveEffects on the actor, so they are not added here. */
  put("resolveMax", 10 + 2 * num(s.resolve, 0), [
    { label: "Base", base: true, delta: 10 }, { label: "Attribute points", delta: 2 * num(s.resolve, 0) }]);
  const initBase = d.randomizedInit ? num(d.initRoll, 6) : 10;
  put("initiative", initBase + num(s.initiative, 0), [
    { label: d.randomizedInit ? "Randomized (6+1d6)" : "Base", base: true, delta: initBase },
    { label: "Attribute points", delta: num(s.initiative, 0) }]);
  put("toughness", Math.floor(num(s.toughness, 0) / 2) + num(race.toughness, 0), [
    { label: "Attribute points (+1 per 2)", delta: Math.floor(num(s.toughness, 0) / 2) },
    { label: "Race: " + race.name, delta: num(race.toughness, 0) }]);
  const dtBase = d.randomizedDT ? num(d.dtRoll, 15) : num(race.dt, 20);
  const dtPoints = d.randomizedDT ? 0 : 2 * num(s.dt, 0);
  put("deathThreshold", dtBase + dtPoints + num(age && age.dt, 0), [
    { label: d.randomizedDT ? "Randomized (15+2d4)" : "Race: " + race.name + " (starting DT)", base: true, delta: dtBase },
    { label: "Attribute points", delta: dtPoints },
    { label: age ? "Rounding Out: " + age.key : "Age", delta: num(age && age.dt, 0) }]);
  put("lethalityBonus", num(race.lethalityBonus, 0), [{ label: "Race: " + race.name, delta: num(race.lethalityBonus, 0) }]);
  put("invBonus", num(race.invBonus, 0), [{ label: "Race: " + race.name, delta: num(race.invBonus, 0) }]);
  const swapStatus = swap && career.name ? 2 : 0;
  put("status", (d.roBonusChoice === "status" ? 1 : 0) + lifeStatus + swapStatus + num(d.statusAdjust, 0), [
    { label: "Rounding Out bonus: Status", delta: d.roBonusChoice === "status" ? 1 : 0 },
    { label: "Swapped a Career Talent (p.102)", delta: swapStatus },
    { label: "Life Events", delta: lifeStatus },
    { label: "Set on the Status step", delta: num(d.statusAdjust, 0) }]);

  /* ---- Silver and starting gear (p.109) ---------------------------------- */
  /* Dice the player rolled in the window live on the draft; a caller (the
     parity check) may pass its own. */
  const r = Object.assign({}, d.rolls || {}, ctx.rolls || {});
  const silverParts = [];
  const known = (v) => v !== null && v !== undefined && Number.isFinite(Number(v));
  if (career.silver) silverParts.push({ label: "Career: " + career.name, dice: career.silver, value: known(r.careerSilver) ? num(r.careerSilver) : null });
  if (culture && culture.silver) silverParts.push({ label: "Culture: " + culture.name, dice: culture.silver, value: known(r.cultureSilver) ? num(r.cultureSilver) : null });
  silverParts.push({ label: "Equip Your Character", dice: "2d4*50", value: known(r.equipCoin) ? num(r.equipCoin) : null });
  if (d.roBonusChoice === "money") silverParts.push({ label: "Rounding Out bonus: silver", dice: null, value: 100 });
  const silverTotal = silverParts.every((p) => p.value !== null) ? silverParts.reduce((n, p) => n + p.value, 0) : null;
  const bought = (d.purchases || []).filter((p) => p && p.name).map((p) => ({ name: p.name, kind: p.kind, sp: num(p.sp), qty: Math.max(1, num(p.qty, 1)), loc: p.loc || null }));
  const silverSpent = bought.reduce((n, p) => n + p.sp * p.qty, 0);

  const personality = (d.personalityPicks || [])
    .concat(String(d.personalityCustom || "").split(",").map((x) => x.trim()).filter(Boolean))
    .concat((d.abilityDescriptor || []).filter(Boolean))
    .filter((v, i, a) => a.indexOf(v) === i);

  return {
    identity: {
      name: String(d.name || "").trim(), sex: String(d.sex || "").trim(),
      race: race.name, career: career.name, culture: String(d.cultureBgName || "").trim(), size: race.size,
      concept: String(d.concept || "").trim(),
      pattern: magic ? magic.pattern : "none",
      convocation: magic && magic.pattern === "spellweaver" ? (d.convocation || "") : "",
      trueName: String(d.trueName || "").trim()
    },
    skills: Object.fromEntries(Object.entries(values).map(([n, v]) => [n, Object.assign({}, v, { sources: sources[n] })])),
    extraSkills: extra,
    strands: magic && magic.pattern !== "none"
      ? Object.entries(magic.strands).filter(([, lv]) => lv > 0)
          .map(([name, level]) => ({ name, level, thin: magic.thin.has(name), sources: magic.strandSources[name] }))
      : [],
    thread: magic && magic.pattern !== "none" && d.threadAttunement ? (() => {
      const [kind, nm] = String(d.threadAttunement).split(":");
      return { name: String(d.threadName || "").trim() || (nm + " Thread"), attunement: nm, kind, die: "d8" };
    })() : null,
    talents,
    attributes: attrs,
    silver: { parts: silverParts, total: silverTotal, spent: silverSpent, left: silverTotal === null ? null : silverTotal - silverSpent },
    equipment: { free: ["Dagger"], freeArmorPieces: known(r.armorPieces) ? num(r.armorPieces) : null,
      freeArmor: (d.freeArmor || []).filter((a) => a && a.name).map((a) => ({ name: a.name, loc: a.loc || null })), bought },
    goals: (d.goals || []).filter((g) => g && String(g.text || "").trim()).map((g) => ({ text: String(g.text).trim(), kind: g.kind || "individual" })),
    relationshipNpcs: (d.relationshipNpcs || []).slice(),
    personality,
    careerPoints: spent,
    roundingLost,
    notes: notes.concat(magic ? magic.notes : [])
  };
}

/* Every Bind value and Strand level, from every source that can move them,
 * capped last (p.104-105, p.108). Same sources and order as the Wizard's
 * computeMagic, which it replaces. */
function deriveMagic(d, race, MAGIC, lifeOpt, notes) {
  const BINDS = (MAGIC.binds || []).map((b) => b.name);
  const STRANDS = (MAGIC.strands || []).map((x) => x.name);
  const R = MAGIC.rules || {};
  const SW = R.spellweaverChargen || {};
  const bindCap = SW.bindCapAtChargen || 70;
  const strandCap = R.chargenStrandCap || 5;

  const barred = (race.restrictions || []).some((t) => /never (become any type of |be )?spellweavers? or fades?/i.test(t));
  const pattern = barred ? "none" : d.careerName === "Spellweaver" ? "spellweaver" : d.takeFade ? "fade" : "none";
  const binds = {}, strands = {}, bindSources = {}, strandSources = {};
  for (const n of BINDS) { binds[n] = 0; bindSources[n] = []; }
  for (const n of STRANDS) { strands[n] = 0; strandSources[n] = []; }
  const out = [];
  const thin = new Set(pattern === "spellweaver" ? (d.swThin || []).filter(Boolean) : []);
  const addBind = (name, amount, label) => {
    if (!name || !(name in binds)) { if (name) out.push("Bind \"" + name + "\" is not one of the five."); return; }
    binds[name] += num(amount, 0);
    bindSources[name].push({ label, delta: num(amount, 0) });
  };
  const addStrand = (name, levels, label) => {
    if (!name || !(name in strands)) { if (name) out.push("Strand \"" + name + "\" is not one of the ten."); return; }
    strands[name] += num(levels, 0);
    strandSources[name].push({ label, delta: num(levels, 0) });
  };

  for (const key of LIFE_KEYS) {
    const opt = lifeOpt(key);
    if (!opt || (opt.kind !== "bind" && opt.kind !== "strand")) continue;
    const nm = opt.name || (d.lifeChoiceExtra || {})[key] || "";
    if (pattern === "none") { out.push("Life Event (" + key + "): " + opt.label + " is the Spellweaver branch; this character is not Patterned."); continue; }
    if (!nm) { out.push("Life Event (" + key + "): name the " + opt.kind + "."); continue; }
    const label = "Life Event (" + key + "): " + d.lifeEvents[key].name;
    if (opt.kind === "bind") addBind(nm, num(opt.amount, 10), label);
    else addStrand(nm, num(opt.amount, 2), label);
  }
  const racePick = String(d.raceBindPick || "").trim().replace(/^bind\s*:\s*/i, "");
  if (racePick && pattern !== "none") addBind(racePick, 10, "Race: " + race.name);

  if (pattern === "spellweaver") {
    for (const b of d.swBinds || []) if (b) addBind(b, SW.bindBonus || 10, "Spellweaver: chosen Bind");
    for (const [n, pts] of Object.entries(d.magicAlloc || {})) { const a = Math.max(0, num(pts, 0)); if (a) addBind(n, a, "Spellweaver: Magic points"); }
    for (const [n, lv] of Object.entries(d.strandAlloc || {})) { const a = Math.max(0, num(lv, 0)); if (a) addStrand(n, a, "Spellweaver: Strand levels"); }
    for (const [n, lv] of Object.entries(d.strandExtra || {})) {
      const a = Math.max(0, num(lv, 0));
      if (!a) continue;
      if (thin.has(n)) { out.push("The three extra Strand levels cannot go to a Thin Strand (" + n + ")."); continue; }
      addStrand(n, a, "Spellweaver: extra Strand levels");
    }
  } else if (pattern === "fade") {
    for (const [n, lv] of Object.entries(d.fadeStrands || {})) { const a = Math.max(0, num(lv, 0)); if (a) addStrand(n, a, "Faded Pattern"); }
  }
  if (pattern !== "none") {
    for (const [n, pts] of Object.entries(d.roBindAlloc || {})) { const a = Math.max(0, num(pts, 0)); if (a) addBind(n, a, "Rounding Out"); }
    for (const [n, lv] of Object.entries(d.roStrandAlloc || {})) { const a = Math.max(0, num(lv, 0)); if (a) addStrand(n, a, "Rounding Out"); }
  }
  for (const n of BINDS) if (binds[n] > bindCap) { binds[n] = bindCap; bindSources[n].push({ label: "Creation cap " + bindCap + " (p.104)", cap: true }); }
  for (const n of STRANDS) if (strands[n] > strandCap) { strands[n] = strandCap; strandSources[n].push({ label: "Creation cap " + strandCap + " (p.105)", cap: true }); }
  return { pattern, binds, strands, thin, bindSources, strandSources, notes: out };
}
