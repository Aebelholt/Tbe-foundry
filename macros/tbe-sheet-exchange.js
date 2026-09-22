/* TBE: Sheet Exchange — a character to a spreadsheet and back.
 *
 * EXPORT writes a .csv (TBE-CSV v1: section, name, value, expertise, note).
 * In Google Sheets: File > Import > Upload, "Insert new sheet", and a
 * character creator tab can then look values up by name.
 *
 * IMPORT takes the same layout back, as a .csv file or pasted cells (select
 * the block in Google Sheets, copy, paste: it arrives tab-separated and is
 * read the same way). Before anything is written you see exactly what will
 * change and what was skipped, and nothing is ever deleted.
 *
 * The format and the planning are owned by TBE.sheetCsv in _lib.js; this
 * file only asks, shows and writes. Every write goes through TBE.write /
 * TBE.writeItem, so a player importing onto an actor they do not own is told
 * so in a sentence rather than half-updating it.
 */
const C = TBE.sheetCsv;
const isGM = !!game.user?.isGM;
const actors = Array.from(game.actors ?? []).filter((a) => a.type === "character" && (isGM || a.isOwner))
  .sort((a, b) => a.name.localeCompare(b.name));
const canCreate = isGM || !!game.user?.can?.("ACTOR_CREATE");
const mine = TBE.me();

if (!actors.length && !canCreate) {
  ui.notifications?.warn("TBE: you own no characters to export or import onto. Ask the GM to give you ownership of yours.");
  return;
}

const opts = actors.map((a) => '<option value="' + a.id + '"' + (mine && mine.id === a.id ? " selected" : "") + ">" + TBE.esc(a.name) + "</option>").join("");
const first = await TBE.prompt("TBE: Sheet Exchange",
  '<div style="font-size:13px">' +
  '<label style="display:block"><input type="radio" name="mode" value="export" checked> <b>Export</b> a character to a spreadsheet file (.csv)</label>' +
  '<label style="display:block"><input type="radio" name="mode" value="import"> <b>Import</b> a spreadsheet back onto a character</label>' +
  '<label style="display:block;margin-top:6px">Character: <select name="actor" style="width:100%">' + opts +
  (canCreate ? '<option value="__new">New character (import only)</option>' : "") + "</select></label>" +
  '<p style="font-size:11px;opacity:.8">The file lists every skill, the untrained ones at 20, plus Talents and weapons, armour and shields by name.</p></div>',
  "Next");
if (!first) return;

/* V13+ keeps it on foundry.utils, V12 as a global. Branch on what exists. */
const saveFile = (typeof foundry !== "undefined" && foundry?.utils?.saveDataToFile) || globalThis.saveDataToFile;

if (first.mode !== "import") {
  const actor = game.actors.get(first.actor);
  if (!actor) { ui.notifications?.warn("TBE: pick a character to export."); return; }
  const csv = C.toCsv(C.rowsFor(actor));
  const file = actor.name.replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "_") + ".tbe.csv";
  if (typeof saveFile !== "function") {
    ui.notifications?.warn("TBE: this Foundry version offers no file download to a macro. Nothing was saved.");
    return;
  }
  saveFile(csv, "text/csv", file);
  ui.notifications?.info("TBE: exported " + actor.name + " to " + file + ". In Google Sheets: File > Import > Upload.");
  return;
}

/* ---- import ---- */
const second = await TBE.prompt("TBE: Sheet Exchange — import",
  '<div style="font-size:13px">' +
  '<label style="display:block">A .csv file: <input type="file" name="file" accept=".csv,.tsv,.txt,text/csv"></label>' +
  '<div style="margin:6px 0;opacity:.8">or paste the cells (copied straight out of Google Sheets):</div>' +
  '<textarea name="text" rows="10" style="width:100%;font-family:monospace;font-size:11px"></textarea></div>',
  "Preview");
if (!second) return;
let text = second.text || "";
if (second.file && typeof second.file.text === "function" && second.file.size > 0) text = await second.file.text();
if (!text.trim()) { ui.notifications?.warn("TBE: nothing to import. Choose a file or paste the cells."); return; }

const rows = C.parse(text);
let actor = first.actor === "__new" ? null : game.actors.get(first.actor);
const probe = actor ?? { name: "", items: [], system: {} };
const plan = C.plan(probe, rows);
if (plan.problems.length && C.isEmpty(plan) && !plan.notInFile.length && /not a TBE-CSV/.test(plan.problems[0])) {
  ui.notifications?.warn("TBE: " + plan.problems[0]);
  return;
}

