#!/usr/bin/env node
/*
 * smoke_check.mjs -- TBE: Table Smoke Test (v0.56.0) run against a stand-in
 * world. Owner: module/helpers/table-smoke.mjs.
 *
 * The smoke test exists because the Create Character window, token linking,
 * the table defaults, portraits and the oracle import had only ever run behind
 * stand-ins. It is a probe for a REAL Foundry. This check cannot prove what the
 * probe proves; it proves the probe itself is safe to hand a GM:
 *
 *   1. A full run passes on both API shapes it branches on (TableResult
 *      name/description vs text; statusEffects Array vs keyed object).
 *   2. It touches nothing it did not make: a world actor, scene and a
 *      look-alike "TBE smoke:" table with no run tag are left alone.
 *   3. Cancel at the first prompt creates nothing.
 *   4. One failing probe does not stop the rest, and its dependants say NOT RUN.
 *   5. A create that persists then throws is still cleaned up (found by tag).
 *   6. A delete that fails is reported by uuid; the card says FAIL.
 *   7. Non-GM and a second concurrent run are refused before anything is made.
 *   8. A missing system status is named.
 *   9. The BUILT macro: GM gate, real TBE.prompt as the file form, report
 *      whispered to the GM only.
 * Mutations: cleanup by name instead of by tag (section 2), and cleanup
 * skipped after a throw (section 5).
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

let pass = 0, fail = 0;
const check = (cond, label, extra) => {
  if (cond) { pass++; console.log("  PASS  " + label); }
  else { fail++; console.log("  FAIL  " + label + (extra !== undefined ? "  <- " + JSON.stringify(extra).slice(0, 600) : "")); }
};
const section = (s) => console.log("\n" + s);
const SYS = "./system/the-broken-empires/module/";
const OWNER = SYS + "helpers/table-smoke.mjs";
const { TBE: CFG } = await import(SYS + "helpers/config.mjs");
const TD = await import(SYS + "helpers/table-defaults.mjs");
const TL = await import(SYS + "helpers/token-link.mjs");
const entrySrc = fs.readFileSync(SYS + "the-broken-empires.mjs", "utf8");
const initBody = entrySrc.slice(entrySrc.indexOf("_getInitiativeFormula() {") + "_getInitiativeFormula() {".length,
  entrySrc.indexOf("\n    }", entrySrc.indexOf("_getInitiativeFormula() {")));
const initFormula = new Function(initBody);

/* ---------------------------------------------------------------- the world */
const clone = (x) => JSON.parse(JSON.stringify(x));
function setPath(obj, key, value) {
  const ks = key.split(".");
  let o = obj;
  for (const k of ks.slice(0, -1)) o = (o[k] ??= {});
  o[ks[ks.length - 1]] = value;
}
function apply(target, changes) {
  for (const [k, v] of Object.entries(changes ?? {})) {
    if (k === "_id") continue;
    if (k.includes(".")) setPath(target, k, v);
    else if (v && typeof v === "object" && !Array.isArray(v) && target[k] && typeof target[k] === "object") apply(target[k], v);
    else target[k] = clone(v);
  }
}

