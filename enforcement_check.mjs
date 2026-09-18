#!/usr/bin/env node
/* enforcement_check.mjs — drives TBE: Talents and TBE: Advancement headlessly
 * to prove the Ch.8 purchase rules are ENFORCED, not just printed. Each case
 * stubs foundry.applications.api.DialogV2 (what TBE.prompt really uses) so the
 * macro's own dialog HTML is parsed and answered, then asserts on what
 * actually reached the actor. */
import fs from "node:fs"; import path from "node:path"; import { chromium } from "playwright";
const dir = process.cwd();
const macros = JSON.parse(fs.readFileSync(path.join(dir, "data/solo_docs.json"), "utf8")).macros;
const src = (n) => macros.find((m) => m.name === n).command;
const talents = JSON.parse(fs.readFileSync(path.join(dir, "data/talents.json"), "utf8"));
const idx = (name) => talents.findIndex((t) => t.name.toLowerCase().startsWith(name.toLowerCase()));

let fails = 0;
const check = (ok, msg, extra) => { if (ok) console.log("  ok: " + msg); else { fails++; console.error("FAIL: " + msg + (extra ? " | " + JSON.stringify(extra) : "")); } };

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });

async function run(macroName, { items = [], xp = 0, race = "Human", answers = [], system = {}, d100 = 95, dSmall = 4 }) {
  const page = await browser.newPage();
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  const shim = `
window.__prompts=[];window.__created=[];window.__updates=[];window.__itemUpdates=[];window.__notify=[];window.__chat=[];
window.__answers=${JSON.stringify(answers)};
window.foundry={utils:{mergeObject:(a,b)=>Object.assign({},a,b),duplicate:o=>JSON.parse(JSON.stringify(o))},
 applications:{api:{DialogV2:{prompt:async(cfg)=>{window.__prompts.push(cfg.content);
  const h=document.createElement("form");h.innerHTML=cfg.content;
  const w=window.__answers.shift();if(w===undefined||w===null)return null;
  const o={};
  h.querySelectorAll("[name]").forEach(i=>{
    if(i.type==="checkbox"){ if(w[i.name]!==undefined&&w[i.name]!==null) o[i.name]="on"; return; }
    o[i.name]= w[i.name]!==undefined ? w[i.name] : i.value;
  });
  return o;}}}}};
window.Roll=class{constructor(f){this.formula=f}async evaluate(){this.total=/d100/.test(this.formula)?${d100}:${dSmall};return this}};
window.ChatMessage={create:async d=>{window.__chat.push(d.content);return d},getSpeaker:()=>({})};
window.CONFIG={sounds:{dice:null},statusEffects:[]};
window.ui={notifications:{warn:m=>window.__notify.push(m),error:m=>window.__notify.push(m),info:m=>window.__notify.push(m)}};
const mkItem=(o)=>Object.assign({},o,{update:async u=>{window.__itemUpdates.push([o.name,u]);Object.assign(o.system,u);return u}});
window.__actor={id:"a",name:"Subject",type:"character",race:${JSON.stringify(race)},
 system:Object.assign({race:${JSON.stringify(race)},experience:{available:${xp},earned:${xp}},
   resolve:{value:10,max:10},fraying:0,goals:[],pattern:"none"}, ${JSON.stringify(system)}),
 items:${JSON.stringify(items)}.map(mkItem),
 statuses:new Set(),__status:[],
 toggleStatusEffect:async(id)=>{window.__actor.statuses.add(id);window.__actor.__status.push(id);return true},
 update:async u=>{window.__updates.push(u);
   for(const [k,v] of Object.entries(u)){const parts=k.split(".").slice(1);let t=window.__actor.system;
     while(parts.length>1){const p=parts.shift();t[p]=t[p]||{};t=t[p];}t[parts[0]]=v;}
   return u},
 createEmbeddedDocuments:async(t,p)=>{window.__created.push(...p);return p},
 updateEmbeddedDocuments:async(t,p)=>{window.__itemUpdates.push(...p);return p},
 deleteEmbeddedDocuments:async()=>[]};
window.game={user:{character:window.__actor},macros:{getName:()=>null},packs:{get:()=>null},settings:{get:()=>null,set:async()=>null}};
window.canvas={tokens:{controlled:[{actor:window.__actor}]}};`;
  fs.writeFileSync("_e.html", `<!doctype html><html><head><meta charset="utf-8"></head><body><script>${shim}</script>
<script>(async()=>{try{${src(macroName)}}catch(e){window.__err=String(e&&e.message||e);}})();</script></body></html>`);
  await page.goto("file://" + path.join(dir, "_e.html"));
  await page.waitForTimeout(900);
  const out = await page.evaluate(() => ({
    err: window.__err || null, prompts: window.__prompts, created: window.__created,
    updates: window.__updates, itemUpdates: window.__itemUpdates,
    notify: window.__notify, chat: window.__chat, statuses: window.__actor.__status
  }));
  await page.close();
  if (errs.length) out.pageErrors = errs;
  return out;
}

