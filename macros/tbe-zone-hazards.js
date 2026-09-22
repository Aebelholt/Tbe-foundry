/* TBE: Zone Hazards — mark the scene's Regions with the book's Zone Hazards
 * (Ch.10 pp.151-152): Confined, Rough, Obscured, Blocked, Damaging, Other.
 *
 * Draw a zone as a Region first (the same Region Zone Movement counts), then
 * run this. TBE: Attack reads the marks: an Obscured zone on the line between
 * shooter and target offers -20 to a ranged attack, and a Confined zone
 * offers -20 to Dodge and Melee: Heavy. Both arrive pre-ticked and the GM can
 * untick them, because "clearly seen" is a ruling, not geometry. The other
 * hazards appear as reminders on the attack dialog.
 *
 * GM-only: "It is always the GM who decides what hazard, if any, is applied
 * to a zone" (p.151). Stored as flags["the-broken-empires"].hazards on the
 * Region; the meaning of each mark is owned by module/rules/zones.mjs.
 */
const Z = TBE.zones();
if (!game.user?.isGM) {
  ui.notifications?.warn("TBE: Zone Hazards is a GM tool. The GM decides which zones carry hazards (p.151).");
  return;
}
if (!Z) {
  ui.notifications?.warn("TBE: Zone Hazards needs The Broken Empires system to be active in this world.");
  return;
}
const scene = canvas?.scene;
const regions = Array.from(scene?.regions ?? []);
if (!scene || !regions.length) {
  ui.notifications?.warn("TBE: this scene has no Regions. Draw each zone as a Region (Regions layer, left toolbar), then run this again.");
  return;
}

const KEYS = Object.keys(Z.HAZARDS);
const head = "<tr><th style='text-align:left'>Zone (Region)</th>" +
  KEYS.map((k) => "<th title='" + TBE.esc(Z.HAZARDS[k].quote) + " (p." + Z.HAZARDS[k].page + ")'>" + Z.HAZARDS[k].label + "</th>").join("") + "</tr>";
const rows = regions.map((r, i) => {
  const now = r.flags?.[Z.SCOPE]?.hazards ?? {};
  const cells = KEYS.map((k) => {
    if (k === "damaging") {
      const v = typeof now.damaging === "number" ? now.damaging : "";
      return "<td style='text-align:center'><input type='number' name='r" + i + "_damaging' value='" + v + "' min='0' max='99' style='width:48px' placeholder='dmg'></td>";
    }
    return "<td style='text-align:center'><input type='checkbox' name='r" + i + "_" + k + "'" + (now[k] ? " checked" : "") + "></td>";
  }).join("");
  return "<tr><td>" + TBE.esc(r.name || ("Region " + (i + 1))) + "</td>" + cells + "</tr>";
}).join("");

const content =
  "<div style='font-size:13px'>" +
  "<p>Tick each zone's hazards. Hover a heading for the book's wording. <b>Damaging</b> takes the zone's fixed damage " +
  "(typically 1-30, see the Hazard Lethality Guidance Table, p.152); leave it empty for none.</p>" +
  "<table style='width:100%'>" + head + rows + "</table>" +
  "<p style='font-size:11px;opacity:.8'>Keep it to one or two hazards per battlefield (p.151).</p></div>";

const data = await TBE.prompt("TBE: Zone Hazards — " + (scene.name || "scene"), content, "Save");
if (!data) return;

const summary = [];
for (const [i, r] of regions.entries()) {
  const hz = {};
  for (const k of KEYS) {
    if (k === "damaging") {
      const n = Math.round(Number(data["r" + i + "_damaging"]));
      if (Number.isFinite(n) && n > 0) hz.damaging = n;
    } else if (data["r" + i + "_" + k] === "on") hz[k] = true;
  }
  /* Replace the whole object so an unticked hazard is really removed:
     update() merges, so "-=" clears the old key first. */
  await r.update({ ["flags." + Z.SCOPE + ".-=hazards"]: null });
  if (Object.keys(hz).length) await r.update({ ["flags." + Z.SCOPE + ".hazards"]: hz });
  const list = Z.hazardsOf({ flags: { [Z.SCOPE]: { hazards: hz } } })
    .map((h) => Z.HAZARDS[h.key].label + (h.damage ? " " + h.damage : ""));
  if (list.length) summary.push((r.name || "Region " + (i + 1)) + ": " + list.join(", "));
}
ui.notifications?.info("TBE: zone hazards saved" + (summary.length ? ". " + summary.join("; ") : ", none set."));
