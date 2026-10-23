/* Who clicked first: the guard for a button on a shared chat card (v0.57.0).
 *
 * CLAUDE.md, scope rule 3: a card with a button can be clicked by a player
 * and the GM in the same second, and anything it does must happen once.
 * Writing a "claimed" flag from each client is NOT enough: a document update
 * is not atomic, so both clients can read "unclaimed" and both write, and
 * both carry on. So one client decides: the active GM's. JavaScript runs one
 * thing at a time on that client, so its check-and-mark cannot interleave.
 *
 *   - The GM's own click asks the arbiter directly.
 *   - A player's click goes to the GM over the system socket and waits for
 *     the answer. No GM connected, or no answer in time: the player is told,
 *     and nothing happens. A refusal is a sentence, never a second action.
 *   - Every decision is also written to the message, flags[scope].claims,
 *     so a claim survives a reload and a later click is refused from the
 *     flag alone.
 *
 * Pure parts take what they touch as arguments (makeArbiter, makeClient), so
 * card_claim_check.mjs runs real concurrent clicks against them. No card
 * uses this yet: it exists so the first card button cannot ship unguarded.
 */
export const SCOPE = "the-broken-empires";
export const CHANNEL = "system." + SCOPE;
export const TIMEOUT_MS = 5000;
const safe = (s) => String(s ?? "").replace(/[^A-Za-z0-9_-]/g, "_");
export const claimPath = (action) => "flags." + SCOPE + ".claims." + safe(action);

/**
 * The single decider. readClaim(messageId, action) -> {by} | null reads the
 * message flag; writeClaim(...) persists one. Two layers keep it to one
 * winner even if the flag write is not visible yet: calls for the same key
 * are queued, and a decision once made is remembered for this session.
 */
export function makeArbiter({ readClaim, writeClaim, now = () => Date.now() }) {
  const queue = new Map();
  const decided = new Map();
  return async function decide(messageId, action, userId) {
    const key = messageId + "|" + safe(action);
    const prior = queue.get(key) ?? Promise.resolve();
    const turn = prior.catch(() => {}).then(async () => {
      const known = decided.get(key) ?? readClaim(messageId, action);
      if (known?.by) { decided.set(key, known); return { ok: false, by: known.by }; }
      const claim = { by: userId, at: now() };
      decided.set(key, claim);
      try { await writeClaim(messageId, action, claim); }
      catch (err) { decided.delete(key); return { ok: false, by: null, error: String(err?.message ?? err) }; }
      return { ok: true, by: userId };
    });
    queue.set(key, turn);
    try { return await turn; } finally { if (queue.get(key) === turn) queue.delete(key); }
  };
}

/**
 * One client's side. isArbiter() says whether THIS client is the one GM that
 * decides; emit(payload) sends on the system socket; the caller feeds every
 * socket payload to handle(). names(userId) gives a display name.
 */
export function makeClient({ userId, isArbiter, hasArbiter, arbiter, emit, names = (id) => id, timeoutMs = TIMEOUT_MS,
  setTimer = setTimeout, clearTimer = clearTimeout }) {
  const waiting = new Map();
  let seq = 0;
  const sentence = (r) => (r.ok ? null : r.by ? "Already done: " + names(r.by) + " clicked it first."
    : r.error ? "That could not be recorded (" + r.error + "), so nothing was done." : "Nothing was done.");
  async function claim(messageId, action) {
    if (isArbiter()) { const r = await arbiter(messageId, action, userId); return { ...r, notice: sentence(r) }; }
    if (!hasArbiter()) return { ok: false, by: null, notice: "This needs the GM connected, to settle who clicked first. Nothing was done." };
    const requestId = userId + ":" + (++seq);
    return new Promise((resolve) => {
      const timer = setTimer(() => {
        waiting.delete(requestId);
        resolve({ ok: false, by: null, notice: "The GM's client did not answer, so nothing was done. Try again." });
      }, timeoutMs);
      waiting.set(requestId, (r) => { clearTimer(timer); resolve({ ...r, notice: sentence(r) }); });
      emit({ type: "claim", requestId, messageId, action, userId });
    });
  }
  async function handle(p) {
    if (!p || typeof p !== "object") return;
    if (p.type === "claim" && isArbiter()) {
      const r = await arbiter(p.messageId, p.action, p.userId);
      emit({ type: "claimReply", requestId: p.requestId, to: p.userId, result: r });
    } else if (p.type === "claimReply" && p.to === userId) {
      const done = waiting.get(p.requestId);
      if (done) { waiting.delete(p.requestId); done(p.result); }
    }
  }
  return { claim, handle };
}

/** The one GM that decides: Foundry's activeGM where the API has it, else
 *  the active GM with the lowest id, so every client agrees on the same one. */
export function arbiterId(users) {
  const list = users?.contents ?? Array.from(users ?? []);
  if (users && "activeGM" in users) return users.activeGM?.id ?? null;
  const gms = list.filter((u) => u.isGM && u.active).map((u) => u.id).sort();
  return gms[0] ?? null;
}

/* ---- Foundry glue, wired in the ready hook ------------------------------- */
let client = null;
export function install() {
  const msg = (id) => game.messages?.get(id);
  const arbiter = makeArbiter({
    readClaim: (id, action) => msg(id)?.flags?.[SCOPE]?.claims?.[safe(action)] ?? null,
    writeClaim: async (id, action, claim) => {
      const m = msg(id);
      if (!m) throw new Error("that chat card no longer exists");
      await m.update({ [claimPath(action)]: claim });
    }
  });
  client = makeClient({
    userId: game.user.id,
    isArbiter: () => arbiterId(game.users) === game.user.id,
    hasArbiter: () => !!arbiterId(game.users),
    arbiter,
    emit: (p) => game.socket?.emit(CHANNEL, p),
    names: (id) => game.users?.get(id)?.name ?? "someone"
  });
  game.socket?.on(CHANNEL, (p) => client.handle(p));
  return client;
}
/** Claim `action` on chat message `messageId` once, table-wide. */
export async function claim(messageId, action) {
  if (!client) return { ok: false, by: null, notice: "The card guard is not ready yet; try again in a moment." };
  return client.claim(messageId, action);
}
export function claimedBy(message, action) {
  return message?.flags?.[SCOPE]?.claims?.[safe(action)]?.by ?? null;
}
