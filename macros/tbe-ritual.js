/* TBE: Ritual (Ch.14 p.315-319) — the ritual procedure, and the Pact that
 * lets a non-caster buy a ritual's effect from a Patron.
 *
 * TBE: Cast already prices a ritual: Ritual-only Targets and Durations carry
 * their costs, the Ritual tick gates the Ritual-only Weave Reaction tiers, and
 * the Ritual Caster Talent adds its +10. What it never had was the procedure
 * those prices are for — hours of casting, concentration rolls, the four
 * ritual-only ways to buy Mastery, and a results table that is not the ordinary
 * casting one. So: price the spell in TBE: Cast, then run it here.
 *
 * A ritual takes hours or days, so it lives in the same persistent tracker
 * store as Extended Rolls, Social Encounters and Chases rather than in one
 * dialog's lifetime.
 *
 * Ownership: the Weave Reaction table lookup (TBE.reactionFor), Fatigue and
 * its overflow-to-wound rule (TBE.addFatigue), Fraying (TBE.addFraying), the
 * Bind/Strand readers and the Weave Scar arithmetic are all the shared _lib.js
 * versions. What is new here is only what the book states about rituals.
 */

const MAGIC = (typeof TBE_MAGIC !== "undefined" && TBE_MAGIC) || {};
const RIT = MAGIC.ritual || {};
const RESULTS = MAGIC.ritualResults || [];
const MARKS = MAGIC.bloodMarks || [];
const CIRC = MAGIC.magicCircle || {};
const PACTQ = MAGIC.pact || {};
const REACTIONS = MAGIC.weaveReactions || [];
const DETAIL = MAGIC.weaveReactionDetail || [];

