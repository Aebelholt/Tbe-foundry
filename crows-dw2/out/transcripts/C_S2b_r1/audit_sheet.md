# Audit C_S2b_r1 (variant C, scenario S2b)

| # | Mode | Count |
|---|---|---|
| 1 | Foes forgotten / out of turn | 0 (no foes) |
| 2 | Stat drift | 0 |
| 3 | Invented numbers | 0 |
| 4 | Soft misses | 0 (no tier 1) |
| 5 | Macro drift | 0 (Gray Tithe: no trigger fired, 0 triggers; sealed ledger records 1/5, no tick) |
| 6 | Contract slips | 1 |
| 7 | Lookups mid-scene | 0 (no lookups.log; audit_auto lookups 0) |
| 8 | State block | 144 words, ~194 tokens; sufficient: yes (deal and terms, Orla's revealed secret, Threat 1/5, Mara 17 Stamina/AD 25/wounds 0, open items, live prompt) |

## Evidence
- Forgotten: scene has no foes.
- Drift: none. Crow numbers match Ledger (Stamina 17, wounds 0/10, torchlit) in every status line.
- Invented: audit_auto candidates empty. "ten days off" until the cycle and "last month" supply run are world flavor, not counted. Both rolls came from Ledger lines (T2 14, T2 13).
- Soft: no tier 1 occurred. Both social tests were T2 and took the printed T2 cost.
- Macro: Threat not triggered by a conversation; sealed_ledger shows "no tick this session". Correct.
- Slips: T3 "Orla does not lie, you decide" puts a conclusion in the crow's head (hot card Never). Word counts T1 155, T2 173, T3 167, T4 186, all in 80-220. No menus, no SEALED, no em-dashes, one-or-zero questions. TEST line pasted after fiction on T2 and T3 is the pasted log line, allowed.
- Lookups: 0.
- Outcome: Mara Stamina 17, AD 25, wounds 0/10. No foes. 4 turns. 0 DTs. Orla agreed to 200 gc loan on terms (return Tam's tally ledger, repay in coin at next cycle).

## S2b specifics
- Pull Strings rolled as Crows test 2d10+M through the Ledger: YES (`ledger.py test M`, [9,5]=14, T2).
- Sense Motive rolled: YES (Ledger, [9,4]=13, T2).
- Tier results per printed menus: YES. Pull Strings T2 persuade: Orla "asks for a promise or payment" (promise to bring the ledger plus repayment in coin) - applied. Sense Motive T2: one question answered truthfully (store cash short after lost run) - applied. Tier 3 (two questions), tier 1 (named Move) did not occur, so not testable. No approach complication beyond the persuade T2 cost was needed; none was wrongly added.

## Summary
- Handled cleanly: both social moves rolled via Ledger and resolved per printed tier menus.
- One slip: T3 told the crow its own conclusion ("you decide").
- No tier 1 occurred, so named-Move rule and soft-miss behavior went untested.
