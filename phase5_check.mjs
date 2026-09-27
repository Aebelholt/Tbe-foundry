/* phase5_check.mjs — the defects a played session found, and nothing else.
 *
 * Every assertion here exists because a real walk-through of the tools turned
 * something up that all fourteen other check scripts were happy with. That is
 * the point of the file: mechanical tests check that the code does what the
 * code says, and each of these was a case where the code did exactly that and
 * the result still reached a player as damage.
 *
 *   1. The Godbound gate. Both chargen paths minted a Piety skill at 0 on
 *      every character as a placeholder, so TBE.godbound() -- whose only job
 *      is to answer "is this a Godbound?" -- said yes to every Warrior in the
 *      world. Praying at Piety 0 always fails and always spends Piety, so
 *      opening TBE: Miracle once Cast Out an ordinary character for good.
 *   2. Career points lost to the 70 creation cap in silence, while the card
 *      reported them as spent ("Combat 80/80" with 30 points gone).
 *   3. Two stores for one rule: TBE: Clocks kept extended rolls on a journal,
 *      every other tracker lives in TBE.trackers(), and TBE: Status read only
 *      the journal -- so five open trackers displayed as "none running".
 *   4. Page furniture in extracted data: the printed page number absorbed into
 *      20 creature ability notes and one NPC trait row.
 *   5. Creature names printed across lines cut short: "Brakk-Thuun)" and
 *      "Skarn)" instead of "Brutesworn (Brakk-Thuun)" and "Orc Chieftain
 *      (Skarn)".
 *
 * Run: node phase5_check.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");

/* The Create Character window's calculation, its page and its Create
   payload: the one chargen path since v0.53.0. */
const CG = await (async () => {
  const sys = "./system/the-broken-empires/module/chargen/";
  const { TABLES } = await import(sys + "tables.mjs");
  const R = await import(sys + "rules.mjs");
  const DR = await import(sys + "draft.mjs");
  const S = await import(sys + "steps.mjs");
  const C = await import(sys + "creator.mjs");
  const CM = await import(sys + "commit.mjs");
  const T = Object.assign({}, TABLES, { skillGroups: R.SKILL_GROUPS });
  const draft = (o) => Object.assign(DR.defaultDraft(T), o);
  const derive = (d) => C.deriveWith(T, d);
  const payloadFor = (o) => CM.buildPayload(derive(draft(o)), draft(o), T, { actor: { name: "P", type: "character", system: { status: 0 } } });
  return {
    T, draft, derive, payloadFor,
    ctx: { data: T.chargen, magic: T.magic, talents: T.talents, lib: C.LIB },
    status: (d) => DR.stepStatus(T, d, derive(d)),
    page: (key, d, ui) => { const ch = derive(d); return S.renderStep(key, { d, T, ch, st: DR.stepStatus(T, d, ch), ui: ui || {}, concepts: C.conceptColumns(T, null) }); },
    skill: (p, n) => p.items.find((i) => i.type === "skill" && i.name === n) || null,
    actorOf: (p) => ({ items: p.items.map((i, k) => Object.assign({ id: "i" + k }, i)), system: {} })
  };
})();
const J = (f) => JSON.parse(read(f));

let pass = 0, fail = 0;
const check = (cond, label, extra) => {
  if (cond) { pass++; console.log("  PASS  " + label); }
  else { fail++; console.log("  FAIL  " + label + (extra !== undefined ? "  <- " + JSON.stringify(extra) : "")); }
};
const section = (t) => console.log("\n" + t);

/* ------------------------------------------------------------------ harness */
const CHARGEN = J("data/chargen.json"), TALENTS = J("data/talents.json"),
      DIVINE = J("data/divine.json"), MAGIC = J("data/magic.json");
const LIB = read("macros/_lib.js");

let rollQueue = [];
const queueRolls = (...v) => { rollQueue = v.slice(); };

