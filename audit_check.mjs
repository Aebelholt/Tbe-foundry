/* audit_check.mjs — the defects an outside release audit of v0.28.0 found.
 *
 * The zip was read by someone who had not written it: complete file tree,
 * every module and template, the manifest, the packs, cross-checked against
 * the live Foundry V14 API. All sixteen existing check scripts were green
 * throughout, because every one of these is a case where the code does
 * precisely what the code says.
 *
 *   1. CONFIG.statusEffects is an Array through V13 and a keyed object from
 *      V14 on. Registration called .find()/.push() unconditionally, which
 *      throws inside init on V14 and takes the system down before any TBE
 *      rule matters. Also dropped the `group` field it already had in hand.
 *   2. TheBrokenEmpiresCharacter.getRollData() overrode the base without
 *      calling super, so initiativeEffective / armorInitPenalty / ll / wp
 *      never reached a roll formula. Those are derived properties assigned
 *      onto this.system rather than declared schema fields, so Foundry's own
 *      getRollData() cannot supply them either -- the DataModel method is
 *      their only route. CONFIG.Combat.initiative rolls
 *      "1d10 + @initiativeEffective", so every PC rolled 1d10 + 0 while every
 *      creature (which does not override) rolled correctly.
 *   3. The Talent catalogue, three faults from one header-boundary gap:
 *      a name that OPENS with punctuation was never seen as a header, so
 *      "...BUT IT IS NOT THIS DAY!" did not exist and its text sat inside
 *      Anti-Venom Blood; a group-scoping sentence ("Each of the following can
 *      be purchased up to 3 times:") attached to the Talent above it, so
 *      Wrestler came out repeatable against a book that says once and the six
 *      it governs came out take-once against a book that says three; and ten
 *      Talents that open "Once per session, you can ..." had that usage window
 *      read as a purchase axis, capping them at one buy each.
 *   4. Five creatures shipped with no Ferocity -- the Dragon and the Roc among
 *      them -- because a footnote marker on Move ("Move 2<dagger>") stopped the
 *      stat-line regex, and the Ferocity group being optional meant the match
 *      still succeeded with it empty.
 *   5. Two copies of sizeEffects() that had drifted in both directions: the
 *      system copy never got the v0.21.0 Lock fix and named the attacker's
 *      reach differently, the macro copy was missing a key the system had.
 *      Nothing read the system copy, which is why it went unnoticed.
 *   6. Release hygiene: LevelDB runtime files (LOCK, LOG, LOG.old) shipped
 *      inside the packs, and the README's macro count was hand-typed and stale.
 *
 * Run: node audit_check.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");
const J = (f) => JSON.parse(read(f));

let pass = 0, fail = 0;
const check = (cond, label, extra) => {
  if (cond) { pass++; console.log("  PASS  " + label); }
  else { fail++; console.log("  FAIL  " + label + (extra !== undefined ? "  <- " + JSON.stringify(extra) : "")); }
};

const SYS = "system/the-broken-empires";
const ENTRY = read(`${SYS}/module/the-broken-empires.mjs`);
const CONFIGJS = read(`${SYS}/module/helpers/config.mjs`);
const LIB = read("macros/_lib.js");
const CHAR = read(`${SYS}/module/data/actor-character.mjs`);
const BASE = read(`${SYS}/module/data/base-actor.mjs`);

/* ==================================================================== 1
 * V14 status registration.
 * Asserted by RUNNING it against both shapes, not by reading the source: the
 * whole failure was that reading it looked fine.
 */
console.log("\n1. CONFIG.statusEffects registration works on both shapes");

const STATUSES = [
  { group: "Wounds & Impairment", id: "tbe-shock", name: "Shock", icon: "icons/svg/unconscious.svg" },
  { group: "Maneuver Riders", id: "tbe-locked", name: "Locked", icon: "icons/svg/net.svg" }
];

/* Lift the registration block out of the entry file and run it in isolation. */
const regBlock = ENTRY.slice(
  ENTRY.indexOf("const statusIsArray"),
  ENTRY.indexOf("// Register sheet application classes")
);
check(regBlock.length > 50, "registration block located in the entry file");

const runReg = (initial) => {
  const CONFIG = { statusEffects: initial };
  const TBE = { STATUSES };
  new Function("CONFIG", "TBE", regBlock)(CONFIG, TBE);
  return CONFIG.statusEffects;
};

/* V12/V13 shape: an Array. */
const v13 = runReg([{ id: "dead", name: "Dead", img: "x.svg" }]);
check(Array.isArray(v13), "array shape stays an array");
check(v13.length === 3, "array shape gained both TBE statuses", v13.length);
check(v13.some((e) => e.id === "tbe-shock"), "array shape contains tbe-shock");

/* V14 shape: a keyed object. This is the one that used to throw. */
let threw = null;
let v14 = null;
try {
  v14 = runReg({ dead: { id: "dead", name: "Dead", img: "x.svg" } });
} catch (err) { threw = String(err); }
check(threw === null, "keyed-object shape does not throw during init", threw);
check(v14 && v14["tbe-shock"] && v14["tbe-shock"].id === "tbe-shock",
  "keyed-object shape registered tbe-shock under its own id");
