/* TBE: Journey Leg — the 8-step leg (Ch.12) compressed to what one player rolls.
 * Guide, Quartermaster, Scout, infection on arrival, then the Event. */

const me = TBE.me();
if (!me) {
  ui.notifications?.warn("TBE: select your token first.");
} else {
  const sk = (n, d) => TBE.skillNamed(me, n)?.value ?? d;
  const skx = (n) => TBE.skillNamed(me, n)?.expertise ?? 0;
  const track = sk("Track", 40), survival = sk("Survival", 40), perception = sk("Perception", 40);
  const trackEx = skx("Track"), survivalEx = skx("Survival"), perceptionEx = skx("Perception");
  /* Toughness is a real DataModel field (system.toughness). This read a
     flags.tbe.toughness that the native system never writes, so the arrival
     Infection check (1d20 + Toughness vs lethal WP, p.184) has been running at
     Toughness 0 for every character since the sheet stopped being the CoC7
     chassis -- making infection strictly more likely than the book allows. */
  const tough = TBE.num(me.system?.toughness, 0);
  const supply = TBE.supply(me);

  const data = await TBE.prompt(
    "Journey leg",
    '<div style="font-size:13px">' +
    "<div><b>" + me.name + "</b> takes the road</div>" +
    '<div style="font-size:11px;opacity:.8;margin-bottom:4px">Alone you hold all three duties. With Lone Wanderer there is no -40; without it, set the penalty below.</div>' +
    '<label style="display:block">Duty penalty: <select name="pen" style="width:100%">' +
    '<option value="0" selected>0 (Lone Wanderer, free for solo play)</option><option value="-40">-40 (no Talent)</option></select></label>' +
    '<label style="display:block">Guide skill: <select name="guideKind" style="width:100%"><option value="Track">Track ' + track + '</option><option value="Sail/Boat">Sail/Boat (by river)</option></select></label>' +
    '<label style="display:block">Guide value: <input type="number" name="guide" value="' + track + '" style="width:100%"></label>' +
    '<label style="display:block">Survival: <input type="number" name="surv" value="' + survival + '" style="width:100%"></label>' +
    '<label style="display:block">Perception: <input type="number" name="perc" value="' + perception + '" style="width:100%"></label>' +
    '<label style="display:block">Mounted or on foot: <select name="mount" style="width:100%"><option value="1">On foot, 2 hexes a day</option><option value="2">Mounted, 3 hexes a day</option></select></label>' +
    '<label style="display:block"><input type="checkbox" name="forced"> Forced march (further, but -5 on the next Fatigue roll)</label>' +
    '<label style="display:block">Hex danger: <select name="danger" style="width:100%">' +
    '<option value="safe">Safe</option><option value="neutral" selected>Neutral</option>' +
    '<option value="precarious">Precarious</option><option value="dangerous">Dangerous</option></select></label>' +
    /* The Fatigue Modifiers Table (p.206). Every row here is the book's; the
     * Guide and Quartermaster rows are computed from their own rolls below
     * rather than asked for. */
    '<hr><b>Fatigue Table modifiers</b> <span style="font-size:11px;opacity:.75">(p.206)</span>' +
    '<label style="display:block">Terrain: <select name="terrain" style="width:100%">' +
    '<option value="0">Easy going</option>' +
    '<option value="-1">Briefly crossed difficult terrain (-1)</option>' +
    '<option value="-2">Largely desert, forest or hill (-2)</option>' +
    '<option value="-3">Largely badlands or swamp (-3)</option>' +
    '<option value="-4">Largely mountainous (-4)</option></select></label>' +
    '<label style="display:block">Season: <select name="season" style="width:100%">' +
    '<option value="0">Spring or Summer</option><option value="-1">Autumn (-1)</option>' +
    '<option value="-2">Winter (-2)</option></select></label>' +
    '<label style="display:inline-block;width:49%">Major obstacles crossed (-1 each): <input type="number" name="obstacles" value="0" min="0" style="width:50px"></label>' +
    '<label style="display:inline-block;width:49%">Travel Lore spent (+1 each, max 3): <input type="number" name="lore" value="0" min="0" max="3" style="width:50px"></label>' +
    '<label style="display:block;font-size:12px"><input type="checkbox" name="road"> Majority of the leg followed a road (+2)</label>' +
    '<label style="display:block;font-size:12px"><input type="checkbox" name="boat"> Travelling by boat on a river (+1)</label>' +
    '<label style="display:block;font-size:12px"><input type="checkbox" name="settle"> The arrival hex contains a settlement (+3)</label>' +
    '<label style="display:block;font-size:12px"><input type="checkbox" name="alone" checked> Travelling alone, solo play (+5)</label>' +
    /* p.207: on a Journey the Rations die is NOT rolled daily -- the
     * Quartermaster abstracts it -- but Fatigue taken may be reduced by 1 by
     * stepping the Ration die down once, with no roll. */
    '<label style="display:block;font-size:12px"><input type="checkbox" name="tradeRations" checked> Spend rations to soften it: -1 Fatigue for one step of the Ration die (p.207)</label>' +
    "</div>",
    "Travel"
  );

  if (data) {
    const pen = TBE.num(data.pen, 0);
    const rolls = [];
    let body = "";

    /* 3. The Guide: how far before the Fatigue roll and the Event. */
    const gVal = TBE.num(data.guide, 40);
    const gScore = Math.floor(gVal / 10); /* Score is the tens digit, never modified */
    const gRoll = await TBE.d100();
    rolls.push(gRoll);
    const g = TBE.resolve(gRoll.total, gVal + pen, trackEx);
    let hexes = Math.ceil(gScore / 2);
    let fatigueMod = 0;
    if (g.success) hexes += g.sl;
    /* p.206: a failed Track roll is -1 on the Fatigue Table, a CRITICAL failure
       is -3 (Journey only) -- it was -1 either way here. */
    else {
      fatigueMod -= g.critFail ? 3 : 1;
      if (g.critFail) hexes = Math.max(1, Math.ceil(gScore / 2) - 1);
    }
    /* p.198/203: "the standard movement rate on foot or by boat is 2 hexes per
     * day, 3 if mounted"; forced march "adds +1 hex per day to the daily
     * travel rate", at -5 on the next Fatigue roll. The rate is what forced
     * march changes, not the Guide's hex total for the leg -- the book's own
     * worked example rolls the SAME 7 hexes with and without a forced march,
     * only the day-count (3.5 days at rate 2, "just over two days" at rate 3)
     * changes. Previously this macro added +1 straight to `hexes`, which
     * doesn't match, and the mount/foot choice above was collected but never
     * used at all -- no days-elapsed figure was ever shown. */
    const rate = (data.mount === "2" ? 3 : 2) + (data.forced === "on" ? 1 : 0);
    if (data.forced === "on") fatigueMod -= 5;
    /* The rest of the Fatigue Modifiers Table (p.206). */
    fatigueMod += TBE.num(data.terrain, 0) + TBE.num(data.season, 0);
    fatigueMod -= Math.max(0, TBE.num(data.obstacles, 0));
    fatigueMod += Math.min(3, Math.max(0, TBE.num(data.lore, 0)));
    if (data.road === "on") fatigueMod += 2;
    if (data.mount === "2") fatigueMod += 2;
    if (data.boat === "on") fatigueMod += 1;
    if (data.settle === "on") fatigueMod += 3;
    if (data.alone === "on") fatigueMod += 5;
    /* "For each person in the party who has a completely depleted Ration
       Supply Die -1" -- solo, that is this character. */
    if (!TBE.supply(me).rations) fatigueMod -= 1;
    const days = hexes / rate;
    body += "<div><b>Guide</b> (" + (data.guideKind || "Track") + " " + (gVal + pen) + "): <b>" + TBE.face(g.roll) + "</b> " +
      '<span style="color:' + TBE.colour(g) + '">' + TBE.tag(g) + "</span>" + (g.success ? ", " + g.sl + " SL" : "") +
      " &rarr; <b>" + hexes + " hexes</b> (" + (hexes * 10) + " miles) before the Fatigue roll and Event" +
      (fatigueMod ? ", Fatigue Table at " + fatigueMod + " so far" : "") + "</div>" +
      "<div style=\"font-size:11px;opacity:.85\">At " + rate + " hexes/day (" + (data.mount === "2" ? "mounted" : "on foot") +
      (data.forced === "on" ? ", forced march" : "") + "): <b>" + (Number.isInteger(days) ? days : days.toFixed(1)) +
      " days</b> to cover this leg</div>";

    /* 4. The Quartermaster: keep the party fed. */
    const sRoll = await TBE.d100();
    rolls.push(sRoll);
    const s = TBE.resolve(sRoll.total, TBE.num(data.surv, 40) + pen, survivalEx);
    body += "<div><b>Quartermaster</b> (Survival " + (TBE.num(data.surv, 40) + pen) + "): <b>" + TBE.face(s.roll) + "</b> " +
      '<span style="color:' + TBE.colour(s) + '">' + TBE.tag(s) + "</span>" + (s.success ? ", " + s.sl + " SL" : "") + "</div>";
    /* p.207: "When you're on a Journey, you don't have to roll the Rations
       Supply Die every day as you do on a HexMarch, as the rationing of stores
       is abstracted into the Quartermaster's duties." This macro used to roll
       it every leg, which is the HexMarch rule applied to a Journey. What the
       Quartermaster's roll actually does is feed the Fatigue Table: "+SLs", or
       -3 on a critical failure. */
    if (s.success) fatigueMod += s.sl;
    else if (s.critFail) fatigueMod -= 3;
    body += '<div style="font-size:11px;opacity:.85">' +
      (s.success ? "+" + s.sl + " on the Fatigue Table" : s.critFail ? "-3 on the Fatigue Table (critical failure)" : "no bonus on the Fatigue Table") +
      (supply.rations ? "" : " &middot; <b>rations are gone</b>, -1 more") + "</div>";

    /* 4b. The Fatigue Table (p.206-207). "Once all modifiers are tallied, roll
       1d10 + modifiers on the Fatigue Table to determine how tiring that leg of
       the Journey was. (A HexMarch uses a d20 instead.) All Fatigue is marked
       before any Event takes place." This roll did not exist: the macro tallied
       a modifier, printed it as a note, and never rolled anything or moved a
       point of Fatigue. */
    const FATIGUE_TABLE = [
      { max: 1, name: "Exhausting", fatigue: 4, who: "Every member of the party takes 4 Fatigue" },
      { max: 6, name: "Arduous", fatigue: 3, who: "Everyone takes 3 Fatigue" },
      { max: 10, name: "Wearisome", fatigue: 2, who: "Everyone takes 2 Fatigue" },
      { max: 13, name: "Tiring", fatigue: 1, who: "Everyone takes 1 Fatigue" },
      { max: 17, name: "Taxing", fatigue: 1, who: "One PC takes 1 Fatigue (party chooses)" },
      { max: Infinity, name: "Mild", fatigue: 0, who: "No one takes Fatigue" }
    ];
    const fRoll = await new Roll("1d10").evaluate();
    rolls.push(fRoll);
    const fTotal = fRoll.total + fatigueMod;
    const fRow = FATIGUE_TABLE.find((r) => fTotal <= r.max);
    let fatigueTaken = fRow.fatigue;
    let rationLine = "";
    /* p.207: "if you take Fatigue while on a Journey, you may reduce that
       amount by 1 by reducing your Ration Supply Die by 1 step (no roll)." */
    if (fatigueTaken > 0 && data.tradeRations === "on" && supply.rations) {
      const steps = TBE.SUPPLY_STEPS;
      const idx = steps.indexOf(supply.rations);
      const next = idx > 0 ? steps[idx - 1] : 0;
      supply.rations = next;
      try { await TBE.setSupply(me, supply); } catch (e) {}
      fatigueTaken -= 1;
      rationLine = "<div style='font-size:11px;opacity:.85'>Rations stepped d" + steps[idx] +
        " &rarr; " + (next ? "d" + next : "<b>empty</b>") + " to shed 1 Fatigue (p.207).</div>";
    }

    body += "<div><b>Fatigue Table</b>: d10 <b>" + fRoll.total + "</b> " +
      (fatigueMod >= 0 ? "+" : "") + fatigueMod + " = <b>" + fTotal + "</b> &rarr; <b>" + fRow.name + "</b>" +
      " <span style='font-size:11px;opacity:.8'>(" + fRow.who + ")</span></div>" + rationLine;

    if (fatigueTaken > 0) {
      const fx = await TBE.addFatigue(me, fatigueTaken, "Weary");
      body += "<div>" + me.name + " takes <b>" + fatigueTaken + " Fatigue</b>" +
        (fx.marked ? ", " + fx.marked + " marked (now " + fx.fatigueNow + " on the track)" : "") +
        (fx.overflow
          ? " &mdash; the Resolve track is full, so a <b>Weary wound</b> in the " +
            (TBE.LOC_LABELS[fx.loc] || fx.loc) + " goes to <b>" + fx.wpNow +
            " WP</b>. Lethal, counts toward the Death Threshold and Infection, never infects, and only rest removes it (p.189)"
          : "") + ".</div>";
    }

    /* 5. Infection check on arrival, for anyone carrying lethal wounds. */
    const w = TBE.wounds(me);
    const totalWp = TBE.totalWp(w);
    if (totalWp > 0) {
      const iRoll = await new Roll("1d20").evaluate();
      rolls.push(iRoll);
      const val = iRoll.total + tough;
      body += "<div><b>Infection check</b>: d20 <b>" + iRoll.total + "</b> + Toughness " + tough + " = " + val + " vs " + totalWp + " lethal WP &rarr; ";
      if (val <= totalWp) {
        /* p.189: fatigue-based wounds "never become infected themselves", so a
           Weary wound is not a candidate even though its WP counted toward the
           check above (which they do, by the same rule). */
        const cand = Object.keys(w).filter((k) => TBE.treatableWp(w[k]) > 0 && !w[k].inf)
          .sort((a, b) => TBE.treatableWp(w[b]) - TBE.treatableWp(w[a]));
        if (cand.length) {
          w[cand[0]].inf = true;
          await TBE.setWounds(me, w);
          body += "the wound in <b>" + cand[0] + "</b> turns <b>infected</b>. Sepsis check follows.</div>";
        } else body += "everything is already infected. Sepsis check.</div>";
      } else body += "wounds stay clean.</div>";
    }

    /* 7. The Scout: warning of what waits, then the Event. */
    const pRoll = await TBE.d100();
    rolls.push(pRoll);
    const p = TBE.resolve(pRoll.total, TBE.num(data.perc, 40) + pen, perceptionEx);
    body += "<div><b>Scout</b> (Perception " + (TBE.num(data.perc, 40) + pen) + "): <b>" + TBE.face(p.roll) + "</b> " +
      '<span style="color:' + TBE.colour(p) + '">' + TBE.tag(p) + "</span>" +
      " &rarr; " + (p.success ? "you see the Event coming and act first" : "the Event takes you unaware") + "</div>";

    /* The Event itself: odds shift with how dangerous the ground is. */
    const odds = { safe: [10, 50], neutral: [11, 60], precarious: [16, 70], dangerous: [21, 80] }[data.danger || "neutral"];
    const eRoll = await TBE.d100();
    rolls.push(eRoll);
    const happens = eRoll.total <= odds[1];
    body += "<div><b>Event check</b> in " + (data.danger || "neutral") + " country: <b>" + TBE.face(eRoll.total) + "</b> vs " + odds[1] + " &rarr; " +
      (happens ? "something happens" : "the leg passes quietly") + "</div>";
    if (happens) body += TBE.eventHtml(await TBE.event());

    body += '<div style="font-size:11px;opacity:.75;border-top:1px solid #7a6a4f;margin-top:4px;padding-top:4px">' +
      "Move " + hexes + " hexes on the map, then either begin the next leg or drop into Daily Time and rest.</div>";

    await TBE.say(TBE.card("Journey leg", body), rolls);
  }
}
