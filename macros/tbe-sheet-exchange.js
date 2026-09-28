/* TBE: Sheet Exchange — a character out to a sheet, and a sheet back in.
 *
 * EXPORT
 *   .csv  TBE-CSV v1 (section, name, value, expertise, note). Google Sheets:
 *         File > Import > Upload.
 *   PDF   the official fillable B/W character sheet (v13), filled in. The
 *         blank sheet comes from the world setting "Blank character sheet
 *         PDF" if the GM set one, otherwise you pick the file.
 * IMPORT (the format is recognised on its own)
 *   a filled fillable character sheet PDF,
 *   a TBE-CSV file,
 *   the Character Creator v0.6.5 or v0.7.0 "Character Sheet" tab, downloaded as CSV
 *   (File > Download > Comma-separated values) or copied from cell A1 and
 *   pasted.
 * Before anything is written you see exactly what will change and what was
 * skipped. Nothing is ever deleted.
 *
 * The formats, the planner and the writer are owned by TBE.sheetCsv /
 * TBE.sheetPdf in _lib.js; this file only asks, shows and hands over. Every
 * write goes through TBE.write / TBE.writeItem, so a player importing onto an
 * actor they do not own is told so in a sentence.
 */
const C = TBE.sheetCsv, P = TBE.sheetPdf;
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
  '<label style="display:block"><input type="radio" name="mode" value="pdf" checked> <b>Export</b> to the fillable character sheet (PDF)</label>' +
  '<label style="display:block"><input type="radio" name="mode" value="csv"> <b>Export</b> to a spreadsheet file (.csv)</label>' +
  '<label style="display:block"><input type="radio" name="mode" value="import"> <b>Import</b> a sheet: filled PDF, TBE .csv, or the Character Creator tab</label>' +
  '<label style="display:block;margin-top:6px">Character: <select name="actor" style="width:100%">' + opts +
  (canCreate ? '<option value="__new">New character (import only)</option>' : "") + "</select></label></div>",
  "Next");
if (!first) return;

/* V13+ keeps it on foundry.utils, V12 as a global. Branch on what exists. */
const saveFile = (typeof foundry !== "undefined" && foundry?.utils?.saveDataToFile) || globalThis.saveDataToFile;
const fileBase = (a) => a.name.replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "_") || "character";
const loadPdfLib = async () => {
  try { return await TBE.pdfLib(); }
  catch (e) { ui.notifications?.error("TBE: could not load the PDF library that ships with the system (" + (e?.message ?? e) + ")."); return null; }
};

