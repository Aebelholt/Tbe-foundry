# The Broken Empires (unofficial Foundry VTT system)

A native FoundryVTT system for *The Broken Empires*, built from scratch instead of
riding on a Call of Cthulhu 7e sheet wearing TBE's numbers. Actor and item data
(Death Threshold, Resolve, Toughness, Fatigue, the six hit locations, Supply
dice, skills, weapons, armor, shields) are real DataModel fields — every field
a macro reads or writes is visible and editable right on the sheet.

## What this is, and isn't

Combat, wounds, casting, and the rest of solo/GM play still run through the
companion macro pack (`TBE: Attack`, `TBE: Wounds & Recovery`, `TBE: Cast`,
and friends) — this system deliberately does not add sheet-native
click-to-roll buttons. The sheet's job is to be an honest data container; the
macros carry the actual game logic (roll resolution, wound math, the
maneuver table).

## Installing

This system has no public manifest, so install it manually:

1. Unzip the release into your Foundry `Data/systems/` folder, so you end up
   with `Data/systems/the-broken-empires/system.json`.
2. Restart Foundry (or refresh the Setup page) and create a new world with
   "The Broken Empires" as the game system.
3. Everything else is already there. Open the Compendium tab and look for the
   **The Broken Empires** folder.

## What ships in the box

Six compendium packs, grouped under one folder in the Compendium tab:

| Pack | Holds |
|---|---|
| TBE Tools | the 40 play macros (Attack, Wounds & Recovery, Cast, Extended Roll, Social Encounter, Advancement, Status, Character Wizard, Finish Character, Haggle, Solo Panel...) |
| TBE Talents | all 150 Chapter 4 Talents |
| TBE Weapons, Armor & Shields | the 50 equipment entries |
| TBE Bestiary | 56 creatures, each with its skills and attacks already attached |
| TBE Oracle Tables | the 6 solo oracle tables |
| TBE Reference | quick reference, statuses and perils, talents, equipment |

Drag the **TBE: Solo Panel** macro to your hotbar and it launches everything
else. Drag a creature onto the canvas and it arrives fully statted. Nothing has
to be pasted into a Script macro and nothing is written into your world database
until you actually import it.

The standalone installer scripts in the companion pack still exist for anyone
who wants the content copied into an existing world instead, but on a fresh
world the compendiums are the shorter path.

## Actor types

- **Character**: Death Threshold, Resolve, Toughness, Fatigue, Size, Race,
  Culture, Career, the six hit locations, Supply dice, silver, Status,
  Experience (available/earned XP, spent via `TBE: Advancement`), Biography,
  and a free Notes field.
- **Creature**: the same vitals and wounds, plus a Difficulty tier, Initiative,
  Ferocity, Move, Size, and a per-location armour grid (natural + worn AP).

## Size

Every actor sits on the Chapter 18 Size ladder (Minute to Colossal, Medium is
the human baseline). This is not a label. The gap between two combatants decides
whether the attacker gets +20 to hit, whether the defender may parry at all or
must Dodge, whether Drive Back, Trip and Disarm are legal, and what Reach and
Grapple look like. TBE: Attack applies all of it and shows its reasoning on the
chat card rather than silently adjusting numbers.

## Race

The six playable races carry the numbers the book gives them, applied by
TBE: Build Character rather than left as prose. An Ogre, for example, starts at
Toughness 1 with a Death Threshold of 22 at Size Large, takes +10 Might and -20
to Melee: Light, Stealth and Athletics, and may take Armor Training only once.

## Item types

- **Skill**: group (Combat/Adventuring/Social/Lore/Language/Wise/Bind), value,
  a Fighting flag for parry eligibility, Expertise (0, or Ex2/Ex3/Ex4 — a
  floor on SLs from a successful roll, Ch.4 p.54 & Ch.8 p.123), and a Savvy
  flag (+1 when improving that skill with XP).
- **Weapon** / **Shield**: damage (weapon only), non-lethal/ranged flags
  (weapon only), the linked skill name (weapon only), AP (shield only), the
  four Combat Maneuver costs (weapon only: Choose Location, Circumvent
  Shield, Disarm, Trip), and an ENC value with a Carried state (At Hand,
  sharing a 6 ENC pool, or Stored in Inventory — Ch.9 p.129 Encumbrance).
- **Armor**: AP, a checkbox per hit location (Head/Body/R Arm/L Arm/R
  Leg/L Leg) — one piece protects only what's checked on it (p.140: armor
  may not be layered), so a full suit is several armor items, one per
  location — and an Equipped flag (worn is free; un-equipped costs 1
  Inventory ENC and protects nothing).
- **Talent**: category, prerequisites, ranks taken, and what the rank was spent
  on. The full Chapter 4 catalogue (150 Talents) installs via
  `TBE-Talents-Installer.js`.

## Status effects

The full TBE status palette (wound impairment per location, Shock, Dying,
Infected, Septic, maneuver riders, Fatigue-family, and other perils) is
registered into Foundry's own status effect list at startup, so the token HUD
always has every status the book and the macro pack use, with a matching icon.

## Language

This system ships English only, deliberately. `lang/en.json` carries the sheet
and effect labels Foundry needs for its own menus; the rest of the UI text is
written directly into the templates, and the rulebook content it quotes exists
only in English. That is a decision, not an oversight -- if a translation is
ever wanted, the template text is what would need extracting first.
