import { SIZES, MEDIUM_SIZE, SIZE_STEP_EFFECTS, SIZE_COMBAT_RULES, RACES, CAREERS, TALENT_CATEGORIES }
  from "./chargen-data.mjs";
import { BINDS, BIND_INFO, STRANDS, STRAND_INFO, CONVOCATIONS,
  MAGIC_RULES, FRAYING_SYMPTOMS } from "./magic-data.mjs";

export const TBE = {};

TBE.SIZES = SIZES;
TBE.MEDIUM_SIZE = MEDIUM_SIZE;
TBE.SIZE_STEP_EFFECTS = SIZE_STEP_EFFECTS;
TBE.SIZE_COMBAT_RULES = SIZE_COMBAT_RULES;
TBE.RACES = RACES;
TBE.CAREERS = CAREERS;
TBE.TALENT_CATEGORIES = TALENT_CATEGORIES;
TBE.RACE_NAMES = RACES.map((r) => r.name);

/** Look up a race record by name. */
TBE.race = (name) => RACES.find((r) => r.name === name) ?? null;

/**
 * The combat consequences of a size gap, from the attacker's point of view.
 * gap > 0 means the DEFENDER is larger. Returns plain data so the Attack macro
 * can show its reasoning rather than silently nudging numbers.
 *
 * OWNERSHIP: this is the one owner. macros/_lib.js's TBE.sizeEffects() reads
 * this at runtime (CONFIG.TBE.sizeEffects, the same pattern TBE.rankCap() and
 * TBE.strandCap() use) and only computes its own copy when CONFIG isn't
 * around -- a Node test harness, or the legacy standalone macro pack outside
 * the native system. Before this, the two were a second, independent copy
 * that had already drifted twice (missed the v0.21.0 Lock fix, named the
 * attacker's reach `reach` where the macro named it `attackerReach`) and
 * were only pinned identical by a test, which catches drift after it's
 * written rather than making it impossible to write. audit_check.mjs now
 * asserts the deferral actually happens, not just that the two outputs
 * agree.
 */
TBE.sizeEffects = function (attackerSize, defenderSize) {
  const ai = SIZES.indexOf(attackerSize), di = SIZES.indexOf(defenderSize);
  if (ai < 0 || di < 0) return null;
  const gap = di - ai, abs = Math.abs(gap);
  return {
    gap, abs,
    attackerSize, defenderSize,
    /* "All Combat skills used against a creature 3+ Sizes larger are at +20." */
    toHit: gap >= 3 ? 20 : 0,
    /* "Melee attacks from a creature 3+ Sizes larger cannot be parried, only
       Dodged." On this attack that bites when the ATTACKER is the larger one. */
    defenderMustDodge: gap <= -3,
    /* "Drive Back, Trip and Disarm cannot be used against a creature 3+ Sizes
       larger." Lock carries the same threshold in its own entry (p.163:
       "Targets more than two Sizes larger than the attacker cannot be
       Locked"), which was written on a different page and so was never
       enforced -- more than two larger is three or more larger. */
    maneuversBlocked: gap >= 3 ? ["db", "trip", "dis", "lock"] : [],
    /* "+1 Reach per 2 Sizes larger than the opponent." */
    attackerReach: Math.trunc(Math.max(0, -gap) / 2),
    defenderReach: Math.trunc(Math.max(0, gap) / 2),
    /* "Grappling is only possible up to 2 Sizes larger or smaller." */
    grappleLegal: abs <= 2,
    /* "+20 Might per Size category of difference when Grappling" (to the larger). */
    grappleMight: abs * 20
  };
};

/**
 * Weapon Readiness (Ch.9 p.129) -- what state a weapon or shield is in, what it
 * costs to get it into your hand, and WHICH ENCUMBRANCE POOL IT COUNTS AGAINST.
 *
 * The book names three states verbatim:
 *   "Weapons can be in one of three states:
 *      Held and Ready: Already in your hand, no action needed
 *      At Hand: Drawn by Performing a Minor Action (must fit within your 6 ENC
 *        of Weapons At Hand)
 *      Stored: In Inventory, takes 2 full actions to retrieve."
 * and then, as bullets under them:
 *   "Dropping a weapon is a free action."
 *   "Drawing, sheathing, or picking a weapon up off the ground is an action
 *    (Perform a Minor Action)."
 *
 * `dropped` is therefore NOT a fourth state the book names -- it is the weapon
 * not being carried at all, which the book describes through those two actions
 * rather than in the list. It is modelled here as a fourth `carried` value
 * because a single enum cannot go inconsistent, where a separate "on the
 * ground" boolean alongside the three states could encode "stored AND dropped".
 * Saying which is the book's and which is ours, out loud, is the point of this
 * comment; do not let a later reader mistake `dropped` for RAW.
 *
 * OWNERSHIP, and the bug this exists to prevent: "which pool does a carry state
 * count toward" was implemented twice, inline, as a NEGATIVE filter --
 * `(carried ?? 'hand') !== 'stored'` in both `actor-sheet.mjs`'s `_prepareEnc()`
 * and `_lib.js`'s `encStatus()`. That reads an open enum as a binary, so the
 * moment a fourth value existed, a weapon lying on the ground would have
 * counted against the 6 ENC Weapons At Hand pool in the sheet AND in every
 * macro, silently, with no error anywhere. Two implementations of one rule,
 * about to drift the instant the rule grew -- exactly the class the ownership
 * discipline in CLAUDE.md exists for. The mapping now has one owner; both
 * callers ask it rather than re-deriving it.
 *
 * `POOLS.none` is load that is on the floor: it belongs to neither pool. That
 * is the whole answer to "removing load when not explicitly carried".
 */
