#!/usr/bin/env python3
"""Crows Ref engine: true dice, printed tables, travel, village events, oracle, maps.

Ref-side only. The crow's own rolls stay in the Crow's Ledger.
Output lines starting "Ref:" are open (paste on the mechanics line).
Lines starting "SEALED:" are for the Ref alone: never show them, log them to the sealed ledger.

Usage: python3 engine.py <command> [args]   (python3 engine.py help)
State: $CROWS_STATE or ./crows_state.json. Tables and maps are read from this script's folder.
"""
import sys, os, json, re, zlib, base64, secrets

HERE = os.path.dirname(os.path.abspath(__file__))
STATE = os.environ.get("CROWS_STATE", "crows_state.json")
R = secrets.SystemRandom()

# ---------------------------------------------------------------- state
def load():
    if os.path.exists(STATE):
        return json.load(open(STATE))
    return {"log": [], "travel": {"day": 0, "hexes": 0, "lost": False}, "next_event": None,
            "maps": {}}

def save(s):
    s["log"] = s["log"][-300:]
    json.dump(s, open(STATE, "w"), ensure_ascii=False)

def out(s, line, sealed=False):
    line = ("SEALED: " if sealed else "Ref: ") + line
    s["log"].append(line)
    print(line)

# ---------------------------------------------------------------- dice
DICE = re.compile(r"^(\d*)d(\d+)([+-]\d+)?$")

def roll(expr):
    """'2d10+3' -> (dice list, total). Plain 'd100' allowed."""
    m = DICE.match(expr.replace(" ", ""))
    if not m:
        raise SystemExit(f"bad dice: {expr}")
    n, f, mod = int(m.group(1) or 1), int(m.group(2)), int(m.group(3) or 0)
    ds = [R.randint(1, f) for _ in range(n)]
    return ds, sum(ds) + mod, mod

def fmt(ds, total, mod=0):
    return f"[{','.join(map(str, ds))}]{'' if not mod else f'{mod:+d}'}={total}"

def tier_of(total):
    return 1 if total <= 11 else 2 if total <= 16 else 3

def test(mod, e=0, b=0):
    """Crows test (R6-8): 2d10+mod, edges/banes cancel pairwise, double shifts tier."""
    ds, _, _ = roll("2d10")
    nat = sum(ds)
    net = e - b
    bonus = 2 if net == 1 else -2 if net == -1 else 0
    total = nat + mod + bonus
    t = tier_of(total)
    if net >= 2: t = min(3, t + 1)
    if net <= -2: t = max(1, t - 1)
    flag = ""
    if nat >= 19: t, flag = 3, "CRIT"
    elif nat <= 3: t, flag = 1, "DOOM"
    eb = "" if net == 0 else ("e" if net == 1 else "ee" if net >= 2 else "b" if net == -1 else "bb")
    return ds, total, t, flag, eb

# ---------------------------------------------------------------- tables
_T = None
def tables():
    global _T
    if _T is None:
        import glob
        _T = {}
        for f in [os.path.join(HERE, "tables.json")] + sorted(glob.glob(os.path.join(HERE, "tables_*.json"))):
            for t in json.load(open(f)):
                _T[t["id"]] = t
    return _T

def lookup(tid, total):
    t = tables()[tid]
    for e in t["entries"]:
        if e["lo"] <= total <= e["hi"]:
            return e
    # clamp to the nearest printed row
    E = t["entries"]
    return E[0] if total < E[0]["lo"] else E[-1]

def roll_table(s, tid, mod=0, sealed=False, why=""):
    t = tables().get(tid) or raise_(f"no table {tid}; try: engine.py tables {tid.split('_')[0]}")
    die = t["die"] if t["die"].count("d") else "1" + t["die"]
    ds, total, _ = roll(die)
    total += mod
    e = lookup(tid, total)
    then = f" · then: {e['then']}" if e.get("then") else ""
    mtxt = f"{mod:+d}" if mod else ""
    out(s, f"{t['title']} ({t['src']}) {t['die']}{mtxt} {fmt(ds, total)} → {e['text']}{then}{' · ' + why if why else ''}", sealed)
    return e

