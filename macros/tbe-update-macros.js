/* TBE: Update Macros — bring this world's macro copies up to the installed
 * system. Safe to re-run, in the same sense TBE: Install Tables is.
 *
 * THE PROBLEM. Upgrading the system updates the `tbe-macros` COMPENDIUM.
 * It does not touch copies already sitting in a world's macro directory or on
 * a hotbar -- those are frozen at whatever version they were imported at. And
 * Foundry's own "Import All Content" CREATES rather than replaces, so every
 * re-import adds another copy: Seb's world was carrying nine TBE: Character
 * Wizard, five TBE: Attack and five TBE: Finish Character, all of them old.
 * The system was current and every single thing he clicked was not. That is
 * the "looks built but silently isn't" failure one level up.
 *
 * THE FIX, and it is the whole macro: **match on name and UPDATE, instead of
 * creating another one.** A macro this system ships is identified by its name;
 * if this world has one by that name, its command and image are overwritten
 * with what ships, in place. Its id does not change, so hotbar slots, folders
 * and permissions all survive. If this world has none, one is created. Running
 * it twice is indistinguishable from running it once.
 *
 * THE CONTRACT, stated to the user before anything happens: **this only ever
 * touches a macro whose NAME matches one the system ships. Rename yours and it
 * is left alone, permanently.** That matters because nothing can tell a stale
 * copy from one a GM deliberately edited -- both simply differ from what ships
 * -- so rather than guess, this offers a rule the GM can act on. It is the
 * same reason `findStaleMacros()` reports and never writes.
 *
 * DELETION is opt-in, off by default, and never removes the last copy of
 * anything. When asked, it keeps one of each -- preferring a copy that is on
 * someone's hotbar, so clearing duplicates cannot leave a dead slot behind --
 * and deletes only the surplus. Nothing that is not a duplicate is ever
 * deleted, and a macro this system does not ship is never touched at all.
 */

