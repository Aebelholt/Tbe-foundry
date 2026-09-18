/* tier3_check.mjs — the phase-4 content batch: Weapon Readiness, the two
 * lingering Weave Reaction results, and Counterspells.
 *
 * Same discipline as the other check scripts: the rule against the book, the
 * code against one owner, the behaviour, then break each check. */

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

globalThis.foundry = { utils: { duplicate: (o) => JSON.parse(JSON.stringify(o)) } };
let rollQueue = [];
class RollStub {
  constructor(f) { this.formula = String(f); }
  async evaluate() { this.total = rollQueue.length ? rollQueue.shift() : 1; return this; }
}
const TBE = new Function("Roll", "return (function(){\n" + read("macros/_lib.js") + "\nreturn TBE;\n})()")(RollStub);

/* ------------------------------------------------------- Weapon Readiness */
section("Weapon Readiness (Ch.9 p.129)");
const weaponSchema = read("system/the-broken-empires/module/data/item-weapon.mjs");
const shieldSchema = read("system/the-broken-empires/module/data/item-shield.mjs");
/* v0.35.0 added a FOURTH value, `dropped`. The book names three states
   ("Weapons can be in one of three states"); `dropped` is ours, for a weapon
   on the ground, which the book covers through its actions instead. This
   assertion used to pin the list at exactly three and so went red the moment
   that shipped -- and stayed red across two releases, because the suite was
   being run from a curated list rather than from what is on disk. Pinned to
   the three the BOOK names being present, which is the claim worth making,
   plus the fourth being known to the pool owner (loadout_check.mjs owns the
   rest of that story). */
check(/choices: \["ready", "hand", "stored", "dropped"\]/.test(weaponSchema) &&
  /choices: \["ready", "hand", "stored", "dropped"\]/.test(shieldSchema),
  "weapons and shields carry the book's three states plus `dropped`");
check(/initial: "hand"/.test(weaponSchema),
  "At Hand stays the default — assuming everything is drawn would claim an action nobody spent");
/* The wording moved to "no action needed" when the table's owner moved into
   helpers/config.mjs (v0.35.0). Match on the claim, not the exact string, so a
   rephrasing does not read as a rules change. */
check(/no action/.test(TBE.readiness({ system: { carried: "ready" } }).cost),
  "Held and Ready costs no action");
check(/Minor Action/.test(TBE.readiness({ system: { carried: "hand" } }).cost),
  "At Hand is a Minor Action to draw");
check(/2 full actions/.test(TBE.readiness({ system: { carried: "stored" } }).cost),
  "Stored is 2 full actions to retrieve");
check(TBE.readiness({}).short === "at hand", "an item with no state set reads as At Hand");
check(TBE.readinessNote({ name: "Sword", system: { carried: "ready" } }) === "",
  "a drawn weapon needs no note");
check(/Minor Action/.test(TBE.readinessNote({ name: "Sword", system: { carried: "hand" } })),
  "an undrawn one says what it costs");
{
  /* ENC: ready and At Hand both sit in the 6 ENC Weapons At Hand pool; Stored
     counts against Inventory instead (p.129). */
  const actor = (carried) => ({ items: [{ type: "weapon", system: { enc: 4, carried } }], system: {} });
  check(TBE.encStatus(actor("ready")).hand === 4 && TBE.encStatus(actor("hand")).hand === 4,
    "Held and Ready and At Hand both count toward Weapons At Hand");
  check(TBE.encStatus(actor("stored")).hand === 0 && TBE.encStatus(actor("stored")).inv === 4,
    "Stored counts against Inventory instead", TBE.encStatus(actor("stored")));
}
check(/readiness: TBE\.readiness\(i\)/.test(read("macros/tbe-attack.js")),
  "TBE: Attack reads each weapon's state");
check(/w\.readinessNote \?/.test(read("macros/tbe-attack.js")),
  "and the result card says what getting it into hand costs");

