/* TBE: Cast — shape a spell, roll the Bind, control it or pay for it (Ch.14).
 *
 * Rebuilt in v0.15.0 as a real window rather than a one-shot dialog, because
 * the shaping rules are a calculator: Magnitude + Target + Range + Duration +
 * Effects + your armor's Initiative penalty produce a Total Cost, and the
 * whole decision at the table is whether your Mastery can cover it. The old
 * version asked the player to work the Total Cost out on paper and type in
 * the leftover as a "Weave Reaction Modifier", which is exactly the kind of
 * "the number came from somewhere else" gap this project keeps closing.
 *
 * Two phases, matching the book's own order (p.282-283):
 *   1. Shape. Every cost is priced from the verified tables and the running
 *      TC is on screen while you choose. Your Bind, Strand and any requisite
 *      are picked from what the character actually owns.
 *   2. After the roll. The book is explicit that mitigation is decided after
 *      the Bind roll but before knowing whether the target resists, and that
 *      Threads are used only after a successful roll -- so those choices are
 *      offered then, with the real ones die and Strand already counted.
 *
 * Built as classic `Application` (v1) to match the Character Wizard.
 */

const MAGIC = (typeof TBE_MAGIC !== "undefined" && TBE_MAGIC) ? TBE_MAGIC : null;
const me = TBE.me();

