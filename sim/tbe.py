"""TBE resolution engine: d100 roll-under, SL, criticals, opposed rolls,
hit location, AP, Wound Die + Toughness, impairment, Shock, Death Threshold.

Sources (page refs are the TBE core book, quoted verbatim in the Foundry
bundle's data/core_rules.json; code paths mirror module/rules/resolution.mjs,
module/rules/combat.mjs and macros/tbe-attack.js):
  p.15  roll-under          p.18  SL, crits, 01-05 / 99-00
  p.19-20 opposed rolls     p.163 Pierce Armor, Choose Location
  p.171 DoS + Dmg - AP      p.172-174 Wound Die, impairment, Shock, Dying
"""
from dataclasses import dataclass, field
from itertools import combinations

LOCATIONS = ["Body", "R Arm", "L Arm", "R Leg", "L Leg", "Head"]

# Detailed location, read off the second die (the defender's ones die).
DETAIL = {
    "Body": [(1, 5, "Chest"), (6, 8, "Stomach"), (9, 10, "Groin")],
    "Arm": [(1, 2, "Shoulder"), (3, 4, "Bicep"), (5, 5, "Elbow"), (6, 8, "Forearm"), (9, 10, "Hand")],
    "Leg": [(1, 2, "Hip"), (3, 6, "Thigh"), (7, 7, "Knee"), (8, 9, "Shin"), (10, 10, "Foot")],
    "Head": [(1, 2, "Skull"), (3, 4, "Eye"), (5, 6, "Face"), (7, 7, "Nose"), (8, 9, "Ear"), (10, 10, "Neck")],
}


# ------------------------------------------------------------------ d100
@dataclass
class Roll:
    roll: int
    skill: int
    success: bool
    crit: bool
    crit_fail: bool
    sl: int


def is_doubles(r):
    return r == 100 or (r < 100 and r % 11 == 0)


