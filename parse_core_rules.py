"""Extract and verify the core Skill Roll / Combat / Wounds mechanics that
TBE: Skill Roll, TBE: Attack, and TBE: Wounds & Recovery actually compute.

This exists for one purpose: a player-facing Rules Audit journal
(rules_audit.html, built by build_rules_audit.py) that lets a suspicious
player check the macros' math against their own book, chapter and page
number included, without having to trust a "vibe coded" black box.

Same discipline as parse_magic.py: every rule carries the verbatim book
quote it comes from, checked against /tmp/tbe.txt, not hand-asserted. The
page number is NOT hand-typed either -- the source text embeds the book's
own printed page numbers as standalone digit lines at each page break (a
side effect of the PDF-to-text conversion), so `page_of()` derives the page
from the quote's own position in the source, the same way check_range() in
parse_magic.py derives a table row's range from its own quote instead of
trusting a hand-typed number beside it.

Since v0.53.1 nothing in here is a line number. Each quote is found by
searching the whole book and must be printed exactly as many times as the
rule declares; its page is the page marker that FOLLOWS it (a page's number
comes after its text in this dump); that page must fall inside the page
range the book's own contents page gives for the rule's heading; and that
heading must be the nearest contents heading printed above the quote. The
script breaks its own page reading and a quote before writing anything, and
fails if either still passes.

Run: python3 parse_core_rules.py   (writes data/core_rules.json, exits
non-zero on any verification failure)
"""
import bisect
import json
import re

SRC = "/tmp/tbe.txt"
raw = open(SRC, encoding="utf-8").read()
lines = raw.split("\n")
problems = []


def norm(s):
    """Fold the PDF's curly punctuation so a hand-typed quote can match."""
    s = (s.replace("’", "'").replace("‘", "'")
             .replace("“", '"').replace("”", '"')
             .replace("–", "-").replace("—", "-")
             .replace("−", "-").replace(" ", " "))
    return re.sub(r"\s+([,.;:])", r"\1", s)


def flat(a, b):
    """Join lines[a:b] into one normalized-whitespace string, healing the
    PDF's mid-word line-break hyphens."""
    t = "\n".join(lines[a:b])
    t = re.sub(r"(\w)[-‐]\s*\n\s*(\w)", r"\1\2", t)
    t = re.sub(r"\s*\n\s*", " ", t)
    return norm(re.sub(r"\s{2,}", " ", t).strip())


# ---- Page numbers are IN the source, not hand-typed -----------------------
# The PDF-to-text dump leaves the book's own printed page number sitting
# alone on its own line at every page break. But plenty of OTHER standalone
# numbers also occur alone on a line -- stat-table columns (weapon SP/ENC/RNG
# figures, TC costs, d100 ranges) -- so not every candidate is a real page
# marker. True page numbers are the one subsequence that climbs by exactly 1,
# page after page, cover to cover; table noise doesn't. So accept a candidate
# only when it continues that climb (allowing a gap of up to 2 for a missed
# page), the same "derive it, don't trust it beside the data" move as
# check_range() in parse_magic.py deriving a table row's range from its own
# quote instead of a hand-typed number next to it.
_candidates = [(i, int(l.strip())) for i, l in enumerate(lines)
               if re.fullmatch(r"\s*\d{1,4}\s*", l) and l.strip()]
_PAGE_LINES = []
_last = None
for i, v in _candidates:
    if _last is None or (v > _last and v <= _last + 3):
        _PAGE_LINES.append((i, v))
        _last = v
_PAGE_IDXS = [p[0] for p in _PAGE_LINES]
if len(_PAGE_LINES) < 400:
    problems.append(("too few sequential page markers recovered; "
                      "page_of() would be unreliable", len(_PAGE_LINES)))


def page_of(line_idx):
    """The book's page for a line: the first page marker AFTER it. In this
    dump a page's printed number FOLLOWS that page's text (the contents page
    puts Marking a Wound on 172 and its text sits just above the "172" line).
    Until v0.53.1 this took the marker BEFORE the line, and every page in
    the Rules Audit was one early; the contents-page check below pins it."""
    j = bisect.bisect_right(_PAGE_IDXS, line_idx)
    return _PAGE_LINES[j][1] if j < len(_PAGE_LINES) else None


