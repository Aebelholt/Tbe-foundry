/* TBE: Solo Panel — the whole game behind one hotbar key, grouped by what you are doing. */
const GROUPS = [
  ["Frame the scene", ["Ask the Weave", "TBE: Subverted Scene", "TBE: Random Event", "TBE: NPC"]],
  /* TBE: Clocks is deliberately not listed: it was retired in v0.28.0 into a
     one-shot migrator (its clocks and TBE: Extended Roll's trackers were the
     same rule in two stores). It still exists so an old world can run it once. */
  ["Act", ["TBE: Skill Roll", "TBE: Opposed Roll", "TBE: Extended Roll", "TBE: Cast", "TBE: Counterspell", "TBE: Chase"]],
  ["Work the Weave", ["TBE: Ritual", "TBE: Summoning", "TBE: Enchant", "TBE: Use Enchanted Item"]],
  ["Serve a god", ["TBE: Miracle", "TBE: Pious Act"]],
  ["Talk it out", ["TBE: Social Encounter", "TBE: Extended Roll"]],
  ["Fight", ["TBE: Attack", "TBE: Quick Combat", "TBE: Loadout", "TBE: Wounds & Recovery", "TBE: Status Effects"]],
  ["The world", ["TBE: Journey Leg", "TBE: Supply", "TBE: Empires List", "TBE: Haggle"]],
  /* TBE: Build Character is deliberately NOT listed. It sat here as an equal
     third choice beside the Wizard while covering only part of Ch.7 -- no
     Ability Scores, Cultural Background, Life Events, Rounding Out, equipment,
     Personality Traits, Goals or Status -- so picking it off this menu was a
     character-breaking mistake a player had no way to see coming. The macro
     still exists in the compendium for anyone who wants the quick path, and it
     now says what it skips before it builds anything. */
  ["Make a character", ["TBE: Character Wizard", "TBE: Finish Character", "TBE: Talents"]],
  ["Keep the record", ["TBE: Status", "TBE: Session Log", "TBE: Advancement"]]
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
