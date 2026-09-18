/* Read the built packs back and check they are structurally what Foundry expects. */
import { ClassicLevel } from "classic-level";
import { readdirSync } from "node:fs";
import path from "node:path";

const ROOT = "system/the-broken-empires/packs";
const KEY = /^!([a-z]+)(?:\.([a-z]+))?!([A-Za-z0-9]{16})(?:\.([A-Za-z0-9]{16}))?$/;
const SIZES = ["Minute","Diminutive","Tiny","Little","Small","Medium","Large","Huge","Massive","Gargantuan","Colossal"];
const ITEM_TYPES = new Set(["skill","weapon","armor","shield","talent"]);

let problems = 0;
const fail = (m) => { console.log("  FAIL " + m); problems++; };

for (const name of readdirSync(ROOT, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort()) {
  const db = new ClassicLevel(path.join(ROOT, name), { keyEncoding: "utf8", valueEncoding: "json" });
  await db.open();
  const parents = new Set(), children = [], parentDocs = new Map();
  let n = 0, sample = null;

  for await (const [k, v] of db.iterator()) {
    n++;
    const m = KEY.exec(k);
    if (!m) { fail(`${name}: malformed key ${k}`); continue; }
    const [, , embedded, parentId, childId] = m;
    if (embedded) children.push([parentId, embedded, childId, k]);
    else { parents.add(parentId); parentDocs.set(parentId, v); }

    if (v._id !== (childId || parentId)) fail(`${name}: _id ${v._id} does not match key ${k}`);
    if (!v.name && !embedded) fail(`${name}: document ${k} has no name`);
    if (v.type && ITEM_TYPES.has(v.type) === false && name.includes("talents")) fail(`${name}: bad item type ${v.type}`);
    if (v.system?.size && !SIZES.includes(v.system.size)) fail(`${name}: off-ladder size ${v.system.size} on ${v.name}`);
    if (!sample) sample = k;
  }
  // Every embedded document must point at a parent that exists in the same pack,
  // AND that parent's own record must carry the child's id in its manifest field
  // (e.g. actor.items = ["id1","id2"]) -- Foundry's real loader finds embedded
  // documents by reading that manifest, not by scanning the database for
  // matching keys, so a correct key with a missing manifest entry is still a
  // document Foundry will never actually attach.
  for (const [pid, field, cid, k] of children) {
    if (!parents.has(pid)) { fail(`${name}: orphan ${k}`); continue; }
    const manifest = parentDocs.get(pid)?.[field];
    if (!Array.isArray(manifest) || !manifest.includes(cid)) {
      fail(`${name}: parent ${pid} has no manifest entry for ${field} child ${cid} (embedded record exists but Foundry will never load it)`);
    }
  }
  console.log(`  ${name.padEnd(14)} ${String(n).padStart(4)} keys, ${parents.size} top-level, ${children.length} embedded`);
  console.log(`  ${"".padEnd(14)} e.g. ${sample}`);
  await db.close();
}
console.log(problems ? `\n${problems} problem(s)` : "\nall packs structurally valid");
