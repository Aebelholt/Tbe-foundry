// Import document classes.
import { TheBrokenEmpiresActor } from './documents/actor.mjs';
import { TheBrokenEmpiresItem } from './documents/item.mjs';
// Import sheet classes.
import { TheBrokenEmpiresActorSheet } from './sheets/actor-sheet.mjs';
import { TheBrokenEmpiresItemSheet } from './sheets/item-sheet.mjs';
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from './helpers/templates.mjs';
import { TBE } from './helpers/config.mjs';
// Import DataModel classes
import * as models from './data/_module.mjs';
import * as migration from './migration/migration.mjs';
import * as resolution from './rules/resolution.mjs';
import * as visibility from './rules/visibility.mjs';
import * as permission from './rules/permission.mjs';
import * as combat from './rules/combat.mjs';
import * as chatPopups from './helpers/chat-popups.mjs';
import * as diceRoles from './helpers/dice-roles.mjs';

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', function () {
  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.thebrokenempires = {
    TheBrokenEmpiresActor,
    TheBrokenEmpiresItem,
    /* Shared rule logic, reachable from a macro at runtime. A Foundry macro
     * cannot `import`, but it can read a global, which is how the macro pack
     * and the system agree on a rule instead of each keeping a copy. The
     * sheet's own roll button and `TBE.resolve()` in macros/_lib.js both go
     * through this one implementation. */
    rules: {
      /* Dice So Nice roles (attack / defence / wound); see dice-roles.mjs. */
      diceRoles: { ROLE: diceRoles.ROLE, tagRoll: diceRoles.tagRoll },
      resolve: resolution.resolve,
      isDoubles: resolution.isDoubles,
      face: resolution.face,
      outcomeLabel: resolution.outcomeLabel,
      TASK_MODIFIERS: resolution.TASK_MODIFIERS,
      FAVOR_STEP: resolution.FAVOR_STEP,
      FAVOR_CAP: resolution.FAVOR_CAP,
      /* Chat visibility. One meaning of "secret" for the macro pack and the
         sheet both, now that a GM and players share a chat log (v0.34.0). */
      visibility: {
        prepare: visibility.prepare,
        effectiveMode: visibility.effectiveMode,
        applyVisibility: visibility.applyVisibility,
        isHidden: visibility.isHidden,
        MODES: visibility.MODES
      },
      /* The opposed-roll cascade and the shield question, now that the
         sheet rolls attacks and defences too (v0.38.0). docs/ownership.md
         has named combat.mjs as the cascade's home since v0.24.0. */
      combat: {
        opposedResolve: combat.opposedResolve,
        defendingShield: combat.defendingShield,
        shieldLine: combat.shieldLine
      },
      /* Actor writes. One answer to "may this user change this actor", and
         one honest report when they may not (v0.38.0). The macro pack's 68
         write sites go through this rather than each deciding for itself --
         or, as half of them did, catching the permission error and printing
         the cost to chat anyway. */
      permission: {
        canWrite: permission.canWrite,
        pickActor: permission.pickActor,
        denialNotice: permission.denialNotice,
        applyWrite: permission.applyWrite,
        applyItemWrite: permission.applyItemWrite
      }
    }
  };

  // Add custom constants for configuration.
  CONFIG.TBE = TBE;

  // Define custom Document and DataModel classes
  CONFIG.Actor.documentClass = TheBrokenEmpiresActor;
  CONFIG.Actor.dataModels = {
    character: models.TheBrokenEmpiresCharacter,
    creature: models.TheBrokenEmpiresCreature
  };
  CONFIG.Item.documentClass = TheBrokenEmpiresItem;
  CONFIG.Item.dataModels = {
    skill: models.TheBrokenEmpiresSkill,
    weapon: models.TheBrokenEmpiresWeapon,
    armor: models.TheBrokenEmpiresArmor,
    shield: models.TheBrokenEmpiresShield,
    strand: models.TheBrokenEmpiresStrand,
    thread: models.TheBrokenEmpiresThread,
    talent: models.TheBrokenEmpiresTalent,
    enchantment: models.TheBrokenEmpiresEnchantment
  };

  /* Initiative (p.161): "To determine initiative, roll a d10 and add your
   * Initiative value. The highest total acts first." The Initiative modifier
   * itself is reduced by worn armor (Ch.9 p.141), which the actor derives as
   * system.initiativeEffective, so the tracker rolls the same number the sheet
   * shows. Until now the sheet's Initiative stat had no effect on turn order at
   * all: it was a number on a character sheet and nothing read it.
   *
   * Two more clauses from the same page are handled by the classes below:
   * enemies do not roll (static value), and ties go to the PC. */
  CONFIG.Combat.initiative = { formula: "1d10 + @initiativeEffective", decimals: 0 };

  CONFIG.Combatant.documentClass = class TheBrokenEmpiresCombatant extends Combatant {
    /* p.161: "Enemies typically do not roll; they have a static Initiative
     * value, which determines their place in the turn order each round." */
    _getInitiativeFormula() {
      return this.actor?.type === "creature" ? "@initiativeEffective" : "1d10 + @initiativeEffective";
    }
  };

  CONFIG.Combat.documentClass = class TheBrokenEmpiresCombat extends Combat {
    /* p.161: "Ties go to the PC." Foundry's default sort breaks a tie by name,
     * which would hand it to whichever troll was typed first. */
    _sortCombatants(a, b) {
      const ia = Number.isNumeric(a.initiative) ? a.initiative : -Infinity;
      const ib = Number.isNumeric(b.initiative) ? b.initiative : -Infinity;
      if (ia !== ib) return ib - ia;
      const pcA = a.actor?.type === "character" ? 1 : 0;
      const pcB = b.actor?.type === "character" ? 1 : 0;
      if (pcA !== pcB) return pcB - pcA;
      return (a.name || "").localeCompare(b.name || "");
    }
  };

  // Register the full TBE status palette once, here, instead of the macro
  // pack's old lazy per-macro registration (TBE.ensureStatuses(), called at
  // the top of every macro because there was no init hook to put it in). A
  // real system fixes that at the source: it's always present.
  //
  // CONFIG.statusEffects changed shape in Foundry V14: it was an Array of
  // status objects through V13 and is a keyed object, { [id]: StatusEffectConfig },
  // from V14 on. Calling .find()/.push() on the V14 object throws inside init,
  // which takes the whole system down before any TBE rule gets a chance to
  // matter. This branches on the shape it actually finds rather than on a
  // version number, so it keeps working if the shape changes again, or if a
  // release ships a compatibility shim that makes the version read misleading.
  //
  // The group is TBE's own field (it drives the Status & Peril reference and
  // the TBE: Status Effects picker). Foundry ignores keys it does not know, so
  // it is carried through rather than thrown away: there is no reason for the
  // registered palette to know less than TBE.STATUSES does.
  const statusIsArray = Array.isArray(CONFIG.statusEffects);
  for (const s of TBE.STATUSES) {
    const cfg = { id: s.id, name: s.name, img: s.icon, group: s.group, hud: true };
    if (statusIsArray) {
      if (!CONFIG.statusEffects.some((e) => e?.id === s.id)) CONFIG.statusEffects.push(cfg);
    } else if (!CONFIG.statusEffects[s.id]) {
      CONFIG.statusEffects[s.id] = cfg;
    }
  }

  // Register sheet application classes
  Actors.unregisterSheet('core', ActorSheet);
  Actors.registerSheet('the-broken-empires', TheBrokenEmpiresActorSheet, {
    makeDefault: true,
    label: 'TBE.SheetLabels.Actor',
  });
  Items.unregisterSheet('core', ItemSheet);
  Items.registerSheet('the-broken-empires', TheBrokenEmpiresItemSheet, {
    makeDefault: true,
    label: 'TBE.SheetLabels.Item',
  });

  // Holds active Extended Roll / Social Encounter trackers (TBE.trackers() in
  // the macro pack's _lib.js). These track a shared undertaking rather than
  // any one actor, so they live here instead of on a character sheet. Not
  // exposed in the Settings UI (config: false) -- the macros are the only UI.
  game.settings.register('the-broken-empires', 'encounters', {
    scope: 'world',
    config: false,
    type: Object,
    default: {}
  });

  /* Extra rows for the Character Wizard's step-1 concept roller. That table
   * is ORIGINAL content, not book-derived, and the project owner asked to be
   * able to expand it -- so the additions live in the world, not in the
   * shipped data file, and the wizard merges them into the d10 columns it
   * rolls on. Shape: { roles: [{text, skills}], streaks: [...], troubles: [...] }.
   * Not exposed in the Settings UI: the wizard's own editor is the UI. */
  game.settings.register('the-broken-empires', 'customConcepts', {
    scope: 'world',
    config: false,
    type: Object,
    default: { roles: [], streaks: [], troubles: [] }
  });

  /* Per user: how long a chat card lingers as a pop-up when the sidebar is
   * closed. Foundry's own 5 seconds is too short to read an attack card. */
  game.settings.register('the-broken-empires', 'chatPopupSeconds', {
    name: 'TBE.Settings.ChatPopupSeconds.Name',
    hint: 'TBE.Settings.ChatPopupSeconds.Hint',
    scope: 'client',
    config: true,
    type: Number,
    range: { min: chatPopups.MIN_SECONDS, max: chatPopups.MAX_SECONDS, step: 1 },
    default: chatPopups.DEFAULT_SECONDS,
    onChange: (v) => chatPopups.applyChatPopupDuration(v, chatPopups.chatLogClasses())
  });

  // The world's schema version has to exist as a setting before the ready
  // hook can compare against it.
  migration.registerSettings();

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

