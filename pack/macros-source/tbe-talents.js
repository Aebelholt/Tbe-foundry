/* TBE: Talents — browse the book's Talent list and add them to a character.
 * Talents are real Items on the actor (system.category/requirements/ranks/
 * specialization), not a line of prose, because they keep mattering after
 * character creation: Enhanced Defense, Armor Training and Solo Constitution
 * change rolls every session. The list here is the full Ch.4 catalogue, baked
 * into the macro so nothing extra has to be installed first. */

const me = TBE.me();
if (!me) {
  ui.notifications?.warn("TBE: select the character's token first.");
} else {
  const owned = (me.items ?? []).filter((i) => i.type === "talent");
  const ownedNames = new Set(owned.map((i) => i.name.toLowerCase()));
  const race = me.system?.race || "";

  /* Non-Human Talents are exclusive: each belongs to one race, and the book is
     explicit that only that race may ever acquire it. Rather than hide them,
     mark the ones this character cannot take, so the restriction is visible. */
  const raceRec = (TBE_CHARGEN.races || []).find((r) => r.name === race) || null;
  const myExclusive = new Set((raceRec?.exclusiveTalents ?? []).map((t) => t.toLowerCase()));
  const allExclusive = new Set(
    (TBE_CHARGEN.races || []).flatMap((r) => r.exclusiveTalents).map((t) => t.toLowerCase())
  );
  const forbidden = (t) =>
    allExclusive.has(t.name.toLowerCase()) && !myExclusive.has(t.name.toLowerCase());

  /* Grouped under category headings rather than filtered by a dropdown: a
     dialog's inline script is unreliable across Foundry versions, and the whole
     catalogue is only ~150 rows in a scroll box. */
  const cats = [...new Set(TBE_TALENTS.map((t) => t.category))];
  const rows = cats.map((cat) => {
    const inCat = TBE_TALENTS.map((t, i) => ({ t, i })).filter((x) => x.t.category === cat);
    return '<div style="font-weight:bold;margin-top:6px;border-bottom:1px solid #7a6a4f">' + cat +
      " <span style='font-weight:normal;font-size:11px;opacity:.7'>(" + inCat.length + ")</span></div>" +
      inCat.map(({ t, i }) => {
        const has = ownedNames.has(t.name.toLowerCase());
        const bad = forbidden(t);
        const locked = bad || (has && t.rank === "once");
        const note = bad ? "exclusive to another race"
          : has ? "already taken" + (t.rank !== "once" ? ", repeatable" : "")
          : (t.requires ? "requires " + t.requires : t.rank === "once" ? "" : "repeatable: " + t.rank);
        return '<label style="display:block;opacity:' + (locked ? ".45" : "1") + '">' +
          '<input type="checkbox" name="t_' + i + '"' + (locked ? " disabled" : "") + "> " +
          (t.sub ? "&#8627; " : "") + "<b>" + t.name + "</b>" +
          (note ? ' <span style="font-size:11px;opacity:.75">' + note + "</span>" : "") +
          "</label>";
      }).join("");
  }).join("");

  const content =
    '<div style="font-size:13px">' +
    "<div><b>" + me.name + "</b>" + (race ? " &middot; " + race : "") +
    " &middot; " + owned.length + " Talent(s) already taken</div>" +
    '<div style="margin:6px 0;max-height:340px;overflow:auto;border:1px solid #7a6a4f;border-radius:4px;padding:4px">' +
    rows + "</div>" +
    '<label style="display:block">Applies to (for a Talent that asks you to pick a weapon, skill or location): ' +
    '<input type="text" name="spec" placeholder="shortsword, Melee: Medium, Head..." style="width:100%"></label>' +
    '<div style="font-size:11px;opacity:.75;margin-top:4px">Greyed-out rows are already taken (and not repeatable), or belong to another race.</div>' +
    "</div>";

  const data = await TBE.prompt("Talents", content, "Add");
  if (data) {
    /* Re-check the race restriction here rather than trusting the disabled
       attribute: a disabled checkbox is a UI affordance, not a guarantee. */
    const requested = TBE_TALENTS.filter((t, i) => data["t_" + i] === "on");
    const refused = requested.filter(forbidden);
    const picked = requested.filter((t) => !forbidden(t));
    if (!picked.length) {
      ui.notifications?.info(refused.length
        ? "TBE: those Talents are exclusive to another race."
        : "TBE: no Talents selected.");
    } else {
      const spec = (data.spec || "").trim();
      const payload = [];
      const bumped = [];
      for (const t of picked) {
        /* A repeatable Talent already on the sheet gains a rank instead of
           becoming a duplicate row. */
        const existing = owned.find((i) => i.name.toLowerCase() === t.name.toLowerCase());
        if (existing && t.rank !== "once") {
          await existing.update({ "system.ranks": TBE.num(existing.system?.ranks, 1) + 1 });
          bumped.push(t.name + " (now &times;" + (TBE.num(existing.system?.ranks, 1) + 1) + ")");
          continue;
        }
        payload.push({
          name: t.name,
          type: "talent",
          img: "icons/svg/upgrade.svg",
          system: {
            category: t.category, requirements: t.requires || "",
            ranks: 1, maxRanks: t.rank, specialization: spec,
            sub: !!t.sub, description: "<p>" + t.desc + "</p>"
          }
        });
      }
      if (payload.length) await me.createEmbeddedDocuments("Item", payload);

      const body = "<div><b>" + me.name + "</b></div>" +
        (payload.length ? "<div>Added: " + payload.map((p) => p.name).join(", ") + "</div>" : "") +
        (bumped.length ? "<div>Ranked up: " + bumped.join(", ") + "</div>" : "") +
        (refused.length ? '<div style="color:#8b1a1a">Refused (exclusive to another race): ' +
          refused.map((t) => t.name).join(", ") + "</div>" : "") +
        (spec ? '<div style="font-size:11px;opacity:.8">Applies to: ' + spec + "</div>" : "");
      await TBE.say(TBE.card("Talents", body));
    }
  }
}
