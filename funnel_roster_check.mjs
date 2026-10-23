#!/usr/bin/env node
/*
 * funnel_roster_check.mjs -- TBE: Funnel Roster, run as BUILT (from
 * data/solo_docs.json) against a stub world, the way Foundry runs a macro.
 *
 * It was the only macro with a dialog flow and no behavioural check, which is
 * how it once failed on every call for months (it used the illegal "tbe" flag
 * scope; see migration_fixtures_check.mjs K-O). Reading it as a player then
 * found the defect this check was written around: the card announced "X is
 * now dead" whether or not the write landed, so a player without permission
 * got a chat line claiming a change that never happened (CLAUDE.md scope
 * rule 2). Mutation in section 2 restores that.
 *
 *   1. A GM records a death and a Scar: one write, flag and biography both
 *      changed, the card says so.
 *   2. A player who does not own the townsperson: nothing written, the card
 *      carries the refusal, never the claim.
 *   3. Converting a survivor: a new character in TBE Survivors with their
 *      skills (catalogue groups), Talents, the night's +10 (an untrained
 *      skill starts from 20, so 30), the Goal, and the source marked converted.
 *   4. A second conversion reuses the folder.
 *   5. A player asking to convert is told why not; nothing is created.
 *   6. A townsperson still on the legacy "tbe" flag is found, and the write
 *      moves it to the system's namespace and deletes the legacy key.
 *   7. No townsfolk: a sentence, no dialog.
 */
import fs from "node:fs";

let pass = 0, fail = 0;
const check = (cond, label, extra) => {
  if (cond) { pass++; console.log("  PASS  " + label); }
  else { fail++; console.log("  FAIL  " + label + (extra !== undefined ? "  <- " + JSON.stringify(extra).slice(0, 500) : "")); }
};
const section = (s) => console.log("\n" + s);
const docs = JSON.parse(fs.readFileSync("data/solo_docs.json", "utf8"));
const BUILT = docs.macros.find((m) => m.name === "TBE: Funnel Roster")?.command;
const SCARS = JSON.parse(fs.readFileSync("data/funnel.json", "utf8")).scars;
const SCOPE = "the-broken-empires";
const clone = (x) => JSON.parse(JSON.stringify(x));

function setPath(o, key, v) {
  const ks = key.split(".");
  const last = ks.pop();
  for (const k of ks) o = (o[k] ??= {});
  if (last.startsWith("-=")) delete o[last.slice(2)];
  else o[last] = clone(v);
}

let seq = 0;
function townsperson(name, trade, owner, { legacy = false, owned = true, status = "alive" } = {}) {
  const f = { owner, trade, status, scars: [], standing: "Poor", town: "Brackwater", descriptors: ["Stout", "Wary"], bond: { relation: "Sister", name: "Ilse" } };
  const a = {
    id: "A" + (++seq), name, type: "creature", writes: [],
    system: { biography: "<p>A " + trade.toLowerCase() + ".</p>", size: "Medium" },
    flags: legacy ? { tbe: { funnel: f } } : { [SCOPE]: { funnel: f } },
    items: [
      { name: "Craft: Practical", type: "skill", system: { group: "Adventuring", value: 35, expertise: 0, savvy: false } },
      { name: "Endurance", type: "skill", system: { group: "Adventuring", value: 25, expertise: 2, savvy: true } },
      { name: "Tough", type: "talent", system: { ranks: 1 }, toObject() { return { name: "Tough", type: "talent", system: { ranks: 1 } }; } }
    ],
    async update(u) { this.writes.push(clone(u)); for (const [k, v] of Object.entries(u)) setPath(this, k, v); return this; }
  };
  if (!owned) a.isOwner = false;
  return a;
}

async function run({ actors, answer, isGM = true, folders: seeded = [] }) {
  const log = { dialogs: 0, chat: [], warn: [], created: [], folders: [], embedded: [] };
  const list = Object.assign(actors.slice(), { get: (id) => actors.find((a) => a.id === id) });
  const folders = seeded;
  const game = {
    user: { isGM, id: "U1" }, actors: list, settings: { get: () => "publicroll" }, thebrokenempires: undefined,
    folders: { find: (fn) => folders.find(fn) }
  };
  const foundry = { utils: { duplicate: clone }, applications: { api: { DialogV2: { prompt: async () => { log.dialogs++; return answer; } } } } };
  const ui = { notifications: { warn: (m) => log.warn.push(m), info() {}, error: (m) => log.warn.push(m) } };
  const ChatMessage = { getSpeaker: () => ({}), applyRollMode: (d) => d, create: async (d) => { log.chat.push(d.content); return d; } };
  const Folder = { create: async (d) => { const f = { id: "F" + (++seq), ...d }; folders.push(f); log.folders.push(f); return f; } };
  const Actor = { create: async (d) => {
    const pc = { id: "P" + (++seq), ...clone(d), async createEmbeddedDocuments(t, items) { log.embedded.push(...clone(items)); return items; } };
    log.created.push(pc); return pc;
  } };
  const AF = Object.getPrototypeOf(async function () {}).constructor;
  const fn = new AF("game", "foundry", "ui", "ChatMessage", "Folder", "Actor", "Roll", "CONFIG", "speaker", "actor", "token", "character", "scope", "event",
    "{" + (run.command ?? BUILT) + "\n}");
  await fn(game, foundry, ui, ChatMessage, Folder, Actor, class {}, {}, {}, null, null, null, {}, null);
  log.folderList = folders;
  return log;
}

check(!!BUILT && BUILT.includes("const TBE_FUNNEL"), "the built macro carries its funnel data block");

