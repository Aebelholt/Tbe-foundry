import TheBrokenEmpiresDataModel from "./base-model.mjs";

export default class TheBrokenEmpiresItemBase extends TheBrokenEmpiresDataModel {

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = {};

    schema.description = new fields.StringField({ required: true, blank: true });

    return schema;
  }

}