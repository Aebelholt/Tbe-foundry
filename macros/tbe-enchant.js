/* TBE: Enchant (Ch.14 p.322-326) — making things: an enchanted item, a batch
 * of alchemical potions, or a day's search for Weave Reagents.
 *
 * The spell being stored is priced in TBE: Cast, as always; what this macro
 * owns is what enchanting and brewing cost and produce. The two are one art
 * in the book — "Alchemy is a simplified form of enchantment" — so they share
 * a window, a reagent economy, and one Item type.
 *
 * The differences the book insists on, and this enforces:
 *   - an enchantment accrues Fraying by its tier; alchemy accrues none;
 *   - an enchantment needs a masterwork item and a full day of preparation;
 *     a potion needs a lab, reagents, and eight hours;
 *   - Resolve is allowed on an enchanting roll and forbidden on a brewing one;
 *   - a potion can only hold a spell whose Range AND Target are Self;
 *   - a Weave Reaction on either makes the result unstable, and unstable
 *     things fail differently, which TBE: Use Enchanted Item then applies.
 */

const MAGIC = (typeof TBE_MAGIC !== "undefined" && TBE_MAGIC) || {};
const ENCH = MAGIC.enchant || {};
const ALCH = MAGIC.alchemy || {};
const REAG = MAGIC.reagents || {};
const REACTIONS = MAGIC.weaveReactions || [];
const DETAIL = MAGIC.weaveReactionDetail || [];
const esc = (x) => String(x == null ? "" : x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const q = (o, k) => (o && o[k] && o[k].q) || "";

const me = TBE.me();
const binds = TBE.binds(me);
const strands = TBE.strands(me);
const bindOpts = binds.map((b) => '<option value="' + b.id + '">' + esc(b.name) + " (" + b.effective + ")</option>").join("");
const strandOpts = strands.map((s) => '<option value="' + s.id + '">' + esc(s.name) + " (" + s.level + ")</option>").join("");
const allReagents = TBE.reagents(me);
const reagentLine = allReagents.length
  ? allReagents.map((r) => esc(r.strand || "unattuned") + " ×" + r.count).join(", ")
  : "none on this sheet";

const tierOpts = TBE.ENCHANT_COSTS.map((r) =>
  '<option value="' + r.key + '"' + (r.key === "d8" ? " selected" : "") + ">" + esc(r.label) +
  " — " + r.fraying + " Fraying</option>").join("");
const aidOpts = TBE.ALCHEMY_AIDS.map((a) =>
  '<label style="display:block;font-size:12px"><input type="checkbox" name="aid_' + a.key + '"> ' +
  esc(a.name) + " (+" + a.bind + " Bind" + (a.craft ? ", +" + a.craft + " Craft" : "") +
  (a.days > 1 ? ", " + a.days + " days" : "") + ")</label>").join("");

const content =
  '<div style="font-size:13px">' +
  '<div style="font-size:11px;opacity:.85">Weave Reagents held: <b>' + reagentLine + "</b></div><hr>" +
  '<label style="display:block">What are you making? <select name="mode" style="width:100%">' +
  '<option value="enchant">An enchanted item (p.322)</option>' +
  '<option value="brew">A batch of potions (p.325)</option>' +
  '<option value="reagents">Searching for Weave Reagents (p.324)</option>' +
  "</select></label>" +

  "<hr><b>Common</b>" +
  '<label style="display:block">Name: <input type="text" name="name" value="" placeholder="Cloak of the Unseen / Fortified Flesh" style="width:100%"></label>' +
  '<label style="display:block">The stored spell, as TBE: Cast priced it: ' +
  '<input type="text" name="spell" value="" placeholder="Change Body: +3 Toughness, 1 hour" style="width:100%"></label>' +
  '<label style="display:block">Its Total Cost: <input type="number" name="tc" value="15" style="width:100%"></label>' +
  (bindOpts ? '<label style="display:block">Bind: <select name="bindId" style="width:100%">' + bindOpts + "</select></label>" : "") +
  (strandOpts ? '<label style="display:block">Strand: <select name="strandId" style="width:100%">' + strandOpts + "</select></label>" : "") +
  '<label style="display:block">Modifier to the casting roll: <input type="number" name="mod" value="0" style="width:100%"></label>' +

  "<hr><b>Enchanting</b>" +
  '<label style="display:block">Tier: <select name="tier" style="width:100%">' + tierOpts + "</select></label>" +
  '<label style="display:block">Give it a: <select name="shape" style="width:100%">' +
  '<option value="die">Use Die (risks going inert)</option>' +
  '<option value="charges">Charge pool (a fixed number of guaranteed uses)</option>' +
  "</select></label>" +
  '<div style="font-size:11px;opacity:.8">' + esc(q(ENCH, "caps")) + "</div>" +
  '<label style="display:block;font-size:12px"><input type="checkbox" name="anyone"> Usable by <b>anyone</b>, not only a ' +
  "Spellweaver or Fade (+1 Fraying, and it needs an activation word)</label>" +
  '<label style="display:block">Activation word: <input type="text" name="word" value="" style="width:100%"></label>' +
  '<label style="display:block;font-size:12px"><input type="checkbox" name="useReagents"> Spend <b>Weave Reagents</b> instead ' +
  "of taking the Fraying (one per point, of the spell’s own Strand)</label>" +
  '<div style="font-size:11px;opacity:.8">' + esc(q(REAG, "substitution")) + "</div>" +
  '<div style="font-size:11px;opacity:.8">' + esc(q(ENCH, "masterwork")) + ". " + esc(q(ENCH, "prepDays")) + "</div>" +

  "<hr><b>Brewing</b>" +
  '<div style="font-size:11px;opacity:.8">' + esc(q(ALCH, "selfOnly")) + " " + esc(q(ALCH, "noResolve")) + "</div>" +
  aidOpts +
  '<label style="display:block">Craft: Practical for the yield roll: <input type="number" name="craft" value="45" style="width:100%"></label>' +

  "<hr><b>Searching for reagents</b>" +
  '<label style="display:block">Arcana: <input type="number" name="arcana" value="' +
  TBE.num((me?.items ?? []).find((i) => i.type === "skill" && /^arcana$/i.test(i.name || ""))?.system?.value, 0) +
  '" style="width:100%"></label>' +
  '<label style="display:block">Strand of this place or creature: <input type="text" name="foundStrand" value="" placeholder="Earth" style="width:100%"></label>' +
  '<div style="font-size:11px;opacity:.8">' + esc(q(REAG, "whereFound")) + " " + esc(q(REAG, "findingTime")) + "</div>" +
  "</div>";

const data = await TBE.prompt("TBE Enchant", content, "Go");
if (data) {
  const rolls = [];
  let body = "";
  if (data.mode === "reagents") body = await findReagents(data, rolls);
  else if (data.mode === "brew") body = await brew(data, rolls);
  else body = await enchant(data, rolls);
  if (body) await TBE.say(TBE.card("TBE Enchant", body), rolls);
}

/* Both makings roll the same way: a Bind roll, and any Weave Reaction that
 * follows makes the result unstable rather than being suffered and forgotten.
 * Shared so the two cannot drift apart on what counts as uncontrolled. */
async function castInto(bind, strand, against, tc, rolls) {
  const { roll, r } = await TBE.rollAttempt(against, bind?.expertise || 0);
  rolls.push(roll);
  const ones = (roll.total % 10) === 0 ? 10 : roll.total % 10;
  const mastery = r.success ? ones + (strand ? strand.level : 0) : 0;
  const wrm = r.success ? Math.max(0, TBE.num(tc, 0) - mastery) : 0;
  let reaction = null;
  if (r.success && wrm > 0) {
    const wr = await new Roll("1d20").evaluate();
    rolls.push(wr);
    const total = wr.total + wrm;
    reaction = { roll: wr, total, row: TBE.reactionFor(REACTIONS, total, { vulgar: false, ritual: false }) };
  }
  return { roll, r, ones, mastery, wrm, reaction };
}

function reactionHtml(out) {
  if (!out.reaction) return "";
  const d = DETAIL.find((x) => x.name === out.reaction.row?.name);
  return "<div style='color:#8b1a1a'><b>Weave Reaction</b>: 1d20 " + out.reaction.roll.total + " + " + out.wrm +
    " = " + out.reaction.total + " &rarr; <b>" + esc(out.reaction.row?.name || "?") + "</b></div>" +
    (d ? "<div style='font-size:11px;opacity:.85'>" + esc(d.text) + "</div>" : "");
}

/* ------------------------------------------------------------- enchanting */
async function enchant(d, rolls) {
  const tier = TBE.enchantRow(d.tier);
  const anyone = d.anyone === "on" || d.anyone === true;
  const fraying = TBE.enchantFraying(tier.key, anyone);
  const useReagents = d.useReagents === "on" || d.useReagents === true;
  const bind = binds.find((b) => b.id === d.bindId) || binds[0] || null;
  const strand = strands.find((s) => s.id === d.strandId) || strands[0] || null;
  const tc = Math.max(0, TBE.num(d.tc, 0));
  const name = (d.name || "Enchanted item").trim();

  /* The substitution is "declared before rolling the spell, not after", so the
   * reagents are checked and spent up front, and a shortfall stops the whole
   * thing rather than quietly falling back to Fraying. */
  let reagentNote = "", spentReagents = 0;
  if (useReagents && fraying > 0) {
    const need = TBE.reagentsFor(fraying);
    const pool = TBE.reagents(me, strand?.name);
    const have = pool.reduce((n, r) => n + r.count, 0);
    if (have < need) {
      return "<div style='color:#8b1a1a'><b>Not enough Weave Reagents.</b> This enchantment would cost " + fraying +
        " Fraying, so it needs " + need + " reagent(s) of " + esc(strand?.name || "its Strand") +
        ", and there are " + have + ".</div><div style='font-size:11px;opacity:.8'>" +
        esc(q(REAG, "substitution")) + "</div>";
    }
    let left = need;
    for (const r of pool) {
      if (left <= 0) break;
      const take = Math.min(left, r.count);
      left -= take;
      spentReagents += take;
      try { await r.item.update({ "system.pool": r.count - take, "system.expended": (r.count - take) <= 0 }); }
      catch (e) { console.warn("TBE | could not spend a reagent", e); }
    }
    reagentNote = "<div>" + spentReagents + " Weave Reagent(s) of " + esc(strand?.name || "?") +
      " consumed in place of " + fraying + " Fraying.</div>";
  }

  const against = (bind ? bind.effective : 0) + TBE.num(d.mod, 0);
  const out = await castInto(bind, strand, against, tc, rolls);

  let body = "<div><b>" + esc(name) + "</b> &mdash; a full day of preparation, then the casting.</div>" +
    "<div>" + esc(bind?.name || "Bind") + " (" + against + "): " + TBE.face(out.roll.total) + " &rarr; <b>" +
    TBE.tag(out.r) + "</b>" + (out.r.success ? ", " + out.r.sl + " SL" : "") + "</div>" + reagentNote;

  if (!out.r.success) {
    /* "If the enchanter's spell roll fails, the item is not enchanted and is
     * no longer suitable... If the spell roll critically fails, the item is no
     * longer suitable, and any Fraying is also accrued." */
    body += "<div style='font-weight:bold;color:#8b1a1a'>The item is not enchanted, and is no longer suitable. " +
      "A new masterwork item must be crafted to try again.</div>";
    if (out.r.critFail && fraying > 0 && !useReagents && me) {
      const fr = await TBE.addFraying(me, fraying, "critically failed enchantment");
      body += "<div style='color:#8b1a1a'>The Fraying is accrued anyway: " + fraying + ".</div>" + (fr?.html || "");
    }
    return body;
  }

  body += "<div>Mastery <b>" + out.mastery + "</b> against TC <b>" + tc + "</b>" +
    (out.wrm ? ", uncontrolled by " + out.wrm : ", controlled") + ".</div>" + reactionHtml(out);

  const unstable = !!out.reaction;
  if (unstable) {
    body += "<div style='color:#8b1a1a'>" + esc(q(ENCH, "unstableWarning") || "") +
      "The flaw becomes part of the item's Pattern: this is an <b>unstable enchantment</b>.</div>";
  }
  if (fraying > 0 && !useReagents && me) {
    const fr = await TBE.addFraying(me, fraying, "enchanting " + name);
    body += "<div>" + fraying + " Fraying" + (anyone ? " (including +1 for making it usable by anyone)" : "") +
      ".</div>" + (fr?.html || "");
  } else if (fraying === 0) {
    body += "<div style='font-size:11px;opacity:.85'>A single-use enchantment costs no Fraying &mdash; but the vessel " +
      "can never hold magic again once it is spent.</div>";
  }

  /* The item is created on the sheet, because everything about it is spent or
   * rolled later and a note cannot be. "An item cannot possess both a Use Die
   * and a Charge pool; choose one when it is created" -- so the choice is made
   * here and the unused half is left at its default rather than half-filled. */
  const shape = tier.key === "single" ? "single" : (d.shape === "charges" ? "charges" : "die");
  const charges = shape === "single" ? 1 : shape === "charges" ? tier.charges : 0;
  const payload = {
    name, type: "enchantment", img: "icons/svg/daze.svg",
    system: {
      kind: shape,
      die: tier.die || "d8",
      charges, chargesMax: charges,
      unstable, spent: false, resistance: out.roll.total,
      spell: (d.spell || "").trim(), bind: bind?.name || "", strand: strand?.name || "", tc,
      anyoneCanUse: anyone, activationWord: (d.word || "").trim(),
      frayingCost: useReagents ? 0 : fraying, reagentsUsed: spentReagents
    }
  };
  try { await me?.createEmbeddedDocuments("Item", [payload]); }
  catch (e) { console.warn("TBE | could not create the enchanted item", e); }

  body += "<div style='color:#1f7a1f;font-weight:bold'>" + esc(name) + " is permanently enchanted &mdash; " +
    (shape === "die" ? "a " + (tier.die || "d8") + " Use Die"
      : shape === "charges" ? charges + " charges" : "a single use") + ".</div>" +
    "<div style='font-size:11px;opacity:.85'>Its fixed resistance is the Bind roll, <b>" + out.roll.total +
    "</b>: anyone resisting its magic must meet or beat that. It is on the sheet now.</div>" +
    (anyone ? "" : "<div style='font-size:11px;opacity:.85'>" + esc(q(ENCH, "weaverOnly")) + "</div>");
  return body;
}

/* ---------------------------------------------------------------- brewing */
async function brew(d, rolls) {
  const bind = binds.find((b) => b.id === d.bindId) || binds[0] || null;
  const strand = strands.find((s) => s.id === d.strandId) || strands[0] || null;
  const tc = Math.max(0, TBE.num(d.tc, 0));
  const name = (d.name || "Potion").trim();
  const aidKeys = TBE.ALCHEMY_AIDS.filter((a) => d["aid_" + a.key] === "on" || d["aid_" + a.key] === true).map((a) => a.key);
  const aids = TBE.alchemyAids(aidKeys);

  /* Reagents are the ingredient, not an optional substitution: 1 up to 15 TC,
   * 2 from 16, per batch, of the potion's own Strand. */
  const need = TBE.potionReagents(tc);
  const pool = TBE.reagents(me, strand?.name);
  const have = pool.reduce((n, r) => n + r.count, 0);
  if (have < need) {
    return "<div style='color:#8b1a1a'><b>Not enough Weave Reagents.</b> A " + tc + " TC potion needs " + need +
      " of " + esc(strand?.name || "its Strand") + " per batch, and there are " + have + ".</div>";
  }
  let left = need, spent = 0;
  for (const r of pool) {
    if (left <= 0) break;
    const take = Math.min(left, r.count);
    left -= take; spent += take;
    try { await r.item.update({ "system.pool": r.count - take, "system.expended": (r.count - take) <= 0 }); }
    catch (e) { console.warn("TBE | could not spend a reagent", e); }
  }

  /* "Resolve may not be used on this roll, but Threads may be" -- so no Favor
   * field exists in this macro at all. */
  const against = (bind ? bind.effective : 0) + aids.bind + TBE.num(d.mod, 0);
  const out = await castInto(bind, strand, against, tc, rolls);

  let body = "<div><b>" + esc(name) + "</b> &mdash; " + (aids.days > 1 ? aids.days + " full working days" : "eight hours") +
    " of brewing.</div>" +
    "<div>" + spent + " reagent(s) of " + esc(strand?.name || "?") + " consumed" +
    (aids.used.length ? ", with " + aids.used.map((a) => esc(a.name)).join(" and ") : "") + ".</div>" +
    "<div>" + esc(bind?.name || "Bind") + " (" + against + (aids.bind ? ", +" + aids.bind + " from aids" : "") + "): " +
    TBE.face(out.roll.total) + " &rarr; <b>" + TBE.tag(out.r) + "</b>" + (out.r.success ? ", " + out.r.sl + " SL" : "") + "</div>";

  if (!out.r.success) {
    return body + "<div style='font-weight:bold;color:#8b1a1a'>" + esc(q(ALCH, "failWastes")) + "</div>";
  }
  body += reactionHtml(out);
  const unstable = !!out.reaction;
  if (unstable) body += "<div style='color:#8b1a1a'>The batch is <b>unstable</b>.</div>";

  /* Yield: 1d3 doses + 1 per 3 SLs on Craft: Practical, which the Master
   * laboratory also improves. */
  const craftAgainst = TBE.num(d.craft, 45) + aids.craft;
  const cr = await TBE.rollAttempt(craftAgainst, 0);
  rolls.push(cr.roll);
  const d3 = await new Roll("1d3").evaluate();
  rolls.push(d3);
  const sls = cr.r.success ? cr.r.sl : 0;
  const doses = TBE.potionYield(d3.total, sls);
  body += "<div>Craft: Practical (" + craftAgainst + (aids.craft ? ", +" + aids.craft + " from the laboratory" : "") + "): " +
    TBE.face(cr.roll.total) + " &rarr; " + TBE.tag(cr.r) + (cr.r.success ? ", " + sls + " SL" : "") + "</div>" +
    "<div>Yield: 1d3 (" + d3.total + ") + " + Math.floor(sls / 3) + " = <b>" + doses + "</b> dose(s).</div>";

  const payload = {
    name, type: "enchantment", img: "icons/svg/potion.svg",
    system: {
      kind: "potion", die: "d8", charges: doses, chargesMax: doses,
      unstable, spent: false, resistance: out.roll.total,
      spell: (d.spell || "").trim(), bind: bind?.name || "", strand: strand?.name || "", tc,
      anyoneCanUse: true, activationWord: "", frayingCost: 0, reagentsUsed: spent
    }
  };
  try { await me?.createEmbeddedDocuments("Item", [payload]); }
  catch (e) { console.warn("TBE | could not create the potion", e); }

  return body + "<div style='color:#1f7a1f;font-weight:bold'>The batch is complete and on the sheet.</div>" +
    "<div style='font-size:11px;opacity:.85'>Alchemy accrues no Fraying. Each dose reproduces the spell exactly; " +
    "anyone resisting it rolls against the original Bind roll, <b>" + out.roll.total + "</b>.</div>";
}

/* --------------------------------------------------------------- reagents */
async function findReagents(d, rolls) {
  const arcana = TBE.num(d.arcana, 0);
  const strandName = (d.foundStrand || "").trim();
  const { roll, r } = await TBE.rollAttempt(arcana, 0);
  rolls.push(roll);
  let body = "<div>Half a day's search. Arcana (" + arcana + "): " + TBE.face(roll.total) + " &rarr; <b>" +
    TBE.tag(r) + "</b>" + (r.success ? ", " + r.sl + " SL" : "") + "</div>";
  if (!r.success) {
    return body + "<div>Nothing usable here. " + esc(q(REAG, "whereFound")) + "</div>";
  }
  const found = 1 + Math.floor(r.sl / 3);
  body += "<div><b>" + found + "</b> reagent(s) of " + esc(strandName || "the dominant Strand here") +
    " &mdash; one, plus one per 3 SLs.</div>";

  /* Added to the sheet as a reagent Thread of that Strand, topping up an
   * existing stock rather than making a second pile of the same thing. */
  if (me && strandName) {
    const existing = TBE.reagents(me, strandName)[0];
    try {
      if (existing) await existing.item.update({ "system.pool": existing.count + found, "system.expended": false });
      else await me.createEmbeddedDocuments("Item", [{
        name: strandName + " Reagents", type: "thread", img: "icons/svg/acid.svg",
        system: { attunement: strandName, kind: "consumable", pool: found, reagent: true, expended: false }
      }]);
      body += "<div style='font-size:11px;opacity:.85'>Added to the sheet. " + esc(q(REAG, "potency")) + "</div>";
    } catch (e) { console.warn("TBE | could not record reagents", e); }
  } else if (!strandName) {
    body += "<div style='font-size:11px;opacity:.85'>Name the Strand to have them recorded on the sheet.</div>";
  }
  return body;
}
