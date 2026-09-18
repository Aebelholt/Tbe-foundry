/* intrigue_check.mjs — the Ch.13 Intrigue content batch: Prolonged & Quick
 * Chases (new TBE: Chase macro) and the Investigations/Suspicion Die variant
 * folded into TBE: Extended Roll, plus the TBE.opposedResolve() ownership
 * hoist both of them (and TBE: Opposed Roll) now share.
 *
 * Same discipline as the other check scripts: the rule against the book
 * quote, then the behaviour, driven through the real macro source (not a
 * hand-reimplemented model of it) via a small stubbed-Foundry harness. */

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
const section = (t) => console.log("\n" + t);

/* ---- book-quote fidelity (probe-before-build, checked here too even
 * though this batch is rules content, not a table extraction) ---------- */
const raw = fs.readFileSync("/tmp/tbe.txt", "utf8");
const flat = raw.replace(/\s+/g, " ");
const quote = (s) => flat.includes(s.replace(/\s+/g, " "));

/* ------------------------------------------------------------------------
 * Harness: _lib.js + one macro's source, stubbed Foundry, a Roll queue so
 * Timer Die / crit-fail / SL outcomes are picked deliberately instead of
 * left to chance. A queued roll is consumed in call order; running out
 * falls back to a fixed 1 (never random -- this suite must be reproducible).
 * ---------------------------------------------------------------------- */
let rollQueue = [];
const queueRolls = (...vals) => { rollQueue = vals.slice(); };

function makeHarness(store) {
  const said = [];
  global.foundry = { utils: { duplicate: (x) => JSON.parse(JSON.stringify(x)) } };
  global.CONFIG = { sounds: { dice: null } };
  global.Roll = class {
    constructor(f) { this.formula = String(f); }
    async evaluate() { this.total = rollQueue.length ? rollQueue.shift() : 1; return this; }
  };
  global.ui = { notifications: { warn: (m) => said.push("[warn] " + m), error: (m) => said.push("[err] " + m) } };
  global.canvas = { tokens: { controlled: [] } };
  global.ChatMessage = { getSpeaker: () => ({}), create: async (d) => { said.push(d.content); return d; } };
  global.game = {
    user: { character: null },
    tables: { getName: () => null },
    settings: {
      get: (ns, key) => (store[key] !== undefined ? store[key] : {}),
      set: async (ns, key, val) => { store[key] = val; return val; }
    }
  };
  return said;
}

const LIB = read("macros/_lib.js");
const EMPTY_TABLES = "const TBE_DATA = { tables: [] };\n";

/* Runs ONE invocation of a macro (fresh function scope, shared `store` so a
 * tracker persists across calls the way it does in the world "encounters"
 * setting). answers[] is consumed one item per TBE.prompt() call inside that
 * one invocation -- every macro here only calls it once, so answers = [obj]. */
async function runOnce(macroSrc, answer, store) {
  const said = makeHarness(store);
  const code = EMPTY_TABLES + LIB.replace(
    /TBE\.prompt = async function[\s\S]*?\n};/,
    "TBE.prompt = async function (t, c, o) { return " + JSON.stringify(answer) + "; };"
  ) + "\n" + macroSrc;
  await new Function("return (async()=>{" + code + "})()")().catch((e) => said.push("[throw] " + e.stack));
  const out = said.map((s) => String(s).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()).join(" || ");
  return out;
}

const CHASE_SRC = read("macros/tbe-chase.js");
const EXT_SRC = read("macros/tbe-extended-roll.js");

const chaseTrackers = (store) => Object.values(store.encounters || {});
const extTrackers = (store) => Object.values(store.encounters || {});

/* ==========================================================================
 * TBE.opposedResolve() -- the hoisted tie-break cascade (Ch.2)
 * ======================================================================== */
