## Turn 1
[PLAYER] PLAYER [1/17]: I plant myself in the corridor mouth with the torch behind me, and wait for the first one to come into reach.
(roll on request: none yet)
[TOOLS]
$ python3 engine/engine.py init
Ref: initiative d10=6 → crows act first
$ python3 engine/engine.py test 2 --why "undead A1 claws vs Mara"
Ref: TEST · undead A1 claws vs Mara · +2 · [8,7]=17 → T3
$ python3 ledger.py take 4
LEDGER: took 4 (AD 25→21, Stamina 17→17, wounds 0→0)
$ python3 ledger.py status
STATUS Stamina 17 · AD 21 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
The scrape of bone on stone comes up the corridor, slow and uneven, and then the dark in front of the torchlight bulges. A razorback lurches into reach, hide hanging off a ridge of spines along its back, and does not wait to be met. Its claws come across in a flat, hooked sweep and rake the plates over your ribs hard enough to ring. Nothing gets through, but the armor is left scored and dented. Behind it a second shape shuffles close, shouldering for room, and farther back, past where the light gives out, many more feet drag in a loose line.

Ref: initiative d10=6 → crows act first
Ref: TEST · undead A1 claws vs Mara · +2 · [8,7]=17 → T3

Corridor mouth · DT 1 · Round 1 · Stamina 17 · wounds 0/10 · torch lit (1 UD) · the first razorback is in reach and its twin presses at its back

## Turn 2
[PLAYER] PLAYER [2/17]: I cut at the first one in reach.
(roll on request: attack / Trade Blows)
[TOOLS]
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [8,6]=17 → T3 · HIT 10 dam
STATUS Stamina 17 · AD 21 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py init
Ref: initiative d10=3 → enemies act first
$ python3 engine/engine.py test 2 --why "undead A1 claws vs Mara"
Ref: TEST · undead A1 claws vs Mara · +2 · [6,8]=16 → T2
$ python3 engine/engine.py test 2 --why "undead A2 spine vs Mara"
Ref: TEST · undead A2 spine vs Mara · +2 · [2,3]=7 → T1
$ python3 engine/engine.py roll d10 --why "A2 spine miss, odd hits an ally"
Ref: d10 [9]=9 · A2 spine miss, odd hits an ally
$ python3 ledger.py take 2
LEDGER: took 2 (AD 21→19, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 19 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
The razorback gets its swing in first. Claws scrape down your armor and bite a little deeper this time, though still only plate. Over its shoulder the second one coughs a spine out of its back. The thing misses you and buries itself in its packmate's neck, which does not seem to trouble the packmate. Then your blade is already moving. It comes across in a long, hard arc, takes the first razorback through the collarbone and keeps going, and the creature drops in two pieces that stop twitching. The second steps over the wreck without a glance down. Its claws are raised. Behind it the column has closed up, four shapes wading out of the black.

Ref: initiative d10=3 → enemies act first
Ref: TEST · undead A1 claws vs Mara · +2 · [6,8]=16 → T2
Ref: TEST · undead A2 spine vs Mara · +2 · [2,3]=7 → T1
Ref: d10 [9]=9 · A2 spine miss, odd hits an ally

Corridor mouth · DT 1 · Round 2 · Stamina 17 · wounds 0/10 · torch lit (1 UD) · the second razorback is on you, four more close behind it

## Turn 3
[PLAYER] PLAYER [3/17]: I hit the nearest one again.
[TOOLS]
$ python3 engine/engine.py init
Ref: initiative d10=2 → enemies act first
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [9,4]=16 → T2 · HIT 7 dam
STATUS Stamina 17 · AD 19 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "undead A2 claws vs Mara"
Ref: TEST · undead A2 claws vs Mara · +2 · [2,7]=11 → T1
$ python3 engine/engine.py test 2 --why "undead A3 spine vs Mara"
Ref: TEST · undead A3 spine vs Mara · +2 · [10,4]=16 → T2
$ python3 ledger.py take 1
LEDGER: took 1 (AD 19→18, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 18 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
The razorback's claws go wide and snag only air. Past its head a third one flicks a spine at you. It pings off your armor with a bright little sound and drops into the dirt. Then your blade bites. It opens the nearest razorback from hip to ribs, and the thing staggers and folds half over the wound, hide flapping, one claw still scrabbling up toward you. It is not dead. Black fluid runs steadily down its legs and the torchlight shows the knotted ridge of its spine shaking. The third waits behind it, half in shadow, while two more crowd the dark beyond.

Ref: initiative d10=2 → enemies act first
Ref: TEST · undead A2 claws vs Mara · +2 · [2,7]=11 → T1
Ref: TEST · undead A3 spine vs Mara · +2 · [10,4]=16 → T2

Corridor mouth · DT 1 · Round 3 · Stamina 17 · wounds 0/10 · torch lit (1 UD) · the wounded razorback is still on its feet, reaching for you
