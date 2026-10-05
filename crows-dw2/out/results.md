# Crows x DW2 results (Phases 1 to 3; amendment not started)

Detail: `phase1_report.md` (including its addendum), `sim/`, `transcripts/` (one folder per trial with transcript, Ledger and engine state, audit_auto.json and audit_sheet.md), `variants/` (the four rulebooks the Refs saw). Failed first attempts of the S4/S5 trials (rate limit) are in `transcripts/_failed_partial/`.

## Scorecard

Phase 1 (10,000 fights per pairing; start crow and 5,000 TXP crow; within 15% of RAW on death rate and damage taken). Pairings passing, of 8:

| variant | start crow | 5,000 TXP crow | note |
|---|---|---|---|
| RAW | reference | reference | |
| A: Trade Blows, form (a), unengaged-foe knob, foe tier 2 +1 | 4 | 1 | solo foes too hard for a levelled crow, groups too soft |
| B: DW2 chassis, flat damage | 1 | 0 | start crow near immune to bear and undead C, 97% death to Bear Cave |
| C: combat is A's; social, move card and Threats are non-combat | 4 | 1 | same combat numbers as A |
| (b) variant of A/C | 4 | 0 | softer than RAW |

Phase 2 (20 Ref trials, one per variant and scenario, mid-level crow, scripted Player, Ledger and engine tools). Auditor counts summed over S1 to S5:

| failure mode | RAW | A | B | C |
|---|---|---|---|---|
| Foes forgotten or out of turn | 0 | 4 | 0 | **9** |
| Stat drift | 0 | 1 | 13* | 3 |
| Invented numbers | 1 | 8** | 0 | 0 |
| Soft misses | 0 | 0 | 1 | 1 |
| Macro drift | 0 | 0 | 2 | 3 |
| Hot-card contract slips | 0 | 4 | 18*** | 1 |
| Rule lookups mid-scene | 1 | 3 | 3 | 0 |
| State block, mean tokens at scene end | 211 | 217 | 211 | 217 |
| Ref words written (all 5 scenes) | 5,061 | 6,442 | 5,748 | 6,943 |
| Replies needed (all 5 scenes) | 24 | 39 | 35 | 40 |

\* B_S5: the Ref used the wrong Ledger command on turn 2 and the Auditor then read 7/4 damage as drift for 13 turns. Mostly a harness artifact.
\** The A Auditor counted world-flavor numbers ("twelve years", "a dozen steps"). Every `invented_candidates` list from the mechanical check was empty. The RAW, B and C Auditors did not count flavor numbers, so this column is not comparable.
\*** Hand-composed mechanics lines in B S1 (4) and S5 (13). Same cause as the first note.

Named Ref moves on tier 1 (C only): 16 in S5, 4 in S4. C's one soft miss was a Miasma RR with a concrete result but no `Move:` name.

Threat ticks (S3, all variants): each trial advanced the right portent or Development and none had macro drift in S3. The macro counts above come from S4 and S5 (DT end not logged or not run).

## Key numbers
- RAW needed 24 replies for the five scenes, the hybrids 35 to 40, because a RAW reply resolves a whole round and an A/B/C reply resolves one exchange.
- C's forgotten foes are concentrated in S5 (7) and S4 (2). The Auditor traced S5 to the unengaged-foe rule: the Ref attacked with the engaged foe or with a second foe when none was unengaged, and rolled an extra attack on a crow tier 2.
- State blocks are small everywhere (about 130 to 310 tokens). There is no context-bloat difference at this scale.

