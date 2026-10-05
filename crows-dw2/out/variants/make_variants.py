import re, os
ROOT = "/home/user/Tbe-foundry/crows-dw2"
layer = open(f"{ROOT}/crows_01_system_layer.md").read()
hot = open(f"{ROOT}/crows_06_hot_card.md").read()
F = lambda n: open(f"{ROOT}/out/variants/frag/{n}").read().rstrip() + "\n"
def swap(text, start, end, new):
    i = text.index(start); j = text.index(end, i)
    return text[:i] + new + "\n" + text[j:]
def hotfix(h, kind):
    if kind == "RAW": return h
    if kind == "D":
        return h.replace("- **Misses and crits:**", "- **Tier 1 off the attack row:** name a move from the card on the mechanics line (`Move: <name>`), per §9c. A weapon miss keeps its counter.\n- **Misses and crits:**")
    h = h.replace("- **Initiative:** each round, d10: 6+ means the crows act first.\n- **Turn:** a maneuver plus an action, or two maneuvers.\n",
                  "- **Combat:** no initiative, no rounds, no enemy turns. A run of exchanges; each exchange the crow engages one foe (§9).\n")
    h = h.replace("- **Misses and crits:** a melee miss lets the target counter (T2 dmg). A crit grants an extra action.\n",
                  "- **Misses and crits:** no counters. A crit grants an extra exchange. A crow tier 1 is a Ref move" + (" (named, from the card §9c)" if kind == "C" else "") + ".\n")
    h = h.replace("- **Damage:** AD first, then Stamina, then wounds in backpack slots. Ten wounds kills.",
                  "- **Damage:** AD first, then Stamina, then wounds in backpack slots. Ten wounds kills." if kind != "B" else "- **Damage:** flat. AD first, then Stamina. No wounds: at 0 Stamina the crow Faces Death (§B).")
    h = h.replace("- The first hostile act: run `init` and fetch the creature's block (F) before narrating its attack. The round counter starts at 1 and comes from the log.",
                  "- The first hostile act: read the creature's block before narrating its attack. There is no initiative and no round counter. Set each foe's band and put every foe on one scene line.")
    if kind == "B":
        h = h.replace("- **Tests:** 2d10 + A/M/S. ≤11 is T1, 12–16 T2 (partial, or success at a cost), 17+ T3. Natural 19–20 is a crit; natural 2–3 a doom.",
                      "- **Moves:** 2d6 + stat. 10+ full, 7–9 with a cost, 6− the Ref makes a named move (§B). No crits or dooms.")
        h = h.replace("- **Edges and banes:** one edge is +2, one bane −2. A double edge or bane shifts the tier instead. They cancel pairwise.\n- **Expertise:** spend a use after the roll for +1 tier. Not on a doom.\n", "")
    return h
def m1(t):
    old = [l for l in t.split("\n") if l.startswith("- **When the crow gets tier 1**")][0]
    new = ("- **When the crow gets tier 1**, the Ref makes a **named move from the Ref move card (§9c)** and says its name on the mechanics line (`Move: <name>`). "
           "The move always includes this: **exactly one** unengaged live foe, **named on the mechanics line**, attacks the crow (one engine `test`, damage as in step 2). "
           "Never more than one. If no foe is unengaged, only the named move happens.")
    return t.replace(old, new)

def build(kind):
    base = kind
    if kind.startswith("C") and kind != "C": kind = "C"
    L = layer
    if kind in ("A", "C"):
        L = swap(L, "**Combat** (R18–23):", "**Travel** (R24–29):", (F("A_combat.md") if kind == "A" else m1(F("C_combat.md")) if base == "C1" else F("C_combat.md")))
    if kind == "B":
        L = swap(L, "**Combat** (R18–23):", "**Travel** (R24–29):", "**Combat:** see §B. No grid, no initiative.\n")
    if kind in ("C", "B", "D"):
        L = swap(L, "**Imported layer: fronts with portents", "---\n\n## 6", F("C_threats.md"))
    if kind in ("C", "D"):
        L = L.replace("**Travel** (R24–29):", (F("C_social_misses.md") if kind == "C" else F("D_social_misses.md")) + "\n**Travel** (R24–29):", 1)
    if kind not in ("RAW", "D"):
        L = L.replace("| Combat | Round (R18) | Side initiative is rerolled at the start of each round | Ref |",
                      "| Combat | Exchange | Nothing fixed; foes act only through Trade Blows or Ref moves | Ref |")
        L = L.replace('initiative (R18, "a player of the Ref\'s choice": default the player), ', '')
    out = hotfix(hot, kind) + "\n\n---\n\n" + L
    if kind == "B":
        out += "\n\n---\n\n" + F("B_overlay.md")
    out = "VARIANT: " + kind + "\nThis file is the only rulebook you have. The chassis is not loaded; conduct is the hot card above.\n\n" + out
    os.makedirs(f"{ROOT}/out/variants/{base}", exist_ok=True)
    open(f"{ROOT}/out/variants/{base}/rules.md", "w").write(out.replace("VARIANT: " + kind, "VARIANT: " + base, 1))
    print(base, len(out), "chars")
for k in ("RAW", "A", "B", "C", "C1", "D"): build(k)
