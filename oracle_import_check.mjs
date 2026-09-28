#!/usr/bin/env node
/*
 * oracle_import_check.mjs -- TBE: Import Oracle Tables and TBE: Oracle Tables
 * (v0.55.0), owned by module/helpers/oracle-import.mjs.
 *
 * The system ships a READER for a GM's own oracle file and none of the
 * content (its publisher's redistribution terms are restrictive, BACKLOG.md).
 * So the fixture here, test-fixtures/oracle_shapes.json, is invented words in
 * every SHAPE the playtest GM's transcription uses. Point TBE_ORACLE_JSON at a
 * real file to plan it too (section 8); it is never committed.
 *
 *   1. The plan: which tables, formulas, ranges, columns, pairs, references,
 *      skipped record sheets and warnings a file gives.
 *   2. Every check refuses the table it should, leaves the rest, and says why:
 *      a gap, an overlap, a label that disagrees, rolls out of order, an empty
 *      cell, a die that cannot roll the rows, an unresolvable "same as".
 *   3. Mutations of the CHECKER: with coverage checking removed a gap passes,
 *      which proves section 2's gap assertion is live.
 *   4. SEQUENCE through a stub world: import, import again (updated in place,
 *      never duplicated), a failure part way (the old rows survive), the
 *      reference journal, V12 and V13 result shapes. Mutation: delete-first.
 *   5. Which imported tables a Random Event rolls: newest Meaning pair, the
 *      Meaningful focus, per-slot fallback.
 *   6. The macro library: TBE.event and TBE.eventWords roll imported tables
 *      when the system says so, TBE tables otherwise, and Subverted Scene uses
 *      the owner rather than naming the TBE tables itself.
 *   7. The macros: GM gate, preview before writing, remembered pick, pairs.
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

let pass = 0, fail = 0;
const check = (cond, label, extra) => {
  if (cond) { pass++; console.log("  PASS  " + label); }
  else { fail++; console.log("  FAIL  " + label + (extra !== undefined ? "  <- " + JSON.stringify(extra).slice(0, 500) : "")); }
};
const section = (s) => console.log("\n" + s);
const OWNER = "./system/the-broken-empires/module/helpers/oracle-import.mjs";
const O = await import(OWNER);
const FIX = JSON.parse(fs.readFileSync("test-fixtures/oracle_shapes.json", "utf8"));
const clone = (x) => JSON.parse(JSON.stringify(x));
const plan = O.planImport(FIX);
const T = (k) => plan.tables.find((t) => t.key === k);
const E = (p, k) => p.errors.find((e) => e.key === k);

/* ------------------------------------------------------------------ 1 */
section("1. The plan");
check(plan.errors.length === 0, "the fixture plans with no errors", plan.errors);
check(plan.source === "Synthetic shapes fixture (invented words)", "the source is read from meta");
const want = [
  "meaning_tables.variants.v1_batch1.descriptions.descriptor_1", "meaning_tables.variants.v1_batch1.descriptions.descriptor_2",
  "meaning_tables.variants.v1_batch1.actions.action_1", "meaning_tables.variants.v1_batch1.actions.action_2",
  "meaning_tables.variants.v2_alphabetical_a.descriptions.descriptor_1",
  "meaning_tables.variants.v3_batch3.actions.action_1", "meaning_tables.variants.v3_batch3.actions.action_2",
  "meaning_tables.elements.tables.places", "meaning_tables.unlabeled_list_1",
  "focus_table_meaningful_standard",
  "location_crafter_randomized.region_descriptors_table.wild", "location_crafter_randomized.region_descriptors_table.town",
  "location_crafter_randomized.area_elements_table.big", "location_crafter_randomized.area_elements_table.small",
  "location_crafter_randomized.random_element_descriptors_table.spots", "location_crafter_randomized.random_element_descriptors_table.things",
  "location_crafter_randomized.special_elements_table", "adaptable_event_focus_table", "creatures.description_table",
  "the_entity.nature_table", "adventure_lists.adventure_crafter_lists.characters_list"
];
const got = plan.tables.map((t) => t.key).sort();
check(JSON.stringify(got) === JSON.stringify(want.slice().sort()), "exactly the tables the file holds, one per column", { extra: got.filter((k) => !want.includes(k)), missing: want.filter((k) => !got.includes(k)) });
check(T("meaning_tables.variants.v3_batch3.actions.action_1").formula === "1d10" && T("location_crafter_randomized.random_element_descriptors_table.spots").formula === "1d100",
  "a plain list's die is its length");