const talentItem = (name) => ({ name, type: "talent", system: { ranks: 1 } });
const skillItem = (name, group, value, extra = {}) =>
  ({ id: name, name, type: "skill", system: Object.assign({ group, value, expertise: 0, savvy: false }, extra) });

console.log("== TBE: Talents ==");
{ // prerequisite enforcement
  const t = talents.find((x) => x.requires && x.requires.length);
  const r = await run("TBE: Talents", { xp: 99, answers: [{ ["t_" + talents.indexOf(t)]: "on", charge: "on" }] });
  check(r.created.length === 0, `a Talent whose prerequisite is unmet is refused ("${t.name}" requires ${t.requires})`, r.created.map(c=>c.name));
  check(/Refused|exclusive|requires/i.test(r.chat.join(" ") + r.notify.join(" ")), "the refusal says why");
}
{ // creation-only
  const i = idx("Patterned In The Weave");
  const r = await run("TBE: Talents", { xp: 99, answers: [{ ["t_" + i]: "on", charge: "on" }] });
  check(r.created.length === 0, "Patterned in the Weave cannot be bought after creation (p.164)");
}
{ // 10 XP cost is charged, and refused when unaffordable
  const i = idx("Godbound");
  const poor = await run("TBE: Talents", { xp: 7, answers: [{ ["t_" + i]: "on", charge: "on" }] });
  check(poor.created.length === 0, "Godbound at 10 XP is refused with only 7 XP available");
  const rich = await run("TBE: Talents", { xp: 12, answers: [{ ["t_" + i]: "on", charge: "on" }] });
  /* Two Items now, not one: v0.19.0 made this macro honour the Talent's own
   * stated effect (p.51, "acquire the Piety skill at a starting value of 30").
   * The old count-only assertion still passed while Piety was missing, which is
   * why it never caught the gap -- check the rule, not the tally. */
  check(rich.created.some((c) => /^Godbound/.test(c.name || "")), "Godbound is granted with 12 XP available",
    rich.created.map((c) => c.name));
  const piety = rich.created.find((c) => (c.name || "") === "Piety");
  check(!!piety && piety.system?.value === 30 && piety.type === "skill",
    "and it brings the Piety skill at a starting value of 30 (p.51)", piety);
  const spent = rich.updates.find((u) => "system.experience.available" in u);
  check(spent && spent["system.experience.available"] === 2, "exactly 10 XP is charged, not 5", spent);
}
{ // the unlimited-talents hole: many picks are billed in full
  const cheap = talents.map((t, i) => ({ t, i })).filter(({ t }) => !t.requires && !t.creationOnly && t.xp === 5 && t.category !== "Non-Human").slice(0, 4);
  const ans = { charge: "on" }; cheap.forEach(({ i }) => (ans["t_" + i] = "on"));
  const poor = await run("TBE: Talents", { xp: 10, answers: [ans] });
  check(poor.created.length === 0, `4 Talents costing 20 XP are refused at 10 XP (the old flat-5 hole)`, poor.created.map(c=>c.name));
  const rich = await run("TBE: Talents", { xp: 20, answers: [ans] });
  check(rich.created.length === 4, "the same 4 are granted at 20 XP");
}
{ // per-X talents get their own row with the spec, not a rank bump
  const i = idx("Armor Piercer");
  const r = await run("TBE: Talents", { xp: 99, items: [talentItem("Armor Piercer")], answers: [{ ["t_" + i]: "on", spec: "longbow", charge: "on" }] });
  check(r.created.length === 1 && /longbow/.test(r.created[0]?.name || ""),
    "a per-weapon Talent taken again becomes its own row carrying the new spec", r.created.map(c=>c.name));
}
{ // free during chargen
  const i = idx("Armor Piercer");
  const r = await run("TBE: Talents", { xp: 0, answers: [{ ["t_" + i]: "on", spec: "axe", charge: undefined }] });
  check(r.created.length === 1, "unticking 'Spend XP' still adds the Talent at 0 XP (character creation)");
}