if (first.mode === "csv" || first.mode === "pdf") {
  const actor = game.actors.get(first.actor);
  if (!actor) { ui.notifications?.warn("TBE: pick a character to export."); return; }
  if (typeof saveFile !== "function") { ui.notifications?.warn("TBE: this Foundry version offers no file download to a macro. Nothing was saved."); return; }
  if (first.mode === "csv") {
    saveFile(C.toCsv(C.rowsFor(actor)), "text/csv", fileBase(actor) + ".tbe.csv");
    ui.notifications?.info("TBE: exported " + actor.name + " to " + fileBase(actor) + ".tbe.csv. In Google Sheets: File > Import > Upload.");
    return;
  }
  /* PDF: the blank sheet from the world setting, or picked now. */
  let bytes = null;
  let path = "";
  try { path = game.settings.get("the-broken-empires", "sheetPdfPath") || ""; } catch (e) {}
  if (path) {
    try { const res = await fetch(path); if (res.ok) bytes = new Uint8Array(await res.arrayBuffer()); } catch (e) {}
    if (!bytes) ui.notifications?.warn("TBE: the blank sheet set in the world settings (" + path + ") could not be read. Pick the file instead.");
  }
  if (!bytes) {
    const pick = await TBE.prompt("TBE: Sheet Exchange — blank sheet",
      '<div style="font-size:13px"><p>Choose the blank fillable character sheet (TBE_RPG_Character_Sheet_BW_Fillable_v13).</p>' +
      '<input type="file" name="file" accept=".pdf,application/pdf">' +
      (isGM ? '<p style="font-size:11px;opacity:.8">GM: set it once under Configure Settings, "Blank character sheet PDF", and nobody has to pick it again.</p>' : "") + "</div>",
      "Fill");
    if (!pick || !pick.file || !pick.file.size) return;
    bytes = new Uint8Array(await pick.file.arrayBuffer());
  }
  const lib = await loadPdfLib();
  if (!lib) return;
  let doc;
  try { doc = await lib.PDFDocument.load(bytes); } catch (e) { ui.notifications?.error("TBE: that file is not a PDF pdf-lib can open (" + (e?.message ?? e) + ")."); return; }
  const form = doc.getForm();
  const names = new Set(form.getFields().map((f) => f.getName()));
  if (!names.has("dodge_pct") || !names.has("weapon_1_name_type")) {
    ui.notifications?.warn("TBE: that PDF is not the fillable TBE character sheet (v13): its form has no dodge_pct / weapon_1_name_type fields.");
    return;
  }
  const { text, check, overflow } = P.fieldsFor(actor);
  const missing = [];
  for (const [n, v] of Object.entries(text)) {
    if (!names.has(n)) { missing.push(n); continue; }
    try { form.getTextField(n).setText(v); } catch (e) { missing.push(n); }
  }
  for (const [n, on] of Object.entries(check)) {
    if (!names.has(n)) { missing.push(n); continue; }
    try { const cb = form.getCheckBox(n); on ? cb.check() : cb.uncheck(); } catch (e) { missing.push(n); }
  }
  const out = await doc.save();
  saveFile(out, "application/pdf", fileBase(actor) + ".pdf");
  const notes = [];
  if (overflow.length) notes.push("No room on the sheet for: " + overflow.join(", ") + ".");
  if (missing.length) notes.push("Fields this PDF does not have: " + missing.join(", ") + ".");
  ui.notifications?.info("TBE: filled the character sheet for " + actor.name + "." + (notes.length ? " " + notes.join(" ") : ""));
  if (notes.length) await TBE.say(TBE.card("TBE Sheet Exchange", "<div><b>" + TBE.esc(actor.name) + "</b>: sheet filled.</div>" +
    '<div style="font-size:11px">' + notes.map(TBE.esc).join("<br>") + "</div>"), [], { mode: TBE.MODES.SELF });
  return;
}

/* ---- import ---- */
const second = await TBE.prompt("TBE: Sheet Exchange — import",
  '<div style="font-size:13px">' +
  '<label style="display:block">A file (.pdf or .csv): <input type="file" name="file" accept=".pdf,.csv,.tsv,.txt,application/pdf,text/csv"></label>' +
  '<div style="margin:6px 0;opacity:.8">or paste cells copied from Google Sheets (for the Character Creator, select from cell A1 of its "Character Sheet" tab):</div>' +
  '<textarea name="text" rows="8" style="width:100%;font-family:monospace;font-size:11px"></textarea></div>',
  "Preview");
if (!second) return;

let rows = null, source = "", conversionProblems = [];
const hasFile = second.file && typeof second.file.arrayBuffer === "function" && second.file.size > 0;
const bytes = hasFile ? new Uint8Array(await second.file.arrayBuffer()) : null;
const head = bytes ? String.fromCharCode(...bytes.slice(0, 5)) : "";
if (head === "%PDF-") {
  const lib = await loadPdfLib();
  if (!lib) return;
  let form;
  try { form = (await lib.PDFDocument.load(bytes)).getForm(); }
  catch (e) { ui.notifications?.error("TBE: could not open that PDF (" + (e?.message ?? e) + ")."); return; }
  const byName = new Map(form.getFields().map((f) => [f.getName(), f]));
  if (!byName.has("dodge_pct")) { ui.notifications?.warn("TBE: that PDF is not the fillable TBE character sheet (v13)."); return; }
  const get = (n) => { const f = byName.get(n); try { return f && typeof f.getText === "function" ? (f.getText() ?? "") : ""; } catch (e) { return ""; } };
  const on = (n) => { const f = byName.get(n); try { return !!(f && typeof f.isChecked === "function" && f.isChecked()); } catch (e) { return false; } };
  const conv = P.rowsFrom(get, on);
  rows = conv.rows; conversionProblems = conv.problems; source = "the character sheet PDF";
} else {
  const text = bytes ? new TextDecoder("utf-8").decode(bytes) : (second.text || "");
  if (!text.trim()) { ui.notifications?.warn("TBE: nothing to import. Choose a file or paste the cells."); return; }
  const kind = C.detect(text);
  if (kind === "tbe-csv") { rows = C.parse(text); source = "a TBE-CSV file"; }
  else if (kind === "creator") {
    const conv = C.fromCreator(C.parse(text, true));
    rows = conv.rows; conversionProblems = conv.problems; source = "the Character Creator";
  } else {
    const why = C.creatorCheck(C.parse(text, true)).wrong.slice(0, 2).join("; ");
    ui.notifications?.warn("TBE: that is neither a TBE-CSV file nor the Character Creator (v0.6.5 or v0.7.0) \"Character Sheet\" tab." + (why ? " (" + why + ")" : ""));
    return;
  }
}

