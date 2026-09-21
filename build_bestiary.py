import json, re

CREATURES = json.load(open("bestiary.json"))

# The Ch.18 Size ladder, and the abbreviations the stat blocks actually use.
SIZES = ["Minute", "Diminutive", "Tiny", "Little", "Small", "Medium",
         "Large", "Huge", "Massive", "Gargantuan", "Colossal"]
SIZE_ALIASES = {"Med": "Medium", "Med.": "Medium", "Lg": "Large", "Sm": "Small"}

def size_of(raw):
    """Normalise a stat block's Size onto the ladder. Unknown values fall back
    to Medium rather than silently writing a value the schema will reject."""
    s = (raw or "").strip()
    s = SIZE_ALIASES.get(s, s)
    return s if s in SIZES else "Medium"

def dehyph(s):
    return re.sub(r"(\w)-\s+(\w)", r"\1\2", s or "")

def esc(s):
    s = dehyph(s)
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def attack_header(text):
    """'Broadsword 90 Ex3, Dmg 4 (...)' -> ('Broadsword', 90, 3)

    The Expertise used to be matched and thrown away, so 13 attacks shipped
    as if the creature had none (Bandit Lord's Broadsword Ex3, the Werewolf's
    Claw Ex2) and rolled without the crit range the book gives them."""
    m = re.match(r"([A-Z][A-Za-z'\-/ ]{1,24}?)\s+(\d{1,3})\s*(?:Ex(\d))?\s*[,(]", text)
    if m:
        return m.group(1).strip(), int(m.group(2)), int(m.group(3)) if m.group(3) else 0
    return None, None, 0

# A stat block prints an attack as "Name NN[ ExN], Parry/Reach/Dmg/Thrown".
# Some blocks print a creature's alternate loadouts ("#1 - Mace 50, Dmg 4 ...")
# or a template's attack (the Lich's "Touch 65, Dmg 3") in a shape the
# extractor files under skills. Those skills are still fighting skills, and
# the book text says so: the same signature the attack parser keys on.
def printed_as_attack(raw, name, value):
    return bool(re.search(re.escape(name) + r"\s+" + str(value) +
                          r"(?:\s*Ex\d)?\s*,\s*(?:Parry|Reach|Dmg|Thrown)\b", raw))

def attack_details(text):
    """Pull the CoC7-relevant bits out of a TBE attack line."""
    t = dehyph(text)
    dm = re.search(r"Dmg\s+(\d+)", t)
    rm = re.search(r"Range\s+(\d+)", t)
    special_bits = []
    for key in ("Poison", "Venom", "Special", "Knockback", "Grapple", "Disease", "Paralysis", "Fire", "Burn"):
        if re.search(r"\b" + key + r"\b", t, re.I):
            special_bits.append(key)
    pierce = re.search(r"\+\s*P(\d+)", t)
    if pierce:
        special_bits.append("Piercing " + pierce.group(1))
    mv = {}
    for key, pat in (("cl", r"CL\s*(\d+)"), ("cs", r"CS\s*(\d+)"), ("dis", r"Dis\s*(\d+)"), ("t", r"T\s*(\d+)")):
        km = re.search(pat, t)
        if km:
            mv[key] = int(km.group(1))
    return {
        "cl": mv.get("cl", 3), "cs": mv.get("cs", 3), "dis": mv.get("dis", 4), "t": mv.get("t", 5),
        "damage": dm.group(1) if dm else "",
        "range": rm.group(1) if rm else "",
        "ranged": bool(rm),
        "thrown": bool(re.search(r"\bThrown\b", t, re.I)),
        "special": ", ".join(special_bits)
    }

