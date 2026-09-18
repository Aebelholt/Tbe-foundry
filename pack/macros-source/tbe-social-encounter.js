/* TBE: Social Encounter (Ch.13, p.249-264) — Static (influencing an NPC who
 * isn't opposed by another party) and Competitive (two or more sides vying
 * for a third party's favor: a debate, a trial, a council vote). Both are
 * extended rolls built on Social skills, tracked persistently the same way
 * as TBE: Extended Roll.
 *
 * This macro shows the running total and (for Static) the Tolerance openly,
 * matching how every other tool in this pack works. The book treats these
 * as secret from the players; if you're running this for a group and want
 * that secrecy, keep this dialog and its chat cards to yourself the way
 * you'd keep a GM screen up, since nothing here whispers on its own.
 */

const outcomeStatic = (sl) => sl >= 16 ? "Success with extra benefits" : sl >= 11 ? "Success" :
  sl >= 6 ? "Success with a cost, complication, or compromise" : "Failure";
const outcomeCompetitive = (dos) => dos >= 10 ? "Success with one or more extra benefits" :
  dos >= 6 ? "Success but with nothing extra" : "Success with a cost, complication, or compromise";

const all = TBE.trackers();
const staticTrackers = Object.values(all).filter((t) => t.kind === "social-static" && t.status === "active");
const compTrackers = Object.values(all).filter((t) => t.kind === "social-competitive" && t.status === "active");
const active = [...staticTrackers, ...compTrackers];

const statusBlock = active.length
  ? active.map((t) => t.kind === "social-static"
      ? "<div><b>" + t.name + "</b> (Static): " + t.total + " SLs, Tolerance " + t.tolerance +
        ", " + t.attemptsUsed + " attempt(s) made</div>"
      : "<div><b>" + t.name + "</b> (Competitive, Victory " + t.victoryCondition + "): " +
        t.sides.map((s) => s.name + " " + s.total).join(" vs ") + " &middot; round " + t.round + "</div>"
    ).join("")
  : "<div style='opacity:.75'>No active Social Encounters.</div>";

const trackerOpts = active.map((t) => '<option value="' + t.id + '">' + t.name + " (" + (t.kind === "social-static" ? "Static" : "Competitive") + ")</option>").join("");

const me = TBE.me();
const socialSkills = (me?.items ?? []).filter((i) => i.type === "skill" && i.system?.group === "Social")
  .map((i) => ({ name: i.name, value: TBE.num(i.system?.value, 0) })).sort((a, b) => a.name.localeCompare(b.name));
const skillPick = socialSkills.length
  ? '<label style="display:block">Social skill from sheet: <select name="pick" style="width:100%">' +
    '<option value="">-- use the fields below --</option>' +
    socialSkills.map((x) => '<option value="' + x.value + '|' + x.name + '">' + x.name + " (" + x.value + ")</option>").join("") +
    "</select></label>"
  : "";

const compSideOpts = (t) => (t?.sides || []).map((s, i) => '<option value="' + i + '">' + s.name + "</option>").join("");

const content =
  '<div style="font-size:13px">' + statusBlock + "<hr>" +
  '<label style="display:block">Tracker: <select name="tracker" style="width:100%">' +
  '<option value="">-- Start a new Social Encounter --</option>' + trackerOpts + "</select></label>" +
  '<label style="display:block">Action (ignored when starting new): <select name="act" style="width:100%">' +
  '<option value="roll">Make a Social roll</option>' +
  '<option value="end">End now (Static: voluntary end &middot; Competitive: declare current leader winner)</option>' +
  "</select></label>" +
  "<hr><b>New tracker</b>" +
  '<label style="display:block">Type: <select name="mode" style="width:100%">' +
  '<option value="static">Static (one NPC, no rival side)</option>' +
  '<option value="competitive">Competitive (two or more sides)</option>' +
  "</select></label>" +
  '<label style="display:block">Name: <input type="text" name="name" value="Social Encounter" style="width:100%"></label>' +
  '<label style="display:block">Static &mdash; Tolerance: <select name="tolMode" style="width:100%">' +
  '<option value="5">Standard (5)</option><option value="2d10">Roll 2d10 (hidden result)</option>' +
  '<option value="manual">Manual, see number below</option></select></label>' +
  '<label style="display:block">Manual Tolerance: <input type="number" name="tolManual" value="5" style="width:100%"></label>' +
  '<label style="display:block">Competitive &mdash; Victory Condition: <input type="number" name="victory" value="15" style="width:100%"></label>' +
  '<label style="display:block">Competitive &mdash; sides, one per line ("Name" or "Name, starting SLs"):<br>' +
  '<textarea name="sides" rows="3" style="width:100%">Party\nOpposition</textarea></label>' +
  "<hr><b>Roll</b>" +
  '<label style="display:block">Participant: <input type="text" name="who" value="' + (me?.name ?? "") + '" style="width:100%"></label>' +
  skillPick +
  '<label style="display:block">Skill name (if not picked above): <input type="text" name="skillName" value="" style="width:100%"></label>' +
  '<label style="display:block">Skill value (if not picked above): <input type="number" name="skillValue" value="50" style="width:100%"></label>' +
  '<label style="display:block">Competitive &mdash; rolling for side #: <input type="number" name="side" value="0" style="width:100%"></label>' +
  '<label style="display:block">Competitive &mdash; on success: <select name="intent" style="width:100%">' +
  '<option value="support">Add SLs to my own side</option><option value="detract">Subtract SLs from the other side</option></select></label>' +
  '<label style="display:block">Competitive &mdash; if detracting and there are 3+ sides, target side #: <input type="number" name="targetSide" value="1" style="width:100%"></label>' +
  "</div>";

