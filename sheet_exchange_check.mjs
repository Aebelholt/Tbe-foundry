/*
 * sheet_exchange_check.mjs -- TBE: Sheet Exchange (character <-> spreadsheet).
 * Runs the real TBE.sheetCsv out of macros/_lib.js and the real built macro
 * against stub actors. The central claim is SEQUENTIAL (rule 9): export, then
 * import the same file, changes nothing.
 */
import { readFileSync } from "node:fs";

let pass = 0, fail = 0;
const check = (cond, label, extra) => {
  if (cond) { pass++; console.log("  PASS  " + label); }
  else { fail++; console.log("  FAIL  " + label + (extra !== undefined ? "  <- " + JSON.stringify(extra).slice(0, 400) : "")); }
};
const LIB = readFileSync("macros/_lib.js", "utf8");
const loadTBE = (src = LIB) => new Function("canvas", "game", "foundry", "ui", "CONFIG", src + "\n;return TBE;")(
  { tokens: { controlled: [] } }, { user: { character: null } }, { utils: {} },
  { notifications: { warn() {}, error() {}, info() {} } }, undefined);
const TBE = loadTBE();
const C = TBE.sheetCsv;

const skill = (name, value, group, expertise = 0) => ({ type: "skill", name, system: { value, group, expertise, fighting: group === "Combat" } });
const renn = () => ({
  id: "renn", name: "Renn Kestrel", type: "character", isOwner: true,
  system: { race: "Human", culture: "Dornross", career: "Sailor", size: "Medium", silver: 12, status: 1,
    experience: { available: 3, earned: 10 }, deathThreshold: { value: 20, max: 20 }, resolve: { value: 2, max: 3 },
    toughness: 0, initiative: 11, deity: "" },
  items: [skill("Common Lore", 70, "Lore", 2), skill("Perception", 65, "Adventuring"), skill("Melee: Light", 40, "Combat"),
    skill("Salt-wise", 30, "Wise"),
    { type: "talent", name: "Combat Awareness", system: { ranks: 2, specialization: "" } },
    { type: "weapon", name: "Dagger", system: {} }, { type: "armor", name: "Leather", system: {} }]
});

console.log("\n1. Export, then import the same file: nothing changes");
{
  const a = renn();
  const rows = C.rowsFor(a);
  const csv = C.toCsv(rows);
  const plan = C.plan(a, C.parse(csv));
  check(C.isEmpty(plan) && !plan.problems.length, "round trip plans no change and no problem", plan);
  check(rows.some((r) => r[0] === "skill" && r[1] === "Intimidate" && r[2] === "20" && /untrained/.test(r[4])),
    "untrained catalogue skills are in the file at 20, noted");
  check(rows.some((r) => r[0] === "skill" && r[1] === "Salt-wise" && /group Wise/.test(r[4])), "a -wise carries its group so it can come back");
  check(rows.some((r) => r[0] === "skill" && r[1] === "Common Lore" && r[3] === "2"), "Expertise has its own column");
  check(rows.some((r) => r[0] === "talent" && r[1] === "Combat Awareness" && r[2] === "2"), "Talents with ranks");
  check(rows.some((r) => r[0] === "item" && r[1] === "Dagger" && r[2] === "weapon"), "gear by name and type");
  check(rows[1].join() === "meta,format,TBE-CSV,1,", "file declares its format and version");
}

console.log("\n2. Parsing what Google Sheets gives back");
{
  const tsv = "section\tname\tvalue\texpertise\tnote\nmeta\tformat\tTBE-CSV\t1\t\nskill\tPerception\t70\t\t\n";
  const r = C.parse(tsv);
  check(r.length === 3 && r[2][1] === "Perception" && r[2][2] === "70", "tab-separated clipboard paste", r);
  const q = C.parse('section,name,value,expertise,note\r\nactor,culture,"Dorn, the ""Salt"" coast",,\r\n');
  check(q[1][2] === 'Dorn, the "Salt" coast', "quoted CSV with a comma and quotes", q);
  check(C.parse("﻿a,b\n\n\n").length === 1, "byte-order mark and blank lines ignored");
  const a = renn(); a.system.culture = 'Dorn, the "Salt" coast';
  check(C.parse(C.toCsv(C.rowsFor(a))).some((r) => r[1] === "culture" && r[2] === a.system.culture), "toCsv quotes what parse reads back");
}

