import TheBrokenEmpiresActorBase, { LOCATIONS } from "./base-actor.mjs";

export default class TheBrokenEmpiresCreature extends TheBrokenEmpiresActorBase {

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    schema.difficulty = new fields.StringField({
      required: true, blank: true, initial: "Medium",
      choices: ["Simple", "Easy", "Medium", "Challenging", "Hard", "Severe", "Extreme"]
    });
    schema.initiative = new fields.StringField({ required: true, blank: true, initial: "" });
    // Both already present in every bestiary stat block; the first port dropped
    // them into flags where nothing could read them.
    schema.ferocity = new fields.StringField({ required: true, blank: true, initial: "" });
    schema.move = new fields.StringField({ required: true, blank: true, initial: "" });

    // Bestiary armour grid (Ch.18): natural AP plus any worn/shield AP, per
    // location. Distinct from a PC, who reads AP off worn Armor/Shield items
    // instead (see base-item.mjs weapon/armor schemas).
    const armourLocation = () => new fields.SchemaField({
      natural: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
      worn: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 })
    });
    schema.armour = new fields.SchemaField(
      LOCATIONS.reduce((obj, loc) => { obj[loc] = armourLocation(); return obj; }, {})
    );

    return schema;
  }
}