const esc = (x) => String(x == null ? "" : x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const q = (o, k) => (o && o[k] && o[k].q) || "";
const resultRow = (key) => RESULTS.find((r) => r.key === key) || null;

const me = TBE.me();
const all = TBE.trackers();
const rituals = Object.values(all).filter((t) => t.kind === "ritual" && t.status === "active");
const pacts = Object.values(all).filter((t) => t.kind === "pact" && t.status === "active");

const statusBlock =
  (rituals.length
    ? rituals.map((t) => "<div><b>" + esc(t.name) + "</b> &middot; TC " + t.tc + ", " + t.hours + "h" +
        (t.rushed ? " (rushed)" : "") + " &middot; concentration " + t.checksDone + " / " + t.checkpoints +
        (t.concentrationPenalty ? " &middot; <b>+" + t.concentrationPenalty + "</b> to the Weave Reaction" : "") +
        " &middot; Mastery banked " + TBE.num(t.masteryBanked, 0) + "</div>").join("")
    : "<div style='opacity:.75'>No ritual in progress.</div>") +
  (pacts.length
    ? pacts.map((p) => "<div style='margin-top:2px'><b>Pact:</b> " + esc(p.price) + " &middot; Price total <b>" +
        p.total + "</b>, every " + esc(p.interval) + "</div>").join("")
    : "");

const ritualOpts = rituals.map((t) => '<option value="' + t.id + '">' + esc(t.name) + " (TC " + t.tc + ")</option>").join("");
const pactOpts = pacts.map((p) => '<option value="' + p.id + '">' + esc(p.price).slice(0, 48) + " (at " + p.total + ")</option>").join("");

const binds = TBE.binds(me);
const strands = TBE.strands(me);
const bindOpts = binds.map((b) => '<option value="' + b.id + '">' + esc(b.name) + " (" + b.effective +
  (b.scar ? ", scarred from " + b.value : "") + ")</option>").join("");
const strandOpts = strands.map((st) => '<option value="' + st.id + '">' + esc(st.name) + " (" + st.level + ")</option>").join("");
/* Grimoires are Threads flagged as such: ritual castings only, and they may
 * name up to three Binds or Strands in one book. */
const grimoires = (me?.items ?? []).filter((i) => i.type === "thread" && i.system?.grimoire && !i.system?.expended)
  .map((i) => ({ id: i.id, item: i, name: i.name, die: i.system?.die || "d8",
                 skills: String(i.system?.attunement || "").split(",").map((x) => x.trim()).filter(Boolean) }));
const grimoireOpts = grimoires.map((g) => '<option value="' + g.id + '">' + esc(g.name) + " (" + g.die + ": " +
  esc(g.skills.join(", ") || "unattuned") + ")</option>").join("");

const resolveNow = TBE.num(me?.system?.resolve?.value, 0);

const content =
  '<div style="font-size:13px">' + statusBlock + "<hr>" +
  '<label style="display:block">Mode: <select name="mode" style="width:100%">' +
  '<option value="ritual">Ritual (p.315)</option>' +
  '<option value="pact">Pact &mdash; a ritual for a non-caster (p.318)</option>' +
  "</select></label>" +

  "<hr><b>Ritual</b>" +
  '<label style="display:block">In progress: <select name="tracker" style="width:100%">' +
  '<option value="">-- Begin a new ritual --</option>' + ritualOpts + "</select></label>" +
  '<label style="display:block">Action (ignored when beginning a new one): <select name="act" style="width:100%">' +
  '<option value="concentrate">Work another 8 hours (Fatigue + concentration roll)</option>' +
  '<option value="grimoire">Consult a grimoire (roll its Thread Die)</option>' +
  '<option value="finish">Complete the ritual (make the Bind roll)</option>' +
  '<option value="abandon">Abandon this ritual</option>' +
  "</select></label>" +

  "<hr><b>Begin a ritual</b>" +
  '<label style="display:block">Name: <input type="text" name="name" value="Ritual" style="width:100%"></label>' +
  '<label style="display:block">Total Cost, from TBE: Cast (p.315 prices it exactly as a normal spell): ' +
  '<input type="number" name="tc" value="20" style="width:100%"></label>' +
  (bindOpts ? '<label style="display:block">Bind: <select name="bindId" style="width:100%">' + bindOpts + "</select></label>" : "") +
  (strandOpts ? '<label style="display:block">Strand: <select name="strandId" style="width:100%">' + strandOpts + "</select></label>" : "") +
  '<label style="display:block;font-size:12px"><input type="checkbox" name="rushed"> Rush it &mdash; half the hours, ' +
  "and <b>+10</b> to any Weave Reaction roll</label>" +
  '<label style="display:block">Components (1&ndash;8 Mastery, GM\'s discretion; otherwise they cost ' +
  (RIT.componentsSpPerTc?.n || 100) + ' sp &times; TC): <input type="number" name="components" value="0" style="width:100%"></label>' +
  '<label style="display:block">Assistants, one per line as "Name, Strand value" (each adds half their Strand, rounded up):<br>' +
  '<textarea name="assistants" rows="2" style="width:100%"></textarea></label>' +
  '<label style="display:block">Magic Circle &mdash; SLs on the circle\'s Arcana roll (0 = not in one): ' +
  '<input type="number" name="circleSls" value="0" style="width:100%"></label>' +
  '<div style="font-size:11px;opacity:.8">' + esc(q(CIRC, "slsPerReduction")) + ". " + esc(q(CIRC, "noFades")) + ".</div>" +
  '<label style="display:block;font-size:12px;margin-top:3px"><input type="checkbox" name="blood"> Use <b>Blood Magic</b> ' +
  "(forbidden, and it marks everyone involved)</label>" +
  '<label style="display:block">&mdash; lethal Wound Points inflicted on the victim (1 Mastery each, up to ' + TBE.BLOOD_MAX + "): " +
  '<input type="number" name="bloodWp" value="0" style="width:100%"></label>' +
  '<label style="display:block;font-size:12px"><input type="checkbox" name="bloodKill"> &mdash; the victim is killed just ' +
  "before completion (+20 to the casting roll, and the marking is certain)</label>" +

  "<hr><b>Consult a grimoire</b>" +
  (grimoireOpts
    ? '<label style="display:block">Grimoire: <select name="grimoireId" style="width:100%">' + grimoireOpts + "</select></label>" +
      '<div style="font-size:11px;opacity:.8">Rolled once per applicable Bind or Strand; a maximum roll still gives its Mastery, then consumes the book.</div>'
    : '<div style="font-size:11px;opacity:.75">No grimoires on this sheet. A grimoire is a Thread Item with its Grimoire flag set and up to three Binds or Strands in its attunement.</div>') +

  "<hr><b>Pact</b> <span style='font-size:11px;opacity:.8'>" + esc(q(PACTQ, "noRollQuote")) + ".</span>" +
  '<label style="display:block">Existing Pact: <select name="pact" style="width:100%">' +
  '<option value="">-- Strike a new Pact --</option>' + pactOpts + "</select></label>" +
  '<label style="display:block">Pact action: <select name="pactAct" style="width:100%">' +
  '<option value="tick">An interval passes &mdash; roll the Price\'s Timer Die</option>' +
  '<option value="paid">Mark this Price as settled</option>' +
  "</select></label>" +
  '<label style="display:block">The Price: <input type="text" name="price" value="" placeholder="what the Patron takes, and when" style="width:100%"></label>' +
  '<label style="display:block">Roll interval: <select name="interval" style="width:100%">' +
  ["one day", "one week", "one month", "one season", "one year"].map((x) =>
    '<option value="' + x + '"' + (x === "one month" ? " selected" : "") + ">" + x + "</option>").join("") +
  "</select></label>" +
  '<div style="font-size:11px;opacity:.8">' + esc(q(PACTQ, "payRule")) + "</div>" +
  "</div>";

const data = await TBE.prompt("TBE Ritual", content, "Go");
if (data) {
  const rolls = [];
  let body = "";

  if (data.mode === "pact") {
    body = await pactBranch(data, rolls);
  } else if (!data.tracker) {
    body = await beginRitual(data);
  } else {
    const t = all[data.tracker];
    if (!t || t.status !== "active") {
      ui.notifications?.warn("TBE: that ritual is no longer in progress.");
    } else if (data.act === "abandon") {
      await TBE.deleteTracker(t.id);
      body = "<div><b>" + esc(t.name) + "</b> is abandoned. " +
        (t.componentsSpent ? "Its components are gone." : "Its components can be put away for another attempt.") + "</div>";
    } else if (data.act === "concentrate") {
      body = await concentrate(t, rolls);
    } else if (data.act === "grimoire") {
      body = await consultGrimoire(t, data, rolls);
    } else {
      body = await completeRitual(t, rolls);
    }
  }

  if (body) await TBE.say(TBE.card("TBE Ritual", body), rolls);
}

/* ---------------------------------------------------------------- beginning */
async function beginRitual(d) {
  const tc = Math.max(1, TBE.num(d.tc, 20));
  const rushed = d.rushed === "on" || d.rushed === true;
  const circleSls = Math.max(0, TBE.num(d.circleSls, 0));
  const circleCut = TBE.circleReduction(circleSls);
  const effectiveTc = Math.max(0, tc - circleCut);
  const time = TBE.ritualTime(effectiveTc, rushed);

  const bind = binds.find((b) => b.id === d.bindId) || binds[0] || null;
  const strand = strands.find((s) => s.id === d.strandId) || strands[0] || null;

  /* "rituals still require each participant to have at least one available
   * Resolve" -- the one Resolve rule the ritual keeps, even though none of it
   * may be spent on the roll. */
  if (me && resolveNow < 1) {
    ui.notifications?.warn("TBE: a ritual needs at least 1 available Resolve to attempt.");
    return "<div style='color:#8b1a1a'><b>" + esc(me.name) + "</b> has no Resolve left. " +
      esc(q(RIT, "resolveFloor")) + ".</div>";
  }

  const assistants = String(d.assistants || "").split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
    const [nm, sv] = l.split(",");
    return { name: (nm || "Assistant").trim(), strand: Math.max(0, TBE.num(sv, 0)) };
  });
  const cap = TBE.assistCap(strand ? strand.level : 0);
  const kept = assistants.slice(0, cap);
  const turnedAway = assistants.length - kept.length;
  const assistMastery = kept.reduce((n, a) => n + TBE.assistMastery(a.strand), 0);

  const blood = d.blood === "on" || d.blood === true;
  const bloodWp = blood ? Math.max(0, TBE.num(d.bloodWp, 0)) : 0;
  const bloodKill = blood && (d.bloodKill === "on" || d.bloodKill === true);

  const t = {
    id: TBE.newTrackerId(), kind: "ritual", status: "active",
    name: (d.name || "Ritual").trim(),
    tc: effectiveTc, tcBefore: tc, circleSls, circleCut,
    rushed, hours: time.hours, checkpoints: time.checkpoints, rushBonus: time.rushBonus,
    checksDone: 0, concentrationPenalty: 0,
    bindId: bind?.id || "", bindName: bind?.name || "", bindValue: bind ? bind.effective : 0,
    bindExpertise: bind?.expertise || 0,
    strandName: strand?.name || "", strandLevel: strand ? strand.level : 0,
    components: Math.max(0, Math.min(8, TBE.num(d.components, 0))),
    assistants: kept, assistMastery,
    blood, bloodWp, bloodKill,
    grimoireMastery: 0, grimoireNotes: [], grimoiresUsed: [],
    masteryBanked: 0, componentsSpent: false, log: []
  };
  t.masteryBanked = t.components + t.assistMastery;
  await TBE.saveTracker(t);

  return "<div><b>" + esc(t.name) + "</b> begins.</div>" +
    "<div>TC <b>" + t.tc + "</b>" +
    (circleCut ? " <span style='font-size:11px;opacity:.8'>(" + tc + " &minus; " + circleCut +
      " from the magic circle's " + circleSls + " SLs &mdash; “" + esc(q(CIRC, "slsPerReduction")) + "”)</span>" : "") +
    " &middot; <b>" + t.hours + " hours</b>" + (rushed ? " (rushed: +10 to any Weave Reaction)" : "") +
    " &middot; " + t.checkpoints + " concentration roll" + (t.checkpoints === 1 ? "" : "s") + " to get through.</div>" +
    "<div>" + esc(t.bindName || "no Bind") + " " + t.bindValue + " &middot; " + esc(t.strandName || "no Strand") +
    " " + t.strandLevel + "</div>" +
    "<div>Mastery banked so far: <b>" + t.masteryBanked + "</b> = components " + t.components +
    " + assistance " + t.assistMastery +
    (t.assistants.length ? " (" + t.assistants.map((a) => esc(a.name) + " " + a.strand).join(", ") + ")" : "") + "</div>" +
    (turnedAway ? "<div style='color:#8b1a1a'>" + turnedAway + " assistant(s) turned away: " +
      esc(q(RIT, "assistCap")) + " &mdash; at most " + cap + " here.</div>" : "") +
    (t.blood ? "<div style='color:#8b1a1a'><b>Blood Magic.</b> " + TBE.bloodMastery(t.bloodWp) +
      " Mastery from " + t.bloodWp + " Wound Point(s)" + (t.bloodKill ? ", and +20 to the casting roll for the killing" : "") +
      ". The marking is rolled when the ritual completes.</div>" : "") +
    "<div style='font-size:11px;opacity:.8;margin-top:3px'>&ldquo;" + esc(q(RIT, "tetherRange")) + ".&rdquo; &ldquo;" +
    esc(q(RIT, "noResolve")) + ", either to increase the Bind skill, or to mitigate the Weave after the roll.&rdquo;</div>";
}