console.log("\n3. What an edited file plans");
{
  const a = renn();
  const edit = (fn) => { const rows = C.rowsFor(a); fn(rows); return C.plan(a, C.parse(C.toCsv(rows))); };
  const set = (rows, sec, name, col, v) => { rows.find((r) => r[0] === sec && r[1] === name)[col] = v; };
  let p = edit((r) => set(r, "skill", "Perception", 2, "70"));
  check(p.skillUpdates.length === 1 && p.skillUpdates[0].changes["system.value"] === 70, "a changed value updates the skill Item", p.skillUpdates);
  p = edit((r) => set(r, "skill", "Intimidate", 2, "35"));
  check(p.skillCreates.length === 1 && p.skillCreates[0].group === "Social" && !p.skillCreates[0].fighting, "a raised untrained skill is created in its catalogue group");
  p = edit((r) => set(r, "skill", "Dodge", 3, "2"));
  check(p.skillCreates[0]?.group === "Combat" && p.skillCreates[0].fighting && p.skillCreates[0].expertise === 2, "Expertise alone is enough to add it; Combat is a fighting skill");
  p = edit((r) => r.push(["skill", "Sea-wise", "25", "", ""]));
  check(!p.skillCreates.length && p.problems.some((x) => /Sea-wise.*no group/.test(x)), "a name outside the catalogue with no group is reported, never guessed", p.problems);
  p = edit((r) => r.push(["skill", "Sea-wise", "25", "", "group Wise"]));
  check(p.skillCreates[0]?.group === "Wise", "...and added when the row names its group");
  p = edit((r) => set(r, "skill", "Perception", 3, "1"));
  check(p.problems.some((x) => /Ex.*p\.53/.test(x)) && !p.skillUpdates.length, "Expertise 1 refused (p.53: there is no Ex1)");
  p = edit((r) => set(r, "actor", "silver", 2, "lots"));
  check(p.problems.some((x) => /silver/.test(x)) && !p.fields.length, "a non-number in a number field is skipped and said");
  p = edit((r) => set(r, "actor", "career", 2, "Mercenary"));
  check(p.fields.length === 1 && p.fields[0].path === "system.career" && p.fields[0].to === "Mercenary", "a text field change");
  p = edit((r) => { r.push(["talent", "Fast Runner", "1", "", ""]); r.push(["item", "Longbow", "weapon", "", ""]); });
  check(p.talents[0]?.name === "Fast Runner" && p.items[0]?.name === "Longbow", "new Talents and gear are planned by name");
  p = edit((r) => { const i = r.findIndex((x) => x[1] === "Salt-wise"); r.splice(i, 1); });
  check(p.notInFile.includes("Salt-wise") && C.isEmpty(p), "a skill missing from the file is reported and NOT deleted");
  p = C.plan(a, C.parse("name,value\nPerception,70\n"));
  check(/not a TBE-CSV/.test(p.problems[0]) && C.isEmpty(p), "a file of some other shape is refused whole");
}

