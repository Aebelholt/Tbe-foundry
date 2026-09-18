/**
 * Actor writes — may this user change this actor, and what happens when they
 * may not.
 *
 * THE OWNER of that question. Before this module there was no owner and 68
 * write sites across 24 macro files, and the interesting part is not that they
 * lacked a permission check. It is what a good half of them did INSTEAD:
 *
 *     try { await this.actor.update({ "system.resolve.value": cur - 1 }); }
 *     catch (e) {}
 *     body += "<div>The spell is not cast. 1 Resolve spent.</div>";
 *
 * That is `tbe-cast.js` before v0.38.0, and it is worse than an unguarded
 * write. Foundry THROWS when a user updates a document they do not own. The
 * throw was caught, discarded, and then the chat card asserted the cost
 * anyway. Under solo that code was unreachable -- one user, who was the GM,
 * who owned everything. Under a GM and players it is reachable constantly,
 * and what it produces is a card that lies: the Resolve is still in the pool,
 * the Weave Scar was never written, the Death Threshold never moved, and the
 * table has a message in the log saying otherwise. Nobody gets an error.
 * Everybody reads the wrong number.
 *
 * So this module does not merely answer "can they?". It makes TELLING THE
 * TRUTH the shortest path, because a guard that is more work than a bare
 * `.update()` inside a `try` will lose to the bare `.update()` inside a `try`
 * every time somebody is in a hurry. `applyWrite()` returns a report, and the
 * report carries the sentence the card should print when the write did not
 * happen. A caller that prints `report.notice` is correct; a caller that
 * ignores it is visibly ignoring something.
 *
 * WHAT THIS OWNS:
 *   - whether a given user may write to a given actor (`canWrite`)
 *   - which actor a macro is acting on in the first place (`pickActor`)
 *   - the wording of a refusal (`denialNotice`)
 *   - performing a write and reporting honestly (`applyWrite`)
 *
 * WHAT IT DOES NOT OWN: what the write should contain, or whether the rules
 * permit the action. That is the macro's business. This only owns whether the
 * write can land and what is said when it cannot.
 *
 * WHAT IT MUST NEVER DO: damage. CLAUDE.md rule 6 -- "nothing you build may
 * punish a reasonable mistake." A player who runs a macro against an actor
 * they do not own has made a reasonable mistake. The answer is a sentence,
 * never a partial application, and never a silent one.
 *
 * AMBIENT STATE: none, on purpose. `visibility.mjs` shipped two bugs in
 * v0.34.0 by reaching for globals a Node harness does not have, and both were
 * invisible to reading the source. Everything here takes its user and its
 * actor as arguments.
 */

/* ------------------------------------------------------------------ *
 *  Can this user write?
 * ------------------------------------------------------------------ */

/**
 * The one implementation of "may this user change this actor".
 *
 * Foundry offers two spellings and they are not interchangeable. `isOwner` is
 * evaluated against the CURRENT user, which is right inside a sheet and wrong
 * anywhere a user is passed in. `testUserPermission(user, "OWNER")` is right
 * in both cases but only exists on a real Document. Prefer the explicit form
 * when a user is supplied and the method exists, fall back to `isOwner`, and
 * treat a missing actor as "no" rather than throwing -- a macro run with
 * nothing selected is an ordinary situation, not an error.
 *
 * A GM passes on both paths; Foundry gives GMs OWNER on everything. That is
 * deliberate and this module does not second-guess it. "Should the GM be
 * allowed" is not a permission question, it is a rules question.
 */
export function canWrite(actor, user = null) {
  if (!actor) return false;
  if (user && typeof actor.testUserPermission === "function") {
    return !!actor.testUserPermission(user, "OWNER");
  }
  if ("isOwner" in actor || actor.isOwner !== undefined) return !!actor.isOwner;

  /* Neither spelling exists, so this is not a permission-controlled Document
     at all -- it is a plain object: a Node test harness's stub, or the legacy
     standalone pack. Refusing here would not protect anybody, because there is
     nobody to protect it from; it would just make every helper that writes
     through this silently do nothing outside Foundry, which is how seven check
     scripts went red the first time this module shipped.
     ABSENT is not the same as FALSE. `isOwner: false` is a real Document
     saying no and is honoured above. In real Foundry every Document has
     `isOwner`, so this branch is unreachable in production and cannot loosen
     anything there. */
  return true;
}

/* ------------------------------------------------------------------ *
 *  Which actor am I acting on?
 * ------------------------------------------------------------------ */

