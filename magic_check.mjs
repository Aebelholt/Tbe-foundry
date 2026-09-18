/* TBE: Weave Magic harness.
 *
 * What this is for: the Magic tab and the magic macros are the newest place
 * where a number can be shown that nothing produces, or produced and shown
 * nowhere. This drives the REAL artefacts -- the generated magic-data.mjs,
 * the real CONFIG.TBE helpers from config.mjs, the real _prepareMagic method
 * sliced out of the sheet, and the real actor-magic.hbs compiled by real
 * Handlebars -- and asserts on what comes out.
 *
 * It deliberately does NOT mock the numbers: every expected value below is
 * hand-computed from the book (Ch.8 Strand XP, Ch.14 Fraying) so a wrong
 * formula fails here rather than at the table.
 *
 * Run: node magic_check.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Handlebars from "handlebars";

const root = path.dirname(fileURLToPath(import.meta.url));
const SYS = path.join(root, "system/the-broken-empires");

let pass = 0;
const fails = [];
function check(name, cond, detail) {
  if (cond) { pass++; return true; }
  fails.push(name + (detail ? " — " + detail : ""));
  return false;
}
function eq(name, got, want) {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { pass++; return true; }
  /* On a big object, print the first place they diverge rather than both
   * copies in full -- an unreadable failure is a failure you skim past. */
  let detail = `got ${g}, want ${w}`;
  if (g && w && g.length > 400) {
    let i = 0;
    while (i < g.length && i < w.length && g[i] === w[i]) i++;
    detail = `diverges at char ${i}: got ...${g.slice(Math.max(0, i - 40), i + 60)}... want ...${w.slice(Math.max(0, i - 40), i + 60)}...`;
  }
  fails.push(name + " — " + detail);
  return false;
}

/* ---- 1. the generated data ------------------------------------------- */
const magic = JSON.parse(fs.readFileSync(path.join(root, "data/magic.json"), "utf8"));
eq("5 Binds", magic.binds.map((b) => b.name), ["Change", "Conjure", "Control", "Destroy", "Witness"]);
eq("10 Strands", magic.strands.length, 10);
eq("12 Convocations", magic.convocations.length, 12);
check("every Convocation is 2/4/2", magic.convocations.every((c) =>
  c.binds.length === 2 && c.strands.length === 4 && c.thinStrands.length === 2));
check("shaping has all four elements", ["magnitude", "target", "range", "duration"]
  .every((k) => Array.isArray(magic.shaping[k]) && magic.shaping[k].length));
check("effects carry rows", magic.effects.length >= 15 && magic.effects.every((g) => g.rows.length));

/* The generated .mjs must be in step with the .json it came from: a stale
 * magic-data.mjs is exactly the silent-wrong-data failure the build pipeline
 * warns about.
 *
 * This used to be 22 `source.includes('"Fire"')` substring tests over names
 * that have never changed. Rewriting every cost in the generated file to 0
 * left all 22 passing. So compare the actual exported VALUES instead, field
 * by field: that is the only version of this check that can fail. */
const gen = await import(path.join(SYS, "module/helpers/magic-data.mjs"));
eq("magic-data.mjs BINDS match magic.json", gen.BINDS, magic.binds.map((b) => b.name));
eq("magic-data.mjs BIND_INFO matches magic.json", gen.BIND_INFO, magic.binds);
eq("magic-data.mjs STRANDS match magic.json", gen.STRANDS, magic.strands.map((x) => x.name));
eq("magic-data.mjs STRAND_INFO matches magic.json", gen.STRAND_INFO, magic.strands);
eq("magic-data.mjs CONVOCATIONS match magic.json", gen.CONVOCATIONS, magic.convocations);
eq("magic-data.mjs MAGIC_RULES match magic.json", gen.MAGIC_RULES, magic.rules);
eq("magic-data.mjs FRAYING_SYMPTOMS match magic.json", gen.FRAYING_SYMPTOMS, magic.frayingSymptoms);
/* And it must NOT carry what nothing in the system module reads: the cost
 * tables belong to the macro pack's own baked block and to the journal. */
for (const dead of ["SHAPING", "SPELL_EFFECTS", "WEAVE_REACTIONS", "WEAVE_REACTION_DETAIL", "WEAVE_HAZARD_D6"]) {
  check("magic-data.mjs does not ship unread " + dead, gen[dead] === undefined);
}

/* The 16 concrete Fraying signs are the usable half of that section. */
check("every Fraying tier carries the book's four signs",
  magic.frayingSymptoms.length === 4 && magic.frayingSymptoms.every((t) => (t.signs || []).length === 4),
  JSON.stringify(magic.frayingSymptoms.map((t) => (t.signs || []).length)));

/* ---- 2. the real CONFIG helpers -------------------------------------- */
const cfg = await import(path.join(SYS, "module/helpers/config.mjs"));
const TBE = cfg.TBE;

