# TBE development roadmap

Maturity-based, not feature-based. Set by Seb, 2026-09-03. Each phase answers a
different question, and each has a definition of done that is a *state of the
system*, not a list of shipped items:

| Phase | Question | Done when |
|---|---|---|
| 0 Foundation | Can I work on it safely? | The system loads and I know what is broken |
| 1 MVP | Does the game work? | Every advertised core feature either works or is explicitly marked incomplete |
| 2 QoL | Is it pleasant to use? | A short session runs without opening the console or hand-fixing actor data |
| 3 Rule consolidation | Does it have a coherent rules architecture? | "Where is the rule for X?" has one answer |
| 4 Content completion | Is the actual game in there? | A GM can run the intended experience from the packaged content |
| 5 Play experience | Does it work as a *system*, not a digital rulebook? | A player can use it without knowing how it was built |
| 6 Hardening | Can I trust it not to regress? | A bug fixed once cannot silently return |
| 7 Release | Can someone else install and play it? | A stranger installs the zip and plays |
| 8 Post-release | | Every new issue is classified and fed through the same workflow |

**Feedback runs backwards.** Playtesting that finds bad UX goes back to QoL;
two mechanics that contradict each other go back to consolidation; missing
equipment goes back to content. This is not a waterfall and no phase has to be
finished before the next one starts.

**Architecture is a constraint, not a phase.** The ownership discipline in
CLAUDE.md applies to every change in every phase. Phase 3 is the point where
what has been done opportunistically gets consolidated — it is not permission
to delay a fix until some later refactor.

---

## Where the project actually is (2026-09-04, v0.28.0)

- **Phase 0 — done.**
- **Phase 1 — done.** All three MVP tiers shipped: Tier 1 in v0.19.0, Tier 0 in
  v0.21.0, Tier 2 in v0.22.0. The bar was Seb's honesty bar, not completeness:
  nothing left claims to do something it does not.
- **Phase 2 — partial.** The Wizard, Finish Character and the sheets are
  usable; `BACKLOG.md`'s "Sheet UX" and "Post-creation menu" sections are the
  open list.
- **Phase 3 — in progress, ledger-driven.** `docs/ownership.md` has thirteen
  capabilities with a named owner; two reported duplications were checked and
  found not to be defects. See the amendment below on what "one owner" can
  mean here.
- **Phase 4 — done.** Five batches: v0.23.0 the Weave Magic riders, v0.24.0
  Ch.13 Intrigue, v0.25.0 Rituals/Summoning/Blood Magic/True Names, v0.26.0
  Enchantments and Alchemy (finishing Ch.14), v0.27.0 Divine Magic (Ch.15).
  **Every row of the content matrix is filled.** The phase's own definition of
  done — "a GM can run the intended experience from the packaged content" — is
  met on content; whether it is met on *experience* is Phase 5's question, and
  that has never been asked.
- **Phase 5 — one pass done, and it paid.** v0.28.0 was the first named pass:
  a session played end to end through the tools (build, travel, encounter,
  fight, status, investigation, prayer, advancement) plus an audit against
  CLAUDE.md's "what correct means" list. Five defects, none of which any of the
  fourteen check scripts could see, because in every case the code did exactly
  what the code says. The sharpest — any character could be permanently Cast
  Out by opening TBE: Miracle once — had been shippable since v0.27.0 and was
  invisible to 58 divine-magic assertions. **The lesson to keep: a mechanical
  suite cannot find a defect whose symptom is "a player did a reasonable thing
  and the system punished them for it."** One pass is not the phase; the phase
  asks whether it works as a system, and that question gets re-asked after
  every content batch from here.
- **Phase 6 — unusually far ahead.** Fifteen check scripts, well over 650
  assertions between them, several with mutation guards that break the thing
  under test and require the check to fail. `phase5_check.mjs` is the newest
  and the most pointed: every assertion in it exists because a played session
  found something the other fourteen were happy with.
- **Phase 7 — first pass done 2026-09-27 (v0.48.0).** The release zip was
  built, unpacked fresh and audited as an artifact; `boot_check.mjs` now
  starts the system against a stand-in Foundry and can boot an unpacked zip.
  Still open, and none of it is code: publishing rights for the book text a
  release carries, a public home for the manifest, and one install into a
  clean Foundry by somebody who has never seen the system. BACKLOG.md,
  "Phase 7, first pass", has the list.

**The honest read, updated 2026-09-04 (v0.28.0).** Phase 5's first pass is
done and Phase 7 is now the only phase never started. The five defects it
found were all in shipped, tested, "verified" subsystems, and two of them were
data — a page number and a truncated name that a round-trip check cannot catch
by construction. So the Verified column means less than it looked like it did:
verifying that a string is in the book does not verify that the string is the
table. Both extractors now refuse the specific shapes involved. **The next
sharpest gap is Phase 7: nothing has ever installed the zip as a stranger
would.**

**The read as of 2026-09-03, kept for the record.** When this was written the project was
far ahead on Hardening and behind on Content: ten check scripts guarding a
system missing three chapters. Five batches later (v0.23.0-v0.27.0) the
inversion is gone — every chapter in the matrix is built. What that leaves
exposed is the next imbalance, and it is now the sharpest one in the project:
**Phase 5 (play experience) has never had a named pass, and Phase 7 has never
been started at all.** Nothing has ever tested the shipped zip the way a
stranger installing it would, and no one has sat down and played a session
through the tools as a player rather than as their author. Every remaining
risk lives in those two gaps, not in the content.

---

## Content matrix

Filled from the live tree, not aspirationally. "Verified" is a column the
original framework did not have and this project needs — see amendment 2.

