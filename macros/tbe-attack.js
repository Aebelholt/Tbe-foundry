/* TBE: Attack — pick a weapon, everything else is read off the sheets.
 * Select your token, target the foe (T on its token), then run.
 * Ported to the native "the-broken-empires" system: weapon dmg/nl/cl/cs/dis/t,
 * skill values, armour AP, toughness, difficulty, wounds, shock, and the Death
 * Threshold are all real DataModel fields now (system.*), not flags.tbe.* or
 * CoC7 sheet fields. Hit-location flavour text still uses the display names
 * ("Body", "R Arm", ...); DISPLAY_TO_SCHEMA converts to the schema's camelCase
 * keys (body, rArm, ...) at the point wounds/armour are actually read or written. */

const LOCATIONS = [
  { key: "Body", detail: [[1, 5, "Chest"], [6, 8, "Stomach"], [9, 10, "Groin"]] },
  { key: "R Arm", detail: [[1, 2, "Shoulder"], [3, 4, "Bicep"], [5, 5, "Elbow"], [6, 8, "Forearm"], [9, 10, "Hand"]] },
  { key: "L Arm", detail: [[1, 2, "Shoulder"], [3, 4, "Bicep"], [5, 5, "Elbow"], [6, 8, "Forearm"], [9, 10, "Hand"]] },
  { key: "R Leg", detail: [[1, 2, "Hip"], [3, 6, "Thigh"], [7, 7, "Knee"], [8, 9, "Shin"], [10, 10, "Foot"]] },
  { key: "L Leg", detail: [[1, 2, "Hip"], [3, 6, "Thigh"], [7, 7, "Knee"], [8, 9, "Shin"], [10, 10, "Foot"]] },
  { key: "Head", detail: [[1, 2, "Skull"], [3, 4, "Eye"], [5, 6, "Face"], [7, 7, "Nose"], [8, 9, "Ear"], [10, 10, "Neck"]] }
];
const DISPLAY_TO_SCHEMA = { "Body": "body", "R Arm": "rArm", "L Arm": "lArm", "R Leg": "rLeg", "L Leg": "lLeg", "Head": "head" };
const generalLocation = (d) => (d >= 1 && d <= 5 ? "Body" : d === 6 ? "R Arm" : d === 7 ? "L Arm" : d === 8 ? "R Leg" : d === 9 ? "L Leg" : "Head");
const detailLocation = (key, d10) => {
  const loc = LOCATIONS.find((l) => l.key === key);
  const hit = loc?.detail.find((x) => d10 >= x[0] && d10 <= x[1]);
  return hit ? hit[2] : "";
};

/* All skills on an actor as {name, value, fighting, expertise}. */
const actorSkillList = (actor) =>
  (actor?.items ?? [])
    .filter((i) => i.type === "skill")
    .map((i) => ({ name: i.name, value: TBE.num(i.system?.value, 0), fighting: !!i.system?.fighting, expertise: TBE.num(i.system?.expertise, 0) }));

/* Find the actor's skill value for a weapon's linked skill name, tolerant of a
 * trailing "(Sub)" qualifier. */
const findSkill = (actor, wanted) => {
  if (!wanted) return null;
  const w = wanted.toLowerCase().trim();
  for (const i of actor?.items ?? []) {
    if (i.type !== "skill") continue;
    const n = i.name.toLowerCase();
    if (n === w || n.indexOf("(" + w + ")") > -1) return { name: i.name, value: TBE.num(i.system?.value, 0), expertise: TBE.num(i.system?.expertise, 0) };
  }
  return null;
};

const attacker = canvas.tokens?.controlled?.[0]?.actor ?? game.user?.character ?? null;
const targetToken = [...(game.user?.targets ?? [])][0] ?? null;
const target = targetToken?.actor ?? null;