console.log("== TBE: Advancement ==");
{ // Fade Bind 70 cap
  const r = await run("TBE: Advancement", { xp: 9, items: [talentItem("Faded Pattern"), skillItem("Change", "Bind", 69)],
    answers: [{ act: "improve", skill: "Change" }] });
  const upd = r.itemUpdates.find((u) => u && u["system.value"] !== undefined);
  check(upd && upd["system.value"] === 70, "a Fade's Bind is held at 70 (69 + 1d4+1 would be 74) (p.162)", upd);
  check(/never develop a Bind past 70/i.test(r.chat.join(" ")), "the card explains the cap rather than silently clamping");
}
{ // a non-Fade Bind is not capped
  const r = await run("TBE: Advancement", { xp: 9, items: [talentItem("Patterned In The Weave"), skillItem("Change", "Bind", 69)],
    answers: [{ act: "improve", skill: "Change" }] });
  const upd = r.itemUpdates.find((u) => u && u["system.value"] !== undefined);
  check(upd && upd["system.value"] === 74, "a Spellweaver (not a Fade) reaches 74, uncapped", upd);
}
{ // Bind purchase gating
  const no = await run("TBE: Advancement", { xp: 20, items: [skillItem("Dodge", "Combat", 40)],
    answers: [{ act: "newskill", newtype: "bind", newname: "Destroy" }] });
  check(no.created.length === 0, "a character with no magic Talent cannot open a Bind (p.162)");
  check(/Patterned in the Weave|Faded Pattern/i.test(no.chat.join(" ")), "it names the Talent they need first");
  const yes = await run("TBE: Advancement", { xp: 20, items: [talentItem("Faded Pattern"), skillItem("Dodge", "Combat", 40)],
    answers: [{ act: "newskill", newtype: "bind", newname: "Destroy" }] });
  check(yes.created.length === 1 && yes.created[0].system.value === 10, "a Fade can open a Bind at 10 for 5 XP");
}
{ // Talent handoff no longer pre-charges
  const r = await run("TBE: Advancement", { xp: 12, items: [], answers: [{ act: "talent" }] });
  const spent = r.updates.find((u) => "system.experience.available" in u);
  check(!spent, "choosing 'Buy a Talent' no longer takes a flat 5 XP up front", spent);
}
{ // Gaining XP table
  const r = await run("TBE: Advancement", { xp: 0, items: [],
    answers: [{ act: "award", xp_pursue: "on", xp_revelation: "on", xp_trait: "on", amt: "0" }] });
  const upd = r.updates.find((u) => "system.experience.available" in u);
  check(upd && upd["system.experience.available"] === 5, "the Gaining XP table sums 3+1+1 = 5 (p.160)", upd);
}
{ /* p.160 pays PER goal completed. The old dialog had one flat "completed an
     individual goal" tick, so a session that finished two paid for one, and
     nothing stopped the same goal being paid again next week. */
  const goals = [
    { text: "Find my brother", kind: "individual", done: true, awarded: false },
    { text: "Break the siege", kind: "shared", done: true, awarded: false },
    { text: "Already paid", kind: "individual", done: true, awarded: true }
  ];
  const r = await run("TBE: Advancement", { xp: 0, items: [], system: { goals },
    answers: [{ act: "award", goal_0: "on", goal_1: "on", amt: "0" }] });
  const upd = r.updates.find((u) => "system.experience.available" in u);
  check(upd && upd["system.experience.available"] === 3,
    "two completed goals pay 1 + 2 = 3 XP, per goal (p.160)", upd);
  const marked = r.updates.find((u) => "system.goals" in u);
  check(marked && marked["system.goals"][0].awarded && marked["system.goals"][1].awarded,
    "paid goals are marked awarded so they cannot be paid twice");
  check(/Already paid/.test(r.prompts[0] || "") && /already paid/i.test(r.prompts[0] || ""),
    "a goal already paid is shown but cannot be ticked again");
}

