# CROWS — SYSTEM LAYER v1.2 (solo, village-anchored, chardisc)

> v1.1 = v1 + Amendment 1 (Threats with ticks, social moves, Ref move card, precedence; §5, §9a to §9d, §13, §15) + the wilderness supplement (§16). §9 combat is unchanged from v1. See `out/changelog.md`.

Load order: `00_chassis_v3.md` → this file → `02_source_index.md` → the sealed file → the SAVE, if there is one. During play, `06_hot_card.md` stands in for the first two (§15).

This file supplies rules-facing content only. Conduct, pacing, consequence and continuity belong to the chassis, and nothing here overrides it.

**Page references.** They cite **Crows Playtest 2 (August–September 2026)** by book and page:
- `R` = The Rules Book
- `C` = The Characters Book
- `F` = The Ref Book
- `D` = The Dungeons Book

The extracted text lives at `crows/src/crows_0N_*.txt`, with `===== PDFPAGE n =====` markers; the PDFPAGE equals the printed page. The display-font headings lost some letters in extraction ("Comat" = Combat). Grep on body text, not headings; `02_source_index.md` gives repaired names.

**Imported material is flagged `[IMPORTED]`.** Everything else is printed procedure.

---

## 0 · What this game is

Crows is MCDM's survival-horror dungeon crawl set in Cornath, ten years after the Necromancer War.

Crows are scavengers from one village. They delve monster-infested ruins for treasure, and the spoils turn their village into a fortress (R2, R4).

The game says outright that it is unfair, that death is on the table, and that clever play beats dice (R2, R4).

This instantiation plays it the way Stonetop played best:
- **The village is the persistent protagonist.** Crows come and go; the village and its institutions remain (C44).
- **Characters are discovered in play, not built up front** (§2).
- **One player, one active crow, plus hirelings** (§2.4).

---

## 1 · Resolution and dice ownership (chassis §2.1)

**The test** (R6–7): 2d10 + one characteristic (Agility, Mind or Strength).

| Total | Tier | Meaning |
|---|---|---|
| ≤11 | 1 | Didn't do it; a setback at the Ref's discretion. For attacks this is a miss |
| 12–16 | 2 | Partial success, or success at a cost; the Ref chooses which |
| 17+ | 3 | Clean success |

**Crits and dooms** (R7) read the natural dice, before modifiers:
- **Crit:** 19–20. Tier 3 plus something extra. On an attack it grants an extra action (R20).
- **Doom:** 2–3. Tier 1 plus a major setback.

**Edges and banes** (R7–8):
- An edge is +2 and a bane is −2.
- Two or more edges make a double edge: no bonus, but the tier moves up one. Double bane works the same way down.
- Edges and banes cancel pairwise; a double cancels down to a single against a lone opposite.
- Plain bonuses and penalties are not edges or banes.

**Expertise** (R8): after the roll, spend one use of a fitting expertise to raise the result by one tier, to a maximum of tier 3. One expertise per test. Uses return on a rest, except a rest in the Miasma.
- **Arguing for fit:** the player names the expertise and argues why it applies (R9).
- **Bypassing the test:** having an expertise can skip the test entirely for amateur-level tasks (R9).

**Resistance rolls (RR)** are tests against danger. The effect lists its own tier results (R10).

**Other special tests:**
- **Assist** (R9): tier 1 gives −1, tier 2 gives +1, tier 3 gives +2.
- **Group test** (R10): the others assist, then the leader rolls for the group.
- **Trying again** (R7): no retry until circumstances change significantly.

**No roll when** (R4, R6):
- the task would work more than 80% of the time;
- there is time and no consequence for failure;
- the plan is clever enough to just work;
- or success is impossible, in which case describe the consequence. For a certain-death attempt, confirm first.

**Social** (R6): there is no social characteristic. NPCs respond to persuasion, bribes, lies and threats according to their personality. A Mind test is used only when the Ref wants the dice to decide.

### Dice ownership [locked, per chassis §8.4; reopen only if the player asks]

| Roll | Who | Visibility |
|---|---|---|
| All of the crow's tests, attacks, RRs, UD, Miasma RR, crafting, chaos roll | Player, in the Crow's Ledger sheet | Open, as pasted log lines |
| Hireling tests (the player controls hirelings, C43) | Player | Open |
| Monster and NPC attacks, encounter checks, initiative (R18, "a player of the Ref's choice": default the player), table rolls (encounters, interesting things, village events, backlashes) | Ref | **Open.** R5: "roll your dice in front of the players … it will hold you accountable" |
| Lost-hex drift (R27), NPC private checks, sealed triggers, Mythic Fate Checks about hidden state | Ref | **Secret** |