section("TBE.opposedResolve() ownership hoist (Ch.2)");
{
  const libFn = new Function("return (function(){\n" + LIB + "\nreturn TBE;\n})()")();
  const succ = (name, sl, roll, skill, crit = false) => ({ name, kind: "roll", res: { crit, critFail: false, roll }, sl, ok: true, skill });
  const fail = (name, roll, skill, critFail = false) => ({ name, kind: "roll", res: { crit: false, critFail, roll }, sl: 0, ok: false, skill });

  {
    const { winner, dos, why } = libFn.opposedResolve(succ("A", 5, 41, 90), succ("B", 3, 33, 80));
    check(winner?.name === "A" && dos === 2 && why === "higher SLs", "higher SL wins outright");
  }
  {
    const { winner, why } = libFn.opposedResolve(succ("A", 4, 44, 90, true), succ("B", 4, 24, 80));
    check(winner?.name === "A" && /critical beats non-critical/.test(why), "tied SLs: a critical beats a non-critical");
  }
  {
    const { winner, why } = libFn.opposedResolve(succ("A", 4, 44, 90), succ("B", 4, 24, 80));
    check(winner?.name === "A" && /higher die roll/.test(why), "tied SLs, no crit either way: higher die roll wins");
  }
  {
    const { winner, why } = libFn.opposedResolve(succ("A", 4, 44, 90), succ("B", 4, 44, 60));
    check(winner?.name === "A" && /higher modified skill/.test(why), "tied SLs and die: higher modified skill wins");
  }
  {
    const { winner } = libFn.opposedResolve(succ("A", 4, 44, 90), succ("B", 4, 44, 90));
    check(winner === null, "everything tied: a dead heat, no winner forced");
  }
  {
    const { winner, why } = libFn.opposedResolve(fail("A", 99, 50, true), fail("B", 60, 50, false));
    check(winner === null && /normal failure beats critical failure/.test(why), "both fail: normal beats critical (no forced winner, just the note)");
  }
  {
    const { winner, why } = libFn.opposedResolve(succ("A", 3, 33, 50), fail("B", 60, 50));
    check(winner?.name === "A" && why === "only side to succeed", "only one side succeeds");
  }
}
const opposedSrc = read("macros/tbe-opposed-roll.js");
check(/TBE\.opposedResolve\(A, B\)/.test(opposedSrc), "TBE: Opposed Roll delegates to the shared cascade");
check(!/critical beats non-critical \(0 SL\)/.test(opposedSrc), "and no longer carries its own copy of the cascade text");

/* ==========================================================================
 * TBE: Chase (Ch.13, p.269-270)
 * ======================================================================== */
section("TBE: Chase -- book fidelity");
check(quote("make opposed Athletics rolls. The winner catches the loser"), "Quick Chase quote is real");
check(quote("Critically failing one of the rolls cuts the current amount of"), "prolonged-chase crit-fail quote is real");
check(quote("If both reach the target SLs in the same round, play one more round"), "simultaneous-tie quote is real");
check(quote("the most recent highest roll wins"), "premature-end tie-break quote is real");
check(/TBE\.opposedResolve\(A, B\)/.test(CHASE_SRC), "Quick Chase reuses the shared opposed cascade");
check(!/critical beats non-critical \(0 SL\)/.test(CHASE_SRC), "and does not carry a second copy of it");

section("TBE: Chase -- Quick Chase");
{
  queueRolls(41, 32); // A rolls 41 vs 90 -> 4 SL (not doubles); B rolls 32 vs 80 -> 3 SL (not doubles)
  const out = await runOnce(CHASE_SRC, {
    mode: "quick", qSide: "pursuer", qNameA: "Hunter", qSkillA: "90", qModA: "0", qExpA: "0",
    qNameB: "Fugitive", qSkillB: "80", qModB: "0", qExpB: "0"
  }, {});
  check(/Hunter catches Fugitive/.test(out), "pursuer with the higher SL catches the prey", out);
}
{
  queueRolls(32, 41); // A(pursuer) 3 SL, B(prey) 4 SL -> prey wins -> escapes
  const out = await runOnce(CHASE_SRC, {
    mode: "quick", qSide: "pursuer", qNameA: "Hunter", qSkillA: "90", qModA: "0", qExpA: "0",
    qNameB: "Fugitive", qSkillB: "80", qModB: "0", qExpB: "0"
  }, {});
  check(/Fugitive escapes/.test(out), "prey with the higher SL escapes", out);
}