console.log("== TBE: Advancement, Weave Magic (Ch.8/Ch.14) ==");
const strandItem = (name, level, thin = false) =>
  ({ id: name, name, type: "strand", system: { level, thin } });
{ /* p.123: "going from Air 3 to 4 would cost 4 XP... improving from 3 to 5
     would cost a total of 9 XP: you must first spend 4 XP to go from 3 to 4,
     then another 5 XP to go from 4 to 5." Both of the book's own examples. */
  const r = await run("TBE: Advancement", { xp: 20, system: { pattern: "spellweaver" },
    items: [strandItem("Air", 3)], answers: [{ act: "strand", strand: "Air", strandSteps: "2" }] });
  const upd = r.itemUpdates.find((u) => u._id === "Air");
  check(upd && upd["system.level"] === 5, "a Strand raised 3 -> 5 lands at 5", upd);
  const spent = r.updates.find((u) => "system.experience.available" in u);
  check(spent && spent["system.experience.available"] === 11,
    "raising 3 -> 5 costs 9 XP (4 then 5), not 5 or 2", spent);
  check(/4 \+ 5/.test(r.chat.join(" ")), "the card shows the sequential steps it charged");
}
{ // not affordable: nothing is charged and nothing moves
  const r = await run("TBE: Advancement", { xp: 3, system: { pattern: "spellweaver" },
    items: [strandItem("Air", 3)], answers: [{ act: "strand", strand: "Air", strandSteps: "2" }] });
  check(r.itemUpdates.length === 0, "an unaffordable Strand raise changes nothing");
  check(/Not enough XP/.test(r.chat.join(" ")), "and says what it would have cost");
}
{ /* p.124: "a Fade's Strands can never be developed past 7." */
  const r = await run("TBE: Advancement", { xp: 99, system: { pattern: "fade" },
    items: [strandItem("Fire", 6)], answers: [{ act: "strand", strand: "Fire", strandSteps: "3" }] });
  const upd = r.itemUpdates.find((u) => u._id === "Fire");
  check(upd && upd["system.level"] === 7, "a Fade's Strand is held at 7", upd);
  check(/never be developed past 7/i.test(r.chat.join(" ")), "and the card says why");
}
{ /* p.124: "for each point a Strand is raised above 10, the Spellweaver
     gains 1 Fraying." Max Resolve 10 here, so the new total is instantly in
     Fraying Roll territory and the roll must actually happen. */
  const r = await run("TBE: Advancement", { xp: 99, d100: 95,
    system: { pattern: "spellweaver", fraying: 10, resolve: { value: 10, max: 10 } },
    items: [strandItem("Spheres", 10)], answers: [{ act: "strand", strand: "Spheres", strandSteps: "2" }] });
  const upd = r.itemUpdates.find((u) => u._id === "Spheres");
  check(upd && upd["system.level"] === 12, "a Spellweaver may pass 10", upd);
  const spent = r.updates.find((u) => "system.experience.available" in u);
  check(spent && spent["system.experience.available"] === 76, "10 -> 12 costs 11 + 12 = 23 XP", spent);
  const fray = r.updates.filter((u) => "system.fraying" in u);
  check(fray.length === 2 && fray[fray.length - 1]["system.fraying"] === 12,
    "two points above 10 add 2 Fraying, one improvement at a time", fray);
  /* p.308: "Anytime a Spellweaver gains a point of Fraying... they must
     immediately make a Fraying Roll." Two sequential improvements are two
     gains, so two rolls at 2% then 4% -- not one roll at 4%, which is what a
     single roll at the final total would be. */
  const rollCount = (r.chat.join(" ").match(/<b>Fraying Roll<\/b>: 1d100/g) || []).length;
  check(rollCount === 2, "and each point demands its own Fraying Roll, not one at the final total", rollCount);
  check(/holds together/i.test(r.chat.join(" ")), "a d100 of 95 against those risks survives");
}
{ /* A single Weave Reaction that inflicts several points is ONE gain, so it
     is one roll -- the book's own example gains 6 at once and rolls once. */
  const r = await run("TBE: Advancement", { xp: 99, d100: 95,
    system: { pattern: "spellweaver", fraying: 10, resolve: { value: 10, max: 10 } },
    items: [], answers: [{ act: "fraying", frayAmt: "6", frayWhy: "Weave Reaction" }] });
  const rollCount = (r.chat.join(" ").match(/<b>Fraying Roll<\/b>: 1d100/g) || []).length;
  check(rollCount === 1, "6 Fraying from one Weave Reaction is one gain and one roll", rollCount);
  const fray = r.updates.find((u) => "system.fraying" in u);
  check(fray && fray["system.fraying"] === 16, "at the new total of 16", fray);
}
{ // the same raise with a bad roll removes the character from reality
  const r = await run("TBE: Advancement", { xp: 99, d100: 2,
    system: { pattern: "spellweaver", fraying: 10, resolve: { value: 10, max: 10 } },
    items: [strandItem("Spheres", 10)], answers: [{ act: "strand", strand: "Spheres", strandSteps: "2" }] });
  check(/purged from the Tapestry/i.test(r.chat.join(" ")),
    "1d100 at or under (Fraying - Max Resolve) x 2 purges the caster (p.308)");
  check(/Final Act/.test(r.chat.join(" ")), "and the book's Final Act is offered rather than a bare death");
}
{ // Fraying below Max Resolve makes no roll at all
  const r = await run("TBE: Advancement", { xp: 99, d100: 1,
    system: { pattern: "spellweaver", fraying: 0, resolve: { value: 20, max: 20 } },
    items: [], answers: [{ act: "fraying", frayAmt: "3", frayWhy: "Weave Reaction 20" }] });
  const fray = r.updates.find((u) => "system.fraying" in u);
  check(fray && fray["system.fraying"] === 3, "recorded Fraying reaches the actor", fray);
  check(!/<b>Fraying Roll<\/b>: 1d100/.test(r.chat.join(" ")),
    "no Fraying Roll is actually made while the total is under Max Resolve");
  check(/17 point\(s\) of room/.test(r.chat.join(" ")), "and it says how much room is left");
}
{ /* p.124: the Strand Secret Talent, 5 XP, or 10 for a Thin Strand. */
  const r = await run("TBE: Advancement", { xp: 20, system: { pattern: "spellweaver" },
    items: [], answers: [{ act: "newstrand", newstrand: "Fire" }] });
  const made = r.created.find((c) => c.type === "strand");
  check(made && made.system.level === 1, "a new Strand opens at level 1", made && made.system);
  check(r.created.some((c) => c.type === "talent" && /Strand Secret/.test(c.name)),
    "and the Strand Secret Talent is recorded on the sheet, not just charged for");
  const spent = r.updates.find((u) => "system.experience.available" in u);
  check(spent && spent["system.experience.available"] === 15, "it costs 5 XP", spent);
}
{
  const r = await run("TBE: Advancement", { xp: 20, system: { pattern: "spellweaver" },
    items: [], answers: [{ act: "newstrand", newstrand: "Fire", newthin: "on" }] });
  const spent = r.updates.find((u) => "system.experience.available" in u);
  check(spent && spent["system.experience.available"] === 10, "a Thin Strand costs 10 XP instead", spent);
}
{ // a non-caster is not offered any of it
  const r = await run("TBE: Advancement", { xp: 20, items: [skillItem("Dodge", "Combat", 40)], answers: [null] });
  check(!/Raise a Strand/.test(r.prompts[0] || ""),
    "a character with no Pattern is not offered Strand advancement at all");
  const caster = await run("TBE: Advancement", { xp: 20, system: { pattern: "spellweaver" },
    items: [strandItem("Air", 3)], answers: [null] });
  check(/Raise a Strand/.test(caster.prompts[0] || ""), "a Spellweaver is");
  check(/next level 4 XP/.test(caster.prompts[0] || ""),
    "and the picker prints what the next level costs before anything is spent");
}
{ // expertise eligibility is visible before submitting
  const r = await run("TBE: Advancement", { xp: 20, items: [skillItem("Dodge", "Combat", 35)], answers: [null] });
  check(/no Ex below 40/.test(r.prompts[0] || ""), "the skill picker shows Expertise eligibility up front, not after Go");
}

