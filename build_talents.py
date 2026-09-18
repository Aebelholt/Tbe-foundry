"""Emit TBE-Talents-Installer.js: the full Ch.4 Talent catalogue as world Items,
plus a reference journal. Names and text come from parse_talents.py, which
verified every name verbatim against the rulebook."""
import json

# Talents that change a tracked number on the actor. Until v0.13.0 every one
# of these was inert: the Item appeared on the sheet and the number it
# promises never moved, including the five offered by the Ability Score step
# that every character goes through. Each entry is quoted from the book so
# the mapping can be checked at a glance. `per` is the amount PER RANK, so a
# repeatable Talent scales; `max` is the book's own purchase limit.
STAT_EFFECTS = {
    "Inner Strength":      {"key": "system.resolve.max",           "per": 1, "max": None,
                            "quote": "Increase your Max Resolve by 1. Can be purchased multiple times to a maximum Resolve of 30."},
    "Tough":               {"key": "system.toughness",             "per": 1, "max": 3,
                            "quote": "Increase your Toughness by 1. Can be purchased up to three times."},
    "Not Today, Death":    {"key": "system.deathThreshold.max",    "per": 2, "max": 5,
                            "quote": "Increase your Death Threshold by 2; recalculate Lethality Level. Can be purchased up to five times."},
    "Unkillable":          {"key": "system.lethalityBonus",        "per": 1, "max": 3,
                            "quote": "Increase your Lethality Level by 1. You may improve your Lethality Level this way a maximum of three times."},
    "Strong Back":         {"key": "system.enc.invBonus",          "per": 2, "max": 3,
                            "quote": "Increase your number of Inventory slots by 2. Can be purchased up to three times."},
    "Weapon Belt":         {"key": "system.enc.handBonus",         "per": 1, "max": 3,
                            "quote": "Increase your Max Weapon ENC by 1. Can be purchased up to three times."},
    "Combat Awareness":    {"key": "system.initiative",            "per": 1, "max": 5,
                            "quote": "Add +1 to your Initiative modifier. Can be purchased up to five times."},
    "Patterned In The Weave": {"key": "system.resolve.max",        "per": 5, "max": 1,
                            "quote": "Gain +5 to Max Resolve."},
}


def stat_effect(name):
    """A Foundry ActiveEffect for a stat Talent, or None.

    transfer:true means the effect applies to whichever actor owns the Item,
    so dragging the Talent on works and deleting it reverses cleanly -- which
    hand-writing the number into the field would not.
    """
    spec = STAT_EFFECTS.get(name)
    if not spec:
        return None
    return {
        "name": name, "img": "icons/svg/upgrade.svg", "disabled": False, "transfer": True,
        "changes": [{"key": spec["key"], "mode": 2, "value": str(spec["per"]), "priority": 20}],
        "duration": {}, "description": "<p>" + spec["quote"] + "</p>",
        "flags": {"tbe": {"perRank": spec["per"], "maxRanks": spec["max"], "statKey": spec["key"]}},
    }


talents = json.load(open("data/talents.json"))
chargen = json.load(open("data/chargen.json"))

def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

CATS = ["Combat", "Adventuring", "Social", "Lore", "Magic", "Miscellaneous", "Non-Human"]

# Which race owns each exclusive Non-Human Talent, so the journal can say so.
owner = {}
for r in chargen["races"]:
    for t in r["exclusiveTalents"]:
        owner[t.lower()] = r["name"]

items = []
for t in talents:
    desc = (
        "<p><b>" + esc(t["category"]) + " Talent</b>"
        + (" &middot; <i>extends the Talent above it</i>" if t["sub"] else "")
        + (" &middot; <i>" + esc(owner[t["name"].lower()]) + " only</i>" if t["name"].lower() in owner else "")
        + "</p><p>" + esc(t["desc"]) + "</p>"
        + ("<p><b>Requires:</b> " + esc(t["requires"]) + "</p>" if t["requires"] else "")
        + ("<p style='font-size:11px;opacity:.8'>Repeatable: " + esc(t["rank"]) + "</p>" if t["rank"] != "once" else "")
    )
    row = {
        "name": t["name"], "category": t["category"], "requires": t["requires"],
        "rank": t["rank"], "sub": t["sub"], "desc": desc,
        "xp": t.get("xp", 5), "creationOnly": t.get("creationOnly", False),
    }
    eff = stat_effect(t["name"])
    if eff:
        row["effects"] = [eff]
    items.append(row)