**How the Ref rolls:**
- With a shell, the Ref runs the **Ref engine** (`crows/engine/`, see its README). Every Ref-side die, printed table, travel day, village cycle, fate check and map question goes through it. Its `Ref:` line is the mechanics line, verbatim; its `SEALED:` lines go to the sealed ledger.
- With a code tool but no engine, the Ref rolls real random numbers and prints them on the mechanics line.
- Without one, the Ref asks the player for the roll ("Ref roll: 1d10"). Secret rolls become blind rolls, with no reason given.
- The Ref never invents a number.

---

## 2 · Character creation → chardisc (chassis §2.2)

### 2.1 What Crows prints (C1)

- Roll 2d6 on the Backgrounds table.
- Record the background's Stamina, starting trait, expertise uses and equipment.
- Speed is 5.
- The background sets one characteristic to 2. The other two take 1 and 0, or −1 and 2.
- Name and one distinguishing feature.
- Standard kit: an empty coin purse, knife, rope, 6 rations, and 3d6 gc.
- One NPC connection in the village (C44–45). The village is made together (C44).

### 2.2 Chardisc: the procedure [IMPORTED, house rule layered on C1]

Everything numeric that the dice decide is rolled at the table in the first exchange. Everything the player would otherwise invent up front is left blank and discovered at the moment play first touches it. The legal outcome space is exactly C1's.

| Element | When it is fixed |
|---|---|
| Background (2d6), 3d6 gc | First exchange, before fiction. These are the only session-zero rolls |
| Stamina, trait, expertises, equipment, speed 5, standard kit | Read from the background at the same time |
| The background's "2" | Fixed now if assigned. If the background offers a choice, it's fixed the first time a test calls for either option |
| The other two characteristics | Blank. The first time a test calls for a blank one, the player chooses the pattern (1/0 or −1/2) and assigns that characteristic; the last one takes the remainder |
| Name | The first time anyone would say it |
| Distinguishing feature | The first time the crow is described to someone, or asked by one texture question |
| Backstory | Never written as a block. It grows from answers to chassis §5.6 texture questions (at most 1 per response in play) and is logged as player canon (chassis §8.1) |
| Connection NPC and benefit (C44–45) | Before the crow first leaves the village for a delve, or at the first return if play opens outside the village |

The Ref never fills a blank for the player. A blank that play needs is asked about as one open question in the fiction, never as a list of options (chassis §5.2.4).

### 2.3 The village is discovered too [IMPORTED procedure on printed rules, C44–54]

**Printed facts, fixed from the start:**
- Prosperity is 0.
- The starting institutions are blacksmith, crypt, general store, inn and temple, all at level 1.
- The village sits inside an enclosed ruin that keeps out the Miasma and monsters (C44).
- Each crow has a home there (C54).

**Blank, discovered by texture questions woven into play:**
- the village's name;
- what ruin it lives in;
- the stewards, created when first visited (C48 lets the Ref or the investing player author them).

**The sixth institution, chosen by the player (C44):**
- It's fixed the first time the crow wants a service only that institution provides, or at the end of the first village cycle, whichever comes first.
- Until then it doesn't exist.

**Gadwick (D1) is not the home village.** It is the nearest other village: keyed and fetched, with printed institutions and stewards.

### 2.4 Solo spotlight [locked default; reopen per §14]

- **One active crow.** Up to two hirelings, hired from the barracks if the village has one, or found in play (C43). The player controls hirelings; the Ref takes one over only for "very out of character or outlandishly dangerous" orders (C43). Hireling pay, food and death benefits are owed exactly as printed (C43), and are a payment channel under chassis §7.5.
- **The roster.** The village holds other would-be crows as names only, until one steps up.
- **When a crow dies**, the next crow rolls additional backgrounds equal to the dead crow's Expertise & Stamina bonuses and picks one (C7). If the survivors are far ahead, C7 "Starting With More" applies.
- **Retirement** at 60,000 TXP gives village benefits (C55).

### 2.5 Advancement (C6–7)

- **XP is treasure.** A crow gains XP equal to the gc value of treasure recovered outside a village (not bought, crafted, stolen from innocents or taken from allies), divided by the number of players, so in solo the full value.
- **XP is spent only after a rest.** TXP thresholds grant expertise or Stamina bonuses (C6) and characteristic bonuses (C7). Traits cost XP along the trait trees (C7+).
- **The Greed Bonus** (R13) adds +30%, +20% or +10% to treasure found in the first, second or third DT of a first entry into a dungeon.

---

## 3 · Rules-facing GM procedure (chassis §2.3), printed (R4–5; D1)

