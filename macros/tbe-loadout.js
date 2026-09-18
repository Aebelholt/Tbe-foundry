/* TBE: Loadout — mid-combat gear state, in one place, without opening a sheet.
 *
 * Modelled on the TOR2e Loadout macro Seb runs at his own table, adapted to
 * TBE's rules and data model. What was taken from it, deliberately: a hotbar
 * panel rather than sheet rows (mid-combat state should not live somewhere you
 * have to open a character sheet to reach); one row per item with the states as
 * buttons; a load total that EXCLUDES what is on the floor, said out loud in the
 * footer; a chat line so the table sees the change without opening anything; and
 * an ownership refusal at the top that names the actor.
 *
 * What was NOT taken: TOR2e models state as two booleans (`equipped` +
 * `dropped`), which can encode "equipped AND dropped". TBE has a single
 * `carried` enum, which cannot. Grip switching (1H/2H twins) has no TBE
 * equivalent and is not reproduced.
 *
 * WHAT THIS DOES NOT DO, on purpose (Seb's call, 2026-09-17, "state + costs
 * shown, not enforced"): it does not track whose turn it is, does not count
 * actions, and does not stop you doing three things in a round. TBE gives one
 * action per round ("Failing an action still counts as having taken your action
 * for the round", Ch.10 p.153), and this panel's job is to put the book's price
 * where the person deciding can see it, then get out of the way. Same instinct
 * as TBE.RIDERS: print the number, let the human apply it.
 *
 * Also out of scope by the same call: the Stored -> in hand retrieval flow, which
 * the book prices at "2 full actions... You may use the item on your third
 * action" (p.159) and therefore spans three rounds. Setting an item to Stored
 * here is a bookkeeping change, not a claim that you retrieved it this turn, and
 * the panel says so rather than implying the transition was free.
 */

