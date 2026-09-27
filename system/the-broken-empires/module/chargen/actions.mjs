/* What the character creation window does when you change a field or press
 * a button (v0.52.0).
 *
 * Kept apart from the window so a Node check can drive it: dice come in
 * through env.roll (a real Foundry Roll in the window, a scripted one in
 * creator_check.mjs), chat through env.say, settings through env.settings.
 * Nothing here reads a Foundry global.
 *
 * Every die the BOOK asks for (race, homeland, Ability Scores, culture, Life
 * Events, career, Relationship NPC, Convocation, randomized Initiative and
 * Death Threshold, silver, armour pieces) is rolled with env.roll and posted
 * to chat, as the old Wizard did. The roll AIDS (concept, age, name,
 * personality, descriptor) are labelled as such on the page; the concept
 * and age still post, because a table likes to see them.
 */
import * as R from "./rules.mjs";
import { face } from "../rules/resolution.mjs";
import { pick as pickPortrait } from "../helpers/portraits.mjs";
import { raceChoices, raceBarsMagic, patternOf, freeTalentSlots } from "./draft.mjs";
import { goalSentence, conceptSentence, RELATIONSHIP_TYPES, LOCATIONS, defaultNameList } from "./steps.mjs";

const num = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
const sum = (o) => Object.values(o || {}).reduce((n, v) => n + Math.max(0, num(v, 0)), 0);

/* ---- writing a field ----------------------------------------------------- */

export function pathOf(bind, key) {
  const p = String(bind).split(".");
  if (key !== undefined && key !== null && key !== "") p.push(String(key));
  return p;
}
export function getPath(o, path) {
  return path.reduce((a, k) => (a == null ? undefined : a[k]), o);
}
export function setPath(o, path, value) {
  let cur = o;
  for (let i = 0; i < path.length - 1; i++) {
    const k = path[i];
    if (cur[k] === null || cur[k] === undefined || typeof cur[k] !== "object") cur[k] = /^\d+$/.test(path[i + 1]) ? [] : {};
    cur = cur[k];
  }
  cur[path[path.length - 1]] = value;
}

/** A form control's value, typed by its data-type. */
export function valueOf(el) {
  const t = el.type;
  if (t === "bool") return !!el.checked;
  if (t === "number") return el.value === "" ? 0 : num(el.value, 0);
  return el.value ?? "";
}

/**
 * Write one bound control into the draft, then reconcile whatever depends on
 * it. el: {bind, key, sub, source, type, value, checked}.
 */
export function setBound(d, T, el) {
  if (el.bind === "freeTalent") {
    d.freeTalents = (d.freeTalents || []).filter((f) => f && f.slot);
    let f = d.freeTalents.find((x) => x.slot === el.key);
    if (!f) { f = { slot: el.key, name: "", spec: "", source: el.source || "" }; d.freeTalents.push(f); }
    f[el.sub || "name"] = String(el.value ?? "");
    if (el.sub !== "spec" && !f.name) d.freeTalents = d.freeTalents.filter((x) => x !== f);
    return;
  }
  const path = pathOf(el.bind, el.key);
  const before = getPath(d, path);
  setPath(d, path, valueOf(el));
  reconcile(d, T, path, before);
}

/** The knock-on effects of a change: picks that no longer make sense are
 *  cleared rather than left to count silently (the Wizard's ensure* steps). */
