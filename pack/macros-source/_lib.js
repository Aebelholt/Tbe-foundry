/* TBE SOLO LIB — shared helpers, injected into every macro at build time. */

const TBE = {};

TBE.prompt = async function (title, content, okLabel = "Roll") {
  const DV2 = foundry.applications?.api?.DialogV2;
  if (DV2) {
    return DV2.prompt({
      window: { title },
      content,
      ok: { label: okLabel, callback: (ev, btn) => Object.fromEntries(new FormData(btn.form)) },
      rejectClose: false
    });
  }
  return new Promise((resolve) => {
    new Dialog({
      title,
      content,
      buttons: {
        ok: {
          label: okLabel,
          callback: (html) => {
            const el = html[0] ?? html;
            const data = {};
            el.querySelectorAll("[name]").forEach((i) => (data[i.name] = i.value));
            resolve(data);
          }
        }
      },
      default: "ok",
      close: () => resolve(null)
    }).render(true);
  });
};

TBE.num = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

TBE.d100 = async function () {
  const roll = await new Roll("1d100").evaluate();
  return roll;
};

/* Display "00" for 100, zero-pad 1-9. */
TBE.face = (r) => (r === 100 ? "00" : String(r).padStart(2, "0"));

TBE.isDoubles = (r) => r === 100 || (r < 100 && r % 11 === 0);

/*
 * Core TBE resolution for one d100 roll against a modified skill value.
 * Returns { roll, skill, success, crit, critFail, sl, tens, note }
 */
/*
 * expertise is the skill's Expertise level (0, or 2/3/4 for Ex2/Ex3/Ex4, Ch.4
 * p.54 & Ch.8 p.123): on a successful roll it guarantees at least that many
 * SLs, applied as a floor after the tens-die, critical, and skill-over-100
 * SLs are all totalled -- it never reduces a roll that already did better.
 */
TBE.resolve = function (r, skill, expertise = 0) {
  const s = TBE.num(skill, 0);
  const alwaysFail = r >= 99;
  const doubles = TBE.isDoubles(r);
  let success;
  if (alwaysFail) success = false;
  else if (s <= 0) success = r <= 5;
  else if (r <= 5) success = true;
  else success = r <= s;

  let crit = false;
  let critFail = false;
  if (success) {
    if (s <= 0) crit = r === 5;
    else crit = doubles || r === s;
  } else if (s < 100) {
    critFail = doubles && r > s;
  }

  const tens = Math.floor((r % 100) / 10);
  let sl = 0;
  const notes = [];
  if (success) {
    sl = Math.max(1, tens);
    if (crit) {
      sl += 3;
      notes.push("critical success (+3 SL)");
    }
    if (s > 100) {
      const bonus = Math.max(1, Math.floor(((s - 100) % 100) / 10));
      sl += bonus;
      notes.push("skill over 100 (+" + bonus + " SL)");
    }
    if (r <= 5 && r > s) notes.push("01-05 always succeeds");
    const ex = TBE.num(expertise, 0);
    if (ex >= 2 && sl < ex) {
      sl = ex;
      notes.push("Expertise Ex" + ex + " guarantees " + ex + " SL");
    }
  } else {
    if (alwaysFail) notes.push("99-00 always fails");
    if (critFail) notes.push("critical failure");
  }
  return { roll: r, skill: s, success, crit, critFail, sl, tens, notes };
};

TBE.tag = function (res) {
  if (res.success) return res.crit ? "CRITICAL SUCCESS" : "SUCCESS";
  return res.critFail ? "CRITICAL FAILURE" : "FAILURE";
};

TBE.colour = function (res) {
  if (res.success) return res.crit ? "#1f7a1f" : "#2f6f2f";
  return res.critFail ? "#8b1a1a" : "#6b2b2b";
};

TBE.card = function (title, bodyHtml) {
  return (
    '<div class="tbe-card" style="border:1px solid #7a6a4f;border-radius:6px;padding:6px 8px;background:rgba(120,100,60,0.08)">' +
    '<div style="font-weight:bold;letter-spacing:.5px;border-bottom:1px solid #7a6a4f;margin-bottom:4px">' +
    title +
    "</div>" +
    bodyHtml +
    "</div>"
  );
};

