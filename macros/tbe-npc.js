/* TBE: NPC — answers "WHO IS THIS?" in one click.
 * Name from the culture tables, traits from the NPC Traits table, a trade from
 * data/trades.json, and the book's own Ability Scores (p.85-86) rolled on the
 * spot. Fighters additionally get the Ch.18 Enemy Difficulty stat line.
 *
 * Two things this macro used to get wrong, both fixed here: every skill Item it
 * created was stamped group:"Adventuring" (so a generated NPC's Dodge sat in the
 * wrong category and never appeared in a Combat-filtered picker), and its combat
 * skill was called "Weapon", which is not a skill in this game. Both the
 * catalogue and the category map now live in _lib.js. */

const CULTURES = Object.keys(TBE_NAMES);
/* Ch.18's Enemy Difficulty & Ferocity table, d100 ranges and all. Ferocity is
 * the strength of an enemy's morale -- what makes them flee or surrender, and
 * what puts them out of reach of Compel Surrender at 5+ (p.164). The creature
 * sheet has always had a Ferocity field; nothing ever filled it in. */
const TIERS = {
  Easy: { skill: 35, dt: 10, tough: 0, init: 12, ap: 1, dmg: 2, fer: 1, d100: [1, 15] },
  Medium: { skill: 50, dt: 13, tough: 0, init: 14, ap: 2, dmg: 3, fer: 2, d100: [16, 55] },
  Challenging: { skill: 65, dt: 16, tough: 1, init: 14, ap: 3, dmg: 4, fer: 3, d100: [56, 85] },
  Hard: { skill: 80, dt: 22, tough: 2, init: 16, ap: 4, dmg: 5, fer: 4, d100: [86, 95] },
  Severe: { skill: 95, dt: 30, tough: 3, init: 18, ap: 5, dmg: 6, fer: 5, d100: [96, 99] },
  Extreme: { skill: 100, dt: 40, tough: 5, init: 20, ap: 6, dmg: 8, fer: 6, d100: [100, 100] }
};
/* p.436: "An enemy will usually have one or two skills at their Average Skill
 * value as indicated by their Difficulty; three or four more at their Average
 * Skill value -10; and everything else at -30. In most cases, the minimum
 * skill for any enemy at any Difficulty is 35." This macro used to invent its
 * own bands (-15 for the secondary skills, a floor of 20, and Dodge at 90% of
 * the primary), which made every generated enemy weaker than the book's own
 * worked example of the same Difficulty. */
const ENEMY_FLOOR = 35;
const secondarySkill = (avg) => Math.max(ENEMY_FLOOR, avg - 10);
const restSkill = (avg) => Math.max(ENEMY_FLOOR, avg - 30);
/* A fighter's weapon skill is a real Combat skill, chosen to match the weapon
 * the tier line hands them. */
const TIER_WEAPON_SKILL = "Melee: Medium";
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const content =
  '<div style="font-size:13px">' +
  '<label style="display:block">Culture: <select name="culture" style="width:100%">' +
  '<option value="">Random</option>' +
  CULTURES.map((c) => '<option value="' + c + '">' + c + "</option>").join("") +
  "</select></label>" +
  '<label style="display:block">Name style: <select name="sex" style="width:100%">' +
  '<option value="m">Masculine</option><option value="f">Feminine</option><option value="any" selected>Either</option>' +
  "</select></label>" +
  '<label style="display:block">Threat: <select name="tier" style="width:100%">' +
  '<option value="none" selected>Not a fighter, no stats</option>' +
  '<option value="roll">Roll it (d100, Ch.18 Enemy Difficulty table)</option>' +
  Object.keys(TIERS).map((k) => '<option value="' + k + '">' + k + " (skills " + TIERS[k].skill +
    ", Ferocity " + TIERS[k].fer + ")</option>").join("") +
  "</select></label>" +
  '<label style="display:block">Trade: <select name="trade" style="width:100%">' +
  '<option value="">Roll d100</option>' +
  '<option value="skip">No trade, traits only</option>' +
  TBE_TRADES.map((t) => '<option value="' + t.range[0] + '">' + t.name + "</option>").join("") +
  "</select></label>" +
  '<label style="display:block">Standing in that trade: <select name="standing" style="width:100%">' +
  Object.keys(TBE.TRADE_STANDING).map((k) => '<option value="' + k + '"' + (k === "Ordinary" ? " selected" : "") + ">" + k + "</option>").join("") +
  "</select></label>" +
  '<label style="display:block">Role or note (optional): <input type="text" name="role" placeholder="gate guard, ferryman, the reeve’s cousin" style="width:100%"></label>' +
  '<label style="display:block;margin-top:4px"><input type="checkbox" name="actor"> Also create an actor for them</label>' +
  '<label style="display:block"><input type="checkbox" name="list" checked> Add to the Empires List (first empty slot)</label>' +
  "</div>";

