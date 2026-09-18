/* ritual_check.mjs — the Ch.14 procedures batch: Rituals (with Magic Circles,
 * assistance, grimoires and Blood Magic), Pacts, Summoning, and True Names.
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

const RITUAL_SRC = read("macros/tbe-ritual.js");
const SUMMON_SRC = read("macros/tbe-summoning.js");
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

/* =====================================================================
 * 1. The macros' constants against the verified data
 * ===================================================================== */
section("Constants vs the verified Ch.14 extract");
check(TBE.BLOOD_MAX === MAGIC.ritual.bloodMax.n,
  "TBE.BLOOD_MAX matches the book's Blood Magic cap", [TBE.BLOOD_MAX, MAGIC.ritual.bloodMax.n]);
check(TBE.TRUE_NAME_SUMMON_PENALTY === MAGIC.trueNames.summonPenalty.n,
  "the True Name summoning penalty matches the book", [TBE.TRUE_NAME_SUMMON_PENALTY, MAGIC.trueNames.summonPenalty.n]);
check(MAGIC.ritual.weaveReactionBonus.n === 5 && /\+ 5 for the ritual itself|short \+ t\.concentrationPenalty \+ 5/.test(RITUAL_SRC),
  "the ritual's own +5 to the Weave Reaction is applied where the book puts it");
check(MAGIC.ritualResults.length === 5 && MAGIC.bloodMarks.length === 10,
  "five Ritual Casting Results rows and a full d10 of Blood Magic marks reached the data");

section("Ritual arithmetic (p.315-317)");
check(TBE.ritualTime(20, false).hours === 20 && TBE.ritualTime(20, false).checkpoints === 3,
  "one hour per TC, and concentration every eight hours or part thereof (20h -> 3 checks)", TBE.ritualTime(20, false));
check(TBE.ritualTime(20, true).hours === 10 && TBE.ritualTime(20, true).rushBonus === 10,
  "rushing halves the hours and costs +10 on any Weave Reaction", TBE.ritualTime(20, true));
check(TBE.ritualTime(21, true).hours === 11, "the rushed half rounds UP, as the book says", TBE.ritualTime(21, true));
check(TBE.ritualTime(8, false).checkpoints === 1 && TBE.ritualTime(9, false).checkpoints === 2,
  "nine hours is two checkpoints, not one — 'or portion thereof'");
check(TBE.assistCap(5) === 3 && TBE.assistCap(6) === 3,
  "the assistant cap is half the caster's Strand, rounded up", [TBE.assistCap(5), TBE.assistCap(6)]);
check(TBE.assistMastery(5) === 3 && TBE.assistMastery(4) === 2,
  "each assistant adds half their own Strand, rounded up");
check(TBE.bloodMastery(9) === 9 && TBE.bloodMastery(30) === 20,
  "Blood Magic gives 1 Mastery per Wound Point, capped at 20");
check(TBE.bloodMarkChance(3, false) === 15 && TBE.bloodMarkChance(3, true) === 100,
  "5% per Wound Point, or a certainty if the victim is killed");
check(TBE.circleReduction(5) === 2 && TBE.circleReduction(1) === 0,
  "a magic circle takes 1 off the cost per 2 SLs on its Arcana roll");
check(TBE.circleMaterialBonus(1000) === 0 && TBE.circleMaterialBonus(1500) === 10 && TBE.circleMaterialBonus(2500) === 30 &&
  TBE.circleMaterialBonus(9000) === 30,
  "circle materials: +10 per extra 500 sp, capped at +30");

/* =====================================================================
 * 2. Behaviour, through the real macro source
 * ===================================================================== */
