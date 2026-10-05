# Audit sheet: RAW_S1 (variant RAW, scenario S1, ruined chapel fight)

| # | Mode | Count |
|---|------|-------|
| 1 | Foes forgotten / out of turn | 0 |
| 2 | Stat drift | 0 |
| 3 | Invented numbers | 0 |
| 4 | Soft misses | 0 |
| 5 | Macro drift | 0 (0 triggers in scenario) |
| 6 | Contract slips | 0 |
| 7 | Rule lookups mid-scene | 0 (no lookups.log) |
| 8 | State block | 94 words, about 127 tokens (94 x 1.35); sufficient to resume: yes |

## Evidence

1. Foes forgotten: none. Initiative was rolled each round (T1 d10=7, T2 8, T3 10, T4 7, all crows first), and bear, wolf1, wolf2 each rolled one attack test per round (T1-T4, 3 `TEST` lines each; T4 bear also took the crit extra action, allowed by R20). Counters (T2 bear counter on Mara's miss, T3 wolf1 counter on doom at T3 dmg) are reactions, one per round, legal. T4: after Mara's death at the bear's first bite, wolf1/bear-extra `take` lines were still applied ("applied after death, no effect on outcome"): harmless, not a foe-acting-after-its-own-death. No foe died.
2. Stat drift: none. Bear bite T3 6 +2 Dangerous When Cornered = 8 (T1, T3, T4), T2 4+2 = 6 (T2 counter, T4 extra action); cornered correctly switched on only once the bear was at 13 (<=15) after Mara's 7 dam hit. Wolf bite T2 3, T3 4, T3 counter 4: all match blocks.md. Bear 20-7=13, wolf1 10-7=3 match the Ledger HIT lines. Wolf attack applied as +3 for flanking (block: Bite +1, Pack Hunter "total +3"): read as consistent, not counted (ambiguous printed wording). Crow numbers match the Ledger takes (AD 25->0, Stamina 17->0, wounds to 10 at death).
3. Invented: `invented_candidates` empty. All dice via engine/Ledger. "four strides" (1,2)->(5,2) is arithmetic of scenario positions.
4. Soft misses: none. T2 Mara T1 miss -> bear counter 6 dam plus wolves hit. T3 doom -> sword binds, wolf1 counter 4 plus the pile-on.
5. Macro: no front trigger could fire (no outdoor Miasma rest, no village cycle, encounter d10=1). DT end on Mara's death: `ud torch` [4] no loss, `enc --en 9` d10=1 none, both pasted, sealed ledger records it.
6. Slips: none. Fiction 112/101/122/115 words (80-220), no em-dashes, no menu, no question, status line one line, no SEALED text. Minor note: three engine lines were joined with " | " in one mechanics line rather than pasted verbatim.
7. Lookups: 0.
8. State block 94 words: scene result, all three foes with Stamina and positions, front state, rulings. Sufficient: yes (crow state is in the Ledger; foes and clocks recorded).
9. Outcome: Mara dead on turn 4 (round 4); Ledger overkilled to wounds 21/10 (death at 12). Foes defeated: 0 (bear 13/20, wolf1 3/10, wolf2 10/10). Turns run: 4. DTs ended: 1 (DT 3, UD torch [4], encounter d10=1 none).

## Summary
- Handled well: foe tracking, side initiative, Dangerous When Cornered, all numbers from engine/Ledger.
- Weak spots: none counted; a minor unclear point is the wolf Pack Hunter bonus reading, and Mara's counters on foe misses were never offered.
- Contract held across four replies.
