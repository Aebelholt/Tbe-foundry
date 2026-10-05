# Audit sheet: A_S5 (variant A, scenario S5: undead swarm in a corridor)

| # | Mode | Count |
|---|------|-------|
| 1 | Foes forgotten / out of turn | 0 |
| 2 | Stat drift | 1 |
| 3 | Invented numbers | 0 |
| 4 | Soft misses | 0 |
| 5 | Macro drift | 0 (no trigger) |
| 6 | Contract slips | 1 |
| 7 | Rule lookups mid-scene | 0 |
| 8 | State block | 126 words, ~170 tokens |

## Evidence
1. Out of turn: none. The unengaged-attack arithmetic was correct every exchange: T2 and T4 (5 unengaged -> 2 attacks), T6 to T10 (4 -> 2), T12 (3 -> 1), T15 and T16 (1 -> 1). The foe on a killing blow made no attack: T13 and T14 rolled none. T5 rolled the U1 claws and voided it (no damage, not counted as acting; see 6).
2. Drift: T5 fiction says "the ticking of the other three" when four undead (U3 to U6) were alive besides U2. All damage values were correct (claws T2 2+1=3, T3 4; spine T2 1+1=2, T3 3; Lacerate not triggered while AD absorbed). Wound spill matches the Ledger (T12: Stamina 4->1->0, wounds 0->2). Foe T3 crit gave no extra, per the ruling. Crow death at wounds 11/10 matches the Ledger.
3. Invented: `invented_candidates` is empty. All numbers trace to tool lines; "a hand's width" and "a claw's length" are idioms.
4. Soft: crow T1s on T2, 4, 6, 7, 8, 10, 12, 15 and 16 all had concrete damage from the foe rolls.
5. Macro: no front trigger fired (no encounter check, no rest, no cycle), and the fight never reached a DT end. The sealed ledger says "no ticks".
6. Slips: T5 mechanics line altered the engine line with "(void, target already down)", so it was not verbatim. Other replies were 79-117 words of fiction (T3 is 79, borderline), with one status line and no menu.
7. Lookups: no lookups.log, so 0.
8. State block: 126 words, ~170 tokens. Resume without transcript: yes. It has the crow dead, the foe scene line (U5 and U6 alive at 10/10), the rulings (dim light bane, voided roll, spine as the move) and the next step (a new crow).
9. Outcome: Mara dead on turn 16 (wounds 11/10). Foes defeated: U1, U2, U3 and U4 (4 of 6); U5 and U6 alive at 10/10. 16 turns; 0 DTs ended.

## Summary
- Handled well: per-exchange foe attacks and the ceil(unengaged/3) rule were computed correctly, and the damage tiers were applied correctly all fight.
- Weak: one fiction head-count error (T5) and one non-verbatim engine line (T5).
- The bane on every crow attack from "dim light" was a logged ruling, applied consistently within this trial but not in S1 or S4.
