"""Native Twilight: 2000 4e ranged combat, for comparison runs.

Player's Manual (2022-08-04) refs:
  p.44  base dice A-D = D12-D6; 6+ is a success, 10+ on one die is two
  p.45  modifiers step dice up/down (raise the lowest, lower the highest);
        below two D6s drop a die, never below one D6
  p.63-66 aim, ammo dice (up to RoF), each ammo-die 6 = +1 damage or an
        extra hit at base damage on a random location; ammo dice only
        count if the base dice hit
  p.72  damage = base + 1 per extra success; D6 hit location; armor
        modifier applies only if armored; penetration limit; ablation
  p.73  incapacitated when damage >= hit capacity
  p.74-76 crit when damage after armor >= crit threshold; severe crits
        roll extra D10s (keep highest) per 2 steps over
"""
from dataclasses import dataclass, field

STEPS = [6, 8, 10, 12]


def base_dice(attr, skill, mod, sizes):
    """Die sizes for a roll, after applying a net step modifier."""
    dice = [sizes[attr]] + ([sizes[skill]] if skill in sizes else [])
    for _ in range(abs(mod)):
        dice.sort()
        if mod > 0:
            if dice[0] < 12:
                dice[0] = STEPS[STEPS.index(dice[0]) + 1]
        else:
            if dice[-1] > 6:
                dice[-1] = STEPS[STEPS.index(dice[-1]) - 1]
            elif len(dice) > 1:
                dice.pop()
    return dice


def successes(dice, rng, n):
    total = 0
    for size in dice:
        r = rng.randint(1, size)
        total += 2 if r >= n["double_success_on"] else 1 if r >= n["success_on"] else 0
    return total


@dataclass
class Target:
    hit_capacity: int
    armor: dict                       # 4e location -> current armor level
    fresh: dict = None                # starting armor levels, to spot ablation
    damage: int = 0
    crits: list = field(default_factory=list)
    incapacitated: bool = False
    dead: bool = False

    def __post_init__(self):
        if self.fresh is None:
            self.fresh = dict(self.armor)


def apply_hit(t, weapon, dmg, rng, n, info=None):
    """One hit. Returns damage that got through. `info`, if given, records
    whether the hit struck armor that had not yet been ablated."""
    loc = n["hit_location"][rng.randint(1, 6) - 1]
    armor = t.armor.get(loc, 0)
    if info is not None:
        info["fresh_armor"] = armor > 0 and armor == t.fresh.get(loc, 0)
    if armor > 0:
        armor = max(0, armor + weapon["armor_mod"])
        if weapon["damage"] <= armor - n["penetration_limit"]:
            return 0
    through = dmg - armor
    if through <= 0:
        return 0
    if t.armor.get(loc, 0) > 0 and n["armor_ablation"] and rng.randint(1, 6) >= n["success_on"]:
        t.armor[loc] -= 1

    t.damage += through
    if t.damage >= t.hit_capacity:
        t.incapacitated = True
    if through >= weapon["crit"]:
        rolls = 1 + max(0, through - weapon["crit"]) // n["severe_step"]
        injury = max(rng.randint(1, 10) for _ in range(rolls))
        t.crits.append((loc, injury))
        if injury in n["dead_crits"].get(loc, []):
            t.dead = t.incapacitated = True
        if injury in n["incap_crits"].get(loc, []) or n["crit_incapacitates"]:
            t.incapacitated = True
    return through


def attack(t, weapon, attr, skill, n, rng):
    dice = base_dice(attr, skill, n["attack_mod"] + weapon.get("native_mod", 0), n["die_sizes"])
    succ = successes(dice, rng, n)
    out = {"hit": succ > 0, "wounded": False, "armored_primary": False, "armored_primary_pen": False}
    if not succ:
        return out
    sixes = sum(rng.randint(1, 6) == 6 for _ in range(weapon["ammo_dice"]))
    main = weapon["damage"] + succ - 1
    hits = [main]
    if n["ammo_sixes"] == "damage":
        hits[0] += sixes
    else:
        hits += [weapon["damage"]] * sixes
    for i, dmg in enumerate(hits):
        info = {} if i == 0 else None
        through = apply_hit(t, weapon, dmg, rng, n, info)
        out["wounded"] |= through > 0
        if info and info["fresh_armor"]:
            out["armored_primary"] = True
            out["armored_primary_pen"] = through > 0
    return out