- **Let logic and creativity win.** A good plan succeeds. There is always another threat in the next room.
- **Not every action needs a test.** Ask far fewer rolls than in d20 games.
- **Hint at danger.** A headless corpse means a trap; a stench under a door means undead. Warning signs are the Ref's job; ignoring them is on the players.
- **Play the dice where they fall.** Be strict but fair. No fudging in either direction; this matches chassis §8.5.
- **Specific beats general.** Round down. The Ref has the final say.
- **Dungeon text is a guide, not handcuffs** (D1). A sensible unlisted idea works; a risky one gets a test.
- **Tier 2 is the heart of the game** (R6–7). It's either a partial success or a success at a cost. R7 lists models: dropped gear, fewer pursuers, landing prone, 2 P dam from strain, damaged tools (a bane until repaired), noise drawing a monster.

---

## 4 · Creatures and NPCs (chassis §2.4)

**Stat blocks** (F15+) list: Size, Power (0–50), Type, Stamina, Speed, Slots (humans and animals only), Agility / Mind / Strength, attacks with their 12–16 and 17+ damage, and features.
- Monsters have no slots and die at 0 Stamina.
- "X/Rest" features can be regained on a crit (F15).
- Monsters ignore darkness and dim light (F30).

**Power scale** (F15): starting crows "stand no chance" head-to-head against power 11+. Groups of power 1+ "can really mess them up."

**Where to look:**
- **Bestiary:** Ref book, animals F16–21, humans F22–28, blood creatures F32–33, undead F34–38. The full list with pages is in `02_source_index.md`.
- **Unlisted creatures:** build them from the nearest block and log the ruling (chassis §8.2). The playtest bestiary covers only blood creatures and undead; the angel, demon and plant tables are not in this build (F1).

**Disposition and withdrawal. This decides whether violence is the default:**
- **Likes and hates** (F30). Every monster type has them. Monsters investigate likes and destroy hates, and weak ones (power 9 or less) may flee an overwhelming hate. All monsters like living, vulnerable prey and distress sounds, and all hate dying. Likes and hates are for baiting, distracting and misdirecting.
- **Suspicious circumstances** (F31). When the bait is in an odd or dangerous spot, the monster makes a 2d10 + M test: tier 1 comes without suspicion, tier 2 investigates, tier 3 withdraws and ambushes or gathers allies.
- **Monsters ending the fight** (F31). They flee a losing fight. Weak ones stay near their pack. Dungeon monsters rarely pursue outside their territory. Wild monsters flee earlier. They often let crows escape after a kill that satisfies them.
- **Humans ending the fight** (F22). They flee or surrender when outmatched and stop once they get what they fought for. A lone human flees at 0 Stamina; a group flees when its numbers are halved.
- **Animals ending the fight** (F16). They rarely fight to the death, and predators want the cheapest meal available. Use the Wild Animal Reaction table (F11–12).

**Encounters:**
- **Encounter checks** (R14, R29): roll 1d10 against the EN.
  - The default EN is 9.
  - Lower it to 8 for a crowded level or a trail of chaos, and to 7 for both.
- **When an encounter comes** (R14): a 10 means it happens now. A 9 or less means a sign now (a distant roar, a fresh corpse, a footprint) and the encounter within the next DT, at the Ref's choice. This is the printed telegraph (chassis §4).
- **Tables:** Travel Encounters (F1). Blood and undead dungeon tables (F32+). Individual dungeons state their own EN and table (D4, D11).

---

## 5 · Escalating threat (chassis §2.5)

**Printed pressure, used as written:**
- **Encounter checks** at the end of each DT, on noise, and during travel and rests (R14, R29).
- **The Miasma** (R27–28). After every rest outdoors, each human makes a Mind RR.
  - **Tier 1:** +1 cruelty and a roll on Miasma Effects (d10 + cruelty). At 13+, the crow becomes a Ref-controlled NPC.
  - **Rest penalty:** a rest in the Miasma doesn't return expertise uses.
  - **Clearing it:** cruelty clears on a rest outside the Miasma.
- **Village decay** (C45). Prosperity drops by 1 at the end of any cycle where nothing raised it.
  - It rises by 1 for founding or upgrading an institution, or for spending 10,000 gc or more at merchants in a cycle.
  - The range is −10 to +10.
- **Village Events** (C45–47). At the end of each 10-day cycle the Ref rolls d10 + Prosperity for the next cycle's event. Low Prosperity brings monster attacks, raids, murdered stewards, and villagers turning on the crows.
- **The Greed Bonus** (R13) rewards speed in a dungeon, which counters the caution the game otherwise rewards.

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


---

## 6 · Session opening procedure (chassis §2.6)

