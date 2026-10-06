# Changelog: system layer v1 to Amendment 1

Source of every change: `crows_01_system_layer_amendment.md`. Evidence: `results.md` (Phases 1 to 3), `phase1_report.md`, `sim/`, `transcripts/`.

## Changed

| Where | Was | Now | Why |
|---|---|---|---|
| §5, imported layer | Stonetop fronts with portents, 1–3 live, armed triggers | DW2 Threats (8 fields, sized by Developments) with **ticks** from three printed Crows clocks, cap 2 per session | Macro drift was the failure mode with the least structure: fronts had no tick rule, so nothing said when a portent moved. Ticks make it mechanical. Sim: a 4–6 Development Threat completes in 2–5 sessions at least 99% of the time in the central case (`sim/threat_ticks.csv`) |
| §9, new §9a | none | Combat housekeeping: dead foes struck from the scene line first; every foe attack has an engine line; one scene line per round | Trials: dead foes still rolled; foe attacks narrated with no roll (C1 audits; D_S5) |
| §9, new §9b | "Social (R6)": NPCs respond by personality, Mind test only when the Ref wants dice | Same trigger, plus **Pull Strings** and **Sense Motive** as Mind tests with tier menus | Crows prints little social procedure (runs_ABC). Both moves ran as printed in C and D (S2b), at tier 2 only |
| §9, new §9c | a soft "setback at the Ref's discretion" on tier 1 (§1) | A named **Ref move card** for tier 1 results with no printed result | Soft misses: the card produced a named, concrete move every time it applied in S4 (D: 2 of 2; C and C1: 4 to 7 per trial) |
| §9, new §9d | none | **Precedence rule**: printed Crows rule, then this layer, then DW2 text; plus eight specific overlaps | runs_ABC flagged the seam risk where Crows conditions and DW2 consequences overlap |
| §13 | Standing pressure had no Threat line | Adds a per-Threat line with d/n and ticks this session | One owner per fact (§15.1): the sealed file owns the Threat, the SAVE carries the count |
| §15.8 | sealed ledger line shapes unspecified for ticks | Adds `Threat <name> d/n: <what>` and `tick held (cap)` | Macro drift audits: a tick in the ledger but not in the fiction (D_S1, D_S4_r2) |
| Hot card | "You own: the fronts" and no social, card or tick lines | Three new "at a glance" lines, four new "Never" lines, "Threats" for "the fronts" | The hot card is what the Ref re-reads; the rules above only help if they are on it |