| System | Data | Rule | UI | Automation | Tested | Verified |
|---|---|---|---|---|---|---|
| Skills | ✓ 37, catalogued | ✓ | ✓ | ✓ | ✓ | ✓ Ch.3 |
| Character creation | ✓ | ✓ | ✓ 15-step wizard | ✓ | ✓ | ✓ Ch.7 |
| Talents | ✓ 149 | ✓ | ✓ | ✓ ranks, caps, effects | ✓ | ✓ self-checking extractor since 2026-08-28 (this row was wrong, not the code) |
| Combat | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ Ch.10 |
| Wounds | ✓ | ✓ | ✓ | ✓ incl. fatigue wounds | ✓ | ✓ Ch.11 |
| Advancement | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ Ch.8 |
| Social | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ Ch.13 (encounters only) |
| Travel | ✓ | ✓ | ✓ | ✓ Fatigue Table, rations | ✓ | ✓ Ch.12 |
| Equipment | ✓ 38 weapons, 4 shields, 8 armor | ✓ | ✓ | ✓ incl. Weapon Readiness | ✓ | ✓ Ch.9 |
| Weave Magic | ✓ | ✓ core | ✓ | ✓ casting, Fraying, reactions | ✓ 109 checks | ✓ Ch.14 |
| — Rituals, Summoning, Blood Magic, True Names (+ Pacts, Magic Circles, grimoires) | ✓ | ✓ | ✓ TBE: Ritual, TBE: Summoning | ✓ full procedures | ✓ 85 checks | ✓ Ch.14 p.312-321 |
| — Enchantments, Alchemy (+ Weave Reagents) | ✓ | ✓ | ✓ TBE: Enchant, TBE: Use Enchanted Item | ✓ tiers, reagents, aids, unstable items | ✓ 69 checks | ✓ Ch.14 p.322-326 |
| Divine Magic | ✓ 20 Domains, 218 miracles | ✓ | ✓ TBE: Miracle, TBE: Pious Act + sheet block | ✓ Piety cost, symbol, thresholds, Cast Out | ✓ 58 checks | ✓ Ch.15 |
| Intrigue: investigations, chases | ✓ | ✓ | ✓ (Extended Roll + new TBE: Chase) | ✓ Timer Die, Tolerance, sudden death | ✓ 51 checks | ✓ Ch.13 p.267-270 |
| Bestiary | ✓ 56 creatures | ✓ | ✓ | ✓ generation, Ferocity | ✓ | ✓ Ch.18 |
| Oracle / solo tools | ✓ 6 tables | ✓ | ✓ | ✓ | ✓ | n/a original |
| Funnel | ✓ 50 trades | ✓ | ✓ | ✓ | ✓ 47 checks | n/a original |

Legend: ✓ done · ~ partial · ✗ absent · — not applicable yet.

---

## Two amendments to the framework

### 1. "One owner" here sometimes means "one owner and a mirror that cannot drift"

The framework's Phase 3 sketches `module/rules/*.mjs` consumed by the macros.
That shape is not reachable: **Foundry macros cannot import.** They are flat
scripts evaluated from a compendium, and the system module and the macro bundle
are separate code that never share a scope.

Three patterns actually work here, in descending order of preference:

1. **A runtime global.** The system sets `CONFIG.TBE.*` at init; macros read it
   at call time. Used for `CONFIG.TBE.rankCap()` (Talent rank caps) and
   `CONFIG.TBE.strandCap()`. This is the real version of "one owner".
2. **`_lib.js` as the macro bundle's own single owner.** Every macro is
   concatenated with it, so a rule that only macros need lives there once:
   `TBE.SKILL_GROUPS`, `TBE.applyAbilityScore()`, `TBE.addFatigue()`.
3. **A mirror with an enforced equality check.** Where both bundles genuinely
   need the same table and neither can read the other's (`TBE.STATUSES`), the
   duplicate stays but a check script asserts the two are identical field for
   field, so drift fails the build instead of appearing at the table.

So Phase 3's exit condition holds as written — "where is the rule for X" gets
one answer — but the answer is a global or a checked mirror, not always a module.

### 2. Content completion needs a Verified column, separate from Tested

Tested means *the code does what the code says*. Verified means *the data says
what the book says*. They fail independently, and this project has the scar to
prove it: the NPC Traits table was present, shipped, and rendered correctly for
months while carrying 21 of the book's 50 rows, because the extractor mis-read
a column and the build filtered the damage out. Every mechanical test passed
throughout.

A subsystem is not content-complete because a table exists in the pack. It is
content-complete when the table is the book's table. In practice that means an
extractor with a self-check (`parse_magic.py`, `parse_life_events.py`,
`parse_npc_traits.py`) rather than a hand-edited JSON — and the standing rule
from CLAUDE.md that a verification step is not done until you have broken the
thing it verifies and watched it fail.

Every row in that column is now filled, not `~`. The one row that named
`parse_talents.py` as the exception was wrong when it was written on
2026-09-03 — the extractor had already carried a full self-check since
2026-08-28. Caught while scoping the v0.24.0 batch, corrected here rather
than re-verifying something already verified. The next thing to check
against reality isn't a row in this matrix; it's this matrix itself.

### 3. A note on ordering, specific to this codebase

QoL (Phase 2) means touching every sheet and dialog. Doing that on top of
unconsolidated rules multiplies the copies rather than the polish — the
encumbrance-prefill bug was exactly this shape: a promise made in four dialogs
against a helper that never delivered it. So for this project, treat
consolidation as a **gate on each QoL item** rather than a phase after them:
before making a rule pleasant to operate, give it one owner. That is what the
ownership discipline already says; this just names when it bites hardest.
