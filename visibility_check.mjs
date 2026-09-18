/* visibility_check.mjs — "who can see this card" has exactly one owner, and a
 * card the book calls hidden actually reaches only the GM.
 *
 * Why this file exists. While TBE was a solo system, chat visibility was not a
 * rule at all: one pair of eyes, so public and private meant the same thing.
 * `TBE.say()` posted all 59 of the macro pack's cards publicly with no way to
 * whisper, the sheet's roll button ignored the roll-mode dropdown, and TBE:
 * Social Encounter delivered p.251's "the Tolerance is hidden from the
 * players" by evaluating the 2d10 and then showing it to nobody at all — GM
 * included. Every other check in this repo passed throughout, because none of
 * them was asking who was looking.
 *
 * Seb changed the scope on 2026-09-17 (a GM and players, separate clients, one
 * shared chat log) and all of that became a defect. So this check asserts the
 * things that only matter once there is more than one pair of eyes:
 *   - the owner resolves modes by the documented precedence
 *   - the macro pack and the sheet both go through it, with the deferral path
 *     AND the Node fallback producing identical payloads
 *   - a forced mode beats the dropdown, and the dropdown beats public
 *   - the hidden Tolerance roll is whispered to the GM, and never rides along
 *     on the public card
 *   - nothing here hides anything from the GM
 *
 * Run: node visibility_check.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as OWNER from "./system/the-broken-empires/module/rules/visibility.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");

let pass = 0, fail = 0;
const check = (cond, label, extra) => {
  if (cond) { pass++; console.log("  PASS  " + label); }
  else { fail++; console.log("  FAIL  " + label + (extra !== undefined ? "  <- " + JSON.stringify(extra) : "")); }
};

const LIB = read("macros/_lib.js");
const M = OWNER.MODES;
const GM_IDS = ["gm1", "gm2"];

/* A ChatMessage stub that records what it was asked to post. Two flavours:
 * one WITH applyRollMode (what a live Foundry gives you) and one WITHOUT
 * (the hand-rolled fallback path), because both have to reach the same
 * answer — that is the whole point of having an owner. */
const makeChatMessage = ({ withApplyRollMode }) => {
  const posted = [];
  const CM = {
    posted,
    create: (data) => { posted.push(JSON.parse(JSON.stringify(data))); return data; },
    getSpeaker: () => ({ alias: "Someone" }),
    getWhisperRecipients: (role) => (role === "GM" ? GM_IDS.map((id) => ({ id })) : [])
  };
  if (withApplyRollMode) {
    CM.applyRollMode = (data, mode) => {
      if (mode === M.PRIVATE) data.whisper = [...GM_IDS];
      else if (mode === M.BLIND) { data.whisper = [...GM_IDS]; data.blind = true; }
      else if (mode === M.SELF) data.whisper = ["u1"];
      else { data.whisper = []; data.blind = false; }
      return data;
    };
  }
  return CM;
};

/* Load macros/_lib.js the way resolution_check.mjs does: real source, stubbed
 * globals, with the rules global either present (deferral) or absent
 * (fallback). */
const loadTBE = ({ withGlobal, rollMode, withApplyRollMode = true }) => {
  const ChatMessage = makeChatMessage({ withApplyRollMode });
  const settings = { get: (ns, key) => (ns === "core" && key === "rollMode" ? rollMode : undefined) };
  const game = {
    user: { id: "u1", character: null },
    settings
  };
  if (withGlobal) {
    game.thebrokenempires = { rules: { visibility: {
      prepare: OWNER.prepare, effectiveMode: OWNER.effectiveMode,
      applyVisibility: OWNER.applyVisibility, isHidden: OWNER.isHidden, MODES: OWNER.MODES
    } } };
  }
  const canvas = { tokens: { controlled: [] } };
  const foundry = { utils: { duplicate: (o) => JSON.parse(JSON.stringify(o)) } };
  const ui = { notifications: { warn() {}, error() {}, info() {} } };
  const CONFIG = { sounds: { dice: "dice.wav" } };
  const TBE = new Function(
    "canvas", "game", "foundry", "ui", "CONFIG", "ChatMessage",
    LIB + "\n;return TBE;"
  )(canvas, game, foundry, ui, CONFIG, ChatMessage);
  return { TBE, ChatMessage };
};

