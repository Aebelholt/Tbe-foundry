# The Broken Empires (unofficial Foundry VTT system)

A native FoundryVTT system for *The Broken Empires*, built from scratch instead of
riding on a Call of Cthulhu 7e sheet wearing TBE's numbers. Actor and item data
(Death Threshold, Resolve, Toughness, Fatigue, the six hit locations, Supply
dice, skills, weapons, armor, shields) are real DataModel fields — every field
a macro reads or writes is visible and editable right on the sheet.

## What this is, and isn't

Combat, wounds, casting, and the rest of solo/GM play run through the
companion macro pack (`TBE: Attack`, `TBE: Wounds & Recovery`, `TBE: Cast`,
and friends), which installs with the system. The sheet's own job is to be an
honest data container: it carries no rules of its own. The one deliberate
exception is that clicking a skill on the sheet rolls it, because a dropdown
is a bad way to teach someone the core mechanic on their first roll. That
button does arithmetic and nothing else, then hands the result to the same
resolution the macros use.

**You need the rulebook.** This is an unofficial system for playing *The
Broken Empires*. The macros carry the numbers and procedures, and quote the
book where they cite a page. The compendiums carry more than that: every
Talent's rules text, the Bestiary's creature descriptions and the Divine
Magic miracles are the book's own words. See **Licence** below.

## Requirements, and the modules that make it nicer

**Required: nothing but Foundry.** Minimum version 12, verified on 14.365.
No module is needed. Everything below is optional, and the system says so
when a feature notices one is missing.

| Module | What it adds | Without it |
|---|---|---|
| **Dice So Nice** | Attack, defence and Wound Die roll in their own colours, registered as "dice roles" under The Broken Empires, so the GM (Dice Roles table) and each player can recolour them. Useful when the GM runs both sides of a fight | Rolls work exactly the same, with no 3D dice |
| **Zone Movement** (or Alternate Zone Movement) | TBE measures in zones, not squares. These make the ruler and token dragging count zones drawn as Scene Regions | Measure zones by eye; `TBE: Zone Hazards` still reads the Regions |

Two things are **not** modules and still have to be supplied by you:

- **The blank fillable character sheet PDF.** `TBE: Sheet Exchange` fills the
  official B/W sheet (v13), but that PDF is the publisher's and is not shipped
  here. Put your own copy in your Data folder and point the world setting
  "Blank character sheet PDF" at it, or pick the file each time you export.
- **A copy of the rulebook**, for everything the system deliberately leaves to
  a human. `TBE: Rules Audit` cross-references each macro's formula to the
  chapter and page it came from, so a player can check the maths against
  their own book.

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
| TBE Tools | the 41 play macros (Attack, Wounds & Recovery, Cast, Extended Roll, Social Encounter, Advancement, Status, Create Character, Haggle, Solo Panel...) |
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
character creation (Create Character, on every character sheet's header) rather than left as prose. An Ogre, for example, starts at
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
  on. The full Chapter 4 catalogue (150 Talents) is in the TBE Talents
  compendium.
- **Strand** / **Thread** / **Enchantment**: Weave Magic (Ch.14): a caster's
  Strands, the Threads woven from them, and enchanted items.

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

## Licence

Two licences, for two different things:

- **The code** (`module/`, `templates/`, `css/`, the macro code in the TBE
  Tools compendium) is MIT, see `LICENSE.txt`.
- **The game content is not.** *The Broken Empires RPG* is a registered
  trademark of Evil Baby Entertainment LLC, and the rulebook is © 2026 Evil
  Baby Entertainment LLC, all rights reserved. The Talent text, creature
  descriptions, miracles and every quoted rule in the compendiums come from
  that book. The MIT licence does not cover them, and this system is not
  affiliated with or endorsed by the publisher.
- **pdf-lib** (`lib/`) is MIT, see `lib/pdf-lib.LICENSE.md`.
- **anvil-impact.png** is by Lorc, CC BY 3.0, from game-icons.net.