**New campaign:**
1. Silently verify the chassis, this layer, the index, the sealed file and the source text (chassis §1, §10).
2. Take the player's rolls, and nothing else: background (2d6) and gc (3d6). Record the background block.
3. Open in medias res with the sealed file's cold open. The first player-facing paragraph is fiction (chassis §9.1).
4. The chardisc blanks (§2.2) and the village blanks (§2.3) are then filled through play, at most one question per response. None of them is a precondition for the first scene.

**Continuing campaign:** LOAD per chassis §9.5. The first response is fiction.

---

## 7 · Time and procedure structure (chassis §2.7)

| Scale | Unit | What fires at the end of each unit | Who advances |
|---|---|---|---|
| Combat | Round (R18) | Side initiative is rerolled at the start of each round | Ref |
| Dungeon | Dungeon Turn (R13) | Every UD with "DT" is rolled; the Ref makes an encounter check; effects that last until end of DT end (blessed, weakened, vulnerable) | Ref |
| Outside a dungeon | 2 in-fiction hours count as 1 DT for UD and effects (R14) | UD | Ref |
| Rest | 6 hours, 4 of them asleep, eating 1 ration (R14) | Stamina full, −1 wound, expertise uses back (not in the Miasma); rest encounter check; Miasma RR if outdoors; one rest activity (R15) | Player declares, Ref resolves |
| Travel | Day (R24–29) | Pace, then roles (supporters, guides, scouts, trackers), then encounter check, then POIs, then rest, then Miasma RR | Ref runs the procedure; the player declares pace and roles |
| Village | Day (R15) | Up to 4 rest activities a day without a rest; merchants, crafting | Player |
| Village cycle | 10 days (C45) | Prosperity check, the next Village Event roll, institutions founded or upgraded come online, merchants restock | Ref |

**The Dungeon Turn clock** [locked default, printed variant R14; reopen if the player asks]:
- **Default:** at the start of each DT the Ref openly rolls 1d6. The DT ends when the crows have explored that many rooms (an "area" in the dungeon key) or taken an equivalent block of time-consuming action (a thorough search, a long rest attempt, a fight that clears).
- **Alternative, the player's call:** the real-time timer (30 or 60 minutes) that R13 prefers. The player runs a timer and types "DT" when it rings.

**Glossing time** (chassis §6.9): a skipped travel day still runs pace, roles, the encounter check, rations, Miasma and UD. The deductions are stated in the gloss.

---

## 8 · Resource and attrition model (chassis §2.8). This is load-bearing

Difficulty in Crows lives here more than in the dice.

- **Inventory slots** (R10). 2 hand, 4 belt and 10 backpack slots (numbered). Multi-slot items take adjacent slots of the same type. Some items stack.
  - **Mid-combat** (R11): swapping hand and belt slots is a maneuver. Drawing from the backpack is a maneuver plus a 1d10 roll that must meet the item's slot number.
- **Stamina and AD** (R12):
  - Damage comes off armor AD first, then Stamina.
  - P (piercing) damage skips AD.
  - AD returns by a rest activity or a blacksmith.
- **Wounds.** At 0 AD and 0 Stamina, each point of damage becomes a wound, and each wound fills a backpack slot. Each slot holding both a wound and an item costs 1 speed. **When every backpack slot holds a wound, the crow dies** (R12). Wounds are the real hit points, and they cost carrying capacity. This is the core of the attrition.
- **Healing wounds:**
  - A rest removes 1 wound, or 2 with Tend Wounds (R15).
  - The temple heals wounds equal to its level for 100 gc (C54).
  - A connection with the Caretaker benefit adds +2 wounds healed, or +3 at Prosperity 6+ (C44).
- **Usage dice** (R13). Torches, lanterns, spellbooks and spell effects roll d6s; each 1 or 2 removes a die.
- **Light** (R15–16). Dim light gives a bane on attacks and searches. Darkness gives a double bane, and a silent target's space must be guessed. **Dungeon interiors are usually dark** (D4, D11).
- **Food.** One ration per rest. Each day without food adds a starvation wound (R16).
- **Expertise uses** return only on a rest outside the Miasma (R14, R27).
- **Money.**
  - gc is XP.
  - Hirelings cost power × 10 gc per day (minimum 10) plus food, and power × 500 gc if they die (C43).
  - Selling pays 30–70% by Prosperity (C46).
  - The village needs investment or it decays (C45).
- **Magic item slots** (R11): 6. Doubling up a slot stops rest, and adds 1d6 wounds each DT.
- **Spellbooks** (R30–35). Casting is a Mind test.
  - On a tier 1 that isn't a doom, roll the chaos d6: a 1 causes a backlash.
  - A doom always causes a backlash: d100 + rank.
  - A crit on a casting doesn't roll UD.

---

## 9 · Procedural clauses: dungeon, combat, travel (the rules this layer runs on)

