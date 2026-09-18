/* TBE: Extended Roll (Ch.2, p.22) — tasks that take more than one roll to
 * resolve: crafting, research, tracking, climbing, anything the GM sets a
 * target Success Level total and an interval for. Persists between macro
 * runs (a tracker per undertaking, in the world's "encounters" setting) so
 * the party can come back to it across sessions.
 *
 * Per interval, every participant who rolls contributes: the single highest
 * successful roll counts in full, and up to two more successful rolls each
 * add +1 SL (p.23, "Multiple Participants"). A critical failure anywhere in
 * the interval halves the accumulated total (round up) after that interval's
 * SLs are added. Reaching the required SLs succeeds; running out of the
 * optional Limit of intervals fails.
 *
 * Investigations & Mysteries (Ch.13, p.267-269) is this same mechanic with a
 * framing, not a different one: "Treat the investigation as an extended roll
 * with a Gradual Outcome, where every 3 SLs uncovers one clue." That reading
 * is shown as a derived clue count below rather than duplicated as a second
 * tracker kind. Its Suspicion Die variant ("the Timer Die can represent
 * suspicion or exposure rather than time pressure... delay rolling it until
 * a certain threshold") is the Tolerance field and the "Exposed" Timer
 * effect, both general enough to also suit a stealthy Extended Roll that
 * has nothing to do with an investigation. */

const all = TBE.trackers();
const active = Object.values(all).filter((t) => t.kind === "extended" && t.status === "active");

/* "Every 3 SLs uncovers one clue" (p.267) — read directly off the running
 * total. Shown for every tracker, not just ones the GM has named as an
 * investigation, since the arithmetic is the same either way and this is
 * just a friendlier readout of it. */
const clueNote = (t) => t.total >= 3 ? " &middot; ~" + Math.floor(t.total / 3) + " clue(s) so far" : "";

const statusBlock = active.length
  ? active.map((t) => {
      const pending = t.current.length
        ? " &middot; " + t.current.length + " roll(s) logged this interval, not yet resolved"
        : "";
      const tolNote = t.tolerance ? " &middot; Timer starts after interval " + t.tolerance : "";
      return "<div><b>" + t.name + "</b>: " + t.total + " / " + t.slsRequired + " SLs, interval " +
        t.intervalsUsed + (t.limit ? " of " + t.limit : "") + clueNote(t) + tolNote + pending + "</div>";
    }).join("")
  : "<div style='opacity:.75'>No active Extended Rolls.</div>";

const trackerOpts = active.map((t) => '<option value="' + t.id + '">' + t.name + " (" + t.total + "/" + t.slsRequired + ")</option>").join("");

const me = TBE.me();
const skillPick = TBE.skillOptions("pick", "Skill from sheet");

