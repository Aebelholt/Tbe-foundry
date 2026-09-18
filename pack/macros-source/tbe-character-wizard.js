/* TBE: Character Wizard — a real persistent, step-back-able chargen flow
 * that now follows the book's actual 12-step order (Ch.7 p.78), not just the
 * subset the old `TBE: Build Character` macro covered. One window, forward
 * and back navigation, nothing written to the actor until Create Character
 * on the final page.
 *
 * Scope, deliberately, per direct user steer ("show tables in name only, not
 * full detail, I have the book"):
 *   - Fully applied to the actor (compact, well-defined mechanics, same
 *     standard as Race/Career already got): Starting Skills, Race, Ability
 *     Scores, Attributes, Cultural Background (incl. Human Culture Language),
 *     Previous Career, Career Skill Points, Rounding Out, Talents.
 *   - Table shown (name + d100/d10/d4 range, roll button) but NOT
 *     mechanically auto-applied, because each result's exact bonus needs a
 *     player choice among 2-3 skills that the book states in prose, not a
 *     clean data table: Life Events (Origin/Youth/Recent), Shared History,
 *     Relationship NPCs. The rolled/picked name is recorded to the Notes tab
 *     so the player can look up the exact line in their own copy and apply
 *     it via the Skills tab.
 *   - Free text, no table: Character Goals.
 *   - Info only: Equip Your Character (dagger auto-added from the
 *     compendium, armor-piece count and starting coin rolled and reported,
 *     but actual shopping stays on the Gear tab -- a full purchase UI is a
 *     separate project), Status (Optional).
 *
 * Built as classic `Application` (v1), not ApplicationV2 -- this pack still
 * targets Foundry v11, where ApplicationV2 doesn't exist.
 *
 * The draft lives only in this window's memory, not on the actor or in a
 * flag. Cross-session persistence remains a tracked BACKLOG.md gap.
 */

const CHARGEN_SKILL_CAP = 70;
const SKILLS = {
  Combat: ["Dodge", "Melee: Light", "Melee: Medium", "Melee: Heavy", "Might", "Missile", "Thrown"],
  Adventuring: ["Athletics", "Endurance", "Locks & Traps", "Perception", "Ride", "Sail/Boat",
    "Sleight of Hand", "Stealth", "Survival", "Track", "Willpower"],
  Social: ["Deceive", "Insight", "Inspire", "Intimidate", "Perform", "Persuade", "Protocol", "Seduce", "Wit"],
  Lore: ["Ancient Lore", "Arcana", "Commerce", "Common Lore", "Craft: Artistic", "Craft: Practical",
    "Divinity", "Heal", "Naturewise", "Streetwise"]
};
const SKILL_ALL = Object.values(SKILLS).flat();
const RELATIONSHIP_TYPES = [{ d4: 1, name: "Friend" }, { d4: 2, name: "Patron" }, { d4: 3, name: "Rival" }, { d4: 4, name: "Adversary" }];

