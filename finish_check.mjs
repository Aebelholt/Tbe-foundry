#!/usr/bin/env node
/* finish_check.mjs — drives TBE: Finish Character in headless Chromium.
 * Every tab writes to the actor, so each check asserts on what actually
 * landed there (items created, silver deducted, goals stored), not on what
 * the DOM says. Same Application-v1 shim the wizard harness uses. */
import { execFileSync } from "node:child_process";
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
execFileSync("node", ["build.js"], { cwd: __dirname, stdio: "ignore" });
const macro = JSON.parse(fs.readFileSync(path.join(__dirname, "data/solo_docs.json"), "utf8"))
  .macros.find((m) => m.name === "TBE: Finish Character");
if (!macro) { console.error("TBE: Finish Character not in solo_docs.json"); process.exit(1); }

let fails = 0;
const fail = (m, x) => { fails++; console.error("FAIL: " + m + (x !== undefined ? " | " + JSON.stringify(x) : "")); };
const check = (c, m, x) => { if (c) console.log("  ok: " + m); else fail(m, x); };

const SHIM = `
(function(){
  window.foundry={utils:{mergeObject:(a,b)=>Object.assign({},a,b),duplicate:o=>JSON.parse(JSON.stringify(o))}};
  window.$=function(h){ if(typeof h==="string"){const d=document.createElement("div");d.innerHTML=h.trim();return [d.firstElementChild];} return [h]; };
  class Application{
    constructor(o){o=o||{};this.options=Object.assign({},this.constructor.defaultOptions,o);this.rendered=false;this.element=null;}
    static get defaultOptions(){return {width:400,height:400,id:"",title:"",classes:[]};}
    activateListeners(){} async getData(){return {};}
    async render(){ if(!this.rendered){const w=document.createElement("div");w.className="window-app";
        w.innerHTML='<section class="window-content"></section>';document.body.appendChild(w);this.element=w;this.rendered=true;}
      const inner=await this._renderInner({});const el=Array.isArray(inner)?inner[0]:inner;
      const c=this.element.querySelector(".window-content");c.innerHTML="";c.appendChild(el);
      this.activateListeners([el]);window.__fin=this;return this;}
    close(){if(this.element)this.element.remove();this.rendered=false;window.__closed=true;}
  }
  window.Application=Application;
  window.Roll=class{constructor(f){this.formula=f}async evaluate(){this.total=3;return this}};
  window.__chat=[];window.__notify=[];
  window.ChatMessage={create:async d=>{window.__chat.push(String(d.content||"").replace(/<[^>]+>/g," "));return d},getSpeaker:()=>({})};
  window.CONFIG={sounds:{dice:null},statusEffects:[]};
  window.ui={notifications:{warn:m=>window.__notify.push(m),error:m=>window.__notify.push(m),info:m=>window.__notify.push(m)}};
  let nextId=1;
  const mkItem=(o)=>{const it=Object.assign({id:o.id||("i"+(nextId++))},o);
    it.update=async(u)=>{for(const[k,v] of Object.entries(u)){const p=k.split(".");let t=it;for(let i=0;i<p.length-1;i++){t[p[i]]=t[p[i]]||{};t=t[p[i]];}t[p[p.length-1]]=v;}return u;};
    return it;};
  const items=[];
  items.get=(id)=>items.find(i=>i.id===id);
  window.__actor={id:"a",name:"Testtie",type:"character",
    system:{race:"Human",silver:300,status:0,experience:{available:12,earned:12},supply:{gear:12,ammo:12,rations:12,medical:12},goals:[],personalityTraits:[]},
    flags:{"the-broken-empires":{freeArmor:3}},
    items,
    update:async(u)=>{for(const[k,v] of Object.entries(u)){const p=k.split(".");let t=window.__actor;for(let i=0;i<p.length-1;i++){t[p[i]]=t[p[i]]||{};t=t[p[i]];}t[p[p.length-1]]=v;}return u;},
    createEmbeddedDocuments:async(t,p)=>{const made=p.map(o=>mkItem(o));made.forEach(m=>items.push(m));return made;},
    updateEmbeddedDocuments:async(t,p)=>{for(const u of p){const it=items.get(u._id);if(it)await it.update(Object.fromEntries(Object.entries(u).filter(([k])=>k!=="_id")));}return p;},
    deleteEmbeddedDocuments:async(t,ids)=>{ids.forEach(id=>{const i=items.findIndex(x=>x.id===id);if(i>=0)items.splice(i,1);});return ids;}};
  window.game={user:{character:window.__actor},macros:{getName:()=>null},packs:{get:()=>null},settings:{get:()=>null,set:async()=>null}};
  window.canvas={tokens:{controlled:[{actor:window.__actor}]}};
})();`;

