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
 * The draft is saved on the USER after every page (v0.49.0), keyed by the
 * actor being built, through TBE.remember (owner: module/helpers/memory.mjs).
 * Closing the window, a crash or a reload no longer loses a half-built
 * character: reopening offers to resume. Nothing touches the actor until
 * Create Character, and a created character's draft is discarded.
 */

const CHARGEN_SKILL_CAP = TBE.CHARGEN_SKILL_CAP;
/* The skill catalogue and its categories live in _lib.js (TBE.SKILL_GROUPS),
 * so this macro, the Wizard, Finish Character and NPC generation cannot drift
 * apart. */
const SKILLS = TBE.SKILL_GROUPS;
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
  /* The rich Life Events tables (range, name, description, and the real
   * mechanical options), extracted and self-verified by
   * parse_life_events.py. Falls back to the old name-only copy in
   * chargen.json if the data block was not concatenated in. */
  const LIFE_EVENTS = (typeof TBE_LIFE_EVENTS !== "undefined" && TBE_LIFE_EVENTS)
    ? TBE_LIFE_EVENTS
    : (TBE_CHARGEN.lifeEvents || { origin: [], youth: [], recent: [] });
  const ROUNDING_OUT_AGES = TBE_CHARGEN.roundingOutAges || [];
  const PERSONALITY_TRAITS = TBE_CHARGEN.personalityTraits || [];
  /* Step-1 concept roller. ORIGINAL content, not from the book (see
   * data/concepts.json's _provenance). Guarded so the macro still runs if
   * the block was not concatenated in. */
  const CONCEPTS = (typeof TBE_CONCEPTS !== "undefined" && TBE_CONCEPTS)
    ? TBE_CONCEPTS : { roles: [], streaks: [], troubles: [] };
  /* Rows the table owner has added in play, kept in the world rather than in
   * the shipped data file (the concept table is original content, not
   * rulebook content, and was asked to be expandable). They are appended to
   * their column and renumbered, so the roll stays a clean 1..N. */
  function customConcepts() {
    try {
      const v = game.settings?.get?.("the-broken-empires", "customConcepts");
      return { roles: v?.roles || [], streaks: v?.streaks || [], troubles: v?.troubles || [] };
    } catch (err) { return { roles: [], streaks: [], troubles: [] }; }
  }
  function conceptColumn(key, base) {
    const extra = customConcepts()[key] || [];
    return base.concat(extra).map((row, i) => Object.assign({}, row, { d10: i + 1 }));
  }
  const CONCEPT_COLS = [
    { key: "role", label: "Role", list: conceptColumn("roles", CONCEPTS.roles || []) },
    { key: "streak", label: "Streak", list: conceptColumn("streaks", CONCEPTS.streaks || []) },
    { key: "trouble", label: "Trouble", list: conceptColumn("troubles", CONCEPTS.troubles || []) }
  ];
  const CONCEPT_SETTING_KEY = { role: "roles", streak: "streaks", trouble: "troubles" };
  /* "{role} {streak}, {trouble}", skipping any column not yet rolled. */
  function conceptSentence(picks) {
    const role = picks.role?.text || "", streak = picks.streak?.text || "", trouble = picks.trouble?.text || "";
    const head = [role, streak].filter(Boolean).join(" ");
    return [head, trouble].filter(Boolean).join(", ");
  }
  /* Merge each column's skill hints into {category: [names]}, in column
   * order, deduped. These are only ever SUGGESTIONS for the four
   * category-30 picks on this same step; nothing is auto-applied. */
  function conceptSkillHints(picks) {
    const out = {};
    for (const col of CONCEPT_COLS) {
      const entry = picks[col.key];
      if (!entry || !entry.skills) continue;
      for (const [cat, v] of Object.entries(entry.skills)) {
        if (!SKILLS[cat]) continue;
        out[cat] = out[cat] || [];
        for (const name of [].concat(v)) {
          if (SKILLS[cat].indexOf(name) > -1 && out[cat].indexOf(name) === -1) out[cat].push(name);
        }
      }
    }
    return out;
  }
  /* Ch.14 Weave Magic, extracted and self-verified by parse_magic.py. Guarded
   * so the wizard still runs if the block was not concatenated in; the Magic
   * step simply never appears in that case rather than half-working. */
  const MAGIC = (typeof TBE_MAGIC !== "undefined" && TBE_MAGIC) ? TBE_MAGIC : null;
  const BINDS = MAGIC ? (MAGIC.binds || []).map((b) => b.name) : [];
  const BIND_DESC = {};
  if (MAGIC) for (const b of (MAGIC.binds || [])) BIND_DESC[b.name] = b.desc;
  const STRANDS = MAGIC ? (MAGIC.strands || []).map((x) => x.name) : [];
  const STRAND_DESC = {};
  if (MAGIC) for (const x of (MAGIC.strands || [])) STRAND_DESC[x.name] = x.desc;
  const CONVOCATIONS = MAGIC ? (MAGIC.convocations || []) : [];
  const MRULES = (MAGIC && MAGIC.rules) || {};
  /* p.104: "Select 2 Binds, 4 Strands, and 2 Thin Strands... Add +10 to each
   * of your two chosen Bind skills... Spend the 100 Magic skill points among
   * any of the five Binds. No Bind may be developed past 70... Add 10 levels
   * of Strands among any of your chosen 4 Strands. Add three additional
   * levels of Strands to any Strands except Thin Strands." */
  const SW = MRULES.spellweaverChargen || {};
  const CHARGEN_STRAND_CAP = MRULES.chargenStrandCap || 5;
  const FADE_CHARGEN_STRANDS = MRULES.fadeChargenStrands || 5;
  const RO_STRAND_COST = MRULES.roundingOutStrandCost || 5;
  const MAGIC_SKILL_CAP = SW.bindCapAtChargen || 70;

  const esc = (v) => String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
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
  /* Ladder owned by _lib.js; kept as a declaration so it still hoists. */
  function raiseExpertise(cur) { return TBE.raiseExpertise(cur); }

  /* ---- pure helpers, shared between step previews and the final commit so
     the two can never silently disagree with each other. ------------------ */

  function poolCats(career) {
    return Object.entries(career.pools || {}).filter(([cat, pool]) => pool && cat !== "Magic" && (SKILLS[cat] || []).length);
  }
  // Splits `pool` as evenly as possible across `names.length` slots (any
  // remainder goes to the earliest slots, one each). Returns a plain
  // {idx: amount} map for one category -- evenSplit() below just calls this
  // once per category and namespaces the keys; the "Split evenly" button on
  // the Skill Points step calls it directly for a single category.
  function evenSplitNames(pool, names) {
    const each = Math.floor(pool / names.length);
    let rest = pool - each * names.length;
    const out = {};
    names.forEach((n, idx) => {
      out[idx] = each + (rest > 0 ? 1 : 0);
      if (rest > 0) rest--;
    });
    return out;
  }
  function evenSplit(career) {
    const alloc = {};
    for (const [cat, pool] of poolCats(career)) {
      const split = evenSplitNames(pool, SKILLS[cat]);
      SKILLS[cat].forEach((n, idx) => { alloc[cat + "_" + idx] = split[idx]; });
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

    // Step 2: racial modifiers.
    const race = RACES.find((r) => r.name === draft.raceName) || RACES[0];
    const raceApplied = [];
    for (const m of race.skillMods || []) {
      if (!values[m.skill]) { notesOut.push("Racial modifier " + (m.mod > 0 ? "+" : "") + m.mod + " to " + m.skill + ": no such skill on the list, apply by hand."); continue; }
      /* p.80: "During character creation, no skill can be increased beyond
       * 70 for any reason." The career-points loop above clamps, this did
       * not, so an Ogre's +10 Might could push a 70 to 80. Same defect that
       * was fixed in TBE: Build Character; the wizard's own copy was missed
       * until the live value chips made it visible on screen. */
      values[m.skill].value = Math.min(CHARGEN_SKILL_CAP, Math.max(0, values[m.skill].value + m.mod));
      raceApplied.push(m.skill + " " + (m.mod > 0 ? "+" : "") + m.mod);
    }

    // Step 3: Ability Scores (p.85-86) -- +5 to each listed skill, +1 Expertise
    // to one of them. The rule itself lives in _lib.js so NPC and funnel
    // generation apply the identical one.
    const abilityApplied = [];
    (draft.abilityPicks || []).forEach((scoreName, i) => {
      if (!scoreName) return;
      const score = ABILITY_SCORES.find((a) => a.name === scoreName);
      const line = TBE.applyAbilityScore(values, score, (draft.abilityExpertise || [])[i], CHARGEN_SKILL_CAP);
      if (line) abilityApplied.push(line);
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

    // Step 6: Life Events. The chosen option per event, applied for real.
    // Non-skill outcomes (a -wise, a Bind/Strand, Status, Piety) are handled
    // by commit(), which can create Items; only value changes belong here.
    const lifeApplied = [];
    for (const key of ["origin", "youth", "recent"]) {
      const ev = (draft.lifeEvents || {})[key];
      if (!ev || !(ev.options || []).length) continue;
      const opt = ev.options[Math.max(0, Math.min(ev.options.length - 1, TBE.num((draft.lifeChoice || {})[key], 0)))];
      if (!opt) continue;
      let target = null, amount = TBE.num(opt.amount, 10);
      if (opt.kind === "skill") target = opt.name;
      else if (opt.kind === "skill-any") target = (draft.lifeChoiceExtra || {})[key] || (opt.options || [])[0];
      if (target && values[target]) {
        values[target].value = Math.min(CHARGEN_SKILL_CAP, values[target].value + amount);
        lifeApplied.push(key + ": +" + amount + " " + target);
      } else if (target) {
        notesOut.push("Life Event (" + key + "): +" + amount + " to " + target + " -- no such skill on the list, apply by hand.");
      }
    }

    /* Step 7 comes here, after Life Events, in the book's order (p.78). It
       used to run before the racial modifiers, and because an increase is
       capped at 70 when it happens (p.80), a racially penalised skill came
       out lower: an Ogre Warrior's Melee: Light was 30 +50 capped at 70,
       then -20 = 50, where the book gives 30 -20 +50 = 60. The career
       variable is still needed up here for the pools. */
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
    /* Racial bonus Savvy. Where the book names one specific skill (Half-Orc
     * Endurance, Dwarf Locks & Traps) it applies on its own; where it offers
     * a choice (Human, The Replaced, Bolg Fiir) the note below still asks
     * the player. Before this, none of them reached the actor at all, so the
     * Advancement macro's +1-per-improvement never fired for any race. */
    for (const sk of (race.savvy || [])) {
      if (values[sk]) { values[sk].savvy = true; raceApplied.push(sk + " Savvy"); }
    }
    /* The chosen half: a Human or Replaced picks their Savvy, a Bolg Fiir
     * picks from a menu, and Humans also get one extra Expertise level. */
    const savvyPick = (draft.raceSavvyPick || "").trim();
    if (savvyPick && values[savvyPick] && !values[savvyPick].savvy) {
      values[savvyPick].savvy = true;
      raceApplied.push(savvyPick + " Savvy (chosen)");
    }
    const exPick = (draft.raceExpertisePick || "").trim();
    if (exPick && values[exPick]) {
      values[exPick].expertise = raiseExpertise(values[exPick].expertise);
      raceApplied.push(exPick + " +1 Expertise (racial)");
    }

    return { values, spent, raceApplied, lifeApplied, abilityApplied, cultureApplied, roApplied, notesOut, race, career, age };
  }

  /* Which Pattern the character is being built with. This is not cosmetic:
   * it decides whether the Magic step appears at all, what the Bind/Strand
   * ceilings are, and whether Rounding Out points may be spent on magic. */
  /* Ch.5 forbids two races from the Weave outright: an Ogre "may never become
   * any type of Spellweaver or Fade", and The Replaced "can never be
   * Spellweavers or Fades". Read from the verified race restrictions rather
   * than hardcoded by name, so a data fix reaches this automatically. */
  function raceBarsMagic(draft) {
    const race = RACES.find((r) => r.name === draft.raceName);
    return (race?.restrictions || []).some((t) => /never (become any type of |be )?spellweavers? or fades?/i.test(t));
  }
  function patternOf(draft) {
    if (raceBarsMagic(draft)) return "none";
    if (draft.careerName === "Spellweaver") return "spellweaver";
    return draft.takeFade ? "fade" : "none";
  }
  function convocationOf(draft) {
    return CONVOCATIONS.find((c) => c.name === draft.convocation) || null;
  }

  /* Every Bind value and Strand level as the draft currently stands, from
   * every source that can move them: the Spellweaver career's own grants,
   * the 100 Magic pool, the Strand level pools, a Fade's 5 free levels, Life
   * Events, the Bolg Fiir racial +10, and Rounding Out. Shared by the Magic
   * step's live chips, the Review page, and commit(), so preview and result
   * cannot drift apart -- the same reason computeSkillValues exists.
   */
  function computeMagic(draft) {
    const pattern = patternOf(draft);
    const binds = {}, strands = {};
    for (const n of BINDS) binds[n] = 0;
    for (const n of STRANDS) strands[n] = 0;
    const notes = [];
    const sources = [];
    const thin = new Set(pattern === "spellweaver" ? (draft.swThin || []).filter(Boolean) : []);

    const addBind = (name, amount, why) => {
      if (!name || !(name in binds)) { if (name) notes.push("Bind \"" + name + "\" is not one of the five, apply it by hand."); return; }
      binds[name] += TBE.num(amount, 0);
      if (why) sources.push(why);
    };
    const addStrand = (name, levels, why) => {
      if (!name || !(name in strands)) { if (name) notes.push("Strand \"" + name + "\" is not one of the ten, apply it by hand."); return; }
      strands[name] += TBE.num(levels, 0);
      if (why) sources.push(why);
    };

    /* Life Events. The book words these as "If you plan to choose the
     * Spellweaver career, add +2 to Strand: Earth; otherwise, ...", so they
     * only land on a caster; a non-caster who picked one is told to take the
     * other branch instead of silently getting nothing. */
    for (const key of ["origin", "youth", "recent"]) {
      const ev = (draft.lifeEvents || {})[key];
      if (!ev || !(ev.options || []).length) continue;
      const opt = ev.options[Math.max(0, Math.min(ev.options.length - 1, TBE.num((draft.lifeChoice || {})[key], 0)))];
      if (!opt || (opt.kind !== "bind" && opt.kind !== "strand")) continue;
      const nm = opt.name || (draft.lifeChoiceExtra || {})[key] || "";
      if (pattern === "none") {
        notes.push("Life Event (" + key + "): " + opt.label + " is the Spellweaver branch, and this character is not Patterned. Pick the other option on the Life Events step.");
        continue;
      }
      if (!nm) { notes.push("Life Event (" + key + "): " + opt.label + " -- name the " + opt.kind + " on the Life Events step."); continue; }
      if (opt.kind === "bind") addBind(nm, opt.amount, "Life Event " + key + ": " + nm + " +" + TBE.num(opt.amount, 10));
      else addStrand(nm, opt.amount, "Life Event " + key + ": " + nm + " +" + TBE.num(opt.amount, 2));
    }

    /* Bolg Fiir: "+10 to one Bind skill of their choice" -- only meaningful
     * on a caster, which is why the race step says so. */
    const racePick = (draft.raceBindPick || "").trim().replace(/^bind\s*:\s*/i, "");
    if (racePick && pattern !== "none") addBind(racePick, 10, "Racial: " + racePick + " +10");

    if (pattern === "spellweaver") {
      for (const b of (draft.swBinds || [])) if (b) addBind(b, SW.bindBonus || 10, "Convocation Bind: " + b + " +" + (SW.bindBonus || 10));
      for (const [name, pts] of Object.entries(draft.magicAlloc || {})) {
        const add = Math.max(0, TBE.num(pts, 0));
        if (add) addBind(name, add, "Magic pool: " + name + " +" + add);
      }
      for (const [name, lv] of Object.entries(draft.strandAlloc || {})) {
        const add = Math.max(0, TBE.num(lv, 0));
        if (add) addStrand(name, add, "Strand levels: " + name + " +" + add);
      }
      for (const [name, lv] of Object.entries(draft.strandExtra || {})) {
        const add = Math.max(0, TBE.num(lv, 0));
        if (!add) continue;
        if (thin.has(name)) { notes.push("The three extra Strand levels cannot go to a Thin Strand (" + name + "); they were not applied."); continue; }
        addStrand(name, add, "Extra Strand levels: " + name + " +" + add);
      }
    } else if (pattern === "fade") {
      for (const [name, lv] of Object.entries(draft.fadeStrands || {})) {
        const add = Math.max(0, TBE.num(lv, 0));
        if (add) addStrand(name, add, "Faded Pattern: " + name + " +" + add);
      }
    }

    /* Rounding Out (p.108): "Only a Spellweaver or Fade may put bonus skill
     * points into Binds... Allowed Strands may be improved for five bonus
     * skill points per level, to a maximum of level 5." */
    if (pattern !== "none") {
      for (const [name, pts] of Object.entries(draft.roBindAlloc || {})) {
        const add = Math.max(0, TBE.num(pts, 0));
        if (add) addBind(name, add, "Rounding Out: " + name + " +" + add);
      }
      for (const [name, lv] of Object.entries(draft.roStrandAlloc || {})) {
        const add = Math.max(0, TBE.num(lv, 0));
        if (add) addStrand(name, add, "Rounding Out: " + name + " +" + add + " level(s)");
      }
    }

    /* Caps, applied last so every source is counted before the ceiling. */
    const cappedBinds = [], cappedStrands = [];
    for (const n of BINDS) {
      if (binds[n] > MAGIC_SKILL_CAP) { cappedBinds.push(n); binds[n] = MAGIC_SKILL_CAP; }
    }
    for (const n of STRANDS) {
      if (strands[n] > CHARGEN_STRAND_CAP) { cappedStrands.push(n); strands[n] = CHARGEN_STRAND_CAP; }
    }
    if (cappedBinds.length) notes.push("No Bind may be developed past " + MAGIC_SKILL_CAP + " at creation: " + cappedBinds.join(", ") + " were trimmed.");
    if (cappedStrands.length) notes.push("No Strand can be developed past level " + CHARGEN_STRAND_CAP + " at creation: " + cappedStrands.join(", ") + " were trimmed.");

    return { pattern, binds, strands, thin, notes, sources };
  }

  /* How much of each Magic budget has been spent, so every pool on the step
   * can be shown as "12 / 100 spent (88 left)" the way the Career Skill
   * Points step already is. */
  /* Rounding Out's any-category pool is one budget: p.108 lets it buy skills,
   * Bind skills (casters only) and Strand levels (five points per level), so
   * all three have to be counted against the same number or the pool chip
   * lies about what is left. */
  function roAnySpent(draft) {
    const sum = (obj) => Object.values(obj || {}).reduce((n, v) => n + Math.max(0, TBE.num(v, 0)), 0);
    return sum(draft.roAlloc) + sum(draft.roBindAlloc) + RO_STRAND_COST * sum(draft.roStrandAlloc);
  }

  function magicSpend(draft) {
    const sum = (obj) => Object.values(obj || {}).reduce((n, v) => n + Math.max(0, TBE.num(v, 0)), 0);
    return {
      magicPool: sum(draft.magicAlloc),
      strandLevels: sum(draft.strandAlloc),
      strandExtra: sum(draft.strandExtra),
      fadeStrands: sum(draft.fadeStrands),
      roBind: sum(draft.roBindAlloc),
      roStrandLevels: sum(draft.roStrandAlloc)
    };
  }

  /* Career grants two different things (p.85): Talents named outright
   * ("Armor Training III", "Literate") are automatic, but every "one Combat
   * Talent" / "either X or Y" clause is a PLAYER CHOICE. This used to scan
   * the whole Talent catalogue for any name that showed up anywhere in the
   * career's raw text, which silently auto-granted BOTH sides of an
   * either/or -- Godbound got "Literate" for free though the book offers
   * Literate *or* a Lore Talent, same bug doubled up Loremaster (Lecturer +
   * Travel Planner) and Merchant (Barterer + I See Your Mind). career.talentPicks
   * (chargen.py's CAREER_TALENT_PICKS, book-verified) is now the source of
   * truth for both halves: `auto` is exactly what's unconditional, `picks`
   * is the free-choice slots the player fills in via TBE: Finish Character. */
  function computeTalents(race, career) {
    const wanted = [];
    for (const t of race.exclusiveTalents || []) wanted.push({ name: t, why: race.name + " exclusive" });
    const careerTalentText = career.talents || "";
    const tp = career.talentPicks || { auto: [], picks: [] };
    for (const name of tp.auto) wanted.push({ name, why: career.name + " career" });
    return { wanted, careerTalentText, picks: tp.picks || [] };
  }

  /* One free-choice slot into a short, player-facing phrase: "Pick 2 Talents
   * from Combat, Adventuring, or Social" / "Pick 1: On Through the Night or
   * Armor Training I" / Godbound's named+category hybrid via its own note. */
  function talentPickText(p) {
    if (p.note) return "Pick 1: " + p.note;
    if (p.named && p.named.length) return "Pick " + p.count + ": " + p.named.join(" or ");
    if (p.categories && p.categories.length) return "Pick " + p.count + " Talent" + (p.count > 1 ? "s" : "") + " from " + p.categories.join(", ");
    return "Pick " + p.count;
  }
  function resolveTalentPayload(wanted, race, career) {
    const talentPayload = [];
    const notesOut = [];
    const seen = new Set();
    for (const w of wanted) {
      const key = w.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const rec = TBE.talentNamed(TBE_TALENTS, w.name);
      if (!rec) { notesOut.push("Talent '" + w.name + "' (" + w.why + ") is not in the catalogue, add it by hand."); continue; }
      /* Item shape owned by _lib.js. It carries the transfer:true ActiveEffect,
       * and dropping that here once made every Talent the WIZARD granted inert
       * while the same Talent bought later through TBE: Talents worked.
       * Patterned in the Weave was the worst case: its +5 Max Resolve is the
       * denominator of every Fraying number in Ch.14. */
      talentPayload.push(TBE.talentItem(rec, ""));
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
        /* Only a Spellweaver or a Fade has magic to allocate. Showing an
         * empty Magic step to a Warrior would be noise, and skipping it for a
         * Spellweaver was the whole defect, so it is conditional. */
        { key: "magic", label: "Magic", when: (w) => w.isCaster() },
        { key: "rounding", label: "Rounding Out" },
        { key: "talents", label: "Talents" },
        { key: "personality", label: "Personality" },
        { key: "review", label: "Review" }
      ];
      this.draft = {
        concept: "", conceptPicks: {}, base: 20, wises: 0, binds: 2,
        boost: { Combat: null, Adventuring: null, Social: null, Lore: null },
        wipe: true, seedNotes: true,
        raceName: RACES[0]?.name || "", careerName: CAREERS[0]?.name || "",
        allocFor: null, alloc: {},
        abilityPicks: [null, null], abilityExpertise: [null, null], abilityTalent: [null, null], abilityDescriptor: [null, null],
        attrSpend: { resolve: 0, initiative: 0, toughness: 0, dt: 0 }, randomizedInit: false, randomizedDT: false,
        cultureBgName: CULTURES[0]?.name || "", cultureBgFor: null, cultureBgPicks: {},
        humanCultureName: "", humanCultureLang: "",
        lifeEvents: { origin: null, youth: null, recent: null },
        lifeChoice: { origin: null, youth: null, recent: null },   // index into the event's options
        lifeChoiceExtra: { origin: "", youth: "", recent: "" },    // the named skill/Bind/Strand for an open choice
        relationshipNpcs: [],
        roBonusChoice: "talent", roAge: "Adult", roAlloc: {}, roLoreAlloc: {}, roAllocFor: null, roOldExpertiseSkill: "",
        roSavvy: [null, null, null],
        personalityPicks: [], personalityCustom: "",
        roAgeRollNote: "",
        /* Racial grants that are a CHOICE, so they need a picker rather than
         * a prose note. Before v0.14.0 all three were notes-only and nothing
         * reached the actor. */
        raceSavvyPick: "", raceExpertisePick: "", raceBindPick: "",
        /* Ch.14 Weave Magic. Before v0.15.0 chargen handed a Spellweaver a
         * placeholder "Bind: name it 1" at 0 and a single "Strand, name it"
         * skill, which is the worst kind of gap: a whole character type the
         * system could not actually build. These are the real picks. */
        takeFade: false,                 // Faded Pattern, for a non-Spellweaver career
        convocation: "",                 // one of the twelve templates, or blank
        swBinds: [], swStrands: [], swThin: [],
        magicAlloc: {}, strandAlloc: {}, strandExtra: {}, fadeStrands: {},
        bindExpertise: "",               // "Take one level of Expertise in one Bind skill"
        threadAttunement: "", threadName: "",   // the starting d8 Thread Die
        trueName: "",
        roBindAlloc: {}, roStrandAlloc: {}
      };
      /* What an untouched draft looks like, so closing one saves nothing and
       reopening does not ask about a character nobody started. */
      this._pristine = JSON.stringify(this.draft);
    }

    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        id: "tbe-character-wizard", title: "TBE: Character Wizard",
        width: 620, height: 640, resizable: true, classes: ["tbe-wizard"]
      });
    }

    /* The steps actually in play for this draft. Everything that walks the
     * wizard -- the progress bar, Next/Back, _readCurrentStep, the final
     * page test -- goes through here rather than STEP_DEFS, so a conditional
     * step cannot leave the index pointing at a step that is not shown. */
    steps() { return this.STEP_DEFS.filter((s) => !s.when || s.when(this)); }
    isCaster() { return !!MAGIC && patternOf(this.draft) !== "none"; }
    pattern() { return patternOf(this.draft); }

    race() { return RACES.find((r) => r.name === this.draft.raceName) || RACES[0]; }
    career() { return CAREERS.find((c) => c.name === this.draft.careerName) || CAREERS[0]; }
    culture() { return CULTURES.find((c) => c.name === this.draft.cultureBgName) || CULTURES[0]; }

    /* Who rolls on the d100 Human Cultures table for their region and
     * native language. Humans obviously, but also The Replaced: the book
     * (p.68/p.84) says "Replaced get all the Traits of a Human", and
     * their language line reads "The Language of their cultural region at
     * 70, Low Vestrian 20", the same wording Humans get. Before this they
     * were the one race whose language came from the old step-1 free-text
     * box, so removing that box without widening this would have silently
     * defaulted every Replaced character to Westronne. */
    usesHumanCulture() { return ["Human", "The Replaced"].indexOf(this.race().name) > -1; }

    /* Racial grants that need the player to pick something. The book states
     * each as prose inside the race entry, so they are detected from the
     * verified chargen data rather than hardcoded by race name. */
    raceChoices() {
      const r = this.race() || {};
      const savvyList = r.savvy || [];
      // "one bonus Savvy skill of their choice" is prose, not a skill name;
      // a list of real skill names is a menu; a single real name auto-applies.
      const named = savvyList.filter((x) => SKILL_ALL.indexOf(x) > -1);
      const choosesSavvy = savvyList.length > 0 && named.length !== 1;
      let bonus = String(r.bonus || "");
      /* The Replaced "gets all the Traits of a Human" (p.68) rather than
       * repeating them, so inherit Human's bonus text for detection. */
      if (/Traits of a Human/i.test(bonus)) {
        const human = RACES.find((x) => x.name === "Human");
        if (human) bonus += " " + String(human.bonus || "");
      }
      return {
        choosesSavvy,
        savvyOptions: named.length ? named : SKILL_ALL,
        extraExpertise: /additional level of Expertise/i.test(bonus),
        bindBonus: /\+10 to one Bind skill/i.test(bonus),
        extraTalent: /one additional Talent/i.test(bonus)
      };
    }

    /* Every skill's running value as the draft currently stands, so the
     * allocation steps can show it beside each box. Without this the Career
     * Skill Points and Rounding Out steps are done blind: the player is
     * typing "+5" into a field with no idea whether the skill is at 20 or
     * already at 68 and about to hit the creation cap of 70. */
    liveValues() {
      try { return computeSkillValues(this.draft).values || {}; }
      catch (err) { console.warn("TBE | liveValues failed", err); return {}; }
    }
    /* "12 / 80 spent (68 left)", colour-coded. Shared by the two allocation
     * steps so their headers can be refreshed live as points are typed. */
    static poolChip(spent, pool) {
      const status = spent > pool ? '<span style="color:#c0392b;font-weight:normal"> (over by ' + (spent - pool) + ")</span>"
        : spent < pool ? '<span style="opacity:.7;font-weight:normal"> (' + (pool - spent) + " left)</span>"
        : '<span style="color:#2e7d32;font-weight:normal"> (all spent)</span>';
      return spent + " / " + pool + " spent" + status;
    }

    /* "45" or, when the cap is in play, "70 (cap)". */
    static valueChip(v) {
      if (!v) return "";
      const at = TBE.num(v.value, 0);
      const ex = TBE.num(v.expertise, 0);
      const capped = at >= CHARGEN_SKILL_CAP;
      return '<span class="tbe-cur" style="font-size:10px;opacity:' + (capped ? "1" : ".7") +
        (capped ? ";color:#c0392b;font-weight:bold" : "") + '">' + at +
        (ex >= 2 ? " Ex" + ex : "") + (capped ? " cap" : "") + "</span>";
    }

    /* Copy a Convocation template into the actual picks. The template is
     * "a typical combination", not a cage, so this fills the boxes and
     * leaves them editable rather than locking them. */
    applyConvocation(c) {
      const d = this.draft;
      d.convocation = c.name;
      d.swBinds = c.binds.slice(0, SW.binds || 2);
      d.swStrands = c.strands.slice(0, SW.strands || 4);
      d.swThin = c.thinStrands.slice(0, SW.thinStrands || 2);
      /* Levels already parked on a Strand that is no longer chosen would
       * silently keep counting against the pool, so clear them. */
      for (const n of Object.keys(d.strandAlloc || {})) if (d.swStrands.indexOf(n) === -1) delete d.strandAlloc[n];
      for (const n of Object.keys(d.strandExtra || {})) if (d.swThin.indexOf(n) > -1) delete d.strandExtra[n];
    }

    ensureAlloc() {
      const career = this.career();
      if (this.draft.allocFor === career.name) return;
      // Start every field at 0, not a pre-filled even split: a nonzero
      // default that isn't visually distinct from a hand-typed value reads
      // as "already filled out with random numbers" and invites silently
      // going over the pool the moment you edit only some of the fields
      // (the untouched ones keep contributing their default). "Split
      // evenly" below is one click away for anyone who wants that start.
      this.draft.alloc = {};
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

    /* ------------------------------------------------------------------ *
     *  What has this character been GRANTED that still needs a decision?
     *
     *  ONE owner of that question, borrowed from the standalone Tapestry
     *  tool, whose `computePendingChoices()` does the same job and does it
     *  well. Everything here DEFERS to the detector that already owns each
     *  grant -- `raceChoices()` for racial grants, `isCaster()` for whether
     *  magic applies, `usesHumanCulture()` for the d100 homeland table --
     *  rather than re-deriving them from race names, which is the duplicate
     *  ownership this project keeps paying for.
     *
     *  WHY IT EARNS ITS PLACE. This wizard grants things across fifteen
     *  steps and, until now, said nothing when a grant went unclaimed. That
     *  is the exact failure class `phase5_check.mjs` exists for: the tool
     *  does everything it says, every test passes, and the player ends up
     *  with a character quietly missing a Talent the book gave them. Worse
     *  for the sub-selects on the Ability Score step, which carry no blank
     *  option: they LOOK filled in and stay null until the step is actually
     *  visited, so an unvisited step reads as a complete one.
     *
     *  WHAT IT MUST NOT DO (rule 6): nag about something that is fine. An
     *  entry here has to mean a decision the book says is the player's and
     *  that the draft genuinely does not hold yet. When in doubt, leave it
     *  out -- a panel that cries wolf gets ignored, and then it is worth
     *  less than nothing.
     *
     *  Steps are named by KEY, never by index: the Magic step only exists
     *  for a caster, so an index would point at the wrong step for everyone
     *  else. An item whose step is not in `steps()` is dropped.
     * ------------------------------------------------------------------ */
    pendingChoices() {
      const d = this.draft;
      const out = [];
      const keys = this.steps().map((s) => s.key);
      const add = (label, stepKey) => { if (keys.indexOf(stepKey) > -1) out.push({ label, stepKey }); };
      const blank = (v) => v === null || v === undefined || String(v).trim() === "";

      /* Racial grants. raceChoices() owns which ones this race actually has. */
      const rc = this.raceChoices();
      const raceName = this.race()?.name || "your race";
      if (rc.choosesSavvy && blank(d.raceSavvyPick)) add("Choose your " + raceName + " bonus Savvy skill", "race");
      if (rc.extraExpertise && blank(d.raceExpertisePick)) add("Choose the skill for your " + raceName + " Expertise level", "race");
      if (rc.bindBonus && blank(d.raceBindPick)) add("Choose which Bind gets your " + raceName + " +10", "race");

      /* The d100 homeland table sets the native language (p.81-82), and it
         lives on the Race step -- see the v0.8.1 step-fidelity fix. */
      if (this.usesHumanCulture() && blank(d.humanCultureName)) {
        add("Roll or choose your homeland, which sets your native Language", "race");
      }

      /* Ability Scores (p.85). The score select has a "(none)" option so a
         blank really is unchosen; the three sub-selects do NOT, so a null
         means the step was never visited and the shown value was never
         committed. Both are worth surfacing, for different reasons. */
      for (let i = 0; i < 2; i++) {
        const n = i + 1;
        if (blank(d.abilityPicks[i])) { add("Pick Ability Score " + n, "ability"); continue; }
        const who = d.abilityPicks[i];
        if (blank(d.abilityExpertise[i])) add("Choose the Expertise skill for " + who, "ability");
        if (blank(d.abilityTalent[i])) add("Choose the Talent for " + who, "ability");
        if (blank(d.abilityDescriptor[i])) add("Choose a descriptor for " + who, "ability");
      }

      /* Rounding Out grants three Savvy picks (p.104). */
      const savvyLeft = (d.roSavvy || []).filter(blank).length;
      if (savvyLeft) add("Choose your " + savvyLeft + " remaining bonus Savvy skill" + (savvyLeft > 1 ? "s" : ""), "rounding");

      /* Magic picks exist only for a caster, and the Magic step only exists
         for one too, so `add` drops these for everybody else. */
      if (this.isCaster()) {
        if (blank(d.trueName)) add("Choose your True Name", "magic");
        if (this.pattern() === "spellweaver") {
          if (blank(d.bindExpertise)) add("Choose which Bind takes your Expertise level", "magic");
          if (blank(d.threadAttunement)) add("Choose your starting d8 Thread Die", "magic");
        }
      }

      return out;
    }

    /* The panel itself. Rendered under the step bar, so it is visible from
       every step rather than only on a review page nobody reaches until the
       end -- which would defeat the point. */
    _pendingHtml() {
      const pending = this.pendingChoices();
      if (!pending.length) return "";
      const keys = this.steps().map((s) => s.key);
      return '<div style="border:1px solid #9a4b12;border-left-width:3px;border-radius:4px;' +
        'background:#fdf6ec;padding:6px 8px;margin-bottom:8px;font-size:11px">' +
        '<div style="font-weight:bold;color:#9a4b12;margin-bottom:3px">Still to choose (' + pending.length + ")</div>" +
        pending.map((p) => '<div><a href="#" data-pending-step="' + keys.indexOf(p.stepKey) + '" ' +
          'style="color:#7a2e2e;text-decoration:underline">' + p.label + "</a></div>").join("") +
        '<div style="opacity:.7;margin-top:3px">These are grants the book gives you that the draft does not hold yet. ' +
        "Nothing here blocks Create Character.</div></div>";
    }

    async _renderInner() { return $(this._html()); }

    _progressHtml() {
      return '<div style="display:flex;flex-wrap:wrap;gap:2px;margin-bottom:8px;font-size:9px">' +
        this.steps().map((s, i) => '<div style="flex:1 1 auto;min-width:52px;text-align:center;padding:2px 1px;border-radius:3px;' +
          (i === this.step ? "background:#7a6a4f;color:#fff;font-weight:bold" : i < this.step ? "background:#c9bd9e" : "background:#eee;color:#888") +
          '">' + (i + 1) + ". " + s.label + "</div>").join("") + "</div>";
    }

    _footerHtml() {
      const last = this.step === this.steps().length - 1;
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
      /* The concept roller. Three independent d10 columns so odd pairings
       * happen on purpose ("Godbound with a casanova streak"). Each column
       * rerolls on its own. The merged skill hints are shown against the
       * four category-30 pickers below, because this is the first step and
       * a loose concept is most useful when it tells you which 30s to take. */
      const picks = d.conceptPicks || {};
      const hints = conceptSkillHints(picks);
      const rolled = CONCEPT_COLS.some((c) => picks[c.key]);
      let roller = "";
      if (CONCEPT_COLS.every((c) => c.list.length)) {
        roller = '<div style="border:1px solid #7a6a4f;border-radius:4px;padding:6px;margin-bottom:6px;background:rgba(120,100,60,0.06)">' +
          '<button type="button" data-action="roll-concept" style="font-weight:bold">Roll a concept</button>' +
          CONCEPT_COLS.map((c) => ' <button type="button" data-action="roll-concept-col" data-col="' + c.key +
            '" style="font-size:10px">reroll ' + c.label.toLowerCase() + "</button>").join("") +
          (rolled ? '<div style="margin-top:5px;font-size:13px"><b>' + conceptSentence(picks) + "</b></div>" +
            '<div style="font-size:10px;opacity:.7">' + CONCEPT_COLS.map((c) => c.label + " " + (picks[c.key]?.d10 ?? "-")).join(" &middot; ") + "</div>" : "") +
          (Object.keys(hints).length
            ? '<div style="font-size:11px;margin-top:5px">Skills this concept points at, as candidates for your <b>one</b> pick per category below: ' +
              Object.entries(hints).map(([cat, names]) => "<b>" + cat + "</b> " + names.join(" / ")).join("; ") + "</div>"
            : "") +
          '<div style="font-size:10px;opacity:.6;margin-top:4px">Table-generated flavour, not rulebook content. Suggestions only, nothing is applied until you pick.</div>' +
          this._conceptEditorHtml() +
          "</div>";
      }
      return roller +
        '<label style="display:block">Rough concept (p.79): <input type="text" name="concept" value="' + (d.concept || "") +
        '" placeholder="wandering sellsword haunted by his last command" style="width:100%"></label>' +
        '<div style="font-size:11px;opacity:.75;margin-bottom:4px">A sentence or short phrase, not binding, the book expects it to shift ' +
        "as Race, Cultural Background and Life Events land. (Cultural background and language now live on the steps that determine them.)</div>" +
        '<label style="display:block">Base skill value (book default 20): <input type="number" name="base" value="' + d.base + '" style="width:100%"></label>' +
        '<label style="display:block">Extra blank -wise slots: <input type="number" name="wises" value="' + d.wises + '" min="0" max="12" style="width:100%"></label>' +
        '<div style="font-size:11px;opacity:.75;margin-bottom:4px">Leave at 0. The book grants custom -wises through your Career, Cultural Background, Life Events and Rounding Out, and the Wizard creates those for you to rename. Extra blank slots are nameless skills at 0: they clutter the roll picker and the printed sheet.</div>' +
        (MAGIC
          ? '<div style="font-size:11px;opacity:.75">Magic skills all start at zero. The five Binds (' + BINDS.join(", ") +
            ') are created for you; Strands are not skills and appear only if you are Patterned. ' +
            'Choosing the Spellweaver career, or ticking Faded Pattern on the Career step, adds a Magic step that builds them.</div>'
          : '<label style="display:block">Blank Bind slots: <input type="number" name="binds" value="' + d.binds + '" min="0" max="6" style="width:100%"></label>') +
        boosts;
    }

    /* Add your own rows to the concept table. It is original content rather
     * than rulebook content, so expanding it is a table decision, not a
     * house rule -- and a roller you cannot add to is a roller you stop
     * using after the tenth character. Rows are stored in the world and
     * merged into the columns above, so they roll like the built-in ones. */
    _conceptEditorHtml() {
      const d = this.draft;
      if (!d.conceptEditorOpen) {
        const counts = CONCEPT_COLS.map((c) => c.label + " " + c.list.length).join(" &middot; ");
        return '<div style="margin-top:5px;font-size:10px;opacity:.75">' + counts +
          ' <a data-action="toggle-concept-editor" style="cursor:pointer;text-decoration:underline">add your own</a></div>';
      }
      const colOpts = CONCEPT_COLS.map((c) => '<option value="' + c.key + '"' +
        ((d.conceptNewCol || "role") === c.key ? " selected" : "") + ">" + c.label + "</option>").join("");
      const mine = customConcepts();
      const listed = CONCEPT_COLS.map((c) => {
        const rows = mine[CONCEPT_SETTING_KEY[c.key]] || [];
        if (!rows.length) return "";
        return '<div style="font-size:10px;opacity:.8">' + c.label + ": " +
          rows.map((r, i) => esc(r.text) + ' <a data-action="drop-concept" data-col="' + c.key + '" data-idx="' + i +
            '" style="cursor:pointer;color:#8b1a1a">&times;</a>').join(", ") + "</div>";
      }).join("");
      return '<div style="margin-top:6px;border-top:1px dashed #7a6a4f;padding-top:5px">' +
        '<div style="font-size:11px"><b>Your own rows</b> <a data-action="toggle-concept-editor" style="cursor:pointer;text-decoration:underline">hide</a></div>' +
        listed +
        '<label style="display:inline-block;width:22%;font-size:11px">Column: <select name="conceptNewCol" style="width:100%">' + colOpts + "</select></label> " +
        '<label style="display:inline-block;width:44%;font-size:11px">Text: <input type="text" name="conceptNewText" value="' +
        esc(d.conceptNewText || "") + '" placeholder="fallen inquisitor" style="width:100%"></label> ' +
        '<label style="display:inline-block;width:30%;font-size:11px">Skills it hints at: <input type="text" name="conceptNewSkills" value="' +
        esc(d.conceptNewSkills || "") + '" placeholder="Insight, Intimidate" style="width:100%"></label>' +
        '<div style="margin-top:4px"><button type="button" data-action="add-concept" style="font-size:11px">Add to the table</button>' +
        '<span style="font-size:10px;opacity:.7;margin-left:6px">Skill names must match the sheet exactly, or the hint is dropped.</span></div>' +
        "</div>";
    }

    // ---- step 2: Choose a Race (p.81) --------------------------------------
    _step_race() {
      const d = this.draft;
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
      /* Racial grants that require a pick. These used to be prose in the
       * Notes tab and nothing else, so a Human's bonus Savvy and extra
       * Expertise simply never happened. */
      const ch = this.raceChoices();
      let picks = "";
      if (ch.choosesSavvy || ch.extraExpertise || ch.bindBonus) {
        picks = '<div style="margin-top:8px;border:1px solid #7a6a4f;border-radius:4px;padding:6px;background:rgba(120,100,60,0.06)">' +
          '<div style="font-size:12px;font-weight:bold">' + r.name + " picks</div>";
        if (ch.choosesSavvy) {
          picks += '<label style="display:block;font-size:12px">Bonus Savvy skill: <select name="raceSavvy" style="width:100%">' +
            '<option value="">(choose)</option>' +
            ch.savvyOptions.map((sk) => '<option value="' + sk + '"' + (d.raceSavvyPick === sk ? " selected" : "") + ">" + sk + "</option>").join("") +
            '</select><span style="font-size:10px;opacity:.7">Marks the skill "S": +1 whenever you improve it with XP (Ch.8).</span></label>';
        }
        if (ch.extraExpertise) {
          picks += '<label style="display:block;font-size:12px">Extra Expertise level, any skill: <select name="raceExpertise" style="width:100%">' +
            '<option value="">(choose)</option>' +
            SKILL_ALL.map((sk) => '<option value="' + sk + '"' + (d.raceExpertisePick === sk ? " selected" : "") + ">" + sk + "</option>").join("") +
            "</select></label>";
        }
        if (ch.bindBonus) {
          picks += '<label style="display:block;font-size:12px">+10 to one Bind (with Patterned in the Weave): ' +
            '<input type="text" name="raceBind" value="' + (d.raceBindPick || "") + '" placeholder="Change, Control, Destroy, Witness, Conjure" style="width:100%">' +
            '<span style="font-size:10px;opacity:.7">Leave empty if you are not a Spellweaver: you get +10 to opposed rolls against Weave Magic instead.</span></label>';
        }
        if (ch.extraTalent) {
          picks += '<div style="font-size:11px;opacity:.8;margin-top:4px">Also one additional Talent you meet the requirements for &mdash; pick it in ' +
            "<b>TBE: Finish Character</b> with \"Spend XP\" unticked.</div>";
        }
        picks += "</div>";
      }
      return '<label style="display:block">Race: <select name="race" style="width:100%">' + opts + "</select></label>" + summary + picks + rollRow + table;
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
      /* The race's starting Toughness (an Ogre's 1, p.64) was left off this
         page while commit() added it, so the page showed 0 and the actor got
         1. chargen_parity_check.mjs holds the two together now. */
      const toughness = Math.floor(TBE.num(s.toughness, 0) / 2) + TBE.num(this.race()?.toughness, 0);
      const dtBase = d.randomizedDT ? TBE.num(d.dtRoll, 15) : TBE.num(this.race()?.dt, 20);  /* p.83: an Ogre starts at 22, not the default 20. */
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
          /* An unchosen dropdown used to sit on its first entry, so simply
           * walking through the wizard silently stacked every "choose" pick
           * onto the same skill (Deceive, alphabetically first in Social)
           * and capped it. A pick with real options now starts empty. */
          const fixed = options.length === 1;
          const optsHtml = (fixed ? "" : '<option value=""' + (already[slot] ? "" : " selected") + ">(choose)</option>") +
            options.map((s) => '<option value="' + s + '"' + (already[slot] === s ? " selected" : "") + '>' + s + "</option>").join("");
          const label = (pick.expertise ? "Expertise: " : "+" + pick.amount + ": ") + (fixed ? options[0] : "choose");
          picks += '<label style="display:inline-block;width:49%;font-size:12px">' + label + ': <select data-culture-pick="' + pi + '" data-culture-slot="' + slot + '" style="width:100%">' + optsHtml + "</select></label>";
        }
      });
      let humanCulture = "";
      if (this.usesHumanCulture()) {
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
    /* Rewritten so the wizard APPLIES a Life Event instead of naming it and
     * sending the player to the book. Each rolled event now shows its own
     * description and a dropdown of its real options (parse_life_events.py
     * extracted all 151 events and their 335 mechanical choices). The full
     * d100 table is collapsed behind a toggle: it is 50 rows per event and
     * it was pushing the roll buttons off screen, which is how the same
     * event kept being re-rolled by accident. */
    _step_life() {
      const d = this.draft;
      const openOptionSkills = (opt) => {
        if (!opt) return [];
        if (opt.kind === "skill-any") return opt.options || [];
        return [];
      };
      const section = (key, table, label) => {
        const chosen = d.lifeEvents[key];
        let out = '<div style="margin-top:8px;border-top:1px solid #7a6a4f;padding-top:6px"><b>Life Event: ' + label + "</b> " +
          '<button type="button" data-action="roll-life" data-life-key="' + key + '">Roll 1d100</button>' +
          ' <button type="button" data-action="toggle-life-table" data-life-key="' + key + '" style="font-size:10px">' +
          (d.lifeTableOpen === key ? "hide" : "show") + " the d100 table</button>";
        if (chosen) {
          const opts = chosen.options || [];
          const picked = TBE.num(d.lifeChoice[key], 0);
          out += '<div style="margin-top:3px;font-size:12px"><b>' + chosen.name + "</b> (" + chosen.range + ")</div>";
          if (chosen.desc) {
            out += '<div style="font-size:11px;opacity:.8;line-height:1.3;margin:2px 0">' + chosen.desc + "</div>";
          }
          if (opts.length) {
            out += '<label style="display:block;font-size:12px">Take: <select data-life-opt="' + key + '" style="width:100%">' +
              opts.map((o, i) => '<option value="' + i + '"' + (picked === i ? " selected" : "") + ">" + o.label + "</option>").join("") +
              "</select></label>";
            const cur = opts[picked];
            const open = openOptionSkills(cur);
            if (open.length) {
              out += '<label style="display:block;font-size:12px">Which skill: <select data-life-extra="' + key + '" style="width:100%">' +
                open.map((n) => '<option value="' + n + '"' + (d.lifeChoiceExtra[key] === n ? " selected" : "") + ">" + n + "</option>").join("") +
                "</select></label>";
            } else if (cur && (cur.kind === "bind" || cur.kind === "strand") && !cur.name) {
              out += '<label style="display:block;font-size:12px">Name the ' + cur.kind + ': ' +
                '<input type="text" data-life-extra="' + key + '" value="' + (d.lifeChoiceExtra[key] || "") +
                '" placeholder="' + (cur.kind === "bind" ? "Change, Control, Destroy..." : "Air, Fire, Thought...") + '" style="width:100%"></label>';
            }
          }
        }
        if (d.lifeTableOpen === key) {
          out += rollTableHtml(table.map((e) => ({ range: e.range, name: e.name, hit: chosen && chosen.range === e.range })), "d100");
        }
        return out + "</div>";
      };
      const npcRows = d.relationshipNpcs.map((n, i) =>
        '<div style="margin-top:4px;padding:3px;border:1px solid #c9bd9e;border-radius:3px">' +
        "<b>" + n.type + "</b> <span style='font-size:11px;opacity:.7'>(" + n.source + ")</span> " +
        '<button type="button" data-action="remove-npc" data-npc-idx="' + i + '" style="font-size:10px;float:right">remove</button>' +
        '<input type="text" data-npc-name="' + i + '" value="' + String(n.name || "").replace(/"/g, "&quot;") +
        '" placeholder="name them" style="width:38%">' +
        '<input type="text" data-npc-note="' + i + '" value="' + String(n.note || "").replace(/"/g, "&quot;") +
        '" placeholder="who are they, and what do they want?" style="width:60%"></div>').join("");
      /* Three sub-tabs. This is by far the longest page in the wizard, and
       * with all of it stacked the roll buttons scrolled off the top, which
       * is how the same event got re-rolled by accident. */
      const sub = d.lifeSub || "events";
      const subTabs = [["events", "The three events"], ["npcs", "Relationship NPCs"]];
      const bar = '<div style="display:flex;gap:3px;margin-bottom:6px;font-size:11px">' +
        subTabs.map(([k, lbl]) => '<div data-life-sub="' + k + '" style="flex:1;text-align:center;padding:3px;border-radius:3px;cursor:pointer;' +
          (sub === k ? "background:#7a6a4f;color:#fff;font-weight:bold" : "background:#eee;color:#555") + '">' + lbl + "</div>").join("") + "</div>";
      if (sub === "npcs") {
        return bar +
          '<div style="font-size:12px">p.91: up to one per Life Event. Roll 1d4 for the kind of tie, then name them and jot what they want ' +
          "&mdash; both reach the Notes tab.</div>" +
          '<div style="margin-top:6px"><button type="button" data-action="roll-npc">Roll 1d4 for a new Relationship NPC</button></div>' +
          npcRows +
          '<div style="margin-top:10px;border-top:1px solid #7a6a4f;padding-top:6px;font-size:11px;opacity:.8">Shared History (p.94) now lives in ' +
          "<b>TBE: Finish Character</b>, since it needs the other character to exist.</div>";
      }
      return bar + '<div style="font-size:12px">Roll once each on Origin, Youth, and Recent. Each event\'s own bonus is applied on Create, so pick which option you are taking.</div>' +
        section("origin", LIFE_EVENTS.origin, "Origin") + section("youth", LIFE_EVENTS.youth, "Youth") + section("recent", LIFE_EVENTS.recent, "Recent");
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
      /* Ch.4 Faded Pattern. This is the only way a non-Spellweaver can ever
       * cast, and it has to be decided here because it costs two of the
       * starting Talent selections the career hands out. Ticking it makes
       * the Magic step appear. */
      const barred = raceBarsMagic(this.draft);
      const fadeBox = barred
        ? '<div style="margin-top:8px;border-top:1px solid #7a6a4f;padding-top:6px;color:#8b1a1a;font-size:12px">' +
          "A " + this.race().name + " can never become any kind of Spellweaver or Fade (Ch.5). " +
          (c.name === "Spellweaver"
            ? "Choosing the Spellweaver career would give this character the career's skill points but no magic at all, which is almost certainly not what you want: pick another career, or another race."
            : "Faded Pattern is not available.") + "</div>"
        : c.name === "Spellweaver"
        ? '<div style="font-size:11px;opacity:.8;margin-top:8px;border-top:1px solid #7a6a4f;padding-top:6px">' +
          "A Spellweaver is Patterned in the Weave by career. The next step builds your Binds, Strands and Convocation.</div>"
        : '<div style="margin-top:8px;border-top:1px solid #7a6a4f;padding-top:6px">' +
          '<label style="display:block;font-size:12px"><input type="checkbox" name="takeFade"' + (this.draft.takeFade ? " checked" : "") + "> " +
          "Take the <b>Faded Pattern</b> Talent, becoming a Fade</label>" +
          '<div style="font-size:11px;opacity:.75;margin-left:18px">Costs <b>two</b> of this career\'s Talent selections. ' +
          "Opens Bind and Strand skills, starts you with " + FADE_CHARGEN_STRANDS + " Strand levels, and caps every Bind at 70 and every Strand at 7 for life. " +
          "A critical failure on any casting roll costs you 1 Fraying point.</div></div>";
      return '<label style="display:block">Previous Career: <select name="career" style="width:100%">' + opts + "</select></label>" +
        summary + (MAGIC ? fadeBox : "") + rollRow + table;
    }

    // ---- step 7 continued: Career Skill Points ----------------------------
    _step_skillPoints() {
      this.ensureAlloc();
      const career = this.career();
      const cats = poolCats(career);
      if (!cats.length) return '<div style="font-size:12px;opacity:.8">' + career.name + " has no free skill-point pools to spend (a Magic pool, if any, is assigned by hand to Bind skills afterward).</div>";
      const live = this.liveValues();
      let html = '<div style="font-size:12px;margin-bottom:6px">The grey number after each box is that skill\'s value <i>right now</i>, everything so far included. Every field starts at 0. Each skill caps at ' + CHARGEN_SKILL_CAP + " during creation. Skill points cannot be transferred between categories (p.102).</div>";
      for (const [cat, pool] of cats) {
        const names = SKILLS[cat];
        let spent = 0;
        names.forEach((n, idx) => { spent += TBE.num(this.draft.alloc[cat + "_" + idx], 0); });
        html += '<div style="font-weight:bold;margin-top:6px">' + cat + " &mdash; " +
          '<span data-cur-pool="' + cat + '" data-pool="' + pool + '">' + TBECharacterWizard.poolChip(spent, pool) + "</span>" +
          ' <button type="button" data-action="even-split-cat" data-cat="' + cat + '" style="font-size:10px;font-weight:normal;margin-left:6px">Spread what is left</button></div>';
        names.forEach((n, idx) => {
          html += '<label style="display:inline-block;width:49%">' + n + ': <input type="number" min="0" class="tbe-alloc" data-cat="' + cat + '" data-idx="' + idx +
            '" value="' + TBE.num(this.draft.alloc[cat + "_" + idx], 0) + '" style="width:50px"> ' +
            '<span data-cur-skill="' + n.replace(/"/g, "&quot;") + '">' + TBECharacterWizard.valueChip(live[n]) + "</span></label>";
        });
      }
      return html;
    }

    // ---- Magic (p.104-106, Ch.14) -----------------------------------------
    /* One row per Bind or Strand: a number box, the live running value, and
     * the ceiling it is heading for. The Career Skill Points step had to
     * learn this lesson the hard way -- an allocation box with no visible
     * current value is a box you fill in blind. */
    static magicRow(label, dataAttr, key, value, cur, capped, hint, title) {
      return '<label style="display:inline-block;width:49%;margin-bottom:2px"' +
        (title ? ' title="' + String(title).replace(/"/g, "&quot;").slice(0, 300) + '"' : "") + ">" +
        label + ': <input type="number" min="0" ' + dataAttr + '="' + key + '" value="' + TBE.num(value, 0) +
        '" style="width:48px"> <span data-cur-' + dataAttr.replace("data-", "") + '="' + key + '" style="font-size:10px;' +
        (capped ? "color:#c0392b;font-weight:bold" : "opacity:.7") + '">' + cur + (capped ? " cap" : "") + "</span>" +
        (hint ? ' <span style="font-size:10px;opacity:.6">' + hint + "</span>" : "") + "</label>";
    }

    _step_magic() {
      const d = this.draft;
      const pattern = this.pattern();
      const m = computeMagic(d);
      const spend = magicSpend(d);
      const convo = convocationOf(d);
      let h = "";

      if (pattern === "fade") {
        h += '<div style="font-size:12px;margin-bottom:6px"><b>Faded Pattern.</b> You were not born to the Weave. ' +
          "Every Bind starts at 0 and can never pass 70, every Strand is capped at 7 for life, a critical failure on any " +
          "casting roll costs you 1 Fraying point, and the Talent itself eats <b>two</b> of your starting Talent selections. " +
          "In exchange you start with <b>" + FADE_CHARGEN_STRANDS + " levels of Strands</b> among any Strands you like, and " +
          "Rounding Out points can buy Bind skills.</div>";
      } else {
        h += '<div style="font-size:12px;margin-bottom:6px"><b>Spellweaver.</b> Pick 2 Binds, 4 Strands and 2 Thin Strands, ' +
          "then spend the " + (SW.magicPool || 100) + " Magic points and " + (SW.strandLevels || 10) + " Strand levels below. " +
          "A Thin Strand cannot be developed at all during character creation and costs double to learn later.</div>";

        // --- Convocation: the book's own template, and a roll for it.
        const convoOpts = '<option value="">&mdash; build my own &mdash;</option>' +
          CONVOCATIONS.map((c) => '<option value="' + c.name + '"' + (c.name === d.convocation ? " selected" : "") + ">" + c.name + "</option>").join("");
        h += '<div style="border-top:1px solid #7a6a4f;padding-top:6px;margin-top:6px"><b>1. Convocation</b> ' +
          '<span style="font-size:11px;opacity:.75">(optional template, p.106)</span></div>' +
          '<label style="display:block">Convocation: <select name="convocation" style="width:60%">' + convoOpts + "</select> " +
          '<button type="button" data-action="roll-convocation" style="font-size:11px">Roll 1d12</button></label>' +
          (convo ? '<div style="font-size:11px;opacity:.85;margin-top:2px">Binds <b>' + convo.binds.join(", ") +
            "</b> &middot; Strands <b>" + convo.strands.join(", ") + "</b> &middot; Thin <b>" + convo.thinStrands.join(", ") + "</b>" +
            (d.convocationRollNote ? " &middot; " + d.convocationRollNote : "") + "</div>" : "") +
          (convo ? '<div style="margin-top:2px"><button type="button" data-action="apply-convocation" style="font-size:11px">Fill the picks below from ' + convo.name + "</button></div>" : "");

        // --- The picks themselves.
        const pickRow = (title, arr, count, list, attr, disabledIn) =>
          '<div style="font-size:12px;margin-top:6px"><b>' + title + "</b> " +
          '<span style="font-size:11px;' + (arr.filter(Boolean).length === count ? "color:#2e7d32" : "opacity:.75") + '">' +
          arr.filter(Boolean).length + " / " + count + " chosen</span></div>" +
          list.map((n) => {
            const on = arr.indexOf(n) > -1;
            const clash = !on && disabledIn && disabledIn.indexOf(n) > -1;
            const full = !on && arr.filter(Boolean).length >= count;
            return '<label style="display:inline-block;width:24%;font-size:11px;opacity:' + (clash ? ".4" : "1") + '" title="' +
              String((attr === "sw-bind" ? BIND_DESC[n] : STRAND_DESC[n]) || "").replace(/"/g, "&quot;").slice(0, 300) + '">' +
              '<input type="checkbox" data-' + attr + '="' + n + '"' + (on ? " checked" : "") +
              (clash || full ? " disabled" : "") + "> " + n + "</label>";
          }).join("");

        h += pickRow("2. Your two Binds (+" + (SW.bindBonus || 10) + " each)", d.swBinds, SW.binds || 2, BINDS, "sw-bind", null);
        h += pickRow("3. Your four Strands", d.swStrands, SW.strands || 4, STRANDS, "sw-strand", d.swThin);
        h += pickRow("4. Your two Thin Strands", d.swThin, SW.thinStrands || 2, STRANDS, "sw-thin", d.swStrands);

        // --- 100 Magic points across the five Binds.
        h += '<div style="font-weight:bold;margin-top:8px;border-top:1px solid #7a6a4f;padding-top:6px">5. Magic points &mdash; ' +
          '<span data-cur-magicpool="1" data-pool="' + (SW.magicPool || 100) + '">' +
          TBECharacterWizard.poolChip(spend.magicPool, SW.magicPool || 100) + "</span>" +
          ' <button type="button" data-action="spread-magic" style="font-size:10px;font-weight:normal">Spread what is left over your two Binds</button></div>' +
          '<div style="font-size:11px;opacity:.75">The grey number is that Bind\'s value right now, your +' + (SW.bindBonus || 10) +
          "s and any Life Event included. Nothing may pass " + MAGIC_SKILL_CAP + ".</div>";
        h += BINDS.map((n) => TBECharacterWizard.magicRow(n, "data-magic-bind", n, (d.magicAlloc || {})[n],
          m.binds[n], m.binds[n] >= MAGIC_SKILL_CAP, d.swBinds.indexOf(n) > -1 ? "yours" : "", BIND_DESC[n])).join("");

        // --- 10 Strand levels among the chosen four.
        h += '<div style="font-weight:bold;margin-top:8px">6. Strand levels &mdash; ' +
          '<span data-cur-strandpool="alloc" data-pool="' + (SW.strandLevels || 10) + '">' +
          TBECharacterWizard.poolChip(spend.strandLevels, SW.strandLevels || 10) + "</span>" +
          '<span style="font-weight:normal;font-size:11px;opacity:.75"> among your four chosen Strands</span></div>';
        const chosen = (d.swStrands || []).filter(Boolean);
        h += chosen.length
          ? chosen.map((n) => TBECharacterWizard.magicRow(n, "data-strand-alloc", n, (d.strandAlloc || {})[n],
            m.strands[n], m.strands[n] >= CHARGEN_STRAND_CAP, "", STRAND_DESC[n])).join("")
          : '<div style="font-size:11px;opacity:.7">Choose your four Strands above first.</div>';

        // --- 3 extra levels, anywhere but a Thin Strand.
        h += '<div style="font-weight:bold;margin-top:8px">7. Three extra levels &mdash; ' +
          '<span data-cur-strandpool="extra" data-pool="' + (SW.extraStrandLevels || 3) + '">' +
          TBECharacterWizard.poolChip(spend.strandExtra, SW.extraStrandLevels || 3) + "</span>" +
          '<span style="font-weight:normal;font-size:11px;opacity:.75"> to any Strand except your Thin ones</span></div>';
        h += STRANDS.filter((n) => (d.swThin || []).indexOf(n) === -1).map((n) =>
          TBECharacterWizard.magicRow(n, "data-strand-extra", n, (d.strandExtra || {})[n],
            m.strands[n], m.strands[n] >= CHARGEN_STRAND_CAP, "", STRAND_DESC[n])).join("");

        // --- Expertise and the starting Thread, both real career grants.
        const exOpts = '<option value="">(none yet)</option>' + BINDS.map((n) =>
          '<option value="' + n + '"' + (d.bindExpertise === n ? " selected" : "") + ">" + n + "</option>").join("");
        const thOpts = '<option value="">(choose)</option>' +
          BINDS.map((n) => '<option value="Bind:' + n + '"' + (d.threadAttunement === "Bind:" + n ? " selected" : "") + ">Bind: " + n + "</option>").join("") +
          STRANDS.map((n) => '<option value="Strand:' + n + '"' + (d.threadAttunement === "Strand:" + n ? " selected" : "") + ">Strand: " + n + "</option>").join("");
        h += '<div style="font-weight:bold;margin-top:8px;border-top:1px solid #7a6a4f;padding-top:6px">8. Career grants</div>' +
          '<label style="display:block;font-size:12px">One level of Expertise in a Bind: <select name="bindExpertise" style="width:100%">' + exOpts + "</select>" +
          '<span style="font-size:10px;opacity:.7">Ex2 guarantees at least 2 SLs on a successful Bind roll, which is what sets a spell\'s resistance.</span></label>' +
          '<label style="display:block;font-size:12px">A d8 Thread Die, attuned to: <select name="threadAttunement" style="width:100%">' + thOpts + "</select>" +
          '<span style="font-size:10px;opacity:.7">Rolled after a successful Bind roll and added to Mastery. On a 1 or 2 it still counts, but the die steps down.</span></label>' +
          '<label style="display:block;font-size:12px">What the Thread looks like: <input type="text" name="threadName" value="' +
          String(d.threadName || "").replace(/"/g, "&quot;") + '" placeholder="a wolf\'s tooth, a piece of chalk, an undecaying eye..." style="width:100%"></label>';
      }

      // --- Fade Strand levels.
      if (pattern === "fade") {
        h += '<div style="font-weight:bold;margin-top:8px">Strand levels &mdash; ' +
          '<span data-cur-strandpool="fade" data-pool="' + FADE_CHARGEN_STRANDS + '">' +
          TBECharacterWizard.poolChip(spend.fadeStrands, FADE_CHARGEN_STRANDS) + "</span>" +
          '<span style="font-weight:normal;font-size:11px;opacity:.75"> among any Strands; Fades are not limited by Thin Strands</span></div>';
        h += STRANDS.map((n) => TBECharacterWizard.magicRow(n, "data-fade-strand", n, (d.fadeStrands || {})[n],
          m.strands[n], m.strands[n] >= CHARGEN_STRAND_CAP, "", STRAND_DESC[n])).join("");
      }

      // --- True Name: both Patterns get one, and it is a real fact about the
      //     character (the ultimate Arcane Tether to them), not flavour.
      h += '<label style="display:block;margin-top:8px;font-size:12px;border-top:1px solid #7a6a4f;padding-top:6px">True Name: ' +
        '<input type="text" name="trueName" value="' + String(d.trueName || "").replace(/"/g, "&quot;") +
        '" placeholder="in the language of your people" style="width:100%">' +
        '<span style="font-size:10px;opacity:.7">The Weave imprints one on everyone it Patterns. Anyone who learns it can target you at any distance, so guard it.</span></label>';

      if (m.notes.length) {
        h += '<div style="font-size:11px;color:#8b1a1a;margin-top:6px">' + m.notes.map((n) => "&bull; " + n).join("<br>") + "</div>";
      }
      const totalLevels = STRANDS.reduce((n, x) => n + m.strands[x], 0);
      h += '<div style="font-size:11px;opacity:.85;margin-top:6px;border-top:1px solid #7a6a4f;padding-top:4px">' +
        "Right now: " + BINDS.filter((n) => m.binds[n]).map((n) => n + " " + m.binds[n]).join(", ") +
        (BINDS.some((n) => m.binds[n]) ? "" : "no Bind above 0") + " &middot; " +
        (totalLevels ? STRANDS.filter((n) => m.strands[n]).map((n) => n + " " + m.strands[n]).join(", ") : "no Strands") +
        " (" + totalLevels + " levels)</div>";
      return h;
    }

    // ---- step 8: Rounding Out (p.108) --------------------------------------
    _step_rounding() {
      this.ensureRoAlloc();
      const d = this.draft;
      const live = this.liveValues();
      const age = ROUNDING_OUT_AGES.find((a) => a.key === d.roAge) || ROUNDING_OUT_AGES[1];
      const bonusRadio = ["talent", "status", "money"].map((v) =>
        '<label style="display:block"><input type="radio" name="roBonus" value="' + v + '"' + (d.roBonusChoice === v ? " checked" : "") + "> " +
        (v === "talent" ? "Take any one Talent you meet the requirements for (pick it later via TBE: Talents)" : v === "status" ? "+1 Status" : "+100 sp") + "</label>").join("");
      const ageRoll = '<div style="margin:2px 0"><button type="button" data-action="roll-age" style="font-size:11px">Roll 1d6 for age</button>' +
        (d.roAgeRollNote ? ' <span style="font-size:11px;opacity:.8">' + d.roAgeRollNote + "</span>" : "") + "</div>";
      const ageRadio = ROUNDING_OUT_AGES.map((a) =>
        '<label style="display:block"><input type="radio" name="roAge" value="' + a.key + '"' + (d.roAge === a.key ? " checked" : "") + "> <b>" + a.key + "</b>: " +
        [a.endurance ? (a.endurance > 0 ? "+" : "") + a.endurance + " Endurance" : "", a.dt ? (a.dt > 0 ? "+" : "") + a.dt + " Death Threshold" : "",
          a.lorePoints ? a.lorePoints + " bonus points (Lore only)" : "", a.anyPoints + " bonus points (any category)", a.expertise ? "+1 Expertise (any applicable skill)" : ""]
          .filter(Boolean).join(", ") + "</label>").join("");
      const allocGrid = (pool, obj, filterCat) => {
        /* The Lore-only pool is its own budget; the any-category pool also
         * pays for Bind points and Strand levels, so it counts those too. */
        let spent = filterCat ? 0 : roAnySpent(d);
        if (filterCat) for (const v of Object.values(obj)) spent += TBE.num(v, 0);
        let h = '<div style="font-size:12px;margin:4px 0"><span data-cur-ropool="' + (filterCat || "any") + '" data-pool="' + pool + '">' +
          TBECharacterWizard.poolChip(spent, pool) + "</span>" + (filterCat ? " (Lore only)" : "") + "</div>";
        const cats = filterCat ? [filterCat] : Object.keys(SKILLS);
        for (const cat of cats) {
          h += '<div style="font-size:11px;opacity:.8;margin-top:2px">' + cat + "</div>";
          for (const n of SKILLS[cat]) {
            h += '<label style="display:inline-block;width:49%">' + n + ': <input type="number" class="' + (filterCat ? "tbe-ro-lore" : "tbe-ro-any") + '" data-sk="' + n + '" value="' + TBE.num(obj[n], 0) + '" style="width:50px"> ' +
              '<span data-cur-skill="' + n.replace(/"/g, "&quot;") + '">' + TBECharacterWizard.valueChip(live[n]) + "</span></label>";
          }
        }
        return h;
      };
      const savvyOpts = (i) => '<option value="">(none)</option>' + SKILL_ALL.map((s) => '<option value="' + s + '"' + (d.roSavvy[i] === s ? " selected" : "") + '>' + s + "</option>").join("");
      return '<div style="font-size:12px;margin-bottom:4px"><b>1. Bonus</b></div>' + bonusRadio +
        '<div style="font-size:12px;margin:8px 0 4px"><b>2. Age</b></div>' + ageRoll + ageRadio +
        (age.expertise ? '<label style="display:block;margin-top:4px">Old’s bonus Expertise skill: <select name="roOldEx" style="width:100%"><option value="">(none)</option>' +
          SKILL_ALL.map((s) => '<option value="' + s + '"' + (d.roOldExpertiseSkill === s ? " selected" : "") + '>' + s + "</option>").join("") + "</select></label>" : "") +
        (age.lorePoints ? '<div style="margin-top:8px;border-top:1px solid #7a6a4f;padding-top:4px">' + allocGrid(age.lorePoints, d.roLoreAlloc, "Lore") + "</div>" : "") +
        '<div style="margin-top:8px;border-top:1px solid #7a6a4f;padding-top:4px">' + allocGrid(age.anyPoints, d.roAlloc, null) + "</div>" +
        (this.isCaster() ? this._roMagicHtml() : "") +
                '<div style="font-size:12px;margin:8px 0 4px;border-top:1px solid #7a6a4f;padding-top:6px"><b>3. Bonus Savvy Skills</b> (pick 3, not Piety or a Strand)</div>' +
        [0, 1, 2].map((i) => '<label style="display:inline-block;width:32%">Savvy ' + (i + 1) + ': <select data-savvy="' + i + '" style="width:100%">' + savvyOpts(i) + "</select></label>").join("");
    }


    /* Rounding Out, magic half (p.108): "Only a Spellweaver or Fade may put
     * bonus skill points into Binds. A Spellweaver's starting maximum is 70.
     * ... Allowed Strands may be improved for five bonus skill points per
     * level, to a maximum of level 5 at character creation."
     *
     * This used to be missing entirely, which meant the one place the book
     * lets a Fade buy a Bind at all did not exist in the wizard. */
    _roMagicHtml() {
      const d = this.draft;
      const m = computeMagic(d);
      const rows = (label, attr, list, obj, valueOf, cap, unit) =>
        '<div style="font-size:11px;opacity:.8;margin-top:4px">' + label + "</div>" +
        list.map((n) => TBECharacterWizard.magicRow(n, attr, n, (obj || {})[n], valueOf(n),
          valueOf(n) >= cap, unit, "")).join("");
      const strandCost = RO_STRAND_COST;
      return '<div style="font-size:12px;margin:8px 0 4px;border-top:1px solid #7a6a4f;padding-top:6px">' +
        "<b>Magic</b> (these come out of the same any-category pool above)</div>" +
        rows("Bind skills, 1 point each, nothing past " + MAGIC_SKILL_CAP + ":", "data-ro-bind", BINDS, d.roBindAlloc,
          (n) => m.binds[n], MAGIC_SKILL_CAP, "") +
        rows("Strand levels, " + strandCost + " points each, nothing past level " + CHARGEN_STRAND_CAP + ":",
          "data-ro-strand", STRANDS, d.roStrandAlloc, (n) => m.strands[n], CHARGEN_STRAND_CAP,
          '<span style="opacity:.6">&times;' + strandCost + "</span>");
    }

    // ---- Talents preview (auto-granted from Race/Career/Ability Scores) ---
    _step_talents() {
      const race = this.race(), career = this.career();
      const { wanted, picks } = computeTalents(race, career);
      const d = this.draft;
      (d.abilityTalent || []).forEach((t) => { if (t) wanted.push({ name: t, why: "Ability Score" }); });
      const { talentPayload, notesOut } = resolveTalentPayload(wanted, race, career);
      const freeCount = picks.reduce((n, p) => n + p.count, 0) + (d.roBonusChoice === "talent" ? 1 : 0);
      return '<div style="font-size:12px">Granted automatically:</div>' +
        (talentPayload.length ? "<ul>" + talentPayload.map((t) => "<li>" + t.name + (t.system.ranks > 1 ? " &times;" + t.system.ranks : "") + "</li>").join("") + "</ul>" : '<div style="font-size:12px;opacity:.7">None named outright.</div>') +
        '<div style="font-size:12px;margin-top:8px;border-top:1px solid #7a6a4f;padding-top:6px">' +
        "<b>" + freeCount + " free pick" + (freeCount === 1 ? "" : "s") + "</b> still to make" + (freeCount ? ":" : ".") + "</div>" +
        (picks.length ? "<ul>" + picks.map((p) => "<li>" + talentPickText(p) + "</li>").join("") + "</ul>" : "") +
        (d.roBonusChoice === "talent" ? "<div>+1 Rounding Out bonus Talent (any Talent you qualify for)</div>" : "") +
        (notesOut.length ? '<div style="font-size:11px;opacity:.75;margin-top:4px">' + notesOut.join("<br>") + "</div>" : "") +
        '<div style="font-size:11px;opacity:.7;margin-top:6px">Make these picks in <b>TBE: Finish Character</b> (opens automatically when this wizard finishes) — its Talents tab has real checkboxes and defaults to no XP charge, since these are free.</div>';
    }

    // ---- step 10: Assign Personality Traits (p.109-110) --------------------
    _step_personality() {
      const d = this.draft;
      const boxes = PERSONALITY_TRAITS.map((t) => '<label style="display:inline-block;width:32%;font-size:12px"><input type="checkbox" class="tbe-trait" value="' + t + '"' +
        (d.personalityPicks.indexOf(t) > -1 ? " checked" : "") + "> " + t + "</label>").join("");
      return '<div style="font-size:12px;margin-bottom:6px">Choose two or three (or write your own below).</div>' + boxes +
        '<label style="display:block;margin-top:8px">Custom traits (comma-separated): <input type="text" name="personalityCustom" value="' + d.personalityCustom + '" style="width:100%"></label>';
    }



    // ---- Review & Create ----------------------------------------------------
    _step_review() {
      const { values, spent, raceApplied, abilityApplied, cultureApplied, roApplied, race, career, age } = computeSkillValues(this.draft);
      const { wanted } = computeTalents(race, career);
      const d = this.draft;
      d.abilityTalent.forEach((t) => { if (t) wanted.push({ name: t, why: "Ability Score" }); });
      const { talentPayload } = resolveTalentPayload(wanted, race, career);
      return '<div style="font-size:12px">' +
        "<div><b>" + race.name + "</b> " + career.name + ", " + (d.cultureBgName || "") + ", native " + (d.humanCultureLang || "per race") + ", " + (d.roAge || "Adult") + "</div>" +
        "<div>Skill points: " + spent.join(", ") + "</div>" +
        (raceApplied.length ? "<div>Race: " + raceApplied.join(", ") + "</div>" : "") +
        (abilityApplied.length ? "<div>Ability Scores: " + abilityApplied.join("; ") + "</div>" : "") +
        (cultureApplied.length ? "<div>Culture: " + cultureApplied.join(", ") + "</div>" : "") +
        (roApplied.length ? "<div>Rounding Out: " + roApplied.join(", ") + "</div>" : "") +
        "<div>Talents to grant: " + (talentPayload.map((t) => t.name).join(", ") || "none") + "</div>" +
        "<div>Life Events: " + ["origin", "youth", "recent"].map((k) => d.lifeEvents[k]?.name).filter(Boolean).join(", ") + "</div>" +
        this._magicReviewHtml() +
        "</div>" +
        '<label style="display:block;margin-top:8px"><input type="checkbox" name="wipe"' + (d.wipe ? " checked" : "") + "> Remove the actor's existing skills and Talents first</label>" +
        '<label style="display:block"><input type="checkbox" name="seedNotes"' + (d.seedNotes ? " checked" : "") + "> Seed the Notes tab</label>" +
        '<div style="font-size:11px;opacity:.7;margin-top:6px">Nothing is written to the actor until you click Create Character.</div>';
    }

    /* The Magic summary on the Review page. It is listed here rather than
     * only on the Magic step because Review is the last chance to notice a
     * pool left unspent or a pick left blank, and because a non-caster who
     * chose a Spellweaver-only Life Event branch needs to be told here. */
    _magicReviewHtml() {
      if (!MAGIC) return "";
      const d = this.draft;
      const m = computeMagic(d);
      if (m.pattern === "none") {
        return m.notes.length ? '<div style="color:#8b1a1a;font-size:11px">' + m.notes.join("<br>") + "</div>" : "";
      }
      const spend = magicSpend(d);
      const bindTxt = BINDS.filter((n) => m.binds[n]).map((n) => n + " " + m.binds[n] + (d.bindExpertise === n ? " Ex2" : "")).join(", ") || "none above 0";
      const strandTxt = STRANDS.filter((n) => m.strands[n]).map((n) => n + " " + m.strands[n] + (m.thin.has(n) ? " (thin)" : "")).join(", ") || "none";
      const unspent = [];
      if (m.pattern === "spellweaver") {
        if (spend.magicPool !== (SW.magicPool || 100)) unspent.push("Magic points " + spend.magicPool + "/" + (SW.magicPool || 100));
        if (spend.strandLevels !== (SW.strandLevels || 10)) unspent.push("Strand levels " + spend.strandLevels + "/" + (SW.strandLevels || 10));
        if (spend.strandExtra !== (SW.extraStrandLevels || 3)) unspent.push("extra levels " + spend.strandExtra + "/" + (SW.extraStrandLevels || 3));
        if ((d.swBinds || []).filter(Boolean).length !== (SW.binds || 2)) unspent.push("Binds chosen " + (d.swBinds || []).filter(Boolean).length + "/" + (SW.binds || 2));
        if ((d.swStrands || []).filter(Boolean).length !== (SW.strands || 4)) unspent.push("Strands chosen " + (d.swStrands || []).filter(Boolean).length + "/" + (SW.strands || 4));
        if ((d.swThin || []).filter(Boolean).length !== (SW.thinStrands || 2)) unspent.push("Thin Strands chosen " + (d.swThin || []).filter(Boolean).length + "/" + (SW.thinStrands || 2));
        if (!d.threadAttunement) unspent.push("no Thread Die chosen");
        if (!d.bindExpertise) unspent.push("no Bind Expertise chosen");
      } else if (spend.fadeStrands !== FADE_CHARGEN_STRANDS) {
        unspent.push("Strand levels " + spend.fadeStrands + "/" + FADE_CHARGEN_STRANDS);
      }
      if (!d.trueName) unspent.push("no True Name");
      return '<div style="border-top:1px solid #7a6a4f;margin-top:4px;padding-top:4px">' +
        "<div><b>" + (m.pattern === "fade" ? "Fade" : "Spellweaver") + "</b>" +
        (d.convocation ? ", " + d.convocation : "") + (d.trueName ? ", True Name &ldquo;" + d.trueName + "&rdquo;" : "") + "</div>" +
        "<div>Binds: " + bindTxt + "</div><div>Strands: " + strandTxt + "</div>" +
        (d.threadAttunement ? "<div>Thread: d8 " + d.threadAttunement.replace(":", ": ") + (d.threadName ? " (" + d.threadName + ")" : "") + "</div>" : "") +
        (unspent.length ? '<div style="color:#c0392b">Still open: ' + unspent.join("; ") + "</div>" : "") +
        (m.notes.length ? '<div style="color:#8b1a1a;font-size:11px">' + m.notes.join("<br>") + "</div>" : "") +
        "</div>";
    }

    _html() {
      /* Changing career can add or remove the Magic step underneath us, so
       * clamp before indexing rather than trusting a stale index. */
      const steps = this.steps();
      if (this.step > steps.length - 1) this.step = steps.length - 1;
      const key = steps[this.step].key;
      const body = this["_step_" + key].call(this);
      return '<form autocomplete="off" style="font-size:13px;padding:4px">' + this._progressHtml() +
        this._pendingHtml() +
        '<div style="margin-bottom:6px">Target: <b>' + this.actor.name + "</b></div>" +
        '<div class="tbe-step-body" style="max-height:420px;overflow-y:auto;padding-right:4px">' + body + "</div>" + this._footerHtml() + "</form>";
    }

    _readCurrentStep(root) {
      const g = (sel) => root.querySelector(sel);
      const steps = this.steps();
      const key = (steps[Math.min(this.step, steps.length - 1)] || steps[0]).key;
      const d = this.draft;
      if (key === "concept") {
        d.concept = g('[name="concept"]')?.value ?? d.concept;
        d.base = TBE.num(g('[name="base"]')?.value, d.base);
        d.wises = TBE.num(g('[name="wises"]')?.value, d.wises);
        if (g('[name="binds"]')) d.binds = TBE.num(g('[name="binds"]').value, d.binds);
        root.querySelectorAll("[data-boost-cat]").forEach((sel) => { d.boost[sel.dataset.boostCat] = sel.value || null; });
        d.conceptNewCol = g('[name="conceptNewCol"]')?.value ?? d.conceptNewCol;
        d.conceptNewText = g('[name="conceptNewText"]')?.value ?? d.conceptNewText;
        d.conceptNewSkills = g('[name="conceptNewSkills"]')?.value ?? d.conceptNewSkills;
      } else if (key === "race") {
        d.raceName = g('[name="race"]')?.value ?? d.raceName;
        d.raceSavvyPick = g('[name="raceSavvy"]')?.value ?? d.raceSavvyPick;
        d.raceExpertisePick = g('[name="raceExpertise"]')?.value ?? d.raceExpertisePick;
        d.raceBindPick = g('[name="raceBind"]')?.value ?? d.raceBindPick;
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
          d.cultureBgPicks[pi][slot] = sel.value || null;   // "" -> null, i.e. not yet chosen
        });
        const hc = g("[data-human-culture]");
        if (hc) { d.humanCultureRange = hc.value || null; const rec = HUMAN_CULTURES.find((h) => h.range === hc.value); if (rec) d.humanCultureLang = rec.language.split(" or ")[0]; }
      } else if (key === "life") {
        root.querySelectorAll("[data-life-opt]").forEach((sel) => { d.lifeChoice[sel.dataset.lifeOpt] = TBE.num(sel.value, 0); });
        root.querySelectorAll("[data-life-extra]").forEach((el) => { d.lifeChoiceExtra[el.dataset.lifeExtra] = el.value || ""; });
        root.querySelectorAll("[data-npc-name]").forEach((el) => { const n = d.relationshipNpcs[Number(el.dataset.npcName)]; if (n) n.name = el.value; });
        root.querySelectorAll("[data-npc-note]").forEach((el) => { const n = d.relationshipNpcs[Number(el.dataset.npcNote)]; if (n) n.note = el.value; });
      } else if (key === "career") {
        d.careerName = g('[name="career"]')?.value ?? d.careerName;
        const fade = g('[name="takeFade"]');
        if (fade) d.takeFade = !!fade.checked;
      } else if (key === "skillPoints") {
        root.querySelectorAll(".tbe-alloc").forEach((inp) => { d.alloc[inp.dataset.cat + "_" + inp.dataset.idx] = TBE.num(inp.value, 0); });
      } else if (key === "magic") {
        d.convocation = g('[name="convocation"]')?.value ?? d.convocation;
        d.bindExpertise = g('[name="bindExpertise"]')?.value ?? d.bindExpertise;
        d.threadAttunement = g('[name="threadAttunement"]')?.value ?? d.threadAttunement;
        d.threadName = g('[name="threadName"]')?.value ?? d.threadName;
        d.trueName = g('[name="trueName"]')?.value ?? d.trueName;
        /* Checkbox groups: read the ticked ones and cap the list at what the
         * book allows, so an over-tick can never reach computeMagic. */
        const readPicks = (attr, max) => {
          const on = Array.from(root.querySelectorAll("[data-" + attr + "]"))
            .filter((el) => el.checked).map((el) => el.dataset[attr.replace(/-(\w)/g, (m, c) => c.toUpperCase())]);
          return on.slice(0, max);
        };
        if (root.querySelector("[data-sw-bind]")) d.swBinds = readPicks("sw-bind", SW.binds || 2);
        if (root.querySelector("[data-sw-strand]")) d.swStrands = readPicks("sw-strand", SW.strands || 4);
        if (root.querySelector("[data-sw-thin]")) d.swThin = readPicks("sw-thin", SW.thinStrands || 2);
        root.querySelectorAll("[data-magic-bind]").forEach((inp) => { d.magicAlloc[inp.dataset.magicBind] = TBE.num(inp.value, 0); });
        root.querySelectorAll("[data-strand-alloc]").forEach((inp) => { d.strandAlloc[inp.dataset.strandAlloc] = TBE.num(inp.value, 0); });
        root.querySelectorAll("[data-strand-extra]").forEach((inp) => { d.strandExtra[inp.dataset.strandExtra] = TBE.num(inp.value, 0); });
        root.querySelectorAll("[data-fade-strand]").forEach((inp) => { d.fadeStrands[inp.dataset.fadeStrand] = TBE.num(inp.value, 0); });
      } else if (key === "rounding") {
        const bonus = root.querySelector('input[name="roBonus"]:checked'); if (bonus) d.roBonusChoice = bonus.value;
        const age = root.querySelector('input[name="roAge"]:checked'); if (age) d.roAge = age.value;
        d.roOldExpertiseSkill = g('[name="roOldEx"]')?.value ?? d.roOldExpertiseSkill;
        root.querySelectorAll(".tbe-ro-any").forEach((inp) => { d.roAlloc[inp.dataset.sk] = TBE.num(inp.value, 0); });
        root.querySelectorAll(".tbe-ro-lore").forEach((inp) => { d.roLoreAlloc[inp.dataset.sk] = TBE.num(inp.value, 0); });
        root.querySelectorAll("[data-savvy]").forEach((sel) => { d.roSavvy[Number(sel.dataset.savvy)] = sel.value || null; });
        root.querySelectorAll("[data-ro-bind]").forEach((inp) => { d.roBindAlloc[inp.dataset.roBind] = TBE.num(inp.value, 0); });
        root.querySelectorAll("[data-ro-strand]").forEach((inp) => { d.roStrandAlloc[inp.dataset.roStrand] = TBE.num(inp.value, 0); });
      } else if (key === "personality") {
        d.personalityPicks = Array.from(root.querySelectorAll(".tbe-trait:checked")).map((el) => el.value);
        d.personalityCustom = g('[name="personalityCustom"]')?.value ?? d.personalityCustom;
      } else if (key === "review") {
        d.wipe = !!g('[name="wipe"]')?.checked;
        d.seedNotes = !!g('[name="seedNotes"]')?.checked;
      }
    }

    /* A JSON copy, so a later edit to this.draft cannot reach what was saved,
       and anything that is not plain data is dropped rather than stored. */
    _snapshot() {
      return {
        v: 1, savedAt: Date.now(), actorName: this.actor.name,
        stepKey: (this.steps()[this.step] || {}).key || null,
        draft: JSON.parse(JSON.stringify(this.draft))
      };
    }
    async _saveDraft() {
      if (this._committed) return;
      const untouched = this.step === 0 && JSON.stringify(this.draft) === this._pristine;
      await TBE.remember("wizardDraft", this.actor.id, untouched ? null : this._snapshot());
    }
    /* Put a saved draft back over the defaults, so a field added to the draft
       in a later version still starts from its default. */
    _restore(saved) {
      if (!saved || typeof saved.draft !== "object") return false;
      this.draft = Object.assign(this.draft, saved.draft);
      const i = this.steps().findIndex((st) => st.key === saved.stepKey);
      this.step = i >= 0 ? i : 0;
      return true;
    }
    async close(options) {
      /* Read the page being left, then save, so closing keeps what was typed
         on it. Not after Create Character: that draft is spent. */
      if (!this._committed) {
        try { const el = this.element?.[0] ?? this.element; if (el) this._readCurrentStep(el); } catch (e) { /* page not rendered */ }
        await this._saveDraft();
      }
      return super.close(options);
    }

    activateListeners(html) {
      super.activateListeners(html);
      const root = (html[0] ?? html);
      /* Every render follows a page change or an action, so the draft is
         saved as it stands now. */
      this._saveDraft();

      /* Live-update the value chips as points are typed. A full re-render on
       * every keystroke would steal focus, so only the chips are rewritten
       * in place. This is what makes the two allocation steps possible to do
       * without a calculator: you watch a skill climb toward the 70 cap as
       * you spend, instead of finding out after Create Character. */
      const refreshChips = () => {
        try {
          this._readCurrentStep(root);
          const live = this.liveValues();
          root.querySelectorAll("[data-cur-skill]").forEach((el) => {
            el.innerHTML = TBECharacterWizard.valueChip(live[el.dataset.curSkill]);
          });
          /* Career Skill Points: recount each category's spend. */
          root.querySelectorAll("[data-cur-pool]").forEach((el) => {
            const cat = el.dataset.curPool;
            let spent = 0;
            (SKILLS[cat] || []).forEach((n, idx) => { spent += TBE.num(this.draft.alloc[cat + "_" + idx], 0); });
            el.innerHTML = TBECharacterWizard.poolChip(spent, TBE.num(el.dataset.pool, 0));
          });
          /* Rounding Out: the any-category pool (which also pays for Binds
           * and Strand levels) and the Lore-only pool. */
          root.querySelectorAll("[data-cur-ropool]").forEach((el) => {
            let spent;
            if (el.dataset.curRopool === "any") spent = roAnySpent(this.draft);
            else {
              spent = 0;
              for (const v of Object.values(this.draft.roLoreAlloc || {})) spent += TBE.num(v, 0);
            }
            el.innerHTML = TBECharacterWizard.poolChip(spent, TBE.num(el.dataset.pool, 0));
          });
          /* Magic step: Bind values, Strand levels and their three pools. */
          if (MAGIC) {
            const mg = computeMagic(this.draft);
            const spend = magicSpend(this.draft);
            const paint = (el, cur, cap) => {
              el.innerHTML = cur + (cur >= cap ? " cap" : "");
              el.style.color = cur >= cap ? "#c0392b" : "";
              el.style.fontWeight = cur >= cap ? "bold" : "";
              el.style.opacity = cur >= cap ? "1" : ".7";
            };
            root.querySelectorAll("[data-cur-magic-bind], [data-cur-ro-bind]").forEach((el) => {
              const n = el.dataset.curMagicBind || el.dataset.curRoBind;
              if (n in mg.binds) paint(el, mg.binds[n], MAGIC_SKILL_CAP);
            });
            root.querySelectorAll("[data-cur-strand-alloc], [data-cur-strand-extra], [data-cur-fade-strand], [data-cur-ro-strand]").forEach((el) => {
              const n = el.dataset.curStrandAlloc || el.dataset.curStrandExtra || el.dataset.curFadeStrand || el.dataset.curRoStrand;
              if (n in mg.strands) paint(el, mg.strands[n], CHARGEN_STRAND_CAP);
            });
            root.querySelectorAll("[data-cur-magicpool]").forEach((el) => {
              el.innerHTML = TBECharacterWizard.poolChip(spend.magicPool, TBE.num(el.dataset.pool, 0));
            });
            root.querySelectorAll("[data-cur-strandpool]").forEach((el) => {
              const which = el.dataset.curStrandpool;
              const spent = which === "alloc" ? spend.strandLevels : which === "extra" ? spend.strandExtra : spend.fadeStrands;
              el.innerHTML = TBECharacterWizard.poolChip(spent, TBE.num(el.dataset.pool, 0));
            });
          }
        } catch (err) { console.warn("TBE | chip refresh failed", err); }
      };
      if (root.querySelector("[data-cur-skill], [data-cur-magic-bind], [data-cur-strand-alloc], [data-cur-strand-extra], [data-cur-fade-strand], [data-cur-ro-bind], [data-cur-ro-strand]")) {
        root.querySelectorAll("input[type=number], select").forEach((inp) => {
          inp.addEventListener("input", refreshChips);
          inp.addEventListener("change", refreshChips);
        });
      }

      /* Immediate feedback. Selects and checkboxes change what the rest of
       * the step shows (the Career summary, the Cultural Background pick
       * list, a Life Event's options, the Roll button behind a "randomized"
       * toggle), and all of it used to sit stale until Next was pressed.
       * Text and number fields are deliberately excluded: re-rendering on a
       * keystroke would steal focus, and the value chips above already give
       * those live feedback. */
      root.querySelectorAll("select, input[type=checkbox], input[type=radio]").forEach((el) => {
        el.addEventListener("change", () => {
          try {
            this._readCurrentStep(root);
            this.render(true);
          } catch (err) { console.warn("TBE | live re-render failed", err); }
        });
      });
      root.querySelectorAll("[data-life-sub]").forEach((el) => {
        el.addEventListener("click", () => {
          this._readCurrentStep(root);
          this.draft.lifeSub = el.dataset.lifeSub;
          this.render(true);
        });
      });

      /* A pending-choice link jumps to the step that resolves it. It reads
         the CURRENT step list rather than a stored index, because the Magic
         step appears and disappears with the draft's Pattern and a stale
         index would land on the wrong page. */
      root.querySelectorAll("[data-pending-step]").forEach((a) => {
        a.addEventListener("click", (ev) => {
          ev.preventDefault();
          const i = Number(a.dataset.pendingStep);
          if (Number.isFinite(i) && i >= 0) { this._readCurrentStep(root); this.step = i; this.render(true); }
        });
      });

      root.querySelectorAll("[data-action]").forEach((btn) => {
        btn.addEventListener("click", async (ev) => {
          const action = ev.currentTarget.dataset.action;
          this._readCurrentStep(root);
          const d = this.draft;
          const rollsOut = [];
          if (action === "back") { this.step = Math.max(0, this.step - 1); this.render(true); }
          else if (action === "next") { this.step = Math.min(this.steps().length - 1, this.step + 1); this.render(true); }
          else if (action === "roll-race") {
            const roll = await new Roll("1d100").evaluate();
            const picked = raceForRoll(roll.total);
            if (picked) { d.raceName = picked.name; d.raceRollNote = "Rolled 1d100: " + TBE.face(roll.total) + " → " + picked.name; await TBE.say(TBE.card("TBE Character Wizard — Race Roll", "<div>" + this.actor.name + ": 1d100 → " + TBE.face(roll.total) + " (" + picked.name + ")</div>"), [roll]); }
            else d.raceRollNote = "Rolled 1d100: " + TBE.face(roll.total) + " — no race matched, pick by hand.";
            this.render(true);
          }
          else if (action === "toggle-concept-editor") { d.conceptEditorOpen = !d.conceptEditorOpen; this.render(true); }
          else if (action === "add-concept") {
            const text = (d.conceptNewText || "").trim();
            const col = d.conceptNewCol || "role";
            if (!text) ui.notifications?.warn("TBE: type the row's text first.");
            else {
              /* A skill hint that does not name a real skill would render as
               * a suggestion the player cannot act on, so unknown names are
               * dropped and reported rather than stored. */
              const wanted = (d.conceptNewSkills || "").split(",").map((x) => x.trim()).filter(Boolean);
              const skills = {};
              const unknown = [];
              for (const nm of wanted) {
                const cat = Object.keys(SKILLS).find((c) => SKILLS[c].indexOf(nm) > -1);
                if (!cat) { unknown.push(nm); continue; }
                (skills[cat] = skills[cat] || []).push(nm);
              }
              try {
                const cur = customConcepts();
                const key = CONCEPT_SETTING_KEY[col];
                cur[key] = (cur[key] || []).concat([{ text, skills }]);
                await game.settings.set("the-broken-empires", "customConcepts", cur);
                d.conceptNewText = ""; d.conceptNewSkills = "";
                ui.notifications?.info("TBE: added to the " + col + " column." +
                  (unknown.length ? " Ignored unknown skill(s): " + unknown.join(", ") + "." : ""));
              } catch (err) {
                console.warn("TBE | could not save a concept row", err);
                ui.notifications?.error("TBE: could not save that row (a GM has to add rows to the world table).");
              }
            }
            this.render(true);
          }
          else if (action === "drop-concept") {
            const col = ev.currentTarget.dataset.col;
            const idx = TBE.num(ev.currentTarget.dataset.idx, -1);
            try {
              const cur = customConcepts();
              const key = CONCEPT_SETTING_KEY[col];
              (cur[key] || []).splice(idx, 1);
              await game.settings.set("the-broken-empires", "customConcepts", cur);
            } catch (err) { console.warn("TBE | could not remove a concept row", err); }
            this.render(true);
          }
          else if (action === "roll-concept" || action === "roll-concept-col") {
            /* Recompute the columns, so a row added a moment ago is on the
             * table this roll rather than the next time the macro is run. */
            for (const c of CONCEPT_COLS) c.list = conceptColumn(CONCEPT_SETTING_KEY[c.key], CONCEPTS[CONCEPT_SETTING_KEY[c.key]] || []);
            const cols = action === "roll-concept" ? CONCEPT_COLS
              : CONCEPT_COLS.filter((c) => c.key === ev.currentTarget.dataset.col);
            d.conceptPicks = Object.assign({}, d.conceptPicks);
            const parts = [];
            for (const col of cols) {
              if (!col.list.length) continue;
              /* The column can be longer than 10 once rows have been added,
               * so roll its real size rather than a hardcoded d10. */
              const r = await new Roll("1d" + col.list.length).evaluate();
              rollsOut.push(r);
              const hit = col.list.find((x) => Number(x.d10) === r.total) || col.list[0];
              d.conceptPicks[col.key] = hit;
              parts.push(col.label + " " + r.total + ": " + hit.text);
            }
            /* Overwrite the free-text box only when it is empty or still
             * holds a previously rolled sentence, so a hand-typed concept
             * is never clobbered by a reroll. */
            const prev = conceptSentence(Object.assign({}, d.conceptPicks, cols.reduce((a, c) => (a[c.key] = null, a), {})));
            if (!d.concept || d.concept === prev || d.conceptWasRolled) {
              d.concept = conceptSentence(d.conceptPicks);
              d.conceptWasRolled = true;
            }
            await TBE.say(TBE.card("TBE Character Wizard \u2014 Concept",
              "<div>" + this.actor.name + ": " + parts.join("; ") + "</div>" +
              '<div style="margin-top:3px"><b>' + conceptSentence(d.conceptPicks) + "</b></div>" +
              '<div style="font-size:10px;opacity:.7;margin-top:3px">Table-generated flavour, not rulebook content.</div>'), rollsOut.splice(0));
            this.render(true);
          }
          else if (action === "roll-ability") {
            /* Roller owned by _lib.js, including its reading of a duplicate
             * roll (step to the next score), so every generator agrees. */
            const pair = await TBE.rollAbilityPair(ABILITY_SCORES);
            d.abilityPicks[0] = pair.picks[0] ? pair.picks[0].name : null;
            d.abilityPicks[1] = pair.picks[1] ? pair.picks[1].name : null;
            await TBE.say(TBE.card("TBE Character Wizard — Ability Scores", "<div>" + this.actor.name + ": 1d6+1d6 → " + d.abilityPicks.join(", ") + "</div>"), pair.rolls);
            this.render(true);
          }
          else if (action === "roll-age") {
            /* The book has no age table, it just lists three bands (p.108).
             * This spreads a d6 evenly across them and says so, rather than
             * inventing a weighting the book does not give. */
            const r = await new Roll("1d6").evaluate();
            const band = r.total <= 2 ? "Young" : r.total <= 4 ? "Adult" : "Old";
            const hit = ROUNDING_OUT_AGES.find((a) => a.key === band);
            if (hit) { d.roAge = hit.key; d.roAllocFor = null; }
            d.roAgeRollNote = "1d6 → " + r.total + " (1-2 Young, 3-4 Adult, 5-6 Old): " + band;
            await TBE.say(TBE.card("TBE Character Wizard — Age", "<div>" + this.actor.name + ": " + d.roAgeRollNote +
              '</div><div style="font-size:10px;opacity:.7">Even spread; the book lists the three bands without a table.</div>'), [r]);
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
            if (picked) {
              d.lifeEvents[key] = picked;
              d.lifeChoice[key] = 0;
              const first = (picked.options || [])[0];
              d.lifeChoiceExtra[key] = first && first.kind === "skill-any" ? (first.options || [])[0] || "" : "";
              await TBE.say(TBE.card("TBE Character Wizard — Life Event: " + key,
                "<div>" + this.actor.name + ": 1d100 → " + TBE.face(roll.total) + " (<b>" + picked.name + "</b>)</div>" +
                ((picked.options || []).length ? '<div style="font-size:11px;opacity:.85">Options: ' + picked.options.map((o) => o.label).join(" / ") + "</div>" : "")), [roll]);
            }
            this.render(true);
          }
          else if (action === "roll-npc") {
            const roll = await new Roll("1d4").evaluate();
            const type = RELATIONSHIP_TYPES.find((t) => t.d4 === roll.total)?.name || "Friend";
            d.relationshipNpcs.push({ source: "life event", type, name: "", note: "" });
            await TBE.say(TBE.card("TBE Character Wizard — Relationship NPC", "<div>" + this.actor.name + ": 1d4 → " + roll.total + " (" + type + ")</div>"), [roll]);
            this.render(true);
          }
          else if (action === "toggle-life-table") {
            const key = ev.currentTarget.dataset.lifeKey;
            d.lifeTableOpen = d.lifeTableOpen === key ? null : key;
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
          else if (action === "roll-convocation") {
            const r = await new Roll("1d" + Math.max(1, CONVOCATIONS.length)).evaluate();
            rollsOut.push(r);
            const picked = CONVOCATIONS[Math.min(CONVOCATIONS.length - 1, Math.max(0, r.total - 1))];
            if (picked) {
              d.convocation = picked.name;
              d.convocationRollNote = "rolled 1d" + CONVOCATIONS.length + " -> " + r.total;
              /* Rolling a template and then not filling in the picks it
               * describes would leave the player to copy six names by hand
               * off the line above, so the roll applies it. */
              this.applyConvocation(picked);
              await TBE.say(TBE.card("TBE Character Wizard \u2014 Convocation",
                "<div>" + this.actor.name + ": 1d" + CONVOCATIONS.length + " \u2192 " + r.total + " (<b>" + picked.name + "</b>)</div>" +
                '<div style="font-size:11px;opacity:.85">Binds ' + picked.binds.join(", ") + " &middot; Strands " +
                picked.strands.join(", ") + " &middot; Thin " + picked.thinStrands.join(", ") + "</div>"), rollsOut.splice(0));
            }
            this.render(true);
          }
          else if (action === "apply-convocation") {
            const picked = convocationOf(d);
            if (picked) { this.applyConvocation(picked); ui.notifications?.info("TBE: filled the picks from " + picked.name + "."); }
            this.render(true);
          }
          else if (action === "spread-magic") {
            /* Spend only what is LEFT, and only across the two Binds this
             * character actually chose -- the same rule the Career Skill
             * Points spreader follows: never overwrite a deliberate entry. */
            const pool = SW.magicPool || 100;
            const left = pool - magicSpend(d).magicPool;
            /* Only the chosen Binds still sitting on 0, exactly like the
             * Career Skill Points spreader: a number you typed on purpose is
             * never topped up behind your back. */
            const chosenBinds = (d.swBinds || []).filter(Boolean);
            const targets = chosenBinds.filter((n) => TBE.num(d.magicAlloc[n], 0) === 0);
            if (left <= 0) ui.notifications?.info("TBE: the Magic pool is already fully spent.");
            else if (!chosenBinds.length) ui.notifications?.info("TBE: choose your two Binds first.");
            else if (!targets.length) ui.notifications?.info("TBE: both of your Binds already have points; clear one to spread the remainder.");
            else {
              /* Hand out what is left one point at a time, round-robin over
               * the chosen Binds, stopping at each Bind's own remaining room
               * under the creation cap. Anything the cap refuses is reported
               * rather than silently dropped. */
              const m = computeMagic(d);
              const room = {};
              for (const n of targets) room[n] = Math.max(0, MAGIC_SKILL_CAP - m.binds[n]);
              let rest = left, moved = true;
              while (rest > 0 && moved) {
                moved = false;
                for (const n of targets) {
                  if (rest <= 0) break;
                  if (room[n] <= 0) continue;
                  d.magicAlloc[n] = TBE.num(d.magicAlloc[n], 0) + 1;
                  room[n] -= 1; rest -= 1; moved = true;
                }
              }
              if (rest > 0) ui.notifications?.info("TBE: " + rest + " Magic point(s) could not be spent without passing " + MAGIC_SKILL_CAP + "; put them on another Bind.");
            }
            this.render(true);
          }
          else if (action === "even-split-cat") {
            /* Spend only what is LEFT, across the boxes still on 0, and leave
             * every deliberate entry alone. Overwriting the player's own
             * choices was the old behaviour and there was no reason for it. */
            const cat = ev.currentTarget.dataset.cat;
            const pool = (this.career().pools || {})[cat] || 0;
            const names = SKILLS[cat];
            let spent = 0;
            names.forEach((n, idx) => { spent += TBE.num(d.alloc[cat + "_" + idx], 0); });
            const left = pool - spent;
            const empty = names.map((n, idx) => idx).filter((idx) => TBE.num(d.alloc[cat + "_" + idx], 0) === 0);
            if (left <= 0 || !empty.length) {
              ui.notifications?.info(left <= 0
                ? "TBE: " + cat + " is already fully spent."
                : "TBE: every " + cat + " skill already has points; clear one to spread the remainder.");
            } else {
              const share = evenSplitNames(left, empty);
              empty.forEach((idx, i) => { d.alloc[cat + "_" + idx] = share[i]; });
            }
            this.render(true);
          }
          else if (action === "create") {
            btn.disabled = true;
            try {
              await this.commit();
              this._committed = true;
              await TBE.remember("wizardDraft", this.actor.id, null);
              this.close();
              /* Everything chargen deliberately leaves open -- shopping, the
               * free Talent picks, naming blank slots, Goals, Shared History
               * -- now lives in TBE: Finish Character, which needs the rolled
               * totals to exist first. */
              /* game.macros only holds what someone dragged out of the
               * compendium into the world macro directory -- on a fresh
               * install (or any table where Finish Character hasn't been
               * imported that way) the old getName lookup here returned
               * undefined every time, so this handoff silently fell through
               * to a toast that's easy to miss right as the wizard closes.
               * TBE.runMacro (in _lib.js) also checks the compendium
               * directly, so this fires whether or not anything was ever
               * dragged into the world macro directory. */
              setTimeout(async () => {
                const ok = await TBE.runMacro("TBE: Finish Character");
                if (!ok) ui.notifications?.info("TBE: run 'Finish Character' from the Solo Panel to equip, pick Talents and set Goals.");
              }, 120);
            }
            catch (err) { console.error("TBE | wizard commit failed", err); ui.notifications?.error("TBE: character creation failed, see console (F12)."); btn.disabled = false; }
          }
        });
      });
    }

    /* One atomic commit at the end. */
    async commit() {
      const d = this.draft;
      const native = (d.humanCultureLang || "Westronne").trim();
      const rolls = [];
      let notesOut = [];
      let removed = 0;

      if (d.wipe) {
        const ids = this.actor.items.filter((i) => i.type === "skill" || i.type === "talent" || i.type === "weapon").map((i) => i.id);
        if (ids.length) { await this.actor.deleteEmbeddedDocuments("Item", ids); removed = ids.length; }
      }

      const { values, spent, raceApplied, lifeApplied, abilityApplied, cultureApplied, roApplied, notesOut: calcNotes, race, career, age } = computeSkillValues(d);
      notesOut = notesOut.concat(calcNotes);

      const mk = (group, name, value, fighting, extra) => ({ name, type: "skill", system: Object.assign({ group, value: Math.max(0, TBE.num(value, 0)), fighting: !!fighting }, extra || {}) });
      const payload = Object.entries(values).map(([name, v]) => mk(v.group, name, v.value, v.fighting, { expertise: v.expertise || 0, savvy: !!v.savvy }));
      /* p.81: Old Vestrians take Low Vestrian 70 and High Vestrian 20
         INSTEAD of the race's two language lines, not as well. */
      const oldVestrian = this.usesHumanCulture() && d.humanCultureRange === "59-64";
      if (!oldVestrian) for (const l of race.languages || []) {
        const nm = /cultural|their cultural/i.test(l.name) ? native : l.name;
        payload.push(mk("Language", nm, l.value));
      }
      const culture = this.culture();
      if (culture && culture.extraLanguage) payload.push(mk("Language", "Cultural extra Language", culture.extraLanguage));
      if (this.usesHumanCulture() && d.humanCultureRange === "59-64") {
        payload.push(mk("Language", "Low Vestrian (Old Vestrian)", 70));
        payload.push(mk("Language", "High Vestrian", 20));
        notesOut.push("Old Vestrian: Low Vestrian 70 / High Vestrian 20 were added instead of a single cultural language.");
      }
      for (const sk of race.startingSkills || []) payload.push(mk("Lore", sk.name, sk.value));
      /* p.79-80: assign 20 to all other skills "except custom -wises and
       * Languages under Lore; these may receive values in later steps, but
       * leave them at zero for now". Blank slots start empty; Career customs
       * and Rounding Out are what put values in them. */
      const wises = Math.max(0, TBE.num(d.wises, 0));
      for (let i = 0; i < wises; i++) payload.push(mk("Wise", "Wise: subject " + (i + 1), 0));
      /* Ch.7 p.79: "Magic skills have their own starting values as detailed
       * later; they all start at zero." The five Binds are named and fixed,
       * so they are created as themselves rather than as "Bind: name it 1"
       * placeholders nothing could ever act on. Strands are not skills at
       * all -- they are Strand Items with a level, created below. */
      const magicOut = MAGIC ? computeMagic(d) : null;
      if (MAGIC) {
        for (const n of BINDS) {
          payload.push(mk("Bind", "Bind: " + n, magicOut.binds[n],
            false, { expertise: d.bindExpertise === n ? 2 : 0 }));
        }
      } else {
        const binds = Math.max(0, TBE.num(d.binds, 2));
        for (let i = 0; i < binds; i++) payload.push(mk("Bind", "Bind: name it " + (i + 1), 0));
      }
      /* Godbound career grants "Magic (Piety) 20" (p.104) AND the Godbound
       * Talent, which grants Piety "at a starting value of 30 (or to add 30
       * during character creation)" (Ch.4). Both apply, so 50.
       *
       * Only for a Godbound. A Piety skill at 0 on an ordinary character is
       * not harmless bookkeeping: it is the only thing TBE.godbound() had to
       * go on, so it opened TBE: Miracle to everybody and the first prayer
       * Cast them Out for good. (v0.28.0) */
      if (career.name === "Godbound") payload.push(mk("Lore", "Piety", 50));
      for (const [count, value] of (career.customs || [])) {
        for (let i = 0; i < count; i++) payload.push(mk("Wise", "Career wise/Language " + (i + 1), value));
      }

      let made = 0;
      try { made = (await this.actor.createEmbeddedDocuments("Item", payload)).length; }
      catch (err) { console.error("TBE | skill creation failed", err); ui.notifications?.error("TBE: could not create skill items, see console (F12)."); }

      /* Strands and Threads are their own Item types. computeMagic already
       * folded in every source (career picks, the level pools, Life Events,
       * Rounding Out) and applied the creation caps, so this just writes the
       * result out. A Strand at level 0 is not created: "All other Strands
       * start at zero", and an Item at 0 is exactly the dead placeholder
       * this release removed. */
      const magicMade = [];
      if (MAGIC && magicOut.pattern !== "none") {
        const strandPayload = STRANDS.filter((n) => magicOut.strands[n] > 0).map((n) => ({
          name: n, type: "strand", img: "icons/svg/daze.svg",
          system: {
            level: magicOut.strands[n], thin: magicOut.thin.has(n),
            description: "<p>" + (STRAND_DESC[n] || "") + "</p>"
          }
        }));
        if (strandPayload.length) {
          try {
            await this.actor.createEmbeddedDocuments("Item", strandPayload);
            magicMade.push(strandPayload.map((x) => x.name + " " + x.system.level).join(", "));
          } catch (err) { console.error("TBE | strand creation failed", err); }
        }
        /* The Spellweaver career's d8 Thread Die (p.105). A real Item,
         * because TBE: Cast steps the die down when it rolls a 1 or 2. */
        if (d.threadAttunement) {
          const [kind, nm] = String(d.threadAttunement).split(":");
          try {
            await this.actor.createEmbeddedDocuments("Item", [{
              name: (d.threadName || "").trim() || (nm + " Thread"),
              type: "thread", img: "icons/svg/lightning.svg",
              system: { attunement: nm, kind: "die", die: "d8", pool: 0, bonus: 0, expended: false,
                description: "<p>A d8 Thread Die attuned to the " + kind + " " + nm + ", chosen at character creation.</p>" }
            }]);
            magicMade.push("d8 " + nm + " Thread");
          } catch (err) { console.error("TBE | thread creation failed", err); }
        }
        /* Faded Pattern is a real Talent and costs two Talent selections; a
         * Spellweaver gets Patterned in the Weave from the career text, which
         * resolveTalentPayload already picks up. */
        if (magicOut.pattern === "fade") {
          const rec = TBE_TALENTS.find((t) => /^faded pattern$/i.test(t.name));
          if (rec) {
            try {
              await this.actor.createEmbeddedDocuments("Item", [{
                name: rec.name, type: "talent", img: "icons/svg/upgrade.svg",
                system: { category: rec.category, requirements: rec.requires || "", ranks: 1,
                  maxRanks: rec.rank, specialization: "", sub: !!rec.sub, description: "<p>" + rec.desc + "</p>" }
              }]);
              magicMade.push("Faded Pattern Talent");
              notesOut.push("Faded Pattern uses TWO of your starting Talent selections (p.48), so drop one other granted Talent.");
            } catch (err) { console.error("TBE | faded pattern failed", err); }
          }
        }
        notesOut = notesOut.concat(magicOut.notes);
      }

      /* Life Event outcomes that are not a plain skill bump: a new -wise, a
       * Bind or Strand, extra Status, or Piety. computeSkillValues handled
       * the value changes; these need Items or an actor field. */
      let lifeStatus = 0;
      const lifeExtras = [];
      for (const key of ["origin", "youth", "recent"]) {
        const ev = d.lifeEvents[key];
        if (!ev || !(ev.options || []).length) continue;
        const opt = ev.options[Math.max(0, Math.min(ev.options.length - 1, TBE.num(d.lifeChoice[key], 0)))];
        if (!opt) continue;
        const extra = (d.lifeChoiceExtra[key] || "").trim();
        if (opt.kind === "status") { lifeStatus += TBE.num(opt.amount, 1); lifeExtras.push("+" + TBE.num(opt.amount, 1) + " Status"); }
        else if (opt.kind === "wise") {
          try { await this.actor.createEmbeddedDocuments("Item", [mk("Wise", opt.name, TBE.num(opt.value, 20))]); lifeExtras.push(opt.name + " at " + TBE.num(opt.value, 20)); }
          catch (err) { console.warn("TBE | life-event wise failed", err); }
        } else if (opt.kind === "bind" || opt.kind === "strand") {
          /* computeMagic owns these now: it folds the grant into the real
           * Bind skill or Strand Item, applies the creation caps, and says
           * so when the character is not Patterned. Creating a second
           * "Bind: Control" skill here would double-count it. */
          const nm = opt.name || extra;
          if (nm && MAGIC && magicOut && magicOut.pattern !== "none") lifeExtras.push(opt.label + " (" + nm + ")");
          else if (!nm) notesOut.push("Life Event (" + key + "): " + opt.label + " -- name it on the Life Events step.");
        } else if (opt.kind === "piety") {
          if (career.name === "Godbound") lifeExtras.push("+" + TBE.num(opt.amount, 10) + " Piety (raise it on the Skills tab)");
          else notesOut.push("Life Event (" + key + "): " + opt.label + " needs the Godbound Talent, so the alternative applies instead.");
        }
      }
      if (lifeExtras.length) notesOut.push("Life Event extras granted: " + lifeExtras.join(", ") + ".");

      /* Bolg Fiir: "gets +10 to one Bind skill of their choice. If not [a
       * Spellweaver], they instead get a +10 bonus to all opposed rolls
       * against Weave Magic." The first half is a real number and now lands;
       * the second is a situational modifier, so it stays a note. */
      const bindPick = (d.raceBindPick || "").trim();
      if (this.raceChoices().bindBonus) {
        /* computeMagic folds this +10 into the real Bind skill (and only for
         * a caster, which is what the book's two halves mean), so all that is
         * left here is saying which half applied. Adding the points again
         * would double them. */
        if (bindPick && MAGIC && magicOut && magicOut.pattern !== "none") {
          notesOut.push("Racial bonus: Bind: " + bindPick.replace(/^bind\s*:\s*/i, "") + " +10, applied.");
        } else if (bindPick && MAGIC) {
          notesOut.push("Racial bonus: you named a Bind but this character is not Patterned, so the other half applies instead: +10 to all opposed rolls against Weave Magic.");
        } else {
          notesOut.push("Racial bonus: +10 to all opposed rolls against Weave Magic (no Bind chosen, so the non-Spellweaver half applies).");
        }
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
      /* The BASE Max Resolve. Talents that raise it (Patterned in the Weave
       * +5, Inner Strength +1) apply on top through their own transfer:true
       * ActiveEffects, so this must not try to include them or they would be
       * counted twice. */
      const resolveMax = 10 + 2 * TBE.num(s.resolve, 0);
      const initBase = d.randomizedInit ? TBE.num(d.initRoll, 6) : 10;
      const initiative = initBase + TBE.num(s.initiative, 0);
      const toughness = Math.floor(TBE.num(s.toughness, 0) / 2) + (race.toughness || 0);
      const dtBase = d.randomizedDT ? TBE.num(d.dtRoll, 15) : TBE.num(race?.dt, 20);  /* p.83: an Ogre starts at 22, not the default 20. */
      const dt = (d.randomizedDT ? dtBase : dtBase + 2 * TBE.num(s.dt, 0)) + (age?.dt || 0);

      const careerSilverRoll = career.silver ? await new Roll(career.silver).evaluate() : null;
      if (careerSilverRoll) rolls.push(careerSilverRoll);
      const cultureSilverRoll = culture?.silver ? await new Roll(culture.silver).evaluate() : null;
      if (cultureSilverRoll) rolls.push(cultureSilverRoll);
      const silverParts = [];
      if (careerSilverRoll) silverParts.push(career.name + " " + career.silver + " → " + careerSilverRoll.total);
      if (cultureSilverRoll) silverParts.push(culture.name + " " + culture.silver + " → " + cultureSilverRoll.total);
      silverParts.push("Equip step 2d4×50 → " + equipCoinRoll.total);
      if (d.roBonusChoice === "money") silverParts.push("Rounding Out +100");
      const totalSilver = (careerSilverRoll ? careerSilverRoll.total : 0) + (cultureSilverRoll ? cultureSilverRoll.total : 0) + equipCoinRoll.total +
        (d.roBonusChoice === "money" ? 100 : 0);

      // Ch.7 step 10 / Ch.8 "Personality Changes" (p.123): a real field, not
      // just a Notes-tab summary -- computed here (before the update, not
      // after) so Create Character writes it in the same atomic pass as
      // everything else.
      /* Ch.8: Ability Score descriptors "act as a kind of Personality Trait"
       * and can be invoked the same way, so they belong in the real list, not
       * only in the Notes prose. */
      const personality = d.personalityPicks
        .concat((d.personalityCustom || "").split(",").map((s) => s.trim()).filter(Boolean))
        .concat(d.abilityDescriptor.filter(Boolean))
        .filter((v, i, a) => a.indexOf(v) === i);

      const update = {
        "system.race": race.name, "system.career": career.name, "system.culture": (d.cultureBgName || "").trim(),
        "system.size": race.size, "system.toughness": toughness,
        "system.deathThreshold.value": dt, "system.deathThreshold.max": dt,
        "system.resolve.value": resolveMax, "system.resolve.max": resolveMax,
        "system.initiative": initiative,
        "system.lethalityBonus": race.lethalityBonus || 0, "system.fatigue": 0,
        "system.silver": totalSilver,
        "system.status": Math.max(TBE.num(this.actor.system?.status, 0),
          (d.roBonusChoice === "status" ? 1 : 0) + lifeStatus),  /* never lower a Status the character already earned */
        "system.supply.gear": 12, "system.supply.ammo": 12, "system.supply.rations": 12, "system.supply.medical": 12,
        "flags.the-broken-empires.freeArmor": armorRoll.total,
        /* Ch.5: "They have 8 general Inventory ENC instead of 6." The field
         * existed and was read by both the sheet and TBE.encStatus, but
         * nothing ever set it, so every Ogre silently carried 6. */
        "system.enc.invBonus": TBE.num(race.invBonus, 0)
      };
      /* Ch.14. The Pattern is what decides the Strand ceiling, the Bind
       * ceiling and whether a critical failure costs Fraying, so it is a
       * real field the sheet and the macros read, not a Notes line. */
      if (MAGIC && this.actor.type === "character") {
        update["system.pattern"] = magicOut.pattern;
        update["system.convocation"] = magicOut.pattern === "spellweaver" ? (d.convocation || "") : "";
        update["system.trueName"] = (d.trueName || "").trim();
        update["system.fraying"] = TBE.num(this.actor.system?.fraying, 0);
      }
      if (this.actor.type === "character" && personality.length) update["system.personalityTraits"] = personality;
      try { await this.actor.update(update); } catch (err) { console.warn("TBE | could not write vitals", err); }

      if (race.toughnessCap !== null && race.toughnessCap !== undefined) notesOut.push(race.name + " can never exceed Toughness " + race.toughnessCap + ".");
      for (const r of race.restrictions || []) notesOut.push(r);
      if (race.savvy && race.savvy.length) notesOut.push("Bonus Savvy skill (race): " + race.savvy.join(race.savvy.length > 2 ? ", or " : " / ") + ".");
      if (race.bonus) notesOut.push(race.bonus);
      for (const [count, value] of (career.customs || [])) notesOut.push("Rename the " + count + " career -wise/Language slot(s), each at " + value + ".");
      /* p.109 step 9: these pieces are FREE, not bought. Stash the rolled
       * count on the actor so TBE: Finish Character can hand them over
       * without charging silver; it decrements as each is claimed. Before
       * this the number lived only in a Notes line, so the player had to
       * remember it and then paid for armor the book gives away. */
      notesOut.push("Starting armor: " + armorRoll.total + " free piece(s) to claim in TBE: Finish Character (training permitting).");
      if (["origin", "youth", "recent"].some((k) => d.lifeEvents[k])) {
        notesOut.push("Life Events: " + ["origin", "youth", "recent"]
          .map((k) => d.lifeEvents[k] ? k + " → " + d.lifeEvents[k].name : null).filter(Boolean).join(", ") + ".");
      }
      if (d.relationshipNpcs.length) notesOut.push("Relationship NPCs: " + d.relationshipNpcs.map((n) => n.type + (n.name ? " — " + n.name : "") + (n.note ? ": " + n.note : "")).join("; ") + ".");
      /* Personality Traits get their own section in the seeded Notes and a real
       * field on the sheet, so listing them again under "Still to decide" was
       * pure duplication. */
      /* Descriptors are merged into personalityTraits above, so they are not
       * repeated here either. */


      if (this.actor.type === "character" && d.seedNotes) {
        const html = "<h3>Concept</h3><p>Race: " + race.name + "<br>Cultural background: " + (d.cultureBgName || "") +
          "<br>Previous career: " + career.name + "<br>Concept: " + (d.concept || "") + "</p>" +
          "<h3>Still to decide</h3><ul>" + notesOut.map((n) => "<li>" + n + "</li>").join("") + "</ul>" +
          "<h3>Goals</h3><p>Build them in <b>TBE: Finish Character</b>, which walks the book\'s four-step method (Ch.6).</p>" +
          "<h3>Personality traits and descriptors</h3><p>" + personality.join(", ") + "</p><h3>Status and relationships</h3><p></p>";
        try { await this.actor.update({ "system.notes": html }); } catch (err) { console.error("TBE | notes seed failed", err); }
      }

      /* Everything below (skill-point math, racial/Ability Score/Cultural
       * Background/Rounding Out bonuses, the silver breakdown) used to exist
       * ONLY in the chat card that follows -- scroll past it once in a busy
       * session and it's gone, with no other record anywhere on the actor.
       * Stash it as a flag, unconditionally (not gated by "Seed the Notes
       * tab", which is a separate, narrower feature), so TBE: Finish
       * Character's Summary tab can show it back whenever it's needed rather
       * than only for the few seconds this card is on screen. */
      if (this.actor.type === "character") {
        const ledger = {
          ts: Date.now(),
          race: race.name, career: career.name, cultureName: (d.cultureBgName || "").trim(),
          concept: (d.concept || "").trim(), personality: personality.slice(),
          skillPoints: spent.slice(), racial: raceApplied.slice(), ability: abilityApplied.slice(),
          cultureApplied: cultureApplied.slice(), roundingOut: roApplied.slice(),
          talents: talentPayload.map((t) => t.name + (t.system.ranks > 1 ? " ×" + t.system.ranks : "")),
          silver: { parts: silverParts.slice(), total: totalSilver },
          stats: { toughness, dt, resolveMax, initiative },
          stillToDecide: notesOut.slice()
        };
        try { await this.actor.update({ "flags.the-broken-empires.chargenLedger": ledger }); }
        catch (err) { console.error("TBE | chargen ledger stash failed", err); }
      }

      const body = "<div><b>" + this.actor.name + "</b> &mdash; " + race.name + " " + career.name + "</div>" +
        "<div>" + made + " skills created" + (removed ? ", " + removed + " old items removed" : "") + ".</div>" +
        "<div>Toughness <b>" + toughness + "</b>, Death Threshold <b>" + dt + "</b>, Resolve <b>" + resolveMax + "</b>, Initiative <b>" + (initiative >= 0 ? "+" : "") + initiative + "</b>.</div>" +
        (typeof magicMade !== "undefined" && magicMade.length
          ? "<div>Weave Magic: " + (magicOut.pattern === "fade" ? "Fade" : "Spellweaver") +
            (d.convocation ? " (" + d.convocation + ")" : "") + ".</div>"
          : "") +
        (talentPayload.length ? "<div>Talents granted: " + talentPayload.map((t) => t.name + (t.system.ranks > 1 ? " &times;" + t.system.ranks : "")).join(", ") + ".</div>" : "") +
        "<div>Starting silver: <b>" + totalSilver + " sp</b>.</div>" +
        '<div style="border-top:1px solid #7a6a4f;margin-top:4px;padding-top:4px;font-size:11px;opacity:.85">' +
        "Full skill-point math and " + notesOut.length + " thing(s) still to decide: <b>TBE: Finish Character</b> → Summary tab, opening now.</div>";
      await TBE.say(TBE.card("TBE Character Built (Wizard)", body), rolls);
    }
  }

  /* A draft left open last time is offered back, not forced: starting over
     is one click, and the saved draft is kept until Create Character or an
     explicit fresh start. */
  const wizard = new TBECharacterWizard(actor);
  const saved = TBE.recall("wizardDraft", actor.id);
  let open = true;
  if (saved && saved.draft) {
    const when = saved.savedAt ? new Date(saved.savedAt).toLocaleString() : "earlier";
    const stepLabel = (wizard.STEP_DEFS.find((st) => st.key === saved.stepKey) || {}).label || "the start";
    const pick = await TBE.prompt("TBE: Character Wizard",
      "<div>You have an unfinished character for <b>" + TBE.esc(actor.name) + "</b>, saved " + TBE.esc(when) +
      ", on <b>" + TBE.esc(stepLabel) + "</b>.</div>" +
      '<label style="display:block;margin-top:6px"><input type="radio" name="start" value="resume" checked> Resume it</label>' +
      '<label style="display:block"><input type="radio" name="start" value="fresh"> Start over (the saved draft is discarded)</label>',
      "Open");
    if (!pick) open = false;
    else if (pick.start === "fresh") await TBE.remember("wizardDraft", actor.id, null);
    else wizard._restore(saved);
  }
  if (open) wizard.render(true);
}
