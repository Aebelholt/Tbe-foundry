/* Builds TBE-Solo-Installer.js from macros/ + words.json */
const fs = require("fs");
const path = require("path");

const lib = fs.readFileSync(path.join(__dirname, "macros/_lib.js"), "utf8");
const words = JSON.parse(fs.readFileSync(path.join(__dirname, "words.json"), "utf8"));

const randomEvents = [
  [[1, 10], "NEWS: Learn news of something. Someone tells you, or you find evidence of it."],
  [[11, 25], "WHO IS THIS?: A new NPC enters the adventure and gets involved in some way."],
  [[26, 40], "SUPPORTS A LIST ELEMENT: Roll the Empires List. The event helps that element."],
  [[41, 60], "UNDERMINES A LIST ELEMENT: Roll the Empires List. The event works against it."],
  [[61, 75], "GOOD FOR YOU: A positive development for the PC or their group."],
  [[76, 95], "BAD FOR YOU: A negative development for the PC or their group."],
  [[96, 100], "GOAL OPPORTUNITY: The event touches a PC goal, offering progress or a chance to resolve it."]
];

const subverted = [
  [[1, 50], "EXPECTED: The scene starts as you expected."],
  [[51, 63], "LESS: Starts with less than expected. Remove something from your expectations."],
  [[64, 76], "MORE: Starts with more than expected. Roll two Event Randomizer words and add them in."],
  [[77, 100], "UNEXPECTED: Something interrupts the start. Generate an Event; it replaces your expectation."]
];

const difficulty = [
  [[1, 5], "Simple - opposing skill 20 / Fixed Number 1"],
  [[6, 15], "Easy - opposing skill 35 / Fixed Number 1"],
  [[16, 55], "Medium - opposing skill 50 / Fixed Number 2"],
  [[56, 85], "Challenging - opposing skill 65 / Fixed Number 4"],
  [[86, 95], "Hard - opposing skill 80 / Fixed Number 6"],
  [[96, 99], "Severe - opposing skill 95 / Fixed Number 8"],
  [[100, 100], "Extreme - opposing skill 100+ / Fixed Number 10+"]
];

const wordRows = (obj) =>
  Object.keys(obj)
    .map(Number)
    .sort((a, b) => a - b)
    .map((k) => [[k, k], obj[k]]);

const empires = [];
for (let i = 0; i < 20; i++) empires.push([[i * 5 + 1, i * 5 + 5], "(empty slot - choose an element)"]);

const TABLES = [
  { name: "TBE: Random Events", rows: randomEvents },
  { name: "TBE: Event Randomizers I", rows: wordRows(words.p1) },
  { name: "TBE: Event Randomizers II", rows: wordRows(words.p2) },
  { name: "TBE: Subverted Expectations", rows: subverted },
  { name: "TBE: Opposing Difficulty", rows: difficulty },
  { name: "TBE: Empires List", rows: empires }
];

const DATA_BLOCK = "const TBE_DATA = " + JSON.stringify({ tables: TABLES }) + ";\n";

const names = JSON.parse(fs.readFileSync(path.join(__dirname, "names.json"), "utf8"));
/* The whole d100 NPC Traits table (Ch.19), all 50 rows. There used to be a
 * filter here dropping any row whose personality did not start with a capital
 * or whose agenda ran to nine words or more. It was hiding 29 mis-parsed rows:
 * TBE: NPC drew from 21 of the book's 50 while saying it rolled the table, and
 * the d100 coverage had holes. parse_npc_traits.py extracts and verifies the
 * table now (coverage, verbatim fields, and each row pinned from both ends),
 * so a bad row fails the build instead of being quietly discarded. */
const traits = JSON.parse(fs.readFileSync(path.join(__dirname, "npctraits.json"), "utf8"));
if (traits.length !== 50) throw new Error("npctraits.json should hold all 50 rows, found " + traits.length);
const NPC_DATA = "const TBE_NAMES = " + JSON.stringify(names) + ";\nconst TBE_TRAITS = " + JSON.stringify(traits) + ";\n";

/* Chargen tables (sizes, the 6 races, the 10 careers) and the 147 Talents,
 * both extracted from the rulebook and verified verbatim by chargen.py /
 * parse_talents.py. Baked into the macros that actually need them so the pack
 * keeps working with no companion data files to install. */
