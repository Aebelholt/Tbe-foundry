/* TBE: Create Character — opens the character creation window (v0.52.0).
 *
 * The window lives in the system (module/chargen/creator.mjs), not in this
 * macro: it is one ApplicationV2 window with the book's twelve steps, a live
 * sheet, and a Create that writes exactly what the sheet shows. This macro
 * only finds the actor and opens it. The same window opens from the
 * character sheet's header ("Create").
 *
 * It replaced TBE: Character Wizard, Finish Character and Build Character,
 * which were retired in v0.53.0.
 */
const target = TBE.me();
const chargen = game.thebrokenempires?.chargen;
if (!chargen?.open) {
  ui.notifications?.warn("TBE: the character creation window needs The Broken Empires system v0.52.0 or later.");
} else {
  /* Nothing selected: the window offers to create a new Character actor
     (for a GM, or a player allowed to create actors). A token that is not
     linked to its actor is resolved to the actor in the sidebar, v0.54.0. */
  await chargen.open(target);
}
