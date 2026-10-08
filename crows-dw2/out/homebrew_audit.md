# Homebrew audit: what we added, creep, and what the tests support

Date 2026-10-08. Sources: layer v1 to v1.2, hot cards, changelog, `results.md` (Phases 1 to 3), Pilot 02 report. Counts come from the files, not memory.

## 1. Creep, measured

| Measure | v1 | v1.1 | v1.2 | Change v1 to v1.2 |
|---|---|---|---|---|
| Layer words | 5,107 | 7,404 | 8,439 | +65% |
| Hot card words (re-read at every DT end) | 830 | 997 | 1,244 | +50% |
| Hot card "Never" lines | 11 | 15 | 23 | +12 |
| Hot card "at a glance" lines | 10 | 14 | 15 | +5 |
| Engine commands | | | 29 | |
| Ledger commands | | | 19 | |
| Wilderness tables / entries | 0 | 33 / 681 | 34 / 693 | |
| Layer sections | 15 | 16 | 17 (§17 has 18 sub-rules) | |

Reading: the layer grew by two thirds and the card the Ref must hold in mind grew by half. Phase 2 found that the plainest rulebook (RAW) had the fewest errors. Every line added to the hot card competes for the Ref's attention, so card growth is the number to watch. 23 Nevers is the highest of the three versions and 12 of the new ones answer failures seen in one pilot.

## 2. How to judge a homebrew rule (five tests)

1. **Evidence.** Was it tested, and what happened? A pilot failure that it answers counts as evidence for it.
2. **Ref judgment.** Does it add a decision the Ref can get wrong? Judgment is the expensive kind of rule. A counter the Ledger owns is cheap.
3. **State.** Does it add something to track, and who owns it? One owner per fact.
4. **Cost.** Words in the layer and on the card.
5. **Origin.** Printed Crows rule, imported (DW2, Wyrd, Liminal), or HOUSE invention. HOUSE numbers are guesses until played.

Keep a rule if it fixes an observed failure or tested clean, and its judgment load is low. Move it to an optional appendix if it is untested and adds judgment. Cut it if it is speculative and adds judgment.

## 3. The register

| # | Rule | Origin | Ref judgment | Evidence | Verdict |
|---|---|---|---|---|---|
| 1 | Threats with Developments and three tick clocks, cap 2 per session (§5) | DW2 import, HOUSE cap | Low (which Threat ticks; mirror it in the fiction) | Sim: 4 to 6 Development Threats finish in 2 to 5 sessions. Trials: ticks fired correctly, cap held, no macro drift in S3. Pilot 02: Night Summons ticked 1/4 cleanly | **Keep (core)** |
| 2 | Combat housekeeping: strike dead foes first, an engine line for every foe attack (§9a) | HOUSE | Low | Answers forgotten and dead foes in Phase 3; D_S5 still slipped | **Keep (core)**, enforce in tools where possible |
| 3 | Tier-1 move card (§9c) | DW2 import | Medium (pick a move) | Used 20 of 20 times with a named move in Phase 2 and 3. One missed the name | **Keep (core)** |
| 4 | Pull Strings and Sense Motive on Mind (§9b) | DW2 import, Mind is HOUSE | Medium (when to call) | Tier 2 worked in two trials. Tiers 1 and 3 never occurred | **Keep, untested** |
| 5 | Precedence rule (§9d) | HOUSE | None | Nothing contradicted it | **Keep (core)**, costs words only |
| 6 | RAW combat kept (no Trade Blows) | Printed | None | Phase 1: hybrid fails parity for a levelled crow. Phase 2: RAW 24 replies, hybrids 35 to 40, 0 forgotten foes | **Keep** (a negative result, the strongest evidence we have) |
| 7 | §16 wilderness: calendar, moon EN, hunts, hazards, diseases, madness (693 entries) | Wyrd import, every Crows conversion HOUSE | Medium to high (hazard RR stats, disease procedure) | None. Pilot 02 used travel and a Miasma rest only | **Appendix**, off by default |
| 8 | §17 protocol: Ledger dice in the open, one reply per round, `Maneuver?`, `--note`, split SAVE, telegraph beat, clever plan, crow's inside | HOUSE | Medium | Pilot 02: no pop-ups, engine ran first, sealed rolls stayed sealed. `Maneuver?` and one-reply-per-round not yet scored. Interiority slipped | **Keep, consolidate** to about 6 lines |
| 9 | Hands rule (R10) enforced by the Ledger | Printed | None (tool refuses) | Pilot 02: the Ref broke it all session. Selftest passes | **Keep**, moved into the tool |
| 10 | Session zero: Ref never rolls background or gold | HOUSE | None | Pilot 02 misread | **Keep** |
| 11 | No invented `Ref:` lines; rulings logged as `RULING:` | HOUSE | Low | Pilot 02 failure | **Keep** |
| 12 | Night travel EN -1 and bane on sight | HOUSE | Low | Wording bug found and fixed. Applied as intended | **Keep, minor** |
| 13 | Miasma Marks: taint counter, d12 table, marks fill pack slots (§17.14) | Liminal import, trigger and numbers HOUSE | None (Ledger counts) | Selftest only. Never played | **Keep as built; no more marks content until played** |
| 14 | Engine: `card`, `pos`, `day`, `moon`, `hunt`, flag rejection, `--why` lint | HOUSE tooling | None | Selftest passes. `card` fixes the card gap that failed Pilot 02 | **Keep** (tools do not add Ref judgment) |

