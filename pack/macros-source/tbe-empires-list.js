/* TBE: Empires List — roll a random thread, NPC, or goal off your list. */
let t = game.tables.getName("TBE: Empires List");
if (!t && game.user.isGM) {
  await TBE.ensureTables();
  t = game.tables.getName("TBE: Empires List");
}

if (!t) {
  ui.notifications?.warn("TBE: the Empires List table is missing. Ask your GM to run TBE: Install Tables.");
} else {
  const out = await t.roll();
  const text = TBE.resultText(out.results?.[0]) || "";
  const empty = !text || text.toLowerCase().indexOf("empty") > -1;
  const body =
    '<div style="font-size:22px;line-height:1.1;margin:2px 0">' + TBE.face(out.roll?.total ?? 0) + "</div>" +
    (empty
      ? "<div><i>Empty slot &mdash; choose the existing element that best fits.</i></div>"
      : "<div><b>" + text + "</b></div>") +
    '<div style="font-size:11px;opacity:.75;margin-top:4px">Edit the list: Roll Tables tab &rarr; TBE: Empires List.</div>';
  await TBE.say(TBE.card("Empires List", body), out.roll ? [out.roll] : []);
}
