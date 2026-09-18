# Prior art: Draw Steel (Codex + the Foundry system)

Read 2026-09-14 against TBE v0.30.0. Two separate codebases, both worth reading,
both MIT-licensed for the **code**. The Draw Steel game content is MCDM IP under
its own licence and is not reusable — the architecture is, the abilities are not.

- `MetaMorphic-Digital/draw-steel` — the official Foundry VTT system. Directly
  comparable to this project: same platform, same problems, ~1000 commits ahead.
  Code MIT (MetaMorphic Digital), rules under MCDM licence.
- `VerisimLLC/draw-steel-codex` — the Codex app itself, Lua, built on the DMHub
  engine. MIT (davewx7).
- `VerisimLLC/draw-steel-data` — all Codex content as YAML, one asset per file,
  plus `GoblinScript_Guide.md`.

## GoblinScript, briefly

A pure functional expression language embedded in DMHub. No statements, no
loops, no side effects, no mutable variables: every formula is one expression
evaluating to a number, boolean, string or object reference. Evaluated in a
context with a subject (`Self` is implicit, so `Stamina` means `Self.Stamina`)
plus context symbols (`Caster`, `Target`, `Cast`, `Ability`). Lookup is case-
and space-insensitive.

Notable operators: `value when condition else fallback` (conditional as an
expression), `expr where x = sub-expr` (let-binding by substitution), `is`/`has`
for text and set containment, and `or` returning the larger of two numbers.

**Do not build this for TBE.** It is the right answer to a problem this project
does not have — a commercial VTT automating a tactical combat game across
thousands of authored abilities. TBE is a solo/GM system that deliberately
leaves adjudication to a human. Building an expression language here would be
the largest scope creep available. What is worth taking is one small piece of
it, below.

## Worth taking

### 1. `{expression|fallback}` inline substitution — the best idea here

In any text field, `{expr}` is replaced by its evaluated result, and
`{expr|fallback text}` prints the fallback when the expression cannot evaluate.
The book text and the computed value are **the same string**:

```
The target can shift {Reason|a number of squares equal to your Reason score}.
```

With an actor in context it reads "can shift 3". In a compendium with no actor
it reads the prose. Real examples from the shipped data:
`{Average + (1 when Cast.Spaces Moved > 0)}`,
`{Caster.Might + (2 when Caster.Level >= 3)}`, `{Movement Speed - Moved This Turn}`.

**Why this matters here.** Nearly every defect this project has shipped is the
same shape: a card describing one thing while the code did another. Career
points reported as spent while being discarded. A size note listing "Drive Back,
Trip and Disarm" after Lock had been added to the blocked list. Status naming a
roll it did not offer. Each was two representations of one fact, drifting.

A minimal version needs no language at all — a resolver over `TBE.card()` that
substitutes `{actor.system.x}`-style paths and a whitelist of already-existing
`TBE.*` helpers, with the prose fallback when there is no actor. Perhaps 30
lines. It would make a card that quotes a number and a card that computes one
literally the same string, which is the only way they cannot disagree.

### 2. Packs stored as source, database generated

`src/packs/<pack>/<Name>_<id>.json` — one file per document, compiled into
LevelDB at build time by `tools/pullJSONtoLDB.mjs`, with `pushLDBtoJSON.mjs`
going back the other way for round-tripping edits made in Foundry.

This is the clean answer to the release-hygiene problem the audits raised twice.
This project already generates packs from `_docs.json` rather than editing a
live database, which is most of the benefit; the part still missing is one file
per document, which makes pack content diffable in git. Worth adopting if pack
content ever needs reviewing by eye.

### 3. A published roll-data contract

`src/docs/Roll-Data.md` lists every `@reference` a roll formula can use —
`@characteristics.might.value` with the shorthand `@M`, `@chr` for the highest
characteristic, `@potency.weak`, `@stamina.winded`, and so on — as documentation
a content author reads.

The initiative bug fixed in v0.29.0 existed because this project's equivalent
contract was implicit: `base-actor.mjs`'s `getRollData()` defined it, a subclass
overrode it without `super`, and nothing anywhere stated what the contract was
supposed to contain. `audit_check.mjs` now asserts the formula's references
resolve, which catches a regression. A written list would have prevented the
original.

### 4. Abilities as structured data, display text derived from it

Every ability is data: keywords, trigger, distance, target, and per-tier effects
with typed entries (`damage`, `applied effect`, `forced movement`, `other`).
Values reference actor-derived state (`"potency": {"value": "@potency.weak"}`)
rather than hardcoding numbers. Their own docs say of a damage effect: *"The text
of the effect is automatically determined from these values."*

Same principle as (1), applied to the content layer rather than the card layer.
Not a refactor to start now, but it is the shape the rules would move toward if
this project ever consolidates rule ownership out of the macro pack.

### 5. Documented automation limits, as a habit

The Draw Steel docs are direct about what is not automated: *"This application
is not fully automated; the owners of those actors must use the 'Apply Effect'
button"*, and for forced movement *"There is currently no automation for this
feature."* Four abilities in the shipped data carry an inline
`{Implementation Status: ... is not supported by Codex}` marker (a habit rather
than a system, at four instances).

This is convergent with the standing bar already written in BACKLOG.md — "the
module must never look like it did something it didn't" — and with the Unbalance
instinct: put the number where the human making the decision will see it, and
let them apply it. Two independent teams reached the same conclusion. Worth
knowing that the instinct is not a compromise forced by a small project.

## Worth knowing, not copying

