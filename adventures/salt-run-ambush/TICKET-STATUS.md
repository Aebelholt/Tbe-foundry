# Salt-Run Ambush, Foundry build tickets: status

## Which file is which

- **`TBE-Salt-Run-Ambush-Installer.js`** is the one you paste into Foundry.
  New Script macro, paste the whole file, run once as GM. Safe to re-run:
  every creator skips a name that already exists rather than duplicating it.
- **`pregen_check.mjs`** is a Node test script. It never goes into Foundry.
  Pasting it gives you "import declarations may only appear at top level of
  a module", because it uses `import`, which a macro cannot. Run it on the
  machine with the repo: `node adventures/salt-run-ambush/pregen_check.mjs`.
- **`TICKET-STATUS.md`** is this file, notes only.

Section 13 of the check now compiles the installer, and both macros it
creates, exactly the way Foundry compiles a script macro, so a future edit
that would be rejected at paste time fails the suite instead.

All twelve tickets are built, Rules as Written throughout. Verified by
`node adventures/salt-run-ambush/pregen_check.mjs` (648 checks, 0 failures).

## Rules as Written, and what that changed

The standing instruction is RAW always, on the grounds that this module is
meant to teach the game rather than obscure it. Three things I had flagged as
open questions are decided by the book, and two of them changed the build.
Nothing here is a house rule.

**1. Ambrose carries a Broadsword, not a longsword.** RAW, the book groups
every Longsword row under its Heavy Weapons heading, and Melee: Heavy is
defined as "two-handed weapons that often have the Reach quality". Ambrose
has Melee: Medium 70 and no Melee: Heavy, and his sheet, ticket 3 and Beat 6
all build the duel on that 70. Melee: Medium is defined as "standard weapons
like broadswords, maces, or axes", so the RAW weapon matching his RAW skill
is the Broadsword: Dmg 4, CL 3, CS 3, Dis 4, T 5, Enc 2. Only the flavour
word changed; every number the module teaches is untouched. My earlier build
put Medium stats under the name "Longsword", which was a weapon that does not
exist in the book, and is exactly the kind of fudge the instruction rules
out. If you would rather he truly carried a longsword, that is equally RAW,
but then give him Melee: Heavy 70 in place of Melee: Medium 70, use the
Longsword line (1H: Dmg 4, CL 4, CS 4, Dis 3, T 3), and change the same
number in Beat 6's text.

**2. Dunchadh no longer rolls Initiative.** p.161: "Enemies typically do not
roll; they have a static Initiative value, which determines their place in
the turn order each round. Ties go to the PC." He is now a creature-type
actor with a static Initiative of 10. This reverses ticket 3's "rolls
normally, not static", because the book says the opposite for an enemy.

It also fixes Beat 6 rather than needing a GM ruling. The "ties go to the PC"
tie-break is implemented as `actor.type === "character"`, so a
character-type Dunchadh was indistinguishable from a PC and took every tie
from Ambrose on alphabetical order. As a creature he loses ties to the PC,
which is what the book says. Both outcomes are asserted in
`pregen_check.mjs` section 11, the correct one and the one the old build
produced.

And it opens a RAW option worth using at the table, also p.161: "If an NPC
has Resolve, they may spend it to increase their static Initiative for the
round, but they must do so before the players roll their initiative."
Dunchadh has Resolve 10. Announcing that spend before the duel's initiative
roll is legal, dramatic, and teaches the rule in one move.

**3. Worn armour costs Initiative, and the handout's flavour is just
flavour.** RAW the penalty is total Bulk divided by 3, rounding up, so any
worn armour at all costs at least 1. Sela's padding is 0.5 Bulk and still
costs 1, despite "light enough that it won't slow you down"; same for Dags's
leather and "light enough not to eat into your draw". No build change and no
workaround: the sheets carry their printed Initiative, the armour is worn,
and the tracker applies the book's penalty. What the players will see:

| Character | Sheet | Armour | Tracker rolls |
|---|---|---|---|
| Renn Kestrel | +11 | -1 | 1d10 + 10 |
| Sela Voss | +13 | -1 | 1d10 + 12 |
| Grael Ashbeard | +10 | -1 | 1d10 + 9 |
| Dags Farrow | +12 | -1 | 1d10 + 11 |
| Ysolt Vane | +10 | 0 | 1d10 + 10 |
| Uisdean Fen | +10 | -1 | 1d10 + 9 |
| "Mother" Mairwen Coll | +10 | 0 | 1d10 + 10 |
| Old Ambrose Duff | +11 | -1 | 1d10 + 10 |

