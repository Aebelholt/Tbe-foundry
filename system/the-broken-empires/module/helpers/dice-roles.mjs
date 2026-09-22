/*
 * Dice So Nice colours by what a roll IS, not by who rolled it.
 *
 * When the GM runs a fight between two tokens they own, every die is the GM's
 * colour and the table cannot tell the attack from the defence. Dice So Nice
 * has "dice roles" for exactly this: a die tagged with a role id takes that
 * role's appearance, and the GM (Dice Roles table) and each player (their own
 * role appearance) can change it in Dice So Nice's settings. This module is
 * the ONE owner of TBE's role ids and default colours; macros tag dice through
 * TBE.tagDice in _lib.js, which reads ROLE from here at runtime.
 *
 * Shape, not version (CLAUDE.md rule 7): an older Dice So Nice with
 * addColorset but no addRole still gets the colours, as a fixed per-die
 * appearance instead of a customisable role.
 */
export const ROLE = { attack: "tbe-attack", defence: "tbe-defence", wound: "tbe-wound" };

/* Default looks. Crimson and brass for the blow, steel for the guard, bone
 * for the Wound Die. */
export const COLORSETS = [
  { name: ROLE.attack, description: "TBE: Attack", category: "The Broken Empires",
    foreground: "#f3d27a", background: "#8b1a1a", outline: "#2a0707", edge: "#5e1010",
    texture: "none", material: "metal", font: "Arial", visibility: "visible" },
  { name: ROLE.defence, description: "TBE: Defence", category: "The Broken Empires",
    foreground: "#ffffff", background: "#35506b", outline: "#0e1a26", edge: "#243a50",
    texture: "none", material: "metal", font: "Arial", visibility: "visible" },
  { name: ROLE.wound, description: "TBE: Wound Die", category: "The Broken Empires",
    foreground: "#1a1a1a", background: "#e8dfc8", outline: "#5a4d33", edge: "#c9bd9f",
    texture: "none", material: "plastic", font: "Arial", visibility: "visible" }
];

const LABELS = { [ROLE.attack]: "Attack roll", [ROLE.defence]: "Defence roll", [ROLE.wound]: "Wound Die" };

/**
 * Register TBE's colorsets and, where supported, its roles.
 * @param {object} dice3d  the Dice So Nice API object
 * @param {string} pkg     the system id
 * @returns {{colorsets:number, roles:number}}
 */
export function registerDiceRoles(dice3d, pkg) {
  const out = { colorsets: 0, roles: 0 };
  if (!dice3d) return out;
  if (typeof dice3d.addColorset === "function") {
    for (const cs of COLORSETS) { dice3d.addColorset(cs, "default"); out.colorsets++; }
  }
  if (typeof dice3d.addRole === "function") {
    for (const id of Object.values(ROLE)) {
      dice3d.addRole({
        id, label: LABELS[id], group: "The Broken Empires",
        customizable: true, optional: false,
        defaults: { global: { colorset: id } }
      }, { package: pkg });
      out.roles++;
    }
  }
  return out;
}

/**
 * Tag every die in a roll with a role. With roles available the die carries
 * only the role id, so the table's own Dice So Nice choices win; without them
 * it carries the TBE colorset as a fixed appearance.
 * @returns {number} dice tagged
 */
export function tagRoll(roll, role, dice3d) {
  if (!roll || !role) return 0;
  const dice = roll.dice ?? [];
  const useRoles = !!dice3d && typeof dice3d.addRole === "function";
  for (const d of dice) {
    d.options = d.options || {};
    d.options.dsnRole = role;
    if (!useRoles) d.options.appearance = Object.assign({}, d.options.appearance, { colorset: role });
  }
  return dice.length;
}