TBE.CARRY_POOL = { HAND: "hand", INVENTORY: "inventory", NONE: "none" };

TBE.READINESS = {
  ready:   { label: "Held and Ready", short: "held",    pool: TBE.CARRY_POOL.HAND,
             cost: "no action needed" },
  hand:    { label: "At Hand",        short: "at hand", pool: TBE.CARRY_POOL.HAND,
             cost: "a Minor Action to draw" },
  stored:  { label: "Stored",         short: "stored",  pool: TBE.CARRY_POOL.INVENTORY,
             cost: "2 full actions to retrieve from Inventory" },
  dropped: { label: "Dropped",        short: "dropped", pool: TBE.CARRY_POOL.NONE,
             cost: "free to drop; a Minor Action to pick up, or an Athletics roll if Engaged" }
};

/** The readiness record for an item, defaulting the way the schema does. */
TBE.readinessOf = (item) =>
  TBE.READINESS[item?.system?.carried ?? "hand"] || TBE.READINESS.hand;

/** Which ENC pool a carry state counts against. The single owner. */
TBE.carryPool = (carried) =>
  (TBE.READINESS[carried ?? "hand"] || TBE.READINESS.hand).pool;

/**
 * Encumbrance (Ch.9 p.129-130): Weapons at Hand (max 6 ENC) is a separate pool
 * from general Inventory ENC (max 6 + a manual bonus, e.g. Strong Back). Worn
 * armor is free; an un-equipped piece costs 1 Inventory ENC. Silver adds 1
 * Inventory ENC per 500.
 *
 * OWNERSHIP: this is the one owner of the arithmetic. It takes plain numbers
 * rather than Actor/Item documents on purpose -- the sheet (`_prepareEnc()`,
 * actor-sheet.mjs) already has its items pre-split into weapons/shields/armor
 * arrays for template rendering, and the macro pack (`TBE.encStatus()`,
 * _lib.js) starts from a whole actor and filters `actor.items` itself, so
 * there is no one document shape both could share. What both COULD and used
 * to fail to share was the bands and the cap math once the six inputs were in
 * hand -- so that is what has one owner now. The sheet imports this module
 * directly; the macro pack can't import (flat scripts, no ES modules), so it
 * reads CONFIG.TBE.encumbrance at runtime, the same pattern TBE.rankCap() and
 * TBE.strandCap() use, and only computes its own copy when CONFIG isn't
 * around. Before this, both ends independently re-derived the bands and were
 * only pinned identical by a test that executed both and compared 128
 * loadouts -- audit_check.mjs still does that, but now to catch drift in the
 * INPUT-GATHERING each side still owns, not in arithmetic neither should.
 */
TBE.encumbrance = function ({ hand = 0, storedGear = 0, unequippedArmor = 0, coinEnc = 0, invBonus = 0, handBonus = 0 } = {}) {
  const inv = storedGear + unequippedArmor + coinEnc;
  const invMax = 6 + invBonus;
  const handMax = 6 + handBonus;
  const over = Math.max(0, inv - invMax);
  const penalty = over <= 0 ? 0 : over <= 3 ? -10 : over <= 6 ? -20 : over <= 9 ? -30 : -30;
  return { hand, handMax, inv, invMax, over, penalty, overCap: over > 9 };
};

/** Hit-location keys (schema-safe) mapped to their display labels (Ch.11 p.172). */
TBE.LOCATIONS = {
  body: "Body", rArm: "R Arm", lArm: "L Arm", rLeg: "R Leg", lLeg: "L Leg", head: "Head"
};

TBE.SKILL_GROUPS = ["Combat", "Adventuring", "Social", "Lore", "Language", "Wise", "Bind"];

