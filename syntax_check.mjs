/* Foundry macros run inside an async wrapper, so top-level await is legal.
   node --check parses as CommonJS and rejects it, which is a false alarm.
   Wrap the source the way Foundry does before parsing. */
import fs from "node:fs";
let bad = 0;
for (const f of process.argv.slice(2)) {
  try { new Function("return (async () => {\n" + fs.readFileSync(f, "utf8") + "\n})"); console.log("  ok " + f); }
  catch (e) { bad++; console.error("  SYNTAX " + f + ": " + e.message); }
}
process.exit(bad ? 1 : 0);
