# Audit sheet: D_S1_r1 (variant D, scenario S1)

| # | Mode | Count |
|---|------|-------|
| 1 | Foes forgotten / out of turn | 0 |
| 2 | Stat drift | 1 |
| 3 | Invented numbers | 0 |
| 4 | Soft misses | 0 |
| 5 | Macro drift | 1 (of 1 trigger: Threat tick on natural-10 encounter check) |
| 6 | Contract slips | 2 (procedural, see below) |
| 7 | Rule lookups | 0 (no lookups.log) |
| 8 | State block | 164 words, ~221 tokens; sufficient: yes |

## Evidence
1. Forgotten foes: none. Side initiative rolled every round (R1 3, R2 5, R3 9, R4 3). Bear acted R1, R2; wolves moved in R1 and R2 ("spent the round closing", plausible for far wolves speed 7); R3 wolf A died before the enemy side, bear fled (F31), wolf B attacked; R4 wolf B attacked and died. No foe acted after death.
2. Drift (T4): wolf B's bite total 5 from dice [2,2] was called "natural 2 ... a doom", and the counter was applied at T3 (10) instead of T2 (7). Rules: doom is natural dice 2-3 (sum), [2,2] sums 4. No effect on the outcome (wolf had 3 Stamina) but the tier was misapplied. Bear Stamina (20 to 13 to 3), bite T2 4 dam, wolf +1 (no Pack Hunter with only one wolf), Dangerous When Cornered not triggered before the bear's last attack: all correct.
3. Invented: audit_auto candidates empty. All numbers trace to engine/Ledger/blocks. The counters (7) are derived from the Ledger row (t2 4 + S 3), correct.
4. Soft misses: Mara's only T1 (T1 attack miss) cost 4 dam from the bear's counter bite. No non-attack T1 occurred, so no `Move:` was required. 0.
5. Macro: natural 10 on the DT 3 encounter check ticked The Gray Tithe to 2/5 (1 tick, under cap 2), written to sealed_ledger.md and state_block. The fiction showed the encounter (dragging chain) but no Foreshadow/Advance move for the Threat itself. Counted strictly as 1 (not shown in fiction). UD rolled and encounter check made at DT end: yes.
6. Slips: (a) T1 Mara's attack run without `--exp` though the player asked for expertise on a T1 (Ref admitted "Ref slip"); the result stood. (b) T4 a Ledger attack roll [10,1] was rolled in the same batch before the wolf's roll and went unused (Mara's action never came). Replies were 122, 149, 157, 158 words (in range), no opening commentary, no menu, no SEALED text.
7. Lookups: 0.
8. State block 164 words x 1.35 = ~221 tokens. Sufficient: yes. It has scene, Ledger numbers, foe status, threat state, pending encounter, live prompt; the attack row is in ledger_state.json.
9. Outcome: Mara Stamina 17, AD 17, wounds 0/10, torch UD 1. Wolves A and B dead; bear fled at 3/20 (alive). 4 turns/rounds. DT 3 ended (UD 1 to 1, encounter ENCOUNTER NOW, d10=10).

## Summary
- Handled well: side initiative, counters, stats and Ledger tracking, clean DT end.
- Handled badly: a misread doom (T3 counter instead of T2) and two procedural slips (expertise not passed, unused roll).
- Threat tick recorded in the sealed ledger but not shown in the fiction.
