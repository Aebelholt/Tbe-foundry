/* TBE: Export Sheets — every player character in the world as a printable
 * sheet, for paper, PDF, or a player who has no Foundry seat.
 *
 * WHY IT EXISTS. Foundry cannot print a character. Hitting Ctrl+P on an open
 * actor sheet gives you the application's UI chrome -- tab strips, scroll
 * containers clipped mid-row, whatever happens to be the active tab and
 * nothing from the other five. Core's right-click "Export Data" gives you raw
 * JSON, which is the right answer for moving an actor between worlds and the
 * wrong one for a table. This fills the gap between those two.
 *
 * THE ONE RULE IT FOLLOWS. **It reads, it never derives.** Every number on
 * the page comes from the actor or from the helper that already owns that
 * arithmetic: `system.initiativeEffective`, `system.lethalityLevel` and
 * `system.totalWp` off the DataModel, `TBE.encStatus()` for encumbrance,
 * `TBE.readiness()` for carry state, `TBE.binds()`/`TBE.strands()` for magic.
 * Recomputing any of them here would be a second implementation of a rule,
 * and the failure mode is nasty and quiet: a printed sheet that disagrees
 * with the screen, discovered at the table, with no way to tell which one
 * lied. If a number is missing from this file, the fix is to expose it on the
 * actor, not to work it out again here.
 *
 * GM-only, by the playtest GM's choice (2026-09-20): this is prep and archive tooling
 * over the whole world. A player who runs it is told so in a sentence and
 * left exactly as they were (rule 6), rather than getting an empty page or a
 * permission error out of Foundry.
 */

/* No IIFE: `Macro#execute` already wraps a macro's body in an async function,
 * so a top-level `return` and top-level `await` are both legal -- which is why
 * every other macro in this pack is written that way. Wrapping this one in a
 * self-invoking async function would have meant Foundry never awaited it: the
 * macro would resolve instantly while the real work ran on detached, and any
 * error inside it would surface as an unhandled rejection with no context. */
if (!game.user?.isGM) {
  ui.notifications?.warn(
    "TBE: Export Sheets is a GM tool -- it reads every character in the world. " +
    "Ask your GM to run it, or print your own sheet from your browser.");
  return;
}

const esc = TBE.esc;
const num = (v, d = 0) => TBE.num(v, d);

/* Player characters only. A creature has a different sheet, different
   fields, and no business on a party printout. */
const pcs = (game.actors ?? []).filter((a) => a.type === "character");
if (!pcs.length) {
  ui.notifications?.info("TBE: no player characters in this world yet.");
  return;
}

/* Whole world is the default, but a played world accumulates retired and
   dead characters and nobody wants forty pages. Everything starts ticked,
   so the default IS the whole world and deselecting is the deliberate act. */
const rows = pcs.map((a, i) =>
  '<label style="display:block"><input type="checkbox" name="pc' + i + '" checked> ' +
  esc(a.name) + ' <span style="opacity:.7;font-size:11px">' +
  esc(a.system?.race || "") + (a.system?.career ? " &middot; " + esc(a.system.career) : "") +
  "</span></label>").join("");

const picked = await TBE.prompt("Export Character Sheets",
  '<div style="font-size:12px;margin-bottom:6px">' + pcs.length +
  " player character" + (pcs.length === 1 ? "" : "s") + " in this world. Untick any you do not want.</div>" +
  '<div style="max-height:260px;overflow-y:auto;border:1px solid #7a6a4f;padding:4px">' + rows + "</div>",
  "Build sheets");
if (!picked) return;

const chosen = pcs.filter((_, i) => picked["pc" + i] === "on");
if (!chosen.length) { ui.notifications?.info("TBE: nothing selected."); return; }

/* ------------------------------------------------------------------ *
 *  One character, as HTML.
 * ------------------------------------------------------------------ */
