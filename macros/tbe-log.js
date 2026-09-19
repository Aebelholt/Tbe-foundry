/* TBE: Session Log — the record step of the loop. Appends a scene note to a journal
 * and can pull the last few chat cards in, so the log writes itself. */

const NAME = "TBE Session Log";

const getLog = async () => {
  let j = game.journal.getName(NAME);
  if (!j && game.user.isGM) {
    j = await JournalEntry.create({
      name: NAME,
      pages: [{ name: "Log", type: "text", text: { content: "<h2>Session log</h2>", format: 1 } }]
    });
  }
  return j;
};

const j = await getLog();
if (!j) {
  ui.notifications?.warn("TBE: a GM must create the log journal once.");
} else {
  const page = j.pages?.contents?.[0];
  const me = TBE.me();
  const sessionNo = TBE.num(TBE.flagOf(j, "session"), 1);

  const data = await TBE.prompt(
    "Session log",
    '<div style="font-size:13px">' +
    '<label style="display:block">Scene or note:<br><textarea name="note" rows="4" style="width:100%" placeholder="Vilborg is taken to the block at dawn. I have until then."></textarea></label>' +
    '<label style="display:block">Heading (optional): <input type="text" name="head" placeholder="The road to Keighton" style="width:100%"></label>' +
    '<label style="display:block;margin-top:4px"><input type="checkbox" name="rolls" checked> Attach the last few dice cards</label>' +
    '<label style="display:block"><input type="checkbox" name="state"> Attach the current state line</label>' +
    '<label style="display:block"><input type="checkbox" name="newsession"> Start a new session heading (session ' + (sessionNo + 1) + ")</label>" +
    "</div>",
    "Write it down"
  );

  if (data && (data.note || "").trim()) {
    const stamp = new Date().toLocaleString();
    let entry = "";

    if (data.newsession === "on") {
      await j.update({ [TBE.flagPath("session")]: sessionNo + 1, "flags.tbe.-=session": null });
      entry += "<hr><h2>Session " + (sessionNo + 1) + " &mdash; " + stamp + "</h2>";
    }
    if (data.head) entry += "<h3>" + data.head + "</h3>";
    entry += "<p>" + data.note.replace(/\n/g, "<br>") + "</p>";

    if (data.state === "on" && me) {
      const w = TBE.wounds(me);
      const hp = me.system?.deathThreshold ?? {};
      const mp = me.system?.resolve ?? {};
      const s = TBE.supply(me);
      entry += "<p style='font-size:11px;opacity:.75'><b>" + me.name + "</b>: DT " + (TBE.num(hp.max, 0) - TBE.totalWp(w)) +
        "/" + TBE.num(hp.max, 0) + ", Resolve " + TBE.num(mp.value, 0) + "/" + TBE.num(mp.max, 0) +
        ", wounds " + (TBE.totalWp(w) || "none") +
        ", supply G" + (s.gear || "-") + " A" + (s.ammo || "-") + " M" + (s.medical || "-") + " R" + (s.rations || "-") + "</p>";
    }

    if (data.rolls === "on") {
      const recent = game.messages.contents.slice(-8).filter((m) => (m.content || "").indexOf("tbe-card") > -1);
      if (recent.length) {
        const lines = recent.slice(-4).map((m) => {
          const txt = (m.content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
          return "&bull; " + txt.slice(0, 220);
        });
        entry += "<p style='font-size:11px;opacity:.75'>" + lines.join("<br>") + "</p>";
      }
    }

    try {
      await page.update({ "text.content": (page.text?.content ?? "") + entry });
      await TBE.say(TBE.card("Logged", "<div>" + (data.head ? "<b>" + data.head + "</b><br>" : "") +
        data.note.slice(0, 200) + "</div><div style='font-size:11px;opacity:.75;margin-top:4px'>Written to " + NAME + ".</div>"));
    } catch (err) {
      console.error("TBE | log write failed", err);
      ui.notifications?.error("TBE: could not write to the log, see console (F12).");
    }
  }
}
