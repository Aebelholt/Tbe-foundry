/* macro_sync_check.mjs — TBE: Update Macros actually matches on name and
 * UPDATES, instead of importing another copy.
 *
 * Why this file exists. Upgrading the system updates the `tbe-macros`
 * compendium and nothing else; Foundry's own "Import All Content" CREATES
 * rather than replaces. Seb's played world was carrying nine TBE: Character
 * Wizard, five TBE: Attack and five TBE: Finish Character, every one of them
 * frozen at the version it was imported at, while the system underneath them
 * was current. The macro this checks is the fix he asked for: match on name,
 * overwrite in place, do not add a tenth wizard.
 *
 * The failure modes worth guarding are all quiet ones, so the checks below run
 * the real macro source against a stub world and assert on what it DID:
 *   - creating instead of updating (the original bug, in a new coat)
 *   - updating only the copy it plans to keep, leaving stale code on a hotbar
 *   - touching a macro this system does not ship
 *   - deleting when it was not asked to, or deleting the last copy of anything
 *   - deleting the copy that is on a hotbar and leaving a dead slot
 *
 * Run: node macro_sync_check.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");

let pass = 0, fail = 0;
const check = (cond, label, extra) => {
  if (cond) { pass++; console.log("  PASS  " + label); }
  else { fail++; console.log("  FAIL  " + label + (extra !== undefined ? "  <- " + JSON.stringify(extra) : "")); }
};

const MACRO = read("macros/tbe-update-macros.js");
const LIB = read("macros/_lib.js");

/* ---- a stub world that records every write ---- */
const build = ({ world, shipped, answer, users }) => {
  const log = { created: [], updated: [], deleted: [], said: [] };

  const mkWorldMacro = (name, command, id) => ({
    id, name, command, type: "script",
    update: async (payload) => { log.updated.push({ id, name, command: payload.command }); },
    delete: async () => { log.deleted.push({ id, name }); }
  });

  const macros = world.map(([name, command], n) => mkWorldMacro(name, command, "w" + n));
  macros.size = macros.length;

  const pack = { getDocuments: async () => shipped.map(([name, command]) => ({ name, command, img: "i.svg", type: "script" })) };

  const game = {
    user: { isGM: true, id: "u1" },
    users: users ?? [{ hotbar: {} }],
    macros,
    packs: { get: (id) => (id === "the-broken-empires.tbe-macros" ? pack : null) },
    settings: { get: () => "publicroll" }
  };

  const Macro = { create: async (d) => { log.created.push({ name: d.name, command: d.command }); } };
  const ui = { notifications: { info: (m) => log.said.push(["info", m]), warn: (m) => log.said.push(["warn", m]), error: (m) => log.said.push(["error", m]) } };
  const ChatMessage = { create: (d) => { log.said.push(["chat", d]); return d; }, getSpeaker: () => ({}), applyRollMode: (d) => d, getWhisperRecipients: () => [{ id: "u1" }] };

  const TBE = new Function("canvas", "game", "foundry", "ui", "CONFIG", "ChatMessage",
    LIB + "\n;return TBE;")(
    { tokens: { controlled: [] } }, game,
    { utils: { duplicate: (o) => JSON.parse(JSON.stringify(o)) }, applications: {} },
    ui, { sounds: { dice: "d.wav" } }, ChatMessage);

  /* The dialog is the decision point, so stub it with the answer under test
     rather than driving a DOM. `null` is a cancel. */
  TBE.prompt = async () => answer;

  return { log, game, ui, Macro, ChatMessage, TBE };
};

const run = async (opts) => {
  const env = build(opts);
  const AF = Object.getPrototypeOf(async function () {}).constructor;
  const fn = new AF("game", "ui", "TBE", "Macro", "ChatMessage", "foundry", MACRO);
  await fn(env.game, env.ui, env.TBE, env.Macro, env.ChatMessage, { applications: {} });
  return env.log;
};

const SHIPPED = [["TBE: Attack", "NEW-ATTACK"], ["TBE: Cast", "NEW-CAST"], ["TBE: Loadout", "NEW-LOADOUT"]];

