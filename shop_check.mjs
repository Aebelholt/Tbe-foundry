#!/usr/bin/env node
/*
 * shop_check.mjs -- buying equipment after creation (module/chargen/shop.mjs,
 * v0.53.0), the "Buy equipment" link on the sheet's Gear tab.
 *
 * This took over from TBE: Finish Character's Equip tab when that tool
 * retired, and so did the assertions finish_check.mjs made about it: the
 * price comes off the silver, a bought piece of armour carries the book's AP
 * and Bulk and covers one location, a weapon can be bought in quantity, an
 * unaffordable item is refused with the silver untouched, a free starting
 * piece (p.109) costs nothing and counts down, an untrained heavy armour is
 * refused as a free piece but can still be bought, and the free button goes
 * once the pieces are used up. Section 2 drives the real dialog in headless
 * Chromium behind test-fixtures/appv2_shim.js (a stand-in, not Foundry).
 *
 * The rest of finish_check.mjs retired with the tool it tested: Talents are
 * TBE: Talents' (enforcement_check.mjs), naming slots and Shared History are
 * the Create Character window's (creator_check.mjs), Goals are the sheet's
 * Add Goal, and Status is a sheet field.
 */
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SYS = path.join(__dirname, "system", "the-broken-empires");
let pass = 0, fail = 0;
const check = (cond, label, extra) => {
  if (cond) { pass++; console.log("  PASS  " + label); }
  else { fail++; console.log("  FAIL  " + label + (extra !== undefined ? "  <- " + JSON.stringify(extra).slice(0, 400) : "")); }
};
const imp = (f) => import(pathToFileURL(path.join(SYS, f)).href);
const { TABLES } = await imp("module/chargen/tables.mjs");
const SHOP = await imp("module/chargen/shop.mjs");
const T = TABLES;
const sp = (kind, name) => (kind === "armor" ? T.equipment.armor : kind === "shield" ? T.equipment.shields : T.equipment.weapons).find((x) => x.name === name).sp;

console.log("\n1. What a purchase does (planPurchase)");
{
  const v = { silver: 400, freeArmor: 2, race: "Human", talents: [] };
  const leather = SHOP.planPurchase(v, { kind: "armor", name: "Leather", loc: "body" }, T);
  const it = leather.items?.[0];
  check(leather.ok && leather.silverAfter === 400 - sp("armor", "Leather"), "armour: the price comes off the silver (Leather " + sp("armor", "Leather") + ")");
  check(it && it.type === "armor" && it.system.ap === 3 && it.system.bulk === 2, "and the piece carries the book's AP 3 and Bulk 2", it?.system);
  check(it && Object.entries(it.system.locations).filter(([, on]) => on).map(([k]) => k).join() === "body" && /\(Body\)$/.test(it.name), "and covers the one location chosen");
  const bow = SHOP.planPurchase(v, { kind: "weapon", name: "Longbow", qty: 1 }, T);
  check(bow.ok && bow.items[0].system.ranged === true && bow.silverAfter === 400 - sp("weapon", "Longbow"), "a weapon keeps its stats (Longbow is ranged) and its price");
  const jav = SHOP.planPurchase(v, { kind: "weapon", name: "Javelin", qty: 4 }, T);
  check(jav.ok && jav.items.length === 4 && jav.cost === 4 * sp("weapon", "Javelin"), "four Javelins: four Items, four prices");
  const plate = SHOP.planPurchase(v, { kind: "armor", name: "Plate", loc: "body" }, T);
  check(!plate.ok && /500 sp/.test(plate.notice), "Plate (500 sp) with 400 sp is refused, and the sentence says why", plate.notice);
  const q = SHOP.planPurchase(v, { kind: "armor", name: "Quilt", loc: "rLeg", free: true }, T);
  check(q.ok && q.cost === 0 && q.silverAfter === 400 && q.freeAfter === 1, "a free Quilt costs nothing and the count goes 2 -> 1 (p.109)");
  const mailFree = SHOP.planPurchase(v, { kind: "armor", name: "Mail", loc: "body", free: true }, T);
  check(!mailFree.ok && /Armor Training/.test(mailFree.notice), "untrained, Mail cannot be a free piece, and it says why");
  check(SHOP.planPurchase(v, { kind: "armor", name: "Mail", loc: "body" }, T).ok, "but it can still be bought");
  const trained = Object.assign({}, v, { talents: [{ name: "Armor Training (I-IV)", ranks: 2 }] });
  check(SHOP.planPurchase(trained, { kind: "armor", name: "Mail", loc: "body", free: true }, T).ok &&
    !SHOP.planPurchase(trained, { kind: "armor", name: "Scale", loc: "body", free: true }, T).ok, "Armor Training II covers Mail free, not Scale");
  check(!SHOP.planPurchase(Object.assign({}, v, { freeArmor: 0 }), { kind: "armor", name: "Quilt", loc: "body", free: true }, T).ok, "no free pieces left: refused");
  check(!SHOP.planPurchase(v, { kind: "weapon", name: "Dagger", free: true }, T).ok, "only armour comes free");
}