The armour is one piece on the Body, which is the minimal reading of a
handout that names the armour but not its coverage. A full suit is one Item
per location, and each piece adds Bulk, so a five-piece leather suit would
cost 4 Initiative, not 1. Add pieces if that is what you meant.

Worth telling Ambrose's player: his Combat Awareness +1 is exactly cancelled
by his leather, which is why he sits at an effective 10 against Dunchadh's
10 and wins only on the tie rule. Taking the leather off for a formal
Bréathal challenge, against an opponent wearing none, puts him back to 11
and he acts first outright. That is a real RAW choice with a real cost, and
a good one to let the table find.

**Also RAW, applied quietly:** four sheets carry a weapon whose skill they do
not list. Dags's hand axe, Ysolt's knife and Mairwen's belt knife are all
Light weapons on sheets with no Melee: Light, and Elspeth's staff is a Medium
weapon on a sheet with only Melee: Light. A skill with no value "begins at
20" (p.104), which the handout itself already tells players, so each of those
skills is on the sheet at 20. No printed number changed. The weapon is simply
rollable instead of the rule being something you have to remember mid-fight.
`pregen_check.mjs` section 12 runs the real builder and asserts that every
weapon on every sheet resolves to a skill that is actually there.

## Portraits

Seven of the ten actors now have art, wired to both the sheet portrait and
the token. Art by Caleb Cleveland (patreon.com/calebisdrawing), except
Uisdean's, signed Art Adams 2023. Watermarks are intact, the credit is in
every filename, and `art/README.md` carries the full notes. Personal-table
use: do not redistribute.

Cast: Dunchadh Reave, Grael Ashbeard, Elspeth Dunmore, Uisdean Fen, Old
Ambrose Duff, Renn Kestrel, Sela Voss.

Not cast, because forcing a match would be worse than a silhouette: Dags
Farrow (nothing in the set carries a bow, and he is defined by one), Ysolt
Vane (no combat skills, a stolen cloak and a ledger; every figure in the set
reads martial) and Mairwen Coll (a healer with a lute; the closest
candidate is holding a poleaxe). They keep Foundry's default silhouette.

Installing: put the `art/` folder in your Foundry user data so files sit at
`Data/salt-run-ambush/art/`, easiest via Foundry's own file picker and its
Upload button. If you put them elsewhere, change `ART_BASE` at the top of
the installer and nothing else. A missing file costs a portrait and nothing
more.

Six images went uncast and are kept in the folder, including a stout elder
with a carved staff that would make a good Riona, who never appears on-page
but is what the Beat 5 Trial is actually fought over.

## Built, by ticket

**1, the eight pregens.** All eight as `character`-type actors, from the
"Riona's Reach, Pick Your Brigand" roster: every skill with its correct
catalogue group and fighting flag, the one Expertise 2 each, both Talents
(one for Uisdean), weapons, armour, shields, plus biography, the "why
you're here" line as an individual Goal, and the at-a-glance hook as a
Personality Trait. Racial Savvy is applied where the race names a specific
skill (Grael's Endurance; Uisdean's Ancient Lore, Arcana and Melee: Light).
Humans get one Savvy skill of their own choosing and the roster does not
say which, so the six human sheets have none set; it only affects XP
spending, so it will not come up in a one-shot.

**2, Elspeth Dunmore, rebuilt as a reskin.** The first build followed
ticket 2's stat line literally and produced a civilian: Dodge 45, no
Talents, no armour, one knife. That does not survive contact with the
actual situation, because Outnumbering (p.163) gives every Engaged attacker
**+20** against a foe they outnumber. Eight brigands against Dodge 45 is not
a fight, it is a formality.

She is now a reskin of the book's own **Barbarian Warrior** (Ch.18,
Challenging), which is less invention than hand-tuning and a better fight.
Combat skills, the armour grid, Difficulty, Move and static Initiative 14
are the block's, verbatim, checked against `bestiary.json`. Her non-combat
skills and her fiction are her own from ticket 2: Survival 60, Ride 55, the
packhorse, the letter.

What actually changed at the table:

- **8 AP on body and head**, 6 to 7 on the limbs. Most PC weapons now chip
  rather than cut, and the crew has to find a limb or roll well.
- **Longbow 70, Range 4 zones.** This is the part that makes Beat 1 pay off:
  she can shoot into the Brushline or up the Scree Slope before anyone
  closes, so the ground the players prepared is ground they now cross under
  fire. Outnumbering does not apply to ranged attacks.
- **Spear 70, Reach 1.** Her "stout walking staff" was always a spear; a
  highland traveller's spear doubles as one. Reach 1 means she strikes into
  the next zone. Needs no new fiction, Beat 2 just finds out.
