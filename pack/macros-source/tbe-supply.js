/* TBE: Supply — Gear, Ammo, Medical and Rations dice (Ch.9). d12-d10-d8-d6, then out. */

const me = TBE.me();
if (!me) {
  ui.notifications?.warn("TBE: select your token first.");
} else {
  const s = TBE.supply(me);
  const show = (k) => (s[k] ? "d" + s[k] : "exhausted");
  const opt = (k, label) => '<option value="' + k + '">' + label + " (" + show(k) + ")</option>";

  const data = await TBE.prompt(
    "Supply",
    '<div style="font-size:13px">' +
    "<div><b>" + me.name + "</b></div>" +
    '<div style="margin:4px 0">Gear ' + show("gear") + " &middot; Ammo " + show("ammo") +
    " &middot; Medical " + show("medical") + " &middot; Rations " + show("rations") + "</div>" +
    '<label style="display:block">Supply: <select name="key" style="width:100%">' +
    opt("gear", "Gear") + opt("ammo", "Ammo") + opt("medical", "Medical") + opt("rations", "Rations") +
    "</select></label>" +
    '<label style="display:block">Action: <select name="act" style="width:100%">' +
    '<option value="use" selected>Use it and roll for depletion</option>' +
    '<option value="down">Step it down (an event says so)</option>' +
    '<option value="up">Replenish one step</option>' +
    '<option value="set">Set it to a value</option>' +
    "</select></label>" +
    '<label style="display:block">Set to: <select name="val" style="width:100%">' +
    "<option value='12'>d12</option><option value='10'>d10</option><option value='8' selected>d8</option>" +
    "<option value='6'>d6</option><option value='0'>exhausted</option></select></label>" +
    "</div>",
    "Go"
  );

  if (data) {
    const key = data.key || "gear";
    const rolls = [];
    let body = "";
    if (data.act === "use") {
      const r = await TBE.rollSupply(me, key);
      if (r.roll) rolls.push(r.roll);
      body = "<div>" + r.text + "</div>";
      if (r.depleted) body += "<div><b>" + key + " has run out.</b> Replenish it in a settlement before relying on it again.</div>";
    } else {
      const cur = TBE.num(s[key], 8);
      let next = cur;
      if (data.act === "down") next = cur <= 6 ? 0 : TBE.SUPPLY_STEPS[TBE.SUPPLY_STEPS.indexOf(cur) - 1] ?? 6;
      else if (data.act === "up") next = cur === 0 ? 6 : Math.min(12, TBE.SUPPLY_STEPS[TBE.SUPPLY_STEPS.indexOf(cur) + 1] ?? 12);
      else next = TBE.num(data.val, 8);
      s[key] = next;
      await TBE.setSupply(me, s);
      body = "<div>" + key + " is now <b>" + (next ? "d" + next : "exhausted") + "</b>.</div>";
    }
    const now = TBE.supply(me);
    body += '<div style="font-size:11px;opacity:.8;margin-top:4px">Gear ' + (now.gear ? "d" + now.gear : "out") +
      " &middot; Ammo " + (now.ammo ? "d" + now.ammo : "out") +
      " &middot; Medical " + (now.medical ? "d" + now.medical : "out") +
      " &middot; Rations " + (now.rations ? "d" + now.rations : "out") + "</div>";
    await TBE.say(TBE.card("Supply &mdash; " + me.name, body), rolls);
  }
}