const me = TBE.me();
if (!me) {
  ui.notifications?.warn("TBE: select a token, or assign yourself a character, first.");
} else if (!me.isOwner) {
  /* Refuse with a sentence naming the actor, before doing anything -- the
     unowned case is a message, not a silent no-op (CLAUDE.md rule 6). */
  ui.notifications?.warn("TBE: you do not own " + me.name + ", so their loadout cannot be changed here.");
} else {

  const GEAR_TYPES = ["weapon", "shield"];
  const STATES = ["ready", "hand", "stored", "dropped"];
  const COL = { ready: "#5C8A78", hand: "#6b6250", stored: "#7a7168", dropped: "#9A4423" };

  const gearItems = () => me.items.filter((i) => GEAR_TYPES.includes(i.type));
  const stateOf = (i) => (STATES.includes(i.system?.carried) ? i.system.carried : "hand");
  const encOf = (i) => TBE.num(i.system?.enc, 0);

  /* The two pools, and the floor. Asks the owner rather than testing
     `!== "stored"`, which is what made a dropped weapon weigh against the
     6 ENC Weapons At Hand pool before v0.35.0. */
  const poolTotals = () => {
    const t = { hand: 0, inventory: 0, none: 0 };
    for (const i of gearItems()) t[TBE.carryPool(stateOf(i))] += encOf(i);
    return t;
  };

  /* ---------- chat ---------- */
  const verb = (item, from, to) => {
    const n = item.name;
    if (to === "dropped") return "drops the " + n;
    if (from === "dropped") return "picks up the " + n;
    if (to === "ready") return "takes up the " + n;
    if (to === "stored") return "stows the " + n;
    if (from === "ready" && to === "hand") return "sheathes the " + n;
    return "shifts the " + n + " to " + TBE.READINESS[to].label;
  };

  /* The book's price for the transition that just happened. Stated, never
     charged -- nothing here knows or cares whether you had an action left. */
  const price = (from, to) => {
    if (to === "dropped") return "free action";
    if (from === "dropped") return "a Minor Action, or an Athletics roll if Engaged (-10 per extra foe)";
    if (from === "ready" && to === "hand") return "a Minor Action to sheathe";
    if (to === "ready" && from === "hand") return "a Minor Action to draw, up to two at-hand weapons on the one action";
    if (to === "stored" || from === "stored") return "2 full actions to retrieve from Inventory, usable on the third";
    return TBE.READINESS[to].cost;
  };

  async function announce(changes) {
    if (!changes.length) return;
    const lines = changes.map((c) =>
      "<div>" + me.name + " " + verb(c.item, c.from, c.to) + "." +
      '<span style="opacity:.7;font-size:11px"> &mdash; ' + price(c.from, c.to) + "</span></div>");
    const totals = poolTotals();
    const body = lines.join("") +
      '<div style="font-size:11px;opacity:.8;margin-top:4px">Weapons At Hand <b>' + totals.hand +
      "</b> ENC &middot; Stored <b>" + totals.inventory + "</b> ENC" +
      (totals.none ? " &middot; on the ground <b>" + totals.none + "</b> ENC, carried by nobody" : "") + "</div>";
    /* No mode passed: follows the user's own roll-mode dropdown, like any
       ordinary card. Visibility has one owner (module/rules/visibility.mjs). */
    await TBE.say(TBE.card("TBE Loadout", body));
  }

  /* ---------- write ---------- */
  async function setState(ids, to) {
    const changes = [];
    const updates = [];
    for (const id of ids) {
      const item = me.items.get(id);
      if (!item) continue;
      const from = stateOf(item);
      if (from === to) continue;
      updates.push({ _id: id, "system.carried": to });
      changes.push({ item, from, to });
    }
    if (!updates.length) return false;
    try {
      await me.updateEmbeddedDocuments("Item", updates);
    } catch (err) {
      console.warn("TBE | loadout write failed", err);
      ui.notifications?.warn("TBE: could not change " + me.name + "'s loadout. Nothing was altered.");
      return false;
    }
    await announce(changes);
    return true;
  }

  /* ---------- markup ---------- */
  function body() {
    const items = gearItems().sort((a, b) =>
      (a.type === b.type ? a.name.localeCompare(b.name) : (a.type === "weapon" ? -1 : 1)));
    if (!items.length) {
      return '<p style="opacity:.7">No weapons or shields on this character.</p>';
    }

    const totals = poolTotals();
    const enc = TBE.encStatus(me);
    let html = "";
    let section = null;

    for (const i of items) {
      if (i.type !== section) {
        section = i.type;
        html += '<div style="font:600 10px/1 system-ui;letter-spacing:.12em;text-transform:uppercase;' +
          'opacity:.55;margin:12px 0 5px">' + (section === "weapon" ? "Weapons" : "Shields") + "</div>";
      }
      const st = stateOf(i);
      const down = st === "dropped";
      const btn = (key) =>
        '<button type="button" data-id="' + i.id + '" data-state="' + key + '"' +
        ' title="' + TBE.READINESS[key].label + " &mdash; " + TBE.READINESS[key].cost + '"' +
        ' style="border:1px solid ' + (st === key ? COL[key] : "#00000026") + ";background:" +
        (st === key ? COL[key] : "transparent") + ";color:" + (st === key ? "#fff" : "inherit") +
        ';border-radius:4px;padding:2px 8px;font-size:11px;cursor:pointer;min-width:0;line-height:1.5">' +
        TBE.READINESS[key].short + "</button>";

      html += '<div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid #00000012">' +
        '<img src="' + i.img + '" width="24" height="24" style="border:0;border-radius:3px;flex:0 0 auto;opacity:' +
        (down ? ".4" : "1") + '">' +
        '<span style="flex:1;min-width:0;font-size:13px;' +
        (down ? "opacity:.45;text-decoration:line-through" : "") + '">' + i.name +
        (encOf(i) ? '<span style="opacity:.5;font-size:11px"> &middot; ' + encOf(i) + " ENC</span>" : "") +
        "</span>" +
        '<span style="display:inline-flex;gap:3px;flex:0 0 auto">' + STATES.map(btn).join("") + "</span></div>";
    }

    /* The footer is the answer to "removing load when not explicitly carried":
       the floor total is shown separately and is in neither pool. */
    html += '<div style="margin-top:10px;font-size:11px;opacity:.75">' +
      "Weapons At Hand <b>" + totals.hand + "</b> / " + TBE.num(enc?.handMax, 6) + " ENC" +
      " &middot; Stored <b>" + totals.inventory + "</b> ENC" +
      (totals.none ? ' &middot; <span style="color:#9A4423">on the ground <b>' + totals.none +
        "</b> ENC, counted against neither pool</span>" : "") + "</div>" +
      '<div style="margin-top:6px;font-size:11px;opacity:.6">Costs are shown, never charged: TBE gives one action ' +
      "a round (p.153) and this panel does not track whose turn it is. Setting something Stored is bookkeeping, " +
      "not a retrieval &mdash; that is 2 actions, usable on the third (p.159).</div>";
    return html;
  }

  /* ---------- dialog ---------- */
  const DialogCls = foundry?.applications?.api?.DialogV2 ?? null;

  if (DialogCls) {
    const dlg = new DialogCls({
      window: { title: "Loadout — " + me.name },
      position: { width: 460 },
      content: '<div id="tbe-loadout">' + body() + "</div>",
      buttons: [{ action: "close", label: "Close", default: true }]
    });
    await dlg.render(true);
    dlg.element.addEventListener("click", async (ev) => {
      const b = ev.target.closest("button[data-state]");
      if (!b) return;
      ev.preventDefault();
      ev.stopPropagation();
      await setState([b.dataset.id], b.dataset.state);
      const host = dlg.element.querySelector("#tbe-loadout");
      if (host) host.innerHTML = body();
    });
  } else {
    /* Foundry without DialogV2. Rather than silently doing nothing, say what is
       missing and still let the state be changed through the item sheets. */
    ui.notifications?.warn("TBE: Loadout needs DialogV2 (Foundry v12+). Set readiness on each item's sheet instead.");
  }
}
