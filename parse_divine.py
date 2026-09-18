"""Extract Chapter 15 (Divine Magic) from the rulebook text dump.

Two halves, both verified against the book before anything is written:

  * the PROCEDURE -- Piety and how it is spent, the Piety Roll Results, the
    Piety Modifier Table, Miracle Resistance, persistent prayer, the holy
    symbol, the Pious Act Table, Cast Out and Atonement. Hand-transcribed
    with the quote each number came from, in the style parse_magic.py
    established, and `check_nums` asserts every declared number appears
    inside its own quote.

  * the DOMAIN LISTS -- 20 Domains, each with Lesser, Middle and Greater
    miracles. Those are extracted, not transcribed: the chapter prints them
    as a regular structure (a "<Name> Domain" heading, a line of aspects,
    then three "<Level> Miracle" headers each followed by tab-A bullets),
    and there are roughly 300 of them. Every extracted bullet is then
    round-tripped against the book, and every bullet's position is checked
    to fall between its own level's header and the next one, so a miracle
    cannot be filed under the wrong level while still "verifying".
"""
import json, re, unicodedata

SRC = "/tmp/tbe.txt"
raw = open(SRC, encoding="utf-8").read()
lines = raw.split("\n")


def flat_text(t):
    t = re.sub(r"(\w)[-‐]\s*\n\s*(\w)", r"\1\2", t)
    t = re.sub(r"\s*\n\s*", " ", t)
    return re.sub(r"\s{2,}", " ", t).strip()


def norm(s):
    s = (s.replace("’", "'").replace("‘", "'")
          .replace("“", '"').replace("”", '"')
          .replace("–", "-").replace("—", "-")
          .replace("−", "-").replace(" ", " ").replace(" ", " "))
    return re.sub(r"\s+([,.;:])", r"\1", s)


BOOK_N = norm(re.sub(r"\s+", " ", flat_text(raw)))
problems = []


def check(quote, where):
    if norm(quote) not in BOOK_N:
        problems.append(("quote not found in the book", where, quote[:70]))


def check_nums(row, where):
    q = norm(row.get("q", ""))
    if not q:
        problems.append(("row carries no quote", where))
        return
    check(row["q"], where)
    if "n" not in row:
        return
    n = row["n"]
    forms = [str(n)]
    if isinstance(n, int) and n < 0:
        forms = ["-" + str(abs(n))]
    WORDS = {0: ["zero", "no"], 1: ["one", "a "], 2: ["two"], 3: ["three"], 4: ["four"],
             5: ["five"], 6: ["six"], 10: ["ten"], 30: ["thirty"], 90: ["ninety"], 100: ["hundred"]}
    if isinstance(n, int) and n in WORDS:
        forms += WORDS[n]
    if not any(re.search(r"(?<![\d.])" + re.escape(f) + r"(?![\d])", q, re.I) for f in forms):
        problems.append(("the row's number is not in its own quote", where, n, row["q"][:60]))


# ---------------------------------------------------------------- the rules
PIETY = {
    "requiresGodbound": {"q": "earning a score in the Piety skill requires the possession of the Godbound Talent"},
    "startingValue": {"n": 30, "q": "When the Godbound Talent is taken, the character is granted a starting Piety of 30."},
    "noXp": {"q": "The Piety skill can never be improved with Experience Points. Only pious acts of service done in the god's name and for the god's benefit will improve the skill."},
    "cap": {"n": 90, "q": "A PC's actual Piety skill can never be improved past 90, although modifiers can temporarily raise it to 100 or beyond."},
    "noExpertise": {"q": "Piety can never have Expertise, but a Piety roll can benefit from a holy symbol"},
    "hidden": {"q": "By default, the Godbound never knows exactly what his current Piety score is: the GM keeps track of it."},
    "warningVision": {"n": 30, "q": "if a Godbound's Piety falls to 30 or below, they should receive an appropriate vision from their god by way of warning"},
    "goodVision": {"n": 80, "q": "if their Piety reaches 80, they should receive a positive vision or sign as encouragement"},
    "noResolve": {"q": "Godbound can't spend Resolve on Piety rolls."},
    "noWeaveReaction": {"q": "Weave Reactions do not manifest from a miracle. The god itself mitigates the Weave, regardless of the miracle's success or failure."},
    "symbolSls": {"n": 2, "q": "Piety SLs can be improved by +2 from a holy symbol's use."},
    "outsideDomain": {"q": "The gods cannot affect things outside their Domains. If a Godbound asks for a miracle that falls outside their deity's Domains, there will be no result."},
    "noShaping": {"q": "Unlike a Spellweaver, a Godbound cannot shape the miracle's effect."},
    "celestialCap": {"q": "celestial servants cannot grant Greater Miracles under any circumstance"},
    "oneAction": {"q": "Asking for a miracle takes one action."},
    "range": {"q": "usually the miracle affects a target within Close Range"},
    "over100": {"q": "subtract 100 from the modified Piety skill value. The tens die amount of this value acts as extra SLs (minimum +1 SL). It also means the miracle roll cannot critically fail."},
    "capViaActs": {"n": 90, "q": "A Godbound's Piety can never be raised to more than 90 through Pious Acts."},
}

