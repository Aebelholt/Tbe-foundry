"""Extract Talents from the TBE rulebook text dump.

Entries read `NAME - description`, name in caps. Sub-talents (talents that
extend another) carry a marker glyph. The source is a PDF text dump, so it
carries hard line wraps, mid-word hyphenation and page furniture.
"""
import json, re

SECTIONS = [
    ("Combat",        2968, 3389),
    ("Adventuring",   3389, 3471),
    ("Social",        3471, 3597),
    ("Lore",          3597, 3755),
    ("Magic",         3755, 3882),
    ("Miscellaneous", 3882, 3944),
    ("Non-Human",     3944, 4107),
]

lines = open("/tmp/tbe.txt", encoding="utf-8").read().split("\n")

FURNITURE = re.compile(r"^\s*(\d{1,3}|chapter \d+: .*|Chapter \d+ - .*)\s*$", re.I)
# "!" and "…" belong in the class: two real Talents end that way
# ("RUN FOR YOUR LIFE!", "ALLOW ME TO INTRODUCE…") and were silently
# dropped by every earlier run of this parser.
# A Talent name may OPEN with punctuation, not just end with it. The book has
# one that does: “…BUT IT IS NOT THIS DAY!”. Requiring [A-Z] as the very first
# character meant the match was never attempted there (the lookbehind also
# fails one character later, because the char before "BUT" is "…" rather than
# whitespace), so the whole Talent was swallowed into the description of the
# entry above it, Anti-Venom Blood -- which then also inherited that Talent's
# "can be purchased up to three times" and was mis-ranked because of it.
# One missing character class, two wrong rows.
HEADER = re.compile(r"(^|(?<=[\s»]))(✢\s*)?([“\"'‘’«…]*[A-Z][A-Z0-9 &'’“”\"(),.\-/!…?]{2,44}?)\s*[-–—]\s+")
# Unit abbreviations that trail the PREVIOUS sentence and get glued to a name.
JUNK_PREFIX = re.compile(r"^(SL|ENC|XP|SP|AP|DoS|WP)[)\]]*\.\s*", re.I)

# Some repeatability is stated ONCE, above a run of Talents it governs, rather
# than inside each of their descriptions:
#
#     WRESTLER - ... Can be purchased once.
#     Each of the following can be purchased up to 3 times:
#     SHIELD ARM - ...
#     SLIPPERY - ...
#     ...
#
# Read talent-by-talent this sentence lands in the body of the entry ABOVE it,
# so it did two things wrong at once: Wrestler inherited "up to 3 times" and
# came out repeatable when the book says once, and the six Talents the sentence
# actually governs had no wording of their own and defaulted to once when the
# book allows three. A single misplaced sentence, over-permitting one Talent
# and under-permitting six -- and the under-permitting half is the same failure
# v0.21.0 shipped a fix for: real XP spent on a purchase that does nothing.
#
# Scope runs from the sentence to the end of its section. The book contains
# exactly one of these today and the self-check below pins that count, so a
# second one appearing (or this one being reworded) fails the build rather
# than silently re-mis-ranking a group.
GROUP_RANK = re.compile(r"Each of the following can be purchased up to (\w+) times\s*:", re.I)
# "Can be purchased once." stated in a Talent's OWN body outranks any group
# sentence above it -- that is exactly Wrestler's case.
EXPLICIT_ONCE = re.compile(r"purchased once\b", re.I)

def clean(block):
    t = "\n".join(block)
    t = re.sub(r"(\w)[-‐]\s*\n\s*(\w)", r"\1\2", t)   # de-hyphenate wraps
    t = re.sub(r"\s*\n\s*", " ", t)
    return re.sub(r"\s{2,}", " ", t).strip()

ROMAN = re.compile(r"\b(I{1,3}V?|IV|VI{0,3})\b", re.I)

def tidy(name):
    """Title-case a caps name, keeping roman numerals and possessives right."""
    n = re.sub(r"\s{2,}", " ", name).title().replace("’S ", "'s ")
    # Title() lowercases roman numerals ("I-Iv"); restore them.
    n = re.sub(r"\b([IiVv]{1,4})\b", lambda m: m.group(1).upper(), n)
    return n


