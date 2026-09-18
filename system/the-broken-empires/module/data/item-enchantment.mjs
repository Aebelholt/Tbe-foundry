import TBEItemBase from "./base-item.mjs";

/**
 * An enchanted item or an alchemical potion (Ch.14 p.322-326).
 *
 * One Item type for both because the book makes them one thing: "Alchemy is a
 * simplified form of enchantment, performed on liquids... Like enchantment, it
 * binds a spell into a physical vessel so that the substance itself becomes
 * the caster when consumed." A potion is the single-use case with doses
 * instead of charges and no Fraying, so `kind` discriminates rather than a
 * second type duplicating the whole schema.
 *
 * A real Item rather than a note because every field here is spent, rolled or
 * checked at the table: charges draw down, a Use Die can go inert, doses run
 * out, an unstable batch collapses, and the stored Bind roll is the fixed
 * number anyone resisting it has to beat. TBE: Use Enchanted Item writes all
 * of that back.
 */
export default class TBEEnchantment extends TBEItemBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    /* "Enchanted items work either with a Die Type, or they have finite
     * charges... An item cannot possess both a Use Die and a Charge pool;
     * choose one when it is created." Single-use is the 0-Fraying case, and
     * potion is alchemy's version of it. */
    schema.kind = new fields.StringField({
      required: true, blank: false, initial: "charges",
      choices: ["die", "charges", "single", "potion"]
    });

    /* Use Die (p.322). Rolled after each use: on a 1 or 2 the item goes inert
     * for 1-6 days -- 1-4 if the enchantment is unstable. */
    schema.die = new fields.StringField({
      required: true, blank: false, initial: "d8",
      choices: ["d6", "d8", "d10", "d12"]
    });
    /* Days of inertness remaining, so an inert item stays inert across
     * sessions instead of being remembered by the player. */
    schema.inertDays = new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0, min: 0 });

    /* Charges, or a potion's doses from one batch. Capped at 30 by the book:
     * "No enchanted item may exceed d12 or 30 charges." Doses have no such
     * cap -- yield is 1d3 + 1 per 3 SLs -- so the max is generous. */
    schema.charges = new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0, min: 0 });
    schema.chargesMax = new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0, min: 0 });

    /* "If any Weave Reaction occurs during enchantment, regardless of type,
     * the resulting flaw becomes part of the item's Pattern." An unstable item
     * fails differently, and the difference is mechanical, so it is a field. */
    schema.unstable = new fields.BooleanField({ initial: false });
    /* Set once a single-use vessel is spent or a batch collapses: "the
     * masterwork item that contained it can never again serve as a vessel." */
    schema.spent = new fields.BooleanField({ initial: false });

    /* "the Bind roll becomes the item's fixed value for purposes of
     * resistance. Anyone resisting the item's magic must meet or beat that
     * roll to negate its effect." */
    schema.resistance = new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0, min: 0 });

    /* What is stored, and by whose art. The spell is fixed at creation --
     * "its Duration, Target, Range, and Effect are fixed at the time of
     * creation" -- so it is recorded as text rather than re-costed each use. */
    schema.spell = new fields.StringField({ required: true, blank: true });
    schema.bind = new fields.StringField({ required: true, blank: true });
    schema.strand = new fields.StringField({ required: true, blank: true });
    schema.tc = new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0, min: 0 });

    /* "By default, only those who can manipulate the Weave (a Spellweaver or
     * Fade) can use the enchanted item... An item can be made usable by
     * anyone, but this costs +1 Fraying point," and needs an activation word
     * "either spoken aloud or inscribed upon it and activated by touch." */
    schema.anyoneCanUse = new fields.BooleanField({ initial: false });
    schema.activationWord = new fields.StringField({ required: true, blank: true });

    /* What making it cost its enchanter, in Fraying points and in reagents
     * spent instead of them. Recorded because it is the price of the thing
     * and a GM will be asked. */
    schema.frayingCost = new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0, min: 0 });
    schema.reagentsUsed = new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0, min: 0 });

    return schema;
  }
}
