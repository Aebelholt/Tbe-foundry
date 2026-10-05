# Audit sheet: B_S4 (variant B, scenario S4, flooded cellar)

| # | Mode | Count |
|---|---|---|
| 1 | Foes forgotten / acting out of turn | 0 |
| 2 | Stat drift | 0 |
| 3 | Invented numbers | 0 |
| 4 | Soft misses | 0 |
| 5 | Macro drift | 1 |
| 6 | Contract slips | 0 |
| 7 | Rule lookups mid-scene | 2 |
| 8 | State block | 208 words, about 280 tokens |

## Evidence
1. No forgotten foes: crypt-hall razorbacks 1 and 2 killed (T5, T6), razorback 3 wounded 7 dam (3/10) and left in the ossuary (T9, ruling logged, state block tracks it); vault longclaw and razorback tracked T9-T14. Foe attacks occurred only inside Trade Blows or as named Ref moves (T8 and T10 "Ref move: Hurt Them"). T8 Hurt Them followed a no-roll search; treated as the Ref answering the player, allowed.
2. No drift: claws 2 dam (A) and 3 dam (B) match blocks.md; AD ledger lines match. Crow damage T3 10, T2 7 (ledger.py formula): razorback 10 killed by T3; razorback 3 left at 3; longclaw 20 -> 10 (T11) -> 3 (T12) -> dead (T13). Lacerate correctly not triggered (damage only to AD).
3. Candidates: none. Derived Stamina values are correct arithmetic.
4. Only one tier 1 (T10 Defy Danger [1,4]=6): concrete consequence (stumble, 3 dam, longclaw arm across the door, Hurt Them named).
5. Macro (1): DT 1 end at T14 did roll UD (`[6] 1->1`) and the encounter check (d10=2 vs EN 9, none), and the d6 was rolled at DT start (6 rooms). But sealed_ledger.md has no DT-end line (UD result, encounter check); it only records rulings and "Threat 1/5 no tick". Borderline; counted. Only one DT was needed because d6=6 and Mara reached area 6.
6. Slips: none. Fiction 94-130 words, one status line, no questions, mechanics lines pasted verbatim (T1, T14) or the required named Ref move.
7. Lookups (2): T4 re-read Undead A block at the first hostile act; T14 hot card re-read at DT end.
8. State block: 280 tokens. Sufficient: yes (foes with Stamina, rooms, crow numbers, UD and encounter result, rulings, live prompt).
9. Outcome: Mara alive, Stamina 17, AD 5, torch lit UD 1; undead A x2 and undead B destroyed; wounded A (3/10) left behind, vault A (10/10) on her heels at the exit stair; 14 turns; 1 DT ended.

## Summary
- Combat and stat handling were clean, with correct features and damage bookkeeping.
- Only miss: the DT end was not written to the sealed ledger.
- Four quiet turns opened the scene before any pressure (hot card "no two quiet turns"), not counted under the slip list.
