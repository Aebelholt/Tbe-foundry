/* TBE: Funnel — rolls a town's worth of ordinary people, four to a player, so a
 * campaign can start with the sack of a settlement and find out which of them
 * deserve to become characters.
 *
 * Deliberately not a cut-down character creation. Each townsperson is built the
 * way the book builds a person -- every skill at the starting 20, their trade
 * raising what their trade actually uses, and the two Ability Scores of p.85-86
 * rolled and applied -- but nothing that only matters to a PC (career pools,
 * Cultural Background picks, Life Events, Goals) is spent on someone who may
 * die in the first hour. Survivors get the rest of it from TBE: Funnel Roster,
 * where what happened during the sack decides what they became. */

const CULTURES = Object.keys(TBE_NAMES);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const STANDINGS = Object.keys(TBE.TRADE_STANDING);

const portraitField = await TBE.portraitField("Portraits (for the actors)");
const content =
  '<div style="font-size:13px">' +
  '<label style="display:block">Settlement: <input type="text" name="town" value="Vaunhollow" style="width:100%"></label>' +
  '<label style="display:inline-block;width:49%">Players: <input type="number" name="players" value="4" min="1" max="8" style="width:60px"></label>' +
  '<label style="display:inline-block;width:49%">Townsfolk each: <input type="number" name="each" value="4" min="1" max="8" style="width:60px"></label>' +
  '<label style="display:block">Culture: <select name="culture" style="width:100%">' +
  '<option value="">Mixed (roll each)</option>' +
  CULTURES.map((c) => '<option value="' + c + '">' + c + "</option>").join("") +
  "</select></label>" +
  '<label style="display:block">Standing: <select name="standing" style="width:100%">' +
  '<option value="">Mixed — a few green, a few seasoned</option>' +
  STANDINGS.map((k) => '<option value="' + k + '">Everyone ' + k.toLowerCase() + "</option>").join("") +
  "</select></label>" +
  '<label style="display:block;margin-top:4px"><input type="checkbox" name="actors" checked> Create actors (folder: TBE Funnel — settlement)</label>' +
  '<label style="display:block"><input type="checkbox" name="crossbond" checked> Point Bonds across players, not within one roster</label>' +
  portraitField +
  '<div style="font-size:11px;opacity:.75;margin-top:4px">Trades, Bonds and Scars are table-generated flavour (data/funnel.json), not rulebook content. The skill values and Ability Scores are the book\'s.</div>' +
  "</div>";

