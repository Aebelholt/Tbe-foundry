/* The character creation window (v0.52.0, chargen rebuild option B, stage 2).
 *
 * One window: the book's twelve steps down the left, the step in the middle,
 * the character as it stands on the right. The middle and the right are
 * both drawn from derive(draft), and Create writes derive(draft), so the
 * three cannot disagree (the defect class that retired TBE: Character
 * Wizard's two calculations).
 *
 * ApplicationV2 (V12+), used through the smallest surface that has been
 * stable since V12: DEFAULT_OPTIONS, _renderHTML returning a string,
 * _replaceHTML, _onRender. The class is built when first opened, so this
 * module can be imported where ApplicationV2 does not exist (the Node
 * checks) without throwing.
 *
 * The draft is saved on the user after every change through the memory
 * owner (helpers/memory.mjs), kind "creatorDraft", keyed by actor. Closing
 * the window, a reload or a crash loses nothing; Create discards it.
 */
import { derive } from "./derive.mjs";
import * as R from "./rules.mjs";
import { STEPS, defaultDraft, stepStatus } from "./draft.mjs";
import { renderStep, goalSentence } from "./steps.mjs";
import { renderSheet } from "./sheet.mjs";
import { act, setBound, setPath, pathOf } from "./actions.mjs";
import { buildPayload, writeCharacter } from "./commit.mjs";
import * as memory from "../helpers/memory.mjs";
import * as permission from "../rules/permission.mjs";
import * as visibility from "../rules/visibility.mjs";
import { deltaSummary, linkToken } from "../helpers/token-link.mjs";
import { settingsOf } from "../helpers/table-defaults.mjs";
import * as portraits from "../helpers/portraits.mjs";

export const DRAFT_KIND = "creatorDraft";
const SCOPE = "the-broken-empires";

let TABLES = null;
export async function tables() {
  if (!TABLES) {
    const mod = await import("./tables.mjs");
    TABLES = Object.assign({}, mod.TABLES, { skillGroups: R.SKILL_GROUPS });
  }
  return TABLES;
}

/** The lib derive() is given: the system's own copies of the rules. */
export const LIB = {
  SKILL_GROUPS: R.SKILL_GROUPS, CHARGEN_SKILL_CAP: R.CHARGEN_SKILL_CAP,
  applyAbilityScore: R.applyAbilityScore, raiseExpertise: R.raiseExpertise, talentNamed: R.talentNamed
};
export function deriveWith(T, d) {
  return derive(d, { data: T.chargen, magic: T.magic, talents: T.talents, lib: LIB });
}

/** Concept columns with the world's own rows appended and renumbered. */
export function conceptColumns(T, custom) {
  const c = custom || {};
  const col = (base, extra) => (base || []).concat(extra || []).map((r, i) => Object.assign({}, r, { d10: i + 1 }));
  return { role: col(T.concepts.roles, c.roles), streak: col(T.concepts.streaks, c.streaks), trouble: col(T.concepts.troubles, c.troubles) };
}

/** A saved draft from before this window (TBE: Character Wizard) or this one,
 *  merged over a fresh one so a field added later is never undefined. */
export function upgradeDraft(T, saved) {
  const d = Object.assign(defaultDraft(T), JSON.parse(JSON.stringify(saved || {})));
  d.v = 2;
  return d;
}

