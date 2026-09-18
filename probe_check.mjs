/* probe_check.mjs — the session probe actually parses our own chat cards.
 *
 * The probe's whole value is the roll analysis, and that analysis is regexes
 * run against flavour text. If one of them misses, the probe returns cheerful
 * empty aggregates and the user finds out only after burning a session. So run
 * the real probe against a stubbed world built from the exact card format
 * module/sheets/actor-sheet.mjs actually emits.
 *
 * Run: node probe_check.mjs
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

const PROBE = read("TBE-Session-Probe.js");
const SHEET = read("system/the-broken-empires/module/sheets/actor-sheet.mjs");

console.log("\n1. The probe is pasteable and safe");
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
  try { new AF("speaker", "actor", "token", "character", "scope", "event", "{" + PROBE + "\n}"); } catch (e) { err = e.message; }
  check(err === null, "compiles as a Foundry script macro", err);
  check(!/^\s*import\s/m.test(PROBE), "carries no import declaration");
  check(/THIS IS THE FILE YOU PASTE INTO FOUNDRY/.test(PROBE), "says on line 1 that it is the paste target");
  /* A probe must never write to the world it is measuring, apart from its own
   * log setting and its own output journal. */
  check(!/actor\.update\(|\.delete\(\)|deleteEmbeddedDocuments/.test(PROBE),
    "never updates or deletes an actor: reading a played world must not change it");
}

console.log("\n2. Build a world the way the sheet really writes it");
/* Reproduce the flavour string from _onSkillRoll, character for character,
 * rather than inventing a plausible one. */
const outcomeLabel = (o) => o;
const card = ({ name, base, task, favor, target, outcome, sl, notes = [] }) => {
  const bits = [];
  if (task) bits.push(`task ${task > 0 ? "+" : ""}${task}`);
  if (favor) bits.push(`${favor} Favor +${favor * 10}`);
  const line = bits.length ? `${base} ${bits.map((b) => `(${b})`).join(" ")} = ${target}` : `${base}`;
  return `<b>${name}</b> &mdash; ${line}<br>` +
    `<b>${outcomeLabel(outcome)}</b>${/SUCCESS/.test(outcome) ? ` with ${sl} SL` : ""}` +
    (notes.length ? `<br><span style="font-size:11px;opacity:.85">${notes.join("; ")}</span>` : "");
};
{
  /* Prove the reproduction is faithful: the sheet's own template literal must
   * still contain the pieces this fixture assumes. */
  const h = SHEET.slice(SHEET.indexOf("async _onSkillRoll"), SHEET.indexOf("async _onItemCreate"));
  check(h.includes("&mdash;"), "the sheet really does emit an &mdash; entity in the flavour");
  check(h.includes("with ${res.sl} SL"), "and 'with N SL' on a success");
  check(h.includes("task ${spend.task > 0 ? '+' : ''}"), "and a '(task +N)' fragment");
  check(h.includes("Favor +${spend.favor * RULES.FAVOR_STEP}"), "and an 'N Favor +M' fragment");
}

/* Relative to now, not a fixed date: the probe filters to the last HOURS_BACK
 * hours, so a hardcoded timestamp makes this check pass or fail depending on
 * what day it is run. That is exactly the trap the probe itself warns about. */
const T0 = Date.now() - 95 * 60000;
const m = (minsIn, flavor, formula, total, who) => ({
  timestamp: T0 + minsIn * 60000, flavor, content: "",
  rolls: formula ? [{ formula, total }] : [],
  speaker: { alias: who }, user: { id: "u1" }
});