const sheetFor = (a) => {
  const s = a.system ?? {};
  const items = a.items ?? [];
  const of = (t) => items.filter((i) => i.type === t);

  /* EVERY skill, not just the ones written down. A TBE actor deliberately
     stores only the skills that differ from the book's untrained 20 (p.104),
     so listing the Items alone prints a near-empty sheet for a character who
     has two skill Items -- which is precisely what the first version of this
     macro did, and precisely the defect `skill_picker_check.mjs` was written
     to stop in the roll picker. `TBE.allSkills` is the one owner of that
     merge; a real TBE sheet lists the whole catalogue with 20s in it, which
     is also what the playtest GM's own spreadsheet does.

     An untrained 20 is printed in grey so a glance still finds the trained
     ones, rather than making the player read every number. */
  const all = TBE.allSkills(a).filter((x) => x.group !== "Bind" && x.group !== "Strand");
  const byGroup = {};
  for (const sk of all) (byGroup[sk.group || "Other"] ??= []).push(sk);
  const skillBlock = Object.keys(byGroup).sort().map((g) => {
    const list = byGroup[g].slice().sort((x, y) => x.name.localeCompare(y.name));
    return '<div class="grp"><h3>' + esc(g) + "</h3><ul class=\"skills\">" + list.map((sk) => {
      const ex = num(sk.expertise, 0);
      return '<li' + (sk.trained ? "" : ' class="untrained"') + "><span>" + esc(sk.name) +
        (sk.savvy ? ' <b class="tag">S</b>' : "") +
        (ex >= 2 ? ' <b class="tag">Ex' + ex + "</b>" : "") +
        '</span><b>' + num(sk.value, 0) + "</b></li>";
    }).join("") + "</ul></div>";
  }).join("");

  /* Weapons. Readiness comes from the owner, so a dropped weapon prints as
     dropped rather than as whatever an else-branch happens to say. */
  const weapons = of("weapon");
  const weaponRows = weapons.map((w) => {
    const r = TBE.readiness(w);
    return "<tr><td>" + esc(w.name) + (w.system?.ranged ? ' <span class="tag">Ranged</span>' : "") +
      (w.system?.nl ? ' <span class="tag">NL</span>' : "") + "</td>" +
      "<td>" + esc(w.system?.skillName || "") + "</td>" +
      "<td>" + esc(w.system?.dmg || "") + "</td>" +
      "<td>" + esc(String(w.system?.cl ?? "")) + " / " + esc(String(w.system?.cs ?? "")) + " / " +
      esc(String(w.system?.dis ?? "")) + " / " + esc(String(w.system?.t ?? "")) + "</td>" +
      "<td>" + num(w.system?.enc, 0) + "</td>" +
      "<td>" + esc(r?.label || "") + "</td></tr>";
  }).join("");

  const shields = of("shield").map((sh) => {
    const r = TBE.readiness(sh);
    const shb = sh.system?.shb;
    return "<tr><td>" + esc(sh.name) + "</td><td>AP " + num(sh.system?.ap, 0) + "</td>" +
      "<td>" + (typeof shb === "number" ? "Shield Bash " + shb + " SL" : "no Shield Bash") + "</td>" +
      "<td>" + num(sh.system?.enc, 0) + "</td><td>" + esc(r?.label || "") + "</td></tr>";
  }).join("");

  const armour = of("armor").map((ar) =>
    "<tr><td>" + esc(ar.name) + "</td><td>AP " + num(ar.system?.ap, 0) + "</td>" +
    "<td>Bulk " + num(ar.system?.bulk, 0) + "</td>" +
    "<td>" + esc(Object.keys(ar.system?.locations ?? {}).filter((k) => ar.system.locations[k]).join(", ")) + "</td>" +
    "<td>" + (ar.system?.worn ? "worn" : "carried") + "</td></tr>").join("");

  /* Wounds: the grid a GM marks during play, printed empty-but-ruled so it
     is usable on paper rather than being a snapshot nobody can update. */
  const w = TBE.wounds(a);
  const woundRows = TBE.LOCATIONS.map((loc) => {
    const x = w[loc] || {};
    const tags = [];
    if (num(x.imp, 0) >= 2) tags.push("Shock");
    else if (num(x.imp, 0) === 1) tags.push("Impaired");
    if (x.septic) tags.push("SEPTIC"); else if (x.inf) tags.push("Infected");
    return "<tr><td>" + esc(TBE.LOC_LABELS[loc] || loc) + "</td><td>" + num(x.wp, 0) +
      "</td><td>" + esc(tags.join(", ")) + "</td><td class=\"blank\"></td></tr>";
  }).join("");

  const enc = TBE.encStatus(a);
  const talents = of("talent").map((t) =>
    "<li>" + esc(t.name) + (num(t.system?.ranks, 1) > 1 ? " &times;" + num(t.system.ranks, 1) : "") + "</li>").join("");

  /* Magic only when this character actually has a Pattern. An empty Weave
     block on a Warrior's sheet is noise. */
  const pattern = TBE.pattern(a);
  let magicBlock = "";
  if (pattern && pattern !== "none") {
    const binds = TBE.binds(a) || [];
    const strands = TBE.strands(a) || [];
    const weave = TBE.weaveState(a);
    magicBlock =
      '<div class="grp"><h3>The Weave &mdash; ' + esc(pattern) + "</h3>" +
      (binds.length ? '<ul class="skills">' + binds.map((b) =>
        "<li><span>" + esc(b.name) + (b.scar ? ' <b class="tag">scar &minus;' + num(b.scar, 0) + "</b>" : "") +
        "</span><b>" + num(b.effective ?? b.value, 0) + "</b></li>").join("") + "</ul>" : "") +
      (strands.length ? '<ul class="skills">' + strands.map((st) =>
        "<li><span>" + esc(st.name) + "</span><b>" + num(st.level ?? st.value, 0) + "</b></li>").join("") + "</ul>" : "") +
      '<div class="mini">Fraying ' + num(s.fraying, 0) + " against Max Resolve " + num(s.resolve?.max, 0) +
      (weave?.snag ? " &middot; <b>Reality Snag active</b>" : "") + "</div></div>";
  }

  const stat = (label, value, note) =>
    '<div class="stat"><div class="v">' + value + '</div><div class="l">' + label + "</div>" +
    (note ? '<div class="n">' + note + "</div>" : "") + "</div>";

  /* initiativeEffective, lethalityLevel, totalWp and dying are all DERIVED
     on the actor and recomputed every load. Read, never recompute. */
  const initPen = num(s.armorInitPenalty, 0);

  return '<section class="sheet">' +
    '<h1>' + esc(a.name) + "</h1>" +
    '<div class="sub">' + [s.race, s.size, s.culture, s.career].filter(Boolean).map(esc).join(" &middot; ") + "</div>" +

    '<div class="stats">' +
      stat("Death Threshold", num(s.deathThreshold?.value, 0) + " / " + num(s.deathThreshold?.max, 0)) +
      stat("Resolve", num(s.resolve?.value, 0) + " / " + num(s.resolve?.max, 0)) +
      stat("Toughness", num(s.toughness, 0)) +
      stat("Fatigue", num(s.fatigue, 0)) +
      stat("Initiative", num(s.initiativeEffective, 0), initPen ? "armor &minus;" + initPen : "") +
      stat("Lethality Level", num(s.lethalityLevel, 0)) +
      stat("Wound Points", num(s.totalWp, 0)) +
      stat("Silver", num(s.silver, 0)) +
    "</div>" +
    (s.shock ? '<div class="alert">In Shock</div>' : "") +
    (s.dying ? '<div class="alert">Dying &mdash; Wound Points are past the Lethality Level (p.174)</div>' : "") +
    (s.castOut ? '<div class="alert">Cast Out</div>' : "") +

    '<div class="cols">' + skillBlock + magicBlock + "</div>" +

    (weaponRows ? '<h2>Weapons</h2><table><tr><th>Weapon</th><th>Skill</th><th>Dmg</th>' +
      "<th>CL / CS / Dis / T</th><th>ENC</th><th>Carried</th></tr>" + weaponRows + "</table>" : "") +
    (shields ? "<h2>Shields</h2><table>" + shields + "</table>" : "") +
    (armour ? '<h2>Armour</h2><table><tr><th>Piece</th><th>AP</th><th>Bulk</th><th>Locations</th><th></th></tr>' +
      armour + "</table>" : "") +

    '<h2>Wounds</h2><table class="wounds"><tr><th>Location</th><th>WP</th><th>State</th><th>In play</th></tr>' +
      woundRows + "</table>" +

    (talents ? "<h2>Talents</h2><ul class=\"inline\">" + talents + "</ul>" : "") +

    '<h2>Encumbrance</h2><div class="mini">' +
      "At Hand " + num(enc?.hand, 0) + " / " + num(enc?.handMax, 6) +
      " &middot; Inventory " + num(enc?.inv, 0) + " / " + num(enc?.invMax, 6) +
      (enc?.penalty ? ' &middot; <b>' + enc.penalty + " to physical rolls</b>" : "") +
    "</div>" +

    (s.goals ? "<h2>Goals</h2><div class=\"prose\">" + s.goals + "</div>" : "") +
    (s.notes ? "<h2>Notes</h2><div class=\"prose\">" + s.notes + "</div>" : "") +
    "</section>";
};