let Klass = null;
function buildClass() {
  const Base = foundry.applications.api.ApplicationV2;
  return class TBECharacterCreator extends Base {
    static DEFAULT_OPTIONS = {
      classes: ["tbe-creator"],
      tag: "div",
      window: { title: "Create Character", icon: "fas fa-user-plus", resizable: true },
      position: { width: 1120, height: 780 }
    };

    constructor(actor, T, draft, ui, options = {}) {
      super(Object.assign({ id: "tbe-creator-" + actor.id }, options));
      this.actor = actor;
      this.T = T;
      this.d = draft;
      this.ui = ui || {};
      this.ui.step = this.ui.step || "concept";
      this._pristine = JSON.stringify(defaultDraft(T));
    }

    get title() { return "Create Character: " + this.actor.name; }

    env() {
      const T = this.T, d = this.d;
      const ch = deriveWith(T, d);
      const st = stepStatus(T, d, ch);
      let custom = null;
      try { custom = game.settings.get(SCOPE, "customConcepts"); } catch (e) { custom = null; }
      return {
        d, T, ch, st, ui: this.ui, isGM: !!game.user?.isGM, actorName: this.actor.name,
        concepts: conceptColumns(T, custom), customConcepts: custom, portraits: this.portraits || []
      };
    }

    _rail(env) {
      const cur = this.ui.step;
      return STEPS.map((s) => {
        const state = s.key === cur ? "cur" : env.st[s.key].done && this.d.stepSeen?.[s.key] ? "done" : this.d.stepSeen?.[s.key] ? "open" : "";
        const n = (env.st[s.key].open || []).length;
        return '<button type="button" class="tbe-cc-rail-step ' + state + '" data-action="goto" data-step="' + s.key + '">' +
          '<span class="n">' + (s.n || "&#10003;") + "</span><span>" + s.label + "</span>" +
          (n && this.d.stepSeen?.[s.key] && s.key !== "review" ? '<span class="left">' + n + "</span>" : "") + "</button>";
      }).join("");
    }

    async _renderHTML() {
      const env = this.env();
      this._env = env;
      const cur = this.ui.step;
      this.d.stepSeen = Object.assign({}, this.d.stepSeen, { [cur]: true });
      const rail = this._rail(env);
      const i = STEPS.findIndex((s) => s.key === cur);
      const nav = '<div class="tbe-cc-nav">' +
        '<button type="button" data-action="back"' + (i <= 0 ? " disabled" : "") + '><i class="fas fa-arrow-left"></i> Back</button>' +
        '<button type="button" data-action="restart" class="tbe-cc-link">Start over</button>' +
        (i < STEPS.length - 1 ? '<button type="button" data-action="next">Next <i class="fas fa-arrow-right"></i></button>' : "<span></span>") + "</div>";
      return '<div class="tbe-cc-layout"><nav class="tbe-cc-rail">' + rail + '</nav><section class="tbe-cc-main"><div class="tbe-cc-body">' +
        renderStep(cur, env) + "</div>" + nav + '</section><aside class="tbe-cc-sheet">' + renderSheet(env.ch, env) + "</aside></div>";
    }

    _replaceHTML(result, content) {
      const body = content.querySelector?.(".tbe-cc-body");
      const top = body ? body.scrollTop : 0;
      const sheet = content.querySelector?.(".tbe-cc-sheet");
      const sheetTop = sheet ? sheet.scrollTop : 0;
      const focus = this._focusKey();
      content.innerHTML = result;
      const nb = content.querySelector(".tbe-cc-body");
      if (nb && !this._stepChanged) nb.scrollTop = top;
      const ns = content.querySelector(".tbe-cc-sheet");
      if (ns) ns.scrollTop = sheetTop;
      this._stepChanged = false;
      if (focus) this._refocus(content, focus);
    }

    _focusKey() {
      const a = document.activeElement;
      if (!a || !this.element?.contains(a)) return null;
      return { bind: a.dataset?.bind, key: a.dataset?.key, sub: a.dataset?.sub, ui: a.dataset?.ui, pos: a.selectionStart ?? null };
    }
    _refocus(root, f) {
      const sel = f.ui ? '[data-ui="' + CSS.escape(f.ui) + '"]'
        : f.bind ? '[data-bind="' + CSS.escape(f.bind) + '"]' + (f.key ? '[data-key="' + CSS.escape(f.key) + '"]' : "") + (f.sub ? '[data-sub="' + CSS.escape(f.sub) + '"]' : "") : null;
      const el = sel ? root.querySelector("input" + sel + ", select" + sel) : null;
      if (!el) return;
      el.focus();
      try { if (f.pos !== null && el.setSelectionRange) el.setSelectionRange(f.pos, f.pos); } catch (e) { /* number inputs refuse */ }
    }

    _onRender() {
      if (this._wired) return;
      this._wired = true;
      const root = this.element;
      root.addEventListener("click", (ev) => this._onClick(ev));
      root.addEventListener("change", (ev) => this._onChange(ev));
      root.addEventListener("input", (ev) => this._onInput(ev));
    }

    /* A text or number field being typed in: write it, save, and refresh the
       numbers around it without rebuilding the page (which would steal the
       caret, and eat the click that ends the edit). */
    _onInput(ev) {
      const el = ev.target;
      if (!(el instanceof HTMLInputElement) || !["text", "number"].includes(el.type)) return;
      if (el.dataset.ui) { setPath(this.ui, el.dataset.ui.split("."), el.value); this._refreshLive(); return; }
      if (!el.dataset.bind) return;
      setBound(this.d, this.T, this._read(el));
      this._save();
      this._refreshLive();
    }

    _onChange(ev) {
      const el = ev.target;
      if (el.dataset.ui) { setPath(this.ui, el.dataset.ui.split("."), el.value); if (el.tagName === "SELECT") this.render(); return; }
      if (!el.dataset.bind) return;
      setBound(this.d, this.T, this._read(el));
      this._save();
      /* Text boxes already wrote on input; rebuilding now would swallow the
         click that moved focus away. Selects, boxes and radios rebuild. */
      if (el.tagName === "INPUT" && ["text", "number"].includes(el.type)) { this._refreshLive(); return; }
      this.render();
    }

    _read(el) {
      return { bind: el.dataset.bind, key: el.dataset.key, sub: el.dataset.sub, source: el.dataset.source,
        type: el.dataset.type || (el.type === "checkbox" ? "bool" : undefined), value: el.value, checked: el.checked };
    }

    async _onClick(ev) {
      const el = ev.target.closest?.("[data-action]");
      if (!el || !this.element.contains(el) || el.disabled) return;
      ev.preventDefault();
      const a = el.dataset.action;
      const i = STEPS.findIndex((s) => s.key === this.ui.step);
      if (a === "next" || a === "back") { this.ui.step = STEPS[Math.max(0, Math.min(STEPS.length - 1, i + (a === "next" ? 1 : -1)))].key; this._stepChanged = true; this._save(); return this.render(); }
      if (a === "goto") { this.ui.step = el.dataset.step; this._stepChanged = true; this._save(); return this.render(); }
      if (a === "restart") return this._restart();
      if (a === "create") return this._create(el);
      if (a === "pick-portrait") return this._pickPortrait();
      const env = Object.assign(this.env(), {
        roll: async (f) => { const r = await new Roll(f).evaluate(); return { total: r.total, roll: r }; },
        say: (title, body, rolls) => say(title, body, rolls),
        random: (n) => Math.floor(Math.random() * Math.max(1, n)) + 1,
        notify: (m) => ui.notifications?.info("TBE: " + m),
        settings: { get: (k) => game.settings.get(SCOPE, k), set: (k, v) => game.settings.set(SCOPE, k, v) }
      });
      try {
        await act(a, Object.assign({}, el.dataset), env);
      } catch (err) {
        console.error("TBE | character creation action failed", a, err);
        ui.notifications?.error("TBE: that did not work (" + (err?.message || err) + "). Your draft is safe.");
      }
      this._save();
      this.render();
    }

    /* Refresh the rail counts, the sheet and every data-live number on the page. */
    _refreshLive() {
      const env = this.env();
      this._env = env;
      const root = this.element;
      const sheet = root.querySelector(".tbe-cc-sheet");
      if (sheet) { const top = sheet.scrollTop; sheet.innerHTML = renderSheet(env.ch, env); sheet.scrollTop = top; }
      const tmp = document.createElement("div");
      tmp.innerHTML = renderStep(this.ui.step, env);
      root.querySelectorAll(".tbe-cc-body [data-live]").forEach((node) => {
        const fresh = tmp.querySelector('[data-live="' + CSS.escape(node.dataset.live) + '"]');
        if (fresh) { node.className = fresh.className; node.innerHTML = fresh.innerHTML; }
      });
      const goal = root.querySelector('[data-live="goal-sentence"]');
      if (goal) goal.textContent = goalSentence(this.ui.goal || {});
      const open = root.querySelector(".tbe-cc-body .tbe-cc-open");
      const fOpen = tmp.querySelector(".tbe-cc-open");
      if (open && fOpen) open.innerHTML = fOpen.innerHTML;
      const rail = root.querySelector(".tbe-cc-rail");
      if (rail) rail.innerHTML = this._rail(env);
    }

    _save() {
      clearTimeout(this._saveT);
      if (this._created) return;
      this._saveT = setTimeout(() => {
        const pristine = JSON.stringify(Object.assign({}, this.d, { stepSeen: {} })) === JSON.stringify(Object.assign(JSON.parse(this._pristine), { stepSeen: {} }));
        memory.remember(game.user, DRAFT_KIND, this.actor.id, pristine ? null : { draft: this.d, stepKey: this.ui.step, savedAt: Date.now() })
          .catch((err) => console.warn("TBE | draft save failed", err));
      }, 250);
    }

    async _restart() {
      const ok = await confirmDialog("Start over", "<p>Discard this draft for <b>" + escHtml(this.actor.name) + "</b> and start from step 1?</p>");
      if (!ok) return;
      this.d = defaultDraft(this.T);
      this.ui = { step: "concept" };
      this._stepChanged = true;
      await memory.remember(game.user, DRAFT_KIND, this.actor.id, null);
      this.render();
    }

    _pickPortrait() {
      const FP = foundry.applications?.apps?.FilePicker?.implementation ?? globalThis.FilePicker;
      if (!FP) return;
      new FP({ type: "image", current: this.d.portrait || "", callback: (path) => { this.d.portrait = path; this._save(); this.render(); } }).render(true);
    }

    async _create(btn) {
      const env = this.env();
      const open = STEPS.filter((s) => s.key !== "review").flatMap((s) => env.st[s.key].open.map((x) => s.label + ": " + x));
      if (open.length) {
        const ok = await confirmDialog("Create with choices still open?",
          "<p>" + open.length + " choice(s) are still open. They will be listed in the Notes tab as still to decide.</p><ul>" +
          open.slice(0, 12).map((x) => "<li>" + escHtml(x) + "</li>").join("") + (open.length > 12 ? "<li>&hellip;</li>" : "") + "</ul>");
        if (!ok) return;
      }
      btn.disabled = true;
      /* A save still pending from the last keystroke would land after the
         draft is discarded below and bring it back. */
      clearTimeout(this._saveT);
      let dagger = null;
      try {
        const pack = game.packs.get(SCOPE + ".tbe-equipment");
        const doc = pack ? (await pack.getDocuments({ name: "Dagger" }))[0] : null;
        if (doc) dagger = doc.toObject();
      } catch (err) { console.warn("TBE | dagger lookup failed", err); }
      const S = settingsOf((ns, k) => game.settings.get(ns, k));
      const payload = buildPayload(env.ch, this.d, this.T, { actor: this.actor, open, dagger, link: S.linkCharacters, vision: S.characterVision });
      let res;
      try {
        res = await writeCharacter(this.actor, payload, { canWrite: (a) => permission.canWrite(a, game.user), wipe: !!this.d.wipe });
      } catch (err) {
        console.error("TBE | character creation failed", err);
        ui.notifications?.error("TBE: creating the character failed (" + (err?.message || err) + "). Your draft is kept.");
        btn.disabled = false;
        return;
      }
      if (!res.ok) { ui.notifications?.warn("TBE: " + res.notice); btn.disabled = false; return; }
      this._created = true;
      clearTimeout(this._saveT);
      await memory.remember(game.user, DRAFT_KIND, this.actor.id, null);
      await say("Character Created", payload.summary, []);
      const synced = await syncTokens(this.actor, payload, S);
      if (synced.failed.length) ui.notifications?.warn("TBE: the character was created, but " + synced.failed.length + " token(s) could not be updated (" + synced.failed.join("; ") + "). Ask your GM to run TBE: Link Character Tokens.");
      await this.close();
      this.actor.sheet?.render(true);
    }

    async close(options) {
      if (!this._created) {
        clearTimeout(this._saveT);
        const pristine = JSON.stringify(Object.assign({}, this.d, { stepSeen: {} })) === JSON.stringify(Object.assign(JSON.parse(this._pristine), { stepSeen: {} }));
        try { await memory.remember(game.user, DRAFT_KIND, this.actor.id, pristine ? null : { draft: this.d, stepKey: this.ui.step, savedAt: Date.now() }); }
        catch (err) { console.warn("TBE | draft save failed", err); }
      }
      return super.close(options);
    }
  };
}

