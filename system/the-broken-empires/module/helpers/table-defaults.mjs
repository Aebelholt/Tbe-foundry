/* Table defaults (v0.54.0): the Foundry chores a GM otherwise repeats for
 * every actor, token and scene.
 *
 * Foundry leaves a new actor's token UNLINKED, with vision off and rotation
 * free, whatever the actor is. For a player character that is the wrong
 * default and a dangerous one: an unlinked token carries its own private copy
 * of the actor, so anything done to the token (Create Character run with it
 * selected, damage, a spent Resolve) lands in that copy and not in the sidebar
 * actor. Linking the token afterwards swaps the copy for the untouched sidebar
 * actor, and the work looks reverted. That is exactly what the playtest GM hit.
 *
 * So, per world setting, all on by default:
 *   linkCharacters   a Character's token is linked to its actor
 *   characterVision  a Character's token has vision enabled
 *   lockRotation     every new token (and every existing one, once) has
 *                    rotation locked
 *   sceneVision      new scenes have token vision on
 * Creatures are never linked: a bestiary entry is a template and each wolf on
 * the map is its own wolf.
 *
 * The decisions are pure functions over (settings, data) so a Node check can
 * run them; register() wires them to Foundry's preCreate hooks.
 */
export const SCOPE = "the-broken-empires";
export const FRIENDLY = 1;   /* CONST.TOKEN_DISPOSITIONS.FRIENDLY */

export const SETTINGS = [
  ["linkCharacters", "LinkCharacters", true],
  ["characterVision", "CharacterVision", true],
  ["lockRotation", "LockRotation", true],
  ["sceneVision", "SceneVision", true]
];

/** Prototype-token values a new actor of this type should get. */
export function actorDefaults(type, s) {
  const pt = {};
  if (s.lockRotation) pt.lockRotation = true;
  if (type === "character") {
    if (s.linkCharacters) pt.actorLink = true;
    if (s.characterVision) pt.sight = { enabled: true };
    pt.disposition = FRIENDLY;
  }
  return Object.keys(pt).length ? { prototypeToken: pt } : null;
}

/** Values a token being placed should get. */
export function tokenDefaults(actorType, s) {
  const t = {};
  if (s.lockRotation) t.lockRotation = true;
  if (actorType === "character") {
    if (s.linkCharacters) t.actorLink = true;
    if (s.characterVision) t.sight = { enabled: true };
  }
  return Object.keys(t).length ? t : null;
}

export function sceneDefaults(s) {
  return s.sceneVision ? { tokenVision: true } : null;
}

/**
 * The existing world, brought in line once (GM, first load with this build):
 * lock rotation on every actor's prototype and every placed token, and link +
 * vision on every Character's PROTOTYPE token. Placed Character tokens are
 * NOT linked here: an unlinked one may hold a build that linking would hide
 * (see token-link.mjs, which reports them and lets the GM choose).
 * Returns the plan; applyPlan() performs it.
 */
export function existingWorldPlan(actors, scenes, s) {
  const actorUpdates = [], tokenUpdates = [];
  for (const a of actors || []) {
    const pt = a.prototypeToken || {};
    const u = {};
    if (s.lockRotation && !pt.lockRotation) u["prototypeToken.lockRotation"] = true;
    if (a.type === "character") {
      if (s.linkCharacters && !pt.actorLink) u["prototypeToken.actorLink"] = true;
      if (s.characterVision && !pt.sight?.enabled) u["prototypeToken.sight.enabled"] = true;
    }
    if (Object.keys(u).length) actorUpdates.push(Object.assign({ _id: a.id }, u));
  }
  for (const sc of scenes || []) {
    const ups = [];
    for (const t of sc.tokens || []) if (s.lockRotation && !t.lockRotation) ups.push({ _id: t.id, lockRotation: true });
    if (ups.length) tokenUpdates.push({ scene: sc, updates: ups });
  }
  return { actorUpdates, tokenUpdates, count: actorUpdates.length + tokenUpdates.reduce((n, x) => n + x.updates.length, 0) };
}

export function settingsOf(get) {
  const out = {};
  for (const [key, , dflt] of SETTINGS) {
    try { out[key] = !!get(SCOPE, key); } catch (e) { out[key] = dflt; }
  }
  return out;
}

/** Settings and hooks. Called from the init hook. */
export function register() {
  for (const [key, label, dflt] of SETTINGS) {
    game.settings.register(SCOPE, key, {
      name: "TBE.Settings." + label + ".Name", hint: "TBE.Settings." + label + ".Hint",
      scope: "world", config: true, type: Boolean, default: dflt
    });
  }
  game.settings.register(SCOPE, "tableDefaultsApplied", { scope: "world", config: false, type: Boolean, default: false });
  const S = () => settingsOf((ns, k) => game.settings.get(ns, k));

  Hooks.on("preCreateActor", (doc) => {
    const u = actorDefaults(doc.type, S());
    if (u) doc.updateSource(u);
  });
  Hooks.on("preCreateToken", (doc, data) => {
    const actor = doc.actor ?? game.actors?.get(data?.actorId);
    const u = tokenDefaults(actor?.type, S());
    if (u) doc.updateSource(u);
  });
  Hooks.on("preCreateScene", (doc) => {
    const u = sceneDefaults(S());
    if (u) doc.updateSource(u);
  });
}

/** Once per world, GM only: bring existing actors and tokens in line. */
export async function applyToExistingWorld() {
  if (!game.user?.isGM || game.settings.get(SCOPE, "tableDefaultsApplied")) return null;
  const plan = existingWorldPlan(game.actors?.contents ?? [], game.scenes?.contents ?? [], settingsOf((ns, k) => game.settings.get(ns, k)));
  const failed = [];
  if (plan.actorUpdates.length) {
    try { await Actor.updateDocuments(plan.actorUpdates); } catch (err) { failed.push("actors: " + (err?.message || err)); }
  }
  for (const { scene, updates } of plan.tokenUpdates) {
    try { await scene.updateEmbeddedDocuments("Token", updates); } catch (err) { failed.push(scene.name + ": " + (err?.message || err)); }
  }
  /* Recorded only when every write landed, so a failure is retried next load. */
  if (!failed.length) await game.settings.set(SCOPE, "tableDefaultsApplied", true);
  return { count: plan.count, failed };
}