const LOCS = ["body", "rArm", "lArm", "rLeg", "lLeg", "head"];
const emptyWounds = () => LOCS.reduce((o, l) => {
  o[l] = { wp: 0, imp: 0, inf: false, septic: false, rb: null, fw: 0, fwKind: "" }; return o; }, {});

function makeActor(over) {
  const a = { name: "Corrin", type: "character", items: [], flags: {}, statuses: new Set(),
    system: Object.assign({
      race: "Human", career: "", culture: "", silver: 0, deity: "", domains: [], holySymbol: "",
      castOut: false, noGreaterSessions: 0,
      deathThreshold: { value: 20, max: 20 }, resolve: { value: 6, max: 6 },
      toughness: 0, fatigue: 0, fraying: 0, size: "Medium", pattern: "none", wounds: emptyWounds(),
      supply: { gear: 8, ammo: 8, medical: 8, rations: 8 },
      experience: { available: 0, earned: 0 },
      get totalWp() { return Object.values(this.wounds).reduce((n, w) => n + (w.wp || 0), 0); }
    }, (over && over.system) || {}), ...(over || {}) };
  a.update = async (d) => { for (const [k, v] of Object.entries(d)) { const p = k.split(".");
    let c = a; for (let i = 0; i < p.length - 1; i++) { c[p[i]] = c[p[i]] || {}; c = c[p[i]]; }
    c[p[p.length - 1]] = v; } return a; };
  a.createEmbeddedDocuments = async (t, docs) => docs.map((x, i) => {
    const it = JSON.parse(JSON.stringify(x)); it.id = "i" + a.items.length + i;
    it.update = async function (u) { for (const [k, v] of Object.entries(u)) { const p = k.split(".");
      if (p.length === 2) { it[p[0]] = it[p[0]] || {}; it[p[0]][p[1]] = v; } else it[k] = v; } return it; };
    a.items.push(it); return it; });
  a.deleteEmbeddedDocuments = async (t, ids) => { a.items = a.items.filter((i) => !ids.includes(i.id)); return []; };
  a.updateEmbeddedDocuments = async (t, ups) => ups.map((u) => {
    const it = a.items.find((i) => i.id === (u._id || u.id)); if (!it) return null;
    for (const [k, v] of Object.entries(u)) { if (k === "_id" || k === "id") continue; const p = k.split(".");
      let c = it; for (let i = 0; i < p.length - 1; i++) { c[p[i]] = c[p[i]] || {}; c = c[p[i]]; }
      c[p[p.length - 1]] = v; } return it; });
  a.toggleStatusEffect = async () => true;
  return a;
}

function harness(store, actor, journals) {
  const said = [];
  global.foundry = { utils: { duplicate: (x) => JSON.parse(JSON.stringify(x)) } };
  global.CONFIG = { sounds: { dice: null }, statusEffects: [], TBE: {} };
  global.Roll = class {
    constructor(f) { this.formula = String(f); }
    async evaluate() { this.total = rollQueue.length ? rollQueue.shift() : 1; return this; }
  };
  global.ui = { notifications: { warn: (m) => said.push("[warn] " + m), info: (m) => said.push("[info] " + m),
                                 error: (m) => said.push("[err] " + m) } };
  global.canvas = { tokens: { controlled: actor ? [{ actor }] : [] } };
  global.ChatMessage = { getSpeaker: () => ({}), create: async (d) => { said.push(d.content); return d; } };
  global.Item = { DEFAULT_ICON: "icons/svg/item-bag.svg" };
  global.game = {
    user: { isGM: true, character: null, targets: new Set() },
    actors: { getName: () => null }, tables: { getName: () => null },
    journal: { getName: (n) => (journals || {})[n] || null },
    macros: { getName: () => null }, messages: { contents: [] },
    settings: { get: (ns, k) => (store[k] !== undefined ? store[k] : {}),
                set: async (ns, k, v) => { store[k] = v; return v; } }
  };
  return said;
}

