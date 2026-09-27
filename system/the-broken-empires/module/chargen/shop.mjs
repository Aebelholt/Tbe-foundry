/* Buying equipment after creation (v0.53.0), from the sheet's Gear tab.
 *
 * This was TBE: Finish Character's Equip tab, which retired with it. The
 * character creation window already shops during creation (step 9); this is
 * the same thing for later: buy with the silver on the sheet, and claim any
 * free starting armour pieces (p.109) not taken at creation.
 *
 * planPurchase() decides, and is pure: what would be bought, what it costs,
 * whether it is allowed. The items it makes are commit.mjs's gearItem(), the
 * same shape the window writes, and "may this armour be a free piece" is
 * rules.mjs's armorAllowedFree(), the same answer the window gives.
 */
import { gearItem } from "./commit.mjs";
import { armorAllowedFree } from "./rules.mjs";
import { tables, say } from "./creator.mjs";
import * as permission from "../rules/permission.mjs";

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const SCOPE = "the-broken-empires";
const LOCS = [["head", "Head"], ["body", "Body"], ["rArm", "R Arm"], ["lArm", "L Arm"], ["rLeg", "R Leg"], ["lLeg", "L Leg"]];

/**
 * @param view  { silver, freeArmor, race, talents: [{name, ranks}] }
 * @param pick  { kind: weapon|shield|armor, name, loc, qty, free }
 * @returns { ok, notice, items, cost, silverAfter, freeAfter }
 */
export function planPurchase(view, pick, T) {
  const kind = pick.kind || "weapon";
  const list = kind === "armor" ? T.equipment.armor : kind === "shield" ? T.equipment.shields : T.equipment.weapons;
  const row = list.find((x) => x.name === pick.name);
  if (!row) return { ok: false, notice: "Choose an item first." };
  const free = !!pick.free;
  if (free) {
    if (kind !== "armor") return { ok: false, notice: "Only armour comes free (p.109)." };
    if (num(view.freeArmor) <= 0) return { ok: false, notice: "No free armour pieces left to claim." };
    if (!armorAllowedFree(row, view.talents, view.race)) return { ok: false, notice: row.name + " needs Armor Training, so it cannot be a free piece (p.109)." };
  }
  const qty = free || kind === "armor" ? 1 : Math.max(1, Math.min(20, num(pick.qty, 1)));
  const cost = free ? 0 : row.sp * qty;
  if (cost > num(view.silver)) return { ok: false, notice: qty + " × " + row.name + " costs " + cost + " sp; there is " + num(view.silver) + " sp." };
  const one = gearItem(row, pick.loc || "body");
  return { ok: true, notice: null, items: Array.from({ length: qty }, () => JSON.parse(JSON.stringify(one))), cost,
    silverAfter: num(view.silver) - cost, freeAfter: free ? num(view.freeArmor) - 1 : num(view.freeArmor), row, qty, free };
}

export function viewOf(actor) {
  return {
    silver: num(actor.system?.silver), race: actor.system?.race || "",
    freeArmor: num(actor.flags?.[SCOPE]?.freeArmor),
    talents: Array.from(actor.items ?? []).filter((i) => i.type === "talent").map((i) => ({ name: i.name, ranks: num(i.system?.ranks, 1) }))
  };
}

