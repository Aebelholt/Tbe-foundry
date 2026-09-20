/* pending_check.mjs — "still to choose", the panel that names every grant the
 * character has been given and has not yet claimed.
 *
 * WHY IT EXISTS. TBE: Character Wizard hands out grants across fifteen steps
 * and, before v0.40.0, said nothing when one went unclaimed. That is the
 * failure class `phase5_check.mjs` was written for: every step does exactly
 * what it says, every script is green, and the player ends up with a character
 * quietly missing a Talent the book gave them. The idea is borrowed from the
 * standalone Tapestry tool's `computePendingChoices()`.
 *
 * WHAT THIS CHECK IS MOSTLY ABOUT. Not "does it find the missing pick" -- that
 * is the easy half. It is **does it stay silent when nothing is missing**.
 * CLAUDE.md rule 6 cuts both ways: a panel that nags about a decision the
 * player has already made, or that the book never gave them, trains them to
 * ignore it, and an ignored warning panel is worth less than no panel at all.
 * So the completed-draft case below is the one that matters most.
 *
 * It executes the real method, sliced out of the macro, against drafts built
 * by hand -- rather than reading the source and concluding it looks right,
 * which is what CLAUDE.md rule 9 and the v0.34.0 visibility bugs are about.
 *
 * Run: node pending_check.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");

let pass = 0, fail = 0;
const ok = (cond, label, got) => {
  if (cond) pass++;
  else { fail++; console.log("  FAIL  " + label + (got === undefined ? "" : "  <- " + JSON.stringify(got))); }
};
const section = (t) => console.log("\n" + t);

const SRC = read("macros/tbe-character-wizard.js");

/* ---- slice the real method out, brace-matched ------------------------- */
function sliceMethod(src, signature) {
  const start = src.indexOf(signature);
  if (start === -1) throw new Error("method not found: " + signature);
  let i = src.indexOf("{", start), depth = 0;
  for (; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") { depth--; if (!depth) return src.slice(start, i + 1); }
  }
  throw new Error("unbalanced braces in " + signature);
}

const METHOD = sliceMethod(SRC, "pendingChoices() {");
const PANEL = sliceMethod(SRC, "_pendingHtml() {");

/* Build a `this` that supplies exactly the collaborators the method is
   allowed to use. Anything it reaches for that is not here will throw, which
   is itself the assertion that it does not quietly grow a dependency. */
function makeWizard({ draft = {}, race = { name: "Human" }, raceChoices = {},
                      caster = false, pattern = "none", usesHumanCulture = false,
                      steps = null } = {}) {
  const ALL_STEPS = [
    { key: "concept" }, { key: "race" }, { key: "ability" }, { key: "attributes" },
    { key: "culture" }, { key: "life" }, { key: "career" }, { key: "skillPoints" },
    ...(caster ? [{ key: "magic" }] : []),
    { key: "rounding" }, { key: "talents" }, { key: "personality" }, { key: "review" }
  ];
  const w = {
    draft: Object.assign({
      raceSavvyPick: "", raceExpertisePick: "", raceBindPick: "",
      humanCultureName: "",
      abilityPicks: [null, null], abilityExpertise: [null, null],
      abilityTalent: [null, null], abilityDescriptor: [null, null],
      roSavvy: [null, null, null],
      trueName: "", bindExpertise: "", threadAttunement: ""
    }, draft),
    steps: () => steps || ALL_STEPS,
    race: () => race,
    raceChoices: () => Object.assign(
      { choosesSavvy: false, extraExpertise: false, bindBonus: false, extraTalent: false }, raceChoices),
    usesHumanCulture: () => usesHumanCulture,
    isCaster: () => caster,
    pattern: () => pattern
  };
  w.pendingChoices = new Function("return function " + METHOD.replace(/^pendingChoices/, ""))().bind(w);
  w._pendingHtml = new Function("return function " + PANEL.replace(/^_pendingHtml/, ""))().bind(w);
  return w;
}

