/* TBE: Counterspell — Hold to Interrupt against an incoming spell (Ch.14 p.311).
 *
 * "A Spellweaver can cast a counterspell to cancel an incoming opposing spell.
 * This is a special kind of magical invocation that functions as an opposed
 * Bind skill roll, and must be done by taking the Hold to Interrupt action."
 *
 * The three parts the book is specific about, and which a table gets wrong by
 * hand more often than not:
 *   - the Bind used to counter must be Destroy, or the Bind of the incoming
 *     spell, and nothing else;
 *   - the Resolve cost is the ORIGINAL caster's SLs minus the counterer's
 *     Strand value in the countered spell, and it is spent whether the counter
 *     succeeds or fails;
 *   - a counter that succeeds but cannot afford the full cost marks all
 *     remaining Resolve and fails anyway.
 * Countering is all-or-nothing: there is no partial reduction of the spell.
 */

const me = TBE.me();
if (!me) {
  ui.notifications?.warn("TBE: select the countering Spellweaver's token first.");
} else {
  const binds = TBE.binds(me);
  const strands = TBE.strands(me);
  if (!binds.length) {
    ui.notifications?.warn("TBE: " + me.name + " has no Binds, so cannot counterspell (p.311).");
  } else {
    const resolveNow = TBE.num(me.system?.resolve?.value, 0);
    const bindOpts = binds.map((b) =>
      '<option value="' + b.id + '">' + b.name + " " + (b.scar ? b.effective + " (Weave Scar &minus;" + b.scar + ")" : b.value) +
      TBE.expertiseTag(b.expertise) + "</option>").join("");
    /* TBE.strands() reports a Strand's rating as `level`, not `value` -- the
       Binds helper beside it uses `value`, which is exactly the kind of
       near-miss that ships a dropdown reading "Fire undefined". */
    const strandOpts = '<option value="0">None — no score in that Strand</option>' +
      strands.map((st) => '<option value="' + st.level + '">' + st.name + " " + st.level + "</option>").join("");

    const content =
      '<div style="font-size:13px">' +
      "<div><b>" + me.name + "</b> is Holding to Interrupt &middot; Resolve <b>" + resolveNow + "</b></div>" +
      '<div style="font-size:11px;opacity:.8;margin-bottom:4px">You must be aware of the incoming spell and it must be in your line of sight. A free Arcana roll can identify its Bind and Strand.</div>' +
      '<hr><div style="font-weight:bold">The incoming spell</div>' +
      '<label style="display:block">Caster: <input type="text" name="them" value="the caster" style="width:100%"></label>' +
      '<label style="display:inline-block;width:49%">Their SLs: <input type="number" name="theirSL" value="3" min="0" style="width:60px"></label>' +
      '<label style="display:inline-block;width:49%">Its Bind: <input type="text" name="theirBind" placeholder="Fire, Destroy..." style="width:100%"></label>' +
      '<label style="display:block">Your Strand in it (sets the discount): <select name="myStrand" style="width:100%">' + strandOpts + "</select></label>" +
      '<hr><div style="font-weight:bold">Your counter</div>' +
      '<label style="display:block">Bind used: <select name="bind" style="width:100%">' + bindOpts + "</select></label>" +
      '<div style="font-size:11px;opacity:.8">p.311: this must be <b>Destroy</b>, or the same Bind as the incoming spell.</div>' +
      TBE.encNote(me) +
      TBE.riderNote(me) +
      '<label style="display:block">Modifier: <input type="number" name="mod" value="' + TBE.encMod(me) + '" style="width:100%"></label>' +
      "</div>";

    const data = await TBE.prompt("Hold to Interrupt", content, "Counter it");
    if (data) {
      const rolls = [];
      const b = binds.find((x) => x.id === data.bind) || binds[0];
      const theirSL = Math.max(0, TBE.num(data.theirSL, 0));
      const theirBind = (data.theirBind || "").trim();
      const strandVal = Math.max(0, TBE.num(data.myStrand, 0));
      const them = (data.them || "the caster").trim();

      /* "The Bind skill used to counter must be either Destroy, or the Bind of
         the opposing spell." Reported rather than blocked: the GM may know the
         incoming Bind by another name, and the macro should not out-rule them. */
      const legal = /^destroy$/i.test(b.name) ||
        (theirBind && b.name.toLowerCase() === theirBind.toLowerCase());
      const legality = legal
        ? ""
        : '<div style="color:#8b1a1a;font-size:11px">' + b.name + " is neither <b>Destroy</b> nor the incoming spell's Bind" +
          (theirBind ? " (" + theirBind + ")" : "") + ". p.311 allows only those two — check before this stands.</div>";

      /* "Countering Resolve cost = original caster's SLs − countering caster's
         Strand value in the countered spell." Not affected by the counterer's
         own DoS, and spent win or lose. */
      const cost = Math.max(0, theirSL - strandVal);
      const affordable = cost <= resolveNow;

      const skill = b.effective + TBE.num(data.mod, 0);
      const r = await TBE.d100();
      rolls.push(r);
      const res = TBE.resolve(r.total, skill, b.expertise);

      /* The opposed roll is against the incoming spell's own Bind roll, which
         has already happened: its SLs are the number to beat. */
      const mySL = res.success ? res.sl : 0;
      let won = res.success && mySL > theirSL;
      let why = res.success
        ? (mySL > theirSL ? "the counter beats it" : mySL === theirSL
            ? "tied at " + mySL + " SL, so the incoming spell holds — countering is all-or-nothing"
            : "only " + mySL + " SL against " + theirSL)
        : "the counter failed";

      /* "A countering Spellweaver who succeeds but cannot afford the full
         Resolve cost marks all remaining Resolve, but the counterspell fails." */
      let spent = Math.min(cost, resolveNow);
      let brokeOnCost = false;
      if (won && !affordable) { won = false; brokeOnCost = true; why = "the counter landed but only " + resolveNow + " of the " + cost + " Resolve it cost was there"; }
      try { await me.update({ "system.resolve.value": resolveNow - spent }); } catch (e) {}

      let body =
        "<div><b>" + me.name + "</b> Holds to Interrupt " + them + "'s spell" +
          (theirBind ? " (" + theirBind + ")" : "") + "</div>" + legality +
        "<div>" + b.name + " " + skill + TBE.expertiseTag(b.expertise) + ": <b>" + TBE.face(res.roll) + "</b> " +
          '<span style="color:' + TBE.colour(res) + '">' + TBE.tag(res) + "</span>" +
          (res.success ? ", " + res.sl + " SL vs their " + theirSL : "") + "</div>" +
        "<div>Resolve cost: " + theirSL + " SL &minus; " + strandVal + " Strand = <b>" + cost + "</b>" +
          (spent < cost ? ", but only <b>" + spent + "</b> was available" : "") +
          " &rarr; " + (resolveNow - spent) + " left. Spent either way (p.311).</div>";

      body += won
        ? '<div style="font-weight:bold;color:#1f7a1f;margin-top:4px">Countered &mdash; ' + why +
          ".</div><div style='font-size:11px;opacity:.85'>The spell has no effect. " + them +
          " spends a single Resolve as if it had failed, and there is no Weave Reaction for them.</div>"
        : '<div style="font-weight:bold;color:#8b1a1a;margin-top:4px">Not countered &mdash; ' + why +
          ".</div><div style='font-size:11px;opacity:.85'>The incoming spell resolves normally. There is no partial success and no reduction of effect.</div>";
      if (brokeOnCost) body += '<div style="font-size:11px;opacity:.85">All remaining Resolve is marked regardless.</div>';

      /* "Critically failing a counterspell causes the countering Spellweaver to
         suffer a Weave Reaction (roll 1d20), in addition to losing the Resolve." */
      if (res.critFail) {
        const wr = await new Roll("1d20").evaluate();
        rolls.push(wr);
        body += '<div style="border-top:1px solid #7a6a4f;margin-top:4px;padding-top:4px">' +
          "<b>Critical failure</b> &mdash; " + me.name + " suffers a Weave Reaction: d20 <b>" + wr.total +
          "</b>. Read it off the Weave Reaction Table (TBE Reference journal) and apply it.</div>";
      }

      await TBE.say(TBE.card("Hold to Interrupt", body), rolls);
    }
  }
}
