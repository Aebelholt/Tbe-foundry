/*
 * Zone Hazards (Ch.10, pp.151-152). THE OWNER of what each hazard does to a
 * roll, and of where hazards live in the world.
 *
 * Storage: a Scene Region carries its hazards as a flag,
 *   flags["the-broken-empires"].hazards = { confined: true, obscured: true, damaging: 12, ... }
 * set by the GM through TBE: Zone Hazards. Regions are the same zones Zone
 * Movement / Alternate Zone Movement count, so one drawing does both jobs.
 * "It is always the GM who decides what hazard, if any, is applied to a zone"
 * (p.151): nothing here guesses a hazard from a Region's name or look.
 *
 * Only two hazards change an attack's numbers, and the book gives both as -20:
 *   Confined: "-20 penalty to all Dodge and Melee: Heavy skill rolls"
 *   Obscured: "ranged attacks against that target suffer -20" when the target
 *             "cannot be clearly seen through an Obscured zone"
 * The rest are reminders. Every modifier is OFFERED pre-ticked, never forced:
 * whether a target can be "clearly seen", and whether dense fog blocks line of
 * sight outright, are the GM's calls.
 *
 * A rule module does not reach for ambient state (CLAUDE.md, visibility): the
 * caller passes the regions and the point-in-region test.
 */
export const SCOPE = "the-broken-empires";

export const HAZARDS = {
  confined: { label: "Confined", page: 151,
    quote: "A Confined zone is cramped or restrictive, and forces a -20 penalty to all Dodge and Melee: Heavy skill rolls." },
  rough: { label: "Rough", page: 151,
    quote: "A Rough zone has precarious footing that affects Athletics rolls.",
    note: "Charging needs an Athletics roll (fail: no +20); Running into or from it needs Athletics (fail: Prone); Drive Back into it: opposed Athletics or Prone." },
  obscured: { label: "Obscured", page: 151,
    quote: "When a target cannot be clearly seen through an Obscured zone, ranged attacks against that target suffer -20.",
    note: "In especially dense conditions the GM may rule it blocks line of sight entirely." },
  blocked: { label: "Blocked", page: 152,
    quote: "A Blocked zone is difficult to enter or leave.",
    note: "A roll (usually Endurance) to enter or leave; failure means you cannot this round, or it takes the whole turn." },
  damaging: { label: "Damaging", page: 152,
    quote: "A Damaging zone inflicts damage upon anyone who starts in or enters the zone.",
    note: "Context roll opposed by the zone's damage: fail takes it all, success reduces it by SLs. External damage: AP applies." },
  other: { label: "Other", page: 152,
    quote: "Starting in, or entering, such a zone requires a context-based roll to avoid the zone's effects." }
};

export const PENALTY = -20;

/** The hazards a Region carries, as [{key, damage?}]. Unknown keys ignored. */
export function hazardsOf(region) {
  const raw = region?.flags?.[SCOPE]?.hazards ?? region?.getFlag?.(SCOPE, "hazards") ?? null;
  if (!raw || typeof raw !== "object") return [];
  const out = [];
  for (const key of Object.keys(HAZARDS)) {
    const v = raw[key];
    if (v === true || (typeof v === "number" && v > 0)) out.push(key === "damaging" && typeof v === "number" ? { key, damage: v } : { key });
  }
  return out;
}

/** Keys of every hazard at a point. */
export function hazardsAt(regions, point, inside) {
  const keys = new Set();
  for (const r of regions ?? []) {
    const hz = hazardsOf(r);
    if (hz.length && inside(r, point)) for (const h of hz) keys.add(h.key);
  }
  return keys;
}

/** Points along a segment, both ends included. */
export function samplePoints(a, b, n = 16) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, elevation: a.elevation ?? 0 });
  }
  return pts;
}

/**
 * Everything the zones mean for one attack, before the weapon and defence are
 * chosen. Returns candidate modifiers, each with the condition under which it
 * applies, and plain reminders for the hazards that are not modifiers.
 *
 * @param {object} o
 * @param {object[]} o.regions   the scene's Regions
 * @param {Function} o.inside    (region, {x,y,elevation}) => boolean
 * @param {object} o.attacker    {x, y, elevation}
 * @param {object} o.target      {x, y, elevation}
 * @param {string} o.attackerName
 * @param {string} o.targetName
 */
