# The Broken Empires — Foundry VTT system

A native FoundryVTT (v11 target) system for the TTRPG *The Broken Empires*
(TBE), plus a companion macro pack. Two coexisting deliverables from one
repo:

- `system/the-broken-empires/` — the native Foundry system (Actor/Item
  DataModels, sheets, compendium packs). **This is what ships.** Build and
  deliver only `The-Broken-Empires-System.zip` (zip of this directory).
- The legacy CoC7-chassis macro pack (`TBE-Solo-Foundry-Pack.zip`,
  `pack/`, `output/TBE-*.js`, the standalone installer scripts at repo
  root) — tooling stays in place and `node build.js` still has to run
  (its `data/solo_docs.json` output feeds the native system's
  `tbe-macros` compendium), but **do not build or deliver its own
  outputs** (the zip, `output/*.js`, `TBE-Solo-Installer.js`) unless the
  user explicitly asks for the standalone-macro path again. Direct user
  steer: "I think we are going forward with the system zip model."

## No personal name in anything that ships

Seb's standing instruction (2026-09-27): their name stays out of the release.
Nothing under `system/the-broken-empires/` or `macros/` (which is built into
the `tbe-macros` pack) may name them: not `system.json` `authors`, not
`LICENSE.txt`, not a code comment, not the CHANGELOG. Refer to "the playtest
GM" or "the playtest world" instead. Repo-only files (this one, BACKLOG.md,
ROADMAP.md, HANDOFF.md) are not shipped and may keep using their name. Before
building a release: `grep -rnE "Seb|Aebelholt" system/the-broken-empires macros`
must print nothing.

## Scope: a GM and players at a table. Solo is a mode, not the premise.

**Changed 2026-09-17 by Seb, in his words: "this is no longer a solo module
in scope."** Solo play stays supported — the Solo Panel, the oracle tables and
Ask the Weave all keep working and are not deprecated — but it is no longer
what the system is designed *against*. The default assumption for every new
feature and every review is now a GM plus players, on separate clients, with
separate permissions, all watching the same chat log.

This is a standing constraint of the same weight as "Use Rules as Written
Always," and it invalidates a class of reasoning that was correct for years.
Anywhere the codebase reasons "the acting player is also the GM," that
reasoning is now a defect rather than a simplification. Three things follow,
and they should be checked on any change that touches chat, actors or state:

1. **Who can see this?** A card that a GM needs to keep private has to be
   able to be private. Under solo this did not matter, because there was one
   pair of eyes; the pre-v0.34.0 macro pack posted every one of its 59 chat
   cards publicly with no way to whisper, and the "hidden" Tolerance roll
   (p.251) was hidden only by never being displayed at all. See the chat
   visibility owner below.
2. **Who owns this actor?** A macro that writes to an actor is now often
   being run by someone who may not own it. Answered in v0.38.0:
   `module/rules/permission.mjs` owns the question, and `TBE.write(actor,
   changes, what)` is how a macro asks it. It returns `{ok, notice}` and the
   caller prints `notice` when `ok` is false. **Never write `try { await
   actor.update(...) } catch (e) {}`** — that was the shape of the actual bug,
   nine times over: the error was caught, dropped, and the chat card asserted
   the cost regardless, so the log claimed a spend that never happened and no
   one saw an error. An unguarded write is better than a hidden one. The answer
   for the unowned case is a sentence, not damage (rule 6).
3. **Can two clients do this at once?** A chat card with a button on it can
   be clicked by a player and the GM in the same second. Any action a shared
   card offers needs to be idempotent or guarded.

What has NOT changed: this is still a system that deliberately leaves
adjudication to a human, and multiplayer is not a licence to start automating
rulings. It is a licence to stop assuming the human is alone.

Sheets are thin, with one deliberate exception. Actor/Item DataModels are
pure data containers, and combat, wounds, casting and advancement all run
through the companion macro pack (`TBE: Attack`, `TBE: Wounds & Recovery`,
`TBE: Cast`, `TBE: Advancement`, and friends) rather than sheet-native
buttons.

**The exception, added in v0.31.0: clicking a skill on the sheet rolls it.**
This reverses what this paragraph used to say flatly, so it is worth being
explicit about why rather than letting the old sentence quietly become
false. Opening a macro, finding your skill in a dropdown and typing a
modifier is a bad way to teach someone the core mechanic on their first
roll; clicking the number in front of you is the obvious thing and it should
work. The dialog offers only what the book lets you change before a roll,
the Task Modifier table and a Favor/Resolve spend, both owned by
`module/rules/resolution.mjs`.

The line that has NOT moved: the sheet owns no rules. `_onSkillRoll` does
arithmetic (`base + task + favor x 10`) and nothing else, then hands the
result to the same `resolve()` every macro uses. If a sheet button ever
needs to *decide* something the book decides, that logic belongs in
`module/rules/`, exposed on `game.thebrokenempires.rules`, with the macro
pack deferring to it. A second implementation on a sheet is the same defect
as a second implementation in a macro.

## The one rule that matters most: probe before build

