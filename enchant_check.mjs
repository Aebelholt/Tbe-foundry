/* enchant_check.mjs — Enchantments, Weave Reagents and Alchemy (p.322-326):
 * the last two Weave Magic subsystems, and the reagent economy they share.
 *
 * Three layers, same as the other check scripts:
 *   1. the data against the book (parse_magic.py already verifies its own
 *      quotes; what is checked here is that the MACROS' constants match the
 *      data, since a macro cannot import and carries its own copy),
 *   2. the behaviour, driven through the real macro source in a stubbed
 *      Foundry with a controllable die, not a re-implementation of the rules,
 *   3. a mutation guard on each number an off-by-one would quietly change.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");
const MAGIC = JSON.parse(read("data/magic.json"));

let pass = 0, fail = 0;
const check = (cond, label, extra) => {
  if (cond) { pass++; console.log("  PASS  " + label); }
  else { fail++; console.log("  FAIL  " + label + (extra !== undefined ? "  <- " + JSON.stringify(extra) : "")); }
};
const section = (t) => console.log("\n" + t);

/* ------------------------------------------------------------------ harness */
let rollQueue = [];
const queueRolls = (...v) => { rollQueue = v.slice(); };

function harness(store, actor) {
  const said = [];
  global.foundry = { utils: { duplicate: (x) => JSON.parse(JSON.stringify(x)) } };
  global.CONFIG = { sounds: { dice: null } };
  global.Roll = class {
    constructor(f) { this.formula = String(f); }
    async evaluate() { this.total = rollQueue.length ? rollQueue.shift() : 1; return this; }
  };
  global.ui = { notifications: { warn: (m) => said.push("[warn] " + m), info: (m) => said.push("[info] " + m) } };
  global.canvas = { tokens: { controlled: actor ? [{ actor }] : [] } };
  global.ChatMessage = { getSpeaker: () => ({}), create: async (d) => { said.push(d.content); return d; } };
  global.game = {
    user: { character: null }, tables: { getName: () => null },
    settings: {
      get: (ns, key) => (store[key] !== undefined ? store[key] : {}),
      set: async (ns, key, val) => { store[key] = val; return val; }
    }
  };
  return said;
}

const LIB = read("macros/_lib.js");
const MAGIC_BLOCK = "const TBE_MAGIC = " + JSON.stringify(MAGIC) + ";\n";
const EMPTY_TABLES = "const TBE_DATA = { tables: [] };\n";

async function runOnce(macroSrc, answer, store, actor) {
  const said = harness(store, actor);
  const code = EMPTY_TABLES + MAGIC_BLOCK + LIB.replace(
    /TBE\.prompt = async function[\s\S]*?\n};/,
    "TBE.prompt = async function (t, c, o) { return " + JSON.stringify(answer) + "; };"
  ) + "\n" + macroSrc;
  await new Function("return (async()=>{" + code + "})()")().catch((e) => said.push("[throw] " + e.stack));
  return said.map((s) => String(s).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()).join(" || ");
}

const ENCHANT_SRC = read("macros/tbe-enchant.js");
const USE_SRC = read("macros/tbe-use-enchanted.js");
const CAST_SRC = read("macros/tbe-cast.js");
const TBE = new Function("Roll", "return (function(){\n" + LIB + "\nreturn TBE;\n})()")(
  class { constructor(f) { this.formula = String(f); } async evaluate() { this.total = 1; return this; } });

const trackersOf = (store, kind) => Object.values(store.encounters || {}).filter((t) => t.kind === kind);

