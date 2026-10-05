# Audit C_S4_r2 (variant C, scenario S4)

| # | Mode | Count |
|---|---|---|
| 1 | Foes forgotten / out of turn | 1 |
| 2 | Stat drift | 0 |
| 3 | Invented numbers | 0 |
| 4 | Soft misses | 0 |
| 5 | Macro drift | 1 |
| 6 | Contract slips | 4 |
| 7 | Lookups mid-scene | 0 |
| 8 | State block | 216 words, ~291 tokens; sufficient: yes (scene, DT status, per-foe Stamina/engagement, Ledger numbers, light, world, threat, live prompt) |

## Evidence
- Forgotten (1): T7 the player only moved on ("no one takes a free blow" per the Ref's own tools note), yet the fiction has an attack: "the hiss of a spine passes her ear and shatters a skull". A foe acted with no tier 1 move and no Trade Blows, and with no engine roll. All foes (A2, A3, A4, B) stay tracked through T14 and the scene line matches.
- Drift (0): every foe damage matches blocks.md plus the +1 tier-2 rule: spine T2 = 1+1 = 2 (T5, T10, T11), claws T2 A2 = 2+1 = 3 (T6), spine T3 = 3 (T8, T12, T14), B claws T2 = 3+1 = 4 (T10, T14). Ledger AD chain 25>23>20>17>13>11>9>6>2>0, Stamina 17>16 verified. A1 10 dam = Stamina 10, dead. B 20-7 = 13/20 matches. Lacerate correctly not triggered (all claws damage absorbed by AD; the Stamina point lost at T14 came from a spine). Foe counts (3 A in hall, B+A in vault) match scenario.
- Invented (0): audit_auto candidates empty. Derived 13/20 is correct arithmetic.
- Soft (0): crow T1s at T5, T6 (doom), T8, T10, T11, T12, T14 all carry a `Move:` line (Escalate, Take something away, Require a cost, Hurt them, Have it backfire, Make them choose, Hurt them) with a concrete change; no same move on consecutive tier-1 turns.
- Macro (1): DT1 length rolled 2 rooms, but DT1 was ended at T3 on entering room 2 (only the landing explored, "DT 2 begins (4 rooms)"), so DT1 closed one room short. DT2's end at T9 on entering the vault is consistent only with the storeroom counted as DT2 room 1. UD, encounter check (d10=4, d10=7, both none), openly rolled DT lengths, and the sealed ledger entries are otherwise present. No Threat trigger; Gray Tithe unchanged.
- Slips (4): T3 and T9 altered the pasted engine line with a parenthetical ("none (UD torch: 1 → 0, expired)", "(UD torch: expired, nothing to roll)"), not verbatim; T5 the Ref wrote Mara's actions the player did not declare (she crosses the storeroom, shoulders the far door, swings blind) when the player said "I press on the nearest one" with no foe in reach; T1-T2 two quiet turns in a row. Word counts 86-133 fiction, all in range; no menus, no SEALED text, no em-dashes. Note (not counted): T6 fiction orders the kill as her "second swing" though the Ledger had the crit kill first and the doom second.
- Lookups: 0 (no lookups.log lines; audit_auto 0).
- Outcome: Mara Stamina 16/17, AD 0, wounds 0/10, alive, torch expired. Foes defeated: 1 (A1). Alive: B 13/20, A2, A3, A4 at 10/10. 14 turns run (player script exhausted), 2 DTs ended (DT3 in progress), area 6 not reached.

## Summary
- Handled badly: foe action in a no-roll move turn (T7), DT1 ended a room early.
- Handled well: all numbers, moves and Ledger sync were exact over 14 turns; tier 1 always got a named move.
- Contract drift: edited engine lines and Ref-written crow actions at T5.
