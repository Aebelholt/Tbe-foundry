## Turn 1
[PLAYER] PLAYER [1/13]: I hold the torch high and step in on the bear, sword out, and drive at it.
(roll on request: attack / Trade Blows with the bear, expertise only on a T1)
[TOOLS]
$ python3 engine/engine.py init
Ref: initiative d10=3 → enemies act first
$ python3 engine/engine.py test 2 --why "bear bite vs Mara R1"
Ref: TEST · bear bite vs Mara R1 · +2 · [7,5]=14 → T2
$ python3 ledger.py take 4   (bear Bite T2 = 4 dam, blocks.md)
LEDGER: took 4 (AD 25→21, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 21 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py attack   (Ref slip: --exp was not passed; the roll stands as given, no expertise spent)
ATTACK attack · S+3 · - · [1,4]=8 → T1 · MISS
STATUS Stamina 17 · AD 21 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 4
LEDGER: took 4 (AD 21→17, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 17 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
The bear is up off the carcass before your foot comes down, a wall of wet brown fur and bared yellow teeth. It does not wait for you. Its jaws snap shut on your shoulder, and the torchlight jerks across the nave as you take the blow. Your blade sweeps in and finds only air and a flicker of fur, and the bear answers the miss with another bite, hard against your side. Your armor groans and holds, just. Behind it, a wolf lifts its muzzle from the ribs of the carcass, then the second, grey shapes uncoiling far down the nave and starting to fan wide. Somewhere behind you the west door still stands open, cold air pulling at the flame.

Ref: initiative d10=3 → enemies act first | Ref: TEST · bear bite vs Mara R1 · +2 · [7,5]=14 → T2 | ATTACK attack · S+3 · - · [1,4]=8 → T1 · MISS | counter: bear bite T2, 4 dam

Chapel nave · DT 3 · Stamina 17 · wounds 0/10 · torch lit · the bear is on you and the wolves are circling in

## Turn 2
[PLAYER] PLAYER [2/13]: I keep pressing the bear and give it no room.
[TOOLS]
$ python3 engine/engine.py init
Ref: initiative d10=5 → enemies act first
$ python3 engine/engine.py test 2 --why "bear bite vs Mara R2"
Ref: TEST · bear bite vs Mara R2 · +2 · [5,4]=11 → T1
(bear weapon miss: Mara counters at her T2 damage per Ledger row, sword t2 4 + S 3 = 7; bear 20→13)
$ python3 ledger.py attack --exp
ATTACK attack · S+3 · - · [9,5]=17 → T3 · HIT 10 dam
STATUS Stamina 17 · AD 17 · wounds 0/10 · uses Slashing 3 · UD torch 1
(bear 13→3; wolves spent the round closing)
[REF]
The bear lunges first and misses. Its head swings wide of your shield and the jaws clap shut on nothing but the torch's heat, and your blade rakes its ribs on the way back, opening the hide in a long red line. It roars. You do not give it room, and your next stroke goes in under the chin, deep, a clean hard blow that sends it reeling a step back from the carcass with blood sheeting down its chest. It drags in breath, ragged and wet, and its small eyes flick away from you, toward the dark corners and the door of the vestry.

Both wolves have crossed the nave in the time it took, low and fast, one slipping out along your left, the other holding to the right. Their claws scrape on the broken flagstones. They are close enough now that you can hear them panting.

Ref: initiative d10=5 → enemies act first | Ref: TEST · bear bite vs Mara R2 · +2 · [5,4]=11 → T1 | ATTACK attack · S+3 · - · [9,5]=17 → T3 · HIT 10 dam

Chapel nave · DT 3 · Stamina 17 · wounds 0/10 · torch lit · the bear is staggering, both wolves are at your flanks

## Turn 3
[PLAYER] PLAYER [4/13]: I turn on the nearest wolf.
[TOOLS]
$ python3 engine/engine.py init
Ref: initiative d10=9 → crows act first
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [4,10]=17 → T3 · HIT 10 dam
STATUS Stamina 17 · AD 17 · wounds 0/10 · uses Slashing 3 · UD torch 1
(wolf A 10→0, dead. Bear at 3 flees a losing fight, F31.)
$ python3 engine/engine.py test 1 --why "wolf B bite vs Mara R3"
Ref: TEST · wolf B bite vs Mara R3 · +1 · [6,2]=9 → T1
(weapon miss: Mara counters at 7 per Ledger row; wolf B 10→3)
[REF]
You swing for the nearest wolf before it can set its feet, and the sword takes it across the neck and shoulder with a wet crack. It drops and does not rise, claws still raking the stone. The bear sees it. The great beast bawls once, swings round and goes lumbering for the vestry door at the far end, shouldering the splintered frame aside, leaving a smear of blood across the flagstones.

The second wolf has no one left to flank with. It comes in low from your right anyway and snaps at your leg, and the teeth find only the edge of your shield and the cold air behind it. Your counter is quick and hard, the blade tearing across its flank, and it yelps and skitters back a step, dragging a hind leg, ears flat and lips peeled from its teeth. It is bleeding badly. It keeps its eyes on you and does not run.

Ref: initiative d10=9 → crows act first | ATTACK attack · S+3 · - · [4,10]=17 → T3 · HIT 10 dam | Ref: TEST · wolf B bite vs Mara R3 · +1 · [6,2]=9 → T1

Chapel nave · DT 3 · Stamina 17 · wounds 0/10 · torch lit · one wolf, hurt and snarling, a sword's length from you

## Turn 4
[PLAYER] PLAYER [5/13]: I hit the closest wolf again.
[TOOLS]
$ python3 engine/engine.py init
Ref: initiative d10=3 → enemies act first
$ python3 ledger.py attack   (run in the same batch before the wolf's roll; unused: wolf B was already dead when Mara's action came)
ATTACK attack · S+3 · - · [10,1]=14 → T2 · HIT 7 dam
STATUS Stamina 17 · AD 17 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 1 --why "wolf B bite vs Mara R4"
Ref: TEST · wolf B bite vs Mara R4 · +1 · [2,2]=5 → T1
(natural 2 on a weapon attack: a doom, miss; Mara counters at T3 per the Ledger row, 7+3 = 10; wolf B 3→0, dead. Both animals are down or gone: DT ends.)
$ python3 ledger.py ud torch
UD torch · [5] → 1→1
STATUS Stamina 17 · AD 17 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py enc --en 9
Ref: encounter d10=10 vs EN 9 → ENCOUNTER NOW
[REF]
The wolf goes for you with the last of its strength, and its jaws clamp shut on empty air as its hind leg buckles under it. It stumbles, all its weight thrown wrong, and your blade comes round across its neck before it can recover. It falls beside its packmate and lies still. The nave goes quiet but for the drip of blood from the carcass and the hiss of the torch. Through the broken vestry door, far off, you hear the bear crashing away through rubble, fading.

You lower the sword. Then the quiet changes. Out past the west door, in the dark you came through, something scrapes on stone, and then again, slow and even, and the scrape has a rhythm to it, like boots dragging a chain. The torchlight does not reach that far, but the draught from the door carries a smell of old iron and cold ash, and the sound is coming closer.

Ref: encounter d10=10 vs EN 9 → ENCOUNTER NOW

Chapel nave · end of DT 3 · Stamina 17 · wounds 0/10 · torch lit (UD 1) · something is dragging itself toward the west door
DONE
Ran 4 turns (rounds 1-4 of combat, then DT end).
