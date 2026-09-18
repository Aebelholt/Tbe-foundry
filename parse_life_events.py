"""Extract the three Life Events tables (Ch.7 p.91-101) with their mechanical
bonuses, so TBE: Character Wizard can APPLY them instead of only naming them.

Until now data/chargen.json carried each event's range and name only, and the
wizard told the player to "look it up and apply its bonus by hand from the
book". That was the single biggest remaining gap in chargen.

Each row reads:
    01-02 Child of Revolt. <prose and questions> Add +10 to Protocol or
    Common Lore.
The trailing clause is the mechanical part. Observed forms:
    Add +10 to A or B.
    Add +10 to A, or gain <thing>-wise, or take +1 Status.
    Add +10 to A, B, or C.
Every option becomes a structured choice the wizard can render as a dropdown.

Run: python3 parse_life_events.py   (writes data/life_events.json, exits
non-zero if verification fails)
"""
import json, re

SRC = "/tmp/tbe.txt"

# Table bounds, located by their first row ("01-02 <Name>.") and the start of
# whatever follows. Recent runs to the end of the chapter's tables.
TABLES = [("origin", 5987, 6326), ("youth", 6326, 6694), ("recent", 6694, 7130)]

SKILLS = {
    "Combat": ["Dodge", "Melee: Light", "Melee: Medium", "Melee: Heavy", "Might", "Missile", "Thrown"],
    "Adventuring": ["Athletics", "Endurance", "Locks & Traps", "Perception", "Ride", "Sail/Boat",
                    "Sleight of Hand", "Stealth", "Survival", "Track", "Willpower"],
    "Social": ["Deceive", "Insight", "Inspire", "Intimidate", "Perform", "Persuade", "Protocol", "Seduce", "Wit"],
    "Lore": ["Ancient Lore", "Arcana", "Commerce", "Common Lore", "Craft: Artistic", "Craft: Practical",
             "Divinity", "Heal", "Naturewise", "Streetwise"],
}
ALL_SKILLS = [s for v in SKILLS.values() for s in v]
GROUP_OF = {s: g for g, v in SKILLS.items() for s in v}

lines = open(SRC, encoding="utf-8").read().split("\n")


def prep(a, b):
    """One flat string per table: de-hyphenate wraps, collapse newlines, and
    repair the PDF's kerning artifacts, which split short words across a
    space ("Add +10 t o Ride", "Survival o r Track"). Twelve of the 149 rows
    are unparseable without this."""
    t = "\n".join(lines[a:b])
    t = re.sub(r"(\w)[-‐]\s*\n\s*(\w)", r"\1\2", t)
    t = re.sub(r"\s*\n\s*", " ", t)
    t = re.sub(r"\bt\s+o\b", "to", t)
    t = re.sub(r"\bo\s+r\b", "or", t)
    t = re.sub(r"\ba\s+nd\b", "and", t)
    return re.sub(r"\s{2,}", " ", t)


CATEGORY_WORDS = {"combat": "Combat", "adventuring": "Adventuring", "social": "Social", "lore": "Lore"}


STRAND_CANON = {"beasts": "Beast", "plants": "Plant"}


def canon_strand(name):
    """The Life Event tables write "Plants"/"Beasts"; Ch.14 names the Strands
    "Plant"/"Beast". Fold to the Ch.14 spelling so the granted Strand matches
    a real Strand rather than creating a second, near-identical one."""
    return STRAND_CANON.get(name.strip().lower(), name.strip())


def strand_amount(part):
    """Every Strand grant in these tables is written "add +N to Strand: X".
    Read N rather than assuming; verified below to always be present."""
    m = re.search(r"\+\s*(\d+)\s*to\s+(?:a\s+)?Strand", part, re.I)
    return int(m.group(1)) if m else 0


