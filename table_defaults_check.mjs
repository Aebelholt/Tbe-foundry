#!/usr/bin/env node
/*
 * table_defaults_check.mjs -- the v0.54.0 batch: character tokens linked to
 * their actor, table defaults, rescuing a build stranded on a token, the
 * portrait roster, and a creature with no Initiative.
 *
 * Why it exists: the playtest GM built a full character, started combat, linked
 * the token, and the character "reverted". The build had gone into the
 * unlinked token's private copy (Foundry's actor delta) because Create
 * Character took the selected token's actor, and nothing in the system
 * linked a Character's token. Linking then showed the untouched sidebar actor.
 * Every check was green: none of them had a token in it.
 *
 *   1. Defaults (pure): Characters linked, sighted, friendly; creatures never
 *      linked; rotation locked; scenes with token vision; all off when off.
 *   2. The existing world, once: prototypes fixed, placed Character tokens
 *      NOT linked (linking would hide a stranded build).
 *   3. Finding unlinked Character tokens and what their copy holds.
 *   4. SEQUENCE: rescue keeps the token's build; keeping the actor leaves it;
 *      a failure part way loses nothing (mutation: delete-first loses items).
 *   5. Create Character targets the sidebar actor, never a token's copy, and
 *      Create links and renames the actor's tokens but skips one holding a build.
 *   6. A creature with a blank Initiative rolls instead of silently acting on 0.
 *   7. The portrait roster: folders, collections, rolls, and the macro helpers.
 */
import fs from "node:fs";
import { pathToFileURL } from "node:url";

let pass = 0, fail = 0;
const check = (cond, label, extra) => {
  if (cond) { pass++; console.log("  PASS  " + label); }
  else { fail++; console.log("  FAIL  " + label + (extra !== undefined ? "  <- " + JSON.stringify(extra).slice(0, 400) : "")); }
};
const SYS = "./system/the-broken-empires/module/";
const TD = await import(SYS + "helpers/table-defaults.mjs");
const TL = await import(SYS + "helpers/token-link.mjs");
const PO = await import(SYS + "helpers/portraits.mjs");
const CR = await import(SYS + "chargen/creator.mjs");
const CM = await import(SYS + "chargen/commit.mjs");
const ON = { linkCharacters: true, characterVision: true, lockRotation: true, sceneVision: true };
const OFF = { linkCharacters: false, characterVision: false, lockRotation: false, sceneVision: false };

