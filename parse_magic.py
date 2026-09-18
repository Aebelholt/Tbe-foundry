"""Extract Ch.14 Weave Magic's structural data: the five Binds, the ten
Strands, and the twelve Convocations.

Strands are NOT percentile skills. They are a 1-to-10 (and beyond) level
track with their own XP curve, and chargen was handing Spellweavers a
placeholder "Strand, name it" at 0, which is the worst kind of gap: a real
character type the system could not build.

Run: python3 parse_magic.py   (writes data/magic.json, exits non-zero on any
verification failure)
"""
import json, re

SRC = "/tmp/tbe.txt"
raw = open(SRC, encoding="utf-8").read()
lines = raw.split("\n")


def flat(a, b):
    t = "\n".join(lines[a:b])
    t = re.sub(r"(\w)[-‐]\s*\n\s*(\w)", r"\1\2", t)
    t = re.sub(r"\s*\n\s*", " ", t)
    return re.sub(r"\s{2,}", " ", t).strip()


# ---- Binds and Strands, from their "Bind: X" / "Strand: X" entries ---------
def entries(kind, a, b):
    t = flat(a, b)
    hits = list(re.finditer(kind + r":\s*([A-Z][a-z]+)\s", t))
    out = []
    for i, m in enumerate(hits):
        end = hits[i + 1].start() if i + 1 < len(hits) else len(t)
        desc = t[m.end():end].strip()
        # the description runs until the next entry; trim page furniture
        desc = re.split(r"\b\d{2,3}\s+chapter \d+", desc)[0].strip()
        out.append({"name": m.group(1), "desc": re.sub(r"\s{2,}", " ", desc)[:400]})
    return out


binds = entries("Bind", 19276, 19386)
strands = entries("Strand", 19386, 19500)

# ---- Convocations ---------------------------------------------------------
CONV_A, CONV_B = 7383, 7475
conv_text = flat(CONV_A, CONV_B)
# each block: <Name> Binds: a, b Strands: w, x, y, z Thin Strands: p, q
# Each block reads: NAME Binds: a, b Strands: w, x, y, z Thin Strands: p, q
# A single regex bleeds the following Convocation's name into the Thin Strands
# list (the verification below caught exactly that), so parse token-wise and
# stop each list once it holds the right number of KNOWN names.
STRAND_WORDS = {"air", "beast", "beasts", "body", "earth", "fire", "plant", "plants",
                "spheres", "spirit", "thought", "water"}
BIND_WORDS = {"change", "conjure", "control", "destroy", "witness"}


def take(tokens, valid, n):
    """Pull the next n tokens that are known names; return them and the rest."""
    got, i = [], 0
    while i < len(tokens) and len(got) < n:
        t = tokens[i].strip(" ,")
        if t.lower() in valid:
            got.append(t)
            i += 1
        else:
            break
    return got, tokens[i:]


convocations = []
chunks = conv_text.split("Binds:")
# chunks[0] is the intro; each later chunk starts with this Convocation's
# Binds and ends with the NEXT Convocation's name.
pending_name = chunks[0].split("magical style.")[-1].strip()
for chunk in chunks[1:]:
    m = re.search(r"(.*?)Strands:(.*?)Thin Strands:(.*)$", chunk, re.S)
    if not m:
        continue
    bind_toks = re.split(r"[,\s]+", m.group(1).strip())
    strand_toks = re.split(r"[,\s]+", m.group(2).strip())
    rest_toks = re.split(r"[,\s]+", m.group(3).strip())
    bl, _ = take([t for t in bind_toks if t], BIND_WORDS, 2)
    sl, _ = take([t for t in strand_toks if t], STRAND_WORDS, 4)
    tl, leftover = take([t for t in rest_toks if t], STRAND_WORDS, 2)
    convocations.append({"name": pending_name, "binds": bl, "strands": sl, "thinStrands": tl})
    # whatever follows the two Thin Strands is the next Convocation's name
    pending_name = " ".join(leftover).strip(" 0123456789")

# The Convocation table writes "Beasts"/"Plants"; the Strand entries name them
# "Beast"/"Plant". Canonicalise to the Strand entry spelling.
canon = {s["name"].lower(): s["name"] for s in strands}
alias = {"beasts": "Beast", "plants": "Plant"}


def fix(nm):
    k = nm.strip().lower()
    return alias.get(k) or canon.get(k) or nm.strip()


for c in convocations:
    c["strands"] = [fix(x) for x in c["strands"]]
    c["thinStrands"] = [fix(x) for x in c["thinStrands"]]
    c["binds"] = [x.strip() for x in c["binds"]]

# ---- Rules constants, each quoted from the book ---------------------------
RULES = {
    "strandRange": [1, 10],
    "strandXpIsNextValue": True,
    "strandXpQuote": "To increase a Strand, spend XP equal to the next highest value.",
    "strandSequentialQuote": "Improvements must be sequential",
    "strandBeyondTenFraying": 1,
    "strandBeyondTenQuote": "for each point a Strand is raised above 10, the Spellweaver gains 1 Fraying.",
    "fadeStrandCap": 7,
    "fadeStrandQuote": "a Fade's Strands can never be developed past 7. Fades are not limited by Thin Strands.",
    "chargenStrandCap": 5,
    "chargenStrandQuote": "No Strand can be developed past level 5 during character creation.",
    "newStrandTalentXp": 5,
    "newThinStrandTalentXp": 10,
    "newStrandQuote": "they may spend 5 XP to acquire the Strand Secret Talent, granting the Strand a starting value of 1. If the Strand is a Thin Strand, the cost is instead 10 XP.",
    "frayingRollQuote": "Roll 1d100. If the result is less than or equal to (Total Fraying - Max Resolve) × 2, the Spellweaver is forcibly purged from the Tapestry of reality.",
    "frayingIrreversibleQuote": "There is no way of reducing Fraying points,",
    "fadeCritFailFraying": 1,
    "fadeCritFailQuote": "Those with a Faded Pattern accumulate Fraying at an even faster rate: every time they roll a critical failure on a casting roll, they accumulate 1 Fraying point",
    "spellweaverChargen": {
        "binds": 2, "strands": 4, "thinStrands": 2,
        "bindBonus": 10, "magicPool": 100, "bindCapAtChargen": 70,
        "strandLevels": 10, "extraStrandLevels": 3,
        "quote": "Select 2 Binds, 4 Strands, and 2 Thin Strands... Add +10 to each of your two chosen Bind skills... Spend the 100 Magic skill points among any of the five Binds. No Bind may be developed past 70... Add 10 levels of Strands among any of your chosen 4 Strands. Add three additional levels of Strands to any Strands except Thin Strands.",
    },
}


# ---- Shaping costs (p.282) and Effect costs (p.288-298) -------------------
# Hand-transcribed, then verified below: every row carries a `q` quote that
# must appear verbatim (normalized whitespace) in the book region it came
# from. This is the same self-verifying pattern as chargen.py/equipment.py,
# and it is what lets the Cast macro price a spell from the book's own
# numbers instead of asking the player to look them up.

def region(a, b):
    i = raw.index(a)
    j = raw.index(b, i)
    return flat_text(raw[i:j])


def flat_text(t):
    t = re.sub(r"(\w)[-‐]\s*\n\s*(\w)", r"\1\2", t)
    t = re.sub(r"\s*\n\s*", " ", t)
    return re.sub(r"\s{2,}", " ", t).strip()


SHAPE_REGION = region("Shaping Costs\nMagnitude TC", "Casting Time\nThe time it takes")
EFFECT_REGION = region("These are the most common effects Weave", "An Example of Spellbinding")

SHAPING = {
    "magnitude": [
        {"name": "Discreet", "tc": 0, "q": "Discreet +0"},
        {"name": "Subtle", "tc": 2, "q": "Subtle +2"},
        {"name": "Offensive", "tc": 5, "q": "Offensive +5"},
        {"name": "Vulgar", "tc": 10, "q": "Vulgar +10"},
    ],
    "target": [
        {"name": "Self", "tc": 0, "tcInProse": True, "q": "Self free"},
        {"name": "1 individual", "tc": 2, "per": 2, "book": True,
         "note": "+2 TC per additional individual",
         "q": "An Individual target (2 TC, +2 TC per additional)"},
        {"name": "1 zone", "tc": 3, "q": "1 zone 3"},
        {"name": "2 zones", "tc": 5, "q": "2 zones 5"},
        {"name": "3 zones", "tc": 7, "q": "3 zones 7"},
        {"name": "Structure", "tc": 9, "ritual": True, "q": "Structure (Ritual only) 9"},
        {"name": "Bounded Area", "tc": 10, "ritual": True, "fraying": "1d6",
         "q": "Bounded Area (Ritual only, +1d6 Fraying) 10"},
    ],
    "range": [
        {"name": "Self", "tc": 0, "tcInProse": True, "q": "Range TC Self free"},
        {"name": "Touch/Engaged", "tc": 1, "q": "Touch/Engaged 1"},
        {"name": "Close/Short", "tc": 2, "q": "Close/Short 2"},
        {"name": "Medium/Long", "tc": 3, "q": "Medium/Long 3"},
        {"name": "Very Long", "tc": 4, "q": "Very Long 4"},
        {"name": "Sight", "tc": 5, "q": "Sight 5"},
        {"name": "Arcane Tether", "tc": 6, "q": "Arcane Tether 6"},
    ],
    "duration": [
        {"name": "Instant", "tc": 0, "tcInProse": True, "q": "Duration TC Instant free"},
        {"name": "One Round (6 seconds)", "tc": 1, "q": "One Round (6 seconds) 1"},
        {"name": "Concentration", "tc": 2, "q": "Concentration 2"},
        {"name": "1 Minute (10 rounds)", "tc": 3, "q": "1 Minute (10 rounds) 3"},
        {"name": "1 Hour", "tc": 4, "q": "1 Hour 4"},
        {"name": "Sun (to the next Sunup/Sundown)", "tc": 5, "q": "Sun (to the next Sunup/Sundown) 5"},
        {"name": "Week", "tc": 6, "ritual": True, "q": "Week (Ritual only) 6"},
        {"name": "Fortnight", "tc": 7, "ritual": True, "q": "Fortnight (Ritual only) 7"},
        {"name": "Month", "tc": 8, "ritual": True, "q": "Month (Ritual only) 8"},
        {"name": "Year", "tc": 9, "ritual": True, "fraying": "1d4", "q": "Year (Ritual only, +1d4 Fraying) 9"},
        {"name": "Permanent", "tc": 10, "ritual": True, "fraying": "2d6",
         "q": "Permanent (Ritual only, +2d6 Fraying) 10"},
    ],
    # Add-ons that are not a single picked row but a per-target/per-instance
    # surcharge. Each is a real, separately-priced decision at the table.
    "extras": [
        {"key": "extraIndividuals", "label": "Additional individual targets", "tc": 2, "per": True,
         "q": "+2 TC per additional individual"},
        {"key": "chooseLocation", "label": "Choose the struck location (per target, chosen after the roll)",
         "tc": 2, "per": True, "q": "+2 TC to Choose Location on an"},
        {"key": "exemptIndividuals", "label": "Individuals in a targeted zone exempted from the Effect",
         "tc": 2, "per": True, "q": "exempted from a spell's Effect for +2 TC per individu"},
        {"key": "ignoreShield", "label": "Ignore shield AP (per target, after the roll)", "tc": 2, "per": True,
         "q": "After the roll, shield AP can be bypassed. For +2 TC per target, ignore shield AP."},
        {"key": "ignoreArmor", "label": "Ignore up to 3 armor AP in the struck location (per target, after the roll)",
         "tc": 1, "per": True,
         "q": "Per target, for every +1 TC, ignore up to 3 armor AP in the struck location."},
        {"key": "trigger", "label": "Triggered Effect (delay the Effect until a described condition)",
         "tc": 1, "per": True, "max": 9, "q": "Triggered Effect +1"},
    ],
    "armorPenaltyQuote": "Initiative penalty of worn armor acts as a positive modifier to every spell's TC.",
}