console.log("\n2. The real dialog, in headless Chromium");
let chromium = null;
try { ({ chromium } = await import("playwright")); } catch (e) { chromium = null; }
if (!chromium) check(false, "playwright is installed");
else {
  const shim = fs.readFileSync(path.join(__dirname, "test-fixtures", "appv2_shim.js"), "utf8");
  const server = http.createServer((req, res) => {
    const u = decodeURIComponent(req.url.split("?")[0]);
    if (u === "/") {
      res.writeHead(200, { "content-type": "text/html" });
      res.end('<!doctype html><html><head><meta charset="utf-8"><script>' + shim + "</script></head><body>" +
        '<script type="module">import("/module/chargen/shop.mjs").then((m)=>{window.SHOP=m;window.READY=true;}).catch((e)=>{window.LOADERR=String(e.stack||e)});</script></body></html>');
      return;
    }
    if (u === "/favicon.ico") { res.writeHead(204); res.end(); return; }
    const f = path.join(SYS, u);
    if (!f.startsWith(SYS) || !fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "content-type": "text/javascript" });
    res.end(fs.readFileSync(f));
  });
  await new Promise((r) => server.listen(0, r));
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto("http://127.0.0.1:" + server.address().port + "/");
  await page.waitForFunction(() => window.READY || window.LOADERR, null, { timeout: 15000 });
  check(!(await page.evaluate(() => window.LOADERR)), "shop.mjs loads in a browser", await page.evaluate(() => window.LOADERR));
  await page.evaluate(() => {
    const a = window.ACTOR;
    a.system = { silver: 400, race: "Human", armorBulk: 0, armorInitPenalty: 0 };
    a.flags = { "the-broken-empires": { freeArmor: 1 } };
    a.items = [];
    a.createEmbeddedDocuments = async (t, arr) => { window.LOG.push(["create", arr.map((x) => x.name)]); a.items.push(...arr); return arr; };
    a.update = async (u) => {
      window.LOG.push(["update", u]);
      if ("system.silver" in u) a.system.silver = u["system.silver"];
      if ("flags.the-broken-empires.freeArmor" in u) a.flags["the-broken-empires"].freeArmor = u["flags.the-broken-empires.freeArmor"];
    };
    return window.SHOP.openShop(a);
  });
  await page.waitForSelector(".tbe-shop");
  check(/400 sp/.test(await page.textContent(".tbe-shop")) && /1 free armour piece/.test(await page.textContent(".tbe-shop")), "the dialog shows the silver and the free pieces left");
  await page.selectOption('select[data-shop="kind"]', "armor");
  await page.selectOption('select[data-shop="name"]', "Leather");
  await page.click('[data-shop-act="buy"]'); await page.waitForTimeout(60);
  let silver = await page.evaluate(() => window.ACTOR.system.silver);
  check(silver === 400 - sp("armor", "Leather"), "Buy: the Item is made and the silver goes down", silver);
  await page.selectOption('select[data-shop="kind"]', "armor");
  await page.selectOption('select[data-shop="name"]', "Mail");
  await page.click('[data-shop-act="free"]'); await page.waitForTimeout(60);
  check(await page.evaluate(() => window.NOTES.some((n) => /Armor Training/.test(n))), "an untrained free Mail is refused with a sentence");
  await page.selectOption('select[data-shop="name"]', "Quilt");
  await page.click('[data-shop-act="free"]'); await page.waitForTimeout(60);
  check(await page.evaluate(() => window.ACTOR.flags["the-broken-empires"].freeArmor === 0 && window.ACTOR.system.silver) === silver, "a free Quilt: silver unchanged, the count goes to 0");
  await page.selectOption('select[data-shop="kind"]', "armor");
  check(await page.locator('[data-shop-act="free"]').count() === 0, "and the free button is gone once the pieces are used up");
  await page.selectOption('select[data-shop="kind"]', "armor");
  await page.selectOption('select[data-shop="name"]', "Plate");
  const before = await page.evaluate(() => window.LOG.length);
  await page.click('[data-shop-act="buy"]'); await page.waitForTimeout(60);
  check(await page.evaluate((b) => window.LOG.slice(b).every((x) => x[0] !== "create" && x[0] !== "update"), before), "an unaffordable Plate writes nothing at all");
  await page.evaluate(() => { window.ACTOR.testUserPermission = () => false; window.ACTOR.isOwner = false; return window.SHOP.openShop(window.ACTOR); });
  check(await page.evaluate(() => window.NOTES.some((n) => /do not own/.test(n))), "a player who does not own the actor is told so and can buy nothing");
  check(!errors.length, "no page or console errors", errors.slice(0, 3));
  await browser.close();
  server.close();
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
