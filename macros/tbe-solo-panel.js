/* TBE: Solo Panel — the whole game behind one hotbar key, grouped by what you are doing. */
const GROUPS = [
  ["Frame the scene", ["Ask the Weave", "TBE: Subverted Scene", "TBE: Random Event", "TBE: Oracle Tables", "TBE: NPC"]],
  /* TBE: Clocks is deliberately not listed: it was retired in v0.28.0 into a
     one-shot migrator (its clocks and TBE: Extended Roll's trackers were the
     same rule in two stores). It still exists so an old world can run it once. */
  ["Act", ["TBE: Skill Roll", "TBE: Opposed Roll", "TBE: Extended Roll", "TBE: Cast", "TBE: Counterspell", "TBE: Chase"]],
  ["Work the Weave", ["TBE: Ritual", "TBE: Summoning", "TBE: Enchant", "TBE: Use Enchanted Item"]],
  ["Serve a god", ["TBE: Miracle", "TBE: Pious Act"]],
  ["Talk it out", ["TBE: Social Encounter", "TBE: Extended Roll"]],
  ["Fight", ["TBE: Attack", "TBE: Quick Combat", "TBE: Loadout", "TBE: Wounds & Recovery", "TBE: Status Effects"]],
  ["The world", ["TBE: Journey Leg", "TBE: Supply", "TBE: Empires List", "TBE: Haggle"]],
  /* Character creation is one window since v0.53.0 (TBE: Create Character,
     also on the sheet's header). The Character Wizard, Finish Character and
     Build Character were retired into it. */
  ["Make a character", ["TBE: Create Character", "TBE: Talents", "TBE: Link Character Tokens"]],
  ["Keep the record", ["TBE: Status", "TBE: Session Log", "TBE: Advancement"]],
  /* GM setup: oracle tables from the GM's own file (v0.55.0). */
  ["Set up the table", ["TBE: Import Oracle Tables"]]
];

const opts = GROUPS.map(([label, tools]) =>
  '<optgroup label="' + label + '">' +
  tools.map((n) => '<option value="' + n + '">' + n.replace(/^TBE: /, "") + "</option>").join("") +
  "</optgroup>"
).join("");

const data = await TBE.prompt(
  "TBE Solo",
  '<div style="font-size:13px">' +
  '<label style="display:block">Tool: <select name="tool" size="14" style="width:100%">' + opts + "</select></label>" +
  '<div style="font-size:11px;opacity:.75;margin-top:4px">Select your token first. For an attack, also target the foe with T.</div>' +
  "</div>",
  "Open"
);

if (data && data.tool) {
  const ok = await TBE.runMacro(data.tool);
  if (!ok) ui.notifications?.warn("TBE: macro '" + data.tool + "' not found. Re-run the installer.");
}