const escHtml = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Placed tokens of the actor just created: linked (per setting), renamed, and
 * given the portrait. A token that holds its own build is left alone and
 * reported, since linking it would hide that build.
 */
export function tokenPlan(actorId, scenes, payload, s) {
  const plan = [], skipped = [];
  const name = payload.update.name, img = payload.update["prototypeToken.texture.src"];
  for (const scene of scenes || []) {
    for (const t of scene.tokens || []) {
      if (t.actorId !== actorId) continue;
      if (!t.actorLink && deltaSummary(t).hasBuild) { skipped.push({ scene, token: t }); continue; }
      const u = { _id: t.id };
      if (s.linkCharacters && !t.actorLink) u.actorLink = true;
      if (name) u.name = name;
      if (img) u["texture.src"] = img;
      if (Object.keys(u).length > 1) plan.push({ scene, update: u });
    }
  }
  return { plan, skipped };
}
async function syncTokens(actor, payload, s) {
  const { plan, skipped } = tokenPlan(actor.id, game.scenes?.contents ?? [], payload, s);
  const failed = skipped.map((x) => x.token.name + " on " + x.scene.name + " holds its own copy");
  for (const { scene, update } of plan) {
    try { await scene.updateEmbeddedDocuments("Token", [update]); }
    catch (err) { failed.push(scene.name + ": " + (err?.message || err)); }
  }
  return { failed };
}