// Ch.8: "going from Air 3 to 4 would cost 4 XP; increasing the Spheres Strand
// from 6 to 7 would cost 7 XP... improving from 3 to 5 would cost a total of
// 9 XP". All three are the book's own worked examples.
eq("Strand 3->4 costs 4 XP", TBE.strandXp(3, 4).xp, 4);
eq("Strand 6->7 costs 7 XP", TBE.strandXp(6, 7).xp, 7);
eq("Strand 3->5 costs 9 XP", TBE.strandXp(3, 5).xp, 9);
// "Improving a Strand to 11 gives 1 point of Fraying; raising it to 12 gives
// another, and so on."
eq("Strand 10->11 costs 11 XP and 1 Fraying", [TBE.strandXp(10, 11).xp, TBE.strandXp(10, 11).fraying], [11, 1]);
eq("Strand 10->12 costs 23 XP and 2 Fraying", [TBE.strandXp(10, 12).xp, TBE.strandXp(10, 12).fraying], [23, 2]);
eq("Strand 9->10 costs no Fraying", TBE.strandXp(9, 10).fraying, 0);

eq("Fade Strand cap is 7", TBE.strandCap("fade").cap, 7);
eq("Spellweaver has no hard Strand cap", TBE.strandCap("spellweaver").cap, null);
eq("creation caps every Strand at 5", TBE.strandCap("spellweaver", true).cap, 5);

eq("strandName strips the prefix", TBE.strandName("Strand: Fire"), "Fire");
eq("strandName leaves a bare name", TBE.strandName("Fire"), "Fire");

// Ch.14 p.308, the book's own example: Max Resolve 23, Fraying 24 -> 2%;
// Fraying 36 -> 26%.
const tiers = (f, m) => TBE.frayingTiers(f, m).map((t) => t.key);
eq("no symptoms below 10 Fraying", tiers(9, 23), []);
eq("10 Fraying always shows the first tier", tiers(10, 23), ["flat10"]);
eq("Fraying 18 vs Max Resolve 23 reaches the -5 tier", tiers(18, 23), ["flat10", "mr-5"]);
eq("Fraying 28 vs Max Resolve 23 reaches every tier", tiers(28, 23), ["flat10", "mr-5", "mr", "mr+5"]);

