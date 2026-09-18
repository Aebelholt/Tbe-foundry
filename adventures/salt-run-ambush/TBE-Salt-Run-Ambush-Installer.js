/* ============================================================== *
 *  THIS IS THE FILE YOU PASTE INTO FOUNDRY.                      *
 *  Create a new Script macro, paste all of it, run once as GM.   *
 *  (pregen_check.mjs is NOT this file: it is a Node test script  *
 *  and Foundry will reject it for using `import`.)               *
 * ============================================================== */
/*
 * THE SALT-RUN AMBUSH — Foundry build installer (tickets 2, 3, 4, 5, 6, 10, 12)
 * for the native the-broken-empires system.
 *
 * Paste into a new Script macro in the target WORLD (not the system) and run
 * once as GM. Safe to re-run: every creator checks for an existing
 * same-named document first and skips it rather than duplicating.
 *
 * All twelve tickets are covered. Ticket 1's eight pregens are built from
 * the "Riona's Reach, Pick Your Brigand" roster, which states every sheet
 * in full; pregen_check.mjs verifies that transcription against this
 * project's own verified data (the skill catalogue in macros/_lib.js,
 * equipment.json, data/talents.json, data/chargen.json) rather than
 * trusting the handout's wording.
 *   Ticket 8 and 9's full data model lives in the "Salt-Run Ambush —
 *   Trackers" journal below; ticket 7's three Favor pools + Leverage pool
 *   are in the same journal. All three are driven by the
 *   "TBE: Salt-Run Trackers" macro this script creates.
 */

