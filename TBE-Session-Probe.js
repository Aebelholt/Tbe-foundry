/* ============================================================== *
 *  THIS IS THE FILE YOU PASTE INTO FOUNDRY.                      *
 *  New Script macro, paste all of it, run as GM.                 *
 * ============================================================== */
/*
 * TBE SESSION PROBE — reads what a played session left behind in the world.
 *
 * Built after the first real Salt-Run Ambush session (planning through to the
 * camp, roughly three hours, Beat 5 not reached). The point is not to test the
 * code, the check suite does that; it is to find out what ACTUALLY happened at
 * a table, which is the one thing no check can tell you. The last time a played
 * session was mined this way it produced five defects and phase5_check.mjs.
 *
 * Two modes. Set MODE below.
 *
 *   "report"  (default) Read everything the world kept: chat and rolls with
 *             timestamps, pacing, actor end-state, combat and initiative,
 *             the Salt-Run trackers, scenes, and a live health check. Writes
 *             tbe-session-probe.json for you to send back.
 *
 *   "record"  Arm live capture for the NEXT session: rolls, dialogs opened,
 *             and errors, appended to a world setting as they happen.
 *             Read the honest limitation on it below before relying on it.
 *
 * WHAT IT CANNOT DO: console errors from a session already finished are gone.
 * Foundry does not persist them. If the last session threw errors, they are
 * only recoverable from a browser console you still have open. "record" mode
 * exists to catch them next time.
 *
 * PRIVACY: chat is where table talk lives. Roll messages are captured in full
 * because the flavour text is the data (it names the skill, the modifiers and
 * the outcome). Ordinary messages are captured as metadata plus a short
 * preview. Set CHAT_TEXT = "none" to drop all non-roll text entirely.
 */

const MODE = "report";          // "report" or "record"
const HOURS_BACK = 12;          // how far back a session counts; raise if yours ran longer
const CHAT_TEXT = "preview";    // "preview" (160 chars of non-roll messages) or "none"
const GAP_MINUTES = 8;          // a quiet stretch longer than this is treated as a pause

