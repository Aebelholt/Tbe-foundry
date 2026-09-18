/* TBE: Cast — the Bind roll, control check, and the Weave Reaction (Ch.14).
 * Player casting and the NPC Spellweaver shortcut (Ch.18) both live here. */

const REACTIONS = [
  [-99, 1, "2 pt Thread created"],
  [2, 2, "Unexpected Detail: a harmless cosmetic oddity in the effect"],
  [3, 3, "1 Fatigue"],
  [4, 4, "Cut Off for the next round"],
  [5, 5, "1-point wound"],
  [6, 6, "Echo: 1 unintended target"],
  [7, 7, "d6 Thread Die created"],
  [8, 8, "1d4+1 steps of Supply consumed"],
  [9, 9, "Cut Off for 1d6 rounds"],
  [10, 10, "Immobilized for 1d4 rounds"],
  [11, 11, "Hallucinations: no actions until a Willpower roll beats 3 SL or the Bind roll"],
  [12, 12, "1d4 Fatigue"],
  [13, 13, "Additional spells cost +2d6 TC until sunrise or sunset"],
  [14, 14, "Weave Scar: -20 to Bind until sunrise or sunset"],
  [15, 15, "Hazard created in the zone"],
  [16, 16, "Echo: 1d4+1 targets"],
  [17, 17, "1d4+1 point wound"],
  [18, 18, "Restrained for 1d4 rounds"],
  [19, 19, "Cut Off until sunrise or sunset"],
  [20, 20, "1d3 Fraying"],
  [21, 21, "Marked: minor deformity"],
  [22, 22, "Reality Snag"],
  [23, 23, "Cut Off for 1d4 days"],
  [24, 24, "Weave Scar: -1d6+2 to Bind, permanently"],
  [25, 25, "Marked: major deformity"],
  [26, 29, "Catastrophic Fray"],
  [30, 30, "Void Incursion (Vulgar castings only)"],
  [31, 35, "Fraygeist (Ritual only)"],
  [36, 40, "Pattern Collapse (Ritual only)"],
  [41, 999, "The Grey Wailing (Ritual only)"]
];
const reactionFor = (n) => (REACTIONS.find((r) => n >= r[0] && n <= r[1]) || REACTIONS[REACTIONS.length - 1])[2];

