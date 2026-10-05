## Turn 1
[PLAYER] PLAYER [1/4]: It is dusk on the road home. I make camp off the road in the open and rest through the night, eating a ration.
(roll on request: Miasma RR (Mind) after the rest, only if the Ref asks)
[TOOLS]
$ python3 engine/engine.py enc
Ref: encounter d10=7 vs EN 9 → none
$ python3 ledger.py move M
MOVE move · M+0 · - · [3,6]=9 → T2
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF] Mara beds down in a hollow off the road, back to a low wall of fallen stone. The night is long and grey. Somewhere past the ridge something drags a chain, or the wind does, and then stops. She eats her ration cold, and sleeps in snatches with the Miasma lying on the ground like breath on glass. Nothing comes for her. By first light her limbs are loose and her head is thick, a taste of tin at the back of her mouth that was not there at dusk. On the road below, someone has driven a stake into the verge and hung a scrap of grey cloth from it, knotted around a tally stick. A farm lane runs north from the stake, and the gate at the end of it hangs open. No smoke rises from the farmhouse beyond.

Ref: encounter d10=7 vs EN 9 → none · Defy Danger (Miasma, Mind) 7-9 → she prevails; Ref move: Foreshadow a Threat
Stamina 17 · AD 25 · torch 1 UD · road home, day's walk from the village, dawn · The grey cloth stirs on its stake, and the open gate is waiting.

## Turn 2
[PLAYER] PLAYER [2/4]: I walk in to the village at dawn and report to the steward.
[TOOLS] (none)
[REF] The village wall comes up out of the haze as the sun clears it, grey stone patched with newer grey, and the gate-warden lets her through with a nod and a yawn. The general store is open already. Orla Venn stands behind her counter with ink on her cuffs and a ledger open under her hand, and she does not look up until Mara is at the boards.

"You're back, and walking upright. Good." Her pen taps twice. "The Hartley girl came in yesterday from the north farms with her cart half empty and no father. She says the lane to the Penner place stood open and no one answered. Two households I was owed a count from, and no count." She finally looks up, tired eyes, steady. "Tell me what you saw on the road. Plainly. I have no patience this morning for anything dressed up."

Stamina 17 · AD 25 · torch 1 UD · village (unnamed), general store, dawn, cycle day 1 of 10 · Orla waits, pen lifted, for Mara's account of the road.

## Turn 3
[PLAYER] PLAYER [3/4]: I spend the ten days quietly resting and repairing, and do not found or upgrade any institution and spend nothing at merchants.
[TOOLS]
$ python3 engine/engine.py cycle 0
Ref: cycle end · Prosperity 0 → -1 (nothing raised it, C45) · set it in the Ledger
Ref: next Village Event rolled: d10-1 [8]=7 · sealed until it lands
SEALED: next Village Event (C46-47) 7: A merchant institution has a small surplus. Treat them as 1 level higher until the end of the cycle.
[REF] Ten days go by in small work. Mara oils straps, patches her kit, sleeps under a roof, and eats at a table. The north farms send no one. The Hartley girl sits at the inn two days and then goes quiet, and on the sixth evening the warden on the north wall reports a thin black smoke standing over the old toll house, where there has been no fire in years. Hammering carries down on still mornings. Nobody goes to look. At the cycle's end the stewards meet and count, and the count is a short one: nothing built, nothing bought, nothing mended that would count against the slow rot in the walls. Orla draws a line under the page, and her pen scratches hard. A bell is rung for the turn of the cycle, and the hammering from the north answers it, faint and steady.

Ref: cycle end · Prosperity 0 → -1 (nothing raised it, C45) · set it in the Ledger
Ref: next Village Event rolled: d10-1 [8]=7 · sealed until it lands
Stamina 17 · AD 25 · torch 1 UD · village (unnamed), cycle day 10 of 10 ends, Prosperity -1 · The hammer-beat from the north does not stop with the bell.

## Turn 4
[PLAYER] PLAYER [4/4]: The cycle turns. I ask around what changed in the village.
[TOOLS] (none)
[REF] Mara walks the lanes in the grey after the bell and asks, and the village answers in pieces. At the well, a woman says the walls sweat more than they used to, and shows her a crack in the cap-stone that was not there a month ago. The smith's boy says the forge draws worse and the coal is dearer. At the inn the shutters are half closed and the stew is thinner than it was. Nobody has the heart for a grievance, only a shrug. Everyone, though, has a word about the north: the hammering, the smoke, the Hartley girl's silence, the two empty farms. An old man tells her the wardens doubled the watch on the north wall last night and no one told the stewards why. Back at the store Orla has not moved from the counter, and she has not forgotten her question.

Stamina 17 · AD 25 · torch 1 UD · village (unnamed), new cycle day 1 · Orla is still waiting on Mara's plain account of the road.

DONE
Ran 4 turns (player script complete; scene ended at cycle turn with next village event sealed).