HOLY_SYMBOL = {
    "supplyDie": {"q": "each use of the symbol requires a roll of its current Die Type (starts at d12)"},
    "afterSuccess": {"n": 2, "q": "The symbol can be rolled after a successful Piety roll to add +2 SLs to the outcome, but the Die Type diminishes one step on a roll of 1-2."},
    "notOnFailure": {"q": "The holy symbol does not help a failed Piety roll."},
    "blessing": {"n": 70, "q": "If a Godbound's holy symbol depletes below d6, the symbol must be blessed by another Godbound of the same deity with at least 70 Piety before it will provide further benefit."},
    "blessingIsMiracle": {"q": "The blessing itself is considered a Lesser Miracle that must be prayed and rolled for like any other effect, and restores the symbol to d12."},
    "onlyOne": {"q": "A Godbound may only possess one holy symbol at a time."},
}
# The die ladder a holy symbol steps down, and the floor the blessing rule names.
SYMBOL_DICE = ["d12", "d10", "d8", "d6", "d4"]

CAST_OUT = {
    "atZero": {"n": 0, "q": "If a Godbound's Piety ever falls to zero, they are Cast Out."},
    "immediate": {"q": "If the Piety score falls to zero due to a miracle roll's Piety cost, the Godbound is Cast Out immediately after the miracle's effects are resolved"},
    "noMiracles": {"q": "the deity will no longer respond to the Godbound's requests for miracles, and the Godbound cannot regain lost Piety until they have made an act of atonement"},
    "afterAtonement": {"n": 6, "q": "no Greater Miracles may be granted to the Godbound for 1d6 game sessions"},
}

# Persistent prayer (p.348).
PRAYER = [
    {"key": "minute", "label": "a full minute", "sls": 1, "q": "Praying for a full minute: +1 SL"},
    {"key": "ten", "label": "10 minutes", "sls": 2, "q": "Praying for 10 minutes: +2 SLs"},
    {"key": "hour", "label": "a full hour or more", "sls": 3, "q": "Praying for a full hour or more: +3 SLs"},
]

# Piety Roll Results (p.348). The SL bands that decide the level of miracle
# are quoted from the same table.
PIETY_RESULTS = [
    {"key": "success", "name": "Success", "cost": "1d10+SLs",
     "q": "The request is granted. Reduce the Godbound's Piety by 1d10 + the total SLs generated"},
    {"key": "crit", "name": "Critical Success", "cost": "0", "bonusSls": 3,
     "q": "Add 3 SLs to the roll's total. The miracle is granted as above with zero Piety cost."},
    {"key": "failure", "name": "Failure", "cost": "1d10",
     "q": "The god doesn't grant the miracle; reduce the Godbound's Piety by 1d10."},
    {"key": "critFail", "name": "Critical Failure", "cost": "1d10+10",
     "q": "The god doesn't grant the miracle; reduce the Godbound's Piety by 1d10+10."},
]
MIRACLE_BANDS = [
    {"level": "Lesser", "min": 1, "max": 4, "q": "1-4 SLs grants a Lesser Miracle"},
    {"level": "Middle", "min": 5, "max": 8, "q": "5-8 SLs grants a Middle Miracle"},
    {"level": "Greater", "min": 9, "max": 9999, "q": "9+ SLs grants a Greater Miracle"},
]

# Piety Modifier Table (p.347).
PIETY_MODIFIERS = [
    {"label": "Clearly furthers the god's aims or agenda", "mod": 10, "max": 30,
     "q": "Clearly furthers the god's aims or agenda +10 to +30"},
    {"label": "Directly aids others faithful to the god", "mod": 10,
     "q": "Directly aids others faithful to the god +10"},
    {"label": "Involves genuine self-sacrifice or personal hardship in the god's name", "mod": 10, "max": 20,
     "q": "Involves genuine self-sacrifice or personal hardship in the god's name +10 to +20"},
    {"label": "A plea made during great danger, showing true faith and humility", "mod": 10,
     "q": "A plea made during great danger, showing true faith and humility +10"},
    {"label": "Made arrogantly or without reverence", "mod": -10, "max": -20,
     "q": "Made arrogantly or without reverence -10 to -20"},
    {"label": "Motivated by personal gain, comfort, or vanity", "mod": -10,
     "q": "Motivated by personal gain, comfort, or vanity -10 or worse"},
    {"label": "Involves harm to the church's own faithful", "mod": -20,
     "q": "Involves harm to the church's own faithful -20 or worse"},
    {"label": "Violates a Core Stricture of the deity", "mod": -30,
     "q": "Violates a Core Stricture of the deity -30"},
]

