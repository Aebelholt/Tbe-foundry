import re, json

RAW = open("/tmp/tbe.txt", encoding="utf-8").read().split("\n")
SEG = RAW[31560:34690]
DIFFS = ("Easy", "Medium", "Challenging", "Hard", "Severe", "Extreme")

# ---- page furniture ------------------------------------------------------
# The flattened PDF puts each printed page number on a line of its own. Those
# lines sit between a creature's last ability and the next creature's name,
# and the ability text used to absorb them: 20 of the 56 keeper notes shipped
# ending "...Death Threshold 15. 446" and a GM saw the page number on the
# card. Round-tripping cannot catch it -- the number IS in the book.
#
# A bare three-digit line is not always furniture (one creature's Endurance is
# 105), so the rule is the sequence, not the shape: page numbers run strictly
# +1 through the chapter. Anything that breaks the run is data.
def _page_number_lines(seg):
    hits, last = set(), None
    for i, line in enumerate(seg):
        t = line.strip()
        if not re.fullmatch(r"\d{3}", t):
            continue
        n = int(t)
        if last is None or n == last + 1:
            hits.add(i)
            last = n
    return hits

PAGE_LINES = _page_number_lines(SEG)
if not (30 <= len(PAGE_LINES) <= 40):
    raise SystemExit("expected ~34 page-number lines in the bestiary, found %d" % len(PAGE_LINES))
SEG = ["" if i in PAGE_LINES else l for i, l in enumerate(SEG)]

def clean(s):
    s = s.replace("’", "'").replace("–", "-").replace("—", "-").replace("\xa0", " ")
    return re.sub(r"\s+", " ", s).strip()

# locate creature starts
starts = []
for i, l in enumerate(SEG):
    if l.strip() in DIFFS:
        # name is the nearest non-empty line above that is not a page number or running head
        j = i - 1
        name_parts = []
        while j >= 0 and len(name_parts) < 4:
            cand = SEG[j].strip()
            if cand and not re.fullmatch(r"\d+", cand) and cand.lower() != "chapter 18: bestiary":
                name_parts.insert(0, cand)
                joined = " ".join(name_parts)
                # A name printed across lines with its native term in
                # parentheses -- "Brutesworn (" / "Brakk-Thuun" / ")" -- is
                # only complete once the parens balance. Stopping at the first
                # line that neither starts with ")" nor ends with "(" kept just
                # "Brakk-Thuun)" and "Skarn)", losing "Brutesworn" and "Orc
                # Chieftain" entirely (found by playing, fixed v0.28.0).
                if joined.count("(") == joined.count(")") \
                   and not joined.rstrip().endswith("("):
                    break
            j -= 1
        name = clean(" ".join(name_parts))
        name = re.sub(r"\s+\)", ")", name)
        name = re.sub(r"\(\s+", "(", name)
        starts.append((i, name, SEG[i].strip()))

creatures = []
fero_problems = []

