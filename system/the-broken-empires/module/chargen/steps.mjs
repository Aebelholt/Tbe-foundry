/* The pages of the character creation window, one per book step (v0.52.0).
 *
 * Each renderer takes the same env and returns HTML:
 *   d   the draft (every choice made)        T   the tables (TABLES + skillGroups)
 *   ch  derive(d) (the character as it stands) st  stepStatus(T, d, ch)
 *   ui  view state that is not a choice (open tables, sub-tabs)
 *   isGM, concepts (the concept columns, world rows merged in)
 *
 * A page shows what the player needs to decide at that point and the
 * numbers the decision moves (CLAUDE.md rule 3), and nothing it shows is
 * computed here: values come from `ch`, so the page, the live sheet and
 * Create cannot disagree. Pure strings; no Foundry globals.
 */
import * as W from "./widgets.mjs";
import * as R from "./rules.mjs";
import { STEPS, raceChoices, raceBarsMagic, patternOf, freeTalentSlots, roAnySpent } from "./draft.mjs";
import { lethalityLevel } from "../rules/lethality.mjs";
import { wornBulk, initPenalty } from "../rules/armor.mjs";
import { talentEffects } from "./sheet.mjs";

const { esc, num, signed } = W;
const CAP = R.CHARGEN_SKILL_CAP;
const sum = (o) => Object.values(o || {}).reduce((n, v) => n + Math.max(0, num(v, 0)), 0);

export const RELATIONSHIP_TYPES = [{ d4: 1, name: "Friend" }, { d4: 2, name: "Patron" }, { d4: 3, name: "Rival" }, { d4: 4, name: "Adversary" }];
export const LOCATIONS = [["head", "Head"], ["body", "Body"], ["rArm", "R Arm"], ["lArm", "L Arm"], ["rLeg", "R Leg"], ["lLeg", "L Leg"]];

/* ---- shared bits --------------------------------------------------------- */

const head = (key, extra = "") => {
  const s = STEPS.find((x) => x.key === key);
  return '<h2 class="tbe-cc-h">' + (s.n ? s.n + ". " : "") + esc(s.label) + " " + W.page(s.page) + extra + "</h2>";
};

function openList(env, key) {
  const o = env.st[key]?.open || [];
  if (!o.length) return "";
  return '<div class="tbe-cc-open"><b>Still to choose here</b><ul>' + o.map((x) => "<li>" + esc(x) + "</li>").join("") + "</ul></div>";
}

const skillVal = (env, name) => env.ch.skills[name] || env.ch.extraSkills.find((x) => x.name === name || x.slot === name) || null;
const vchip = (env, name) => W.valueChip("sk:" + name, skillVal(env, name), CAP);

/** A free Talent choice: a select of what the rule allows, blocked ones
 *  greyed with the reason, a specialization box when the Talent needs one. */
function talentSlot(env, slot) {
  const { T, d, ch } = env;
  const rule = slot.rule || {};
  const cur = (d.freeTalents || []).find((f) => f.slot === slot.id) || {};
  const hide = /^(patterned in the weave|faded pattern)$/i;
  let list = T.talents.filter((t) => !hide.test(t.name));
  if (!rule.any) {
    const named = (rule.named || []).map((n) => R.talentNamed(T.talents, n)).filter(Boolean);
    const cats = rule.categories || [];
    list = list.filter((t) => named.includes(t) || cats.includes(t.category));
  }
  const owned = new Set(ch.talents.map((t) => t.name.toLowerCase()));
  if (cur.name) owned.delete(String(cur.name).toLowerCase());
  const opts = list.map((t) => {
    const why = R.talentBlockedAtCreation(T.talents, t, owned, d.raceName, T.chargen.races);
    return [t.name, t.name + (rule.any || (rule.categories || []).length > 1 ? " (" + t.category + ")" : "") + (why ? ", " + why : ""), !!why];
  });
  const rec = cur.name ? R.talentNamed(T.talents, cur.name) : null;
  const needsSpec = rec && (rec.rank === "per-skill" || /^savvy$/i.test(rec.name));
  const label = rule.note || (rule.named && rule.named.length && !(rule.categories || []).length ? rule.named.join(" or ")
    : rule.any ? "any Talent you qualify for" : "one " + (rule.categories || []).join(", ") + " Talent");
  return '<div class="tbe-cc-talent">' +
    '<div class="tbe-cc-talent-head">' + esc(slot.source) + ": " + esc(label) + "</div>" +
    W.select("freeTalent", opts, cur.name, { key: slot.id, sub: "name", source: slot.source }) +
    (needsSpec ? W.text("freeTalent", cur.spec, { key: slot.id, sub: "spec", placeholder: /^savvy$/i.test(rec.name) ? "which skill gets the S" : "weapon type or skill" }) : "") +
    (rec ? '<div class="tbe-cc-desc">' + esc(String(rec.desc || "").slice(0, 420)) + (String(rec.desc || "").length > 420 ? "&hellip;" : "") + "</div>" : "") +
    "</div>";
}

/* ---- 1. Concept (p.79-80) ------------------------------------------------ */

function conceptSentence(picks) {
  const role = picks.role?.text || "", streak = picks.streak?.text || "", trouble = picks.trouble?.text || "";
  return [[role, streak].filter(Boolean).join(" "), trouble].filter(Boolean).join(", ");
}
export function conceptHints(groups, picks) {
  const out = {};
  for (const k of ["role", "streak", "trouble"]) {
    const e = (picks || {})[k];
    for (const [cat, v] of Object.entries(e?.skills || {})) {
      if (!groups[cat]) continue;
      out[cat] = out[cat] || [];
      for (const n of [].concat(v)) if (groups[cat].includes(n) && !out[cat].includes(n)) out[cat].push(n);
    }
  }
  return out;
}
export { conceptSentence };

/** Name tables per homeland (names.json keys) for the name roll. */
export const NAME_LIST_FOR_HOMELAND = {
  "Westlands": "The Westlands", "Angevarre": "Angevarre", "Thessia": "Thessia", "Haedravik": "Haedravik/The Ironlands",
  "Ironlanders": "Haedravik/The Ironlands", "Serpent's Teeth": "Serpent’s Teeth Isles", "Tical Dondala": "Tical Dondala",
  "Dunblaine": "Dunblaine", "Old Vestrians": "Old Vestria", "Hohenvall": "Hohenvall", "Vieksgradia": "Vieksgrad",
  "Red Waste Tribals": "Red Waster", "Ansharir": "Ansharir", "Drangia": "Sattagoya/Drangia", "Sattagoya Steppes": "Sattagoya/Drangia"
};
export function defaultNameList(T, d) {
  if (d.nameList && T.names[d.nameList]) return d.nameList;
  if (d.raceName === "Dwarf" && T.names.Dwarf) return "Dwarf";
  const h = (T.chargen.humanCultures || []).find((x) => x.range === d.humanCultureRange);
  return (h && NAME_LIST_FOR_HOMELAND[h.name]) || "";
}