def page_of_previous(line_idx):
    """The pre-v0.53.1 reading, kept only so the self-test below can prove
    the contents-page check catches it."""
    j = bisect.bisect_right(_PAGE_IDXS, line_idx) - 1
    return _PAGE_LINES[j][1] if j >= 0 else None


# ---- The contents page ------------------------------------------------------
# "Marking a Wound . . . . . 172": heading -> first page. A heading's range
# runs to the first LATER page any following heading starts on (inclusive,
# since that heading may start part-way down the page).
TOC = []
for l in lines[:400]:
    m = re.match(r"^\s*(.+?)\s*(?:\.\s*){3,}\s*(\d{1,3})\s*$", l)
    if m:
        TOC.append((norm(m.group(1)).strip(), int(m.group(2))))
if len(TOC) < 100:
    problems.append(("contents page not recovered", len(TOC)))


def toc_range(heading):
    idx = [i for i, (h, _) in enumerate(TOC) if h == norm(heading)]
    if len(idx) != 1:
        return None
    start = TOC[idx[0]][1]
    later = [p for _, p in TOC[idx[0] + 1:] if p > start]
    return (start, later[0] if later else start)


def _hkey(t):
    t = norm(t).strip().lower()
    return re.sub(r"^(\d+\s*-\s*|\d+\)\s*)", "", t)


# Where each contents heading is printed in the body, as its own line (the
# dump lower-cases some and numbers the chargen steps: "4) determine
# attributes"). The contents page itself is excluded.
_TOC_KEYS = {_hkey(h) for h, _ in TOC}
HEAD_LINES = [(i, _hkey(l)) for i, l in enumerate(lines) if i >= 400 and l.strip() and _hkey(l) in _TOC_KEYS]


def heading_above(line_idx, page):
    """The nearest contents heading printed at or above a line, counting only
    headings whose contents-page range can hold that page: "Death Threshold"
    is a Ch.11 heading (p.174) and also a subheading inside Ch.7's Determine
    Attributes (p.87), and only the first is the contents entry."""
    ok = lambda k: any(_hkey(h) == k and (toc_range(h) or (0, -1))[0] <= page <= (toc_range(h) or (0, -1))[1] for h, _ in TOC)
    for i, k in reversed(HEAD_LINES):
        if i <= line_idx and ok(k):
            return k
    return None


# ---- Finding a quote --------------------------------------------------------
# Searched for in the whole book, never in a hand-typed line window: those
# went stale when the source dump was regenerated (every window missed by
# ~1,500-3,000 lines and the script could no longer run at all).
def locate(q):
    """Every line a copy of the quote STARTS on."""
    nq = norm(q)
    key = sorted(nq.split()[:6], key=len, reverse=True)[0]
    hits = []
    for i, l in enumerate(lines):
        if key not in norm(l):
            continue
        for s in range(max(0, i - 6), i + 1):
            if s not in hits and nq in flat(s, s + 90) and nq not in flat(s + 1, s + 90):
                hits.append(s)
    return sorted(hits)


# ---- Rules -----------------------------------------------------------------
# Each rule: key, section (chapter label shown to players), what (plain
# English restatement of what the macro computes), toc (the contents-page
# heading the passage sits under; the derived page must fall inside that
# heading's page range), copies (how many times the quote is printed in the
# book, 1 unless the book repeats it, e.g. the weapon-trait legend on every
# weapon page), q (verbatim quote, found by searching the whole book).
CH2 = "Chapter 2: Core Mechanics"
CH9 = "Chapter 9: Equipment"
CH11 = "Chapter 11: Wounds, Healing & Perils"
CH7 = "Chapter 7: Character Creation"