/** Chat, through the visibility owner like every other card. */
export async function say(title, body, rolls) {
  const content = '<div class="tbe-card" style="border:1px solid #7a6a4f;border-radius:6px;padding:6px 8px;background:rgba(120,100,60,0.08)">' +
    '<div style="font-weight:bold;letter-spacing:.5px;border-bottom:1px solid #7a6a4f;margin-bottom:4px">' + title + "</div>" + body + "</div>";
  const data = { speaker: ChatMessage.getSpeaker(), content, rolls: rolls || [], sound: (rolls || []).length ? CONFIG.sounds?.dice : null };
  visibility.prepare(data, { settingsGet: (ns, key) => game.settings.get(ns, key), ChatMessageClass: ChatMessage, selfId: game.user?.id });
  return ChatMessage.create(data);
}

async function confirmDialog(title, content) {
  const DV2 = foundry.applications?.api?.DialogV2;
  if (DV2?.confirm) return !!(await DV2.confirm({ window: { title }, content, rejectClose: false }));
  return !!(await Dialog.confirm({ title, content }));
}

async function chooseDialog(title, content, buttons) {
  const DV2 = foundry.applications?.api?.DialogV2;
  if (DV2?.wait) {
    return DV2.wait({ window: { title }, content, rejectClose: false,
      buttons: buttons.map((b, i) => ({ action: b.value, label: b.label, default: i === 0 })) });
  }
  return new Promise((resolve) => new Dialog({ title, content, close: () => resolve(null),
    buttons: Object.fromEntries(buttons.map((b) => [b.value, { label: b.label, callback: () => resolve(b.value) }])), default: buttons[0].value }).render(true));
}