function stepConcept(env) {
  const { d, T } = env;
  const G = T.skillGroups;
  const picks = d.conceptPicks || {};
  const hints = conceptHints(G, picks);
  const cols = env.concepts;
  const rolled = ["role", "streak", "trouble"].some((k) => picks[k]);
  const lists = Object.keys(T.names).filter((k) => !k.startsWith("_"));
  const nameList = defaultNameList(T, d);

  let h = head("concept") +
    W.hint("A rough idea of who this is. It is not binding; the book expects it to shift as your Race, Culture and Life Events land (p.79).");

  h += '<div class="tbe-cc-row">' +
    '<label class="grow">Name ' + W.text("name", d.name, { placeholder: "leave blank to keep the actor's name" }) + "</label>" +
    '<label>Sex ' + W.select("sex", [["m", "Male"], ["f", "Female"], ["x", "Other / unstated"]], d.sex, { blank: "-" }) + "</label></div>" +
    '<div class="tbe-cc-row tbe-cc-aidrow">' + W.rollButton("roll-name", "Roll a name") + " from " +
    W.select("nameList", lists, nameList, { blank: "(any list)" }) + " " + W.aid("The name lists are a roll aid. Your homeland (step 2) picks the list for you.") + "</div>";

  /* The portrait roster (helpers/portraits.mjs): the GM's own image folders. */
  const roster = env.portraits || [];
  const pcols = [...new Set(roster.map((p) => p.collection).filter(Boolean))].sort();
  h += '<div class="tbe-cc-row tbe-cc-portrait">' +
    (d.portrait ? '<img src="' + esc(d.portrait) + '" alt="portrait">' : '<div class="tbe-cc-noimg">no portrait</div>') +
    (roster.length ? W.rollButton("roll-portrait", "Roll a portrait") +
      (pcols.length ? '<select data-ui="portraitCollection"><option value="">(any collection)</option>' +
        pcols.map((c) => '<option value="' + esc(c) + '"' + (env.ui.portraitCollection === c ? " selected" : "") + ">" + esc(c) + "</option>").join("") + "</select>" : "") +
      " " + W.aid("A roll from the portrait folders your GM set up (" + roster.length + " images). Pick by hand instead whenever you like.") : "") +
    W.button("pick-portrait", "Choose&hellip;") + (d.portrait ? W.button("clear-portrait", "&times;", {}, { cls: "tbe-cc-link", title: "No portrait" }) : "") + "</div>" +
    (roster.length ? "" : W.hint("To roll portraits, a GM points <b>Portrait folders</b> (Configure Settings) at folders of images. Each subfolder becomes a collection."));

  h += '<div class="tbe-cc-box">' +
    '<div class="tbe-cc-row">' + W.rollButton("roll-concept", "Roll a concept") + " " +
    ["role", "streak", "trouble"].map((k) => W.button("roll-concept", "reroll " + k, { col: k }, { cls: "tbe-cc-small" })).join(" ") + " " +
    W.aid("Original table, not the book's (the book asks for a concept and gives no table). " + cols.role.length + " roles, " + cols.streak.length + " streaks, " + cols.trouble.length + " troubles.") + "</div>" +
    (rolled ? '<div class="tbe-cc-concept">' + esc(conceptSentence(picks)) + "</div>" : "") +
    (Object.keys(hints).length ? '<div class="tbe-cc-hint">Points at: ' + Object.entries(hints).map(([c, n]) => "<b>" + c + "</b> " + n.map(esc).join(" / ")).join("; ") +
      ". Marked &#9733; in the four picks below.</div>" : "") +
    conceptEditor(env) + "</div>";

  h += '<label class="tbe-cc-block">Concept ' + W.text("concept", d.concept, { placeholder: "wandering sellsword haunted by his last command" }) + "</label>";

  h += '<h3 class="tbe-cc-sub">Starting skills ' + W.page(80) + "</h3>" +
    W.hint("One skill in each category starts at 30; every other skill starts at 20. Magic skills start at 0.") + '<div class="tbe-cc-grid2">';
  for (const cat of Object.keys(G)) {
    const opts = G[cat].map((n) => [n, ((hints[cat] || []).includes(n) ? "★ " : "") + n]);
    h += "<label>" + cat + " at 30 " + W.select("boost", opts, d.boost?.[cat], { key: cat }) + "</label>";
  }
  h += "</div>";
  h += '<details class="tbe-cc-adv"><summary>Table options</summary>' +
    '<label>Base skill value (book: 20) ' + W.numberIn("base", d.base, { min: 0, max: 50 }) + "</label>" +
    '<label>Extra blank -wise slots ' + W.numberIn("wises", d.wises, { min: 0, max: 12 }) + "</label>" +
    W.hint("Leave these alone for a by-the-book character. The Career, Culture and Life Events hand out the -wises you need, and you name them there.") +
    "</details>";
  return h + openList(env, "concept");
}

function conceptEditor(env) {
  const { d, ui } = env;
  if (!env.isGM) return "";
  if (!ui.conceptEditor) return '<div class="tbe-cc-small">' + W.button("ui", "add your own rows", { ui: "conceptEditor" }, { cls: "tbe-cc-link" }) + "</div>";
  const mine = env.customConcepts || { roles: [], streaks: [], troubles: [] };
  const listed = [["role", "roles"], ["streak", "streaks"], ["trouble", "troubles"]].map(([k, key]) =>
    (mine[key] || []).length ? '<div class="tbe-cc-small">' + k + ": " + mine[key].map((r, i) => esc(r.text) + " " +
      W.button("drop-concept", "&times;", { col: k, idx: i }, { cls: "tbe-cc-link" })).join(", ") + "</div>" : "").join("");
  const u = ui.newConcept || {};
  return '<div class="tbe-cc-editor"><b>Your own rows</b> (kept in this world) ' + W.button("ui", "hide", { ui: "conceptEditor" }, { cls: "tbe-cc-link" }) + listed +
    '<div class="tbe-cc-row"><select data-ui="newConcept.col"><option value="role"' + (u.col === "role" ? " selected" : "") + '>Role</option><option value="streak"' +
    (u.col === "streak" ? " selected" : "") + '>Streak</option><option value="trouble"' + (u.col === "trouble" ? " selected" : "") + ">Trouble</option></select>" +
    '<input type="text" data-ui="newConcept.text" value="' + esc(u.text || "") + '" placeholder="fallen inquisitor">' +
    '<input type="text" data-ui="newConcept.skills" value="' + esc(u.skills || "") + '" placeholder="skills it hints at: Insight, Intimidate">' +
    W.button("add-concept", "Add") + "</div></div>";
}

/* ---- 2. Race (p.81-84) --------------------------------------------------- */

function stepRace(env) {
  const { d, T, ch } = env;
  const races = T.chargen.races;
  const rc = raceChoices(T, d.raceName);
  const race = races.find((r) => r.name === d.raceName) || null;
  const pattern = patternOf(T, d);
  let h = head("race", " " + W.rollButton("roll-race", "Roll 1d100"));
  h += W.compare("raceName", ["d100", "Race", "Size", "Tough", "DT", "Skill modifiers", "Savvy"], races.map((r) => ({
    value: r.name, picked: r.name === d.raceName,
    cells: [esc(r.d100), "<b>" + esc(r.name) + "</b>", esc(r.size), r.toughness, r.dt + (r.lethalityBonus ? " (LL+" + r.lethalityBonus + ")" : ""),
      (r.skillMods || []).map((m) => esc(m.skill) + " " + signed(m.mod)).join(", ") || "&mdash;",
      (r.savvy || []).map(esc).join(", ") || "&mdash;"],
    note: r.name === d.raceName ? [r.bonus, ...(r.restrictions || []), (r.exclusiveTalents || []).length ? "Talents: " + r.exclusiveTalents.join(", ") : ""]
      .filter(Boolean).map(esc).join("<br>") : ""
  })));
  if (env.ui.rollNote?.race) h += W.hint(esc(env.ui.rollNote.race));
  if (!race) return h + openList(env, "race");

  const G = T.skillGroups;
  if (rc.choosesSavvy || rc.extraExpertise || rc.bindBonus || rc.extraTalent) {
    h += '<h3 class="tbe-cc-sub">' + esc(race.name) + " choices</h3>";
    if (rc.choosesSavvy) {
      const opts = rc.savvyOptions.length === R.SKILL_ALL.length ? W.skillOptions(G) : rc.savvyOptions;
      h += "<label class=\"tbe-cc-block\">Bonus Savvy skill " + W.select("raceSavvyPick", opts, d.raceSavvyPick) + "</label>" +
        W.hint("An S on the sheet: +1 every time you improve that skill with XP (Ch.8).");
    }
    if (rc.extraExpertise) {
      const extra = pattern !== "none" ? ch.extraSkills.filter((x) => x.group === "Bind") : [];
      h += "<label class=\"tbe-cc-block\">Extra level of Expertise, any skill " + W.select("raceExpertisePick", W.skillOptions(G, extra), d.raceExpertisePick) + "</label>";
    }
    if (rc.bindBonus) {
      h += "<label class=\"tbe-cc-block\">+10 to one Bind " + W.select("raceBindPick", (T.magic?.binds || []).map((b) => b.name), d.raceBindPick, { blank: "(none)" }) + "</label>" +
        W.hint(pattern === "none" ? "Only with Patterned in the Weave. As things stand you are not Patterned, so you get +10 to all opposed rolls against Weave Magic instead."
          : "Applies because this character is Patterned.");
    }
    if (rc.extraTalent) {
      for (const slot of freeTalentSlots(T, d).filter((s) => s.id === "race")) h += talentSlot(env, slot);
    }
  }

  if (rc.usesHumanCulture) {
    const hc = T.chargen.humanCultures;
    const cur = hc.find((x) => x.range === d.humanCultureRange) || null;
    h += '<h3 class="tbe-cc-sub">Homeland and native Language ' + W.page(82) + " " + W.rollButton("roll-human-culture", "Roll 1d100") + "</h3>" +
      W.hint("Sets your cultural Language at 70 (Low Vestrian 20 beside it; an Old Vestrian takes Low Vestrian 70 and High Vestrian 20 instead).");
    h += W.compare("humanCultureRange", ["d100", "Homeland", "Language"], hc.map((x) => ({
      value: x.range, picked: x.range === d.humanCultureRange, cells: [esc(x.range), esc(x.name), esc(x.language)]
    })));
    if (cur && / or /.test(cur.language)) {
      h += "<label class=\"tbe-cc-block\">Which Language " + W.select("humanCultureLang", cur.language.split(" or ").map((x) => x.trim()), d.humanCultureLang, { blank: false }) + "</label>";
    }
  }
  return h + openList(env, "race");
}

