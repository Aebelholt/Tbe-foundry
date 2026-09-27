/* Character-creation rules the system owns (v0.52.0).
 *
 * These lived only in the macro library (macros/_lib.js), which the system
 * cannot import. The new character creation window runs in the system, so it
 * needs them here. Owner going forward: THIS file. The macro library keeps
 * its copies because every macro is a flat script that cannot import either;
 * creator_check.mjs holds the two equal, name for name and case for case
 * (the "mirror with an enforced equality check" pattern in ROADMAP.md).
 *
 * Nothing here reads a Foundry global.
 */

const num = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

/** The skill catalogue by category (Ch.3, verified by funnel_check.mjs). */
export const SKILL_GROUPS = {
  Combat: ["Dodge", "Melee: Light", "Melee: Medium", "Melee: Heavy", "Might", "Missile", "Thrown"],
  Adventuring: ["Athletics", "Endurance", "Locks & Traps", "Perception", "Ride", "Sail/Boat",
    "Sleight of Hand", "Stealth", "Survival", "Track", "Willpower"],
  Social: ["Deceive", "Insight", "Inspire", "Intimidate", "Perform", "Persuade", "Protocol", "Seduce", "Wit"],
  Lore: ["Ancient Lore", "Arcana", "Commerce", "Common Lore", "Craft: Artistic", "Craft: Practical",
    "Divinity", "Heal", "Naturewise", "Streetwise"]
};
export const SKILL_ALL = Object.values(SKILL_GROUPS).flat();

/** Ch.7 p.104: a skill with no value "begins at 20". */
export const BASE_SKILL = 20;
/** p.80: "During character creation, no skill can be increased beyond 70 for any reason." */
export const CHARGEN_SKILL_CAP = 70;

export const skillGroup = (name) => Object.keys(SKILL_GROUPS).find((g) => SKILL_GROUPS[g].includes(name)) || null;

/** Expertise ladder: there is no Ex0 or Ex1 (p.53), so the first step lands on Ex2, up to Ex4. */
export const raiseExpertise = (cur) => (num(cur, 0) === 0 ? 2 : Math.min(4, num(cur, 0) + 1));

/** Ability Scores (p.85-86): +5 to each listed skill, one Expertise level to one of them. */
export function applyAbilityScore(values, score, exSkill, cap) {
  if (!score || !values) return null;
  const ceiling = num(cap, 0) || CHARGEN_SKILL_CAP;
  for (const sk of score.skills || []) {
    if (values[sk]) values[sk].value = Math.min(ceiling, num(values[sk].value, 0) + 5);
  }
  if (exSkill && values[exSkill]) values[exSkill].expertise = raiseExpertise(values[exSkill].expertise);
  return score.name + " (+5 to " + (score.skills || []).join(", ") + (exSkill ? ", Ex to " + exSkill : "") + ")";
}

/** A Talent by name; a trailing rank ("Armor Training III") finds the "(I-IV)" entry. */
export function talentNamed(catalogue, name) {
  const key = String(name || "").trim().toLowerCase();
  if (!key) return null;
  const exact = (catalogue || []).find((t) => String(t.name).toLowerCase() === key);
  if (exact) return exact;
  const m = key.match(/^(.*?)\s+(i{1,3}|iv)$/);
  if (!m) return null;
  return (catalogue || []).find((t) => String(t.name).toLowerCase().startsWith(m[1] + " (")) || null;
}

/** The Item a Talent becomes, carrying its transfer:true ActiveEffects. */
export function talentItem(row, spec) {
  const t = row || {};
  const perX = t.rank === "per-skill";
  return {
    name: t.name + (perX && spec ? " (" + spec + ")" : ""),
    type: "talent",
    img: "icons/svg/upgrade.svg",
    system: {
      category: t.category || "", requirements: t.requires || "",
      ranks: 1, maxRanks: t.rank, specialization: spec || "",
      sub: !!t.sub, description: t.desc ? "<p>" + t.desc + "</p>" : ""
    },
    effects: (t.effects || []).map((e) => Object.assign({}, e, {
      changes: (e.changes || []).map((c) => Object.assign({}, c))
    }))
  };
}

