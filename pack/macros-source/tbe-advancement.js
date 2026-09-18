/* TBE: Advancement (Ch.8, p.122-124) — spend XP between sessions.
 * Improve a skill, buy Expertise, buy a new -Wise/Language/Bind skill, or
 * spend toward a Talent (handed off to TBE: Talents to actually pick it, so
 * the race-exclusivity and rank rules there don't get a second copy here).
 * Strand and Piety advancement (also Ch.8) aren't covered: neither is a
 * trackable field on this system yet, so there's nothing here to spend
 * XP on for them. Award XP as GM from the same dialog.
 */

const EXPERTISE_COST = { 2: 4, 3: 6, 4: 8 };
/* Skill Expertise Limits table, p.54 -- the maximum Expertise a skill's
 * current value allows, independent of how it got there. */
const expertiseCap = (value) => (value >= 80 ? 4 : value >= 60 ? 3 : value >= 40 ? 2 : 0);

const me = TBE.me();
if (!me || me.type !== "character") {
  ui.notifications?.warn("TBE: select a character token first (Advancement is a PC tool).");
} else {
  const xp = me.system?.experience ?? { available: 0, earned: 0 };
  const skillItems = (me.items ?? []).filter((i) => i.type === "skill")
    .map((i) => ({ id: i.id, name: i.name, value: TBE.num(i.system?.value, 0), expertise: TBE.num(i.system?.expertise, 0), savvy: !!i.system?.savvy, group: i.system?.group }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const skillOpts = skillItems.map((s) => '<option value="' + s.id + '">' + s.name + " (" + s.value +
    (s.expertise >= 2 ? " Ex" + s.expertise : "") + (s.savvy ? " S" : "") + ")</option>").join("");

  const content =
    '<div style="font-size:13px">' +
    "<div><b>" + me.name + "</b> &middot; XP available <b>" + xp.available + "</b> (earned " + xp.earned + " lifetime)</div><hr>" +
    '<label style="display:block">Action: <select name="act" style="width:100%">' +
    '<option value="improve">Improve a skill (1 XP/attempt)</option>' +
    '<option value="expertise">Buy the next Expertise level (4/6/8 XP)</option>' +
    '<option value="newskill">Buy a new -Wise, Language, or Bind skill</option>' +
    '<option value="talent">Spend 5 XP toward a Talent (opens TBE: Talents to pick it)</option>' +
    '<option value="award">GM: award XP</option>' +
    "</select></label>" +
    '<label style="display:block">Skill (Improve / Expertise): <select name="skill" style="width:100%">' + skillOpts + "</select></label>" +
    "<hr><b>New skill</b>" +
    '<label style="display:block">Type: <select name="newtype" style="width:100%">' +
    '<option value="wise">-Wise or Language, 3 XP, starts at 20</option>' +
    '<option value="bind">Bind, 5 XP, starts at 10 (a Fade\'s Bind can never exceed 70)</option>' +
    "</select></label>" +
    '<label style="display:block">Name: <input type="text" name="newname" value="" placeholder="Local-wise, or a Bind name" style="width:100%"></label>' +
    '<label style="display:block">Group (for the -Wise/Language option): <select name="newgroup" style="width:100%">' +
    '<option value="Wise">Wise</option><option value="Language">Language</option></select></label>' +
    "<hr><b>GM: award XP</b>" +
    '<label style="display:block">Amount: <input type="number" name="amt" value="1" style="width:100%"></label>' +
    "</div>";

  const data = await TBE.prompt("Advancement", content, "Go");
  if (data) {
    let body = "";
    const spend = async (cost) => {
      if (xp.available < cost) return false;
      xp.available -= cost;
      await me.update({ "system.experience.available": xp.available });
      return true;
    };

    if (data.act === "award") {
      const amt = TBE.num(data.amt, 1);
      xp.available += amt; xp.earned += amt;
      await me.update({ "system.experience.available": xp.available, "system.experience.earned": xp.earned });
      body = "<div><b>" + me.name + "</b> is awarded " + amt + " XP (now " + xp.available + " available, " + xp.earned + " lifetime).</div>";
    } else if (data.act === "improve") {
      const item = skillItems.find((s) => s.id === data.skill);
      if (!item) { body = "<div>No skill selected.</div>"; }
      else if (!(await spend(1))) { body = "<div>Not enough XP: improving a skill costs 1 XP, " + me.name + " has " + xp.available + ".</div>"; }
      else {
        const r = await TBE.d100();
        let inc;
        if (r.total > item.value) {
          const d4 = await new Roll("1d4").evaluate();
          inc = 1 + d4.total + (item.savvy ? 1 : 0);
        } else {
          inc = 1 + (item.savvy ? 1 : 0);
        }
        const before = item.value;
        const after = before + inc;
        await me.updateEmbeddedDocuments("Item", [{ _id: item.id, "system.value": after }]);
        body = "<div><b>" + item.name + "</b>: roll " + TBE.face(r.total) + " vs " + before +
          (r.total > before ? " (over &mdash; 1d4+1" : " (at or under &mdash; flat 1") +
          (item.savvy ? " +1 Savvy" : "") + "): <b>+" + inc + "</b> &rarr; " + before + " &rarr; " + after + ".</div>" +
          "<div style='font-size:11px;opacity:.8'>1 XP spent, " + xp.available + " remaining.</div>";
      }
    } else if (data.act === "expertise") {
      const item = skillItems.find((s) => s.id === data.skill);
      if (!item) { body = "<div>No skill selected.</div>"; }
      else if (item.expertise >= 4) { body = "<div><b>" + item.name + "</b> is already at Ex4, the maximum.</div>"; }
      else {
        const target = item.expertise === 0 ? 2 : item.expertise + 1;
        const cost = EXPERTISE_COST[target];
        const cap = expertiseCap(item.value);
        if (target > cap) {
          body = "<div><b>" + item.name + "</b> at " + item.value + " can support at most Ex" + cap +
            (cap === 0 ? " (below 40, no Expertise yet)" : "") + " &mdash; raise the skill value first.</div>";
        } else if (!(await spend(cost))) {
          body = "<div>Not enough XP: Ex" + target + " on " + item.name + " costs " + cost + ", " + me.name + " has " + xp.available + ".</div>";
        } else {
          await me.updateEmbeddedDocuments("Item", [{ _id: item.id, "system.expertise": target }]);
          body = "<div><b>" + item.name + "</b> gains <b>Ex" + target + "</b> (" + cost + " XP spent, " + xp.available + " remaining). A successful roll now guarantees at least " + target + " SL.</div>";
        }
      }
    } else if (data.act === "newskill") {
      const name = (data.newname || "").trim();
      const cost = data.newtype === "bind" ? 5 : 3;
      const startValue = data.newtype === "bind" ? 10 : 20;
      const group = data.newtype === "bind" ? "Bind" : (data.newgroup === "Language" ? "Language" : "Wise");
      if (!name) { body = "<div>Name the new skill first.</div>"; }
      else if ((me.items ?? []).some((i) => i.type === "skill" && i.name.toLowerCase() === name.toLowerCase())) {
        body = "<div>" + me.name + " already has a skill named " + name + ".</div>";
      } else if (!(await spend(cost))) {
        body = "<div>Not enough XP: a new " + group + " skill costs " + cost + ", " + me.name + " has " + xp.available + ".</div>";
      } else {
        await me.createEmbeddedDocuments("Item", [{
          name, type: "skill", img: "icons/svg/book.svg",
          system: { group, value: startValue, fighting: false, expertise: 0, savvy: false }
        }]);
        body = "<div><b>" + name + "</b> (" + group + ") added at " + startValue + " (" + cost + " XP spent, " + xp.available + " remaining).</div>";
      }
    } else if (data.act === "talent") {
      if (!(await spend(5))) { body = "<div>Not enough XP: a Talent costs 5 XP (more if its own description says otherwise), " + me.name + " has " + xp.available + ".</div>"; }
      else {
        body = "<div>5 XP spent (" + xp.available + " remaining). Opening <b>TBE: Talents</b> to pick it &mdash; if nothing is picked there, re-award the 5 XP by hand.</div>";
        const talentsMacro = game.macros?.getName?.("TBE: Talents");
        if (talentsMacro) setTimeout(() => talentsMacro.execute(), 50);
        else body += "<div style='opacity:.8'>TBE: Talents wasn't found &mdash; run it manually from the Solo Panel.</div>";
      }
    }

    await TBE.say(TBE.card("TBE Advancement", body), []);
  }
}