/* ------------------------------------------------------------------ *
   *  The document. Self-contained: no Foundry CSS, no external anything,
   *  so it prints and survives being saved to disk and opened next year.
   * ------------------------------------------------------------------ */
const when = new Date().toLocaleDateString();
const doc =
  "<!doctype html><html><head><meta charset=\"utf-8\">" +
  "<title>The Broken Empires — character sheets</title><style>" +
  "body{font:12px Georgia,serif;color:#141413;background:#fff;margin:0;padding:16px}" +
  ".sheet{max-width:760px;margin:0 auto 28px;padding-bottom:18px;border-bottom:2px solid #7a6a4f}" +
  "h1{font-size:22px;margin:0 0 2px;color:#7a2e2e}" +
  "h2{font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:#7a2e2e;" +
    "border-bottom:1px solid #d8c9ab;margin:14px 0 4px;padding-bottom:2px}" +
  "h3{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#5c5044;margin:0 0 3px}" +
  ".sub{color:#5c5044;font-style:italic;margin-bottom:8px}" +
  ".stats{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}" +
  ".stat{flex:1 1 84px;border:1px solid #d8c9ab;border-radius:5px;padding:4px;text-align:center}" +
  ".stat .v{font-size:16px;font-weight:bold;color:#7a2e2e}" +
  ".stat .l{font-size:8px;text-transform:uppercase;letter-spacing:.04em;color:#5c5044}" +
  ".stat .n{font-size:8px;color:#9a4b12}" +
  ".alert{background:#f0ddd2;border-left:3px solid #7a2e2e;padding:3px 6px;margin:4px 0;font-weight:bold}" +
  ".cols{column-count:2;column-gap:18px;margin-top:8px}" +
  ".grp{break-inside:avoid;margin-bottom:8px}" +
  "ul.skills{list-style:none;margin:0;padding:0}" +
  "ul.skills li{display:flex;justify-content:space-between;border-bottom:1px dotted #d8c9ab;padding:1px 0}" +
    "ul.skills li.untrained{color:#8a8172}" +
  ".tag{font-size:8px;background:#ece1cb;border-radius:2px;padding:0 3px;font-weight:normal}" +
  "table{width:100%;border-collapse:collapse;margin:2px 0}" +
  "th{text-align:left;font-size:9px;text-transform:uppercase;color:#5c5044;border-bottom:1px solid #d8c9ab}" +
  "td{border-bottom:1px solid #eee4d0;padding:2px 3px}" +
  "td.blank{border-bottom:1px solid #999;min-width:90px}" +
  "ul.inline{list-style:none;margin:0;padding:0;columns:2}" +
  ".mini{font-size:11px;color:#5c5044}" +
  ".prose{font-size:11px}" +
  ".meta{max-width:760px;margin:0 auto 14px;font-size:10px;color:#5c5044}" +
  "@media print{body{padding:0}.sheet{page-break-after:always;border-bottom:none}" +
    ".sheet:last-child{page-break-after:auto}.meta{display:none}}" +
  "</style></head><body>" +
  '<div class="meta">The Broken Empires &mdash; ' + chosen.length + " character" +
    (chosen.length === 1 ? "" : "s") + ", exported " + esc(when) +
    ". Print or save as PDF from your browser.</div>" +
  chosen.map(sheetFor).join("") +
  "</body></html>";

/* Two ways out, because a popup blocker will eat the first one without
   saying anything. The Tapestry tool hit exactly this and kept a download
   fallback beside its print button; worth copying rather than rediscovering
   at the table. */
const blob = new Blob([doc], { type: "text/html" });
const url = URL.createObjectURL(blob);

const win = window.open(url, "_blank");
if (win) {
  ui.notifications?.info("TBE: sheets opened in a new tab. Print or save as PDF from there.");
} else {
  const a = document.createElement("a");
  a.href = url;
  a.download = "tbe-character-sheets.html";
  document.body.appendChild(a);
  a.click();
  a.remove();
  ui.notifications?.warn(
    "TBE: the browser blocked the new tab, so the sheets were downloaded instead. " +
    "Open tbe-character-sheets.html and print from there.");
}
/* Give the tab time to load before dropping the object URL. */
setTimeout(() => { try { URL.revokeObjectURL(url); } catch (e) {} }, 60000);

await TBE.say(TBE.card("TBE Export Sheets",
  "<div>Exported <b>" + chosen.length + "</b> character sheet" + (chosen.length === 1 ? "" : "s") +
  ": " + chosen.map((c) => esc(c.name)).join(", ") + ".</div>"),
  [], { mode: TBE.MODES.PRIVATE });