const v3 = T("meaning_tables.variants.v3_batch3.actions.action_1");
check(v3.results.length === 10 && v3.results[3].text === "NewActA4" && v3.results[3].range.join() === "4,4", "a list row keeps its roll and text");
const wild = T("location_crafter_randomized.region_descriptors_table.wild"), town = T("location_crafter_randomized.region_descriptors_table.town");
check(wild.results.map((r) => r.text).join() === "Wet,Dry,Odd" && town.results.map((r) => r.text).join() === "Busy,Quiet,Odd",
  "a column table becomes one table per column, and an all-columns row lands in each");
const big = T("location_crafter_randomized.area_elements_table.big");
check(big.formula === "1d10" && big.modifier === "PP" && big.results[2].range.join() === "16," + O.OPEN_HIGH,
  "a modified die rolls its base, remembers its modifier, and an open top row runs to the ceiling");
check(T("location_crafter_randomized.special_elements_table").results[0].text === "GROW: Make it bigger.", "a name + text row reads as both");
check(T("adaptable_event_focus_table").results[1].text === "(left blank: your own result)", "a row printed blank is kept, and says so");
const alias = T("meaning_tables.variants.v2_alphabetical_a.descriptions.descriptor_1");
check(alias && JSON.stringify(alias.results) === JSON.stringify(T("meaning_tables.variants.v1_batch1.descriptions.descriptor_1").results),
  "\"same as\" copies the table it names");
check(v3.pair === "meaning_tables.variants.v3_batch3.actions.action_2" && T("meaning_tables.variants.v1_batch1.descriptions.descriptor_1").pair
  && !T("meaning_tables.unlabeled_list_1").pair, "Action 1 / 2 and Descriptor 1 / 2 are paired; a lone \"_1\" list is not");
check(T("meaning_tables.elements.tables.places").twice && T("location_crafter_randomized.random_element_descriptors_table.spots").twice && !v3.twice,
  "Elements tables and tables whose notes say \"roll twice\" roll twice by default");
check(T("meaning_tables.elements.tables.places").name === "Meaning Tables · Elements · Places & Halls", "names come from the path, with a printed title where there is one");
check(new Set(plan.tables.map((t) => t.name)).size === plan.tables.length, "every table name is unique");
check(O.displayName(["x"], { title: "“QUOTED” STANDARD TABLE" }) === "“Quoted” Standard Table", "a title that opens with a quote is still capitalised");
const refs = plan.reference.map((r) => r.key).sort();
check(["creatures", "disposition_score_modifier_table", "fate_check_modifiers_updated", "fulfillment", "mythic_deck_resisted_ranks_modifier",
  "simplified_npc_action_table", "the_entity"].every((k) => refs.includes(k)) && refs.length === 7,
  "lookups with no die, question tables and rules text become reference pages", refs);
check(plan.skipped.length === 5 && ["Known Elements Region Sheet", "Example Region Sheets", "Keyed Scenes Record Sheet"].every((n) => plan.skipped.some((s) => s.includes(n))),
  "blank record sheets are skipped and named", plan.skipped);
const warn = plan.warnings.join(" | ");
check(/Possible slip in Places at 4, 5: Zeta, Alpha/.test(warn), "the file's own possible slips are reported", warn);
check(/label was inferred/.test(warn) && /reconstructed/.test(warn) && /An orphan line/.test(warn) && /STRAY/.test(warn),
  "inferred labels, reconstructed tables, orphan lines and stray fragments are reported");
const html = O.referenceHtml(plan.reference.find((r) => r.key === "fate_check_modifiers_updated").data);
check(/<table>/.test(html) && /EVEN/.test(html) && /Chaos Factor/.test(html), "a reference page renders its arrays as tables");
check(!/<script/i.test(O.referenceHtml({ x: [{ a: "<script>alert(1)</script>" }] })), "reference text is escaped");

