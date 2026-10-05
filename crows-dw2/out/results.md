# Crows x DW2 results (Phase 1 and 2; Phase 3 and the amendment not started)

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