const li = (xs) => xs.length ? "<ul style='margin:2px 0 6px 16px;padding:0'>" + xs.map((x) => "<li>" + x + "</li>").join("") + "</ul>" : "<div style='opacity:.6;margin-bottom:6px'>none</div>";
const preview =
  '<div style="font-size:12px;max-height:420px;overflow:auto">' +
  "<b>" + (actor ? TBE.esc(actor.name) : "New character") + "</b>" +
  "<div><b>Fields</b></div>" + li(plan.fields.map((f) => TBE.esc(f.label) + ": " + TBE.esc(String(f.from ?? "")) + " &rarr; <b>" + TBE.esc(String(f.to)) + "</b>")) +
  "<div><b>Skills changed</b></div>" + li(plan.skillUpdates.map((u) => TBE.esc(u.name) + ": " +
    Object.entries(u.changes).map(([k, v]) => (k.endsWith("expertise") ? "Ex " : "") + v).join(", "))) +
  "<div><b>Skills added</b></div>" + li(plan.skillCreates.map((s) => TBE.esc(s.name) + " " + s.value + (s.expertise ? " Ex" + s.expertise : "") + " (" + s.group + ")")) +
  "<div><b>Talents added</b> (from the TBE Talents compendium)</div>" + li(plan.talents.map((t) => TBE.esc(t.name))) +
  "<div><b>Items added</b> (from the TBE Equipment compendium)</div>" + li(plan.items.map((t) => TBE.esc(t.name) + " (" + t.type + ")")) +
  (plan.notInFile.length ? "<div><b>On the sheet but not in the file</b> (left as they are)</div>" + li(plan.notInFile.map(TBE.esc)) : "") +
  (plan.problems.length ? '<div style="color:#8b1a1a"><b>Skipped</b></div>' + li(plan.problems.map(TBE.esc)) : "") +
  "</div>";
if (C.isEmpty(plan)) {
  await TBE.prompt("TBE: Sheet Exchange — nothing to change", preview, "OK");
  return;
}
const go = await TBE.prompt("TBE: Sheet Exchange — apply these changes?", preview, "Apply");
if (!go) return;

if (!actor) {
  const nameRow = plan.fields.find((f) => f.path === "name");
  try { actor = await Actor.create({ name: nameRow ? String(nameRow.to) : "Imported character", type: "character" }); }
  catch (e) { ui.notifications?.error("TBE: could not create the character: " + (e?.message ?? e)); return; }
}

const done = [], failed = [];
for (const f of plan.fields) {
  const r = await TBE.write(actor, { [f.path]: f.to }, f.label);
  (r.ok ? done : failed).push(f.label + (r.ok ? "" : ": " + r.notice));
}
for (const u of plan.skillUpdates) {
  const r = await TBE.writeItem(u.item, u.changes, "skill " + u.name);
  (r.ok ? done : failed).push(u.name + (r.ok ? "" : ": " + r.notice));
}

const fromPack = async (packId, name, type) => {
  const pack = game.packs?.get(packId);
  if (!pack) return null;
  const idx = await pack.getIndex();
  const hit = idx.find((e) => e.name.toLowerCase() === name.toLowerCase() && (!type || e.type === type));
  if (!hit) return null;
  const doc = await pack.getDocument(hit._id);
  return doc?.toObject?.() ?? null;
};
const creates = plan.skillCreates.map((s) => ({ name: s.name, type: "skill",
  system: { value: s.value, expertise: s.expertise, group: s.group, fighting: s.fighting } }));
for (const t of plan.talents) {
  const d = await fromPack("the-broken-empires.tbe-talents", t.name, "talent");
  if (!d) { failed.push("Talent " + t.name + ": not found in the TBE Talents compendium"); continue; }
  delete d._id; d.system = Object.assign({}, d.system, { ranks: t.ranks });
  creates.push(d);
}
for (const it of plan.items) {
  const d = await fromPack("the-broken-empires.tbe-equipment", it.name, it.type);
  if (!d) { failed.push(it.type + " " + it.name + ": not found in the TBE Equipment compendium"); continue; }
  delete d._id;
  creates.push(d);
}
if (creates.length) {
  if (!TBE.canWrite(actor)) failed.push(creates.length + " new item(s): you do not own " + actor.name);
  else {
    try { await actor.createEmbeddedDocuments("Item", creates); done.push(creates.length + " item(s) added"); }
    catch (e) { failed.push("adding items: " + (e?.message ?? e)); }
  }
}

await TBE.say(TBE.card("TBE Sheet Exchange",
  "<div>Imported onto <b>" + TBE.esc(actor.name) + "</b>: " + done.length + " change(s)" +
  (failed.length ? ", " + failed.length + " not applied." : ".") + "</div>" +
  (failed.length ? '<div style="font-size:11px;color:#8b1a1a">' + failed.map(TBE.esc).join("<br>") + "</div>" : "") +
  (plan.problems.length ? '<div style="font-size:11px;opacity:.8">Skipped from the file: ' + plan.problems.length + " row(s).</div>" : "")),
  [], { mode: TBE.MODES.SELF });