const chargen = JSON.parse(fs.readFileSync(path.join(__dirname, "data/chargen.json"), "utf8"));
const talents = JSON.parse(fs.readFileSync(path.join(__dirname, "data/talents.json"), "utf8"));
/* The stat-Talent ActiveEffects live in talent_docs.json (built by
 * build_talents.py, which owns the book-quoted mapping). Merge them onto the
 * catalogue the macros carry, so a Talent added in play gets the same effect
 * the compendium copy has. Without this the effects would exist only on the
 * pack and every macro-created Talent would stay inert. */
{
  const docs = JSON.parse(fs.readFileSync(path.join(__dirname, "data/talent_docs.json"), "utf8"));
  const byName = new Map(docs.items.filter((d) => d.effects).map((d) => [d.name, d.effects]));
  let merged = 0;
  for (const t of talents) {
    const eff = byName.get(t.name);
    if (eff) { t.effects = eff; merged++; }
  }
  if (merged !== byName.size) {
    throw new Error(`talent effect merge mismatch: ${merged} of ${byName.size} matched by name`);
  }
}
const CHARGEN_DATA = "const TBE_CHARGEN = " + JSON.stringify(chargen) + ";\n" +
  "const TBE_TALENTS = " + JSON.stringify(talents) + ";\n";

/* Step-1 concept roller tables. ORIGINAL CONTENT, not book-derived (see the
 * _provenance note in data/concepts.json). Underscore keys are the
 * provenance/format notes, stripped here so they don't ride along in every
 * built macro. Only the Wizard needs this block. */
const conceptsRaw = JSON.parse(fs.readFileSync(path.join(__dirname, "data/concepts.json"), "utf8"));
const concepts = Object.fromEntries(Object.entries(conceptsRaw).filter(([k]) => !k.startsWith("_")));
const CONCEPT_DATA = "const TBE_CONCEPTS = " + JSON.stringify(concepts) + ";\n";

/* The funnel tables: 50 trades (d100), 20 Bonds, 10 Scars. ORIGINAL CONTENT,
 * not book-derived (see the _provenance note in data/funnel.json) -- the book
 * never stats a tanner. Underscore keys are the provenance/format notes,
 * stripped here. funnel_check.mjs verifies the d100 coverage and that every
 * skill named in the table is a real catalogue skill. */
const funnelRaw = JSON.parse(fs.readFileSync(path.join(__dirname, "data/funnel.json"), "utf8"));
const funnelData = Object.fromEntries(Object.entries(funnelRaw).filter(([k]) => !k.startsWith("_")));
const FUNNEL_DATA = "const TBE_FUNNEL = " + JSON.stringify(funnelData) + ";\n" +
  "const TBE_TRADES = TBE_FUNNEL.trades;\n";

/* The three Life Events tables with their real mechanical options, extracted
 * and self-verified by parse_life_events.py. Replaces the name-only copy that
 * used to live in chargen.json, so the wizard can APPLY a rolled event rather
 * than telling the player to look it up. */
const lifeEvents = JSON.parse(fs.readFileSync(path.join(__dirname, "data/life_events.json"), "utf8"));
const LIFE_DATA = "const TBE_LIFE_EVENTS = " + JSON.stringify(lifeEvents) + ";\n";

/* Weapons, shields and armor with their prices, for the post-creation
 * shopping screen in TBE: Finish Character. Only the fields that screen
 * needs, so the macro does not carry the full journal HTML. */
const eqDocs = JSON.parse(fs.readFileSync(path.join(__dirname, "data/equipment_docs.json"), "utf8"));
const slim = (arr, kind) => arr.map((e) => ({
  name: e.name, kind, sp: Number(String((e.stats || {}).sp || "0").replace(/[^0-9]/g, "")) || 0,
  ap: e.ap ?? null, bulk: e.bulk ?? null, enc: e.enc ?? null, shb: e.shb ?? null,
  dmg: e.dmg ?? null, nl: !!e.nl, cl: e.cl ?? null, cs: e.cs ?? null, dis: e.dis ?? null,
  t: e.t ?? null, skillName: e.skillName || "", ranged: !!e.ranged,
  cat: (e.stats || {}).category || "", notes: (e.stats || {}).notes || "", desc: e.desc,
  /* p.109 step 9 gates the FREE starting armor on training, so the shopping
   * screen needs to know which types require it. */
  training: (e.stats || {}).training || "-"
}));
const EQUIP_DATA = "const TBE_EQUIPMENT = " + JSON.stringify({
  weapons: slim(eqDocs.weapons, "weapon"),
  shields: slim(eqDocs.shields, "shield"),
  armor: slim(eqDocs.armor, "armor")
}) + ";\n";

