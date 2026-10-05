**Combat** [IMPORTED from DW2: no turn order, no initiative, no action economy (Final Alpha p.12); bands from DW2 range tags (Final Alpha p.13). Replaces R18–23 grid combat in this variant]
- **No grid, no squares, no rounds, no initiative, no enemy turns.** Combat is a run of **exchanges**. In each exchange the crow engages one foe, and nobody else takes a turn.
- **Bands:** hand, close, near, far. A foe is **engaged** when it is in hand or close band of the crow. Moving one band is free in an exchange. Moving further costs an exchange with no roll.
- **Trade Blows** (the only combat move). When the crow engages a foe:
  1. The crow rolls 2d10 + A or S (the Ledger's `attack`). Edges, banes, expertise and crit/doom work as in §1. The tier sets **damage dealt**: tier 1 none, tier 2 the weapon's tier 2 damage, tier 3 its tier 3 damage.
  2. The Ref then rolls the engaged foe's attack with the engine: `test <attack bonus from the block>` (add `--e 1` for a printed edge such as Pack Hunter or a grabbed crow). The foe's tier sets **damage suffered**: tier 1 none, tier 2 the foe's 12–16 damage **+1**, tier 3 its 17+ damage. The Ref calls `take` on the Ledger.
  3. A crow crit grants one extra exchange. A crow doom is tier 1.
- **When the crow gets tier 1**, the Ref makes a move. The move always includes this: `ceil(unengaged live foes ÷ 3)` unengaged foes (at least 1 if any) each attack the crow, one engine `test` each, damage as in step 2. If no foe is unengaged, the Ref makes any move it likes.
- **Printed foe features** (Pack Hunter, Lacerate, Grabber, Squeeze, Dangerous When Cornered, counters) apply as written on the block.
- **Counters and opportunity attacks do not exist in this variant.**
- **Ending the fight:** foes flee or surrender per §4. A crow at 0 Stamina and 0 AD takes wounds as in §8.
- **The Ref tracks every foe on one scene line:** `name Stamina x/y [engaged|unengaged] band`. It updates that line after each exchange.
