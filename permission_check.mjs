/* permission_check.mjs — who may write to an actor, and what is said when
 * they may not.
 *
 * WHY THIS EXISTS. The macro pack had 68 actor-write sites and no permission
 * check anywhere, which was correct while this was a solo system and became a
 * defect the moment Seb changed the scope (2026-09-17, "this is no longer a
 * solo module in scope"). But the interesting failure was never the missing
 * check. It was this, from `tbe-cast.js`:
 *
 *     try { await this.actor.update({ "system.resolve.value": cur - 1 }); }
 *     catch (e) {}
 *     body += "<div>The spell is not cast. 1 Resolve spent.</div>";
 *
 * Foundry throws when you update a document you do not own. The throw was
 * caught, dropped, and the card asserted the cost anyway. Nothing errored,
 * nobody was told, and the chat log carried a sentence that was false. Nine
 * sites did some version of this.
 *
 * So most of what is asserted below is not "does the guard exist" but "does
 * the card tell the truth when the write fails" — which can only be checked
 * by running the real code against an actor the stub user does not own and
 * reading what comes back.
 *
 * Run: node permission_check.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as permission from "./system/the-broken-empires/module/rules/permission.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const R = (f) => path.join(__dirname, f);
const read = (f) => fs.readFileSync(R(f), "utf8");

let pass = 0, fail = 0;
const ok = (cond, label) => { if (cond) { pass++; } else { fail++; console.log("  FAIL  " + label); } };
const eq = (a, b, label) => ok(Object.is(a, b) || JSON.stringify(a) === JSON.stringify(b),
  label + (Object.is(a, b) ? "" : `  (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`));

/* Comments quote the very patterns these assertions ban, so strip them before
   testing source. Established house habit -- it has produced a false negative
   three separate times. */
const codeOf = (t) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

/* ------------------------------------------------------------------ *
 *  Stubs. A Foundry document, reduced to the two things that matter:
 *  a name, and an opinion about who owns it.
 * ------------------------------------------------------------------ */

const USER_GM = { id: "gm", isGM: true, name: "GM" };
const USER_SEB = { id: "seb", isGM: false, name: "Seb" };
const USER_OTHER = { id: "other", isGM: false, name: "Nina" };

function makeActor(name, ownerIds, { failWrite = false } = {}) {
  const a = {
    name,
    writes: [],
    /* Foundry's own semantics: a GM tests OWNER on everything. */
    testUserPermission: (user, level) => !!user && (user.isGM || ownerIds.includes(user.id)),
    async update(changes) {
      if (failWrite) throw new Error("boom");
      if (!a._currentUserOwns) throw new Error("User lacks permission to update Actor");
      a.writes.push(changes);
      return a;
    },
    _currentUserOwns: true,
    get isOwner() { return a._currentUserOwns; }
  };
  return a;
}

function makeItem(name, parent, { failWrite = false } = {}) {
  const i = {
    name, parent, writes: [],
    async update(changes) {
      if (failWrite) throw new Error("boom");
      i.writes.push(changes);
      return i;
    }
  };
  return i;
}

/* ------------------------------------------------------------------ *
 *  1. canWrite
 * ------------------------------------------------------------------ */
console.log("\n1. canWrite — one answer to the ownership question");
{
  const mine = makeActor("Elspeth", ["seb"]);
  const theirs = makeActor("Bandit", ["gm"]);

  ok(permission.canWrite(mine, USER_SEB) === true, "owner may write");
  ok(permission.canWrite(theirs, USER_SEB) === false, "non-owner may not write");
  ok(permission.canWrite(theirs, USER_GM) === true, "the GM may write to anything");
  ok(permission.canWrite(mine, USER_GM) === true, "the GM may write to a player's character");
  ok(permission.canWrite(null, USER_SEB) === false, "no actor is not an error, it is 'no'");
  ok(permission.canWrite(undefined, USER_GM) === false, "undefined actor is 'no' even for a GM");

  /* Falls back to isOwner when no user is supplied -- the sheet's situation,
     where `this.actor.isOwner` is already evaluated against the current user. */
  const noMethod = { name: "Legacy", isOwner: true };
  ok(permission.canWrite(noMethod) === true, "falls back to isOwner with no user");
  ok(permission.canWrite({ name: "L", isOwner: false }) === false, "isOwner false without a user");

  /* A user is supplied AND the method exists: the explicit test must win,
     because isOwner answers about the current user, not the passed one. */
  const conflicted = makeActor("Conflicted", ["gm"]);
  conflicted._currentUserOwns = true;   // isOwner would say yes
  ok(permission.canWrite(conflicted, USER_SEB) === false,
    "testUserPermission outranks isOwner when a user is passed");
}