/* ---- Ch.14 Weave Magic ---------------------------------------------------
 * Binds are percentile skills (skill Items in the "Bind" group); Strands are
 * their own Item type with a level, because they are "not rolled like a
 * normal skill, but rather ha[ve] a single number that helps cover the cost
 * of spell casting" (Ch.3 p.33). */
TBE.BINDS = BINDS;
TBE.BIND_INFO = BIND_INFO;
TBE.STRANDS = STRANDS;
TBE.STRAND_INFO = STRAND_INFO;
TBE.CONVOCATIONS = CONVOCATIONS;
TBE.MAGIC_RULES = MAGIC_RULES;
TBE.FRAYING_SYMPTOMS = FRAYING_SYMPTOMS;

/** A Strand Item's name, canonicalised: "Strand: Fire" and "Fire" both -> "Fire". */
TBE.strandName = (n) => String(n || "").replace(/^\s*strand\s*:\s*/i, "").trim();

/**
 * The ceiling on a Strand level for this character, and why.
 * Ch.8: a Fade's Strands "can never be developed past 7"; a true Spellweaver
 * has no hard ceiling but pays 1 Fraying for every point above 10; during
 * character creation nothing may pass 5.
 * @param {"none"|"spellweaver"|"fade"} pattern
 * @param {boolean} atCreation
 */
TBE.strandCap = function (pattern, atCreation = false) {
  if (atCreation) return { cap: MAGIC_RULES.chargenStrandCap, why: MAGIC_RULES.chargenStrandQuote };
  if (pattern === "fade") return { cap: MAGIC_RULES.fadeStrandCap, why: MAGIC_RULES.fadeStrandQuote };
  return { cap: null, why: MAGIC_RULES.strandBeyondTenQuote };
};

/**
 * XP to take a Strand from `from` to `to`, sequentially: each step costs the
 * new value ("going from Air 3 to 4 would cost 4 XP... improving from 3 to 5
 * would cost a total of 9 XP"). Also reports the Fraying incurred, since
 * every point above 10 costs the Spellweaver 1 Fraying.
 */
TBE.strandXp = function (from, to) {
  let xp = 0, fraying = 0;
  for (let v = Number(from) + 1; v <= Number(to); v++) {
    xp += v;
    if (v > 10) fraying += MAGIC_RULES.strandBeyondTenFraying;
  }
  return { xp, fraying, steps: Math.max(0, Number(to) - Number(from)) };
};

/**
 * Which Fraying symptom tiers have been reached, in book order. The tiers are
 * narrative, but they are gated on numbers the sheet already knows, so the
 * sheet states them rather than leaving the player to compare by eye.
 */
TBE.frayingTiers = function (fraying, maxResolve, recorded = []) {
  const f = Number(fraying) || 0, m = Number(maxResolve) || 0;
  /* f > 0 guards the obvious wrong answer: with Max Resolve 5 and no Fraying
   * at all, `f >= m - 5` is 0 >= 0, and a caster who has never cast a spell
   * would be told animals bolt from them. */
  const reached = {
    flat10: f >= 10,
    "mr-5": f > 0 && m > 0 && f >= m - 5,
    mr: f > 0 && m > 0 && f >= m,
    "mr+5": f > 0 && m > 0 && f >= m + 5
  };
  const have = new Set(recorded || []);
  // A tier reached once stays reached, even if Max Resolve later rises.
  return FRAYING_SYMPTOMS.filter((t) => reached[t.key] || have.has(t.key));
};

/** The tier keys the current numbers reach, for recording on the actor. */
TBE.frayingTierKeys = (fraying, maxResolve) =>
  TBE.frayingTiers(fraying, maxResolve, []).map((t) => t.key);

TBE.DIFFICULTY_TIERS = ["Simple", "Easy", "Medium", "Challenging", "Hard", "Severe", "Extreme"];

/**
 * The full TBE status registry (see the "TBE: Status & Peril Reference" journal
 * for the book citations behind each one). Registered into CONFIG.statusEffects
 * once, in the init hook — this is what used to be a lazy per-macro workaround
 * (TBE.ensureStatuses(), called at the top of every macro because there was no
 * system init hook to register it in). A real system fixes that at the source.
 */
