# CROWS — SOURCE INDEX (bands and pages)

This file maps every named element to its book and page. It's read every session (chassis §3.3). Page = PDFPAGE, which equals the printed page.

**Source files:**
- `crows/src/crows_00_readme.txt`
- `crows/src/crows_01_rules.txt` (R)
- `crows/src/crows_02_characters.txt` (C)
- `crows/src/crows_03_ref.txt` (F)
- `crows/src/crows_04_dungeons.txt` (D)

**Extraction caveat.** Display-font headings lost letters. The first column below gives the true name, and the grep anchor is body text that survived. To fetch a page, grep `===== PDFPAGE n =====` and read up to the next marker.

## Bands

| Band | Pages | Residency |
|---|---|---|
| Core procedure | R5–R17 (tests, slots, damage, conditions, UD, DT, rests, light, hazards) | **Resident**; its rules are summarised in the system layer |
| Combat | R18–R23 | Stream when violence becomes likely; one read per fight |
| Travel and Miasma | R24–R29 | Stream when leaving the village; carry the Miasma table verbatim if cruelty > 0 |
| Magic | R30–R35 | Stream when a spellbook is used; backlash table on demand |
| Crafting and ID | R36–R37 | Stream at rest or in the village |
| Chargen and advancement | C1–C7 | At a new crow or when XP is spent |
| Trait trees | C8–C30 | Only the tree being bought from |
| Equipment | C31–C43 | Only the item in play; carry live cards verbatim |
| Village | C44–C55 | **Resident while in the village**; the event table at each cycle end |
| Encounters and tables | F1–F14 | The table rolled |
| Bestiary | F15–F38 | Only the creature in play |
| Dungeons | D1–D19 | Only the current dungeon; buffer = the next area |

## The Rules Book (R)

| Page | Contents (true headings) | Grep anchor |
|---|---|---|
| R2–3 | Fortune or Death!; Welcome to Cornath; the Archmages (Amaryll, Craelin, Ithnagio, Ornassa, Zaziel); the Gods (Gardner, Healer, Smith, Warrior, the Three) | "Cornath wasn’t always this way" |
| R4 | Players and the Ref; Playing the Game; Running the Game | "Let logic and creativity win" |
| R5 | Play the Dice Where They Fall; Dice; Game Exceptions; Always Round Down; Can I Be a Dwarf?; Creature and Object; Characteristics | "Characteristics" |
| R6 | No Interaction Characteristic; Magic and Mundane; Tests; Making a Test; Test Results (tiers) | "tier 1 result" |
| R7 | Tier 2 examples; Tier 3; Crits and Dooms; Trying Again; Edges and Banes | "Crits and Dooms" |
| R8 | Tests with Edges and Banes; Bonus and Penalties; Expertise; General Expertises table | "Expertises represent" |
| R9 | Spellcasting and Weapon Expertises; You’re an Expert; Special Tests (Assist, Attacks, Castings) | "An assist is a test" |
| R10 | Resistance Rolls; Group Tests; Hide and Sneak; Sizes; Inventory Slots | "Resistance rolls (RR)" |
| R11 | Magic Item Slots; Item Cards; Wearing Armor; Equipped Items; Swapping Slots; Carrying Corpses | "Swapping" / "Draw" |
| R12 | Damage and Death; Armor Defense; Piercing Damage; Stamina; Wounds; Conditions (Blessed, Grabbed, Prone, Vulnerable) | "fills up a backpack slot" |
| R13 | Unconscious; Weakened; Usage Dice; Equipment UD; Dungeon Turns; End of a DT; Greed Bonus | "Each DT is 30" |
| R14 | Outside the Dungeon; Adjusting DT Time (1d6-rooms variant); Dungeon Encounters (EN); Resting; Rest Encounters | "explore 1d6 rooms" |
| R15 | Rest Activities (Craft, Harvest, Identify, Prepare for Task, Repair Armor, Seclude Camp, Tend Wounds); Rest Activities in Town; Light; Bright Light | "Tend Wounds" |
| R16 | Dim Light; Darkness; Campfire; Dousing Light; Hazards (Falling, Starvation, Suffocation); Line of Effect; Cover | "Starvation" |
| R17 | Concealment; Invisibility | "Heavy concealment" |
| R18 | Combat; Grid; Size and Space; Squeezing; Reach; Surprised; Who Goes First; Turn; Common Maneuvers | "Who Goes First" |
| R19 | Maneuvers list; Grab; Escape Grab; Knockback; Taunt; Ready; Boring Stuff; Doing Shit; Making Attacks | "Boring stuff" |
| R20 | Melee Attacks (unarmed); Ranged Attacks; Improvised Weapons; Crits on Attacks; Multiple Targets; Flanking; High Ground | "Improvised weapons deal" |
| R21 | Reactions; Counter; Fighting Defensively; Opportunity Attack; Movement; Difficult Terrain; Swimming and Climbing | "counter attack" |
| R22 | Flying; Jumping; Teleporting; Pets in Combat; Forced Movement | "Pets in Combat" / "Push X" |
| R23 | Vertical; Into a Fall; Prepare for Battle; Toppling Objects | "Toppling" |
| R24 | Overland Travel; Hexes; Travel Procedure; Travel Pace; Changing Pace; Rivers and Roads; Travel Roles | "Travel Procedure" |
| R25 | Supporter (Fight the Miasma, Make Camp, Support Everyone); Guide (Normal, Safe, Shortcut route) | "Fight the Miasma" |
| R26 | Scout (Danger, Shelter, Treasure Hunt); Tracker (Forage, Hunt, Track Specific Creature) | "Treasure Hunt" |
| R27 | Lost; Back on Track; Miasma (RR, cruelty) | "levels of cruelty" |
| R28 | Miasma Effects table; Encounters and POIs | "d10 + Cruelty" |
| R29 | Travel Encounters; POIs | "Travel encounter checks" |
| R30–31 | Spellcasting; Spellbooks; Rank; Discipline; Casting Time; Target; Range; Area of Effect; Duration; Spellbook UD; Casting; Summoned Creatures; Magic Backlashes; Chaos Roll | "chaos roll" |
| R32–35 | Backlashes table (d100 + rank) | "Backlash" |
| R36 | Crafting (prerequisites, tools, harvesting, goal, rolls, multiples) | "crafting goal" |
| R37 | IDing Magic Items | "Identify Item" |

