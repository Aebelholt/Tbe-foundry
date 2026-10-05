## Turn 1
[PLAYER] PLAYER [1/4]: It is dusk on the road home. I make camp off the road in the open and rest through the night, eating a ration.
(roll on request: Miasma RR (Mind) after the rest, only if the Ref asks)
[TOOLS]
$ python3 engine/engine.py enc --why "rest encounter check"
Ref: encounter d10=1 vs EN 9 → none · rest encounter check
$ python3 ledger.py test M --e 0 --b 0 --why "Miasma RR after rest outdoors"
TEST Miasma RR after rest outdoors · M+0 · - · [1,4]=5 → T1
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py read test_miasma_rest 5
Miasma Rest (RR) (R27) 5 → The human gains a level of cruelty and must roll for a Miasma effect on the Miasma Effects table.
$ python3 engine/engine.py table miasma_effects --mod 1 --why "Miasma Effects, cruelty 1"
Ref: Miasma Effects (R28) d10+1 [1]=2 → 1st Effect: You become despondent. You only speak if spoken to first and give one-word responses until you exit the Miasma. 2nd Effect: You have an edge on tests made to sneak or hide. · Miasma Effects, cruelty 1
[REF]
Mara finds a hollow behind a fallen wall, out of the wind, and eats her ration cold while the last light drains from the grey fields. Nothing comes in the dark. The night passes in the thin, sour hush the Miasma keeps, a smell like old pennies and wet ash that settles in the back of the throat. She sleeps the four hours and wakes with her muscles loosened and her blade where she left it.

Then the quiet changes. Something sits behind her eyes that was not there at dusk, a flat weight, as though the colour has been turned down on the whole world. The morning is the same grey as the evening was. Far across the stubble, where the northern road runs, no smoke rises from the farm that stood there yesterday.

Ref: encounter d10=1 vs EN 9 → none · rest encounter check
Ref: Miasma Effects (R28) d10+1 [1]=2 → 1st Effect: despondent, speaks only if spoken to first and in one-word answers until she exits the Miasma. 2nd Effect: an edge on tests to sneak or hide.
Also: TEST Miasma RR after rest outdoors · M+0 · - · [1,4]=5 → T1

Camp · travel, dawn, a day from the village · Stamina 17 · wounds 0/10 · torch out of play · the northern farm's chimney is cold, and the road home runs past it

## Turn 2
[PLAYER] PLAYER [2/4]: I walk in to the village at dawn and report to the steward.
[TOOLS] (none; no roll called for)
[REF]
The walk is a day's worth of grey stubble and leaning fence posts, and Mara reaches the village gate as the sun is a pale coin over the wall. The gate-warden nods her through without a word. Inside the enclosure the air is clean, and the sour taste in her throat thins and does not quite leave.

The general store's shutters are half up. Orla Venn stands at the counter with ink on her cuffs, a ledger open under her thumb, and she does not look up until Mara's shadow crosses the page.

"You're back, and in one piece. Good." Her pen taps twice. "Anything on the road? The northern farms have stopped sending wagons, and two families I'd have sworn by haven't been seen in a week."

Her eyes stay on Mara a moment longer than the question needs. She waits, pen lifted, the way someone waits who has little time and fewer coins.

Village gate and general store · village day 1 of 10 · Stamina 17 · wounds 0/10 · despondent (Miasma) · Orla Venn is waiting on an answer about the northern road