# Effects. `rows` are picked one at a time; `per` marks a row whose TC is
# multiplied by a count the player enters (damage points, WP healed).
EFFECTS = [
    {"key": "actions", "name": "Add Actions", "region": "effect",
     "note": "Duration must be One Round. Extra actions occur at the end of the round.",
     "rows": [
         {"label": "+1 Action", "tc": 5, "q": "5 +1 Action"},
         {"label": "+2 Actions (+1 Fraying)", "tc": 10, "fraying": 1, "q": "10 +2 Actions, +1 Fraying"},
     ]},
    {"key": "ap", "name": "Armor Points", "region": "effect",
     "note": "Protection equal to worn armor; can also nullify AP, or give a weapon Piercing.",
     "rows": [
         {"label": "+1 AP", "tc": 1, "q": "TC Armor Point Modifier|1 +1 AP"},
         {"label": "+2 AP", "tc": 2, "q": "2 +2 AP"},
         {"label": "+3 AP", "tc": 4, "q": "4 +3 AP"},
         {"label": "+4 AP", "tc": 6, "q": "6 +4 AP"},
         {"label": "+5 AP", "tc": 8, "q": "8 +5 AP"},
         {"label": "+6 AP", "tc": 10, "q": "10 +6 AP"},
     ]},
    {"key": "attackExternal", "name": "Attack: External damage", "region": "effect",
     "note": "Target keeps armor and shield AP; usually resisted by Dodge. Duration must be Instant.",
     "rows": [
         {"label": "Damage equal to your Strand value", "tc": 1,
          "q": "For 1 TC, an External attack spell's damage is equal to its Strand score."},
         {"label": "Each extra point of damage above your Strand value", "tc": 1, "per": True,
          "q": "Additional damage costs +1 TC per extra point of damage."},
     ]},
    {"key": "attackInternal", "name": "Attack: Internal damage", "region": "effect",
     "note": "Ignores all armor and shield AP; resisted by Willpower or Endurance. Cannot exceed your Strand value.",
     "rows": [
         {"label": "Damage equal to your Strand value", "tc": 1,
          "q": "For 1 TC, an Internal attack spell's damage is equal to its Strand score."},
     ]},
    {"key": "attribute", "name": "Attributes", "region": "effect",
     "note": "Toughness, Death Threshold, Lethality Level, Initiative, Max ENC. Resolve, Max Resolve and Fatigue can never be affected.",
     "rows": [
         {"label": "+/- 1", "tc": 2, "q": "TC Attribute Modifier*|2 +/- 1"},
         {"label": "+/- 2", "tc": 4, "q": "4 +/- 2"},
         {"label": "+/- 3", "tc": 6, "q": "6 +/- 3"},
         {"label": "+/- 4", "tc": 8, "q": "8 +/- 4"},
         {"label": "+/- 5", "tc": 10, "q": "10 +/- 5"},
         {"label": "Initiative or Max ENC, +/- 1 per TC", "tc": 1, "per": True,
          "q": "Initiative or Max ENC|1 +/- 1 per TC"},
     ]},
    {"key": "enhanceWeapon", "name": "Enhance Weapon", "region": "effect",
     "rows": [
         {"label": "Make magical (no damage bonus)", "tc": 1, "q": "1 To “make magical” gives no damage"},
         {"label": "+1 damage", "tc": 2, "q": "2 +1 damage"},
         {"label": "+2 damage", "tc": 4, "q": "4 +2 damage"},
         {"label": "Suppress a creature's immunity to non-magical weapons", "tc": 5,
          "q": "5 Suppress a creature's immunity to"},
         {"label": "+3 damage", "tc": 6, "q": "6 +3 damage"},
         {"label": "+4 damage", "tc": 8, "q": "8 +4 damage"},
         {"label": "+5 damage", "tc": 10, "q": "10 +5 damage"},
     ]},
    {"key": "heal", "name": "Heal Damage", "region": "effect",
     "note": "Conjure Body, Duration Instant. You do not pay extra to Choose Location.",
     "rows": [
         {"label": "Per 1 Wound Point healed", "tc": 1, "per": True, "q": "1 Per 1 Wound Point healed"},
         {"label": "Remove infection from a specific wound", "tc": 3, "q": "+3 Add to remove infection from a"},
         {"label": "Nullify a poison or remove a disease", "tc": 5, "q": "5 Nullify a poison or remove a disease"},
     ]},
    {"key": "mental", "name": "Mental or Emotional", "region": "effect",
     "note": "Almost always resisted by Willpower; Thought-based on humanoids.",
     "rows": [
         {"label": "Detect Emotional State", "tc": 1, "q": "1 TC A Detect Emotional State to pro"},
         {"label": "Base emotion (anger, jealousy, desire, despair, disgust, anxiety): +/-10 on situational skills", "tc": 2,
          "q": "2 TC A Base emotion: Anger, jealousy, desire, despair, disgust, anxiety."},
         {"label": "Fear (Fear Rating = the Bind roll's SLs)", "tc": 3, "q": "3 TC A Fear causes Fear effects"},
         {"label": "Charm (+30 to the caster's Social rolls except Intimidate)", "tc": 3,
          "q": "3 TC|Charm spells make the caster seem"},
         {"label": "Sleep (opposed Willpower; target falls Prone and cannot act)", "tc": 3,
          "q": "3 TC|Sleep: Targets failing an opposed"},
         {"label": "Higher emotion (love, compassion, loyalty, joy, gratitude, guilt): +/-20", "tc": 4,
          "q": "4 TC A Higher Emotion: Love, compassion, loyalty, joy, gratitude, guilt."},
         {"label": "Bond an animal (Control Beast) as a loyal servant for the Duration", "tc": 4,
          "q": "4 TC|Bond: This is a special condition that"},
         {"label": "Confuse (d10 each action: 1-4 no action, 5-7 helps a foe, 8-10 attacks an ally)", "tc": 5,
          "q": "5 TC A Confuse spells make the target act in"},
         {"label": "Memory (erase, alter, implant, force reveal, or read surface thoughts)", "tc": 6,
          "q": "6 TC A Memory can affect what and how the"},
         {"label": "Dominate (act against their own interests; max 1 minute unless a ritual)", "tc": 8,
          "q": "8 TC A Dominate type spells can make the tar"},
     ]},
    {"key": "senses", "name": "Senses & Illusions", "region": "effect",
     "note": "Illusions always use the Thought Strand with the Conjure Bind, and cost by the senses they engage.",
     "rows": [
         {"label": "1 of Taste, Touch/Feel, or Scent", "tc": 1, "q": "1 1 of Taste, Touch/Feel, or Scent"},
         {"label": "Sound (speech included)", "tc": 2, "q": "2 Sound. Spells affecting speech are includ"},
         {"label": "Any 3 of Taste, Touch/Feel, Scent, Sound", "tc": 3, "q": "3 Any 3 of the above"},
         {"label": "Sight", "tc": 4, "q": "4 Sight"},
         {"label": "Any 3 including Sight", "tc": 5, "q": "5 Any 3 of the above"},
         {"label": "All senses", "tc": 8, "q": "8 All senses"},
     ]},
    {"key": "size", "name": "Size & Transformation", "region": "effect",
     "note": "Each size step: +/-1 Toughness, +/-2 base damage, +/-5 Death Threshold, -/+1 Initiative.",
     "rows": [
         {"label": "+/- 1 Size category", "tc": 3, "q": "TC Change in Size|3 +/- 1 Size category change"},
         {"label": "+/- 2 Size categories", "tc": 5, "q": "5 +/- 2 Size category change"},
         {"label": "+/- 3 Size categories", "tc": 7, "q": "7 +/- 3 Size category change"},
         {"label": "+/- 4 Size categories", "tc": 10, "q": "10 +/- 4 Size category change"},
         {"label": "+/- 5 Size categories (Ritual only)", "tc": 15, "ritual": True,
          "q": "15 +/- 5 Size category change (Ritual only)"},
     ]},
    {"key": "movement", "name": "Speed or Movement", "region": "effect",
     "rows": [
         {"label": "+1 zone of movement", "tc": 2, "q": "TC Additional Zones|2 +1 zone"},
         {"label": "+2 zones of movement", "tc": 5, "q": "5 +2 zones"},
         {"label": "+3 zones of movement", "tc": 7, "q": "7 +3 zones"},
         {"label": "+4 zones of movement", "tc": 10, "q": "10 +4 zones"},
         {"label": "Combat Maneuver (Unbalance, Drive Back, Disarm, Trip); Duration must be Instant", "tc": 3,
          "q": "3 TC A Perform a Combat Maneuver: In"},
         {"label": "Immobilized (cannot move, can still act)", "tc": 4,
          "q": "4 Immobilized: They cannot move, but"},
         {"label": "Restrained (cannot move or act, can defend)", "tc": 6,
          "q": "6 Restrained: They can neither move nor"},
         {"label": "Puppet (control their movement; cannot make them harm themselves)", "tc": 5,
          "q": "5 TC A Puppet: Controlling someone's move"},
         {"label": "Vulgar movement (levitation, flight, passing through matter), on top of any other Effect", "tc": 6,
          "q": "6 TC A Perform a Vulgar movement Ef"},
         {"label": "Paralyzed (cannot move, act or defend)", "tc": 8,
          "q": "8 Paralyzed: They cannot move, act,"},
     ]},
    {"key": "substanceValue", "name": "Conjure Substance (by trade value)", "region": "effect",
     "note": "Conjured substance vanishes when the Duration expires. Beings cannot be Conjured.",
     "rows": [
         {"label": "up to 5 sp", "tc": 1, "q": "1 Items or goods up to 5 sp in value"},
         {"label": "up to 50 sp", "tc": 2, "q": "2 Items or goods up to 50 sp in value"},
         {"label": "up to 100 sp", "tc": 3, "q": "3 Items or goods up to 100 sp in value"},
         {"label": "up to 200 sp", "tc": 4, "q": "4 Items or goods up to 200 sp in value"},
         {"label": "up to 500 sp", "tc": 5, "q": "5 Items or goods up to 500 sp in value"},
         {"label": "up to 1,000 sp", "tc": 6, "q": "6 Items or goods up to 1,000 sp in value"},
         {"label": "up to 2,000 sp", "tc": 7, "q": "7 Items or goods up to 2,000 sp in value"},
         {"label": "up to 5,000 sp", "tc": 8, "q": "8 Items or goods up to 5,000 sp in value"},
         {"label": "up to 10,000 sp", "tc": 9, "q": "9 Items or goods up to 10,000 sp in value"},
         {"label": "up to 20,000 sp", "tc": 10, "q": "10 Items or goods up to 20,000 sp in value"},
     ]},
    {"key": "substanceVolume", "name": "Conjure Substance (by size or volume)", "region": "effect",
     "rows": [
         {"label": "a pocketful", "tc": 1, "q": "1 a pocketful"},
         {"label": "sword-sized", "tc": 2, "q": "2 sword-sized"},
         {"label": "a backpack's worth", "tc": 3, "q": "3 a backpack's worth"},
         {"label": "a Man-sized amount", "tc": 5, "q": "5 a Man-sized amount"},
         {"label": "a Wagon-load full", "tc": 7, "q": "7 a Wagon-load full"},
         {"label": "to fill an Inn's common room (Ritual only)", "tc": 10, "ritual": True,
          "q": "10 to fill an Inn's common room (ritual only)"},
     ]},
    {"key": "summon", "name": "Summoning", "region": "effect",
     "note": "Requires a summoning circle. The Magnitude of any summoning spell is always Vulgar.",
     "rows": [
         {"label": "Summon an otherworldly being or departed spirit", "tc": 6,
          "q": "have an Effect cost of 6 TC"},
     ]},
    {"key": "skill", "name": "Skill Modifier", "region": "effect",
     "note": "One skill per instance; buy the Effect again for a second skill.",
     "rows": [
         {"label": "+/- 10", "tc": 1, "q": "TC Skill Modifier|1 +/- 10"},
         {"label": "+/- 20", "tc": 3, "q": "3 +/- 20"},
         {"label": "+/- 30", "tc": 5, "q": "5 +/- 30"},
         {"label": "+/- 40", "tc": 7, "q": "7 +/- 40"},
         {"label": "+/- 50", "tc": 10, "q": "10 +/- 50"},
     ]},
    {"key": "zone", "name": "Zone Condition", "region": "effect",
     "note": "Targets the zone itself. Add +2 TC per individual excluded from the hazard.",
     "rows": [
         {"label": "Favored Zone (Favor equal to half the Strand value, rounded up)", "tc": 2,
          "q": "Favored Zone (2 TC): Alter the zone"},
         {"label": "Hazard: Confined, Obscured or Rough", "tc": 3,
          "q": "Hazard—Confined, Obscured, or Rough (3 TC)"},
         {"label": "Barrier (cover against ranged attacks, may block line of sight)", "tc": 4,
          "q": "Barrier (4 TC): A physical or energet"},
         {"label": "Hazard: Blocked, or Other", "tc": 5, "q": "Hazard—Blocked or Other) (5 TC)"},
         {"label": "Damaging hazard, external (1 TC per damage, up to 3x your Strand)", "tc": 1, "per": True,
          "q": "that causes external damage (fire, acid, debris) costs 1 TC per dam"},
         {"label": "Damaging hazard, internal (1 TC per damage, up to 2x your Strand)", "tc": 1, "per": True,
          "q": "causes internal damage (poison, gas, psychic force) costs 1 TC per damage caused"},
     ]},
    {"key": "other", "name": "Anything else", "region": "effect",
     "rows": [
         {"label": "GM-assigned Effect cost (1-10 TC)", "tc": 1, "per": True, "max": 10,
          "tcInProse": True,
          "q": "assign an appropriate Effect cost of between 1\u201310 TC."},
     ]},
]

