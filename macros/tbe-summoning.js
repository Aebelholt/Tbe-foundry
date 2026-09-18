/* TBE: Summoning (Ch.14 p.319-321) — drawing the circle, the summoning
 * contest, testing the cage, and everything that happens to a bound creature
 * afterwards.
 *
 * The summoning *spell* is an ordinary casting and belongs in TBE: Cast: the
 * book fixes its shape ("a Duration of Instant, a Range of Arcane Tether, a
 * Target of Individual, and a Summoning Effect (6 TC)") and its Magnitude
 * ("always Vulgar (+10 TC)"), and Cast already prices all of that. What has
 * no home anywhere is what this macro owns: the circle, the two opposed rolls
 * that decide whether the thing comes and whether it stays, and the days of
 * containment that follow — which outlive any one dialog, so a circle is a
 * persistent tracker like a ritual or a chase.
 *
 * Ownership: the opposed-roll cascade is TBE.opposedResolve() (_lib.js), the
 * same one TBE: Opposed Roll and TBE: Chase decide their contests with; the
 * True Name penalty is TBE.TRUE_NAME_SUMMON_PENALTY, shared with TBE: Cast.
 */

const MAGIC = (typeof TBE_MAGIC !== "undefined" && TBE_MAGIC) || {};
const SUM = MAGIC.summoning || {};
const TN = MAGIC.trueNames || {};
const esc = (x) => String(x == null ? "" : x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const q = (o, k) => (o && o[k] && o[k].q) || "";

const me = TBE.me();
const all = TBE.trackers();
const circles = Object.values(all).filter((t) => t.kind === "circle" && t.status === "active");

/* The caster's Arcana decides both the cage roll and how long it holds, so it
 * is read off the sheet rather than typed wherever it exists. */
const arcanaItem = (me?.items ?? []).find((i) => i.type === "skill" && /^arcana$/i.test(i.name || ""));
const arcanaValue = TBE.num(arcanaItem?.system?.value, 0);
const binds = TBE.binds(me);
const bindOpts = binds.map((b) => '<option value="' + b.id + '">' + esc(b.name) + " (" + b.effective + ")</option>").join("");

const MATERIALS = (SUM.materials || []).map((m) => ({ sp: m.sp, bonus: m.bonus }));

const statusBlock = circles.length
  ? circles.map((c) => "<div><b>" + esc(c.creature) + "</b> in " + esc(c.name) + " &middot; " +
      (c.bound
        ? "bound, <b>" + c.daysLeft + "</b> day(s) of containment left"
        : "<b style='color:#8b1a1a'>loose</b>") +
      (c.trueNameUsed ? " &middot; held by its True Name" : "") +
      (c.controlled ? " &middot; under control" : "") + "</div>").join("")
  : "<div style='opacity:.75'>No summoning circle standing.</div>";

const circleOpts = circles.map((c) => '<option value="' + c.id + '">' + esc(c.creature) + " (" + esc(c.name) + ")</option>").join("");

const content =
  '<div style="font-size:13px">' + statusBlock + "<hr>" +
  '<label style="display:block">Circle: <select name="circle" style="width:100%">' +
  '<option value="">-- Draw a new circle and summon --</option>' + circleOpts + "</select></label>" +
  '<label style="display:block">Action (ignored when summoning anew): <select name="act" style="width:100%">' +
  '<option value="days">Time passes &mdash; the circle decays</option>' +
  '<option value="renew">Renew the circle (1 hour and a new Arcana roll)</option>' +
  '<option value="control">Record control gained over the creature</option>' +
  '<option value="banish">Banish it back where it came from</option>' +
  '<option value="release">Let it out of the circle</option>' +
  '<option value="abandon">Clear this circle from the tracker</option>' +
  "</select></label>" +
  '<label style="display:block">Days that pass: <input type="number" name="days" value="1" style="width:100%"></label>' +

  "<hr><b>Draw a circle and summon</b>" +
  '<div style="font-size:11px;opacity:.85">' + esc(q(SUM, "magnitude")) + " " + esc(q(SUM, "spellShape")) +
  " Price and roll that spell in <b>TBE: Cast</b>; this window runs the circle and the two contests.</div>" +
  '<label style="display:block">Where: <input type="text" name="name" value="the chalked circle" style="width:100%"></label>' +
  '<label style="display:block">What is being summoned: <input type="text" name="creature" value="Void demon" style="width:100%"></label>' +
  '<label style="display:block">Its Willpower: <input type="number" name="willpower" value="55" style="width:100%"></label>' +
  '<label style="display:block">Circle materials: <select name="materialSp" style="width:100%">' +
  MATERIALS.map((m) => '<option value="' + m.sp + '"' + (m.sp === 1000 ? " selected" : "") + ">" +
    m.sp.toLocaleString() + " sp" + (m.bonus ? " (+" + m.bonus + " to the Arcana roll)" : "") + "</option>").join("") +
  "</select></label>" +
  '<label style="display:block;font-size:12px"><input type="checkbox" name="trueName"> Its <b>True Name</b> is known and ' +
  "spoken, or inscribed in the circle (&minus;20 to its Willpower, both now and on any attempt to break free)</label>" +
  '<div style="font-size:11px;opacity:.8">' + esc(q(TN, "summonPenalty")) +
  ". True Names <b>must</b> be used when summoning powerful extra-dimensional beings.</div>" +
  (bindOpts
    ? '<label style="display:block">Bind for the summoning roll: <select name="bindId" style="width:100%">' + bindOpts + "</select></label>"
    : '<label style="display:block">Bind value: <input type="number" name="bindValue" value="55" style="width:100%"></label>') +
  '<label style="display:block">Arcana (from the sheet: <b>' + arcanaValue + "</b>): " +
  '<input type="number" name="arcana" value="' + arcanaValue + '" style="width:100%"></label>' +
  '<div style="font-size:11px;opacity:.8">' + esc(q(SUM, "nativesQuote")) + " &mdash; those use the <b>Spirit</b> Strand instead.</div>" +
  "</div>";

const data = await TBE.prompt("TBE Summoning", content, "Go");
if (data) {
  const rolls = [];
  let body = "";

  if (!data.circle) {
    body = await summon(data, rolls);
  } else {
    const c = all[data.circle];
    if (!c || c.status !== "active") {
      ui.notifications?.warn("TBE: that circle is no longer standing.");
    } else if (data.act === "abandon") {
      await TBE.deleteTracker(c.id);
      body = "<div>" + esc(c.name) + " is cleared from the tracker.</div>";
    } else if (data.act === "banish") {
      await TBE.deleteTracker(c.id);
      body = "<div><b>" + esc(c.creature) + "</b> is banished back from whence it came." +
        (c.bound ? "" : " <span style='font-size:11px;opacity:.8'>It was already loose, so this took something other than the circle.</span>") + "</div>";
    } else if (data.act === "release") {
      c.bound = false;
      await TBE.saveTracker(c);
      body = "<div><b>" + esc(c.creature) + "</b> is allowed out of the circle. " +
        "<span style='font-size:11px;opacity:.8'>It stays in the world of the Broken Empires until it is destroyed, " +
        "banished by another force, or finds its own way home.</span></div>" +
        (c.controlled ? "" : "<div style='color:#8b1a1a'>" + esc(q(SUM, "uncontrolledQuote")) + "</div>");
    } else if (data.act === "control") {
      c.controlled = true;
      await TBE.saveTracker(c);
      body = "<div><b>" + esc(c.creature) + "</b> is under control. Control from a spell ends when its Duration expires; " +
        "if it returns to the circle while still controlled, it is re-imprisoned, provided the circle is intact.</div>";
    } else if (data.act === "renew") {
      body = await renew(c, data, rolls);
    } else {
      body = await passDays(c, data);
    }
  }

  if (body) await TBE.say(TBE.card("TBE Summoning", body), rolls);
}

/* --------------------------------------------------------------- summoning */
async function summon(d, rolls) {
  const creature = (d.creature || "the summoned thing").trim();
  const willpower = TBE.num(d.willpower, 50);
  const trueName = d.trueName === "on" || d.trueName === true;
  const materialSp = TBE.num(d.materialSp, 1000);
  const materialBonus = (MATERIALS.find((m) => m.sp === materialSp) || { bonus: 0 }).bonus;
  const arcana = TBE.num(d.arcana, arcanaValue);
  const bind = binds.find((b) => b.id === d.bindId) || binds[0] || null;
  const bindValue = bind ? bind.effective : TBE.num(d.bindValue, 55);
  const penalty = trueName ? TBE.TRUE_NAME_SUMMON_PENALTY : 0;

  let body = "<div>A circle is drawn: an hour's work and " + materialSp.toLocaleString() + " sp of materials" +
    (materialBonus ? ", worth <b>+" + materialBonus + "</b> on the Arcana roll" : "") + ".</div>" +
    "<div style='font-size:11px;opacity:.8'>A circle can only be used for one successful casting.</div>";

  /* Contest 1: does it come? "The being to be summoned gets an opposed
   * Willpower roll." Resolved with the shared cascade, not a second copy. */
  const cRoll = await TBE.rollAttempt(bindValue, bind?.expertise || 0);
  const wRoll = await TBE.rollAttempt(willpower + penalty, 0);
  rolls.push(cRoll.roll, wRoll.roll);
  const A = { name: (me?.name || "The caster"), kind: "roll", res: cRoll.r, sl: cRoll.r.success ? cRoll.r.sl : 0,
              ok: cRoll.r.success, skill: bindValue };
  const B = { name: creature, kind: "roll", res: wRoll.r, sl: wRoll.r.success ? wRoll.r.sl : 0,
              ok: wRoll.r.success, skill: willpower + penalty };
  const first = TBE.opposedResolve(A, B);
  body += "<div style='margin-top:3px'><b>The summoning</b></div>" +
    "<div>" + esc(A.name) + ", " + esc(bind?.name || "Bind") + " (" + bindValue + "): " + TBE.face(cRoll.roll.total) +
    " &rarr; " + TBE.tag(cRoll.r) + (cRoll.r.success ? ", " + cRoll.r.sl + " SL" : "") + "</div>" +
    "<div>" + esc(creature) + ", Willpower (" + (willpower + penalty) + (penalty ? ", True Name" : "") + "): " +
    TBE.face(wRoll.roll.total) + " &rarr; " + TBE.tag(wRoll.r) + (wRoll.r.success ? ", " + wRoll.r.sl + " SL" : "") + "</div>";

  if (first.winner !== A) {
    body += "<div style='font-weight:bold'>It resists. Nothing comes through, and the circle's materials are spent.</div>" +
      "<div style='font-size:11px;opacity:.8'>" + esc(first.why) + "</div>";
    return body;
  }
  body += "<div style='color:#1f7a1f'><b>" + esc(creature) + " appears within the circle.</b> " +
    "<span style='font-size:11px;opacity:.8'>(" + esc(first.why) + ")</span></div>";

  /* Contest 2: does the cage hold? "the quality of the cage is tested. The
   * caster makes an Arcana roll", opposed by a NEW Willpower roll. */
  const cage = await cageTest(creature, arcana + materialBonus, willpower + penalty, rolls, trueName);
  body += cage.html;

  const t = {
    id: TBE.newTrackerId(), kind: "circle", status: "active",
    name: (d.name || "the circle").trim(), creature,
    arcana, materialSp, materialBonus, trueNameUsed: trueName,
    willpower, bound: cage.held, daysLeft: cage.held ? arcana : 0,
    controlled: false, renewals: 0, log: []
  };
  await TBE.saveTracker(t);
  if (!cage.held) {
    body += "<div style='color:#8b1a1a'>" + esc(q(SUM, "uncontrolledQuote")) + "</div>";
  }
  return body;
}

/* "If the caster wins, the creature is bound within the circle for a number of
 * days equal to the caster's Arcana Score." The same test is used again on a
 * renewal, so it lives in one function. */
async function cageTest(creature, arcanaAgainst, willpowerAgainst, rolls, trueName) {
  const aRoll = await TBE.rollAttempt(arcanaAgainst, 0);
  const wRoll = await TBE.rollAttempt(willpowerAgainst, 0);
  rolls.push(aRoll.roll, wRoll.roll);
  const A = { name: "the circle", kind: "roll", res: aRoll.r, sl: aRoll.r.success ? aRoll.r.sl : 0,
              ok: aRoll.r.success, skill: arcanaAgainst };
  const B = { name: creature, kind: "roll", res: wRoll.r, sl: wRoll.r.success ? wRoll.r.sl : 0,
              ok: wRoll.r.success, skill: willpowerAgainst };
  const out = TBE.opposedResolve(A, B);
  const held = out.winner === A;
  return {
    held,
    html: "<div style='margin-top:3px'><b>The cage</b></div>" +
      "<div>Arcana (" + arcanaAgainst + "): " + TBE.face(aRoll.roll.total) + " &rarr; " + TBE.tag(aRoll.r) +
      (aRoll.r.success ? ", " + aRoll.r.sl + " SL" : "") + "</div>" +
      "<div>" + esc(creature) + ", Willpower (" + willpowerAgainst + (trueName ? ", True Name" : "") + "): " +
      TBE.face(wRoll.roll.total) + " &rarr; " +
      TBE.tag(wRoll.r) + (wRoll.r.success ? ", " + wRoll.r.sl + " SL" : "") + "</div>" +
      (held
        ? "<div style='color:#1f7a1f'><b>The circle holds.</b> <span style='font-size:11px;opacity:.8'>(" + esc(out.why) + ")</span></div>"
        : "<div style='font-weight:bold;color:#8b1a1a'>It breaks free and may act as it wishes. <span style='font-size:11px;opacity:.8'>(" +
          esc(out.why) + ")</span></div>")
  };
}

/* ------------------------------------------------------------------ decay */
async function passDays(c, d) {
  const days = Math.max(1, TBE.num(d.days, 1));
  if (!c.bound) {
    return "<div><b>" + esc(c.creature) + "</b> is already loose; the circle has nothing left to hold.</div>";
  }
  c.daysLeft = Math.max(0, c.daysLeft - days);
  let out = "<div>" + days + " day(s) pass. " + esc(c.name) + ": <b>" + c.daysLeft + "</b> day(s) of containment left.</div>";
  if (c.daysLeft <= 0) {
    c.bound = false;
    out += "<div style='font-weight:bold;color:#8b1a1a'>The circle's integrity fails and the containment with it &mdash; " +
      esc(c.creature) + " is immediately freed.</div>" +
      (c.controlled ? "" : "<div style='font-size:11px;opacity:.85'>" + esc(q(SUM, "uncontrolledQuote")) + "</div>");
  } else {
    out += "<div style='font-size:11px;opacity:.8'>Renew it before it expires, or the containment fails on its own.</div>";
  }
  c.log.push(days + " day(s) passed, " + c.daysLeft + " left");
  await TBE.saveTracker(c);
  return out;
}

/* ----------------------------------------------------------------- renewal */
async function renew(c, d, rolls) {
  if (!c.bound) {
    return "<div><b>" + esc(c.creature) + "</b> is already out. There is nothing left to renew.</div>";
  }
  const arcana = TBE.num(d.arcana, c.arcana) + c.materialBonus;
  const penalty = c.trueNameUsed ? TBE.TRUE_NAME_SUMMON_PENALTY : 0;
  /* "This requires one hour of uninterrupted work and a new Arcana roll... When
   * the renewal is complete, the creature—fully aware of the attempt—rolls
   * Willpower (at -20 if its True Name was used or inscribed) opposed by the
   * caster's new Arcana result." */
  const cage = await cageTest(c.creature, arcana, c.willpower + penalty, rolls, c.trueNameUsed);
  c.renewals += 1;
  let out = "<div>An hour's uninterrupted work over " + esc(c.name) + ". " + esc(c.creature) +
    " is fully aware of the attempt.</div>" + cage.html;
  if (cage.held) {
    c.daysLeft = c.arcana;
    out += "<div>The renewed circle holds it for another <b>" + c.daysLeft + "</b> day(s).</div>";
  } else {
    c.bound = false;
    c.daysLeft = 0;
    out += (c.controlled ? "" : "<div style='font-size:11px;opacity:.85'>" + esc(q(SUM, "uncontrolledQuote")) + "</div>");
  }
  c.log.push("renewal " + c.renewals + ": " + (cage.held ? "held" : "broke free"));
  await TBE.saveTracker(c);
  return out;
}
