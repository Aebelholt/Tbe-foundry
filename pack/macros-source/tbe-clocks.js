/* TBE: Clocks — extended rolls as persistent clocks (Chapter 2: Extended Rolls).
 * Clocks live on a journal named "TBE Clocks" and survive reloads. */

const JOURNAL = "TBE Clocks";

const loadJournal = async () => {
  let j = game.journal.getName(JOURNAL);
  if (!j && game.user.isGM) {
    j = await JournalEntry.create({
      name: JOURNAL,
      pages: [{ name: "Clocks", type: "text", text: { content: "<p>No clocks yet.</p>", format: 1 } }]
    });
  }
  return j;
};

const getClocks = (j) => foundry.utils?.duplicate?.(j?.flags?.tbe?.clocks ?? []) ?? JSON.parse(JSON.stringify(j?.flags?.tbe?.clocks ?? []));

const bar = (have, need) => {
  const pct = Math.max(0, Math.min(100, Math.round((have / Math.max(1, need)) * 100)));
  return '<div style="background:rgba(0,0,0,.25);border:1px solid #7a6a4f;border-radius:4px;height:12px;overflow:hidden">' +
    '<div style="width:' + pct + '%;height:100%;background:#8a6d3b"></div></div>';
};

const saveClocks = async (j, clocks) => {
  const rows = clocks.map((c) =>
    "<tr><td>" + c.name + "</td><td>" + c.have + " / " + c.need + " SL</td><td>" +
    (c.limit ? c.used + " / " + c.limit + " " + (c.interval || "intervals") : (c.used + " " + (c.interval || "intervals"))) +
    "</td><td>" + (c.done ? "<b>COMPLETE</b>" : c.failed ? "<b>OUT OF TIME</b>" : "open") + "</td></tr>"
  ).join("");
  const html = clocks.length
    ? "<table border='1' cellpadding='4'><tr><th>Clock</th><th>Progress</th><th>Intervals</th><th>State</th></tr>" + rows + "</table>" +
      "<p style='font-size:11px'>3 SL easy, 6 standard, 9 difficult, 12+ major. A critical failure halves accumulated SLs, rounding up.</p>"
    : "<p>No clocks yet.</p>";
  await j.update({ "flags.tbe.clocks": clocks });
  const page = j.pages?.contents?.[0];
  if (page) await page.update({ "text.content": html });
};

