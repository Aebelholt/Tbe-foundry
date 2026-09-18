/* TBE: Subverted Scene — roll the start of a new scene against your expectations. */
const content =
  '<div style="font-size:13px">' +
  '<label style="display:block">Your expectation for the scene:<br><textarea name="exp" rows="3" style="width:100%" placeholder="I ride to the Death Knight\'s castle."></textarea></label>' +
  "</div>";

const data = await TBE.prompt("Subverted Scene", content, "Roll scene start");
if (data) {
  const roll = await TBE.d100();
  const r = roll.total;
  let head, note, extra = "";

  if (r <= 50) {
    head = "EXPECTED";
    note = "The scene starts as you expected.";
  } else if (r <= 63) {
    head = "LESS";
    note = "The scene starts with less than expected. Remove something from your expectations.";
  } else if (r <= 76) {
    head = "MORE";
    note = "The scene starts with more than expected. Fold these two words into your expectations.";
    const w1 = await TBE.drawTable("TBE: Event Randomizers I");
    const w2 = await TBE.drawTable("TBE: Event Randomizers II");
    extra =
      '<div style="margin-top:4px;padding:4px;border:1px dashed #7a6a4f;border-radius:4px;font-size:16px">' +
      "<b>" + (w1?.text || "?") + " &middot; " + (w2?.text || "?") + "</b></div>";
  } else {
    head = "UNEXPECTED";
    note = "Something interrupts the expected start. This Event replaces your expectation.";
    extra = TBE.eventHtml(await TBE.event());
  }

  const body =
    (data.exp ? '<div style="font-style:italic;margin-bottom:2px">' + data.exp + "</div>" : "") +
    '<div style="font-size:22px;line-height:1.1;margin:2px 0">' + TBE.face(r) + "</div>" +
    '<div style="font-weight:bold">' + head + "</div>" +
    '<div style="font-size:12px">' + note + "</div>" +
    extra;

  await TBE.say(TBE.card("Subverted Scene", body), [roll]);
}