/**
 * Open the window for an actor. A saved draft is offered back; a draft left
 * in TBE: Character Wizard can be carried over.
 */
/**
 * Which actor Create Character works on. Always the actor in the SIDEBAR:
 * opened from an unlinked token, Foundry hands over the token's private copy,
 * and a character built into that copy looks reverted the moment the token is
 * linked (the playtest GM's v0.53.1 report). Pure, so a check can run it.
 */
export function resolveTarget(actor, baseOf) {
  if (!actor) return { target: null, token: null, stranded: null };
  if (actor.isToken) {
    const token = actor.token ?? null;
    const base = baseOf(actor.id) ?? null;
    const linked = !!token?.actorLink;
    const summary = token && !linked ? deltaSummary(token) : null;
    return { target: base, token, stranded: summary && summary.hasBuild ? summary : null };
  }
  return { target: actor, token: null, stranded: null };
}

/** Create a Character actor for this user, when they may. */
async function newCharacterActor() {
  if (!game.user?.can?.("ACTOR_CREATE")) {
    ui.notifications?.warn("TBE: select your token or assign a character to your user first. Your GM can create a Character actor for you, or allow players to create actors.");
    return null;
  }
  const DV2 = foundry.applications?.api?.DialogV2;
  let name = null;
  if (DV2?.prompt) {
    name = await DV2.prompt({ window: { title: "Create Character" }, rejectClose: false,
      content: '<p>No character is selected. Make a new one?</p><label>Name <input type="text" name="name" value="New Character" autofocus></label>',
      ok: { label: "Create the actor", callback: (ev, button) => button.form.elements.name.value.trim() || "New Character" } });
  }
  if (!name) return null;
  const data = { name, type: "character" };
  if (!game.user.isGM) data.ownership = { default: 0, [game.user.id]: 3 };
  const actor = await Actor.create(data);
  if (actor && !game.user.isGM && !game.user.character) {
    try { await game.user.update({ character: actor.id }); } catch (err) { console.warn("TBE | could not assign the new character", err); }
  }
  return actor;
}

