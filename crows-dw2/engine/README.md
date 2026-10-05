# Crows Ref Engine

The Ref's dice, tables and maps as code. It removes the two error classes that break LLM refereeing: invented numbers, and table results or map geometry recalled from memory. The crow's own rolls stay in the Crow's Ledger. The engine only covers what the Ref owns (system layer §1).

## Files (project path `crows/engine/`)

| File | What |
|---|---|
| `engine.py` | The CLI. Python 3, stdlib only |
| `tables.json` | 93 printed tables and 6 short encounter descriptions, with page refs (see "Tables" below) |
| `maps/floating_manor.json` | Map grids, area seeds, Ref-only marks, links between levels |
| `gen_map_docs.py`, `map_legend.md`, `notes_floating_manor.md` | Rebuild `crows/maps/*.md` from the JSON |
| `validate_tables.py` | Checks table ranges after any edit |

## Setup (once per session)

Needs a shell with Python 3. That means a Cowork session attached to this project, or any chat with code execution that can read project files.

1. Copy `engine.py`, `tables.json` and `maps/*.json` from the project into one working folder, keeping `maps/` as a subfolder.
2. Set `CROWS_STATE` to a state file in that folder, or run from inside it (default `./crows_state.json`).
3. Continuing a game: `python3 engine.py import <blob>` with the `ENGINE:` blob from the SAVE's sealed half.

No shell? Nothing changes: the system layer's no-code-tool default applies (player-rolled "Ref roll" requests, tables read from the source).

## Output protocol

- `Ref: …` lines are open. Paste the line as the mechanics line, verbatim. Never re-roll, and never round a result to fit the story.
- `SEALED: …` lines never reach the player. Log them to the sealed ledger at the next scene boundary.
- `--secret` turns any roll into a SEALED line (R27 drift, NPC private checks, hidden-state fate checks).
- Map renders and `dist`, `los` and `where` answers are working notes. Show the player a `fog` render only when they ask for the map.

## Commands

| Need | Command |
|---|---|
| Any dice | `roll 2d10+3 --why "wolf bite"` |
| Monster attack, NPC test, suspicion (F31) | `test 2 --e 1 --why "undead C claw"` · add `--table monster_suspicious_circumstances` to print the tier's text |
| Side initiative (R18) | `init` |
| Encounter check (R14), off-sheet (rest, noise, POI) | `enc --en 8 --table undead_dungeon_encounters` |
| Any printed table | `table wild_animal_reaction` · `table backlashes --mod 2` · `tables animal` lists ids |
| Read a row without rolling (the player's tier test) | `read test_forage 14` |
| Mythic yes/no, CF 5 | `fate likely --why "is the gate barred"` |
| Travel day (R24–29) | `travel normal` · `--en-adj -1` from role results · `--lost` starts secret drift · `found` ends it |
| End of a village cycle (C45–47) | `cycle 0` (current Prosperity) or `cycle 0 --raised`. The event text is sealed until `event` |
| Place or move tokens | `tok floating_manor crow ground 5 -4` · `tok floating_manor lisbeth ground 0 3` |
| Reveal what the crow has seen | `area floating_manor ground 13` · `look floating_manor crow 6` (light radius, line of sight) |
| Range and sight | `dist floating_manor crow lisbeth` · `los floating_manor crow lisbeth` · `where floating_manor lisbeth` |
| Show a map | `map floating_manor ground fog` (player) · `player` (full handout) · `ref` (labels, hidden marks) |
| SAVE | `export`: put the one-line blob in the SAVE's sealed half |

## Map conventions

- Squares are 5 ft and diagonals count as 1 (R18).
- Walls, doors, windows and the mausoleum block sight. Doors are treated as closed; say so when one stands open.
- Area names: the dungeon key's numbers, plus `island`, `east hall`, `balcony`, `west hall`. `where` reports the area a square belongs to.
- A new map: digitize the image to `maps/<id>.json` (rows, `areas` seeds, `ref` marks, `links`), then run `python3 gen_map_docs.py <id>`.

## Tables

`tables.json` holds everything rollable in the four books except Backgrounds (the Ledger has it):
- travel, weather, merchants, travelers and Miasma-touched encounters (F1–F8);
- animals by habitat and Wild Animal Reaction (F9–12);
- Minor and Major Interesting Things (F12–14);
- blood and undead dungeon encounters (F32, F34) and suspicious circumstances (F31);
- Miasma Effects (R28), Backlashes (R32–35) and Village Event (C46–47);
- every printed tier test (`test_*`, `floating_manor_*`, `blood_library_*`, `ruined_*`), for reading a result with `read`.

Transcription notes live in each table's `note`. Three are printed errors, fixed and flagged there:
- Minor Interesting Things has a row overlap at 45–46.
- Backlashes misprints "62-64"; it's read as 63–64.
- The undead table's heading and die are misprinted; it's stored as d10.

`lost_direction` is derived from R27's rule (1 north, 2 northeast, then clockwise). The book doesn't print it as a table.

## What the engine does not own

- **The crow's state:** the Ledger owns it.
- **Fronts, clocks and NPC moves:** the sealed file owns them. The one exception is the sealed next Village Event, which the engine holds until it lands. One owner per fact (system layer §15).
