/*
 * zones_check.mjs -- Zone Hazards (Ch.10 pp.151-152).
 *
 * 1. VERIFIED: every hazard's quote is in the book, on the page it cites, and
 *    each -20 the code applies appears inside its own quote (a quote is only
 *    half a check, CLAUDE.md). Needs the rulebook text: TBE_BOOK, else
 *    /home/claude/book/rulebook.txt, else /tmp/tbe.txt; skipped (and said so)
 *    when none is present.
 * 2-4. The real module/rules/zones.mjs against rectangle Regions in both of
 *    Foundry's testPoint shapes.
 * 5. The real TBE: Zone Hazards macro against a stub scene.
 * The attack side (a -20 actually reaching the roll) is in attack_order_check.
 */
import { readFileSync, existsSync } from "node:fs";
import * as Z from "./system/the-broken-empires/module/rules/zones.mjs";

let pass = 0, fail = 0, skip = 0;
const check = (cond, label, extra) => {
  if (cond) { pass++; console.log("  PASS  " + label); }
  else { fail++; console.log("  FAIL  " + label + (extra !== undefined ? "  <- " + JSON.stringify(extra).slice(0, 300) : "")); }
};

console.log("\n1. The book says what the code does");
{
  const path = [process.env.TBE_BOOK, "/home/claude/book/rulebook.txt", "/tmp/tbe.txt"].find((p) => p && existsSync(p));
  if (!path) { skip++; console.log("  SKIP  no rulebook text found (set TBE_BOOK)"); }
  else {
    const raw = readFileSync(path, "utf8");
    /* Join a word broken across a line ("foot-\ning"), then flatten space. */
    const norm = (s) => s.replace(/[\u2019]/g, "'").replace(/[\u2013\u2014]/g, "-")
      .replace(/([a-z])-\s*\n\s*([a-z])/g, "$1$2").replace(/\s+/g, " ");
    const book = norm(raw);
    const lines = raw.split("\n");
    for (const [k, h] of Object.entries(Z.HAZARDS)) {
      check(book.includes(norm(h.quote)), k + ": quote is verbatim in the book", h.quote.slice(0, 60));
      /* Page = the first bare page-number line after the line the quote starts on. */
      const head = h.quote.split(" ").slice(0, 4).join(" ");
      const li = lines.findIndex((l) => norm(l).includes(head));
      let page = null;
      for (let i = li; li > -1 && i < lines.length && i < li + 200; i++) {
        if (/^\s*\d{3}\s*$/.test(lines[i])) { page = Number(lines[i].trim()); break; }
      }
      check(page === h.page, k + ": on p." + h.page, { page, head });
    }
    check(Z.HAZARDS.confined.quote.includes(String(Z.PENALTY)), "Confined's -20 is inside its own quote");
    check(Z.HAZARDS.obscured.quote.includes(String(Z.PENALTY)), "Obscured's -20 is inside its own quote");
  }
}

/* Axis-aligned rectangle Regions, in V13 shape (testPoint({x,y,elevation}))
   or V12 shape (testPoint(point, elevation)). */
const rect = (name, x0, y0, x1, y1, hazards, v12 = false) => ({
  name, flags: hazards ? { [Z.SCOPE]: { hazards } } : {},
  testPoint: v12
    ? function (p, elev) { return p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1 && typeof elev === "number"; }
    : function (p) { return p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1 && typeof p.elevation === "number"; }
});
const A = { x: 50, y: 50, elevation: 0 }, T = { x: 950, y: 50, elevation: 0 };
const run = (regions) => Z.attackHazards({ regions, inside: Z.insideRegion, attacker: A, target: T, attackerName: "Renn", targetName: "Orc" });

