import json, re
from equipment import WEAPONS, SHIELDS, ARMOR

def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

weapons = []
for name, cat, sp, rch, dmg, cl, cs, dis, t, enc, rng, notes in WEAPONS:
    stats = {"category": cat, "sp": sp, "rch": rch, "dmg": dmg, "cl": cl, "cs": cs,
             "dis": dis, "t": t, "enc": enc, "rng": rng, "notes": notes}
    desc = (
        "<p><b>" + esc(cat) + " weapon</b></p>"
        "<table border='1' cellpadding='3'>"
        "<tr><th>SP</th><th>Rch</th><th>Dmg</th><th>CL</th><th>CS</th><th>Dis</th><th>T</th><th>Enc</th><th>Rng</th></tr>"
        "<tr><td>" + "</td><td>".join(esc(x) for x in [sp, rch, dmg, cl, cs, dis, t, enc, rng]) + "</td></tr>"
        "</table>"
        + ("<p>" + esc(notes) + "</p>" if notes else "")
        + "<p style='font-size:11px;opacity:.8'>CL Choose Location, CS Circumvent Shield, Dis Disarm, T Trip: minimum SLs to fuel that Maneuver.</p>"
    )
    skill_map = {"Light": "Melee: Light", "Medium": "Melee: Medium", "Heavy": "Melee: Heavy",
                 "Might": "Might", "Missile": "Missile", "Thrown": "Thrown"}
    dmg_num = re.match(r"(\d+)", dmg)
    # ENC column has footnoted/non-numeric forms ("0/1*", "-"): take the
    # leading number as the mechanical value (0 if there isn't one, e.g. "-"
    # for Torch/Fists), the full text stays in the description table/flags.
    enc_num = re.match(r"(\d+)", enc)
    weapons.append({
        "name": name, "kind": "weapon", "desc": desc, "stats": stats,
        "skillName": skill_map.get(cat, ""),
        "dmg": int(dmg_num.group(1)) if dmg_num else 0,
        "nl": "NL" in dmg,
        "cl": int(cl), "cs": int(cs), "dis": int(dis), "t": int(t),
        "enc": int(enc_num.group(1)) if enc_num else 0,
        # The schema's single "ranged" field drives ammo-die consumption in
        # TBE: Attack, so it covers both Missile weapons and Thrown weapons
        # (the book has no separate ammo track for thrown gear).
        "ranged": cat == "Missile" or cat == "Thrown" or "Thrown" in notes
    })

shields = []
for name, sp, ap, shb, enc, notes in SHIELDS:
    stats = {"category": "Shield", "sp": sp, "ap": ap, "shb": shb, "enc": enc, "notes": notes}
    desc = (
        "<p><b>Shield</b></p>"
        "<table border='1' cellpadding='3'><tr><th>SP</th><th>AP</th><th>ShB</th><th>Enc</th></tr>"
        "<tr><td>" + "</td><td>".join(esc(x) for x in [sp, ap, shb, enc]) + "</td></tr></table>"
        + ("<p>" + esc(notes) + "</p>" if notes else "")
        + "<p style='font-size:11px;opacity:.8'>Shield AP adds to a struck location when you are aware of the attack. ShB is the SL cost of a Shield Bash.</p>"
    )
    ap_num = re.match(r"\+?(\d+)", ap)
    enc_num = re.match(r"(\d+)", enc)
    shb_num = re.match(r"(\d+)", shb)
    shields.append({"name": name, "kind": "shield", "desc": desc, "stats": stats,
                     "ap": int(ap_num.group(1)) if ap_num else 0,
                     "enc": int(enc_num.group(1)) if enc_num else 0,
                     "shb": int(shb_num.group(1)) if shb_num else None})

armor = []
for name, sp, ap, bulk, training, sunder, penalties, about in ARMOR:
    stats = {"category": "Armor", "sp": sp, "ap": ap, "bulk": bulk,
             "training": training, "sunder": sunder, "penalties": penalties}
    desc = (
        "<p><b>Armor, one piece</b></p>"
        "<table border='1' cellpadding='3'><tr><th>SP per piece</th><th>AP</th><th>Bulk</th><th>Training?</th><th>Sunderable</th></tr>"
        "<tr><td>" + "</td><td>".join(esc(x) for x in [sp, ap, bulk, training, sunder]) + "</td></tr></table>"
        "<p><b>Penalties:</b> " + esc(penalties) + "</p>"
        "<p>" + esc(about) + "</p>"
        "<p style='font-size:11px;opacity:.8'>Buy one piece per location: helm, cuirass, sleeves, greaves. Total Bulk divided by 3, rounded up, is your Initiative penalty -- computed automatically on the character sheet from every equipped armor Item's Bulk field. "
        "This compendium entry has no hit location checked yet -- drag a copy onto a sheet for each location it covers "
        "(Head, Body, R Arm, L Arm, R Leg, L Leg) and check that location on the item, since one piece protects only the location(s) checked on it.</p>"
    )
    ap_num = re.match(r"\+?(\d+)", ap)
    armor.append({"name": name, "kind": "armor", "desc": desc, "stats": stats,
                   "ap": int(ap_num.group(1)) if ap_num else 0,
                   "bulk": float(bulk)})

