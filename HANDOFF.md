# Handoff brief — The Broken Empires Foundry system

For a fresh agent picking up `/home/claude/tbe-foundry`. Read this, then read
`CLAUDE.md` in the repo root (it's the canonical technical reference — build
pipeline, verification discipline, platform constraints). This document is
the *why* and *what good looks like*; CLAUDE.md is the *how*.

## What this project is

A native FoundryVTT system for the TTRPG **The Broken Empires**, built by
Seb for their own table, plus a companion macro pack for solo/GM play.
Character/creature sheets are pure data containers; combat, wounds,
casting, chargen and advancement all run through macros, not sheet buttons.
Only `The-Broken-Empires-System.zip` ships by default — do not build or
deliver the legacy CoC7-chassis pack outputs unless explicitly asked.

## The non-negotiable: probe before build

Every game-mechanic claim — a number, a formula, a rule's exact wording —
gets verified against `/tmp/tbe.txt` (the rulebook dump) **before** it goes
into code. This isn't a style preference, it's the whole trust model: the
user is shipping this to players who will be suspicious of a "vibe coded"
module (their words), so every macro's math has to be provably traceable to
a page and a quote. That's what `TBE: Rules Audit` exists for. If
`/tmp/tbe.txt` isn't present in a fresh session, ask before writing any new
mechanic rather than reconstructing rules from memory.

Concretely: `data/*.json` files are never hand-edited. Their source `.py`
scripts hand-transcribe from the book and self-verify every row against
`/tmp/tbe.txt` in a `__main__` block before writing JSON. A verification
step isn't done until you've deliberately broken the data it checks and
watched the check fail (mutation testing) — this caught real bugs this
session (a wrong talent name, an over-strict count check) before they
shipped.

## The user's quality bar, in their own words

> "having things go nowhere on the sheet is an embarrassment... when I say
> follow the flow it's player perspective, effects of buttons necessary
> information where relevant and all that."

This is the standing bar for every macro/wizard/sheet interaction. In
practice it means:

- **No dead inputs.** Every field a player fills has to reach the actor or
  change something. Trace it from the DOM through to `commit()`/the write.
- **Player preparedness.** Can this field be answered with what the player
  knows *at this point in the flow*? Does the screen show the state needed
  to decide (current value, cap, remaining pool), or does it leave them
  guessing?
- **Nothing vanishes.** If a player needs a piece of information later
  (why a stat is what it is, how many picks they have left, what a prior
  step decided), it has to still be visibly reachable then — not buried in
  a chat message that scrolled past, not a one-time toast, not something
  only visible on a different tab/macro than the one they're using.
- **Root cause over workaround.** When something reads wrong, fix the thing
  that's actually wrong, not a compensating value elsewhere. Direct
  correction from this session, on map-scale calibration: *"I feel like we
  really not getting each other. i want one hex to represent 10 miles on
  the map, as the rules say? it's not the measurement we should change we
  should work out the hexes so that the map aligns with the travel?"* — I
  had been adjusting Distance to make readings "come out right" while
  Grid Size stayed wrong; the fix belonged on the variable that was
  actually broken. Apply this generally: don't paper over a wrong number
  with a compensating one.
- **Concise, not empty.** A wall of text (e.g. a chat card dumping every
  applied modifier in one long list) is a real complaint, not a nitpick —
  *"this is an eye sore, not elegant... Relevant and succinct should be the
  guiding principles."* But trimming for concision must never delete the
  only copy of information a player might need — persist it somewhere
  durable first (an actor flag, a proper tab), then shrink the transient
  display to a headline with a pointer to where the rest lives.
- **Distinct responsibilities, no drifting duplicates.** When one macro
  serves two different purposes by a toggle (chargen picks vs. paid
  advancement, say), that reads as "confused programming" even if it
  technically works. Prefer clearly separated tools with a single shared
  implementation of anything that must stay in sync (put it in `_lib.js` as
  a `TBE.*` helper, not copy-pasted per macro) over one dual-purpose macro
  or several hand-copied near-duplicates.

## Definition of done for any change