**Dungeon turn** (R13–14):
- Entering a dungeon starts DT 1, and the player is told.
- At the end of each DT: roll UD, then make an encounter check.
- Loud acts force an extra check.

**Rest in a dungeon** (R14): make an encounter check using the dungeon EN. A rest interrupted by combat or strenuous activity must restart.

**Combat** (R18–23):
- **Side initiative.** Each round, 1d10: 6+ means the crows' side acts first, 5 or less means the enemies do.
- **A turn** is one maneuver plus one action, or two maneuvers.
- **Common maneuvers:** Move Speed, Shift, Command (pet), Draw From Pack or Belt, Pick Up, Dump Backpack, Stand Up, Grab, Escape Grab, Knockback.
- **Common actions:** attack, Taunt, Ready.
- **Attacks** use the weapon's card for the characteristic and damage at each tier. The playtest text prints no per-weapon damage (C37 reads "Insert Final Weapon Card Diagram Here"), so damage comes from the PT1 inventory cards, tabulated in `02_source_index.md`, and sits in the Ledger's attack row (entered once). Qualities and prices match PT2's weapon table. If an item isn't tabulated, the Ref asks once and logs the numbers as a ruling.
  - **Melee miss:** the target may counter, dealing their weapon's tier 2 damage (tier 3 on a doom).
  - **Ranged miss next to allies:** roll any die. On an odd result a random ally takes tier 2 damage; on a doom, tier 3.
  - **Ranged at an adjacent target:** a bane.
  - **Crit:** an extra action.
- **Unarmed** (R19–20): 2d10 + A or S. Tier 1 lets the target counter; tier 2 deals 1 + A/S; tier 3 deals 2 + A/S. Improvised weapons count as unarmed.
- **Edges and banes in combat:** flanking and high ground give an edge (R20). Cover gives a bane (R16).
- **Reactions:** one per round, for a counter or an opportunity attack (R21).
- **Surprised creatures** skip round 1 and are attacked at +1 (R18).
- **Toppling objects** (R23): a dropped object does 1d10 plus 2d10 per size step larger than the creature. **Preparing the battlefield is the printed advice** (R23).

**9a · Combat housekeeping** [Amendment 1]

- **A foe at 0 Stamina is struck from the scene line before any foe turn**, and it takes no turn that round.
- **Every foe attack has an engine `test` line.** No foe attack is narrated without one.
- **One scene line, updated each round:** `foe Stamina x/y position`, in initiative order. The Ref reads the block once and does not restate it.

**9b · Social moves** [Amendment 1]

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


**9c · Ref move card** [Amendment 1]

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

**9d · Precedence where Crows and DW2 overlap** [Amendment 1]

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

**Travel** (R24–29):
- Hexes are 5 miles.
- **Pace:** Slow is 1 hex at EN 8 with an edge on roles. Normal is 2 hexes at EN 7. Fast is 3 hexes at EN 6 with a bane on roles.
- Roads, rivers and speed modify the pace.
- **The four roles and their tasks:**
  - **Supporter:** Fight the Miasma, Make Camp, Support Everyone.
  - **Guide:** Normal, Safe or Shortcut route.
  - **Scout:** Danger, Shelter, Treasure Hunt.
  - **Tracker:** Forage, Hunt, Track.
- **Getting lost** (R27) is secret drift of 1d6 per hex.
- **Zoom in only for encounters and POIs** (R28–29). Otherwise travel is a two-sentence montage. That montage is chassis §6.5.

---

## 10 · The village layer (Stonetop's town, Crows' rules)

The village is where the payoff lands (chassis §7.5 "something gone, someone changed, something owed") and where standing pressure accumulates.

- **Institutions** (C48–54): Alchemist, Auction House, Barracks, Beacon, Blacksmith, Bookseller, Crypt, Enchanter, General Store, Inn, Stables, Temple. Each has founding and upgrade prices, services, and a steward. The Inn is on C53.
- **The Crypt** (C51). Dead crows interred there grant boons to living crows, once per cycle. A death pays forward. This is chassis §7.5 "someone changed."
- **Connections** (C44–45). One per crow. The benefit is mechanical; the person is canon.
- **Stewards and connections are NPCs with agendas.** They get instincts in the sealed file when first created. They speak with full persona (chassis §5.4 and §5.5 apply to them).
- **Village questions are texture, never hidden danger** (chassis §5.6).

---

## 11 · Neutral oracle

1. **Crows tables first:** encounters, reactions, Interesting Things (F13–14), Village Events, backlashes. Then the wilderness tables in `engine/tables_wyrd.json` (§16) for texture.
2. **Then Mythic.** For yes/no questions prep and tables don't answer, use the Mythic Fate Check (`solo_campaign/04_mythic_core.md`, the Fate Check section only).
   - 2d10 + odds modifier; 11+ is yes.
   - Chaos Factor is fixed at 5 (modifier 0) [IMPORTED; there is no scene loop in this game].
