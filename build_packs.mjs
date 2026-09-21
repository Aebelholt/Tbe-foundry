import fsSync from "node:fs";
/* Read from the manifest rather than typed here. This constant sat at 0.27.0
 * through the whole of 0.28.0, stamping every pack document with a system
 * version two releases old, because bumping it was a second place to remember. */
const SYSTEM_VERSION = JSON.parse(
  fsSync.readFileSync("system/the-broken-empires/system.json", "utf8")).version;
/*
 * Build the system's compendium packs as Foundry LevelDB databases.
 *
 * Every other detailed system (Rolemaster, WFRP4e, HackMaster, HarnMaster)
 * ships its content as packs inside the system rather than as installer macros
 * that write into the world database. Packs are browsable, drag-droppable,
 * versioned with the system, and do not bloat the world.
 *
 * Document ids are derived deterministically from the document's name and type,
 * so rebuilding the packs keeps the same ids and anything that referenced one
 * (a compendium link in a journal, an actor's granted talent) still resolves.
 */
import { ClassicLevel } from "classic-level";
import { createHash } from "node:crypto";
import { readFileSync, rmSync, mkdirSync } from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "system/the-broken-empires/packs");
const ID_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/** A stable 16-character Foundry id derived from a seed string. */
function idFor(seed) {
  const h = createHash("sha256").update(seed).digest();
  let out = "";
  for (let i = 0; i < 16; i++) out += ID_CHARS[h[i] % ID_CHARS.length];
  return out;
}

const STATS = () => ({
  systemId: "the-broken-empires", systemVersion: SYSTEM_VERSION,
  coreVersion: "13.331", createdTime: 0, modifiedTime: 0, lastModifiedBy: null
});

/** Collection prefix Foundry uses in the LevelDB key for each document type. */
const COLLECTION = {
  Item: "items", Actor: "actors", Macro: "macros",
  RollTable: "tables", JournalEntry: "journal"
};