def rank_of(desc, name=""):
    """How many times a Talent may be taken.

    Anything that is not "once" is treated as repeatable downstream, so a
    false "once" silently locks a player out of a Talent the book lets them
    buy again. The book phrases repeatability at least six different ways,
    and the original patterns caught only two of them, which is how Armor
    Training, Enhanced Defense, Shield Beat, Inner Strength and Unkillable
    all ended up locked. Each branch below quotes the wording it exists for.
    """
    # "(I-IV)" appears in the NAME, not the description, for Armor Training.
    if re.search(r"\(\s*I-\s*(II|III|IV)\s*\)", name + " " + desc):
        return "levelled"
    # "he would have to acquire this Talent again (Armor Training IV)"
    if re.search(r"acquire this Talent again", desc, re.I):
        return "levelled"
    # ORDER MATTERS HERE. An explicit purchase count is the most specific
    # statement the book makes about how many times a Talent may be bought, so
    # it is asked first. It used to be asked last, behind the "once per X"
    # branch, and the book opens a great many Talents with "Once per session,
    # you can ..." -- a statement about how often the Talent may be USED, not
    # about how often it may be BOUGHT. Ten Talents that say plainly "Can be
    # purchased up to three times" were tagged per-skill on the strength of
    # that opening clause, and RANK_CAP["per-skill"] is 1, so all ten were
    # capped at a single purchase against a book that allows three.
    # "Can be purchased up to three times" / "a maximum of three times"
    m = re.search(r"(?:purchased up to|maximum of) (\w+) times", desc, re.I)
    if m:
        return m.group(1).lower()
    # "purchased once per weapon type" / "purchased once for each Combat skill".
    #
    # The clause must be about PURCHASING. A blacklist of time windows was the
    # obvious fix here and it is the wrong one: the book writes both "once per
    # combat" (a usage window) and "once for each Combat skill" (a purchase
    # axis), so any list that excludes the word "combat" throws away Enhanced
    # Defense along with it. Every genuine axis in this book states the verb --
    # "Can be purchased once per weapon type", "once per shield size", "once
    # per Combat skill" -- and no usage window does. Match on the verb.
    if re.search(r"(?:purchased|taken|acquired|bought)\s+once\s+(?:per|for each)\s+[a-z]",
                 desc, re.I):
        return "per-skill"
    # "Can be purchased multiple times to a maximum Resolve of 30"
    if re.search(r"purchased multiple times", desc, re.I):
        return "multiple"
    return "once"


def rank_for(desc, name, governing):
    """rank_of(), plus any group sentence standing above this Talent.

    The Talent's own wording always wins. A group sentence only fills the gap
    where the Talent says nothing about repeatability at all -- which is the
    normal case for the run it governs, since the whole point of the sentence
    is that they do not each repeat it.
    """
    own = rank_of(desc, name)
    if own != "once":
        return own                      # the Talent stated its own count
    if EXPLICIT_ONCE.search(desc):
        return "once"                   # the Talent explicitly says once
    return governing or "once"


def xp_cost(desc):
    """Post-creation XP cost. p.161: "Most Talents cost 5 XP to purchase.
    More expensive Talents are noted in their descriptions."

    Two Talents are unconditionally 10 XP once play has started (Faded
    Pattern, "If purchased later in play, this Talent costs 10 XP instead
    of 5"; Godbound, "Purchasing this Talent after character creation costs
    10 XP"). Strand Secret is conditional, 5 normally and 10 for a Thin
    Strand, so it stays 5 and carries a note instead of being overstated.
    """
    if re.search(r"costs 10 XP instead of 5|after character cre-?\s*ation costs 10 XP", desc, re.I):
        return 10, ""
    m = re.search(r"\(([^()]{0,40}costs 10 XP)\)", desc, re.I)
    if m:
        return 5, m.group(1).strip()
    return 5, ""


def creation_only(desc):
    """p.164 PATTERNED IN THE WEAVE: "This Talent can only be chosen at
    character creation". Such a Talent must not be purchasable with XP."""
    return bool(re.search(r"can only be (chosen|taken|selected|acquired) at character creation", desc, re.I))


