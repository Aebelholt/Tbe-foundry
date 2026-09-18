/**
 * The core d100 resolution rule (Ch.2), and the two tables that sit beside it
 * on every skill roll.
 *
 * This is the owner. `docs/ownership.md` has listed d100 resolution as
 * "Not yet extracted" since that table was written: the rule was correct but
 * lived only in the macro pack's `_lib.js`, copy-pasted into every macro at
 * build time, and a system file cannot import a macro. That was harmless
 * while only macros rolled dice. It stopped being harmless the moment the
 * sheet needed to roll one, which is what finally forced the extraction.
 *
 * `macros/_lib.js`'s `TBE.resolve` now defers to this at runtime via
 * `game.thebrokenempires.rules.resolve`, the same pattern `rankCap`,
 * `strandCap`, `sizeEffects` and `encumbrance` already use, and keeps its own
 * body only as the fallback for the Node test harness where `game` does not
 * exist. `resolution_check.mjs` runs both implementations over every roll
 * from 1 to 100 against a spread of skills and asserts they never disagree,
 * so the copy cannot drift back.
 */

const num = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

/** p.19: doubles (11, 22, ... 99) and 100 are the critical results. */
export const isDoubles = (r) => r === 100 || (r < 100 && r % 11 === 0);

/**
 * p.25, the table a GM picks from when a task is harder or easier than
 * ordinary. Not a house scale: these five are the book's own steps, and
 * "Medium +0" is the default an unmodified roll already is.
 *
 * The book is explicit that these belong on unopposed rolls only: "Task
 * modifiers should generally not be applied to opposed rolls. Opposed rolls
 * set their own difficulty through the opponent's result."
 */
export const TASK_MODIFIERS = [
  { key: "simple", label: "Simple", mod: 20, example: "Intimidate a coward" },
  { key: "easy", label: "Easy", mod: 10, example: "Use Commerce to evaluate a handful of foreign coins" },
  { key: "medium", label: "Medium", mod: 0, example: "Make an attack in combat" },
  { key: "challenging", label: "Challenging", mod: -10, example: "Ride an unbroken stallion" },
  { key: "hard", label: "Hard", mod: -20, example: "Recall Ancient Lore about a long-forgotten kingdom" }
];

/**
 * p.25: "You can spend Resolve as Favor (+10 per Resolve to a skill roll).
 * As stated above, up to 3 Favor may be used on any one skill roll from any
 * source, including Resolve."
 *
 * The cap is on the TOTAL from every source, so Favor banked from Preparing
 * the Battlefield, Leverage from a Social Encounter and Resolve spent at the
 * table all compete for the same three points. Anything offering a Favor
 * spend has to say so rather than offering its own private three.
 */
export const FAVOR_STEP = 10;
export const FAVOR_CAP = 3;

/** p.25: "Resolve may be spent only on your own rolls." */
export const RESOLVE_OWN_ROLLS_ONLY = true;

/**
 * Resolve a d100 roll against a skill.
 *
 * @param {number} r           the natural roll, 1-100
 * @param {number} skill       the final skill value, modifiers already applied
 * @param {number} [expertise] Ex2-Ex4, guaranteeing a minimum SL on a success
 * @returns {{roll:number, skill:number, success:boolean, crit:boolean,
 *            critFail:boolean, sl:number, tens:number, notes:string[]}}
 */
export function resolve(r, skill, expertise = 0) {
  const s = num(skill, 0);
  const alwaysFail = r >= 99;
  const doubles = isDoubles(r);
  let success;
  if (alwaysFail) success = false;
  else if (s <= 0) success = r <= 5;
  else if (r <= 5) success = true;
  else success = r <= s;

  let crit = false;
  let critFail = false;
  if (success) {
    if (s <= 0) crit = r === 5;
    else crit = doubles || r === s;
  } else if (s < 100) {
    critFail = doubles && r > s;
  }

  const tens = Math.floor((r % 100) / 10);
  let sl = 0;
  const notes = [];
  if (success) {
    sl = Math.max(1, tens);
    if (crit) {
      sl += 3;
      notes.push("critical success (+3 SL)");
    }
    if (s > 100) {
      const bonus = Math.max(1, Math.floor(((s - 100) % 100) / 10));
      sl += bonus;
      notes.push("skill over 100 (+" + bonus + " SL)");
    }
    if (r <= 5 && r > s) notes.push("01-05 always succeeds");
    const ex = num(expertise, 0);
    if (ex >= 2 && sl < ex) {
      sl = ex;
      notes.push("Expertise Ex" + ex + " guarantees " + ex + " SL");
    }
  } else {
    if (alwaysFail) notes.push("99-00 always fails");
    if (critFail) notes.push("critical failure");
  }
  return { roll: r, skill: s, success, crit, critFail, sl, tens, notes };
}

/** p.19 display convention: a natural 100 reads as "00". */
export const face = (r) => (r === 100 ? "00" : String(r));

export const outcomeLabel = (res) =>
  res.crit ? "CRITICAL SUCCESS"
    : res.success ? "SUCCESS"
      : res.critFail ? "CRITICAL FAILURE"
        : "FAILURE";
