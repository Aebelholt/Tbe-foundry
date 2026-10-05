# Audit sheet: RAW_S4 (variant RAW, scenario S4, flooded cellar, six DTs)

| # | Mode | Count |
|---|------|-------|
| 1 | Foes forgotten / out of turn | 0 |
| 2 | Stat drift | 0 |
| 3 | Invented numbers | 1 |
| 4 | Soft misses | 0 |
| 5 | Macro drift | 0 (0 triggers) |
| 6 | Contract slips | 0 |
| 7 | Rule lookups mid-scene | 0 (no lookups.log) |
| 8 | State block | 173 words, about 233 tokens (173 x 1.35); sufficient to resume: yes |

## Evidence

1. Foes: initiative every round (R1 d10=6, R2 9, R3 10, R4 8, R5 8, all crows first). R1: A#2 [8,1] and A#3 [9,3] both acted (A#1 killed by Mara's crit before acting). R2: A#2, A#3 acted (T7). R3: A#2, A#3 acted (T8). R4: A#2, A#3, vault A#4, vault B all acted (T9, four test lines). Round 5 (T10) was not run for foes: "Scenario stop condition met", per the scenario's "run until Mara reaches area 6": noted, not counted.
2. Drift: none. A T2 = 2 dam (T1 R1, T7, T8), A T3 = 4 dam (R3, R4), B T2 = 3 dam (R4): all match blocks.md. Lacerate correctly withheld when AD absorbed the T3 hit (T8, T9). A#1 10-10 and A#2 10-7=3 match Ledger hits. Crow AD 25->4, Stamina 17 match the Ledger.
3. Invented: `invented_candidates` empty. Counted 1: T10 "a lead of a single stride, perhaps two", a mechanically relevant pursuit distance asserted with no `dist` or map call. Flavour counts (four furrows, two razorbacks) not counted.
4. Soft misses: Mara's only T1 (search in darkness, T8 [2,2]=4 double bane) had concrete cost: search cut short, ring not found, claws hit, a foe climbs the shelf behind her. No attack T1s.
5. Macro: no front trigger (no natural 10: encounter d10 3 and 5). DT1 ended T7 (4 rooms): `ud torch` [2] torch expires, enc d10=3 none. DT2 (d6=2 rooms, rolled openly T8) ended T10: UD `[]` expired, enc d10=5 none. Sealed ledger records both checks. Only 2 of 6 DTs run because the stop condition (area 6) was reached.
6. Slips: none. Fiction 105/117/114/107/117/122/123/120/131/113 words, no menu, no question, no SEALED text. Four quiet turns T1-T4 (hot card "no two quiet turns") not a listed slip. T9 fiction shows 4 hits where 3 landed (A#4 missed): narrative inconsistency, not a number.
7. Lookups: 0.
8. State block 173 words: Ledger numbers, all four foes with Stamina, treasure untouched, clocks, live prompt. Sufficient: yes.
9. Outcome: Mara alive, Stamina 17, AD 4, wounds 0, torch expired. Foes destroyed: 1 (Undead A #1); A#2 at 3/10, A#3, A#4 and Undead B 20/20 pursue. Reached area 6 at end of DT 2. Turns 10; DTs ended 2.

## Summary
- Handled well: per-round side initiative, all foes tracked, feature (Lacerate) correct, DT/UD/encounter procedure and the d6 rooms roll via engine.
- Weak spot: one asserted pursuit distance with no engine call; four quiet opening turns.
- No stat drift or macro slips.
