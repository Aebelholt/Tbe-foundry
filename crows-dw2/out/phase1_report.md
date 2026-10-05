# Phase 1 report (check-in 1)

Code and CSVs: `sim/` (sim.py, tune.py, final.py, threat.py; raw_combat.csv, tuning_grid.csv, final_combat.csv, threat_ticks.csv). 10,000 fights per pairing. Cells below read death rate / raw damage taken (AD included) / table minutes.

## Inputs missing
`crows-dw2/` files were never uploaded: system layer, chassis, source index, hot card, engine, runs_ABC.md, DW2 Final Alpha. The zip holds only the five Crows HTML books. So RAW is my reading of Rules Book, Combat, not your layer's §9, and no engine was used. Phase 2 and the amendment need those files.

## Sourced inputs
- Combat rules: Rules Book, Combat (R18-23 per runs_ABC). Counter on a melee miss, doom gives tier 3 counter, crit gives an extra action, 1 reaction a round, d10 initiative (6+ PCs first).
- Monsters: Ref Book printed blocks (Ape, Bear, Bear Cave, Wolf, Undead A, B, C). Wolf packs 1d6, undead A groups 1d6 (Ref Book encounter tables).
- Crows: Bodyguard background (Characters Book): S2 A1 M0, Stamina 9, light armor, shield, sword, Slashing 1 use. AD 14 incl. sword Parry 4, matching the printed Warrior Sword P4 block.
- Sword card: tier 2 3+S, tier 3 6+S, Parry 4 (Inventory Cards Annotated, p.1).
- Torch card: UD 1 (Useless; DT), Fine 2, Masterwork 3 (Inventory Cards Annotated, p.4). runs_ABC S1 says "UD d4". That does not match the card. I use the card.
- Level crow: 5,000 TXP (Expertise & Stamina and Characteristics Advancement tables): S3, Stamina 17, Slashing 3 uses, medium steel armor + steel shield + sword = AD 25, steel sword. Build choices are mine.

## Flagged assumptions
- No flee or morale. Animals are defeated at 0 Stamina. One fight per rest.
- Lacerate, ranged spines, opportunity attacks, grid positioning not modelled. Wolves always flank each other. Undead C grab and squeeze are modelled.
- Expertise use is greedy: any non-doom result below tier 3 is raised one tier.
- Table time: 1.54 min per turn or exchange, calibrated so S1 RAW median (13 turns) is 20 min (Rules Book, Dungeon Turns, p.13: a fight "might take 20 minutes to play out"). The 20 is sourced, the calibration is mine.
- Run B is flat tier 2 damage both ways. 10+ inflicts tier 3, 6- suffers tier 3. 7-9 costs are narrative and carry no number. Durability is the same as the other variants.
- "Doom on an encounter check" has no meaning in Crows (1d10 vs EN 9, Rules Book, Dungeon Encounters, p.14). I tested natural 10 and any encounter.

## Result 1: combat parity (target: death and damage within 15% of RAW)
Pass counts are out of 8 scenarios per crow, both metrics.

| config | start crow | 5,000 TXP crow |
|---|---|---|
| A0 (runs_ABC Run A) | 3 | 0 |
| A + K2 (= C0, see below) | 5 | 0 |
| A + K2 + K5 | 4 | 0 |
| B | 1 | 0 |

Knobs tested (tuning_grid.csv, all singles and pairs of K1 to K6): K1 foe tier 2 +1, K2 on crow tier 1 ceil(unengaged/3) foes attack at tier 2, K3 same on tier 1 and 2, K5 tier 1 suffers tier 3 minus 1, K6 expertise raises damage dealt only. No pair passes the target for the levelled crow.

C0 note: Run C's tier-1 Ref move, modelled as an unengaged foe attacking, is mechanically K2. In combat Phase 1 cannot separate A+K2 from C. The difference is procedure, which Phase 2 tests.

### Starting crow (death / dmg / min)
| scenario | RAW | A0 | A+K2 (C0) | A+K2+K5 | B |
|---|---|---|---|---|---|
| ape | 0% / 4 / 5 | 0% / 5 / 4 | 0% / 5 / 4 | 0% / 5 / 4 | 0% / 7 / 3 |
| bear | 14% / 16 / 9 | 24% / 20 / 7 | 24% / 20 / 7 | 17% / 19 / 7 | 0% / 21 / 6 |
| wolves 1d6 | 53% / 24 / 17 | 34% / 22 / 13 | 45% / 24 / 11 | 42% / 22 / 11 | 20% / 21 / 10 |
| undead A 1d6 | 33% / 21 / 22 | 23% / 19 / 14 | 34% / 21 / 12 | 28% / 20 / 13 | 1% / 16 / 11 |
| undead C (P6) | 39% / 24 / 14 | 62% / 29 / 9 | 62% / 29 / 9 | 60% / 28 / 9 | 0% / 23 / 8 |
| Bear Cave (P9) | 54% / 30 / 13 | 60% / 33 / 9 | 60% / 33 / 9 | 60% / 31 / 9 | 97% / 37 / 8 |
| S1 chapel | 72% / 32 / 21 | 73% / 33 / 14 | 79% / 33 / 12 | 76% / 33 / 13 | 65% / 33 / 12 |
| S5 swarm 2d6 | 82% / 32 / 32 | 70% / 31 / 21 | 80% / 33 / 15 | 76% / 31 / 16 | 48% / 29 / 19 |