const j = await loadJournal();
if (!j) {
  ui.notifications?.warn("TBE: only a GM can create the clock journal the first time.");
} else {
  const clocks = getClocks(j);
  const open = clocks.filter((c) => !c.done && !c.failed);

  const clockOpts = open.map((c, i) => '<option value="' + i + '">' + c.name + " (" + c.have + "/" + c.need + " SL)</option>").join("");
  const picker = TBE.skillOptions("pick", "Roll a skill from the selected token");

  const content =
    '<div style="font-size:13px">' +
    '<label style="display:block">Action: <select name="act" style="width:100%">' +
    (open.length ? '<option value="advance" selected>Advance a clock</option>' : "") +
    '<option value="new"' + (open.length ? "" : " selected") + ">Start a new clock</option>" +
    (clocks.length ? '<option value="clear">Remove a finished or dead clock</option>' : "") +
    "</select></label>" +
    (open.length ? '<label style="display:block">Clock: <select name="clock" style="width:100%">' + clockOpts + "</select></label>" : "") +
    '<hr><div style="font-weight:bold">Advancing</div>' +
    picker +
    TBE.encNote(TBE.me()) +
    '<label style="display:block">Or skill value: <input type="number" name="skill" value="50" style="width:100%"></label>' +
    '<label style="display:block">Modifier: <input type="number" name="mod" value="0" style="width:100%"></label>' +
    '<label style="display:block">Or add SLs directly (helpers, GM fiat): <input type="number" name="direct" placeholder="leave empty to roll" style="width:100%"></label>' +
    '<hr><div style="font-weight:bold">New clock</div>' +
    '<label style="display:block">Name: <input type="text" name="name" placeholder="Forge the rapier blade" style="width:100%"></label>' +
    '<label style="display:block">SLs required (3 easy, 6 standard, 9 difficult, 12+ major): <input type="number" name="need" value="6" style="width:100%"></label>' +
    '<label style="display:block">Interval (an hour, a day...): <input type="text" name="interval" value="intervals" style="width:100%"></label>' +
    '<label style="display:block">Limit in intervals, 0 for none: <input type="number" name="limit" value="0" style="width:100%"></label>' +
    "</div>";

  const data = await TBE.prompt("TBE Clocks", content, "Go");
  if (data) {
    if (data.act === "new" && (data.name || "").trim()) {
      clocks.push({
        name: data.name.trim(), need: Math.max(1, TBE.num(data.need, 6)), have: 0,
        interval: (data.interval || "intervals").trim(), limit: Math.max(0, TBE.num(data.limit, 0)),
        used: 0, done: false, failed: false
      });
      await saveClocks(j, clocks);
      await TBE.say(TBE.card("Clock started", "<div><b>" + data.name.trim() + "</b>: 0 / " + TBE.num(data.need, 6) + " SL" +
        (TBE.num(data.limit, 0) ? ", limit " + data.limit + " " + data.interval : "") + "</div>" + bar(0, TBE.num(data.need, 6))));
    } else if (data.act === "clear" && clocks.length) {
      const doneOnes = clocks.filter((c) => c.done || c.failed);
      const keep = clocks.filter((c) => !c.done && !c.failed);
      await saveClocks(j, keep);
      ui.notifications?.info("TBE: removed " + doneOnes.length + " closed clock(s). Open ones were kept.");
    } else if (data.act === "advance" && open.length) {
      const c = open[TBE.num(data.clock, 0)];
      const direct = (data.direct ?? "").toString().trim();
      let line = "";
      const rolls = [];

      if (direct !== "") {
        const add = TBE.num(direct, 0);
        c.have = Math.max(0, c.have + add);
        line = "<div>" + (add >= 0 ? "+" : "") + add + " SL added directly.</div>";
      } else {
        const pick = TBE.readPick(data.pick);
        const skill = (pick ? pick.value : TBE.num(data.skill, 50)) + TBE.num(data.mod, 0);
        const roll = await TBE.d100();
        rolls.push(roll);
        const res = TBE.resolve(roll.total, skill, pick ? pick.expertise : 0);
        line = "<div>" + (pick ? pick.name + " " : "Skill ") + skill + ": <b>" + TBE.face(res.roll) + "</b> " +
          '<span style="color:' + TBE.colour(res) + '">' + TBE.tag(res) + "</span>" + (res.success ? ", +" + res.sl + " SL" : "") + "</div>";
        if (res.success) c.have += res.sl;
        else if (res.critFail) {
          c.have = Math.ceil(c.have / 2);
          line += "<div><b>Critical failure:</b> accumulated SLs halved (round up).</div>";
        }
      }

      c.used += 1;
      if (c.have >= c.need) { c.done = true; c.have = c.need; }
      else if (c.limit && c.used >= c.limit) c.failed = true;

      await saveClocks(j, clocks);
      const state = c.done
        ? '<div style="font-weight:bold;color:#1f7a1f">COMPLETE</div>'
        : c.failed
          ? '<div style="font-weight:bold;color:#8b1a1a">OUT OF TIME &mdash; the opportunity is lost</div>'
          : "";
      await TBE.say(TBE.card("Clock: " + c.name,
        line +
        "<div>" + c.have + " / " + c.need + " SL &middot; interval " + c.used + (c.limit ? " of " + c.limit : "") + " (" + c.interval + ")</div>" +
        bar(c.have, c.need) + state), rolls);
    }
  }
}
