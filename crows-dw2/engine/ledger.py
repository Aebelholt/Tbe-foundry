#!/usr/bin/env python3
"""Crow's Ledger stand-in v2. Owns the crow's mechanical state and the crow's own rolls (system layer §1, §15).
State: $LEDGER_STATE or ./ledger_state.json. Log lines follow §15.3:
  KIND label · stat±n · e/b · [d,d]=total → Tn [CRIT|DOOM] [· expertise used] [HIT n dam | MISS]

Commands
  init KEY | init custom k=v ...     name bg S A M stamina ad weapon t2 t3 uses=Name:n,.. ud=item:n,.. blank=S,A rations gc
  test STAT [--e N] [--b N] [--exp [NAME]] [--why T]        a Crows test (2d10 + stat)
  attack [--w WEAPON] [--stat A|S] [--e N] [--b N] [--exp [NAME]] [--why T]
  cast BOOK [--e N] [--b N] [--exp [NAME]]                   Mind test; chaos d6 on a non-doom tier 1; backlash on a doom; UD unless crit
  take N [--p] [--src TEXT] [--slot P4]                      damage: AD, then Stamina, then a wound in a pack slot
  ud ITEM                                                    roll an item's usage dice (1-2 removes a die)
  book add NAME ud=1 rank=0 t2=TEXT t3=TEXT                  register a spellbook
  weapon add NAME stat=S|A|AS t2=3 t3=6                      register a weapon (damage adds the stat)
  place ITEM SLOT [--n N] | unplace SLOT | slots             inventory: H1 H2, B1-B4, P1-P10
  cond add|rm NAME                                           conditions (laceration, grabbed, prone, ...)
  mark add NAME | mark rm NAME | mark                        permanent Miasma Mark: fills a pack slot (counts toward death), resets taint
  rest [--miasma] [--tend] [--repair]                        R14: Stamina full, wound off, expertise back (not in the Miasma), a ration eaten
  set FIELD VALUE                                            e.g. set S 1 | set uses.Elemental 1 | set ud.torch 0 | set gc 40
  pool N | pool                                              pre-roll N d10 pairs; tests consume them in order (the Ref cannot choose)
  void [REASON]                                              undo the last mutating command and say why
  status | state                                             one-line status | full JSON
"""
import sys, json, os, secrets
R = secrets.SystemRandom()
ST = os.environ.get("LEDGER_STATE", "ledger_state.json")
CROWS = {
 "mid": dict(name="Mara", bg="Bodyguard", S=3, A=1, M=0, stamina=17, ad=25, wounds=0, uses={"Slashing": 3}, ud={"torch": 1},
             weapon="sword", t2=4, t3=7, adnote="medium armor+steel 14, shield+steel 7, sword Parry 4", speed=5),
 "start": dict(name="Mara", bg="Bodyguard", S=2, A=1, M=0, stamina=9, ad=14, wounds=0, uses={"Slashing": 1}, ud={"torch": 1},
             weapon="sword", t2=3, t3=6, adnote="light armor 5, shield 5, sword Parry 4", speed=5),
}
NOUNDO = {"undo", "log"}

def out(*lines):
    try:
        for l in lines: print(l)
        sys.stdout.flush()
    except BrokenPipeError:
        pass

def blank_slots():
    return {"H": [None, None], "B": [None] * 4, "P": [{"i": None, "w": False, "m": None} for _ in range(10)]}

def load():
    s = json.load(open(ST))
    s.setdefault("uses", {}); s.setdefault("ud", {}); s.setdefault("log", []); s.setdefault("undo", [])
    s.setdefault("stamina_max", s["stamina"]); s.setdefault("ad_max", s["ad"])
    s.setdefault("uses_max", dict(s["uses"])); s.setdefault("ud_max", dict(s["ud"]))
    s.setdefault("rations", 6); s.setdefault("gc", 0); s.setdefault("cruelty", 0); s.setdefault("conds", []); s.setdefault("blank", [])
    s.setdefault("weapons", {s.get("weapon", "unarmed"): {"stat": "S", "t2": s.get("t2", 1), "t3": s.get("t3", 2)}})
    s.setdefault("books", {}); s.setdefault("pool", []); s.setdefault("ud_norest", ["torch", "lantern"])
    if "slots" not in s:
        s["slots"] = blank_slots()
        for k in range(int(s.get("wounds", 0))):          # migrate a v1 wound count into pack slots
            place_wound(s, None)
    return s

def save(s):
    json.dump(s, open(ST, "w"))