rows = ""
for cat in CATS:
    inCat = [t for t in talents if t["category"] == cat]
    rows += "<h3>" + cat + " (" + str(len(inCat)) + ")</h3><table border='1' cellpadding='3'>"
    rows += "<tr><th>Talent</th><th>Requires</th><th>Repeatable</th><th>Effect</th></tr>"
    for t in inCat:
        excl = owner.get(t["name"].lower())
        rows += ("<tr><td>" + ("&#8627; " if t["sub"] else "") + esc(t["name"])
                 + (" <i>(" + esc(excl) + " only)</i>" if excl else "") + "</td><td>"
                 + esc(t["requires"] or "&mdash;") + "</td><td>"
                 + esc(t["rank"]) + "</td><td>" + esc(t["desc"][:400]) + "</td></tr>")
    rows += "</table>"

journal = ("<h2>TBE Talent reference</h2><p>" + str(len(talents))
           + " Talents from Chapter 4, grouped as the book groups them. Non-Human Talents are "
           "exclusive: only the named race may ever acquire one. Add Talents to a character with "
           "<b>TBE: Talents</b>, or drag them on from the <b>TBE Talents</b> folder.</p>" + rows)

js = """/*
 * THE BROKEN EMPIRES - TALENTS INSTALLER for Foundry VTT, native the-broken-empires system
 * Creates every Chapter 4 Talent as a real "talent" Item in the TBE Talents
 * folder, plus a reference journal. Paste into a new Script macro, run once as
 * GM. Safe to re-run: it replaces the Talents it created earlier by name.
 */
const TBE_TALENT_ITEMS = %s;
const TBE_TALENT_JOURNAL = %s;

(async () => {
  if (!game.user.isGM) return ui.notifications.error("Run the TBE talents installer as GM.");
  const errors = [];
  console.log("TBE | talents install on " + game.version + " | system " + game.system.id);

  let folder = game.folders.find((f) => f.name === "TBE Talents" && f.type === "Item");
  if (!folder) {
    try { folder = await Folder.create({ name: "TBE Talents", type: "Item" }); }
    catch (err) { console.error("TBE | folder failed", err); folder = null; }
  }

  let made = 0;
  for (const t of TBE_TALENT_ITEMS) {
    try {
      const old = game.items.find((i) => i.name === t.name && i.folder?.id === folder?.id);
      if (old) await old.delete();
      const data = {
        name: t.name, type: "talent", img: "icons/svg/upgrade.svg",
        system: {
          category: t.category, requirements: t.requires, ranks: 1,
          maxRanks: t.rank, specialization: "", sub: t.sub, description: t.desc
        }
      };
      if (folder) data.folder = folder.id;
      await Item.create(data);
      made++;
    } catch (err) {
      console.error("TBE | talent failed: " + t.name, err);
      errors.push(t.name);
    }
  }

  try {
    const old = game.journal.getName("TBE Talent Reference");
    if (old) await old.delete();
    await JournalEntry.create({
      name: "TBE Talent Reference",
      pages: [{ name: "Talents by category", type: "text", text: { content: TBE_TALENT_JOURNAL, format: 1 } }]
    });
  } catch (err) {
    console.error("TBE | talent journal failed", err);
    errors.push("reference journal");
  }

  const msg = "TBE talents: " + made + " created" + (errors.length ? ", " + errors.length + " failed (console F12)" : "") + ".";
  if (errors.length) ui.notifications.error(msg); else ui.notifications.info(msg);
})();
""" % (json.dumps(items), json.dumps(journal))

missing = [n for n in STAT_EFFECTS if not any(i["name"] == n for i in items)]
noeff = [n for n in STAT_EFFECTS if not any(i["name"] == n and i.get("effects") for i in items)]
if missing or noeff:
    print("VERIFICATION FAILED:")
    if missing: print("   stat Talents not found in the catalogue:", missing)
    if noeff:   print("   stat Talents that got no effect:", noeff)
    raise SystemExit(1)
print(f"   {sum(1 for i in items if i.get('effects'))} stat Talents carry an ActiveEffect")

json.dump({"items": items, "journal": journal}, open("data/talent_docs.json", "w"), indent=1)
open("TBE-Talents-Installer.js", "w").write(js)
print("wrote TBE-Talents-Installer.js", round(len(js) / 1024, 1), "KB;", len(items), "talents")