### 5,000 TXP crow
| scenario | RAW | A0 | A+K2 (C0) | A+K2+K5 | B |
|---|---|---|---|---|---|
| ape | 0% / 2 / 3 | 0% / 1 / 2 | 0% / 1 / 2 | 0% / 1 / 2 | 0% / 4 / 2 |
| bear | 0% / 7 / 6 | 0% / 4 / 4 | 0% / 4 / 4 | 0% / 4 / 4 | 0% / 15 / 4 |
| wolves 1d6 | 15% / 23 / 18 | 0% / 8 / 8 | 1% / 9 / 8 | 0% / 8 / 8 | 0% / 15 / 8 |
| undead A 1d6 | 2% / 15 / 19 | 0% / 6 / 8 | 0% / 7 / 8 | 0% / 6 / 8 | 0% / 11 / 8 |
| undead C (P6) | 1% / 12 / 9 | 0% / 7 / 6 | 0% / 7 / 6 | 0% / 7 / 6 | 0% / 16 / 6 |
| Bear Cave (P9) | 1% / 16 / 9 | 0% / 9 / 6 | 0% / 9 / 6 | 0% / 9 / 6 | 0% / 28 / 6 |
| S1 chapel | 2% / 21 / 16 | 1% / 13 / 9 | 1% / 13 / 9 | 1% / 13 / 9 | 0% / 23 / 8 |
| S5 swarm 2d6 | 47% / 39 / 41 | 3% / 19 / 19 | 12% / 23 / 18 | 8% / 21 / 18 | 0% / 21 / 15 |

### What drives the gaps
1. Trade Blows ties damage suffered to the crow's own roll, so offense doubles as defense. A levelled crow (higher stat, more expertise uses, more AD) takes 40 to 60% less damage than under RAW, where foes roll independently of the crow. The knobs only add pressure from unengaged foes and cannot fix this.
2. Expertise improves the single Trade Blows tier, so it also cuts damage suffered. K6 removes that but over-corrects (+30 to +65% on some solo fights).
3. Solo foes are harsher than RAW for the starting crow (bear 24% vs 14%, undead C 62% vs 39%). RAW gives the crow a counter on every foe miss, which Trade Blows lacks.
4. K2 fits starting-crow group fights well (wolves, undead A, S1, S5 within about 10 points).

## Result 2: UD drain
Torch is 1 UD, rolled each DT end, lost on 1-2 (1/3 per DT, Rules Book, Usage Dice, p.13). A fight costs table time:

| start crow, S1 chapel | RAW | A0 | A+K2 (C0) |
|---|---|---|---|
| minutes | 21 | 14 | 12 |
| DT used | 0.70 | 0.47 | 0.40 |
| torch expiry chance | 25% | 17% | 15% |

Run A/C cut fight time by about 30 to 50% (S5: 32 min to 15 to 21), so they drain 30 to 50% less UD per fight. That is a real gain for play pace, with the caveat that the Trade Blows per-exchange minutes are an assumption.

## Result 3: Threat ticks (target: a 4-6 Development Threat completes in 2-5 sessions if ignored)
Ticks: outdoor Miasma rest, village cycle without a Prosperity rise, doom on an encounter check (read as a natural 10). Session model: 6 DT, one Miasma rest, 2 sessions per cycle, Prosperity rise 30% a cycle.

| Developments | median sessions | in 2-5 sessions |
|---|---|---|
| 4 | 2 | 99% |
| 5 | 3 | 100% |
| 6 | 4 | 99% |

Across the 972-point sweep (DTs per session 4/6/10, Miasma rest chance 0.5/1.0, sessions per cycle 1/2/3, rise chance 0.15/0.3/0.5, three caps, two doom readings) the mean pass rate is 0.81. The worst corner is 4 DT sessions, rare Miasma rests, 3-session cycles (31% for D6). A cap of 2 ticks per session raised the floor most. A cap of 1 per session fails for D6 (0%) so do not use it.

## Verdict so far
- Run A0 and Run C0 as written do not match RAW lethality across crow levels. They match the starting crow in group fights (with K2), and run too soft for a levelled crow, with no knob pair that closes it.
- Run B is not a viable fallback on lethality: 0% death for the starting crow vs undead C and bear, 97% vs Bear Cave. Flat damage removes the power scaling.
- Threat ticks work as specified under a cap of 2 per session, with the doom source needing a definition.
- Run C's combat is A+K2, so its case rests on Phase 2 (soft misses, macro drift, context size).