/* A caster with a Bind, a Strand, Willpower, Arcana and room to be hurt. */
function makeCaster(over) {
  const a = {
    name: "Fionnah", type: "character",
    items: [
      { id: "b1", type: "skill", name: "Control", system: { group: "Bind", value: 70, expertise: 0 } },
      { id: "wp", type: "skill", name: "Willpower", system: { group: "Adventuring", value: 60, expertise: 0 } },
      { id: "ar", type: "skill", name: "Arcana", system: { group: "Lore", value: 65, expertise: 0 } },
      { id: "s1", type: "strand", name: "Spirit", system: { level: 6 } }
    ],
    flags: {},
    system: Object.assign({
      resolve: { value: 8, max: 8 }, fatigue: 0, fraying: 0, pattern: "spellweaver",
      trueName: "Aen-Fionnah", trueNameLanguage: "Dondalese",
      wounds: {}, deathThreshold: { value: 20, max: 20 }, toughness: 0
    }, over || {}),
    update: async function (d) {
      for (const [k, v] of Object.entries(d)) {
        const parts = k.split(".");
        let cur = a;
        for (let i = 0; i < parts.length - 1; i++) { cur[parts[i]] = cur[parts[i]] || {}; cur = cur[parts[i]]; }
        cur[parts[parts.length - 1]] = v;
      }
      return a;
    }
  };
  return a;
}

/* An enchanter with a Bind, a Strand, Arcana, Craft: Practical, and reagents. */
function makeEnchanter(over) {
  const a = makeCaster(over);
  a.items.push({ id: "cp", type: "skill", name: "Craft: Practical", system: { group: "Lore", value: 55 } });
  a.created = [];
  a.createEmbeddedDocuments = async function (type, docs) {
    for (const d of docs) {
      const item = JSON.parse(JSON.stringify(d));
      item.id = "new" + a.created.length;
      item.update = async function (u) {
        for (const [k, v] of Object.entries(u)) { const p = k.split("."); item[p[0]][p[1]] = v; }
        return item;
      };
      a.created.push(item);
      a.items.push(item);
    }
    return a.created;
  };
  return a;
}
function addReagents(a, strand, count) {
  const it = { id: "rg" + strand, type: "thread", name: strand + " Reagents",
    system: { attunement: strand, kind: "consumable", pool: count, reagent: true, expended: false } };
  it.update = async function (u) { for (const [k, v] of Object.entries(u)) { const p = k.split("."); it.system[p[1]] = v; } return it; };
  a.items.push(it);
  return it;
}

/* =====================================================================
 * 1. Constants against the verified extract
 * ===================================================================== */
section("Constants vs the verified Ch.14 extract");
{
  const dataTiers = MAGIC.enchantCosts.map((r) => [r.key, r.die, r.charges, r.fraying].join("|"));
  const libTiers = TBE.ENCHANT_COSTS.map((r) => [r.key, r.die, r.charges, r.fraying].join("|"));
  check(dataTiers.join(",") === libTiers.join(","),
    "the macro's Enchantment Costs table matches the book-verified one row for row", [dataTiers, libTiers]);
}
check(TBE.ENCHANT_ANYONE_FRAYING === MAGIC.enchantAnyone.fraying,
  "the anyone-can-use surcharge matches the book");
{
  const dataAids = MAGIC.alchemyAids.map((a) => [a.key, a.bind, a.craft, a.days].join("|"));
  const libAids = TBE.ALCHEMY_AIDS.map((a) => [a.key, a.bind, a.craft, a.days].join("|"));
  check(dataAids.join(",") === libAids.join(","), "the Alchemical Aid Table matches", [dataAids, libAids]);
}

section("Enchantment and alchemy arithmetic");
check(TBE.enchantFraying("single", false) === 0 && TBE.enchantFraying("d12", false) === 4,
  "a single-use enchantment is free of Fraying; a d12 costs 4");
check(TBE.enchantFraying("d6", true) === 2,
  "making it usable by anyone adds one point on top of the tier", TBE.enchantFraying("d6", true));
check(TBE.enchantFraying("single", true) === 1,
  "even the 0-Fraying tier pays that surcharge");
check(TBE.enchantRow("d10").charges === 15 && TBE.enchantRow("d10").die === "d10",
  "each tier can be bought as either a die or its charge pool");
check(TBE.reagentsFor(3) === 3, "reagents substitute for Fraying one for one");
check(TBE.potionReagents(1) === 1 && TBE.potionReagents(15) === 1 && TBE.potionReagents(16) === 2 && TBE.potionReagents(40) === 2,
  "a potion needs 1 reagent up to 15 TC and 2 from 16");
