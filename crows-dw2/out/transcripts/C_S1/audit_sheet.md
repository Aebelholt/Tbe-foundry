# Audit sheet C_S1 (variant C, scenario S1: ruined chapel fight)

| # | Mode | Count |
|---|------|-------|
| 1 | Foes forgotten / acting out of turn | 0 |
| 2 | Stat drift | 0 |
| 3 | Invented numbers | 0 |
| 4 | Soft misses | 0 |
| 5 | Macro drift | 0 |
| 6 | Contract slips | 0 |
| 7 | Rule lookups mid-scene | 0 |
| 8 | State block | 177 words, about 238 tokens |

## Evidence
1. Forgotten / out of turn (0). Foes acted only through Trade Blows (engine `test` after each crow attack). T4 and T5-crow-kill: wolf 1 died, "no foe roll". Bear, wolf 1, wolf 2 are all mentioned in T1-T6; wolf 1 stops acting after death (T4).
2. Stat drift (0). Bear 20 -> 13 (T1) -> 6 (T2) after two 7-dam hits; Dangerous When Cornered +2 applied once Stamina <= 15: bite T2 4+1+2 = 7, took 7 both turns (T1, T2). Wolf 1 10 -> 3 (T3) -> dead (T4). Wolf T3 bite 4 dam (took 4), Pack Hunter edge `--e 1` only while wolf 2 flanked (T3); T5 wolf 2 "no flank", T2 3+1 = 4 (took 4). Wolf 2 3/10 and bear 6/20 in the scene line match the damage dealt. Crow Stamina 17 / AD 3 match the Ledger.
3. Invented (0). `invented_candidates` is empty. All numbers are from tool lines or derived correctly (T6 scene line: bear 6/20, wolf 2 3/10). Narrative distances ("three paces", "a stride") are reach-setting in the fiction, which the rules allow; not counted.
4. Soft misses (0). The crow never rolled tier 1 (crow_T1 = 0, all T2), so no Move was due.
5. Macro (0). Only trigger is the DT end plus Threat clock. T6: `ud torch` rolled [2] -> EXPIRED, `enc --en 9` d10=9 -> "sign now, encounter within next DT"; both are in `sealed_ledger.md` and the state block. Threat Gray Tithe: no natural 10, no tick, stays 1/5 (correct).
6. Contract slips (0). Fiction 131/120/120/120/123/150 words. No commentary opener, no menu, no question, no em-dash, no SEALED text. Mechanics line and status line present each turn.
7. Lookups: `lookups.log` absent, `audit_auto` lookups = 0.
8. State block 177 words (about 238 tokens). Sufficient to resume without the transcript: yes. It carries position, scene line (bear 6/20, wolf 2 3/10, wolf 1 dead), Ledger numbers, torch out, pending encounter, Threat 1/5, and the live prompt.
9. Outcome. Mara alive (Stamina 17, AD 3, wounds 0/10, Slashing 1 left, torch expired). Wolf 1 killed; bear and wolf 2 fled badly hurt (not destroyed). 6 turns run. DT 3 ended once (UD rolled, EN 9 check d10=9 = sign now).

## Summary
- Handled this scenario cleanly: no tracking, math, macro or contract failures found.
- No tier 1 occurred, so the named-Move rule was never exercised.
- Only minor observation: the fleeing foes were not destroyed, which the scenario permits.
