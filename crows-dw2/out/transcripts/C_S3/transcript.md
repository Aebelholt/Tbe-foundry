## Turn 1
[PLAYER] PLAYER [1/4]: It is dusk on the road home. I make camp off the road in the open and rest through the night, eating a ration.
(roll on request: Miasma RR (Mind) after the rest, only if the Ref asks)
[TOOLS]
$ python3 engine/engine.py enc --en 9 --why "rest encounter check, outdoor Miasma"
Ref: encounter d10=2 vs EN 9 → none · rest encounter check, outdoor Miasma
$ python3 ledger.py test M --why "Miasma RR after outdoor rest"
TEST Miasma RR after outdoor rest · M+0 · - · [3,5]=8 → T1
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py table miasma_effects --mod 1 --why "Miasma Effects d10+cruelty 1"
Ref: Miasma Effects (R28) d10+1 [4]=5 → 1st Effect: You enter a destructive rage and destroy one mundane item randomly chosen by the Ref from your backpack. 2nd Effect: Destroying something makes you feel good. You regain 3 Stamina or, if your Stamina is full, lose 1 wound. · Miasma Effects d10+cruelty 1
$ python3 engine/engine.py roll d4 --why "which mundane item destroyed: 1 rope 2 knife 3 coin purse 4 spare ration-sack"
Ref: d4 [3]=3 · which mundane item destroyed: 1 rope 2 knife 3 coin purse 4 spare ration-sack
[REF]
Mara ate her ration cold and lay down in the lee of a toppled milestone, sword under her hand. Nothing came through the dark but wind, and the grey haze that lies on this country thickened toward the small hours, so that the stars went out one by one. She woke with her teeth set and her fist closed on something that was not there when she slept. The coin purse at her belt hung in strips, torn through with her own nails, the leather scattered across the frost like shed skin. She does not remember doing it. Her chest is loose and easy, the way it feels after a good shout. A mile north the old road is empty, and at its edge, where the haze lies thickest, a farm cart sits on its side with the ox gone from the traces and a pair of muddy boots set neatly beside it, side by side, as if their owner had stepped out and meant to return.

Ref: encounter d10=2 vs EN 9 → none | TEST Miasma RR after outdoor rest · M+0 · - · [3,5]=8 → T1 | Ref: Miasma Effects (R28) d10+1 [4]=5 → 1st Effect: destroy one mundane item (coin purse, d4=3)

Camp off the road · travel, village a day ahead · Stamina 17 · wounds 0/10 · torch 1UD · cruelty 1 · the boots by the overturned cart, and the road home running past them

## Turn 2
[PLAYER] PLAYER [2/4]: I walk in to the village at dawn and report to the steward.
[TOOLS]
$ python3 engine/engine.py enc --en 9 --why "final stretch of road to village at dawn"
Ref: encounter d10=2 vs EN 9 → none · final stretch of road to village at dawn
[REF]
The gate-wardens know her by her gait and wave her through without a word. The village wakes around her: smoke from the smithy, a shutter banging open, someone hauling water. At the general store the lamp is still lit. Orla Venn stands behind the counter with ink on both cuffs and a ledger open under her thumb, and she does not look up until Mara has finished telling her about the road, the haze, the cart on its side and the boots set beside it.

Then she does look up, tired and exact. "Boots left neat. That is not a robbery." She caps her pen. Her eye drops to Mara's belt, where the purse should be, and rests there a moment on the bare ring of the clasp. "Third report this month of that road going quiet. Two from farms, now one from you." She turns the ledger a quarter turn on the counter, as if to shield it. "Dawn walkers do not come in here to tell me about carts, crow. Is that all you came to give me?"

Ref: encounter d10=2 vs EN 9 → none

Village (unnamed), general store · cycle day 1/10 · Stamina 17 · wounds 0/10 · torch 1UD · Orla waiting, pen capped, for what Mara says next

## Turn 3
[PLAYER] PLAYER [3/4]: I spend the ten days quietly resting and repairing, and do not found or upgrade any institution and spend nothing at merchants.
[TOOLS]
$ python3 engine/engine.py cycle 0
Ref: cycle end · Prosperity 0 → -1 (nothing raised it, C45) · set it in the Ledger
Ref: next Village Event rolled: d10-1 [1]=0 · sealed until it lands
SEALED: next Village Event (C46-47) 0: A merchant institution suffers a devastating robbery. Their level decreases by 3 until the end of the cycle. If this reduces the merchant’s level to 0, they are closed for business until the end of the cycle.
[REF]
Ten days go by the way bread goes stale, slowly and then all at once. Mara sleeps in her own bed and wakes to her own ceiling. She whets the sword, restitches the strap of her shield, scrubs the road out of her boots, and stays out of the shops. Nobody builds anything. Nobody pays for anything worth the telling. The smithy fire burns lower each morning, and the well queue talks less.

The talk that does come is all of one kind. A cooper who walked the north road says two farms stand with their doors open and their hearths cold. A carter swears the old toll house, dark since the war, showed a light on three nights running, and heard hammering. At the store, the shelves are thinner than they were on the day she came in, and Orla Venn is thinner-lipped, and does not look at Mara when she passes the window.

On the tenth night the village bell is rung once, for the turning of the cycle. The villagers pretend it means nothing, but the shutters stay latched a little longer than usual.

Ref: cycle end · Prosperity 0 → -1 (nothing raised it, C45) · set it in the Ledger | Ref: next Village Event rolled: d10-1 [1]=0 · sealed until it lands

Village (unnamed) · cycle turned, day 1 of the next · Stamina 17 · wounds 0/10 · torch 1UD · Prosperity -1 · the bell's last note fading, and a hammering at Mara's door

## Turn 4
[PLAYER] PLAYER [4/4]: The cycle turns. I ask around what changed in the village.
[TOOLS]
(none; no roll called, no Ref die rolled)
[REF]
The hammering at her door is only the cooper's boy mending a neighbour's shutter, and he stops to answer her when she asks. Mara goes door to door through the grey morning and gets the same answer in different mouths. The well queue is shorter. The smith has banked his fire to save charcoal. The innkeeper's board lists fewer rooms taken than at the last turning, and no one is laughing at the bar. "Nothing grew," says the baker, flatly, wiping her hands. "Nothing was built. The village counts that against itself, you know. Lean times, crow."

The better news comes last, and it is not good. A farmer's widow, in from the east fields, says two neighbours' carts never came home from the north road. A warden at the gate turns her toward the post, where a sign stands that was not there ten days ago: seven short strokes cut in the wood, one crossed, fresh as split pine and still beaded with sap. It is a tally. Under it someone has scratched a word she does not know, and a second word she does: DUES.

Ref: none

Village (unnamed) · cycle day 1 of the next · Stamina 17 · wounds 0/10 · torch 1UD · Prosperity -1 · the fresh tally and the word DUES cut into the gatepost, and the warden watching her read it
DONE
Ran 4 turns (rest and Miasma, arrival, cycle end, asking around).