const BLOCK = {
  data: "const TBE_DATA = { tables: [] };\n",
  chargen: "const TBE_CHARGEN = " + JSON.stringify(CHARGEN) + ";\nconst TBE_TALENTS = " + JSON.stringify(TALENTS) + ";\n",
  divine: "const TBE_DIVINE = " + JSON.stringify(DIVINE) + ";\n",
  magic: "const TBE_MAGIC = " + JSON.stringify(MAGIC) + ";\n"
};

async function run(macro, answer, { store = {}, actor = null, journals = {}, blocks = [], lib = LIB } = {}) {
  const said = harness(store, actor, journals);
  const fn = typeof answer === "function" ? answer : () => answer;
  global.__ANSWER = async (t, c, o) => fn(t, c, o);
  const pre = ["data", ...blocks].map((b) => BLOCK[b]).join("");
  const code = pre + lib.replace(/TBE\.prompt = async function[\s\S]*?\n};/,
    "TBE.prompt = async function (t, c, o) { return await globalThis.__ANSWER(t, c, o); };")
    + "\n" + read("macros/" + macro);
  await new Function("return (async()=>{" + code + "})()")().catch((e) => said.push("[throw] " + e.message));
  return said.map((s) => String(s).replace(/<[^>]+>/g, " ").replace(/&mdash;/g, "-")
    .replace(/&middot;/g, "-").replace(/&minus;/g, "-").replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&bull;/g, "-").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim()).join(" || ");
}

/* TBE itself, for the pure-helper assertions. */
const TBE = new Function("Roll", "return (function(){\n" + LIB + "\nreturn TBE;\n})()")(
  class { constructor(f) { this.formula = String(f); } async evaluate() { this.total = 1; return this; } });

/* Answers for TBE: Build Character. `spend` maps a pt_ field name to a value;
   anything unnamed gets 0, so a test only states the points it cares about. */
const buildAnswers = (first, spend) => (title, content) => {
  if (/Spend/.test(title)) {
    const names = [...String(content).matchAll(/name="(pt_[^"]+)"/g)].map((m) => m[1]);
    const o = {}; for (const n of names) o[n] = String((spend || {})[n] || 0);
    return o;
  }
  return Object.assign({ race: "Human", career: "Warrior", culture: "Westlands", lang: "Westronne",
    base: "20", boostCombat: "Melee: Light", boostAdventuring: "Athletics",
    boostSocial: "Intimidate", boostLore: "Common Lore", notes: "on" }, first || {});
};
const skillNamed = (a, n) => a.items.find((i) => i.type === "skill" && i.name === n);

/* ====================================================================== 1 */
section("1. The Godbound gate (TBE.godbound owns \"is this a Godbound?\")");
{
  const withPiety = (v, extra) => {
    const a = makeActor(extra);
    a.items.push({ id: "p", type: "skill", name: "Piety", system: { value: v, group: "Lore" } });
    return a;
  };
  check(TBE.godbound(makeActor()).isGodbound === false, "no Piety skill at all: not a Godbound");
  check(TBE.godbound(withPiety(0)).isGodbound === false,
    "the pre-v0.28.0 placeholder (Piety 0, no deity, no Domain) is NOT a Godbound");
  check(TBE.godbound(withPiety(0)).placeholderPiety === true,
    "...and it is reported as the placeholder, so a macro can say why it refused");
  check(TBE.godbound(withPiety(50)).isGodbound === true, "Piety above zero: a Godbound");
  check(TBE.godbound(withPiety(0, { system: { deity: "Vaela" } })).isGodbound === true,
    "Piety 0 but a deity named: still a Godbound (one who has fallen, not a placeholder)");
  check(TBE.godbound(withPiety(0, { system: { domains: ["Water"] } })).isGodbound === true,
    "Piety 0 with a Domain recorded: a Godbound");
  check(TBE.godbound(withPiety(0, { system: { castOut: true } })).isGodbound === true,
    "Piety 0 and already Cast Out: a Godbound, so TBE: Miracle explains rather than denies");
}