console.log("\n4. The real macro");
{
  const docs = JSON.parse(readFileSync("data/solo_docs.json", "utf8"));
  const cmd = docs.macros.find((m) => m.name === "TBE: Sheet Exchange")?.command;
  check(!!cmd, "shipped in the macro pack");
  const AF = Object.getPrototypeOf(async function () {}).constructor;
  const runMacro = async ({ answers, actor, isGM = true }) => {
    const log = { saved: null, dialogs: [], updates: [], created: [], chat: [], warn: [] };
    actor.update = async (u) => { log.updates.push(u); for (const [k, v] of Object.entries(u)) {
      const parts = k.split("."); let o = actor; while (parts.length > 1) o = o[parts.shift()]; o[parts[0]] = v; } return actor; };
    for (const i of actor.items) i.update = async (u) => { log.updates.push({ item: i.name, ...u }); return i; };
    actor.createEmbeddedDocuments = async (t, d) => { log.created.push(...d); return d; };
    const packs = new Map([["the-broken-empires.tbe-talents", { getIndex: async () => [{ _id: "t1", name: "Fast Runner", type: "talent" }],
      getDocument: async () => ({ toObject: () => ({ _id: "t1", name: "Fast Runner", type: "talent", system: { ranks: 1 } }) }) }],
      ["the-broken-empires.tbe-equipment", { getIndex: async () => [], getDocument: async () => null }]]);
    const game = { user: { isGM, id: "U", character: null, can: () => isGM }, actors: Object.assign([actor], { get: (id) => (id === actor.id ? actor : null) }),
      packs, settings: { get: () => "publicroll" }, thebrokenempires: undefined };
    const q = answers.slice();
    const foundry = { utils: { saveDataToFile: (data, type, name) => { log.saved = { data, type, name }; }, duplicate: (o) => JSON.parse(JSON.stringify(o)) },
      applications: { api: { DialogV2: { prompt: async (o) => { log.dialogs.push(o.window.title); return q.shift() ?? null; } } } } };
    const ui = { notifications: { warn: (m) => log.warn.push(m), info() {}, error: (m) => log.warn.push(m) } };
    const ChatMessage = { getSpeaker: () => ({}), applyRollMode: (d) => d, create: async (d) => { log.chat.push(d.content); return d; } };
    const canvas = { tokens: { controlled: [{ actor }] } };
    const fn = new AF("canvas", "game", "foundry", "ui", "ChatMessage", "Roll", "CONFIG", "Actor", "speaker", "actor", "token", "character", "scope", "event", "{" + cmd + "\n}");
    await fn(canvas, game, foundry, ui, ChatMessage, class {}, { sounds: {} }, { create: async (d) => d });
    return log;
  };
  const a = renn();
  const ex = await runMacro({ actor: a, answers: [{ mode: "export", actor: "renn" }] });
  check(ex.saved && ex.saved.type === "text/csv" && /Renn_Kestrel\.tbe\.csv$/.test(ex.saved.name), "export downloads Renn_Kestrel.tbe.csv", ex.saved?.name);
  check(ex.saved?.data === C.toCsv(C.rowsFor(renn())), "the file is exactly what TBE.sheetCsv produces");

  const b = renn();
  const rows = C.rowsFor(b);
  rows.find((r) => r[1] === "Perception")[2] = "72";
  rows.find((r) => r[1] === "career")[2] = "Mercenary";
  rows.push(["talent", "Fast Runner", "1", "", ""]);
  rows.push(["item", "Unicorn Lance", "weapon", "", ""]);
  const tsv = rows.map((r) => r.join("\t")).join("\n");
  const im = await runMacro({ actor: b, answers: [{ mode: "import", actor: "renn" }, { text: tsv }, {}] });
  check(im.dialogs.join(" | ").includes("apply these changes?"), "shows the plan and asks before writing", im.dialogs);
  check(b.system.career === "Mercenary", "career written");
  check(im.updates.some((u) => u.item === "Perception" && u["system.value"] === 72), "Perception updated to 72");
  check(im.created.some((d) => d.name === "Fast Runner"), "Fast Runner pulled from the compendium");
  check(!im.created.some((d) => d.name === "Unicorn Lance") && /Unicorn Lance: not found/.test(im.chat.join()), "an unknown item is reported, not invented");

  const c = renn();
  const cancel = await runMacro({ actor: c, answers: [{ mode: "import", actor: "renn" }, { text: tsv }, null] });
  check(!cancel.updates.length && !cancel.created.length, "cancelling at the preview writes nothing");

  const d = renn(); d.isOwner = false;
  const deny = await runMacro({ actor: d, isGM: false, answers: [{ mode: "import", actor: "renn" }] });
  check(/own no characters/.test(deny.warn.join()) && !deny.updates.length, "a player who owns nothing is told so, nothing written");
}

console.log("\n5. Mutation: a planner that guesses a group is caught");
{
  const mutated = LIB.replace("const group = TBE.skillGroup(name) || (m ? m[1] : null);", 'const group = TBE.skillGroup(name) || (m ? m[1] : "Adventuring");');
  check(mutated !== LIB, "(sanity) mutation applied");
  const M = loadTBE(mutated).sheetCsv;
  const a = renn(); const rows = M.rowsFor(a); rows.push(["skill", "Sea-wise", "25", "", ""]);
  const p = M.plan(a, M.parse(M.toCsv(rows)));
  check(p.skillCreates.some((s) => s.group === "Adventuring"), "the guessing planner files Sea-wise under Adventuring, which section 3 rejects");
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
