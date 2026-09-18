/* TBE: Status Effects — the manual side of the status folder. Everything Attack and
 * Wounds & Recovery already compute (Impaired locations, Shock, Infected, Septic,
 * maneuver riders) is applied automatically and shown here for reference only; toggle
 * those from Attack/Wounds so the underlying WP and flags stay correct. Everything else
 * in the book's Perils chapter (Fatigue-family, Fear, Poison, Blinded/Deafened, weather)
 * has no macro that triggers it, so this is where you mark it by hand. */

const me = TBE.me();
if (!me) {
  ui.notifications?.warn("TBE: select a token first.");
} else {
  await TBE.syncStatuses(me);
  const AUTO = new Set(["tbe-imp-body", "tbe-imp-rarm", "tbe-imp-larm", "tbe-imp-rleg", "tbe-imp-lleg",
    "tbe-imp-head", "tbe-shock", "tbe-infected", "tbe-septic", "tbe-dying", "tbe-prone", "tbe-unconscious",
    "tbe-unbalanced", "tbe-locked", "tbe-disarmed", "tbe-disadvantaged", "tbe-restrained"]);
  const manual = TBE.STATUSES.filter((s) => !AUTO.has(s.id));
  const auto = TBE.STATUSES.filter((s) => AUTO.has(s.id) && TBE.hasStatus(me, s.id));

  const groups = {};
  for (const s of manual) (groups[s.group] = groups[s.group] || []).push(s);

  const rows = Object.entries(groups).map(([group, list]) =>
    '<div style="font-weight:bold;margin-top:4px">' + group + "</div>" +
    list.map((s) => '<label style="display:block"><input type="checkbox" name="s_' + s.id + '"' +
      (TBE.hasStatus(me, s.id) ? " checked" : "") + "> " + s.name + "</label>").join("")
  ).join("");

  const content =
    '<div style="font-size:13px">' +
    "<div><b>" + me.name + "</b></div>" +
    (auto.length ? '<div style="font-size:11px;opacity:.8;margin:4px 0">Auto-tracked right now: ' +
      auto.map((s) => s.name).join(", ") + ". Change these from Attack or Wounds & Recovery, not here.</div>" : "") +
    '<div style="margin:6px 0;max-height:280px;overflow:auto">' + rows + "</div>" +
    '<label style="display:block;margin-top:4px">Fatigue marked (0 if none): <input type="number" name="fatigue" value="' +
      TBE.num(me.system?.fatigue, 0) + '" style="width:100%"></label>' +
    '<div style="font-size:11px;opacity:.75">Fatigue marks the Resolve track from the right. Once the whole track is spent-or-Fatigued, further Fatigue becomes a Weary/Deprived/Sleepless wound instead of a mark here &mdash; check the box above by hand when that happens.</div>' +
    "</div>";

  const data = await TBE.prompt("Status Effects", content, "Apply");
  if (data) {
    const changed = [];
    for (const s of manual) {
      const want = data["s_" + s.id] === "on";
      if (want !== TBE.hasStatus(me, s.id)) {
        const ok = await (want ? TBE.applyStatus(me, s.id, {}) : TBE.clearStatus(me, s.id));
        changed.push((want ? "+ " : "- ") + s.name + (ok ? "" : " (failed, mark it by hand)"));
      }
    }
    const fatigue = TBE.num(data.fatigue, 0);
    const prevFatigue = TBE.num(me.system?.fatigue, 0);
    if (fatigue !== prevFatigue) {
      const wFat = await TBE.write(me, { "system.fatigue": fatigue }, "the Fatigue change");
      changed.push("Fatigue " + prevFatigue + " &rarr; " + fatigue + (wFat.ok ? "" : " (NOT SAVED: " + TBE.esc(wFat.notice) + ")"));
    }

    let body = "<div><b>" + me.name + "</b></div>";
    body += changed.length
      ? "<div>" + changed.join("<br>") + "</div>"
      : "<div><i>No change.</i></div>";
    await TBE.say(TBE.card("Status Effects", body));
  }
}
