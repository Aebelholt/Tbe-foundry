#!/usr/bin/env python3
"""Crow's Ledger stand-in. Owns the crow's mechanical state and the crow's own rolls
(system layer s1, s15). State: $LEDGER_STATE or ./ledger_state.json.
Log lines follow s15.3: KIND label · stat±n · e/b · [d,d]=total → Tn [CRIT|DOOM] [· expertise used] [HIT n dam | MISS]
Commands: init KEY | test STAT [--e N] [--b N] [--exp] [--why T] | attack [--e N] [--b N] [--exp]
          take N [--p] | ud ITEM | move STAT [--exp] (2d6 variant B) | status | state
"""
import sys, json, os, secrets
R = secrets.SystemRandom()
ST = os.environ.get("LEDGER_STATE", "ledger_state.json")
CROWS = {
 "mid": dict(name="Mara", bg="Bodyguard", S=3, A=1, M=0, stamina=17, ad=25, wounds=0,
             uses={"Slashing": 3}, ud={"torch": 1}, weapon="sword (steel)", t2=4, t3=7,
             adnote="medium armor+steel 14, shield+steel 7, sword Parry 4", speed=5),
 "start": dict(name="Mara", bg="Bodyguard", S=2, A=1, M=0, stamina=9, ad=14, wounds=0,
             uses={"Slashing": 1}, ud={"torch": 1}, weapon="sword", t2=3, t3=6,
             adnote="light armor 5, shield 5, sword Parry 4", speed=5),
}
def load(): return json.load(open(ST))
def save(s): json.dump(s, open(ST, "w"))
def arg(a, k, d=0):
    return int(a[a.index(k) + 1]) if k in a else d
def tier(t): return 1 if t <= 11 else 2 if t <= 16 else 3
def d_(n, f): return [R.randint(1, f) for _ in range(n)]

def roll_test(s, stat, a, label, dice=(2, 10), cut=(11, 16), kind="TEST"):
    ds = d_(*dice)
    if dice == (2, 6) and ("--dis" in a or "--adv" in a):
        x = d_(3, 6); y = sorted(x); ds = y[:2] if "--dis" in a else y[1:]
    nat = sum(ds)
    mod = s[stat]; e = arg(a, "--e"); b = arg(a, "--b"); net = e - b
    bonus = 2 if net == 1 else -2 if net == -1 else 0
    total = nat + mod + bonus
    t = 1 if total <= cut[0] else 2 if total <= cut[1] else 3
    if net >= 2: t = min(3, t + 1)
    if net <= -2: t = max(1, t - 1)
    flag = ""
    if dice == (2, 10):
        if nat >= 19: t, flag = 3, " CRIT"
        elif nat <= 3: t, flag = 1, " DOOM"
    used = ""
    if "--exp" in a and flag != " DOOM" and t == 1:
        ex = next((k for k, v in s["uses"].items() if v > 0), None)
        if ex: s["uses"][ex] -= 1; t += 1; used = f" · expertise used ({ex} {s['uses'][ex]} left)"
    eb = "" if net == 0 else ("e" if net == 1 else "ee" if net >= 2 else "b" if net == -1 else "bb")
    return f"{kind} {label} · {stat}{mod:+d} · {eb or '-'} · [{','.join(map(str, ds))}]={total}{'' if not bonus else f'(incl {bonus:+d})'} → T{t}{flag}{used}", t, flag.strip()

def status(s):
    return (f"STATUS Stamina {s['stamina']} · AD {s['ad']} · wounds {s['wounds']}/10 · uses "
            + ",".join(f"{k} {v}" for k, v in s["uses"].items()) + " · UD " + ",".join(f"{k} {v}" for k, v in s["ud"].items()))

def main():
    c = sys.argv[1:]
    if not c: raise SystemExit(__doc__)
    cmd, a = c[0], c[1:]
    if cmd == "init":
        s = dict(CROWS[a[0]]); s["log"] = []; save(s); print("LEDGER: init", s["name"], s["bg"]); print(status(s)); return
    s = load()
    why = a[a.index("--why") + 1] if "--why" in a else ""
    if cmd == "test":
        line, t, f = roll_test(s, a[0].upper(), a, why or "test")
    elif cmd == "move":      # variant B: 2d6, 6- / 7-9 / 10+
        line, t, f = roll_test(s, a[0].upper(), a, why or "move", dice=(2, 6), cut=(6, 9), kind="MOVE")
    elif cmd == "attack":
        line, t, f = roll_test(s, "S", a, why or "attack", kind="ATTACK")
        if t >= 2: line += f" · HIT {(s['t2'] if t == 2 else s['t3']) + s['S']} dam"
        else: line += " · MISS"
    elif cmd == "take":
        n = int(a[0]); p = "--p" in a
        ad0, st0, w0 = s["ad"], s["stamina"], s["wounds"]
        if not p and s["ad"] > 0: x = min(s["ad"], n); s["ad"] -= x; n -= x
        if n > 0 and s["stamina"] > 0: x = min(s["stamina"], n); s["stamina"] -= x; n -= x
        if n > 0: s["wounds"] += n
        line = f"LEDGER: took {a[0]}{'P' if p else ''} (AD {ad0}→{s['ad']}, Stamina {st0}→{s['stamina']}, wounds {w0}→{s['wounds']})" + (" · CROW DEAD" if s["wounds"] >= 10 else "")
    elif cmd == "ud":
        item = a[0]; n0 = s["ud"].get(item, 0); ds = d_(n0, 6); n1 = n0 - sum(1 for d in ds if d <= 2)
        s["ud"][item] = n1; line = f"UD {item} · [{','.join(map(str, ds))}] → {n0}→{n1}" + (" · EXPIRED" if n1 == 0 else "")
    elif cmd in ("status", "state"):
        print(status(s)); return
    else: raise SystemExit("bad command")
    s["log"].append(line); save(s); print(line); print(status(s))
main()
