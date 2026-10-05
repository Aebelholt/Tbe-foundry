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

## Turn 3
[PLAYER] PLAYER [3/4]: I spend the ten days quietly resting and repairing, and do not found or upgrade any institution and spend nothing at merchants.
[TOOLS]
$ python3 engine/engine.py cycle 0
Ref: cycle end · Prosperity 0 → -1 (nothing raised it, C45) · set it in the Ledger
Ref: next Village Event rolled: d10-1 [6]=5 · sealed until it lands
[REF]
The days run out in small, ordinary work. Mara sleeps under a roof, sharpens and oils what needs it, mends straps by lamplight, and eats at the long table where nobody asks her for anything. By the third night the flat grey weight behind her eyes has lifted, and the colour comes back into the stubble fields seen from the wall. Rest inside the enclosure clears what the Miasma laid on her.

The village does not grow. No new timber goes up, no coin changes hands at the stalls on her account, and the stewards' faces tighten a little more each morning. On the tenth day a boy runs the length of the lane with word from the wall: on the far ridge north of the ford, the old toll house has shutters on its windows that were not there before, and men moving behind them.

Ref: cycle end · Prosperity 0 → -1 (nothing raised it, C45) · set it in the Ledger

Village · day 10 of 10, cycle turned · Stamina 17 · wounds 0/10 · cruelty cleared · the boy is still panting at the lane's end, pointing north

## Turn 4
[PLAYER] PLAYER [4/4]: The cycle turns. I ask around what changed in the village.
[TOOLS] (none; no roll called for)
[REF]
Mara walks the lane and listens. The answers come in the flat way of people too tired to dress them up. The smith's forge burns lower than it did, coals rationed to the day's real work. The inn's second hearth is cold, and the innkeeper sweeps around it as if it were a grave. A woman at the well says the children have stopped playing past the chapel because the north road is empty now, and empty roads frighten them more than strangers.

Nobody says the village is failing. They only say that nothing new was built and nothing was bought, and that a cycle like that leaves a mark. A man counting tallow candles at his door tells her the toll house on the ridge is the thing everyone looks at now, though nobody wants to be the first to say why.

Behind her the general store's shutters bang open. Orla Venn stands in the doorway, ink on her cuffs, and lifts one hand in a short, businesslike beckon.

Village lane · day 10 of 10, cycle turned · Stamina 17 · wounds 0/10 · cruelty cleared · Orla Venn is beckoning from the store door

DONE
4 turns run.