out, dropped, group_sentences_found = [], [], []
for cat, start, end in SECTIONS:
    text = clean([l for l in lines[start:end - 1] if not FURNITURE.match(l)])
    # Where each group-scoping sentence sits, so a Talent can be asked which
    # one (if any) governs it: the last one that opens before its header.
    group_spans = [(g.start(), g.end(), g.group(1).lower()) for g in GROUP_RANK.finditer(text)]
    group_sentences_found.extend(g[2] for g in group_spans)
    hits = list(HEADER.finditer(text))
    for i, m in enumerate(hits):
        name = JUNK_PREFIX.sub("", m.group(3)).strip(" ,-")
        # The next header may open with a unit abbreviation that actually
        # belongs to THIS talent's last sentence ("...costs 10 XP. PATTERNED
        # IN THE WEAVE - ..."). JUNK_PREFIX strips it off the name, but the
        # body used to be cut before it, silently truncating the previous
        # entry's final sentence. Give those characters back.
        if i + 1 < len(hits):
            nxt = hits[i + 1]
            jp = JUNK_PREFIX.match(nxt.group(3))
            stop = nxt.start(3) + (jp.end() if jp else 0)
        else:
            stop = len(text)
        body = text[m.end(): stop].strip()
        # A group sentence that fell inside this body belongs to the Talents
        # BELOW it, never to this one. Take it back out before ranking.
        body = GROUP_RANK.sub("", body).strip()
        governing = next((r for (gs, ge, r) in reversed(group_spans) if gs < m.start()), None)
        if len(name) < 3 or len(body) < 20:
            dropped.append((cat, m.group(3), len(body)))
            continue
        req = re.search(r"Requires? ([^.]{3,120})\.", body)
        out.append({
            "name": tidy(name),
            "_raw": name,
            "category": cat,
            "sub": bool(m.group(2)),
            "requires": req.group(1).strip() if req else "",
            "rank": rank_for(body, name, governing),
            "xp": xp_cost(body)[0],
            "xpNote": xp_cost(body)[1],
            "creationOnly": creation_only(body),
            "desc": body,
        })

print(f"parsed {len(out)} talents ({len(dropped)} rejected)")
for cat, _, _ in SECTIONS:
    print(f"  {cat:14s} {sum(1 for t in out if t['category']==cat)}")
if dropped:
    print("rejected:", dropped[:8])
# ---------------------------------------------------------------------------
# Self-verification. Every other data script in this repo re-checks its rows
# against the book before writing; this one historically did not, and two
# real Talents went missing for months as a result. These checks are cheap
# and they fail loudly.
raw_text = re.sub(r"\s+", " ", open("/tmp/tbe.txt", encoding="utf-8").read())
problems = []

# 1. Round-trip: every parsed name must still be findable in the source.
for t in out:
    if re.sub(r"\s+", " ", t["_raw"]).strip() not in raw_text:
        problems.append(("name not found verbatim", t["name"]))

# 2. Nothing may be dropped. A rejected header is a Talent nobody can take.
if dropped:
    problems.append(("headers rejected", dropped))

# 3. Talents the book explicitly says are repeatable must not come out
#    "once", which is what the macro treats as "lock this row forever".
MUST_REPEAT = [
    "Armor Training", "Enhanced Defense", "Shield Beat",
    "Inner Strength", "Unkillable", "Tough",
]
for want in MUST_REPEAT:
    hit = next((t for t in out if t["name"].lower().startswith(want.lower())), None)
    if hit is None:
        problems.append(("missing entirely", want))
    elif hit["rank"] == "once":
        problems.append(("wrongly marked take-once", want))

# 4. The book names exactly these as costing 10 XP post-creation, and
#    exactly this one as creation-only. If a future parse loses them the
#    macros silently undercharge or let players buy the unbuyable.
TEN_XP = ["Faded Pattern", "Godbound"]
for want in TEN_XP:
    hit = next((t for t in out if t["name"].lower().startswith(want.lower())), None)
    if hit is None:
        problems.append(("missing entirely", want))
    elif hit["xp"] != 10:
        problems.append(("should cost 10 XP post-creation", want))
