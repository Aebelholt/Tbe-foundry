/* A small stand-in for the parts of Foundry the character creation window
 * touches (creator_check.mjs section 7). NOT a Foundry mock: ApplicationV2's
 * render/close lifecycle as the window uses it (DEFAULT_OPTIONS, _renderHTML,
 * _replaceHTML, _onRender), DialogV2.confirm/wait, Roll, ChatMessage, the
 * user's flags, settings, and one owned actor that records what is written. */
(function () {
  window.LOG = [];
  window.NOTES = [];
  let seed = 5;
  const rnd = (n) => { seed = (seed * 9301 + 49297) % 233280; return Math.floor((seed / 233280) * n) + 1; };
  class ApplicationV2 {
    constructor(options = {}) {
      this.options = Object.assign({}, this.constructor.DEFAULT_OPTIONS, options);
      this.id = options.id;
    }
    get title() { return this.options.window?.title || ""; }
    get element() { return this._el || null; }
    async render() {
      if (!this._el) {
        const el = document.createElement("div");
        el.className = "application " + (this.options.classes || []).join(" ");
        el.style.cssText = "width:" + this.options.position.width + "px;height:" + this.options.position.height + "px;display:flex;flex-direction:column";
        const h = document.createElement("header"); h.textContent = this.title;
        const c = document.createElement("section"); c.className = "window-content"; c.style.cssText = "flex:1;min-height:0";
        el.append(h, c);
        document.body.append(el);
        this._el = el;
        window.foundry.applications.instances.set(this.id, this);
      }
      const html = await this._renderHTML({}, {});
      this._replaceHTML(html, this._el.querySelector(".window-content"), {});
      this._onRender({}, {});
      return this;
    }
    bringToFront() {}
    async close() { this._el?.remove(); this._el = null; window.foundry.applications.instances.delete(this.id); return this; }
  }
  window.foundry = {
    applications: {
      instances: new Map(),
      api: {
        ApplicationV2,
        DialogV2: {
          confirm: async () => { window.LOG.push(["dialog", "confirm"]); return true; },
          wait: async ({ buttons }) => { window.LOG.push(["dialog", "wait"]); return buttons[0].action; }
        }
      }
    }
  };
  window.USER = { id: "U1", isGM: true, flags: {}, getFlag(s, k) { return this.flags[k]; }, async setFlag(s, k, v) { this.flags[k] = v; } };
  const settings = { customConcepts: { roles: [], streaks: [], troubles: [] }, rollMode: "publicroll" };
  window.game = {
    user: window.USER, users: [window.USER],
    settings: { get: (ns, k) => settings[k], set: async (ns, k, v) => { settings[k] = v; } },
    packs: { get: () => null }
  };
  window.ui = { notifications: { info: (m) => window.NOTES.push(m), warn: (m) => window.NOTES.push(m), error: (m) => window.NOTES.push("ERR " + m) } };
  window.CONFIG = { sounds: { dice: "dice.wav" } };
  window.Roll = class {
    constructor(f) { this.formula = f; }
    async evaluate() {
      const m = String(this.formula).match(/^(\d+)d(\d+)(?:\*(\d+))?(?:\+(\d+))?$/);
      let t = 0;
      for (let i = 0; i < +m[1]; i++) t += rnd(+m[2]);
      if (m[3]) t *= +m[3];
      if (m[4]) t += +m[4];
      this.total = t;
      return this;
    }
  };
  window.ChatMessage = {
    getSpeaker: () => ({ alias: "Test" }),
    applyRollMode: (data, mode) => { data.whisper = []; return data; },
    getWhisperRecipients: () => [],
    create: async (data) => { window.LOG.push(["chat", data.content.length]); return data; }
  };
  window.ACTOR = {
    id: "A1", name: "Test Hero", type: "character", isOwner: true, system: { status: 0 },
    items: [{ id: "old1", type: "skill" }],
    testUserPermission: () => true,
    deleteEmbeddedDocuments: async (t, ids) => { window.LOG.push(["delete", ids.length]); },
    createEmbeddedDocuments: async (t, arr) => { window.LOG.push(["create", arr.length]); return arr; },
    update: async (u) => { window.LOG.push(["update", u]); },
    sheet: null
  };
})();