const messages = [
  m(0, "", null, null, "GM"),
  m(2, card({ name: "Common Lore", base: 70, task: 0, favor: 0, target: 70, outcome: "SUCCESS", sl: 4 }), "1d100", 41, "Renn Kestrel"),
  m(5, card({ name: "Survival", base: 55, task: -10, favor: 0, target: 45, outcome: "FAILURE", sl: 0 }), "1d100", 88, "Dags Farrow"),
  m(9, card({ name: "Stealth", base: 70, task: 0, favor: 2, target: 90, outcome: "CRITICAL SUCCESS", sl: 7,
    notes: ["critical success (+3 SL)"] }), "1d100", 44, "Sela Voss"),
  m(14, card({ name: "Heal", base: 70, task: -20, favor: 3, target: 80, outcome: "SUCCESS", sl: 5 }), "1d100", 52, '"Mother" Mairwen Coll'),
  /* A long pause, the thing that explains where three hours went. */
  m(75, card({ name: "Perception", base: 65, task: 0, favor: 0, target: 65, outcome: "FAILURE", sl: 0 }), "1d100", 91, "Renn Kestrel"),
  m(78, "", null, null, "GM"),
  /* A macro-era roll with a different flavour shape, which must not crash it. */
  m(80, "TBE: Opposed Roll — Side A", "1d100", 33, "Grael Ashbeard")
];

const world = {
  game: {
    user: { isGM: true, id: "u1" },
    version: "14.365",
    release: { generation: 14 },
    system: { id: "the-broken-empires", version: "0.32.0" },
    world: { id: "salt-run" },
    modules: new Map(),
    users: Object.assign([{ name: "Seb", isGM: true, character: null }], { get: () => ({ name: "Seb" }) }),
    messages: { contents: messages },
    actors: [],
    combats: [],
    scenes: [],
    macros: [],
    journal: { getName: () => null },
    settings: { get: () => { throw new Error("not registered"); }, settings: new Map() }
  }
};

const _log = console.log; console.log("\n3. Run the real probe against it");
let captured = null;
{
  const AF = Object.getPrototypeOf(async function () {}).constructor;
  const ui = { notifications: { info() {}, warn() {}, error() {} } };
  const ChatMessage = { create: () => {} };
  const JournalEntry = { create: async () => {} };
  const globalThisSave = (json) => { captured = JSON.parse(json); };
  const fn = new AF("game", "ui", "ChatMessage", "JournalEntry", "foundry", "globalThis_saveDataToFile",
    PROBE.replace("globalThis.saveDataToFile ?? foundry?.utils?.saveDataToFile ?? null", "globalThis_saveDataToFile"));
  console.log = () => {};
  await fn(world.game, ui, ChatMessage, JournalEntry, { utils: {} }, globalThisSave);
  console.log = _log;
  check(captured !== null, "the probe produced a report");
}

console.log("\n4. The roll parsing actually works");
{
  const R = captured.rolls;
  check(captured.chat.rolls === 6, "found all six roll messages", captured.chat.rolls);
  check(R.bySkill["Common Lore"] === 1 && R.bySkill["Survival"] === 1 && R.bySkill["Heal"] === 1,
    "skill names parsed out of the flavour", R.bySkill);
  check(R.bySkill["Perception"] === 1 && R.bySkill["Stealth"] === 1, "...including every one in the fixture");
  check(R.byOutcome["SUCCESS"] === 2 && R.byOutcome["FAILURE"] === 2 && R.byOutcome["CRITICAL SUCCESS"] === 1,
    "outcomes parsed, criticals not swallowed by the plain SUCCESS branch", R.byOutcome);
  check(R.withFavor === 2, "counted the two rolls that spent Favor", R.withFavor);
  check(R.withTaskModifier === 2, "counted the two that used a Task Modifier", R.withTaskModifier);
  check(R.successRate === "60%", "success rate over parsed outcomes", R.successRate);
  const heal = R.all.find((r) => r.skill === "Heal");
  check(!!heal && heal.target === 80 && heal.sl === 5 && heal.task === "-20",
    "one row end to end: Heal, target 80, 5 SL, task -20", heal ?? "(no Heal row parsed)");
  check(R.byActor['"Mother" Mairwen Coll'] === 1, "an actor name with quotes in it survives", Object.keys(R.byActor));
  const macroRoll = R.all.find((r) => /Opposed/.test(r.flavor ?? ""));
  check(!!macroRoll && macroRoll.outcome === null,
    "a macro-era roll in a different format is kept, with outcome left null rather than guessed");
}