/* ---- 3. Ability Scores (p.85-86) ----------------------------------------- */

function stepAbility(env) {
  const { d, T } = env;
  const scores = T.chargen.abilityScores;
  let h = head("ability", " " + W.rollButton("roll-ability", "Roll 1d6 twice"));
  h += W.hint("Pick two. Each gives +5 to its skills, one level of Expertise in one of them, one of three Talents, and a descriptor you can invoke like a Personality Trait. Click a row to pick or unpick it.");
  h += W.compare("abilityPick", ["d6", "Score", "+5 to", "Talents", "Descriptors"], scores.map((s, i) => ({
    value: s.name, picked: (d.abilityPicks || []).includes(s.name),
    cells: [i + 1, "<b>" + esc(s.name) + "</b>", s.skills.map(esc).join(", "), s.talents.map(esc).join(", "), s.descriptors.map(esc).join(", ")]
  })), { action: "ability-pick" });
  if (env.ui.rollNote?.ability) h += W.hint(esc(env.ui.rollNote.ability));
  for (let i = 0; i < 2; i++) {
    const s = scores.find((x) => x.name === (d.abilityPicks || [])[i]);
    h += '<div class="tbe-cc-box"><div class="tbe-cc-row"><b>Score ' + (i + 1) + "</b> " +
      W.select("abilityPicks", scores.map((x) => [x.name, x.name, (d.abilityPicks || []).includes(x.name) && x.name !== s?.name]), s?.name, { key: i, blank: "(none)" }) + "</div>";
    if (s) {
      const talOpts = s.talents.map((t) => {
        const rec = R.talentNamed(T.talents, t);
        return [t, t + (rec ? " (" + rec.category + ")" : "")];
      });
      h += '<div class="tbe-cc-grid3">' +
        "<label>Expertise " + W.select("abilityExpertise", s.skills, (d.abilityExpertise || [])[i], { key: i }) + "</label>" +
        "<label>Talent " + W.select("abilityTalent", talOpts, (d.abilityTalent || [])[i], { key: i }) + "</label>" +
        "<label>Descriptor " + W.select("abilityDescriptor", s.descriptors, (d.abilityDescriptor || [])[i], { key: i }) +
        W.rollButton("roll-descriptor", "", { idx: i }, { cls: "tbe-cc-small", title: "Roll a descriptor (roll aid)" }) + "</label></div>";
      const tal = R.talentNamed(T.talents, (d.abilityTalent || [])[i]);
      if (tal) h += '<div class="tbe-cc-desc">' + esc(String(tal.desc || "").slice(0, 360)) + "</div>";
    }
    h += "</div>";
  }
  return h + openList(env, "ability");
}

/* ---- 4. Attributes (p.87-88) --------------------------------------------- */

function stepAttributes(env) {
  const { d, ch } = env;
  const s = d.attrSpend || {};
  const spent = sum(s);
  const A = ch.attributes;
  const row = (key, label, rule, disabled) => "<tr><td>" + label + '<div class="tbe-cc-small">' + rule + "</div></td><td>" +
    W.stepper("attrSpend", s[key], { key, max: 5, disabled }) + "</td></tr>";
  const why = (a) => (a.sources || []).filter((p) => p.delta).map((p) => esc(p.label) + " " + (p.base ? p.delta : signed(p.delta))).join(", ");
  const ll = lethalityLevel(A.deathThreshold.value, A.lethalityBonus.value, 0);
  let h = head("attributes") + '<div class="tbe-cc-row">Five points to spend ' + W.pool("attr", spent, 5) + "</div>" +
    '<table class="tbe-cc-attr"><tbody>' +
    row("resolve", "Max Resolve", "+2 boxes per point") +
    row("initiative", "Initiative", "+1 per point", d.randomizedInit) +
    row("toughness", "Toughness", "+1 per 2 points") +
    row("dt", "Death Threshold", "+2 per point", d.randomizedDT) + "</tbody></table>";
  h += '<div class="tbe-cc-results">' +
    [["Max Resolve", A.resolveMax], ["Initiative", A.initiative], ["Toughness", A.toughness], ["Death Threshold", A.deathThreshold]]
      .map(([l, a]) => '<div title="' + esc(why(a)) + '"><span>' + l + "</span><b>" + (l === "Initiative" ? signed(a.value) : a.value) + "</b></div>").join("") +
    '<div title="Death Threshold / 3, rounded up, plus any racial bonus (p.88)"><span>Lethality Level</span><b>' + ll + "</b></div></div>";
  h += '<h3 class="tbe-cc-sub">Randomized starts ' + W.page(88) + "</h3>" +
    '<div class="tbe-cc-row">' + W.checkbox("randomizedInit", d.randomizedInit, "Initiative 6+1d6 instead of 10") +
    (d.randomizedInit ? " " + W.rollButton("roll-init", "Roll") + (d.initRoll ? " <b>" + d.initRoll + "</b>" : "") : "") + "</div>" +
    '<div class="tbe-cc-row">' + W.checkbox("randomizedDT", d.randomizedDT, "Death Threshold 15+2d4 instead of your race's, and no DT points") +
    (d.randomizedDT ? " " + W.rollButton("roll-dt", "Roll") + (d.dtRoll ? " <b>" + d.dtRoll + "</b>" : "") : "") + "</div>";
  return h + openList(env, "attributes");
}

/* ---- 5. Cultural Background (p.89-90) ------------------------------------ */

export function cultureBarred(race, culture) {
  /* Read from the verified race text: an Ogre "may not take any Civilized
     background"; "No Bolg Fiir may take the Civilized: Urban background".
     "Few if any Half-Orcs" is advice, not a bar. */
  const r = race?.restrictions || [];
  if (r.some((t) => /may not take any Civilized/i.test(t))) return /^Civilized/i.test(culture.name);
  if (r.some((t) => /^No .*Civilized: Urban/i.test(t))) return culture.name === "Civilized, Urban";
  return false;
}
function pickOptions(T, token) {
  if (Array.isArray(token)) return token;
  if (typeof token === "string" && token.startsWith("CAT:")) return token.slice(4).split("+").flatMap((c) => T.skillGroups[c] || []);
  return [];
}
export { pickOptions };