/* ------------------------------------------------------------ concentration */
async function concentrate(t, rolls) {
  if (t.checksDone >= t.checkpoints) {
    return "<div><b>" + esc(t.name) + "</b> has already had its " + t.checkpoints +
      " concentration roll(s). Complete the ritual.</div>";
  }
  const wp = (me?.items ?? []).find((i) => i.type === "skill" && /^willpower$/i.test(i.name || ""));
  const wpValue = TBE.num(wp?.system?.value, 0);
  const { roll, r } = await TBE.rollAttempt(wpValue, TBE.num(wp?.system?.expertise, 0));
  rolls.push(roll);
  t.checksDone += 1;

  /* "The principal caster and all assistants take 1 Fatigue for every eight
   * hours (or portion thereof) of casting time." */
  const fat = me ? await TBE.addFatigue(me, 1, "Weary") : null;

  let out = "<div><b>" + esc(t.name) + "</b> &middot; hours " + Math.min(t.hours, t.checksDone * 8) + " of " + t.hours + "</div>" +
    "<div>Willpower (" + wpValue + "): " + TBE.face(roll.total) + " &rarr; <b>" + TBE.tag(r) + "</b></div>" +
    (fat ? "<div>" + esc(me.name) + " takes 1 Fatigue" + (fat.overflow ? " &mdash; it would not fit: a Weave wound instead" : "") + ".</div>" : "") +
    (t.assistants.length ? "<div style='font-size:11px;opacity:.85'>Each assistant takes 1 Fatigue too: " +
      t.assistants.map((a) => esc(a.name)).join(", ") + ".</div>" : "");

  if (r.critFail) {
    await TBE.deleteTracker(t.id);
    return out + "<div style='font-weight:bold;color:#8b1a1a'>" + esc(q(RIT, "concentrationCritFail")) + "</div>";
  }
  if (!r.success) {
    t.concentrationPenalty += 3;
    out += "<div style='color:#8b1a1a'>Concentration slips: <b>+3</b> to the Weave Reaction roll at completion " +
      "(now +" + t.concentrationPenalty + "). It stacks with each failed roll.</div>";
  } else {
    out += "<div style='color:#1f7a1f'>The ritual continues normally.</div>";
  }
  t.log.push("Concentration " + t.checksDone + "/" + t.checkpoints + ": " + TBE.tag(r));
  await TBE.saveTracker(t);
  return out + "<div style='font-size:11px;opacity:.8'>" + t.checksDone + " of " + t.checkpoints +
    " concentration rolls done.</div>";
}

