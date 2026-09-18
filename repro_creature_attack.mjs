/* Load the REAL Dragon and Rat out of the built compendium and run the Attack
 * macro with each as the attacker, to see what the weapon picker actually offers. */
import { ClassicLevel } from "classic-level";
import { readFileSync } from "node:fs";

const db = new ClassicLevel("system/the-broken-empires/packs/tbe-bestiary", { keyEncoding: "utf8", valueEncoding: "json" });
await db.open();
const actors = {}, itemsByParent = {};
for await (const [k, v] of db.iterator()) {
  if (k.startsWith("!actors!")) actors[v.name] = v;
  else if (k.startsWith("!actors.items!")) {
    const pid = k.split("!")[2].split(".")[0];
    (itemsByParent[pid] ??= []).push(v);
  }
}
await db.close();

const hydrate = (name) => {
  const a = structuredClone(actors[name]);
  a.items = (itemsByParent[a._id] ?? []).map((i) => ({ ...i, id: i._id }));
  a.id = a._id;
  return a;
};

const src = readFileSync("TBE-Solo-Installer.js", "utf8");
const MACROS = JSON.parse(src.match(/const TBE_MACROS = (\[.*?\]);\nconst TBE_TABLES/s)[1]);
const code = MACROS.find((m) => m.name === "TBE: Attack").command;

for (const name of ["Dragon", "Rat, Giant"]) {
  const attacker = hydrate(name);
  const target = hydrate("Wolf");
  let dialogHtml = null;
  globalThis.foundry = { utils: { duplicate: (x) => structuredClone(x) } };
  globalThis.CONFIG = { sounds: {}, statusEffects: [] };
  globalThis.Roll = class { constructor(f){this.f=f;} async evaluate(){ this.total = 5; return this; } };
  globalThis.ChatMessage = { getSpeaker: () => ({}), create: async () => {} };
  globalThis.ui = { notifications: { warn: (m) => console.log("  [warn]", m), error: (m) => console.log("  [err]", m) } };
  globalThis.canvas = { tokens: { controlled: [{ actor: attacker }] } };
  globalThis.game = { user: { targets: new Set([{ actor: target }]) }, system: { id: "the-broken-empires" } };

  const patched = code
    .replace("const TBE = {};", "const TBE = {}; TBE._cap = CAP;")
    .replace(/TBE\.prompt = async function[\s\S]*?\n};/,
      "TBE.prompt = async function (t, c, o) { TBE._cap(t, c); return null; };");
  console.log(`\n=== ${name} attacking (as attacker) ===`);
  await new Function("CAP", "return (async()=>{" + patched + "})()")((t, c) => { dialogHtml = c; })
    .catch((e) => console.log("  [throw]", e.message));
  if (dialogHtml) {
    const opts = [...dialogHtml.matchAll(/<option value="\d+">([^<]+)<\/option>/g)].map((m) => m[1]);
    console.log("  weapon/defence options offered:");
    for (const o of opts) console.log("    -", o.replace(/&mdash;/g, "-").trim());
  } else console.log("  no dialog was shown");
}