const data = await TBE.prompt("Social Encounter", content, "Go");
if (data) {
  const rolls = [];
  let body = "";

  if (!data.tracker) {
    /* ---- start a new tracker ---- */
    const name = (data.name || "Social Encounter").trim();
    if (data.mode === "competitive") {
      const lines = (data.sides || "").split("\n").map((l) => l.trim()).filter(Boolean);
      const sides = lines.length >= 2 ? lines : ["Party", "Opposition"];
      const t = {
        id: TBE.newTrackerId(), kind: "social-competitive", status: "active", name,
        victoryCondition: Math.max(1, TBE.num(data.victory, 15)),
        sides: sides.map((l) => {
          const [n, s] = l.split(",");
          return { name: (n || "Side").trim(), total: Math.max(0, TBE.num(s, 0)) };
        }),
        turnIndex: 0, round: 1, log: []
      };
      await TBE.saveTracker(t);
      body = "<div><b>" + t.name + "</b> (Competitive) started. Victory Condition " + t.victoryCondition + ". Sides: " +
        t.sides.map((s) => s.name + (s.total ? " (starts at " + s.total + ")" : "")).join(", ") + ".</div>";
    } else {
      let tolerance = 5;
      let tolNote = "standard 5";
      if (data.tolMode === "manual") { tolerance = Math.max(1, TBE.num(data.tolManual, 5)); tolNote = "set to " + tolerance; }
      else if (data.tolMode === "2d10") {
        const tr = await new Roll("2d10").evaluate();
        rolls.push(tr);
        const v = tr.total;
        tolerance = v <= 2 ? 2 : v <= 4 ? 3 : v <= 8 ? 4 : v <= 13 ? 5 : v <= 17 ? 6 : v === 18 || v === 19 ? 7 : 8;
        tolNote = "rolled 2d10 (kept hidden from the party)";
      }
      const t = {
        id: TBE.newTrackerId(), kind: "social-static", status: "active", name,
        tolerance, attemptsUsed: 0, total: 0, lastSkillName: null, lastSkillStreak: 0, lastFailed: false, log: []
      };
      await TBE.saveTracker(t);
      body = "<div><b>" + t.name + "</b> (Static) started, Tolerance " + tolNote + ".</div>";
    }
  } else {
    const t = all[data.tracker];
    if (!t || t.status !== "active") {
      ui.notifications?.warn("TBE: that tracker is no longer active.");
    } else if (t.kind === "social-static") {
      if (data.act === "end") {
        const result = outcomeStatic(t.total);
        body = "<div><b>" + t.name + "</b> ends voluntarily with " + t.total + " SLs: <b>" + result + "</b>.</div>";
        await TBE.deleteTracker(t.id);
      } else {
        const pick = TBE.readPick(data.pick);
        const skillName = pick ? pick.name : (data.skillName || "Untitled skill").trim();
        const skillValue = pick ? pick.value : TBE.num(data.skillValue, 50);
        const repeat = skillName === t.lastSkillName;
        const blocked = repeat && (t.lastSkillStreak >= 2 || t.lastFailed);
        let r, roll;
        if (blocked) {
          r = { success: false, crit: false, critFail: false, sl: 0, notes: [] };
          body = "<div><b>" + (data.who || "Someone") + "</b> tries " + skillName + " again, but " +
            (t.lastFailed ? "it just failed" : "it's been used twice running") +
            " &mdash; a different approach is needed. Automatic failure, still counts against Tolerance.</div>";
        } else {
          const attempt = await TBE.rollAttempt(skillValue, pick ? pick.expertise : 0);
          roll = attempt.roll; r = attempt.r; rolls.push(roll);
          body = "<div><b>" + (data.who || "Someone") + "</b> &middot; " + skillName + " (" + skillValue + "): " +
            TBE.face(roll.total) + " vs " + skillValue + " &rarr; <b>" + TBE.tag(r) + "</b>" +
            (r.success ? ", " + r.sl + " SL" : "") + "</div>";
        }
        t.attemptsUsed += 1;
        t.lastSkillStreak = repeat ? t.lastSkillStreak + 1 : 1;
        t.lastSkillName = skillName;
        t.lastFailed = !r.success;
        let addedSl = r.sl;
        t.total += addedSl;
        if (r.critFail) t.total = TBE.halveUp(t.total);
        if (t.attemptsUsed > t.tolerance) {
          const penalty = await new Roll("1d10").evaluate();
          rolls.push(penalty);
          const before = t.total;
          t.total = Math.max(0, t.total - penalty.total);
          const result = outcomeStatic(t.total);
          body += "<div>That's the audience's patience spent. Reduce the total by 1d10 (" + penalty.total + "): " +
            before + " &rarr; " + t.total + ". <b>" + result + "</b>.</div>";
          await TBE.deleteTracker(t.id);
        } else {
          await TBE.saveTracker(t);
        }
      }
    } else {
      /* competitive */
      if (data.act === "end") {
        const sorted = [...t.sides].sort((a, b) => b.total - a.total);
        const tie = sorted.length > 1 && sorted[0].total === sorted[1].total;
        if (tie) {
          body = "<div><b>" + t.name + "</b> ends tied at " + sorted[0].total + " between " +
            sorted.filter((s) => s.total === sorted[0].total).map((s) => s.name).join(" and ") + ". The GM decides who carries it.</div>";
        } else if (t.sides.length === 2) {
          const dos = sorted[0].total - sorted[1].total;
          body = "<div><b>" + t.name + "</b> is called: <b>" + sorted[0].name + "</b> leads " +
            sorted[0].total + " to " + sorted[1].total + " (DoS " + dos + "): <b>" + outcomeCompetitive(dos) + "</b>.</div>";
        } else {
          body = "<div><b>" + t.name + "</b> is called: <b>" + sorted[0].name + "</b> carries it with " + sorted[0].total +
            " support, ahead of " + sorted.slice(1).map((s) => s.name + " (" + s.total + ")").join(", ") + ".</div>";
        }
        await TBE.deleteTracker(t.id);
      } else {
        const sideIdx = Math.max(0, Math.min(t.sides.length - 1, TBE.num(data.side, 0)));
        const side = t.sides[sideIdx];
        const pick = TBE.readPick(data.pick);
        const skillName = pick ? pick.name : (data.skillName || "Untitled skill").trim();
        const skillValue = pick ? pick.value : TBE.num(data.skillValue, 50);
        const { roll, r } = await TBE.rollAttempt(skillValue, pick ? pick.expertise : 0);
        rolls.push(roll);
        body = "<div><b>" + (data.who || "Someone") + "</b> (" + side.name + ") &middot; " + skillName + " (" + skillValue + "): " +
          TBE.face(roll.total) + " vs " + skillValue + " &rarr; <b>" + TBE.tag(r) + "</b>" +
          (r.success ? ", " + r.sl + " SL" : "") + "</div>";
        if (r.critFail) {
          side.total = TBE.halveUp(side.total);
          body += "<div>Critical failure: " + side.name + "'s total is halved to " + side.total + ".</div>";
        } else if (r.success) {
          if (data.intent === "detract" && t.sides.length > 1) {
            const targetIdx = t.sides.length === 2 ? (sideIdx === 0 ? 1 : 0) : Math.max(0, Math.min(t.sides.length - 1, TBE.num(data.targetSide, 1)));
            const target = t.sides[targetIdx];
            target.total = Math.max(0, target.total - r.sl);
            body += "<div>" + r.sl + " SL subtracted from " + target.name + ", now " + target.total + ".</div>";
          } else {
            side.total += r.sl;
            body += "<div>" + side.name + "'s total rises to " + side.total + ".</div>";
          }
        }
        body += "<div style='font-size:12px'>" + t.sides.map((s) => s.name + " " + s.total).join(" &middot; ") + "</div>";
        const winner = t.sides.length === 2 ? t.sides.find((s) => s.total >= t.victoryCondition) : null;
        if (winner) {
          const loser = t.sides.find((s) => s !== winner);
          const dos = winner.total - loser.total;
          body += "<div style='font-weight:bold'>" + winner.name + " reaches the Victory Condition! DoS " + dos +
            ": <b>" + outcomeCompetitive(Math.max(0, dos)) + "</b>.</div>";
          await TBE.deleteTracker(t.id);
        } else {
          await TBE.saveTracker(t);
        }
      }
    }
  }

  await TBE.say(TBE.card("TBE Social Encounter", body), rolls);
}