def _one_option(part):
    """Classify a single option fragment into something the wizard can apply."""
    part = part.strip(" .,;")
    if not part:
        return None
    orig = part
    # Strip a leading "+N to" first: several shape tests below anchor on the
    # start of the fragment, and would miss "+10 to Melee (Light, Medium...)".
    lead = re.match(r"\+?(\d+)\s*to\s+(.*)$", part, re.I | re.S)
    amt_prefix = 10
    if lead:
        amt_prefix, part = int(lead.group(1)), lead.group(2).strip()
    low = part.lower()

    m = re.search(r"take\s*\+(\d+)\s*Status", part, re.I)
    if m:
        return {"kind": "status", "amount": int(m.group(1)), "label": "+%s Status" % m.group(1)}

    # "+10 to Piety" only applies to a Godbound; the book always pairs it with
    # an "otherwise" branch, which arrives as its own fragment.
    if re.search(r"\bPiety\b", part, re.I):
        return {"kind": "piety", "amount": 10, "label": "+10 Piety (Godbound only)"}

    m = re.search(r"Bind:\s*([A-Z]\w+)", part)
    if m:
        return {"kind": "bind", "name": m.group(1), "amount": amt_prefix,
                "label": "+%d Bind: %s" % (amt_prefix, m.group(1))}
    if re.search(r"\ba Bind skill of your choice", part, re.I):
        return {"kind": "bind", "name": None, "amount": 10, "label": "+10 to a Bind of your choice (Spellweaver)"}

    m = re.search(r"Strand\s*:?\s*([A-Z]\w+)", part)
    if m:
        amt = strand_amount(orig) or amt_prefix
        return {"kind": "strand", "name": canon_strand(m.group(1)), "amount": amt,
                "label": "+%d to Strand: %s" % (amt, canon_strand(m.group(1)))}
    if re.search(r"\ba Strand of your choice", part, re.I):
        amt = strand_amount(orig) or amt_prefix
        return {"kind": "strand", "name": None, "amount": amt,
                "label": "+%d to a Strand of your choice (Spellweaver)" % amt}

    m = re.search(r"([A-Z][\w'’: -]*?-wise)", part)
    if m:
        nm = m.group(1).strip()
        return {"kind": "wise", "name": nm, "value": 20, "label": "gain %s at 20" % nm}

    # "Melee (Light, Medium, or Heavy)" -> one pick among those three
    if re.match(r"Melee\s*\(", part, re.I):
        return {"kind": "skill-any", "options": ["Melee: Light", "Melee: Medium", "Melee: Heavy"],
                "amount": amt_prefix, "label": "+%d to Melee: Light, Medium or Heavy" % amt_prefix}

    # "any Combat skill" / "one Combat skill"
    m = re.search(r"\b(?:any|one)\s+(combat|adventuring|social|lore)\s+skill", low)
    if m:
        cat = CATEGORY_WORDS[m.group(1)]
        return {"kind": "skill-any", "options": SKILLS[cat], "amount": amt_prefix,
                "label": "+%d to any %s skill" % (amt_prefix, cat)}
    if re.search(r"\ba skill of your choice", low):
        return {"kind": "skill-any", "options": ALL_SKILLS, "amount": amt_prefix, "label": "+%d to any skill" % amt_prefix}

    amt = amt_prefix
    hit = next((sk for sk in sorted(ALL_SKILLS, key=len, reverse=True)
                if re.fullmatch(re.escape(sk), part, re.I) or part.lower().startswith(sk.lower())), None)
    if not hit:
        # Last resort for the PDF's kerning ("C ommon Lore"): compare with all
        # spaces removed before giving up.
        squash = re.sub(r"\s+", "", part).lower()
        hit = next((sk for sk in sorted(ALL_SKILLS, key=len, reverse=True)
                    if squash.startswith(re.sub(r"\s+", "", sk).lower())), None)
    if hit:
        return {"kind": "skill", "name": hit, "group": GROUP_OF[hit], "amount": amt,
                "label": "+%d %s" % (amt, hit)}
    return {"kind": "other", "label": part}


def parse_options(clause):
    """Turn a bonus clause into structured, pickable choices.

    Handles the book's four shapes:
      "+10 to A or B"
      "+10 to A, or gain X-wise, or take +1 Status"
      "+10 to Melee (Light, Medium, or Heavy)"     <- parentheses stay whole
      "...Bind: Control; if not, add +10 to Willpower"  <- conditional, both
                                                          branches offered
    """
    # protect parenthesised lists from the splitter
    holds = []
    def hold(m):
        holds.append(m.group(0))
        return "\x00%d\x00" % (len(holds) - 1)
    clause = re.sub(r"\([^()]*\)", hold, clause)

    # a conditional reads "<magic branch>; otherwise|if not, add +10 to <plain>"
    parts = re.split(r";\s*(?:otherwise|if not)\s*,?\s*(?:add\s*)?|,\s*or\s+|\s+or\s+|,\s+(?=gain|take)", clause)
    out = []
    for part in parts:
        for i, h in enumerate(holds):
            part = part.replace("\x00%d\x00" % i, h)
        o = _one_option(part)
        if o and not (o["kind"] == "other" and len(o["label"]) > 60):
            out.append(o)
    return out