# Fraying symptom tiers (p.308-309). Narrative, but they are gated on a real
# number the sheet already knows, so the sheet can say which tier is active
# instead of leaving the player to compare two numbers by eye.
FRAYING_SYMPTOMS = [
    {"key": "flat10", "label": "10 Fraying points (regardless of Max Resolve)",
     "summary": "Subtle, deniable disturbances that might be passed off as fatigue or coincidence.",
     "q": "10 Fraying points (regardless of Max Resolve)",
     "signs": [
         "Your shadow lags behind or tilts slightly wrong.",
         "Strangers forget your name moments after hearing it.",
         "Your reflections ripple or appear subtly distorted.",
         "Your footprints fade away almost as soon as they're made.",
     ]},
    {"key": "mr-5", "label": "Fraying >= Max Resolve - 5",
     "summary": "The wrongness can no longer be ignored by those nearby.",
     "q": "Fraying points \u2265 Max Resolve -5",
     "signs": [
         "Animals shy away, bark, or bolt from your presence.",
         "Written words about you blur or fade from pages.",
         "Colors look washed out when you enter a space.",
         "Companions swear you weren't there until you spoke.",
     ]},
    {"key": "mr", "label": "Fraying >= Max Resolve",
     "summary": "Reality struggles to hold you in place; the unraveling is undeniable.",
     "q": "Fraying points \u2265 Max Resolve",
     "signs": [
         "Doubles of you are glimpsed in the corner of the eye.",
         "Dreams depict you as faceless or as a stranger.",
         "Patterns misalign: bricks, tiles, rugs subtly warp around you.",
         "Objects near you refuse to line up",
     ]},
    {"key": "mr+5", "label": "Fraying >= Max Resolve + 5",
     "summary": "The Weave is actively tugging your thread loose.",
     "q": "Fraying \u2265 Max Resolve +5",
     "signs": [
         "Your eyes look hollow or distant.",
         "Whole conversations with you vanish from memory after they end.",
         "Places you linger warp: candles drip upward, mirrors crack, walls bend, plants wither.",
         "You feel a constant physical snag in your chest, like a thread being pulled away.",
     ]},
]

FRAYING_TRAIT = {
    "name": "Frayed",
    "text": "Once a Spellweaver accumulates 10+ Fraying points and begins to show the first symptoms, they may choose to take the \u201cFrayed\u201d Personality Trait. It acts in every way as a regular Personality Trait, but assumes the player is roleplaying the narrative effects above. Once chosen, this Trait may not be removed.",
    "q": "Once a Spellweaver accumulates 10+ Fraying points and begins to show the first symptoms, they may choose to take the \u201cFrayed\u201d Personal",
}
FINAL_ACT = {
    "name": "The Final Act",
    "text": "When a Spellweaver is about to be purged from the Tapestry, they may immediately attempt one last working of magic before they unravel. This act of magic is always successful: even if the Spellweaver is bound, silenced, or unconscious, the Weave itself forces the act through them.",
    "q": "This act of magic is always successful: even if the Spellweaver is bound, silenced, or unconscious, the Weave itself forces the act through them.",
}

RULES["shapingQuote"] = "Before it can be cast, a spell must be shaped by the following elements, each one contributing to its Total Cost (TC)."
RULES["masteryQuote"] = "Add together the Bind roll's ones die, the relevant Strand value, and any Thread result to find the caster's Mastery."
RULES["masteryOnesDieQuote"] = "Remember a “0” on the ones die counts as 10"
RULES["wrmQuote"] = "The difference between the Mastery and the TC is called the Weave Reaction Modifier."
RULES["mitigationQuote"] = "Each additional Resolve spent reduces the modifier by 1. Reducing the modifier to zero cancels the Weave Reaction."
RULES["critFailQuote"] = "The spell is not cast. Spend 1 Resolve and immediately roll on the Weave Reaction Table, adding the spell's Magnitude cost to the result. Fades also gain 1 Fraying."
RULES["armorTcQuote"] = "Initiative penalty of worn armor acts as a positive modifier to every spell's TC."
RULES["fadeChargenStrands"] = 5
RULES["fadeStrandStartQuote"] = "Start with a total of 5 levels among any Strands of your choice. A Fade may never have more than 7 in any Strand."
RULES["fadeBindCap"] = 70
RULES["fadeBindCapQuote"] = "A Fade can never develop any Bind skill past 70."
RULES["newBindXp"] = 5
RULES["newBindQuote"] = "If a Spellweaver or Fade doesn't yet have skill in a particular Bind, they may spend 5 XP to acquire it at a starting value of 10."
RULES["roundingOutStrandCost"] = 5
RULES["roundingOutQuote"] = "Allowed Strands may be improved for five bonus skill points per level, to a maximum of level 5 at character creation."
RULES["savvyQuote"] = "Piety and Strand skills cannot be chosen as Savvy skills."


# ---- Weave Reaction Table (p.302-305) -------------------------------------
# Hand-transcribed from the two-column table, then verified below. The macro
# pack has carried a flat-range copy of this since v0.4; three of its rows
# were wrong (26-29 Catastrophic Fray then a bare 30 = Void Incursion, and
# 31-35 = Fraygeist regardless of whether the casting was a ritual). The
# book's real shape is 26+ Catastrophic Fray, with the higher entries GATED
# on the casting being Vulgar or a Ritual.
WR_REGION = region("the weave reaction table", "Catastrophic Frays\nA Catastrophic Fray means")