/* ----------------------------------------------------------------- grimoires */
async function consultGrimoire(t, d, rolls) {
  const g = grimoires.find((x) => x.id === d.grimoireId);
  if (!g) return "<div>No grimoire selected, or it is already used up.</div>";
  if (t.grimoiresUsed.indexOf(g.id) > -1) {
    return "<div><b>" + esc(g.name) + "</b> has already been consulted for this ritual &mdash; a grimoire " +
      "“may be used only once per ritual”.</div>";
  }
  /* "may be used only for rituals using the Binds or Strands the book is
   * associated with", and a book covering more than one applicable skill
   * "may provide separate Thread Die rolls for each". */
  const inPlay = [t.bindName, t.strandName].filter(Boolean).map((x) => x.toLowerCase());
  const applicable = g.skills.filter((s) => inPlay.indexOf(s.toLowerCase()) > -1);
  if (!applicable.length) {
    return "<div><b>" + esc(g.name) + "</b> deals in " + esc(g.skills.join(", ")) +
      ", none of which this ritual uses. It cannot help here.</div>";
  }
  const faces = TBE.num(String(g.die).replace(/^d/, ""), 8);
  let gained = 0, consumed = false;
  const lines = [];
  for (const skill of applicable) {
    const r = await new Roll("1" + g.die).evaluate();
    rolls.push(r);
    gained += r.total;
    if (r.total >= faces) consumed = true;
    lines.push(esc(skill) + ": " + g.die + " &rarr; <b>" + r.total + "</b>" + (r.total >= faces ? " (maximum)" : ""));
  }
  t.grimoireMastery += gained;
  t.masteryBanked += gained;
  t.grimoiresUsed.push(g.id);
  t.grimoireNotes.push(g.name + ": " + gained + " Mastery");
  if (consumed) {
    try { await g.item.update({ "system.expended": true }); }
    catch (e) { console.warn("TBE | could not expend grimoire", e); }
  }
  await TBE.saveTracker(t);
  return "<div><b>" + esc(g.name) + "</b> is consulted.</div><div>" + lines.join("<br>") + "</div>" +
    "<div>+" + gained + " Mastery (banked: <b>" + t.masteryBanked + "</b>).</div>" +
    (consumed ? "<div style='color:#8b1a1a'>It rolled its maximum: the Mastery stands, and the book is consumed by the ritual.</div>" : "");
}