/* ------------------------------------------------------------------ *
 *  2. pickActor — the TBE.me() bug, executed rather than read
 * ------------------------------------------------------------------ */
console.log("\n2. pickActor — the selected token is not automatically yours");
{
  const elspeth = makeActor("Elspeth", ["seb"]);
  const bandit = makeActor("Bandit", ["gm"]);

  /* The reported bug: a player clicks a creature to read its Armour, leaves
     it selected, opens a macro. Every write then aimed at the GM's creature. */
  const r1 = permission.pickActor({
    controlled: [{ actor: bandit }], assigned: elspeth, user: USER_SEB
  });
  eq(r1.actor.name, "Elspeth", "a player with the GM's token selected acts on their own character");
  eq(r1.reason, "fallback", "and the fallback is reported, not silent");
  eq(r1.ignored, "Bandit", "naming what was ignored, so a caller can say so");

  /* The GM must be unaffected: selection is how they pick among forty. */
  const r2 = permission.pickActor({
    controlled: [{ actor: bandit }], assigned: null, user: USER_GM
  });
  eq(r2.actor.name, "Bandit", "the GM's selection still wins");
  eq(r2.reason, "controlled", "and is reported as a real selection");

  /* A player selecting their OWN token still gets it. */
  const r3 = permission.pickActor({
    controlled: [{ actor: elspeth }], assigned: elspeth, user: USER_SEB
  });
  eq(r3.actor.name, "Elspeth", "a player's own selected token wins");
  eq(r3.reason, "controlled", "reported as a selection, not a fallback");

  /* Mixed selection: take the first one they can actually write to, not the
     first one in the array. */
  const r4 = permission.pickActor({
    controlled: [{ actor: bandit }, { actor: elspeth }], assigned: null, user: USER_SEB
  });
  eq(r4.actor.name, "Elspeth", "picks the first WRITABLE token, not the first token");

  /* Nothing selected, no character assigned. */
  const r5 = permission.pickActor({ controlled: [], assigned: null, user: USER_SEB });
  eq(r5.actor, null, "nothing to act on returns null rather than throwing");
  eq(r5.reason, "none", "and says so");

  /* Selected something unwritable with no assigned character: still return it,
     because many macros only READ (encNote, the Haggle silver display). */
  const r6 = permission.pickActor({ controlled: [{ actor: bandit }], assigned: null, user: USER_SEB });
  eq(r6.actor.name, "Bandit", "an unwritable selection is still returned for reading");
  eq(r6.reason, "readonly", "flagged readonly so a write still reports honestly");
  ok(permission.canWrite(r6.actor, USER_SEB) === false, "and canWrite still says no about it");

  /* Empty/garbage input does not throw. */
  ok(permission.pickActor().actor === null, "no arguments at all is survivable");
  ok(permission.pickActor({ controlled: null }).actor === null, "a null selection is survivable");
  ok(permission.pickActor({ controlled: [null, undefined] }).actor === null, "empty token entries are skipped");
}

/* ------------------------------------------------------------------ *
 *  3. applyWrite — the report IS the product
 * ------------------------------------------------------------------ */