const data = await TBE.prompt("The town, before", content, "Roll the town");
if (data) {
  const town = (data.town || "the settlement").trim();
  const players = Math.max(1, Math.min(8, TBE.num(data.players, 4)));
  const each = Math.max(1, Math.min(8, TBE.num(data.each, 4)));
  const wantActors = data.actors === "on" && game.user.isGM;
  const rolls = [];

  /* Everyone first, bonds second: a Bond has to point at a person who exists,
   * and the ones worth having point at another player's roster. */
  const folk = [];
  for (let p = 0; p < players; p++) {
    for (let i = 0; i < each; i++) {
      const culture = data.culture || pick(CULTURES);
      const set = TBE_NAMES[culture];
      const sex = pick(["m", "f"]);
      const name = pick(set[sex] || set.m) + " " + pick(set.s);
      const standing = data.standing || pick(["Green", "Ordinary", "Ordinary", "Seasoned"]);
      const build = await TBE.buildTownsfolk({
        trades: TBE_FUNNEL.trades,
        abilityScores: TBE_CHARGEN.abilityScores || [],
        talents: typeof TBE_TALENTS !== "undefined" ? TBE_TALENTS : [],
        avoidTrades: folk.map((x) => x.build.trade && x.build.trade.name).filter(Boolean),
        standing
      });
      rolls.push(...(build.rolls || []));
      const t = pick(TBE_TRAITS);
      folk.push({ owner: p, name, culture, build, trait: t, bond: null });
    }
  }

  /* One Bond each. Cross-roster by default, because the interesting question
   * in a funnel is which of your four you send to the quarter where someone
   * else's person is trapped. */
  folk.forEach((f, idx) => {
    const others = folk.filter((o, j) => j !== idx);
    const cross = others.filter((o) => o.owner !== f.owner);
    const pool = (data.crossbond === "on" && cross.length) ? cross : others;
    if (!pool.length) return;
    /* A sister from one culture and a brother from another is not a family, it
     * is two rolls. A household tie takes someone of the same culture; when the
     * pool has nobody, the tie itself is rerolled to a trade or town one rather
     * than shipping the mismatch. Trade and town ties cross freely, which is
     * what a market town is. */
    let bond = pick(TBE_FUNNEL.bonds);
    const sameCulture = pool.filter((o) => o.culture === f.culture);
    if (bond.tie === "household" && !sameCulture.length) {
      const outside = TBE_FUNNEL.bonds.filter((b) => b.tie !== "household");
      if (outside.length) bond = pick(outside);
    }
    const from = (bond.tie === "household" && sameCulture.length) ? sameCulture : pool;
    const other = from[Math.floor(Math.random() * from.length)];
    f.bond = { name: other.name, relation: bond.relation };
  });

  let folder = null;
  if (wantActors) {
    const fname = "TBE Funnel — " + town;
    folder = game.folders.find((f) => f.name === fname && f.type === "Actor");
    if (!folder) folder = await Folder.create({ name: fname, type: "Actor" });
  }

  for (const f of folk) {
    if (!wantActors) continue;
    try {
      const img = await TBE.rollPortrait(data.portrait);
      const actor = await Actor.create({
        name: f.name, type: "creature", folder: folder.id,
        ...(img ? { img, prototypeToken: { texture: { src: img } } } : {}),
        system: {
          deathThreshold: { value: 20, max: 20 },
          resolve: { value: 10, max: 10 },
          toughness: 0, difficulty: "Easy", size: "Medium",
          biography:
            "<p><b>" + f.build.trade.name + "</b> of " + town + " &middot; " + f.culture +
              " &middot; " + f.build.standing.toLowerCase() + "</p>" +
            "<p><b>Carries:</b> " + f.build.trade.kit + "<br><b>Knows:</b> " + f.build.trade.knows +
              "<br><b>Would risk it for:</b> " + f.build.trade.stake + "</p>" +
            (f.bond ? "<p><b>Bond:</b> " + f.bond.relation + " — " + f.bond.name + "</p>" : "") +
            "<p><b>Ability Scores:</b> " + f.build.abilityLines.join("; ") + "</p>" +
            "<p><b>Agenda:</b> " + f.trait.agenda + "<br><b>Trigger:</b> " + f.trait.trigger + "</p>"
        },
        /* The system id, not "tbe": see TBE.FLAG_SCOPE. This is a create,
           not an update, so it never validated -- which is exactly why the
           roster that reads it with getFlag() was the half that broke. */
        flags: { [TBE.FLAG_SCOPE]: { funnel: {
          town, owner: "Player " + (f.owner + 1), status: "alive",
          trade: f.build.trade.name, standing: f.build.standing,
          stake: f.build.trade.stake,
          bond: f.bond, scars: [],
          descriptors: f.build.descriptors,
          abilityScores: f.build.abilityPicks
        } } }
      });
      await actor.createEmbeddedDocuments("Item", TBE.skillItemsFrom(f.build.notable));
      const talentItems = f.build.abilityTalents.map((tn) => {
        const cat = TBE.talentNamed(typeof TBE_TALENTS !== "undefined" ? TBE_TALENTS : [], tn);
        return TBE.talentItem(cat || { name: tn, rank: "once" }, "");
      });
      if (talentItems.length) await actor.createEmbeddedDocuments("Item", talentItems);
      f.actorId = actor.id;
    } catch (err) {
      console.error("TBE | funnel actor failed", err);
    }
  }

  /* One card per player: their four people, tight enough to read at the table. */
  for (let p = 0; p < players; p++) {
    const mine = folk.filter((f) => f.owner === p);
    const body = mine.map((f) => {
      const top = f.build.notable.slice(0, 5)
        .map((s) => s.name + " " + s.value + TBE.expertiseTag(s.expertise)).join(" &middot; ");
      return '<div style="border-top:1px solid #7a6a4f;padding-top:4px;margin-top:4px">' +
        '<div style="font-size:15px;font-weight:bold">' + f.name + "</div>" +
        '<div style="font-size:11px;opacity:.85">' + f.build.trade.name + " &middot; " + f.build.standing.toLowerCase() +
          " &middot; " + f.culture + (f.build.descriptors.length ? " &middot; " + f.build.descriptors.join(", ") : "") + "</div>" +
        '<div style="font-size:12px;margin-top:2px">' + top + "</div>" +
        '<div style="font-size:11px;margin-top:2px"><b>Knows</b> ' + f.build.trade.knows + "</div>" +
        '<div style="font-size:11px"><b>Would risk it for</b> ' + f.build.trade.stake + "</div>" +
        (f.bond ? '<div style="font-size:11px"><b>Bond</b> ' + f.bond.relation + " — " + f.bond.name + "</div>" : "") +
        (f.build.abilityTalents.length ? '<div style="font-size:11px"><b>Talent</b> ' + f.build.abilityTalents.join(", ") + "</div>" : "") +
        "</div>";
    }).join("");
    await TBE.say(TBE.card("Player " + (p + 1) + " — " + town,
      body + '<div style="font-size:11px;opacity:.7;margin-top:5px">Everything not listed sits at 20. DT 20, Resolve 10, no armour. They are people.</div>'));
  }

  await TBE.say(TBE.card("The town, before",
    "<div>" + folk.length + " townsfolk across " + players + " players in <b>" + town + "</b>" +
    (wantActors ? ", actors in <b>TBE Funnel — " + town + "</b>" : "") + ".</div>" +
    '<div style="font-size:12px;margin-top:4px">Run the sack. Mark the dead and the scars in <b>TBE: Funnel Roster</b>, and convert whoever walks out.</div>'), rolls);
}