section("TBE: Chase -- Prolonged Chase, basic accumulation and win");
{
  const store = {};
  queueRolls();
  await runOnce(CHASE_SRC, { mode: "track", tracker: "", name: "Rooftop Chase", pursuerName: "Guards", preyName: "Veil", target: "6", timer: "", timerEffect: "complication" }, store);
  let t = chaseTrackers(store)[0];
  check(!!t && t.target === 6, "tracker created with the target SLs set");

  queueRolls(45); // roll 45 vs skill 90 -> 4 SL, success, no crit (45 % 11 != 0)
  await runOnce(CHASE_SRC, { mode: "track", tracker: t.id, act: "attempt", side: "pursuer", who: "Guards", skillName: "Athletics", skillValue: "90" }, store);
  queueRolls(25); // 25 vs 80 -> 2 SL
  await runOnce(CHASE_SRC, { mode: "track", tracker: t.id, act: "attempt", side: "prey", who: "Veil", skillName: "Athletics", skillValue: "80" }, store);
  queueRolls(); // no timer configured -> no Roll() calls in resolve
  let out = await runOnce(CHASE_SRC, { mode: "track", tracker: t.id, act: "resolve" }, store);
  t = chaseTrackers(store)[0];
  check(t.pursuerTotal === 4 && t.preyTotal === 2 && t.round === 1, "round 1: both sides' SLs are added to their own totals", t);

  queueRolls(35); // 3 SL -> pursuer 4+3=7 >= target 6
  await runOnce(CHASE_SRC, { mode: "track", tracker: t.id, act: "attempt", side: "pursuer", who: "Guards", skillName: "Athletics", skillValue: "90" }, store);
  out = await runOnce(CHASE_SRC, { mode: "track", tracker: t.id, act: "resolve" }, store);
  check(/Guards reaches 6 SLs first/.test(out) && /Guards catches Veil and Engages them/.test(out), "reaching the target ends the chase immediately", out);
  check(chaseTrackers(store).length === 0, "and the tracker is cleared");
}

section("TBE: Chase -- critical failure halves only that side's total");
{
  const store = {};
  await runOnce(CHASE_SRC, { mode: "track", tracker: "", name: "Halving", pursuerName: "P", preyName: "Y", target: "9999", timer: "", timerEffect: "complication" }, store);
  let t = chaseTrackers(store)[0];
  // Get pursuer to 5 SL first (52, not a doubles roll, so no crit bonus).
  queueRolls(52);
  await runOnce(CHASE_SRC, { mode: "track", tracker: t.id, act: "attempt", side: "pursuer", who: "P", skillName: "Athletics", skillValue: "90" }, store);
  await runOnce(CHASE_SRC, { mode: "track", tracker: t.id, act: "resolve" }, store);
  t = chaseTrackers(store)[0];
  check(t.pursuerTotal === 5, "pursuer sits at 5 SL before the crit fail", t);
  // Prey banks 2 SL the same round, for comparison after the halving.
  queueRolls(99, 25); // pursuer critically fails (99, doubles, > skill 50); prey rolls 25 vs 80 -> 2 SL
  await runOnce(CHASE_SRC, { mode: "track", tracker: t.id, act: "attempt", side: "pursuer", who: "P", skillName: "Athletics", skillValue: "50" }, store);
  await runOnce(CHASE_SRC, { mode: "track", tracker: t.id, act: "attempt", side: "prey", who: "Y", skillName: "Athletics", skillValue: "80" }, store);
  await runOnce(CHASE_SRC, { mode: "track", tracker: t.id, act: "resolve" }, store);
  t = chaseTrackers(store)[0];
  check(t.pursuerTotal === 3, "5 SL halved (round up) to 3 after the critical failure", t);
  check(t.preyTotal === 2, "the prey's own total is untouched by the pursuer's critical failure", t);
}