## Not changed, and why
- **§9 combat (grid, side initiative, turns, counters, reactions).** Your runs_ABC brief called for replacing it. The evidence did not support the swap:
  - **Phase 1.** Run A and C combat passes 4 of 8 pairings for the starting crow and 1 of 8 for a 5,000 TXP crow (within 15% of RAW on death rate and damage taken). A levelled crow takes 40 to 60% less damage than under RAW, and group fights (a swarm) run too soft. Run B fails on lethality (0% death for the starting crow against the bear and undead C, 97% against Bear Cave).
  - **Phase 2.** A, B and C needed 35 to 40 replies for five scenes against RAW's 24, and added forgotten-foe errors tied to the unengaged-foe rule (A: 4, C: 9; C1, which fixes that rule, still had 6 in four S4/S5 runs).
  - **Phase 3.** The repetitions put run-to-run noise at the size of the effect (C's S5: 7 forgotten foes, then 0 on identical rules).
- **The engine.** No required change. The engine already does side initiative, monster tests, encounter checks and cycles.
- **Chassis.** No edit. A Threat's ordered Developments are the "portent sequence written before it can fire" the chassis asks for.
- **Crows XP, Prosperity, Miasma, UD and travel.** Untouched. Threats ride on these clocks.

## Not imported from DW2 (on purpose)
XP marks on a 6−, Depth and Bonds, marked Conditions and Bloodied as mechanics, HP, Treasure, the full DW2 move list, grid-less combat, fiction-first combat moves (Trade Blows and the Battle Moves, FA p.12; MR p.2).

## Decisions of record
1. **Mind** stands in for DW2's CHA and WIS in the social moves (Crows has no social characteristic, R6; layer §1). Confirmed by you when you followed my recommendation.
2. **Natural 10 on an encounter check** is the third tick clock (R14). You replaced "doom on an encounter check" in your brief with this.
3. **Cap of 2 ticks per session.** You kept it.
4. **"Session"** is a LOAD to SAVE span (§15.7). My definition, not in either rulebook.

## Open items
- **Untested in the trials:** Pull Strings and Sense Motive at tiers 1 and 3; the starting crow; sessions longer than one SAVE span; real Player input (the Player was a script).
- **Unsourced default:** 1d6 for card-move damage with no printed source (§9d.4).
- **DW2 conditions.** I could not find DW2's tier-by-tier effect for marked Conditions beyond the penalties on FA p.7. None is imported.
- **Threat pace at slow tables.** At 4 DTs a session and rare Miasma rests a 6-Development Threat can take over 5 sessions (floor 31%). If your pace is slower than the central case, use fewer Developments.

## Optional engine additions (not required; each would remove a hand-kept number)
These follow from the audits, where the Ref kept a count by hand and lost it. They are proposals, not part of Amendment 1.
- **`tick <threat> [source]`.** Stores `d/n` and the session tick count, refuses the third tick, prints the sealed-ledger line. Conflicts with the engine README's "sealed file owns fronts and clocks", so it needs your OK.
- **`moon`.** See `weird_wyld_notes.md`.
- **Foe roster.** A `foe` command that stores each foe's Stamina and position, so the scene line is not hand-kept (audits: forgotten foes and stat drift were the largest error classes in the hybrid variants and recurred in D_S5).


## Amendment 2 and v1.1 (added after you approved "all useful elements")
- **`crows_01_system_layer_v1.1.md`** is the layer with Amendment 1 applied (research parentheticals removed) and a new **§16 wilderness supplement**. `crows_06_hot_card_v1.1.md` carries the patch. The v1 files are unchanged.
- **§16 / engine.** `engine/tables_wyrd.json` (33 tables, 681 entries, paraphrased from *Into the Wyrd and Wild*, private use) plus three engine commands: `day`, `moon` (and `travel --moon`), `hunt`. The moon EN adjustment, the hazard RR stats and damage dice, and the disease procedure are HOUSE conversions and are marked so.
- **`03_director_sealed_template.md`** with three Threat seeds from W&W factions (The Night Summons, The Changeling Tithe, The Sorrow-Hunt), a patron, and the hunts note.
- **`tools/extract_sources.py`** rebuilds `crows/src/*.txt` from your own HTML books with the PDFPAGE markers the index expects. **`tools/assemble_layer.py`** rebuilds v1.1 from v1 and the amendment.
- **`engine/ledger.py`** gains `init custom`, `rest` and `set` so it can run a real campaign, not only the trial crows.
- **Not done:** bestiary conversion (needs Crows stat blocks; see §16 "Not imported"), the wilderness-dungeon hex generator, Magic of the Wyrd.
- **Untested:** all of the above. The trials covered Amendment 1 only.


## Amendment 3 and v1.2 (from Pilot 01)
- **Layer v1.2** appends §17: Ledger-rolled crow dice in the open (player override, `pool`, `void`), one reply per round, a `Maneuver?` prompt before foes act, clever-plan rule, card-move fiction check, no authored crow interiority, `pos`, `--note` for secrets, split SAVE, telegraph beat, night travel HOUSE ruling, F6/F1 note, session-zero pack placement.
- **Hot card v1.2** carries the combat round and the new Nevers.
- **Engine and Ledger.** Ledger v2 (pack slots, wounds in slots, `pool`, `void`, `weapon`, `book`, `cond`, `rest` with `ud_norest`, `set`, blank-stat refusal). Engine: unknown flags rejected before any roll, `--why` lint, `enc --travel`, `travel --part`, cycle-end prompt, `pos`.
- Untested in play. Re-run the pilot checklist.


## Cards
- `tools/extract_cards.py` builds `crows/src/cards.json` (128 cards incl. all 28 spellbooks) from the user's card PDFs; `engine card NAME|list|spells` prints them. Spell result rows can lose the `≤11` column header in extraction; the PDF page is the check.
