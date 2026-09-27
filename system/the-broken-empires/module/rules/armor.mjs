/* Armour Bulk and the Initiative penalty (Ch.9 p.142): "Add up the Bulk from
 * each piece of worn armor and divide by 3, rounding up. The result is the
 * Initiative penalty your armor causes you. This is only for worn armor."
 *
 * One owner (v0.53.0). It was written out three times: on the actor
 * (documents/actor.mjs prepareDerivedData), as the sheet's fallback, and as
 * the macro library's fallback (TBE.armorInit). The character creation
 * window needed it a fourth time for the Equipment step. All four call this.
 * Nothing here reads a Foundry global.
 */
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

/** Worn armour only: a piece with `equipped === false` is in Inventory. */
export function wornBulk(items) {
  return (items || []).filter((i) => i && i.type === "armor" && i.system?.equipped !== false)
    .reduce((n, i) => n + num(i.system?.bulk, 0), 0);
}

export function initPenalty(bulk) {
  return Math.ceil(num(bulk, 0) / 3);
}
