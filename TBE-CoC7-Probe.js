/*
 * TBE PROBE — reads how this game system actually stores actors and items.
 * Paste into a new Script macro, run once as GM.
 * It creates two temporary documents in a folder called "TBE Probe", reads their
 * real field structure, deletes them again, then downloads a file called
 * tbe-probe.json. Send me that file.
 * Nothing else in your world is touched.
 */
(async () => {
  if (!game.user.isGM) return ui.notifications.error("Run the probe as GM.");

  const trim = (obj, depth = 0) => {
    if (obj === null || typeof obj !== "object") return obj;
    if (depth > 6) return "...";
    if (Array.isArray(obj)) return obj.slice(0, 3).map((o) => trim(o, depth + 1));
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (["_id", "_stats", "ownership", "flags", "img", "prototypeToken", "effects"].includes(k)) continue;
      out[k] = trim(v, depth + 1);
    }
    return out;
  };

  const probe = {
    foundry: game.version,
    generation: game.release?.generation ?? null,
    system: { id: game.system.id, version: game.system.version, title: game.system.title },
    actorTypes: game.documentTypes?.Actor ?? [],
    itemTypes: game.documentTypes?.Item ?? [],
    modelActor: {},
    modelItem: {},
    live: {},
    existing: {},
    notes: []
  };

  /* 1. Declared data model, if this build exposes one. */
  try {
    const model = game.model ?? game.system?.model ?? null;
    if (model) {
      for (const t of Object.keys(model.Actor ?? {})) probe.modelActor[t] = trim(model.Actor[t]);
      for (const t of Object.keys(model.Item ?? {})) probe.modelItem[t] = trim(model.Item[t]);
    } else {
      probe.notes.push("game.model not available on this build");
    }
  } catch (err) {
    probe.notes.push("model read failed: " + err.message);
  }

  /* 2. Live documents: create, read the real shape, delete. */
  let folder = null;
  try {
    folder = await Folder.create({ name: "TBE Probe", type: "Actor" });
  } catch (err) {
    probe.notes.push("probe folder failed: " + err.message);
  }

  const wanted = {
    actor: ["creature", "npc", "character"].filter((t) => (game.documentTypes?.Actor ?? []).includes(t)),
    item: ["weapon", "skill", "item"].filter((t) => (game.documentTypes?.Item ?? []).includes(t))
  };

  for (const type of wanted.actor) {
    try {
      const a = await Actor.create({ name: "TBE probe " + type, type, folder: folder?.id });
      probe.live["actor:" + type] = trim(a.toObject().system);
      /* what does a freshly created actor of this type carry as embedded items? */
      probe.live["actor:" + type + ":items"] = a.items.map((i) => ({ name: i.name, type: i.type })).slice(0, 5);
      await a.delete();
    } catch (err) {
      probe.notes.push("actor " + type + " failed: " + err.message);
    }
  }

  for (const type of wanted.item) {
    try {
      const i = await Item.create({ name: "TBE probe " + type, type });
      probe.live["item:" + type] = trim(i.toObject().system);
      await i.delete();
    } catch (err) {
      probe.notes.push("item " + type + " failed: " + err.message);
    }
  }

  if (folder) { try { await folder.delete(); } catch (err) { probe.notes.push("folder cleanup: " + err.message); } }

  /* 3. What my bestiary install actually produced, and one hand-built reference if present. */
  try {
    const rat = game.actors.getName("Rat, Giant");
    if (rat) {
      probe.existing.rat = trim(rat.toObject().system);
      probe.existing.ratItems = rat.items.map((i) => ({
        name: i.name, type: i.type, system: trim(i.toObject().system)
      })).slice(0, 4);
    } else {
      probe.notes.push("no actor named 'Rat, Giant' found");
    }
  } catch (err) {
    probe.notes.push("rat read failed: " + err.message);
  }

  /* 4. Any actor you built by hand is the most useful reference of all. */
  try {
    const handmade = game.actors.contents.filter((a) => !a.folder || a.folder.name !== "TBE Bestiary");
    probe.existing.otherActors = handmade.slice(0, 6).map((a) => ({
      name: a.name, type: a.type, itemTypes: [...new Set(a.items.map((i) => i.type))]
    }));
    const withWeapon = handmade.find((a) => a.items.some((i) => i.type === "weapon"));
    if (withWeapon) {
      const w = withWeapon.items.find((i) => i.type === "weapon");
      probe.existing.sampleWeapon = { owner: withWeapon.name, name: w.name, system: trim(w.toObject().system) };
    }
    const withSkill = handmade.find((a) => a.items.some((i) => i.type === "skill"));
    if (withSkill) {
      const s = withSkill.items.find((i) => i.type === "skill");
      probe.existing.sampleSkill = { owner: withSkill.name, name: s.name, system: trim(s.toObject().system) };
    }
  } catch (err) {
    probe.notes.push("handmade read failed: " + err.message);
  }

  const json = JSON.stringify(probe, null, 1);
  console.log("TBE PROBE", probe);

  const save = globalThis.saveDataToFile ?? foundry?.utils?.saveDataToFile ?? null;
  if (save) {
    save(json, "application/json", "tbe-probe.json");
    ui.notifications.info("TBE probe done. tbe-probe.json downloaded, send it to Claude.");
  } else {
    await JournalEntry.create({
      name: "TBE Probe Output",
      pages: [{ name: "JSON", type: "text", text: { content: "<pre>" + json.replace(/</g, "&lt;") + "</pre>", format: 1 } }]
    });
    ui.notifications.info("TBE probe done. See the journal 'TBE Probe Output' and copy its contents.");
  }
})();