check(v14 && v14.dead && v14.dead.id === "dead", "keyed-object shape left core statuses alone");

/* Idempotent on both shapes: init can run more than once in a session. */
const twice = runReg(v13);
check(twice.filter((e) => e.id === "tbe-shock").length === 1,
  "array shape does not double-register on a second pass");

/* The group was already in hand and used to be discarded. */
check(v14 && v14["tbe-shock"].group === "Wounds & Impairment",
  "the TBE group survives registration instead of being thrown away");
check(/hud: true/.test(regBlock), "statuses are registered as HUD-togglable");

/* V14 removed the legacy ActiveEffect transferral framework entirely. */
check(!/legacyTransferral/.test(ENTRY),
  "CONFIG.ActiveEffect.legacyTransferral is gone (removed in V14, already default-false since V12)");

/* MUTATION: put the old unconditional array call back and watch it throw. */
{
  const old = `for (const s of TBE.STATUSES) {
    if (!CONFIG.statusEffects.find((e) => e.id === s.id)) {
      CONFIG.statusEffects.push({ id: s.id, name: s.name, img: s.icon });
    }
  }`;
  let mutThrew = null;
  try {
    const CONFIG = { statusEffects: { dead: { id: "dead" } } };
    new Function("CONFIG", "TBE", old)(CONFIG, { STATUSES });
  } catch (err) { mutThrew = String(err); }
  check(mutThrew !== null && /not a function/.test(mutThrew),
    "MUTATION: the pre-fix registration does throw on the V14 shape", mutThrew);
}

/* ==================================================================== 2
 * Character roll data.
 */
console.log("\n2. Character getRollData preserves the base contract");