console.log("\n1. Defaults for new actors, tokens and scenes");
{
  const c = TD.actorDefaults("character", ON).prototypeToken;
  check(c.actorLink === true && c.sight.enabled === true && c.lockRotation === true && c.disposition === 1,
    "a new Character: token linked, vision on, rotation locked, friendly", c);
  const m = TD.actorDefaults("creature", ON).prototypeToken;
  check(m.lockRotation === true && !("actorLink" in m) && !("sight" in m), "a new Creature: rotation locked, never linked (each wolf on the map is its own wolf)", m);
  check(TD.tokenDefaults("character", ON).actorLink === true && TD.tokenDefaults("creature", ON).actorLink === undefined, "a placed token follows the same split");
  check(TD.sceneDefaults(ON)?.tokenVision === true, "a new scene has token vision on");
  check(TD.actorDefaults("character", OFF)?.prototypeToken?.actorLink === undefined && TD.tokenDefaults("character", OFF) === null && TD.sceneDefaults(OFF) === null,
    "with the settings off, nothing is changed");
  const src = fs.readFileSync(SYS + "helpers/table-defaults.mjs", "utf8");
  check(/Hooks\.on\("preCreateActor"/.test(src) && /Hooks\.on\("preCreateToken"/.test(src) && /Hooks\.on\("preCreateScene"/.test(src), "all three are wired to Foundry's preCreate hooks");
  const lang = JSON.parse(fs.readFileSync("./system/the-broken-empires/lang/en.json", "utf8")).TBE.Settings;
  check(TD.SETTINGS.every(([, label]) => lang[label]?.Name && lang[label]?.Hint) && lang.PortraitFolders?.Name, "every new setting has a label and a hint");
}

console.log("\n2. The existing world, brought in line once");
{
  const actors = [
    { id: "pc", type: "character", prototypeToken: { actorLink: false, lockRotation: false, sight: { enabled: false } } },
    { id: "wolf", type: "creature", prototypeToken: { actorLink: false, lockRotation: false } },
    { id: "done", type: "character", prototypeToken: { actorLink: true, lockRotation: true, sight: { enabled: true } } }
  ];
  const scene = { name: "Road", tokens: [{ id: "t1", lockRotation: false, actorLink: false }, { id: "t2", lockRotation: true }] };
  const plan = TD.existingWorldPlan(actors, [scene], ON);
  const pc = plan.actorUpdates.find((u) => u._id === "pc");
  const wolf = plan.actorUpdates.find((u) => u._id === "wolf");
  check(pc && pc["prototypeToken.actorLink"] === true && pc["prototypeToken.sight.enabled"] === true && pc["prototypeToken.lockRotation"] === true,
    "a Character's PROTOTYPE token is linked, sighted and locked", pc);
  check(wolf && !("prototypeToken.actorLink" in wolf) && wolf["prototypeToken.lockRotation"] === true, "a creature's is only locked");
  check(!plan.actorUpdates.some((u) => u._id === "done"), "an actor already in line is not touched");
  const tu = plan.tokenUpdates[0]?.updates || [];
  check(tu.length === 1 && tu[0]._id === "t1" && tu[0].lockRotation === true && !("actorLink" in tu[0]),
    "a placed token gets its rotation locked and is NOT linked here (linking could hide a build on it)", tu);
  const src = fs.readFileSync(SYS + "helpers/table-defaults.mjs", "utf8");
  check(/if \(!failed\.length\) await game\.settings\.set\(SCOPE, "tableDefaultsApplied", true\)/.test(src), "it is recorded as done only when every write landed");
}

/* ---- stubs for tokens and actors ---------------------------------------- */
function mkActor(id, name, items = [], system = {}, type = "character") {
  const log = [];
  const a = {
    id, name, type, img: "base.png", system: JSON.parse(JSON.stringify(system)), log,
    items: items.map((x, i) => ({ id: id + "i" + i, ...x })),
    async createEmbeddedDocuments(t, arr) { if (a.failCreate) throw new Error("create refused"); log.push(["create", arr.length]); arr.forEach((x, i) => a.items.push({ id: "n" + i + Math.random(), ...x })); return arr; },
    async deleteEmbeddedDocuments(t, ids) { log.push(["delete", ids.length]); a.items = a.items.filter((i) => !ids.includes(i.id)); },
    async update(u) { log.push(["update", Object.keys(u)]); if (u.name) a.name = u.name; if (u.system) a.system = u.system; }
  };
  a.items.map = Array.prototype.map.bind(a.items);
  return a;
}
function mkToken(id, name, actorId, { link = false, deltaItems = [], deltaSystem = {}, copy = null } = {}) {
  const t = {
    id, name, actorId, actorLink: link, updates: [],
    delta: { toObject: () => ({ items: deltaItems, system: deltaSystem }) },
    actor: copy,
    async update(u) { t.updates.push(u); if ("actorLink" in u) t.actorLink = u.actorLink; }
  };
  return t;
}

console.log("\n3. Finding unlinked Character tokens");
{
  const pc = mkActor("pc", "Bahrouz"), wolf = mkActor("w", "White Wolf", [], {}, "creature");
  const built = mkToken("t1", "Bahrouz", "pc", { deltaItems: [{ name: "Dodge" }, { name: "Tough" }], deltaSystem: { race: "Human" } });
  const clean = mkToken("t2", "Bahrouz", "pc");
  const linked = mkToken("t3", "Bahrouz", "pc", { link: true });
  const wt = mkToken("t4", "White Wolf 1", "w");
  const found = TL.findUnlinkedCharacters([{ name: "Road", tokens: [built, clean, linked, wt] }], (id) => ({ pc, w: wolf })[id]);
  check(found.length === 2 && found.every((f) => f.actor === pc), "two unlinked Character tokens; the linked one and the wolf are ignored", found.map((f) => f.token.id));
  const b = found.find((f) => f.token.id === "t1").summary;
  check(b.hasBuild && b.items === 2 && b.system === 1, "the token with a build is reported with what it holds", b);
  check(!found.find((f) => f.token.id === "t2").summary.hasBuild, "a clean one holds nothing");
  const html = TL.unlinkedToHtml(found);
  check(/2 Character token\(s\) are not linked/.test(html) && /TBE: Link Character Tokens/.test(html) && /Nothing has been changed/.test(html), "the world check card says so, names the tool, and changes nothing");
  check(TL.unlinkedToHtml([]) === null, "and says nothing when there is nothing");
}

console.log("\n4. Linking, as a sequence");
{
  /* Keep the token's copy: it becomes the sidebar actor. */
  const base = mkActor("pc", "Bahrouz", [{ name: "Old" }], { race: "" });
  const copy = { name: "Bahrouz Daryanpour", toObject: () => ({ name: "Bahrouz Daryanpour", img: "b.png", system: { race: "Human", initiative: 11 }, items: [{ _id: "x", name: "Dodge" }, { _id: "y", name: "Tough" }] }) };
  const tok = mkToken("t1", "Bahrouz", "pc", { deltaItems: [{}], copy });
  await TL.linkToken({ token: tok, actor: base }, "token");
  check(base.items.map((i) => i.name).join() === "Dodge,Tough" && base.system.race === "Human" && base.system.initiative === 11 && base.name === "Bahrouz Daryanpour",
    "keep the token's copy: the sidebar actor now holds the built character", { items: base.items.map((i) => i.name), sys: base.system, name: base.name });
  check(tok.actorLink === true && tok.updates.at(-1).name === "Bahrouz Daryanpour", "and the token is linked and keeps the character's name");
  check(base.log[0][0] === "create" && base.log[1][0] === "delete", "new Items are made BEFORE the old ones go");

  /* Keep the sidebar actor. */
  const base2 = mkActor("pc", "Bahrouz", [{ name: "Kept" }], { race: "Dwarf" });
  const tok2 = mkToken("t2", "Bahrouz", "pc", { deltaItems: [{}], copy });
  await TL.linkToken({ token: tok2, actor: base2 }, "actor");
  check(base2.log.length === 0 && base2.items[0].name === "Kept" && tok2.actorLink === true, "keep the sidebar actor: it is untouched and the token is linked");

  /* A failure part way loses nothing. */
  const base3 = mkActor("pc", "Bahrouz", [{ name: "Precious" }]);
  base3.failCreate = true;
  const tok3 = mkToken("t3", "Bahrouz", "pc", { deltaItems: [{}], copy });
  let threw = false;
  try { await TL.linkToken({ token: tok3, actor: base3 }, "token"); } catch (e) { threw = true; }
  check(threw && base3.items.length === 1 && base3.items[0].name === "Precious" && tok3.actorLink === false,
    "if making the Items fails, the actor keeps its own and the token stays unlinked (its copy intact)");

  /* Mutation: a linker that deletes first loses the actor's Items on the same failure. */
  const base4 = mkActor("pc", "Bahrouz", [{ name: "Precious" }]);
  base4.failCreate = true;
  const deleteFirst = async (actor) => { await actor.deleteEmbeddedDocuments("Item", actor.items.map((i) => i.id)); await actor.createEmbeddedDocuments("Item", [{}]); };
  try { await deleteFirst(base4); } catch (e) { /* expected */ }
  check(base4.items.length === 0, "mutation: deleting first would have left the actor with nothing, so the order above is live");
}

console.log("\n5. Create Character works on the sidebar actor");
{
  const base = mkActor("pc", "Bahrouz");
  const tokBuilt = mkToken("t1", "Bahrouz", "pc", { deltaItems: [{}, {}] });
  const synthetic = { id: "pc", isToken: true, token: tokBuilt, name: "Bahrouz" };
  const r = CR.resolveTarget(synthetic, (id) => (id === "pc" ? base : null));
  check(r.target === base && r.stranded && r.stranded.items === 2, "opened from an unlinked token holding a build: the target is the SIDEBAR actor, and the stranded build is noticed", r.stranded);
  const tokClean = mkToken("t2", "Bahrouz", "pc");
  const r2 = CR.resolveTarget({ id: "pc", isToken: true, token: tokClean }, () => base);
  check(r2.target === base && !r2.stranded, "a clean unlinked token: the sidebar actor, nothing to rescue");
  check(CR.resolveTarget(base, () => null).target === base, "the sidebar actor itself: itself");
  const src = fs.readFileSync(SYS + "chargen/creator.mjs", "utf8");
  check(/actor\.type !== "character"/.test(src) && /Create Character builds player characters/.test(src), "a Creature is refused with a sentence, not built into");
  check(/newCharacterActor/.test(src) && /ACTOR_CREATE/.test(src), "with nothing selected it offers to create the actor, when the user may");

  const payload = { update: { name: "Bahrouz Daryanpour", "prototypeToken.texture.src": "p.webp" } };
  const scene = { name: "Road", tokens: [mkToken("a", "Bahrouz", "pc"), mkToken("b", "Bahrouz", "pc", { link: true }), mkToken("c", "Bahrouz", "pc", { deltaItems: [{}] }), mkToken("d", "Wolf", "w")] };
  const { plan, skipped } = CR.tokenPlan("pc", [scene], payload, ON);
  const byId = Object.fromEntries(plan.map((p) => [p.update._id, p.update]));
  check(byId.a?.actorLink === true && byId.a.name === "Bahrouz Daryanpour" && byId.a["texture.src"] === "p.webp", "Create links the actor's clean tokens, renames them and gives them the portrait", byId.a);
  check(byId.b && !("actorLink" in byId.b) && byId.b.name === "Bahrouz Daryanpour", "an already linked token is renamed");
  check(!byId.c && skipped.length === 1 && skipped[0].token.id === "c", "a token holding its own build is left alone and reported");
  check(!byId.d, "another actor's tokens are not touched");

  const T = Object.assign({}, (await import(SYS + "chargen/tables.mjs")).TABLES, { skillGroups: (await import(SYS + "chargen/rules.mjs")).SKILL_GROUPS });
  const DR = await import(SYS + "chargen/draft.mjs");
  const d = Object.assign(DR.defaultDraft(T), { name: "Bahrouz Daryanpour", portrait: "p.webp", raceName: "Human", careerName: "Warrior" });
  const ch = CR.deriveWith(T, d);
  const p1 = CM.buildPayload(ch, d, T, { actor: { type: "character", system: {} }, link: true, vision: true });
  check(p1.update.img === "p.webp" && p1.update["prototypeToken.texture.src"] === "p.webp" && p1.update["prototypeToken.name"] === "Bahrouz Daryanpour" &&
    p1.update["prototypeToken.actorLink"] === true && p1.update["prototypeToken.sight.enabled"] === true,
    "Create writes the portrait and name to the actor AND its sidebar token, linked and sighted");
  check(p1.update["system.initiative"] === ch.attributes.initiative.value && Number.isFinite(p1.update["system.initiative"]), "and a real Initiative number");
}

console.log("\n6. A creature with no Initiative value rolls instead of acting on 0");
{
  const src = fs.readFileSync(SYS + "the-broken-empires.mjs", "utf8");
  const body = src.slice(src.indexOf("_getInitiativeFormula() {") + "_getInitiativeFormula() {".length, src.indexOf("\n    }", src.indexOf("_getInitiativeFormula() {")));
  const f = new Function(body);
  const run = (type, initiative) => f.call({ actor: { type, system: { initiative } } });
  check(run("creature", "16") === "@initiativeEffective", "a creature with an Initiative value keeps it (p.161: enemies do not roll)");
  check(run("creature", "") === "1d10 + @initiativeEffective" && run("creature", null) === "1d10 + @initiativeEffective", "a creature with a blank one rolls 1d10 + 0 instead of a silent 0");
  check(run("character", 11) === "1d10 + @initiativeEffective", "a character rolls, as always");
}

console.log("\n7. The portrait roster");
{
  const tree = { "npcs": { files: ["npcs/readme.txt"], dirs: ["npcs/Bandits", "npcs/Nobles%20Old"] },
    "npcs/Bandits": { files: ["npcs/Bandits/a.webp", "npcs/Bandits/b.PNG"], dirs: ["npcs/Bandits/deep"] },
    "npcs/Bandits/deep": { files: ["npcs/Bandits/deep/c.jpg"], dirs: [] },
    "npcs/Nobles%20Old": { files: ["npcs/Nobles%20Old/n.jpeg"], dirs: [] },
    "more": { files: ["more/x.gif"], dirs: [] } };
  const browse = async (d) => { if (!tree[d]) throw new Error("no such folder"); return tree[d]; };
  check(JSON.stringify(PO.folderList(" npcs ; more;; ")) === '["npcs","more"]', "several folders, separated by ;");
  const list = await PO.listPortraits(PO.folderList("npcs;more;missing"), browse);
  check(list.length === 5 && !list.some((p) => /readme/.test(p.path)), "every image in the folders and two levels of subfolders, nothing else; a missing folder is skipped", list.map((p) => p.path));
  check(JSON.stringify(PO.collections(list)) === '["Bandits","Nobles Old"]', "each subfolder is a collection (the deeper one counts toward its parent)");
  check(list.filter((p) => p.collection === "Bandits").length === 3, "Bandits holds its three, deep one included");
  check(PO.pick(list, "Nobles Old", () => 1) === "npcs/Nobles%20Old/n.jpeg" && PO.pick(list, "Nobody", () => 1) === null && PO.pick([], "", () => 1) === null,
    "rolling within a collection; an empty one gives nothing, not a random other image");
  const seen = new Set();
  for (let i = 1; i <= 5; i++) seen.add(PO.pick(list, "", () => i));
  check(seen.size === 5, "every image can come up");
  const psrc = fs.readFileSync(SYS + "helpers/portraits.mjs", "utf8");
  check(/foundry\.applications\?\.apps\?\.FilePicker\?\.implementation \?\? globalThis\.FilePicker/.test(psrc), "the FilePicker is found by shape (V13 moved it), not by version");

  /* The macro helpers read the system's roster, and stay silent without one. */
  const lib = fs.readFileSync("macros/_lib.js", "utf8");
  const TBE = new Function(lib + "\n;return TBE;")();
  globalThis.game = { thebrokenempires: { portraits: { roster: async () => list, collections: PO.collections, random: async (c) => PO.pick(list, c, () => 1) } } };
  const field = await TBE.portraitField("Portrait");
  const rolled = await TBE.rollPortrait("Bandits"), any = await TBE.rollPortrait("*"), none = await TBE.rollPortrait("");
  globalThis.game = { thebrokenempires: { portraits: { roster: async () => [], collections: PO.collections, random: async () => null } } };
  const emptyField = await TBE.portraitField("Portrait");
  delete globalThis.game;
  check(/Roll from Bandits/.test(field) && /Roll from any collection \(5 images\)/.test(field) && /value="">None/.test(field), "the NPC and Funnel dialogs offer each collection, any, or none");
  check(rolled === "npcs/Bandits/a.webp" && any && none === null, "a roll gives an image from the chosen collection; None gives none");
  check(emptyField === "", "with no folders set, the dialogs look exactly as before");
  const npc = fs.readFileSync("macros/tbe-npc.js", "utf8"), fun = fs.readFileSync("macros/tbe-funnel.js", "utf8");
  check([npc, fun].every((s) => /TBE\.rollPortrait\(data\.portrait\)/.test(s) && /prototypeToken: \{ texture: \{ src: img \} \}/.test(s)), "TBE: NPC and TBE: Funnel put the portrait on the actor and its token");
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
