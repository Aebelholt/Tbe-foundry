# Audit sheet C_S4 (variant C, scenario S4: flooded cellar, six DTs)

| # | Mode | Count |
|---|------|-------|
| 1 | Foes forgotten / acting out of turn | 2 |
| 2 | Stat drift | 0 |
| 3 | Invented numbers | 0 |
| 4 | Soft misses | 0 |
| 5 | Macro drift | 1 |
| 6 | Contract slips | 0 |
| 7 | Rule lookups mid-scene | 0 |
| 8 | State block | 194 words, about 261 tokens |

## Evidence
1. Out of turn (2). Rules: "foes act only through Trade Blows or Ref moves".
   - T7 (crow declared a move with no roll, no Move named): "The razorback on your left ... leaps ... lands in the water square in your path"; the other "stands in the arch you came through", cutting off the retreat. Tool note: "A2 10/10 engaged close (leapt in)".
   - T10 (crow test T2, no card move): both razorbacks "are on you"; the Ref's own ruling logs "foes ... leapt to engage (Leap) on turns 7 and 10".
   Borderline, not counted: T6 (A2 and A3 "slide wide around the pillars", repositioning only, no roll). A1 stops acting once destroyed (T6). A2/A3 stay tracked to the end (T14 "A2 3/10 left behind; A3 pursues").
2. Drift (0). A1: 10 -> 3 -> destroyed (two 7-dam hits). A2 3/10 after one 7-dam hit (T11). A3 10/10. Foe damage: A2 claws T3 = 4 (T8), A3 spine T3 = 3 (T8, T9), claws T2 = 2+1 = 3 (T11-T13), all match blocks.md. AD 25 -> 6 matches the Ledger log. Lacerate not triggered (T3 hits landed on AD only).
3. Invented (0). `invented_candidates` empty; every roll is an engine or Ledger line. Not counted: fiction colour such as "four long parallel gouges", "three-clawed hands".
4. Soft misses (0). Crow tier 1s at T8 (Hurt them), T9 (Take something away, torch knocked away), T12 (Require a cost or opportunity, armor seam opened, A3 flanks), T13 (Have it backfire, bones collapse, extra noise check d10=5). Each has `Move: <name>` on the mechanics line and a concrete change; no move repeated back to back.
5. Macro (1). DT 1 ended in T3 (`ud torch` [4], `enc` d10=8 none, new d6=4), but `sealed_ledger.md` has no DT 1 end line, only the extra noise check from T13; the DT end appears only in the state block and engine log. Unclear but not counted: DT 1 closed at "rooms 1/2" with the storeroom then counted as DT 2 room 0/4 (T2-T3). DT 2 did not end before the script stopped (rooms 1/4), so no DT 2 end was due. Threat Gray Tithe: no trigger, 1/5 recorded.
6. Contract slips (0). Fiction 104-137 words per turn, no commentary opener, no menu, no question, no SEALED text, no em-dash.
7. Lookups: no `lookups.log`, `audit_auto` lookups = 0.
8. State block 194 words (about 261 tokens). Sufficient to resume: yes. It gives position, DT and room count, scene line for A2 and A3, Ledger numbers, the dropped torch, untouched rooms and loot, last Move, and the live prompt.
9. Outcome. Mara alive (Stamina 17, AD 6, wounds 0/10). Foes destroyed: 1 (A1) of 3 undead A in the crypt hall; A2 at 3/10, A3 at 10/10 pursuing; areas 4-6 never reached. 14 turns (script ended). DTs ended: 1 (DT 2 in progress).

## Summary
- Foe movement (Leap) happened without a Trade Blows or named Move at T7 and T10.
- The DT 1 end was done mechanically but never written to the sealed ledger.
- Named-Move discipline on tier 1 and foe stat handling were otherwise clean.