function makeWorld(opt = {}) {
  let seq = 0;
  const id = () => "id" + String(++seq).padStart(4, "0");
  const hooks = {};
  const log = [];
  const coll = (arr) => Object.assign(arr, { contents: arr, get: (i) => arr.find((d) => d.id === i) });
  const W = { actors: coll([]), scenes: coll([]), tables: coll([]), combats: coll([]), log, hooks };

  class Doc {
    constructor(data, name, list) {
      apply(this, clone({ ...data, results: undefined }));
      this.flags ??= {};
      this.id = id(); this._id = this.id;
      this.documentName = name; this.uuid = name + "." + this.id; this._list = list;
    }
    getFlag(s, k) { return this.flags?.[s]?.[k]; }
    updateSource(u) { apply(this, u); }
    async update(u) { apply(this, u); return this; }
    async delete() {
      if (opt.failDelete?.(this)) throw new Error("delete refused");
      const i = this._list.indexOf(this); if (i >= 0) this._list.splice(i, 1);
      log.push("delete " + this.uuid);
    }
    static async _make(Klass, name, list, data, hookName) {
      const probe = !!data?.flags?.["the-broken-empires"]?.tableSmoke;   /* faults hit the probe's documents only */
      if (probe && opt.failCreate?.(name, data)) throw new Error(name + " create refused");
      const d = new Klass(data, name, list);
      for (const fn of hooks[hookName] ?? []) fn(d, data);
      list.push(d); log.push("create " + d.uuid);
      if (probe && opt.throwAfterCreate?.(name, data)) throw new Error(name + " created, then a hook threw");
      return d;
    }
  }

  const proto = (name) => ({ name, actorLink: false, lockRotation: false, sight: { enabled: false }, disposition: -1,
    texture: { src: "icons/svg/mystery-man.svg" } });
  class Actor extends Doc {
    constructor(data, name, list) {
      super(data, name, list);
      const pt = Object.assign(proto(this.name), this.prototypeToken ?? {});
      pt.toObject = () => { const o = clone({ ...pt }); delete o.toObject; return o; };
      this.prototypeToken = pt;
      this.system ??= {};
      if (this.type === "character") { this.system.notes ??= ""; this.system.initiativeEffective = 11; }
      else this.system.initiativeEffective = Number(this.system.initiative) || 0;
      this.img ??= "icons/svg/mystery-man.svg";
      this.items = coll([]);
    }
    async createEmbeddedDocuments(type, rows) { const made = rows.map((r) => Object.assign({ id: id() }, clone(r))); this.items.push(...made); return made; }
    async deleteEmbeddedDocuments(type, ids) { const keep = this.items.filter((i) => !ids.includes(i.id)); this.items.length = 0; this.items.push(...keep); return ids; }
    toObject() { return clone({ name: this.name, img: this.img, type: this.type, system: this.system, items: this.items }); }
    static create(data) { return Doc._make(Actor, "Actor", W.actors, data, "preCreateActor"); }
  }

  class Token extends Doc {
    constructor(data, scene) {
      super(data, "Token", scene.tokens);
      this.delta = { system: {}, items: null, name: undefined };
      this.delta.toObject = () => { const o = { system: clone(this.delta.system) }; if (this.delta.name) o.name = this.delta.name; if (this.delta.items) o.items = clone(this.delta.items); return o; };
    }
    get baseActor() { return W.actors.get(this.actorId); }
    get actor() {
      const base = this.baseActor;
      if (!base) return null;
      if (this.actorLink) return base;
      const t = this;
      return {
        id: base.id, get name() { return t.delta.name ?? base.name; }, img: base.img, type: base.type,
        get system() { const s = clone(base.system); apply(s, t.delta.system); return s; },
        get items() { return coll(t.delta.items ?? clone(base.items)); },
        async update(u) {
          for (const [k, v] of Object.entries(u)) {
            if (k === "name") t.delta.name = v;
            else if (k.startsWith("system.")) setPath(t.delta.system, k.slice(7), v);
            else if (k === "system") apply(t.delta.system, v);
          }
        },
        async createEmbeddedDocuments(type, rows) { t.delta.items = (t.delta.items ?? clone(base.items)).concat(rows.map((r) => Object.assign({ id: id() }, clone(r)))); return rows; },
        toObject() { return { name: this.name, img: this.img, system: this.system, items: clone(this.items) }; }
      };
    }
  }
  class Scene extends Doc {
    constructor(data, name, list) { super(data, name, list); this.tokens = coll([]); this.tokenVision ??= false; }
    async createEmbeddedDocuments(type, rows) {
      return rows.map((r) => { const t = new Token(r, this); for (const fn of hooks.preCreateToken ?? []) fn(t, r); this.tokens.push(t); return t; });
    }
    static create(data) { return Doc._make(Scene, "Scene", W.scenes, data, "preCreateScene"); }
  }
  class RollTable extends Doc {
    constructor(data, name, list) { super(data, name, list); this.results = coll((data.results ?? []).map((r) => Object.assign({ id: id() }, clone(r)))); }
    async updateEmbeddedDocuments(type, rows) { for (const r of rows) apply(this.results.get(r._id), r); return rows; }
    async roll({ roll } = {}) { const total = roll.total; return { roll, results: this.results.filter((r) => total >= r.range[0] && total <= r.range[1]) }; }
    static create(data) { return Doc._make(RollTable, "RollTable", W.tables, data, "preCreateRollTable"); }
  }
  class Roll {
    constructor(formula) { this.formula = formula; }
    async evaluate() {
      if (/@|undefined|NaN/.test(this.formula)) throw new Error("unresolved roll " + this.formula);
      this.total = this.formula.replace(/(\d+)d\d+/g, "$1").split("+").reduce((n, x) => n + Number(x.trim()), 0);
      return this;
    }
  }
  class Combat extends Doc {
    constructor(data, name, list) { super(data, name, list); this.combatants = []; }
    async createEmbeddedDocuments(type, rows) {
      const made = rows.map((r) => ({
        ...r, id: id(), get actor() { return W.actors.get(r.actorId); },
        _getInitiativeFormula() { return initFormula.call(this); },
        getInitiativeRoll() { return new Roll(this._getInitiativeFormula().replace("@initiativeEffective", String(this.actor.system.initiativeEffective))); }
      }));
      this.combatants.push(...made); return made;
    }
    static create(data) { return Doc._make(Combat, "Combat", W.combats, data, "preCreateCombat"); }
  }

  /* A world that already has things in it, which the probe must not touch. */
  W.seed = async () => {
    W.hero = await Actor.create({ name: "Bahrouz", type: "character" });
    W.camp = await Scene.create({ name: "The Ruin Fortress", active: true });
    W.lookalike = await RollTable.create({ name: "TBE smoke: left over by hand", formula: "1d1", results: [] });
  };

  const settings = { linkCharacters: true, characterVision: true, lockRotation: true, sceneVision: true, portraitFolders: "", oracleEvents: false };
  const userFlags = {};
  const user = { isGM: opt.gm !== false, flags: userFlags,
    getFlag: (s, k) => userFlags[s]?.[k], setFlag: async (s, k, v) => { (userFlags[s] ??= {})[k] = v; } };

  const fakeApp = (actor, kind) => {
    const app = { actor, kind, closed: false, async close() { this.closed = true; this.element = null; } };
    app.element = { querySelector: (sel) => opt.brokenWindow === kind ? null : { sel } };
    return app;
  };
  const instances = new Map();
  const promptLog = [];
  const DialogV2 = {
    async prompt(o) {
      promptLog.push(o.window?.title);
      if (opt.cancel && promptLog.length === 1) return null;
      let input = { files: [] };
      if (o.render) {
        const root = { querySelector: (sel) => (sel === 'input[name="file"]' ? input : null) };
        o.render(new Event("render"), root);
      }
      const form = { elements: { name: { value: opt.typedName ?? "Table Smoke" } }, __pairs: () => [["file", input.files[0]]] };
      return o.ok.callback(null, { form });
    }
  };

  const install = (shape) => {
    globalThis.game = {
      version: shape.version, release: { version: shape.version }, system: { version: "0.56.0" }, user,
      settings: { get: (ns, k) => settings[k], register: () => {} },
      actors: W.actors, scenes: W.scenes, tables: W.tables, combats: W.combats,
      thebrokenempires: {
        tokens: { deltaSummary: TL.deltaSummary, linkToken: TL.linkToken },
        chargen: { open: async (a) => { const x = fakeApp(a, "creator"); instances.set("c" + a.id, x); return x; },
                   shop: async (a) => fakeApp(a, "shop") }
      }
    };
    const statuses = CFG.STATUSES.filter((s) => s.id !== opt.dropStatus).map((s) => ({ id: s.id, name: s.name }));
    globalThis.CONFIG = {
      TBE: CFG,
      statusEffects: shape.keyedStatuses ? Object.fromEntries(statuses.map((s) => [s.id, s])) : statuses,
      Combat: { initiative: { formula: "1d10 + @initiativeEffective" } },
      TableResult: { documentClass: { schema: { fields: shape.v13Results ? { name: {}, description: {} } : { text: {} } } } }
    };
    globalThis.CONST = { TABLE_RESULT_TYPES: { TEXT: "text" } };
    globalThis.foundry = {
      utils: { randomID: () => Math.random().toString(36).slice(2, 18) },
      applications: { api: { DialogV2 }, instances, apps: shape.namespacedFP ? { FilePicker: { implementation: FP } } : {} }
    };
    if (!shape.namespacedFP) globalThis.FilePicker = FP; else delete globalThis.FilePicker;
    Object.assign(globalThis, { Actor, Scene, RollTable, Combat, Roll });
    globalThis.Hooks = { on: (n, fn) => (hooks[n] ??= []).push(fn) };
    globalThis.DataTransfer = class { constructor() { const files = []; this.items = { add: (f) => files.push(f) }; this.files = files; } };
    globalThis.FormData = function (form) { return form.__pairs(); };
    TD.register();
  };
  const FP = { browse: async (src, dir) => ({ files: dir === "systems/the-broken-empires/assets" ? ["systems/the-broken-empires/assets/anvil-impact.png"] : [], dirs: [] }) };
  W.install = install; W.promptLog = promptLog; W.instances = instances; W.user = user;
  return W;
}

