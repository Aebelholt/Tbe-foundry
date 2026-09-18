"""Emit magic_reference.html from the verified Ch.14 extract.

A at-the-table reference for Weave Magic, generated rather than written, so
every cost in it is the same number parse_magic.py quoted verbatim from the
book and the Cast macro prices spells with. The standing project goal is not
to hand-enter or go look up what a table could supply.
"""
import json, html

m = json.load(open("data/magic.json"))
S, R = m["shaping"], m["rules"]
e = html.escape


def cost(row):
    tc = row["tc"]
    bits = ["free" if tc == 0 else "+%d TC" % tc]
    if row.get("ritual"):
        bits.append("Ritual only")
    if row.get("fraying"):
        bits.append("+%s Fraying" % row["fraying"])
    return ", ".join(bits)


def table(title, rows, head=("Choice", "Cost")):
    out = ["<h4>%s</h4>" % e(title),
           '<table border="1" cellpadding="4"><tr><th>%s</th><th>%s</th></tr>' % (e(head[0]), e(head[1]))]
    for r in rows:
        out.append("<tr><td>%s</td><td>%s</td></tr>" % (e(r.get("name") or r["label"]), e(cost(r))))
    out.append("</table>")
    return "\n".join(out)


parts = ["<h2>TBE: Weave Magic Reference</h2>",
         "<p>Every number here is generated from the rulebook extract the macros themselves use, so this page and "
         "<b>TBE: Cast</b> can never disagree. Cast prices a spell for you and rolls the Weave Reaction; this page is "
         "for reading ahead, and for the GM adjudicating an Effect the list does not cover.</p>",
         "<h3>Shaping a spell</h3>",
         "<p>%s</p>" % e(R["shapingQuote"]),
         table("Magnitude", S["magnitude"]),
         table("Target", S["target"]),
         table("Range", S["range"]),
         table("Duration", S["duration"]),
         "<h4>Per-target and per-instance costs</h4>",
         '<table border="1" cellpadding="4"><tr><th>Surcharge</th><th>Cost</th></tr>' +
         "".join("<tr><td>%s</td><td>+%d TC each%s</td></tr>" % (e(x["label"]), x["tc"],
                 ", up to +%d" % x["max"] if x.get("max") else "") for x in S["extras"]) + "</table>",
         "<p><b>Worn armor.</b> %s</p>" % e(S["armorPenaltyQuote"]),
         "<h3>Control</h3>",
         "<p>%s A &ldquo;0&rdquo; on the ones die counts as 10. %s %s</p>" %
         (e(R["masteryQuote"]), e(R["wrmQuote"]), e(R["mitigationQuote"])),
         "<p><b>Critical failure.</b> %s</p>" % e(R["critFailQuote"]),
         "<h3>Spell Effect costs</h3>"]

for g in m["effects"]:
    parts.append("<h4>%s</h4>" % e(g["name"]))
    if g.get("note"):
        parts.append('<p style="font-size:90%%">%s</p>' % e(g["note"]))
    parts.append('<table border="1" cellpadding="4"><tr><th>Effect</th><th>Cost</th></tr>')
    for r in g["rows"]:
        note = "%d TC%s" % (r["tc"], " each" if r.get("per") else "")
        if r.get("ritual"):
            note += ", Ritual only"
        if r.get("fraying"):
            note += ", +%d Fraying" % r["fraying"]
        parts.append("<tr><td>%s</td><td>%s</td></tr>" % (e(r["label"]), e(note)))
    parts.append("</table>")

parts.append("<h3>The Weave Reaction Table</h3>")
parts.append("<p>%s. The three highest results only apply if the casting qualifies; anything else lands on "
             "Catastrophic Fray. <b>TBE: Cast</b> rolls this for you and applies the Fraying, Fatigue, Supply and "
             "status results directly.</p>" % e(R["weaveReactionQuote"]))
parts.append('<table border="1" cellpadding="4"><tr><th>d20 + modifier</th><th>Weave Reaction</th></tr>')
for r in m["weaveReactions"]:
    lo = "&le;1" if r["min"] < 0 else str(r["min"])
    rng = lo if r["max"] == r["min"] else ("%s+" % lo if r["max"] > 100 else "%s&ndash;%d" % (lo, r["max"]))
    gate = {"vulgar": " (Vulgar only)", "ritual": " (Ritual only)"}.get(r.get("when"), "")
    parts.append("<tr><td>%s%s</td><td>%s</td></tr>" % (rng, gate, e(r["name"])))
