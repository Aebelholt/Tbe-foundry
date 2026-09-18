/* TBE: Pious Act (Ch.15 p.350-351) — the only way Piety ever comes back, plus
 * the two states that hang off it: being Cast Out, and atoning.
 *
 * "The only way for a Godbound to regain lost Piety is by performing acts of
 * service or devotion to the deity or the church." Not experience points, not
 * training, not time — which is why this is a macro and not a sheet field the
 * player edits: the amounts are rolled, the 90 ceiling is real, and a Cast Out
 * Godbound cannot regain any Piety at all until they have atoned.
 */

const DIVINE = (typeof TBE_DIVINE !== "undefined" && TBE_DIVINE) || {};
const ACTS = DIVINE.piousActs || [];
const RULES = DIVINE.piety || {};
const CASTOUT = DIVINE.castOut || {};
const SYMQ = DIVINE.holySymbol || {};
const esc = (x) => String(x == null ? "" : x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const q = (o, k) => (o && o[k] && o[k].q) || "";

const me = TBE.me();
const gb = TBE.godbound(me);

if (!gb.isGodbound) {
  ui.notifications?.warn("TBE: no Piety skill on this sheet. Earning Piety requires the Godbound Talent.");
} else {
  const actOpts = ACTS.map((a, i) => '<option value="' + i + '">' + esc(a.act) + " &mdash; " + esc(a.gain) +
    "</option>").join("");

  const content =
    '<div style="font-size:13px">' +
    "<div>" + esc(me.name) + (gb.deity ? " of <b>" + esc(gb.deity) + "</b>" : "") +
    (gb.castOut ? " &middot; <b style='color:#8b1a1a'>Cast Out</b>" : "") +
    (gb.symbol ? " &middot; holy symbol " + gb.symbol : "") + "</div><hr>" +
    '<label style="display:block">Action: <select name="mode" style="width:100%">' +
    '<option value="act">A Pious Act (regain Piety)</option>' +
    '<option value="atone">Complete an act of atonement</option>' +
    '<option value="session">A game session passes (count down the post-atonement muting)</option>' +
    '<option value="bless">A holy symbol is blessed (restores it to d12)</option>' +
    '<option value="lose">The god is displeased (lose Piety)</option>' +
    "</select></label>" +
    "<hr><b>Pious Act</b>" +
    '<label style="display:block">Which: <select name="act" style="width:100%">' + actOpts + "</select></label>" +
    '<div style="font-size:11px;opacity:.8">' + esc(q(RULES, "noXp")) + "</div>" +
    "<hr><b>Displeasure</b>" +
    '<label style="display:block">Piety lost: <input type="number" name="lose" value="10" style="width:100%"></label>' +
    '<div style="font-size:11px;opacity:.8">Piety can be arbitrarily decreased for acts the god finds outrageous, ' +
    "or if the Godbound keeps using her powers for her own benefit instead of the god's.</div>" +
    "</div>";

  const data = await TBE.prompt("TBE Pious Act", content, "Go");
  if (data) {
    const rolls = [];
    let body = "";

    if (data.mode === "atone") {
      /* "Completing acts of atonement returns the Godbound into the god's
       * good graces" -- but "the bond is not immediately whole": no Greater
       * Miracles for 1d6 sessions. */
      const d6 = await new Roll("1d6").evaluate();
      rolls.push(d6);
      const wAtone = await TBE.write(me, { "system.castOut": false, "system.noGreaterSessions": d6.total }, "the atonement");
      body = "<div><b>" + esc(me.name) + "</b> completes an act of atonement and is returned to the god's good graces." +
        (wAtone.ok ? "" : ' <span style="color:#8b1a1a">Not recorded on the sheet. ' + esc(wAtone.notice) + "</span>") + "</div>" +
        "<div>" + esc(q(CASTOUT, "afterAtonement")) + " &mdash; rolled <b>" + d6.total + "</b>.</div>" +
        "<div style='font-size:11px;opacity:.85'>Lesser and Middle Miracles may still occur, though their " +
        "manifestations may feel restrained. Piety can be earned again from here.</div>";

    } else if (data.mode === "session") {
      const left = Math.max(0, gb.noGreaterSessions - 1);
      await TBE.write(me, { "system.noGreaterSessions": left }, "the session count");
      body = left
        ? "<div>A session passes. No Greater Miracles for another <b>" + left + "</b> session(s).</div>"
        : "<div style='color:#1f7a1f'>A session passes. The god's full favor returns: Greater Miracles may again be granted.</div>";

    } else if (data.mode === "bless") {
      /* The blessing is itself a Lesser Miracle, prayed for by ANOTHER
       * Godbound of the same deity with at least 70 Piety -- so this records
       * the outcome rather than rolling someone else's Piety here. */
      await TBE.write(me, { "system.holySymbol": "d12" }, "the restored holy symbol");
      body = "<div>The holy symbol is blessed and restored to <b>d12</b>.</div>" +
        "<div style='font-size:11px;opacity:.85'>" + esc(q(SYMQ, "blessing")) + " " +
        esc(q(SYMQ, "blessingIsMiracle")) + " Roll that prayer on the blesser's own sheet with TBE: Miracle.</div>";

    } else if (data.mode === "lose") {
      const lost = Math.max(0, TBE.num(data.lose, 0));
      const after = await TBE.setPiety(me, gb.piety - lost);
      body = "<div><b>" + esc(me.name) + "</b> loses <b>" + lost + "</b> Piety to the god's displeasure.</div>";
      if (after.castOut) {
        body += "<div style='font-weight:bold;color:#8b1a1a'>Piety has fallen to zero: <b>Cast Out</b>.</div>" +
          "<div style='font-size:11px;opacity:.85'>" + esc(q(CASTOUT, "noMiracles")) + "</div>";
      } else if (after.warned) {
        body += "<div style='color:#8b1a1a'>At " + TBE.PIETY_WARNING + " or below, the god sends a warning vision.</div>";
      }

    } else {
      const act = ACTS[Math.max(0, TBE.num(data.act, 0))] || ACTS[0];
      if (!act) { body = "<div>No Pious Acts in the data.</div>"; }
      else if (gb.castOut) {
        body = "<div><b>" + esc(me.name) + "</b> is Cast Out.</div><div>" + esc(q(CASTOUT, "noMiracles")) + "</div>" +
          "<div style='font-size:11px;opacity:.85'>The act still matters in the fiction, but no Piety returns until " +
          "the atonement is complete.</div>";
      } else {
        let gained = 0, how = "";
        if (act.formula === "coin") {
          /* "One hour of uninterrupted prayer (one attempt per day): 50%
           * chance of 1" -- a coin flip for a single point. */
          const c = await new Roll("1d2").evaluate();
          rolls.push(c);
          gained = c.total === 1 ? 1 : 0;
          how = "a 50% chance of 1 &rarr; " + (gained ? "1" : "nothing this time");
        } else {
          const rl = await new Roll(act.formula).evaluate();
          rolls.push(rl);
          gained = rl.total;
          how = act.formula + " &rarr; " + gained;
        }
        const after = await TBE.setPiety(me, gb.piety + gained);
        body = "<div><b>" + esc(me.name) + "</b>: " + esc(act.act) + ".</div>" +
          "<div>Piety gained: " + how + ".</div>" +
          (act.note ? "<div style='font-size:11px;opacity:.85'>" + esc(act.note) + "</div>" : "") +
          (after.cappedAt90
            ? "<div style='font-size:11px;opacity:.85'>Piety can never be raised past " + TBE.PIETY_CAP +
              " through Pious Acts, so it stops there.</div>"
            : "") +
          (after.encouraged
            ? "<div style='color:#1f7a1f'>At " + TBE.PIETY_ENCOURAGEMENT + " or above, the god sends a positive " +
              "vision or sign as encouragement.</div>"
            : "");
        if (act.formula === "1d3" && /Fasting/i.test(act.act) && me) {
          const f = await TBE.addFatigue(me, 1, "Weary");
          body += "<div>Fasting costs 1 Fatigue for the day" +
            (f.overflow ? " &mdash; and it would not fit, so it became a wound" : "") + ".</div>";
        }
      }
    }

    body += "<div style='font-size:11px;opacity:.75;margin-top:3px'>" + esc(q(RULES, "hidden")) + "</div>";
    await TBE.say(TBE.card("TBE Pious Act", body), rolls);
  }
}
