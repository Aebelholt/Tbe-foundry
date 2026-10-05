# CROWS SYSTEM LAYER v1: AMENDMENT 1 (Threats, social moves, Ref move card, precedence)

Applies to `01_system_layer.md`. Load it after the layer and before `02_source_index.md`. Where this file and the layer disagree, **this file wins** for the clauses it names.

**What it changes.** §5's imported fronts become DW2 Threats with ticks. New §9b (social moves), §9c (Ref move card) and §9d (precedence). Small edits to §13, §15 and the hot card.

**What it does not change.** **§9 combat stays exactly as printed** (grid, side initiative, turns, counters, reactions; R18–23). The trials did not support swapping it (results.md, Phase 2 and 3). One house clause (§9a) tidies the Ref's bookkeeping.

**Flags.**
- `[IMPORTED from DW2, <doc> p.X]` marks every borrowed rule. Docs: **MR** = DW2 Move Reference v2, **CGR** = DW2 Campaign & GM Reference v2, **FA** = DW2 Final Alpha (Feb 1 2026), PDF page = printed page.
- `[HOUSE]` marks a rule I wrote to make the import run in Crows. `[UNSOURCED]` marks a default with no printed source.
- Crows page refs follow the layer: R, C, F, D.

---

## A · §5 replacement: Escalating threat

**Replace** the paragraph headed "Imported layer: fronts with portents [IMPORTED from Stonetop, flagged; never printed procedure]" **with the following.** The "Printed pressure, used as written" list above it stays.

**Imported layer: Threats with ticks [IMPORTED from DW2, CGR p.2; FA p.55–56]**

A **Threat** is a way the world might get worse unless the crow stops it (FA p.55). 1–3 are live at once. Each lives in `03_director_sealed.md` with:
1. **Name.** What it is.
2. **Description.** One sentence.
3. **Goal.** How it changes the world for the worse.
4. **Assets.** Advantages it has before it is introduced: places, NPCs, objects, secrets. The crow may learn of them and act to remove them. [IMPORTED, CGR p.2]
5. **Developments.** Ordered steps toward the Goal. When enough are complete, the Goal is reached. [IMPORTED, CGR p.2]
6. **Reactions.** What the Threat does when the crow impedes it. [IMPORTED, CGR p.2]
7. Optional: **Scenes** and **Secrets**. [IMPORTED, CGR p.2]

**Size by Developments** [IMPORTED, CGR p.2]:
- Local Threat, a one-session problem: 2–3.
- Regional Threat, straightforward steps: **4–6**.
- World Threat, complex machinations: 7–10.

**A tick completes the next Development.**
- The Ref writes `Threat <name> d/n: <what happened>` to the sealed ledger at the scene boundary (§15.8).
- The Ref **also puts the tick into the fiction in the same scene**, as a named move: `Move: Foreshadow a Threat` for a step still avoidable, `Move: Advance a Threat` for one that is done (FA p.56). A tick that reaches only the ledger is a drift, not a tick. [HOUSE, from the trials]

**Ticks come from three printed Crows clocks and nothing else.** [HOUSE]
1. **A rest outdoors in the Miasma** (R14, R27). One tick per such rest.
2. **A village cycle that ends with no Prosperity rise** (C45). It is the same cycle end that lowers Prosperity by 1.
3. **A natural 10 on an encounter check** (R14). That is the immediate encounter. Any encounter check the Ref makes counts: DT end, rest, noise, travel.

**Cap: at most 2 ticks per session.** A session is one LOAD to SAVE span (§15.7). [HOUSE] The third and later ticks wait for the next session; the Ref notes `tick held (cap)` in the sealed ledger.

**Which Threat takes a tick.** One live Threat, chosen by the Ref by the fiction (where the crow is, what just happened). Never the same Threat twice from the same source in one session. If none fits, the tick is held. [HOUSE]

**Reactions.** When the crow impedes a Threat (removes an Asset, kills its agent, spoils a Development), the Ref may use `Move: Use a Threat Reaction` (FA p.56) once per scene. It hits hard, so use it sparingly. [IMPORTED, FA p.56]

**Ending a Threat.**
- Goal reached: the world changes as the Goal said. The Ref delivers it with `Move: Advance a Threat`, and the Ref seeds a replacement Threat in the sealed file.
- Crow resolves it: the crow does something that plausibly ends the Threat's power. The Ref marks it ended in the sealed ledger. [HOUSE]

**What does not change.**
- The printed village event is always rolled at the cycle end (C45–47). A Threat colours how it lands. It never replaces it.
- A Threat never replaces printed pressure (encounters, Miasma, Prosperity decay). It rides on those clocks.

**Pace check (sim/threat_ticks.csv).** At 6 DTs a session, one Miasma rest, 2 sessions a cycle and a 30% Prosperity rise a cycle, a 4-, 5- and 6-Development Threat completes in a median of 3, 3 and 4 sessions, with at least 99% finishing in 2–5. At 4 DTs a session with rare Miasma rests the 6-Development Threat can take over 5 sessions. If that pace is wrong for your table, lower the Development count rather than raising the cap.