TBE.say = async function (content, rolls = []) {
  return ChatMessage.create({
    speaker: ChatMessage.getSpeaker(),
    content,
    rolls,
    sound: rolls.length ? CONFIG.sounds.dice : null
  });
};

/* Read text off a TableResult across v12 / v13+ schemas. */
TBE.resultText = function (r) {
  if (!r) return "";
  return r.text || r.description || r.name || "";
};

TBE.tableRows = function (name) {
  const spec = (TBE_DATA.tables || []).find((t) => t.name === name);
  return spec ? spec.rows : [];
};

/* Roll a table by name. Falls back to the data baked into this macro if the table is absent. */
TBE.drawTable = async function (name) {
  const t = game.tables.getName(name);
  if (t) {
    const out = await t.roll();
    return { text: TBE.resultText(out.results?.[0]), total: out.roll?.total ?? null };
  }
  const rows = TBE.tableRows(name);
  if (!rows.length) {
    ui.notifications?.warn("TBE: no data for '" + name + "'.");
    return null;
  }
  const roll = await new Roll("1d100").evaluate();
  const hit = rows.find((r) => roll.total >= r[0][0] && roll.total <= r[0][1]);
  return { text: hit ? hit[1] : "", total: roll.total };
};

/*
 * Create one roll table, trying every TableResult schema shape Foundry v11-v14 accepts.
 * Returns the table, or throws.
 */
TBE.createTable = async function (name, rows) {
  const existing = game.tables.getName(name);
  if (existing) return existing;
  const table = await RollTable.create({ name, formula: "1d100", replacement: true, displayRoll: true });
  const short = (s) => (s.length > 48 ? s.slice(0, 48) + "..." : s);
  const variants = [
    (r) => ({ range: r[0], weight: 1, type: "text", name: short(r[1]), description: r[1] }),
    (r) => ({ range: r[0], weight: 1, name: short(r[1]), description: r[1] }),
    (r) => ({ range: r[0], weight: 1, type: 0, text: r[1] }),
    (r) => ({ range: r[0], weight: 1, text: r[1] })
  ];
  for (const v of variants) {
    try {
      const made = await table.createEmbeddedDocuments("TableResult", rows.map(v));
      if (made && made.length) return table;
    } catch (err) {
      console.warn("TBE | result shape rejected for " + name + ":", err);
    }
  }
  console.error("TBE | could not populate table " + name);
  return table;
};

/* Create any TBE table that is missing. GM only. */
TBE.ensureTables = async function () {
  const out = { created: [], failed: [] };
  for (const spec of TBE_DATA.tables || []) {
    if (game.tables.getName(spec.name)) continue;
    if (!game.user.isGM) { out.failed.push(spec.name); continue; }
    try {
      await TBE.createTable(spec.name, spec.rows);
      out.created.push(spec.name);
    } catch (err) {
      console.error("TBE | table failed: " + spec.name, err);
      out.failed.push(spec.name);
    }
  }
  return out;
};

/* Roll a full Random Event: focus + two randomizer words (+ Empires List when called for). */
TBE.event = async function () {
  const focus = await TBE.drawTable("TBE: Random Events");
  const w1 = await TBE.drawTable("TBE: Event Randomizers I");
  const w2 = await TBE.drawTable("TBE: Event Randomizers II");
  const f = (focus?.text || "").toUpperCase();
  let list = null;
  if (f.indexOf("LIST ELEMENT") > -1) list = await TBE.drawTable("TBE: Empires List");
  return {
    focus: focus?.text || "?",
    w1: w1?.text || "?",
    w2: w2?.text || "?",
    list: list ? list.text : null
  };
};

TBE.eventHtml = function (e) {
  return (
    '<div style="margin-top:4px;padding:4px;border:1px dashed #7a6a4f;border-radius:4px">' +
    '<div style="font-size:11px;letter-spacing:.5px;opacity:.8">RANDOM EVENT</div>' +
    "<div>" + e.focus + "</div>" +
    '<div style="font-size:16px;margin-top:2px"><b>' + e.w1 + " &middot; " + e.w2 + "</b></div>" +
    (e.list ? '<div style="font-size:12px;margin-top:2px">List element: <i>' + e.list + "</i></div>" : "") +
    "</div>"
  );
};