const PACK_COUNTS = {};
async function writePack(name, type, docs) {
  PACK_COUNTS[name] = docs.length;          // top-level documents, not embedded
  const dir = path.join(ROOT, name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const db = new ClassicLevel(dir, { keyEncoding: "utf8", valueEncoding: "json" });
  await db.open();
  const batch = db.batch();
  const col = COLLECTION[type];
  let embedded = 0;

  for (const doc of docs) {
    // Embedded collections live under their own keys, not inline on the parent.
    const items = doc.items ?? null;
    const results = doc.results ?? null;
    const pages = doc.pages ?? null;

    // Foundry's real compendium loader does NOT discover embedded documents by
    // scanning the database for matching keys. It reads an id manifest off the
    // PARENT record (Actor.items = ["itemId1", "itemId2", ...]) and fetches each
    // child by that id. Deleting the field entirely (as this used to do) leaves
    // the parent with no manifest, so Foundry sees zero items even though the
    // embedded records are sitting right there under their own keys, orphaned.
    // This mirrors exactly what @foundryvtt/foundryvtt-cli's compileClassicLevel
    // does: clone the doc, then replace each embedded collection with an array
    // of its children's ids.
    if (items) doc.items = items.map((c) => c._id); else if ("items" in doc) doc.items = [];
    if (results) doc.results = results.map((c) => c._id); else if ("results" in doc) doc.results = [];
    if (pages) doc.pages = pages.map((c) => c._id); else if ("pages" in doc) doc.pages = [];

    batch.put(`!${col}!${doc._id}`, doc);

    for (const [field, list] of [["items", items], ["results", results], ["pages", pages]]) {
      if (!list) continue;
      for (const child of list) {
        batch.put(`!${col}.${field}!${doc._id}.${child._id}`, child);
        embedded++;
      }
    }
  }
  await batch.write();
  /* Force compaction so the data leaves the write-ahead log and lands in .ldb
     files. Without this a pack ships with its contents sitting in a .log --
     tbe-journals was 116 KB of live data in one -- which means the "release
     hygiene" step below cannot tell a disposable log from the database itself.
     After compacting, every .log is 0 bytes and provably disposable. */
  await db.compactRange(String.fromCharCode(0), String.fromCharCode(0xffff));
  await db.close();
  console.log(`  ${name.padEnd(14)} ${String(docs.length).padStart(4)} ${type}` +
              (embedded ? ` (+${embedded} embedded)` : ""));
  return docs.length;
}

const read = (f) => JSON.parse(readFileSync(path.join("data", f), "utf8"));
console.log("building compendium packs:");

/* ---- Talents ------------------------------------------------------------ */
const talentDocs = read("talent_docs.json");
await writePack("tbe-talents", "Item", talentDocs.items.map((t, i) => ({
  _id: idFor("talent:" + t.name), name: t.name, type: "talent",
  img: "icons/svg/upgrade.svg", sort: (i + 1) * 1000,
  system: {
    category: t.category, requirements: t.requires, ranks: 1,
    maxRanks: t.rank, specialization: "", sub: t.sub, description: t.desc
  },
  /* Stat Talents (Tough, Inner Strength, Not Today Death, ...) carry a
   * transfer:true ActiveEffect so the number they promise actually moves
   * when the Item is on an actor, and moves back when it is removed. */
  effects: (t.effects || []).map((e, n) => Object.assign({}, e, {
    _id: idFor("talenteffect:" + t.name + ":" + n), _stats: STATS()
  })),
  folder: null, ownership: { default: 0 }, flags: {}, _stats: STATS()
})));

/* ---- Equipment ---------------------------------------------------------- */
const eq = read("equipment_docs.json");
const equipDocs = [...eq.weapons, ...eq.shields, ...eq.armor].map((e, i) => {
  const system = { description: e.desc };
  if (e.kind === "weapon") Object.assign(system, {
    dmg: e.dmg, nl: !!e.nl, cl: e.cl, cs: e.cs, dis: e.dis, t: e.t,
    skillName: e.skillName || "", ranged: !!e.ranged, enc: e.enc || 0
  });
  else if (e.kind === "shield") { system.ap = e.ap; system.enc = e.enc || 0; system.shb = e.shb ?? null; }
  // Armor's `locations` is a per-hit-location BooleanField set (head/body/rArm/
  // lArm/rLeg/lLeg), all false by default -- left unset here so the DataModel's
  // own defaults apply; the player checks a location when they equip a piece,
  // since one piece protects only the location(s) checked on it (p.140).
  else { system.ap = e.ap; system.bulk = e.bulk || 0; }
  return {
    _id: idFor("equip:" + e.kind + ":" + e.name), name: e.name, type: e.kind,
    img: e.kind === "weapon" ? "icons/svg/sword.svg" : "icons/svg/shield.svg",
    sort: (i + 1) * 1000, system, effects: [], folder: null,
    ownership: { default: 0 }, flags: { tbe: e.stats }, _stats: STATS()
  };
});
await writePack("tbe-equipment", "Item", equipDocs);

/* ---- Bestiary ----------------------------------------------------------- */
const LOC_MAP = { "Body": "body", "R Arm": "rArm", "L Arm": "lArm", "R Leg": "rLeg", "L Leg": "lLeg", "Head": "head" };
const LOCS = ["body", "rArm", "lArm", "rLeg", "lLeg", "head"];
const TIERS = ["Simple", "Easy", "Medium", "Challenging", "Hard", "Severe", "Extreme"];

// The Ch.18 Size ladder has no explicit feet/grid-square table in the book, so
// this is an adopted convention (same shape most VTT systems use for D&D-style
// ladders): below Medium, keep a 1x1 footprint and shrink the token image via
// texture.scale; Medium and up, grow the grid footprint one step per Size step
// and hold scale at 1. Flagged here and in the changelog as a convention, not a
// verbatim rule, so a GM can override any single creature's Prototype Token.
const TOKEN_SIZE = {
  Minute: { grid: 1, scale: 0.2 }, Diminutive: { grid: 1, scale: 0.3 },
  Tiny: { grid: 1, scale: 0.5 }, Little: { grid: 1, scale: 0.7 },
  Small: { grid: 1, scale: 0.85 }, Medium: { grid: 1, scale: 1 },
  Large: { grid: 2, scale: 1 }, Huge: { grid: 3, scale: 1 },
  Massive: { grid: 4, scale: 1 }, Gargantuan: { grid: 5, scale: 1 },
  Colossal: { grid: 6, scale: 1 }
};
/* The skill catalogue has one owner, TBE.SKILL_GROUPS in macros/_lib.js. The
 * packs load the real library rather than copying the table, because the copy
 * is how this went wrong: every creature skill was stamped "Adventuring", so a
 * Dragon's Dodge sat under Adventuring and was not a fighting skill. */
const LIBTBE = new Function("canvas", "game", "foundry", "ui", "CONFIG",
  readFileSync("macros/_lib.js", "utf8") + "\n;return TBE;")(
  { tokens: { controlled: [] } }, { user: { character: null } },
  { utils: { duplicate: (o) => JSON.parse(JSON.stringify(o)) } },
  { notifications: { warn() {}, error() {}, info() {} } }, undefined);

const unclassified = [];
const beasts = read("bestiary_docs.json").map((c, i) => {
  const dt = Number(c.dt) || 10;
  const armour = LOCS.reduce((o, l) => { o[l] = { natural: 0, worn: 0 }; return o; }, {});
  for (const a of (c.flags.armour || [])) {
    const k = LOC_MAP[a.loc];
    if (k) armour[k] = { natural: Number(a.natural) || 0, worn: Number(a.worn) || 0 };
  }
  const aid = idFor("beast:" + c.name);
  const items = [];
  /* Expertise goes in system.expertise, where resolve() reads it. It used to
   * be glued onto the name ("Might Ex4"), which the roll never saw, and which
   * made the picker offer both "Might Ex4" at 90 and an untrained "Might" at
   * 20, because to the catalogue they were two different skills. */
  const mkSkill = (n, v, ex, isAttack) => {
    const group = LIBTBE.creatureSkillGroup(n, isAttack);
    if (!group) unclassified.push(c.name + ": " + n);
    return {
      _id: idFor("beast:" + c.name + ":skill:" + n), name: n, type: "skill",
      img: "icons/svg/book.svg", sort: (items.length + 1) * 1000,
      system: { group: group || "Adventuring", value: Number(v) || 0, expertise: Number(ex) || 0,
        fighting: group === "Combat", savvy: false, description: "" },
      effects: [], folder: null, ownership: { default: 0 }, flags: {}, _stats: STATS()
    };
  };
  for (const s of c.skills) items.push(mkSkill(s.name, s.value, s.ex, !!s.attack));
  for (const a of c.attacks) if (a.value !== null) items.push(mkSkill(a.name, a.value, a.ex, true));
  for (const a of c.attacks) items.push({
    _id: idFor("beast:" + c.name + ":weapon:" + a.name), name: a.name, type: "weapon",
    img: "icons/svg/sword.svg", sort: (items.length + 1) * 1000,
    system: {
      description: "<p>" + a.text + "</p>", dmg: Number(a.damage) || 0, nl: false,
      cl: a.cl, cs: a.cs, dis: a.dis, t: a.t, skillName: a.name, ranged: !!a.ranged || !!a.thrown
    },
    effects: [], folder: null, ownership: { default: 0 }, flags: {}, _stats: STATS()
  });
  return {
    _id: aid, name: c.name, type: "creature", img: "icons/svg/mystery-man.svg",
    sort: (i + 1) * 1000,
    system: {
      deathThreshold: { value: dt, max: dt }, resolve: { value: 0, max: 0 },
      toughness: Number(c.flags.toughness) || 0, fatigue: 0, lethalityPenalty: 0, lethalityBonus: 0,
      shock: false, size: c.size || "Medium", ferocity: c.ferocity || "", move: c.move || "",
      difficulty: TIERS.includes(c.difficulty) ? c.difficulty : "Medium",
      initiative: c.init || "", armour, biography: c.bio,
      wounds: LOCS.reduce((o, l) => { o[l] = { wp: 0, imp: 0, inf: false, septic: false, rb: null }; return o; }, {}),
      supply: { gear: 8, ammo: 8, medical: 8, rations: 8 }
    },
    items,
    prototypeToken: (() => {
      const ts = TOKEN_SIZE[c.size] || TOKEN_SIZE.Medium;
      return {
        name: c.name, displayName: 20, actorLink: false,
        width: ts.grid, height: ts.grid, texture: { scaleX: ts.scale, scaleY: ts.scale },
        disposition: -1,
        bar1: { attribute: "deathThreshold" }, bar2: { attribute: "resolve" }
      };
    })(),
    effects: [], folder: null, ownership: { default: 0 },
    flags: { tbe: c.flags }, _stats: STATS()
  };
});
if (unclassified.length) {
  throw new Error("bestiary skills with no known group (add them to TBE.SKILL_GROUPS " +
    "or fix the extractor, do not default them): " + unclassified.join("; "));
}
await writePack("tbe-bestiary", "Actor", beasts);

/* ---- Macros, tables, journals ------------------------------------------- */
const solo = read("solo_docs.json");
await writePack("tbe-macros", "Macro", solo.macros.map((m, i) => ({
  _id: idFor("macro:" + m.name), name: m.name, type: "script",
  img: m.img, scope: "global", command: m.command, sort: (i + 1) * 1000,
  author: null, folder: null, ownership: { default: 0 }, flags: {}, _stats: STATS()
})));

await writePack("tbe-tables", "RollTable", solo.tables.map((t, i) => ({
  _id: idFor("table:" + t.name), name: t.name, img: "icons/svg/d20-highlight.svg",
  description: "", formula: "1d100", replacement: true, displayRoll: true,
  sort: (i + 1) * 1000,
  results: t.rows.map((r, n) => ({
    _id: idFor("table:" + t.name + ":" + n), type: "text",
    name: r[1].length > 48 ? r[1].slice(0, 48) + "..." : r[1],
    description: r[1], text: r[1], img: null,
    weight: 1, range: r[0], drawn: false, documentUuid: null,
    flags: {}, _stats: STATS()
  })),
  folder: null, ownership: { default: 0 }, flags: {}, _stats: STATS()
})));

const journals = [
  ...solo.journals.map((j) => ({ name: j.name, page: j.page, content: j.content })),
  { name: "TBE Talent Reference", page: "Talents by category", content: talentDocs.journal },
  { name: "TBE Equipment Reference", page: "Weapons, shields, armor", content: eq.journal }
];
await writePack("tbe-journals", "JournalEntry", journals.map((j, i) => ({
  _id: idFor("journal:" + j.name), name: j.name, sort: (i + 1) * 1000,
  pages: [{
    _id: idFor("journal:" + j.name + ":page"), name: j.page, type: "text",
    title: { show: true, level: 1 }, sort: 1000,
    text: { format: 1, content: j.content, markdown: "" },
    image: {}, video: { controls: true, volume: 0.5 }, src: null,
    system: {}, ownership: { default: -1 }, flags: {}, _stats: STATS()
  }],
  categories: [], folder: null, ownership: { default: 0 }, flags: {}, _stats: STATS()
})));

/* ---------------------------------------------------------------------------
 * Release hygiene, run as part of the build rather than remembered by hand.
 *
 * LevelDB leaves its working files behind after a write -- LOCK, LOG, LOG.old,
 * and the odd orphaned .log. They are runtime state of the database that built
 * the pack, not part of the pack, and v0.28.0 shipped eighteen of them because
 * the zip was taken straight from the working directory. Foundry does not need
 * them and a LOCK in particular is a file describing a process that no longer
 * exists on a machine the player has never used.
 *
 * Cleaned here, at the end of the build that creates them, so the working tree
 * and the release are the same thing and there is nothing to forget.
 * ------------------------------------------------------------------------- */
{
  const packRoot = "system/the-broken-empires/packs";
  let removed = 0, kept = [];
  for (const pack of fsSync.readdirSync(packRoot, { withFileTypes: true })) {
    if (!pack.isDirectory()) continue;
    const dir = `${packRoot}/${pack.name}`;
    for (const f of fsSync.readdirSync(dir)) {
      const full = `${dir}/${f}`;
      // LOCK/LOG/LOG.old are never database content: a lock on a dead process
      // and two text logs. Always disposable.
      if (/^(LOCK|LOG|LOG\.old)$/.test(f)) { fsSync.unlinkSync(full); removed++; continue; }
      // A .log IS the write-ahead log and can hold live records. Only remove it
      // when compaction has emptied it. Never guess -- check the size.
      if (/^\d+\.log$/.test(f)) {
        if (fsSync.statSync(full).size === 0) { fsSync.unlinkSync(full); removed++; }
        else kept.push(`${pack.name}/${f} (${fsSync.statSync(full).size} bytes)`);
      }
    }
  }
  console.log(`release hygiene: removed ${removed} disposable LevelDB file(s)`);
  if (kept.length) console.log(`  kept (non-empty write-ahead logs): ${kept.join(", ")}`);

  /* Validate the minimal representation rather than assuming it. Every pack is
     reopened after the cleanup and its documents counted; a mismatch against
     what was written means the strip took something the database needed, and
     the build fails instead of shipping an unreadable pack. */
  for (const [name, expected] of Object.entries(PACK_COUNTS)) {
    const db = new ClassicLevel(`${packRoot}/${name}`, { keyEncoding: "utf8", valueEncoding: "json" });
    await db.open();
    let top = 0;
    for await (const k of db.keys()) if ((k.match(/!/g) || []).length === 2 && !k.includes(".")) top++;
    await db.close();
    if (top !== expected) {
      throw new Error(`pack ${name} holds ${top} top-level documents after cleanup, expected ${expected}`);
    }
  }
  // Reopening recreated LOCK/LOG; take them back out.
  for (const pack of fsSync.readdirSync(packRoot, { withFileTypes: true })) {
    if (!pack.isDirectory()) continue;
    for (const f of fsSync.readdirSync(`${packRoot}/${pack.name}`)) {
      if (/^(LOCK|LOG|LOG\.old)$/.test(f)) fsSync.unlinkSync(`${packRoot}/${pack.name}/${f}`);
    }
  }
  // The verify reopen recreates LOCK/LOG and a fresh empty write-ahead log.
  // Take the empty ones back out now that nothing else will open these.
  for (const pack of fsSync.readdirSync(packRoot, { withFileTypes: true })) {
    if (!pack.isDirectory()) continue;
    for (const f of fsSync.readdirSync(`${packRoot}/${pack.name}`)) {
      const full = `${packRoot}/${pack.name}/${f}`;
      if (/^\d+\.log$/.test(f) && fsSync.statSync(full).size === 0) fsSync.unlinkSync(full);
    }
  }
  console.log(`release hygiene: all ${Object.keys(PACK_COUNTS).length} packs reopened and verified after cleanup`);
}

/* ---------------------------------------------------------------------------
 * Every count the README states is derived from the packs just written.
 *
 * v0.29.0 fixed the macro count by generating it and left the Talent count
 * hand-typed two lines below, so the README shipped saying 149 Talents while
 * the catalogue held 150 and the changelog said so. Fixing one instance of a
 * class of bug and leaving its siblings is how the class survives. So: all of
 * them, from one source, and audit_check.mjs fails the build if any number in
 * that table disagrees with the pack it describes.
 * ------------------------------------------------------------------------- */
{
  const readmePath = "system/the-broken-empires/README.md";
  let text = fsSync.readFileSync(readmePath, "utf8");
  const before = text;
  const subs = [
    [/the \d+ play macros/g,          `the ${PACK_COUNTS["tbe-macros"]} play macros`],
    [/all \d+ Chapter 4 Talents/g,    `all ${PACK_COUNTS["tbe-talents"]} Chapter 4 Talents`],
    [/\(\d+ Talents\)/g,              `(${PACK_COUNTS["tbe-talents"]} Talents)`],
    [/the \d+ equipment entries/g,    `the ${PACK_COUNTS["tbe-equipment"]} equipment entries`],
    [/the \d+ solo oracle tables/g,   `the ${PACK_COUNTS["tbe-tables"]} solo oracle tables`]
  ];
  for (const [re, to] of subs) text = text.replace(re, to);
  if (text !== before) {
    fsSync.writeFileSync(readmePath, text);
    console.log("README counts regenerated from the packs");
  } else {
    console.log("README counts already match the packs");
  }
}

console.log("packs written to system/the-broken-empires/packs/");
