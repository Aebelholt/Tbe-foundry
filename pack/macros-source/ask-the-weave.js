/* TBE: Ask the Weave — Yes/No oracle with odds, doubles trigger a Random Event. */
const CHART = {
  Certain: [25, 90, 98],
  Likely: [17, 70, 93],
  "50/50": [10, 50, 90],
  Unlikely: [7, 30, 83],
  Impossible: [2, 10, 75]
};

const content =
  '<div style="font-size:13px">' +
  '<label style="display:block;margin:2px 0">Question: <input type="text" name="q" placeholder="Is the chest trapped?" style="width:100%"></label>' +
  '<label style="display:block;margin:2px 0">Odds: <select name="odds" style="width:100%">' +
  Object.keys(CHART).map((k) => '<option value="' + k + '"' + (k === "50/50" ? " selected" : "") + ">" + k + "</option>").join("") +
  "</select></label>" +
  '<div style="font-size:11px;opacity:.75;margin-top:4px">Ask questions that assume a complication.</div>' +
  "</div>";

const data = await TBE.prompt("Ask the Weave", content, "Ask");
if (data) {
  const odds = CHART[data.odds] ? data.odds : "50/50";
  const [ey, y, n] = CHART[odds];
  const roll = await TBE.d100();
  const r = roll.total;
  let answer, colour;
  if (r <= ey) { answer = "EXTREME YES"; colour = "#1f7a1f"; }
  else if (r <= y) { answer = "YES"; colour = "#2f6f2f"; }
  else if (r <= n) { answer = "NO"; colour = "#6b2b2b"; }
  else { answer = "EXTREME NO"; colour = "#8b1a1a"; }

  let body =
    (data.q ? '<div style="font-style:italic;margin-bottom:2px">' + data.q + "</div>" : "") +
    '<div style="font-size:11px;opacity:.8">Odds: ' + odds + "</div>" +
    '<div style="font-size:22px;line-height:1.1;margin:2px 0">' + TBE.face(r) + "</div>" +
    '<div style="font-weight:bold;color:' + colour + '">' + answer + "</div>";

  if (TBE.isDoubles(r)) body += TBE.eventHtml(await TBE.event());

  await TBE.say(TBE.card("Ask the Weave", body), [roll]);
}
