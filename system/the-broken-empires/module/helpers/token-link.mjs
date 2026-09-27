/* Character tokens that are not linked to their actor (v0.54.0).
 *
 * An unlinked token carries a private copy of its actor (Foundry's "actor
 * delta"). For a player character that copy is where work goes missing: build
 * a character with the token selected and the build lands in the token, not
 * in the sidebar actor; link the token later and the sidebar actor, never
 * touched, takes its place. The build looks reverted, but it is still in the
 * token until something overwrites it.
 *
 * This finds those tokens and links them, letting the GM say which version
 * wins. It never guesses: a token whose copy holds items or changed values is
 * reported as holding a build, and linking it is the GM's call.
 *
 * Pure planning (findUnlinkedCharacters) and a writer (linkToken) that takes
 * what it needs, so a Node check can run both.
 */

/** What the token's private copy holds beyond its sidebar actor. */
export function deltaSummary(token) {
  const delta = token?.delta;
  const obj = delta?.toObject ? delta.toObject() : (delta || {});
  const items = Array.isArray(obj.items) ? obj.items.length : (delta?.items?.size ?? 0);
  const system = obj.system && typeof obj.system === "object" ? Object.keys(obj.system).length : 0;
  const renamed = obj.name ? 1 : 0;
  return { items, system, renamed, hasBuild: items > 0 || system > 0 || renamed > 0 };
}

/**
 * Every placed token of a Character actor that is not linked.
 * @returns [{ scene, token, actor, summary }]
 */
export function findUnlinkedCharacters(scenes, actorsById) {
  const out = [];
  for (const scene of scenes || []) {
    for (const token of scene.tokens || []) {
      if (token.actorLink) continue;
      const actor = actorsById(token.actorId);
      if (!actor || actor.type !== "character") continue;
      out.push({ scene, token, actor, summary: deltaSummary(token) });
    }
  }
  return out;
}

/**
 * Link a token to its sidebar actor.
 *   keep "token": the token's copy becomes the sidebar actor first (its
 *                 values, name, image and Items), then the token is linked.
 *   keep "actor": the token is linked and shows the sidebar actor as it is.
 * Items are replaced only after the new ones exist, so a failure part way
 * leaves the actor with MORE, never with none.
 */
export async function linkToken(entry, keep) {
  const { token, actor } = entry;
  if (keep === "token") {
    const copy = token.actor;
    if (!copy) throw new Error("the token has no actor copy to keep");
    const data = copy.toObject();
    const oldIds = actor.items.map((i) => i.id);
    const items = (data.items || []).map((i) => { const x = Object.assign({}, i); delete x._id; return x; });
    if (items.length) await actor.createEmbeddedDocuments("Item", items);
    if (oldIds.length) await actor.deleteEmbeddedDocuments("Item", oldIds);
    await actor.update({ name: data.name, img: data.img, system: data.system, "prototypeToken.name": data.name });
  }
  await token.update({ actorLink: true, name: keep === "token" ? token.actor?.name ?? token.name : actor.name });
  return true;
}

/** The report line for the world check card, or null. */
export function unlinkedToHtml(found) {
  if (!found?.length) return null;
  const built = found.filter((f) => f.summary.hasBuild);
  return `<div style="margin-top:6px;border-top:1px solid #7a6a4f;padding-top:4px">` +
    `<b>${found.length} Character token(s) are not linked to their actor</b>` +
    (built.length ? `, and <b>${built.length}</b> hold their own copy of the character (` +
      built.slice(0, 5).map((f) => `${f.token.name} on ${f.scene.name}: ${f.summary.items} item(s)`).join("; ") +
      (built.length > 5 ? "; ..." : "") + `)` : "") +
    `. Work done with an unlinked token lands in that token, not the actor in the sidebar. ` +
    `Run <b>TBE: Link Character Tokens</b> to link them and choose, for each, whether the token's copy or ` +
    `the sidebar actor is kept. Nothing has been changed.</div>`;
}