1. Verify the mechanic against `/tmp/tbe.txt` if it's new or changed
   (grep the exact passage first, don't reconstruct from memory).
2. `node -c <file>.js` on every edited macro.
3. Run the regression suites and keep them green: `node simtest.js` (51+
   tests), `node magic_check.mjs`, `node cast_check.mjs`,
   `node enforcement_check.mjs`, `node finish_check.mjs`,
   `node wizard_visual_check.mjs` (screenshots real DOM interaction —
   required after any `tbe-character-wizard.js` change).
4. Walk the flow as a player would, not just as a test suite: is the right
   information on screen at the point a decision is made? Does a button's
   effect show up anywhere the player will actually look?
5. Re-run the build pipeline in order (source `.py` → `_docs.json`
   builders → `node build.js` → `node build_packs.mjs`) — see CLAUDE.md for
   exactly which stages a given change touches.
6. Bump the version in `system.json`, add a dated `CHANGELOG.md` entry, and
   update `BACKLOG.md` (mark fixed items `~~struck~~`, log anything newly
   found but not yet built — don't let findings evaporate).
7. Rebuild and deliver `The-Broken-Empires-System.zip` via SendUserFile.
   Don't just describe a fix — ship the file.
8. If a change trims a display for concision, confirm nothing it used to
   show is now unrecoverable. If it is, persist it somewhere first.

## How feedback tends to arrive

The user plays at their own table and also reads code directly — this
session included a full independent root-cause write-up from them (or a
tool they ran) that was more precise than my own first pass on one of the
four points. Expect specific, technically literal bug reports, not just
vibes. Take them at face value and verify in the actual files before
proposing a fix; when their diagnosis and mine differ, re-check rather than
defaulting to either. Cross-referencing two independent read-throughs of
the same code is how the sharper root cause (Finish Character's checkbox
re-render bug, not the Wizard's read-only step) got found this session.

## Where things stand (v0.17.0)

Shipped this session: Rules Audit journal (v0.16.0), Journey Leg day-rate/
forced-march fix (v0.16.1), and a four-part chargen/Finish Character pass
(v0.17.0) — auto-launch reliability (`TBE.runMacro` with a compendium
fallback), a real either/or auto-grant bug in career Talents, a Talent
checkbox re-render bug in Finish Character, a free-Talent-pick-count
display, shared Talent-eligibility logic, and a new Summary tab on Finish
Character backed by a `chargenLedger` actor flag so the chat card can be
short without deleting information. Full detail in `CHANGELOG.md` and the
new "Chargen/Finish Character — v0.17.0" section of `BACKLOG.md`.

**Open thread, not yet confirmed by the user**: a large multi-tile
reference map (hexmarch) was being calibrated so Foundry's Ruler reports
real miles against the book's "1 hex = 10 miles" rule. Landed on
recommended values **Grid Size = 56px, Distance = 10, Units = mi**, derived
from two self-consistent live ruler readings — but the user has not yet
verified this reads 500 miles across their actual printed scale bar. Confirm
this before treating it as settled; if it's off, the lesson above applies —
solve for Grid Size, never Distance.

**Logged, not built** (see `BACKLOG.md` for full detail per item):
- Terrain-based Journey movement table (Ch.12 p.203, explicitly optional
  in the book, so not a compliance gap, just an unbuilt richer mode).
- `parse_talents.py` has no self-verification step, unlike every other
  data extractor — a known, tracked gap.
- Finish Character's free-Talent-pick count is informational only, not a
  hard gate (consistent with how Life Events/Shared History/Relationship
  NPCs are already handled: shown, not enforced).
- `system.concept` isn't a real actor schema field, only inside the new
  ledger flag and (optionally) `system.notes`.
- Rituals/Summoning/Enchantments/Alchemy, Counterspells, Weave Scar/Reality
  Snag duration tracking, Arcane Tether — larger unimplemented chapters,
  see `BACKLOG.md`'s own section headers for chapter references.

## Suggested next-pass approach

**Read `BACKLOG.md`'s "MVP scope" section first — it supersedes the
open-ended audit mode described below.** Seb set the bar explicitly after
four audit rounds and a live playtest: not "every rule automated," but
*the module must never look like it did something it didn't, and where it
genuinely isn't automating something, it has to say so.* Findings are
tiered there (Tier 0 silent failures, Tier 1 cheap batched corrections,
Tier 2 conscious defer). Work that list in order; don't restart a general
audit. The preferred fix shape is also settled: print the number where the
human making the next roll will see it, rather than building a
cross-cutting automation layer to consume it.

The audit process below is how those findings were produced, kept for
reference and for macros not yet covered.

Given the standing quality bar is fundamentally "walk it as a player, not
just as a test," a good next session is a deliberate flow-audit pass over
macros that haven't had one recently: pick one (Attack, Wounds & Recovery,
Cast, Social Encounter, Advancement), read it start to finish as if sitting
at the table, and apply the same six checks CLAUDE.md already codifies
("What correct means here, in priority order") — step fidelity, no dead
input, player preparedness, book values actually reaching the actor, table
adoption over hand-typed tables, then the mechanical test suite. That
ordering matters: the mechanical suites already pass today and would keep
passing on every bug found this session, because none of them ask the
player-experience questions. Bugs worth finding will look exactly like the
ones fixed this session: technically working code that still leaves a
player stuck, guessing, or silently shortchanged.
