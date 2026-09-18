# -*- coding: utf-8 -*-
"""Hand-encoded chargen data: Size ladder, playable Races, Previous Careers.

Small and load-bearing enough to transcribe by hand rather than regex out of
the PDF dump, then verify verbatim against the source (same discipline as
equipment.py). Every number here has to match the book, because the macros
apply them.
"""
import json, re, unicodedata

# Ch.18. Ordered smallest to largest; index 5 is Medium, the human baseline.
SIZES = ["Minute", "Diminutive", "Tiny", "Little", "Small", "Medium",
         "Large", "Huge", "Massive", "Gargantuan", "Colossal"]
MEDIUM = SIZES.index("Medium")

# Applied only when a creature's size is CHANGED from its starting size (e.g. by
# magic). Bestiary stat blocks already bake their own size in, so these must not
# be re-applied to a creature just for being Large.
SIZE_STEP_EFFECTS = {
    "toughness": 1, "baseDamage": 2, "deathThreshold": 5, "initiative": -1
}

# Combat effects of a size DIFFERENCE between two combatants. These always apply.
SIZE_COMBAT_RULES = [
    (2, "reach",     "+1 Reach per 2 Sizes larger than the opponent"),
    (2, "grapple",   "Grappling is only possible up to 2 Sizes larger or smaller"),
    (2, "might",     "+20 Might per Size category of difference when Grappling"),
    (3, "maneuvers", "Drive Back, Trip and Disarm cannot be used against a creature 3+ Sizes larger"),
    (3, "monstrous", "Melee attacks from a creature 3+ Sizes larger cannot be parried, only Dodged"),
    (3, "easyToHit", "All Combat skills used against a creature 3+ Sizes larger are at +20"),
]