/* Skill list off the selected token / assigned actor, system-agnostic. */
TBE.actorSkills = function () {
  const actor = canvas.tokens?.controlled?.[0]?.actor ?? game.user?.character ?? null;
  const out = [];
  if (!actor) return out;
  for (const i of actor.items ?? []) {
    if (i.type !== "skill") continue;
    const v = TBE.num(i.system?.value, 0);
    out.push({ name: i.name, value: v, expertise: TBE.num(i.system?.expertise, 0), savvy: !!i.system?.savvy });
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
};

/* A picker whose value, if set, overrides the typed skill number. Encodes
 * Expertise and Savvy alongside the value/name so every roll made from a
 * real skill Item (not a hand-typed number) carries them through to
 * TBE.resolve() without a second sheet lookup. */
TBE.skillOptions = function (fieldName = "pick", label = "From sheet") {
  const s = TBE.actorSkills();
  if (!s.length) return "";
  return (
    '<label style="display:block;margin:2px 0">' + label +
    ': <select name="' + fieldName + '" style="width:100%">' +
    '<option value="">-- use the number below --</option>' +
    s.map((x) => '<option value="' + x.value + '|' + x.name + '|' + x.expertise + '|' + (x.savvy ? 1 : 0) + '">' +
      x.name + " (" + x.value + (x.expertise >= 2 ? " Ex" + x.expertise : "") + (x.savvy ? " S" : "") + ")</option>").join("") +
    "</select></label>"
  );
};

/* Returns {value, name, expertise, savvy} from a picker selection, or null. */
TBE.readPick = function (raw) {
  if (!raw) return null;
  const bits = String(raw).split("|");
  return { value: TBE.num(bits[0], 0), name: bits[1] || "", expertise: TBE.num(bits[2], 0), savvy: bits[3] === "1" };
};

/* ---- actor state helpers ----
 * The native TBE system (systems/the-broken-empires) keeps this as real
 * DataModel fields on the actor: system.wounds, system.supply, system.shock,
 * system.fatigue, system.lethalityPenalty, system.deathThreshold, etc. — not
 * flags.tbe.*. Hit-location keys are the schema's camelCase keys (body, rArm,
 * lArm, rLeg, lLeg, head), not the old display-name keys ("Body", "R Arm", ...).
 * TBE.LOC_LABELS below maps schema key -> display label wherever a chat card
 * needs to show one. */
TBE.clone = (o) => (foundry.utils?.duplicate ? foundry.utils.duplicate(o) : JSON.parse(JSON.stringify(o)));

TBE.LOCATIONS = ["body", "rArm", "lArm", "rLeg", "lLeg", "head"];

/* Ch.18 Size ladder, smallest to largest. Medium (index 5) is the human
 * baseline. Mirrors the system's own chargen-data.mjs. */
TBE.SIZES = ["Minute", "Diminutive", "Tiny", "Little", "Small", "Medium",
  "Large", "Huge", "Massive", "Gargantuan", "Colossal"];

/*
 * Combat consequences of the Size gap between two combatants (Ch.18), from the
 * attacker's point of view. gap > 0 means the DEFENDER is larger. Returns plain
 * data so a chat card can show its reasoning instead of silently nudging
 * numbers. Note this is the size DIFFERENCE table, which always applies; the
 * separate per-step stat table (+1 Toughness, +2 damage...) is only for a
 * creature whose size has been CHANGED from its starting size, and bestiary
 * stat blocks already bake their own size in.
 */
TBE.sizeEffects = function (attackerSize, defenderSize) {
  const ai = TBE.SIZES.indexOf(attackerSize), di = TBE.SIZES.indexOf(defenderSize);
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
    /* "Drive Back, Trip and Disarm cannot be used against a creature 3+ Sizes larger." */
    maneuversBlocked: gap >= 3 ? ["db", "trip", "dis"] : [],
    /* "+1 Reach per 2 Sizes larger than the opponent." */
    attackerReach: Math.trunc(Math.max(0, -gap) / 2),
    defenderReach: Math.trunc(Math.max(0, gap) / 2),
    /* "Grappling is only possible up to 2 Sizes larger or smaller." */
    grappleLegal: abs <= 2,
    /* "+20 Might per Size category of difference when Grappling" (to the larger). */
    grappleMight: abs * 20
  };
};

