/* TBE: Funnel Roster — who is still alive, what it cost them, and who becomes
 * a character.
 *
 * Reads the flags TBE: Funnel wrote rather than keeping its
 * own list, so the roster cannot disagree with the actors. Three jobs:
 *   - show the town's people by player and by status,
 *   - record a death, a flight, or a Scar during the sack,
 *   - convert a survivor into a real character actor once the town is lost.
 *
 * Conversion builds a NEW actor of type "character" rather than mutating the
 * creature's type in place: the two DataModels are not the same shape, and the
 * funnel actor is worth keeping as the record of who they were before. */

const STATUSES = ["alive", "wounded", "fled", "broken", "dead", "converted"];
/* This macro used getFlag("tbe", ...) / setFlag("tbe", ...) for its whole
 * life, and "tbe" is not a scope Foundry accepts: the valid set is "core",
 * "world", the SYSTEM id and installed module ids, and this system's id is
 * "the-broken-empires". setFlag/getFlag throw on anything else, so every call
 * here raised -- meaning TBE: Funnel Roster could not list a single townsfolk,
 * record a death or convert a survivor.
 *
 * Nothing caught it because nothing tests this macro, and because the sibling
 * that CREATES these actors passes a flags object to Actor.create, which does
 * not validate at all. So the half that used the documented API was the half
 * that failed, and the half that wrote the path by hand worked fine. That is
 * the whole shape of the flag-namespace defect in one pair of files.
 *
 * TBE.flagOf reads the current namespace and falls back to the legacy one, so
 * townsfolk created before the 0.39.0 migration are still found. */
const funnelActors = () => game.actors.filter((a) => TBE.flagOf(a, "funnel"));

