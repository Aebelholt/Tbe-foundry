/* TBE: Wounds & Recovery — the aftermath layer (Ch.11).
 * Heal (Stabilize, Treat, Remove Impairment, Remove Shock), daily Recovery,
 * Infection and Sepsis checks, rest. Every Heal roll burns Medical Supply.
 * Ported to the native system: wounds/toughness/lethalityPenalty/deathThreshold
 * are real system.* fields, keyed by the schema's camelCase location keys
 * (body, rArm, lArm, rLeg, lLeg, head) rather than display names — TBE.LOC_LABELS
 * supplies the display text wherever the player sees a location name. */

const me = TBE.me();
if (!me) {
  ui.notifications?.warn("TBE: select the wounded character's token first.");
} else {
  const w = TBE.wounds(me);
  const locs = TBE.LOCATIONS;
  const label = (l) => TBE.LOC_LABELS[l] || l;
  const hurt = locs.filter((l) => TBE.num(w[l]?.wp, 0) > 0 || TBE.num(w[l]?.imp, 0) > 0);
  const supply = TBE.supply(me);
  const heal = TBE.skillNamed(me, "Heal");
  const endurance = TBE.skillNamed(me, "Endurance");
  const tough = TBE.num(me.system?.toughness, 0);

  const locOpts = (list) => list.map((l) => '<option value="' + l + '">' + label(l) + " (" + TBE.num(w[l]?.wp, 0) + " WP" +
    (w[l]?.imp ? ", Imp" + w[l].imp : "") + (w[l]?.inf ? ", infected" : "") + ")</option>").join("");

  const content =
    '<div style="font-size:13px">' +
    "<div><b>" + me.name + "</b> &middot; total lethal WP <b>" + TBE.totalWp(w) + "</b>" +
    " &middot; Medical " + (supply.medical ? "d" + supply.medical : "exhausted") + "</div>" +
    TBE.woundTable(w) +
    '<hr><label style="display:block">Action: <select name="act" style="width:100%">' +
    '<option value="treat">Treat a wound (Heal, 15 min, sets Recovery Bonus)</option>' +
    '<option value="stabilize">Stabilize the dying (Heal, one round)</option>' +
    '<option value="impair">Remove an impairment (Heal)</option>' +
    '<option value="shock">Bring them out of Shock (Heal)</option>' +
    '<option value="recover">Rest and make Recovery rolls (daily)</option>' +
    '<option value="infect">Infection check (d20 + Toughness)</option>' +
    '<option value="sepsis">Sepsis check (d20 + Toughness, daily)</option>' +
    '<option value="purge">Purge infection from a wound (Heal, -10 if septic)</option>' +
    '<option value="add">Record a wound by hand</option>' +
    '<option value="clear">Clear a location</option>' +
    "</select></label>" +
    (hurt.length ? '<label style="display:block">Location: <select name="loc" style="width:100%">' + locOpts(hurt) + "</select></label>"
                 : '<label style="display:block">Location: <select name="loc" style="width:100%">' + locOpts(locs) + "</select></label>") +
    '<label style="display:block">Healer\'s Heal skill: <input type="number" name="healSkill" value="' + (heal?.value ?? 30) + '" style="width:100%"></label>' +
    '<label style="display:block">Endurance (for Recovery): <input type="number" name="end" value="' + (endurance?.value ?? 40) + '" style="width:100%"></label>' +
    '<label style="display:block">Cleanliness / task modifier: <select name="mod" style="width:100%">' +
    '<option value="20">Temple or clean sickroom +20</option><option value="10">Good shelter +10</option>' +
    '<option value="0" selected>Average +0</option><option value="-10">Camp in the wild -10</option>' +
    '<option value="-20">Filthy hole -20</option></select></label>' +
    '<label style="display:block">Wound Points (recording by hand): <input type="number" name="wp" value="3" style="width:100%"></label>' +
    '<label style="display:block">Rest area: <select name="area" style="width:100%">' +
    '<option value="safe">Safe: all Resolve, 3 Fatigue</option><option value="neutral" selected>Neutral: 3 Resolve, 2 Fatigue</option>' +
    '<option value="precarious">Precarious: 2 Resolve, 1 Fatigue</option><option value="dangerous">Dangerous: 1 Resolve, no Fatigue</option>' +
    "</select></label></div>";

  const data = await TBE.prompt("Wounds & Recovery", content, "Do it");
  if (data) {
    const loc = data.loc || "body";
    const mod = TBE.num(data.mod, 0);
    const rolls = [];
    let body = "<div><b>" + me.name + "</b> &middot; " + label(loc) + "</div>";
    w[loc] = w[loc] || TBE.emptyWoundLoc();

    const burnMedical = async (critFail) => {
      if (!supply.medical) { body += "<div><i>No Medical Supply left, no further Heal attempts.</i></div>"; return false; }
      const s = await TBE.rollSupply(me, "medical", critFail);
      if (s.roll) rolls.push(s.roll);
      body += '<div style="font-size:11px;opacity:.85">Medical Supply: ' + s.text + "</div>";
      return true;
    };

    const healRoll = async (labelText, extra) => {
      const skill = TBE.num(data.healSkill, 30) + mod + (extra || 0);
      const r = await TBE.d100();
      rolls.push(r);
      const res = TBE.resolve(r.total, skill, heal?.expertise ?? 0);
      body += "<div>" + labelText + " &mdash; Heal " + skill + ": <b>" + TBE.face(res.roll) + "</b> " +
        '<span style="color:' + TBE.colour(res) + '">' + TBE.tag(res) + "</span>" + (res.success ? ", " + res.sl + " SL" : "") + "</div>";
      return res;
    };

    if (data.act === "treat") {
      if (w[loc].rb !== undefined && w[loc].rb !== null) {
        body += "<div><i>This wound has already set (RB " + w[loc].rb + "). Only Recovery rolls or magic can help it now.</i></div>";
      } else if (supply.medical) {
        const res = await healRoll("Treatment");
        if (res.success) {
          const cut = 1 + Math.floor(res.sl / 3);
          w[loc].wp = Math.max(0, w[loc].wp - cut);
          w[loc].rb = 0 + 10 * Math.floor(res.sl / 3);
          body += "<div>Reduced by <b>" + cut + " WP</b> to " + w[loc].wp + ". Recovery Bonus set to <b>" +
            (w[loc].rb >= 0 ? "+" : "") + w[loc].rb + "</b>.</div>";
        } else {
          w[loc].rb = res.critFail ? -30 : -10;
          body += "<div>No reduction. Recovery Bonus set to <b>" + w[loc].rb + "</b>.</div>";
        }
        if (w[loc].wp === 0) { w[loc].imp = 0; body += "<div>The wound closes; impairment there clears.</div>"; }
        await burnMedical(res.critFail);
      } else body += "<div><i>No Medical Supply.</i></div>";
    } else if (data.act === "stabilize") {
      const res = await healRoll("Stabilize");
      if (res.success) {
        const cut = 1 + Math.floor(res.sl / 2);
        w[loc].wp = Math.max(0, w[loc].wp - cut);
        body += "<div>Reduced by <b>" + cut + " WP</b> to " + w[loc].wp + ". Not counted as Treated.</div>";
      } else body += "<div>They bleed on. Try again next round while the Medical Supply lasts.</div>";
      await burnMedical(res.critFail);
    } else if (data.act === "impair") {
      const res = await healRoll("Remove impairment");
      if (res.success && w[loc].imp > 0) { w[loc].imp = Math.max(0, w[loc].imp - 1); body += "<div>The location works again.</div>"; }
      else if (res.success) body += "<div>Nothing was impaired there.</div>";
      else body += "<div>Still impaired.</div>";
      await burnMedical(res.critFail);
    } else if (data.act === "shock") {
      const res = await healRoll("Rouse from Shock");
      if (res.success) {
        await TBE.clearStatus(me, "tbe-prone");
        await TBE.clearStatus(me, "tbe-unconscious");
        await TBE.setShock(me, false);
        body += "<div>Conscious and able to act next round, rolling Initiative as usual.</div>";
      } else body += "<div>They stay down.</div>";
      await burnMedical(res.critFail);
    } else if (data.act === "sepsis") {
      const infectedLocs = locs.filter((L) => w[L]?.inf);
      if (!infectedLocs.length) body += "<div>No infected wounds, no Sepsis check needed.</div>";
      else {
        const infWp = infectedLocs.reduce((a, L) => a + TBE.num(w[L].wp, 0), 0);
        const r = await new Roll("1d20").evaluate();
        rolls.push(r);
        const val = r.total + tough;
        body += "<div>Sepsis die d20: <b>" + r.total + "</b> + Toughness " + tough + " = " + val + " vs total infected WP " + infWp + "</div>";
        if (val <= infWp) {
          const worst = infectedLocs.sort((a, b) => w[b].wp - w[a].wp)[0];
          w[worst].septic = true;
          body += "<div>The infection spreads: <b>" + label(worst) + "</b> turns <b>SEPTIC</b>. -30 to all skills, and " + me.name +
            " dies within 48 hours unless it's treated (Heal at -10, twice) or amputated (emergency Heal at -20).</div>";
        } else body += "<div>The infection holds steady for now.</div>";
      }
    } else if (data.act === "recover") {
      const area = { safe: ["all spent Resolve", 3], neutral: ["up to 3 Resolve", 2], precarious: ["up to 2 Resolve", 1], dangerous: ["up to 1 Resolve", 0] }[data.area || "neutral"];
      body += "<div>Rest in a <b>" + (data.area || "neutral") + "</b> area: recover " + area[0] + ", remove " + area[1] + " Fatigue.</div>";
      let any = false;
      for (const L of locs) {
        if (!w[L] || w[L].wp <= 0) continue;
        if (w[L].inf) { body += "<div>" + label(L) + ": infected, no Recovery roll.</div>"; continue; }
        any = true;
        const rb = TBE.num(w[L].rb, -20);
        const skill = TBE.num(data.end, 40) + rb + mod;
        const r = await TBE.d100();
        rolls.push(r);
        const res = TBE.resolve(r.total, skill, endurance?.expertise ?? 0);
        let line = label(L) + ": Endurance " + skill + " (RB " + (rb >= 0 ? "+" : "") + rb + ") <b>" + TBE.face(res.roll) + "</b> " + TBE.tag(res);
        if (res.success) {
          const cut = 1 + Math.floor(res.sl / 3);
          w[L].wp = Math.max(0, w[L].wp - cut);
          line += " &rarr; -" + cut + " WP, now " + w[L].wp;
          if (w[L].wp === 0) { w[L].imp = 0; w[L].rb = null; line += ", healed"; }
        } else if (res.critFail) {
          w[L].inf = true;
          line += " &rarr; the wound turns <b>infected</b>";
        }
        body += "<div>" + line + "</div>";
      }
      if (!any) body += "<div>No wounds to recover from.</div>";
      /* Rations for the rest period. */
      if (supply.rations) {
        const s = await TBE.rollSupply(me, "rations");
        if (s.roll) rolls.push(s.roll);
        body += '<div style="font-size:11px;opacity:.85">Rations: ' + s.text + "</div>";
      }
    } else if (data.act === "infect") {
      const total = TBE.totalWp(w);
      if (total <= 0) body += "<div>No lethal wounds, no check needed.</div>";
      else {
        const r = await new Roll("1d20").evaluate();
        rolls.push(r);
        const val = r.total + tough;
        body += "<div>Infection die d20: <b>" + r.total + "</b> + Toughness " + tough + " = " + val + " vs total lethal WP " + total + "</div>";
        if (val <= total) {
          const candidates = locs.filter((L) => w[L] && w[L].wp > 0 && !w[L].inf).sort((a, b) => w[b].wp - w[a].wp);
          if (candidates.length) {
            w[candidates[0]].inf = true;
            body += "<div>The " + w[candidates[0]].wp + " WP wound in <b>" + label(candidates[0]) + "</b> becomes <b>infected</b>. Make a Sepsis check.</div>";
          } else body += "<div>Every wound is already infected. Sepsis check.</div>";
        } else body += "<div>The wounds stay clean.</div>";
      }
    } else if (data.act === "purge") {
      const wasSeptic = !!w[loc].septic;
      const res = await healRoll("Purge infection", wasSeptic ? -10 : 0);
      if (res.success) {
        w[loc].inf = false;
        if (wasSeptic) {
          w[loc].septic = false;
          const penalty = TBE.num(me.system?.lethalityPenalty, 0) + 1;
          try { await me.update({ "system.lethalityPenalty": penalty }); } catch (ePen) {}
          body += "<div>The infection is cleaned out, but surviving sepsis costs " + me.name + " a permanent <b>-1 Lethality Level</b> (total -" + penalty + " so far).</div>";
        } else body += "<div>The infection is cleaned out.</div>";
      } else if (wasSeptic) {
        body += "<div>Still septic. One more failed attempt today and only an emergency amputation (Heal at -20) can save " + me.name + ".</div>";
      } else body += "<div>It festers still.</div>";
      await burnMedical(res.critFail);
    } else if (data.act === "add") {
      const wp = TBE.num(data.wp, 3);
      w[loc].wp += wp;
      body += "<div>Recorded <b>" + wp + " WP</b> in " + label(loc) + ", now " + w[loc].wp + ".</div>";
    } else if (data.act === "clear") {
      w[loc] = TBE.emptyWoundLoc();
      body += "<div>" + label(loc) + " cleared.</div>";
    }

    await TBE.setWounds(me, w);
    await TBE.syncStatuses(me);

    /* Keep the Death Threshold in step with total lethal WP. */
    const dt = me.system?.deathThreshold;
    if (dt && typeof dt.max === "number" && dt.max > 0) {
      const left = Math.max(0, dt.max - TBE.totalWp(w));
      try { await me.update({ "system.deathThreshold.value": left }); } catch (e) {}
      body += "<div style='border-top:1px solid #7a6a4f;margin-top:4px;padding-top:4px'><b>" + left + " / " + dt.max + "</b> before the Death Threshold</div>";
    }
    body += TBE.woundTable(w);
    await TBE.say(TBE.card("Wounds & Recovery", body), rolls);
  }
}
