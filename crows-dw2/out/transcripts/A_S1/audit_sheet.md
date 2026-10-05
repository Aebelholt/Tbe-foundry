# Audit sheet: A_S1 (variant A, scenario S1: ruined chapel fight)

| # | Mode | Count |
|---|------|-------|
| 1 | Foes forgotten / out of turn | 1 |
| 2 | Stat drift | 0 |
| 3 | Invented numbers | 1 |
| 4 | Soft misses | 0 |
| 5 | Macro drift | 0 (no trigger fired) |
| 6 | Contract slips | 0 |
| 7 | Rule lookups mid-scene | 0 |
| 8 | State block | 122 words, ~164 tokens |

## Evidence
1. Forgotten/out of turn: T4 (borderline). Wolf B is narrated acting with no engine roll: "The second wolf is snapping at her calf, pinning her low." The T4 Ref move went to the bear (unengaged count 2, ceil(2/3)=1 attack). Everything else checks: T2 and T3 unengaged attacks were one each; the T5 dead bear made no attack; a crit gave an extra exchange.
2. Drift: none. Bear 20 -1 (10) -7 = 3, killed by a 10 on T5, matches the Ledger. Dangerous When Cornered (+2) applied at 10 Stamina on T1 (6+2=8, then 4+1+2=7). Wolf damage 3+1 and 4, Ledger takes and AD spill (AD 2->0, Stamina 17->15) are correct. Pack Hunter edge was used on T3 (wolf B) and T4 (wolf A) only.
3. Invented: `invented_candidates` is empty. One literal item: T4 "three paces off" (bear distance with no engine `dist`).
4. Soft: crow T1s on T2 (wolf bite 4), T3 doom (fall, armor gone, two bites), T4 (shoulder bite 4, pinned low). All concrete.
5. Macro: no front trigger met. DT 3 end rolled UD torch [4] and the encounter check d10=4 vs EN 9 (none); the sealed ledger records it. Not a violation.
6. Slips: none. Fiction was 114-147 words per reply, no em-dashes, one mechanics line, one status line, no menu or SEALED text.
7. Lookups: lookups.log is empty.
8. State block: 122 words, ~164 tokens. Resume without transcript: yes. It has the scene, both wolf states, the crow's numbers, clocks, live prompt and rulings; weapon rows are in the Ledger.
9. Outcome: Mara alive at Stamina 11/17, AD 0, wounds 0. Bear dead; both wolves fled uninjured (10/10). 6 turns. DT 3 ended (UD torch 1->1, enc none).

## Summary
- Handled well: the foe loop, the unengaged-attack arithmetic and the Dangerous When Cornered timing were all correct, and the DT end was clean.
- Weak: wolf B has one unrolled "snapping" action on T4, and there is one engine-less distance ("three paces").
- Overall a clean run for A in S1.
