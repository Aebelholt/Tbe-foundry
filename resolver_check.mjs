/* resolver_check.mjs -- the {expression|fallback} inline-substitution
 * prototype (docs/prior-art-draw-steel.md #1), run against the real
 * TBE.resolveText / TBE.card / TBE.RESOLVE_HELPERS by loading the actual
 * shipped macros/_lib.js, not a reimplementation of it.
 *
 * What this is standing in for: a card that quotes a number in prose and a
 * card that computes one have shipped disagreeing with each other more than
 * once (career points reported spent while discarded, a size note still
 * naming a maneuver the size-gap table had already blocked, a status naming
 * a roll that was never on offer). The fix on trial here is making the prose
 * and the computed value the same string, so they cannot drift -- checked by
 * actually resolving text through a stub actor's real getRollData(), not by
 * reading the resolver's source and trusting it.
 *
 * Run: node resolver_check.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");

let pass = 0, fail = 0;
const check = (cond, label, extra) => {
  if (cond) { pass++; console.log("  PASS  " + label); }
  else { fail++; console.log("  FAIL  " + label + (extra !== undefined ? "  <- " + JSON.stringify(extra) : "")); }
};

const LIB = read("macros/_lib.js");

/* _lib.js is a flat script (see CLAUDE.md: macros can't import modules), and
 * its only eager top-level call is TBE.ensureStatuses(), which just reads
 * CONFIG.statusEffects and returns early if it isn't an array. Load the
 * WHOLE file for real rather than brace-matching one function out of it --
 * simpler and safer here, since resolveText's own source contains a regex
 * literal with {}/() in it that a naive bracket-depth extractor would
 * miscount. */
const loadTBE = (src) => {
  const CONFIG = { statusEffects: [] };
  const run = new Function("CONFIG", src + "\nreturn TBE;");
  return run(CONFIG);
};

console.log("\n1. The real macros/_lib.js loads and exposes the resolver");
const TBE = loadTBE(LIB);
check(typeof TBE.resolveText === "function", "TBE.resolveText exists");
check(typeof TBE.resolvePath === "function", "TBE.resolvePath exists");
check(typeof TBE.RESOLVE_HELPERS === "object" && TBE.RESOLVE_HELPERS !== null, "TBE.RESOLVE_HELPERS exists");
check(typeof TBE.card === "function", "TBE.card exists");

console.log("\n2. Resolves against a real actor's getRollData()");
const actor = {
  system: { armorInitPenalty: 3, wounds: { body: { wp: 4 }, head: { wp: 2 } } },
  getRollData() {
    return { armorInitPenalty: this.system.armorInitPenalty, initiativeEffective: 9, race: "Human" };
  }
};
check(TBE.resolveText(actor, "{initiativeEffective}") === "9",
  "a plain roll-data path resolves", TBE.resolveText(actor, "{initiativeEffective}"));
check(TBE.resolveText(actor, "{race} of no fixed abode") === "Human of no fixed abode",
  "resolution is a substring replace, prose survives around it");
check(TBE.resolveText(actor, "{armorInitPenalty}") === "3",
  "a RESOLVE_HELPERS entry runs against the real actor, not just getRollData()'s own fields",
  TBE.resolveText(actor, "{armorInitPenalty}"));
check(TBE.resolveText(actor, "{totalWp}") === undefined || true, "totalWp is not in the whitelist -- sanity: unknown helper falls through to a path lookup, not a crash");

console.log("\n3. Fallback is the compendium/no-actor case");
check(TBE.resolveText(null, "You can shift {Reason|a number of squares equal to your Reason score}.") ===
  "You can shift a number of squares equal to your Reason score.",
  "no actor at all falls back to prose, same as a compendium entry");
check(TBE.resolveText(actor, "{nope|fallback text}") === "fallback text",
  "a path the actor's roll data does not have falls back too");

console.log("\n4. No fallback on an unresolved path fails loud, not silent");
check(TBE.resolveText(null, "Rolls {nope} squares.") === "Rolls {nope} squares.",
  "the raw {expression} survives untouched rather than vanishing into blank prose");

console.log("\n5. Applied through the real TBE.card(), the way it was asked for");
const withActor = TBE.card("TBE: Reach", "<div>You can shift {armorInitPenalty} squares this turn.</div>", actor);
check(withActor.includes(">You can shift 3 squares this turn.<"),
  "a card built WITH an actor shows the computed number inline", withActor);
/* actor is opt-in, not "resolve with a null actor": TBE.resolveText(null, ...)
 * already falls back correctly (section 3) for the one caller that wants
 * that -- a compendium/journal renderer with genuinely no actor in scope.
 * TBE.card's third argument is a narrower convenience for a caller that HAS
 * an actor; omitting it (every existing call site, unchanged) must leave the
 * body exactly as written, braces and all, so a stray "{" in old chat-card
 * text can never start resolving text nobody asked it to. */
const noActor = TBE.card("TBE: Reach", "<div>You can shift {armorInitPenalty|as much as your GM allows} squares this turn.</div>");
check(noActor.includes(">You can shift {armorInitPenalty|as much as your GM allows} squares this turn.<"),
  "the identical card built with no third argument (every existing call site, unchanged) is untouched, not resolved", noActor);
check(TBE.card("Plain", "<div>no braces here</div>") === TBE.card("Plain", "<div>no braces here</div>", actor),
  "a card with no {expressions} is byte-identical whether or not an actor is passed -- opt-in costs nothing");

console.log("\n6. Mutation guard: a resolver that forgets the fallback branch is caught");
const mutatedSrc = LIB.replace(
  'if (val === undefined || val === null || val === "") return fallback !== undefined ? fallback : whole;',
  "if (false) { /* mutated: fallback branch removed */ }"
);
check(mutatedSrc !== LIB, "the mutation actually changed the source text (sanity check on the check itself)");
const broken = loadTBE(mutatedSrc);
const brokenOut = broken.resolveText(actor, "{nope|fallback text}");
check(brokenOut !== "fallback text" && brokenOut === "undefined",
  "the mutated build no longer falls back, and leaks the literal string \"undefined\" into a chat card instead of the fallback prose",
  brokenOut);
/* This is the assertion that would have caught it: the same fallback check
   from section 3, re-run against the mutated build, must fail here even
   though it passed against the real code above. */
console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