const V13 = { version: "13.348", v13Results: true, keyedStatuses: false, namespacedFP: true };
const V14 = { version: "14.365", v13Results: true, keyedStatuses: true, namespacedFP: true };
const V12 = { version: "12.343", v13Results: false, keyedStatuses: false, namespacedFP: false };
const tagged = (W) => [...W.actors, ...W.scenes, ...W.tables, ...W.combats].filter((d) => d.flags?.["the-broken-empires"]?.tableSmoke);
let fresh = 0;
const loadOwner = async (file = OWNER) => import(pathToFileURL(path.resolve(file)).href + "?f=" + (++fresh));
const run = async (W, shape, opts = {}, file) => {
  W.install(shape);
  const S = await loadOwner(file);
  return S.runTableSmokeTest({ filePrompt: opts.filePrompt ?? fileForm });
};
/* The file form the macro passes: the real TBE.prompt out of _lib.js. */
const lib = fs.readFileSync("macros/_lib.js", "utf8");
const LIB = new Function("const TBE_DATA = { tables: [] };\n" + lib + "\n;return TBE;")();
const fileForm = (...a) => LIB.prompt(...a);
const PROBES = ["DialogV2: actor name", "DialogV2: file input", "Actor defaults", "Scene defaults", "Token defaults",
  "Token delta.toObject()", "Link token: keep token", "Link token: keep actor", "FilePicker and portrait roster",
  "RollTable create and update", "RollTable.roll with a modifier", "Create Character: step 1", "Equipment shop dialog",
  "Registered status effects", "Combatant initiative", "Cleanup"];
