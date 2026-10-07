# How to play (solo Crows, LLM Ref)

## Where to play
| Venue | Use it for | Why |
|---|---|---|
| **Cowork, with this folder attached** | **Playing** (recommended) | Has a shell and files. The engine needs Python (engine README), and the Ledger and sealed file persist. The pilot checklist in this repo (`crows_08_pilot_checklist.md`) already scores Cowork on a 10-exchange test |
| **Claude Code** (terminal or cloud) | Maintaining this repo, tools and tables; also fine for play | Same shell and files. Text only, and a cloud session is ephemeral, so commit your SAVE |
| **A plain chat or project with no code tool** | Fallback | The layer's no-code default applies: the Ref asks you for its rolls ("Ref roll: 1d10"). You lose the tables, maps and wilderness data, and invented-number risk goes up (layer §1, §14) |

## What goes in the project (the "resident set")
Load these. They are small (about 100 KB together):
1. `crows_00_chassis_v3.md`: conduct and pacing.
2. `crows_01_system_layer_v1.2.md`: rules (v1 plus Amendment 1 plus the wilderness supplement). **Use v1.2, not v1 or v1.1.**
3. `crows_02_source_index.md`: where each rule and creature lives.
4. `crows_06_hot_card_v1.2.md`: the card the Ref re-reads at every DT end.
5. `03_director_sealed.md`: copy `03_director_sealed_template.md`, keep the Threats you want live. Ref only.
6. `engine/`: `engine.py`, `tables.json`, `tables_wyrd.json`, `maps/`, `ledger.py`. Run `python3 engine/validate_tables.py engine/tables.json engine/tables_wyrd.json` once.
7. (optional) `crows_08_pilot_checklist.md`.

**Source text** (needed because the layer streams one page at a time): your own copies of the five Playtest 2 books. Run `python3 tools/extract_sources.py <folder of the five .html files> crows/src`. It writes `crows/src/crows_0N_*.txt` with `===== PDFPAGE n =====` markers, which is what the index's page references use. **Do not commit these** (they are in `.gitignore`).

**Cards (items, weapons, armor, all 28 spellbooks).** Put your three card PDFs (files 02, 04, 05) in the project too, then run `pip install pymupdf` and `python3 tools/extract_cards.py <folder with the PDFs> crows/src/cards.json`. The Ref then prints any card with `python3 engine/engine.py card <name>` (`card spells` lists every spellbook, `card list` the whole deck). Do not commit `cards.json`.

**Leave out:** `out/` (research and trial transcripts), `runs_ABC.md` (the design brief), `src/`, the DW2 PDFs. The layer already carries the DW2 rules it uses.

## First session
1. Extract the sources (above). Copy the sealed template to `03_director_sealed.md`.
2. Set the state files: `export CROWS_STATE=$PWD/engine_state.json LEDGER_STATE=$PWD/ledger_state.json`.
3. Place the pack (`ledger place`, layer §17.12) once the Ledger exists.
4. Roll your background (2d6, Backgrounds table, C1) and 3d6 gc yourself. Read the background block, then make the Ledger: `python3 engine/ledger.py init custom name=<blank until spoken> bg=<background> S=2 A=1 M=0 stamina=9 ad=14 uses=Slashing:1 ud=torch:1 weapon=sword t2=3 t3=6` (numbers come from the background and gear; weapon damage is in the source index table). The characteristics you have not yet chosen can stay 0 until play asks (chardisc, layer §2.2).
4. Run the pilot first: ten exchanges including one fight and one encounter check, scored on `crows_08_pilot_checklist.md`.

## Start prompt (paste as your first message)
> You are the Ref for a solo Crows game. Load, silently and in this order: `crows_00_chassis_v3.md`, `crows_01_system_layer_v1.2.md`, `crows_02_source_index.md`, `03_director_sealed.md`. During play re-read only `crows_06_hot_card_v1.2.md`, at every DT end, scene end, village day change, or after 15 exchanges. Run the engine for every Ref roll, table, travel day, cycle, moon, hunt and map question, and paste its `Ref:` line as the mechanics line. `SEALED:` lines never reach me. My crow's rolls are made with `engine/ledger.py`; I paste the lines, you never recompute them. My first message gives my background and gc. Open in fiction.

## Notes
Ideas, decisions and reflections live in `parking_lot.md` (tagged, append only).

## SAVE
Two files (layer §17.8): `SAVE_open.md` for you, `SAVE_sealed.md` for the Ref only.
`python3 engine/engine.py export` gives the engine blob; `python3 engine/ledger.py state` gives the crow. Put both in the SAVE with the live prompt (layer §13). Start the next chat with the SAVE.

## What has and has not been tested
Tested (see `out/results.md`): 20 plus Ref trials with a scripted Player and the stand-in Ledger, on combat, social, a travel-and-cycle scene, a dungeon stretch and a swarm. **Not tested:** a human Player, long sessions, the starting crow's full arc, the wilderness supplement, Pull Strings and Sense Motive at tier 1 and 3. Treat the first sessions as the next test, and log failures in `crows_08_pilot_checklist.md` terms.
