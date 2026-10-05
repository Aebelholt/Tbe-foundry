# Crows x DW2: variants A, B, C (design brief)

Goal: an LLM-refereed solo Crows game. Fix the LLM failure modes (lost turns,
stat drift, invented numbers, soft misses, macro drift, context bloat) while
keeping Crows' lethality, village and resource loop. Engine owns all Ref-side numbers.

## Tier bridge
Crows test 2d10 + characteristic: <=11 / 12-16 / 17+ (tiers 1/2/3).
DW2 move 2d6: 6- / 7-9 / 10+. One-to-one, so DW2 moves can be rewritten
as Crows tests without changing the dice.

## Run A: Crows chassis, DW2 combat
- Grid combat (R18-23) replaced by one move.
- Trade Blows (Crows): engage a foe, roll 2d10 + A or S.
  17+: deal tier 3 dmg, suffer nothing.
  12-16: deal tier 2 dmg, suffer the foe's tier 2.
  <=11: suffer the foe's tier 3; Ref makes a move.
- Ranges: DW2 tags (hand, close, near, far) replace squares; one band of
  movement is free per exchange.
- No initiative, no enemy turns. Unengaged foes act only as Ref moves,
  max one per exchange.
- Known risk: lethality uncalibrated; counters and ranged-into-melee lose teeth.

## Run B: DW2 chassis, Crows world
- DW2 moves, HP, conditions and GM moves run everything.
- Imported from Crows: village (Prosperity, institutions, cycle events),
  DTs with UD, encounter checks, Miasma, Greed Bonus, travel roles.
- Monsters: Stamina -> HP; tier 2/3 damage -> flat damage, no damage rolls.
- DW2 item uses (OOO) -> Crows Usage Dice, rolled at DT end.
- Solo: Relationships/Depth attach to village NPCs; Comfort or Support with villagers.
- Known risk: thins Crows identity; heavy rewrite of the system layer.

## Run C: Crows numbers, DW2 procedure (layered)
- Combat: Run A's Trade Blows.
- Social: Pull Strings and Sense Motive rewritten as Crows tests with
  their tier 2 menus.
- Misses: on any tier 1, the Ref picks a named move from DW2's card
  (make it worse, skip to the action, pay a cost, present a decision).
- Macro: DW2 Threats replace the Stonetop fronts import (system layer §5),
  sized 2-3 / 4-6 / 7-10 Developments.
  Ticks: outdoor rest in the Miasma; village cycle with no Prosperity rise;
  natural 10 on a dungeon encounter check (immediate encounter, R14).
- Solo: Depth with village NPCs, feeding village events.
- Known risk: most design work; needs a precedence rule where Crows
  conditions and DW2 consequences overlap.

## Errata to the original analysis
- "Torch on UD d4" in the S1 example was invented. Printed card: UD 1.
- "Doom on an encounter check" was a mistake: dooms (natural 2-3) only
  exist on 2d10 tests (R7). Intended trigger: natural 10 on the
  encounter check (immediate encounter).