const row = (r, n) => r.rows.find((x) => x.name === n);

/* ------------------------------------------------------------------ 1 */
section("1. A full run passes on every API shape the probe branches on");
for (const [label, shape] of [["V12 (text results, Array statuses, global FilePicker)", V12], ["V13 (name/description, Array)", V13], ["V14 (keyed statuses)", V14]]) {
  const W = makeWorld(); W.install(shape); await W.seed();
  const r = await run(W, shape);
  const bad = r.rows.filter((x) => x.status !== "PASS");
  check(r.ok && !bad.length, label + ": every probe passes", bad);
  check(JSON.stringify(r.rows.map((x) => x.name)) === JSON.stringify(PROBES), label + ": all fifteen probes ran, then cleanup, in order", r.rows.map((x) => x.name));
  check(r.version === shape.version && r.system === "0.56.0", label + ": the card names the Foundry and system versions");
  check(!tagged(W).length && W.instances.size >= 0, label + ": nothing it made is left");
  if (shape === V12) check(/text results/.test(row(r, "RollTable create and update").detail) && /Global FilePicker/.test(row(r, "FilePicker and portrait roster").detail), "V12: the text schema and the global FilePicker were the ones exercised");
  if (shape === V14) check(/Keyed object/.test(row(r, "Registered status effects").detail) && /name\/description/.test(row(r, "RollTable create and update").detail), "V14: the keyed statuses and name/description results were the ones exercised");
}

/* ------------------------------------------------------------------ 2 */
section("2. It touches nothing it did not make");
{
  const W = makeWorld(); W.install(V13); await W.seed();
  const before = JSON.stringify({ hero: W.hero.toObject(), camp: { name: W.camp.name, active: W.camp.active, tokens: W.camp.tokens.length } });
  const r = await run(W, V13);
  check(r.ok, "the run passes with a populated world");
  check(W.actors.includes(W.hero) && W.scenes.includes(W.camp) && W.tables.includes(W.lookalike), "the world's actor, its active scene and a look-alike \"TBE smoke:\" table all survive");
  check(JSON.stringify({ hero: W.hero.toObject(), camp: { name: W.camp.name, active: W.camp.active, tokens: W.camp.tokens.length } }) === before, "and are unchanged");
  check(W.log.filter((l) => l.startsWith("delete")).every((l) => !l.includes(W.hero.id) && !l.includes(W.camp.id) && !l.includes(W.lookalike.id)), "no delete was ever aimed at them");
  /* Mutation: clean up by name, as a quicker version might. */
  const src = fs.readFileSync(OWNER, "utf8");
  const a = "if (owned(doc) && !docs.some((d) => d.uuid === doc.uuid)) docs.push(doc);";
  check(src.includes(a), "the tag-only sweep is where the mutation expects it");
  const mut = path.resolve(SYS + "helpers/.table-smoke.mut1.mjs");
  fs.writeFileSync(mut, src.replace(a, 'if ((owned(doc) || /^TBE smoke:/.test(doc.name ?? "")) && !docs.some((d) => d.uuid === doc.uuid)) docs.push(doc);')
    .replace('assert(owned(doc), "Temporary document lost its run tag; remove it manually: " + doc.uuid);', ""));
  try {
    const W2 = makeWorld(); W2.install(V13); await W2.seed();
    await run(W2, V13, {}, mut);
    check(!W2.tables.includes(W2.lookalike), "mutation: a by-name sweep deletes the GM's own \"TBE smoke:\" table, which the tag rule prevents");
  } finally { fs.unlinkSync(mut); }
}

