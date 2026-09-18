/* TBE: Solo Panel — the whole game behind one hotbar key, grouped by what you are doing. */
const GROUPS = [
  ["Frame the scene", ["Ask the Weave", "TBE: Subverted Scene", "TBE: Random Event", "TBE: NPC"]],
  ["Act", ["TBE: Skill Roll", "TBE: Opposed Roll", "TBE: Clocks", "TBE: Cast"]],
  ["Talk it out", ["TBE: Social Encounter", "TBE: Extended Roll"]],
  ["Fight", ["TBE: Attack", "TBE: Quick Combat", "TBE: Wounds & Recovery", "TBE: Status Effects"]],
  ["The world", ["TBE: Journey Leg", "TBE: Supply", "TBE: Empires List"]],
  ["Keep the record", ["TBE: Status", "TBE: Session Log", "TBE: Build Character", "TBE: Talents", "TBE: Advancement"]]
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
  const m = game.macros.getName(data.tool);
  if (m) m.execute();
  else ui.notifications?.warn("TBE: macro '" + data.tool + "' not found. Re-run the installer.");
}