def resolve(r, skill, rules):
    """One d100 roll (1-100, 100 reads '00') against a modified skill."""
    lo, hi = rules["auto_success_max"], rules["auto_fail_min"]
    doubles = is_doubles(r)
    if r >= hi:
        success = False
    elif skill <= 0:
        success = r <= lo
    else:
        success = r <= lo or r <= skill

    crit = crit_fail = False
    if success:
        crit = (r == lo) if skill <= 0 else (doubles or r == skill)
    elif skill < 100:
        crit_fail = doubles and r > skill

    sl = 0
    if success:
        sl = max(1, (r % 100) // 10)       # tens die, 0 counts as 1
        if crit:
            sl += rules["crit_bonus_sl"]
        if skill > 100:
            sl += max(1, ((skill - 100) % 100) // 10)
    return Roll(r, skill, success, crit, crit_fail, sl)


def d100(rng):
    return rng.randint(1, 100)


def opposed_attack(atk, dfn):
    """Attack vs defence. dfn None = undefended. Returns (attacker_wins, dos).

    Cascade as TBE: Attack applies it: more SL wins; SL tied -> critical beats
    non-critical, then higher die roll, then higher modified skill (0 DoS).
    """
    if not atk.success:
        return False, 0
    if dfn is None or not dfn.success:
        return True, atk.sl
    if atk.sl != dfn.sl:
        return atk.sl > dfn.sl, max(0, atk.sl - dfn.sl)
    if atk.crit != dfn.crit:
        return atk.crit, 0
    if atk.roll != dfn.roll:
        return atk.roll > dfn.roll, 0
    return atk.skill >= dfn.skill, 0


# ------------------------------------------------------------------ location
def general_location(ones):
    """Attacker's ones die: 1-5 Body, 6 R Arm, 7 L Arm, 8 R Leg, 9 L Leg, 0 Head."""
    d = 10 if ones == 0 else ones
    return "Body" if d <= 5 else {6: "R Arm", 7: "L Arm", 8: "R Leg", 9: "L Leg", 10: "Head"}[d]


def detail_location(loc, ones):
    d = 10 if ones == 0 else ones
    key = "Arm" if "Arm" in loc else "Leg" if "Leg" in loc else loc
    return next(name for a, b, name in DETAIL[key] if a <= d <= b)


# ------------------------------------------------------------------ target state
@dataclass
class Target:
    toughness: int
    death_threshold: int
    endurance: int
    worn_ap: dict                 # location -> AP from worn armor (before weapon mods)
    resolve_vs_shock: bool = False
    wp: dict = field(default_factory=lambda: {l: 0 for l in LOCATIONS})
    imp: dict = field(default_factory=lambda: {l: 0 for l in LOCATIONS})
    total_wp: int = 0
    shock: bool = False
    unconscious: bool = False
    dead: bool = False
    arm_useless: bool = False
    stunned: bool = False
    prone: bool = False
    resolve_spent: bool = False

    @property
    def lethality_level(self):
        return -(-self.death_threshold // 3)

    @property
    def dying(self):
        return self.shock and self.total_wp > self.lethality_level


def effective_ap(target, loc, weapon, keys, pierce_maneuver, rules):
    """AP at a location after the 4e armor modifier and any Pierce Armor."""
    worn = target.worn_ap.get(loc, 0)
    mod = weapon["armor_mod"]
    if mod > 0 and (worn > 0 or keys["plus_mod_hits_unarmored"]):
        worn += mod * keys["ap_per_plus"]
    pierce = -mod * keys["pierce_per_minus"] if mod < 0 else 0
    if pierce_maneuver and worn >= rules["pierce_armor_min_ap"]:
        pierce = pierce + rules["pierce_armor_value"] if keys["pierce_stacks"] else max(pierce, rules["pierce_armor_value"])
    return max(0, worn - pierce)   # Piercing only bypasses worn armor


def apply_wound(target, loc, wp, rng, rules):
    """Mark WP, roll Wound Die + Toughness, resolve impairment and Shock.
    Returns True if this wound impaired the location."""
    if wp <= 0:
        return False
    target.wp[loc] += wp
    target.total_wp += wp
    if target.total_wp >= target.death_threshold:
        target.dead = True

    die = rules["wound_die"]
    face = rng.randint(1, die)
    impaired = face != die and face + target.toughness <= target.wp[loc]
    if not impaired:
        return False

    target.imp[loc] += 1
    shock = unconscious = False
    odd = face % 2 == 1
    if target.imp[loc] >= 2:
        shock = True
        unconscious = loc == "Head"
    elif loc == "Body":
        shock = not resolve(d100(rng), target.endurance, rules).success
    elif "Arm" in loc:
        if not odd:
            target.arm_useless = True     # odd: drops what is held
    elif "Leg" in loc:
        if odd:
            target.prone = True           # even: hobbled, no run/charge
    elif loc == "Head":
        if odd:
            target.stunned = True
        else:
            shock = unconscious = True

    if shock and target.resolve_vs_shock and not target.resolve_spent:
        target.resolve_spent = True
        shock = unconscious = False
    if shock:
        target.shock = True
        target.prone = True
        target.unconscious = target.unconscious or unconscious
    return True


def incapacitated(target, rule):
    return ((rule["dead"] and target.dead)
            or (rule["shock"] and (target.shock or target.unconscious))
            or (rule["arm_useless"] and target.arm_useless)
            or (rule["stunned"] and target.stunned)
            or (rule["prone"] and target.prone))


# ------------------------------------------------------------------ one attack
def choose_maneuvers(rolled_loc, atk, dos, target, weapon, cfg):
    """Pick the legal maneuver set that maximises the wound.
    Returns (location, pierce_maneuver)."""
    rules, keys, tac = cfg["tbe"], cfg["keys"], cfg["tactics"]
    allowed = rules["maneuvers_crit"] if atk.crit else rules["maneuvers_normal"]
    options = []
    if tac["use_choose_location"] and atk.sl >= weapon["crit"]:
        options.append("cl")
    if tac["use_pierce_armor"] and atk.sl >= rules["pierce_armor_sl"]:
        options.append("pa")

    pref = tac["location_preference"]
    best = None
    for n in range(0, min(allowed, len(options)) + 1):
        for combo in combinations(options, n):
            locs = pref if "cl" in combo else [rolled_loc]
            for loc in locs:
                ap = effective_ap(target, loc, weapon, keys, "pa" in combo, rules)
                wp = max(0, weapon["dmg"] + dos - ap)
                # more WP first, then fewer maneuvers, then location preference
                score = (wp, -n, -pref.index(loc) if loc in pref else -99)
                if best is None or score > best[0]:
                    best = (score, loc, "pa" in combo)
    return best[1], best[2]


def attack(target, weapon, skill, dodge, cfg, rng):
    """One attack action. Returns dict of what happened."""
    rules, keys = cfg["tbe"], cfg["keys"]
    a = resolve(d100(rng), skill, rules)
    d = resolve(d100(rng), dodge, rules) if cfg["tactics"]["defender_dodges"] else None
    won, dos = opposed_attack(a, d)
    out = {"hit": won, "wounded": False, "impaired": False, "extra_hits": 0, "wp": 0}
    if not won:
        return out

    rolled = general_location(a.roll % 10)
    loc, pa = choose_maneuvers(rolled, a, dos, target, weapon, cfg)
    wp = max(0, weapon["dmg"] + dos - effective_ap(target, loc, weapon, keys, pa, rules))
    hits = [(loc, wp)]

    # Ammo dice: each extra-hit face = another hit at base Dmg, new location.
    n = weapon["ammo_dice"]
    if n and (won or not keys["ammo_extra_hits_need_hit"]):
        extra = sum(rng.randint(1, keys["ammo_die_sides"]) == keys["ammo_extra_hit_face"] for _ in range(n))
        out["extra_hits"] = extra
        for _ in range(extra):
            eloc = general_location(rng.randint(0, 9))
            if keys["extra_hit_location"] == "different":
                while eloc == loc:
                    eloc = general_location(rng.randint(0, 9))
            edmg = weapon["dmg"] + (dos if keys["ammo_extra_hit_adds_dos"] else 0)
            hits.append((eloc, max(0, edmg - effective_ap(target, eloc, weapon, keys, False, rules))))

    for hloc, hwp in hits:
        if hwp > 0:
            out["wounded"] = True
            out["wp"] += hwp
            out["impaired"] |= apply_wound(target, hloc, hwp, rng, rules)
    return out


def blast(target, weapon, dodge, cfg, rng):
    """Blast as a Damaging hazard: Dmg = 4e Blast x mult, reduced by Dodge DoS
    (a standard roll's SL), landing on a rolled general location."""
    rules, keys = cfg["tbe"], cfg["keys"]
    dmg = weapon["blast"] * keys["blast_mult"]
    if keys["blast_dodge_dos_reduces"] and cfg["tactics"]["defender_dodges"]:
        r = resolve(d100(rng), dodge, rules)
        if r.success:
            dmg -= r.sl
    loc = general_location(rng.randint(0, 9))
    wp = max(0, dmg - effective_ap(target, loc, weapon, keys, False, rules))
    return apply_wound(target, loc, wp, rng, rules), wp