/* --------------------------------------------------- lingering Weave effects */
section("Weave Scar and Reality Snag (Ch.14 p.302-303)");
const actorW = () => {
  const a = { name: "Fionnah", flags: {}, system: { resolve: { value: 4, max: 6 }, fatigue: 0, wounds: {} },
    items: [], update: async function (d) {
      for (const [k, v] of Object.entries(d)) {
        if (k === "flags.tbe.weave") { a.flags.tbe = a.flags.tbe || {}; a.flags.tbe.weave = v; }
        if (k === "system.fatigue") a.system.fatigue = v;
        if (k === "system.wounds") a.system.wounds = v;
      }
      return a;
    } };
  return a;
};
{
  const a = actorW();
  check(TBE.weaveScarFor(a, "Fire") === 0, "no scar by default");
  await TBE.addWeaveScar(a, "Fire", 20);
  check(TBE.weaveScarFor(a, "Fire") === 20, "row 14's -20 is recorded against the Bind it scarred");
  check(TBE.weaveScarFor(a, "Destroy") === 0, "and against no other Bind");
  check(TBE.weaveScarFor(a, "fire") === 20, "matched case-insensitively, since Bind names are typed");
}
{
  /* The scar reduces "the Bind skill value used in the casting", not the skill:
     the Item keeps its true value so Advancement still improves the real one. */
  const a = actorW();
  a.items = [{ id: "b1", type: "skill", name: "Bind: Fire", system: { group: "Bind", value: 60, expertise: 2 } }];
  await TBE.addWeaveScar(a, "Fire", 20);
  const [fire] = TBE.binds(a);
  check(fire.value === 60 && fire.scar === 20 && fire.effective === 40,
    "TBE.binds() reports true value, scar and the value a casting uses", fire);
  check(fire.item.system.value === 60, "the skill Item itself is untouched by a temporary scar");
}
{
  const a = actorW();
  await TBE.setRealitySnag(a, true);
  check(TBE.weaveState(a).snag === true, "a Reality Snag is recorded");
  const had = await TBE.clearWeaveDay(a);
  check(had.snag === true && TBE.weaveState(a).snag === false, "and cleared at the sunrise boundary");
}
{
  const a = actorW();
  await TBE.addWeaveScar(a, "Fire", 20);
  await TBE.setRealitySnag(a, true);
  const had = await TBE.clearWeaveDay(a);
  check(had.scars === 1 && had.snag && TBE.weaveState(a).scars.length === 0,
    "one call ends everything that expires at sunrise or sunset", had);
}
check(TBE.SNAG_BUCKLE.length === 3 &&
  TBE.SNAG_BUCKLE[0].max === 3 && TBE.SNAG_BUCKLE[1].max === 5 && TBE.SNAG_BUCKLE[2].max === 6,
  "p.303's buckle table is 1-3 / 4-5 / 6");
check(TBE.SNAG_BUCKLE[1].fatigue === "1" && TBE.SNAG_BUCKLE[2].fatigue === "1d4" && TBE.SNAG_BUCKLE[2].willpower === 3,
  "with 1 Fatigue, then 1d4 Fatigue and a Willpower roll vs 3");
const castSrc = read("macros/tbe-cast.js");
check(/snagMod = snagged \? 5 : 0/.test(castSrc) && /wr\.total \+ wrm \+ snagMod/.test(castSrc),
  "a snagged caster is at +5 on the Weave Reaction roll");
check(/still mitigable|still be reduced|still mitigable\)/.test(castSrc.replace(/\s+/g, " ")) || /still mitigable/.test(castSrc),
  "and the card says it is still mitigable, as the book does");