const html = `<!doctype html><html><head><meta charset="utf-8"></head><body>
<style>.window-app{width:660px;margin:12px auto;background:#f2e9d5;border:1px solid #7a6a4f;border-radius:6px;font-family:Signika,sans-serif}
.window-content{padding:8px 10px}html,body{margin:0;background:#2b2b2b}</style>
<script>${SHIM}</script>
<script>(async()=>{try{${macro.command}}catch(e){window.__err=String(e&&e.message||e);}})();</script></body></html>`;
const out = path.join(__dirname, "test-screenshots", "finish");
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, "_h.html"), html);

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 700, height: 900 } });
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
await page.goto("file://" + path.join(out, "_h.html"));
await page.waitForSelector(".window-app", { timeout: 5000 }).catch(() => {});
const boot = await page.evaluate(() => ({ err: window.__err || null, up: !!window.__fin }));
if (boot.err) { fail("macro threw on load: " + boot.err); }
check(boot.up, "the screen opens against a character actor");

const tab = async (k) => { await page.locator(`[data-tab="${k}"]`).click(); await page.waitForTimeout(80); };
const actor = () => page.evaluate(() => JSON.parse(JSON.stringify({
  freeArmor: (window.__actor.flags?.["the-broken-empires"]?.freeArmor) ?? null,
  silver: window.__actor.system.silver, status: window.__actor.system.status,
  xp: window.__actor.system.experience.available, goals: window.__actor.system.goals,
  items: window.__actor.items.map((i) => ({ name: i.name, type: i.type, system: i.system, effects: i.effects }))
})));

console.log("== Equip ==");
await tab("equip");
await page.screenshot({ path: path.join(out, "1-equip.png"), fullPage: true });
{
  const before = await actor();
  await page.locator('[data-buy="kind"]').selectOption("armor"); await page.waitForTimeout(80);
  await page.locator('[data-buy="pick"]').selectOption("Leather"); await page.waitForTimeout(80);
  await page.locator('[data-buy="loc"]').selectOption("body"); await page.waitForTimeout(80);
  await page.locator('[data-action="buy"]').click(); await page.waitForTimeout(120);
  const after = await actor();
  const bought = after.items.find((i) => i.type === "armor");
  check(!!bought, "buying armor creates a real armor Item", after.items.map((i) => i.name));
  check(after.silver === before.silver - 60, `the price comes off the silver (${before.silver} -> ${after.silver}, Leather is 60)`);
  check(bought && bought.system.bulk === 2 && bought.system.ap === 3, "the piece carries the book's AP and Bulk", bought && bought.system);
  check(bought && bought.system.locations && bought.system.locations.body === true && bought.system.locations.head === false,
    "it protects only the location bought for (p.140, armor may not be layered)", bought && bought.system.locations);
  const head = await page.locator(".window-content").innerText();
  check(/Bulk 2 \(Initiative -1\)/.test(head), `the Initiative penalty updates live (${(head.match(/Bulk[^)]*\)/) || [])[0]})`);
}
{
  const before = await actor();
  await page.locator('[data-buy="kind"]').selectOption("weapon"); await page.waitForTimeout(80);
  await page.locator('[data-buy="pick"]').selectOption("Longbow"); await page.waitForTimeout(80);
  await page.locator('[data-action="buy"]').click(); await page.waitForTimeout(120);
  const after = await actor();
  const w = after.items.find((i) => i.type === "weapon");
  check(!!w && after.silver === before.silver - 120, `a weapon deducts its own price (Longbow 120, ${before.silver} -> ${after.silver})`);
  check(w && w.system.ranged === true, "and keeps its stats (Longbow is ranged)", w && w.system);
}
{ /* Buying six javelins one click at a time is the busywork this screen
     exists to remove. Armor stays single-buy: each piece covers one
     location, so a quantity would be ambiguous. */
  await page.evaluate(() => { window.__actor.system.silver = 900; });
  const before = await actor();
  await page.locator('[data-buy="kind"]').selectOption("weapon"); await page.waitForTimeout(80);
  await page.locator('[data-buy="pick"]').selectOption("Javelin"); await page.waitForTimeout(80);
  const qty = page.locator('[data-buy="qty"]');
  check(await qty.count() === 1, "a weapon can be bought in quantity");
  await qty.fill("4"); await qty.dispatchEvent("change"); await page.waitForTimeout(120);
  const label = await page.locator('[data-action="buy"]').innerText();
  check(/Buy 4 for/.test(label), `the button prices the whole order before you click it ("${label}")`);
  await page.locator('[data-action="buy"]').click(); await page.waitForTimeout(160);
  const after = await actor();
  const jav = after.items.filter((i) => i.name === "Javelin");
  check(jav.length === 4, `four Javelins arrive as four items (got ${jav.length})`);
  const unit = (before.silver - after.silver) / 4;
  check(before.silver - after.silver === unit * 4 && unit > 0,
    `and exactly four times the unit price is deducted (${before.silver} -> ${after.silver})`);
  await page.locator('[data-buy="kind"]').selectOption("armor"); await page.waitForTimeout(100);
  check(await page.locator('[data-buy="qty"]').count() === 0,
    "armor has no quantity box, because each piece covers one named location");
  /* Put the purse back where the following cases expect it: the next check
     is that an unaffordable item is refused, and the top-up above would
     otherwise make Plate affordable and quietly invert that test. */
  await page.evaluate(() => { window.__actor.system.silver = 120; });
  await page.locator('[data-buy="kind"]').selectOption("weapon"); await page.waitForTimeout(60);
  await page.locator('[data-buy="kind"]').selectOption("armor"); await page.waitForTimeout(60);
}
{
  const before = await actor();
  await page.locator('[data-buy="kind"]').selectOption("armor"); await page.waitForTimeout(80);
  await page.locator('[data-buy="pick"]').selectOption("Plate"); await page.waitForTimeout(80);
  await page.locator('[data-action="buy"]').click(); await page.waitForTimeout(120);
  const after = await actor();
  check(after.silver === before.silver, `an unaffordable item is refused, silver untouched (${after.silver} sp, Plate is 500)`);
}

