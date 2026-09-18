import TheBrokenEmpiresActorBase from "./base-actor.mjs";

export default class TheBrokenEmpiresCharacter extends TheBrokenEmpiresActorBase {

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    // Race carries real numbers (an Ogre starts Toughness 1, Death Threshold 22,
    // Large, -20 Melee: Light), so it is a field the macros read, not prose.
    schema.race = new fields.StringField({
      required: true, blank: true, initial: "Human",
      choices: ["", "Human", "Half-Orc", "Dwarf", "Ogre", "Bolg Fiir", "The Replaced"]
    });
    // Culture and Previous Career are applied once at creation and never read
    // again, so they are recorded as labels rather than modelled as mechanics.
    schema.culture = new fields.StringField({ required: true, blank: true });
    schema.career = new fields.StringField({ required: true, blank: true });
    schema.silver = new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0, min: 0 });
    schema.status = new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0 });

    // Experience (Ch.8): available is what's left to spend right now, earned
    // is the lifetime total ever awarded (a simple career total, not itself
    // spendable). TBE: Advancement is the only tool that changes these.
    schema.experience = new fields.SchemaField({
      available: new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0, min: 0 }),
      earned: new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0, min: 0 })
    });

    // Encumbrance (Ch.9 p.129): Max Inventory ENC is 6 by the book, raised by
    // the Strong Back Talent. There's no mechanical Talent-effect hook in this
    // system, so that bonus is a manual number the player/GM sets by hand.
    schema.enc = new fields.SchemaField({
      invBonus: new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0, min: 0 }),
      /* Weapons at Hand is a flat 6 ENC (p.130); the Weapon Belt Talent
       * raises it ("Increase your Max Weapon ENC by 1", up to three times).
       * Its ActiveEffect writes here. */
      handBonus: new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0, min: 0 })
    });

    // Free-text extras that don't need to be machine-readable: goals, purse,
    // and anything else the TBE Sheet journal used to carry.
    schema.notes = new fields.HTMLField({ required: true, blank: true });

    // Ch.7 p.109-110 step 10 / Ch.8 "Personality Changes" (p.123): a short
    // list of trait names. Ch.8 gives this zero XP cost or requirement --
    // "at the end of a session, you can choose to change, add, or remove any
    // Personality Trait as long as you feel it is warranted" -- so unlike
    // skills/Expertise this is just freely editable entries, not a purchase
    // TBE: Advancement needs to gate. A blank slot is valid (mid-edit, right
    // after "+ Add Trait").
    /* Ch.6 Goals. Real records rather than a paragraph of prose, because XP
     * is awarded per goal pursued and per goal completed (p.160), and a
     * shared goal pays every member who shared it. Built by
     * TBE: Finish Character from the book's four-step method. */
    /* Ch.14 Fraying. Accumulates and never reduces; once the total passes
     * Max Resolve, every further point demands a Fraying Roll
     * (1d100 <= (Fraying - Max Resolve) x 2 removes the caster from reality).
     * Tracked here so the sheet can show the running risk rather than the
     * player discovering it at the table. */
    schema.fraying = new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0, min: 0 });
    /* Ch.14 p.309: "When your Fraying first reaches or exceeds the threshold,
     * one or more of those symptoms begin and remain permanently, even if
     * your Max Resolve later increases." Three of the four thresholds are
     * relative to Max Resolve, so recomputing them from live values would
     * un-display a tier the moment Max Resolve went up. The keys of the
     * tiers already reached are recorded here; the sheet shows the union of
     * these and whatever the current numbers reach. */
    schema.frayingSymptoms = new fields.ArrayField(
      new fields.StringField({ required: true, blank: false }),
      { required: true, initial: [] }
    );

    /* Which magical Pattern the character carries. This is not flavour: it
     * decides the Strand ceiling (a Fade "can never have more than 7 in any
     * Strand", a true Spellweaver may pass 10 at 1 Fraying per point), the
     * Bind ceiling, and whether a critical failure on a casting roll costs
     * a Fraying point. Set by the Talents Patterned in the Weave / Faded
     * Pattern, which the Wizard grants; editable here because a character
     * can become a Fade mid-campaign. */
    schema.pattern = new fields.StringField({
      required: true, blank: false, initial: "none",
      choices: ["none", "spellweaver", "fade"]
    });
    /* The Convocation chosen at creation (Ch.7 p.106) -- a template, not a
     * cage, so it is recorded as a label. Blank for a Spellweaver who built
     * their Binds and Strands freely. */
    schema.convocation = new fields.StringField({ required: true, blank: true });
    /* The True Name the Weave imprints on anyone Patterned in the Weave or
     * with a Faded Pattern. It is the ultimate Arcane Tether to its owner,
     * so it is a real, recorded fact about the character. */
    schema.trueName = new fields.StringField({ required: true, blank: true });
    /* p.312: "A Spellweaver's True Name is given at birth, and must be in the
     * language of their race or culture. To use a being's True Name, it must
     * be spoken aloud in the language of that name... requiring a successful
     * Language roll -- or else the spell using it will automatically fail."
     * The language is therefore mechanical, not flavour: it decides which
     * Language skill another caster has to roll to target this character
     * through their name, so it is recorded beside the name itself. */
    schema.trueNameLanguage = new fields.StringField({ required: true, blank: true });

    /* ---- Divine Magic (Ch.15) ----------------------------------------
     * Piety itself is a skill Item (group "Lore"), granted by the Godbound
     * Talent at 30 and capped at 90, and it already existed. What had no
     * home is everything around it: which god, which Domains that god
     * grants, the holy symbol's current Die Type, and whether the bond is
     * broken. All four are mechanical -- the Domains gate what can even be
     * asked for, the symbol adds +2 SLs until it depletes, and a Cast Out
     * Godbound gets no miracles at all until they atone. */
    schema.deity = new fields.StringField({ required: true, blank: true });
    schema.domains = new fields.ArrayField(
      new fields.StringField({ required: true, blank: false }), { required: true, initial: [] });
    /* "each use of the symbol requires a roll of its current Die Type
     * (starts at d12)... the Die Type diminishes one step on a roll of 1-2",
     * and below d6 it needs blessing before it helps again. Blank = none. */
    schema.holySymbol = new fields.StringField({
      required: true, blank: true, initial: "",
      choices: ["", "d12", "d10", "d8", "d6", "d4"]
    });
    schema.castOut = new fields.BooleanField({ initial: false });
    /* After atonement, "no Greater Miracles may be granted to the Godbound
     * for 1d6 game sessions" -- counted down, not remembered. */
    schema.noGreaterSessions = new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0, min: 0 });

    schema.goals = new fields.ArrayField(
      new fields.SchemaField({
        text: new fields.StringField({ required: true, blank: true }),
        kind: new fields.StringField({ required: true, blank: false, initial: "individual",
          choices: ["individual", "shared"] }),
        done: new fields.BooleanField({ initial: false }),
        /* Whether the XP for completing this goal has already been paid out.
         * Without it TBE: Advancement can only offer a flat "completed a
         * goal" tick that the player has to remember not to press twice,
         * which is exactly the sort of bookkeeping the sheet should do. */
        awarded: new fields.BooleanField({ initial: false })
      }),
      { required: true, initial: [] }
    );

    schema.personalityTraits = new fields.ArrayField(
      new fields.StringField({ required: true, blank: true }),
      { required: true, initial: [] }
    );

    return schema;
  }

  /* Ch.14 p.308: "Anytime a Spellweaver gains a point of Fraying, if their
   * new total Fraying points is more than their Max Resolve, they must
   * immediately make a Fraying Roll: Roll 1d100. If the result is less than
   * or equal to (Total Fraying - Max Resolve) x 2, the Spellweaver is
   * forcibly purged from the Tapestry of reality."
   *
   * Derived here so the sheet can print the live percentage. The book itself
   * argues for showing it: "it is generally better to let the player know
   * what their character's running total is. Losing a character all of a
   * sudden to Fraying shouldn't ever come as a complete surprise." */
  get frayingRisk() {
    const max = Number(this.resolve?.max) || 0;
    const fray = Number(this.fraying) || 0;
    const over = fray - max;
    return {
      fraying: fray, maxResolve: max, over,
      // The roll only happens once the total is MORE than Max Resolve.
      inRollTerritory: over > 0,
      percent: over > 0 ? Math.min(100, over * 2) : 0
    };
  }

  /* Spreads the base contract first, then adds what is specific to a
   * character. Without the spread this override silently dropped
   * initiativeEffective, armorInitPenalty, ll and wp -- and because those are
   * derived properties assigned onto this.system rather than declared schema
   * fields, Foundry's own getRollData() cannot supply them either. The
   * DataModel's getRollData() is their only route into a roll formula.
   *
   * The visible cost was that CONFIG.Combat.initiative rolls
   * "1d10 + @initiativeEffective", so every player character rolled 1d10 + 0
   * for initiative while every creature (which does not override this) rolled
   * correctly. Nothing errored, the number was just quietly wrong.
   *
   * Base owns the shared contract; subclasses only add. */
  getRollData() {
    return {
      ...super.getRollData(),
      deathThreshold: this.deathThreshold, resolve: this.resolve,
      toughness: this.toughness, size: this.size, race: this.race
    };
  }
}
