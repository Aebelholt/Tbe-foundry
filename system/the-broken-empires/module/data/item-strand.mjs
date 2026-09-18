import TBEItemBase from "./base-item.mjs";

/**
 * A Weave Magic Strand (Ch.14).
 *
 * Deliberately NOT a skill Item. A Strand is a 1-to-10 level track with its
 * own XP curve (spend XP equal to the next value, sequentially), not a 0-100
 * percentile skill, and pretending otherwise is why chargen used to hand
 * Spellweavers a placeholder "Strand, name it" at 0 that no rule could act on.
 *
 * Levels above 10 are legal for a true Spellweaver and cost 1 Fraying each
 * (p.124); a Fade is capped at 7 and is not limited by Thin Strands.
 */
export default class TBEStrand extends TBEItemBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.level = new fields.NumberField({
      required: true, nullable: false, integer: true, initial: 1, min: 0
    });
    // A Thin Strand is harder for this caster: it cannot be developed at
    // character creation and costs double to acquire later (p.105).
    schema.thin = new fields.BooleanField({ initial: false });

    return schema;
  }
}