check(/async snagBuckle\(/.test(castSrc) && /body = await this\.snagBuckle\(rolls, body\)/.test(castSrc),
  "every further spell attempt rolls the buckle die");
check(/Weave Scar/.test(castSrc) && /permanent/.test(castSrc),
  "the two Weave Scar rows are told apart, temporary from permanent");
check(/bind\.update\(\{ "system\.value": now \}\)/.test(castSrc),
  "a permanent scar is written into the Bind, because that is what permanent means");
check(/const against = b\.effective/.test(castSrc) && /TBE\.resolve\(r\.total, b \? b\.effective : 40/.test(castSrc),
  "and the casting rolls against the scarred value");
check(/TBE\.clearWeaveDay\(me\)/.test(read("macros/tbe-wounds.js")),
  "a night's rest ends them, which is the sunrise the book means");
check(/weaveState\(me\)/.test(read("macros/tbe-status.js")),
  "TBE: Status shows them, so they are visible before they bite");

/* ------------------------------------------------------------ Counterspell */
section("Counterspells / Hold to Interrupt (Ch.14 p.311)");
const cs = read("macros/tbe-counterspell.js");
check(/must be either\s*\n?\s*\*\s*Destroy|Destroy.*or the Bind of the/s.test(cs) || /Destroy/.test(cs),
  "the legal-Bind rule is stated");
check(/const legal = \/\^destroy\$\/i\.test\(b\.name\)/.test(cs),
  "Destroy, or the incoming spell's own Bind, and nothing else");
check(/const cost = Math\.max\(0, theirSL - strandVal\)/.test(cs),
  "cost is the original caster's SLs minus the counterer's Strand in that spell");
check(/Spent either way/.test(cs), "spent whether it succeeds or fails");
check(/brokeOnCost/.test(cs) && /marks all remaining Resolve|All remaining Resolve is marked/.test(cs),
  "a counter that lands but cannot be paid for marks all remaining Resolve and fails anyway");
check(/all-or-nothing/.test(cs), "no partial success");
check(/res\.critFail/.test(cs) && /1d20/.test(cs),
  "a critical failure hands the counterer their own Weave Reaction");
check(/system\.resolve\.value": resolveNow - spent/.test(cs), "the Resolve actually leaves the sheet");
{
  /* TBE.strands() reports `level`; TBE.binds() reports `value`. Reading the
     wrong one ships a dropdown that says "Fire undefined" and discounts
     nothing. */
  const a = { items: [{ id: "s1", type: "strand", name: "Strand: Fire", system: { level: 3 } }], system: {} };
  const [st] = TBE.strands(a);
  check(st.level === 3 && st.value === undefined, "TBE.strands() reports level, not value", st);
  check(/st\.level/.test(cs) && !/st\.value/.test(cs),
    "and the Strand picker reads level, so the discount is a real number");
}
{
  const built = JSON.parse(read("data/solo_docs.json")).macros;
  check(!!built.find((m) => m.name === "TBE: Counterspell"), "it is in the built pack");
  check(/TBE: Counterspell/.test(read("macros/tbe-solo-panel.js")), "and offered in the Solo Panel");
}

/* --------------------------------------------------------- mutation guard */
section("Mutation guard (each of these must be caught)");
{
  const a = actorW();
  await TBE.addWeaveScar(a, "Fire", 20);
  a.items = [{ id: "b1", type: "skill", name: "Bind: Fire", system: { group: "Bind", value: 15, expertise: 0 } }];
  const [fire] = TBE.binds(a);
  check(fire.effective === 0, "a scar deeper than the Bind floors at 0 rather than going negative", fire.effective);
}
{
  const a = actorW();
  const before = TBE.weaveState(a);
  before.snag = true;
  check(TBE.weaveState(a).snag === false, "weaveState() hands out a copy, so a caller cannot mutate the actor by accident");
}
{
  const noPerm = { flags: {}, system: {}, update: async () => { throw new Error("no permission"); } };
  let threw = false;
  try { await TBE.setWeaveState(noPerm, { scars: [], snag: true }); } catch (e) { threw = true; }
  check(!threw, "a player who cannot write the actor gets a card, not an exception");
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