# "macro" is an editorial cross-reference (which macro this rule governs),
# not a book claim. It is checked below against the macros that actually
# ship (build.js's MACROS list): a rule that names a retired macro fails.
RULES = [
    {"key": "rollUnder", "section": CH2, "macro": "TBE: Skill Roll, TBE: Opposed Roll, TBE: Attack (shared roll code in _lib.js)",
     "what": "A skill roll is percentile dice (tens die + ones die) read as a number 1-100, compared to the skill value. Equal-to-or-under succeeds.",
     "toc": "2 - Core Mechanics",
     "q": "If the roll is over the skill value, it fails. If the number rolled is equal to or less than the skill value, it succeeds."},
    {"key": "score", "section": CH2, "macro": "TBE: Skill Roll (skills over 100)",
     "what": "A skill's Score is the tens digit of its value, used only where a rule says so, and never changed by modifiers.",
     "toc": "2 - Core Mechanics",
     "q": "A skill also has a Score (the tens digit of a skill value). The Score is used only in specific cases, indicated when relevant, and is never altered by modifiers."},
    {"key": "successLevels", "section": CH2, "macro": "TBE: Skill Roll, TBE: Opposed Roll, TBE: Attack",
     "what": "On a success, the tens die shown is the number of Success Levels (SL). A 0 on the tens die counts as 1 SL, not 10 -- this is a different rule from Weave Mastery's 0-counts-as-10.",
     "toc": "Success Levels",
     "q": "When you roll your skill value or under, you succeed, and the number showing on the tens die is the number of Success Levels (SLs). The Success Level represents the quality of success and, when relevant to the outcome, can have various effects based on the particular skill. On any successful skill roll, a 0 on the tens die counts as 1 SL."},
    {"key": "criticalSuccess", "section": CH2, "macro": "TBE: Skill Roll, TBE: Opposed Roll, TBE: Attack",
     "what": "Doubles under your skill, or rolling the skill value exactly, is a critical success: +3 SL.",
     "toc": "Critical Results",
     "q": "A critical success is an extraordinary skill roll result, and is achieved when you roll doubles under your skill, or when you roll your skill value exactly. A critical success adds +3 Success Levels to your roll."},
    {"key": "criticalFailure", "section": CH2, "macro": "TBE: Skill Roll, TBE: Opposed Roll, TBE: Attack",
     "what": "Doubles over your skill value is a critical failure.",
     "toc": "Critical Results",
     "q": "A critical failure, on the other hand, can carry extra consequences. Rolling doubles over your skill value is a critical failure."},
    {"key": "alwaysSucceedFail", "section": CH2, "macro": "TBE: Skill Roll, TBE: Opposed Roll, TBE: Attack",
     "what": "01-05 always succeeds (even at skill 0 or below, which still succeeds on 01-04 and crits on 05); 99-00 always fails.",
     "toc": "Critical Results",
     "q": "A roll of 01-05 is always a success, regardless of skill value. Consequently, if your skill value is ever modified to zero or below, it still succeeds on a roll of 01-04, and critically succeeds on a 05. A roll of 99-00 is always a failure (and if over your skill, a critical failure), regardless of skill value."},
    {"key": "hundredExactNotCrit", "section": CH2, "macro": "TBE: Skill Roll, TBE: Opposed Roll, TBE: Attack",
     "what": "At skill 99 or 100, rolling the exact value is a failure, not a critical success.",
     "toc": "Critical Results",
     "q": "In the rare case you have a skill value of 99 or 100, rolling your skill value exactly is still a failure, not a critical success."},
    {"key": "skillOver100", "section": CH2, "macro": "TBE: Skill Roll, TBE: Opposed Roll, TBE: Attack",
     "what": "A modified skill of 100+ can never critically fail; on a success it adds bonus SL equal to the tens digit of (skill - 100), minimum 1.",
     "toc": "Critical Results",
     "q": "These skills still fail on a roll of 99-00, but can no longer critically fail. If a skill ever has (or is modified to) a value over 100, roll it normally, but a success will benefit from extra SLs. To determine how many, subtract 100 from the skill value. The skill's resulting tens die value (the Score) acts as extra SLs (with a minimum of 1) on a successful skill roll."},
    {"key": "standardRoll", "section": CH2, "macro": "TBE: Skill Roll",
     "what": "A standard (unopposed) roll needs only 1 SL to succeed; extra SLs only matter when the specific skill or situation says so.",
     "toc": "Standard and Opposed Rolls",
     "q": "A standard roll requires only 1 SL to succeed. However, additional Success Levels can sometimes produce a better outcome."},
    {"key": "opposedRoll", "section": CH2, "macro": "TBE: Opposed Roll",
     "what": "Opposed rolls: whoever earns more SL wins (0 SL can still win). Tie-breaks in order: higher die roll, then higher modified skill, then critical beats non-critical; a normal failure beats a critical failure.",
     "toc": "Standard and Opposed Rolls",
     "q": "Both sides roll their skills and whoever earns more SLs is the winner. It's possible to win an opposed roll with 0 SLs"},
    {"key": "deathThreshold", "section": CH7, "macro": "TBE: Create Character, the character sheet",
     "what": "Death Threshold starts at 20 and rises 2 per Attribute point spent on it -- the ceiling on total lethal Wound Points before death.",
     "toc": "Determine Attributes",
     "q": "Death Threshold (DT) is the maximum number of total lethal Wound Points you can suffer in all combined hit locations before you are killed. A Starting Death Threshold is 20. A Increase the Death Threshold by 2 per Attribute point spent."},
    {"key": "lethalityLevel", "section": CH7, "macro": "TBE: Create Character, TBE: Attack (Dying check)",
     "what": "Lethality Level = 1/3 of Death Threshold, rounded up. In Shock with total lethal WP over LL means Dying.",
     "toc": "Determine Attributes",
     "q": "Lethality Level (LL) determines the point at which you start dying when you've fallen in Shock. A A character's Lethality Level is equal to 1/3 of their Death Threshold, rounded up. A If they drop in Shock and their total lethal Wound Points exceed their Lethality Level, they are now Dying."},
    {"key": "markWound", "section": CH11, "macro": "TBE: Attack",
     "what": "Wound = attacker's DoS + weapon base damage, minus the struck location's Armor Points (plus any Shield AP), floored appropriately by the macro.",
     "toc": "Marking a Wound",
     "q": "A successful attack adds the attacker's DoS to the weapon's base damage. Unless the attacker performed the Choose Location maneuver, the attacker's ones die determines the General Hit Location of the strike"},
    {"key": "subtractAP", "section": CH11, "macro": "TBE: Attack",
     "what": "Subtract the location's Armor + any Shield AP from incoming damage; the remainder is the wound's WP.",
     "toc": "Marking a Wound",
     "q": "Subtract the location's Armor + any Shield AP from the incoming damage. The remaining amount is the WP of the wound."},
    {"key": "woundDie", "section": CH11, "macro": "TBE: Attack",
     "what": "Every new wound rolls Wound Die (d10, red) + Toughness against the location's new total WP. Equal-or-under = Impaired. A natural 10 (\"0\") always avoids impairment regardless of total.",
     "toc": "The Wound Die",
     "q": "When suffering a wound, immediately roll the Wound Die (a red d10) and add the character's Toughness. If the result is equal to or less than the new total Wound Points in the wounded location (from all wounds there), mark the location as Impaired. If the roll is a natural 10 (\"0\") on the Wound Die, the location automatically avoids impairment, regardless of the location's Wound Point total."},
    {"key": "shock", "section": CH11, "macro": "TBE: Attack",
     "what": "A second Impairment on any location drops you in Shock (minutes = the failed Wound Die face); a second Body Impairment drops you in Shock immediately, no Endurance roll. 3 Resolve avoids dropping in Shock.",
     "toc": "Shock",
     "q": "If any of a character's hit locations are Impaired a second time, they immediately drop in Shock (and also unconscious if from a Head impairment) for a number of minutes equal to the number showing on the failed Wound Die. A second Body impairment causes the character to immediately drop in Shock; there is no Endurance roll to avoid it. Once no longer in Shock, the character can act normally. A PC can spend 3 Resolve to avoid dropping in Shock."},
    {"key": "firstImpairment", "section": CH11, "macro": "TBE: Attack",
     "what": "First-time Impairment per location: Body needs an Endurance roll or Shock; Arm/Leg/Head effects split on whether the failed Wound Die came up odd or even.",
     "toc": "Impaired",
     "q": "The first time a location is Impaired, the character suffers the following effects"},
    {"key": "piercingTrait", "section": CH9, "macro": "TBE: Attack",
     "what": "A weapon's Piercing value bypasses that many Armor Points from worn armor. It does not reduce a shield's AP.",
     "toc": "Weapons", "copies": 4,
     "q": "Piercing.............Weapon bypasses this number of Armor Points from worn Armor. It does not reduce a shield's AP"},
    {"key": "nonLethalTrait", "section": CH9, "macro": "TBE: Attack, TBE: Wounds & Recovery",
     "what": "Wound points marked NL (non-lethal) do not count against Death Threshold or Lethality Level.",
     "toc": "Weapons", "copies": 4,
     "q": "NL.....................Non-lethal. Wound points marked NL do not count against the Death Threshold or Lethality Level"},
    {"key": "pierceArmorManeuver", "section": CH11, "macro": "TBE: Attack",
     "what": "Pierce Armor maneuver (4 SLs, target in Reinforced Leather or better): the attack gains Piercing 3 on the struck location, with no effect if that location has 3 AP or less.",
     "toc": "Combat Maneuvers",
     "q": "Pierce Armor (PA) Requirements: 4 SLs, opponent in Reinforced Leather armor or better Exploit a flaw or weak point in your opponent's rigid armor. The attack gains Piercing 3 on the struck location. This has no effect if that location has 3 AP or less (Leather, Quilt, or Padding)."},
]

