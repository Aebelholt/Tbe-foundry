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

