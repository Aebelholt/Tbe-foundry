# Audit sheet C_S5 (variant C, scenario S5: six undead A in a corridor)

| # | Mode | Count |
|---|------|-------|
| 1 | Foes forgotten / acting out of turn | 7 |
| 2 | Stat drift | 3 |
| 3 | Invented numbers | 0 |
| 4 | Soft misses | 0 |
| 5 | Macro drift | 2 |
| 6 | Contract slips | 1 |
| 7 | Rule lookups mid-scene | 0 |
| 8 | State block | 117 words, about 157 tokens |

## Evidence
1. Out of turn (7). Rules: on a crow tier 1 the Move adds `ceil(unengaged live foes / 3)` unengaged foes attacking; otherwise only the Trade Blows target rolls.
   - T8, T9, T10: A5 had sprung to the flank at T7 ("one at each shoulder"), so A5 was engaged; A6 was the only unengaged foe ("The last razorback has not moved"). The Ref rolled engaged A5 as the Move attacker ("razorback A5 claws (Move: Take something away)", then Have it backfire, then Require a cost) instead of A6.
   - T12, T13, T16: all three live foes engaged (T11 "Three of them now ... all in reach"), so no unengaged foe existed, yet a second foe rolled each time (T12 A5 "Make them choose"; T13 A6 "Take something away"; T16 A6 crit "Require a cost").
   - T15: crow got tier 2, no Move due, yet "razorback A6 claws (Move: none, tier 2)" was rolled; sealed ledger admits "extra A6 roll made in error on crow T2".
   Foes kill-tracking itself held: A1, A2, A3 and A4 stop acting once destroyed (T3, T4, T6, T14); no roll after a kill.
2. Drift (3). Base damage checks out (claws T2 2+1 = 3, T3 4, spine T2 1+1 = 2; crow 7/10 dam vs Stamina 10; A5 3/10 and A4 destroyed at T14 match).
   - T9 and T10: the Ref invented a "doom ruling" giving both foes an edge (`--e 1`, "crow off balance"); no printed feature or rule supports it (rules: "a crow doom is tier 1"). Two instances.
   - Lacerate (T10-T16): T3 claws that damaged Stamina or wounds were T10 (A5), T12 (A4 crit, Stamina 10 -> 6), T13 (A6, Stamina to 0, wound), T16 (A6 crit, wounds). Only "A5 earlier, A6 T16" was recorded, and the 1 P dam per laceration was never applied in any later exchange. One count for the unapplied/mis-tracked feature.
3. Invented (0). `invented_candidates` empty. Every foe roll is an engine line; counts of foes remaining ("Two down", "Three are down", "Four down") and "down to six Stamina", "Eight cuts" match the Ledger and engine. The unsupported edge is counted under drift instead.
4. Soft misses (0). Crow tier 1s at T7, T8, T9 (doom), T10 (doom), T11, T12, T13, T16 each carry `Move: <name>` (Escalate, Take something away, Have it backfire, Require a cost, Hit the ground running, Make them choose, Take something away, Require a cost), no back-to-back repeat, each with a concrete change. Note: T12 "Make them choose" shows a threat (torch bracket cracking), not an actual choice; consequence still concrete, so not counted.
5. Macro (2). The scenario has no DT. The Ref nevertheless rolled `ledger.py ud torch` mid-fight at T10 ([6], no loss) and T16 ([2], torch EXPIRED, darkness), with no DT end, no encounter check, and no DT line in the ledger ("No DT count kept"). UD advanced without its trigger twice, and the T16 expiry changed the fight. No Threat trigger (Gray Tithe 1/5 stays).
6. Contract slips (1). T2 fiction is about 73 words (under the 80 minimum): "Your blade bites deep into the razorback's shoulder ... spines clicking like dry reeds." All other turns are 84-107 words, no menu, no question, no SEALED text. Not counted: Move lines placed as a separate line below pasted Ref lines.
7. Lookups: no `lookups.log`, `audit_auto` lookups = 0.
8. State block 117 words (about 157 tokens). Sufficient to resume the fight: yes, but thin. It has Ledger numbers, A5 3/10 and A6 10/10, darkness, 4 of 6 destroyed, and the rulings. Gaps: lacerations are listed incorrectly and not as a count, Slashing uses, the dungeon position, and an inconsistent engagement label (A6 "unengaged close" after narrating it as in reach).
9. Outcome. Mara alive but near death: Stamina 0, AD 0, wounds 8/10, torch expired, in darkness. Foes destroyed: 4 of 6 (A5 at 3/10, A6 at 10/10 remain). 16 turns (script ended). 0 DTs ended.

## Summary
- Worst variant-C scenario: the second-foe attacks under Move labels did not follow the unengaged-foe rule (7 turns), including one acknowledged stray roll on a crow tier 2 (T15).
- The Ref invented a foe edge on dooms (T9, T10) and never applied or fully tracked Lacerate.
- UD was rolled twice with no DT end or encounter check, and one reply (T2) fell under the 80-word floor.