/* ---------------------------------------------------------------- completion */
async function completeRitual(t, rolls) {
  if (t.checksDone < t.checkpoints) {
    return "<div><b>" + esc(t.name) + "</b> still needs " + (t.checkpoints - t.checksDone) +
      " more concentration roll(s) &mdash; " + t.hours + " hours of casting, checked every eight.</div>";
  }
  /* "The caster cannot spend Resolve on the Ritual casting roll, either to
   * increase the Bind skill, or to mitigate the Weave after the roll." So no
   * Favor is offered anywhere in this macro, and no mitigation is offered
   * below either. The only Resolve rule left is the floor. */
  const bloodBonus = t.blood && t.bloodKill ? 20 : 0;
  const against = t.bindValue + bloodBonus;
  const { roll, r } = await TBE.rollAttempt(against, t.bindExpertise);
  rolls.push(roll);
  const ones = (roll.total % 10) === 0 ? 10 : roll.total % 10;

  const bloodMastery = t.blood ? TBE.bloodMastery(t.bloodWp) : 0;
  const mastery = (r.success ? ones : 0) + t.strandLevel + t.masteryBanked + bloodMastery;

  let body = "<div><b>" + esc(t.name) + "</b> completes after " + t.hours + " hours.</div>" +
    "<div>" + esc(t.bindName || "Bind") + " (" + against + (bloodBonus ? ", +20 for the killing" : "") + "): " +
    TBE.face(roll.total) + " &rarr; <b>" + TBE.tag(r) + "</b>" + (r.success ? ", " + r.sl + " SL" : "") + "</div>";

  const key = r.critFail ? "critFail" : !r.success ? "failure" : r.crit ? "crit" : (mastery >= t.tc ? "success" : "uncontrolled");
  const row = resultRow(key);
  body += "<div style='margin-top:3px'><b>" + esc(row ? row.name : key) + "</b></div>";

  if (r.success) {
    body += "<div>Mastery <b>" + mastery + "</b> = ones die " + ones + " + Strand " + t.strandLevel +
      " + components " + t.components + " + assistance " + t.assistMastery +
      (t.grimoireMastery ? " + grimoires " + t.grimoireMastery : "") +
      (bloodMastery ? " + blood " + bloodMastery : "") +
      " &middot; against TC <b>" + t.tc + "</b>.</div>" +
      "<div style='font-size:11px;opacity:.85'>The Bind roll's " + r.sl + " SL sets the ritual spell's resistance: " +
      esc(q(RIT, "resistQuote")) + ".</div>";
  }

  /* Fatigue and Fraying land on everyone: "inflicted on both the caster and
   * all assistants". Only the caster is an actor this macro holds, so theirs
   * is applied and the rest are named. */
  const fatigue = TBE.num(row?.fatigue, 0);
  if (fatigue && me) {
    const f = await TBE.addFatigue(me, fatigue, "Weary");
    body += "<div>" + esc(me.name) + " takes " + fatigue + " Fatigue" +
      (f.overflow ? " &mdash; " + f.overflow + " would not fit and became a Weave wound" : "") + ".</div>";
  }
  if (fatigue && t.assistants.length) {
    body += "<div style='font-size:11px;opacity:.85'>Every assistant takes " + fatigue + " Fatigue as well: " +
      t.assistants.map((a) => esc(a.name)).join(", ") + ".</div>";
  }
  const fraying = TBE.num(row?.fraying, 0);
  if (fraying && me) {
    const fr = await TBE.addFraying(me, fraying, "critically failed ritual");
    body += "<div style='color:#8b1a1a'>" + fraying + " Fraying" + (fr?.html ? " " + fr.html : "") + "</div>" +
      (t.assistants.length ? "<div style='font-size:11px;opacity:.85'>" + esc(q(RIT, "frayingSharedQuote")) + "</div>" : "");
  }

  /* The Weave Reaction, at whichever modifier this outcome calls for. */
  const mode = row?.weaveReaction || "never";
  if (mode === "always" || mode === "atTc") {
    const short = Math.max(0, t.tc - mastery);
    const modifier = mode === "atTc"
      ? t.tc + t.concentrationPenalty + t.rushBonus
      : short + t.concentrationPenalty + 5 + t.rushBonus;
    const wr = await new Roll("1d20").evaluate();
    rolls.push(wr);
    const total = wr.total + modifier;
    const hit = TBE.reactionFor(REACTIONS, total, { vulgar: false, ritual: true });
    const detail = DETAIL.find((x) => x.name === hit?.name);
    body += "<div style='margin-top:3px;color:#8b1a1a'><b>Weave Reaction</b>: 1d20 " + wr.total + " + " + modifier +
      " = <b>" + total + "</b> &rarr; <b>" + esc(hit?.name || "?") + "</b></div>" +
      "<div style='font-size:11px;opacity:.85'>modifier = " +
      (mode === "atTc" ? "the ritual's TC " + t.tc : "TC &minus; Mastery " + short + " + 5 for the ritual itself") +
      (t.concentrationPenalty ? " + " + t.concentrationPenalty + " from failed concentration" : "") +
      (t.rushBonus ? " + " + t.rushBonus + " for rushing" : "") + ". Beneficial results are ignored, and every " +
      "participant is affected.</div>" +
      (detail ? "<div style='font-size:11px'>" + esc(detail.text) + "</div>" : "");
  } else if (mode === "never" || (mode === "ifMasteryShort" && mastery >= t.tc)) {
    body += "<div style='color:#1f7a1f'>No Weave Reaction.</div>";
  }

  /* Blood Magic's mark, rolled once the ritual is done either way. */
  if (t.blood && t.bloodWp) {
    const chance = TBE.bloodMarkChance(t.bloodWp, t.bloodKill);
    const check = await new Roll("1d100").evaluate();
    rolls.push(check);
    const marked = check.total <= chance;
    body += "<div style='margin-top:3px'><b>Blood Magic.</b> Marking chance " + chance + "%" +
      (t.bloodKill ? " (certain, the victim was killed)" : " (5% per Wound Point)") + ": " + TBE.face(check.total) +
      " &rarr; " + (marked ? "<b>marked</b>" : "unmarked, this time") + ".</div>";
    if (marked) {
      const md = await new Roll("1d10").evaluate();
      rolls.push(md);
      const mark = MARKS.find((m) => m.roll === md.total);
      body += "<div style='color:#8b1a1a'>d10 " + md.total + ": " + esc(mark?.text || "?") +
        " &mdash; on the caster and every assistant, in an appropriate hit location.</div>" +
        "<div style='font-size:11px;opacity:.8'>Blood Magic is outlawed in civilized lands, and those known to use it are hunted as witches.</div>";
    }
  }

  if (row?.componentsLost) {
    body += "<div style='font-size:11px;opacity:.85'>All components are used up.</div>";
  } else if (key === "failure") {
    body += "<div style='font-size:11px;opacity:.85'>Components can be reused.</div>";
  }

  await TBE.deleteTracker(t.id);
  return body;
}

