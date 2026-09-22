/*
 * How long a chat card stays up as a pop-up when the chat sidebar is closed.
 *
 * Foundry V13+ shows each new chat card in a notification pane and dismisses
 * it after ChatLog.NOTIFY_DURATION ms (5000 by default). Five seconds is not
 * long enough to read an attack card at the table, so this is a per-user
 * setting ("Chat pop-up duration", in seconds).
 *
 * A version-dependent API is a rule with two owners (CLAUDE.md rule 7): V12's
 * ChatLog has no notification pane and no NOTIFY_DURATION. Branch on the shape
 * found, not a version number: only a class that already carries a numeric
 * NOTIFY_DURATION is touched, so V12 is left alone rather than given a static
 * property nothing reads.
 */
export const DEFAULT_SECONDS = 15;
export const MIN_SECONDS = 5;
export const MAX_SECONDS = 120;

/** Clamp a stored value to the range the setting offers. */
export function secondsFrom(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_SECONDS;
  return Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, Math.round(n)));
}

/**
 * Apply a duration to every ChatLog class in play.
 * @param {number} seconds
 * @param {object[]} classes  candidate classes (CONFIG.ui.chat, the core ChatLog)
 * @returns {number} how many classes were changed
 */
export function applyChatPopupDuration(seconds, classes) {
  const ms = secondsFrom(seconds) * 1000;
  let changed = 0;
  for (const cls of new Set(classes.filter(Boolean))) {
    if (typeof cls.NOTIFY_DURATION !== "number") continue;
    cls.NOTIFY_DURATION = ms;
    changed++;
  }
  return changed;
}

/** The classes to change in a running Foundry client. */
export function chatLogClasses() {
  return [
    globalThis.CONFIG?.ui?.chat,
    globalThis.foundry?.applications?.sidebar?.tabs?.ChatLog
  ];
}