for idx, (line_i, name, difficulty) in enumerate(starts):
    end = starts[idx + 1][0] - 1 if idx + 1 < len(starts) else len(SEG)
    raw_block = "\n".join(SEG[line_i + 1:end])
    # a line ending in a number followed by a capitalised line is a section boundary
    raw_block = re.sub(r"(\d)\s*\n\s*(?=[A-Z])", r"\1 @@ ", raw_block)
    body = clean(raw_block)
    body = re.sub(r"\bchapter 18: bestiary\b", " ", body)
    body = re.sub(r"\s{2,}", " ", body)

    # The Move value can carry a footnote marker -- "Move 2\u2020" (can fly),
    # "Move 2*" (see the entry), "Move X*" (Summoned Creature, variable). The
    # old [\d/]* stopped dead at the marker, the following \s* could not cross
    # it either, and because the Ferocity group is optional the whole match
    # still SUCCEEDED with Ferocity empty. Five creatures shipped with no
    # Ferocity at all -- the Dragon and the Roc among them -- while the book
    # plainly prints one, and nothing failed, because a blank optional group is
    # indistinguishable from a creature that genuinely has no Ferocity.
    # Size carries markers for the same reason, so it tolerates one too.
    m = re.search(r"Size\s+([^\s\u2020*\u2021]+)[\u2020*\u2021]?\s+Init\s+([\d/]+)"
                  r"\s+Move\s*([\dX/]*)\s*[\u2020*\u2021]?\s*(?:Ferocity\s*(\d+))?", body)
    if not m:
        continue
    size, init, move, fero = m.group(1), m.group(2), m.group(3) or "", m.group(4) or ""
    # Check against THIS creature's own block, not the whole book: a name-anchored
    # search across 5000 characters happily walks into the next creature's stat
    # line and compares the wrong numbers. The block is already isolated here.
    _stat_line = body[m.start():m.start() + 120]
    _printed = re.search(r"Ferocity\s*(\d+)", _stat_line)
    if _printed and _printed.group(1) != fero:
        fero_problems.append((name, "book " + _printed.group(1), "got " + repr(fero)))
    desc = clean(body[:m.start()]).replace("@@", " ").strip()
    rest = body[m.end():]

    mt = re.search(r"Toughness\s*([+\-]?\d+|-)\s*Death\s*Threshold\s*(\d+)", rest)
    toughness = mt.group(1) if mt else ""
    dt = mt.group(2) if mt else ""
    abilities = clean(rest[mt.end():]) if mt else ""
    stats_region = rest[: mt.start()] if mt else rest

    # armour grid: "1-5 Body 3+3 AP 8 R Leg 1+3 AP"
    armour = []
    for am in re.finditer(r"(Body|R\s*Arm|L\s*Arm|R\s*Leg|L\s*Leg|Head)\s+(\d+)(?:\+(\d+))?\s*AP", stats_region):
        loc = re.sub(r"\s+", " ", am.group(1))
        armour.append({"loc": loc, "natural": am.group(2), "worn": am.group(3) or ""})
    grid_start = None
    gm = re.search(r"\b1\s*-\s*\d\s+(?:Body|Torso|Head)\b|\b1\s+(?:Body|Torso|Head)\b", stats_region)
    if gm:
        grid_start = gm.start()
    skills_attacks = stats_region[:grid_start] if grid_start is not None else stats_region
    grid_text = clean(stats_region[grid_start:]) if grid_start is not None else ""

    # Walk comma-separated tokens: "Name NN" pairs are skills until a weapon entry starts.
    skills_attacks = re.sub(r"^\s*@@\s*", "", skills_attacks)

    # Split skills from attacks: prefer the line-boundary marker, else the first weapon header.
    if "@@" in skills_attacks:
        head, _, tail = skills_attacks.partition("@@")
    else:
        hm = re.search(r"(?:^|,|\)|\d)\s*([A-Z][A-Za-z'\-/ ]{1,24})\s+\d{1,3}\s*(?:Ex\d)?\s*,\s*(?:Parry|Reach|Dmg|Thrown)", skills_attacks)
        cut = hm.start(1) if hm else len(skills_attacks)
        head, tail = skills_attacks[:cut], skills_attacks[cut:]
    head = head.replace("@@", " ")
    attack_text = tail.replace("@@", " ").strip(" ,")

    head = re.sub(r"(\d)\s+(\d)\b", r"\1\2", head)
    NOT_SKILLS = {"ferocity", "init", "move", "size", "range", "reach", "parry", "dmg", "ap", "toughness"}
    skills = []
    for sm2 in re.finditer(r"([A-Z][A-Za-z'\-:/ ]{1,22}?)\s+(\d{1,3})(?:\s+Ex(\d))?\s*(?=,|$)", head):
        sname = clean(sm2.group(1)).strip(" ,*\u2020\u2021")
        parts = sname.split(" ")
        keep = []
        for w in reversed(parts):
            if w[:1].isupper():
                keep.insert(0, w)
            else:
                break
        sname = " ".join(keep) if keep else sname
        if not sname or sname.lower() in NOT_SKILLS:
            continue
        entry = {"name": sname, "value": int(sm2.group(2))}
        if sm2.group(3):
            entry["ex"] = int(sm2.group(3))
        skills.append(entry)

    attacks = []
    heads = [h.start() for h in re.finditer(
        r"(?:(?<=\))|(?<=\d)|^)\s*(?=[A-Z][A-Za-z'\-/ ]{1,24}\s+\d{1,3}\s*(?:Ex\d)?\s*,\s*(?:Parry|Reach|Dmg|Thrown))", attack_text)]
    for a, b in zip(heads, heads[1:] + [len(attack_text)]):
        part = clean(attack_text[a:b])
        if "Dmg" in part:
            attacks.append(part)
    if not attacks and "Dmg" in attack_text:
        attacks.append(clean(attack_text))

    creatures.append({
        "name": name, "difficulty": difficulty, "desc": desc,
        "size": size, "init": init, "move": move, "ferocity": fero,
        "skills": skills, "attacks": attacks, "armour": armour, "grid": grid_text.replace("@@", " ").strip(),
        "raw": clean(body).replace("@@", " "), "toughness": toughness, "dt": dt, "abilities": abilities.replace("@@", " ").strip()
    })

# dedupe by name, keep the richest entry
best = {}
for c in creatures:
    prev = best.get(c["name"])
    score = len(c["skills"]) + len(c["attacks"]) + (1 if c["dt"] else 0)
    if not prev or score > prev[0]:
        best[c["name"]] = (score, c)
out = [v[1] for v in best.values()]
out.sort(key=lambda c: c["name"])

# ---- guards --------------------------------------------------------------
# Both of these refuse a shape the book never prints, so reverting either fix
# above fails here instead of shipping.
furniture = [(c["name"], f) for c in out for f in ("abilities", "desc", "raw")
             if re.search(r"\s\d{3}\s*$", c[f] or "")]
if furniture:
    raise SystemExit("page number absorbed into creature text: %s" % furniture[:5])

unbalanced = [c["name"] for c in out
              if c["name"].count("(") != c["name"].count(")")]
if unbalanced:
    raise SystemExit("creature name with unbalanced parentheses (a multi-line "
                     "name was cut short): %s" % unbalanced)

if fero_problems:
    raise SystemExit("Ferocity printed in a creature's own stat line but not captured: %s"
                     % fero_problems)
print("ferocity verified in-block for all %d creatures" % len(out))

json.dump(out, open("bestiary.json", "w"), indent=1)
print(len(out), "creatures")
missing = [c["name"] for c in out if not c["dt"] or not c["skills"] or not c["attacks"]]
print("incomplete:", missing)
for c in out[:3]:
    print("\n===", c["name"], c["difficulty"], "| Size", c["size"], "Init", c["init"], "Move", c["move"], "Fero", c["ferocity"],
          "| Tough", c["toughness"], "DT", c["dt"])
    print("  skills:", [(s["name"], s["value"]) for s in c["skills"]])
    print("  attacks:", c["attacks"])
    print("  armour:", c["armour"])
    print("  abilities:", c["abilities"][:160])
