# Audit sheet C_S3 (variant C, scenario S3: Miasma rest then cycle end)

| # | Mode | Count |
|---|------|-------|
| 1 | Foes forgotten / acting out of turn | 0 (no foes) |
| 2 | Stat drift | 0 |
| 3 | Invented numbers | 0 |
| 4 | Soft misses | 1 |
| 5 | Macro drift | 0 |
| 6 | Contract slips | 0 |
| 7 | Rule lookups mid-scene | 0 |
| 8 | State block | 175 words, about 236 tokens |

## Evidence
1. No foes.
2. Drift (0). Miasma RR [3,5]=8 -> T1 per Ledger; Miasma Effects d10+1 = [4]=5 (cruelty 1 after the T1) read from the engine table; Stamina full so the second effect changes nothing (ruling logged). Prosperity 0 -> -1 straight from the engine `cycle` line.
3. Invented (0). `invented_candidates` empty. Every die result (encounter d10=2 twice, d4=3, event roll [1]=0) is an engine line. Not counted (colour only): "Third report this month", "three nights running", "seven short strokes" (T2-T4). The d4 item list (rope, knife, coin purse, ration-sack) was the Ref's own choice of backpack contents because the Ledger holds no inventory; logged as a ruling.
4. Soft misses (1). T1: Miasma RR result T1 (a failed test), with a concrete consequence (coin purse shredded) but no `Move: <name>` on the mechanics line. Rules 9c: "On any tier 1 (a ... failed test) the Ref names one move on the mechanics line". Quote: "Ref: Miasma Effects (R28) ... 1st Effect: destroy one mundane item (coin purse, d4=3)" with no Move.
5. Macro (0). Outdoor Miasma rest tick -> Threat 2/5 (foreshadowed by the boots and cart, T1; ledger line written). Cycle end with no Prosperity rise -> tick 3/5 (carter sees toll-house light and hammering, T3; gatepost DUES, T4; sealed ledger line written). Cap 2 ticks per session respected ("2/2 cap reached"). Encounter checks: rest d10=2, final stretch d10=2, none fired. Next Village Event rolled, kept SEALED, recorded in the sealed ledger (merchant robbery, level -3). Prosperity -1 is in the sealed ledger and state block (the Ledger has no Prosperity field).
6. Contract slips (0 under the listed categories). Fiction about 167 / 180 / 187 / 187 words; no menu, one question only (T2, in Orla's speech); no SEALED text shown. Deviations noted but not in the listed categories: T1 mechanics line abridges the engine lines (not pasted verbatim, no STATUS), and T4 prints `Ref: none`, which is not an engine line.
7. Lookups: `lookups.log` is empty, `audit_auto` lookups = 0.
8. State block 175 words (about 236 tokens). Sufficient to resume: yes. It has day, crow numbers and the lost purse, Prosperity -1, institutions, Threat 3/5 with next developments, the sealed pending Village Event, Orla's loan offer and the live prompt.
9. Outcome. Mara alive, Stamina 17, AD 25, wounds 0/10, cruelty 1, coin purse destroyed. No foes. 4 turns run. 0 dungeon turns (travel rest and one village cycle ended).

## Summary
- Macro handling was good: both printed Threat triggers fired, were advanced in fiction and ledger, cap respected, event kept sealed.
- Weak spot: the Miasma RR tier 1 got a concrete consequence but no named `Move:` on the mechanics line.
- Minor format looseness in the mechanics line (T1 abridged, T4 a fake `Ref: none`), not counted as slips.