/* ------------------------------------------------------------------ 3 */
section("3. Cancel at the first prompt");
{
  const W = makeWorld({ cancel: true }); W.install(V13); await W.seed();
  const created = W.log.length;
  const r = await run(W, V13);
  check(r.cancelled && !r.ok, "the report says cancelled, not passed");
  check(W.log.length === created, "nothing was created or deleted");
  check(row(r, "Cleanup")?.status === "PASS" && /0 temporary documents/.test(row(r, "Cleanup").detail), "cleanup still reports, with nothing to remove");
}

/* ------------------------------------------------------------------ 4 */
section("4. One failing probe does not stop the rest");
{
  const W = makeWorld({ failCreate: (name) => name === "RollTable" }); W.install(V13); await W.seed();
  const r = await run(W, V13);
  check(row(r, "RollTable create and update").status === "FAIL" && /create refused/.test(row(r, "RollTable create and update").detail), "the failing probe is FAIL, with Foundry's message");
  check(row(r, "RollTable.roll with a modifier").status === "NOT RUN", "its dependant says NOT RUN, not a second failure");
  check(["Create Character: step 1", "Equipment shop dialog", "Registered status effects", "Combatant initiative"].every((n) => row(r, n).status === "PASS"), "the probes after it still run and pass");
  check(!r.ok && row(r, "Cleanup").status === "PASS" && !tagged(W).length, "the card says FAIL and cleanup still removes everything");
}
{
  const W = makeWorld({ brokenWindow: "creator" }); W.install(V13); await W.seed();
  const r = await run(W, V13);
  check(row(r, "Create Character: step 1").status === "FAIL" && /did not finish rendering/.test(row(r, "Create Character: step 1").detail), "a window that does not render step 1 is named");
  check([...W.instances.values()].every((a) => a.closed), "and is closed anyway");
}

/* ------------------------------------------------------------------ 5 */
section("5. A create that persists, then throws, is still cleaned up");
{
  const W = makeWorld({ throwAfterCreate: (name) => name === "Scene" }); W.install(V13); await W.seed();
  const r = await run(W, V13);
  check(row(r, "Scene defaults").status === "FAIL", "the scene probe fails");
  check(["Token defaults", "Link token: keep token", "Link token: keep actor", "Combatant initiative"].every((n) => row(r, n).status === "NOT RUN"), "everything that needs the scene says NOT RUN");
  check(!tagged(W).length && row(r, "Cleanup").status === "PASS", "the orphaned scene was found by its run tag and deleted");
  /* Mutation: skip the sweep, trusting only the list of what create returned. */
  const src = fs.readFileSync(OWNER, "utf8");
  const mut = path.resolve(SYS + "helpers/.table-smoke.mut2.mjs");
  fs.writeFileSync(mut, src.replace("if (owned(doc) && !docs.some((d) => d.uuid === doc.uuid)) docs.push(doc);", ""));
  try {
    const W2 = makeWorld({ throwAfterCreate: (name) => name === "Scene" }); W2.install(V13); await W2.seed();
    const r2 = await run(W2, V13, {}, mut);
    check(tagged(W2).length === 1 && /Still present: Scene\./.test(row(r2, "Cleanup").detail), "mutation: without the sweep the scene is left behind (and the final scan names it)");
  } finally { fs.unlinkSync(mut); }
}

