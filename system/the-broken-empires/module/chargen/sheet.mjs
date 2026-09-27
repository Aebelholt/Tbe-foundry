/* The live character sheet beside every step (v0.52.0).
 *
 * It draws derive()'s character and nothing else, which is the point: Create
 * writes the same object, so what you see here is what the actor gets. Each
 * number carries where it came from; hover for the list, click a skill to
 * keep its breakdown open. Pure strings; no Foundry globals.
 */
import * as W from "./widgets.mjs";
import { CHARGEN_SKILL_CAP } from "./rules.mjs";
import { lethalityLevel } from "../rules/lethality.mjs";

const { esc, num, signed } = W;

export function sourceLines(sources) {
  return (sources || []).map((s) => s.label + (s.delta !== undefined && s.delta !== 0 ? " " + (s.base ? s.delta : signed(s.delta)) : "") +
    (s.expertise ? " → Ex" + s.expertise : "") + (s.savvy ? " (Savvy)" : "") + (s.cap ? "" : ""));
}

function skillRow(name, v, ui, base) {
  const moved = v.value !== base || num(v.expertise) >= 2 || v.savvy || (v.sources || []).length;
  const lines = sourceLines(v.sources);
  const open = ui.why === name;
  return '<div class="tbe-cc-sk' + (moved ? " moved" : "") + (v.value >= CHARGEN_SKILL_CAP ? " cap" : "") + '" data-action="why" data-name="' + esc(name) +
    '" title="' + esc(lines.length ? lines.join("\n") : "Starts at " + base) + '"><span>' + esc(name) + "</span><b>" + v.value + "</b>" +
    '<i>' + (num(v.expertise) >= 2 ? "Ex" + v.expertise : "") + (v.savvy ? " S" : "") + "</i></div>" +
    (open ? '<div class="tbe-cc-why">' + (lines.length ? lines.map(esc).join("<br>") : "Starts at " + base) + "</div>" : "");
}

/**
 * What the chosen Talents add through their own ActiveEffects once they are
 * on the actor (Tough +1 Toughness, Patterned in the Weave +5 Max Resolve).
 * derive() leaves these out on purpose, because Create writes the BASE and
 * the effects add on top; the sheet shows both, so the number here is the
 * number the actor will show. Read off the Talents' own effect data.
 */
export function talentEffects(ch, T) {
  const out = {};
  for (const t of ch.talents) {
    const rec = (T.talents || []).find((x) => x.name === t.name);
    for (const e of rec?.effects || []) for (const c of e.changes || []) {
      if (Number(c.mode) !== 2) continue;
      const v = num(c.value) * Math.max(1, num(t.ranks, 1));
      if (!v) continue;
      const o = (out[c.key] = out[c.key] || { total: 0, from: [] });
      o.total += v;
      o.from.push("Talent: " + t.name + " " + signed(v) + " (an effect on the actor)");
    }
  }
  return out;
}

