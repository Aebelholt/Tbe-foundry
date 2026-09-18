/* TBE: Chase (Ch.13, p.269-270) — Quick Chases (a single opposed roll) and
 * Prolonged Chases (a two-sided race between pursuer and prey, each
 * accumulating SLs toward a shared target, with an optional per-round
 * Timer Die).
 *
 * Quick Chase reuses TBE.opposedResolve() (_lib.js), the same tie-break
 * cascade TBE: Opposed Roll uses -- the book gives Quick Chases no special
 * tie rule of their own ("make opposed Athletics rolls. The winner catches
 * the loser"), so the general cascade applies rather than a second copy of it.
 *
 * Prolonged Chase is its own tracker kind, not a reuse of TBE: Extended
 * Roll's or TBE: Social Encounter (Competitive)'s tracker shapes: neither
 * has a Timer Die keyed to the round number, and Chases' own premature-end
 * tie-break ("the most recent highest roll wins") and simultaneous-target
 * tie-break ("play one more round") aren't in either of those. What IS
 * shared -- rolling a skill (TBE.rollAttempt), critical failure halving a
 * running total (TBE.halveUp), and drawing the Event Randomizer tables for
 * a complication (TBE.drawTable) -- is reused, not reimplemented, below.
 */

const all = TBE.trackers();
const active = Object.values(all).filter((t) => t.kind === "chase" && t.status === "active");

const statusBlock = active.length
  ? active.map((t) => {
      const pend = [];
      if (t.current.pursuer) pend.push(t.pursuerName + " rolled");
      if (t.current.prey) pend.push(t.preyName + " rolled");
      const pending = pend.length ? " &middot; this round: " + pend.join(", ") + ", not yet resolved" : "";
      return "<div><b>" + t.name + "</b> &middot; round " + t.round + ": " +
        t.pursuerName + " " + t.pursuerTotal + " / " + t.preyName + " " + t.preyTotal + " (target " + t.target + " SLs)" +
        (t.suddenDeath ? " &mdash; <b>tied at target, sudden death</b>" : "") + pending + "</div>";
    }).join("")
  : "<div style='opacity:.75'>No active Prolonged Chases.</div>";

const trackerOpts = active.map((t) => '<option value="' + t.id + '">' + t.name + " (" + t.pursuerTotal + "/" + t.preyTotal + ")</option>").join("");

const me = TBE.me();
const skillPick = TBE.skillOptions("pick", "Your skill from sheet");
const expOpts = '<option value="0" selected>None</option><option value="2">Ex2</option>' +
  '<option value="3">Ex3</option><option value="4">Ex4</option>';