def snap(s):
    s["undo"].append(json.dumps({k: v for k, v in s.items() if k not in NOUNDO}))
    s["undo"] = s["undo"][-6:]

def opt(a, k, d=None):
    if k in a:
        i = a.index(k)
        return a[i + 1] if i + 1 < len(a) and not a[i + 1].startswith("--") else True
    return d

def wounds(s): return sum(1 for p in s["slots"]["P"] if p["w"])
def speed(s):
    return max(0, s.get("speed", 5) - sum(1 for p in s["slots"]["P"] if p["w"] and p["i"]))

def in_hand(s, name):
    """R10 Equipped Items: a weapon, tool, light source or spellbook must be in a hand slot to be used. Unplaced sheets skip the check."""
    S = s["slots"]; placed = any(S["H"]) or any(S["B"]) or any(p["i"] for p in S["P"])
    if not placed: return True
    return any(x and name.lower() in str(x).lower() for x in S["H"])

def place_wound(s, slot):
    P = s["slots"]["P"]
    if slot:
        i = int(slot.lstrip("Pp")) - 1
        if P[i]["w"] or P[i].get("m"): raise SystemExit(f"{slot} already holds a wound or a mark")
        P[i]["w"] = True; return f"P{i+1}"
    for want_item in (False, True):
        for i in range(9, -1, -1):
            if not P[i]["w"] and not P[i].get("m") and bool(P[i]["i"]) == want_item:
                P[i]["w"] = True; return f"P{i+1}"
    return None

def status(s):
    ex = ",".join(f"{k} {v}" for k, v in s["uses"].items())
    ud = ",".join(f"{k} {v}" for k, v in s["ud"].items())
    bk = ",".join(f"{k} {b['ud']}UD" for k, b in s["books"].items())
    return (f"STATUS Stamina {s['stamina']}/{s['stamina_max']} · AD {s['ad']} · wounds {wounds(s)}/10 · speed {speed(s)} · uses {ex or '-'}"
            f" · UD {ud or '-'}{(' · books ' + bk) if bk else ''} · rations {s['rations']} · gc {s['gc']} · cruelty {s['cruelty']}" + (f" · taint {s['taint']}/3" if s.get("taint") else "")
            + (f" · conds {','.join(s['conds'])}" if s["conds"] else "") + (f" · pool {len(s['pool'])}" if s["pool"] else "")
            + (f" · BLANK {','.join(s['blank'])}" if s["blank"] else ""))

def dice2(s, sides=10):
    if sides == 10 and s["pool"]:
        d = s["pool"].pop(0); return d, "pool"
    return [R.randint(1, sides), R.randint(1, sides)], ""

def core(s, mod, a, label, kind, dice=(2, 10)):
    """a roll with edges/banes/crit/doom/expertise. returns (line, tier, flag)"""
    ds, src = dice2(s, dice[1])
    nat = sum(ds)
    e = int(opt(a, "--e", 0) or 0); b = int(opt(a, "--b", 0) or 0); net = e - b
    bonus = 2 if net == 1 else -2 if net == -1 else 0
    total = nat + mod + bonus
    t = 1 if total <= 11 else 2 if total <= 16 else 3
    if net >= 2: t = min(3, t + 1)
    if net <= -2: t = max(1, t - 1)
    flag = ""
    if nat >= 19: t, flag = 3, "CRIT"
    elif nat <= 3: t, flag = 1, "DOOM"
    used = ""
    ex = opt(a, "--exp")
    if ex and flag != "DOOM" and t < 3:                       # R8: any tier below 3, never on a doom
        name = ex if isinstance(ex, str) else next((k for k, v in s["uses"].items() if v > 0), None)
        if name and s["uses"].get(name, 0) > 0:
            s["uses"][name] -= 1; t += 1; used = f" · expertise used ({name} {s['uses'][name]} left)"
        else:
            used = " · expertise NOT used (none left or not named)"
    eb = "" if net == 0 else ("e" if net == 1 else "ee" if net >= 2 else "b" if net == -1 else "bb")
    return (f"{kind} {label} · {mod:+d} · {eb or '-'} · [{','.join(map(str, ds))}]={total}{'' if not bonus else f'(incl {bonus:+d})'}"
            f" → T{t}{(' ' + flag) if flag else ''}{used}{' · from pool' if src else ''}"), t, flag

def statval(s, stat):
    if stat in s["blank"]:
        raise SystemExit(f"BLANK STAT {stat}: the player chooses it now (chardisc, layer §2.2). Run: set {stat} <n> (and the other blank one if the pattern fixes it)")
    return int(s.get(stat, 0))