check(/getRollData\(\)\s*\{[\s\S]{0,200}?\.\.\.super\.getRollData\(\)/.test(CHAR),
  "actor-character.mjs spreads super.getRollData()");

/* Run both DataModel methods for real, with the derived fields present the way
 * prepareDerivedData leaves them. Extract by brace matching rather than by
 * indexOf arithmetic, so this keeps working when the methods move. */
const method = (src, name) => {
  const i = src.indexOf(name + "() {");
  if (i < 0) return null;
  let depth = 0, j = src.indexOf("{", i);
  const start = j;
  for (; j < src.length; j++) {
    if (src[j] === "{") depth++;
    else if (src[j] === "}") { depth--; if (!depth) break; }
  }
  return name + "() " + src.slice(start, j + 1);
};
const baseBody = method(BASE, "getRollData");
const charBody = method(CHAR, "getRollData");
check(!!baseBody && !!charBody, "both getRollData methods extracted for execution");
const Base = new Function(`return class { ${baseBody} }`)();
const Char = new Function("Base", `return class extends Base { ${charBody} }`)(Base);

const actorish = {
  initiative: 12, initiativeEffective: 9, armorInitPenalty: 3,
  toughness: 2, lethalityLevel: 8, totalWp: 40,
  deathThreshold: { value: 20 }, resolve: { value: 10 }, size: "Medium", race: "Human"
};
const rd = Object.assign(Object.create(Char.prototype), actorish).getRollData();
check(rd.initiativeEffective === 9, "@initiativeEffective reaches a character's roll data", rd.initiativeEffective);
check(rd.armorInitPenalty === 3, "@armorInitPenalty reaches it too", rd.armorInitPenalty);
check(rd.ll === 8 && rd.wp === 40, "lethality level and WP survive the override", [rd.ll, rd.wp]);
check(rd.race === "Human" && rd.size === "Medium", "the character's own additions still land");

/* The formula the tracker actually rolls must be satisfiable from that object. */
const formula = (ENTRY.match(/CONFIG\.Combat\.initiative\s*=\s*\{\s*formula:\s*"([^"]+)"/) || [])[1];
check(formula === "1d10 + @initiativeEffective", "initiative formula unchanged", formula);
const refs = (formula || "").match(/@(\w+)/g).map((r) => r.slice(1));
check(refs.every((r) => rd[r] !== undefined),
  "every @reference in the initiative formula resolves for a character",
  refs.filter((r) => rd[r] === undefined));

/* Creatures never overrode, and must not start. */
check(!/getRollData/.test(read(`${SYS}/module/data/actor-creature.mjs`)),
  "creature model still inherits the base contract rather than re-stating it");

/* MUTATION: drop the spread and watch the formula stop resolving. */
{
  const Mut = new Function("Base", `return class extends Base {
    getRollData() { return { deathThreshold: this.deathThreshold, resolve: this.resolve,
      toughness: this.toughness, size: this.size, race: this.race }; } }`)(Base);
  const bad = Object.assign(Object.create(Mut.prototype), actorish).getRollData();
  check(bad.initiativeEffective === undefined,
    "MUTATION: without the spread, @initiativeEffective is undefined and every PC rolls 1d10 + 0");
}

/* ==================================================================== 3
 * Talent catalogue.
 */
console.log("\n3. Talent catalogue");

const TAL = J("data/talents.json");
const byName = Object.fromEntries(TAL.map((t) => [t.name, t]));
const rank = (n) => (byName[n] || {}).rank;

check(TAL.length === 150, "150 Talents (149 before: one was swallowed by its neighbour)", TAL.length);

const thisDay = TAL.find((t) => /BUT IT IS NOT THIS DAY/i.test(t.name));
check(!!thisDay, "the Talent whose name OPENS with punctuation exists in its own right",
  TAL.filter((t) => /THIS DAY/i.test(t.name)).map((t) => t.name));
check(!!thisDay && !/THIS DAY/i.test(byName["Anti-Venom Blood"].desc),
  "...and is no longer sitting inside Anti-Venom Blood's description");
check(rank("Anti-Venom Blood") === "once",
  "Anti-Venom Blood no longer inherits its neighbour's purchase count", rank("Anti-Venom Blood"));

/* The group-scoping sentence, both halves of what it got wrong. */
check(rank("Wrestler") === "once",
  'Wrestler is take-once ("Can be purchased once.")', rank("Wrestler"));
for (const n of ["Shield Arm", "Slippery", "Stable Stance", "Stay Put", "Stay Up", "Strong Grip"]) {
  check(["3", "three"].includes(rank(n)),
    `${n} is repeatable ("Each of the following can be purchased up to 3 times")`, rank(n));
}

/* A usage window is not a purchase axis. */
for (const n of ["Extra Bandages", "Spyglass", "On Through The Night", "Careful Rationing",
                 "Ease Of Passage", "Steely Thews", "I Have Just The Thing", "True Faith", "Kingsfoil"]) {
  check(rank(n) !== "per-skill", `${n}: "Once per session" is a usage window, not a purchase axis`, rank(n));
}
/* ...and the real axes must survive that distinction. */
for (const n of ["Armor Piercer", "Enhanced Defense", "Powerful Blow", "Quickdraw", "Shield Beat"]) {
  check(rank(n) === "per-skill", `${n} is a genuine per-X purchase axis and stayed one`, rank(n));
}
for (const n of ["Catch And Release", "Cloak And Blade", "Devouring Maw"]) {
  check(rank(n) !== "per-skill", `${n}'s "once per <window>" is not read as a purchase axis`, rank(n));
}

/* Every rank must be a key the cap table knows, or the cap silently becomes 1. */
const capKeys = new Set(["once", "per-skill", "three", "3", "five", "levelled", "multiple"]);
const strays = [...new Set(TAL.map((t) => t.rank))].filter((r) => !capKeys.has(String(r)) && !/^\d+$/.test(String(r)));
check(strays.length === 0, "every rank value is one CONFIG.TBE.rankCap() recognises", strays);

/* ==================================================================== 4
 * Bestiary Ferocity.
 */
console.log("\n4. Bestiary Ferocity");

const BEST = J("bestiary.json");
const blank = BEST.filter((c) => !String(c.ferocity ?? "").trim()).map((c) => c.name);
check(BEST.length === 56, "56 creatures", BEST.length);
check(blank.length === 0, "no creature ships with a blank Ferocity", blank);
for (const [n, want] of [["Dragon", "4"], ["Roc", "3"], ["Water Drake", "3"],
                         ["Summoned Creature", "3"], ["Sattagoyan Horse Archer", "3"]]) {
  const c = BEST.find((x) => x.name === n);
  check(c && String(c.ferocity) === want,
    `${n} Ferocity ${want} (a footnote marker on Move used to eat it)`, c && c.ferocity);
}

/* ==================================================================== 5
 * sizeEffects: one owner (config.mjs), the macro pack defers to it.
 *
 * Used to be two independent copies pinned identical by a source-text
 * comparison. Now the macro pack's TBE.sizeEffects() reads CONFIG.TBE at
 * runtime (the same pattern TBE.rankCap()/TBE.strandCap() already used) and
 * only computes its own copy when CONFIG isn't there. A text-equality check
 * would now be testing the wrong thing -- the two are supposed to read
 * differently, because one of them is a deferral wrapper. What has to be
 * true instead: the macro really defers when CONFIG.TBE is present (not just
 * "happens to compute the same answer"), and its fallback is still correct
 * for when CONFIG isn't there at all (the Node/legacy-standalone path).
 */
console.log("\n5. sizeEffects: one owner, the macro pack defers to it");

/* Extract the full `TBE.sizeEffects = function (...) {...};` statement,
 * brace-matched from its own `{` so this survives the function moving. */
/* Extract a whole `TBE.name = function (...) {...};` statement. Tracks (),
 * {} and [] TOGETHER from right after the marker, stopping at the first
 * top-level ";" -- not just brace-matching from the first "{", which cuts
 * the statement short when a destructured PARAMETER (e.g. `function ({ a,
 * b } = {})`) puts a "{" before the function body's own. None of these
 * statements contain a regex literal, which is the one thing this simple a
 * scanner can't tell from real brackets. */
const liftStmt = (src, marker) => {
  const i = src.indexOf(marker);
  let depth = 0, j = i + marker.length;
  for (; j < src.length; j++) {
    const c = src[j];
    if (c === "{" || c === "(" || c === "[") depth++;
    else if (c === "}" || c === ")" || c === "]") depth--;
    else if (c === ";" && depth === 0) { j++; break; }
  }
  return src.slice(i, j);
};

const sysSizeSrc = liftStmt(CONFIGJS, "TBE.sizeEffects = function");
const macSizeSrc = liftStmt(LIB, "TBE.sizeEffects = function");
check(sysSizeSrc.length > 50 && macSizeSrc.length > 50, "both statements extracted");
check(/CONFIG\.TBE\.sizeEffects/.test(macSizeSrc), "the macro's own source shows the deferral guard, not just a comment claiming one");

const runSize = (stmtSrc, SIZES, configTBE) => {
  const TBE = { SIZES };
  new Function("TBE", "SIZES", "CONFIG", stmtSrc + "\nreturn;")(TBE, SIZES, configTBE ? { TBE: configTBE } : undefined);
  return TBE.sizeEffects;
};
const SIZES = ["Tiny", "Small", "Med", "Medium", "Large", "Massive", "Gargantuan"];
const sysFx = runSize(sysSizeSrc, SIZES);

/* 5a. No CONFIG at all (Node harness / legacy standalone pack): the macro's
 * own fallback body must still compute the SAME answer as the canonical
 * function -- this is the correctness safety net for the path that can't
 * defer. */
const macFxNoConfig = runSize(macSizeSrc, SIZES, undefined);
const probe = ["Tiny", "Small", "Med", "Large", "Massive", "Gargantuan"];
let mismatch = null;
for (const a of probe) for (const d of probe) {
  const x = JSON.stringify(sysFx(a, d)), y = JSON.stringify(macFxNoConfig(a, d));
  if (x !== y) { mismatch = [a, d, x, y]; break; }
}
check(mismatch === null, "with no CONFIG present, the macro's fallback still agrees with the canonical rule on every size pairing", mismatch);

/* 5b. CONFIG.TBE.sizeEffects present, and DIFFERENT from the canonical
 * function -- a sentinel, so a pass here can only mean the macro actually
 * called it rather than coincidentally computing the same thing. */
const sentinel = (a, d) => ({ __sentinel: true, a, d });
const macFxDeferred = runSize(macSizeSrc, SIZES, { sizeEffects: sentinel });
check(macFxDeferred("Tiny", "Large")?.__sentinel === true,
  "with CONFIG.TBE.sizeEffects present, the macro really defers to it (a sentinel return value proves it, not just an equal one)");

check((sysFx("Tiny", "Gargantuan").maneuversBlocked || []).includes("lock"),
  "the v0.21.0 Lock fix is present in the one canonical copy (p.163: no Lock past two Sizes larger)");
check(/Lock are unavailable/.test(LIB),
  "and the player-facing note names Lock, instead of listing three of the four");

/* ==================================================================== 6
 * Release hygiene.
 */
console.log("\n6. Release hygiene");

const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(path.join(__dirname, dir), { withFileTypes: true })) {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) walk(rel, out); else out.push(rel);
  }
  return out;
};
const shipped = walk(SYS);
const debris = shipped.filter((f) => /\/(LOCK|LOG|LOG\.old)$/.test(f));
check(debris.length === 0, "no LevelDB runtime files inside the shipped tree", debris.slice(0, 6));

