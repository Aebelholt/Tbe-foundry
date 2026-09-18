import TheBrokenEmpiresDataModel from "./base-model.mjs";

const LOCATIONS = ["body", "rArm", "lArm", "rLeg", "lLeg", "head"];

/* Ch.18 Size ladder, smallest to largest. Index 5 (Medium) is the human
 * baseline. Size is not decoration: the gap between two combatants decides
 * Reach, whether a Grapple is even legal, whether Drive Back/Trip/Disarm are
 * available, whether an attack can be parried at all, and a flat +20 to hit. */
const SIZES = ["Minute", "Diminutive", "Tiny", "Little", "Small", "Medium",
  "Large", "Huge", "Massive", "Gargantuan", "Colossal"];
const MEDIUM_SIZE = SIZES.indexOf("Medium");

export default class TheBrokenEmpiresActorBase extends TheBrokenEmpiresDataModel {

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = {};

    // Death Threshold (formerly CoC7's HP) and Resolve (formerly MP).
    schema.deathThreshold = new fields.SchemaField({
      value: new fields.NumberField({ ...requiredInteger, initial: 20, min: 0 }),
      max: new fields.NumberField({ ...requiredInteger, initial: 20, min: 0 })
    });
    schema.resolve = new fields.SchemaField({
      value: new fields.NumberField({ ...requiredInteger, initial: 10, min: 0 }),
      max: new fields.NumberField({ ...requiredInteger, initial: 10, min: 0 })
    });

    schema.toughness = new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0 });
    // Ch.7 p.87: "Starting Initiative modifier is +10." A flat modifier added
    // to a d10 roll at the start of each combat round, reduced by worn armor.
    schema.initiative = new fields.NumberField({ required: true, nullable: false, integer: true, initial: 10 });
    schema.size = new fields.StringField({
      required: true, blank: false, initial: "Medium", choices: SIZES
    });
    // Permanent Lethality Level bonus from race (a Dwarf gets +1, Ch.5).
    schema.lethalityBonus = new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 });
    schema.fatigue = new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 });
    // Permanent Lethality Level reduction, from surviving sepsis (Ch.11).
    schema.lethalityPenalty = new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 });

    // Per-location wound record (Ch.11 hit locations). wp = accumulated Wound
    // Points, imp = impairment count, inf/septic = infection state, rb = the
    // Recovery Bonus once a wound has been treated (null = not yet set).
    // fw = how many of this location's Wound Points are fatigue-based (Ch.11
    // p.189): they are lethal and count toward the Death Threshold and
    // Infection checks like any other WP, which is why they live inside wp,
    // but they never become infected themselves, never take a Wound Die, and
    // cannot be treated with Heal or a Recovery roll -- only rest removes
    // them, one point per Fatigue removed. fwKind names the type (Weary from
    // travel, Weave from a mis-cast spell), since the book allows only one
    // wound of each type at a time.
    const woundLocation = () => new fields.SchemaField({
      wp: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
      imp: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
      inf: new fields.BooleanField({ initial: false }),
      septic: new fields.BooleanField({ initial: false }),
      rb: new fields.NumberField({ required: false, nullable: true, integer: true, initial: null }),
      fw: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
      fwKind: new fields.StringField({ required: true, blank: true, initial: "" })
    });
    schema.wounds = new fields.SchemaField(
      LOCATIONS.reduce((obj, loc) => { obj[loc] = woundLocation(); return obj; }, {})
    );
    // Whole-character Shock state (Ch.11): triggered by a second impairment
    // anywhere, an even-die Head impairment, or a failed Body Endurance roll.
    // Kept as an explicit flag rather than derived, since it can't always be
    // reconstructed purely from wound counts (see the Head-even case).
    schema.shock = new fields.BooleanField({ initial: false });

    // Supply dice (Ch.9): die size in {0, 6, 8, 10, 12}, 0 = exhausted.
    const supplyDie = () => new fields.NumberField({ ...requiredInteger, initial: 8, min: 0, max: 12 });
    schema.supply = new fields.SchemaField({
      gear: supplyDie(), ammo: supplyDie(), medical: supplyDie(), rations: supplyDie()
    });

    schema.biography = new fields.HTMLField({ required: true, blank: true });

    return schema;
  }

  /** Total lethal Wound Points across all locations. */
  get totalWp() {
    return LOCATIONS.reduce((sum, loc) => sum + (this.wounds[loc]?.wp ?? 0), 0);
  }

  /** Lethality Level: ceil(Death Threshold / 3), plus any racial bonus, minus any permanent penalty from sepsis. */
  get lethalityLevel() {
    const dt = this.deathThreshold.max;
    return dt ? Math.max(0, Math.ceil(dt / 3) + this.lethalityBonus - this.lethalityPenalty) : 0;
  }

  /** Position on the Size ladder. Medium (the human baseline) is 5. */
  get sizeIndex() {
    const i = SIZES.indexOf(this.size);
    return i < 0 ? MEDIUM_SIZE : i;
  }

  /** Steps above (positive) or below (negative) Medium. */
  get sizeOffset() {
    return this.sizeIndex - MEDIUM_SIZE;
  }

  get dying() {
    return this.deathThreshold.max > 0 && this.shock && this.totalWp > this.lethalityLevel;
  }

  /* Nothing to derive here that the getters above don't already give a
   * caller directly: totalWp, lethalityLevel, dying, sizeIndex are all
   * computed on read, not cached. This method used to eagerly copy each of
   * them onto this.wp / this.ll / this.isDying / this.sizeIdx as well --
   * checked against the whole tree and nothing anywhere reads system.wp,
   * system.ll, or either of the other two by name (getRollData() below
   * computes its own "wp"/"ll" roll-data keys straight from the getters,
   * not from these). Four lines of genuinely dead derived state, removed
   * rather than namespaced -- see CLAUDE.md's derived-data rule for the
   * three fields (armorBulk/armorInitPenalty/initiativeEffective, in
   * documents/actor.mjs) that ARE live and do need it. Kept as an empty
   * override, not deleted outright, so a future derived field has an
   * obvious home and this note stays attached to it. */
  prepareDerivedData() {}

  /* What @-references in a roll formula can see. The initiative formula
   * registered at init resolves @initiativeEffective from here. */
  getRollData() {
    return {
      initiative: this.initiative,
      initiativeEffective: this.initiativeEffective ?? this.initiative,
      armorInitPenalty: this.armorInitPenalty ?? 0,
      toughness: this.toughness,
      ll: this.lethalityLevel,
      wp: this.totalWp
    };
  }
}

export { LOCATIONS, SIZES, MEDIUM_SIZE };
