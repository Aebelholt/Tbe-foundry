/* TBE: Social Encounter (Ch.13, p.249-264) — Static (influencing an NPC who
 * isn't opposed by another party) and Competitive (two or more sides vying
 * for a third party's favor: a debate, a trial, a council vote). Both are
 * extended rolls built on Social skills, tracked persistently the same way
 * as TBE: Extended Roll.
 *
 * p.251: "The Tolerance is hidden from the players, so they will never
 * know for sure how many opportunities they have left." A Static tracker
 * now hides its Tolerance number from the status display by default (the
 * "Hide the Tolerance number" checkbox at tracker creation, checked by
 * default) -- untick it for this pack's older open-display behavior, e.g.
 * for solo play where the acting player is also the GM. Nothing here
 * whispers chat cards on its own either way: if you're running this for a
 * group and want full secrecy, keep this dialog and its chat cards to
 * yourself the way you'd keep a GM screen up.
 */

const outcomeStatic = (sl) => sl >= 16 ? "Success with extra benefits" : sl >= 11 ? "Success" :
  sl >= 6 ? "Success with a cost, complication, or compromise" : "Failure";
const outcomeCompetitive = (dos) => dos >= 10 ? "Success with one or more extra benefits" :
  dos >= 6 ? "Success but with nothing extra" : "Success with a cost, complication, or compromise";

const all = TBE.trackers();
const staticTrackers = Object.values(all).filter((t) => t.kind === "social-static" && t.status === "active");
const compTrackers = Object.values(all).filter((t) => t.kind === "social-competitive" && t.status === "active");
const active = [...staticTrackers, ...compTrackers];

/* One short line per past roll, most recent last -- the log[] field on both
 * tracker kinds used to be declared and never written to or read, so the
 * only record of any attempt was one chat card that scrolls past. Pushed to
 * on every roll below, and the last couple surfaced here so re-opening this
 * macro shows recent history instead of only the running totals. */
const logLine = (e) => e.who + ": " + e.skillName + " (" + e.skillValue + ") " + (e.success ? "+" + e.sl + " SL" : e.blocked ? "blocked" : "fail");
const recentLog = (t) => (t.log && t.log.length
  ? '<div style="font-size:10px;opacity:.7">recent: ' + t.log.slice(-2).map(logLine).join(" &middot; ") + "</div>" : "");

/* p.253: in a Competitive encounter "you cannot trigger another skill roll
 * until after your opponent has had a chance to respond... and vice versa."
 * The book gives no penalty for violating this (unlike the same-skill rule),
 * so this stays informational rather than a hard gate -- but turnIndex/round
 * used to be set once at creation and never touched again, a number that
 * looked live and wasn't. Repurposed as "whose turn is next" below, updated
 * after every competitive roll. */
const competitiveTurnNote = (t) => {
  const next = t.sides[t.turnIndex] || t.sides[0];
  return "round " + (t.round || 1) + (next ? ", next to speak: " + next.name : "") +
    " <span style='font-size:10px;opacity:.7'>(informational, p.253 &mdash; not enforced)</span>";
};

const statusBlock = active.length
  ? active.map((t) => t.kind === "social-static"
      ? "<div><b>" + t.name + "</b> (Static): " + t.total + " SLs" +
        (t.hideTolerance
          ? ", " + t.attemptsUsed + " attempt(s) made <span style='opacity:.75'>(Tolerance hidden &mdash; narrate the NPC's growing patience instead)</span>"
          : ", Tolerance " + t.tolerance + ", " + t.attemptsUsed + " attempt(s) made") +
        "</div>" + recentLog(t)
      : "<div><b>" + t.name + "</b> (Competitive, Victory " + t.victoryCondition + "): " +
        t.sides.map((s) => s.name + " " + s.total).join(" vs ") + " &middot; " + competitiveTurnNote(t) + "</div>" + recentLog(t)
    ).join("")
  : "<div style='opacity:.75'>No active Social Encounters.</div>";

const trackerOpts = active.map((t) => '<option value="' + t.id + '">' + t.name + " (" + (t.kind === "social-static" ? "Static" : "Competitive") + ")</option>").join("");

const me = TBE.me();
/* Used to build its own 2-field "value|name" picker instead of the shared
 * TBE.skillOptions(), which encodes Expertise and Savvy too -- TBE.readPick()
 * expects that 4-field shape, so a roll made through the old picker always
 * resolved at Expertise 0 no matter the actor's real tier, silently. Haggle
 * and Skill Roll already use the shared helper; this brings Social Encounter
 * in line with both. */