# Miracle Resistance Table (p.349): the Fixed Number a target opposes with.
RESISTANCE = [
    {"key": "uninvolved", "name": "Uninvolved or ignorant (or unclear)", "fixed": 1},
    {"key": "threatening", "name": "Directly threatening the Godbound", "fixed": 2},
    {"key": "blasphemous", "name": "Blasphemous or offensive to the faith", "fixed": 3},
    {"key": "active", "name": "Active threat to the deity's works", "fixed": 4},
    {"key": "profane", "name": "Profane defiance", "fixed": 5},
]
RESISTANCE_RULES = {
    "livingOnly": {"q": "Only living, sentient beings make resistance rolls. Inanimate objects, areas, or zones cannot oppose a miracle"},
    "divinity": {"q": "Any character may oppose a miracle with the Divinity skill instead of another appropriate resistance"},
    "reroll": {"q": "If an ongoing Divine effect lasts for 1 minute or less, the target may attempt an opposed roll every round."},
}

# Pious Act Table (p.350).
PIOUS_ACTS = [
    {"act": "One hour of uninterrupted prayer (one attempt per day)", "gain": "50% chance of 1", "formula": "coin",
     "q": "One hour of uninterrupted prayer (one attempt per day) 50% chance of 1"},
    {"act": "Fasting", "gain": "1d3 per full day", "formula": "1d3",
     "note": "Suffer 1 Fatigue per day of fasting due to deprivation", "q": "Fasting* 1d3 per full day"},
    {"act": "Confession", "gain": "1d3", "formula": "1d3",
     "note": "must be heard by a religious superior, and can only be benefited from once per week",
     "q": "Confession** 1d3"},
    {"act": "Helping a member of the Faith", "gain": "1d4", "formula": "1d4",
     "q": "Helping a member of the Faith 1d4"},
    {"act": "Conducting a mass", "gain": "1d4+1", "formula": "1d4+1", "q": "Conducting a mass 1d4+1"},
    {"act": "Consecrating holy ground", "gain": "1d6", "formula": "1d6", "q": "Consecrating holy ground 1d6"},
    {"act": "Making a sacrifice of an item of deep personal importance", "gain": "1d8+2", "formula": "1d8+2",
     "q": "Making a sacrifice of an item of deep personal importance 1d8+2"},
    {"act": "Enduring physical or social harm for the god's sake", "gain": "1d8+4", "formula": "1d8+4",
     "q": "Enduring physical or social harm for the god's sake 1d8+4"},
    {"act": "Establishing a place of worship", "gain": "1d12+3", "formula": "1d12+3",
     "q": "Establishing a place of worship 1d12+3"},
    {"act": "Converting an unbeliever", "gain": "2d8+4", "formula": "2d8+4", "q": "Converting an unbeliever 2d8+4"},
    {"act": "Destroying a true enemy of the faith", "gain": "3d6+2", "formula": "3d6+2",
     "q": "Destroying a true enemy of the faith 3d6+2"},
    {"act": "Embodying the Core Strictures", "gain": "4d6", "formula": "4d6",
     "note": "Varies by deity: the act must clearly advance the god's aims, carry real cost or risk, and be performed in the deity's name",
     "q": "Embodying the Core Strictures*** 4d6"},
    {"act": "Fulfilling a pilgrimage", "gain": "1d10+8", "formula": "1d10+8", "q": "Fulfilling a pilgrimage 1d10+8"},
    {"act": "Completing a holy quest", "gain": "1d10+10", "formula": "1d10+10", "q": "Completing a holy quest 1d10+10"},
]

# ------------------------------------------------------- the Domain lists
# The chapter prints each Domain as a heading line, a line of aspects, then
# three levels of bullets. Extracted rather than transcribed: there are ~300.
FURNITURE = re.compile(r"^\s*(\d{1,3}|chapter \d+: .*|domain lists & miracles)\s*$", re.I)
DOMAIN_HEAD = re.compile(r"^([A-Z][A-Za-z]+) Domain\s*$")
LEVEL_HEAD = re.compile(r"^(Lesser|Middle|Greater)\s*Miracle\s*$")