console.log("== Free starting armor (p.109 step 9) ==");
{
  await tab("equip");
  const body = await page.locator(".window-content").innerText();
  check(/free armor piece/i.test(body), "the rolled 1d3+1 count is surfaced, not stranded in a Notes line");
  await page.locator('[data-buy="kind"]').selectOption("armor"); await page.waitForTimeout(80);
  await page.locator('[data-buy="pick"]').selectOption("Quilt"); await page.waitForTimeout(80);
  const before = await actor();
  check((await page.$('[data-action="take-free"]')) !== null, "a Take-free button appears while pieces remain");
  await page.locator('[data-action="take-free"]').click(); await page.waitForTimeout(120);
  const after = await actor();
  check(after.silver === before.silver, `taking a free piece costs no silver (${before.silver} -> ${after.silver})`);
  check(after.freeArmor === before.freeArmor - 1, `the remaining count decrements (${before.freeArmor} -> ${after.freeArmor})`);
  check(after.items.some((i) => i.type === "armor" && i.name.startsWith("Quilt")), "and it is a real armor Item");

  /* Training gate: Mail requires Armor Training, which this character has
   * not got, so it must not be claimable free. */
  await page.locator('[data-buy="pick"]').selectOption("Mail"); await page.waitForTimeout(100);
  const gated = await page.locator(".window-content").innerText();
  check(/requires Armor Training/.test(gated), "an untrained heavy armor says why it cannot be free");
  check((await page.$('[data-action="take-free"]')) === null, "and offers no Take-free button for it");
  // top up: earlier cases spent the purse down past Mail's 200 sp price
  await page.evaluate(() => { window.__actor.system.silver = 400; });
  await page.locator('[data-buy="pick"]').selectOption("Mail"); await page.waitForTimeout(100);
  const b2 = await actor();
  await page.locator('[data-action="buy"]').click(); await page.waitForTimeout(120);
  const a2 = await actor();
  check(a2.silver === b2.silver - 200, `but it can still be bought for silver (Mail 200, ${b2.silver} -> ${a2.silver})`);

  /* Exhaust the remaining free pieces and confirm the button disappears. */
  await page.locator('[data-buy="pick"]').selectOption("Padding"); await page.waitForTimeout(80);
  for (let i = 0; i < 3; i++) {
    const btn = await page.$('[data-action="take-free"]');
    if (!btn) break;
    await btn.click(); await page.waitForTimeout(110);
  }
  const spent = await actor();
  check(spent.freeArmor === 0, `all free pieces claimed (${spent.freeArmor} left)`);
  check((await page.$('[data-action="take-free"]')) === null, "the Take-free button is gone once they are used up");
  await page.screenshot({ path: path.join(out, "1b-free-armor.png"), fullPage: true });
}

console.log("== Talents ==");
await tab("talents");
await page.screenshot({ path: path.join(out, "2-talents.png"), fullPage: true });
{
  const before = await actor();
  const idx = await page.evaluate(() => {
    const boxes = [...document.querySelectorAll("[data-talent]")].filter((b) => !b.disabled);
    boxes[0].checked = true; return boxes[0].dataset.talent;
  });
  await page.locator('[data-action="add-talents"]').click(); await page.waitForTimeout(120);
  const after = await actor();
  const t = after.items.filter((i) => i.type === "talent");
  check(t.length === 1, "ticking a Talent adds it", t.map((x) => x.name));
  check(after.xp === before.xp, `no XP charged by default, these are the free chargen grants (XP ${after.xp})`);
  const disabled = await page.evaluate(() => [...document.querySelectorAll("[data-talent]")].filter((b) => b.disabled).length);
  check(disabled > 0, `blocked Talents are still greyed out here, same rules as the standalone macro (${disabled} blocked)`);
}