---

## B · §9a: Combat housekeeping [HOUSE, from the trials; no printed rule changes]

Insert after the Combat clause in §9.

- **A foe at 0 Stamina is struck from the scene line before any foe turn**, and it takes no turn that round. (Trials: a dead foe still rolled in 2 of 4 C1 runs, and D_S5 had a foe killed before its turn still listed.)
- **Every foe attack has an engine `test` line.** No foe attack is narrated without one.
- **One scene line, updated each round:** `foe Stamina x/y position`, in initiative order. The Ref reads the block once and does not restate it. (Trials: state blocks stayed under 320 tokens in every variant.)

---

## C · §9b: Social moves

Insert after §9a. These are tests, so §1 applies (dice ownership, edges, expertise, crit and doom).

**When to call one** [R6; §1 "Social" and "No roll when"]. Crows has no interaction characteristic (R6), so use **Mind** [HOUSE: Mind stands in for DW2's CHA and WIS]. The Ref calls a social test only when an NPC has something at stake and the Ref wants the dice to decide. Otherwise the NPC answers by personality, with no roll (the plan works, the NPC is persuaded, or not).

**Pull Strings** (2d10 + M) [IMPORTED from DW2, MR p.2]. The crow tries to move an NPC to do something. The player names the **approach**:
- **Deceive:** false words or actions.
- **Persuade:** open and honest.
- **Threaten:** their safety or interests.

| Tier | Result |
|---|---|
| 3 | They do it as best they can |
| 2 | They try, with a complication from the approach. Deceive: they may later seek the truth or learn a secret about the crow. Persuade: they ask for a promise or payment, or only partly follow through. Threaten: they escalate the conflict now, or escape or betray the crow later |
| 1 | They make things worse, and the Ref makes a card move (§9c). A doom adds a major setback (R7) |

**Sense Motive** (2d10 + M) [IMPORTED from DW2, MR p.2]. The crow scrutinizes an NPC through a conversation.
- **Tier 3:** the player asks the Ref **two** questions. **Tier 2:** one.
- Questions are about the NPC's thoughts, feelings or motives. The Ref answers truthfully, though the NPC might not be truthful. Example questions: Are you lying about X? How might I get you to X? What do you desire most?
- **Tier 1:** the crow is discovered or interrupted, and the Ref makes a card move (§9c).

**Dropped from DW2.** XP marks on a 6−, Depth and Bonds, and the move's "mark a condition" costs. Crows XP is treasure (C6), and the crow has no Bond track. Other DW2 social and exploration moves (Aid, Defy Danger, Spout Lore, Unearth Secrets, Sneak Past, Perform a Ritual, Cast a Spell) are **not** imported: Crows has its own tests for them (R6–R10, R30+).

**Untested in the trials.** Pull Strings and Sense Motive were exercised only at tier 2. The tier 1 and tier 3 rows are as printed in MR but not yet played out.

---

## D · §9c: Ref move card

**When it fires** [HOUSE, with the DW2 trigger noted]. On a **tier 1 that has no printed result** (§9d lists what has one). DW2 makes a GM move on a 6− (FA p.56; CGR p.2); this is the Crows equivalent. The Ref **names one move** on the mechanics line as `Move: <name>` and makes it **in the fiction**. Something concrete changes: a fact in the fiction, the Ledger or the sealed file that was not so before. No soft narration.

**The card** [IMPORTED from DW2, move names FA p.56; grouping CGR p.2]. Pick one:
- **Escalate the Situation:** a new obstacle, reinforcements, or a hidden ability. The situation just got bigger and worse.
- **Hit the Ground Running:** skip the setup and jump to the middle of the action.
- **Require a Cost or Opportunity:** the crow pays something (an item, a use of an expertise, a UD, ground) or must first get into a better position.
- **Make Them Choose:** one hard choice, put as a situation in the fiction and aimed at the crow. Never a list, never a menu (hot card).
- **Set Up an Immediate Risk:** describe something bad about to happen right here. Can the crow stop it?
- **Have It Backfire:** the crow's own move turns against them: freak accident, hidden factor, sabotage, overwhelming power.
- **Take Something Away:** gear, an ally or an opening. Telegraph a significant loss first.
- **Hurt Them:** damage, with the cause described. See §9d for the number.
- **Foreshadow a Threat / Advance a Threat / Use a Threat Reaction:** only when a Threat's trigger is armed (§5).

**Left out on purpose.** The DW2 "release" and "ask" moves (Slow Down For a Bit, Sometimes Give Them What They Want, asking the player to describe something): they soften a tier 1, which is the opposite of the card's job. Use them at a scene's start, not on a failed roll. **Separate Them** and **Introduce Something New** are left out of the tier 1 card (the first is for parties; the second belongs to scene framing).

**Rules for the move.**
- **Never the same move twice in a row** (hot card: the same kind of consequence).
- **Do not state a price before the move is taken** (hot card).
- A tier 2 **never** takes a card move. It takes the printed cost for the test, or the Ref's partial success or cost (R6–7).

---

## E · §9d: Precedence where Crows and DW2 overlap

**Order of authority, highest first:**
1. A **printed Crows rule** (R, C, F, D, or a creature or item card).
2. **This layer's** clauses (including §9a to §9d).
3. **Imported DW2 text.**

A lower item never overrides, removes or duplicates a higher one. Specific cases:

1. **Tier 1 results that already have a printed result do not take a card move.** The printed result applies, and only that:
   - a **weapon-attack miss**: the target may counter (R20–21);
   - a **spell** tier 1: a printed cost, and the chaos d6 on a non-doom (§8);
   - a **resistance roll** with listed tiers (R10);
   - the **Miasma RR**: tier 1 is +1 cruelty and a roll on the Miasma Effects table (R27–28);
   - a printed trap, hazard or table row (`read`).
2. **A doom** is tier 1 plus a major setback (R7). The printed result applies, and the major setback **is** the card move (if the test had no printed result, or the Ref's call on a printed one). **Never two card moves for one doom.**
3. **Crows conditions beat DW2 consequences.**
   - Blessed, grabbed, prone, vulnerable, unconscious, weakened, cruelty and wounds (R12–13, R27–28) exist only through the rule that grants them. A card move may only apply one if the fiction supports it **and** the printed condition's full rules then apply (the grab test, the stand-up maneuver, the 1d6 vulnerable damage, and so on). The Ref does not invent a hybrid ("mostly prone", "half grabbed").
   - DW2's marked **Conditions, Bloodied, HP, Treasure, XP and Depth do not exist** in this game. A card move never marks, clears or checks them.
4. **Damage from a card move has a printed source.** Use the printed damage of the hazard, trap, creature or spell involved. If none is printed, the engine rolls **1d6** (`roll d6 --why <move>`); piercing only if the source is piercing. [UNSOURCED default; Crows effects commonly deal 1d6 (R12, R13 vulnerable)]. Never an unrolled number. AD then Stamina then wounds apply as printed (R12).
5. **Resources a card move may touch:** an item, a use of an expertise, a UD die, a backpack slot, ground, time (a DT block), an ally or NPC attitude, an encounter check. It never alters what a printed table says.
6. **Threat ticks never replace printed pressure** (§5). The printed village event, encounter checks, Miasma and Prosperity decay run first. A Threat colours them.
7. **Dice ownership stays §1.** The crow's social and exploration tests are rolled in the Ledger. The Ref's card-move rolls (damage, encounter checks, reactions) go through the engine and are pasted verbatim.

---

## F · Hot card patch (`06_hot_card.md`)

Add to "Rules at a glance":
- **Tier 1 with no printed result:** name a move from the card (§9c) on the mechanics line (`Move: <name>`) and make it. A weapon miss keeps its counter. A tier 2 never takes a card move.
- **Social:** Pull Strings and Sense Motive are Mind tests, called only when an NPC has something at stake and the Ref wants dice (§9b).
- **Threat ticks:** three clocks only (Miasma rest outdoors, a cycle with no Prosperity rise, a natural 10 on an encounter check). Cap 2 a session. Put each tick in the fiction **and** the sealed ledger.

Add to "Never":
- A foe that is dead still rolling or taking a turn. Strike it from the scene line first.
- A foe attack with no engine line.
- A tick written to the sealed ledger and not shown in the fiction.
- Two card moves for one tier 1.

Change in "You own": replace "the fronts" with "the Threats".

---

## G · Other patches

- **§13 SAVE block**, Standing pressure (sealed): add `Threat: <name> d/n · ticks this session t/2 · held: <n>` per live Threat. The three tick sources are standing armed triggers for chassis §9.2 ARMED TRIGGERS. The Ref lists them rather than the old portent conditions.
- **§15.8 (sealed ledger discipline):** add the line shapes `Threat <name> d/n: <what>` and `tick held (cap)`.
- **Chassis cross-references.** The layer's old §5 pointed at chassis §4 for "a portent sequence written before it can fire". The Threat's ordered Developments **are** that sequence. No chassis edit is needed.
- **Engine:** no change required. Optional additions are proposed in `changelog.md`.

---

## H · Source gaps

- **[UNSOURCED]** The 1d6 default for unprinted card-move damage (§9d.4).
- **[HOUSE, not DW2]** Mind for the social moves; the three tick clocks and the cap of 2; "session" defined as LOAD to SAVE; which Threat takes a tick; ending a Threat; §9a housekeeping.
- **[GAP, not in DW2 sources read]** DW2's tier-by-tier effect of its marked Conditions (only the penalties on FA p.7 are known), so none is imported.
- **Untested:** Pull Strings and Sense Motive at tier 1 and tier 3; the starting crow; sessions longer than one SAVE span.
