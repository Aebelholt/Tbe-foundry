/* TBE: Skill Roll — standard d100 roll-under, tens die = Success Levels. */
const picker = TBE.skillOptions();
const content =
  '<div style="font-size:13px">' +
  picker +
  TBE.encNote(TBE.me()) +
  '<label style="display:block;margin:2px 0">Skill value: <input type="number" name="skill" value="50" style="width:100%"></label>' +
  '<label style="display:block;margin:2px 0">Modifier: <select name="mod" style="width:100%">' +
  '<option value="40">Trivial +40</option>' +
  '<option value="20">Simple +20</option>' +
  '<option value="10">Easy +10</option>' +
  '<option value="0" selected>Medium +0</option>' +
  '<option value="-10">Challenging -10</option>' +
  '<option value="-20">Hard -20</option>' +
  '<option value="-40">Severe -40</option>' +
  "</select></label>" +
  '<label style="display:block;margin:2px 0">Extra modifier: <input type="number" name="extra" value="0" style="width:100%"></label>' +
  '<label style="display:block;margin:2px 0">Label: <input type="text" name="label" placeholder="Stealth, Melee: Medium..." style="width:100%"></label>' +
  "</div>";

const data = await TBE.prompt("TBE Skill Roll", content, "Roll");
if (data) {
  const pick = TBE.readPick(data.pick);
  const base = pick ? pick.value : TBE.num(data.skill, 50);
  const mod = TBE.num(data.mod, 0) + TBE.num(data.extra, 0);
  const skill = base + mod;
  const label = (data.label || (pick ? pick.name : "") || "Skill").trim();

  const roll = await TBE.d100();
  const res = TBE.resolve(roll.total, skill, pick ? pick.expertise : 0);

  const body =
    '<div style="margin:2px 0"><b>' + label + "</b> " + base +
    (mod ? (mod > 0 ? " +" + mod : " " + mod) : "") +
    " &rarr; target <b>" + skill + "</b></div>" +
    '<div style="font-size:22px;line-height:1.1;margin:4px 0">' + TBE.face(roll.total) + "</div>" +
    '<div style="font-weight:bold;color:' + TBE.colour(res) + '">' + TBE.tag(res) +
    (res.success ? " &mdash; " + res.sl + " SL" : "") + "</div>" +
    (res.notes.length ? '<div style="font-size:11px;opacity:.8">' + res.notes.join(" &middot; ") + "</div>" : "");

  await TBE.say(TBE.card("TBE Skill Roll", body), [roll]);
}