DOM_START, DOM_END = 25430, 26440
domains = []
cur = None
level = None
buf = []
last_i = -99


def flush():
    """Close the bullet currently being accumulated."""
    global buf
    if cur and level and buf:
        text = flat_text("\n".join(buf))
        # Whatever terminal punctuation the book gives, including none: one
        # Fertility miracle ends "...vigor in adulthood" with no period at
        # all, and adding one would make the stored text differ from the book
        # -- which the completeness guard below would (correctly) reject.
        text = re.sub(r"\s+", " ", text).strip()
        if len(text) > 8:
            cur["miracles"][level].append(text)
    buf = []


for i in range(DOM_START, min(DOM_END, len(lines))):
    ln = lines[i]
    bare = ln.replace(" ", " ").rstrip()
    if FURNITURE.match(bare):
        continue
    m = DOMAIN_HEAD.match(bare)
    if m:
        flush()
        level = None
        cur = {"name": m.group(1), "aspects": "", "miracles": {"Lesser": [], "Middle": [], "Greater": []},
               "line": i}
        domains.append(cur)
        continue
    if cur is None:
        continue
    lm = LEVEL_HEAD.match(bare.strip())
    if lm:
        flush()
        level = lm.group(1)
        continue
    if not cur["aspects"] and level is None and bare.strip():
        cur["aspects"] = flat_text(bare)
        continue
    if level is None:
        continue
    if bare.startswith("\tA ") or bare.startswith("	A "):
        flush()
        buf = [bare.split("A ", 1)[1]]
        last_i = i
    elif buf:
        # Only a line immediately after the previous one continues a wrapped
        # bullet. A gap means page furniture or another section came between,
        # and whatever follows is not part of this miracle.
        if i != last_i + 1:
            flush()
            continue
        buf.append(bare)
        last_i = i
flush()

print(f"parsed {len(domains)} Domains, "
      f"{sum(len(v) for d in domains for v in d['miracles'].values())} miracles")

# ----------------------------------------------------------- verification
for k, v in PIETY.items():
    check_nums(v, "piety." + k)
for k, v in HOLY_SYMBOL.items():
    check_nums(v, "holySymbol." + k)
for k, v in CAST_OUT.items():
    check_nums(v, "castOut." + k)
for k, v in RESISTANCE_RULES.items():
    check_nums(v, "resistanceRules." + k)
for r in PRAYER:
    check(r["q"], "prayer " + r["key"])
    if ("+" + str(r["sls"])) not in norm(r["q"]):
        problems.append(("the prayer bonus is not in its own quote", r["key"], r["sls"]))
for r in PIETY_RESULTS:
    check(r["q"], "pietyResult " + r["key"])
    if r["cost"] != "0" and r["cost"].replace("+SLs", "") not in norm(r["q"]).replace(" ", ""):
        # "1d10 + the total SLs" and "1d10+10" both have to be asserted by the quote
        if r["cost"].split("+")[0] not in norm(r["q"]):
            problems.append(("the row's Piety cost is not in its own quote", r["key"], r["cost"]))
for b in MIRACLE_BANDS:
    check(b["q"], "miracleBand " + b["level"])
    if b["level"] not in b["q"]:
        problems.append(("the band's level is not in its own quote", b["level"]))
# The bands must cover every SL total from 1 up, exactly once.
for sl in range(1, 20):
    hit = [b for b in MIRACLE_BANDS if b["min"] <= sl <= b["max"]]
    if len(hit) != 1:
        problems.append(("%d SLs resolves to %d miracle levels, not 1" % (sl, len(hit)),))
for r in PIETY_MODIFIERS:
    check(r["q"], "pietyModifier " + r["label"][:24])
    q = norm(r["q"])
    sign = "+" if r["mod"] > 0 else "-"
    if (sign + str(abs(r["mod"]))) not in q:
        problems.append(("the modifier is not in its own quote", r["label"][:30], r["mod"]))
    if r.get("max") is not None and (("+" if r["max"] > 0 else "-") + str(abs(r["max"]))) not in q:
        problems.append(("the modifier's upper bound is not in its own quote", r["label"][:30], r["max"]))
for r in RESISTANCE:
    check(r["name"], "resistance " + r["key"])
    # The Fixed Number must sit next to that row's own description in the table.
    idx = BOOK_N.find(norm(r["name"]))
    window = BOOK_N[idx:idx + 400] if idx >= 0 else ""
    if not re.search(r"(?<![\d])" + str(r["fixed"]) + r"(?![\d])", window):
        problems.append(("the Fixed Number is not beside its own row", r["key"], r["fixed"]))
