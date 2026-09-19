/* TBE: Clocks — retired in v0.28.0, kept only to migrate old worlds.
 *
 * This macro and TBE: Extended Roll were the same rule (Ch.2 p.22-24: a task
 * that takes more than one roll, a target in Success Levels, an interval, an
 * optional limit, and a critical failure that halves the accumulated total)
 * implemented twice, against two different stores. Clocks lived on the flags
 * of a journal named "TBE Clocks"; every other running thing in the pack —
 * Extended Roll, Chase, Ritual, Social Encounter, Summoning — lives in the
 * world's tracker setting behind TBE.trackers().
 *
 * That is not a cosmetic duplication. A clock started here was invisible to
 * TBE: Extended Roll and could not be advanced there, and TBE: Status read
 * only the journal, so a player with five open trackers was told "Clocks:
 * none running". Found by playing a session end to end.
 *
 * Extended Roll is the surviving owner: it does everything a clock did and
 * also carries multiple participants, the Timer Die, Tolerance and the clue
 * readout. So this macro no longer keeps clocks. It moves any it finds into
 * the tracker store as ordinary extended rolls, once, and then says so. */

const JOURNAL = "TBE Clocks";

const j = game.journal.getName(JOURNAL);
const clocks = TBE.flagOf(j, "clocks") ?? [];
const open = clocks.filter((c) => !c.done && !c.failed);

if (!clocks.length) {
  await TBE.say(TBE.card("TBE Clocks",
    "<div><b>TBE: Clocks has been retired.</b> Clocks and Extended Rolls were the same " +
    "rule kept in two different places, so they could never see each other.</div>" +
    "<div style='margin-top:4px'>Run <b>TBE: Extended Roll</b> instead &mdash; it starts, advances " +
    "and finishes the same thing, and TBE: Status now lists every running tracker.</div>" +
    "<div style='font-size:11px;opacity:.8;margin-top:4px'>There was nothing on the " +
    "&ldquo;" + JOURNAL + "&rdquo; journal to move across.</div>"));
} else if (!game.user.isGM) {
  ui.notifications?.warn("TBE: this world still has clocks to migrate to Extended Rolls, and only a GM can do it. Ask your GM to run TBE: Clocks once.");
} else {
  const moved = [];
  for (const c of open) {
    const t = {
      id: TBE.newTrackerId(), kind: "extended", status: "active",
      name: (c.name || "Clock").trim(),
      slsRequired: Math.max(1, TBE.num(c.need, 6)),
      intervalLabel: (c.interval || "").trim(),
      limit: Math.max(0, TBE.num(c.limit, 0)),
      timer: 0, tolerance: 0, timerEffect: "",
      intervalsUsed: Math.max(0, TBE.num(c.used, 0)),
      total: Math.max(0, TBE.num(c.have, 0)),
      current: [],
      log: ["Migrated from TBE: Clocks (v0.28.0) at " + TBE.num(c.have, 0) + " / " + TBE.num(c.need, 6) + " SLs."]
    };
    await TBE.saveTracker(t);
    moved.push(t);
  }

  /* The journal is emptied rather than deleted: a world that ran this twice
     must not create the same tracker twice, and a GM may still want the page. */
  await j.update({ [TBE.flagPath("clocks")]: [], "flags.tbe.-=clocks": null });
  const page = j.pages?.contents?.[0];
  if (page) {
    await page.update({ "text.content":
      "<p>Migrated to Extended Rolls in v0.28.0. Open <b>TBE: Extended Roll</b> to " +
      "advance them; this journal is no longer read by anything.</p>" });
  }

  await TBE.say(TBE.card("TBE Clocks",
    "<div><b>TBE: Clocks has been retired</b>, and its clocks are now Extended Rolls.</div>" +
    (moved.length
      ? "<div style='margin-top:4px'>" + moved.map((t) =>
          "&bull; <b>" + t.name + "</b> &mdash; " + t.total + " / " + t.slsRequired + " SLs" +
          (t.intervalLabel ? ", interval " + t.intervalLabel : "") +
          (t.limit ? ", limit " + t.limit : "")).join("<br>") + "</div>"
      : "") +
    (clocks.length - open.length
      ? "<div style='font-size:11px;opacity:.8;margin-top:4px'>" + (clocks.length - open.length) +
        " closed clock(s) were left behind &mdash; there is nothing left to roll on them.</div>"
      : "") +
    "<div style='margin-top:4px'>Advance them from now on with <b>TBE: Extended Roll</b>. " +
    "TBE: Status lists every running tracker, whatever started it.</div>"));
}
