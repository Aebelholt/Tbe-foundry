/* TBE: Build Character — the real chargen flow (Ch.5 and Ch.7).
 *
 * Race and Previous Career are not flavour text here. A race carries hard
 * numbers the rest of the pack reads (an Ogre starts Toughness 1, Death
 * Threshold 22 and Size Large, and takes -20 to Melee: Light), and a career is
 * a pool of skill points per category plus Talents and starting silver. Both
 * are applied to real fields, and everything this macro could not decide for
 * you is reported rather than quietly skipped.
 */

const SKILLS = {
  Combat: ["Dodge", "Melee: Light", "Melee: Medium", "Melee: Heavy", "Might", "Missile", "Thrown"],
  Adventuring: ["Athletics", "Endurance", "Locks & Traps", "Perception", "Ride", "Sail/Boat",
    "Sleight of Hand", "Stealth", "Survival", "Track", "Willpower"],
  Social: ["Deceive", "Insight", "Inspire", "Intimidate", "Perform", "Persuade", "Protocol", "Seduce", "Wit"],
  Lore: ["Ancient Lore", "Arcana", "Commerce", "Common Lore", "Craft: Artistic", "Craft: Practical",
    "Divinity", "Heal", "Naturewise", "Streetwise"]
};
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
    '<label style="display:block">Blank -wise slots: <input type="number" name="wises" value="4" min="0" max="12" style="width:100%"></label>' +
    '<label style="display:block">Blank Bind slots: <input type="number" name="binds" value="2" min="0" max="6" style="width:100%"></label>' +
    '<label style="display:block;margin-top:4px"><input type="checkbox" name="wipe" checked> Remove the actor\'s existing skills and Talents first</label>' +
    '<label style="display:block"><input type="checkbox" name="notes" checked> Seed the Notes tab</label>' +
    '<div style="font-size:11px;opacity:.75;margin-top:4px">Next step spends the career\'s skill points one at a time, your choice, per p.102: "Skill points cannot be transferred between categories."</div>' +
    "</div>";

  const data = await TBE.prompt("Build a TBE character", content, "Build");
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
    let allocContent = '<div style="font-size:13px"><div style="margin-bottom:4px">' + career.name + " skill points &mdash; edit any field, each skill caps at " + CHARGEN_SKILL_CAP + " during creation.</div>";
    for (const [cat, pool] of poolCats) {
      const names = SKILLS[cat] || [];
      const each = Math.floor(pool / names.length);
      let rest = pool - each * names.length;
      allocContent += '<div style="font-weight:bold;margin-top:4px">' + cat + " &mdash; " + pool + " points to spend</div>";
      for (const n of names) {
        const def = each + (rest > 0 ? 1 : 0);
        if (rest > 0) rest--;
        allocContent += '<label style="display:inline-block;width:49%">' + n + ': <input type="number" name="pt_' + cat + "_" + names.indexOf(n) +
          '" value="' + def + '" style="width:50px"></label>';
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
      names.forEach((n, idx) => {
        const add = Math.max(0, TBE.num((data2 || {})["pt_" + cat + "_" + idx], 0));
        allocated += add;
        values[n].value = Math.min(CHARGEN_SKILL_CAP, values[n].value + add);
      });
      spent.push(cat + " " + allocated + "/" + pool);
      if (allocated !== pool) notesOut.push(cat + ": you allocated " + allocated + " of " + pool + " points" + (allocated < pool ? " (" + (pool - allocated) + " unspent, add them later via TBE: Advancement or the Skills tab)" : " (over the pool by " + (allocated - pool) + " -- trim it on the Skills tab)") + ".");
    }

    /* ---- 3. Racial skill modifiers ------------------------------------
       "If a racial modifier decreases a skill value to zero or below, set it
       to zero" (Ch.5). Applied after career points, as the book orders it. */
    const raceApplied = [];
    for (const m of race.skillMods || []) {
      if (!values[m.skill]) { notesOut.push("Racial modifier " + (m.mod > 0 ? "+" : "") + m.mod + " to " + m.skill + ": no such skill on the list, apply by hand."); continue; }
      values[m.skill].value = Math.max(0, values[m.skill].value + m.mod);
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

    const wises = Math.max(0, TBE.num(data.wises, 4));
    for (let i = 0; i < wises; i++) payload.push(mk("Wise", "Wise: subject " + (i + 1), base));
    const binds = Math.max(0, TBE.num(data.binds, 2));
    for (let i = 0; i < binds; i++) payload.push(mk("Bind", "Bind: name it " + (i + 1), 0));
    payload.push(mk("Bind", "Strand, name it", 0));
    payload.push(mk("Lore", "Piety", career.name === "Godbound" ? 20 : 0));

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
