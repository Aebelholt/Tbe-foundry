/* What a user last chose, so the next dialog opens there (v0.49.0).
 *
 * Asked for at the first real session: "Remember the last attack, so it's not
 * starting over as much" and "modifiers ... with a memory, as changes are less
 * frequent." One owner for where that memory lives, because the sheet's roll
 * dialog, TBE: Skill Roll, TBE: Attack and the Character Wizard all need it.
 *
 * Stored on the USER, not the actor: two players sharing a hireling must not
 * share one memory, and a player cannot write to an actor they do not own.
 * A user can always write their own flags.
 *
 * Stored as one JSON string, not a nested flag object. setFlag merges objects,
 * so a key deleted from a nested flag would survive the next write; a string
 * is replaced whole.
 *
 * What goes in here is a PREFILL, never a commit. Nothing that spends a
 * resource (Resolve, Favor, ammunition) is remembered; the caller decides that
 * by what it passes, and memory_check.mjs asserts the callers keep to it.
 */
export const SCOPE = "the-broken-empires";
export const KEY = "memory";
/* Per kind. A long campaign should not grow a user document forever. */
export const MAX_PER_KIND = 60;

export function readAll(user) {
  const raw = user?.getFlag ? user.getFlag(SCOPE, KEY) : user?.flags?.[SCOPE]?.[KEY];
  if (!raw) return {};
  if (typeof raw !== "string") return {};
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? v : {};
  } catch (e) {
    return {};
  }
}

export function recall(user, kind, key) {
  const v = readAll(user)?.[kind]?.[key];
  return v === undefined ? null : v;
}

/** value === null or undefined forgets the entry. Returns true when written. */
export async function remember(user, kind, key, value) {
  if (!user?.setFlag || !kind || key === undefined || key === null) return false;
  const all = readAll(user);
  const bucket = all[kind] && typeof all[kind] === "object" ? all[kind] : {};
  delete bucket[key];                       /* re-insert last, so the oldest is first */
  if (value !== null && value !== undefined) bucket[key] = value;
  const keys = Object.keys(bucket);
  for (let i = 0; i < keys.length - MAX_PER_KIND; i++) delete bucket[keys[i]];
  all[kind] = bucket;
  await user.setFlag(SCOPE, KEY, JSON.stringify(all));
  return true;
}

export async function forget(user, kind, key) {
  return remember(user, kind, key, null);
}
