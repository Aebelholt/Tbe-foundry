/**
 * Combat — the opposed-roll cascade, and what a shield is contributing.
 *
 * TWO CAPABILITIES, both previously owned by `macros/_lib.js` alone, which
 * was fine while only macros needed them. The sheet now rolls attacks and
 * defences directly (v0.38.0), so either the rule moves here and the macro
 * defers, or the project gets a sixth duplicate-logic bug. `docs/ownership.md`
 * has named this file as the intended home of the cascade since the v0.24.0
 * audit; this is that move, not a rewrite. The body below is `_lib.js`'s,
 * transplanted, because it was checked against p.20 and found correct and the
 * one thing worse than two implementations is two implementations where the
 * new one was retyped from memory.
 *
 * WHAT IS NOT HERE: hit location, damage, wounds, Combat Maneuvers, the size
 * table. Those involve two actors and a whole exchange, and they stay in
 * `TBE: Attack` / `TBE: Wounds & Recovery`. The sheet is a good place to
 * START a roll and a poor place to own a multi-actor sequence.
 */

/* ------------------------------------------------------------------ *
 *  The opposed-roll cascade (p.20)
 * ------------------------------------------------------------------ */

/**
 * Decide an opposed roll.
 *
 * Each side is `{ name, kind: "roll"|"fixed", ok, sl, skill, res }`, where
 * `res` is a `resolve()` result for a rolled side and `ok` is always true for
 * a Fixed Number. Returns `{ winner, dos, why }`; `winner` is null on a dead
 * heat with no forced tie-break, because the book leaves that to the table
 * and inventing a winner would be exactly the kind of automated adjudication
 * this system refuses to do.
 *
 * The branch that matters and that a re-derivation keeps losing: when BOTH
 * sides fail, a normal failure beats a critical failure. `TBE: Haggle` had
 * its own copy of this cascade for months with that branch missing, so a
 * merchant who fumbled still won ties. That is the fifth duplicate-logic bug
 * in CLAUDE.md's list, and it is why this function is not allowed to exist
 * twice.
 */
export function opposedResolve(A, B) {
  let winner = null, dos = 0, why = "";
  if (A.ok && B.ok) {
    if (A.sl > B.sl) { winner = A; dos = A.sl - B.sl; why = "higher SLs"; }
    else if (B.sl > A.sl) { winner = B; dos = B.sl - A.sl; why = "higher SLs"; }
    else {
      const critA = A.kind === "roll" && A.res.crit;
      const critB = B.kind === "roll" && B.res.crit;
      if (critA && !critB) { winner = A; why = "critical beats non-critical (0 SL)"; }
      else if (critB && !critA) { winner = B; why = "critical beats non-critical (0 SL)"; }
      else if (A.kind === "roll" && B.kind === "fixed") { winner = A; why = "rolled skill beats a Fixed Number on a tie (0 SL)"; }
      else if (B.kind === "roll" && A.kind === "fixed") { winner = B; why = "rolled skill beats a Fixed Number on a tie (0 SL)"; }
      else if (A.res.roll > B.res.roll) { winner = A; why = "SLs tied, higher die roll (0 SL)"; }
      else if (B.res.roll > A.res.roll) { winner = B; why = "SLs tied, higher die roll (0 SL)"; }
      else if (A.skill > B.skill) { winner = A; why = "SLs and die tied, higher modified skill (0 SL)"; }
      else if (B.skill > A.skill) { winner = B; why = "SLs and die tied, higher modified skill (0 SL)"; }
      else why = "dead heat &mdash; decide or re-roll";
    }
  } else if (A.ok) { winner = A; dos = A.sl; why = "only side to succeed"; }
  else if (B.ok) { winner = B; dos = B.sl; why = "only side to succeed"; }
  else {
    const cfA = A.kind === "roll" && A.res.critFail;
    const cfB = B.kind === "roll" && B.res.critFail;
    if (cfA && !cfB) why = "both failed &mdash; if a winner is required, " + B.name + " (normal failure beats critical failure)";
    else if (cfB && !cfA) why = "both failed &mdash; if a winner is required, " + A.name + " (normal failure beats critical failure)";
    else why = "both failed &mdash; if a winner is required, " + (A.skill >= B.skill ? A.name : B.name) + " (higher modified skill)";
  }
  return { winner, dos, why };
}

/* ------------------------------------------------------------------ *
 *  Shields (B1: "if shielding make it clear during the attack macro")
 * ------------------------------------------------------------------ */

/**
 * The shield this actor is actually defending with, if any.
 *
 * ONE reason this is a function and not an inline filter: the carry state it
 * tests is an OPEN enum. Written as `carried !== "stored"` it was correct for
 * three states and wrong the day a fourth arrived, and it was written that way
 * in four places. v0.35.0 fixed two of them; the other two sat inside
 * `tbe-attack.js` until v0.37.0, and for two releases a shield lying on the
 * ground granted its Armour Points and still cost an attacker SLs to
 * circumvent. `carryPool` is the owner of "which pool does this state count
 * toward"; asking it a positive question ("is this in hand?") is what makes a
 * fifth state harmless.
 *
 * `carryPool` is passed in rather than imported so this stays runnable from a
 * Node harness and from the macro pack, both of which reach CONFIG.TBE by
 * different routes.
 */
export function defendingShield(actor, carryPool, HAND = "hand") {
  const items = actor?.items ?? [];
  const list = typeof items.filter === "function" ? items : Array.from(items ?? []);
  return list.find((i) => i?.type === "shield" && carryPool(i?.system?.carried) === HAND) ?? null;
}

/**
 * One line saying what the shield is doing, for the card and the defence
 * prompt. The playtest GM, after the first real session: "If shielding make it clear
 * during the attack macro." The numbers were always in the arithmetic; what
 * was missing was any statement at the moment of the roll that a shield was
 * up at all.
 *
 * Returns null when there is nothing to say, so a caller can concatenate it
 * unconditionally.
 *
 * The contract that makes this trustworthy: this must be fed the SAME shield
 * the attack arithmetic used. A line that names a shield the roll did not
 * count is worse than no line, because it reads as confirmation.
 */
export function shieldLine(shield, { defenderName = "The defender" } = {}) {
  if (!shield) return null;
  const ap = Number(shield.system?.ap) || 0;
  const shb = shield.system?.shb;
  const bits = [`<b>${defenderName}</b> is shielding with <b>${shield.name}</b>`];
  if (ap) bits.push(`+${ap} AP where it covers`);
  /* A Buckler carries `null` here and cannot Shield Bash at all, which is a
     different statement from "costs 0 SL". Number(null) is 0 and finite, so
     the type is what gets checked, same as in tbe-attack.js. */
  if (typeof shb === "number") bits.push(`Circumvent Shield costs ${shb} SL`);
  else bits.push("cannot Shield Bash");
  return bits.join(" &mdash; ") + " (p.140).";
}