export function attackHazards(o) {
  const at = hazardsAt(o.regions, o.attacker, o.inside);
  const tg = hazardsAt(o.regions, o.target, o.inside);
  /* Obscured counts into, out of, or through: any obscured Region on the line. */
  const obscuredRegions = (o.regions ?? []).filter((r) => hazardsOf(r).some((h) => h.key === "obscured"));
  const line = samplePoints(o.attacker, o.target);
  const obscuredOnLine = obscuredRegions.some((r) => line.some((p) => o.inside(r, p)));

  const mods = [];
  if (obscuredOnLine) {
    mods.push({ id: "obscured", side: "attack", value: PENALTY, when: { ranged: true },
      label: "Obscured zone between " + (o.attackerName || "attacker") + " and " + (o.targetName || "target") +
        ": " + PENALTY + " to a ranged attack",
      page: HAZARDS.obscured.page, note: "Untick if the target can be clearly seen. " + HAZARDS.obscured.note });
  }
  if (at.has("confined")) {
    mods.push({ id: "confined-atk", side: "attack", value: PENALTY, when: { skills: ["Melee: Heavy"] },
      label: (o.attackerName || "Attacker") + " is in a Confined zone: " + PENALTY + " to Melee: Heavy",
      page: HAZARDS.confined.page });
  }
  if (tg.has("confined")) {
    mods.push({ id: "confined-def", side: "defence", value: PENALTY, when: { skills: ["Dodge", "Melee: Heavy"] },
      label: (o.targetName || "Target") + " is in a Confined zone: " + PENALTY + " to Dodge or Melee: Heavy",
      page: HAZARDS.confined.page });
  }
  const notes = [];
  for (const [who, set] of [[o.attackerName || "Attacker", at], [o.targetName || "Target", tg]]) {
    for (const key of ["rough", "blocked", "damaging", "other"]) {
      if (set.has(key)) notes.push({ key, text: who + " is in a " + HAZARDS[key].label + " zone" +
        (HAZARDS[key].note ? ": " + HAZARDS[key].note : "."), page: HAZARDS[key].page });
    }
  }
  return { mods, notes, attackerHazards: [...at], targetHazards: [...tg], obscuredOnLine };
}

/* A skill counts as a named one when it is that skill or a "(Sub)" of it. */
const skillIs = (name, wanted) => {
  const n = String(name || "").toLowerCase();
  return wanted.some((w) => n === w.toLowerCase() || n.startsWith(w.toLowerCase() + " ("));
};

/**
 * Apply the candidates the GM left ticked, for the weapon and defence chosen.
 * @returns {{attack:number, defence:number, applied:object[], skipped:object[]}}
 */
export function resolveHazardMods(mods, { ticked, ranged, attackSkill, defenceSkill }) {
  const out = { attack: 0, defence: 0, applied: [], skipped: [] };
  for (const m of mods ?? []) {
    if (!ticked(m.id)) { out.skipped.push({ m, why: "unticked" }); continue; }
    const skill = m.side === "attack" ? attackSkill : defenceSkill;
    const ok = m.when?.ranged ? !!ranged : m.when?.skills ? skillIs(skill, m.when.skills) : true;
    if (!ok) { out.skipped.push({ m, why: "does not apply to this roll" }); continue; }
    out[m.side] += m.value;
    out.applied.push(m);
  }
  return out;
}

/**
 * Point-in-region test across Foundry's two shapes: V12's
 * testPoint(point, elevation) and V13's testPoint({x, y, elevation}).
 * Branch on the method's arity, never on a version number (rule 7).
 */
export function insideRegion(region, p) {
  const fn = region?.testPoint;
  if (typeof fn !== "function") return false;
  try {
    return fn.length >= 2
      ? !!fn.call(region, { x: p.x, y: p.y }, p.elevation ?? 0)
      : !!fn.call(region, { x: p.x, y: p.y, elevation: p.elevation ?? 0 });
  } catch (e) { return false; }
}