/* -------------------------------------------- */
/*  World migration                             */
/* -------------------------------------------- */

/* Runs once per load, GM only, and only when the world is behind this build.
 *
 * One call, because one function owns the transaction boundary. The v0.29.0
 * build split this into migrateWorld() + migrateClockFlags() and let the first
 * commit the version, so a clock problem left the world stamped as migrated
 * with the clocks still stranded -- and the next load, seeing a current
 * version, returned before it could notice. migrateAll() runs every stage and
 * commits once, last, only if nothing is outstanding. */
/* Dice So Nice fires this once its API is up; absent the module it never
 * fires and nothing here runs. */
Hooks.once('diceSoNiceReady', (dice3d) => {
  diceRoles.registerDiceRoles(dice3d, game.system.id);
});

/* Applied at ready, for every user, before the GM-only migration below. */
Hooks.once('ready', function () {
  chatPopups.applyChatPopupDuration(
    game.settings.get('the-broken-empires', 'chatPopupSeconds'), chatPopups.chatLogClasses());
});

Hooks.once('ready', async function () {
  if (!game.user?.isGM) return;
  const from = migration.worldVersion();
  const target = migration.currentVersion(game.system);
  if (!foundry.utils.isNewerVersion(target, from)) return;

  /* A world with no recorded version is either brand new or predates this
   * mechanism, and the two look identical from in here. "Has no actors and no
   * journals" was the first test and it is too narrow: a world can have Items,
   * Scenes, Macros, RollTables and folders and no Actor. Ask whether ANY
   * document collection has content instead, so a populated world is never
   * quietly stamped as fresh and skipped. */
  const populated = [game.actors, game.items, game.journal, game.scenes,
                    game.tables, game.macros, game.playlists]
    .some((c) => (c?.size ?? 0) > 0);
  if (!populated) {
    await game.settings.set('the-broken-empires', 'worldSchemaVersion', target);
    return;
  }

  ui.notifications?.info(`The Broken Empires: checking this world against ${target}. ` +
    `Legacy data is copied, never deleted.`);
  const report = await migration.migrateAll();
  const html = migration.reportToHtml(report);

  /* A system upgrade does not touch macro copies already in the world. Say so
     here, at the one moment the GM is definitely looking, rather than letting
     them keep clicking a frozen old build of TBE: Attack. Reports only --
     nothing is deleted, because a differing copy may be the GM's own edit. */
  let macroHtml = null;
  try {
    macroHtml = migration.staleMacrosToHtml(await migration.findStaleMacros());
  } catch (err) {
    console.warn('TBE | stale-macro scan failed', err);
  }

  const body = [html, macroHtml].filter(Boolean).join('');
  if (body) ChatMessage.create({ content: body, whisper: ChatMessage.getWhisperRecipients('GM') });
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

Handlebars.registerHelper('eq', (a, b) => a === b);
Handlebars.registerHelper('gt', (a, b) => a > b);
Handlebars.registerHelper('sign', (n) => (Number(n) > 0 ? "+" + n : String(n)));
// Plain arithmetic, so a template can say "7 to go" instead of making the
// player subtract two numbers it is already printing side by side.
Handlebars.registerHelper('sub', (a, b) => (Number(a) || 0) - (Number(b) || 0));

// Renders an armor Item's system.locations (a {head,body,rArm,lArm,rLeg,lLeg}
// boolean set, p.140: one piece protects only the location(s) checked on it)
// as short display text for the Gear tab's inventory row.
const ARMOR_LOC_ABBR = { head: "Head", body: "Body", rArm: "R Arm", lArm: "L Arm", rLeg: "R Leg", lLeg: "L Leg" };
Handlebars.registerHelper('armorLocs', (locations) => {
  const on = Object.entries(locations || {}).filter(([, v]) => v).map(([k]) => ARMOR_LOC_ABBR[k]);
  return on.length ? on.join(", ") : "none checked";
});
