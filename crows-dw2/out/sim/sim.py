#!/usr/bin/env python3
"""Crows x DW2 Phase 1 combat simulation. stdlib only.

Variants: RAW, A0, A1, A2 (== C0 mechanically), A12, B.
See ../results.md for assumptions. Every ASSUMPTION is tagged in code.
"""
import random, statistics, csv, sys, copy

# ---------------------------------------------------------------- crows
# Starting crow: Bodyguard background (Characters Book, Backgrounds):
#   S2 A1 M0, Stamina 9, Slashing expertise 1 use, light armor + shield + sword.
# AD = 5 (light) + 5 (shield) + 4 (sword Parry 4) = 14. Matches printed
#   Warrior Sword P4 block "AD: 14 (light armor, shield, sword)" (Ref Book).
# Sword card: Attack 2d10+S, tier2 3+S, tier3 6+S, Parry 4 (Inventory Cards
#   Annotated PDF, p.1). Consistent with the Warrior Sword P4 block (S1 -> 4/7).
# Level-appropriate crow: 5,000 TXP = 6 bonuses (Expertise & Stamina
#   Advancement table) + 1 characteristic bonus (Characteristics table).
#   Build: S3 A1 M0; Stamina 9 + 4x2 = 17; Slashing 3 uses (max 3 at 6th bonus);
#   medium armor +steel (10+4) + shield +steel (5+2) + sword Parry 4 = 25 AD;
#   steel sword +1/+1. [BUILD CHOICE, flagged]
CROWS = {
    "start": dict(S=2, A=1, M=0, stamina=9, ad=14, exp_uses=1, w2=3, w3=6),
    "t5000": dict(S=3, A=1, M=0, stamina=17, ad=25, exp_uses=3, w2=4, w3=7),
}
WOUND_SLOTS = 10  # Rules Book, Wounds: die when all backpack slots hold wounds

# ---------------------------------------------------------------- foes
# Printed Ref Book blocks. atk=(mod, t2, t3). ctr = counter dmg (tier 2 of
# first melee attack unless a printed counter ability overrides it).
FOES = {
    "ape":    dict(st=10, mod=2, t2=3, t3=5, ctr=3),
    "bear":   dict(st=20, mod=2, t2=4, t3=6, ctr=4, corner=(15, 2)),
    "bearc":  dict(st=30, mod=3, t2=6, t3=6, ctr=6, corner=(22, 2)),   # Bear Cave P9
    "wolf":   dict(st=10, mod=1, t2=3, t3=4, ctr=3, pack=True),
    "uA":     dict(st=10, mod=2, t2=2, t3=4, ctr=2),                   # undead A P2
    "uB":     dict(st=20, mod=2, t2=3, t3=5, ctr=5),                   # P4, Spiked Counter 5
    "uC":     dict(st=30, mod=2, t2=4, t3=6, ctr=4, grab=True),        # P6 solo
}
# Not modelled (flagged): lacerate, ranged spines, Claws 2-target, opportunity
# attacks, flee/morale, positioning. Animals defeated at 0 Stamina
# (Ref Book, Ending the Fight: animals flee at 0 Stamina).

SCEN = {
    "ape":        lambda r: ["ape"],
    "bear":       lambda r: ["bear"],
    "wolves1d6":  lambda r: ["wolf"] * r.randint(1, 6),            # Ref Book animal tables
    "undeadA1d6": lambda r: ["uA"] * r.randint(1, 6),              # Ref Book undead table row 1
    "undeadC":    lambda r: ["uC"],                                # P6 solo
    "bearcave":   lambda r: ["bearc"],                             # P9 solo
    "S1_chapel":  lambda r: ["bear", "wolf", "wolf"],              # scenario S1
    "S5_swarm2d6": lambda r: ["uA"] * (r.randint(1, 6) + r.randint(1, 6)),  # S5, 2d6 undead A
}

class Foe:
    def __init__(s, k):
        d = FOES[k]
        s.k, s.mod, s.t2, s.t3, s.ctr = k, d["mod"], d["t2"], d["t3"], d["ctr"]
        s.st = d["st"]; s.corner = d.get("corner"); s.pack = d.get("pack", False)
        s.grab = d.get("grab", False); s.react = True
    def bonus(s):
        return s.corner[1] if s.corner and s.st <= s.corner[0] else 0
    def dmg(s, tier, crow):
        base = s.t2 if tier == 2 else s.t3
        base += s.bonus()
        if s.grab and crow.grabbed:
            base += 2   # Big Bite
        return base

class Crow:
    def __init__(s, key):
        d = CROWS[key]; s.d = d
        s.stat = max(d["S"], d["A"])
        s.ad, s.st, s.wounds = d["ad"], d["stamina"], 0
        s.ad0, s.st0 = s.ad, s.st
        s.uses = d["exp_uses"]; s.grabbed = False; s.react = True
        s.dmg_in = 0     # raw damage dealt to crow (incl AD absorbed)
    def take(s, n, piercing=False):
        s.dmg_in += n
        if not piercing and s.ad > 0:
            a = min(s.ad, n); s.ad -= a; n -= a
        if n > 0 and s.st > 0:
            a = min(s.st, n); s.st -= a; n -= a
        if n > 0:
            s.wounds += n
    @property
    def dead(s): return s.wounds >= WOUND_SLOTS
    def w(s, tier): return s.d["w2"] if tier == 2 else s.d["w3"]

