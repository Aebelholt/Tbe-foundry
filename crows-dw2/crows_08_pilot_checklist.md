# Cowork Pilot: Pass/Fail Checklist

Run 10 exchanges in a fresh Cowork session with the start prompt. Include at least one fight and one encounter check. Score every reply. Stop early on the abort conditions.

## Setup (once)

- [ ] The engine ran before the first reply, and the first reply is fiction.
- [ ] The Ref read the Ledger state itself. I was never asked to paste STATE.
- [ ] No pop-up question, no task list and no plan appeared at any point.

## Per reply (hot card, "Before sending")

| # | Fiction first | Ends on the live situation | No menu or options | Nothing hidden shown | ≤1 question | Mechanics line is the engine's, verbatim | Status line only, not a dump | Pass |
|---|---|---|---|---|---|---|---|---|
| 1 | | | | | | | | |
| 2 | | | | | | | | |
| 3 | | | | | | | | |
| 4 | | | | | | | | |
| 5 | | | | | | | | |
| 6 | | | | | | | | |
| 7 | | | | | | | | |
| 8 | | | | | | | | |
| 9 | | | | | | | | |
| 10 | | | | | | | | |

## Mechanics, checked once each

- [ ] Encounter check: the line is the engine's, and the result was read the printed way (10 = now; EN or higher = sign now, encounter next DT).
- [ ] Fight: initiative, monster attacks and counters come from the engine. The Ref never states a number it didn't roll.
- [ ] Fight: distance or sight was answered by `dist` or `los` on the map, not guessed.
- [ ] A secret roll stayed secret, and the Ref did not hint at it.
- [ ] Ledger lines (mine or the Ref's) were taken as given, never recomputed.
- [ ] After the fight, consequences land in the Ledger and the fiction. The Ref doesn't re-tabulate my sheet.

## v1.2 additions (Pilot 02)

- [ ] `Maneuver?` appeared after the crow's action and was used or declined.
- [ ] One reply covered the whole round; one compact roll line per action.
- [ ] Every crow roll has a Ledger line (the Ref rolling through the Ledger is the default; the player can take any roll).
- [ ] Hidden numbers went in `--note`; no `Ref:` line the engine did not print.
- [ ] The crow's thoughts and reflexes were not authored.
- [ ] Items used were in a hand slot.
- [ ] Missing cards were read with `engine card`; any placeholder was logged as `RULING:`.
- [ ] Distance: `dist` or `los` when a map exists; otherwise `pos`, set once.

## Scene end

- [ ] The sealed file got new lines (one per change, no prose) and `SAVE_open.md` and `SAVE_sealed.md` were written.
- [ ] Nothing was written mid-scene.

## Verdict

- **Adopt Cowork** if at most 1 reply failed the per-reply check, no mechanics item failed, and there were no pop-ups or task lists.
- **Split by venue** if 2 or more replies failed, or any mechanics item failed twice. The chat runs narrative and the Cowork Ref runs fights only, with COMBAT IN and COMBAT OUT blocks.
- **Abort and fix the prompt** at the first pop-up, task list, or number the engine didn't produce. Add the failure to the Cowork section, then restart the pilot.