check(TBE.potionYield(2, 6) === 4 && TBE.potionYield(1, 0) === 1,
  "yield is 1d3 + 1 per 3 SLs", [TBE.potionYield(2, 6), TBE.potionYield(1, 0)]);
{
  const both = TBE.alchemyAids(["refined", "master", "formula"]);
  check(both.bind === 30 && both.craft === 10,
    "the Master laboratory replaces a Refined one rather than stacking with it", both);
  check(both.used.map((a) => a.key).indexOf("refined") === -1, "so the Refined lab drops out of the list");
  const cumulative = TBE.alchemyAids(["refined", "formula"]);
  check(cumulative.bind === 20, "aids that do not replace each other are cumulative", cumulative.bind);
  check(TBE.alchemyAids(["patience"]).days === 2, "Tempered Patience takes two days instead of one");
}

/* =====================================================================
 * 2. Behaviour through the real macro source
 * ===================================================================== */
section("TBE: Enchant — making an item");
{
  const store = {}, actor = makeEnchanter();
  // Bind 70 rolls 63 => success, ones die 3, Strand 6 => Mastery 9 vs TC 8: controlled.
  queueRolls(63);
  const out = await runOnce(ENCHANT_SRC, {
    mode: "enchant", name: "Cloak of the Unseen", spell: "Change Air: invisible, 1 hour", tc: "8",
    bindId: "b1", strandId: "s1", mod: "0", tier: "d8", shape: "die", word: ""
  }, store, actor);
  const made = actor.created[0];
  check(!!made && made.type === "enchantment", "an Item is created on the sheet, not a line of prose");
  check(made.system.kind === "die" && made.system.die === "d8", "with the Use Die it was given", made && made.system.kind);
  check(made.system.resistance === 63, "its fixed resistance is the Bind roll itself", made && made.system.resistance);
  check(actor.system.fraying === 2, "a d8 enchantment costs its maker 2 Fraying", actor.system.fraying);
  check(made.system.unstable === false && !/Weave Reaction/.test(out), "a controlled casting leaves it stable");
}
{
  const store = {}, actor = makeEnchanter();
  queueRolls(63);
  await runOnce(ENCHANT_SRC, {
    mode: "enchant", name: "Charged Rod", spell: "x", tc: "8", bindId: "b1", strandId: "s1", mod: "0",
    tier: "d10", shape: "charges", word: ""
  }, store, actor);
  const made = actor.created[0];
  check(made.system.kind === "charges" && made.system.charges === 15 && made.system.chargesMax === 15,
    "choosing charges instead gives the tier's pool, not a die", made && [made.system.kind, made.system.charges]);
  check(actor.system.fraying === 3, "and the same tier's Fraying either way", actor.system.fraying);
}
{
  const store = {}, actor = makeEnchanter();
  queueRolls(63);
  await runOnce(ENCHANT_SRC, {
    mode: "enchant", name: "Anyone's Amulet", spell: "x", tc: "8", bindId: "b1", strandId: "s1", mod: "0",
    tier: "d6", shape: "die", anyone: "on", word: "Ashkalen"
  }, store, actor);
  const made = actor.created[0];
  check(actor.system.fraying === 2, "d6 (1) plus the anyone-can-use surcharge (1)", actor.system.fraying);
  check(made.system.anyoneCanUse === true && made.system.activationWord === "Ashkalen",
    "the activation word is recorded, because it is how anyone else uses it");
}
{
  /* Uncontrolled: TC 30 against a Mastery of 9 leaves a Weave Reaction, and
     any Weave Reaction during enchanting makes the item unstable. */
  const store = {}, actor = makeEnchanter();
  queueRolls(63, 2);
  const out = await runOnce(ENCHANT_SRC, {
    mode: "enchant", name: "Flawed Ring", spell: "x", tc: "30", bindId: "b1", strandId: "s1", mod: "0",
    tier: "d8", shape: "die", word: ""
  }, store, actor);
  const made = actor.created[0];
  check(/Weave Reaction/.test(out) && made.system.unstable === true,
    "a Weave Reaction during enchanting leaves the flaw in the item's Pattern", out.slice(0, 300));
}
{
  const store = {}, actor = makeEnchanter();
  queueRolls(88); // 88 vs 70: doubles above the skill => critical failure
  const out = await runOnce(ENCHANT_SRC, {
    mode: "enchant", name: "Ruined Blade", spell: "x", tc: "8", bindId: "b1", strandId: "s1", mod: "0",
    tier: "d8", shape: "die", word: ""
  }, store, actor);
  check(!actor.created.length && /no longer suitable/.test(out),
    "a failed enchanting roll ruins the item and creates nothing", out.slice(0, 240));
  check(actor.system.fraying === 2, "a CRITICAL failure still accrues the Fraying", actor.system.fraying);
}
{
  const store = {}, actor = makeEnchanter();
  queueRolls(71); // 71 vs 70: a plain failure
  const out = await runOnce(ENCHANT_SRC, {
    mode: "enchant", name: "Wasted Blade", spell: "x", tc: "8", bindId: "b1", strandId: "s1", mod: "0",
    tier: "d8", shape: "die", word: ""
  }, store, actor);
  check(actor.system.fraying === 0, "a plain failure accrues none — only a critical one does", actor.system.fraying);
  check(/A new masterwork item must be crafted/.test(out), "and the vessel is gone either way");
}

