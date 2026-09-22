/*
 * chat_popup_check.mjs -- the "Chat pop-up duration" setting.
 * Runs the real module/helpers/chat-popups.mjs against a V13-shaped ChatLog
 * (numeric static NOTIFY_DURATION) and a V12-shaped one (none), per CLAUDE.md
 * rule 7: branch on the shape found, never on a version number.
 */
import { readFileSync } from "node:fs";
import * as cp from "./system/the-broken-empires/module/helpers/chat-popups.mjs";

let pass = 0, fail = 0;
const check = (cond, label, extra) => {
  if (cond) { pass++; console.log("  PASS  " + label); }
  else { fail++; console.log("  FAIL  " + label + (extra !== undefined ? "  <- " + JSON.stringify(extra) : "")); }
};

console.log("\n1. V13+ shape: the duration is applied");
{
  class ChatLog { static NOTIFY_DURATION = 5000; }
  class Custom extends ChatLog {}
  check(cp.applyChatPopupDuration(20, [ChatLog, ChatLog]) === 1, "one class changed, duplicates ignored");
  check(ChatLog.NOTIFY_DURATION === 20000, "20 s -> 20000 ms", ChatLog.NOTIFY_DURATION);
  check(Custom.NOTIFY_DURATION === 20000, "a subclass that does not override inherits it");
  check(cp.applyChatPopupDuration(999, [ChatLog]) === 1 && ChatLog.NOTIFY_DURATION === cp.MAX_SECONDS * 1000, "clamped to the max");
  cp.applyChatPopupDuration(1, [ChatLog]);
  check(ChatLog.NOTIFY_DURATION === cp.MIN_SECONDS * 1000, "clamped to the min");
  cp.applyChatPopupDuration("junk", [ChatLog]);
  check(ChatLog.NOTIFY_DURATION === cp.DEFAULT_SECONDS * 1000, "garbage falls back to the default");
  check(cp.DEFAULT_SECONDS > 5, "the default lingers longer than Foundry's 5 s", cp.DEFAULT_SECONDS);
}

console.log("\n2. V12 shape: left alone");
{
  class OldChatLog {}
  check(cp.applyChatPopupDuration(20, [OldChatLog, undefined, null]) === 0, "nothing changed");
  check(!("NOTIFY_DURATION" in OldChatLog), "no static property invented on a class that never reads it");
}

console.log("\n3. Wiring");
{
  const main = readFileSync("system/the-broken-empires/module/the-broken-empires.mjs", "utf8");
  const reg = main.slice(main.indexOf("'chatPopupSeconds'"), main.indexOf("'chatPopupSeconds'") + 600);
  check(/scope:\s*'client'/.test(reg), "the setting is per user (client scope)");
  check(/config:\s*true/.test(reg), "and visible in Configure Settings");
  check(/onChange:[^\n]*applyChatPopupDuration/.test(reg), "changing it applies at once");
  check(/Hooks\.once\('ready', function \(\) \{\s*chatPopups\.applyChatPopupDuration/.test(main), "applied at ready for every user, not only the GM");
  const en = JSON.parse(readFileSync("system/the-broken-empires/lang/en.json", "utf8"));
  check(!!en.TBE?.Settings?.ChatPopupSeconds?.Name && !!en.TBE.Settings.ChatPopupSeconds.Hint, "name and hint are localised");
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