const content =
  '<div style="font-size:13px">' +
  '<label style="display:block">Mode: <select name="mode" style="width:100%">' +
  '<option value="track">Prolonged Chase (tracker, p.269-270)</option>' +
  '<option value="quick">Quick Chase (single opposed roll, decides now, p.269)</option>' +
  "</select></label><hr>" +
  "<b>Prolonged Chase</b>" + statusBlock +
  '<label style="display:block">Tracker: <select name="tracker" style="width:100%">' +
  '<option value="">-- Start a new Prolonged Chase --</option>' + trackerOpts + "</select></label>" +
  '<label style="display:block">Action (ignored when starting new): <select name="act" style="width:100%">' +
  '<option value="attempt">Log a roll for a side</option>' +
  '<option value="resolve">Resolve this round</option>' +
  '<option value="end">End now (declare by current totals)</option>' +
  '<option value="abandon">Abandon / clear this tracker</option>' +
  "</select></label>" +
  "<hr><b>New tracker</b>" +
  '<label style="display:block">Name: <input type="text" name="name" value="Chase" style="width:100%"></label>' +
  '<label style="display:block">Pursuer name: <input type="text" name="pursuerName" value="Pursuer" style="width:100%"></label>' +
  '<label style="display:block">Prey name: <input type="text" name="preyName" value="Prey" style="width:100%"></label>' +
  '<label style="display:block">Target SLs (p.270: most chases need 5-15): <input type="number" name="target" value="8" style="width:100%"></label>' +
  '<label style="display:block">Timer Die (p.270, optional, rolled at the end of every round): <select name="timer" style="width:100%">' +
  '<option value="">None</option>' +
  ["d6", "d8", "d10", "d12", "d20"].map((d) => '<option value="' + d + '"' + (d === "d10" ? " selected" : "") + ">" + d +
    (d === "d10" ? " (the book's example)" : d === "d6" ? " (most pressure)" : d === "d20" ? " (least)" : "") + "</option>").join("") +
  "</select></label>" +
  '<label style="display:block">When the Timer fires: <select name="timerEffect" style="width:100%">' +
  '<option value="complication">A random complication (two Event Randomizer words), assigned to pursuer/prey/both</option>' +
  '<option value="end">The chase comes to a premature end (GM\'s choice)</option>' +
  "</select></label>" +
  "<hr><b>Attempt (Prolonged Chase)</b>" +
  '<label style="display:block">Rolling for: <select name="side" style="width:100%">' +
  '<option value="pursuer">Pursuer</option><option value="prey">Prey</option></select></label>' +
  '<label style="display:block">Participant: <input type="text" name="who" value="' + (me?.name ?? "") + '" style="width:100%"></label>' +
  skillPick +
  TBE.encNote(me) +
  TBE.riderNote(me) +
  '<label style="display:block">Skill name (if not picked above): <input type="text" name="skillName" value="" style="width:100%"></label>' +
  '<label style="display:block">Skill value (if not picked above): <input type="number" name="skillValue" value="50" style="width:100%"></label>' +
  '<label style="display:block">Modifier: <input type="number" name="mod" value="' + TBE.encMod(me) + '" style="width:100%"></label>' +
  "<hr><b>Quick Chase</b> (p.269, one opposed roll decides it)" +
  '<label style="display:block">Your side is the: <select name="qSide" style="width:100%">' +
  '<option value="pursuer">Pursuer</option><option value="prey">Prey</option></select></label>' +
  '<div style="font-weight:bold;margin-top:2px">Your side</div>' +
  TBE.skillOptions("qPick", "Skill from sheet") +
  '<label style="display:block">Name: <input type="text" name="qNameA" value="' + (me?.name ?? "You") + '" style="width:100%"></label>' +
  '<label style="display:block">Skill (if not picked above): <input type="number" name="qSkillA" value="50" style="width:100%"></label>' +
  '<label style="display:block">Modifier: <input type="number" name="qModA" value="' + TBE.encMod(me) + '" style="width:100%"></label>' +
  '<label style="display:block">Expertise (if not picked above): <select name="qExpA" style="width:100%">' + expOpts + "</select></label>" +
  '<div style="font-weight:bold;margin-top:4px">Opponent</div>' +
  '<label style="display:block">Name: <input type="text" name="qNameB" value="Opponent" style="width:100%"></label>' +
  '<label style="display:block">Skill: <input type="number" name="qSkillB" value="50" style="width:100%"></label>' +
  '<label style="display:block">Modifier (p.269: +20 if this side has a significant head start): <input type="number" name="qModB" value="0" style="width:100%"></label>' +
  '<label style="display:block">Expertise: <select name="qExpB" style="width:100%">' + expOpts + "</select></label>" +
  "</div>";

