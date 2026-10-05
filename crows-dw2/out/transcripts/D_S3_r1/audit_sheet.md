# Audit D_S3_r1 (variant D, S3)

| # | Mode | Count |
|---|------|-------|
| 1 | Foes forgotten / out of turn | 0 (elephants resolved without combat) |
| 2 | Stat drift | 0 |
| 3 | Invented numbers | 0 |
| 4 | Soft misses | 0 (Miasma RR T2, no tier 1) |
| 5 | Macro drift | 1 |
| 6 | Contract slips | 0 |
| 7 | Mid-scene lookups | 0 (no lookups.log) |
| 8 | State block | 223 words, ~301 tokens; sufficient: yes |

## Evidence
1. No fight. 7 elephants (engine 2d6=7) took a ration scrap and left (wild animal reaction Hungry). No elephant block exists; the Ref ruled no combat and logged it. Not a foe tracking failure.
2. Crow Stamina 17, AD 25, wounds 0/10 consistent with Ledger throughout. Prosperity 0 to -1 matches engine `cycle` line.
3. No invented numbers: seven elephants, d10=10 vs EN 9, Miasma RR [10,6]=16 T2, Prosperity -1, village event 2 all from engine/Ledger; "four hours" from rules (rest). Turn 2 has a stray `miasma_effects` roll [2] that the Ref admits was unused; not asserted in the fiction.
4. No tier 1 rolled (Miasma RR T2 means no cruelty and no effect).
5. Macro: ticks per rules were nat 10 on rest encounter check (turn 1, Dev 2), outdoor Miasma rest (Dev 3), cycle end without Prosperity rise (blocked by the cap of 2). Sealed ledger has all three lines correctly (3/5, "cycle-end tick not applied, session cap 2 reached"), Prosperity -1, village event rolled and sealed, `SEALED:` not shown. Count 1: Dev 3 "old toll house fortified" never appears in the fiction (turn 3 shows Dev 2 via the empty northern road and turn 2 foreshadows with the tally strokes on the cart, but no toll house hint in turns 3-4), so the second tick was written but not advanced in the fiction (hot rule: fire a Foreshadow or Advance move). Minor: the engine said "set it in the Ledger" for Prosperity, and the Ledger has no command; Ref noted it in the state block.
6. Fiction words about 170 / 161 / 158 / ~150, within range; no menu, no commentary opening, one status line. Mechanics lines are pasted engine lines, not recomputed.
7. No lookups.
8. state_block.md covers location, cycle, Prosperity -1, Threat 3/5 with cap used, sealed village event (unrevealed), Orla, live prompt. Enough to resume.
9. Outcome: Mara alive Stamina 17, AD 25, wounds 0/10, torch 1 UD; no foes; 4 turns; 0 DTs; cycle ended, next village event sealed (merchant thefts); Threat 1/5 to 3/5.

## Summary
Mechanics handled well (encounter check, Miasma RR, cycle, cap, sealed ledger).
Weak point: the second tick (Dev 3, toll house) was not advanced in the fiction.
No soft misses or slips; the elephant encounter had no printed block.