## Decisions I need from you
1. Upload `crows-dw2/` (layer, engine, runs_ABC.md, Final Alpha) so Phase 2 uses your real rules and engine. Phone upload is the blocker; Cowork or a desktop session could drop the folder in the repo.
2. The levelled-crow gap is structural. Options inside scope: (a) accept it and call Trade Blows a low-level tool, with Ref-side scaling by foe Power; (b) a Run C mutation where the crow's tier decides damage dealt and the foe's own engine roll (2d10 + printed attack bonus) decides damage suffered, keeping one engine call per exchange. Option (b) is a change to Run A's core, so I will not test it without your OK.
3. Define "doom on an encounter check": natural 10, or any encounter?

---

# Addendum (after crows-dw2.zip, your decisions 1 to 3)

## Rerun of RAW against the layer's §9
- RAW is **unchanged**. Same seeds give identical results on all 16 pairings. The layer's weapon table (index, PT1 cards) matches what I used: sword 3+S / 6+S, Parry 4. Counter on a melee miss at tier 2, tier 3 on a doom, crit gives an extra action, one reaction a round, d10 side initiative: all match.
- **What did change:**
  - **DT clock.** The layer's default is 1d6 rooms per DT, and a fight that clears ends the DT (layer §7). So a fight costs about one DT in every variant, and the Phase 1 UD saving (30 to 50% for Run A/C) only holds under the real-time timer variant. Under the default, UD drain per fight is the same for RAW, A, B and C.
  - **Torch.** The layer's SAVE example shows `torch 2UD`. The card says UD 1, Fine 2 (Inventory Cards Annotated p.4). I kept 1.
  - **Social.** Layer §1 and R6 say Crows has no social characteristic. Run C's Pull Strings and Sense Motive therefore use Mind, not CHA as runs_ABC wrote. Flagged.
  - **Doom on the encounter check.** Replaced by a natural 10 (R14), as you said.

## Forms (a) and (b), engine-rolled foe, no initiative, unengaged-foe knob kept
(a) every exchange: the crow's tier sets damage dealt, the engaged foe's engine roll (2d10 + printed bonus) sets damage suffered. Crow tier 1 triggers the Ref move: ceil(unengaged/3) unengaged foes attack, each with its own roll.
(b) as (a), but the foe rolls only on crow tier 1 or 2. Tier 3 suffers nothing.
Cells: death / raw damage taken. Pass = within 15% of RAW on both (death: 2 points absolute when RAW is under 5%).

| config | start crow: pairings passing (of 8) | 5,000 TXP crow |
|---|---|---|
| (a) + K2 | 2 | 0 |
| (a) + K2 + K1 (foe tier 2 +1) | **4** | 1 |
| (b) + K2 | 1 | 0 |
| (b) + K2 + K1 | 4 | 0 |

Parity table, start crow, RAW vs (a)+K2+K1: ape 0%/4 vs 0%/7, bear 14%/16 vs 16%/22, wolves 53%/24 vs 49%/26, undead A 33%/21 vs 36%/22, undead C 39%/24 vs 66%/31, Bear Cave 54%/30 vs 83%/33, S1 72%/32 vs 82%/34, S5 82%/32 vs 82%/33. Full tables in `sim/forms_combat.csv`.

Levelled crow, RAW vs (a)+K2: bear 0%/7 vs 0%/11, wolves 15%/23 vs 1%/14, undead A 2%/15 vs 0%/10, undead C 1%/12 vs 1%/17, S1 2%/21 vs 0%/19, S5 swarm 47%/39 vs 8%/25.

Findings:
1. Making the foe roll independently fixes the expertise-as-defense leak, but the levelled crow still diverges in both directions: **solo foes too hard (+40 to +60% damage), groups too soft (swarm 8% vs 47% death)**. Cause: RAW lets every foe attack every round with its own initiative; one engaged foe per exchange cannot match a swarm.
2. (b) is 20 to 40% softer than RAW and has no case against (a).
3. Exploratory, not adopted: a simultaneous volley (every foe rolls each exchange, no order) plus a counter when a foe misses fits the starting crow closely (damage within 14% of RAW in all 8 pairings, death within 15% on 5) and gets the levelled crow to +12 to +43% harsher (`sim/volley_combat.csv`). It keeps the "no initiative, no turn order" constraint but lets all foes act each exchange. It is beyond the two forms you approved, so I am asking before using it.
4. Counters on a foe miss (KC) did not help the two approved forms.

## Threat ticks, final settings
Natural 10 on the encounter check, cap 2 per session. Central case (6 DT a session, one Miasma rest, 2 sessions a cycle, 30% Prosperity rise): D4 median 3 sessions, D5 3, D6 4; 100%, 100%, 99.5% finish in 2 to 5 sessions. Across the 54-point sweep per D: mean pass 97% (D4), 93% (D5), 85% (D6). Floor is 79%, 55%, 31%, always in the corner of 4-DT sessions, rare Miasma rests and 3-session cycles (`sim/threat_ticks.csv`). The target holds for the intended pace. Slow tables (few DTs per session) need the cap lifted to 3 or an extra tick source.
