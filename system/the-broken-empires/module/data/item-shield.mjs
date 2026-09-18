import TheBrokenEmpiresItemBase from "./base-item.mjs";

export default class TheBrokenEmpiresShield extends TheBrokenEmpiresItemBase {

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.ap = new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0, min: 0 });
    // Ch.9 p.129 Encumbrance, same as weapons: how cumbersome to carry, and
    // whether it's At Hand (shares the 6 ENC Weapons at Hand pool) or Stored
    // (counts against Inventory ENC instead).
    schema.enc = new fields.NumberField({ required: true, nullable: false, integer: true, initial: 1, min: 0 });
    /* Weapon Readiness (Ch.9 p.129). Three states, not two:
     *   ready  - "Held and Ready: Already in your hand, no action needed"
     *   hand   - "At Hand: Drawn by Performing a Minor Action (must fit within
     *            your 6 ENC of Weapons At Hand)"
     *   stored - "Stored: In Inventory, takes 2 full actions to retrieve"
     * ready and hand both sit in the 6 ENC Weapons At Hand pool; stored counts
     * against Inventory instead. "hand" stays the default because At Hand is
     * the normal way to carry a weapon -- a sheet that assumed everything was
     * already drawn would be claiming an action nobody spent. */
    schema.carried = new fields.StringField({ required: true, initial: "hand", choices: ["ready", "hand", "stored", "dropped"] });
    // SL cost to perform a Shield Bash Maneuver (p.140 table): Small 7,
    // Medium 6, Large 5. Null means this shield can't Shield Bash at all
    // (a Buckler).
    schema.shb = new fields.NumberField({ required: false, nullable: true, integer: true, initial: null, min: 0 });

    return schema;
  }
}
