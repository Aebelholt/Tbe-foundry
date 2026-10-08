# Appendix A: Wilderness supplement (off by default)

Load only if the table opts in. Needs `engine/tables_wyrd.json`. Every Crows conversion here is HOUSE and has not been played.

## Wilderness supplement [IMPORTED from *Into the Wyrd and Wild* (Feral Indie Studio and Wet Ink Games, 2021), paraphrased, private use; every Crows conversion is HOUSE]

All content is data in `engine/tables_wyrd.json` (33 tables; `engine.py tables wyrd`). The Ref rolls it with the engine and pastes the line. It invents no numbers: where an entry has a number, it is printed in the entry or rolled.

- **Calendar and moon.** `engine.py day +N` advances the campaign day (travel adds 1 itself). `engine.py moon` prints the phase and an **EN adjustment** for **overland travel and wilderness rest checks only** (not dungeon DT checks): new +2, crescent +1, half 0, gibbous −1, full −2; a Blood Moon adds −2 and doubles numbers encountered. Apply it with `travel … --moon`. A 30-day month is three village cycles. Special moons (`table wyrd_moon_special`, `moon special NAME`) are the Ref's call and are sealed until they rise. [HOUSE mapping of W&W p.20–21]
- **Hunts.** When the crow tracks a named creature (R26 Track Specific Creature), `engine.py hunt new NAME MARKS`, then `hunt day NAME` for each travel day spent on it (add `--adv` after a tier 3 on the Tracker's test). Marks are a clock: tracking result, then a major or minor setback, or a boon, from the hunt tables, scaled to Crows resources. When the marks are reached the quarry is found and the party plans the fight. [IMPORTED, W&W p.16–17, adapted]
- **Hazards.** For an unkeyed wilderness hazard, `table wyrd_hazards`. Each entry names the crow's RR stat and results at tier 1 and 2 (1d6 to 2d6 damage; AD and Stamina as printed, R12). [HOUSE conversion]
- **Diseases.** Crows prints no disease rule. House procedure: at the end of each rest the infected crow makes a Strength RR; **tier 3** counts toward the cure (the entry says how many in a row), **tier 1** worsens the disease one step as the Ref rules and logs. `table wyrd_diseases`. [HOUSE]
- **Harvest.** After a kill, the Harvest rest activity (R15) may yield `table wyrd_goods_uncommon` or `_rare` for texture. Prices and crafting inputs come from C36 and C42, never from W&W. [IMPORTED flavour, W&W p.18–19]
- **Madness and the Call of the Wild.** `wyrd_madness_quirk/_mad/_deep` and `wyrd_call_of_the_wild` are texture for a crow or NPC at a cruelty level (R27) or after a legendary encounter. They add flavour and the Ref rules any effect and logs it. They do **not** replace the Miasma Effects table. [HOUSE]
- **Places and paths.** `wyrd_locations` (100 POIs), `wyrd_trails`, `wyrd_body_search`, `wyrd_flora`, `wyrd_lost_return` (where a lost party ends up), and `wyrd_dungeon_prefix`/`_suffix`/`_danger`/`_secret` for improvised wilderness dungeons.
- **Patrons and lords.** `wyrd_task_minor/_major/_grand` (patron bargains) and `wyrd_lord_*` (a Lord of the Broken Court).
- **Not imported.** Rule of Gold, Exhaustion and Surviving the Night (gold is XP in Crows; rations, the starvation wound and Make Camp already cover them); the W&W bestiary (needs Crows stat blocks; use §4's "build from the nearest block and log"); Magic of the Wyrd; the wilderness-dungeon hex generator.