console.log("\n3. applyWrite — a refused write reports, never throws, never lies");
{
  const mine = makeActor("Elspeth", ["seb"]);
  const r = await permission.applyWrite(mine, { "system.resolve.value": 9 },
    { what: "the 1 Resolve", user: USER_SEB });
  ok(r.ok === true, "a permitted write lands");
  eq(r.notice, null, "and carries no notice");
  eq(mine.writes.length, 1, "and actually reached the document");

  const theirs = makeActor("Bandit", ["gm"]);
  theirs._currentUserOwns = false;
  const r2 = await permission.applyWrite(theirs, { "system.resolve.value": 9 },
    { what: "the 1 Resolve", user: USER_SEB });
  ok(r2.ok === false, "a refused write reports failure");
  ok(typeof r2.notice === "string" && r2.notice.length > 0, "and carries a sentence");
  ok(/Bandit/.test(r2.notice), "which names the actor");
  ok(/the 1 Resolve/.test(r2.notice), "and names what did not happen, in the player's words");
  ok(/GM/.test(r2.notice), "and says who can do it instead");
  eq(theirs.writes.length, 0, "and NOTHING was written");
  eq(r2.error, null, "a refusal is not an error");

  /* Rule 6: the answer is a sentence, not damage. A refused write must not
     apply half of a multi-field change. */
  const partial = makeActor("Bandit2", ["gm"]);
  partial._currentUserOwns = false;
  await permission.applyWrite(partial, { a: 1, b: 2 }, { what: "x", user: USER_SEB });
  eq(partial.writes.length, 0, "a refusal applies no part of a multi-field change");

  /* Permitted but broken is a DIFFERENT message: sending the player to the GM
     for a validation error wastes everyone's time. */
  const broken = makeActor("Elspeth2", ["seb"], { failWrite: true });
  const r3 = await permission.applyWrite(broken, { x: 1 }, { what: "the change", user: USER_SEB });
  ok(r3.ok === false, "a permitted-but-failed write reports failure");
  ok(r3.error instanceof Error, "and carries the error");
  ok(!/do not own/.test(r3.notice), "and does NOT blame ownership");
  ok(/boom/.test(r3.notice), "and surfaces what actually went wrong");

  /* No actor at all. */
  const r4 = await permission.applyWrite(null, { x: 1 }, { what: "the change", user: USER_SEB });
  ok(r4.ok === false, "no actor reports failure");
  ok(/Select your token/.test(r4.notice), "with advice that fits the cause");

  /* Never throws, whatever it is handed. */
  let threw = false;
  try {
    await permission.applyWrite({ name: "Weird" }, { x: 1 }, { user: USER_SEB });
  } catch (e) { threw = true; }
  ok(!threw, "a malformed actor does not throw out of applyWrite");

  /* notify is called exactly once on refusal, not on success -- a toast per
     successful roll would be noise. */
  let toasts = 0;
  const notify = () => { toasts++; };
  await permission.applyWrite(mine, { x: 1 }, { what: "y", user: USER_SEB, notify });
  eq(toasts, 0, "no toast on a successful write");
  await permission.applyWrite(theirs, { x: 1 }, { what: "y", user: USER_SEB, notify });
  eq(toasts, 1, "exactly one toast on a refusal");
}

/* ------------------------------------------------------------------ *
 *  4. applyItemWrite — permission on an Item is the parent's permission
 * ------------------------------------------------------------------ */
console.log("\n4. applyItemWrite — an Item inherits its actor's permission");
{
  const mine = makeActor("Elspeth", ["seb"]);
  const theirs = makeActor("Bandit", ["gm"]);
  theirs._currentUserOwns = false;

  const myBind = makeItem("Flame", mine);
  const r = await permission.applyItemWrite(myBind, { "system.value": 3 },
    { what: "the Weave Scar", user: USER_SEB });
  ok(r.ok === true, "an item on an owned actor is writable");
  eq(myBind.writes.length, 1, "and the write lands");

  const theirBind = makeItem("Flame", theirs);
  const r2 = await permission.applyItemWrite(theirBind, { "system.value": 3 },
    { what: "the Weave Scar", user: USER_SEB });
  ok(r2.ok === false, "an item on an unowned actor is refused");
  eq(theirBind.writes.length, 0, "and nothing is written to it");
  ok(/Bandit/.test(r2.notice), "the notice names the ACTOR, which is what the player recognises");

  /* A loose item with no parent falls back to testing itself, rather than
     crashing on a null parent. */
  const loose = makeItem("Loose", null);
  loose.testUserPermission = () => false;
  const r3 = await permission.applyItemWrite(loose, { x: 1 }, { what: "z", user: USER_SEB });
  ok(r3.ok === false, "a parentless item is judged on itself, not by throwing");
}