3. **Seal first.** Anything an oracle decides about hidden state is written to the sealed ledger before it's revealed (chassis §4).

---

## 12 · Source gate and banding

- **Silent, per chassis §1 and §5.7.** Fetches never appear above the fiction. Only a missing file is ever mentioned.
- **Resident (loaded every session):** this layer, the index, the sealed file, and the SAVE.
- **Streamed on approach:**
  - bestiary entries;
  - the current dungeon's key;
  - trait trees, equipment cards and institution pages when a purchase or advancement is in play;
  - backlash and Miasma tables when triggered.
- **Border buffer = one step out** (chassis §3.5), following the source's own seams:
  - **The current dungeon, plus the area beyond the next door.** Dungeon keys are numbered areas, so a crow can only reach the next one.
  - **The current hex, plus the destination POI or dungeon's arrival text.**
  - **Load masking.** The printed "arrival" bullets (D2, D4, D10) are the elevator. Read the key while narrating the approach.
- **Verbatim carry** (chassis §9.3). Any stat block, dungeon area or item card that's live in the next scene is copied in full into the SAVE.

---

## 13 · SAVE block, Crows additions (appended to chassis §9.2)

The Crow's Ledger's "Copy STATE" button produces this block's open half, in this exact format. The Ref never rebuilds it by hand.

```
--- STATE (open) ---
Crow:        name/— · background · A/M/S (— = undiscovered) · Stamina x/y · AD (item) x/y · speed
Slots:       H1 · H2 | B1–B4 | P1–P10 (item / WOUND / starvation)
Attacks:     weapon (stat) T2 n / T3 n · …   (damage already resolved with the crow's stats)
Expertises:  name uses/max …    Traits: …    XP unspent / TXP
Hirelings:   name, block, power, pay owed, slots
Light & UD:  torch 2UD · spellbook X 1UD …
Rations: n · gc: n · Cruelty: n · Miasma effects: …
Where:       dungeon/area · DT n (rooms left k) · Greed tier  |  or hex, travel day, pace
Village:     name/— · Prosperity n · cycle day d/10 · institutions (lvl, steward) · next event (rolled, sealed)
Connection:  name/— · benefit/—
Threats:     name d/n · ticks this session t/2 · held n   (one line per live Threat; sealed half)
Chardisc blanks still open: …
Canon locks (player-origin marked [P]) · Rulings
Live prompt: <what is aimed at the crow right now>
--- STANDING PRESSURE (sealed) --- per chassis §9.2
```

---

## 14 · Recorded defaults (chassis §8.4) and what reopens them

| Default | Reopens if |
|---|---|
| One active crow plus up to 2 hirelings | The player asks, or two crows die within the first three delves |
| DT = 1d6 rooms (printed variant) | The player wants the real-time timer |
| The Ref rolls openly through the Ref engine (or any code tool), with blind or secret rolls only as listed in §1 | No code tool is available: switch to player-rolled "Ref roll" requests |
| Mythic CF fixed at 5 | The player wants Mythic scene structure |
| Home village discovered; Gadwick as neighbor | The player wants to start in Gadwick |
| Playtest 2 rules as written; playtest notes marked incomplete stay incomplete (only blood and undead tables, F1) | A newer playtest or final rules are uploaded, which means re-extracting and re-indexing |

---

## 15 · State economy: keeping the Ref's context small and the output sharp

Seb's design note locates the real failure curve. Output-contract compliance degrades before recall does: menus, status dumps and bookkeeping come back first. Every clause below reduces what the Ref must hold or recompute, so its attention stays on judgment and the response contract.

1. **One owner per fact.**
   - The **Crow's Ledger** artifact owns the crow's mechanical state (db doc `ledger/main`: `state` as JSON, `stateText` as the §13 block).
   - The **sealed file** owns the world.
   - The **chat** owns only the fiction in play.
   - Nothing is kept in two places. The chat never re-tabulates the sheet.
2. **Deterministic work lives in the sheet; judgment lives in the Ref.**
   - The sheet computes tiers, edge and bane resolution, expertise spends, UD, wound placement, speed, rests, DT ends with encounter checks, draws from the pack, and treasure-to-XP.
   - The Ref accepts log lines as given (they carry the natural dice) and adjudicates only meaning.
   - This removes the error class the Nimble audit found (invented or mis-applied math).
   - The Ref's side of the same split is the **Ref engine**: its dice, printed tables and map geometry (distance, line of sight, what the crow has seen) come from code, never from recall.