const actor = canvas.tokens?.controlled?.[0]?.actor ?? game.user?.character ?? null;
if (!actor) {
  ui.notifications?.warn("TBE: select a token, or set an assigned character, then run this again.");
} else {

  const RACES = TBE_CHARGEN.races || [];
  const CAREERS = TBE_CHARGEN.careers || [];
  const ABILITY_SCORES = TBE_CHARGEN.abilityScores || [];
  const CULTURES = TBE_CHARGEN.culturalBackgrounds || [];
  const HUMAN_CULTURES = TBE_CHARGEN.humanCultures || [];
  const LIFE_EVENTS = TBE_CHARGEN.lifeEvents || { origin: [], youth: [], recent: [] };
  const ROUNDING_OUT_AGES = TBE_CHARGEN.roundingOutAges || [];
  const PERSONALITY_TRAITS = TBE_CHARGEN.personalityTraits || [];
  const bareName = (n) => n.replace(/\s*\([^)]*\)\s*$/, "").toLowerCase().trim();

  /* ---- random determination helpers (every table below is named in the
     book as an explicit "or roll" option alongside picking by hand). ------ */
  // `max` is the die's face count (100 for d100, 10 for d10): the book writes
  // the top of a range as "0" (d10, e.g. "9-0" = 9 or 10) or "00" (d100, e.g.
  // "99-00" = 99 or 100) rather than the literal number, so a trailing 0 has
  // to be reinterpreted as `max`, not taken at face value -- otherwise the
  // very last row of every such table (the one landing on the die's max
  // face) silently never matches any roll.
  function parseD100Range(s, max) {
    max = max || 100;
    if (s === "00" || s === "0") return [max, max];
    const m = String(s).match(/(\d+)\s*-\s*(\d+)/);
    if (m) {
      const lo = parseInt(m[1], 10);
      let hi = parseInt(m[2], 10);
      if (hi === 0) hi = max;
      return [lo, hi];
    }
    const n = parseInt(s, 10);
    return [n, n];
  }
  function forRoll(table, roll, rangeKey, max) {
    for (const r of table) {
      const [lo, hi] = parseD100Range(r[rangeKey] ?? r.range ?? r.d100, max);
      if (roll >= lo && roll <= hi) return r;
    }
    return null;
  }
  function raceForRoll(roll) { return forRoll(RACES, roll, "d100", 100); }
  function careerForRoll(roll) { return CAREERS.find((c) => Number(c.d10) === roll) || null; }
  function cultureBgForRoll(roll) { return forRoll(CULTURES, roll, "range", 10); }
  function humanCultureForRoll(roll) { return forRoll(HUMAN_CULTURES, roll, "range", 100); }
  function lifeEventForRoll(table, roll) { return forRoll(table, roll, "range", 100); }
  function rollTableHtml(rows, colHead) {
    return '<table style="width:100%;font-size:11px;margin-top:8px;border-collapse:collapse;opacity:.9">' +
      "<thead><tr><th style=\"text-align:left;border-bottom:1px solid #7a6a4f\">" + colHead +
      "</th><th style=\"text-align:left;border-bottom:1px solid #7a6a4f\">Result</th></tr></thead><tbody>" +
      rows.map((r) => "<tr" + (r.hit ? ' style="font-weight:bold;color:#e0ac5c"' : "") +
        "><td>" + r.range + "</td><td>" + r.name + "</td></tr>").join("") + "</tbody></table>";
  }
  function resolveOptions(token) {
    if (Array.isArray(token)) return token;
    if (typeof token === "string" && token.indexOf("CAT:") === 0) {
      return token.slice(4).split("+").reduce((out, c) => out.concat(SKILLS[c] || []), []);
    }
    return [];
  }
  function raiseExpertise(cur) { return cur === 0 ? 2 : Math.min(4, cur + 1); }

  /* ---- pure helpers, shared between step previews and the final commit so
     the two can never silently disagree with each other. ------------------ */

  function poolCats(career) {
    return Object.entries(career.pools || {}).filter(([cat, pool]) => pool && cat !== "Magic" && (SKILLS[cat] || []).length);
  }
  function evenSplit(career) {
    const alloc = {};
    for (const [cat, pool] of poolCats(career)) {
      const names = SKILLS[cat];
      const each = Math.floor(pool / names.length);
      let rest = pool - each * names.length;
      names.forEach((n, idx) => {
        alloc[cat + "_" + idx] = each + (rest > 0 ? 1 : 0);
        if (rest > 0) rest--;
      });
    }
    return alloc;
  }

  /* Base values (step 1) + the 4 category "boost one skill to 30" choices,
     career pool spend, race mods, Ability Score bonuses, and Cultural
     Background bonuses -- all layered onto one values map so nothing has to
     be reconciled twice between preview and commit. */
  function computeSkillValues(draft) {
    const base = TBE.num(draft.base, 20);
    const values = {};
    for (const group of Object.keys(SKILLS)) {
      for (const name of SKILLS[group]) values[name] = { group, value: base, fighting: group === "Combat", expertise: 0 };
    }
    const notesOut = [];

    // Step 1: one skill per category (except Magic) to 30 -- i.e. +10 over the base 20.
    for (const [cat, skill] of Object.entries(draft.boost || {})) {
      if (skill && values[skill]) values[skill].value = Math.min(CHARGEN_SKILL_CAP, values[skill].value + 10);
    }

    // Step 7/skill points: career pools, spent by the player.
    const career = CAREERS.find((c) => c.name === draft.careerName) || CAREERS[0];
    const spent = [];
    for (const [cat, pool] of Object.entries(career.pools || {})) {
      if (!pool) continue;
      if (cat === "Magic") { notesOut.push("Magic pool of " + pool + " points: assign by hand to your Bind skills (no Bind may exceed 70)."); continue; }
      const names = SKILLS[cat] || [];
      if (!names.length) continue;
      let allocated = 0;
      names.forEach((n, idx) => {
        const add = Math.max(0, TBE.num((draft.alloc || {})[cat + "_" + idx], 0));
        allocated += add;
        values[n].value = Math.min(CHARGEN_SKILL_CAP, values[n].value + add);
      });
      spent.push(cat + " " + allocated + "/" + pool);
      if (allocated !== pool) {
        notesOut.push(cat + ": you allocated " + allocated + " of " + pool + " points" +
          (allocated < pool ? " (" + (pool - allocated) + " unspent, add them later via TBE: Advancement or the Skills tab)" : " (over the pool by " + (allocated - pool) + " -- trim it on the Skills tab)") + ".");
      }
    }

    // Step 2: racial modifiers.
    const race = RACES.find((r) => r.name === draft.raceName) || RACES[0];
    const raceApplied = [];
    for (const m of race.skillMods || []) {
      if (!values[m.skill]) { notesOut.push("Racial modifier " + (m.mod > 0 ? "+" : "") + m.mod + " to " + m.skill + ": no such skill on the list, apply by hand."); continue; }
      values[m.skill].value = Math.max(0, values[m.skill].value + m.mod);
      raceApplied.push(m.skill + " " + (m.mod > 0 ? "+" : "") + m.mod);
    }

    // Step 3: Ability Scores -- +5 to each listed skill, +1 Expertise to one of them.
    const abilityApplied = [];
    (draft.abilityPicks || []).forEach((scoreName, i) => {
      if (!scoreName) return;
      const score = ABILITY_SCORES.find((a) => a.name === scoreName);
      if (!score) return;
      for (const sk of score.skills) if (values[sk]) values[sk].value = Math.min(CHARGEN_SKILL_CAP, values[sk].value + 5);
      const exSkill = (draft.abilityExpertise || [])[i];
      if (exSkill && values[exSkill]) values[exSkill].expertise = raiseExpertise(values[exSkill].expertise);
      abilityApplied.push(scoreName + " (+5 to " + score.skills.join(", ") + (exSkill ? ", Ex to " + exSkill : "") + ")");
    });

    // Step 5: Cultural Background picks.
    const cultureApplied = [];
    const culture = CULTURES.find((c) => c.name === draft.cultureBgName);
    if (culture) {
      culture.picks.forEach((pick, pi) => {
        const chosen = (draft.cultureBgPicks || {})[pi] || [];
        chosen.forEach((sk) => {
          if (!sk || !values[sk]) return;
          if (pick.expertise) { values[sk].expertise = raiseExpertise(values[sk].expertise); cultureApplied.push(sk + " Ex"); }
          else { values[sk].value = Math.min(CHARGEN_SKILL_CAP, values[sk].value + pick.amount); cultureApplied.push(sk + " +" + pick.amount); }
        });
      });
    }

    // Step 8: Rounding Out -- age bonuses (Endurance/DT handled by caller for DT;
    // Endurance is a normal skill so it's handled here), Expertise, bonus pools.
    const age = ROUNDING_OUT_AGES.find((a) => a.key === draft.roAge);
    const roApplied = [];
    if (age) {
      if (age.endurance && values.Endurance) {
        values.Endurance.value = Math.max(0, Math.min(CHARGEN_SKILL_CAP, values.Endurance.value + age.endurance));
        roApplied.push("Endurance " + (age.endurance > 0 ? "+" : "") + age.endurance + " (" + age.key + ")");
      }
      if (age.expertise && draft.roOldExpertiseSkill && values[draft.roOldExpertiseSkill]) {
        values[draft.roOldExpertiseSkill].expertise = raiseExpertise(values[draft.roOldExpertiseSkill].expertise);
        roApplied.push(draft.roOldExpertiseSkill + " Ex (Old)");
      }
      for (const [sk, pts] of Object.entries(draft.roAlloc || {})) {
        const add = Math.max(0, TBE.num(pts, 0));
        if (add && values[sk]) { values[sk].value = Math.min(CHARGEN_SKILL_CAP, values[sk].value + add); roApplied.push(sk + " +" + add + " (bonus)"); }
      }
      for (const [sk, pts] of Object.entries(draft.roLoreAlloc || {})) {
        const add = Math.max(0, TBE.num(pts, 0));
        if (add && values[sk] && SKILLS.Lore.includes(sk)) { values[sk].value = Math.min(CHARGEN_SKILL_CAP, values[sk].value + add); roApplied.push(sk + " +" + add + " (Old Lore bonus)"); }
      }
    }
    for (const sk of (draft.roSavvy || [])) if (sk && values[sk]) values[sk].savvy = true;

    return { values, spent, raceApplied, abilityApplied, cultureApplied, roApplied, notesOut, race, career, age };
  }

  function computeTalents(race, career) {
    const wanted = [];
    for (const t of race.exclusiveTalents || []) wanted.push({ name: t, why: race.name + " exclusive" });
    const careerTalentText = career.talents || "";
    const careerLower = careerTalentText.toLowerCase();
    for (const t of TBE_TALENTS) {
      const bare = bareName(t.name);
      if (bare.length >= 4 && careerLower.indexOf(bare) > -1) wanted.push({ name: t.name, why: career.name + " career" });
    }
    return { wanted, careerTalentText };
  }
  function resolveTalentPayload(wanted, race, career) {
    const talentPayload = [];
    const notesOut = [];
    const seen = new Set();
    for (const w of wanted) {
      const key = w.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const rec = TBE_TALENTS.find((t) => t.name.toLowerCase() === key);
      if (!rec) { notesOut.push("Talent '" + w.name + "' (" + w.why + ") is not in the catalogue, add it by hand."); continue; }
      talentPayload.push({
        name: rec.name, type: "talent", img: "icons/svg/upgrade.svg",
        system: { category: rec.category, requirements: rec.requires || "", ranks: 1, maxRanks: rec.rank, specialization: "", sub: !!rec.sub, description: "<p>" + rec.desc + "</p>" }
      });
    }
    const romanRank = (career.talents || "").match(/Armor Training (I{1,3}V?|IV)/i);
    if (romanRank) {
      const r = { I: 1, II: 2, III: 3, IV: 4 }[romanRank[1].toUpperCase()] || 1;
      const at = talentPayload.find((t) => /^armor training/i.test(t.name));
      if (at) { at.system.ranks = r; at.system.specialization = "up to " + ["Reinforced Leather", "Mail", "Scale", "Plate"][r - 1]; }
    }
    for (const lim of race.talentLimits || []) {
      const hit = talentPayload.find((t) => t.name.toLowerCase().indexOf(lim.talent.toLowerCase()) > -1);
      if (hit && hit.system.ranks > lim.maxRanks) {
        notesOut.push(race.name + " caps " + lim.talent + " at " + lim.maxRanks + " rank (" + lim.note + "), down from the career's " + hit.system.ranks + ".");
        hit.system.ranks = lim.maxRanks;
        hit.system.specialization = lim.note;
      }
    }
    return { talentPayload, notesOut };
  }

  class TBECharacterWizard extends Application {
    constructor(targetActor, opts = {}) {
      super(opts);
      this.actor = targetActor;
      this.step = 0;
      this.STEP_DEFS = [
        { key: "concept", label: "Concept" },
        { key: "race", label: "Race" },
        { key: "ability", label: "Ability Scores" },
        { key: "attributes", label: "Attributes" },
        { key: "culture", label: "Culture" },
        { key: "life", label: "Life Events" },
        { key: "career", label: "Career" },
        { key: "skillPoints", label: "Skill Points" },
        { key: "rounding", label: "Rounding Out" },
        { key: "equip", label: "Equip" },
        { key: "talents", label: "Talents" },
        { key: "personality", label: "Personality" },
        { key: "goals", label: "Goals" },
        { key: "status", label: "Status" },
        { key: "review", label: "Review" }
      ];
      this.draft = {
        culture: "Westlands", lang: "Westronne", base: 20, wises: 4, binds: 2,
        boost: { Combat: null, Adventuring: null, Social: null, Lore: null },
        wipe: true, seedNotes: true,
        raceName: RACES[0]?.name || "", careerName: CAREERS[0]?.name || "",
        allocFor: null, alloc: {},
        abilityPicks: [null, null], abilityExpertise: [null, null], abilityTalent: [null, null], abilityDescriptor: [null, null],
        attrSpend: { resolve: 0, initiative: 0, toughness: 0, dt: 0 }, randomizedInit: false, randomizedDT: false,
        cultureBgName: CULTURES[0]?.name || "", cultureBgFor: null, cultureBgPicks: {},
        humanCultureName: "", humanCultureLang: "",
        lifeEvents: { origin: null, youth: null, recent: null },
        sharedHistoryWith: "", sharedHistorySkill: "",
        relationshipNpcs: [],
        roBonusChoice: "talent", roAge: "Adult", roAlloc: {}, roLoreAlloc: {}, roAllocFor: null, roOldExpertiseSkill: "",
        roSavvy: [null, null, null],
        personalityPicks: [], personalityCustom: "",
        goalIndividual: "", goalShared: "",
        useStatus: true
      };
    }

    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        id: "tbe-character-wizard", title: "TBE: Character Wizard",
        width: 620, height: 640, resizable: true, classes: ["tbe-wizard"]
      });
    }

    race() { return RACES.find((r) => r.name === this.draft.raceName) || RACES[0]; }
    career() { return CAREERS.find((c) => c.name === this.draft.careerName) || CAREERS[0]; }
    culture() { return CULTURES.find((c) => c.name === this.draft.cultureBgName) || CULTURES[0]; }

    ensureAlloc() {
      const career = this.career();
      if (this.draft.allocFor === career.name) return;
      this.draft.alloc = evenSplit(career);
      this.draft.allocFor = career.name;
    }
    ensureCulturePicks() {
      const culture = this.culture();
      if (this.draft.cultureBgFor === culture.name) return;
      this.draft.cultureBgPicks = {};
      this.draft.cultureBgFor = culture.name;
    }
    ensureRoAlloc() {
      const key = this.draft.roAge;
      if (this.draft.roAllocFor === key) return;
      this.draft.roAlloc = {}; this.draft.roLoreAlloc = {};
      this.draft.roAllocFor = key;
    }

    async _renderInner() { return $(this._html()); }

    _progressHtml() {
      return '<div style="display:flex;flex-wrap:wrap;gap:2px;margin-bottom:8px;font-size:9px">' +
        this.STEP_DEFS.map((s, i) => '<div style="flex:1 1 auto;min-width:52px;text-align:center;padding:2px 1px;border-radius:3px;' +
          (i === this.step ? "background:#7a6a4f;color:#fff;font-weight:bold" : i < this.step ? "background:#c9bd9e" : "background:#eee;color:#888") +
          '">' + (i + 1) + ". " + s.label + "</div>").join("") + "</div>";
    }

    _footerHtml() {
      const last = this.step === this.STEP_DEFS.length - 1;
      return '<div style="display:flex;justify-content:space-between;margin-top:10px;border-top:1px solid #7a6a4f;padding-top:8px">' +
        '<button type="button" data-action="back"' + (this.step === 0 ? " disabled" : "") + ">&larr; Back</button>" +
        (last ? '<button type="button" data-action="create" style="font-weight:bold">Create Character</button>'
          : '<button type="button" data-action="next">Next &rarr;</button>') + "</div>";
    }

    // ---- step 1: Concept & Starting Skills (p.79-80) ----------------------
    _step_concept() {
      const d = this.draft;
      let boosts = '<div style="font-size:12px;margin-top:8px;margin-bottom:2px">Choose one skill per category to start at 30 (p.80); all others in that category start at the base value below.</div>';
      for (const cat of Object.keys(SKILLS)) {
        const opts = '<option value="">(none)</option>' + SKILLS[cat].map((n) => '<option value="' + n + '"' + (d.boost[cat] === n ? " selected" : "") + '>' + n + "</option>").join("");
        boosts += '<label style="display:inline-block;width:49%">' + cat + " to 30: <select data-boost-cat=\"" + cat + '" style="width:100%">' + opts + "</select></label>";
      }
      return '<label style="display:block">Cultural background (free text, refined on the Culture step): <input type="text" name="culture" value="' + d.culture + '" style="width:100%"></label>' +
        '<label style="display:block">Native language: <input type="text" name="lang" value="' + d.lang + '" style="width:100%"></label>' +
        '<label style="display:block">Base skill value (book default 20): <input type="number" name="base" value="' + d.base + '" style="width:100%"></label>' +
        '<label style="display:block">Blank -wise slots: <input type="number" name="wises" value="' + d.wises + '" min="0" max="12" style="width:100%"></label>' +
        '<label style="display:block">Blank Bind slots: <input type="number" name="binds" value="' + d.binds + '" min="0" max="6" style="width:100%"></label>' +
        boosts;
    }

    // ---- step 2: Choose a Race (p.81) --------------------------------------
    _step_race() {
      const opts = RACES.map((r) => '<option value="' + r.name + '"' + (r.name === this.draft.raceName ? " selected" : "") + '>' + r.name + " (" + r.d100 + ")</option>").join("");
      const r = this.race();
      const summary = r ? '<div style="font-size:12px;margin-top:6px;opacity:.85">Toughness ' + r.toughness + ", Death Threshold " + r.dt + ", Size " + r.size +
        (r.lethalityBonus ? ", Lethality +" + r.lethalityBonus : "") + "." +
        ((r.skillMods || []).length ? "<br>Skill mods: " + r.skillMods.map((m) => m.skill + " " + (m.mod > 0 ? "+" : "") + m.mod).join(", ") : "") +
        ((r.exclusiveTalents || []).length ? "<br>Exclusive Talents: " + r.exclusiveTalents.join(", ") : "") +
        ((r.restrictions || []).length ? "<br>" + r.restrictions.join("<br>") : "") + "</div>" : "";
      const rollRow = '<div style="margin-top:8px"><button type="button" data-action="roll-race">Roll 1d100 for Race</button>' +
        (this.draft.raceRollNote ? '<div style="font-size:11px;opacity:.8;margin-top:4px">' + this.draft.raceRollNote + "</div>" : "") + "</div>";
      const table = rollTableHtml(RACES.map((rr) => ({ range: rr.d100, name: rr.name, hit: rr.name === this.draft.raceName })), "d100");
      return '<label style="display:block">Race: <select name="race" style="width:100%">' + opts + "</select></label>" + summary + rollRow + table;
    }

    // ---- step 3: Choose Ability Scores (p.85-86) ---------------------------
    _step_ability() {
      const d = this.draft;
      let html = '<div style="font-size:12px;margin-bottom:6px">Pick 2 (or roll 1d6 twice). Each: +5 to its listed skills, 1 Expertise level to one of them, one of 3 Talents, one descriptor (usable as a Personality Trait).</div>';
      for (let i = 0; i < 2; i++) {
        const used = d.abilityPicks.filter((_, j) => j !== i);
        const opts = '<option value="">(none)</option>' + ABILITY_SCORES.filter((a) => used.indexOf(a.name) === -1)
          .map((a) => '<option value="' + a.name + '"' + (d.abilityPicks[i] === a.name ? " selected" : "") + '>' + a.name + "</option>").join("");
        html += '<div style="margin-top:8px;border-top:1px solid #7a6a4f;padding-top:6px"><label style="display:block">Score ' + (i + 1) + ': <select data-ability-idx="' + i + '" style="width:100%">' + opts + "</select></label>";
        const score = ABILITY_SCORES.find((a) => a.name === d.abilityPicks[i]);
        if (score) {
          const exOpts = score.skills.map((s) => '<option value="' + s + '"' + (d.abilityExpertise[i] === s ? " selected" : "") + '>' + s + "</option>").join("");
          const talOpts = score.talents.map((t) => '<option value="' + t + '"' + (d.abilityTalent[i] === t ? " selected" : "") + '>' + t + "</option>").join("");
          const descOpts = score.descriptors.map((x) => '<option value="' + x + '"' + (d.abilityDescriptor[i] === x ? " selected" : "") + '>' + x + "</option>").join("");
          html += '<div style="font-size:11px;opacity:.8;margin:2px 0">+5 to: ' + score.skills.join(", ") + "</div>" +
            '<label style="display:inline-block;width:32%">Expertise: <select data-ability-ex="' + i + '" style="width:100%">' + exOpts + "</select></label>" +
            '<label style="display:inline-block;width:32%">Talent: <select data-ability-tal="' + i + '" style="width:100%">' + talOpts + "</select></label>" +
            '<label style="display:inline-block;width:32%">Descriptor: <select data-ability-desc="' + i + '" style="width:100%">' + descOpts + "</select></label>";
        }
        html += "</div>";
      }
      html += '<div style="margin-top:8px"><button type="button" data-action="roll-ability">Roll 1d6 twice</button></div>';
      return html;
    }

    // ---- step 4: Determine Attributes (p.87) -------------------------------
    _step_attributes() {
      const d = this.draft;
      const s = d.attrSpend;
      const spent = TBE.num(s.resolve, 0) + TBE.num(s.initiative, 0) + TBE.num(s.toughness, 0) + TBE.num(s.dt, 0);
      const remaining = 5 - spent;
      const resolve = 10 + 2 * TBE.num(s.resolve, 0);
      const initBase = d.randomizedInit ? TBE.num(d.initRoll, 6) : 10;
      const initiative = initBase + TBE.num(s.initiative, 0);
      const toughness = Math.floor(TBE.num(s.toughness, 0) / 2);
      const dtBase = d.randomizedDT ? TBE.num(d.dtRoll, 15) : 20;
      const dt = d.randomizedDT ? dtBase : dtBase + 2 * TBE.num(s.dt, 0);
      const ll = Math.ceil(dt / 3);
      return '<div style="font-size:12px;margin-bottom:6px">Allocate 5 points among the first four Attributes. Remaining: <b>' + remaining + "</b></div>" +
        '<label style="display:inline-block;width:49%">Max Resolve points (+2 boxes each): <input type="number" min="0" data-attr="resolve" value="' + TBE.num(s.resolve, 0) + '" style="width:60px"></label>' +
        '<label style="display:inline-block;width:49%">Initiative points (+1 each): <input type="number" min="0" data-attr="initiative" value="' + TBE.num(s.initiative, 0) + '" style="width:60px"' + (d.randomizedInit ? " disabled" : "") + "></label>" +
        '<label style="display:inline-block;width:49%">Toughness points (+1 per 2): <input type="number" min="0" data-attr="toughness" value="' + TBE.num(s.toughness, 0) + '" style="width:60px"></label>' +
        '<label style="display:inline-block;width:49%">Death Threshold points (+2 each): <input type="number" min="0" data-attr="dt" value="' + TBE.num(s.dt, 0) + '" style="width:60px"' + (d.randomizedDT ? " disabled" : "") + "></label>" +
        '<div style="font-size:12px;margin-top:8px;opacity:.9">Max Resolve <b>' + resolve + "</b>, Initiative <b>" + (initiative >= 0 ? "+" : "") + initiative + "</b>, Toughness <b>" + toughness + "</b>, Death Threshold <b>" + dt + "</b>, Lethality Level <b>" + ll + "</b></div>" +
        '<div style="margin-top:8px;border-top:1px solid #7a6a4f;padding-top:6px">' +
        '<label style="display:block"><input type="checkbox" data-attr-opt="randomizedInit"' + (d.randomizedInit ? " checked" : "") + '> Randomized Initiative: start 6+1d6 instead of 10' +
        (d.randomizedInit ? ' <button type="button" data-action="roll-init">Roll</button> ' + (d.initRoll ? "(" + d.initRoll + ")" : "") : "") + "</label>" +
        '<label style="display:block"><input type="checkbox" data-attr-opt="randomizedDT"' + (d.randomizedDT ? " checked" : "") + '> Randomized Death Threshold: start 15+2d4 instead of 20, no further DT points' +
        (d.randomizedDT ? ' <button type="button" data-action="roll-dt">Roll</button> ' + (d.dtRoll ? "(" + d.dtRoll + ")" : "") : "") + "</label></div>";
    }

    // ---- step 5: Pick a Cultural Background (p.88-90) ----------------------
    _step_culture() {
      this.ensureCulturePicks();
      const d = this.draft;
      const opts = CULTURES.map((c) => '<option value="' + c.name + '"' + (c.name === d.cultureBgName ? " selected" : "") + '>' + c.name + " (" + c.range + ")</option>").join("");
      const rollRow = '<div style="margin-top:6px"><button type="button" data-action="roll-culture">Roll 1d10 for Culture</button>' +
        (d.cultureRollNote ? '<div style="font-size:11px;opacity:.8;margin-top:4px">' + d.cultureRollNote + "</div>" : "") + "</div>";
      const table = rollTableHtml(CULTURES.map((c) => ({ range: c.range, name: c.name, hit: c.name === d.cultureBgName })), "d10");
      const culture = this.culture();
      let picks = '<div style="font-size:12px;margin-top:8px">' + culture.name + " bonuses &mdash; pick a skill for each:</div>";
      culture.picks.forEach((pick, pi) => {
        const options = resolveOptions(pick.options);
        const already = d.cultureBgPicks[pi] || [];
        for (let slot = 0; slot < pick.count; slot++) {
          const optsHtml = options.map((s) => '<option value="' + s + '"' + (already[slot] === s ? " selected" : "") + '>' + s + "</option>").join("");
          const label = (pick.expertise ? "Expertise: " : "+" + pick.amount + ": ") + (options.length === 1 ? options[0] : "choose");
          picks += '<label style="display:inline-block;width:49%;font-size:12px">' + label + ': <select data-culture-pick="' + pi + '" data-culture-slot="' + slot + '" style="width:100%">' + optsHtml + "</select></label>";
        }
      });
      let humanCulture = "";
      if (this.race().name === "Human") {
        const hOpts = HUMAN_CULTURES.map((h) => '<option value="' + h.range + '"' + (d.humanCultureRange === h.range ? " selected" : "") + '>' + h.name + " (" + h.range + ") — " + h.language + "</option>").join("");
        humanCulture = '<div style="margin-top:8px;border-top:1px solid #7a6a4f;padding-top:6px"><div style="font-size:12px">Human Culture (p.83) sets your native language above.</div>' +
          '<select data-human-culture style="width:100%">' + hOpts + "</select>" +
          '<div style="margin-top:4px"><button type="button" data-action="roll-human-culture">Roll 1d100</button></div>' +
          rollTableHtml(HUMAN_CULTURES.map((h) => ({ range: h.range, name: h.name + " (" + h.language + ")", hit: h.range === d.humanCultureRange })), "d100") + "</div>";
      }
      return '<label style="display:block">Cultural Background: <select name="cultureBg" style="width:100%">' + opts + "</select></label>" + rollRow + table + picks +
        '<label style="display:block;margin-top:8px">Starting Coin: <b>' + culture.silver + "</b> (rolled on Create)</label>" + humanCulture;
    }

    // ---- step 6: Roll for Life Events (p.91-101) ---------------------------
    _step_life() {
      const d = this.draft;
      const section = (key, table, label) => {
        const chosen = d.lifeEvents[key];
        const rows = table.map((e) => ({ range: e.range, name: e.name, hit: chosen && chosen.range === e.range }));
        return '<div style="margin-top:8px;border-top:1px solid #7a6a4f;padding-top:6px"><b>Life Event: ' + label + "</b> " +
          '<button type="button" data-action="roll-life" data-life-key="' + key + '">Roll 1d100</button>' +
          (chosen ? '<div style="font-size:11px;opacity:.85;margin-top:2px">Rolled: <b>' + chosen.name + "</b> (" + chosen.range + ") — look it up and apply its bonus via the Skills tab.</div>" : "") +
          rollTableHtml(rows, "d100") + "</div>";
      };
      const npcRows = d.relationshipNpcs.map((n, i) => "<li>" + n.source + ": " + n.type + (n.name ? " — " + n.name : "") + ' <button type="button" data-action="remove-npc" data-npc-idx="' + i + '">remove</button></li>').join("");
      return '<div style="font-size:12px">Roll once each on Origin, Youth, and Recent. Names only, per the book’s prose bonuses — check the page for the exact skill/amount.</div>' +
        section("origin", LIFE_EVENTS.origin, "Origin") + section("youth", LIFE_EVENTS.youth, "Youth") + section("recent", LIFE_EVENTS.recent, "Recent") +
        '<div style="margin-top:8px;border-top:1px solid #7a6a4f;padding-top:6px"><b>Shared History</b> (p.94, optional, with another PC)<br>' +
        '<label style="display:inline-block;width:49%">With: <input type="text" name="sharedWith" value="' + d.sharedHistoryWith + '" style="width:100%"></label>' +
        '<label style="display:inline-block;width:49%">Skill (+5 to you): <select name="sharedSkill" style="width:100%"><option value="">(none)</option>' +
        SKILL_ALL.map((s) => '<option value="' + s + '"' + (d.sharedHistorySkill === s ? " selected" : "") + '>' + s + "</option>").join("") + "</select></label></div>" +
        '<div style="margin-top:8px;border-top:1px solid #7a6a4f;padding-top:6px"><b>Relationship NPCs</b> (p.91, up to one per Life Event, roll 1d4)<br>' +
        '<button type="button" data-action="roll-npc">Roll 1d4 for a new Relationship NPC</button>' +
        (npcRows ? "<ul>" + npcRows + "</ul>" : "") + "</div>";
    }

    // ---- step 7: Select a Previous Career (p.102) --------------------------
    _step_career() {
      const opts = CAREERS.map((c) => '<option value="' + c.name + '"' + (c.name === this.draft.careerName ? " selected" : "") + '>' + c.name + "</option>").join("");
      const c = this.career();
      const poolsTxt = Object.entries(c.pools || {}).filter(([, v]) => v).map(([k, v]) => k + " " + v).join(", ");
      const summary = '<div style="font-size:12px;margin-top:6px;opacity:.85">Pools: ' + poolsTxt +
        (c.silver ? "<br>Silver: " + c.silver : "") + (c.talents ? "<br>Talents: " + c.talents : "") + "</div>";
      const rollRow = '<div style="margin-top:8px"><button type="button" data-action="roll-career">Roll 1d10 for Career</button>' +
        (this.draft.careerRollNote ? '<div style="font-size:11px;opacity:.8;margin-top:4px">' + this.draft.careerRollNote + "</div>" : "") + "</div>";
      const table = rollTableHtml(CAREERS.map((cc) => ({ range: String(cc.d10), name: cc.name, hit: cc.name === this.draft.careerName })), "d10");
      return '<label style="display:block">Previous Career: <select name="career" style="width:100%">' + opts + "</select></label>" + summary + rollRow + table;
    }

    // ---- step 7 continued: Career Skill Points ----------------------------
    _step_skillPoints() {
      this.ensureAlloc();
      const career = this.career();
      const cats = poolCats(career);
      if (!cats.length) return '<div style="font-size:12px;opacity:.8">' + career.name + " has no free skill-point pools to spend (a Magic pool, if any, is assigned by hand to Bind skills afterward).</div>";
      let html = '<div style="font-size:12px;margin-bottom:6px">Edit any field. Each skill caps at ' + CHARGEN_SKILL_CAP + " during creation. Skill points cannot be transferred between categories (p.102).</div>";
      for (const [cat, pool] of cats) {
        const names = SKILLS[cat];
        let spent = 0;
        names.forEach((n, idx) => { spent += TBE.num(this.draft.alloc[cat + "_" + idx], 0); });
        html += '<div style="font-weight:bold;margin-top:6px">' + cat + " &mdash; " + spent + " / " + pool + " spent</div>";
        names.forEach((n, idx) => {
          html += '<label style="display:inline-block;width:49%">' + n + ': <input type="number" class="tbe-alloc" data-cat="' + cat + '" data-idx="' + idx +
            '" value="' + TBE.num(this.draft.alloc[cat + "_" + idx], 0) + '" style="width:50px"></label>';
        });
      }
      return html;
    }

    // ---- step 8: Rounding Out (p.108) --------------------------------------
    _step_rounding() {
      this.ensureRoAlloc();
      const d = this.draft;
      const age = ROUNDING_OUT_AGES.find((a) => a.key === d.roAge) || ROUNDING_OUT_AGES[1];
      const bonusRadio = ["talent", "status", "money"].map((v) =>
        '<label style="display:block"><input type="radio" name="roBonus" value="' + v + '"' + (d.roBonusChoice === v ? " checked" : "") + "> " +
        (v === "talent" ? "Take any one Talent you meet the requirements for (pick it later via TBE: Talents)" : v === "status" ? "+1 Status" : "+100 sp") + "</label>").join("");
      const ageRadio = ROUNDING_OUT_AGES.map((a) =>
        '<label style="display:block"><input type="radio" name="roAge" value="' + a.key + '"' + (d.roAge === a.key ? " checked" : "") + "> <b>" + a.key + "</b>: " +
        [a.endurance ? (a.endurance > 0 ? "+" : "") + a.endurance + " Endurance" : "", a.dt ? (a.dt > 0 ? "+" : "") + a.dt + " Death Threshold" : "",
          a.lorePoints ? a.lorePoints + " bonus points (Lore only)" : "", a.anyPoints + " bonus points (any category)", a.expertise ? "+1 Expertise (any applicable skill)" : ""]
          .filter(Boolean).join(", ") + "</label>").join("");
      const allocGrid = (pool, obj, filterCat) => {
        let spent = 0;
        for (const v of Object.values(obj)) spent += TBE.num(v, 0);
        let h = '<div style="font-size:12px;margin:4px 0">' + spent + " / " + pool + " spent" + (filterCat ? " (Lore only)" : "") + "</div>";
        const cats = filterCat ? [filterCat] : Object.keys(SKILLS);
        for (const cat of cats) {
          h += '<div style="font-size:11px;opacity:.8;margin-top:2px">' + cat + "</div>";
          for (const n of SKILLS[cat]) {
            h += '<label style="display:inline-block;width:49%">' + n + ': <input type="number" class="' + (filterCat ? "tbe-ro-lore" : "tbe-ro-any") + '" data-sk="' + n + '" value="' + TBE.num(obj[n], 0) + '" style="width:50px"></label>';
          }
        }
        return h;
      };
      const savvyOpts = (i) => '<option value="">(none)</option>' + SKILL_ALL.map((s) => '<option value="' + s + '"' + (d.roSavvy[i] === s ? " selected" : "") + '>' + s + "</option>").join("");
      return '<div style="font-size:12px;margin-bottom:4px"><b>1. Bonus</b></div>' + bonusRadio +
        '<div style="font-size:12px;margin:8px 0 4px"><b>2. Age</b></div>' + ageRadio +
        (age.expertise ? '<label style="display:block;margin-top:4px">Old’s bonus Expertise skill: <select name="roOldEx" style="width:100%"><option value="">(none)</option>' +
          SKILL_ALL.map((s) => '<option value="' + s + '"' + (d.roOldExpertiseSkill === s ? " selected" : "") + '>' + s + "</option>").join("") + "</select></label>" : "") +
        (age.lorePoints ? '<div style="margin-top:8px;border-top:1px solid #7a6a4f;padding-top:4px">' + allocGrid(age.lorePoints, d.roLoreAlloc, "Lore") + "</div>" : "") +
        '<div style="margin-top:8px;border-top:1px solid #7a6a4f;padding-top:4px">' + allocGrid(age.anyPoints, d.roAlloc, null) + "</div>" +
        '<div style="font-size:12px;margin:8px 0 4px;border-top:1px solid #7a6a4f;padding-top:6px"><b>3. Bonus Savvy Skills</b> (pick 3, not Piety or a Strand)</div>' +
        [0, 1, 2].map((i) => '<label style="display:inline-block;width:32%">Savvy ' + (i + 1) + ': <select data-savvy="' + i + '" style="width:100%">' + savvyOpts(i) + "</select></label>").join("");
    }

    // ---- step 9: Equip Your Character (p.109) ------------------------------
    _step_equip() {
      return '<div style="font-size:12px">' +
        "<div>1. Starting Weapon: a <b>Dagger</b> (added from the compendium on Create).</div>" +
        "<div>2. Starting Armor: roll 1d3+1 pieces on Create (train permitting) &mdash; count reported, buy them on the Gear tab.</div>" +
        "<div>3. Starting Coin: 2d4&times;50 sp rolled on Create, on top of career and culture silver.</div>" +
        "<div>4-5. Weapon/Armor stats and Initiative penalty: fill in as you buy armor (see Ch.9 - Equipment).</div>" +
        "<div>6. Supply Dice: all four (Gear/Ammo/Rations/Medical) set to d12 on Create.</div></div>";
    }

    // ---- Talents preview (auto-granted from Race/Career/Ability Scores) ---
    _step_talents() {
      const race = this.race(), career = this.career();
      const { wanted, careerTalentText } = computeTalents(race, career);
      const d = this.draft;
      (d.abilityTalent || []).forEach((t) => { if (t) wanted.push({ name: t, why: "Ability Score" }); });
      if (d.roBonusChoice === "talent") wanted.push({ name: "(Rounding Out bonus Talent — pick via TBE: Talents)", why: "Rounding Out", skip: true });
      const { talentPayload, notesOut } = resolveTalentPayload(wanted.filter((w) => !w.skip), race, career);
      return '<div style="font-size:12px">Granted automatically:</div>' +
        (talentPayload.length ? "<ul>" + talentPayload.map((t) => "<li>" + t.name + (t.system.ranks > 1 ? " &times;" + t.system.ranks : "") + "</li>").join("") + "</ul>" : '<div style="font-size:12px;opacity:.7">None named outright.</div>') +
        (d.roBonusChoice === "talent" ? '<div style="font-size:11px;opacity:.8">Plus your Rounding Out bonus Talent (pick with TBE: Talents afterward).</div>' : "") +
        '<div style="font-size:11px;opacity:.75">Career Talent text: ' + careerTalentText + "</div>" +
        (notesOut.length ? '<div style="font-size:11px;opacity:.75;margin-top:4px">' + notesOut.join("<br>") + "</div>" : "") +
        '<div style="font-size:11px;opacity:.7;margin-top:6px">Pick any extra/custom Talent slots with <b>TBE: Talents</b> after this wizard finishes.</div>';
    }

    // ---- step 10: Assign Personality Traits (p.109-110) --------------------
    _step_personality() {
      const d = this.draft;
      const boxes = PERSONALITY_TRAITS.map((t) => '<label style="display:inline-block;width:32%;font-size:12px"><input type="checkbox" class="tbe-trait" value="' + t + '"' +
        (d.personalityPicks.indexOf(t) > -1 ? " checked" : "") + "> " + t + "</label>").join("");
      return '<div style="font-size:12px;margin-bottom:6px">Choose two or three (or write your own below).</div>' + boxes +
        '<label style="display:block;margin-top:8px">Custom traits (comma-separated): <input type="text" name="personalityCustom" value="' + d.personalityCustom + '" style="width:100%"></label>';
    }

    // ---- step 11: Create Character Goals -----------------------------------
    _step_goals() {
      const d = this.draft;
      return '<label style="display:block">Individual Goal: <textarea name="goalIndividual" rows="2" style="width:100%">' + d.goalIndividual + "</textarea></label>" +
        '<label style="display:block;margin-top:6px">Shared/Party Goal: <textarea name="goalShared" rows="2" style="width:100%">' + d.goalShared + "</textarea></label>" +
        '<div style="font-size:11px;opacity:.7;margin-top:6px">It’s fine to leave these blank and discover them in play (p.111).</div>';
    }

    // ---- step 12: Status (Optional, p.114) ---------------------------------
    _step_status() {
      const d = this.draft;
      return '<label style="display:block"><input type="checkbox" name="useStatus"' + (d.useStatus ? " checked" : "") + "> This table uses the optional Status rules</label>" +
        '<div style="font-size:11px;opacity:.75;margin-top:6px">Status starts at 0. Several earlier steps offered "+1 Status" instead of a skill bonus — if you took one, add it to Status on the Overview tab by hand after this wizard finishes.</div>';
    }

    // ---- Review & Create ----------------------------------------------------
    _step_review() {
      const { values, spent, raceApplied, abilityApplied, cultureApplied, roApplied, race, career, age } = computeSkillValues(this.draft);
      const { wanted } = computeTalents(race, career);
      const d = this.draft;
      d.abilityTalent.forEach((t) => { if (t) wanted.push({ name: t, why: "Ability Score" }); });
      const { talentPayload } = resolveTalentPayload(wanted, race, career);
      return '<div style="font-size:12px">' +
        "<div><b>" + race.name + "</b> " + career.name + ", " + (d.cultureBgName || "") + ", native " + d.lang + ", " + (d.roAge || "Adult") + "</div>" +
        "<div>Skill points: " + spent.join(", ") + "</div>" +
        (raceApplied.length ? "<div>Race: " + raceApplied.join(", ") + "</div>" : "") +
        (abilityApplied.length ? "<div>Ability Scores: " + abilityApplied.join("; ") + "</div>" : "") +
        (cultureApplied.length ? "<div>Culture: " + cultureApplied.join(", ") + "</div>" : "") +
        (roApplied.length ? "<div>Rounding Out: " + roApplied.join(", ") + "</div>" : "") +
        "<div>Talents to grant: " + (talentPayload.map((t) => t.name).join(", ") || "none") + "</div>" +
        "<div>Life Events: " + ["origin", "youth", "recent"].map((k) => d.lifeEvents[k]?.name).filter(Boolean).join(", ") + "</div>" +
        "</div>" +
        '<label style="display:block;margin-top:8px"><input type="checkbox" name="wipe"' + (d.wipe ? " checked" : "") + "> Remove the actor's existing skills and Talents first</label>" +
        '<label style="display:block"><input type="checkbox" name="seedNotes"' + (d.seedNotes ? " checked" : "") + "> Seed the Notes tab</label>" +
        '<div style="font-size:11px;opacity:.7;margin-top:6px">Nothing is written to the actor until you click Create Character.</div>';
    }

    _html() {
      const key = this.STEP_DEFS[this.step].key;
      const body = this["_step_" + key].call(this);
      return '<form autocomplete="off" style="font-size:13px;padding:4px">' + this._progressHtml() +
        '<div style="margin-bottom:6px">Target: <b>' + this.actor.name + "</b></div>" +
        '<div class="tbe-step-body" style="max-height:420px;overflow-y:auto;padding-right:4px">' + body + "</div>" + this._footerHtml() + "</form>";
    }

    _readCurrentStep(root) {
      const g = (sel) => root.querySelector(sel);
      const key = this.STEP_DEFS[this.step].key;
      const d = this.draft;
      if (key === "concept") {
        d.culture = g('[name="culture"]')?.value ?? d.culture;
        d.lang = g('[name="lang"]')?.value ?? d.lang;
        d.base = TBE.num(g('[name="base"]')?.value, d.base);
        d.wises = TBE.num(g('[name="wises"]')?.value, d.wises);
        d.binds = TBE.num(g('[name="binds"]')?.value, d.binds);
        root.querySelectorAll("[data-boost-cat]").forEach((sel) => { d.boost[sel.dataset.boostCat] = sel.value || null; });
      } else if (key === "race") {
        d.raceName = g('[name="race"]')?.value ?? d.raceName;
      } else if (key === "ability") {
        root.querySelectorAll("[data-ability-idx]").forEach((sel) => { d.abilityPicks[Number(sel.dataset.abilityIdx)] = sel.value || null; });
        root.querySelectorAll("[data-ability-ex]").forEach((sel) => { d.abilityExpertise[Number(sel.dataset.abilityEx)] = sel.value || null; });
        root.querySelectorAll("[data-ability-tal]").forEach((sel) => { d.abilityTalent[Number(sel.dataset.abilityTal)] = sel.value || null; });
        root.querySelectorAll("[data-ability-desc]").forEach((sel) => { d.abilityDescriptor[Number(sel.dataset.abilityDesc)] = sel.value || null; });
      } else if (key === "attributes") {
        root.querySelectorAll("[data-attr]").forEach((inp) => { d.attrSpend[inp.dataset.attr] = TBE.num(inp.value, 0); });
        root.querySelectorAll("[data-attr-opt]").forEach((inp) => { d[inp.dataset.attrOpt] = !!inp.checked; });
      } else if (key === "culture") {
        d.cultureBgName = g('[name="cultureBg"]')?.value ?? d.cultureBgName;
        root.querySelectorAll("[data-culture-pick]").forEach((sel) => {
          const pi = sel.dataset.culturePick, slot = Number(sel.dataset.cultureSlot);
          if (!d.cultureBgPicks[pi]) d.cultureBgPicks[pi] = [];
          d.cultureBgPicks[pi][slot] = sel.value || null;
        });
        const hc = g("[data-human-culture]");
        if (hc) { d.humanCultureRange = hc.value || null; const rec = HUMAN_CULTURES.find((h) => h.range === hc.value); if (rec) d.humanCultureLang = rec.language.split(" or ")[0]; }
      } else if (key === "life") {
        d.sharedHistoryWith = g('[name="sharedWith"]')?.value ?? d.sharedHistoryWith;
        d.sharedHistorySkill = g('[name="sharedSkill"]')?.value ?? d.sharedHistorySkill;
      } else if (key === "career") {
        d.careerName = g('[name="career"]')?.value ?? d.careerName;
      } else if (key === "skillPoints") {
        root.querySelectorAll(".tbe-alloc").forEach((inp) => { d.alloc[inp.dataset.cat + "_" + inp.dataset.idx] = TBE.num(inp.value, 0); });
      } else if (key === "rounding") {
        const bonus = root.querySelector('input[name="roBonus"]:checked'); if (bonus) d.roBonusChoice = bonus.value;
        const age = root.querySelector('input[name="roAge"]:checked'); if (age) d.roAge = age.value;
        d.roOldExpertiseSkill = g('[name="roOldEx"]')?.value ?? d.roOldExpertiseSkill;
        root.querySelectorAll(".tbe-ro-any").forEach((inp) => { d.roAlloc[inp.dataset.sk] = TBE.num(inp.value, 0); });
        root.querySelectorAll(".tbe-ro-lore").forEach((inp) => { d.roLoreAlloc[inp.dataset.sk] = TBE.num(inp.value, 0); });
        root.querySelectorAll("[data-savvy]").forEach((sel) => { d.roSavvy[Number(sel.dataset.savvy)] = sel.value || null; });
      } else if (key === "personality") {
        d.personalityPicks = Array.from(root.querySelectorAll(".tbe-trait:checked")).map((el) => el.value);
        d.personalityCustom = g('[name="personalityCustom"]')?.value ?? d.personalityCustom;
      } else if (key === "goals") {
        d.goalIndividual = g('[name="goalIndividual"]')?.value ?? d.goalIndividual;
        d.goalShared = g('[name="goalShared"]')?.value ?? d.goalShared;
      } else if (key === "status") {
        d.useStatus = !!g('[name="useStatus"]')?.checked;
      } else if (key === "review") {
        d.wipe = !!g('[name="wipe"]')?.checked;
        d.seedNotes = !!g('[name="seedNotes"]')?.checked;
      }
    }

    activateListeners(html) {
      super.activateListeners(html);
      const root = (html[0] ?? html);
      root.querySelectorAll("[data-action]").forEach((btn) => {
        btn.addEventListener("click", async (ev) => {
          const action = ev.currentTarget.dataset.action;
          this._readCurrentStep(root);
          const d = this.draft;
          if (action === "back") { this.step = Math.max(0, this.step - 1); this.render(true); }
          else if (action === "next") { this.step = Math.min(this.STEP_DEFS.length - 1, this.step + 1); this.render(true); }
          else if (action === "roll-race") {
            const roll = await new Roll("1d100").evaluate();
            const picked = raceForRoll(roll.total);
            if (picked) { d.raceName = picked.name; d.raceRollNote = "Rolled 1d100: " + TBE.face(roll.total) + " → " + picked.name; await TBE.say(TBE.card("TBE Character Wizard — Race Roll", "<div>" + this.actor.name + ": 1d100 → " + TBE.face(roll.total) + " (" + picked.name + ")</div>"), [roll]); }
            else d.raceRollNote = "Rolled 1d100: " + TBE.face(roll.total) + " — no race matched, pick by hand.";
            this.render(true);
          }
          else if (action === "roll-ability") {
            const r1 = await new Roll("1d6").evaluate(), r2 = await new Roll("1d6").evaluate();
            const idx = (n) => Math.max(0, Math.min(ABILITY_SCORES.length - 1, n - 1));
            d.abilityPicks[0] = ABILITY_SCORES[idx(r1.total)]?.name || null;
            d.abilityPicks[1] = r2.total === r1.total ? (ABILITY_SCORES[(idx(r2.total) + 1) % ABILITY_SCORES.length]?.name || null) : (ABILITY_SCORES[idx(r2.total)]?.name || null);
            await TBE.say(TBE.card("TBE Character Wizard — Ability Scores", "<div>" + this.actor.name + ": 1d6+1d6 → " + d.abilityPicks.join(", ") + "</div>"), [r1, r2]);
            this.render(true);
          }
          else if (action === "roll-init") { const r = await new Roll("1d6").evaluate(); d.initRoll = 6 + r.total; await TBE.say(TBE.card("TBE Character Wizard — Randomized Initiative", "<div>" + this.actor.name + ": 6+1d6 → " + d.initRoll + "</div>"), [r]); this.render(true); }
          else if (action === "roll-dt") { const r = await new Roll("2d4").evaluate(); d.dtRoll = 15 + r.total; await TBE.say(TBE.card("TBE Character Wizard — Randomized Death Threshold", "<div>" + this.actor.name + ": 15+2d4 → " + d.dtRoll + "</div>"), [r]); this.render(true); }
          else if (action === "roll-culture") {
            const roll = await new Roll("1d10").evaluate();
            const picked = cultureBgForRoll(roll.total);
            if (picked) { d.cultureBgName = picked.name; d.cultureRollNote = "Rolled 1d10: " + roll.total + " → " + picked.name; await TBE.say(TBE.card("TBE Character Wizard — Culture Roll", "<div>" + this.actor.name + ": 1d10 → " + roll.total + " (" + picked.name + ")</div>"), [roll]); }
            else d.cultureRollNote = "Rolled 1d10: " + roll.total + " — no culture matched, pick by hand.";
            this.render(true);
          }
          else if (action === "roll-human-culture") {
            const roll = await new Roll("1d100").evaluate();
            const picked = humanCultureForRoll(roll.total);
            if (picked) { d.humanCultureRange = picked.range; d.humanCultureLang = picked.language.split(" or ")[0]; await TBE.say(TBE.card("TBE Character Wizard — Human Culture Roll", "<div>" + this.actor.name + ": 1d100 → " + TBE.face(roll.total) + " (" + picked.name + ", " + picked.language + ")</div>"), [roll]); }
            this.render(true);
          }
          else if (action === "roll-life") {
            const key = ev.currentTarget.dataset.lifeKey;
            const table = LIFE_EVENTS[key];
            const roll = await new Roll("1d100").evaluate();
            const picked = lifeEventForRoll(table, roll.total);
            if (picked) { d.lifeEvents[key] = picked; await TBE.say(TBE.card("TBE Character Wizard — Life Event: " + key, "<div>" + this.actor.name + ": 1d100 → " + TBE.face(roll.total) + " (" + picked.name + ")</div>"), [roll]); }
            this.render(true);
          }
          else if (action === "roll-npc") {
            const roll = await new Roll("1d4").evaluate();
            const type = RELATIONSHIP_TYPES.find((t) => t.d4 === roll.total)?.name || "Friend";
            d.relationshipNpcs.push({ source: "life event", type, name: "" });
            await TBE.say(TBE.card("TBE Character Wizard — Relationship NPC", "<div>" + this.actor.name + ": 1d4 → " + roll.total + " (" + type + ")</div>"), [roll]);
            this.render(true);
          }
          else if (action === "remove-npc") { d.relationshipNpcs.splice(Number(ev.currentTarget.dataset.npcIdx), 1); this.render(true); }
          else if (action === "roll-career") {
            const roll = await new Roll("1d10").evaluate();
            const picked = careerForRoll(roll.total);
            if (picked) { d.careerName = picked.name; d.careerRollNote = "Rolled 1d10: " + roll.total + " → " + picked.name; await TBE.say(TBE.card("TBE Character Wizard — Career Roll", "<div>" + this.actor.name + ": 1d10 → " + roll.total + " (" + picked.name + ")</div>"), [roll]); }
            else d.careerRollNote = "Rolled 1d10: " + roll.total + " — no career matched, pick by hand.";
            this.render(true);
          }
          else if (action === "create") {
            btn.disabled = true;
            try { await this.commit(); this.close(); }
            catch (err) { console.error("TBE | wizard commit failed", err); ui.notifications?.error("TBE: character creation failed, see console (F12)."); btn.disabled = false; }
          }
        });
      });
    }

    /* One atomic commit at the end. */
    async commit() {
      const d = this.draft;
      const native = (d.humanCultureLang || d.lang || "Westronne").trim();
      const rolls = [];
      let notesOut = [];
      let removed = 0;

      if (d.wipe) {
        const ids = this.actor.items.filter((i) => i.type === "skill" || i.type === "talent" || i.type === "weapon").map((i) => i.id);
        if (ids.length) { await this.actor.deleteEmbeddedDocuments("Item", ids); removed = ids.length; }
      }

      const { values, spent, raceApplied, abilityApplied, cultureApplied, roApplied, notesOut: calcNotes, race, career, age } = computeSkillValues(d);
      notesOut = notesOut.concat(calcNotes);

      const mk = (group, name, value, fighting, extra) => ({ name, type: "skill", system: Object.assign({ group, value: Math.max(0, TBE.num(value, 0)), fighting: !!fighting }, extra || {}) });
      const payload = Object.entries(values).map(([name, v]) => mk(v.group, name, v.value, v.fighting, { expertise: v.expertise || 0, savvy: !!v.savvy }));
      for (const l of race.languages || []) {
        const nm = /cultural|their cultural/i.test(l.name) ? native : l.name;
        payload.push(mk("Language", nm, l.value));
      }
      const culture = this.culture();
      if (culture && culture.extraLanguage) payload.push(mk("Language", "Cultural extra Language", culture.extraLanguage));
      if (this.race().name === "Human" && d.humanCultureRange === "59-64") {
        payload.push(mk("Language", "Low Vestrian (Old Vestrian)", 70));
        payload.push(mk("Language", "High Vestrian", 20));
        notesOut.push("Old Vestrian: Low Vestrian 70 / High Vestrian 20 were added instead of a single cultural language.");
      }
      for (const sk of race.startingSkills || []) payload.push(mk("Lore", sk.name, sk.value));
      const wises = Math.max(0, TBE.num(d.wises, 4));
      for (let i = 0; i < wises; i++) payload.push(mk("Wise", "Wise: subject " + (i + 1), TBE.num(d.base, 20)));
      const binds = Math.max(0, TBE.num(d.binds, 2));
      for (let i = 0; i < binds; i++) payload.push(mk("Bind", "Bind: name it " + (i + 1), 0));
      payload.push(mk("Bind", "Strand, name it", 0));
      payload.push(mk("Lore", "Piety", career.name === "Godbound" ? 20 : 0));
      for (const [count, value] of (career.customs || [])) {
        for (let i = 0; i < count; i++) payload.push(mk("Wise", "Career wise/Language " + (i + 1), value));
      }

      let made = 0;
      try { made = (await this.actor.createEmbeddedDocuments("Item", payload)).length; }
      catch (err) { console.error("TBE | skill creation failed", err); ui.notifications?.error("TBE: could not create skill items, see console (F12)."); }

      // Shared History (+5 to a named skill on THIS actor; the other PC's
      // half of it is out of scope for a single-actor wizard).
      if (d.sharedHistorySkill) {
        const item = this.actor.items.find((i) => i.type === "skill" && i.name === d.sharedHistorySkill);
        if (item) { try { await item.update({ "system.value": Math.min(CHARGEN_SKILL_CAP, item.system.value + 5) }); } catch (err) { console.warn("TBE | shared history update failed", err); } }
        notesOut.push("Shared History with " + (d.sharedHistoryWith || "another PC") + ": +5 " + d.sharedHistorySkill + ".");
      }

      const { wanted } = computeTalents(race, career);
      (d.abilityTalent || []).forEach((t) => { if (t) wanted.push({ name: t, why: "Ability Score" }); });
      const { talentPayload, notesOut: talentNotes } = resolveTalentPayload(wanted, race, career);
      notesOut = notesOut.concat(talentNotes);
      if (talentPayload.length) {
        try { await this.actor.createEmbeddedDocuments("Item", talentPayload); }
        catch (err) { console.error("TBE | talent creation failed", err); }
      }

      // Equip Your Character: Dagger from the compendium, armor-piece count
      // and starting coin rolled and reported (actual shopping stays manual).
      try {
        const pack = game.packs.get("the-broken-empires.tbe-equipment");
        const daggerDoc = pack ? (await pack.getDocuments({ name: "Dagger" }))[0] : null;
        if (daggerDoc) await this.actor.createEmbeddedDocuments("Item", [daggerDoc.toObject()]);
        else notesOut.push("Starting Dagger: compendium not found, add one by hand.");
      } catch (err) { console.warn("TBE | dagger add failed", err); }
      const armorRoll = await new Roll("1d3+1").evaluate();
      rolls.push(armorRoll);
      const equipCoinRoll = await new Roll("2d4*50").evaluate();
      rolls.push(equipCoinRoll);

      const s = d.attrSpend;
      const resolveMax = 10 + 2 * TBE.num(s.resolve, 0);
      const initBase = d.randomizedInit ? TBE.num(d.initRoll, 6) : 10;
      const initiative = initBase + TBE.num(s.initiative, 0);
      const toughness = Math.floor(TBE.num(s.toughness, 0) / 2) + (race.toughness || 0);
      const dtBase = d.randomizedDT ? TBE.num(d.dtRoll, 15) : 20;
      const dt = (d.randomizedDT ? dtBase : dtBase + 2 * TBE.num(s.dt, 0)) + (age?.dt || 0);

      const careerSilverRoll = career.silver ? await new Roll(career.silver).evaluate() : null;
      if (careerSilverRoll) rolls.push(careerSilverRoll);
      const cultureSilverRoll = culture?.silver ? await new Roll(culture.silver).evaluate() : null;
      if (cultureSilverRoll) rolls.push(cultureSilverRoll);
      const totalSilver = (careerSilverRoll ? careerSilverRoll.total : 0) + (cultureSilverRoll ? cultureSilverRoll.total : 0) + equipCoinRoll.total +
        (d.roBonusChoice === "money" ? 100 : 0);

      const update = {
        "system.race": race.name, "system.career": career.name, "system.culture": (d.cultureBgName || d.culture || "").trim(),
        "system.size": race.size, "system.toughness": toughness,
        "system.deathThreshold.value": dt, "system.deathThreshold.max": dt,
        "system.resolve.value": resolveMax, "system.resolve.max": resolveMax,
        "system.initiative": initiative,
        "system.lethalityBonus": race.lethalityBonus || 0, "system.fatigue": 0,
        "system.silver": totalSilver,
        "system.status": d.roBonusChoice === "status" ? 1 : 0,
        "system.supply.gear": 12, "system.supply.ammo": 12, "system.supply.rations": 12, "system.supply.medical": 12
      };
      try { await this.actor.update(update); } catch (err) { console.warn("TBE | could not write vitals", err); }

      if (race.toughnessCap !== null && race.toughnessCap !== undefined) notesOut.push(race.name + " can never exceed Toughness " + race.toughnessCap + ".");
      for (const r of race.restrictions || []) notesOut.push(r);
      if (race.savvy && race.savvy.length) notesOut.push("Bonus Savvy skill (race): " + race.savvy.join(race.savvy.length > 2 ? ", or " : " / ") + ".");
      if (race.bonus) notesOut.push(race.bonus);
      for (const [count, value] of (career.customs || [])) notesOut.push("Rename the " + count + " career -wise/Language slot(s), each at " + value + ".");
      notesOut.push("Starting armor: roll of " + armorRoll.total + " piece(s), buy on the Gear tab (training permitting), then set their Initiative penalty by hand.");
      if (["origin", "youth", "recent"].some((k) => d.lifeEvents[k])) {
        notesOut.push("Life Events rolled: " + ["origin", "youth", "recent"].map((k) => d.lifeEvents[k] ? k + " → " + d.lifeEvents[k].name : null).filter(Boolean).join(", ") + " — apply each one's skill bonus by hand from the book.");
      }
      if (d.relationshipNpcs.length) notesOut.push("Relationship NPCs: " + d.relationshipNpcs.map((n) => n.type + (n.name ? " (" + n.name + ")" : "")).join(", ") + ".");
      const personality = d.personalityPicks.concat((d.personalityCustom || "").split(",").map((s) => s.trim()).filter(Boolean));
      if (personality.length) notesOut.push("Personality Traits: " + personality.join(", ") + ".");
      if (d.abilityDescriptor.some(Boolean)) notesOut.push("Ability Score descriptors (usable as Personality Traits): " + d.abilityDescriptor.filter(Boolean).join(", ") + ".");
      if (!d.useStatus) notesOut.push("Status rules are off for this table.");

      if (this.actor.type === "character" && d.seedNotes) {
        const html = "<h3>Concept</h3><p>Race: " + race.name + "<br>Cultural background: " + (d.cultureBgName || "") +
          "<br>Previous career: " + career.name + "<br>Concept: </p>" +
          "<h3>Still to decide</h3><ul>" + notesOut.map((n) => "<li>" + n + "</li>").join("") + "</ul>" +
          "<h3>Goals</h3><ul><li>Individual: " + (d.goalIndividual || "") + "</li><li>Shared: " + (d.goalShared || "") + "</li></ul>" +
          "<h3>Personality traits and descriptors</h3><p>" + personality.join(", ") + "</p><h3>Status and relationships</h3><p></p>";
        try { await this.actor.update({ "system.notes": html }); } catch (err) { console.error("TBE | notes seed failed", err); }
      }

      const body = "<div><b>" + this.actor.name + "</b> &mdash; " + race.name + " " + career.name + "</div>" +
        "<div>" + made + " skills created" + (removed ? ", " + removed + " old items removed" : "") + ".</div>" +
        (spent.length ? "<div>Career skill points (spent/pool): " + spent.join(", ") + ".</div>" : "") +
        (raceApplied.length ? "<div>Racial modifiers: " + raceApplied.join(", ") + ".</div>" : "") +
        (abilityApplied.length ? "<div>Ability Scores: " + abilityApplied.join("; ") + ".</div>" : "") +
        (cultureApplied.length ? "<div>Cultural Background: " + cultureApplied.join(", ") + ".</div>" : "") +
        (roApplied.length ? "<div>Rounding Out: " + roApplied.join(", ") + ".</div>" : "") +
        "<div>Toughness <b>" + toughness + "</b>, Death Threshold <b>" + dt + "</b>, Resolve <b>" + resolveMax + "</b>, Initiative <b>" + (initiative >= 0 ? "+" : "") + initiative + "</b>.</div>" +
        (talentPayload.length ? "<div>Talents granted: " + talentPayload.map((t) => t.name + (t.system.ranks > 1 ? " &times;" + t.system.ranks : "")).join(", ") + ".</div>" : "") +
        "<div>Total starting silver: <b>" + totalSilver + " sp</b>.</div>" +
        '<div style="border-top:1px solid #7a6a4f;margin-top:4px;padding-top:4px;font-size:11px;opacity:.85">' +
        notesOut.length + " thing(s) still need your decision, listed on the Notes tab.</div>";
      await TBE.say(TBE.card("TBE Character Built (Wizard)", body), rolls);
    }
  }

  new TBECharacterWizard(actor).render(true);
}