def d10x2(r): return r.randint(1, 10) + r.randint(1, 10)
def tier_of(total): return 1 if total <= 11 else (2 if total <= 16 else 3)

def crow_test(r, crow, mod, edge=0):
    """2d10 + mod, expertise, crit/doom. returns (tier, crit, doom)."""
    raw = d10x2(r)
    crit, doom = raw >= 19, raw <= 3
    tier = tier_of(raw + mod + 2 * edge)
    if crit: tier = 3
    if doom: tier = 1
    if not doom and not crit and tier < 3 and crow.uses > 0:
        tier += 1; crow.uses -= 1      # expertise: greedy, any non-doom <3
    return tier, crit, doom

# ---------------------------------------------------------------- RAW
def fight_raw(r, crow, foes):
    rounds = turns = 0
    while foes and not crow.dead and rounds < 60:
        rounds += 1
        for f in foes: f.react = True
        crow.react = True
        pcs_first = r.randint(1, 10) >= 6
        def crow_turn():
            nonlocal foes, turns
            turns += 1
            acts = 1
            while acts and foes and not crow.dead:
                acts -= 1
                tgt = min(foes, key=lambda f: f.st)
                tier, crit, doom = crow_test(r, crow, crow.stat)
                if tier >= 2:
                    tgt.st -= crow.w(tier) + crow.stat
                    if tgt.st <= 0: foes.remove(tgt)
                else:
                    if tgt.react:
                        tgt.react = False
                        crow.take((tgt.t3 if doom else tgt.ctr) + tgt.bonus())
                if crit: acts += 1
        def foe_turns():
            nonlocal turns
            for f in list(foes):
                if crow.dead or f not in foes: continue
                turns += 1
                acts = 1
                if f.grab and crow.grabbed:
                    crow.take(2, piercing=True)       # Squeeze maneuver
                while acts and not crow.dead:
                    acts -= 1
                    mod = f.mod
                    edge = 0
                    if f.pack and sum(1 for g in foes if g.pack) >= 2:
                        mod += 1                       # Pack Hunter: +3 total vs +2 flank edge
                        edge += 1                      # flanking edge (+2)
                    if f.grab and crow.grabbed: edge += 1   # grabbed: attacks gain an edge
                    raw = d10x2(r)
                    crit, doom = raw >= 19, raw <= 3
                    t = tier_of(raw + mod + (2 if edge == 1 else 0))
                    if edge >= 2: t = min(3, t + 1)
                    if crit: t = 3
                    if doom: t = 1
                    if t >= 2:
                        crow.take(f.dmg(t, crow))
                        if t == 3 and f.grab: crow.grabbed = True
                    else:
                        if crow.react:
                            crow.react = False
                            f.st -= crow.w(3 if doom else 2) + crow.stat
                            if f.st <= 0:
                                foes.remove(f); break
                    if crit: acts += 1
        if pcs_first:
            crow_turn(); foe_turns()
        else:
            foe_turns(); crow_turn()
    return rounds, turns

# ---------------------------------------------------------------- Run A / C
def fight_trade(r, crow, foes, knob_t2=0, knob_unengaged=False):
    ex = 0
    engaged = None
    while foes and not crow.dead and ex < 80:
        ex += 1
        extra = 1
        while extra and foes and not crow.dead:
            extra -= 1
            tgt = min(foes, key=lambda f: f.st)
            tier, crit, doom = crow_test(r, crow, crow.stat)
            if tier == 3:
                tgt.st -= crow.w(3) + crow.stat
            elif tier == 2:
                tgt.st -= crow.w(2) + crow.stat
                crow.take(tgt.dmg(2, crow) + knob_t2)
                if tgt.grab and not crow.grabbed and False: pass
            else:
                crow.take(tgt.dmg(3, crow))
                if tgt.grab: crow.grabbed = True
                if knob_unengaged:
                    others = [f for f in foes if f is not tgt and f.st > 0]
                    if others:
                        o = r.choice(others)
                        crow.take(o.dmg(2, crow) + knob_t2)
            if tgt.grab and crow.grabbed and not crow.dead:
                crow.take(2, piercing=True)             # Squeeze each exchange
            if tgt.st <= 0 and tgt in foes: foes.remove(tgt)
            if crit: extra += 1
    return ex, ex