console.log("\n1. It compiles the way Foundry will run it");
{
  const AF = Object.getPrototypeOf(async function () {}).constructor;
  let err = null;
/* Foundry compiles a script macro as an AsyncFunction whose body is WRAPPED IN
   A BLOCK -- roughly `new AsyncFunction(...params, "{" + command + "\n}")`. That
   matters: inside the block, a top-level `const actor` SHADOWS the `actor`
   parameter perfectly legally, which is why TBE: Skill Roll and TBE: Character
   Wizard have done exactly that for months and run fine. An earlier version of
   this harness compiled the body bare, concluded `const actor` was illegal, and
   that false claim reached a changelog and two scheduled prompts before the
   release baseline caught it. Compile it the way Foundry does. */
  try { new AF("speaker", "actor", "token", "character", "scope", "event", "{" + MACRO + "\n}"); } catch (e) { err = e.message; }
  check(err === null, "compiles as a Foundry script macro with the real parameter list", err);
  check(!/^\s*import\s/m.test(MACRO), "carries no import declaration");
  check(/if \(!game\.user\.isGM\)/.test(MACRO), "is GM-gated, like TBE: Install Tables");
}

console.log("\n2. It updates in place instead of importing another copy");
{
  const log = await run({
    shipped: SHIPPED,
    world: [["TBE: Attack", "OLD-ATTACK"], ["TBE: Cast", "NEW-CAST"]],
    answer: {}
  });
  check(log.updated.length === 1 && log.updated[0].name === "TBE: Attack",
    "the stale copy is updated", log.updated);
  check(log.updated[0].command === "NEW-ATTACK", "...to what the compendium ships", log.updated[0]);
  check(!log.created.some((c) => c.name === "TBE: Attack"),
    "THE WHOLE POINT: it did not create a second TBE: Attack", log.created);
  check(log.created.length === 1 && log.created[0].name === "TBE: Loadout",
    "a macro this world is missing is created", log.created);
  check(!log.updated.some((u) => u.name === "TBE: Cast"),
    "an already-current copy is left completely alone", log.updated);
  check(log.deleted.length === 0, "and nothing is deleted when deletion was not asked for", log.deleted);
}

console.log("\n3. Running it twice is the same as running it once");
{
  const world = [["TBE: Attack", "NEW-ATTACK"], ["TBE: Cast", "NEW-CAST"], ["TBE: Loadout", "NEW-LOADOUT"]];
  const log = await run({ shipped: SHIPPED, world, answer: {} });
  check(log.updated.length === 0 && log.created.length === 0 && log.deleted.length === 0,
    "a world already in sync gets no writes at all", log);
  check(log.said.some(([k, m]) => k === "info" && /already matches/.test(m)),
    "...and is told so, rather than silently doing nothing", log.said);
}

console.log("\n4. Every duplicate is brought current, not just the survivor");
{
  /* The quiet failure: prune declined, so the leftovers stay -- and if only
     the keeper was updated, the GM's hotbar keeps running stale code while
     the report claims success. */
  const log = await run({
    shipped: SHIPPED,
    world: [["TBE: Attack", "OLD-1"], ["TBE: Attack", "OLD-2"], ["TBE: Attack", "OLD-3"],
            ["TBE: Cast", "NEW-CAST"], ["TBE: Loadout", "NEW-LOADOUT"]],
    answer: {}
  });
  check(log.updated.length === 3, "all three stale copies were updated, not only one", log.updated);
  check(log.updated.every((u) => u.command === "NEW-ATTACK"), "every one of them to the shipped command");
  check(log.deleted.length === 0, "none deleted, because the box was not ticked");
  check(log.said.some(([k, d]) => k === "chat" && /left in place and are now all current/.test(d.content ?? "")),
    "and the report says the leftovers are current rather than implying they were removed");
}

console.log("\n5. Deletion is opt-in, keeps one, and never orphans a hotbar slot");
{
  const users = [{ hotbar: { 3: "w1" } }];   // the SECOND Attack copy is on the bar
  const log = await run({
    shipped: SHIPPED,
    world: [["TBE: Attack", "OLD-1"], ["TBE: Attack", "OLD-2"], ["TBE: Attack", "OLD-3"],
            ["TBE: Cast", "NEW-CAST"], ["TBE: Loadout", "NEW-LOADOUT"]],
    answer: { prune: "on" },
    users
  });
  check(log.deleted.length === 2, "two of the three duplicates are removed", log.deleted);
  check(!log.deleted.some((d) => d.id === "w1"),
    "CONFIRMED: the copy on the hotbar is the one kept, so no slot is left dead", log.deleted);
  check(!log.deleted.some((d) => d.name === "TBE: Cast"),
    "a macro with only one copy is never deleted", log.deleted);
  check(log.updated.length === 3, "all copies were still updated before the prune", log.updated.length);
}

