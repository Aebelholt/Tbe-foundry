# 0.47.1 — 2026-09-24

**Documentation: what a stranger needs before they install.** Nothing in the
system behaved differently before this; the README simply did not say it.

- **Requirements are stated: nothing but Foundry** (minimum 12, verified
  14.365). Dice So Nice and Zone Movement are listed as optional, with what
  each adds and what happens without it, and they are now declared in
  `system.json` as `relationships.recommends`, so Foundry's own install
  screen shows them.
- **The two things the system cannot ship** are named: the publisher's blank
  fillable character sheet PDF (for `TBE: Sheet Exchange`), and the rulebook
  itself.
- **A stale paragraph is corrected.** The README still claimed the sheet has
  no click-to-roll; clicking a skill has rolled it since v0.31.0.

# 0.47.0 — 2026-09-22

**Two things a wizard-built character was carrying that it should not.**
Found by exporting Seb's "Fresh face" (Dwarf, Barbarian, Loremaster) to the
official sheet: four nameless -wise slots and five Bind skills at 0.

- **Blank -wise slots now default to 0.** The Wizard and TBE: Build Character
  offered "Blank -wise slots: 4" and created "Wise: subject 1-4" at 0. The
  book grants custom -wises through the Career, Cultural Background, Life
  Events and Rounding Out (a Loremaster gets three at 30, p.104), and those
  are still created for you to rename. Nameless 0s only cluttered the roll
  picker and crowded the sheet's three write-in rows. Existing characters are
  untouched: delete the blank ones from the sheet if you want them gone.
