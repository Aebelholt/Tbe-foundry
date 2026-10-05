# Audit sheet: A_S4 (variant A, scenario S4: flooded cellar, six DTs)

| # | Mode | Count |
|---|------|-------|
| 1 | Foes forgotten / out of turn | 3 |
| 2 | Stat drift | 0 |
| 3 | Invented numbers | 2 |
| 4 | Soft misses | 0 |
| 5 | Macro drift | 0 |
| 6 | Contract slips | 1 |
| 7 | Rule lookups mid-scene | 3 |
| 8 | State block | 181 words, ~244 tokens |

## Evidence
1. Out of turn: T6, razorback 1 died on the crow's T3 (3 Stamina left, 10 dam) but the Ref still rolled and applied its claws ("Ref: TEST · razorback 1 claws · +2 · [7,10]=19 → T3", take 4). T14, the longclaw died on the crow's blow (3 left, 7 dam) and its claws were still rolled. T8, a search test (crow T3 crit) with no foe move: "The creature at your hip lunges... The claws find only air", a razorback acting outside Trade Blows or a Ref move. The Ref's own ruling was "engaged foe on a killed exchange still rolled its attack (simultaneous)". No foe was lost from tracking: razorbacks 2, 3 and 4 and the longclaw are all accounted for.
2. Drift: none. Razorback 1 went 10 -7 -10 (dead). Longclaw went 20 -7 -10 -7 (dead at the T14 blow, after 3 left on T13). T5 damage: claws T2 2+1=3, spine T2 1+1=2. T6 claws T3 4. Lacerate was correctly not triggered because AD absorbed the damage. The Ledger final AD 16 matches.
3. Invented: `invented_candidates` is empty. Literal: T1 "four parallel grooves" (the scenario only says claw marks), and T14 "a dozen steps" to the stair.
4. Soft: crow T1s were T5 (spine hit 2 dam) and T12 (leader and razorback T1 rolls, no damage). T12 did change the situation, with the crow surrounded (back, flank, door). Counted 0 but borderline.
5. Macro: DT 1 (d6=4) ended on entering the ossuary, then UD torch [5] and the encounter check d10=2 (T9). DT 2 (d6=1) ended on entering the vault, then UD [3] and d10=6 (T10). DT 3 was rolled (d6=4) and left in progress when the script ended. The sealed ledger has DT1 and DT2. No natural 10, so portent 4 was not met. No violation.
6. Slips: T9 mechanics line relabeled the Ledger UD line as "Ref: UD torch..." (not verbatim; borderline). Otherwise fiction was 91-129 words, with one status line and no menu.
7. Lookups: 3 in lookups.log (T8 re-read the scenario key for areas 3 and 4 to rule a search; T9 hot card re-read at the DT 1 end, per cadence; T14 re-read the scenario end condition for the stair).
8. State block: 181 words, ~244 tokens. Resume without transcript: yes. It has the DT clock (length 4, room 5 in progress), the foe scene line with Stamina, the crow, untouched treasure, pending Ref move arithmetic and the rulings.
9. Outcome: Mara alive at Stamina 17, AD 16, wounds 0. Foes defeated: razorback 1 and the longclaw. Razorbacks 2, 3 and 4 are alive at 10/10. Script ended on 14 turns in area 5 (the stair is not reached); DT 1 and 2 ended, DT 3 in progress.

## Summary
- Weak: dead foes still attacked on the killing exchange (T6, T14), and an unrolled razorback lunge happened during a search (T8).
- Weak: two literal invented numbers (four grooves, a dozen steps), and a modified UD line at T9.
- Handled well: DT clock, UD and encounter checks, the unengaged-attack arithmetic and the sealed ledger were all correct.
