/* TBE: Use Enchanted Item (Ch.14 p.322-326) — spending what TBE: Enchant made.
 *
 * Three different things wear out three different ways, and an unstable one
 * wears out faster, which is the whole point of the flaw:
 *   - a Use Die item rolls its die after each use and goes inert for 1-6 days
 *     on a 1 or 2 (on a 1-4 if unstable);
 *   - a charged item spends one charge and is non-magical at zero; an unstable
 *     one rolls a d10 after use and burns 1d4 more charges on a 1-2;
 *   - a single-use item is spent forever; an unstable one rolls BEFORE use and
 *     on a 1-2 unravels harmlessly, having done nothing;
 *   - a potion dose is drunk; an unstable batch rolls a d10 per dose and on a
 *     1-2 collapses, taking every remaining dose with it, including that one.
 *
 * The "before" in the single-use case is the book's own emphasis and it
 * matters: the roll decides whether the spell happens at all.
 */

const MAGIC = (typeof TBE_MAGIC !== "undefined" && TBE_MAGIC) || {};
const ENCH = MAGIC.enchant || {};
const ALCH = MAGIC.alchemy || {};
const esc = (x) => String(x == null ? "" : x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const q = (o, k) => (o && o[k] && o[k].q) || "";

const me = TBE.me();
const items = TBE.enchantments(me);

if (!items.length) {
  ui.notifications?.warn("TBE: no enchanted items or potions on this sheet. TBE: Enchant makes them.");
} else {
  const opts = items.map((e) => {
    const ready = TBE.enchantReady(e);
    const what = e.kind === "die" ? e.die + " Use Die"
      : e.kind === "potion" ? e.charges + " dose(s)"
      : e.kind === "single" ? "single use"
      : e.charges + " / " + e.chargesMax + " charges";
    return '<option value="' + e.id + '">' + esc(e.name) + " — " + what +
      (e.unstable ? ", unstable" : "") + (ready.ok ? "" : " — " + esc(ready.why)) + "</option>";
  }).join("");

  const arcanaValue = TBE.num((me?.items ?? []).find((i) => i.type === "skill" && /^arcana$/i.test(i.name || ""))?.system?.value, 0);

  const content =
    '<div style="font-size:13px">' +
    '<label style="display:block">Item: <select name="id" style="width:100%">' + opts + "</select></label>" +
    '<label style="display:block">Action: <select name="act" style="width:100%">' +
    '<option value="use">Use it</option>' +
    '<option value="days">Days pass (an inert item recovers)</option>' +
    "</select></label>" +
    '<label style="display:block">Days that pass: <input type="number" name="days" value="1" style="width:100%"></label>' +
    '<label style="display:block">Arcana, if a Spellweaver is recognising it (' + arcanaValue + " on this sheet): " +
    '<input type="number" name="arcana" value="' + arcanaValue + '" style="width:100%"></label>' +
    '<div style="font-size:11px;opacity:.8">' + esc(q(ENCH, "weaverOnly")) + "</div>" +
    '<div style="font-size:11px;opacity:.8">' + esc(q(ENCH, "itemIsCaster")) + ".</div>" +
    "</div>";

  const data = await TBE.prompt("TBE Use Enchanted Item", content, "Go");
  if (data) {
    const rolls = [];
    const e = items.find((x) => x.id === data.id) || items[0];
    let body = "";
    if (data.act === "days") body = await passDays(e, data);
    else body = await use(e, data, rolls);
    if (body) await TBE.say(TBE.card("TBE Enchanted Item", body), rolls);
  }
}

async function passDays(e, d) {
  const days = Math.max(1, TBE.num(d.days, 1));
  if (e.inertDays <= 0) return "<div><b>" + esc(e.name) + "</b> is not inert; nothing to wait out.</div>";
  const left = Math.max(0, e.inertDays - days);
  try { await e.item.update({ "system.inertDays": left }); } catch (err) { console.warn("TBE | could not update inertness", err); }
  return "<div><b>" + esc(e.name) + "</b>: " + days + " day(s) pass. " +
    (left ? left + " day(s) of inertness left." : "<b style='color:#1f7a1f'>It wakes, and can be used again.</b>") + "</div>";
}

async function use(e, d, rolls) {
  const ready = TBE.enchantReady(e);
  if (!ready.ok) return "<div><b>" + esc(e.name) + "</b> cannot be used: " + esc(ready.why) + ".</div>";

  let body = "<div><b>" + esc(e.name) + "</b>" + (e.spell ? " &mdash; " + esc(e.spell) : "") + "</div>";

  /* "only those who can manipulate the Weave (a Spellweaver or Fade) can use
   * the enchanted item. They can recognize and use the item after a successful
   * Arcana roll." An item made usable by anyone skips this entirely. */
  if (!e.anyoneCanUse) {
    const pattern = TBE.pattern(me);
    if (pattern === "none") {
      return body + "<div style='color:#8b1a1a'>" + esc(me?.name || "This character") + " is not Patterned, and this item " +
        "has no activation word. " + esc(q(ENCH, "weaverOnly")) + "</div>";
    }
    const ar = await TBE.rollAttempt(TBE.num(d.arcana, 0), 0);
    rolls.push(ar.roll);
    body += "<div>Arcana (" + TBE.num(d.arcana, 0) + "): " + TBE.face(ar.roll.total) + " &rarr; <b>" + TBE.tag(ar.r) + "</b></div>";
    if (!ar.r.success) {
      return body + "<div>The item's workings do not open to them this time. Nothing is spent.</div>";
    }
  } else if (e.activationWord) {
    body += "<div style='font-size:11px;opacity:.85'>Activated by its word: &ldquo;" + esc(e.activationWord) + "&rdquo;.</div>";
  }

  /* An unstable single-use item is decided BEFORE it is used. */
  if (e.kind === "single" && e.unstable) {
    const r = await new Roll("1d10").evaluate();
    rolls.push(r);
    if (r.total <= 2) {
      try { await e.item.update({ "system.charges": 0, "system.spent": true }); }
      catch (err) { console.warn("TBE | could not spend the item", err); }
      return body + "<div>Unstable, checked before use: d10 <b>" + r.total + "</b>.</div>" +
        "<div style='font-weight:bold;color:#8b1a1a'>The stored magic unravels harmlessly. The spell does not take " +
        "effect, and the item cannot be used again.</div>";
    }
    body += "<div>Unstable, checked before use: d10 <b>" + r.total + "</b> &mdash; it holds.</div>";
  }

  body += "<div style='color:#1f7a1f'>The spell takes effect" +
    (e.resistance ? ", resisted only by meeting or beating <b>" + e.resistance + "</b>" : "") + ".</div>";

  if (e.kind === "die") {
    const r = await new Roll("1" + e.die).evaluate();
    rolls.push(r);
    const threshold = e.unstable ? 4 : 2;
    body += "<div>" + e.die + " Use Die: <b>" + r.total + "</b> vs " + threshold +
      (e.unstable ? " <span style='font-size:11px;opacity:.8'>(unstable: inert on 1-4, not 1-2)</span>" : "") + "</div>";
    if (r.total <= threshold) {
      const days = await new Roll("1d6").evaluate();
      rolls.push(days);
      try { await e.item.update({ "system.inertDays": days.total }); }
      catch (err) { console.warn("TBE | could not set inertness", err); }
      body += "<div style='color:#8b1a1a'>It goes inert for <b>" + days.total + "</b> day(s).</div>";
    } else {
      body += "<div style='font-size:11px;opacity:.85'>It remains ready.</div>";
    }
    return body;
  }

  if (e.kind === "single") {
    try { await e.item.update({ "system.charges": 0, "system.spent": true }); }
    catch (err) { console.warn("TBE | could not spend the item", err); }
    return body + "<div style='color:#8b1a1a'>Spent. This vessel can never again serve as a vessel for magic.</div>";
  }

  /* Charges and potion doses both draw down; what differs is what an unstable
   * one does afterwards. */
  let left = e.charges - 1;
  let extra = "";
  if (e.kind === "potion") {
    if (e.unstable) {
      const r = await new Roll("1d10").evaluate();
      rolls.push(r);
      body += "<div>Unstable batch: d10 <b>" + r.total + "</b>.</div>";
      if (r.total <= 2) {
        try { await e.item.update({ "system.charges": 0, "system.spent": true }); }
        catch (err) { console.warn("TBE | could not collapse the batch", err); }
        return body + "<div style='font-weight:bold;color:#8b1a1a'>The mixture collapses. Every remaining dose from " +
          "this batch &mdash; including the one just taken &mdash; is rendered ineffective.</div>";
      }
    }
    extra = "<div>" + left + " dose(s) left.</div>";
  } else {
    if (e.unstable) {
      const r = await new Roll("1d10").evaluate();
      rolls.push(r);
      body += "<div>Unstable item: d10 <b>" + r.total + "</b>.</div>";
      if (r.total <= 2) {
        const burn = await new Roll("1d4").evaluate();
        rolls.push(burn);
        const before = left;
        left = Math.max(0, left - burn.total);
        body += "<div style='color:#8b1a1a'>It burns out, losing <b>" + burn.total + "</b> more charge(s): " +
          before + " &rarr; " + left + ".</div>";
      }
    }
    extra = left > 0
      ? "<div>" + left + " charge(s) left.</div>"
      : "<div style='font-weight:bold;color:#8b1a1a'>The final charge is expended: the item is non-magical now.</div>";
  }

  try { await e.item.update({ "system.charges": left, "system.spent": left <= 0 }); }
  catch (err) { console.warn("TBE | could not spend a charge", err); }
  return body + extra;
}