function stepCulture(env) {
  const { d, T } = env;
  const race = T.chargen.races.find((r) => r.name === d.raceName) || null;
  const list = T.chargen.culturalBackgrounds;
  let h = head("culture", " " + W.rollButton("roll-culture", "Roll 1d10"));
  h += W.compare("cultureBgName", ["d10", "Background", "Silver", "What it gives"], list.map((c) => {
    const barred = cultureBarred(race, c);
    return {
      value: c.name, picked: c.name === d.cultureBgName, dim: barred,
      cells: [esc(c.range), "<b>" + esc(c.name) + "</b>" + (barred ? ' <span class="tbe-cc-bad">not for a ' + esc(race.name) + "</span>" : ""), esc(c.silver),
        c.picks.map((p) => (p.expertise ? "Ex" : "+" + p.amount) + (p.count > 1 ? "×" + p.count : "") + " " +
          (Array.isArray(p.options) ? p.options.join("/") : String(p.options).replace("CAT:", "any ").replace("+", " or "))).map(esc).join(", ") +
          (c.extraLanguage ? ", a Language at " + c.extraLanguage : "")]
    };
  }));
  if (env.ui.rollNote?.culture) h += W.hint(esc(env.ui.rollNote.culture));
  const culture = list.find((c) => c.name === d.cultureBgName);
  if (!culture) return h + openList(env, "culture");
  if (cultureBarred(race, culture)) h += W.warn("The book says a " + esc(race.name) + " does not take this background (" + esc((race.restrictions || []).find((t) => /Civilized/.test(t)) || "") + "). Ask your GM, or roll again.");
  h += '<h3 class="tbe-cc-sub">' + esc(culture.name) + ": pick a skill for each</h3>" + W.hint("The number after each skill is its value right now, everything so far included.") + '<div class="tbe-cc-grid2">';
  culture.picks.forEach((p, pi) => {
    const opts = pickOptions(T, p.options);
    for (let slot = 0; slot < num(p.count, 1); slot++) {
      const cur = ((d.cultureBgPicks || {})[pi] || [])[slot];
      h += "<label>" + (p.expertise ? "Expertise" : "+" + p.amount) + " " +
        W.select("cultureBgPicks." + pi, opts, cur, { key: slot, blank: opts.length === 1 ? "(take it)" : "(choose)" }) + (cur ? " " + vchip(env, cur) : "") + "</label>";
    }
  });
  h += "</div>";
  if (culture.extraLanguage) h += W.hint("Also a Language at " + culture.extraLanguage + ": name it on the Career step with your other -wise and Language slots.");
  return h + openList(env, "culture");
}

/* ---- 6. Life Events (p.91-101) ------------------------------------------- */

function stepLife(env) {
  const { d, T, ui } = env;
  const sub = ui.lifeSub || "events";
  let h = head("life") + '<div class="tbe-cc-tabs">' +
    [["events", "The three events"], ["npcs", "Relationship NPCs"], ["shared", "Shared History"]].map(([k, l]) =>
      W.button("ui-set", l, { ui: "lifeSub", value: k }, { cls: sub === k ? "on" : "" })).join("") + "</div>";
  if (sub === "npcs") return h + lifeNpcs(env);
  if (sub === "shared") return h + lifeShared(env);
  h += W.hint("Roll once each on Origin, Youth and Recent, then take one of what the event offers. Pick by hand from the table if your GM allows it.");
  for (const [key, label] of [["origin", "Origin"], ["youth", "Youth"], ["recent", "Recent"]]) {
    const ev = (d.lifeEvents || {})[key];
    const table = T.lifeEvents[key] || [];
    h += '<div class="tbe-cc-box"><div class="tbe-cc-row"><b>' + label + "</b> " + W.rollButton("roll-life", "Roll 1d100", { life: key }) + " " +
      W.button("ui-toggle", (ui.lifeTable === key ? "hide" : "show") + " the table", { ui: "lifeTable", value: key }, { cls: "tbe-cc-small" }) + "</div>";
    if (ev) {
      h += '<div><b>' + esc(ev.name) + "</b> <span class=\"tbe-cc-small\">(" + esc(ev.range) + ")</span></div>" +
        (ev.desc ? '<div class="tbe-cc-desc">' + esc(ev.desc) + "</div>" : "");
      const opts = ev.options || [];
      const pick = (d.lifeChoice || {})[key];
      opts.forEach((o, i) => { h += W.radio("lifeChoice", i, pick, esc(o.label), { key, type: "number" }); });
      const cur = pick === null || pick === undefined || pick === "" ? null : opts[num(pick, -1)];
      if (cur && cur.kind === "skill-any") {
        h += "<label class=\"tbe-cc-block\">Which skill " + W.select("lifeChoiceExtra", cur.options || [], (d.lifeChoiceExtra || {})[key], { key }) + "</label>";
      } else if (cur && (cur.kind === "bind" || cur.kind === "strand") && !cur.name) {
        const names = (cur.kind === "bind" ? T.magic?.binds : T.magic?.strands) || [];
        h += "<label class=\"tbe-cc-block\">Which " + cur.kind + " " + W.select("lifeChoiceExtra", names.map((x) => x.name), (d.lifeChoiceExtra || {})[key], { key }) + "</label>";
      }
      if (cur && (cur.kind === "bind" || cur.kind === "strand") && patternOf(T, d) === "none") {
        h += W.warn("This is the Spellweaver branch, and as things stand this character is not Patterned. Take the other option, or choose the Spellweaver career (step 7).");
      }
    }
    if (ui.lifeTable === key) {
      h += W.compare("lifeEvent", ["d100", "Event"], table.map((e) => ({ value: e.range, picked: ev && ev.range === e.range, cells: [esc(e.range), esc(e.name)] })), { key, action: "life-pick" });
    }
    h += "</div>";
  }
  return h + openList(env, "life");
}

function lifeNpcs(env) {
  const { d } = env;
  let h = W.hint("Up to one per Life Event (p.91). Roll 1d4 for the kind of tie, then name them and note what they want. They go to your Notes.") +
    '<div class="tbe-cc-row">' + W.rollButton("roll-npc", "Roll 1d4 for a Relationship NPC") + "</div>";
  (d.relationshipNpcs || []).forEach((n, i) => {
    h += '<div class="tbe-cc-box tbe-cc-row"><b>' + esc(n.type) + "</b> " +
      W.text("relationshipNpcs." + i + ".name", n.name, { placeholder: "name" }) +
      W.text("relationshipNpcs." + i + ".note", n.note, { placeholder: "who they are, what they want" }) +
      W.button("remove", "&times;", { list: "relationshipNpcs", idx: i }, { cls: "tbe-cc-link" }) + "</div>";
  });
  return h;
}

function lifeShared(env) {
  const { d, T, ch } = env;
  let h = W.hint("Optional (p.94). You and another player's character share a piece of history: both of you add +5 to a skill that came out of it. A -wise or Language you do not have yet starts at 20 and takes the +5.") +
    '<div class="tbe-cc-row">' + W.button("add-shared", "Add a Shared History") + "</div>";
  const extras = ch.extraSkills.filter((x) => x.group === "Wise" || x.group === "Language");
  (d.sharedHistory || []).forEach((s, i) => {
    const known = s.skill && (R.SKILL_ALL.includes(s.skill) || extras.some((x) => x.name === s.skill || x.slot === s.skill));
    h += '<div class="tbe-cc-box"><div class="tbe-cc-row">' +
      W.text("sharedHistory." + i + ".with", s.with, { placeholder: "with whom" }) +
      W.select("sharedHistory." + i + ".skill", W.skillOptions(T.skillGroups, extras), known ? s.skill : "", { blank: s.skill && !known ? "(new: " + s.skill + ")" : "(skill)" }) +
      W.button("remove", "&times;", { list: "sharedHistory", idx: i }, { cls: "tbe-cc-link" }) + "</div>" +
      '<div class="tbe-cc-row"><span class="tbe-cc-small">or a new -wise / Language:</span> ' +
      W.text("sharedHistory." + i + ".skill", known ? "" : s.skill, { placeholder: "Harbour-wise" }) +
      W.select("sharedHistory." + i + ".group", [["Wise", "-wise"], ["Language", "Language"]], s.group || "Wise", { blank: false }) +
      (s.skill ? " " + vchip(env, s.skill) : "") + "</div></div>";
  });
  return h;
}

/* ---- 7. Previous Career (p.102-106) -------------------------------------- */