/* ------------------------------------------------------------------ 2 */
section("2. Each check refuses the table it should, and only that table");
const mutate = (fn) => { const j = clone(FIX); fn(j); return O.planImport(j); };
const cases = [
  ["a gap", "focus_table_meaningful_standard", (j) => { j.focus_table_meaningful_standard.entries[1].range = { min: 42, max: 70, label: "42-70" }; }, /nothing covers 41/],
  ["an overlap", "focus_table_meaningful_standard", (j) => { j.focus_table_meaningful_standard.entries[1].range = { min: 40, max: 70, label: "40-70" }; }, /overlap/],
  ["a label that disagrees with its numbers", "focus_table_meaningful_standard", (j) => { j.focus_table_meaningful_standard.entries[1].range.label = "41-71"; }, /disagrees/],
  ["a top row short of the die", "focus_table_meaningful_standard", (j) => { j.focus_table_meaningful_standard.entries[2].range = { min: 71, max: 99, label: "71-99" }; }, /nothing covers 100/],
  ["a row past the die", "creatures.description_table", (j) => { j.creatures.description_table.die = "1d8"; }, /1d8 but there are 10 rows/],
  ["rolls out of order", "meaning_tables.unlabeled_list_1", (j) => { j.meaning_tables.unlabeled_list_1.entries[4].roll = 6; }, /roll 6 is at position 5/],
  ["an empty cell", "location_crafter_randomized.region_descriptors_table.town", (j) => { j.location_crafter_randomized.region_descriptors_table.entries[0].town = ""; }, /no text in row 1-50/],
  ["an open-topped row that is not last", "location_crafter_randomized.area_elements_table", (j) => { j.location_crafter_randomized.area_elements_table.entries[1].range = { min: 6, max: null, label: "6 or more" }; }, /only the last row can be open at the top/],
  ["an open-bottomed row that is not first", "location_crafter_randomized.area_elements_table", (j) => { j.location_crafter_randomized.area_elements_table.entries[1].range = { min: null, max: 15, label: "15 or less" }; }, /overlap/],
  ["a die that is not a die", "location_crafter_randomized.special_elements_table", (j) => { j.location_crafter_randomized.special_elements_table.die = "2d6"; }, /not 1dN/],
  ["a \"same as\" that names nothing", "meaning_tables.variants.v2_alphabetical_a.descriptions.descriptor_1", (j) => { j.meaning_tables.variants.v2_alphabetical_a.descriptions.descriptor_1.same_as = "v9.descriptor_1"; }, /matches 0 tables/]
];
for (const [what, key, fn, why] of cases) {
  const p = mutate(fn);
  const e = E(p, key);
  const others = p.tables.length >= plan.tables.length - 2;
  check(e && why.test(e.problems.join("; ")) && !p.tables.some((t) => t.key === key) && others,
    what + ": refused, with the reason, and the other tables still import", e ?? p.errors);
}

/* ------------------------------------------------------------------ 3 */
section("3. Mutating the checker");
{
  const src = fs.readFileSync(OWNER, "utf8");
  const mutated = src.replace("if (die) bad.push(...checkCoverage(rows, die.faces, !!die.mod));", "");
  check(mutated !== src, "the coverage call is where section 3 expects it");
  const file = path.resolve("system/the-broken-empires/module/helpers/.oracle-import.mut.mjs");
  fs.writeFileSync(file, mutated);
  try {
    const M = await import(pathToFileURL(file).href + "?m=" + Date.now());
    const j = clone(FIX); j.focus_table_meaningful_standard.entries[1].range = { min: 42, max: 70, label: "42-70" };
    check(!E(M.planImport(j), "focus_table_meaningful_standard"), "without coverage checking a gap imports silently, so section 2's gap assertion is live");
  } finally { fs.unlinkSync(file); }
  check(O.checkCoverage([{ min: 1, max: 5, label: "1-5" }, { min: 6, max: 10, label: "6-10" }], 10, false).length === 0
    && O.checkCoverage([{ min: 1, max: 5, label: "1-5" }, { min: 6, max: null, label: "6 or more" }], 10, true).length === 0, "a clean table passes both ways");
  check(O.parseLabel("10 or less").join() === ",10" && O.parseLabel("16 or more").join() === "16," && O.parseLabel("7").join() === "7,7" && O.parseLabel("x") === undefined,
    "range labels parse the four ways the file prints them");
}