/* ------------------------------------------------------------------ 1 */
section("1. A GM records a death and a Scar");
{
  const ann = townsperson("Ann", "Miller", "Kit"), bo = townsperson("Bo", "Tanner", "Kit");
  const scar = SCARS[0];
  const log = await run({ actors: [ann, bo], answer: { who: ann.id, status: "dead", scar: scar.name, conv: "", grew: "", goal: "" } });
  const f = ann.flags[SCOPE].funnel;
  check(ann.writes.length === 1, "one write, not two", ann.writes.length);
  check(f.status === "dead" && f.scars.length === 1 && f.scars[0].name === scar.name, "status and Scar on the flag");
  check(ann.system.biography.includes("Scar — " + scar.name), "the Scar's line is on the biography, where the GM sees it");
  check(/Ann is now <b>dead<\/b>/.test(log.chat[0]) && log.chat[0].includes(scar.name), "the card says what was saved");
  check(!bo.writes.length, "nobody else was touched");
}

/* ------------------------------------------------------------------ 2 */
section("2. A player who does not own the townsperson");
{
  const ann = townsperson("Ann", "Miller", "Kit", { owned: false });
  const answer = { who: ann.id, status: "dead", scar: "", conv: "", grew: "", goal: "" };
  const log = await run({ actors: [ann], answer, isGM: false });
  check(!ann.writes.length && ann.flags[SCOPE].funnel.status === "alive", "nothing is written");
  check(!/is now/.test(log.chat[0]) && /do not own Ann/.test(log.chat[0]), "the card carries the refusal, never the claim", log.chat);
  /* Mutation: announce regardless of the write's result (the original defect). */
  const src = BUILT;
  const a = "if (w.ok) notes.push(...said); else notes.push(";
  check(src.includes(a), "the guarded announcement is where the mutation expects it");
  run.command = src.replace(a, "notes.push(...said); if (!w.ok) notes.push(");
  const ann2 = townsperson("Ann", "Miller", "Kit", { owned: false });
  const m = await run({ actors: [ann2], answer: { ...answer, who: ann2.id }, isGM: false });
  run.command = undefined;
  check(/is now <b>dead<\/b>/.test(m.chat[0]), "mutation: announcing regardless puts a death that never happened in the chat log");
}

/* ------------------------------------------------------------------ 3, 4 */
section("3. Converting a survivor, and 4. a second one");
{
  const ann = townsperson("Ann", "Miller", "Kit"), bo = townsperson("Bo", "Tanner", "Kit");
  const log = await run({ actors: [ann, bo], answer: { who: "", status: "", scar: "", conv: ann.id, grew: "Stealth", goal: "Find Ilse." } });
  const pc = log.created[0];
  check(log.created.length === 1 && pc.type === "character" && pc.name === "Ann", "a new character actor, the townsperson kept");
  check(log.folders.length === 1 && log.folders[0].name === "TBE Survivors" && pc.folder === log.folders[0].id, "in TBE Survivors");
  const sk = (n) => log.embedded.find((i) => i.name === n);
  check(sk("Craft: Practical")?.system.value === 35 && sk("Craft: Practical").system.group === "Lore", "skills carry over with their catalogue group (Craft: Practical is Lore)", sk("Craft: Practical"));
  check(sk("Endurance")?.system.expertise === 2 && sk("Endurance").system.savvy === true, "Expertise and Savvy carry over");
  check(sk("Stealth")?.system.value === 30 && sk("Stealth").system.group === "Adventuring", "the night's +10 on an untrained skill starts from 20: Stealth 30");
  check(log.embedded.some((i) => i.type === "talent" && i.name === "Tough"), "Talents carry over");
  check(pc.system.goals?.[0]?.text === "Find Ilse." && pc.system.personalityTraits.join() === "Stout,Wary", "the Goal and the descriptors as Personality Traits");
  check(/Bond:<\/b> Sister — Ilse/.test(pc.system.biography) && /Before:<\/b> Miller of Brackwater/.test(pc.system.biography), "the biography says who they were");
  check(ann.flags[SCOPE].funnel.status === "converted", "the townsperson is marked converted");
  check(/Ann<\/b> is a character now/.test(log.chat[0]), "the card says so");
  /* 4: the folder from the first run exists now. */
  const folders = log.folderList;
  const log2 = await run({ actors: [bo], folders, answer: { who: "", status: "", scar: "", conv: bo.id, grew: "", goal: "" } });
  check(log2.folders.length === 0 && log2.created[0]?.folder === folders[0].id, "a second conversion reuses the folder", log2.folders);
}

/* ------------------------------------------------------------------ 5 */
section("5. A player asking to convert");
{
  const ann = townsperson("Ann", "Miller", "Kit");
  const log = await run({ actors: [ann], answer: { who: "", status: "", scar: "", conv: ann.id, grew: "", goal: "" }, isGM: false });
  check(!log.created.length && !ann.writes.length, "nothing is created or changed");
  check(/Only the GM can convert a survivor/.test(log.chat[0]), "and the player is told why", log.chat);
}

/* ------------------------------------------------------------------ 6 */
section("6. A townsperson on the legacy flag");
{
  const old = townsperson("Cal", "Carter", "Kit", { legacy: true });
  const log = await run({ actors: [old], answer: { who: old.id, status: "wounded", scar: "", conv: "", grew: "", goal: "" } });
  check(old.flags[SCOPE]?.funnel?.status === "wounded" && old.flags.tbe?.funnel === undefined, "found, moved to the system's namespace, the legacy key deleted", old.flags);
  check(/Cal is now <b>wounded<\/b>/.test(log.chat[0]), "and reported");
}

/* ------------------------------------------------------------------ 7 */
section("7. No townsfolk yet");
{
  const log = await run({ actors: [], answer: null });
  check(!log.dialogs && log.warn.some((w) => /no funnel townsfolk yet/.test(w)), "a sentence, no dialog");
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