out = []
for c in CREATURES:
    attack_names = set()
    attack_items = []
    for a in c["attacks"]:
        nm, val, ex = attack_header(a)
        det = attack_details(a)
        if nm:
            attack_names.add(nm)
            attack_items.append(dict({"name": nm, "value": val, "ex": ex, "text": dehyph(a)}, **det))
        else:
            attack_items.append(dict({"name": "Attack", "value": None, "ex": 0, "text": dehyph(a)}, **det))

    skills = [dict(s, attack=printed_as_attack(c["raw"], s["name"], s["value"]))
              for s in c["skills"] if s["name"] not in attack_names]

    grid_rows = ""
    for a in c["armour"]:
        worn = (" + " + a["worn"]) if a["worn"] else ""
        grid_rows += "<tr><td>" + esc(a["loc"]) + "</td><td>" + esc(a["natural"]) + esc(worn) + " AP</td></tr>"

    bio = (
        "<p><b>" + esc(c["difficulty"]) + "</b></p>"
        "<p>" + esc(c["desc"]) + "</p>"
        "<table border='1' cellpadding='3'><tr><th>Size</th><th>Init</th><th>Move</th><th>Ferocity</th><th>Toughness</th><th>Death Threshold</th></tr>"
        "<tr><td>" + "</td><td>".join(esc(x) for x in [c["size"], c["init"], c["move"], c["ferocity"], c["toughness"], c["dt"]]) + "</td></tr></table>"
        + ("<h3>Attacks</h3><ul>" + "".join("<li>" + esc(a) + "</li>" for a in c["attacks"]) + "</ul>" if c["attacks"] else "")
        + ("<h3>Armor by location</h3><table border='1' cellpadding='3'><tr><th>Location</th><th>AP</th></tr>" + grid_rows + "</table>" if grid_rows else "")
        + ("<p style='font-size:11px;opacity:.8'>" + esc(c["grid"]) + "</p>" if c["grid"] else "")
        + ("<h3>Special abilities</h3><p>" + esc(c["abilities"]) + "</p>" if c["abilities"] else "")
        + "<h3>Book text</h3><p style='font-size:11px;opacity:.75'>" + esc(c["raw"]) + "</p>"
    )

    aps = [int(a["natural"]) + (int(a["worn"]) if a["worn"] else 0) for a in c["armour"] if a["natural"].isdigit()]
    avg_armor = round(sum(aps) / len(aps)) if aps else ""
    keeper = ("Difficulty " + c["difficulty"] + ". Init " + c["init"] + ". Ferocity " + (c["ferocity"] or "-") +
              ". Toughness " + (c["toughness"] or "-") + ". Death Threshold " + (c["dt"] or "-") + ". " +
              dehyph(c["abilities"]))

    out.append({
        "name": c["name"],
        "difficulty": c["difficulty"],
        "size": size_of(c.get("size")),
        "ferocity": (c.get("ferocity") or "").strip(),
        "dt": c["dt"],
        "init": c["init"],
        "move": re.sub(r"[^0-9]", "", c["move"] or ""),
        "avgArmor": avg_armor,
        "keeper": keeper,
        "bio": bio,
        "skills": skills,
        "attacks": attack_items,
        "flags": {
            "difficulty": c["difficulty"], "size": c["size"], "init": c["init"], "move": c["move"],
            "ferocity": c["ferocity"], "toughness": c["toughness"], "dt": c["dt"],
            "armour": c["armour"]
        }
    })

index_rows = "".join(
    "<tr><td>" + esc(c["name"]) + "</td><td>" + esc(c["difficulty"]) + "</td><td>" + esc(c["flags"]["size"]) +
    "</td><td>" + esc(c["init"]) + "</td><td>" + esc(c["flags"]["toughness"]) + "</td><td>" + esc(c["dt"]) + "</td></tr>"
    for c in sorted(out, key=lambda x: x["name"]))
index_html = (
    "<h2>TBE bestiary index</h2><p>" + str(len(out)) + " creatures. Open an actor for its full stat block.</p>"
    "<table border='1' cellpadding='3'><tr><th>Creature</th><th>Difficulty</th><th>Size</th><th>Init</th><th>Toughness</th><th>DT</th></tr>"
    + index_rows + "</table>"
)