/* --------------------------------------------------------------------- pacts */
async function pactBranch(d, rolls) {
  if (!d.pact) {
    const price = String(d.price || "").trim();
    if (!price) return "<div>Describe the Price the Patron takes before striking the Pact.</div>";
    const p = {
      id: TBE.newTrackerId(), kind: "pact", status: "active",
      price, interval: String(d.interval || "one month"),
      total: 1, ticks: 0, log: []
    };
    await TBE.saveTracker(p);
    return "<div><b>The Pact is struck.</b></div><div>Price: " + esc(price) + "</div>" +
      "<div>" + esc(q(PACTQ, "startsAtOne")) + " Interval: every " + esc(p.interval) + ".</div>" +
      "<div style='font-size:11px;opacity:.8'>" + esc(q(PACTQ, "noRollQuote")) + " &mdash; the ritual's effect simply happens.</div>";
  }
  const p = all[d.pact];
  if (!p || p.status !== "active") {
    ui.notifications?.warn("TBE: that Pact is no longer outstanding.");
    return "";
  }
  if (d.pactAct === "paid") {
    await TBE.deleteTracker(p.id);
    return "<div>The Price is settled: " + esc(p.price) + "</div>";
  }
  const roll = await new Roll("1d10").evaluate();
  rolls.push(roll);
  p.ticks += 1;
  const paid = roll.total <= p.total;
  let out = "<div><b>Pact</b> &middot; " + esc(p.price) + "</div>" +
    "<div>" + esc(p.interval) + " passes (" + p.ticks + " so far). Timer Die d10: <b>" + roll.total +
    "</b> vs a Price total of <b>" + p.total + "</b>.</div>";
  if (paid) {
    await TBE.deleteTracker(p.id);
    out += "<div style='font-weight:bold;color:#8b1a1a'>The Price is paid, now.</div>";
  } else {
    p.total += 1;
    p.log.push("interval " + p.ticks + ": rolled " + roll.total + ", Price rises to " + p.total);
    await TBE.saveTracker(p);
    out += "<div>Not yet. The Price total rises to <b>" + p.total + "</b>.</div>";
  }
  return out;
}
