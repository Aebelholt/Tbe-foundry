/* TBE: Quick Combat — the book's Quick Resolution (Ch.10 p.169).
 * One roll against every foe: win the contest, achieve your intention; lose one, take a hit.
 * Select your token, target one or more foes (T on each), run. */

const skillVal = (item) => TBE.num(item.system?.value, 0);
const locFromOnes = (o) => (o >= 1 && o <= 5 ? "Body" : o === 6 ? "R Arm" : o === 7 ? "L Arm" : o === 8 ? "R Leg" : o === 9 ? "L Leg" : "Head");

const pc = canvas.tokens?.controlled?.[0]?.actor ?? game.user?.character ?? null;
const foes = [...(game.user?.targets ?? [])].map((t) => t.actor).filter(Boolean);

if (!pc) {
  ui.notifications?.warn("TBE: select your token first.");
} else if (!foes.length) {
  ui.notifications?.warn("TBE: target one or more foes with T, then run again.");
} else {
  const skills = (pc.items ?? []).filter((i) => i.type === "skill")
    .map((i) => ({ name: i.name, value: skillVal(i), expertise: TBE.num(i.system?.expertise, 0) }))
    .sort((a, b) => b.value - a.value);
  const sOpts = skills.map((s) => '<option value="' + s.value + '|' + s.name + '|' + s.expertise + '">' + s.name + " (" + s.value + ")</option>").join("");

  const foeLine = foes.map((f) => f.name).join(", ");
  const pcEnc = TBE.encStatus(pc);
  const data = await TBE.prompt(
    "TBE Quick Combat",
    '<div style="font-size:13px">' +
    "<div><b>" + pc.name + "</b> vs <b>" + foeLine + "</b></div>" +
    '<div style="font-size:12px;opacity:.85;margin:4px 0">One roll settles it. State your intention: cut them down, run past, hold the door. Win against a foe and your intention prevails over them; lose against a foe and they wound you as normal (your SLs still reduce theirs for damage).</div>' +
    '<label style="display:block">Intention: <input type="text" name="intent" placeholder="Cut the bandit down" style="width:100%"></label>' +
    '<label style="display:block">Your skill: <select name="pick" style="width:100%">' + sOpts + "</select></label>" +
    '<label style="display:block">Modifier (outnumbered by N foes: they each get +20, or +10 with Enhanced Defense; Encumbrance overflow is pre-filled): <input type="number" name="mod" value="' + pcEnc.penalty + '" style="width:100%"></label>' +
    TBE.encNote(pc) +
    "</div>",
    "Resolve the fight"
  );

  if (data) {
    const bits = String(data.pick || "").split("|");
    const mySkill = TBE.num(bits[0], 50) + TBE.num(data.mod, 0);
    const myName = bits[1] || "Skill";
    const myExpertise = TBE.num(bits[2], 0);
    const outnumberBonus = foes.length > 1 ? 20 : 0;

    const myRoll = await TBE.d100();
    const my = TBE.resolve(myRoll.total, mySkill, myExpertise);
    const mySL = my.success ? my.sl : 0;
    const rolls = [myRoll];

    let body =
      (data.intent ? '<div style="font-style:italic">&ldquo;' + data.intent + '&rdquo;</div>' : "") +
      "<div><b>" + pc.name + "</b> " + myName + " " + mySkill + ": <b>" + TBE.face(my.roll) + "</b> " + TBE.tag(my) +
      (my.success ? ", " + mySL + " SL" : "") + "</div>" +
      (outnumberBonus ? '<div style="font-size:11px;opacity:.8">Each foe rolls at +' + outnumberBonus + " for outnumbering (reduce their modifier by hand if you have Enhanced Defense).</div>" : "");

    let prevailed = 0;
    for (const foe of foes) {
      const fSkills = (foe.items ?? []).filter((i) => i.type === "skill").map((i) => ({ name: i.name, value: skillVal(i), expertise: TBE.num(i.system?.expertise, 0) }));
      const best = fSkills.filter((s) => !/dodge|perception|willpower|endurance|athletics|stealth/i.test(s.name))
        .sort((a, b) => b.value - a.value)[0] ?? fSkills.sort((a, b) => b.value - a.value)[0] ?? { name: "Skill", value: 40, expertise: 0 };
      const fRoll = await TBE.d100();
      rolls.push(fRoll);
      const fr = TBE.resolve(fRoll.total, best.value + outnumberBonus, best.expertise);
      const fSL = fr.success ? fr.sl : 0;
      const iWin = my.success && (mySL > fSL || (mySL === fSL && (my.crit && !fr.crit || (!fr.crit && my.roll > fr.roll))));

      body += "<div style='border-top:1px solid #7a6a4f;margin-top:4px;padding-top:4px'><b>" + foe.name + "</b>, " +
        best.name + " " + (best.value + outnumberBonus) + ": <b>" + TBE.face(fr.roll) + "</b> " + TBE.tag(fr) + (fr.success ? ", " + fSL + " SL" : "") + "</div>";

      if (iWin) {
        prevailed++;
        body += "<div>Your intention prevails over " + foe.name + ".</div>";
        /* If the intention was to take them out, mark it. */
        const dt = foe.system?.deathThreshold;
        if (/cut|kill|take.*out|down|slay|defeat/i.test(data.intent || "") && dt && typeof dt.value === "number") {
          try {
            await foe.update({ "system.deathThreshold.value": 0 });
            await TBE.applyStatus(foe, "dead", {}).catch(() => {});
            body += "<div><b>" + foe.name + " is taken out.</b></div>";
          } catch (e) {}
        }
      } else if (fr.success) {
        /* They wound you as normal combat: their DoS (reduced by your SLs) + weapon damage. */
        const foeW = (foe.items ?? []).find((i) => i.type === "weapon");
        const wDmg = TBE.num(foeW?.system?.dmg, 2);
        const dos = Math.max(0, fSL - mySL);
        const ones = fr.roll % 10;
        const loc = locFromOnes(ones === 0 ? 10 : ones);
        /* Your armour: ask nothing, use flags if present else 3+shield estimate is too bold — report raw. */
        const dmg = wDmg + dos;
        body += "<div>" + foe.name + " wounds you: <b>" + dmg + " damage</b> to <b>" + loc + "</b> before your armour and shield AP. " +
          "Subtract AP, mark the WP on your sheet, roll the Wound Die.</div>";
      } else {
        body += "<div>Neither side prevails against this foe; the situation holds.</div>";
      }
    }

    if (prevailed === foes.length) {
      body += '<div style="margin-top:4px;font-weight:bold;color:#1f7a1f">Full success: the encounter resolves your way.</div>';
    }
    await TBE.say(TBE.card("TBE Quick Combat", body), rolls);
  }
}
