#!/usr/bin/env node
/*
 * card_claim_check.mjs -- a shared chat card's button acts once, however many
 * clients click it at once (CLAUDE.md scope rule 3). Owner:
 * module/rules/card-claim.mjs.
 *
 * Everything here is concurrent on purpose: clicks are fired in the same tick
 * and the socket and the flag write have latency, because "it works when you
 * click it once" is exactly the test that cannot see a double action.
 *
 *   1. The referee: twenty simultaneous claims, one winner; other actions and
 *      other messages are independent.
 *   2. The flag write is slow to show: still one winner. Mutation: drop the
 *      queue and the session memory (i.e. read-the-flag-then-write, what each
 *      client would do on its own) and two or more win.
 *   3. A GM and two players, over a socket with latency, all click at once:
 *      one action, the others told who clicked first, the winner on the flag.
 *   4. Two GMs online: one referee, one decision per click.
 *   5. No GM connected: a sentence, no socket traffic, nothing done.
 *   6. The GM never answers: a timeout sentence, nothing done.
 *   7. After a reload (fresh referee), the flag alone refuses a second click.
 *   8. The flag cannot be written (card deleted): refused with the reason,
 *      and the action is not marked taken.
 *   9. Who referees: Foundry's activeGM where present, else the lowest-id
 *      active GM; nobody when no GM is on.
 *  10. The macro library defers to the system, and says no without it.
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

let pass = 0, fail = 0;
const check = (cond, label, extra) => {
  if (cond) { pass++; console.log("  PASS  " + label); }
  else { fail++; console.log("  FAIL  " + label + (extra !== undefined ? "  <- " + JSON.stringify(extra).slice(0, 500) : "")); }
};
const section = (s) => console.log("\n" + s);
const OWNER = "./system/the-broken-empires/module/rules/card-claim.mjs";
const C = await import(OWNER);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const jitter = () => sleep(Math.floor(Math.random() * 6));

/* A chat message store with slow, non-atomic writes, like a server round trip. */
function store({ lagRead = false } = {}) {
  const msgs = { M1: { flags: {} }, M2: { flags: {} } };
  const visible = {};
  return {
    msgs,
    readClaim: (id, action) => (lagRead ? null : msgs[id]?.flags?.[C.SCOPE]?.claims?.[action] ?? null),
    writeClaim: async (id, action, claim) => {
      await jitter();
      if (!msgs[id]) throw new Error("that chat card no longer exists");
      const f = (msgs[id].flags[C.SCOPE] ??= { claims: {} });
      (f.claims ??= {})[action] = claim;
      visible[id + action] = true;
    }
  };
}

/* ------------------------------------------------------------------ 1 */
section("1. The referee");
{
  const s = store();
  const decide = C.makeArbiter(s);
  const users = Array.from({ length: 20 }, (_, i) => "U" + i);
  const res = await Promise.all(users.map((u) => decide("M1", "apply-damage", u)));
  const wins = res.filter((r) => r.ok);
  check(wins.length === 1, "twenty clicks in one tick: one winner", wins.length);
  check(res.filter((r) => !r.ok).every((r) => r.by === wins[0].by), "every other click is told the same winner");
  check(s.msgs.M1.flags[C.SCOPE].claims["apply-damage"].by === wins[0].by, "and the winner is on the message");
  const other = await Promise.all([decide("M1", "accept", "U3"), decide("M2", "apply-damage", "U4")]);
  check(other.every((r) => r.ok), "another action on the same card, and the same action on another card, are separate");
}

