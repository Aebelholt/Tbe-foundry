/* Imported oracle tables (v0.55.0): turn a GM's own transcription of a
 * third-party oracle (a JSON file they keep) into world RollTables and one
 * reference journal, and let Random Events use them.
 *
 * Nothing in this file carries any oracle content. The system ships the
 * READER, never the tables: the content belongs to its publisher, whose
 * redistribution terms are restrictive (BACKLOG.md), so it stays in the GM's
 * file and in the GM's world.
 *
 * The file is walked by SHAPE, not by a list of names, so any transcription
 * laid out the same way imports:
 *   - an object with `entries` of `{roll, result}`        -> one d-N table
 *   - `entries` of `{roll, colA, colB...}` (strings)       -> one table per column
 *   - `entries` of `{range, result | name+text}` + a `die` -> one table
 *   - the same with `columns` (and `all_columns` rows)     -> one table per column
 *   - `entries` with ranges but no `die`                   -> a lookup: reference page
 *   - `same_as: "a.b"`                                      -> a copy of that table
 *   - everything else that is structured                   -> reference pages
 *   - record sheets (blank forms)                          -> skipped, and said so
 *
 * Every table is checked before it is written (rule: a verification that
 * is not mutation-tested is not done, see oracle_import_check.mjs):
 *   - a d-N list has rolls 1..N in order, each with text
 *   - ranges are integers, contiguous, never overlapping, and cover the die
 *     (a die with a modifier, "1d10+PP", may run past its top)
 *   - a printed range label agrees with its min/max
 *   - a column table has a cell in every column of every row
 * A table that fails is NOT imported and the reason is reported; the rest
 * still import. Transcription notes the file carries itself (inferred
 * labels, reconstructed layouts, possible slips) are surfaced as warnings.
 *
 * Pure planning (planImport, eventRoles) and a writer that is handed what it
 * writes to (applyImport), so a Node check runs both.
 */
export const SCOPE = "the-broken-empires";
export const FOLDER = "TBE Oracle (imported)";
export const JOURNAL = "TBE Oracle Reference";
export const OPEN_LOW = -999;
export const OPEN_HIGH = 999;

/* Record sheets: blank forms, not tables. */
const FORM_KEYS = /^(example_region_sheets|keyed_scenes_record_sheet|known_elements_region_sheet|adventure_lists_sheet|nested_characters_list_sheet|adventure_crafter_deck_lists|2e_adventure_lists)$/;
/* Transcription notes and labels, never content. */
const NOTE_KEYS = /^(meta|notable|repeats_in_transcription|cross_references|possible_transcription_slips|differences_from_.*|unassigned_.*|label_source|order|position|labels|labels_as_reassembled|layout_.*|reconstruct.*|note|notes|summary|conventions|schema_version|source|batches|at_a_glance|same_as|pairing_inferred|repeated_in_batch_2|title|die|columns|inferred|blank)$/;
/* Path segments that only group, dropped from a table's display name. */
const DROP = new Set(["variants", "tables", "descriptions", "actions", "entries"]);

