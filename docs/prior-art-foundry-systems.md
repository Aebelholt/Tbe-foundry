# Prior art: other Foundry VTT systems and modules

Researched 2026-09-17, off the back of the first real played session (the
Salt-Run Ambush, see BACKLOG.md's "First real session" sections). A survey of
d100/hit-location/percentile Foundry systems and system-agnostic modules,
looking for combat, skill-roll, social-encounter, journey and solo-play
patterns worth studying. **This is a design/UX and architecture reference,
not a source of code to paste in.** Same discipline as
`prior-art-draw-steel.md`: read for the shape of the solution, re-derive it
against TBE's own rules and DataModels, verify every mechanical number
against `/tmp/tbe.txt` the normal way.

## License reality check — read this before adapting anything below

Three tiers, and they change what "adopting a pattern" is allowed to mean:

- **Permissive, code-adaptable**: WFRP4e (Apache-2.0), Zweihänder community
  system (verify per-repo), Sequencer (MIT), DFreds Convenient Effects (MIT),
  the Draw Steel Negotiation/Montage Test tools (MIT), the TOR2e system
  (MIT). Code from these can be read, adapted and reworked into TBE directly,
  the same way `resolver_check.mjs`'s `{expr|fallback}` idea was prototyped
  from reading Draw Steel.
- **Copyleft (borrow-with-consequences)**: Argon Combat HUD Core and the
  Rolemaster systems (RMSS/RMFRP) are GPL-3.0. Token Action HUD Core is
  CC-BY-4.0 + the Foundry Limited License. Copying code from these into TBE
  would carry real obligations (GPL would push TBE itself toward GPL, CC-BY
  requires attribution and the Foundry-ecosystem restriction). Study the
  *design*, reimplement independently, or depend on the module as an
  optional install rather than porting its code.
- **Restrictive / publisher-controlled — UX reference only, never code**:
  CoC7 (Chaosium: Foundry-platform-only, no commercial use, all rights
  reserved), the official Draw Steel system (MCDM license, not the
  permissive Creator License), and any official TOR2e rules content. **Code
  license is separate from content license everywhere in this list** —
  a permissively-licensed system's compendium data (stat blocks, rules text)
  is still the publisher's IP and is never reusable, only the code patterns
  are.

Verify a license on the actual repo before adapting from it. This document
records what a 2026-09-17 read found; module licensing and maintenance status
both drift.

## Combat (top priority — TBE's highest-interaction area)

### WFRP4e (moo-man/WFRP4e-FoundryVTT) — the primary reference

Apache-2.0. The closest structural twin to TBE: percentile opposed tests
producing Success Levels, per-hit-location armour and wounds, condition
automation. Actively maintained, on the full ApplicationV2/DataModel stack.

**The pattern worth taking**: damage resolution as a chain of scriptable
triggers, `preAPCalc → APCalc → preApplyDamage → applyDamage → preTakeDamage
→ takeDamage`, funneling through one method, `ActorWFRP4e.applyDamage()`.
Armour Points are prepared per-location at data-prep time (`APCalc`) and
*indexed* at the moment of damage (`args.AP`) rather than recomputed inline.
Toughness Bonus, AP penetration and Ward-save reductions all happen inside
that one method, which writes a single `args.totalWoundLoss`.

TBE's six-location wound model (`TBE.LOCATIONS`, the wound table, `_lib.js`'s
wound/armour arithmetic) is currently spread across `tbe-attack.js` and
`tbe-wounds.js`. The WFRP4e shape — prepare-per-location, index-at-damage,
one owning method — is the same lesson as CLAUDE.md's existing ownership
discipline, just applied to the damage pipeline specifically rather than to
a single rule/constant. Worth reading before any future consolidation of
`tbe-attack.js`'s damage application.

**Companion modules, design reference only**:
- `Jagusti/fvtt-wfrp4e-gmtoolkit`'s "Damage Console" applies damage to
  multiple targets at once with optional randomized hit location and
  ignore-AP/TB toggles — a batch analogue of TBE: Wounds & Recovery, useful
  if TBE ever needs to resolve an AoE or a mob fight faster.
- `Foundry-Workshop/token-action-hud-wfrp4e` (MPL-2.0) shows conditions,
  weapon damage and tests surfaced on a token HUD for a hit-location system.

### Zweihänder community system (fh-fvtt/zweihander, Re4XN fork)

Grimdark d100 with hit locations, same architectural generation as TBE — its
changelog documents a full migration to ApplicationV2 for actor sheets, item
sheets, active-effects config and its Fortune Tracker. **Confirm the exact
license on whichever fork is read** before adapting code; the ZWEIHÄNDER
game content itself is Grim & Perilous Studios IP regardless.

**The pattern worth taking**: its "Apply Damage" chat-card flow. Target with
`T`, click Damage, the targeted user(s) and GM each get an Apply Damage
button on the card, a target pill pings the token, and there is an explicit
fix guarding against **double-application** when both a player and the GM
click Apply on the same card. That guard is the specific detail worth
lifting even without the code: any TBE card that lets more than one client
act on it (the attack card, once B1's shield line and any future
Apply-Damage button land) needs the same idempotence — a flag on the message
or a disabled-after-first-click state — or a laggy click doubles a wound.

### CoC7 (Miskatonic-Investigative-Society/CoC7-FoundryVTT) — TBE's mechanical ancestor

