/**
 * sheet_form_check.mjs
 *
 * Two inputs in one <form> sharing a `name` is not a cosmetic duplicate. Foundry's
 * FormDataExtended collects a repeated name into an ARRAY and hands that to the
 * DataModel, which cleans it into whatever the field type makes of an array. A
 * StringField makes "14,14" of it. That is how every creature in a real world
 * ended up with system.initiative = "14,14,NaN,NaN,..." and an effective
 * Initiative of 0, acting last in every round of a five-round fight, with all
 * fifteen other verification scripts green: nothing here was a rule, a number or
 * a formula, so nothing that checks rules, numbers or formulas could see it.
 *
 * So this script asserts a structural property of the templates instead: expand
 * every actor sheet's partials the way Handlebars would, collect every named
 * form control, and require the names to be unique per form. It also pins the
 * two specific things the v0.33.0 fix relies on -- one initiative input, and a
 * data-dtype that follows the DataModel rather than being hardcoded Number over
 * a StringField -- and runs the real migration step over the real corrupted
 * strings the probe found in the wild.
 */
import fs from "node:fs";
import path from "node:path";
import { STEPS } from "./system/the-broken-empires/module/migration/migration.mjs";

const ROOT = "system/the-broken-empires/templates";
const PREFIX = "systems/the-broken-empires/templates/";

let pass = 0;
const fails = [];
const ok = (cond, msg) => { if (cond) pass++; else fails.push(msg); };

/** Inline {{> "systems/..."}} partials, depth-first, so one sheet = one form. */
function expand(rel, seen = new Set(), src = null) {
  const file = path.join(ROOT, rel);
  let text = src ?? fs.readFileSync(file, "utf8");
  if (seen.has(rel)) return "";
  seen.add(rel);
  return text.replace(/\{\{>\s*"([^"]+)"\s*\}\}/g, (_m, p) =>
    p.startsWith(PREFIX) ? expand(p.slice(PREFIX.length), seen) : "");
}

/** Named form controls, with the {{#each}} loops they sit inside left alone:
 *  a name containing {{...}} is per-iteration and legitimately repeats. */
function namedControls(html) {
  const out = [];
  const re = /<(input|select|textarea)\b[^>]*\bname="([^"]+)"[^>]*>/gi;
  let m;
  while ((m = re.exec(html))) {
    const name = m[2];
    if (name.includes("{{")) continue;            // templated, one per loop pass
    if (/type="(radio|submit|button)"/i.test(m[0])) continue;  // radios share by design
    out.push({ tag: m[1], name, html: m[0] });
  }
  return out;
}

const SHEETS = fs.readdirSync(path.join(ROOT, "actor")).filter((f) => f.endsWith("-sheet.hbs"));
ok(SHEETS.length >= 2, `expected at least the character and creature sheets, found ${SHEETS.length}`);

/* 1. No actor sheet form repeats a field name. ------------------------------- */
for (const sheet of SHEETS) {
  const html = expand(path.join("actor", sheet));
  const counts = new Map();
  for (const c of namedControls(html)) counts.set(c.name, (counts.get(c.name) ?? 0) + 1);
  const dupes = [...counts].filter(([, n]) => n > 1);
  ok(dupes.length === 0,
    `${sheet}: field name(s) used by more than one control: ` +
    dupes.map(([n, c]) => `${n} x${c}`).join(", ") +
    " -- FormDataExtended will submit an array for each of these");
  ok(counts.size > 5, `${sheet}: expanded to only ${counts.size} named controls, partials probably did not inline`);
}

/* 2. The specific field this was found on. ----------------------------------- */
for (const sheet of SHEETS) {
  const html = expand(path.join("actor", sheet));
  const init = namedControls(html).filter((c) => c.name === "system.initiative");
  ok(init.length === 1, `${sheet}: expected exactly 1 editable Initiative input, found ${init.length}`);
  if (init.length === 1) {
    const dtype = /data-dtype="([^"]*)"/.exec(init[0].html)?.[1] ?? "";
    ok(dtype.includes("{{"),
      `${sheet}: Initiative data-dtype is hardcoded "${dtype}". creature.initiative is a StringField and ` +
      `character.initiative is a NumberField, so a fixed dtype is wrong on one of them ` +
      `(Number over a blank StringField submits the literal string "NaN").`);
  }
}

/* 3. The creature header still SHOWS the value it no longer owns. ------------ */
{
  const raw = fs.readFileSync(path.join(ROOT, "actor/actor-creature-sheet.hbs"), "utf8");
  ok(/Initiative<\/label>\s*\n\s*<span[^>]*>\{\{system\.initiative\}\}<\/span>/.test(raw),
    "creature sheet header should display {{system.initiative}} read-only, not drop it entirely");
}

/* 4. The migration step, run over the strings the probe actually found. ------ */
{
  const step = STEPS.find((s) => s.version === "0.33.0");
  ok(!!step, "no 0.33.0 migration step");
  ok(step?.collection === "tokens",
    `0.33.0 must walk "tokens" (world actors AND unlinked token actors); it walks "${step?.collection}". ` +
    "Every corrupted actor in the reported world was a token actor.");

  const creature = (initiative) => ({ type: "creature", system: { initiative } });
  const cases = [
    // [stored value, expected repair, note]
    ["14,14,NaN,NaN,NaN,NaN,NaN,NaN,NaN,NaN,NaN,NaN,NaN,NaN", "14", "Elspeth Dunmore, 13 saves"],
    ["14,14,NaN,NaN,NaN,NaN,NaN,NaN", "14", "Morrk"],
    ["12,12", "12", "Renn Kestral, one save"],
    [",", "", "Armand Alarcon, blank initiative saved twice"],
    ["NaN", "", "a blank saved through a Number dtype"]
  ];
  for (const [stored, want, note] of cases) {
    const got = step?.apply(creature(stored))?.["system.initiative"];
    ok(got === want, `repair ${note}: "${stored}" -> expected "${want}", got ${JSON.stringify(got)}`);
  }

  /* Idempotent and non-destructive. */
  ok(step?.apply(creature("14")) === null, "a clean value must be left alone");
  ok(step?.apply(creature("")) === null, "a legitimately blank value must be left alone");
  ok(step?.apply({ type: "character", system: { initiative: 14 } }) === null,
    "characters carry a NumberField and must not be touched");
  const once = step?.apply(creature("14,14,NaN"))?.["system.initiative"];
  ok(step?.apply(creature(once)) === null, "running the step twice must be indistinguishable from once");
}

/* 5. Mutation: put the duplicate back and confirm section 1 catches it. ------ */
{
  const file = path.join(ROOT, "actor/actor-creature-sheet.hbs");
  const good = fs.readFileSync(file, "utf8");
  const broken = good.replace(
    '<span class="resource-content" title="Edit this on the Overview tab">{{system.initiative}}</span>',
    '<input type="text" name="system.initiative" value="{{system.initiative}}"/>');
  ok(broken !== good, "mutation did not apply -- the read-only span it targets has moved");
  const html = expand("actor/actor-creature-sheet.hbs", new Set(), broken);
  const n = namedControls(html).filter((c) => c.name === "system.initiative").length;
  ok(n === 2, `mutation should produce 2 Initiative inputs, produced ${n} -- this check would not catch a regression`);
}

console.log(`${pass} passed, ${fails.length} failed`);
for (const f of fails) console.log("  FAIL " + f);
process.exit(fails.length ? 1 : 0);