export function renderSheet(ch, env) {
  const { d, T, ui } = env;
  const A = ch.attributes;
  const id = ch.identity;
  const base = num(d.base, 20);
  const age = (T.chargen.roundingOutAges || []).find((a) => a.key === d.roAge);
  const fx = talentEffects(ch, T);
  const plus = (key) => (fx[key] ? fx[key].total : 0);
  const tip = (a, key) => esc(sourceLines(a.sources).concat(key && fx[key] ? fx[key].from : []).join("\n"));
  const dt = A.deathThreshold.value + plus("system.deathThreshold.max");
  const ll = lethalityLevel(dt, A.lethalityBonus.value + plus("system.lethalityBonus"), 0);
  const withFx = (v, key) => v + plus(key) + (plus(key) ? '<sup title="includes Talents">*</sup>' : "");

  let h = (id.portrait ? '<img class="tbe-cc-sheet-img" src="' + esc(id.portrait) + '" alt="">' : "") + '<div class="tbe-cc-sheet-head"><div class="tbe-cc-name">' + esc(id.name || env.actorName || "Unnamed") + "</div>" +
    '<div class="tbe-cc-small">' + [id.race, id.culture, id.career, age ? age.key : "", id.pattern !== "none" ? (id.pattern === "fade" ? "Fade" : "Spellweaver" + (id.convocation ? " (" + id.convocation + ")" : "")) : ""]
      .filter(Boolean).map(esc).join(" &middot; ") + "</div>" +
    (id.concept ? '<div class="tbe-cc-conceptline">' + esc(id.concept) + "</div>" : "") + "</div>";

  h += '<div class="tbe-cc-stats">' +
    [["Resolve", withFx(A.resolveMax.value, "system.resolve.max"), tip(A.resolveMax, "system.resolve.max")],
      ["Init", (A.initiative.value + plus("system.initiative") >= 0 ? "+" : "") + withFx(A.initiative.value, "system.initiative"), tip(A.initiative, "system.initiative")],
      ["Tough", withFx(A.toughness.value, "system.toughness"), tip(A.toughness, "system.toughness")],
      ["DT", withFx(A.deathThreshold.value, "system.deathThreshold.max"), tip(A.deathThreshold, "system.deathThreshold.max")],
      ["LL", ll, "Death Threshold / 3, rounded up (p.88)" + (A.lethalityBonus.value ? ", +" + A.lethalityBonus.value + " racial" : "") + (plus("system.lethalityBonus") ? ", +" + plus("system.lethalityBonus") + " Talent" : "")],
      ["Status", A.status.value, tip(A.status)], ["Size", esc(id.size || "Medium"), ""],
      ["Silver", ch.silver.total === null ? "&mdash;" : ch.silver.left, ch.silver.parts.map((p) => p.label + ": " + (p.value === null ? "not rolled" : p.value)).join("\n")]]
      .map(([l, v, t]) => '<div title="' + t + '"><span>' + l + "</span><b>" + v + "</b></div>").join("") + "</div>";

  const groups = {};
  for (const [n, v] of Object.entries(ch.skills)) (groups[v.group] = groups[v.group] || []).push([n, v]);
  const showAll = !!ui.sheetAll;
  h += '<div class="tbe-cc-sheet-sec"><div class="tbe-cc-sec-h">Skills ' +
    W.button("ui-toggle", showAll ? "only changed" : "show all", { ui: "sheetAll", value: "1" }, { cls: "tbe-cc-link" }) + '</div><div class="tbe-cc-skillcols">';
  for (const [g, rows] of Object.entries(groups)) {
    const shown = rows.filter(([, v]) => showAll || v.value !== base || num(v.expertise) >= 2 || v.savvy);
    h += '<div class="tbe-cc-skillcol"><div class="tbe-cc-grp">' + esc(g) + (shown.length < rows.length ? ' <span class="tbe-cc-small">+' + (rows.length - shown.length) + " at " + base + "</span>" : "") + "</div>" +
      shown.map(([n, v]) => skillRow(n, v, ui, base)).join("") + "</div>";
  }
  h += "</div></div>";

  const extras = ch.extraSkills.filter((x) => x.group !== "Bind" || x.value > 0 || num(x.expertise) >= 2);
  if (extras.length) {
    h += '<div class="tbe-cc-sheet-sec"><div class="tbe-cc-sec-h">Languages, -wises, Lore' + (ch.identity.pattern !== "none" ? ", Binds" : "") + "</div>" +
      extras.map((x) => skillRow(x.name, x, ui, 0)).join("") + "</div>";
  }
  if (ch.strands.length || ch.thread) {
    h += '<div class="tbe-cc-sheet-sec"><div class="tbe-cc-sec-h">Strands</div>' +
      ch.strands.map((s) => '<div class="tbe-cc-sk moved" title="' + esc(sourceLines(s.sources).join("\n")) + '"><span>' + esc(s.name) + (s.thin ? " (thin)" : "") + "</span><b>" + s.level + "</b><i></i></div>").join("") +
      (ch.thread ? '<div class="tbe-cc-small">Thread: d8 ' + esc(ch.thread.attunement) + " (" + esc(ch.thread.name) + ")</div>" : "") + "</div>";
  }
  h += '<div class="tbe-cc-sheet-sec"><div class="tbe-cc-sec-h">Talents</div>' +
    (ch.talents.length ? ch.talents.map((t) => '<div class="tbe-cc-line" title="' + esc(t.why) + '">' + esc(t.name) + (t.ranks > 1 ? " ×" + t.ranks : "") +
      (t.specialization ? ' <span class="tbe-cc-small">(' + esc(t.specialization) + ")</span>" : "") + "</div>").join("") : '<div class="tbe-cc-small">none yet</div>') + "</div>";
  const gear = ["Dagger"].concat(ch.equipment.freeArmor.map((a) => a.name + " (" + a.loc + ", free)"))
    .concat(ch.equipment.bought.map((p) => (p.qty > 1 ? p.qty + " × " : "") + p.name + (p.loc ? " (" + p.loc + ")" : "")));
  h += '<div class="tbe-cc-sheet-sec"><div class="tbe-cc-sec-h">Gear</div><div class="tbe-cc-small">' + gear.map(esc).join(", ") + "</div></div>";
  if (ch.personality.length) h += '<div class="tbe-cc-sheet-sec"><div class="tbe-cc-sec-h">Personality</div><div class="tbe-cc-small">' + ch.personality.map(esc).join(", ") + "</div></div>";
  if (ch.goals.length) h += '<div class="tbe-cc-sheet-sec"><div class="tbe-cc-sec-h">Goals</div>' + ch.goals.map((g) => '<div class="tbe-cc-small">' + esc(g.text) + "</div>").join("") + "</div>";
  return h;
}
