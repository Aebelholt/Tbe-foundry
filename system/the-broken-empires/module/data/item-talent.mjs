import TheBrokenEmpiresItemBase from "./base-item.mjs";

/**
 * A Talent (Ch.4). Unlike Culture or Previous Career, Talents keep mattering
 * after character creation: Enhanced Defense, Armor Training and Solo
 * Constitution change rolls every session, so they are owned Items with real
 * fields rather than a line of prose in the notes.
 */
export default class TheBrokenEmpiresTalent extends TheBrokenEmpiresItemBase {

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.category = new fields.StringField({
      required: true, blank: false, initial: "Combat",
      choices: ["Combat", "Adventuring", "Social", "Lore", "Magic", "Miscellaneous", "Non-Human"]
    });
    // Verbatim prerequisite text from the book, e.g. "Armor Piercer and a
    // corresponding weapon skill of 80". Left as text on purpose: the
    // prerequisites are prose conditions a GM adjudicates, not a formula.
    schema.requirements = new fields.StringField({ required: true, blank: true });
    // Several Talents are bought more than once ("Can be purchased once per
    // weapon type", "up to three times", Armor Training I-IV).
    schema.ranks = new fields.NumberField({ required: true, nullable: false, integer: true, initial: 1, min: 1 });
    schema.maxRanks = new fields.StringField({ required: true, blank: true, initial: "once" });
    // What the rank was spent on, where the Talent asks you to pick: a weapon
    // type for Armor Piercer, a Combat skill for Precise Strike, a location
    // for Grit.
    schema.specialization = new fields.StringField({ required: true, blank: true });
    // True for the book's indented Talents that extend a parent Talent.
    schema.sub = new fields.BooleanField({ initial: false });

    return schema;
  }
}
