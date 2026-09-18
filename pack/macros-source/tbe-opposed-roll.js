/* TBE: Opposed Roll — two skills, or a skill vs a Fixed Number. Reports Degree of Success. */
const picker = TBE.skillOptions("pickA", "Side A from sheet");
const content =
  '<div style="font-size:13px">' +
  '<div style="font-weight:bold;margin-top:2px">Side A</div>' +
  picker +
  TBE.encNote(TBE.me()) +
  '<label style="display:block">Name: <input type="text" name="nameA" value="Attacker" style="width:100%"></label>' +
  '<label style="display:block">Skill: <input type="number" name="skillA" value="50" style="width:100%"></label>' +
  '<label style="display:block">Modifier: <input type="number" name="modA" value="0" style="width:100%"></label>' +
  '<hr><div style="font-weight:bold">Side B</div>' +
  '<label style="display:block">Type: <select name="typeB" style="width:100%">' +
  '<option value="skill" selected>Skill roll</option><option value="fixed">Fixed Number (auto SL)</option>' +
  "</select></label>" +
  '<label style="display:block">Name: <input type="text" name="nameB" value="Defender" style="width:100%"></label>' +
  '<label style="display:block">Skill / Fixed Number: <input type="number" name="skillB" value="50" style="width:100%"></label>' +
  '<label style="display:block">Modifier: <input type="number" name="modB" value="0" style="width:100%"></label>' +
  '<label style="display:block;margin-top:4px"><input type="checkbox" name="dos" checked> Degree of Success applies</label>' +
  "</div>";

const data = await TBE.prompt("TBE Opposed Roll", content, "Roll both");
if (data) {
  const pickA = TBE.readPick(data.pickA);
  const nameA = (data.nameA || (pickA ? pickA.name : "") || "Side A").trim();
  const nameB = (data.nameB || "Side B").trim();
  const skillA = (pickA ? pickA.value : TBE.num(data.skillA, 50)) + TBE.num(data.modA, 0);
  const fixed = data.typeB === "fixed";
  const skillB = TBE.num(data.skillB, 50) + (fixed ? 0 : TBE.num(data.modB, 0));
  const useDoS = data.dos === "on" || data.dos === true || data.dos === "true";

  const rollA = await TBE.d100();
  const resA = TBE.resolve(rollA.total, skillA, pickA ? pickA.expertise : 0);
  const rolls = [rollA];

  let resB = null;
  if (!fixed) {
    const rollB = await TBE.d100();
    resB = TBE.resolve(rollB.total, skillB);
    rolls.push(rollB);
  }

  const A = { name: nameA, kind: "roll", res: resA, sl: resA.success ? resA.sl : 0, ok: resA.success };
  const B = fixed
    ? { name: nameB, kind: "fixed", res: null, sl: Math.max(0, skillB), ok: true }
    : { name: nameB, kind: "roll", res: resB, sl: resB.success ? resB.sl : 0, ok: resB.success };

  let winner = null;
  let dos = 0;
  let why = "";

  if (A.ok && B.ok) {
    if (A.sl > B.sl) { winner = A; dos = A.sl - B.sl; why = "higher SLs"; }
    else if (B.sl > A.sl) { winner = B; dos = B.sl - A.sl; why = "higher SLs"; }
    else {
      const critA = A.kind === "roll" && A.res.crit;
      const critB = B.kind === "roll" && B.res.crit;
      if (critA && !critB) { winner = A; why = "critical beats non-critical (0 SL)"; }
      else if (critB && !critA) { winner = B; why = "critical beats non-critical (0 SL)"; }
      else if (A.kind === "roll" && B.kind === "fixed") { winner = A; why = "rolled skill beats a Fixed Number on a tie (0 SL)"; }
      else if (B.kind === "roll" && A.kind === "fixed") { winner = B; why = "rolled skill beats a Fixed Number on a tie (0 SL)"; }
      else if (A.res.roll > B.res.roll) { winner = A; why = "SLs tied, higher die roll (0 SL)"; }
      else if (B.res.roll > A.res.roll) { winner = B; why = "SLs tied, higher die roll (0 SL)"; }
      else if (skillA > skillB) { winner = A; why = "SLs and die tied, higher modified skill (0 SL)"; }
      else if (skillB > skillA) { winner = B; why = "SLs and die tied, higher modified skill (0 SL)"; }
      else why = "dead heat &mdash; decide or re-roll";
    }
  } else if (A.ok) { winner = A; dos = A.sl; why = "only side to succeed"; }
  else if (B.ok) { winner = B; dos = B.sl; why = "only side to succeed"; }
  else {
    const cfA = A.kind === "roll" && A.res.critFail;
    const cfB = B.kind === "roll" && B.res.critFail;
    if (cfA && !cfB) why = "both failed &mdash; if a winner is required, " + B.name + " (normal failure beats critical failure)";
    else if (cfB && !cfA) why = "both failed &mdash; if a winner is required, " + A.name + " (normal failure beats critical failure)";
    else why = "both failed &mdash; if a winner is required, " + (skillA >= skillB ? A.name : B.name) + " (higher modified skill)";
  }

  const line = (S, target) => {
    if (S.kind === "fixed") return '<div><b>' + S.name + "</b>: Fixed Number &mdash; " + S.sl + " SL</div>";
    const r = S.res;
    return (
      "<div><b>" + S.name + "</b> (target " + target + "): <b>" + TBE.face(r.roll) + "</b> &mdash; " +
      '<span style="color:' + TBE.colour(r) + '">' + TBE.tag(r) + "</span>" +
      (r.success ? ", " + r.sl + " SL" : "") + "</div>"
    );
  };

  const body =
    line(A, skillA) + line(B, skillB) +
    '<div style="border-top:1px solid #7a6a4f;margin-top:4px;padding-top:4px">' +
    (winner
      ? "<b>" + winner.name + " wins</b>" + (useDoS ? " &mdash; DoS " + dos + " SL" : "") +
        '<div style="font-size:11px;opacity:.8">' + why + "</div>"
      : '<b>No winner</b><div style="font-size:11px;opacity:.8">' + why + "</div>") +
    "</div>";

  await TBE.say(TBE.card("TBE Opposed Roll", body), rolls);
}
