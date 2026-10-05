# Audit sheet: B_S5 (variant B, scenario S5, corridor swarm)

| # | Mode | Count |
|---|---|---|
| 1 | Foes forgotten / acting out of turn | 0 |
| 2 | Stat drift | 13 |
| 3 | Invented numbers | 0 |
| 4 | Soft misses | 1 |
| 5 | Macro drift | 1 |
| 6 | Contract slips | 13 |
| 7 | Rule lookups mid-scene | 1 |
| 8 | State block | 97 words, about 130 tokens |

## Evidence
1. Six razorbacks tracked every turn (T1 "two ... four more", T4 "three more behind", T9 "fifth ... sixth behind"); none acted outside Trade Blows; counts add up to six.
2. Drift (13, turns 2-14): crow damage applied as T3 = 7 and T2 = 4 ("max damage dealt (7)", T4 and T8, T9 "4 dealt"), i.e. without the stat. The Ledger formula (ledger.py attack: T2/T3 + S) gives T3 = 10, T2 = 7, as S1 and S4 used. Result: each razorback needed two hits, 14 turns. Foe damage 2 matches blocks.md; AD lines match the Ledger. Caveat: if t2=4/t3=7 in ledger_state.json were read as final damage, S5 would be right and S1/S4 wrong.
3. Invented: none (no candidates); the damage figures are derived, scored as drift.
4. Soft (1): T2 stray `ledger.py attack` returned T1 MISS [2,6]=11; the Ref disregarded it as a mis-invocation and rolled `move` instead (effectively a re-roll). No consequence for the T1.
5. Macro (1): the fight cleared (all six dead) but no DT end followed: sealed_ledger "DT d6 clock not rolled; DT 1 not ended"; no UD roll, no encounter check although the status line says DT 1 and the torch is mentioned guttering (T4, T6, T7). Arguable because the scenario names no DT clock. No Threat trigger fired.
6. Slips (13, T2-T14): the mechanics line is a composed `Roll: Trade Blows . S . MOVE ... max damage dealt (7), 2 suffered` result line; `Roll:` is reserved for a roll request that waits, and it carries numbers not pasted from an engine line. Fiction 94-130 words, status line present, no questions: fine.
7. Lookups (1): T2 re-read rules section B (Trade Blows 10+ choice) and the Undead A block.
8. State block: 130 tokens. Sufficient: yes, barely (crow numbers, foes dead, DT status, Threat); damage ruling and rulings live only in sealed_ledger.md.
9. Outcome: Mara alive, Stamina 16, AD 0, wounds 0, torch lit; all six undead A destroyed; 14 turns; 0 DTs ended.

## Summary
- Crow damage was understated from the Ledger on every exchange, which stretched the fight.
- Mechanics line misused as a result summary on every exchange.
- DT never ended after the fight cleared; a wrong-command T1 roll was discarded.