/* Human-readable lines for whatever the size gap actually changed. */
TBE.sizeNotes = function (fx, attackerName, defenderName) {
  if (!fx || !fx.gap) return [];
  const out = [];
  const bigger = fx.gap > 0 ? defenderName : attackerName;
  out.push("Size: " + fx.attackerSize + " vs " + fx.defenderSize + " (" +
    bigger + " larger by " + fx.abs + ")");
  if (fx.toHit) out.push("+" + fx.toHit + " to hit: target is 3+ Sizes larger");
  if (fx.defenderMustDodge) out.push("Monstrous attack: " + defenderName + " cannot parry, only Dodge");
  if (fx.maneuversBlocked.length) out.push("Drive Back, Trip and Disarm are unavailable against a foe 3+ Sizes larger");
  if (fx.attackerReach) out.push(attackerName + " has +" + fx.attackerReach + " Reach");
  if (fx.defenderReach) out.push(defenderName + " has +" + fx.defenderReach + " Reach");
  if (!fx.grappleLegal) out.push("Grappling is impossible at more than 2 Sizes apart");
  else if (fx.grappleMight) out.push("In a Grapple the larger gains +" + fx.grappleMight + " Might");
  return out;
};
TBE.LOC_LABELS = { body: "Body", rArm: "R Arm", lArm: "L Arm", rLeg: "R Leg", lLeg: "L Leg", head: "Head" };

TBE.emptyWoundLoc = () => ({ wp: 0, imp: 0, inf: false, septic: false, rb: null });
TBE.wounds = function (actor) {
  const w = TBE.clone(actor?.system?.wounds ?? {});
  for (const loc of TBE.LOCATIONS) if (!w[loc]) w[loc] = TBE.emptyWoundLoc();
  return w;
};
TBE.setWounds = async (actor, w) => actor.update({ "system.wounds": w });

/* Whole-character Shock (Ch.11) is its own boolean field now, not a synthetic
 * "__shock" key folded into the wounds object. */
TBE.shock = (actor) => !!actor?.system?.shock;
TBE.setShock = async (actor, val) => actor.update({ "system.shock": !!val });

/* Encumbrance (Ch.9 p.129-130): Weapons at Hand (max 6 ENC, shared by weapon
 * and shield items carried "hand"), and general Inventory ENC (max 6 + a
 * manual invBonus for things like the Strong Back Talent, no auto-detect
 * hook for Talent effects in this system) -- coins (1 ENC/500sp), stored
 * weapons/shields, and un-equipped armor pieces (1 ENC each, since a worn
 * piece is free per location instead) all count against Inventory.
 * Overflow above Max Inventory ENC penalises "physical activity" rolls
 * (Athletics, Combat skills, etc, p.130) -- callers apply TBE.encStatus().penalty
 * themselves (as a prefilled, editable modifier) rather than this silently
 * altering a roll no one can see. */
TBE.encStatus = function (actor) {
  const items = actor?.items ?? [];
  const hand = items.filter((i) => (i.type === "weapon" || i.type === "shield") && (i.system?.carried ?? "hand") !== "stored")
    .reduce((s, i) => s + TBE.num(i.system?.enc, 0), 0);
  const storedGear = items.filter((i) => (i.type === "weapon" || i.type === "shield") && i.system?.carried === "stored")
    .reduce((s, i) => s + TBE.num(i.system?.enc, 0), 0);
  const unequippedArmor = items.filter((i) => i.type === "armor" && i.system?.equipped === false).length;
  const coinEnc = Math.floor(TBE.num(actor?.system?.silver, 0) / 500);
  const inv = storedGear + unequippedArmor + coinEnc;
  const invMax = 6 + TBE.num(actor?.system?.enc?.invBonus, 0);
  const over = Math.max(0, inv - invMax);
  const penalty = over <= 0 ? 0 : over <= 3 ? -10 : over <= 6 ? -20 : over <= 9 ? -30 : -30;
  return { hand, handMax: 6, inv, invMax, over, penalty, overCap: over > 9 };
};

/* Short reminder line for a roll dialog: only prints anything when there's
 * an actual overflow penalty in effect, so a clean sheet stays silent. */