/* ------------------------------------------------------------------ *
 *  5. The macro pack agrees with the owner (the deferral path)
 * ------------------------------------------------------------------ */
console.log("\n5. TBE.write / TBE.me defer to the owner, and agree when they cannot");
{
  const LIB = read("macros/_lib.js");

  /* Execute the real _lib.js in a sandbox with no CONFIG and no rules global,
     which is the fallback path, then again WITH the global, which is the
     deferral path. They must not disagree. */
  function runLib({ withGlobal, controlled, assigned, user }) {
    const ui = { notifications: { warn() {}, info() {} } };
    const game = {
      user,
      thebrokenempires: withGlobal ? { rules: { permission } } : undefined
    };
    const canvas = { tokens: { controlled } };
    /* _lib.js declares its own `const TBE`, so it is a local of this body,
       not a parameter -- same reason Foundry can wrap a macro's command in a
       block and let it redeclare things. */
    const fn = new Function("game", "ui", "canvas", "CONFIG", "Roll", "ChatMessage",
      LIB + "\nreturn TBE;");
    return fn(game, ui, canvas, undefined, function () {}, function () {});
  }

  const elspeth = makeActor("Elspeth", ["seb"]);
  const bandit = makeActor("Bandit", ["gm"]);
  bandit._currentUserOwns = false;
  elspeth._currentUserOwns = true;

  /* `game.user.character` is the thing TBE.me() falls back TO, so a stub user
     without one makes the fallback unreachable and the test vacuous. An
     earlier draft of this file missed that and "passed" by returning the
     unwritable token as a read-only actor. */
  const sebWithChar = { ...USER_SEB, character: elspeth };
  for (const withGlobal of [true, false]) {
    const tag = withGlobal ? "deferral" : "fallback";
    const T = runLib({
      withGlobal, controlled: [{ actor: bandit }],
      assigned: elspeth, user: sebWithChar
    });
    /* THE BUG, both paths: a player with the GM's token selected. */
    eq(T.me()?.name, "Elspeth", `[${tag}] TBE.me() skips the token this user cannot write to`);
    ok(T.canWrite(bandit) === false, `[${tag}] TBE.canWrite says no about the GM's creature`);
    ok(T.canWrite(elspeth) === true, `[${tag}] TBE.canWrite says yes about their own character`);

    const before = bandit.writes.length;
    const r = await T.write(bandit, { "system.resolve.value": 1 }, "the 3 Resolve");
    ok(r.ok === false, `[${tag}] TBE.write refuses an unowned actor`);
    ok(/the 3 Resolve/.test(r.notice), `[${tag}] and names the change`);
    eq(bandit.writes.length, before, `[${tag}] and writes nothing`);

    const r2 = await T.write(elspeth, { "system.resolve.value": 1 }, "the 3 Resolve");
    ok(r2.ok === true, `[${tag}] TBE.write allows an owned actor`);
  }

  /* SENTINEL. Proving the deferral by comparing two equal answers proves
     nothing -- both paths could be running the fallback. Give the injected
     owner a fake answer and confirm the macro returns THAT. (loadout_check
     section 3 is the model.) */
  const sentinel = {
    canWrite: () => true,
    pickActor: () => ({ actor: { name: "SENTINEL" }, reason: "controlled" }),
    denialNotice: () => "SENTINEL-NOTICE",
    applyWrite: async () => ({ ok: false, notice: "SENTINEL-NOTICE", error: null }),
    applyItemWrite: async () => ({ ok: false, notice: "SENTINEL-ITEM", error: null })
  };
  const TBEs = (() => {
    const game = { user: USER_SEB, thebrokenempires: { rules: { permission: sentinel } } };
    const fn = new Function("game", "ui", "canvas", "CONFIG", "Roll", "ChatMessage",
      LIB + "\nreturn TBE;");
    return fn(game, { notifications: { warn() {} } },
      { tokens: { controlled: [] } }, undefined, function () {}, function () {});
  })();
  eq(TBEs.me()?.name, "SENTINEL", "TBE.me() really goes through the system owner, not a copy");
  const sr = await TBEs.write(elspeth, { x: 1 }, "y");
  eq(sr.notice, "SENTINEL-NOTICE", "TBE.write really goes through the system owner");
  const si = await TBEs.writeItem(makeItem("i", elspeth), { x: 1 }, "y");
  eq(si.notice, "SENTINEL-ITEM", "TBE.writeItem really goes through the system owner");
}

