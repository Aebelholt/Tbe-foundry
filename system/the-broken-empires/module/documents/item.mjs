/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class TheBrokenEmpiresItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    super.prepareData();
  }

  /**
   * Scale a repeatable Talent's ActiveEffect by how many times it has been
   * bought.
   *
   * The book is explicit that several stat Talents stack -- "COMBAT AWARENESS:
   * Add +1 to your Initiative modifier. Can be purchased up to five times"
   * (p.?, Combat Talents), likewise Tough, Not Today Death, Strong Back and
   * Inner Strength. TBE: Talents charges the XP for each purchase and bumps
   * system.ranks, but nothing ever multiplied the effect: a character who
   * spent 25 XP on five ranks of Combat Awareness carried a rank counter
   * reading 5 and an Initiative bonus still stuck at +1. XP a player earned
   * and spent on purpose, for nothing.
   *
   * Runs after the item's own data preparation and before the actor applies
   * transferred effects, so the actor sees the scaled value.
   * @override
   */
  prepareDerivedData() {
    super.prepareDerivedData?.();
    if (this.type !== "talent") return;
    const cap = CONFIG.TBE?.rankCap ? CONFIG.TBE.rankCap(this.system?.maxRanks) : 1;
    const ranks = Math.max(1, Math.min(Number(this.system?.ranks) || 1, cap));
    this.system.effectiveRanks = ranks;
    if (ranks <= 1) return;
    for (const effect of this.effects) {
      /* An effect can DECLARE that it is not per-rank, and that declaration
       * wins. Everything else scales.
       *
       * "Numeric ADD change on a repeatable Talent" and "per-rank bonus" are
       * not the same statement, and inferring the second from the first is
       * what the audit objected to. But the fix cannot be "scale only what is
       * marked": the first version of this did exactly that and tier0_check
       * caught it immediately, because a hand-made effect carries no mark and
       * would have gone back to paying out 1x no matter how many ranks were
       * bought -- the inert-Talent bug v0.13.0 existed to kill, reintroduced
       * in the name of tidiness. An unmarked effect on a Talent whose rank
       * counter reads 5 is far more likely to be an oversight than a
       * deliberate flat bonus, and of the two ways to be wrong, paying the
       * player what their XP bought is the right one.
       *
       * So: opt OUT, not opt in. build_talents.py stamps flags.tbe.perRank on
       * every effect it generates and audit_check.mjs fails the build if one
       * lacks an explicit decision, so for shipped data nothing is inferred at
       * all; the default only governs effects this system did not write. */
      /* Read tolerantly here, and ONLY here. `perRank` is generated data:
         build_talents.py stamps it, it flows compendium -> world when a Talent
         is added to an actor, and every new copy carries the current
         namespace. The keys the 0.39.0 migration moves are world state nothing
         will ever re-create, which is why those are migrated instead. Sweeping
         ActiveEffects nested inside Items inside Actors to relabel data that
         regenerates itself would be a deep migration bought for nothing. */
      const perRank = CONFIG?.TBE?.readFlag
        ? CONFIG.TBE.readFlag(effect, "perRank")
        : (effect.flags?.[CONFIG?.TBE?.FLAG_SCOPE ?? "the-broken-empires"]?.perRank ?? effect.flags?.tbe?.perRank);
      if (perRank === false) continue;
      for (const change of effect.changes ?? []) {
        if (change.mode !== CONST.ACTIVE_EFFECT_MODES.ADD) continue;
        const base = Number(change.value);
        if (!Number.isFinite(base)) continue;
        change.value = String(base * ranks);
      }
    }
  }

  /**
   * Prepare a data object which defines the data schema used by dice roll commands against this Item
   * @override
   */
  getRollData() {
    // Starts off by populating the roll data with a shallow copy of `this.system`
    const rollData = { ...this.system };

    // Quit early if there's no parent actor
    if (!this.actor) return rollData;

    // If present, add the actor's roll data
    rollData.actor = this.actor.getRollData();

    return rollData;
  }

  /**
   * Convert the actor document to a plain object.
   *
   * The built in `toObject()` method will ignore derived data when using Data Models.
   * This additional method will instead use the spread operator to return a simplified
   * version of the data.
   *
   * @returns {object} Plain object either via deepClone or the spread operator.
   */
  toPlainObject() {
    const result = { ...this };

    // Simplify system data.
    result.system = this.system.toPlainObject();

    // Add effects.
    result.effects = this.effects?.size > 0 ? this.effects.contents : [];

    return result;
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {
    const item = this;

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');
    const label = `[${item.type}] ${item.name}`;

    // If there's no roll data, send a chat message.
    if (!this.system.formula) {
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
        content: item.system.description ?? '',
      });
    }
    // Otherwise, create a roll and send a chat message from it.
    else {
      // Retrieve roll data.
      const rollData = this.getRollData();

      // Invoke the roll and submit it to chat.
      const roll = new Roll(rollData.formula, rollData.actor);
      // If you need to store the value first, uncomment the next line.
      // const result = await roll.evaluate();
      roll.toMessage({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
      });
      return roll;
    }
  }
}
