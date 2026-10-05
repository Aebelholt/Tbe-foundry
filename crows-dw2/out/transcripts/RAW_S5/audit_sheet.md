# Audit sheet: RAW_S5 (variant RAW, scenario S5, undead swarm in a corridor)

| # | Mode | Count |
|---|------|-------|
| 1 | Foes forgotten / out of turn | 0 |
| 2 | Stat drift | 0 |
| 3 | Invented numbers | 0 |
| 4 | Soft misses | 0 |
| 5 | Macro drift | 0 (0 triggers; no DT clock in scenario) |
| 6 | Contract slips | 0 |
| 7 | Rule lookups mid-scene | 0 (lookups.log empty) |
| 8 | State block | 113 words, about 153 tokens (113 x 1.35); sufficient to resume: yes |

## Evidence

1. Foes: initiative each round (R1 6 crows first; R2 2, R3 1, R4 1, R5 3, R6 1, R7 1 enemies first). Live foe test lines per round: R1-R4 six (U1-U6), R5 five (U2-U6), R6 four (U3-U6), R7 four (U3-U6); U1 acted R4 before dying, U2 acted R5 before dying; no dead foe acted. One test per foe per round. Rear foes used Spine, front used Claws.
2. Drift: none. Claws T2 2 / T3 4, Spine T2 1 / T3 3 match every `take` (R1 1,1; R2 2,4,1,1; R3 2,3,1,1,1; R4 2,2,1,3; R5 4,2,1,3,3; R6 3; R7 4,1,3). Lacerate applied only on T3 claws that damaged Stamina/wounds (R5 U2, R7 U3), not when AD absorbed (R2 U2 T3). Mara's 7 dam hits: U1 10-7=3, then killed R4; U2 killed R5 by 10; U3 10-7=3 R6, matching the state block. Crow numbers match the Ledger (death at wounds 10/10 R7). Note not counted: the "ranged miss next to allies" friendly-fire die (R20) was never rolled for Spine misses (R1 U3,U6; R2 U3,U4; R4 U4,U6; R6 U4,U5; R7 U5); not a block feature or number, outside the counted modes. Lacerations were tracked but never ticked because Mara declared no maneuver plus action turn (state block: "unresolved, moot").
3. Invented: `invented_candidates` empty. Every foe roll via `engine.py test`. Foe positions in the state block are Ref-tracked per scenario (no map).
4. Soft misses: Mara T1 only in R3 (miss -> U1 counter 2 dam, claws scrape and rake on screen). None other.
5. Macro: none; no DT clock, no encounter check requested; sealed ledger "no tick".
6. Slips: none. Fiction 164/145/147/149/164/159/125 words, no menu, no question, no SEALED text, each ends on the live press of the swarm. Mechanics lines are long pasted engine blocks (7-8 results) where the card says one line: verbatim, not a listed slip.
7. Lookups: 0.
8. State block 113 words: dead crow, four foes with Stamina and positions, lacerations, light, front. Sufficient: yes.
9. Outcome: Mara dead in round 7 (wounds 10/10). Foes destroyed 2 (U1 R4, U2 R5); U3 3/10, U4-U6 10/10. Turns 7, DTs ended 0.

## Summary
- Handled well: one-turn-each tracking of six foes across seven rounds, tier damage and Lacerate exact.
- Only soft spot: skipped the printed friendly-fire roll for ranged misses past adjacent allies (uncounted).
- Contract held across seven replies.