- **Ferocity 4**, raised from the block's 3 by the p.440 modifier for
  "defending home, kin, or sacred ground". The book's own example is a
  soldier told to hold the gate to his home city. She is carrying her
  holding's winter salt. She does not break and she does not flee.
- **Static Initiative 14**, up from ticket 2's 11. She acts before roughly
  half the crew.

Two knock-ons for the GM script, both worth a read before you run it. Beat
2's "she isn't a boss fight, she's skilled, frightened and cornered" and
its advice to have her break for the Scree path are no longer true, and
Beat 2's 45 to 60 minute budget is now optimistic. Beat 3's decision about
her life also changes character: it stops being "what did we do to a
civilian" and becomes something the crew paid for. That is what you asked
for, but the Beat 2 and Beat 3 text should be rewritten to match, and I have
not touched the GM script.

Her spear, longbow, knife and medium shield all carry their exact book rows,
and her skill groups come from the same catalogue the PCs use rather than
the bestiary builder's habit of naming a skill after the weapon.

**3, Dunchadh Reave.** `creature` type with static Initiative 10, for the
reason in point 2 above. Rapier verified against both `equipment.json` and `/tmp/tbe.txt` p.132,
exact match to the ticket, including the Dis 4 that replaces the old "5 SL,
if untracked" placeholder.

**4, the talisman.** Not an Item. A flag on his actor plus a GM-only macro,
**TBE: Dunchadh's Talisman**, to pick which effect fires or mark it
permanently disarmed. The macro does not try to auto-detect a Disarm
Maneuver's SL total, because nothing in this system tags a Combat Maneuver
result in a machine-readable way. You judge it, the macro records it.

**5, the ambush ground.** Three placeholder rectangular Regions, correctly
named and flagged with their hazard text, on a blank 3000x1600 canvas. No
map art exists in this session, so the geometry is arbitrary: drop in a
background and reposition. Deliberately not wired to auto-apply the -20s,
since Beat 2's own text treats these as something you state aloud.

**6, camp and duel.** One blank scene, no regions, reused for Beat 6.

**7, 8, 9, the trackers.** One journal holds the state, one macro drives all
three, since they are the same shape underneath (a pool or a running total
with a log). Seeded at three Favor pools of 0, Leverage 0, Trial at Crew 0
against Dunchadh 2 (the bias), Medical Supply Die at d10. The journal page
re-renders on every change, so it reads at a glance without opening the
macro. Mairwen's Heal 70 gives a Heal Score of 7, so Bedside Manner adds
+21 and she can tend 3 patients, which matches Beat 4's worked example.

**10, static Initiative.** Free: the `creature` type's Initiative field is
already used directly as the tracker formula with no roll prepended.
Setting it to "11" is the mechanism.

**11, compendium check.** All ten names grepped against every shipped pack.
Zero matches.

**12, GM Quick Reference.** Ported as-is, no edits.

## How this was verified

`pregen_check.mjs` checks the transcription against this project's own
verified sources rather than against the handout, because only you can
proof-read the handout:

- every skill name and group against the catalogue in `macros/_lib.js`, and
  every fighting flag against the real `TBE.isFighting` rule
- every Expertise against the p.53 limits table
- every weapon, armour and shield stat line against `equipment.json`,
  including that each weapon's skill matches its own book category (which is
  what caught Ambrose's longsword)
- every Talent name and category against `data/talents.json`
- race, size and the racial Toughness cap against `data/chargen.json` and
  the schema enum (Uisdean's "+2, the racial cap" is exactly right: Bolg
  Fiir carry `toughnessCap: 2`)
- Lethality Level computed by the real getter sliced out of
  `base-actor.mjs`, and effective Initiative by the real
  `prepareDerivedData` sliced out of `documents/actor.mjs`
- turn order by the real `_sortCombatants` sliced out of the init hook, for
  both the RAW outcome and the wrong one the earlier build produced
- the eight actor documents produced by running the installer's real
  `makePregens` against a stub, rather than by describing what it does
- one double-entry pass: the handout's headline numbers typed a second
  time, independently, so a single typo in either copy fails
- four mutation guards, confirming a mis-stamped skill group, an
  over-cap Expertise, a Lethality Level that does not follow from Death
  Threshold, and an off-by-one weapon line each fail rather than pass

Not verified: no live Foundry instance exists in this session, so the
document shapes are built to match the system's own DataModels and the same
`Actor.create()` pattern `TBE-Bestiary-Installer.js` already uses. The first
real run in a world is the only true test. Run it, then open two sheets and
both macros before the table.

This content lives in `adventures/`, outside `system/the-broken-empires/`,
on purpose: it is one table's one-shot, not part of what ships in
`The-Broken-Empires-System.zip`. Nothing here changes the system, and
CLAUDE.md's release verification list is deliberately left alone.