console.log("\n6. It never touches a macro this system does not ship");
{
  const log = await run({
    shipped: SHIPPED,
    world: [["My Own Attack Helper", "MINE"], ["TBE: Attack", "OLD"],
            ["TBE: Cast", "NEW-CAST"], ["TBE: Loadout", "NEW-LOADOUT"]],
    answer: { prune: "on" }
  });
  check(!log.updated.some((u) => u.name === "My Own Attack Helper"),
    "a macro of the GM's own is not updated", log.updated);
  check(!log.deleted.some((d) => d.name === "My Own Attack Helper"),
    "...nor deleted, even with the prune box ticked", log.deleted);
  check(/rename/i.test(MACRO), "and the dialog tells the GM that renaming protects a macro permanently");
}

console.log("\n7. Cancelling does nothing at all");
{
  const log = await run({
    shipped: SHIPPED,
    world: [["TBE: Attack", "OLD"], ["TBE: Attack", "OLD"]],
    answer: null
  });
  check(log.updated.length === 0 && log.created.length === 0 && log.deleted.length === 0,
    "a cancelled dialog writes nothing", log);
}

console.log("\n8. A failed write is reported, not swallowed");
{
  const env = build({ shipped: SHIPPED, world: [["TBE: Attack", "OLD"]], answer: {} });
  env.game.macros[0].update = async () => { throw new Error("no permission"); };
  const AF = Object.getPrototypeOf(async function () {}).constructor;
  const fn = new AF("game", "ui", "TBE", "Macro", "ChatMessage", "foundry", MACRO);
  const quiet = console.warn; console.warn = () => {};
  await fn(env.game, env.ui, env.TBE, env.Macro, env.ChatMessage, { applications: {} });
  console.warn = quiet;
  const card = env.log.said.find(([k]) => k === "chat");
  check(!!card && /could not be changed/.test(card[1].content ?? ""),
    "the card names what could not be changed", card?.[1]?.content?.slice(0, 200));
  check(env.log.said.some(([k, m]) => k === "info" && /failed/.test(String(m))),
    "and the notification says so too, rather than reporting a clean run", env.log.said);
}

console.log("\n9. It is GM housekeeping, and routed through the one visibility owner");
{
  check(/mode: TBE\.MODES\.PRIVATE/.test(MACRO),
    "the report is whispered, so maintenance output does not land in the table's chat");
  /* Strip comments first: the macro legitimately EXPLAINS that its report is
     whispered, and banning the word outright would fail on its own doc. This
     is the third time that trap has been hit in this repo -- the rule is that
     a "must not contain X" assertion is about CODE, so strip the prose. */
  const macroCode = MACRO.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  check(/TBE\.say\(/.test(macroCode) && !/whisper|getWhisperRecipients/.test(macroCode),
    "and does that through TBE.say rather than implementing visibility itself");
  const VIS = read("system/the-broken-empires/module/rules/visibility.mjs");
  check(/GM HOUSEKEEPING/.test(VIS),
    "the visibility owner names GM housekeeping as a legitimate reason for an explicit mode, " +
    "rather than this quietly contradicting its own doc");
}

console.log("\n10. Wired up, and the stale-macro notice points at it");
{
  check(/\["TBE: Update Macros", "tbe-update-macros\.js"/.test(read("build.js")), "build.js ships it");
  const MIG = read("system/the-broken-empires/module/migration/migration.mjs");
  check(/TBE: Update Macros/.test(MIG),
    "the upgrade-time notice names the macro that fixes what it just reported");
  check(/rename yours/i.test(MIG), "...and repeats the rename-to-protect rule");
}

console.log("\n11. Mutation: create instead of update, which is the original bug");
{
  const broken = MACRO.replace("await m.update(payload);", "await Macro.create(Object.assign({ name: doc.name }, payload));");
  check(broken !== MACRO, "the mutation actually changed the source");
  const env = build({ shipped: SHIPPED, world: [["TBE: Attack", "OLD"], ["TBE: Cast", "NEW-CAST"], ["TBE: Loadout", "NEW-LOADOUT"]], answer: {} });
  const AF = Object.getPrototypeOf(async function () {}).constructor;
  const fn = new AF("game", "ui", "TBE", "Macro", "ChatMessage", "foundry", broken);
  await fn(env.game, env.ui, env.TBE, env.Macro, env.ChatMessage, { applications: {} });
  check(env.log.created.some((c) => c.name === "TBE: Attack") && env.log.updated.length === 0,
    "CONFIRMED: the mutated build adds a second TBE: Attack instead of fixing the first — " +
    "exactly the behaviour that put nine Character Wizards in a real world",
    { created: env.log.created.map((c) => c.name), updated: env.log.updated.length });
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