function stepCareer(env) {
  const { d, T, ch, ui } = env;
  const careers = T.chargen.careers;
  const career = careers.find((c) => c.name === d.careerName) || null;
  let h = head("career", " " + W.rollButton("roll-career", "Roll 1d10"));
  h += W.compare("careerName", ["d10", "Career", "Combat", "Adv.", "Social", "Lore", "Magic", "Silver", "Talents"], careers.map((c) => ({
    value: c.name, picked: c.name === d.careerName,
    cells: [c.d10, "<b>" + esc(c.name) + "</b>", ...["Combat", "Adventuring", "Social", "Lore", "Magic"].map((k) => num(c.pools?.[k]) || "&mdash;"), esc(c.silver), esc(c.talents)],
    note: c.name === d.careerName ? esc(c.desc || "") : ""
  })));
  if (ui.rollNote?.career) h += W.hint(esc(ui.rollNote.career));
  if (!career) return h + openList(env, "career");

  const sub = ui.careerSub || "points";
  const pattern = patternOf(T, d);
  const tabs = [["points", "Skill points"], ["slots", "-wises & Languages"], ["talents", "Talents"], ["magic", pattern === "none" ? "Magic (none)" : "Magic"]];
  h += '<div class="tbe-cc-tabs">' + tabs.map(([k, l]) => W.button("ui-set", l, { ui: "careerSub", value: k }, { cls: sub === k ? "on" : "" })).join("") + "</div>";
  if (sub === "points") h += careerPoints(env, career);
  else if (sub === "slots") h += careerSlots(env);
  else if (sub === "talents") h += careerTalents(env, career);
  else h += careerMagic(env, career);
  return h + openList(env, "career");
}

function careerPoints(env, career) {
  const { d, T, ch } = env;
  const cats = (ch.careerPoints || []);
  if (!cats.length) return W.hint(esc(career.name) + " has no skill point pools to spend.");
  let h = W.hint("Every box starts at 0. The number after each is the skill's value right now, everything so far included; nothing passes " + CAP +
    " at creation, and points that would push a skill past it are lost. Points cannot move between categories (p.102).");
  for (const cp of cats) {
    const names = T.skillGroups[cp.cat] || [];
    h += '<div class="tbe-cc-box"><div class="tbe-cc-row"><b>' + cp.cat + "</b> " + W.pool("pool:" + cp.cat, cp.allocated, cp.pool) +
      '<span class="tbe-cc-warn" data-live="lost:' + cp.cat + '">' + (cp.lost ? " " + cp.lost + " lost to the cap" : "") + "</span> " +
      W.button("spread", "Spread what is left", { cat: cp.cat }, { cls: "tbe-cc-small" }) + '</div><div class="tbe-cc-grid2">';
    names.forEach((n, idx) => {
      h += '<label class="tbe-cc-alloc"><span>' + esc(n) + "</span>" + W.stepper("alloc", (d.alloc || {})[cp.cat + "_" + idx], { key: cp.cat + "_" + idx, by: 5, max: cp.pool }) + vchip(env, n) + "</label>";
    });
    h += "</div></div>";
  }
  return h;
}

function careerSlots(env) {
  const { d, ch } = env;
  const slots = ch.extraSkills.filter((x) => (x.slot || x.name).match(/^(Career wise\/Language|Cultural extra Language|Wise: subject)/));
  if (!slots.length) return W.hint("No blank -wise or Language slots to name.");
  let h = W.hint("p.102: for each, create a new -wise or Language using the value given. Name it here; an unnamed slot reaches the sheet under its placeholder name.");
  for (const x of slots) {
    const key = x.slot || x.name;
    h += '<div class="tbe-cc-row"><span class="tbe-cc-small">' + esc(key) + " at " + x.value + "</span> " +
      W.text("wiseNames", (d.wiseNames || {})[key], { key, placeholder: "Harbour-wise, Thessian, Horse-wise..." }) + "</div>";
  }
  return h;
}

function careerTalents(env, career) {
  const { d, T, ch } = env;
  const auto = (career.talentPicks?.auto || []);
  let h = "<div><b>Granted:</b> " + (auto.length ? auto.map((t) => {
    const got = ch.talents.find((x) => x.why === "Career: " + career.name && R.talentNamed(T.talents, t)?.name === x.name);
    return esc(t) + (got && got.ranks > 1 ? "" : "") + (got?.specialization ? ' <span class="tbe-cc-small">(' + esc(got.specialization) + ")</span>" : "");
  }).join(", ") : "none named outright") + "</div>";
  const slots = freeTalentSlots(T, d).filter((s) => s.step === "career");
  for (const slot of slots) h += talentSlot(env, slot);
  const swapOpts = auto.map((t) => ["auto:" + t, t]).concat((career.talentPicks?.picks || []).flatMap((p, pi) =>
    Array.from({ length: num(p.count, 1) }, (_, i) => ["slot:career" + pi + "_" + i, "free pick " + (pi + 1) + (num(p.count, 1) > 1 ? "." + (i + 1) : "") + " (" + (p.note || (p.named || []).concat(p.categories || []).join(" / ")) + ")"])));
  h += '<h3 class="tbe-cc-sub">Trade a Talent for Status ' + W.page(102) + "</h3>" +
    W.hint("“You may swap out one of your Previous Career Talents for +2 Status.”") +
    "<label class=\"tbe-cc-block\">" + W.select("careerTalentSwap", swapOpts, d.careerTalentSwap, { blank: "(keep them all)" }) + "</label>";
  return h;
}