console.log("\n2. Which hazards an attack sees");
for (const v12 of [false, true]) {
  const tag = v12 ? " [V12 testPoint]" : " [V13 testPoint]";
  const fogOnTarget = run([rect("fog", 900, 0, 1000, 100, { obscured: true }, v12)]);
  check(fogOnTarget.mods.some((m) => m.id === "obscured" && m.value === -20 && m.when.ranged), "target in fog: -20 ranged" + tag);
  const fogOnShooter = run([rect("fog", 0, 0, 100, 100, { obscured: true }, v12)]);
  check(fogOnShooter.mods.some((m) => m.id === "obscured"), "shooter in fog: out of counts" + tag);
  const fogBetween = run([rect("fog", 400, 0, 600, 100, { obscured: true }, v12)]);
  check(fogBetween.mods.some((m) => m.id === "obscured"), "fog between them: through counts" + tag);
  const fogAside = run([rect("fog", 400, 500, 600, 600, { obscured: true }, v12)]);
  check(!fogAside.mods.length, "fog off the line: nothing" + tag, fogAside.mods);
  const plain = run([rect("field", 0, 0, 1000, 100, null, v12)]);
  check(!plain.mods.length && !plain.notes.length, "an unmarked Region is never a hazard" + tag);
}
{
  const c = run([rect("tunnel", 900, 0, 1000, 100, { confined: true })]);
  check(c.mods.length === 1 && c.mods[0].side === "defence" && c.mods[0].when.skills.join() === "Dodge,Melee: Heavy",
    "target in a Confined zone: -20 to their Dodge / Melee: Heavy defence", c.mods);
  const c2 = run([rect("tunnel", 0, 0, 100, 100, { confined: true })]);
  check(c2.mods.length === 1 && c2.mods[0].side === "attack" && c2.mods[0].when.skills.join() === "Melee: Heavy",
    "attacker in a Confined zone: -20 to a Melee: Heavy attack", c2.mods);
  const r = run([rect("mud", 900, 0, 1000, 100, { rough: true, damaging: 12, other: true })]);
  check(r.notes.length === 3 && !r.mods.length, "Rough, Damaging, Other are reminders, not modifiers", r.notes.map((n) => n.key));
  check(Z.hazardsOf({ flags: { [Z.SCOPE]: { hazards: { damaging: 12 } } } })[0].damage === 12, "Damaging keeps its fixed damage");
  check(Z.hazardsOf({ flags: { [Z.SCOPE]: { hazards: { lava: true, confined: false } } } }).length === 0, "unknown and false keys are ignored");
}

console.log("\n3. Which candidates apply to the roll actually made");
{
  const mods = run([rect("fog", 400, 0, 600, 100, { obscured: true }), rect("tunnel", 900, 0, 1000, 100, { confined: true })]).mods;
  const all = () => true;
  const bow = Z.resolveHazardMods(mods, { ticked: all, ranged: true, attackSkill: "Missile", defenceSkill: "Dodge" });
  check(bow.attack === -20 && bow.defence === -20, "bow vs a dodger in a tunnel through fog: -20 / -20", bow);
  const sword = Z.resolveHazardMods(mods, { ticked: all, ranged: false, attackSkill: "Melee: Medium", defenceSkill: "Melee: Light" });
  check(sword.attack === 0 && sword.defence === 0, "sword vs a Melee: Light parry: fog and tunnel do nothing", sword);
  const heavy = Z.resolveHazardMods(mods, { ticked: all, ranged: false, attackSkill: "Melee: Medium", defenceSkill: "Melee: Heavy" });
  check(heavy.defence === -20, "a Melee: Heavy parry in the tunnel: -20");
  const gm = Z.resolveHazardMods(mods, { ticked: (id) => id !== "obscured", ranged: true, attackSkill: "Missile", defenceSkill: "Dodge" });
  check(gm.attack === 0 && gm.skipped.some((s) => s.why === "unticked"), "GM unticks Obscured (target clearly seen): no -20");
}

console.log("\n4. Mutation: a modifier that ignores its condition is caught");
{
  const src = readFileSync("system/the-broken-empires/module/rules/zones.mjs", "utf8");
  const mutated = src.replace("const ok = m.when?.ranged ? !!ranged : m.when?.skills ? skillIs(skill, m.when.skills) : true;", "const ok = true;");
  check(mutated !== src, "(sanity) mutation applied");
  const M = await import("data:text/javascript," + encodeURIComponent(mutated));
  const mods = M.attackHazards({ regions: [rect("fog", 400, 0, 600, 100, { obscured: true })], inside: M.insideRegion, attacker: A, target: T });
  const sword = M.resolveHazardMods(mods.mods, { ticked: () => true, ranged: false, attackSkill: "Melee: Medium", defenceSkill: "Dodge" });
  check(sword.attack !== 0, "the mutated owner penalises a sword in fog, which section 3's sword assertion rejects");
}

