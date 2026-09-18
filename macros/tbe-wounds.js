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
  let w = TBE.wounds(me); /* reassigned after a rest removes fatigue-based WP */
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
    /* TBE.prompt is a one-shot dialog with no live re-render (see TBE Attack
     * and Social Encounter for the same constraint), so this whole ten-
     * action form renders at once -- Location is ignored by three actions
     * (Shock, Recover, Infection/Sepsis checks), the modifier field by five,
     * and nothing used to say so. Each field below is now labeled with
     * which action(s) actually read it, the same fix applied to
     * Advancement's GM-award/New-skill/Weave-Magic sections. */
    (hurt.length ? '<label style="display:block">Location <span style="font-size:11px;opacity:.7">(Treat / Stabilize / Remove impairment / Purge infection / Record a wound / Clear a location)</span>: <select name="loc" style="width:100%">' + locOpts(hurt) + "</select></label>"
                 : '<label style="display:block">Location <span style="font-size:11px;opacity:.7">(Treat / Stabilize / Remove impairment / Purge infection / Record a wound / Clear a location)</span>: <select name="loc" style="width:100%">' + locOpts(locs) + "</select></label>") +
    '<label style="display:block">Healer\'s Heal skill <span style="font-size:11px;opacity:.7">(Treat / Stabilize / Remove impairment / Shock / Purge infection)</span>: <input type="number" name="healSkill" value="' + (heal?.value ?? 30) + '" style="width:100%"></label>' +
    '<label style="display:block">Endurance (for Recovery) <span style="font-size:11px;opacity:.7">(Rest and Recovery rolls only)</span>: <input type="number" name="end" value="' + (endurance?.value ?? 40) + '" style="width:100%"></label>' +
    '<label style="display:block">Cleanliness / task modifier <span style="font-size:11px;opacity:.7">(Treat / Stabilize / Remove impairment / Shock / Purge infection)</span>: <select name="mod" style="width:100%">' +
    '<option value="20">Temple or clean sickroom +20</option><option value="10">Good shelter +10</option>' +
    '<option value="0" selected>Average +0</option><option value="-10">Camp in the wild -10</option>' +
    '<option value="-20">Filthy hole -20</option></select></label>' +
    '<label style="display:block">Wound Points (recording by hand) <span style="font-size:11px;opacity:.7">(Record a wound by hand only)</span>: <input type="number" name="wp" value="3" style="width:100%"></label>' +
    '<label style="display:block">Rest area <span style="font-size:11px;opacity:.7">(Rest and make Recovery rolls only)</span>: <select name="area" style="width:100%">' +
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
      /* p.182 "Resolve & Fatigue Recovery" table (verified verbatim against
       * /tmp/tbe.txt): the sentence above always claimed this happened, but
       * nothing here ever wrote system.resolve.value or system.fatigue --
       * the actor's real numbers silently drifted from what the chat card
       * said. Fixed by actually applying both, capped correctly (Resolve
       * never past max, Fatigue never below 0). Fatigue-based wounds (Weary,
       * Weave, ...) are tracked now, and p.189 ties them to this same rest:
       * "If you remove any amount of Fatigue by resting, remove an equivalent
       * amount of WP from a Weary wound." TBE.removeFatigue() owns both halves. */
      // p.182's table: Resolve cap and Fatigue removed are DIFFERENT numbers
      // per area (Neutral is 3 Resolve but only 2 Fatigue, etc.) -- kept as
      // two explicit maps rather than reusing one of `area`'s two values for
      // both, which is the mistake an earlier draft of this fix made.
      const resolveCap = { safe: Infinity, neutral: 3, precarious: 2, dangerous: 1 }[data.area || "neutral"];
      const fatigueCap = { safe: 3, neutral: 2, precarious: 1, dangerous: 0 }[data.area || "neutral"];
      const resolve = me.system?.resolve;
      let resolveGained = 0;
      if (resolve && typeof resolve.value === "number" && typeof resolve.max === "number" && resolve.value < resolve.max) {
        const missing = resolve.max - resolve.value;
        resolveGained = Math.min(missing, resolveCap);
        if (resolveGained > 0) { try { await me.update({ "system.resolve.value": resolve.value + resolveGained }); } catch (e) {} }
      }
      const curFatigue = TBE.num(me.system?.fatigue, 0);
      const rest = await TBE.removeFatigue(me, fatigueCap);
      const fatigueRemoved = rest.removed;
      body += "<div>Rest in a <b>" + (data.area || "neutral") + "</b> area: recovers <b>" + resolveGained + " Resolve</b>" +
        ", removes <b>" + fatigueRemoved + " Fatigue</b>" + (curFatigue > fatigueRemoved ? " (" + (curFatigue - fatigueRemoved) + " left)" : "") + ".</div>" +
        (rest.woundHealed
          ? "<div>The same rest takes <b>" + rest.woundHealed + " WP</b> off the " +
            [...new Set(rest.kinds)].join(" / ") + " wound (p.189).</div>"
          : "");
      /* A full night's rest crosses a sunrise or a sunset, which is exactly
         when Ch.14's lingering Weave effects end (p.302-303). Nothing else in
         the pack had a natural place to clear them. */
      const weaveHad = await TBE.clearWeaveDay(me);
      if (weaveHad.scars || weaveHad.snag) {
        body += "<div>The night also ends " +
          [weaveHad.scars ? weaveHad.scars + " Weave Scar" + (weaveHad.scars === 1 ? "" : "s") : "",
            weaveHad.snag ? "the Reality Snag" : ""].filter(Boolean).join(" and ") + " (p.302-303).</div>";
      }

      /* The wounds map was read before the rest; re-read it so the Recovery
         loop below sees the points this rest just removed. */
      w = TBE.wounds(me);
      let any = false;
      for (const L of locs) {
        if (!w[L] || w[L].wp <= 0) continue;
        /* p.189: fatigue-based wounds "cannot be treated with Heal, or make
           Recovery rolls" -- only the rest above touches them. A location
           holding nothing else has no roll to make. */
        if (TBE.treatableWp(w[L]) <= 0) {
          body += "<div>" + label(L) + ": " + (w[L].fwKind || "fatigue") +
            " wound, " + w[L].fw + " WP &mdash; no Recovery roll, only rest removes it (p.189).</div>";
          continue;
        }
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

    /* Keep the Death Threshold in step with total lethal WP, and report
     * Dying/Lethality Level alongside it -- see TBE.deathThresholdNote. */
    const dtNote = TBE.deathThresholdNote(me, TBE.totalWp(w));
    if (dtNote) {
      try { await me.update({ "system.deathThreshold.value": dtNote.left }); } catch (e) {}
      body += "<div style='border-top:1px solid #7a6a4f;margin-top:4px;padding-top:4px'>" + dtNote.line + "</div>";
    }
    body += TBE.woundTable(w);
    await TBE.say(TBE.card("Wounds & Recovery", body), rolls);
  }
}