function careerMagic(env, career) {
  const { d, T, ch } = env;
  const M = T.magic || {};
  const SW = (M.rules || {}).spellweaverChargen || {};
  const strandCap = (M.rules || {}).chargenStrandCap || 5;
  const bindCap = SW.bindCapAtChargen || 70;
  const BINDS = (M.binds || []).map((b) => b.name), STRANDS = (M.strands || []).map((s) => s.name);
  const desc = (list, n) => ((list || []).find((x) => x.name === n) || {}).desc || "";
  if (raceBarsMagic(T, d.raceName)) {
    return W.warn("A " + esc(d.raceName) + " can never become any kind of Spellweaver or Fade (Ch.5)." +
      (career.name === "Spellweaver" ? " As a Spellweaver this character would get the career's skill points and no magic at all." : ""));
  }
  const pattern = patternOf(T, d);
  let h = "";
  if (career.name !== "Spellweaver") {
    h += W.checkbox("takeFade", d.takeFade, "Take the <b>Faded Pattern</b> Talent and become a Fade") +
      W.hint("Costs two of your starting Talent selections (p.48). You start with 5 Strand levels, every Bind is capped at 70 and every Strand at 7 for life, and a critical failure on a casting roll costs 1 Fraying point.");
  }
  if (pattern === "none") return h;
  const bindV = (n) => (ch.extraSkills.find((x) => x.name === "Bind: " + n) || {}).value || 0;
  const strandV = (n) => (ch.strands.find((x) => x.name === n) || {}).level || 0;
  const bindRow = (bind, n, cur, extra) => '<label class="tbe-cc-alloc" title="' + esc(desc(M.binds, n).slice(0, 300)) + '"><span>' + esc(n) + (extra || "") + "</span>" +
    W.stepper(bind, cur, { key: n, by: 5 }) + '<span class="tbe-cc-val' + (bindV(n) >= bindCap ? " cap" : "") + '" data-live="bind:' + esc(n) + '">' + bindV(n) + "</span></label>";
  const strandRow = (bind, n, cur) => '<label class="tbe-cc-alloc" title="' + esc(desc(M.strands, n).slice(0, 300)) + '"><span>' + esc(n) + "</span>" +
    W.stepper(bind, cur, { key: n }) + '<span class="tbe-cc-val' + (strandV(n) >= strandCap ? " cap" : "") + '" data-live="strand:' + esc(n) + '">' + strandV(n) + "</span></label>";

  if (pattern === "spellweaver") {
    const convo = (M.convocations || []).find((c) => c.name === d.convocation) || null;
    h += '<h3 class="tbe-cc-sub">Convocation ' + W.page(106) + " " + W.rollButton("roll-convocation", "Roll 1d" + (M.convocations || []).length) + "</h3>" +
      W.hint("A typical combination, not a cage: picking one fills your Binds and Strands below, which you can still change.") +
      W.compare("convocation", ["Convocation", "Binds", "Strands", "Thin"], (M.convocations || []).map((c) => ({
        value: c.name, picked: c.name === d.convocation, cells: ["<b>" + esc(c.name) + "</b>", c.binds.map(esc).join(", "), c.strands.map(esc).join(", "), c.thinStrands.map(esc).join(", ")]
      })), { action: "convocation-pick" });
    const picks = (title, bind, arr, count, list, clash) => '<div class="tbe-cc-row"><b>' + title + "</b> " + W.pool("pick:" + bind, arr.filter(Boolean).length, count) + "</div><div>" +
      list.map((n) => W.chip(bind, n, arr.includes(n), n, { max: count, disabled: arr.filter(Boolean).length >= count || (clash || []).includes(n), title: desc(bind === "swBinds" ? M.binds : M.strands, n).slice(0, 300) })).join("") + "</div>";
    h += picks("Two Binds (+" + (SW.bindBonus || 10) + " each)", "swBinds", d.swBinds || [], SW.binds || 2, BINDS) +
      picks("Four Strands", "swStrands", d.swStrands || [], SW.strands || 4, STRANDS, d.swThin) +
      picks("Two Thin Strands", "swThin", d.swThin || [], SW.thinStrands || 2, STRANDS, d.swStrands) +
      W.hint("A Thin Strand cannot be developed at all during creation and costs double to learn later.");
    h += '<div class="tbe-cc-box"><div class="tbe-cc-row"><b>Magic points</b> ' + W.pool("pool:magic", sum(d.magicAlloc), SW.magicPool || 100) + " " +
      W.button("spread-magic", "Spread what is left over your two Binds", {}, { cls: "tbe-cc-small" }) + "</div>" +
      W.hint("Any of the five Binds; nothing passes " + bindCap + ".") + '<div class="tbe-cc-grid2">' +
      BINDS.map((n) => bindRow("magicAlloc", n, (d.magicAlloc || {})[n], (d.swBinds || []).includes(n) ? " ★" : "")).join("") + "</div></div>";
    const chosen = (d.swStrands || []).filter(Boolean);
    h += '<div class="tbe-cc-box"><div class="tbe-cc-row"><b>Strand levels</b> ' + W.pool("pool:strands", sum(d.strandAlloc), SW.strandLevels || 10) + " among your four Strands</div>" +
      (chosen.length ? '<div class="tbe-cc-grid2">' + chosen.map((n) => strandRow("strandAlloc", n, (d.strandAlloc || {})[n])).join("") + "</div>" : W.hint("Choose your four Strands first.")) + "</div>";
    h += '<div class="tbe-cc-box"><div class="tbe-cc-row"><b>Three extra levels</b> ' + W.pool("pool:extra", sum(d.strandExtra), SW.extraStrandLevels || 3) + " on any Strand but a Thin one</div>" +
      '<div class="tbe-cc-grid2">' + STRANDS.filter((n) => !(d.swThin || []).includes(n)).map((n) => strandRow("strandExtra", n, (d.strandExtra || {})[n])).join("") + "</div></div>";
    h += '<div class="tbe-cc-grid2">' +
      "<label>Expertise in one Bind " + W.select("bindExpertise", BINDS, d.bindExpertise) + "</label>" +
      "<label>d8 Thread Die attuned to " + W.select("threadAttunement", [{ group: "Bind", items: BINDS.map((n) => ["Bind:" + n, n]) }, { group: "Strand", items: STRANDS.map((n) => ["Strand:" + n, n]) }], d.threadAttunement) + "</label></div>" +
      "<label class=\"tbe-cc-block\">What the Thread looks like " + W.text("threadName", d.threadName, { placeholder: "a wolf's tooth, a piece of chalk..." }) + "</label>";
  } else {
    const pool = (M.rules || {}).fadeChargenStrands || 5;
    h += '<div class="tbe-cc-box"><div class="tbe-cc-row"><b>Faded Pattern Strand levels</b> ' + W.pool("pool:fade", sum(d.fadeStrands), pool) + "</div>" +
      '<div class="tbe-cc-grid2">' + STRANDS.map((n) => strandRow("fadeStrands", n, (d.fadeStrands || {})[n])).join("") + "</div></div>";
  }
  h += "<label class=\"tbe-cc-block\">True Name " + W.text("trueName", d.trueName, { placeholder: "in the language of your people" }) + "</label>" +
    W.hint("The Weave imprints one on everyone it Patterns. Anyone who learns it can target you at any distance, so guard it.");
  return h;
}

/* ---- 8. Rounding Out (p.108) --------------------------------------------- */

function stepRounding(env) {
  const { d, T, ch } = env;
  const ages = T.chargen.roundingOutAges;
  const age = ages.find((a) => a.key === d.roAge) || null;
  const pattern = patternOf(T, d);
  const M = T.magic || {};
  let h = head("rounding");
  h += '<h3 class="tbe-cc-sub">Bonus</h3>' +
    W.radio("roBonusChoice", "talent", d.roBonusChoice, "Any one Talent you meet the requirements for") +
    W.radio("roBonusChoice", "status", d.roBonusChoice, "+1 Status") +
    W.radio("roBonusChoice", "money", d.roBonusChoice, "+100 sp");
  for (const slot of freeTalentSlots(T, d).filter((s) => s.id === "rounding")) h += talentSlot(env, slot);

  h += '<h3 class="tbe-cc-sub">Age ' + W.rollButton("roll-age", "Roll 1d6") + " " + W.aid("The book lists three ages and no table. 1-2 Young, 3-4 Adult, 5-6 Old.") + "</h3>";
  h += W.compare("roAge", ["Age", "Endurance", "Death Threshold", "Bonus points", "Also"], ages.map((a) => ({
    value: a.key, picked: a.key === d.roAge,
    cells: ["<b>" + esc(a.key) + "</b>", a.endurance ? signed(a.endurance) : "&mdash;", a.dt ? signed(a.dt) : "&mdash;",
      a.anyPoints + " any" + (a.lorePoints ? " + " + a.lorePoints + " Lore" : ""), a.expertise ? "+1 Expertise" : "&mdash;"]
  })));
  if (env.ui.rollNote?.age) h += W.hint(esc(env.ui.rollNote.age));
  if (age && age.expertise) h += "<label class=\"tbe-cc-block\">Old's Expertise " + W.select("roOldExpertiseSkill", W.skillOptions(T.skillGroups), d.roOldExpertiseSkill) + "</label>";

  if (age) {
    const extras = ch.extraSkills.filter((x) => x.group === "Wise" || x.group === "Language" || x.group === "Lore");
    const catRow = (bind, n, key) => '<label class="tbe-cc-alloc"><span>' + esc(n) + "</span>" + W.stepper(bind, (d[bind] || {})[key || n], { key: key || n, by: 5 }) + vchip(env, key || n) + "</label>";
    if (age.lorePoints) {
      h += '<div class="tbe-cc-box"><div class="tbe-cc-row"><b>Lore points</b> ' + W.pool("pool:roLore", sum(d.roLoreAlloc), age.lorePoints) + "</div>" +
        '<div class="tbe-cc-grid2">' + T.skillGroups.Lore.map((n) => catRow("roLoreAlloc", n)).join("") + "</div></div>";
    }
    const cats = Object.keys(T.skillGroups);
    const open = env.ui.roCat || cats[0];
    h += '<div class="tbe-cc-box"><div class="tbe-cc-row"><b>Bonus points, any category</b> ' + W.pool("pool:roAny", roAnySpent(T, d), age.anyPoints) + "</div>" +
      W.hint("Nothing passes " + CAP + "." + (pattern !== "none" ? " Binds cost 1 point a point; Strand levels cost " + ((M.rules || {}).roundingOutStrandCost || 5) + " points a level, to level " + ((M.rules || {}).chargenStrandCap || 5) + "." : "")) +
      '<div class="tbe-cc-tabs">' + cats.concat(extras.length ? ["Other"] : []).concat(pattern !== "none" ? ["Magic"] : [])
        .map((c) => W.button("ui-set", c + (sumCat(env, c) ? " (" + sumCat(env, c) + ")" : ""), { ui: "roCat", value: c }, { cls: open === c ? "on" : "" })).join("") + "</div>" +
      '<div class="tbe-cc-grid2">';
    if (T.skillGroups[open]) h += T.skillGroups[open].map((n) => catRow("roAlloc", n)).join("");
    else if (open === "Other") h += extras.map((x) => catRow("roExtraAlloc", x.name, x.slot || x.name)).join("");
    else if (open === "Magic") {
      const bindV = (n) => (ch.extraSkills.find((x) => x.name === "Bind: " + n) || {}).value || 0;
      const strandV = (n) => (ch.strands.find((x) => x.name === n) || {}).level || 0;
      h += (M.binds || []).map((b) => '<label class="tbe-cc-alloc"><span>Bind: ' + esc(b.name) + "</span>" + W.stepper("roBindAlloc", (d.roBindAlloc || {})[b.name], { key: b.name, by: 5 }) +
        '<span class="tbe-cc-val" data-live="bind:' + esc(b.name) + '">' + bindV(b.name) + "</span></label>").join("") +
        (M.strands || []).filter((s) => !(d.swThin || []).includes(s.name) || pattern === "fade").map((s) => '<label class="tbe-cc-alloc"><span>Strand: ' + esc(s.name) + " (levels)</span>" +
          W.stepper("roStrandAlloc", (d.roStrandAlloc || {})[s.name], { key: s.name }) + '<span class="tbe-cc-val" data-live="strand:' + esc(s.name) + '">' + strandV(s.name) + "</span></label>").join("");
    }
    h += "</div></div>";
  }

  h += '<h3 class="tbe-cc-sub">Three bonus Savvy skills ' + W.page(108) + "</h3>" + W.hint("Not Piety, and not a Strand.") + '<div class="tbe-cc-grid3">';
  const savvyExtras = ch.extraSkills.filter((x) => x.group === "Wise" || x.group === "Language" || x.group === "Bind" || (x.group === "Lore" && x.name !== "Piety"));
  for (let i = 0; i < 3; i++) h += "<label>Savvy " + (i + 1) + " " + W.select("roSavvy", W.skillOptions(T.skillGroups, savvyExtras), (d.roSavvy || [])[i], { key: i }) + "</label>";
  h += "</div>";
  return h + openList(env, "rounding");
}
function sumCat(env, c) {
  const { d, T } = env;
  if (T.skillGroups[c]) return T.skillGroups[c].reduce((n, s) => n + Math.max(0, num((d.roAlloc || {})[s])), 0);
  if (c === "Other") return sum(d.roExtraAlloc);
  if (c === "Magic") return sum(d.roBindAlloc) + sum(d.roStrandAlloc);
  return 0;
}

