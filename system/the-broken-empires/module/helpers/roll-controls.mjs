/* The Task Modifier and Favor pickers as a row of buttons (v0.49.0).
 *
 * First session note: "Modifiers as radial buttons. Combat heavy game, having
 * input more at-hand." Both are small closed sets (six Task Modifier steps,
 * 0-3 Favor), which a <select> turns into click, read, click. These are radio
 * inputs styled as a segmented row (css .tbe-seg), so a form still reads them
 * with FormData or `form.task.value`, and a plain radio is what is left if the
 * stylesheet is missing.
 *
 * Presentation only. The rows themselves come from the owner of the rule
 * (rules/resolution.mjs); nothing here decides a number.
 */
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const signed = (n) => (n > 0 ? "+" : n < 0 ? "−" : "±") + Math.abs(n);

/**
 * @param {{label:string, mod:number, example:string}[]} mods  the owner's table
 * @param {number} selected  the modifier to show as picked (falls back to 0)
 */
export function taskButtons(mods, selected = 0, name = "task") {
  const pick = mods.some((m) => m.mod === Number(selected)) ? Number(selected) : 0;
  return `<div class="tbe-seg" role="radiogroup" aria-label="Task Modifier">` +
    mods.map((m) =>
      `<label title="${esc(m.label)} ${signed(m.mod)}: ${esc(m.example)}">` +
      `<input type="radio" name="${name}" value="${m.mod}"${m.mod === pick ? " checked" : ""}>` +
      `<span>${esc(m.label)}<br><b>${signed(m.mod)}</b></span></label>`
    ).join("") + `</div>`;
}

/**
 * Favor 0..max. Always opens on 0: a Favor spend costs Resolve, and a
 * remembered spend would take points nobody chose this round.
 */
export function favorButtons(max, step = 10, name = "favor") {
  const n = Math.max(0, Math.floor(Number(max) || 0));
  return `<div class="tbe-seg" role="radiogroup" aria-label="Favor">` +
    Array.from({ length: n + 1 }, (_, i) =>
      `<label title="${i ? `Spend ${i} Resolve for +${i * step}` : "No Favor"}">` +
      `<input type="radio" name="${name}" value="${i}"${i === 0 ? " checked" : ""}>` +
      `<span>${i}${i ? `<br><b>+${i * step}</b>` : "<br><b>&nbsp;</b>"}</span></label>`
    ).join("") + `</div>`;
}

/** Read a radio group's value off a form element (null when none picked). */
export function readRadio(form, name) {
  const el = form?.querySelector?.(`input[name="${name}"]:checked`);
  return el ? el.value : null;
}
