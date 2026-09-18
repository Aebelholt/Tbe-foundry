/* TBE: Install Tables — creates any missing TBE roll table. Safe to re-run. */
if (!game.user.isGM) {
  ui.notifications?.warn("TBE: only a GM can create roll tables.");
} else {
  console.log("TBE | Foundry " + game.version + " | system " + game.system.id + " " + game.system.version);
  const out = await TBE.ensureTables();
  const msg =
    "TBE tables: " + out.created.length + " created" +
    (out.failed.length ? ", " + out.failed.length + " failed (see console, F12)" : "") +
    (out.created.length === 0 && out.failed.length === 0 ? " (all already present)" : "");
  if (out.failed.length) ui.notifications?.error(msg);
  else ui.notifications?.info(msg);
  console.log("TBE | created:", out.created, "failed:", out.failed);
}