if (!attacker) {
  ui.notifications?.warn("TBE: select your token first.");
} else if (!target) {
  ui.notifications?.warn("TBE: target the foe with T on its token, then run again.");
} else {
  /* Weapons: skill and damage come straight off the weapon Item's real fields. */
  const weapons = (attacker.items ?? []).filter((i) => i.type === "weapon").map((i) => {
    const s = i.system ?? {};
    const dmg = TBE.num(s.dmg, 0);
    const skillName = s.skillName || i.name;
    const sk = findSkill(attacker, skillName) ?? findSkill(attacker, i.name);
    return {
      id: i.id, name: i.name, dmg,
      nl: !!s.nl, ranged: !!s.ranged,
      usesAmmo: TBE.weaponUsesAmmo(i), throwable: TBE.weaponThrowable(i),
      /* Weapon Readiness (p.129): a stored greatsword and a drawn one are not
         equally available, and nothing here used to say so. */
      readiness: TBE.readiness(i), readinessNote: TBE.readinessNote(i),
      cl: TBE.num(s.cl, 3), cs: TBE.num(s.cs, 3), dis: TBE.num(s.dis, 4), t: TBE.num(s.t, 5),
      skillName: sk?.name ?? skillName, skillValue: sk?.value ?? 0, skillExpertise: sk?.expertise ?? 0, matched: !!sk
    };
  }).filter((w) => w.dmg > 0 || w.skillValue > 0);

  /* A weapon whose skill is missing from the sheet falls back to the best fighting skill,
     rather than silently rolling against zero. */
  const bestFighting = actorSkillList(attacker)
    .filter((s) => s.fighting || /melee|might|missile|thrown/i.test(s.name))
    .sort((a, b) => b.value - a.value)[0] ?? null;
  for (const w of weapons) {
    if (!w.matched && bestFighting) {
      w.skillName = bestFighting.name + " (stand-in for " + w.skillName + ")";
      w.skillValue = bestFighting.value;
      w.skillExpertise = bestFighting.expertise;
    }
  }

  /* Defence: Dodge, or the defender's best fighting skill (their parry). */
  const defSkillsAll = actorSkillList(target);
  /* A character with no Dodge written down can still Dodge, untrained at 20
     (p.104); before v0.49.0 the option simply was not offered. A creature's
     stat block is its whole list, so it only dodges if the block says so. */
  const dodge = defSkillsAll.filter((s) => /dodge/i.test(s.name)).sort((a, b) => b.value - a.value)[0] ??
    (target.type === "creature" ? null : { name: "Dodge (untrained)", value: TBE.BASE_SKILL, fighting: false, expertise: 0 });
  const parry = defSkillsAll.filter((s) => s.fighting || /melee|might|axe|sword|spear|club|bite|claw|scimitar|hammer|fang|tusk|sting|crush|tentacle|talon/i.test(s.name))
    .sort((a, b) => b.value - a.value)[0] ?? null;
  const defChoices = [];
  if (dodge) defChoices.push(dodge);
  if (parry && (!dodge || parry.name !== dodge.name)) defChoices.push(parry);
  defChoices.sort((a, b) => b.value - a.value);

  /* Armour: creatures carry a per-location natural/worn grid (system.armour);
     PCs instead wear individual Armor items, each covering only the hit
     location(s) checked on its own sheet ("Armor protects individual hit
     locations... may not be layered", p.140) -- so a PC's AP depends on
     which location is actually struck, not just the strongest piece worn. */
  const isCreature = target.type === "creature";
  const armourGrid = isCreature ? (target.system?.armour ?? {}) : null;
  const LOC_ABBR = { head: "Head", body: "Body", rArm: "R Arm", lArm: "L Arm", rLeg: "R Leg", lLeg: "L Leg" };
  // Ch.9 p.129: a piece not currently worn (system.equipped false, e.g. spare
  // armor riding in Inventory instead) protects nothing.
  const armorItems = isCreature ? [] : (target.items ?? []).filter((i) => i.type === "armor" && i.system?.equipped !== false);
  const unassignedArmor = armorItems.filter((i) => !Object.values(i.system?.locations ?? {}).some(Boolean));
  const armorSummary = armorItems.map((i) => {
    const locs = Object.entries(i.system?.locations ?? {}).filter(([, on]) => on).map(([k]) => LOC_ABBR[k]);
    return i.name + " " + TBE.num(i.system?.ap, 0) + " AP (" + (locs.length ? locs.join("/") : "no location checked, see its sheet") + ")";
  }).join(", ") || "none worn";
  const pcArmourAp = (loc) => {
    const key = DISPLAY_TO_SCHEMA[loc];
    return Math.max(0, ...armorItems
      .filter((i) => i.system?.locations?.[key])
      .map((i) => TBE.num(i.system?.ap, 0)), 0);
  };
  /* A shield only blocks if it is actually in hand (Ch.9 p.129). This asks the
     carry-state owner rather than testing `!== "stored"`, which was the same
     negative-filter bug v0.35.0 fixed in the sheet and encStatus and MISSED
     here: the moment `dropped` existed, a shield lying on the ground went on
     granting AP and costing SLs to circumvent, because it was merely not
     "stored". A dropped shield defends nobody. */
  const inHand = (i) => TBE.carryPool(i.system?.carried) === TBE.POOL.HAND;
  const wornShieldAp = Math.max(0, ...(target.items ?? [])
    .filter((i) => i.type === "shield" && inHand(i))
    .map((i) => TBE.num(i.system?.ap, 0)), 0);
  const natFor = (loc) => isCreature ? TBE.num(armourGrid[DISPLAY_TO_SCHEMA[loc]]?.natural, 0) : pcArmourAp(loc);
  /* In TBE stat blocks the "worn" number on a creature's armour grid is its shield
     contribution; for a PC it's whatever their worn Shield item carries. */
  const shieldAp = isCreature
    ? Math.max(0, ...Object.values(armourGrid).map((r) => TBE.num(r.worn, 0)), 0)
    : wornShieldAp;
  const toughness = TBE.num(target.system?.toughness, 0);
  const difficulty = isCreature ? target.system?.difficulty : null;

  /* Size gap (Ch.18). Real per-roll math, not flavour: it can hand the attacker
     +20, strip the defender's ability to parry, and take Drive Back, Trip and
     Disarm off the table entirely. */
  const sizeFx = TBE.sizeEffects(attacker.system?.size ?? "Medium", target.system?.size ?? "Medium");
  const sizeNotes = TBE.sizeNotes(sizeFx, attacker.name, target.name);

  /* Encumbrance (Ch.9 p.130): over Max Inventory ENC penalises "physical
     activity" rolls, which a melee/missile attack and a Dodge/parry defence
     both always are. Prefilled into the modifier fields below (still
     editable) rather than silently folded into the roll. */
  const atkEnc = TBE.encStatus(attacker);
  const defEnc = isCreature ? null : TBE.encStatus(target);

  if (!weapons.length) {
    ui.notifications?.warn("TBE: " + attacker.name + " has no usable weapon items. Drag one on from TBE Weapons, or use TBE: Opposed Roll.");
  } else {
    /* The last attack this user made with this attacker (v0.49.0, first-
       session note: "Remember the last attack, so it's not starting over as
       much"). Weapon, throw, Wound Die and, per target, the defence. Choices
       only: the modifiers are recomputed every time (encumbrance, zones and
       size change between rounds) and nothing that spends is remembered. */
    const mem = TBE.recall("attack", attacker.id) || {};
    const wLast = Math.max(0, weapons.findIndex((w) => w.id === mem.weaponId || w.name === mem.weapon));
    const wOpts = weapons.map((w, i) =>
      '<option value="' + i + '"' + (i === wLast ? " selected" : "") + '>' + w.name + " &mdash; " + w.skillName + " " + w.skillValue + TBE.expertiseTag(w.skillExpertise) +
      ", Dmg " + w.dmg + (w.nl ? " NL" : "") + " [" + w.readiness.short + "]" +
      (w.matched ? "" : " [no matching skill]") + "</option>"
    ).join("");
    /* "Melee attacks from a creature 3+ Sizes larger cannot be parried, only
       Dodged." Drop the parry option rather than let it be picked illegally. */
    const legalDef = (sizeFx && sizeFx.defenderMustDodge)
      ? defChoices.filter((s) => /dodge/i.test(s.name))
      : defChoices;
    /* The defence remembered for THIS target, and only if it is still legal
       (a size gap can take the parry away between one fight and the next).
       "Undefended" is never remembered: surprise is a one-round fact. */
    const dLastName = mem.def?.[target.id] ?? null;
    const dLast = legalDef.findIndex((s) => s.name === dLastName);
    const dOpts = legalDef.map((s, i) => '<option value="' + i + '"' + (i === dLast ? " selected" : "") + '>' + s.name + " (" + s.value + TBE.expertiseTag(s.expertise) + ")</option>").join("") +
      '<option value="none">Undefended (surprised)</option>';

    /* Zone Hazards (p.151): offered pre-ticked, applied only if the chosen
       weapon and defence are the kind the hazard names. The GM unticks one
       when the fiction says otherwise (the target is clearly seen). */
    const attackerToken = canvas.tokens?.controlled?.[0] ?? null;
    const zoneFx = TBE.attackHazards(attackerToken, targetToken);
    const zoneHtml = zoneFx && (zoneFx.mods.length || zoneFx.notes.length)
      ? '<div style="font-size:12px;margin-top:4px;padding:4px;border:1px dashed #7a6a4f;border-radius:4px"><b>Zone hazards</b>' +
        zoneFx.mods.map((m) => '<label style="display:block"><input type="checkbox" name="hz_' + m.id + '" checked> ' +
          m.label + " (p." + m.page + ")" + (m.note ? '<div style="font-size:11px;opacity:.8;margin-left:20px">' + m.note + "</div>" : "") + "</label>").join("") +
        zoneFx.notes.map((n) => '<div style="font-size:11px;opacity:.85">' + n.text + " (p." + n.page + ")</div>").join("") +
        "</div>"
      : "";

    const content =
      '<div style="font-size:13px">' +
      "<div><b>" + attacker.name + "</b> attacks <b>" + target.name + "</b></div>" +
      '<label style="display:block;margin-top:4px">Weapon: <select name="weapon" style="width:100%">' + wOpts + "</select></label>" +
      (weapons.some((w) => w.throwable)
        ? '<label style="display:block"><input type="checkbox" name="thrown"' + (mem.thrown ? " checked" : "") + '> Throw it (' +
          weapons.filter((w) => w.throwable).map((w) => w.name).join(", ") + ' can be thrown; leave unticked to strike in melee)</label>'
        : "") +
      '<label style="display:block">Attack modifier: <input type="number" name="atkMod" value="' + atkEnc.penalty + '" style="width:100%"></label>' +
      TBE.encNote(attacker) +
      TBE.riderNote(attacker) +
      '<label style="display:block">Defence: <select name="def" style="width:100%">' + dOpts + "</select></label>" +
      '<label style="display:block">Defence modifier: <input type="number" name="defMod" value="' + (defEnc ? defEnc.penalty : 0) + '" style="width:100%"></label>' +
      (defEnc ? TBE.encNote(target) : "") +
      TBE.riderNote(target) +
      zoneHtml +
      (difficulty && ["Challenging", "Hard", "Severe", "Extreme"].includes(difficulty)
        ? '<div style="color:#b04040;font-size:12px;margin-top:4px"><b>' + difficulty + ' foe.</b> Against a starting PC this fight is heavily against you. Fleeing, talking, and ambushes are also actions.</div>'
        : "") +
      (sizeNotes.length
        ? '<div style="font-size:12px;margin-top:4px;padding:4px;border:1px dashed #7a6a4f;border-radius:4px">' +
          sizeNotes.map((n) => "<div>" + n + "</div>").join("") + "</div>"
        : "") +
      '<div style="font-size:11px;opacity:.8;margin-top:4px">' + target.name + ": shield " + shieldAp + " AP, Toughness " + toughness +
      (isCreature ? "" : ", armour worn: " + armorSummary) + "</div>" +
      (unassignedArmor.length ? '<div style="font-size:11px;color:#b04040">' + unassignedArmor.map((i) => i.name).join(", ") +
        " has no hit location checked and protects nothing -- open the item and check one (p.140).</div>" : "") +
      '<label style="display:block"><input type="checkbox" name="d20"' + (mem.d20 ? " checked" : "") + '> Defender uses a d20 Wound Die (Solo Constitution)</label>' +
      (mem.weapon ? '<div style="font-size:11px;opacity:.7;margin-top:2px">Opened on your last attack with ' + attacker.name + ".</div>" : "") +
      "</div>";

    const data = await TBE.prompt("TBE Attack", content, "Strike");
    if (data) {
      const w = weapons[TBE.num(data.weapon, 0)];
      const sizeToHit = sizeFx ? sizeFx.toHit : 0;
      /* A shot (bow, crossbow, sling) or a throw the attacker chose. Only a
         shot spends ammunition (p.156). */
      const isThrow = w.throwable && data.thrown === "on";
      const isRanged = w.usesAmmo || isThrow;
      const undefended = data.def === "none" || !legalDef.length;
      const defPick = undefended ? null : legalDef[TBE.num(data.def, 0)] ?? legalDef[0] ?? null;
      await TBE.remember("attack", attacker.id, {
        weapon: w.name, weaponId: w.id, thrown: data.thrown === "on", d20: data.d20 === "on",
        /* Last 20 targets only; the newest is re-inserted at the end. */
        def: Object.fromEntries(Object.entries(mem.def || {})
          .filter(([k]) => k !== target.id).concat(defPick ? [[target.id, defPick.name]] : []).slice(-20))
      });
      const hz = zoneFx
        ? TBE.zones().resolveHazardMods(zoneFx.mods, {
            ticked: (id) => data["hz_" + id] === "on", ranged: isRanged,
            attackSkill: w.skillName, defenceSkill: defPick ? defPick.name : "" })
        : { attack: 0, defence: 0, applied: [] };
      const atk = w.skillValue + TBE.num(data.atkMod, 0) + sizeToHit + hz.attack;
      const def = defPick ? defPick.value + TBE.num(data.defMod, 0) + hz.defence : 0;
      const woundDie = data.d20 === "on" ? 20 : 10;

      const aRoll = await TBE.d100("attack");
      const aRes = TBE.resolve(aRoll.total, atk, w.skillExpertise);
      const rolls = [aRoll];
      let dRes = null;
      if (!undefended && defPick) {
        const dRoll = await TBE.d100("defence");
        dRes = TBE.resolve(dRoll.total, def, defPick.expertise);
        rolls.push(dRoll);
      }

      /* A shot spends ammunition whether it lands or not (p.156). A thrown
         dagger or spear does not: it IS the ammunition. Always report, even
         at 0 -- TBE.rollSupply already handles a depleted stock gracefully
         ("already exhausted"), so gating this on ammo > 0 used to silently
         skip the one message that's supposed to say "you're out." */
      if (w.usesAmmo) {
        const am = await TBE.rollSupply(attacker, "ammo");
        if (am.roll) rolls.push(am.roll);
        var ammoLine = '<div style="font-size:11px;opacity:.85">Ammo: ' + am.text + "</div>";
      }

      const aSL = aRes.success ? aRes.sl : 0;
      const dSL = dRes && dRes.success ? dRes.sl : 0;
      /* Full opposed-roll ladder, resolved silently: SLs, criticals, higher die, higher skill. */
      let attackerWins = false;
      let tieNote = "";
      if (aRes.success && (!dRes || !dRes.success)) attackerWins = true;
      else if (aRes.success && dRes.success) {
        if (aSL !== dSL) attackerWins = aSL > dSL;
        else if (aRes.crit !== dRes.crit) { attackerWins = aRes.crit; tieNote = "critical breaks the tie"; }
        else if (aRes.roll !== dRes.roll) { attackerWins = aRes.roll > dRes.roll; tieNote = "higher die breaks the tie, 0 DoS"; }
        else { attackerWins = atk >= def; tieNote = "higher skill breaks the tie, 0 DoS"; }
      }
      const dos = Math.max(0, aSL - dSL);

      let body =
        "<div><b>" + attacker.name + "</b>, " + w.name + " (" + w.skillName + " " + atk + ") vs <b>" + target.name + "</b>" +
        (defPick ? " (" + defPick.name + " " + def + ")" : " (undefended)") + "</div>" +
        (w.readinessNote ? '<div style="font-size:11px;opacity:.85">' + w.readinessNote + "</div>" : "") +
        (sizeNotes.length ? '<div style="font-size:11px;opacity:.85">' + sizeNotes.join(" &middot; ") + "</div>" : "") +
        (sizeToHit ? '<div style="font-size:11px;opacity:.85">Attack skill includes +' + sizeToHit + " for the Size gap.</div>" : "") +
        (hz.applied.length ? '<div style="font-size:11px;opacity:.85">Zone: ' +
          hz.applied.map((m) => m.label + " (p." + m.page + ")").join(" &middot; ") + "</div>" : "") +
        "<div>Attack: <b>" + TBE.face(aRes.roll) + "</b> " + TBE.tag(aRes) + (aRes.success ? ", " + aSL + " SL" : "") + "</div>" +
        (dRes ? "<div>Defence: <b>" + TBE.face(dRes.roll) + "</b> " + TBE.tag(dRes) + (dRes.success ? ", " + dSL + " SL" : "") + "</div>" : "");

      if (typeof ammoLine === "string") body += ammoLine;
      if (isThrow) body += '<div style="font-size:11px;opacity:.85">Thrown.</div>';
      if (isRanged && aRes.critFail) body += '<div style="font-size:11px">Critical failure on a ranged attack: it strikes an unintended target that could reasonably be hit; otherwise ' +
        (w.usesAmmo ? "the Ammo Supply Die drops one step" : "it simply misses") + " (p.156, GM's call).</div>";
      if (tieNote) body += '<div style="font-size:11px;opacity:.8">' + tieNote + "</div>";
      if (!attackerWins) {
        body += '<div style="margin-top:4px;font-weight:bold;color:#6b2b2b">The attack is turned aside.</div>';
        if (dRes && dRes.critFail) body += "<div>Critical failure on defence: the attacker gains a bonus SL next exchange.</div>";
        await TBE.say(TBE.card("TBE Attack", body), rolls);
      } else {
        const onesDie = aRes.roll % 10;
        let loc = generalLocation(onesDie === 0 ? 10 : onesDie);
        const dOnes = dRes ? dRes.roll % 10 : (await new Roll("1d10").evaluate()).total % 10;
        const detail = detailLocation(loc, dOnes === 0 ? 10 : dOnes);

        /* Shield Bash's SL cost is the ATTACKER's own shield, p.140: Small 7,
           Medium 6, Large 5, and a Buckler cannot Shield Bash at all. Reading
           it off the shield item rather than a flat guess. */
        /* Same owner, same reason: you cannot Shield Bash with a shield you
           dropped. See wornShieldAp above. */
        const myShield = (attacker.items ?? []).find((i) =>
          i.type === "shield" && TBE.carryPool(i.system?.carried) === TBE.POOL.HAND);
        // Number(null) is 0, which is finite -- so neither TBE.num() nor a
        // naive Number.isFinite(Number(x)) check tells "no Shield Bash" (null)
        // apart from "costs 0" here. Check the type directly instead: a real
        // shb is a number once the DataModel has resolved it; anything else
        // (null for a Buckler, or no shield at all) means "can't".
        const rawShb = myShield?.system?.shb;
        const myShieldShb = typeof rawShb === "number" ? rawShb : null;

        /* `carry` is what the humans at the table have to do about this rider,
           in the book's own terms. None of these riders are enforced on a later
           roll -- the system has no cross-roll modifier engine and building one
           touches every macro -- so the card states the number and who applies
           it rather than painting an icon and implying it was handled. The roll
           dialogs surface any active rider (TBE.riderNote) beside their
           modifier field, which is where the number is actually needed. */
        const MANEUVERS = [
          { id: "unb", name: "Unbalance", cost: 1, note: "-20 to their next roll", effect: "unbalanced",
            carry: "<b>-20 to " + target.name + "'s next skill roll</b> — type it into that roll's Modifier field. Not an Endurance roll to resist Shock, and multiple Unbalances do not stack (p.163)." },
          { id: "db", name: "Drive Back", cost: 3, note: "push them a zone",
            carry: "Move both a zone; into a Rough zone they roll Athletics opposed to the attack or fall Prone. 4 SLs pushes them out without following (p.163)." },
          { id: "lock", name: "Lock", cost: 3, note: "no Fighting Withdrawal", effect: "locked",
            carry: "No Fighting Withdrawal on their next turn; to leave Engagement they must Flee. Ends if the attacker goes Prone or Stunned or leaves Engagement (p.163)." },
          { id: "pa", name: "Pierce Armor", cost: 4, note: "Piercing 3, rigid armour only" },
          { id: "cl", name: "Choose Location", cost: w.cl, note: "pick the struck location" },
          { id: "cs", name: "Circumvent Shield", cost: w.cs, note: "ignore shield AP" },
          { id: "dis", name: "Disarm", cost: w.dis, note: "Arm hit required", effect: "disarmed",
            carry: "Their weapon lands on the ground in front of them; picking it up is their action. +1 SL to send it into an adjacent zone, +2 for a two-hander, +3 for a shield (p.163)." },
          { id: "trip", name: "Trip", cost: w.t, note: "Leg hit required, knocks Prone", effect: "prone" },
          { id: "shb", name: "Shield Bash", cost: myShieldShb ?? 999,
            note: myShieldShb ? "shield-user, knocks Prone" : "requires a Small/Medium/Large shield at hand, not a Buckler", effect: "prone" },
          { id: "clsh", name: "Cleave Shield", cost: Math.max(1, dos), note: "uses DoS, forgoes damage" },
          /* p.164 reads the other way round from how this macro used to treat
             it: Compel Surrender REQUIRES an already-disadvantaged foe, it does
             not inflict a "Disadvantaged" condition. Painting that status was
             backwards. What it actually calls for is a Willpower roll from the
             target at a DoS-scaled penalty, so that is what the card asks for. */
          { id: "com", name: "Compel Surrender", cost: 3, note: "uses DoS, forgoes damage, foe must ALREADY be disadvantaged",
            carry: "They must already be significantly disadvantaged (a 3+ point Wound, Prone, Disarmed, outnumbered, or GM's call). " +
              "Then they roll <b>Willpower " + (dos >= 9 ? "-30" : dos >= 6 ? "-20" : dos >= 3 ? "-10" : "at no penalty") +
              "</b> (-10 per 3 DoS; you earned " + dos + "); fail and they surrender. PCs, animals, undead, non-sentient beings and Ferocity 5+ cannot be compelled (p.164)." }
        ];
        const allowed = aRes.crit ? 2 : 1;
        /* Ch.18: Drive Back, Trip and Disarm are simply unavailable against a
           foe 3+ Sizes larger, whatever the SLs rolled. */
        const sizeBlocked = new Set(sizeFx ? sizeFx.maneuversBlocked : []);
        const locOpts = LOCATIONS.map((l) => '<option value="' + l.key + '"' + (l.key === loc ? " selected" : "") + ">" + l.key + "</option>").join("");
        /* The location select used to be its own field below the whole maneuver
           list, always enabled, with only its label text hinting it's discarded
           unless Choose Location is separately ticked -- a player could fill it
           in, see nothing checked, and reasonably assume it took. Moved inline
           under the Choose Location row itself instead (TBE.prompt is a
           one-shot dialog with no live re-render, so a real disabled-until-
           checked toggle isn't available here; grouping + restated wording is
           the fix this architecture allows). */
        const rows = MANEUVERS.map((m) => {
          const blocked = sizeBlocked.has(m.id);
          const ok = aSL >= m.cost && !blocked;
          let row = '<label style="display:block;opacity:' + (ok ? "1" : ".45") + '"><input type="checkbox" name="m_' + m.id + '"' +
            (ok ? "" : " disabled") + "> <b>" + m.name + "</b> (" + m.cost + " SL) <span style='font-size:11px;opacity:.8'>" +
            (blocked ? "unavailable: target is 3+ Sizes larger" : m.note) + "</span></label>";
          if (m.id === "cl") {
            row += '<div style="margin:0 0 4px 22px">Location: <select name="loc" style="width:60%">' + locOpts + "</select>" +
              '<div style="font-size:11px;opacity:.8">Only used if the box above is checked and affordable -- otherwise the rolled location (' + loc + ') stands.</div></div>';
          }
          return row;
        }).join("");

        /* The roll goes to chat FIRST, and the maneuver dialog opens only once
           its dice have finished (Dice So Nice), so the table sees the hit
           land before anyone chooses what to do with it. The dialog used to
           open straight after the silent roll, and every die, attack,
           defence and wound, only appeared at the very end, in one card. The
           outcome card below carries the rest (maneuvers, wound die). */
        const rollMsg = await TBE.say(TBE.card("TBE Attack", body +
          '<div style="margin-top:4px"><b>The attack lands</b>, ' + aSL + " SL, DoS " + dos +
          ". Choosing maneuvers.</div>"), rolls);
        await TBE.waitForDice(rollMsg);
        rolls.length = 0;
        body = "<div><b>" + attacker.name + "</b>, " + w.name + " vs <b>" + target.name + "</b></div>";

        const md = await TBE.prompt(
          "Combat Maneuvers",
          '<div style="font-size:13px"><div>Rolled <b>' + aSL + " SL</b>" + (aRes.crit ? ", critical: two maneuvers allowed" : "") +
          ". DoS <b>" + dos + "</b>. Requirements use rolled SLs, nothing is spent. Pick up to " + allowed + ", or none.</div>" +
          '<div style="margin:6px 0;max-height:250px;overflow:auto">' + rows + "</div>" +
          "</div>",
          "Resolve"
        );
        const picked = md
          ? MANEUVERS.filter((m) => md["m_" + m.id] === "on" && aSL >= m.cost && !sizeBlocked.has(m.id)).slice(0, allowed)
          : [];
        const has = (id) => picked.some((m) => m.id === id);
        if (md && md.loc && has("cl")) loc = md.loc;

        const noDamage = has("clsh") || has("com");
        const armourAp = natFor(loc);
        let ap = armourAp;
        let apNote = "armour " + ap;
        if (!has("cs") && shieldAp) { ap += shieldAp; apNote += " + shield " + shieldAp; }
        else if (shieldAp) apNote += ", shield bypassed";
        /* Pierce Armor (p.163-164): "opponent in Reinforced Leather armor or
           better... has no effect if that location has 3 AP or less (Leather,
           Quilt, or Padding)... does not reduce a shield's AP" -- so it comes
           only off the armour component (never shieldAp), and only when the
           FINAL struck location (after any Choose Location swap above)
           actually carries more than 3 AP of worn armour. */
        if (has("pa")) {
          if (armourAp > 3) {
            const pierce = Math.min(3, armourAp);
            ap = Math.max(0, ap - pierce);
            apNote += ", pierced -" + pierce;
          } else {
            apNote += ", Pierce Armor has no effect here (" + armourAp + " AP is Leather/Quilt/Padding or bare)";
          }
        }

        const total = w.dmg + dos;
        const wp = noDamage ? 0 : Math.max(0, total - ap);

        body +=
          '<div style="border-top:1px solid #7a6a4f;margin-top:4px;padding-top:4px"><b>Hit</b> ' + loc +
          (detail ? " (" + detail + ")" : "") + ", DoS " + dos + "</div>" +
          (picked.length ? "<div>Maneuvers: <b>" + picked.map((m) => m.name).join(", ") + "</b></div>" : "") +
          (noDamage
            ? "<div><i>Damage forgone by the chosen maneuver.</i></div>"
            : "<div>Damage " + w.dmg + " + " + dos + " DoS = " + total + ", minus " + ap + " AP (" + apNote + ") &rarr; <b>" + wp + " WP" + (w.nl ? " non-lethal" : "") + "</b></div>");

        /* Apply maneuver riders as real state through the shared TBE status registry
           (see _lib.js) so every rider — including Prone now — ends up as an actual
           token icon, not just chat text claiming it happened. */
        for (const m of picked) {
          if (m.effect === "prone") {
            const ok = await TBE.applyStatus(target, "tbe-prone", { duration: { rounds: 1 } });
            body += ok ? "<div>" + target.name + " is knocked <b>Prone</b>.</div>" : "<div><i>Mark Prone by hand.</i></div>";
          } else if (m.effect) {
            const statusId = "tbe-" + m.effect;
            /* The status registry's own name is the adjective ("Unbalanced"),
               the maneuver's is the verb ("Unbalance"); the card is describing
               the target's condition, so it wants the former. */
            const label = TBE.statusDef(statusId)?.name || m.name;
            const ok = await TBE.applyStatus(target, statusId, { duration: { rounds: 1 } });
            body += ok
              ? "<div>" + target.name + " is <b>" + label + "</b> (status icon on the token).</div>"
              : "<div>" + target.name + " is <b>" + label + "</b>, track it by hand.</div>";
          }
          /* The icon says a rider happened; this says what it costs whoever
             rolls next, because nothing downstream applies it for them. */
          if (m.carry) {
            body += '<div style="font-size:11px;opacity:.85;margin:1px 0 3px 0">' + m.carry + "</div>";
          }
        }

        if (wp > 0) {
          /* Per-location record: the sim shows most defeats come from Shock via stacked
             impairments, not the Death Threshold, so this is the state that matters. */
          const schemaLoc = DISPLAY_TO_SCHEMA[loc];
          const wounds = TBE.wounds(target);
          wounds[schemaLoc] = wounds[schemaLoc] || TBE.emptyWoundLoc();
          wounds[schemaLoc].wp += wp;

          const wd = await new Roll("1d" + woundDie).evaluate();
          TBE.tagDice(wd, "wound");
          rolls.push(wd);
          const natTen = wd.total === woundDie;
          const impaired = !natTen && wd.total + toughness <= wounds[schemaLoc].wp;
          body += "<div>Wound Die d" + woundDie + ": <b>" + wd.total + "</b>" + (toughness ? " + " + toughness : "") +
            " vs " + wounds[schemaLoc].wp + " WP in " + loc + " &rarr; " + (impaired ? "<b>IMPAIRED</b>" : "no impairment") +
            (natTen ? " (natural top face, always avoided)" : "") + "</div>";

          let shock = false;
          // Derived from TBE.IMP_STATUS_ID (schema-keyed, the single source of
          // truth also used by TBE.syncStatuses) instead of a second hand-typed
          // display-label-keyed copy -- a rename now only has one place to update.
          const locStatusId = TBE.IMP_STATUS_ID[DISPLAY_TO_SCHEMA[loc]];
          if (impaired) {
            wounds[schemaLoc].imp += 1;
            if (locStatusId) await TBE.applyStatus(target, locStatusId, {});
            if (wounds[schemaLoc].imp >= 2) {
              shock = true;
              body += "<div><b>Second impairment in " + loc + ":</b> " + target.name + " drops in <b>SHOCK</b> for the failed Wound Die (" + wd.total + ") in minutes" +
                (loc === "Head" ? ", and is unconscious" : "") + ".</div>";
            } else if (loc === "Body") {
              /* p.172-173: a first Body impairment is "Succeed in an Endurance
                 roll or drop in Shock". A character with no Endurance written
                 on the sheet is untrained at 20 (p.104), not unable to roll:
                 until v0.49.0 this found no skill Item, skipped the roll and
                 printed "roll Endurance or drop in Shock" for somebody else to
                 remember. A creature's stat block is its whole skill list, so
                 one without Endurance has no book value: the GM is asked for
                 one, and a player attacking it gets the reminder line. */
              let endSkill = actorSkillList(target).filter((s) => /endurance/i.test(s.name))[0];
              if (!endSkill && !isCreature) endSkill = { name: "Endurance", value: TBE.BASE_SKILL, untrained: true };
              if (!endSkill && isCreature && game.user?.isGM) {
                const ask = await TBE.prompt("Body impaired",
                  "<div>" + target.name + "'s stat block lists no Endurance. Body impaired: it rolls Endurance or drops in Shock (p.173).</div>" +
                  '<label style="display:block">Endurance to roll against: <input type="number" name="end" value="" style="width:100%"></label>' +
                  '<div style="font-size:11px;opacity:.8">Leave it blank to rule it yourself.</div>', "Roll");
                const v = ask ? Number(ask.end) : NaN;
                if (ask && String(ask.end ?? "").trim() !== "" && Number.isFinite(v)) endSkill = { name: "Endurance", value: v, ruled: true };
              }
              if (endSkill) {
                const eRoll = await TBE.d100("defence");
                rolls.push(eRoll);
                const eRes = TBE.resolve(eRoll.total, endSkill.value);
                body += "<div>Body impaired: Endurance " + endSkill.value +
                  (endSkill.untrained ? " (untrained, p.104)" : endSkill.ruled ? " (GM's ruling)" : "") +
                  " roll <b>" + TBE.face(eRes.roll) + "</b> " + TBE.tag(eRes) + ".</div>";
                if (!eRes.success) { shock = true; body += "<div>" + target.name + " drops in <b>SHOCK</b>.</div>"; }
              } else {
                body += "<div>Body impaired: " + target.name + " has no Endurance on its stat block. The GM rules: an Endurance roll, or it drops in Shock (p.173).</div>";
              }
            } else {
              /* First-time impairment by location: the book splits the effect by whether
                 the failed Wound Die came up odd or even (p.173). Only Body skips this
                 split (Endurance-or-Shock, handled above). */
              const odd = wd.total % 2 === 1;
              if (loc === "R Arm" || loc === "L Arm") {
                if (odd) {
                  body += "<div>First impairment (Wound Die " + wd.total + ", odd): " + target.name + " drops anything held in that hand.</div>";
                } else {
                  await TBE.applyStatus(target, "tbe-arm-useless", {});
                  body += "<div>First impairment (Wound Die " + wd.total + ", even): " + target.name + " drops anything held, and the arm is <b>useless</b> until the impairment is removed &mdash; no weapon or shield in it, no skill rolls that need it.</div>";
                }
              } else if (loc === "R Leg" || loc === "L Leg") {
                if (odd) {
                  await TBE.applyStatus(target, "tbe-prone", {});
                  body += "<div>First impairment (Wound Die " + wd.total + ", odd): " + target.name + " falls <b>Prone</b>.</div>";
                } else {
                  await TBE.applyStatus(target, "tbe-leg-hobbled", {});
                  body += "<div>First impairment (Wound Die " + wd.total + ", even): " + target.name + " remains standing, but cannot Run or Charge until the impairment is removed.</div>";
                }
              } else if (loc === "Head") {
                if (odd) {
                  await TBE.applyStatus(target, "tbe-stunned", { duration: { rounds: 1 } });
                  body += "<div>First impairment (Wound Die " + wd.total + ", odd): " + target.name + " is <b>Stunned</b>, losing their next action (can still defend or move).</div>";
                } else {
                  shock = true;
                  body += "<div>First impairment (Wound Die " + wd.total + ", even): " + target.name + " drops unconscious and in <b>SHOCK</b>.</div>";
                }
              }
            }
          }

          if (shock) {
            /* A PC may spend 3 Resolve to refuse Shock. */
            /* Only free boxes count: spent Resolve and Fatigue both fill the
               track (p.26), so a character with 5 unspent and 3 Fatigue has 2
               to spend and cannot pay for this. */
            const resolve = target.system?.resolve;
            const free = TBE.availableResolve(target);
            if (resolve && typeof resolve.value === "number" && free >= 3 && target.hasPlayerOwner !== false && target.type === "character") {
              const before = resolve.value;
              const trackBefore = { system: { resolve: Object.assign({}, resolve), fatigue: target.system?.fatigue } };
              const keep = await TBE.prompt("Shock!", "<div>" + target.name + " is dropping in Shock. Spend <b>3 Resolve</b> to stay up?</div>" +
                "<div>" + TBE.resolveTrackHtml(trackBefore, 3) + "</div>" +
                '<label><input type="checkbox" name="spend" checked> Spend 3 Resolve</label>', "Decide");
              if (keep && keep.spend === "on") {
                /* The defender is very often not this user's actor -- a player
                   attacking the GM's creature, or the GM resolving a hit on a
                   player's character. This used to be a bare `.update()` with
                   no try at all, so a permission error threw out of the middle
                   of the attack and the card never posted. Now it reports. */
                const w = await TBE.write(target, { "system.resolve.value": before - 3 }, "the 3 Resolve");
                if (w.ok) {
                  shock = false;
                  body += "<div><b>3 Resolve spent</b>: " + target.name + " refuses the Shock and stays standing.</div>" +
                    "<div>" + TBE.resolveTrackHtml(trackBefore, 3) + "</div>";
                } else {
                  /* The choice stands, the bookkeeping does not. Leave Shock
                     applied rather than clearing a state nobody paid for. */
                  body += '<div style="color:#8b1a1a">' + target.name + " chose to spend 3 Resolve, but it could not be written, so the Shock still applies. " +
                    TBE.esc(w.notice) + "</div>";
                }
              }
            }
            if (shock) {
              await TBE.applyStatus(target, "tbe-prone", {});
              if (loc === "Head") await TBE.applyStatus(target, "tbe-unconscious", {});
              /* Shock is a whole-character system.shock boolean, not per-location (matches
                 the book: one Shock state, cleared by one Heal roll, however triggered). */
              await TBE.setShock(target, true);
            }
          }

          await TBE.setWounds(target, wounds);
          await TBE.syncStatuses(target);
          const locLine = TBE.LOCATIONS.map((k) => (TBE.LOC_LABELS[k] || k) + " " + wounds[k].wp + (wounds[k].imp ? " Imp" + wounds[k].imp : "")).join(", ");
          body += '<div style="font-size:11px;opacity:.8">Locations: ' + locLine + "</div>";

          if (!w.nl) {
            const dt = target.system?.deathThreshold;
            if (dt && typeof dt.value === "number" && (dt.max ?? 0) > 0) {
              /* Shared with TBE: Wounds & Recovery -- see TBE.deathThresholdNote.
                 This used to re-derive "left = dt.max - totalWp" here on its own,
                 which reports the real (harder) Death Threshold trigger correctly
                 but never surfaced Dying (Shock past the Lethality Level, p.174),
                 a separate and softer threshold that base-actor.mjs already
                 derives correctly but no macro ever showed. */
              const dtNote = TBE.deathThresholdNote(target, TBE.totalWp(wounds));
              const wdt = await TBE.write(target, { "system.deathThreshold.value": dtNote.left },
                "the " + wp + " WP against the Death Threshold");
              if (wdt.ok) {
                body += "<div>" + dtNote.line + "</div>";
                if (dtNote.dead) {
                  body += '<div style="font-weight:bold;color:#8b1a1a">Death Threshold reached, ' + target.name + " falls.</div>";
                  await TBE.applyStatus(target, "dead", {}).catch(() => {});
                }
              } else {
                /* The damage is real whether or not this user may record it.
                   Show the line so the table can see what happened, and say
                   who has to write it down. */
                body += "<div>" + dtNote.line + "</div>" +
                  '<div style="color:#8b1a1a"><i>Not recorded on the sheet. ' + TBE.esc(wdt.notice) + "</i></div>";
              }
            } else {
              body += "<div><i>" + target.name + "'s Death Threshold is not set. Set it on the sheet, then damage applies automatically. Record " + wp + " WP by hand this once.</i></div>";
            }
          } else {
            body += "<div><i>Non-lethal: does not count against the Death Threshold.</i></div>";
          }
        }

        await TBE.say(TBE.card("TBE Attack", body), rolls);
      }
    }
  }
}
