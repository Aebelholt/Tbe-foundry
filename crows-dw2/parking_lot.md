# Parking lot (ideas, reflections, decisions)

**Standing rule (user, 2026-10-07):** always make notes. Every idea gets a date, tags and a short reflection, even when it is not built, and even if it may belong to a different system. Append; do not delete. Newest at the bottom.

Tag key: `#crows` `#nimble` `#stonetop-arcana` `#fallout` `#marks` `#boons` `#mda` `#lean` `#tokens` `#ledger` `#sealed` `#village` `#decision` `#parked` `#built` `#untested`

---

## 2026-10-07 · Miasma Marks (slow-burn Fallout) · `#crows #fallout #marks #built #untested`
- **What:** Ledger counts taint (+1 per rest outside the Miasma that clears cruelty above 0). At 3, `MARK DUE`: roll `miasma_mark` (d12), `ledger mark add`. A mark fills a pack slot for good and counts toward death. See layer §17.14.
- **Source:** Liminal Horror Fallout (Generic list, p.39-41, paraphrased, private use). Liminal triggers on a failed Stress save; the "return with Miasma" trigger is mine.
- **Why:** no Stress track, no Ref judgment, no hand tracking. Permanent change through the dungeon.
- **Reflection:** the thresholds (3 returns) and the 12 effects are guesses. Marks make the crow die sooner by design, so lethality needs a test. Built before any play of v1.2, which was early.

## 2026-10-07 · Per-dungeon mark tables, escalating marks · `#crows #fallout #marks #sealed #parked`
- **What:** each dungeon or Threat carries a six-line mark table in the sealed file (roll there first, generic table as fallback). A repeat roll advances a mark already held instead of taking a new slot (escalation: stops needing air, then an hour without breathing, then no heartbeat).
- **Reflection:** the best content idea; text only. Needs no engine change beyond letting `mark add` on a known name step it up. Parked for lean reasons.

## 2026-10-07 · Ruin Boons, after Stonetop arcana · `#stonetop-arcana #boons #village #crows #nimble #parked`
- **Idea:** a boon is a lead from a ruin: card with requirements to unlock (cycle days at the Bookseller C51, a material, a Mind RR "you risk") and a power. Each boon carries its own consequence list; the player picks one to mark on a bad result. In Crows the consequences become marks in pack slots.
- **Stonetop structure (Book I, arcana, p.59-60ff):** minor arcana = card with front (what you see + unlock requirements) and back (the move). Major arcana = benefit up front, mysteries to unlock, a limited consequence list you mark by choice (each once; no un-marking). Find them by Know Things, exploring dangerous places, or putting the word out. All rights reserved: take the structure, write new cards.
- **User line:** "Legends tell of men who sought out ruin for the boons." The whole game in one line.
- **Example:** Saltblood (drowned barrow). Unlock: 2 cycle days, a salt ingot, Mind RR (miss costs a wound). Power: once per DT after a wound, harden blood into a weapon. Consequences: grave breath (NPC reactions), cannot cross running water, something below knows your name (seeds a Threat).
- **Tactical choice (user, good):** take the lead (no value now) or the gem (gc, Prosperity). Both fill a pack slot, and slots are the death clock. Add: a lead can be lost (a wound in its slot, fire, water) and research costs cycle days that compete with trade. `[HOUSE]`
- **Reflection:** this is scope creep for Crows right now (touches village cycle, pack slots, sealed template, before anything is tested). Decision: parked. **User's thought: it may fit a Nimble game better** (Stonetop arcana married to Nimble). I have not seen the Nimble rules `[UNSOURCED]`; the hypothesis is that Nimble's lighter core leaves room for a card-driven unlock-and-consequence layer that Crows' slot economy already uses up. Revisit when a Nimble game exists.

## 2026-10-07 · Ref-load principle · `#lean #mda #tokens #decision`
- **Zoom-out (MDA):** aesthetics wanted are dread, earned risk, own luck, brisk phone play. Pilot 01 failures came from the Ref juggling state and judgment, not from missing content.
- **Chain (cheap to far):** rules text; tools own state; turn-sized commands; keyed content up front; app runs the loop with LLM as optional narrator; optional narrator over a standalone game. User likes rungs 4 and 5, tabled.
- **Decision:** think lean. Freeze features. Rerun the pilot with v1.2 and Marks when tokens allow, and add a layer only for a gap the play shows.
- **Reflection:** every layer must answer "does this add a Ref decision?" Counters the Ledger owns are cheap; judgment calls are expensive.