console.log("\n5. TBE: Zone Hazards macro");
{
  const docs = JSON.parse(readFileSync("data/solo_docs.json", "utf8"));
  const cmd = docs.macros.find((m) => m.name === "TBE: Zone Hazards")?.command;
  check(!!cmd, "shipped in the macro pack");
  const AF = Object.getPrototypeOf(async function () {}).constructor;
  const mkRegion = (name, hazards) => {
    const r = { name, flags: hazards ? { [Z.SCOPE]: { hazards } } : {}, updates: [],
      async update(u) {
        this.updates.push(u);
        for (const [k, v] of Object.entries(u)) {
          if (k.endsWith(".-=hazards")) { if (this.flags[Z.SCOPE]) delete this.flags[Z.SCOPE].hazards; }
          else if (k === "flags." + Z.SCOPE + ".hazards") { this.flags[Z.SCOPE] = this.flags[Z.SCOPE] || {}; this.flags[Z.SCOPE].hazards = v; }
        }
        return this;
      } };
    return r;
  };
  const runMacro = async ({ isGM = true, answer, regions }) => {
    const log = [];
    const game = { user: { isGM, id: "U" }, settings: { get: () => "publicroll" },
      thebrokenempires: { rules: { zones: { SCOPE: Z.SCOPE, HAZARDS: Z.HAZARDS, PENALTY: Z.PENALTY, hazardsOf: Z.hazardsOf,
        attackHazards: Z.attackHazards, resolveHazardMods: Z.resolveHazardMods, insideRegion: Z.insideRegion } } } };
    const foundry = { utils: { duplicate: (o) => JSON.parse(JSON.stringify(o)) },
      applications: { api: { DialogV2: { prompt: async (o) => { log.push({ ev: "dialog", content: o.content }); return answer; } } } } };
    const ui = { notifications: { warn: (m) => log.push({ ev: "warn", m }), info: (m) => log.push({ ev: "info", m }), error: (m) => log.push({ ev: "error", m }) } };
    const canvas = { scene: { name: "Salt Run", regions }, tokens: { controlled: [] } };
    const fn = new AF("canvas", "game", "foundry", "ui", "ChatMessage", "Roll", "CONFIG", "speaker", "actor", "token", "character", "scope", "event", "{" + cmd + "\n}");
    await fn(canvas, game, foundry, ui, {}, class {}, {});
    return log;
  };
  const regs = [mkRegion("Road", null), mkRegion("Reeds", { obscured: true, rough: true })];
  const log = await runMacro({ regions: regs, answer: { r0_confined: "on", r0_damaging: "12", r1_obscured: "on" } });
  check(regs[0].flags[Z.SCOPE].hazards.confined === true && regs[0].flags[Z.SCOPE].hazards.damaging === 12, "Road: Confined + Damaging 12 saved", regs[0].flags);
  check(JSON.stringify(regs[1].flags[Z.SCOPE].hazards) === JSON.stringify({ obscured: true }), "Reeds: Rough unticked is really removed", regs[1].flags);
  check(log.some((e) => e.ev === "dialog" && /checked/.test(e.content)), "existing marks are shown ticked when the dialog opens");
  check(log.some((e) => e.ev === "info" && /Road: Confined, Damaging 12/.test(e.m)), "summary names what was saved", log.filter((e) => e.ev === "info"));
  const pRegs = [mkRegion("Road", null)];
  const plog = await runMacro({ isGM: false, regions: pRegs, answer: { r0_confined: "on" } });
  check(plog.length === 1 && plog[0].ev === "warn" && !pRegs[0].updates.length, "a player is told it is a GM tool, and nothing is written");
  const elog = await runMacro({ regions: [], answer: {} });
  check(elog.length === 1 && /no Regions/.test(elog[0].m), "a scene with no Regions says how to draw one");
}

console.log("\n" + pass + " passed, " + fail + " failed" + (skip ? ", " + skip + " skipped" : ""));
process.exit(fail ? 1 : 0);