parts.append("</table>")
parts.append("<h4>What each result means</h4><dl>")
for d in m["weaveReactionDetail"]:
    parts.append("<dt><b>%s</b></dt><dd>%s</dd>" % (e(d["name"]), e(d["text"])))
parts.append("</dl>")

parts.append("<h3>Fraying</h3>")
parts.append("<p><b>%s</b> %s</p>" % (e(R["frayingRollQuote"]), e(R["frayingIrreversibleQuote"])))
parts.append("<p>%s</p>" % e(R["fadeCritFailQuote"]))
parts.append('<table border="1" cellpadding="4"><tr><th>Threshold</th><th>Symptoms</th></tr>' +
             "".join("<tr><td>%s</td><td>%s<ul>%s</ul></td></tr>" %
                     (e(t["label"]), e(t["summary"]),
                      "".join("<li>%s</li>" % e(x) for x in t.get("signs", [])))
                     for t in m["frayingSymptoms"]) +
             "</table>")
parts.append("<p>Symptoms begin when the total first reaches a threshold and <b>remain permanently</b>, even if Max "
             "Resolve later increases.</p>")
parts.append("<p><b>%s.</b> %s</p>" % (e(m["frayingTrait"]["name"]), e(m["frayingTrait"]["text"])))
parts.append("<p><b>%s.</b> %s</p>" % (e(m["finalAct"]["name"]), e(m["finalAct"]["text"])))

parts.append("<h3>Strands</h3>")
parts.append("<p>%s %s %s</p>" % (e(R["strandXpQuote"]), e(R["strandSequentialQuote"]) + ".", e(R["strandBeyondTenQuote"])))
parts.append("<p>%s %s</p>" % (e(R["fadeStrandQuote"]), e(R["newStrandQuote"])))
parts.append('<table border="1" cellpadding="4"><tr><th>Strand</th><th>What it governs</th></tr>' +
             "".join("<tr><td><b>%s</b></td><td>%s</td></tr>" % (e(x["name"]), e(x["desc"])) for x in m["strands"]) +
             "</table>")
parts.append('<table border="1" cellpadding="4"><tr><th>Bind</th><th>What it does</th></tr>' +
             "".join("<tr><td><b>%s</b></td><td>%s</td></tr>" % (e(x["name"]), e(x["desc"])) for x in m["binds"]) +
             "</table>")

parts.append("<h3>Convocations</h3>")
parts.append("<p>Optional templates for building a Spellweaver at character creation (Ch.7 p.106). The "
             "<b>TBE: Character Wizard</b> rolls or applies any of these and fills the picks in for you.</p>")
parts.append('<table border="1" cellpadding="4"><tr><th>Convocation</th><th>Binds</th><th>Strands</th><th>Thin Strands</th></tr>' +
             "".join("<tr><td><b>%s</b></td><td>%s</td><td>%s</td><td>%s</td></tr>" %
                     (e(c["name"]), e(", ".join(c["binds"])), e(", ".join(c["strands"])), e(", ".join(c["thinStrands"])))
                     for c in m["convocations"]) + "</table>")

parts.append("<h3>Threads</h3>")
parts.append("<p>%s %s %s</p>" % (e(R["threadAfterSuccessQuote"]), e(R["threadLimitQuote"]) + ".", e(R["threadDieQuote"])))

# ---- Rituals, Pacts, Summoning and True Names (p.312-321) ------------------
RIT, CIRC, SUM, TN, PACT = m["ritual"], m["magicCircle"], m["summoning"], m["trueNames"], m["pact"]
q = lambda d, k: e(d[k]["q"])

parts.append("<h3>Rituals</h3>")
parts.append("<p><b>TBE: Ritual</b> runs this whole procedure &mdash; casting time, the concentration rolls, every "
             "source of Mastery, the results table and the Weave Reaction. This is what it is doing.</p>")
