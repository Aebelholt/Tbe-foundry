/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
  return loadTemplates([
    // Actor partials.
    'systems/the-broken-empires/templates/actor/parts/actor-identity.hbs',
    'systems/the-broken-empires/templates/actor/parts/actor-talents.hbs',
    'systems/the-broken-empires/templates/actor/parts/actor-wounds.hbs',
    'systems/the-broken-empires/templates/actor/parts/actor-supply.hbs',
    'systems/the-broken-empires/templates/actor/parts/actor-skills.hbs',
    'systems/the-broken-empires/templates/actor/parts/actor-armour.hbs',
    'systems/the-broken-empires/templates/actor/parts/actor-items.hbs',
    'systems/the-broken-empires/templates/actor/parts/actor-effects.hbs',
    'systems/the-broken-empires/templates/actor/parts/actor-magic.hbs',
    // Item partials
    'systems/the-broken-empires/templates/item/parts/item-effects.hbs',
  ]);
};