def raise_(msg):
    raise SystemExit(msg)

# ---------------------------------------------------------------- oracle
ODDS = {"impossible": -8, "noway": -6, "veryunlikely": -4, "unlikely": -2, "5050": 0, "unsure": 0,
        "likely": 2, "verylikely": 4, "surething": 6, "hastobe": 8}

# ---------------------------------------------------------------- maps
BLOCK_MOVE = set('#+="x ')          # area flood-fill boundaries
BLOCK_SIGHT = set('#+="M')          # line of sight blockers
_M = {}
def mapdata(mid):
    if mid not in _M:
        p = os.path.join(HERE, "maps", mid + ".json")
        if not os.path.exists(p): raise_(f"no map {mid}")
        _M[mid] = json.load(open(p))
    return _M[mid]

class Level:
    def __init__(self, mid, lv):
        d = mapdata(mid)["levels"].get(lv) or raise_(f"no level {lv} in {mid}")
        self.d, self.x0, self.y0, self.rows = d, d["x0"], d["y0"], d["rows"]
        self.w, self.h = len(self.rows[0]), len(self.rows)
    def at(self, x, y):
        i, j = x - self.x0, y - self.y0
        return self.rows[j][i] if 0 <= i < self.w and 0 <= j < self.h else " "
    def cells(self):
        for j in range(self.h):
            for i in range(self.w):
                yield self.x0 + i, self.y0 + j
    def area(self, name):
        seed = self.d["areas"].get(name) or raise_(f"no area {name}; areas: {', '.join(self.d['areas'])}")
        seen, st = set(), [tuple(seed)]
        while st:
            x, y = st.pop()
            if (x, y) in seen or self.at(x, y) in BLOCK_MOVE: continue
            seen.add((x, y))
            st += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
        return seen
    def area_of(self, x, y):
        for a in self.d["areas"]:
            if (x, y) in self.area(a): return a
        return None
    def los(self, a, b):
        """Squares between a and b (exclusive) must not block sight. Supercover-lite Bresenham."""
        (x0, y0), (x1, y1) = a, b
        dx, dy = abs(x1 - x0), -abs(y1 - y0)
        sx, sy = (1 if x1 > x0 else -1), (1 if y1 > y0 else -1)
        err, x, y = dx + dy, x0, y0
        while (x, y) != (x1, y1):
            e2 = 2 * err
            if e2 >= dy: err += dy; x += sx
            if e2 <= dx: err += dx; y += sy
            if (x, y) != (x1, y1) and self.at(x, y) in BLOCK_SIGHT:
                return False, (x, y)
        return True, None

def dist(a, b):  # R18: diagonals count as 1
    return max(abs(a[0] - b[0]), abs(a[1] - b[1]))

def mstate(s, mid):
    return s["maps"].setdefault(mid, {"seen": {}, "tok": {}})

def reveal_cells(L, cells):
    """Add walls/doors/windows around revealed floor so rooms read as rooms."""
    extra = set()
    for x, y in cells:
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                extra.add((x + dx, y + dy))
    return set(cells) | extra

