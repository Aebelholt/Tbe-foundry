/* TBE: Haggle — Coins & Haggling (Ch.9 p.127).
 *
 * Buying: PC and seller make opposed Commerce rolls. Every 2 DoS the PC
 * achieves reduces the cost by 10%, up to a maximum of 50%. The book only
 * describes a benefit for the PC winning; if the seller wins, the PC pays
 * the (possibly halved, see below) listed price -- no penalty above it.
 *
 * Selling: PC makes an opposed Commerce roll against the buyer.
 *   - PC wins: every 2 DoS increases the base price by 10%, up to +50%.
 *   - Buyer wins: every 2 DoS decreases the base price by 10%, up to -50%.
 * When selling weapons, armor, or mundane items, the base price is half the
 * listed price before any haggling is applied.
 *
 * The BARTERER Talent (Ch.4) changes the rate to +10% per SL (not per 2
 * DoS) for its owner's own attempts, still capped at 50% -- toggle it below
 * rather than typing a different DoS by hand.
 */
const picker = TBE.skillOptions("pickPC", "Your Commerce, from sheet");
const content =
  '<div style="font-size:13px">' +
  '<label style="display:block">Direction: <select name="direction" style="width:100%">' +
  '<option value="buy">Buying</option><option value="sell">Selling</option>' +
  "</select></label>" +
  '<label style="display:block">Listed price (sp): <input type="number" name="price" value="100" style="width:100%"></label>' +
  '<label style="display:block"><input type="checkbox" name="halved"> Weapon, armor, or mundane item (halves the base price when Selling, p.127)</label>' +
  '<hr><div style="font-weight:bold">You</div>' +
  picker +
  TBE.encNote(TBE.me()) +
  TBE.riderNote(TBE.me()) +
  '<label style="display:block">Commerce: <input type="number" name="skillPC" value="50" style="width:100%"></label>' +
  '<label style="display:block">Modifier: <input type="number" name="modPC" value="' + TBE.encMod(TBE.me()) + '" style="width:100%"></label>' +
  '<label style="display:block"><input type="checkbox" name="barterer"> You have the BARTERER Talent (+10%/SL, not per 2 DoS)</label>' +
  '<hr><div style="font-weight:bold">Merchant</div>' +
  '<label style="display:block">Name: <input type="text" name="nameM" value="Merchant" style="width:100%"></label>' +
  '<label style="display:block">Commerce: <input type="number" name="skillM" value="50" style="width:100%"></label>' +
  '<label style="display:block">Modifier: <input type="number" name="modM" value="0" style="width:100%"></label>' +
  (TBE.me() && TBE.me().type === "character"
    ? '<hr><label style="display:block"><input type="checkbox" name="settle" checked> Settle it: move the coin on <b>' +
      TBE.me().name + '</b>\'s sheet (has ' + TBE.num(TBE.me().system?.silver, 0) + ' sp)</label>'
    : '<hr><div style="font-size:11px;opacity:.75">Select a character token to settle the price against their silver.</div>') +
  "</div>";