const labels = (w) => w.pendingChoices().map((p) => p.label);
const stepKeys = (w) => w.pendingChoices().map((p) => p.stepKey);

/* =====================================================================
 * 1. The case that matters most: a finished draft says NOTHING.
 * ===================================================================== */
section("1. Silence when nothing is owed (rule 6 cuts both ways)");
{
  const done = makeWizard({
    race: { name: "Human" },
    raceChoices: { choosesSavvy: true, extraExpertise: true, extraTalent: true },
    usesHumanCulture: true,
    draft: {
      raceSavvyPick: "Stealth", raceExpertisePick: "Might",
      humanCultureName: "Westronne",
      abilityPicks: ["Brawn", "Wits"],
      abilityExpertise: ["Might", "Lore"],
      abilityTalent: ["Tough", "Quick Study"],
      abilityDescriptor: ["Burly", "Sharp"],
      roSavvy: ["Athletics", "Stealth", "Perception"]
    }
  });
  ok(done.pendingChoices().length === 0, "a fully-decided draft reports nothing", labels(done));
  ok(done._pendingHtml() === "", "and the panel renders as nothing at all, not an empty box");

  /* A race with no grants must not be told it has unclaimed ones. */
  const plain = makeWizard({ race: { name: "Dwarf" }, raceChoices: {},
    draft: { abilityPicks: ["Brawn", "Wits"], abilityExpertise: ["a", "b"],
             abilityTalent: ["c", "d"], abilityDescriptor: ["e", "f"],
             roSavvy: ["x", "y", "z"] } });
  ok(plain.pendingChoices().length === 0, "a race with no choice-grants is not nagged", labels(plain));
}

/* =====================================================================
 * 2. Racial grants follow raceChoices(), not race names.
 * ===================================================================== */
section("2. Racial grants come from the detector that owns them");
{
  const w = makeWizard({ race: { name: "Ogre" }, raceChoices: { choosesSavvy: true, bindBonus: true } });
  const got = labels(w);
  ok(got.some((l) => /bonus Savvy/.test(l) && /Ogre/.test(l)), "an unclaimed Savvy pick is named, with the race", got);
  ok(got.some((l) => /Bind/.test(l)), "so is an unclaimed Bind bonus", got);
  ok(!got.some((l) => /Expertise level/.test(l)),
    "but a grant this race does NOT have is never invented", got);
  ok(stepKeys(w).filter((k) => k === "race").length >= 2, "and they point at the Race step", stepKeys(w));

  /* Claimed ones drop out one at a time. */
  const half = makeWizard({ race: { name: "Ogre" }, raceChoices: { choosesSavvy: true, bindBonus: true },
    draft: { raceSavvyPick: "Stealth" } });
  /* Scope the assertion to the RACIAL grants. This draft also has unpicked
     Ability Scores and Rounding Out Savvy slots, which are correctly reported
     and are not what is under test here -- an earlier version of this check
     matched /bonus Savvy/ across every item and failed on the Rounding Out
     line, which would have read as a bug in working code. */
  const raceItems = half.pendingChoices().filter((p) => p.stepKey === "race").map((p) => p.label);
  ok(!raceItems.some((l) => /bonus Savvy/.test(l)), "claiming one removes exactly that one", raceItems);
  ok(raceItems.some((l) => /Bind/.test(l)), "and leaves the other alone", raceItems);

  /* Whitespace is not a decision. */
  const spaces = makeWizard({ raceChoices: { choosesSavvy: true }, draft: { raceSavvyPick: "   " } });
  ok(labels(spaces).some((l) => /Savvy/.test(l)), "a field holding only spaces still counts as unchosen");
}

/* =====================================================================
 * 3. The Ability Score step's sub-selects, which have no blank option.
 * ===================================================================== */