def table(rows, headers, cells):
    out = "<table border='1' cellpadding='3'><tr>" + "".join("<th>" + h + "</th>" for h in headers) + "</tr>"
    for r in rows:
        out += "<tr>" + "".join("<td>" + esc(str(c)) + "</td>" for c in cells(r)) + "</tr>"
    return out + "</table>"

journal = (
    "<h2>TBE equipment reference</h2>"
    "<h3>Weapons</h3>"
    + table(WEAPONS, ["Weapon", "Class", "SP", "Rch", "Dmg", "CL", "CS", "Dis", "T", "Enc", "Rng", "Notes"],
            lambda w: [w[0], w[1], w[2], w[3], w[4], w[5], w[6], w[7], w[8], w[9], w[10], w[11]])
    + "<h3>Shields</h3>"
    + table(SHIELDS, ["Shield", "SP", "AP", "ShB", "Enc", "Notes"], lambda s: list(s))
    + "<h3>Armor</h3>"
    + table(ARMOR, ["Armor", "SP", "AP", "Bulk", "Training?", "Sund", "Penalties", "Description"], lambda a: list(a))
    + "<h3>Improvised weapons</h3>"
    "<p>Light-sized improvised item: 1 damage. Medium: 2. Heavy: 3. It can also reduce damage as a shield, 1 AP small, 2 medium, 3 large. "
    "Improvised weapons are destroyed the first time they cause or reduce any damage.</p>"
)

payload = {"weapons": weapons, "shields": shields, "armor": armor, "journal": journal}

js = """/*
 * THE BROKEN EMPIRES - EQUIPMENT INSTALLER for Foundry VTT (v11-v14)
 * Paste into a new Script macro and run once as GM. Safe to re-run: it replaces
 * items it created earlier with the same name.
 * Creates real weapon/armor/shield Items (the native the-broken-empires system's
 * DataModel types) in the folders TBE Weapons and TBE Armor & Shields, plus a
 * reference journal with the full book tables (SP/Bulk/Training/etc, which have
 * no mechanical field, live in flags.tbe for that reference only).
 */
const TBE_EQUIP = %s;

(async () => {
  if (!game.user.isGM) return ui.notifications.error("Run the TBE equipment installer as GM.");
  const errors = [];
  console.log("TBE | equipment install on " + game.version + " | system " + game.system.id);

  const getFolder = async (name) => {
    try {
      const found = game.folders.find((f) => f.name === name && f.type === "Item");
      return found ?? (await Folder.create({ name, type: "Item" }));
    } catch (err) {
      console.error("TBE | folder failed", err);
      return null;
    }
  };
  const wFolder = await getFolder("TBE Weapons");
  const aFolder = await getFolder("TBE Armor & Shields");

  const make = async (entry, folder) => {
    const system = { description: entry.desc };
    if (entry.kind === "weapon") {
      Object.assign(system, {
        dmg: entry.dmg, nl: !!entry.nl, cl: entry.cl, cs: entry.cs, dis: entry.dis, t: entry.t,
        skillName: entry.skillName || "", ranged: !!entry.ranged, enc: entry.enc || 0
      });
    } else if (entry.kind === "shield") {
      system.ap = entry.ap;
      system.enc = entry.enc || 0;
      system.shb = entry.shb === undefined ? null : entry.shb;
    } else if (entry.kind === "armor") {
      system.ap = entry.ap;
      system.bulk = entry.bulk || 0;
    }
    const data = { name: entry.name, type: entry.kind, system, flags: { tbe: entry.stats } };
    if (folder) data.folder = folder.id;
    const old = game.items.find((i) => i.name === entry.name && i.folder?.id === folder?.id);
    if (old) await old.delete();
    try {
      await Item.create(data);
      return true;
    } catch (err) {
      console.error("TBE | item failed: " + entry.name, err);
      errors.push(entry.name);
      return false;
    }
  };

  let count = 0;
  for (const e of TBE_EQUIP.weapons) if (await make(e, wFolder)) count++;
  for (const e of TBE_EQUIP.shields) if (await make(e, aFolder)) count++;
  for (const e of TBE_EQUIP.armor) if (await make(e, aFolder)) count++;

  try {
    const old = game.journal.getName("TBE Equipment Reference");
    if (old) await old.delete();
    await JournalEntry.create({
      name: "TBE Equipment Reference",
      pages: [{ name: "Weapons, shields, armor", type: "text", text: { content: TBE_EQUIP.journal, format: 1 } }]
    });
  } catch (err) {
    console.error("TBE | journal failed", err);
    errors.push("reference journal");
  }

  const msg = "TBE equipment: " + count + " items created" + (errors.length ? ", " + errors.length + " failed (console F12)" : "") + ".";
  if (errors.length) ui.notifications.error(msg);
  else ui.notifications.info(msg);
})();
""" % json.dumps(payload)

json.dump(payload, open("data/equipment_docs.json", "w"), indent=1)
open("TBE-Equipment-Installer.js", "w").write(js)
print("wrote TBE-Equipment-Installer.js", round(len(js) / 1024, 1), "KB;",
      len(weapons), "weapons,", len(shields), "shields,", len(armor), "armor")