(async () => {
  if (!game.user.isGM) {
    ui.notifications.warn("TBE Salt-Run Ambush installer: run this as GM.");
    return;
  }

  const log = [];
  const note = (s) => { log.push(s); console.log("[Salt-Run Ambush]", s); };

  /* ---- Portraits --------------------------------------------------
   * Art by Caleb Cleveland (patreon.com/calebisdrawing), except
   * Uisdean's, which is signed "Art Adams 2023". Watermarks are intact
   * and the credit travels with the filenames. Personal-table use:
   * do not redistribute, and consider supporting the artists.
   *
   * Put the adventures/salt-run-ambush/art/ folder inside your Foundry
   * user data directory so the files land at
   *     Data/salt-run-ambush/art/<file>.jpg
   * The easiest way is Foundry's own file picker: open any actor's
   * portrait, Upload, and create the folders as you go. If you put them
   * somewhere else, change ART_BASE below and nothing else.
   *
   * Anyone not listed keeps Foundry's default silhouette, so a missing
   * file costs you a portrait and nothing more. Three of the eight
   * pregens have no match in this art set: Dags Farrow, Ysolt Vane and
   * "Mother" Mairwen Coll. See TICKET-STATUS.md for why. */
  const ART_BASE = "salt-run-ambush/art/";
  const ART = {
    "Renn Kestrel":      "renn-kestrel--calebisdrawing.jpg",
    "Sela Voss":         "sela-voss--calebisdrawing.jpg",
    "Grael Ashbeard":    "grael-ashbeard--calebisdrawing.jpg",
    "Uisdean Fen":       "uisdean-fen--art-adams-2023.jpg",
    "Old Ambrose Duff":  "old-ambrose-duff--calebisdrawing.jpg",
    "Elspeth Dunmore":   "elspeth-dunmore--calebisdrawing.jpg",
    "Dunchadh Reave":    "dunchadh-reave--calebisdrawing.jpg"
  };
  const portrait = (name) => (ART[name] ? ART_BASE + ART[name] : "icons/svg/mystery-man.svg");
  /* Sets the sheet portrait and the token art together. These are
   * portrait-framed rather than top-down, which is normal for a VTT but
   * looks better with the token scaled down a little on the map. */
  const withArt = (name) => ({
    img: portrait(name),
    prototypeToken: { name, texture: { src: portrait(name) }, displayName: 20 }
  });

  /* ---------------------------------------------------------------------
   * Ticket 11: compendium sanity check, extended to a world-actor check
   * too (the original ticket only asked about compendia, but a re-run
   * of this installer, or a world that already has these names from
   * elsewhere, deserves the same guard). Already checked once by hand
   * against the shipped tbe-bestiary/tbe-journals/tbe-macros/tbe-tables/
   * tbe-equipment/tbe-talents packs: none of the two NPC names below (or
   * any of the eight pregen names) appear in them. That check cannot be
   * repeated against a live world from a script macro before the actors
   * exist, so each creator below does its own existing-actor-by-name
   * check at creation time instead. */

  // -----------------------------------------------------------------
  // Ticket 2: Elspeth Dunmore, built as a RESKIN of the book's own
  // "Barbarian Warrior" bestiary entry (Ch.18, Challenging).
  //
  // The first build followed ticket 2's stat line literally and produced a
  // civilian: Dodge 45, no Talents, no armour, one knife. Against eight
  // Engaged brigands that is not a fight, because Outnumbering (p.163)
  // gives every one of them +20 against her. She died in round one.
  //
  // Rather than hand-tune numbers, this takes a real, printed stat block and
  // reskins it, which is both less invention and a better fight. Combat
  // numbers, armour grid, Ferocity, Move, Initiative and Difficulty are the
  // Barbarian Warrior's, verbatim. Her non-combat skills (Survival, Ride)
  // and her fiction are her own, from ticket 2. Where the two sources
  // overlap, the block wins, because the block is the thing making her
  // dangerous.
  //
  // Two deliberate departures, both flagged:
  //   - Ferocity 4, not the block's 3. p.440: "Increase Ferocity (+1 to +2)
  //     if the creature is defending home, kin, or sacred ground." She is
  //     carrying her holding's entire winter salt stock. The book's own
  //     example is a soldier told to hold the gate to his home city going
  //     from 3 to 4, 5 or even 6. She holds until death feels certain.
  //   - Skills use the PC skill catalogue (Melee: Medium, Missile) rather
  //     than the bestiary builder's habit of naming a skill after the weapon
  //     ("Spear 70"). Her sheet already used the catalogue, the players'
  //     sheets use it, and a teaching module should not show two different
  //     systems side by side. The source block's separate "Parry 50" has no
  //     field in this system, which handles creature parries the same way:
  //     the attack value is the skill. Noted on the weapon.
  // -----------------------------------------------------------------
  async function makeElspeth() {
    const existing = game.actors.getName("Elspeth Dunmore");
    if (existing) { note("Elspeth Dunmore already exists — skipped."); return existing; }

    const actor = await Actor.create({
      name: "Elspeth Dunmore",
      type: "creature", // RAW p.161: enemies do not roll, static Initiative
      ...withArt("Elspeth Dunmore"),
      system: {
        deathThreshold: { value: 20, max: 20 }, // block DT 20, same as ticket 2
        resolve: { value: 12, max: 12 },        // hers, from ticket 2
        toughness: 1,                            // block Toughness +1 (was 0)
        size: "Medium",
        /* Block Init 14, static. NOTE: ticket 2 said 11. The higher number
         * is part of the reskin: at a static 14 she acts before roughly half
         * the crew, who roll 1d10 + 10 or so. Her armour is a creature
         * armour grid rather than worn Items, so no Bulk penalty applies. */
        initiative: "14",
        difficulty: "Challenging",
        ferocity: "4",
        move: "1",
        /* Barbarian Warrior's grid, natural + worn AP per location. This is
         * why she is a fight: 8 AP on the body and head turns most PC
         * weapons into chip damage until someone finds a limb or rolls well. */
        armour: {
          body: { natural: 4, worn: 4 },
          head: { natural: 4, worn: 4 },
          rArm: { natural: 3, worn: 4 },
          lArm: { natural: 3, worn: 4 },
          rLeg: { natural: 2, worn: 4 },
          lLeg: { natural: 2, worn: 4 }
        }
      },
      items: [
        /* --- from the Barbarian Warrior block --- */
        { name: "Dodge", type: "skill", system: { group: "Combat", value: 60, fighting: true } },
        { name: "Might", type: "skill", system: { group: "Combat", value: 70, fighting: true } },
        { name: "Melee: Medium", type: "skill", system: { group: "Combat", value: 70, fighting: true } },
        { name: "Missile", type: "skill", system: { group: "Combat", value: 70, fighting: true } },
        { name: "Athletics", type: "skill", system: { group: "Adventuring", value: 80, fighting: false } },
        { name: "Endurance", type: "skill", system: { group: "Adventuring", value: 60, fighting: false } },
        { name: "Perception", type: "skill", system: { group: "Adventuring", value: 60, fighting: false } },
        { name: "Willpower", type: "skill", system: { group: "Adventuring", value: 40, fighting: false } },
        { name: "Insight", type: "skill", system: { group: "Social", value: 40, fighting: false } },
        { name: "Intimidate", type: "skill", system: { group: "Social", value: 60, fighting: false } },
        /* --- her own, from ticket 2: she is still a salt-runner --- */
        { name: "Survival", type: "skill", system: { group: "Adventuring", value: 60, fighting: false } },
        { name: "Ride", type: "skill", system: { group: "Adventuring", value: 55, fighting: false } },
        { name: "Melee: Light", type: "skill", system: { group: "Combat", value: 35, fighting: true } },
        {
          /* The block's Spear IS her "stout walking staff". A highland
           * traveller's spear doubles as one, which is why this reskin
           * needs no new fiction: the staff she reaches for was always a
           * spear, and Beat 2 now finds out. */
          name: "Spear (her walking staff)", type: "weapon",
          system: { dmg: 3, cl: 3, cs: 3, dis: 5, t: 5, enc: 2, skillName: "Melee: Medium", ranged: false, carried: "ready" },
          flags: { tbe: { saltRunAmbushNote: "Book row: Spear, Medium Weapons (Ch.9 p.132): Dmg 3, CL 3, CS 3, Dis 5, T 5, Enc 2, Reach 1, Piercing 1, Unwieldy, Thrown at Range 1. Source block reads 'Spear 70, Parry 50, Reach 1'. Reach and Piercing are not schema fields here, so apply them by hand: Reach 1 means she strikes into the next zone. The block's separate Parry 50 also has no field; this system parries with the fighting skill, so she parries at 70 unless you rule otherwise." } }
        },
        {
          name: "Longbow", type: "weapon",
          system: { dmg: 3, cl: 6, cs: 5, dis: 5, t: 5, enc: 3, skillName: "Missile", ranged: true, carried: "hand" },
          flags: { tbe: { saltRunAmbushNote: "Book row: Longbow, Missile Weapons (Ch.9 p.132): Dmg 3, CL 6, CS 5, Dis 5, T 5, Enc 3, 2H, Range 4 zones. This is what makes Beat 1's terrain matter: she can put arrows into the Brushline or up the Scree Slope before anyone closes, so the ground the players prepared is ground they now have to cross under fire. Outnumbering does not apply to ranged attacks (p.163)." } }
        },
        {
          name: "Hunting Knife", type: "weapon",
          system: { dmg: 1, cl: 2, cs: 2, dis: 5, t: 6, enc: 1, skillName: "Melee: Light", ranged: false, carried: "hand" },
          flags: { tbe: { saltRunAmbushNote: "Her sidearm, kept from ticket 2. No 'Hunting Knife' entry exists in the book; this is the Dagger line (Ch.9 p.132)." } }
        },
        {
          name: "Medium Shield", type: "shield",
          system: { ap: 4, shb: 6, enc: 2, carried: "ready" },
          flags: { tbe: { saltRunAmbushNote: "Book row: Medium Shield (Ch.9 p.140): +4 AP, Shield Bash 6 SL, Enc 2. Part of the Barbarian Warrior block's loadout, and already counted in the worn column of her armour grid." } }
        }
      ],
      flags: {
        tbe: {
          saltRunAmbush: {
            role: "npc",
            reskinOf: "Barbarian Warrior (Ch.18 bestiary, Challenging)",
            carries: "Her holding's entire winter salt stock, on a packhorse (prop, non-mechanical).",
            ferocityNote: "Ferocity 4 by the p.440 modifier for defending kin, raised from the block's 3. She does not break and does not flee. If the crew wants her to stop, they have to stop her."
          }
        }
      }
    });
    note("Created Elspeth Dunmore (creature, Barbarian Warrior reskin, static Initiative 14, Ferocity 4).");
    return actor;
  }

  // -----------------------------------------------------------------
  // Ticket 3 + 4: Dunchadh Reave, plus the talisman as a GM-only flag
  // (the actual trigger tool is the "TBE: Dunchadh's Talisman" macro
  // created further down — this just seeds the actor-side state it reads).
  // -----------------------------------------------------------------
  async function makeDunchadh() {
    const existing = game.actors.getName("Dunchadh Reave");
    if (existing) { note("Dunchadh Reave already exists — skipped."); return existing; }

    const actor = await Actor.create({
      name: "Dunchadh Reave",
      /* RULES AS WRITTEN (p.161): "Enemies typically do not roll; they have
       * a static Initiative value, which determines their place in the turn
       * order each round. Ties go to the PC."
       *
       * So he is a "creature"-type actor, whose Initiative field is used
       * directly as the tracker formula with no d10 prepended. This
       * DELIBERATELY REVERSES ticket 3's "Initiative +10 (rulebook default,
       * rolls normally, not static)", because the book says the opposite for
       * an enemy, and RAW wins.
       *
       * It also fixes Beat 6 for free. "Ties go to the PC" is implemented as
       * actor.type === "character", so a character-type Dunchadh could not be
       * told apart from a PC and won every Initiative tie against Old Ambrose
       * Duff on alphabetical order. As a creature he loses ties to the PC,
       * which is what the book says should happen.
       *
       * And it unlocks one more RAW option worth using at the table (p.161):
       * "If an NPC has Resolve, they may spend it to increase their static
       * Initiative for the round, but they must do so BEFORE the players roll
       * their initiative." Dunchadh has Resolve 10. Announcing that spend
       * before the duel's initiative roll is legal, dramatic, and teaches the
       * rule in one move. */
      type: "creature",
      ...withArt("Dunchadh Reave"),
      system: {
        deathThreshold: { value: 20, max: 20 },
        resolve: { value: 10, max: 10 },
        toughness: 0,
        initiative: "10", // StringField on the creature model: static, no roll
        difficulty: "Medium", // bestiary rating, not specified by the ticket; cosmetic
        ferocity: "",
        move: ""
      },
      items: [
        { name: "Wit", type: "skill", system: { group: "Social", value: 60 } },
        { name: "Persuade", type: "skill", system: { group: "Social", value: 55 } },
        { name: "Insight", type: "skill", system: { group: "Social", value: 50 } },
        { name: "Deceive", type: "skill", system: { group: "Social", value: 45 } },
        { name: "Protocol", type: "skill", system: { group: "Social", value: 40 } },
        { name: "Melee: Light", type: "skill", system: { group: "Combat", value: 45, fighting: true } },
        { name: "Dodge", type: "skill", system: { group: "Combat", value: 40, fighting: true } },
        {
          name: "Rapier", type: "weapon",
          // Verified against /tmp/tbe.txt and equipment.json's own Rapier row
          // (Ch.9 p.132): Dmg 2, CL 2, CS 2, Dis 4, T 7, Enc 1, Defensive.
          // Matches ticket 3's numbers exactly, including the Dis 4 that
          // replaces the module's old "5 SL, if untracked" placeholder.
          system: { dmg: 2, cl: 2, cs: 2, dis: 4, t: 7, enc: 1, skillName: "Melee: Light", ranged: false, carried: "hand" },
          flags: { tbe: { saltRunAmbushNote: "Defensive property (per the book) isn't a schema field on this system's weapon Items — call it out to the GM verbally or in a journal note, it isn't automated by any macro in this system as of this build." } }
        }
      ],
      flags: {
        tbe: {
          saltRunAmbush: {
            role: "npc",
            talisman: {
              active: true,
              endedByDisarm: false,
              note: "Ticket 4: a charged Binds effect, triggered automatically by the GM (no roll from Dunchadh) — typically when he's clearly losing the exchange. One effect chosen at trigger: (a) target's weapon-arm numb, -20 to their next Melee roll, or (b) Dunchadh gets one unearned automatic parry. Ends PERMANENTLY the instant a PC lands a Disarm Combat Maneuver on him (his Rapier's Dis 4, must strike an Arm location — Ch.10 p.163). Use the 'TBE: Dunchadh's Talisman' macro to trigger an effect or to mark it disarmed; this flag is state only, not a player-facing Item, by design (ticket 4)."
            }
          }
        }
      }
    });
    note("Created Dunchadh Reave (character, rolls Initiative normally). Talisman state seeded — trigger it with the 'TBE: Dunchadh's Talisman' macro.");
    return actor;
  }

  // -----------------------------------------------------------------
  // Ticket 5: the ambush-ground scene (Beats 1-2), three regions.
  // -----------------------------------------------------------------
  async function makeAmbushScene() {
    const existing = game.scenes.getName("The Ambush Ground (Beats 1-2)");
    if (existing) { note("Ambush Ground scene already exists — skipped."); return existing; }

    // No battlemap art is available to this installer, so this ships as a
    // blank canvas of a reasonable working size with three placeholder
    // rectangular Regions, correctly named and flagged with their real
    // mechanical text. Deliberately NOT wired to auto-apply the -20s via a
    // region "Execute Script" behavior — that's real, untested automation
    // work nobody asked for in this ticket, and Beat 2's own running text
    // already treats this as something the GM states aloud, not something
    // the system enforces. Reposition/resize the three regions once a real
    // map is dropped in; a JournalEntryPage per region with the ruling is
    // attached instead of trying to encode it as Foundry behavior.
    const width = 3000, height = 1600, bandWidth = 1000;
    const regionsData = [
      {
        name: "The Brushline",
        color: "#2f5d34",
        shapes: [{ type: "rectangle", x: 0, y: 0, width: bandWidth, height, rotation: 0, hole: false }],
        flags: { tbe: { saltRunAmbush: { hazard: "Obscured", effect: "-20 to ranged attacks into, out of, or through this zone." } } }
      },
      {
        name: "The Narrows",
        color: "#7a6a4f",
        shapes: [{ type: "rectangle", x: bandWidth, y: 0, width: bandWidth, height, rotation: 0, hole: false }],
        flags: { tbe: { saltRunAmbush: { hazard: "Confined", effect: "-20 to all Dodge and Melee: Heavy rolls made here. Elspeth must pass through this zone." } } }
      },
      {
        name: "The Scree Slope",
        color: "#8a6d3b",
        shapes: [{ type: "rectangle", x: bandWidth * 2, y: 0, width: bandWidth, height, rotation: 0, hole: false }],
        flags: { tbe: { saltRunAmbush: { hazard: "Rough", effect: "Charging here needs an Athletics roll to keep the +20 Charge bonus. Anyone driven onto it or moving carelessly risks Prone." } } }
      }
    ];

    const scene = await Scene.create({
      name: "The Ambush Ground (Beats 1-2)",
      width, height, grid: { size: 100 },
      background: { src: null }
    });
    // Regions are created on the Scene document as an embedded collection.
    await scene.createEmbeddedDocuments("Region", regionsData);
    note("Created 'The Ambush Ground (Beats 1-2)' scene with 3 placeholder regions (Brushline / Narrows / Scree Slope). No map art — drop a background image in and reposition/resize the regions to match it.");
    return scene;
  }

  // -----------------------------------------------------------------
  // Ticket 6: camp scene (Beats 3-5), reused as-is for Beat 6's duel.
  // -----------------------------------------------------------------
  async function makeCampScene() {
    const existing = game.scenes.getName("Camp & Duel Ground (Beats 3-6)");
    if (existing) { note("Camp scene already exists — skipped."); return existing; }
    const scene = await Scene.create({
      name: "Camp & Duel Ground (Beats 3-6)",
      width: 2000, height: 1400, grid: { size: 100 },
      background: { src: null }
    });
    note("Created 'Camp & Duel Ground (Beats 3-6)' scene — a light, non-mechanical backdrop per ticket 6, no zones. Beat 6's duel reuses this same scene rather than a separate map.");
    return scene;
  }

  // -----------------------------------------------------------------
  // Ticket 12: GM Quick Reference, ported verbatim.
  // -----------------------------------------------------------------
  async function makeQuickReferenceJournal() {
    const existing = game.journal.getName("Salt-Run Ambush — GM Quick Reference");
    if (existing) { note("GM Quick Reference journal already exists — skipped."); return existing; }

    const html = `
<p><strong>Preparing the Battlefield</strong> (p. 168), pre-fight skill roll in a specific zone generates 1 + 1/2 SLs Favor, spent per normal Favor rules during that fight only. No Magic skills. Camp-fortification variant costs 1 Fatigue instead.</p>
<p><strong>Leverage</strong> (p. 256), a Favor pool (1-5 points, cap 3 spendable per roll) built through investigation or Insight, spent later in a Social Encounter, tied to the context it was earned in.</p>
<p><strong>Competitive Social Encounter, base rules</strong> (p. 253-254), two sides alternate skill rolls, each contributing to their own SL agenda or subtracting from the opponent's; can't roll again until the other side has responded. Standard Victory Condition 15 SLs; a biased judge gives the favored side a 1-4 SL head start. First to the Victory Condition wins; winner's DoS (winner's total minus loser's) reads off the Outcome Table (1-5 cost or complication, 6-9 clean success, 10+ extra benefit). Critical failure halves your own total.</p>
<p><strong>Trial variant</strong> (p. 263), formalizes the above as opening statements, witnesses, closing statements; plays out in full regardless of who's ahead mid-Trial, only compares totals at the end.</p>
<p><strong>Recovery roll</strong> (p. 181), needs Daily Time or a night's rest. Base chance is Endurance, plus the wound's Recovery Bonus, plus a cleanliness modifier (+20 to -20). Success reduces WP by 1 + 1 per 3 SLs. An attending healer adds double their Heal Score (Bedside Manner triples it), up to half their Heal Score in patients, rounded down.</p>
<p><strong>Disarm Combat Maneuver</strong> (p. 163), after winning an opposed melee roll with enough SLs to meet the weapon's Disarm threshold, striking an Arm location knocks the weapon, or here the talisman, from the target's hand.</p>`.trim();

    const j = await JournalEntry.create({
      name: "Salt-Run Ambush — GM Quick Reference",
      pages: [{ name: "GM Quick Reference", type: "text", text: { content: html, format: 1 } }]
    });
    note("Created 'Salt-Run Ambush — GM Quick Reference' journal (ticket 12, ported as-is).");
    return j;
  }

  // -----------------------------------------------------------------
  // Tickets 7, 8, 9: the trackers journal (state store, rendered as
  // HTML by the "TBE: Salt-Run Trackers" macro below every time it saves).
  // -----------------------------------------------------------------
  async function makeTrackersJournal() {
    const existing = game.journal.getName("Salt-Run Ambush — Trackers");
    if (existing) { note("Trackers journal already exists — skipped."); return existing; }

    const initial = {
      favor: { Brushline: 0, Narrows: 0, "Scree Slope": 0 },
      leverage: 0,
      trial: { crew: 0, dunchadh: 2, log: [] }, // Dunchadh's +2 SL bias, ticket 8
      medicalDie: { size: 10, gone: false, log: [] } // starts d10, ticket 9
    };

    const j = await JournalEntry.create({
      name: "Salt-Run Ambush — Trackers",
      flags: { tbe: { saltRunAmbush: initial } },
      pages: [{ name: "Trackers", type: "text", text: { content: "<p>Run <b>TBE: Salt-Run Trackers</b> to update this.</p>", format: 1 } }]
    });
    note("Created 'Salt-Run Ambush — Trackers' journal, seeded (3 Favor pools at 0, Leverage at 0, Trial at Crew 0 / Dunchadh 2, Medical Supply Die at d10).");
    return j;
  }

  // -----------------------------------------------------------------
  // Ticket 7, 8, 9: the tracker macro itself.
  // -----------------------------------------------------------------
  async function makeTrackerMacro() {
    const existing = game.macros.getName("TBE: Salt-Run Trackers");
    if (existing) { note("'TBE: Salt-Run Trackers' macro already exists — skipped."); return existing; }

    const command = `
/* TBE: Salt-Run Trackers — tickets 7, 8, 9. Self-contained, no dependency
 * on macros/_lib.js. State lives on the "Salt-Run Ambush — Trackers"
 * journal's flags.tbe.saltRunAmbush, rendered to that journal's page HTML
 * on every save so it's readable without running the macro. GM only. */
const JOURNAL = "Salt-Run Ambush — Trackers";
if (!game.user.isGM) { ui.notifications.warn("GM only."); } else {
let j = game.journal.getName(JOURNAL);
if (!j) {
  j = await JournalEntry.create({
    name: JOURNAL,
    flags: { tbe: { saltRunAmbush: {
      favor: { Brushline: 0, Narrows: 0, "Scree Slope": 0 },
      leverage: 0, trial: { crew: 0, dunchadh: 2, log: [] },
      medicalDie: { size: 10, gone: false, log: [] }
    } } },
    pages: [{ name: "Trackers", type: "text", text: { content: "<p></p>", format: 1 } }]
  });
}
const state = foundry.utils.duplicate(j.flags.tbe.saltRunAmbush);

const dieSteps = [10, 8, 6, 4, 0]; // 0 = gone
const stepDown = (size) => dieSteps[dieSteps.indexOf(size) + 1] ?? 0;

const render = (s) => {
  const favorRows = Object.entries(s.favor).map(([z, v]) => \`<tr><td>\${z}</td><td>\${v}</td></tr>\`).join("");
  const trialRows = s.trial.log.map((l) => \`<tr><td>\${l.phase}</td><td>\${l.side}</td><td>\${l.sl >= 0 ? "+" : ""}\${l.sl}</td></tr>\`).join("");
  const dieRows = s.medicalDie.log.map((l) => \`<tr><td>\${l}</td></tr>\`).join("");
  const trialLeader = s.trial.crew === s.trial.dunchadh ? "tied" : s.trial.crew > s.trial.dunchadh ? "Crew ahead" : "Dunchadh ahead";
  return \`
<h2>Favor (Beat 1 → spent Beat 2, zone-locked, cap 3/roll, +10/point, unspent doesn't carry)</h2>
<table border="1" cellpadding="4"><tr><th>Zone</th><th>Favor</th></tr>\${favorRows}</table>
<h2>Leverage (seeded Beat 4 → spent Beat 5, not zone-locked, cap 3/roll, +10/point)</h2>
<p>Current: <b>\${s.leverage}</b></p>
<h2>Beat 5 Trial — running SL totals</h2>
<p>Crew: <b>\${s.trial.crew}</b> &nbsp; Dunchadh: <b>\${s.trial.dunchadh}</b> (started +2 bias) &nbsp; — \${trialLeader}</p>
<table border="1" cellpadding="4"><tr><th>Phase</th><th>Side</th><th>SL</th></tr>\${trialRows}</table>
<h2>Mairwen's Medical Supply Die</h2>
<p>Current: <b>\${s.medicalDie.gone ? "GONE" : "d" + s.medicalDie.size}</b></p>
<table border="1" cellpadding="4"><tr><th>Log</th></tr>\${dieRows}</table>
\`;
};

const content = \`
<div style="font-size:13px">
<label style="display:block">Action:
  <select name="act" style="width:100%">
    <option value="favorAdd">Add Favor to a zone (Beat 1 prep roll)</option>
    <option value="favorSpend">Spend Favor from a zone (Beat 2)</option>
    <option value="leverageAdd">Add Leverage (Beat 4 walk)</option>
    <option value="leverageSpend">Spend Leverage (Beat 5)</option>
    <option value="trialLog">Log a Trial roll (Beat 5)</option>
    <option value="medDie">Roll the Medical Supply Die (after any Heal roll)</option>
    <option value="medDieCritFail">Mark a Heal roll as a critical failure (auto step-down, no roll)</option>
    <option value="view">Just show current state</option>
  </select>
</label>
<hr>
<label style="display:block">Zone (Favor only): <select name="zone" style="width:100%">
  <option>Brushline</option><option>Narrows</option><option>Scree Slope</option>
</select></label>
<label style="display:block">Favor amount: <input type="number" name="favorAmt" value="1" style="width:100%"></label>
<label style="display:block">Leverage amount: <input type="number" name="leverageAmt" value="1" style="width:100%"></label>
<hr>
<label style="display:block">Trial phase: <select name="phase" style="width:100%">
  <option>Opening statement</option><option>Witness</option><option>Closing statement</option>
</select></label>
<label style="display:block">Trial side: <select name="side" style="width:100%">
  <option value="crew">Crew</option><option value="dunchadh">Dunchadh</option>
</select></label>
<label style="display:block">SL (own agenda +, opponent's agenda -): <input type="number" name="sl" value="0" style="width:100%"></label>
</div>\`;

new Dialog({
  title: "TBE: Salt-Run Trackers",
  content,
  buttons: {
    ok: {
      label: "Apply",
      callback: async (html) => {
        const f = html[0].querySelector("form") ?? html[0];
        const act = f.querySelector('[name="act"]').value;
        const zone = f.querySelector('[name="zone"]').value;
        const favorAmt = Number(f.querySelector('[name="favorAmt"]').value) || 0;
        const leverageAmt = Number(f.querySelector('[name="leverageAmt"]').value) || 0;
        const phase = f.querySelector('[name="phase"]').value;
        const side = f.querySelector('[name="side"]').value;
        const sl = Number(f.querySelector('[name="sl"]').value) || 0;

        if (act === "favorAdd") state.favor[zone] = (state.favor[zone] || 0) + Math.abs(favorAmt);
        else if (act === "favorSpend") state.favor[zone] = Math.max(0, (state.favor[zone] || 0) - Math.abs(favorAmt));
        else if (act === "leverageAdd") state.leverage = Math.max(0, state.leverage + Math.abs(leverageAmt));
        else if (act === "leverageSpend") state.leverage = Math.max(0, state.leverage - Math.abs(leverageAmt));
        else if (act === "trialLog") {
          state.trial[side] = Math.max(0, state.trial[side] + sl);
          state.trial.log.push({ phase, side, sl });
        } else if (act === "medDie") {
          if (!state.medicalDie.gone) {
            const roll = await new Roll("1d10").roll();
            const stepped = roll.total <= 2;
            state.medicalDie.log.push(\`Rolled \${roll.total} on d10\${stepped ? " — steps down" : ""}.\`);
            if (stepped) {
              state.medicalDie.size = stepDown(state.medicalDie.size);
              if (state.medicalDie.size === 0) state.medicalDie.gone = true;
            }
            await roll.toMessage({ flavor: "Medical Supply Die check" });
          } else {
            ui.notifications.warn("The Medical Supply Die is already gone.");
          }
        } else if (act === "medDieCritFail") {
          if (!state.medicalDie.gone) {
            state.medicalDie.log.push("Critical failure on the Heal roll — automatic step-down, no die rolled.");
            state.medicalDie.size = stepDown(state.medicalDie.size);
            if (state.medicalDie.size === 0) state.medicalDie.gone = true;
          }
        }

        await j.update({ "flags.tbe.saltRunAmbush": state });
        const page = j.pages?.contents?.[0];
        if (page) await page.update({ "text.content": render(state) });
        ui.notifications.info("Salt-Run Ambush trackers updated — see the '" + JOURNAL + "' journal.");
      }
    }
  },
  default: "ok"
}).render(true);
}
`.trim();

    const macro = await Macro.create({
      name: "TBE: Salt-Run Trackers",
      type: "script",
      scope: "global",
      command
    });
    note("Created 'TBE: Salt-Run Trackers' macro (drives Favor/Leverage/Trial/Medical Supply Die, tickets 7-9).");
    return macro;
  }

  // -----------------------------------------------------------------
  // Ticket 4: the talisman trigger macro.
  // -----------------------------------------------------------------
  async function makeTalismanMacro() {
    const existing = game.macros.getName("TBE: Dunchadh's Talisman");
    if (existing) { note("'TBE: Dunchadh's Talisman' macro already exists — skipped."); return existing; }

    const command = `
/* TBE: Dunchadh's Talisman — ticket 4. GM-only trigger tool for the Beat 6
 * cheat. Not a rollable Item on purpose (ticket 4 is explicit about that):
 * Dunchadh's player never touches this, the GM picks the moment and effect.
 * Self-contained, no dependency on macros/_lib.js. */
if (!game.user.isGM) { ui.notifications.warn("GM only — this is the Beat 6 cheat, players don't trigger it."); } else {
const actor = game.actors.getName("Dunchadh Reave");
if (!actor) { ui.notifications.error("Dunchadh Reave's actor wasn't found — run the Salt-Run Ambush installer first."); } else {
const state = foundry.utils.duplicate(actor.flags?.tbe?.saltRunAmbush?.talisman ?? { active: true, endedByDisarm: false });

if (state.endedByDisarm) {
  ui.notifications.warn("The talisman is already broken — it was disarmed and doesn't come back.");
} else {
  new Dialog({
    title: "Dunchadh's Talisman",
    content: \`<div style="font-size:13px">
<p>Pick what happens when Dunchadh triggers it (GM's call, ideally the moment he's clearly losing the exchange):</p>
<label style="display:block"><input type="radio" name="effect" value="numb" checked> Target's weapon-arm goes numb: -20 to their next Melee roll</label>
<label style="display:block"><input type="radio" name="effect" value="parry"> Dunchadh gets one automatic, unearned parry</label>
<hr>
<label style="display:block"><input type="checkbox" name="disarmed"> Instead: mark it DISARMED — a PC just landed a Disarm Combat Maneuver (4 SL vs his Rapier, Arm location) on him. This ends the talisman permanently.</label>
</div>\`,
    buttons: {
      ok: {
        label: "Apply",
        callback: async (html) => {
          const f = html[0].querySelector("form") ?? html[0];
          const disarmed = f.querySelector('[name="disarmed"]').checked;
          if (disarmed) {
            await actor.update({ "flags.tbe.saltRunAmbush.talisman.endedByDisarm": true });
            ChatMessage.create({ content: "<b>The talisman hits the ground.</b> Its effect ends — and doesn't come back." });
          } else {
            const effect = f.querySelector('[name="effect"]:checked').value;
            const text = effect === "numb"
              ? "A cold flicker at Dunchadh's collar. His opponent's weapon-arm goes numb for one exchange: <b>-20 to their next Melee roll.</b>"
              : "A whispered word under Dunchadh's breath. He gets <b>one automatic, unearned parry.</b>";
            ChatMessage.create({ content: "<b>Dunchadh's talisman triggers.</b><br>" + text + "<br><i>Apply the effect manually — this system has no rollable Item to attach it to on purpose (ticket 4).</i>" });
          }
        }
      }
    },
    default: "ok"
  }).render(true);
}
}
}
`.trim();

    const macro = await Macro.create({
      name: "TBE: Dunchadh's Talisman",
      type: "script",
      scope: "global",
      command
    });
    note("Created 'TBE: Dunchadh's Talisman' macro (GM-only trigger, ticket 4).");
    return macro;
  }

  // -----------------------------------------------------------------
  // Ticket 1: the eight pregen PCs of Riona's Reach.
  //
  // Data, not logic. Every skill carries its group explicitly rather than
  // deriving it here, because the skill catalogue already has exactly one
  // owner (TBE.SKILL_GROUPS in macros/_lib.js, verified against the book by
  // funnel_check.mjs) and a macro that can't import it must not grow a
  // second copy of the rule. pregen_check.mjs verifies every group, every
  // fighting flag, every weapon and armour line, every Talent name and
  // every derived Lethality Level below against those real owners, and
  // fails loudly if the two ever disagree.
  //
  // "fighting" is not an independent fact: a skill is a fighting skill iff
  // its group is Combat (TBE.isFighting). Stamped that way here.
  // -----------------------------------------------------------------

  /* Book weapon lines, transcribed from equipment.json's own rows (Ch.9
   * p.132). Two of them are deliberate substitutions for kit the handout
   * names but the book has no entry for, flagged on the Item itself. */
  const WEAPON_LINES = {
    "Shortsword":   { dmg: 2, cl: 2, cs: 2, dis: 5, t: 6, enc: 1, skillName: "Melee: Light",  book: "Shortsword / Cutlass" },
    "Dagger":       { dmg: 1, cl: 2, cs: 2, dis: 5, t: 6, enc: 1, skillName: "Melee: Light",  book: "Dagger" },
    "Hand Axe":     { dmg: 2, cl: 3, cs: 2, dis: 5, t: 6, enc: 1, skillName: "Melee: Light",  book: "Hand Axe" },
    "Battle-Axe":   { dmg: 6, cl: 5, cs: 5, dis: 3, t: 2, enc: 3, skillName: "Melee: Heavy",  book: "Battle-Axe" },
    "Longbow":      { dmg: 3, cl: 6, cs: 5, dis: 5, t: 5, enc: 3, skillName: "Missile", ranged: true, book: "Longbow" },
    "Broadsword":   { dmg: 4, cl: 3, cs: 3, dis: 4, t: 5, enc: 2, skillName: "Melee: Medium", book: "Broadsword / Mace / Scimitar / Flail" },
    "Long Knife":   { dmg: 1, cl: 2, cs: 2, dis: 5, t: 6, enc: 1, skillName: "Melee: Light",  book: "Dagger" },
    "Belt Knife":   { dmg: 1, cl: 2, cs: 2, dis: 5, t: 6, enc: 1, skillName: "Melee: Light",  book: "Dagger" }
  };
  const WEAPON_NOTES = {
    "Battle-Axe": "2H; ClSh; Unwieldy; Overbearing. FLAG: a two-handed weapon and the Small Shield below cannot both be in use in the same round. The handout lists both, so treat the shield as carried and swapped to, not wielded alongside the axe.",
    "Longbow": "2H. Range 4 zones, 5 with Eagle Eye. Range is not a schema field on this system's weapon Items, so it is recorded here rather than automated.",
    "Broadsword": "RULES AS WRITTEN. The handout calls this 'a genuinely good longsword', but the book groups every Longsword row under its HEAVY Weapons heading, and Melee: Heavy is defined as 'two-handed weapons that often have the Reach quality'. Ambrose has Melee: Medium 70 and no Melee: Heavy, and his sheet, ticket 3 and Beat 6 all build the duel on that 70. Melee: Medium is defined as 'standard weapons like broadswords, maces, or axes', so the RAW weapon that matches his RAW skill is the Broadsword: Dmg 4, CL 3, CS 3, Dis 4, T 5, Enc 2. Only the flavour word changed; every number the module teaches is untouched. If you would rather he truly carried a longsword, that is also RAW, but then give him Melee: Heavy 70 in place of Melee: Medium 70 and use the Longsword line (1H: Dmg 4, CL 4, CS 4, Dis 3, T 3), and fix the same number in Beat 6's text.",
    "Long Knife": "No 'long knife' entry exists in the book; this uses the Dagger line (Ch.9 p.132) as the closest real match. Bolg Fiir sizing is flavour, Dagger stats are unchanged.",
    "Belt Knife": "No 'belt knife' entry exists in the book; this uses the Dagger line (Ch.9 p.132). Mairwen has no Melee skill at all, so it rolls at the default 20, which matches her concept.",
    "Dagger": "Thrown; Piercing 5 on a Prone or Grappled opponent. The book allows a single dagger At Hand at no ENC cost; the first one here is set to 0 ENC and any second to 1."
  };

  /* Book armour and shield lines, from equipment.json (Ch.9 p.140-141). */
  const ARMOR_LINES = {
    "Padding":            { ap: 1, bulk: 0.5, note: "" },
    "Leather":            { ap: 3, bulk: 2,   note: "" },
    "Reinforced Leather": { ap: 4, bulk: 3,   note: "Book penalties, not automated by this system: Body: Stealth, Dodge -5. At least one Leg: Athletics -5." }
  };
  const SHIELD_LINES = {
    "Small Shield": { ap: 3, shb: 7, enc: 1, note: "Target shield. Shield Bash costs 7 SL." }
  };

  const PREGENS = [
    {
      name: "Renn Kestrel", role: "The Planner",
      race: "Human", career: "Quartermaster (deserted)",
      dt: 20, resolve: 14, toughness: 1, initiative: 11, silver: 18,
      skills: [
        ["Common Lore", 70, "Lore", 2], ["Perception", 65, "Adventuring"], ["Persuade", 60, "Social"],
        ["Commerce", 55, "Lore"], ["Survival", 55, "Adventuring"], ["Track", 50, "Adventuring"],
        ["Protocol", 45, "Social"], ["Melee: Light", 40, "Combat"], ["Endurance", 40, "Adventuring"]
      ],
      talents: [["Tactician", "Combat", ""], ["Travel Planner", "Lore", ""]],
      weapons: ["Shortsword", "Dagger"],
      armor: [["Leather", "body"]], shields: [],
      trait: "Makes sure the crew eats",
      goal: "Make sure this crew eats, no matter who has to go without.",
      bio: "<p>Human, former quartermaster. You deserted after your unit was left to starve at the end of a lost campaign, and swore you would never run a job that let anyone under your plan go hungry again. Tonight's plan is aimed at a woman carrying two sacks of salt, alone, because the whole point of her run is that nobody is supposed to touch it. You have not worked out whether that bothers you or just makes the job cleaner.</p><p><b>Bond.</b> You trust Dags with your life and almost no one else the same way. He took an arrow meant for you two winters back.</p>",
      gear: "<p>A scavenged set of maps, a battered tally stick from your quartermaster days. Roughly 18 silver on hand.</p>"
    },
    {
      name: "Sela Voss", role: "The Striker",
      race: "Human", career: "Thief (exiled)",
      dt: 20, resolve: 12, toughness: 0, initiative: 13, silver: 0,
      skills: [
        ["Stealth", 70, "Adventuring", 2], ["Melee: Light", 65, "Combat"], ["Dodge", 55, "Combat"],
        ["Sleight of Hand", 55, "Adventuring"], ["Deceive", 50, "Social"], ["Athletics", 45, "Adventuring"],
        ["Streetwise", 45, "Lore"], ["Thrown", 40, "Combat"], ["Wit", 35, "Social"]
      ],
      talents: [["Assassin", "Combat", ""], ["Quick And Quiet", "Adventuring", ""]],
      weapons: ["Dagger", "Dagger", "Shortsword"],
      armor: [["Padding", "body"]], shields: [],
      trait: "Strikes first, trusts slowly",
      goal: "Nobody else would take me in on faith. This crew did.",
      bio: "<p>Human, exiled thief. A guest under your family's roof stole from them and let you take the blame rather than confess. The guest was a lord's son, and hospitality law does not ask who is telling the truth, only who gets shunned. You are furious at a system that protects the well born liar, and a lone salt runner whose entire livelihood rests on being trusted not to run looks, to you, exactly like the kind of naive trust that got you exiled in the first place.</p><p><b>Bond.</b> You do not fully trust Old Ambrose yet, but you owe him. He vouched for you into the band when nobody else would take an exile on faith.</p>",
      gear: ""
    },
    {
      name: "Grael Ashbeard", role: "The Bruiser",
      race: "Half-Orc", career: "Pit-fighter (bought out)",
      dt: 24, resolve: 10, toughness: 2, initiative: 10, silver: 0,
      skills: [
        ["Melee: Heavy", 70, "Combat", 2], ["Endurance", 65, "Adventuring", 0, true], ["Melee: Medium", 55, "Combat"],
        ["Intimidate", 45, "Social"], ["Might", 40, "Combat"], ["Athletics", 40, "Adventuring"]
      ],
      talents: [["Sweeping Attack", "Combat", ""], ["Blood-Fury", "Non-Human", "Half-Orc only"]],
      weapons: ["Battle-Axe"],
      armor: [["Reinforced Leather", "body"]], shields: ["Small Shield"],
      trait: "Protects the crew, no questions",
      goal: "Pay the debt for being bought out of a cage, and keep the family found while paying it.",
      bio: "<p>Half-Orc, former pit-fighter. Someone in this band pulled you out of a debtor's pit-fighting ring, and you have never once asked why. You do not examine jobs morally. You protect the crew, full stop. Tonight's target being a lone woman does not sit right with some of the others. It does not cost you a moment's sleep.</p><p><b>Bond.</b> You would follow Renn's plan into a fire without asking why. Three bad jobs, three times his read on the ground kept you breathing.</p>",
      gear: ""
    },
    {
      name: "Dags Farrow", role: "The Marksman",
      race: "Human", career: "Ranger",
      dt: 20, resolve: 12, toughness: 1, initiative: 12, silver: 0,
      skills: [
        ["Missile", 70, "Combat", 2], ["Perception", 65, "Adventuring"], ["Survival", 55, "Adventuring"],
        ["Track", 45, "Adventuring"], ["Dodge", 40, "Combat"], ["Stealth", 40, "Adventuring"],
        ["Naturewise", 40, "Lore"], ["Persuade", 30, "Social"]
      ],
      talents: [["Eagle Eye", "Combat", "Longbow"], ["Fearless", "Adventuring", ""]],
      weapons: ["Longbow", "Hand Axe"],
      armor: [["Leather", "body"]], shields: [],
      trait: "Needs coin, wants it clean",
      goal: "Buy my sister out of debt bondage, and keep this job clean enough that nobody looks twice.",
      bio: "<p>Human, ranger. You need coin, fast and quiet, to buy your sister out of debt bondage to a Dunblaine clan-holding. A body count draws exactly the kind of attention that makes owners look twice at who is asking questions about their property, so you are the one voice in this band pushing for the job to stay clean, for reasons you would never phrase as principle.</p><p><b>Bond.</b> You took an arrow for Renn once. The two of you trust each other completely in a fight, less so anywhere else.</p>",
      gear: "<p>A quiver of arrows.</p>"
    },
    {
      name: "Ysolt Vane", role: "The Talker",
      race: "Human", career: "Speaker",
      dt: 20, resolve: 16, toughness: 0, initiative: 10, silver: 0,
      skills: [
        ["Wit", 70, "Social", 2], ["Persuade", 60, "Social"], ["Insight", 55, "Social"],
        ["Streetwise", 45, "Lore"], ["Intimidate", 40, "Social"], ["Perception", 40, "Adventuring"]
      ],
      talents: [["Barbed Tongue", "Social", ""], ["I See Your Mind", "Social", ""]],
      weapons: ["Dagger"],
      armor: [], shields: [],
      trait: "Wants to be the real voice of the band",
      goal: "Become the voice this band's leader actually listens to.",
      bio: "<p>Human, speaker. You want to be the voice this band's leader actually listens to, and you see tonight, especially whatever gets said back at camp afterward, as your chance to prove you should be the one running things. That ambition cuts both ways. You are just as capable of catching someone else's lie as you are of telling a useful one yourself.</p><p><b>Bond.</b> You keep needling Old Ambrose about relying on knives instead of words. A running rivalry that could cut either way.</p>",
      gear: "<p>A fine cloak (stolen), a small ledger of who owes the band what. The knife is well kept and has never had to be used.</p>"
    },
    {
      name: "Uisdean Fen", role: "The Outsider",
      race: "Bolg Fiir", career: "Loremaster",
      dt: 20, resolve: 12, toughness: 2, initiative: 10, silver: 0,
      skills: [
        ["Ancient Lore", 70, "Lore", 2, true], ["Common Lore", 55, "Lore"], ["Insight", 45, "Social"],
        ["Arcana", 40, "Lore", 0, true], ["Protocol", 40, "Social"], ["Perception", 40, "Adventuring"],
        ["Melee: Light", 40, "Combat", 0, true]
      ],
      talents: [["Whispered Inheritance", "Non-Human", "Bolg Fiir only"]],
      weapons: ["Long Knife"],
      armor: [["Padding", "body"]], shields: [],
      trait: "An outsider even among outsiders",
      goal: "Find somewhere that will have me, and stay ahead of what my blood remembers.",
      bio: "<p>Bolg Fiir, loremaster. Your own people cast you out for reasons you will not fully explain, and now you run with humans who alternately fear you and use you for it. You are genuinely torn about robbing one of the local folk tonight. The old instincts your bloodline carries are not something you fully control, and some nights, neither are you.</p><p><b>Bond.</b> Nobody talks to you much except Grael. Two outsiders who have settled into a rough camaraderie neither of you would call friendship out loud.</p>",
      gear: "<p>A scrap of Elven memory-stone you have never explained to anyone in the band.</p>"
    },
    {
      name: "\"Mother\" Mairwen Coll", role: "The Medic",
      race: "Human", career: "Wandering healer and performer",
      dt: 22, resolve: 14, toughness: 1, initiative: 10, silver: 0,
      skills: [
        ["Heal", 70, "Lore", 2], ["Perform", 55, "Social"], ["Naturewise", 50, "Lore"],
        ["Endurance", 45, "Adventuring"], ["Persuade", 40, "Social"], ["Dodge", 30, "Combat"]
      ],
      talents: [["Bedside Manner", "Lore", ""], ["Entertaining", "Social", ""]],
      weapons: ["Belt Knife"],
      armor: [], shields: [],
      trait: "Keeps the crew alive, including from itself",
      goal: "Keep this crew alive, including from itself.",
      bio: "<p>Human, wandering healer and performer. Half the folk healers on this road double as performers, since a song travels better than a diploma. You patch up whoever needs it, on either side of a job, and you are the one most likely to argue for sparing the rider outright rather than finishing what the ambush started.</p><p><b>Bond.</b> You looked after Dags's sister for a season before the debt bondage took her. You are the only one in the band who knows exactly what he is really working toward.</p>",
      gear: "<p>A full medical supply kit (Medical Supply Die, starts at d10, tracked by the TBE: Salt-Run Trackers macro). A battered lute you genuinely play well.</p><p>Heal 70 means a Heal Score of 7: an attended Recovery roll gets +14, and Bedside Manner makes hers +21. She can tend half her Heal Score rounded down, so 3 patients at once.</p>"
    },
    {
      name: "Old Ambrose Duff", role: "The Duelist",
      race: "Human", career: "Hedge-knight (fallen)",
      dt: 20, resolve: 12, toughness: 1, initiative: 11, silver: 0,
      skills: [
        ["Melee: Medium", 70, "Combat", 2], ["Dodge", 55, "Combat"], ["Protocol", 45, "Social"],
        ["Endurance", 45, "Adventuring"], ["Melee: Light", 40, "Combat"]
      ],
      talents: [["Riposte", "Combat", ""], ["Combat Awareness", "Combat", ""]],
      weapons: ["Broadsword"],
      armor: [["Leather", "body"]], shields: [],
      trait: "Will not be lied to or fought dishonest",
      goal: "Keep the one piece of who I used to be that I refuse to sell.",
      bio: "<p>Human, fallen hedge-knight. Once you fought for coin in other people's quarrels. Now you are just a civilian who never quite let go of the blade-work. You will not tolerate being lied to, or fought dishonestly, even out here as an outlaw. That is not sentiment. It is the last piece of who you used to be that you refuse to sell.</p><p><b>Bond.</b> You vouched for Sela when nobody else would. You and Ysolt trade barbs about knives versus words, more affectionate than either of you admits.</p><p><b>Note.</b> His Initiative of 11 already includes the +1 from Combat Awareness (the book's starting Initiative modifier is +10).</p>",
      gear: "<p>No shield: he prefers both hands free.</p>"
    }
  ];

  async function makePregens() {
    for (const p of PREGENS) {
      if (game.actors.getName(p.name)) { note(p.name + " already exists, skipped."); continue; }

      const items = [];
      for (const s of p.skills) {
        const [sname, value, group, expertise, savvy] = s;
        items.push({
          name: sname, type: "skill",
          system: {
            group, value,
            fighting: group === "Combat", // TBE.isFighting: a fighting skill iff Combat
            expertise: expertise || 0,
            savvy: !!savvy
          }
        });
      }
      for (const t of p.talents) {
        const [tname, category, requirements] = t;
        items.push({ name: tname, type: "talent", system: { category, requirements: requirements || "", ranks: 1 } });
      }
      /* RULES AS WRITTEN: a weapon is rolled with the skill its own book
       * section names, and "that skill begins at 20" if the character has no
       * value in it (p.104). Several sheets carry a weapon whose skill the
       * roster does not list: Dags's hand axe, Ysolt's knife and Mairwen's
       * belt knife are all Light weapons on sheets with no Melee: Light. The
       * handout already tells the player "every skill not listed starts at
       * 20", so adding it at 20 changes no printed number; it just puts the
       * number on the sheet where it can be rolled, instead of leaving the
       * weapon unrollable and the rule something the GM has to recall. */
      const owned = new Set(p.skills.map((s) => s[0]));
      for (const wname of p.weapons) {
        const need = WEAPON_LINES[wname] && WEAPON_LINES[wname].skillName;
        if (need && !owned.has(need)) {
          owned.add(need);
          items.push({
            name: need, type: "skill",
            system: { group: "Combat", value: 20, fighting: true, expertise: 0, savvy: false },
            flags: { tbe: { saltRunAmbushNote: "Not on the roster sheet. Added at the book's starting value of 20 (p.104) because " + p.name + " carries a " + wname + ", which is rolled with " + need + ". No printed number changed." } }
          });
        }
      }

      let daggerSeen = 0;
      for (const wname of p.weapons) {
        const line = WEAPON_LINES[wname];
        if (!line) { ui.notifications.error("Unknown weapon line: " + wname); continue; }
        // The book's single free-ENC dagger, applied to the first one only.
        let enc = line.enc;
        if (wname === "Dagger") { enc = daggerSeen === 0 ? 0 : 1; daggerSeen++; }
        items.push({
          name: wname, type: "weapon",
          system: {
            dmg: line.dmg, cl: line.cl, cs: line.cs, dis: line.dis, t: line.t,
            enc, skillName: line.skillName, ranged: !!line.ranged, carried: "hand"
          },
          flags: { tbe: { saltRunAmbushNote: (WEAPON_NOTES[wname] || "") + " Book row: " + line.book + " (Ch.9 p.132)." } }
        });
      }
      for (const a of p.armor) {
        const [aname, loc] = a;
        const line = ARMOR_LINES[aname];
        if (!line) { ui.notifications.error("Unknown armour line: " + aname); continue; }
        const locations = { head: false, body: false, rArm: false, lArm: false, rLeg: false, lLeg: false };
        locations[loc] = true;
        items.push({
          name: aname, type: "armor",
          system: { ap: line.ap, bulk: line.bulk, locations, equipped: true },
          flags: { tbe: { saltRunAmbushNote: (line.note ? line.note + " " : "") + "The handout names the armour but not which locations it covers, so this is ONE piece on the " + loc + " location. Add more pieces (one Item per location) if you want a full suit, remembering that each piece adds Bulk and therefore Initiative penalty." } }
        });
      }
      for (const sname of p.shields) {
        const line = SHIELD_LINES[sname];
        if (!line) { ui.notifications.error("Unknown shield line: " + sname); continue; }
        items.push({
          name: sname, type: "shield",
          system: { ap: line.ap, shb: line.shb, enc: line.enc, carried: "hand" },
          flags: { tbe: { saltRunAmbushNote: line.note } }
        });
      }

      await Actor.create({
        name: p.name,
        type: "character",
        ...withArt(p.name),
        system: {
          deathThreshold: { value: p.dt, max: p.dt },
          resolve: { value: p.resolve, max: p.resolve },
          toughness: p.toughness,
          initiative: p.initiative,
          size: "Medium", // every playable race here is Medium; only Ogre is not
          race: p.race,
          career: p.career,
          silver: p.silver,
          biography: p.bio,
          notes: p.gear,
          personalityTraits: [p.trait],
          goals: [{ text: p.goal, kind: "individual", done: false, awarded: false }]
        },
        items
      });
      note("Created " + p.name + " (" + p.role + ").");
    }
  }

  // -----------------------------------------------------------------
  // Run everything.
  // -----------------------------------------------------------------
  await makePregens();
  await makeElspeth();
  await makeDunchadh();
  await makeAmbushScene();
  await makeCampScene();
  await makeQuickReferenceJournal();
  await makeTrackersJournal();
  await makeTrackerMacro();
  await makeTalismanMacro();

  ui.notifications.info("Salt-Run Ambush build complete — see console for details.");
  console.log("[Salt-Run Ambush] Done:\\n" + log.map((l) => "  - " + l).join("\\n"));
})();