let actor = first.actor === "__new" ? null : game.actors.get(first.actor);
const probe = actor ?? { name: "", items: [], system: {} };
const plan = C.plan(probe, rows);
plan.problems = conversionProblems.concat(plan.problems);

const li = (xs) => xs.length ? "<ul style='margin:2px 0 6px 16px;padding:0'>" + xs.map((x) => "<li>" + x + "</li>").join("") + "</ul>" : "<div style='opacity:.6;margin-bottom:6px'>none</div>";
const preview =
  '<div style="font-size:12px;max-height:420px;overflow:auto">' +
  "<div>From " + source + " onto <b>" + (actor ? TBE.esc(actor.name) : "a new character") + "</b></div>" +
  "<div><b>Fields</b></div>" + li(plan.fields.map((f) => TBE.esc(f.label) + ": " + TBE.esc(String(f.from ?? "")) + " &rarr; <b>" + TBE.esc(String(f.to)) + "</b>")) +
  "<div><b>Skills changed</b></div>" + li(plan.skillUpdates.map((u) => TBE.esc(u.name) + ": " +
    Object.entries(u.changes).map(([k, v]) => (k.endsWith("expertise") ? "Ex " + v : k.endsWith("savvy") ? (v ? "Savvy" : "not Savvy") : v)).join(", "))) +
  "<div><b>Skills added</b></div>" + li(plan.skillCreates.map((s) => TBE.esc(s.name) + " " + s.value + (s.expertise ? " Ex" + s.expertise : "") + (s.savvy ? " Savvy" : "") + " (" + s.group + ")")) +
  ((plan.strandUpdates.length || plan.strandCreates.length) ? "<div><b>Strands</b></div>" + li(plan.strandUpdates.map((u) => TBE.esc(u.name) + " updated")
    .concat(plan.strandCreates.map((s) => TBE.esc(s.name) + " " + s.level + (s.thin ? " (thin)" : "")))) : "") +
  "<div><b>Talents added</b> (from the TBE Talents compendium)</div>" + li(plan.talents.map((t) => TBE.esc(t.name))) +
  "<div><b>Items added</b> (from the TBE Equipment compendium)</div>" + li(plan.items.map((t) => TBE.esc(t.name) + " (" + t.type + (t.locations?.length ? ": " + t.locations.join(", ") : "") + ")")) +
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

const { done, failed } = await C.apply(actor, plan);
await TBE.say(TBE.card("TBE Sheet Exchange",
  "<div>Imported " + TBE.esc(source) + " onto <b>" + TBE.esc(actor.name) + "</b>: " + done.length + " change(s)" +
  (failed.length ? ", " + failed.length + " not applied." : ".") + "</div>" +
  (failed.length ? '<div style="font-size:11px;color:#8b1a1a">' + failed.map(TBE.esc).join("<br>") + "</div>" : "") +
  (plan.problems.length ? '<div style="font-size:11px;opacity:.8">Skipped from the file: ' + plan.problems.map(TBE.esc).join("<br>") + "</div>" : "")),
  [], { mode: TBE.MODES.SELF });