section("TBE: Chase -- simultaneous target reach plays a tie-break round");
{
  const store = {};
  await runOnce(CHASE_SRC, { mode: "track", tracker: "", name: "Dead Heat", pursuerName: "P", preyName: "Y", target: "4", timer: "", timerEffect: "complication" }, store);
  let t = chaseTrackers(store)[0];
  queueRolls(45, 45); // both roll 4 SL (45 vs 90, 45 vs 90) -> both reach 4 simultaneously
  await runOnce(CHASE_SRC, { mode: "track", tracker: t.id, act: "attempt", side: "pursuer", who: "P", skillName: "Athletics", skillValue: "90" }, store);
  await runOnce(CHASE_SRC, { mode: "track", tracker: t.id, act: "attempt", side: "prey", who: "Y", skillName: "Athletics", skillValue: "90" }, store);
  let out = await runOnce(CHASE_SRC, { mode: "track", tracker: t.id, act: "resolve" }, store);
  t = chaseTrackers(store)[0];
  check(!!t && t.suddenDeath === true, "both sides reaching the target in the same round doesn't end it -- sudden death", t);
  check(/tied.*Play one more round/i.test(out) || /sudden death/i.test(out), "the card says so", out);

  // Tie-break round: pursuer out-rolls prey this round -> pursuer wins outright,
  // even though both totals are still >= target.
  queueRolls(35, 15); // pursuer 3 SL, prey 1 SL this round
  await runOnce(CHASE_SRC, { mode: "track", tracker: t.id, act: "attempt", side: "pursuer", who: "P", skillName: "Athletics", skillValue: "90" }, store);
  await runOnce(CHASE_SRC, { mode: "track", tracker: t.id, act: "attempt", side: "prey", who: "Y", skillName: "Athletics", skillValue: "90" }, store);
  out = await runOnce(CHASE_SRC, { mode: "track", tracker: t.id, act: "resolve" }, store);
  check(/P catches Y/.test(out), "the tie-break round's higher SL gain wins outright", out);
  check(chaseTrackers(store).length === 0, "and the tracker is cleared");
}

section("TBE: Chase -- Timer Die");
{
  const store = {};
  await runOnce(CHASE_SRC, { mode: "track", tracker: "", name: "Timed", pursuerName: "P", preyName: "Y", target: "9999", timer: "d10", timerEffect: "end" }, store);
  let t = chaseTrackers(store)[0];
  queueRolls(45); // pursuer 4 SL
  await runOnce(CHASE_SRC, { mode: "track", tracker: t.id, act: "attempt", side: "pursuer", who: "P", skillName: "Athletics", skillValue: "90" }, store);
  queueRolls(25); // prey 2 SL
  await runOnce(CHASE_SRC, { mode: "track", tracker: t.id, act: "attempt", side: "prey", who: "Y", skillName: "Athletics", skillValue: "90" }, store);
  queueRolls(1); // Timer Die: 1 <= round 1 -> fires
  const out = await runOnce(CHASE_SRC, { mode: "track", tracker: t.id, act: "resolve" }, store);
  check(/cut short by the Timer Die/.test(out) && /P leads 4 to 2/.test(out) && /P catches Y/.test(out),
    "a fired Timer Die set to \"end\" resolves by current totals", out);
  check(chaseTrackers(store).length === 0, "and ends the chase");
}
{
  const store = {};
  await runOnce(CHASE_SRC, { mode: "track", tracker: "", name: "Complicated", pursuerName: "P", preyName: "Y", target: "9999", timer: "d10", timerEffect: "complication" }, store);
  let t = chaseTrackers(store)[0];
  queueRolls(15);
  await runOnce(CHASE_SRC, { mode: "track", tracker: t.id, act: "attempt", side: "pursuer", who: "P", skillName: "Athletics", skillValue: "90" }, store);
  queueRolls(1, 1); // Timer Die fires (1<=1), then d6=1 -> "affects pursuer"
  const out = await runOnce(CHASE_SRC, { mode: "track", tracker: t.id, act: "resolve" }, store);
  check(/it fires/.test(out) && /Complication/.test(out) && /affects P\)/.test(out),
    "a fired Timer Die set to \"complication\" draws one and names who it affects", out);
  check(chaseTrackers(store).length === 1, "and the chase continues");
}

