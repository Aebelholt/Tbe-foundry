## Turn 1
[PLAYER] PLAYER [1/4]: It is dusk on the road home. I make camp off the road in the open and rest through the night, eating a ration.
(roll on request: Miasma RR (Mind) after the rest, only if the Ref asks)
[TOOLS]
$ python3 ledger.py status
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py enc --en 9 --why "rest encounter check"
Ref: encounter d10=10 vs EN 9 → ENCOUNTER NOW · rest encounter check
$ python3 engine/engine.py table travel_encounters --why "rest encounter, nat 10"
Ref: Travel Encounters (F1) d100 [100]=100 → Wild Animal (see F8) · rest encounter, nat 10
$ python3 engine/engine.py table animal_grassland --why "open country wild animal"
Ref: Grassland Animal Encounters (F10) d100 [51]=51 → 2d6 elephants · then: wild_animal_reaction · open country wild animal
$ python3 engine/engine.py roll 2d6 --why "number of elephants"
Ref: 2d6 [5,2]=7 · number of elephants
$ python3 engine/engine.py table wild_animal_reaction --why "elephants reaction"
Ref: Wild Animal Reaction (F11–12) d100 [41]=41 → Hungry: Hungry animals approach when the PCs are eating, drawn by the smell of food. If given at least 1 ration’s worth of food, the animal becomes friendly. If the PCs don’t share their food, the animal attacks, attempting to get some food and run off with it. · elephants reaction
[REF]
Dusk bleeds out of the sky and the Miasma thickens at the edges of the firelight, a low grey nap over the grass. Mara beds down in a shallow dip well off the road, pulls a ration from her pack and bites into it. The salt-meat smell rolls out across the open country.

Sometime after the first watch the grass begins to shake. Something heavy is walking, many somethings, slow and unhurried. Shapes rise out of the haze, tall as a hay-cart, grey hides gone ashen in the Miasma. Elephants, seven of them, ears spread, trunks lifted and swinging toward the smell of her food. The nearest has stopped an arm's length from the edge of her camp. Its trunk reaches out and hovers over the half-eaten ration in her hand, damp breath on her knuckles.

Ref: encounter d10=10 vs EN 9 → ENCOUNTER NOW · rest encounter check | Ref: Travel Encounters (F1) d100 [100]=100 → Wild Animal (see F8) | Ref: Grassland Animal Encounters (F10) d100 [51]=51 → 2d6 elephants | Ref: 2d6 [5,2]=7 | Ref: Wild Animal Reaction (F11–12) d100 [41]=41 → Hungry

Open country, night camp · travel day (village a day off) · Stamina 17 · wounds 0/10 · torch 1UD, low fire · the lead elephant's trunk is hovering over the ration in your hand.

## Turn 2
[PLAYER] PLAYER [2/4]: I walk in to the village at dawn and report to the steward.
[TOOLS]
$ python3 ledger.py test M --e 0 --b 0 --why "Miasma RR after outdoor rest"
TEST Miasma RR after outdoor rest · M+0 · - · [10,6]=16 → T2
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py table miasma_effects --why peek
Ref: Miasma Effects (R28) d10 [2]=2 → 1st Effect: ... (stray roll, not used: the Miasma RR was T2, so no cruelty and no effect roll; ignored)
[REF]
The elephant's trunk finds the last scrap of ration, plucks it from Mara's fingers with a wet, delicate snuffle, and withdraws. The herd, satisfied with the smell if not the meal, wheels away through the grey grass and is gone, the ground still trembling after them. The fire burns low. Mara sleeps her four hours, uneasy, with the Miasma pressing cold against the tent of her blanket.

By dawn her head is thick but her own. On the road home she passes a farm cart slewed into the ditch, one wheel spinning slow in the wind, the horse gone and the traces cut. Someone has chalked a row of neat tally strokes on the tailboard.

The village wall rises out of the haze by morning. The gate-ward waves her through, and in the general store a woman with ink on her cuffs looks up from a ledger and sets down her pen.

"Back in one piece. That makes you the first this week," says Orla Venn, the steward. "Well. Report."

Roll: Miasma RR · M · TEST Miasma RR after outdoor rest · M+0 · - · [10,6]=16 → T2

Village (unnamed) · cycle day 1 of 10 · Stamina 17 · wounds 0/10 · torch 1UD · Orla Venn is waiting on your report.

## Turn 3
[PLAYER] PLAYER [3/4]: I spend the ten days quietly resting and repairing, and do not found or upgrade any institution and spend nothing at merchants.
[TOOLS]
$ python3 engine/engine.py cycle 0
Ref: cycle end · Prosperity 0 → -1 (nothing raised it, C45) · set it in the Ledger
Ref: next Village Event rolled: d10-1 [3]=2 · sealed until it lands
SEALED: (withheld from the reply; written to sealed_ledger.md)
[REF]
Orla takes the report without looking up from her ledger, and nods once at each part. "Good. Go and sleep."

Ten days go by in small things. Mara sleeps in her own bed, eats at the inn's long table, sits on her step with a whetstone and a roll of waxed thread, mending what the road ate. Nobody asks her for anything and she asks nothing of anyone. By the ninth day the village has the thin, held-breath look of a place that is only getting by: a shutter hanging loose on the cooper's, a bench outside the smithy with no one on it, the well-rope frayed and not yet replaced.

On the tenth evening the gate-ward comes down the lane at a half run, then slows when he sees how quiet it is. "Northern road's empty again," he says, to no one in particular. "Three farms haven't sent in their carts. Nobody's come in from that side since you did."

Ref: cycle end · Prosperity 0 → -1 (nothing raised it, C45) · set it in the Ledger

Village (unnamed) · cycle turned, day 1 of 10 · Prosperity -1 · Stamina 17 · wounds 0/10 · torch 1UD · The gate-ward is still standing at your step, waiting to see what you make of it.

## Turn 4
[PLAYER] PLAYER [4/4]: The cycle turns. I ask around what changed in the village.
[TOOLS] (none; no roll called for)
[REF]
The cooper laughs without much humour. "Changed? Nothing's changed, that's the trouble. Nothing got built, nothing got bought, and the place knows it." At the inn the keeper wipes the same cup twice and says the bread is thinner and the beer is the same price. A girl at the well says the old women are counting the stores out loud again, the way they did in the bad winter.

The talk everywhere circles back north. Farm carts that should have come in did not. Someone swears he saw men walking the far fields in grey coats, writing in little books, and that they did not wave back. Nobody has gone to look.

By dusk the lanes are emptying early. Doors close with a bar dropped behind them. Across the square Orla Venn is hauling her own shutters shut, and she stops with one hand on the latch, looking not at the store but up the northern road.

Village (unnamed) · cycle turned, day 1 of 10 · Prosperity -1 · Stamina 17 · wounds 0/10 · torch 1UD · Orla has seen you watching her, and she is not looking away.

DONE
4 turns run.