section("TBE: Enchant — Weave Reagents in place of Fraying");
{
  const store = {}, actor = makeEnchanter();
  const stock = addReagents(actor, "Spirit", 5);
  queueRolls(63);
  const out = await runOnce(ENCHANT_SRC, {
    mode: "enchant", name: "Reagent Ring", spell: "x", tc: "8", bindId: "b1", strandId: "s1", mod: "0",
    tier: "d10", shape: "die", useReagents: "on", word: ""
  }, store, actor);
  check(actor.system.fraying === 0, "reagents spare the enchanter every point of Fraying", actor.system.fraying);
  check(stock.system.pool === 2, "three reagents are consumed for a 3-Fraying enchantment", stock.system.pool);
  check(/3 Weave Reagent\(s\) of Spirit consumed/.test(out), "and the card says so", out.slice(0, 260));
  check(actor.created[0].system.reagentsUsed === 3, "the item records what was spent on it");
}
{
  const store = {}, actor = makeEnchanter();
  addReagents(actor, "Spirit", 1);
  queueRolls(63);
  const out = await runOnce(ENCHANT_SRC, {
    mode: "enchant", name: "Short Ring", spell: "x", tc: "8", bindId: "b1", strandId: "s1", mod: "0",
    tier: "d12", shape: "die", useReagents: "on", word: ""
  }, store, actor);
  check(/Not enough Weave Reagents/.test(out) && !actor.created.length,
    "a shortfall stops the enchantment rather than quietly falling back to Fraying", out.slice(0, 200));
  check(actor.system.fraying === 0, "and costs nothing, since the substitution is declared before the roll");
}
{
  const store = {}, actor = makeEnchanter();
  addReagents(actor, "Fire", 9); // the wrong Strand entirely
  queueRolls(63);
  const out = await runOnce(ENCHANT_SRC, {
    mode: "enchant", name: "Wrong Strand", spell: "x", tc: "8", bindId: "b1", strandId: "s1", mod: "0",
    tier: "d8", shape: "die", useReagents: "on", word: ""
  }, store, actor);
  check(/Not enough Weave Reagents/.test(out),
    "a reagent only works for its own Strand", out.slice(0, 200));
}