/* ---- 3. the real _prepareMagic, sliced out of the sheet --------------- */
const sheetSrc = fs.readFileSync(path.join(SYS, "module/sheets/actor-sheet.mjs"), "utf8");
const start = sheetSrc.indexOf("  _prepareMagic(");
const end = sheetSrc.indexOf("\n  }\n", sheetSrc.indexOf("convocations: C.CONVOCATIONS || []"));
if (start < 0 || end < 0) { fails.push("could not slice _prepareMagic out of actor-sheet.mjs"); }
const prepareSrc = sheetSrc.slice(start, end + 4).replace(/^\s*_prepareMagic\(/, "function _prepareMagic(");
globalThis.CONFIG = { TBE };
const prepareMagic = new Function("CONFIG", prepareSrc + "\nreturn _prepareMagic;")(globalThis.CONFIG);

const strandItem = (name, level, thin = false) => ({
  _id: "s" + name, name, type: "strand", img: "icons/svg/daze.svg",
  system: { level, thin, description: "" }
});
const bindItem = (name, value, expertise = 0) => ({
  _id: "b" + name, name: "Bind: " + name, type: "skill",
  system: { group: "Bind", value, expertise }
});
const threadItem = (name, attunement, kind, extra = {}) => ({
  _id: "t" + name, name, type: "thread", img: "icons/svg/lightning.svg",
  system: Object.assign({ attunement, kind, die: "d8", pool: 0, bonus: 0, expended: false }, extra)
});

const skills = { Bind: [bindItem("Change", 40), bindItem("Control", 50, 2)] };
const strands = [strandItem("Beast", 4), strandItem("Plant", 5), strandItem("Spheres", 1, true)];
const threads = [threadItem("Wolf Tooth", "Beast", "consumable", { pool: 5 }),
  threadItem("Shackle", "Control", "die", { die: "d8" }),
  threadItem("Spent Flint", "Fire", "consumable", { pool: 0 })];
const system = {
  pattern: "spellweaver", convocation: "Druid", trueName: "Varimaxx Cusoris",
  resolve: { value: 20, max: 23 }, fraying: 24
};
const m = prepareMagic(skills, strands, threads, system);

eq("all five Binds are listed even when unknown", m.binds.length, 5);
eq("a known Bind reports its value", m.binds.find((b) => b.name === "Control").value, 50);
eq("an unknown Bind is flagged", m.binds.find((b) => b.name === "Witness").known, false);
eq("a Spellweaver has no Fade Bind cap", m.bindCap, null);
eq("Strands sort by level", m.strands.map((s) => s.name), ["Plant", "Beast", "Spheres"]);
eq("the next Plant level costs 6 XP", m.strands.find((s) => s.name === "Plant").nextXp, 6);
eq("total Strand levels", m.totalStrandLevels, 10);
eq("unknown Strands are offered with a cost", m.unknownStrands.length, 7);
// Druid's Thin Strands are Spheres and Spirit, so Spirit costs the doubled 10.
eq("a Thin Strand costs 10 XP to open", m.unknownStrands.find((u) => u.name === "Spirit").xp, 10);
eq("a normal Strand costs 5 XP to open", m.unknownStrands.find((u) => u.name === "Fire").xp, 5);
eq("Fraying 24 vs Max Resolve 23 is a 2% purge risk", m.frayingRisk, 2);
check("Fraying past Max Resolve puts the caster in roll territory", m.inFrayingRoll);
eq("an emptied consumable Thread reads as spent", m.threads.find((t) => t.name === "Spent Flint").inert, true);
eq("a Bind Thread is labelled as one", m.threads.find((t) => t.name === "Shackle").isBind, true);
eq("a Strand Thread is not labelled a Bind", m.threads.find((t) => t.name === "Wolf Tooth").isBind, false);

// A Fade: capped Binds at 70, Strands at 7.
const fade = prepareMagic({ Bind: [bindItem("Destroy", 70)] }, [strandItem("Fire", 7)], [],
  { pattern: "fade", resolve: { max: 12 }, fraying: 3 });
eq("a Fade's Bind cap is 70", fade.bindCap, 70);
check("a Fade's Bind at 70 is flagged as capped", fade.binds.find((b) => b.name === "Destroy").atCap);
eq("a Fade's Strand cap is 7", fade.strandCap, 7);
check("a Fade's Strand at 7 is flagged as capped", fade.strands[0].atCap);
check("a Fade under Max Resolve is not in roll territory", !fade.inFrayingRoll);

const mundane = prepareMagic({}, [], [], { pattern: "none", resolve: { max: 10 }, fraying: 0 });
check("a non-Patterned character cannot cast", !mundane.canCast);

/* ---- 4. the real template, compiled by real Handlebars ---------------- */
Handlebars.registerHelper("eq", (a, b) => a === b);
Handlebars.registerHelper("gt", (a, b) => a > b);
Handlebars.registerHelper("sub", (a, b) => (Number(a) || 0) - (Number(b) || 0));
Handlebars.registerHelper("checked", (v) => (v ? "checked" : ""));
const tplSrc = fs.readFileSync(path.join(SYS, "templates/actor/parts/actor-magic.hbs"), "utf8");
const tpl = Handlebars.compile(tplSrc);
const html = tpl({ magic: m, system, config: TBE });

/* Every number the tab claims must actually be in the rendered DOM. This is
 * the half that the data checks above cannot see: a correct context object
 * rendered by a template that never prints it is still a dead number. */
check("the tab prints the Pattern", html.includes("Spellweaver (Patterned in the Weave)"));
check("the tab prints the Convocation's Strands", html.includes("Druid"));
check("the tab prints every Bind name", TBE.BINDS.every((b) => html.includes(">" + b + "<")));
check("the tab prints a known Bind's value", html.includes(">50</b>"));
check("the tab prints the cost of an unopened Bind", html.includes("5 XP opens it at 10"));
check("the tab prints the next Strand level's XP", html.includes("next level 6 XP"));
check("the tab prints the Fraying purge percentage", html.includes(">2%</b>"));
check("the tab explains the Fraying Roll", html.includes("every further point demands a Fraying Roll"));
check("the tab names the reached symptom tiers", html.includes("Reality struggles to hold you in place"));
check("the tab lists Threads with what they give", html.includes("5 Mastery left in the pool"));
check("the tab offers a Cast launcher", html.includes('data-macro="TBE: Cast"'));
check("the tab has no unrendered Handlebars left", !/\{\{/.test(html));

const notPatterned = tpl({ magic: mundane, system: { pattern: "none", fraying: 0 }, config: TBE });
check("a non-Patterned sheet says so and says what to do", notPatterned.includes("Faded Pattern"));
check("a non-Patterned sheet hides the Cast launcher", !notPatterned.includes('data-macro="TBE: Cast"'));
check("a non-Patterned sheet also hides the Raise-a-Strand launcher, which would open a window with no Strand action in it",
  !notPatterned.includes('data-macro="TBE: Advancement"'));
check("a caster still gets the Raise-a-Strand launcher", html.includes('data-macro="TBE: Advancement"'));

/* Ch.14 p.280: "Binds or Strands with a value of zero cannot be used in
 * spellcasting", and "the caster must have at least 1 available Resolve.
 * Otherwise, a spell cannot be attempted." Character creation writes all five
 * Binds at 0, so a sheet that called those "known" would hide the cost of
 * opening one from every wizard-built caster. */
const zeroed = prepareMagic(
  { Bind: [bindItem("Change", 0), bindItem("Control", 30)] },
  [strandItem("Fire", 0), strandItem("Air", 3)], [],
  { pattern: "spellweaver", resolve: { value: 4, max: 12 }, fraying: 0 });
eq("a Bind at 0 is not a usable Bind", zeroed.binds.find((b) => b.name === "Change").known, false);
eq("but the sheet still knows the Item exists", zeroed.binds.find((b) => b.name === "Change").hasItem, true);
eq("a Bind above 0 is usable", zeroed.binds.find((b) => b.name === "Control").known, true);
eq("usable Binds are counted, not merely present ones", zeroed.usableBinds, 1);
eq("and usable Strands the same way", zeroed.usableStrands, 1);
const zeroedHtml = tpl({ magic: zeroed, system: { pattern: "spellweaver", fraying: 0 }, config: TBE });
check("a Bind sitting at 0 says it cannot be cast with", zeroedHtml.includes("at 0, so it cannot be cast with"));

const spent = prepareMagic({ Bind: [bindItem("Change", 40)] }, [strandItem("Fire", 3)], [],
  { pattern: "spellweaver", resolve: { value: 0, max: 12 }, fraying: 0 });
eq("with 0 Resolve a spell cannot be attempted at all", spent.canAttempt, false);
const spentHtml = tpl({ magic: spent, system: { pattern: "spellweaver", fraying: 0 }, config: TBE });
check("and the tab says so instead of offering the Cast button",
  /No Resolve left/.test(spentHtml) && !spentHtml.includes('data-macro="TBE: Cast"'));

/* p.309: a tier reached once remains permanently, even if Max Resolve later
 * increases -- and a caster with no Fraying at all has reached none. */
eq("zero Fraying reaches no tier, whatever Max Resolve is", TBE.frayingTiers(0, 5).map((t) => t.key), []);
eq("a recorded tier survives Max Resolve rising",
  TBE.frayingTiers(6, 40, ["mr-5"]).map((t) => t.key), ["mr-5"]);
eq("frayingTierKeys reports only what the live numbers reach",
  TBE.frayingTierKeys(12, 12), ["flat10", "mr-5", "mr"]);

const symptomatic = prepareMagic({ Bind: [bindItem("Change", 40)] }, [], [],
  { pattern: "spellweaver", resolve: { value: 5, max: 30 }, fraying: 12, frayingSymptoms: ["mr"] });
check("a recorded tier reaches the sheet even when the numbers no longer do",
  symptomatic.frayingTiers.some((t) => t.key === "mr"));
const symHtml = tpl({ magic: symptomatic, system: { pattern: "spellweaver", fraying: 12 }, config: TBE });
check("the tab prints the book's concrete signs, not just the mood line",
  symHtml.includes("Your shadow lags behind or tilts slightly wrong."));
check("and offers the Frayed Personality Trait at 10+", symHtml.includes("Frayed"));

const fadeHtml = tpl({ magic: fade, system: { pattern: "fade", fraying: 3 }, config: TBE });
check("a Fade sheet states the Bind ceiling", fadeHtml.includes("a Fade can never pass 70"));
check("a Fade sheet states how far Fraying has to go", fadeHtml.includes("9 to go"));

/* ---- 5. a screenshot, because "can a player read this" is the standard --- */
const outDir = path.join(root, "test-screenshots/magic");
fs.mkdirSync(outDir, { recursive: true });
const css = fs.readFileSync(path.join(SYS, "css/the-broken-empires.css"), "utf8");
const page = `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;background:#141210}
  .the-broken-empires.sheet{width:640px;margin:14px auto;border-radius:6px}
  .the-broken-empires.sheet .window-content{padding:10px}
  ${css}
</style></head><body>
<div class="the-broken-empires sheet actor"><div class="window-content">${html}</div></div>
<div class="the-broken-empires sheet actor"><div class="window-content">${notPatterned}</div></div>
</body></html>`;
fs.writeFileSync(path.join(outDir, "_magic.html"), page);
try {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const p = await browser.newPage({ viewport: { width: 700, height: 1400 } });
  await p.goto("file://" + path.join(outDir, "_magic.html"));
  await p.screenshot({ path: path.join(outDir, "magic-tab.png"), fullPage: true });
  await browser.close();
  console.log("  screenshot: " + path.join(outDir, "magic-tab.png"));
} catch (err) {
  console.log("  (screenshot skipped: " + err.message.split("\n")[0] + ")");
}

console.log(`\nmagic_check: ${pass} passed, ${fails.length} failed`);
if (fails.length) { for (const f of fails) console.log("  FAIL " + f); process.exit(1); }
