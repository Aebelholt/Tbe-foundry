/*
 * dice_roles_check.mjs -- Dice So Nice colours for attack / defence / wound.
 * Runs the real module/helpers/dice-roles.mjs against a Dice So Nice stub with
 * roles (current) and without (older: colorsets only), and the real
 * TBE.tagDice out of macros/_lib.js with the system global present and absent.
 */
import { readFileSync } from "node:fs";
import * as dr from "./system/the-broken-empires/module/helpers/dice-roles.mjs";

let pass = 0, fail = 0;
const check = (cond, label, extra) => {
  if (cond) { pass++; console.log("  PASS  " + label); }
  else { fail++; console.log("  FAIL  " + label + (extra !== undefined ? "  <- " + JSON.stringify(extra) : "")); }
};
const roll = (n = 1) => ({ dice: Array.from({ length: n }, () => ({ options: {} })) });

console.log("\n1. Registration");
{
  const log = { cs: [], roles: [] };
  const d3 = { addColorset: (c, m) => log.cs.push([c, m]), addRole: (r, o) => log.roles.push([r, o]) };
  const out = dr.registerDiceRoles(d3, "the-broken-empires");
  check(out.colorsets === 3 && out.roles === 3, "three colorsets and three roles", out);
  const ids = Object.values(dr.ROLE);
  check(ids.every((id) => log.cs.some(([c]) => c.name === id)), "a colorset per role id");
  check(log.roles.every(([r, o]) => r.customizable && r.defaults.global.colorset === r.id && o.package === "the-broken-empires"),
    "each role is customisable, defaults to its own colorset, and names the package");
  const need = ["name", "description", "category", "foreground", "background", "outline", "edge", "texture", "material", "font"];
  check(dr.COLORSETS.every((c) => need.every((k) => c[k] !== undefined)), "every colorset carries every field Dice So Nice requires");
  const bg = dr.COLORSETS.map((c) => c.background);
  check(new Set(bg).size === 3, "the three defaults are visibly different", bg);
  const old = { cs: 0 };
  const out2 = dr.registerDiceRoles({ addColorset: () => old.cs++ }, "x");
  check(out2.colorsets === 3 && out2.roles === 0, "older Dice So Nice (no addRole): colorsets only", out2);
  check(dr.registerDiceRoles(null, "x").colorsets === 0, "no Dice So Nice: nothing, no throw");
}

console.log("\n2. Tagging");
{
  const r = roll(2);
  dr.tagRoll(r, dr.ROLE.attack, { addRole() {} });
  check(r.dice.every((d) => d.options.dsnRole === "tbe-attack" && !d.options.appearance),
    "with roles: role id only, so the table's own Dice So Nice choices win");
  const r2 = roll();
  dr.tagRoll(r2, dr.ROLE.defence, { addColorset() {} });
  check(r2.dice[0].options.appearance?.colorset === "tbe-defence", "without roles: fixed TBE colorset as appearance");
  const r3 = roll();
  dr.tagRoll(r3, dr.ROLE.wound, undefined);
  check(r3.dice[0].options.appearance?.colorset === "tbe-wound", "no Dice So Nice at all: harmless options, no throw");
}

console.log("\n3. The macro side defers to the system's ids");
{
  const LIB = readFileSync("macros/_lib.js", "utf8");
  const load = (game) => new Function("canvas", "game", "foundry", "ui", "CONFIG", LIB + "\n;return TBE;")(
    { tokens: { controlled: [] } }, game, { utils: {} }, { notifications: { warn() {}, error() {}, info() {} } }, undefined);
  const withSys = load({ user: {}, dice3d: { addRole() {} }, thebrokenempires: { rules: { diceRoles: { ROLE: dr.ROLE, tagRoll: dr.tagRoll } } } });
  const r = roll();
  check(withSys.tagDice(r, "attack") === 1 && r.dice[0].options.dsnRole === "tbe-attack", "TBE.tagDice uses the system's id");
  check(withSys.tagDice(roll(), "nonsense") === 0, "an unknown key tags nothing");
  const noSys = load({ user: {} });
  const r2 = roll();
  check(noSys.tagDice(r2, "attack") === 0 && !r2.dice[0].options.dsnRole, "without the system: nothing tagged, no id guessed");
  check(!/"tbe-attack"/.test(LIB), "_lib.js carries no copy of the role ids");
  const atk = readFileSync("macros/tbe-attack.js", "utf8");
  check(/TBE\.d100\("attack"\)/.test(atk) && /TBE\.d100\("defence"\)/.test(atk) && /tagDice\(wd, "wound"\)/.test(atk),
    "TBE: Attack tags its attack, defence and Wound Die");
  const main = readFileSync("system/the-broken-empires/module/the-broken-empires.mjs", "utf8");
  check(/Hooks\.once\('diceSoNiceReady'/.test(main), "registered on Dice So Nice's own ready hook");
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