/* ------------------------------------------------------------------ 4 */
section("4. Writing, as a sequence");
function world(opts = {}) {
  const log = [];
  let n = 0;
  const id = () => "id" + (++n);
  const tables = [], journals = [], folders = [];
  const coll = (arr) => Object.assign(arr, { contents: arr });
  const mkResults = (rs) => coll(rs.map((r) => Object.assign({ id: id() }, r)));
  class RollTable {
    static async create(d) {
      if (opts.failCreate && d.name === opts.failCreate) throw new Error("create refused");
      const t = Object.assign(new RollTable(), d, { id: id() });
      t.results = mkResults(d.results || []);
      tables.push(t); log.push("create " + d.name); return t;
    }
    async createEmbeddedDocuments(type, rows) {
      if (opts.failRows && this.name === opts.failRows) throw new Error("rows refused");
      log.push("add " + this.name); this.results.push(...rows.map((r) => Object.assign({ id: id() }, r))); return rows;
    }
    async deleteEmbeddedDocuments(type, ids) {
      log.push("delete " + this.name);
      const keep = this.results.filter((r) => !ids.includes(r.id)); this.results.length = 0; this.results.push(...keep); return ids;
    }
    async update(d) { Object.assign(this, d); log.push("update " + this.name); return this; }
  }
  class JournalEntry {
    static async create(d) { const j = Object.assign(new JournalEntry(), d, { id: id() }); j.pages = coll((d.pages || []).map((p) => Object.assign({ id: id() }, p))); journals.push(j); log.push("journal create"); return j; }
    async createEmbeddedDocuments(t, ps) { this.pages.push(...ps.map((p) => Object.assign({ id: id() }, p))); log.push("journal add"); }
    async deleteEmbeddedDocuments(t, ids) { const keep = this.pages.filter((p) => !ids.includes(p.id)); this.pages.length = 0; this.pages.push(...keep); log.push("journal delete"); }
  }
  const Folder = { async create(d) { const f = Object.assign({ id: id() }, d); folders.push(f); log.push("folder " + d.type); return f; } };
  return { opts, log, tables, journals, folders, deps: (fields) => ({ tables, journals, folders, RollTable, JournalEntry, Folder, resultFields: fields, textType: "text", observer: 2 }) };
}
const V13 = { name: {}, description: {} }, V12 = { text: {} };
{
  const w = world();
  const r1 = await O.applyImport(plan, w.deps(V13));
  check(r1.created.length === plan.tables.length && !r1.failed.length && r1.journal === "created", "first import creates every table and the reference journal", r1.failed);
  check(w.folders.filter((f) => f.type === "RollTable").length === 1 && w.tables.every((t) => t.folder === w.folders[0].id), "all tables go in one folder");
  check(w.tables.every((t) => t.ownership?.default === 2) && w.journals[0].ownership?.default === 2, "players can observe them, so their clients can roll them");
  const first = w.tables[0];
  check(first.results[0].name !== undefined && first.results[0].description !== undefined && first.results[0].text === undefined, "V13 schema: results carry name and description");
  const focus = w.tables.find((t) => t.flags["the-broken-empires"].oracle.key === "focus_table_meaningful_standard");
  const idsBefore = w.tables.map((t) => t.id).join();

  /* Import again after the GM fixed a word. */
  const j2 = clone(FIX); j2.focus_table_meaningful_standard.entries[0].result = "FOCUS ONE, FIXED";
  const p2 = O.planImport(j2);
  w.log.length = 0;
  const r2 = await O.applyImport(p2, w.deps(V13));
  check(r2.updated.length === plan.tables.length && !r2.created.length && w.tables.map((t) => t.id).join() === idsBefore, "importing again updates the same tables in place, no duplicates");
  check(focus.results.length === 3 && focus.results[0].description === "FOCUS ONE, FIXED", "and the fix is what the table now holds");
  const fl = w.log.filter((l) => l.endsWith(" " + focus.name));
  check(fl.indexOf("add " + focus.name) < fl.indexOf("delete " + focus.name), "new rows are added before old rows are deleted");
  check(w.folders.length === 2 && r2.journal === "updated" && w.journals.length === 1 && w.journals[0].pages.length === plan.reference.length,
    "the folders and the journal are reused, the journal's pages replaced");

  /* A failure part way: the same world, one table refusing new rows. */
  const w3 = world(); await O.applyImport(plan, w3.deps(V13));
  const target = w3.tables.find((t) => t.flags["the-broken-empires"].oracle.key === "focus_table_meaningful_standard");
  w3.opts.failRows = target.name;
  const r3 = await O.applyImport(p2, w3.deps(V13));
  check(r3.failed.length === 1 && r3.failed[0].name === target.name && target.results.length === 3 && target.results[0].description === "FOCUS ONE",
    "a table that cannot take its new rows keeps its old ones, and is named", r3.failed);
  check(r3.updated.length === plan.tables.length - 1, "the other tables still update");

  /* V12 shape. */
  const w4 = world(); await O.applyImport(plan, w4.deps(V12));
  check(w4.tables[0].results[0].text !== undefined && w4.tables[0].results[0].name === undefined, "V12 schema: results carry text (the shape found, not a version number)");

  /* Mutation: delete-first. */
  const src = fs.readFileSync(OWNER, "utf8");
  const a = 'await existing.createEmbeddedDocuments("TableResult", results);\n        if (old.length) await existing.deleteEmbeddedDocuments("TableResult", old);';
  check(src.includes(a), "the create-then-delete order is where the mutation expects it");
  const mutated = src.replace(a, 'if (old.length) await existing.deleteEmbeddedDocuments("TableResult", old);\n        await existing.createEmbeddedDocuments("TableResult", results);');
  const file = path.resolve("system/the-broken-empires/module/helpers/.oracle-import.mut2.mjs");
  fs.writeFileSync(file, mutated);
  try {
    const M = await import(pathToFileURL(file).href + "?m=" + Date.now());
    const w5 = world(); await M.applyImport(plan, w5.deps(V13));
    const t5 = w5.tables.find((t) => t.flags["the-broken-empires"].oracle.key === "focus_table_meaningful_standard");
    w5.opts.failRows = t5.name;
    await M.applyImport(p2, w5.deps(V13));
    check(t5.results.length === 0, "mutation: deleting first leaves the failed table empty, which is what the order prevents");
  } finally { fs.unlinkSync(file); }
}

