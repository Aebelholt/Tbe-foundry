/* tier0_check.mjs — the MVP-scope Tier 0 batch: the five places the module
 * claimed something it did not do.
 *
 * Same shape as funnel_check.mjs: check the rule against the book where the
 * book has one, check that the code has one owner, check the behaviour, then
 * break each check and watch it fail.
 *
 * System-module methods (the actor's armor/initiative derivation, the item's
 * rank scaling) are sliced out of their .mjs and run against plain objects,
 * the way magic_check.mjs already runs the real _prepareMagic. */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let pass = 0, fail = 0;
const check = (cond, label, extra) => {
  if (cond) { pass++; console.log("  PASS  " + label); }
  else { fail++; console.log("  FAIL  " + label + (extra !== undefined ? "  <- " + JSON.stringify(extra) : "")); }
};
const section = (t) => console.log("\n" + t);
const read = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");

const libSrc = read("macros/_lib.js");
class RollStub { constructor(f) { this.formula = f; } async evaluate() { this.total = 1; return this; } }
const TBE = new Function("Roll", "return (function(){\n" + libSrc + "\nreturn TBE;\n})()")(RollStub);
const { TBE: CFG } = await import("./system/the-broken-empires/module/helpers/config.mjs");

/* ---------------------------------------------------------------- 1. Initiative */
section("Initiative (p.161) is wired to the tracker");
const mainSrc = read("system/the-broken-empires/module/the-broken-empires.mjs");
check(/CONFIG\.Combat\.initiative\s*=\s*\{\s*formula:\s*"1d10 \+ @initiativeEffective"/.test(mainSrc),
  "the tracker rolls 1d10 + the actor's Initiative");
check(/type === "creature" \? "@initiativeEffective"/.test(mainSrc),
  "enemies do not roll: a creature uses its static Initiative value");
check(/_sortCombatants/.test(mainSrc) && /pcB - pcA/.test(mainSrc),
  "ties go to the PC");

/* The armor half of the same rule, run for real. */
const actorSrc = read("system/the-broken-empires/module/documents/actor.mjs");
const derivedBody = actorSrc.slice(actorSrc.indexOf("prepareDerivedData() {"));
const body = derivedBody.slice(derivedBody.indexOf("{") + 1, derivedBody.indexOf("\n  }"));
const runDerive = new Function("return function(){" + body + "}")();
const mkActor = (initiative, armor) => ({
  flags: {}, items: armor.map((a) => ({ type: "armor", system: a })),
  system: { initiative }
});
{
  const a = mkActor(10, [{ bulk: 4, equipped: true }, { bulk: 3, equipped: true }]);
  runDerive.call(a);
  check(a.system.armorBulk === 7 && a.system.armorInitPenalty === 3,
    "Bulk 7 of worn armor is a -3 Initiative penalty (Bulk/3 rounded up, p.141)",
    [a.system.armorBulk, a.system.armorInitPenalty]);
  check(a.system.initiativeEffective === 7, "Initiative 10 becomes an effective 7");
}
{
  const a = mkActor(10, [{ bulk: 9, equipped: false }]);
  runDerive.call(a);
  check(a.system.armorInitPenalty === 0, "armor carried but not worn costs no Initiative (p.141)");
}
{
  const a = mkActor(1, [{ bulk: 12, equipped: true }]);
  runDerive.call(a);
  check(a.system.initiativeEffective === -3,
    "p.161: a character whose Initiative goes below 0 acts on the negative value, so it is not clamped",
    a.system.initiativeEffective);
}
check(/getRollData\(\)/.test(read("system/the-broken-empires/module/data/base-actor.mjs")) &&
  /initiativeEffective/.test(read("system/the-broken-empires/module/data/base-actor.mjs")),
  "@initiativeEffective is exposed to roll formulas");

section("Ownership: the armor Initiative penalty is computed once");
const computeCopies = ["macros/tbe-cast.js", "macros/tbe-finish-character.js",
  "system/the-broken-empires/module/sheets/actor-sheet.mjs", "macros/_lib.js"]
  .filter((f) => /Math\.ceil\(bulk \/ 3\)/.test(read(f)));
check(computeCopies.length <= 2 && !computeCopies.includes("macros/tbe-cast.js") &&
  !computeCopies.includes("macros/tbe-finish-character.js"),
  "TBE: Cast and TBE: Finish Character no longer carry their own copy", computeCopies);
check(/TBE\.armorInit\(/.test(read("macros/tbe-cast.js")) &&
  /TBE\.armorInit\(/.test(read("macros/tbe-finish-character.js")),
  "both read the value the actor derived");
{
  const withDerived = { system: { initiative: 10, armorBulk: 7, armorInitPenalty: 3, initiativeEffective: 7 } };
  const got = TBE.armorInit(withDerived);
  check(got.penalty === 3 && got.effective === 7, "TBE.armorInit reads the derived fields", got);
  const legacy = { system: { initiative: 10 }, items: [{ type: "armor", system: { bulk: 4, equipped: true } }] };
  check(TBE.armorInit(legacy).penalty === 2, "and falls back for an actor prepared before they existed");
}

/* ---------------------------------------------------------------- 2. Talent ranks */
section("Repeatable Talents stack (and stop at the book's cap)");
check(CFG.rankCap("three") === 3 && CFG.rankCap("five") === 5 && CFG.rankCap("once") === 1 &&
  CFG.rankCap("levelled") === 4 && CFG.rankCap("multiple") === Infinity,
  "the caps match the book's wording (three / five / Armor Training I-IV / unbounded)");

const itemSrc = read("system/the-broken-empires/module/documents/item.mjs");
const itemBody = itemSrc.slice(itemSrc.indexOf("prepareDerivedData() {"));
const itemInner = itemBody.slice(itemBody.indexOf("{") + 1, itemBody.indexOf("\n  }"));
/* The one line that cannot run outside a real Document subclass. Everything
 * below it is the rule under test. */
const runItem = new Function("CONFIG", "CONST",
  "return function(){" + itemInner.replace("super.prepareDerivedData?.();", "") + "}")(
  { TBE: CFG }, { ACTIVE_EFFECT_MODES: { ADD: 2 } });
const mkTalent = (ranks, maxRanks, value, mode = 2) => ({
  type: "talent", system: { ranks, maxRanks },
  effects: [{ changes: [{ key: "system.initiative", mode, value: String(value) }] }]
});
{
  const t = mkTalent(5, "five", 1);
  runItem.call(t);
  check(t.effects[0].changes[0].value === "5",
    "five ranks of Combat Awareness is +5 Initiative, not +1 (the XP was already spent)",
    t.effects[0].changes[0].value);
}
{
  const t = mkTalent(1, "five", 1);
  runItem.call(t);
  check(t.effects[0].changes[0].value === "1", "one rank is unchanged");
}
{
  const t = mkTalent(9, "three", 1);
  runItem.call(t);
  check(t.effects[0].changes[0].value === "3", "ranks past the book's cap do not pay out", t.effects[0].changes[0].value);
}
{
  const t = mkTalent(3, "three", 5, 5 /* OVERRIDE */);
  runItem.call(t);
  check(t.effects[0].changes[0].value === "5", "an OVERRIDE change is not multiplied");
}
{
  const t = { type: "skill", system: { ranks: 3 }, effects: [] };
  runItem.call(t);
  check(t.system.effectiveRanks === undefined, "non-Talent Items are left alone");
}
{
  /* The purchase gate reads the same cap. */
  const owned = [{ name: "Tough", system: { ranks: 3 } }, { name: "Assassin", system: { ranks: 1 } }];
  const catalogue = [{ name: "Tough", rank: "three", requires: "", category: "Adventuring" },
    { name: "Assassin", rank: "three", requires: "", category: "Combat" }];
  globalThis.CONFIG = { TBE: CFG };
  const { blockedReason } = TBE.talentEligibility(catalogue, new Set(["tough", "assassin"]), "Human", [], { ownedItems: owned });
  check(/maximum of 3/.test(blockedReason(catalogue[0]) || ""),
    "a fourth purchase of a three-times Talent is refused before its XP is totalled", blockedReason(catalogue[0]));
  check(blockedReason(catalogue[1]) === null, "a second purchase of the same Talent is still allowed");
  const noItems = TBE.talentEligibility(catalogue, new Set(["tough"]), "Human", []);
  check(noItems.blockedReason(catalogue[0]) === null, "callers that pass no items keep the old behaviour");
}
check(/rankState\(t\)/.test(read("macros/tbe-talents.js")),
  "TBE: Talents shows how many of the allowed ranks are taken");

/* ---------------------------------------------------------------- 3. Haggle */
section("Haggle settles the price");
const haggleSrc = read("macros/tbe-haggle.js");
/* Same note as tier3's Weave Scar: the write goes through the permission
   owner now (v0.38.0), and a settlement that cannot be written says so rather
   than reporting coin that never moved. */
check(/TBE\.write\(me, \{ "system\.silver": after \}/.test(haggleSrc), "the settled price moves real coin");
check(/wCoin\.ok/.test(haggleSrc), "...and an unwritable settlement is reported, not claimed");
check(/buying && finalPrice > before/.test(haggleSrc) && /short by/.test(haggleSrc),
  "buying beyond the purse is refused, not silently clamped to 0 by the schema's min");
check(/name="settle" checked/.test(haggleSrc), "settling is offered, and on by default");
check(/type === "character"/.test(haggleSrc), "only characters have silver, so only they are settled against");

/* ---------------------------------------------------------------- 4. Riders */
section("Maneuver riders say what they cost");
const attackSrc = read("macros/tbe-attack.js");
check(/carry: "<b>-20 to " \+ target\.name/.test(attackSrc), "Unbalance prints its -20 against the named target");
check(/Not an Endurance roll to resist Shock/.test(attackSrc) && /do not stack/.test(attackSrc),
  "with both of the book's conditions on it (p.163)");
check(/foe must ALREADY be disadvantaged/.test(attackSrc) && !/effect: "disadvantaged"/.test(attackSrc),
  "Compel Surrender no longer paints a Disadvantaged status it does not inflict (p.164)");
check(/Willpower/.test(attackSrc) && /-10 per 3 DoS/.test(attackSrc),
  "and asks for the Willpower roll the maneuver actually calls for");
/* The ladder is Minute..Medium(5) Large Huge Massive Gargantuan Colossal, so
 * "more than two Sizes larger" than a Medium attacker starts at Massive. */
check(TBE.sizeEffects("Medium", "Massive").maneuversBlocked.includes("lock"),
  "Lock is blocked against a target 3+ Sizes larger (p.163), which was never enforced",
  TBE.sizeEffects("Medium", "Massive").maneuversBlocked);
check(!TBE.sizeEffects("Medium", "Huge").maneuversBlocked.includes("lock"),
  "but allowed against one exactly two Sizes larger");
{
  const unbalanced = { statuses: new Set(["tbe-unbalanced"]), effects: [] };
  const note = TBE.riderNote(unbalanced);
  check(/-20/.test(note) && /Not applied for you/.test(note),
    "a roll dialog shows an active rider's number and says it is not applied for you");
  check(TBE.riderNote({ statuses: new Set(), effects: [] }) === "", "and shows nothing when there is nothing riding");
  check(TBE.riderNote(null) === "", "and survives no actor at all");
}
/* tbe-clocks was on this list until v0.28.0, when it stopped being a roll
   dialog: it and TBE: Extended Roll were the same rule against two different
   stores, so it was retired into a one-shot migrator and Extended Roll -- still
   listed here -- kept the rolling. */
const dialogs = ["tbe-skill-roll", "tbe-opposed-roll", "tbe-extended-roll", "tbe-haggle",
  "tbe-attack", "tbe-quick-combat"];
const missing = dialogs.filter((f) => !/TBE\.riderNote\(/.test(read("macros/" + f + ".js")));
check(missing.length === 0, "every roll dialog that shows encumbrance also shows riders", missing);

/* ---------------------------------------------------------------- 5. Build Character */
section("Build Character stops looking like the whole chapter");
const panelSrc = read("macros/tbe-solo-panel.js");
check(!/"TBE: Build Character"/.test(panelSrc.replace(/\/\*[\s\S]*?\*\//g, "")),
  "it is no longer offered in the Solo Panel beside the Wizard");
check(/"TBE: Character Wizard"/.test(panelSrc), "the Wizard still is");
const bcSrc = read("macros/tbe-build-character.js");
check(/This is the quick path, not the whole chapter/.test(bcSrc) && /warning \+ content/.test(bcSrc),
  "and it says what it skips before it builds anything, not in the notes afterwards");

/* ---------------------------------------------------------------- mutation guard */
section("Mutation guard (each of these must be caught)");
{
  const a = mkActor(10, [{ bulk: 7, equipped: true }]);
  runDerive.call(a);
  const wrong = a.system.armorInitPenalty === 2; /* would be floor(7/3), not ceil */
  check(!wrong, "rounding the armor penalty down instead of up would be caught", a.system.armorInitPenalty);
}
{
  const t = mkTalent(4, "three", 1);
  runItem.call(t);
  check(t.effects[0].changes[0].value !== "4", "scaling past the cap would be caught");
}
{
  const legacyNote = TBE.riderNote({ statuses: new Set(["tbe-unbalanced"]), effects: [] });
  check(legacyNote.includes("-20"), "dropping the number from the rider note would be caught");
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