section("   ...and TBE: Miracle refuses on both, with different words");
{
  const plain = makeActor();
  const out1 = await run("tbe-miracle.js", {}, { actor: plain, blocks: ["divine"] });
  check(/\[warn\].*no Piety skill/.test(out1), "a character with no Piety skill is turned away", out1);
  check(!/prays/.test(out1), "...and nothing is rolled or spent", out1);

  const legacy = makeActor();
  legacy.items.push({ id: "p", type: "skill", name: "Piety", system: { value: 0, group: "Lore" } });
  queueRolls(83, 7);
  const out2 = await run("tbe-miracle.js", {}, { actor: legacy, blocks: ["divine"] });
  check(/\[warn\].*placeholder/.test(out2), "the legacy Piety-0 sheet is turned away as a placeholder", out2);
  check(!/Cast Out/.test(out2), "...and is NOT Cast Out by opening the macro", out2);
  check(legacy.system.castOut !== true, "...and the sheet is untouched", legacy.system.castOut);

  const real = makeActor({ system: { deity: "Vaela", domains: ["Water"] } });
  real.items.push({ id: "p", type: "skill", name: "Piety", system: { value: 50, group: "Lore" } });
  queueRolls(82, 2);
  const out3 = await run("tbe-miracle.js", { domain: "Water", ask: "Still the river", mod: "0" },
    { actor: real, blocks: ["divine"] });
  check(/prays to Vaela/.test(out3), "a real Godbound still gets the full procedure", out3);
}

