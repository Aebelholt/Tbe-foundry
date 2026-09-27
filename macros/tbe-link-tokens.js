/* TBE: Link Character Tokens — link every Character token on every scene to
 * its actor in the sidebar (v0.54.0). GM only.
 *
 * An unlinked Character token carries its own private copy of the character.
 * Anything done with that token selected (building the character, damage,
 * spent Resolve) lands in the copy, and linking the token later swaps in the
 * untouched sidebar actor: the work looks reverted. The copy is still in the
 * token, though, and this is how you get it back.
 *
 * For each unlinked Character token:
 *   - no copy of its own: it is simply linked.
 *   - its own copy (items or changed values): you choose. "Keep the token's
 *     copy" makes it the sidebar actor and links the token; "Keep the sidebar
 *     actor" links the token and leaves the actor as it is; or leave it alone.
 * Nothing is deleted without that choice. The owners live in the system
 * (module/helpers/token-link.mjs).
 */
if (!game.user.isGM) {
  ui.notifications?.warn("TBE: only a GM can link tokens to actors.");
} else {
  const T = game.thebrokenempires?.tokens;
  if (!T) {
    ui.notifications?.warn("TBE: this needs The Broken Empires system v0.54.0 or later.");
  } else {
    const found = T.findUnlinkedCharacters();
    if (!found.length) {
      ui.notifications?.info("TBE: every Character token is already linked to its actor.");
    } else {
      const rows = found.map((f, i) => {
        const s = f.summary;
        const what = s.hasBuild
          ? "<b>its own copy</b>: " + s.items + " item(s)" + (s.system ? ", " + s.system + " changed value group(s)" : "") + (s.renamed ? ", renamed" : "")
          : "no copy of its own";
        const opts = s.hasBuild
          ? '<option value="token" selected>Keep the token\'s copy (it becomes the sidebar actor)</option>' +
            '<option value="actor">Keep the sidebar actor (the token\'s copy is set aside)</option>'
          : '<option value="actor" selected>Link it</option>';
        return '<div style="border-top:1px solid #7a6a4f;padding:4px 0"><b>' + TBE.esc(f.token.name) + "</b> on " + TBE.esc(f.scene.name) +
          " &rarr; " + TBE.esc(f.actor.name) + '<div style="font-size:11px;opacity:.8">' + what + "</div>" +
          '<select name="t' + i + '" style="width:100%">' + opts + '<option value="">Leave it unlinked</option></select></div>';
      }).join("");
      const data = await TBE.prompt("Link Character tokens",
        '<div style="font-size:13px"><p>' + found.length + " Character token(s) are not linked to their actor. " +
        "Work done with an unlinked token lands in the token, not in the sidebar actor.</p>" + rows + "</div>", "Link");
      if (data) {
        const done = [], failed = [];
        for (let i = 0; i < found.length; i++) {
          const keep = data["t" + i];
          if (!keep) continue;
          try { await T.linkToken(found[i], keep); done.push(found[i].token.name + (keep === "token" ? " (token's copy kept)" : "")); }
          catch (err) { console.error("TBE | link failed", err); failed.push(found[i].token.name + ": " + (err?.message || err)); }
        }
        await TBE.say(TBE.card("TBE Link Character Tokens",
          (done.length ? "<div>Linked: " + done.map(TBE.esc).join(", ") + ".</div>" : "<div>Nothing was linked.</div>") +
          (failed.length ? '<div style="color:#8b1a1a">Could not link: ' + failed.map(TBE.esc).join("; ") + ". Those tokens were left as they were.</div>" : "")),
          [], { mode: TBE.MODES.PRIVATE });
      }
    }
  }
}