WEAVE_REACTIONS = [
    {"min": -999, "max": 1, "name": "2 pt Thread created", "q": "≤1 2 pt Thread created"},
    {"min": 2, "max": 2, "name": "Unexpected Detail", "q": "2 Unexpected Detail"},
    {"min": 3, "max": 3, "name": "1 Fatigue", "q": "3 1 Fatigue"},
    {"min": 4, "max": 4, "name": "Cut Off for next round", "q": "4 Cut Off for next round"},
    {"min": 5, "max": 5, "name": "1-point wound", "q": "5 1-point wound"},
    {"min": 6, "max": 6, "name": "Echo: 1 unintended target", "q": "6 Echo: 1 unintended target"},
    {"min": 7, "max": 7, "name": "d6 Thread Die created", "q": "7 d6 Thread Die created"},
    {"min": 8, "max": 8, "name": "1d4+1 steps of Supply consumed", "q": "8 1d4+1 steps of Supply consumed"},
    {"min": 9, "max": 9, "name": "Cut Off for 1d6 rounds", "q": "9 Cut Off for 1d6 rounds"},
    {"min": 10, "max": 10, "name": "Immobilized for 1d4 rounds", "q": "10 Immobilized for 1d4 rounds"},
    {"min": 11, "max": 11, "name": "Hallucinations", "q": "11 Hallucinations"},
    {"min": 12, "max": 12, "name": "1d4 Fatigue", "q": "12 1d4 Fatigue"},
    {"min": 13, "max": 13, "name": "Additional spells cost +2d6 TC until sunrise/set",
     "q": "13 Additional spells cost +2d6 TC until sunrise/set"},
    {"min": 14, "max": 14, "name": "Weave Scar: -20 to Bind skill until sunrise/set",
     "q": "14 Weave Scar: -20 to Bind skill until sunrise/set"},
    {"min": 15, "max": 15, "name": "Hazard created in zone", "q": "15 Hazard created in zone"},
    {"min": 16, "max": 16, "name": "Echo: 1d4+1 targets", "q": "16 Echo: 1d4+1 targets"},
    {"min": 17, "max": 17, "name": "1d4+1 point wound", "q": "17 1d4+1 point wound"},
    {"min": 18, "max": 18, "name": "Restrained for 1d4 rounds", "q": "18 Restrained for 1d4 rounds"},
    {"min": 19, "max": 19, "name": "Cut Off until sunrise/set", "q": "19 Cut Off until sunrise/set"},
    {"min": 20, "max": 20, "name": "1d3 Fraying", "q": "20 1d3 Fraying"},
    {"min": 21, "max": 21, "name": "Marked: Minor deformity", "q": "21 Marked: Minor deformity"},
    {"min": 22, "max": 22, "name": "Reality Snag", "q": "22 Reality Snag"},
    {"min": 23, "max": 23, "name": "Cut Off for 1d4 days", "q": "23 Cut Off for 1d4 days"},
    {"min": 24, "max": 24, "name": "Weave Scar: -1d6+2 to Bind skill, permanently",
     "q": "24 Weave Scar: -1d6+2 to Bind skill,"},
    {"min": 25, "max": 25, "name": "Marked: Major deformity", "q": "25 Marked: Major deformity"},
    {"min": 26, "max": 9999, "name": "Catastrophic Fray", "q": "26+ Catastrophic Fray"},
    # The three tiers below only apply if the casting qualifies; otherwise the
    # roll stays on Catastrophic Fray. "when" is the gate, not a range.
    {"min": 30, "max": 9999, "when": "vulgar", "name": "Void Incursion",
     "q": "30+ (Vulgar Only) Void Incursion"},
    {"min": 31, "max": 35, "when": "ritual", "name": "Fraygeist", "q": "31–35 (Ritual only) Fraygeist"},
    {"min": 36, "max": 40, "when": "ritual", "name": "Pattern Collapse", "q": "36–40 (Ritual only) Pattern Collapse"},
    {"min": 41, "max": 9999, "when": "ritual", "name": "The Grey Wailing", "q": "41+ (Ritual only) The Grey Wailing"},
]

# The prose that says what each named result actually does, so a chat card can
# print the consequence rather than a label the player has to look up.
WR_DETAIL = [
    {"name": "Thread created", "text": "A Thread is spontaneously created and appears in the area. It is attuned to the higher value of the Bind or Strand used in the casting roll.",
     "q": "A Thread is spontaneously created and appears in the area."},
    {"name": "Unexpected Detail", "text": "Some strange minor cosmetic adjustment of the spell's effects, that does not negate the intent of the spell.",
     "q": "Some strange minor cosmetic adjustment of the spell's effects, that does not negate the intent of the spell."},
    {"name": "Supply dice consumed", "text": "One or more of the caster's Supply dice are consumed by the Weave and reduced by 1 die type, distributed amongst them. Suffer 1 Fatigue for each step of die type unable to be reduced.",
     "q": "One or more of the caster's Supply dice are consumed by the Weave and reduced by 1 die type"},
    {"name": "Cut Off", "text": "The Spellweaver is cut off from the Tapestry and can't cast another spell for the listed Duration. Ongoing spells continue; Concentration is allowed.",
     "q": "The Spellweaver is cut off from the Tapestry and can't cast another spell for the listed Duration."},
    {"name": "Hallucinations", "text": "Strange visions distract the caster, preventing any action until they use an action to make a successful Willpower roll against 3 or the spell's Bind roll, whichever is higher.",
     "q": "preventing them from taking any actions until they use an action to make a successful"},
    {"name": "Fatigued", "text": "The spell tires the caster. If the new Fatigue cannot be marked, a Weary wound is caused.",
     "q": "The spell tires the caster. If the new Fatigue is unable to be marked, a Weary wound is caused"},
    {"name": "Echo", "text": "The spell affects an additional unintended target contrary to the caster's intentions and beyond his control, or its effects occur elsewhere within Range. With no other suitable target, an Echo affects the caster himself if the effect is to his detriment.",
     "q": "The spell affects an additional unintended target in a manner that, if possible, is contrary to the caster's intentions"},
    {"name": "Wound", "text": "The caster suffers a separate Wound to a random location. Armor Points do not protect.",
     "q": "Caster suffers a separate Wound to a random location. Armor Points do not protect."},
    {"name": "Immobilized/Restrained", "text": "The energies lock the caster in place, able only to defend. The caster may use their action each round to make a new opposed Willpower roll against 3 or the spell's Bind roll, whichever is higher, to break free.",
     "q": "lock the caster in place, unable to do anything other than defend for the listed time"},
    {"name": "Hazard created in zone", "text": "Details reflect the Bind and Strand. Hazards affect anyone in the zone including the caster and last an hour. Roll 1d6: 1-2 Obscured, 3-4 Rough, 5 Blocked, 6 Damaging (Strand value in damage).",
     "q": "Hazards affect anyone in the zone, including the caster, and last for an hour."},
    {"name": "Marked", "text": "The caster is permanently marked by the Weave with a minor or major deformity to a random detailed hit location. Major deformities can affect appropriate skills by -20.",
     "q": "Caster is permanently marked by the Weave with a minor or major deformity to a random"},
    {"name": "Weave Scar", "text": "The Tapestry reweaves your own Pattern within it: reduce the Bind skill value used in the casting by the listed amount.",
     "q": "reduce the Bind skill value used in the casting by the listed amount."},
    {"name": "Fraying", "text": "Add Fraying points as indicated.", "q": "Add Fraying points as indicated."},
    {"name": "Reality Snag", "text": "Until the next sunrise or sunset the caster's spells suffer +5 to future Weave Reaction rolls (still mitigable), and each further spell attempt buckles reality: 1d6, 1-3 spatial distortion (-20 to ranged attacks into or out of the caster's zone for a minute), 4-5 backlash strain (1 Fatigue), 6 severe backlash (1d4 Fatigue and Willpower vs 3 or Cut Off for 1d6 rounds).",
     "q": "The Weave twists its energy around the caster and refuses to release."},
    {"name": "Catastrophic Fray", "text": "Gain +1 Fraying per point over 25, and a spontaneous magical anomaly manifests (GM's choice: storm, rift, bleeding light, mass hallucination). It should be local and survivable, reflect the Bind and Strand, and always leave a permanent scar.",
     "q": "Gain +1 Fraying per point over 25, and a spontaneous magical anomaly"},
    {"name": "Void Incursion", "text": "Vulgar spells only, otherwise treat as Catastrophic Fray. A breach tears open and a Void Demon emerges in or near the caster's zone, immediately trying to possess the closest living humanoid (opposed Willpower against its 75). A Spellweaver may attempt to seal the breach once per incursion with an immediate Bind: Destroy roll opposed by Willpower 75; on a success the demon is dragged back and the caster suffers 1d6 Fraying. A ritual version summons a Greater-tier demon.",
     "q": "A breach in reality tears open, and a Void Demon emerges in"},
    {"name": "Fraygeist", "text": "Ritual only. An exact duplicate of the caster manifests near the casting site within 1d6 days, believing itself the true original. It retains the caster's knowledge, power and skills, possesses duplicates of all their items, weapons and Threads, and will hunt down and destroy the original.",
     "q": "An exact duplicate of the caster, a Tapestry-born reflection"},
    {"name": "Pattern Collapse", "text": "Ritual only. Lose 3d10 points each from 3 random skills. All owned Threads unravel and are consumed. Each participant gains +1d3 Fraying. Any future spell using the same Bind and Strand combination suffers +2 to Weave Reaction rolls.",
     "q": "Lose 3d10 points each from 3 random skills."},
    {"name": "The Grey Wailing", "text": "Ritual only. The ritual's zone and 1d6 surrounding zones are permanently transformed into a corrupted wasteland that expands by 1d6 feet each dawn. Only a Destroy Spheres ritual of TC 40+ performed at the heart of the corruption can halt its spread.",
     "q": "The ritual's zone and 1d6 surrounding zones are permanently transformed"},
]

WR_HAZARD_D6 = [
    {"range": "1-2", "min": 1, "max": 2, "name": "Obscured (frenetic shadows)", "q": "1–2 Obscured (frenetic shadows)"},
    {"range": "3-4", "min": 3, "max": 4, "name": "Rough (based on the Strand)", "q": "3–4 Rough (based on the Strand)"},
    {"range": "5", "min": 5, "max": 5, "name": "Blocked (based on the Strand)", "q": "5 Blocked (based on the Strand)"},
    {"range": "6", "min": 6, "max": 6, "name": "Damaging (Strand value in damage)", "q": "6 Damaging (Strand value in damage)"},
]

RULES["weaveReactionQuote"] = "An uncontrolled spell must roll d20 + the Weave Reaction Modifier and consult the Weave Reaction Table"
RULES["fatigueOverflowQuote"] = "If his Resolve Track has no more open boxes to mark Fatigue, for every point of Fatigue he cannot take, he instead takes a “Weave” Wound of that value to a random location."
RULES["threadDieQuote"] = "When using the Thread Die, roll it after a successful Bind roll, and gain whatever amount you roll as Mastery. If you roll a 1 or a 2, take that number as bonus Mastery, but reduce the Thread Die to the next lower die type. If a d6 Thread rolls a 1 or a 2, it is fully expended and crumbles to dust."
RULES["threadLimitQuote"] = "You may use up to one Bind Thread and one Strand Thread in a single casting. Additional Threads of the same type never stack"
RULES["threadAfterSuccessQuote"] = "Threads are used only after a successful Bind roll (never on a failure)."
RULES["resolveFavorQuote"] = "You can spend Resolve as Favor (+10 per Resolve to a skill roll). As stated above, up to 3 Favor may be used on any one skill roll from any source, including Resolve."
RULES["requisiteQuote"] = "having to use the lower value of the applicable Bind or Strand"
RULES["castingTimeQuote"] = "A spell with a Duration of 1 minute or less has a casting time of 1 action."