## The Characters Book (C)

| Page | Contents | Grep anchor |
|---|---|---|
| C1 | Crow Creation (steps); Backgrounds 2d6 table | "Roll For Background" |
| C2–6 | Background entries A–Z: Acolytes (Gardner, Healer, Smith, Three, Warrior), Alchemist, Apprentice Mage, Archer (C2); Assassin, Beggar, Blacksmith, Bodyguard, Cartographer, Conjurer, Cook, Duelist (C3); Entertainer, Executioner, Farmer, Gladiator, Hunter, Hydromancer, Illusionist, Keraunomancer (C4); Knight, Merchant, Miner, Noble, Pugilist, Pyromancer, Sage, Soldier (C5); Thief, Tinkerer, Transmuter, Village Watch (C6) | the background name in body text, e.g. "You burgled places" |
| C6 | Advancement (XP = treasure); Expertise & Stamina Advancement table | "total XP or TXP" |
| C7 | Characteristics Advancement; New PC After Death; Starting With More; Traits; Buying Traits; Trait Trees list | "Starting With More" |
| C8–30 | Trait trees, alphabetical: Alchemy 8, Alteration 9, Archery 10, Armor 11, Bashing 12, Benefaction 13, Blacksmithing 14, Camping 15, Chopping 16, Conjuration 17, Elemental 18, Enchantment 19, Illusion 20, Knowledge 21, Leverage 22, Necromancy 23, Pets 24, Reputation 25, Slashing 26, Stabbing 27, Thievery 28, Travel 29, Unarmed 30 | "For mastery of" / "XP Cost: 500 (Starting)" |
| C31 | Equipment; Inventory Cards; Fine and Masterwork | "Fine and" |
| C32 | Gear Prices | "Gear Prices" |
| C33–36 | Armor; Armor Prices; Armor Upgrades; Crafting Upgraded Armor; Armor Enchantments | "Armor Defense" |
| C37–41 | Weapons; Weapon Prices (C38); Upgrades; Weapon Enchantments | "equipment card shows how much" |
| C42 | Crafting Materials; Treasure; Pets; Pet Stats; Barding | "Crafting materials (such as" |
| C43 | Pet Shop; Vehicles; Hirelings (Employment Terms, Controlling Hirelings) | "Employment" |
| C44 | Death of a PC; **The Village**; Other Villages; Starting Village; PC Connection benefits | "Starting Village" |
| C45 | Connections (cont.); Village Cycle (10 days); Prosperity; Raising and Lowering Prosperity; Village Events; Trade; Buying and Availability; Selling | "A village cycle is 10" |
| C46–47 | Sale Percentages; Village Crafting; Village Event table (d10 + Prosperity) | "d10 +" |
| C48–54 | Institutions: Alchemist 48; Auction House, Barracks 49; Beacon, Blacksmith 50; Bookseller, Crypt 51; Enchanter, General Store 52; Inn, Stables 53; Temple, Your Home 54 | the institution name + "Founding Price" |
| C55 | Retirement; Not Your Village; Founding Other Villages | "Retirement" |