# name, d100, size, toughness, dt, lethalityBonus, toughnessCap, invBonus,
# skillMods, savvy, languages, exclusiveTalents, restrictions
RACES = [
    {
        "name": "Human", "d100": "01-70", "size": "Medium",
        "toughness": 0, "dt": 20, "lethalityBonus": 0, "toughnessCap": None,
        "skillMods": [],
        "savvy": ["one bonus Savvy skill of their choice"],
        "languages": [("cultural Language of the region", 70), ("Low Vestrian", 20)],
        "exclusiveTalents": [],
        "restrictions": [],
        "bonus": "One additional level of Expertise in any skill, and one additional Talent for which they meet the requirements.",
        "verify": "All Humans may take one bonus Savvy skill of their choice",
    },
    {
        "name": "Half-Orc", "d100": "71-80", "size": "Medium",
        "toughness": 1, "dt": 20, "lethalityBonus": 0, "toughnessCap": None,
        "skillMods": [("Willpower", -10)],
        "savvy": ["Endurance"],
        "languages": [("Orcish", 70), ("Low Vestrian", 20)],
        "exclusiveTalents": ["Blood-Fury"],
        "restrictions": ["Few if any Half-Orcs will be from the Civilized: Urban background.",
                         "Always male. Initial social encounters are uneasy affairs at best."],
        "bonus": "",
        "verify": "They start with \nToughness 1, and get",
    },
    {
        "name": "Dwarf", "d100": "81-90", "size": "Medium",
        "toughness": 0, "dt": 20, "lethalityBonus": 1, "toughnessCap": None,
        "skillMods": [("Endurance", 10), ("Inspire", -10)],
        "savvy": ["Locks & Traps"],
        "languages": [("Kharzhad", 70), ("Low Vestrian", 20)],
        "exclusiveTalents": ["Dwarven Swordsinger"],
        "restrictions": [],
        "bonus": "Reduce the required SLs of any extended Craft: Practical or Craft: Artistic roll by 2.",
        "verify": "Dwarves are hardy folk, gaining +10 to",
    },
    {
        "name": "Ogre", "d100": "91-95", "size": "Large",
        "toughness": 1, "dt": 22, "lethalityBonus": 0, "toughnessCap": None,
        # Ch.5: "They have 8 general Inventory ENC instead of 6." The actor
        # field (system.enc.invBonus) existed and was read by the sheet and by
        # TBE.encStatus, but nothing ever set it, so every Ogre carried 6.
        "invBonus": 2,
        "skillMods": [("Might", 10), ("Stealth", -20), ("Athletics", -20), ("Melee: Light", -20)],
        "savvy": [],
        "languages": [("Tusker", 70), ("Low Vestrian", 20)],
        "exclusiveTalents": ["Devouring Maw"],
        "restrictions": ["Ogres may not take any Civilized background.",
                         "Can only use Medium or Large shields.",
                         "Untrained in reinforced leather, mail, scale or plate: -20 to all Willpower rolls if worn.",
                         "May never become any type of Spellweaver or Fade.",
                         "Armor Training can be taken only once, giving training in Bone armor only.",
                         "The Breaking: on a critical failure using Resolve, attacks the nearest living thing at +10."],
        "bonus": "8 general Inventory ENC instead of 6.",
        # Overrides a career's Armor Training rank: "An Ogre can take this
        # Talent only once, gaining training in Bone armor only."
        "talentLimits": [{"talent": "Armor Training", "maxRanks": 1, "note": "Bone armor only"}],
        "verify": "An Ogre can take this Talent only once",
    },
    {
        "name": "Bolg Fiir", "d100": "96-99", "size": "Medium",
        "toughness": 0, "dt": 20, "lethalityBonus": 0, "toughnessCap": 2,
        "skillMods": [("Stealth", -10), ("Insight", -10)],
        "savvy": ["Melee: Light", "Missile", "Ancient Lore", "Arcana", "Naturewise"],
        "languages": [("Fionnan (Low Court)", 70), ("Low Vestrian", 20)],
        "exclusiveTalents": ["Whispered Inheritance"],
        "restrictions": ["No Bolg Fiir may take the Civilized: Urban background.",
                         "No Bolg Fiir can ever have a Toughness of more than 2."],
        "bonus": "With Patterned in the Weave: +10 to one Bind skill. Without it: +10 to all opposed rolls against Weave Magic. Ancestor Communion: a Hard (-20) Willpower roll on an Elven memory stone grants access to its memories.",
        "verify": "no Bolg Fiir can ever \nhave a Toughness of more than 2",
    },
    {
        "name": "The Replaced", "d100": "00", "size": "Medium",
        "toughness": 0, "dt": 20, "lethalityBonus": 0, "toughnessCap": None,
        "skillMods": [],
        "savvy": ["one bonus Savvy skill of their choice (as Human)"],
        "languages": [("Language of their cultural region", 70), ("Low Vestrian", 20)],
        "exclusiveTalents": ["Hunted By The Queen", "Thornmark"],
        "restrictions": ["Replaced can never be Spellweavers or Fades.",
                         "Must take the Hunted by the Queen Talent (free, mandatory at creation)."],
        "bonus": "Start with 20 in a specialty Lore skill, Dark Fae-wise. Gets all the Traits of a Human.",
        "startingSkills": [("Dark Fae-wise", 20)],
        "verify": "Replaced get all the Traits of a Human",
    },
]

