# Audit sheet: D_S4_r2 (variant D, scenario S4)

| # | Mode | Count |
|---|------|-------|
| 1 | Foes forgotten / out of turn | 0 |
| 2 | Stat drift | 1 |
| 3 | Invented numbers | 0 |
| 4 | Soft misses | 0 |
| 5 | Macro drift | 1 (of 1 trigger: Threat tick on natural-10 encounter check) |
| 6 | Contract slips | 0 |
| 7 | Rule lookups | 0 (no lookups.log) |
| 8 | State block | 145 words, ~195 tokens; sufficient: yes |

## Evidence
1. Forgotten foes: none. Side initiative rolled each round (T2 7, T3 9, T4 2, T5 9, T6 2, T7 1). Round 1: the five B shot spines, the two A leapt to close (a maneuver). Rounds 2-3: all seven acted. A2 died of friendly fire in T4 (B1 doom, B4, B2 doom spine damage 4+2+4 = 10) and A1 died to Mara in T5, and neither acted after. Rounds 5-6: five B claws each round. The three A of area 3 were never reached and are listed in the state block.
2. Drift (T3): friendly-fire rolls "d6 [4]=4 random ally hit by B5 (3-6 = other B's in order)" point to B2, yet the state block carries B2 18/20 and B4 18/20 (B2 took only the T5 d4 hit, B3 the other T5 hit). B4's 2 dam is not explained by any engine line (engine mapping gives B2 16, B4 20). Checked and correct: spine T2 2 / T3 4, claws T2 3 / T3 5, A claws T2 2, all Ledger "took" values (T2 8, T3 2, T4 10, T5 10, T6 14, T7 6), Lacerate only on B hits (4 lacerations in T6 = 4P) and not on A T2 hits, AD to Stamina to wounds sequence.
   Note, not counted: Mara never countered the foes' melee misses (T3, T4, T6, T7); the player never declared a counter and the rules say "may counter".
3. Invented: audit_auto candidates empty. Group counts (2 A, 5 B) come from engine d6 rolls; the encounter came from the engine table roll.
4. Soft misses: Mara rolled no tier 1 (attacks T2, T3, T3, T3; her search and move needed no roll). 0.
5. Macro: DT 1 end ran UD (torch 4, no change) and the encounter check (natural 10, ENCOUNTER NOW), then the F34 table. The natural 10 ticked The Gray Tithe to 2/5 (1 tick, under cap 2), written to sealed_ledger.md, but no Foreshadow/Advance move appears in the fiction. Counted strictly as 1. DT 2 length d6 was rolled at the start of T3 after round 1 had been played (status line said "roll pending"); not counted. DT 2 never ended (Mara died).
6. Slips: none against the hot card. Fiction 126, 127, 139, 139, 128, 149, 110 words; no menus, no SEALED text. Observation: mechanics lines in T2-T7 are re-formatted summaries, not the engine's lines verbatim.
7. Lookups: 0.
8. State block 145 words x 1.35 = ~195 tokens. Sufficient: yes (crow dead, foe Stamina, location, threat, ruling list, next-crow note), though the B4 value is the doubtful one.
9. Outcome: Mara dead on turn 7 (wounds 12/10, Stamina 0, AD 0), in round 6 of combat, DT 2. Foes defeated: undead A x2 (one by friendly fire, one by Mara). Five longclaws alive (B1 10/20, B2 18, B3 18, B4 18, B5 20). DTs ended: 1.

## Summary
- Handled well: seven-foe side initiative, every foe acting once per round, correct damage, Lacerate and friendly-fire handling, Ledger agreement.
- Handled badly: one unexplained Stamina value in the foe tally (B4) and a Threat tick not shown in the fiction.
- The scenario was a random encounter of 7 undead that overwhelmed the crow; mechanics held but outcome was lethal.