/**
 * Why a Talent cannot be taken, or null. The same rules TBE: Talents and
 * Finish Character apply (macros/_lib.js TBE.talentEligibility), less the
 * one that does not hold during creation: a "character creation only"
 * Talent is exactly what creation may take.
 */
export function talentBlockedAtCreation(catalogue, t, ownedLower, raceName, allRaces) {
  const raceRec = (allRaces || []).find((r) => r.name === raceName) || null;
  const mine = new Set((raceRec?.exclusiveTalents ?? []).map((x) => x.toLowerCase()));
  const all = new Set((allRaces || []).flatMap((r) => r.exclusiveTalents || []).map((x) => x.toLowerCase()));
  const lname = t.name.toLowerCase();
  if (all.has(lname) && !mine.has(lname)) return "exclusive to another race";
  if (ownedLower.has(lname) && t.rank === "once") return "already taken";
  if (!t.requires) return null;
  const req = String(t.requires).toLowerCase().replace(/\([^)]*\bnot require[^)]*\)/g, "");
  const named = (catalogue || []).map((x) => x.name.toLowerCase()).filter((n) => n.length > 4 && n !== lname)
    .sort((a, b) => b.length - a.length).find((n) => req.includes(n));
  return named && !ownedLower.has(named) ? "requires " + t.requires : null;
}

/**
 * A die result against a table's written ranges. The book writes the top of
 * a range as "0" (d10 "9-0") or "00" (d100 "99-00"), meaning the die's max
 * face, so a trailing 0 is read as `max`. Same reading as the Wizard's
 * parseD100Range/forRoll, held equal by creator_check.mjs.
 */
export function parseRange(s, max = 100) {
  if (s === "00" || s === "0") return [max, max];
  const m = String(s).match(/(\d+)\s*-\s*(\d+)/);
  if (m) {
    const lo = parseInt(m[1], 10);
    let hi = parseInt(m[2], 10);
    if (hi === 0) hi = max;
    return [lo, hi];
  }
  const n = parseInt(s, 10);
  return [n, n];
}
export function rowForRoll(table, roll, key = "range", max = 100) {
  for (const r of table || []) {
    const [lo, hi] = parseRange(r[key] ?? r.range ?? r.d100, max);
    if (roll >= lo && roll <= hi) return r;
  }
  return null;
}

/**
 * Two d6 on the Ability Score list. A double steps the second pick to the
 * next score, so the two are always different (macros/_lib.js
 * TBE.rollAbilityPair, held equal over all 36 pairs by creator_check.mjs).
 */
export function abilityPairFromRolls(list, r1, r2) {
  const L = list || [];
  if (!L.length) return [null, null];
  const idx = (n) => Math.max(0, Math.min(L.length - 1, n - 1));
  const first = L[idx(r1)] || null;
  const second = r2 === r1 ? (L[(idx(r2) + 1) % L.length] || null) : (L[idx(r2)] || null);
  return [first, second];
}

/**
 * Which armour a character may take as a FREE starting piece (p.109: "as long
 * as they have whatever training the armor requires"). Armor Training is
 * levelled, lightest first (Ch.4): I Reinforced Leather, II Mail, III Scale,
 * IV Plate. An Ogre's one rank covers Bone only (Ch.5). Bone is not on the
 * ladder; any rank covers it, as TBE: Finish Character has always read it.
 */
export const ARMOR_LADDER = ["Reinforced Leather", "Mail", "Scale", "Plate"];
export function armorAllowedFree(armor, talents, raceName) {
  if (String(armor?.training || "-").toUpperCase() !== "Y") return true;
  const at = (talents || []).find((t) => /^armor training/i.test(t.name));
  const ranks = at ? Math.max(1, num(at.ranks, 1)) : 0;
  if (!ranks) return false;
  if (raceName === "Ogre") return armor.name === "Bone";
  if (armor.name === "Bone") return true;
  const i = ARMOR_LADDER.indexOf(armor.name);
  return i > -1 && i < ranks;
}