section("TBE: Ritual — beginning one");
{
  const store = {}, actor = makeCaster();
  const out = await runOnce(RITUAL_SRC, {
    mode: "ritual", tracker: "", name: "Forever Sleep", tc: "20", bindId: "b1", strandId: "s1",
    components: "4", assistants: "Bram, 5\nElsbeth, 4", circleSls: "0", bloodWp: "0"
  }, store, actor);
  const t = trackersOf(store, "ritual")[0];
  check(!!t && t.hours === 20 && t.checkpoints === 3, "a TC 20 ritual is 20 hours and 3 concentration rolls", t && [t.hours, t.checkpoints]);
  check(t.masteryBanked === 4 + 3 + 2, "components plus each assistant's half-Strand is banked up front", t && t.masteryBanked);
  check(/Mastery banked so far: 9/.test(out), "and the card says so", out.slice(0, 200));
}
{
  const store = {}, actor = makeCaster();
  await runOnce(RITUAL_SRC, {
    mode: "ritual", tracker: "", name: "Circled", tc: "20", bindId: "b1", strandId: "s1",
    components: "0", assistants: "", circleSls: "5", bloodWp: "0"
  }, store, actor);
  const t = trackersOf(store, "ritual")[0];
  check(t.tc === 18 && t.tcBefore === 20, "a circle with 5 SLs takes 2 off the Total Cost", [t.tc, t.tcBefore]);
  check(t.hours === 18, "and the casting time follows the reduced cost");
}
{
  /* The cap is half the caster's Strand (6 -> 3), so the fourth and fifth
     helpers are turned away rather than silently counted. */
  const store = {}, actor = makeCaster();
  const out = await runOnce(RITUAL_SRC, {
    mode: "ritual", tracker: "", name: "Crowded", tc: "10", bindId: "b1", strandId: "s1",
    components: "0", assistants: "A, 4\nB, 4\nC, 4\nD, 4\nE, 4", circleSls: "0", bloodWp: "0"
  }, store, actor);
  const t = trackersOf(store, "ritual")[0];
  check(t.assistants.length === 3, "only as many assistants as the cap allows are kept", t.assistants.length);
  check(/2 assistant\(s\) turned away/.test(out), "and the rest are turned away out loud", out.slice(0, 260));
}
{
  const store = {}, actor = makeCaster({ resolve: { value: 0, max: 8 } });
  const out = await runOnce(RITUAL_SRC, {
    mode: "ritual", tracker: "", name: "No Resolve", tc: "10", bindId: "b1", strandId: "s1",
    components: "0", assistants: "", circleSls: "0", bloodWp: "0"
  }, store, actor);
  check(!trackersOf(store, "ritual").length && /at least one available Resolve/i.test(out),
    "a caster with no Resolve left cannot begin a ritual at all", out.slice(0, 200));
}

section("TBE: Ritual — concentration (p.317)");
{
  const store = {}, actor = makeCaster();
  await runOnce(RITUAL_SRC, { mode: "ritual", tracker: "", name: "Long", tc: "16", bindId: "b1", strandId: "s1",
    components: "0", assistants: "Bram, 4", circleSls: "0", bloodWp: "0" }, store, actor);
  let t = trackersOf(store, "ritual")[0];
  check(t.checkpoints === 2, "16 hours is two checkpoints");

  queueRolls(90); // Willpower 60: 90 is a plain failure (not doubles)
  let out = await runOnce(RITUAL_SRC, { mode: "ritual", tracker: t.id, act: "concentrate" }, store, actor);
  t = trackersOf(store, "ritual")[0];
  check(t.concentrationPenalty === 3, "a failed concentration roll adds +3 to the Weave Reaction", t.concentrationPenalty);
  check(actor.system.fatigue === 1, "and the eight hours cost the caster 1 Fatigue", actor.system.fatigue);
  check(/Each assistant takes 1 Fatigue too/.test(out), "the assistants are told they take it as well");

  queueRolls(80); // another plain failure
  await runOnce(RITUAL_SRC, { mode: "ritual", tracker: t.id, act: "concentrate" }, store, actor);
  t = trackersOf(store, "ritual")[0];
  check(t.concentrationPenalty === 6, "the modifier stacks with each failed roll", t.concentrationPenalty);
}
{
  const store = {}, actor = makeCaster();
  await runOnce(RITUAL_SRC, { mode: "ritual", tracker: "", name: "Collapse", tc: "8", bindId: "b1", strandId: "s1",
    components: "0", assistants: "", circleSls: "0", bloodWp: "0" }, store, actor);
  const t = trackersOf(store, "ritual")[0];
  queueRolls(99); // 99 vs Willpower 60: doubles, over the skill -> critical failure
  const out = await runOnce(RITUAL_SRC, { mode: "ritual", tracker: t.id, act: "concentrate" }, store, actor);
  check(!trackersOf(store, "ritual").length, "a critical failure on concentration ends the ritual outright");
  check(/the ritual fails, all components are consumed/i.test(out), "and says the components go with it", out.slice(-200));
}