console.log("\n1. The owner resolves a mode by the documented precedence");
{
  const get = (mode) => (ns, key) => (ns === "core" && key === "rollMode" ? mode : undefined);

  check(OWNER.effectiveMode(M.PRIVATE, get(M.PUBLIC)) === M.PRIVATE,
    "an explicit mode beats the dropdown: a rule in print outranks a UI setting");
  check(OWNER.effectiveMode(undefined, get(M.BLIND)) === M.BLIND,
    "with no explicit mode, the user's own dropdown selection wins");
  check(OWNER.effectiveMode(undefined, get(undefined)) === M.PUBLIC,
    "with neither, public");
  check(OWNER.effectiveMode(undefined, () => { throw new Error("not registered"); }) === M.PUBLIC,
    "a throwing settings lookup degrades to PUBLIC, never to a silent whisper");
  check(OWNER.effectiveMode("", get(M.PRIVATE)) === M.PRIVATE,
    "an empty string is not an override");
}

console.log("\n2. Applying a mode, with and without Foundry's own helper");
{
  for (const withApplyRollMode of [true, false]) {
    const label = withApplyRollMode ? "via ChatMessage.applyRollMode" : "via the hand-rolled fallback";
    const CM = makeChatMessage({ withApplyRollMode });
    const opts = { ChatMessageClass: CM, gmIds: GM_IDS };

    const pub = OWNER.applyVisibility({ content: "x" }, M.PUBLIC, opts);
    check((pub.whisper ?? []).length === 0 && !pub.blind, `public reaches everyone (${label})`, pub);

    const priv = OWNER.applyVisibility({ content: "x" }, M.PRIVATE, opts);
    check(priv.whisper.length === GM_IDS.length && !priv.blind,
      `private whispers the GMs and is not blind (${label})`, priv);

    const blind = OWNER.applyVisibility({ content: "x" }, M.BLIND, opts);
    check(blind.whisper.length === GM_IDS.length && blind.blind === true,
      `blind whispers the GMs and sets blind (${label})`, blind);

    /* The invariant that matters most: nothing this module does may hide a
       card from the GM. A secret the adjudicator cannot see is not a secret,
       it is a lost number -- which is the exact bug this replaced. */
    for (const mode of [M.PRIVATE, M.BLIND]) {
      const d = OWNER.applyVisibility({ content: "x" }, mode, opts);
      check(GM_IDS.every((id) => d.whisper.includes(id)),
        `every GM still sees a ${mode} card (${label})`, d.whisper);
    }
  }

  /* A payload reused from a previous, private card must not leak its audience. */
  const CM = makeChatMessage({ withApplyRollMode: false });
  const reused = OWNER.applyVisibility({ content: "x", whisper: [...GM_IDS], blind: true }, M.PUBLIC,
    { ChatMessageClass: CM, gmIds: GM_IDS });
  check((reused.whisper ?? []).length === 0 && !reused.blind,
    "going public clears a stale whisper rather than inheriting it", reused);
}

console.log("\n3. The macro pack goes through the owner (deferral path)");
{
  const { TBE, ChatMessage } = loadTBE({ withGlobal: true, rollMode: M.PUBLIC });
  check(typeof TBE.say === "function", "TBE.say exists");

  TBE.say("<b>public</b>", []);
  check((ChatMessage.posted.at(-1).whisper ?? []).length === 0, "a normal card is public when the dropdown is");

  TBE.say("<b>secret</b>", [], { mode: TBE.MODES.PRIVATE });
  check(ChatMessage.posted.at(-1).whisper.length === GM_IDS.length,
    "a forced PRIVATE card whispers the GMs even with the dropdown on public",
    ChatMessage.posted.at(-1).whisper);
}

