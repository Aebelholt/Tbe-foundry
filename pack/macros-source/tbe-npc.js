/* TBE: NPC — answers "WHO IS THIS?" in one click.
 * Name from the culture tables, traits from the NPC Traits table, stats from the
 * Enemy Difficulty framework (Ch.18). Optionally makes the actor and lists the thread. */

const CULTURES = Object.keys(TBE_NAMES);
const TIERS = {
  Easy: { skill: 35, dt: 10, tough: 0, init: 12, ap: 1, dmg: 2 },
  Medium: { skill: 50, dt: 13, tough: 0, init: 14, ap: 2, dmg: 3 },
  Challenging: { skill: 65, dt: 16, tough: 1, init: 14, ap: 3, dmg: 4 },
  Hard: { skill: 80, dt: 22, tough: 2, init: 16, ap: 4, dmg: 5 },
  Severe: { skill: 95, dt: 30, tough: 3, init: 18, ap: 5, dmg: 6 },
  Extreme: { skill: 100, dt: 40, tough: 5, init: 20, ap: 6, dmg: 8 }
};
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
  Object.keys(TIERS).map((k) => '<option value="' + k + '">' + k + " (skills " + TIERS[k].skill + ")</option>").join("") +
  "</select></label>" +
  '<label style="display:block">Role or profession (optional): <input type="text" name="role" placeholder="herbalist, gate guard, ferryman" style="width:100%"></label>' +
  '<label style="display:block;margin-top:4px"><input type="checkbox" name="actor"> Also create an actor for them</label>' +
  '<label style="display:block"><input type="checkbox" name="list" checked> Add to the Empires List (first empty slot)</label>' +
  "</div>";

const data = await TBE.prompt("Who is this?", content, "Roll them up");
if (data) {
  const culture = data.culture || pick(CULTURES);
  const set = TBE_NAMES[culture];
  const sex = data.sex === "any" ? pick(["m", "f"]) : data.sex;
  const first = pick(set[sex] || set.m);
  const surname = pick(set.s);
  const name = first + " " + surname;

  const t = pick(TBE_TRAITS);
  const t2 = pick(TBE_TRAITS);
  const tier = TIERS[data.tier] || null;
  const role = (data.role || "").trim();

  let body =
    '<div style="font-size:17px;font-weight:bold">' + name + "</div>" +
    '<div style="font-size:11px;opacity:.8">' + culture + (role ? " &middot; " + role : "") + "</div>" +
    '<table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:6px">' +
    "<tr><td width='34%'><b>Appearance</b></td><td>" + t.appearance + "</td></tr>" +
    "<tr><td><b>Playable aspect</b></td><td>" + t.aspect + "</td></tr>" +
    "<tr><td><b>Personality</b></td><td>" + t.personality + ", " + t2.personality.toLowerCase() + "</td></tr>" +
    "<tr><td><b>Agenda</b></td><td>" + t.agenda + "</td></tr>" +
    "<tr><td><b>Reaction trigger</b></td><td>" + t.trigger + "</td></tr>" +
    "</table>" +
    '<div style="font-size:11px;opacity:.75;margin-top:4px">Even roll on the trigger reads positive, odd reads negative. Play the agenda, not the stat line.</div>';

  if (tier) {
    body +=
      '<div style="border-top:1px solid #7a6a4f;margin-top:6px;padding-top:4px">' +
      "<b>" + data.tier + "</b> &middot; combat skills " + tier.skill + " &middot; other skills " + Math.max(20, tier.skill - 15) +
      " &middot; Init " + tier.init + " &middot; Toughness +" + tier.tough + " &middot; DT " + tier.dt +
      "<br>Weapon: Dmg " + tier.dmg + " (CL3, CS3, Dis4, T5) &middot; armour " + tier.ap + " AP on all locations</div>";
  }

  const rolls = [];

  if (data.actor === "on" && game.user.isGM) {
    try {
      const mkSkill = (sname, value, fighting) => ({
        name: sname, type: "skill",
        system: { group: "Adventuring", value: TBE.num(value, 0), fighting: !!fighting }
      });
      let folder = game.folders.find((f) => f.name === "TBE NPCs" && f.type === "Actor");
      if (!folder) folder = await Folder.create({ name: "TBE NPCs", type: "Actor" });
      const s = tier ? tier.skill : 40;
      const soft = Math.max(20, s - 15);
      const dt = tier ? tier.dt : 10;
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
          difficulty: data.tier === "none" ? "Medium" : data.tier,
          initiative: tier ? String(tier.init) : "",
          armour: armourGrid,
          biography: (role ? "<p><b>Role:</b> " + role + "</p>" : "") + "<p><b>Culture:</b> " + culture + "</p>" +
            "<p><b>Agenda:</b> " + t.agenda + "<br><b>Trigger:</b> " + t.trigger + "<br><b>Aspect:</b> " + t.aspect + "</p>"
        }
      });
      const items = [mkSkill("Dodge", tier ? Math.round(s * 0.9) : 35, true), mkSkill("Willpower", soft),
        mkSkill("Perception", soft), mkSkill("Endurance", soft), mkSkill("Insight", soft)];
      if (tier) items.push(mkSkill("Weapon", s, true));
      await actor.createEmbeddedDocuments("Item", items);
      if (tier) {
        await actor.createEmbeddedDocuments("Item", [{
          name: "Weapon", type: "weapon",
          system: { dmg: tier.dmg, nl: false, cl: 3, cs: 3, dis: 4, t: 5, skillName: "Weapon", ranged: false }
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
        const label = name + (role ? ", " + role : "") + " (" + t.agenda.toLowerCase() + ")";
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