section("TBE: Ritual — the Casting Results table (p.317)");
async function runToCompletion(opts) {
  const store = {}, actor = makeCaster(opts.actor);
  await runOnce(RITUAL_SRC, Object.assign({
    mode: "ritual", tracker: "", name: "Test", tc: String(opts.tc || 8), bindId: "b1", strandId: "s1",
    components: String(opts.components || 0), assistants: "", circleSls: "0", bloodWp: String(opts.bloodWp || 0)
  }, opts.begin || {}), store, actor);
  let t = trackersOf(store, "ritual")[0];
  for (let i = 0; i < t.checkpoints; i++) {
    queueRolls(15); // a comfortable Willpower success
    await runOnce(RITUAL_SRC, { mode: "ritual", tracker: t.id, act: "concentrate" }, store, actor);
    t = trackersOf(store, "ritual")[0];
  }
  queueRolls(...(opts.finishRolls || []));
  const out = await runOnce(RITUAL_SRC, { mode: "ritual", tracker: t.id, act: "finish" }, store, actor);
  return { out, actor, store };
}
{
  // Bind 70, roll 44 = doubles => critical success. No Weave Reaction at all.
  const { out, actor } = await runToCompletion({ tc: 8, finishRolls: [44] });
  check(/Critical Success/.test(out) && /No Weave Reaction/.test(out),
    "a critical success is cast as intended with no Weave Reaction roll", out.slice(0, 240));
  check(actor.system.fatigue === 1, "the concentration hour still cost its Fatigue, the result itself costs none",
    actor.system.fatigue);
}
{
  // Roll 63 vs 70: success, ones die 3, Strand 6, components 4 => Mastery 13 >= TC 8.
  const { out, actor } = await runToCompletion({ tc: 8, components: 4, finishRolls: [63] });
  check(/Mastery 13/.test(out) && /against TC 8/.test(out), "Mastery is the ones die + Strand + banked sources", out.slice(0, 300));
  check(/No Weave Reaction/.test(out), "Mastery at or above the TC means no Weave Reaction");
  check(actor.system.fatigue === 2, "a plain success costs every participant 1 Fatigue", actor.system.fatigue);
}
{
  // Roll 61 vs 70: success, ones die 1, Strand 6 => Mastery 7 against TC 20: short by 13.
  // Weave Reaction modifier = 13 + 5 (the ritual itself) = 18, plus the d20.
  const { out } = await runToCompletion({ tc: 20, finishRolls: [61, 2] });
  check(/Mastery 7/.test(out) && /1d20 2 \+ 18 = 20/.test(out),
    "an uncontrolled ritual rolls at (TC - Mastery) + 5 for the ritual itself", out.slice(0, 400));
  check(/take 3 Fatigue|takes 3 Fatigue/.test(out), "and costs 3 Fatigue rather than 1");
}
{
  // Roll 71 vs 70: a plain failure (not doubles).
  const { out, actor } = await runToCompletion({ tc: 8, finishRolls: [71] });
  check(/Failure/.test(out) && /Components can be reused/.test(out),
    "a failed ritual keeps its components", out.slice(0, 260));
  check(actor.system.fatigue === 4, "and costs 3 Fatigue on top of the hour's 1", actor.system.fatigue);
  check(/No Weave Reaction/.test(out) && !/1d20/.test(out), "with no Weave Reaction rolled", out.slice(-160));
}
{
  // Roll 88 vs 70: doubles above the skill => critical failure. WR modifier = the TC.
  const { out, actor } = await runToCompletion({ tc: 12, finishRolls: [88, 3, 50] });
  check(/Critical Failure/.test(out), "a critical failure is named", out.slice(0, 200));
  check(/1d20 3 \+ 12 = 15/.test(out), "its Weave Reaction is rolled at the ritual's own TC", out.slice(0, 420));
  check(actor.system.fraying === 1, "it costs a Fraying point", actor.system.fraying);
  check(/All components are used up/.test(out), "and every component with it");
}