def roll_ud(s, item, n0=None):
    cur = s["ud"].get(item) if item in s["ud"] else s["books"][item]["ud"]
    ds = [R.randint(1, 6) for _ in range(cur)]; n1 = cur - sum(1 for d in ds if d <= 2)
    if item in s["ud"]: s["ud"][item] = n1
    else: s["books"][item]["ud"] = n1
    return f"UD {item} · [{','.join(map(str, ds))}] → {cur}→{n1}" + (" · EXPIRED" if n1 == 0 else "")

def main():
    c = sys.argv[1:]
    if not c or c[0] in ("-h", "--help", "help"):
        out(__doc__); return
    cmd, a = c[0], c[1:]
    if cmd == "init":
        if a[0] == "custom":
            kv = dict(x.split("=", 1) for x in a[1:])
            pairs = lambda k: {n: int(v) for n, v in (u.split(":") for u in kv.get(k, "").split(",") if u)}
            s = dict(name=kv.get("name", "Crow"), bg=kv.get("bg", "-"), S=int(kv.get("S", 0)), A=int(kv.get("A", 0)), M=int(kv.get("M", 0)),
                     stamina=int(kv["stamina"]), ad=int(kv.get("ad", 0)), wounds=0, uses=pairs("uses"), ud=pairs("ud"), weapon=kv.get("weapon", "unarmed"),
                     t2=int(kv.get("t2", 1)), t3=int(kv.get("t3", 2)), adnote=kv.get("adnote", ""), speed=5, rations=int(kv.get("rations", 6)),
                     gc=int(kv.get("gc", 0)), blank=[x for x in kv.get("blank", "").split(",") if x])
        else:
            s = dict(CROWS[a[0]])
        s["log"] = []; s["undo"] = []
        s.setdefault("stamina_max", s["stamina"]); s.setdefault("ad_max", s["ad"]); s.setdefault("uses_max", dict(s["uses"])); s.setdefault("ud_max", dict(s["ud"]))
        json.dump(s, open(ST, "w")); s = load(); save(s)
        out("LEDGER: init " + str(s["name"]) + " " + str(s["bg"]), status(s)); return
    s = load()
    why = opt(a, "--why", "")
    why = why if isinstance(why, str) else ""
    mut = True
    line = None
    if cmd in ("status", "state"):
        out(status(s) if cmd == "status" else json.dumps({k: v for k, v in s.items() if k not in NOUNDO}, indent=1)); return
    if cmd == "slots":
        S = s["slots"]
        out("H " + " | ".join(f"H{i+1}:{x or '-'}" for i, x in enumerate(S["H"])),
            "B " + " | ".join(f"B{i+1}:{x or '-'}" for i, x in enumerate(S["B"])),
            "P " + " | ".join(f"P{i+1}:{(p['i'] or '-')}{'+WOUND' if p['w'] else ''}{('+MARK ' + p['m']) if p.get('m') else ''}" for i, p in enumerate(S["P"])), f"speed {speed(s)}"); return
    if cmd != "void": snap(s)
    if cmd == "test":
        stat = a[0].upper()
        line, t, f = core(s, statval(s, stat), a, why or f"{stat} test", "TEST")
        line = line.replace(" · ", f" · {stat} · ", 1) if False else line
    elif cmd == "attack":
        w = opt(a, "--w") or s.get("weapon")
        if w not in s["weapons"]: raise SystemExit(f"no weapon {w}; weapon add {w} stat=S t2=.. t3=..")
        if not in_hand(s, w): raise SystemExit(f"{w} is not in a hand slot (R10 Equipped Items). Move it with `place {w} H1` (a maneuver in combat); nothing was rolled")
        W = s["weapons"][w]
        stat = (opt(a, "--stat") or "").upper() if isinstance(opt(a, "--stat"), str) else ""
        if not stat:
            if W["stat"] == "AS":
                for x in ("A", "S"): statval(s, x)
                stat = "A" if s["A"] > s["S"] else "S"
            else: stat = W["stat"]
        sv = statval(s, stat)
        line, t, f = core(s, sv, a, f"{w} ({stat})" + (f" {why}" if why else ""), "ATTACK")
        line += f" · HIT {(W['t2'] if t == 2 else W['t3']) + sv} dam" if t >= 2 else " · MISS"
    elif cmd == "cast":
        b = s["books"].get(a[0]) or raise_(f"no book {a[0]}; book add {a[0]} ud=1 rank=0 t2=.. t3=..")
        if b["ud"] <= 0: raise SystemExit(f"{a[0]} has no UD left: no magic until it regains on a rest")
        if not in_hand(s, a[0]): raise SystemExit(f"{a[0]} book is not in a hand slot (R10 Equipped Items). Move it with `place spellbook-{a[0]} H1` (a maneuver in combat); nothing was rolled")
        line, t, f = core(s, statval(s, "M"), a, a[0], "CAST")
        res = {1: "tier 1", 2: f"T2: {b.get('t2', '?')}", 3: f"T3: {b.get('t3', '?')}"}[t]
        extra = []
        if f == "DOOM": extra.append(f"BACKLASH (doom): Ref rolls `engine.py table backlashes --mod {b['rank']}` (d100 + rank)")
        elif t == 1:
            ch = R.randint(1, 6); extra.append(f"chaos d6={ch}" + (f" → BACKLASH: Ref rolls `engine.py table backlashes --mod {b['rank']}`" if ch == 1 else " → no backlash"))
        if f != "CRIT": extra.append(roll_ud(s, a[0]))
        else: extra.append("crit: no UD roll")
        line = line + " · " + res + (" · " + " · ".join(extra) if extra else "")
    elif cmd == "take":
        n = int(a[0]); p = "--p" in a; src = opt(a, "--src", ""); src = src if isinstance(src, str) else ""
        ad0, st0, w0 = s["ad"], s["stamina"], wounds(s)
        if not p and s["ad"] > 0: x = min(s["ad"], n); s["ad"] -= x; n -= x
        if n > 0 and s["stamina"] > 0: x = min(s["stamina"], n); s["stamina"] -= x; n -= x
        placed = []
        slot_arg = opt(a, "--slot")
        for _ in range(n):
            sl = place_wound(s, slot_arg if isinstance(slot_arg, str) and not placed else None)
            if sl is None: break
            placed.append(sl)
        s["wounds"] = wounds(s)
        dead = all(p_["w"] or p_.get("m") for p_ in s["slots"]["P"])
        line = (f"LEDGER: took {a[0]}{'P' if p else ''}{(' (' + src + ')') if src else ''} (AD {ad0}→{s['ad']}, Stamina {st0}→{s['stamina']}, wounds {w0}→{wounds(s)}"
                + (f", wound in {','.join(placed)}" if placed else "") + ")" + (" · CROW DEAD" if dead else ""))
    elif cmd == "ud":
        line = roll_ud(s, a[0])
    elif cmd == "book":
        if a[0] != "add": raise SystemExit("book add NAME ud=1 rank=0 t2=.. t3=..")
        kv = dict(x.split("=", 1) for x in a[2:]); n = int(kv.get("ud", 1))
        s["books"][a[1]] = dict(ud=n, ud_max=n, rank=int(kv.get("rank", 0)), t2=kv.get("t2", ""), t3=kv.get("t3", ""))
        s["ud"].pop(a[1], None); s["ud_max"].pop(a[1], None)
        line = f"LEDGER: book {a[1]} · {n} UD · rank {s['books'][a[1]]['rank']}"
    elif cmd == "weapon":
        kv = dict(x.split("=", 1) for x in a[2:])
        s["weapons"][a[1]] = dict(stat=kv.get("stat", "S"), t2=int(kv["t2"]), t3=int(kv["t3"]))
        line = f"LEDGER: weapon {a[1]} · {s['weapons'][a[1]]['stat']} · T2 {kv['t2']}+stat · T3 {kv['t3']}+stat"
    elif cmd == "place":
        item, slot = a[0], a[1].upper(); nn = int(opt(a, "--n", 1) or 1)
        zone, idx = slot[0], int(slot[1:]) - 1
        for k in range(nn):
            j = idx + k
            if zone in "HB": s["slots"][zone][j] = item
            else: s["slots"]["P"][j]["i"] = item
        line = f"LEDGER: placed {item} in {slot}" + (f"..{zone}{idx+nn}" if nn > 1 else "")
    elif cmd == "unplace":
        slot = a[0].upper(); zone, idx = slot[0], int(slot[1:]) - 1
        if zone in "HB": s["slots"][zone][idx] = None
        else: s["slots"]["P"][idx]["i"] = None
        line = f"LEDGER: cleared {slot}"
    elif cmd == "cond":
        if a[0] == "add" and a[1] not in s["conds"]: s["conds"].append(a[1])
        if a[0] == "rm" and a[1] in s["conds"]: s["conds"].remove(a[1])
        line = f"LEDGER: conditions {','.join(s['conds']) or 'none'}"
    elif cmd == "rest":
        miasma = "--miasma" in a
        s["stamina"] = s["stamina_max"]
        if wounds(s) > 0:
            for _ in range(2 if "--tend" in a else 1):
                for i in range(10):                                  # the player chooses which wound; default: one that costs speed first
                    P = s["slots"]["P"]; cand = [k for k in range(10) if P[k]["w"] and P[k]["i"]] or [k for k in range(10) if P[k]["w"]]
                    if cand: P[cand[0]]["w"] = False; break
        s["wounds"] = wounds(s)
        mark_due = ""
        if not miasma:
            s["uses"] = dict(s["uses_max"])
            if s["cruelty"] > 0:                                     # slow burn: coming home carrying Miasma is the count (HOUSE, Fallout)
                s["taint"] = s.get("taint", 0) + 1
                mark_due = f" · returned with Miasma, taint {s['taint']}/3" + (" · MARK DUE: roll `engine table miasma_mark`, then `ledger mark add <name>`" if s["taint"] >= 3 else "")
            s["cruelty"] = 0
        for k, mx in s["ud_max"].items():                            # R13: only "Rest" UD (spellbooks) return; torch and lantern do not
            if not any(w in k.lower() for w in s["ud_norest"]): s["ud"][k] = mx
        for k, b in s["books"].items(): b["ud"] = b["ud_max"]
        if "--repair" in a: s["ad"] = s["ad_max"]
        ate = s["rations"] > 0
        if ate: s["rations"] -= 1
        line = (f"LEDGER: rest{' (Miasma: expertise uses not restored)' if miasma else ''}{' · tend wounds' if '--tend' in a else ''}"
                f"{' · armor repaired' if '--repair' in a else ''} · {'ration eaten' if ate else 'NO RATION (starvation wound due, R16)'}{mark_due}")
    elif cmd == "mark":
        P = s["slots"]["P"]
        if a[0] == "add":
            name = " ".join(a[1:])
            free = [i for i in range(9, -1, -1) if not P[i]["w"] and not P[i].get("m") and not P[i]["i"]] or [i for i in range(9, -1, -1) if not P[i]["w"] and not P[i].get("m")]
            if not free: raise SystemExit("no pack slot can hold a mark")
            i = free[0]; bumped = P[i]["i"]; P[i]["i"] = None; P[i]["m"] = name; s["taint"] = 0
            dead = all(q["w"] or q.get("m") for q in P)
            line = f"LEDGER: MARK {name} fills P{i+1} (permanent), taint reset" + (f" · displaced {bumped}: drop it or move it" if bumped else "") + (" · CROW LOST TO THE MIASMA" if dead else "")
        elif a[0] == "rm":
            q = [i for i in range(10) if P[i].get("m") and a[1].lower() in P[i]["m"].lower()]
            if not q: raise SystemExit("no such mark")
            nm = P[q[0]]["m"]; P[q[0]]["m"] = None; line = f"LEDGER: mark {nm} cleared (ritual or ruling only)"
        else:
            line = "LEDGER: marks " + (", ".join(f"P{i+1} {q['m']}" for i, q in enumerate(P) if q.get("m")) or "none") + f" · taint {s.get('taint', 0)}/3"; mut = False
    elif cmd == "set":
        k, v = a[0], a[1]
        v = int(v) if v.lstrip("-").isdigit() else v
        if "." in k:
            top, sub = k.split(".", 1); s[top][sub] = v
        else:
            s[k] = v
            if k in s["blank"] if isinstance(s.get("blank"), list) else False: s["blank"].remove(k)
        line = f"LEDGER: set {k} = {v}"
    elif cmd == "pool":
        if a:
            n = int(a[0]); s["pool"] += [[R.randint(1, 10), R.randint(1, 10)] for _ in range(n)]
        line = f"LEDGER: pool {len(s['pool'])} pre-rolled d10 pairs waiting; each crow test uses the next in order"
        if not a: mut = False
    elif cmd == "void":
        if not s["undo"]: raise SystemExit("nothing to void")
        prev = json.loads(s["undo"].pop()); log = s["log"]; und = s["undo"]
        s.clear(); s.update(prev); s["log"] = log; s["undo"] = und
        line = "LEDGER: VOID · last command undone" + (f" · {' '.join(a)}" if a else "")
    elif cmd == "move":
        raise SystemExit("`move` (variant B) was removed in v2")
    else:
        raise SystemExit("unknown command; run: ledger.py help")
    if mut:
        s["log"].append(line)
    save(s)
    out(line, status(s))

def raise_(m): raise SystemExit(m)
main()
