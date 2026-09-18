/* TBE: Talents — the ADVANCEMENT tool: spend XP on a new Talent, mid-game,
 * from the full Ch.4 catalogue. Talents are real Items on the actor
 * (system.category/requirements/ranks/specialization), not a line of prose,
 * because they keep mattering after character creation: Enhanced Defense,
 * Armor Training and Solo Constitution change rolls every session.
 *
 * For the FREE picks a new character gets at chargen (race/career/Rounding
 * Out), use TBE: Finish Character's own Talents tab instead -- it shows how
 * many free picks are left and defaults to no XP charge. This macro still
 * has an XP-off toggle underneath (a GM handing out a Talent as a quest
 * reward, say), but chargen is not its main job any more; keeping the two
 * apart is what the "keep chargen and advancement distinct" ask means in
 * practice, since the underlying eligibility check (TBE.talentEligibility in
 * _lib.js) is shared so the two never enforce different rules.
 *
 * Enforces the book's purchase rules rather than only displaying them
 * (p.161: "You must meet any requirements the Talent has before purchase,
 * as listed in its description"):
 *   - race exclusivity
 *   - named-Talent prerequisites, checked against what the actor owns
 *   - creation-only Talents (Patterned in the Weave) are never purchasable
 *   - XP is charged HERE, at each Talent's own cost, so a flat payment can't
 *     buy an unlimited number of Talents in one pass.
 */

