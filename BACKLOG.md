## Chargen rebuild — stage 2 built in v0.52.0, 2026-09-27

Decided with Seb: option B. One window, the book's 12 steps down the left,
a live sheet on the right (Warp & Weft's "Foundation" tool is the UX
reference), built on one calculation. Finish Character and Build Character
retire once the new window covers what they do.

- **Stage 1 (done):** `module/chargen/derive.mjs`, the pure calculation, and
  `chargen_parity_check.mjs`: 360 drafts identical to the shipping Wizard,
  and the book's Hadrion reproduced step by step. Four Wizard bugs fixed on
  the way (see CHANGELOG 0.51.0).
- **Stage 2 (done, v0.52.0):** the ApplicationV2 window, `module/chargen/`
  (creator, steps, sheet, actions, commit, widgets, rules, draft, tables).
  Every roll aid and every Hadrion gap below has a place. `creator_check.mjs`
  (83) drives the real window in headless Chromium.
- ~~**Stage 2:**~~ the ApplicationV2 window. Left rail of the book's 12
  steps, each done when its choices are made; right column a live sheet
  rendered from `derive()`, with each number's sources on hover; compare-
  then-pick tables; Equip (9), Goals (11) and Status (12) as steps; Create
  writes what `derive()` returns and nothing else.
- **Stage 3:** retire TBE: Character Wizard, Finish Character (its
  post-creation jobs move to the sheet and TBE: Advancement) and Build
  Character, porting their checks first.
  Also for stage 3:
  - The macro library's copies of the creation rules (`SKILL_GROUPS`,
    `applyAbilityScore`, `raiseExpertise`, `talentNamed`, `talentItem`, the
    Ability Score double) should defer at runtime to the system's
    `module/chargen/rules.mjs`, keeping their copy only as the fallback.
    Today the two are held equal by `creator_check.mjs` section 1.
  - Armour Initiative penalty (Bulk / 3, p.141) on the Equipment step. It is
    computed in `documents/actor.mjs` and again as a fallback in
    `actor-sheet.mjs`; the window should call one owner rather than make a
    third copy, so it shows Bulk only for now.
  - Play-test the window at a table (V12 and V13+) before the old tools go.
    The browser check runs it behind a small ApplicationV2 stand-in, not
    real Foundry.

Roll aids for stage 2 (Seb, 2026-09-27: easing decisions by roll suits the
table better than strict RAW): keep every "roll it" button the Wizard has
(race, culture, Human homeland, life events, concept, age) and look for more
places a roll can suggest instead of a blank choice, e.g. Ability Score
picks, the Talent picks, Personality Traits, a name. Always a suggestion the
player can override, labelled when the table is original.

Gaps the Hadrion example exposed, for stage 2 to give a place: the Human's
extra Expertise on any skill including a Bind (p.108 gives Hadrion Ex3 Bind:
Control); a Bind as a Savvy pick; Rounding Out points on a custom -wise;
the Shared History +5; the free Talents (Human bonus, Rounding Out bonus,
career picks). Also: `derive()` takes `applyAbilityScore`, `raiseExpertise`
and `talentNamed` from the macro library as parameters; stage 2 should give
them a system-side owner the library defers to.

## Resolve track and Fatigue — built in v0.50.0, 2026-09-27

Asked at the table: "does Favor remove Resolve from the actor, and can it
show the track before and after?" It did remove it, but every spend ignored
Fatigue (p.26). Fixed across all seven sites, with the track drawn in the
roll dialog and on every card that spends Resolve. `resolve_check.mjs` (42).