// Count what SHIPS, not what is on disk in macros/: they differ by one
// ("Ask the Weave" carries no tbe- filename prefix).
const macroCount = J("data/solo_docs.json").macros.length;
const README = read(`${SYS}/README.md`);
const claimed = (README.match(/the (\d+) play macros/) || [])[1];
check(claimed !== undefined, "README states a macro count in a parseable form", claimed);
check(Number(claimed) === macroCount,
  "README's macro count matches the macros actually shipped", { claimed, actual: macroCount });

/* ==================================================================== 7
 * World migration — SEQUENTIAL tests.
 *
 * The v0.29.0 build shipped a migration bug that this file's previous version
 * asserted was impossible. The old check read migrateWorld() and confirmed it
 * only set the version when its own report was clean -- which was true, and
 * irrelevant, because the clock stage ran AFTERWARDS in the ready hook. The
 * property under test ("the version only advances when the whole pass
 * succeeded") was never about one function's internals; it was about a
 * sequence. A static read of either half showed nothing wrong.
 *
 * So these drive the real module against a stubbed world and assert over
 * TRANSITIONS: run, fail, run again, and check what the world is left holding.
 */
console.log("\n7. World migration (sequential)");

const mkWorld = ({ version = "0.21.0", actors = [], items = [], journal = [], scenes = [],
                   settingFails = false } = {}) => {
  const store = { "the-broken-empires.worldSchemaVersion": version };
  const col = (arr) => { const a = arr.slice(); a.size = arr.length; return a; };
  const world = {
    settings: {
      settings: new Map(),
      get: (s, k) => store[`${s}.${k}`],
      set: async (s, k, v) => {
        if (settingFails) throw new Error("setting write refused");
        store[`${s}.${k}`] = v; return v;
      },
      register: () => {}
    },
    actors: col(actors), items: col(items), journal: col(journal),
    scenes: col(scenes), tables: col([]), macros: col([]), playlists: col([]),
    system: { version: "0.29.1" },
    user: { isGM: true },
    __store: store
  };
  return world;
};