const me = TBE.me();
if (!me) {
  ui.notifications?.warn("TBE: select the character's token first.");
} else {
  const owned = (me.items ?? []).filter((i) => i.type === "talent");
  const ownedNames = new Set(owned.map((i) => i.name.toLowerCase()));
  const race = me.system?.race || "";
  const xp = me.system?.experience ?? { available: 0, earned: 0 };
  const available = TBE.num(xp.available, 0);

  /* Race exclusivity, named prerequisites, creation-only, already-taken --
     shared with TBE: Finish Character's Talents tab so both enforce the
     same rules from one place (_lib.js). */
  const { blockedReason, missingPrereq, catalogueNames, stripNegation, rankState } =
    TBE.talentEligibility(TBE_TALENTS, ownedNames, race, TBE_CHARGEN.races || [], { ownedItems: owned });
  /* 16 of the 18 Talents that carry a "Requires ..." clause name another
     Talent, which the shared check resolves outright. The other two point at
     a skill or a supply roll ("Battle-wise Lore skill", "a Medical Supply
     roll"); those can't be resolved mechanically, so they are surfaced as a
     soft note here rather than silently ignored or wrongly blocked.
     stripNegation() here too (not just in missingPrereq) so this doesn't
     independently re-find "Godbound" inside Weapon Of Faith's own negation
     clause and treat it as an already-resolved Talent-name match -- same
     shared check both places, per _lib.js's comment on TBE.talentEligibility. */
  const softRequirement = (t) => !!t.requires && missingPrereq(t) === null &&
    !catalogueNames.some((n) => stripNegation(t.requires).includes(n) && n !== t.name.toLowerCase());
  const costOf = (t) => TBE.num(t.xp, 5);

  /* Grouped under category headings rather than filtered by a dropdown: a
     dialog's inline script is unreliable across Foundry versions, and the whole
     catalogue is only ~150 rows in a scroll box. */
  const cats = [...new Set(TBE_TALENTS.map((t) => t.category))];
  const rows = cats.map((cat) => {
    const inCat = TBE_TALENTS.map((t, i) => ({ t, i })).filter((x) => x.t.category === cat);
    return '<div style="font-weight:bold;margin-top:6px;border-bottom:1px solid #7a6a4f">' + cat +
      " <span style='font-weight:normal;font-size:11px;opacity:.7'>(" + inCat.length + ")</span></div>" +
      inCat.map(({ t, i }) => {
        const block = blockedReason(t);
        const has = ownedNames.has(t.name.toLowerCase());
        const cost = costOf(t);
        const bits = [];
        if (block) bits.push(block);
        else {
          if (has) {
            const st = rankState(t);
            bits.push(st && st.cap !== Infinity
              ? "taken " + st.ranks + " of " + st.cap + " times"
              : "already taken, repeatable: " + t.rank);
          }
          if (softRequirement(t)) bits.push("check first: " + t.requires);
          bits.push(cost + " XP" + (t.xpNote ? " (" + t.xpNote + ")" : ""));
        }
        const desc = (t.desc || "").replace(/<[^>]*>/g, "");
        return '<label style="display:block;margin-bottom:2px;opacity:' + (block ? ".45" : "1") + '" title="' +
          desc.replace(/"/g, "&quot;").slice(0, 400) + '">' +
          '<input type="checkbox" name="t_' + i + '"' + (block ? " disabled" : "") + "> " +
          (t.sub ? "&#8627; " : "") + "<b>" + t.name + "</b>" +
          (bits.length ? ' <span style="font-size:11px;opacity:.75">' + bits.join(" &middot; ") + "</span>" : "") +
          '<div style="font-size:10px;opacity:.6;margin-left:18px;line-height:1.25">' +
          desc.slice(0, 150) + (desc.length > 150 ? "…" : "") + "</div>" +
          "</label>";
      }).join("");
  }).join("");

  const content =
    '<div style="font-size:13px">' +
    "<div><b>" + me.name + "</b>" + (race ? " &middot; " + race : "") +
    " &middot; " + owned.length + " Talent(s) taken &middot; XP available <b>" + available + "</b></div>" +
    '<div style="margin:6px 0;max-height:340px;overflow:auto;border:1px solid #7a6a4f;border-radius:4px;padding:4px">' +
    rows + "</div>" +
    '<label style="display:block">Applies to (for a Talent that asks you to pick a weapon, skill or location): ' +
    '<input type="text" name="spec" placeholder="shortsword, Melee: Medium, Head..." style="width:100%"></label>' +
    '<label style="display:block;margin-top:4px"><input type="checkbox" name="charge" checked> ' +
    "Spend XP for these (untick only for a free GM-granted Talent — for your free character-creation picks, use TBE: Finish Character instead)</label>" +
    '<div style="font-size:11px;opacity:.75;margin-top:4px">Greyed-out rows cannot be taken: already held and not repeatable, ' +
    "exclusive to another race, character-creation only, or a prerequisite you do not have yet.</div>" +
    "</div>";

  const data = await TBE.prompt("Talents", content, "Add");
  if (data) {
    /* Re-check every restriction here rather than trusting the disabled
       attribute: a disabled checkbox is a UI affordance, not a guarantee. */
    const requested = TBE_TALENTS.filter((t, i) => data["t_" + i] === "on");
    const refused = requested.map((t) => ({ t, why: blockedReason(t) })).filter((x) => x.why);
    const picked = requested.filter((t) => !blockedReason(t));
    const charge = data.charge === "on" || data.charge === true || data.charge === "true";
    const total = picked.reduce((n, t) => n + costOf(t), 0);

    if (!picked.length) {
      ui.notifications?.info(refused.length
        ? "TBE: " + refused.map((x) => x.t.name + " (" + x.why + ")").join("; ")
        : "TBE: no Talents selected.");
    } else if (charge && total > available) {
      /* p.161: Talents cost XP. Refusing here is the whole point of the
         change: TBE: Advancement used to take a flat 5 XP once and then let
         this dialog add any number of Talents for it. */
      await TBE.say(TBE.card("Talents", "<div><b>" + me.name + "</b> cannot afford that.</div>" +
        "<div>" + picked.map((t) => t.name + " " + costOf(t) + " XP").join(", ") +
        " = <b>" + total + " XP</b>, available <b>" + available + "</b>.</div>"));
    } else {
      const spec = (data.spec || "").trim();
      const payload = [];
      const bumped = [];
      for (const t of picked) {
        const existing = owned.find((i) => i.name.toLowerCase() === t.name.toLowerCase());
        /* A "per-X" Talent (Armor Piercer per weapon type, Enhanced Defense
           per Combat skill, Shield Beat per shield size) is a SEPARATE
           purchase each time, each with its own specialization. Bumping a
           rank counter would throw the new weapon/skill name away, so those
           get their own row. Genuinely levelled or multi-take Talents still
           rank up. */
        const perX = t.rank === "per-skill";
        if (existing && !perX && t.rank !== "once") {
          /* The book caps most repeatables ("Can be purchased up to three
           * times", "up to five times"). blockedReason() above already
           * refuses a purchase at the cap, before its cost is totalled, so
           * anything reaching here has room. The cap is shown because a rank
           * counter with no ceiling on it tells the player nothing. */
          const st = rankState(t) || { cap: Infinity, ranks: TBE.num(existing.system?.ranks, 1) };
          const next = TBE.num(existing.system?.ranks, 1) + 1;
          await TBE.writeItem(existing, { "system.ranks": next }, "the extra rank of " + t.name);
          bumped.push(t.name + " (now &times;" + next + (st.cap === Infinity ? "" : " of " + st.cap) + ")");
          continue;
        }
        /* Item shape (including the transfer:true ActiveEffects that make a
         * stat Talent actually move its number) is owned by _lib.js, so a
         * Talent granted by NPC/funnel generation is built identically. */
        payload.push(TBE.talentItem(t, spec));
      }
      /* The SAVVY Talent ("Pick one skill and mark an S next to it") names a
         * skill in the specialization box; mark it, or the Talent does nothing
         * and Advancement's +1-per-improvement never fires for it. */
        for (const t of picked) {
          if (!/^savvy$/i.test(t.name.trim())) continue;
          const target = (spec || "").trim();
          const skill = target && me.items.find((i) => i.type === "skill" && i.name.toLowerCase() === target.toLowerCase());
          if (skill) await TBE.writeItem(skill, { "system.savvy": true }, "the Savvy mark");
          else ui.notifications?.warn("TBE: name the skill in \"Applies to\" so Savvy can mark it.");
        }
        /* GODBOUND (Ch.4 p.51): "acquire the Piety skill at a starting value of
         * 30 (or to add 30 during character creation). The Piety value can
         * never be more than 90." Chargen already grants this when Godbound
         * is picked as a CAREER (tbe-character-wizard.js), but this macro
         * is the only place Godbound is ever granted as a Talent -- buying
         * it here charged the 10 XP and added the Talent Item with no
         * corresponding Piety skill, so the Talent's own stated effect
         * never happened. */
        for (const t of picked) {
          if (!/^godbound$/i.test(t.name.trim())) continue;
          const piety = me.items.find((i) => i.type === "skill" && i.name.trim().toLowerCase() === "piety");
          if (piety) {
            const next = Math.min(90, TBE.num(piety.system?.value, 0) + 30);
            await TBE.writeItem(piety, { "system.value": next }, "the Piety increase");
          } else {
            payload.push({
              name: "Piety", type: "skill", img: "icons/svg/book.svg",
              system: { group: "Lore", value: 30, fighting: false, expertise: 0, savvy: false }
            });
          }
        }
        if (payload.length) await me.createEmbeddedDocuments("Item", payload);

      let spentNote = "";
      if (charge && total) {
        const wSpend = await TBE.write(me, { "system.experience.available": available - total }, "the " + total + " XP");
        spentNote = "<div style='font-size:11px;opacity:.85'>" + total + " XP spent, " +
          (available - total) + " remaining." +
          (wSpend.ok ? "" : ' <span style="color:#8b1a1a">Not deducted. ' + TBE.esc(wSpend.notice) + "</span>") + "</div>";
      } else if (!charge) {
        spentNote = "<div style='font-size:11px;opacity:.7'>No XP charged (character creation).</div>";
      }

      const body = "<div><b>" + me.name + "</b></div>" +
        (payload.length ? "<div>Added: " + payload.map((p) => p.name).join(", ") + "</div>" : "") +
        (bumped.length ? "<div>Ranked up: " + bumped.join(", ") + "</div>" : "") +
        (refused.length ? '<div style="color:#8b1a1a">Refused: ' +
          refused.map((x) => x.t.name + " (" + x.why + ")").join(", ") + "</div>" : "") +
        (spec ? '<div style="font-size:11px;opacity:.8">Applies to: ' + spec + "</div>" : "") +
        spentNote;
      await TBE.say(TBE.card("Talents", body));
    }
  }
}