3. **Log lines are a protocol.**
   - Format: `KIND label · stat±n · e/b · [d,d]=total → Tn [CRIT|DOOM] [· expertise used] [HIT n dam | MISS]`.
   - The Ref reads the tier and the flags and never re-derives them.
   - The Ref's own open rolls use the same shape (`Ref: …`).
4. **Keep the resident set small.**
   - **At load:** the chassis, this layer, the index and the sealed file are read once.
   - **During play:** only `06_hot_card.md` is re-read, on the cadence it states (the impostor of the full docs, per the banded-prep note).
   - **Full docs** are re-opened only when a rule is in doubt.
   - **Source pages** are fetched one page at a time via the index.
   - **A creature seen once** gets a one-line ledger entry in the sealed file (name, page, power, the one feature that matters), so it isn't refetched.
5. **Cheap outputs.**
   - Fiction runs 80–220 words.
   - At most one mechanics line.
   - A one-line status line replaces the full status block. The full STATE appears only at a SAVE.
   - At most one question.
6. **Refresh cadence beats drift.**
   - Re-read the hot card at every DT end, scene end, village day change, or 15 exchanges.
   - When a menu, a status dump or a recap slips out, re-read the hot card before the next reply.
7. **Short chats, clean cuts.**
   - SAVE at the start of the next pressure (chassis §9.4), roughly every 40–60 exchanges, or when compliance slips twice.
   - The SAVE is small, because the crow lives in the Ledger: the STATE pointer (or pasted block), the Live Prompt, and the sealed ledger's new lines.
8. **Sealed ledger discipline.**
   - The ledger is append-only, one line per change, written at scene boundaries only.
   - No prose. It records Threat ticks (`Threat <name> d/n: <what>`, `tick held (cap)`), clock days, NPC moves and rulings.
9. **Account memory is not game memory.** Campaign state goes in project files and the Ledger, never in Claude's personal memory. Personal memory holds only Seb's stable preferences.

---

## 16 · Wilderness supplement [IMPORTED from *Into the Wyrd and Wild* (Feral Indie Studio and Wet Ink Games, 2021), paraphrased, private use; every Crows conversion is HOUSE]

All content is data in `engine/tables_wyrd.json` (33 tables; `engine.py tables wyrd`). The Ref rolls it with the engine and pastes the line. It invents no numbers: where an entry has a number, it is printed in the entry or rolled.

