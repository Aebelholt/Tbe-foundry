/* TBE: Skill Roll — standard d100 roll-under, tens die = Success Levels.
 *
 * Two rules that used to live only in prose are applied here, because both
 * are decided by facts the macro already has in front of it:
 *   - Resolve as Favor (p.26): "+10 per Resolve to a skill roll... up to 3
 *     Favor may be used on any one skill roll from any source." Spent from
 *     the sheet, not just added to the target number.
 *   - The Breaking (p.83): an Ogre who critically fails a roll they spent
 *     Resolve on attacks the nearest living thing next turn.
 *   - An Ogre in reinforced leather, mail, scale or plate is untrained and
 *     takes -20 to every Willpower roll; the penalty is read off their worn
 *     armor rather than asked for.
 */
const actor = TBE.me();
/* Memory is per user and per character ("none" when no character). */
const memKey = actor?.id ?? "none";
const ogreArmor = TBE.ogreArmorPenalty(actor);
const picker = TBE.skillOptions();
const content =
  '<div style="font-size:13px">' +
  picker +
  TBE.encNote(TBE.me()) +
  TBE.riderNote(TBE.me()) +
  '<label style="display:block;margin:2px 0">Skill value: <input type="number" name="skill" value="20" style="width:100%"></label>' +
  /* The Task Modifier Table (p.18), as a row of buttons, opening on the
   * modifier this user last used for this character. The rows come from the
   * owner (module/rules/resolution.mjs): this macro kept its own copy until
   * v0.49.0, and the two had drifted (the owner lacked Severe -30). */
  '<div style="margin:2px 0">Task Modifier:</div>' +
  TBE.taskButtons(TBE.recall("task", memKey) ?? 0, "mod") +
  '<label style="display:block;margin:2px 0">Extra modifier: <input type="number" name="extra" value="' + TBE.encMod(actor) + '" style="width:100%"></label>' +
  '<label style="display:block;margin:2px 0">Label: <input type="text" name="label" placeholder="Stealth, Melee: Medium..." style="width:100%"></label>' +
  /* Favor always opens on 0: it spends Resolve, so it is never remembered. */
  '<div style="margin:2px 0">Resolve as Favor (+10 each, max 3' +
  (actor ? ", you have " + TBE.num(actor.system?.resolve?.value, 0) : "") + "):</div>" +
  TBE.favorButtons(actor ? Math.min(3, TBE.num(actor.system?.resolve?.value, 0)) : 3, "favor") +
  (ogreArmor.penalty
    ? '<div style="font-size:11px;color:#8b1a1a">Wearing ' + ogreArmor.pieces.join(", ") +
      " untrained: <b>-20</b> is applied automatically to any Willpower roll (p.83).</div>"
    : "") +
  "</div>";

const data = await TBE.prompt("TBE Skill Roll", content, "Roll");
if (data) {
  const pick = TBE.readPick(data.pick);
  const base = pick ? pick.value : TBE.num(data.skill, 50);
  const label = (data.label || (pick ? pick.name : "") || "Skill").trim();
  /* Favor cannot outrun the sheet: spending Resolve the character does not
   * have is an error, not a house rule. Capped at 3 from any source (p.26). */
  const asked = Math.max(0, Math.min(3, TBE.num(data.favor, 0)));
  const favor = actor ? Math.min(asked, TBE.num(actor.system?.resolve?.value, 0)) : asked;
  /* The Ogre's untrained-armor penalty is a Willpower penalty specifically,
   * so it only lands when the roll actually is one. */
  const ogrePen = /willpower/i.test(label) ? ogreArmor.penalty : 0;
  const mod = TBE.num(data.mod, 0) + TBE.num(data.extra, 0) + favor * 10 + ogrePen;
  const skill = base + mod;

  if (favor < asked) ui.notifications?.info("TBE: only " + favor + " Resolve was available, so that is what was spent as Favor.");
  let favorWrite = { ok: true, notice: null };
  if (favor && actor) {
    const cur = TBE.num(actor.system?.resolve?.value, 0);
    favorWrite = await TBE.write(actor, { "system.resolve.value": Math.max(0, cur - favor) }, "the " + favor + " Resolve");
  }

  /* Remember the modifier, not the Favor: next time opens on this step. */
  await TBE.remember("task", memKey, TBE.num(data.mod, 0));

  const roll = await TBE.d100();
  const res = TBE.resolve(roll.total, skill, pick ? pick.expertise : 0);
  const breaking = await TBE.theBreaking(actor, res, favor);

  const body =
    '<div style="margin:2px 0"><b>' + label + "</b> " + base +
    (mod ? (mod > 0 ? " +" + mod : " " + mod) : "") +
    " &rarr; target <b>" + skill + "</b></div>" +
    '<div style="font-size:22px;line-height:1.1;margin:4px 0">' + TBE.face(roll.total) + "</div>" +
    '<div style="font-weight:bold;color:' + TBE.colour(res) + '">' + TBE.tag(res) +
    (res.success ? " &mdash; " + res.sl + " SL" : "") + "</div>" +
    (res.notes.length ? '<div style="font-size:11px;opacity:.8">' + res.notes.join(" &middot; ") + "</div>" : "") +
    (favor ? '<div style="font-size:11px;opacity:.85">' + favor + " Resolve spent as Favor (+" + favor * 10 + ")." +
      (favorWrite.ok ? "" : ' <span style="color:#8b1a1a">Not deducted. ' + TBE.esc(favorWrite.notice) + "</span>") + "</div>" : "") +
    (ogrePen ? '<div style="font-size:11px;color:#8b1a1a">-20 for untrained armor (' + ogreArmor.pieces.join(", ") + ").</div>" : "") +
    breaking;

  await TBE.say(TBE.card("TBE Skill Roll", body), [roll]);
}