/* ------------------------------------------------------------------ 2 */
section("2. The flag is slow to show");
{
  const s = store({ lagRead: true });
  const decide = C.makeArbiter(s);
  const res = await Promise.all(["A", "B", "C", "D"].map((u) => decide("M1", "go", u)));
  check(res.filter((r) => r.ok).length === 1, "still one winner while the flag cannot be read back");
  const later = await decide("M1", "go", "E");
  check(!later.ok, "and a later click in this session is refused from memory");
  /* Mutation: no queue, no memory: read the flag, then write it. */
  const src = fs.readFileSync(OWNER, "utf8");
  const a = "const prior = queue.get(key) ?? Promise.resolve();", b = "const known = decided.get(key) ?? readClaim(messageId, action);";
  check(src.includes(a) && src.includes(b), "the queue and the memory are where the mutation expects them");
  const file = path.resolve("system/the-broken-empires/module/rules/.card-claim.mut.mjs");
  fs.writeFileSync(file, src.replace(a, "const prior = Promise.resolve();").replace(b, "const known = readClaim(messageId, action);"));
  try {
    const M = await import(pathToFileURL(file).href + "?m=1");
    const s2 = store();
    const d2 = M.makeArbiter(s2);
    const r2 = await Promise.all(["A", "B", "C", "D"].map((u) => d2("M1", "go", u)));
    check(r2.filter((r) => r.ok).length > 1, "mutation: read-then-write lets more than one click win, the double action this exists to stop", r2.filter((r) => r.ok).length);
  } finally { fs.unlinkSync(file); }
}

/* A table: clients on a socket that, like Foundry's, never echoes to the sender. */
function table(userIds, gmIds, { refereeId, deliver = true } = {}) {
  const s = store();
  const clients = {};
  const traffic = [];
  const decisions = [];
  const arbiterFor = {};
  for (const id of userIds) {
    const decide = C.makeArbiter(s);
    arbiterFor[id] = async (...a) => { decisions.push(id); return decide(...a); };
    clients[id] = C.makeClient({
      userId: id,
      isArbiter: () => refereeId === id,
      hasArbiter: () => !!refereeId,
      arbiter: arbiterFor[id],
      emit: (p) => {
        traffic.push(p.type);
        if (!deliver) return;
        for (const [other, cl] of Object.entries(clients)) if (other !== id) jitter().then(() => cl.handle(p));
      },
      names: (u) => ({ GM: "the GM", P1: "Kit", P2: "Ash", GM2: "the co-GM" }[u] ?? u),
      timeoutMs: 200
    });
  }
  return { s, clients, traffic, decisions };
}

/* ------------------------------------------------------------------ 3 */
section("3. A GM and two players click at once");
{
  const t = table(["GM", "P1", "P2"], ["GM"], { refereeId: "GM" });
  let applied = 0;
  const click = async (u) => { const r = await t.clients[u].claim("M1", "apply-damage"); if (r.ok) applied++; return r; };
  const res = await Promise.all(["P1", "GM", "P2"].map(click));
  check(applied === 1, "the action happens once", applied);
  const loser = res.filter((r) => !r.ok);
  check(loser.length === 2 && loser.every((r) => /^Already done: .+ clicked it first\.$/.test(r.notice)), "the other two are told who clicked first", loser.map((r) => r.notice));
  check(t.s.msgs.M1.flags[C.SCOPE].claims["apply-damage"].by === res.find((r) => r.ok).by, "the card records the winner");
  check(t.decisions.every((d) => d === "GM"), "only the GM's client decided");
}

/* ------------------------------------------------------------------ 4 */
section("4. Two GMs online");
{
  const t = table(["GM", "GM2", "P1"], ["GM", "GM2"], { refereeId: "GM" });
  const res = await Promise.all(["GM2", "GM", "P1"].map((u) => t.clients[u].claim("M1", "x")));
  check(res.filter((r) => r.ok).length === 1, "one winner");
  check(t.decisions.length === 3 && t.decisions.every((d) => d === "GM"), "every click decided once, by the one referee (the co-GM asks too)", t.decisions);
}

/* ------------------------------------------------------------------ 5 */
section("5. No GM connected");
{
  const t = table(["P1", "P2"], [], { refereeId: null });
  const r = await t.clients.P1.claim("M1", "x");
  check(!r.ok && /needs the GM connected/.test(r.notice), "a sentence");
  check(!t.traffic.length && !t.decisions.length && !t.s.msgs.M1.flags[C.SCOPE], "no socket traffic, nothing decided, nothing written");
}