TBE.encNote = function (actor) {
  if (!actor) return "";
  const e = TBE.encStatus(actor);
  if (!e.penalty) return "";
  return '<div style="font-size:11px;color:#b04040">' + (actor.name || "Actor") + ": " + e.inv + "/" + e.invMax +
    " Inventory ENC, " + e.over + " over &rarr; <b>" + e.penalty + "</b> to physical-activity rolls (Athletics, Combat skills)" +
    (e.overCap ? " &mdash; over the 9-point cap, drop something, this is not a legal load" : "") + ".</div>";
};

TBE.SUPPLY_STEPS = [6, 8, 10, 12];
TBE.supply = (actor) => Object.assign({ gear: 8, ammo: 8, medical: 8, rations: 8 }, TBE.clone(actor?.system?.supply ?? {}));
TBE.setSupply = async (actor, s) => actor.update({ "system.supply": s });

/* Roll a supply die: 1-2 steps it down; a d6 that steps down is depleted (0). */
TBE.rollSupply = async function (actor, key, force) {
  const s = TBE.supply(actor);
  const die = TBE.num(s[key], 8);
  if (die <= 0) return { die: 0, roll: null, stepped: false, depleted: true, text: key + " is already exhausted" };
  const r = await new Roll("1d" + die).evaluate();
  const stepped = force || r.total <= 2;
  let next = die;
  if (stepped) next = die === 6 ? 0 : TBE.SUPPLY_STEPS[TBE.SUPPLY_STEPS.indexOf(die) - 1] ?? 6;
  if (stepped) { s[key] = next; await TBE.setSupply(actor, s); }
  return {
    die, roll: r, next, stepped, depleted: next === 0,
    text: key + " d" + die + ": rolled " + r.total +
      (stepped ? (next === 0 ? " &mdash; <b>exhausted</b>" : " &mdash; steps down to d" + next) : ", holds")
  };
};

/* Total lethal WP across locations. */
TBE.totalWp = (w) => Object.values(w || {}).reduce((a, b) => a + TBE.num(b.wp, 0), 0);

TBE.woundTable = function (w) {
  const keys = TBE.LOCATIONS.filter((k) => w[k] && (TBE.num(w[k].wp, 0) > 0 || TBE.num(w[k].imp, 0) > 0));
  if (!keys.length) return "<div><i>No wounds recorded.</i></div>";
  return '<table style="width:100%;border-collapse:collapse;font-size:12px">' +
    "<tr><th align='left'>Location</th><th align='left'>WP</th><th align='left'>State</th></tr>" +
    keys.map((k) => {
      const x = w[k];
      const tags = [];
      if (TBE.num(x.imp, 0) >= 2) tags.push("Shock");
      else if (TBE.num(x.imp, 0) === 1) tags.push("Impaired");
      if (x.septic) tags.push("<b>SEPTIC</b>");
      else if (x.inf) tags.push("<b>Infected</b>");
      if (x.rb !== undefined && x.rb !== null) tags.push("RB " + (x.rb >= 0 ? "+" : "") + x.rb);
      return "<tr><td>" + (TBE.LOC_LABELS[k] || k) + "</td><td>" + TBE.num(x.wp, 0) + "</td><td>" + (tags.join(", ") || "&mdash;") + "</td></tr>";
    }).join("") + "</table>";
};

/* The actor a solo player is driving right now. */
TBE.me = () => canvas.tokens?.controlled?.[0]?.actor ?? game.user?.character ?? null;

/* Read a skill value off a real skill Item by name, tolerant of a trailing
 * "(Sub)" qualifier some maneuver/table text still writes (e.g. "Adventuring
 * (Endurance)" meaning the "Endurance" skill). */
TBE.skillNamed = function (actor, wanted) {
  const w = String(wanted).toLowerCase().trim();
  const inner = w.indexOf("(") > -1 ? w.slice(w.indexOf("(") + 1).replace(")", "").trim() : null;
  for (const i of actor?.items ?? []) {
    if (i.type !== "skill") continue;
    const n = i.name.toLowerCase();
    if (n === w || (inner && n === inner)) {
      return { name: i.name, value: TBE.num(i.system?.value, 0), expertise: TBE.num(i.system?.expertise, 0), savvy: !!i.system?.savvy };
    }
  }
  return null;
};