- **Calendar and moon.** `engine.py day +N` advances the campaign day (travel adds 1 itself). `engine.py moon` prints the phase and an **EN adjustment** for **overland travel and wilderness rest checks only** (not dungeon DT checks): new +2, crescent +1, half 0, gibbous −1, full −2; a Blood Moon adds −2 and doubles numbers encountered. Apply it with `travel … --moon`. A 30-day month is three village cycles. Special moons (`table wyrd_moon_special`, `moon special NAME`) are the Ref's call and are sealed until they rise. [HOUSE mapping of W&W p.20–21]
- **Hunts.** When the crow tracks a named creature (R26 Track Specific Creature), `engine.py hunt new NAME MARKS`, then `hunt day NAME` for each travel day spent on it (add `--adv` after a tier 3 on the Tracker's test). Marks are a clock: tracking result, then a major or minor setback, or a boon, from the hunt tables, scaled to Crows resources. When the marks are reached the quarry is found and the party plans the fight. [IMPORTED, W&W p.16–17, adapted]
- **Hazards.** For an unkeyed wilderness hazard, `table wyrd_hazards`. Each entry names the crow's RR stat and results at tier 1 and 2 (1d6 to 2d6 damage; AD and Stamina as printed, R12). [HOUSE conversion]
- **Diseases.** Crows prints no disease rule. House procedure: at the end of each rest the infected crow makes a Strength RR; **tier 3** counts toward the cure (the entry says how many in a row), **tier 1** worsens the disease one step as the Ref rules and logs. `table wyrd_diseases`. [HOUSE]
- **Harvest.** After a kill, the Harvest rest activity (R15) may yield `table wyrd_goods_uncommon` or `_rare` for texture. Prices and crafting inputs come from C36 and C42, never from W&W. [IMPORTED flavour, W&W p.18–19]
- **Madness and the Call of the Wild.** `wyrd_madness_quirk/_mad/_deep` and `wyrd_call_of_the_wild` are texture for a crow or NPC at a cruelty level (R27) or after a legendary encounter. They add flavour and the Ref rules any effect and logs it. They do **not** replace the Miasma Effects table. [HOUSE]
- **Places and paths.** `wyrd_locations` (100 POIs), `wyrd_trails`, `wyrd_body_search`, `wyrd_flora`, `wyrd_lost_return` (where a lost party ends up), and `wyrd_dungeon_prefix`/`_suffix`/`_danger`/`_secret` for improvised wilderness dungeons.
- **Patrons and lords.** `wyrd_task_minor/_major/_grand` (patron bargains) and `wyrd_lord_*` (a Lord of the Broken Court).
- **Not imported.** Rule of Gold, Exhaustion and Surviving the Night (gold is XP in Crows; rations, the starvation wound and Make Camp already cover them); the W&W bestiary (needs Crows stat blocks; use §4's "build from the nearest block and log"); Magic of the Wyrd; the wilderness-dungeon hex generator.

## 17 · Play protocol (v1.2, from Pilot 01) [HOUSE]

This section wins over §1, §3 and §9 where they differ on who rolls and on reply shape. Everything else stands.

**17.1 Dice (recorded default, reopens by player say-so).** The Ref runs the crow's rolls through the Ledger, in the open, in resolution order, and pastes the Ledger line. The player may at any time say "I roll", paste their own dice, or use `ledger pool N` to pre-roll a stack the Ledger then consumes in order. A mistaken roll is undone with `ledger void <reason>` and the correction is stated in one clause. The Ref never rolls a crow's action before initiative for that round is known. The engine still owns every Ref-side number.

**17.2 One round, one reply.** In a fight, one reply resolves the crow's turn and then every foe's turn in `init` order. It ends on the **turn prompt** (17.3), not on "what do you do?". The mechanics block is one compact line per actor action, then one `Trail:` line if useful. No out-of-game footers.

**17.3 Maneuvers are offered.** A crow's turn is an action and a maneuver, or two maneuvers (R18). When the player declares an action, the Ref checks for the maneuver before foes act: if the crow has not used a maneuver, the Ref ends the crow's half with one short line, `Maneuver?`, naming nothing else. The player answers with a maneuver (move, draw, shove, aim, take cover, use an item, speak), or `none`. If the player has said "action only", the Ref stops asking until told. A crit grants an extra action (R19), stated as such. Foes also use their maneuver (usually to move or reposition) and the Ref says so in the round.

**17.4 Clever plans.** If the player's plan removes the uncertainty, no roll. If some uncertainty remains, the Ref names it ("the rope holds, the knot is the question") and rolls only that.

**17.5 Fiction follows the card.** A move taken from the §9c card must be consistent with what was just narrated. If it is not, narrate a different move or reword the fiction before the move lands. A card move never overwrites a Ledger value. Relish violence and similar rules that touch a counter write to the Ledger by command, not by prose.

**17.6 The crow's inside.** The Ref describes only what the body does and what the senses give, plus printed compulsions. It does not write the crow's thoughts, feelings or decisions.

**17.7 Reach and place.** Use `pos` for scene positions. In an improvised area, the Ref sets distances once with `pos` and does not reuse guessed numbers. Sight lines and reach use `dist` and `los`.

**17.8 Secrets.** The `--why` of any engine call is player-visible; hidden numbers go in `--note`. The SAVE is two files: `SAVE_open.md` (player-visible state, live prompt, Ledger blob) and `SAVE_sealed.md` (Ref only). Never paste the sealed file into the open one.

**17.9 Telegraph.** Before the first blow from a creature that can kill the crow in two hits, one beat of disposition or tell (F16, F22, F31) appears in the fiction. Lethality is unchanged.

**17.10 Time.** Partial-day travel uses `travel --part`. Night travel is allowed; each night leg is a HOUSE EN +1 and a bane on sight tests unless the crow has light. The Ref states the ruling once and then applies it.

**17.11 Monster from Nearby (F6) vs Any Monster Encounter (F1).** F6 is for a specific local source, F1 for the generic table. Use one, say which, and never both for the same check.

**17.12 Session zero places the pack.** Before play, `ledger place` every item into H1-H2, B1-B4, P1-P10. A wound goes into an empty slot first, then displaces an item.

**17.13 A voided roll stays voided.** The Ref rolls again and states it. It does not keep the first result.

**17.14 Miasma Marks (slow-burn Fallout, HOUSE).** Adapted from Liminal Horror's Fallout (private use). The Ledger counts it; nobody tracks it by hand. Each rest outside the Miasma that clears cruelty above 0 adds 1 **taint** (a crow that comes home clean adds none). At taint 3 the Ledger prints `MARK DUE`. The Ref rolls `engine table miasma_mark` (d12), says the result in the fiction, and runs `ledger mark add <name>`. The mark fills one pack slot for good, counts toward death like a wound, cannot hold a wound or item, and resets taint to 0. Marks are one line each, mostly a boon with a cost, and the Hunted and Visions results seed a sealed Threat. A mark leaves only by a ritual or a ruling (`mark rm`). A mark never replaces the Miasma Effects table (R28).
