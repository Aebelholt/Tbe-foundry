import TheBrokenEmpiresItemBase from "./base-item.mjs";

export default class TheBrokenEmpiresSkill extends TheBrokenEmpiresItemBase {

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    // Replaces the CoC7-era hack of parsing "Heading (sub)" out of the item
    // name to fake a category. Group is a real field now.
    schema.group = new fields.StringField({
      required: true, blank: false, initial: "Adventuring",
      choices: ["Combat", "Adventuring", "Social", "Lore", "Language", "Wise", "Bind"]
    });
    schema.value = new fields.NumberField({ required: true, nullable: false, integer: true, initial: 20, min: 0 });
    // Whether this counts as a fighting/parry skill for defence purposes.
    schema.fighting = new fields.BooleanField({ initial: false });
    // Expertise (Ch.4 p.54, Ch.8 p.123): 0 = none, else 2/3/4 for Ex2-Ex4. On a
    // successful roll this guarantees at least that many SLs. Bought with XP
    // in ascending order (Ex2 -> Ex3 -> Ex4) and capped by the skill's own
    // value per the Skill Expertise Limits table (p.53): below 40 no
    // Expertise is possible at all, 40-59 caps at Ex2, 60-79 at Ex3, 80+ at
    // Ex4 -- there is no Ex1 tier. Both the cap and the ascending-purchase
    // order are enforced by TBE: Advancement, not by the schema itself.
    schema.expertise = new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0, min: 0, max: 4 });
    // The Savvy Talent (Ch.4 p.51) marks one skill with an "S": XP spent
    // improving it gets +1 added to the result (Ch.8 p.123).
    schema.savvy = new fields.BooleanField({ initial: false });

    return schema;
  }
}
