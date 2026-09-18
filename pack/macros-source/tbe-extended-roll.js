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
 */

const all = TBE.trackers();
const active = Object.values(all).filter((t) => t.kind === "extended" && t.status === "active");

const statusBlock = active.length
  ? active.map((t) => {
      const pending = t.current.length
        ? " &middot; " + t.current.length + " roll(s) logged this interval, not yet resolved"
        : "";
      return "<div><b>" + t.name + "</b>: " + t.total + " / " + t.slsRequired + " SLs, interval " +
        t.intervalsUsed + (t.limit ? " of " + t.limit : "") + pending + "</div>";
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
  '<label style="display:block">Interval (label only, e.g. "1 day"): <input type="text" name="interval" value="1 day" style="width:100%"></label>' +
  '<label style="display:block">Limit in intervals (0 = none): <input type="number" name="limit" value="0" style="width:100%"></label>' +
  "<hr><b>Attempt</b>" +
  '<label style="display:block">Participant: <input type="text" name="who" value="' + (me?.name ?? "") + '" style="width:100%"></label>' +
  skillPick +
  TBE.encNote(me) +
  '<label style="display:block">Skill name (if not picked above): <input type="text" name="skillName" value="" style="width:100%"></label>' +
  '<label style="display:block">Skill value (if not picked above): <input type="number" name="skillValue" value="50" style="width:100%"></label>' +
  "</div>";

const data = await TBE.prompt("Extended Roll", content, "Go");
if (data) {
  const rolls = [];
  let body = "";

  if (!data.tracker) {
    /* ---- start a new tracker ---- */
    const req = Math.max(1, TBE.num(data.req, 9));
    const limit = Math.max(0, TBE.num(data.limit, 0));
    const t = {
      id: TBE.newTrackerId(), kind: "extended", status: "active",
      name: (data.name || "Extended Roll").trim(), slsRequired: req,
      intervalLabel: (data.interval || "").trim(), limit,
      intervalsUsed: 0, total: 0, current: [], log: []
    };
    await TBE.saveTracker(t);
    body = "<div><b>" + t.name + "</b> started: " + req + " SLs required" +
      (t.intervalLabel ? ", interval " + t.intervalLabel : "") +
      (limit ? ", limit " + limit + " intervals" : "") + ".</div>";
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
      if (running >= t.slsRequired) t.status = "success";
      else if (t.limit && t.intervalsUsed >= t.limit) t.status = "failed";
      body = "<div><b>" + t.name + "</b> &middot; interval " + t.intervalsUsed + (t.limit ? " of " + t.limit : "") + "</div>" +
        "<div style='font-size:12px;margin:2px 0'>" + attemptLines + "</div>" +
        "<div>Total: <b>" + before + " &rarr; " + running + "</b> / " + t.slsRequired + " SLs required" +
        (anyCritFail ? " &middot; a critical failure halved the interval's total" : "") + "</div>";
      if (t.status === "success") { body += "<div style='font-weight:bold;color:#1f7a1f'>SUCCESS &mdash; the task is complete.</div>"; await TBE.deleteTracker(t.id); }
      else if (t.status === "failed") { body += "<div style='font-weight:bold;color:#8b1a1a'>FAILURE &mdash; the limit of " + t.limit + " intervals ran out.</div>"; await TBE.deleteTracker(t.id); }
      else await TBE.saveTracker(t);
    } else {
      /* ---- attempt ---- */
      const pick = TBE.readPick(data.pick);
      const skillName = pick ? pick.name : (data.skillName || "Untitled skill").trim();
      const skillValue = pick ? pick.value : TBE.num(data.skillValue, 50);
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
