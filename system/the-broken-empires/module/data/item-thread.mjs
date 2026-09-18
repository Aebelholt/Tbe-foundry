import TBEItemBase from "./base-item.mjs";

/**
 * A Thread of the Weave (Ch.14 p.305): physicalized raw magic, attuned to one
 * Bind or one Strand, that contributes Mastery to a casting.
 *
 * A real Item rather than a line in the notes because a Thread is spent: a
 * consumable's pool draws down, and a Thread Die steps to the next lower die
 * on a 1 or a 2 (a d6 crumbles outright). TBE: Cast writes those changes
 * back, which it cannot do to prose.
 */
export default class TBEThread extends TBEItemBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    // The Bind or Strand this Thread is attuned to. "A Control Thread can
    // only be used in spells that use the Control Bind; a Spirit Thread can
    // only be used with a spell using the Spirit Strand."
    schema.attunement = new fields.StringField({ required: true, blank: true });
    schema.kind = new fields.StringField({
      required: true, blank: false, initial: "die",
      choices: ["die", "consumable", "location"]
    });
    // Thread Die type. Rolled after a SUCCESSFUL Bind roll; a 1 or 2 still
    // gives that Mastery but steps the die down, and a d6 is expended.
    /* d4 is here for grimoires, which "have a Thread value of d4 to d12"
     * (p.316); ordinary Threads start at d6. */
    schema.die = new fields.StringField({
      required: true, blank: false, initial: "d8",
      choices: ["d4", "d6", "d8", "d10", "d12"]
    });
    /* Grimoires (p.316) are Threads with their own rules: ritual castings
     * only, "up to 3 Binds or Strands" in one book (so `attunement` holds a
     * comma-separated list rather than a single skill), a separate Thread Die
     * roll per applicable skill, and destruction on a maximum roll instead of
     * the ordinary step-down. Flagged rather than made a fourth Item type,
     * because everything else about a Thread already fits. */
    schema.grimoire = new fields.BooleanField({ initial: false });
    /* Weave Reagents (p.324) are the third flavour of this same shape, and
     * the book invites the comparison itself: "naturally occurring materials
     * similar to Threads that hold a trace of resonance from one of the ten
     * Strands." A reagent is a Strand plus a count, which is a consumable
     * Thread's `attunement` plus its `pool` -- so it is flagged here rather
     * than given a fourth Item type that would duplicate the whole schema.
     * They are spent to stand in for an enchantment's Fraying, and as the
     * active ingredient in alchemy; TBE: Cast excludes them from castings. */
    schema.reagent = new fields.BooleanField({ initial: false });
    // Consumable Threads: "a preset pool of Mastery to be used in whatever
    // amount or combination the caster decides before the item is gone."
    schema.pool = new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0, min: 0 });
    // Location-based Threads give a set number of Mastery points and "can be
    // called upon an unlimited number of times per day."
    schema.bonus = new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0, min: 0 });
    schema.expended = new fields.BooleanField({ initial: false });

    return schema;
  }
}