Every game-mechanic claim (a number, a formula, a rule's exact wording)
gets verified against `/tmp/tbe.txt` (a plaintext dump of the rulebook;
since 2026-09-22 the rulebook HTML lives in the claude.ai TBE project as
"TBE_RPG_Core_Rulebook_v1.0 (1).html", and stripping its tags gives a dump
that `intrigue_check.mjs` and `funnel_check.mjs` pass against)
**before** it's written into code, not after. Use `grep`/`sed` to pull the
exact passage first. This has caught real bugs (Piety wrongly purchasable
with XP; the SHIELDS false-positive in `equipment.py`'s own verify step)
that a plausible-sounding guess would have shipped silently. If
`/tmp/tbe.txt` isn't present in a fresh session, ask before writing any
new mechanic rather than reconstructing rules from memory.

The `data/*.json` files (`chargen.json`, `equipment.json`/
`equipment_docs.json`, `talents.json`) are never hand-edited directly.
`chargen.py`, `equipment.py`, `parse_life_events.py`, `parse_magic.py` and
`parse_talents.py` hand-transcribe or extract their data and have a
`__main__` block that re-checks every row against `/tmp/tbe.txt`
(normalized-whitespace substring/regex match, plus for `parse_talents.py`
specifically: round-trip name matching and mutation-tested assertions for
the six ways the book phrases repeatability, the two 10-XP Talents, and
punctuation-bearing names) before writing the `.json` — edit the `.py`,
re-run it, let it re-verify itself. (`parse_talents.py` was undocumented as
self-checking for a while after this discipline was written — BACKLOG.md
and ROADMAP.md both said otherwise until v0.24.0 caught it. Trust what the
script's own `__main__` block does, not an older note about it.)

**A quote is only half a check, and so is half a quote.** `parse_magic.py`
shows the shape to copy, and it took two passes to get right:

- Each transcribed row carries the book quote it came from, *and* the row's
  own number must appear inside that quote. Quoting "5 +1 Action" beside a
  hand-typed cost of 7 passes a substring test and ships a wrong number.
- But "the number appears somewhere in the quote" is still not enough when
  every row is a **pair** of numbers. "+3 AP" costs 4 TC; transcribed as 3, it
  verified clean, because the 3 was right there in "+3 AP". The cost must be
  in the *cost column* — at the head of a `TC | Effect` row, at the tail of a
  `Choice | TC` row, or inline as "N TC" (`check_tc`).
- A prose-priced row is pinned by a two-part quote, `"3 TC|Charm spells make
  the caster seem"`. Checking only that both strings exist somewhere let Charm
  be transcribed at 8 TC and still verify, because "8 TC" heads Dominate
  further down. Part 1 has to be the *nearest heading before* part 2, with no
  other heading between (`check`).
- A table's numeric **ranges and result names** are also hand-typed data.
  Derive them from the quote (`check_range`), or two rows can have their
  results swapped, or a range shifted by one, with every quote still verbatim
  and every coverage loop still exact.

Every one of those was found by mutating the data and watching the check pass.
That is the standard: a verification step is not done until you have broken
the thing it verifies and seen it fail.

**The one exception**: `data/concepts.json` (the step-1 concept roller) is
original content, not book-derived, because the book asks for a rough
concept but supplies no table to generate one. It is deliberately kept in
its own file, labelled as table-generated flavour in the UI, and writes to
nothing mechanical, its skill names are suggestions the player confirms.
Keep that boundary: if new original content is ever needed, give it its own
file and the same treatment rather than mixing it into a verified one.

**Roll aids are wanted, beyond what the book strictly offers.** Seb's steer
(2026-09-27): the amended concept table, the roll for age "and other means of
easing the decisions process via roll fit my purpose better than strictly as
the rules say", and the concept table should offer many more options (it was
grown to 60/40/40 in v0.51.0). So a roll that helps a player decide is a
feature, not a rules deviation, PROVIDED it is labelled as a suggestion or
original table, the player can always pick by hand instead, and it writes
nothing mechanical the book does not already allow. `concepts_check.mjs`
holds the concept table to that.

## Ownership discipline for shared rules

This project has shipped five separate duplicate-logic bugs across its
sessions — the same rule, constant, or table re-implemented in two places
that quietly drifted apart (Attack's two location-status maps, Advancement's
hand-copied `strandCap` and magic-purchase costs, Haggle's opposed-roll
tie-break cascade missing the "normal failure beats critical failure" branch
Opposed Roll has correct, NPC generation hardcoding every skill to
"Adventuring" instead of the Wizard's real category map). Each was cheap to
fix once found and expensive to have shipped twice. This is the check that
would have caught them before they shipped, not after.

**Bright-line test, check this first, always:** does the change touch a
rule, a constant, a table, or logic that exists in more than one place? If
no (pure presentation, a typo, a copy tweak), just make the change. If yes,
do the ownership check below before writing code.

**When it's yes:**
1. Name the capability being changed in one line ("ammunition depletion
   reporting," not "attack fix").
2. Find its current owner and search for other implementations of the same
   rule, constant, table, or check — this is the step that's been missing.
3. State the canonical owner going forward and what's explicitly out of
   scope for this task.
4. Implement only that.
5. After: confirm no second implementation was left active, run the
   narrowest relevant existing test, update `docs/ownership.md` if the
   owner changed.

Foundry macros can't `import` modules, but they can read a global at
runtime. Expose shared rule logic on `game.thebrokenempires.rules.*` (set at
system init) and have macros call it — that's how you get one owner without
fighting the sandbox. Keep using the existing Node-based verification
scripts (`simtest.js`, `magic_check.mjs`, etc.); no new test framework
needed.

Don't refactor anything the current task doesn't already touch. Opportunistic
only: if you're in `_lib.js` fixing the ammo guard anyway, that's when
`TBE.resolve()` and the opposed-roll cascade are worth pulling into
`module/rules/resolution.mjs` and `module/rules/combat.mjs`. Don't go looking
for extraction work outside whatever bug brought you into that file.

`docs/ownership.md` tracks the capabilities this has already been applied
to, their known duplicates, and the canonical owner going forward. Check it
before assuming something is single-sourced.

## The roadmap

`ROADMAP.md` holds the phase model this project runs on (Foundation → MVP →
QoL → Rule consolidation → Content → Play experience → Hardening → Release).
It is maturity-based, not feature-based: each phase's definition of done is a
state of the system, not a list of shipped items, and feedback runs backwards
rather than as a waterfall.

Two things from it that bear on every change:

- **Architecture is a constraint, not a phase.** The ownership discipline below
  applies now, in whatever phase a change lands. Phase 3 is where opportunistic
  consolidation gets finished, never a reason to defer a fix.
- **Verified is not Tested.** Tested means the code does what the code says;
  Verified means the data says what the book says. They fail independently —
  the NPC Traits table shipped 21 of 50 rows for months with every mechanical
  test passing. New content needs an extractor with a self-check, not a
  hand-edited JSON.

## Shipping cadence: batch by tier, not by bug

Stop rebuilding and delivering `The-Broken-Empires-System.zip` after every
individual fix — that turns a batch of related changes into a string of
near-identical deliveries and makes it hard to tell what actually changed
between them. Instead:

- Ship once per tier/batch of related fixes, not once per bug. Finish the
  batch, run the full verification suite, bump the version once, write one
  changelog entry covering the whole batch (the 0.17.0 and 0.18.0 entries
  are the right model — several fixes under one version), update
  `BACKLOG.md`, then build and deliver.
- Before that delivery: `node syntax_check.mjs <files>` on every edited macro, run the regression
  suites, and do the player-perspective walk-through this file already
  calls for, especially for anything touching `module/chargen/` or
  the Attack/Wounds flow.
- The delivered zip's accompanying message should name which batch just
  shipped and list the fixes in one line each, not restate the full audit
  prose.
- Backlog (Tier 2 / not-yet-scheduled) items don't get a zip at all until
  one is specifically picked up — they live in `BACKLOG.md` until then.

## Build pipeline — order matters

Raw hand-transcribed/extracted data → verified data → per-domain `_docs.json`
→ compendium packs. Each stage's script reads only the previous stage's
output, so skipping a stage ships stale data silently:

1. Source scripts, run after editing the matching `.py`/data file:
   - `python3 chargen.py` → `data/chargen.json` (verified against
     `/tmp/tbe.txt` in its own `__main__` block)
   - `python3 equipment.py` → `equipment.json` (same verified pattern)
   - `python3 parse_talents.py` → `data/talents.json` (self-verifying like
     the two above, since 2026-08-28)
   - `python3 parse_bestiary.py` → `bestiary.json`
   - `python3 parse_life_events.py` → `data/life_events.json` (an extractor
     WITH a self-check: it verifies all three d100 tables cover 1-100 exactly
     once, every event name appears verbatim, and every Bind/Strand grant
     carries a real amount and a real name)
   - `python3 parse_magic.py` → `data/magic.json` (Ch.14: Binds, Strands,
     Convocations, the Shaping and Spell Effect cost tables, the Weave
     Reaction Table, the Fraying rules. Self-verifying: 122 rows are quoted
     verbatim AND each row's TC must appear inside its own quote, so a
     mistyped cost fails the build instead of shipping)
   - `python3 parse_divine.py` → `data/divine.json` (Ch.15: the Piety
     procedure and its five tables, hand-transcribed with quotes, plus all
     20 Domains and their 218 miracles, which are EXTRACTED. Self-verifying
     on both halves: every number must appear inside its own quote, and every
     miracle is round-tripped, checked to sit under its own level header, and
     checked to end where the book's sentence ends — a bullet truncated at a
     page break is a prefix of a real sentence and passes a plain round-trip)
   - `python3 parse_core_rules.py` → `data/core_rules.json` (the core d100
     mechanic, Death Threshold/Lethality Level, Combat & Wounds — see
     "Player-facing transparency" below. Self-verifying like `parse_magic.py`,
     with one addition: the page number cited for each rule is *derived*
     from the quote's own position in `/tmp/tbe.txt`, not hand-typed — the
     source dump carries the book's printed page numbers as standalone digit
     lines, and **a page's number FOLLOWS its text**, so the page is the next
     marker after the quote. Since v0.53.1 there are no line numbers in it at
     all: quotes are found by searching the whole book, each page must fall in
     its heading's range on the book's own contents page, and the heading must
     be the nearest one above the quote. `rules_audit_check.mjs` runs it)
2. `_docs.json` builders, each turns one domain's raw data into the
   pack-ready shape (Items/Actors/journal HTML) plus (as a byproduct, not
   delivered by default, see above) a standalone legacy installer script:
   - `python3 build_talents.py` (reads `data/talents.json` +
     `data/chargen.json`) → `data/talent_docs.json` +
     `TBE-Talents-Installer.js`
   - `python3 build_equipment.py` (reads `equipment.json`) →
     `data/equipment_docs.json` + `TBE-Equipment-Installer.js`
   - `python3 build_bestiary.py` (reads `bestiary.json`) →
     `data/bestiary_docs.json` + `TBE-Bestiary-Installer.js`
   - `python3 build_magic_data.py` (reads `data/magic.json`) →
     `system/the-broken-empires/module/helpers/magic-data.mjs` — the
     system's own copy of the Ch.14 tables, generated for the same reason
     chargen-data.mjs is
   - `python3 build_magic_journal.py` (reads `data/magic.json`) →
     `magic_reference.html`, the at-the-table Weave Magic journal that
     `build.js` bakes into the `tbe-journals` pack
   - `python3 build_rules_audit.py` (reads `data/core_rules.json`) →
     `rules_audit.html`, the `TBE: Rules Audit` journal: what each macro
     computes, cross-referenced to the exact book quote and page, for a
     player checking the math against their own copy
   - `python3 build_system_data.py` (reads `data/chargen.json`) →
     `system/the-broken-empires/module/helpers/chargen-data.mjs` — the
     native system's own copy of sizes/races/careers, generated rather
     than hand-copied so it's provably the same data `chargen.py`
     verified
   - `node build.js` (reads `data/chargen.json`, `data/talents.json`,
     `data/concepts.json`, `data/life_events.json`, `data/magic.json`,
     `data/equipment_docs.json`, `journal.html`, `status_reference.html`,
     `magic_reference.html`, `rules_audit.html`) →
     `data/solo_docs.json`'s `macros` array (macros/_lib.js + per-macro
     data blocks + each macro file, concatenated exactly as Foundry would
     eval a `command`) + the legacy `TBE-Solo-Installer.js`
3. `node build_packs.mjs` — reads `data/solo_docs.json`,
   `data/talent_docs.json`, `data/equipment_docs.json`,
   `data/bestiary_docs.json` (all from step 2) and builds the native
   system's compendium packs (`tbe-macros`, `tbe-talents`,
   `tbe-equipment`/weapons-armor-shields, `tbe-bestiary`, `tbe-tables`,
   `tbe-journals`) under `system/the-broken-empires/packs/`. Bump
   `systemVersion` in this file's `STATS()` when cutting a release.
4. Zip `system/the-broken-empires/` → `The-Broken-Empires-System.zip`. This
   is the only build artifact that gets delivered by default.

In practice: after touching only macro files (not data), `node build.js`
then `node build_packs.mjs` is enough. After touching any `.py`/data
source, re-run that source's script and every `_docs.json` builder
downstream of it before `build_packs.mjs`.

## What "correct" means here, in priority order

The mechanical tests below all check that the code does what the code says.
They do not check that the code does what the *book* says, or that the
result is usable by a player at the table. Those are the failures that
actually reach the user, so check them first, in this order:

1. **Step fidelity.** Does each wizard step ask for what the book's
   corresponding step asks for, no more and no less? Content living in the
   wrong step is a real defect, not cosmetics. (Worked example, fixed in v0.8.1: the
   Human Culture d100 language table is in the book's step 2, inside the
   Human race entry p.81-82, while the wizard renders it in step 5. Step 1
   was also asking for a language the table determines.)
2. **No dead input.** Every field the player fills must reach the actor or
   influence something that does. Trace each input from `_readCurrentStep`
   through `commit()`. An input silently discarded, or unconditionally
   overridden by a later step, is worse than an absent one: it costs the
   player thought and then throws the answer away. (Worked example, fixed in v0.8.1:
   step 1's "Cultural background" free text was unreachable, `commit()`
   preferred `d.cultureBgName`, which is initialized non-empty and can
   never become empty, so the typed value was discarded 100% of the time.)
3. **Player preparedness.** Two halves, both required:
   - Can this field be answered with what the player knows *at this point in
     the flow*? A field that depends on a later step's result is a defect
     even if the plumbing is correct.
   - Does the step show the state needed to make the decision? An input that
     is mechanically correct but leaves the player guessing is still broken.
     (Worked example, fixed in v0.10.1: the Career Skill Points and Rounding
     Out steps asked for point allocations without showing any skill's
     current value, so you were typing "+5" into a box with no idea whether
     the skill sat at 20 or at 68 and about to hit the 70 cap. Every existing
     test passed, because they all checked that the DOM was *correct* and
     none asked whether it was *sufficient*. Walk a step as a player would
     and ask what number you would need on screen to choose.)
4. **Book values reach the actor.** A value shown in the UI but not used
   in `commit()` is a silent wrongness with no symptom. (Confirmed
   example: `race.dt` is displayed on step 2 but `commit()` hardcodes
   `dtBase = 20`, so an Ogre is built at DT 20 instead of the book's 22,
   which also drags Lethality Level from 8 to 7.)
5. **Table adoption.** Where the book gives a table, use the table. The
   project owner's standing goal is not to hand-enter or go look up what a
   table could supply. The deliberate exceptions are logged in BACKLOG.md
   (Life Events, Shared History, Relationship NPC bonuses are prose with
   player choices, shown-not-applied on purpose). Anything else that
   sends the player to their own copy is an unnoticed gap, not a scope
   decision.
6. **Nothing you build may punish a reasonable mistake.** A player who opens
   a tool they turn out not to qualify for must be told so and left exactly
   as they were. The worked example is the whole reason `phase5_check.mjs`
   exists: `TBE.godbound()` gated TBE: Miracle on "has a Piety skill", both
   chargen paths gave every character one at 0, and so an ordinary Warrior who
   opened the macro once out of curiosity failed the automatic Piety-0 roll,
   spent Piety they never had, and was permanently Cast Out. Fifty-eight
   divine-magic assertions passed throughout, because every step did exactly
   what it says. When a tool has a precondition, ask what happens to somebody
   who does not meet it — and check that the answer is a sentence, not damage.
7. **A version-dependent API is a rule with two owners.** The framework is
   allowed to change shape underneath you, and the code that adapts to it has
   to be written as an adaptation rather than as an assumption.
   `CONFIG.statusEffects` is an Array through Foundry V13 and a keyed object
   from V14 on; registration called `.find()`/`.push()` on it and so threw
   inside `init` on a version the manifest claimed to verify against. Branch on
   the shape you actually find, not on a version number — a shim, a backport or
   the next generation will make the version read a lie, and the shape never
   lies. The same applies to anything read off `foundry.*`: if the manifest
   claims a version, something has to have actually run there.
8. **An override that drops its base contract is invisible.** A subclass method
   that re-states a return object instead of spreading `super`'s will silently
   stop supplying whatever the base added, and nothing errors — the value is
   simply `undefined` at the point of use, which in a roll formula reads as 0.
   `TheBrokenEmpiresCharacter.getRollData()` did this and every player character
   rolled `1d10 + 0` for initiative while every creature rolled correctly. When
   you see an override of a method whose job is "return the data contract",
   check that it extends rather than replaces, and check it by **running** it.
9. **Correctness of a sequence needs a test shaped like a sequence.** Classify
   what a check is actually asserting: STATIC (does the source have the right
   shape), CONTRACT (does A produce what B expects), BEHAVIOURAL (does one
   operation give the right answer), SEQUENTIAL (does A then B then C leave the
   right state). The first three all passed on v0.29.0's migration while it
   carried a bug that stranded data permanently, because the claim under test
   ("the version only advances when the whole pass succeeded") was a property
   of the ordering between two functions, and a static read of either one
   showed nothing wrong. Where state moves through stages — migration,
   advancement, wounds, trackers, fraying, equipment — write the test as a
   sequence: run it, break it midway, run it again, and assert on what the
   world is left holding. A check that reads one function and concludes
   something about a pipeline is not evidence.
10. **Before writing a conversion, find out whether one already exists.** The
   v0.29.0 migration layer reimplemented the clock conversion that v0.28.0 had
   already built, tested and shipped as a macro — and got the setting name, the
   data structure, the field names and the filter all wrong. It was written
   while building the mechanism whose whole purpose is preventing duplicate
   ownership. The ownership check at the top of this file is not only for rules
   and constants; a data conversion is a rule.
11. **A field computed every load must never be trusted from what was saved.**
   `TheBrokenEmpiresActor.prepareDerivedData()` writes `armorBulk`,
   `armorInitPenalty` and `initiativeEffective` onto `this.system` as
   properties with no schema field behind them — on purpose, since a roll
   formula's `@initiativeEffective` needs somewhere to resolve from and
   these three feed three different callers (the sheet, `TBE: Cast`, the
   combat tracker). The risk that creates: nothing stops `actor.update({
   "system.initiativeEffective": 4 })` from writing a number that looks
   real and isn't, and a DataModel doesn't reject an undeclared key the way
   a schema field with validation would. The rule, not a refactor: these
   are recomputed UNCONDITIONALLY every `prepareDerivedData()` pass, never
   "if not already set," so even a poisoned or stale value is overwritten
   the next time the actor loads — verified in `derived_data_check.mjs` by
   seeding a wrong value first. A wider fix (a `_derived` namespace so the
   distinction is structural, not written) is real and still open, logged
   in BACKLOG — it touches every read site across the sheet, the macro
   pack and the .hbs templates, which is a bigger blast radius than the
   three fields currently at risk justify doing under time pressure.
12. **A form is a data path, and a repeated field name corrupts it silently.**
   Foundry's `FormDataExtended` collects two controls sharing a `name` into an
   ARRAY and hands that to the DataModel, which cleans it into whatever the
   field type makes of an array — a StringField makes `"14,14"` of it, and the
   next save makes `"14,14,NaN"`. The creature sheet carried two inputs named
   `system.initiative` for its whole life, so every enemy a GM had ever opened
   and saved rolled Initiative 0 and acted last, in a world where all sixteen
   verification scripts were green. Nothing about it was a rule, a number or a
   formula, so nothing that checks rules, numbers or formulas could see it. A
   template's field names are now asserted unique per expanded form
   (`sheet_form_check.mjs`), and a `data-dtype` in a partial shared by two
   sheets has to follow the DataModel rather than name one type.
13. Then the mechanical checks below.

A review that only runs the test suite will pass all six of the confirmed
defects above. Reviews scoped to "check the tooling" find tooling bugs;
scope at least one pass at the player-facing output itself.

## Verification before calling anything done

- `node syntax_check.mjs <file>.js ...` on every edited macro (syntax only,
  fast). **Not `node -c`**: a macro body runs inside Foundry's async block, so
  top-level `await` and `return` are legal, and `node -c` parses the file as
  CommonJS and reports them as errors. v0.41.0 "fixed" that false alarm by
  wrapping a macro in an IIFE, which is the wrong fix: the macro was never
  broken. `syntax_check.mjs` wraps the source the way Foundry does.
- `node simtest.js` — 51-test regression suite (combat/armor mechanics,
  Talents, Extended Roll, Social Encounter). Must stay 51/51.
- `node magic_check.mjs` — 87 checks over Ch.14: the generated
  `data/magic.json` and `magic-data.mjs`, the real `CONFIG.TBE` helpers
  (Strand XP curve, Fraying tiers), the real `_prepareMagic` sliced out of
  `actor-sheet.mjs`, and `actor-magic.hbs` compiled by real Handlebars. Also
  screenshots the Magic tab to `test-screenshots/magic/`.
- `node cast_check.mjs` — 109 checks driving the real `TBE: Cast` window in
  headless Chromium: the Total Cost calculator (against the book's own worked
  example on p.290, 17 TC before the roll and 18 after it), every Effect
  group clicked through the real picker, the odds line, the Law of Limitation
  for both Binds and Strands, Mastery, Threads, mitigation, the gated Weave
  Reaction tiers, the Ch.18 NPC shortcut's four branches, the magic Talents
  and the Fraying Roll.
- `node enforcement_check.mjs` — Talent/Advancement/racial rule enforcement.
- `node phase5_check.mjs` — 73 checks over the five defects the first played
  session found (v0.28.0). Read it before adding a gate, a chargen grant or a
  tracker: every assertion in it exists because the other fourteen scripts
  were green while a player was being punished for doing a reasonable thing.
  Carries three mutation guards that reintroduce the defects.
- `node audit_check.mjs` — 116 checks over what two outside release audits
  found (v0.29.0 and v0.29.1: the 0.28.0 zip, then the 0.29.0 zip). Read it
  before touching status registration, a DataModel's `getRollData()`,
  `parse_talents.py`'s boundary detection, the release build, or
  `migration.mjs`. Two lessons are baked into how it is written: the status
  registration is asserted by **running** the real block against both an Array
  and a keyed object, and the roll-data contract by **executing** both DataModel
  methods and resolving every `@reference` in the live initiative formula —
  because reading the source is exactly what missed both for sixteen releases.
  Section 7 is SEQUENTIAL rather than static, for the reason rule 9 above
  exists. Carries mutation guards for every finding.
- `node migration_fixtures_check.mjs` — the fixture-world matrix: whole-world
  snapshots grounded in what CHANGELOG.md actually says was true of a world at
  0.21.0/0.22.0/0.27.0/0.28.0, run through the real `migrateAll()` the way one
  GM's actual upgrade would hit it, including a straight 0.20.0→current jump
  with a live clock and a hand-patched legacy flag in the same pass. Confirms
  three of those four versions genuinely need nothing (and that "nothing to
  do" still advances the recorded version rather than looping forever) and
  that 0.28.0 is exactly where the stranded-clocks path has to fire.
- `node migration_fixtures_check.mjs` also covers the v0.39.0 flag-namespace
  move (fixtures K-O). Two things in it are worth knowing before touching
  flags. First, **`tbe` was never a legal flag scope**: Foundry accepts `core`,
  `world`, the system id and module ids, and throws on anything else, but only
  via `setFlag`/`getFlag` — a hand-written `update({"flags.tbe.x": v})` writes
  happily. That asymmetry is why the split survived for years and why the one
  macro using the documented API was the broken one. Second, the migration
  moves a **named list of keys** (`TBE.OWNED_FLAGS`), never the whole
  namespace, because the Salt-Run Ambush adventure keeps live state under
  `flags.tbe.saltRunAmbush` and a system upgrade cannot update its installed
  copy. Fixture N seeds the whole-namespace sweep and confirms it breaks the
  adventure.
- `node skill_picker_check.mjs` — 63 checks that execute the real
  `TBE.skillOptions` out of `macros/_lib.js` against stub actors. It exists
  because the picker was built from the sheet's skill Items alone, so any
  skill a character had not written down (every one of them starts at 20,
  p.104) could be rolled only by knowing the rule and typing the number by
  hand. Read it before changing the skill catalogue, the picker, or
  `TBE.BASE_SKILL`. Carries a mutation that restores the sheet-only picker.
- `node resolution_check.mjs` — the d100 rule has exactly one owner. Runs
  `module/rules/resolution.mjs` and the macro pack's `TBE.resolve` over every
  roll from 1 to 100 against 17 skill values and 4 Expertise ratings, 6800
  comparisons, both with the global present (the deferral path the sheet and
  macros use) and absent (the Node fallback), and asserts they never differ.
  Also asserts the sheet's roll button carries no rule logic of its own.
  Carries a mutation that drifts the macro's crit rule and confirms the sweep
  catches it. Read it before touching resolution, the Task Modifier table or
  the Favor cap. Its Task Modifier assertion reads the six rows (and p.18)
  out of the rulebook text: the hand-typed list it replaced pinned five rows
  and approved of Severe -30 being missing.
- `node probe_check.mjs` — 30 checks over `TBE-Session-Probe.js`, the
  after-action probe a GM pastes into their world once a session is over. Its
  value is entirely in the roll analysis, and that analysis is regexes run
  against chat flavour, so a missed pattern returns tidy empty aggregates that
  read like "they barely rolled" rather than like a bug. The check builds a
  stubbed world whose cards are generated from the same template
  `_onSkillRoll` emits (asserting first that the sheet still emits those
  pieces), runs the real probe over it, and asserts the skills, outcomes,
  Favor spends, Task Modifiers, success rate and the pacing gaps all come out.
  Carries a mutation that removes the `&mdash;` entity decode and confirms the
  skill names stop parsing. Read it before changing the roll chat card, since
  the card IS the probe's data format.
- `node visibility_check.mjs` — 62 checks over who can see a chat card, the
  rule the scope change created. Executes the real `module/rules/visibility.mjs`
  and the real `TBE.say` sliced out of `macros/_lib.js` across all four roll
  modes, with the rules global present and absent, and with and without
  Foundry's `applyRollMode`, asserting the deferral and fallback paths never
  disagree. Two real bugs in the owner were found this way and neither had an
  assertion written for it: a rule module reaching for an ambient `ChatMessage`
  global, and `selfroll` reading a `data.user` nobody sets — both produced a
  whispered card that reached nobody. **A rule module does not get to assume
  ambient state**; pass it in. Also pins that no mode ever hides a card from the
  GM. Read it before changing anything about how a card reaches chat.
- `node loadout_check.mjs` — 54 checks over carry state, the ENC pool it counts
  against, and the TBE: Loadout panel. Read it before adding a value to any
  enum a filter tests. The bug it exists to stop: "which pool does this carry
  state count toward" was decided inline in two places as a NEGATIVE filter,
  `(carried ?? 'hand') !== 'stored'` — fine for three states, silently wrong the
  moment a fourth existed, because a weapon on the floor started counting
  against the 6 ENC Weapons At Hand pool in the sheet and in every macro at
  once. **A negative filter over an open enum is a bug waiting for the enum to
  grow.** Runs the real owner, the real `encStatus` and the real `_prepareEnc`
  across a 32-loadout matrix, proves the deferral with a sentinel, and carries
  a mutation restoring the filter. It also compiles the macro the way Foundry
  actually does — an AsyncFunction with the real parameter list AND the body
  **wrapped in a block**, which is what `Macro#execute` does. That wrapper is
  load-bearing: inside it a top-level `const actor` shadows the `actor`
  parameter perfectly legally, which is why TBE: Skill Roll and TBE: Character
  Wizard have done exactly that for months. v0.35.0 briefly claimed the
  opposite, from a harness that compiled the body bare; the claim reached a
  changelog and two scheduled prompts before the release baseline caught it.
  **If a harness disagrees with a macro that demonstrably runs at a real table,
  the harness is what is wrong.**
- `node permission_check.mjs` — 104 checks over who may write to an actor, the
  second rule the scope change created. Read it before adding any `.update()` to
  a macro. The bug it exists to stop is not a missing guard, it is a guard's
  absence being *hidden*: nine sites did `try { await actor.update(...) } catch
  (e) {}` and then had the chat card assert the cost anyway, so a player without
  write permission got a log entry saying they spent Resolve they still have.
  **A swallowed permission error is worse than an unguarded write**, because an
  unguarded write at least fails loudly. `TBE.write()` returns a report and the
  report carries the sentence to print, so the truthful path is the short one.
  The check executes the real owner and the real `_lib.js` in both the deferral
  and fallback paths, proves the deferral with a sentinel, and greps every macro
  for the swallow pattern so a tenth site cannot appear quietly. Also pins that
  `TBE.me()` prefers a token the user can actually write to — it used to return
  whatever was selected, which under multiplayer is routinely someone else's
  actor. One thing it encodes that is easy to get backwards: in `canWrite`,
  **ABSENT is not FALSE**. A plain object with no `isOwner` is a harness stub,
  not a Document refusing; treating it as a refusal turned seven check scripts
  red at once.
- `pending_check.mjs` was retired with TBE: Character Wizard in v0.53.0. Its
  assertions moved to `creator_check.mjs` section 6b, aimed at the window's
  `stepStatus()` in `module/chargen/draft.mjs`, and what it encoded still
  holds: the "still to choose" list DEFERS to the detector that owns each
  grant (`raceChoices()`, `patternOf()`) rather than deciding from a race
  name, it addresses steps by KEY, and most of it is about **silence** (rule 6
  cuts both ways: a list that nags about a decision already made, or one the
  book never granted, trains the player to ignore it). Read section 6b before
  adding a grant to chargen, because a grant with no entry there is one the
  player can silently lose.
- `node macro_sync_check.mjs` — 42 checks over `TBE: Update Macros`, which
  brings a world's macro copies up to the installed system by matching on NAME
  and updating in place. Read it before touching how macros reach a world. The
  problem it solves: a system upgrade updates the compendium and nothing else,
  and Foundry's own import creates rather than replaces, so a played world
  accumulates stale duplicates while the system beneath them is current — the
  system is fixed and the thing the player clicks is not. Section 12 covers
  the retired macros (v0.53.0): a world copy of the Character Wizard, Build
  Character or Finish Character gets its command replaced in place with a
  pointer to what replaced it, never deleted, never re-created. The list is
  the system's (`module/helpers/retired-macros.mjs`, read by the library as
  `TBE.RETIRED_MACROS`), because the world check card after an upgrade names
  un-redirected retired copies too (`migration_fixtures_check.mjs` J). Runs the real macro
  against a stub world that records every create/update/delete and asserts on
  what it did, including that ALL duplicates are updated rather than only the
  one a cleanup would keep. Carries a mutation swapping update for create,
  which reproduces the original bug exactly.
- `node sheet_form_check.mjs` — 23 checks. Inlines every actor sheet's
  partials the way Handlebars would, collects every named form control, and
  requires the names to be unique per form (rule 12 above). Also pins the
  Initiative field's dtype to the DataModel, runs the real 0.33.0 repair step
  over the five corrupted strings a real world was carrying, and carries a
  mutation that puts the duplicate input back. Read it before adding a field
  to a shared `parts/*.hbs`, which is where the duplicate came from.
- `node derived_data_check.mjs` — rule 11 above, enforced rather than just
  written: no macro or module file writes a derived actor path through
  `actor.update()`, and `TheBrokenEmpiresActor.prepareDerivedData()` really
  does overwrite a poisoned value unconditionally (seeded wrong on purpose,
  then asserted gone), with a mutation that makes the overwrite conditional
  and confirms THAT survives instead. Also confirms the dead eager copies
  (`this.wp`/`.ll`/`.isDying`/`.sizeIdx`, nothing ever read them) are gone
  from `base-actor.mjs` without breaking the live getters underneath them.

- `node export_check.mjs` — 66 checks over `TBE: Export Sheets`, the GM-only
  printable sheet for every actor in the world. Read it before changing the
  sheet's content or `TBE.allSkills`. The first version listed the actor's
  skill Items and nothing else, so a character printed with two skills; the
  check that should have caught it asserted a trained skill was PRESENT, which
  was true of the broken version too. **Assert what must not be absent**: an
  untrained catalogue skill at 20 appearing is the assertion that fails.
- `node bestiary_skills_check.mjs` — 41 checks over the Ch.18 creatures'
  skills, read out of the BUILT `tbe-bestiary` pack (from a copy: opening a
  LevelDB writes LOCK/LOG files that must never ship). Read it before
  touching `build_bestiary.py`, the bestiary part of `build_packs.mjs`, or the
  skill catalogue. Every creature skill used to be stamped `"Adventuring"`
  with `fighting` passed by hand, and Expertise was glued onto the name
  ("Might Ex4") where `resolve()` never saw it. The group now comes from
  `TBE.creatureSkillGroup` in `_lib.js`, which build_packs.mjs loads rather
  than copies, and a skill name nothing can classify stops the build instead
  of getting a guessed heading. Carries mutations for the hardcode, a
  hand-passed `fighting`, the Ex-in-name, and a guessing owner.
- `node attack_order_check.mjs` — 17 checks that run the BUILT `TBE: Attack`
  (from `data/solo_docs.json`) against stubbed Foundry globals and record a
  timeline. On a hit: the roll card posts, Dice So Nice finishes, THEN the
  Combat Maneuvers dialog opens, then the outcome card. Read it before moving
  anything in Attack's flow. Also covers no Dice So Nice, a hung animation
  (the wait is capped by `TBE.DICE_WAIT_CAP_MS`), and a miss.
- `node chat_popup_check.mjs` — 14 checks over the per-user "Chat pop-up
  duration" setting (`module/helpers/chat-popups.mjs`), which sets
  `ChatLog.NOTIFY_DURATION` only on a class that already has one (V13+).
- `node dice_roles_check.mjs` — 16 checks over the Dice So Nice roles
  (attack / defence / wound). The ids and colours have one owner,
  `module/helpers/dice-roles.mjs`; `TBE.tagDice` in `_lib.js` reads them off
  `game.thebrokenempires.rules.diceRoles` and tags nothing without it, rather
  than keeping a copy of the ids. Tag a new roll with `TBE.d100("attack")` or
  `TBE.tagDice(roll, "wound")`, never with a hand-typed id.
- `node zones_check.mjs` — 42 checks over Zone Hazards (Ch.10 pp.151-152).
  Owner: `module/rules/zones.mjs` (hazard table with book quotes, geometry,
  which modifier applies to which roll); storage is a Region flag
  `flags["the-broken-empires"].hazards`, set by `TBE: Zone Hazards`. Section 1
  verifies every quote and page against the rulebook text (TBE_BOOK, else
  /home/claude/book/rulebook.txt, else /tmp/tbe.txt). Modifiers are OFFERED
  pre-ticked, never forced: "clearly seen" is the GM's ruling.
- `node sheet_exchange_check.mjs` — 63 checks over `TBE: Sheet Exchange` and
  its owners in `_lib.js`: `TBE.sheetCsv` (TBE-CSV v1, the Character Creator
  v0.6.5 converter, `matchName`, the one planner and the one writer) and
  `TBE.sheetPdf` (the fillable B/W sheet v13 field map). The SEQUENTIAL
  claims: export then import the same CSV plans no change, and fill the real
  PDF then read it back plans no change. Section 8 needs the blank PDF
  (TBE_SHEET_PDF); it is the publisher's and is NOT committed. The Creator
  fixtures are `test-fixtures/creator_v065_character_sheet.csv` and
  `creator_v070_character_sheet.csv` (v0.7.0, 2026-09-26: same layout, and
  section 6b fails if any structural label moves between them). Import never
  deletes, never guesses a skill group, and never approximates a name.
- `node boot_check.mjs [dir]` — 45 checks that the system STARTS. Imports the
  real entry module against stubbed Foundry globals, runs `init` on both
  status-effect shapes and `ready` on a fresh world (GM and player), and
  checks every manifest document type has a model, a buildable schema, a
  sheet template and a `TYPES` label, every preloaded template exists, every
  shown setting/sheet label is in `lang/en.json`, and nothing on
  `game.thebrokenempires.rules` is undefined. Before v0.48.0 no check ran the
  entry module at all, and the Enchantment type had shipped with no label.
  Pass an unpacked release zip as `dir` to boot the artifact, not the tree.
  Read it before adding a document type, a setting or a rules export.
- `node qol_check.mjs` — 49 checks over the v0.49.0 batch. The memory owner
  (`module/helpers/memory.mjs`) run as a sequence against a user whose
  setFlag MERGES like Foundry's, which is why memory is one JSON string: a
  nested flag object keeps a key you deleted. The BUILT TBE: Skill Roll and
  TBE: Attack run twice each, asserting the second dialog opens on the first
  one's choices and never on a spend. **Remember a choice, never a cost**:
  Favor, Resolve and modifiers are not stored. Also covers untrained
  Endurance and Dodge at 20 (p.104) in Attack, and the sheet's carry picker.
  Read it before adding anything to what a dialog remembers.
- `node resolve_check.mjs` — 42 checks over what can be spent from the
  Resolve track. **Spendable Resolve is unspent minus Fatigue** (p.26: spent
  slashed from the left, Fatigue crossed from the right); before v0.50.0 all
  seven spend sites read `resolve.value` alone. Owner:
  `module/rules/resolve-track.mjs`. Verifies the p.26 sentences against the
  book, sweeps the rule, holds `_lib.js`'s fallback equal to it, runs the
  built Skill Roll and Attack against fatigued characters, and greps every
  macro that subtracts from `system.resolve.value` for a call to
  `TBE.availableResolve`. Read it before adding anything that spends Resolve.
- `node chargen_parity_check.mjs` — 36 checks over `module/chargen/derive.mjs`,
  the one calculation of a character from its chargen choices. Its oracle was
  the BUILT Wizard's real `commit()`; before the Wizard retired (v0.53.0) that
  was run over the same 360 drafts and frozen into
  `test-fixtures/chargen_golden.json.gz`, which derive must still match in
  every field. **Never regenerate that fixture**: there is no Wizard left to
  regenerate it from, and a fixture rewritten to match new output checks
  nothing. A change that should move a number is argued from the book, and
  the fixture's draft is then excluded by name with the reason. Section 8 is
  the book's own worked example, Hadrion, whose totals the book prints after
  every step, now including the choices only the window can make (Ex3 Bind:
  Control, Ritual-wise 25, Divinity 25, the free Talents). **Book step order
  is the rule**: race before career, the 70 cap at each increase (p.78, p.80).
- `node table_defaults_check.mjs` — 48 checks over the v0.54.0 batch: the
  table defaults (`module/helpers/table-defaults.mjs`, all world settings, on
  by default), finding and linking unlinked Character tokens
  (`module/helpers/token-link.mjs`), Create Character's target, the combatant
  formula for a blank creature Initiative, and the portrait roster
  (`module/helpers/portraits.mjs`). Read it before touching anything that
  targets an actor from a token. **Create Character builds the SIDEBAR
  actor, never a token's synthetic copy**: an unlinked token holds a private
  delta, and a build written there looked reverted the moment the token was
  linked. Linking with the token's copy kept creates the new Items BEFORE
  deleting the old ones; section 4 carries the delete-first mutation.
- `node oracle_import_check.mjs` — 70 checks over TBE: Import Oracle Tables
  and TBE: Oracle Tables (`module/helpers/oracle-import.mjs`, v0.55.0). **The
  system ships the reader, never the oracle content**: the GM's transcription
  of a third-party oracle stays in their file and their world, and the
  fixture (`test-fixtures/oracle_shapes.json`) is invented words in the same
  shapes. Every range check is mutation-tested (a gap, an overlap, a label
  that disagrees, rolls out of order, an empty cell), writing is a sequence
  (re-import updates in place, create-before-delete), and Random Events
  fall back to the TBE tables slot by slot. `TBE_ORACLE_JSON=path` plans a
  real file too.
- `node concepts_check.mjs` — 17 checks over `data/concepts.json`, the
  original (not book) step-1 concept table. Every skill suggestion must be a
  real catalogue skill in the category it is filed under, because the window
  drops an unknown one without a word; rows unique and numbered 1..N; the
  pieces read as "{role} {streak}, {trouble}"; the window rolls the column's
  real size, with a world's own rows appended. Read it before adding rows.
- Player-facing transparency: `TBE: Rules Audit` (built from
  `parse_core_rules.py`/`build_rules_audit.py`, see BACKLOG.md's "Player-
  facing transparency" section for what it does and does not cover yet) is
  the standing answer to "prove this isn't vibe-coded" — a chapter/page-cited
  cross-reference from macro formula to book quote. Extend it, don't
  duplicate it, when adding a new mechanic worth citing; give the underlying
  domain's `.py` extractor `check_tc`-style column-position verification
  before adding its numbers here, not just a presence check.
- `node rules_audit_check.mjs` — 8 checks that the TBE: Rules Audit journal
  is current: it RUNS `parse_core_rules.py` and `build_rules_audit.py` and
  fails if their output differs from what is committed, or the built journal
  pack differs from it. It exists because nothing ran the generator: when the
  rulebook dump was regenerated its hand-typed line windows went stale, the
  script could not run, and the journal shipped for months with every page
  one early (and, after v0.53.0, naming a retired macro) while every check was
  green. Needs `/tmp/tbe.txt`. Read it before touching the audit's rules.
- `node creator_check.mjs` — 108 checks over the Create Character window
  (`module/chargen/`, v0.52.0). Section 1 holds the system's rule copies in
  `chargen/rules.mjs` equal to `_lib.js`'s over their whole input space.
  Section 3 is rule 2 enforced: every `data-bind` names a draft field and
  every draft field `derive()` reads has a box or a button, with a mutation
  that deletes the True Name box. Section 6 runs Create with and without
  permission. Section 7 drives the real window in headless Chromium behind
  `test-fixtures/appv2_shim.js` (a stand-in, not Foundry) through all twelve
  steps, Create, and close-and-resume; screenshots to
  `test-screenshots/creator/`. Read it before touching anything in
  `module/chargen/`: a page renders from `derive()`, never computes.
- `node shop_check.mjs` — 21 checks over buying equipment after creation
  (`module/chargen/shop.mjs`, the Gear tab's "Buy equipment"): the price off
  the silver, armour's AP/Bulk and its one location, quantity, refusal
  without writing, free starting pieces (p.109) and their training gate, and
  the unowned actor. Drives the real dialog in headless Chromium. It took
  these over from `finish_check.mjs`, retired with Finish Character in
  v0.53.0; `wizard_visual_check.mjs` retired with the Wizard, its regressions
  (points start at 0, a typed value survives Next and Back, spreading keeps a
  typed value, resume) now in `creator_check.mjs`.
- Bump the version in `system/the-broken-empires/system.json` and add a
  dated entry to `system/the-broken-empires/CHANGELOG.md` for anything
  that ships. `BACKLOG.md` tracks what's confirmed missing/broken but not
  yet built — keep it current instead of letting findings evaporate at
  the end of a session.

## Platform constraints

- `system.json` currently declares `"compatibility": {"minimum": 12,
  "verified": "14.365"}`. Some in-repo comments still say "targets Foundry
  v11, where ApplicationV2 doesn't exist"; that's stale, v12+ has it. The
  sheets and most macro windows use classic `Application` (v1); the Create
  Character window (v0.52.0) is ApplicationV2, through the smallest surface
  stable since V12 (`DEFAULT_OPTIONS`, `_renderHTML` returning a string,
  `_replaceHTML`, `_onRender`). It has been exercised behind a stand-in, not
  yet on a real V12 and V13+ table; see BACKLOG.
- Macros are flat, self-contained scripts (see the build pipeline above)
  — no ES-module imports inside a macro file. `NEEDS_TABLES` and
  `NEEDS_CHARGEN` in `build.js` gate which data block each macro gets
  concatenated with; add a new macro there, not by hand-duplicating data.
- d100 display convention: a natural roll of 100 shows as "00"
  (`TBE.face()` in `macros/_lib.js`). The rulebook also writes a range's
  top value as a literal "0" (`"9-0"` for d10, `"99-00"` for d100) rather
  than the real number — any new roll-table lookup needs to special-case
  a trailing 0 as the die's max face, not take it literally
  (`parseRange`/`rowForRoll` in `system/the-broken-empires/module/chargen/
  rules.mjs` is the reference implementation since the Wizard retired).