{ /* Chargen names Binds "Bind: Control". Typing the bare name here used to
     slip past the duplicate check and create a SECOND Bind Item at 10 beside
     the one already on the sheet -- the Magic tab then showed one under
     Binds and the other as a stray custom slot. */
  const r = await run("TBE: Advancement", { xp: 20, system: { pattern: "spellweaver" },
    items: [skillItem("Bind: Control", "Bind", 0)],
    answers: [{ act: "newskill", newtype: "bind", newname: "Control", newgroup: "Wise" }] });
  check(r.created.length === 0, "buying a Bind the sheet already has does not create a second one",
    r.created.map((c) => c.name));
  check(/already has Bind: Control at 0/.test(r.chat.join(" ")),
    "and it says which one it found, and at what value", r.chat.join(" ").slice(0, 200));
  check(/cannot be cast with/.test(r.chat.join(" ")),
    "including that a Bind at 0 is unusable, which is why it looked absent");
}
{ // a genuinely new Bind is named the way the rest of the system names them
  const r = await run("TBE: Advancement", { xp: 20, system: { pattern: "spellweaver" },
    items: [talentItem("Patterned In The Weave")],
    answers: [{ act: "newskill", newtype: "bind", newname: "Witness", newgroup: "Wise" }] });
  check(r.created.length === 1 && r.created[0].name === "Bind: Witness",
    "a new Bind is created as \"Bind: Witness\", so the Magic tab lists it under the right name",
    r.created.map((c) => c.name));
}

