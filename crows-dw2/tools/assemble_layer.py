#!/usr/bin/env python3
"""Build crows_01_system_layer_v1.1.md and crows_06_hot_card_v1.1.md from the v1 files + Amendment 1 + the wilderness supplement."""
import re, os
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rd = lambda p: open(os.path.join(R, p)).read()
layer = rd("crows_01_system_layer.md"); hot = rd("crows_06_hot_card.md"); am = rd("out/crows_01_system_layer_amendment.md")
secs = {m.group(1): m.group(2) for m in re.finditer(r"\n## ([A-H]) · [^\n]*\n(.*?)(?=\n## [A-H] · |\Z)", am, re.S)}
def body(k):
    t = secs[k].strip()
    return re.sub(r"\n---\s*$", "", t).strip()
# A: threats paragraph
A = body("A"); A = A[A.index("**Imported layer: Threats with ticks"):]
i = layer.index("**Imported layer: fronts with portents"); j = layer.index("---\n\n## 6", i)
layer = layer[:i] + A + "\n\n" + layer[j:]
# B-E: new §9a..9d after the combat bullets, before Travel
new = []
for k, title in (("B", "9a · Combat housekeeping"), ("C", "9b · Social moves"), ("D", "9c · Ref move card"), ("E", "9d · Precedence where Crows and DW2 overlap")):
    b = body(k)
    b = re.sub(r"^Insert after[^\n]*\n+", "", b)
    new.append(f"**{title}** [Amendment 1]\n\n{b}\n")
layer = layer.replace("**Travel** (R24–29):", "\n".join(new) + "\n**Travel** (R24–29):", 1)
# header
layer = layer.replace("# CROWS — SYSTEM LAYER v1 (solo, village-anchored, chardisc)", "# CROWS — SYSTEM LAYER v1.1 (solo, village-anchored, chardisc)\n\n> v1.1 = v1 + Amendment 1 (Threats with ticks, social moves, Ref move card, precedence; §5, §9a to §9d, §13, §15) + the wilderness supplement (§16). §9 combat is unchanged from v1. See `out/changelog.md`.", 1)
# §11 oracle, §13 SAVE, §15.8
layer = layer.replace("1. **Crows tables first:** encounters, reactions, Interesting Things (F13–14), Village Events, backlashes.", "1. **Crows tables first:** encounters, reactions, Interesting Things (F13–14), Village Events, backlashes. Then the wilderness tables in `engine/tables_wyrd.json` (§16) for texture.")
layer = layer.replace("Chardisc blanks still open: …", "Threats:     name d/n · ticks this session t/2 · held n   (one line per live Threat; sealed half)\nChardisc blanks still open: …", 1)
layer = layer.replace("- No prose. It records portent ticks, clock days, NPC moves and rulings.", "- No prose. It records Threat ticks (`Threat <name> d/n: <what>`, `tick held (cap)`), clock days, NPC moves and rulings.")
sup = '''
---

## 16 · Wilderness supplement [IMPORTED from *Into the Wyrd and Wild* (Feral Indie Studio and Wet Ink Games, 2021), paraphrased, private use; every Crows conversion is HOUSE]

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
'''
layer = layer.rstrip() + "\n" + sup
layer = re.sub(r" \(Trials:[^)]*\)", "", layer)
layer = re.sub(r"\n\*\*Pace check[^\n]*\n", "\n", layer)
layer = re.sub(r"\n\*\*Untested in the trials\.\*\*[^\n]*\n", "\n", layer)
open(os.path.join(R, "crows_01_system_layer_v1.1.md"), "w").write(layer)
# hot card
h = hot
h = h.replace("- **Withdrawal (F16, F22, F31):**", "- **Tier 1 with no printed result:** name a move from the card (§9c) on the mechanics line (`Move: <name>`) and make it. A weapon miss keeps its counter. A tier 2 never takes a card move.\n- **Social:** Pull Strings and Sense Motive are Mind tests, called only when an NPC has something at stake and the Ref wants dice (§9b).\n- **Threat ticks:** three clocks only (Miasma rest outdoors, a cycle with no Prosperity rise, a natural 10 on an encounter check). Cap 2 a session. Put each tick in the fiction **and** the sealed ledger.\n- **Wilderness:** `day`, `moon` (`travel … --moon`), `hunt` and the `wyrd_*` tables (§16). Roll them; never recall them.\n- **Withdrawal (F16, F22, F31):**", 1)
h = h.replace("- A round number, initiative result, monster stat or damage number that didn't come from the engine, the creature's block or the Ledger.", "- A round number, initiative result, monster stat or damage number that didn't come from the engine, the creature's block or the Ledger.\n- A foe that is dead still rolling or taking a turn. Strike it from the scene line first.\n- A foe attack with no engine line.\n- A Threat tick written to the sealed ledger and not shown in the fiction.\n- Two card moves for one tier 1.", 1)
h = h.replace("the sealed file, the fronts, and", "the sealed file, the Threats, and")
h = h.replace("# HOT CARD (Crows Ref)", "# HOT CARD (Crows Ref) v1.1", 1)
open(os.path.join(R, "crows_06_hot_card_v1.1.md"), "w").write(h)
print("layer", len(layer), "hot", len(h))