const mkActor = (name, flags = {}, system = {}, { throwOnApply = false, failWrite = false } = {}) => ({
  name, flags, system,
  __throwOnApply: throwOnApply,
  updates: [],
  update: async function (u) {
    if (failWrite) throw new Error("write refused for " + name);
    this.updates.push(u);
    for (const [k, v] of Object.entries(u)) {
      if (k === "system.toughness") this.system.toughness = v;
    }
  }
});

const cmp = (a, b) => {
  const pa = String(a).split(".").map(Number), pb = String(b).split(".").map(Number);
  for (let i = 0; i < 3; i++) { if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0) ? 1 : -1; }
  return 0;
};
globalThis.foundry = { utils: { isNewerVersion: (a, b) => cmp(a, b) > 0 } };
const quietErr = console.error; console.error = () => {};

const MIGMOD = await import("./system/the-broken-empires/module/migration/migration.mjs");

const withWorld = async (world, fn) => { globalThis.game = world; try { return await fn(); } finally { globalThis.game = undefined; } };

/* --- 7a. Clean pass commits the version ------------------------------- */
{
  const a = mkActor("Eira", { tbe: { toughness: 3 } }, { toughness: 0 });
  const w = mkWorld({ actors: [a] });
  const r = await withWorld(w, () => MIGMOD.migrateAll());
  check(a.system.toughness === 3, "clean pass: stranded legacy Toughness recovered", a.system.toughness);
  check(r.committed === true, "clean pass: the version is committed");
  check(w.__store["the-broken-empires.worldSchemaVersion"] === "0.29.1",
    "clean pass: world now records the target version",
    w.__store["the-broken-empires.worldSchemaVersion"]);
}

/* --- 7b. THE REGRESSION: a later stage failing must hold the version --- */
{
  const good = mkActor("Eira", { tbe: { toughness: 3 } }, { toughness: 0 });
  const bad = mkActor("Bram", { tbe: { toughness: 4 } }, { toughness: 0 }, { failWrite: true });
  const w = mkWorld({ actors: [good, bad] });
  const r = await withWorld(w, () => MIGMOD.migrateAll());
  check(r.failed.length === 1, "partial failure: the failing document is reported", r.failed.length);
  check(r.committed === false, "partial failure: the version is NOT committed");
  check(w.__store["the-broken-empires.worldSchemaVersion"] === "0.21.0",
    "partial failure: the world still records the OLD version, so the next load retries",
    w.__store["the-broken-empires.worldSchemaVersion"]);
  check(good.system.toughness === 3, "partial failure: the document that succeeded keeps its fix");

  /* Second attempt, with the fault cleared, must finish the job. */
  bad.update = mkActor("Bram").update.bind(bad);
  const r2 = await withWorld(w, () => MIGMOD.migrateAll());
  check(bad.system.toughness === 4, "retry: the previously failing document is migrated", bad.system.toughness);
  check(r2.committed === true, "retry: now the version commits");
}

/* --- 7c. Stranded clocks hold the version instead of being lost -------- */
{
  const j = { name: "TBE Clocks", id: "jrnl1",
    flags: { tbe: { clocks: [
      { name: "Doom Clock", have: 3, need: 6 },
      { name: "Doom Clock", have: 1, need: 8 },   // same label, different clock
      { name: "Finished",  have: 6, need: 6, done: true },
      { name: "Blown",     have: 2, need: 6, failed: true }
    ] } } };
  const w = mkWorld({ journal: [j] });
  const r = await withWorld(w, () => MIGMOD.migrateAll());
  check(r.clocks.length === 2, "stranded clocks: only OPEN clocks are counted (done and failed skipped)",
    r.clocks.map((c) => c.name + " " + c.have + "/" + c.need));
  check(r.clocks[0].have === 3 && r.clocks[1].have === 1,
    "stranded clocks: two clocks sharing a label are two clocks, not one",
    r.clocks.map((c) => c.have));
  check(r.committed === false, "stranded clocks: the version is held, so the GM is told again next load");
  check(r.blockedBy === "stranded clocks", "and the report says what is holding it", r.blockedBy);
  check(!("the-broken-empires.encounters" in w.__store) && !("the-broken-empires.trackers" in w.__store),
    "stranded clocks: the migration writes NOTHING to any tracker store",
    Object.keys(w.__store));
  const html = MIGMOD.reportToHtml(r);
  check(/TBE: Clocks/.test(html), "the GM is pointed at the macro that owns the conversion");
}