section("3. Ability Scores: an unvisited step reads as a complete one");
{
  const none = makeWizard({});
  ok(labels(none).filter((l) => /Pick Ability Score/.test(l)).length === 2,
    "both unchosen scores are named", labels(none));
  ok(!labels(none).some((l) => /Talent for/.test(l)),
    "but no Talent is demanded for a score that has not been picked yet", labels(none));

  /* THE REAL ONE. The Expertise/Talent/Descriptor selects carry no "(none)"
     option, so they LOOK filled the moment the score is chosen and stay null
     until the step is visited and read. That gap is invisible on screen. */
  const picked = makeWizard({ draft: { abilityPicks: ["Brawn", "Wits"] } });
  const got = labels(picked);
  ok(got.some((l) => /Talent for Brawn/.test(l)), "a picked score with a null Talent is surfaced", got);
  ok(got.some((l) => /Expertise skill for Wits/.test(l)), "so is a null Expertise", got);
  ok(got.some((l) => /descriptor for Brawn/.test(l)), "so is a null descriptor", got);
  const abilityItems = picked.pendingChoices().filter((p) => p.stepKey === "ability");
  ok(abilityItems.length === 6, "three each for two scores, and nothing more from that step", abilityItems.map((p) => p.label));
  ok(abilityItems.every((p) => p.stepKey === "ability"), "all of them point at the Ability step");
}

/* =====================================================================
 * 4. Step keys, and the conditional Magic step.
 * ===================================================================== */
section("4. A step that does not exist for this draft is never linked to");
{
  const warrior = makeWizard({ caster: false, draft: { trueName: "", bindExpertise: "", threadAttunement: "" } });
  ok(!stepKeys(warrior).includes("magic"), "a non-caster gets no Magic items", labels(warrior));
  ok(!labels(warrior).some((l) => /True Name|Thread|Bind takes/.test(l)),
    "not even by label", labels(warrior));

  const sw = makeWizard({ caster: true, pattern: "spellweaver" });
  const got = labels(sw);
  ok(got.some((l) => /True Name/.test(l)), "a Spellweaver is asked for a True Name", got);
  ok(got.some((l) => /Thread Die/.test(l)), "and the d8 Thread Die", got);
  ok(got.some((l) => /Expertise level/.test(l)), "and which Bind takes Expertise", got);

  /* A Fade is a caster with a True Name but no Spellweaver-only picks. */
  const fade = makeWizard({ caster: true, pattern: "fade" });
  ok(labels(fade).some((l) => /True Name/.test(l)), "a Fade is asked for a True Name too");
  ok(!labels(fade).some((l) => /Thread Die/.test(l)),
    "but not for Spellweaver-only picks", labels(fade));

  /* Every emitted step key must exist in the step list, or the link is dead. */
  for (const w of [warrior, sw, fade, makeWizard({ raceChoices: { choosesSavvy: true } })]) {
    const keys = w.steps().map((s) => s.key);
    ok(stepKeys(w).every((k) => keys.includes(k)), "every item points at a step that exists", stepKeys(w));
  }
}

/* =====================================================================
 * 5. Rounding Out's three Savvy picks count down.
 * ===================================================================== */
section("5. Partial progress is reported as partial");
{
  const zero = makeWizard({});
  ok(labels(zero).some((l) => /3 remaining bonus Savvy skills/.test(l)), "three left", labels(zero));
  const two = makeWizard({ draft: { roSavvy: ["Stealth", null, null] } });
  ok(labels(two).some((l) => /2 remaining bonus Savvy skills/.test(l)), "two left", labels(two));
  const one = makeWizard({ draft: { roSavvy: ["Stealth", "Athletics", null] } });
  ok(labels(one).some((l) => /1 remaining bonus Savvy skill\b/.test(l)),
    "one left, and singular", labels(one));
  const all = makeWizard({ draft: { roSavvy: ["a", "b", "c"], abilityPicks: ["x", "y"],
    abilityExpertise: ["1", "2"], abilityTalent: ["3", "4"], abilityDescriptor: ["5", "6"] } });
  ok(!labels(all).some((l) => /Savvy/.test(l)), "none left, so nothing is said", labels(all));
}

