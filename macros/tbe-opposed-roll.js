/* TBE: Opposed Roll — two skills, or a skill vs a Fixed Number. Reports Degree of Success. */
const picker = TBE.skillOptions("pickA", "Side A from sheet");
/* Expertise floor (p.53/54: 0, or 2/3/4 for Ex2-Ex4), manually chosen for
 * whichever side isn't using the from-sheet picker -- Side A falls back to
 * this when typed by hand instead of picked, and Side B (an opponent who is
 * usually a different actor than whatever token is currently controlled, so
 * it can't use the same picker as Side A) had no way to enter Expertise at
 * all before this, defaulting every defender to Ex0 regardless of their
 * real sheet. */
const expOpts = '<option value="0" selected>None</option><option value="2">Ex2</option>' +
  '<option value="3">Ex3</option><option value="4">Ex4</option>';
const content =
  '<div style="font-size:13px">' +
  '<div style="font-weight:bold;margin-top:2px">Side A</div>' +
  picker +
  TBE.encNote(TBE.me()) +
  TBE.riderNote(TBE.me()) +
  '<label style="display:block">Name: <input type="text" name="nameA" value="Attacker" style="width:100%"></label>' +
  '<label style="display:block">Skill: <input type="number" name="skillA" value="50" style="width:100%"></label>' +
  '<label style="display:block">Modifier: <input type="number" name="modA" value="' + TBE.encMod(TBE.me()) + '" style="width:100%"></label>' +
  '<label style="display:block">Expertise (if not picked above): <select name="expA" style="width:100%">' + expOpts + "</select></label>" +
  '<hr><div style="font-weight:bold">Side B</div>' +
  '<label style="display:block">Type: <select name="typeB" style="width:100%">' +
  '<option value="skill" selected>Skill roll</option><option value="fixed">Fixed Number (auto SL)</option>' +
  "</select></label>" +
  '<label style="display:block">Name: <input type="text" name="nameB" value="Defender" style="width:100%"></label>' +
  '<label style="display:block">Skill / Fixed Number: <input type="number" name="skillB" value="50" style="width:100%"></label>' +
  '<label style="display:block">Modifier: <input type="number" name="modB" value="0" style="width:100%"></label>' +
  '<label style="display:block">Expertise: <select name="expB" style="width:100%">' + expOpts + "</select></label>" +
  '<label style="display:block;margin-top:4px"><input type="checkbox" name="dos" checked> Degree of Success applies</label>' +
  "</div>";

const data = await TBE.prompt("TBE Opposed Roll", content, "Roll both");
if (data) {
  const pickA = TBE.readPick(data.pickA);
  const nameA = (data.nameA || (pickA ? pickA.name : "") || "Side A").trim();
  const nameB = (data.nameB || "Side B").trim();
  const skillA = (pickA ? pickA.value : TBE.num(data.skillA, 50)) + TBE.num(data.modA, 0);
  const expertiseA = pickA ? pickA.expertise : TBE.num(data.expA, 0);
  const fixed = data.typeB === "fixed";
  const skillB = TBE.num(data.skillB, 50) + (fixed ? 0 : TBE.num(data.modB, 0));
  const expertiseB = TBE.num(data.expB, 0);
  const useDoS = data.dos === "on" || data.dos === true || data.dos === "true";

  const rollA = await TBE.d100();
  const resA = TBE.resolve(rollA.total, skillA, expertiseA);
  const rolls = [rollA];

  let resB = null;
  if (!fixed) {
    const rollB = await TBE.d100();
    resB = TBE.resolve(rollB.total, skillB, expertiseB);
    rolls.push(rollB);
  }

  const A = { name: nameA, kind: "roll", res: resA, sl: resA.success ? resA.sl : 0, ok: resA.success, skill: skillA };
  const B = fixed
    ? { name: nameB, kind: "fixed", res: null, sl: Math.max(0, skillB), ok: true, skill: skillB }
    : { name: nameB, kind: "roll", res: resB, sl: resB.success ? resB.sl : 0, ok: resB.success, skill: skillB };

  /* Tie-break cascade lives in TBE.opposedResolve() (_lib.js) now -- TBE:
   * Chase's Quick Chase option needs the exact same rule and a second copy
   * here would be the ownership bug this project keeps finding after the
   * fact instead of before. */
  const { winner, dos, why } = TBE.opposedResolve(A, B);

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