const data = await TBE.prompt("Who is this?", content, "Roll them up");
if (data) {
  const culture = data.culture || pick(CULTURES);
  const set = TBE_NAMES[culture];
  const sex = data.sex === "any" ? pick(["m", "f"]) : data.sex;
  const name = pick(set[sex] || set.m) + " " + pick(set.s);

  const rolls = [];

  /* The Traits table is a d100 table and its Special Reaction Trigger reads
   * "even roll = positive reaction, odd roll = negative" -- so it has to be
   * rolled, not sampled. The card printed that instruction while nothing ever
   * produced a roll to read the parity of. (Until v0.22.0 only 21 of the 50
   * rows shipped at all; see parse_npc_traits.py.) */
  const traitRoll = await TBE.d100();
  rolls.push(traitRoll);
  const rowFor = (n) => TBE_TRAITS.find((r) => n >= r.lo && n <= r.hi) || TBE_TRAITS[0];
  const t = rowFor(traitRoll.total);
  const positive = traitRoll.total % 2 === 0;
  /* Two draws from the same table hit the same row often enough to print
   * "Determined, determined" on the card. Draw again until it says something. */
  let t2 = pick(TBE_TRAITS);
  for (let n = 0; n < 8 && t2.personality === t.personality; n++) t2 = pick(TBE_TRAITS);
  /* The Difficulty table is a d100 table, so it can simply be rolled. */
  let tierName = data.tier;
  if (data.tier === "roll") {
    const dRoll = await TBE.d100();
    rolls.push(dRoll);
    tierName = Object.keys(TIERS).find((k) => dRoll.total >= TIERS[k].d100[0] && dRoll.total <= TIERS[k].d100[1]) || "Medium";
  }
  const tier = TIERS[tierName] || null;
  const role = (data.role || "").trim();

  /* The trade layer. A fighter's numbers come from the Ch.18 tier instead, so
   * for them the trade supplies identity only -- kit, local knowledge, stake --
   * and never a second set of skill values competing with the tier's. */
  let build = null;
  if (data.trade !== "skip") {
    const tradeRoll = data.trade ? TBE.num(data.trade, 0) : null;
    build = await TBE.buildTownsfolk({
      trades: TBE_TRADES,
      abilityScores: TBE_CHARGEN.abilityScores || [],
      talents: typeof TBE_TALENTS !== "undefined" ? TBE_TALENTS : [],
      standing: data.standing || "Ordinary",
      tradeRoll
    });
    rolls.push(...(build.rolls || []));
  }
  const trade = build ? build.trade : null;

  let body =
    '<div style="font-size:17px;font-weight:bold">' + name + "</div>" +
    '<div style="font-size:11px;opacity:.8">' + culture +
      (trade ? " &middot; " + trade.name : "") + (role ? " &middot; " + role : "") +
      (build && !tier ? " &middot; " + build.standing.toLowerCase() : "") + "</div>" +
    '<table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:6px">' +
    "<tr><td width='34%'><b>Appearance</b></td><td>" + t.appearance + "</td></tr>" +
    "<tr><td><b>Playable aspect</b></td><td>" + t.aspect + "</td></tr>" +
    "<tr><td><b>Personality</b></td><td>" + t.personality + ", " + t2.personality.toLowerCase() +
      (build && build.descriptors.length ? " &middot; " + build.descriptors.join(", ") : "") + "</td></tr>" +
    "<tr><td><b>Agenda</b></td><td>" + t.agenda + "</td></tr>" +
    "<tr><td><b>Reaction trigger</b></td><td>" + t.trigger + " &mdash; rolled <b>" + TBE.face(traitRoll.total) + "</b>, " +
      (positive ? "<b>positive</b>" : "<b>negative</b>") + " reaction</td></tr>" +
    (trade ? "<tr><td><b>Carries</b></td><td>" + trade.kit + "</td></tr>" +
      "<tr><td><b>Knows</b></td><td>" + trade.knows + "</td></tr>" +
      "<tr><td><b>Would risk it for</b></td><td>" + trade.stake + "</td></tr>" : "") +
    "</table>";

  if (build && !tier) {
    body +=
      '<div style="border-top:1px solid #7a6a4f;margin-top:6px;padding-top:4px;font-size:12px">' +
      /* The +5s an Ability Score sprays across six skills are real, and they are
       * on the actor, but a card listing thirteen entries most of which read 25
       * is the shallow-glance problem again. Lead with what they are good at. */
      "<b>Skills</b> " + build.notable.slice(0, 8).map((s) => s.name + " " + s.value + TBE.expertiseTag(s.expertise)).join(" &middot; ") +
      (build.notable.length > 8 ? ' <span style="opacity:.7">and ' + (build.notable.length - 8) + " more just above the baseline</span>" : "") +
      '<div style="opacity:.85;margin-top:3px"><b>Ability Scores</b> ' + build.abilityPicks.join(" and ") +
      (build.abilityTalents.length ? " &middot; <b>Talents</b> " + build.abilityTalents.join(", ") : "") + "</div>" +
      '<div style="opacity:.7;font-size:11px;margin-top:2px">Everything not listed sits at the starting 20.</div></div>';
  }

  if (tier) {
    body +=
      '<div style="border-top:1px solid #7a6a4f;margin-top:6px;padding-top:4px;font-size:12px">' +
      "<b>" + tierName + "</b> &middot; one or two skills at " + tier.skill +
      ", three or four at " + secondarySkill(tier.skill) + ", the rest at " + restSkill(tier.skill) +
      " <span style='font-size:11px;opacity:.8'>(p.436, floor " + ENEMY_FLOOR + ")</span>" +
      " &middot; Init " + tier.init + " &middot; Toughness +" + tier.tough + " &middot; DT " + tier.dt +
      " &middot; <b>Ferocity " + tier.fer + "</b>" + (tier.fer >= 5 ? " (cannot be compelled to surrender, p.164)" : "") +
      "<br>" + TIER_WEAPON_SKILL + ", Dmg " + tier.dmg + " (CL3, CS3, Dis4, T5) &middot; armour " + tier.ap + " AP on all locations" +
      (trade ? '<div style="opacity:.7;font-size:11px;margin-top:2px">Trade shown for identity only — the Ch.18 tier owns their numbers.</div>' : "") +
      "</div>";
  }

  body += '<div style="font-size:11px;opacity:.75;margin-top:4px">Trait row ' + t.lo + "-" + (t.hi === 100 ? "00" : t.hi) +
    " of the d100 NPC Traits table. Play the agenda, not the stat line.</div>";

  if (data.actor === "on" && game.user.isGM) {
    try {
      let folder = game.folders.find((f) => f.name === "TBE NPCs" && f.type === "Actor");
      if (!folder) folder = await Folder.create({ name: "TBE NPCs", type: "Actor" });
      const dt = tier ? tier.dt : 20;
      const armourGrid = TBE.LOCATIONS.reduce((o, loc) => {
        o[loc] = { natural: tier ? tier.ap : 0, worn: 0 };
        return o;
      }, {});
      const actor = await Actor.create({
        name, type: "creature", folder: folder.id,
        system: {
          deathThreshold: { value: dt, max: dt },
          resolve: { value: 10, max: 10 },
          toughness: tier ? tier.tough : 0,
          difficulty: tierName === "none" ? "Medium" : tierName,
          initiative: tier ? String(tier.init) : "",
          /* Ch.18's Typical Ferocity for the Difficulty. The field has always
             existed on the creature sheet and was always left blank, so every
             generated enemy had no morale rules at all. */
          ferocity: tier ? String(tier.fer) : "",
          armour: armourGrid,
          biography: (role ? "<p><b>Role:</b> " + role + "</p>" : "") + "<p><b>Culture:</b> " + culture + "</p>" +
            (trade ? "<p><b>Trade:</b> " + trade.name + (build && !tier ? " (" + build.standing.toLowerCase() + ")" : "") +
              "<br><b>Carries:</b> " + trade.kit + "<br><b>Knows:</b> " + trade.knows +
              "<br><b>Would risk it for:</b> " + trade.stake + "</p>" : "") +
            (build ? "<p><b>Ability Scores:</b> " + build.abilityLines.join("; ") + "</p>" : "") +
            "<p><b>Agenda:</b> " + t.agenda + "<br><b>Trigger:</b> " + t.trigger + "<br><b>Aspect:</b> " + t.aspect + "</p>"
        }
      });

      /* Skills. A townsperson carries the ones their trade and Ability Scores
       * actually raised; a Ch.18 fighter carries the tier's spread. Either way
       * the category and the fighting flag come from the catalogue. */
      let items;
      if (tier) {
        /* p.436's own worked example: "A Challenging bandit's main skills are
           Melee: Medium Weapons and Dodge, both at 65. He has Endurance,
           Athletics, and Missile at 55, and every other skill is at 35." That
           is the shape built here -- two primaries at the Average, three
           secondaries at -10, the rest at -30 with a floor of 35. */
        const second = secondarySkill(tier.skill);
        const rest = restSkill(tier.skill);
        items = TBE.skillItemsFrom([
          { name: TIER_WEAPON_SKILL, value: tier.skill },
          { name: "Dodge", value: tier.skill },
          { name: "Endurance", value: second }, { name: "Athletics", value: second },
          { name: "Missile", value: second },
          { name: "Willpower", value: rest }, { name: "Perception", value: rest },
          { name: "Insight", value: rest }
        ]);
      } else {
        items = TBE.skillItemsFrom(build ? build.notable : [{ name: "Dodge", value: 25 }, { name: "Willpower", value: 25 }]);
      }
      await actor.createEmbeddedDocuments("Item", items);

      /* The Talents the Ability Scores granted, with the catalogue's own text
       * where we have it, so the sheet says what they do. */
      if (build && build.abilityTalents.length) {
        const talentItems = build.abilityTalents.map((tn) => {
          const cat = TBE.talentNamed(typeof TBE_TALENTS !== "undefined" ? TBE_TALENTS : [], tn);
          return TBE.talentItem(cat || { name: tn, rank: "once" }, "");
        });
        await actor.createEmbeddedDocuments("Item", talentItems);
      }

      if (tier) {
        await actor.createEmbeddedDocuments("Item", [{
          name: "Weapon", type: "weapon",
          system: { dmg: tier.dmg, nl: false, cl: 3, cs: 3, dis: 4, t: 5, skillName: TIER_WEAPON_SKILL, ranged: false }
        }]);
      }
      body += '<div style="margin-top:4px">Actor created in <b>TBE NPCs</b>' + (tier ? ", armed and ready to target" : "") + ".</div>";
    } catch (err) {
      console.error("TBE | NPC actor failed", err);
      body += "<div><i>Could not create the actor, see console (F12).</i></div>";
    }
  }

  if (data.list === "on") {
    const table = game.tables.getName("TBE: Empires List");
    if (table) {
      const slot = table.results.contents.find((r) => (TBE.resultText(r) || "").toLowerCase().indexOf("empty") > -1);
      if (slot) {
        const label = name + (trade ? ", " + trade.name.toLowerCase() : role ? ", " + role : "") + " (" + t.agenda.toLowerCase() + ")";
        try {
          await slot.update({ text: label, description: label, name: label.slice(0, 48) });
          body += "<div>Added to the Empires List.</div>";
        } catch (err) {
          body += "<div><i>Add them to the Empires List by hand.</i></div>";
        }
      } else {
        body += "<div><i>Empires List is full, no empty slot.</i></div>";
      }
    }
  }

  await TBE.say(TBE.card("Who is this?", body), rolls);
}