## The Ref Book (F)

| Page | Contents |
|---|---|
| F1 | Travel Encounters table (d100); Any Monster Encounter (d10: angel, blood, demon, plant, undead; only blood and undead exist in this playtest); Bad Weather; Blizzard; Cold Snap |
| F2 | Heat Wave; Rain; Sandstorm; Thunderstorm; Merchant (sales by institution); Merchant NPC |
| F3 | Merchant Guards; Miasma-Touched |
| F4–6 | Miasma-Touched Encounters (d100); Monster from Nearby; Strong Miasma; Traveler; Traveler Reactions |
| F7–8 | Travelers (d100 stat block); Traveler Rewards; Wild Animal |
| F9–10 | Animal Encounters by habitat: Coastal, Cold Climate (F9); Hill/Mountain, Marsh/Swamp (F10), plus the other habitats on these pages |
| F11–12 | Wild Animal Reaction (d100: asleep, attached, friendly, frightened, hungry, injured, protective, stalking, territorial, treasure-seeking) |
| F12–13 | Minor Interesting Things (d100) |
| F14 | Major Interesting Things (d100) |
| F15 | Creature Stats; Power; Reactions; Rest features; Attacks That Grab |
| F16 | Animals; Potential Pets; Wild Animals; Ending the Fight (animals) |
| F22 | Humans; Ending the Fight (humans) |
| F30 | Monsters (the six types); Monster Names; No Darkness Penalty; Likes and Hates |
| F31 | Suspicious Circumstances (2d10 + M); Ending the Fight (monsters) |
| F32 | Blood Creatures (likes and hates; Blood Dungeon Encounters; treasure) |
| F34 | Undead (likes and hates; Undead Dungeon Encounters; treasure) |

**Bestiary by page, as name (power):**
- **Animals.**
  - F16: Ape (4), Bear (6), Cave Bear (9).
  - F17: Camel (5), Cat (1), Big Cat (7), Wildcat (2), Chicken (0), Crocodile (6).
  - F18: Crow (0), Giant Crow (5), Deer (2), Dog (2), Donkey (3), Elephant (10), Goat (2).
  - F19: Hawk (1), Draft Horse (5), Riding Horse (5), War Horse (6), Monitor Lizard (4), Mule (4), an unlabeled Large power 8 animal (read in context), Rat (0).
  - F20: Giant Scorpion (7), Constrictor Snake (5), Venomous Snake (1), Giant Venomous Snake (4).
  - F21: Spider (0), Giant Spider (10), Wolf (3), Dire Wolf (5).
- **Humans.**
  - F22: Alchemist (3), Archer (4, 7).
  - F23: Archer (10), Blacksmith (3), Commoner (0), Conjurer (3), Cultist (3), Elementalist (3).
  - F24: Enchanter (3), Guide (5), Illusionist (3), Priest (3), Sage (3).
  - F25: Sage (6), Thief (3, 6, 9).
  - F26: Torchbearer (3), Transmuter (3), Trapper (5), Pike Warrior (4).
  - F27: Pike Warrior (7, 10), Sword Warrior (4, 7).
  - F28: Sword Warrior (10).
- **Blood creatures.**
  - F32: Blood Creature A (1), B (3).
  - F33: Blood Creature C (8); **the Ring Collector (20), a unique, Namlin, Craelin’s advisor**.
- **Undead.**
  - F34: A (2).
  - F35: B (4), C (6).
  - F36: D (10), E (12).
  - F37: F (15), G (20).
  - F38: H (25).

## The Dungeons Book (D) [Ref only]

| Page | Contents |
|---|---|
| D1 | Awarding Treasures; Guide Not Handcuffs; **Dungeon Hooks** (map from a connection, tavern rumor, merchant route, **a map left by NPC crows who never returned**); **Village: Gadwick**, in Castle Gadwick, Prosperity 0: Alchemist 1 (Brune), Auction House 1 (Lili), Barracks 2 (Cormal), Blacksmith 2 (Deirdre), Bookseller 1 (Rion), Enchanter 1 (Isaac), General Store 3 (Sorcha), Stables 3 (Anna), Temple 1 (Mackle), Inn 1 (Duna), Crypt 1 (Oda; boons Greed, Rescue, Vitality) |
| D2 | POI: Ruined Tower (rubble search, EN 7; the well with a crow’s skeleton and 94 gc) |
| D3 | POI: Ruined Windmill (difficult-terrain rubble; cellar with an **unconscious undead C** and bones holding 54 gc plus a Major Interesting Thing; collapsing second floor; spinning shaft with a steel knife) |
| D4–9 | **Dungeon: Blood Library** (Craelin’s library, scabbed in flesh; blood lake; EN 9, or 8/7 when bloodstained; Blood Creature Encounters; the Ring Collector features) |
| D10–19 | **Dungeon: Floating Manor** (Wolverly Manor over the Wist Weald; Lisbeth the scullery maid; EN 9, or 8 in combat outside area 15; Undead Encounters) |