console.log("\n4. The dropdown is respected without anyone asking for it");
{
  const { TBE, ChatMessage } = loadTBE({ withGlobal: true, rollMode: M.PRIVATE });
  TBE.say("<b>ordinary card</b>", []);
  check(ChatMessage.posted.at(-1).whisper.length === GM_IDS.length,
    "a GM who set the dropdown to Private GM Roll gets a private card from an unmodified macro",
    ChatMessage.posted.at(-1));
}

console.log("\n5. Deferral and fallback agree, which is the point of an owner");
{
  for (const rollMode of [M.PUBLIC, M.PRIVATE, M.BLIND, M.SELF]) {
    for (const forced of [undefined, M.PRIVATE, M.PUBLIC]) {
      for (const withApplyRollMode of [true, false]) {
        const a = loadTBE({ withGlobal: true, rollMode, withApplyRollMode });
        const b = loadTBE({ withGlobal: false, rollMode, withApplyRollMode });
        a.TBE.say("<b>x</b>", [], forced ? { mode: forced } : {});
        b.TBE.say("<b>x</b>", [], forced ? { mode: forced } : {});
        const pa = a.ChatMessage.posted.at(-1), pb = b.ChatMessage.posted.at(-1);
        check(JSON.stringify(pa.whisper ?? []) === JSON.stringify(pb.whisper ?? []) &&
              Boolean(pa.blind) === Boolean(pb.blind),
          `deferral and fallback match: dropdown=${rollMode}, forced=${forced ?? "none"}, ` +
          `applyRollMode=${withApplyRollMode}`,
          { deferral: { w: pa.whisper, b: pa.blind }, fallback: { w: pb.whisper, b: pb.blind } });
      }
    }
  }
}

