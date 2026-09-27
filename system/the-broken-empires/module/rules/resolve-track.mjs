/* The Resolve track, and how much of it can actually be spent (v0.50.0).
 *
 * p.26: "Indicate spent Resolve with a single slash in the boxes on your
 * character sheet's Resolve track, from left to right. Once the track is
 * filled up to your Max Resolve, there is no more Resolve available to you."
 * "Fatigue from travel can limit your maximum available Resolve. For every
 * Fatigue you take, mark one "X" in a Resolve box on the track, from right to
 * left. If your Resolve track becomes filled with spent Resolve or Fatigue (or
 * some combination of the two), taking additional Fatigue will cause
 * Fatigue-based wounds."
 *
 * So the spendable amount is the boxes that are neither slashed nor crossed:
 * unspent Resolve (system.resolve.value) minus Fatigue (system.fatigue). Until
 * v0.50.0 every spend in the system read `resolve.value` alone (the sheet's
 * Favor, TBE: Skill Roll, the Shock save in TBE: Attack, TBE: Cast, TBE:
 * Counterspell, TBE: Ritual), so a character with Fatigue could spend boxes
 * the book has already crossed out. The one place that did subtract Fatigue,
 * TBE.fatigueRoom in the macro pack, was answering the same question from the
 * other side; it now asks this module too.
 *
 * A rule module does not assume ambient state: it takes the actor's `system`
 * (or anything shaped like it) and returns plain data.
 */
const num = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

/** The track as the book draws it. `pending` is what a roll is about to spend. */
export function track(system, pending = 0) {
  const max = Math.max(0, Math.floor(num(system?.resolve?.max)));
  const unspent = Math.max(0, Math.min(max, Math.floor(num(system?.resolve?.value))));
  const spent = max - unspent;
  const fatigue = Math.max(0, Math.min(unspent, Math.floor(num(system?.fatigue))));
  const available = unspent - fatigue;
  const spend = Math.max(0, Math.min(available, Math.floor(num(pending))));
  return { max, unspent, spent, fatigue, available, spend, after: available - spend };
}

/** Resolve that can be spent right now: unspent minus Fatigue, never below 0. */
export function availableResolve(system) {
  return track(system).available;
}

/**
 * The track as boxes. Spent Resolve slashed from the left, Fatigue crossed
 * from the right, free boxes between; `pending` boxes are the next ones to be
 * slashed, marked so the player sees what a spend will cost before it lands.
 */
export function trackHtml(system, pending = 0, { label = "Resolve" } = {}) {
  const t = track(system, pending);
  if (!t.max) return `<span class="tbe-rtrack tbe-rtrack-none">${label}: no track</span>`;
  const box = (cls, mark, title) => `<span class="tbe-rbox ${cls}" title="${title}">${mark}</span>`;
  const boxes = [];
  for (let i = 0; i < t.max; i++) {
    if (i < t.spent) boxes.push(box("spent", "/", "Spent"));
    else if (i < t.spent + t.spend) boxes.push(box("pending", "/", "Spent by this roll"));
    else if (i >= t.max - t.fatigue) boxes.push(box("fatigue", "×", "Fatigue"));
    else boxes.push(box("free", "", "Available"));
  }
  const tail = t.spend
    ? `${t.available} → <b>${t.after}</b> available`
    : `<b>${t.available}</b> available`;
  return `<span class="tbe-rtrack" title="Resolve: spent from the left, Fatigue from the right (p.26)">` +
    `<span class="tbe-rtrack-label">${label}</span>${boxes.join("")}` +
    `<span class="tbe-rtrack-sum">${tail}${t.fatigue ? `, ${t.fatigue} Fatigue` : ""}</span></span>`;
}
