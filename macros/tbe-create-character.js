/* TBE: Create Character — opens the character creation window (v0.52.0).
 *
 * The window lives in the system (module/chargen/creator.mjs), not in this
 * macro: it is one ApplicationV2 window with the book's twelve steps, a live
 * sheet, and a Create that writes exactly what the sheet shows. This macro
 * only finds the actor and opens it. The same window opens from the
 * character sheet's header ("Create").
 *
 * TBE: Character Wizard and TBE: Finish Character still work; they are
 * retired once this window has been played with at a table (stage 3).
 */
const target = TBE.me();
const chargen = game.thebrokenempires?.chargen;
if (!chargen?.open) {
  ui.notifications?.warn("TBE: the character creation window needs The Broken Empires system v0.52.0 or later.");
} else if (!target) {
  ui.notifications?.warn("TBE: select your token, or assign a character to your user, then run this again.");
} else {
  await chargen.open(target);
}