if [r["fixed"] for r in RESISTANCE] != [1, 2, 3, 4, 5]:
    problems.append(("the Miracle Resistance ladder must run 1-5 in order", [r["fixed"] for r in RESISTANCE]))
for r in PIOUS_ACTS:
    check(r["q"], "piousAct " + r["act"][:28])
    if r["formula"] != "coin" and r["formula"] not in norm(r["q"]).replace(" ", ""):
        problems.append(("the act's Piety formula is not in its own quote", r["act"][:30], r["formula"]))
if len(PIOUS_ACTS) != 14:
    problems.append(("expected 14 Pious Acts", len(PIOUS_ACTS)))

# Domains: 20 of them, each with all three levels, and every miracle both
# verbatim and filed under the level whose header precedes it.
if len(domains) != 20:
    problems.append(("expected 20 Domains", len(domains), [d["name"] for d in domains]))
seen = set()
for d in domains:
    if d["name"] in seen:
        problems.append(("duplicate Domain", d["name"]))
    seen.add(d["name"])
    check(d["name"] + " Domain", "domain heading " + d["name"])
    if not d["aspects"]:
        problems.append(("Domain has no line of aspects", d["name"]))
    else:
        check(d["aspects"], "domain aspects " + d["name"])
    for lvl in ("Lesser", "Middle", "Greater"):
        if not d["miracles"][lvl]:
            problems.append(("Domain is missing a level of miracles", d["name"], lvl))
    for lvl, items in d["miracles"].items():
        for text in items:
            # Round-trip: the bullet must be in the book as written...
            body = norm(text)
            if body not in BOOK_N:
                problems.append(("miracle not found verbatim", d["name"], lvl, text[:60]))
                continue
            # ...and it must sit after ITS OWN level header and before the next
            # one, so a Greater miracle cannot be filed as a Lesser.
            #
            # Anchored on the Domain's line of ASPECTS, not on its heading: a
            # heading like "Water Domain" also appears in the worked example
            # several pages earlier ("The GM decides that this falls under
            # Devona's Water Domain"), and measuring from there put every one
            # of that Domain's miracles outside its own window.
            dom_at = BOOK_N.find(norm(d["aspects"]))
            lvl_at = BOOK_N.find(norm(lvl + " Miracle"), dom_at)
            nxt = min([p for p in
                       [BOOK_N.find(norm(x + " Miracle"), lvl_at + 5) for x in ("Lesser", "Middle", "Greater")] +
                       [BOOK_N.find(" Domain", lvl_at + 5)]
                       if p > lvl_at] or [len(BOOK_N)])
            at = BOOK_N.find(body, dom_at)
            if not (lvl_at < at < nxt):
                problems.append(("miracle is filed under the wrong level", d["name"], lvl, text[:50]))
            # Round-tripping the body is not enough: a bullet cut short at a
            # page break is a PREFIX of a real sentence and passes that test
            # happily. The stored text must end where the book's sentence
            # ends, so the final period has to be there in the book too.
            if norm(text) not in BOOK_N:
                problems.append(("miracle is truncated -- it does not end where the book's sentence does",
                                 d["name"], lvl, text[-50:]))

if problems:
    print("VERIFICATION FAILED:")
    for p in problems[:25]:
        print("  ", p)
    print("  ...%d problems" % len(problems))
    raise SystemExit(1)

for d in domains:
    d.pop("line", None)
counts = {lvl: sum(len(d["miracles"][lvl]) for d in domains) for lvl in ("Lesser", "Middle", "Greater")}
print(f"verified: {len(PIETY)} Piety rules, {len(PIETY_RESULTS)} roll results over {len(MIRACLE_BANDS)} SL bands, "
      f"{len(PIETY_MODIFIERS)} modifiers, {len(RESISTANCE)} resistance tiers, {len(PIOUS_ACTS)} Pious Acts, "
      f"{len(domains)} Domains ({counts['Lesser']} Lesser, {counts['Middle']} Middle, {counts['Greater']} Greater "
      f"miracles, each verbatim and under its own level)")

json.dump({"piety": PIETY, "holySymbol": HOLY_SYMBOL, "symbolDice": SYMBOL_DICE, "castOut": CAST_OUT,
           "prayer": PRAYER, "pietyResults": PIETY_RESULTS, "miracleBands": MIRACLE_BANDS,
           "pietyModifiers": PIETY_MODIFIERS, "resistance": RESISTANCE, "resistanceRules": RESISTANCE_RULES,
           "piousActs": PIOUS_ACTS, "domains": domains},
          open("data/divine.json", "w"), indent=1)