export function reconcile(d, T, path, before) {
  const top = path[0];
  const now = getPath(d, path);
  if (before === now) return;
  if (top === "raceName") {
    const rc = raceChoices(T, d.raceName);
    if (!rc.choosesSavvy || !rc.savvyOptions.includes(d.raceSavvyPick)) d.raceSavvyPick = "";
    if (!rc.extraExpertise) d.raceExpertisePick = "";
    if (!rc.bindBonus) d.raceBindPick = "";
    if (!rc.usesHumanCulture) { d.humanCultureRange = ""; d.humanCultureName = ""; d.humanCultureLang = ""; }
    if (!rc.extraTalent) d.freeTalents = (d.freeTalents || []).filter((f) => f.slot !== "race");
    if (raceBarsMagic(T, d.raceName)) d.takeFade = false;
  } else if (top === "careerName") {
    d.alloc = {}; d.allocFor = d.careerName;
    d.freeTalents = (d.freeTalents || []).filter((f) => !/^career/.test(f.slot));
    d.careerTalentSwap = "";
    if (d.careerName === "Spellweaver") d.takeFade = false;
  } else if (top === "cultureBgName") {
    d.cultureBgPicks = {}; d.cultureBgFor = d.cultureBgName;
  } else if (top === "abilityPicks" && path.length > 1) {
    const i = num(path[1]);
    for (const k of ["abilityExpertise", "abilityTalent", "abilityDescriptor"]) { d[k] = d[k] || [null, null]; d[k][i] = null; }
  } else if (top === "lifeChoice" && path.length > 1) {
    d.lifeChoiceExtra = d.lifeChoiceExtra || {};
    const ev = (d.lifeEvents || {})[path[1]];
    const opt = ev && (ev.options || [])[num(now, -1)];
    d.lifeChoiceExtra[path[1]] = opt && opt.kind === "skill-any" && (opt.options || []).length === 1 ? opt.options[0] : "";
  } else if (top === "humanCultureRange") {
    const h = (T.chargen.humanCultures || []).find((x) => x.range === d.humanCultureRange);
    d.humanCultureName = h ? h.name : "";
    d.humanCultureLang = h ? h.language.split(" or ")[0].trim() : "";
  } else if (top === "roBonusChoice") {
    if (d.roBonusChoice !== "talent") d.freeTalents = (d.freeTalents || []).filter((f) => f.slot !== "rounding");
  } else if (top === "swStrands" || top === "swThin") {
    for (const n of Object.keys(d.strandAlloc || {})) if (!(d.swStrands || []).includes(n)) delete d.strandAlloc[n];
    for (const n of Object.keys(d.strandExtra || {})) if ((d.swThin || []).includes(n)) delete d.strandExtra[n];
  }
}

/** Copy a Convocation template into the picks (p.106: a typical combination,
 *  not a cage, so the picks stay editable). */
export function applyConvocation(d, T, c) {
  const SW = (T.magic?.rules || {}).spellweaverChargen || {};
  d.convocation = c.name;
  d.swBinds = c.binds.slice(0, SW.binds || 2);
  d.swStrands = c.strands.slice(0, SW.strands || 4);
  d.swThin = c.thinStrands.slice(0, SW.thinStrands || 2);
  reconcile(d, T, ["swStrands"], null);
}

/* ---- buttons ------------------------------------------------------------- */

/**
 * @param name   data-action
 * @param data   the button's data-* (dataset)
 * @param env    { d, T, ch, ui, roll(formula) -> {total, roll}, say(title, body, rolls), random(n) -> 1..n,
 *                 notify(msg), actorName, concepts, settings: {get, set}, isGM }
 */
