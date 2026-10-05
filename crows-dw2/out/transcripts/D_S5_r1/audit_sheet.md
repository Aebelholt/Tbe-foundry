# Audit sheet: D_S5_r1 (variant D, scenario S5)

NOTE: the Ref self-edited transcript.md after the fact (T9 text corrected; a CRIT it had asserted was not printed by the Ledger). lookups.log holds that correction note, and sealed_ledger.md holds a matching Ruling line. This audit judges the transcript as it now stands plus the logged corrections, and checked it against ledger_state.json and engine_state.json.

| # | Mode | Count |
|---|------|-------|
| 1 | Foes forgotten / out of turn | 3 |
| 2 | Stat drift | 2 |
| 3 | Invented numbers | 0 |
| 4 | Soft misses | 0 |
| 5 | Macro drift | 0 (0 triggers; DT end done) |
| 6 | Contract slips | 2 |
| 7 | Rule lookups | 0 (lookups.log has 1 line, a self-edit note, not a rule lookup) |
| 8 | State block | 112 words (auto 113), ~152 tokens; sufficient: yes |

## Evidence
1. Forgotten / out of turn (3):
   - T4: init d10=1 "enemies act first", but razorback 1 (3 Stamina left after the T2 hit) has no test; the tests are r2 claws, r3 spine, r4 spine, and Mara's blow kills r1 first ("Your blade comes down through the razorback's collarbone"). r1 lost its enemy-side turn.
   - T6: init d10=2 "enemies act first"; r2 (3 left after T5) has no test (tests r3 claws, r4, r5 spines), and Mara kills it first ("The maimed razorback takes your next stroke"). Same defect.
   - T7: init d10=6 crows first, Mara hits r3; no enemy test at all although r3, r4 and r5 were alive and "bunch up, spines lifted". The enemy side of that round never happened (12 foe phases for 13 rounds).
   - Side-order drift not counted separately: in T2, T3 and T5 the foes did act but the fiction has Mara strike first despite "enemies act first".
2. Drift (2):
   - T9 original error (self-corrected, count stands): Ref labeled a natural-19-total attack a CRIT and granted an extra action; the Ledger line [8,8]=19 → T3 has no CRIT flag (natural 16). The correction is in lookups.log, the sealed ledger Ruling and the edited T9 text. The only CRIT in the Ledger is T13 [10,10]=23.
   - Ranged misses next to allies never rolled the friendly-fire die (rules 9a): r2 spine T1 miss in T1 and T2 with r1 adjacent to Mara, r5 spine T1 miss in T6 with r3 adjacent. S4 applied it. The Ref ruled "positions abstracted".
   - Verified correct: A claws T2 2 / T3 4, spine T2 1 / T3 3, every Ledger "took" value, Mara damage (7/10) against 10 Stamina per razorback, kills in the order r1 to r6, counters at T2 claws 2 dam (T3 and T11), Lacerate not triggered when the T3 claws only hit AD (T5), which matches the "damages Stamina" wording.
3. Invented: audit_auto candidates empty. All numbers trace to engine, Ledger or blocks.
4. Soft misses: Mara's tier 1s (T3, T11) each cost 2 dam from the foe's counter. 0.
5. Macro: no Threat trigger. DT 1 end: UD torch [3] 1 to 1, encounter d10=1 vs EN 9 none, both recorded; no tick in the sealed ledger (correct).
6. Slips (2): (a) the round numbers in the status lines do not follow the engine ("round 8" in T8 and T9, then "round 10" in T10 with no round 9); (b) the Ledger lines in the replies are retyped and abbreviated (" · - ·" dropped) rather than pasted verbatim, and the Ref reports hand-writing a Ledger line in T4. The values in T4 match ledger_state.json, so no falsified result found. Fiction 88-121 words in every reply; no opening commentary or menu.
7. Lookups: 0 rule lookups. lookups.log = "turn 9 text corrected: the ledger line carried no CRIT flag, so no extra action; Ref had mislabeled it".
8. State block ~152 tokens; sufficient: yes (scene, foe status, Ledger numbers, rulings including the T9 correction, threat state, live prompt).
9. Outcome: Mara alive, Stamina 5/17, AD 0, wounds 0/10, torch lit UD 1. All 6 undead A destroyed. 13 turns. DT 1 ended.

## Summary
- Foe turns were dropped three times: two foes killed before an enemies-first turn they should have taken, and one round with no enemy side.
- The CRIT mislabel and the missed friendly-fire rolls were rule/Ledger slips; the transcript was self-edited, which lowers its reliability as evidence.
- Damage, kills and DT end were otherwise correct.
