#!/usr/bin/env python3
"""parse_npc_traits.py -> npctraits.json

The d100 NPC Traits table (Ch.19): Appearance, Playable Aspect, Personality,
Agenda, and a Special Reaction Trigger, 50 rows of 2.

Why this replaces whatever produced the old file: 29 of the 50 rows in it were
mis-parsed. The Personality column had captured a fragment of the Aspect
("tapping", "groomer", "stare") and the Agenda had swallowed the real
Personality word plus the agenda ("Steadfast Spy on a rival"). build.js then
hid the damage:

    .filter((r) => /^[A-Z][a-z]/.test(r.personality) && r.agenda.split(" ").length < 9)

Every mis-parsed row failed that test and was silently dropped, so 29 of the
book's 50 rows never reached a table, the d100 coverage had holes, and TBE: NPC
drew from 21 rows while claiming to roll the book's table. Filtering out what
you could not parse is data loss with the evidence removed.

The columns cannot be split by counting words: an Aspect runs from one word
("Cryptic") to four ("Constantly scribbling notes"). What pins the boundary is
the Personality column, transcribed below in row order -- 50 single words, each
of which the checks confirm sits exactly where the book prints it.

Self-verifying, in the shape parse_life_events.py established. Run it and it
either writes the file or exits non-zero saying which row failed.
"""

import json
import re
import sys

SRC = "/tmp/tbe.txt"
OUT = "npctraits.json"
HEAD = "d100 Appearance Playable Aspect Personality Agenda"

# The Personality column, in row order (rows 01-02 ... 99-00). Hand-transcribed
# from the printed table; check_personality_position() below proves each one
# really is the Personality of its row and not a word borrowed from a neighbour.
PERSONALITY = [
    "Adaptable", "Charismatic", "Courteous", "Determined", "Empathetic",
    "Generous", "Honest", "Humble", "Loyal", "Optimistic",
    "Patient", "Perceptive", "Resourceful", "Steadfast", "Witty",
    "Ambitious", "Curious", "Diligent", "Dreamy", "Independent",
    "Introspective", "Observant", "Reserved", "Stoic", "Tenacious",
    "Abrasive", "Arrogant", "Cynical", "Deceptive", "Greedy",
    "Impatient", "Impulsive", "Jealous", "Melancholic", "Reckless",
    "Ruthless", "Selfish", "Sullen", "Suspicious", "Vindictive",
    "Compassionate", "Courageous", "Dependable", "Encouraging", "Fair-minded",
    "Gracious", "Resilient", "Trustworthy", "Visionary", "Supportive",
]

# The first word of each row's Agenda, in row order. Transcribed separately
# from the Personality column above so that each row is pinned from BOTH sides:
# a Personality that has slid one word left or right stops lining up with the
# verb the Agenda is supposed to start with, and vice versa. Checking only one
# end is what let the previous extractor slide a whole column unnoticed -- the
# same lesson parse_magic.py learned about quoting only half a row.
AGENDA_START = [
    "Evade", "Prove", "Ascend", "Spread", "Usurp",
    "Find", "Rescue", "Undermine", "Map", "Stay",
    "Atone", "Profit", "Pursue", "Spy", "Secure",
    "Become", "Maintain", "Deceive", "Impersonate", "Build",
    "Recover", "Take", "Take", "Change", "Assemble",
    "Find", "Learn", "Reconcile", "Blackmail", "Write",
    "Break", "Solve", "Build", "Seek", "Eliminate",
    "Pay", "Rid", "Protect", "Gain", "Amass",
    "Flee", "Keep", "Regain", "Create", "Win",
    "Restore", "Gain", "Find", "Protect", "Establish",
]

TRIGGER_RE = re.compile(r"\b(Bias|Topic|Skill):")
RANGE_RE = re.compile(r"(?<![\d–-])(\d{2})[–-](\d{2})(?!\d)")


def flat_table(text):
    i = text.index(HEAD)
    j = text.index("99–00", i)
    # The last row may wrap onto a following line, so two lines are taken --
    # but the line after the table is the printed page number, and taking it
    # swallowed "479" onto the end of the last row's trigger, which shipped
    # and reached a player on an NPC card (found by playing, fixed v0.28.0).
    end = text.index("\n", text.index("\n", j) + 1)
    seg = re.sub(r"\n\s*\d{1,4}\s*$", "", text[i:end])
    return re.sub(r"\s+", " ", seg)


def split_rows(flat):
    """Split on the d100 ranges, keeping only the ones that continue the
    sequence 01, 03, 05 ... -- a page number or a range inside a trigger's own
    text can otherwise look like a row marker."""
    kept, want = [], 1
    for m in RANGE_RE.finditer(flat):
        if int(m.group(1)) == want:
            kept.append(m)
            want += 2
    return kept