section("TBE: Enchant — finding reagents (p.324)");
{
  const store = {}, actor = makeEnchanter();
  queueRolls(62); // Arcana 65: success, 6 SL (62 is neither doubles nor equal to the skill,
                  // either of which would be a critical) => 1 + 2 = 3 reagents
  const out = await runOnce(ENCHANT_SRC, {
    mode: "reagents", arcana: "65", foundStrand: "Earth"
  }, store, actor);
  check(/<b>3<\/b> reagent/.test(out.replace(/ /g, " ")) || /3 reagent\(s\) of Earth/.test(out),
    "one reagent, plus one per 3 SLs", out.slice(0, 220));
  const made = actor.created[0];
  check(made && made.system.reagent === true && made.system.pool === 3 && made.system.attunement === "Earth",
    "recorded on the sheet as a reagent of that Strand", made && made.system);
}
{
  const store = {}, actor = makeEnchanter();
  const stock = addReagents(actor, "Earth", 2);
  queueRolls(15); // success, 1 SL => 1 reagent
  await runOnce(ENCHANT_SRC, { mode: "reagents", arcana: "65", foundStrand: "Earth" }, store, actor);
  check(stock.system.pool === 3, "a second find tops up the existing stock instead of making a second pile", stock.system.pool);
}
{
  const store = {}, actor = makeEnchanter();
  queueRolls(90); // failure
  const out = await runOnce(ENCHANT_SRC, { mode: "reagents", arcana: "65", foundStrand: "Earth" }, store, actor);
  check(!actor.created.length && /Nothing usable here/.test(out), "a failed search finds nothing", out.slice(0, 200));
}

section("TBE: Enchant — brewing a batch (p.325)");
{
  const store = {}, actor = makeEnchanter();
  const stock = addReagents(actor, "Spirit", 4);
  // Bind roll 69: ones die 9 + Strand 6 = Mastery 15, exactly covering TC 15, so
  // the brew is controlled and no Weave Reaction eats a roll. Craft 45 rolls 41
  // (4 SL), 1d3 = 2, so the yield is 2 + 1 = 3 doses.
  queueRolls(69, 41, 2);
  const out = await runOnce(ENCHANT_SRC, {
    mode: "brew", name: "Fortified Flesh", spell: "Change Body: +3 Toughness", tc: "15",
    bindId: "b1", strandId: "s1", mod: "0", craft: "45"
  }, store, actor);
  const made = actor.created[0];
  check(stock.system.pool === 3, "a 15 TC potion consumes one reagent per batch", stock.system.pool);
  check(made && made.system.kind === "potion" && made.system.charges === 3,
    "yield is 1d3 (2) + 1 per 3 SLs (1) = 3 doses", made && made.system.charges);
  check(actor.system.fraying === 0, "alchemy accrues no Fraying", actor.system.fraying);
  check(made.system.resistance === 69, "the drinker's resistance is the original Bind roll");
}
{
  const store = {}, actor = makeEnchanter();
  const stock = addReagents(actor, "Spirit", 4);
  queueRolls(63, 41, 2);
  await runOnce(ENCHANT_SRC, {
    mode: "brew", name: "Strong Brew", spell: "x", tc: "16", bindId: "b1", strandId: "s1", mod: "0", craft: "45"
  }, store, actor);
  check(stock.system.pool === 2, "a 16 TC potion costs two reagents, not one", stock.system.pool);
}
{
  const store = {}, actor = makeEnchanter();
  addReagents(actor, "Spirit", 4);
  queueRolls(63, 41, 2);
  const out = await runOnce(ENCHANT_SRC, {
    mode: "brew", name: "Aided Brew", spell: "x", tc: "8", bindId: "b1", strandId: "s1", mod: "0", craft: "45",
    aid_master: "on", aid_formula: "on"
  }, store, actor);
  check(/\(100, \+30 from aids\)/.test(out), "the Master laboratory and Formula Notes add +30 to the Bind roll", out.slice(0, 300));
  check(/\(55, \+10 from the laboratory\)/.test(out), "and the Master lab also adds +10 to the yield roll", out.slice(0, 400));
}
{
  const store = {}, actor = makeEnchanter();
  addReagents(actor, "Spirit", 4);
  queueRolls(63, 3, 41, 2); // Bind ok but TC 30 leaves it uncontrolled -> Weave Reaction
  const out = await runOnce(ENCHANT_SRC, {
    mode: "brew", name: "Unstable Brew", spell: "x", tc: "30", bindId: "b1", strandId: "s1", mod: "0", craft: "45"
  }, store, actor);
  check(/The batch is <b>unstable<\/b>|batch is unstable/.test(out) && actor.created[0].system.unstable === true,
    "a Weave Reaction while brewing makes the batch unstable", out.slice(0, 340));
}
{
  const store = {}, actor = makeEnchanter();
  const stock = addReagents(actor, "Spirit", 4);
  queueRolls(71); // a plain failure on the Bind roll
  const out = await runOnce(ENCHANT_SRC, {
    mode: "brew", name: "Wasted Brew", spell: "x", tc: "8", bindId: "b1", strandId: "s1", mod: "0", craft: "45"
  }, store, actor);
  check(!actor.created.length && /all materials are wasted/.test(out),
    "a failed brew wastes everything and makes no potion", out.slice(-200));
  check(stock.system.pool === 3, "including the reagents, which were spent up front");
}
{
  const store = {}, actor = makeEnchanter();
  const out = await runOnce(ENCHANT_SRC, {
    mode: "brew", name: "No Reagents", spell: "x", tc: "8", bindId: "b1", strandId: "s1", mod: "0", craft: "45"
  }, store, actor);
  check(/Not enough Weave Reagents/.test(out), "with no reagents at all, nothing is brewed", out.slice(0, 200));
}