- **TBE: Cast now refuses a character who cannot reach the Weave.** Every
  sheet lists the five Binds at 0 (p.79: "they all start at zero, and unless
  you are a Spellweaver, Fade, or Godbound, they are likely to remain at
  zero"), so "has a Bind skill" let a Warrior open Cast and roll a Bind at 0,
  with the Weave Reaction and Fraying that follow. This is the Piety
  placeholder defect (v0.28.0) in a second place. `TBE.weaver()` now owns the
  question: Patterned, a Fade, or any Bind or Strand above zero is a yes, so a
  Bolg Fiir's +10 or a GM's grant still counts. A character who is none of
  those is told what would let them cast, and nothing is rolled.
- **The printed sheet skips nameless slots.** A "Wise: subject 1" at 0 no
  longer takes one of the three write-in rows on the PDF.

Checks: `phase5_check.mjs` 76 (the new Weave gate, with a mutation that gates
on "has a Bind skill"), `sheet_exchange_check.mjs` 65.

# 0.46.0 — 2026-09-22

**The official character sheet, both ways; the Character Creator in; and
the stray d8 on attacks.**

**TBE: Sheet Exchange** now speaks three formats:
- **The fillable B/W character sheet (v13).** Export fills it from the
  actor: identity, every skill with Expertise and its Savvy box, Binds,
  Languages, -wises, Strands (with the thin box), Piety, Resolve,
  Initiative (base, armour penalty, total), Toughness, Death Threshold,
  Lethality Level, armour and wounds by location, shield, four weapons, ten
  Talents, Threads, goals, Supply Dice, silver and Status. Import reads a
  filled sheet back onto a character. Whatever does not fit (a fifth weapon,
  an eleventh Talent) is listed, not dropped silently. The blank sheet is
  the publisher's, so it is not shipped: the GM sets their copy once under
  Configure Settings, "Blank character sheet PDF", or picks it each time.
- **The Character Creator v0.6.5** (Vasco Brown's Google Sheet): download
  its "Character Sheet" tab as CSV, or copy it from cell A1 and paste. Its
  spellings ("Decieve", "Slight of Hand", "Longsword (1-handed)") are read
  as the book's, a trailing * is Savvy, and armour is placed on the
  locations the sheet puts it. If a later version of the Creator moves its
  headings, the import refuses rather than reading the wrong cells.
- **TBE-CSV** as before, now also carrying Savvy and Strands.
The format is recognised on its own. Every import shows its plan first,
never deletes, and pulls Talents and gear from the compendiums by name.
PDF work uses pdf-lib (MIT), shipped in `lib/` and loaded only when used.

**The stray d8 on attacks was the Ammo Supply Die.** Daggers, hand axes,
spears and javelins are marked as throwable, and TBE: Attack read that as
"shoots", so a spear thrust rolled the Ammo die. p.156: only "a ranged
weapon that uses ammunition" rolls it. Now:
- bows, crossbows and slings roll the Ammo Supply Die;
- a throwable weapon gets a "Throw it" box on the attack dialog; a throw is
  a ranged attack (so Obscured applies) but spends no ammunition;
- a critical failure on a ranged attack says what p.156 says.

New checks: `sheet_exchange_check.mjs` now 63 (a real fill-and-read-back
of the PDF, the Creator tab, and name matching); `attack_order_check.mjs`
now 34.

# 0.45.0 — 2026-09-22

**Zone Hazards on the map, and characters to a spreadsheet and back.**

**TBE: Zone Hazards** (new, GM). Mark the scene's Regions with the book's
Zone Hazards (Ch.10 pp.151-152): Confined, Rough, Obscured, Blocked,
Damaging (with its fixed damage) and Other. TBE: Attack then reads them:
- Obscured anywhere on the line between shooter and target (into, out of or
  through): -20 to a ranged attack, p.151.
- Confined: -20 to Dodge and Melee: Heavy, for whichever side is standing in
  it, p.151.
- Both are offered pre-ticked on the attack dialog and apply only to the kind
  of roll the book names (a sword through fog is not penalised). Untick one
  when the fiction says otherwise, e.g. the target can be clearly seen. The
  card says which applied and cites the page.
- Rough, Blocked, Damaging and Other show as reminders on the attack dialog.
Regions are the same zones Zone Movement counts, so one drawing does both.

**TBE: Sheet Exchange** (new). Export a character to a .csv (Google Sheets:
File > Import), or import one back, from a file or cells pasted straight out
of Google Sheets. One row per fact: section, name, value, expertise, note.
Import shows every change before writing, never deletes anything, pulls
Talents and gear from the compendiums by name, reports whatever it could not
place, and never guesses a skill's category (a -wise needs "group Wise" in
its note, which the export writes for you).

New checks: `zones_check.mjs` (42; every hazard quote verified against the
rulebook text and its page), `sheet_exchange_check.mjs` (34; export then
import changes nothing), `attack_order_check.mjs` now 27.

# 0.44.0 — 2026-09-22

**Dice So Nice: attack, defence and Wound Die in their own colours.**

When the GM runs both sides of a fight, every die used to be the GM's colour.
TBE: Attack now tags its dice by what they are, not who rolled them:

- Attack roll: crimson and brass.
- Defence roll (and the defender's Endurance roll against Shock): steel blue.
- Wound Die: bone.

These are Dice So Nice "dice roles", so they can be changed: the GM in Dice
So Nice's Dice Roles table, each player in their own appearance settings,
under "The Broken Empires". On an older Dice So Nice without roles the
colours still apply, as fixed colorsets. Without Dice So Nice nothing
changes.

New check: `dice_roles_check.mjs` (16); `attack_order_check.mjs` now also
asserts which colour each die carries (20).

# 0.43.0 — 2026-09-22

**Chat pop-ups linger, and TBE: Attack shows the roll before the maneuvers.**

- **Chat pop-up duration.** New per-user setting under Configure Settings,
  "Chat pop-up duration (seconds)", default 15 (Foundry's own is 5), range
  5-120. It sets how long a new chat card stays on screen while the chat
  sidebar is closed. Foundry V13 and later; V12 has no pop-up pane and is
  left alone.
- **Attack order.** On a hit, the attack and defence roll now goes to chat
  first. The Combat Maneuvers dialog opens once the dice have finished
  rolling (with Dice So Nice; at once without it), and the outcome card with
  hit location, maneuvers and Wound Die follows. Before, the dialog opened
  over a roll nobody had seen yet and every die appeared at the end in one
  card. The wait is capped at 15 seconds so a stuck animation can never hold
  the dialog back. A miss is still a single card.

New checks: `attack_order_check.mjs` (17, runs the built macro and asserts
the order of events, with a mutation restoring the old order) and
`chat_popup_check.mjs` (14).

# 0.42.0 — 2026-09-21

**Bestiary skills: every creature's Dodge was an Adventuring skill.**

Open any of the 56 Ch.18 creatures and every skill sat under the Adventuring
heading, Dodge and Might and every weapon included, none of them marked as
fighting skills. The builder hardcoded the group instead of asking the
skill catalogue, the same defect NPC generation shipped once before.

- **Groups come from the catalogue.** `TBE.creatureSkillGroup` (in the macro
  library) decides: the catalogue first, then a `-wise` is a Wise, then
  anything the stat block prints as an attack ("Spear 70", "Bite 60") is
  Combat. `fighting` follows from the group. A name none of those can place
  now stops the build rather than getting a guessed heading.
- **Expertise reaches the roll.** 20 skills carried their Expertise in the
  name ("Might Ex4"), where the roll never read it, and the skill picker
  offered that beside an untrained "Might" at 20. It now sits in the skill's
  Expertise field, so the Dragon rolls Might 90 Ex4 and the picker shows one
  Might.
- **Attack Expertise is kept.** 13 attacks ("Broadsword 90 Ex3", the
  Werewolf's "Claw 70 Ex2") had it read and thrown away. Kept now.
- The Orc's Mace and Shortbow, the Hobgoblin's Bearded Axe, the Tical
  soldier's Halberd and the Lich's Touch are Combat skills now. Those
  creatures still lack weapon Items for their alternate loadouts; that is an
  extractor fix and needs the rulebook text (logged in BACKLOG).

New check: `bestiary_skills_check.mjs`, 41 assertions over the built pack,
with mutations for each defect.

Full suite green: 31 check scripts (`intrigue_check.mjs` needs the rulebook
text and cannot run in this session), `simtest.js` (51).

# 0.41.1 — 2026-09-20

**The exported sheet was nearly blank, and the reason was a defect this
project already had a check for.**

Seb exported a character and got a page with no skills on it. Not a rendering
failure: `TBE: Export Sheets` listed the actor's skill **Items**, and a TBE
actor deliberately records only the skills that differ from the book's
untrained 20 (p.104). A character with two skill Items printed two skills.

That is exactly the defect `skill_picker_check.mjs` exists to stop, reproduced
in a second file — because when the roll picker was fixed, the fix was left
inside `TBE.skillOptions`, which returns HTML. The only way to ask "what are
this character's skills" was to build a `<select>` and read it back, and
`skillOptions` took no actor: it called `TBE.me()`. So the exporter could not
have used it even if whoever wrote it had thought to.

- **`TBE.allSkills(actor)` is the extracted owner** of that merge: the skills
  written on the sheet, plus the whole catalogue at 20, each marked `trained`
  so a caller that needs to tell them apart still can. `TBE.skillOptions` now
  defers to it for its two optgroups, and `TBE.actorSkills` takes the actor as
  a parameter instead of assuming `TBE.me()`.
- The printed sheet now carries the full catalogue, with untrained entries in
  grey so a glance still finds the trained ones — which is what Seb's own
  spreadsheet does, and what a real TBE sheet looks like.
- An actor with no race, culture or career now says so rather than printing an
  empty line.

**My own check passed straight through this.** `export_check.mjs` asserted
that a trained skill and its value appeared, which was true in both the broken
and the fixed version. The assertion that catches it has to be about what is
ABSENT — an untrained skill appearing at 20 — and that is the harder one to
remember to write. Four assertions added, including a count of the whole
catalogue.

Full suite green, enumerated from disk: 30 check scripts, `simtest.js` (51),
Salt-Run pregens (648).

# 0.41.0 — 2026-09-20

**TBE: Export Sheets — every character in the world, on paper.**

Foundry cannot print a character. Ctrl+P on an actor sheet gives you the
application's UI chrome, tab strips, scroll containers clipped mid-row, and
only whichever tab happens to be open. Core's right-click "Export Data" gives
raw JSON, which is the right answer for moving an actor between worlds and the
wrong one for a table. This sits between them: a GM-gated macro that renders
the world's player characters as a self-contained printable document, opened in
a new tab to print or save as PDF.

Scoped with Seb: printable, GM-only, whole world. Everything starts ticked, so
the default IS the whole world and deselecting is the deliberate act — a played
world accumulates retired and dead characters and nobody wants forty pages.

**The rule it follows: read, never derive.** Every number comes from the actor
(`initiativeEffective`, `lethalityLevel`, `totalWp`, `dying`) or from the helper
that already owns that arithmetic (`TBE.encStatus`, `TBE.readiness`, `TBE.binds`,
`TBE.strands`). This matters more here than anywhere else in the pack, because
the failure mode is not a crash: it is a printed sheet that quietly disagrees
with the screen, carried to a table, played off for a session, with no way to
tell afterwards which of the two lied. `export_check.mjs` (72 checks) seeds
deliberately impossible actors — a Lethality Level that is not ceil(DT/3), a
totalWp that disagrees with its own wound grid — so a recomputing version prints
different numbers and fails.

The sheet carries identity, the eight vitals, skills grouped and marked for
Savvy and Expertise, weapons with damage and the CL/CS/Dis/T line and their
carry state, shields with their Circumvent cost, armour with Bulk and coverage,
the wound grid with a blank column to mark in play, Talents, both encumbrance
pools, the Weave block for a caster only, goals and notes. A blocked popup falls
back to a download and **says so**, because a popup blocker does not.

**Two corrections this turned up, both about the harness rather than the code.**

- **`node -c` is the wrong syntax check for a Foundry macro, and this file's own
  verification list said to use it.** `node --check` parses as CommonJS, where
  top-level `await` is illegal; Foundry runs a macro inside an async wrapper
  where it is perfectly legal. `syntax_check.mjs` has known this since it was
  written and says so in its own header — the CLAUDE.md line simply never caught
  up, and has now been corrected.
- **The reflex fix for that false alarm is worse than the alarm.** Wrapping a
  macro body in a self-invoking async IIFE silences `node -c`, and also means
  `Macro#execute` never awaits the macro: it resolves instantly while the real
  work runs detached, and any error inside surfaces as an unhandled rejection
  with no context. This macro was briefly written that way. The check caught it
  because nothing was ever written to the Blob — which is the second time in two
  releases that the harness disagreeing with Foundry was the harness's fault.

Full suite green, enumerated from disk: 30 check scripts, `simtest.js` (51),
Salt-Run pregens (648), `syntax_check.mjs` across every macro.

# 0.40.0 — 2026-09-20

**"Still to choose" — the wizard now says what it gave you and you have not taken.**

Seb shared a standalone TBE character-creation web app (The Tapestry) and asked
what was worth copying. Its best idea is a single function that enumerates every
decision the character has been granted and not yet made, rendered as a list of
links that jump to the step that resolves each one. This is that, adapted.

It earns its place because TBE: Character Wizard hands out grants across fifteen
steps and said nothing when one went unclaimed — the failure class
`phase5_check.mjs` exists for, where every step does exactly what it says, every
script is green, and the player still ends up missing a Talent the book gave
them.

**The sharpest case is not a missing pick, it is a step that looks finished.**
The Ability Score step's Expertise, Talent and Descriptor selects carry no blank
option. The moment a score is chosen they render showing their first entry,
while the draft still holds `null` — the value only commits when the step is
actually visited and read. There is nothing on screen to notice. The panel is
the only thing that can tell you.

- `pendingChoices()` returns `{label, stepKey}` and **defers to the detector
  that already owns each grant**: `raceChoices()` for racial grants,
  `isCaster()`/`pattern()` for magic, `usesHumanCulture()` for the d100 homeland
  table. It never decides a grant by comparing a race name, which is the
  duplicate ownership this project keeps paying for.
- Steps are addressed by **key, never index**. The Magic step exists only for a
  caster, so an index would point one page off for everyone else; an item whose
  step is not in `steps()` is dropped rather than rendered as a dead link.
- The panel states plainly that nothing in it blocks Create Character. It is
  advice, not a gate (rule 6).

**`pending_check.mjs`, 46 checks, and most of them are about silence.** Rule 6
cuts both ways: a panel that nags about a decision already made, or one the book
never granted, trains the player to ignore it, and an ignored warning panel is
worth less than none. So the case carrying the most weight is the fully-decided
draft reporting nothing at all, and rendering as nothing rather than an empty
box. It executes the real method sliced out of the macro against hand-built
drafts, against a `this` that supplies exactly the collaborators the method may
use — anything else it reached for would throw.

**One finding from the comparison, not a change here.** The Tapestry computes
Death Threshold as `Math.max(20 + points × 2, raceOverride)`. The book makes a
race's DT its *starting* value (p.83: an Ogre "starts with … a Death Threshold
of 22") with +2 per Attribute point on top (p.87), so an Ogre spending exactly
one point should reach 24 and instead gets `max(22, 22)` — the point buys
nothing, silently, and two points is right again by accident. Ours does
`raceDT + 2 × points` and is correct. Recorded in BACKLOG for whoever maintains
that tool.

Three more Tapestry ideas are logged and ranked in BACKLOG: the always-visible
live sheet, provenance tags, and draft persistence.

Full suite green, enumerated from disk: 29 check scripts, `simtest.js` (51),
Salt-Run pregens (648), and `wizard_visual_check.mjs` across all 15 steps.

# 0.39.0 — 2026-09-19

**One flag namespace, and the bug the split was hiding.**

This was logged as tidy-up: the system wrote `flags.tbe.*` in some places and
`flags.the-broken-empires.*` in others, and picking one meant a data migration.
Looking at it turned up something else. Foundry accepts exactly four kinds of
flag scope — `core`, `world`, the **system id**, and installed module ids — and
`setFlag`/`getFlag` throw on anything else. This system's id is
`the-broken-empires`. `tbe` was never a namespace it could legally use.

It survived for the system's whole life because `update({"flags.tbe.x": v})`
does **not** validate the scope; it just writes the path. Only `setFlag` and
`getFlag` check. So every site that wrote the path by hand worked perfectly,
and the single file that used the documented API — `TBE: Funnel Roster` —
threw on every call. The incentive was exactly inverted: using the API
correctly was the thing that failed, and nothing noticed, because no check
covers that macro at all.

- **`TBE: Funnel Roster` was broken.** `getFlag("tbe", "funnel")` and
  `setFlag("tbe", "funnel", …)` raised every time, so it could not list a
  single townsfolk, record a death or a Scar, or convert a survivor into a
  character. Its sibling `TBE: Funnel` creates those actors by passing a flags
  object to `Actor.create`, which never validates, so the town generated fine
  and the tool for playing it out did not.
- **`TBE.FLAG_SCOPE` is the owner**, with `TBE.OWNED_FLAGS` naming the keys
  this system may move. Macros go through `TBE.flagPath()` and `TBE.flagOf()`.
- **Two 0.39.0 migration steps**, one over actors *and unlinked token actors*,
  one over journals, sharing a single `moveOwnedFlags` body so the two sweeps
  cannot come to disagree about what a move means.
- **It moves a named list, not the namespace.** The obvious implementation —
  lift the whole `flags.tbe` object across and delete it — would have moved
  the Salt-Run Ambush adventure's live tracker out from under it. That
  adventure ships its own installer, a system upgrade does not touch it, and
  the copy in a GM's world cannot be updated by us, so its code would go on
  reading a path whose data had been moved. Tidying a namespace is not worth
  breaking somebody's session. Fixture L asserts the adventure's keys survive,
  and fixture N seeds the naive sweep and confirms it does the damage.
- **Read tolerantly, write canonically.** Reads fall back to the legacy
  namespace so a world that has not migrated yet still finds its data; writes
  always go to the system id, so the fallback drains rather than becoming a
  permanent second implementation.
- **`perRank` is the deliberate exception**: it is *generated* data that flows
  compendium → world whenever a Talent is added, so `build_talents.py` now
  stamps the current namespace and `documents/item.mjs` reads both. Sweeping
  ActiveEffects nested inside Items inside Actors to relabel data that
  regenerates itself would be a deep migration bought for nothing.
- **`findStrandedClocks` reads both namespaces on purpose.** It is a detector
  that runs on the ready hook against a world at any version, including one
  that has not migrated yet — which is precisely the world it exists to warn.

**Four test stubs were lying, and the same lie each time.** `tier3_check`,
`phase5_check`, `audit_check` and `migration_fixtures_check` all had document
stubs whose `update()` matched *literal path strings* (`k === "flags.tbe.clocks"`)
or handled only `system.*`. The moment a path moved, those stubs silently
stopped applying writes, so correct macros failed their assertions and the
migration's own idempotence claim could not have been tested at all. All four
now apply dotted paths the way Foundry does, including the `-=` key-deletion
prefix. A stub that only understands the exact strings it was written against
is a trap for whoever changes the path next.

Fixtures K through O cover the move: owned keys move and the legacy copy is
deleted rather than duplicated, foreign keys stay put, running twice is
indistinguishable from running once, a half-finished earlier run resolves in
favour of the current namespace, and the fallback key list in `migration.mjs`
is asserted identical to `CONFIG.TBE.OWNED_FLAGS`.

Fixture I — the closest thing the suite has to Seb's real world — now also
asserts that his Campaign Clocks journal moves and its legacy key is gone.

Full suite green, enumerated from disk: 28 check scripts, `simtest.js` (51),
Salt-Run pregens (648).

# 0.38.0 — 2026-09-18

**The chat log was telling the table things that had not happened.**

The scope change of 2026-09-17 ("this is no longer a solo module in scope") left
one obvious job outstanding: the macro pack had 68 actor-write sites across 24
files and not one permission check. That was the expected finding. The actual
finding was worse, and it was already in the code:

    try { await this.actor.update({ "system.resolve.value": cur - 1 }); }
    catch (e) {}
    body += "<div>The spell is not cast. 1 Resolve spent.</div>";

Foundry throws when you write to a document you do not own. The throw was
caught, discarded, and the card asserted the cost regardless. Nine sites did
some version of this. Under solo not one of them was reachable — one user, who
was the GM, who owned everything. With players they are reachable constantly,
and what they produce is not an error but a chat log stating that Resolve was
spent, a Weave Scar was burned in permanently, a Death Threshold moved, when
none of it happened and every sheet still shows the old number.

- **`module/rules/permission.mjs` is the new owner** of "may this user write to
  this actor". `TBE.canWrite` / `TBE.write` / `TBE.writeItem` defer to it at
  runtime with a Node/legacy fallback, the same shape as `resolve`, `say` and
  `carryPool`. `applyWrite()` returns a *report* rather than a boolean, and the
  report carries the sentence to print. That is deliberate: a guard that costs
  more keystrokes than `try { } catch {}` loses to `try { } catch {}`, so the
  honest path is the short one. Every converted site now reads
  `body += w.ok ? "1 Resolve spent." : w.notice`.
- **`TBE.me()` was returning the wrong actor.** It was
  `canvas.tokens.controlled[0].actor ?? game.user.character` — perfect for solo,
  where the selection IS the intent. With players, a player who clicks a
  creature to read its Armour and leaves it selected had every write in the next
  macro aimed at the GM's creature. It now prefers the first controlled token
  the user can actually *write to*, and reports what it ignored rather than
  switching actors in silence. A GM is unaffected: they own everything, so their
  selection still wins.
- **Converted the sites that spend something and then describe it**: Cast (the
  failed-spell Resolve, Mitigation, the permanent Weave Scar, the Favor spend),
  Attack (the Shock Resolve spend and the Death Threshold, both on the *target*,
  which is almost never the roller's actor), Wounds, Counterspell, Statuses,
  Skill Roll, Talents, Advancement, Haggle, Quick Combat, Miracle, Pious Act, and
  the `_lib.js` helpers behind them (`setWounds`, `setShock`, `setSupply`,
  `markFatigue`, `removeFatigue`, `setPiety`, `addFraying`). Chargen-time writes
  (Wizard, Build, Finish) were deliberately left: they throw visibly rather than
  swallowing, and they run against a character the player just made.
- **`permission_check.mjs`**, 104 checks. Runs both paths, proves the deferral
  with a sentinel, and greps every macro for the swallow pattern so a tenth site
  cannot appear quietly.

**Sheet roll parity.** Clicking a weapon rolls the attack with it; clicking a
fighting skill rolls a parry or dodge. Both are additional *entry points* on the
same dialog, the same `resolve()`, the same visibility owner and the same
permission owner that `.skill-roll` has used since v0.31.0 — not a second
implementation. A weapon whose skill the character has never written down rolls
against the book's untrained 20 (p.104) rather than 0. Everything past the roll
— hit location, damage, Maneuvers, wounds — stays in TBE: Attack, because it
needs two actors and a whole exchange.

**`module/rules/combat.mjs`** now owns the opposed-roll cascade, moved out of
`_lib.js` where `docs/ownership.md` has said it belongs since v0.24.0. The body
was transplanted rather than retyped: the branch a re-derivation keeps dropping
is "a normal failure beats a critical failure", and dropping it is exactly how
Haggle shipped a third, subtly wrong copy.

**B1, Seb's note from the first session — "if shielding make it clear during the
attack macro."** The shield was always in the arithmetic and never in the
sentence. The attack card and the defence prompt now say which shield is up, the
AP it adds and the SL cost to circumvent it, read through `defendingShield()`,
which asks `carryPool` the same positive question `tbe-attack.js` asks. Same
source as the number, so the line cannot name a shield the roll did not count.

**B4 — the Resolve maximum that quietly ate a point.** Seb reported Resolve
going 12/12 → 12/11 with the pool untouched; no spend in the codebase can do
that, so it was a hand-edit, almost certainly someone reaching for the pool
mid-fight and hitting the identical box beside it. Resolve max and Death
Threshold max are chargen-derived ceilings, not live resources, and losing one
is permanent with nothing to restore it from. Both are now readonly behind a
lock toggle. The live `.value` fields stay freely editable — locking those would
be the opposite bug.

**A dropped weapon displayed as "(at hand)".** The weapon and shield rows
labelled carry state with a chain of `eq` helpers ending in an `else`, so every
state added after that chain was written fell into the default. The same
negative-filter bug this project has now chased through four files, in template
form. The label comes from the readiness owner.

**Four stale assertions fixed, not worked around.** `resolution_check` (x2),
`tier0_check` and `tier3_check` pinned the literal source spelling of writes
that moved behind the permission owner. Each was rewritten to assert the
guarantee it existed to protect rather than the wording — and, where the new
code allows it, to additionally assert that the card only claims what landed.
This is the same failure v0.37.0 found sitting red for two releases; the lesson
is that an assertion on source text has a shelf life.

**One real bug found while fixing the above.** The first cut of `canWrite()`
treated an absent `isOwner` as "no", which turned seven check scripts red at
once: a harness stub is a plain object with no opinion about ownership, and
refusing to write to it protects nobody while making every helper silently do
nothing outside Foundry. ABSENT is now distinguished from FALSE. In real Foundry
every Document has `isOwner`, so the branch is unreachable in production and
cannot loosen anything there.

Full suite green, enumerated from disk rather than from a list: 28 check scripts,
plus `simtest.js` (51) and the Salt-Run pregens (648).

# 0.37.0 — 2026-09-17

**A dropped shield was still defending you**, and the tooling that found it.

Seb asked for a probe to run once the scheduled overnight work is done. Building
its baseline — a snapshot of the repo taken *before* unattended runs, so
afterwards "what left" is answerable — turned up three things in this repo
before the probe itself existed.

## Fixed

- **A dropped shield still blocked.** `tbe-attack.js` selected shields with
  `carried !== "stored"` in two places: once for the defender's AP, once for
  Shield Bash. v0.35.0 fixed that negative filter in the sheet and in
  `encStatus` and did not grep for it anywhere else, so adding the `dropped`
  state created a live rules bug — a shield on the ground went on granting
  Armour Points and costing SLs to circumvent. Both sites now ask
  `TBE.carryPool`. This is the ownership discipline's step 2, "search for other
  implementations", not done properly the first time.
- **`tier3_check.mjs` had been red since v0.35.0** and shipped twice that way.
  Two stale assertions of mine: one pinned the carry enum at exactly three
  values, one matched a cost string I had reworded. Neither was a regression;
  both were invisible because **the suite was being run from a hand-maintained
  list of 13 scripts while 26 existed on disk.** The probe enumerates instead.

## Corrected

- **v0.35.0 claimed `const actor` cannot compile in a Foundry script macro.
  That is false, and the claim had reached a changelog, CLAUDE.md and two
  scheduled prompts.** Foundry wraps a macro's command in a block, so a
  top-level `const actor` *shadows* the parameter perfectly legally — which is
  why `TBE: Skill Roll` and `TBE: Character Wizard` have both done it for
  months and ran fine in a real session. The harness that produced the claim
  compiled the body bare. Three check files now compile the way `Macro#execute`
  actually does, and the 0.35.0 entry carries the correction in place rather
  than being quietly rewritten. **If a harness disagrees with a macro that
  demonstrably runs at a real table, the harness is what is wrong.**

## New

- **`release_baseline.mjs`** — snapshots the repo before unattended work: every
  watched file's hash and size, the macro roster, every check script and its
  current pass/fail, the named invariants, and what each scheduled run declared
  out of scope. It carries a DO NOT REGENERATE warning, because overwriting it
  with the post-run state makes every later comparison read clean, which is the
  worst available failure.
- **`release_probe.mjs`** — run it afterwards. Reports version/changelog/zip
  agreement, the full enumerated suite, macro parity (deleted, de-registered or
  hollowed out), the named invariants, what changed on disk against each run's
  out-of-scope list, whether new checks got documented, and any deferral the
  runs wrote into a changelog. **Findings are written into BACKLOG.md**,
  idempotently — it replaces its own section rather than stacking — and it
  touches nothing else and never fails a build.
- **`release_probe_check.mjs`** — 39 checks, and the reason to trust the above.
  The probe's failure mode is silence: a detector matching nothing looks exactly
  like a clean repo. So this builds a fake repo, seeds one violation at a time
  (macro deleted, macro de-registered, macro gutted, filter reintroduced, second
  whisper implementation, duplicated field name, check deleted, check gone red,
  check red at baseline, undocumented new check, version with no changelog), and
  asserts each one is reported at the right severity. It also proves the
  detector does NOT fire on `_lib.js`'s documented fallback, that a clean run
  writes nothing, that running twice replaces rather than duplicates, and that
  nothing outside BACKLOG.md is ever modified.

Neither probe script is in CLAUDE.md's verification list, deliberately: a
scheduled run that kept its own audit green would be grading its own homework.

# 0.36.0 — 2026-09-17

**TBE: Update Macros** — the importer that matches on name and overwrites,
instead of importing another copy. Seb's fix, in his words: *"Make the importer
match solution."*

## Closed in this release

- **`TBE: Update Macros`.** Foundry's own "Import All Content" CREATES rather
  than replaces, which is why a played world ends up with nine TBE: Character
  Wizard, five TBE: Attack and five TBE: Finish Character — all frozen at the
  version they were imported at, while the system underneath them is current.
  This matches each shipped macro to a world copy **by name** and overwrites
  its command and image **in place**. The document id does not change, so
  hotbar slots, folders and permissions all survive. Missing macros are
  created. Running it twice is indistinguishable from running it once, the same
  promise `TBE: Install Tables` makes.
- **The contract, stated in the dialog before anything happens: it only ever
  touches a macro whose NAME matches one the system ships. Rename yours and it
  is left alone, permanently.** That rule exists because nothing can tell a
  stale copy from one a GM deliberately edited — both simply differ from what
  ships — so rather than guess, this gives the GM a rule they can act on.
- **Every duplicate is brought current, not just the one that would survive a
  cleanup.** The quiet failure it avoids: prune declined, so the leftovers
  stay, and if only the keeper had been updated the GM's hotbar would keep
  running stale code while the report claimed success.
- **Deletion is opt-in, off by default, and never removes the last copy of
  anything.** When asked, it keeps one of each and prefers a copy that is on
  someone's hotbar, so tidying duplicates cannot leave a dead slot behind. A
  macro this system does not ship is never touched, with or without the box
  ticked.
- **The upgrade-time notice now names it.** `findStaleMacros()` (v0.35.1) told
  a GM their macros were behind and left them to fix it by hand; it now points
  at the macro that fixes it, and repeats the rename-to-protect rule.
- **The visibility owner names its second legitimate reason for an explicit
  mode.** Its doc said an explicit mode is for what the BOOK makes secret,
  "not for taste" — and this report is neither. It is GM housekeeping, which is
  a real third category: maintenance output that should not land in the middle
  of the table's chat. Written down rather than quietly contradicted.

## New verification

- `node macro_sync_check.mjs` — 33 checks. Runs the real macro against a stub
  world that records every create, update and delete, and asserts on what it
  DID: that a stale copy is updated rather than duplicated, that an
  already-current copy is untouched, that all three duplicates are updated and
  not just the survivor, that a cancelled dialog writes nothing, that the
  hotbarred copy is the one kept, that a macro of the GM's own is never touched
  even with prune ticked, and that a failed write is reported rather than
  swallowed. Carries a mutation that swaps the update for a create and confirms
  it reproduces the original bug — a second TBE: Attack instead of a fixed one.

# 0.35.1 — 2026-09-17

Seb confirmed his world has had **nothing past 0.29** installed. Two things
follow, and only one of them the migration can fix.

## Closed in this release

- **The 0.29.x → current jump is now a tested path.** Every other migration
  fixture covered a version nobody was standing on. `migration_fixtures_check.mjs`
  fixture I runs Seb's real world shape — a 0.29.0 world, four creature token
  actors carrying the exact corrupted Initiative strings his session probe
  reported, and an open clock, because a world that has been played in tends to
  have one. It confirms the 0.33.0 repair is the only step due from 0.29.0, that
  all four creatures are fixed in the one pass, and, the assertion that matters,
  that **the clock blocking the version COMMIT does not block the REPAIR**. That
  is a property of the ordering between `runSteps`, the clock scan and the
  commit — rule 9's shape, invisible in any one of the three.
- **A system upgrade does not update macros already in a world, and now the
  system says so.** Upgrading updates the `tbe-macros` compendium; copies a GM
  dragged into their world directory or hotbar are frozen at the version they
  were imported at. Seb's world carries nine copies of TBE: Character Wizard,
  five of TBE: Attack and five of TBE: Finish Character, because re-importing
  adds rather than replaces — so after upgrading he would still have been
  clicking the 0.28-era builds while the system beneath them was current, with
  nothing anywhere saying so. That is the "looks built but silently isn't" bar
  one level up: the system is fixed and the thing the player clicks is not.
  `findStaleMacros()` now compares world copies against the compendium at the
  same `ready` hook that reports the migration, and whispers the GM a count.
- **It reports and never writes.** No deletion, no replacement, not even an
  offer. A differing command is not proof of staleness — a GM is entitled to
  edit their own copy — and the notice says out loud that it cannot tell the
  difference. Same discipline as the stranded-clocks scan it sits beside.

## Verification

- `migration_fixtures_check.mjs` grows fixtures I and J (45 → 57 checks).
  Fixture J covers Seb's exact duplicate counts, an up-to-date copy not being
  flagged, a non-TBE macro being ignored entirely, a clean world getting no
  notice at all, a missing compendium degrading to "no claim" rather than a
  false all-clear, and — the promise of the whole feature — a spy world proving
  the scan issues no writes and no deletes.

# 0.35.0 — 2026-09-17

**TBE: Loadout** — mid-combat gear state in one panel, and the encumbrance bug
that adding a fourth state would have shipped silently.

Built off Seb's own TOR2e Loadout macro and one question about it: *"removing
load, when not explicitly carried."*

## Closed in this release

- **`TBE: Loadout`**, a hotbar panel. One row per weapon and shield, four
  states as buttons, the book's price for each transition on the row and in the
  chat card, a load total that shows what is in each pool **and what is on the
  ground in neither**, and a chat line so the table sees a change without
  anyone opening a sheet. Refuses by name when you do not own the actor.
- **A fourth carry state, `dropped`**, on weapons and shields. The book names
  three ("Weapons can be in one of three states"), and this is deliberately
  **not** claimed as a fourth: the book covers the ground through its actions
  instead — "Dropping a weapon is a free action" and "picking a weapon up off
  the ground is an action (Perform a Minor Action)", plus an Athletics roll at
  −10 per extra foe when Engaged. Modelled as a fourth enum value rather than a
  separate boolean so the data cannot encode "stored AND dropped", which is the
  one thing TOR2e's two-boolean shape allows.
- **Carry-state → ENC pool has one owner** (`TBE.READINESS` / `TBE.carryPool`
  in `helpers/config.mjs`, beside the `TBE.encumbrance` arithmetic it belongs
  with). This is the real find. Both `actor-sheet.mjs`'s `_prepareEnc()` and
  `_lib.js`'s `encStatus()` decided the pool inline with a **negative filter**,
  `(carried ?? 'hand') !== 'stored'` — which reads an open enum as a binary. The
  moment `dropped` existed, a weapon lying on the floor would have counted
  against the 6 ENC Weapons At Hand pool, in the sheet *and* in every macro,
  with no error anywhere: you would have been encumbered by something you were
  not carrying. Same rule, two implementations, about to drift the instant the
  rule grew.
- **What this deliberately does not do** (Seb's call: *state and costs shown,
  not enforced*): no turn tracking, no action counting, nothing blocked. TBE
  gives one action a round — "Failing an action still counts as having taken
  your action for the round" (p.153) — and the panel's job is to put the price
  where the person deciding can see it. Setting something to Stored is
  bookkeeping, not a retrieval; the 2-actions-usable-on-the-third flow (p.159)
  is out of scope and the panel says so rather than implying it was free.

## New verification

- `node loadout_check.mjs` — 54 checks. Runs the real pool owner over every
  state, the real `encStatus` sliced out of `macros/_lib.js` against stub
  actors, and the real `_prepareEnc` sliced out of the sheet, comparing the two
  across a 32-loadout matrix. Proves the deferral with a **sentinel** return
  value rather than an equal one. Verifies the book quotes that justify the
  fourth state, and that the code says out loud which states are the book's and
  which is ours. Carries a mutation restoring the negative filter, confirming a
  dropped weapon starts weighing you down again.
- It caught one real defect in its own subject while being written:
  `audit_check.mjs`'s encumbrance harness had to be given the new owner, or it
  was pinning two implementations against each other in a shape neither one
  ships.
- **CORRECTED IN 0.37.0 — this entry originally also claimed that `const actor`
  "collides with the `actor` parameter Foundry passes to every script macro".
  That is false.** Foundry wraps a macro's command in a block, so a top-level
  `const actor` shadows the parameter legally; TBE: Skill Roll and TBE:
  Character Wizard have both done it for months and run fine at a real table.
  The harness that produced the claim compiled the body bare. Left visible
  rather than quietly rewritten, because the claim also went into two scheduled
  prompts before it was caught.

# 0.34.0 — 2026-09-17

**Scope change: this is no longer a solo module.** Seb's words. A GM and
players, separate clients, one shared chat log, is now the default assumption
the system is designed against; solo stays supported as a mode and nothing
solo was removed or deprecated. CLAUDE.md carries the constraint and the three
questions it forces onto every change (who can see this, who owns this actor,
can two clients do this at once).

The first thing that assumption broke was chat.

## Closed in this release

- **A GM can now roll privately. Before this, nothing in the system could.**
  `TBE.say()` posted all 59 of the macro pack's chat cards publicly with no
  roll-mode support of any kind, and the sheet's skill-roll button called
  `toMessage()` without one either. Both now respect the roll-mode dropdown a
  GM already reaches for by reflex, and a caller can force a mode for cards the
  *book* makes secret.
- **The hidden Tolerance roll is actually hidden now, instead of destroyed.**
  Ch.13 p.251: "The Tolerance is hidden from the players, so they will never
  know for sure how many opportunities they have left." TBE: Social Encounter
  honoured that by evaluating the 2d10 and then showing it to **nobody**,
  including the GM, because whispering was not possible and the code said so in
  a comment. The roll now goes to the GM as its own whispered card, forced to a
  GM whisper regardless of the dropdown, because a rule in print outranks a UI
  setting. Whispered rather than blind: blind would hide it from the GM too, and
  the GM is the one person the book means to know the number. The public card is
  byte-for-byte what it always was.
- **Chat visibility has one owner**: `module/rules/visibility.mjs`, published on
  `game.thebrokenempires.rules.visibility`, with `TBE.say` deferring at runtime
  and keeping its body only as the Node/legacy fallback — the same pattern
  `resolve`, `rankCap`, `strandCap`, `sizeEffects` and `encumbrance` use. It
  prefers Foundry's own `ChatMessage.applyRollMode`, feature-detected rather
  than version-gated (rule 7).
- **Two bugs in that owner, found by running it rather than reading it.** The
  first draft let the rule module reach for an ambient `ChatMessage` global, so
  the deferral path silently produced an empty GM list — a whispered card that
  reaches nobody. The second read `data.user` for `selfroll`, which nothing
  populates, with the same result. Both now passed in explicitly
  (`ChatMessageClass`, `selfId`). Both were caught by `visibility_check.mjs`
  section 5 comparing the owner against the macro pack's fallback across every
  mode, not by any assertion written to look for them.
- **The macro compendium is no longer labelled "TBE Solo Tools."** It is "TBE
  Tools". The macros are unchanged.

## New verification

- `node visibility_check.mjs` — 62 checks. Executes the real visibility rule and
  the real `TBE.say` sliced out of `macros/_lib.js` across all four roll modes,
  both with the rules global present (deferral) and absent (fallback), and with
  and without Foundry's `applyRollMode` helper, asserting the two paths never
  disagree. Pins the precedence (forced mode > dropdown > public), that a
  throwing settings lookup degrades to public rather than to a silent whisper,
  that going public clears a stale whisper rather than inheriting it, and that
  **no mode ever hides a card from the GM**. Carries a mutation dropping the
  forced mode from the fallback and confirming the sweep catches the broadcast.
- `probe_check.mjs` section 8's premise assertion now **executes** `TBE.say`
  instead of regexing its source. The old regex broke on this release's changes
  while the premise it tested stayed true — a check failing for the wrong reason
  is one bad day away from being loosened until it tests nothing.

# 0.33.0 — 2026-09-16

**Every creature in a played world was rolling Initiative 0 and acting last.**
Found in the after-action probe from the first real session, not by any of the
sixteen verification scripts, all of which were green while it happened.

## Closed in this release

- **The creature sheet had two form controls named `system.initiative`** — one
  in its own header, one in the shared `actor-wounds.hbs` chip. Foundry's
  `FormDataExtended` collects a repeated name into an **array**, and the
  StringField behind creature Initiative cast that array to `"14,14"`. Every
  later save appended again: `"14,14,NaN"`, `"14,14,NaN,NaN"`. `num()` of that
  is `NaN`, so `prepareDerivedData` fell back to 0, `@initiativeEffective`
  resolved to `"0"`, and the combat tracker dutifully rolled a formula of `0`.
  Elspeth Dunmore and Morrk acted dead last in all five rounds of the ambush.
  The header now **displays** the value and the chip **owns** it, with a
  comment in both files saying why a second input must never go back.
- **The Initiative field's `data-dtype` now follows the DataModel.** It was
  hardcoded `Number` in a partial shared by both sheets, but
  `creature.initiative` is a StringField and `character.initiative` is a
  NumberField. A blank creature saved through a Number dtype stored the
  literal string `"NaN"`.
- **A migration repairs worlds that were already played in** (`0.33.0`
  in `STEPS`). The duplicated inputs always submitted the same stored value,
  so the leading segment is the number the GM typed and is restored; a value
  with no number in it at all (`","`, from a blank creature saved twice) goes
  back to blank rather than to a guess. Clean values are untouched, so a
  second pass writes nothing.
- **The migration layer can now walk token actors.** The new `tokens`
  collection covers world actors *and* the synthetic actors behind unlinked
  tokens. This is not a refinement: in the reported world, every corrupted
  actor was a token actor, because a GM edits the thing on the battle map.
  A sidebar-only sweep would have stamped that world "migrated, nothing
  needed changing" — `migration_fixtures_check.mjs` fixture H runs exactly
  that mutation and confirms it.
- **The session probe was reading the wrong field.** Roll cards written by
  `TBE.say()` — which is every macro, and so most of what a table rolls — put
  their text in `content` and set no `flavor`; only the v0.31.0 sheet card
  uses `flavor`. The probe parsed `flavor` alone, so the first session's 65
  rolls came back as `{"(none)": 65}`: tidy, empty, and reading like a table
  that barely rolled. It now parses whichever field carries the text, knows
  the skill-roll, attack and tracker-Initiative card shapes by the literal
  strings their emitters write, reports `byKind` and an `unparsed` count, and
  **says in a note** when a large share of rolls went unattributed rather than
  letting the aggregates pass as the table's habits.
- **The probe now flags this class of bug itself**: a dedicated
  `rolls.initiative` block naming anyone whose Initiative formula resolved to
  0, and a health-check line naming any actor — token actors included — whose
  `system.initiative` is a comma-joined string.

## New verification

- `node sheet_form_check.mjs` — 23 checks. Expands every actor sheet's
  partials the way Handlebars would and requires field names to be unique per
  form, because two controls sharing a name is a data-corruption bug that no
  rules test, number test or formula test can see. Also runs the repair step
  over the five corrupted strings the real world was carrying, and carries a
  mutation that puts the duplicate input back.
- `migration_fixtures_check.mjs` grows fixtures G and H: a played 0.32.0
  world repaired where it actually broke, and the sidebar-only mutation above.
- `probe_check.mjs` grows section 8: the macro cards, built from the real
  `TBE.card` sliced out of `macros/_lib.js`, with a mutation that restores
  flavour-only parsing and confirms it loses every one of them.

# 0.32.0 — 2026-09-16

**Click a skill on the sheet to roll it**, and the d100 rule finally has one
owner instead of a copy in every macro.

## Closed in this release

- **`module/rules/resolution.mjs` is the owner of d100 resolution.**
  `docs/ownership.md` has listed this as "Not yet extracted" since that table
  was written. The rule was correct but lived only in `macros/_lib.js`,
  copy-pasted into every macro at build time and unreachable from any system
  file, which was harmless right up until the sheet needed to roll a die.
  `TBE.resolve` now defers to `game.thebrokenempires.rules.resolve` and keeps
  its own body only as the fallback for the Node harness, the same pattern
  `rankCap`, `strandCap`, `sizeEffects` and `encumbrance` already use.
- **Clicking a skill name on the sheet rolls it.** Both sheets, so a GM can
  click-roll a creature's attack skill as easily as a player rolls Survival.
  The dialog offers exactly two things, because they are the only two the
  book lets you change before a roll:
  - the **Task Modifier** (p.25), the book's own five steps, Simple +20
    through Hard -20, each shown with the book's own example;
  - **Favor**, +10 a point, capped at 3 and additionally capped by the
    Resolve actually left. The dialog says out loud that the cap is "from any
    source", so Favor banked in a scene and Resolve spent at the table are
    competing for the same three points, and that Task Modifiers do not apply
    to opposed rolls.
  A live total shows what you are rolling against before you commit Resolve
  you cannot get back. The roll resolves first and the Resolve is deducted
  after, so cancelling costs nothing, and a user who cannot write to the
  actor is told the Resolve was not spent rather than it failing silently.
- **The sheet owns no rules.** `_onSkillRoll` computes
  `base + task + favor x 10` and nothing else. Everything the book decides
  comes from the rule module.

## A principle changed, deliberately

CLAUDE.md's opening used to say flatly that sheets carry no native buttons
and everything runs through the macro pack. That is no longer true, so the
paragraph now says what is true and why: making someone open a macro and
find their skill in a dropdown is a poor way to teach the core mechanic on
a first roll. The line that did not move is that a sheet may do arithmetic
and must not own a rule.

## Verification

New: `node resolution_check.mjs`, 42 checks. Runs the owner and the macro
pack's copy over every roll from 1 to 100 against 17 skill values and 4
Expertise ratings, 6800 comparisons, with the global present and absent, and
asserts they never differ. Injects a sentinel owner to prove the macro really
defers rather than coincidentally agreeing. Reproduces the book's own worked
example (Arn, Survival 50, 2 Resolve, rolls 63 for 6 SLs, and fails on the
same roll unboosted). Asserts the sheet handler reimplements none of the
rule. Carries a mutation that drifts the macro's crit rule and confirms the
sweep catches it.

Full suite green: simtest, funnel (47), magic (87), cast, enforcement,
phase5 (61), audit (116), resolver (16), migration fixtures (21), derived
data (14), skill picker (63), finish and the wizard visual regression.

# 0.31.0 — 2026-09-16

**Every skill a character can roll is now offered by the roll picker.**
Reported from a live table: "the actors lack their skills with 20, meaning
they effectively can't be rolled with the macro."

Ch.7 p.104: a skill with no value "begins at 20". A TBE sheet deliberately
records only the skills that differ from that, which is right, since an actor
carrying 37 skill Items at 20 is noise. But `TBE.skillOptions()` built its
dropdown from the sheet alone, so an untrained skill could be rolled only by
knowing the rule and typing 20 into the number box by hand. The rule was real
and invisible, which is the opposite of what this pack is for.

## Closed in this release

- **The picker offers the whole 37-skill catalogue.** Skills on the sheet keep
  their real value, Expertise and Savvy and sit under an "On the sheet" group.
  Everything else sits under "Untrained (20, p.104)", labelled rather than
  silently mixed in, so choosing one still shows why it is 20. Group filters
  apply across both groups. Every macro using the picker inherits this and
  none of them changed.
- **Skills outside the catalogue are not invented.** Languages, custom
  "-wise" skills and Piety appear only when the actor actually has them,
  because nobody has every language at 20.
- **`TBE: Skill Roll`'s typed fallback defaulted to 50**, a number from
  nowhere. It now defaults to 20, the book's starting value.
- **`TBE.BASE_SKILL` is the one owner of that 20.** `TBE.blankSkillValues()`
  reads it instead of carrying its own literal.
- **`TBE.actorSkills()` now calls `TBE.me()`** rather than repeating the
  selected-token-or-assigned-character expression a second time.

## Verification

New: `node skill_picker_check.mjs`, 63 checks that execute the real
`skillOptions` out of `macros/_lib.js` against stub actors rather than
reading its source. Covers the full catalogue, sheet values winning over 20,
Expertise and Savvy carrying through, the optgroup labelling, group filters,
the no-actor case, and the Language/-wise/Piety exclusion. Carries a mutation
that restores the sheet-only picker and confirms Intimidate vanishes from the
list, which is the defect this release fixes.

Full suite re-run green, since `_lib.js` is concatenated into every macro:
simtest, funnel (47), magic (87), cast, enforcement, phase5 (61), audit
(116), resolver (16), migration fixtures (21), derived data (14), finish and
the wizard visual regression.

# 0.30.0 — 2026-09-14

**Feature-complete.** Every system in the book is built, every known defect is
fixed, and the remaining items on the audit list are architecture preferences
rather than things that stop the system working. Version bumped to 0.30.0 to
say that plainly instead of shipping another patch number against a list that
was never going to reach zero.

## Closed in this release

- **No outbound network requests.** The stylesheet opened with an `@import`
  from fonts.googleapis.com, so a world with no internet rendered in whatever
  the browser chose and every table quietly called Google. The three families
  are named first and each now carries a real fallback stack (Georgia /
  Palatino for the old-style serifs, ui-monospace for the mono), so an offline
  world looks right and anyone who has the real faces installed still gets
  them. Bundling the actual woff2 files is the nicer answer and is left open;
  the fonts are OFL-licensed so nothing prevents it.
- **Encumbrance can no longer drift.** `_prepareEnc()` in the sheet and
  `TBE.encStatus()` in the macro pack are the same rule written twice, and the
  sheet's own comment said "kept in sync by hand" — a request, not a guarantee.
  They agree today; that was verified by running both, not by reading them.
  `audit_check.mjs` now executes both across 128 loadouts spanning every
  overflow band and fails the build if they disagree, and separately checks the
  bands against the book, because two copies can agree and both be wrong.
- **English-only is stated as a decision** in the README rather than left as an
  unanswered question about the thin `lang/en.json`.

## What is deliberately not done, and why none of it blocks play

These were all raised by the external audits. Each is a real observation. None
of them is a defect a player or GM will meet at the table:

- **ApplicationV2.** The sheets use Foundry's V1 `ActorSheet`/`ItemSheet`, which
  is deprecated since V13 but fully present and working in V14. Rewriting them
  is a framework migration with its own testing surface and no user-visible
  benefit today. It belongs in its own release, not bolted onto a correctness
  pass.
- **`validateJoint()` on the DataModels.** Contradictory states are
  representable in the schema. They are also largely transient editing states —
  an armour piece is briefly equipped with no location ticked while you tick
  the locations — and every joint rule added is a new way for an EXISTING world
  to refuse to load. The risk is real and the benefit is hypothetical.
- **One runtime owner for the shared rules.** `sizeEffects` and now
  encumbrance are pinned by executable tests rather than genuinely
  single-sourced. The audit is right that a test is a safety net and not an
  ownership model; it is also true that the net holds and that restructuring
  how macros reach system code is a project, not a fix.
- **`flags.tbe` vs `flags.the-broken-empires`.** Both are live and both work.
  Consolidating means migrating every existing world to gain nothing a user can
  see. Closed as a deliberate inconsistency, not debt.
- **Derived data written onto `this.system`.** Works, and is what the initiative
  fix now depends on. Namespacing it is a refactor with real regression risk.
- **A creature action model, and migration fixture worlds.** Both are additions,
  not corrections. The sequential migration tests already cover the failure
  modes fixtures would.

## The one thing left that genuinely is not done

Nobody has loaded this in a real Foundry instance yet. Every check in the suite
runs against the working tree; none of them opens the zip in Foundry, creates a
world, and plays it. That is the last unverified step and it is not one more
code change — it needs a person, a Foundry install and an evening.

Full suite green: 17 scripts, audit_check at 109.

# 0.29.1 — 2026-09-14

A second outside audit of the 0.29.0 zip found a migration bug that 0.29.0
introduced while fixing everything else, and that 0.29.0's own check script
asserted was impossible. That check read `migrateWorld()`, confirmed it only
wrote the version when its own report was clean, and passed. It was true, and
it was irrelevant: the clock stage ran afterwards, in the ready hook. The
property being claimed was never about one function's internals, it was about a
sequence, and no static read of either half could show it.

## The migration was worse than the audit found

Reviewing the report against the source turned up three more faults in the same
40 lines, any one of which was worse than the reported one:

- **It wrote to the wrong setting.** The tracker store is `encounters`; the
  clock stage looked for `trackers`, found nothing registered, and returned
  early. It had never been capable of migrating a clock.
- **It would have written an Array over an object store.** `TBE.trackers()`
  returns an object. Had the key been right, the stage would have replaced
  every tracker in the world with a four-element array.
- **It used field names the tracker shape does not have** — `label`, `filled`,
  `size`, `open` against the real `name`, `slsRequired`, `total`,
  `intervalsUsed`, `status` — so anything it did write would have been
  unreadable by `TBE.trackerLine()`.
- Plus the reported faults: it deduplicated on display label, so two clocks
  both called "Doom Clock" became one, and it dropped the `failed` filter, so
  blown clocks would have come back to life.

The root cause is the one this project keeps re-learning: **that conversion
already had an owner.** v0.28.0 turned the retired TBE: Clocks macro into
exactly this migrator, correctly, and tested it. Writing a second
implementation inside the migration layer was the same duplicate-ownership
mistake the ownership ledger exists to prevent, committed while building the
mechanism meant to prevent it.

### What it does now

- **One transaction boundary.** `migrateAll()` is the only function that writes
  the recorded version, and it runs last. Every earlier stage reports; nothing
  commits. A failure anywhere leaves the world on its old version so the next
  load retries, instead of stamping it migrated with work outstanding.
- **The clock stage converts nothing.** It finds stranded clocks, counts them,
  names them, and tells the GM to run TBE: Clocks — which owns the conversion
  and does it correctly. The version is held while any remain, so the notice
  cannot be shown once and lost. A migration layer that writes nothing to the
  tracker store cannot corrupt the tracker store.
- **Steps declare which collection they walk** (`actors`, `items`, `journal`,
  `world`) instead of "actor" being baked into the abstraction.
- **"Fresh world" now means fresh.** The old test was "no Actors and no
  Journals", which is true of a world full of Items, Scenes, Macros and
  RollTables; such a world was stamped current and skipped every migration. It
  now asks whether any collection has content.

## Other findings from the same audit

- **The README said 149 Talents.** v0.29.0 generated the macro count and left
  the Talent count hand-typed two lines below it, so the README shipped
  contradicting its own changelog. Every count in that table is generated from
  the packs now, and the build fails if any disagrees. Fixing one instance of a
  class of bug and leaving its siblings is how the class survives.
- **Write-ahead logs still shipped.** 0.29.0 removed `LOCK`/`LOG`/`LOG.old` but
  left `.log` files, one of which held 116 KB of live journal data — stripping
  those blindly would have shipped an unreadable pack. The build now compacts
  each database first, which moves the data into `.ldb` and leaves the log
  empty and provably disposable, then **reopens every pack after cleanup and
  counts its documents**, failing the build if the strip took anything needed.
  Packs ship three files each.
- **`flags.thebrokenempires` was dead code** — read into a variable that was
  never used, and written by nothing. Removed. The two live scopes (`tbe` and
  `the-broken-empires`) are a real inconsistency, but consolidating them means
  migrating every existing world, so that is logged as a decision rather than
  done quietly.
- **Talent effect scaling no longer infers per-rank from "ADD mode and a
  number".** `build_talents.py` already stamped `flags.tbe.perRank` on every
  effect it generates; the runtime simply never read it. It does now. The first
  attempt made scaling opt-IN and `tier0_check.mjs` caught it within seconds: a
  hand-made effect carries no mark and would have gone back to paying 1x
  however many ranks were bought, which is the inert-Talent bug v0.13.0 existed
  to kill. It is opt-OUT — an effect may declare itself flat and that is
  honoured, and anything unmarked still scales, so the shipped data is fully
  explicit and nothing a GM adds by hand goes quietly inert.

## Verification

`audit_check.mjs` is 105 checks now, and section 7 was rewritten from static
reads into **sequential** tests: the module runs against a stubbed world and is
asserted over transitions — run, fail, run again, and check what the world is
left holding. Partial failure holds the version and the retry completes the
job; two clocks sharing a label stay two clocks; the migration writes nothing
to any tracker store; a second run is a no-op. A mutation that restores the
0.29.0 commit ordering is caught by those tests.

That is the lesson worth keeping from this round. Static, contract and
behavioural checks all passed on 0.29.0's migration. Correctness of a migration
is a property of a **sequence of state transitions**, and only a test shaped
like a sequence can see it.

Full suite green: 17 scripts, including simtest 51, tier0 42, tier2 54, tier3
46, funnel 47, intrigue 51, ritual 85, enchant 69, divine 58, magic 87, phase5
61, audit 105, cast, enforcement, finish, wizard and syntax.

# 0.29.0 — 2026-09-14

An outside release audit of the 0.28.0 zip, by someone who had not written it,
read the whole tree against the live Foundry V14 API. All sixteen check scripts
were green throughout. Everything below is a case where the code did exactly
what the code said.

Each finding was re-verified against the source here before being acted on, and
three of the audit's own claims did not survive that: the check scripts are not
missing (they live at repo root and the zip is `system/` only, by design), the
duplicate `sizeEffects()` is dead code rather than a live bug, and the status
registration defect is not what stops the system appearing in the world-creation
list — Foundry builds that list from manifests before any system JS runs.

## Startup and rules correctness

- **Foundry V14 could not start the system.** `CONFIG.statusEffects` is an Array
  through V13 and a keyed object (`{ [id]: StatusEffectConfig }`) from V14 on.
  Registration called `.find()` and `.push()` on it unconditionally, which
  throws inside `init`. Registration now branches on the shape it actually
  finds rather than on a version number, so it survives a future change or a
  compatibility shim that would make a version read misleading. The `group`
  field — which TBE already had in hand and was discarding — is carried through,
  and statuses register as HUD-togglable.
- `CONFIG.ActiveEffect.legacyTransferral` removed. V14 retired the framework and
  the value has been the default since V12, so the line did nothing on any
  supported version.
- **Every player character rolled initiative as `1d10 + 0`.**
  `TheBrokenEmpiresCharacter.getRollData()` overrode the base model without
  calling `super`, dropping `initiativeEffective`, `armorInitPenalty`, `ll` and
  `wp`. Those are derived properties assigned onto `this.system` rather than
  declared schema fields, so Foundry's own `getRollData()` could not supply them
  either — the DataModel method was their only route into a roll formula.
  Creatures never overrode it and rolled correctly the whole time, which is why
  nothing looked wrong. Base owns the shared contract; subclasses only add.

## Talent catalogue — one parsing gap, three wrong answers

The catalogue holds 150 Talents, not 149. All three faults trace to how a
Talent's boundaries are found in the book text.

- **A Talent that did not exist.** `“…BUT IT IS NOT THIS DAY!”` opens with
  punctuation. The header pattern required a capital as the very first
  character, so the match was never attempted, and the entire Talent sat inside
  the description of Anti-Venom Blood above it — which then also inherited its
  "can be purchased up to three times" and was mis-ranked because of it.
- **A group-scoping sentence attached to the wrong side.** The book states one
  purchase limit above a run of six Talents: *"Each of the following can be
  purchased up to 3 times:"*. Read entry-by-entry, that sentence landed in the
  body of the Talent above it. So **Wrestler** came out repeatable against a
  book that says *"Can be purchased once"*, and **Shield Arm, Slippery, Stable
  Stance, Stay Put, Stay Up and Strong Grip** came out take-once against a book
  that allows three. The under-permitting half is the same failure v0.21.0
  shipped a fix for: real XP spent on a purchase that does nothing.
- **A usage window read as a purchase axis.** Ten Talents open *"Once per
  session, you can ..."* and also say plainly that they may be purchased up to
  three times. The "once per X" test ran first and won, tagging them `per-skill`
  — whose cap is 1. Extra Bandages, Spyglass, On Through The Night, Careful
  Rationing, Ease Of Passage, Steely Thews, I Have Just The Thing, True Faith,
  Kingsfoil and Strong Immune System were each capped at a single purchase.
  The fix matches on the verb, not on a blacklist of time words: every genuine
  axis in this book says *"can be purchased once per weapon type"*, and no usage
  window does. A blacklist was tried first and was wrong — it threw away
  Enhanced Defense, whose axis is "once for each **Combat** skill".

`parse_talents.py` now carries mutation-tested assertions for all three, plus a
pin on the number of group-scoping sentences, so a second one appearing cannot
silently re-mis-rank a whole run.

## Bestiary

- **Five creatures shipped with no Ferocity**, the Dragon and the Roc among
  them, along with the Roc, Water Drake, Summoned Creature and Sattagoyan Horse
  Archer. A footnote marker on the Move value (`Move 2†`, "can fly") stopped the
  stat-line pattern, and because the Ferocity group is optional the match still
  succeeded with it empty — a blank optional group is indistinguishable from a
  creature that genuinely has none. `parse_bestiary.py` now checks each
  creature's captured Ferocity against the number printed in that creature's own
  stat block, so a marker-mangled capture fails the build. The first version of
  that guard did not fire under mutation and was rewritten; it searched the
  whole book from the creature's name and walked into the next creature's line.

## One rule, one behaviour

- `TBE.sizeEffects()` existed twice and had drifted **in both directions**: the
  system copy never received the v0.21.0 Lock fix and named the attacker's reach
  `reach` where the macro names it `attackerReach`, while the macro copy was
  missing a key the system had (`attackerMustDodge`, which nothing reads). The
  system copy is read by nothing today, which is exactly why it went unnoticed —
  a loaded trap for whoever wired it up first. The two are now identical, and
  `audit_check.mjs` executes both across every size pairing rather than
  comparing source text.
- The player-facing size note said "Drive Back, Trip and Disarm are unavailable"
  while `maneuversBlocked` has included Lock since v0.21.0. It names Lock now.

## World migration

- **There was no migration layer at all.** Every release answered "what does a
  new world look like" and none answered "what happens to a world someone
  already built". `module/migration/` adds a registry, a GM-only `ready` pass
  that runs only when the world is behind the build, and a whispered report of
  what moved. Steps are additive and idempotent: legacy values are copied, never
  deleted, a real sheet value is never overwritten by a stale flag, and the
  recorded world version only advances when the pass comes back clean, so a
  failure retries instead of being skipped. Two steps ship: the stranded
  `flags.tbe.toughness` (read by Journey Leg's infection check but written by
  nothing, fixed in the macro in v0.22.0), and journal-flag clocks, which
  v0.28.0 could only move if a GM happened to find the migrator macro.

## Release hygiene

- **Eighteen LevelDB runtime files** (`LOCK`, `LOG`, `LOG.old`) shipped inside
  the packs, because the zip was taken from the working directory. `build_packs.mjs`
  clears them at the end of the build that creates them.
- **The README's macro count was hand-typed and wrong by ten** — "the 27 play
  macros" against 37 shipping. It is generated from the pack now. Counting the
  `macros/tbe-*.js` files gives 36 and would have been differently wrong: one
  macro, "Ask the Weave", carries no `tbe-` filename prefix.
- `systemVersion` in `build_packs.mjs` had been left at 0.27.0 through the whole
  of 0.28.0, stamping every pack document with a system version two releases
  old. It reads the manifest now.

## Verification

`audit_check.mjs` — 75 checks over all of the above, with mutation guards that
reintroduce each defect and confirm the check catches it. The status
registration is asserted by *running* it against both an Array and a keyed
object; the roll-data contract by executing both DataModel methods and checking
that every `@reference` in the live initiative formula resolves. Reading the
source was what missed these in the first place.

Full suite green: simtest 51, tier0 42, tier2 54, tier3 46, funnel 47, intrigue
51, ritual 85, enchant 69, divine 58, magic 87, phase5 61, cast 109, audit 75,
plus enforcement, finish, wizard and syntax checks.

# CHANGELOG

## 0.28.0 — The play-experience pass: five defects nothing mechanical could see

The first named Phase 5 pass. Two halves, both done: a session played end to
end through the tools as a player would open them (build a character, travel,
meet someone, fight, check yourself, start an investigation, pray, advance),
and an audit of the macros against CLAUDE.md's "what correct means" list. The
fourteen existing check scripts were green throughout, all 600-odd assertions,
because every one of these is a case where the code did exactly what the code
says and the result still reached a player as damage.

### Any character could be permanently Cast Out by opening the wrong macro

`TBE.godbound()` answers one question — is this a Godbound? — and its answer
was "does this sheet have a Piety skill Item". Both chargen paths created one
at 0 on **every** character as a placeholder, so every Warrior, thief and
merchant in the world read as a Godbound. Piety 0 cannot succeed, asking costs
Piety whether or not the god answers, and Piety at zero is Cast Out: the
character is locked out of divine magic until an act of atonement. So an
ordinary character who opened TBE: Miracle once, out of curiosity, was
permanently damaged, with no warning before and no explanation after.

- Neither chargen path mints the placeholder any more. The Godbound career
  still gets Piety 50 (career pool 20 + the Godbound Talent's 30, p.104/Ch.4),
  and anyone who takes the Talent later gets the skill from TBE: Talents,
  which is where that grant already lived.
- `TBE.godbound()` keeps its role as the single owner of the question, and its
  definition now survives worlds built before this version: a real Godbound has
  Piety above zero, or a deity, or a Domain, or is already Cast Out. A Piety
  skill at 0 with none of those is the placeholder, not a calling.
- TBE: Miracle refuses both cases with different words, because "no Piety skill
  on this sheet" is a lie to someone looking at a sheet that has one.

### Career skill points vanished at the 70 cap and the card said they were spent

Typing 80 points into a skill sitting at 20 bought 50 of them; the other 30
were clamped away in silence while the card reported "Combat 80/80". The
allocation dialog also showed no skill's current value, so there was no way to
see it coming — the same preparedness defect the Wizard's own allocation step
had, fixed there in v0.10.1 and left standing in TBE: Build Character.

- Every field now shows what the skill sits at and how much room is left
  ("Dodge (at 20, room 50)"), defaults are capped to that room, and the dialog
  says up front that overflow is lost.
- Points that still go over are counted, named on the card ("Combat 80/80
  (30 lost to the cap)") and listed skill by skill on the Notes tab.

### Two stores for one rule, and TBE: Status read the wrong one

TBE: Clocks kept extended rolls on the flags of a journal. Extended Roll,
Chase, Ritual, Social Encounter and Summoning all keep theirs in the world's
tracker setting behind `TBE.trackers()`. A clock started in one was invisible
to the other, and TBE: Status read only the journal — so a player with five
things running was told "Clocks: none running". Same rule (Ch.2 p.22-24),
same fields, two implementations that could never see each other.

- Extended Roll is the surviving owner: it does everything a clock did and
  carries multiple participants, the Timer Die, Tolerance and the clue readout
  besides. **TBE: Clocks is retired into a one-shot migrator** — run it once in
  an old world and every open clock becomes an extended tracker with its
  progress, interval count and limit intact. It is idempotent and it is no
  longer offered on the Solo Panel, which now lists TBE: Extended Roll there.
- `TBE.openTrackers()` and `TBE.trackerLine()` in `_lib.js` own "what is
  running, in one line" for all seven tracker kinds. TBE: Status uses them, so
  it now lists a Chase, a Ritual, a Pact, a Summoning circle and both kinds of
  Social Encounter alongside extended rolls.

### The printed page number shipped inside the data

Twenty of the 56 creatures carried the book's page number on the end of their
ability notes — a GM reading the Basilisk's card saw "...Driven Back into a
Rough zone. 447" — and NPC Traits row 99-00's reaction trigger read "Bias:
People who smell of travel 479". Round-tripping against the book cannot catch
this: the number really is in the book, just not in the table.

- `parse_bestiary.py` now removes the page-number lines before parsing. A bare
  three-digit line is not always furniture (one creature's Endurance is 105),
  so the rule is the sequence rather than the shape: page numbers run strictly
  +1 through the chapter, and anything that breaks the run is data.
- `parse_npc_traits.py` no longer swallows the line after the last row.
- Both extractors now refuse to write a file with a cell ending in a bare
  three-digit number, so reverting either fix fails the build.

### Two creatures were missing under their real names

A creature name printed across lines with its native term in parentheses was
cut short at the first line that looked complete, so the bestiary held
"Brakk-Thuun)" and "Skarn)" instead of **Brutesworn (Brakk-Thuun)** and
**Orc Chieftain (Skarn)**. The name walk now runs until the parentheses
balance, and an unbalanced name fails the extractor.

### Also

- New `phase5_check.mjs`: 61 assertions covering all five, with three mutation
  guards that reintroduce the Godbound gate, the silent point loss and the
  wrong Status store, and require the check to fail on each.
- `tier0_check.mjs` no longer expects a rider note in TBE: Clocks, which is
  not a roll dialog any more. `wizard_visual_check.mjs` now asserts both
  halves of the Piety grant: a Godbound gets 50, nobody else gets the skill.
- A tracker nobody has advanced yet reads "0 / 9 SLs, per 1 day" on Status
  rather than "interval 0", which looked like a bug.

## 0.27.0 — Divine Magic: Piety, miracles, and twenty Domains

Chapter 15, and with it the last content gap in the roadmap's matrix. Piety
had existed as a skill since v0.15.0 — the Godbound Talent granted it at 30,
Advancement correctly refused to let XP buy it — but nothing did anything with
it. There was no way to ask a god for anything.

- **TBE: Miracle.** The Piety roll, with everything the book is specific about
  and a table gets wrong by hand. Resolve cannot be spent on it. No Weave
  Reaction ever follows a miracle — "the god itself mitigates the Weave". A
  holy symbol adds +2 SLs, but only **after** a success, and steps down a die
  type on a 1-2. Persistent prayer adds +1, +2 or +3 SLs for a minute, ten
  minutes or an hour. A Piety lifted over 100 by modifiers grants bonus SLs and
  cannot critically fail. The SL total picks the level of miracle, and the card
  then lists that Domain's own miracles at that level, drawn from the book.
- **Asking costs Piety whether or not the god answers**: 1d10 plus the total
  SLs on a success, nothing at all on a critical success, 1d10 on a failure and
  1d10+10 on a critical one. The thresholds are watched — a warning vision at
  30 or below, encouragement at 80 or above — and a Godbound whose Piety
  reaches zero is **Cast Out**, immediately after the miracle resolves if it
  landed.
- **Celestial servants** cap at a Middle Miracle, and so does the muted period
  after an atonement, when "no Greater Miracles may be granted for 1d6 game
  sessions".
- **TBE: Pious Act.** The only way Piety ever comes back: all fourteen acts
  with their own dice, the 90 ceiling, fasting's Fatigue, atonement lifting a
  Cast Out and starting the 1d6-session count-down, and blessing a holy symbol
  back to d12.
- **Sheet.** A Divine block on the Magic tab for anyone with Piety: deity, holy
  symbol die, the Domains list, and the state of the bond. It says plainly that
  by default the Godbound does not know their own score — the GM keeps it.
- **Data: `parse_divine.py`.** The procedure is hand-transcribed with the quote
  each number came from; the **Domain lists are extracted**, because there are
  218 miracles across 20 Domains and hand-typing them is how tables go wrong.
  Every miracle is round-tripped against the book, and every one is checked to
  sit between its own level's header and the next, so a Greater miracle cannot
  be filed as a Lesser while still "verifying". Mutation-tested: filing every
  Domain's miracles one level down produces 218 failures, as it should.
- New `divine_check.mjs` (58 checks).

**Found while building it**

- Round-tripping a miracle against the book is not enough on its own: a bullet
  cut short at a page break is a *prefix* of a real sentence and passes that
  test happily. Ten miracles were being silently truncated where a wrapped
  bullet ran into page furniture. The fix was a completeness guard — the stored
  text must end where the book's own sentence ends — plus a rule that only a
  line immediately following the previous one continues a wrapped bullet. The
  guard then caught one genuine oddity: a Fertility miracle the book itself
  ends without a period, which is now stored exactly as printed.
- The extractor's position check was anchored on each Domain's heading, and
  "Water Domain" also appears in a worked example several pages earlier. Every
  Water miracle was measured from the wrong place and reported as misfiled.
  Anchored on each Domain's unique line of aspects instead.
- A mutation that rolled the holy symbol on a *failed* Piety roll was not
  caught by the first draft of the check, because the card never showed it —
  the damage was to state, wearing the symbol down for nothing. The assertion
  now reads the sheet, not the text.


## 0.26.0 — Enchantments, Alchemy, and the end of Chapter 14

The last two Weave Magic subsystems, which finishes Ch.14 entirely. The book
calls alchemy "a simplified form of enchantment", and they share a reagent
economy, so they were built together and in that order — Alchemy is stated in
terms of Enchantments' Weave Reagents and could not have come first.

- **A real Item type for enchanted things.** `enchantment` covers all four
  shapes the book gives: a Use Die item, a charged item, a single-use vessel,
  and a potion measured in doses. One type rather than two because a potion is
  the single-use case with a different label, and everything else about them —
  the stored spell, its fixed resistance, the unstable flag — is identical. It
  has its own sheet, and the Magic tab lists what you are carrying and what is
  left in each.
- **TBE: Enchant.** Makes them. The Enchantment Costs table decides the Fraying
  by tier, plus one more point if the item is made usable by anyone rather than
  only by a Spellweaver or Fade; a failed roll ruins the vessel, and a
  *critical* failure ruins it **and** charges the Fraying anyway; any Weave
  Reaction during the casting leaves a flaw in the item's Pattern, which is
  what "unstable" means. The Bind roll becomes the item's permanent resistance.
- **Weave Reagents.** "For every point of Fraying the enchantment would
  normally cost, the caster may instead consume one Weave Reagent of the same
  Strand" — and because the book says that substitution "is declared before
  rolling the spell, not after", the reagents are checked and spent up front
  and a shortfall stops the attempt rather than quietly falling back to
  Fraying. Reagents are found with a half-day Arcana roll (one, plus one per 3
  SLs), recorded on the sheet, and topped up rather than piled up.
- **Alchemy.** Brewing takes eight hours (two full days with Tempered
  Patience), costs one reagent up to 15 TC and two from 16, allows Threads but
  **not** Resolve on the roll, and yields 1d3 doses plus one per 3 SLs on a
  Craft: Practical roll. The four Alchemical Aids stack, except the Master
  laboratory, which replaces a Refined one instead of adding to it. Alchemy
  accrues no Fraying at all.
- **TBE: Use Enchanted Item.** Spending them, which is where the unstable flaw
  finally bites, and it bites differently for each shape: a Use Die item goes
  inert for 1d6 days on a 1-2, or on a **1-4** if unstable, and stays inert
  across sessions; an unstable charged item burns 1d4 further charges on a d10
  of 1-2; an unstable batch of potions collapses and takes every remaining dose
  with it, including the one just drunk; and an unstable single-use item is
  checked **before** it is used, so it can unravel having done nothing at all.
  A weaver-only item also needs its Arcana roll, and a failure there spends
  nothing.
- **Data.** `parse_magic.py` extracts and self-verifies 18 Enchantment rules,
  the 5-row cost table plus its surcharge, 8 Weave Reagent rules, 17 Alchemy
  rules, the reagent-cost table (asserted to cover every TC with no gap), and
  the 4 Alchemical Aids. Each cost row is pinned by its label **and** its
  number in one quote, so two rows cannot swap Fraying costs while both still
  verify — and the two aids that share the text "+10 to the Bind roll" are
  pinned by their own description tails, which the checker caught before it
  was a bug. Mutation-tested.
- New `enchant_check.mjs` (69 checks), on the same harness as the last batch.

**Found while building it**

- The Enchantment Costs table gives each tier as "a Use Die **or** charges",
  and the book insists "an item cannot possess both". The first pass through
  this window let a player pick a tier but not which of the two it bought, and
  quietly made every enchantment a Use Die — with a note telling the player to
  go and fix it on the sheet afterwards. That is the "dead input" defect this
  project has a rule about: the choice is now explicit, and the unused half is
  left at its default instead of half-filled.


## 0.25.0 — Rituals, Summoning and True Names

The second Content-completion batch, and the largest single one this project
has shipped. Ch.14's shaping half has worked since v0.15.0 — Ritual-only
Targets and Durations were priced, flagged, and gated the Ritual-only Weave
Reaction tiers — but the procedures those flags pointed at existed nowhere.
Three of the chapter's six missing subsystems are now real, in the dependency
order the v0.24.0 survey found: True Names first, because both of the others
reference it.

- **True Names (p.312-313).** The actor already recorded a True Name; nothing
  ever used one. A Range of Arcane Tether in **TBE: Cast** now offers to target
  through a True Name, and enforces what that costs: it "must be spoken aloud
  in the language of that name", needing a **Language** roll or the spell
  automatically fails; a critical failure there hands the caster an immediate
  Weave Reaction at 1d20+10; every invocation rolls 1d10 and a 1 costs a
  Fraying point. The name is not consumed and does not count against the Arcane
  Tether limit, and speaking it always alerts its bearer. The language a name
  is in is now a real field beside the name, because it decides which skill
  someone else has to roll to use it against you.
- **TBE: Ritual (p.315-319).** New macro, and a persistent one: a ritual takes
  an hour per point of Total Cost, so it lives in the tracker store and
  survives between sessions. It runs the whole procedure — the casting hours
  and the Willpower concentration roll every eight of them (a failure adds a
  cumulative +3 to the Weave Reaction, a critical failure collapses the ritual
  and consumes the components), all four ritual-only ways to buy Mastery
  (components, assistants at half their Strand each up to a cap of half the
  caster's, grimoires, and Blood Magic), the **Ritual Casting Results Table**
  in full, the Fatigue and Fraying every participant takes, and the Weave
  Reaction at whichever modifier the outcome calls for. Resolve is offered
  nowhere in it, because the book forbids spending any on a ritual roll — but
  it refuses to start without the one available Resolve a ritual still needs.
- **Magic Circles, and rushing.** A circle's SLs take a point off the Total
  Cost per two, and the card prints the book's own sentence beside the number
  it applied, because the book measures that reduction in SLs while costs are
  in TC and never restates the exchange. Rushing halves the hours and adds +10
  to any Weave Reaction.
- **Blood Magic (p.316)** is implemented with its consequences attached: 1
  Mastery per lethal Wound Point up to 20, +20 to the casting roll if the
  victim is killed just before completion, and the marking — 5% per Wound
  Point, certain if the victim dies — rolled on the book's own d10 table for
  the caster and every assistant.
- **Grimoires** are Threads with a Grimoire flag: ritual castings only, up to
  three Binds or Strands in one book, a separate Thread Die per applicable
  skill, once per ritual, and a maximum roll gives its Mastery and then
  destroys the book. Ordinary castings no longer offer them.
- **Pacts (p.318).** A non-caster can buy a ritual's effect from a Patron for a
  Price, and the Price's d10 Timer Die is tracked between sessions: it starts
  at 1, and each interval either pays the Price or raises the total by one.
- **TBE: Summoning (p.319-321).** New macro. The summoning spell itself stays
  in TBE: Cast, which already prices its fixed shape; this owns the circle and
  what it holds. It runs the opposed Willpower roll that decides whether the
  thing arrives, the Arcana-versus-Willpower cage test that decides whether it
  stays, containment for as many days as the caster's Arcana Score, the decay
  and the hour-long renewal that resets it (with the creature, fully aware,
  rolling again), and control, banishment and release. A True Name takes 20 off
  the creature's Willpower throughout, and the card says so wherever it applies.
- **Data.** `parse_magic.py` now extracts and self-verifies the whole second
  half of the chapter: 23 ritual rules, the 5-row Ritual Casting Results table,
  the d10 Blood Magic marks, 9 Magic Circle rules, 12 Summoning rules, 9 True
  Name rules and the 17 example Pact Prices. Every number is asserted to appear
  inside its own quote, the Blood Magic marks are pinned by roll number *and*
  text so two rows cannot be swapped while both still "verify", and all of it
  was mutation-tested. The Weave Magic reference journal carries the new tables.
- **Ownership.** The opposed-roll tie-break cascade gained a third caller, and
  the Weave Reaction table's gating gained a second: `TBE.reactionFor()` moved
  into `_lib.js` when TBE: Ritual needed the same lookup TBE: Cast had inline.
- New `ritual_check.mjs` (85 checks) drives both new macros through a stubbed
  Foundry with a controllable die, checks the macros' constants against the
  verified data, and carries mutation guards on the rounding rules.

**Found while building it**

- The player-perspective walk-through, not any assertion, caught two cards
  reading badly: two book quotes stitched into one ungrammatical sentence on
  the ritual's opening card, and the summoning cage test applying the True Name
  penalty without saying it had. Both fixed before shipping.

## 0.24.0 — Chases, Investigations, and the first Content-completion batch

`ROADMAP.md` named the project's real gap as Phase 4, Content completion: ten
check scripts guard a system missing whole chapters. This is the first batch
against that gap — all of Ch.13 Intrigue's Investigations & Mysteries and
Chases, sized against the book first (a survey read every candidate chapter
before picking one) rather than guessed at.

- **TBE: Chase (Ch.13 p.269-270).** New macro. Quick Chases are one opposed
  roll — winner catches the loser. Prolonged Chases are a persistent tracker:
  pursuer and prey each race SLs toward a shared target, a critical failure
  halves (round up) only the side that rolled it, reaching the target ends it
  immediately, and both sides reaching it in the same round plays one more
  round to break the tie rather than ending it. An optional Timer Die rolled
  at the end of every round either drops a complication (rolled to whichever
  side it affects, then two Event Randomizer words) or cuts the chase short —
  which resolves by current totals, falling back to each side's own most
  recent roll on an exact tie, exactly as the book states it.
- **Investigations & Mysteries and the Suspicion Die (Ch.13 p.267-269)** are
  the same Extended Roll the system already had, not a second tracker: every
  3 SLs reads as a clue in the status line, and the book's Suspicion Die
  variant is now two general knobs on TBE: Extended Roll rather than
  investigation-only code — a Tolerance (delay the Timer Die until after a
  chosen interval) and an "Exposed / cover blown" Timer effect alongside the
  existing complication and premature-end options.
- **Ownership: the Opposed Roll tie-break cascade has one home now.**
  TBE: Chase's Quick Chase needed the exact tie-break TBE: Opposed Roll
  already implements — same rule, "make opposed Athletics rolls, the winner
  catches the loser" carries no tie-break of its own — so the cascade moved
  to `TBE.opposedResolve()` in `_lib.js` and both macros call it. Confirmed
  correct against p.20 in an earlier audit; this is its first second caller.
- New `intrigue_check.mjs` (51 checks) drives the real macro source through a
  stubbed Foundry with a controllable die, not a hand-modelled reimplementation
  of the rules: SL accumulation, the crit-fail halving, the simultaneous-target
  tie-break, the Timer Die at both settings, the Tolerance boundary exactly at
  the interval it's supposed to gate, and a mutation guard on `halveUp` and the
  Tolerance comparison.

**Found while scoping it**

- `ROADMAP.md`'s content matrix marked Talents `~ regex extractor, no
  self-check` in the Verified column. `parse_talents.py` already carries a
  full self-check (round-trip name matching, and specific mutation-tested
  assertions for the six ways the book phrases repeatability, the two 10-XP
  Talents, and the punctuation-bearing names a stricter header regex used to
  drop) — dated before the matrix was written. The matrix was wrong when it
  was filled in, not stale since; corrected below rather than re-verifying
  something already verified.
- `TBE: Extended Roll`'s Event Randomizer complication reads `TBE.drawTable`,
  which falls back to bundled table data if `TBE: Install Tables` hasn't been
  run in the world yet — but Extended Roll was never added to `build.js`'s
  `NEEDS_TABLES` set, so that fallback has no data to fall back to and would
  silently warn "no data for..." instead of drawing. TBE: Chase was added to
  that set correctly; Extended Roll's own gap predates this batch and is
  logged in `BACKLOG.md` rather than fixed here, since it's a different
  macro's bug, found, not caused, while wiring Chase's.

## 0.23.0 — The riders that outlive the roll, and a roadmap

First batch under the maturity-based roadmap now in `ROADMAP.md`: four rules
that exist on systems already built, all of the same shape — the book says
something persists past the moment it was rolled, and nothing carried it.

- **Weapon Readiness (Ch.9 p.129).** Weapons and shields had two states where
  the book has three. Held and Ready is in your hand and costs no action; At
  Hand is a Minor Action to draw; Stored is in Inventory and takes two full
  actions to retrieve. The ENC split was already right — Held and Ready and At
  Hand share the 6 ENC Weapons At Hand pool, Stored counts against Inventory —
  but nothing anywhere said what it costs to get a weapon into your hand, so a
  stored greatsword and a drawn one were equally available. TBE: Attack now
  shows each weapon's state in the picker and names the cost on the card.
- **Weave Scar (Ch.14 p.302) is applied.** Two rows of the Weave Reaction table
  scar the caster: row 14 is -20 to the Bind until the next sunrise or sunset,
  row 24 is -1d6+2 to it permanently. Both were printed as prose and forgotten.
  The permanent one is written into the Bind skill, because that is what
  permanent means. The temporary one is recorded against that Bind and comes
  off the value the casting rolls against — `TBE.binds()` reports the true
  value, the scar and the effective value separately, so Advancement still
  improves the real skill while Cast rolls the scarred one.
- **Reality Snag (Ch.14 p.303) is applied.** Until the next sunrise or sunset a
  snagged caster is at +5 on the Weave Reaction roll (still mitigable), and
  every further spell attempt buckles reality: TBE: Cast rolls that d6 and
  applies what it lands on, including the Fatigue, which now goes through the
  overflow rule added in 0.22.0 and can open a Weave wound.
- **Both end where the book says they end.** A night's rest in TBE: Wounds &
  Recovery crosses a sunrise or a sunset and clears them; TBE: Status shows
  them meanwhile, so they are visible before they bite rather than after.
- **TBE: Counterspell — Hold to Interrupt (Ch.14 p.311).** New macro. An
  opposed Bind roll with the three things the book is specific about and a
  table gets wrong by hand: the countering Bind must be Destroy or the incoming
  spell's own Bind (flagged, not blocked, since the GM may know it by another
  name); the Resolve cost is the *original* caster's SLs minus the counterer's
  Strand in that spell, unaffected by the counterer's own DoS, and spent
  whether it works or not; and a counter that lands but cannot be paid for
  marks all remaining Resolve and fails anyway. Countering is all-or-nothing —
  no partial reduction — and a critical failure hands the counterer their own
  Weave Reaction.

**Found while building it**

- `TBE.strands()` reports a Strand's rating as `level` while `TBE.binds()` next
  to it reports `value`. The new Strand picker read the wrong one, which would
  have shipped a dropdown saying "Fire undefined" and discounted nothing. Fixed
  before it shipped and now asserted, because the two helpers being one word
  apart is a trap that will be walked into again.

**Roadmap**

- `ROADMAP.md` records Seb's maturity-based phase model (Foundation → MVP → QoL
  → Rule consolidation → Content → Play experience → Hardening → Release), each
  with a definition of done that is a state of the system rather than a list of
  shipped items, and feedback running backwards rather than as a waterfall. It
  maps the project's real position onto those phases, including the honest
  finding that the project is far ahead on Hardening and behind on Content, and
  carries a filled-in content matrix plus three amendments specific to this
  codebase: what "one owner" can mean when macros cannot import, why Verified
  has to be a separate column from Tested, and why consolidation is a gate on
  each QoL item here rather than a phase after them.

**Verification**

- New `tier3_check.mjs`: 46 checks with a mutation block.
- 51/51, 87/87, tier0 42/42, tier2 54/54, funnel 47/47, and
  cast/finish/wizard/enforcement all green.

## 0.22.0 — MVP Tier 2: the travel and bestiary gaps, and the last of the duplicate logic

The backlog's "real backlog, not urgent" tier, in one batch. Three of these
turned out to be bigger than their one-line summaries.

**The NPC Traits table was two-fifths of a table**

- **29 of the book's 50 Traits rows never shipped.** The extractor had mis-read
  the column boundaries on those rows — the Personality column held a fragment
  of the Aspect ("tapping", "groomer", "stare") and the Agenda had swallowed the
  real Personality word ("Steadfast Spy on a rival") — and `build.js` carried a
  filter that dropped any row failing a shape test. So the damage was invisible:
  TBE: NPC drew from 21 rows while saying it rolled the d100 table, and the
  coverage had holes in it. New `parse_npc_traits.py` extracts all 50 and
  verifies them: d100 1-100 exactly once, every field verbatim in the book, and
  each row pinned from *both* ends (the Personality column and the Agenda's
  first verb are transcribed separately, so a column that slides one word breaks
  one of the two). Six mutations were tried against it and all six fail the
  build. The filter is gone; a bad row now stops the build instead of vanishing.
- The table is **rolled** now, not sampled, so the "even roll = positive
  reaction, odd = negative" instruction the card has always printed finally has
  a roll to read.

**Enemies were built to invented numbers**

- **Ferocity is set.** Ch.18 gives every Difficulty a Typical Ferocity (1 to 6)
  and Ferocity is what decides whether an enemy flees or surrenders — it is also
  what puts a foe out of reach of Compel Surrender at 5+. The creature sheet has
  always had the field and nothing ever filled it in.
- **The skill bands are the book's.** p.436: one or two skills at the Average
  for their Difficulty, three or four at -10, everything else at -30, with a
  floor of 35 for any enemy at any Difficulty. This macro used -15 for the
  second band, a floor of 20, and put Dodge at 90% of the primary — so every
  generated enemy was weaker than the book's own worked example of the same
  Difficulty. Dodge now sits at the Average, as the Challenging bandit on p.436
  does.
- Difficulty can be rolled on its own d100 table instead of picked.

**Fatigue turns into wounds, in both places that needed it**

- Ch.11 p.189's fatigue-based wounds are implemented: lethal, counting toward
  the Death Threshold and Infection checks, never infected themselves, no Wound
  Die, one instance per type, increasing by 1 whenever Fatigue cannot be marked,
  and removable only by rest — one wound point per Fatigue removed. Two macros
  needed this and neither had it: **TBE: Journey Leg never rolled for Fatigue at
  all**, and **TBE: Cast added Fatigue with a bare `+=` and then quoted the
  overflow rule at the player as a line of prose**. `TBE.addFatigue()` /
  `TBE.removeFatigue()` own the rule, so a Weary wound from the road and a Weave
  wound from a mis-cast spell behave identically.

**Journey Leg**

- **The Fatigue Table is rolled.** The macro tallied a modifier, printed it as a
  note, and never rolled anything or moved a point of Fatigue. All six bands,
  d10 for a Journey, with the full Fatigue Modifiers Table: terrain, season,
  obstacles, Travel Lore, road, mount, boat, settlement, solo travel, forced
  march, depleted rations, and the Guide's and Quartermaster's own rolls.
- **The rations rule was the wrong way round.** It rolled the Rations Supply
  Die every leg, which is the HexMarch rule; on a Journey the Quartermaster
  abstracts rationing, and what rations buy you is -1 Fatigue for one step of
  the die, no roll (p.207).
- A critically failed Track roll is -3 on the table, not the -1 a plain failure
  gives; both were -1.
- **The arrival Infection check has been running at Toughness 0 for every
  character.** It read `flags.tbe.toughness`, which the native system never
  writes — the field is `system.toughness`. Found by reading the macro's own
  output during the walk-through, not by a test.

**Extended Roll: the Timer Die (p.24)**

- A d6-to-d20 timer, rolled after each interval, firing when it comes up equal
  to or under the number of intervals passed. Whether it means a complication or
  a premature end is chosen at setup, because the book says the GM decides
  before any skills are rolled. A complication draws twice on the Event
  Randomizers, as p.24 prescribes; SLs already banked are not taken away, and a
  success in the same interval still stands.

**Ownership**

- `TBE.strandCap()` defers to `CONFIG.TBE.strandCap()` instead of being a second
  implementation of the Fade's ceiling.
- The claim that TBE: Status Effects held a third copy of the status table,
  missing a flag, was checked against the live tree and is **false** — it reads
  the shared `TBE.STATUSES`. Two copies exist (the macro pack's and the
  system's) and `tier2_check.mjs` now asserts they are identical id for id, so
  they cannot drift apart quietly.
- Lock's size limit, Compel Surrender's direction, and the armor Initiative
  penalty were the other three; they shipped in 0.21.0.

**Verification**

- New `tier2_check.mjs`: 54 checks with a mutation block.
- New `parse_npc_traits.py`, self-verifying, six mutations tried against it.
- 51/51, 87/87, tier0 42/42, funnel 47/47, and cast/finish/wizard/enforcement
  all green.

## 0.21.0 — MVP Tier 0: the five places the module claimed something it did not do

Seb's MVP bar is an honesty bar, not a completeness one: "this isn't built yet"
is fine, "this looks built but silently isn't" is not. All five Tier 0 items,
in one batch.

- **Initiative now drives the combat tracker.** The sheet's Initiative stat had
  no effect on turn order whatsoever: nothing read it. The tracker rolls
  `1d10 + Initiative` (p.161), enemies use their static value without rolling,
  and ties go to the PC. Worn armor's penalty is part of the same rule (Bulk/3
  rounded up, p.141), so it is now derived once on the actor — the sheet, the
  tracker, TBE: Cast and TBE: Finish Character had three separate copies of
  that arithmetic and now read one. An Initiative driven below 0 is not
  clamped, because p.161 says the character acts on the negative value.
- **Haggle settles the price.** The whole point of the macro produced a number
  and threw it away. It now moves the coin on the character's sheet, and
  refuses a purchase the purse cannot cover instead of letting `system.silver`'s
  `min: 0` silently zero the character's money while reporting the deal as done.
- **Repeatable stat-Talents stack.** Buying a second Tough or a fifth Combat
  Awareness charged the XP and bumped a rank counter, but nothing ever
  multiplied the ActiveEffect: 25 XP of Combat Awareness carried a counter
  reading 5 and an Initiative bonus still stuck at +1. The effect now scales
  with ranks. The same pass added the cap the book states ("Can be purchased up
  to three times", "up to five times", Armor Training I-IV): a purchase at the
  cap is refused before its cost is totalled, rather than bumping the counter
  past the rules. `CONFIG.TBE.rankCap()` owns those numbers, and both the
  system (which pays the effect out) and TBE: Talents (which gates the
  purchase) read it.
- **Maneuver riders stop implying automation.** Unbalance, Lock, Disarm,
  Disadvantaged and Restrained painted a token icon and did nothing else. There
  is no cross-roll modifier engine here and building one touches every macro,
  so instead: the result card now states what each rider costs and who applies
  it, in the book's own terms, and every roll dialog that already showed
  encumbrance now also shows what is riding on that actor, with the number,
  labelled as not applied for you. Two real rule errors surfaced while reading
  the maneuvers properly:
  - **Compel Surrender was backwards.** It painted a "Disadvantaged" status as
    though the maneuver inflicted it. p.164 requires the foe to *already* be
    disadvantaged, and what the maneuver actually calls for is a Willpower roll
    at -10 per 3 DoS. The card now asks for that roll, at the right penalty for
    the DoS earned.
  - **Lock's size limit was never enforced.** p.163: "Targets more than two
    Sizes larger than the attacker cannot be Locked" — the same threshold that
    blocks Drive Back, Trip and Disarm, written on a different page, so it was
    missed. It now lives with the other three in `TBE.sizeEffects()`.
- **Build Character no longer sits in the Solo Panel beside the Wizard.** It
  covers Ch.7 steps 1-2 and 7 only — no Ability Scores, Cultural Background,
  Life Events, Rounding Out, equipment, Personality Traits, Goals or Status —
  so picking it off that menu was a character-breaking mistake with nothing to
  warn you. It is still in the compendium for anyone who wants the quick path,
  and it now says what it skips before it builds anything rather than in the
  notes afterwards.

**Verification**

- New `tier0_check.mjs`: 42 checks over all five, including the armor-penalty
  arithmetic, the rank scaling and its cap, the purchase gate, the refusal to
  overdraw a purse, the rider text, and Lock's size rule — plus a mutation
  block that breaks each one and asserts it fails.
- 51/51, 87/87, funnel 47/47, and all cast/finish/wizard/enforcement checks
  green.

## 0.20.0 — The funnel: TBE: Funnel, TBE: Funnel Roster, and one owner for the skill catalogue

Two new macros for starting a campaign with the sack of a settlement, and the
shared-ownership work that had to happen first — generating a person touches
the skill catalogue, the Expertise ladder, the Ability Score rule and the
Talent Item shape, and each of those existed in more than one place.

**New**

- **TBE: Funnel** rolls a town's worth of ordinary people, four to a player.
  Each is built the way the book builds a person, not the way Ch.18 builds an
  enemy: every skill at the starting 20 (p.79-80), their trade raising the two
  or three skills that trade actually uses, and the two Ability Scores of
  p.85-86 rolled and applied for real (+5 to each listed skill, +1 Expertise
  to one, one of the three Talents, one descriptor). DT 20, Resolve 10, no
  armour. Each carries a kit, a piece of local knowledge, the thing they would
  run back into a burning town for, and a Bond pointing at somebody in another
  player's roster. Actors are tagged with `flags.tbe.funnel` so the roster can
  find them.
- **TBE: Funnel Roster** shows the town by player and by status, records a
  death, a flight or a Scar during the sack, and converts a survivor into a
  real character actor — carrying over their skills, Talents and descriptors,
  adding the skill the night taught them and the Goal that came out of it. It
  builds a new `character` actor rather than mutating the creature's type,
  since the two DataModels are not the same shape and the funnel actor is
  worth keeping as the record of who they were before.
- **data/funnel.json** — 50 trades on d100, 20 Bonds, 10 Scars. Original
  content, labelled as such and treated like `data/concepts.json`: the book
  never stats a tanner. Every skill it names is a real catalogue skill, which
  `funnel_check.mjs` enforces.

**TBE: NPC**

- **Every skill it created was filed under "Adventuring".** Dodge is a Combat
  skill and Insight is a Social one, so a generated NPC's skills sat in the
  wrong categories and never appeared in a group-filtered picker. Categories
  now come from the catalogue, and the `fighting` flag is derived from the
  category instead of passed by hand.
- **It created a skill called "Weapon", which does not exist in this game.**
  Ch.18 fighters now carry a real Combat skill (Melee: Medium), which is also
  what their weapon Item points at.
- It rolls a trade and the two Ability Scores now, so an NPC arrives with
  actual numbers, a kit, something they know about the town, a Talent and a
  descriptor rather than five generic skills at 35. Fighters keep the Ch.18
  tier line — the tier owns their numbers, the trade only their identity.
- Two draws from the NPC Traits table no longer print "Determined,
  determined".

**One owner for what generation touches** (see `docs/ownership.md`)

- The skill catalogue and its four categories existed as three identical
  private copies (Build Character, Character Wizard, Finish Character) with
  TBE: NPC guessing a fourth. Now `TBE.SKILL_GROUPS` in `_lib.js`, verified
  against Ch.3 p.30-32 by `funnel_check.mjs` — each of the 37 names must be
  defined in its own `<Category> Skills` section of the book and in no other.
- The Expertise ladder (0 → 2 → 3 → 4, p.53), the Ability Score application,
  and the 1d6-twice roll including its reading of a duplicate result are now
  `TBE.raiseExpertise()`, `TBE.applyAbilityScore()` and `TBE.rollAbilityPair()`.
  The duplicate-roll rule matters: the book does not state one, so a second
  generator would have invented a different one.
- The Talent → Item shape, including the `transfer:true` ActiveEffects that
  make a stat Talent actually move its number, was written out identically in
  two places and about to be written in two more. Now `TBE.talentItem()`.
- `TBE.talentNamed()` matches the catalogue case-insensitively. `chargen.json`
  writes "Quick and Quiet" and "Press the Point" where `talents.json` has
  "Quick And Quiet" and "Press The Point", so an exact match drops two real
  Talents on the floor.

**Where the book says "choose", the generator chooses like a person**

- The Expertise from an Ability Score goes to a skill the character's trade
  actually uses, and never to a weapon skill for someone whose work is not
  fighting. A tax clerk with Ex2 in Melee: Medium is a roll, not a character.
- The Talent is picked from the three the score offers by matching the
  category of the person's work, and failing that by keeping combat Talents
  off non-combatants. No miller chooses Sweeping Attack.
- A roster does not hand out the same trade twice while forty-nine others go
  spare, and a household Bond ("Sister", "Father") looks inside the culture
  before crossing it.

**Verification**

- New `funnel_check.mjs`: 47 checks over the catalogue-vs-book, single
  ownership, the rules themselves, and the funnel tables — including a
  mutation block that breaks each data check and asserts it fails.
- `enforcement_check.mjs` was asserting Godbound creates exactly one Item,
  which had gone stale when v0.19.0 made it also grant Piety. It now checks
  the rule (Piety arrives at 30, p.51) instead of the tally — the count-only
  form would have passed while Piety was missing, which is why it never
  caught the original gap.
- `simtest.js` and `wizard_visual_check.mjs` read the catalogue and the Talent
  Item shape from their new owner. 51/51, 87/87, and all cast/finish/wizard
  checks green.

## 0.19.0 — Tier 1 batch: dice/data corrections across six macros

Six cheap, one-table/one-formula fixes from BACKLOG.md's Tier 1, shipped
together per the new "batch by tier" cadence.

- **Skill Roll: the difficulty dropdown no longer offers a fabricated
  "Trivial +40" tier, and "Severe" now reads -30, not -40.** p.24's real
  Difficulty Modifier table runs Simple +20 / Easy +10 / Medium +0 /
  Challenging -10 / Hard -20 / Severe -30, with no Trivial tier at all.
- **Weapon Of Faith's prerequisite check no longer blocks the exact
  character it's meant to allow.** `TBE.talentEligibility`'s
  `missingPrereq` was substring-matching a negated requirement string
  raw; a new `stripNegation` helper parses it correctly and is now used
  by both the eligibility check and the Talents macro's soft-requirement
  display.
- **Buying Godbound through Advancement now grants the Piety skill it's
  supposed to.** Post-creation Talent purchases previously had no path
  to grant it; Piety now starts at 30 and is capped at 90, per p.51.
- **Opposed Roll now lets the defending side apply Expertise.** Side B
  had no skill picker to read a tier from, so it always resolved at
  Expertise 0. Both sides now get a manual Expertise dropdown (None/
  Ex2/Ex3/Ex4) alongside their existing/new modifier fields.
- **The encumbrance overflow penalty is now actually prefilled into every
  roll modifier that promises it.** New `TBE.encMod(actor)` in `_lib.js`
  is the single owner of that value; Skill Roll, Opposed Roll (Side A),
  Haggle (PC side), and Extended Roll (which gained a Modifier field
  that didn't exist before) all read from it now instead of hardcoding
  0.
- **Social Encounter hides the Tolerance value from players by default.**
  v0.18.0 added an opt-in "hide it" checkbox but shipped it unchecked;
  p.251 treats Tolerance as secret from players, so the default is now
  checked.
- Test-fidelity fix found while verifying this batch: `simtest.js`'s
  Social Encounter Victory Condition test always rolled the same skill
  name across retries, which the same-skill/failed-retry gate (added
  earlier for Competitive trackers) could auto-fail into a false
  negative. The test now alternates between two skill names, matching
  how a real defender would actually vary their approach. Not a
  game-logic change.

## 0.18.0 — Flow-audit pass: Attack, Wounds & Recovery, Cast, Social Encounter, Advancement

An independent flow-audit read-through of the five macros not recently
audited (see HANDOFF.md's suggested next pass) found fifteen real defects,
all confirmed against `/tmp/tbe.txt` and fixed here.

- **Cast: Thread checkboxes and pool-amount inputs no longer get wiped by
  their own change handler.** The generic re-render listener was bound to
  every checkbox/number input in the DOM, not scoped to `[data-shape]`
  fields; ticking a Thread (`data-thread`) or setting a consumable pool
  amount (`data-thread-amt`) triggered a no-op `read()` and a full
  re-render from stale state, clearing the tick before "Use the ticked
  Threads" could be clicked. Same shape of bug as the Finish Character
  Talent checkbox fix in 0.17.0. Listeners are now scoped to `[data-shape]`
  only.
- **Wounds & Recovery: "Rest area" now actually changes Resolve and
  Fatigue.** The area choice only ever changed the chat card's sentence;
  nothing wrote `system.resolve.value` or `system.fatigue`. Now applies
  both, correctly capped per the p.182 Resolve & Fatigue Recovery table
  (Safe/Neutral/Precarious/Dangerous carry different Resolve and Fatigue
  caps, not the same number for both).
- **Attack: running out of ammo is reported instead of skipped.** The
  ammo-report branch only ran while ammo was still above 0, so the one
  message meant to say "you're out" never fired once it hit 0 — ranged
  attacks then proceeded as if ammo were unlimited. `TBE.rollSupply`
  already handles a depleted stock gracefully; the guard just needed
  removing.
- **Advancement: a maxed-out Fade Bind no longer spends XP for nothing.**
  `spend(1)` used to run before the "already at 70" check, so a Fade lost
  the XP even when the improve roll could never move the Bind. Checked
  before `spend()` now, matching how the Strand-cap check already worked.
  The Bind picker also now shows distance to the p.162 cap the way the
  Strand picker already shows its own ceiling.
- **Wounds & Attack now report Dying, not just the Death Threshold.** Both
  macros only ever printed "X / max before the Death Threshold" — correct
  for that harder, instant-death trigger, but Dying (Shock while lethal WP
  exceeds the Lethality Level, p.174) was never checked or shown anywhere,
  even though `base-actor.mjs` already derives it correctly. New shared
  `TBE.deathThresholdNote()` reports both from one place now.
- **Cast: a caster can no longer cancel a Weave Reaction they didn't fully
  pay for.** The Reaction-mitigation reduction was taken from the typed
  Resolve amount at face value, clamped only against the Reaction Modifier
  itself, never against what Resolve the caster actually had — so 0
  Resolve could still zero out the Reaction while the card said "only 0
  Resolve was available." New shared `_mitigationClamp()` derives the
  applied reduction from what's actually funded (Enduring Caster's free
  share plus affordable Resolve) and is used by both the live preview and
  the real spend, so they can't disagree.
- **Social Encounter: the skill picker no longer silently drops Expertise
  or Savvy.** It built its own 2-field picker instead of the shared
  `TBE.skillOptions()`, so every roll made through it resolved at
  Expertise 0 regardless of the actor's real tier. Swapped in the shared
  helper, matching Haggle and Skill Roll.
- **Attack: weapon and defence pickers now show Expertise**, matching what
  `TBE.resolve()` actually rolls against, instead of hiding which choice
  carries a guaranteed-SL floor.
- **Attack: the struck-location dropdown no longer looks live when it
  isn't.** It was always enabled but silently discarded unless "Choose
  Location" was separately ticked and affordable. `TBE.prompt` has no live
  re-render (same constraint as Social Encounter), so the fix is
  structural: the dropdown now sits inline under the Choose Location row
  itself with restated wording, instead of floating below the whole
  maneuver list as its own field.
- **Social Encounter: side selection is a labeled dropdown, not blind
  numeric guessing.** The `compSideOpts` helper that renders sides by name
  existed and was never wired in; the live form used bare `<input
  type="number">` fields. Both the rolling-side and detract-target fields
  now use it.
- **Social Encounter now keeps a real log.** Both tracker kinds declared a
  `log: []` that nothing ever wrote to or read — the only record of an
  attempt was one chat card that scrolls past. Every roll now appends a
  short entry, and the last couple are shown in the status display.
- **Social Encounter's round/turn counters are no longer frozen.**
  `turnIndex`/`round` were set once at tracker creation and never touched
  again. Repurposed as an informational "whose turn is next" display,
  updated after every Competitive roll (p.253's turn-alternation rule has
  no book-specified penalty, so this stays informational rather than a
  hard gate — a rules-enforcement gap beyond what the audit flagged).
- **Social Encounter: the "Roll 2d10 (hidden result)" Tolerance roll is now
  actually hidden.** It was pushed into the same `rolls` array that
  reaches the public chat card, so "hidden" was never true. No longer
  added to that array. A new opt-in "Hide the Tolerance number" checkbox
  (default unchecked, preserving prior behavior) also stops the running
  Tolerance value itself from being printed to players, per p.251.
- **Social Encounter: the same-skill/failed-retry gate (p.255) now applies
  to Competitive, not just Static.** The rule sits after both sections in
  the book and reads as general to "this target." Tracked at the tracker
  level, matching how the Static branch already tracked it.
- **Attack's two location-to-status-id maps are one map now.** One copy
  lived in `_lib.js` (schema-keyed, used by `TBE.syncStatuses`), a second
  hand-typed copy lived in `tbe-attack.js` keyed by display label. The
  second is now derived from the first (`TBE.IMP_STATUS_ID`).
- **Advancement's Bind/Strand purchase costs read from the data table.**
  `newskill`/`newstrand` re-typed `5`/`3`/`10` as fresh literals next to
  `MAGIC.rules.newBindXp`/`newStrandTalentXp`/`newThinStrandTalentXp`,
  which already had the real numbers. Now read from the table.
- **Advancement and Wounds & Recovery form fields are labeled with which
  action(s) actually use them.** Both macros render their whole
  ten-plus-field forms at once regardless of the selected action (the same
  one-shot-dialog constraint as above rules out true show/hide); fields
  that a given action ignores now say so next to the label instead of
  silently doing nothing when filled in.
- **`item-skill.mjs`'s Expertise-cap comment corrected.** The code was
  already right (p.53's table: below 40 no Expertise, 40-59 → Ex2, 60-79 →
  Ex3, 80+ → Ex4, no Ex1 tier); the comment described a nonexistent Ex1
  rung. Comment only, no behavior change.

## 0.17.0 — Chargen/Finish Character: four fixes off direct player feedback

- **Finish Character now actually opens after the Wizard.** The handoff
  looked itself up with `game.macros.getName("TBE: Finish Character")`,
  which only searches the world macro directory — empty until someone
  drags the whole compendium folder into it, a step nothing in this system
  ever performed. On a fresh install (or a table that only hotbar-dragged
  the Wizard itself) that lookup silently returned nothing and fell back to
  an easy-to-miss toast right as the wizard's window closed. New shared
  `TBE.runMacro()` (`_lib.js`) checks the compendium directly as a
  fallback, so the handoff fires regardless of what's been imported.
  `TBE: Advancement`'s hand-off to `TBE: Talents`, and `TBE: Solo Panel`,
  now go through the same helper for the same reason.
- **A real Talent-eligibility bug, not just a UI one, in how Career Talents
  get auto-granted at chargen.** The Wizard used to scan the whole Talent
  catalogue for any name that appeared anywhere inside a career's raw grant
  text, which silently auto-granted BOTH sides of an "either X or Y"
  choice: Godbound got "Literate" for free though the book offers Literate
  *or* a Lore Talent as a pick, and the same bug doubled up Loremaster
  (Lecturer + Travel Planner) and Merchant (Barterer + I See Your Mind).
  `chargen.py`'s new `CAREER_TALENT_PICKS` (hand-transcribed from the same
  already-verified career text, self-checked against it) is now the single
  source for what's automatic vs. a free player pick, for all 10 careers —
  Ranger genuinely has two independent picks, both now surfaced correctly.
- **Talent checkboxes on Finish Character's Talents tab were reverting the
  instant you ticked them.** Every checkbox on that tab, including the
  per-Talent ones, was wired to the same generic "re-render on change"
  listener as the category/type selects. The tab rebuilds its HTML from
  scratch on every render and never printed a `checked` attribute for any
  Talent box, so ticking one triggered an immediate re-render that reset it
  to unchecked — indistinguishable from the box not responding at all.
  Fixed by tracking ticked indices in instance state and excluding
  `[data-talent]` from the generic re-render sweep.
- **"How many Talents do I get to pick" is now an actual number**, shown at
  the top of both the Wizard's Talents step and Finish Character's Talents
  tab, sourced from the same `CAREER_TALENT_PICKS` data plus the Human
  racial bonus / Rounding Out bonus pick when applicable, instead of a raw
  unparsed sentence buried in small print.
- **`TBE: Talents` is re-scoped to advancement (spending XP on a new Talent
  mid-game)**; `TBE: Finish Character`'s own Talents tab is now clearly the
  place for the free chargen/career picks, XP-off by default. Both call the
  same new `TBE.talentEligibility()` in `_lib.js` for race exclusivity,
  prerequisites, creation-only and already-taken checks — previously
  hand-copied separately in each file, so one errata fix could drift
  between them.
- **A new Summary tab on `TBE: Finish Character`** (opens there by default
  for the five minutes right after the Wizard finishes) shows race, career,
  cultural background, concept, personality, derived stats, Talents
  granted, and starting silver, with the full skill-point math (racial /
  Ability Score / Cultural Background / Rounding Out bonuses applied)
  behind a collapsible details section — none of that breakdown existed
  anywhere but a single chat card before, gone the moment you scrolled
  past it. `commit()` now stashes it as `flags.the-broken-empires.
  chargenLedger` unconditionally (not gated by the "Seed the Notes tab"
  checkbox, a separate feature) so it survives. The end-of-wizard chat card
  itself is trimmed to a short headline pointing at this tab, rather than
  the previous wall of every applied modifier in one long list.

## 0.16.1 — Journey Leg: days-elapsed, forced-march fix

Found while answering a question about how hex/distance tracking actually
works: `TBE: Journey Leg` asked for "Mounted or on foot" every time but
never once read the answer back — no days-elapsed figure was ever shown,
just a raw hex count. Separately, a forced march was adding +1 straight to
the Guide's hex total, which doesn't match the book: p.203's own worked
example rolls the identical 7 hexes with and without a forced march, and
only the day-count changes (3.5 days at the base rate, "just over two days"
once the rate itself gets +1). Both are now fixed and verified against that
worked example exactly (3.5 / 2.33 days, matching "three-and-a-half" and
"just over two" to the letter):
- `rate = (mounted ? 3 : 2) + (forced march ? 1 : 0)` hexes/day (p.198,
  p.203), forced march no longer touches the hex total, only the rate and
  the existing -5 Fatigue penalty.
- The card now reports `days = hexes / rate` alongside the hex/mile count.

## 0.16.0 — Rules Audit journal

Player-facing transparency, not developer-facing: a new **TBE: Rules Audit**
journal entry (alongside the existing Quick Reference, Status & Peril
Reference, and Weave Magic Reference) that lets a player check the macros'
math against their own copy of the book without taking any of it on faith.

- New `parse_core_rules.py` extracts and self-verifies the core d100
  resolution mechanic (roll-under, Success Levels, critical success/failure,
  the 01-05/99-00 auto-succeed/fail edges, skills of 100+), Death
  Threshold/Lethality Level, and the Combat & Wounds chapter's Wound
  marking/Armor Points/Wound Die/Impairment/Shock/Pierce Armor rules — 20
  rules, each carrying the verbatim book quote it's implementing, checked
  against `/tmp/tbe.txt` the same way `parse_magic.py` checks Ch.14.
- **Page numbers are derived, not hand-typed.** The rulebook extract turns
  out to carry the book's own printed page numbers as standalone digit lines
  at each page break (a side effect of the PDF-to-text conversion). Rather
  than trust a hand-typed "p.163" next to a rule the way the macro source
  comments already did in a few places, `page_of()` derives the citation
  from the quote's own position in the source text — the same "derive it,
  don't trust a number sitting beside the data" principle as
  `check_range()`. A validator rejects the whole page-numbering scheme if
  fewer than 400 markers come out looking sequential, so a change to the
  source dump that broke this silently would fail the build instead of
  shipping wrong page numbers.
- `build_rules_audit.py` (same generated-not-written pattern as
  `build_magic_journal.py`) turns `data/core_rules.json` into
  `rules_audit.html`: for each rule, what the macro computes in plain
  language, which macro(s) use it, the chapter and page, and the exact
  sentence quoted. Wired into `build.js`'s `JOURNALS` array and baked into
  the `tbe-journals` pack like the other reference pages.
- Explicitly scoped: this pass covers the mechanics every session touches
  (Skill Roll, Attack, Wounds) plus Weave Magic (already fully covered by
  its own reference page). Character-creation point costs and Equipment
  silver-piece costs are NOT included yet — they currently have a lighter
  verification pass than this standard requires (see BACKLOG.md) and this
  page says so rather than implying more rigor than actually backs it.

## 0.15.0 — Weave Magic

The largest remaining hole in the system closed. Before this release a
Spellweaver could not be built: character creation handed you a skill called
"Bind: name it 1" at 0 and another called "Strand, name it", and nothing in
the system could ever act on either. Ch.14 is now data, chargen, sheet,
advancement and a casting calculator.

### The data
- `parse_magic.py` extracts and **self-verifies** the whole chapter: the 5
  Binds, 10 Strands and 12 Convocations, the complete Shaping Cost tables
  (Magnitude / Target / Range / Duration and every per-target surcharge), all
  16 Spell Effect Cost tables, the Weave Reaction Table with its prose
  results, the Fraying rules and symptom thresholds. 122 rows are quoted
  verbatim from the book, and **each row's cost is asserted by its own
  quote** — a mistyped TC fails the build rather than shipping.
- The Weave Reaction Table's three highest tiers are gated the way the book
  gates them (Void Incursion is Vulgar-only, Fraygeist / Pattern Collapse /
  The Grey Wailing are Ritual-only). The macro pack's old copy applied all
  three unconditionally, so a Discreet cantrip could tear open the Void.
- New generated artefacts: `magic-data.mjs` for the system, and a
  **TBE: Weave Magic Reference** journal with every table in it.

### Character creation
- **A new Magic step**, shown only to a Spellweaver or a Fade. Roll or pick
  one of the twelve Convocations and it fills in your 2 Binds, 4 Strands and
  2 Thin Strands; spend the 100 Magic points across the five Binds and the
  10 + 3 Strand levels, with every value updating live against the creation
  caps of 70 and 5. The Bind Expertise level and the d8 Thread Die the
  Spellweaver career grants are real picks, not prose.
- **Faded Pattern** is declared on the Career step, where it belongs: it
  costs two of that career's Talent selections. A Fade gets its 5 free Strand
  levels and the ceilings the Talent imposes, stated on screen.
- **Rounding Out** can finally spend its bonus points on Bind skills and
  Strand levels (5 points per level), which is the only place p.108 allows
  it, out of the same 100-point budget as everything else.
- The five Binds are created as themselves at 0 rather than as numbered
  placeholders; Strands are created as real Strand Items at their level.
- Ogres and The Replaced are **barred from magic entirely**, as Ch.5 says.
  The Magic step does not appear for them and the Career step says why.
- Life Events that grant a Strand now grant the book's **+2**, not a level of
  1: `parse_life_events.py` was dropping the amount entirely.

### The sheet
- A **Magic tab**: Pattern, Convocation and True Name; all five Binds with
  what it would cost to open the ones you lack; every Strand with its level
  and what the next level costs in XP and in Fraying; your Threads and what
  each still has to give; and Fraying with the **live purge percentage**, the
  symptom tiers already in effect, and the reminder that it never goes down.
- New Item types: **Strand** (a level track, not a percentile skill) and
  **Thread** (a Thread Die, a consumable pool, or a location-based bonus).
- New actor fields: `pattern`, `convocation`, `trueName`, and `fraying`.

### Advancement
- **Raise a Strand** at the book's cost: XP equal to each new level,
  sequentially, so 3 → 5 charges 4 then 5. A Fade stops at 7; a Spellweaver
  may pass 10 at 1 Fraying per point, and every Fraying point gained makes
  the **Fraying Roll** — 1d100 against (Fraying − Max Resolve) × 2 — right
  there, including the Final Act if it comes up.
- **Learn a new Strand** through the Strand Secret Talent (5 XP, 10 for a
  Thin Strand), which is recorded as a real Talent.
- **Record Fraying** from a ritual or a Weave Reaction, with the roll made
  for you.
- XP for goals is now paid **per goal completed** off the character's own
  Goals list, and each goal is marked paid so it cannot be claimed twice.

### Casting
- **TBE: Cast is now a calculator.** Shape the spell and watch the Total Cost
  build from the book's own tables, with your Mastery range and the exact
  odds of controlling it on screen before you roll. It reads your worn
  armor's Initiative penalty and prices it without being asked, applies the
  Law of Limitation (a requisite uses the *lower* Strand), and states the
  casting time the Duration implies.
- After the roll it offers what the book offers at that moment and no
  earlier: your attuned **Threads** (one Bind, one Strand, rolled only on a
  success, stepping the die down on a 1 or 2 and crumbling a d6), and
  **mitigation** with Resolve, decided before you know whether the target
  resists.
- The Weave Reaction is rolled and *applied*: Fraying, Fatigue, Supply,
  Restrained/Immobilized and the hazard type all land on the sheet, with the
  book's prose for what the named result means.

### Rules that were prose and are now enforced
- An **Ogre in reinforced leather, mail, scale or plate** takes −20 to
  Willpower rolls, read off their worn armor.
- **The Breaking**: an Ogre who critically fails a roll they spent Resolve on
  gets a real status and the book's escape conditions.
- **Resolve as Favor** (+10 each, max 3) can finally be spent from
  TBE: Skill Roll, and actually leaves the sheet.

### Found by a blind review of this release, and fixed before it shipped
A reviewer with no knowledge of how any of it was built was pointed at Ch.14
and the code, and told to find what was wrong. It found 22 things. The
substantive ones:

- **Patterned in the Weave's +5 Max Resolve never reached a wizard-built
  Spellweaver.** v0.13.0 made stat Talents apply through ActiveEffects, but
  only `TBE: Talents` copied them onto the Item it created; the wizard
  dropped them. Since Max Resolve is the denominator of every Fraying number
  in the chapter, a Spellweaver entered Fraying Roll territory five points
  early and every purge percentage on the sheet read ten points high.
- **Mitigation on a critical failure was dead input that lied.** The box
  appeared, printed "Weave Reaction Modifier now 0 — cancelled", spent no
  Resolve, and let the Reaction happen anyway. A critical failure has no
  modifier to mitigate; the window now says so and prices the Reaction at the
  spell's Magnitude cost.
- **A spell that failed still accrued its shaping's Fraying.** A
  Permanent-Duration ritual that simply missed handed the caster 2d6 Fraying,
  against "the spell is not cast, spend 1 Resolve with no further effect".
- **The Ch.18 NPC shortcut got both critical branches backwards**: a critical
  success rolled a Weave Reaction the book denies, and a critical failure
  rolled none where the book demands 1d20+5. A natural 0 on the ones die is
  also uncontrolled whatever the Strand, which the 0-counts-as-10 rule was
  swallowing. The general hit location d10 is rolled now too.
- **The book's hard prerequisites were unenforced**, and chargen manufactured
  the violating state: a Bind or Strand at 0 cannot be cast with, and a caster
  needs at least 1 available Resolve to attempt a spell at all. Both are
  blockers now, on the sheet and in the window. The Magic tab no longer
  reports a Bind sitting at 0 as "known", and `TBE: Advancement` no longer
  creates a second `Control` beside an existing `Bind: Control`.
- **Sequential Strand raises made one Fraying Roll instead of one per point.**
  Raising 10 → 13 is three improvements and three rolls; a single Weave
  Reaction of several points remains one roll, as the book's example shows.
- **Bind requisites did not exist**, though the chapter's headline example is
  one. A Strand requisite also hid the Thread for the spell's own Strand.
- **Choosing the struck location and bypassing shield or armor AP could only
  be bought before the roll**, when the book buys all three after it — the
  worked example on p.290 takes a 17 TC spell to 18 exactly that way.
- **Seven of the thirty Weave Reaction results printed a bare label** because
  the prose lookup matched in the wrong direction; an "Immobilized" result
  painted a "Restrained" token.
- **Every magic Talent in Ch.4 was ignored.** Weave Shadow, Ritual Caster,
  Enduring Caster, Forceful Strand and Words Alone all modify a roll this
  window makes itself, and all now do.
- **Effect/Duration contradictions are caught**: attack spells and healing
  must be Instant, added actions must be One Round, a Combat Maneuver Effect
  must be Instant.
- **A Triggered Effect is priced off the Duration table**, as p.294 says,
  instead of a free-text number the player invents.
- **Resolve as Favor could be spent past what the sheet held**, in both
  `TBE: Skill Roll` and `TBE: Cast`.
- **Fraying symptom tiers were neither permanent nor complete**: they were
  recomputed live, so raising Max Resolve un-displayed a tier the book calls
  permanent, and a caster with zero Fraying and Max Resolve 5 was told animals
  bolt from them. Reached tiers are recorded on the actor now, and the book's
  16 concrete signs are on the sheet and in the journal instead of a one-line
  mood summary.

And three failures in the tests themselves, each proved by a mutation that
used to pass and now does not:
- `magic_check.mjs` claimed to catch a stale generated `magic-data.mjs` with
  22 substring checks over names that have never changed. Rewriting all 122
  costs in that file to 0 left every one of them passing. It compares the
  actual exported values now.
- `parse_magic.py`'s "the cost must be in its own quote" guard could not tell
  the cost column from the value column: "+3 AP", which costs 4 TC, verified
  clean when transcribed as 3. The cost must now sit in the cost column, and a
  prose row cannot borrow another row's "N TC" heading.
- The Weave Reaction Table's ranges were hand-typed numbers nothing checked.
  Two results could have their names swapped, or a range shifted by one, with
  every quote still verbatim. Both are derived from the quote now.
- `cast_check.mjs` never once clicked the Effect picker, so all 17 Effect
  groups were unpriced by any test, and the "you need N or better: X%" line —
  the whole point of the shaping window — had no assertion at all.

`magic-data.mjs` also shed about 1100 generated lines that nothing in the
system module read.

### Also
- The step-1 **concept table can be expanded in play**; added rows live in
  the world and roll alongside the built-in ones.
- The equipment screen buys in **quantity**, and prices the whole order on
  the button before you press it.
- New harnesses: `magic_check.mjs` (87 checks over the generated data, the
  CONFIG helpers, the real `_prepareMagic` and the real template) and
  `cast_check.mjs` (109 checks driving the shaping calculator in a real
  browser, against the book's own worked example on p.290).

## 0.14.1

- **A stat that moved now says why.** v0.13.0 made stat Talents apply through
  ActiveEffects, which fixed one half of "it goes nowhere" and opened the
  other: Toughness read 2 with nothing on the sheet to explain it. Death
  Threshold, Resolve, Toughness, Initiative and Lethality Level now each show
  the Talents feeding them ("Tough +1", "Inner Strength +1"), rank-scaled,
  and show nothing at all when no Talent applies.
- Audited every interactive element in every sheet template against the
  handlers in the sheet code: no dead buttons, links, selects or inputs. The
  only unbound controls are the `name="name"` fields Foundry binds to the
  document itself. Recording the result so it does not have to be re-derived.

## 0.14.0

The last batch from the "granted but never applied" sweep: the racial grants
that need a player choice, so they needed UI rather than a note.

- **The Race step now asks for the choices the book gives you.** A Human or
  The Replaced picks their **bonus Savvy skill** and their **extra Expertise
  level**; a Bolg Fiir picks either from its five-skill Savvy menu or the
  **+10 Bind** its Patterned-in-the-Weave half grants. All three used to be
  prose in the Notes tab and nothing else, so a Human's two extra picks
  simply never happened. The Replaced correctly inherits the Human choices,
  since the book says it "gets all the Traits of a Human" rather than
  repeating them.
- A Bolg Fiir who names no Bind gets the note for the other half of the
  rule (+10 to opposed rolls against Weave Magic), which is situational and
  stays a note on purpose.
- **The SAVVY Talent now marks its skill.** "Pick one skill and mark an S
  next to it" &mdash; name the skill in "Applies to" and the flag lands, so
  Advancement's +1-per-improvement actually fires.
- **Dwarven craft applies.** "Reduce the required SLs of any extended Craft:
  Practical or Craft: Artistic roll by 2" now appears as a tickbox on
  `TBE: Extended Roll`, for Dwarves only, and the card shows the reduction.

Caught while testing: `_step_race` referenced a `d` that was never declared
in that scope, so the new pickers threw on render. Found by the probe, not
in play.

## 0.13.0

A deliberate sweep for the class of bug the free-armor roll belonged to:
**something the book grants, which nothing ever applies to the actor.** Found
by auditing every dice roll against whether its result reaches the actor, and
every schema field against what writes and reads it.

**Stat-modifying Talents were entirely inert (the big one).** Nothing
anywhere read Talent Items to change a number. Eight Talents promise a stat
and delivered nothing, and five of them are offered by the Ability Score
step that *every* character goes through:

| Talent | Now applies |
|---|---|
| Tough | +1 Toughness (every race offers it) |
| Inner Strength | +1 Max Resolve (Intelligence) |
| Not Today, Death | +2 Death Threshold (Constitution) |
| Combat Awareness | +1 Initiative (Dexterity, Wisdom) |
| Strong Back | +2 Inventory ENC (Strength) |
| Unkillable | +1 Lethality Level |
| Weapon Belt | +1 Max Weapon ENC |
| Patterned in the Weave | +5 Max Resolve (Spellweaver, Bolg Fiir) |

Each now carries a `transfer: true` ActiveEffect, so the number moves when
the Item is on an actor and moves back when it is removed &mdash; which
writing the value into the field could not do. The mapping lives in
`build_talents.py` with the book sentence quoted beside every entry, and the
builder fails if a mapped Talent is missing or loses its effect. Effects are
attached both to the compendium copies and to the catalogue the macros bake
in, so a Talent added in play behaves like one dragged from the pack.

**Two fields existed, were read, and nothing ever wrote them.**

- **An Ogre's 8 Inventory ENC.** Ch.5 says "They have 8 general Inventory ENC
  instead of 6"; `system.enc.invBonus` was read by both the sheet and
  `TBE.encStatus` and left at 0, so every Ogre silently carried 6. Now set at
  chargen from a new verified `invBonus` in `chargen.py`.
- **Max Weapon ENC.** Weapon Belt had nowhere to write, and `handMax` was
  hardcoded to 6 in two places, so even a computed bonus would have been
  discarded. Added `system.enc.handBonus`, and both the macro library and the
  sheet now honour it.

**Racial bonus Savvy skills never reached the actor.** Half-Orc (Endurance)
and Dwarf (Locks & Traps) are named outright by the book and now apply
automatically, so `TBE: Advancement`'s +1-per-improvement finally fires for
them. Where the book offers a choice (Human, The Replaced, Bolg Fiir) the
note still asks the player.

**Tooling.** New `syntax_check.mjs`, because `node --check` parses macros as
CommonJS and rejects the top-level `await` every one of them uses &mdash; it
was reporting both false alarms and, worse, false confidence. It now wraps
each macro the way Foundry does before parsing. All 28 pass.

## 0.12.1

**The free 1d3+1 starting armor now actually works.** It was rolled and then
abandoned: the count went into a Notes line reading "buy on the Gear tab",
the Equip screen had no idea it existed, and buying armor there charged
silver &mdash; for pieces p.109 step 9 gives you outright ("Characters start
with 1d3+1 pieces of armor").

- The wizard now parks the rolled count on the actor instead of only
  mentioning it in prose.
- Equip shows "N free armor pieces still to claim" with a **Take free**
  button beside Buy. Taking one costs no silver and decrements the count;
  the banner and button disappear when they run out.
- **Training is enforced on the free pieces only**, as the book words it
  ("as long as they have whatever training the armor requires"). Reinforced
  Leather, Mail, Bone, Scale and Plate need Armor Training, and an Ogre's
  single allowed rank covers Bone only (Ch.5). An untrained type says so and
  offers no Take-free button, but can still be bought for silver, since
  Armor Training governs Combat Maneuvers rather than legality.
- Tidied the owned-armor list, which printed each piece's location twice.

## 0.12.0

**New macro: `TBE: Finish Character`.** Everything chargen deliberately
leaves open, on one screen, after the numbers exist. It opens automatically
when the wizard finishes, and runs standalone any time as a tidy-up tool.

Six tabs, all writing straight to the actor:

- **Equip.** Shop the real priced equipment list. Buying deducts the price
  from your silver, creates a proper weapon/shield/armor Item with the
  book's stats, and updates the armor Bulk and Initiative penalty in the
  header as you go. Armor is bought per hit location, because one piece
  protects only the locations checked on it (p.140, armor may not be
  layered). An item you cannot afford is refused.
- **Talents**, inline rather than a hand-off. Same rules the standalone
  macro enforces (prerequisites, race exclusivity, creation-only, per-X
  specialisations), with XP charging **off by default**, since the picks
  Race, Career, Ability Scores and Rounding Out grant are free.
- **Wises & Languages.** Name the blank slots chargen creates, see the
  languages your race and culture already granted, delete what you do not
  want, add new ones at 20.
- **Goals**, built with the four-step method from the Goals chapter rather
  than typed into an empty box: what you want, what stops you, what you will
  do, assembled live into the book's template ("I will [action] to overcome
  [obstacle] so that I can [desire]"). Goals are now a **real field** on the
  actor with a type and a done flag, editable on the Notes tab, because XP
  is awarded per goal pursued and per goal completed (p.160). The tab warns
  under three active goals and over five.
- **Shared History** (p.94), which needs another character to exist. A skill
  you do not have yet is created at 20 and then takes the +5, as the book
  says.
- **Status**, which mostly manages itself now.

**The wizard drops from 15 steps to 12.** Equip, Goals and Status were
near-empty pages asking for things that only make sense once totals are
known; they now live in Finish Character. That freed the room Life Events
needed:

- **Life Events is split into two sub-tabs** (the three events, and
  Relationship NPCs), so the roll buttons stay on screen.
- **Roll 1d6 for age** on Rounding Out. The book lists three bands without a
  table, so this spreads a d6 evenly across them and says so on the card
  rather than inventing a weighting.

Also: the Solo Panel lists the new macro, and the character sheet's Notes tab
gained a Goals section with add/edit/remove/complete.

## 0.11.0

**Life Events are implemented, not just named.** This was the last place the
wizard told you to go look something up in the book.

- New `parse_life_events.py` extracts all **151 Life Events** across the
  Origin, Youth and Recent tables, with each one's description and its **335
  real mechanical options**, and verifies itself: every name matched verbatim
  against the rulebook text, and all three d100 tables proved to cover 1-100
  exactly once with no gaps or overlaps.
- A rolled event now shows its own description and a dropdown of its actual
  choices ("+10 Protocol" / "+10 Common Lore", or "+10 Perception" / "gain
  Noble-wise at 20" / "+1 Status"). The pick is applied on Create: skills are
  raised, a `-wise` or Bind or Strand is created as a real Item, Status is
  added, and a Godbound's Piety option is honoured.
- The 50-row d100 table behind each event is **collapsed by default**. It was
  pushing the roll buttons off screen, which is why the same event kept being
  re-rolled by accident.
- Relationship NPCs now have a **name and a note field** each, and both reach
  the seeded Notes.

**Other fixes from the same play session**

- **Culture picks no longer default to their first entry.** Walking through
  without choosing silently stacked every "choose" bonus onto Deceive
  (alphabetically first in Social) and capped it. Open picks now start empty
  and read "(choose)".
- **Immediate feedback.** Any dropdown or checkbox that changes what the rest
  of a step shows now re-renders at once instead of waiting for Next. That
  covers the Career summary, the Cultural Background pick list, a Life
  Event's options, and the Randomized Initiative / Death Threshold toggles,
  whose Roll buttons previously stayed hidden until you moved on. Text and
  number fields are excluded on purpose, since re-rendering mid-keystroke
  would steal focus.
- **"Split evenly" is now "Spread what is left".** It fills only the boxes
  still on 0, with only the unspent remainder, and never overwrites a
  deliberate entry. The separate Clear button existed only to undo the old
  behaviour and is gone.
- **The starting silver shows its working**: "300 sp = Civilian 2d6×10 → 60 +
  Civilized, Urban 1d6×10 → 40 + Equip step 2d4×50 → 200". The total was
  already right (p.109 step 3 is "Add 2d4×50 sp", and the book's own worked
  example rolls 300), but it was unverifiable at a glance. `TBE: Build
  Character` counts career silver only, which is why it reports far less.
- **Personality Traits are no longer listed twice** in the seeded Notes; they
  have their own section and a real field on the sheet.

## 0.10.1

Both items reported directly after a real chargen run.

- **Removed the concept roller's "Use these" button.** The book gives one
  skill per category at 30 (p.80) and that pick is the player's; a button
  that filled all four at once read as though the roller was choosing for
  you. The rolled concept still lists the skills it points at, now framed
  explicitly as candidates for your one pick per category.
- **The two allocation steps are no longer done blind.** Career Skill Points
  and Rounding Out asked for point allocations without showing any skill's
  current value, so you were typing into a box with no idea whether the
  skill sat at 20 or at 68. Every box now carries its skill's running value
  (everything applied so far: starting 30s, career points, racial modifiers,
  Ability Scores, Cultural Background), marked in red at the 70 creation cap.
  The per-category spend counter updates live as you type, rather than only
  on the next re-render.
- **Fixed the 70 creation cap in the wizard's own `computeSkillValues`.**
  It clamped career points and then added racial modifiers on top, so an
  Ogre's +10 Might could read 80. Same defect fixed in `TBE: Build
  Character` in v0.9.0; the wizard's copy had been missed. It was invisible
  until the running values put it on screen, which is the point of them.

CLAUDE.md's review priorities now split "player preparedness" into two: can
the field be answered with what the player knows *here*, and does the step
show the state needed to decide. Every prior test passed the second because
they all checked the DOM was correct and none asked whether it was enough.

## 0.10.0

The enforcement pass. Every item here is a rule the macros previously
*printed* and then did not apply. Covered by a new `enforcement_check.mjs`
harness (19 checks) that drives both macros headlessly and asserts on what
actually reached the actor.

**`TBE: Talents`**

- **Prerequisites are enforced, not just displayed.** p.161: "You must meet
  any requirements the Talent has before purchase, as listed in its
  description." 16 of the 18 Talents carrying a requirement name another
  Talent, which is now checked against what the character owns. The other
  two point at a skill or a supply roll and cannot be resolved
  mechanically, so they are surfaced as "check first" rather than silently
  ignored or wrongly blocked.
- **Talents now cost XP, at their own price.** The macro had no XP logic at
  all. It now charges 5 XP, or 10 for Faded Pattern and Godbound
  post-creation, refuses what the character cannot afford, and shows the
  running cost per row. Character creation is still free: untick "Spend XP".
- **Creation-only Talents can no longer be bought.** p.164, Patterned in the
  Weave: "This Talent can only be chosen at character creation."
- **"Per-X" Talents get their own row.** Armor Piercer taken for a second
  weapon type used to bump a rank counter and throw the weapon name away.
  It now creates a separate entry carrying its own specialization.
- **The picker shows each Talent's description**, so the book no longer has
  to be open to know what a row does.

**`TBE: Advancement`**

- **A Fade's Bind is held at 70.** p.162: "A Fade can never develop any Bind
  skill past 70." The dialog printed this and never applied it, so a Fade
  could walk a Bind to 90+ through this very macro. A Spellweaver, correctly,
  is not capped.
- **Binds can only be opened by someone who may use them.** p.162 requires
  Patterned in the Weave or Faded Pattern first; any character could
  previously buy a Bind and start casting. The refusal names the Talent they
  need.
- **The Talent option no longer takes a flat 5 XP up front.** That single
  charge then opened a dialog that would add any number of Talents for it,
  and it over- or under-charged whenever the real cost differed. Charging
  now happens per Talent, in `TBE: Talents`.
- **The Gaining XP table is adopted** (p.160). Tick what happened this
  session (pursued goals 3, individual goal 1, shared goal 2, meaningful
  failure 1, revelation 1, Personality Trait penalty 1) instead of doing the
  sum by hand. A manual amount box remains.
- **Expertise eligibility shows in the skill picker**, so a player sees "no
  Ex below 40" or "Ex3 needs 60" before clicking Go instead of being bounced
  afterwards.

**Data / parser**

- **Fixed a description-truncation bug in `parse_talents.py` affecting 8
  Talents.** Where a Talent's final sentence ended in a unit abbreviation
  and the next Talent's header followed ("...costs 10 XP. PATTERNED IN THE
  WEAVE - ..."), the junk-prefix stripper cut the previous entry's body
  before those characters. Godbound was losing the " XP." that states its
  own price. Descriptions are now complete.
- `parse_talents.py` additionally extracts each Talent's XP cost and
  creation-only flag, and its self-check asserts both (Faded Pattern and
  Godbound at 10 XP, Patterned in the Weave creation-only).
- **Fixed a latent trap in `macros/_lib.js`.** The legacy `Dialog` fallback
  read `i.value` for every named input, and an unchecked checkbox reports
  "on", so that path would have submitted every checkbox as ticked. It is
  unreachable at the declared Foundry 12 minimum, but it is now correct
  rather than waiting to bite.

Still open, tracked in BACKLOG.md: Strand advancement (needs the Ch.14 Weave
data that does not exist yet), the Human Cultures table's step-2 placement,
racial bonus Savvy/Expertise/Talent pickers, Magic Convocations, and Build
Character's remaining gaps.

## 0.9.0

The wrong-number pass from the fidelity audit. Every item here is a value the
book states plainly that the code was getting wrong, with no design decision
involved. All are verified against the rulebook text and covered by new
regression checks.

**Character creation**

- **Ogre Death Threshold is 22, not 20.** `TBE: Character Wizard` displayed
  `race.dt` on the Race step and then never read it, hardcoding a base of 20
  in `commit()`. Every Ogre was built 2 DT light, which also dragged
  Lethality Level from 8 down to 7. `TBE: Build Character` already had this
  right; the read is now ported across. (p.83, "Toughness 1 and a Death
  Threshold of 22".)
- **Blank `-wise` slots now start at 0, not 20.** p.79-80 assigns 20 to all
  other skills "except custom -wises and Languages under Lore... leave them
  at zero for now". Both chargen macros were granting four free 20-value
  skills, 80 points the book does not give, which Rounding Out then charged
  again to buy. Career customs and Rounding Out remain the things that put
  values in those slots.
- **A Godbound now finishes with Piety 50, not 20.** The career grants
  "Magic (Piety) 20" (p.104) *and* the Godbound Talent, which grants Piety
  "at a starting value of 30 (or to add 30 during character creation)"
  (Ch.4). Only the career half was being applied.
- **Status is no longer zeroed.** `commit()` wrote `roBonusChoice ===
  "status" ? 1 : 0` unconditionally, so a character who had already earned
  Status (a Life Event, or the p.102 career Talent swap for +2) lost it. It
  now never lowers a Status the character already has.
- **Ability Score descriptors reach the real Personality Traits list.** Ch.8
  says descriptors "act as a kind of Personality Trait" and can be invoked
  the same way; they were landing in Notes prose only.

**`TBE: Build Character` specifically**

- **The book's 30/20 split is now implemented.** It wrote one uniform value
  to every Combat/Adventuring/Social/Lore skill, so every character built
  with it was 40 points light with no signature skill in any category. Four
  "to 30" pickers now appear in the first dialog (p.80).
- **The 70 creation cap now holds after racial modifiers.** The career-spend
  loop clamped; the racial modifier pass did not, so an Ogre could be
  created at Might 80. (p.80, "no skill can be increased beyond 70 for any
  reason".)

**Talents**

- **The catalogue holds all 149 Talents, up from 147.** "RUN FOR YOUR LIFE!"
  and "ALLOW ME TO INTRODUCE…" were being silently dropped by
  `parse_talents.py`, whose header pattern did not allow a name to end in
  "!" or "…". Neither could be taken at all.
- **Six Talents the book calls repeatable are no longer locked after one
  take**: Armor Training (I-IV), Enhanced Defense, Shield Beat, Inner
  Strength, Unkillable and Tough. `rank_of()` recognised only two of the six
  phrasings the book uses, so the rest came out "once", which the Talents
  macro treats as lock-forever. The practical effect was severe: Armor
  Training II-IV was unreachable, so anyone in Mail or Plate permanently
  lost every Combat Maneuver.
- **`parse_talents.py` now verifies itself**, matching every other data
  script in the repo. It round-trips each parsed name back against the
  rulebook text, fails if any header was rejected, and asserts that the
  Talents the book calls repeatable did not come out take-once. It exits
  non-zero on any of those.

**Discoverability**

- **The Solo Panel now lists `TBE: Character Wizard`.** It previously
  offered only `TBE: Build Character` under "Keep the record", so players
  following the README ("drag the Solo Panel to your hotbar and it launches
  everything else") were steered to the older, less faithful macro and never
  saw the Wizard. Both now sit under a new "Make a character" group.

Still open, tracked in BACKLOG.md: the enforcement gaps (Talent
prerequisites, Fade Bind cap, Bind purchase gating, 10 XP Talents, the
unlimited-Talents hole), Strand advancement, the Gaining XP table, and the
step-2 placement of the Human Cultures table.

## 0.8.2

- **New: a concept roller on step 1 of `TBE: Character Wizard`.** Three
  independent d10 columns (Role, Streak, Trouble), each rerollable on its
  own, assembled into one phrase: "Godbound with a scavenger's eye, one job
  from getting out". Because the columns roll separately, odd pairings are
  the point rather than an accident.
  Each entry carries skill hints, so the merged result is shown as
  "Suggested 30s" against the four category-30 pickers on that same step,
  with a "Use these" button. Step 1 is the first box you fill, so the
  roller keys off nothing else in the flow, and its output feeds the one
  mechanical choice sitting next to it.
- **`data/concepts.json` is the first original content in this repo.** Every
  other data file is transcribed and verified verbatim against the
  rulebook. The book asks for a rough concept at step 1 and gives three
  examples but no table to generate one, so these tables are written to fit
  the setting. They are flavour only: nothing writes to a mechanical field,
  the skill names are suggestions the player still confirms, and the UI
  labels them as table-generated rather than rulebook content. All 64 skill
  references are validated against the real category lists in CI.

## 0.8.1

Step 1 of `TBE: Character Wizard` now matches the book's step 1, prompted by
a direct user report that it asked for things they had no way to answer yet.

- **Removed the "Cultural background" and "Native language" fields from
  step 1.** Both were dead input. `commit()` resolved culture as
  `(d.cultureBgName || d.culture || "")` and `d.cultureBgName` can never be
  empty, so the typed background was unreachable 100% of the time; the
  typed language was overridden for Humans by the step-5 Human Culture
  table. The book (p.79-80) asks for neither at step 1. Cultural
  Background is step 5's d10 table; language comes from the d100 Human
  Cultures table, which the book places in step 2 under the Human race
  entry.
- **Added the book's actual step-1 content**, a rough concept phrase
  (p.79: "a single sentence or short phrase that captures the idea in
  your head... This isn't binding"). It now fills the Concept line in the
  seeded Notes, which was previously written out blank.
- **The Replaced now gets the Human Cultures picker.** It was the one race
  whose native language came only from the removed step-1 box, so without
  this it would have silently defaulted to Westronne. The book (p.68) says
  "Replaced get all the Traits of a Human" and gives it the same "Language
  of their cultural region at 70" wording Humans get.
- New regression coverage in `wizard_visual_check.mjs` for all of the
  above, including that a Dwarf correctly does *not* get the Human
  Cultures picker.

Known and tracked, not fixed in this release: see the "Wizard fidelity
audit" section of BACKLOG.md, which now logs 30 verified findings across
`TBE: Character Wizard`, `TBE: Build Character`, `TBE: Talents` and
`TBE: Advancement`.

## 0.8.0

Overnight backlog pass (see BACKLOG.md for the full triage, including what
was deliberately skipped and why).

- **New: Bulk & Initiative penalty (Ch.9 p.141).** Armor Items now carry a
  real `system.bulk` field (matching the book's table: Padding 0.5, Quilt 1,
  Leather 2, Reinforced Leather 3, Mail 4, Bone 5, Scale 5, Plate 6),
  editable on the item sheet and shown in the Gear tab's Armor list. The
  character sheet sums Bulk across every *worn* armor piece and divides by
  3 (rounded up) for an Initiative penalty, shown next to the Initiative
  stat-chip on Overview ("(-N armor → effective)") and totalled on the Gear
  tab. Verified against all three of the book's own worked examples (Fane's
  14 Bulk → -5, Arn's 28 Bulk → -10, the p.142 table's 5 Bulk → -2) via a
  new smoke test before release.
- **New macro: `TBE: Haggle`** — Coins & Haggling (Ch.9 p.127). Buying: an
  opposed Commerce roll against the seller, PC wins reduce the price 10%
  per 2 DoS up to 50% off. Selling: opposed Commerce, PC wins raise the
  price up to +50%, buyer wins lower it up to -50%; selling weapons,
  armor, or mundane items starts from half the listed price. A BARTERER
  Talent toggle switches the PC's own rate to 10% per SL instead of per 2
  DoS (Ch.4). Verified against the book's own worked example (a 100 sp
  gem: PC wins 2 DoS → 110 sp; buyer wins 4 DoS → 80 sp).
- **New: Personality Traits is now a real field**, not just Notes-tab text.
  A short editable list on the Notes tab (add/edit/remove freely, matching
  Ch.8 p.123 "Personality Changes" exactly — the book gives this zero XP
  cost or approval step, so there's no macro logic to gate it, just an
  honest place to keep it). `TBE: Character Wizard`'s Personality step now
  writes here directly on Create Character instead of only summarizing to
  Notes.
- **Fixed a rules-accuracy bug in `TBE: Advancement`**: the "Piety" skill
  Item (created by the Wizard for Godbound characters) was selectable in
  both the "Improve a skill" and "Buy Expertise" pickers, letting XP be
  spent on it. Ch.8 p.125 "Piety and XP" is explicit that Piety cannot be
  increased by spending XP at all, and p.54 excludes it from Expertise
  entirely — "only through acts of service to the deity can a Godbound's
  Piety increase." Piety is now excluded from both pickers, with a note
  explaining why and pointing to the Skills tab for a GM-narrated raise.
- **Overview tab reordered**: vitals (Death Threshold/Resolve/Toughness/
  Fatigue, the wound table, Initiative/Lethality/Shock) now come before the
  identity block (Race/Size/Culture/Career/Silver/Status/XP), matching how
  the creature sheet already leads with wounds. Addresses the earlier
  feedback that Overview's priorities read as "a little slanted."
- Fixed a benign false-positive in `equipment.py`'s own rulebook
  self-verification: "Large Shield" was flagged as not found verbatim
  because the book's own AP column reads "+5; requires Talent" — an
  annotation wedged between the AP and ShB values that broke a plain
  substring check. The underlying SP/AP/ShB/Enc data was always correct;
  only the check needed to tolerate the gap.
- Everything above re-verified with a new standalone smoke test (armor
  Bulk math against 3 book examples + every armor type's data, Haggle
  price math against the book's own example, the Piety-exclusion filter)
  plus the existing Wizard smoke test (24/24) and the full regression
  suite (51/51) before packaging.

## 0.7.1

- **Fixed: the Career Skill Points step pre-filled every field with a
  nonzero "even split" of the pool** (e.g. Combat 3/3/3/3/3/3/2 for a
  20-point pool), rather than starting at 0. Reported as fields
  "already filled out with random low value numbers": editing only a
  few fields to your intended values left the untouched ones still
  contributing their default, so the category could read well over its
  pool (34/20, 87/50) without anything actually being wrong in the math
  — just a confusing starting point. Every field now starts at 0; a new
  per-category **Split evenly** button applies the old even-split
  on demand, and **Clear** zeroes a category back out. The spent/pool
  readout is now colored (red over budget, green exactly spent) so it's
  clear at a glance.

## 0.7.0

- **`TBE: Character Wizard` now follows the book's real 15-part chargen
  order** (Ch.7 p.78 onward), not just the Concept/Race/Career subset from
  0.6.x. New steps: Ability Scores (pick 2 or roll 1d6 twice; +5 to each
  score's skills, 1 Expertise, a Talent, a descriptor), Attributes (spend
  the 5 creation points across Max Resolve/Initiative/Toughness/Death
  Threshold, with the book's optional Randomized Initiative and Randomized
  Death Threshold rolls), Cultural Background (a generic picks renderer
  handling both fixed and "choose N from category" skill bonuses, plus the
  Human Culture Language sub-table), Life Events (Origin/Youth/Recent),
  Shared History, Relationship NPCs, Career Skill Points (now its own step,
  unchanged math), Rounding Out (age band, bonus points, bonus Savvy
  skills), Equip Your Character (the starting Dagger is pulled live from
  the equipment compendium, armor-piece count and starting coin rolled and
  reported), Personality Traits, Character Goals, and Status.
- **Every random-determination table in the wizard now shows the book's
  actual roll table (range + name) with a Roll button**, per direct user
  request, so a table can be resolved without leaving the window: Race
  (d100), Previous Career (d10), Cultural Background (d10), Human Culture
  Language (d100), and all three Life Events tables (d100 each). Life
  Events, Shared History, and Relationship NPCs are shown by name only and
  recorded to the Notes tab rather than mechanically auto-applied — the
  book states each one's exact bonus in prose among 2-3 skill choices, not
  as a clean table, so the player looks up the rolled/picked line in their
  own copy and applies it via the Skills tab.
- **Fixed a real bug in the table-roll matcher**: any table row whose range
  ended in the book's "roll of 0 means max" notation (`"99-00"` on a d100
  table, `"9-0"` on a d10 table) silently never matched a roll of 100 (or
  10), because the trailing zero was parsed as literal 0 instead of the
  die's max face. This dropped the last row of the Cultural Background,
  Human Culture Language, and Life Events (Origin/Youth) tables entirely.
  Caught by a new headless smoke test exercising full 1-100/1-10 roll
  coverage on every table before this release; the whole test suite now
  passes with no gaps.
- **New: `system.initiative` field** (default +10, p.87), shown as an
  editable stat-chip on the Overview tab next to Lethality Level — closes
  the previously-flagged "no Initiative box under Overview" gap. The
  Wizard's new Attributes step writes it directly instead of leaving it as
  a Notes-tab reminder.
- **Fixed a pre-existing data bug**: `TBE: Build Character`'s seeded Notes
  text said "Death Threshold +1 each" for the creation-point spend; the
  book says +2 per point (p.87). The Wizard's own Attributes step already
  computed this correctly and needed no change.
- Confirmed via direct rulebook cross-check: the Talents catalogue is
  missing "Allow Me To Introduce…" (Ch.4, p.44 area) — a pre-existing gap,
  unrelated to this release. Not fixed here; the Wizard's existing
  "not in catalogue, add by hand" fallback surfaces it gracefully instead
  of crashing. Logged in BACKLOG.md.

## 0.6.2

- **`TBE: Character Wizard`'s Race and Career pages now show the book's own
  random-determination table** (p.81's d100 Race table, p.116's d10
  Previous Career table) alongside the dropdown, each with a "Roll" button:
  roll and it picks the matching entry for you, posts the roll to chat, and
  highlights the hit in the table so you can see how it landed. Picking by
  hand is still there and still wins if you use it afterward — this is the
  book's own "or roll" option (both tables are explicitly presented as
  optional random determination, not a requirement), not a replacement for
  choosing outright.

## 0.6.1

- **Fixed: an inactive tab (Overview, the tallest panel — identity rows,
  vitals, the six-row wound table, supply) could still reserve its full
  height above whichever tab was actually open**, seen as a large dead
  zone above the Notes tab's short Biography/Notes boxes ("the top bar
  takes the lion's share of real estate"). The sheet's own CSS now forces
  `display:none` on every inactive tab panel instead of trusting core
  alone to hide it.
- Confirmed and logged, not fixed: there is genuinely no Initiative field
  on the character sheet, even though both chargen macros' seeded Notes
  text tells you to spend a creation point on it. Tracked in BACKLOG.md
  under Equipment (Ch.9) alongside a new Sheet UX note about reworking
  what Overview leads with.

## 0.6.0

- **New macro: `TBE: Character Wizard`** — a real step-back-able chargen
  window (the Hero Builder ticket from BACKLOG.md, v1 scope), replacing the
  throwaway `TBE.prompt()` Dialog chain with one persistent `Application`:
  Concept, Race, Career, Career Skill Points, a Talents preview and a Review
  page, with a working Back button and nothing written to the actor until
  Create Character on the final page. Runs the exact same mechanical logic
  as `TBE: Build Character` (race mods, career pools, Talent grants, silver
  roll) — both macros ship side by side. The draft lives only in the
  window's memory (no cross-session persistence yet), and it deliberately
  shows no page for the still-unbuilt Ch.7 steps (Attributes, Cultural
  Background, Life Events, Personality Traits, equip-your-character) rather
  than faking one; both are tracked as follow-ups in BACKLOG.md. Built as
  classic `Application` (v1), not ApplicationV2, since this pack still
  targets Foundry v11.

## 0.5.0

- **Encumbrance is a real mechanic now** (Ch.9 p.129-130). Weapon and shield
  items carry a real ENC value and a Carried state (At Hand, sharing a 6 ENC
  pool, or Stored in Inventory); armor items carry an Equipped flag (worn is
  free per hit location, un-equipped costs 1 Inventory ENC and protects
  nothing, wired into the armor-location fix above); coins count 1 ENC per
  500 sp. General Inventory Max is 6 ENC plus a manual bonus field for things
  like the Strong Back Talent (no auto-detect hook for Talent effects in this
  system). Overflowing Inventory ENC applies the book's penalty table (-10 at
  1-3 over, -20 at 4-6, -30 at 7-9, and flags a load of 10+ over as not
  legal) to "physical activity" rolls (Athletics, Combat skills). The
  character sheet's Gear tab shows live Hand/Inventory totals and any active
  penalty; `TBE: Attack` pre-fills both the attack and defence modifier
  fields with the relevant side's penalty (still editable); `TBE: Skill
  Roll`, `TBE: Opposed Roll`, `TBE: Clocks`, and `TBE: Quick Combat` show a
  reminder line when a penalty is in effect. Existing weapon/shield/armor
  items default to At Hand / Equipped (today's actual behaviour), so nothing
  changes for a sheet until ENC is deliberately pushed over the line.
- **Fixed, found during a self-review of this session's own work:** a
  Stored (not At Hand) shield still blocked damage as if worn; Shield
  Bash's SL cost was a flat guessed 6 regardless of which shield (or none)
  the attacker carried, instead of reading the book's real per-size table
  and disallowing it entirely for a Buckler (p.140); and Pierce Armor
  reduced a shield's AP too and had no effect-gate for light armor,
  contradicting p.163-164 ("does not reduce a shield's AP... has no effect
  if that location has 3 AP or less"). Shields now carry a real `shb`
  field (null for a Buckler). Everything else surfaced by that review —
  chapters not yet built at all — is tracked in `BACKLOG.md` instead of
  shipping half-built.

- **Fixed: armor didn't actually protect anything by hit location.** Every
  worn Armor item carried the same placeholder text ("single location") with
  no way to say which location that was, and `TBE: Attack` never read it at
  all — it just took the single strongest AP among everything worn and
  applied that to whatever location got hit, so a Head piece alone would
  also "protect" a struck Leg. Per p.140 ("Armor protects individual hit
  locations... may not be layered"), armor is now a real per-location
  BooleanField set (Head/Body/R Arm/L Arm/R Leg/L Leg) — check every location
  a given piece covers on its own item sheet, and a full suit is several
  armor items, one per location. `TBE: Attack` now looks up AP for the
  specific location actually struck, and the pre-roll dialog lists every
  worn piece with its assigned location(s) and flags any piece with nothing
  checked (it protects nothing until you check one). Existing armor items
  and compendium entries need a location checked by hand after updating —
  nothing can infer that for you.
- **Expertise and Savvy are real mechanics now, not inert fields.** Expertise
  (Ch.4 p.54, Ch.8 p.123) guarantees a minimum SL on a successful roll and
  now applies as a floor in every roll-resolution path in the pack (attack,
  defence, casting, skill rolls, opposed rolls, clocks, journeys, wounds
  healing/recovery, extended rolls, social encounters) — about a dozen call
  sites threaded through, not just the popup label. Savvy (Ch.4 p.51) adds
  +1 when improving that skill with XP.
- **New macro: `TBE: Advancement`** (Ch.8, p.122-124) — spend XP between
  sessions: improve a skill (1 XP, 1d100 vs current value, 1d4+1 over/1 flat
  under, +1 if Savvy), buy the next Expertise level (4/6/8 XP, capped by the
  skill's own value per the Skill Expertise Limits table), buy a new
  -Wise/Language or Bind skill, or spend 5 XP toward a Talent (hands off to
  `TBE: Talents` to actually pick it). A character's XP available/earned are
  now real tracked fields, visible on the sheet for the first time alongside
  Silver and Status (all three existed in the schema before this but were
  never rendered anywhere). Strand and Piety advancement from the same
  chapter are intentionally not covered — neither is a trackable field on
  this system yet.
- **Fixed: `TBE: Build Character` silently auto-split a Previous Career's
  skill points evenly across a category**, producing odd values like
  32/31/31/32/31/31 on a "plain" character instead of the deliberate
  point-by-point choice the book actually calls for (p.102: "Skill points
  cannot be transferred between categories," implying they ARE meant to be
  spent one at a time, by choice, within one). A new second step lets you
  spend each category's pool skill-by-skill, pre-filled with an even split
  only as an editable starting suggestion, with honest over/under-spend
  reporting instead of a silent correction.

## 0.4.0

- **Extended Rolls and Social Encounters are real tools now**, not just
  something the GM tracks on paper. Two new macros, `TBE: Extended Roll`
  (Ch.2, p.22: crafting, research, tracking, anything with an SL target and
  an interval) and `TBE: Social Encounter` (Ch.13, p.249-264: Static
  audiences with a hidden Tolerance, and Competitive contests between two or
  more sides racing to a Victory Condition, covering the Debate/Trial/Council
  formal variants as one flexible engine). Both remember their state between
  macro runs (a new world setting, `encounters`), so a scene or a project can
  span more than one sitting. Multi-participant intervals apply the book's
  highest-roll-plus-two-assists rule; critical failures halve accumulated
  totals; Static's same-skill-twice and Tolerance-exceeded-plus-1d10 rules
  are enforced automatically; the outcome tables (both Static and
  Competitive) are computed and reported. Grouped under a new "Talk it out"
  heading in TBE: Solo Panel.

## 0.3.1

- **Fixed: bestiary creatures loaded from the compendium with an empty Gear
  tab and no usable weapon.** The pack builder deleted an actor's `items`
  before writing it, but Foundry's compendium loader finds embedded items by
  reading an id list off the parent record, not by scanning the database — so
  the embedded skill/weapon records were sitting in the pack correctly but
  never referenced, and every creature looked unarmed. The parent record now
  carries that id manifest, matching how Foundry's own pack-compiler
  (`@foundryvtt/foundryvtt-cli`) builds it. Verified by extracting the rebuilt
  pack with that same official tool: the Dragon now reconstructs with its 12
  items, Claws or Bite and Tail Sweep included. `verify_packs.mjs` gained a
  check for this specific failure so it can't silently regress.
- **Fixed: token footprint didn't reflect Size.** A dragged creature always
  got a 1x1 token regardless of what its sheet said. The book has no explicit
  Size-to-feet table, so this adopts a convention (documented in
  `build_packs.mjs`): Medium and below keep a 1x1 footprint and shrink via
  token scale (Small ~0.85 down to Minute ~0.2), Large and above grow the grid
  footprint one step per Size step (Large 2x2 up to Colossal 6x6) at full
  scale. A Gargantuan Dragon now drops in at 5x5. Any single creature's token
  can still be resized by hand if a GM wants something different.

## 0.3.0

- **Content now ships as compendium packs**, the way every other detailed
  Foundry system does it (Rolemaster, WFRP4e, HackMaster, HarnMaster all use
  packs rather than installer macros). Six packs under one folder: 21 macros,
  147 Talents, 50 equipment entries, 56 fully-statted creatures, 6 oracle
  tables and 4 reference journals. Nothing needs pasting into a Script macro,
  and nothing lands in the world database until imported.
- Document ids in the packs are derived deterministically from name and type,
  so rebuilding the system keeps every id stable and existing references to a
  compendium document still resolve.
- Bestiary creatures carry a prototype token wired to Death Threshold and
  Resolve, so a dragged token shows the right bars immediately.
- **`documentTypes` moved into `system.json` and `template.json` removed**,
  clearing the "template.json is deprecated, support removed in V16" warning.

## 0.2.0

- **Size is now a real field on every actor** (the Ch.18 ladder, Minute to
  Colossal). The bestiary already carried a Size for all 56 creatures and the
  first port dropped it; it is recovered and wired into combat. TBE: Attack now
  applies the size-difference rules: +20 to hit a foe 3+ Sizes larger, no parry
  against a monstrous attacker, Drive Back/Trip/Disarm disabled against a foe
  3+ Sizes larger, plus Reach and Grapple reporting.
- **Race is a real field with real numbers.** All six playable races, with the
  modifiers the book gives them (an Ogre starts Toughness 1, Death Threshold 22,
  Size Large, +10 Might, -20 Melee: Light and caps Armor Training at one rank).
- **Talents are a new Item type**, with the full 147-entry Chapter 4 catalogue,
  categories, prerequisites, ranks and race exclusivity.
- **Build Character is a real chargen flow**: race and Previous Career are
  applied, not described. Career skill pools are spread (capped at 70), silver
  is rolled, named Talents are granted, and everything it could not decide is
  listed rather than skipped.
- Creature sheets recover Ferocity and Move, also previously dropped.
- Fixed: the Effects tab showed a raw `EFFECT.TabDuration` key on Foundry V14.
- Fixed: empty rich-text editors collapsed to a one-line sliver.
- Fixed: `system.json` used the pre-V10 `gridDistance`/`gridUnits` keys and
  declared no verified version, so V14 reported "compatibility unknown".

## 0.1.0

- Initial native Foundry VTT system for The Broken Empires, scaffolded from
  the boilerplate generator and built out with real DataModel actor/item
  schemas (character, creature, skill, weapon, armor, shield).
- Character and Creature sheets: Death Threshold/Resolve/Toughness/Fatigue
  header, editable six-location wound table, Supply dice, grouped skills,
  weapon/armor/shield inventory, active TBE statuses.
- Skill/Weapon/Armor/Shield item sheets.
- The full TBE status palette registered into `CONFIG.statusEffects` at
  startup.
