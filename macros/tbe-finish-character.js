/* TBE: Finish Character — everything chargen leaves open, on one screen,
 * after the numbers are known.
 *
 * The wizard's Equip / Status / Goals steps were near-empty pages asking for
 * things that only make sense once totals exist: you cannot shop before the
 * silver is rolled, Status is a single number that other steps grant on their
 * own, and a goal wants room to be built rather than a one-line box. Those
 * three steps are gone from the wizard and live here instead, alongside the
 * other loose ends (naming blank -wise/Language slots, Shared History, and
 * the free Talent picks Race/Rounding Out grant).
 *
 * Runs standalone at any time, so it doubles as a "tidy up this character"
 * tool, not only a chargen tail. Everything writes straight to the actor.
 */

const me = TBE.me();
if (!me || me.type !== "character") {
  ui.notifications?.warn("TBE: select a character token first (Finish Character is a PC tool).");
} else {
  const EQUIP = (typeof TBE_EQUIPMENT !== "undefined" && TBE_EQUIPMENT)
    ? TBE_EQUIPMENT : { weapons: [], shields: [], armor: [] };
  const CATALOGUE = (typeof TBE_TALENTS !== "undefined" && TBE_TALENTS) ? TBE_TALENTS : [];
  const CHARGEN = (typeof TBE_CHARGEN !== "undefined" && TBE_CHARGEN) ? TBE_CHARGEN : { races: [] };

  /* Catalogue owned by _lib.js (TBE.SKILL_GROUPS). */
  const SKILLS = TBE.SKILL_GROUPS;
  const SKILL_ALL = Object.values(SKILLS).flat();
  const LOCATIONS = [["head", "Head"], ["body", "Body"], ["rArm", "R Arm"], ["lArm", "L Arm"], ["rLeg", "R Leg"], ["lLeg", "L Leg"]];

  const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

  class TBEFinishCharacter extends Application {
    constructor(actor, opts = {}) {
      super(opts);
      this.actor = actor;
      this.tab = "equip";
      this.TABS = [
        { key: "summary", label: "Summary" },
        { key: "equip", label: "Equip" },
        { key: "talents", label: "Talents" },
        { key: "wises", label: "Wises & Languages" },
        { key: "goals", label: "Goals" },
        { key: "shared", label: "Shared History" },
        { key: "status", label: "Status" }
      ];
      this.buy = { kind: "weapon", pick: "", loc: "body", qty: 1 };
      this.goal = { want: "", obstacle: "", action: "", kind: "individual" };
      this.shared = { with: "", skill: "" };
      this.talentSpendXp = false;
      /* Which [data-talent] checkboxes are ticked right now. Must be tracked
       * here, not just read off the DOM at submit time: the tab re-renders
       * on every checkbox change (category selects need that), and the HTML
       * never carried a "checked" attribute, so every tick reverted itself
       * on the very next render -- ticking a box looked like it did nothing. */
      this.talentChecked = new Set();
      this.newWise = { group: "Wise", name: "" };
      /* Opens on the new Summary tab right after chargen (so the player sees
       * race/career/concept/skill-math before anything else), then defaults
       * back to Equip on every later run -- Finish Character is also a
       * "tidy up this character any time" tool, and Equip is what most of
       * those later visits are for. */
      const ledger = actor.flags?.["the-broken-empires"]?.chargenLedger;
      if (ledger?.ts && Date.now() - ledger.ts < 5 * 60 * 1000) this.tab = "summary";
    }

    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        id: "tbe-finish-character", title: "TBE: Finish Character",
        width: 660, height: 680, resizable: true, classes: ["tbe-finish"]
      });
    }

    /* ---- actor reads ---------------------------------------------------- */
    silver() { return TBE.num(this.actor.system?.silver, 0); }
    xp() { return TBE.num(this.actor.system?.experience?.available, 0); }
    items(type) { return (this.actor.items ?? []).filter((i) => i.type === type); }
    skills() { return this.items("skill"); }
    ownedTalentNames() {
      return new Set(this.items("talent").map((i) => i.name.trim().toLowerCase().replace(/\s*\(.*$/, "")));
    }
    /* p.109 step 9: "Characters start with 1d3+1 pieces of armor, as long as
     * they have whatever training the armor requires (if any)." The wizard
     * rolls the count and parks it here; each claim decrements it. */
    freeArmor() { return TBE.num(this.actor.flags?.["the-broken-empires"]?.freeArmor, 0); }
    /* Which training-gated armors this character may actually take. Armor
     * Training is a levelled Talent; an Ogre's single allowed rank covers
     * Bone only (Ch.5 racial restriction). */
    trainedArmor() {
      const has = [...this.ownedTalentNames()].some((n) => /^armor training/.test(n));
      if (!has) return new Set();
      if ((this.actor.system?.race || "") === "Ogre") return new Set(["Bone"]);
      return new Set(["Reinforced Leather", "Mail", "Bone", "Scale", "Plate"]);
    }

    /* Total Bulk of every worn armor piece, and the Initiative penalty it
     * costs (p.141: Bulk / 3, rounded up). Read from the actor, which is where
     * the system derives it and where the combat tracker's initiative formula
     * gets it, so this number and the sheet's can never disagree. */
    armorPenalty() {
      return TBE.armorInit(this.actor);
    }

    async _renderInner() { return $(this._html()); }

    _tabsHtml() {
      return '<div style="display:flex;flex-wrap:wrap;gap:2px;margin-bottom:8px;font-size:11px">' +
        this.TABS.map((t) => '<div data-tab="' + t.key + '" style="flex:1 1 auto;min-width:74px;text-align:center;padding:3px 2px;border-radius:3px;cursor:pointer;' +
          (this.tab === t.key ? "background:#7a6a4f;color:#fff;font-weight:bold" : "background:#eee;color:#555") +
          '">' + t.label + "</div>").join("") + "</div>";
    }

    _html() {
      const ap = this.armorPenalty();
      const head = '<div style="margin-bottom:6px;font-size:12px"><b>' + esc(this.actor.name) + "</b> &middot; " +
        '<b>' + this.silver() + " sp</b> &middot; XP " + this.xp() +
        " &middot; armor Bulk " + ap.bulk + " (Initiative " + (ap.penalty ? "-" + ap.penalty : "0") + ")" +
        " &middot; Status " + TBE.num(this.actor.system?.status, 0) + "</div>";
      return '<form autocomplete="off" style="font-size:13px;padding:4px">' + this._tabsHtml() + head +
        '<div class="tbe-finish-body" style="max-height:470px;overflow-y:auto;padding-right:4px">' +
        this["_tab_" + this.tab].call(this) + "</div>" +
        '<div style="display:flex;justify-content:flex-end;margin-top:8px;border-top:1px solid #7a6a4f;padding-top:6px">' +
        '<button type="button" data-action="close">Done</button></div></form>';
    }

    /* ---- Summary: what the Wizard already decided, still visible here ---
     * Character Wizard writes race/career/culture straight to actor fields
     * (always), and everything else -- skill-point math, racial/ability/
     * culture/Rounding Out bonuses applied, silver breakdown -- only ever
     * existed in that one chat card at the end of chargen. Scroll past it
     * once and it's gone; asking a player to dig through chat history to
     * remember why their Endurance is what it is is exactly the kind of
     * "player doesn't have the information when needed" gap this tab
     * closes. commit() now stashes the same data as a flag so it survives. */
    _tab_summary() {
      const A = this.actor;
      const L = A.flags?.["the-broken-empires"]?.chargenLedger;
      const race = A.system?.race || "", career = A.system?.career || "", culture = A.system?.culture || "";
      const traits = (A.system?.personalityTraits || []).join(", ");
      const head = '<div style="font-size:12px;margin-bottom:6px"><b>' + esc(race || "(no race set)") + " " + esc(career) + "</b>" +
        (culture ? " &middot; " + esc(culture) : "") + "</div>";
      if (!L) {
        return head + '<div style="font-size:11px;opacity:.75">No character-creation ledger stashed on this actor ' +
          "(built before this version, or by hand) &mdash; race/career/culture above still come straight off the sheet. " +
          "Personality: " + (traits || "none set") + ".</div>";
      }
      const section = (label, items) => items && items.length
        ? '<div style="margin-top:6px"><b style="font-size:11px">' + label + ':</b> ' +
          '<span style="font-size:11px;opacity:.85">' + items.map(esc).join(", ") + "</span></div>"
        : "";
      return head +
        (L.concept ? '<div style="font-size:12px;margin-bottom:4px"><i>' + esc(L.concept) + "</i></div>" : "") +
        '<div style="font-size:12px">Toughness <b>' + L.stats.toughness + "</b>, Death Threshold <b>" + L.stats.dt +
        "</b>, Resolve <b>" + L.stats.resolveMax + "</b>, Initiative <b>" + (L.stats.initiative >= 0 ? "+" : "") + L.stats.initiative + "</b></div>" +
        '<div style="font-size:12px;margin-top:2px">Personality: ' + esc(traits || "none set") + "</div>" +
        section("Talents granted", L.talents) +
        '<div style="margin-top:6px;font-size:12px">Starting silver: <b>' + L.silver.total + " sp</b></div>" +
        '<div style="font-size:10px;opacity:.6">' + esc(L.silver.parts.join(" + ")) + "</div>" +
        '<details style="margin-top:8px;font-size:11px;opacity:.85"><summary style="cursor:pointer">Full skill-point math (racial / Ability Score / Cultural Background / Rounding Out)</summary>' +
        section("Career skill points", L.skillPoints) +
        section("Racial modifiers", L.racial) +
        section("Ability Scores", L.ability) +
        section("Cultural Background", L.cultureApplied) +
        section("Rounding Out", L.roundingOut) +
        "</details>" +
        (L.stillToDecide && L.stillToDecide.length
          ? '<div style="margin-top:8px;border-top:1px solid #7a6a4f;padding-top:6px;font-size:11px"><b>Still to decide (' + L.stillToDecide.length + ")</b><ul>" +
            L.stillToDecide.map((n) => "<li>" + esc(n) + "</li>").join("") + "</ul></div>"
          : "");
    }

    /* ---- Equip (Ch.7 step 9, Ch.9) -------------------------------------- */
    _tab_equip() {
      const list = EQUIP[this.buy.kind + "s"] || EQUIP[this.buy.kind] || [];
      const pool = this.buy.kind === "armor" ? EQUIP.armor : this.buy.kind === "shield" ? EQUIP.shields : EQUIP.weapons;
      const sel = pool.find((e) => e.name === this.buy.pick) || pool[0];
      const owned = ["weapon", "shield", "armor"].map((k) => {
        const rows = this.items(k);
        if (!rows.length) return "";
        return '<div style="font-size:11px;margin-top:4px;line-height:1.5"><b>' + k + "s</b>: " +
          rows.map((i) => esc(i.name) +
            (k === "armor" ? " <span style='opacity:.7'>Bulk " + TBE.num(i.system?.bulk, 0) + "</span>" : "") +
            ' <a data-action="sell" data-item-id="' + i.id + '" style="cursor:pointer;color:#8b1a1a">remove</a>').join(", ") + "</div>";
      }).join("");

      const free = this.freeArmor();
      const trained = this.trainedArmor();
      const needsTraining = sel && sel.kind === "armor" && String(sel.training || "-").toUpperCase() === "Y";
      const untrained = needsTraining && !trained.has(sel.name);
      const canTakeFree = sel && sel.kind === "armor" && free > 0 && !untrained;
      return '<div style="font-size:12px;margin-bottom:6px">Ch.7 step 9. You start with a dagger, 1d3+1 pieces of armor ' +
        "(training permitting), and 2d4&times;50 sp on top of career and culture silver &mdash; all already rolled by the wizard. " +
        "Spend it here; the price comes off your silver and the Initiative penalty updates as you go.</div>" +
        (free > 0
          ? '<div style="margin-bottom:6px;padding:5px;border:1px solid #7a6a4f;border-radius:4px;background:rgba(120,100,60,0.10);font-size:12px">' +
            "<b>" + free + " free armor piece" + (free === 1 ? "" : "s") + " still to claim.</b> " +
            "The book gives these, they do not cost silver. Pick a type and a location below, then Take it." +
            (trained.size ? "" : ' <span style="opacity:.8">Without Armor Training you may take Padding, Quilt or Leather.</span>') +
            "</div>"
          : "") +
        '<label style="display:inline-block;width:32%">Type: <select data-buy="kind" style="width:100%">' +
        ["weapon", "shield", "armor"].map((k) => '<option value="' + k + '"' + (this.buy.kind === k ? " selected" : "") + ">" + k + "</option>").join("") +
        "</select></label>" +
        '<label style="display:inline-block;width:44%">Item: <select data-buy="pick" style="width:100%">' +
        pool.map((e) => '<option value="' + esc(e.name) + '"' + (sel && sel.name === e.name ? " selected" : "") + ">" +
          esc(e.name) + " &mdash; " + e.sp + " sp</option>").join("") + "</select></label>" +
        (this.buy.kind === "armor"
          ? '<label style="display:inline-block;width:22%">Location: <select data-buy="loc" style="width:100%">' +
            LOCATIONS.map(([id, lbl]) => '<option value="' + id + '"' + (this.buy.loc === id ? " selected" : "") + ">" + lbl + "</option>").join("") +
            "</select></label>"
          : "") +
        (sel ? '<div style="font-size:11px;opacity:.85;margin-top:4px">' + esc(sel.cat) +
          (sel.ap != null ? " &middot; AP " + sel.ap : "") + (sel.bulk != null ? " &middot; Bulk " + sel.bulk : "") +
          (sel.dmg != null ? " &middot; Dmg " + sel.dmg : "") + (sel.enc != null ? " &middot; ENC " + sel.enc : "") +
          (sel.notes ? "<br>" + esc(sel.notes) : "") + "</div>" : "") +
        (untrained ? '<div style="font-size:11px;color:#c0392b;margin-top:4px">' + esc(sel.name) +
          " requires Armor Training" + ((this.actor.system?.race || "") === "Ogre" ? " (an Ogre's single rank covers Bone only)" : "") +
          ", so it cannot be one of your free pieces. You may still buy it; untrained heavier armor on Body or Arms costs you Combat Maneuvers (Ch.4).</div>" : "") +
        '<div style="margin-top:6px">' +
        (canTakeFree ? '<button type="button" data-action="take-free" style="font-weight:bold">Take free (' + free + " left)</button> " : "") +
        /* Buying one dagger at a time is fine; buying six javelins one at a
         * time is the kind of busywork this screen exists to remove. Armor is
         * excluded on purpose: each piece covers a specific location, so a
         * quantity would be ambiguous. */
        (this.buy.kind === "armor" ? "" :
          '<label style="display:inline-block;font-size:12px;margin-right:6px">Quantity: ' +
          '<input type="number" min="1" max="20" data-buy="qty" value="' + Math.max(1, TBE.num(this.buy.qty, 1)) + '" style="width:44px"></label>') +
        '<button type="button" data-action="buy">Buy' +
        (this.buy.kind !== "armor" && TBE.num(this.buy.qty, 1) > 1
          ? " " + TBE.num(this.buy.qty, 1) + " for " + ((sel ? sel.sp : 0) * TBE.num(this.buy.qty, 1))
          : " for " + (sel ? sel.sp : 0)) + ' sp</button>' +
        ' <span style="font-size:11px;opacity:.75">' + this.silver() + " sp available" +
        (sel && sel.sp > this.silver() ? ' &mdash; <span style="color:#c0392b">not enough</span>' : "") + "</span></div>" +
        (owned ? '<div style="margin-top:8px;border-top:1px solid #7a6a4f;padding-top:6px">' + owned + "</div>" : "") +
        '<div style="margin-top:8px;border-top:1px solid #7a6a4f;padding-top:6px;font-size:12px"><b>Supply Dice</b> (p.109 step 6: all four start at d12)' +
        '<div style="font-size:11px;opacity:.8">Gear ' + (this.actor.system?.supply?.gear ?? "-") +
        ", Ammo " + (this.actor.system?.supply?.ammo ?? "-") + ", Rations " + (this.actor.system?.supply?.rations ?? "-") +
        ", Medical " + (this.actor.system?.supply?.medical ?? "-") + " &mdash; edit on the sheet.</div></div>";
    }

    /* How many free Talent picks this career/race grants, and what they can
     * be spent on (chargen.py's CAREER_TALENT_PICKS, book-verified). Purely
     * informational -- the player still ticks whatever they want below, this
     * just answers "how many do I get" instead of leaving it unstated. */
    _freeTalentPicks() {
      const careerRec = (CHARGEN.careers || []).find((c) => c.name === (this.actor.system?.career || "")) || null;
      const tp = careerRec?.talentPicks || { auto: [], picks: [] };
      const lines = (tp.picks || []).map((p) => {
        if (p.note) return "Pick 1: " + p.note;
        if (p.named && p.named.length) return "Pick " + p.count + ": " + p.named.join(" or ");
        if (p.categories && p.categories.length) return "Pick " + p.count + " Talent" + (p.count > 1 ? "s" : "") + " from " + p.categories.join(", ");
        return "Pick " + p.count;
      });
      const count = (tp.picks || []).reduce((n, p) => n + p.count, 0);
      return { count, lines };
    }

    /* ---- Talents (Ch.4), inline rather than a hand-off ------------------ */
    _tab_talents() {
      const owned = this.ownedTalentNames();
      const race = this.actor.system?.race || "";
      /* Same rules the standalone TBE: Talents macro enforces (p.161), from
       * one shared place (TBE.talentEligibility in _lib.js) so a Talent
       * cannot be taken here that could not be taken there, and a future fix
       * only has to happen once. */
      const { blockedReason } = TBE.talentEligibility(CATALOGUE, owned, race, CHARGEN.races || []);
      const cats = [...new Set(CATALOGUE.map((t) => t.category))];
      const rows = cats.map((cat) => {
        const inCat = CATALOGUE.map((t, i) => ({ t, i })).filter((x) => x.t.category === cat);
        return '<div style="font-weight:bold;margin-top:6px;border-bottom:1px solid #7a6a4f">' + cat + "</div>" +
          inCat.map(({ t, i }) => {
            const b = blockedReason(t);
            const desc = String(t.desc || "").replace(/<[^>]*>/g, "");
            const checked = this.talentChecked.has(i);
            return '<label style="display:block;opacity:' + (b ? ".45" : "1") + '" title="' + esc(desc).slice(0, 400) + '">' +
              '<input type="checkbox" data-talent="' + i + '"' + (b ? " disabled" : "") + (checked ? " checked" : "") + "> " +
              (t.sub ? "&#8627; " : "") + "<b>" + esc(t.name) + "</b> " +
              '<span style="font-size:11px;opacity:.7">' + (b || (TBE.num(t.xp, 5) + " XP")) + "</span>" +
              '<div style="font-size:10px;opacity:.6;margin-left:18px;line-height:1.25">' + esc(desc).slice(0, 130) +
              (desc.length > 130 ? "&hellip;" : "") + "</div></label>";
          }).join("");
      }).join("");
      const free = this._freeTalentPicks();
      return '<div style="font-size:12px;margin-bottom:4px">Race, Career, Ability Scores and Rounding Out grant Talents for free; ' +
        "tick those here and leave XP unspent. Buying extra ones later costs each Talent's own price.</div>" +
        (free.count
          ? '<div style="margin-bottom:6px;padding:5px;border:1px solid #7a6a4f;border-radius:4px;background:rgba(120,100,60,0.10);font-size:11px">' +
            "<b>" + free.count + " free career pick" + (free.count > 1 ? "s" : "") + "</b>, ticked so far this session: <b><span data-talent-ticked>" + this.talentChecked.size + "</span></b>" +
            (free.lines.length ? "<ul style='margin:3px 0 0 16px'>" + free.lines.map((l) => "<li>" + esc(l) + "</li>").join("") + "</ul>" : "") +
            "</div>"
          : "") +
        '<label style="display:block"><input type="checkbox" data-talent-xp' + (this.talentSpendXp ? " checked" : "") +
        "> Spend XP for these (off for the free chargen/career picks above)</label>" +
        '<label style="display:block">Applies to (weapon, skill or location, for a Talent that asks): ' +
        '<input type="text" data-talent-spec value="' + esc(this.talentSpec || "") + '" style="width:100%"></label>' +
        '<div style="margin:6px 0;max-height:300px;overflow:auto;border:1px solid #7a6a4f;border-radius:4px;padding:4px">' + rows + "</div>" +
        '<button type="button" data-action="add-talents">Add ticked Talents</button>';
    }

    /* ---- blank -wise / Language slots ----------------------------------- */
    _tab_wises() {
      const blanks = this.skills().filter((i) => /^(Wise: subject|Bind: name it|Career wise\/Language|Strand, name it|Cultural extra Language)/i.test(i.name));
      const langs = this.skills().filter((i) => i.system?.group === "Language");
      return '<div style="font-size:12px;margin-bottom:6px">Chargen creates unnamed slots because the book leaves the subject to you ' +
        "(p.80: custom -wises and Languages start at zero and are filled in later). Name them here, or delete the ones you do not want.</div>" +
        '<div style="font-size:12px"><b>Languages you were granted</b></div>' +
        (langs.length
          ? '<div style="font-size:11px;opacity:.85;margin-bottom:6px">' +
            langs.map((i) => esc(i.name) + " " + TBE.num(i.system?.value, 0)).join(", ") + "</div>"
          : '<div style="font-size:11px;opacity:.7;margin-bottom:6px">none yet</div>') +
        '<div style="font-size:12px"><b>Unnamed slots</b></div>' +
        (blanks.length
          ? blanks.map((i) => '<div style="margin-top:3px">' +
            '<input type="text" data-rename="' + i.id + '" value="' + esc(i.name) + '" style="width:62%">' +
            ' <span style="font-size:11px;opacity:.7">' + esc(i.system?.group || "") + " " + TBE.num(i.system?.value, 0) + "</span>" +
            ' <a data-action="drop-skill" data-item-id="' + i.id + '" style="cursor:pointer;color:#8b1a1a;font-size:11px">delete</a></div>').join("") +
            '<div style="margin-top:6px"><button type="button" data-action="rename-slots">Save names</button></div>'
          : '<div style="font-size:11px;opacity:.7">none left</div>') +
        '<div style="margin-top:8px;border-top:1px solid #7a6a4f;padding-top:6px;font-size:12px"><b>Add another</b></div>' +
        '<label style="display:inline-block;width:30%">Group: <select data-newwise="group" style="width:100%">' +
        ["Wise", "Language"].map((g) => '<option value="' + g + '"' + (this.newWise.group === g ? " selected" : "") + ">" + g + "</option>").join("") +
        "</select></label>" +
        '<label style="display:inline-block;width:46%">Name: <input type="text" data-newwise="name" value="' + esc(this.newWise.name) + '" style="width:100%"></label>' +
        ' <button type="button" data-action="add-wise">Add at 20</button>';
    }

    /* ---- Goals (Ch.6 + the Quick Method) -------------------------------- */
    _tab_goals() {
      const g = this.goal;
      const built = (g.action || g.obstacle || g.want)
        ? "I will " + (g.action || "[take action]") + " to overcome " + (g.obstacle || "[obstacle]") +
          " so that I can " + (g.want || "[desire]") + "."
        : "";
      const existing = (this.actor.system?.goals ?? []);
      return '<div style="font-size:12px;margin-bottom:6px">A goal only earns XP if it makes you roll dice against something that ' +
        "pushes back. Build one from the book's four-step method rather than staring at a blank box.</div>" +
        '<label style="display:block">1. What do I want? <span style="font-size:11px;opacity:.7">a person, an item, a truth, a position, a fear to resolve</span>' +
        '<input type="text" data-goal="want" value="' + esc(g.want) + '" placeholder="chart the safest route through the Draithwood" style="width:100%"></label>' +
        '<label style="display:block">2. What is stopping me? <span style="font-size:11px;opacity:.7">tie the obstacle directly to that desire</span>' +
        '<input type="text" data-goal="obstacle" value="' + esc(g.obstacle) + '" placeholder="the forest is unmapped, haunted, and full of dangers no one understands" style="width:100%"></label>' +
        '<label style="display:block">3. What will I do about it? <span style="font-size:11px;opacity:.7">the action clause: skills, danger, dice</span>' +
        '<input type="text" data-goal="action" value="' + esc(g.action) + '" placeholder="use Track to find paths and other skills to learn what haunts it" style="width:100%"></label>' +
        '<label style="display:inline-block;width:40%">Type: <select data-goal="kind" style="width:100%">' +
        '<option value="individual"' + (g.kind === "individual" ? " selected" : "") + ">Individual</option>" +
        '<option value="shared"' + (g.kind === "shared" ? " selected" : "") + ">Shared with the party</option></select></label>" +
        '<div style="margin-top:6px;padding:6px;border:1px solid #7a6a4f;border-radius:4px;background:rgba(120,100,60,0.08)">' +
          '<b>4. The goal:</b><br><span class="tbe-goal-preview">' + esc(built || this._goalSentence()) + "</span></div>" +
        '<div style="margin-top:6px"><button type="button" data-action="add-goal">Add this goal</button></div>' +
        (existing.length
          ? '<div style="margin-top:8px;border-top:1px solid #7a6a4f;padding-top:6px"><b style="font-size:12px">Active goals (' + existing.length + ")</b>" +
            existing.map((x, i) => '<div style="font-size:11px;margin-top:3px">' +
              '<span style="opacity:.7">[' + esc(x.kind || "individual") + "]</span> " + esc(x.text) +
              ' <a data-action="drop-goal" data-goal-idx="' + i + '" style="cursor:pointer;color:#8b1a1a">remove</a></div>').join("") +
            (existing.length < 3 ? '<div style="font-size:11px;opacity:.75;margin-top:4px">The book suggests keeping at least three: without goals there is no XP.</div>' : "") +
            (existing.length > 5 ? '<div style="font-size:11px;color:#c0392b;margin-top:4px">More than five active goals pulls you in too many directions (Ch.6).</div>' : "") +
            "</div>"
          : "") +
        '<div style="margin-top:8px;font-size:11px;opacity:.8;border-top:1px solid #7a6a4f;padding-top:6px">' +
        "Keep three to five active. A goal should take at least a full session; one solved by a single roll is too small. " +
        "Shared goals explain why the party travels together, and pay 2 XP to <i>each</i> member who shared it. " +
        "Pursuing goals against real obstacles pays 3 XP a session, capped at 3 however many you worked on. " +
        "It is fine to leave goals blank and discover them in play.</div>";
    }

    /* ---- Shared History (p.94) ------------------------------------------ */
    _tab_shared() {
      return '<div style="font-size:12px;margin-bottom:6px">p.94, optional. You and another PC share a piece of history: both of you ' +
        "add +5 to a skill that came out of it. Left to here because it needs the other character to exist.</div>" +
        '<label style="display:block">With: <input type="text" data-shared="with" value="' + esc(this.shared.with) + '" placeholder="the other character" style="width:100%"></label>' +
        '<label style="display:block">Skill (+5 to you): <select data-shared="skill" style="width:100%"><option value="">(choose)</option>' +
        SKILL_ALL.map((s) => '<option value="' + s + '"' + (this.shared.skill === s ? " selected" : "") + ">" + s + "</option>").join("") +
        "</select></label>" +
        '<div style="font-size:11px;opacity:.75;margin-top:4px">If the skill is a -wise or Language you do not have yet, it is created at 20 and then gets the +5 (p.94).</div>' +
        '<div style="margin-top:6px"><button type="button" data-action="add-shared">Apply +5</button></div>';
    }

    /* ---- Status (optional rule, Ch.7 step 12) --------------------------- */
    _tab_status() {
      const cur = TBE.num(this.actor.system?.status, 0);
      return '<div style="font-size:12px;margin-bottom:6px">Optional. Status starts at 0 and is granted by choices you already made: ' +
        "a Life Event that offered +1, the Rounding Out bonus, or swapping a Previous Career Talent for +2 (p.102). " +
        "Those are applied automatically, so this tab exists only to adjust it by hand.</div>" +
        '<label style="display:block">Status: <input type="number" data-status value="' + cur + '" style="width:90px"> ' +
        '<button type="button" data-action="set-status">Set</button></label>';
    }

    /* ---- listeners ------------------------------------------------------ */
    _read(root) {
      const g = (sel) => root.querySelector(sel);
      root.querySelectorAll("[data-buy]").forEach((el) => { this.buy[el.dataset.buy] = el.value; });
      root.querySelectorAll("[data-goal]").forEach((el) => { this.goal[el.dataset.goal] = el.value; });
      root.querySelectorAll("[data-shared]").forEach((el) => { this.shared[el.dataset.shared] = el.value; });
      root.querySelectorAll("[data-newwise]").forEach((el) => { this.newWise[el.dataset.newwise] = el.value; });
      const xpBox = g("[data-talent-xp]"); if (xpBox) this.talentSpendXp = !!xpBox.checked;
      const spec = g("[data-talent-spec]"); if (spec) this.talentSpec = spec.value;
      const st = g("[data-status]"); if (st) this.statusInput = TBE.num(st.value, 0);
    }

    activateListeners(html) {
      super.activateListeners(html);
      const root = (html[0] ?? html);

      root.querySelectorAll("[data-tab]").forEach((el) => {
        el.addEventListener("click", () => { this._read(root); this.tab = el.dataset.tab; this.render(true); });
      });
      /* Selects and checkboxes change what the rest of the tab shows, so they
       * re-render at once. Text fields are excluded: re-rendering mid-keystroke
       * would steal focus. [data-talent] checkboxes are ALSO excluded here on
       * purpose -- see the listener just below. */
      root.querySelectorAll("select, input[type=checkbox]:not([data-talent])").forEach((el) => {
        el.addEventListener("change", () => { this._read(root); this.render(true); });
      });
      /* Each Talent checkbox's own tick state has to survive being read here,
       * which a full this.render(true) does not do by itself: _tab_talents()
       * rebuilds its HTML from scratch and only prints a "checked" attribute
       * for indices already in this.talentChecked. Update that set directly
       * and patch only the live counter text, instead of re-rendering (a
       * re-render would still work now that "checked" is state-driven, but
       * there is no reason to pay for one on every single tick). */
      root.querySelectorAll("[data-talent]").forEach((el) => {
        el.addEventListener("change", () => {
          const i = Number(el.dataset.talent);
          if (el.checked) this.talentChecked.add(i); else this.talentChecked.delete(i);
          const counter = root.querySelector("[data-talent-ticked]");
          if (counter) counter.textContent = String(this.talentChecked.size);
        });
      });
      /* The purchase quantity re-renders too, on blur: the Buy button prints
       * what the whole order costs, and a button that lies about the price
       * until after you press it is the reason this screen exists. */
      root.querySelectorAll('[data-buy="qty"]').forEach((el) => {
        el.addEventListener("change", () => { this._read(root); this.render(true); });
      });
      /* The Goals preview sentence is the exception: it is worth updating live,
       * and it is rewritten in place rather than via a re-render. */
      root.querySelectorAll("[data-goal]").forEach((el) => {
        el.addEventListener("input", () => {
          this._read(root);
          const box = root.querySelector(".tbe-goal-preview");
          if (box) box.textContent = this._goalSentence();
        });
      });

      root.querySelectorAll("[data-action]").forEach((btn) => {
        btn.addEventListener("click", async (ev) => {
          const action = ev.currentTarget.dataset.action;
          this._read(root);
          try { await this._act(action, ev.currentTarget, root); }
          catch (err) { console.error("TBE | finish-character action failed", err); ui.notifications?.error("TBE: that step failed, see console (F12)."); }
        });
      });
    }

    _goalSentence() {
      const g = this.goal;
      return "I will " + (g.action || "[take action]") + " to overcome " + (g.obstacle || "[obstacle]") +
        " so that I can " + (g.want || "[desire]") + ".";
    }

    async _act(action, el, root) {
      const A = this.actor;
      if (action === "close") { this.close(); return; }

      if (action === "buy" || action === "take-free") {
        const free = action === "take-free";
        const pool = this.buy.kind === "armor" ? EQUIP.armor : this.buy.kind === "shield" ? EQUIP.shields : EQUIP.weapons;
        const sel = pool.find((e) => e.name === this.buy.pick) || pool[0];
        if (!sel) return;
        if (free) {
          if (sel.kind !== "armor" || this.freeArmor() <= 0) { ui.notifications?.warn("TBE: no free armor pieces left."); return; }
          if (String(sel.training || "-").toUpperCase() === "Y" && !this.trainedArmor().has(sel.name)) {
            ui.notifications?.warn("TBE: " + sel.name + " needs Armor Training, so it cannot be a free piece.");
            return;
          }
        }
        const qty = free || sel.kind === "armor" ? 1 : Math.max(1, Math.min(20, TBE.num(this.buy.qty, 1)));
        const bill = sel.sp * qty;
        if (!free && bill > this.silver()) {
          ui.notifications?.warn("TBE: " + qty + " \u00d7 " + sel.name + " costs " + bill + " sp and " +
            A.name + " has " + this.silver() + ".");
          return;
        }
        const system = { description: sel.desc };
        if (sel.kind === "weapon") Object.assign(system, {
          dmg: TBE.num(sel.dmg, 1), nl: !!sel.nl, cl: TBE.num(sel.cl, 3), cs: TBE.num(sel.cs, 3),
          dis: TBE.num(sel.dis, 4), t: TBE.num(sel.t, 5), skillName: sel.skillName || "",
          ranged: !!sel.ranged, enc: TBE.num(sel.enc, 1)
        });
        else if (sel.kind === "shield") Object.assign(system, { ap: TBE.num(sel.ap, 0), enc: TBE.num(sel.enc, 1), shb: sel.shb ?? null });
        else {
          /* One armor piece protects only the locations checked on it (p.140,
           * armor may not be layered), so buying is per location. */
          const locs = {}; LOCATIONS.forEach(([id]) => { locs[id] = id === this.buy.loc; });
          Object.assign(system, { ap: TBE.num(sel.ap, 0), bulk: TBE.num(sel.bulk, 0), locations: locs, equipped: true });
        }
        const one = {
          name: sel.name + (sel.kind === "armor" ? " (" + (LOCATIONS.find(([id]) => id === this.buy.loc) || [, ""])[1] + ")" : ""),
          type: sel.kind, img: sel.kind === "weapon" ? "icons/svg/sword.svg" : "icons/svg/shield.svg", system
        };
        await A.createEmbeddedDocuments("Item", Array.from({ length: qty }, () => TBE.clone(one)));
        if (free) await A.update({ "flags.the-broken-empires.freeArmor": this.freeArmor() - 1 });
        else await A.update({ "system.silver": this.silver() - bill });
        const ap = this.armorPenalty();
        await TBE.say(TBE.card("Finish Character", "<div><b>" + A.name + "</b> " +
          (free ? "takes <b>" + sel.name + "</b> as a free starting piece (" + this.freeArmor() + " left)."
                : "buys " + (qty > 1 ? "<b>" + qty + " \u00d7 " + sel.name + "</b>" : "<b>" + sel.name + "</b>") +
                  " for " + bill + " sp (" + this.silver() + " left).") + "</div>" +
          (sel.kind === "armor" ? "<div>Worn Bulk " + ap.bulk + " &rarr; Initiative penalty -" + ap.penalty + ".</div>" : "")));
        this.render(true); return;
      }

      if (action === "sell" || action === "drop-skill") {
        await A.deleteEmbeddedDocuments("Item", [el.dataset.itemId]);
        this.render(true); return;
      }

      if (action === "add-talents") {
        const owned = this.ownedTalentNames();
        const picked = [];
        root.querySelectorAll("[data-talent]:checked").forEach((cb) => {
          const t = CATALOGUE[Number(cb.dataset.talent)];
          if (t) picked.push(t);
        });
        if (!picked.length) { ui.notifications?.info("TBE: no Talents ticked."); return; }
        const cost = this.talentSpendXp ? picked.reduce((n, t) => n + TBE.num(t.xp, 5), 0) : 0;
        if (cost > this.xp()) {
          await TBE.say(TBE.card("Finish Character", "<div>Not enough XP: " + picked.map((t) => t.name + " " + TBE.num(t.xp, 5)).join(", ") +
            " = <b>" + cost + "</b>, available " + this.xp() + ".</div>"));
          return;
        }
        const spec = (this.talentSpec || "").trim();
        const payload = [];
        for (const t of picked) {
          const perX = t.rank === "per-skill";
          const existing = this.items("talent").find((i) => i.name.toLowerCase() === t.name.toLowerCase());
          if (existing && !perX && t.rank !== "once") {
            await existing.update({ "system.ranks": TBE.num(existing.system?.ranks, 1) + 1 });
            continue;
          }
          payload.push({
            name: t.name + (perX && spec ? " (" + spec + ")" : ""), type: "talent", img: "icons/svg/upgrade.svg",
            system: {
              category: t.category, requirements: t.requires || "", ranks: 1, maxRanks: t.rank,
              specialization: spec, sub: !!t.sub, description: "<p>" + t.desc + "</p>"
            },
            /* Stat Talents carry a transfer:true ActiveEffect so the number
             * they promise actually moves. Scaled by rank for the repeatable
             * ones, so Tough x3 is +3 Toughness rather than +1. */
            effects: (t.effects || []).map((e) => Object.assign({}, e, {
              changes: (e.changes || []).map((c) => Object.assign({}, c))
            }))
          });
        }
        /* The SAVVY Talent ("Pick one skill and mark an S next to it") names a
         * skill in the specialization box; mark it, or the Talent does nothing
         * and Advancement's +1-per-improvement never fires for it. */
        for (const t of picked) {
          if (!/^savvy$/i.test(t.name.trim())) continue;
          const target = (spec || "").trim();
          const skill = target && A.items.find((i) => i.type === "skill" && i.name.toLowerCase() === target.toLowerCase());
          if (skill) await skill.update({ "system.savvy": true });
          else ui.notifications?.warn("TBE: name the skill in \"Applies to\" so Savvy can mark it.");
        }
        if (payload.length) await A.createEmbeddedDocuments("Item", payload);
        if (cost) await A.update({ "system.experience.available": this.xp() - cost });
        this.talentChecked.clear();
        await TBE.say(TBE.card("Finish Character", "<div><b>" + A.name + "</b> gains: " + picked.map((t) => t.name).join(", ") + "</div>" +
          (cost ? "<div>" + cost + " XP spent.</div>" : "<div style='font-size:11px;opacity:.7'>No XP charged (chargen grants).</div>")));
        this.render(true); return;
      }

      if (action === "rename-slots") {
        const updates = [];
        root.querySelectorAll("[data-rename]").forEach((inp) => {
          const id = inp.dataset.rename, val = (inp.value || "").trim();
          const item = A.items.get(id);
          if (item && val && val !== item.name) updates.push({ _id: id, name: val });
        });
        if (updates.length) await A.updateEmbeddedDocuments("Item", updates);
        ui.notifications?.info("TBE: renamed " + updates.length + " slot(s).");
        this.render(true); return;
      }

      if (action === "add-wise") {
        const nm = (this.newWise.name || "").trim();
        if (!nm) { ui.notifications?.warn("TBE: name it first."); return; }
        await A.createEmbeddedDocuments("Item", [{
          name: nm, type: "skill", img: "icons/svg/book.svg",
          system: { group: this.newWise.group === "Language" ? "Language" : "Wise", value: 20, fighting: false, expertise: 0, savvy: false }
        }]);
        this.newWise.name = "";
        this.render(true); return;
      }

      if (action === "add-goal") {
        const text = this._goalSentence();
        if (!this.goal.want && !this.goal.obstacle && !this.goal.action) { ui.notifications?.warn("TBE: fill in at least one part first."); return; }
        const goals = (A.system?.goals ?? []).concat([{ text, kind: this.goal.kind, done: false }]);
        await A.update({ "system.goals": goals });
        this.goal = { want: "", obstacle: "", action: "", kind: this.goal.kind };
        await TBE.say(TBE.card("Finish Character", "<div><b>" + A.name + "</b> takes a new " + esc(this.goal.kind) + " goal:</div><div>" + esc(text) + "</div>"));
        this.render(true); return;
      }

      if (action === "drop-goal") {
        const goals = (A.system?.goals ?? []).slice();
        goals.splice(Number(el.dataset.goalIdx), 1);
        await A.update({ "system.goals": goals });
        this.render(true); return;
      }

      if (action === "add-shared") {
        const nm = this.shared.skill;
        if (!nm) { ui.notifications?.warn("TBE: choose a skill first."); return; }
        let item = this.skills().find((i) => i.name === nm);
        if (!item) {
          /* p.94: a -wise or Language that does not exist yet starts at 20 and
           * then takes the +5. */
          const created = await A.createEmbeddedDocuments("Item", [{
            name: nm, type: "skill", img: "icons/svg/book.svg",
            system: { group: "Wise", value: 20, fighting: false, expertise: 0, savvy: false }
          }]);
          item = created[0];
        }
        const before = TBE.num(item.system?.value, 0);
        await A.updateEmbeddedDocuments("Item", [{ _id: item.id, "system.value": Math.min(70, before + 5) }]);
        await TBE.say(TBE.card("Finish Character", "<div>Shared History with <b>" + esc(this.shared.with || "another PC") +
          "</b>: " + esc(nm) + " " + before + " &rarr; " + Math.min(70, before + 5) + ".</div>"));
        this.render(true); return;
      }

      if (action === "set-status") {
        await A.update({ "system.status": TBE.num(this.statusInput, 0) });
        this.render(true); return;
      }
    }
  }

  new TBEFinishCharacter(me).render(true);
}
