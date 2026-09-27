/* boot_check.mjs — does the system come up, the way a stranger's Foundry loads it?
 *
 * Phase 7's first pass (v0.48.0) found that no check had ever run the entry
 * module. Eight scripts import PIECES of the-broken-empires.mjs or read its
 * source; none imports the file itself, fires `init` and `ready`, and asks
 * what the world is left holding. A system that throws inside `init` is a
 * blank world with no sheets, whatever every rule test says.
 *
 * This imports the real entry module against stubbed Foundry globals, fires
 * the hooks it registered, and asserts:
 *   1. it imports, and registers init / ready / diceSoNiceReady;
 *   2. init runs against BOTH status-effect shapes (Array through V13, keyed
 *      object from V14; CLAUDE.md rule 7);
 *   3. every document type the manifest declares has a DataModel, the
 *      model's schema builds, and a sheet template exists for it;
 *   4. every document type has a TYPES label, and every label, setting name
 *      and hint the module hands Foundry is in lang/en.json. The Enchantment
 *      item type had none, so Create Item showed "TYPES.Item.enchantment";
 *   5. every preloaded template exists;
 *   6. nothing on game.thebrokenempires.rules is undefined (a renamed export
 *      would otherwise reach a macro as "is not a function" at the table);
 *   7. ready on a fresh, empty world as GM stamps the world version and posts
 *      nothing; as a player it writes nothing.
 * Then three mutations on a temp copy, each of which must turn a section red.
 *
 * Run: node boot_check.mjs [path/to/unpacked/the-broken-empires]
 * Defaults to the working tree. Point it at an unpacked release zip to check
 * the artifact rather than the source.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(process.argv[2] ?? "system/the-broken-empires");
const SYS_ID = "the-broken-empires";

let pass = 0, fail = 0;
const check = (cond, label, extra) => {
  if (cond) { pass++; console.log("  PASS  " + label); }
  else { fail++; console.log("  FAIL  " + label + (extra !== undefined ? "  <- " + JSON.stringify(extra) : "")); }
};

/* ---------------------------------------------------------------- stubs -- */

const cmp = (a, b) => {
  const pa = String(a).split(".").map(Number), pb = String(b).split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
};

/* A field class records its options and nothing else. Any fields.X a model
   asks for exists, so a schema that builds here builds from real field types
   only if the name is real: the list below is Foundry's, not a Proxy. */
const FIELD_NAMES = ["StringField", "NumberField", "BooleanField", "SchemaField", "ArrayField",
  "HTMLField", "ObjectField", "SetField", "EmbeddedDataField", "DocumentUUIDField", "FilePathField",
  "ColorField", "AlphaField", "AngleField", "IntegerSortField", "JSONField", "TypeDataField"];
const fields = {};
for (const n of FIELD_NAMES) fields[n] = class { constructor(...a) { this.args = a; } };

/* Everything init and ready touch, fresh per boot. Returns the recorder. */
function installGlobals({ statusShape, isGM, populated }) {
  const rec = { hooks: {}, helpers: {}, templates: [], settings: {}, values: {}, sheets: [], chats: [], sets: [] };
  globalThis.Hooks = {
    once: (name, fn) => (rec.hooks[name] ??= []).push(fn),
    on: (name, fn) => (rec.hooks[name] ??= []).push(fn)
  };
  globalThis.Handlebars = { registerHelper: (n, f) => { rec.helpers[n] = f; } };
  globalThis.foundry = {
    abstract: { TypeDataModel: class {} },
    data: { fields },
    utils: {
      isNewerVersion: (a, b) => cmp(a, b) > 0,
      mergeObject: (a, b) => ({ ...a, ...b }),
      duplicate: (o) => JSON.parse(JSON.stringify(o))
    }
  };
  class Doc {}
  globalThis.Actor = class extends Doc {};
  globalThis.Item = class extends Doc {};
  globalThis.Combatant = class extends Doc {};
  globalThis.Combat = class extends Doc {};
  globalThis.ActorSheet = class { static get defaultOptions() { return {}; } };
  globalThis.ItemSheet = class { static get defaultOptions() { return {}; } };
  const sheetReg = (doc) => ({
    unregisterSheet: () => {},
    registerSheet: (scope, cls, opts) => rec.sheets.push({ doc, scope, cls, opts })
  });
  globalThis.Actors = sheetReg("Actor");
  globalThis.Items = sheetReg("Item");
  globalThis.loadTemplates = async (paths) => { rec.templates.push(...paths); return []; };
  globalThis.CONFIG = {
    Actor: {}, Item: {}, Combat: {}, Combatant: {},
    statusEffects: statusShape === "object" ? { dead: { id: "dead" } } : [{ id: "dead" }],
    ui: {}
  };
  const empty = { size: 0 }, full = { size: 1 };
  globalThis.game = {
    system: { id: SYS_ID, version: JSON.parse(fs.readFileSync(path.join(ROOT, "system.json"), "utf8")).version },
    user: { isGM },
    settings: {
      register: (scope, key, cfg) => { rec.settings[`${scope}.${key}`] = cfg; },
      get: (scope, key) => rec.values[`${scope}.${key}`] ?? rec.settings[`${scope}.${key}`]?.default,
      set: async (scope, key, v) => { rec.sets.push([`${scope}.${key}`, v]); rec.values[`${scope}.${key}`] = v; return v; }
    },
    actors: populated ? full : empty, items: empty, journal: empty, scenes: empty,
    tables: empty, macros: empty, playlists: empty
  };
  globalThis.ui = { notifications: { info() {}, warn() {}, error() {} } };
  globalThis.ChatMessage = {
    create: async (d) => { rec.chats.push(d); return d; },
    getWhisperRecipients: () => []
  };
  return rec;
}

