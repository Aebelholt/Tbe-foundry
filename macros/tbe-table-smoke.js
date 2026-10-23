/* TBE: Table Smoke Test. The system owns the probe; this macro owns its one
 * private report. No shared card actions or writes to existing game actors. */
if (!game.user?.isGM) {
  ui.notifications?.warn("TBE: only a GM can run the table smoke test.");
} else if (!game.thebrokenempires?.smoke?.run) {
  ui.notifications?.warn("TBE: Table Smoke Test needs the installed system's smoke-test helper.");
} else {
  const report = await game.thebrokenempires.smoke.run({ filePrompt: TBE.prompt });
  if (report.refused) {
    ui.notifications?.warn("TBE: " + report.refused);
  } else {
    const result = report.cancelled ? "CANCELLED" : report.ok ? "PASS" : "FAIL";
    const rows = report.rows.map((r) => '<tr><td style="vertical-align:top;padding:3px 6px 3px 0"><b>' + TBE.esc(r.status) +
      '</b></td><td style="padding:3px 0"><b>' + TBE.esc(r.name) + '</b><br><span style="font-size:11px">' +
      TBE.esc(r.detail) + "</span></td></tr>").join("");
    await TBE.say(TBE.card("Table Smoke Test: " + result,
      "<p>Foundry <b>" + TBE.esc(report.version) + "</b>; system <b>" + TBE.esc(report.system) + "</b>.</p>" +
      '<table style="width:100%"><tbody>' + rows + "</tbody></table>" +
      '<p style="font-size:11px">This checks compatibility on this client. A played session with a GM and players is still needed. Share this card when reporting a problem.</p>'),
      [], { mode: TBE.MODES.SELF });
  }
}