creation_only_hits = [t["name"] for t in out if t["creationOnly"]]
if "Patterned In The Weave" not in creation_only_hits:
    problems.append(("should be flagged creation-only", "Patterned In The Weave"))

# 5b. The group-scoping sentence. Pinned by count, because a second one
#     appearing (or this one being reworded) would silently re-mis-rank a whole
#     run of Talents the same way it did before, with every other check green.
if len(group_sentences_found) != 1:
    problems.append(("expected exactly one group-rank sentence",
                     f"found {len(group_sentences_found)}: {group_sentences_found}"))

# 5c. The exact rows that sentence got wrong, stated as values not as counts.
#     Wrestler over-permitted, the six it governs under-permitted.
if next((t for t in out if t["name"] == "Wrestler"), {}).get("rank") != "once":
    problems.append(("book says purchased once", "Wrestler"))
for want in ("Shield Arm", "Slippery", "Stable Stance", "Stay Put", "Stay Up", "Strong Grip"):
    hit = next((t for t in out if t["name"] == want), None)
    if hit is None:
        problems.append(("missing entirely", want))
    elif hit["rank"] not in ("3", "three"):
        problems.append(("group sentence says up to 3 times, got " + str(hit["rank"]), want))

# 5d. "Once per session, you can ..." is a usage window, not a purchase axis.
#     These all say plainly "can be purchased up to three times" as well, and
#     were tagged per-skill (cap 1) on the strength of the opening clause.
for want in ("Extra Bandages", "Spyglass", "On Through The Night", "Careful Rationing",
             "Ease Of Passage", "Steely Thews", "I Have Just The Thing", "True Faith",
             "Kingsfoil"):
    hit = next((t for t in out if t["name"] == want), None)
    if hit is None:
        problems.append(("missing entirely", want))
    elif hit["rank"] == "per-skill":
        problems.append(("usage window read as a purchase axis", want))

# 5d-ii. The other direction: a genuine purchase axis must NOT be lost, and a
#        usage window must NOT be read as one. "once per combat" and "once for
#        each Combat skill" differ by the verb, not by the noun.
for want in ("Armor Piercer", "Enhanced Defense", "Powerful Blow", "Quickdraw",
             "Shield Beat", "Precise Strike"):
    hit = next((t for t in out if t["name"] == want), None)
    if hit is None:
        problems.append(("missing entirely", want))
    elif hit["rank"] != "per-skill":
        problems.append(("real purchase axis lost, got " + str(hit["rank"]), want))
for want in ("Catch And Release", "Cloak And Blade", "Devouring Maw"):
    hit = next((t for t in out if t["name"] == want), None)
    if hit is not None and hit["rank"] == "per-skill":
        problems.append(("usage window read as a purchase axis", want))

# 5e. A Talent name may open with punctuation, not only end with it.
if not any(t["name"].upper().startswith(("“…BUT IT IS NOT", "…BUT IT IS NOT")) or
           "BUT IT IS NOT THIS DAY" in t["name"].upper() for t in out):
    problems.append(("missing entirely", "…BUT IT IS NOT THIS DAY!"))
# ...and it must no longer be hiding inside its neighbour.
avb = next((t for t in out if t["name"] == "Anti-Venom Blood"), None)
if avb and "THIS DAY" in avb["desc"].upper():
    problems.append(("still swallowing the next Talent", "Anti-Venom Blood"))
if avb and avb["rank"] != "once":
    problems.append(("inherited its neighbour's purchase count", "Anti-Venom Blood"))

# 5. Talents whose names carry punctuation the header class used to reject.
for want in ("Run For Your Life", "Allow Me To Introduce"):
    if not any(t["name"].lower().startswith(want.lower()) for t in out):
        problems.append(("missing entirely", want))

if problems:
    print("VERIFICATION FAILED:")
    for kind, what in problems:
        print("  ", kind, "->", what)
    raise SystemExit(1)
print(f"verified: {len(out)} talents, all names found verbatim, none dropped")

for t in out:
    t.pop("_raw", None)
json.dump(out, open("/home/claude/tbe-foundry/data/talents.json", "w"), indent=1)