TBE.STATUSES = [
  ["Wounds & Impairment", "tbe-imp-body", "Impaired: Body", "icons/svg/blood.svg"],
  ["Wounds & Impairment", "tbe-imp-rarm", "Impaired: R Arm", "icons/svg/blood.svg"],
  ["Wounds & Impairment", "tbe-imp-larm", "Impaired: L Arm", "icons/svg/blood.svg"],
  ["Wounds & Impairment", "tbe-imp-rleg", "Impaired: R Leg", "icons/svg/blood.svg"],
  ["Wounds & Impairment", "tbe-imp-lleg", "Impaired: L Leg", "icons/svg/blood.svg"],
  ["Wounds & Impairment", "tbe-imp-head", "Impaired: Head", "icons/svg/blood.svg"],
  ["Wounds & Impairment", "tbe-stunned", "Stunned", "icons/svg/daze.svg"],
  ["Wounds & Impairment", "tbe-prone", "Prone", "icons/svg/falling.svg"],
  ["Wounds & Impairment", "tbe-unconscious", "Unconscious", "icons/svg/paralysis.svg"],
  ["Wounds & Impairment", "tbe-arm-useless", "Arm Useless", "icons/svg/downgrade.svg"],
  ["Wounds & Impairment", "tbe-leg-hobbled", "Leg Hobbled", "icons/svg/downgrade.svg"],
  ["Wounds & Impairment", "tbe-shock", "Shock", "icons/svg/unconscious.svg"],
  ["Wounds & Impairment", "tbe-dying", "Dying", "icons/svg/skull.svg"],
  ["Wounds & Impairment", "tbe-infected", "Infected", "icons/svg/biohazard.svg"],
  ["Wounds & Impairment", "tbe-septic", "Septic", "icons/svg/poison.svg"],
  ["Maneuver Riders", "tbe-unbalanced", "Unbalanced", "icons/svg/downgrade.svg"],
  ["Maneuver Riders", "tbe-locked", "Locked", "icons/svg/net.svg"],
  ["Maneuver Riders", "tbe-disarmed", "Disarmed", "icons/svg/downgrade.svg"],
  ["Maneuver Riders", "tbe-disadvantaged", "Disadvantaged", "icons/svg/downgrade.svg"],
  ["Magic", "tbe-restrained", "Restrained", "icons/svg/net.svg"],
  /* Immobilized is not Restrained: the book lets an Immobilized creature act,
     and a Restrained one only defend. A Weave Reaction can inflict either. */
  ["Magic", "tbe-immobilized", "Immobilized", "icons/svg/paralysis.svg"],
  /* Ch.5 Ogres: "If an Ogre critically fails a skill roll for which they used
     any amount of Resolve, they experience the Breaking: on their next turn,
     they will attack (with +10) the closest living thing." A real status,
     because it persists round to round until it is ended. */
  ["Race", "tbe-breaking", "The Breaking", "icons/svg/terror.svg"],
  ["Fatigue & Travel", "tbe-fatigued", "Fatigued", "icons/svg/sleep.svg"],
  ["Fatigue & Travel", "tbe-weary", "Weary", "icons/svg/sleep.svg"],
  ["Fatigue & Travel", "tbe-deprived", "Deprived", "icons/svg/hazard.svg"],
  ["Fatigue & Travel", "tbe-sleepless", "Sleepless", "icons/svg/sleep.svg"],
  ["Other Perils", "tbe-blinded", "Blinded", "icons/svg/blind.svg"],
  ["Other Perils", "tbe-deafened", "Deafened", "icons/svg/deaf.svg"],
  ["Other Perils", "tbe-frostbite", "Frostbite", "icons/svg/frozen.svg"],
  ["Other Perils", "tbe-burning", "Burning", "icons/svg/fire.svg"],
  ["Other Perils", "tbe-poisoned", "Poisoned", "icons/svg/poison.svg"],
  ["Other Perils", "tbe-feared", "Feared", "icons/svg/terror.svg"]
].map(([group, id, name, icon]) => ({ group, id, name, icon }));

/* How many times a Talent may be bought, keyed by the `rank` field
 * parse_talents.py extracts from the book's own wording:
 *   "Can be purchased up to three times."  (Assassin, Strong Back, Tough, ...)
 *   "Can be purchased up to five times."   (Combat Awareness, Not Today Death)
 *   Armor Training (I-IV)                  four levels
 *   "Can be purchased once per <X>"        one per weapon/skill, tracked as
 *                                          separate Items with their own
 *                                          specialization, so one each
 *   "purchased multiple times to a maximum Resolve of 30" (Inner Strength) --
 *                                          the book caps the RESULT, not the
 *                                          number of purchases, so the count
 *                                          is unbounded here
 * Read by both bundles: the system scales a Talent's ActiveEffect by its rank,
 * and the macro pack's TBE: Talents refuses a purchase past the cap by reading
 * CONFIG.TBE.rankCap() at runtime. One owner, two readers. */
TBE.RANK_CAP = {
  once: 1,
  "per-skill": 1,
  three: 3,
  "3": 3,
  five: 5,
  levelled: 4,
  multiple: Infinity
};

TBE.rankCap = function (rank) {
  const key = String(rank ?? "once").trim().toLowerCase();
  const cap = TBE.RANK_CAP[key];
  if (cap !== undefined) return cap;
  const n = Number(key);
  return Number.isFinite(n) && n > 0 ? n : 1;
};
