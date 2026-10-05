# Audit C_S5_r2 (variant C, scenario S5)

| # | Mode | Count |
|---|---|---|
| 1 | Foes forgotten / out of turn | 0 |
| 2 | Stat drift | 0 |
| 3 | Invented numbers | 0 |
| 4 | Soft misses | 0 |
| 5 | Macro drift | 0 (0 triggers; no DT clock, Gray Tithe untouched) |
| 6 | Contract slips | 1 |
| 7 | Lookups mid-scene | 0 |
| 8 | State block | 76 words, ~102 tokens; sufficient: yes (scene over, no live foes, Ledger numbers, torch, threat 1/5, live prompt) |

## Evidence
- Forgotten (0): engaged foe rolled after every non-killing exchange (T2, T3, T5, T6, T9, T10, T13, T14); none after a kill (T4, T7, T8, T11, T12, T15; correctly no counter, logged as a ruling). Unengaged attack counts match ceil(unengaged/3): T2 five unengaged = 2 spines, T6 four = 2, T10 two = 1, T14 none left. All six foes tracked to death; no foe acted on a turn with no Trade Blows or Move.
- Drift (0): claws T2 = 2+1 = 3 (T2, T6), T3 claws = 4 (T3), spine T2 = 1+1 = 2 (T2, T6), took 3/2/4/3/2/2/3/3 vs Ledger chain AD 25>22>20>16>13>11>9>6>3 all match. Crow damage 7/10 from the Ledger: R1 7+7 dead, R2 7+7 dead, kills at 10 dam at T8/T12; R4 7+7 dead, R6 7+7 dead; six destroyed total matches 6 foes at 10 Stamina. Lacerate correctly not triggered (no Stamina damage). Note (not counted): T8 fiction gives an undamaged foe "a hole in its chest".
- Invented (0): audit_auto candidates empty; every number traces to tool output or blocks.md.
- Soft (0): crow T1s at T2 (doom, Escalate), T6 (Require a cost or opportunity), T10 (Take something away), T14 (Have it backfire); all carry `Move:` and a concrete change; no repeats.
- Macro (0 triggers): one extra encounter check at T12 for a loud fight (d10=3, none), logged. No Threat trigger.
- Slips (1): T2 mechanics line summarised ("claws [1,9]=12 → T2 (3 dam) · spine ...") instead of pasting engine lines verbatim; the harness note admits it. Fiction 96-148 words, no menus, no SEALED, no fiction em-dashes (one "DT —" in T1 status line, not counted). Note (not counted): status line carries AD, beyond the printed format; T12 "you hold your breath and listen" is a small invented crow action.
- Lookups: 0.
- Outcome: Mara Stamina 17/17, AD 3, wounds 0/10, alive, torch UD 1. Six of six undead A destroyed. 15 turns run (script showed 17 entries, index 5 skipped), 0 DTs.

## Summary
- Handled well: foe tracking, damage numbers, per-turn Ledger sync and named moves across a 6-foe swarm.
- Minor miss: one summarised (non-verbatim) mechanics line at T2.
- No macro or soft-miss failures in this scenario.
