/* Create: the one write (v0.52.0).
 *
 * buildPayload() turns derive()'s character into Items and one actor update,
 * and computes nothing a player could see differently on the live sheet:
 * every number is read off `ch`. writeCharacter() asks the permission owner
 * first and does no damage when the answer is no (CLAUDE.md rule 6 and the
 * multiplayer rule 2): a player building a character they do not own gets a
 * sentence, and the actor is left as it was.
 *
 * Kept free of Foundry globals; the window passes in what it needs.
 */
import { talentItem } from "./rules.mjs";
import { lethalityLevel } from "../rules/lethality.mjs";
import { sourceLines } from "./sheet.mjs";

const num = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const LOC_LABEL = { head: "Head", body: "Body", rArm: "R Arm", lArm: "L Arm", rLeg: "R Leg", lLeg: "L Leg" };
export const WIPE_TYPES = ["skill", "talent", "weapon", "armor", "shield", "strand", "thread"];

/** An equipment row from the slim table as an Item. Also used by the sheet's shop (shop.mjs). */
export function gearItem(row, loc) {
  const system = { description: row.desc || "" };
  if (row.kind === "weapon") {
    Object.assign(system, { dmg: num(row.dmg, 1), nl: !!row.nl, cl: num(row.cl, 3), cs: num(row.cs, 3), dis: num(row.dis, 4), t: num(row.t, 5),
      skillName: row.skillName || "", ranged: !!row.ranged, enc: num(row.enc, 1) });
  } else if (row.kind === "shield") {
    Object.assign(system, { ap: num(row.ap, 0), enc: num(row.enc, 1), shb: row.shb ?? null });
  } else {
    const locations = {};
    for (const k of Object.keys(LOC_LABEL)) locations[k] = k === loc;
    Object.assign(system, { ap: num(row.ap, 0), bulk: num(row.bulk, 0), locations, equipped: true });
  }
  return {
    name: row.name + (row.kind === "armor" ? " (" + (LOC_LABEL[loc] || loc) + ")" : ""),
    type: row.kind, img: row.kind === "weapon" ? "icons/svg/sword.svg" : "icons/svg/shield.svg", system
  };
}

/**
 * @param ch     derive()'s character
 * @param d      the draft
 * @param T      the tables
 * @param o      { actor: {name, type, system}, open: [strings still undecided], dagger: item data or null }
 * @returns { items, update, notes, summary }
 */