GoblinScript's guide documents its own footgun with unusual honesty: identifiers
containing spaces collide with reserved operator words (`has`, `is`, `not`,
`and`, `or`, `when`, `where`, `else`), and when they do, *"the formula still
compiles and silently computes the wrong thing"* — `Has Cover > 0` parses `has`
as the containment operator and never resolves the attribute. Their mitigation
is a convention (write identifiers without spaces) plus documentation.

That is precisely the failure class this project keeps finding in itself: it
runs, it reports success, it is wrong. Their answer is a naming rule; this
project's answer is executable tests and mutation guards. The tests are the
stronger of the two, and that is worth remembering the next time the test suite
feels like overhead.

Also noted, without judgement: the Foundry system states it uses no AI anywhere
in its implementation; the Codex repo ships `CLAUDE.md` and `AGENTS.md` and its
GoblinScript guide opens "designed for AI consumption". Two teams on the same
game, opposite positions.

## Addendum: do Codex's riders-as-status-effects transplant to TBE's Maneuver Riders?

Follow-up question after the first read: TBE already paints its five Combat
Maneuver riders (`TBE.RIDERS` in `macros/_lib.js`: Unbalanced, Prone,
Disarmed, Locked, Disadvantaged) as token status icons, but its own code
comment states the reason nothing auto-applies them -- "there is no cross-roll
modifier engine, and building one touches every macro that rolls." Checked
that claim concretely against both Draw Steel codebases rather than taking it
on faith, the same way `parse_talents.py`'s rank logic got checked against
`/tmp/tbe.txt` instead of a plausible-sounding guess.

**Thesis: no, not as a structural adoption. What each side actually built
solves a different problem than the one TBE has.**

What's really running under Draw Steel's "automated conditions" (Active-
Effects.md's Dazed/Frightened/Grabbed/Restrained/Slowed/Taunted/Weakened
list) is not a generic engine at all -- it's two `if` statements inside one
function, `src/module/rolls/power.mjs`:

```js
if (options.actor.statuses.has("weakened")) options.modifiers.banes += 1;
if (options.actor.statuses.has("restrained") && (options.type === "test")
    && ["might", "agility"].includes(options.characteristic)) options.modifiers.banes += 1;
```

That's the whole trick: every power roll in their system already funnels
through one function that receives the actor, the target and the roll type,
so a status check is one line. `TBE.resolve(r, skill, expertise)` is not that
function -- it takes an already-rolled number and an already-computed skill
value, on purpose (it's what makes it callable from a plain Node script in
`simtest.js` with no Foundry actor object at all). No TBE macro's roll dialog
passes an actor or a target into skill resolution; the human reads
`TBE.riderNote()`'s printed text and types the number into the Modifier
field themselves. Hooking a status check in the Draw Steel style needs a
chokepoint TBE does not have, and building one means touching every macro
that calls `TBE.resolve` -- the exact cost the existing comment named.

Codex's own `CharacterModifier.RegisterType(...)` (`Draw Steel Modifiers/
Modifier*.lua`) is a different thing again, not the mechanism that runs the
DS Foundry system's conditions above: it's a pluggable, GM-authored trait
framework with its own in-app editor UI (`createEditor` builds dropdowns,
`Refresh()` re-renders the panel) so a GM can build homebrew forced-movement
rules, invisibility, light sources, casting-origin overrides, and so on,
each type registered once and then attached to creatures. It's Codex's
answer to "how does a commercial app let a GM extend the ruleset without
touching Lua," a content-authoring problem TBE, a fixed rule set edited by
its own maintainer, doesn't have.

**Evidence against transplanting it, from the riders themselves, not just
the architecture:** of TBE's five, only Unbalanced carries a flat number at
all (-20), and the book gives it an explicit exception (not an Endurance
roll to resist Shock) and a non-stacking rule -- the exact shape the
existing code comment already calls "exactly the kind of judgement a person
should make and an auto-applier would get wrong." The other four -- Prone,
Disarmed, Locked, Disadvantaged -- aren't power-roll bane/edge modifiers in
the first place; they gate actions and options (no weapon in hand, no
Fighting Withdrawal, "GM's call" for Disadvantaged) rather than adding a
bane to a roll. Draw Steel's automated conditions are automatable because
the game was written that way: flat, universal, exception-free bane/edge
grants to one specific roll type. TBE's riders read like p.163's prose
because that's what they are -- procedural conditions from a ruleset that
was not designed around a bane/edge primitive at all. The mismatch is in the
source material, not only in which codebase has an engine.

**Counterpoint, steelmanned:** if TBE ever DOES want one automatable rider,
Unbalanced is the only real candidate (it's the only one with a number), and
the Draw Steel pattern for it would be cheap in isolation -- one `if
(TBE.hasStatus(actor, "tbe-unbalanced")) mod -= 20` inside whatever function
ends up owning roll resolution, PROVIDED it also excludes Endurance-to-
resist-Shock rolls and clears the status after one use rather than leaving it
persistent. That carve-out and expiry logic is real work, not a one-liner,
and it's still one rider, not a reason to generalize. Not worth doing now;
worth remembering if Unbalance-related mistakes start showing up at the
table the way the initiative bug did.

**Conclusion: this confirms the existing decision rather than overturning
it.** No action taken beyond writing this down -- the current design (paint
the icon, print the number and its conditions beside the Modifier field,
let the human apply it) is what both DS's own design AND TBE's architecture
point to once actually checked, not merely a smaller project's compromise.
