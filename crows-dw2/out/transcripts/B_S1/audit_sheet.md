# Audit sheet: B_S1 (variant B, scenario S1, chapel fight)

| # | Mode | Count |
|---|---|---|
| 1 | Foes forgotten / acting out of turn | 0 |
| 2 | Stat drift | 0 |
| 3 | Invented numbers | 0 |
| 4 | Soft misses | 0 |
| 5 | Macro drift | 0 (Threat: 0 triggers fired) |
| 6 | Contract slips | 4 |
| 7 | Rule lookups mid-scene | 0 (no lookups.log) |
| 8 | State block | 136 words, about 183 tokens |

## Evidence
1. Forgotten: none. Bear, wolf 1, wolf 2 each tracked to death (T1-T4); foes acted only inside Trade Blows exchanges. Wolves repositioned in fiction only (T1 "slide wide along the pews").
2. Drift: none. Bear bite 4 at Stamina 20 (T1) and 6 at Stamina 10 (T2, Dangerous When Cornered, +2) match blocks.md; wolf bite 3 (T3, T4) matches. Crow max damage 10 = Ledger T3 7 + S 3 (ledger.py attack formula); bear 20 -> 10 -> 0, each wolf 10 -> 0 consistent. AD figures match ledger take lines. (If the Ledger's t3=7 were read as already final, the kills would not follow; I took the ledger.py formula as authoritative.)
3. Invented: audit_auto candidates = none. The "10" is derived (7+3). No unsourced die results.
4. Soft misses: none, all four Trade Blows were T3.
5. Macro: DT 3 end rolled `ud torch` (1->0 EXPIRED) and `enc` (d10=7 vs EN 9, none); both in sealed_ledger.md with "Threat Gray Tithe 1/5: no tick". No trigger fired.
6. Slips (4): T1-T4 mechanics line is hand-composed, not a pasted engine line, with bookkeeping and numbers, e.g. T2 "Ref: Trade Blows (bear): inflict max damage (10), the bear dies (Stamina 10 to 0); ... Dangerous When Cornered, suffers 6 (AD)". T4 also splices the encounter result into it. Fiction lengths 113-192 words, one status line, no questions, no menu: fine.
7. Lookups: 0.
8. State block: 183 tokens. Sufficient to resume: yes (positions, foes dead, torch out, Threat 1/5, rulings, live prompt; crow numbers are in the Ledger).
9. Outcome: Mara alive, Stamina 17/17, AD 9, torch expired; bear and both wolves dead; 4 turns; 1 DT ended (DT 3).

## Summary
- Combat tracking and stat use were clean, DT end handled correctly.
- Main weakness is the mechanics line: composed Ref: lines with damage numbers and rule commentary on every turn instead of pasted engine lines.
- Script pointer ran ahead of resolution (noted by Ref), no effect on outcome.