/* ---- 9. Equip Your Character (p.109) ------------------------------------- */

function stepEquip(env) {
  const { d, T, ch, ui } = env;
  const E = T.equipment;
  let h = head("equip");
  h += '<div class="tbe-cc-box"><b>Starting weapon</b>: a Dagger (every character starts with one).</div>';

  h += '<div class="tbe-cc-box"><div class="tbe-cc-row"><b>Starting silver</b> ' + W.rollButton("roll-silver", "Roll what is left") + "</div><table class=\"tbe-cc-mini\">" +
    ch.silver.parts.map((p, i) => "<tr><td>" + esc(p.label) + "</td><td>" + esc(p.dice || "") + "</td><td>" + (p.value === null ? '<span class="tbe-cc-small">not rolled</span>' : "<b>" + p.value + " sp</b>") + "</td></tr>").join("") +
    "<tr><td><b>Total</b></td><td></td><td><b>" + (ch.silver.total === null ? "&mdash;" : ch.silver.total + " sp") + "</b></td></tr></table>" +
    W.hint("Your career and culture silver are rolled here too, so you can shop with it before the character exists.") + "</div>";

  const pieces = ch.equipment.freeArmorPieces;
  h += '<div class="tbe-cc-box"><div class="tbe-cc-row"><b>Free armour</b> ' +
    (pieces === null ? W.rollButton("roll-armor", "Roll 1d3+1 pieces") : W.pool("pool:armor", (d.freeArmor || []).length, pieces, "pieces")) + "</div>" +
    W.hint("As long as you have whatever training the armour requires (p.109). One piece covers one location.");
  if (pieces !== null) {
    (d.freeArmor || []).forEach((a, i) => { h += '<div class="tbe-cc-row">' + esc(a.name) + " on " + esc((LOCATIONS.find(([k]) => k === a.loc) || [, a.loc])[1]) + " " + W.button("remove", "&times;", { list: "freeArmor", idx: i }, { cls: "tbe-cc-link" }) + "</div>"; });
    if ((d.freeArmor || []).length < pieces) {
      const opts = E.armor.map((a) => [a.name, a.name + " (" + a.ap + " AP, Bulk " + a.bulk + ")" + (R.armorAllowedFree(a, ch.talents, d.raceName) ? "" : ", needs training"), !R.armorAllowedFree(a, ch.talents, d.raceName)]);
      const f = ui.freePick || {};
      h += '<div class="tbe-cc-row"><select data-ui="freePick.name"><option value="">(armour)</option>' + opts.map(([v, l, dis]) => '<option value="' + esc(v) + '"' + (f.name === v ? " selected" : "") + (dis ? " disabled" : "") + ">" + esc(l) + "</option>").join("") + "</select>" +
        '<select data-ui="freePick.loc">' + LOCATIONS.map(([k, l]) => '<option value="' + k + '"' + ((f.loc || "body") === k ? " selected" : "") + ">" + l + "</option>").join("") + "</select>" +
        W.button("take-free", "Take it") + "</div>";
    }
  }
  h += "</div>";

  const b = ui.buy || {};
  const kind = b.kind || "weapon";
  const list = kind === "armor" ? E.armor : kind === "shield" ? E.shields : E.weapons;
  const sel = list.find((x) => x.name === b.name) || null;
  const qty = Math.max(1, num(b.qty, 1));
  h += '<div class="tbe-cc-box"><div class="tbe-cc-row"><b>Shopping</b> ' + (ch.silver.left === null ? '<span class="tbe-cc-small">roll your silver first</span>' : "<b>" + ch.silver.left + " sp</b> left") + "</div>" +
    '<div class="tbe-cc-row"><select data-ui="buy.kind">' + ["weapon", "shield", "armor"].map((k) => '<option value="' + k + '"' + (kind === k ? " selected" : "") + ">" + k + "</option>").join("") + "</select>" +
    '<select data-ui="buy.name"><option value="">(item)</option>' + list.map((x) => '<option value="' + esc(x.name) + '"' + (b.name === x.name ? " selected" : "") + ">" + esc(x.name) + " (" + x.sp + " sp)</option>").join("") + "</select>" +
    (kind === "armor" ? '<select data-ui="buy.loc">' + LOCATIONS.map(([k, l]) => '<option value="' + k + '"' + ((b.loc || "body") === k ? " selected" : "") + ">" + l + "</option>").join("") + "</select>"
      : '<input type="number" min="1" max="20" data-ui="buy.qty" value="' + qty + '" style="width:48px">') +
    W.button("buy", "Buy" + (sel ? " for " + sel.sp * (kind === "armor" ? 1 : qty) + " sp" : ""), {}, { disabled: !sel }) + "</div>";
  if (sel) {
    const bits = kind === "weapon" ? [sel.skillName, "Dmg " + sel.dmg, sel.enc !== null ? "ENC " + sel.enc : "", sel.notes] : kind === "shield" ? ["AP " + sel.ap, "ENC " + sel.enc, sel.notes] : ["AP " + sel.ap, "Bulk " + sel.bulk, sel.training === "Y" ? "needs Armor Training to use Combat Maneuvers on Body or Arms" : ""];
    h += W.hint(bits.filter(Boolean).map(esc).join(" &middot; "));
    if (kind === "shield" && d.raceName === "Ogre" && !/Medium|Large/.test(sel.name)) h += W.warn("An Ogre can only use Medium or Large shields (Ch.5).");
  }
  if ((d.purchases || []).length) {
    h += '<table class="tbe-cc-mini">' + d.purchases.map((p, i) => "<tr><td>" + (p.qty > 1 ? p.qty + " × " : "") + esc(p.name) +
      (p.loc ? " (" + esc((LOCATIONS.find(([k]) => k === p.loc) || [, p.loc])[1]) + ")" : "") + "</td><td>" + p.sp * Math.max(1, num(p.qty, 1)) + " sp</td><td>" +
      W.button("remove", "&times;", { list: "purchases", idx: i }, { cls: "tbe-cc-link" }) + "</td></tr>").join("") + "</table>";
  }
  if (ch.silver.left !== null && ch.silver.left < 0) h += W.warn("Over budget by " + -ch.silver.left + " sp.");
  /* p.109 step 5: "Calculate your Initiative penalty". The rule is rules/armor.mjs. */
  const worn = ch.equipment.freeArmor.map((a) => ({ name: a.name, n: 1 })).concat(ch.equipment.bought.filter((p) => p.kind === "armor").map((p) => ({ name: p.name, n: 1 })))
    .map((a) => ({ type: "armor", system: { bulk: (E.armor.find((x) => x.name === a.name) || {}).bulk || 0 } }));
  if (worn.length) {
    const bulk = wornBulk(worn), pen = initPenalty(bulk);
    /* Start from the number the live sheet shows (Talent effects included). */
    const init = ch.attributes.initiative.value + ((talentEffects(ch, T)["system.initiative"] || {}).total || 0);
    h += '<div class="tbe-cc-row"><b>Armour</b> Bulk ' + bulk + " &rarr; Initiative " + (pen ? "&minus;" + pen : "0") +
      " (the sheet's " + signed(init) + " becomes " + signed(init - pen) + " with it on) " + W.page(142) + "</div>";
  }
  h += W.hint("Every character starts with a d12 in each Supply die (Gear, Ammo, Rations, Medical). Set on Create.") + "</div>";
  return h + openList(env, "equip");
}