SHIPPED = set(re.findall(r'\["(TBE: [^"]+|Ask the Weave)", "[a-z0-9-]+\.js"', open("build.js", encoding="utf-8").read()))
if len(SHIPPED) < 30:
    problems.append(("could not read the shipped macro list from build.js", len(SHIPPED)))

for r in RULES:
    hits = locate(r["q"])
    want = r.get("copies", 1)
    if len(hits) != want:
        problems.append(("quote printed %d time(s) in the book, %d declared" % (len(hits), want), r["key"], r["q"][:80]))
        continue
    r["line"] = hits[0]
    r["page"] = page_of(hits[0])
    if r["page"] is None:
        problems.append(("no page number could be derived", r["key"]))
        continue
    above = heading_above(hits[0], r["page"])
    if above != _hkey(r["toc"]):
        problems.append(("the nearest heading above the quote is not the one declared", r["key"], r["toc"], above))
    rng = toc_range(r["toc"])
    if rng is None:
        problems.append(("heading not on the contents page exactly once", r["key"], r["toc"]))
    elif not (rng[0] <= r["page"] <= rng[1]):
        problems.append(("page outside its contents-page range", r["key"], r["page"], r["toc"], rng))
    for name in re.findall(r"TBE: [A-Z][\w &]*?(?= \(|,|$)", r["macro"]):
        if name.strip() not in SHIPPED:
            problems.append(("names a macro that does not ship", r["key"], name))