Parked, not in the rules: per-dungeon mark tables, escalating marks, Ruin Boons, a Sentence layer for social beats, the card-deck artifact, pre-keyed dungeons and an app-run loop.

## 4. What the tests support (distilled)

Worked, repeatedly:
- **The Ledger and engine owning numbers.** Stat drift stayed near zero where they ran. Pilot 02: engine first, no pop-ups, sealed rolls sealed, encounter checks pasted verbatim.
- **RAW combat as the base.** Cleanest in every comparison.
- **Small layers on top of it:** Threat ticks, the tier-1 card, social moves.
- **Tools that refuse.** The hands rule failed in text and is now a tool check. Unknown flags and hidden numbers in `--why` are rejected before a roll.

Failed, and why:
- **Missing inputs (cards).** The Ref invents numbers when it has no card. Fix is the deck lookup.
- **Rules only text enforces** (hands rule, authored interiority, invented lines). Text alone failed in Pilot 02.
- **A plain message misread** as an answer to the Ref's own question. Fix: ask one short question.
- **Run-to-run noise** is as large as most effects we measured, so one trial cannot confirm a small rule.

Distillation:
1. **Core** = chassis + RAW §9 combat + rules 1 to 6 + a protocol of about six lines + the Ledger and engine. Aim for a hot card back at about 850 words.
2. **Appendices (off by default):** wilderness §16, Marks, any future boon or Sentence layer. The Ref loads one only when the table opts in.
3. **Move enforcement into tools** wherever a rule failed twice in text. Next candidates: `Maneuver?` as a Ledger prompt after an action, and a `round` command that returns all foe turns in `init` order.
4. **Admit a rule only through the five tests.** New rules start in `parking_lot.md`, not the layer.

## 5. How to keep measuring (cheap)
- **Rule exposure log.** In each pilot, note which rule fired and whether it was kept or broken. A rule that never fires in three pilots is a candidate to move to an appendix. A rule broken in two pilots goes to a tool or gets cut.
- **Card budget.** Re-count hot card words and Nevers after every change. Ceiling: v1.0's 830 words, plus one line per rule that passes the tests.
- **Selftest** before every push: `python3 engine/selftest.py`.
- **Two-pilot rule.** A text rule needs two clean pilots before it is called settled. One pass is within noise.

## 6. Open
- No pilot yet scores `Maneuver?` or the one-reply round (Pilot 03).
- Pull Strings and Sense Motive tiers 1 and 3 are untested.
- The thunder backlash ruling and the card-damage 1d6 have no printed source `[UNSOURCED]`.
- The wilderness and mark numbers are HOUSE guesses.

## 7. Done 2026-10-08 (v1.3)
Core plus appendices built as recommended: layer 8,439 to 7,391 words, hot card 1,244 to 780 (under v1's 830), Nevers 23 to 11, wilderness and Marks moved to appendices (off by default), §17 consolidated to an 8-item protocol. Marks gated by `ledger set marks 1`. Still to do: Pilot 03 on v1.3, then the exposure log.