/* Ch.14 Weave Magic: the five Binds, ten Strands, twelve Convocations, the
 * full Shaping Cost and Spell Effect Cost tables, and the Fraying rules --
 * all extracted and self-verified by parse_magic.py (122 rows are quoted
 * verbatim from the book and each row's TC is asserted by its own quote).
 * The Wizard needs it to build a Spellweaver, Advancement to raise Strands
 * and roll Fraying, and Cast to price a spell. */
const magic = JSON.parse(fs.readFileSync(path.join(__dirname, "data/magic.json"), "utf8"));
const MAGIC_DATA = "const TBE_MAGIC = " + JSON.stringify(magic) + ";\n";

/* Ch.15 Divine Magic, extracted and self-verified by parse_divine.py: the
 * Piety procedure and its tables, and all 20 Domains with their 218 Lesser,
 * Middle and Greater miracles, each one round-tripped against the book and
 * checked to sit under its own level. */
const divine = JSON.parse(fs.readFileSync(path.join(__dirname, "data/divine.json"), "utf8"));
const DIVINE_DATA = "const TBE_DIVINE = " + JSON.stringify(divine) + ";\n";

const MACROS = [
  ["Ask the Weave", "ask-the-weave.js", "icons/svg/mystery-man.svg"],
  ["TBE: Skill Roll", "tbe-skill-roll.js", "icons/svg/d20-highlight.svg"],
  ["TBE: Opposed Roll", "tbe-opposed-roll.js", "icons/svg/sword.svg"],
  ["TBE: Haggle", "tbe-haggle.js", "icons/svg/coins.svg"],
  ["TBE: Subverted Scene", "tbe-subverted-scene.js", "icons/svg/book.svg"],
  ["TBE: Random Event", "tbe-random-event.js", "icons/svg/hazard.svg"],
  ["TBE: Empires List", "tbe-empires-list.js", "icons/svg/scroll.svg"],
  ["TBE: Build Character", "tbe-build-character.js", "icons/svg/statue.svg"],
  ["TBE: Create Character", "tbe-create-character.js", "icons/svg/statue.svg"],
  ["TBE: Character Wizard", "tbe-character-wizard.js", "icons/svg/statue.svg"],
  ["TBE: Finish Character", "tbe-finish-character.js", "icons/svg/anchor.svg"],
  ["TBE: Talents", "tbe-talents.js", "icons/svg/upgrade.svg"],
  ["TBE: Advancement", "tbe-advancement.js", "icons/svg/level-up.svg"],
  ["TBE: Attack", "tbe-attack.js", "icons/svg/sword.svg"],
  ["TBE: Clocks", "tbe-clocks.js", "icons/svg/clockwork.svg"],
  ["TBE: Quick Combat", "tbe-quick-combat.js", "icons/svg/combat.svg"],
  ["TBE: NPC", "tbe-npc.js", "icons/svg/mystery-man.svg", "npc"],
  ["TBE: Funnel", "tbe-funnel.js", "icons/svg/village.svg", "npc"],
  ["TBE: Funnel Roster", "tbe-funnel-roster.js", "icons/svg/blood.svg"],
  ["TBE: Counterspell", "tbe-counterspell.js", "icons/svg/explosion.svg"],
  ["TBE: Ritual", "tbe-ritual.js", "icons/svg/candle.svg"],
  ["TBE: Summoning", "tbe-summoning.js", "icons/svg/daze.svg"],
  ["TBE: Enchant", "tbe-enchant.js", "icons/svg/aura.svg"],
  ["TBE: Use Enchanted Item", "tbe-use-enchanted.js", "icons/svg/holy-shield.svg"],
  ["TBE: Miracle", "tbe-miracle.js", "icons/svg/angel.svg"],
  ["TBE: Pious Act", "tbe-pious-act.js", "icons/svg/pray.svg"],
  ["TBE: Wounds & Recovery", "tbe-wounds.js", "icons/svg/blood.svg"],
  ["TBE: Status Effects", "tbe-statuses.js", "icons/svg/aura.svg"],
  ["TBE: Supply", "tbe-supply.js", "icons/svg/chest.svg"],
  ["TBE: Journey Leg", "tbe-journey.js", "icons/svg/wing.svg"],
  ["TBE: Cast", "tbe-cast.js", "icons/svg/lightning.svg"],
  ["TBE: Extended Roll", "tbe-extended-roll.js", "icons/svg/clockwork.svg"],
  ["TBE: Social Encounter", "tbe-social-encounter.js", "icons/svg/angel.svg"],
  ["TBE: Chase", "tbe-chase.js", "icons/svg/wing.svg"],
  ["TBE: Loadout", "tbe-loadout.js", "icons/svg/shield.svg"],
  ["TBE: Export Sheets", "tbe-export-sheets.js", "icons/svg/book.svg"],
  ["TBE: Zone Hazards", "tbe-zone-hazards.js", "icons/svg/hazard.svg"],
  ["TBE: Sheet Exchange", "tbe-sheet-exchange.js", "icons/svg/down.svg"],
  ["TBE: Status", "tbe-status.js", "icons/svg/aura.svg"],
  ["TBE: Session Log", "tbe-log.js", "icons/svg/book.svg"],
  ["TBE: Solo Panel", "tbe-solo-panel.js", "icons/svg/dice-target.svg"],
  ["TBE: Install Tables", "tbe-install-tables.js", "icons/svg/chest.svg"],
  ["TBE: Update Macros", "tbe-update-macros.js", "icons/svg/upgrade.svg"]
];