/* ------------------------------------------------------------------ 5 */
section("5. Which tables a Random Event rolls");
{
  const keys = plan.tables.map((t) => t.key);
  const r = O.eventRoles(keys);
  check(r.focus === "focus_table_meaningful_standard", "the Meaningful Standard focus first");
  check(r.w1 === "meaning_tables.variants.v3_batch3.actions.action_1" && r.w2 === "meaning_tables.variants.v3_batch3.actions.action_2", "the newest Meaning Actions pair (v3 before v1)");
  const r2 = O.eventRoles(keys.filter((k) => !/v3_batch3|focus_table_meaningful/.test(k)));
  check(r2.focus === "adaptable_event_focus_table" && r2.w1 === "meaning_tables.variants.v1_batch1.actions.action_1", "without them: any focus table, then the older pair");
  const r3 = O.eventRoles(["meaning_tables.variants.v3_batch3.actions.action_1"]);
  check(r3.w1 === null && r3.w2 === null && r3.focus === null, "half a pair is no pair, and nothing is guessed");
}

/* ------------------------------------------------------------------ 6 */
section("6. The macro library");
{
  const lib = fs.readFileSync("macros/_lib.js", "utf8");
  const TBE = new Function("const TBE_DATA = { tables: [] };\n" + lib + "\n;return TBE;")();
  const drawn = [];
  const doc = (name, text) => ({ name, roll: async () => { drawn.push(name); return { results: [{ description: text }], roll: { total: 1 } }; } });
  const named = new Map([["TBE: Random Events", doc("TBE: Random Events", "tbe focus")], ["TBE: Event Randomizers I", doc("TBE: Event Randomizers I", "tbe w1")], ["TBE: Event Randomizers II", doc("TBE: Event Randomizers II", "tbe w2")]]);
  const tablesColl = { getName: (n) => named.get(n) };
  globalThis.game = { tables: tablesColl, thebrokenempires: { oracle: { eventTables: () => ({ focus: doc("Imported focus", "NPC ACTION"), w1: doc("Imported A1", "Guard"), w2: doc("Imported A2", "Secret") }) } } };
  const e = await TBE.event();
  check(e.focus === "NPC ACTION" && e.w1 === "Guard" && e.w2 === "Secret", "with the setting on, a Random Event rolls the imported tables", e);
  globalThis.game.thebrokenempires.oracle.eventTables = () => ({ focus: null, w1: doc("Imported A1", "Guard"), w2: doc("Imported A2", "Secret") });
  const e2 = await TBE.event();
  check(e2.focus === "tbe focus" && e2.w1 === "Guard", "a slot the import cannot fill falls back to the TBE table, alone");
  globalThis.game.thebrokenempires.oracle.eventTables = () => null;
  const e3 = await TBE.event(), w = await TBE.eventWords();
  check(e3.focus === "tbe focus" && e3.w1 === "tbe w1" && w.w1 === "tbe w1" && w.w2 === "tbe w2", "with it off, the TBE tables, as before");
  globalThis.game = { tables: tablesColl };
  const e4 = await TBE.event();
  check(e4.w2 === "tbe w2", "without the system at all, the TBE tables");
  globalThis.game = { tables: tablesColl, thebrokenempires: { oracle: { eventTables: () => { throw new Error("boom"); } } } };
  const e5 = await TBE.event();
  check(e5.focus === "tbe focus", "an owner that throws never breaks a Random Event");
  delete globalThis.game;
  const sub = fs.readFileSync("macros/tbe-subverted-scene.js", "utf8");
  check(/TBE\.eventWords\(\)/.test(sub) && !/Event Randomizers/.test(sub), "Subverted Scene asks the owner for its word pair instead of naming the TBE tables");
  const ask = fs.readFileSync("macros/ask-the-weave.js", "utf8");
  check(/TBE\.event\(\)/.test(ask), "Ask the Weave's doubles go through TBE.event, so they follow the setting");
  const own = fs.readFileSync(OWNER, "utf8");
  check(/game\.settings\.get\(SCOPE, "oracleEvents"\)/.test(own) && /default: false/.test(own), "the setting is off until a GM turns it on (or ticks it on import)");
}