section("TBE: Ritual — Blood Magic (p.316)");
{
  // 6 WP of blood => +6 Mastery; killed => +20 to the roll and a certain mark.
  // Rolls: Bind, then d100 for the marking, then d10 for which mark.
  const { out } = await runToCompletion({
    tc: 8, bloodWp: 6, begin: { blood: "on", bloodKill: "on" }, finishRolls: [63, 55, 4]
  });
  check(/\+20 for the killing/.test(out), "killing the victim adds +20 to the casting roll", out.slice(0, 260));
  check(/blood 6/.test(out), "each lethal Wound Point is a point of Mastery");
  check(/Marking chance 100%/.test(out) && /marked/.test(out), "and the marking is certain");
  check(/A faint sigil burned into the palm or forehead/.test(out),
    "the d10 lands on the book's own row 4", out.slice(-260));
}
{
  const { out } = await runToCompletion({
    tc: 8, bloodWp: 2, begin: { blood: "on" }, finishRolls: [63, 55]
  });
  check(/Marking chance 10%/.test(out) && /unmarked, this time/.test(out),
    "without a killing it is 5% per Wound Point, and 55 misses a 10% chance", out.slice(-200));
}

section("TBE: Ritual — grimoires (p.316)");
{
  const store = {}, actor = makeCaster();
  actor.items.push({ id: "g1", type: "thread", name: "The Umbral Codex",
    system: { grimoire: true, die: "d8", attunement: "Control, Spirit, Fire", expended: false },
    update: async function (d) { for (const [k, v] of Object.entries(d)) { const p = k.split("."); this.system[p[1]] = v; } } });
  await runOnce(RITUAL_SRC, { mode: "ritual", tracker: "", name: "Grim", tc: "20", bindId: "b1", strandId: "s1",
    components: "0", assistants: "", circleSls: "0", bloodWp: "0" }, store, actor);
  let t = trackersOf(store, "ritual")[0];
  queueRolls(5, 3); // one roll per applicable skill: Control and Spirit
  let out = await runOnce(RITUAL_SRC, { mode: "ritual", tracker: t.id, act: "grimoire", grimoireId: "g1" }, store, actor);
  t = trackersOf(store, "ritual")[0];
  check(t.grimoireMastery === 8, "a book covering two of the ritual's skills rolls once for each", t.grimoireMastery);
  check(/Control: d8/.test(out) && /Spirit: d8/.test(out), "and names which skill each roll was for", out.slice(0, 300));
  check(actor.items[4].system.expended !== true, "a book that did not roll its maximum survives");

  out = await runOnce(RITUAL_SRC, { mode: "ritual", tracker: t.id, act: "grimoire", grimoireId: "g1" }, store, actor);
  check(/already been consulted/.test(out), "a grimoire may be used only once per ritual", out.slice(0, 200));
}
{
  const store = {}, actor = makeCaster();
  actor.items.push({ id: "g2", type: "thread", name: "Tidal Folio",
    system: { grimoire: true, die: "d6", attunement: "Water", expended: false },
    update: async function () { return this; } });
  await runOnce(RITUAL_SRC, { mode: "ritual", tracker: "", name: "Wrong book", tc: "10", bindId: "b1", strandId: "s1",
    components: "0", assistants: "", circleSls: "0", bloodWp: "0" }, store, actor);
  const t = trackersOf(store, "ritual")[0];
  const out = await runOnce(RITUAL_SRC, { mode: "ritual", tracker: t.id, act: "grimoire", grimoireId: "g2" }, store, actor);
  check(/none of which this ritual uses/.test(out),
    "a grimoire that deals in neither the ritual's Bind nor its Strand cannot help", out.slice(0, 220));
}
{
  const store = {}, actor = makeCaster();
  let expended = false;
  actor.items.push({ id: "g3", type: "thread", name: "Brittle Codex",
    system: { grimoire: true, die: "d4", attunement: "Control", expended: false },
    update: async function (d) { if (d["system.expended"]) expended = true; return this; } });
  await runOnce(RITUAL_SRC, { mode: "ritual", tracker: "", name: "Consumed", tc: "10", bindId: "b1", strandId: "s1",
    components: "0", assistants: "", circleSls: "0", bloodWp: "0" }, store, actor);
  const t = trackersOf(store, "ritual")[0];
  queueRolls(4); // maximum on a d4
  const out = await runOnce(RITUAL_SRC, { mode: "ritual", tracker: t.id, act: "grimoire", grimoireId: "g3" }, store, actor);
  check(/the Mastery stands, and the book is consumed/.test(out) && expended,
    "a maximum roll gives its Mastery and then destroys the book", out.slice(-200));
}