/* --- 7d. Idempotency: a second clean run changes nothing --------------- */
{
  const a = mkActor("Eira", { tbe: { toughness: 3 } }, { toughness: 0 });
  const w = mkWorld({ actors: [a] });
  await withWorld(w, () => MIGMOD.migrateAll());
  const countAfterFirst = a.updates.length;
  const r2 = await withWorld(w, () => MIGMOD.migrateAll());
  check(r2.upToDate === true, "second run on a migrated world is a no-op");
  check(a.updates.length === countAfterFirst, "and writes nothing further", a.updates.length);
}

/* --- 7e. Never overwrite a real value; a legacy zero is still a value -- */
{
  const keep = mkActor("Sable", { tbe: { toughness: 3 } }, { toughness: 2 });
  const zero = mkActor("Wren", { tbe: { toughness: 0 } }, { toughness: 0 });
  const none = mkActor("Pike", {}, { toughness: 0 });
  const w = mkWorld({ actors: [keep, zero, none] });
  await withWorld(w, () => MIGMOD.migrateAll());
  check(keep.system.toughness === 2, "a real sheet value is never overwritten by a stale flag", keep.system.toughness);
  check(zero.updates.length === 1 && zero.updates[0]["system.toughness"] === 0,
    "a legacy zero is still a value, not an absence");
  check(none.updates.length === 0, "an actor that never had the flag is untouched");
}

/* --- 7f. "Fresh world" must mean fresh, not "has no actors" ------------ */
{
  const itemsOnly = mkWorld({ version: "", actors: [], journal: [], items: [{ name: "Sword" }] });
  itemsOnly.items.size = 1;
  const populated = [itemsOnly.actors, itemsOnly.items, itemsOnly.journal, itemsOnly.scenes,
                     itemsOnly.tables, itemsOnly.macros, itemsOnly.playlists].some((c) => (c?.size ?? 0) > 0);
  check(populated === true,
    "a world with Items but no Actors or Journals is NOT treated as fresh");
  const trulyEmpty = mkWorld({ version: "" });
  const p2 = [trulyEmpty.actors, trulyEmpty.items, trulyEmpty.journal, trulyEmpty.scenes,
              trulyEmpty.tables, trulyEmpty.macros, trulyEmpty.playlists].some((c) => (c?.size ?? 0) > 0);
  check(p2 === false, "and a genuinely empty world still is");
  check(/game\.actors, game\.items, game\.journal, game\.scenes/.test(ENTRY),
    "the ready hook checks every collection, not just actors and journals");
}

/* --- 7g. Steps are grouped by collection, not hardcoded to actors ------ */
{
  check(MIGMOD.STEPS.every((s) => typeof s.collection === "string"),
    "every step declares which collection it walks");
  check(/COLLECTIONS/.test(read(`${SYS}/module/migration/migration.mjs`)),
    "and the runner dispatches on that rather than assuming game.actors");
}