/* Only the macros that actually roll the oracle tables carry the table data. */
const NEEDS_TABLES = new Set([
  "Ask the Weave", "TBE: Random Event", "TBE: Subverted Scene",
  "TBE: Empires List", "TBE: Journey Leg", "TBE: Install Tables",
  /* TBE: Chase draws "TBE: Event Randomizers I/II" for a Timer Die
   * complication via TBE.drawTable(), same as TBE: Extended Roll -- that
   * helper prefers a live installed RollTable (game.tables.getName) but
   * falls back to this bundled data if "TBE: Install Tables" hasn't been
   * run yet in the world. Included here so that fallback actually has
   * data to read instead of warning "no data for ...". */
  "TBE: Chase"
]);
const EMPTY_DATA = "const TBE_DATA = { tables: [] };\n";

/* Only chargen needs the race/career/talent tables. */
/* NPC and funnel generation need the Ability Score table (p.85-86) and the
 * Talent catalogue those scores grant from. */
const NEEDS_CHARGEN = new Set(["TBE: Build Character", "TBE: Character Wizard", "TBE: Talents",
  "TBE: Finish Character", "TBE: NPC", "TBE: Funnel"]);

/* Trades, Bonds and Scars. */
const NEEDS_FUNNEL = new Set(["TBE: NPC", "TBE: Funnel", "TBE: Funnel Roster"]);

/* Only the Wizard has a step-1 concept roller. */
const NEEDS_CONCEPTS = new Set(["TBE: Character Wizard"]);

/* The post-creation screen needs chargen tables, the Talent catalogue and
 * the priced equipment list. */
const NEEDS_EQUIP = new Set(["TBE: Finish Character"]);

/* Weave Magic data: chargen builds Spellweavers, Advancement raises Strands
 * and rolls Fraying, Cast prices the spell. Finish Character does not need it:
 * every magic decision it used to leave open is made in the Wizard's own
 * Magic step now. */
const NEEDS_MAGIC = new Set([
  "TBE: Character Wizard", "TBE: Advancement", "TBE: Cast",
  /* Both read the Ch.14 procedures parse_magic.py verified: the Ritual
   * Casting Results table, the Blood Magic marks, the Magic Circle and
   * Summoning numbers, the True Name rules, and the Weave Reaction table
   * a ritual rolls on twice over. */
  "TBE: Ritual", "TBE: Summoning", "TBE: Enchant", "TBE: Use Enchanted Item"
]);