/* ------------------------------------------------------------------ 6 */
section("6. The GM never answers");
{
  const t = table(["GM", "P1"], ["GM"], { refereeId: "GM", deliver: false });
  const r = await t.clients.P1.claim("M1", "x");
  check(!r.ok && /did not answer/.test(r.notice) && !t.s.msgs.M1.flags[C.SCOPE], "after the timeout: a sentence, nothing done");
}

/* ------------------------------------------------------------------ 7 */
section("7. After a reload");
{
  const s = store();
  await C.makeArbiter(s)("M1", "x", "P1");
  const fresh = C.makeArbiter(s);
  const r = await fresh("M1", "x", "GM");
  check(!r.ok && r.by === "P1", "a new session reads the flag and refuses");
  check(C.claimedBy(s.msgs.M1, "x") === "P1", "claimedBy reads it back for a card's render");
}

/* ------------------------------------------------------------------ 8 */
section("8. The flag cannot be written");
{
  const s = store();
  const decide = C.makeArbiter(s);
  const r = await decide("GONE", "x", "P1");
  check(!r.ok && /no longer exists/.test(r.error), "refused, with the reason");
  const c = C.makeClient({ userId: "GM", isArbiter: () => true, hasArbiter: () => true, arbiter: decide, emit: () => {} });
  const r2 = await c.claim("GONE", "x");
  check(/could not be recorded \(that chat card no longer exists\)/.test(r2.notice), "the clicker reads why", r2.notice);
  s.msgs.GONE = { flags: {} };
  check((await decide("GONE", "x", "P1")).ok, "and the action was not marked taken, so a retry can still win");
}

/* ------------------------------------------------------------------ 9 */
section("9. Who referees");
{
  const us = [{ id: "b", isGM: true, active: true }, { id: "a", isGM: true, active: true }, { id: "c", isGM: false, active: true }, { id: "0", isGM: true, active: false }];
  check(C.arbiterId(us) === "a", "without activeGM: the lowest-id ACTIVE GM");
  check(C.arbiterId(Object.assign(us.slice(), { activeGM: { id: "b" } })) === "b", "Foundry's activeGM wins where the API has it");
  check(C.arbiterId(Object.assign(us.slice(), { activeGM: null })) === null && C.arbiterId([{ id: "c", isGM: false, active: true }]) === null, "nobody, when no GM is on");
  check(/"socket": true/.test(fs.readFileSync("system/the-broken-empires/system.json", "utf8")), "the manifest opens the system socket");
  const entry = fs.readFileSync("system/the-broken-empires/module/the-broken-empires.mjs", "utf8");
  check(/cardClaim\.install\(\)/.test(entry) && /cards: \{ claim: cardClaim\.claim/.test(entry), "installed at ready and exposed on game.thebrokenempires.cards");
  /* install() against a stub game registers on the system channel. */
  const on = [];
  globalThis.game = { user: { id: "GM" }, users: Object.assign([{ id: "GM", isGM: true, active: true }], { activeGM: { id: "GM" }, get: () => ({ name: "GM" }) }),
    messages: { get: () => null }, socket: { on: (ch, fn) => on.push(ch), emit: () => {} } };
  C.install();
  check(on.length === 1 && on[0] === "system.the-broken-empires", "install listens on system.the-broken-empires");
  delete globalThis.game;
}

/* ------------------------------------------------------------------ 10 */
section("10. The macro library");
{
  const lib = fs.readFileSync("macros/_lib.js", "utf8");
  const TBE = new Function("const TBE_DATA = { tables: [] };\n" + lib + "\n;return TBE;")();
  globalThis.game = { thebrokenempires: { cards: { claim: async (m, a) => ({ ok: true, by: "SENTINEL:" + m + ":" + a }) } } };
  check((await TBE.claimCard("M1", "go")).by === "SENTINEL:M1:go", "TBE.claimCard defers to the system");
  globalThis.game = {};
  const r = await TBE.claimCard("M1", "go");
  check(!r.ok && /need The Broken Empires system/.test(r.notice), "and without it, refuses with a sentence rather than guessing");
  delete globalThis.game;
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