(async () => {
  if (!game.user.isGM) { ui.notifications.error("Run the session probe as GM."); return; }

  const now = Date.now();
  const since = now - HOURS_BACK * 3600 * 1000;
  const mins = (ms) => Math.round(ms / 60000);
  const clock = (ts) => new Date(ts).toISOString().slice(11, 16);
  const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
  /* Tags out, then entities decoded. Our own roll card writes "&mdash;" and
   * "&middot;", and leaving those as literal text breaks every parse below. */
  const ENTITIES = { "&mdash;": "\u2014", "&ndash;": "\u2013", "&middot;": "\u00b7", "&nbsp;": " ",
    "&rarr;": "\u2192", "&larr;": "\u2190", "&times;": "\u00d7",
    "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'" };
  const strip = (html) => {
    let t = String(html ?? "").replace(/<[^>]*>/g, " ");
    for (const [k, v] of Object.entries(ENTITIES)) t = t.split(k).join(v);
    return t.replace(/\s+/g, " ").trim();
  };

  /* ---------------------------------------------------------------- */
  if (MODE === "record") {
    /* Live capture. HONEST LIMITATION: hooks registered from a macro live in
     * the page, so they die on refresh or reload. Re-run this after every
     * reload. It is idempotent and tells you it is armed. Everything lands in
     * a world setting so it survives the reload even though the hooks do not. */
    const KEY = "tbeSessionLog";
    if (!game.settings.settings.has("world." + KEY)) {
      game.settings.register("world", KEY, { scope: "world", config: false, type: Array, default: [] });
    }
    const push = async (entry) => {
      try {
        const log = game.settings.get("world", KEY) ?? [];
        log.push(Object.assign({ t: Date.now() }, entry));
        await game.settings.set("world", KEY, log.slice(-5000));
      } catch (e) { console.error("TBE probe log failed", e); }
    };

    if (globalThis.__tbeProbeArmed) {
      ui.notifications.info("TBE probe: already armed in this page.");
    } else {
      globalThis.__tbeProbeArmed = true;

      Hooks.on("createChatMessage", (msg) => {
        const rolls = msg.rolls ?? (msg.roll ? [msg.roll] : []);
        push({
          kind: rolls.length ? "roll" : "chat",
          who: msg.speaker?.alias ?? null,
          user: game.users.get(msg.user?.id ?? msg.user)?.name ?? null,
          flavor: strip(msg.flavor).slice(0, 300),
          formula: rolls[0]?.formula ?? null,
          total: rolls[0]?.total ?? null
        });
      });

      /* "Catching inputs": which windows people actually opened, and what they
       * were called. This is how you find out whether a tool was used at all. */
      const seen = (app) => push({ kind: "window", app: app?.constructor?.name ?? "?", title: strip(app?.title).slice(0, 120) });
      Hooks.on("renderDialog", seen);
      Hooks.on("renderApplication", seen);
      Hooks.on("renderApplicationV2", seen);

      Hooks.on("error", (loc, err) => push({ kind: "error", where: String(loc).slice(0, 120), msg: String(err?.message ?? err).slice(0, 300) }));
      const prevOnError = window.onerror;
      window.onerror = function (m, src, line, col, err) {
        push({ kind: "windowerror", msg: String(m).slice(0, 300), src: String(src ?? "").slice(-80), line });
        return prevOnError ? prevOnError.apply(this, arguments) : false;
      };
      window.addEventListener("unhandledrejection", (e) =>
        push({ kind: "unhandled", msg: String(e?.reason?.message ?? e?.reason).slice(0, 300) }));

      await push({ kind: "armed", foundry: game.version, system: game.system.version });
      ui.notifications.info("TBE probe ARMED. Re-run it after any page reload. Run in 'report' mode afterwards to collect.");
    }
    return;
  }

  /* ---------------------------------------------------------------- */
  const P = {
    generatedAt: new Date(now).toISOString(),
    window: { hoursBack: HOURS_BACK, since: new Date(since).toISOString() },
    env: {}, pacing: {}, rolls: {}, chat: {}, actors: [], combat: [],
    trackers: null, scenes: [], macros: [], health: [], liveLog: null, notes: []
  };

  /* 1. Environment. Which build actually ran, and what else was loaded. */
  try {
    P.env = {
      foundry: game.version,
      generation: game.release?.generation ?? null,
      system: { id: game.system.id, version: game.system.version },
      world: game.world?.id ?? null,
      activeModules: [...game.modules.values()].filter((m) => m.active).map((m) => `${m.id}@${m.version}`),
      users: game.users.map((u) => ({ name: u.name, gm: u.isGM, character: u.character?.name ?? null }))
    };
    /* The system records the world's migrated version; worth knowing it matches. */
    try { P.env.migratedVersion = game.settings.get(game.system.id, "systemMigrationVersion"); }
    catch (e) { P.env.migratedVersion = "(setting not registered)"; }
  } catch (e) { P.notes.push("env read failed: " + e.message); }

  /* 2. Chat, rolls and pacing. The richest record of what happened, because
   *    every roll carries a timestamp and our own cards carry the outcome. */
  let msgs = [];
  try {
    msgs = game.messages.contents
      .filter((m) => num(m.timestamp, 0) >= since)
      .sort((a, b) => a.timestamp - b.timestamp);

    const rollMsgs = [];
    const plainMsgs = [];
    for (const m of msgs) {
      const rolls = m.rolls ?? (m.roll ? [m.roll] : []);
      const flavor = strip(m.flavor);
      /* WHERE THE TEXT IS depends on which era of this system made the card.
       * The sheet-native roll (v0.31.0+) puts everything in `flavor` and
       * leaves `content` to the dice. Every macro card -- which is all of
       * TBE: Skill Roll, TBE: Attack, TBE: Cast and friends, and therefore
       * most of what a real table actually rolls -- does the opposite:
       * TBE.say() passes the card as `content` and sets no flavour at all.
       * Parsing only `flavor` is how the first real session's probe returned
       * {"(none)": 65} for all 65 rolls and read like a table that barely
       * rolled anything, while the text sat in the field next door. */
      const text = flavor || strip(m.content);
      const base = {
        at: clock(m.timestamp), ts: m.timestamp,
        who: m.speaker?.alias ?? null,
        user: game.users.get(m.user?.id ?? m.user)?.name ?? null
      };
      if (rolls.length) {
        /* Three card shapes produce nearly all the rolls at a table. Each is
         * matched by the literal text its own emitter writes, so if a card is
         * reworded this stops matching loudly (skill: null) rather than
         * quietly attributing the roll to the wrong skill.
         *
         *   sheet   "Perception \u2014 60 +10 = 70 ... SUCCESS with 2 SL"
         *   macro   "TBE Skill Roll Perception 46 +10 \u2192 target 56 91 FAILURE"
         *   attack  "TBE Attack Rann , Shortbow (Missile 70) vs Elspeth (Dodge 60)"
         *
         * Foundry's own combat tracker writes "N rolls for Initiative!", which
         * is not a skill but IS the roll worth watching hardest -- it is the
         * one that showed every creature rolling a formula of "0". */
        let skill = null, kind = null;
        let mm;
        if ((mm = text.match(/^TBE Skill Roll\s+(.+?)\s+\d+\s*(?:[+-]\s*\d+\s*)?\u2192\s*target/))) {
          skill = mm[1].trim(); kind = "macro";
        } else if ((mm = text.match(/^TBE Attack\s+.*?,\s*[^(]*\(([^)]*?)\s+\d+\)/))) {
          skill = mm[1].trim(); kind = "attack";
        } else if (/rolls for Initiative!/i.test(text)) {
          skill = "Initiative"; kind = "initiative";
        } else if ((mm = text.match(/^([^\u2014\-]{2,40}?)\s*[\u2014-]\s*\d/))) {
          skill = mm[1].trim(); kind = "sheet";
        } else if ((mm = text.match(/^TBE ([A-Z][A-Za-z ]+)/))) {
          /* A TBE card we have no specific parser for. Naming it beats
           * "(none)": the aggregate then says which macro is unread. */
          skill = null; kind = "card:" + mm[1].trim();
        }

        const outcome = (text.match(/(CRITICAL SUCCESS|CRITICAL FAILURE|SUCCESS|FAILURE)/) || [])[1] ?? null;
        const sl = num((text.match(/with (\d+) SL/) || text.match(/(?:SUCCESS|FAILURE)\s*\u2014\s*(\d+) SL/) || [])[1], null);
        const target = num((text.match(/\u2192\s*target\s*(\d+)/) || text.match(/=\s*(\d+)/) ||
          text.match(/against (\d+)/) || [])[1], null);
        rollMsgs.push(Object.assign({}, base, {
          formula: rolls[0]?.formula ?? null,
          total: rolls[0]?.total ?? null,
          skill, kind, outcome, sl, target,
          favor: /Favor/.test(text) || null,
          task: (text.match(/task ([+-]\d+)/) || text.match(/\u2192\s*target/) && text.match(/\s([+-]\d+)\s*\u2192/) || [])[1] ?? null,
          flavor: text.slice(0, 300)
        }));
      } else {
        plainMsgs.push(Object.assign({}, base, {
          text: CHAT_TEXT === "none" ? null : strip(m.content).slice(0, 160)
        }));
      }
    }

    P.chat = { total: msgs.length, rolls: rollMsgs.length, plain: plainMsgs.length, plainMsgs };
    P.rolls.all = rollMsgs;

    /* Aggregates: who rolled, what got rolled, and how it went. */
    const by = (arr, key) => arr.reduce((a, x) => { const k = x[key] ?? "(none)"; a[k] = (a[k] || 0) + 1; return a; }, {});
    P.rolls.byActor = by(rollMsgs, "who");
    P.rolls.bySkill = by(rollMsgs, "skill");
    P.rolls.byOutcome = by(rollMsgs, "outcome");
    P.rolls.byFormula = by(rollMsgs, "formula");
    P.rolls.byKind = by(rollMsgs, "kind");
    /* Unparsed rolls are the probe's own blind spots, so it reports them as a
       number instead of letting them vanish into "(none)". If this is a large
       share of the session, the aggregates below are describing a minority of
       what happened and should not be read as the table's habits. */
    P.rolls.unparsed = rollMsgs.filter((r) => !r.skill).length;
    if (rollMsgs.length && P.rolls.unparsed / rollMsgs.length > 0.25) {
      P.notes.push(`${P.rolls.unparsed} of ${rollMsgs.length} rolls could not be attributed to a skill. ` +
        "Sample: " + rollMsgs.filter((r) => !r.skill).slice(0, 3).map((r) => JSON.stringify(r.flavor.slice(0, 60))).join(", ") +
        " -- the roll aggregates are incomplete, not evidence of a quiet table.");
    }

    /* The Initiative formula is worth a dedicated look rather than a line in
       byFormula. A creature whose system.initiative has been corrupted still
       rolls: the formula just resolves to "0" and it acts last, every round,
       silently. That is exactly what the first real session shipped. */
    const initRolls = rollMsgs.filter((r) => r.kind === "initiative");
    const deadInit = initRolls.filter((r) => String(r.formula ?? "") === "0" || num(r.total, -1) === 0);
    P.rolls.initiative = {
      total: initRolls.length,
      byFormula: by(initRolls, "formula"),
      zeroFormula: deadInit.length,
      whoRolledZero: [...new Set(deadInit.map((r) => r.who))]
    };
    if (deadInit.length) {
      P.notes.push(`${deadInit.length} Initiative roll(s) resolved to a formula of 0 (${P.rolls.initiative.whoRolledZero.join(", ")}). ` +
        "Those combatants acted last in every round regardless of their stat line. Check system.initiative on them " +
        "for a comma-joined value; the v0.33.0 migration repairs it.");
    }
    P.rolls.withFavor = rollMsgs.filter((r) => r.favor).length;
    P.rolls.withTaskModifier = rollMsgs.filter((r) => r.task).length;
    const outcomes = rollMsgs.filter((r) => r.outcome);
    P.rolls.successRate = outcomes.length
      ? Math.round(100 * outcomes.filter((r) => /SUCCESS/.test(r.outcome)).length / outcomes.length) + "%"
      : "(no parsed outcomes — rolls may predate the sheet roll card)";

    /* Pacing. Where did three hours actually go? Gaps show the pauses, and
     * the per-30-minute histogram shows where the density was. */
    if (msgs.length) {
      const first = msgs[0].timestamp, last = msgs[msgs.length - 1].timestamp;
      const gaps = [];
      for (let i = 1; i < msgs.length; i++) {
        const d = msgs[i].timestamp - msgs[i - 1].timestamp;
        if (d >= GAP_MINUTES * 60000) {
          gaps.push({ from: clock(msgs[i - 1].timestamp), to: clock(msgs[i].timestamp), minutes: mins(d),
            before: strip(msgs[i - 1].flavor || msgs[i - 1].content).slice(0, 90),
            after: strip(msgs[i].flavor || msgs[i].content).slice(0, 90) });
        }
      }
      const bins = {};
      for (const m of msgs) {
        const k = clock(Math.floor(m.timestamp / 1800000) * 1800000);
        bins[k] = (bins[k] || 0) + 1;
      }
      P.pacing = {
        firstMessage: new Date(first).toISOString(),
        lastMessage: new Date(last).toISOString(),
        spanMinutes: mins(last - first),
        messagesPerHour: Math.round(msgs.length / Math.max(1, (last - first) / 3600000)),
        per30min: bins,
        quietStretches: gaps,
        quietMinutesTotal: gaps.reduce((a, g) => a + g.minutes, 0)
      };
    } else {
      P.notes.push(`No chat messages in the last ${HOURS_BACK}h. Raise HOURS_BACK if the session was longer ago.`);
    }
  } catch (e) { P.notes.push("chat read failed: " + e.message); }

  /* 3. Actors: the state the crew ended the session in. */
  try {
    for (const a of game.actors) {
      if (!["character", "creature"].includes(a.type)) continue;
      const s = a.system ?? {};
      const wounds = {};
      for (const [loc, w] of Object.entries(s.wounds ?? {})) {
        if (num(w?.wp) || num(w?.imp) || w?.inf || w?.septic || num(w?.fw)) {
          wounds[loc] = { wp: num(w.wp), imp: num(w.imp), inf: !!w.inf, septic: !!w.septic, fw: num(w.fw), rb: w.rb ?? null };
        }
      }
      P.actors.push({
        name: a.name, type: a.type,
        resolve: `${num(s.resolve?.value)}/${num(s.resolve?.max)}`,
        deathThreshold: `${num(s.deathThreshold?.value)}/${num(s.deathThreshold?.max)}`,
        fatigue: num(s.fatigue), shock: !!s.shock,
        toughness: num(s.toughness), initiative: s.initiative ?? null,
        armorInitPenalty: s.armorInitPenalty ?? null,
        initiativeEffective: s.initiativeEffective ?? null,
        supply: s.supply ?? null,
        wounds: Object.keys(wounds).length ? wounds : "none",
        skills: a.items.filter((i) => i.type === "skill").length,
        weapons: a.items.filter((i) => i.type === "weapon").map((i) => i.name),
        talents: a.items.filter((i) => i.type === "talent").map((i) => i.name)
      });
    }
  } catch (e) { P.notes.push("actor read failed: " + e.message); }

  /* 4. Combat: did Beat 2 run tracked, and what did initiative actually do?
   *    Worth checking against the armour penalty finding. */
  try {
    for (const c of game.combats) {
      P.combat.push({
        scene: c.scene?.name ?? null, round: c.round, turn: c.turn, active: c.active, started: c.started,
        combatants: c.combatants.map((t) => ({
          name: t.name, initiative: t.initiative,
          actorType: t.actor?.type ?? null,
          sheetInitiative: t.actor?.system?.initiative ?? null,
          effective: t.actor?.system?.initiativeEffective ?? null
        }))
      });
    }
    if (!P.combat.length) P.notes.push("No Combat documents. Beat 2 may have been run without the combat tracker.");
  } catch (e) { P.notes.push("combat read failed: " + e.message); }

  /* 5. The Salt-Run trackers: were they used, or did the GM track by hand? */
  try {
    const j = game.journal.getName("Salt-Run Ambush — Trackers") ?? game.journal.getName("Salt-Run Ambush - Trackers");
    P.trackers = j ? (j.flags?.tbe?.saltRunAmbush ?? "(journal exists, no flag data)") : "(tracker journal not found)";
  } catch (e) { P.notes.push("tracker read failed: " + e.message); }

  /* 6. Scenes and macros actually present. */
  try {
    P.scenes = game.scenes.map((s) => ({
      name: s.name, active: s.active, width: s.width, height: s.height,
      hasBackground: !!(s.background?.src), gridType: s.grid?.type, gridSize: s.grid?.size,
      regions: (s.regions?.contents ?? []).map((r) => ({ name: r.name, behaviors: (r.behaviors?.contents ?? []).map((b) => b.type) })),
      tokens: s.tokens?.size ?? 0
    }));
    P.macros = game.macros.map((m) => m.name).sort();
  } catch (e) { P.notes.push("scene/macro read failed: " + e.message); }

  /* 7. Live health check: the same invariant the Node suite asserts, but run
   *    against the world you actually played in. Every weapon must roll with
   *    a skill its owner really has, or it silently rolls at nothing. */
  try {
    /* World actors AND the synthetic actors behind unlinked tokens. The
       sidebar copy of an enemy is frequently fine while the one on the map,
       which is the one that fought, is not. A check that walks only
       game.actors reports "clean" on a broken table. */
    const everyActor = [...game.actors];
    for (const scene of game.scenes ?? []) {
      for (const t of scene.tokens ?? []) if (!t.isLinked && t.actor) everyActor.push(t.actor);
    }
    for (const a of everyActor) {
      /* A creature's Initiative is a StringField. If two form controls ever
         share that name again it arrives as an array and is stored joined --
         "14,14", then "14,14,NaN". num() of that is NaN, the derived
         Initiative falls to 0, and the creature acts last forever without an
         error anywhere. Found in a real session, fixed in v0.33.0. */
      const rawInit = a.system?.initiative;
      if (typeof rawInit === "string" && (rawInit.includes(",") || rawInit === "NaN")) {
        P.health.push(`${a.name}: system.initiative is "${rawInit}" — corrupted, so it rolls Initiative 0 and acts last. ` +
          "Upgrade to 0.33.0 and let the world check repair it.");
      }
      const skills = a.items.filter((i) => i.type === "skill").map((i) => i.name);
      for (const w of a.items.filter((i) => i.type === "weapon")) {
        const need = w.system?.skillName;
        if (!need) P.health.push(`${a.name}: weapon "${w.name}" names no skill at all`);
        else if (!skills.includes(need)) P.health.push(`${a.name}: weapon "${w.name}" rolls with "${need}", which is NOT on the sheet`);
      }
      const dt = num(a.system?.deathThreshold?.max);
      if (dt && a.type === "character") {
        const ll = Math.ceil(dt / 3) + num(a.system?.lethalityBonus) - num(a.system?.lethalityPenalty);
        if (ll < 1) P.health.push(`${a.name}: derives a Lethality Level of ${ll}`);
      }
    }
    if (!P.health.length) P.health.push("clean: every weapon resolves to a skill its owner has");
  } catch (e) { P.notes.push("health check failed: " + e.message); }

  /* 8. Anything "record" mode captured earlier. */
  try {
    const log = game.settings.get("world", "tbeSessionLog");
    if (Array.isArray(log) && log.length) {
      P.liveLog = { entries: log.length, errors: log.filter((l) => /error|unhandled/.test(l.kind)), sample: log.slice(-200) };
    }
  } catch (e) { /* not armed, which is the normal case */ }

  /* ---- deliver ---- */
  const json = JSON.stringify(P, null, 1);
  console.log("TBE SESSION PROBE", P);

  const summary = [
    `Foundry ${P.env.foundry}, system ${P.env.system?.version}`,
    `${P.chat.total ?? 0} messages, ${P.chat.rolls ?? 0} of them rolls, over ${P.pacing.spanMinutes ?? "?"} minutes`,
    `success rate ${P.rolls.successRate ?? "?"}, Favor spent on ${P.rolls.withFavor ?? 0} rolls, task modifier on ${P.rolls.withTaskModifier ?? 0}`,
    `${P.pacing.quietStretches?.length ?? 0} quiet stretches totalling ${P.pacing.quietMinutesTotal ?? 0} minutes`,
    `${P.actors.length} actors, ${P.combat.length} combat(s)`,
    `health: ${P.health[0]}`
  ].join("<br>");
  ChatMessage.create({ whisper: [game.user.id], content: "<b>TBE Session Probe</b><br>" + summary });

  const save = globalThis.saveDataToFile ?? foundry?.utils?.saveDataToFile ?? null;
  if (save) {
    save(json, "application/json", "tbe-session-probe.json");
    ui.notifications.info("Session probe done. tbe-session-probe.json downloaded — send it to Claude.");
  } else {
    await JournalEntry.create({
      name: "TBE Session Probe Output",
      pages: [{ name: "JSON", type: "text", text: { content: "<pre>" + json.replace(/</g, "&lt;") + "</pre>", format: 1 } }]
    });
    ui.notifications.info("Session probe done. See the journal 'TBE Session Probe Output' and send me its contents.");
  }
})();