/* ------------------------------------------------------------------ *
 *  6. No macro still swallows a permission error and asserts the cost
 * ------------------------------------------------------------------ */
console.log("\n6. The swallow-and-assert pattern is gone");
{
  const files = fs.readdirSync(R("macros")).filter((f) => f.endsWith(".js"));

  /* An empty catch around an update is the exact shape that produced the
     lying cards. `catch (e) {}` with a `.update(` in the try is banned. */
  let swallows = [];
  for (const f of files) {
    const code = codeOf(read("macros/" + f));
    /* try { ... .update( ... ) ... } catch (x) {}  -- empty or comment-only */
    const re = /try\s*\{[^{}]*\.update\([^;]*;?[^{}]*\}\s*catch\s*\([^)]*\)\s*\{\s*\}/g;
    const hits = code.match(re) || [];
    if (hits.length) swallows.push(f + " x" + hits.length);
  }
  eq(swallows, [], "no macro catches an update error and discards it");

  /* Every write that a card then describes must go through TBE.write, whose
     return value is the only way to know whether to describe it. Check the
     specific sites that were lying, by name, so a regression is named. */
  const cast = codeOf(read("macros/tbe-cast.js"));
  ok(/TBE\.write\(this\.actor,[\s\S]{0,200}?"the 1 Resolve"/.test(cast),
    "tbe-cast: the failed-spell Resolve goes through TBE.write");
  ok(/w\.ok[\s\S]{0,120}?1 Resolve spent/.test(cast),
    "tbe-cast: the '1 Resolve spent' line is now conditional on the write");
  ok(/Resolve is owed/.test(cast),
    "tbe-cast: and says the cost is owed when it could not be taken");
  ok(/writeItem\(bind/.test(cast), "tbe-cast: the permanent Weave Scar goes through writeItem");

  const attack = codeOf(read("macros/tbe-attack.js"));
  ok(/TBE\.write\(target,[\s\S]{0,160}?"the 3 Resolve"/.test(attack),
    "tbe-attack: the Shock Resolve spend on the TARGET goes through TBE.write");
  ok(/TBE\.write\(target,[\s\S]{0,200}?Death Threshold/.test(attack),
    "tbe-attack: the target's Death Threshold goes through TBE.write");
  /* It used to be a bare await with no try at all, so a permission error threw
     out of the middle of the attack and the card never posted. */
  ok(!/await target\.update\(/.test(attack),
    "tbe-attack: no bare target.update() left to throw mid-attack");

  const lib = codeOf(read("macros/_lib.js"));
  ok(/TBE\.setWounds = async[\s\S]{0,120}?TBE\.write\(/.test(lib), "setWounds reports rather than throwing");
  ok(/TBE\.setShock = async[\s\S]{0,120}?TBE\.write\(/.test(lib), "setShock reports rather than throwing");
  ok(/TBE\.setSupply = async[\s\S]{0,120}?TBE\.write\(/.test(lib), "setSupply reports rather than throwing");

  /* The five files whose cards assert a permanent, irreversible change are
     the ones where a false card costs the most. */
  for (const [file, what] of [
    ["tbe-cast.js", "Weave Scar"], ["_lib.js", "Fraying"],
    ["tbe-wounds.js", "Lethality"], ["tbe-counterspell.js", "Not deducted"],
    ["tbe-talents.js", "Not deducted"]
  ]) {
    const c = codeOf(read("macros/" + file));
    /* Either shape counts: `w.ok ? a : b` or `if (!w.ok) ...`. What is
       being asserted is that the line depends on the write, not which
       spelling of the dependency was used. */
    ok(new RegExp(what).test(c) && (/\.ok\s*\?/.test(c) || /!\w+\.ok/.test(c)),
      `${file}: the ${what} line is conditional on the write landing`);
  }
}

/* ------------------------------------------------------------------ *
 *  7. The owner assumes no ambient state (visibility.mjs's lesson)
 * ------------------------------------------------------------------ */
console.log("\n7. The rule module reaches for no globals");
{
  const src = codeOf(read("system/the-broken-empires/module/rules/permission.mjs"));
  for (const g of ["game.", "ui.", "canvas.", "CONFIG.", "ChatMessage"]) {
    ok(!new RegExp("(^|[^.\\w])" + g.replace(".", "\\.")).test(src),
      `permission.mjs does not reach for the ambient ${g.replace(".", "")}`);
  }
  /* It must therefore take them as parameters. */
  ok(/function canWrite\(actor, user/.test(src), "canWrite takes its user");
  ok(/pickActor\(\{[^)]*user/.test(src), "pickActor takes its user");
  ok(/applyWrite\(actor, changes, \{[^)]*user/.test(src), "applyWrite takes its user");

  /* And it is actually published, or none of the above reaches a macro. */
  const entry = read("system/the-broken-empires/module/the-broken-empires.mjs");
  ok(/permission:\s*\{/.test(entry), "the entry point publishes rules.permission");
  for (const fn of ["canWrite", "pickActor", "applyWrite", "applyItemWrite", "denialNotice"]) {
    ok(new RegExp(fn + ":\\s*permission\\." + fn).test(entry), `rules.permission exposes ${fn}`);
  }
}

/* ------------------------------------------------------------------ *
 *  8. Mutations — break it and watch the check fail
 * ------------------------------------------------------------------ */
console.log("\n8. Mutations");
{
  /* 8a. Restore the old TBE.me() and confirm section 2's claim collapses. */
  const oldMe = ({ controlled, assigned }) => controlled?.[0]?.actor ?? assigned ?? null;
  const elspeth = makeActor("Elspeth", ["seb"]);
  const bandit = makeActor("Bandit", ["gm"]);
  bandit._currentUserOwns = false;
  const got = oldMe({ controlled: [{ actor: bandit }], assigned: elspeth });
  ok(got.name === "Bandit",
    "MUTATION: the pre-v0.38.0 TBE.me() really does return the GM's creature (the bug is real)");
  const fixed = permission.pickActor({
    controlled: [{ actor: bandit }], assigned: elspeth, user: USER_SEB
  });
  ok(fixed.actor.name !== got.name, "MUTATION: and the fix genuinely changes that answer");

  /* 8b. A canWrite that ignores its user -- the "isOwner is good enough"
     shortcut -- must break the GM/player distinction. */
  const naive = (actor) => !!actor.isOwner;
  const conflicted = makeActor("Conflicted", ["gm"]);
  conflicted._currentUserOwns = true;
  ok(naive(conflicted) === true && permission.canWrite(conflicted, USER_SEB) === false,
    "MUTATION: ignoring the passed user gives the wrong answer, which is why it is passed");

  /* 8c. An applyWrite that returns ok:true on refusal -- i.e. the old
     behaviour dressed up -- must make a truthful card impossible. */
  const liar = async () => ({ ok: true, notice: null, error: null });
  const rLiar = await liar();
  const rReal = await permission.applyWrite(
    (() => { const a = makeActor("B", ["gm"]); a._currentUserOwns = false; return a; })(),
    { x: 1 }, { what: "the 1 Resolve", user: USER_SEB });
  ok(rLiar.ok === true && rReal.ok === false,
    "MUTATION: a permissive applyWrite would report success on a refused write");

  /* 8d. Reintroduce the swallow pattern into a copy of a macro and confirm
     section 6's detector fires on it. A detector that has never fired is not
     evidence of anything. */
  const seeded = 'try { await actor.update({ "system.resolve.value": 1 }); } catch (e) {}';
  const re = /try\s*\{[^{}]*\.update\([^;]*;?[^{}]*\}\s*catch\s*\([^)]*\)\s*\{\s*\}/g;
  ok((seeded.match(re) || []).length === 1,
    "MUTATION: the swallow detector fires on a seeded swallow");
  ok((codeOf(read("macros/tbe-cast.js")).match(re) || []).length === 0,
    "MUTATION: and does not fire on the real tbe-cast.js");
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
