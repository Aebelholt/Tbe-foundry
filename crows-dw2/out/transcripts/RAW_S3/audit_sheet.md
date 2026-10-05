# Audit sheet: RAW_S3 (variant RAW, scenario S3, Miasma rest then cycle end)

| # | Mode | Count |
|---|------|-------|
| 1 | Foes forgotten / out of turn | 0 (no combat) |
| 2 | Stat drift | 0 |
| 3 | Invented numbers | 0 |
| 4 | Soft misses | 0 |
| 5 | Macro drift | 0 (2 triggers fired, see note) |
| 6 | Contract slips | 0 |
| 7 | Rule lookups mid-scene | 1 (blocks.md search for "blood creature B" after F32 d6=3; no block existed) |
| 8 | State block | 233 words, about 314 tokens (233 x 1.35); sufficient to resume: yes |

## Evidence

1. No combat. The blood creature B result (T2, F32 d6=3) was resolved as a shadowing lure that stops at the wall, not fought; no foe numbers used.
2. Drift: none. Crow Stamina 17 / AD 25 unchanged, Ledger shows only the Miasma RR (T1). Engine cycle line "Prosperity 0 -> -1" is carried into the state block and status lines.
3. Invented: `invented_candidates` empty. Every roll has an engine line: rest encounter d10=9 (T1), Miasma RR [5,1]=6 T1, Miasma Effects d10+1 [5]=6, slot d10=7, travel/encounter d100 61, d10 4, d6 3, cycle -> event d10-1 [8]=7. Flavour distance "bowshot" (T2) is not mechanical, not counted.
4. Soft misses: the Miasma RR T1 had concrete consequences (cruelty 1, rage destroying backpack slot 7, T1 fiction "seventh slot of your pack torn to pieces").
5. Macro: portent 2 trigger (crow rested outdoors in Miasma) fired T1 and is in the sealed ledger; portent 3 trigger (cycle ended, Prosperity not rising: 0 -> -1) fired T3 and is in the fiction (toll house hammering, smoke) and ledger. Portent 4 correctly pending (no natural 10: encounter d10 9, 7). Portent 5 pending. Note, borderline: T3 line "A cart that left for the ford has not come back" can be read as portent 2 (vanishing) or as an early hint of portent 4; read as portent 2, not counted. Rest encounter check was made (9 = sign now, followed by travel encounter), cycle end and sealed next event rolled via engine; SEALED line not shown.
6. Slips: none. Fiction 137/169/189/170 words, no em-dashes, no menu, no SEALED text. Mechanics block is several pasted engine lines (the card says one line) but verbatim; T2 "You do not answer it" writes a crow action, not a listed slip.
7. Lookups: 1, lookups.log: blocks.md searched for blood creature B, F32 d6=3.
8. State block 233 words: location, cruelty, destroyed slot 7, Prosperity -1, event, unresolved blood creature B, front state, live prompt. Sufficient: yes.
9. Outcome: Mara alive, Stamina 17, wounds 0, cruelty 1, slot 7 item lost, Prosperity -1. Foes 0 fought, turns 4, DTs ended 0 (rest, 1 travel day, 1 cycle end, event landed).

## Summary
- Engine procedure followed for rest, Miasma, travel, cycle and event; nothing invented.
- Weak spot: the F32 encounter was narrated as a lure because blocks.md has no block for blood creature B (one lookup, no resolution); portent 4/2 wording at the ford is borderline.
- Contract held across four replies.
