# Into the Wyrd and Wild: what is worth taking for Crows

Source: *Into the Wyrd and Wild* (system neutral, OSR, 250 pp; Feral Indie Studio and Wet Ink Games, 2021). Page refs are its printed pages (from its contents). It is **all rights reserved**: paraphrase or keep tables as private data; do not republish text. Everything below is a **proposal** (speculative; nothing is in Amendment 1).

## Ranked by fit and cost

| # | Idea (W&W page) | Crows hook | Cost | Risk |
|---|---|---|---|---|
| 1 | **Factions as ready-made Threats** (134–156: Court of Broken Branches, Children of Eí-Criomòran, The Ruin, Wild Elves, Primal Wheel) | Amendment §5 Threats need Name, Goal, Assets, Developments, Reactions. A faction gives all five. The Court's three-night "Night Summons" (dream, wreath, song) is a built-in 3-step Development ladder. One example in the section below. | Low: 1 to 2 hours per Threat | Tone: it is fey and cosmic. Crows is survival horror in a necromancer-ruined land. Pick the grim ones |
| 2 | **Hazards & Traps, Wild Flora, Diseases, Random Trails, "I Search the Body", Wyrd & Wild Encounters, A Hundred Wyrd Locations** (200–237) | The engine's whole job is to roll printed tables so the Ref invents nothing. Crows has no POI or hazard generator beyond a few keyed POIs (R28–29, D2–3). These add content the engine can roll (`tables.json`, `validate_tables.py`). Directly serves the invented-number and soft-miss problems. | Medium: transcribe to `tables.json` | Licence (private use only); the numbers (damage, DCs, gold) are OSR and must be re-rolled or replaced with Crows tier tests and printed damage |
| 3 | **Moon phases** (20–21) | Encounter checks use EN by pace (R24; layer §9) and `travel --en-adj`. The moon shifts the encounter chance: new moon fewer, full moon more, plus special moons (Blood, Demented, and so on). A deterministic calendar the engine holds removes one more thing the Ref could drift on. Special moons double as Threat colour and as a Miasma RR modifier. | Low to medium: an engine `moon` command and a day counter | The calendar must be strict or it feels like spite (the book says so). Crows' clock is the 10-day village cycle, so a 30-day moon is 3 cycles: easy to align |
| 4 | **The Hunt** (16–17: Quarry, Marks, a d6 tracking chart with Boons and Setbacks) | Crows' Tracker role has "Track Specific Creature" (R26) and no clock. Marks are a Development ladder (mundane 1–2, uncommon 3–9, rare 10–20, mythic 24+). The d6 chart is engine-rollable. Gives a campaign verb besides delving: hunt a named creature. | Medium | Its setbacks spend OSR "supplies" and "exhaustion". Map them to Crows resources (rations, UD, wounds, expertise uses) |
| 5 | **Cleaning a Body** (18–19) | Crows has Harvest as a rest activity (R15), monster parts as crafting inputs (C36, C42) and "XP is treasure". The uncommon and rare goods d10 tables are flavour for what a corpse yields. | Low | The gold values are OSR. Use Crows prices (C32, C42). Do not import the "gold is supplies" idea |
| 6 | **Becoming Lost, return locations** (25) | Crows' getting lost is a secret 1d6 drift per hex (R27). The d8 "where you end up" table gives the Ref a landing place with a hook. | Low | None |
| 7 | **Madness and Call of the Wild** (22–28) | Crows' Miasma has levels of cruelty and a Miasma Effects table, and at 13+ a crow becomes a Ref-controlled NPC (layer §5). Quirks and mad states are texture for a crow or NPC at a given cruelty level. The d50 Call table suits the "Miasma-Touched" NPCs of F3–6. | Low | Overlaps Miasma Effects. Use as flavour for NPCs and retired crows, not as a second mechanic |
| 8 | **Bestiary** (29–132: about 50 wild creatures, with "uncommon and rare goods" and lures) | Crows' own bestiary is animals, humans, blood and undead only (layer §4; F1). Several W&W monsters are built around baiting and avoidance (a Snuff Hound is satisfied by a bonfire, p.120), which matches Crows' likes and hates (F30). | **High**: each needs a Crows block | Stat drift. The layer says build unlisted creatures from the nearest block and log the ruling (§4). Convert 5 to 8, not 50. Candidates: Snuff Hounds (120), Sparklight Canaries (122; also a lantern), Spindle Cat (123), Skunk Ape (116), Gripple Bats (76), Mycelium Zombie (94), Weald Sirens (128) |
| 9 | **Wilderness Dungeon generator** (188–199: dice-drop areas on a hex, trails, entrances) | Crows' dungeons are keyed (D). A generator gives unlimited solo dungeons. | High: it conflicts with DTs counted in rooms and with R24's 5-mile hex (W&W uses 6-mile) | Likely a separate mode. Skip until the amendment is played |
| 10 | **Artifacts of the Wild Hunter** (157–170) | Crows' unique items have XP values on their cards. These are unique treasure. | Medium | Conversion of effects |

## What not to take
- **Rule of Gold, Exhaustion, Surviving the Night** (12–15). Crows already has rations, a starvation wound (R16), Make Camp and the Supporter role (R25), and **gold is XP** (C6). "Gold as supplies" would break the XP loop. Exhaustion would double Crows' wounds.
- **Magic of the Wyrd** (171–186). Crows magic is spellbooks with rank, discipline and UD (R30+). Converting it is a project of its own.

## A worked example: a Threat from the Court of Broken Branches (speculative)
Paraphrased from p.136–139; not in any sealed file.

- **Name:** The Night Summons.
- **Description:** A lady of the woods marks villagers who have slighted the wilds and sends them a three-night summons.
- **Goal:** The village pays tribute and keeps its numbers in check, or is made an example.
- **Assets:** her sworn subjects, the curse-stitched (marked with a thin silver stitch that glows like moonlight); the three signs (dream, wreath, song); the Miasma.
- **Developments (4, regional):**
  1. A villager dreams of a meeting place.
  2. A wreath of spider silk and twigs is found on a door.
  3. A song calls a named villager out at night.
  4. The summoned return stitched, changed, and serving.
- **Reactions:** a curse-stitched hunter ambushes the crow on the road; a steward is summoned.
- **Ticks:** the three Amendment clocks. A rest outdoors in the Miasma could be where the song is heard.
- **Why it fits:** the village is the protagonist (layer §0). A threat that arrives as a *gift or a curse* gives the Ref a social problem for Pull Strings and Sense Motive without a fight.

## Where I would start
1. **Factions as Threats** (row 1) and **Becoming Lost** (row 6): lowest cost, no engine change.
2. **Moon** (row 3) and **the tables** (row 2): the engine already supports both ideas.
3. Leave **bestiary conversion** until the amendment has been played, so a stat-drift problem is not mixed with a rules test.