parts.append("<ul>%s</ul>" % "".join("<li>%s</li>" % x for x in [
    q(RIT, "tetherRange") + ".",
    q(RIT, "hoursPerTc") + ". " + q(RIT, "rushBonus") + ".",
    q(RIT, "fatiguePerEightHours") + ", and " + q(RIT, "concentrationRoll") + ".",
    q(RIT, "noResolve") + " &mdash; though " + q(RIT, "resolveFloor") + ".",
    q(RIT, "weaveReactionBonus") + ", and " + q(RIT, "critFailFraying") + ".",
]))
parts.append("<h4>Buying Mastery for a ritual</h4>")
parts.append('<table border="1" cellpadding="4"><tr><th>Source</th><th>Mastery</th></tr>' +
             "".join("<tr><td>%s</td><td>%s</td></tr>" % (e(a), e(b)) for a, b in [
                 ("Components", "1&ndash;8, GM's discretion; otherwise components worth %d sp &times; the TC" % RIT["componentsSpPerTc"]["n"]),
                 ("Assistance", "half each helper's Strand value, rounded up; at most half the caster's own Strand value in helpers"),
                 ("Grimoires", "a d4&ndash;d12 Thread Die per applicable Bind or Strand, once per ritual; a maximum roll consumes the book"),
                 ("Blood Magic", "%d per lethal Wound Point, up to %d, +%d to the casting roll if the victim dies just before completion" %
                  (RIT["bloodPerWp"]["n"], RIT["bloodMax"]["n"], RIT["bloodKillBonus"]["n"])),
             ]) + "</table>")
parts.append("<p><b>Blood Magic marks.</b> %s (100%% if the victim is killed). Roll d10:</p>" % q(RIT, "bloodMarkPercentPerWp"))
parts.append('<table border="1" cellpadding="4"><tr><th>d10</th><th>Mark</th></tr>' +
             "".join("<tr><td>%d</td><td>%s</td></tr>" % (x["roll"], e(x["text"])) for x in m["bloodMarks"]) +
             "</table>")
parts.append("<h4>Ritual Casting Results</h4>")
parts.append('<table border="1" cellpadding="4"><tr><th>Roll</th><th>Outcome</th></tr>' +
             "".join("<tr><td><b>%s</b></td><td>%s</td></tr>" % (e(r["name"]), e(r["q"])) for r in m["ritualResults"]) +
             "</table>")

parts.append("<h4>Magic Circles</h4>")
parts.append("<p>%s %s %s %s %s</p>" % (q(CIRC, "inscribeSp"), q(CIRC, "onePerZone"), q(CIRC, "slsPerReduction") + ".",
                                        q(CIRC, "extraSpStep") + ".", q(CIRC, "noResolve") + ". " + q(CIRC, "noFades") + "."))

parts.append("<h4>Pacts &mdash; rituals for non-casters</h4>")
parts.append("<p>%s %s %s %s</p>" % (q(PACT, "noRollQuote") + ".", q(PACT, "timerDie"),
                                     q(PACT, "startsAtOne"), q(PACT, "payRule")))
parts.append("<p><b>Example Prices.</b></p><ul>%s</ul>" % "".join("<li>%s</li>" % e(p) for p in PACT["prices"]))

parts.append("<h3>Summoning</h3>")
parts.append("<p>%s %s %s %s</p>" % (q(SUM, "magnitude"), q(SUM, "circleSp") + ".", q(SUM, "spellShape"), q(SUM, "nativesQuote") + "."))
parts.append('<table border="1" cellpadding="4"><tr><th>Circle materials</th><th>Arcana roll</th></tr>' +
             "".join("<tr><td>%s sp</td><td>%s</td></tr>" % ("{:,}".format(x["sp"]), "&mdash;" if not x["bonus"] else "+%d" % x["bonus"])
                     for x in SUM["materials"]) + "</table>")
parts.append("<p>%s %s %s</p>" % (q(SUM, "resistQuote"), q(SUM, "boundDays"), q(SUM, "decayDays") + " " + q(SUM, "renewHours") + "."))
parts.append("<p>%s</p>" % q(SUM, "uncontrolledQuote"))

parts.append("<h3>True Names</h3>")
parts.append("<p>%s %s</p>" % (q(TN, "tetherQuote") + ".", q(TN, "mortalsQuote")))
parts.append("<ul>%s</ul>" % "".join("<li>%s</li>" % x for x in [
    q(TN, "languageQuote") + ", " + q(TN, "languageRoll") + ", or the spell using it automatically fails. " + q(TN, "languageCritFail"),
    q(TN, "frayingDie"),
    q(TN, "notConsumedQuote"),
    q(TN, "alertsQuote") + ".",
    q(TN, "summonPenalty") + ".",
]))

out = "\n".join(parts) + "\n"
open("magic_reference.html", "w").write(out)
print("wrote magic_reference.html", round(len(out) / 1024, 1), "KB")