/* ---- 10. Personality (p.110) --------------------------------------------- */

function stepPersonality(env) {
  const { d, T } = env;
  const traits = T.chargen.personalityTraits;
  const picked = d.personalityPicks || [];
  let h = head("personality", " " + W.rollButton("roll-personality", "Roll two") + " " + W.aid("A roll on the book's own list of traits; the book says choose two or three."));
  h += W.hint("Choose two or three, or write your own. You can invoke a trait for a bonus when it fits what you do.") +
    '<div class="tbe-cc-chips">' + traits.map((t) => W.chip("personalityPicks", t, picked.includes(t), t)).join("") + "</div>" +
    "<label class=\"tbe-cc-block\">Your own, comma-separated " + W.text("personalityCustom", d.personalityCustom, { placeholder: "stubborn, sentimental about horses" }) + "</label>";
  const desc = (d.abilityDescriptor || []).filter(Boolean);
  if (desc.length) h += W.hint("From your Ability Scores, and used the same way: " + desc.map(esc).join(", ") + ".");
  return h + openList(env, "personality");
}

/* ---- 11. Goals (p.111-113) ----------------------------------------------- */

export function goalSentence(g) {
  return "I will " + (g.action || "[take action]") + " to overcome " + (g.obstacle || "[obstacle]") + " so that I can " + (g.want || "[desire]") + ".";
}
function stepGoals(env) {
  const { d, ui } = env;
  const g = ui.goal || {};
  let h = head("goals") + W.hint("Optional. “It is fine to leave goals blank and discover them in play.” A goal earns XP only if it makes you roll against something that stands in your way.");
  h += '<div class="tbe-cc-box">' +
    '<label class="tbe-cc-block">1. What do you want? <input type="text" data-ui="goal.want" value="' + esc(g.want || "") + '" placeholder="chart the safest route through the Draithwood"></label>' +
    '<label class="tbe-cc-block">2. What stands in the way? <input type="text" data-ui="goal.obstacle" value="' + esc(g.obstacle || "") + '" placeholder="the forest is unmapped, haunted, and full of dangers"></label>' +
    '<label class="tbe-cc-block">3. What will you do about it? <input type="text" data-ui="goal.action" value="' + esc(g.action || "") + '" placeholder="use Track to find paths"></label>' +
    '<div class="tbe-cc-row"><select data-ui="goal.kind"><option value="individual"' + (g.kind !== "shared" ? " selected" : "") + '>Individual</option><option value="shared"' + (g.kind === "shared" ? " selected" : "") + ">Shared with the party</option></select> " +
    W.button("add-goal", "Add this goal") + "</div>" +
    '<div class="tbe-cc-concept" data-live="goal-sentence">' + esc(goalSentence(g)) + "</div></div>";
  (d.goals || []).forEach((x, i) => {
    h += '<div class="tbe-cc-row"><span class="tbe-cc-small">' + esc(x.kind || "individual") + "</span> " + W.text("goals." + i + ".text", x.text) + W.button("remove", "&times;", { list: "goals", idx: i }, { cls: "tbe-cc-link" }) + "</div>";
  });
  const n = (d.goals || []).length;
  if (n && n < 3) h += W.hint("Keep three to five active: without goals there is no XP.");
  if (n > 5) h += W.warn("More than five active goals pulls you in too many directions.");
  return h;
}

/* ---- 12. Status (p.114) -------------------------------------------------- */

function stepStatus(env) {
  const { d, ch } = env;
  const a = ch.attributes.status;
  let h = head("status") + W.hint("Optional. Status starts at 0 and comes from choices you already made; they are counted here. Change it by hand only if your GM says so.");
  h += '<table class="tbe-cc-mini">' + (a.sources || []).filter((s) => s.delta).map((s) => "<tr><td>" + esc(s.label) + "</td><td>" + signed(s.delta) + "</td></tr>").join("") +
    "<tr><td><b>Status</b></td><td><b>" + a.value + "</b></td></tr></table>" +
    "<label class=\"tbe-cc-block\">Adjust by hand " + W.stepper("statusAdjust", d.statusAdjust, { min: -5, max: 10 }) + "</label>" +
    W.hint("High Status may let the GM start you with more expensive equipment instead of the armour and coin roll (p.109).");
  return h;
}

/* ---- Review --------------------------------------------------------------- */

function stepReview(env) {
  const { d, st, ch } = env;
  const open = STEPS.filter((s) => s.key !== "review" && (st[s.key]?.open || []).length);
  let h = head("review");
  if (open.length) {
    h += '<div class="tbe-cc-open"><b>Still open</b>' + open.map((s) => '<div class="tbe-cc-row">' +
      W.button("goto", s.n + ". " + esc(s.label), { step: s.key }, { cls: "tbe-cc-link" }) + ": " + st[s.key].open.map(esc).join("; ") + "</div>").join("") +
      W.hint("None of this blocks Create. Anything left open is written to the Notes tab as still to decide.") + "</div>";
  } else h += '<div class="tbe-cc-done">Every step is complete.</div>';
  if (ch.notes.length) h += '<div class="tbe-cc-box"><b>Notes</b><ul>' + ch.notes.map((n) => "<li>" + esc(n) + "</li>").join("") + "</ul></div>";
  h += '<div class="tbe-cc-box">' +
    W.checkbox("wipe", d.wipe, "Replace this actor's skills, Talents, weapons, armour, shields, Strands and Threads") +
    W.checkbox("seedNotes", d.seedNotes, "Write the concept, choices and anything still open to the Notes tab") + "</div>" +
    '<div class="tbe-cc-row"><button type="button" class="tbe-cc-create" data-action="create"><i class="fas fa-user-check"></i> Create ' +
    esc(ch.identity.name || env.actorName || "Character") + "</button></div>" +
    W.hint("Writes exactly what the sheet on the right shows. Nothing touches the actor before this.");
  return h;
}

export const RENDER = {
  concept: stepConcept, race: stepRace, ability: stepAbility, attributes: stepAttributes, culture: stepCulture,
  life: stepLife, career: stepCareer, rounding: stepRounding, equip: stepEquip, personality: stepPersonality,
  goals: stepGoals, status: stepStatus, review: stepReview
};

export function renderStep(key, env) {
  return (RENDER[key] || RENDER.concept)(env);
}
