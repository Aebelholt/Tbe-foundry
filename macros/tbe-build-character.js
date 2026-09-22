/* TBE: Build Character — the real chargen flow (Ch.5 and Ch.7).
 *
 * Race and Previous Career are not flavour text here. A race carries hard
 * numbers the rest of the pack reads (an Ogre starts Toughness 1, Death
 * Threshold 22 and Size Large, and takes -20 to Melee: Light), and a career is
 * a pool of skill points per category plus Talents and starting silver. Both
 * are applied to real fields, and everything this macro could not decide for
 * you is reported rather than quietly skipped.
 */

/* The skill catalogue and its categories live in _lib.js (TBE.SKILL_GROUPS),
 * so this macro, the Wizard, Finish Character and NPC generation cannot drift
 * apart. */
const SKILLS = TBE.SKILL_GROUPS;
const CHARGEN_SKILL_CAP = 70;   // "No skill can be raised higher than 70 during character creation."

const actor = canvas.tokens?.controlled?.[0]?.actor ?? game.user?.character ?? null;
if (!actor) {
  ui.notifications?.warn("TBE: select a token, or set an assigned character, then run this again.");
} else {
  const RACES = TBE_CHARGEN.races || [];
  const CAREERS = TBE_CHARGEN.careers || [];

  const raceOpts = RACES.map((r) =>
    '<option value="' + r.name + '">' + r.name + " (" + r.d100 + ")</option>").join("");
  const careerOpts = CAREERS.map((c) =>
    '<option value="' + c.name + '">' + c.name + " &mdash; " +
    Object.entries(c.pools).filter(([, v]) => v).map(([k, v]) => k + " " + v).join(", ") + "</option>").join("");

  const content =
    '<div style="font-size:13px">' +
    '<div style="margin-bottom:4px">Target: <b>' + actor.name + "</b></div>" +
    '<label style="display:block">Race: <select name="race" style="width:100%">' + raceOpts + "</select></label>" +
    '<label style="display:block">Previous Career: <select name="career" style="width:100%">' + careerOpts + "</select></label>" +
    '<label style="display:block">Cultural background: <input type="text" name="culture" value="Westlands" style="width:100%"></label>' +
    '<label style="display:block">Native language: <input type="text" name="lang" value="Westronne" style="width:100%"></label>' +
    '<label style="display:block">Starting skill value before career points: <input type="number" name="base" value="20" style="width:100%"></label>' +
    /* p.79-80: "First, choose one skill from each category except Magic and
     * assign it a value of 30. Then, assign a value of 20 to all other..."
     * This macro previously wrote one uniform value to every skill, leaving
     * every character 40 points light with no signature skill anywhere. */
    '<div style="font-size:12px;margin-top:4px">One skill per category starts at 30 (p.80):</div>' +
    Object.keys(SKILLS).map((cat) =>
      '<label style="display:inline-block;width:49%;font-size:12px">' + cat + ' to 30: <select name="boost' + cat + '" style="width:100%">' +
      '<option value="">(none)</option>' +
      SKILLS[cat].map((n) => '<option value="' + n + '">' + n + "</option>").join("") +
      "</select></label>").join("") +
    '<label style="display:block">Extra blank -wise slots: <input type="number" name="wises" value="0" min="0" max="12" style="width:100%"></label>' +
    '<div style="font-size:11px;opacity:.75">Leave at 0: Career, Culture, Life Events and Rounding Out create the ones the book grants.</div>' +
    '<label style="display:block">Blank Bind slots: <input type="number" name="binds" value="2" min="0" max="6" style="width:100%"></label>' +
    '<label style="display:block;margin-top:4px"><input type="checkbox" name="wipe" checked> Remove the actor\'s existing skills and Talents first</label>' +
    '<label style="display:block"><input type="checkbox" name="notes" checked> Seed the Notes tab</label>' +
    '<div style="font-size:11px;opacity:.75;margin-top:4px">Next step spends the career\'s skill points one at a time, your choice, per p.102: "Skill points cannot be transferred between categories."</div>' +
    "</div>";

  /* Said before anything is built, not in the notes afterwards. This macro
     covers Ch.7 steps 1-2 and 7 only; the rest of the chapter is real and a
     character without it is not finished. It used to be offered in the Solo
     Panel beside the Wizard with nothing to distinguish them. */
  const warning =
    '<div style="border:1px solid #a8742a;padding:5px;margin-bottom:6px;font-size:12px">' +
    "<b>This is the quick path, not the whole chapter.</b> It sets race, career, " +
    "skill points and the derived stats. It does <b>not</b> do Ability Scores, " +
    "Cultural Background, Life Events, Rounding Out, equipment, Personality Traits, " +
    "Goals or Status (Ch.7 p.79-90).<br><b>TBE: Character Wizard</b> covers all of it. " +
    "Use this only if you want a fast NPC-grade character and will fill in the rest yourself." +
    "</div>";

  const data = await TBE.prompt("Build a TBE character", warning + content, "Build anyway");
  if (data) {
    const on = (v) => v === "on" || v === true || v === "true";
    const base = TBE.num(data.base, 20);
    const race = RACES.find((r) => r.name === data.race) || RACES[0];
    const career = CAREERS.find((c) => c.name === data.career) || CAREERS[0];
    const native = (data.lang || "Westronne").trim();
    const rolls = [];
    const notesOut = [];
    let removed = 0;

    /* ---- Step 2: spend the career's skill pools, category by category.
       "A Previous Career provides you with a pool of points to spend on
       skills in each skill category... Skill points cannot be transferred
       between categories" (p.102) -- this is a player choice, not something
       to flatten out for them, so each skill gets its own input, pre-filled
       with an even split only as a reasonable starting point to edit. */
    const poolCats = Object.entries(career.pools).filter(([cat, pool]) => pool && cat !== "Magic" && (SKILLS[cat] || []).length);
    /* Each field shows the value the skill already sits at and how much room
       is left under the 70 cap. Without those two numbers you are typing into
       a box with no idea whether the skill is at 20 or at 68 -- the same
       preparedness defect the Wizard's own allocation step had, fixed there
       in v0.10.1 and left standing here until v0.28.0. */
    const startAt = (cat, n) => ((data["boost" + cat] || "").trim() === n ? 30 : base);
    let allocContent = '<div style="font-size:13px"><div style="margin-bottom:4px">' + career.name +
      " skill points &mdash; edit any field. Each skill caps at " + CHARGEN_SKILL_CAP +
      " during creation, and <b>points that would push a skill past the cap are lost</b>.</div>";
    for (const [cat, pool] of poolCats) {
      const names = SKILLS[cat] || [];
      const each = Math.floor(pool / names.length);
      let rest = pool - each * names.length;
      allocContent += '<div style="font-weight:bold;margin-top:4px">' + cat + " &mdash; " + pool + " points to spend</div>";
      for (const n of names) {
        const at = startAt(cat, n);
        const room = Math.max(0, CHARGEN_SKILL_CAP - at);
        const def = Math.min(room, each + (rest > 0 ? 1 : 0));
        if (rest > 0) rest--;
        allocContent += '<label style="display:inline-block;width:49%">' + n +
          ' <span style="font-size:11px;opacity:.75">(at ' + at + ', room ' + room + ')</span>: ' +
          '<input type="number" name="pt_' + cat + "_" + names.indexOf(n) +
          '" value="' + def + '" min="0" max="' + room + '" style="width:50px"></label>';
      }
    }
    allocContent += "</div>";
    const data2 = poolCats.length ? await TBE.prompt("Spend " + career.name + " skill points", allocContent, "Apply") : {};

    if (on(data.wipe)) {
      const ids = actor.items.filter((i) => i.type === "skill" || i.type === "talent").map((i) => i.id);
      if (ids.length) { await actor.deleteEmbeddedDocuments("Item", ids); removed = ids.length; }
    }

    /* ---- 1. Base skill list ------------------------------------------- */
    const values = {};   // name -> {group, value, fighting}
    for (const group of Object.keys(SKILLS)) {
      for (const name of SKILLS[group]) {
        values[name] = { group, value: base, fighting: group === "Combat" };
      }
    }
    /* ...then raise the one chosen skill per category to 30 (p.80). */
    const boostApplied = [];
    for (const cat of Object.keys(SKILLS)) {
      const pick = (data["boost" + cat] || "").trim();
      if (pick && values[pick]) { values[pick].value = 30; boostApplied.push(cat + ": " + pick); }
    }
    if (boostApplied.length < Object.keys(SKILLS).length) {
      notesOut.push("Starting 30s not chosen for every category (" + (boostApplied.join("; ") || "none picked") +
        "). p.80 gives you one skill at 30 in each of Combat, Adventuring, Social and Lore.");
    }

    /* ---- 2. Career points, as the player chose to spend them ---------- */
    const spent = [];
    for (const [cat, pool] of Object.entries(career.pools)) {
      if (!pool) continue;
      // Magic points go to Bind skills, which are named by the player, so they
      // cannot be auto-assigned; report the pool instead of guessing.
      if (cat === "Magic") { notesOut.push("Magic pool of " + pool + " points: assign by hand to your Bind skills (no Bind may exceed 70)."); continue; }
      const names = SKILLS[cat] || [];
      if (!names.length) continue;
      let allocated = 0;
      /* Points typed above the 70 cap used to be clamped away in silence while
         the card still reported them as spent ("Combat 80/80"), so 30 points
         could evaporate with no symptom. Count them and say so. */
      let wasted = 0;
      const wastedOn = [];
      names.forEach((n, idx) => {
        const add = Math.max(0, TBE.num((data2 || {})["pt_" + cat + "_" + idx], 0));
        allocated += add;
        const before = values[n].value;
        values[n].value = Math.min(CHARGEN_SKILL_CAP, before + add);
        const lost = before + add - values[n].value;
        if (lost > 0) { wasted += lost; wastedOn.push(n + " +" + lost); }
      });
      spent.push(cat + " " + allocated + "/" + pool + (wasted ? " (" + wasted + " lost to the cap)" : ""));
      if (wasted) notesOut.push(cat + ": " + wasted + " point(s) were typed above the " + CHARGEN_SKILL_CAP +
        " creation cap and are gone, not banked &mdash; " + wastedOn.join(", ") +
        ". Put them somewhere else on the Skills tab if you meant to keep them.");
      if (allocated !== pool) notesOut.push(cat + ": you allocated " + allocated + " of " + pool + " points" + (allocated < pool ? " (" + (pool - allocated) + " unspent, add them later via TBE: Advancement or the Skills tab)" : " (over the pool by " + (allocated - pool) + " -- trim it on the Skills tab)") + ".");
    }

    /* ---- 3. Racial skill modifiers ------------------------------------
       "If a racial modifier decreases a skill value to zero or below, set it
       to zero" (Ch.5). Applied after career points, as the book orders it. */
    const raceApplied = [];
    for (const m of race.skillMods || []) {
      if (!values[m.skill]) { notesOut.push("Racial modifier " + (m.mod > 0 ? "+" : "") + m.mod + " to " + m.skill + ": no such skill on the list, apply by hand."); continue; }
      /* p.80: "no skill can be increased beyond 70 for any reason" during
       * creation. The career-spend loop clamped, this did not, so a racial
       * bonus could push a skill past the cap. */
      values[m.skill].value = Math.min(CHARGEN_SKILL_CAP, Math.max(0, values[m.skill].value + m.mod));
      raceApplied.push(m.skill + " " + (m.mod > 0 ? "+" : "") + m.mod);
    }

    /* ---- 4. Build the item payload ------------------------------------ */
    const mk = (group, name, value, fighting) => ({
      name, type: "skill",
      system: { group, value: Math.max(0, TBE.num(value, 0)), fighting: !!fighting }
    });
    const payload = Object.entries(values).map(([name, v]) => mk(v.group, name, v.value, v.fighting));

    for (const l of race.languages || []) {
      const nm = /cultural|their cultural/i.test(l.name) ? native : l.name;
      payload.push(mk("Language", nm, l.value));
    }
    for (const sk of race.startingSkills || []) payload.push(mk("Lore", sk.name, sk.value));

    const wises = Math.max(0, TBE.num(data.wises, 0));
    for (let i = 0; i < wises; i++) payload.push(mk("Wise", "Wise: subject " + (i + 1), 0));  /* p.80: -wises and Languages start at zero */
    const binds = Math.max(0, TBE.num(data.binds, 2));
    for (let i = 0; i < binds; i++) payload.push(mk("Bind", "Bind: name it " + (i + 1), 0));
    payload.push(mk("Bind", "Strand, name it", 0));
    /* Piety exists on a sheet only if the character is a Godbound. It used to
       be created at 0 for everyone as a placeholder, which made
       TBE.godbound() -- whose whole job is to answer "is this a Godbound?" --
       say yes to every character in the world, so any Warrior could open
       TBE: Miracle, fail the automatic Piety 0 roll, and be permanently Cast
       Out. Career-Godbound gets "Magic (Piety) 20" (p.104) plus the Godbound
       Talent's 30 (Ch.4) = 50; anyone else who takes the Talent later gets
       the skill from TBE: Talents, which is where that grant belongs. */
    if (career.name === "Godbound") payload.push(mk("Lore", "Piety", 50));

    /* Career custom -wise/Language slots, at the value the career specifies. */
    for (const [count, value] of (career.customs || [])) {
      for (let i = 0; i < count; i++) payload.push(mk("Wise", "Career wise/Language " + (i + 1), value));
    }

    let made = 0;
    try {
      made = (await actor.createEmbeddedDocuments("Item", payload)).length;
    } catch (err) {
      console.error("TBE | skill creation failed", err);
      ui.notifications?.error("TBE: could not create skill items, see console (F12).");
    }

    /* ---- 5. Talents: grant the ones the book names outright ------------ */
    const wanted = [];
    for (const t of race.exclusiveTalents || []) wanted.push({ name: t, why: race.name + " exclusive" });
    // Race Talents that are free and mandatory (the Replaced's Hunted by the Queen).
    const careerTalentText = career.talents || "";
    const careerLower = careerTalentText.toLowerCase();
    /* Catalogue names carry a qualifier the career text does not repeat, e.g.
       "Armor Training (I-IV)" vs the career's "Armor Training III". Match on the
       bare name so those still resolve. */
    const bareName = (n) => n.replace(/\s*\([^)]*\)\s*$/, "").toLowerCase().trim();
    for (const t of TBE_TALENTS) {
      const bare = bareName(t.name);
      if (bare.length >= 4 && careerLower.indexOf(bare) > -1) {
        wanted.push({ name: t.name, why: career.name + " career" });
      }
    }
    const talentPayload = [];
    const seen = new Set();
    for (const w of wanted) {
      const key = w.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const rec = TBE_TALENTS.find((t) => t.name.toLowerCase() === key);
      if (!rec) { notesOut.push("Talent '" + w.name + "' (" + w.why + ") is not in the catalogue, add it by hand."); continue; }
      talentPayload.push({
        name: rec.name, type: "talent", img: "icons/svg/upgrade.svg",
        system: {
          category: rec.category, requirements: rec.requires || "", ranks: 1,
          maxRanks: rec.rank, specialization: "", sub: !!rec.sub,
          description: "<p>" + rec.desc + "</p>"
        }
      });
    }
    /* Armor Training III means three ranks of one Talent, not three Talents. */
    const romanRank = careerTalentText.match(/Armor Training (I{1,3}V?|IV)/i);
    if (romanRank) {
      const r = { I: 1, II: 2, III: 3, IV: 4 }[romanRank[1].toUpperCase()] || 1;
      const at = talentPayload.find((t) => /^armor training/i.test(t.name));
      if (at) { at.system.ranks = r; at.system.specialization = "up to " + ["Reinforced Leather", "Mail", "Scale", "Plate"][r - 1]; }
    }
    /* A racial cap overrides the career: an Ogre takes Armor Training only once,
       for Bone armor, however many ranks a Warrior career would have granted. */
    for (const lim of race.talentLimits || []) {
      const hit = talentPayload.find((t) => t.name.toLowerCase().indexOf(lim.talent.toLowerCase()) > -1);
      if (hit && hit.system.ranks > lim.maxRanks) {
        notesOut.push(race.name + " caps " + lim.talent + " at " + lim.maxRanks +
          " rank (" + lim.note + "), down from the career's " + hit.system.ranks + ".");
        hit.system.ranks = lim.maxRanks;
        hit.system.specialization = lim.note;
      }
    }
    if (talentPayload.length) {
      try { await actor.createEmbeddedDocuments("Item", talentPayload); }
      catch (err) { console.error("TBE | talent creation failed", err); }
    }

    /* ---- 6. Vitals, size and race-driven caps -------------------------- */
    /* Career silver is written "1d6*5" etc; Foundry's Roll handles the operator. */
    const silverRoll = career.silver ? await new Roll(career.silver).evaluate() : null;
    if (silverRoll) rolls.push(silverRoll);
    const update = {
      "system.race": race.name,
      "system.career": career.name,
      "system.culture": (data.culture || "").trim(),
      "system.size": race.size,
      "system.toughness": race.toughness,
      "system.deathThreshold.value": race.dt, "system.deathThreshold.max": race.dt,
      "system.resolve.value": 10, "system.resolve.max": 10,
      "system.lethalityBonus": race.lethalityBonus || 0,
      "system.fatigue": 0,
      "system.silver": silverRoll ? silverRoll.total : 0
    };
    try { await actor.update(update); }
    catch (err) { console.warn("TBE | could not write vitals", err); }

    if (race.toughnessCap !== null && race.toughnessCap !== undefined) {
      notesOut.push(race.name + " can never exceed Toughness " + race.toughnessCap + ".");
    }
    for (const r of race.restrictions || []) notesOut.push(r);
    if (race.savvy && race.savvy.length) {
      notesOut.push("Bonus Savvy skill: " + race.savvy.join(race.savvy.length > 2 ? ", or " : " / ") + ".");
    }
    if (race.bonus) notesOut.push(race.bonus);
    notesOut.push("Career Talents: " + careerTalentText + ".");
    for (const [count, value] of (career.customs || [])) {
      notesOut.push("Rename the " + count + " career -wise/Language slot(s), each at " + value + ".");
    }
    notesOut.push("Spend your 5 creation points: Max Resolve +2 each, Initiative +1 each, Toughness +1 per 2, Death Threshold +2 each (p.87). Also unbuilt here but real chapter steps: Ability Scores, Cultural Background, Life Events, Rounding Out, Equip Your Character, Personality Traits, Goals, Status -- see TBE: Character Wizard, which now covers all of these.");

    /* ---- 7. Notes tab -------------------------------------------------- */
    if (actor.type === "character" && on(data.notes)) {
      const html =
        "<h3>Concept</h3><p>Race: " + race.name + "<br>Cultural background: " + (data.culture || "") +
        "<br>Previous career: " + career.name + "<br>Concept: </p>" +
        "<h3>Still to decide</h3><ul>" + notesOut.map((n) => "<li>" + n + "</li>").join("") + "</ul>" +
        "<h3>Expertise</h3><p>Skill and Ex level, one line each:</p><ul><li></li><li></li></ul>" +
        "<h3>Goals</h3><ul><li>Short term: </li><li>Long term: </li></ul>" +
        "<h3>Personality traits and descriptors</h3><p></p>" +
        "<h3>Status and relationships</h3><p></p>";
      try { await actor.update({ "system.notes": html }); } catch (err) { console.error("TBE | notes seed failed", err); }
    }

    const body =
      "<div><b>" + actor.name + "</b> &mdash; " + race.name + " " + career.name + "</div>" +
      "<div>" + made + " skills created" + (removed ? ", " + removed + " old items removed" : "") + ".</div>" +
      (spent.length ? "<div>Career skill points (spent/pool): " + spent.join(", ") + ".</div>" : "") +
      (raceApplied.length ? "<div>Racial modifiers: " + raceApplied.join(", ") + ".</div>" : "") +
      "<div>Size <b>" + race.size + "</b>, Toughness <b>" + race.toughness + "</b>, Death Threshold <b>" + race.dt + "</b>" +
      (race.lethalityBonus ? ", Lethality <b>+" + race.lethalityBonus + "</b>" : "") + ".</div>" +
      (talentPayload.length ? "<div>Talents granted: " + talentPayload.map((t) => t.name +
        (t.system.ranks > 1 ? " &times;" + t.system.ranks : "")).join(", ") + ".</div>" : "") +
      (silverRoll ? "<div>Starting silver: <b>" + silverRoll.total + " sp</b> (" + career.silver + ").</div>" : "") +
      '<div style="border-top:1px solid #7a6a4f;margin-top:4px;padding-top:4px;font-size:11px;opacity:.85">' +
      notesOut.length + " thing(s) still need your decision, listed on the Notes tab.</div>";
    await TBE.say(TBE.card("TBE Character Built", body), rolls);
  }
}
