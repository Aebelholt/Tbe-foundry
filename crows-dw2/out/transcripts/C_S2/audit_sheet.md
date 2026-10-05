# Audit sheet C_S2 (variant C, scenario S2: persuading the steward)

| # | Mode | Count |
|---|------|-------|
| 1 | Foes forgotten / acting out of turn | 0 (no foes) |
| 2 | Stat drift | 0 |
| 3 | Invented numbers | 0 |
| 4 | Soft misses | 0 |
| 5 | Macro drift | 0 (no trigger) |
| 6 | Contract slips | 0 |
| 7 | Rule lookups mid-scene | 0 |
| 8 | State block | 145 words, about 195 tokens |

## Evidence
1. No foes in the scene.
2. Drift (0). Crow figures in status lines (Stamina 17, wounds 0/10) match `ledger_state.json`. The terms Orla states (200 gc, her husband's tally ledger to her own hands, repay in coin next cycle) match `sealed.md`; she distrusts the "many times over" boast as sealed (T2).
3. Invented (0). `invented_candidates` is empty and no die was asserted. Not counted, but noted as narrative colour with no mechanical weight: "three weeks back" (T1), "eleven crows. Four came back" (T2), "Two things" is derived.
4. Soft misses (0). No test was rolled, so no tier 1 (T1-T4 "No roll called: Orla answers by personality", allowed by rules 1 Social).
5. Macro (0 triggers). No DT, rest or cycle. `sealed_ledger.md` records Threat Gray Tithe 1/5, no tick, which is correct.
6. Contract slips (0). Fiction about 143 / 162 / 164 / 155 words; one NPC question only (T1 "What is the vault?"); no menu, no SEALED text, no commentary opener; no mechanics line needed.
7. Lookups: `lookups.log` absent, `audit_auto` lookups = 0.
8. State block 145 words (about 195 tokens). Sufficient to resume: yes. It has the loan terms, Orla's stance, crow Ledger numbers, Threat 1/5, open Chardisc blanks and the live prompt.
9. Outcome. Mara alive, Stamina 17, AD 25, wounds 0. No foes. 4 turns. 0 DTs. Orla agreed to the 200 gc loan on accepted terms.

## Summary
- Clean run: social scene resolved by personality with no dice, no drift, no macro events.
- The only thing worth flagging is the unsourced narrative statistics in Orla's speech (T1, T2), not counted as invented because they carry no mechanical weight.
- No Ref move or tier handling was exercised.