## Verdict
In these trials, RAW Crows was the cleanest referee, and the DW2 hybrids did not reduce lost turns, drift or invented numbers; they added a new error class. The unengaged-foe rule (ceil(unengaged ÷ 3) foes attack on a crow tier 1) is the weak point: it needs the Ref to keep an engaged/unengaged partition and a count each exchange, and in the swarm it produced 7 of C's 9 forgotten-foe counts. RAW's side-initiative round, which the engine's `init` hands to the Ref, gave a simple order that held across a six-undead swarm. The parts of Run C that are not combat held up: S2 had no Auditor findings for any variant (the scripted Player never needed Pull Strings or Sense Motive to be rolled, so those two moves were not exercised), the tier 1 move card was used 20 times with a named move each time (one tier 1 Miasma roll in S3 missed the name), and the Threat ticks fired correctly in S3 with no macro drift for any variant. On the numbers, C's combat does not hold RAW's lethality for a levelled crow (Phase 1) and it costs more replies and more text per fight (Phase 2), so the combat swap is not supported by this evidence. The non-combat layers (social moves, move card, Threats) are the part worth keeping, on top of RAW combat.

## Limits of this evidence
- One trial per variant and scenario. Counts of 0 to 3 are within noise.
- One Ref agent played both roles of the transcript (Ref, plus running the Ledger and Player scripts), with the Player as a script. Real play has a human or a separate agent.
- The mid-level crow ends fights fast (RAW S1 took 3 replies), so RAW's tracking load was light. The starting crow, which dies 72% of the time in S1, would stretch RAW longer.
- Tool access was generous: the engine, a Ledger that owns crow state, the scene's blocks in a file. The failure modes you describe may need weaker tooling or longer sessions to appear.
- Auditors were three different instances with different strictness on "invented numbers".
- RAW trials had no digitized chapel map, so the Ref tracked grid positions in prose. It did so without errors here.
- First attempts of S4 and S5 hit the session rate limit and were rerun from scratch; RAW_S1 was rerun with a longer Player script.

## Open questions for you
1. **Phase 3 scope.** The listed variants (A, B, C) all score worse than RAW in Phase 2. The best candidate is outside runs_ABC.md: RAW combat with Run C's non-combat layers (social moves, tier 1 move card, Threats with ticks). Do you want me to mutate that, or mutate C inside its current form?
2. **If C, what mutation?** The smallest fix is to replace the unengaged-foe rule with a rule the Ref cannot get wrong, for example "on a crow tier 1 the Ref names which foe attacks, and writes it as a scene line". It is one change and I can rerun S4 and S5.
3. **Longer or harder trials?** To test lost turns properly I would run the starting crow (high lethality), longer scenes, and a Ref context that has already carried a long chat. Say if you want that before Phase 3.
4. **Pull Strings stat.** The layer has no social characteristic. I used Mind. Confirm, or say if you want a different rule.
5. **Volley variant.** Phase 1 found that a volley with a counter matches RAW lethality for the starting crow. It re-adds simultaneous foe attacks, so it is risky for the same reason as the unengaged-foe rule. Not adopted.


---

# Phase 3 (mutations and the D variant)