/* ------------------------------------------------------------------ 6 */
section("6. A delete that fails is reported");
{
  const W = makeWorld({ failDelete: (d) => d.documentName === "RollTable" && d.flags?.["the-broken-empires"]?.tableSmoke }); W.install(V13); await W.seed();
  const r = await run(W, V13);
  const c = row(r, "Cleanup");
  check(c.status === "FAIL" && /RollTable\.id\d+: delete refused/.test(c.detail) && /Still present: RollTable\./.test(c.detail), "cleanup FAILs, naming the document by uuid", c);
  check(!r.ok, "and the card says FAIL");
  check(tagged(W).length === 1 && tagged(W)[0].documentName === "RollTable", "everything else was still removed");
}

/* ------------------------------------------------------------------ 7 */
section("7. Refusals come before anything is made");
{
  const W = makeWorld({ gm: false }); W.install(V13); await W.seed();
  const n = W.log.length;
  const r = await run(W, V13);
  check(/Only a GM/.test(r.refused ?? "") && W.log.length === n && !W.promptLog.length, "a player is refused with a sentence, no prompt, nothing created");
}
{
  const W = makeWorld(); W.install(V13); await W.seed();
  const S = await loadOwner();
  const [a, b] = await Promise.all([S.runTableSmokeTest({ filePrompt: fileForm }), S.runTableSmokeTest({ filePrompt: fileForm })]);
  check(a.ok && /already running/.test(b.refused ?? ""), "a second run on the same client is refused while the first is going");
  const c = await S.runTableSmokeTest({ filePrompt: fileForm });
  check(c.ok, "and the guard is released afterwards");
}

/* ------------------------------------------------------------------ 8 */
section("8. A missing status is named");
{
  const W = makeWorld({ dropStatus: "tbe-dying" }); W.install(V14); await W.seed();
  const r = await run(W, V14);
  check(row(r, "Registered status effects").status === "FAIL" && /tbe-dying/.test(row(r, "Registered status effects").detail), "the dropped status is named");
}
{
  /* The file form: without a render hook nothing is attached and it says so. */
  const W = makeWorld(); W.install(V13); await W.seed();
  const r = await run(W, V13, { filePrompt: (t, c, ok) => LIB.prompt(t, c, ok) });
  check(row(r, "DialogV2: file input").status === "FAIL" && /Could not attach the test file/.test(row(r, "DialogV2: file input").detail), "a form helper that drops the render hook fails the file probe with a reason");
}

/* ------------------------------------------------------------------ 9 */
section("9. The built macro");
{
  const docs = JSON.parse(fs.readFileSync("data/solo_docs.json", "utf8"));
  const m = docs.macros.find((x) => x.name === "TBE: Table Smoke Test");
  check(m && m.command.includes("game.thebrokenempires.smoke.run({ filePrompt: TBE.prompt })"), "the macro hands the probe the real TBE.prompt");
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const exec = new AsyncFunction("speaker", "actor", "token", "character", "scope", "{\n" + m.command + "\n}");
  const posted = [], warned = [];
  const W = makeWorld(); W.install(V13); await W.seed();
  const S = await loadOwner();
  game.thebrokenempires.smoke = { run: S.runTableSmokeTest };
  globalThis.ui = { notifications: { warn: (x) => warned.push(x), info: () => {}, error: (x) => warned.push(x) } };
  globalThis.ChatMessage = { create: async (d) => { posted.push(d); return d; }, getSpeaker: () => ({}), applyRollMode: (d, mode) => { d.rollMode = mode; if (mode === "selfroll") d.whisper = [game.user.id]; } };
  game.user.id = "gm1"; game.users = { filter: () => [], contents: [] };
  game.settings.get = ((g) => (ns, k) => (k === "rollMode" ? "publicroll" : g(ns, k)))(game.settings.get);
  await exec({}, null, null, null, {});
  check(posted.length === 1 && /Table Smoke Test: PASS/.test(posted[0].content) && /Foundry <b>13\.348<\/b>/.test(posted[0].content), "a GM gets one PASS card with the Foundry version", posted.map((p) => (p.content || "").slice(0, 120)));
  check(posted[0]?.whisper?.length === 1 && posted[0].whisper[0] === "gm1", "the card is whispered to the GM who ran it, not posted to the table", posted[0]?.whisper);
  game.user.isGM = false; posted.length = 0;
  await exec({}, null, null, null, {});
  check(!posted.length && warned.some((w) => /only a GM/.test(w)), "a player gets a sentence and no card");
  delete globalThis.ui; delete globalThis.ChatMessage;
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