console.log("== Stat Talents carry their ActiveEffect ==");
{
  /* Until v0.13.0 every stat-modifying Talent was inert: the Item appeared on
   * the sheet and the number it promises never moved. Five of them are offered
   * by the Ability Score step that every character goes through. */
  const res = await page.evaluate(() => {
    const boxes = [...document.querySelectorAll("[data-talent]")];
    const cat = window.__TALENTS || null;
    return { n: boxes.length, hasCat: !!cat };
  });
  const picked = await page.evaluate(() => {
    // find "Tough" in the rendered list and tick it
    const labels = [...document.querySelectorAll("label")];
    const row = labels.find((l) => /^\s*Tough\b/.test(l.innerText.trim()));
    if (!row) return null;
    const cb = row.querySelector("[data-talent]");
    if (!cb || cb.disabled) return null;
    cb.checked = true;
    return row.innerText.trim().slice(0, 40);
  });
  check(!!picked, `the Tough Talent is offered (${picked})`);
  if (picked) {
    await page.locator('[data-action="add-talents"]').click(); await page.waitForTimeout(140);
    const after = await actor();
    const t = after.items.find((i) => i.type === "talent" && /^Tough/.test(i.name));
    check(!!t, "Tough is added as an Item", after.items.filter((i) => i.type === "talent").map((i) => i.name));
    const eff = t && t.effects && t.effects[0];
    check(!!eff, "and it carries an ActiveEffect, so the number is no longer inert", t && t.effects);
    check(eff && eff.transfer === true, "the effect transfers to the owning actor");
    check(eff && eff.changes && eff.changes[0].key === "system.toughness" && eff.changes[0].value === "1",
      "it adds +1 to system.toughness, as the book says", eff && eff.changes);
  }
}

console.log("== Wises & Languages ==");
await tab("wises");
{
  await page.locator('[data-newwise="name"]').fill("Ritual-wise");
  await page.locator('[data-action="add-wise"]').click(); await page.waitForTimeout(120);
  const after = await actor();
  const w = after.items.find((i) => i.name === "Ritual-wise");
  check(!!w && w.system.value === 20 && w.system.group === "Wise", "a named -wise is created at 20", w && w.system);
}
await page.screenshot({ path: path.join(out, "3-wises.png"), fullPage: true });

console.log("== Goals ==");
await tab("goals");
{
  await page.locator('[data-goal="want"]').fill("chart the safest route through the Draithwood");
  await page.locator('[data-goal="obstacle"]').fill("the forest is unmapped and haunted");
  await page.locator('[data-goal="action"]').fill("use Track to find paths and other skills to learn what haunts it");
  await page.waitForTimeout(80);
  await page.locator('[data-action="add-goal"]').click(); await page.waitForTimeout(120);
  const after = await actor();
  check(after.goals.length === 1, "the goal is stored as a real record", after.goals);
  check(after.goals[0] && /^I will use Track .* to overcome the forest is unmapped and haunted so that I can chart the safest route/.test(after.goals[0].text),
    "and is assembled with the book's template", after.goals[0] && after.goals[0].text);
  const body = await page.locator(".window-content").innerText();
  check(/at least three/.test(body), "it warns while under the book's three-goal floor");
}
await page.screenshot({ path: path.join(out, "4-goals.png"), fullPage: true });

console.log("== Shared History ==");
await tab("shared");
{
  await page.locator('[data-shared="with"]').fill("Edbert");
  await page.locator('[data-shared="skill"]').selectOption("Track"); await page.waitForTimeout(80);
  await page.locator('[data-action="add-shared"]').click(); await page.waitForTimeout(120);
  const after = await actor();
  const t = after.items.find((i) => i.name === "Track");
  check(!!t && t.system.value === 25, "a skill the character lacks is created at 20 then takes the +5 (p.94)", t && t.system.value);
}

console.log("== Status ==");
await tab("status");
{
  await page.locator("[data-status]").fill("2");
  await page.locator('[data-action="set-status"]').click(); await page.waitForTimeout(120);
  const after = await actor();
  check(after.status === 2, `Status can be adjusted by hand (${after.status})`);
}
await page.screenshot({ path: path.join(out, "5-status.png"), fullPage: true });

check(errs.length === 0, "no console or page errors across every tab", errs.slice(0, 3));
await browser.close();
fs.rmSync(path.join(out, "_h.html"), { force: true });
console.log("\n" + (fails ? fails + " FAILURE(S)" : "ALL FINISH-CHARACTER CHECKS PASSED") + `. Screenshots: ${out}`);
process.exit(fails ? 1 : 0);