export function buildPayload(ch, d, T, o = {}) {
  const actor = o.actor || {};
  const isChar = (actor.type || "character") === "character";
  const notes = [];
  const items = [];

  const skill = (group, name, value, extra) => ({ name, type: "skill", system: Object.assign({ group, value: Math.max(0, num(value)), fighting: group === "Combat" }, extra || {}) });
  for (const [name, v] of Object.entries(ch.skills)) items.push(skill(v.group, name, v.value, { fighting: !!v.fighting, expertise: num(v.expertise), savvy: !!v.savvy }));
  for (const x of ch.extraSkills) items.push(skill(x.group, x.name, x.value, { expertise: num(x.expertise), savvy: !!x.savvy }));

  const strandDesc = Object.fromEntries((T.magic?.strands || []).map((s) => [s.name, s.desc]));
  for (const s of ch.strands) {
    items.push({ name: s.name, type: "strand", img: "icons/svg/daze.svg", system: { level: s.level, thin: !!s.thin, description: "<p>" + esc(strandDesc[s.name] || "") + "</p>" } });
  }
  if (ch.thread) {
    items.push({ name: ch.thread.name, type: "thread", img: "icons/svg/lightning.svg",
      system: { attunement: ch.thread.attunement, kind: "die", die: "d8", pool: 0, bonus: 0, expended: false,
        description: "<p>A d8 Thread Die attuned to the " + esc(ch.thread.kind) + " " + esc(ch.thread.attunement) + ", chosen at character creation.</p>" } });
  }

  for (const t of ch.talents) {
    const rec = (T.talents || []).find((x) => x.name === t.name);
    if (!rec) { notes.push("Talent '" + t.name + "' is not in the catalogue; add it by hand."); continue; }
    const it = talentItem(rec, t.specialization && rec.rank === "per-skill" ? t.specialization : "");
    it.system.ranks = Math.max(1, num(t.ranks, 1));
    it.system.specialization = t.specialization || "";
    items.push(it);
  }
  if (ch.identity.pattern === "fade") notes.push("Faded Pattern uses TWO of your starting Talent selections (p.48); if you took both free picks as well, drop one.");

  const E = T.equipment || {};
  const find = (kind, name) => (kind === "armor" ? E.armor : kind === "shield" ? E.shields : E.weapons || []).find((x) => x.name === name);
  const dagger = o.dagger || (find("weapon", "Dagger") ? gearItem(find("weapon", "Dagger")) : null);
  if (dagger) items.push(dagger); else notes.push("Starting Dagger: not found in the equipment table; add one by hand.");
  for (const a of ch.equipment.freeArmor) { const row = find("armor", a.name); if (row) items.push(gearItem(row, a.loc)); }
  for (const p of ch.equipment.bought) {
    const row = find(p.kind, p.name);
    if (!row) { notes.push("Bought " + p.name + ": not in the equipment table; add it by hand."); continue; }
    for (let i = 0; i < (p.kind === "armor" ? 1 : p.qty); i++) items.push(gearItem(row, p.loc));
  }

  const A = ch.attributes;
  const pieces = ch.equipment.freeArmorPieces;
  const piecesLeft = pieces === null ? 0 : Math.max(0, pieces - ch.equipment.freeArmor.length);
  if (pieces === null) notes.push("Starting armour: not rolled. Roll 1d3+1 and claim the pieces with Buy equipment on the sheet's Gear tab.");
  else if (piecesLeft) notes.push("Starting armour: " + piecesLeft + " free piece(s) still to claim with Buy equipment on the sheet's Gear tab.");
  if (ch.silver.total === null) notes.push("Starting silver: " + ch.silver.parts.filter((p) => p.value === null).map((p) => p.label + " " + p.dice).join(", ") + " not rolled.");
  const race = (T.chargen.races || []).find((r) => r.name === ch.identity.race) || {};
  if (race.toughnessCap !== null && race.toughnessCap !== undefined) notes.push(race.name + " can never exceed Toughness " + race.toughnessCap + ".");
  for (const r of race.restrictions || []) notes.push(r);
  if (race.bonus) notes.push(race.bonus);
  const all = notes.concat(ch.notes).concat((o.open || []).map((x) => "Still to decide: " + x));

  const update = {
    "system.race": ch.identity.race, "system.career": ch.identity.career, "system.culture": ch.identity.culture,
    "system.size": ch.identity.size || "Medium", "system.toughness": A.toughness.value,
    "system.deathThreshold.value": A.deathThreshold.value, "system.deathThreshold.max": A.deathThreshold.value,
    "system.resolve.value": A.resolveMax.value, "system.resolve.max": A.resolveMax.value,
    "system.initiative": A.initiative.value, "system.lethalityBonus": A.lethalityBonus.value, "system.fatigue": 0,
    "system.silver": ch.silver.left === null ? Math.max(0, num(ch.silver.total)) : Math.max(0, ch.silver.left),
    /* Never lower a Status the character already earned in play. */
    "system.status": Math.max(num(actor.system?.status, 0), A.status.value),
    "system.supply.gear": 12, "system.supply.ammo": 12, "system.supply.rations": 12, "system.supply.medical": 12,
    "system.enc.invBonus": A.invBonus.value,
    "flags.the-broken-empires.freeArmor": piecesLeft
  };
  if (ch.identity.name) { update.name = ch.identity.name; update["prototypeToken.name"] = ch.identity.name; }
  /* The portrait (a roll aid, or picked by hand) is the actor's image and its
     token's. The token set-up follows the table defaults (table-defaults.mjs):
     a Character's token linked to its actor and able to see. */
  if (ch.identity.portrait) { update.img = ch.identity.portrait; update["prototypeToken.texture.src"] = ch.identity.portrait; }
  if (isChar && o.link) update["prototypeToken.actorLink"] = true;
  if (isChar && o.vision) update["prototypeToken.sight.enabled"] = true;
  if (isChar) {
    update["system.pattern"] = ch.identity.pattern;
    update["system.convocation"] = ch.identity.convocation;
    update["system.trueName"] = ch.identity.trueName;
    if (ch.personality.length) update["system.personalityTraits"] = ch.personality.slice();
    if (ch.goals.length) update["system.goals"] = ch.goals.map((g) => ({ text: g.text, kind: g.kind, done: false }));
  }
  if (isChar && d.seedNotes) {
    update["system.notes"] = "<h3>Concept</h3><p>" + esc(ch.identity.concept) + "</p>" +
      "<p>" + [ch.identity.race, ch.identity.culture, ch.identity.career].filter(Boolean).map(esc).join(", ") + "</p>" +
      (all.length ? "<h3>Still to decide</h3><ul>" + all.map((n) => "<li>" + esc(n) + "</li>").join("") + "</ul>" : "") +
      "<h3>Life Events</h3><p>" + ["origin", "youth", "recent"].map((k) => (d.lifeEvents || {})[k] ? k + ": " + esc(d.lifeEvents[k].name) : null).filter(Boolean).join("<br>") + "</p>" +
      (ch.relationshipNpcs.length ? "<h3>Relationships</h3><ul>" + ch.relationshipNpcs.map((n) => "<li>" + esc(n.type) + (n.name ? ": " + esc(n.name) : "") + (n.note ? ", " + esc(n.note) : "") + "</li>").join("") + "</ul>" : "") +
      ((d.sharedHistory || []).some((s) => s && s.skill) ? "<h3>Shared History</h3><ul>" + d.sharedHistory.filter((s) => s && s.skill).map((s) => "<li>" + esc(s.with || "?") + ": +5 " + esc(s.skill) + "</li>").join("") + "</ul>" : "") +
      "<h3>Personality</h3><p>" + ch.personality.map(esc).join(", ") + "</p>";
  }
  if (isChar) {
    /* A record of how the character was built, on the actor. Finish
       Character's Summary tab read it; since that retired (v0.53.0) it is
       kept as the record, and the Notes tab carries the same for people. */
    const bySource = (prefix) => Object.entries(ch.skills).flatMap(([n, v]) => (v.sources || []).filter((s) => s.label.startsWith(prefix))
      .map((s) => n + (s.delta ? " " + (s.delta > 0 ? "+" : "") + s.delta : "") + (s.expertise ? " Ex" + s.expertise : "") + (s.savvy ? " S" : "")));
    update["flags.the-broken-empires.chargenLedger"] = {
      ts: Date.now(), race: ch.identity.race, career: ch.identity.career, cultureName: ch.identity.culture,
      concept: ch.identity.concept, personality: ch.personality.slice(),
      skillPoints: ch.careerPoints.map((c) => c.cat + " " + c.allocated + "/" + c.pool),
      racial: bySource("Race:"), ability: bySource("Ability Score"), cultureApplied: bySource("Culture:"), roundingOut: bySource("Rounding Out"),
      talents: ch.talents.map((t) => t.name + (t.ranks > 1 ? " ×" + t.ranks : "")),
      silver: { parts: ch.silver.parts.map((p) => p.label + (p.dice ? " " + p.dice : "") + " → " + (p.value === null ? "not rolled" : p.value)), total: ch.silver.total ?? 0 },
      stats: { toughness: A.toughness.value, dt: A.deathThreshold.value, resolveMax: A.resolveMax.value, initiative: A.initiative.value },
      stillToDecide: all.slice()
    };
  }

  const ll = lethalityLevel(A.deathThreshold.value, A.lethalityBonus.value, 0);
  const summary = "<div><b>" + esc(ch.identity.name || actor.name || "") + "</b>: " + [ch.identity.race, ch.identity.career].filter(Boolean).map(esc).join(" ") + "</div>" +
    "<div>Toughness <b>" + A.toughness.value + "</b>, Death Threshold <b>" + A.deathThreshold.value + "</b> (LL " + ll + "), Resolve <b>" + A.resolveMax.value +
    "</b>, Initiative <b>" + (A.initiative.value >= 0 ? "+" : "") + A.initiative.value + "</b>, Status <b>" + update["system.status"] + "</b>.</div>" +
    (ch.talents.length ? "<div>Talents: " + ch.talents.map((t) => esc(t.name) + (t.ranks > 1 ? " ×" + t.ranks : "")).join(", ") + ".</div>" : "") +
    "<div>Silver: <b>" + update["system.silver"] + " sp</b>.</div>" +
    (all.length ? '<div style="font-size:11px;opacity:.85">' + all.length + " thing(s) still to decide, listed in Notes.</div>" : "");
  return { items, update, notes: all, summary };
}

/**
 * @param actor  the Actor
 * @param payload buildPayload()'s result
 * @param deps   { canWrite(actor), wipe: bool }
 * @returns { ok, notice, created, removed }
 */
export async function writeCharacter(actor, payload, deps) {
  if (!actor) return { ok: false, notice: "No actor to build. Open the window from a character you own." };
  if (!deps.canWrite(actor)) {
    return { ok: false, notice: "You do not have permission to change " + actor.name + ". Ask your GM to give you ownership, or to create the character for you. Nothing was changed; your draft is kept." };
  }
  let removed = 0;
  if (deps.wipe) {
    const ids = (actor.items?.contents ?? Array.from(actor.items ?? [])).filter((i) => WIPE_TYPES.includes(i.type)).map((i) => i.id);
    if (ids.length) { await actor.deleteEmbeddedDocuments("Item", ids); removed = ids.length; }
  }
  const made = await actor.createEmbeddedDocuments("Item", payload.items);
  await actor.update(payload.update);
  return { ok: true, notice: null, created: made?.length ?? payload.items.length, removed };
}

export { sourceLines };
