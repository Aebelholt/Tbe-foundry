import {
  onManageActiveEffect,
  prepareActiveEffectCategories,
} from '../helpers/effects.mjs';
import { TBE } from '../helpers/config.mjs';
import * as RULES from '../rules/resolution.mjs';
import * as VISIBILITY from '../rules/visibility.mjs';
import * as PERMISSION from '../rules/permission.mjs';
import * as COMBAT from '../rules/combat.mjs';
import * as MEMORY from '../helpers/memory.mjs';
import * as CONTROLS from '../helpers/roll-controls.mjs';
import * as RTRACK from '../rules/resolve-track.mjs';

/**
 * The TBE actor sheet. Combat, wounds, casting, and every other action stay
 * on the macro pack (TBE: Attack, TBE: Wounds & Recovery, etc.) by design —
 * this sheet's job is to be a real, honest data container: every field a
 * macro reads or writes is visible and editable here, not hidden in flags.
 * @extends {ActorSheet}
 */
export class TheBrokenEmpiresActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['the-broken-empires', 'sheet', 'actor'],
      width: 640,
      height: 700,
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'overview',
        },
      ],
    });
  }

  /** A "Create" button in a character sheet's header, for its owner: opens
   *  the character creation window (chargen/creator.mjs, v0.52.0). */
  _getHeaderButtons() {
    const buttons = super._getHeaderButtons();
    if (this.actor.type === "character" && this.actor.isOwner && game.thebrokenempires?.chargen?.open) {
      buttons.unshift({ label: "Create", class: "tbe-create-character", icon: "fas fa-user-plus",
        onclick: () => game.thebrokenempires.chargen.open(this.actor) });
    }
    return buttons;
  }

  /** @override */
  get template() {
    return `systems/the-broken-empires/templates/actor/actor-${this.actor.type}-sheet.hbs`;
  }

  /**
   * Which Talents are currently feeding each tracked stat, so a number that
   * moved has a visible reason. Stat Talents apply through transfer:true
   * ActiveEffects (v0.13.0); before this the sheet showed a changed Toughness
   * with nothing to explain it, which is exactly the "goes nowhere" problem
   * from the other direction: the effect lands but the player cannot see why.
   */
  _prepareStatSources() {
    const out = {};
    for (const item of this.actor.items) {
      if (item.type !== "talent") continue;
      for (const eff of (item.effects ?? [])) {
        if (eff.disabled) continue;
        for (const ch of (eff.changes ?? [])) {
          const n = Number(ch.value) || 0;
          if (!n) continue;
          (out[ch.key] = out[ch.key] || []).push({
            name: item.name,
            amount: (n > 0 ? "+" : "") + n * Math.max(1, Number(item.system?.ranks) || 1),
          });
        }
      }
    }
    // Flatten to "Tough +1, Inner Strength +1" per key for the templates.
    const label = {};
    for (const [k, v] of Object.entries(out)) label[k] = v.map((x) => x.name + " " + x.amount).join(", ");
    return label;
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    const context = super.getData();
    const actorData = this.document.toPlainObject();

    context.system = actorData.system;
    context.flags = actorData.flags;
    context.config = CONFIG.TBE;

    // Derived values (set in base-actor.mjs prepareDerivedData) live on the
    // live DataModel instance, not the plain serialized clone above — pull
    // them across explicitly so the template can read them the same way.
    context.system.totalWp = this.actor.system.totalWp;
    context.system.lethalityLevel = this.actor.system.lethalityLevel;
    context.system.isDying = this.actor.system.dying;

    this._prepareItems(context);

    context.enrichedBiography = await TextEditor.enrichHTML(this.actor.system.biography, {
      secrets: this.document.isOwner, async: true, relativeTo: this.actor,
    });
    if (this.actor.type === 'character') {
      context.enrichedNotes = await TextEditor.enrichHTML(this.actor.system.notes, {
        secrets: this.document.isOwner, async: true, relativeTo: this.actor,
      });
    }

    context.effects = prepareActiveEffectCategories(this.actor.allApplicableEffects());
    // TBE statuses currently active, for a plain-language summary above the
    // wound table (the icons live on the token; this is the same list, in words).
    context.activeStatuses = CONFIG.TBE.STATUSES.filter((s) => this.actor.statuses?.has(s.id));
    context.raceInfo = this.actor.type === 'character' ? CONFIG.TBE.race(this.actor.system.race) : null;
    context.sizeOffset = this.actor.system.sizeOffset ?? 0;

    return context;
  }

  /**
   * Group items by type and sort skills by their group.
   * @param {object} context
   */
  _prepareItems(context) {
    const skills = {};
    for (const group of CONFIG.TBE.SKILL_GROUPS) skills[group] = [];
    const weapons = [];
    const armor = [];
    const shields = [];
    const talents = {};
    for (const cat of CONFIG.TBE.TALENT_CATEGORIES) talents[cat] = [];
    const strands = [];
    const threads = [];
    const enchantments = [];

    /* The gear row's carry picker (v0.49.0, first-session note: "changing
       from at hand, to stored to dropped, should be more easy than editing
       the item"). Every state the owner (TBE.READINESS) knows, in its order,
       each with the book's cost as the tooltip; nothing listed by hand. */
    const carryOptions = (i) => Object.entries(TBE.READINESS).map(([key, r]) => ({
      key, label: r.short, title: `${r.label}: ${r.cost}`,
      selected: key === (i.system?.carried ?? 'hand')
    }));
    for (const i of context.items) {
      i.img = i.img || Item.DEFAULT_ICON;
      if (i.type === 'skill') (skills[i.system.group] ??= []).push(i);
      /* The readiness record comes from the owner (TBE.READINESS via
         readinessOf) rather than being re-derived in the template. The
         template used to test `carried` with a chain of eq helpers ending in
         an else, which meant every carry state added after the chain was
         written displayed as whatever the else said. */
      else if (i.type === 'weapon') { i.readiness = TBE.readinessOf(i); i.carryOptions = carryOptions(i); weapons.push(i); }
      else if (i.type === 'armor') armor.push(i);
      else if (i.type === 'shield') { i.readiness = TBE.readinessOf(i); i.carryOptions = carryOptions(i); shields.push(i); }
      else if (i.type === 'talent') (talents[i.system.category] ??= []).push(i);
      else if (i.type === 'strand') strands.push(i);
      else if (i.type === 'thread') threads.push(i);
      else if (i.type === 'enchantment') enchantments.push(i);
    }
    for (const cat of Object.keys(talents)) talents[cat].sort((a, b) => a.name.localeCompare(b.name));
    for (const group of Object.keys(skills)) skills[group].sort((a, b) => a.name.localeCompare(b.name));

    context.skillGroups = skills;
    context.talentGroups = talents;
    context.talentCount = Object.values(talents).reduce((n, list) => n + list.length, 0);
    context.weapons = weapons;
    context.armor = armor;
    context.shields = shields;
    context.enc = this._prepareEnc(weapons, shields, armor, context.system);
    context.armorPenalty = this._prepareArmorPenalty(armor, context.system);
    context.statSources = this._prepareStatSources();
    context.magic = this._prepareMagic(skills, strands, threads, context.system);
    /* Divine Magic (Ch.15). Piety is an ordinary skill Item, so the tab only
     * appears for a character who actually has one -- which the book gates on
     * the Godbound Talent. The thresholds are shown because they are the
     * warnings the god itself is supposed to send. */
    const pietyItem = (context.items || []).find((i) => i.type === "skill" && /^piety$/i.test(i.name || ""));
    const piety = Number(pietyItem?.system?.value) || 0;
    context.divine = {
      isGodbound: !!pietyItem,
      piety, item: pietyItem || null,
      atWarning: !!pietyItem && piety > 0 && piety <= 30,
      atEncouragement: piety >= 80,
      symbol: context.system.holySymbol || "",
      symbolNeedsBlessing: context.system.holySymbol === "d4",
      castOut: !!context.system.castOut,
      noGreaterSessions: Number(context.system.noGreaterSessions) || 0
    };
    /* Enchanted items and potions (Ch.14 p.322-326). Summarised here rather
     * than in the template so the "what is left in it" line is computed in
     * one place: a Use Die item that is inert says so and for how long, a
     * charged one counts down, a spent vessel reads as spent. */
    context.enchantments = enchantments.map((i) => {
      const sys = i.system || {};
      const kind = sys.kind || "charges";
      const inert = Number(sys.inertDays) > 0;
      let left;
      if (sys.spent) left = "spent";
      else if (kind === "die") left = inert ? `inert, ${sys.inertDays} day(s)` : `${sys.die} Use Die`;
      else if (kind === "potion") left = `${sys.charges} dose(s) of ${sys.chargesMax}`;
      else if (kind === "single") left = "one use";
      else left = `${sys.charges} / ${sys.chargesMax} charges`;
      return { item: i, name: i.name, kind, left, inert, spent: !!sys.spent, unstable: !!sys.unstable,
               spell: sys.spell || "", anyone: !!sys.anyoneCanUse, resistance: Number(sys.resistance) || 0 };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Everything the Magic tab needs to be answerable without the rulebook.
   *
   * The point of gathering it here rather than in the template is that each
   * number the player is asked to act on comes with the thing they'd
   * otherwise have to look up: what the next Strand level costs in XP, what
   * Fraying it adds, what the ceiling is for this Pattern, and what the
   * running purge risk actually is. Ch.14 argues for the last one outright:
   * "it is generally better to let the player know what their character's
   * running total is."
   *
   * @param {object} skillGroups grouped skill Items
   * @param {object[]} strandItems the actor's Strand Items
   * @param {object[]} threadItems the actor's Thread Items
   * @param {object} system the actor's system data
   */
  _prepareMagic(skillGroups, strandItems, threadItems, system) {
    const C = CONFIG.TBE;
    const pattern = system?.pattern || 'none';
    const atCreation = false;
    const cap = C.strandCap(pattern, atCreation);
    const convo = (C.CONVOCATIONS || []).find((c) => c.name === system?.convocation) || null;
    const thinNames = new Set((convo?.thinStrands || []).map((n) => n.toLowerCase()));

    // Binds are ordinary percentile skills living in the "Bind" skill group.
    // The name may be "Bind: Control" (what the wizard writes) or bare
    // "Control"; match both so a hand-made sheet still lines up.
    const bindItems = (skillGroups.Bind || []);
    const bindOf = (name) => bindItems.find((i) => {
      const n = i.name.toLowerCase().replace(/^bind\s*:\s*/, '').trim();
      return n === name.toLowerCase();
    }) || null;
    const bindCap = pattern === 'fade' ? C.MAGIC_RULES.fadeBindCap : null;
    const binds = (C.BINDS || []).map((name) => {
      const item = bindOf(name);
      const value = item ? Number(item.system?.value) || 0 : 0;
      return {
        name, item,
        /* Ch.14 p.280: "Binds or Strands with a value of zero cannot be used
         * in spellcasting." Character creation writes all five Binds at 0 by
         * default, so `!!item` would report every one of them as known and
         * hide the cost of actually opening it. Usable, not merely present,
         * is the question the tab is answering. */
        known: !!item && value > 0,
        hasItem: !!item,
        value,
        expertise: item ? Number(item.system?.expertise) || 0 : 0,
        atCap: !!(bindCap && value >= bindCap),
        desc: (C.BIND_INFO || []).find((b) => b.name === name)?.desc || ''
      };
    });
    const usableBinds = binds.filter((b) => b.known).length;
    // Any Bind skill the player named something else entirely still belongs
    // on this tab rather than vanishing between the two lists.
    const knownIds = new Set(binds.map((b) => b.item?._id).filter(Boolean));
    const otherBinds = bindItems.filter((i) => !knownIds.has(i._id));

    /* A Strand at 0 is in the same position as a Bind at 0. */
    const strands = strandItems.map((i) => {
      const level = Number(i.system?.level) || 0;
      const next = C.strandXp(level, level + 1);
      const overCap = cap.cap !== null && level >= cap.cap;
      return {
        item: i, name: C.strandName(i.name), level,
        thin: !!i.system?.thin,
        nextXp: next.xp, nextFraying: next.fraying, atCap: overCap
      };
    }).sort((a, b) => b.level - a.level || a.name.localeCompare(b.name));

    const have = new Set(strands.map((s) => s.name.toLowerCase()));
    const unknown = (C.STRANDS || []).filter((n) => !have.has(n.toLowerCase())).map((n) => ({
      name: n,
      thin: thinNames.has(n.toLowerCase()),
      xp: thinNames.has(n.toLowerCase())
        ? C.MAGIC_RULES.newThinStrandTalentXp : C.MAGIC_RULES.newStrandTalentXp,
      desc: (C.STRAND_INFO || []).find((s) => s.name === n)?.desc || ''
    }));

    /* Threads. A Thread only helps a casting that uses the Bind or Strand it
     * is attuned to, and it is spent by use, so the row states what it gives
     * and what is left rather than just naming the item. */
    const threads = threadItems.map((i) => {
      const kind = i.system?.kind || 'die';
      const inert = !!i.system?.expended || (kind === 'consumable' && !(Number(i.system?.pool) || 0));
      return {
        item: i, name: i.name,
        attunement: i.system?.attunement || '',
        isBind: (C.BINDS || []).includes(i.system?.attunement),
        kind, inert,
        gives: kind === 'die' ? String(i.system?.die || 'd8') + ' Mastery'
          : kind === 'consumable' ? (Number(i.system?.pool) || 0) + ' Mastery left in the pool'
            : (Number(i.system?.bonus) || 0) + ' Mastery, every casting'
      };
    }).sort((a, b) => Number(a.inert) - Number(b.inert) || a.name.localeCompare(b.name));

    const maxResolve = Number(system?.resolve?.max) || 0;
    const fraying = Number(system?.fraying) || 0;
    const over = fraying - maxResolve;
    return {
      pattern,
      patternLabel: pattern === 'spellweaver' ? 'Spellweaver (Patterned in the Weave)'
        : pattern === 'fade' ? 'Fade (Faded Pattern)' : 'Not Patterned',
      canCast: pattern !== 'none',
      convocation: system?.convocation || '',
      convocationRec: convo,
      trueName: system?.trueName || '',
      binds, otherBinds, bindCap,
      canAttempt: pattern !== 'none' && C.availableResolve(system) >= 1,
      strands, unknownStrands: unknown, threads,
      strandCap: cap.cap, strandCapWhy: cap.why,
      totalStrandLevels: strands.reduce((n, s) => n + s.level, 0),
      fraying, maxResolve,
      frayingOver: over,
      inFrayingRoll: over > 0,
      frayingRisk: over > 0 ? Math.min(100, over * 2) : 0,
      frayingTiers: C.frayingTiers(fraying, maxResolve, system?.frayingSymptoms || []),
      frayingTrait: fraying >= 10,
      usableBinds,
      usableStrands: strands.filter((x) => x.level > 0).length,
      /* Ch.14 p.280: "To do so, the caster must have at least 1 available
       * Resolve. Otherwise, a spell cannot be attempted." Available means
       * not spent and not crossed out by Fatigue (p.26). */
      resolveLeft: C.availableResolve(system),
      convocations: C.CONVOCATIONS || []
    };
  }

  /**
   * Bulk & Initiative Penalty (Ch.9 p.141): "Add up the Bulk from each
   * piece of worn armor and divide by 3, rounding up." Worn only -- armor
   * sitting in Inventory (system.equipped === false) causes no penalty.
   * Lives in the sheet layer rather than the DataModel because it needs
   * `this.items`, which a DataModel (base-actor.mjs) doesn't have access to.
   * @param {object[]} armor
   * @param {object} system
   */
  _prepareArmorPenalty(armor, system) {
    /* Owned by TheBrokenEmpiresActor.prepareDerivedData() now, so the sheet,
     * the initiative formula and the macro pack cannot disagree about what a
     * mail shirt costs. The local computation stays only as a fallback for an
     * actor prepared before this field existed. */
    const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
    if (Number.isFinite(Number(system?.armorInitPenalty))) {
      return {
        bulk: num(system.armorBulk, 0),
        penalty: num(system.armorInitPenalty, 0),
        effective: num(system.initiativeEffective, num(system.initiative, 0))
      };
    }
    const bulk = armor.filter((i) => i.system?.equipped !== false)
      .reduce((s, i) => s + num(i.system?.bulk, 0), 0);
    const penalty = Math.ceil(bulk / 3);
    const base = num(system?.initiative, 0);
    return { bulk, penalty, effective: base - penalty };
  }

  /**
   * Encumbrance (Ch.9 p.129-130). This method's job is narrower than it used
   * to be: gather the six raw numbers the rule needs out of this sheet's own
   * pre-split weapons/shields/armor arrays, and hand them to the one owner of
   * the actual bands and cap math, `TBE.encumbrance()` in helpers/config.mjs
   * (imported above). The comment here used to say "the same rule as
   * TBE.encStatus() in the macro pack, kept in sync by hand" -- a request,
   * not a guarantee, and the arithmetic itself has exactly one copy now.
   * audit_check.mjs still executes this against 128 loadouts alongside the
   * macro pack's TBE.encStatus(), because the INPUT-GATHERING below is still
   * two independent copies (this sheet starts from pre-split arrays,
   * TBE.encStatus() starts from a whole actor's `.items`) and that half can
   * still drift even though the bands cannot.
   *
   * @param {object[]} weapons
   * @param {object[]} shields
   * @param {object[]} armor
   * @param {object} system
   */
  _prepareEnc(weapons, shields, armor, system) {
    const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
    const gear = [...weapons, ...shields];
    /* Ask the owner which pool each state counts toward rather than testing
       `!== 'stored'`. That negative filter read an open enum as a binary, so
       adding `dropped` would have made a weapon on the ground weigh against
       the 6 ENC Weapons At Hand pool. See TBE.READINESS in helpers/config.mjs. */
    const inPool = (i, pool) => TBE.carryPool(i.system?.carried) === pool;
    const hand = gear.filter((i) => inPool(i, TBE.CARRY_POOL.HAND))
      .reduce((s, i) => s + num(i.system?.enc, 0), 0);
    const storedGear = gear.filter((i) => inPool(i, TBE.CARRY_POOL.INVENTORY))
      .reduce((s, i) => s + num(i.system?.enc, 0), 0);
    const unequippedArmor = armor.filter((i) => i.system?.equipped === false).length;
    const coinEnc = Math.floor(num(system?.silver, 0) / 500);
    // Weapons at Hand is 6 ENC plus the Weapon Belt Talent's bonus (p.130);
    // TBE.encumbrance() applies that and the Inventory bonus/cap together.
    return TBE.encumbrance({
      hand, storedGear, unequippedArmor, coinEnc,
      invBonus: num(system?.enc?.invBonus, 0),
      handBonus: num(system?.enc?.handBonus, 0)
    });
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    html.on('click', '.item-edit', (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      item.sheet.render(true);
    });

    /* Rolling sits above the editable guard on purpose: looking at a sheet
     * you do not own and rolling its skill is harmless, and the Resolve
     * spend below checks permission separately rather than failing silently. */
    html.on('click', '.skill-roll', this._onSkillRoll.bind(this));
    /* Same reasoning as above, one step further: a weapon row rolls the attack
       and a fighting skill rolls a defence. Both go through the same dialog,
       the same resolve() and the same visibility owner as .skill-roll -- they
       are additional ENTRY POINTS, not additional rules. */
    html.on('click', '.weapon-roll', this._onWeaponRoll.bind(this));
    html.on('click', '.defence-roll', this._onDefenceRoll.bind(this));

    /* B4: the chargen-derived maxima are readonly until the lock is clicked.
       Deliberately NOT a permission question -- the owner of the sheet is
       exactly who this protects, from their own fat finger mid-fight. */
    html.on('click', '.stat-max-lock', (ev) => {
      ev.preventDefault();
      const a = ev.currentTarget;
      const input = a.parentElement?.querySelector('.stat-max');
      if (!input) return;
      const locking = !input.readOnly;
      input.readOnly = locking;
      a.innerHTML = `<i class="fas fa-${locking ? 'lock' : 'lock-open'}"></i>`;
      a.title = `${locking ? 'Unlock' : 'Lock'} this maximum`;
      if (!locking) input.focus();
    });

    if (!this.isEditable) return;

    html.on('click', '.item-create', this._onItemCreate.bind(this));

    /* One change on the gear row moves a weapon or shield between held, at
       hand, stored and dropped. Written through the permission owner, so a
       refusal is a sentence rather than a silent no-op. The book's action
       cost is shown, never charged (Readiness is not enforced, p.129). */
    html.on('change', '.carry-select', async (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      const value = ev.currentTarget.value;
      if (!item || !TBE.READINESS[value]) return;
      await PERMISSION.applyItemWrite(item, { 'system.carried': value }, {
        what: `${item.name}'s carry state`,
        user: game.user,
        notify: (msg) => ui.notifications?.warn(msg)
      });
    });

    html.on('click', '.item-delete', (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Personality Traits (Ch.8 p.123 "Personality Changes"): a plain string
    // array on the actor, not Items -- free to add/edit/remove any time, no
    // XP cost or approval step, matching the book exactly.
    html.on('click', '.trait-add', async (ev) => {
      ev.preventDefault();
      const traits = foundry.utils.duplicate(this.actor.system.personalityTraits || []);
      traits.push('');
      await this.actor.update({ 'system.personalityTraits': traits });
    });
    html.on('click', '.trait-remove', async (ev) => {
      ev.preventDefault();
      const idx = Number(ev.currentTarget.dataset.idx);
      const traits = foundry.utils.duplicate(this.actor.system.personalityTraits || []);
      traits.splice(idx, 1);
      await this.actor.update({ 'system.personalityTraits': traits });
    });
    html.on('change', '.trait-input', async (ev) => {
      const idx = Number(ev.currentTarget.dataset.idx);
      const traits = foundry.utils.duplicate(this.actor.system.personalityTraits || []);
      traits[idx] = ev.currentTarget.value;
      await this.actor.update({ 'system.personalityTraits': traits });
    });

    /* The god's Domains (Ch.15). A plain string array, edited the same way
     * Personality Traits are -- a textarea would submit one string into an
     * ArrayField and quietly store the wrong shape. */
    html.on('click', '.domain-add', async (ev) => {
      ev.preventDefault();
      const d = foundry.utils.duplicate(this.actor.system.domains || []);
      d.push('');
      await this.actor.update({ 'system.domains': d });
    });
    html.on('click', '.domain-remove', async (ev) => {
      ev.preventDefault();
      const idx = Number(ev.currentTarget.dataset.idx);
      const d = foundry.utils.duplicate(this.actor.system.domains || []);
      d.splice(idx, 1);
      await this.actor.update({ 'system.domains': d });
    });
    html.on('change', '.domain-input', async (ev) => {
      const idx = Number(ev.currentTarget.dataset.idx);
      const d = foundry.utils.duplicate(this.actor.system.domains || []);
      d[idx] = ev.currentTarget.value;
      /* An ArrayField of non-blank strings will reject a blank entry, so an
       * emptied row removes itself rather than failing the update silently. */
      await this.actor.update({ 'system.domains': d.filter((x) => String(x).trim()) });
    });

    // Ch.6 Goals. Real records, because XP is awarded per goal pursued and
    // per goal completed (p.160). Built properly by TBE: Finish Character,
    // which walks the book's four-step method; edited freely here.
    const goalsOf = () => foundry.utils.duplicate(this.actor.system.goals || []);
    html.on('click', '.goal-add', async (ev) => {
      ev.preventDefault();
      const goals = goalsOf();
      goals.push({ text: '', kind: 'individual', done: false });
      await this.actor.update({ 'system.goals': goals });
    });
    html.on('click', '.goal-remove', async (ev) => {
      ev.preventDefault();
      const goals = goalsOf();
      goals.splice(Number(ev.currentTarget.dataset.idx), 1);
      await this.actor.update({ 'system.goals': goals });
    });
    html.on('change', '.goal-input', async (ev) => {
      const goals = goalsOf();
      goals[Number(ev.currentTarget.dataset.idx)].text = ev.currentTarget.value;
      await this.actor.update({ 'system.goals': goals });
    });
    html.on('change', '.goal-kind', async (ev) => {
      const goals = goalsOf();
      goals[Number(ev.currentTarget.dataset.idx)].kind = ev.currentTarget.value;
      await this.actor.update({ 'system.goals': goals });
    });
    html.on('change', '.goal-done', async (ev) => {
      const goals = goalsOf();
      goals[Number(ev.currentTarget.dataset.idx)].done = !!ev.currentTarget.checked;
      await this.actor.update({ 'system.goals': goals });
    });

    /* Launchers, not rules. Combat, casting and advancement stay in the
     * macro pack by design, but the player should not have to go hunting for
     * the macro that acts on the number they are looking at. This only calls
     * the macro; every rule still lives in it. */
    html.on('click', '.tbe-macro', (ev) => {
      ev.preventDefault();
      const name = ev.currentTarget.dataset.macro;
      const macro = game.macros?.getName?.(name);
      if (macro) macro.execute();
      else ui.notifications?.warn(`TBE: the "${name}" macro is not installed in this world.`);
    });

    html.on('click', '.effect-control', (ev) => {
      const row = ev.currentTarget.closest('li');
      const document = row.dataset.parentId === this.actor.id
        ? this.actor
        : this.actor.items.get(row.dataset.parentId);
      onManageActiveEffect(ev, document);
    });

    if (this.actor.isOwner) {
      let handler = (ev) => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains('inventory-header')) return;
        li.setAttribute('draggable', true);
        li.addEventListener('dragstart', handler, false);
      });
    }
  }

  /**
   * Click a skill name, roll it (Ch.2).
   *
   * The dialog offers exactly the two things the book lets you change before
   * a roll, and nothing invented:
   *   - the Task Modifier (p.25), the book's own five steps
   *   - Favor, +10 a point, capped at 3 "from any source, including Resolve"
   * Both come from module/rules/resolution.mjs, which also resolves the
   * result, so the sheet and the macro pack cannot disagree about any of it.
   *
   * @private
   */
  async _onSkillRoll(event) {
    event.preventDefault();
    const li = $(event.currentTarget).parents('.item');
    const item = this.actor.items.get(li.data('itemId'));
    if (!item) return;
    return this._rollSkill({
      name: item.name,
      base: Number(item.system?.value) || 0,
      expertise: Number(item.system?.expertise) || 0,
      savvy: !!item.system?.savvy
    });
  }

  /**
   * Click a weapon, roll the attack with it.
   *
   * The weapon does not carry a skill value -- it names one (`skillName`), and
   * the number comes from the matching skill Item. A character who has never
   * written that skill down is not unskilled, they are untrained at the book's
   * 20 (p.104), which is exactly the gap `TBE.skillOptions` was built to close
   * for the macro picker; the same rule has to hold here or clicking a sword
   * you own but have no Item for silently rolls against 0.
   *
   * What this does NOT do: hit location, damage, Combat Maneuvers, the size
   * table, wounds. Those need two actors and a whole exchange and stay in
   * TBE: Attack. This is the roll, and a line telling you what you are holding.
   * @private
   */
  async _onWeaponRoll(event) {
    event.preventDefault();
    const li = $(event.currentTarget).parents('.item');
    const weapon = this.actor.items.get(li.data('itemId'));
    if (!weapon) return;

    const wanted = String(weapon.system?.skillName || '').trim();
    const skill = wanted
      ? this.actor.items.find((i) => i.type === 'skill' &&
          i.name.trim().toLowerCase() === wanted.toLowerCase())
      : null;
    const base = skill ? Number(skill.system?.value) || 0 : TBE.BASE_SKILL;

    /* Readiness (p.129) is shown, never charged -- the playtest GM declined enforcement on
       2026-09-17. A weapon that is Stored or on the floor can still be rolled
       here; what it cannot do is have that fact hidden. */
    const ready = TBE.readinessOf ? TBE.readinessOf(weapon) : null;
    const readyNote = ready && ready.pool !== TBE.CARRY_POOL?.HAND
      ? `<p style="font-size:11px;color:#8b1a1a;margin:.3em 0 0">${weapon.name} is <b>${ready.label}</b> &mdash; ${ready.cost} before it can be used (p.129).</p>`
      : '';

    const shieldNote = this._shieldNote();

    return this._rollSkill({
      name: `${weapon.name}${wanted ? ` (${wanted})` : ''}`,
      base,
      expertise: skill ? Number(skill.system?.expertise) || 0 : 0,
      savvy: skill ? !!skill.system?.savvy : false,
      untrained: !skill,
      extraHtml: readyNote + (shieldNote ? `<p style="font-size:11px;opacity:.85;margin:.3em 0 0">${shieldNote}</p>` : ''),
      cardExtra: shieldNote
    });
  }

  /**
   * Click a fighting skill, roll a parry or a dodge.
   *
   * `system.fighting` marks which skills qualify and is derived rather than
   * independent: a skill is a fighting skill iff its group is Combat. The
   * template decides which rows get this class; this method does not re-derive
   * the rule.
   * @private
   */
  async _onDefenceRoll(event) {
    event.preventDefault();
    const li = $(event.currentTarget).parents('.item');
    const item = this.actor.items.get(li.data('itemId'));
    if (!item) return;
    const shieldNote = this._shieldNote();
    return this._rollSkill({
      name: `${item.name} (defence)`,
      base: Number(item.system?.value) || 0,
      expertise: Number(item.system?.expertise) || 0,
      savvy: !!item.system?.savvy,
      extraHtml: shieldNote ? `<p style="font-size:11px;opacity:.85;margin:.3em 0 0">${shieldNote}</p>` : '',
      cardExtra: shieldNote,
      note: 'Task Modifiers do not apply to opposed rolls, and a defence is one. The GM sets the difficulty.'
    });
  }

  /**
   * B1, in the playtest GM's words: "If shielding make it clear during the attack macro."
   *
   * The shield was always in the arithmetic and never in the sentence. This
   * asks the combat owner the same POSITIVE question tbe-attack.js asks --
   * is a shield in hand -- so the line and the number cannot disagree, which
   * is the only thing that makes the line worth printing.
   * @private
   */
  _shieldNote() {
    const shield = COMBAT.defendingShield(this.actor, TBE.carryPool, TBE.CARRY_POOL?.HAND ?? 'hand');
    return COMBAT.shieldLine(shield, { defenderName: this.actor.name });
  }

  /**
   * The one roll implementation the three entry points above share.
   *
   * The sheet still owns no rules: this does arithmetic (`base + task + favor
   * x FAVOR_STEP`), hands the result to the same `resolve()` every macro uses,
   * routes the card through the visibility owner and the Resolve spend through
   * the permission owner. Every decision the book makes is made elsewhere.
   * @private
   */
  async _rollSkill({ name, base, expertise = 0, savvy = false, untrained = false,
                     extraHtml = '', cardExtra = null, note = '' } = {}) {
    /* You cannot spend Resolve you do not have, and Fatigue crosses boxes
     * out of the same track (p.26), so what is spendable is unspent minus
     * Fatigue (rules/resolve-track.mjs). The book caps Favor on a single roll
     * at 3 whatever it is sourced from. */
    const resolveLeft = RTRACK.availableResolve(this.actor.system);
    const maxSpend = Math.min(RULES.FAVOR_CAP, resolveLeft);

    /* Buttons, not selects (first-session note: "modifiers as radial
     * buttons ... with a memory"). The Task Modifier opens on the step this
     * user last used for this character; Favor always opens on 0, because it
     * spends Resolve and a remembered spend is one nobody chose. */
    const memKey = this.actor.id ?? 'none';
    const lastTask = Number(MEMORY.recall(game.user, 'task', memKey)) || 0;
    const mods = CONTROLS.taskButtons(RULES.TASK_MODIFIERS, lastTask, 'task');
    const spends = CONTROLS.favorButtons(maxSpend, RULES.FAVOR_STEP, 'favor');

    const content = `
      <form>
        <p style="margin:.2em 0"><b>${name}</b> ${base}${expertise >= 2 ? ` <span title="Expertise">Ex${expertise}</span>` : ''}${savvy ? ' <span title="Savvy">S</span>' : ''}${untrained ? ` <span style="font-size:11px;opacity:.8">untrained, ${TBE.BASE_SKILL} (p.104)</span>` : ''}</p>
        <div style="margin:.3em 0 0">Task Modifier</div>
        ${mods}
        <div>Favor / Resolve</div>
        ${spends}
        <div class="tbe-roll-track">${RTRACK.trackHtml(this.actor.system, 0)}</div>
        <p style="font-size:11px;opacity:.8;margin:.4em 0 0">
          Up to ${RULES.FAVOR_CAP} Favor on any one roll,
          <i>from any source</i>, so Favor or Leverage already spent here counts against the same ${RULES.FAVOR_CAP}.
          ${note || 'Task Modifiers do not apply to opposed rolls, which set their own difficulty.'}
        </p>
        ${extraHtml}
        <p class="tbe-roll-total" style="margin:.4em 0 0"><b>Rolling against ${base}</b></p>
      </form>`;

    const spend = await new Promise((resolve) => {
      new Dialog({
        title: `Roll ${name}`,
        content,
        buttons: {
          roll: { label: 'Roll', callback: (dlg) => {
            const f = dlg[0].querySelector('form');
            resolve({ task: Number(CONTROLS.readRadio(f, 'task')) || 0,
                      favor: Number(CONTROLS.readRadio(f, 'favor')) || 0 });
          } },
          cancel: { label: 'Cancel', callback: () => resolve(null) }
        },
        default: 'roll',
        close: () => resolve(null),
        render: (dlg) => {
          /* Live total, so the player sees what they are actually rolling
           * against before committing Resolve they cannot get back. */
          const f = dlg[0].querySelector('form');
          const out = f.querySelector('.tbe-roll-total');
          const trackEl = f.querySelector('.tbe-roll-track');
          const update = () => {
            const favor = Number(CONTROLS.readRadio(f, 'favor')) || 0;
            const total = base + (Number(CONTROLS.readRadio(f, 'task')) || 0) + favor * RULES.FAVOR_STEP;
            out.innerHTML = `<b>Rolling against ${total}</b>`;
            /* The boxes this Favor would slash, before anything is spent. */
            if (trackEl) trackEl.innerHTML = RTRACK.trackHtml(this.actor.system, favor);
          };
          f.addEventListener('change', update);
          update();
        }
      }).render(true);
    });
    if (!spend) return;
    /* The modifier only; never the Favor. A failed write (no user, a stub)
       costs nothing but the memory. */
    try { await MEMORY.remember(game.user, 'task', memKey, spend.task); }
    catch (err) { console.warn('TBE | could not remember the Task Modifier', err); }

    const target = base + spend.task + spend.favor * RULES.FAVOR_STEP;
    const roll = await new Roll('1d100').roll();
    const res = RULES.resolve(roll.total, target, expertise);

    /* Spend the Resolve only after the roll exists, and only if this user can
     * actually write to the actor. Warning beats a silent no-op. */
    let spent = 0;
    /* The track as it stood when the roll was made, for the card's before and
       after. A plain copy: the actor's own data changes under the write. */
    const trackBefore = {
      resolve: { value: this.actor.system?.resolve?.value, max: this.actor.system?.resolve?.max },
      fatigue: this.actor.system?.fatigue
    };
    if (spend.favor > 0) {
      const cur = Number(this.actor.system?.resolve?.value) || 0;
      /* OWNERSHIP: module/rules/permission.mjs. This method carried the only
         correct unowned-actor handling in the codebase for several releases;
         it is now the owner's, so the macro pack says the same thing rather
         than each site inventing its own wording -- or, as nine of them did,
         swallowing the error and printing the cost anyway. */
      const w = await PERMISSION.applyWrite(
        this.actor,
        { 'system.resolve.value': Math.max(0, cur - spend.favor) },
        {
          what: `the ${spend.favor} Resolve`,
          user: game.user,
          notify: (msg) => ui.notifications?.warn(`${msg} The roll still used the bonus.`)
        }
      );
      if (w.ok) spent = spend.favor;
    }

    const bits = [];
    if (spend.task) bits.push(`task ${spend.task > 0 ? '+' : ''}${spend.task}`);
    if (spend.favor) bits.push(`${spend.favor} Favor +${spend.favor * RULES.FAVOR_STEP}${spent ? '' : ' (not deducted)'}`);
    const line = bits.length ? `${base} ${bits.map((b) => `(${b})`).join(' ')} = ${target}` : `${base}`;

    /* Respect the roll-mode dropdown. A GM rolling a creature's Stealth in
       front of the party needs it to be private, and before v0.34.0 neither
       this button nor any macro could do that. Visibility has one owner
       (module/rules/visibility.mjs); this passes no mode of its own, so the
       user's own selection decides. */
    const messageData = {
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `<b>${name}</b> &mdash; ${line}<br>` +
        `<b>${RULES.outcomeLabel(res)}</b>${res.success ? ` with ${res.sl} SL` : ''}` +
        (res.notes.length ? `<br><span style="font-size:11px;opacity:.85">${res.notes.join('; ')}</span>` : '') +
        /* B1: say at the moment of the roll that a shield is up and what it
           contributes. Same source as the number, so they cannot disagree. */
        (cardExtra ? `<br><span style="font-size:11px;opacity:.85">${cardExtra}</span>` : '') +
        /* A Favor spend shows the track: the boxes it slashed, and what is
           left against the Fatigue already crossed out. Only when Resolve
           actually moved; an ordinary roll does not need a track under it. */
        (spent ? `<br>${RTRACK.trackHtml(trackBefore, spent)}` : '')
    };
    VISIBILITY.prepare(messageData, {
      settingsGet: (ns, key) => game.settings.get(ns, key),
      ChatMessageClass: ChatMessage,
      selfId: game.user?.id
    });
    await roll.toMessage(messageData);
  }

  /** @private */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const type = header.dataset.type;
    const data = foundry.utils.duplicate(header.dataset);
    const name = `New ${type.capitalize()}`;
    const itemData = { name, type, system: data };
    delete itemData.system['type'];
    return await Item.create(itemData, { parent: this.actor });
  }
}