console.log("== Ch.5 racial rules that used to be prose only ==");
const armorItem = (name) => ({ id: name, name, type: "armor", system: { bulk: 4, equipped: true, ap: 4 } });
{ /* p.83: "They do not wear the reinforced leather, mail, scale, or plate
     armor of Men... If an Ogre wears such armor, they do so untrained and
     suffer -20 to all Willpower rolls." */
  const r = await run("TBE: Skill Roll", { race: "Ogre", items: [armorItem("Mail"), skillItem("Willpower", "Adventuring", 45)],
    answers: [{ skill: "45", mod: "0", extra: "0", label: "Willpower", favor: "0" }], d100: 50 });
  check(/target <b>25<\/b>/.test(r.chat.join(" ")),
    "an Ogre in Mail rolls Willpower at 45 - 20 = 25, applied automatically",
    (r.chat.join(" ").match(/target <b>\d+<\/b>/) || [""])[0]);
  check(/untrained armor \(Mail\)/.test(r.chat.join(" ")), "and the card says where the -20 came from");
  const other = await run("TBE: Skill Roll", { race: "Ogre", items: [armorItem("Mail"), skillItem("Stealth", "Adventuring", 45)],
    answers: [{ skill: "45", mod: "0", extra: "0", label: "Stealth", favor: "0" }], d100: 50 });
  check(/target <b>45<\/b>/.test(other.chat.join(" ")), "the penalty is Willpower-specific, not a blanket -20");
  const bone = await run("TBE: Skill Roll", { race: "Ogre", items: [armorItem("Bone"), skillItem("Willpower", "Adventuring", 45)],
    answers: [{ skill: "45", mod: "0", extra: "0", label: "Willpower", favor: "0" }], d100: 50 });
  check(/target <b>45<\/b>/.test(bone.chat.join(" ")), "Bone armor, which an Ogre may make and wear, carries no penalty");
  const human = await run("TBE: Skill Roll", { race: "Human", items: [armorItem("Mail"), skillItem("Willpower", "Adventuring", 45)],
    answers: [{ skill: "45", mod: "0", extra: "0", label: "Willpower", favor: "0" }], d100: 50 });
  check(/target <b>45<\/b>/.test(human.chat.join(" ")), "and it is an Ogre rule, not everyone's");
}
{ /* p.24: "You can spend Resolve as Favor (+10 per Resolve to a skill roll)...
     up to 3 Favor may be used on any one skill roll from any source." The
     macro had no way to spend Resolve at all before v0.15.0. */
  const r = await run("TBE: Skill Roll", { items: [skillItem("Stealth", "Adventuring", 40)],
    system: { resolve: { value: 5, max: 10 } },
    answers: [{ skill: "40", mod: "0", extra: "0", label: "Stealth", favor: "2" }], d100: 50 });
  check(/target <b>60<\/b>/.test(r.chat.join(" ")), "2 Resolve as Favor is +20 on the roll",
    (r.chat.join(" ").match(/target <b>\d+<\/b>/) || [""])[0]);
  const spent = r.updates.find((u) => "system.resolve.value" in u);
  check(spent && spent["system.resolve.value"] === 3, "and those 2 Resolve leave the sheet", spent);
  const over = await run("TBE: Skill Roll", { items: [skillItem("Stealth", "Adventuring", 40)],
    system: { resolve: { value: 9, max: 10 } },
    answers: [{ skill: "40", mod: "0", extra: "0", label: "Stealth", favor: "9" }], d100: 50 });
  check(/target <b>70<\/b>/.test(over.chat.join(" ")), "Favor is capped at 3 from any source, so 9 cannot be spent");
}
{ /* p.83: "If an Ogre critically fails a skill roll for which they used any
     amount of Resolve, they experience the Breaking." A d100 of 100 is a
     critical failure at any skill under 100. */
  const r = await run("TBE: Skill Roll", { race: "Ogre", items: [skillItem("Athletics", "Adventuring", 40)],
    system: { resolve: { value: 5, max: 10 } },
    answers: [{ skill: "40", mod: "0", extra: "0", label: "Athletics", favor: "1" }], d100: 100 });
  check(/The Breaking/.test(r.chat.join(" ")), "an Ogre critically failing a Resolve-boosted roll triggers the Breaking");
  check(r.statuses.includes("tbe-breaking"), "and it lands as a real status on the token, not a line of prose", r.statuses);
  const noResolve = await run("TBE: Skill Roll", { race: "Ogre", items: [skillItem("Athletics", "Adventuring", 40)],
    answers: [{ skill: "40", mod: "0", extra: "0", label: "Athletics", favor: "0" }], d100: 100 });
  check(!/The Breaking/.test(noResolve.chat.join(" ")), "a critical failure with no Resolve spent does not trigger it");
  const notOgre = await run("TBE: Skill Roll", { race: "Human", items: [skillItem("Athletics", "Adventuring", 40)],
    system: { resolve: { value: 5, max: 10 } },
    answers: [{ skill: "40", mod: "0", extra: "0", label: "Athletics", favor: "1" }], d100: 100 });
  check(!/The Breaking/.test(notOgre.chat.join(" ")), "and it is an Ogre rule");
}

await browser.close();
fs.rmSync("_e.html", { force: true });
console.log("\n" + (fails ? fails + " FAILURE(S)" : "ALL ENFORCEMENT CHECKS PASSED"));
process.exit(fails ? 1 : 0);
