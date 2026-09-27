/* TBE: Import Oracle Tables — build world RollTables from the GM's own oracle
 * file (v0.55.0). GM only.
 *
 * The file is a JSON transcription the GM keeps (for example of a published
 * solo oracle). The system ships this reader and nothing of the content; the
 * tables are created in this world only. The reading, checking and writing
 * are owned by the system (module/helpers/oracle-import.mjs):
 *   - every table is checked before it is written (rolls in order, ranges
 *     contiguous and covering the die, labels agreeing with their numbers);
 *     one that fails is left out and named, the rest still import
 *   - lookups and rules text go into one journal, "TBE Oracle Reference"
 *   - blank record sheets are skipped, and the report says so
 *   - importing again updates the same tables in place, never duplicates
 * You see the plan before anything is written.
 */
if (!game.user.isGM) {
  ui.notifications?.warn("TBE: only a GM can import oracle tables, because they are created in the world.");
} else {
  const O = game.thebrokenempires?.oracle;
  if (!O) {
    ui.notifications?.warn("TBE: this needs The Broken Empires system v0.55.0 or later.");
  } else {
    const pick = await TBE.prompt("TBE: Import Oracle Tables",
      '<div style="font-size:13px">' +
      '<p>Choose your oracle file (.json).</p>' +
      '<input type="file" name="file" accept=".json,application/json">' +
      '<label style="display:block;margin-top:6px"><input type="checkbox" name="events" checked> ' +
      "Use them for Random Events (Random Event, Ask the Weave, Subverted Scene)</label>" +
      '<p style="font-size:11px;opacity:.8">Nothing is written until you have seen what will be imported.</p></div>',
      "Read file");
    const file = pick?.file;
    if (!pick) {
      /* closed */
    } else if (!file || typeof file.text !== "function" || !file.size) {
      ui.notifications?.warn("TBE: no file chosen.");
    } else {
      let json = null;
      try { json = JSON.parse(await file.text()); }
      catch (e) { ui.notifications?.error("TBE: that file is not valid JSON (" + (e?.message ?? e) + ")."); }
      if (json) {
        const plan = O.plan(json);
        const li = (xs, max = 40) => xs.length
          ? "<ul style='margin:2px 0 6px 16px;padding:0'>" + xs.slice(0, max).map((x) => "<li>" + x + "</li>").join("") +
            (xs.length > max ? "<li>... and " + (xs.length - max) + " more</li>" : "") + "</ul>"
          : "<div style='opacity:.6;margin-bottom:6px'>none</div>";
        const already = new Set(O.imported().map((t) => t.getFlag("the-broken-empires", "oracle")?.key));
        const groups = {};
        for (const t of plan.tables) (groups[t.group] = groups[t.group] || []).push(t);
        const preview =
          '<div style="font-size:12px;max-height:460px;overflow:auto">' +
          (plan.source ? "<div>Source: <i>" + TBE.esc(plan.source) + "</i></div>" : "") +
          "<div><b>" + plan.tables.length + " tables</b> (" + plan.tables.filter((t) => already.has(t.key)).length + " already imported, updated in place)</div>" +
          li(Object.entries(groups).map(([g, ts]) => TBE.esc(g) + ": " + ts.length)) +
          "<div><b>Reference pages</b> (journal \"TBE Oracle Reference\")</div>" + li(plan.reference.map((r) => TBE.esc(r.name))) +
          "<div><b>Left out: failed a check</b></div>" + li(plan.errors.map((e) => "<b>" + TBE.esc(e.name) + "</b>: " + e.problems.map(TBE.esc).join("; "))) +
          "<div><b>Skipped: record sheets</b></div>" + li(plan.skipped.map(TBE.esc)) +
          "<div><b>Notes from your file</b></div>" + li(plan.warnings.map(TBE.esc), 20) +
          "</div>";
        const go = await TBE.prompt("TBE: Import Oracle Tables — preview", preview, "Import");
        if (go && (plan.tables.length || plan.reference.length)) {
          const res = await O.importFile(json, !!pick.events);
          if (res.refused) {
            ui.notifications?.warn("TBE: " + res.refused);
          } else {
            const r = res.report;
            const body =
              "<div><b>" + r.created.length + "</b> tables created, <b>" + r.updated.length + "</b> updated, in the folder \"" + TBE.esc(O.FOLDER) + "\".</div>" +
              (r.journal ? "<div>Reference journal " + r.journal + ".</div>" : "") +
              (plan.errors.length ? "<div>" + plan.errors.length + " left out after failing a check: " + plan.errors.map((e) => TBE.esc(e.name)).join(", ") + ".</div>" : "") +
              (r.failed.length ? '<div style="color:#8b1a1a">Could not write: ' + r.failed.map((f) => TBE.esc(f.name) + " (" + TBE.esc(f.error) + ")").join("; ") + "</div>" : "") +
              (pick.events ? "<div>Random Events now roll on the imported focus and Meaning tables where they exist. Turn this off under Configure Settings.</div>" : "") +
              '<div style="font-size:11px;opacity:.8">Roll any of them with TBE: Oracle Tables.</div>';
            await TBE.say(TBE.card("TBE: Import Oracle Tables", body), [], { mode: TBE.MODES.SELF });
          }
        }
      }
    }
  }
}