export async function openShop(actor) {
  if (!actor) return;
  if (!permission.canWrite(actor, game.user)) {
    ui.notifications?.warn("TBE: you do not own " + actor.name + ", so nothing can be bought for them here.");
    return;
  }
  const T = await tables();
  const state = { kind: "weapon", name: "", loc: "body", qty: 1 };
  const body = () => {
    const v = viewOf(actor);
    const list = state.kind === "armor" ? T.equipment.armor : state.kind === "shield" ? T.equipment.shields : T.equipment.weapons;
    const row = list.find((x) => x.name === state.name);
    const canFree = state.kind === "armor" && v.freeArmor > 0;
    return '<div class="tbe-shop"><p><b>' + v.silver + " sp</b>" + (v.freeArmor ? " &middot; " + v.freeArmor + " free armour piece(s) to claim (p.109)" : "") +
      " &middot; armour Bulk " + num(actor.system?.armorBulk) + ", Initiative &minus;" + num(actor.system?.armorInitPenalty) + "</p>" +
      '<div class="tbe-cc-row"><select data-shop="kind">' + ["weapon", "shield", "armor"].map((k) => '<option value="' + k + '"' + (state.kind === k ? " selected" : "") + ">" + k + "</option>").join("") + "</select>" +
      '<select data-shop="name"><option value="">(item)</option>' + list.map((x) => '<option value="' + esc(x.name) + '"' + (x.name === state.name ? " selected" : "") + ">" + esc(x.name) + " (" + x.sp + " sp)</option>").join("") + "</select>" +
      (state.kind === "armor" ? '<select data-shop="loc">' + LOCS.map(([k, l]) => '<option value="' + k + '"' + (state.loc === k ? " selected" : "") + ">" + l + "</option>").join("") + "</select>"
        : '<input type="number" min="1" max="20" data-shop="qty" value="' + num(state.qty, 1) + '" style="width:48px">') + "</div>" +
      (row ? '<p class="tbe-cc-hint">' + esc([row.skillName, row.ap !== null && row.ap !== undefined ? "AP " + row.ap : "", row.bulk ? "Bulk " + row.bulk : "", row.enc !== null && row.enc !== undefined ? "ENC " + row.enc : "", row.notes].filter(Boolean).join(" · ")) + "</p>" : "") +
      '<div class="tbe-cc-row"><button type="button" data-shop-act="buy"' + (row ? "" : " disabled") + ">Buy" +
      (row ? " for " + row.sp * (state.kind === "armor" ? 1 : num(state.qty, 1)) + " sp" : "") + "</button>" +
      (canFree ? '<button type="button" data-shop-act="free"' + (row ? "" : " disabled") + ">Take as a free piece</button>" : "") + "</div></div>";
  };
  const act = async (free) => {
    const plan = planPurchase(viewOf(actor), Object.assign({}, state, { free }), T);
    if (!plan.ok) { ui.notifications?.warn("TBE: " + plan.notice); return; }
    /* Permission was asked when the shop opened; ask again, since ownership
       can change while it is open. Items first, then the silver, so a failed
       item creation never charges for nothing. */
    if (!permission.canWrite(actor, game.user)) { ui.notifications?.warn("TBE: you no longer own " + actor.name + "."); return; }
    await actor.createEmbeddedDocuments("Item", plan.items);
    const changes = plan.free ? { ["flags." + SCOPE + ".freeArmor"]: plan.freeAfter } : { "system.silver": plan.silverAfter };
    const res = await permission.applyWrite(actor, changes, { what: plan.free ? "The free piece" : "The purchase" });
    if (!res.ok) { ui.notifications?.warn("TBE: " + res.notice); return; }
    await say("Equipment", "<div><b>" + esc(actor.name) + "</b> " + (plan.free ? "takes <b>" + esc(plan.items[0].name) + "</b> as a free starting piece (" + plan.freeAfter + " left)."
      : "buys " + (plan.qty > 1 ? plan.qty + " × " : "") + "<b>" + esc(plan.row.name) + "</b> for " + plan.cost + " sp (" + plan.silverAfter + " left).") + "</div>", []);
  };
  const DV2 = foundry.applications?.api?.DialogV2;
  if (!DV2) { ui.notifications?.warn("TBE: buying equipment needs Foundry v12 or later."); return; }
  const dlg = new DV2({ window: { title: "Buy equipment: " + actor.name }, position: { width: 480 }, content: '<div class="tbe-shop-host">' + body() + "</div>",
    buttons: [{ action: "close", label: "Close", default: true }] });
  await dlg.render(true);
  const host = () => dlg.element.querySelector(".tbe-shop-host");
  dlg.element.addEventListener("change", (ev) => {
    const k = ev.target.dataset?.shop;
    if (!k) return;
    state[k] = ev.target.value;
    if (k === "kind") state.name = "";
    host().innerHTML = body();
  });
  dlg.element.addEventListener("click", async (ev) => {
    const b = ev.target.closest("[data-shop-act]");
    if (!b || b.disabled) return;
    ev.preventDefault(); ev.stopPropagation();
    b.disabled = true;
    try { await act(b.dataset.shopAct === "free"); }
    catch (err) { console.error("TBE | purchase failed", err); ui.notifications?.error("TBE: the purchase failed (" + (err?.message || err) + ")."); }
    host().innerHTML = body();
  });
}
