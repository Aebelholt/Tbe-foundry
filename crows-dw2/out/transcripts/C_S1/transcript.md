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

## Turn 3
[PLAYER] PLAYER [4/7]: I turn on the nearest wolf.
[TOOLS]
$ python3 ledger.py attack --b 1 --exp --why "Trade Blows wolf 1, dim light"
ATTACK Trade Blows wolf 1, dim light · S+3 · b · [10,1]=12(incl -2) → T2 · HIT 7 dam
STATUS Stamina 17 · AD 11 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 1 --e 1 --why "wolf 1 bite, Pack Hunter"
Ref: TEST · wolf 1 bite, Pack Hunter · +1 · e · [10,6]=19 → T3
$ python3 ledger.py take 4
LEDGER: took 4 (AD 11→7, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 7 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
You pivot on your heel and the nearest wolf is already springing. Your blade meets it in the air and opens its shoulder to the bone. It lands badly, yelping, but the other wolf has slid in on your off side and the pair of them work as one animal. Teeth find the gap at your hip where the armor plates part and clamp down hard, a bright hot pinch that you feel through the padding. The cracked and scuffed steel at your ribs is carrying the damage now, and it will not carry much more. Behind them the bear stands swaying, bloody to the elbows, grunting low in its chest. It is watching you with small flat eyes, deciding.

Ref: TEST · wolf 1 bite, Pack Hunter · +1 · e · [10,6]=19 → T3

West door at your back · DT 3 · Stamina 17 · wounds 0/10 · torch, dim light · the wounded wolf hangs on your hip, its mate is at your flank, and the bear is a stride away.

## Turn 4
[PLAYER] PLAYER [5/7]: I hit the closest wolf again.
[TOOLS]
$ python3 ledger.py attack --b 1 --exp --why "Trade Blows wolf 1, dim light"
ATTACK Trade Blows wolf 1, dim light · S+3 · b · [8,1]=10(incl -2) → T2 · expertise used (Slashing 2 left) · HIT 7 dam
STATUS Stamina 17 · AD 7 · wounds 0/10 · uses Slashing 2 · UD torch 1
(wolf 1 Stamina 3, 7 dam: dead before it can bite; no foe roll)
[REF]
The wolf is still on your hip when your second stroke comes round. It was a clumsy cut, mostly the flat of the blade, and for a moment you think it failed. Then the animal lets go of you and sags sideways onto the flagstones, its legs paddling once against the dust before they stop. The sound that follows is the other wolf's snarl, higher and thinner than before. It crouches over the dead one's flank with its hackles raised and its lips drawn back from yellow teeth. The bear has not moved. It stands with its head low and its great chest working, and a rope of red spittle swings from its jaw. The torch flame gutters and steadies.

West door at your back · DT 3 · Stamina 17 · wounds 0/10 · torch, dim light · the bear and the last wolf are both watching your sword.

## Turn 5
[PLAYER] PLAYER [6/7]: I finish the last one standing.
[TOOLS]
$ python3 ledger.py attack --b 1 --exp --why "Trade Blows wolf 2, dim light"
ATTACK Trade Blows wolf 2, dim light · S+3 · b · [2,5]=8(incl -2) → T2 · expertise used (Slashing 1 left) · HIT 7 dam
STATUS Stamina 17 · AD 7 · wounds 0/10 · uses Slashing 1 · UD torch 1
$ python3 engine/engine.py test 1 --why "wolf 2 bite, no flank"
Ref: TEST · wolf 2 bite, no flank · +1 · [9,3]=13 → T2
$ python3 ledger.py take 4
LEDGER: took 4 (AD 7→3, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 3 · wounds 0/10 · uses Slashing 1 · UD torch 1
[REF]
The last wolf comes in low and fast and you meet it with the point. The blade goes in under its ribs and the animal screams, a high bright sound, but it does not stop. It rakes its teeth across your thigh as it twists and the steel of your leg plates shrieks. You feel the armor give, a line of cold where something has come loose. It backs off three paces with blood bubbling at its mouth, limping, and then it stops and stares at you with an unnatural hunger. Behind it the bear swings its great head toward the fallen wolf's body and sniffs once. The torch pops, and a gout of sparks drops to the floor between you and them.

Ref: TEST · wolf 2 bite, no flank · +1 · [9,3]=13 → T2

West door at your back · DT 3 · Stamina 17 · wounds 0/10 · torch, dim light · the hurt wolf is three paces off and the bear is rousing again.

## Turn 6
[PLAYER] PLAYER [7/7]: I check the room and wipe the blood off my hands.
[TOOLS]
(Script ended; both animals are badly hurt and losing, so they break off per rules §4. No roll. Scene line at end: bear Stamina 6/20 unengaged, fleeing; wolf 2 Stamina 3/10 unengaged, fleeing; wolf 1 dead. DT 3 ends.)
$ python3 ledger.py ud torch
UD torch · [2] → 1→0 · EXPIRED
STATUS Stamina 17 · AD 3 · wounds 0/10 · uses Slashing 1 · UD torch 0
$ python3 engine/engine.py enc --en 9
Ref: encounter d10=9 vs EN 9 → sign now, encounter within the next DT
[REF]
You lower the sword and the room does not argue. The wolf is first to give up. It slinks backward on three good legs, leaves a smear on the flagstones, and goes over the pews in a single limping bound toward the dark of the transept. The bear lingers longer. It looks at the carcass, then at you, then at its own blood spreading in the dust, and then it turns and shoulders its huge body through a gap in the north wall where the stone has fallen away. Its claws scrape on rubble and fade. You wipe your hands on your sleeve, and they come away red. Then the torch gives one last long sputter and dies, and the dark closes over the nave like water. Somewhere past the altar rubble, something drags a slow step across stone, and metal chinks, small and regular, like a coin being counted.

Ref: encounter d10=9 vs EN 9 → sign now, encounter within the next DT

Ruined chapel nave, west door behind you · end of DT 3 · Stamina 17 · wounds 0/10 · no light, full dark · a slow dragging step and a chink of metal are coming from beyond the altar.

DONE
Ran 6 turns.
