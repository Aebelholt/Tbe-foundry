/* Macros this system used to ship and has retired (v0.53.0, chargen rebuild
 * stage 3), and the short redirect each world copy is rewritten to.
 *
 * One owner, here, since after v0.53.1. A world that imported these still has
 * copies frozen at the old version. Two things need the list: TBE: Update
 * Macros, which rewrites each copy's command in place so a hotbar slot keeps
 * working and points at the replacement (never deletes it), and the world
 * check card after an upgrade, which names those copies so a GM knows they
 * are there. The card runs in the system and cannot read the macro library,
 * so the list lives in the system and the library reads it from
 * game.thebrokenempires.retiredMacros. Nothing here reads a Foundry global.
 */
export const RETIRED_MACROS = Object.freeze((() => {
  const openCreator = (name) =>
    "/* " + name + " was retired in v0.53.0. TBE: Update Macros pointed this copy at its replacement,\n" +
    " * the Create Character window (also on every character sheet's header). */\n" +
    "const a = canvas.tokens?.controlled?.map((t) => t.actor).find((x) => x?.isOwner) ?? game.user?.character ?? null;\n" +
    "const cg = game.thebrokenempires?.chargen;\n" +
    "if (!cg?.open) ui.notifications?.warn(\"TBE: " + name + " was retired. Update The Broken Empires system to v0.53.0 or later for Create Character.\");\n" +
    "else if (!a) ui.notifications?.warn(\"TBE: select your token, or assign a character to your user, then run this again.\");\n" +
    "else cg.open(a);\n";
  const finish =
    "/* TBE: Finish Character was retired in v0.53.0. TBE: Update Macros replaced this copy with a pointer. */\n" +
    "ui.notifications?.info(\"TBE: Finish Character was retired. New characters: Create on the character sheet's header. " +
    "Gear and free armour: Buy equipment on the Gear tab. Goals: Add Goal on the sheet. Talents: TBE: Talents.\", { permanent: true });\n";
  return {
    "TBE: Character Wizard": { replacement: "Create Character", command: openCreator("TBE: Character Wizard") },
    "TBE: Build Character": { replacement: "Create Character", command: openCreator("TBE: Build Character") },
    "TBE: Finish Character": { replacement: "the character sheet (Buy equipment, Add Goal) and TBE: Talents", command: finish }
  };
})());