Found while scoping the chargen question, not fixed:
- ~~**The Wizard's Attributes page shows Toughness without the race's.**~~ Fixed in v0.51.0.
  `_step_attributes()` computes `floor(points / 2)`; `commit()` adds
  `race.toughness` (an Ogre's +1). The page says 0, the actor gets 1. Same
  shape as rule 4 in CLAUDE.md: the Wizard works out the stats twice, once to
  show and once to write.

Open:
- The sheet's own Resolve field is still two numbers (value / max) and a
  separate Fatigue number. Drawing the track on the sheet header too would
  match the paper sheet; left out of this batch to keep it to the spends.
- Initiative: p.26 also lets Resolve raise a rolled Initiative 1 for 1.
  Nothing in the system offers that spend yet.

## Quicker combat and chargen — built in v0.49.0, 2026-09-27

Built: the first-session notes 4, 5 and 6 below (button rows with a memory,
Attack remembers the last attack, one-click carry state), the Wizard keeps
its draft, Severe -30 in the Task Modifier owner, untrained Endurance and
Dodge at 20 in TBE: Attack, Wounds' Endurance prefill 40 -> 20.
`qol_check.mjs` (49).

Found while building it, not fixed:
- **Page citations in the Rules Audit are one page early.** In
  `/tmp/tbe.txt` a bare page-number line FOLLOWS its page's text: the
  contents page puts Marking a Wound on 172, The Wound Die and Shock on 173,
  Lethality Level on 174, Skill Modifiers on 18, Favor on 26, and each of
  those passages sits just above that number. `parse_core_rules.py`'s
  `page_of()` takes the number BEFORE the quote, so the TBE: Rules Audit
  journal cites The Wound Die and Shock as p.172. `zones_check.mjs` already
  uses the next number and is right. Every other hand-typed page in the
  macros and modules may carry the same offset (resolution.mjs cited p.25
  for a table on p.18); needs one audit pass, with the contents page as the
  reference.
- **Manual skill boxes still default to 50** where a number is typed
  instead of picked (Opposed Roll, Haggle, Chase, Extended Roll, Quick
  Combat, and Skill Roll's blank fallback). For the character's own side
  the picker already offers the real value; the 50 is only a placeholder,
  but it is not the book's untrained 20 either.
- **Button rows and memory only reach the sheet dialog and TBE: Skill
  Roll.** Extended Roll, Opposed Roll and Chase still use a number box for
  their modifier. Opposed rolls take no Task Modifier (p.18), so those
  boxes are for situational modifiers and may be right as they are.
- A creature without Dodge on its stat block is still offered no Dodge.
  That is the book's stat block, not a bug; noted so it is not "found"
  again.

## Phase 7, first pass: the zip as a stranger gets it (2026-09-27, found in v0.47.1, fixed in v0.48.0)

Built `The-Broken-Empires-System.zip` from the tree, unpacked it fresh and
audited the artifact, not the working tree. No live Foundry in this session, so
nothing here has been installed or booted yet.

Clean:
- Layout unzips to `the-broken-empires/system.json`; no LOCK/LOG debris.
- Every `systems/the-broken-empires/...` path in modules, templates, CSS and
  the manifest resolves inside the zip.
- Pack counts match the README: 42 macros, 150 Talents, 50 equipment, 56
  creatures, 6 tables, 6 journals. All 42 built macro commands pass
  `syntax_check.mjs`.

Open, fixable in code:
- ~~**The Enchantment item type has no label.**~~ Fixed in v0.48.0;
  `boot_check.mjs` section 4 now asserts a label for every manifest type. `documentTypes` declares
  `enchantment`, `lang/en.json` has no `TYPES.Item.enchantment`, so the
  Create Item dialog shows the raw key.
- ~~**README claims the system "carries the numbers and procedures, not the
  text of the game."**~~ Fixed in v0.48.0: the README says what text ships
  and has a Licence section. Not true: Talent descriptions (150), the 218 miracles
  and the bestiary are book text. Either the claim or the content changes.
- ~~**LICENSE.txt is the boilerplate's**~~ Fixed in v0.48.0. ("Copyright (c) 2020 Asacolips
  Projects") and points to a pack-licensing section the README does not have.
- **`authors`, `url`, `bugs`, `manifest`, `download` are all empty.** All five wait
  on where the system is hosted. `authors` stays empty by choice: no
  personal name in anything that ships. A
  stranger cannot install from a URL, cannot update, and has nowhere to report
  a bug.
- ~~**No check boots the entry module.**~~ `boot_check.mjs`, v0.48.0. Eight checks import pieces of
  `the-broken-empires.mjs`; none runs `init` then `ready` against a stubbed
  `game`/`CONFIG` and asserts the world comes up with no error.

Open, needs Seb:
- **Publishing rights.** A public release ships rulebook text. That is the
  publisher's call, not a code fix.
- **Where it is hosted.** A manifest URL needs a public place (e.g. GitHub
  Releases) for `system.json` and the zip.
- **The one test only a person can run:** install from the zip into a clean
  Foundry (V12 minimum, V13, V14), create a world, build a character with the
  Wizard, run one fight, as someone who has not seen the system.

## Wizard placeholders — built in v0.47.0, 2026-09-22

- Open: a cleanup for characters already built (blank "Wise: subject N" at 0,
  and the five Bind-0 skills on a non-caster). Both are harmless now that the
  gate and the sheet ignore them, so nothing deletes them automatically.
- Open: the five Binds at 0 on a non-caster are RAW (p.79) but still print as
  five zeros in the Binds column. Ask Seb whether the sheet should leave the
  column blank for a character with no Pattern.
- TBE: Cast's gate is the only one; TBE: Ritual, TBE: Summoning and
  TBE: Use Enchanted were not checked for the same shape.

## Sheet Exchange formats + Ammo die — built in v0.46.0, 2026-09-22

- Not mapped yet from the PDF: armour penalties, base recovery, rounds
  dying, resolve track, inventory rows, relationship NPCs, life events,
  ability score descriptors (no Foundry field for the last three). Wounds
  export as a location total in the first row; import does not read wounds.
- Creator import: personality traits, life events, goals, inventory, notes
  not read. Its "EX 1" is reported (p.53 has no Ex1); ask Vasco what the
  column means before converting it.
- Not supported: TBE Char Gen Worksheet, TBE-Sheet Character Worksheet
  (Google), Enemy Creator WIP (a creature importer is its own feature).
- pdf-lib loads by dynamic import from systems/<id>/lib. Not yet tried on
  The Forge, which serves system files from its asset CDN.
- `TBE.AMMO_WEAPON` classifies by name (bow/crossbow/sling). A weapon field
  would be better than a name; logged, not built.

## Zone Hazards + Sheet Exchange — built in v0.45.0, 2026-09-22

- Zone Hazards: attack-side only so far. Not built: Rough prompts on Charge /
  Run / Drive Back, Blocked prompts on movement, Damaging rolls on entering or
  starting a turn in a zone (would need a Region behaviour or a combat-turn
  hook), and Cast / Opposed Roll reading Obscured.
- Region testPoint: handled for V12 (point, elevation) and V13 ({x,y,elevation})
  shapes by arity. Not yet run on a live V14 scene.
- Sheet Exchange: generic TBE-CSV v1, not Seb's "Character Creator v0.6.5"
  layout. That xlsx was lost with an earlier container; to map it directly
  (a "Foundry" tab of lookups, or reading its cells), it has to be uploaded
  again. Magic (Binds, Strands), wounds, goals and notes are not in v1.

## Dice So Nice roles — built in v0.44.0, 2026-09-22

- TBE: Attack tags attack / defence / wound dice (roles tbe-attack,
  tbe-defence, tbe-wound). Not yet tagged: TBE: Quick Combat (PC vs foes),
  Opposed Roll, Haggle, the sheet's skill roll. Open question for those: is
  the split "attack vs defence" or "PC vs opposition"?
- Checked against Dice So Nice's published API docs and a stub, not yet at a
  live table.

## Modules looked at, 2026-09-22 (no fork needed for either)

- **Zone Movement** (Hod Publishing, V13+, verified 14.365, system agnostic).
  Set the scene's grid unit to "zone", draw each zone as a Region with a
  "Modify Movement Cost" behaviour; the ruler and token drag then count zones.
  Its optional distance labels are Coriolis range names; leave them off.
  Configure-only. See the range-band note further down for Alternate Zone
  Movement, the other candidate.
- **Data Inspector** (Koboldworks, system agnostic). Read-only view of an
  actor's roll data, derived data, source data and flags. A GM debugging aid:
  e.g. confirms a creature's skill now carries system.expertise. Nothing to
  build.

## Chat pop-ups and Attack order — built in v0.43.0, 2026-09-22

Seb's request: "make the chat pop up linger, and change the order of the
combat maneuvers, so they reveal after the roll finishes".
- Per-user setting `chatPopupSeconds` (default 15) sets `ChatLog.NOTIFY_DURATION`.
  Verified against the V13 API docs (NOTIFY_DURATION 5000 ms) and a stubbed
  class, not yet at a live table. If the pop-up still vanishes at 5 s in V14,
  the core reads the value somewhere else and the helper needs a second shape.
- Attack posts the roll card first, awaits `TBE.waitForDice` (Dice So Nice's
  `waitFor3DAnimationByMessageID`, capped), then asks for maneuvers.
- Not done, possible follow-up: other two-step macros (Cast, Social Encounter)
  may have the same "dialog before the dice" shape. Not checked.

## Bestiary skills — built in v0.42.0, 2026-09-21

Fixed (the "Bestiary (Ch.18)" item below, plus two defects found doing it):
- Every creature skill was stamped `group: "Adventuring"`. The group now comes
  from `TBE.creatureSkillGroup(name, isAttack)` in `_lib.js`: catalogue first,
  then `-wise` -> Wise, then anything the book prints as an attack -> Combat,
  else null. `build_packs.mjs` loads the real `_lib.js` and throws on null.
  `fighting` is derived from the group.
- Expertise lived in the skill NAME ("Might Ex4", 20 skills). `resolve()` never
  saw it, and `TBE.allSkills` offered "Might Ex4" at 90 beside an untrained
  "Might" at 20. Now `system.expertise`.
- An attack's Expertise ("Broadsword 90 Ex3", 13 attacks) was matched by
  `attack_header` and discarded. Now captured.

Open, needs `/tmp/tbe.txt` (the extractor reads the book, not bestiary.json):
- **`parse_bestiary.py` misreads stat blocks that print alternate loadouts
  ("#1 - Mace 50, Dmg 4 ... #2 - Shortbow 40, ...").** Hobgoblin, Orc and Tical
  Dondallan Soldier. Their loadout weapons are filed as skills, so they get no
  weapon Item (the Orc has a Dagger and nothing else), "Parry" is parsed as an
  attack NAME (Hobgoblin, Tical), and "1H Spear" loses its "1". The Lich's
  "Touch 65, Dmg 3" is filed the same way. v0.42.0 classifies those skills
  correctly (Combat, from the book's own attack signature in the raw text),
  but the missing weapon Items are an extractor fix, not a builder fix.
- The legacy `TBE-Bestiary-Installer.js` (not delivered) still carries the old
  hardcoded `mkSkill`. Out of scope while the installer path is parked.

## Export Sheets — built in v0.41.0/v0.41.1, 2026-09-20

- `TBE: Export Sheets`, GM-only, printable sheet per actor or whole world.
  v0.41.1: listed skill Items only; now `TBE.allSkills(actor)`, the extracted
  owner of "sheet skills plus the catalogue at 20".
- `node -c` reports top-level await as an error in a macro; that is a false
  alarm (Foundry wraps the body in an async block). v0.41.0 wrapped the macro
  in an IIFE to silence it, which was wrong and has been reverted. Use
  `syntax_check.mjs`.
- Risk, not yet a bug: `TBE.LOCATIONS` is an ARRAY in `_lib.js` and an OBJECT
  in the system's `config.mjs`. Same name, two shapes. Anything that reads one
  expecting the other breaks silently.
- Option not built: a party roster page (one sheet, all PCs, summary lines).
- Recovered 2026-09-21 from the shipped v0.41.1 zip after the session
  container was reclaimed before a bundle was sent. Every release now ships
  zip AND bundle.

## Borrowed from the Tapestry — "Still to choose", built in v0.40.0

Seb shared a standalone TBE character-creation web app (The Tapestry) and
asked what was worth copying. Four things were; this is the first.

**Built.** `pendingChoices()` and `_pendingHtml()` on TBE: Character Wizard,
plus `pending_check.mjs` (46 checks). The panel sits under the step bar on
every step and lists every grant the draft has not claimed, each a link that
jumps to the step that resolves it.

The sharpest thing it catches is not a missing pick, it is an **unvisited
step that looks complete**: the Ability Score step's Expertise/Talent/
Descriptor selects carry no blank option, so they render showing the first
entry while the draft still holds null, and the value only commits when the
step is visited and read. On screen there is nothing to see.

**Comparison finding, for the record.** The Tapestry computes Death Threshold
as `Math.max(20 + points x 2, raceOverride)`. The book (p.83, p.87) makes a
race's DT its STARTING value, with +2 per Attribute point on top, so an Ogre
spending exactly one point should reach 24 and instead gets `max(22, 22)` =
22 — the point buys nothing, silently. Two points is right again by accident.
Ours does `raceDT + 2 x points` and is correct. Not our bug to fix, but worth
telling whoever maintains that tool.

### Still to copy from the Tapestry, in order

- **The always-visible live sheet.** A sticky second column showing the
  character as it stands, collapsing to a tab on narrow windows, filtering
  skills to the ones actually touched rather than forty rows of 20. This is
  CLAUDE.md rule 3's second half applied to every step at once, where the
  v0.10.1 fix applied it to two. Biggest remaining win, and the largest build.
- **Provenance tags.** "This comes from your Cultural Background selection:
  Highland Clans", placed where the bonus appears. Cheap, and it answers "why
  is this here" at the moment the question occurs.
- **Draft persistence.** The Tapestry saves to localStorage on every step and
  offers to resume. Closes the "No cross-session draft persistence" item
  already open under Tooling/UX. Copy the behaviour, not the mechanism: in
  Foundry this belongs on a user or actor flag (`tbe.characterCreationDraft`),
  and after v0.39.0 that means `TBE.flagPath("characterCreationDraft")`.
- Smaller: the buy-button flash confirmation, compare-before-you-pick tables
  with a summary column, and dotted-underline affordances on tooltips.

**Deliberately NOT copied.** Its custom modal exists because a published
artifact page cannot use native `confirm`/`prompt`; Foundry has `Dialog` and
the pack has `TBE.prompt`, so that solves a problem this project does not
have. And its closing note tells the player the tool is not the character's
permanent home and to transfer to paper, which is right for a standalone page
and exactly backwards here, where the Foundry actor IS the permanent home.

## Flag namespace consolidation — Built in v0.39.0, 2026-09-19

Logged as a tidy-up with a migration attached. It was hiding a live bug.

`tbe` is not a flag scope Foundry accepts — the valid set is `core`, `world`,
the system id and installed module ids — but only `setFlag`/`getFlag` validate.
A hand-written `update({"flags.tbe.x": v})` writes the path without complaint.
So every site that spelled the path out worked, and `TBE: Funnel Roster`, the
one file that used the documented API, threw on every call and could not list,
update or convert a single townsfolk. No check covers that macro.

**Built.** `TBE.FLAG_SCOPE` / `TBE.OWNED_FLAGS` in `helpers/config.mjs`,
`TBE.flagPath`/`TBE.flagOf` in `_lib.js`, two 0.39.0 migration steps sharing
one `moveOwnedFlags` body, the funnel roster fix, `perRank` regenerated into
the new namespace with a tolerant reader, `findStrandedClocks` reading both,
and fixtures K-O.

**The design decision worth keeping**: the step moves a NAMED LIST, not the
namespace. Salt-Run Ambush stores live tracker state in
`flags.tbe.saltRunAmbush`, ships its own installer, and is not updated by a
system upgrade — a whole-namespace sweep would move state out from under a
running adventure whose installed copy we cannot patch. Fixture N seeds the
naive sweep and confirms the damage.

### Still open from this area

- **The adventure still uses an invalid scope for its own flags.** Salt-Run
  Ambush writes `flags.tbe.saltRunAmbush` through direct updates, which works,
  and never calls setFlag, so nothing throws. It is not this system's namespace
  to move. If the adventure is ever reissued it should pick `world` or its own
  module id; until then the system deliberately leaves it alone.
- **No check covers `tbe-funnel-roster.js`.** The fix above is asserted by
  grep, not by running the macro. It is the only macro with a dialog flow and
  zero behavioural coverage, which is exactly how a total failure sat there
  unnoticed. A `funnel_roster_check.mjs` running the real macro against a stub
  world is the obvious follow-up.
- **`setFlag`/`getFlag` are now unused everywhere.** Every site writes paths
  directly. That is fine and consistent, but it means the scope validation that
  would have caught this can never fire again. A cheap guard is a check that
  greps for any `flags.tbe.` write outside the migration and the adventure.

## Multiplayer readiness + sheet roll parity — Built in v0.38.0, 2026-09-18

Seb asked for "multiplayer + sheet update" in one pass after the scheduled
overnight runs turned out to be unable to see this repo at all (a fresh cloud
container per firing; nothing persists). Done hands-on instead.

**Built.** `module/rules/permission.mjs` (owner of "may this user write to this
actor", with `TBE.canWrite`/`TBE.write`/`TBE.writeItem` deferring), the `TBE.me()`
wrong-actor fix, conversion of every in-play write that spends something and then
describes it, `module/rules/combat.mjs` (opposed-roll cascade moved out of
`_lib.js`, plus `defendingShield`/`shieldLine`), weapon and defence rolls on both
sheets, B1 (shield line on the card and the prompt), B4 (locked chargen maxima),
the carry-state label fix, and `permission_check.mjs` (104 checks).

**The finding worth remembering**: the defect was not the missing permission
check, it was nine sites that caught the permission error, discarded it, and had
the chat card assert the cost anyway. See the v0.38.0 changelog entry.

### Still open from this area

- **Chargen-time writes are still unguarded** (`tbe-character-wizard.js`,
  `tbe-build-character.js`, `tbe-finish-character.js`). Deliberate: they throw
  visibly rather than swallowing, and they run against a character the player
  just made and therefore owns. The case that would bite is a GM building a
  character *for* a player on an actor the player already owns. Low frequency,
  visible when it happens, so not worth the churn today.
- **GM journal tooling is unguarded** (`tbe-clocks.js`, `tbe-log.js`,
  `tbe-npc.js`). These write JournalEntries, not actors, and are GM tools by
  nature. If a player ever gets a button that reaches them, they need the same
  treatment — permission on a Journal is a different document class, so
  `permission.mjs` would need a third entry point rather than a copy.
- **Eight macros define a private `esc()`** with an identical body. `TBE.esc` now
  exists in `_lib.js` and anything new uses it, but the eight were left alone:
  they shadow harmlessly and removing them is not what brought anyone into
  those files. Opportunistic cleanup when something else takes you there.
- **Idempotence on shared chat cards** (the third scope question) is still not
  addressed anywhere. Nothing shipped in v0.38.0 adds a clickable card, so it
  did not become urgent, but B3 ("remember the last attack") and any future
  apply-damage button will make it so. The Zweihänder message-flag pattern is
  logged in the prior-art section.
- **B2 (radial modifier buttons with a memory)** and **B3 (remember the last
  attack)** were not reached. Both are table-feel rather than correctness, and
  B3 carries the safeguard that matters: prefill the choice, never the commit,
  or the memory spends Resolve nobody chose this round.

# Backlog

Sequencing lives in `ROADMAP.md` (the maturity-based phase model and where the
project currently stands against it). This file is the findings list that feeds
it: what is confirmed missing or broken, not yet built or fixed. Kept here instead
of trickling out one surprise at a time. Each entry names the chapter/page
so the next pass can probe-before-build the same way everything else in
this system was built.

## MVP scope — the bar, and what's in/out (set 2026-08-30, by Seb)

**Not a completeness bar. An honesty bar.** The module must never look like
it did something it didn't, and where it genuinely isn't automating
something, it has to say so. Everything the four audit rounds and the live
playtest found sorts into three piles once that single test is applied.

The distinction that matters: "this isn't built yet" is fine — a GM reads
the book and runs it by hand, the way tables always have. "This looks built
but silently isn't" is the one that erodes trust, because the player did
their part (ticked the box, spent the XP, typed the number) and got
nothing, with no signal anything went wrong. That's the same line as the
standing quality bar: *"things go nowhere on the sheet is an
embarrassment."*

**The preferred shape of a fix here is the Unbalance instinct**: don't build
a status-effect engine that intercepts every future roll looking for a
lingering -20. Put the number where the human making the next roll will see
it, and let them apply it. For a GM-run game that is often the *better*
answer, not a compromise — one line of dialog text instead of a
cross-cutting automation layer, and a human adjudicating a modifier is
completely normal at this table. Most of Tier 0 below is that move.

### Tier 0 — **shipped in v0.21.0**

Each claimed something it didn't do, or destroyed state a player already
committed to. All five are fixed; the struck text below is what they were.

- ~~**Maneuver riders are non-functional** — Unbalance, Lock, Disarm,
  Disadvantaged, Restrained paint a token icon and do nothing else. Five of
  eleven Combat Maneuvers.~~ **Fixed in v0.21.0** exactly as prescribed: the
  card states each rider's cost in the book's terms and who applies it, and
  every roll dialog that shows encumbrance now also shows what is riding on
  that actor. Reading the maneuvers properly also found two rule errors:
  Compel Surrender painted a Disadvantaged status although p.164 *requires*
  the foe to already be disadvantaged (it now asks for the Willpower roll at
  -10 per 3 DoS), and Lock's "no target more than two Sizes larger" was never
  enforced. Real consumption (auto-detect, apply, clear) is still past MVP.
- ~~**Initiative is never wired to Foundry's tracker** — the sheet's
  Initiative stat has zero effect on turn order.~~ **Fixed in v0.21.0**:
  `1d10 + Initiative` (p.161), enemies static, ties to the PC. Worn armor's
  penalty is part of the same rule and had three separate implementations
  (sheet, Cast, Finish Character); it is derived once on the actor now.
- ~~**Haggle's negotiated price never touches the actor's silver** — the whole
  point of the macro produces a number and discards it.~~ **Fixed in v0.21.0**,
  including refusing a purchase the purse cannot cover rather than letting
  `system.silver`'s `min: 0` silently zero the character's money.
- ~~**Repeatable stat-Talents stop stacking after the first purchase** (Tough,
  Death, Combat Awareness, ...). Later purchases burn real XP for nothing.~~
  **Fixed in v0.21.0**: the ActiveEffect scales with ranks. The same pass added
  the book's own purchase caps (three times, five times, Armor Training I-IV),
  which nothing had been enforcing either — `CONFIG.TBE.rankCap()` owns them
  and both the effect payout and the purchase gate read it.
- ~~**Build Character sits in the Solo Panel as an equal choice beside the
  Wizard while silently building an incomplete character** (no Cultural
  Background at all).~~ **Fixed in v0.21.0**: dropped from the panel, and it
  now states what it skips before it builds anything rather than in the notes
  afterwards. Still in the compendium for the quick path.

**Already shipped in v0.18.0** (three of this tier landed before the list
was written — see CHANGELOG):
- ~~Ammo silently stops reporting once depleted (Attack).~~
- ~~Cast's Thread checkboxes wipe on tick.~~
- ~~Wounds & Recovery's "Rest area" doesn't write Resolve/Fatigue back.~~

### Shipped in v0.20.0 — the funnel, and single ownership for generation

Not from the tier list: this came out of a design conversation about running
a DCC-style funnel in TBE (a settlement is sacked, the survivors become the
PCs). Building it meant touching the skill catalogue, the Expertise ladder,
the Ability Score rule and the Talent Item shape, all of which existed in
more than one place, so the ownership pass came with it.

- **TBE: Funnel** and **TBE: Funnel Roster** — roster generation, Bonds,
  Scars, and survivor-to-character conversion. `data/funnel.json` (50 trades
  on d100, 20 Bonds, 10 Scars) is original content, labelled and treated the
  way `data/concepts.json` is.
- **TBE: NPC filed every skill it created under "Adventuring"** and created a
  skill called "Weapon" that does not exist in this game. Both fixed; it now
  also rolls a trade and the book's Ability Scores, so an NPC arrives with
  real numbers instead of five generic skills at 35.
- The skill catalogue, the Expertise ladder, the Ability Score application,
  the 1d6-twice roll, the Talent Item shape and the catalogue name lookup all
  have one owner in `_lib.js` now. `docs/ownership.md` has the rows.
- `funnel_check.mjs` (47 checks) verifies the catalogue against Ch.3 p.30-32
  and breaks each data check to watch it fail.

Still open from this work:

- `data/funnel.json`'s trades are hand-written original content with no
  extractor and no book to verify against — `funnel_check.mjs` checks their
  shape (d100 coverage, real skill names, complete rows) but nothing can
  check their *judgement*. If the trade list ever grows, that stays true.
- The funnel has no clocks, Pressure track or Danger Pool. The design
  conversation sketched all three on top of Extended Rolls and the Timer Die;
  `TBE: Clocks` already exists and may be most of it. Not built.
- Conversion drops the survivor into `TBE: Finish Character` for career,
  Cultural Background and Life Events. That hand-off is a sentence on a chat
  card, not a flow.

### Tier 1 — cheap, batch as one pass — **shipped in v0.19.0**

One-table or one-formula corrections, worth doing together since they're
all the same size.

- ~~Skill Roll's difficulty dropdown has a fabricated "Trivial +40" tier and a
  wrong "Severe" (-40, should be -30). Straight data fix.~~ **Fixed in
  v0.19.0** — removed the fabricated tier, corrected Severe to -30, matching
  p.24's Difficulty Modifier table.
- ~~Weapon Of Faith's prerequisite check blocks the exact character it should
  allow. Regex fix.~~ **Fixed in v0.19.0** — `stripNegation` helper added to
  `TBE.talentEligibility`'s `missingPrereq` check so the requirement string's
  negation is parsed correctly instead of substring-matched raw.
- ~~Buying Godbound through Advancement doesn't grant the Piety skill it's
  supposed to. ~3 lines.~~ **Fixed in v0.19.0** — Talents macro now grants
  Piety (starting value 30, book-capped at 90 per p.51) when Godbound is
  purchased post-creation.
- ~~Opposed Roll never gives the defending side Expertise — one missing skill
  picker. Matters every time a defender has a real Expertise tier, which the
  sim says is common.~~ **Fixed in v0.19.0** — added manual Expertise
  dropdowns to both sides (Side B has no from-sheet picker, so a duplicate
  skill picker would misleadingly read Side A's controlled token).
- ~~The encumbrance-modifier-not-actually-prefilled bug repeats across four
  macros from one shared helper. **Fix it once, in the helper.**~~ **Fixed in
  v0.19.0** — new `TBE.encMod(actor)` in `_lib.js` is the single owner; Skill
  Roll, Opposed Roll (Side A), Haggle (PC side), and Extended Roll (new
  Modifier field) all read from it now.
- ~~**Social Encounter still shows players the hidden Tolerance.** v0.18.0
  added an opt-in "hide it" checkbox but left it **unchecked by default**,
  to avoid silently changing an earlier deliberate choice. Seb's call here
  is simpler and overrides that: p.251 says hidden, so hide it — flip the
  default (or drop the display line outright).~~ **Fixed in v0.19.0** — the
  "hide it" checkbox now defaults to checked.

### Tier 2 — **shipped in v0.22.0**

Bigger builds, or systems a GM already runs fine from the book. Three of the
five were larger than their summaries: the Traits table was mis-extracted
rather than merely incomplete, the Journey rations rule was inverted rather
than muddled, and fatigue-based wounds were missing from two macros, not one.

- ~~Extended Roll's Timer Die.~~ **Shipped**: d6-d20, fires at or under the
  intervals passed, complication or premature end declared at setup, a
  complication drawing twice on the Event Randomizers (p.24).
- ~~Journey Leg's missing Fatigue Table roll and the rations mixup.~~
  **Shipped**: the full table and its modifier list, rolled and applied; the
  rations rule turned the right way round (the die is not rolled on a Journey,
  a step of it buys -1 Fatigue); a critically failed Track roll is -3, not -1.
  Also found while walking it: the arrival Infection check had been reading
  `flags.tbe.toughness`, which nothing writes, so it ran at Toughness 0 for
  every character.
- ~~Fatigue-based wounds not feeding Death Threshold math.~~ **Shipped** as
  `TBE.addFatigue()` / `TBE.removeFatigue()` (Ch.11 p.189), used by Journey Leg
  (Weary) and by Cast (Weave), which had been quoting the overflow rule at the
  player without applying it.
- ~~NPC generation gaps: half the Traits table missing, Dodge/skill-floor math,
  wrong skill groupings, no Ferocity.~~ **Shipped**: all 50 Traits rows now
  extracted and verified by `parse_npc_traits.py` (29 were mis-parsed and
  silently filtered out of the build), the book's real skill bands and floor of
  35, Ferocity from the Difficulty table, and the groupings fixed in v0.20.0.
- ~~The duplicated-logic findings.~~ **Shipped**: `strandCap` defers to the
  system's copy; the "third copy in Status Effects" claim was checked and is
  false (it reads the shared table), and `tier2_check.mjs` now asserts the two
  real copies are identical so they cannot drift.
- ~~Cast's Weave Reaction Resolve-clamp.~~ **Shipped in v0.18.0** — listed
  as past-MVP in the reframe, but it had already landed.

### Addendum — corroborated by a second, independent review pass

A separate review session (working from a packaged snapshot of the
compendium plus the rulebook HTML, not this live git tree — treat any line
numbers it cited as approximate) reached the same Tier 0/1/2 shape
independently and added a development protocol (now folded into CLAUDE.md
as "Ownership discipline for shared rules" and "Shipping cadence: batch by
tier, not by bug") plus a seeded `docs/ownership.md`. **Not started** —
this addendum is documentation only, same as the MVP scope section above.

Three items that pass named as Tier 0 were already fixed by the time it
landed (this pass didn't have visibility into v0.18.0): ammo-depletion
reporting, Cast's Thread checkboxes, and Wounds Rest area not writing
Resolve/Fatigue. No action needed on those three.

Four new findings from that pass, independently verified against the live
source before logging here (not just taken on faith):

- **Weapon Of Faith's own prerequisite text blocks the character it's
  meant to allow.** Its `requires` field reads "...a faithful adherent of a
  god (you do not require the Godbound Talent)" — but `TBE.talentEligibility`
  (`_lib.js`)'s `missingPrereq()` does a plain substring match for any
  catalogue Talent name inside `requires`, finds "Godbound" inside that
  parenthetical, and blocks the Talent for anyone who doesn't own Godbound —
  exactly backwards from what the sentence says. Confirmed by reading
  `missingPrereq()` directly: it has no awareness of negation. Tier 1.
- **Buying the Godbound Talent post-creation grants no Piety skill.**
  Chargen creates a "Piety" Lore skill at 50 when Godbound is picked as a
  *career* (`tbe-character-wizard.js` line ~1945), but grepping
  `tbe-talents.js` (the macro that actually charges XP and grants Talents
  post-creation, including Godbound as a Talent) turns up zero handling of
  Piety at all — buying Godbound later charges 10 XP and adds the Talent
  Item with no corresponding skill. Book gives Piety a starting value of 30
  from the Talent itself. Tier 1.
- **NPC generation hardcodes every skill's group to "Adventuring."**
  `tbe-npc.js` line ~74 writes `group: "Adventuring"` unconditionally for
  every skill it creates, instead of using `tbe-character-wizard.js`'s real
  `SKILLS` category map (line ~34) — miscategorizes Dodge, Weapon, and
  Insight-type skills on generated NPCs. Now tracked as an ownership-ledger
  row (`docs/ownership.md`) rather than only a Tier-2 line item, since the
  real fix is "point at the Wizard's map," not a one-off table.
- ~~**Haggle's opposed-roll tie-break cascade has drifted from Opposed
  Roll's.**~~ **Checked in v0.22.0 against p.20 and closed as not a defect.**
  The book's cascade is conditional on its own terms: "Both rolls fail:
  Neither wins. **If a winner is required** — such as a failed *Stealth*
  opposed by a failed *Perception* — the higher modified skill value wins,"
  and likewise "if a winner is required, the normal failure beats the
  critical failure." Haggling requires no winner: the price moves on the
  winner's DoS and two failures produce none, so "no price change" is the
  correct outcome either way. Opposed Roll needs the cascade because a
  Stealth-vs-Perception standoff has to resolve; Haggle does not.

Two claims from that pass were logged as TBD rather than accepted at face
value. Both have since been checked against the live tree: the
encumbrance-prefill gap was real and spanned three of the four macros plus one
that had no modifier field at all (fixed in v0.19.0), and the claim that
`tbe-statuses.js` carries a third copy of the status table missing a flag is
**false** — it reads the shared `TBE.STATUSES` and the two copies that do
exist match exactly (checked and now enforced in v0.22.0). Worth remembering
when weighing the next snapshot-based review: one of its two speculative
claims held up and one did not.

### Scope in one line

Five remaining Tier 0 silent failures, one batched pass of six cheap Tier 1
corrections, and consciously leave Tier 2 — being explicit about which of
those the book already lets a GM handle by feel. Roughly a day of focused
changes, not open-ended audit mode. It's the set that stops a session
producing another moment like the Unbalance one, where a player did the
right thing and the table found out later it didn't matter.

## Phase 4 content batch

### First batch — shipped in v0.23.0

The first batch filed under the roadmap rather than the MVP tiers. All four
were the same shape: the book says something outlives the roll that caused it,
and nothing carried it.

- ~~Weapon Readiness (Held and Ready / At Hand / Stored, and the action to
  change between them).~~ **Shipped**: three states on weapons and shields, the
  cost named in TBE: Attack's picker and on its card.
- ~~Weave Scar results (-20 to a Bind until sunrise/set, and -1d6+2
  permanently).~~ **Shipped**: the permanent one written into the Bind, the
  temporary one held against it and taken off the value a casting rolls
  against, with the true value left alone for Advancement.
- ~~Reality Snag's +5 to future Weave Reaction rolls until sunrise/set.~~
  **Shipped**, along with the d6 buckle table every further spell triggers.
- ~~Counterspells (Hold to Interrupt against incoming magic).~~ **Shipped** as
  `TBE: Counterspell`.

### Phase 4, second batch — Intrigue — shipped in v0.24.0

A survey pass first: every candidate (the six remaining Weave Magic
subsystems, Divine Magic, Intrigue) was read and sized against the book
before picking one, rather than guessed at from chapter titles — see
`ROADMAP.md`'s "Where the project actually is" for the sizing table.
Investigations and Chases came out smallest and least entangled with
anything else still missing, so they went first.

- ~~Investigations: not built.~~ **Shipped**: it's `TBE: Extended Roll`
  (p.267 says so directly), plus a clue-count readout and the Suspicion Die
  variant (Tolerance, an "Exposed" Timer effect).
- ~~Chases: not built.~~ **Shipped** as `TBE: Chase` — Quick Chase (one
  opposed roll) and Prolonged Chase (a pursuer-vs-prey tracker with a
  per-round Timer Die).
- Found while wiring it, not fixed here (different macro's bug): `TBE:
  Extended Roll` was never added to `build.js`'s `NEEDS_TABLES` set, so its
  Event Randomizer complication draw has no bundled fallback data if `TBE:
  Install Tables` hasn't been run in the world yet — it would warn "no data
  for..." instead of drawing. `TBE: Chase` was added to that set correctly
  when it picked up the same call.

### Phase 4, third batch — Rituals, Summoning, True Names — shipped in v0.25.0

Taken in the dependency order the survey found: True Names first (both of the
others reference it), then the ritual procedure, then Summoning on top of it.

- ~~True Names: not built.~~ **Shipped**: the Language roll, the 1d10 Fraying
  die, the not-consumed/not-counted rules and the alert, wired into TBE: Cast's
  Arcane Tether range; the name's language is now a real field.
- ~~Rituals (the procedure, as opposed to the shaping): not built.~~
  **Shipped** as `TBE: Ritual` — casting hours, concentration, all four Mastery
  sources, the Casting Results Table, Magic Circles, rushing, Blood Magic with
  its d10 marks, grimoires, and Pacts with their Price Timer Die.
- ~~Summoning: not built.~~ **Shipped** as `TBE: Summoning` — the circle, both
  opposed contests, containment for the caster's Arcana Score in days, decay,
  renewal, control, banishment and release.

### Phase 4, fourth batch — Enchantments and Alchemy — shipped in v0.26.0

Taken in the only order the book allows: Alchemy is stated in terms of
Enchantments' Weave Reagents.

- ~~Enchantments: not built.~~ **Shipped**: a new `enchantment` Item type
  covering all four shapes, `TBE: Enchant` to make them, `TBE: Use Enchanted
  Item` to spend them, and the reagent-for-Fraying substitution.
- ~~Alchemy: not built.~~ **Shipped**: brewing, the reagent cost by TC, the
  four Alchemical Aids, the yield roll, and unstable batches.
- ~~Both need new Item shapes.~~ One type, not two: a potion is the
  single-use case with doses, so it shares the schema and the sheet.

**Chapter 14 is now complete.** Every subsystem in it is built.

Still open in this area:

### Phase 4, fifth batch — Divine Magic — shipped in v0.27.0

- ~~Divine Magic (Domains, Miracles) is untouched.~~ **Shipped**: `TBE: Miracle`
  for the Piety roll and `TBE: Pious Act` for everything that restores it, with
  all 20 Domains and their 218 miracles extracted and verified. The sizing was
  right that Miracles had to come first — the Domain lists are only reachable
  once a Piety roll decides which level of miracle is granted.

**Phase 4 is complete.** Every system in the content matrix is built.
- ~~`parse_talents.py` is still a regex extractor with no self-check~~ —
  **this was already wrong when written.** `parse_talents.py` has carried a
  full self-check since 2026-08-28 (round-trip name matching plus mutation-
  tested assertions for repeatability wording, the two 10-XP Talents, and
  punctuation-bearing names). `ROADMAP.md`'s content matrix said otherwise;
  corrected there in v0.24.0.

## Phase 5, first pass — played session + correctness audit — shipped in v0.28.0

A character built, walked through travel, an encounter, a fight, a status
check, an investigation, a prayer and an advancement, reading every card as a
player rather than as its author; then an audit against the "what correct
means" list at the top of CLAUDE.md. All fourteen existing check scripts were
green before, during and after. Five defects, all shipped, all invisible to
them:

- ~~Any character could open TBE: Miracle and be permanently Cast Out.~~
  **Fixed.** The Godbound gate is `TBE.godbound()`, both chargen paths were
  handing every character the Piety-0 skill it keys on. Details in
  `docs/ownership.md` and the v0.28.0 changelog.
- ~~Career skill points over the 70 cap were discarded in silence while the
  card reported them as spent.~~ **Fixed**, and the allocation dialog now shows
  each skill's current value and remaining room.
- ~~TBE: Clocks and TBE: Extended Roll were the same rule in two stores, and
  TBE: Status read the wrong one.~~ **Fixed**: Clocks retired into a migrator.
- ~~The printed page number shipped inside 20 creature ability notes and one
  NPC trait row.~~ **Fixed** in both extractors, with guards.
- ~~"Brakk-Thuun)" and "Skarn)" instead of Brutesworn (Brakk-Thuun) and Orc
  Chieftain (Skarn).~~ **Fixed**: the name walk runs until parens balance.

Still open from this pass, deliberately not fixed here:

- **TBE: Status reports "Body impaired: roll Endurance or drop in Shock" and
  does not roll it.** The card names the next step and does not offer it; the
  same is true of the impairment line on the TBE: Attack card. Cheap, but it
  is a change to the combat cards and belongs with a combat pass, not a
  five-defect batch.
- **The Empires List is empty on a fresh world, and TBE: Journey Leg rolls on
  it.** A random event that resolves to "(empty slot — choose an element)" is
  a dead result on the first session anybody plays. Either the journey card
  should say the list is unpopulated and point at TBE: Empires List, or the
  event should be re-rolled without the list element. Needs a decision.
- **`TBE: Extended Roll` appears twice on the Solo Panel** (under "Act" and
  "Talk it out"). Harmless, both contexts are real, noted so it is not
  "discovered" again.
- **Phase 7 has still never been started.** Every check in the suite runs
  against the working tree, not the zip.

## Outside release audit — shipped in v0.29.0

The 0.28.0 zip was read by someone who had not written it: full file tree, every
module and template, the manifest, the packs, cross-checked against the live
Foundry V14 API. Sixteen check scripts were green throughout. Everything it
found was a case of the code doing exactly what the code said.

Every claim was re-verified against the source before being acted on, which is
the standing rule for outside reviews here. Three did not survive that:

- **"The tests are missing from the artifact."** They are not. All sixteen check
  scripts live at repo root and the delivered zip is `system/the-broken-empires/`
  only, by design (CLAUDE.md says so). Nothing is lost.
- **"The duplicate `sizeEffects()` is an architectural drift bug."** Real drift,
  but dead code: only `tbe-attack.js` calls it and that resolves to the macro
  pack copy. A loaded trap, not a live defect. Fixed anyway, correctly labelled.
- **"The V14 status bug is a startup blocker."** It is, but it was being offered
  as the explanation for a tester whose system did not appear in the
  world-creation list. It cannot be: Foundry builds that list from `system.json`
  manifests scanned at startup, before any system JS runs. Two separate problems.

Fixed, all shipped:

- ~~V14 could not start the system: `CONFIG.statusEffects` is a keyed object from
  V14 on, and registration called `.find()`/`.push()` on it.~~ **Fixed**, by
  branching on the shape found rather than on a version number.
- ~~Every PC rolled `1d10 + 0` for initiative.~~ **Fixed**: the Character
  DataModel's `getRollData()` overrode the base without `super`, and the fields
  it dropped are derived properties rather than schema fields, so nothing else
  could supply them. Creatures were correct throughout.
- ~~One Talent did not exist, and eighteen carried the wrong purchase cap.~~
  **Fixed**: three faults, one header-boundary gap. See the v0.29.0 changelog.
- ~~Five creatures shipped with no Ferocity.~~ **Fixed**: a footnote marker on
  Move stopped the stat-line pattern and the optional group let it pass empty.
- ~~No migration layer existed at all.~~ **Built**: `module/migration/`.
- ~~LevelDB runtime files and a stale hand-typed macro count shipped.~~ **Fixed**,
  both generated by the build now.

Still open from this audit, deliberately not taken in this batch:

- **ApplicationV2.** Both sheets extend the V1 `ActorSheet`/`ItemSheet`, which
  Foundry has deprecated since V13 though V14 still exposes them. This is real
  and should be scheduled, but doing it in the same batch as rule consolidation
  would mix a framework migration into a correctness release. Its own project.
- **`validateJoint()` on the DataModels.** The schemas validate fields but not
  the relationships between them, so contradictory states are representable: an
  equipped armor with no location checked, a `single`-kind enchantment carrying
  charges, a Supply die of 7 where the domain is 0/6/8/10/12. Worth doing, and
  worth doing carefully, because every joint rule added is a way for an existing
  world to fail to load.
- ~~**The rules-ownership seam generally.** `_prepareEnc()` still carries the
  comment "kept in sync by hand"... Not started.~~ **`sizeEffects` and
  encumbrance single-owned.** `helpers/config.mjs`'s `TBE.sizeEffects()` and
  new `TBE.encumbrance()` are the one owner of each rule's arithmetic; the
  macro pack reads both off `CONFIG.TBE.*` at runtime (the `rankCap`/
  `strandCap` pattern) and the sheet imports `TBE.encumbrance` directly.
  `audit_check.mjs` proves the deferral with a sentinel return value, not
  just an equal one. `_prepareEnc()`'s comment no longer says "kept in sync
  by hand" — it says what it actually still owns (gathering six numbers from
  its own pre-split item arrays, which the macro's `TBE.encStatus()` still
  does independently from a whole actor's `.items`, since that half genuinely
  is two different starting shapes, not one duplicated rule). This is the
  pattern extended to two rules, not finished for every shared rule in the
  tree — `docs/ownership.md`'s first row (the opposed-roll d100 resolution
  cascade, `TBE.resolve`) is still "not yet extracted," and any other
  duplicate found later gets the same treatment, not a fresh pattern.
- ~~**Localization is nominal**... that intent is not written down anywhere.~~
  **Closed in v0.30.0**: README's "Language" section states English-only as a
  deliberate decision rather than leaving it an unanswered question.
- ~~**External Google Fonts `@import` in the CSS.**~~ **Closed in v0.30.0**:
  the `@import` is gone and every font-family now carries a real local
  fallback stack. Bundling the actual woff2 files (they're OFL-licensed) is
  the nicer answer and is still open, but the outbound request and the
  offline-world breakage are both fixed.
- **Creatures have no structured action model.** Attacks live in attached items
  and macro text rather than as a native `attacks[]`/`traits[]` shape.

## Second outside audit — shipped in v0.29.1

The 0.29.0 zip was re-read by the same outside reviewer against the previous
one. It found a migration bug that 0.29.0 introduced while fixing everything
else, and that 0.29.0's own check script had asserted was impossible.

The lesson, written down because it is the useful part: **the check was not
wrong, it was the wrong shape.** It read `migrateWorld()` and confirmed the
function only wrote the version when its own report was clean. True. But the
clock stage ran afterwards in the ready hook, so the property actually being
claimed — "the version only advances when the whole pass succeeded" — was a
statement about a *sequence*, and no static read of either half could see it.
`audit_check.mjs` section 7 is now sequential: it runs the real module against
a stubbed world and asserts over transitions (run, fail, run again, inspect).

Reviewing the report against the source found the migration was worse than
reported — wrong setting key, an Array written over an object store, wrong
field names, and a missing filter, any of which was worse than the bug that
was reported. Root cause: the conversion already had a correct tested owner
(the retired TBE: Clocks macro) and the migration layer reimplemented it. That
is the duplicate-ownership mistake this ledger exists to prevent, made while
building the mechanism meant to prevent it.

- ~~Migration committed the version before every stage had run.~~ **Fixed**:
  `migrateAll()` is the only writer and runs last.
- ~~The clock stage was broken four ways.~~ **Fixed by deleting it**: the layer
  now detects stranded clocks, reports them, holds the version, and points at
  the macro that owns the conversion.
- ~~"Fresh world" meant "no Actors and no Journals".~~ **Fixed**: any populated
  collection counts.
- ~~README said 149 Talents while the changelog said 150.~~ **Fixed**: every
  count in that table is generated from the packs.
- ~~Write-ahead logs shipped, one holding 116 KB of live data.~~ **Fixed**:
  compact first, then strip only empty logs, then reopen and verify.
- ~~`flags.thebrokenempires` dead read.~~ **Removed.**
- ~~Per-rank effect scaling inferred from "ADD mode and numeric".~~ **Fixed**:
  the build's explicit mark is honoured, opt-out rather than opt-in (opt-in was
  tried first and `tier0_check.mjs` caught it reintroducing inert Talents).

Still open from this audit:

- **`flags.tbe` vs `flags.the-broken-empires`.** Both are live: `tbe` holds
  clocks/funnel/session/weave, `the-broken-empires` holds chargenLedger and
  freeArmor. Consolidating means migrating every existing world, so it is a
  decision with a cost, not a tidy-up. Needs a call.
- **`validateJoint()` on the DataModels.** Contradictory states are still
  representable: equipped armor with no location checked, a `single`-kind
  enchantment carrying charges, a Supply die of 7 against a 0/6/8/10/12 domain.
  Worth doing carefully — every joint rule added is a way for an existing world
  to fail to load.
- **`_prepareEnc()` still says "kept in sync by hand".** `sizeEffects` is now
  pinned by a test, but the audit is right that pinning is a safety net and not
  an ownership model. The target shape is one runtime owner both the sheet and
  the macros read.
- ~~**Derived data is written onto `this.system`** as undeclared properties
  (`armorBulk`, `armorInitPenalty`, `initiativeEffective`)... Needs either a
  `_derived` namespace or a written rule.~~ **Took the written-rule half in
  this session** (CLAUDE.md rule 11): the three fields are documented at the
  point they're assigned (`documents/actor.mjs`) as recomputed
  unconditionally every pass, never trusted from a save, and
  `derived_data_check.mjs` enforces it — a static scan confirms no
  `actor.update()` call anywhere writes one of the three paths, and a
  sequential test seeds a poisoned value, runs `prepareDerivedData()`, and
  confirms it's gone, with a mutation proving a conditional ("only if not
  already set") version would have let it survive. Also found and removed
  four more of the same shape that were genuinely dead — `base-actor.mjs`
  eagerly copied `totalWp`/`lethalityLevel`/`dying`/`sizeIndex` onto
  `this.wp`/`.ll`/`.isDying`/`.sizeIdx` and nothing anywhere read any of the
  four; the live getters were doing the real work all along. **The
  `_derived`-namespace half is still open** — it would make the ephemeral/
  schema distinction structural instead of written, but means touching
  every read site across the sheet, the macro pack, and the `.hbs`
  templates, which is a bigger blast radius than three fields (now
  guarded, not just documented) currently justify.
- **`ranks` is floored at 1** in the derived layer, so a malformed `ranks: 0`
  is reinterpreted rather than rejected. Belongs with the `validateJoint()`
  pass.
- ~~A **migration fixture matrix** (worlds at 0.21, 0.22, 0.27, 0.28 migrated
  forward and asserted).~~ **Built**: `migration_fixtures_check.mjs`, 21
  checks. Turned out smaller than the four-version framing implied, once
  checked against what CHANGELOG.md actually says changed at each version:
  `STEPS` has exactly one real entry (the 0.22.0 Toughness flag), so 0.21.0,
  0.27.0 and most of 0.28.0 genuinely need nothing done to their data — what
  the matrix actually proves is that "nothing to do" still advances the
  recorded version instead of looping forever, and that 0.28.0's live clocks
  are exactly where the stranded-clocks path has to fire. Also covers a
  single-jump upgrade (0.20.0 straight to current, a hand-patched legacy flag
  and a live clock in the same pass) and a mutation guard reproducing the
  "overwrites a real value" class of bug design rule #1 in `migration.mjs`'s
  own header exists to prevent.
- **ApplicationV2** still unstarted.

## Prior art: other Foundry systems — researched 2026-09-17

Surveyed d100/hit-location Foundry systems and system-agnostic modules for
combat, skill-roll, social-encounter, journey and solo-play patterns worth
studying, prompted by the first real session. Full writeup, with the license
tier for every source named below: `docs/prior-art-foundry-systems.md`.
**License-tier reminder inline on every entry** — permissive sources
(Apache-2.0/MIT) can be read and adapted into TBE directly; copyleft/
restricted sources are design reference only, never code to paste in; and
every source's compendium *content* (rules text, stat blocks) stays
publisher IP regardless of the code license.

None of these are started. Each needs its own ownership-discipline pass
(name the capability, grep current implementations, state the owner) before
a line of code is written, same as any other item here.

- **Damage pipeline as one owning method, per-location AP indexed rather
  than recomputed** (from WFRP4e, Apache-2.0, code-adaptable). TBE's
  six-location wound arithmetic is currently split across `tbe-attack.js`
  and `tbe-wounds.js`. WFRP4e's `applyDamage()` shape — prepare AP per
  location at data-prep time, index it at the moment of damage, one method
  owns Toughness/AP/Ward-style reductions and writes the final loss — is
  the same lesson CLAUDE.md's ownership discipline already enforces for
  rules and constants, applied here to a damage *pipeline*. Not urgent on
  its own; worth doing if/when `tbe-attack.js`'s damage application is
  next touched for another reason (e.g. the Friday combat-pass macrobar
  work), not as a standalone refactor.
- **Idempotence guard on any chat card more than one client can act on**
  (from the Zweihänder community system, license unverified per-fork —
  reimplement the *pattern*, i.e. a message flag or disabled-after-click
  state, never copy code without confirming the fork's license first).
  Relevant the moment B1 (shield line on the attack card) or any future
  Apply-Damage button lands: two clients clicking the same card's action
  must not double-apply a wound. Fold into whichever future work adds a
  clickable action to a shared chat card, don't build it speculatively.
- **Social Encounter: a persistent NPC Item, scoped with Seb on 2026-09-17.**
  Modeled on `bruceamoser/draw-steel-negotiation-test-tool` (MIT,
  directly code-adaptable) for the *shape* of a persistent negotiation-partner
  document — **not** for its Interest/Patience mechanic, which the book does
  not have and which "Use Rules as Written Always" rules out. Ch.13 p.249-264
  already covers that job with Tolerance (a hidden countdown of allowed
  attempts, p.251: "the Tolerance is hidden from the players") and a running
  SL total against fixed thresholds — confirmed against `/tmp/tbe.txt`, not
  reconstructed from memory.

  **The scope, decided, not just proposed:**
  - A new Item type (working name `social-npc`) is the NPC's **identity**:
    name, portrait, Motivations and Pitfalls (each individually revealable —
    the reveal-layer idea two entries above this one, now folded in here
    rather than built twice), and a log of past encounters with this NPC
    across sessions. Lives in the World Items directory like any other Item,
    so it gets Foundry's folders/permissions/duplication for free and can be
    dragged into a scene or a compendium.
  - **The tracker stays the single owner of the live numbers.** Tolerance,
    SL total, attempts used continue to live in the world-setting tracker
    store exactly as `TBE.trackers()` / `TBE.saveTracker()` work today, so
    `TBE.trackerLine()`, `TBE.openTrackers()` and the other four tracker
    kinds (extended, chase, ritual, pact, circle) do not fork into a special
    case for social. Rejected explicitly: moving Tolerance/SL onto the Item
    itself, which would make social the one tracker kind not living in the
    world-setting store — the same "one owner for a data path" reasoning
    that v0.33.0's Initiative fix and rule 12 exist for, applied here before
    a second store gets built rather than after.
  - One new field ties them together: a `social-static` tracker gains an
    optional `npcItemId`. Existing/old trackers with no link behave exactly
    as they do now — additive, per CLAUDE.md's migration design rule 4.
  - **Static only.** Competitive is multiple sides vying for a third party,
    not one NPC being negotiated with — Moser's tool and this Item both model
    a one-NPC relationship, and stretching it onto Competitive's side model
    was considered and explicitly declined.

  Not yet built. Next step when picked up: DataModel for the new Item type
  (follow `item-skill.mjs`'s style), a minimal sheet, wiring `npcItemId`
  into `tbe-social-encounter.js`'s status block and start-new-tracker flow,
  and a check file proving the tracker/Item link survives a tracker ending
  (mutation-test the "old tracker, no link" path explicitly, the way
  `migration_fixtures_check.mjs` fixture G/H prove old data isn't silently
  mishandled by new code).
- **TOR2e's Fatigue → Weary status loop** (MIT, code-adaptable) as a model
  for wiring TBE's Supply dice (gear/ammo/rations/medical) into an
  *automatic* status rather than a number a GM has to remember to apply.
  TOR2e combines a Journey burden with equipped Load to flip a Weary
  condition; TBE's Supply attrition (Ch.?, see Equipment section above)
  currently reports depletion without applying a mechanical consequence.
  Needs the same rules-first check as Social Encounter above — confirm
  what consequence the book actually attaches to depleted Supply, if any,
  against `/tmp/tbe.txt`, before building automation for one that doesn't
  exist.
- **Benchmark TBE Solo Tools' Solo Panel against Mythic GME Tools'** (design
  reference only, restrictive redistribution terms on the oracle content).
  A UX comparison pass, not a port: does the Solo Panel's launcher and its
  one-click-event flow hold up against the dominant tool in this space.
  No code follows from this one, just a review.
- **Not adopting, logged so it isn't proposed again**: GPL-licensed sources
  (Argon Combat HUD Core, RMSS/RMFRP) and CC-BY+Foundry-Limited sources
  (Token Action HUD Core) as *code* — TBE is not GPL and copying from them
  would create a real licensing obligation. Their designs remain fair to
  study and reimplement independently; their source is not fair to paste.

## Prior art: Draw Steel Codex/Foundry system — researched 2026-09-14

Read both Draw Steel codebases (the MetaMorphic-Digital Foundry system, and
MCDM's own Codex app, Lua on DMHub) looking for elegant solutions worth
taking. Full writeup: `docs/prior-art-draw-steel.md`. Short version:

- **Not adopting GoblinScript** (their embedded expression language). Right
  answer to a problem TBE doesn't have; would be the largest scope creep
  available for a solo/GM system that deliberately keeps a human in the loop.
- **Prototyped the one idea worth taking**: `{expression|fallback}` inline
  text substitution, so a card's prose and the number it describes are
  provably the same string (the exact shape of the career-points/size-note/
  status-naming drift bugs this project keeps shipping). `TBE.resolveText`,
  `TBE.RESOLVE_HELPERS` and an optional third `actor` argument on `TBE.card`
  are live in `macros/_lib.js`, checked by `resolver_check.mjs` (mutation-
  guarded). **Prototype only** — no existing macro has been switched over to
  it yet; every current `TBE.card()` call site is unaffected (actor omitted
  = no resolution, verified by the check). Adopting it at any call site is
  its own task, not done here.
- **Checked, not adopted: riders as automated status effects.** Draw Steel's
  Foundry system automates a handful of conditions with two `if` statements
  inside the one function every power roll funnels through
  (`actor.statuses.has(...)` gating a bane). TBE has no equivalent chokepoint
  — `TBE.resolve()` takes an already-rolled number and an already-computed
  skill, not an actor — and of TBE's five Maneuver Riders only Unbalanced
  carries a flat number at all, and the book gives it an exception (not vs.
  Endurance-to-resist-Shock) and a non-stacking rule that DS's own flat,
  exception-free conditions don't have to handle. Codex's Lua
  `CharacterModifier` system is a different thing again — a GM-authorable
  plugin framework with its own editor UI, solving "let a GM extend the
  ruleset" rather than "run these five riders." Confirms the existing
  `TBE.RIDERS` design (print the number and its conditions, let the human
  apply it) rather than overturning it. No code change from this thread.

## Flow audit — v0.18.0 (Attack, Wounds & Recovery, Cast, Social Encounter, Advancement)

An independent flow-audit read-through (see HANDOFF.md's suggested next
pass) of the five macros not recently audited found fifteen real defects.
Full detail in CHANGELOG.md's v0.18.0 entry; all fifteen are fixed as of
this release. Logged here rather than left implicit:

- ~~Cast: Thread checkboxes/pool inputs wiped by the generic re-render
  listener.~~ **Fixed**: listeners scoped to `[data-shape]`.
- ~~Wounds & Recovery: Rest area never wrote Resolve/Fatigue.~~ **Fixed**.
- ~~Attack: depleted ammo silently skipped the "you're out" report.~~
  **Fixed**.
- ~~Advancement: a maxed Fade Bind spent XP before discovering it was
  capped.~~ **Fixed**: capped before `spend()`.
- ~~Wounds/Attack showed Death Threshold only, never Dying.~~ **Fixed**:
  shared `TBE.deathThresholdNote()`.
- ~~Cast: Weave Reaction mitigation wasn't clamped to available Resolve.~~
  **Fixed**: shared `_mitigationClamp()`.
- ~~Social Encounter: skill picker dropped Expertise/Savvy.~~ **Fixed**:
  swapped in `TBE.skillOptions()`.
- ~~Attack: weapon/defence pickers hid Expertise.~~ **Fixed**.
- ~~Attack: struck-location dropdown looked live but was overridden.~~
  **Fixed**: moved inline under Choose Location, restated wording.
- ~~Social Encounter: side selection was blind numeric guessing.~~
  **Fixed**: `compSideOpts` wired in.
- ~~Social Encounter: tracker `log[]` never written.~~ **Fixed**.
- ~~Social Encounter: round/turn counters frozen at creation.~~ **Fixed**:
  repurposed as an informational "next to speak" display (p.253
  turn-alternation has no book-specified penalty, so this stays
  informational, not a hard gate).
- ~~Social Encounter: the "hidden result" 2d10 Tolerance roll wasn't
  actually hidden.~~ **Fixed**: no longer added to the public `rolls`
  array. Also added an opt-in "hide the Tolerance number" checkbox
  (default unchecked, so existing tables see no behavior change unless
  they opt in) for p.251's "hidden from the players" rule.
- ~~Social Encounter: same-skill/failed-retry gate (p.255) only applied to
  Static.~~ **Fixed**: now applies to Competitive too, tracked
  tracker-level.
- ~~Attack's location-to-status-id map was hand-copied twice.~~ **Fixed**:
  `TBE.IMP_STATUS_ID` is the one copy now.
- ~~Advancement's Bind/Strand costs were hardcoded next to
  `MAGIC.rules`.~~ **Fixed**: read from the table.
- ~~Advancement/Wounds & Recovery: whole forms rendered ungated.~~
  **Fixed**: fields now labeled with which action(s) use them (`TBE.prompt`
  has no live re-render, so true show/hide isn't available — same
  constraint noted for the Attack/Social Encounter dialogs above).
- ~~`item-skill.mjs`'s Expertise-cap comment implied a nonexistent Ex1
  tier.~~ **Fixed**: comment corrected, no behavior change (the code was
  already right).

**Not built, surfaced by this pass, logged rather than guessed at:**
- `TBE.say`/`TBE.card` (`_lib.js`) has no whisper/blind-roll support at
  all — any `Roll` pushed into the `rolls` array it's given renders
  publicly. The 2d10 Tolerance-roll fix above works around this by simply
  not surfacing that one roll anywhere, which is honest but not the same
  as a GM-only whisper. A real fix (e.g. a `TBE.sayGM()` using
  `ChatMessage.getWhisperRecipients("GM")`) would let this and similar
  "hidden from players" rules (Tolerance itself, on p.251) show the real
  number to a GM without exposing it to everyone. Worth doing once more
  than one macro needs it.
- Wounds & Recovery's Rest fix reduces Fatigue and restores Resolve
  correctly, but Weary/Sleepless/Deprived Fatigue-based wound types
  (p.189) aren't modeled as a real wound kind anywhere in this system —
  noted in the macro's own code comment, not built here.

## Character Creation (Ch.7)

**As of v0.7.0, `TBE: Character Wizard` follows the book's real 12-step
order (p.78) start to finish, one window, nothing written to the actor
until Create Character.** Per direct user steer ("show tables in name
only... I have the book next to it, I just don't feel like inputting
everything manually"), the 12 steps split into two tiers:

- **Fully applied to the actor** (compact, well-defined mechanics, same
  standard as Race/Career already had): step 1 Starting Skills, step 2
  Race, step 3 Ability Scores, step 4 Attributes (writes `system.initiative`
  directly — closes the old Initiative-field gap below), step 5 Cultural
  Background (incl. Human Culture Language), step 7 Previous Career, step 7
  cont. Career Skill Points, step 8 Rounding Out, and the Talents each of
  these grant.
- **Table shown (name + roll range + Roll button), recorded to the Notes
  tab, but not mechanically auto-applied** — because the book states each
  result's exact bonus in prose among 2-3 skill choices, not as a clean
  data table: step 6 Life Events (Origin/Youth/Recent), Shared History,
  Relationship NPCs. The player looks up the rolled/picked line in their
  own copy and applies it via the Skills tab.
- **Free text, no table**: step 11 Character Goals.
- **Info only**: step 9 Equip Your Character (the Dagger is added live
  from the equipment compendium; armor-piece count and starting coin are
  rolled and reported; the actual shopping pass stays manual on the Gear
  tab — a full purchase UI is separate follow-up work), step 12 Status
  (Optional).
- Step 10, Personality Traits, is a straightforward checkbox pick from the
  book's named list and is fully built (also feeds Ch.8's Personality
  Changes, still itself unbuilt — see below).

Every random-determination table the book names as an explicit "or roll"
option (Race d100, Previous Career d10, Cultural Background d10, Human
Culture Language d100, all three Life Events tables d100, Relationship NPC
d4) now shows the actual table with a Roll button in the wizard, not just a
plain dropdown. Full 1-100/1-10 roll coverage on every table is exercised
by a headless smoke test before each release (`/tmp/smoke_wizard.js`,
not checked in) — this caught and fixed a real matcher bug in v0.7.0 where
a range ending in the book's "0 means max" notation (`"99-00"`, `"9-0"`)
silently never matched the top roll.

Not yet built for this chapter:
- **Cross-session draft persistence** — see the Hero Builder note under
  Tooling / UX below.
- A **full Equip Your Character shopping UI** (browse compendium items,
  spend the rolled silver, compute armor's Initiative penalty from what
  was bought) — currently info-only, per the scope note above.

~~**Separately discovered, unrelated to the wizard rewrite**: the 147-entry
Talents catalogue (`data/talents.json`) is missing "Allow Me To
Introduce…"~~ **Fixed in v0.9.0.** It was two, not one: "Run For Your
Life!" was also missing. Both names end in punctuation (`!`, `…`) that
`parse_talents.py`'s header character class did not allow, so they were
dropped silently on every run. The catalogue now holds 149, and the parser
verifies itself (round-trips every name against the book text, fails on any
rejected header). Original note follows.
The wizard's "not in catalogue, add it by hand" fallback (used whenever a
race/career/Ability-Score talent grant can't be matched) surfaces this
gracefully rather than crashing, so it doesn't block anything, but the
catalogue itself should get a pass.

### Wizard fidelity audit

**Fixed in v0.8.1 / v0.8.2 / v0.9.0**: 1 (Ogre DT), 2 (-wises at 0), 3 (Godbound
Piety), 4 and 5 (step-1 dead fields), 7 (missing rough concept), 9 (Status
zeroed), 10 (Ability descriptors). **Still open**: 6 (Human Cultures table
sits in step 5, book puts it in step 2), 8 (racial bonus Savvy / Expertise /
Talent never asked for), 11 (Magic Convocations).

Prompted by a direct user report: step 1 asks for a cultural background and
a native language that the player has no way to answer yet, and that the
book does not ask for at that step. Auditing outward from that found a
class of defect the whole existing test suite is blind to (it checks that
the code does what the code says, never that the code does what the *book*
says). CLAUDE.md now carries the expanded review priorities that would
catch these; `wizard_visual_check.mjs` carries `knownDefect()` assertions
for the first four so they stay visible on every run and flip to `ok`
automatically when fixed.

Verified against `/tmp/tbe.txt`, most severe first:

1. **Ogre Death Threshold is silently wrong.** `commit()` hardcodes
   `dtBase = 20`; `race.dt` is displayed on step 2 but never read. The
   book (p.83): Ogres "start with Toughness 1 and a Death Threshold of
   22." Every Ogre PC is built at DT 20, which also drags Lethality Level
   from 8 to 7. No symptom, no error, just a wrong number.
2. **Blank `-wise` slots are created at 20; the book says zero.** Step 1's
   "Blank -wise slots" input creates N wises at `d.base` (20). Book
   (p.79-80): assign 20 to all other skills "except custom -wises and
   Languages under Lore; these may receive values in later steps, but
   leave them at zero for now." Rounding Out then charges again to buy
   what the player already got free (p.108: "New -wise or Language skills
   must be purchased at 20").
3. **Godbound Piety is 20, should be 50.** `commit()` writes
   `career.name === "Godbound" ? 20 : 0`. The career grants "Magic
   (Piety) 20" (p.104) *and* the Godbound Talent, which grants "the Piety
   skill at a starting value of 30 (or to add 30 during character
   creation)" (Ch.4 GODBOUND). The Talent's 30 is never applied.
4. **Step 1's Cultural background free text is unreachable dead input.**
   `commit()` resolves `"system.culture": (d.cultureBgName || d.culture
   || "")`, and `d.cultureBgName` initializes to `culturalBackgrounds[0]`
   ("Civilized, Urban") and can never become empty. Empirically confirmed
   by the harness probe: a sentinel typed into that field never reaches
   commit.
5. **Step 1's Native language is discarded on the normal path.** For
   Humans, merely passing through step 5 sets `d.humanCultureLang` from
   the always-preselected Human Culture dropdown, which wins at
   `commit()`. For Dwarf/Ogre/Half-Orc/Bolg Fiir the race's own fixed
   language is used and the typed value is irrelevant either way.
6. **Placement error: the Human Culture d100 table belongs to step 2, not
   step 5.** The book puts it inside the Human race entry (p.81-82,
   "languages: The cultural Language of the region at 70 and Low Vestrian
   at 20", immediately followed by the d100 Human Culture table). The
   wizard renders it in step 5 (Cultural Background), which is a
   different mechanic (the d10 Civilized/Barbarian/Wanderer table). The
   in-code citation "(p.83)" is also wrong.
7. **The book's actual step 1 content is missing.** The book asks for a
   rough concept sentence, explicitly non-binding, explicitly expected to
   change "as the dice, cultural background, and Life Events take shape."
   That is the one thing at step 1 a player can always answer, and the
   wizard doesn't ask for it.
8. **Racial bonus Savvy skill / bonus Expertise / bonus Talent are never
   asked for.** `chargen.json` already carries them per race; `commit()`
   only pushes them into `notesOut` as prose. No Savvy flag reaches the
   actor for any race.
9. **Status is zeroed.** `"system.status": d.roBonusChoice === "status" ?
   1 : 0` unconditionally overwrites. A player who took +2 Status from a
   career Talent swap (p.102) or +1 from a Life Event loses it.
10. **Ability Score descriptors don't reach `personalityTraits`.** The
    book (Ch.8) says descriptors "act as a kind of Personality Trait" and
    can be invoked the same way. They currently land in Notes prose only.
11. **Unadopted table: Magic Convocations.** The book offers twelve
    tabulated Convocations as Spellweaver templates (Binds / Strands /
    Thin Strands). Not extracted into `chargen.json` at all, and step 7
    offers no Bind/Strand UI, so a Spellweaver leaves the wizard with
    placeholder Binds at 0. Larger than the others; overlaps the Weave
    Magic finding under Ch.14 below.

### Root cause of defects 4-7 above

`TBE: Build Character` (the older, simpler chargen macro) asks for
"Cultural background" defaulting to "Westlands" and "Native language"
defaulting to "Westronne" as plain text, which is defensible for a
two-dialog quick build. The Wizard inherited both fields verbatim into its
step 1, then *also* added the book's real d10 Cultural Background table
(step 5) and the d100 Human Culture table (step 5). The inherited fields
were never removed, so they became dead. Note "Westlands" is not a
cultural background at all, it is a Human Culture *region* (p.81 d100
table), which is also what `system.culture`'s own sheet placeholder says,
while `commit()` actually writes the d10 background type into that field.

### Wizard fidelity audit, macro pack

**Fixed in v0.10.0** (enforcement pass): 7 (Talent prerequisites now
enforced), 9 (per-X Talents get their own row with the spec), 10
(creation-only Talents blocked), 12 (picker shows descriptions), 14 (Talents
charge their own XP; the flat-5-buys-unlimited hole is closed), 15 (Fade
Bind 70 cap), 17 (Bind purchase gating), 18 (Gaining XP table), 19
(Expertise eligibility shown up front). Also the latent `_lib.js` legacy
Dialog checkbox trap, and a `parse_talents.py` truncation bug that was
cutting the last sentence off 8 Talent descriptions.

**Fixed in v0.9.0**: 1 (30/20 split), 2 (shared -wise and Piety defects),
3 (70 cap after racial mods), 6 (race.dt ported to the Wizard), 8 (six
repeatable Talents unlocked), 11 (two missing Talents, parser now
self-verifying), and the launcher entry under Tooling. **Still open**: 4
(Build Character cultural background still free text), 5 (its Attribute
points and Initiative still never reach the actor), 13 (Combat Maneuver
category collapsed into Combat), 16 (Strand advancement, which needs the
Ch.14 Weave data that does not exist yet, see the Weave Magic section).

Same five priorities applied to the other three chargen/advancement
macros. All findings verified against `/tmp/tbe.txt`.

**`TBE: Build Character` (Ch.7)**

1. **The book's 30/20 split is not implemented at all.** Line 92 writes one
   uniform `base` (default 20) to every Combat/Adventuring/Social/Lore
   skill. Book p.79-80: "First, choose one skill from each category except
   Magic and assign it a value of 30. Then, assign a value of 20 to all
   other..." Every character built here is 40 points light with no
   signature skill in any category.
2. Shares the Wizard's blank `-wise` at 20 defect (line 139) and the
   Godbound Piety 20 defect (line 143).
3. **The 70 creation cap is not enforced after racial modifiers** (line
   121 has no upper clamp). Book p.80: "no skill can be increased beyond
   70 for any reason." An Ogre putting 50 Combat points into Might lands
   at 80.
4. **Cultural Background is free text with no mechanics**, so the player
   loses the background's +20/+10 skill bonuses, 2 Expertise levels and
   1d6x10 starting silver entirely.
5. **The 5 Attribute points and Initiative never reach the actor** (line
   225 hardcodes Resolve 10/10, Initiative never written), deferred to a
   Notes line.
6. **It is right where the Wizard is wrong**: line 224 writes `race.dt`,
   so it builds an Ogre at DT 22 / LL 8 correctly. Port that read into the
   Wizard.

Otherwise a near-total subset of the Wizard. Recommendation: retire it
after porting the `race.dt` read, and fix the launcher (see Tooling).

**`TBE: Talents` (Ch.4)**

7. **Prerequisites are displayed but never enforced** (line 38 only greys
   rows; the commit path re-checks nothing). Book p.161: "You must meet
   any requirements the Talent has before purchase."
8. **Five repeatable Talents are catalogued `rank:"once"` and locked out
   after one take**: Armor Training (I-IV), Enhanced Defense, Shield Beat,
   Inner Strength, Unkillable. Book, Armor Training: "he would have to
   acquire this Talent again (Armor Training IV)"; Inner Strength: "Can be
   purchased multiple times to a maximum Resolve of 30"; Unkillable: "a
   maximum of three times." Consequence: a character can never reach Armor
   Training II-IV, so Plate/Mail wearers permanently lose all Combat
   Maneuvers. Independently re-derived by regex over `talents.json`, the
   list is exactly these five.
9. **"Per-X" Talents stack as ranks instead of creating a second
   differently-specialized copy**, and the `spec` text is dropped on that
   path (lines 79-83). Taking Armor Piercer for a second weapon type
   silently discards the weapon name.
10. **Character-creation-only Talents are purchasable at any time.** Book:
    "PATTERNED IN THE WEAVE - This Talent can only be chosen at character
    creation"; "At character creation, only Previous Career: Godbound may
    select this Talent."
11. **Catalogue is short two, not one.** Confirmed missing: "ALLOW ME TO
    INTRODUCE…" (book line 3472) and, newly found, "RUN FOR YOUR LIFE!"
    (book line 3264). Verified absent from `data/talents.json`.
12. **The picker shows no Talent description**, so the player needs the
    book open to know what any row does.
13. The book's "Combat Maneuver Talents" is a separate 8th category; the
    data model has 7, so 66 rows pile under one "Combat" heading.

**`TBE: Advancement` (Ch.8)**

14. **Talent purchase charges a flat 5 XP** (line 135) and then hands off
    to `TBE: Talents`, which has *no XP logic whatsoever* (confirmed by
    grep: zero references). So one 5 XP charge can commit any number of
    Talents in the following dialog. The macro is honest about the first
    half of this in its own message ("more if its own description says
    otherwise... if nothing is picked there, re-award the 5 XP by hand"),
    so the undercharge is a known limitation, but the unlimited-Talents
    hole is not surfaced anywhere. Three Talents cost 10 XP post-creation:
    Faded Pattern, Godbound, and Strand Secret for a Thin Strand.
15. **The Fade Bind-70 cap is printed in the dialog but never enforced**
    (line 54 prints it, line 93 has no ceiling). Book: "A Fade can never
    develop any Bind skill past 70." The `group` property read at line 34
    is never used again.
16. **Strand advancement is entirely absent.** Book gives explicit rules
    ("To increase a Strand, spend XP equal to the next highest value"),
    plus Fraying past 10 and a Fade cap of 7. Spellweavers and Fades
    cannot spend XP on their primary track at all. Overlaps the Ch.14
    finding below.
17. **Bind purchase is open to everyone with no magic prerequisite** (any
    character can buy a Bind at line 119-131). Book gates it behind
    Patterned in the Weave or Faded Pattern. A mundane fighter can start
    casting.
18. **The Gaining XP table is not adopted** (one free-text amount box).
    Book has a real table: 3 XP for pursuing goals, 1 per individual goal
    completed, 2 per party member for a shared goal, and a 3 XP/session
    cap on goal pursuit.
19. Expertise eligibility is only revealed after submitting, rather than
    shown per skill in the picker.

**Latent, not currently reachable**: `_lib.js` line 25's legacy `Dialog`
fallback reads `i.value`, which is `"on"` for unchecked checkboxes too, so
that path would add all 147 Talents at once. Unreachable at the declared
minimum of Foundry 12 (DialogV2 exists), but a live trap if that floor
ever drops.

## Advancement (Ch.8)

- ~~**Strand improvement**: still blocked.~~ **Built in v0.15.0**: XP equal
  to each new level, charged sequentially, with the Fade ceiling of 7, the
  1-Fraying-per-point-above-10 rule and the Fraying Roll all applied. The
  Strand Secret Talent (5 XP, 10 for a Thin Strand) opens a new one.
- ~~**Piety advancement**: Piety isn't tracked anywhere on the character.~~
  **Corrected finding, fixed in v0.8.0**: Piety actually was already
  tracked — `TBE: Character Wizard` has created a real "Piety" Lore skill
  Item for Godbound characters since v0.7.0, this line was stale. Probing
  p.125 "Piety and XP" for what advancement should even do with it turned
  up the real bug: Piety *cannot* be improved with XP at all ("only through
  acts of service to the deity can a Godbound's Piety increase") and is
  barred from Expertise (p.54) — but `TBE: Advancement` was offering it in
  both pickers anyway, letting XP be spent on it in violation of the rule.
  Fixed by excluding it from both pickers, with a note pointing to the
  Skills tab for a GM-narrated raise instead. Nothing to build here beyond
  that exclusion — the book deliberately gives Piety no XP-spend path.
- ~~**Personality Changes**: needs the Personality Trait system above
  first.~~ **Fixed in v0.8.0**: turned out much smaller in scope than
  implied — p.123 gives this zero XP cost or requirement ("at the end of a
  session, you can choose to change, add, or remove any Personality Trait
  as long as you feel it is warranted"), so it needed a real field to hold
  the list, not a macro. Added `system.personalityTraits` (a plain editable
  array on the Notes tab) and wired the Wizard's Personality step to write
  it directly. There is no "spend XP to change a trait" mechanic to build
  — the book explicitly doesn't have one.

## Equipment (Ch.9)

- ~~**Coins & Haggling**: opposed-Commerce price adjustment (buying: -10%
  per 2 DoS up to -50%; selling: +/-10% per 2 DoS up to +/-50%, base price
  half listed for weapons/armor/mundane items) isn't automated anywhere.~~
  **Fixed in v0.8.0**: new macro `TBE: Haggle`, verified against the book's
  own worked example.
- ~~**Bulk / Initiative penalty** (distinct from ENC — worn armor's own
  Bulk stat, p.141, "divide total Bulk by 3, rounded up" for an Initiative
  penalty): still not wired to a roll.~~ **Fixed in v0.8.0**: armor Items
  carry a real `system.bulk` field, summed across worn pieces and applied
  as a derived Initiative penalty shown on Overview and the Gear tab.
  Verified against all three of the book's own worked examples.
- **Weapon Readiness** (Held and Ready / At Hand / Stored, and the action
  costs to move between them) is now tracked as a real `carried` field on
  weapon/shield items for ENC purposes, but the action-economy side (2
  actions to retrieve from Inventory, 1 Minor Action from At Hand) isn't
  enforced by any macro. **Looked at during the overnight pass and set
  aside deliberately**: this needs a real decision about how action economy
  is tracked across a combat round in this system before it can be built —
  there's no existing "current round, remaining actions" concept anywhere
  in the macro pack (TBE: Attack resolves one exchange at a time, it
  doesn't track a token's spent actions across a round), so a Weapon
  Readiness macro would either need to bolt one on just for this (scope
  creep well past "wire up one rule") or silently assume the player is
  tracking actions by hand elsewhere (fragile). Needs a scoping
  conversation, not a guess.
- ~~**Minor, pre-existing, not a real data bug**: `equipment.py`'s own
  self-verification flags "Large Shield" as not found verbatim.~~
  **Fixed in v0.8.0** (noticed while re-running it for the Bulk fix above,
  unrelated to that change): the book's line reads "Large Shield 100 +5;
  requires Talent 5 3 Kite or Wall shield" — the inserted "; requires
  Talent" text between the AP and ShB columns broke the verify script's
  plain string-concatenation check, even though the actual SP/AP/ShB/Enc
  values in `SHIELDS` were always correct. The check now tolerates a
  non-digit gap there instead of demanding an exact match, so a real
  future data error in that row can't hide behind this false positive.
## Player-facing transparency / Rules Audit — v0.16.0

Built: `TBE: Rules Audit` journal entry (`parse_core_rules.py` →
`data/core_rules.json` → `build_rules_audit.py` → `rules_audit.html`, baked
into `tbe-journals` alongside the existing reference pages), so a player
suspicious of a "vibe coded" system can check the macros' math against their
own book: what a macro computes, which macro uses it, the chapter and page,
and the verbatim book sentence. 20 rules covering the core d100 mechanic
(Ch.2), Death Threshold/Lethality Level (Ch.7), and Combat & Wounds (Ch.9,
Ch.11). Page numbers are derived from the source text's own printed page
markers, not hand-typed — see the v0.16.0 CHANGELOG entry.

Deliberately out of scope for v0.16.0, so the Rules Audit doesn't imply more
rigor than actually backs it:
- **Weave Magic (Ch.14)** doesn't need it — already fully covered by its own
  generated, quote-verified reference (`TBE: Weave Magic Reference`,
  v0.15.0).
- **Character Creation point costs** (race/career/size numbers in
  `chargen.py`) have only a thin "does this quote appear somewhere"
  verification, not the column-position rigor `parse_magic.py` and
  `parse_core_rules.py` use, and Career entries specifically have NO quote
  verification at all (only the 6 Races do, via a `"verify"` string per
  entry). A Rules Audit entry for chargen costs would need `chargen.py`'s
  verification brought up to the same standard first, or it would be citing
  numbers with less confidence than the page implies.
- **Equipment silver-piece costs / AP / ENC** (`equipment.py`) have NO quote
  verification at all currently — nothing in the script checks a weapon's
  SP/AP/ENC against `/tmp/tbe.txt`, they're hand-transcribed and trusted.
  Same prerequisite as above before these can honestly appear in an audit
  page.
- **Advancement XP costs**, **Talent prerequisites/costs**
  (`parse_talents.py` — already flagged elsewhere in this file as having no
  self-check at all), and **the Extended Roll / Favor mechanics** are also
  not yet in the audit for the same reason.

Each of the above is a real, separate verification project (mirroring what
`parse_magic.py` did for Ch.14 this session) before it can be added to the
Rules Audit honestly. Don't add rows to `rules_audit.html`'s data source
without giving the underlying `.py` extractor the same quote-in-cost-column
rigor first — see CLAUDE.md's "a quote is only half a check" section.

## Combat (Ch.10) — found during this session's self-review, fixed

- ~~Shield Bash's SL cost was hardcoded to 6 regardless of which shield (or
  none) the attacker carried; a Buckler cannot Shield Bash at all (p.140).~~
  Fixed: shields now carry a real `shb` field (null for Buckler), and
  `TBE: Attack` reads the attacker's actual shield.
- ~~Pierce Armor reduced a shield's AP too, and had no effect-gate for
  armor at 3 AP or less (p.163-164: "does not reduce a shield's AP... has
  no effect if that location has 3 AP or less").~~ Fixed.
- A shield sitting in Inventory (Stored) used to still block damage as if
  worn — fixed alongside the Encumbrance `carried` field going in.

## Multiplayer scope change — 2026-09-17

Seb: **"this is no longer a solo module in scope."** Solo stays supported as a
mode; GM-plus-players is now what the system is designed against. Recorded as a
standing constraint at the top of CLAUDE.md. **Shipped in v0.34.0**: chat
visibility (a GM could not roll privately at all — see the changelog). What the
same audit turned up and did NOT ship, in rough priority:

- **Actor ownership on write.** A macro that writes to an actor is now often
  run by someone who may not own it. `_onSkillRoll` models the right behaviour
  (warn that the Resolve was not spent, rather than fail silently); the macro
  pack largely does not. An audit of every `actor.update()` call site in
  `macros/` against "what happens if the user does not own this actor" is the
  next multiplayer item, and it is the same class as CLAUDE.md rule 6 — the
  answer must be a sentence, not damage.
- **GM gating.** Only 8 of 37 macros check `game.user.isGM` at all. Some of the
  ungated ones are fine (a player rolling their own skill); some are not (TBE:
  NPC generates world actors, TBE: Random Event and Ask the Weave drive the GM's
  own prep). Needs a pass deciding, per macro, whether a player running it is
  reasonable, and saying so rather than silently succeeding or silently failing.
- **`TBE.me()` is a solo assumption in multiplayer clothing.** It resolves to
  the selected token's actor, else `game.user.character`. For a GM with a token
  selected that is right; for a player who has selected someone else's token it
  silently acts on the wrong actor. Should prefer an owned actor, and say which
  actor it chose.
- **Blind rolls are now possible but nothing uses them.** `TBE.MODES.BLIND`
  exists as of v0.34.0. The book's places for it (a Perception roll whose result
  the player should not know, an opposed Deceive) have not been identified
  against `/tmp/tbe.txt` yet — that is a rules pass, not an implementation one,
  and must not be guessed at.
- **The player-presence panel** from Seb's session notes (see below) is worth
  more under this scope than it was when logged — it was a nice-to-have for a
  GM with players, and this is now the default case.

## First real session — Seb's own notes at the table, 2026-09-16

Six notes, in his words, each with what the code actually says checked before
anything was written here. These are player-facing and mostly combat-flow;
the machine-found defects from the same session are in the section below.

### 1. "Showing what other players see, their open menus, possible?"

**Yes, and it is not a hack.** Foundry gives no native way for a GM to see
another client's open windows, but every window in every client fires
`renderApplication` / `closeApplication` (and the V2 equivalents) locally.
A small presence layer — each client emitting `{user, appName, actorName,
opened}` on `game.socket.emit("system.the-broken-empires", ...)`, the GM
collecting it into one panel — shows the GM who is sitting in the Character
Wizard, who has an Attack dialog open and is waiting, and who closed it
without rolling. That last one is the interesting signal: the probe measured
65 quiet minutes after the fact and could not say who was stuck in what.

Scope decisions to make BEFORE building: it covers TBE's own windows only,
or every window including core Foundry's (the hook sees both, so this is a
policy choice, not a technical one); it is GM-only; and it is presence, not
content — it must never broadcast what a player has TYPED into a field, only
that the window is open. Say that in the UI, because a tool that watches
players needs to be legible to the players it watches.

### 2. "Resolve removes from max rather than pool."

**Not reproduced, and I want the repro before touching it.** Every write to
Resolve in the shipped code targets `system.resolve.value`: the sheet roll
dialog (`actor-sheet.mjs`), `tbe-skill-roll.js`, `tbe-cast.js` (three sites),
`tbe-counterspell.js`, `tbe-attack.js`'s Resolve-to-resist, and
`tbe-wounds.js`'s recovery. The only writes to `system.resolve.max` anywhere
in the repo are in the two chargen macros, where they are correct.

Two things that LOOK like this and are not: bestiary creatures ship at 0/0 on
purpose (`build_bestiary.py` line 175), which is why Barbarian Warrior, Horse
and the Renn Kestral creature all read "0/0" in the probe; and Gilda Hrundir
at 10/11 and Teadhan Bryndal at DT 20/22 look like hand edits, not spends.

**Answered by Seb, same day:** it went from 12 / 12 to 12 / **11** — the pool
never moved, the maximum fell by one — and he thinks his player hand-edited
it. That fits: it is not a spend at all, and no spend in the codebase could
produce it.

**But do not close this as user error, because the sheet invited it.** The
Resolve maximum is a plain text input sitting immediately beside the pool,
separated by a "/", with nothing marking one as a live resource and the other
as a chargen-derived ceiling. A player fixing their pool mid-fight and hitting
the wrong box silently loses a point of maximum Resolve for the rest of the
campaign, with no signal and nothing to restore it from. Gilda Hrundir sits at
10/11 in the same probe, which is the same shape.

This is the Initiative bug's cousin: a sheet field that is editable because
nothing said it should not be. The fix is the same kind of decision — max and
Death Threshold max are derived from chargen and belong behind something
deliberate (an edit toggle, or at minimum a title and a visual difference from
the pool), not a click away during a combat round. Small, and it protects
every played sheet.

### 3. "If shielding make it clear during the attack macro."

Shields are already in the maths — they carry AP and the Circumvent Shield
maneuver costs SL — but `tbe-attack.js`'s card does not say, at the moment of
the roll, that a shield is up and what it is doing. Make it a line in the
attack card and in the defence line, not a note to look up afterwards. Same
instinct as the Unbalance fix: put the number where the human making the
decision is looking.

### 4. "Modifiers as radial buttons. Combat heavy game, having input more
at-hand, and with a memory, as changes are less frequent."

**Built in v0.49.0.**

The Task Modifier is five fixed steps (Simple +20 through Hard -20, p.25) and
Favor is 0-3. Both are small closed sets currently rendered as a `<select>`
and a number box, which costs a click, a read and a click for something that
is usually the same as last time. Radio-style buttons, one row each, with the
book's own example as the tooltip. **And a memory**: the dialog opens on the
last values used, per actor, because in a combat-heavy game the modifier
changes less often than the roll does. Persist it as a flag, not a world
setting, so two players do not share one memory.

### 5. "Remember the last attack, so it's not starting over as much."

**Built in v0.49.0.**

Same instinct, one level up: TBE: Attack should reopen with the last weapon,
target and defence choice already selected for that actor. A combat round is
mostly the same attack repeated. The safeguard: prefill the choice, never the
commit — a remembered Resolve spend must still be confirmed, or the memory
starts spending points nobody chose this round.

### 6. "Changing from at hand, to stored to dropped, should be more easy
than editing the item."

**Built in v0.49.0.**

**This is the scoping answer the Weapon Readiness backlog item was waiting
for, and it needs a fourth state.** `item-weapon.mjs`'s `carried` field has
three: `ready` / `hand` / `stored`. The book has a fourth, and it is the one
Seb named:

> "Dropping a weapon is a free action."
> "Drawing, sheathing, or picking a weapon up off the ground is an action
> (Perform a Minor Action)."
> "To draw a new weapon, any held weapon must first be dropped (free action)
> or sheathed (separate action)."

So `dropped` is RAW, it is mechanically distinct (free to enter, a Minor
Action to leave, and unlike `stored` it is on the ground rather than in
Inventory), and it changes encumbrance: a dropped weapon is in neither the
6 ENC At Hand pool nor Inventory ENC. Adding it touches `TBE.encStatus` and
the sheet's `_prepareEnc`, whose arithmetic has one owner
(`helpers/config.mjs`'s `TBE.encumbrance`) — so the ownership check applies
before a line of it is written.

The UI half is a click-through control on the gear row, cycling or picking
between the four states, rather than opening the item sheet mid-fight.

## First real session — probe findings, 2026-09-16

Seb ran the Salt-Run Ambush from planning through the camp, 153 minutes in
Foundry, and ran `TBE-Session-Probe.js` afterwards. **Fixed in v0.33.0** are
the two defects in the probe output itself (creature Initiative corrupted to
`"14,14,NaN,..."` so every enemy acted last for all five rounds, and the
probe parsing `flavor` alone so all 65 rolls came back unattributed). What the
same output raises and nobody has decided yet:

- **The world was on 0.28.0.** Everything in 0.29 through 0.32 — the
  migration layer, the skill picker over untrained skills, sheet-native
  rolling — was not in the session at all. Whatever we ship next only counts
  once it is installed; worth confirming the upgrade happened before reading
  the next probe.
- **The eight pregens were not used.** They ran TBE: Character Wizard nine
  times and built their own (Rann, Morrk, "Fresh face"), spending roughly 35
  of 153 minutes on it. That is either a discovery problem (the pregens are
  in a compendium nobody opened) or a preference; ask before "fixing" it.
- **"Fresh face" finished with 0 skills, 0 weapons and 0 talents** on the
  sheet, while the chat log records Finish Character buying a Bearded Axe and
  four Reinforced Leather for it. Either an abandoned character that was
  never committed, or Finish Character wrote to an actor the sheet is not
  showing. Needs reproducing before anything is concluded — this is the one
  finding that could be a second silent-write bug.
- **Four Reinforced Leather stacked to Worn Bulk 15, Initiative −5.** The
  chat lines are honest about it each time, but nothing says "you are now the
  slowest thing on the field". The free-armour step happily takes a fourth
  piece of the same item.
- **The trackers were never touched**: every Favor pool 0, Leverage 0, trial
  log and medical-die log empty, across a whole session. Either they are not
  discoverable at the table or they are not wanted mid-fight.
- **The Ambush Ground scene we shipped was never opened** (no background, no
  tokens); they built their own "The ambush" scene. The Camp scene *was* used
  and had a background added to it, so the shape of the deliverable is right
  and the ambush map specifically was not.
- **Macro duplication in the world**: TBE: Character Wizard ×9, TBE: Attack
  ×5, TBE: Finish Character ×5, TBE: Skill Roll ×3. Re-importing the
  compendium adds rather than replaces. A dedupe pass, or import that matches
  on name, is worth doing before the macro bar becomes unusable.
- **`dnd5e-system-customizer@4.0.1` is active in the TBE world.** Almost
  certainly harmless and almost certainly unintentional; worth one line to
  Seb rather than a code change.
- `simtest.js`'s 3-side Council Vote case is **randomised and occasionally
  fails on a genuine tie** ("ends tied at 0 between Simon and Arn and
  Edbert"). The macro handles the tie correctly and says so; the test asserts
  a winner. Seed it or assert the tie branch.

## Sheet-native rolling, and the range-band question — opened 2026-09-16

- **Click-to-roll on the sheet, with a Resolve and modifier dialog.** Asked
  for directly, modelled on how the TOR2e sheet works: click a skill row, get
  a dialog carrying the skill's value, Expertise and Savvy, a situational
  modifier, and a Resolve spend, then a chat card. Two things to settle
  before any code.
  First, it reverses a documented principle. CLAUDE.md's opening says "Sheets
  are deliberately thin... Combat, wounds, casting and advancement all run
  through the companion macro pack, not sheet-native buttons." If sheets grow
  roll buttons, that sentence has to change with them rather than quietly
  becoming false.
  Second, and this is the useful part: the sheet lives in the system and
  `TBE.resolve()` lives in the macro pack's `_lib.js`, which a system file
  cannot import. So the feature cannot be built without doing the extraction
  this file's own ownership table has listed as "Not yet extracted" since the
  table was written: d100 resolution into `module/rules/resolution.mjs`,
  exposed on `game.thebrokenempires.rules`, with `_lib.js` deferring to it at
  runtime the way `rankCap`/`strandCap`/`sizeEffects`/`encumbrance` already
  do. The feature and the consolidation are one job, which is the argument
  for doing it rather than a reason to defer.
  Note on scope: a Resolve spend from a sheet click writes to the actor, so
  it needs the same care as any other state change, not a fire-and-forget
  dialog.

- **Range bands instead of a grid.** Researched 2026-09-16. TBE is already
  zone-native and the grid is the thing fighting it: "one action and one move
  (usually one zone)" (p.161), Longbow "Range 4", Spear "Reach 1", and the
  Salt-Run ambush is three named zones. Foundry v12+ Scene Regions are the
  right primitive and the ambush scene already carries three of them.
  Candidates, best first:
  - **Alternate Zone Movement** (system agnostic, Foundry 13-14, verified 14,
    updated ~3 weeks before this note). Counts transitions between zones
    defined as Regions, via a "Movement Zone" behaviour with a per-zone Entry
    Cost, for both the ruler and token drag. Closest fit and the most current.
  - **Zone Movement** (system agnostic, verified 14.365, ~8 months old).
    Same idea: Regions plus a "Modify Movement Cost" behaviour, with the grid
    unit set to "zone". Tested against Free League games.
  - **Lyinggods Token Range Bands** (verified only to Foundry 12, ~1 year
    old). Concentric named bands round a token plus a narrative ruler, which
    is conceptually closest to "range bands", but it is two majors behind
    what `system.json` declares verified, so it is a research note rather
    than a candidate.
  Cheapest next step is to add the behaviour to the three ambush Regions and
  check it against the book's own move and range numbers before writing any
  code.

## Bestiary (Ch.18) — found 2026-09-15, FIXED in v0.42.0 (see top of file)

- **Every bestiary creature's skills are stamped `group: "Adventuring"`,
  including Dodge, Might and every weapon skill.** `build_bestiary.py`'s
  `mkSkill` hardcodes it:
  `system: { group: "Adventuring", value: ..., fighting: !!fighting }`.
  The skill catalogue already has one owner (`TBE.SKILL_GROUPS` in
  `macros/_lib.js`, verified against the book by `funnel_check.mjs`) and it
  is not consulted. This is the same defect this file already lists as
  shipped once before ("NPC generation hardcoding every skill to
  'Adventuring' instead of the Wizard's real category map"), surviving in a
  second place. Effect: open any bestiary actor's sheet and its Dodge sits
  under the Adventuring heading rather than Combat, so the sheet's own
  grouping is wrong for all 56 creatures.
  Worth noting the wrinkle before fixing: bestiary blocks name a skill after
  the weapon ("Spear 70"), which is not a catalogue skill at all, so the fix
  is `TBE.skillGroup(name) ?? "Combat"` for attack-derived skills rather than
  a straight lookup, and the `fighting` flag should be derived the same way
  the rest of the project does it (`TBE.isFighting`), not passed in by hand.
  Found while reskinning a bestiary entry for The Salt-Run Ambush, which
  assigns its groups explicitly and so is not affected.

## Combat (Ch.10) — open, found 2026-09-15 while building adventure content

- **"Ties go to the PC" keys off actor type, so an NPC that rolls Initiative
  gets PC tie-precedence.** `_sortCombatants` in the init hook breaks an
  Initiative tie with `actor?.type === "character"`, which is correct for the
  bestiary (creatures use the static formula and are type `creature`), but
  wrong for a *human* NPC who is supposed to roll normally. The only way to
  make an NPC roll `1d10 + Initiative` today is to give them the `character`
  type, and that silently also hands them the PC tie-break. Confirmed by
  running the real comparator, not by reading it: two `character`-type
  combatants tied at 15 fall through to the alphabetical name comparison
  underneath, so a named NPC can beat a PC on a tie purely on spelling.
  Found while building The Salt-Run Ambush. That module no longer trips it:
  its NPCs were moved to the `creature` type and static Initiative, which is
  what p.161 actually prescribes for an enemy ("Enemies typically do not
  roll"), so the tie-break works correctly there and Ambrose wins the Beat 6
  tie as the book intends. See `adventures/salt-run-ambush/pregen_check.mjs`
  section 11, which asserts both the correct outcome and the wrong one the
  character type would have produced. The gap still stands for any future
  NPC that genuinely must roll, which the book does allow ("typically").
  Likely fix: decide PC-ness from something other than the DataModel type (an
  explicit flag, or `hasPlayerOwner`), so "rolls Initiative" and "is a PC"
  stop being the same bit. Not urgent, but it is a book rule that does not
  currently hold in every case the book covers.

## Chargen/Finish Character — v0.17.0, off direct player feedback

- ~~`TBE: Finish Character` never actually opened after the Wizard on a
  fresh install — the handoff looked itself up in `game.macros`, which
  stays empty unless someone drags the compendium folder in by hand.~~
  **Fixed in v0.17.0**: `TBE.runMacro()` (`_lib.js`) falls back to the
  compendium directly. `TBE: Advancement` → `TBE: Talents` and `TBE: Solo
  Panel` now go through the same helper.
- ~~Career auto-grants at chargen silently took both sides of an
  "either X or Y" choice (Godbound got Literate for free; same for
  Loremaster's Lecturer/Travel Planner and Merchant's Barterer/I See Your
  Mind), because the old code auto-granted any catalogue Talent name that
  appeared anywhere in the career's raw grant text.~~ **Fixed in v0.17.0**
  via `chargen.py`'s new `CAREER_TALENT_PICKS` (verified against the same
  already-checked career text), which separates automatic grants from
  free-choice picks for all 10 careers.
- ~~Finish Character's Talents tab checkboxes reverted themselves on tick
  (the tab re-rendered on every checkbox change, including `[data-talent]`,
  and never carried a `checked` attribute).~~ **Fixed in v0.17.0**: ticked
  state is now tracked in instance state and excluded from the generic
  re-render sweep.
- ~~Nowhere said how many free Talent picks a career/race grants.~~
  **Fixed in v0.17.0**: shown on both the Wizard's Talents step and
  Finish Character's Talents tab, from `CAREER_TALENT_PICKS`.
- ~~`TBE: Talents` and Finish Character's Talents tab each hand-copied
  their own race-exclusivity/prerequisite/creation-only check.~~
  **Fixed in v0.17.0**: both now call one `TBE.talentEligibility()` in
  `_lib.js`.
- ~~The Wizard's end-of-chargen chat card was the *only* record of the
  skill-point math (racial/Ability Score/Cultural Background/Rounding Out
  bonuses, silver breakdown) — nowhere else on the actor, gone once you
  scrolled past it, and Finish Character showed none of it either.~~
  **Fixed in v0.17.0**: `commit()` stashes it as
  `flags.the-broken-empires.chargenLedger`; a new Summary tab on Finish
  Character (opens there by default right after chargen) renders it, and
  the chat card itself is now a short headline pointing at that tab.
- **Not built**: the free-pick count shown on Finish Character's Talents
  tab is informational only — ticking more Talents than the career/race
  grant is not blocked, since tracking exactly which owned Talents were
  "the free ones" vs. later XP purchases would need its own bookkeeping
  this pass didn't add. A GM/player relying on the printed count rather
  than a hard gate is consistent with how this system already treats Life
  Events, Shared History and Relationship NPCs (shown, not enforced).
- **Not built**: `system.concept` is not a real actor field — the Concept
  text typed at chargen only exists inside `chargenLedger` and (if "Seed
  the Notes tab" was checked) `system.notes`. Low-priority since both
  already surface it; would need a DataModel schema change to promote it.

## Travel (Ch.12) — v0.16.1

- ~~`TBE: Journey Leg`'s "Mounted or on foot" dropdown was collected but
  never read; forced march added +1 straight to the Guide's hex total
  instead of to the day-rate.~~ **Fixed in v0.16.1**, verified against
  p.203's own worked example.
- Not built: the book's **Option: Terrain-based Movement Rates** (p.203) —
  Open/Difficult/Very Difficult terrain × foot/mounted, plus river-down,
  river-up, and ship rates, as an alternative to the flat 2/3-hexes-a-day
  default now wired in. The book frames it explicitly as optional ("if you
  want to take terrain into account for movement rates, here is an
  option"), so the default rate is book-compliant on its own — this would
  need a new terrain-type input (distinct from the existing Hex danger
  field, which is Safe/Neutral/Precarious/Dangerous, not
  Open/Difficult/Very Difficult) if the GM wants the finer-grained version.

## Intrigue (Ch.13)

**Built in v0.24.0.** Both were sized against the book (a survey read every
line of Ch.13-15 before committing to this as the first Content-completion
slice — see `ROADMAP.md`) before either was built.

- ~~**Investigations**: not built~~ **Built in v0.24.0.** Not a separate
  subsystem after all, on a close read: p.267 states it directly ("treat the
  investigation as an extended roll with a Gradual Outcome, where every 3 SLs
  uncovers one clue"). `TBE: Extended Roll` already was that mechanic; this
  batch added a clue-count readout and the Suspicion Die variant (Tolerance,
  and an "Exposed" Timer effect) as two general knobs on it rather than a
  second tracker kind.
- ~~**Chases**: not built~~ **Built in v0.24.0.** New `TBE: Chase` macro —
  Quick Chases (one opposed roll) and Prolonged Chases (a persistent
  pursuer-vs-prey tracker with a per-round Timer Die). See the 0.24.0
  CHANGELOG entry and `intrigue_check.mjs`.

## Weave Magic (Ch.14)

**Built in v0.15.0.** Strands, Threads, Convocations, the full Shaping and
Spell Effect cost tables, the Weave Reaction Table and Fraying are all real
data, a real Item type, a real chargen step, a real sheet tab, real
Advancement actions and a real casting calculator. See the 0.15.0 CHANGELOG
entry. What that leaves open in this chapter:

- ~~**Rituals, Summoning, Enchantments, Alchemy, Blood Magic, True Names**:
  still not built.~~ **Four of the six shipped in v0.25.0** — Rituals (the
  full procedure this line called out: the hour per TC, participants
  contributing Mastery, grimoires, summoning circles), Blood Magic, True
  Names and Summoning, with Pacts alongside them. **Enchantments and Alchemy
  remain**, in that order: Alchemy depends on Enchantments' Weave Reagents.
- ~~**Counterspells** (Hold to Interrupt against incoming magic)~~ **Built in
  v0.23.0** as `TBE: Counterspell`. The **Law of Resistance** opposed roll is
  still resolved through `TBE: Opposed Roll` rather than a button of its own.
- ~~**Weave Scar** results are narrated, not written to the Bind skill~~
  **Built in v0.23.0**: the permanent one is written into the Bind, the
  temporary one held against it and taken off the value a casting rolls with.
- ~~**Reality Snag's** +5 is narrated, not tracked~~ **Built in v0.23.0**,
  along with the d6 buckle table every further spell triggers. The
  "lasts until the next sunrise or sunset" concept that both wanted is
  `TBE.clearWeaveDay()`, cleared by a night's rest. Still not using it:
  the "Additional spells cost +2d6 TC until sunrise/set" result and Cut
  Off's longer durations.
- **Resolve as Favor** can be spent from `TBE: Skill Roll` and `TBE: Cast`,
  but `TBE: Attack` and `TBE: Opposed Roll` have their own modifier fields
  and no Resolve concept, so a player boosting an attack still adjusts the
  number by hand and edits Resolve on the sheet.
- **A caster's Arcane Tether limit** ("a total number of physical Arcane
  Tethers equal to their Arcana Score; exceeding it forces an immediate
  1d20+10 Weave Reaction roll") is not tracked. Tethers are not an Item
  type; the Arcane Tether Range is priced, but possessing one is not
  modelled at all.
- ~~**Strand-skill support generally, incl. Ch.8 Strand improvement above**~~
  **Built in v0.15.0.** The original finding, kept because it is the clearest
  statement of why this was not a schema tweak:
  **probed this pass, turned out bigger than the old BACKLOG line implied,
  deliberately not built.** The finding: a Strand is *not* a percentile
  skill like Bind — p.7955-8600-ish (Ch.7 chargen and Ch.8 advancement)
  shows Strands run on a level scale (0-5 during character creation,
  1-10+ afterward via Advancement, with 1 point of Fraying per level raised
  past 10), priced in XP equal to the target level per step, distinct from
  the flat "1 XP per improve attempt" or "4/6/8 XP per Expertise level"
  costs every other skill uses. Strands also can never take Expertise
  (p.54) and belong to named Convocations (Aeromancer, Battlemage, Druid,
  Earthbinder, Elementalist, ...) that bundle a starting Strand/Thin Strand
  spread — none of which exists anywhere in this system yet (`TBE: Cast`
  only reads Bind skills). Simply adding "Strand" to item-skill.mjs's
  `group` choices would create a half-feature that *looks* like a normal
  0-100 skill on the sheet but silently uses the wrong scale and math
  everywhere it's read — worse than leaving it out. Doing this properly
  needs: a Strand-specific value scale (a dedicated schema field or a
  second Item type, not reusing `system.value`'s 0-100 percentile field),
  Fraying tracking, Convocation data (Ch.14, not yet transcribed anywhere
  in `data/`), and `TBE: Cast`/`TBE: Advancement` support for the level-up
  XP-equals-target-value cost curve. That's its own scoped project.

  Every item on that list is what v0.15.0 built: a `strand` Item type with a
  `level` field, `system.fraying` plus `system.pattern` on the actor,
  `data/magic.json` (verified), and Strand support in both macros.

## Divine Magic (Ch.15)

- ~~**Domains, Miracles**: not built. Not attempted...~~ **Stale**: shipped in
  v0.27.0 (see "Phase 4, fifth batch — Divine Magic" above) — `TBE: Miracle`,
  `TBE: Pious Act`, all 20 Domains and their 218 miracles, extracted and
  verified. This line predates that batch and was never struck when it
  shipped.
- ~~**Piety**: entirely unbuilt. Piety isn't tracked as a field anywhere.~~
  **Corrected finding**: Piety was already tracked (a real "Piety" skill
  Item, created by the Wizard since v0.7.0 — the old line was stale). Its
  Ch.8 XP-advancement gap is fixed, see Advancement (Ch.8) above. What's
  still genuinely unbuilt here is Domains and Miracles themselves (how
  Piety is actually spent/rolled in play) — not probed this pass.

## Sheet UX

- **Fixed this pass:** the currently-inactive tab panels (Overview being the
  tallest, with the wound table) could be reserved into the layout as blank
  space above whichever tab actually was active, on some Foundry builds —
  reported as "the top bar takes the lion's share of real estate" on the
  Notes tab specifically, since Biography/Notes are short and most exposed
  the gap. Fixed with an explicit `display:none` on inactive `.tab` panels
  in our own CSS rather than relying only on core to get it right.
- ~~**Overview tab priorities still need a real pass.**~~ **Reordered in
  v0.8.0**: vitals (DT/Resolve/Toughness/Fatigue, the wound table,
  Initiative/Lethality/Shock) now render before the identity block (Race/
  Size/Culture/Career/Silver/Status/XP), matching how the creature sheet
  already led with wounds. This is a straightforward reorder made as a
  reasonable default while unattended, not a deliberated redesign — a real
  visual-tier restructure (distinct panels/emphasis, not just row order)
  is still open if it turns out this isn't enough once there's a chance to
  discuss it directly.

## Tooling / UX

- ~~**The launcher does not list the Character Wizard.**~~ **Fixed in
  v0.9.0**, both chargen macros now sit under a "Make a character" group.
  Original finding:
  `macros/tbe-solo-panel.js` line 8 offers `TBE: Build Character` under
  "Keep the record" and does not mention `TBE: Character Wizard` at all.
  The README tells players to drag the Solo Panel to their hotbar because
  "it launches everything else", so the flagship chargen tool is
  effectively undiscoverable and players are steered to the older, less
  faithful macro. One-line fix, but it should land together with the
  Build Character retire/port decision above.

- **Hero Builder application — `TBE: Character Wizard`, now at 15 pages
  (v0.7.0), covering the book's real 12-step chargen order in full.**
  Requested by name against [TOR2E - Hero Builder](https://foundryvtt.com/packages/tor-2e-herobuilder).
  Still a real `Application` (v1, not ApplicationV2 — this pack still
  targets Foundry v11 and AppV2 isn't there), still one persistent window
  with a working Back button, still nothing touching the actor until
  Create Character on the final page. It runs the identical mechanical
  logic as `TBE: Build Character` for the steps they share (race mods,
  career pools, Talent grants, silver roll) — both macros are kept side by
  side rather than deleting the old one outright.
  Still open, and deliberately not faked:
    - **No cross-session draft persistence.** The draft lives in the
      window's own memory; closing it early loses progress, same as
      closing the old Dialog chain early did. Persisting via an actor flag
      (`tbe.characterCreationDraft`, matching the pattern in the reviewed
      external proposal) is real follow-up work, not done here.
    - **No ApplicationV2 path.** If this pack ever drops v11 support, this
      is the macro that would move first.
    - The remaining scope gaps (a full Equip shopping UI, Life
      Events/Shared History/Relationship NPCs left as "look it up
      yourself" by design) are tracked under Character Creation (Ch.7)
      above, not here.

---

Last updated: this session (armor per-location fix, Expertise/Savvy,
`TBE: Advancement`, Build Character point allocation, Encumbrance, Shield
Bash / Pierce Armor fixes — v0.5.0; Hero Builder ticket, `TBE: Character
Wizard` v1, Notes-tab layout fix, Race/Career roll tables — v0.6.2;
`TBE: Character Wizard` rewritten to the full 15-page/12-step chargen
order with named roll tables throughout, `system.initiative` field added,
Death Threshold +2/point bug fixed in `TBE: Build Character`, a real
matcher bug in "roll of 0 means max" table ranges found and fixed via a
new headless smoke test, Talents-catalogue gap logged — v0.7.0; Career
Skill Points step no longer pre-fills fields with a nonzero even split
(was reading as "already filled out" and inviting silent over-pool
spends) — now starts at 0 with an opt-in Split evenly / Clear per
category — v0.7.1; **overnight unattended backlog pass** — Bulk/Initiative
penalty wired up and verified against 3 book examples, new `TBE: Haggle`
macro verified against the book's own worked example, Personality Traits
promoted to a real editable field (turned out to need no XP-gate logic at
all, per p.123), a real Piety-cannot-be-bought-with-XP rules bug fixed in
`TBE: Advancement`, Overview tab reordered vitals-first, a benign
equipment-data verify-script false-positive found and logged — v0.8.0.
Deliberately not attempted this pass, with reasons recorded above: Weapon
Readiness action economy, Strand/Weave Magic support (probed — turned out
to be a distinct level-based mechanic needing real design work, not a
schema tweak), Investigations, Chases, Rituals/Summoning/Enchantments/
Alchemy, Divine Magic Domains & Miracles, cross-session Wizard draft
persistence, the ApplicationV2 path, and a full Equip Your Character
shopping UI.).

## Post-creation menu (proposed, not built)

From a full play-through of the wizard. Several steps are near-empty pages
that would work far better *after* Create Character, when the totals are
known and there is room to explain:

- **Equip (step 10)** is information-only and reports numbers that only
  matter once you are shopping. Better as a post-create screen where the
  rolled silver, the armour-piece count and the Bulk/Initiative penalty are
  all live.
- **Status (step 14)** is one checkbox. It should default to 0, be granted
  automatically when a choice grants it (v0.11.0 already does this for Life
  Events), and not occupy a tab.
- **Goals (step 13)** deserves the room to present the Ch.6 advice the user
  supplied (individual vs shared, three-to-five active, "goals take time",
  and building them from your own Life Events and Personality Traits, which
  is exactly what p.110 tells you to do).
- **Blank `-wise` and Language slots** should be named there too, alongside
  the languages the race and culture already granted, instead of being an
  abstract count on step 1.
- **Shared History** likewise, since it needs another PC to exist.
- **Talent picking** could hand off to `TBE: Talents` from the same screen.

Consolidating these frees three tabs, which is what the Life Events step
needs: it is the longest page in the wizard and wants to be split into
skills / choices / NPCs.

Also proposed:
- **A roll-for-age option** on Rounding Out, instead of picking the band.
- **An editor for `data/concepts.json`**, outside the wizard, so the concept
  tables can be extended or rewritten without touching the repo.

### Post-creation menu — built in v0.12.0

`TBE: Finish Character` now covers Equip, Talents (inline), blank
-wise/Language naming, Goals, Shared History and Status. The wizard is 12
steps, Life Events has sub-tabs, and Rounding Out can roll for age.

Closed in v0.15.0:
- ~~An editor for `data/concepts.json`.~~ Built **inside** step 1 rather than
  outside the wizard, which is where the table is actually used: rows are
  added to a world setting (`the-broken-empires.customConcepts`), merged into
  the columns and rolled alongside the shipped ones. The shipped file stays
  the verified, provenance-labelled original content it always was; a table's
  own additions live in that table's world, not in the repo.
- ~~A shopping list view in Equip.~~ Half of it: the Equip tab buys in
  **quantity** and prices the whole order on the button before you press it.
  Armor is deliberately excluded, because each piece covers one named hit
  location and a quantity there would be ambiguous. The "kit out a full
  suit" shortcut is still open.
- ~~Goal progress in play.~~ `TBE: Advancement` now lists the character's own
  Goals, pays **per goal completed** (1 individual / 2 shared, as p.160
  says), and marks each paid so it cannot be claimed twice.

Still open from that list:
- A **"kit out a full suit"** shortcut in Equip (one click for a matched set
  across all six locations).

### "Granted but never applied" sweep — v0.13.0

Prompted by the free-armor bug. Method: trace every dice roll to whether its
result reaches the actor, and every schema field to what writes and reads it.

**Fixed**: 8 inert stat Talents (now ActiveEffects), Ogre `enc.invBonus`,
`enc.handBonus` for Weapon Belt (plus two hardcoded `handMax: 6` that would
have discarded it), fixed racial Savvy for Half-Orc and Dwarf.

**Confirmed clean**: every dice roll's total reaches the actor or a chat card;
`savvy` is written by the wizard; creature `armour` is written by
build_packs; armor `locations` are set by Finish Character and the item sheet;
The Replaced's Dark Fae-wise is created.

**Closed since:**
- **Human / The Replaced bonus Savvy skill** and their **extra Expertise
  level**: pickers on the Race step (v0.14.0). Their **extra Talent** is
  still a note, but it points at `TBE: Talents` / the Finish Character
  Talents tab, which is where any free Talent pick is made.
- **Bolg Fiir**'s +10 Bind: applied for real in v0.14.0, and folded into
  `computeMagic` in v0.15.0 so it lands on the actual Bind skill and only
  when the character is Patterned (the book's own condition).
- **The SAVVY Talent**: `TBE: Talents` marks the named skill (v0.13.x).
- **Dwarf** extended Craft: `TBE: Extended Roll` offers the -2 when the
  character is a Dwarf and the task is a Craft roll.
- **Ogre, untrained armor**: -20 is read off worn reinforced leather / mail /
  scale / plate and applied to Willpower rolls in `TBE: Skill Roll`
  (v0.15.0).
- **Ogre, The Breaking**: a real status, applied automatically on a critical
  failure of any roll the Ogre spent Resolve on, from `TBE: Skill Roll` and
  `TBE: Cast` (v0.15.0).
- **Ogre / The Replaced barred from magic**: enforced in the Wizard
  (v0.15.0); the Magic step never appears for them.

**Still open:**
- **Resolve as Favor** is spendable from `TBE: Skill Roll` and `TBE: Cast`,
  but not from `TBE: Attack` or `TBE: Opposed Roll`, which have their own
  modifier fields and no Resolve concept.
- ~~**Weapon Readiness** action economy~~ — **the state half SHIPPED in
  v0.35.0** as `TBE: Loadout` plus the `dropped` state and the carry-state→ENC
  pool owner. Scoped live with Seb on 2026-09-17 at "state + costs shown, not
  enforced."

  **The blocker this item carried for months was wrong.** It said there is "no
  existing 'current round, remaining actions' concept anywhere in the macro
  pack" and that an action economy needs one. Probed against `/tmp/tbe.txt`:
  TBE has no action *budget*. It has exactly one action per round — "Failing an
  action still counts as having taken your action for the round" (p.153). Free
  actions do not consume it, defences are not actions at all ("a defender can
  make as many defense rolls in one round as they need to, but may only attempt
  one defense per attack"), and movement is separate. So the per-combatant
  state a future enforcement pass would need is **one boolean**, and Foundry
  already owns the round and turn order.

  Still open, deliberately, and each needs Seb rather than a guess:
  - **Enforcement itself** (would have been "level 3/4" in the 2026-09-17
    scoping). Declined for now as against "deliberately leaves adjudication to
    a human". Reopen only on a direct ask.
  - **Stored → in hand retrieval**, priced at "2 full actions... You may use
    the item on your third action" (p.159), so it spans three rounds. Skipped
    on Seb's call. It is structurally an extended action and the obvious
    implementation is the existing Extended Roll tracker rather than a new
    state store — do not build a second one.
  - **Picking a weapon off the ground while Engaged** is not a state change at
    all: it is an Athletics roll at −10 per extra Engaged foe, with three
    branches including "success with 5 or more SLs, you recover the weapon and
    may still take your action as normal" (p.159). That is a rollable
    procedure and belongs in a macro/sheet button, not a dropdown. Not built.
  - **Two-handed weapon vs shield conflict.** Seb's TOR2e Loadout resolves it
    (taking a 2H auto-unslings a shield and vice versa); TBE has the same
    problem and nothing handles it. Needs the book probed for what TBE actually
    says about hands before anything is coded.
- **Investigations and Chases** (Ch.13) and **Divine Domains and Miracles**
  (Ch.15) — full subsystems, not probed.