const data = await TBE.prompt("TBE Chase", content, "Go");
if (data) {
  const rolls = [];
  let body = "";

  if (data.mode === "quick") {
    /* ---- Quick Chase: one opposed roll, TBE.opposedResolve() decides it ---- */
    const pick = TBE.readPick(data.qPick);
    const nameA = (data.qNameA || "You").trim();
    const nameB = (data.qNameB || "Opponent").trim();
    const skillA = (pick ? pick.value : TBE.num(data.qSkillA, 50)) + TBE.num(data.qModA, 0);
    const expA = pick ? pick.expertise : TBE.num(data.qExpA, 0);
    const skillB = TBE.num(data.qSkillB, 50) + TBE.num(data.qModB, 0);
    const expB = TBE.num(data.qExpB, 0);

    const rollA = await TBE.d100();
    const resA = TBE.resolve(rollA.total, skillA, expA);
    const rollB = await TBE.d100();
    const resB = TBE.resolve(rollB.total, skillB, expB);
    rolls.push(rollA, rollB);

    const A = { name: nameA, kind: "roll", res: resA, sl: resA.success ? resA.sl : 0, ok: resA.success, skill: skillA };
    const B = { name: nameB, kind: "roll", res: resB, sl: resB.success ? resB.sl : 0, ok: resB.success, skill: skillB };
    const { winner, why } = TBE.opposedResolve(A, B);

    const line = (S, target) => "<div><b>" + S.name + "</b> (target " + target + "): <b>" + TBE.face(S.res.roll) + "</b> &mdash; " +
      '<span style="color:' + TBE.colour(S.res) + '">' + TBE.tag(S.res) + "</span>" + (S.res.success ? ", " + S.res.sl + " SL" : "") + "</div>";

    const yourSideIsPursuer = data.qSide !== "prey";
    const pursuerSide = yourSideIsPursuer ? A : B;
    const preySide = yourSideIsPursuer ? B : A;
    let outcomeLine;
    if (!winner) outcomeLine = "<b>No one catches anyone.</b> " + why + ".";
    else if (winner === pursuerSide) outcomeLine = "<b>" + pursuerSide.name + " catches " + preySide.name + "</b> and Engages them. <span style='font-size:11px;opacity:.8'>(" + why + ")</span>";
    else outcomeLine = "<b>" + preySide.name + " escapes.</b> <span style='font-size:11px;opacity:.8'>(" + why + ")</span>";

    body = line(A, skillA) + line(B, skillB) +
      '<div style="border-top:1px solid #7a6a4f;margin-top:4px;padding-top:4px">' + outcomeLine + "</div>";
  } else if (!data.tracker) {
    /* ---- start a new Prolonged Chase tracker ---- */
    const target = Math.max(1, TBE.num(data.target, 8));
    const t = {
      id: TBE.newTrackerId(), kind: "chase", status: "active",
      name: (data.name || "Chase").trim(),
      pursuerName: (data.pursuerName || "Pursuer").trim(),
      preyName: (data.preyName || "Prey").trim(),
      target, round: 0, pursuerTotal: 0, preyTotal: 0,
      pursuerLastRoll: null, preyLastRoll: null, suddenDeath: false,
      timer: (data.timer || "").trim(),
      timerEffect: data.timerEffect === "end" ? "end" : "complication",
      current: { pursuer: null, prey: null }, log: []
    };
    await TBE.saveTracker(t);
    body = "<div><b>" + t.name + "</b> started: " + t.pursuerName + " vs " + t.preyName + ", target " + target + " SLs" +
      (t.timer ? ", Timer Die " + t.timer + " (fires as: " + (t.timerEffect === "end" ? "premature end" : "a complication") + ")" : "") + ".</div>";
  } else {
    const t = all[data.tracker];
    if (!t || t.status !== "active") {
      ui.notifications?.warn("TBE: that chase tracker is no longer active.");
    } else if (data.act === "abandon") {
      await TBE.deleteTracker(t.id);
      body = "<div><b>" + t.name + "</b> abandoned and cleared.</div>";
    } else if (data.act === "attempt") {
      const side = data.side === "prey" ? "prey" : "pursuer";
      const pick = TBE.readPick(data.pick);
      const skillName = pick ? pick.name : (data.skillName || "Untitled skill").trim();
      const skillValue = (pick ? pick.value : TBE.num(data.skillValue, 50)) + TBE.num(data.mod, 0);
      const who = (data.who || me?.name || "Someone").trim();
      const overwritten = !!t.current[side];
      const { roll, r } = await TBE.rollAttempt(skillValue, pick ? pick.expertise : 0);
      rolls.push(roll);
      t.current[side] = { actorName: who, skillName, skillValue, roll, r };
      await TBE.saveTracker(t);
      body = "<div><b>" + who + "</b> (" + (side === "pursuer" ? t.pursuerName : t.preyName) + ") &middot; " + skillName + " (" + skillValue + "): " +
        TBE.face(roll.total) + " vs " + skillValue + " &rarr; <b>" + TBE.tag(r) + "</b>" +
        (r.success ? ", " + r.sl + " SL" : "") + "</div>" +
        (overwritten ? "<div style='font-size:11px;opacity:.8'>Replaces this round's earlier roll for that side (p.270: only one roll per side per round).</div>" : "") +
        "<div style='font-size:11px;opacity:.8'>Resolve the round once both sides who are rolling this round have gone (or resolve with just one, if the other sits this round out).</div>";
    } else if (data.act === "end") {
      /* Declare by current totals, using the same tie-break as a premature
       * Timer Die end below: "a tie of SLs indicates a draw; if a winner is
       * required, the most recent highest roll wins" (p.270). */
      body = endByTotals(t, "declared");
      await TBE.deleteTracker(t.id);
    } else {
      body = await resolveRound(t, rolls);
    }
  }

  await TBE.say(TBE.card("TBE Chase", body), rolls);
}