const data = await TBE.prompt("TBE Haggle", content, "Roll both");
if (data) {
  const buying = data.direction !== "sell";
  const listed = Math.max(0, TBE.num(data.price, 0));
  const halved = data.halved === "on" || data.halved === true || data.halved === "true";
  // p.127: buying is always the listed price. Selling weapons/armor/mundane
  // items starts from half the listed price; the book doesn't say Buying
  // ever gets that halving (it's a "when selling" rule specifically).
  const base = !buying && halved ? Math.floor(listed / 2) : listed;

  const pick = TBE.readPick(data.pickPC);
  const namePC = (pick ? pick.name : "") || "You";
  const skillPC = (pick ? pick.value : TBE.num(data.skillPC, 50)) + TBE.num(data.modPC, 0);
  const nameM = (data.nameM || "Merchant").trim();
  const skillM = TBE.num(data.skillM, 50) + TBE.num(data.modM, 0);
  const barterer = data.barterer === "on" || data.barterer === true || data.barterer === "true";

  const rollPC = await TBE.d100();
  const rollM = await TBE.d100();
  const resPC = TBE.resolve(rollPC.total, skillPC, pick ? pick.expertise : 0);
  const resM = TBE.resolve(rollM.total, skillM);
  const rolls = [rollPC, rollM];

  const PC = { name: namePC, res: resPC, sl: resPC.success ? resPC.sl : 0, ok: resPC.success };
  const M = { name: nameM, res: resM, sl: resM.success ? resM.sl : 0, ok: resM.success };

  let winner = null;
  let dos = 0;
  let why = "";
  if (PC.ok && M.ok) {
    if (PC.sl > M.sl) { winner = PC; dos = PC.sl - M.sl; why = "higher SLs"; }
    else if (M.sl > PC.sl) { winner = M; dos = M.sl - PC.sl; why = "higher SLs"; }
    else {
      if (PC.res.crit && !M.res.crit) { winner = PC; why = "critical beats non-critical (0 SL)"; }
      else if (M.res.crit && !PC.res.crit) { winner = M; why = "critical beats non-critical (0 SL)"; }
      else if (PC.res.roll > M.res.roll) { winner = PC; why = "SLs tied, higher die roll (0 SL)"; }
      else if (M.res.roll > PC.res.roll) { winner = M; why = "SLs tied, higher die roll (0 SL)"; }
      else if (skillPC > skillM) { winner = PC; why = "SLs and die tied, higher modified skill (0 SL)"; }
      else if (skillM > skillPC) { winner = M; why = "SLs and die tied, higher modified skill (0 SL)"; }
      else why = "dead heat &mdash; no price change";
    }
  } else if (PC.ok) { winner = PC; dos = PC.sl; why = "only side to succeed"; }
  else if (M.ok) { winner = M; dos = M.sl; why = "only side to succeed"; }
  else why = "both failed &mdash; no price change";

  const steps = barterer && winner === PC ? dos : Math.floor(dos / 2);
  const rate = Math.min(50, steps * 10);

  let finalPrice = base;
  let outcome = "";
  if (buying) {
    if (winner === PC) { finalPrice = Math.round(base * (100 - rate) / 100); outcome = "-" + rate + "% off the listed price"; }
    else { outcome = winner === M ? "no discount &mdash; the seller held firm" : "no discount"; }
  } else {
    if (winner === PC) { finalPrice = Math.round(base * (100 + rate) / 100); outcome = "+" + rate + "% over the base price"; }
    else if (winner === M) { finalPrice = Math.round(base * (100 - rate) / 100); outcome = "-" + rate + "% under the base price"; }
    else outcome = "no price change";
  }
  finalPrice = Math.max(0, finalPrice);

  const line = (S, target) => {
    const r = S.res;
    return (
      "<div><b>" + S.name + "</b> (Commerce " + target + "): <b>" + TBE.face(r.roll) + "</b> &mdash; " +
      '<span style="color:' + TBE.colour(r) + '">' + TBE.tag(r) + "</span>" +
      (r.success ? ", " + r.sl + " SL" : "") + "</div>"
    );
  };

  const body =
    "<div>" + (buying ? "Buying" : "Selling") + " for a listed price of <b>" + listed + " sp</b>" +
    (!buying && halved ? " &mdash; base price halved to <b>" + base + " sp</b> (weapon/armor/mundane item)" : "") + "</div>" +
    line(PC, skillPC) + line(M, skillM) +
    '<div style="border-top:1px solid #7a6a4f;margin-top:4px;padding-top:4px">' +
    (winner ? "<b>" + winner.name + " wins</b> &mdash; DoS " + dos + " SL" + (barterer && winner === PC ? " (BARTERER: " + rate + "% at +10%/SL)" : "") : "<b>No winner</b>") +
    '<div style="font-size:11px;opacity:.8">' + why + "</div></div>" +
    '<div style="margin-top:4px"><b>' + outcome + "</b> &mdash; final price <b>" + finalPrice + " sp</b></div>";

  /* The whole point of the macro used to end here: it produced a number and
   * threw it away, so every settled deal was re-entered by hand on the sheet.
   * Buying is refused rather than clamped when the purse is short -- system.
   * silver has min:0, so writing a negative would silently zero the character's
   * money and report a purchase they cannot afford as done. */
  const me = TBE.me();
  let settled = "";
  if (data.settle === "on" && me && me.type === "character") {
    const before = TBE.num(me.system?.silver, 0);
    if (buying && finalPrice > before) {
      settled = '<div style="margin-top:4px;color:#b04a3a"><b>Not settled</b> &mdash; ' + me.name +
        " has " + before + " sp and the deal costs " + finalPrice + " sp, short by " + (finalPrice - before) + " sp.</div>";
    } else {
      const after = buying ? before - finalPrice : before + finalPrice;
      const wCoin = await TBE.write(me, { "system.silver": after }, "the " + finalPrice + " sp");
      settled = wCoin.ok
        ? '<div style="margin-top:4px"><b>Settled</b> &mdash; ' + me.name + " " +
          (buying ? "pays " : "takes ") + finalPrice + " sp: " + before + " &rarr; <b>" + after + " sp</b>.</div>"
        : '<div style="margin-top:4px;color:#8b1a1a"><b>Not settled</b> &mdash; the price stands at ' + finalPrice +
          " sp but the coin did not move. " + TBE.esc(wCoin.notice) + "</div>";
    }
  } else if (me && me.type === "character") {
    settled = '<div style="margin-top:4px;font-size:11px;opacity:.75">Not settled &mdash; move the ' +
      finalPrice + " sp by hand.</div>";
  }

  await TBE.say(TBE.card("TBE Haggle", body + settled), rolls);
}
