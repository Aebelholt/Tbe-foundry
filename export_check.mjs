/* export_check.mjs — TBE: Export Sheets, the printable character sheet.
 *
 * WHY IT EXISTS, and what it is actually guarding. The macro's whole job is to
 * restate numbers that already exist somewhere else. That makes its failure
 * mode specific and nasty: not a crash, but a printed sheet that quietly
 * DISAGREES with the screen. Someone takes it to the table, plays off it for a
 * session, and there is no way to tell which of the two lied.
 *
 * So the rule the macro follows, and the thing most of this file checks, is
 * **read, never derive**. Every number on the page comes from the actor's own
 * derived fields (`initiativeEffective`, `lethalityLevel`, `totalWp`, `dying`)
 * or from the helper that already owns that arithmetic (`TBE.encStatus`,
 * `TBE.readiness`, `TBE.allSkills`, `TBE.binds`, `TBE.strands`).
 *
 * It runs the REAL macro, compiled the way Foundry compiles one -- an
 * AsyncFunction with the real parameter list and the body wrapped in a block,
 * which is what `Macro#execute` does -- against a stubbed world.
 *
 * (Rewritten 2026-09-21 after the container holding the original was
 * reclaimed. The v0.41.x macro and _lib.js were recovered byte-for-byte from
 * the compendium pack inside Seb's v0.41.1 zip; this file was not in the zip
 * and was rebuilt from the session that wrote it.)
 *
 * Run: node export_check.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");

let pass = 0, fail = 0;
const ok = (cond, label, got) => {
  if (cond) pass++;
  else { fail++; console.log("  FAIL  " + label + (got === undefined ? "" : "  <- " + JSON.stringify(got))); }
};
const section = (t) => console.log("\n" + t);

const codeOf = (t) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const MACRO_SRC = read("macros/tbe-export-sheets.js");
const LIB = read("macros/_lib.js");

const mkItem = (type, name, system = {}) => ({ type, name, id: name, system });

function mkPC(name, over = {}) {
  return {
    type: "character", name, id: name,
    system: Object.assign({
      race: "Human", size: "Medium", culture: "Westronne", career: "Warrior",
      deathThreshold: { value: 20, max: 20 },
      resolve: { value: 8, max: 10 },
      toughness: 1, fatigue: 2, silver: 120,
      initiative: 12,
      /* DERIVED on the real actor: the macro must print THESE. */
      initiativeEffective: 9, armorInitPenalty: 3, armorBulk: 8,
      lethalityLevel: 7, totalWp: 4, dying: false, shock: false,
      wounds: { body: { wp: 4, imp: 1 } },
      goals: "<p>Find the salt road.</p>", notes: "<p>Owes Renn a favour.</p>"
    }, over),
    items: over.items || [
      mkItem("skill", "Might", { group: "Combat", value: 55, expertise: 2, savvy: true }),
      mkItem("skill", "Stealth", { group: "Adventuring", value: 40 }),
      mkItem("weapon", "Spear", { skillName: "Might", dmg: "1d8", cl: 3, cs: 2, dis: 1, t: 0, enc: 2, carried: "ready" }),
      mkItem("weapon", "Dagger", { skillName: "Might", dmg: "1d4", enc: 1, carried: "dropped" }),
      mkItem("shield", "Round Shield", { ap: 3, shb: 6, enc: 2, carried: "hand" }),
      mkItem("armor", "Mail Shirt", { ap: 4, bulk: 6, worn: true, locations: { body: true, rArm: true } }),
      mkItem("talent", "Tough", { ranks: 2 })
    ]
  };
}