# name, d10, pools (Combat/Adventuring/Social/Lore/Magic), customs, talents, silver
CAREERS = [
    ("Warrior", 1, (80, 50, 40, 30, 0), [(1, 20)],
     "Armor Training III, and one Combat Talent", "1d6*5",
     "Mercenaries, knights, archers, pirates, bandits, and anyone who lives by the sword."),
    ("Rogue", 2, (50, 70, 50, 30, 0), [(1, 20)],
     "Pick a total of two Talents from the Combat, Adventuring, or Social categories", "1d6*5",
     "Thieves, assassins, ruffians, burglars, swashbucklers, pirates, and all those who make a living outside the law."),
    ("Ranger", 3, (50, 80, 30, 40, 0), [(1, 20)],
     "On Through the Night or Armor Training I, and any one Combat or Adventuring Talent", "1d6*5",
     "Warriors of the wilderness, rangers often act as guides for those brave or foolish enough to leave their homes."),
    ("Speaker", 4, (20, 40, 80, 60, 0), [(1, 30)],
     "Two Social talents", "2d4*10",
     "Diplomats, envoys, raconteurs, or anyone who can sway individuals or groups with soaring rhetoric."),
    ("Bard", 5, (30, 50, 70, 50, 0), [(2, 20)],
     "Entertaining, and one Social Talent", "1d6*5",
     "A wandering minstrel, skald, singer, or performer, known for their knowledge of old stories and songs."),
    ("Civilian", 6, (50, 50, 50, 50, 0), [(1, 20)],
     "Experienced (during Rounding Out, get an extra 30 points on Adventuring, Social, or Lore skills), and any one Adventuring, Social, or Lore Talent", "2d6*10",
     "A townsman, guildsman, crafter, farmer, or any other vital role in a pseudo-medieval society."),
    ("Loremaster", 7, (20, 50, 50, 80, 0), [(3, 30)],
     "Literate and either Lecturer or Travel Planner", "2d4*10",
     "A scholar, expert, or wise one well versed in knowledge both esoteric and mundane."),
    ("Merchant", 8, (20, 60, 60, 60, 0), [(1, 30)],
     "Literate, and either Barterer or I See Your Mind", "3d6*10",
     "Masters of commerce, merchants travel the world (or set up shop) trading wares or services for profit."),
    ("Godbound", 9, (30, 40, 50, 60, 20), [(1, 30)],
     "Godbound, and either Literate or any one Lore Talent", "1d6*10",
     "A mortal servant chosen by a deity and granted the right to call upon divine aid, provided their Piety is maintained."),
    ("Spellweaver", 10, (20, 20, 20, 40, 100), [(1, 20)],
     "Patterned in the Weave, Literate", "1d6*5",
     "Wizards, sorcerers, warlocks; a Spellweaver pulls at the threads of reality to work their own will upon it."),
]

# Ch.7 step 4 (p.85). CAREERS' "talents" column above is exactly the book's
# free-text grant, e.g. Godbound's "Godbound, and either Literate or any one
# Lore Talent". The wizard used to auto-grant EVERY named Talent that turned
# up as a substring of that text, which silently gave Godbound both "Godbound"
# (correct, unconditional) AND "Literate" for free even though the book offers
# Literate *or* a Lore Talent as a player's choice -- same bug hit Loremaster
# (Lecturer + Travel Planner both granted instead of one) and Merchant
# (Barterer + I See Your Mind both granted). This table is the fix: "auto"
# lists only what is unconditionally granted; "picks" lists each free-choice
# slot the player must make by hand (a named short-list, a whole category, or
# both for Godbound's hybrid "named OR category" phrasing). Ranger genuinely
# gets two independent picks, so "picks" is a list.
CAREER_TALENT_PICKS = {
    "Warrior":    {"auto": ["Armor Training III"], "picks": [{"count": 1, "categories": ["Combat"]}]},
    "Rogue":      {"auto": [], "picks": [{"count": 2, "categories": ["Combat", "Adventuring", "Social"]}]},
    "Ranger":     {"auto": [], "picks": [
        {"count": 1, "named": ["On Through the Night", "Armor Training I"]},
        {"count": 1, "categories": ["Combat", "Adventuring"]},
    ]},
    "Speaker":    {"auto": [], "picks": [{"count": 2, "categories": ["Social"]}]},
    "Bard":       {"auto": ["Entertaining"], "picks": [{"count": 1, "categories": ["Social"]}]},
    "Civilian":   {"auto": ["Experienced"], "picks": [{"count": 1, "categories": ["Adventuring", "Social", "Lore"]}]},
    "Loremaster": {"auto": ["Literate"], "picks": [{"count": 1, "named": ["Lecturer", "Travel Planner"]}]},
    "Merchant":   {"auto": ["Literate"], "picks": [{"count": 1, "named": ["Barterer", "I See Your Mind"]}]},
    "Godbound":   {"auto": ["Godbound"], "picks": [{"count": 1, "named": ["Literate"], "categories": ["Lore"],
                                                     "note": "Literate, or any one Lore Talent"}]},
    "Spellweaver": {"auto": ["Patterned in the Weave", "Literate"], "picks": []},
}
_COUNT_WORDS = {1: "one", 2: "two", 3: "three"}

CATEGORIES = ["Combat", "Adventuring", "Social", "Lore", "Magic"]