console.log("\n6. The sheet's roll button stopped ignoring the dropdown");
{
  const SHEET = read("system/the-broken-empires/module/sheets/actor-sheet.mjs");
  check(/import \* as VISIBILITY from '\.\.\/rules\/visibility\.mjs'/.test(SHEET),
    "actor-sheet.mjs imports the visibility owner");
  check(/VISIBILITY\.prepare\(messageData/.test(SHEET),
    "and runs its roll payload through it");
  check(!/roll\.toMessage\(\{\s*speaker/.test(SHEET),
    "and no longer calls toMessage with a bare inline payload that skips the owner");
  /* The sheet must not decide visibility itself, the same way it owns no
     other rule (CLAUDE.md's "the sheet owns no rules"). */
  check(!/whisper\s*[:=]/.test(SHEET) && !/getWhisperRecipients/.test(SHEET),
    "and carries no whisper logic of its own");
}

console.log("\n7. The hidden Tolerance roll (p.251) actually reaches the GM");
{
  const SOC = read("macros/tbe-social-encounter.js");
  check(/gmOnly\.push\(\{ roll: tr, tolerance \}\)/.test(SOC),
    "the 2d10 Tolerance roll is captured for the GM instead of being discarded");
  check(/mode: TBE\.MODES\.PRIVATE/.test(SOC),
    "and posted as a GM whisper");
  check(!/No whisper\/blind-roll support exists/.test(SOC),
    "the comment admitting there was no whisper support is gone, because there is");
  /* Blind would hide it from the GM too. The GM is the one person the book
     means to know this number. */
  check(!/mode: TBE\.MODES\.BLIND/.test(SOC),
    "and is whispered, not blind -- blind would hide it from the GM as well");
  /* The public card must be unchanged: the secret must not ride along in the
     `rolls` array that TBE.say attaches to whatever it is posting. */
  const publicSay = /await TBE\.say\(TBE\.card\("TBE Social Encounter", body\), rolls\);/.test(SOC);
  check(publicSay, "the public card still posts exactly as it did, with the ordinary rolls");
  const secretIdx = SOC.indexOf("gmOnly)");
  const publicIdx = SOC.indexOf('TBE.card("TBE Social Encounter", body)');
  check(publicIdx !== -1 && secretIdx > publicIdx,
    "and the GM card is posted after it, not woven into it");
  check(/p\.251/.test(SOC), "the page citation survives in the code");
}

console.log("\n8. Mutation: a fallback that quietly posts publicly must be caught");
{
  /* The failure this guards is silent: if the fallback ignored a forced mode
     and posted publicly, every test that only checks the deferral path would
     still pass, and a GM on the legacy pack would broadcast the Tolerance. */
  const broken = LIB.replace(
    /if \(typeof ChatMessage\?\.applyRollMode === "function"\) \{\s*ChatMessage\.applyRollMode\(data, mode \|\| TBE\.MODES\.PUBLIC\);/,
    'if (typeof ChatMessage?.applyRollMode === "function") { /* mutated: mode dropped */'
  );
  check(broken !== LIB, "the mutation actually changed the source");

  const ChatMessage = makeChatMessage({ withApplyRollMode: true });
  const game = { user: { id: "u1", character: null }, settings: { get: () => M.PUBLIC } };
  const TBE = new Function("canvas", "game", "foundry", "ui", "CONFIG", "ChatMessage",
    broken + "\n;return TBE;")(
    { tokens: { controlled: [] } }, game,
    { utils: { duplicate: (o) => JSON.parse(JSON.stringify(o)) } },
    { notifications: { warn() {}, error() {}, info() {} } },
    { sounds: { dice: "d.wav" } }, ChatMessage);

  TBE.say("<b>secret</b>", [], { mode: M.PRIVATE });
  check((ChatMessage.posted.at(-1).whisper ?? []).length === 0,
    "CONFIRMED: without the forced mode the fallback broadcasts a card meant for the GM, which section 5 catches",
    ChatMessage.posted.at(-1));
}

console.log("\n9. Mutation: dropping the deferral reintroduces two owners");
{
  const broken = LIB.replace(
    'const owner = (typeof game !== "undefined" && game?.thebrokenempires?.rules?.visibility) || null;',
    "const owner = null; /* mutated: deferral removed */"
  );
  check(broken !== LIB, "the mutation actually changed the source");
  /* It still has to WORK -- the fallback is a real implementation, not a stub
     -- so the way this is caught is the same way resolution_check catches a
     drifted copy: the two paths are compared, not inspected. Here the
     mutation is benign only because the fallback was written to match; this
     assertion records that fact rather than pretending the deferral is
     load-bearing for correctness today. What the deferral buys is that a
     FUTURE change to the owner reaches the macro pack without a rebuild. */
  const ChatMessage = makeChatMessage({ withApplyRollMode: true });
  const game = { user: { id: "u1", character: null }, settings: { get: () => M.PRIVATE } };
  const TBE = new Function("canvas", "game", "foundry", "ui", "CONFIG", "ChatMessage",
    broken + "\n;return TBE;")(
    { tokens: { controlled: [] } }, game,
    { utils: { duplicate: (o) => JSON.parse(JSON.stringify(o)) } },
    { notifications: { warn() {}, error() {}, info() {} } },
    { sounds: { dice: "d.wav" } }, ChatMessage);
  TBE.say("<b>x</b>", []);
  check(ChatMessage.posted.at(-1).whisper.length === GM_IDS.length,
    "the fallback alone is still correct today (so this mutation is benign, and section 5 is what pins them together)");
}

console.log("\n10. The owner is published where a macro can reach it");
{
  const ENTRY = read("system/the-broken-empires/module/the-broken-empires.mjs");
  check(/import \* as visibility from '\.\/rules\/visibility\.mjs'/.test(ENTRY),
    "the entry point imports it");
  check(/visibility:\s*\{/.test(ENTRY) && /prepare: visibility\.prepare/.test(ENTRY),
    "and publishes it on game.thebrokenempires.rules");
  check(/MODES: visibility\.MODES/.test(ENTRY),
    "including the mode names, so a macro never hardcodes the strings twice");
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