/* Only the two Divine Magic macros carry the Ch.15 extract. */
const NEEDS_DIVINE = new Set(["TBE: Miracle", "TBE: Pious Act"]);

const macroPayload = MACROS.map(([name, file, img, extra]) => ({
  name,
  img,
  command: (NEEDS_TABLES.has(name) ? DATA_BLOCK : EMPTY_DATA) +
    (NEEDS_CHARGEN.has(name) ? CHARGEN_DATA : "") +
    (NEEDS_CONCEPTS.has(name) ? CONCEPT_DATA + LIFE_DATA : "") +
    (NEEDS_EQUIP.has(name) ? EQUIP_DATA : "") +
    (NEEDS_MAGIC.has(name) ? MAGIC_DATA : "") +
    (NEEDS_DIVINE.has(name) ? DIVINE_DATA : "") +
    (NEEDS_FUNNEL.has(name) ? FUNNEL_DATA : "") +
    (extra === "npc" ? NPC_DATA : "") + lib + "\n" +
    fs.readFileSync(path.join(__dirname, "macros", file), "utf8")
}));

const journalHtml = fs.readFileSync(path.join(__dirname, "journal.html"), "utf8");
const statusHtml = fs.readFileSync(path.join(__dirname, "status_reference.html"), "utf8");
/* Generated from data/magic.json by build_magic_journal.py, so the at-the-
 * table reference and the Cast macro price a spell from the same numbers. */
const magicHtml = fs.readFileSync(path.join(__dirname, "magic_reference.html"), "utf8");
/* Generated from data/core_rules.json by build_rules_audit.py: what each
 * macro computes, cross-referenced to the exact book quote and page it's
 * implementing, so a player can check the macros' math against their own
 * copy without taking it on faith. */
const rulesAuditHtml = fs.readFileSync(path.join(__dirname, "rules_audit.html"), "utf8");
const JOURNALS = [
  { name: "TBE Solo: Quick Reference", page: "How to play solo in Foundry", content: journalHtml },
  { name: "TBE: Status & Peril Reference", page: "Statuses, wounds, and perils", content: statusHtml },
  { name: "TBE: Weave Magic Reference", page: "Shaping costs, effects, Weave Reactions, Fraying", content: magicHtml },
  { name: "TBE: Rules Audit", page: "Every macro formula, quoted and page-cited", content: rulesAuditHtml }
];