# ---------------------------------------------------------------------------
# Ch.14's ritual/summoning/True Name half (p.312-321). The chapter's *shaping*
# side has been in this file since v0.15.0 -- Ritual-only Targets and Durations
# are priced and flagged -- but the procedures those flags point at were never
# extracted. Every numeric rule below carries the sentence it came from, and
# `check_nums` asserts each declared number appears inside that row's own
# quote, so a hand-typed 8 that should be a 5 fails the build the same way a
# mistyped TC does.
# ---------------------------------------------------------------------------

RITUAL = {
    "tetherRange": {"q": "The Range of any ritual must be Arcane Tether"},
    "weaveReactionBonus": {"n": 5,
        "q": "All ritual castings automatically suffer +5 to any Weave Reaction roll"},
    "critFailFraying": {"n": 1,
        "q": "Critically failing a ritual causes a Fraying point in addition to other costs"},
    # Ritual Cost: the four ways to buy Mastery that only a ritual has.
    "componentsMin": {"n": 1, "q": "Having the right components can provide between 1-8 Mastery toward the ritual's cost"},
    "componentsMax": {"n": 8, "q": "Having the right components can provide between 1-8 Mastery toward the ritual's cost"},
    "componentsSpPerTc": {"n": 100, "q": "assume the ritual will require components worth 100 sp × the ritual's Total Cost"},
    "assistShare": {"q": "Every such participant can add half their Strand value (rounded up) as Mastery toward the ritual"},
    "assistCap": {"q": "The maximum number of additional participants is equal to half the original caster's value (rounded up) of the Strand used in the ritual"},
    "bloodPerWp": {"n": 1, "q": "for every lethal Wound Point inflicted on a thinking, reasoning being (the “victim”), the caster gains 1 Mastery, up to a maximum of 20"},
    "bloodMax": {"n": 20, "q": "for every lethal Wound Point inflicted on a thinking, reasoning being (the “victim”), the caster gains 1 Mastery, up to a maximum of 20"},
    "bloodKillBonus": {"n": 20, "q": "if the victim is killed immediately prior to the ritual's completion, the casting roll is made with a +20"},
    "bloodMarkPercentPerWp": {"n": 5, "q": "For each Wound Point inflicted upon the sacrificial victim, there is a 5% chance the caster and all assistants become marked"},
    "grimoireDice": {"q": "A grimoire has a Thread value of d4 to d12, and may be used once per ritual"},
    # Casting time and concentration.
    "hoursPerTc": {"n": 1, "q": "A ritual requires one hour of casting time per TC"},
    "fatiguePerEightHours": {"n": 1, "q": "The principal caster and all assistants take 1 Fatigue for every eight hours (or portion thereof) of casting time"},
    "concentrationRoll": {"q": "the principal caster must make a standard Willpower roll every eight hours (or portion thereof) to maintain focus"},
    "concentrationFailBonus": {"n": 3, "q": "Any Weave Reaction roll made at the ritual's completion is at an additional +3. This modifier stacks with each failed concentration roll."},
    "concentrationCritFail": {"q": "Concentration collapses entirely—the ritual fails, all components are consumed, and the process must begin anew."},
    # The casting roll itself.
    "noResolve": {"q": "The caster cannot spend Resolve on the Ritual casting roll"},
    "resolveFloor": {"n": 1, "q": "rituals still require each participant to have at least one available Resolve"},
    "frayingSharedQuote": {"q": "Any Fraying points during the ritual gained from Target or Duration costs, or from any other source or effect, are inflicted on both the caster and all assistants."},
    "rushBonus": {"n": 10, "q": "If the caster wants to cut the spell's casting time in half (hours equal to half the final TC, rounded up), any Weave Reaction roll will be made at +10"},
    "resistQuote": {"q": "all targets make an opposed roll against the ritual's Bind roll to neutralize the spell effect"},
}

# The Ritual Casting Results Table (p.317). The book's own column labels wrap
# mid-phrase in the dump ("Success,but Mastery is less than the spell's TC"),
# so each row is pinned by its OUTCOME text, which does not wrap, rather than
# by a label that would have to be reassembled by hand.
RITUAL_RESULTS = [
    {"key": "success", "name": "Success",
     "fatigue": 1, "fraying": 0, "componentsLost": False, "weaveReaction": "ifMasteryShort",
     "q": "The ritual is cast as intended. All participants take 1 Fatigue. The Bind roll's SLs sets the ritual spell's resistance."},
    {"key": "uncontrolled", "name": "Success, but Mastery is less than the spell's TC",
     "fatigue": 3, "fraying": 0, "componentsLost": False, "weaveReaction": "always",
     "q": "The ritual is cast, but not fully controlled: roll on the Weave Reaction Table with a modifier equal to the difference between the Mastery and the TC, plus any accumulated modifiers from failed concentration rolls, and +5 for the ritual itself. All participants take 3 Fatigue"},
    {"key": "crit", "name": "Critical Success",
     "fatigue": 0, "fraying": 0, "componentsLost": False, "weaveReaction": "never",
     "q": "The ritual is cast as intended and there is no Weave Reaction roll."},
    {"key": "failure", "name": "Failure",
     "fatigue": 3, "fraying": 0, "componentsLost": False, "weaveReaction": "never",
     "q": "The ritual fails. All participants take 3 Fatigue. Components can be reused."},
    {"key": "critFail", "name": "Critical Failure",
     "fatigue": 6, "fraying": 1, "componentsLost": True, "weaveReaction": "atTc",
     "q": "The ritual fails. All participants take 6 Fatigue and 1 Fraying. All components are used up."},
]

# The d10 Blood Magic Mark table (p.316).
BLOOD_MARKS = [
    {"roll": 1, "text": "A patch of skin permanently blackened, as if charred"},
    {"roll": 2, "text": "Veins that show through the skin in dark crimson or black"},
    {"roll": 3, "text": "Eyes that glint faintly red in firelight"},
    {"roll": 4, "text": "A faint sigil burned into the palm or forehead"},
    {"roll": 5, "text": "Skin that appears stained with blood in streaks or blotches"},
    {"roll": 6, "text": "Fingernails turned permanently black"},
    {"roll": 7, "text": "A brandlike scar in the shape of twisting lines or runes"},
    {"roll": 8, "text": "The mouth bleeds slightly when speaking the truth"},
    {"roll": 9, "text": "An aura of faint cold"},
    {"roll": 10, "text": "Teeth or tongue faintly discolored as if with dried blood"},
]

# Magic Circles (p.314-315). Not the same thing as a Summoning Circle, and the
# book says so explicitly, so they are kept as separate rows here too.
MAGIC_CIRCLE = {
    "inscribeSp": {"n": 1000, "q": "Inscribing a magic circle costs 1,000 sp in materials, and takes a full 8 hours"},
    "inscribeHours": {"n": 8, "q": "Inscribing a magic circle costs 1,000 sp in materials, and takes a full 8 hours"},
    "slsPerReduction": {"n": 2, "q": "Every 2 SLs on the Arcana roll will allow the circle to reduce the cost of any spell or ritual cast entirely within its bounds by 1 SL"},
    "extraSpStep": {"n": 500, "q": "Every additional 500 sp worth of materials consumed while inscribing the circle adds +10 to the Arcana roll, up to +30 for 1500 sp"},
    "extraBonusStep": {"n": 10, "q": "Every additional 500 sp worth of materials consumed while inscribing the circle adds +10 to the Arcana roll, up to +30 for 1500 sp"},
    "extraBonusCap": {"n": 30, "q": "Every additional 500 sp worth of materials consumed while inscribing the circle adds +10 to the Arcana roll, up to +30 for 1500 sp"},
    "noResolve": {"q": "Resolve may not be used on the Arcana roll"},
    "noFades": {"q": "Fades cannot use magic circles"},
    "onePerZone": {"q": "There can only be one magic circle inscribed in a zone."},
}

SUMMONING = {
    "magnitude": {"n": 10, "q": "The Magnitude of any summoning spell is always Vulgar (+10 TC)."},
    "circleSp": {"n": 1000, "q": "a unique summoning circle is drawn on the ground by the caster (a process that takes an hour and requires 1,000 sp worth of materials; a circle can only be used for one successful casting)"},
    "materials": [
        {"sp": 1000, "bonus": 0, "q": "requires 1,000 sp worth of materials"},
        {"sp": 2000, "bonus": 10, "q": "Investing 2,000 sp in materials gives a +10 to the Arcana roll (see below); investing 5,000 sp gives a +20."},
        {"sp": 5000, "bonus": 20, "q": "Investing 2,000 sp in materials gives a +10 to the Arcana roll (see below); investing 5,000 sp gives a +20."},
    ],
    "spellShape": {"n": 6, "q": "The Conjure spell is then cast with a Duration of Instant, a Range of Arcane Tether, a Target of Individual, and a Summoning Effect (6 TC)."},
    "resistQuote": {"q": "The being to be summoned gets an opposed Willpower roll. Using a creature's True Name, if it has one, imposes a -20 penalty on its Willpower roll."},
    "trueNamePenalty": {"n": -20, "q": "imposes a -20 penalty on its Willpower roll"},
    "cageTest": {"q": "the quality of the cage is tested. The caster makes an Arcana roll"},
    "boundDays": {"q": "If the caster wins, the creature is bound within the circle for a number of days equal to the caster's Arcana Score."},
    "decayDays": {"q": "A summoning circle remains stable for a number of days equal to the caster's Arcana Score."},
    "renewHours": {"n": 1, "q": "This requires one hour of uninterrupted work and a new Arcana roll"},
    "nativesQuote": {"q": "Native beings of the Broken Empires cannot be summoned this way, except for the spirits of the dead"},
    "uncontrolledQuote": {"q": "If the summoned creature is able to leave the circle without first being controlled, it will either flee by the most direct route or attempt to harm the summoner."},
}

TRUE_NAMES = {
    "tetherQuote": {"q": "True Names are the ultimate connection to the Weave, and can be used as an Arcane Tether"},
    "mortalsQuote": {"q": "Ordinary mortals do not have True Names, and thus cannot be magically targeted through them."},
    "languageQuote": {"q": "it must be spoken aloud in the language of that name"},
    "languageRoll": {"q": "requiring a successful Language roll"},
    "languageCritFail": {"n": 10, "q": "On a critically failed Language roll, the caster also suffers an immediate Weave Reaction (roll 1d20 +10)."},
    "alertsQuote": {"q": "Speaking a True Name always alerts the target that it was invoked"},
    "notConsumedQuote": {"q": "As a True Name is not a physical Arcane Tether, it is not consumed with the casting, and knowing another's True Name does not count towards the caster's Arcane Tether limit."},
    "frayingDie": {"n": 1, "q": "each time you invoke a True Name in a spell, roll 1d10; on a 1, gain 1 Fraying."},
    "summonPenalty": {"n": -20, "q": "a True Name imposes a -20 penalty on the target's Willpower roll to resist the summoning"},
}