/* ------------------------------------------------------------------ 7 */
section("7. The macros");
{
  const imp = fs.readFileSync("macros/tbe-import-oracle.js", "utf8");
  const ora = fs.readFileSync("macros/tbe-oracle-tables.js", "utf8");
  check(/^if \(!game\.user\.isGM\) \{\s*ui\.notifications\?\.warn\(/m.test(imp), "import is GM only, and a player is told why");
  const iPlan = imp.indexOf("O.plan(json)"), iPrev = imp.indexOf('"Import")'), iWrite = imp.indexOf("O.importFile(");
  check(iPlan > 0 && iPlan < iPrev && iPrev < iWrite, "the plan is shown before anything is written");
  check(/JSON\.parse/.test(imp) && /not valid JSON/.test(imp), "a file that is not JSON gets a sentence");
  check(/TBE\.MODES\.SELF/.test(imp), "the import report is whispered to the GM, not posted to the table");
  check(/TBE\.recall\("oracle", "table"\)/.test(ora) && /TBE\.remember\("oracle", "table", table\.id\)/.test(ora), "Oracle Tables remembers the last table picked");
  check(/if \(partner\) got\.push\(await draw\(partner\)\)/.test(ora) && /seconds\.has/.test(ora), "a paired table rolls both halves and is offered once");
  check(/m\.modifier \? TBE\.num\(data\.mod, 0\) : 0/.test(ora), "a modifier applies only to a table rolled with one");
  check(/no oracle tables imported yet/.test(ora), "with nothing imported, it says so");
  const panel = fs.readFileSync("macros/tbe-solo-panel.js", "utf8"), build = fs.readFileSync("build.js", "utf8");
  check(/"TBE: Oracle Tables"/.test(panel) && /"TBE: Import Oracle Tables"/.test(panel) && /tbe-oracle-tables\.js/.test(build) && /tbe-import-oracle\.js/.test(build),
    "both are on the Solo Panel and in the macro pack");
  const shipped = fs.readFileSync(OWNER, "utf8") + imp + ora;
  check(!/Abandoned|Adventurously|Attainment/.test(shipped), "nothing of any oracle's content is in what ships");
}

/* ------------------------------------------------------------------ 8 */
if (process.env.TBE_ORACLE_JSON) {
  section("8. A real file (TBE_ORACLE_JSON)");
  const real = O.planImport(JSON.parse(fs.readFileSync(process.env.TBE_ORACLE_JSON, "utf8")));
  console.log("  " + real.tables.length + " tables, " + real.reference.length + " reference pages, " + real.skipped.length + " skipped, " + real.warnings.length + " notes");
  for (const e of real.errors) console.log("  refused: " + e.name + ": " + e.problems.join("; "));
  check(real.tables.length > 0, "the real file plans tables");
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
