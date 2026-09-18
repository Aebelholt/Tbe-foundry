/* TBE: Skill Roll — standard d100 roll-under, tens die = Success Levels.
 *
 * Two rules that used to live only in prose are applied here, because both
 * are decided by facts the macro already has in front of it:
 *   - Resolve as Favor (p.24): "+10 per Resolve to a skill roll... up to 3
 *     Favor may be used on any one skill roll from any source." Spent from
 *     the sheet, not just added to the target number.
 *   - The Breaking (p.83): an Ogre who critically fails a roll they spent
 *     Resolve on attacks the nearest living thing next turn.
 *   - An Ogre in reinforced leather, mail, scale or plate is untrained and
 *     takes -20 to every Willpower roll; the penalty is read off their worn
 *     armor rather than asked for.
 */
const actor = TBE.me();
const ogreArmor = TBE.ogreArmorPenalty(actor);
const picker = TBE.skillOptions();
const content =
  '<div style="font-size:13px">' +
  picker +
  TBE.encNote(TBE.me()) +
  TBE.riderNote(TBE.me()) +
  '<label style="display:block;margin:2px 0">Skill value: <input type="number" name="skill" value="20" style="width:100%"></label>' +
  /* p.24 Difficulty Modifier table, verified against /tmp/tbe.txt: Simple
   * +20, Easy +10, Medium +0, Challenging -10, Hard -20, Severe -30. This
   * used to also offer a fabricated "Trivial +40" tier that isn't in the
   * book, and priced Severe at -40 instead of -30. */
  '<label style="display:block;margin:2px 0">Modifier: <select name="mod" style="width:100%">' +
  '<option value="20">Simple +20</option>' +
  '<option value="10">Easy +10</option>' +
  '<option value="0" selected>Medium +0</option>' +
  '<option value="-10">Challenging -10</option>' +
  '<option value="-20">Hard -20</option>' +
  '<option value="-30">Severe -30</option>' +
  "</select></label>" +
  '<label style="display:block;margin:2px 0">Extra modifier: <input type="number" name="extra" value="' + TBE.encMod(actor) + '" style="width:100%"></label>' +
  '<label style="display:block;margin:2px 0">Label: <input type="text" name="label" placeholder="Stealth, Melee: Medium..." style="width:100%"></label>' +
  '<label style="display:block;margin:2px 0">Resolve as Favor (+10 each, max 3' +
  (actor ? ", you have " + TBE.num(actor.system?.resolve?.value, 0) : "") +
  '): <input type="number" name="favor" value="0" min="0" max="3" style="width:100%"></label>' +
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
   * have is an error, not a house rule. Capped at 3 from any source (p.24). */
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