if (!MAGIC) {
  ui.notifications?.error("TBE: the Weave Magic data block is missing from this macro. Reinstall the system's macro compendium.");
} else if (!me) {
  ui.notifications?.warn("TBE: select the caster's token first.");
} else if (!TBE.weaver(me).isWeaver) {
  /* Rule 6: a tool you turn out not to qualify for tells you so and leaves
     you exactly as you were. Every character carries the five Bind skills at
     zero (p.79), so "has a Bind" is not the question -- reaching the Weave is
     (Ch.4, Patterned in the Weave). Nothing is rolled and nothing is spent. */
  ui.notifications?.warn("TBE: " + me.name + " is not Patterned in the Weave. Every character sheet lists the five Binds at 0 (p.79), " +
    "but casting needs a Bind above 0 and a Strand: the Patterned in the Weave Talent (Ch.4), the Spellweaver career, or a Faded Pattern. " +
    "Nothing was rolled.");
} else {
  const SHAPING = MAGIC.shaping || {};
  const EFFECTS = MAGIC.effects || [];
  const REACTIONS = MAGIC.weaveReactions || [];
  const DETAIL = MAGIC.weaveReactionDetail || [];
  const HAZARD = MAGIC.weaveHazardD6 || [];
  const MRULES = MAGIC.rules || {};

  const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

  /* p.302: the three highest tiers only apply if the casting qualifies.
   * Anything else lands on the highest unconditional row it reaches, which
   * from 26 upward is Catastrophic Fray. The previous flat-range copy of
   * this table gave 30 to Void Incursion on a Discreet spell and 31-35 to
   * Fraygeist outside a ritual.
   *
   * The gating itself now lives in TBE.reactionFor() (_lib.js), because
   * TBE: Ritual rolls on this same table and must gate it the same way. */
  const reactionFor = (total, opts) => TBE.reactionFor(REACTIONS, total, opts);
  /* The table row is "1d4 Fatigue"; the prose entry is headed "fatigued".
   * Matching "does the row contain the entry's name" therefore found nothing
   * for seven of the thirty results, including both Fatigue rows and the
   * Immobilized/Restrained entry that carries the escape rule. Map them. */
  const DETAIL_ALIASES = [
    [/Fatigue/i, "Fatigued"], [/Thread (Die )?created/i, "Thread created"],
    [/Supply/i, "Supply dice consumed"], [/Cut Off/i, "Cut Off"],
    [/Immobilized|Restrained/i, "Immobilized/Restrained"],
    [/wound/i, "Wound"], [/Weave Scar/i, "Weave Scar"], [/Marked/i, "Marked"],
    [/Fraying/i, "Fraying"], [/Hazard created/i, "Hazard created in zone"],
    [/Hallucinations/i, "Hallucinations"], [/Echo/i, "Echo"],
    [/Unexpected Detail/i, "Unexpected Detail"]
  ];
  const detailFor = (name) => {
    const direct = DETAIL.find((d) => name.toLowerCase().indexOf(d.name.toLowerCase()) > -1);
    if (direct) return direct;
    const alias = DETAIL_ALIASES.find(([re]) => re.test(name));
    return alias ? (DETAIL.find((d) => d.name === alias[1]) || null) : null;
  };

  /* Worn armor's Initiative penalty is a real number already on the sheet
   * (Bulk / 3, rounded up, worn pieces only -- the same sum the character
   * sheet prints), and the book makes it a positive modifier to every
   * spell's TC. Computed rather than asked for, with an override for a GM
   * ruling. */
  function armorInitPenalty(actor) {
    return TBE.armorInit(actor);
  }

  class TBECast extends Application {
    constructor(actor, opts = {}) {
      super(opts);
      this.actor = actor;
      this.phase = "shape";
      const armor = armorInitPenalty(actor);
      this.state = {
        effectText: "",
        bindId: (TBE.binds(actor)[0] || {}).id || "",
        strandId: (TBE.strands(actor)[0] || {}).id || "",
        requisiteId: "",
        /* p.19693: "having to use the lower value of the applicable Bind or
         * Strand". The chapter's own headline example is a Bind requisite
         * ("a Change Earth spell with a Control requisite, so Fane will use
         * the lower of his Change or Control"), which had no home here. */
        requisiteBindId: "",
        magnitude: 0, target: 1, range: 1, duration: 0,
        extraIndividuals: 0, chooseLocation: 0, exemptIndividuals: 0,
        ignoreShield: 0, ignoreArmor: 0, trigger: 0,
        armorTc: armor.penalty, armorBulk: armor.bulk,
        picked: [],                  // [{group, label, tc, count, fraying}]
        effGroup: EFFECTS[0]?.key || "", effRow: 0, effCount: 1,
        favorResolve: 0,             // up to 3 Resolve as Favor on the Bind roll
        /* p.280: "A Spellweaver must both make the correct gestures with at
         * least one hand and speak the required magical words to cast any
         * spell." The Words Alone Talent is the only way past a full pair of
         * hands, and it costs -20. */
        handsFull: false, silenced: false,
        ritual: false,
        /* p.312-313, True Names. Only meaningful with a Range of Arcane
         * Tether, which is where the UI shows it. `trueNameLang` is the
         * Language skill value the caster rolls to pronounce it; the spell
         * automatically fails without a successful roll. */
        trueName: false, trueNameLang: 0, trueNameLangName: "",
        // phase 2
        roll: null, res: null, ones: 0,
        threadsUsed: {}, threadMastery: 0, threadNotes: [],
        mitigate: 0, resolved: false,
        /* Three purchases the book explicitly allows AFTER the roll. Kept
         * separate from the pre-roll counts so the shaping total and the
         * final total can both be shown honestly. */
        postLocation: 0, postShield: 0, postArmor: 0
      };
    }

    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        id: "tbe-cast", title: "TBE: Cast", width: 640, height: 700, resizable: true
      });
    }

    binds() { return TBE.binds(this.actor); }
    strands() { return TBE.strands(this.actor); }
    threads() {
      return (this.actor.items ?? []).filter((i) => i.type === "thread").map((i) => ({
        id: i.id, item: i, name: i.name,
        attunement: String(i.system?.attunement || "").trim(),
        kind: i.system?.kind || "die", die: i.system?.die || "d8",
        pool: TBE.num(i.system?.pool, 0), bonus: TBE.num(i.system?.bonus, 0),
        expended: !!i.system?.expended, grimoire: !!i.system?.grimoire, reagent: !!i.system?.reagent
      }));
    }
    bind() { return this.binds().find((b) => b.id === this.state.bindId) || this.binds()[0] || null; }
    requisiteBind() { return this.binds().find((b) => b.id === this.state.requisiteBindId) || null; }
    /* The Law of Limitation applies to Binds exactly as it does to Strands. */
    effectiveBind() {
      const a = this.bind(), b = this.requisiteBind();
      if (!a) return null;
      /* Compare on the value the casting will actually use, which an unexpired
       * Weave Scar has already reduced (p.302). */
      if (!b || b.id === a.id) return a;
      return b.effective < a.effective ? b : a;
    }
    strand() { return this.strands().find((x) => x.id === this.state.strandId) || null; }
    requisite() { return this.strands().find((x) => x.id === this.state.requisiteId) || null; }

    /* p.276 Law of Limitation: a requisite means "use the LOWER value of the
     * applicable Bind or Strand". Applied, not merely mentioned. */
    effectiveStrand() {
      const a = this.strand(), b = this.requisite();
      if (!a) return null;
      if (!b) return a;
      return b.level < a.level ? b : a;
    }

    /* The Total Cost, itemised. Everything on screen comes from here so the
     * breakdown the player reads and the number they are judged against are
     * the same object. */
    tc() {
      const s = this.state;
      const row = (list, i) => (list || [])[i] || null;
      const mag = row(SHAPING.magnitude, s.magnitude);
      const tgt = row(SHAPING.target, s.target);
      const rng = row(SHAPING.range, s.range);
      const dur = row(SHAPING.duration, s.duration);
      const lines = [];
      const add = (label, n, note) => { if (n || note) lines.push({ label, tc: n, note: note || "" }); };
      add("Magnitude: " + (mag?.name || "?"), mag?.tc || 0);
      add("Target: " + (tgt?.name || "?"), tgt?.tc || 0, tgt?.ritual ? "Ritual only" : "");
      if (s.extraIndividuals) add(s.extraIndividuals + " additional individual target(s)", s.extraIndividuals * 2);
      if (s.chooseLocation) add("Choose Location on " + s.chooseLocation + " target(s)", s.chooseLocation * 2, "chosen after the roll");
      if (s.exemptIndividuals) add(s.exemptIndividuals + " individual(s) exempted from the zone", s.exemptIndividuals * 2);
      if (s.ignoreShield) add("Ignore shield AP on " + s.ignoreShield + " target(s)", s.ignoreShield * 2, "after the roll");
      if (s.ignoreArmor) add("Ignore up to " + (s.ignoreArmor * 3) + " armor AP", s.ignoreArmor * 1, "after the roll");
      /* Bought after the ones die is known -- the book's own worked example
       * takes a 17 TC spell to 18 that way (p.290). */
      if (s.postLocation) add("Chose the struck location on " + s.postLocation + " target(s)", s.postLocation * 2, "after the roll");
      if (s.postShield) add("Bypassed shield AP on " + s.postShield + " target(s)", s.postShield * 2, "after the roll");
      if (s.postArmor) add("Bypassed up to " + (s.postArmor * 3) + " armor AP", s.postArmor * 1, "after the roll");
      add("Range: " + (rng?.name || "?"), rng?.tc || 0);
      add("Duration: " + (dur?.name || "?"), dur?.tc || 0, dur?.ritual ? "Ritual only" : "");
      const trig = s.trigger ? (SHAPING.duration || [])[s.trigger] : null;
      if (trig) add("Triggered Effect, lasting " + trig.name, trig.tc,
        trig.tc > 8 ? "a trigger may last up to a month without a ritual" : "");
      for (const p of s.picked) add(p.group + ": " + p.label + (p.count > 1 ? " ×" + p.count : ""), p.tc * p.count);
      if (s.armorTc) add("Initiative penalty from worn armor", s.armorTc, s.armorBulk ? "Bulk " + s.armorBulk : "");
      const total = lines.reduce((n, l) => n + TBE.num(l.tc, 0), 0);
      /* Some rows carry Fraying outright, before any Weave Reaction. */
      const frayFormulas = [];
      if (tgt?.fraying) frayFormulas.push(tgt.fraying + " (" + tgt.name + ")");
      if (dur?.fraying) frayFormulas.push(dur.fraying + " (" + dur.name + " Duration)");
      for (const p of s.picked) if (p.fraying) frayFormulas.push(p.fraying * p.count + " (" + p.label + ")");
      const ritualOnly = [];
      if (tgt?.ritual) ritualOnly.push("Target " + tgt.name);
      if (dur?.ritual) ritualOnly.push("Duration " + dur.name);
      for (const p of s.picked) if (p.ritual) ritualOnly.push(p.label);
      return { lines, total, mag, tgt, rng, dur, frayFormulas, ritualOnly };
    }

    /* True Names (p.312-313) are only reachable through a Range of Arcane
     * Tether, so the option only appears once that Range is chosen -- offering
     * it beside "Touch" would be offering a rule that cannot apply.
     *
     * Unlike a physical Tether, a True Name "is not consumed with the casting,
     * and knowing another's True Name does not count towards the caster's
     * Arcane Tether limit", so nothing is spent here; the costs are the
     * Language roll, the d10 Fraying die, and the target knowing. */
    _trueNameBlock() {
      const s = this.state;
      const rng = (SHAPING.range || [])[s.range];
      if (!/arcane tether/i.test(rng?.name || "")) return "";
      const langs = TBE.languageSkills(this.actor);
      const opts = langs.length
        ? '<select data-shape="trueNameLangPick" style="width:100%"><option value="">-- use the number below --</option>' +
          langs.map((l) => '<option value="' + l.value + "|" + esc(l.name) + '"' +
            (s.trueNameLangName === l.name ? " selected" : "") + ">" + esc(l.name) + " (" + l.value + ")</option>").join("") +
          "</select>"
        : "";
      return '<div style="border:1px solid #7a6a4f;border-radius:4px;padding:4px 6px;margin-top:4px;font-size:11px">' +
        '<label style="font-weight:bold"><input type="checkbox" data-shape="trueName"' + (s.trueName ? " checked" : "") +
        "> Target through a <b>True Name</b> (p.312)</label>" +
        (s.trueName
          ? '<div style="margin-top:3px">It must be spoken aloud in the language of that name, which needs a successful ' +
            "<b>Language</b> roll &mdash; without one <b>the spell automatically fails</b>. A critical failure there also " +
            "hands you an immediate Weave Reaction (1d20+10). Every invocation rolls 1d10: on a 1, 1 Fraying. The name is " +
            "not consumed and does not count against your Arcane Tether limit, but speaking it always alerts the target." +
            "</div>" + opts +
            '<label style="display:block;margin-top:2px">Language value (if not picked above): ' +
            '<input type="number" data-shape="trueNameLang" value="' + TBE.num(s.trueNameLang, 0) + '" style="width:60px"></label>'
          : "") +
        "</div>";
    }

    /* Mastery is the ones die + the Strand value + any Threads. Before the
     * roll only the range is knowable, and saying so is the point: this is
     * the number the whole decision turns on. */
    masteryRange() {
      const st = this.effectiveStrand();
      const lvl = st ? st.level : 0;
      return { min: lvl + 1, max: lvl + 10, strand: lvl };
    }

    /* Ch.4's magic Talents are flat numbers already on the sheet, and every
     * one of them modifies a roll this window makes itself. Read by name so
     * a hand-made sheet works too; ranks come from the Item. */
    talents() {
      const out = { weaveShadow: 0, ritualCaster: false, enduringCaster: 0, forcefulStrands: [], wordsAlone: false };
      for (const i of (this.actor.items ?? [])) {
        if (i.type !== "talent") continue;
        const bare = String(i.name || "").toLowerCase().replace(/\s*\(.*$/, "").trim();
        const ranks = Math.max(1, TBE.num(i.system?.ranks, 1));
        // "Make all rolls on the Weave Reaction Table at -1. Up to five times."
        if (bare === "weave shadow") out.weaveShadow += Math.min(5, ranks);
        else if (bare === "ritual caster") out.ritualCaster = true;
        // "Spend 1 less Resolve when choosing to Mitigate... up to three times."
        else if (bare === "enduring caster") out.enduringCaster += Math.min(3, ranks);
        else if (bare === "forceful strand") {
          const nm = String(i.system?.specialization || "").trim();
          out.forcefulStrands.push({ name: nm, ranks: Math.min(3, ranks) });
        }
        else if (bare === "words alone") out.wordsAlone = true;
      }
      out.weaveShadow = Math.min(5, out.weaveShadow);
      out.enduringCaster = Math.min(3, out.enduringCaster);
      return out;
    }

    /* Everything that would stop the casting dead, with the book's reason.
     * The book makes these hard prerequisites, not warnings. */
    blockers() {
      const s = this.state, out = [];
      const b = this.effectiveBind(), st = this.effectiveStrand();
      /* "Available" is the free part of the track: unspent less Fatigue (p.26). */
      if (TBE.availableResolve(this.actor) < 1) {
        out.push("No Resolve available. A caster must have at least 1 available Resolve, or a spell cannot be attempted (p.280). Spent Resolve and Fatigue both fill the track (p.26).");
      }
      if (!b) out.push("No Bind skill on this sheet.");
      else if (b.effective <= 0) out.push("Bind: " + b.name + " is at " + b.effective +
        (b.scar ? " after a Weave Scar" : "") + ". Binds or Strands with a value of zero cannot be used in spellcasting (p.280).");
      if (!st) out.push("No Strand on this sheet.");
      else if (st.level <= 0) out.push("Strand: " + st.name + " is at 0, so it cannot be used in spellcasting (p.280).");
      const cost = this.tc();
      if (cost.ritualOnly.length && !s.ritual) {
        out.push(cost.ritualOnly.join(", ") + " can only be done as a Ritual. Tick \u201cCast as a Ritual\u201d or choose something else.");
      }
      if (s.silenced) out.push("You must speak the required magical words to cast any spell (p.280).");
      if (s.handsFull && !this.talents().wordsAlone) {
        out.push("Casting needs at least one free hand for the gestures (p.280). The Words Alone Talent is the only way past that, at -20 to the Bind roll.");
      }
      for (const w of this.durationWarnings()) out.push(w);
      return out;
    }

    /* Effects the book pins to a specific Duration. These are stated in the
     * chapter as hard requirements, so a mismatch is an error rather than a
     * note that scrolls away with the Kind dropdown. */
    durationWarnings() {
      const s = this.state;
      const dur = (SHAPING.duration || [])[s.duration];
      const name = dur ? dur.name : "";
      const out = [];
      const has = (key) => s.picked.some((p) => p.group === (EFFECTS.find((g) => g.key === key) || {}).name);
      if ((has("attackExternal") || has("attackInternal")) && dur && dur.tc !== 0) {
        out.push("All attack spells must have a Duration of Instant (p.290); this one is " + name + ".");
      }
      if (has("heal") && dur && dur.tc !== 0) {
        out.push("Magical healing must have a Duration of Instant (p.291); this one is " + name + ".");
      }
      if (has("actions") && dur && dur.tc !== 1) {
        out.push("Adding actions requires a Duration of One Round (p.289); this one is " + name + ".");
      }
      if (s.picked.some((p) => /Combat Maneuver/.test(p.label)) && dur && dur.tc !== 0) {
        out.push("A Combat Maneuver Effect must have a Duration of Instant (p.296); this one is " + name + ".");
      }
      return out;
    }

    async _renderInner() { return $(this._html()); }

    _html() {
      return '<form autocomplete="off" style="font-size:13px;padding:4px">' +
        (this.phase === "shape" ? this._shapeHtml() : this._afterHtml()) + "</form>";
    }

    _header() {
      const risk = TBE.frayingRisk(this.actor);
      const r = this.actor.system?.resolve || {};
      return '<div style="margin-bottom:6px"><b>' + esc(this.actor.name) + "</b>" +
        " &middot; Resolve " + TBE.num(r.value, 0) + " / " + TBE.num(r.max, 0) +
        " &middot; Fraying " + risk.fraying +
        (risk.inRollTerritory
          ? ' <span style="color:#8b1a1a;font-weight:bold">(every new point: ' + risk.percent + "% purge)</span>"
          : ' <span style="opacity:.7">(' + Math.max(0, risk.maxResolve - risk.fraying) + " to the Fraying Roll)</span>") +
        "</div>";
    }

    _shapeHtml() {
      const s = this.state;
      const cost = this.tc();
      const mast = this.masteryRange();
      const sel = (name, list, cur, fmt) => '<select data-shape="' + name + '" style="width:100%">' +
        list.map((r, i) => '<option value="' + i + '"' + (i === cur ? " selected" : "") + ">" + fmt(r) + "</option>").join("") + "</select>";
      const tcFmt = (r) => r.name + " (" + (r.tc ? "+" + r.tc + " TC" : "free") + ")" +
        (r.ritual ? ", ritual only" : "") + (r.fraying ? ", +" + r.fraying + " Fraying" : "");

      const binds = this.binds();
      const strands = this.strands();
      const bindSel = binds.length
        ? '<select data-shape="bindId" style="width:100%">' + binds.map((b) =>
          '<option value="' + b.id + '"' + (b.id === s.bindId ? " selected" : "") + ">" + esc(b.name) + " " +
          (b.scar ? b.effective + " (" + b.value + " &minus;" + b.scar + " Weave Scar)" : b.value) +
          (b.effective <= 0 ? " (unusable at 0)" : "") +
          (b.expertise >= 2 ? " Ex" + b.expertise : "") + "</option>").join("") + "</select>"
        : '<div style="color:#8b1a1a">No Bind skill on this sheet. A Bind roll is the casting roll, so nothing can be cast without one.</div>';
      const strandSel = strands.length
        ? '<select data-shape="strandId" style="width:100%">' + strands.map((x) =>
          '<option value="' + x.id + '"' + (x.id === s.strandId ? " selected" : "") + ">" + esc(x.name) + " " + x.level +
          (x.level <= 0 ? " (unusable at 0)" : "") + (x.thin ? " (thin)" : "") + "</option>").join("") + "</select>"
        : '<div style="color:#8b1a1a">No Strands on this sheet. A Strand is what covers the spell’s cost, so every casting would be uncontrolled.</div>';
      const reqSel = '<select data-shape="requisiteId" style="width:100%"><option value="">none</option>' +
        strands.filter((x) => x.id !== s.strandId).map((x) =>
          '<option value="' + x.id + '"' + (x.id === s.requisiteId ? " selected" : "") + ">" + esc(x.name) + " " + x.level + "</option>").join("") + "</select>";
      const reqBindSel = '<select data-shape="requisiteBindId" style="width:100%"><option value="">none</option>' +
        binds.filter((x) => x.id !== s.bindId).map((x) =>
          '<option value="' + x.id + '"' + (x.id === s.requisiteBindId ? " selected" : "") + ">" + esc(x.name) + " " + x.value + "</option>").join("") + "</select>";

      const grp = EFFECTS.find((g) => g.key === s.effGroup) || EFFECTS[0];
      const rowSel = '<select data-shape="effRow" style="width:100%">' + (grp?.rows || []).map((r, i) =>
        '<option value="' + i + '"' + (i === s.effRow ? " selected" : "") + ">" + esc(r.label) + " (" + r.tc + " TC" +
        (r.per ? " each" : "") + ")</option>").join("") + "</select>";
      const chosenRow = (grp?.rows || [])[s.effRow] || null;

      const blocked = this.blockers();
      const tal = this.talents();
      const eff = this.effectiveStrand();
      const effB = this.effectiveBind();
      const reqBits = [];
      if (this.requisite()) reqBits.push("Strand requisite: you use the <b>lower</b> value, so <b>" +
        esc(eff ? eff.name + " " + eff.level : "?") + "</b> covers the cost.");
      if (this.requisiteBind() && effB) reqBits.push("Bind requisite: you roll the <b>lower</b> value, so <b>" +
        esc(effB.name + " " + effB.value) + "</b> is the casting roll.");
      const reqNote = reqBits.length
        ? '<div style="font-size:11px;opacity:.85">' + reqBits.join(" ") + "</div>" : "";

      return this._header() +
        '<label style="display:block">What is the spell meant to do? <input type="text" data-shape="effectText" value="' +
        esc(s.effectText) + '" placeholder="Hurl the lantern flame at the guard" style="width:100%"></label>' +
        '<div style="display:flex;gap:6px;margin-top:4px"><div style="flex:1"><b style="font-size:12px">Bind</b>' + bindSel + "</div>" +
        '<div style="flex:1"><b style="font-size:12px">Strand</b>' + strandSel + "</div>" +
        '<div style="flex:1"><b style="font-size:12px">Requisite Strand</b>' + reqSel + "</div>" +
        '<div style="flex:1"><b style="font-size:12px">Requisite Bind</b>' + reqBindSel + "</div></div>" + reqNote +

        '<div style="border-top:1px solid #7a6a4f;margin-top:6px;padding-top:4px;font-weight:bold">Shape the spell</div>' +
        '<div style="display:flex;gap:6px"><div style="flex:1"><span style="font-size:11px">Magnitude</span>' +
        sel("magnitude", SHAPING.magnitude || [], s.magnitude, tcFmt) + "</div>" +
        '<div style="flex:1"><span style="font-size:11px">Target</span>' + sel("target", SHAPING.target || [], s.target, tcFmt) + "</div></div>" +
        '<div style="display:flex;gap:6px"><div style="flex:1"><span style="font-size:11px">Range</span>' +
        sel("range", SHAPING.range || [], s.range, tcFmt) + "</div>" +
        '<div style="flex:1"><span style="font-size:11px">Duration</span>' + sel("duration", SHAPING.duration || [], s.duration, tcFmt) + "</div></div>" +
        '<div style="font-size:11px;opacity:.8;margin-top:2px">' + this._castingTimeNote() + "</div>" +
        this._trueNameBlock() +

        '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;font-size:11px">' +
        [["extraIndividuals", "extra targets (+2 each)"],
         ["chooseLocation", "choose location (+2 each)"],
         ["exemptIndividuals", "exempt from zone (+2 each)"],
         ["ignoreShield", "ignore shield AP (+2 each)"],
         ["ignoreArmor", "ignore 3 armor AP (+1 each)"],
        ].map(([k, label]) =>
          '<label style="flex:1 1 30%">' + label + ': <input type="number" min="0" data-shape="' + k + '" value="' +
          TBE.num(s[k], 0) + '" style="width:44px"></label>').join("") +
        /* p.22361: "Assign an additional cost -- a trigger duration -- using
         * the normal Duration Shaping Cost Table." It is a row off that
         * table, not a number the player invents. */
        '<label style="flex:1 1 45%">triggered effect, lasting: <select data-shape="trigger" style="width:60%">' +
        '<option value="0"' + (!s.trigger ? " selected" : "") + ">not triggered</option>" +
        (SHAPING.duration || []).slice(1).map((r, i) =>
          '<option value="' + (i + 1) + '"' + (s.trigger === i + 1 ? " selected" : "") + ">" +
          esc(r.name) + " (+" + r.tc + " TC)</option>").join("") + "</select></label>" +
        "</div>" +

        '<div style="border-top:1px solid #7a6a4f;margin-top:6px;padding-top:4px;font-weight:bold">Effects</div>' +
        '<div style="display:flex;gap:4px;align-items:flex-end">' +
        '<div style="flex:1"><span style="font-size:11px">Kind</span><select data-shape="effGroup" style="width:100%">' +
        EFFECTS.map((g) => '<option value="' + g.key + '"' + (g.key === s.effGroup ? " selected" : "") + ">" + esc(g.name) + "</option>").join("") +
        "</select></div>" +
        '<div style="flex:2"><span style="font-size:11px">Effect</span>' + rowSel + "</div>" +
        (chosenRow && chosenRow.per ? '<div><span style="font-size:11px">&times;</span><input type="number" min="1" data-shape="effCount" value="' +
          Math.max(1, TBE.num(s.effCount, 1)) + '" style="width:44px"></div>' : "") +
        '<button type="button" data-action="add-effect">Add</button></div>' +
        (grp?.note ? '<div style="font-size:11px;opacity:.75">' + esc(grp.note) + "</div>" : "") +
        (s.picked.length
          ? '<ul style="margin:4px 0 0 16px;font-size:12px">' + s.picked.map((p, i) =>
            "<li>" + esc(p.group) + ": " + esc(p.label) + (p.count > 1 ? " &times;" + p.count : "") +
            " <b>" + (p.tc * p.count) + " TC</b> " +
            '<a data-action="drop-effect" data-idx="' + i + '" style="cursor:pointer;color:#8b1a1a">remove</a></li>').join("") + "</ul>"
          : '<div style="font-size:11px;opacity:.7">No Effect chosen yet. Every spell needs at least one, or it does nothing.</div>') +

        '<div style="border-top:1px solid #7a6a4f;margin-top:6px;padding-top:4px;display:flex;gap:8px;align-items:flex-end">' +
        '<label style="flex:1;font-size:11px">Worn armor Initiative penalty (added to TC): <input type="number" min="0" data-shape="armorTc" value="' +
        TBE.num(s.armorTc, 0) + '" style="width:44px"></label>' +
        '<label style="flex:1;font-size:11px">Resolve as Favor on the Bind roll (max 3, +10 each): <input type="number" min="0" max="3" data-shape="favorResolve" value="' +
        TBE.num(s.favorResolve, 0) + '" style="width:44px"></label>' +
        '<label style="flex:1;font-size:11px"><input type="checkbox" data-shape="ritual"' + (s.ritual ? " checked" : "") + "> Cast as a Ritual</label></div>" +
        '<div style="display:flex;gap:8px;font-size:11px">' +
        '<label style="flex:1"><input type="checkbox" data-shape="handsFull"' + (s.handsFull ? " checked" : "") +
        "> Both hands occupied or Impaired" + (tal.wordsAlone ? " (Words Alone: -20)" : "") + "</label>" +
        '<label style="flex:1"><input type="checkbox" data-shape="silenced"' + (s.silenced ? " checked" : "") +
        "> Cannot speak</label></div>" +

        '<div style="border-top:2px solid #7a6a4f;margin-top:6px;padding-top:6px">' +
        '<div style="font-size:12px">' + cost.lines.map((l) =>
          esc(l.label) + " <b>" + (l.tc >= 0 ? "+" : "") + l.tc + "</b>" + (l.note ? ' <span style="opacity:.65">(' + esc(l.note) + ")</span>" : "")).join(" &middot; ") + "</div>" +
        '<div style="font-size:15px;margin-top:2px">Total Cost <b>' + cost.total + " TC</b>" +
        ' <span style="font-size:12px;opacity:.85">&mdash; Mastery will be ' + mast.min + "&ndash;" + mast.max +
        " (Strand " + mast.strand + " + the ones die" + (this.threads().length ? ", before Threads" : "") + ")</span></div>" +
        this._coverageNote(cost.total, mast) +
        (cost.frayFormulas.length ? '<div style="font-size:11px;color:#8b1a1a">This shaping accrues Fraying before any Weave Reaction: ' +
          cost.frayFormulas.join(", ") + ".</div>" : "") +
        (blocked.length
          ? '<div style="font-size:11px;color:#8b1a1a">' + blocked.map((b) => "&bull; " + esc(b)).join("<br>") + "</div>"
          : "") +
        (tal.weaveShadow || (tal.ritualCaster && s.ritual) || tal.enduringCaster
          ? '<div style="font-size:11px;color:#2e7d32">Talents in play: ' +
            [tal.weaveShadow ? "Weave Shadow &minus;" + tal.weaveShadow + " on the Weave Reaction roll" : "",
             tal.ritualCaster && s.ritual ? "Ritual Caster +10 to this ritual's Bind roll" : "",
             tal.enduringCaster ? "Enduring Caster: " + tal.enduringCaster + " less Resolve when mitigating" : ""]
              .filter(Boolean).join(" &middot; ") + "</div>"
          : "") +
        "</div>" +
        '<div style="display:flex;justify-content:space-between;margin-top:8px;border-top:1px solid #7a6a4f;padding-top:8px">' +
        '<button type="button" data-action="npc">NPC shortcut (Ch.18)</button>' +
        '<button type="button" data-action="cast" style="font-weight:bold"' + (blocked.length ? " disabled" : "") + ">Make the Bind roll</button></div>";
    }

    /* p.282: casting time follows Duration, and beyond 1 minute it must be a
     * Ritual. Stated where the Duration is chosen, not in a separate table. */
    _castingTimeNote() {
      const dur = (SHAPING.duration || [])[this.state.duration];
      if (!dur) return "";
      if (dur.tc <= 3) return "Casting time: 1 action. " + MRULES.castingTimeQuote;
      if (dur.tc <= 5) return "Casting time: 1 minute, so not castable inside a combat round.";
      return "Casting time: 1 hour per point of Total Cost, and it must be cast as a Ritual.";
    }

    _coverageNote(total, mast) {
      if (total <= mast.min) {
        return '<div style="font-size:11px;color:#2e7d32">Even the worst ones die covers this: no Weave Reaction is possible.</div>';
      }
      if (total > mast.max) {
        const short = total - mast.max;
        return '<div style="font-size:11px;color:#8b1a1a">Even the best ones die leaves you <b>' + short +
          "</b> short. You will need Threads or Resolve, or a Weave Reaction is certain.</div>";
      }
      /* The ones die is 1-10 flat, so the chance of covering the cost is
       * exactly how many faces reach it. Saying the odds out loud is the
       * whole reason to shape the spell in this window. */
      const need = total - mast.strand;
      const faces = Math.max(0, Math.min(10, 10 - need + 1));
      return '<div style="font-size:11px">You need <b>' + need + "</b> or better on the ones die: <b>" +
        faces * 10 + "%</b> to control it outright, before Threads or Resolve.</div>";
    }

    /* What s.mitigate actually buys, clamped to what's affordable -- shared
     * between the live preview (_afterHtml) and the real spend (finish()) so
     * they can never disagree. The typed value used to be taken at face
     * value here (clamped only to the Reaction Modifier itself, never to
     * current Resolve), so someone with 0 Resolve left could still zero out
     * the Reaction on screen while the same card said "only 0 Resolve was
     * available" -- the sibling Favor-spend in rollBind() already clamps to
     * what's affordable before showing it; this brings mitigation in line. */
    _mitigationClamp(rawWrm) {
      const s = this.state;
      const tal = this.talents();
      const requested = Math.max(0, Math.min(rawWrm, TBE.num(s.mitigate, 0)));
      const enduringFree = Math.min(tal.enduringCaster, requested);
      const charged = Math.max(0, requested - enduringFree);
      /* Only free boxes can pay: Fatigue has crossed the rest (p.26). The
         Favor already spent this casting is off the track by now. */
      const cur = TBE.availableResolve(this.actor);
      const paid = Math.min(charged, cur);
      return { requested, enduringFree, charged, paid, reduce: enduringFree + paid, short: paid < charged };
    }

    _afterHtml() {
      const s = this.state;
      const cost = this.tc();
      const st = this.effectiveStrand();
      const b = this.bind();
      const res = s.res;
      const mastery = (res ? s.ones : 0) + (st ? st.level : 0) + TBE.num(s.threadMastery, 0);
      const wrmRaw = Math.max(0, cost.total - mastery);
      const mit = this._mitigationClamp(wrmRaw);
      const wrm = Math.max(0, wrmRaw - mit.reduce);
      /* A Thread works on any Bind or Strand the casting USES, which is both
       * halves of a requisite, not only the lower one that happens to cover
       * the cost. Filtering on effectiveStrand() alone hid the Thread for the
       * spell's own Strand whenever a requisite was chosen. */
      const inPlay = new Set([this.bind(), this.requisiteBind(), this.strand(), this.requisite()]
        .filter(Boolean).map((x) => x.name));
      /* Grimoires and Weave Reagents share the Thread Item's shape but are
       * not Threads for a casting: a grimoire "act[s] as [a] Thread for use in
       * ritual castings only" (p.316), and a reagent is spent on enchantment
       * and alchemy (p.324), never rolled for Mastery here. */
      const usable = this.threads().filter((t) => !t.expended && !t.grimoire && !t.reagent &&
        (t.kind !== "consumable" || t.pool > 0) && inPlay.has(t.attunement));

      let h = this._header() +
        '<div style="border:1px solid #7a6a4f;border-radius:4px;padding:6px">' +
        (s.effectText ? '<div style="font-style:italic">&ldquo;' + esc(s.effectText) + "&rdquo;</div>" : "") +
        "<div>" + esc(b ? b.name : "Bind") + " " + (res ? res.against : "") + ": <b>" + TBE.face(s.roll?.total ?? 0) + "</b> " +
        '<span style="color:' + TBE.colour(res) + '">' + TBE.tag(res) + "</span>" +
        (res && res.success ? ", <b>" + res.sl + " SL</b> &mdash; that is what the target must beat" : "") + "</div>";

      if (!res || !res.success) {
        h += '<div style="margin-top:4px">The spell is not cast, and 1 Resolve is spent.' +
          (res && res.critFail ? " On a critical failure the Weave lashes out anyway: the Reaction rolls at +" +
            (cost.mag?.tc || 0) + ", the spell's Magnitude cost." +
            (TBE.pattern(this.actor) === "fade" ? " A Fade also gains 1 Fraying." : "") : "") + "</div>";
      } else {
        h += '<div style="margin-top:4px">Ones die <b>' + s.ones + "</b> + Strand <b>" + (st ? st.level : 0) + "</b>" +
          (s.threadMastery ? " + Threads <b>" + s.threadMastery + "</b>" : "") +
          " = Mastery <b>" + mastery + "</b> against TC <b>" + cost.total + "</b>.</div>" +
          (s.threadNotes.length ? '<div style="font-size:11px;opacity:.85">' + s.threadNotes.join("<br>") + "</div>" : "");
        h += wrmRaw <= 0
          ? '<div style="color:#2e7d32;font-weight:bold">Controlled. No Weave Reaction.</div>'
          : '<div style="color:#8b1a1a">Uncontrolled by <b>' + wrmRaw + "</b>. That is the Weave Reaction Modifier.</div>";
      }
      h += "</div>";

      if (res && res.success && usable.length) {
        h += '<div style="margin-top:6px"><b>Threads</b> <span style="font-size:11px;opacity:.8">' +
          MRULES.threadLimitQuote + "</span></div>" +
          usable.map((t) => '<label style="display:block;font-size:12px">' +
            '<input type="checkbox" data-thread="' + t.id + '"' + (s.threadsUsed[t.id] ? " checked" : "") +
            (s.threadsUsed[t.id] ? " disabled" : "") + "> " + esc(t.name) +
            ' <span style="opacity:.75">(' + esc(t.attunement) + ", " +
            (t.kind === "die" ? t.die + " Thread Die" : t.kind === "consumable" ? t.pool + " Mastery left" : t.bonus + " Mastery, unlimited") +
            ")</span>" +
            (t.kind === "consumable" ? ' <input type="number" min="0" max="' + t.pool + '" data-thread-amt="' + t.id +
              '" value="0" style="width:44px">' : "") + "</label>").join("") +
          '<button type="button" data-action="use-threads">Use the ticked Threads</button>';
      }

      /* Mitigation reduces the Weave Reaction MODIFIER, which only exists on
       * an uncontrolled success. A critical failure has no Modifier: the
       * book fixes its Reaction roll at + the spell's Magnitude cost, and
       * there is nothing to spend Resolve against. Offering the box there
       * was dead input that printed "cancelled" over a Reaction that then
       * happened anyway. */
      if (res && res.success && wrmRaw > 0) {
        const r = this.actor.system?.resolve || {};
        const tal = this.talents();
        h += '<div style="margin-top:6px;border-top:1px solid #7a6a4f;padding-top:4px"><b>Mitigation</b> ' +
          '<span style="font-size:11px;opacity:.8">' + MRULES.mitigationQuote + " This is the only case where more than 3 Resolve may be spent.</span></div>" +
          '<label style="display:block">Resolve to spend (you have ' + TBE.num(r.value, 0) + '): <input type="number" min="0" data-shape="mitigate" value="' +
          TBE.num(s.mitigate, 0) + '" style="width:60px"></label>' +
          (tal.enduringCaster ? '<div style="font-size:11px;color:#2e7d32">Enduring Caster: ' + tal.enduringCaster +
            " less Resolve is actually spent for the same reduction.</div>" : "") +
          (mit.short ? '<div style="font-size:11px;color:#8b1a1a">Only ' + mit.paid + " of the " + mit.charged +
            " Resolve this needs is available, so at most " + mit.reduce + " of it is funded.</div>" : "") +
          '<div style="font-size:12px">Weave Reaction Modifier now <b>' + wrm + "</b>" +
          (wrm <= 0 ? ' <span style="color:#2e7d32">&mdash; cancelled.</span>'
            : " &mdash; the Reaction rolls 1d20 + " + wrm + ".") + "</div>";
      } else if (res && res.critFail) {
        h += '<div style="margin-top:6px;border-top:1px solid #7a6a4f;padding-top:4px;color:#8b1a1a">' +
          "A critical failure has no Weave Reaction Modifier to mitigate: the Reaction rolls 1d20 + <b>" +
          (cost.mag?.tc || 0) + "</b>, the spell's Magnitude cost, and Resolve cannot buy it off.</div>";
      }

      if (res && res.success) {
        /* p.290 and p.294: Choose Location, bypassing shield AP, and
         * bypassing armor AP are all bought AFTER the roll -- the chapter's
         * own worked example takes a 17 TC spell to 18 that way once the
         * ones die is known. They were only available before the roll. */
        h += '<div style="margin-top:6px;border-top:1px solid #7a6a4f;padding-top:4px"><b>After the roll</b> ' +
          '<span style="font-size:11px;opacity:.8">Each of these raises the Total Cost you have to cover, so buying one can turn a controlled spell uncontrolled.</span></div>' +
          '<div style="display:flex;flex-wrap:wrap;gap:4px;font-size:11px">' +
          [["postLocation", "choose the struck location (+2 each)"],
           ["postShield", "bypass shield AP (+2 each)"],
           ["postArmor", "bypass 3 armor AP (+1 each)"]].map(([k, label]) =>
            '<label style="flex:1 1 30%">' + label + ': <input type="number" min="0" data-shape="' + k + '" value="' +
            TBE.num(s[k], 0) + '" style="width:44px"></label>').join("") + "</div>" +
          '<div style="font-size:11px;opacity:.8">The struck location is the ones die, <b>' +
          (s.ones === 10 ? "0 (Head)" : s.ones) + "</b>, unless you pay to choose it.</div>";
      }

      h += '<div style="font-size:11px;opacity:.8;margin-top:6px">' +
        "Decide mitigation now, before you know whether the target resists. The spell will either take hold or it will not; there is no revising it." +
        "</div>" +
        '<div style="display:flex;justify-content:space-between;margin-top:8px;border-top:1px solid #7a6a4f;padding-top:8px">' +
        '<button type="button" data-action="back">&larr; Reshape</button>' +
        '<button type="button" data-action="finish" style="font-weight:bold">Resolve the casting</button></div>';
      return h;
    }

    activateListeners(html) {
      super.activateListeners(html);
      const root = html[0] ?? html;
      const s = this.state;

      const read = () => {
        root.querySelectorAll("[data-shape]").forEach((el) => {
          const k = el.dataset.shape;
          if (el.type === "checkbox") s[k] = !!el.checked;
          else if (el.type === "number") s[k] = TBE.num(el.value, 0);
          else if (el.tagName === "SELECT" && ["magnitude", "target", "range", "duration", "effRow", "trigger"].indexOf(k) > -1) s[k] = TBE.num(el.value, 0);
          else s[k] = el.value;
        });
        /* Favor is capped at 3 from any source, so a 4 typed here is not a
         * house rule, it is an error the window should not carry forward. */
        s.favorResolve = Math.max(0, Math.min(3, TBE.num(s.favorResolve, 0)));
        /* The True Name Language picker encodes "value|name" like the shared
         * skill picker does; picking one fills the number box so the two can
         * never disagree about which value is being rolled. */
        if (s.trueNameLangPick) {
          const bits = String(s.trueNameLangPick).split("|");
          s.trueNameLang = TBE.num(bits[0], 0);
          s.trueNameLangName = bits[1] || "";
        }
      };
      this._read = read;

      /* Everything TAGGED data-shape re-renders on change: the Total Cost is
       * the point of the window, so it can never be one interaction behind.
       * Text and number boxes update on `change` (blur), which keeps focus
       * while typing.
       *
       * Scoped to [data-shape] now -- it used to bind to every checkbox and
       * number input in the DOM, not just the shaping fields. read() only
       * ever captured [data-shape] fields, so a Thread checkbox
       * (data-thread) or pool amount (data-thread-amt), which the picker
       * above deliberately doesn't tag that way, still fired this handler:
       * a no-op read() followed by a full render(true) from stale state,
       * which wiped the tick before the player could click "Use the ticked
       * Threads." Same shape of bug as the Finish Character talent
       * checkbox fix in v0.17.0, in a different macro. Thread controls need
       * no listener at all -- useThreads() reads them straight off the DOM
       * at click time (see below), not through `s`. */
      root.querySelectorAll("select[data-shape], input[type=checkbox][data-shape]").forEach((el) => {
        el.addEventListener("change", () => {
          const wasGroup = s.effGroup;
          read();
          if (s.effGroup !== wasGroup) s.effRow = 0;   // a new kind starts at its first row
          this.render(true);
        });
      });
      root.querySelectorAll("input[type=number][data-shape], input[type=text][data-shape]").forEach((el) => {
        el.addEventListener("change", () => { read(); this.render(true); });
      });

      root.querySelectorAll("[data-action]").forEach((btn) => {
        btn.addEventListener("click", async (ev) => {
          read();
          const action = ev.currentTarget.dataset.action;
          if (action === "add-effect") {
            const grp = EFFECTS.find((g) => g.key === s.effGroup);
            const row = grp && grp.rows[s.effRow];
            if (row) {
              s.picked.push({
                group: grp.name, label: row.label, tc: TBE.num(row.tc, 0),
                count: row.per ? Math.max(1, TBE.num(s.effCount, 1)) : 1,
                fraying: TBE.num(row.fraying, 0), ritual: !!row.ritual
              });
              s.effCount = 1;
            }
            this.render(true);
          } else if (action === "drop-effect") {
            s.picked.splice(TBE.num(ev.currentTarget.dataset.idx, 0), 1);
            this.render(true);
          } else if (action === "back") {
            this.phase = "shape";
            s.roll = null; s.res = null; s.threadsUsed = {}; s.threadMastery = 0; s.threadNotes = []; s.mitigate = 0;
            this.render(true);
          } else if (action === "cast") {
            await this.rollBind();
          } else if (action === "use-threads") {
            await this.useThreads(root);
          } else if (action === "npc") {
            await this.npcShortcut();
          } else if (action === "finish") {
            ev.currentTarget.disabled = true;
            try { await this.finish(); } catch (err) {
              console.error("TBE | cast resolution failed", err);
              ui.notifications?.error("TBE: could not resolve the casting, see console (F12).");
              ev.currentTarget.disabled = false;
            }
          }
        });
      });
    }

    /* p.303, Reality Snag: "Each time the caster attempts another spell before
     * the effect ends, reality buckles around them. Roll 1d6." Rolled here,
     * on the attempt, before the casting resolves. */
    async snagBuckle(rolls, body) {
      if (!TBE.weaveState(this.actor).snag) return body;
      const d = await new Roll("1d6").evaluate();
      rolls.push(d);
      const row = TBE.SNAG_BUCKLE.find((r) => d.total <= r.max) || TBE.SNAG_BUCKLE[0];
      let line = "<div style='border-top:1px solid #7a6a4f;margin-top:4px;padding-top:4px'>" +
        "<b>Reality Snag</b>: d6 <b>" + d.total + "</b> &rarr; <b>" + row.name + "</b>" +
        "<div style='font-size:11px;opacity:.9'>" + row.text + "</div>";
      if (row.fatigue) {
        let amt = Number(row.fatigue);
        if (/d/.test(row.fatigue)) { const fr = await new Roll(row.fatigue).evaluate(); rolls.push(fr); amt = fr.total; }
        const fx = await TBE.addFatigue(this.actor, amt, "Weave");
        line += "<div>" + esc(this.actor.name) + " takes <b>" + amt + " Fatigue</b>" +
          (fx.overflow ? " &mdash; the track is full, so a <b>Weave wound</b> in the " +
            esc(TBE.LOC_LABELS[fx.loc] || fx.loc) + " goes to " + fx.wpNow + " WP" : "") + ".</div>";
      }
      if (row.willpower) {
        line += "<div>Then a <b>Willpower</b> roll vs " + row.willpower +
          " SL, or Cut Off for 1d6 rounds &mdash; make it with TBE: Skill Roll.</div>";
      }
      return body + line + "</div>";
    }

    async rollBind() {
      const b = this.effectiveBind();
      if (!b) return;
      const s = this.state;
      const tal = this.talents();
      /* p.312-313. The True Name is spoken before the spell lands, and a
       * failed Language roll means "the spell using it will automatically
       * fail" -- so this resolves first and can end the casting before the
       * Bind roll is ever made. The d10 Fraying die is rolled either way:
       * the trigger the book names is invoking the name, not succeeding. */
      if (s.trueName) {
        const rolls = [];
        const langValue = TBE.num(s.trueNameLang, 0);
        const lr = await TBE.d100();
        const lres = TBE.resolve(lr.total, langValue, 0);
        rolls.push(lr);
        let body = "<div><b>" + this.actor.name + "</b> speaks the True Name &mdash; " +
          (s.trueNameLangName || "Language") + " (" + langValue + "): " + TBE.face(lr.total) + " &rarr; <b>" +
          TBE.tag(lres) + "</b></div>" +
          "<div style='font-size:11px;opacity:.85'>Speaking a True Name always alerts the target that it was invoked.</div>";
        const fray = await TBE.invokeTrueNameFraying(this.actor, "invoking a True Name");
        rolls.push(fray.roll);
        body += "<div>Invocation die 1d10: <b>" + fray.roll.total + "</b> &mdash; " +
          (fray.gained ? "<b>1 Fraying</b>" : "no Fraying") + ".</div>";
        if (!lres.success) {
          if (lres.critFail) {
            const wr = await new Roll("1d20").evaluate();
            rolls.push(wr);
            const total = wr.total + 10;
            /* reactionFor() is this file's one owner for "which row does this
             * total hit", including the gated top tiers. A second inline
             * lookup here is exactly the drift this project keeps finding. */
            const row = reactionFor(total, { vulgar: false, ritual: !!s.ritual });
            body += "<div style='color:#8b1a1a;font-weight:bold'>Critical failure on the Language roll &mdash; " +
              "an immediate Weave Reaction: 1d20 " + wr.total + " +10 = " + total +
              (row ? ", <b>" + row.name + "</b>" : "") + ".</div>";
          }
          body += "<div style='font-weight:bold;color:#8b1a1a'>The name is mispronounced. The spell using it " +
            "automatically fails, and no Bind roll is made.</div>";
          await TBE.say(TBE.card("TBE Cast &mdash; True Name", body), rolls);
          return;
        }
        body += "<div style='color:#1f7a1f'>The name is spoken true. The spell may target its bearer at Arcane Tether range.</div>";
        await TBE.say(TBE.card("TBE Cast &mdash; True Name", body), rolls);
      }
      /* Favor cannot exceed what is actually on the sheet: spending Resolve
       * the character does not have is not a house rule, it is an error. */
      const available = TBE.availableResolve(this.actor);
      /* The track before anything this casting spends, for the card. */
      s.trackBefore = { system: { resolve: Object.assign({}, this.actor.system?.resolve), fatigue: this.actor.system?.fatigue } };
      s.resolveSpent = 0;
      const asked = Math.max(0, Math.min(3, TBE.num(s.favorResolve, 0)));
      const favor = Math.min(asked, Math.max(0, available - 1));
      if (favor < asked) {
        ui.notifications?.info("TBE: only " + favor + " Resolve could be spent as Favor (1 must remain to attempt the spell at all).");
        s.favorResolve = favor;
      }
      // "Ritual Caster: +10 to any spell roll made as part of a ritual."
      const ritualBonus = (tal.ritualCaster && s.ritual) ? 10 : 0;
      // "Words Alone... but at -20 to the Bind roll."
      const handsPenalty = (s.handsFull && tal.wordsAlone) ? -20 : 0;
      s.ritualBonus = ritualBonus;
      s.handsPenalty = handsPenalty;
      /* The value the casting actually uses: an unexpired Weave Scar has
         already come off it (p.302). */
      const against = b.effective + favor * 10 + ritualBonus + handsPenalty;
      const r = await TBE.d100();
      s.roll = r;
      s.res = Object.assign(TBE.resolve(r.total, against, b.expertise), { against });
      /* p.281: "Remember a '0' on the ones die counts as 10." */
      s.ones = (r.total % 10) === 0 ? 10 : r.total % 10;
      s.rolls = [r];
      if (favor) {
        const cur = TBE.num(this.actor.system?.resolve?.value, 0);
        /* The roll already used the bonus; if the deduction cannot land, the
           player is told rather than quietly getting it for free. */
        s.favorWrite = await TBE.write(this.actor,
          { "system.resolve.value": Math.max(0, cur - favor) }, "the " + favor + " Resolve");
        if (s.favorWrite.ok) s.resolveSpent += favor;
      }
      this.phase = "after";
      await this.render(true);
    }

    /* p.305-306. A Thread Die is rolled AFTER a successful Bind roll; a 1 or
     * a 2 still counts as Mastery but steps the die down, and a d6 crumbles.
     * A consumable draws from its pool. Both are written back to the Item,
     * which is why Threads are Items and not a note. */
    async useThreads(root) {
      const s = this.state;
      const bindNames = new Set([this.bind(), this.requisiteBind()].filter(Boolean).map((x) => x.name));
      const ticked = Array.from(root.querySelectorAll("[data-thread]")).filter((el) => el.checked && !el.disabled);
      const amounts = {};
      root.querySelectorAll("[data-thread-amt]").forEach((el) => { amounts[el.dataset.threadAmt] = TBE.num(el.value, 0); });
      const all = this.threads();
      let usedBind = Object.keys(s.threadsUsed).some((id) => {
        const t = all.find((x) => x.id === id); return t && bindNames.has(t.attunement);
      });
      let usedStrand = Object.keys(s.threadsUsed).some((id) => {
        const t = all.find((x) => x.id === id); return t && !bindNames.has(t.attunement);
      });
      const STEP = { d12: "d10", d10: "d8", d8: "d6" };
      for (const el of ticked) {
        const t = all.find((x) => x.id === el.dataset.thread);
        if (!t) continue;
        const isBindThread = bindNames.has(t.attunement);
        /* "You may use up to one Bind Thread and one Strand Thread in a
         * single casting. Additional Threads of the same type never stack." */
        if (isBindThread && usedBind) { ui.notifications?.info("TBE: only one Bind Thread per casting."); continue; }
        if (!isBindThread && usedStrand) { ui.notifications?.info("TBE: only one Strand Thread per casting."); continue; }
        if (isBindThread) usedBind = true; else usedStrand = true;

        if (t.kind === "die") {
          const r = await new Roll("1" + t.die).evaluate();
          (s.rolls = s.rolls || []).push(r);
          s.threadMastery += r.total;
          let note = t.name + ": " + t.die + " &rarr; <b>" + r.total + "</b> Mastery";
          if (r.total <= 2) {
            if (t.die === "d6") {
              await t.item.update({ "system.expended": true });
              note += ", and the d6 is fully expended and crumbles to dust";
            } else {
              await t.item.update({ "system.die": STEP[t.die] });
              note += ", and the die steps down to " + STEP[t.die];
            }
          }
          s.threadNotes.push(note);
        } else if (t.kind === "consumable") {
          const want = Math.max(0, Math.min(t.pool, TBE.num(amounts[t.id], 0)));
          if (!want) { ui.notifications?.info("TBE: enter how much of " + t.name + " to spend."); continue; }
          await t.item.update({ "system.pool": t.pool - want, "system.expended": t.pool - want <= 0 });
          s.threadMastery += want;
          s.threadNotes.push(t.name + ": " + want + " Mastery spent, " + (t.pool - want) + " left" +
            (t.pool - want <= 0 ? " (now inert)" : ""));
        } else {
          s.threadMastery += t.bonus;
          s.threadNotes.push(t.name + ": " + t.bonus + " Mastery (location-based, unlimited uses)");
        }
        s.threadsUsed[t.id] = true;
      }
      await this.render(true);
    }

    /* Ch.18's NPC shortcut. A GM does not shape an NPC's spell at all: the
     * ones die against the Strand decides control. All four roll outcomes
     * are spelled out there and all four are applied here -- the first cut
     * of this method treated a critical success as an ordinary success (so a
     * high ones die triggered a Reaction the book explicitly denies) and a
     * critical failure as an ordinary failure (so the Reaction the book
     * demands never happened). */
    async npcShortcut() {
      const b = this.effectiveBind();
      const st = this.effectiveStrand();
      const r = await TBE.d100();
      const res = TBE.resolve(r.total, b ? b.effective : 40, b ? b.expertise : 0);
      const raw = r.total % 10;                 // the printed face, 0-9
      const ones = raw === 0 ? 10 : raw;
      const lvl = st ? st.level : 4;
      const rolls = [r];
      let uncontrolled = false, mod = 0, note = "";

      if (res.critFail) {
        // "The spell fails and immediately triggers a Weave Reaction (1d20+5)."
        uncontrolled = true; mod = 5;
        note = "Critical failure: the spell fails and the Weave lashes out at +5. " +
          "This NPC may cast only one more successful spell this encounter before their Resolve is spent.";
      } else if (res.crit) {
        note = "Critical success: +3 SL, and no Weave Reaction.";
      } else if (!res.success) {
        note = "The spell fails. No Weave Reaction occurs.";
      } else {
        /* "If the ones die is equal to or less than the Strand, the spell is
         * controlled. If greater than Strand, OR a natural 0 regardless of
         * Strand value, it is uncontrolled." A 0 is uncontrolled even for a
         * Strand of 10, which the 0-counts-as-10 rule would otherwise hide. */
        uncontrolled = raw === 0 || ones > lvl;
        note = "Ones die <b>" + (raw === 0 ? "0" : ones) + "</b> against Strand " + lvl + " &rarr; " +
          (uncontrolled ? (raw === 0 ? "<b>uncontrolled</b> (a natural 0 is uncontrolled whatever the Strand)" : "<b>uncontrolled</b>")
            : "controlled, no Weave Reaction");
      }

      let body = "<div><b>" + esc(this.actor.name) + "</b> (NPC shortcut, Ch.18)</div>" +
        "<div>" + esc(b ? b.name : "Bind") + " " + (b ? b.effective : 40) +
          (b && b.scar ? " (Weave Scar &minus;" + b.scar + ")" : "") + ": <b>" + TBE.face(r.total) + "</b> " +
        '<span style="color:' + TBE.colour(res) + '">' + TBE.tag(res) + "</span>" +
        (res.success ? ", " + (res.sl + (res.crit ? 0 : 0)) + " SL" : "") + "</div><div>" + note + "</div>";

      if (uncontrolled) {
        const tal = this.talents();
        const wr = await new Roll("1d20").evaluate();
        rolls.push(wr);
        const total = Math.max(1, wr.total + mod - tal.weaveShadow);
        const hit = reactionFor(total, { vulgar: false, ritual: !!this.state.ritual });
        const det = detailFor(hit.name);
        body += "<div><b>Weave Reaction</b>: d20 <b>" + wr.total + "</b>" + (mod ? " + " + mod : "") +
          (tal.weaveShadow ? " &minus; " + tal.weaveShadow : "") + " = <b>" + total + "</b></div>" +
          '<div style="color:#8b1a1a;font-weight:bold">' + esc(hit.name) + "</div>" +
          (det ? '<div style="font-size:11px;opacity:.9">' + esc(det.text) + "</div>" : "") +
          '<div style="font-size:11px;opacity:.8">Some results will not meaningfully apply to an NPC; step down to the next lower result when one does not.</div>';
      }
      if (res.success) {
        /* "When an NPC's attack spell hits: roll a d10 to determine the
         * general hit location (replacing the standard rule where the
         * caster's ones die sets the hit location). Then use the target's
         * ones die from their defense roll for the detailed location." */
        const loc = await new Roll("1d10").evaluate();
        rolls.push(loc);
        const face = loc.total === 10 ? 0 : loc.total;
        const where = face === 0 ? "Head" : face <= 5 ? "Body" : face <= 7 ? "an Arm" : "a Leg";
        body += '<div style="font-size:11px;opacity:.85">Targets resist with an opposed roll against <b>' +
          res.sl + " SL</b>. If this was an attack spell, the general hit location is d10 &rarr; <b>" +
          face + "</b> (" + where + "); the detailed location comes from the target's own ones die on their defence roll.</div>";
      }
      body = await this.snagBuckle(rolls, body);
      await TBE.say(TBE.card("Weave Magic", body), rolls);
    }

    async finish() {
      const s = this.state;
      const cost = this.tc();
      const st = this.effectiveStrand();
      const b = this.bind();
      const res = s.res;
      const rolls = (s.rolls || []).slice();
      const pattern = TBE.pattern(this.actor);
      const vulgar = (cost.mag?.name || "") === "Vulgar";
      const mastery = s.ones + (st ? st.level : 0) + TBE.num(s.threadMastery, 0);

      let body = (s.effectText ? '<div style="font-style:italic">&ldquo;' + esc(s.effectText) + "&rdquo;</div>" : "") +
        "<div>" + esc(b ? b.name : "Bind") + " " + (res ? res.against : "") + ": <b>" + TBE.face(s.roll?.total ?? 0) + "</b> " +
        '<span style="color:' + TBE.colour(res) + '">' + TBE.tag(res) + "</span>" +
        (res && res.success ? ", <b>" + res.sl + " SL</b>" : "") + "</div>" +
        '<div style="font-size:11px;opacity:.85">Total Cost ' + cost.total + " = " +
        cost.lines.map((l) => esc(l.label) + " " + l.tc).join(" + ") + "</div>" +
        /* The Favor Resolve was spent (or refused) back in rollBind, before
           this card existed. If it could not be written, the roll still used
           the bonus, so the card has to say the pool is owed rather than let
           the table read an unchanged number as "nothing was spent". */
        (s.favorWrite && !s.favorWrite.ok
          ? '<div style="font-size:11px;color:#8b1a1a">Favor bonus applied, but the Resolve was not deducted. ' +
            esc(s.favorWrite.notice) + "</div>"
          : "");

      let wrm = 0, react = null, uncontrolled = false;
      if (!res || !res.success) {
        const cur = TBE.num(this.actor.system?.resolve?.value, 0);
        const w = await TBE.write(this.actor, { "system.resolve.value": Math.max(0, cur - 1) }, "the 1 Resolve");
        if (w.ok) s.resolveSpent = (s.resolveSpent || 0) + 1;
        body += w.ok
          ? "<div>The spell is not cast. 1 Resolve spent.</div>"
          : "<div>The spell is not cast. <b>1 Resolve is owed.</b> " + esc(w.notice) + "</div>";
        if (res && res.critFail) {
          /* p.283: a critical failure rolls on the Weave Reaction Table
           * adding the spell's Magnitude cost, and a Fade gains 1 Fraying. */
          uncontrolled = true;
          wrm = cost.mag?.tc || 0;
          body += "<div>Critical failure: the Weave lashes out, at +" + wrm + " for the spell's Magnitude.</div>";
        }
      } else {
        body += "<div>Mastery <b>" + mastery + "</b> = ones die " + s.ones + " + Strand " + (st ? st.level : 0) +
          (s.threadMastery ? " + Threads " + s.threadMastery : "") + "</div>" +
          (s.threadNotes.length ? '<div style="font-size:11px;opacity:.85">' + s.threadNotes.join("<br>") + "</div>" : "");
        const raw = Math.max(0, cost.total - mastery);
        /* Same clamp _afterHtml() showed during shaping (_mitigationClamp) --
         * this used to take s.mitigate at face value here too (clamped only
         * to `raw`, never to current Resolve), so a caster with 0 Resolve
         * left could still zero out the Reaction while this very card said
         * "only 0 Resolve was available." Two enforcement points for one
         * rule, only one of them actually enforced it. */
        const mit = this._mitigationClamp(raw);
        const reduce = mit.reduce;
        if (reduce) {
          const wm = await TBE.write(this.actor,
            { "system.resolve.value": Math.max(0, TBE.num(this.actor.system?.resolve?.value, 0) - mit.paid) },
            "the " + mit.paid + " Resolve for Mitigation");
          if (wm.ok) s.resolveSpent = (s.resolveSpent || 0) + mit.paid;
          body += "<div>Mitigation: the modifier drops by <b>" + reduce + "</b> for " + mit.paid + " Resolve" +
            (mit.enduringFree ? " (Enduring Caster covers " + mit.enduringFree + ")" : "") + "." +
            (wm.ok ? "" : " <b>Not deducted.</b> " + esc(wm.notice)) + "</div>";
        }
        if (mit.short) body += '<div style="font-size:11px;color:#8b1a1a">Only ' + mit.paid +
          " of the " + mit.charged + " Resolve the requested reduction needed was available, so it was only funded to " + reduce + ".</div>";
        wrm = Math.max(0, raw - reduce);
        uncontrolled = wrm > 0;
        body += uncontrolled
          ? '<div style="color:#8b1a1a">Uncontrolled: Weave Reaction Modifier <b>' + wrm + "</b>.</div>"
          : '<div style="color:#2e7d32">The cost is covered. The spell holds, with no Weave Reaction.</div>';
        if (res.crit) body += "<div>Critical success: +3 SL already included.</div>";
      }

      /* Everything this casting took off the Resolve track, drawn against the
         track as it stood before the casting: Favor, the failed casting's 1,
         Mitigation. Fatigue stays crossed from the right (p.26). */
      if (s.trackBefore && s.resolveSpent) body += "<div>" + TBE.resolveTrackHtml(s.trackBefore, s.resolveSpent) + "</div>";

      /* Fraying the shaping itself accrues, before any Reaction -- but only
       * if the spell was actually cast. p.283: "Failure: The spell is not
       * cast. Spend 1 Resolve with no further effect." A Permanent-Duration
       * ritual that simply fails used to hand the caster 2d6 Fraying. */
      let frayTotal = 0;
      const frayParts = [];
      for (const f of (res && res.success ? cost.frayFormulas : [])) {
        const m = String(f).match(/^(\d*d\d+|\d+)/);
        if (!m) continue;
        if (/d/.test(m[1])) { const fr = await new Roll(m[1]).evaluate(); rolls.push(fr); frayTotal += fr.total; frayParts.push(f + " → " + fr.total); }
        else { frayTotal += Number(m[1]); frayParts.push(f); }
      }
      if (pattern === "fade" && res && res.critFail) { frayTotal += 1; frayParts.push("1 (a Fade's critical failure)"); }

      if (uncontrolled) {
        const tal = this.talents();
        const wr = await new Roll("1d20").evaluate();
        rolls.push(wr);
        // "Weave Shadow: make all rolls on the Weave Reaction Table at -1."
        /* p.303, Reality Snag: "The caster's spells suffer +5 to future Weave
         * Reaction rolls" until the next sunrise or sunset. It was described
         * on the card that inflicted it and then never applied to anything. */
        const snagged = TBE.weaveState(this.actor).snag;
        const snagMod = snagged ? 5 : 0;
        const total = Math.max(1, wr.total + wrm + snagMod - tal.weaveShadow);
        react = reactionFor(total, { vulgar, ritual: !!s.ritual });
        const det = detailFor(react.name);
        body += '<div style="border-top:1px solid #7a6a4f;margin-top:4px;padding-top:4px"><b>Weave Reaction</b>: d20 <b>' +
          wr.total + "</b>" + (wrm ? " + " + wrm : "") +
          (snagMod ? " + 5 (Reality Snag)" : "") +
          (tal.weaveShadow ? " &minus; " + tal.weaveShadow + " (Weave Shadow)" : "") + " = <b>" + total + "</b></div>" +
          '<div style="color:#8b1a1a;font-weight:bold">' + esc(react.name) + "</div>" +
          (det ? '<div style="font-size:11px;opacity:.9">' + esc(det.text) + "</div>" : "");

        /* The results that are a real number on the sheet are applied, not
         * narrated: Fraying, Fatigue, Supply, and the two statuses the
         * shared registry already knows. Everything else is prose because
         * the book leaves it to the table. */
        const nm = react.name;
        const frayM = nm.match(/^(\d*d\d+|\d+)\s+Fraying/i);
        if (frayM) {
          const fr = /d/.test(frayM[1]) ? await new Roll(frayM[1]).evaluate() : null;
          if (fr) rolls.push(fr);
          const amt = fr ? fr.total : Number(frayM[1]);
          frayTotal += amt; frayParts.push(amt + " (Weave Reaction: " + nm + ")");
        }
        if (/Catastrophic Fray/i.test(nm) && total > 25) {
          frayTotal += total - 25;
          frayParts.push((total - 25) + " (Catastrophic Fray, 1 per point over 25)");
        }
        const fatM = nm.match(/^(\d*d\d+|\d+)\s+Fatigue/i);
        if (fatM) {
          const fr = /d/.test(fatM[1]) ? await new Roll(fatM[1]).evaluate() : null;
          if (fr) rolls.push(fr);
          const amt = fr ? fr.total : Number(fatM[1]);
          /* The overflow rule was printed at the player as a quote and never
           * applied: Fatigue was added with a bare +=, so a caster whose
           * Resolve track was already full simply accrued impossible Fatigue
           * and no Weave wound. TBE.addFatigue() owns the rule now, shared
           * with the Weary wound TBE: Journey Leg marks (Ch.11 p.189). */
          const fx = await TBE.addFatigue(this.actor, amt, "Weave");
          body += "<div>" + esc(this.actor.name) + " takes <b>" + amt + " Fatigue</b>" +
            (fx.marked ? " (" + fx.marked + " marked, now " + fx.fatigueNow + " on the track)" : "") +
            (fx.overflow
              ? " &mdash; the track is full, so a <b>Weave wound</b> in the " +
                esc(TBE.LOC_LABELS[fx.loc] || fx.loc) + " goes to <b>" + fx.wpNow + " WP</b>."
              : "") + ". " +
            '<span style="font-size:11px;opacity:.8">' + MRULES.fatigueOverflowQuote + "</span></div>";
        }
        /* Weave Scar (p.302): "reduce the Bind skill value used in the casting
         * by the listed amount." Row 14 lasts until the next sunrise or sunset;
         * row 24 is permanent, so it is written into the Bind skill itself. */
        if (/Weave Scar/i.test(nm)) {
          const usedBind = this.bind();
          const bindName = usedBind ? String(usedBind.name).trim() : "";
          const permanent = /permanent/i.test(nm);
          const amtM = nm.match(/(\d*d\d+\s*\+\s*\d+|\d*d\d+|\d+)\s*to Bind/i);
          let amount = 20;
          if (amtM && /d/.test(amtM[1])) {
            const sr = await new Roll(amtM[1].replace(/\s+/g, "")).evaluate();
            rolls.push(sr);
            amount = sr.total;
          } else if (amtM) amount = Number(amtM[1]);

          if (!bindName) {
            body += "<div><b>Weave Scar</b>: &minus;" + amount + " to the Bind used in this casting" +
              (permanent ? ", permanently" : " until the next sunrise or sunset") +
              ". <i>No Bind was named on this casting, so apply it by hand.</i></div>";
          } else if (permanent) {
            const bind = this.actor.items.find((i) => i.type === "skill" &&
              i.name.toLowerCase() === bindName.toLowerCase());
            if (bind) {
              const now = Math.max(0, TBE.num(bind.system?.value, 0) - amount);
              const ws = await TBE.writeItem(bind, { "system.value": now }, "the permanent Weave Scar");
              body += "<div><b>Weave Scar</b>: <b>" + esc(bindName) + "</b> permanently &minus;" + amount +
                " &rarr; <b>" + now + "</b>. The Tapestry reweaves the caster's own Pattern (p.302)." +
                (ws.ok ? "" : " <b>Not applied.</b> " + esc(ws.notice)) + "</div>";
            } else {
              body += "<div><b>Weave Scar</b>: &minus;" + amount + " permanently to <b>" + esc(bindName) +
                "</b>, which is not a skill on this sheet &mdash; apply it by hand.</div>";
            }
          } else {
            await TBE.addWeaveScar(this.actor, bindName, amount);
            body += "<div><b>Weave Scar</b>: <b>" + esc(bindName) + "</b> at &minus;" + amount +
              " until the next sunrise or sunset. TBE: Cast subtracts it from that Bind until then; " +
              "clear it with the Weave-day button on the Status macro.</div>";
          }
        }

        if (/Reality Snag/i.test(nm)) {
          await TBE.setRealitySnag(this.actor, true);
          body += "<div><b>Reality Snag</b>: until the next sunrise or sunset, this caster's spells are at " +
            "<b>+5 on the Weave Reaction roll</b> (still mitigable), and every further spell attempt buckles " +
            "reality around them &mdash; TBE: Cast rolls that d6 on the next casting (p.303).</div>";
        }

        if (/Supply/i.test(nm)) {
          const sup = await TBE.rollSupply(this.actor, "gear", true);
          if (sup.roll) rolls.push(sup.roll);
          body += '<div style="font-size:11px;opacity:.85">' + sup.text + "</div>";
        }
        /* The book distinguishes the two: Immobilized cannot move but can
         * still act; Restrained can neither move nor act. Both used to paint
         * the same "Restrained" token icon while the card said otherwise. */
        for (const [re, id, label] of [[/^Restrained/i, "tbe-restrained", "Restrained"], [/^Immobilized/i, "tbe-immobilized", "Immobilized"]]) {
          if (!re.test(nm)) continue;
          const dm = nm.match(/\d*d\d+/i);
          let rounds = 1;
          if (dm) { const rr = await new Roll(dm[0]).evaluate(); rolls.push(rr); rounds = rr.total; }
          const ok = await TBE.applyStatus(this.actor, id, { duration: { rounds } });
          body += ok ? "<div>" + esc(this.actor.name) + " is <b>" + label + "</b> for " + rounds + " round(s).</div>"
            : "<div>" + esc(this.actor.name) + " is " + label + ", track it by hand.</div>";
        }
        if (/Hazard created in zone/i.test(nm)) {
          const hr = await new Roll("1d6").evaluate();
          rolls.push(hr);
          const hz = HAZARD.find((x) => hr.total >= x.min && hr.total <= x.max);
          body += "<div>Hazard type 1d6 &rarr; <b>" + hr.total + "</b>: " + esc(hz ? hz.name : "?") +
            (hz && /Damaging/.test(hz.name) ? " (" + (st ? st.level : 0) + " damage, your Strand value)" : "") + "</div>";
        }
      }

      if (frayTotal > 0) {
        const f = await TBE.addFraying(this.actor, frayTotal, frayParts.join(" + "));
        if (f.roll) rolls.push(f.roll);
        body += f.html;
      }

      /* Ch.5: an Ogre who critically fails a roll they spent Resolve on
       * experiences the Breaking. The Favor spent on the Bind roll is
       * Resolve "used for" that roll; mitigation comes afterwards. */
      body += await TBE.theBreaking(this.actor, res, TBE.num(s.favorResolve, 0));

      if (res && res.success) {
        /* "Forceful Strand: for any spell you cast using this Strand, the
         * target resists at -10." The macro does not roll the target's
         * resistance, so it states the modifier where the SL is stated
         * rather than silently doing nothing with the Talent. */
        const tal2 = this.talents();
        const forceful = tal2.forcefulStrands
          .filter((f) => st && f.name && f.name.toLowerCase() === st.name.toLowerCase())
          .reduce((n, f) => n + f.ranks, 0);
        if (forceful) {
          body += '<div style="font-size:11px;color:#2e7d32">Forceful Strand (' + esc(st.name) +
            "): the target resists at <b>&minus;" + forceful * 10 + "</b>.</div>";
        }
        body += '<div style="font-size:11px;opacity:.85;margin-top:4px">Targets resist with an opposed roll against <b>' +
          res.sl + " SL</b>; success negates the entire spell. On a damaging spell the struck location is the ones die: <b>" +
          (s.ones === 10 ? "0, Head" : s.ones) + "</b>." + (s.chooseLocation ? " You paid to choose the location instead." : "") + "</div>";
      }

      body = await this.snagBuckle(rolls, body);
      await TBE.say(TBE.card("Weave Magic", body), rolls);
      this.state.resolved = true;
      this.close();
    }
  }

  new TBECast(me).render(true);
}