/* Resolving a round is pulled into its own function (rather than staying
 * inline in the branch above) purely so the Timer-fires-"end" case can
 * finish early with `return` -- a bare top-level `return` isn't legal JS
 * (this file has no wrapping function otherwise), and no other macro in
 * this pack needs one because none of them have an early-exit case nested
 * this deep. */
async function resolveRound(t, rolls) {
  /* ---- resolve this round ---- */
  let body = "";
  const pAtt = t.current.pursuer, yAtt = t.current.prey;
  const pDelta = pAtt && pAtt.r.success ? pAtt.r.sl : 0;
  const yDelta = yAtt && yAtt.r.success ? yAtt.r.sl : 0;
  const beforeP = t.pursuerTotal, beforeY = t.preyTotal;
  /* "Critically failing one of the rolls cuts the current amount of
   * successes in half (round up)" (p.270) -- scoped to whichever side
   * critically failed, not both. */
  let runningP = pAtt && pAtt.r.critFail ? TBE.halveUp(beforeP + pDelta) : beforeP + pDelta;
  let runningY = yAtt && yAtt.r.critFail ? TBE.halveUp(beforeY + yDelta) : beforeY + yDelta;
  t.pursuerTotal = runningP;
  t.preyTotal = runningY;
  t.round += 1;
  if (pAtt) t.pursuerLastRoll = pAtt.roll.total;
  if (yAtt) t.preyLastRoll = yAtt.roll.total;
  t.current = { pursuer: null, prey: null };

  const attLine = (att, label) => att
    ? "&nbsp;&nbsp;" + label + " &mdash; " + att.actorName + " &middot; " + att.skillName + " (" + att.skillValue + "): " +
      TBE.tag(att.r) + ", " + TBE.face(att.roll.total) + (att.r.success ? " &rarr; " + att.r.sl + " SL" : "")
    : "&nbsp;&nbsp;" + label + " &mdash; no roll logged this round";
  const attemptLines = attLine(pAtt, t.pursuerName) + "<br>" + attLine(yAtt, t.preyName);
  t.log.push("Round " + t.round + ": " + t.pursuerName + " " + beforeP + "→" + runningP + ", " + t.preyName + " " + beforeY + "→" + runningY);

  /* Reaching the target: "If one side reaches the target SLs, the chase
   * ends immediately... If both reach the target SLs in the same round,
   * play one more round to break the tie" (p.270). Once t.suddenDeath is
   * set, both totals stay >= target forever (they only grow, or halve on
   * a crit fail, which can only ever lower them), so re-checking "both
   * >= target" every round after that would never resolve anything --
   * the book doesn't spell out how the extra round itself is judged, so
   * this reads "play one more round to break the tie" as: whichever side
   * gains more SL in that round wins outright; a repeat tie plays
   * another round the same way. */
  let outcome = null;
  if (t.suddenDeath) {
    if (pDelta > yDelta) outcome = "pursuer";
    else if (yDelta > pDelta) outcome = "prey";
  } else if (runningP >= t.target && runningY >= t.target) {
    t.suddenDeath = true;
  } else if (runningP >= t.target) {
    outcome = "pursuer";
  } else if (runningY >= t.target) {
    outcome = "prey";
  }

  let timerLine = "";
  if (!outcome && t.timer) {
    const tRoll = await new Roll("1" + t.timer).evaluate();
    rolls.push(tRoll);
    const timerFired = tRoll.total <= t.round;
    timerLine = "<div style='margin-top:4px'>Timer Die " + t.timer + ": <b>" + tRoll.total + "</b> vs round " + t.round +
      " &mdash; " + (timerFired ? "<b>it fires</b>" : "no effect") + ".</div>";
    if (timerFired) {
      t.log.push("Timer Die " + t.timer + " fired on round " + t.round);
      if (t.timerEffect === "end") {
        await TBE.deleteTracker(t.id);
        return "<div><b>" + t.name + "</b> &middot; round " + t.round + "</div>" +
          "<div style='font-size:12px;margin:2px 0'>" + attemptLines + "</div>" + timerLine +
          endByTotals(t, "cut short by the Timer Die");
      } else {
        /* "determine whether it affects the pursuer, the prey, or both"
         * (p.270) -- the book gives no die for that choice, so this rolls
         * a d6 to decide (1-2 pursuer, 3-4 prey, 5-6 both) and says so,
         * rather than silently always picking one. */
        const who = await new Roll("1d6").evaluate();
        rolls.push(who);
        const affects = who.total <= 2 ? t.pursuerName : who.total <= 4 ? t.preyName : "both sides";
        const w1 = await TBE.drawTable("TBE: Event Randomizers I");
        const w2 = await TBE.drawTable("TBE: Event Randomizers II");
        timerLine += "<div style='margin-top:3px'><b>Complication</b> (affects " + affects + "): " +
          (w1?.text || "?") + " &middot; " + (w2?.text || "?") +
          "<div style='font-size:11px;opacity:.8'>Construe in whichever order makes sense; a bonus or penalty to that side's (or both sides') next roll, arising from the immediate surroundings.</div></div>";
      }
    }
  }

  body = "<div><b>" + t.name + "</b> &middot; round " + t.round + "</div>" +
    "<div style='font-size:12px;margin:2px 0'>" + attemptLines + "</div>" +
    "<div>" + t.pursuerName + ": <b>" + beforeP + " &rarr; " + runningP + "</b> / " + t.target + " SLs" +
    (pAtt && pAtt.r.critFail ? " (critical failure, halved)" : "") + "</div>" +
    "<div>" + t.preyName + ": <b>" + beforeY + " &rarr; " + runningY + "</b> / " + t.target + " SLs" +
    (yAtt && yAtt.r.critFail ? " (critical failure, halved)" : "") + "</div>" + timerLine;

  if (t.suddenDeath && !outcome) {
    body += "<div style='font-weight:bold'>Both sides are at the target &mdash; tied. Play one more round to break the tie (p.270).</div>";
    await TBE.saveTracker(t);
  } else if (outcome === "pursuer") {
    body += "<div style='font-weight:bold;color:#1f7a1f'>" + t.pursuerName + " reaches " + t.target + " SLs first &mdash; " +
      t.pursuerName + " catches " + t.preyName + " and Engages them.</div>";
    await TBE.deleteTracker(t.id);
  } else if (outcome === "prey") {
    body += "<div style='font-weight:bold;color:#1f7a1f'>" + t.preyName + " reaches " + t.target + " SLs first &mdash; " +
      t.preyName + " escapes.</div>";
    await TBE.deleteTracker(t.id);
  } else {
    await TBE.saveTracker(t);
  }
  return body;
}

