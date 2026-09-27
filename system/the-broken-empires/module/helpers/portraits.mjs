/* The portrait roster (v0.54.0): roll a portrait from the GM's own image
 * folders, for Create Character, TBE: NPC and TBE: Funnel.
 *
 * A roll aid in the sense CLAUDE.md allows: the GM points it at folders of
 * images they already own, a roll picks one, and the player can always pick
 * by hand instead. Each subfolder becomes a "collection" you can roll within
 * (Humans, Dwarves, Bandits...). Nothing mechanical is written, only an image.
 *
 * Folders come from the world setting "portraitFolders", several separated by
 * ";". Browsing goes through whichever FilePicker this Foundry has: V13 moved
 * it to foundry.applications.apps.FilePicker.implementation, V12 has the
 * global. Branch on what exists, not on a version (CLAUDE.md rule 7).
 */
export const SCOPE = "the-broken-empires";
export const IMAGE = /\.(png|jpe?g|webp|gif|avif|svg)$/i;

export function folderList(setting) {
  return String(setting || "").split(/[;\n]/).map((x) => x.trim()).filter(Boolean);
}

/** Walk folders (and their subfolders, two levels) with an injected browse. */
export async function listPortraits(folders, browse, depth = 2) {
  const out = [];
  const seen = new Set();
  const walk = async (dir, collection, level) => {
    if (seen.has(dir)) return;
    seen.add(dir);
    let res;
    try { res = await browse(dir); } catch (e) { return; }
    for (const f of res?.files || []) if (IMAGE.test(f)) out.push({ path: f, collection });
    if (level < depth) {
      for (const d of res?.dirs || []) {
        const name = decodeURIComponent(String(d).replace(/\/+$/, "").split("/").pop());
        await walk(d, level === 0 ? name : collection, level + 1);
      }
    }
  };
  for (const f of folders) await walk(f, "", 0);
  return out;
}

export const collections = (list) => [...new Set(list.map((p) => p.collection).filter(Boolean))].sort();

export function pick(list, collection, random) {
  const pool = collection ? list.filter((p) => p.collection === collection) : list;
  if (!pool.length) return null;
  return pool[Math.max(0, Math.min(pool.length - 1, random(pool.length) - 1))].path;
}

/* ---- Foundry glue ---------------------------------------------------------- */

let cache = null;
export function browser() {
  const FP = foundry.applications?.apps?.FilePicker?.implementation ?? globalThis.FilePicker;
  if (!FP?.browse) return null;
  return (dir) => FP.browse("data", dir);
}
export async function roster(force) {
  const setting = game.settings.get(SCOPE, "portraitFolders");
  if (!force && cache && cache.setting === setting) return cache.list;
  const b = browser();
  const list = b ? await listPortraits(folderList(setting), b) : [];
  cache = { setting, list };
  return list;
}
export async function randomPortrait(collection) {
  return pick(await roster(), collection, (n) => Math.floor(Math.random() * n) + 1);
}
export function registerSetting() {
  game.settings.register(SCOPE, "portraitFolders", {
    name: "TBE.Settings.PortraitFolders.Name", hint: "TBE.Settings.PortraitFolders.Hint",
    scope: "world", config: true, type: String, filePicker: "folder", default: "",
    onChange: () => { cache = null; }
  });
}
