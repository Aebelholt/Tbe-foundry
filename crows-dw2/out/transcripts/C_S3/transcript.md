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