PACT = {
    "timerDie": {"q": "Prices each have a d10 Timer Die associated with them, with roll intervals ranging from one day to one year."},
    "startsAtOne": {"n": 1, "q": "At the completion of the ritual, the petitioner sets the Price total at 1 and must start tracking intervals."},
    "payRule": {"q": "If the result is the current Price total or less, the Price is immediately paid. If not, the petitioner adds 1 to the Price total."},
    "noRollQuote": {"q": "Neither petitioner nor Patron has to roll for the pact ritual"},
    # The book's own Example Ritual Prices list (p.318-319), verbatim.
    "prices": [
        "A piece of the petitioner's lifespan, or reduction of Toughness/Death Threshold/location Lethality Level.",  # noqa: see PRICE_WRAPPED below
        "Loss of a cherished memory.",
        "The petitioner or someone they care for suffers a wound or infection.",
        "The petitioner's voice becomes increasingly muffled or distant, imposing Social skill penalties.",
        "Reduction of a petitioner's skill value by 5d6.",
        "A requirement to revisit a specific location every week/month/year and perform a costly sacrifice.",
        "Loss of Status due to moral or spiritual corruption.",
        "Someone the petitioner loves spurns and abandons him.",
        "Gradual loss of distinction between dreams and reality.",
        "A new, horrific scar appears in a prominent place on the petitioner's body.",
        "A relentless hunger that no food or drink can satisfy.",
        "The petitioner's reflection disappears, leaving her unable to see herself ever again.",
        "At inopportune moments, the petitioner speaks the words and thoughts of the patron instead of his own.",
        "One of the petitioner's loved ones becomes possessed by an agent of the patron, causing them to commit acts favorable to the patron.",
        "One of the petitioner's arm locations slowly starts to turn into a translucent tentacle, scaled claw, or other such mutation.",
        "The petitioner feels the suffering of others in her proximity as if it were her own.",
        "The petitioner feels invisible eyes watching him constantly, trapping him in a perpetual state of paranoia.",
    ],
}

# One Pact price wraps mid-word-boundary in the PDF ("Toughness/Death
# Threshold/\nlocation"), and the dump only de-hyphenates across a line break,
# so the flattened book carries a space after that slash which the printed
# page does not. The display text above is the printed form; this is the form
# the verifier has to look for. Kept as an explicit, named exception rather
# than loosening the whole check to ignore stray spaces.
PRICE_WRAPPED = {
    "A piece of the petitioner's lifespan, or reduction of Toughness/Death Threshold/location Lethality Level.":
        "A piece of the petitioner's lifespan, or reduction of Toughness/Death Threshold/ location Lethality Level.",
}


# ---------------------------------------------------------------------------
# Enchantments and Alchemy (p.322-326). The book calls alchemy "a simplified
# form of enchantment", and they share a reagent economy, so they are
# extracted together. Every cost row is pinned by its LABEL AND ITS NUMBER in
# one quote ("Die type d8 or 10 charges 2"), so two rows cannot have their
# Fraying costs swapped while both still verify.
# ---------------------------------------------------------------------------

ENCHANT = {
    "definition": {"q": "The art of Enchantment is that of permanently imbuing a mundane item with the ability to reproduce a spell effect."},
    "masterwork": {"q": "it must be a masterwork item crafted using Craft: Artistic or Craft: Practical"},
    "overridesCraft": {"q": "Any magical enchantment will override and remove any other bonuses or qualities the masterwork item may have had from its craftsmanship."},
    "prepDays": {"n": 1, "q": "This preparation requires one full day of work."},
    "dieRule": {"q": "every time the item\u2019s spell effect is used (as an action), the Die is rolled. If it comes up 1 or 2, the item becomes inert and can\u2019t be used again for 1\u20136 days."},
    "chargeRule": {"q": "Each charge powers one use of the effect; when the final charge is expended, the item becomes non-magical."},
    "weaverOnly": {"q": "only those who can manipulate the Weave (a Spellweaver or Fade) can use the enchanted item. They can recognize and use the item after a successful Arcana roll."},
    "anyoneCost": {"n": 1, "q": "An item can be made usable by anyone, but this costs +1 Fraying point."},
    "caps": {"n": 30, "q": "No enchanted item may exceed d12 or 30 charges. An item cannot possess both a Use Die and a Charge pool; choose one when it is created."},
    "resistance": {"q": "Once the spell is successfully cast, the Bind roll becomes the item\u2019s fixed value for purposes of resistance."},
    "itemIsCaster": {"q": "any spell with a Range or Target of Self normally affects only the item, not the person holding or wearing it"},
    "noCounterspell": {"q": "An enchanted item can only reproduce its own stored spells; it cannot be used to counterspell or otherwise react to external magic."},
    "failure": {"q": "If the enchanter\u2019s spell roll fails, the item is not enchanted and is no longer suitable; a new one must be crafted to try again. If the spell roll critically fails, the item is no longer suitable, and any Fraying is also accrued."},
    "multipleSpells": {"q": "A caster can imbue as many different spells into an item as desired, but each one incurs its own Fraying cost separately."},
    "unstableDie": {"q": "it becomes inert on a roll of 1\u20134 instead of 1\u20132"},
    "unstableCharged": {"q": "After an unstable charged item is used, roll a d10. On a result of 1\u20132, the enchantment burns out, immediately losing 1d4 additional charges."},
    "unstableSingle": {"q": "Before an unstable single-use enchanted item is used, roll a d10. On a 1\u20132, the stored magic unravels harmlessly and the enchantment does not take effect."},
    "resolveAllowed": {"q": "Resolve and Thread use is allowed as normal."},
}

# The Enchantment Costs table (p.322). `die` and `charges` are the two ways to
# buy the same row, exactly as the book prints them on one line.
ENCHANT_COSTS = [
    {"key": "single", "die": None, "charges": 1, "fraying": 0, "label": "Single-use (1 charge)",
     "q": "Single-use (1 charge) 0"},
    {"key": "d6", "die": "d6", "charges": 3, "fraying": 1, "label": "Die type d6 or 3 charges",
     "q": "Die type d6 or 3 charges 1"},
    {"key": "d8", "die": "d8", "charges": 10, "fraying": 2, "label": "Die type d8 or 10 charges",
     "q": "Die type d8 or 10 charges 2"},
    {"key": "d10", "die": "d10", "charges": 15, "fraying": 3, "label": "Die type d10 or 15 charges",
     "q": "Die type d10 or 15 charges 3"},
    {"key": "d12", "die": "d12", "charges": 30, "fraying": 4, "label": "Die type d12 or 30 charges",
     "q": "Die type d12 or 30 charges 4"},
]
ENCHANT_ANYONE = {"fraying": 1, "label": "Anyone can use it", "q": "Anyone can use it +1"}

REAGENTS = {
    "substitution": {"n": 1, "q": "For every point of Fraying the enchantment would normally cost, the caster may instead consume one Weave Reagent of the same Strand. This substitution is declared before rolling the spell, not after."},
    "whatTheyAre": {"q": "Weave Reagents are naturally occurring materials similar to Threads that hold a trace of resonance from one of the ten Strands of the Weave."},
    "whereFound": {"q": "Reagents are found only in places where the Weave is active or disturbed. They cannot be found in ordinary farmland, villages, or settled ground."},
    "findingRoll": {"q": "A reagent may be located by making an Arcana roll when the GM deems the location suitable"},
    "findingTime": {"q": "This takes half a day."},
    "findingYield": {"n": 3, "q": "Success indicates the discovery of one usable reagent aligned with the dominant Strand of that area or creature (or a random Strand, if the GM is unsure), + 1 additional reagent per 3 SLs."},
    "strandBound": {"q": "A reagent can only be used to power effects related to that Strand."},
    "potency": {"q": "Reagents lose their potency after several weeks if not properly stored."},
}

ALCHEMY = {
    "definition": {"q": "Alchemy is a simplified form of enchantment, performed on liquids to create spell effects in potion form."},
    "singleUseNoFraying": {"q": "alchemy always creates single-use effects and does not accumulate Fraying"},
    "noMasterwork": {"q": "Masterwork items are not required to make potions."},
    "selfOnly": {"q": "Only spells with a Range and Target of Self can be successfully brewed into potions."},
    "noRitual": {"q": "An alchemical potion can never include anything exclusive to rituals, such as ritual-only Durations or extended Effects."},
    "lab": {"q": "The creation process requires a laboratory or suitable workspace."},
    "requisiteStrand": {"q": "If a potion\u2019s spell effect involves a requisite Strand, reagents from each Strand must be included in the brewing process."},
    "batch": {"q": "Each batch uses the same reagents to produce multiple doses"},
    "brewHours": {"n": 8, "q": "Spend a full day (eight hours) brewing, then cast the spell intended for use with the potion."},
    "noResolve": {"q": "Resolve may not be used on this roll, but Threads may be."},
    "reactionUnstable": {"q": "Any Weave Reaction happens as normal, if applicable, and renders the potion unstable."},
    "failWastes": {"q": "If the spell roll fails, the potion is not created and all materials are wasted."},
    "yieldRoll": {"q": "On a success, the potion is complete. Roll Craft: Practical for yield."},
    "yield": {"n": 3, "q": "A finished potion produces 1d3 doses + 1 dose per 3 SLs on the Craft: Practical roll. This roll can be supported by Arcana."},
    "resistance": {"q": "the drinker makes it against the caster\u2019s original Bind roll"},
    "unstableDose": {"q": "Each time a dose is consumed, roll 1d10. On a 1\u20132, the mixture collapses and all remaining doses from that batch\u2014including the dose just taken\u2014are immediately rendered ineffective."},
    "aidsCumulative": {"q": "Unless otherwise noted, bonuses from different aids are cumulative."},
}

# Reagent cost by the potion's TC (p.325), per batch.
ALCHEMY_REAGENTS = [
    {"min": 1, "max": 15, "reagents": 1, "q": "1\u201315 TC 1 reagent"},
    {"min": 16, "max": 9999, "reagents": 2, "q": "16+ TC 2 reagents"},
]

# The Alchemical Aid Table (p.326).
ALCHEMY_AIDS = [
    {"key": "refined", "name": "Refined Laboratory", "bind": 10, "craft": 0, "days": 1,
     "note": "roughly 500 sp and a permanent workspace",
     "q": "and requires a permanent workspace. +10 to the Bind roll."},
    {"key": "master", "name": "Master Alchemist\u2019s Laboratory", "bind": 20, "craft": 10, "days": 1,
     "replaces": "refined",
     "note": "roughly 1,000-1,200 sp; replaces a Refined Laboratory, you cannot use both",
     "q": "(you can\u2019t use both). +20 to the Bind roll and +10 to the Craft: Practical roll."},
    {"key": "formula", "name": "Formula Notes", "bind": 10, "craft": 0, "days": 1,
     "note": "found, bartered for, or stolen \u2014 never sold",
     "q": "must be found, bartered for, or stolen. +10 to the Bind roll."},
    {"key": "patience", "name": "Tempered Patience", "bind": 10, "craft": 0, "days": 2,
     "note": "two full working days instead of one",
     "q": "This deliberate pacing improves control and stability. +10 to the Bind roll; twice as long to brew."},
]

