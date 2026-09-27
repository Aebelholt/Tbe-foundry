/* TBE: Oracle Tables — roll any oracle table the GM imported with TBE: Import
 * Oracle Tables (v0.55.0).
 *
 * A table with a partner (Action 1 and Action 2, Descriptor 1 and
 * Descriptor 2) rolls both and reads them together. Tables meant to be read
 * as a pair from one list (the Elements tables, anything whose own notes say
 * "roll twice") roll twice by default. A table whose die carries a modifier
 * ("1d10 + PP") asks for it. The last table picked is remembered; nothing
 * else is.
 */
const SCOPE = "the-broken-empires";
const O = game.thebrokenempires?.oracle;
const tables = O ? O.imported() : [];
if (!O) {
  ui.notifications?.warn("TBE: this needs The Broken Empires system v0.55.0 or later.");
} else if (!tables.length) {
  ui.notifications?.info("TBE: no oracle tables imported yet." + (game.user.isGM ? " Run TBE: Import Oracle Tables." : " Ask your GM to run TBE: Import Oracle Tables."));
} else {
  const meta = (t) => t.getFlag(SCOPE, "oracle") || {};
  const byKey = new Map(tables.map((t) => [meta(t).key, t]));
  /* A pair's second half is rolled with its first, so it is not offered alone twice. */
  const seconds = new Set(tables.map((t) => meta(t).pair).filter(Boolean));
  const groups = {};
  for (const t of tables) {
    if (seconds.has(meta(t).key)) continue;
    (groups[meta(t).group || "Oracle"] = groups[meta(t).group || "Oracle"] || []).push(t);
  }
  const last = TBE.recall("oracle", "table");
  const opts = Object.entries(groups).map(([g, ts]) =>
    '<optgroup label="' + TBE.esc(g) + '">' +
    ts.sort((a, b) => a.name.localeCompare(b.name)).map((t) => {
      const m = meta(t);
      const label = m.pair && byKey.get(m.pair) ? t.name.replace(/\s*1$/, "") + " (1 + 2)" : t.name;
      return '<option value="' + t.id + '"' + (t.id === last ? " selected" : "") + ">" + TBE.esc(label) + "</option>";
    }).join("") + "</optgroup>").join("");

  const data = await TBE.prompt("TBE: Oracle Tables",
    '<div style="font-size:13px">' +
    '<label style="display:block">Table: <select name="table" size="14" style="width:100%">' + opts + "</select></label>" +
    '<label style="display:block;margin-top:4px">Roll: <select name="times">' +
    '<option value="auto" selected>as the table says</option><option value="1">once</option><option value="2">twice</option></select></label>' +
    '<label style="display:block;margin-top:4px">Modifier (only for a table rolled "+ something"): <input type="number" name="mod" value="0" style="width:60px"></label>' +
    '<label style="display:block;margin-top:4px">Question or context: <input type="text" name="q" style="width:100%"></label>' +
    "</div>", "Roll");

  const table = data ? game.tables.get(data.table) : null;
  if (data && !table) ui.notifications?.warn("TBE: pick a table.");
  if (table) {
    await TBE.remember("oracle", "table", table.id);
    const m = meta(table);
    const partner = m.pair ? byKey.get(m.pair) : null;
    const mod = m.modifier ? TBE.num(data.mod, 0) : 0;
    const times = partner ? 1 : data.times === "auto" ? (m.twice ? 2 : 1) : Number(data.times) || 1;
    const draw = async (t) => {
      const roll = await new Roll(t.formula + (mod ? " + " + mod : "")).evaluate();
      const out = await t.roll({ roll });
      return { name: t.name, total: roll.total, text: TBE.resultText(out.results?.[0]) || "(no result for " + roll.total + ")", roll };
    };
    const got = [];
    for (let i = 0; i < times; i++) got.push(await draw(table));
    if (partner) got.push(await draw(partner));
    const words = got.map((g) => TBE.esc(g.text));
    const body =
      (data.q ? '<div style="font-style:italic;margin-bottom:2px">' + TBE.esc(data.q) + "</div>" : "") +
      '<div style="font-size:11px;opacity:.8">' + TBE.esc(partner ? table.name.replace(/\s*1$/, "") + " (1 + 2)" : table.name) +
      (m.modifier && mod ? " &middot; +" + mod + " " + TBE.esc(m.modifier) : "") + "</div>" +
      '<div style="font-size:16px;margin-top:2px"><b>' + words.join(" &middot; ") + "</b></div>" +
      '<div style="font-size:11px;opacity:.7">' + got.map((g) => g.total).join(", ") + "</div>";
    await TBE.say(TBE.card("Oracle", body), got.map((g) => g.roll));
  }
}
