"""Forms (a) and (b): engine-rolled foe attack, no initiative, no turn order.
 (a) every exchange: crow tier sets damage dealt; engaged foe's roll (2d10 + printed
     attack bonus) sets damage suffered.
 (b) foe rolls only when crow tier is 1 or 2; crow tier 3 suffers nothing.
 K2 (both): on crow tier 1, ceil(unengaged/3) unengaged foes attack (own roll).
 Extra knobs: KC foe tier 1 gives crow a counter (its tier 2 dmg); K1 foe tier 2 +1.
"""
import sim, random
from sim import Foe, Crow, d10x2, tier_of, crow_test, CROWS, SCEN

def foe_roll(r, f, crow, foes):
    mod, edge = f.mod, 0
    if f.pack and sum(1 for g in foes if g.pack) >= 2:
        mod += 1; edge += 1
    if f.grab and crow.grabbed: edge += 1
    raw = d10x2(r)
    crit, doom = raw >= 19, raw <= 3
    t = tier_of(raw + mod + (2 if edge == 1 else 0))
    if edge >= 2: t = min(3, t + 1)
    if crit: t = 3
    if doom: t = 1
    return t, doom

def foe_hits(r, f, crow, foes, plus):
    t, doom = foe_roll(r, f, crow, foes)
    if t >= 2:
        crow.take(f.dmg(t, crow) + (plus if t == 2 else 0))
        if t == 3 and f.grab: crow.grabbed = True
    return t, doom

def fight_form(r, crow, foes, form, knobs=()):
    k = set(knobs); plus = 1 if "K1" in k else 0
    ex = 0
    while foes and not crow.dead and ex < 80:
        ex += 1
        extra = 1
        while extra and foes and not crow.dead:
            extra -= 1
            tgt = min(foes, key=lambda f: f.st)
            tier, crit, doom = crow_test(r, crow, crow.stat)
            if tier >= 2:
                tgt.st -= crow.w(tier) + crow.stat
            if form == "a" or tier <= 2:
                ft, fdoom = foe_hits(r, tgt, crow, foes, plus)
                if ft == 1 and "KC" in k and tgt.st > 0:
                    tgt.st -= crow.w(3 if fdoom else 2) + crow.stat
            if tier == 1 and "K2" in k:
                others = [f for f in foes if f is not tgt and f.st > 0]
                if others:
                    n = -(-len(others) // 3)
                    for o in r.sample(others, min(n, len(others))):
                        foe_hits(r, o, crow, foes, plus)
            if tgt.grab and crow.grabbed and not crow.dead:
                crow.take(2, piercing=True)
            if tgt.st <= 0 and tgt in foes: foes.remove(tgt)
            if crit: extra += 1
    return ex, ex

_old = sim.kvariant
def kvariant(name):
    # names: FA+K2, FB+K2+KC ...
    if name[:2] in ("FA", "FB"):
        form = name[1].lower(); ks = tuple(name.split("+")[1:])
        return lambda r, c, f: fight_form(r, c, f, form, ks)
    return _old(name)
sim.kvariant = kvariant