section("TBE: Ritual — Pacts (p.318)");
{
  const store = {}, actor = makeCaster();
  let out = await runOnce(RITUAL_SRC, { mode: "pact", pact: "", price: "A cherished memory", interval: "one month" }, store, actor);
  let p = trackersOf(store, "pact")[0];
  check(p && p.total === 1, "a new Pact starts its Price total at 1", p && p.total);
  check(/Neither petitioner nor Patron has to roll/.test(out), "and says the pact ritual itself needs no roll");

  queueRolls(7);
  out = await runOnce(RITUAL_SRC, { mode: "pact", pact: p.id, pactAct: "tick" }, store, actor);
  p = trackersOf(store, "pact")[0];
  check(p.total === 2 && /Price total rises to 2/.test(out), "a roll above the total raises it by 1", p.total);

  queueRolls(2);
  out = await runOnce(RITUAL_SRC, { mode: "pact", pact: p.id, pactAct: "tick" }, store, actor);
  check(!trackersOf(store, "pact").length && /The Price is paid/.test(out),
    "a roll at or under the Price total pays it immediately", out.slice(-160));
}

section("TBE: Summoning (p.319-321)");
{
  const store = {}, actor = makeCaster();
  // Bind 70 rolls 63 (success, 3 SL); the creature's Willpower 55 rolls 71 (fail).
  queueRolls(63, 71, 41, 82); // then the cage: Arcana 65 rolls 41 (4 SL), Willpower rolls 82 (fail)
  const out = await runOnce(SUMMON_SRC, {
    circle: "", name: "the cellar circle", creature: "Void demon", willpower: "55",
    materialSp: "1000", bindId: "b1", arcana: "65", days: "1"
  }, store, actor);
  const c = trackersOf(store, "circle")[0];
  check(/Void demon appears within the circle/.test(out), "a beaten Willpower roll brings it through", out.slice(0, 320));
  check(/The circle holds/.test(out) && c.bound === true, "the cage test then decides whether it stays");
  check(c.daysLeft === 65, "bound for a number of days equal to the caster's Arcana Score", c.daysLeft);
}
{
  const store = {}, actor = makeCaster();
  // SLs come from the tens die, so the creature wins with a HIGHER roll it
  // still makes: 78 against Willpower 80 is 7 SL, over the caster's 6.
  queueRolls(63, 78);
  const out = await runOnce(SUMMON_SRC, {
    circle: "", name: "the circle", creature: "Ghost", willpower: "80",
    materialSp: "1000", bindId: "b1", arcana: "65", days: "1"
  }, store, actor);
  check(/It resists\. Nothing comes through/.test(out), "a creature that wins the opposed roll never arrives", out.slice(0, 260));
  check(!trackersOf(store, "circle").length, "and no circle is tracked");
}
{
  /* The True Name is the difference between a 55 Willpower and a 35 one: the
     same roll of 44 succeeds against 55 and fails against 35. */
  const store = {}, actor = makeCaster();
  queueRolls(63, 44, 41, 44);
  const out = await runOnce(SUMMON_SRC, {
    circle: "", name: "the circle", creature: "Named thing", willpower: "55", trueName: "on",
    materialSp: "2000", bindId: "b1", arcana: "65", days: "1"
  }, store, actor);
  check(/Willpower \(35, True Name\)/.test(out), "its True Name takes 20 off the Willpower roll", out.slice(0, 340));
  check(/appears within the circle/.test(out), "which is what lets the summons land");
}
{
  const store = {}, actor = makeCaster();
  queueRolls(63, 71, 41, 82);
  await runOnce(SUMMON_SRC, { circle: "", name: "c", creature: "Imp", willpower: "55",
    materialSp: "1000", bindId: "b1", arcana: "65", days: "1" }, store, actor);
  let c = trackersOf(store, "circle")[0];
  check(c.daysLeft === 65, "the containment runs for the caster's Arcana Score in days", c.daysLeft);
  let out = await runOnce(SUMMON_SRC, { circle: c.id, act: "days", days: "64" }, store, actor);
  c = trackersOf(store, "circle")[0];
  check(c.daysLeft === 1 && c.bound, "sixty-four days of decay leave one", c.daysLeft);
  out = await runOnce(SUMMON_SRC, { circle: c.id, act: "days", days: "1" }, store, actor);
  c = trackersOf(store, "circle")[0];
  check(c.bound === false && /immediately freed/.test(out),
    "when the days run out the containment fails and it is freed", out.slice(-220));
  check(/flee by the most direct route or attempt to harm the summoner/.test(out),
    "and an uncontrolled creature does what the book says it does");
}
{
  const store = {}, actor = makeCaster();
  queueRolls(63, 71, 41, 82);
  await runOnce(SUMMON_SRC, { circle: "", name: "c", creature: "Imp", willpower: "55",
    materialSp: "1000", bindId: "b1", arcana: "65", days: "1" }, store, actor);
  let c = trackersOf(store, "circle")[0];
  await runOnce(SUMMON_SRC, { circle: c.id, act: "days", days: "64" }, store, actor);
  queueRolls(41, 82); // renewal: Arcana holds, its Willpower fails again
  const out = await runOnce(SUMMON_SRC, { circle: trackersOf(store, "circle")[0].id, act: "renew", arcana: "65" }, store, actor);
  c = trackersOf(store, "circle")[0];
  check(c.daysLeft === 65 && /holds it for another 65 day/.test(out),
    "a successful renewal restores the full Arcana Score in days", [c.daysLeft, out.slice(-160)]);
  check(c.renewals === 1, "and is counted");
}