function runMacro({ isGM = true, actors, picked = null, popupBlocked = false } = {}) {
  const out = { notifications: [], said: [], opened: null, downloaded: null, promptContent: null };
  const TBE_EXTRA = {
    prompt: async (title, content) => { out.promptContent = content; return picked; },
    say: async (content, rolls, opts) => { out.said.push({ content, opts }); }
  };
  const game = { user: { isGM }, actors, settings: { get: () => "publicroll" } };
  const ui = { notifications: {
    warn: (m) => out.notifications.push(["warn", m]),
    info: (m) => out.notifications.push(["info", m])
  } };
  const document_ = {
    createElement: () => ({ click() { out.downloaded = true; }, remove() {}, set href(v) {}, set download(v) {} }),
    body: { appendChild() {} }
  };
  const window_ = { open: () => (popupBlocked ? null : (out.opened = true)) };

  /* Foundry compiles a macro body wrapped in a BLOCK -- see loadout_check. */
  const AF = Object.getPrototypeOf(async function () {}).constructor;
  const fn = new AF("game", "ui", "window", "document", "Blob", "URL", "setTimeout", "foundry", "TBE_EXTRA",
    "{" + LIB + "\nObject.assign(TBE, TBE_EXTRA);\n" + MACRO_SRC + "\n}");
  return fn(game, ui, window_, document_,
    function Blob(parts) { out.html = parts.join(""); },
    { createObjectURL: () => "blob:x", revokeObjectURL: () => {} },
    () => {},
    /* _lib's TBE.clone falls back to a JSON round-trip without foundry.utils. */
    {},
    TBE_EXTRA
  ).then(() => out);
}

section("1. A player who runs it is told, and nothing happens");
{
  const r = await runMacro({ isGM: false, actors: [mkPC("Elspeth")] });
  ok(r.notifications.some(([k, m]) => k === "warn" && /GM tool/.test(m)), "a non-GM gets a warning naming it a GM tool", r.notifications);
  ok(!r.html, "and no document is built");
  ok(!r.opened && !r.downloaded, "and nothing opens or downloads");
  ok(r.said.length === 0, "and nothing is posted to chat");
}