/* --- 7h. Exactly one place writes the version -------------------------- */
{
  const MIGSRC = read(`${SYS}/module/migration/migration.mjs`);
  const writes = (MIGSRC.match(/settings\.set\(\s*FLAG_SCOPE\s*,\s*VERSION_KEY/g) || []).length;
  check(writes === 1, "exactly one call site writes the recorded version", writes);
  const inMigrateAll = MIGSRC.indexOf("settings.set(FLAG_SCOPE, VERSION_KEY") >
                       MIGSRC.indexOf("export async function migrateAll");
  check(inMigrateAll, "...and it is inside migrateAll(), which runs last");
  // Match CALLS, not the comment above them that explains why they are gone.
  const calls = (ENTRY.match(/migration\.(migrateWorld|migrateClockFlags|migrateAll)\s*\(/g) || []);
  check(calls.length === 1 && /migrateAll/.test(calls[0]),
    "the ready hook makes exactly one migration call, and it is migrateAll()", calls);
}
console.error = quietErr;

/* ==================================================================== 8
 * Second-audit findings.
 */
console.log("\n8. Second-audit findings");

/* Every README count is generated from the packs it describes. v0.29.0 fixed
 * the macro count and left the Talent count hand-typed two lines below it. */
const TDOCS = J("data/talent_docs.json");
const tItems = Array.isArray(TDOCS) ? TDOCS : TDOCS.items;
const EQ = J("data/equipment_docs.json");
const counts = {
  macros: J("data/solo_docs.json").macros.length,
  talents: tItems.length,
  equipment: (EQ.items ?? EQ.weapons ?? []).length
};
const rm = read(`${SYS}/README.md`);
const stated = (re) => Number((rm.match(re) || [])[1]);
check(stated(/the (\d+) play macros/) === counts.macros,
  "README macro count matches the pack", [stated(/the (\d+) play macros/), counts.macros]);
check(stated(/all (\d+) Chapter 4 Talents/) === counts.talents,
  "README Talent count matches the catalogue", [stated(/all (\d+) Chapter 4 Talents/), counts.talents]);
check(stated(/\((\d+) Talents\)/) === counts.talents,
  "...and so does the second place the README states it", [stated(/\((\d+) Talents\)/), counts.talents]);
check(!/\b149\b/.test(rm), "no stale 149 anywhere in the README");

/* Packs ship their minimal representation, and it is validated, not assumed. */
const packDirs = fs.readdirSync(path.join(__dirname, SYS, "packs"));
let wal = [];
for (const p of packDirs) {
  for (const f of fs.readdirSync(path.join(__dirname, SYS, "packs", p))) {
    const size = fs.statSync(path.join(__dirname, SYS, "packs", p, f)).size;
    if (/^\d+\.log$/.test(f)) wal.push(`${p}/${f} ${size}b`);
  }
}
check(wal.length === 0,
  "no write-ahead logs ship (compaction moves the data into .ldb first)", wal);
check(/compactRange/.test(read("build_packs.mjs")),
  "the build compacts before deciding what is disposable, rather than guessing");
check(/holds \$\{top\} top-level documents after cleanup/.test(read("build_packs.mjs")),
  "and reopens every pack after cleanup to prove the strip took nothing it needed");

/* The dead flag namespace is gone; the two live ones are documented. */
// Strip comments first: the explanation of why the read was removed naturally
// contains the very string being searched for. This is the second time in this
// file a source-text check matched its own comment -- which is itself an
// argument for asserting over behaviour rather than over text wherever it is
// possible to run the thing instead.
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*/g, "");
check(!/flags\.thebrokenempires/.test(stripComments(read(`${SYS}/module/documents/actor.mjs`))),
  "the dead flags.thebrokenempires read is gone from the code (nothing ever wrote it)");

/* Talent effect scaling is declared, not inferred. */
const ITEMJS = read(`${SYS}/module/documents/item.mjs`);
check(/flags\?\.tbe\?\.perRank === false\) continue/.test(ITEMJS),
  "an effect can declare itself not-per-rank, and that declaration is honoured");
check(!/perRank === undefined/.test(ITEMJS),
  "...but an UNMARKED effect still scales, so a hand-made one is not silently inert");
const unmarked = tItems.filter((t) => (t.effects || []).some(
  (e) => e?.flags?.tbe?.perRank === undefined));
check(unmarked.length === 0,
  "every generated stat effect carries an explicit perRank decision, so unmarked can only mean deliberate",
  unmarked.map((t) => t.name));
const withFx = tItems.filter((t) => (t.effects || []).length);
check(withFx.length === 8, "the eight stat Talents still carry their effects", withFx.length);

/* ==================================================================== 9
 * Encumbrance: one owner for the bands, two owners left for gathering the
 * six numbers that feed them.
 *
 * `TBE.encumbrance()` (helpers/config.mjs) is now the single owner of the
 * bands/cap arithmetic; the sheet's _prepareEnc() and the macro pack's
 * TBE.encStatus() are down to gathering hand/storedGear/unequippedArmor/
 * coinEnc/invBonus/handBonus, from two different starting shapes (the sheet
 * already has weapons/shields/armor pre-split for its template; the macro
 * starts from a whole actor's .items), and handing them off. So this section
 * now checks two different claims: that the arithmetic really has one owner
 * (the macro defers, proven with a sentinel, not just an equal answer), and
 * that the two remaining input-gathering copies still agree across a spread
 * of loadouts -- which is the half that can still drift.
 */
console.log("\n9. Encumbrance: one owner for the bands, gathering checked separately");

const CONFIGJS9 = read(`${SYS}/module/helpers/config.mjs`);
const sysEncSrc = liftStmt(CONFIGJS9, "TBE.encumbrance = function");
check(sysEncSrc.length > 50, "the canonical TBE.encumbrance extracted from config.mjs");
const sysEncFn = (() => { const TBE = {}; new Function("TBE", sysEncSrc)(TBE); return TBE.encumbrance; })();

/* 9a. The bands themselves, against the book, from the one canonical copy. */
const bandOf = (over) => (over <= 0 ? 0 : over <= 3 ? -10 : over <= 6 ? -20 : -30);
check([0, 1, 3, 4, 6, 7, 12].every((over) =>
    // invMax defaults to 6 (no invBonus); storedGear = 6 + over puts the
    // computed overflow at exactly `over`.
    sysEncFn({ storedGear: 6 + over, unequippedArmor: 0, coinEnc: 0 }).over === over &&
    sysEncFn({ storedGear: 6 + over, unequippedArmor: 0, coinEnc: 0 }).penalty === bandOf(over)),
  "the overflow bands are 0 / -10 / -20 / -30 as the book prints them");

/* 9b. The macro's own TBE.encumbrance (the deferral wrapper) really defers,
 * and its no-CONFIG fallback is still correct -- same proof shape as
 * section 5's sizeEffects, same reason: a mutation that breaks the guard
 * would still compute a plausible-looking number, so equality alone can't
 * catch it. */