# ---- verification ---------------------------------------------------------
problems = []
if len(binds) != 5:
    problems.append(("expected 5 Binds", [b["name"] for b in binds]))
if len(strands) != 10:
    problems.append(("expected 10 Strands", [s["name"] for s in strands]))
if len(convocations) != 12:
    problems.append(("expected 12 Convocations", [c["name"] for c in convocations]))

names = {s["name"] for s in strands}
bindNames = {b["name"] for b in binds}
for c in convocations:
    for s in c["strands"] + c["thinStrands"]:
        if s not in names:
            problems.append(("unknown Strand in Convocation", c["name"], s))
    for b in c["binds"]:
        if b not in bindNames:
            problems.append(("unknown Bind in Convocation", c["name"], b))
    if len(c["binds"]) != 2:
        problems.append(("Convocation should list 2 Binds", c["name"], c["binds"]))
    if len(c["strands"]) != 4:
        problems.append(("Convocation should list 4 Strands", c["name"], c["strands"]))
    if len(c["thinStrands"]) != 2:
        problems.append(("Convocation should list 2 Thin Strands", c["name"], c["thinStrands"]))
    if set(c["strands"]) & set(c["thinStrands"]):
        problems.append(("a Strand is listed as both normal and Thin", c["name"]))

squashed = re.sub(r"\s+", " ", raw)
for n in sorted(names | bindNames):
    if n not in squashed:
        problems.append(("name not found verbatim in the book", n))


def norm(s):
    """Fold the PDF's curly punctuation so a hand-typed quote can match."""
    s = (s.replace("\u2019", "'").replace("\u2018", "'")
             .replace("\u201c", '"').replace("\u201d", '"')
             .replace("\u2013", "-").replace("\u2014", "-")
             .replace("\u2212", "-").replace("\u00a0", " "))
    return re.sub(r"\s+([,.;:])", r"\1", s)


SHAPE_N = norm(SHAPE_REGION)
EFFECT_N = norm(EFFECT_REGION)
BOOK_N = norm(re.sub(r"\s+", " ", flat_text(raw)))


def check(quote, haystack, where):
    """Every part of a `|`-joined quote must appear verbatim, and part 2 must
    be headed by part 1.

    A two-part quote is how the prose-priced Effects are pinned: part 1 is the
    "3 TC" heading, part 2 is the row it heads. Checking only that both
    strings exist somewhere lets a row borrow a heading from the other end of
    the section -- Charm could be transcribed at 8 TC and still "verify",
    because "8 TC" heads Dominate further down. So part 1 is looked up as the
    NEAREST heading before part 2, and no other cost heading may sit between
    them.
    """
    parts = quote.split("|")
    tail = norm(parts[-1])
    idx = haystack.find(tail)
    if idx < 0:
        problems.append(("quote not found in the book", where, parts[-1]))
        return
    for head in parts[:-1]:
        h = norm(head)
        hidx = haystack.rfind(h, 0, idx)
        if hidx < 0:
            problems.append(("no such cost heading before this row", where, head))
            return
        between = haystack[hidx + len(h):idx]
        stray = [m.group(0) for m in re.finditer(r"(?<!\d)\d{1,2} TC\b", between)]
        if stray:
            problems.append(("another cost heading sits between the heading and the row",
                             where, head, "in between: " + ", ".join(stray)))
            return


def check_tc(row, where):
    """The row's TC must be asserted BY the quote, and in the cost column.

    Two mistakes this has to catch, both of which a plain "does the number
    appear anywhere in the quote" test misses, because every row in this
    chapter is a pair of numbers:
      - "+3 AP", which costs 4 TC, transcribed as tc 3 (the AP value)
      - a prose row borrowing another row's "N TC" heading
    So the cost has to be in one of the three places the book ever puts it:
    at the head of a "TC | Effect" table row (or of an "N TC" prose heading),
    at the tail of a "Choice | TC" shaping row, or inline with its own unit
    as "N TC". Rows the book prices as the literal word "free" opt out.
    """
    if row.get("tcInProse"):
        return
    tc = str(row["tc"])
    parts = row["q"].split("|")
    if any(re.match(r"^\s*\+?" + tc + r"(?!\d)", p) for p in parts):
        return
    if re.search(r"(?<!\d)\+?" + tc + r"\s*$", row["q"]):
        return
    if re.search(r"(?<!\d)\+?" + tc + r"\s*TC\b", row["q"]):
        return
    problems.append(("TC is not in the cost column of its own quote", where, row["tc"], row["q"]))


for key, rows in SHAPING.items():
    if not isinstance(rows, list):
        continue
    for r in rows:
        # the two per-target surcharges are stated in the prose, not the table
        where = "shaping." + key + " " + (r.get("name") or r.get("label"))
        check(r["q"], BOOK_N if (key == "extras" or r.get("book")) else SHAPE_N, where)
        check_tc(r, where)

for grp in EFFECTS:
    for r in grp["rows"]:
        where = "effect." + grp["key"] + " " + r["label"]
        check(r["q"], EFFECT_N, where)
        check_tc(r, where)

for s in FRAYING_SYMPTOMS:
    check(s["q"], BOOK_N, "frayingSymptom." + s["key"])
    # The 16 concrete signs are the usable half of this section; quoting only
    # the mood line would leave the player looking them up in their own copy.
    for sign in s["signs"]:
        check(sign, BOOK_N, "frayingSign." + s["key"])
check(FRAYING_TRAIT["q"], BOOK_N, "frayingTrait")
check(FINAL_ACT["q"], BOOK_N, "finalAct")

WR_N = norm(WR_REGION)


def check_range(row, where, open_top=9999):
    """A table row's numeric range and its name must both come from its own
    quote, not sit beside it.

    Without this, the min/max are hand-typed numbers nothing checks: two rows
    could have their names swapped, or a range shifted by one, and every quote
    would still be verbatim and the 1-60 coverage loop would still be exact.
    """
    q = norm(row["q"])
    m = re.match(r"^\s*(?:<=|\u2264)\s*(\d+)|^\s*(\d+)\s*\+|^\s*(\d+)\s*-\s*(\d+)|^\s*(\d+)", q)
    if not m:
        problems.append(("no range at the head of the quote", where, row["q"]))
        return
    if m.group(1) is not None:            # "<=1"
        lo, hi = None, int(m.group(1))
        if row["max"] != hi or row["min"] > hi:
            problems.append(("range does not match its quote", where, row["min"], row["max"], row["q"]))
    elif m.group(2) is not None:          # "26+"
        lo, hi = int(m.group(2)), open_top
        if (row["min"], row["max"]) != (lo, hi):
            problems.append(("range does not match its quote", where, row["min"], row["max"], row["q"]))
    elif m.group(3) is not None:          # "31-35"
        lo, hi = int(m.group(3)), int(m.group(4))
        if (row["min"], row["max"]) != (lo, hi):
            problems.append(("range does not match its quote", where, row["min"], row["max"], row["q"]))
    else:                                 # a single face
        lo = hi = int(m.group(5))
        if (row["min"], row["max"]) != (lo, hi):
            problems.append(("range does not match its quote", where, row["min"], row["max"], row["q"]))
    # ...and the name must be what that range points at, so two rows cannot
    # have their results swapped while both quotes stay verbatim.
    rest = q[m.end():].strip()
    rest = re.sub(r"^\((?:Vulgar Only|Ritual only)\)\s*", "", rest, flags=re.I).strip()
    if not norm(row["name"]).lower().startswith(rest.lower()[:len(rest)]):
        problems.append(("the quote's result does not match the row's name", where, rest, row["name"]))


for r in WEAVE_REACTIONS:
    check(r["q"], WR_N, "weaveReaction " + r["name"])
    check_range(r, "weaveReaction " + r["name"])
for r in WR_DETAIL:
    check(r["q"], BOOK_N, "weaveReactionDetail " + r["name"])
for r in WR_HAZARD_D6:
    check(r["q"], BOOK_N, "weaveHazard " + r["name"])
    check_range(r, "weaveHazard " + r["name"], open_top=6)
    if r["range"] != (str(r["min"]) if r["min"] == r["max"] else "%d-%d" % (r["min"], r["max"])):
        problems.append(("the display range disagrees with min/max", r["range"], r["min"], r["max"]))
# Every d20+modifier from 1 to 60 must resolve to exactly one unconditional
# row, so the table can never leave a roll with no result.
for n in range(1, 61):
    hit = [r for r in WEAVE_REACTIONS if r["min"] <= n <= r["max"] and not r.get("when")]
    if len(hit) != 1:
        problems.append(("Weave Reaction roll resolves to %d rows, not 1" % len(hit), n, [h["name"] for h in hit]))

for k, v in RULES.items():
    if k.endswith("Quote") and isinstance(v, str):
        check(v, BOOK_N, "rules." + k)
check(RULES["spellweaverChargen"]["quote"].split("...")[0], BOOK_N, "rules.spellweaverChargen")

# The shaping tables must be internally sane: TC values non-negative ints,
# no duplicate names inside one table.
for key, rows in SHAPING.items():
    if not isinstance(rows, list):
        continue
    seen = set()
    for r in rows:
        nm = r.get("name") or r.get("label")
        if nm in seen:
            problems.append(("duplicate row in shaping table", key, nm))
        seen.add(nm)
        if not isinstance(r["tc"], int) or r["tc"] < 0:
            problems.append(("bad TC", key, nm, r["tc"]))

# ---- ritual / summoning / True Name verification --------------------------
# Same bar as the shaping tables: the quote must be in the book verbatim, and
# any number the row declares must appear INSIDE that row's own quote. A rule
# whose number is only in the code and not in the sentence it cites is exactly
# the failure mode this file exists to prevent.

def check_nums(row, where):
    q = norm(row.get("q", ""))
    if not q:
        problems.append(("row carries no quote", where))
        return
    check(row["q"], BOOK_N, where)
    if "n" not in row:
        return
    n = row["n"]
    # A negative rule ("-20 penalty") is written with a minus in the book; a
    # positive one may appear bare or with a plus. Accept either spelling of
    # the same number, but the digits must be in this row's own sentence.
    forms = [str(n)]
    if isinstance(n, int) and n < 0:
        forms = ["-" + str(abs(n)), "−" + str(abs(n))]
    elif isinstance(n, int) and n >= 1000:
        forms.append("{:,}".format(n))
    # The book writes small counts as words as often as digits ("one hour of
    # casting time per TC", "a Fraying point", "at least one available
    # Resolve"). The word is still the book asserting the number, so it counts
    # -- and a 1 mistyped as an 8 still fails, since neither "8" nor "eight"
    # would be in that sentence.
    WORDS = {0: ["zero", "no"], 1: ["one", "a Fraying point", "a single"], 2: ["two"], 3: ["three"],
             4: ["four"], 5: ["five"], 6: ["six"], 7: ["seven"], 8: ["eight"],
             9: ["nine"], 10: ["ten"], 11: ["eleven"], 12: ["twelve"]}
    if isinstance(n, int) and n in WORDS:
        forms += WORDS[n]
    if not any(re.search(r"(?<![\d.])" + re.escape(f) + r"(?![\d])", q, re.I) for f in forms):
        problems.append(("the row's number is not in its own quote", where, n, row["q"][:60]))