/**
 * The rule behind `TBE.me()`, extracted so it can be executed by a test
 * rather than read.
 *
 * The bug being fixed: it used to be
 *
 *     canvas.tokens?.controlled?.[0]?.actor ?? game.user?.character ?? null
 *
 * which under solo was exactly right -- one user, every token theirs, the
 * selection IS the intent. Under a GM and players it silently answers the
 * wrong question in two directions:
 *
 *   1. A player clicks a creature's token to read its Armour, leaves it
 *      selected, and opens TBE: Wounds. Every write in that macro now targets
 *      the GM's creature. The player owns nothing on it, so the writes throw,
 *      and the macros that swallow the throw report success against an actor
 *      that was never theirs to begin with.
 *   2. A player with a teammate's token selected acts on the TEAMMATE, which
 *      is the same failure with a friendlier face.
 *
 * The fix is not to stop preferring the selection -- for a GM, selection is
 * the only way to say which of forty creatures they mean, and a GM owns them
 * all so nothing is ambiguous. The fix is to prefer the first controlled
 * token the user can ACTUALLY WRITE TO, and only then fall back. A GM is
 * unaffected (they can write to everything, so the first controlled token
 * still wins). A player who has someone else's token selected falls through
 * to their own assigned character, which is what they meant.
 *
 * `reason` is returned so a caller can say something specific when the
 * selection was ignored, instead of acting on a different actor without
 * comment. Silence is how the original bug stayed invisible.
 */
export function pickActor({ controlled = [], assigned = null, user = null } = {}) {
  const tokens = Array.isArray(controlled) ? controlled : [];
  const actors = tokens.map((t) => t?.actor).filter(Boolean);

  const writable = actors.find((a) => canWrite(a, user));
  if (writable) return { actor: writable, reason: "controlled" };

  /* Something is selected, but none of it is theirs. Falling back is right,
     and saying so is what stops it being the old silent switch. */
  if (actors.length && assigned) {
    return {
      actor: assigned,
      reason: "fallback",
      ignored: actors[0]?.name ?? null
    };
  }
  if (assigned) return { actor: assigned, reason: "assigned" };

  /* A selection exists but is unwritable and there is no assigned character.
     Hand it back anyway: plenty of TBE macros only READ the actor (encNote,
     riderNote, the Haggle dialog's silver display), and refusing to return an
     actor would break reading for the sake of a write that may never come.
     `canWrite` is false on it, so any write still reports honestly. */
  if (actors.length) return { actor: actors[0], reason: "readonly" };

  return { actor: null, reason: "none" };
}

/* ------------------------------------------------------------------ *
 *  Saying no
 * ------------------------------------------------------------------ */

/**
 * The sentence shown when a write did not land.
 *
 * `what` names the change in the player's language, not the field's: "the 1
 * Resolve", "the Death Threshold". It is stitched into "... was not applied",
 * so it reads as a noun phrase. `_onSkillRoll` has carried this exact shape
 * since v0.31.0 ("You do not own X, so the 2 Resolve was not spent. The roll
 * still used the bonus.") and it was the only site in the codebase that got
 * this right; this generalises it rather than inventing a second voice.
 */
export function denialNotice(actorName, what = "the change") {
  return `You do not own ${actorName || "that actor"}, so ${what} was not applied. Ask the GM to apply it.`;
}

/* ------------------------------------------------------------------ *
 *  Writing
 * ------------------------------------------------------------------ */

/**
 * Write to an actor, or report exactly why not. Never throws, never lies.
 *
 * Returns `{ ok, notice, error }`:
 *   ok     - did the change actually land
 *   notice - the sentence to show when it did not (null when it did)
 *   error  - set when the write was PERMITTED but still failed (a validation
 *            error, a lost connection). Distinguished from a refusal because
 *            they need different words: one is "you can't", the other is
 *            "something broke", and calling the second one a permission
 *            problem sends the player to the GM for no reason.
 *
 * The caller is expected to put `notice` where the player will see it. The
 * report is the product; the write is a side effect.
 */
export async function applyWrite(actor, changes, { what = "the change", user = null, notify = null } = {}) {
  if (!actor) {
    const notice = "No actor to change. Select your token, or assign a character to your user.";
    notify?.(notice);
    return { ok: false, notice, error: null };
  }
  if (!canWrite(actor, user)) {
    const notice = denialNotice(actor.name, what);
    notify?.(notice);
    return { ok: false, notice, error: null };
  }
  try {
    await actor.update(changes);
    return { ok: true, notice: null, error: null };
  } catch (err) {
    /* Permitted and still failed. Say so plainly rather than swallowing it,
       which is the whole reason this module exists. */
    const notice = `${what} could not be saved to ${actor.name}: ${err?.message ?? err}`;
    notify?.(notice);
    return { ok: false, notice, error: err };
  }
}

/**
 * The same contract for an embedded Item (a Bind's remaining value, a
 * Talent's ranks, an enchantment's charges). Permission on an Item is the
 * parent actor's permission, which is why this is here and not a second
 * module: it is the same rule, asked about a different document.
 */
export async function applyItemWrite(item, changes, { what = "the change", user = null, notify = null } = {}) {
  if (!item) {
    const notice = "No item to change.";
    notify?.(notice);
    return { ok: false, notice, error: null };
  }
  const owner = item.parent ?? item;
  if (!canWrite(owner, user)) {
    const notice = denialNotice(owner?.name ?? item.name, what);
    notify?.(notice);
    return { ok: false, notice, error: null };
  }
  try {
    await item.update(changes);
    return { ok: true, notice: null, error: null };
  } catch (err) {
    const notice = `${what} could not be saved to ${item.name}: ${err?.message ?? err}`;
    notify?.(notice);
    return { ok: false, notice, error: err };
  }
}