/* Import a fresh instance of the entry module under `root` and fire init. */
let bootN = 0;
async function boot(root, opts) {
  const rec = installGlobals(opts);
  const url = pathToFileURL(path.join(root, "module/the-broken-empires.mjs")).href + `?boot=${++bootN}`;
  rec.importError = null;
  try { await import(url); } catch (e) { rec.importError = e; return rec; }
  rec.initError = null;
  try { for (const fn of rec.hooks.init ?? []) await fn(); } catch (e) { rec.initError = e; }
  return rec;
}
async function fireReady(rec) {
  try { for (const fn of rec.hooks.ready ?? []) await fn(); return null; } catch (e) { return e; }
}

/* ------------------------------------------------------ static readers -- */

const readJson = (root, f) => JSON.parse(fs.readFileSync(path.join(root, f), "utf8"));
const flatLang = (root) => {
  const out = {};
  (function walk(o, p) {
    for (const [k, v] of Object.entries(o)) {
      const kk = p ? `${p}.${k}` : k;
      if (v && typeof v === "object") walk(v, kk); else out[kk] = v;
    }
  })(readJson(root, "lang/en.json"), "");
  return out;
};
const sysPath = (root, p) => path.join(root, p.replace(`systems/${SYS_ID}/`, ""));

/* Labels a stranger's Foundry will try to localize, keyed by where from. */
function missingLabels(root, rec) {
  const lang = flatLang(root);
  const manifest = readJson(root, "system.json");
  const want = [];
  for (const [doc, types] of Object.entries(manifest.documentTypes ?? {}))
    for (const t of Object.keys(types)) want.push(`TYPES.${doc}.${t}`);
  for (const s of rec?.sheets ?? []) if (s.opts?.label) want.push(s.opts.label);
  for (const cfg of Object.values(rec?.settings ?? {})) {
    if (cfg.config === false) continue;
    for (const k of [cfg.name, cfg.hint]) if (k) want.push(k);
  }
  return want.filter((k) => !(k in lang));
}

function missingSheetTemplates(root) {
  const manifest = readJson(root, "system.json");
  const out = [];
  for (const t of Object.keys(manifest.documentTypes.Actor))
    if (!fs.existsSync(path.join(root, `templates/actor/actor-${t}-sheet.hbs`))) out.push(`actor-${t}`);
  for (const t of Object.keys(manifest.documentTypes.Item))
    if (!fs.existsSync(path.join(root, `templates/item/item-${t}-sheet.hbs`))) out.push(`item-${t}`);
  return out;
}

const undefinedRules = (rules, p = "rules") => {
  const bad = [];
  for (const [k, v] of Object.entries(rules ?? {})) {
    if (v === undefined) bad.push(`${p}.${k}`);
    else if (v && typeof v === "object" && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype
             && Object.values(v).some((x) => typeof x === "function" || x === undefined))
      bad.push(...undefinedRules(v, `${p}.${k}`));
  }
  return bad;
};

/* ------------------------------------------------------------- checks -- */

console.log(`boot_check: ${ROOT}\n`);
const manifest = readJson(ROOT, "system.json");

console.log("1. The entry module imports and registers its hooks");
const v13 = await boot(ROOT, { statusShape: "array", isGM: true, populated: false });
check(!v13.importError, "imports with no error", v13.importError?.message);
for (const h of ["init", "ready", "diceSoNiceReady"]) check((v13.hooks[h] ?? []).length > 0, `registers ${h}`);
for (const h of ["eq", "gt", "sign", "sub", "armorLocs"]) check(typeof v13.helpers[h] === "function", `Handlebars helper ${h}`);

console.log("\n2. init runs on both status-effect shapes (rule 7)");
check(!v13.initError, "init with CONFIG.statusEffects as an Array (V12/V13)", v13.initError?.message);
const v14 = await boot(ROOT, { statusShape: "object", isGM: true, populated: false });
check(!v14.initError, "init with CONFIG.statusEffects as a keyed object (V14)", v14.initError?.message);
const nStatus = globalThis.CONFIG.TBE?.STATUSES?.length ?? 0;
check(nStatus > 0 && Object.keys(globalThis.CONFIG.statusEffects).length === nStatus + 1,
  `V14: all ${nStatus} TBE statuses registered beside core's`, Object.keys(globalThis.CONFIG.statusEffects).length);