section("TBE: Use Enchanted Item (p.322-326)");
function withItem(sys) {
  const a = makeEnchanter();
  const it = { id: "e1", type: "enchantment", name: "Test item",
    system: Object.assign({ kind: "charges", die: "d8", charges: 3, chargesMax: 3, unstable: false,
      spent: false, resistance: 63, spell: "a stored spell", anyoneCanUse: true, activationWord: "",
      inertDays: 0 }, sys) };
  it.update = async function (u) { for (const [k, v] of Object.entries(u)) { const p = k.split("."); it.system[p[1]] = v; } return it; };
  a.items.push(it);
  return { actor: a, it };
}
{
  const { actor, it } = withItem({ kind: "charges", charges: 3 });
  const out = await runOnce(USE_SRC, { id: "e1", act: "use", days: "1", arcana: "65" }, {}, actor);
  check(it.system.charges === 2 && /2 charge\(s\) left/.test(out), "a charge is spent", it.system.charges);
  check(/resisted only by meeting or beating <b>63<\/b>|beating 63/.test(out), "and the card states the item's fixed resistance");
}
{
  const { actor, it } = withItem({ kind: "charges", charges: 1 });
  const out = await runOnce(USE_SRC, { id: "e1", act: "use", days: "1", arcana: "65" }, {}, actor);
  check(it.system.charges === 0 && it.system.spent === true && /non-magical now/.test(out),
    "spending the final charge makes the item non-magical", out.slice(-160));
}
{
  const { actor, it } = withItem({ kind: "die", die: "d8", charges: 0 });
  queueRolls(2, 5); // the Use Die comes up 2 -> inert; then 1d6 = 5 days
  const out = await runOnce(USE_SRC, { id: "e1", act: "use", days: "1", arcana: "65" }, {}, actor);
  check(it.system.inertDays === 5 && /inert for <b>5<\/b> day|inert for 5 day/.test(out),
    "a Use Die of 1-2 puts the item out for 1d6 days", [it.system.inertDays, out.slice(-200)]);
  const out2 = await runOnce(USE_SRC, { id: "e1", act: "use", days: "1", arcana: "65" }, {}, actor);
  check(/cannot be used: inert for another 5 day/.test(out2), "and it stays out until those days pass", out2.slice(0, 200));
  const out3 = await runOnce(USE_SRC, { id: "e1", act: "days", days: "5", arcana: "65" }, {}, actor);
  check(it.system.inertDays === 0 && /It wakes/.test(out3), "waiting them out wakes it", out3.slice(-140));
}
{
  const { actor, it } = withItem({ kind: "die", die: "d8", unstable: true, charges: 0 });
  queueRolls(4, 3); // 4 would be safe on a stable item; unstable goes inert on 1-4
  const out = await runOnce(USE_SRC, { id: "e1", act: "use", days: "1", arcana: "65" }, {}, actor);
  check(it.system.inertDays === 3 && /unstable: inert on 1-4/.test(out),
    "an unstable Use Die item goes inert on a 1-4, not a 1-2", [it.system.inertDays, out.slice(-220)]);
}
{
  const { actor, it } = withItem({ kind: "charges", charges: 5, unstable: true });
  queueRolls(1, 3); // d10 = 1 -> burns out, losing 1d4 = 3 more charges
  const out = await runOnce(USE_SRC, { id: "e1", act: "use", days: "1", arcana: "65" }, {}, actor);
  check(it.system.charges === 1 && /losing <b>3<\/b> more charge|losing 3 more charge/.test(out),
    "an unstable charged item burns 1d4 further charges on a 1-2", [it.system.charges, out.slice(-220)]);
}
{
  const { actor, it } = withItem({ kind: "single", charges: 1, unstable: true });
  queueRolls(2); // the BEFORE roll fails
  const out = await runOnce(USE_SRC, { id: "e1", act: "use", days: "1", arcana: "65" }, {}, actor);
  check(/unravels harmlessly/.test(out) && it.system.spent === true,
    "an unstable single-use item is checked BEFORE use, and can fail having done nothing", out.slice(-200));
  check(!/The spell takes effect/.test(out), "so the spell never takes effect at all");
}
{
  const { actor, it } = withItem({ kind: "potion", charges: 4, chargesMax: 4, unstable: true });
  queueRolls(1); // the batch collapses
  const out = await runOnce(USE_SRC, { id: "e1", act: "use", days: "1", arcana: "65" }, {}, actor);
  check(it.system.charges === 0 && it.system.spent === true && /including the one just taken/.test(out),
    "an unstable batch collapses, taking every remaining dose with it", out.slice(-220));
}
{
  const { actor, it } = withItem({ kind: "charges", charges: 3, anyoneCanUse: false });
  queueRolls(90); // a failed Arcana roll
  const out = await runOnce(USE_SRC, { id: "e1", act: "use", days: "1", arcana: "65" }, {}, actor);
  check(it.system.charges === 3 && /do not open to them this time/.test(out),
    "a weaver-only item needs a successful Arcana roll, and a failure spends nothing", out.slice(-200));
}
{
  const { actor, it } = withItem({ kind: "charges", charges: 3, anyoneCanUse: false });
  actor.system.pattern = "none";
  const out = await runOnce(USE_SRC, { id: "e1", act: "use", days: "1", arcana: "65" }, {}, actor);
  check(it.system.charges === 3 && /is not Patterned/.test(out),
    "and someone unPatterned cannot use it at all without an activation word", out.slice(0, 220));
}

/* =====================================================================
 * 3. Mutation guard
 * ===================================================================== */
section("Mutation guard (each of these must be caught)");
check(TBE.enchantFraying("d8", true) !== 2,
  "forgetting the anyone-can-use surcharge would be caught (d8 + anyone is 3, not 2)");
check(TBE.potionReagents(15) !== 2 && TBE.potionReagents(16) !== 1,
  "an off-by-one at the 15/16 TC boundary would be caught");
check(TBE.potionYield(2, 5) === 3, "5 SLs is one extra dose, not two — a rounding slip would be caught");
check(TBE.alchemyAids(["refined", "master"]).bind !== 30,
  "stacking the two laboratories would be caught", TBE.alchemyAids(["refined", "master"]).bind);
check(TBE.reagents({ items: [{ type: "thread", system: { attunement: "Fire", reagent: true, pool: 3 } }] }, "Spirit").length === 0,
  "reading a reagent of the wrong Strand as usable would be caught");
check(/!t\.reagent/.test(read("macros/tbe-cast.js")),
  "and reagents are kept out of ordinary castings, like grimoires");

console.log("\n" + pass + " passed, " + fail + " failed");
if (fail) process.exit(1);