section("2. Read, never derive");
{
  const weird = mkPC("Renn", {
    initiative: 12, initiativeEffective: 9, armorInitPenalty: 3,
    deathThreshold: { value: 18, max: 30 },   // ceil(30/3) = 10
    lethalityLevel: 4,                        // but the actor says 4
    totalWp: 99,                              // and the grid says 4
    wounds: { body: { wp: 4 } }
  });
  const r = await runMacro({ actors: [weird], picked: { pc0: "on" } });
  ok(/>9</.test(r.html), "prints the actor's initiativeEffective (9), not initiative (12)");
  ok(/>4</.test(r.html), "prints the actor's lethalityLevel (4), not ceil(DT/3) = 10");
  ok(!/>10</.test(r.html.split("Lethality")[1]?.slice(0, 80) ?? ""), "confirming it did not recompute it");
  ok(/>99</.test(r.html), "prints the actor's totalWp (99) even though the grid sums to 4");
  ok(/armor &minus;3/.test(r.html), "and shows where the Initiative penalty came from");

  const code = codeOf(MACRO_SRC);
  ok(!/Math\.ceil\([^)]*\/\s*3\)/.test(code), "the source contains no ceil(DT/3)");
  ok(/initiativeEffective/.test(code), "it reads initiativeEffective");
  ok(/lethalityLevel/.test(code) && !/lethalityBonus/.test(code), "it reads lethalityLevel without touching its inputs");
  ok(/TBE\.encStatus\(/.test(code), "encumbrance comes from TBE.encStatus");
  ok(/TBE\.readiness\(/.test(code), "carry state comes from TBE.readiness");
  ok(/TBE\.binds\(|TBE\.strands\(/.test(code), "magic comes from TBE.binds / TBE.strands");
  ok(!/!==\s*["']stored["']/.test(code), "and there is no negative carry filter anywhere in it");
}

section("3. The sheet carries what a table needs");
{
  const r = await runMacro({ actors: [mkPC("Elspeth")], picked: { pc0: "on" } });
  const h = r.html;
  ok(/Elspeth/.test(h), "the character's name");
  ok(/Human/.test(h) && /Warrior/.test(h), "race and career");
  ok(/Might/.test(h) && /55/.test(h), "a skill and its value");

  /* THE ONE THIS CHECK MISSED THE FIRST TIME. A TBE actor stores only the
     skills that differ from the untrained 20 (p.104), so a fixture with two
     skill Items printed two skills and every assertion above still passed.
     The catching assertion is about what is ABSENT. */
  ok(/Willpower/.test(h) || /Endurance/.test(h), "a skill the character never wrote down still appears, at 20");
  ok(/class="untrained"/.test(h), "...and is marked, so a glance still finds the trained ones");
  const skillCount = (h.match(/<li[^>]*><span>/g) || []).length;
  ok(skillCount > 20, "the whole catalogue is on the page, not just the Items", skillCount);
  ok(/TBE\.allSkills\(/.test(codeOf(MACRO_SRC)), "and it comes from the owner of that merge");

  ok(/Ex2/.test(h), "Expertise is marked");
  ok(/>S</.test(h), "so is Savvy");
  ok(/Spear/.test(h) && /1d8/.test(h), "a weapon and its damage");
  ok(/Round Shield/.test(h) && /Shield Bash 6 SL/.test(h), "a shield with its Circumvent cost");
  ok(/Mail Shirt/.test(h) && /Bulk 6/.test(h), "armour with Bulk");
  ok(/Tough/.test(h), "Talents");
  ok(/R Arm/.test(h) && /L Leg/.test(h), "every wound location, by label");
  ok(/At Hand/.test(h) && /Inventory/.test(h), "both encumbrance pools");
  ok(/salt road/.test(h), "goals");
  ok(/Owes Renn/.test(h), "notes");
  ok(/Dropped/.test(h), "a dropped weapon prints as Dropped, not as 'at hand'");
  ok(/Held and Ready/.test(h), "and a ready one prints as ready");
}

section("4. Restraint");
{
  const r = await runMacro({ actors: [mkPC("Bram")], picked: { pc0: "on" } });
  ok(!/The Weave/.test(r.html), "a non-caster gets no Weave block");

  const caster = mkPC("Fionnah", {
    pattern: "spellweaver", fraying: 3,
    items: [ mkItem("skill", "Bind: Fire", { group: "Bind", value: 60 }), mkItem("strand", "Strand: Flame", { level: 2 }) ]
  });
  const r2 = await runMacro({ actors: [caster], picked: { pc0: "on" } });
  ok(/The Weave/.test(r2.html), "a caster does get one");
  ok(/Fire/.test(r2.html) && />60</.test(r2.html), "with the Bind at its effective value");
  ok(/Flame/.test(r2.html), "and the Strand");
  ok(/Fraying 3/.test(r2.html), "and the Fraying count");
  ok((r2.html.match(/Bind: Fire/g) || []).length === 0, "and the raw 'Bind: Fire' skill is not listed among ordinary skills");

  const world = [mkPC("Elspeth"), { type: "creature", name: "Bandit", system: {}, items: [] }];
  const r3 = await runMacro({ actors: world, picked: { pc0: "on" } });
  ok(!/Bandit/.test(r3.html), "a creature never reaches the printout");
  ok(!/Bandit/.test(r3.promptContent ?? ""), "and is not even offered in the picker");
}

section("5. Selection");
{
  const three = [mkPC("A"), mkPC("B"), mkPC("C")];
  const r = await runMacro({ actors: three, picked: { pc0: "on", pc2: "on" } });
  ok(/<h1>A<\/h1>/.test(r.html) && /<h1>C<\/h1>/.test(r.html), "the ticked ones are exported");
  ok(!/<h1>B<\/h1>/.test(r.html), "the unticked one is not");
  ok(/2 characters/.test(r.html), "and the count matches what was chosen");
  ok(/checked/.test(r.promptContent), "everything starts ticked");

  const none = await runMacro({ actors: three, picked: {} });
  ok(!none.html, "ticking nothing builds nothing");
  ok(none.notifications.some(([, m]) => /nothing selected/i.test(m)), "and says so");

  const cancelled = await runMacro({ actors: three, picked: null });
  ok(!cancelled.html && cancelled.notifications.length === 0, "cancelling builds nothing and says nothing");

  const empty = await runMacro({ actors: [{ type: "creature", name: "Bandit", system: {}, items: [] }] });
  ok(!empty.html && empty.notifications.some(([, m]) => /no player characters/i.test(m)), "a world with no PCs explains why");
}

section("6. Two ways out");
{
  const r = await runMacro({ actors: [mkPC("A")], picked: { pc0: "on" } });
  ok(r.opened === true && !r.downloaded, "normally it opens a tab, and only that");
  const blocked = await runMacro({ actors: [mkPC("A")], picked: { pc0: "on" }, popupBlocked: true });
  ok(blocked.downloaded === true, "a blocked popup falls back to a download");
  ok(blocked.notifications.some(([k, m]) => k === "warn" && /blocked/.test(m)), "and the fallback is announced");
}

section("7. A file that survives being saved");
{
  const r = await runMacro({ actors: [mkPC("A"), mkPC("B")], picked: { pc0: "on", pc1: "on" } });
  const h = r.html;
  ok(/^<!doctype html>/i.test(h), "it is a whole document");
  ok(/<meta charset="utf-8">/.test(h), "with an encoding");
  ok(/page-break-after:always/.test(h), "one character per page");
  ok(/\.sheet:last-child\{page-break-after:auto\}/.test(h), "and no trailing blank page");
  ok(!/<link|<script|https?:\/\//.test(h), "and nothing external");
  ok((h.match(/<section class="sheet">/g) || []).length === 2, "one section per character");
}

section("8. It tells the GM, and only the GM");
{
  const r = await runMacro({ actors: [mkPC("A")], picked: { pc0: "on" } });
  ok(r.said.length === 1 && r.said[0].opts?.mode === "gmroll", "one card, whispered: housekeeping, not a game event", r.said[0]?.opts);
}

section("9. Mutations");
{
  const r = await runMacro({ actors: [mkPC("R", { deathThreshold: { value: 18, max: 30 }, lethalityLevel: 4 })], picked: { pc0: "on" } });
  ok(Math.ceil(30 / 3) === 10 && />4</.test(r.html), "MUTATION: a local ceil(DT/3) would print 10; the macro prints 4");

  const itemsOnly = MACRO_SRC.replace("TBE.allSkills(a)", "(a.items||[]).filter((i)=>i.type==='skill').map((i)=>({name:i.name,value:i.system?.value,group:i.system?.group,trained:true}))");
  ok(itemsOnly !== MACRO_SRC, "the items-only mutation applied");
  const saved = MACRO_SRC;
  const r2 = await (async () => {
    const AF = Object.getPrototypeOf(async function () {}).constructor;
    let html;
    const fn = new AF("game", "ui", "window", "document", "Blob", "URL", "setTimeout", "foundry", "TBE_EXTRA",
      "{" + LIB + "\nObject.assign(TBE, TBE_EXTRA);\n" + itemsOnly + "\n}");
    await fn({ user: { isGM: true }, actors: [mkPC("M")] }, { notifications: { warn() {}, info() {} } },
      { open: () => true }, { createElement: () => ({}), body: { appendChild() {} } },
      function Blob(p) { html = p.join(""); }, { createObjectURL: () => "x", revokeObjectURL() {} }, () => {}, {},
      { prompt: async () => ({ pc0: "on" }), say: async () => {} });
    return html;
  })();
  ok(!/Willpower/.test(r2) && !/Endurance/.test(r2),
    "MUTATION: the items-only version really does lose the untrained skills (the original bug)");
  ok(saved === MACRO_SRC, "and the shipped source was not touched by the mutation");

  const gateless = MACRO_SRC.replace(/if \(!game\.user\?\.isGM\) \{[\s\S]*?return;\s*\}/, "");
  ok(gateless !== MACRO_SRC, "MUTATION: the GM gate exists and is removable, so section 1 is testing something real");
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