/* "If it ever comes to a premature end, the party with the most SLs at that
 * moment wins (a tie of SLs indicates a draw; if a winner is required, the
 * most recent highest roll wins)" (p.270). Shared by the Timer Die's "end"
 * effect and the manual "End now" action so the tie-break rule has one home. */
function endByTotals(t, why) {
  if (t.pursuerTotal > t.preyTotal) {
    return "<div style='font-weight:bold'>" + why + ": " + t.pursuerName + " leads " + t.pursuerTotal + " to " + t.preyTotal +
      " &mdash; " + t.pursuerName + " catches " + t.preyName + ".</div>";
  }
  if (t.preyTotal > t.pursuerTotal) {
    return "<div style='font-weight:bold'>" + why + ": " + t.preyName + " leads " + t.preyTotal + " to " + t.pursuerTotal +
      " &mdash; " + t.preyName + " escapes.</div>";
  }
  if (t.pursuerLastRoll != null && t.preyLastRoll != null && t.pursuerLastRoll !== t.preyLastRoll) {
    const pWins = t.pursuerLastRoll > t.preyLastRoll;
    return "<div style='font-weight:bold'>" + why + ": tied " + t.pursuerTotal + "-" + t.preyTotal +
      " &mdash; the most recent highest roll wins: " + (pWins ? t.pursuerName + " catches " + t.preyName : t.preyName + " escapes") +
      ".</div>";
  }
  return "<div style='font-weight:bold'>" + why + ": tied " + t.pursuerTotal + "-" + t.preyTotal + " &mdash; a draw. The GM decides.</div>";
}