def render(s, mid, lv, mode):
    L, ms = Level(mid, lv), mstate(s, mid)
    seen = {tuple(p) for p in ms["seen"].get(lv, [])}
    g = {}
    for x, y in L.cells():
        c = L.at(x, y)
        if mode == "ref":
            c = L.d["ref"].get(f"{x},{y}", c)
        elif mode == "fog" and (x, y) not in seen:
            c = " "
        g[(x, y)] = c
    if mode == "ref":
        for a, (x, y) in {**L.d["areas"], **L.d.get("labels", {})}.items():
            if a.isdigit():
                for k, ch in enumerate(a): g[(x + k, y)] = ch
    for name, t in ms["tok"].items():
        if t["lv"] == lv and (mode != "fog" or (t["x"], t["y"]) in seen or t["ch"] == "@"):
            g[(t["x"], t["y"])] = t["ch"]
    xs = range(L.x0, L.x0 + L.w)
    if mode == "fog" and seen:  # crop to what is known, 2-square margin
        sx = [p[0] for p in seen]; sy = [p[1] for p in seen]
        xs = range(max(L.x0, min(sx) - 2), min(L.x0 + L.w, max(sx) + 3))
        ys = range(max(L.y0, min(sy) - 2), min(L.y0 + L.h, max(sy) + 3))
    else:
        ys = range(L.y0, L.y0 + L.h)
    lines = ["     " + "".join("-" if x < 0 else " " for x in xs),
             "     " + "".join(str(abs(x) // 10) if abs(x) >= 10 else " " for x in xs),
             "     " + "".join(str(abs(x) % 10) for x in xs)]
    for y in ys:
        lines.append(f"{y:>4} " + "".join(g[(x, y)] for x in xs).rstrip())
    toks = [f"{t['ch']}={n}" for n, t in ms["tok"].items() if t["lv"] == lv]
    return "\n".join(lines) + ("\n" + " · ".join(toks) if toks else "")

def pos(s, mid, spec):
    """'crow' (token name) or 'x,y' -> (lv or None, (x,y))."""
    ms = mstate(s, mid)
    if spec in ms["tok"]:
        t = ms["tok"][spec]; return t["lv"], (t["x"], t["y"])
    m = re.match(r"^(-?\d+),(-?\d+)$", spec)
    if not m: raise_(f"not a token or x,y: {spec}")
    return None, (int(m.group(1)), int(m.group(2)))

RESERVED = set("#.,+=\"x/^<>:ThbcoFrPwgMO*Stk&")

# ---------------------------------------------------------------- commands
HELP = """commands (open output starts 'Ref:', secret output starts 'SEALED:')
  roll EXPR [--secret] [--why TEXT]        any dice: 2d10+3, d100, 3d6
  test MOD [--e N] [--b N] [--table ID] [--why TEXT]
                                           Ref-side 2d10 test (monster attack, suspicion F31, NPC)
  init                                     side initiative d10: 6+ crows first (R18)
  enc [--en N] [--table ID] [--secret]     encounter check d10 >= EN (R14); rolls ID on a hit
  table ID [--mod N] [--secret] [--why T]  roll a printed table
  read ID TOTAL                            read a table row without rolling (e.g. a tier test)
  tables [FILTER]                          list table ids
  fate ODDS [--why TEXT] [--secret]        Mythic fate check, CF 5: 2d10+odds, 11+ yes
                                           odds: impossible noway veryunlikely unlikely 5050 likely verylikely surething hastobe
  travel slow|normal|fast [--en-adj N] [--lost] [--table ID]
                                           one travel day (R24-29): EN by pace, check, secret drift if lost
  found                                    the group is no longer lost
  cycle P [--raised]                       end a 10-day cycle: Prosperity check, then roll the next Village Event (sealed)
  event                                    reveal the sealed next Village Event when it lands
  map MAPID LEVEL [ref|player|fog]         render a map level (default fog)
  area MAPID LEVEL AREA                    reveal an area (plus its walls and doors)
  look MAPID TOKEN R                       reveal squares within R the token can see (light radius)
  tok MAPID NAME LEVEL X Y [CH]            place or move a token ('crow' draws as @)
  untok MAPID NAME                         remove a token
  where MAPID TOKEN                        token position and area
  dist MAPID A B                           distance in squares (diagonals = 1, R18); A/B = token or x,y
  los MAPID A B                            line of sight between A and B
  day [+N | set N]                         campaign day (travel adds 1 itself); prints cycle day and moon day
  moon [--day N] | moon special NAME|off  moon phase and EN adjustment (HOUSE); `travel ... --moon` applies it
  hunt new NAME MARKS | day NAME [--adv] | show   a hunt as a Mark clock (W&W p.16-17, adapted)
  log [N]                                  last N log lines (default 20)
  export / import BLOB                     compact state for a SAVE (sealed half)
  reset                                    wipe state (asks nothing; be sure)"""


# ---------------------------------------------------------------- calendar, moon, hunts (HOUSE additions, see Amendment 1 notes)
MOON = [  # (first day, last day) in a 30-day month, name, EN adjustment. HOUSE mapping of W&W p.20-21 (1-in-6 .. 5-in-6) onto Crows EN
    (0, 1, "New Moon", 2), (2, 6, "Waxing Crescent", 1), (7, 8, "Waxing Half", 0), (9, 13, "Waxing Gibbous", -1),
    (14, 15, "Full Moon", -2), (16, 20, "Waning Gibbous", -1), (21, 22, "Waning Half", 0), (23, 27, "Waning Crescent", 1), (28, 29, "New Moon", 2)]
def calday(s):
    return s.setdefault("cal", {"day": 0})["day"]
def moon_phase(s, day=None):
    d = (calday(s) if day is None else day) % 30
    name, adj = next((n, a) for lo, hi, n, a in MOON if lo <= d <= hi)
    sp = s.get("moon_special")
    if sp:
        name += f" ({sp})"
        if sp.lower().startswith("blood"): adj -= 2
    return d, name, adj
def hunt_roll(s, name, adv):
    h = s.setdefault("hunts", {}).get(name) or raise_(f"no hunt {name}; hunt new {name} MARKS")
    r1 = R.randint(1, 6); r2 = R.randint(1, 6) if adv else None
    r = max(r1, r2) if adv else r1
    e = lookup("wyrd_hunt_track", r)
    h["days"] += 1
    gain = 2 if "Double marks" in e["text"] else 1 if "Mark" in e["text"] else 0
    h["marks"] += gain
    out(s, f"hunt {name} day {h['days']} · d6{' (best of ' + str(r1) + ',' + str(r2) + ')' if adv else ''}={r} → {e['text']} · marks {h['marks']}/{h['need']}")
    if "Major setback" in e["text"]: roll_table(s, "wyrd_hunt_major")
    if "inor setback" in e["text"]: roll_table(s, "wyrd_hunt_minor")
    if "boon" in e["text"]: roll_table(s, "wyrd_hunt_boon")
    if h["marks"] >= h["need"] and not h.get("done"):
        h["done"] = True
        out(s, f"hunt {name}: marks reached, the quarry is found; the party plans how to take it on")

def opt(args, name, default=None, flag=False):
    if name in args:
        i = args.index(name)
        if flag:
            args.pop(i); return True
        v = args[i + 1]; del args[i:i + 2]; return v
    return False if flag else default

def main(argv):
    if not argv or argv[0] in ("help", "-h", "--help"):
        print(HELP); return
    cmd, a = argv[0], argv[1:]
    s = load()
    sealed = opt(a, "--secret", flag=True)
    why = opt(a, "--why", "")
    w = f" · {why}" if why else ""

    if cmd == "roll":
        ds, t, m = roll(a[0]); out(s, f"{a[0]} {fmt(ds, t, m)}{w}", sealed)

    elif cmd == "test":
        mod = int(a[0]); e = int(opt(a, "--e", 0)); b = int(opt(a, "--b", 0)); tid = opt(a, "--table")
        ds, total, t, flag, eb = test(mod, e, b)
        line = f"TEST{w} · {mod:+d}{' · ' + eb if eb else ''} · [{ds[0]},{ds[1]}]={total} → T{t}{' ' + flag if flag else ''}"
        if tid:
            row = {1: -999, 2: 12, 3: 999}[t]
            line += f" · {lookup(tid, row)['text']}"
        out(s, line, sealed)

    elif cmd == "init":
        r = R.randint(1, 10); out(s, f"initiative d10={r} → {'crows act first' if r >= 6 else 'enemies act first'}")

    elif cmd == "enc":
        en = min(10, int(opt(a, "--en", 9))); tid = opt(a, "--table")
        r = R.randint(1, 10)
        res = "ENCOUNTER NOW" if r == 10 else "sign now, encounter within the next DT" if r >= en else "none"
        out(s, f"encounter d10={r} vs EN {en} → {res}{w}", sealed)
        if r >= en and tid: roll_table(s, tid, sealed=sealed)

    elif cmd == "table":
        roll_table(s, a[0], int(opt(a, "--mod", 0)), sealed, why)

    elif cmd == "read":
        t = tables()[a[0]]; e = lookup(a[0], int(a[1]))
        print(f"{t['title']} ({t['src']}) {a[1]} → {e['text']}" + (f"\nnote: {t['note']}" if t.get("note") else ""))
        return

    elif cmd == "tables":
        f = a[0] if a else ""
        for tid, t in tables().items():
            if f in tid: print(f"{tid:44} {t['die']}{('+' + t['mod']) if t.get('mod') else ''} · {t['src']}")
        return

    elif cmd == "fate":
        k = re.sub(r"[^a-z0-9]", "", a[0].lower())
        if k not in ODDS: raise_(f"odds: {' '.join(ODDS)}")
        ds, _, _ = roll("2d10"); tot = sum(ds) + ODDS[k]
        out(s, f"fate ({a[0]}, CF 5){w} 2d10{ODDS[k]:+d} [{ds[0]},{ds[1]}]={tot} → {'YES' if tot >= 11 else 'NO'}", sealed)

    elif cmd == "travel":
        pace = a[0]; base = {"slow": (8, 1), "normal": (7, 2), "fast": (6, 3)}.get(pace) or raise_("pace: slow|normal|fast")
        mo = moon_phase(s)[2] if opt(a, "--moon", flag=True) else 0
        en = max(2, min(10, base[0] + int(opt(a, "--en-adj", 0)) + mo))
        tv = s["travel"]
        s.setdefault("cal", {"day": 0})["day"] += 1
        if opt(a, "--lost", flag=True): tv["lost"] = True
        tid = opt(a, "--table", "travel_encounters")
        tv["day"] += 1; tv["hexes"] += base[1]
        out(s, f"travel day {tv['day']} · {pace} · {base[1]} hex{'es' if base[1] > 1 else ''} · EN {en}{' (moon ' + format(mo, '+d') + ')' if mo else ''}")
        r = R.randint(1, 10)
        hit = r >= en
        out(s, f"travel encounter d10={r} vs EN {en} → {'ENCOUNTER NOW' if r == 10 else 'encounter today, Ref picks when' if hit else 'none'}")
        if hit: roll_table(s, tid)
        if tv["lost"]:
            dirs = [lookup("lost_direction", R.randint(1, 6))["text"] for _ in range(base[1])]
            out(s, f"lost drift, day {tv['day']}: {' → '.join(dirs)} (count clockwise from north, R27)", sealed=True)

    elif cmd == "day":
        c = s.setdefault("cal", {"day": 0})
        if a and a[0] == "set": c["day"] = int(a[1])
        elif a: c["day"] += int(a[0])
        out(s, f"campaign day {c['day']} · village cycle day {c['day'] % 10 + 1}/10 · moon day {c['day'] % 30}")

    elif cmd == "moon":
        if a and a[0] == "special":
            s["moon_special"] = None if len(a) < 2 or a[1] == "off" else " ".join(a[1:])
        dv = opt(a, "--day")
        d, name, adj = moon_phase(s, int(dv) if dv is not None else None)
        out(s, f"moon day {d}/30 · {name} · travel EN {adj:+d} (use travel --moon or --en-adj {adj}; HOUSE mapping)" + (" · Blood Moon doubles numbers encountered" if "Blood" in name else ""))

    elif cmd == "hunt":
        sub = a[0]
        if sub == "new":
            s.setdefault("hunts", {})[a[1]] = {"need": int(a[2]), "marks": 0, "days": 0}
            out(s, f"hunt {a[1]} begun · {a[2]} marks needed (W&W p.16 guide: mundane 1-2, uncommon 3-9, rare 10-20, mythic 24+)")
        elif sub == "day":
            hunt_roll(s, a[1], opt(a, "--adv", flag=True))
        elif sub == "show":
            for n, h in s.get("hunts", {}).items(): print(f"{n}: marks {h['marks']}/{h['need']} · days {h['days']}{' · FOUND' if h.get('done') else ''}")
            return

    elif cmd == "found":
        s["travel"]["lost"] = False; out(s, "the group knows where it is again")

    elif cmd == "cycle":
        p = int(a[0]); raised = opt(a, "--raised", flag=True)
        np_ = p if raised else max(-10, p - 1)
        out(s, f"cycle end · Prosperity {p} → {np_}{' (raised this cycle)' if raised else ' (nothing raised it, C45)'} · set it in the Ledger")
        ds, _, _ = roll("d10"); tot = ds[0] + np_
        e = lookup("village_event", tot)
        s["next_event"] = {"roll": f"d10{np_:+d} [{ds[0]}]={tot}", "text": e["text"]}
        out(s, f"next Village Event rolled: d10{np_:+d} [{ds[0]}]={tot} · sealed until it lands")
        out(s, f"next Village Event (C46-47) {tot}: {e['text']}", sealed=True)

    elif cmd == "event":
        ne = s.get("next_event") or raise_("no sealed event")
        out(s, f"Village Event lands ({ne['roll']}): {ne['text']}"); s["next_event"] = None

    elif cmd == "map":
        mode = a[2] if len(a) > 2 else "fog"
        print(render(s, a[0], a[1], mode)); return

    elif cmd == "area":
        L = Level(a[0], a[1]); ms = mstate(s, a[0])
        cur = {tuple(p) for p in ms["seen"].get(a[1], [])}
        cur |= reveal_cells(L, L.area(a[2]))
        ms["seen"][a[1]] = sorted(cur)
        print(f"revealed {a[0]}/{a[1]} area {a[2]}")

    elif cmd == "look":
        mid, name, rad = a[0], a[1], int(a[2])
        lv, p = pos(s, mid, name)
        L = Level(mid, lv); ms = mstate(s, mid)
        cur = {tuple(q) for q in ms["seen"].get(lv, [])}
        vis = [q for q in L.cells() if dist(p, q) <= rad and L.los(p, q)[0]]
        cur |= set(vis)
        ms["seen"][lv] = sorted(cur)
        print(f"{name} sees {len(vis)} squares within {rad}")

    elif cmd == "tok":
        mid, name, lv, x, y = a[0], a[1], a[2], int(a[3]), int(a[4])
        Level(mid, lv)
        ch = a[5] if len(a) > 5 else ("@" if name == "crow" else next(
            (c for c in name.upper() + "ABCDEFGHIJKLNQRUVWXYZ123456789" if c not in RESERVED and c != "@"), "?"))
        mstate(s, mid)["tok"][name] = {"lv": lv, "x": x, "y": y, "ch": ch}
        L = Level(mid, lv)
        print(f"{ch}={name} at {lv} ({x},{y}) on '{L.at(x, y)}'")

    elif cmd == "untok":
        mstate(s, a[0])["tok"].pop(a[1], None); print(f"removed {a[1]}")

    elif cmd == "where":
        lv, p = pos(s, a[0], a[1]); L = Level(a[0], lv)
        print(f"{a[1]}: {lv} {p} on '{L.at(*p)}' · area {L.area_of(*p) or '—'}"); return

    elif cmd == "dist":
        _, p = pos(s, a[0], a[1]); _, q = pos(s, a[0], a[2])
        print(f"{a[1]} → {a[2]}: {dist(p, q)} squares ({dist(p, q) * 5} ft)"); return

    elif cmd == "los":
        lv1, p = pos(s, a[0], a[1]); lv2, q = pos(s, a[0], a[2])
        lv = lv1 or lv2 or raise_("need at least one token to know the level")
        ok, blk = Level(a[0], lv).los(p, q)
        print(f"{a[1]} → {a[2]}: {'clear' if ok else f'blocked at {blk}'} · {dist(p, q)} squares"); return

    elif cmd == "log":
        for l in s["log"][-int(a[0] if a else 20):]: print(l)
        return

    elif cmd == "export":
        blob = base64.b85encode(zlib.compress(json.dumps(s, separators=(",", ":")).encode(), 9)).decode()
        print("ENGINE:" + blob); return

    elif cmd == "import":
        blob = a[0].removeprefix("ENGINE:")
        s = json.loads(zlib.decompress(base64.b85decode(blob)))
        print("state imported")

    elif cmd == "reset":
        s = {"log": [], "travel": {"day": 0, "hexes": 0, "lost": False}, "next_event": None, "maps": {}}
        print("state reset")

    else:
        raise_(f"unknown command {cmd}\n\n{HELP}")
    save(s)

if __name__ == "__main__":
    main(sys.argv[1:])