## 2026-10-07 · Other parked ideas · `#parked`
- Crit as a source of a boon-only mark (a ruling, not wired). `#fallout #crows`
- Doom (natural 2-3) in the Miasma as a second mark trigger. Offered; the user chose the slow burn. `#marks`
- Mundane vs Wyrd Fallout categories (limp, scar, debt vs ghost sight). Rejected for now: wounds in slots already cover the mundane. `#fallout`
- Rungs 4 and 5 above: pre-keyed dungeon plus an app-run loop with a shared database. `#tokens #sealed #ledger`
- Bestiary conversion, hex generator for the wilderness, Magic of the Wyrd. `#crows`

## 2026-10-07 · Pilot 02 results (Cowork, second crow, ~25 exchanges) · `#crows #untested #decision #lean`
- **Covered:** 1 fight (2 rounds), 4 encounter checks, a Miasma rest, a Threat tick (Night Summons 1/4), village arrival, Connection. Sealed rolls stayed sealed; no pop-ups.
- **Failed (checklist verdict: abort and fix):** an invented `Ref:` line; placeholder numbers (armor AD 5, light 2/2, jaunt range) and a druid reskinned from F23 because the card text was missing; a backlash cleared by an expertise (ruling); distance by `pos` with no `dist`/`los` (no map); an authored crow reflex; Ref rolled all dice, so the pasted-Ledger-lines item could not be tested; books cast from belt and pack slots all session; no `state.txt` update.
- **Fixes made (v1.2 text and Ledger):** §17.15 session zero never rolls; §17.16 hands rule (R10 Equipped Items) plus Ledger `cast` and `attack` now refuse items not in H1/H2; §17.17 no invented `Ref:` lines; §17.18 rulings logged as `RULING:`; §17.10 night wording (lower EN = more encounters, `--en-adj -1`); checklist adds a v1.2 section and points to the SAVE files.
- **Card gap:** Cowork lacked cards.json. `tools/extract_cards.py` then `engine card jaunt|light|take shape` gives those rows. Cowork needs the card PDFs in the project.
- **Misreads (P2-1 to P2-3):** the Ref answered the question it had asked instead of the sentence it got. Fix is §17.15.
- **Open:** the thunder backlash cleared by an expertise has no printed rule `[UNSOURCED]`; rations show 6 in the slot item and 5 in the counter (cosmetic mismatch to fix in `place`); worn armor takes a backpack slot.
- **Idea, needs Seb's go: card-deck interface.** An artifact with one card per spellbook, weapon and item (rank, UD, T2/T3, range, text) generated from the Ledger plus the card text; shows hands, belt, pack. Gives the player the sheet he lacks and removes Ref recall of item numbers. This is the rung 5 idea (app runs the loop) in its smallest form. `#parked #tokens #ledger`
- **Reflection:** the pilot did what a pilot is for. Failures were missing inputs (cards) and rules the Ref had no way to enforce, not the loop. Where the Ledger can refuse an error, it should (hands rule); where only text can, the failure repeats.

## 2026-10-08 · Narrative-only vs dense mechanics for an LLM Ref (Realis ashcan) · `#mda #lean #tokens #crows #nimble #parked`
- **Source:** Realis, Ashcan Edition (Austin Walker, Possible Worlds Games, 2025, all rights reserved; paraphrase only). No dice. A Sentence is a declarative "I always ..." statement with a rank (+0 to +3). When two Sentences conflict the higher rank prevails; on a tie the Counteractor wins; the loser's Sentence is Countered and unusable for the scene. After a Class Sentence is Countered three times its owner adds a limiting condition and raises its rank by 1 (Realization); a +3 Sentence Countered three times is Retired. Moon Sentences give places and peoples their own. Tokens, Bonds, Dreams exist.
- **Question (user):** would a purely narrative, language-based system help the LLM more than a dense mechanical one?
- **Reflection (hypothesis, untested):** our failures were arithmetic, state keeping, fairness under hidden numbers and judgment calls. A rank comparison removes arithmetic and nearly all state (integers plus a per-scene countered flag), so it suits an LLM. What it does not remove is the judgment "does this Sentence apply here", where an LLM tends to say yes; the tie goes to the Counter rule is a useful brake. The cost is aesthetic: no dice means no own-luck tension, and the user has said the roll in hand matters to him. Realis is about transformation, not attrition, so it does not carry Crows' pack-slot dread.
- **Useful transfer:** Realization is an escalation engine (failure makes a power narrower and stronger) and maps onto marks and arcana consequences. `#fallout #marks #stonetop-arcana`
- **Option:** a Sentence-style layer for non-combat and social beats only (replaces Pull Strings/Sense Motive) while Crows keeps dice for combat, travel and attrition. Needs a test; not started.
- **Decision:** none. Not tested. Revisit with the Nimble game.