const skillPick = TBE.skillOptions("pick", "Social skill from sheet", "Social");

/* Renders a tracker's sides as a labeled dropdown instead of leaving the
 * player to type a bare index against a status block that only lists sides
 * by name. This helper already existed but was never wired into the form
 * below -- the live fields were plain <input type="number">. */
const compSideOpts = (t) => (t?.sides || []).map((s, i) => '<option value="' + i + '">' + i + ": " + s.name + " (" + s.total + ")</option>").join("");
const compSideSelects = compTrackers.length
  ? compTrackers.map((t) => '<optgroup label="' + t.name + '">' + compSideOpts(t) + "</optgroup>").join("")
  : "";

/* Same picker used for both fields, since the index is scoped to whichever
 * tracker the "Tracker" field above selects -- picking a side by name here
 * instead of typing a number against a status block that only lists sides
 * by name is the actual fix; which optgroup to read from is settled by the
 * Tracker field, already required before either of these matters. */
const sideField = compTrackers.length
  ? '<label style="display:block">Competitive &mdash; rolling for side: <select name="side" style="width:100%">' + compSideSelects + "</select></label>"
  : '<label style="display:block">Competitive &mdash; rolling for side #: <input type="number" name="side" value="0" style="width:100%"></label>';
const targetSideField = compTrackers.length
  ? '<label style="display:block">Competitive &mdash; if detracting and there are 3+ sides, target side: <select name="targetSide" style="width:100%">' + compSideSelects + "</select></label>"
  : '<label style="display:block">Competitive &mdash; if detracting and there are 3+ sides, target side #: <input type="number" name="targetSide" value="1" style="width:100%"></label>';

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
  '<label style="display:block;font-size:12px"><input type="checkbox" name="hideTolerance" checked> Hide the Tolerance number from this macro\'s status display (p.251: "the Tolerance is hidden from the players" &mdash; on by default now to match the book; untick for the prior open display)</label>' +
  '<label style="display:block">Competitive &mdash; Victory Condition: <input type="number" name="victory" value="15" style="width:100%"></label>' +
  '<label style="display:block">Competitive &mdash; sides, one per line ("Name" or "Name, starting SLs"):<br>' +
  '<textarea name="sides" rows="3" style="width:100%">Party\nOpposition</textarea></label>' +
  "<hr><b>Roll</b>" +
  '<label style="display:block">Participant: <input type="text" name="who" value="' + (me?.name ?? "") + '" style="width:100%"></label>' +
  skillPick +
  '<label style="display:block">Skill name (if not picked above): <input type="text" name="skillName" value="" style="width:100%"></label>' +
  '<label style="display:block">Skill value (if not picked above): <input type="number" name="skillValue" value="50" style="width:100%"></label>' +
  sideField +
  '<label style="display:block">Competitive &mdash; on success: <select name="intent" style="width:100%">' +
  '<option value="support">Add SLs to my own side</option><option value="detract">Subtract SLs from the other side</option></select></label>' +
  targetSideField +
  "</div>";