const content =
  '<div style="font-size:13px">' + statusBlock + "<hr>" +
  '<label style="display:block">Tracker: <select name="tracker" style="width:100%">' +
  '<option value="">-- Start a new Extended Roll --</option>' + trackerOpts + "</select></label>" +
  '<label style="display:block">Action (ignored when starting new): <select name="act" style="width:100%">' +
  '<option value="attempt">Make an attempt (roll a skill this interval)</option>' +
  '<option value="resolve">Resolve this interval &amp; advance</option>' +
  '<option value="abandon">Abandon / clear this tracker</option>' +
  "</select></label>" +
  "<hr><b>New tracker</b>" +
  '<label style="display:block">Name: <input type="text" name="name" value="Extended Roll" style="width:100%"></label>' +
  '<label style="display:block">SLs required: <input type="number" name="req" value="9" style="width:100%"></label>' +
  /* Dwarves "reduce the required SLs of any extended Craft: Practical or
   * Craft: Artistic roll by 2" (Ch.5). It was prose in the race entry and
   * nothing applied it, so tick this when the tracker is a Craft task. */
  (me?.system?.race === "Dwarf"
    ? '<label style="display:block;font-size:12px"><input type="checkbox" name="dwarfCraft"> ' +
      "This is a <b>Craft: Practical</b> or <b>Craft: Artistic</b> task &mdash; Dwarven craft reduces the requirement by 2</label>"
    : "") +
  '<label style="display:block">Interval (label only, e.g. "1 day"): <input type="text" name="interval" value="1 day" style="width:100%"></label>' +
  '<label style="display:block">Limit in intervals (0 = none): <input type="number" name="limit" value="0" style="width:100%"></label>' +
  /* p.24, "extended rolls: the timer die". A dynamic time limit instead of a
   * fixed one: rolled after each interval, it fires when it comes up equal to
   * or under the number of intervals passed, so the pressure rises on its own.
   * Both choices are made here, at setup, because the book is explicit that
   * "The GM should decide which it will be before any skills are rolled." */
  '<label style="display:block">Timer Die (p.24, optional): <select name="timer" style="width:100%">' +
  '<option value="">None</option>' +
  ["d6", "d8", "d10", "d12", "d20"].map((d) => '<option value="' + d + '"' + (d === "d10" ? "" : "") + ">" + d +
    (d === "d10" ? " (the book's standard)" : d === "d6" ? " (most pressure)" : d === "d20" ? " (least)" : "") + "</option>").join("") +
  "</select></label>" +
  /* p.269, "Variant: Suspicion Die" — "You may delay rolling it until a
   * certain threshold (for example, after three failed rolls; this is a
   * kind of Tolerance)." The book gives that as one example threshold, not
   * a formula, so this is exposed as a plain interval count the GM sets to
   * whatever their table's threshold is, rather than silently assuming
   * "count of failed rolls" is the only valid reading. */
  '<label style="display:block">Tolerance &mdash; don\'t roll the Timer until after interval # (0 = normal, p.269 Suspicion Die variant): ' +
  '<input type="number" name="tolerance" value="0" style="width:100%"></label>' +
  '<label style="display:block">When the Timer fires: <select name="timerEffect" style="width:100%">' +
  '<option value="complication">A random complication (two Event Randomizer words)</option>' +
  '<option value="end">The situation comes to a premature end</option>' +
  '<option value="expose">Exposed &mdash; cover is blown / it unravels (Suspicion Die, p.269)</option>' +
  "</select></label>" +
  "<hr><b>Attempt</b>" +
  '<label style="display:block">Participant: <input type="text" name="who" value="' + (me?.name ?? "") + '" style="width:100%"></label>' +
  skillPick +
  TBE.encNote(me) +
  TBE.riderNote(me) +
  '<label style="display:block">Skill name (if not picked above): <input type="text" name="skillName" value="" style="width:100%"></label>' +
  '<label style="display:block">Skill value (if not picked above): <input type="number" name="skillValue" value="50" style="width:100%"></label>' +
  /* This macro had a note about the encumbrance penalty (above) but no
   * modifier field at all to put it in -- unlike Skill Roll/Opposed Roll/
   * Haggle, which had the field but left it hardcoded to 0. Added here for
   * parity, prefilled the same way. */
  '<label style="display:block">Modifier: <input type="number" name="mod" value="' + TBE.encMod(me) + '" style="width:100%"></label>' +
  "</div>";