The Cornath map and the Blood Library map are images and didn't survive extraction. Travel distances need the player’s map, or a Ref ruling logged as canon.

**Weapon damage (PT1 inventory cards, `crows/src/pt1_inventory_cards.txt`).** The PT2 text prints no per-weapon damage (C37 placeholder). Qualities, slots and prices on the PT1 cards match the PT2 weapon table (C38), so the damage is used until PT2 cards are supplied. Attack is 2d10 + the stat shown. Damage at tier 2 (12-16) and tier 3 (17+). In the Ledger's attack row, type the formula as shown ("3+S"); the sheet substitutes the crow's stat.

| Weapon | Slots | Range | Stat | T2 | T3 | Qualities |
|---|---|---|---|---|---|---|
| Hammer | 1 | Melee 1 / Ranged 5 | A or S | 2+stat | 4+stat | Bashing, Light, Pummeling |
| Mace | 1 | Melee 1 | S | 3+S | 6+S | Bashing, Pummeling |
| Knife | 1 | Melee 1 / Ranged 5 | A or S | 2+stat | 4+stat | Slashing, Light, Disengage, Parry 2 |
| Sword | 1 | Melee 1 | S (A with Finesse the Blade) | 3+S | 6+S | Slashing, Disengage, Parry 4 |
| Handaxe | 1 | Melee 1 / Ranged 5 | A or S | 2+stat | 5+stat | Chopping, Light, Dismember |
| Axe | 1 | Melee 1 | S | 3+S | 7+S | Chopping, Dismember |
| Stiletto | 1 | Melee 1 / Ranged 5 | A or S | 2+stat | 5+stat | Stabbing, Light, Brutal |
| Spear | 1 | Melee 1 | S | 3+S | 7+S | Stabbing, Brutal |
| Flail | 2 | Melee 2 | S | 3+S | 6+S | Bashing, Pummeling |
| Maul | 2 | Melee 1 | S | 4+S | 8+S | Bashing, Pummeling |
| Glaive | 2 | Melee 2 | S | 3+S | 6+S | Slashing, Disengage, Parry 6 |
| Greatsword | 2 | Melee 1 | S | 4+S | 8+S | Slashing, Disengage, Parry 6 |
| Halberd | 2 | Melee 2 | S | 3+S | 7+S | Chopping, Dismember |
| Greataxe | 2 | Melee 1 | S | 4+S | 9+S | Chopping, Dismember |
| Pike | 2 | Melee 2 | S | 3+S | 7+S | Stabbing, Brutal |
| Warpick | 2 | Melee 1 | S | 4+S | 9+S | Stabbing, Brutal |
| Shortbow | 1 | Ranged 10 | A | 1+A | 2+A | Bow, Cumbersome |
| Longbow | 2 | Ranged 20 | A | 2+A | 3+A | Bow |
| Crossbow | 2 | Ranged 15 | A | 3+A | 6+A | Bow, Reload |

Duelist example: Finesse the Blade (C, Slashing tree) lets Agility replace Strength on both the sword attack and its damage. With A+2 the sword hits for 5 at tier 2 and 8 at tier 3.

**Other PT1 material** (`crows/src/pt1_*.txt`, PT1 = May-June 2026, PT2 wins on conflict): the Monsters Booklet, the Blood Library booklet (an earlier version of D4-9, with skills where PT2 has expertises), dungeon loot cards (spellbooks, wands, rings), and the full inventory cards (potions, tools, armor, shields, crafting inputs).

**Digitized maps.** Floating Manor: `crows/maps/floating_manor_ref.md` (Ref, area numbers) and `crows/maps/floating_manor_player.md` (player). The positions (x,y) in both files are canon for movement, range and line of sight. Both are generated from `crows/engine/maps/floating_manor.json`.

**Tables as data.** `crows/engine/tables.json` holds every rollable table in the four books except Backgrounds, with page refs. `python3 engine.py tables <filter>` lists ids. Roll there instead of reading the page.

## Appended anchors (the GM appends here; newest last)

Format: `subject · BOOK page · grep anchor`