# Ch.7 step 3, p.85-86. Pick 2 (or roll 1d6 twice). Each grants +5 to every
# listed skill, 1 Expertise level to one of them (player's choice), one of
# the three listed Talents, and a descriptor usable as a Personality Trait.
ABILITY_SCORES = [
    ("Strength", ["Melee: Medium", "Melee: Heavy", "Thrown", "Athletics", "Sail/Boat", "Intimidate"],
     ["Powerful Blow", "Sweeping Attack", "Strong Back"],
     ["Strong", "Big", "Brutish", "Powerful", "Muscled"]),
    ("Dexterity", ["Dodge", "Melee: Light", "Missile", "Ride", "Sleight of Hand", "Stealth"],
     ["Combat Awareness", "Quick and Quiet", "Quickdraw"],
     ["Fast", "Nimble", "Quick", "Dexterous", "Agile"]),
    ("Constitution", ["Might", "Endurance", "Survival", "Track", "Craft: Practical"],
     ["Enduring Watch", "Not Today, Death", "Mettle"],
     ["Tough", "Hardy", "Enduring", "Weathered", "Rugged"]),
    ("Intelligence", ["Locks & Traps", "Protocol", "Wit", "Ancient Lore", "Arcana", "Commerce", "Common Lore"],
     ["Tactician", "Travel Planner", "Inner Strength"],
     ["Smart", "Studied", "Intelligent", "Astute", "Cunning"]),
    ("Wisdom", ["Perception", "Willpower", "Insight", "Craft: Artistic", "Divinity", "Heal", "Naturewise"],
     ["Combat Awareness", "Fearless", "I See Your Mind"],
     ["Wise", "Perceptive", "Discerning", "Prudent", "Sage"]),
    ("Charisma", ["Deceive", "Inspire", "Perform", "Persuade", "Seduce", "Streetwise"],
     ["Feint", "Press the Point", "Allow Me To Introduce…"],
     ["Charismatic", "Magnetic", "Alluring", "Affable", "Natural Leader"]),
]
ABILITY_SCORE_VERIFY = "Choose (or roll 1d6 twice to randomly deter- \nmine) two Ability Scores"

# Ch.7 step 5, p.88-90. d10 Cultural Background table, then each background's
# bonuses as a flat list of "picks" -- (amount, count, options, expertise?).
# options is either a literal list of skill names (a closed choice, count=1
# meaning "one of these"; a single-name list is not really a choice at all,
# just a fixed bonus written the same way) or "CAT:<Category>" meaning "pick
# `count` distinct skills from that whole category". expertise=True picks add
# 1 Expertise level instead of a flat skill bonus.
CULTURAL_BACKGROUNDS = [
    {
        "name": "Civilized, Urban", "range": "1-3",
        "picks": [
            (20, 1, "CAT:Social", False),
            (20, 1, ["Common Lore"], False),
            (10, 2, "CAT:Combat", False),
            (10, 1, ["Perception"], False),
            (10, 4, "CAT:Social", False),
            (10, 1, ["Arcana", "Divinity"], False),
            (10, 1, ["Commerce"], False),
            (10, 1, ["Craft: Practical", "Craft: Artistic"], False),
            (10, 1, ["Heal"], False),
            (10, 1, ["Streetwise"], False),
            (0, 1, "CAT:Adventuring", True),
            (0, 1, "CAT:Lore", True),
        ],
        "silver": "1d6*10",
    },
    {
        "name": "Civilized, Rural", "range": "4-6",
        "picks": [
            (20, 1, ["Common Lore"], False),
            (20, 1, ["Craft: Practical"], False),
            (10, 2, "CAT:Combat", False),
            (10, 1, ["Athletics"], False),
            (10, 1, ["Endurance"], False),
            (10, 1, ["Perception"], False),
            (10, 1, ["Ride", "Sail/Boat"], False),
            (10, 1, ["Survival"], False),
            (10, 2, "CAT:Social", False),
            (10, 1, ["Arcana", "Divinity"], False),
            (10, 1, ["Heal"], False),
            (10, 1, ["Naturewise"], False),
            (0, 1, ["Naturewise"], True),
            (0, 1, "CAT:Adventuring+Lore", True),
        ],
        "silver": "1d4*10",
    },
    {
        "name": "Barbarian", "range": "7-8",
        "picks": [
            (20, 1, ["Common Lore"], False),
            (20, 1, ["Survival"], False),
            (10, 2, "CAT:Combat", False),
            (10, 1, ["Athletics"], False),
            (10, 1, ["Endurance"], False),
            (10, 1, ["Perception"], False),
            (10, 1, ["Ride", "Sail/Boat"], False),
            (10, 1, ["Stealth"], False),
            (10, 1, ["Track"], False),
            (10, 1, "CAT:Social", False),
            (10, 1, ["Divinity"], False),
            (10, 1, ["Heal"], False),
            (10, 1, ["Naturewise"], False),
            (0, 1, ["Survival"], True),
            (0, 1, "CAT:Adventuring+Lore", True),
        ],
        "silver": "1d4*5",
    },
    {
        "name": "Wanderer", "range": "9-0",
        "picks": [
            (20, 1, ["Ride", "Sail/Boat"], False),
            (20, 1, ["Naturewise"], False),
            (10, 2, "CAT:Combat", False),
            (10, 1, ["Athletics"], False),
            (10, 1, ["Endurance"], False),
            (10, 1, ["Perception"], False),
            (10, 1, ["Survival"], False),
            (10, 1, ["Track"], False),
            (10, 1, "CAT:Social", False),
            (10, 1, ["Common Lore"], False),
            (10, 1, ["Craft: Practical"], False),
            (10, 1, ["Divinity"], False),
            (10, 1, ["Heal"], False),
            (0, 1, ["Common Lore"], True),
            (0, 1, "CAT:Adventuring+Lore", True),
        ],
        "extraLanguage": 40,
        "silver": "1d6*5",
    },
]
CULTURAL_BACKGROUND_VERIFY = "1–3 Civilized, Urban\n4–6 Civilized, Rural\n7–8 Barbarian\n9–0 Wanderer"