section("True Names (p.312-313)");
{
  const a = makeCaster();
  const tn = TBE.trueNameOf(a);
  check(tn.name === "Aen-Fionnah" && tn.language === "Dondalese" && tn.has,
    "a Patterned character's True Name and its language are both read off the sheet", tn);
  const mortal = makeCaster({ pattern: "none", trueName: "", trueNameLanguage: "" });
  check(TBE.trueNameOf(mortal).has === false,
    "ordinary mortals do not have one, and thus cannot be targeted through it");
}
{
  const a = makeCaster();
  a.items.push({ id: "l1", type: "skill", name: "Dondalese", system: { group: "Language", value: 55 } });
  const langs = TBE.languageSkills(a);
  check(langs.length === 1 && langs[0].value === 55,
    "Language skills are found in their own group, not the 37-skill catalogue", langs);
}
{
  const a = makeCaster();
  global.Roll = class { constructor(f) { this.formula = String(f); } async evaluate() { this.total = 1; return this; } };
  const lib = new Function("return (function(){\n" + LIB + "\nreturn TBE;\n})()")();
  const hit = await lib.invokeTrueNameFraying(a, "test");
  check(hit.gained === true && a.system.fraying === 1,
    "invoking a True Name rolls 1d10 and a 1 costs a Fraying point", [hit.gained, a.system.fraying]);
}
check(/automatically fails, and no Bind roll is made/.test(CAST_SRC),
  "TBE: Cast fails the spell outright when the Language roll misses");
check(/reactionFor\(total, \{ vulgar: false, ritual: !!s\.ritual \}\)/.test(CAST_SRC),
  "and a critical failure there uses the shared Weave Reaction lookup, not a second copy");
check(/!t\.grimoire/.test(CAST_SRC), "grimoires are kept out of ordinary castings — they are ritual-only");
check(!/function reactionFor\(total, opts\) \{/.test(CAST_SRC) && /TBE\.reactionFor = function/.test(read("macros/_lib.js")),
  "the Weave Reaction gating has one owner in _lib.js now");

/* =====================================================================
 * 3. Mutation guard
 * ===================================================================== */
section("Mutation guard (each of these must be caught)");
check(TBE.ritualTime(9, false).checkpoints !== 1,
  "counting 9 hours as one checkpoint would be caught — the book says 'or portion thereof'");
check(TBE.assistCap(5) !== 2, "rounding the assistant cap down instead of up would be caught");
check(TBE.circleReduction(3) === 1 && TBE.circleReduction(3) !== 2,
  "3 SLs is one point off the cost, not two — a ceil() here would be caught");
check(TBE.bloodMastery(25) !== 25, "letting Blood Magic past its cap of 20 would be caught");
check(TBE.circleMaterialBonus(3000) === 30,
  "material bonus stops at +30 however much silver is spent");
check(MAGIC.ritualResults.find((r) => r.key === "critFail").fatigue === 6 &&
  MAGIC.ritualResults.find((r) => r.key === "failure").fatigue === 3,
  "the two failure rows cost different Fatigue, and the data still knows which is which");

console.log("\n" + pass + " passed, " + fail + " failed");
if (fail) process.exit(1);