js = """/*
 * THE BROKEN EMPIRES - BESTIARY INSTALLER v3 for Foundry VTT, native the-broken-empires system
 * Creates real "creature" actors: system.deathThreshold/toughness/difficulty/
 * initiative/armour are DataModel fields, not attribs/infos/flags.tbe. Skills
 * and weapons are real skill/weapon Items (system.group/value/fighting,
 * system.dmg/cl/cs/dis/t/skillName/ranged) — no more CoC7 base/adjustments or
 * skill.main linking. Paste into a new Script macro and run once as GM.
 */
const TBE_BEAST = %s;
const TBE_INDEX = %s;
const TBE_LOC_MAP = { "Body": "body", "R Arm": "rArm", "L Arm": "lArm", "R Leg": "rLeg", "L Leg": "lLeg", "Head": "head" };
const TBE_LOCATIONS = ["body", "rArm", "lArm", "rLeg", "lLeg", "head"];

(async () => {
  if (!game.user.isGM) return ui.notifications.error("Run the TBE bestiary installer as GM.");
  const errors = [];
  console.log("TBE | bestiary v3 on " + game.version + " | " + game.system.id + " " + game.system.version);

  let folder = game.folders.find((f) => f.name === "TBE Bestiary" && f.type === "Actor");
  if (!folder) {
    try { folder = await Folder.create({ name: "TBE Bestiary", type: "Actor" }); }
    catch (err) { console.error("TBE | folder failed", err); folder = null; }
  }

  const mkSkill = (name, value, fighting) => ({
    name,
    type: "skill",
    system: { group: "Adventuring", value: Number(value) || 0, fighting: !!fighting }
  });

  let made = 0;
  for (const c of TBE_BEAST) {
    try {
      const old = game.actors.find((a) => a.name === c.name && a.folder?.id === folder?.id);
      if (old) await old.delete();

      const dt = Number(c.dt) || 10;
      const tough = Number(c.flags.toughness) || 0;
      const diff = ["Simple", "Easy", "Medium", "Challenging", "Hard", "Severe", "Extreme"].includes(c.difficulty) ? c.difficulty : "Medium";
      const armourGrid = TBE_LOCATIONS.reduce((o, l) => { o[l] = { natural: 0, worn: 0 }; return o; }, {});
      for (const a of (c.flags.armour || [])) {
        const key = TBE_LOC_MAP[a.loc] || null;
        if (!key) continue;
        armourGrid[key] = { natural: Number(a.natural) || 0, worn: Number(a.worn) || 0 };
      }
      const data = {
        name: c.name,
        type: "creature",
        system: {
          deathThreshold: { value: dt, max: dt },
          resolve: { value: 0, max: 0 },
          toughness: tough,
          difficulty: diff,
          initiative: c.init || "",
          size: c.size || "Medium",
          ferocity: c.ferocity || "",
          move: c.move || "",
          armour: armourGrid,
          biography: c.bio
        },
        flags: { tbe: c.flags }
      };
      if (folder) data.folder = folder.id;
      const actor = await Actor.create(data);

      const skillPayload = c.skills.map((s) => mkSkill(s.name + (s.ex ? " Ex" + s.ex : ""), s.value, false));
      for (const a of c.attacks) if (a.value !== null) skillPayload.push(mkSkill(a.name, a.value, true));
      if (skillPayload.length) await actor.createEmbeddedDocuments("Item", skillPayload);

      const weapons = [];
      for (const a of c.attacks) {
        weapons.push({
          name: a.name,
          type: "weapon",
          system: {
            description: "<p>" + a.text + "</p>",
            dmg: Number(a.damage) || 0, nl: false,
            cl: a.cl, cs: a.cs, dis: a.dis, t: a.t,
            skillName: a.name, ranged: !!a.ranged || !!a.thrown
          }
        });
      }
      if (weapons.length) await actor.createEmbeddedDocuments("Item", weapons);
      made++;
    } catch (err) {
      console.error("TBE | creature failed: " + c.name, err);
      errors.push(c.name);
    }
  }

  try {
    const old = game.journal.getName("TBE Bestiary Index");
    if (old) await old.delete();
    await JournalEntry.create({
      name: "TBE Bestiary Index",
      pages: [{ name: "Creatures", type: "text", text: { content: TBE_INDEX, format: 1 } }]
    });
  } catch (err) {
    console.error("TBE | index journal failed", err);
    errors.push("index journal");
  }

  const msg = "TBE bestiary: " + made + " creatures created" + (errors.length ? ", " + errors.length + " failed (console F12)" : "") + ".";
  if (errors.length) ui.notifications.error(msg); else ui.notifications.info(msg);
})();
""" % (json.dumps(out), json.dumps(index_html))

json.dump(out, open("data/bestiary_docs.json", "w"), indent=1)
open("TBE-Bestiary-Installer.js", "w").write(js)
print("wrote TBE-Bestiary-Installer.js", round(len(js) / 1024, 1), "KB;", len(out), "creatures,",
      sum(len(c["skills"]) for c in out), "skills,", sum(len(c["attacks"]) for c in out), "attacks")