for k, v in RITUAL.items():
    check_nums(v, "ritual." + k)
for k, v in MAGIC_CIRCLE.items():
    check_nums(v, "magicCircle." + k)
for k, v in SUMMONING.items():
    if k == "materials":
        for m in v:
            check(m["q"], BOOK_N, "summoning.materials %d sp" % m["sp"])
            if "{:,}".format(m["sp"]) not in norm(m["q"]):
                problems.append(("material tier's sp is not in its own quote", m["sp"], m["q"][:50]))
            if m["bonus"] and ("+" + str(m["bonus"])) not in norm(m["q"]):
                problems.append(("material tier's bonus is not in its own quote", m["bonus"], m["q"][:50]))
        # The tiers must climb together: more silver, never less bonus.
        for a, b in zip(v, v[1:]):
            if not (b["sp"] > a["sp"] and b["bonus"] >= a["bonus"]):
                problems.append(("summoning material tiers are out of order", a["sp"], b["sp"]))
    else:
        check_nums(v, "summoning." + k)
for k, v in TRUE_NAMES.items():
    check_nums(v, "trueName." + k)
for k, v in PACT.items():
    if k == "prices":
        for p in v:
            check(PRICE_WRAPPED.get(p, p), BOOK_N, "pact price")
        if len(set(v)) != len(v):
            problems.append(("duplicate Pact price", len(v), len(set(v))))
    else:
        check_nums(v, "pact." + k)

# The Ritual Casting Results table: five outcomes, each quoted, each Fatigue
# figure asserted by its own quote, and the two that cost nothing saying so.
if len(RITUAL_RESULTS) != 5:
    problems.append(("expected 5 Ritual Casting Results rows", len(RITUAL_RESULTS)))
for r in RITUAL_RESULTS:
    check(r["q"], BOOK_N, "ritualResult " + r["key"])
    q = norm(r["q"])
    if r["fatigue"] and not re.search(r"(?<!\d)%d Fatigue" % r["fatigue"], q):
        problems.append(("the row's Fatigue is not in its own quote", r["key"], r["fatigue"]))
    if r["fraying"] and not re.search(r"(?<!\d)%d Fraying" % r["fraying"], q):
        problems.append(("the row's Fraying is not in its own quote", r["key"], r["fraying"]))
    if r["componentsLost"] and "components are used up" not in q:
        problems.append(("row claims components are lost but its quote does not say so", r["key"]))
    if r["weaveReaction"] not in ("never", "always", "atTc", "ifMasteryShort"):
        problems.append(("unknown weaveReaction mode", r["key"], r["weaveReaction"]))
if {r["key"] for r in RITUAL_RESULTS} != {"success", "uncontrolled", "crit", "failure", "critFail"}:
    problems.append(("Ritual Casting Results keys changed", [r["key"] for r in RITUAL_RESULTS]))

# The Blood Magic d10 table: ten rows, 1-10 exactly once, each verbatim.
if [m["roll"] for m in BLOOD_MARKS] != list(range(1, 11)):
    problems.append(("Blood Magic marks must cover d10 1-10 in order", [m["roll"] for m in BLOOD_MARKS]))
for m in BLOOD_MARKS:
    # Pinned by roll number AND text together ("1 A patch of skin permanently
    # blackened..."), not by text alone: two rows whose results were swapped
    # would both still be "in the book" if only the text were checked, which
    # is exactly how the NPC Traits table shipped wrong for months.
    check(str(m["roll"]) + " " + m["text"], BOOK_N, "bloodMark %d" % m["roll"])
if len({m["text"] for m in BLOOD_MARKS}) != 10:
    problems.append(("duplicate Blood Magic mark",))


# ---- enchantment / alchemy verification -----------------------------------
for k, v in ENCHANT.items():
    check_nums(v, "enchant." + k)
for k, v in REAGENTS.items():
    check_nums(v, "reagents." + k)
for k, v in ALCHEMY.items():
    check_nums(v, "alchemy." + k)

# The Enchantment Costs table: five rows plus the "anyone can use it" line,
# each pinned by label AND cost in one quote, and the ladder must climb.
if len(ENCHANT_COSTS) != 5:
    problems.append(("expected 5 Enchantment Cost rows", len(ENCHANT_COSTS)))
for row in ENCHANT_COSTS:
    check(row["q"], BOOK_N, "enchantCost " + row["key"])
    q = norm(row["q"])
    if not q.startswith(norm(row["label"])):
        problems.append(("the row's label does not head its own quote", row["key"], row["label"]))
    if not q.rstrip().endswith(str(row["fraying"])):
        problems.append(("the row's Fraying cost is not at the tail of its own quote", row["key"], row["fraying"]))
    if str(row["charges"]) not in q:
        problems.append(("the row's charge count is not in its own quote", row["key"], row["charges"]))
    if row["die"] and row["die"] not in q:
        problems.append(("the row's die is not in its own quote", row["key"], row["die"]))
for a, b in zip(ENCHANT_COSTS, ENCHANT_COSTS[1:]):
    if not (b["fraying"] > a["fraying"] and b["charges"] > a["charges"]):
        problems.append(("the Enchantment Cost ladder does not climb", a["key"], b["key"]))
check(ENCHANT_ANYONE["q"], BOOK_N, "enchantCost anyone")
if not norm(ENCHANT_ANYONE["q"]).endswith("+" + str(ENCHANT_ANYONE["fraying"])):
    problems.append(("the 'anyone can use it' surcharge is not asserted by its quote", ENCHANT_ANYONE["fraying"]))
# The book's cap sentence must agree with the top row of the table.
if ENCHANT_COSTS[-1]["die"] != "d12" or ENCHANT_COSTS[-1]["charges"] != 30:
    problems.append(("the top row disagrees with 'No enchanted item may exceed d12 or 30 charges'",
                     ENCHANT_COSTS[-1]["die"], ENCHANT_COSTS[-1]["charges"]))

# Alchemy's reagent table must cover every TC from 1 up with no gap or overlap.
for r in ALCHEMY_REAGENTS:
    check(r["q"], BOOK_N, "alchemyReagents %d+" % r["min"])
    if str(r["reagents"]) not in norm(r["q"]):
        problems.append(("the row's reagent count is not in its own quote", r["min"], r["reagents"]))
for tc in (1, 15, 16, 40):
    hit = [r for r in ALCHEMY_REAGENTS if r["min"] <= tc <= r["max"]]
    if len(hit) != 1:
        problems.append(("a TC of %d resolves to %d reagent rows, not 1" % (tc, len(hit)), [h["min"] for h in hit]))

# The Alchemical Aid Table: four aids, each quoted, each bonus in its quote.
if len(ALCHEMY_AIDS) != 4:
    problems.append(("expected 4 Alchemical Aids", len(ALCHEMY_AIDS)))
for a in ALCHEMY_AIDS:
    check(a["name"], BOOK_N, "alchemyAid name " + a["key"])
    check(a["q"], BOOK_N, "alchemyAid " + a["key"])
    q = norm(a["q"])
    if a["bind"] and ("+" + str(a["bind"]) + " to the Bind roll") not in q:
        problems.append(("the aid's Bind bonus is not in its own quote", a["key"], a["bind"]))
    if a["craft"] and ("+" + str(a["craft"]) + " to the Craft") not in q:
        problems.append(("the aid's Craft bonus is not in its own quote", a["key"], a["craft"]))
if [a["key"] for a in ALCHEMY_AIDS if a.get("replaces")] != ["master"]:
    problems.append(("only the Master laboratory replaces another aid",))

if problems:
    print("VERIFICATION FAILED:")
    for p in problems:
        print("  ", p)
    raise SystemExit(1)

nrows = sum(len(v) for v in SHAPING.values() if isinstance(v, list)) + sum(len(g["rows"]) for g in EFFECTS)
print(f"verified: {len(binds)} Binds, {len(strands)} Strands, {len(convocations)} Convocations, "
      f"{nrows} shaping/effect rows quoted verbatim, {len(FRAYING_SYMPTOMS)} Fraying tiers, "
      f"{len(WEAVE_REACTIONS)} Weave Reaction rows covering every roll 1-60 exactly once")
print(f"verified: ritual rules {len(RITUAL)}, {len(RITUAL_RESULTS)} Ritual Casting Results rows, "
      f"{len(BLOOD_MARKS)} Blood Magic marks (d10 1-10), {len(MAGIC_CIRCLE)} Magic Circle rules, "
      f"{len(SUMMONING)} Summoning rules, {len(TRUE_NAMES)} True Name rules, "
      f"{len(PACT['prices'])} Pact prices — every number asserted by its own quote")
print(f"verified: {len(ENCHANT)} Enchantment rules, {len(ENCHANT_COSTS)} cost rows + the anyone-can-use surcharge, "
      f"{len(REAGENTS)} Weave Reagent rules, {len(ALCHEMY)} Alchemy rules, {len(ALCHEMY_REAGENTS)} reagent-cost rows "
      f"covering every TC, {len(ALCHEMY_AIDS)} Alchemical Aids")
json.dump({"binds": binds, "strands": strands, "convocations": convocations, "rules": RULES,
           "shaping": SHAPING, "effects": EFFECTS, "frayingSymptoms": FRAYING_SYMPTOMS,
           "weaveReactions": WEAVE_REACTIONS, "weaveReactionDetail": WR_DETAIL,
           "weaveHazardD6": WR_HAZARD_D6,
           "frayingTrait": FRAYING_TRAIT, "finalAct": FINAL_ACT,
           "ritual": RITUAL, "ritualResults": RITUAL_RESULTS, "bloodMarks": BLOOD_MARKS,
           "magicCircle": MAGIC_CIRCLE, "summoning": SUMMONING, "trueNames": TRUE_NAMES,
           "pact": PACT,
           "enchant": ENCHANT, "enchantCosts": ENCHANT_COSTS, "enchantAnyone": ENCHANT_ANYONE,
           "reagents": REAGENTS, "alchemy": ALCHEMY, "alchemyReagents": ALCHEMY_REAGENTS,
           "alchemyAids": ALCHEMY_AIDS},
          open("data/magic.json", "w"), indent=1)
