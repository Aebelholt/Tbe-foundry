/* TBE: Advancement (Ch.8, p.122-124) — spend XP between sessions.
 * Improve a skill, buy Expertise, buy a new -Wise/Language/Bind skill, or
 * spend toward a Talent (handed off to TBE: Talents to actually pick it, so
 * the race-exclusivity and rank rules there don't get a second copy here).
 * Enforced here (Ch.8, p.161-163), not merely printed: a Fade's Bind can
 * never exceed 70; Binds may only be bought by a character who already has
 * Patterned in the Weave or Faded Pattern; and Talent purchases are handed
 * to TBE: Talents WITHOUT pre-charging, because that macro now charges each
 * Talent's own cost (5 XP, or 10 for Faded Pattern and Godbound). The flat
 * 5 XP taken here used to buy an unlimited number of Talents in the dialog
 * that followed.
 *
 * Strand advancement (also Ch.8) IS covered as of v0.15.0: a Strand is now a
 * real Item type with a level, so the XP-equals-the-next-value progression,
 * the sequential rule, the Fade's ceiling of 7 and the 1 Fraying per point
 * above 10 all apply here, and every Fraying point gained triggers the
 * book's Fraying Roll rather than being left to the player to remember.
 * Piety, by contrast,
 * IS tracked (TBE: Character Wizard creates a real "Piety" Lore skill Item
 * for Godbound characters) -- but p.125 "Piety and XP" is explicit that
 * "the Piety skill cannot be increased by spending XP. Only through acts of
 * service to the deity can a Godbound's Piety increase," and p.54 excludes
 * it from Expertise entirely, so it's deliberately left out of both pickers
 * below rather than offered as something to (mis)spend XP on. Raise it by
 * hand on the Skills tab as a GM-narrated reward instead. Award XP as GM
 * from the same dialog.
 */

const EXPERTISE_COST = { 2: 4, 3: 6, 4: 8 };
/* Skill Expertise Limits table, p.54 -- the maximum Expertise a skill's
 * current value allows, independent of how it got there. */
const expertiseCap = (value) => (value >= 80 ? 4 : value >= 60 ? 3 : value >= 40 ? 2 : 0);