const macEncSrc = liftStmt(LIB, "TBE.encumbrance = function");
check(/CONFIG\.TBE\.encumbrance/.test(macEncSrc), "the macro's TBE.encumbrance shows the deferral guard in its own source");
const runMacEnc = (configTBE) => {
  const TBE = {};
  new Function("TBE", "CONFIG", macEncSrc)(TBE, configTBE ? { TBE: configTBE } : undefined);
  return TBE.encumbrance;
};
const inputs = { hand: 2, storedGear: 5, unequippedArmor: 1, coinEnc: 1, invBonus: 0, handBonus: 0 };
check(JSON.stringify(runMacEnc(undefined)(inputs)) === JSON.stringify(sysEncFn(inputs)),
  "with no CONFIG present, the macro's own fallback still agrees with the canonical rule");
const encSentinel = (i) => ({ __sentinel: true, ...i });
check(runMacEnc({ encumbrance: encSentinel })(inputs)?.__sentinel === true,
  "with CONFIG.TBE.encumbrance present, the macro really defers to it");

/* 9c/9d. Input-gathering: sheet vs macro, both bound to the SAME canonical
 * arithmetic (sysEncFn), so any disagreement can only be in what each side
 * decided hand/storedGear/unequippedArmor/coinEnc/invBonus/handBonus are. */
const SHEET = read(`${SYS}/module/sheets/actor-sheet.mjs`);
const sheetEnc = (() => {
  const i = SHEET.indexOf("_prepareEnc(weapons, shields, armor, system) {");
  let depth = 0, j = SHEET.indexOf("{", i);
  const start = j;
  for (; j < SHEET.length; j++) {
    if (SHEET[j] === "{") depth++;
    else if (SHEET[j] === "}") { depth--; if (!depth) break; }
  }
  return new Function("TBE", "weapons", "shields", "armor", "system", SHEET.slice(start + 1, j));
})();
const macroEncStatusSrc = liftStmt(LIB, "TBE.encStatus = function");
check(macroEncStatusSrc.length > 50, "TBE.encStatus extracted");
/* Both sides now ask CONFIG.TBE.carryPool which ENC pool a carry state counts
   toward, instead of each testing `!== "stored"` inline (v0.35.0 -- see
   loadout_check.mjs for why that negative filter was a live bug once a fourth
   state existed). So the harness has to supply that owner too, or it is
   testing a shape neither side ships. Taken from the real config module
   rather than restated here. */
const REAL_TBE = (await import(`./${SYS}/module/helpers/config.mjs`)).TBE;
const poolBits = {
  CARRY_POOL: REAL_TBE.CARRY_POOL,
  READINESS: REAL_TBE.READINESS,
  carryPool: REAL_TBE.carryPool,
  POOL: REAL_TBE.CARRY_POOL
};
const macroEnc = (() => {
  const TBE = Object.assign(
    { num: (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d), encumbrance: sysEncFn },
    poolBits);
  new Function("TBE", macroEncStatusSrc)(TBE);
  return TBE.encStatus;
})();
const canonicalTBE = Object.assign({ encumbrance: sysEncFn }, poolBits);

/* A spread of loadouts, including the boundaries of every penalty band. */
const loadouts = [];
for (const stored of [0, 1, 3, 6, 7, 9, 10, 14]) {
  for (const silver of [0, 499, 500, 1500]) {
    for (const invBonus of [0, 2]) {
      for (const unequipped of [0, 2]) {
        loadouts.push({ stored, silver, invBonus, unequipped, handBonus: invBonus ? 1 : 0 });
      }
    }
  }
}
let encMismatch = null;
for (const L of loadouts) {
  const weapons = [{ system: { enc: 2, carried: "hand" } },
                   { system: { enc: L.stored, carried: "stored" } }];
  const shields = [];
  const armor = Array.from({ length: L.unequipped }, () => ({ system: { equipped: false } }))
    .concat([{ system: { equipped: true } }]);
  const system = { silver: L.silver, enc: { invBonus: L.invBonus, handBonus: L.handBonus } };

  const a = sheetEnc(canonicalTBE, weapons, shields, armor, system);
  const actor = {
    system,
    items: [...weapons.map((w) => ({ ...w, type: "weapon" })),
            ...armor.map((x) => ({ ...x, type: "armor" }))]
  };
  const b = macroEnc(actor);
  if (JSON.stringify(a) !== JSON.stringify(b)) { encMismatch = [L, a, b]; break; }
}
check(encMismatch === null,
  `sheet and macro input-gathering agree across all ${loadouts.length} loadouts, sharing one arithmetic owner`, encMismatch);

/* No outbound network requests from the shipped tree. */
const CSS = read(`${SYS}/css/the-broken-empires.css`);
check(!/@import\s+url\(["']https?:/.test(CSS),
  "the stylesheet makes no outbound request (an offline world renders correctly)");
check(/Georgia|Palatino/.test(CSS), "and every font family has a real local fallback stack");

/* -------------------------------------------------------------------- end */
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
