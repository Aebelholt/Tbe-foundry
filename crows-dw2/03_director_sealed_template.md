# 03_director_sealed.md (TEMPLATE; Ref only, never shown to the player)

Copy this file to `03_director_sealed.md` for a new campaign. The Ref reads it at load (layer §12), edits only the **Threat** lines and the **ledger** at scene boundaries (§15.8), and never reveals anything marked sealed. The Threat format is the layer's §5. The three Threats below are **seeds** from *Into the Wyrd and Wild* (factions, p.136–151), rewritten for Crows. Start with one or two live; keep the rest dormant.

## Cold open (default; replace if you like)
A crow comes down the cellar stair of a ruined chapel at the edge of a Miasma-ridden hex, torch lit (UD 1), DT 1 just begun, the Greed Bonus clock running (R13). The first player-facing paragraph is fiction (chassis §9.1). Open on the stair, the smell, the first room. Roll nothing for the player; their only session-zero rolls are background (2d6) and 3d6 gc (layer §6).

## Village (blank until discovered; layer §2.3)
Printed facts: Prosperity 0; blacksmith, crypt, general store, inn, temple at level 1; the village sits in an enclosed ruin that keeps out the Miasma. Blank: name, ruin, stewards, the sixth institution.
- Stewards, when first visited: Description · Drive · Resources · Resist · Conditions and Escalations (CGR p.3 NPC format) · one instinct line.

## Live Threats (1 to 3; layer §5)
Each tick comes from the three clocks only (outdoor Miasma rest, a cycle with no Prosperity rise, a natural 10 on an encounter check). Cap 2 per session. Write each tick into the fiction and the ledger.

### The Night Summons (regional, 4 Developments) [LIVE at start]
- **Description:** a lady of the woods marks those who slighted the wilds and sends a three-night summons. Ignoring it is said to mean certain doom. (W&W p.138)
- **Goal:** the village pays tribute and keeps its numbers in check, or is made an example.
- **Assets:** the curse-stitched (sworn subjects, marked with a thin silver stitch that glows like moonlight); the three signs (dream, wreath, song); the Miasma; a Lord of the Broken Court (roll `table wyrd_lord_title`, `_name`, `_claim`, `_desc`, `_notes`).
- **Developments:**
  1. A villager dreams of a meeting place.
  2. A wreath of spider silk and twigs is found on a door.
  3. A song calls a named villager out into the night.
  4. The summoned return stitched, changed, and serving. The village is asked for tribute.
- **Reactions:** a curse-stitched hunter ambushes the crow on the road; a steward is summoned; a lord of the court arrives to collect.
- **Secrets:** being mended is both a gift and a curse; the lady's power fades beyond the trees (W&W p.138). *Speculative:* the village's enclosed ruin may sit outside her reach, which is why she asks and does not take.

### The Changeling Tithe (regional, 5 Developments) [LIVE at start or dormant]
- **Description:** Wild Elves steal sleeping children from the edge of civilisation and leave their own feral young in the cradles. (W&W p.148–151)
- **Goal:** the village's children become theirs, and the village is left raising monsters.
- **Assets:** nets of thick spider silk; hooked bone-and-steel weapons; cowls of wrapped skin-leather; Wild Elf treasures (`table` is not available: the Ref invents one and logs it); a fortress in the Wilds.
- **Developments:**
  1. A sleeping infant is found swapped, the replacement a clawed, needle-toothed goblin-like child.
  2. A traveller on the road with a child vanishes.
  3. A raid at night, in and out in minutes, under a full moon (`moon`).
  4. A Wild Elf envoy offers a bargain. They respond to diplomacy that suits their ambition.
  5. At the next full moon the village is raided wholesale.
- **Reactions:** those who pursue stolen children are hunted like dogs in the dark.
- **Secrets:** the Wild Elves cannot breed true any more; the mortal children are how they renew themselves. (W&W p.149)

### The Sorrow-Hunt (regional, 6 Developments) [DORMANT]
- **Wake condition (*speculative, HOUSE*):** when the village reaches Prosperity 3, it has something worth razing.
- **Description:** The Ruin, a demigod of purposeless violence, retreats, plots, and gathers the most violent beings (the Sorrowkings). At a Blood Moon he rallies an army of Ravagers and monsters that sweeps the Wilds and spills into the civilised world. (W&W p.144–147)
- **Goal:** raze the village and its neighbours in a single night.
- **Assets:** the Ravager hordes; the Sorrowkings; the Brairheart (the artifact that is his power); the Blood Moon.
- **Developments:**
  1. The roads go quiet and Ravagers are listless. This is not peace.
  2. The most violent beings leave their usual haunts.
  3. Word of a hunt passes in whispers among Ravagers.
  4. A Blood Moon rises (`moon special Blood Moon`).
  5. The sky goes crimson and rains blood. The Sorrow-Hunt begins: outdoors, make an encounter check every hour, not every DT.
  6. The hunt reaches the village.
- **Reactions:** Ravager scouts; trophies hung on the road; a Sorrowking demands a duel.
- **Secrets (rumours, unverified in the book):** burn the Brairheart over Canticle Holly; silver hurts him and his followers; his mortal heart still has sway; the Lady of Broken Branches hates him. (W&W p.146)

## A patron (optional): the Children of Ei-Criomoran
A fragmented demigod whose countless small animal bodies speak one word each. Self-preserving, cryptic, sympathetic to the weak, hates gods and their followers. Bargains are plain: a task of equal worth first (`table wyrd_task_minor`, `_major`, `_grand`). Never Faustian. Anyone who harms them is marked and never addressed again. (W&W p.140–143)

## Hunts (optional)
When the crow tracks a named creature (R26, Track Specific Creature): `engine.py hunt new <name> <marks>`; each travel day on the hunt, `hunt day <name>` (add `--adv` after a tier 3 on the Tracker's test). Marks: mundane 1–2, uncommon 3–9, rare 10–20, mythic 24+ (W&W p.16).

## Ledger (append-only, one line per change, no prose; layer §15.8)
```
Threat <name> d/n: <what happened>
tick held (cap)
<NPC move or ruling>
```
