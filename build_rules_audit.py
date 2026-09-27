"""Emit rules_audit.html: a player-facing cross-reference from "what a macro
just computed" to "the exact book sentence that says to compute it that way,"
page number included.

This is generated from data/core_rules.json, not hand-written, for the same
reason every other reference page in this pack is generated: so the page can
never say something the verification step didn't already check. The page
number is not hand-typed either -- parse_core_rules.py derives it from the
quote's own position in /tmp/tbe.txt.

Weave Magic (Ch.14) already has its own dedicated, equally-generated
reference (magic_reference.html) with the full Shaping/Effect/Weave Reaction
tables, so this page links to it rather than duplicating it.
"""
import html
import re
import json

c = json.load(open("data/core_rules.json"))
e = html.escape

BY_SECTION = {}
for r in c["rules"]:
    BY_SECTION.setdefault(r["section"], []).append(r)
for rows in BY_SECTION.values():
    rows.sort(key=lambda r: r["page"])

parts = [
    "<h2>TBE: Rules Audit</h2>",
    "<p>Every row below is generated from the rulebook extract the macros themselves compute from, not written by "
    "hand, so this page and the macros it describes can never quietly disagree. For each entry: what the macro "
    "computes, in plain language; the book chapter and page it comes from; and the exact sentence, quoted verbatim, "
    "that the macro is implementing. Page numbers are pulled from the book's own printed page markers in the source "
    "text, not typed in by hand, and each one is checked against the book's own contents page: the page must fall "
    "under the heading printed beside it, so a wrong page number here would mean the lookup itself is broken, not a typo.</p>",
    "<p><b>Weave Magic (Ch.14)</b> has its own dedicated reference with the full Shaping, Spell Effect, and Weave "
    "Reaction tables &mdash; open <b>TBE: Weave Magic Reference</b> elsewhere in this journal compendium. This page "
    "covers the core resolution mechanic (Ch.2), Death Threshold/Lethality Level (Ch.7), and Combat &amp; Wounds "
    "(Ch.9, Ch.11).</p>",
]

for section in sorted(BY_SECTION, key=lambda s: BY_SECTION[s][0]["page"]):
    parts.append("<h3>%s</h3>" % e(section))
    parts.append('<table border="1" cellpadding="6">'
                 "<tr><th>p.</th><th>What the macro computes</th><th>Used by</th><th>The book, verbatim</th></tr>")
    for r in BY_SECTION[section]:
        parts.append(
            "<tr><td>%d<br><span style=\"font-size:80%%\">%s</span></td><td>%s</td><td style=\"font-size:90%%\">%s</td>"
            "<td style=\"font-size:90%%\"><i>&ldquo;%s&rdquo;</i></td></tr>" %
            (r["page"], e(re.sub(r"^\d+ - ", "", r["heading"])), e(r["what"]), e(r["macro"]), e(r["q"]))
        )
    parts.append("</table>")

parts.append(
    "<h3>What this page does not cover yet</h3>"
    "<p>Character-creation point costs (races, careers, Talent prerequisites) and Equipment silver-piece costs are "
    "hand-transcribed with a lighter verification pass than the rules above, and aren't included here yet so this "
    "page never claims more rigor than actually exists behind it &mdash; see BACKLOG.md. Weave Magic (Ch.14) is "
    "fully covered, just in its own reference page rather than duplicated here.</p>"
)

out = "\n".join(parts) + "\n"
open("rules_audit.html", "w").write(out)
print("wrote rules_audit.html", round(len(out) / 1024, 1), "KB,", len(c["rules"]), "rules across", len(BY_SECTION), "sections")