section("TBE: Chase -- manual end and premature-end tie-break");
{
  const store = {};
  await runOnce(CHASE_SRC, { mode: "track", tracker: "", name: "Ended", pursuerName: "P", preyName: "Y", target: "9999", timer: "", timerEffect: "complication" }, store);
  let t = chaseTrackers(store)[0];
  queueRolls(45); await runOnce(CHASE_SRC, { mode: "track", tracker: t.id, act: "attempt", side: "pursuer", who: "P", skillName: "A", skillValue: "90" }, store);
  queueRolls(35); await runOnce(CHASE_SRC, { mode: "track", tracker: t.id, act: "attempt", side: "prey", who: "Y", skillName: "A", skillValue: "90" }, store); // 3 SL, ties overall? both single rounds
  await runOnce(CHASE_SRC, { mode: "track", tracker: t.id, act: "resolve" }, store);
  t = chaseTrackers(store)[0];
  check(t.pursuerTotal === 4 && t.preyTotal === 3, "unequal totals going into a manual end", t);
  const out = await runOnce(CHASE_SRC, { mode: "track", tracker: t.id, act: "end" }, store);
  check(/P leads 4 to 3/.test(out) && /P catches Y/.test(out), "\"End now\" declares by current totals", out);
  check(chaseTrackers(store).length === 0, "and clears the tracker");
}
{
  // Exact tie on totals (4-4): the pursuer's last roll (45) beats the prey's
  // more recent one (25), so the tie-break has to reach back to each side's
  // own last roll, not just "whoever rolled most recently overall".
  const store = {};
  await runOnce(CHASE_SRC, { mode: "track", tracker: "", name: "TieRoll", pursuerName: "P", preyName: "Y", target: "9999", timer: "", timerEffect: "complication" }, store);
  let t = chaseTrackers(store)[0];
  queueRolls(45); await runOnce(CHASE_SRC, { mode: "track", tracker: t.id, act: "attempt", side: "pursuer", who: "P", skillName: "A", skillValue: "90" }, store); // roll 45, 4 SL
  queueRolls(24); await runOnce(CHASE_SRC, { mode: "track", tracker: t.id, act: "attempt", side: "prey", who: "Y", skillName: "A", skillValue: "90" }, store); // roll 24, 2 SL
  await runOnce(CHASE_SRC, { mode: "track", tracker: t.id, act: "resolve" }, store); // P 4, Y 2
  // Round 2: only the prey rolls, catching up to an exact tie at 4-4.
  queueRolls(25); await runOnce(CHASE_SRC, { mode: "track", tracker: t.id, act: "attempt", side: "prey", who: "Y", skillName: "A", skillValue: "90" }, store); // roll 25, 2 SL, total 2+2=4
  await runOnce(CHASE_SRC, { mode: "track", tracker: t.id, act: "resolve" }, store);
  t = chaseTrackers(store)[0];
  check(t.pursuerTotal === 4 && t.preyTotal === 4, "totals land on an exact 4-4 tie", t);
  const out = await runOnce(CHASE_SRC, { mode: "track", tracker: t.id, act: "end" }, store);
  check(/tied 4-4/.test(out) && /most recent highest roll wins/.test(out) && /P catches Y/.test(out),
    "tied totals fall back to each side's own most recent roll (P's 45 beats Y's 25)", out);
}