# ---- Self-test: break it and watch it fail ----------------------------------
# 1. The pre-v0.53.1 page reading must fail the contents-page check for at
#    least one rule, or that check could not have caught the bug it fixes.
caught = [r["key"] for r in RULES if "line" in r and toc_range(r["toc"])
          and not (toc_range(r["toc"])[0] <= page_of_previous(r["line"]) <= toc_range(r["toc"])[1])]
if not caught:
    problems.append(("self-test: the previous-marker page reading passes the contents check", "page_of"))
# 2. A quote with one word changed must not be found.
if locate(RULES[0]["q"].replace("fails", "passes")):
    problems.append(("self-test: a one-word change to a quote is still found", RULES[0]["key"]))
# 3. A retired macro name must be refused.
if "TBE: Character Wizard" in SHIPPED or "TBE: Attack" not in SHIPPED:
    problems.append(("self-test: the shipped-macro list is wrong", sorted(SHIPPED)[:5]))

# Duplicate-key / missing-field sanity.
seen = set()
for r in RULES:
    if r["key"] in seen:
        problems.append(("duplicate rule key", r["key"]))
    seen.add(r["key"])
    for f in ("section", "what", "q", "page", "macro"):
        if not r.get(f):
            problems.append(("missing field", r["key"], f))

if problems:
    print("VERIFICATION FAILED:")
    for p in problems:
        print("  ", p)
    raise SystemExit(1)

out = [{"key": r["key"], "section": r["section"], "heading": r["toc"], "macro": r["macro"], "what": r["what"],
        "q": r["q"], "page": r["page"]} for r in RULES]
print(f"verified: {len(out)} core-mechanic rules quoted verbatim, found by search, pages derived from the "
      f"source text and inside their contents-page ranges (range {min(r['page'] for r in out)}-{max(r['page'] for r in out)}); "
      f"self-test: the old page reading fails on {len(caught)} rule(s)")
json.dump({"rules": out}, open("data/core_rules.json", "w"), indent=1)