export async function openCreator(actor) {
  if (!actor) actor = await newCharacterActor();
  if (!actor) return null;
  const R0 = resolveTarget(actor, (id) => game.actors?.get(id));
  if (R0.stranded) {
    const pick = await chooseDialog("Create Character",
      "<p>This token is not linked to <b>" + escHtml(R0.target?.name || actor.name) + "</b> in the sidebar, and it carries its own copy of the character (" +
      R0.stranded.items + " item(s)). That usually means a character was built with this token selected.</p>" +
      "<p><b>Keep the token's build</b> makes that copy the sidebar actor and links the token, so nothing is lost. " +
      "<b>Build on the sidebar actor</b> starts a new character there instead.</p>",
      [{ value: "rescue", label: "Keep the token's build" }, { value: "build", label: "Build on the sidebar actor" }]);
    if (!pick) return null;
    if (pick === "rescue") {
      if (!game.user.isGM && !permission.canWrite(R0.target, game.user)) {
        ui.notifications?.warn("TBE: you do not own " + (R0.target?.name || "that actor") + " in the sidebar. Ask your GM to run TBE: Link Character Tokens.");
        return null;
      }
      try {
        await linkToken({ token: R0.token, actor: R0.target }, "token");
        ui.notifications?.info("TBE: " + R0.target.name + " is linked and keeps the build that was on the token.");
        R0.target.sheet?.render(true);
      } catch (err) {
        console.error("TBE | rescue failed", err);
        ui.notifications?.error("TBE: linking failed (" + (err?.message || err) + "). Nothing was deleted; the token still holds its copy.");
      }
      return null;
    }
  }
  actor = R0.target;
  if (!actor) { ui.notifications?.warn("TBE: this token's actor is not in the sidebar any more, so there is nothing to build onto."); return null; }
  if (actor.type !== "character") {
    ui.notifications?.warn("TBE: " + actor.name + " is a " + actor.type + ". Create Character builds player characters: create a Character actor (or pick one) and open it from there.");
    return null;
  }
  if (!permission.canWrite(actor, game.user)) {
    ui.notifications?.warn("TBE: you do not have permission to change " + actor.name + ". Ask your GM for ownership, or to create the character with you.");
    return null;
  }
  const existing = foundry.applications.instances?.get?.("tbe-creator-" + actor.id);
  if (existing) { existing.bringToFront?.(); return existing; }
  const T = await tables();
  if (!Klass) Klass = buildClass();
  const saved = memory.recall(game.user, DRAFT_KIND, actor.id);
  const old = saved ? null : memory.recall(game.user, "wizardDraft", actor.id);
  let draft = defaultDraft(T), ui0 = { step: "concept" };
  if (saved?.draft) {
    const when = saved.savedAt ? new Date(saved.savedAt).toLocaleString() : "earlier";
    const step = (STEPS.find((s) => s.key === saved.stepKey) || STEPS[0]).label;
    const pick = await chooseDialog("Create Character", "<p>You have an unfinished character for <b>" + escHtml(actor.name) + "</b>, saved " + escHtml(when) + ", on <b>" + escHtml(step) + "</b>.</p>",
      [{ value: "resume", label: "Resume it" }, { value: "fresh", label: "Start over" }]);
    if (!pick) return null;
    if (pick === "resume") { draft = upgradeDraft(T, saved.draft); ui0.step = STEPS.some((s) => s.key === saved.stepKey) ? saved.stepKey : "concept"; }
    else await memory.remember(game.user, DRAFT_KIND, actor.id, null);
  } else if (old?.draft) {
    const pick = await chooseDialog("Create Character", "<p>There is an unfinished character for <b>" + escHtml(actor.name) + "</b> in the old Character Wizard. Carry its choices over?</p>",
      [{ value: "carry", label: "Carry them over" }, { value: "fresh", label: "Start fresh" }]);
    if (!pick) return null;
    if (pick === "carry") draft = upgradeDraft(T, old.draft);
  }
  const app = new Klass(actor, T, draft, ui0);
  try { app.portraits = await portraits.roster(); } catch (err) { console.warn("TBE | portrait roster unavailable", err); app.portraits = []; }
  app.render(true);
  return app;
}
