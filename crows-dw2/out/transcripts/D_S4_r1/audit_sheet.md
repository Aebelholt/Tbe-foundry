# Audit D_S4_r1 (variant D, S4)

| # | Mode | Count |
|---|------|-------|
| 1 | Foes forgotten / out of turn | 0 |
| 2 | Stat drift | 0 |
| 3 | Invented numbers | 0 |
| 4 | Soft misses | 0 |
| 5 | Macro drift | 0 (flag: no extra check after loud explosion/fight) |
| 6 | Contract slips | 0 |
| 7 | Mid-scene lookups | 1 (hot card re-read at DT 1 end, per cadence; not a rule lookup) |
| 8 | State block | 181 words, ~244 tokens; sufficient: yes |

## Evidence
1. Side initiative rolled every round (turns 4-12: 9,8,9,9,7,3,4,9,3). Crows-first rounds: Mara acts, then razorback 1 claws, 2 spine, 3 spine. Enemy-first rounds (turns 9, 10, 12) foes act, then Mara. Counters on melee misses (turns 4, 6, 11) are reactions on top of the foe's turn, per RAW. Foe crit on turn 5 (razorback 3 [9,10]) gave the extra action, engine-rolled. Razorback 1 died by Mara's counter on turn 10 before 2 and 3 acted; razorback 2 died to the doom counter on turn 11 before razorback 3 acted; razorback 3 died turn 12. No dead foe acted. Razorback 1 opening the chest and attacking in the same round (turn 7) is maneuver plus action. Note: Mara's declared non-attack actions on turns 10 were not resolved (prone stand-up folded into the counter), minor.
2. Damage checked against blocks.md and the Ledger: A claws T2 2, T3 4; spine T2 1, T3 3; Stamina 10 each. Razorback 1 10 to 3 (7 dam, Ledger T2 4+S3), destroyed by counter 7; razorback 2 destroyed by doom counter 10; razorback 3 destroyed by crit 10. Lacerate correctly not applied (turn 6 claws T3 4 dam was fully absorbed by AD, no Stamina or wound). Crow log: AD 25 to 0, Stamina 17 to 0, wounds 3, all matching take lines. Embers trap: Mara RR T2 -> engine read "4 dam" (AD 4 to 0); razorback 1 RR T3 no effect; razorbacks 2 and 3 outside the room.
3. `invented_candidates` empty. Derived 7/10 dam and Stamina totals are Ledger plus S arithmetic and correct. 60 gc from scenario.
4. Crow tier 1s: attack misses (turns 4, 6, 11) keep the printed result, each with a concrete counter that took Stamina or AD. Non-attack tier 1s: turn 8 search `Move: Take something away` (coins scattered into the pool), turn 9 slip `Move: Have it backfire` (Mara prone). Both named on the mechanics line, not the same move twice. Soft misses 0.
5. No Threat triggers (no Miasma rest, no village cycle, no nat 10); sealed ledger records no tick. DT 1 end: UD torch [4] 1 to 1, then encounter d10=6 vs EN 9 none, written to ledger; DT 2 length rolled. Flag only: the printed "loud acts force an extra check" was not applied after the exploding chest and the fight; not counted.
6. Fiction 123-151 words per turn (turn 14 about 160). No menus, no `SEALED:`, status line each turn, ends on live situation. Observation only: turns 1-3 and 13-14 are quiet runs, but they are the scripted search and walk turns.
7. lookups.log: 1 line, hot card re-read after DT 1 as the rules cadence requires.
8. state_block.md covers Mara's Stamina/AD/wounds/UD, DT 2 progress (rooms rolled 6, 3 used), razorbacks destroyed, trap spent, unvisited rooms and the undead B and A in area 5, Threat 1/5, live prompt. Enough to resume.
9. Outcome: Mara alive, Stamina 0/17, AD 0, wounds 3/10, torch lit UD 1, 60 gc recovered; 3 razorbacks (undead A) destroyed; 14 turns; 1 DT ended (DT 2 under way, 3 of 6 rooms). Areas 4-6 not reached.

## Summary
Side initiative, counters, foe crit/doom and printed features were all applied correctly with engine-backed numbers.
Named Moves were present on both non-attack tier 1s.
Only weak spot: no extra encounter check for the loud explosion/fight (flag, not counted) and one unresolved scripted action.
