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
