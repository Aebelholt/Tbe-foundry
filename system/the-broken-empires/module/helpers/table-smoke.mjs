/* The table compatibility probe, v0.56.0. Synthetic data, no game rules.
 * Runs only on documents tagged with this invocation's id. No active scene,
 * encounter, world setting or existing actor is changed. Individual failures
 * do not stop the other probes or cleanup. The macro supplies its real form
 * helper so the file check exercises the same path as Oracle Import.
 */
import { actorDefaults, tokenDefaults, sceneDefaults, settingsOf } from "./table-defaults.mjs";
import { browser, roster, folderList } from "./portraits.mjs";
import { resultData } from "./oracle-import.mjs";
import { forget } from "./memory.mjs";

const SCOPE = "the-broken-empires";
const TAG = "tableSmoke";
let running = false;
const assert = (ok, message) => { if (!ok) throw new Error(message); };
const message = (err) => String(err?.message ?? err);
const contents = (collection) => collection?.contents ?? Array.from(collection ?? []);
const rootOf = (app) => app?.element?.[0] ?? app?.element;
const field = (obj, path) => path.split(".").reduce((v, k) => v?.[k], obj);
function matches(actual, expected, prefix = "") {
  for (const [key, value] of Object.entries(expected ?? {})) {
    const path = prefix ? prefix + "." + key : key;
    if (value && typeof value === "object") matches(actual, value, path);
    else assert(field(actual, path) === value, path + " did not receive its configured default");
  }
}