const data = await TBE.prompt("Extended Roll", content, "Go");
if (data) {
  const rolls = [];
  let body = "";

  if (!data.tracker) {
    /* ---- start a new tracker ---- */
    const req = Math.max(1, TBE.num(data.req, 9));
    const dwarfCraft = me?.system?.race === "Dwarf" && (data.dwarfCraft === "on" || data.dwarfCraft === true);
    const reqFinal = dwarfCraft ? Math.max(1, req - 2) : req;
    const limit = Math.max(0, TBE.num(data.limit, 0));
    const tolerance = Math.max(0, TBE.num(data.tolerance, 0));
    const t = {
      id: TBE.newTrackerId(), kind: "extended", status: "active",
      name: (data.name || "Extended Roll").trim(), slsRequired: reqFinal,
      intervalLabel: (data.interval || "").trim(), limit,
      timer: (data.timer || "").trim(), tolerance,
      timerEffect: data.timerEffect === "end" ? "end" : data.timerEffect === "expose" ? "expose" : "complication",
      intervalsUsed: 0, total: 0, current: [], log: []
    };
    await TBE.saveTracker(t);
    const timerEffectLabel = t.timerEffect === "end" ? "premature end" : t.timerEffect === "expose" ? "exposed / cover blown" : "a complication";
    body = "<div><b>" + t.name + "</b> started: " + reqFinal + " SLs required" +
      (dwarfCraft ? " <span style='font-size:11px;opacity:.8'>(" + req + " &minus; 2, Dwarven craft)</span>" : "") +
      (t.intervalLabel ? ", interval " + t.intervalLabel : "") +
      (limit ? ", limit " + limit + " intervals" : "") +
      (t.timer ? ", Timer Die " + t.timer + (tolerance ? " (starts after interval " + tolerance + ")" : "") +
        " (fires as: " + timerEffectLabel + ")" : "") + ".</div>";
  } else {
    const t = all[data.tracker];
    if (!t || t.status !== "active") {
      ui.notifications?.warn("TBE: that tracker is no longer active.");
    } else if (data.act === "abandon") {
      await TBE.deleteTracker(t.id);
      body = "<div><b>" + t.name + "</b> abandoned and cleared" +
        (t.total ? " (" + t.total + " SLs were banked, now lost)" : "") + ".</div>";
    } else if (data.act === "resolve") {
      const successes = t.current.filter((a) => a.r.success);
      const anyCritFail = t.current.some((a) => a.r.critFail);
      let delta = 0;
      if (successes.length) {
        successes.sort((a, b) => b.r.sl - a.r.sl);
        delta = successes[0].r.sl + Math.min(2, successes.length - 1);
      }
      const before = t.total;
      let running = before + delta;
      if (anyCritFail) running = TBE.halveUp(running);
      t.total = running;
      t.intervalsUsed += 1;
      const attemptLines = t.current.length
        ? t.current.map((a) => "&nbsp;&nbsp;" + a.actorName + " &middot; " + a.skillName + " (" + a.skillValue + "): " +
            TBE.tag(a.r) + ", " + TBE.face(a.roll.total) + (a.r.success ? " &rarr; " + a.r.sl + " SL" : "")).join("<br>")
        : "&nbsp;&nbsp;no rolls were logged this interval";
      t.current = [];
      t.log.push("Interval " + t.intervalsUsed + ": " + before + " &rarr; " + running + " SLs" + (anyCritFail ? " (critical failure halved the total)" : ""));
      /* The Timer Die, rolled after the interval resolves: "If the result is
       * equal to or less than the number of intervals passed so far, a random
       * complication arises, or the conflict or situation comes to a premature
       * end" (p.24). Which of the two was fixed at setup. A timer firing does
       * not undo the SLs already banked; success this same interval still
       * counts, so it is checked first. */
      let timerLine = "";
      let timerFired = false;
      /* Tolerance (p.269, Suspicion Die): the Timer isn't rolled at all until
       * more than `tolerance` intervals have passed. 0 (the default) is the
       * plain p.24 rule -- roll every interval. */
      if (t.timer && running < t.slsRequired && t.intervalsUsed > (t.tolerance || 0)) {
        const tRoll = await new Roll("1" + t.timer).evaluate();
        rolls.push(tRoll);
        timerFired = tRoll.total <= t.intervalsUsed;
        timerLine = "<div style='margin-top:4px'>Timer Die " + t.timer + ": <b>" + tRoll.total +
          "</b> vs " + t.intervalsUsed + " interval" + (t.intervalsUsed === 1 ? "" : "s") + " passed &mdash; " +
          (timerFired ? "<b>it fires</b>" : "no effect") + ".</div>";
        if (timerFired) t.log.push("Timer Die " + t.timer + " fired on interval " + t.intervalsUsed);
      }

      if (running >= t.slsRequired) t.status = "success";
      else if (timerFired && t.timerEffect === "end") t.status = "timedout";
      else if (timerFired && t.timerEffect === "expose") t.status = "exposed";
      else if (t.limit && t.intervalsUsed >= t.limit) t.status = "failed";
      body = "<div><b>" + t.name + "</b> &middot; interval " + t.intervalsUsed + (t.limit ? " of " + t.limit : "") + "</div>" +
        "<div style='font-size:12px;margin:2px 0'>" + attemptLines + "</div>" +
        "<div>Total: <b>" + before + " &rarr; " + running + "</b> / " + t.slsRequired + " SLs required" + clueNote(t) +
        (anyCritFail ? " &middot; a critical failure halved the interval's total" : "") + "</div>" + timerLine;
      if (t.status === "success") { body += "<div style='font-weight:bold;color:#1f7a1f'>SUCCESS &mdash; the task is complete.</div>"; await TBE.deleteTracker(t.id); }
      else if (t.status === "timedout") {
        body += "<div style='font-weight:bold;color:#8b1a1a'>OUT OF TIME &mdash; the Timer Die ended it at " +
          running + " of " + t.slsRequired + " SLs.</div>";
        await TBE.deleteTracker(t.id);
      }
      else if (t.status === "exposed") {
        body += "<div style='font-weight:bold;color:#8b1a1a'>EXPOSED &mdash; cover is blown, or the situation unravels " +
          "(Suspicion Die, p.269) at " + running + " of " + t.slsRequired + " SLs.</div>";
        await TBE.deleteTracker(t.id);
      }
      else if (t.status === "failed") { body += "<div style='font-weight:bold;color:#8b1a1a'>FAILURE &mdash; the limit of " + t.limit + " intervals ran out.</div>"; await TBE.deleteTracker(t.id); }
      else {
        /* "Roll twice on the Event Randomizers Tables and construe in whatever
         * order makes sense. The resulting complication should always create a
         * new obstacle for someone involved in the extended roll." (p.24) */
        if (timerFired && t.timerEffect === "complication") {
          const w1 = await TBE.drawTable("TBE: Event Randomizers I");
          const w2 = await TBE.drawTable("TBE: Event Randomizers II");
          body += "<div style='margin-top:3px'><b>Complication:</b> " +
            (w1?.text || "?") + " &middot; " + (w2?.text || "?") +
            "<div style='font-size:11px;opacity:.8'>Construe in whichever order makes sense. It should put a new obstacle in front of someone involved &mdash; it can make the next roll harder, it does not take SLs away.</div></div>";
        }
        await TBE.saveTracker(t);
      }
    } else {
      /* ---- attempt ---- */
      const pick = TBE.readPick(data.pick);
      const skillName = pick ? pick.name : (data.skillName || "Untitled skill").trim();
      const skillValue = (pick ? pick.value : TBE.num(data.skillValue, 50)) + TBE.num(data.mod, 0);
      const who = (data.who || me?.name || "Someone").trim();
      const { roll, r } = await TBE.rollAttempt(skillValue, pick ? pick.expertise : 0);
      rolls.push(roll);
      t.current.push({ actorName: who, skillName, skillValue, roll, r });
      await TBE.saveTracker(t);
      body = "<div><b>" + who + "</b> &middot; " + skillName + " (" + skillValue + "): " +
        TBE.face(roll.total) + " vs " + skillValue + " &rarr; <b>" + TBE.tag(r) + "</b>" +
        (r.success ? ", " + r.sl + " SL" : "") + (r.notes.length ? " (" + r.notes.join(", ") + ")" : "") + "</div>" +
        "<div style='font-size:11px;opacity:.8'>" + t.current.length + " roll(s) logged for this interval of &ldquo;" + t.name +
        "&rdquo;. Resolve the interval once everyone who's contributing has rolled.</div>";
    }
  }

  await TBE.say(TBE.card("TBE Extended Roll", body), rolls);
}
