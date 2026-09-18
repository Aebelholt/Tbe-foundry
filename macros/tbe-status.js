/* TBE: Status — everything about the character and the campaign on one card. */

const me = TBE.me();
if (!me) {
  ui.notifications?.warn("TBE: select your token first.");
} else {
  const dtField = me.system?.deathThreshold ?? {};
  const resolve = me.system?.resolve ?? {};
  const w = TBE.wounds(me);
  const s = TBE.supply(me);
  await TBE.syncStatuses(me);
  const total = TBE.totalWp(w);
  const dt = TBE.num(dtField.max, 0);
  const ll = TBE.num(me.system?.lethalityLevel, 0);
  const fatigue = TBE.num(me.system?.fatigue, 0);
  const shockNow = TBE.shock(me);

  const meter = (val, max, colour) => {
    const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((val / max) * 100))) : 0;
    return '<div style="background:rgba(0,0,0,.25);border:1px solid #7a6a4f;border-radius:3px;height:10px;overflow:hidden;margin:2px 0">' +
      '<div style="width:' + pct + '%;height:100%;background:' + colour + '"></div></div>';
  };

  const flags = [];
  if (TBE.hasStatus(me, "tbe-prone")) flags.push("Prone");
  if (TBE.hasStatus(me, "tbe-unconscious")) flags.push("Unconscious");
  if (TBE.hasStatus(me, "dead")) flags.push("Dead");
  if (shockNow) flags.push("Shock");
  if (Object.values(w).some((x) => x.septic)) flags.push("SEPTIC");
  else if (Object.values(w).some((x) => x.inf)) flags.push("Infected wound");
  if (dt && !!me.system?.dying) flags.push("DYING (lethal WP over Lethality Level " + ll + ")");
  if (fatigue > 0) flags.push("Fatigued " + fatigue);

  let body =
    '<div style="font-size:15px;font-weight:bold">' + me.name + "</div>" +
    (flags.length ? '<div style="color:#8b1a1a;font-weight:bold;font-size:12px">' + flags.join(" &middot; ") + "</div>" : "") +
    '<div style="margin-top:4px">Death Threshold: <b>' + (dt - total) + " / " + dt + "</b> (lethal WP " + total + ", Lethality Level " + ll + ")</div>" +
    meter(dt - total, dt, "#8b1a1a") +
    "<div>Resolve: <b>" + TBE.num(resolve.value, 0) + " / " + TBE.num(resolve.max, 0) + "</b></div>" +
    meter(TBE.num(resolve.value, 0), TBE.num(resolve.max, 1), "#3b6ea5") +
    (fatigue > 0 ? "<div>Fatigue: <b>" + fatigue + "</b> marked against the Resolve track</div>" : "");

  const activeStatuses = TBE.STATUSES.filter((s) => TBE.hasStatus(me, s.id));
  if (activeStatuses.length) {
    body += '<div style="margin-top:4px;font-size:12px">Active: ' +
      activeStatuses.map((s) => s.name).join(", ") + "</div>";
  }

  body +=
    '<div style="margin-top:6px;font-weight:bold">Wounds</div>' + TBE.woundTable(w) +
    '<div style="margin-top:6px;font-weight:bold">Supply</div>' +
    "<div>Gear " + (s.gear ? "d" + s.gear : "<b>out</b>") + " &middot; Ammo " + (s.ammo ? "d" + s.ammo : "<b>out</b>") +
    " &middot; Medical " + (s.medical ? "d" + s.medical : "<b>out</b>") + " &middot; Rations " + (s.rations ? "d" + s.rations : "<b>out</b>") + "</div>";

  /* Everything still running. This used to read the "TBE Clocks" journal and
     nothing else, so an open Extended Roll, Chase, Ritual, Social Encounter or
     Summoning was reported as "Clocks: none running" -- the only place in the
     pack where a player could see the disagreement between the two stores
     (fixed v0.28.0, with TBE: Clocks retired into a migrator). */
  const running = TBE.openTrackers();
  body += '<div style="margin-top:6px;font-weight:bold">Running</div>';
  body += running.length
    ? running.map((t) => "<div>" + TBE.trackerLine(t) + "</div>").join("")
    : "<div><i>Nothing running.</i></div>";

  /* Lingering Weave effects (Ch.14 p.302-303), which expire at the next
     sunrise or sunset and are otherwise invisible until they bite. */
  const weave = TBE.weaveState(me);
  if (weave.scars.length || weave.snag) {
    body += '<div style="margin-top:6px;font-weight:bold">The Weave still has hold</div>' +
      weave.scars.map((sc) => "<div>Weave Scar: <b>" + sc.bind + "</b> at &minus;" + sc.amount + "</div>").join("") +
      (weave.snag ? "<div>Reality Snag: +5 on Weave Reaction rolls, and every spell buckles reality (d6)</div>" : "") +
      '<div style="font-size:11px;opacity:.75">Both end at the next sunrise or sunset — a night\'s rest in TBE: Wounds &amp; Recovery clears them.</div>';
  }

  /* Empires List */
  const table = game.tables.getName("TBE: Empires List");
  if (table) {
    const filled = table.results.contents
      .map((r) => TBE.resultText(r))
      .filter((t) => t && t.toLowerCase().indexOf("empty") === -1);
    body += '<div style="margin-top:6px;font-weight:bold">Empires List (' + filled.length + " of 20)</div>" +
      (filled.length ? "<div style='font-size:12px'>" + filled.map((t) => "&bull; " + t).join("<br>") + "</div>"
                     : "<div><i>Nothing tracked yet.</i></div>");
  }

  await TBE.say(TBE.card("Status", body));
}