/* Find a weapon Item by name (or the first weapon whose linked system.skillName
 * matches), tolerant the same way. Used by tbe-attack.js to resolve the
 * attacking weapon's maneuver-cost fields (cl/cs/dis/t) and damage. */
TBE.weaponNamed = function (actor, wanted) {
  if (!wanted) return null;
  const w = String(wanted).toLowerCase().trim();
  for (const i of actor?.items ?? []) {
    if (i.type !== "weapon") continue;
    if (i.name.toLowerCase() === w) return i;
  }
  return null;
};

/* ---------------------------------------------------------------------------
 * Status effects: one registry, shared by every macro, so a wound, a maneuver
 * rider, or a peril always shows the same token icon rather than each macro
 * inventing its own. Grouped to match the book's own chapters (Ch.10 Combat,
 * Ch.11 Wounds/Healing/Perils, Ch.14 Weave Magic), so "TBE: Status Effects"
 * and the reference journal can render the same list.
 * ------------------------------------------------------------------------- */
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

/* Register the whole palette into CONFIG.statusEffects, idempotently. Every macro
 * loads _lib.js, so this runs whenever any TBE tool is used — no separate install
 * step needed, and the right-click token HUD always has the full palette ready. */
TBE.ensureStatuses = function () {
  try {
    if (!Array.isArray(CONFIG.statusEffects)) return;
    for (const s of TBE.STATUSES) {
      if (!CONFIG.statusEffects.find((e) => e.id === s.id)) {
        CONFIG.statusEffects.push({ id: s.id, name: s.name, label: s.name, img: s.icon, icon: s.icon });
      }
    }
  } catch (eEnsure) { /* older builds may not expose CONFIG.statusEffects as a plain array */ }
};
TBE.ensureStatuses();

TBE.statusDef = (id) => TBE.STATUSES.find((s) => s.id === id) ?? null;

TBE.hasStatus = function (actor, id) {
  try { if (actor?.statuses?.has && actor.statuses.has(id)) return true; } catch (eHas) {}
  try {
    const effects = actor?.effects?.contents ?? actor?.effects ?? [];
    return effects.some((e) => (e.statuses?.has?.(id)) || e.flags?.core?.statusId === id);
  } catch (eHas2) { return false; }
};

/* Apply a status the same way everywhere: the core toggle API first (this is what
 * actually paints a token icon), a raw ActiveEffect with "statuses" populated as a
 * fallback for older builds where toggleStatusEffect isn't available. Returns
 * true/false so a chat card can say honestly whether it landed. */
TBE.applyStatus = async function (actor, id, opts) {
  if (!actor || TBE.hasStatus(actor, id)) return !!actor;
  const def = TBE.statusDef(id) ?? { id, name: id, icon: "icons/svg/aura.svg" };
  TBE.ensureStatuses();
  try {
    await actor.toggleStatusEffect(id, Object.assign({ active: true, overlay: false }, opts));
    return true;
  } catch (eToggle) {
    try {
      await actor.createEmbeddedDocuments("ActiveEffect", [{
        name: def.name, img: def.icon, duration: (opts && opts.duration) || {}, statuses: [id]
      }]);
      return true;
    } catch (eCreate) { return false; }
  }
};

TBE.clearStatus = async function (actor, id) {
  if (!actor || !TBE.hasStatus(actor, id)) return !!actor;
  try {
    await actor.toggleStatusEffect(id, { active: false });
    return true;
  } catch (eToggle) {
    try {
      const effects = actor.effects?.contents ?? actor.effects ?? [];
      const dead = effects.filter((e) => e.statuses?.has?.(id) || e.flags?.core?.statusId === id).map((e) => e.id);
      if (dead.length) await actor.deleteEmbeddedDocuments("ActiveEffect", dead);
      return true;
    } catch (eDelete) { return false; }
  }
};

/* Reconcile the token icons for the states this pack already tracks as plain data
 * (wounds/impairment/infection/sepsis/shock/dying) with what's actually recorded in
 * system.wounds and the Death Threshold. Safe to call often — every Attack, every Heal action, and
 * every time the Status card is opened — so hand-edits or a skipped step never leave
 * a token showing something stale. Riders (Unbalance, Restrained, ...) and manual
 * perils (Fatigued, Blinded, ...) are applied at the point they happen instead, since
 * nothing else records their state to reconcile against. */