if (!game.user.isGM) {
  ui.notifications?.warn("TBE: only a GM can update this world's macros.");
} else {
  const PACK_ID = "the-broken-empires.tbe-macros";
  const pack = game.packs?.get(PACK_ID);

  if (!pack) {
    ui.notifications?.error("TBE: the " + PACK_ID + " compendium is not available. Is the system installed correctly?");
  } else {
    const shipped = await pack.getDocuments();
    if (!shipped.length) {
      ui.notifications?.error("TBE: the macro compendium is empty, so there is nothing to update from.");
    } else {

      /* Group this world's copies by the shipped name they claim to be. A macro
         we do not ship never appears here and is therefore never touched. */
      const shippedByName = new Map(shipped.map((m) => [m.name, m]));
      const mine = new Map();
      for (const m of game.macros) {
        if (!shippedByName.has(m.name)) continue;
        if (!mine.has(m.name)) mine.set(m.name, []);
        mine.get(m.name).push(m);
      }

      /* Which copies are on somebody's hotbar. Used only to decide which
         duplicate to KEEP, so a cleanup cannot leave a dead slot. */
      const onBar = new Set();
      for (const user of game.users ?? []) {
        for (const id of Object.values(user.hotbar ?? {})) if (id) onBar.add(id);
      }

      const sameAsShipped = (m) => (m.command ?? "") === (shippedByName.get(m.name).command ?? "");

      let toCreate = 0, toUpdate = 0, differing = 0, surplus = 0;
      for (const doc of shipped) {
        const copies = mine.get(doc.name) ?? [];
        if (!copies.length) { toCreate++; continue; }
        const behind = copies.filter((m) => !sameAsShipped(m));
        toUpdate += behind.length;
        differing += behind.length;
        if (copies.length > 1) surplus += copies.length - 1;
      }

      const nothingToDo = !toCreate && !toUpdate && !surplus;

      const content =
        '<div style="font-size:13px">' +
        "<p style=\"margin:0 0 6px\">This world has <b>" +
        [...mine.values()].reduce((n, a) => n + a.length, 0) +
        "</b> copies of the <b>" + shipped.length + "</b> macros this system ships.</p>" +
        '<ul style="margin:0 0 8px 16px;padding:0">' +
        "<li><b>" + toUpdate + "</b> copy(ies) are out of date and will be overwritten in place</li>" +
        "<li><b>" + toCreate + "</b> macro(s) are missing and will be created</li>" +
        "<li><b>" + surplus + "</b> surplus duplicate(s) exist</li></ul>" +
        '<label style="display:block;margin:6px 0"><input type="checkbox" name="prune"' +
        (surplus ? "" : " disabled") + "> Also delete the " + surplus +
        " surplus duplicate(s), keeping one of each</label>" +
        '<div style="font-size:11px;opacity:.85;border-top:1px solid #7a6a4f;padding-top:5px;margin-top:6px">' +
        "<b>This only ever touches a macro whose name matches one the system ships.</b> " +
        "If you have edited a TBE macro and want to keep your version, <b>cancel now and rename it</b> — " +
        "a renamed macro is invisible to this and will never be overwritten. Nothing can tell an edited " +
        "copy from an out-of-date one; they both simply differ from what ships." +
        (surplus ? " Deletion keeps a copy that is on someone's hotbar where there is one, so your bar " +
          "will not be left with a dead slot." : "") +
        "</div></div>";

      if (nothingToDo) {
        ui.notifications?.info("TBE: every macro in this world already matches the installed system. Nothing to do.");
      } else {
        const data = await TBE.prompt("Update this world's TBE macros", content, "Update");
        if (data) {
          const prune = data.prune === "on" || data.prune === true;
          const created = [], updated = [], deleted = [], failed = [];

          for (const doc of shipped) {
            const copies = mine.get(doc.name) ?? [];
            const payload = { command: doc.command, img: doc.img, type: doc.type ?? "script" };

            if (!copies.length) {
              try {
                await Macro.create(Object.assign({ name: doc.name }, payload));
                created.push(doc.name);
              } catch (err) {
                console.warn("TBE | could not create " + doc.name, err);
                failed.push(doc.name + " (create)");
              }
              continue;
            }

            /* Update EVERY copy, not just the one being kept: if the GM
               declines the prune, the leftovers must still be current, or this
               macro would have left known-stale code on their hotbar. */
            for (const m of copies) {
              if (sameAsShipped(m)) continue;
              try {
                await m.update(payload);
                updated.push(m.name);
              } catch (err) {
                console.warn("TBE | could not update " + m.name, err);
                failed.push(m.name + " (update)");
              }
            }

            if (prune && copies.length > 1) {
              /* Keep one. Prefer a hotbarred copy so no slot goes dead. */
              const keep = copies.find((m) => onBar.has(m.id)) ?? copies[0];
              for (const m of copies) {
                if (m.id === keep.id) continue;
                try {
                  await m.delete();
                  deleted.push(m.name);
                } catch (err) {
                  console.warn("TBE | could not delete a duplicate " + m.name, err);
                  failed.push(m.name + " (delete)");
                }
              }
            }
          }

          const line = (label, arr) => arr.length
            ? "<div><b>" + arr.length + "</b> " + label + ": " +
              [...new Set(arr)].slice(0, 8).join(", ") + ([...new Set(arr)].length > 8 ? ", ..." : "") + "</div>"
            : "";

          const body =
            line("updated in place", updated) +
            line("created", created) +
            line("surplus duplicate(s) removed", deleted) +
            (failed.length ? '<div style="color:#8b1a1a">' + line("could not be changed (see the console, F12)", failed) + "</div>" : "") +
            (!updated.length && !created.length && !deleted.length && !failed.length
              ? "<div>Nothing needed changing.</div>" : "") +
            (!prune && surplus
              ? '<div style="font-size:11px;opacity:.8;margin-top:4px">' + surplus +
                " surplus duplicate(s) were left in place and are now all current. Re-run with the box " +
                "ticked to tidy them.</div>"
              : "") +
            '<div style="font-size:11px;opacity:.7;margin-top:4px">Only macros named the same as one this ' +
            "system ships were considered. Anything renamed was left alone.</div>";

          /* GM housekeeping, not a game event: whispered so a maintenance
             report does not land in the middle of the table's chat. Goes
             through the one visibility owner like everything else. */
          await TBE.say(TBE.card("TBE Update Macros", body), [], { mode: TBE.MODES.PRIVATE });
          ui.notifications?.info("TBE: " + updated.length + " updated, " + created.length + " created" +
            (deleted.length ? ", " + deleted.length + " duplicates removed" : "") +
            (failed.length ? ", " + failed.length + " failed" : "") + ".");
        }
      }
    }
  }
}