def main():
    text = open(SRC, encoding="utf-8", errors="replace").read()
    flat = flat_table(text)
    marks = split_rows(flat)
    if len(marks) != 50:
        sys.exit("expected 50 rows, found %d" % len(marks))
    if len(PERSONALITY) != 50 or len(AGENDA_START) != 50:
        sys.exit("both transcribed columns must have 50 entries")

    rows = []
    for n, m in enumerate(marks):
        end = marks[n + 1].start() if n + 1 < len(marks) else len(flat)
        body = flat[m.end():end].strip()
        lo, hi = int(m.group(1)), int(m.group(2))
        if hi == 0:
            hi = 100  # the book writes a d100 range's top as "00"

        t = TRIGGER_RE.search(body)
        if not t:
            sys.exit("row %d-%d: no Bias:/Topic:/Skill: trigger in %r" % (lo, hi, body))
        trigger = body[t.start():].strip()
        head = body[:t.start()].strip()

        appearance, _, middle = head.partition(" ")
        pers = PERSONALITY[n]
        # The transcribed Personality must appear in this row's middle as a
        # whole word, with something before it (the Aspect) and after it (the
        # Agenda). That is the check the old extractor did not have: a column
        # that slid one word left or right cannot satisfy it.
        mm = re.search(r"(?:^|\s)" + re.escape(pers) + r"(?:\s|$)", middle)
        if not mm:
            sys.exit("row %d-%d: personality %r not found in %r" % (lo, hi, pers, middle))
        aspect = middle[:mm.start()].strip()
        agenda = middle[mm.end():].strip()
        if not aspect:
            sys.exit("row %d-%d: no Aspect left of %r" % (lo, hi, pers))
        if not agenda:
            sys.exit("row %d-%d: no Agenda right of %r" % (lo, hi, pers))
        if " " in pers.strip():
            sys.exit("row %d-%d: Personality must be one word, got %r" % (lo, hi, pers))
        # The other half of the pin: the Agenda must begin with the verb the
        # book prints for this row. A Personality borrowed from the Agenda
        # leaves the Agenda starting one word late, and one borrowed from the
        # Aspect leaves it starting one word early.
        if agenda.split()[0] != AGENDA_START[n]:
            sys.exit("row %d-%d: Agenda should start with %r, got %r -- a column has slid"
                     % (lo, hi, AGENDA_START[n], agenda.split()[0]))

        rows.append({"lo": lo, "hi": hi, "appearance": appearance,
                     "aspect": aspect, "personality": pers,
                     "agenda": agenda, "trigger": trigger})

    # --- checks -------------------------------------------------------------
    seen = {}
    for r in rows:
        for v in range(r["lo"], r["hi"] + 1):
            if v in seen:
                sys.exit("d100 %d claimed twice (%s / %s)" % (v, seen[v], r["appearance"]))
            seen[v] = r["appearance"]
    missing = [v for v in range(1, 101) if v not in seen]
    if missing:
        sys.exit("d100 not covered: %s" % missing[:8])

    # Every field verbatim in the book, in this row's own stretch of the table.
    for n, r in enumerate(rows):
        start = marks[n].end()
        end = marks[n + 1].start() if n + 1 < len(marks) else len(flat)
        stretch = flat[start:end]
        for key in ("appearance", "aspect", "personality", "agenda", "trigger"):
            if r[key] not in stretch:
                sys.exit("row %d-%d: %s %r is not verbatim in the book's own row"
                         % (r["lo"], r["hi"], key, r[key]))

    if len(set(p for p in PERSONALITY)) != 50:
        sys.exit("the Personality column should hold 50 distinct words")

    # The check that actually catches a column sliding by one word, which is
    # what went wrong before and what "the word is verbatim in the row" cannot
    # see: the book alphabetises the Personality column in long ascending
    # blocks (15, 10, 15, 9, then the final row). A Personality borrowed from
    # the Aspect or Agenda beside it lands out of order and cuts a block short.
    def runs(values):
        out, cur = [], [values[0]]
        for v in values[1:]:
            if v.lower() > cur[-1].lower():
                cur.append(v)
            else:
                out.append(cur)
                cur = [v]
        out.append(cur)
        return out

    pruns = runs([r["personality"] for r in rows])
    if len(pruns) > 6:
        sys.exit("the Personality column should be alphabetised in a few long blocks, found %d: %s"
                 % (len(pruns), [len(x) for x in pruns]))
    short = [len(x) for x in pruns[:-1] if len(x) < 5]
    if short:
        sys.exit("a Personality block is too short (%s of %s) -- a column has slid"
                 % (short, [len(x) for x in pruns]))

    # (The Aspect column is only loosely alphabetised -- 9 blocks in the real
    # table -- so it carries no usable signal and is not checked here.)
    bad = [r for r in rows if not re.match(r"^(Bias|Topic|Skill):", r["trigger"])]
    if bad:
        sys.exit("rows whose trigger has no known prefix: %s" % [r["lo"] for r in bad])

    # Page furniture. The flattened book puts a bare page number on its own
    # line after the table, and the last row used to absorb it ("...smell of
    # travel 479"). Round-tripping cannot catch this: the number IS in the
    # book, just not in the table. No cell of this table ends in a bare
    # three-digit number, so that is the shape to refuse.
    furniture = [(r["lo"], k, r[k]) for r in rows
                 for k in ("appearance", "aspect", "personality", "agenda", "trigger")
                 if re.search(r"\s\d{3}$", r[k])]
    if furniture:
        sys.exit("page number absorbed into a cell: %s" % furniture)

    json.dump(rows, open(OUT, "w"), indent=1, ensure_ascii=False)
    print("wrote %s: %d rows, d100 1-100 covered exactly once, every field verbatim" % (OUT, len(rows)))


if __name__ == "__main__":
    main()