section("   ...and character creation does not mint the placeholder");
{
  /* Build Character and the Wizard retired in v0.53.0; the Create Character
     window is the one chargen path, so it is driven here: derive() and the
     payload Create writes, run for real. */
  const warrior = CG.payloadFor({ raceName: "Human", careerName: "Warrior" });
  check(!CG.skill(warrior, "Piety"), "Create Character gives a Warrior no Piety skill");
  check(TBE.godbound(CG.actorOf(warrior)).isGodbound === false, "...so a created Warrior is not a Godbound");
  const gb = CG.payloadFor({ raceName: "Human", careerName: "Godbound" });
  const p = CG.skill(gb, "Piety");
  check(!!p && p.system.value === 50, "the Godbound career gets Piety 50 (career 20 + Talent 30, p.104/Ch.4)", p && p.system.value);
  check(TBE.godbound(CG.actorOf(gb)).isGodbound === true, "...and that character IS a Godbound");
  const src = read("system/the-broken-empires/module/chargen/derive.mjs");
  check((src.match(/"Piety"/g) || []).length === 1 && /if \(career\.name === "Godbound"\) addExtra\("Lore", "Piety", 50/.test(src),
    "...derive() has exactly one Piety grant, gated on the Godbound career");
}

/* ================================================================== 1b */
section("1b. The Weave gate (TBE.weaver owns \"can this character cast?\")");
{
  /* Same shape as the Piety placeholder, found 2026-09-22 on a wizard-built
     Dwarf Loremaster: every sheet carries the five Binds at 0 (p.79), so
     "has a Bind skill" opens TBE: Cast to a Warrior. */
  const withBinds = (value, extra) => {
    const a = makeActor(extra);
    for (const n of ["Change", "Conjure", "Control", "Destroy", "Witness"]) {
      a.items.push({ id: "b" + n, type: "skill", name: "Bind: " + n, system: { value, group: "Bind" } });
    }
    return a;
  };
  check(TBE.weaver(makeActor()).isWeaver === false, "no Binds at all: not a weaver");
  check(TBE.weaver(withBinds(0)).isWeaver === false, "the five Binds at 0, no Pattern: NOT a weaver");
  check(TBE.weaver(withBinds(0)).placeholderBinds === true, "...and reported as the placeholder, so a macro can say why");
  check(TBE.weaver(withBinds(40)).isWeaver === true, "a Bind above zero: a weaver");
  check(TBE.weaver(withBinds(0, { system: { pattern: "spellweaver" } })).isWeaver === true, "Patterned, Binds still 0: a weaver");
  check(TBE.weaver(withBinds(0, { system: { pattern: "fade" } })).isWeaver === true, "a Fade: a weaver");
  const bolg = withBinds(0);
  bolg.items.push({ id: "s1", type: "strand", name: "Earth", system: { level: 1 } });
  check(TBE.weaver(bolg).isWeaver === true, "a Strand above zero (a grant, a GM ruling): a weaver, so the gate never refuses wrongly");
}

section("   ...and TBE: Cast refuses the placeholder without rolling");
{
  const plain = makeActor();
  for (const n of ["Change", "Conjure", "Control", "Destroy", "Witness"]) {
    plain.items.push({ id: "b" + n, type: "skill", name: "Bind: " + n, system: { value: 0, group: "Bind" } });
  }
  const out = await run("tbe-cast.js", {}, { actor: plain, blocks: ["magic"] });
  check(/\[warn\].*not Patterned in the Weave/.test(out), "a character with five Bind-0 placeholders is turned away", out);
  check(/Patterned in the Weave Talent|Spellweaver career|Faded Pattern/.test(out), "...and told what would let them cast");
  check(!/Fraying|Weave Reaction/.test(out), "...and nothing is rolled or spent", out);
  const weaver = makeActor({ system: { pattern: "spellweaver" } });
  weaver.items.push({ id: "b1", type: "skill", name: "Bind: Change", system: { value: 40, group: "Bind" } });
  weaver.items.push({ id: "s1", type: "strand", name: "Fire", system: { level: 2 } });
  const out2 = await run("tbe-cast.js", {}, { actor: weaver, blocks: ["magic"] });
  check(!/not Patterned/.test(out2), "a real Spellweaver is not turned away", out2);
}

section("   ...and chargen stops minting blank -wise slots");
{
  const a = CG.payloadFor({ raceName: "Human", careerName: "Warrior" });
  const blanks = a.items.filter((i) => /^Wise: subject \d+$/.test(i.name));
  check(blanks.length === 0, "Create Character makes no nameless -wise slots by default", blanks.map((b) => b.name));
  const granted = a.items.filter((i) => /^Career wise\/Language/.test(i.name));
  check(granted.length === 1 && granted[0].system.value === 20, "...but the Warrior's one Custom -wise at 20 (p.103) is still created", granted);
}

/* ====================================================================== 2 */
section("2. Career points lost to the 70 creation cap are reported, not swallowed");
{
  /* Dodge starts at 20 (base), so 80 points into it can only buy 50. The
     Create Character window, the one chargen path since v0.53.0. */
  const d = CG.draft({ raceName: "Human", careerName: "Warrior", boost: { Combat: null, Adventuring: "Athletics", Social: null, Lore: null },
    alloc: { Combat_0: 80, Adventuring_0: 50, Social_0: 40, Lore_0: 30 } });
  const ch = CG.derive(d);
  check(ch.skills.Dodge.value === 70, "the cap still holds: Dodge is 70, not 100", ch.skills.Dodge.value);
  const cp = Object.fromEntries(ch.careerPoints.map((c) => [c.cat, c]));
  check(cp.Combat.lost === 30 && cp.Combat.allocated === 80, "30 Combat points are counted as lost, not as spent", cp.Combat);
  check(cp.Adventuring.lost === 10, "Athletics started at 30 (the category boost), so 10 of its 50 are lost", cp.Adventuring);
  check(!cp.Social.lost, "a category that fits under the cap reports no loss", cp.Social);
  const st = CG.status(d).career.open;
  check(st.some((x) => /Combat: 30 point\(s\) go past the 70 cap and are lost/.test(x)), "the window says so where the points are spent, before Create", st);
  check(ch.notes.some((n) => /Combat: 30 career point\(s\) went past the 70 creation cap/.test(n)), "...and the Notes tab carries it after", ch.notes);
  const page = CG.page("career", d, { careerSub: "points" });
  check(/30 lost to the cap/.test(page), "the Combat pool on the page reads '30 lost to the cap'");
  check(/points that would push a skill past it are lost/.test(page), "...and the page says what happens to overflow before it happens");
  check(/data-live="sk:Dodge">70[^<]*cap/.test(page) && /data-live="sk:Melee: Light">20</.test(page),
    "each box shows the value its skill sits at, the capped one marked");
}

/* ====================================================================== 3 */
section("3. One store for everything that is running");
{
  const store = {};
  const a = makeActor();
  await run("tbe-extended-roll.js", { act: "new", name: "Find the ledger", req: "9", interval: "1 day", limit: "0" },
    { store, actor: a });
  await run("tbe-chase.js", { mode: "prolonged", act: "new", name: "Through the market",
    pursuerName: "Watch", preyName: "Corrin", target: "8" }, { store, actor: a });
  await run("tbe-social-encounter.js", { act: "new", mode: "static", name: "The magistrate", tolMode: "standard" },
    { store, actor: a });
  const kinds = Object.values(store.encounters || {}).map((t) => t.kind).sort();
  check(kinds.join(",") === "chase,extended,social-static",
    "three different macros put three trackers in the same store", kinds);

  const status = await run("tbe-status.js", {}, { store, actor: a });
  check(/Find the ledger - 0 \/ 9 SLs/.test(status), "TBE: Status lists the Extended Roll", status);
  check(/Through the market - Watch 0 vs Corrin 0 of 8 SLs/.test(status), "...the Chase", status);
  check(/The magistrate - 0 \/ 5 Tolerance/.test(status), "...and the Social Encounter", status);
  check(!/[Nn]othing running/.test(status), "...so it never says nothing is running while three things are", status);
  check(!/interval 0(?![0-9])/.test(status),
    "a tracker nobody has advanced yet does not report \"interval 0\", which reads like a bug", status);
  check(/Find the ledger - 0 \/ 9 SLs, per 1 day/.test(status),
    "...it shows the interval the player named instead", status);
  check(!/game\.journal\.getName\("TBE Clocks"\)/.test(read("macros/tbe-status.js")),
    "TBE: Status no longer reads the retired clocks journal");
}

section("   ...and TBE: Clocks migrates an old world exactly once");
{
  const store = {};
  const page = { text: { content: "" }, update: async function (u) { this.text.content = u["text.content"]; } };
  const j = { name: "TBE Clocks",
    flags: { tbe: { clocks: [
      { name: "Forge the rapier blade", need: 9, have: 4, interval: "a day", limit: 5, used: 2, done: false, failed: false },
      { name: "A finished clock", need: 6, have: 6, interval: "a day", limit: 0, used: 3, done: true, failed: false }
    ] } },
    pages: { contents: [page] },
    /* Apply dotted paths generically, including Foundry's `-=` deletion
       prefix, rather than matching one literal path. Matching the literal
       string meant this stub stopped applying anything when v0.39.0 moved the
       clocks flag onto the system's real namespace, so the emptying assertion
       below failed against a macro that was working correctly. */
    update: async function (u) {
      for (const [k, v] of Object.entries(u)) {
        const parts = k.split(".");
        const rawLeaf = parts.pop();
        const del = rawLeaf.startsWith("-=");
        const leaf = del ? rawLeaf.slice(2) : rawLeaf;
        let t = this;
        for (const seg of parts) { if (t[seg] === undefined || t[seg] === null) t[seg] = {}; t = t[seg]; }
        if (del) delete t[leaf]; else t[leaf] = v;
      }
    } };
  const journals = { "TBE Clocks": j };
  const a = makeActor();

  const out = await run("tbe-clocks.js", {}, { store, actor: a, journals });
  const moved = Object.values(store.encounters || {});
  check(moved.length === 1, "only the OPEN clock moves across", moved.length);
  check(moved[0].kind === "extended" && moved[0].total === 4 && moved[0].slsRequired === 9
    && moved[0].intervalsUsed === 2 && moved[0].limit === 5,
    "...as an extended tracker carrying its progress, interval count and limit", moved[0]);
  check(/retired/.test(out) && /Extended Roll/.test(out), "the card says what happened and where to go", out);
  /* The macro now writes the emptied list to the system's own namespace and
     deletes the legacy key in the same update (v0.39.0), so the assertion
     follows the data rather than the old path. */
  check(j.flags["the-broken-empires"].clocks.length === 0 && j.flags.tbe?.clocks === undefined,
    "the journal is emptied so a second run cannot duplicate, and the legacy key is gone",
    { moved: j.flags["the-broken-empires"]?.clocks, legacy: j.flags.tbe });

  const out2 = await run("tbe-clocks.js", {}, { store, actor: a, journals });
  check(Object.values(store.encounters).length === 1, "running it again creates nothing");
  check(/nothing on the/.test(out2), "...and says so", out2);

  const status = await run("tbe-status.js", {}, { store, actor: a, journals });
  check(/Forge the rapier blade - 4 \/ 9 SLs/.test(status),
    "the migrated clock now shows on TBE: Status, which it never did before", status);

  check(!/TBE: Clocks/.test(read("macros/tbe-solo-panel.js").split("const opts")[0].replace(/\/\*[\s\S]*?\*\//g, "")),
    "the Solo Panel no longer offers Clocks as a live tool");
  check(/"TBE: Extended Roll"/.test(read("macros/tbe-solo-panel.js")),
    "...and offers Extended Roll in its place");
}

/* ====================================================================== 4 */
section("4. No page furniture in extracted data");
{
  const traits = J("npctraits.json");
  const cells = traits.flatMap((r) => ["appearance", "aspect", "personality", "agenda", "trigger"].map((k) => [r.lo, k, r[k]]));
  const bad = cells.filter(([, , v]) => /\s\d{3}$/.test(v || ""));
  check(bad.length === 0, "no NPC Traits cell ends in a bare three-digit number", bad);
  check(traits.find((r) => r.lo === 99).trigger === "Bias: People who smell of travel",
    "row 99-00's trigger is the book's text and not the page number that followed it",
    traits.find((r) => r.lo === 99).trigger);

  const best = Object.values(J("data/bestiary_docs.json"));
  const dirty = best.filter((c) => /\s\d{3}\s*$/.test(c.keeper || "")).map((c) => c.name);
  check(dirty.length === 0, "no creature's keeper note ends in a page number", dirty);
  const bios = best.filter((c) => /\s4[4-7]\d\s*<\/p>/.test(c.bio || "")).map((c) => c.name);
  check(bios.length === 0, "nor does any creature's book-text block", bios);
}

section("5. Creature names printed across lines are whole");
{
  const best = Object.values(J("data/bestiary_docs.json"));
  const names = best.map((c) => c.name);
  const unbalanced = names.filter((n) => (n.match(/\(/g) || []).length !== (n.match(/\)/g) || []).length);
  check(unbalanced.length === 0, "no creature name has unbalanced parentheses", unbalanced);
  check(names.includes("Brutesworn (Brakk-Thuun)"),
    'the Ogre offshoot is "Brutesworn (Brakk-Thuun)", not "Brakk-Thuun)"',
    names.filter((n) => /Brakk/.test(n)));
  check(names.includes("Orc Chieftain (Skarn)"),
    'the Orc leader is "Orc Chieftain (Skarn)", not "Skarn)"',
    names.filter((n) => /Skarn/.test(n)));
  check(names.includes("Half Giant (Fomor)"),
    "...and a name that already worked still works", names.filter((n) => /Fomor/.test(n)));
  check(best.length === 56, "still 56 creatures", best.length);
}

/* ------------------------------------------------------------ mutations */
section("Mutation guards (each breaks a fix and requires the check to fail)");
{
  /* The Weave gate, read the wrong way round: "has a Bind skill" is the bug. */
  const mutated = LIB.replace("isWeaver: pattern !== \"none\" || bindMax > 0 || strandMax > 0",
    "isWeaver: binds.length > 0 || pattern !== \"none\" || strandMax > 0");
  const M = new Function("canvas", "game", "foundry", "ui", "CONFIG", mutated + "\n;return TBE;")(
    { tokens: { controlled: [] } }, { user: {} }, { utils: {} },
    { notifications: { warn() {}, error() {}, info() {} } }, undefined);
  const a = makeActor();
  for (const n of ["Change", "Witness"]) a.items.push({ id: "b" + n, type: "skill", name: "Bind: " + n, system: { value: 0, group: "Bind" } });
  check(M.weaver(a).isWeaver === true, "gating on \"has a Bind skill\" lets a Warrior cast, which section 1b rejects");
}

{
  /* 1. Put the placeholder Piety back into TBE.godbound and the legacy sheet
        must start reading as a Godbound again. */
  const mutLib = LIB.replace("isGodbound: !!skill && called,", "isGodbound: !!skill,");
  check(mutLib !== LIB, "mutation 1 applied (godbound gate widened back to any Piety skill)");
  const legacy = makeActor();
  legacy.items.push({ id: "p", type: "skill", name: "Piety", system: { value: 0, group: "Lore" } });
  queueRolls(83, 7);
  const out = await run("tbe-miracle.js", {}, { actor: legacy, blocks: ["divine"], lib: mutLib });
  check(/Cast Out/.test(out),
    "...and with it, an ordinary character praying once IS Cast Out -- which is the defect", out);

  /* 2. Stop counting the capped-away points and the window must go back to
        calling them spent. */
  {
    const src = read("system/the-broken-empires/module/chargen/derive.mjs");
    const mut = src.replace("const raise = (sk, amount) => {\n    const before = values[sk].value;\n    values[sk].value = Math.min(CAP, before + amount);\n    return Math.max(0, before + amount - values[sk].value);",
      "const raise = (sk, amount) => {\n    const before = values[sk].value;\n    values[sk].value = Math.min(CAP, before + amount);\n    return 0;");
    check(mut !== src, "mutation 2 applied (loss reporting removed)");
    const f = path.join(__dirname, "system/the-broken-empires/module/chargen/.mut-derive.mjs");
    fs.writeFileSync(f, mut);
    try {
      const M = await import(f + "?m=" + Date.now());
      const d = CG.draft({ raceName: "Human", careerName: "Warrior", alloc: { Combat_0: 80 } });
      const ch = M.derive(d, CG.ctx);
      const c = ch.careerPoints.find((x) => x.cat === "Combat");
      check(!c.lost && ch.skills.Dodge.value === 70, "...and 80 points read as spent with 30 of them gone -- which is the defect", c);
    } finally { fs.unlinkSync(f); }
  }

  /* 3. Point TBE: Status back at the journal and three open trackers must
        disappear from it. */
  const st = read("macros/tbe-status.js");
  const mutSt = st.replace("const running = TBE.openTrackers();", "const running = [];");
  check(mutSt !== st, "mutation 3 applied (Status stops reading the tracker store)");
  {
    const store = {}; const a = makeActor();
    await run("tbe-extended-roll.js", { act: "new", name: "Find the ledger", req: "9", interval: "1 day", limit: "0" },
      { store, actor: a });
    const said = harness(store, a, {});
    global.__ANSWER = async () => ({});
    const code = BLOCK.data + LIB.replace(/TBE\.prompt = async function[\s\S]*?\n};/,
      "TBE.prompt = async function (t, c, o) { return await globalThis.__ANSWER(t, c, o); };") + "\n" + mutSt;
    await new Function("return (async()=>{" + code + "})()")().catch(() => {});
    const text = said.map((s) => String(s).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")).join(" ");
    check(/Nothing running/.test(text),
      "...and Status says nothing is running while a tracker is open -- which is the defect", text.slice(-120));
  }
}

/* -------------------------------------------------------------------- end */
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