console.log("\n3. Every declared document type has a model, a schema and a sheet");
/* Re-run the Array boot so CONFIG is the V13 one for the rest. */
const rec = await boot(ROOT, { statusShape: "array", isGM: true, populated: false });
for (const doc of ["Actor", "Item"]) {
  const declared = Object.keys(manifest.documentTypes[doc]).sort();
  const modelled = Object.keys(globalThis.CONFIG[doc].dataModels ?? {}).sort();
  check(JSON.stringify(declared) === JSON.stringify(modelled), `${doc}: manifest types == CONFIG.${doc}.dataModels`, { declared, modelled });
  for (const t of modelled) {
    let err = null;
    try { globalThis.CONFIG[doc].dataModels[t].defineSchema(); } catch (e) { err = e.message; }
    check(!err, `${doc}.${t} schema builds`, err);
  }
  check(typeof globalThis.CONFIG[doc].documentClass === "function", `${doc} document class set`);
}
check(missingSheetTemplates(ROOT).length === 0, "a sheet template exists for every type", missingSheetTemplates(ROOT));
check(rec.sheets.length === 2 && rec.sheets.every((s) => s.opts?.makeDefault), "actor and item sheets registered as default");
check(/@initiativeEffective/.test(globalThis.CONFIG.Combat.initiative?.formula ?? ""), "initiative formula reads @initiativeEffective");

console.log("\n4. Every label Foundry will show exists in lang/en.json");
const missing = missingLabels(ROOT, rec);
check(missing.length === 0, "no raw i18n key reaches the screen", missing);
check(flatLang(ROOT)["TYPES.Item.enchantment"] !== undefined, "the Enchantment item type has a label");

console.log("\n5. Every preloaded template exists");
check(rec.templates.length > 0, `${rec.templates.length} templates preloaded`);
const absent = rec.templates.filter((p) => !fs.existsSync(sysPath(ROOT, p)));
check(absent.length === 0, "all preload paths resolve inside the system", absent);

console.log("\n6. The rules global a macro reads has no holes");
const holes = undefinedRules(globalThis.game.thebrokenempires?.rules);
check(!!globalThis.game.thebrokenempires?.rules, "game.thebrokenempires.rules exists");
check(holes.length === 0, "no member is undefined", holes);
check(globalThis.CONFIG.TBE && typeof globalThis.CONFIG.TBE.rankCap === "function", "CONFIG.TBE carries its runtime helpers");

console.log("\n7. First ready on a fresh world");
{
  const gm = await boot(ROOT, { statusShape: "array", isGM: true, populated: false });
  const err = await fireReady(gm);
  check(!err, "GM: ready runs with no error", err?.message);
  check(gm.sets.some(([k, v]) => k === `${SYS_ID}.worldSchemaVersion` && v === manifest.version),
    `GM: a fresh world is stamped ${manifest.version}`, gm.sets);
  check(gm.chats.length === 0, "GM: a fresh world gets no migration card", gm.chats.length);

  const pl = await boot(ROOT, { statusShape: "array", isGM: false, populated: false });
  const err2 = await fireReady(pl);
  check(!err2, "player: ready runs with no error", err2?.message);
  check(pl.sets.length === 0 && pl.chats.length === 0, "player: writes nothing", { sets: pl.sets, chats: pl.chats.length });
}

/* ---------------------------------------------------------- mutations -- */

console.log("\n8. Mutations: each must be caught");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tbe-boot-"));
const copy = (name) => {
  const dst = path.join(tmp, name);
  fs.cpSync(ROOT, dst, { recursive: true, filter: (s) => !s.includes(`${path.sep}packs`) });
  return dst;
};
try {
  {
    const m = copy("no-label");
    const lang = readJson(m, "lang/en.json");
    delete lang.TYPES.Item.enchantment;
    fs.writeFileSync(path.join(m, "lang/en.json"), JSON.stringify(lang));
    const r = await boot(m, { statusShape: "array", isGM: true, populated: false });
    check(missingLabels(m, r).includes("TYPES.Item.enchantment"), "a type label removed from en.json is reported");
  }
  {
    const m = copy("no-template");
    fs.rmSync(path.join(m, "templates/item/item-thread-sheet.hbs"));
    fs.rmSync(path.join(m, "templates/actor/parts/actor-magic.hbs"));
    const r = await boot(m, { statusShape: "array", isGM: true, populated: false });
    check(missingSheetTemplates(m).includes("item-thread"), "a missing sheet template is reported");
    check(r.templates.some((p) => !fs.existsSync(sysPath(m, p))), "a missing preloaded partial is reported");
  }
  {
    const m = copy("hole");
    const f = path.join(m, "module/the-broken-empires.mjs");
    const src = fs.readFileSync(f, "utf8");
    fs.writeFileSync(f, src.replace("face: resolution.face,", "face: resolution.faceRenamed,"));
    const r = await boot(m, { statusShape: "array", isGM: true, populated: false });
    check(!r.importError && undefinedRules(globalThis.game.thebrokenempires?.rules).includes("rules.face"),
      "a renamed rules export is reported as a hole");
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