# Ch.7 step 5, p.83-84. Human sub-culture: d100 range, name, starting Language.
HUMAN_CULTURES = [
    ("01-12", "Westlands", "Westronne"),
    ("13-24", "Angevarre", "Angevarran or High Angevarran"),
    ("25-30", "Thessia", "Thessian"),
    ("31-35", "Haedravik", "Vikstongue"),
    ("36-36", "Ironlanders", "Iron Tongue"),
    ("37-42", "Serpent's Teeth", "Pirate's Cant"),
    ("43-50", "Tical Dondala", "Dondalese"),
    ("51-58", "Dunblaine", "Gael"),
    ("59-64", "Old Vestrians", "Low Vestrian or High Vestrian"),
    ("65-69", "Hohenvall", "Meersreich"),
    ("70-77", "Vieksgradia", "Slahvac"),
    ("78-81", "Red Waste Tribals", "Sandspeech"),
    ("82-90", "Ansharir", "Ellaric (Anshari)"),
    ("91-95", "Drangia", "Khannish"),
    ("96-00", "Sattagoya Steppes", "Khannish"),
]
HUMAN_CULTURE_VERIFY = "01–12 The free and wild Westlands"

# Ch.7 step 6, p.91-101. Every entry grants a flat +10 to one of the listed
# skills (some have a Spellweaver-track alternative, noted separately in the
# book but not encoded here -- table shown by name only, per BACKLOG). Origin
# and Youth are 50 uniform 2-wide d100 entries each; Recent is 49 2-wide
# entries plus two single-value entries (99, 100) at the end -- verified
# directly against the source rather than assumed uniform.
LIFE_EVENTS_ORIGIN = [
    "Child of Revolt", "Legacy of Invention", "Tower of Secrets", "Faithful Companion",
    "Servant to Nobility", "Outside the Law", "Smuggler's Start", "Tied to the Streets",
    "Marked by the Weave", "River Rat", "Fated From Birth", "Far Trader", "Raised by a Sect",
    "Cursed Inheritance", "Imprisoned", "Bastard of High Blood", "Raised in the Wild", "Witness",
    "Orphan of War", "Apprentice of the Esoteric", "Far Traveler", "Heretic's Offspring",
    "Shipwrecked", "Apprenticed", "Haunted Home", "Diplomatic Upbringing", "Child of the Sands",
    "Raised by a Sage", "Tavern Kid", "Beast-Marked", "Crowd Pleaser", "Rising Star",
    "Revenge Sworn", "Secret Heritage", "Secret Sanctuary", "Little Thief", "Found Family",
    "Scion of Glory", "Blightmarked", "Soldier's Child", "Last Words", "Merchant's Life",
    "Village Protector", "Fateful Rescue", "Wild Child", "Student", "Child of Privilege",
    "Storykeeper", "Home of Ill Repute", "Oathsworn",
]
LIFE_EVENTS_YOUTH = [
    "Miraculous Recovery", "Itinerant Actor", "Dogsbody", "Nightmare Fuel", "Unexpected Stand-In",
    "Ever a Squire", "Tough Character", "Grifter", "Hunted", "Shady Trade", "Artist",
    "Sanguine Secret", "Gaoler", "River Run", "By Wits Alone", "Terrible Vision", "Weavebound",
    "Rebel Arisen", "Young Recruit", "Champion", "Labyrinth-Lost", "Healer's Apprentice",
    "Thrilling Pursuit", "Saboteur's Sidekick", "Harsh Migration", "Forbidden Lesson", "Dealmaker",
    "Courtly Spy", "Honey-Trap Hustler", "Amorous Adventure", "Sacred Grove", "Tricky Tinker",
    "Land of Legend", "Rite of Passage", "Trial of Strength", "Eagle Eye", "Narrow Escape",
    "Range Rider", "Vigilant Ally", "Spiritual Path", "Duel of Words", "Master's Plan",
    "Merchant Mariner", "Magician", "Counterfeiter", "Enforcer", "Firebrand", "Courtly Affair",
    "Strange Flora", "Glimpse Beyond",
]
LIFE_EVENTS_RECENT = [
    "Desperate Rescue", "Bitter Victory", "Arena Contender", "Gambler's Touch", "Back From the Dead",
    "Survivor", "Revenue Run-In", "Jailbreak", "Healer's Friend", "Pirate's Gambit", "Forced Labor",
    "Broken Promise", "Cavalry Charge", "Whisper Campaign", "Evangelist", "Clever Ingenuity",
    "Artist of the Wild", "Wayward Familiar", "Storm-Runner", "Stalwart Defender", "Stalker",
    "Ancient Mystery", "Informant", "Infiltrator", "Fortune Dealer", "Challenging Climb",
    "Sacred Vigil", "Lover's Lock", "Memorial Tribute", "Battered Vessel", "Courier",
    "Smuggled Goods", "Campfire Tales", "Secret History", "Battlefield Medic", "Deal of a Lifetime",
    "Improvised Repair", "Heroic Rescue", "Holy Revision", "Masked Entertainer", "Path to Ruin",
    "Close Bond", "Trial of the Wild", "Agent of Diplomacy", "Clever Theft", "Reluctant Revelation",
    "Waycutter", "Summoner's Call", "Forbidden Knowledge",
    # last two entries are single d100 values, not a pair (verified: p.101).
    "Haunted", "Forgotten Past",
]
LIFE_EVENTS_RECENT_TAIL_SINGLE = 2   # last 2 names above are single-value rows (99, 100), not pairs.
LIFE_EVENTS_VERIFY = "Roll once on the \nLife Event: \nOrigin"

