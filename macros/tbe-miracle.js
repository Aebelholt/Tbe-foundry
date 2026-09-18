/* TBE: Miracle (Ch.15 p.343-353) — a Godbound asks their god for help.
 *
 * The whole chapter turns on one uncomfortable fact: asking costs Piety
 * whether or not the god answers, and the Godbound is not supposed to know
 * exactly what their Piety is. This macro does the arithmetic and the
 * thresholds; whether the player is shown the number is the GM's call, and
 * the card says so rather than pretending otherwise.
 *
 * What it enforces, because the book is specific and a table gets it wrong by
 * hand: Resolve cannot be spent on a Piety roll; no Weave Reaction ever
 * follows a miracle; a holy symbol adds +2 SLs but only AFTER a success, and
 * steps down on a 1-2; persistent prayer adds +1/+2/+3; a Piety over 100
 * grants bonus SLs and cannot critically fail; the SL total picks the level
 * of miracle; a critical success costs no Piety at all; and a Godbound whose
 * Piety hits zero is Cast Out — after the miracle resolves, if it landed.
 */

const DIVINE = (typeof TBE_DIVINE !== "undefined" && TBE_DIVINE) || {};
const RULES = DIVINE.piety || {};
const RESULTS = DIVINE.pietyResults || [];
const MODS = DIVINE.pietyModifiers || [];
const RESIST = DIVINE.resistance || [];
const DOMAINS = DIVINE.domains || [];
const SYMQ = DIVINE.holySymbol || {};
const esc = (x) => String(x == null ? "" : x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const q = (o, k) => (o && o[k] && o[k].q) || "";

const me = TBE.me();
const gb = TBE.godbound(me);

if (!gb.isGodbound) {
  /* Two different "no" answers. A sheet carrying the pre-v0.28.0 placeholder
     Piety-0 skill looks like a Godbound to the naked eye, so saying "no Piety
     skill" there would be a lie the player can see is false. */
  ui.notifications?.warn(gb.placeholderPiety
    ? "TBE: " + me.name + " has a Piety skill at 0 with no deity and no Domain, which is the empty placeholder older character builds left behind, not a calling. A Godbound gets Piety from the Godbound career or the Godbound Talent (TBE: Talents); set a deity and at least one Domain on the Magic tab. Praying at Piety 0 would fail and Cast you Out."
    : "TBE: no Piety skill on this sheet. Earning Piety requires the Godbound career or the Godbound Talent.");
} else if (gb.castOut) {
  await TBE.say(TBE.card("TBE Miracle",
    "<div><b>" + esc(me.name) + "</b> is <b>Cast Out</b>.</div>" +
    "<div>" + esc(q(DIVINE.castOut || {}, "noMiracles")) + "</div>" +
    "<div style='font-size:11px;opacity:.85'>An act of atonement comes first &mdash; TBE: Pious Act records it.</div>"));
} else {
  /* Only the god's own Domains can be asked from: "The gods cannot affect
   * things outside their Domains... there will be no result." A sheet with no
   * Domains recorded gets the full list rather than being blocked, since that
   * is a bookkeeping gap and not a fiction about the god. */
  const mine = gb.domains.length
    ? DOMAINS.filter((d) => gb.domains.some((n) => n.toLowerCase() === d.name.toLowerCase()))
    : DOMAINS;
  const domainOpts = mine.map((d) => '<option value="' + esc(d.name) + '">' + esc(d.name) +
    " &mdash; " + esc(d.aspects.slice(0, 60)) + "</option>").join("");
  const modOpts = MODS.map((m, i) => '<option value="' + m.mod + '">' + esc(m.label) + " (" +
    (m.mod > 0 ? "+" : "") + m.mod + (m.max != null ? " to " + (m.max > 0 ? "+" : "") + m.max : "") + ")</option>").join("");
  const resistOpts = RESIST.map((r) => '<option value="' + r.fixed + '">' + esc(r.name) + " &mdash; Fixed Number " +
    r.fixed + "</option>").join("");
  const symbolLine = gb.symbol
    ? (TBE.symbolUsable(gb.symbol)
        ? "Holy symbol: <b>" + gb.symbol + "</b>"
        : "Holy symbol: <b>" + gb.symbol + "</b> &mdash; depleted below d6, it must be blessed before it helps again")
    : "No holy symbol recorded.";

  const content =
    '<div style="font-size:13px">' +
    "<div>" + esc(me.name) + (gb.deity ? " of <b>" + esc(gb.deity) + "</b>" : "") + " &middot; " + symbolLine + "</div>" +
    (gb.noGreaterSessions
      ? "<div style='color:#8b1a1a;font-size:11px'>Recently atoned: no Greater Miracles for another " +
        gb.noGreaterSessions + " session(s).</div>"
      : "") +
    "<hr>" +
    '<label style="display:block">The Domain being asked from: <select name="domain" style="width:100%">' +
    domainOpts + "</select></label>" +
    (gb.domains.length
      ? ""
      : "<div style='font-size:11px;opacity:.8'>No Domains recorded on this sheet, so all twenty are offered. " +
        esc(q(RULES, "outsideDomain")) + "</div>") +
    '<label style="display:block">What is being asked for: <input type="text" name="ask" value="" placeholder="protection from the fire" style="width:100%"></label>' +
    '<label style="display:block">How the god sees the request: <select name="mod" style="width:100%">' +
    '<option value="0">No modifier</option>' + modOpts + "</select></label>" +
    '<label style="display:block">Extra modifier (the table gives ranges, not single numbers): ' +
    '<input type="number" name="extraMod" value="0" style="width:100%"></label>' +
    '<label style="display:block">Persistent prayer: <select name="prayer" style="width:100%">' +
    '<option value="none">A single action (no bonus)</option>' +
    '<option value="minute">A full minute (+1 SL)</option>' +
    '<option value="ten">Ten minutes (+2 SLs)</option>' +
    '<option value="hour">A full hour or more (+3 SLs)</option>' +
    "</select></label>" +
    (TBE.symbolUsable(gb.symbol)
      ? '<label style="display:block;font-size:12px"><input type="checkbox" name="useSymbol" checked> Use the holy symbol ' +
        "(+2 SLs after a success; it steps down on a 1-2)</label>"
      : "") +
    '<label style="display:block;font-size:12px"><input type="checkbox" name="celestial"> Asking a <b>celestial servant</b> ' +
    "rather than the god (no Greater Miracles)</label>" +
    '<label style="display:block">If the miracle is resisted, the target is: <select name="resist" style="width:100%">' +
    '<option value="">— not resisted / decide later —</option>' + resistOpts + "</select></label>" +
    "<div style='font-size:11px;opacity:.8'>" + esc(q(RULES, "noResolve")) + " " + esc(q(RULES, "noWeaveReaction")) + "</div>" +
    "</div>";

  const data = await TBE.prompt("TBE Miracle", content, "Pray");
  if (data) {
    const rolls = [];
    const domain = DOMAINS.find((d) => d.name === data.domain) || mine[0] || null;
    const modifier = TBE.num(data.mod, 0) + TBE.num(data.extraMod, 0);
    const prayerKey = ["minute", "ten", "hour"].indexOf(data.prayer) > -1 ? data.prayer : "none";
    const prayerSls = TBE.PRAYER_SLS[prayerKey] || 0;
    const celestial = data.celestial === "on" || data.celestial === true;
    const wantSymbol = (data.useSymbol === "on" || data.useSymbol === true) && TBE.symbolUsable(gb.symbol);

    const against = gb.piety + modifier;
    const roll = await TBE.d100();
    rolls.push(roll);
    /* Piety can never have Expertise, so the roll is resolved at 0 -- and
     * TBE.resolve already gives the over-100 bonus SLs and suppresses the
     * critical failure, which is exactly what p.347 describes. */
    const r = TBE.resolve(roll.total, against, 0);

    let body = "<div><b>" + esc(me.name) + "</b> prays" + (gb.deity ? " to " + esc(gb.deity) : "") +
      (data.ask ? " for " + esc(data.ask) : "") + (domain ? ", from the <b>" + esc(domain.name) + "</b> Domain" : "") + ".</div>" +
      "<div>Piety (" + gb.piety + (modifier ? (modifier > 0 ? " +" : " ") + modifier : "") + " = <b>" + against + "</b>): " +
      TBE.face(roll.total) + " &rarr; <b>" + TBE.tag(r) + "</b>" + (r.success ? ", " + r.sl + " SL" : "") + "</div>" +
      (against > 100 ? "<div style='font-size:11px;opacity:.85'>Over 100, so it carries bonus SLs and cannot critically fail.</div>" : "");

    /* ---- the Piety cost, which is owed either way ---- */
    const d10 = await new Roll("1d10").evaluate();
    rolls.push(d10);
    let sls = r.success ? r.sl : 0;
    let symbolNote = "";

    if (r.success) {
      if (prayerSls) sls += prayerSls;
      /* "The symbol can be rolled after a successful Piety roll to add +2 SLs
       * to the outcome... The holy symbol does not help a failed Piety roll." */
      if (wantSymbol) {
        const sd = await new Roll("1" + gb.symbol).evaluate();
        rolls.push(sd);
        sls += TBE.SYMBOL_SLS;
        const stepped = sd.total <= 2 ? TBE.stepSymbol(gb.symbol) : gb.symbol;
        if (stepped !== gb.symbol) {
          await TBE.write(me, { "system.holySymbol": stepped }, "the holy symbol step");
        }
        symbolNote = "<div>Holy symbol " + gb.symbol + ": <b>" + sd.total + "</b> &rarr; +" + TBE.SYMBOL_SLS + " SLs" +
          (stepped !== gb.symbol
            ? ", and it wears down to <b>" + stepped + "</b>" +
              (TBE.symbolNeedsBlessing(stepped) ? " &mdash; below d6, so it must be blessed before it helps again" : "")
            : "") + ".</div>";
      }
    }

    let level = r.success ? TBE.miracleLevel(sls) : null;
    let levelNote = "";
    if (level === "Greater" && celestial) {
      level = "Middle";
      levelNote = "<div style='font-size:11px;opacity:.85'>" + esc(q(RULES, "celestialCap")) +
        " &mdash; it comes through as a Middle Miracle.</div>";
    } else if (level === "Greater" && gb.noGreaterSessions > 0) {
      level = "Middle";
      levelNote = "<div style='font-size:11px;opacity:.85'>The god has forgiven but distance remains: no Greater " +
        "Miracles for another " + gb.noGreaterSessions + " session(s), so it comes through as a Middle Miracle.</div>";
    }

    /* p.348's Piety Roll Results: success costs 1d10 + total SLs, a critical
     * success costs nothing at all, a failure 1d10, a critical failure
     * 1d10+10. TBE.resolve has already added the critical's +3 SLs. */
    let cost, why;
    if (r.critFail) { cost = d10.total + 10; why = "1d10 (" + d10.total + ") + 10"; }
    else if (!r.success) { cost = d10.total; why = "1d10 (" + d10.total + ")"; }
    else if (r.crit) { cost = 0; why = "nothing &mdash; a critical success costs no Piety"; }
    else { cost = d10.total + sls; why = "1d10 (" + d10.total + ") + " + sls + " SLs"; }

    if (r.success) {
      body += symbolNote +
        (prayerSls ? "<div>Persistent prayer: +" + prayerSls + " SL" + (prayerSls === 1 ? "" : "s") + ".</div>" : "") +
        "<div style='font-weight:bold;color:#1f7a1f'>" + sls + " SLs &mdash; a <b>" + level + " Miracle</b>.</div>" + levelNote;
      if (domain) {
        const list = (domain.miracles || {})[level] || [];
        body += "<div style='margin-top:3px;font-size:12px'><b>" + esc(domain.name) + " &middot; " + level +
          " Miracles</b> <span style='font-size:11px;opacity:.8'>(guidelines &mdash; the god answers the intention, " +
          "not the words)</span><ul style='margin:2px 0 0 14px;padding:0'>" +
          list.map((m) => "<li>" + esc(m) + "</li>").join("") + "</ul></div>";
      }
      if (data.resist) {
        body += "<div style='font-size:11px;opacity:.85;margin-top:3px'>If it is resisted: an opposed roll against " +
          "Fixed Number <b>" + esc(data.resist) + "</b> &mdash; " +
          esc((RESIST.find((x) => String(x.fixed) === String(data.resist)) || {}).name || "") +
          ". Any character may oppose with Divinity instead.</div>";
      }
    } else {
      body += "<div style='font-weight:bold;color:#8b1a1a'>The god does not grant the miracle.</div>";
    }

    const after = await TBE.setPiety(me, gb.piety - cost);
    body += "<div style='margin-top:3px'>Piety cost: " + why + " = <b>" + cost + "</b>.</div>" +
      "<div style='font-size:11px;opacity:.8'>" + esc(q(RULES, "hidden")) +
      " Hide this card from the player if you are keeping the number.</div>";

    if (after.castOut) {
      body += "<div style='font-weight:bold;color:#8b1a1a'>Piety has fallen to zero: <b>Cast Out</b>" +
        (r.success ? ", immediately after the miracle's effects resolve" : "") + ".</div>" +
        "<div style='font-size:11px;opacity:.85'>An angry or chastising vision follows. No further miracles until " +
        "an act of atonement is completed.</div>";
    } else if (after.warned) {
      body += "<div style='color:#8b1a1a'>Piety has fallen to " + TBE.PIETY_WARNING + " or below: the god sends a " +
        "warning vision &mdash; a dream, an omen, a sign.</div>";
    }

    await TBE.say(TBE.card("TBE Miracle", body), rolls);
  }
}