const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const words = (k) => String(k).replace(/_/g, " ").replace(/\b([a-z])/g, (m) => m.toUpperCase());
const titleCase = (s) => String(s).toLowerCase().replace(/(^|[\s(/&-])([a-z])/g, (m, a, b) => a + b.toUpperCase());

export function displayName(path, node) {
  const segs = path.filter((s) => !DROP.has(s)).map(words);
  if (node?.title && segs.length) segs[segs.length - 1] = titleCase(node.title);
  return segs.join(" · ");
}

/* "1-7" -> [1,7]; "5" -> [5,5]; "10 or less" -> [null,10]; "16 or more" -> [16,null]. */
export function parseLabel(label) {
  const s = String(label ?? "").trim();
  let m;
  if ((m = s.match(/^(\d+)\s*-\s*(\d+)$/))) return [Number(m[1]), Number(m[2])];
  if ((m = s.match(/^(\d+)$/))) return [Number(m[1]), Number(m[1])];
  if ((m = s.match(/^(\d+)\s+or\s+less$/i))) return [null, Number(m[1])];
  if ((m = s.match(/^(\d+)\s+or\s+more$/i))) return [Number(m[1]), null];
  return undefined;
}

/* "1d100" -> {faces:100, mod:""}; "1d10+PP" -> {faces:10, mod:"PP"}; else null. */
export function parseDie(die) {
  const m = String(die ?? "").replace(/\s+/g, "").match(/^1d(\d+)(?:\+(.+))?$/i);
  return m ? { faces: Number(m[1]), mod: m[2] || "" } : null;
}

const cellText = (v) => (typeof v === "string" ? v.trim() : "");

/* Rows for one text-producing entry. */
function entryText(e) {
  if (typeof e.result === "string") return e.result.trim();
  if (typeof e.name === "string") return e.name.trim() + (typeof e.text === "string" && e.text.trim() ? ": " + e.text.trim() : "");
  if (e.result === null && e.blank) return "(left blank: your own result)";
  return "";
}

/* Check a list of [min,max] against a die. Returns a list of problems. */
export function checkCoverage(rows, faces, modded) {
  const bad = [];
  if (!rows.length) return ["no rows"];
  const sorted = rows.slice().sort((a, b) => (a.min ?? -Infinity) - (b.min ?? -Infinity));
  sorted.forEach((r, i) => {
    if (r.min !== null && !Number.isInteger(r.min)) bad.push("row " + r.label + ": " + r.min + " is not a whole number");
    if (r.max !== null && !Number.isInteger(r.max)) bad.push("row " + r.label + ": " + r.max + " is not a whole number");
    if (r.min === null && i !== 0) bad.push("row " + r.label + ": only the first row can be open at the bottom");
    if (r.max === null && i !== sorted.length - 1) bad.push("row " + r.label + ": only the last row can be open at the top");
    if (r.min !== null && r.max !== null && r.max < r.min) bad.push("row " + r.label + ": ends before it starts");
    if (i > 0) {
      const prev = sorted[i - 1];
      if (prev.max === null || r.min === null) return;
      if (r.min <= prev.max) bad.push("rows " + prev.label + " and " + r.label + " overlap");
      else if (r.min !== prev.max + 1) bad.push("nothing covers " + (prev.max + 1) + (r.min - 1 > prev.max + 1 ? "-" + (r.min - 1) : ""));
    }
  });
  const first = sorted[0], last = sorted[sorted.length - 1];
  if (first.min !== null && first.min > 1) bad.push("nothing covers 1" + (first.min > 2 ? "-" + (first.min - 1) : ""));
  if (!modded) {
    if (first.min !== null && first.min < 1) bad.push("row " + first.label + " starts below 1, which a 1d" + faces + " cannot roll");
    if (last.max !== null && last.max < faces) bad.push("nothing covers " + (last.max + 1) + (faces > last.max + 1 ? "-" + faces : ""));
    if (last.max !== null && last.max > faces) bad.push("row " + last.label + " runs past " + faces + ", which a 1d" + faces + " cannot roll");
  }
  return bad;
}

function flagWarnings(node, name, warnings) {
  if (node.reconstructed) warnings.push(name + ": reconstructed in the transcription" + (node.reconstruction_note ? " (" + node.reconstruction_note + ")" : "") + ".");
  if (node.layout_inferred) warnings.push(name + ": layout inferred" + (node.layout_note ? " (" + node.layout_note + ")" : "") + ".");
  if (node.pairing_inferred) warnings.push(name + ": pairing inferred" + (node.note ? " (" + node.note + ")" : "") + ".");
  if (/inferred/i.test(String(node.label_source || ""))) warnings.push(name + ": its label was inferred, not printed.");
  for (const s of node.possible_transcription_slips || []) {
    warnings.push("Possible slip in " + (s.table ? titleCase(s.table) : name) + (s.rolls ? " at " + s.rolls.join(", ") : "") + ": " + (s.text || "") + (s.note ? " (" + s.note + ")" : ""));
  }
  for (const l of node.unassigned_lines || []) warnings.push(name + ": a line with no row, kept out: \"" + l + "\"");
}

/** Plan tables for one entries-node. Pushes onto out.tables / out.errors. */
function planEntries(node, path, out) {
  const key = path.join(".");
  const name = displayName(path, node);
  const entries = node.entries;
  flagWarnings(node, name, out.warnings);
  const twice = /\belements\b/.test(key) || /roll (twice|2x)/i.test(String(node.summary || ""));
  const base = { group: words(path[0]), summary: typeof node.summary === "string" ? node.summary : "", twice };

  /* 1. roll-keyed lists */
  if (entries.every((e) => isObj(e) && "roll" in e)) {
    const bad = [];
    entries.forEach((e, i) => { if (e.roll !== i + 1) bad.push("roll " + e.roll + " is at position " + (i + 1) + " (rolls must run 1.." + entries.length + " in order)"); });
    const die = parseDie(node.die);
    if (node.die && (!die || die.mod)) bad.push("die \"" + node.die + "\" is not a plain 1dN");
    if (die && die.faces !== entries.length) bad.push("the die is 1d" + die.faces + " but there are " + entries.length + " rows");
    const faces = entries.length;
    const cols = typeof entries[0].result === "string" || "result" in entries[0]
      ? [null]
      : Object.keys(entries[0]).filter((k) => k !== "roll" && typeof entries[0][k] === "string");
    if (!cols.length) bad.push("no text column");
    if (bad.length) { out.errors.push({ key, name, problems: bad }); return; }
    for (const col of cols) {
      const k = col ? key + "." + col : key;
      const n = col ? name + " (" + words(col) + ")" : name;
      const empty = entries.filter((e) => !cellText(col ? e[col] : e.result)).map((e) => e.roll);
      if (empty.length) { out.errors.push({ key: k, name: n, problems: ["no text at roll " + empty.join(", ")] }); continue; }
      out.tables.push(Object.assign({}, base, { key: k, name: n, formula: "1d" + faces, modifier: "",
        results: entries.map((e) => ({ range: [e.roll, e.roll], text: cellText(col ? e[col] : e.result) })) }));
    }
    return;
  }

  /* 2. ranged tables */
  if (entries.every((e) => isObj(e) && isObj(e.range))) {
    const die = parseDie(node.die);
    if (!node.die) { out.reference.push({ key, name, data: node }); return; }   /* a lookup, not a roll */
    const bad = [];
    if (!die) bad.push("die \"" + node.die + "\" is not 1dN or 1dN+modifier");
    const rows = entries.map((e) => ({ min: e.range.min, max: e.range.max, label: e.range.label ?? (e.range.min + "-" + e.range.max), e }));
    for (const r of rows) {
      if (r.e.range.label === undefined) continue;
      const p = parseLabel(r.e.range.label);
      if (!p) bad.push("row label \"" + r.e.range.label + "\" is not a range");
      else if (p[0] !== r.min || p[1] !== r.max) bad.push("row label \"" + r.e.range.label + "\" disagrees with its min/max " + r.min + "/" + r.max);
    }
    if (die) bad.push(...checkCoverage(rows, die.faces, !!die.mod));
    if (bad.length) { out.errors.push({ key, name, problems: bad }); return; }
    const cols = Array.isArray(node.columns) && node.columns.length ? node.columns : [null];
    for (const col of cols) {
      const k = col ? key + "." + col : key;
      const n = col ? name + " (" + words(col) + ")" : name;
      const empty = [];
      const results = rows.map((r) => {
        const text = col ? (r.e.all_columns ? entryText(r.e) : cellText(r.e[col])) : entryText(r.e);
        if (!text) empty.push(r.label);
        return { range: [r.min ?? OPEN_LOW, r.max ?? OPEN_HIGH], text };
      });
      if (empty.length) { out.errors.push({ key: k, name: n, problems: ["no text in row " + empty.join(", ")] }); continue; }
      out.tables.push(Object.assign({}, base, { key: k, name: n, formula: "1d" + die.faces, modifier: die.mod, results }));
    }
    return;
  }

  /* 3. entries that are neither: reference */
  out.reference.push({ key, name, data: node });
}

function containsTable(v) {
  if (!isObj(v)) return false;
  if (Array.isArray(v.entries) || typeof v.same_as === "string") return true;
  return Object.values(v).some(containsTable);
}

function walk(node, path, out) {
  if (Array.isArray(node.entries) && node.entries.length) return planEntries(node, path, out);
  if (typeof node.same_as === "string") { out.aliases.push({ key: path.join("."), name: displayName(path, node), target: node.same_as }); return; }
  flagWarnings(node, displayName(path, node) || "the file", out.warnings);
  const rest = {};
  for (const [k, v] of Object.entries(node)) {
    if (FORM_KEYS.test(k)) { out.skipped.push(displayName(path.concat(k))); continue; }
    if (isObj(v) && containsTable(v)) { walk(v, path.concat(k), out); continue; }
    if (NOTE_KEYS.test(k)) continue;
    if (v !== null && typeof v === "object") rest[k] = v;
  }
  if (!Object.keys(rest).length) return;
  if (path.length) out.reference.push({ key: path.join("."), name: displayName(path, node), data: rest });
  else for (const [k, v] of Object.entries(rest)) out.reference.push({ key: k, name: displayName([k], v), data: v });
}

/* Resolve `same_as: "v1_batch1.descriptor_1"`: the one planned table whose
   key contains every segment, in order, and ends with the last. */
function resolveAlias(a, tables) {
  const segs = a.target.split(".");
  const hits = tables.filter((t) => {
    const ks = t.key.split(".");
    if (ks[ks.length - 1] !== segs[segs.length - 1]) return false;
    let i = 0;
    for (const s of ks) if (s === segs[i]) i++;
    return i === segs.length;
  });
  return hits;
}

/**
 * The whole plan. Never throws on content; returns what it would write and
 * why anything is left out.
 */
export function planImport(json) {
  const out = { source: "", tables: [], aliases: [], reference: [], skipped: [], errors: [], warnings: [] };
  if (!isObj(json)) { out.errors.push({ key: "", name: "the file", problems: ["it is not a JSON object"] }); return out; }
  out.source = String(json.meta?.source || "");
  for (const f of json.meta?.unassigned_fragments || []) out.warnings.push("A fragment with no home, kept out: \"" + f.text + "\"" + (f.likely_belongs_to ? " (probably " + words(f.likely_belongs_to) + ")" : "") + ".");
  walk(json, [], out);
  for (const a of out.aliases) {
    const hits = resolveAlias(a, out.tables);
    if (hits.length !== 1) { out.errors.push({ key: a.key, name: a.name, problems: ["\"same as " + a.target + "\" matches " + hits.length + " tables, not one"] }); continue; }
    out.tables.push(Object.assign({}, hits[0], { key: a.key, name: a.name, results: hits[0].results.map((r) => ({ range: r.range.slice(), text: r.text })) }));
  }
  /* Pairs: action_1 / action_2, descriptor_1 / descriptor_2 siblings. */
  const byKey = new Map(out.tables.map((t) => [t.key, t]));
  for (const t of out.tables) {
    const m = t.key.match(/^(.*_)1$/);
    if (m && byKey.has(m[1] + "2")) { t.pair = m[1] + "2"; t.pairName = byKey.get(m[1] + "2").name; }
  }
  const seen = new Map();
  for (const t of out.tables) {
    if (seen.has(t.name)) t.name = t.name + " [" + t.key.split(".").slice(-2).join(".") + "]";
    seen.set(t.name, true);
  }
  return out;
}

/* ---- reference HTML (escaped; content is the GM's own file) ------------- */
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function cell(v) {
  if (v === null || v === undefined) return "";
  if (isObj(v)) return v.label !== undefined ? esc(v.label) : Object.entries(v).map(([k, x]) => esc(words(k)) + ": " + cell(x)).join("; ");
  if (Array.isArray(v)) return v.map(cell).join(" / ");
  return esc(v);
}
export function referenceHtml(data) {
  const parts = [];
  const render = (k, v) => {
    if (Array.isArray(v) && v.length && v.every(isObj)) {
      const cols = [...new Set(v.flatMap((r) => Object.keys(r)))].filter((c) => !/^(line|u_marker)$/.test(c));
      parts.push((k ? "<h3>" + esc(words(k)) + "</h3>" : "") + "<table><tr>" + cols.map((c) => "<th>" + esc(words(c)) + "</th>").join("") + "</tr>" +
        v.map((r) => "<tr>" + cols.map((c) => "<td>" + cell(r[c]) + "</td>").join("") + "</tr>").join("") + "</table>");
    } else if (isObj(v)) {
      if (k) parts.push("<h3>" + esc(words(k)) + "</h3>");
      for (const [kk, vv] of Object.entries(v)) {
        if (NOTE_KEYS.test(kk) && kk !== "title") continue;
        if (vv !== null && typeof vv === "object") render(kk, vv);
        else parts.push("<p><b>" + esc(words(kk)) + ":</b> " + esc(vv) + "</p>");
      }
    } else if (Array.isArray(v)) parts.push((k ? "<h3>" + esc(words(k)) + "</h3>" : "") + "<p>" + v.map(esc).join("<br>") + "</p>");
  };
  render("", data);
  return parts.join("\n");
}

/* ---- which imported tables Random Events use ----------------------------- */
/**
 * Given the keys of imported tables, the focus table and the word pair a
 * Random Event rolls. Prefers the Meaningful Standard focus, then any focus
 * table; the NEWEST Meaning Tables Actions pair (v3 before v2 before v1: the
 * variant names sort that way). Null where nothing fits, so the caller falls
 * back to the TBE table for that slot alone.
 */
export function eventRoles(keys) {
  const ks = [...keys];
  const focus = ks.find((k) => k === "focus_table_meaningful_standard") ?? ks.filter((k) => /focus/i.test(k)).sort()[0] ?? null;
  const ones = ks.filter((k) => /(^|\.)actions\.action_1$/.test(k) && ks.includes(k.replace(/1$/, "2"))).sort().reverse();
  const w1 = ones[0] ?? null;
  return { focus, w1, w2: w1 ? w1.replace(/1$/, "2") : null };
}

/* ---- the writer ----------------------------------------------------------- */
/** A TableResult in whichever shape this Foundry's schema has (rule 7). */
export function resultData(r, fields, textType) {
  const short = r.text.length > 60 ? r.text.slice(0, 60) + "..." : r.text;
  if (fields?.name) return { range: r.range, weight: 1, type: textType, name: short, description: r.text };
  return { range: r.range, weight: 1, type: textType, text: r.text };
}

/**
 * Write a plan into a world. Everything it touches is passed in:
 *   deps = { tables: [RollTable], journals: [JournalEntry], folders: [Folder],
 *            RollTable, JournalEntry, Folder, resultFields, textType }
 * A table already imported (found by its flag key) is updated in place; its
 * new results are created BEFORE the old ones are deleted, so a failure part
 * way leaves the table with more rows, never with none.
 * Returns { created, updated, failed: [{name, error}] }.
 */
export async function applyImport(plan, deps) {
  const report = { created: [], updated: [], failed: [], journal: null };
  const folderOf = async (type) => {
    let f = (deps.folders || []).find((x) => x.name === FOLDER && x.type === type);
    if (!f) f = await deps.Folder.create({ name: FOLDER, type });
    return f;
  };
  const flagKey = (d) => d?.flags?.[SCOPE]?.oracle?.key ?? d?.getFlag?.(SCOPE, "oracle")?.key;
  let tFolder = null;
  try { tFolder = plan.tables.length ? await folderOf("RollTable") : null; }
  catch (err) { report.failed.push({ name: "the folder", error: err?.message || String(err) }); }
  for (const t of plan.tables) {
    const flags = { [SCOPE]: { oracle: { key: t.key, group: t.group, modifier: t.modifier, twice: !!t.twice, pair: t.pair ?? null, source: plan.source } } };
    const description = [t.summary, t.modifier ? "Roll " + t.formula + " + " + t.modifier + "." : ""].filter(Boolean).join(" ");
    const results = t.results.map((r) => resultData(r, deps.resultFields, deps.textType));
    try {
      const existing = (deps.tables || []).find((x) => flagKey(x) === t.key);
      if (existing) {
        const old = (existing.results?.contents ?? [...(existing.results ?? [])]).map((r) => r.id ?? r._id);
        await existing.createEmbeddedDocuments("TableResult", results);
        if (old.length) await existing.deleteEmbeddedDocuments("TableResult", old);
        await existing.update({ name: t.name, formula: t.formula, description, flags, folder: tFolder?.id ?? existing.folder?.id ?? null });
        report.updated.push(t.name);
      } else {
        /* Observer for everyone: players roll these through Random Event and
           TBE: Oracle Tables on their own clients. */
        await deps.RollTable.create({ name: t.name, formula: t.formula, description, replacement: true, displayRoll: true,
          folder: tFolder?.id ?? null, flags, results, ownership: { default: deps.observer ?? 2 } });
        report.created.push(t.name);
      }
    } catch (err) {
      report.failed.push({ name: t.name, error: err?.message || String(err) });
    }
  }
  if (plan.reference.length) {
    try {
      const pages = plan.reference.map((r, i) => ({ name: r.name, type: "text", sort: i * 100, text: { content: referenceHtml(r.data), format: 1 } }));
      const existing = (deps.journals || []).find((j) => j?.flags?.[SCOPE]?.oracleReference ?? j?.getFlag?.(SCOPE, "oracleReference"));
      if (existing) {
        const old = (existing.pages?.contents ?? [...(existing.pages ?? [])]).map((p) => p.id ?? p._id);
        await existing.createEmbeddedDocuments("JournalEntryPage", pages);
        if (old.length) await existing.deleteEmbeddedDocuments("JournalEntryPage", old);
        report.journal = "updated";
      } else {
        const jf = await folderOf("JournalEntry");
        await deps.JournalEntry.create({ name: JOURNAL, folder: jf?.id ?? null, ownership: { default: deps.observer ?? 2 }, flags: { [SCOPE]: { oracleReference: true } }, pages });
        report.journal = "created";
      }
    } catch (err) {
      report.failed.push({ name: JOURNAL, error: err?.message || String(err) });
    }
  }
  return report;
}

/* ---- Foundry glue --------------------------------------------------------- */
export function importedTables() {
  return (game.tables?.contents ?? []).filter((t) => t.getFlag?.(SCOPE, "oracle")?.key);
}

/** The imported focus / word tables for a Random Event, or null when the
 *  world setting is off or nothing is imported. */
export function eventTables() {
  let on = false;
  try { on = !!game.settings.get(SCOPE, "oracleEvents"); } catch (e) { on = false; }
  if (!on) return null;
  const byKey = new Map(importedTables().map((t) => [t.getFlag(SCOPE, "oracle").key, t]));
  if (!byKey.size) return null;
  const roles = eventRoles(byKey.keys());
  return { focus: roles.focus ? byKey.get(roles.focus) : null, w1: roles.w1 ? byKey.get(roles.w1) : null, w2: roles.w2 ? byKey.get(roles.w2) : null };
}

export async function importFile(json, useForEvents) {
  if (!game.user?.isGM) return { refused: "Only the GM can import oracle tables: they are created in the world." };
  const plan = planImport(json);
  const TR = CONFIG.TableResult?.documentClass;
  const report = await applyImport(plan, {
    tables: importedTables(), journals: game.journal?.contents ?? [], folders: game.folders?.contents ?? [],
    RollTable, JournalEntry, Folder, observer: CONST.DOCUMENT_OWNERSHIP_LEVELS?.OBSERVER ?? 2,
    resultFields: TR?.schema?.fields, textType: CONST.TABLE_RESULT_TYPES?.TEXT ?? "text"
  });
  if (useForEvents && (report.created.length || report.updated.length)) {
    try { await game.settings.set(SCOPE, "oracleEvents", true); } catch (e) { report.failed.push({ name: "the Random Events setting", error: e?.message || String(e) }); }
  }
  return { plan, report };
}

export function registerSetting() {
  game.settings.register(SCOPE, "oracleEvents", {
    name: "TBE.Settings.OracleEvents.Name", hint: "TBE.Settings.OracleEvents.Hint",
    scope: "world", config: true, type: Boolean, default: false
  });
}