/** Returns a report; posting it is the macro's job, through chat visibility. */
export async function runTableSmokeTest({ filePrompt } = {}) {
  if (!game.user?.isGM) return { refused: "Only a GM can run the table smoke test." };
  if (running) return { refused: "A table smoke test is already running on this client." };
  running = true;
  const report = { version: game.version ?? game.release?.version ?? "unknown",
    system: game.system?.version ?? "unknown", rows: [], cancelled: false, ok: false };
  const id = foundry.utils.randomID();
  const flags = () => ({ [SCOPE]: { [TAG]: id } });
  const docs = [], apps = [];
  const owned = (doc) => doc?.getFlag?.(SCOPE, TAG) === id || doc?.flags?.[SCOPE]?.[TAG] === id;
  const probe = async (name, fn, requires = true) => {
    if (!requires) { report.rows.push({ name, status: "NOT RUN", detail: "A prerequisite failed." }); return null; }
    try {
      const detail = await fn();
      report.rows.push({ name, status: "PASS", detail: detail ?? "" });
      return true;
    } catch (err) {
      report.rows.push({ name, status: "FAIL", detail: message(err) });
      return false;
    }
  };
  const create = async (Class, data) => {
    const doc = await Class.create({ ...data, flags: flags(), ownership: { default: 0 } }, { renderSheet: false });
    if (doc) docs.push(doc);
    assert(doc && owned(doc), "The temporary document was not created with its smoke-test tag.");
    return doc;
  };
  let pc, creature, blank, scene, token, table, name;
  const api = game.thebrokenempires;
  try {
    const named = await probe("DialogV2: actor name", async () => {
      const DV2 = foundry.applications?.api?.DialogV2;
      assert(DV2?.prompt, "DialogV2.prompt is unavailable.");
      name = await DV2.prompt({ window: { title: "TBE: Table Smoke Test" }, rejectClose: false,
        content: '<p>This checks Foundry with temporary actors, a scene, a table and an encounter, then deletes them. A private report follows.</p>' +
          '<label>Temporary actor name <input name="name" type="text" value="Table Smoke" autofocus></label>',
        ok: { label: "Run test", callback: (_ev, button) => button.form.elements.name.value.trim() || "Table Smoke" } });
      if (name === null) { report.cancelled = true; return "Cancelled before creating documents."; }
      assert(typeof name === "string" && name.length, "The name prompt did not return the input's text.");
      return "The form returned the actor name.";
    });
    if (!named || report.cancelled) return report;

    await probe("DialogV2: file input", async () => {
      assert(typeof filePrompt === "function", "The macro's form helper is unavailable.");
      let seeded = false, seedError = "";
      const result = await filePrompt("TBE: Table Smoke Test: file input",
        '<p>A small test file is attached automatically. Click Check file. No file is uploaded or imported.</p>' +
        '<input type="file" name="file" accept=".json,application/json">', "Check file", {
          /* V12 documents the second argument as the dialog element; allow
           * an application wrapper as well. Probe the shape, not the version.
           * https://foundryvtt.com/api/v12/types/foundry.DialogV2RenderCallback.html */
          render: (_event, dialog) => {
            try {
              const root = rootOf(dialog) ?? dialog;
              const input = root.querySelector('input[name="file"]');
              const transfer = new DataTransfer();
              transfer.items.add(new File([JSON.stringify({ tableSmoke: id })], "tbe-smoke.json", { type: "application/json" }));
              input.files = transfer.files;
              seeded = input.files.length === 1;
            } catch (err) { seedError = message(err); }
          }
        });
      assert(seeded, "Could not attach the test file" + (seedError ? ": " + seedError : "."));
      assert(result?.file?.text && result.file.size, "The form did not return a File (or was closed).");
      assert(JSON.parse(await result.file.text()).tableSmoke === id, "The file's text changed in the form.");
      return "The real macro form returned a readable File.";
    });

    const defaults = settingsOf((ns, key) => game.settings.get(ns, key));
    await probe("Actor defaults", async () => {
      pc = await create(Actor, { name, type: "character" });
      creature = await create(Actor, { name: name + " rated", type: "creature", system: { initiative: "7" } });
      blank = await create(Actor, { name: name + " unrated", type: "creature", system: { initiative: "" } });
      matches(pc, actorDefaults("character", defaults));
      matches(creature, actorDefaults("creature", defaults));
      assert(!creature.prototypeToken.actorLink, "The creature prototype is linked.");
      return "Prototype tokens match this world's configured defaults.";
    });
    await probe("Scene defaults", async () => {
      scene = await create(Scene, { name: "TBE smoke: " + name, active: false, navigation: false,
        width: 1000, height: 1000 });
      matches(scene, sceneDefaults(defaults));
      assert(!scene.active, "The temporary scene became active.");
      return "The inactive scene received its configured defaults.";
    });
    await probe("Token defaults", async () => {
      [token] = await scene.createEmbeddedDocuments("Token", [{ ...pc.prototypeToken.toObject(), actorId: pc.id, x: 0, y: 0 }]);
      assert(token, "No token was created.");
      matches(token, tokenDefaults("character", defaults));
      return "The placed token received its configured defaults.";
    }, !!(scene && pc));

    const marker = "Table smoke marker " + id;
    let deltaReady = false;
    await probe("Token delta.toObject()", async () => {
      await token.update({ actorLink: false });
      assert(token.actor && token.actor !== pc, "The unlinked token has no synthetic actor.");
      await token.actor.update({ name: name + " token copy", "system.notes": marker });
      await token.actor.createEmbeddedDocuments("Item", [{ name: marker, type: "skill" }]);
      assert(typeof token.delta?.toObject === "function", "token.delta.toObject() is unavailable.");
      const delta = token.delta.toObject();
      assert(delta.system?.notes === marker, "The synthetic actor write did not reach the delta.");
      assert(api.tokens.deltaSummary(token).hasBuild, "The token-link owner did not find the delta.");
      deltaReady = true;
      return "Synthetic actor changes reached the token's private copy.";
    }, !!token);
    await probe("Link token: keep token", async () => {
      await api.tokens.linkToken({ token, actor: pc }, "token");
      assert(token.actorLink && token.actor.id === pc.id && pc.system.notes === marker &&
        pc.items.some((i) => i.name === marker), "The token's build was not kept on the sidebar actor.");
      return "The private build and Item reached the sidebar actor before linking.";
    }, deltaReady);
    await probe("Link token: keep actor", async () => {
      const before = JSON.stringify(pc.toObject());
      const [other] = await scene.createEmbeddedDocuments("Token", [{ ...pc.prototypeToken.toObject(), actorId: pc.id, x: 100, y: 0 }]);
      await other.update({ actorLink: false });
      await other.actor.update({ "system.notes": "discard this temporary delta" });
      await api.tokens.linkToken({ token: other, actor: pc }, "actor");
      assert(other.actorLink && other.actor.system.notes === marker && JSON.stringify(pc.toObject()) === before,
        "Keeping the sidebar actor changed it or retained the private delta.");
      return "The sidebar actor stayed unchanged; the token uses it.";
    }, !!(scene && pc && pc.system.notes === marker));

    await probe("FilePicker and portrait roster", async () => {
      const browse = browser();
      assert(browse, "No supported FilePicker.browse was found.");
      const files = await browse("systems/the-broken-empires/assets");
      assert(Array.isArray(files?.files) && files.files.some((p) => p.endsWith("anvil-impact.png")),
        "FilePicker could not list the installed system's image folder.");
      const folders = folderList(game.settings.get(SCOPE, "portraitFolders"));
      for (const dir of folders) {
        const listed = await browse(dir);
        assert(Array.isArray(listed?.files), "FilePicker could not read portrait folder: " + dir);
      }
      const list = await roster(true);
      assert(Array.isArray(list) && list.every((p) => typeof p.path === "string"), "The portrait roster has an unexpected shape.");
      return (foundry.applications?.apps?.FilePicker?.implementation ? "Namespaced" : "Global") +
        " FilePicker; " + list.length + " portraits" + (folders.length ? "." : " (no portrait folders configured).");
    });

    let tableReady = false;
    await probe("RollTable create and update", async () => {
      const fields = CONFIG.TableResult?.documentClass?.schema?.fields;
      assert(fields?.name || fields?.text, "The TableResult text schema could not be detected.");
      const type = CONST.TABLE_RESULT_TYPES?.TEXT ?? "text";
      const row = (text, n) => resultData({ text, range: [n, n] }, fields, type);
      table = await create(RollTable, { name: "TBE smoke: " + name, formula: "1d1", replacement: true,
        results: [row("First", 1), row("Second", 2)] });
      const first = table.results.find((r) => r.range[0] === 1);
      assert(first, "The table has no first result.");
      await table.updateEmbeddedDocuments("TableResult", [{ _id: first.id, ...row("Updated", 1) }]);
      const changed = table.results.get(first.id);
      assert((fields.name ? changed.description : changed.text) === "Updated", "The result text did not survive create/update.");
      tableReady = true;
      return fields.name ? "name/description results survived create and update." : "text results survived create and update.";
    });
    await probe("RollTable.roll with a modifier", async () => {
      const roll = await new Roll("1d1 + 1").evaluate();
      const draw = await table.roll({ roll });
      assert(draw?.roll?.total === 2 && draw.results?.length === 1 && draw.results[0].range[0] === 2,
        "The supplied modified roll did not select the second result.");
      return "The supplied roll selected the expected synthetic result.";
    }, tableReady);

    await probe("Create Character: step 1", async () => {
      const app = await api.chargen.open(pc);
      assert(app, "Create Character did not return a window.");
      apps.push(app);
      const root = rootOf(app);
      assert(root?.querySelector('[data-step="concept"].cur') && root.querySelector('[data-bind="name"]') &&
        root.querySelector(".tbe-cc-sheet"), "Step 1 and its live sheet did not finish rendering.");
      await app.close();
      return "The real ApplicationV2 window rendered step 1 and its live sheet.";
    }, !!pc);
    await probe("Equipment shop dialog", async () => {
      const app = await api.chargen.shop(pc);
      assert(app, "The shop did not return a rendered dialog.");
      apps.push(app);
      const root = rootOf(app);
      assert(root?.querySelector('[data-shop="kind"]') && root.querySelector('[data-shop-act="buy"]'),
        "The shop's equipment controls did not render.");
      await app.close();
      return "The real shop rendered and closed without a purchase.";
    }, !!pc);
    await probe("Registered status effects", async () => {
      const statuses = CONFIG.statusEffects;
      const expected = CONFIG.TBE?.STATUSES;
      assert(expected?.length, "The system's status catalogue is unavailable.");
      const missing = expected.filter((s) => Array.isArray(statuses) ? !statuses.some((e) => e.id === s.id) : !statuses?.[s.id]);
      assert(!missing.length, "Missing statuses: " + missing.map((s) => s.id).join(", "));
      return (Array.isArray(statuses) ? "Array" : "Keyed object") + "; " + expected.length + " system statuses registered.";
    });
    await probe("Combatant initiative", async () => {
      const combat = await create(Combat, { scene: scene.id, name: "TBE smoke: " + name, active: false });
      const cs = await combat.createEmbeddedDocuments("Combatant", [pc, creature, blank].map((a) => ({ actorId: a.id, name: a.name })));
      assert(cs.length === 3, "Not all temporary combatants were created.");
      const formulas = [];
      for (const c of cs) {
        const roll = c.getInitiativeRoll();
        await roll.evaluate();
        assert(Number.isFinite(roll.total) && !/undefined|NaN|@/.test(roll.formula), "Initiative has an unresolved value: " + roll.formula);
        formulas.push(roll.formula);
      }
      assert(cs[0]._getInitiativeFormula() === CONFIG.Combat.initiative.formula &&
        cs[2]._getInitiativeFormula() === CONFIG.Combat.initiative.formula &&
        cs[1]._getInitiativeFormula() !== cs[2]._getInitiativeFormula(), "Rated/unrated combatants did not use the configured initiative paths.");
      return "Character / rated creature / unrated creature: " + formulas.join("; ") + ".";
    }, !!(scene && pc && creature && blank));
  } catch (err) {
    report.rows.push({ name: "Smoke test", status: "FAIL", detail: message(err) });
  } finally {
    /* Capture a window whose render threw before the opener could return it.
     * Restrict cleanup to windows for this run's tagged actors. */
    for (const app of foundry.applications?.instances?.values?.() ?? []) {
      if (owned(app.actor) && !apps.includes(app)) apps.push(app);
    }
    const problems = [];
    for (const app of apps.reverse()) {
      try { if (rootOf(app)) await app.close(); }
      catch (err) { problems.push("window: " + message(err)); }
    }
    /* A create operation may persist its document and then throw in a hook.
     * Find only our exact run tag, never a name match or another run's docs. */
    const collections = [game.actors, game.scenes, game.tables, game.combats];
    for (const collection of collections) for (const doc of contents(collection)) {
      if (owned(doc) && !docs.some((d) => d.uuid === doc.uuid)) docs.push(doc);
    }
    /* Dependants first, including after a partial setup failure. */
    const order = { Combat: 0, Scene: 1, RollTable: 2, Actor: 3 };
    docs.sort((a, b) => (order[a.documentName] ?? 4) - (order[b.documentName] ?? 4));
    for (const doc of docs) {
      try {
        assert(owned(doc), "Temporary document lost its run tag; remove it manually: " + doc.uuid);
        await doc.delete();
      } catch (err) { problems.push((doc.uuid ?? doc.name) + ": " + message(err)); }
    }
    for (const collection of collections) for (const doc of contents(collection)) {
      if (owned(doc)) problems.push("Still present: " + doc.uuid);
    }
    if (pc) {
      try { await forget(game.user, "creatorDraft", pc.id); }
      catch (err) { problems.push("Temporary draft: " + message(err)); }
    }
    report.rows.push({ name: "Cleanup", status: problems.length ? "FAIL" : "PASS",
      detail: problems.length ? problems.join("; ") : docs.length + " temporary documents removed; windows closed." });
    report.ok = !report.cancelled && report.rows.every((r) => r.status === "PASS");
    running = false;
  }
  return report;
}