export async function act(name, data, env) {
  const { d, T, ui } = env;
  const who = env.actorName || "Character";
  const say = (title, body, rolls) => env.say("Character Creation: " + title, "<div>" + who + ": " + body + "</div>", rolls || []);
  const pick = (bind, key, value) => setBound(d, T, { bind, key, value });
  ui.rollNote = ui.rollNote || {};

  switch (name) {
    case "goto": ui.step = data.step; break;
    case "pick": pick(data.bind, data.key, data.value); break;
    case "bump": {
      const path = pathOf(data.bind, data.key);
      let v = num(getPath(d, path), 0) + num(data.by, 0);
      if (data.min !== undefined && data.min !== "") v = Math.max(num(data.min), v);
      if (data.max !== undefined && data.max !== "") v = Math.min(num(data.max), v);
      setPath(d, path, v);
      break;
    }
    case "toggle": {
      const list = (getPath(d, pathOf(data.bind)) || []).filter(Boolean);
      const i = list.indexOf(data.value);
      if (i > -1) list.splice(i, 1);
      else if (!data.max || list.length < num(data.max)) list.push(data.value);
      else { env.notify?.("Only " + data.max + " can be chosen; unpick one first."); break; }
      const before = getPath(d, pathOf(data.bind));
      setPath(d, pathOf(data.bind), list);
      reconcile(d, T, pathOf(data.bind), before);
      break;
    }
    case "remove": {
      const list = d[data.list] || [];
      list.splice(num(data.idx, -1), 1);
      break;
    }
    case "ui": ui[data.ui] = !ui[data.ui]; break;
    case "ui-set": ui[data.ui] = data.value; break;
    case "ui-toggle": ui[data.ui] = ui[data.ui] === data.value ? null : data.value; break;
    case "why": ui.why = ui.why === data.name ? null : data.name; break;

    case "ability-pick": {
      const picks = (d.abilityPicks || [null, null]).slice(0, 2);
      const at = picks.indexOf(data.value);
      if (at > -1) pick("abilityPicks", at, null);
      else pick("abilityPicks", picks[0] ? 1 : 0, data.value);   /* both full: the second is replaced */
      break;
    }
    case "life-pick": {
      const row = (T.lifeEvents[data.key] || []).find((e) => e.range === data.value);
      if (row) setLifeEvent(d, data.key, row);
      break;
    }
    case "convocation-pick": {
      const c = (T.magic?.convocations || []).find((x) => x.name === data.value);
      if (c) applyConvocation(d, T, c);
      break;
    }

    /* The book's own tables. */
    case "roll-race": {
      const r = await env.roll("1d100");
      const hit = R.rowForRoll(T.chargen.races, r.total, "d100", 100);
      ui.rollNote.race = "1d100 → " + face(r.total) + (hit ? ": " + hit.name : ", no match; pick by hand");
      if (hit) pick("raceName", null, hit.name);
      await say("Race", "1d100 → " + face(r.total) + (hit ? " (<b>" + hit.name + "</b>)" : ""), [r.roll]);
      break;
    }
    case "roll-human-culture": {
      const r = await env.roll("1d100");
      const hit = R.rowForRoll(T.chargen.humanCultures, r.total, "range", 100);
      if (hit) pick("humanCultureRange", null, hit.range);
      await say("Homeland", "1d100 → " + face(r.total) + (hit ? " (<b>" + hit.name + "</b>, " + hit.language + ")" : ""), [r.roll]);
      break;
    }
    case "roll-ability": {
      const a = await env.roll("1d6"), b = await env.roll("1d6");
      const [x, y] = R.abilityPairFromRolls(T.chargen.abilityScores, a.total, b.total);
      pick("abilityPicks", 0, x ? x.name : null);
      pick("abilityPicks", 1, y ? y.name : null);
      ui.rollNote.ability = "1d6 → " + a.total + ", 1d6 → " + b.total + (a.total === b.total ? " (a double steps to the next score)" : "") +
        ": " + [x, y].filter(Boolean).map((s) => s.name).join(" and ");
      await say("Ability Scores", ui.rollNote.ability, [a.roll, b.roll]);
      break;
    }
    case "roll-init": {
      const r = await env.roll("1d6");
      d.initRoll = 6 + r.total;
      await say("Randomized Initiative", "6+1d6 → <b>" + d.initRoll + "</b>", [r.roll]);
      break;
    }
    case "roll-dt": {
      const r = await env.roll("2d4");
      d.dtRoll = 15 + r.total;
      await say("Randomized Death Threshold", "15+2d4 → <b>" + d.dtRoll + "</b>", [r.roll]);
      break;
    }
    case "roll-culture": {
      const r = await env.roll("1d10");
      const hit = R.rowForRoll(T.chargen.culturalBackgrounds, r.total, "range", 10);
      ui.rollNote.culture = "1d10 → " + r.total + (hit ? ": " + hit.name : "");
      if (hit) pick("cultureBgName", null, hit.name);
      await say("Cultural Background", "1d10 → " + r.total + (hit ? " (<b>" + hit.name + "</b>)" : ""), [r.roll]);
      break;
    }
    case "roll-life": {
      const key = data.life;
      const r = await env.roll("1d100");
      const hit = R.rowForRoll(T.lifeEvents[key] || [], r.total, "range", 100);
      if (hit) setLifeEvent(d, key, hit);
      await say("Life Event (" + key + ")", "1d100 → " + face(r.total) + (hit ? " (<b>" + hit.name + "</b>)" : "") +
        (hit && (hit.options || []).length ? '<div style="font-size:11px">' + hit.options.map((o) => o.label).join(" / ") + "</div>" : ""), [r.roll]);
      break;
    }
    case "roll-npc": {
      const r = await env.roll("1d4");
      const type = (RELATIONSHIP_TYPES.find((t) => t.d4 === r.total) || RELATIONSHIP_TYPES[0]).name;
      (d.relationshipNpcs = d.relationshipNpcs || []).push({ source: "life event", type, name: "", note: "" });
      await say("Relationship NPC", "1d4 → " + r.total + " (<b>" + type + "</b>)", [r.roll]);
      break;
    }
    case "roll-career": {
      const r = await env.roll("1d10");
      const hit = T.chargen.careers.find((c) => num(c.d10) === r.total) || null;
      ui.rollNote.career = "1d10 → " + r.total + (hit ? ": " + hit.name : "");
      if (hit) pick("careerName", null, hit.name);
      await say("Previous Career", "1d10 → " + r.total + (hit ? " (<b>" + hit.name + "</b>)" : ""), [r.roll]);
      break;
    }
    case "roll-convocation": {
      const list = T.magic?.convocations || [];
      if (!list.length) break;
      const r = await env.roll("1d" + list.length);
      const c = list[Math.max(0, Math.min(list.length - 1, r.total - 1))];
      applyConvocation(d, T, c);
      await say("Convocation", "1d" + list.length + " → " + r.total + " (<b>" + c.name + "</b>)", [r.roll]);
      break;
    }
    case "roll-silver": {
      const career = T.chargen.careers.find((c) => c.name === d.careerName);
      const culture = T.chargen.culturalBackgrounds.find((c) => c.name === d.cultureBgName);
      d.rolls = d.rolls || {};
      const parts = [], rolls = [];
      const one = async (key, formula, label) => {
        if (!formula || (d.rolls[key] !== undefined && d.rolls[key] !== null)) return;
        const r = await env.roll(formula);
        d.rolls[key] = r.total; rolls.push(r.roll); parts.push(label + " " + formula + " → " + r.total);
      };
      await one("careerSilver", career?.silver, "Career");
      await one("cultureSilver", culture?.silver, "Culture");
      await one("equipCoin", "2d4*50", "Starting coin");
      if (!career || !culture) env.notify?.("Choose your career and culture first; their silver is rolled with it.");
      if (parts.length) await say("Starting silver", parts.join("; "), rolls);
      break;
    }
    case "roll-armor": {
      const r = await env.roll("1d3+1");
      d.rolls = d.rolls || {};
      d.rolls.armorPieces = r.total;
      await say("Starting armour", "1d3+1 → <b>" + r.total + "</b> free piece(s)", [r.roll]);
      break;
    }

    /* The roll aids. */
    case "roll-concept": {
      const cols = data.col ? [data.col] : ["role", "streak", "trouble"];
      d.conceptPicks = Object.assign({}, d.conceptPicks);
      const prev = conceptSentence(d.conceptPicks);
      const rolls = [];
      for (const k of cols) {
        const list = env.concepts[k] || [];
        if (!list.length) continue;
        const r = await env.roll("1d" + list.length);
        rolls.push(r.roll);
        d.conceptPicks[k] = list[Math.max(0, Math.min(list.length - 1, r.total - 1))];
      }
      /* Never clobber a concept typed by hand. */
      if (!String(d.concept || "").trim() || d.concept === prev) d.concept = conceptSentence(d.conceptPicks);
      await say("Concept", "<b>" + conceptSentence(d.conceptPicks) + '</b><div style="font-size:10px;opacity:.7">Table-generated flavour, not rulebook content.</div>', rolls);
      break;
    }
    case "roll-age": {
      const r = await env.roll("1d6");
      const band = r.total <= 2 ? "Young" : r.total <= 4 ? "Adult" : "Old";
      pick("roAge", null, band);
      ui.rollNote.age = "1d6 → " + r.total + ": " + band + " (roll aid: 1-2 Young, 3-4 Adult, 5-6 Old)";
      await say("Age", ui.rollNote.age, [r.roll]);
      break;
    }
    case "roll-name": {
      const lists = Object.keys(T.names).filter((k) => !k.startsWith("_"));
      const key = defaultNameList(T, d) || lists[env.random(lists.length) - 1];
      const set = T.names[key] || {};
      const sex = d.sex === "m" || d.sex === "f" ? d.sex : (env.random(2) === 1 ? "m" : "f");
      const first = set[sex] || set.m || [];
      const last = set.s || [];
      if (!first.length) { env.notify?.("That name list is empty."); break; }
      d.name = (first[env.random(first.length) - 1] + (last.length ? " " + last[env.random(last.length) - 1] : "")).trim();
      if (!d.nameList) d.nameList = key;
      break;
    }
    case "roll-portrait": {
      const list = env.portraits || [];
      if (!list.length) { env.notify?.("No portrait folders are set up. A GM sets them in Configure Settings."); break; }
      const got = pickPortrait(list, ui.portraitCollection || "", env.random);
      if (got) d.portrait = got; else env.notify?.("That collection has no images.");
      break;
    }
    case "clear-portrait": d.portrait = ""; break;
    case "roll-personality": {
      const all = T.chargen.personalityTraits || [];
      const out = [];
      while (out.length < Math.min(2, all.length)) {
        const t = all[env.random(all.length) - 1];
        if (!out.includes(t)) out.push(t);
      }
      d.personalityPicks = out;
      break;
    }
    case "roll-descriptor": {
      const i = num(data.idx);
      const s = T.chargen.abilityScores.find((x) => x.name === (d.abilityPicks || [])[i]);
      if (s) { d.abilityDescriptor = d.abilityDescriptor || [null, null]; d.abilityDescriptor[i] = s.descriptors[env.random(s.descriptors.length) - 1]; }
      break;
    }

    /* Spreading points: only what is LEFT, only over boxes still at 0. */
    case "spread": {
      const cat = data.cat;
      const career = T.chargen.careers.find((c) => c.name === d.careerName);
      const pool = num(career?.pools?.[cat]);
      const names = T.skillGroups[cat] || [];
      d.alloc = d.alloc || {};
      const spent = names.reduce((n, _, i) => n + Math.max(0, num(d.alloc[cat + "_" + i])), 0);
      const empty = names.map((_, i) => i).filter((i) => !num(d.alloc[cat + "_" + i]));
      if (pool - spent <= 0 || !empty.length) { env.notify?.(pool - spent <= 0 ? cat + " is already fully spent." : "Every " + cat + " skill already has points; clear one to spread the rest."); break; }
      const left = pool - spent, each = Math.floor(left / empty.length);
      let rest = left - each * empty.length;
      for (const i of empty) { d.alloc[cat + "_" + i] = each + (rest > 0 ? 1 : 0); if (rest > 0) rest--; }
      break;
    }
    case "spread-magic": {
      const SW = (T.magic?.rules || {}).spellweaverChargen || {};
      const cap = SW.bindCapAtChargen || 70;
      d.magicAlloc = d.magicAlloc || {};
      const left = (SW.magicPool || 100) - sum(d.magicAlloc);
      const targets = (d.swBinds || []).filter((n) => n && !num(d.magicAlloc[n]));
      if (left <= 0 || !targets.length) { env.notify?.(left <= 0 ? "The Magic pool is already fully spent." : "Choose your two Binds, and leave one at 0, first."); break; }
      const bindNow = (n) => num((env.ch.extraSkills.find((x) => x.name === "Bind: " + n) || {}).value);
      const room = Object.fromEntries(targets.map((n) => [n, Math.max(0, cap - bindNow(n))]));
      let rest = left, moved = true;
      while (rest > 0 && moved) {
        moved = false;
        for (const n of targets) if (rest > 0 && room[n] > 0) { d.magicAlloc[n] = num(d.magicAlloc[n]) + 1; room[n]--; rest--; moved = true; }
      }
      if (rest > 0) env.notify?.(rest + " Magic point(s) would pass " + cap + "; put them on another Bind.");
      break;
    }

    /* Equipment. */
    case "take-free": {
      const f = ui.freePick || {};
      const a = T.equipment.armor.find((x) => x.name === f.name);
      if (!a) { env.notify?.("Choose a piece of armour first."); break; }
      const pieces = num(d.rolls?.armorPieces, 0);
      if ((d.freeArmor || []).length >= pieces) { env.notify?.("No free pieces left."); break; }
      if (!R.armorAllowedFree(a, env.ch.talents, d.raceName)) { env.notify?.(a.name + " needs Armor Training, so it cannot be a free piece."); break; }
      (d.freeArmor = d.freeArmor || []).push({ name: a.name, loc: f.loc || "body" });
      ui.freePick = { loc: f.loc };
      break;
    }
    case "buy": {
      const b = ui.buy || {};
      const kind = b.kind || "weapon";
      const list = kind === "armor" ? T.equipment.armor : kind === "shield" ? T.equipment.shields : T.equipment.weapons;
      const it = list.find((x) => x.name === b.name);
      if (!it) break;
      const qty = kind === "armor" ? 1 : Math.max(1, Math.min(20, num(b.qty, 1)));
      const left = env.ch.silver.left;
      if (left === null) { env.notify?.("Roll your starting silver first."); break; }
      if (it.sp * qty > left) { env.notify?.(qty + " × " + it.name + " costs " + it.sp * qty + " sp; you have " + left + "."); break; }
      (d.purchases = d.purchases || []).push({ name: it.name, kind, sp: it.sp, qty, loc: kind === "armor" ? (b.loc || "body") : null });
      break;
    }

    /* Goals and Shared History. */
    case "add-goal": {
      const g = ui.goal || {};
      if (!g.want && !g.obstacle && !g.action) { env.notify?.("Fill in at least one part first."); break; }
      (d.goals = d.goals || []).push({ text: goalSentence(g), kind: g.kind || "individual" });
      ui.goal = { kind: g.kind };
      break;
    }
    case "add-shared": (d.sharedHistory = d.sharedHistory || []).push({ with: "", skill: "", group: "Wise" }); break;

    /* The world's own concept rows (GM only; the table is original content). */
    case "add-concept": {
      const u = ui.newConcept || {};
      const text = String(u.text || "").trim();
      if (!text) { env.notify?.("Type the row's text first."); break; }
      const skills = {}, unknown = [];
      for (const nm of String(u.skills || "").split(",").map((x) => x.trim()).filter(Boolean)) {
        const cat = R.skillGroup(nm);
        if (!cat) unknown.push(nm); else (skills[cat] = skills[cat] || []).push(nm);
      }
      const key = { role: "roles", streak: "streaks", trouble: "troubles" }[u.col || "role"];
      const cur = Object.assign({ roles: [], streaks: [], troubles: [] }, env.settings.get("customConcepts") || {});
      cur[key] = (cur[key] || []).concat([{ text, skills }]);
      await env.settings.set("customConcepts", cur);
      ui.newConcept = { col: u.col };
      if (unknown.length) env.notify?.("Ignored unknown skill(s): " + unknown.join(", ") + ".");
      break;
    }
    case "drop-concept": {
      const key = { role: "roles", streak: "streaks", trouble: "troubles" }[data.col];
      const cur = Object.assign({ roles: [], streaks: [], troubles: [] }, env.settings.get("customConcepts") || {});
      (cur[key] || []).splice(num(data.idx, -1), 1);
      await env.settings.set("customConcepts", cur);
      break;
    }
    default: return false;
  }
  return true;
}

function setLifeEvent(d, key, row) {
  d.lifeEvents = d.lifeEvents || {};
  d.lifeChoice = d.lifeChoice || {};
  d.lifeChoiceExtra = d.lifeChoiceExtra || {};
  d.lifeEvents[key] = JSON.parse(JSON.stringify(row));
  /* A one-option event has nothing to choose. */
  d.lifeChoice[key] = (row.options || []).length === 1 ? 0 : null;
  const only = (row.options || []).length === 1 ? row.options[0] : null;
  d.lifeChoiceExtra[key] = only && only.kind === "skill-any" && (only.options || []).length === 1 ? only.options[0] : "";
}


export { LOCATIONS, freeTalentSlots, patternOf };