const me = TBE.me();
if (!me || me.type !== "character") {
  ui.notifications?.warn("TBE: select a character token first (Advancement is a PC tool).");
} else {
  const xp = me.system?.experience ?? { available: 0, earned: 0 };
  /* p.162 "Magic Skills Advancement": "If you didn't acquire the Patterned
   * in the Weave or the Faded Pattern Talent during character creation, and
   * you later wish to learn magic, you must first purchase the Faded Pattern
   * Talent." So a Bind is only buyable by someone who already holds one of
   * those two. A Fade is specifically a Faded Pattern holder, and p.162
   * caps their Binds: "A Fade can never develop any Bind skill past 70." */
  const talentNames = new Set((me.items ?? []).filter((i) => i.type === "talent")
    .map((i) => i.name.trim().toLowerCase().replace(/\s*\(.*$/, "")));
  /* The Pattern is a real actor field as of v0.15.0; TBE.pattern falls back
   * to the two Talents for a sheet built before that. */
  const pattern = TBE.pattern(me);
  const isFade = pattern === "fade" || talentNames.has("faded pattern");
  const isWeaver = pattern === "spellweaver" || talentNames.has("patterned in the weave");
  const canBuyBinds = isFade || isWeaver;
  const MAGIC = (typeof TBE_MAGIC !== "undefined" && TBE_MAGIC) ? TBE_MAGIC : null;
  const BIND_NAMES = MAGIC ? (MAGIC.binds || []).map((b) => b.name) : [];
  const STRAND_NAMES = MAGIC ? (MAGIC.strands || []).map((x) => x.name) : [];
  const STRAND_DESC = {};
  if (MAGIC) for (const x of (MAGIC.strands || [])) STRAND_DESC[x.name] = x.desc;
  const strands = TBE.strands(me);
  const strandCap = TBE.strandCap(isFade ? "fade" : "spellweaver");
  const risk = TBE.frayingRisk(me);
  const FADE_BIND_CAP = 70;
  const hasPiety = (me.items ?? []).some((i) => i.type === "skill" && i.name.trim().toLowerCase() === "piety");
  // p.125 "Piety and XP": Piety cannot be improved with XP or given
  // Expertise at all -- only by GM-narrated acts of service. Left off the
  // picker below entirely rather than offered and then blocked.
  const skillItems = (me.items ?? []).filter((i) => i.type === "skill" && i.name.trim().toLowerCase() !== "piety")
    .map((i) => ({ id: i.id, name: i.name, value: TBE.num(i.system?.value, 0), expertise: TBE.num(i.system?.expertise, 0), savvy: !!i.system?.savvy, group: i.system?.group }))
    .sort((a, b) => a.name.localeCompare(b.name));
  /* Show what each skill can actually support right now (p.54 limits table),
   * so a player picks an eligible skill instead of being bounced after
   * clicking Go. */
  const skillOpts = skillItems.map((s) => {
    const cap = expertiseCap(s.value);
    const next = s.expertise === 0 ? 2 : s.expertise + 1;
    const exNote = s.expertise >= 4 ? "Ex4 max"
      : cap === 0 ? "no Ex below 40"
      : next > cap ? "Ex" + next + " needs " + (next === 2 ? 40 : next === 3 ? 60 : 80)
      : "Ex" + next + " for " + EXPERTISE_COST[next] + " XP";
    /* p.162: a Fade's Bind skills carry a second ceiling (70) that Expertise
     * doesn't -- shown here the same way the Strand picker below already
     * shows its own ceiling, so a Fade sees the distance to it before
     * spending on Improve, not after (see FADE_BIND_CAP enforcement in the
     * "improve" branch). */
    const bindCapNote = (isFade && s.group === "Bind")
      ? (s.value >= FADE_BIND_CAP ? ", at the Bind ceiling of " + FADE_BIND_CAP : ", Bind ceiling " + FADE_BIND_CAP)
      : "";
    return '<option value="' + s.id + '">' + s.name + " (" + s.value +
      TBE.expertiseTag(s.expertise) + (s.savvy ? " S" : "") + ") — " + exNote + bindCapNote + "</option>";
  }).join("");

  /* Ch.6 Goals, read off the actor rather than asked about. A goal already
   * paid is shown greyed with its tick removed, so a session's award is a
   * matter of ticking what actually finished. */
  const goals = (me.system?.goals || []).map((g, i) => Object.assign({ idx: i }, g));
  function goalBlock() {
    if (!goals.length) {
      return '<div style="font-size:11px;opacity:.75">No Goals on this sheet. Build them with <b>TBE: Finish Character</b>, ' +
        "which walks the book's four-step method; XP is paid per goal completed (p.160).</div>";
    }
    return '<div style="font-size:11px;opacity:.8;margin-top:2px">Goals completed this session (+1 individual, +2 shared):</div>' +
      goals.map((g) => '<label style="display:block;font-size:12px;opacity:' + (g.awarded ? ".5" : "1") + '">' +
        '<input type="checkbox" name="goal_' + g.idx + '"' + (g.awarded ? " disabled" : g.done ? " checked" : "") + "> " +
        (g.text || "(unnamed goal)") + ' <span style="font-size:10px;opacity:.75">' + g.kind + " +" +
        (g.kind === "shared" ? 2 : 1) + (g.awarded ? ", already paid" : "") + "</span></label>").join("");
  }

  /* The Weave Magic half of the dialog. Every number a player would have to
   * look up is printed beside the control that spends it: what the next
   * level of each Strand costs, what Fraying it adds, where the ceiling is,
   * and what the running purge chance already is. */
  function magicBlock() {
    const capNote = strandCap
      ? "A Fade's Strands can never be developed past " + strandCap + "."
      : "Above 10 there is no ceiling, but every point costs 1 Fraying.";
    const rows = strands.length
      ? strands.map((st) => {
        const next = TBE.strandXp(st.level, st.level + 1);
        const atCap = strandCap !== null && st.level >= strandCap;
        return '<option value="' + st.id + '">' + st.name + " " + st.level +
          (st.thin ? " (thin)" : "") + " &mdash; " +
          (atCap ? "at the ceiling of " + strandCap : "next level " + next.xp + " XP" +
            (next.fraying ? " and " + next.fraying + " Fraying" : "")) + "</option>";
      }).join("")
      : '<option value="">No Strands on this sheet yet</option>';
    const known = new Set(strands.map((st) => st.name.toLowerCase()));
    const newOpts = STRAND_NAMES.filter((n) => !known.has(n.toLowerCase()))
      .map((n) => '<option value="' + n + '">' + n + "</option>").join("");
    return "<hr><b>Weave Magic</b> " +
      '<span style="font-size:11px;opacity:.8">(' + (isFade ? "Fade" : "Spellweaver") +
      ") &mdash; used only if Action above is Raise a Strand, Learn a new Strand, or Record Fraying</span>" +
      '<div style="font-size:11px;opacity:.85">Fraying <b>' + risk.fraying + "</b> against Max Resolve " + risk.maxResolve + ". " +
      (risk.inRollTerritory
        ? '<span style="color:#8b1a1a;font-weight:bold">Every new point is a ' + risk.percent + "% chance of being purged from reality.</span>"
        : "The Fraying Roll starts once the total passes Max Resolve: " + Math.max(0, risk.maxResolve - risk.fraying) + " point(s) of room left.") +
      "</div>" +
      '<label style="display:block">Strand to raise: <select name="strand" style="width:100%">' + rows + "</select></label>" +
      '<label style="display:block">Raise it by how many levels: <input type="number" name="strandSteps" value="1" min="1" max="10" style="width:100%">' +
      '<span style="font-size:10px;opacity:.7">Improvements must be sequential, so each level in between is paid for. ' + capNote + "</span></label>" +
      '<label style="display:block">New Strand to learn: <select name="newstrand" style="width:100%">' +
      '<option value="">(choose)</option>' + newOpts + "</select>" +
      '<span style="font-size:10px;opacity:.7">The Strand Secret Talent costs 5 XP, or 10 for a Thin Strand, and starts it at 1. ' +
      "You must first have been taught it or found a source to study, which usually takes a week.</span></label>" +
      (isFade ? "" : '<label style="display:block;font-size:12px"><input type="checkbox" name="newthin"> It is one of my Thin Strands (double cost)</label>') +
      '<label style="display:block">Fraying points to record: <input type="number" name="frayAmt" value="1" min="0" style="width:100%">' +
      '<span style="font-size:10px;opacity:.7">From a Weave Reaction, a ritual, or a Year/Permanent Duration. The Fraying Roll is made for you.</span></label>' +
      '<label style="display:block">Where it came from: <input type="text" name="frayWhy" value="" placeholder="Weave Reaction 20, a Permanent ritual..." style="width:100%"></label>';
  }

  const content =
    '<div style="font-size:13px">' +
    "<div><b>" + me.name + "</b> &middot; XP available <b>" + xp.available + "</b> (earned " + xp.earned + " lifetime)</div><hr>" +
    '<label style="display:block">Action: <select name="act" style="width:100%">' +
    '<option value="improve">Improve a skill (1 XP/attempt)</option>' +
    '<option value="expertise">Buy the next Expertise level (4/6/8 XP)</option>' +
    '<option value="newskill">Buy a new -Wise, Language, or Bind skill</option>' +
    '<option value="talent">Buy a Talent (opens TBE: Talents, which charges its own cost)</option>' +
    (canBuyBinds ? '<option value="strand">Raise a Strand (XP equal to each new level)</option>' +
      '<option value="newstrand">Learn a new Strand (Strand Secret Talent)</option>' +
      '<option value="fraying">Record Fraying points and make the Fraying Roll</option>' : "") +
    '<option value="award">GM: award XP</option>' +
    "</select></label>" +
    '<label style="display:block">Skill (Improve / Expertise): <select name="skill" style="width:100%">' + skillOpts + "</select></label>" +
    (hasPiety ? '<div style="font-size:11px;opacity:.75;margin-top:-4px">Piety isn\'t listed: p.125 "Piety and XP" bars it from XP spend and Expertise -- raise it by hand on the Skills tab as a GM-narrated reward instead.</div>' : "") +
    '<hr><b>New skill</b> <span style="font-size:11px;opacity:.7">(used only if Action above is "Buy a new -Wise, Language, or Bind skill")</span>' +
    '<label style="display:block">Type: <select name="newtype" style="width:100%">' +
    '<option value="wise">-Wise or Language, 3 XP, starts at 20</option>' +
    '<option value="bind">Bind, 5 XP, starts at 10 (a Fade\'s Bind can never exceed 70)</option>' +
    "</select></label>" +
    '<label style="display:block">Name: <input type="text" name="newname" value="" placeholder="Local-wise, or a Bind name" style="width:100%"></label>' +
    (BIND_NAMES.length ? '<div style="font-size:11px;opacity:.75;margin-top:-4px">The five Binds are ' + BIND_NAMES.join(", ") +
      ". Any other name is a -Wise or Language.</div>" : "") +
    '<label style="display:block">Group (for the -Wise/Language option): <select name="newgroup" style="width:100%">' +
    '<option value="Wise">Wise</option><option value="Language">Language</option></select></label>' +
    (canBuyBinds ? magicBlock() : "") +
    '<hr><b>GM: award XP</b> <span style="font-size:11px;opacity:.7">(used only if Action above is "GM: award XP")</span>' +
    /* p.160 Gaining XP table, tick what happened instead of doing the sum
     * by hand. The 3 XP goal-pursuit line is capped per session (p.72: "you
     * can only gain a maximum of 3 XP per session for pursuing goals"). */
    '<div style="font-size:11px;opacity:.8">Tick what happened this session (p.160), or just type an amount.</div>' +
    [["pursue", "Pursued goals against meaningful obstacles", 3],
     ["failed", "Failed or abandoned a goal dramatically", 1],
     ["revelation", "Experienced one or more revelations", 1],
     ["trait", "Accepted a skill penalty from a Personality Trait", 1]]
      .map(([k, label, v]) => '<label style="display:block;font-size:12px"><input type="checkbox" name="xp_' + k + '"> ' +
        label + " <b>+" + v + "</b></label>").join("") +
    /* p.160 pays per goal completed, so the flat "completed a goal" tick was
     * both under-paying a session that finished two and impossible to audit.
     * The actor's own Goals are listed instead, each paid once: ticking one
     * marks it awarded on the sheet so it cannot be paid twice. */
    goalBlock() +
    '<label style="display:block">Extra / manual amount: <input type="number" name="amt" value="0" style="width:100%"></label>' +
    "</div>";

  const data = await TBE.prompt("Advancement", content, "Go");
  if (data) {
    let body = "";
    /* Rolls made below (the Fraying Roll) ride along on the chat card so the
     * dice are visible rather than asserted. */
    const rollsOut = [];
    const spend = async (cost) => {
      if (xp.available < cost) return false;
      xp.available -= cost;
      await me.update({ "system.experience.available": xp.available });
      return true;
    };

    if (data.act === "award") {
      const TABLE = [["pursue", "pursued goals", 3], ["failed", "failed or abandoned a goal meaningfully", 1],
        ["revelation", "had a revelation", 1], ["trait", "accepted a Personality Trait penalty", 1]];
      const ticked = TABLE.filter(([k]) => data["xp_" + k] === "on" || data["xp_" + k] === true);
      /* Per goal, per the book, and each goal paid exactly once. */
      const doneGoals = goals.filter((g) => !g.awarded &&
        (data["goal_" + g.idx] === "on" || data["goal_" + g.idx] === true));
      const goalXp = doneGoals.reduce((n, g) => n + (g.kind === "shared" ? 2 : 1), 0);
      const manual = TBE.num(data.amt, 0);
      const amt = ticked.reduce((n, [, , v]) => n + v, 0) + goalXp + manual;
      if (amt <= 0) { body = "<div>Nothing ticked and no amount entered, so no XP awarded.</div>"; }
      else {
        xp.available += amt; xp.earned += amt;
        await me.update({ "system.experience.available": xp.available, "system.experience.earned": xp.earned });
        /* Mark the goals paid so the next session cannot pay them again. */
        if (doneGoals.length) {
          const next = TBE.clone(me.system?.goals || []);
          for (const g of doneGoals) if (next[g.idx]) { next[g.idx].awarded = true; next[g.idx].done = true; }
          try { await me.update({ "system.goals": next }); } catch (err) { console.warn("TBE | could not mark goals awarded", err); }
        }
        body = "<div><b>" + me.name + "</b> is awarded <b>" + amt + " XP</b> (now " + xp.available + " available, " + xp.earned + " lifetime).</div>" +
          (ticked.length || doneGoals.length ? "<div style='font-size:11px;opacity:.85'>" +
            ticked.map(([, label, v]) => label + " +" + v)
              .concat(doneGoals.map((g) => "completed " + (g.kind === "shared" ? "shared" : "individual") +
                " goal \u201c" + (g.text || "unnamed") + "\u201d +" + (g.kind === "shared" ? 2 : 1)))
              .join(", ") + (manual ? ", manual +" + manual : "") + "</div>" : "");
      }
    } else if (data.act === "improve") {
      const item = skillItems.find((s) => s.id === data.skill);
      /* p.162: "A Fade can never develop any Bind skill past 70." Checked
       * BEFORE spend() now, the same enforcement point the "strand" branch
       * below already uses for its own cap -- this branch used to spend the
       * 1 XP unconditionally and only discover afterward that the roll
       * changed nothing, refunding nothing on a no-op. */
      const capped = !!item && isFade && item.group === "Bind";
      if (!item) { body = "<div>No skill selected.</div>"; }
      else if (capped && item.value >= FADE_BIND_CAP) {
        body = "<div><b>" + item.name + "</b> is already at " + item.value + ". A Fade can never develop a Bind past " + FADE_BIND_CAP + " (p.162).</div>";
      }
      else if (!(await spend(1))) { body = "<div>Not enough XP: improving a skill costs 1 XP, " + me.name + " has " + xp.available + ".</div>"; }
      else {
        const r = await TBE.d100();
        let inc;
        if (r.total > item.value) {
          const d4 = await new Roll("1d4").evaluate();
          inc = 1 + d4.total + (item.savvy ? 1 : 0);
        } else {
          inc = 1 + (item.savvy ? 1 : 0);
        }
        const before = item.value;
        const after = capped ? Math.min(FADE_BIND_CAP, before + inc) : before + inc;
        await me.updateEmbeddedDocuments("Item", [{ _id: item.id, "system.value": after }]);
        body = "<div><b>" + item.name + "</b>: roll " + TBE.face(r.total) + " vs " + before +
          (r.total > before ? " (over &mdash; 1d4+1" : " (at or under &mdash; flat 1") +
          (item.savvy ? " +1 Savvy" : "") + "): <b>+" + inc + "</b> &rarr; " + before + " &rarr; " + after + ".</div>" +
          (capped && after === FADE_BIND_CAP && before + inc > FADE_BIND_CAP
            ? "<div style='font-size:11px;color:#8b1a1a'>Held at " + FADE_BIND_CAP +
              ": a Fade can never develop a Bind past " + FADE_BIND_CAP + " (p.162).</div>" : "") +
          "<div style='font-size:11px;opacity:.8'>1 XP spent, " + xp.available + " remaining.</div>";
      }
    } else if (data.act === "expertise") {
      const item = skillItems.find((s) => s.id === data.skill);
      if (!item) { body = "<div>No skill selected.</div>"; }
      else if (item.expertise >= 4) { body = "<div><b>" + item.name + "</b> is already at Ex4, the maximum.</div>"; }
      else {
        const target = item.expertise === 0 ? 2 : item.expertise + 1;
        const cost = EXPERTISE_COST[target];
        const cap = expertiseCap(item.value);
        if (target > cap) {
          body = "<div><b>" + item.name + "</b> at " + item.value + " can support at most Ex" + cap +
            (cap === 0 ? " (below 40, no Expertise yet)" : "") + " &mdash; raise the skill value first.</div>";
        } else if (!(await spend(cost))) {
          body = "<div>Not enough XP: Ex" + target + " on " + item.name + " costs " + cost + ", " + me.name + " has " + xp.available + ".</div>";
        } else {
          await me.updateEmbeddedDocuments("Item", [{ _id: item.id, "system.expertise": target }]);
          body = "<div><b>" + item.name + "</b> gains <b>Ex" + target + "</b> (" + cost + " XP spent, " + xp.available + " remaining). A successful roll now guarantees at least " + target + " SL.</div>";
        }
      }
    } else if (data.act === "newskill") {
      const name = (data.newname || "").trim();
      // Bind cost reads from the data table (MAGIC.rules.newBindXp) instead
      // of a second hand-typed 5 next to it -- the -Wise/Language cost has
      // no backing table entry, so it stays a literal.
      const cost = data.newtype === "bind" ? TBE.num(MAGIC?.rules?.newBindXp, 5) : 3;
      const startValue = data.newtype === "bind" ? 10 : 20;
      const group = data.newtype === "bind" ? "Bind" : (data.newgroup === "Language" ? "Language" : "Wise");
      if (!name) { body = "<div>Name the new skill first.</div>"; }
      else if (data.newtype === "bind" && !canBuyBinds) {
        /* p.162: without Patterned in the Weave or Faded Pattern you must
         * buy Faded Pattern first. Previously any character could buy Binds
         * and start casting. */
        body = "<div><b>" + me.name + "</b> cannot open a Bind skill yet.</div>" +
          "<div style='font-size:12px'>p.162: you need <b>Patterned in the Weave</b> or <b>Faded Pattern</b> first. " +
          "Neither is on this character, so buy the <b>Faded Pattern</b> Talent (10 XP after character creation) via the Talent option above.</div>";
      }
      else if ((me.items ?? []).some((i) => i.type === "skill" &&
        (i.name.toLowerCase() === name.toLowerCase() ||
          /* Chargen writes Binds as "Bind: Control", so typing "Control"
           * here used to slip past the duplicate check and create a second
           * Bind Item at 10 beside the one already on the sheet. */
          (data.newtype === "bind" && i.system?.group === "Bind" &&
            i.name.toLowerCase().replace(/^bind\s*:\s*/, "").trim() === name.toLowerCase().replace(/^bind\s*:\s*/, "").trim())))) {
        const existing = (me.items ?? []).find((i) => i.type === "skill" && i.system?.group === "Bind" &&
          i.name.toLowerCase().replace(/^bind\s*:\s*/, "").trim() === name.toLowerCase().replace(/^bind\s*:\s*/, "").trim());
        body = "<div>" + me.name + " already has " + (existing ? existing.name + " at " + TBE.num(existing.system?.value, 0) : name) + ".</div>" +
          (existing && TBE.num(existing.system?.value, 0) === 0
            ? "<div style='font-size:12px'>It sits at 0, which cannot be cast with. Use <b>Improve a skill</b> to raise it, " +
              "or set it to 10 on the Skills tab if this is the 5 XP purchase.</div>"
            : "");
      } else if (!(await spend(cost))) {
        body = "<div>Not enough XP: a new " + group + " skill costs " + cost + ", " + me.name + " has " + xp.available + ".</div>";
      } else {
        /* Name a Bind the way chargen and the sheet name them, so the Magic
         * tab lists it under the right heading instead of as a stray
         * "custom Bind slot". */
        const finalName = group === "Bind" && !/^bind\s*:/i.test(name) ? "Bind: " + name : name;
        await me.createEmbeddedDocuments("Item", [{
          name: finalName, type: "skill", img: "icons/svg/book.svg",
          system: { group, value: startValue, fighting: false, expertise: 0, savvy: false }
        }]);
        body = "<div><b>" + finalName + "</b> (" + group + ") added at " + startValue + " (" + cost + " XP spent, " + xp.available + " remaining).</div>";
      }
    } else if (data.act === "strand") {
      /* p.123-124. Sequential by construction: TBE.strandXp charges each
       * level in between, and every point above 10 brings its own Fraying,
       * which then has to survive the Fraying Roll. */
      const st = strands.find((x) => x.id === data.strand);
      const steps = Math.max(1, TBE.num(data.strandSteps, 1));
      if (!st) { body = "<div>No Strand selected. A Spellweaver picks four at creation; anyone else buys the Strand Secret Talent first.</div>"; }
      else if (strandCap !== null && st.level >= strandCap) {
        body = "<div><b>" + st.name + "</b> is already at " + st.level + ". A Fade's Strands can never be developed past " + strandCap + " (p.124).</div>";
      } else {
        const want = strandCap !== null ? Math.min(strandCap, st.level + steps) : st.level + steps;
        const cost = TBE.strandXp(st.level, want);
        const trimmed = want < st.level + steps;
        if (!cost.steps) { body = "<div>Nothing to raise.</div>"; }
        else if (!(await spend(cost.xp))) {
          body = "<div>Not enough XP: " + st.name + " " + st.level + " &rarr; " + want + " costs <b>" + cost.xp +
            " XP</b> (" + Array.from({ length: cost.steps }, (_, i) => st.level + 1 + i).join(" + ") + "), " +
            me.name + " has " + xp.available + ".</div>";
        } else {
          await me.updateEmbeddedDocuments("Item", [{ _id: st.id, "system.level": want }]);
          body = "<div><b>" + st.name + "</b>: " + st.level + " &rarr; <b>" + want + "</b> for " + cost.xp + " XP (" +
            Array.from({ length: cost.steps }, (_, i) => st.level + 1 + i).join(" + ") + "). " +
            xp.available + " XP remaining.</div>" +
            (trimmed ? '<div style="font-size:11px;color:#8b1a1a">Held at ' + strandCap + ": a Fade's Strands can never be developed past " + strandCap + ".</div>" : "");
          if (cost.fraying) {
            /* Each level above 10 is its own improvement and its own point of
             * Fraying, and p.308 demands a Fraying Roll "anytime a
             * Spellweaver gains a point". Rolling once at the final total
             * would understate the risk of a multi-level raise. */
            const f = await TBE.addFraying(me, cost.fraying, "raising " + st.name + " above 10",
              { sequential: true });
            body += f.html;
            for (const r of (f.rolls || [])) rollsOut.push(r);
          }
        }
      }
    } else if (data.act === "newstrand") {
      /* p.124: "they may spend 5 XP to acquire the Strand Secret Talent,
       * granting the Strand a starting value of 1. If the Strand is a Thin
       * Strand, the cost is instead 10 XP." A Fade "is not limited by Thin
       * Strands", so the doubled cost never applies to one. */
      const name = (data.newstrand || "").trim();
      const thin = !isFade && (data.newthin === "on" || data.newthin === true);
      // Read from MAGIC.rules instead of a second hand-typed 5/10 beside it.
      const cost = thin ? TBE.num(MAGIC?.rules?.newThinStrandTalentXp, 10) : TBE.num(MAGIC?.rules?.newStrandTalentXp, 5);
      if (!name) { body = "<div>Choose which Strand to learn.</div>"; }
      else if (strands.some((x) => x.name.toLowerCase() === name.toLowerCase())) {
        body = "<div>" + me.name + " already knows the " + name + " Strand.</div>";
      } else if (!(await spend(cost))) {
        body = "<div>Not enough XP: the Strand Secret Talent for " + name + " costs " + cost + " XP, " + me.name + " has " + xp.available + ".</div>";
      } else {
        await me.createEmbeddedDocuments("Item", [
          { name, type: "strand", img: "icons/svg/daze.svg",
            system: { level: 1, thin, description: "<p>" + (STRAND_DESC[name] || "") + "</p>" } },
          { name: "Strand Secret (" + name + ")", type: "talent", img: "icons/svg/upgrade.svg",
            system: { category: "Magic", requirements: "Taught by someone who knows it, or a studied source", ranks: 1,
              maxRanks: "per-skill", specialization: name, sub: false,
              description: "<p>Gain a new Strand of your choice at a value of 1 (a Thin Strand costs 10 XP).</p>" } }
        ]);
        body = "<div><b>" + name + "</b> opens at level <b>1</b>" + (thin ? " (a Thin Strand, so double cost)" : "") +
          " for " + cost + " XP. " + xp.available + " XP remaining.</div>" +
          '<div style="font-size:11px;opacity:.8">' + (STRAND_DESC[name] || "") + "</div>";
      }
    } else if (data.act === "fraying") {
      const amt = Math.max(0, TBE.num(data.frayAmt, 0));
      if (!amt) { body = "<div>No Fraying points entered.</div>"; }
      else {
        const f = await TBE.addFraying(me, amt, (data.frayWhy || "").trim());
        body = f.html;
        if (f.roll) rollsOut.push(f.roll);
      }
    } else if (data.act === "talent") {
      /* No XP is taken here any more. TBE: Talents now charges each Talent's
       * own cost (5 XP, 10 for Faded Pattern and Godbound post-creation) and
       * refuses what the character can't afford. Charging a flat 5 here meant
       * one payment could buy any number of Talents in the dialog that
       * followed, and overpaid or underpaid whenever the real cost differed. */
      body = "<div>Opening <b>TBE: Talents</b>. It charges each Talent's own cost from " +
        me.name + "'s <b>" + xp.available + " XP</b> and enforces prerequisites, race exclusivity " +
        "and the creation-only restriction.</div>";
      setTimeout(async () => {
        const ok = await TBE.runMacro("TBE: Talents");
        if (!ok) ui.notifications?.warn("TBE: Talents wasn't found — run it manually from the Solo Panel.");
      }, 50);
    }

    await TBE.say(TBE.card("TBE Advancement", body), rollsOut);
  }
}
