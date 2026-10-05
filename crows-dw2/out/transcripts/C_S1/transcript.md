# Transcript C_S1

## Turn 1
[PLAYER] PLAYER [1/7]: I hold the torch high and step in on the bear, sword out, and drive at it.
(roll on request: attack / Trade Blows with the bear, expertise only on a T1)
[TOOLS]
$ python3 ledger.py attack --b 1 --exp --why "Trade Blows bear, dim light"
ATTACK Trade Blows bear, dim light · S+3 · b · [7,8]=16(incl -2) → T2 · HIT 7 dam
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "bear bite"
Ref: TEST · bear bite · +2 · [2,10]=14 → T2
$ python3 ledger.py take 7
LEDGER: took 7 (AD 25→18, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 18 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
The torch spits and throws a shaky orange ring across the nave. The bear rises off the carcass with its muzzle dark and wet, and it does not wait for you to arrive. You close the gap together. Your sword bites into the thick fur of its shoulder and the beast screams, a wet furious sound that rolls off the vaulted stones. Then its jaws clamp down on your armor and the weight of it shoves you back a step, plates grinding, a bruise blooming under the steel. Blood runs down the bear's chest, and it is plainly angrier for it. Past its bulk, two gray shapes lift their heads from the meat. They are slinking wide along the broken pews, one on each side, and their eyes catch the torchlight.

Ref: TEST · bear bite · +2 · [2,10]=14 → T2

West door at your back · DT 3 · Stamina 17 · wounds 0/10 · torch, dim light · the bear is on you and the wolves are circling wide.

## Turn 2
[PLAYER] PLAYER [2/7]: I keep pressing the bear and give it no room.
[TOOLS]
$ python3 ledger.py attack --b 1 --exp --why "Trade Blows bear, dim light"
ATTACK Trade Blows bear, dim light · S+3 · b · [4,10]=15(incl -2) → T2 · HIT 7 dam
STATUS Stamina 17 · AD 18 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "bear bite"
Ref: TEST · bear bite · +2 · [10,1]=13 → T2
$ python3 ledger.py take 7
LEDGER: took 7 (AD 18→11, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 11 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
You lean into it and leave it no breathing space. The sword comes down across the bear's flank, then again, and each stroke draws a thicker rope of blood across its coat. It answers by lunging for your throat. You catch the jaws on your shield rim and still the force of the bite goes through the steel and into your ribs like a thrown stone. Your arm goes numb to the elbow. The bear is heaving now, its breath ragged and whistling, one foreleg dragging a half-beat behind the other. The wolves have stopped circling. They pad closer on either side, low and quiet, bellies near the flagstones, and the torch flame bends in the draft of their passing.

Ref: TEST · bear bite · +2 · [10,1]=13 → T2

West door at your back · DT 3 · Stamina 17 · wounds 0/10 · torch, dim light · the bear is hurt but still swinging, and both wolves are two strides off your flanks.