events, unparsed = {}, []
for key, a, b in TABLES:
    text = prep(a, b)
    rows = list(re.finditer(r"(\d{2}[–-]\d{2})\s+([A-Z][^.]{2,60})\.", text))
    # The Recent table ends with two single-value rows rather than ranges
    # ("99 Haunted.", "100 Forgotten Past."). A bare \d{2,3} pattern picks up
    # page furniture instead, so find them explicitly, after the last range row.
    if key == "recent" and rows:
        tail = rows[-1].end()
        for face in ("99", "100"):
            m = re.search(r"(?<!\d)" + face + r"\s+([A-Z][^.]{2,60})\.", text[tail:])
            if m:
                rows.append(re.match(r"()()", ""))          # placeholder, replaced below
                rows[-1] = type("R", (), {
                    "group": staticmethod(lambda n, f=face, mm=m: f if n == 1 else mm.group(1)),
                    "end": staticmethod(lambda mm=m, t=tail: t + mm.end()),
                    "start": staticmethod(lambda mm=m, t=tail: t + mm.start()),
                })()
    got = []
    for i, r in enumerate(rows):
        body = text[r.end(): rows[i + 1].start() if i + 1 < len(rows) else len(text)]
        # The last row of each table runs into the following section; cut at
        # the page footer / next chapter heading.
        body = re.split(r"Life Event:\s*(?:Origin|Youth|Recent)|\d\)\s*select a previous career|\d\)\s*roll for life events", body)[0].strip()
        rng = r.group(1).replace("–", "-")
        if rng == "100":
            rng = "00"
        name = r.group(2).strip()
        m = re.search(r"Add\s*(\+?\d+\s*to\s+.*?)\s*$", body, re.I | re.S)
        opts = parse_options(m.group(1)) if m else []
        desc = body[: m.start()].strip() if m else body
        if not opts:
            unparsed.append((key, rng, name, body[-90:]))
        got.append({"range": rng, "name": name, "desc": desc, "options": opts})
    events[key] = got

print("parsed:", {k: len(v) for k, v in events.items()})

# The Ch.14 names, read from the verified magic extract rather than retyped,
# so a Life Event can never grant a Strand or Bind that does not exist.
try:
    _magic = json.load(open("data/magic.json"))
    STRAND_NAMES = {x["name"] for x in _magic["strands"]}
    BIND_NAMES = {x["name"] for x in _magic["binds"]}
except Exception:      # parse_magic.py has not been run yet
    STRAND_NAMES = BIND_NAMES = None

# ---- verification -----------------------------------------------------------
flat = re.sub(r"\s+", " ", open(SRC, encoding="utf-8").read())
problems = []
for key, rows in events.items():
    if not 45 <= len(rows) <= 55:
        problems.append(("row count out of range", key, len(rows)))
    seen = set()
    for e in rows:
        if e["name"] in seen:
            problems.append(("duplicate name", key, e["name"]))
        seen.add(e["name"])
        if re.sub(r"\s+", " ", e["name"]) not in flat:
            problems.append(("name not found verbatim", key, e["name"]))
        for o in e["options"]:
            if o["kind"] == "skill" and o["name"] not in ALL_SKILLS:
                problems.append(("unknown skill", key, e["name"], o["name"]))
            # A Bind or Strand grant that carries no amount is the defect this
            # parser shipped for a release: the wizard granted "a Strand" with
            # no level, so the book's +2 silently became +1 (or nothing).
            if o["kind"] in ("bind", "strand") and not o.get("amount"):
                problems.append(("magic grant with no amount", key, e["name"], o["label"]))
            if STRAND_NAMES and o["kind"] == "strand" and o.get("name") and o["name"] not in STRAND_NAMES:
                problems.append(("unknown Strand", key, e["name"], o["name"]))
            if BIND_NAMES and o["kind"] == "bind" and o.get("name") and o["name"] not in BIND_NAMES:
                problems.append(("unknown Bind", key, e["name"], o["name"]))
leftover = [(k, e["name"], o["label"]) for k, rows in events.items() for e in rows
            for o in e["options"] if o["kind"] == "other"]
if leftover:
    problems.append(("unclassified option fragments", leftover[:10]))
if unparsed:
    problems.append(("rows with no parsed option", [(k, r, n) for k, r, n, _ in unparsed]))

# every d100 face 1..100 must be covered exactly once per table
for key, rows in events.items():
    cover = {}
    for e in rows:
        if "-" in e["range"]:
            lo, hi = e["range"].split("-")
            lo, hi = int(lo), (100 if hi == "00" else int(hi))
        else:
            lo = hi = 100 if e["range"] == "00" else int(e["range"])
        for n in range(lo, hi + 1):
            cover.setdefault(n, []).append(e["name"])
    missing = [n for n in range(1, 101) if n not in cover]
    dupes = {n: v for n, v in cover.items() if len(v) > 1}
    if missing:
        problems.append(("d100 faces uncovered", key, missing[:12]))
    if dupes:
        problems.append(("d100 faces covered twice", key, list(dupes)[:12]))

if problems:
    print("VERIFICATION FAILED:")
    for p in problems:
        print("  ", p)
    raise SystemExit(1)

total = sum(len(v) for v in events.values())
withopts = sum(1 for v in events.values() for e in v if e["options"])
print(f"verified: {total} Life Events, {withopts} carry mechanical options, "
      f"all names verbatim, all three d100 tables fully covered")
json.dump(events, open("data/life_events.json", "w"), indent=1)
