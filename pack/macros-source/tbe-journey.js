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
  const tough = TBE.num(me.flags?.tbe?.toughness, 0);
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
    else { fatigueMod -= 1; if (g.critFail) hexes = Math.max(1, Math.ceil(gScore / 2) - 1); }
    if (data.forced === "on") { hexes += 1; fatigueMod -= 5; }
    body += "<div><b>Guide</b> (" + (data.guideKind || "Track") + " " + (gVal + pen) + "): <b>" + TBE.face(g.roll) + "</b> " +
      '<span style="color:' + TBE.colour(g) + '">' + TBE.tag(g) + "</span>" + (g.success ? ", " + g.sl + " SL" : "") +
      " &rarr; <b>" + hexes + " hexes</b> (" + (hexes * 10) + " miles) before the Fatigue roll and Event" +
      (fatigueMod ? ", next Fatigue at " + fatigueMod : "") + "</div>";

    /* 4. The Quartermaster: keep the party fed. */
    const sRoll = await TBE.d100();
    rolls.push(sRoll);
    const s = TBE.resolve(sRoll.total, TBE.num(data.surv, 40) + pen, survivalEx);
    body += "<div><b>Quartermaster</b> (Survival " + (TBE.num(data.surv, 40) + pen) + "): <b>" + TBE.face(s.roll) + "</b> " +
      '<span style="color:' + TBE.colour(s) + '">' + TBE.tag(s) + "</span>" + (s.success ? ", " + s.sl + " SL" : "") + "</div>";
    if (supply.rations) {
      const r = await TBE.rollSupply(me, "rations", !s.success);
      if (r.roll) rolls.push(r.roll);
      body += '<div style="font-size:11px;opacity:.85">Rations: ' + r.text + (s.success ? "" : " (foraging failed, forced step)") + "</div>";
    } else {
      body += "<div><b>No rations.</b> Hunger costs Fatigue every day until you resupply.</div>";
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
        const cand = Object.keys(w).filter((k) => w[k].wp > 0 && !w[k].inf).sort((a, b) => w[b].wp - w[a].wp);
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