/* =====================================================================
 * 6. The panel itself.
 * ===================================================================== */
section("6. The panel says what it is and what it is not");
{
  const w = makeWizard({ raceChoices: { choosesSavvy: true } });
  const html = w._pendingHtml();
  ok(/Still to choose/.test(html), "it is titled");
  ok(/data-pending-step="1"/.test(html), "and links carry the INDEX of the owning step, resolved now");
  ok(/Nothing here blocks Create Character/.test(html),
    "and it says plainly that it is advice, not a gate -- rule 6");

  /* The index must be resolved against the CURRENT step list. For a caster
     the Magic step shifts every later step along by one, and a stored index
     would land on the wrong page. */
  const swPanel = makeWizard({ caster: true, pattern: "spellweaver" })._pendingHtml();
  const idx = Number(/data-pending-step="(\d+)"/.exec(swPanel)?.[1]);
  const casterKeys = makeWizard({ caster: true }).steps().map((s) => s.key);
  ok(casterKeys[idx] !== undefined, "a caster's link resolves to a real step", { idx, key: casterKeys[idx] });
}

/* =====================================================================
 * 7. Ownership: it defers rather than re-deriving.
 * ===================================================================== */
section("7. It asks the detectors that already own each grant");
{
  const codeOf = (t) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const body = codeOf(METHOD);
  ok(/this\.raceChoices\(\)/.test(body), "racial grants come from raceChoices()");
  ok(/this\.usesHumanCulture\(\)/.test(body), "the homeland table from usesHumanCulture()");
  ok(/this\.isCaster\(\)/.test(body), "magic from isCaster()");
  ok(/this\.steps\(\)/.test(body), "and the step list from steps()");
  /* The tell for a re-derivation: deciding a grant from a race NAME. */
  ok(!/raceName\s*===|name\s*===\s*["'](Human|Ogre|Dwarf|Elf)["']/.test(body),
    "and it never decides a grant by comparing a race name");
}

/* =====================================================================
 * 8. Mutations.
 * ===================================================================== */
section("8. Mutations");
{
  /* 8a. Drop the step-existence filter and a Warrior is told to pick a
     Thread Die on a step that is not in their wizard. */
  const leaky = makeWizard({ caster: false });
  const leakyBody = METHOD.replace(
    "const add = (label, stepKey) => { if (keys.indexOf(stepKey) > -1) out.push({ label, stepKey }); };",
    "const add = (label, stepKey) => { out.push({ label, stepKey }); };");
  ok(leakyBody !== METHOD, "the mutation actually changed the source");
  leaky.pendingChoices = new Function("return function " + leakyBody.replace(/^pendingChoices/, ""))().bind(leaky);
  /* isCaster() is still false, so the magic block is skipped either way --
     which is the point: the filter is a SECOND guard, and the check proves
     the first one is doing the work rather than assuming. */
  ok(leaky.pendingChoices().every((p) => p.stepKey !== "magic"),
    "MUTATION: isCaster() alone already keeps magic items away from a Warrior");

  /* A caster whose Magic step was somehow absent must not be linked to it. */
  const odd = makeWizard({ caster: true, pattern: "spellweaver",
    steps: [{ key: "concept" }, { key: "race" }, { key: "ability" }, { key: "rounding" }] });
  ok(odd.pendingChoices().every((p) => p.stepKey !== "magic"),
    "MUTATION: and the step filter catches the case where the two disagree",
    odd.pendingChoices().map((p) => p.stepKey));

  /* 8b. A blank() that treats "" as decided would silence real gaps. */
  const naiveBlank = (v) => v === null || v === undefined;
  ok(naiveBlank("") === false && naiveBlank("   ") === false,
    "MUTATION: a null-only blank test would call an empty string 'chosen'");
  const real = makeWizard({ raceChoices: { choosesSavvy: true }, draft: { raceSavvyPick: "" } });
  ok(labels(real).some((l) => /Savvy/.test(l)),
    "...while the shipped one still reports it");
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
