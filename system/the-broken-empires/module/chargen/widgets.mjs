/* Small HTML builders for the character creation window (v0.52.0).
 *
 * Every input names the draft field it writes with data-bind (a dotted path)
 * and, where the last segment is a skill or slot name, data-key. The window
 * reads nothing else: there is no per-page read-back function to forget a
 * field in, which is how the old Wizard's "dead input" defects happened
 * (CLAUDE.md rule 2). Pure strings, no Foundry globals, so a Node check can
 * render every page.
 */

export const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const num = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
export const signed = (n) => (num(n) > 0 ? "+" : "") + num(n);

export function attrs(o) {
  return Object.entries(o || {})
    .filter(([, v]) => v !== undefined && v !== null && v !== false && v !== "")
    .map(([k, v]) => (v === true ? k : k + '="' + esc(v) + '"')).join(" ");
}

const bindAttrs = (bind, o = {}) => ({ "data-bind": bind, "data-key": o.key, "data-type": o.type, "data-sub": o.sub,
  "data-source": o.source, class: o.cls, disabled: o.disabled, title: o.title });

/** options: strings, [value, label, disabled?], or {group, items}. */
export function select(bind, options, cur, o = {}) {
  const one = (x) => {
    const [v, l, dis] = Array.isArray(x) ? x : [x, x];
    return '<option value="' + esc(v) + '"' + (String(cur ?? "") === String(v) ? " selected" : "") + (dis ? " disabled" : "") + ">" + esc(l ?? v) + "</option>";
  };
  const body = (options || []).map((x) => (x && x.group ? '<optgroup label="' + esc(x.group) + '">' + x.items.map(one).join("") + "</optgroup>" : one(x))).join("");
  const blank = o.blank === false ? "" : '<option value="">' + esc(o.blank || "(choose)") + "</option>";
  return "<select " + attrs(bindAttrs(bind, o)) + ">" + blank + body + "</select>";
}

export function text(bind, cur, o = {}) {
  return "<input type=\"text\" " + attrs(Object.assign(bindAttrs(bind, o), { value: cur ?? "", placeholder: o.placeholder })) + ">";
}

export function numberIn(bind, cur, o = {}) {
  return "<input type=\"number\" " + attrs(Object.assign(bindAttrs(bind, Object.assign({ type: "number" }, o)),
    { value: num(cur, 0), min: o.min ?? 0, max: o.max, step: o.step ?? 1 })) + ">";
}

/** A number box with - / + buttons either side. */
export function stepper(bind, cur, o = {}) {
  const by = o.by ?? 1;
  const btn = (d, label) => '<button type="button" ' + attrs({ "data-action": "bump", "data-bind": bind, "data-key": o.key,
    "data-by": d, "data-min": o.min ?? 0, "data-max": o.max, disabled: o.disabled }) + ">" + label + "</button>";
  return '<span class="tbe-cc-stepper">' + btn(-by, "&minus;") + numberIn(bind, cur, o) + btn(by, "+") + "</span>";
}

export function checkbox(bind, cur, label, o = {}) {
  return "<label class=\"tbe-cc-check\"><input type=\"checkbox\" " + attrs(Object.assign(bindAttrs(bind, Object.assign({ type: "bool" }, o)),
    { checked: !!cur })) + "> " + label + "</label>";
}

export function radio(bind, value, cur, label, o = {}) {
  return "<label class=\"tbe-cc-radio\"><input type=\"radio\" " + attrs(Object.assign(bindAttrs(bind, o),
    { name: "r-" + bind + (o.key ? "-" + o.key : ""), value, checked: String(cur ?? "") === String(value) })) + "> " + label + "</label>";
}

/** A toggle chip for a list field (personality traits, Binds, Strands). */
export function chip(bind, value, on, label, o = {}) {
  return "<button type=\"button\" " + attrs({ class: "tbe-cc-chip" + (on ? " on" : ""), "data-action": "toggle", "data-bind": bind,
    "data-value": value, "data-max": o.max, disabled: o.disabled && !on, title: o.title, "aria-pressed": on ? "true" : "false" }) + ">" + esc(label ?? value) + "</button>";
}

export function button(action, label, data = {}, o = {}) {
  const d = {};
  for (const [k, v] of Object.entries(data)) d["data-" + k] = v;
  return "<button type=\"button\" " + attrs(Object.assign({ "data-action": action, class: o.cls, disabled: o.disabled, title: o.title }, d)) + ">" + label + "</button>";
}

export const rollButton = (action, label, data = {}, o = {}) =>
  button(action, '<i class="fas fa-dice-d20"></i> ' + label, data, Object.assign({ cls: "tbe-cc-roll" }, o));

/** Marks a roll that is not a rulebook table (the user's standing steer:
 *  roll aids are wanted, labelled, and never binding). */
export const aid = (why) => '<span class="tbe-cc-aid" title="' + esc(why || "Not a rulebook table. A roll to help you decide; change the result freely.") + '">roll aid</span>';

export const page = (p) => (p ? '<span class="tbe-cc-page">p.' + p + "</span>" : "");
export const hint = (html) => '<div class="tbe-cc-hint">' + html + "</div>";
export const warn = (html) => '<div class="tbe-cc-warn">' + html + "</div>";

/** "12 / 80 spent (68 left)". data-live lets the window refresh it in
 *  place while a number is being typed, without re-rendering the page. */
export function pool(id, spent, total, label) {
  const cls = spent > total ? "over" : spent === total ? "full" : "open";
  const tail = spent > total ? "over by " + (spent - total) : spent === total ? "all spent" : (total - spent) + " left";
  return '<span class="tbe-cc-pool ' + cls + '" data-live="' + esc(id) + '">' + (label ? esc(label) + " " : "") + spent + " / " + total + " &middot; " + tail + "</span>";
}

/** A skill's running value, everything so far included. */
export function valueChip(id, v, cap) {
  if (!v) return "";
  const at = num(v.value, 0);
  const capped = cap && at >= cap;
  return '<span class="tbe-cc-val' + (capped ? " cap" : "") + '" data-live="' + esc(id) + '">' + at +
    (num(v.expertise) >= 2 ? " Ex" + v.expertise : "") + (v.savvy ? " S" : "") + (capped ? " cap" : "") + "</span>";
}

/**
 * The compare-then-pick table: every option side by side, the chosen row
 * lit, a click on a row picks it. rows: [{value, cells[], picked, note, dim}]
 */
export function compare(bind, head, rows, o = {}) {
  return '<table class="tbe-cc-compare"><thead><tr>' + head.map((h) => "<th>" + h + "</th>").join("") + "</tr></thead><tbody>" +
    rows.map((r) => "<tr " + attrs({ class: (r.picked ? "picked" : "") + (r.dim ? " dim" : ""), "data-action": o.action || "pick",
      "data-bind": bind, "data-value": r.value, "data-key": o.key, title: r.title }) + ">" +
      r.cells.map((c) => "<td>" + c + "</td>").join("") + "</tr>" +
      (r.note ? '<tr class="tbe-cc-rownote' + (r.picked ? " picked" : "") + '"><td colspan="' + head.length + '">' + r.note + "</td></tr>" : "")).join("") +
    "</tbody></table>";
}

/** Catalogue skills grouped by category, for a select. */
export function skillOptions(groups, extra = []) {
  const out = Object.keys(groups).map((g) => ({ group: g, items: groups[g] }));
  const bySlot = {};
  for (const x of extra) (bySlot[x.group] = bySlot[x.group] || []).push([x.slot || x.name, x.name]);
  for (const [g, items] of Object.entries(bySlot)) out.push({ group: g, items });
  return out;
}