**Restrictive license — UX reference only, never code.** The system TBE's
own d100/Success-Level lineage descends from. Worth reading for its
Regular/Hard/Extreme/Critical/Fumble tiered-success card, its blind-roll
GM controls (increase/decrease success, reveal check, force pass/fail
without a level), and its opposed/combined roll flow. Its "melee flow
cards" and the changelog note about splitting a ranged-combat card into
small/normal/big size loops are relevant to TBE's own 11-step Size ladder
and its to-hit thresholds — read the *idea*, then re-derive the number from
`/tmp/tbe.txt` and TBE's own `sizeEffects()`, never copy CoC7's numbers.

### System-agnostic combat QOL modules

- **DFreds Convenient Effects** (MIT) — the reference for a large, toggleable
  status/condition palette applied to tokens, with a macro/developer API
  (`game.dfreds.effectInterface.toggleEffect`). TBE already has a large
  custom status palette (`TBE.STATUSES`, wound impairment per location,
  Shock, Dying, Infected, Septic, the Fatigue family) registered through the
  version-adaptive `CONFIG.statusEffects` code (CLAUDE.md rule 7). This
  module's *registration* pattern is worth comparing against TBE's own — MIT
  means direct code study is fine — but TBE's registration is already
  correct and version-adaptive; this is a comparison, not a known gap.
- **Sequencer** (MIT) — the standard pipeline for hit/wound visual and sound
  feedback (pairs with JB2A assets). Worth depending on as an optional
  module for combat feel, not porting.
- **Argon Combat HUD Core** (theripper93/enhancedcombathud) — **GPL-3.0,
  do not copy code.** A polished, system-agnostic action-economy HUD with
  per-system plugins (including one for RMSS). Good for the *look* of
  attack-to-damage chaining and target-picking; if TBE wants that look,
  reimplement independently or depend on it as an installed module, never
  port its source.
- **Token Action HUD Core** (CC-BY-4.0 + Foundry Limited License) —
  system-agnostic, needs a per-system companion module. A reference for
  surfacing TBE's skills/weapons/maneuvers on a token HUD; attribution
  required if code is adapted, and the Foundry Limited License restricts
  distribution to the Foundry ecosystem.

## Skill rolls (percentile / Rolemaster-flavored)

- **RMSS/RMFRP** (Cynicide/RMSS-FoundryVTT and the fvtt-rolemaster-frp fork)
  — **GPL-3.0, design reference only.** Skills modeled as Items with
  auto-calculated stat bonuses and open-ended d100. Worth comparing against
  TBE's own grouped-skill model (Combat/Adventuring/Social/Lore/Language/
  Wise/Bind, `item-skill.mjs`) and its Expertise-floor mechanic, but not a
  source to copy from.
- **CoC7** (restrictive, as above) remains the best tiered-success card
  reference for the BRP/CoC branch of TBE's DNA: degree-of-success display,
  criticals/fumbles on d100, blind rolls.

## Social encounters

- **`bruceamoser/draw-steel-negotiation-test-tool`** — **MIT, the single
  most directly reusable reference for TBE: Social Encounter / TBE:
  Haggle.** A persistent Negotiation Test Item (so it inherits Foundry's
  own duplication/folders/compendium/permissions for free) tracking
  Interest and Patience (min/max), Motivations and Pitfalls each
  individually revealable to players (hidden until the GM toggles
  Revealed — Interest/Patience are always player-visible), a per-tier
  argument log, and discovery entries on a timeline. Built on
  `HandlebarsApplicationMixin(ItemSheetV2)` — the same AppV2 stack TBE
  uses. MIT means the code itself is a legitimate starting point, not just
  the idea.
- **`bruceamoser/draw-steel-montage-test-tool`** — **MIT**, companion for
  structured group skill-challenges (per-hero round tracking, auto-tallied
  successes/fails against a limit, GM-only outcomes). A candidate pattern
  for TBE's Extended Roll / multi-actor Social Encounter resolution.
- The official Draw Steel system implements Interest/Patience and montage
  tests natively but is under MCDM's license, not the permissive Creator
  License — **design reference only**, prefer Moser's MIT standalone tools
  for anything code-adjacent.

## Journeys and travel

- **TOR2e system** (herve.darritchon/FoundryVTT-TOR2e) — **MIT.** Implements
  Journey Fatigue as a burden that combines with Load to trigger a Weary
  condition, automated parry/protection/load from equipped gear, and
  Hope/Endurance/Stance token-bar sync. The Fatigue-during-travel →
  status-condition loop is a direct structural analogue for wiring TBE's
  Supply dice (gear/ammo/rations/medical degrading toward exhausted) into an
  automatic status rather than a number a GM has to remember to apply.
- Pair with a calendar module (Seasons & Stars or GG Calendar, both AppV2
  and actively maintained as of this read) and a hex-flower weather macro
  if travel/weather automation is ever scoped — general tooling, no license
  concern for TBE's own code since none of it would be ported, only used as
  an installed dependency.

## Solo play

- **Mythic GME Tools** (saif-ellafi/foundryvtt-mythic-gme) — the dominant
  solo/GM-less toolkit: oracles, GM-emulator panels, one-click event macros
  tied to the selected token/actor. Worth benchmarking TBE Solo Tools' Solo
  Panel against its panel UX and its one-click-event-with-token-context
  pattern. References copyrighted oracle products in its own README and
  says it "may not be commercially redistributed" — **design/UX reference
  and potential complementary install, not a code source.**

## What this changes for TBE, concretely

Turned into scoped, license-flagged BACKLOG.md entries rather than left as
prose here — see BACKLOG.md's "Prior art: other Foundry systems" section.
Nothing in this document is itself a task; it is the reading list a future
task cites.