const me = TBE.me();
if (!me) {
  ui.notifications?.warn("TBE: select the caster's token first.");
} else {
  const binds = (me.items ?? []).filter((i) => i.type === "skill" && /bind/i.test(i.name))
    .map((i) => ({ name: i.name, value: TBE.num(i.system?.value, 0), expertise: TBE.num(i.system?.expertise, 0) }));
  const strands = (me.items ?? []).filter((i) => i.type === "skill" && /strand/i.test(i.name))
    .map((i) => ({ name: i.name, value: TBE.num(i.system?.value, 0) }));
  const mp = me.system?.resolve;

  const bOpts = binds.length
    ? binds.map((b, i) => '<option value="' + i + '">' + b.name + " (" + b.value + ")</option>").join("")
    : '<option value="-1">No Bind skill on this sheet</option>';

  const data = await TBE.prompt(
    "Cast a spell",
    '<div style="font-size:13px">' +
    "<div><b>" + me.name + "</b>" + (mp ? " &middot; Resolve " + mp.value + " / " + (mp.max ?? "?") : "") + "</div>" +
    '<label style="display:block">Intended effect: <input type="text" name="effect" placeholder="Hurl the lantern flame at the guard" style="width:100%"></label>' +
    '<label style="display:block">Bind: <select name="bind" style="width:100%">' + bOpts + "</select></label>" +
    '<label style="display:block">Bind value (override): <input type="number" name="bindVal" value="' + (binds[0]?.value ?? 40) + '" style="width:100%"></label>' +
    '<label style="display:block">Strand value: <input type="number" name="strand" value="' + (strands[0]?.value ?? 4) + '" style="width:100%"></label>' +
    '<label style="display:block">Modifier: <input type="number" name="mod" value="0" style="width:100%"></label>' +
    '<label style="display:block">Weave Reaction Modifier (Total Cost you could not cover): <input type="number" name="wrm" value="0" style="width:100%"></label>' +
    '<label style="display:block">Resolve spent on mitigation (1 point cuts the modifier by 1): <input type="number" name="mitigate" value="0" style="width:100%"></label>' +
    '<label style="display:block;margin-top:4px"><input type="checkbox" name="npc"> NPC Spellweaver (Ch.18 shortcut: ones die vs Strand decides control)</label>' +
    "</div>",
    "Bind the Strand"
  );

  if (data) {
    const bind = binds[TBE.num(data.bind, -1)] ?? null;
    const bindVal = (bind ? bind.value : TBE.num(data.bindVal, 40)) + TBE.num(data.mod, 0);
    const strand = TBE.num(data.strand, 4);
    const mitigate = Math.max(0, TBE.num(data.mitigate, 0));
    let wrm = Math.max(0, TBE.num(data.wrm, 0) - mitigate);
    const rolls = [];

    const r = await TBE.d100();
    rolls.push(r);
    const res = TBE.resolve(r.total, bindVal, bind ? bind.expertise : 0);
    const ones = res.roll % 10;

    let body =
      (data.effect ? '<div style="font-style:italic">&ldquo;' + data.effect + '&rdquo;</div>' : "") +
      "<div>" + (bind ? bind.name : "Bind") + " " + bindVal + ": <b>" + TBE.face(res.roll) + "</b> " +
      '<span style="color:' + TBE.colour(res) + '">' + TBE.tag(res) + "</span>" +
      (res.success ? ", " + res.sl + " SL, resistance is set at " + res.sl + " SL" : "") + "</div>";

    if (mitigate > 0) {
      body += "<div>Mitigation: " + mitigate + " Resolve spent, Weave Reaction Modifier now " + wrm + ".</div>";
      if (mp && typeof mp.value === "number") {
        try { await me.update({ "system.resolve.value": Math.max(0, mp.value - mitigate) }); } catch (e) {}
      }
    }

    /* Control: NPCs use the ones-die shortcut, PCs use whether the cost was covered. */
    let uncontrolled;
    if (data.npc === "on") {
      uncontrolled = ones === 0 || ones > strand;
      body += "<div>Ones die <b>" + ones + "</b> vs Strand " + strand + " &rarr; " +
        (uncontrolled ? "<b>uncontrolled</b>" : "controlled, no Weave Reaction") + "</div>";
      if (res.critFail) { uncontrolled = true; wrm += 5; body += "<div>Critical failure: the spell fails and the Weave lashes out at +5.</div>"; }
      if (!res.success && !res.critFail) { uncontrolled = false; body += "<div>The spell simply fails. No Reaction.</div>"; }
      if (res.crit) { uncontrolled = false; body += "<div>Critical success: +3 SL and no Weave Reaction.</div>"; }
    } else {
      uncontrolled = wrm > 0 || res.critFail;
      if (res.critFail) { wrm += 5; body += "<div>Critical failure: the casting collapses and the Reaction rolls at +5.</div>"; }
      else if (!uncontrolled) body += "<div>The cost was covered: the spell holds, no Weave Reaction.</div>";
    }

    if (uncontrolled) {
      const wr = await new Roll("1d20").evaluate();
      rolls.push(wr);
      const total = wr.total + wrm;
      const reactText = reactionFor(total);
      body +=
        '<div style="border-top:1px solid #7a6a4f;margin-top:4px;padding-top:4px">' +
        "<b>Weave Reaction</b>: d20 <b>" + wr.total + "</b>" + (wrm ? " + " + wrm : "") + " = <b>" + total + "</b></div>" +
        '<div style="color:#8b1a1a;font-weight:bold">' + reactText + "</div>";
      if (/Supply/i.test(reactText)) {
        const s = await TBE.rollSupply(me, "gear", true);
        if (s.roll) rolls.push(s.roll);
        body += '<div style="font-size:11px;opacity:.85">' + s.text + "</div>";
      }
      /* The Weave lashes out at the caster. Two Reaction results map cleanly onto the
         shared status registry (see _lib.js); the rest are narrated only. */
      if (/restrain/i.test(reactText)) {
        const dur = reactText.match(/\d*d\d+/i);
        let rounds = 1;
        if (dur) { const rr = await new Roll(dur[0]).evaluate(); rolls.push(rr); rounds = rr.total; }
        const ok = await TBE.applyStatus(me, "tbe-restrained", { duration: { rounds } });
        body += ok ? "<div>" + me.name + " is <b>Restrained</b> for " + rounds + " round(s).</div>"
                    : "<div>" + me.name + " is Restrained, track it by hand.</div>";
      }
      const fatMatch = reactText.match(/^(\d*d?\d*)\s*Fatigue/i);
      if (fatMatch) {
        let amt = 1;
        if (/d/i.test(fatMatch[1])) { const fr = await new Roll(fatMatch[1]).evaluate(); rolls.push(fr); amt = fr.total; }
        else amt = TBE.num(fatMatch[1], 1);
        const cur = TBE.num(me.system?.fatigue, 0) + amt;
        try { await me.update({ "system.fatigue": cur }); } catch (eFat) {}
        body += "<div>" + me.name + " takes <b>" + amt + " Fatigue</b> (now " + cur + " marked).</div>";
      }
    }

    if (res.success) {
      body += '<div style="font-size:11px;opacity:.8;margin-top:4px">Targets resist with an opposed roll against ' + res.sl +
        " SL. On a damaging spell the struck location is the ones die: <b>" + (ones === 0 ? "0, Head" : ones) + "</b>.</div>";
    }

    await TBE.say(TBE.card("Weave Magic", body), rolls);
  }
}