const all = funnelActors();
if (!all.length) {
  ui.notifications?.warn("TBE: no funnel townsfolk yet — run TBE: Funnel first.");
} else {
  const byOwner = {};
  for (const a of all) {
    const f = TBE.flagOf(a, "funnel");
    (byOwner[f.owner] = byOwner[f.owner] || []).push({ actor: a, f });
  }

  const summary = Object.keys(byOwner).sort().map((owner) => {
    const rows = byOwner[owner].map((r) => {
      const dead = r.f.status === "dead";
      const gone = dead || r.f.status === "fled" || r.f.status === "converted";
      return '<tr style="' + (gone ? "opacity:.55" : "") + '">' +
        "<td>" + (dead ? "<s>" + r.actor.name + "</s>" : r.actor.name) + "</td>" +
        '<td style="font-size:11px">' + r.f.trade + "</td>" +
        '<td style="font-size:11px">' + r.f.status + "</td>" +
        '<td style="font-size:11px">' + ((r.f.scars || []).map((s) => s.name).join(", ") || "&mdash;") + "</td>" +
        "</tr>";
    }).join("");
    return "<div style='margin-top:6px'><b>" + owner + "</b>" +
      "<table style='width:100%;border-collapse:collapse;font-size:12px'>" +
      "<tr style='opacity:.7;font-size:11px'><td>Name</td><td>Trade</td><td>Status</td><td>Scars</td></tr>" +
      rows + "</table></div>";
  }).join("");

  const living = all.filter((a) => ["alive", "wounded"].indexOf(TBE.flagOf(a, "funnel").status) > -1);
  const actorOpts = (list) => list.map((a) => '<option value="' + a.id + '">' + a.name +
    " (" + TBE.flagOf(a, "funnel").trade + ")</option>").join("");

  const content =
    '<div style="font-size:13px">' + summary +
    '<div style="border-top:1px solid #7a6a4f;margin-top:8px;padding-top:6px"><b>Record what just happened</b></div>' +
    '<label style="display:block">Townsperson: <select name="who" style="width:100%">' +
    '<option value="">— nobody, just looking —</option>' + actorOpts(all) + "</select></label>" +
    '<label style="display:inline-block;width:49%">Status: <select name="status" style="width:100%">' +
    '<option value="">unchanged</option>' + STATUSES.map((s) => '<option value="' + s + '">' + s + "</option>").join("") +
    "</select></label>" +
    '<label style="display:inline-block;width:49%">Scar: <select name="scar" style="width:100%">' +
    '<option value="">none</option>' + TBE_FUNNEL.scars.map((s) => '<option value="' + s.name + '">' + s.name + "</option>").join("") +
    "</select></label>" +
    '<div style="border-top:1px solid #7a6a4f;margin-top:8px;padding-top:6px"><b>Convert a survivor</b><div style="font-size:11px;opacity:.75">The town is lost. What did the night make of them?</div></div>' +
    '<label style="display:block">Survivor: <select name="conv" style="width:100%">' +
    '<option value="">— not yet —</option>' + actorOpts(living) + "</select></label>" +
    '<label style="display:block">The skill the night taught them (+10): <select name="grew" style="width:100%">' +
    '<option value="">(none)</option>' + TBE.SKILL_ALL.map((s) => '<option value="' + s + '">' + s + "</option>").join("") +
    "</select></label>" +
    '<label style="display:block">Goal: <input type="text" name="goal" placeholder="Find my brother. Kill the officer who burned the mill." style="width:100%"></label>' +
    "</div>";

  const data = await TBE.prompt("The roster", content, "Apply");
  if (data) {
    const notes = [];

    /* Status and Scars: written onto the flag, and the Scar's line onto the
     * biography, because a scar the GM cannot see at the table is not a scar. */
    if (data.who) {
      const a = game.actors.get(data.who);
      const f = TBE.clone(TBE.flagOf(a, "funnel"));
      if (data.status) { f.status = data.status; notes.push(a.name + " is now <b>" + data.status + "</b>."); }
      if (data.scar) {
        const scar = TBE_FUNNEL.scars.find((s) => s.name === data.scar);
        f.scars = (f.scars || []).concat([{ name: scar.name, line: scar.line }]);
        notes.push(a.name + " carries <b>" + scar.name + "</b> — " + scar.line);
        await a.update({ "system.biography": (a.system.biography || "") + "<p><b>Scar — " + scar.name + ":</b> " + scar.line + "</p>" });
      }
      await TBE.write(a, { [TBE.flagPath("funnel")]: f, "flags.tbe.-=funnel": null }, "the roster change");
    }

    /* Conversion. Everything they already are carries over: skills with their
     * real categories, the Ability Score Talents, the descriptors as
     * Personality Traits. The night adds one skill and one Goal. */
    if (data.conv && game.user.isGM) {
      const src = game.actors.get(data.conv);
      const f = TBE.clone(TBE.flagOf(src, "funnel"));
      let folder = game.folders.find((x) => x.name === "TBE Survivors" && x.type === "Actor");
      if (!folder) folder = await Folder.create({ name: "TBE Survivors", type: "Actor" });

      const skills = src.items.filter((i) => i.type === "skill").map((i) => ({
        name: i.name, type: "skill",
        system: {
          group: TBE.skillGroup(i.name) || i.system.group || "Adventuring",
          value: TBE.num(i.system.value, 0) + (data.grew === i.name ? 10 : 0),
          fighting: TBE.isFighting(i.name),
          expertise: TBE.num(i.system.expertise, 0), savvy: !!i.system.savvy
        }
      }));
      /* A skill the night taught them that they had never used before starts
       * from the book's baseline, not from nothing. */
      if (data.grew && !skills.some((s) => s.name === data.grew)) {
        skills.push({
          name: data.grew, type: "skill",
          system: { group: TBE.skillGroup(data.grew) || "Adventuring", value: 30,
            fighting: TBE.isFighting(data.grew), expertise: 0, savvy: false }
        });
      }
      const talents = src.items.filter((i) => i.type === "talent").map((i) => i.toObject());

      const pc = await Actor.create({
        name: src.name, type: "character", folder: folder.id,
        system: {
          deathThreshold: { value: 20, max: 20 },
          resolve: { value: 10, max: 10 },
          size: src.system.size || "Medium",
          personalityTraits: (f.descriptors || []).slice(),
          goals: data.goal ? [{ text: data.goal, kind: "individual", done: false, awarded: false }] : [],
          biography: (src.system.biography || "") +
            "<p><b>Before:</b> " + f.trade + " of " + f.town + ", " + f.standing.toLowerCase() + ".</p>" +
            ((f.scars || []).length ? "<p><b>Carried out of " + f.town + ":</b> " +
              f.scars.map((s) => s.name).join(", ") + "</p>" : "") +
            (f.bond ? "<p><b>Bond:</b> " + f.bond.relation + " — " + f.bond.name + "</p>" : "")
        }
      });
      await pc.createEmbeddedDocuments("Item", skills.concat(talents));
      f.status = "converted";
      await TBE.write(src, { [TBE.flagPath("funnel")]: f, "flags.tbe.-=funnel": null }, "the roster change");
      notes.push("<b>" + pc.name + "</b> is a character now, in <b>TBE Survivors</b>" +
        (data.grew ? ", " + data.grew + " +10" : "") + (data.goal ? ', with the goal "' + data.goal + '"' : "") + ".");
      notes.push('<span style="font-size:11px;opacity:.8">What a real character still owes them (career, Cultural Background, Life Events, the rest of their Goals) is added on their sheet. Create Character builds from scratch, so it would replace what the funnel gave them.</span>');
    }

    await TBE.say(TBE.card("The roster", notes.length ? notes.map((n) => "<div>" + n + "</div>").join("") : "<div>Nothing changed.</div>"));
  }
}
