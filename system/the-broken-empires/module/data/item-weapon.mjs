import TheBrokenEmpiresItemBase from "./base-item.mjs";

export default class TheBrokenEmpiresWeapon extends TheBrokenEmpiresItemBase {

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    schema.dmg = new fields.NumberField({ ...requiredInteger, initial: 1, min: 0 });
    schema.nl = new fields.BooleanField({ initial: false }); // non-lethal
    // Combat Maneuver costs, in rolled SLs (Ch.10): Choose Location, Circumvent
    // Shield, Disarm, Trip. Real fields now, not flags.tbe.* on a CoC7 item.
    schema.cl = new fields.NumberField({ ...requiredInteger, initial: 3, min: 0 });
    schema.cs = new fields.NumberField({ ...requiredInteger, initial: 3, min: 0 });
    schema.dis = new fields.NumberField({ ...requiredInteger, initial: 4, min: 0 });
    schema.t = new fields.NumberField({ ...requiredInteger, initial: 5, min: 0 });
    // Free-text link to a skill item's name on the same actor (tolerant
    // matching happens in the macros, same as before).
    schema.skillName = new fields.StringField({ required: true, blank: true });
    schema.ranged = new fields.BooleanField({ initial: false });
    // Ch.9 p.129 Encumbrance: how cumbersome the piece is to carry.
    schema.enc = new fields.NumberField({ ...requiredInteger, initial: 1, min: 0 });
    // "At Hand" (readily reachable, up to 6 ENC total) or "Stored" (in
    // Inventory, 2 actions to retrieve, counts against Inventory ENC instead).
    /* Weapon Readiness (Ch.9 p.129). Four values, of which the book names three:
     *   ready  - "Held and Ready: Already in your hand, no action needed"
     *   hand   - "At Hand: Drawn by Performing a Minor Action (must fit within
     *            your 6 ENC of Weapons At Hand)"
     *   stored - "Stored: In Inventory, takes 2 full actions to retrieve"
     *   dropped - on the ground. NOT one of the book's three named states: the
     *            book covers it with "Dropping a weapon is a free action" and
     *            "picking a weapon up off the ground is an action (Perform a
     *            Minor Action)", plus an Athletics roll when Engaged. Modelled
     *            as a fourth enum value rather than a separate boolean so the
     *            data cannot encode "stored AND dropped".
     * ready and hand both sit in the 6 ENC Weapons At Hand pool; stored counts
     * against Inventory; dropped counts against NEITHER, because it is on the
     * floor. That mapping has one owner, CONFIG.TBE.carryPool -- do not test
     * `carried !== "stored"` anywhere, which is what made the pool wrong the
     * moment a fourth value appeared. "hand" stays the default because At Hand
     * is the normal way to carry a weapon -- a sheet that assumed everything
     * was already drawn would be claiming an action nobody spent. */
    schema.carried = new fields.StringField({ required: true, initial: "hand", choices: ["ready", "hand", "stored", "dropped"] });

    return schema;
  }
}
