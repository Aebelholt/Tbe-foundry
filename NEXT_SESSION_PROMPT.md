# Prompt: finish The Broken Empires Foundry system

Paste this into a fresh session with the repo attached (`aebelholt/tbe-foundry`,
branch `claude/exciting-lamport-xqq87z`, or the attached source zip).

---

You are picking up the Foundry VTT system for *The Broken Empires* RPG. It is
about 70% of the way to a release a stranger can install and play. Before you
change anything, read `CLAUDE.md` in full (the rules of the house), then
`HANDOFF.md`, `ROADMAP.md` and the top of `BACKLOG.md`. CLAUDE.md overrides
your defaults. Its three hardest rules:

1. **Probe before build.** Every number, formula or rule wording is checked
   against the rulebook text at `/tmp/tbe.txt` before it goes into code. If
   that file is missing, ask for it (the HTML rulebook lives in the claude.ai
   TBE project; strip the tags). Never reconstruct a rule from memory.
2. **One owner per rule.** Shared logic lives in `system/the-broken-empires/module/`,
   exposed on `game.thebrokenempires.*`; macros defer to it. Check
   `docs/ownership.md` first.
3. **Nothing that ships names the owner.** `grep -rnE "Seb|Aebelholt"
   system/the-broken-empires macros` must print nothing before any release.

Ship in batches: finish a batch, run every `*_check.mjs` plus `node simtest.js`
(51/51), bump `system.json` once, write one CHANGELOG entry, update BACKLOG,
build (`node build.js`, `node build_packs.mjs`), zip `system/the-broken-empires`,
boot the unpacked zip with `node boot_check.mjs <dir>`, commit, push. Deliver
only `The-Broken-Empires-System.zip`.

## Where it stands (2026-10-23)

- **Released: v0.55.0.** Create Character window (ApplicationV2, the book's
  12 steps, live sheet), the old Wizard/Finish/Build retired and redirected,
  table defaults (linked and sighted Character tokens, locked rotation, scene
  vision), stranded-token rescue and TBE: Link Character Tokens, the portrait
  roster, imported oracle tables (TBE: Import Oracle Tables, TBE: Oracle
  Tables, Random Events can use them).
- **Committed, not released (CHANGELOG "Unreleased"):** oracle table titles
  keep capitals after an opening quote; Sheet Exchange reads Character
  Creator v0.7.0 (same layout as v0.6.5, now a fixture), an unnamed
  "Native Languge" slot imports as "Native Language" with a note, a Savvy
  "*" on a Strand name is stripped.
- **Checks:** 40+ scripts, all green. Phases 0, 1 and 4 done; 3 and 6 well
  advanced; 2 and 5 partial; 7 started.
- **The biggest risk:** everything from v0.52.0 on has only run behind
  stand-ins (`test-fixtures/appv2_shim.js`, stub worlds), never in a real
  Foundry V12, V13 or V14.

## Remaining work, in order

### 1. Prove it in real Foundry (Phase 5/7)
Build **TBE: Table Smoke Test** (GM macro, plus a `smoke_check.mjs` that runs
it against a stub world). It exercises each real-Foundry surface on throwaway
documents, deletes them, and posts one pass/fail card with the Foundry
version:
- DialogV2.prompt (new-actor name), the file input in a DialogV2 form
- preCreateActor/Token/Scene defaults landing; `token.delta.toObject()`;
  `linkToken` keep-token and keep-actor
- FilePicker by shape (`foundry.applications.apps.FilePicker.implementation`
  vs global) and the portrait roster
- RollTable create/update with results in the schema found (`name`/
  `description` vs `text`); `table.roll({roll})` with a modifier
- the Create Character window opening and rendering step 1; the shop dialog
- `CONFIG.statusEffects` shape and the combatant initiative formula
The owner runs it on V12 and V13+ and reports the card. Fix what it names,
then the user plays one session end to end (build, combat, wounds, cast,
import `mythic_tables.json`, Random Events) and you fix what they find.

### 2. Shared chat cards two people can click (scope rule 3)
Nothing guards a card button against a player and the GM clicking at once.
Before any card gets an action button (apply damage, accept a result),
build the owner: a message-flag claim (`flags.the-broken-empires.claimed`,
set by the first click, re-read before acting, GM-routed when the clicker
cannot update the message), a check that runs two clicks concurrently
against a stub, and a mutation that removes the claim. The Zweihander
pattern is logged in BACKLOG's prior-art section.

### 3. Close small open items (Phase 2/3)
- Create Character: "Spread what is left" can pour points into a skill
  already at 70; skip capped skills (owner: `module/chargen/`).
- `derive()` still takes `applyAbilityScore`, `raiseExpertise`,
  `talentNamed` from the macro library as parameters; give them a
  system-side owner the library defers to (`chargen/rules.mjs`), with an
  equality sweep like `creator_check.mjs` section 1.
- `funnel_roster_check.mjs`: run the real TBE: Funnel Roster against a
  stub world (it is the only dialog macro with no behavioural check).
- A guard check: no `flags.tbe.` write outside migration and the Salt-Run
  adventure.
- The eight private `esc()` copies in macros: replace with `TBE.esc` only
  when another change takes you into those files.
- Extended Roll / Opposed Roll / Chase modifier boxes: decide from p.18
  whether they should get the Task Modifier buttons (opposed rolls take
  none); log the answer either way.

### 4. Release readiness (Phase 7, needs the owner's decisions)
- Hosting: a public home for `manifest`, `download`, `url`, `bugs` in
  `system.json` (`authors` stays empty by choice).
- Publishing rights for the book text the release carries (Talent text,
  218 miracles, bestiary). The README Licence section says what ships;
  the owner must clear it with Evil Baby Entertainment or the content
  ships as reference stubs.
- One install into a clean Foundry by someone who has never seen it.

### 5. Optional, only if asked
- Oracle: a Fate Chart and Chaos Factor for Ask the Weave, if the owner
  transcribes them into the same JSON (the importer reads by shape; the
  system still ships no oracle content).
- The `tbe-unofficial` Foundry module (Drive folder owned by burnzy1994):
  its files were not visible to this account. If the owner uploads it,
  check the licence first, then compare features; never paste code from it.
- The `_derived` namespace for computed actor fields (CLAUDE.md rule 11):
  real but wide; only as its own batch.

## What 100% means
The phase table in ROADMAP.md, all "done": a stranger installs the zip from
a URL, makes a character, plays a session with a GM and players on separate
clients, and nothing punishes a reasonable action or needs the console.

## What to ask the owner for
The rulebook dump if `/tmp/tbe.txt` is missing; smoke-test cards from real
Foundry; the hosting and publishing decisions in section 4. Ask one question
at a time, keep replies short, and no em-dashes in anything you write for them.
