# Audit D_S2b_r1 (variant D, S2b)

| # | Mode | Count |
|---|------|-------|
| 1 | Foes forgotten / out of turn | 0 (no foes, no combat) |
| 2 | Stat drift | 0 |
| 3 | Invented numbers | 0 |
| 4 | Soft misses | 0 (no tier 1 rolled) |
| 5 | Macro drift | 0 (0 triggers: no outdoor rest, no cycle end, no encounter check; Gray Tithe correctly left at 1/5, ticks 0) |
| 6 | Contract slips | 0 |
| 7 | Mid-scene lookups | 0 (no lookups.log) |
| 8 | State block | 161 words, ~217 tokens; sufficient: yes |

## Evidence
1. No foes. Scene is social only.
2. Crow numbers match the Ledger (Stamina 17, AD 25, wounds 0/10 unchanged in every status line).
3. `invented_candidates` is empty. Orla's 200 gc, the husband's tally ledger and repayment at the next cycle all come from sealed.md. "Stacks of ten", "last cart off the north road" are world flavor.
4. T2 `Pull Strings` (turn 2) and T2 `Sense Motive` (turn 3); no tier 1 occurred, so no `Move:` was required.
5. Sealed Threat ticks only on outdoor Miasma rest, village cycle without Prosperity rise, or nat 10 enc check; none occurred. Sealed ledger records "Threat Gray Tithe: no tick".
6. Fiction word counts roughly 148 / 158 / 157 / ~150 (turns 1-4), all within 80-220. No menu, no `SEALED:` text, one status line each turn, replies end on a live situation. No em-dashes.
7. No lookups.
8. state_block.md carries the deal terms, the sealed fact Orla confirmed (cash short), Threat 1/5 and ticks 0, open Chardisc blanks, live prompt. Enough to resume.
9. Outcome: Mara Stamina 17, AD 25, wounds 0/10; no foes; 4 turns; 0 DTs; Orla agreed (200 gc loan for the brown tally ledger back plus 200 gc repaid in coin next cycle).

## S2b specific
- Pull Strings rolled as a Crows test via the Ledger: YES. `ledger.py test M --e 0 --b 0 --why "Pull Strings, persuade, Orla Venn"` gave [8,6]=14 T2 (2d10+M).
- Sense Motive rolled: YES, same way, [8,6]=14 T2.
- Tier results applied per printed menus: YES. Pull Strings T2 persuade: Orla asks for a promise or payment (the brown ledger back, repayment in coin). Sense Motive T2: one question answered (is she telling the whole truth about the store's money: yes, cash is short; the Ref added a short gloss that the shortfall is the reason for the price, treat as the same single answer). No tier 3 or tier 1 occurred, so two-question and named-Move branches were not exercised (tier 1 named Move: not triggered). The player did not state a question so the Ref used the scripted one.

## Summary
Handled cleanly. Both social moves were run as printed and tier 2 outcomes matched the menus. Only minor note: Sense Motive answer slightly broader than one literal question.