const installer = `/*
 * THE BROKEN EMPIRES - SOLO PACK INSTALLER for Foundry VTT (v11-v14)
 * Paste into a new Script macro, execute once as GM. Safe to re-run.
 * Macros are installed first and carry their own table data, so they work
 * even if roll table creation fails on your build.
 */
const TBE_MACROS = ${JSON.stringify(macroPayload)};
const TBE_TABLES = ${JSON.stringify(TABLES)};
const TBE_JOURNALS = ${JSON.stringify(JOURNALS)};

(async () => {
  if (!game.user.isGM) return ui.notifications.error("Run the TBE installer as GM.");
  const report = { macros: 0, tables: 0, journal: 0, errors: [] };
  const fail = (what, err) => {
    report.errors.push(what + ": " + (err?.message ?? err));
    console.error("TBE | " + what, err);
  };

  console.log("TBE | installing on Foundry " + game.version + " | system " + game.system.id + " " + game.system.version);

  /* 1. Folders. Optional, so a folder failure never blocks the install. */
  const getFolder = async (name, type) => {
    try {
      const found = game.folders.find((f) => f.name === name && f.type === type);
      return found ?? (await Folder.create({ name, type }));
    } catch (err) {
      fail("folder " + type, err);
      return null;
    }
  };
  const macroFolder = await getFolder("TBE Solo", "Macro");
  const tableFolder = await getFolder("TBE Solo", "RollTable");
  const journalFolder = await getFolder("TBE Solo", "JournalEntry");

  /* 2. Macros first. Existing ones are updated in place so hotbar slots keep working. */
  for (const m of TBE_MACROS) {
    try {
      const old = game.macros.getName(m.name);
      if (old) {
        await old.update({ command: m.command, type: "script", scope: "global" });
        report.macros++;
        continue;
      }
      const base = { name: m.name, type: "script", scope: "global", command: m.command };
      if (macroFolder) base.folder = macroFolder.id;
      try {
        await Macro.create(Object.assign({ img: m.img }, base));
      } catch (imgErr) {
        console.warn("TBE | macro image rejected, retrying without it", imgErr);
        await Macro.create(base);
      }
      report.macros++;
    } catch (err) {
      fail("macro " + m.name, err);
    }
  }

  /* 3. Tables. Created empty, then filled with whichever result shape this build accepts. */
  const short = (s) => (s.length > 48 ? s.slice(0, 48) + "..." : s);
  const shapes = [
    (r) => ({ range: r[0], weight: 1, type: "text", name: short(r[1]), description: r[1] }),
    (r) => ({ range: r[0], weight: 1, name: short(r[1]), description: r[1] }),
    (r) => ({ range: r[0], weight: 1, type: 0, text: r[1] }),
    (r) => ({ range: r[0], weight: 1, text: r[1] })
  ];

  for (const t of TBE_TABLES) {
    try {
      const old = game.tables.getName(t.name);
      /* Never clobber an Empires List you have filled in. */
      if (old && t.name === "TBE: Empires List") { report.tables++; continue; }
      if (old) await old.delete();
      const base = { name: t.name, formula: "1d100", replacement: true, displayRoll: true };
      if (tableFolder) base.folder = tableFolder.id;
      const table = await RollTable.create(base);
      let filled = false;
      for (const shape of shapes) {
        try {
          const made = await table.createEmbeddedDocuments("TableResult", t.rows.map(shape));
          if (made && made.length) { filled = true; break; }
        } catch (shapeErr) {
          console.warn("TBE | result shape rejected for " + t.name, shapeErr);
        }
      }
      if (!filled) fail("table results " + t.name, "no accepted result shape");
      else report.tables++;
    } catch (err) {
      fail("table " + t.name, err);
    }
  }

  /* 4. Journals. */
  for (const j of TBE_JOURNALS) {
    try {
      const oldJournal = game.journal.getName(j.name);
      if (oldJournal) await oldJournal.delete();
      const base = {
        name: j.name,
        pages: [{ name: j.page, type: "text", text: { content: j.content, format: 1 } }]
      };
      if (journalFolder) base.folder = journalFolder.id;
      await JournalEntry.create(base);
      report.journal++;
    } catch (err) {
      fail("journal " + j.name, err);
    }
  }

  const summary =
    "TBE Solo: " + report.macros + "/" + TBE_MACROS.length + " macros, " +
    report.tables + "/" + TBE_TABLES.length + " tables, " + report.journal + "/" + TBE_JOURNALS.length + " journals.";
  console.log("TBE | " + summary, report);
  if (report.errors.length) {
    ui.notifications.error(summary + " " + report.errors.length + " problem(s), see console (F12).");
    console.error("TBE | problems:", report.errors);
  } else {
    ui.notifications.info(summary + " Done.");
  }
})();
`;

/* The character creation window (system/.../module/chargen/creator.mjs) runs
 * in the system, not as a macro, so it cannot read these blocks out of a
 * macro's text. Write the SAME objects the Wizard is baked with as a system
 * module, so the two windows provably see identical data. Loaded only when
 * the window opens (a dynamic import), not at world start. */
{
  const eqSlim = { weapons: slim(eqDocs.weapons, "weapon"), shields: slim(eqDocs.shields, "shield"), armor: slim(eqDocs.armor, "armor") };
  const tables = { chargen, talents, lifeEvents, concepts, equipment: eqSlim, magic, names };
  fs.writeFileSync(path.join(__dirname, "system/the-broken-empires/module/chargen/tables.mjs"),
    "/* GENERATED by build.js from the verified data files. Do not hand-edit:\n" +
    " * rebuild with `node build.js`. The same objects are baked into TBE: Character\n" +
    " * Wizard; creator_check.mjs asserts the two are identical. */\n" +
    "export const TABLES = " + JSON.stringify(tables) + ";\n");
}

fs.writeFileSync(path.join(__dirname, "data/solo_docs.json"),
  JSON.stringify({ macros: macroPayload, tables: TABLES, journals: JOURNALS }, null, 1));
fs.writeFileSync(path.join(__dirname, "TBE-Solo-Installer.js"), installer);
console.log("wrote TBE-Solo-Installer.js", (installer.length / 1024).toFixed(1) + " KB");
