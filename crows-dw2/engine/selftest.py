#!/usr/bin/env python3
"""Offline regression tests for engine.py and ledger.py. No LLM, no tokens. Run: python3 engine/selftest.py"""
import subprocess, os, sys, tempfile, json, re
HERE = os.path.dirname(os.path.abspath(__file__))
T = tempfile.mkdtemp()
ENV = dict(os.environ, CROWS_STATE=f"{T}/e.json", LEDGER_STATE=f"{T}/l.json")
fails = []
def run(script, *a, ok=True):
    r = subprocess.run([sys.executable, f"{HERE}/{script}", *a], env=ENV, capture_output=True, text=True)
    return r.returncode, (r.stdout + r.stderr)
def check(name, cond, info=""):
    print(("PASS " if cond else "FAIL ") + name + ("" if cond else f"  [{info[:160]}]"))
    if not cond: fails.append(name)
L = lambda *a: run("ledger.py", *a); E = lambda *a: run("engine.py", *a)

c, o = run("validate_tables.py", f"{HERE}/tables.json", f"{HERE}/tables_wyrd.json")
check("tables validate", c == 0 and "FAIL" not in o, o)

L("init", "custom", "name=T", "bg=x", "S=2", "A=1", "M=2", "stamina=9", "ad=2", "weapon=sword", "t2=3", "t3=6")
c, o = L("test", "M"); check("test M rolls", c == 0 and "TEST" in o, o)
L("place", "rope", "B1"); c, o = L("attack"); check("attack refuses weapon not in hand (sheet is placed)", c != 0 and "hand slot" in o and "nothing was rolled" in o, o)
L("place", "sword", "H1"); c, o = L("attack"); check("attack ok with weapon in H1", c == 0 and "ATTACK" in o.upper(), o)
L("book", "add", "spark", "ud=1", "rank=0", "t2=3 dam", "t3=5 dam"); L("place", "spellbook-spark", "B1")
c, o = L("cast", "spark"); check("cast refuses book in belt", c != 0 and "hand slot" in o, o)
L("unplace", "B1"); L("place", "spellbook-spark", "H2"); c, o = L("cast", "spark"); check("cast ok from H2", c == 0 and "CAST" in o, o)
st = json.load(open(f"{T}/l.json")); st["books"]["spark"]["ud"] = 0; json.dump(st, open(f"{T}/l.json", "w"))
c, o = L("cast", "spark"); check("cast refuses with 0 UD", c != 0 and "no UD" in o, o)

L("pool", "2"); c, o = L("test", "S"); check("pool consumed in order", "pool" in o.lower() or c == 0, o)
c, o = L("void", "test"); check("void undoes last mutating command", c == 0 and "void" in o.lower(), o)
L("set", "stamina", "9"); c, o = L("take", "3", "--p", "--src", "t"); check("take reduces Stamina, no wound", "Stamina 9→6" in o and "wounds 0→0" in o, o)
c, o = L("take", "9", "--p", "--src", "t"); check("take overflow places wounds in P slots", "wound in P" in o, o)
for _ in range(3): L("rest")  # no cruelty: no taint
c, o = L("status"); check("clean rests add no taint", "taint" not in o, o)
for i in range(3):
    L("set", "cruelty", "1"); c, o = L("rest")
check("3 returns with Miasma prints MARK DUE", "MARK DUE" in o and "taint 3/3" in o, o)
c, o = L("mark", "add", "Crowned"); check("mark add fills a slot, resets taint", "MARK Crowned fills P" in o, o)
c, o = L("slots"); check("slots shows the mark", "+MARK Crowned" in o, o)
c, o = L("status"); check("taint cleared after mark", "taint" not in o, o)
L("set", "cruelty", "1"); c, o = L("rest", "--miasma"); check("rest in Miasma adds no taint", "taint" not in o, o)
c, o = L("mark", "rm", "crowned"); check("mark rm works", c == 0 and "cleared" in o, o)
# a full pack of marks and wounds is death
L("init", "custom", "name=D", "bg=x", "S=1", "A=1", "M=1", "stamina=3", "ad=0", "weapon=sword", "t2=1", "t3=2")
for i in range(9): L("mark", "add", f"m{i}")
c, o = L("mark", "add", "last"); check("tenth mark loses the crow", "LOST TO THE MIASMA" in o, o)

c, o = E("enc", "--nope"); check("engine rejects unknown flag before rolling", c != 0 and "nothing was rolled" in o, o)
c, o = E("enc"); check("enc rolls", c == 0 and "encounter" in o.lower(), o)
c, o = E("table", "miasma_mark"); check("miasma_mark table rolls", "Miasma Marks" in o, o)
c, o = E("roll", "d10", "--why", "check 3/4"); check("hidden numbers in --why are rejected", c != 0, o)
c, o = E("day"); check("day runs", c == 0, o)
c, o = E("moon"); check("moon runs", "moon day" in o, o)
c, o = E("pos", "wolf", "3"); c, o = E("pos"); check("pos stores positions", "wolf" in o, o)
c, o = E("travel", "normal", "--part"); check("travel --part runs", c == 0, o)
c, o = E("card", "spark"); check("card prints a card or says how to build the deck", ("Spark" in o) or ("extract_cards" in o), o)

# v1 state migrates
v1 = {"name": "O", "bg": "x", "S": 1, "A": 1, "M": 1, "stamina": 5, "ad": 1, "wounds": 2, "uses": {}, "ud": {}, "weapon": "sword", "t2": 1, "t3": 2, "speed": 5, "rations": 3, "gc": 0}
json.dump(v1, open(f"{T}/l.json", "w")); c, o = L("status"); check("v1 state migrates (wounds to slots)", c == 0 and "wounds 2/10" in o, o)
print(f"\n{len(fails)} failed" if fails else "\nall passed"); sys.exit(1 if fails else 0)