console.log("\n5. Pacing, which is what answers 'where did three hours go'");
{
  const P = captured.pacing;
  check(P.spanMinutes === 80, "span measured from first to last message", P.spanMinutes);
  check(P.quietStretches.length === 1, "found the one long pause", P.quietStretches);
  check(P.quietStretches[0].minutes === 61, "...and measured it at 61 minutes", P.quietStretches[0]);
  check(P.quietStretches[0].before.includes("Heal") && P.quietStretches[0].after.includes("Perception"),
    "...and says what was happening either side of it, so it can be placed in the session");
  check(P.quietMinutesTotal === 61, "quiet total reported");
  check(Object.keys(P.per30min).length >= 2, "half-hour histogram built", P.per30min);
}

console.log("\n6. Degrades honestly rather than pretending");
{
  const AF = Object.getPrototypeOf(async function () {}).constructor;
  let out = null;
  const empty = JSON.parse(JSON.stringify(world.game));
  empty.messages = { contents: [] };
  empty.user = { isGM: true, id: "u1" };
  empty.users = Object.assign([], { get: () => null });
  empty.journal = { getName: () => null };
  empty.settings = { get: () => { throw new Error("nope"); }, settings: new Map() };
  const fn = new AF("game", "ui", "ChatMessage", "JournalEntry", "foundry", "globalThis_saveDataToFile",
    PROBE.replace("globalThis.saveDataToFile ?? foundry?.utils?.saveDataToFile ?? null", "globalThis_saveDataToFile"));
  console.log = () => {};
  await fn(empty, { notifications: { info() {}, warn() {}, error() {} } }, { create: () => {} },
    { create: async () => {} }, { utils: {} }, (j) => { out = JSON.parse(j); });
  console.log = _log;
  check(out !== null, "an empty world still produces a report rather than throwing");
  check(out.notes.some((n) => /No chat messages/.test(n)),
    "...and says plainly that it found nothing, naming the knob to turn", out.notes);
  check(out.notes.some((n) => /combat/i.test(n)), "...and flags that no combat was tracked");
  check(/(no parsed outcomes)/.test(out.rolls.successRate), "a success rate is not invented from zero rolls", out.rolls.successRate);
}

console.log("\n7. Mutation: a broken parse must not look like a quiet session");
{
  /* The failure mode that matters is silence: a regex that matches nothing
   * returns tidy empty aggregates and reads like "they barely rolled". */
  const AF = Object.getPrototypeOf(async function () {}).constructor;
  const broken = PROBE.replace('const ENTITIES = {', 'const ENTITIES = { "&never&": "x", ')
                      .replace('"&mdash;": "\\u2014",', '');
  let out = null;
  const fn = new AF("game", "ui", "ChatMessage", "JournalEntry", "foundry", "globalThis_saveDataToFile",
    broken.replace("globalThis.saveDataToFile ?? foundry?.utils?.saveDataToFile ?? null", "globalThis_saveDataToFile"));
  console.log = () => {};
  await fn(world.game, { notifications: { info() {}, warn() {}, error() {} } }, { create: () => {} },
    { create: async () => {} }, { utils: {} }, (j) => { out = JSON.parse(j); });
  console.log = _log;
  check(out.rolls.bySkill["Common Lore"] === undefined,
    "CONFIRMED: without the &mdash; decode the skill names stop parsing, which section 4 catches",
    out.rolls.bySkill);
}