# Ch.7 step 8, p.108. Age-based bonus skill points.
ROUNDING_OUT_AGES = [
    {"key": "Young", "endurance": 20, "dt": 1, "anyPoints": 70, "lorePoints": 0, "expertise": False},
    {"key": "Adult", "endurance": 0, "dt": 0, "anyPoints": 100, "lorePoints": 0, "expertise": False},
    {"key": "Old", "endurance": -20, "dt": -2, "anyPoints": 100, "lorePoints": 30, "expertise": True},
]
ROUNDING_OUT_VERIFY = "Young \ncharacters get: +20 Endurance"

# Ch.7 step 10, p.109-110. Pick 2-3 (or write your own).
PERSONALITY_TRAITS = [
    "Altruistic", "Callous", "Calm", "Cautious", "Compliant", "Deceitful", "Defiant", "Fearless",
    "Forgiving", "Friendly", "Honest", "Hopeful", "Humble", "Loyal", "Passionate", "Pessimistic",
    "Proud", "Self-serving", "Suspicious", "Trusting", "Unprincipled", "Vengeful",
]
PERSONALITY_TRAITS_VERIFY = "Altruistic Places the needs of others"

if __name__ == "__main__":
    raw = open("/tmp/tbe.txt", encoding="utf-8").read()
    flat = re.sub(r"\s+", " ", unicodedata.normalize("NFKD", raw))
    norm = lambda s: re.sub(r"\s+", " ", s).strip()

    bad = []
    for r in RACES:
        if norm(r["verify"]) not in flat:
            bad.append(("race", r["name"], r["verify"]))
    # Career pools appear as "Combat 80; Adventuring 50; Social 40; Lore 30; Magic 0"
    for name, d10, pools, customs, talents, sp, desc in CAREERS:
        seq = "; ".join(f"{c} {v}" for c, v in zip(CATEGORIES, pools))
        seq = seq.replace("Magic 20", "Magic ( Piety ) 20")   # Godbound is annotated
        if seq not in flat:
            bad.append(("career", name, seq))
        # CAREER_TALENT_PICKS must exist for every career and must not invent
        # any name, category or count that isn't actually in the book's own
        # "talents" text transcribed just above (checked as substrings of the
        # ALREADY-normalized `talents` string, not the whole book, so this
        # catches a transcription slip rather than re-deriving the rule).
        ctp = CAREER_TALENT_PICKS.get(name)
        if ctp is None:
            bad.append(("career-talent-picks", name, "missing CAREER_TALENT_PICKS entry"))
        else:
            tnorm = norm(talents)
            for a in ctp["auto"]:
                if norm(a) not in tnorm:
                    bad.append(("career-talent-picks-auto", name, a + " not found in: " + talents))
            for p in ctp["picks"]:
                # A plain "either X or Y" pair implies count=1 without ever
                # spelling out the word "one" -- only check the count word
                # when the pick is expressed against a category ("any one
                # Combat Talent", "two Social talents"), which the book
                # always does spell out.
                word = _COUNT_WORDS.get(p["count"])
                if word and p.get("categories") and word not in tnorm.lower():
                    bad.append(("career-talent-picks-count", name, f"'{word}' not found in: {talents}"))
                for n in p.get("named", []):
                    if norm(n) not in tnorm:
                        bad.append(("career-talent-picks-named", name, n + " not found in: " + talents))
                for c in p.get("categories", []):
                    if c not in tnorm:
                        bad.append(("career-talent-picks-category", name, c + " not found in: " + talents))
    for name in CAREER_TALENT_PICKS:
        if name not in [c[0] for c in CAREERS]:
            bad.append(("career-talent-picks", name, "no matching career"))
    for s in SIZES:
        if s not in flat:
            bad.append(("size", s, s))
    if norm(ABILITY_SCORE_VERIFY) not in flat:
        bad.append(("ability-scores", "header", ABILITY_SCORE_VERIFY))
    for name, skills, talents, descriptors in ABILITY_SCORES:
        if name not in flat:
            bad.append(("ability-score", name, name))
    if norm(CULTURAL_BACKGROUND_VERIFY) not in flat:
        bad.append(("cultural-background", "d10 table", CULTURAL_BACKGROUND_VERIFY))
    for cb in CULTURAL_BACKGROUNDS:
        if cb["name"] not in flat:
            bad.append(("cultural-background", cb["name"], cb["name"]))
    if norm(HUMAN_CULTURE_VERIFY) not in flat:
        bad.append(("human-culture", "d100 table", HUMAN_CULTURE_VERIFY))
    for _, name, _ in HUMAN_CULTURES:
        if name not in flat:
            bad.append(("human-culture", name, name))
    if norm(LIFE_EVENTS_VERIFY) not in flat:
        bad.append(("life-events", "header", LIFE_EVENTS_VERIFY))
    for table_name, table in (("origin", LIFE_EVENTS_ORIGIN), ("youth", LIFE_EVENTS_YOUTH), ("recent", LIFE_EVENTS_RECENT)):
        for ev in (table[0], table[-1]):
            if ev not in flat:
                bad.append(("life-event-" + table_name, ev, ev))
    if norm(ROUNDING_OUT_VERIFY) not in flat:
        bad.append(("rounding-out", "age table", ROUNDING_OUT_VERIFY))
    if norm(PERSONALITY_TRAITS_VERIFY) not in flat:
        bad.append(("personality-traits", "list", PERSONALITY_TRAITS_VERIFY))
    for t in PERSONALITY_TRAITS:
        if t not in flat:
            bad.append(("personality-trait", t, t))

    print(f"races {len(RACES)}  careers {len(CAREERS)}  sizes {len(SIZES)}  "
          f"ability-scores {len(ABILITY_SCORES)}  cultural-backgrounds {len(CULTURAL_BACKGROUNDS)}  "
          f"human-cultures {len(HUMAN_CULTURES)}  life-events {len(LIFE_EVENTS_ORIGIN)+len(LIFE_EVENTS_YOUTH)+len(LIFE_EVENTS_RECENT)}  "
          f"personality-traits {len(PERSONALITY_TRAITS)}")
    if bad:
        print("NOT FOUND VERBATIM IN SOURCE:")
        for kind, name, seq in bad:
            print("  ", kind, name, "->", repr(seq[:90]))
    else:
        print("every race, career pool and size verified against the rulebook text")

    def race_json(r):
        """Normalise the hand-authored tuples into the dict shape both the
        system and the macros read. Emitting raw pairs here was a real bug:
        the macro looked for m.skill on a two-element array and quietly
        downgraded every racial modifier to a manual note."""
        out = dict(r)
        out["skillMods"] = [{"skill": s, "mod": m} for s, m in r["skillMods"]]
        out["languages"] = [{"name": n, "value": v} for n, v in r["languages"]]
        out["startingSkills"] = [{"name": n, "value": v} for n, v in r.get("startingSkills", [])]
        out["talentLimits"] = r.get("talentLimits", [])
        out["invBonus"] = r.get("invBonus", 0)
        out.pop("verify", None)
        return out

    def d100_range(lo, hi):
        """TBE's own d100 convention: natural 100 reads as '00'."""
        face = lambda n: "00" if n == 100 else f"{n:02d}"
        return face(lo) if lo == hi else f"{face(lo)}-{face(hi)}"

    def life_events_json(names, tail_singles=0):
        paired = names if tail_singles == 0 else names[:-tail_singles]
        out = [{"range": d100_range(2 * i + 1, 2 * i + 2), "name": n} for i, n in enumerate(paired)]
        if tail_singles:
            start = 2 * len(paired) + 1   # e.g. 99
            for j, n in enumerate(names[-tail_singles:]):
                out.append({"range": d100_range(start + j, start + j), "name": n})
        return out

    json.dump({
        "sizes": SIZES, "mediumIndex": MEDIUM,
        "sizeStepEffects": SIZE_STEP_EFFECTS,
        "sizeCombatRules": [{"gap": g, "key": k, "text": t} for g, k, t in SIZE_COMBAT_RULES],
        "races": [race_json(r) for r in RACES],
        "careers": [{"name": n, "d10": d, "pools": dict(zip(CATEGORIES, p)),
                     "customs": c, "talents": t, "silver": sp, "desc": ds,
                     "talentPicks": CAREER_TALENT_PICKS.get(n, {"auto": [], "picks": []})}
                    for n, d, p, c, t, sp, ds in CAREERS],
        "abilityScores": [{"name": n, "skills": sk, "talents": ta, "descriptors": de}
                           for n, sk, ta, de in ABILITY_SCORES],
        "culturalBackgrounds": [
            {"name": cb["name"], "range": cb["range"], "silver": cb["silver"],
             "extraLanguage": cb.get("extraLanguage", 0),
             "picks": [{"amount": a, "count": c, "options": o, "expertise": e} for a, c, o, e in cb["picks"]]}
            for cb in CULTURAL_BACKGROUNDS
        ],
        "humanCultures": [{"range": r, "name": n, "language": l} for r, n, l in HUMAN_CULTURES],
        "lifeEvents": {
            "origin": life_events_json(LIFE_EVENTS_ORIGIN),
            "youth": life_events_json(LIFE_EVENTS_YOUTH),
            "recent": life_events_json(LIFE_EVENTS_RECENT, LIFE_EVENTS_RECENT_TAIL_SINGLE),
        },
        "roundingOutAges": ROUNDING_OUT_AGES,
        "personalityTraits": PERSONALITY_TRAITS,
    }, open("data/chargen.json", "w"), indent=1)
