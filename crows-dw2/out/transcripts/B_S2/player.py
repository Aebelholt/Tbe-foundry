#!/usr/bin/env python3
"""Scripted Player. `python3 player.py SCENARIO` prints the next declared action (advances a pointer).
Conditions read the Ledger state. The player never reads the Ref's text; the Ref reports only what the crow perceives."""
import sys, json, os
S = sys.argv[1]
here = os.path.dirname(os.path.abspath(__file__))
script = json.load(open(os.path.join(here, "player_scripts.json")))[S]
pf = "player_state.json"
n = json.load(open(pf))["n"] if os.path.exists(pf) else 0
led = json.load(open(os.environ.get("LEDGER_STATE", "ledger_state.json"))) if os.path.exists(os.environ.get("LEDGER_STATE", "ledger_state.json")) else {}
env = dict(stamina=led.get("stamina", 0), wounds=led.get("wounds", 0), ad=led.get("ad", 0))
pick = None
for i in range(n, len(script)):
    e = script[i]
    if "if" in e and not eval(e["if"], {}, env): continue
    pick = e; n = i + 1; break
if pick is None: pick = script[-1]; n = len(script)
json.dump({"n": n}, open(pf, "w"))
print(f"PLAYER [{n}/{len(script)}]: {pick['say']}" + (f"\n(roll on request: {pick['roll']})" if "roll" in pick else ""))