Scope kept inside the original brief: I mutated Run C in its current form (C1) and, following your go-ahead on my recommendations, tested one variant outside `runs_ABC.md` (D: RAW combat plus Run C's social moves, move card and Threats). Two repetitions per cell where the budget allowed. Transcripts: `transcripts/C1_*`, `C_*_r2`, `C_S2b_r1`, `D_*`. Audit rules are the same as in Phase 2.

## What changed
- **C1 (one change to C).** On a crow tier 1 exactly one named unengaged foe attacks (was ceil(unengaged/3)). Phase 1: parity unchanged (start crow still passes 4 of 8 pairings; `sim/m1_combat.csv`).
- **D.** RAW combat and side initiative stay. Added: the tier 1 move card for tier 1 results that are not a weapon-attack miss (a weapon miss keeps its counter), Pull Strings and Sense Motive (Mind), and DW2 Threats with ticks (outdoor Miasma rest, cycle without a Prosperity rise, natural 10 on an encounter check, cap 2 per session).

## Counts (Auditor, same strictness as Phase 2; S4 and S5 unless stated)

| variant | trials | forgotten | drift | macro | slips |
|---|---|---|---|---|---|
| C (original run + second repetition) | 4 | 10 (S5 first run 7, second 0) | 3 | 4 | 6 |
| C1 | 4 | 6 | 0 | 0 | 8 |
| RAW (Phase 2) | 2 | 0 | 0 | 0 | 0 |
| D | S4 x2, S5, S1, S2b, S3 (6 trials) | 3 | 4 | 3 | 4 |

D by trial: S2b 0/0/0/0 and S3 0/0/1/0 and S4 r1 0/0/0/0 (first audit), then S1 0/1/1/2, S4 r2 0/1/1/0, S5 0/2/0/2 (forgotten/drift/macro/slips). The first three looked clean. The second batch did not.

## What the repetitions show
1. **Run to run noise is as large as the effect.** C's S5 had 7 forgotten foes in one run and 0 in a repeat on identical rules. A single 0 or 7 says little.
2. **C1 improved on C in total (6 vs 10 forgotten, 0 vs 3 drift, 0 vs 4 macro) but not on slips (8 vs 6), and the effect is within noise.** C1's remaining errors are not about the unengaged-foe rule: a dead foe still rolled, and foe attacks narrated with no engine line. A rule edit does not fix those.
3. **D is not clean.** Its errors are RAW-type errors: a foe killed before its initiative turn still listed, a missing enemy side in a round, a mislabeled CRIT, a Threat tick written to the sealed ledger but not shown in the fiction. D_S5's Ref also edited its own transcript afterwards to fix a mislabeled Ledger line, so that sheet is less reliable.
4. **The social moves work.** Pull Strings and Sense Motive rolled via the Ledger and applied per the printed menus, in both C and D (S2b). Only tier 2 occurred, so tier 3 (two questions) and tier 1 (named Move) remain untested.
5. **The tier 1 move card works.** Named moves appeared at every card-eligible tier 1 in S4 (D: `Take something away`, `Have it backfire`; C and C1: 4 to 7 per trial).
6. **The tick cap works.** D_S3: two ticks fired (natural 10, Miasma rest), the cycle-end tick was correctly held back by the cap of 2.

## Ranking (Phase 1 and 2 and 3 combined)
1. **D**: keeps RAW's combat (no Phase 1 problem, since it is RAW), adds the layers that tested well. Error counts are within noise of RAW.
2. **RAW**: cleanest counts, n=5 and 2 reps for S4 and S5 only for variants that ran them; no social, card or Threat layer.
3. **C1**, then **C**, **A**: hybrid combat costs 40 to 60% more replies per fight (Phase 2), still diverges from RAW lethality for a levelled crow (Phase 1), and its extra error class (the unengaged-foe rule) is only partly fixed by C1.
4. **B**: fails lethality (Phase 1).

I stopped Phase 3 after round 1 on C and one round on D. The rule is to stop when a mutation shows no clear improvement, and none of the mutations did against the noise floor. Further mutations of the hybrid combat would be measuring noise.

## Recommendation for the amendment (not drafted)
- **Keep §9 combat as written** (grid, side initiative, counters). Do not replace it. This departs from your brief, which expected §9 combat to be replaced. The evidence does not support the swap.
- **Replace §5's Stonetop fronts with DW2 Threats and the three ticks, cap 2 per session** (Phase 1: 4 to 6 Development Threats complete in 2 to 5 sessions in the central case).
- **Add Pull Strings and Sense Motive** as Mind tests the Ref calls only when the Ref wants the dice to decide.
- **Add the tier 1 move card** for tier 1 results that are not a weapon-attack miss.
- **Add a precedence rule:** a Crows condition (blessed, grabbed, prone, vulnerable, wounds) always wins over a DW2-style consequence; a card move may never remove a printed Crows rule, only add a concrete change on top.
- **Small harness-found fixes worth including:** write each Threat tick into the fiction as well as the sealed ledger, and strike a dead foe from the scene line before any foe turn.

## Open questions
1. **Replace the §9 combat or keep it?** My recommendation is keep. Say if you want the amendment to carry A/C-style combat anyway (as an optional appendix).
2. **Draft the amendment now** on the D scope above?
3. **Dungeon Crows repo.** Copy `crows-dw2/` in? Which branch?
4. **Untested:** tier 3 and tier 1 of Pull Strings and Sense Motive; the starting crow; longer sessions. Worth a final round after the amendment?