console.log("\n8. The macro cards, which is where a real table's rolls actually are");
{
  /* Every card TBE.say() writes lands in `content` with an EMPTY flavour.
   * The first real session was 65 rolls and the probe attributed a skill to
   * none of them, because it read `flavor` alone. These fixtures are the
   * literal strings that session produced, entities and all, built the way
   * macros/_lib.js builds them rather than typed by hand. */
  const LIB = fs.readFileSync("macros/_lib.js", "utf8");
  /* The premise of this whole section is that a macro card's text lands in
     `content` with `flavor` unset, which is why the probe has to read both
     fields. That used to be asserted with a regex over TBE.say's source, and
     v0.34.0's visibility work broke the regex while leaving the premise
     perfectly true -- a check failing for the wrong reason is one bad day away
     from being "fixed" by loosening it until it tests nothing. So run the real
     function against a stub and look at what it actually posts. */
  {
    const posted = [];
    const ChatMessageStub = {
      create: (d) => { posted.push(d); return d; },
      getSpeaker: () => ({ alias: "x" }),
      applyRollMode: (d) => d,
      getWhisperRecipients: () => []
    };
    const TBEsay = new Function("canvas", "game", "foundry", "ui", "CONFIG", "ChatMessage",
      LIB + "\n;return TBE;")(
      { tokens: { controlled: [] } },
      { user: { id: "u1", character: null }, settings: { get: () => "publicroll" } },
      { utils: { duplicate: (o) => JSON.parse(JSON.stringify(o)) } },
      { notifications: { warn() {}, error() {}, info() {} } },
      { sounds: { dice: "d.wav" } }, ChatMessageStub);
    TBEsay.say("<b>the card</b>", []);
    const msg = posted.at(-1) ?? {};
    check(typeof msg.content === "string" && msg.content.includes("the card"),
      "TBE.say still puts the card in content -- the premise of this section", msg.content);
    check(msg.flavor === undefined || msg.flavor === "",
      "...and sets no flavor, which is why the probe must read content too", msg.flavor);
  }
  const cardFn = /TBE\.card = function[\s\S]*?\n\};/.exec(LIB)[0];
  const TBE = {};
  new Function("TBE", cardFn)(TBE);

  /* TBE: Skill Roll's body, copied in the shape the macro emits it. */
  const skillBody = (label, base, mod, target, face, tag, sl) =>
    '<div style="margin:2px 0"><b>' + label + "</b> " + base +
    (mod ? (mod > 0 ? " +" + mod : " " + mod) : "") +
    " &rarr; target <b>" + target + "</b></div>" +
    '<div style="font-size:22px">' + face + "</div>" +
    '<div style="font-weight:bold">' + tag + (sl ? " &mdash; " + sl + " SL" : "") + "</div>";

  const T1 = Date.now() - 60 * 60000;
  const mc = (minsIn, content, flavor, formula, total, who) => ({
    timestamp: T1 + minsIn * 60000, flavor, content,
    rolls: formula === null ? [] : [{ formula, total }],
    speaker: { alias: who }, user: { id: "u1" }
  });

  const msgs2 = [
    mc(0, TBE.card("TBE Skill Roll", skillBody("Perception", 46, 10, 56, 91, "FAILURE", 0)), "", "1d100", 91, "Rann"),
    mc(3, TBE.card("TBE Skill Roll", skillBody("Perception", 46, 0, 46, 12, "SUCCESS", 1)), "", "1d100", 12, "Rann"),
    mc(6, TBE.card("TBE Skill Roll", skillBody("Track", 57, 0, 57, 59, "FAILURE", 0)), "", "1d100", 59, "Morrk"),
    mc(9, TBE.card("TBE Attack",
      '<div>Rann , <b>Shortbow</b> (Missile 70) vs Elspeth Dunmore (Dodge 60)</div>'), "", "1d100", 22, "Rann"),
    /* The tracker's own Initiative rolls. Rann's actor is fine; the two
       creatures carry the corrupted string, so their formula is "0". */
    mc(12, "", "Rann rolls for Initiative!", "1d10 + 9", 15, "Rann"),
    mc(12, "", "Elspeth Dunmore rolls for Initiative!", "0", 0, "Elspeth Dunmore"),
    mc(12, "", "Morrk rolls for Initiative!", "0", 0, "Morrk")
  ];

  const g = Object.assign({}, world.game, {
    messages: { contents: msgs2 },
    actors: [{
      name: "Elspeth Dunmore", type: "creature", id: "e1",
      system: { initiative: "14,14,NaN,NaN", deathThreshold: { max: 20 } },
      items: []
    }],
    scenes: []
  });

  const AF = Object.getPrototypeOf(async function () {}).constructor;
  let out = null;
  const fn = new AF("game", "ui", "ChatMessage", "JournalEntry", "foundry", "globalThis_saveDataToFile",
    PROBE.replace("globalThis.saveDataToFile ?? foundry?.utils?.saveDataToFile ?? null", "globalThis_saveDataToFile"));
  console.log = () => {};
  await fn(g, { notifications: { info() {}, warn() {}, error() {} } }, { create: () => {} },
    { create: async () => {} }, { utils: {} }, (j) => { out = JSON.parse(j); });
  console.log = _log;

  check(out.chat.rolls === 7, "all seven rolls captured", out.chat.rolls);
  check(out.rolls.bySkill["Perception"] === 2, "a macro card's skill is read out of content", out.rolls.bySkill);
  check(out.rolls.bySkill["Track"] === 1, "...for every macro card, not just the first shape");
  check(out.rolls.bySkill["Missile"] === 1, "an Attack card reports the weapon's SKILL, which is what was rolled", out.rolls.bySkill);
  check(out.rolls.bySkill["Initiative"] === 3, "tracker Initiative rolls are classified, not dropped", out.rolls.bySkill);
  check((out.rolls.unparsed ?? 99) === 0, "nothing left unattributed", out.rolls.unparsed);
  check(out.rolls.byOutcome["FAILURE"] === 2 && out.rolls.byOutcome["SUCCESS"] === 1,
    "outcomes come out of the macro cards too", out.rolls.byOutcome);
  const perc = out.rolls.all.find((r) => r.skill === "Perception" && r.target === 56);
  check(!!perc && perc.task === "+10", "the modifier on a macro card is read as the task modifier", perc ?? "(not parsed)");
  check(out.rolls.initiative.zeroFormula === 2 &&
    out.rolls.initiative.whoRolledZero.join(",") === "Elspeth Dunmore,Morrk",
    "the two creatures rolling a formula of 0 are named", out.rolls.initiative);
  check(out.notes.some((n) => /acted last in every round/.test(n)),
    "...and the report says in words what that cost them", out.notes);
  check(out.health.some((h) => /system\.initiative is "14,14,NaN,NaN"/.test(h)),
    "the health check names the corrupted value on the actor itself", out.health);

  /* Mutation: read only the flavour again, which is the bug this section
     exists for. The macro cards must go dark and say so. */
  const broken = PROBE.replace("const text = flavor || strip(m.content);", "const text = flavor;");
  check(broken !== PROBE, "mutation applied");
  let bad = null;
  const fn2 = new AF("game", "ui", "ChatMessage", "JournalEntry", "foundry", "globalThis_saveDataToFile",
    broken.replace("globalThis.saveDataToFile ?? foundry?.utils?.saveDataToFile ?? null", "globalThis_saveDataToFile"));
  console.log = () => {};
  await fn2(g, { notifications: { info() {}, warn() {}, error() {} } }, { create: () => {} },
    { create: async () => {} }, { utils: {} }, (j) => { bad = JSON.parse(j); });
  console.log = _log;
  check(bad.rolls.bySkill["Perception"] === undefined && bad.rolls.unparsed === 4,
    "CONFIRMED: flavour-only parsing loses every macro card, which is the defect the first session hit",
    bad.rolls.bySkill);
  check(bad.notes.some((n) => /could not be attributed/.test(n)),
    "...and even then it says the aggregates are incomplete rather than reading as a quiet table", bad.notes);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