TBE.syncStatuses = async function (actor) {
  if (!actor) return;
  const w = TBE.wounds(actor);
  const locMap = { body: "tbe-imp-body", rArm: "tbe-imp-rarm", lArm: "tbe-imp-larm",
    rLeg: "tbe-imp-rleg", lLeg: "tbe-imp-lleg", head: "tbe-imp-head" };
  for (const [loc, id] of Object.entries(locMap)) {
    const should = TBE.num(w[loc]?.imp, 0) > 0;
    if (should !== TBE.hasStatus(actor, id)) await (should ? TBE.applyStatus(actor, id, {}) : TBE.clearStatus(actor, id));
  }
  /* Shock is a real system.shock boolean field (see tbe-attack.js), not re-derived
   * from wound counts here, since a Head impairment on an even Wound Die also forces
   * Shock without any location ever reaching a second impairment. */
  const shockNow = TBE.shock(actor);
  if (shockNow !== TBE.hasStatus(actor, "tbe-shock")) await (shockNow ? TBE.applyStatus(actor, "tbe-shock", {}) : TBE.clearStatus(actor, "tbe-shock"));
  const infected = Object.values(w).some((x) => x.inf);
  if (infected !== TBE.hasStatus(actor, "tbe-infected")) await (infected ? TBE.applyStatus(actor, "tbe-infected", {}) : TBE.clearStatus(actor, "tbe-infected"));
  const septic = Object.values(w).some((x) => x.septic);
  if (septic !== TBE.hasStatus(actor, "tbe-septic")) await (septic ? TBE.applyStatus(actor, "tbe-septic", {}) : TBE.clearStatus(actor, "tbe-septic"));
  /* Death Threshold, Lethality Level and total WP are real DataModel getters
   * on the live actor.system now — no need to re-derive them here. */
  const dt = TBE.num(actor.system?.deathThreshold?.max, 0);
  const dying = dt > 0 && !!actor.system?.dying;
  if (dying !== TBE.hasStatus(actor, "tbe-dying")) await (dying ? TBE.applyStatus(actor, "tbe-dying", {}) : TBE.clearStatus(actor, "tbe-dying"));
};

/* ---------------------------------------------------------------------------
 * Extended Roll / Social Encounter trackers (Ch.2 p.22, Ch.13 p.249-264): a
 * task or scene that plays out over more than one standard roll, accumulating
 * SLs toward a threshold. Tracked state belongs to the undertaking, not to
 * any one actor, so it lives in a world setting (registered by the system's
 * init hook, namespace "the-broken-empires") rather than on a character sheet.
 * Multiple trackers can be active at once (a crafting project running
 * alongside a negotiation), each keyed by its own id.
 * ------------------------------------------------------------------------- */
TBE.TRACKER_SETTING = "encounters";

TBE.trackers = function () {
  try { return TBE.clone(game.settings.get("the-broken-empires", TBE.TRACKER_SETTING) || {}); }
  catch (eGet) { return {}; }
};

TBE.saveTracker = async function (t) {
  const all = TBE.trackers();
  all[t.id] = t;
  await game.settings.set("the-broken-empires", TBE.TRACKER_SETTING, all);
  return t;
};

TBE.deleteTracker = async function (id) {
  const all = TBE.trackers();
  delete all[id];
  await game.settings.set("the-broken-empires", TBE.TRACKER_SETTING, all);
};

TBE.newTrackerId = () => "t" + Date.now().toString(36) + Math.floor(Math.random() * 46656).toString(36);

/* Every roll in these systems is a plain standard roll (p.19-22): TBE.resolve
 * already carries the tens-die SL count, the +3 critical-success bonus, and
 * the over-100-skill bonus, so extended/social rolls reuse it rather than
 * reimplementing SL math a second time. */
TBE.rollAttempt = async function (skillValue, expertise = 0) {
  const roll = await TBE.d100();
  return { roll, r: TBE.resolve(roll.total, skillValue, expertise) };
};

/* Halve-round-up, the shared critical-failure penalty across Extended Rolls
 * and both Social Encounter variants. Never drops below zero. */
TBE.halveUp = (n) => Math.max(0, Math.ceil(n / 2));