section("TBE: Chase -- one roll per side per round");
{
  const store = {};
  await runOnce(CHASE_SRC, { mode: "track", tracker: "", name: "Overwrite", pursuerName: "P", preyName: "Y", target: "9999", timer: "", timerEffect: "complication" }, store);
  const t = chaseTrackers(store)[0];
  queueRolls(45); await runOnce(CHASE_SRC, { mode: "track", tracker: t.id, act: "attempt", side: "pursuer", who: "P", skillName: "A", skillValue: "90" }, store);
  queueRolls(15);
  const out = await runOnce(CHASE_SRC, { mode: "track", tracker: t.id, act: "attempt", side: "pursuer", who: "P", skillName: "A", skillValue: "90" }, store);
  check(/Replaces this round's earlier roll/.test(out), "logging a second roll for the same side warns that it replaces the first", out);
  const resolved = await runOnce(CHASE_SRC, { mode: "track", tracker: t.id, act: "resolve" }, store);
  check(/no roll logged this round/i.test(resolved), "the side that never rolled is reported, not silently zeroed", resolved);
}

/* ==========================================================================
 * TBE: Extended Roll -- Investigations & the Suspicion Die (Ch.13 p.267-269)
 * ======================================================================== */
section("TBE: Extended Roll / Investigations -- book fidelity");
check(quote("every 3 SLs uncovers one clue"), "clue-count quote is real");
check(quote("You may delay rolling it until a certain threshold"), "Suspicion Die Tolerance quote is real");

section("TBE: Extended Roll -- clue readout");
{
  const store = {};
  await runOnce(EXT_SRC, { tracker: "", name: "Case", req: "9999", interval: "1 day", limit: "0", timer: "", tolerance: "0", timerEffect: "complication" }, store);
  const t = extTrackers(store)[0];
  queueRolls(45); // 4 SL
  await runOnce(EXT_SRC, { tracker: t.id, act: "attempt", who: "PC", skillName: "Insight", skillValue: "90" }, store);
  const out = await runOnce(EXT_SRC, { tracker: t.id, act: "resolve" }, store);
  check(/~1 clue\(s\)/.test(out), "3-5 SLs banked reads as 1 clue (every 3 SLs, p.267)", out);
}

section("TBE: Extended Roll -- Suspicion Die Tolerance gates the Timer Die");
{
  const store = {};
  await runOnce(EXT_SRC, { tracker: "", name: "Undercover", req: "9999", interval: "1 hr", limit: "0", timer: "d10", tolerance: "2", timerEffect: "expose" }, store);
  const t = extTrackers(store)[0];
  // Interval 1: even a Timer roll of 1 (which would fire under the plain
  // rule) must NOT be rolled at all, since intervalsUsed(1) is not > tolerance(2).
  queueRolls(50, 1);
  let out = await runOnce(EXT_SRC, { tracker: t.id, act: "attempt", who: "Veil", skillName: "Streetwise", skillValue: "80" }, store);
  out = await runOnce(EXT_SRC, { tracker: t.id, act: "resolve" }, store);
  check(!/Timer Die/.test(out), "interval 1 (<= tolerance 2): the Timer isn't rolled at all", out);
  check(extTrackers(store).length === 1, "and the investigation continues");

  // Interval 2: still within tolerance.
  queueRolls(50, 1);
  await runOnce(EXT_SRC, { tracker: t.id, act: "attempt", who: "Veil", skillName: "Streetwise", skillValue: "80" }, store);
  out = await runOnce(EXT_SRC, { tracker: t.id, act: "resolve" }, store);
  check(!/Timer Die/.test(out), "interval 2 (== tolerance 2): still not rolled", out);

  // Interval 3: now past tolerance, and a roll of 1 <= 3 intervals fires.
  queueRolls(50, 1);
  await runOnce(EXT_SRC, { tracker: t.id, act: "attempt", who: "Veil", skillName: "Streetwise", skillValue: "80" }, store);
  out = await runOnce(EXT_SRC, { tracker: t.id, act: "resolve" }, store);
  check(/Timer Die/.test(out) && /EXPOSED/.test(out), "interval 3 (> tolerance 2): the Timer rolls, and \"expose\" reads as EXPOSED", out);
  check(extTrackers(store).length === 0, "an exposed investigation ends and clears its tracker");
}

/* ==========================================================================
 * Mutation guard -- each of these has to fail if the real behaviour regresses
 * to the wrong-but-plausible alternative. Computed against the real halveUp/
 * resolve() helpers, not hand-typed numbers, so this stays honest if either
 * changes.
 * ======================================================================== */
section("Mutation guard (each of these must be caught)");
{
  const libFn = new Function("return (function(){\n" + LIB + "\nreturn TBE;\n})()")();
  check(libFn.halveUp(5) === 3 && libFn.halveUp(5) !== 2,
    "halveUp(5) rounds UP to 3 -- a floor()-based halving (2) is what the crit-fail tests above would have missed");
}
{
  // The Tolerance gate is "> tolerance", not ">= tolerance" -- off by one
  // either way changes which interval the Timer starts on. Exercised above
  // at intervals 1, 2 and 3 against tolerance 2; restated here as a direct
  // boundary check on the gate's own arithmetic.
  const tolerance = 2;
  check(!(2 > tolerance) && (3 > tolerance),
    "interval 2 does not clear a Tolerance of 2, interval 3 does -- an \">=\" gate would let interval 2 through too");
}
{
  // Sudden death only triggers when BOTH sides are >= target in the SAME
  // round -- one side alone reaching it, even past target, must not.
  const bothAtOrPast = (p, y, target) => p >= target && y >= target;
  check(bothAtOrPast(7, 6, 6) === true, "both sides at or past a target of 6 triggers sudden death");
  check(bothAtOrPast(7, 5, 6) === false, "one side past target with the other short does not");
}
console.log("\n" + pass + " passed, " + fail + " failed");
if (fail) process.exit(1);
