import TheBrokenEmpiresItemBase from "./base-item.mjs";

export default class TheBrokenEmpiresArmor extends TheBrokenEmpiresItemBase {

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.ap = new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0, min: 0 });
    // Ch.9 p.141: "Add up the Bulk from each piece of worn armor and divide
    // by 3, rounding up" for an Initiative penalty. Not an integer -- the
    // lightest piece (Padding) is 0.5 Bulk on its own, per the book's own
    // table, and only sums to a whole number across a full loadout.
    schema.bulk = new fields.NumberField({ required: true, nullable: false, integer: false, initial: 0, min: 0 });
    // "Armor protects individual hit locations... Armor may not be layered;
    // each location can have only one type of armor protecting it" (p.140).
    // One Item is one piece, so it needs to say which of the six hit
    // locations (matching base-actor.mjs's LOCATIONS/wounds keys) it is
    // actually worn on -- a full suit is several separate armor Items, one
    // per covered location, each checked in on the sheet.
    schema.locations = new fields.SchemaField({
      head: new fields.BooleanField({ initial: false }),
      body: new fields.BooleanField({ initial: false }),
      rArm: new fields.BooleanField({ initial: false }),
      lArm: new fields.BooleanField({ initial: false }),
      rLeg: new fields.BooleanField({ initial: false }),
      lLeg: new fields.BooleanField({ initial: false })
    });
    // Ch.9 p.129: worn armor costs no Inventory ENC ("each hit location can
    // hold 1 piece of armor, regardless of its bulk"); carried-but-not-worn
    // armor costs 1 Inventory ENC per piece instead, and protects nothing.
    schema.equipped = new fields.BooleanField({ initial: true });

    return schema;
  }
}
