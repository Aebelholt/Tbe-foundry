# Running The Broken Empires solo in Foundry

## The chassis: use CoC7, not a custom system

You asked what is cheapest in effort. It is **Call of Cthulhu 7th Edition** as the world system, with all TBE logic living in macros and roll tables.

Why:

- It is already a d100 roll-under sheet with unlimited custom skills you can type values into. That is 90% of a TBE character, since TBE has no ability score values, only skills, Talents, and five attributes.
- It ships a combat tracker, tokens, weapon and armor items, and NPC sheets.
- Zero build time. Custom System Builder gives a truer TBE sheet, but you pay for it with an afternoon of field-by-field construction before you roll a single die.

What you ignore or repurpose on the CoC7 sheet:

| CoC7 field | Use it as |
|---|---|
| Skills | TBE skills. Type the TBE value straight in. Add custom skills freely. |
| Magic Points (MP) | Resolve. Set max to your Max Resolve. |
| Hit Points | Death Threshold. Max 20 at start, count lethal Wound Points against it. |
| Armor | Armor value, as written. |
| Luck, Sanity | Unused. Hide or ignore them. |
| Characteristics (STR, CON...) | Unused. TBE ability scores are just a chargen prompt, they carry no value. |
| Bio or notes tab | Wound locations, Talents, goals, Personality Traits, Supply Dice. |

CoC7's own success tiers (Regular, Hard, Extreme) do not match TBE. Do not roll skills by clicking the sheet. Roll them with the macros in this pack, which read your sheet's skill values in a dropdown.

Move to Custom System Builder later if the manual wound and Resolve tracking starts to annoy you. The macros in this pack keep working, they are system-agnostic.

## Install, about ten minutes

1. In Foundry, create a world on the **Call of Cthulhu 7th Edition** system (v8.15, verified to Foundry v14).
2. Optional modules, all worth having: **Dice So Nice** (physical dice), **Mythic GME Tools** (extra oracles and chaos tracking if you want them alongside Ask the Weave), **Monk's Enhanced Journal** (session log and NPC cards).
3. Open the world, go to the **Macros** hotbar, click an empty slot, set Type to **Script**, and paste the whole of `TBE-Solo-Installer.js` into the command box. Save, then click it once.
4. You now have a `TBE Solo` folder in Macros, Roll Tables, and Journals.
5. Drag **TBE: Solo Panel** to a hotbar slot. It launches everything else, so one key covers the whole session.

Re-running the installer is safe. It replaces its own macros and tables, so you can reinstall after edits without duplicates. It does not touch anything else in your world.

## What is in the pack

**Macros**

- **Ask the Weave**: type the question, pick odds, get Extreme Yes / Yes / No / Extreme No. Doubles automatically fire a full Random Event, including an Empires List draw when the event calls for one.
- **TBE: Skill Roll**: pick a skill off the selected token's sheet or type a value, apply a task modifier, get success, criticals, and Success Levels computed correctly.
- **TBE: Opposed Roll**: two skills, or a skill against a Fixed Number. Runs the full resolution ladder and reports Degree of Success.
- **TBE: Subverted Scene**: state your expectation, roll Expected / Less / More / Unexpected, with the follow-up words or Event rolled for you.
- **TBE: Random Event**: an event on demand.
- **TBE: Empires List**: draws one of your 20 slots.
- **TBE: Solo Panel**: a launcher for all of the above.

**Roll tables**: Random Events, Event Randomizers I and II (all 200 words), Subverted Expectations, Opposing Difficulty, Empires List.

**Journal**: a one-page quick reference with the oracle chart and the play loop.

The macros read the tables by name, so anything you edit in a table shows up in the macros. Fill the Empires List by opening it in the Roll Tables tab and typing over the empty slots, keeping the five-number ranges as they are.

## The rules the macros implement

- Success Levels equal the tens die, minimum 1 on any success.
- Critical success on doubles under the skill, or the skill value exactly. Adds +3 SL.
- Critical failure on doubles over the skill.
- 01 to 05 always succeeds, 99 to 00 always fails.
- Skill of 0 or less still succeeds on 01 to 04 and crits on 05.
- Skill over 100 cannot critically fail and adds bonus SL from the excess, minimum 1.
- Opposed rolls: most SLs wins, then criticals beat non-criticals, then higher die, then higher modified skill. Fixed Numbers act as an automatic success and lose ties to a rolled skill.
- Both sides failing reports who would win if a winner is required.

Verified against the worked examples in Chapter 2 with a test harness, 30 checks, all passing.

## Playing a session

1. **Solo Panel** to open a scene: Subverted Scene, state what you expect.
2. Act. Skill Roll or Opposed Roll for anything the dice should decide.
3. Ask the Weave whenever you do not know, phrasing the question so a Yes creates a complication.
4. Update the Empires List when a new NPC, goal, or thread earns a slot.
5. Log the scene in a journal entry as you go. This is what makes a solo campaign readable a month later.

Take the solo house rules the book offers: Enhanced Defense (Solo) and Solo Constitution free, Lone Wanderer free if you use the full Travel rules, +2 NPC Tolerance in static social encounters, and hire NPC allies early.

## If you want more later

- A **TBE: Wound** macro that rolls the Wound Die with Toughness and prints the hit location result.
- Travel tables from Chapter 12 as roll tables, wired to a **Journey Leg** macro.
- Bestiary NPCs built as CoC7 NPC actors, with their skills as items.
- The full Custom System Builder sheet, if manual tracking wears thin.

Say the word and I will build any of them into the same installer.

---

Sources: [Call of Cthulhu 7th edition system](https://foundryvtt.com/packages/CoC7/), [Custom System Builder](https://foundryvtt.com/packages/custom-system-builder), [Mythic GME Tools](https://foundryvtt.com/packages/mythic-gme-tools). Table content is transcribed from your own copy of the TBE Core Rulebook v1.0 for personal use in your world.