# ---------------------------------------------------------------- tunable Trade Blows
KNOBS = {
    "K1": "foe tier 2 damage +1",
    "K2": "on crow tier 1, ceil(unengaged/3) unengaged foes attack at their tier 2 (min 1 foe)",
    "K3": "as K2, and also on crow tier 2",
    "K5": "crow tier 1: suffer foe tier 3 minus 1",
    "K6": "expertise improves damage dealt only; damage suffered uses the pre-expertise tier",
}
def fight_trade_k(r, crow, foes, knobs=()):
    k = set(knobs)
    ex = 0
    while foes and not crow.dead and ex < 80:
        ex += 1
        extra = 1
        while extra and foes and not crow.dead:
            extra -= 1
            tgt = min(foes, key=lambda f: f.st)
            u0 = crow.uses
            raw = d10x2(r)
            crit, doom = raw >= 19, raw <= 3
            tier = tier_of(raw + crow.stat)
            if crit: tier = 3
            if doom: tier = 1
            pre = tier
            if not doom and not crit and tier < 3 and crow.uses > 0:
                tier += 1; crow.uses -= 1
            st = pre if "K6" in k else tier      # tier used for damage SUFFERED
            plus = 1 if "K1" in k else 0
            if tier >= 2:
                tgt.st -= crow.w(tier) + crow.stat
            if st == 2:
                crow.take(tgt.dmg(2, crow) + plus)
            elif st == 1:
                d = tgt.dmg(3, crow) - (1 if "K5" in k else 0)
                crow.take(max(d, 0))
                if tgt.grab: crow.grabbed = True
            trig = (st == 1 and ("K2" in k or "K3" in k)) or (st == 2 and "K3" in k)
            if trig:
                others = [f for f in foes if f is not tgt and f.st > 0]
                if others:
                    n = -(-len(others) // 3)
                    for o in r.sample(others, min(n, len(others))):
                        crow.take(o.dmg(2, crow) + plus)
            if tgt.grab and crow.grabbed and not crow.dead:
                crow.take(2, piercing=True)
            if tgt.st <= 0 and tgt in foes: foes.remove(tgt)
            if crit: extra += 1
    return ex, ex

# ---------------------------------------------------------------- Run B
def fight_b(r, crow, foes):
    """DW2 chassis: 2d6+stat, tiers 6-/7-9/10+, flat damage, no dmg rolls.
    Flat dmg = tier 2 value. 10+: inflict max (tier 3), suffer flat.
    7-9: flat both ways (cost is narrative, no number). 6-: suffer max (tier 3),
    inflict flat. Same durability as other variants (isolates resolution)."""
    ex = 0
    while foes and not crow.dead and ex < 80:
        ex += 1
        tgt = min(foes, key=lambda f: f.st)
        raw = r.randint(1, 6) + r.randint(1, 6)
        tot = raw + crow.stat
        base_in = tgt.dmg(2, crow)
        if tot >= 10:
            tgt.st -= crow.w(3) + crow.stat
            crow.take(base_in)
        elif tot >= 7:
            tgt.st -= crow.w(2) + crow.stat
            crow.take(base_in)
        else:
            tgt.st -= crow.w(2) + crow.stat
            crow.take(tgt.dmg(3, crow))
        if tgt.st <= 0 and tgt in foes: foes.remove(tgt)
    return ex, ex

VARIANTS = {
    "RAW": lambda r, c, f: fight_raw(r, c, f),
    "A0":  lambda r, c, f: fight_trade(r, c, f),
    "A1":  lambda r, c, f: fight_trade(r, c, f, knob_t2=1),
    "A2":  lambda r, c, f: fight_trade(r, c, f, knob_unengaged=True),   # == C0
    "A12": lambda r, c, f: fight_trade(r, c, f, knob_t2=1, knob_unengaged=True),
    "B":   lambda r, c, f: fight_b(r, c, f),
}
def kvariant(name):
    ks = tuple(name.split("+")[1:])
    return lambda r, c, f: fight_trade_k(r, c, f, ks)


def run(variant, scen, crowkey, n, seed):
    r = random.Random(seed)
    deaths = 0; dmg = []; eff = []; turns = []; rounds = []; wounds = []
    for _ in range(n):
        crow = Crow(crowkey)
        foes = [Foe(k) for k in SCEN[scen](r)]
        fn = VARIANTS[variant] if variant in VARIANTS else kvariant(variant)
        rd, tn = fn(r, crow, foes)
        deaths += crow.dead
        dmg.append(crow.dmg_in)
        eff.append((crow.st0 - crow.st) + crow.wounds)   # Stamina + wounds lost (AD excluded)
        wounds.append(crow.wounds)
        rounds.append(rd); turns.append(tn)
    return dict(variant=variant, scen=scen, crow=crowkey, n=n,
                death=deaths / n, dmg=statistics.mean(dmg),
                eff=statistics.mean(eff), wounds=statistics.mean(wounds),
                rounds=statistics.mean(rounds), turns_mean=statistics.mean(turns),
                turns_med=statistics.median(turns))

if __name__ == "__main__":
    N = int(sys.argv[1]) if len(sys.argv) > 1 else 10000
    rows = []
    for ci, crow in enumerate(CROWS):
        for si, sc in enumerate(SCEN):
            for vi, v in enumerate(VARIANTS):
                rows.append(run(v, sc, crow, N, seed=1000 * ci + 100 * si + 7))
    with open("raw_combat.csv", "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        w.writeheader(); w.writerows(rows)
    print("wrote raw_combat.csv", len(rows))
