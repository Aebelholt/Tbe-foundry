/**
 * Chat visibility — who can see a card this system posts.
 *
 * THE OWNER of that question. Before v0.34.0 there was no owner and five
 * partial implementations: `TBE.say()` in the macro pack posted all 59 of its
 * cards publicly with no way to whisper; `actor-sheet.mjs`'s `_onSkillRoll`
 * called `roll.toMessage()` with no roll mode; `documents/item.mjs` read
 * `game.settings.get('core', 'rollMode')` correctly but is largely leftover
 * template boilerplate; and the migration report hardcoded a GM whisper.
 * The one implementation that was right lived in the file nobody uses.
 *
 * That was survivable while this was a solo system, because there was one
 * pair of eyes and "public" and "private" meant the same thing. Seb changed
 * the scope on 2026-09-17 — a GM and players, separate clients, one shared
 * chat log — and it stopped being survivable. A GM could not roll anything
 * privately. TBE: Social Encounter's Tolerance option is the sharpest case:
 * the book says (p.251) "The Tolerance is hidden from the players, so they
 * will never know for sure how many opportunities they have left," and the
 * macro delivered that by evaluating the 2d10 and then never showing it to
 * anyone, including the GM, because showing it to the GM alone was not
 * possible. The rule was honoured by destroying the information.
 *
 * WHAT THIS OWNS: resolving an effective roll mode and applying it to a chat
 * payload. It does not own what a card SAYS, and it deliberately does not own
 * the decision of whether a given card is secret — that is a rules question
 * belonging to the macro or sheet that knows what it is posting. What it does
 * own is that "secret" means the same thing everywhere.
 *
 * WHAT IT DOES NOT DO: hide anything from the GM. Every mode here is either
 * public, or visible to the GM. A system that keeps a number from the person
 * adjudicating is not being secret, it is being broken — which is exactly the
 * bug this module was written to fix.
 */

/* Foundry's four core roll modes. Named here rather than reaching for
 * CONST.DICE_ROLL_MODES at every call site so the macro pack (which cannot
 * import, and may run in a Node harness with no CONST at all) and the system
 * agree on the strings without either one hardcoding them twice. */
export const MODES = Object.freeze({
  PUBLIC: "publicroll",
  PRIVATE: "gmroll",     // whispered to the GMs, roller sees their own
  BLIND: "blindroll",    // GMs only; the roller does not see the result
  SELF: "selfroll"       // the roller alone
});

/** Modes that mean "the table must not see this." */
const HIDDEN = new Set([MODES.PRIVATE, MODES.BLIND, MODES.SELF]);

export const isHidden = (mode) => HIDDEN.has(mode);

/**
 * The mode a card should actually post at.
 *
 * Precedence, and the reasoning for it:
 *   1. An explicit mode passed by the caller. There are exactly two reasons
 *      to pass one, and "I would rather this were quiet" is not among them:
 *        (a) the BOOK makes it secret -- the hidden Tolerance roll (p.251).
 *            A rule in print outranks a dropdown.
 *        (b) it is GM HOUSEKEEPING rather than a game event -- the migration
 *            report, TBE: Update Macros. Maintenance output is not part of the
 *            fiction and should not land in the middle of the table's chat.
 *      Anything that IS a game event follows the dropdown, whatever its author
 *      thinks it should do.
 *   2. The user's own selection in the chat roll-mode dropdown. This is the
 *      convention every well-behaved Foundry system follows and it is what a
 *      GM reaches for by reflex; ignoring it is why the pre-0.34.0 system
 *      felt broken at a real table.
 *   3. Public.
 *
 * `settingsGet` is injected rather than read off a global so this is testable
 * without a live `game`, and so the macro pack's Node fallback can call the
 * same function. A throwing or absent setting degrades to public, never to a
 * silent whisper — a card that vanishes is worse than a card that overshares,
 * because nobody notices the first one.
 */
export function effectiveMode(explicit, settingsGet) {
  if (typeof explicit === "string" && explicit) return explicit;
  try {
    const chosen = settingsGet?.("core", "rollMode");
    if (typeof chosen === "string" && chosen) return chosen;
  } catch (err) {
    /* No core setting registered (a Node harness, or a very early hook).
       Public is the honest default: see the comment above. */
  }
  return MODES.PUBLIC;
}

/**
 * Apply a mode to a chat-message payload, returning the payload.
 *
 * Prefers Foundry's own `ChatMessage.applyRollMode`, which is what keeps this
 * correct as the framework changes the shape of whisper/blind underneath us.
 * Feature-detected rather than version-gated, per CLAUDE.md rule 7: a shim, a
 * backport or the next generation makes a version number a lie, and the shape
 * never lies.
 *
 * The fallback is deliberately conservative and covers the same four modes by
 * hand, because a fallback that silently posts publicly would reintroduce the
 * exact defect this module exists to remove.
 */
export function applyVisibility(data, mode, { ChatMessageClass, gmIds, selfId } = {}) {
  const CM = ChatMessageClass ?? (typeof ChatMessage !== "undefined" ? ChatMessage : null);

  if (CM && typeof CM.applyRollMode === "function") {
    CM.applyRollMode(data, mode);
    return data;
  }

  /* Hand-rolled equivalent. */
  const gms = gmIds ?? (CM && typeof CM.getWhisperRecipients === "function"
    ? CM.getWhisperRecipients("GM").map((u) => u.id ?? u)
    : []);

  switch (mode) {
    case MODES.PRIVATE:
      data.whisper = gms;
      break;
    case MODES.BLIND:
      data.whisper = gms;
      data.blind = true;
      break;
    case MODES.SELF:
      /* Who "self" is has to be PASSED IN. An earlier draft read `data.user`,
         which nothing populates, so selfroll silently whispered to nobody --
         a card that vanishes. Caught by visibility_check.mjs section 5, which
         compares this against the macro pack's own fallback instead of reading
         either one. Same lesson as `ChatMessageClass` above: a rule module
         does not get to assume ambient state. */
      data.whisper = [selfId ?? data.user ?? null].filter(Boolean);
      break;
    default:
      /* Public. Clear any whisper a caller may have set so a reused payload
         object cannot leak a previous card's audience. */
      data.whisper = [];
      data.blind = false;
  }
  return data;
}

/**
 * One call for the common case: resolve the mode, apply it, hand back the
 * payload. This is what `TBE.say` and the sheet both go through.
 */
export function prepare(data, { mode, settingsGet, ChatMessageClass, gmIds, selfId } = {}) {
  return applyVisibility(data, effectiveMode(mode, settingsGet), { ChatMessageClass, gmIds, selfId });
}