const data = await TBE.prompt("Social Encounter", content, "Go");
if (data) {
  const rolls = [];
  /* Anything the book says the players must not see. Posted as its own
     GM-whispered card AFTER the public one, so the public card reads the same
     as it always did and the secret never rides along in `rolls` (which
     TBE.say attaches to whatever card it is posting). */
  const gmOnly = [];
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
        turnIndex: 0, round: 1, log: [],
        // Same-skill/failed-retry gate (p.255) tracked at the tracker level,
        // matching the Static branch below and the audit's own reading of
        // the rule ("this target," not scoped to Static only) -- Competitive
        // never enforced it at all before this.
        lastSkillName: null, lastSkillStreak: 0, lastFailed: false
      };
      await TBE.saveTracker(t);
      body = "<div><b>" + t.name + "</b> (Competitive) started. Victory Condition " + t.victoryCondition + ". Sides: " +
        t.sides.map((s) => s.name + (s.total ? " (starts at " + s.total + ")" : "")).join(", ") + ".</div>";
    } else {
      let tolerance = 5;
      let tolNote = "standard 5";
      if (data.tolMode === "manual") { tolerance = Math.max(1, TBE.num(data.tolManual, 5)); tolNote = "set to " + tolerance; }
      else if (data.tolMode === "2d10") {
        /* p.251: "The Tolerance is hidden from the players, so they will never
         * know for sure how many opportunities they have left."
         *
         * Until v0.34.0 this was honoured by evaluating the 2d10 and then
         * showing it to NOBODY, including the GM, because TBE.say could only
         * post publicly and there was no third option. That kept the players
         * ignorant by destroying the information -- the GM could not check the
         * number either, and a rule the GM cannot verify is not implemented.
         *
         * Now the roll goes to the GM alone, which is what the book actually
         * describes. Whispered rather than blind: blind would hide it from the
         * GM too, and the GM is the one person who is supposed to know it. */
        const tr = await new Roll("2d10").evaluate();
        const v = tr.total;
        tolerance = v <= 2 ? 2 : v <= 4 ? 3 : v <= 8 ? 4 : v <= 13 ? 5 : v <= 17 ? 6 : v === 18 || v === 19 ? 7 : 8;
        tolNote = "rolled 2d10 (whispered to the GM, hidden from the party -- p.251)";
        gmOnly.push({ roll: tr, tolerance });
      }
      const t = {
        id: TBE.newTrackerId(), kind: "social-static", status: "active", name,
        tolerance, attemptsUsed: 0, total: 0, lastSkillName: null, lastSkillStreak: 0, lastFailed: false, log: [],
        hideTolerance: data.hideTolerance === "on" || data.hideTolerance === true
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
        t.log = t.log || [];
        t.log.push({ who: data.who || "Someone", skillName, skillValue, success: r.success, sl: r.success ? r.sl : 0, blocked: !!blocked });
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
        /* p.255 "Choice of Skill and Approach" sits after both the Static and
         * Competitive sections and reads as general to "this target," not
         * scoped to Static -- enforced here now the same way the Static
         * branch above already does, tracked at the tracker level (one
         * shared target/audience, not per side). */
        const repeat = skillName === t.lastSkillName;
        const blocked = repeat && (t.lastSkillStreak >= 2 || t.lastFailed);
        let roll, r;
        if (blocked) {
          r = { success: false, crit: false, critFail: false, sl: 0, notes: [] };
          body = "<div><b>" + (data.who || "Someone") + "</b> (" + side.name + ") tries " + skillName + " again, but " +
            (t.lastFailed ? "it just failed" : "it's been used twice running") +
            " &mdash; a different approach is needed. Counts as no SLs, and passes the turn back (p.255).</div>";
        } else {
          const attempt = await TBE.rollAttempt(skillValue, pick ? pick.expertise : 0);
          roll = attempt.roll; r = attempt.r; rolls.push(roll);
          body = "<div><b>" + (data.who || "Someone") + "</b> (" + side.name + ") &middot; " + skillName + " (" + skillValue + "): " +
            TBE.face(roll.total) + " vs " + skillValue + " &rarr; <b>" + TBE.tag(r) + "</b>" +
            (r.success ? ", " + r.sl + " SL" : "") + "</div>";
        }
        t.lastSkillStreak = repeat ? t.lastSkillStreak + 1 : 1;
        t.lastSkillName = skillName;
        t.lastFailed = !r.success;
        t.log = t.log || [];
        t.log.push({ who: data.who || "Someone", side: side.name, skillName, skillValue, success: r.success, sl: r.success ? r.sl : 0, blocked: !!blocked });
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
        /* Whose turn is next (p.253, informational -- see competitiveTurnNote
         * above). A full cycle back to side 0 advances the round counter,
         * which used to be frozen at 1 forever. */
        t.turnIndex = (sideIdx + 1) % t.sides.length;
        if (t.turnIndex === 0) t.round = (t.round || 1) + 1;
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

  /* The GM's copy of anything the party must not see (p.251). Separate card,
     posted second, forced to a GM whisper regardless of the roll-mode
     dropdown -- a rule in print outranks a dropdown, and a GM who left the
     dropdown on Public should still not broadcast the Tolerance. */
  for (const secret of gmOnly) {
    await TBE.say(
      TBE.card("TBE Social Encounter &mdash; GM only",
        "<div>Tolerance rolled <b>" + secret.roll.total + "</b> on 2d10 &rarr; Tolerance <b>" +
        secret.tolerance + "</b>.</div>" +
        '<div style="font-size:11px;opacity:.8">p.251: hidden from the players. This card is whispered to you.</div>'),
      [secret.roll],
      { mode: TBE.MODES.PRIVATE }
    );
  }
}
