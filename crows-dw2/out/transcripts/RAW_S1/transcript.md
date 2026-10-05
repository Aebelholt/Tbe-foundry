## Turn 1
[PLAYER] PLAYER [1/7]: I hold the torch high and step in on the bear, sword out, and drive at it.
(roll on request: attack / Trade Blows with the bear, expertise only on a T1)
[TOOLS]
$ python3 engine/engine.py init
Ref: initiative d10=1 → enemies act first
$ python3 engine/engine.py test 2 --why "bear bite vs Mara R1"
Ref: TEST · bear bite vs Mara R1 · +2 · [8,3]=13 → T2
$ python3 engine/engine.py test 4 --why "wolf1 bite vs Mara R1 (+1 bite, +3 pack flank)"
Ref: TEST · wolf1 bite vs Mara R1 (+1 bite, +3 pack flank) · +4 · [6,1]=11 → T1
$ python3 engine/engine.py test 4 --why "wolf2 bite vs Mara R1 (+1 bite, +3 pack flank)"
Ref: TEST · wolf2 bite vs Mara R1 (+1 bite, +3 pack flank) · +4 · [8,9]=21 → T3
$ python3 ledger.py take 4
LEDGER: took 4 (AD 25→21, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 21 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 4
LEDGER: took 4 (AD 21→17, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 17 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py attack --b 1 --why "sword at bear, dim light bane"
ATTACK sword at bear, dim light bane · S+3 · b · [4,8]=13(incl -2) → T2 · HIT 7 dam
STATUS Stamina 17 · AD 17 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
The torch hisses as Mara lifts it, and the whole nave jerks toward the light. The bear gets there first, a brown wall of wet fur that crosses the flagstones faster than anything that size should, and its jaws close on her shield arm and shoulder with a crunch of leather and steel. The wolves come low and split, one down each side of her, so the door at her back is suddenly the only thing behind her. One wolf snaps at her thigh and finds only air. The other hits her flank and hangs on for a heartbeat, snarling through a mouthful of mail.

Mara drives forward anyway. Her sword cuts across the bear's chest and comes away dark. The animal bellows, rears, and a gout of blood patters over the carcass it was feeding on. It does not back off. It lowers its head, hackles up, hot breath fogging the torchlight.

Ref: initiative d10=1 → enemies act first · Ref: TEST · bear bite vs Mara R1 · +2 · [8,3]=13 → T2 · Ref: TEST · wolf1 bite vs Mara R1 (+1 bite, +3 pack flank) · +4 · [6,1]=11 → T1 · Ref: TEST · wolf2 bite vs Mara R1 (+1 bite, +3 pack flank) · +4 · [8,9]=21 → T3 · ATTACK sword at bear, dim light bane · S+3 · b · [4,8]=13(incl -2) → T2 · HIT 7 dam

Chapel nave · DT 3 · round 1 · Stamina 17 · wounds 0/10 · torch lit (dim) · the bear is on her, a wolf at each flank, the door at her back

## Turn 2
[PLAYER] PLAYER [2/7]: I keep pressing the bear and give it no room.
[TOOLS]
$ python3 engine/engine.py init
Ref: initiative d10=7 → crows act first
$ python3 ledger.py attack --b 1 --why "sword at bear R2, dim"
ATTACK sword at bear R2, dim · S+3 · b · [6,2]=9(incl -2) → T1 · MISS
STATUS Stamina 17 · AD 17 · wounds 0/10 · uses Slashing 3 · UD torch 1
(Ref ruling: melee miss, bear counters at its T2 bite 4 +2 Dangerous When Cornered = 6)
$ python3 ledger.py take 6
LEDGER: took 6 (AD 17→11, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 11 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "bear bite vs Mara R2"
Ref: TEST · bear bite vs Mara R2 · +2 · [4,6]=12 → T2
$ python3 engine/engine.py test 4 --why "wolf1 bite vs Mara R2 (+1, +3 flank)"
Ref: TEST · wolf1 bite vs Mara R2 (+1, +3 flank) · +4 · [9,2]=15 → T2
$ python3 engine/engine.py test 4 --why "wolf2 bite vs Mara R2 (+1, +3 flank)"
Ref: TEST · wolf2 bite vs Mara R2 (+1, +3 flank) · +4 · [1,1]=6 → T1 DOOM
$ python3 ledger.py take 6
LEDGER: took 6 (AD 11→5, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 5 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 3
LEDGER: took 3 (AD 5→2, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 2 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
Mara sets her feet and cuts at the bear, but the blade finds only a raised shoulder and glances off thick hide. The bear answers at once, a snap of teeth that tears her shield rim and sprays her face with its breath. Armor groans. Something gives under her arm, a strap or a plate.

Then the bear bites again, harder, and she feels the weight of it through the shield, down into her hip. The first wolf darts in, low, and its teeth rake the back of her thigh. Mail scrapes. The second wolf leaps for her flank, and its paws slide in the blood on the flagstones. It goes down hard on its side with a yelp, scrabbling to rise, claws skating through the red.

The torch gutters in her fist. The bear is closer than before, its wound weeping, and it has stopped feeding on anything but her.

Ref: initiative d10=7 → crows act first · ATTACK sword at bear R2, dim · S+3 · b · [6,2]=9(incl -2) → T1 · MISS · Ref: TEST · bear bite vs Mara R2 · +2 · [4,6]=12 → T2 · Ref: TEST · wolf1 bite vs Mara R2 (+1, +3 flank) · +4 · [9,2]=15 → T2 · Ref: TEST · wolf2 bite vs Mara R2 (+1, +3 flank) · +4 · [1,1]=6 → T1 DOOM

Chapel nave · DT 3 · round 2 · Stamina 17 · wounds 0/10 · torch lit (dim) · bear on her, one wolf biting, the other thrashing to its feet in the blood

## Turn 3
[PLAYER] PLAYER [4/7]: I turn on the nearest wolf.
[TOOLS]
$ python3 engine/engine.py init
Ref: initiative d10=7 → crows act first
$ python3 ledger.py attack --b 1 --exp --why "sword at wolf1 R3, dim"
ATTACK sword at wolf1 R3, dim · S+3 · b · [1,6]=8(incl -2) → T2 · expertise used (Slashing 2 left) · HIT 7 dam
STATUS Stamina 17 · AD 2 · wounds 0/10 · uses Slashing 2 · UD torch 1
(Ref: wolf1 10→3. Wolf2 stands as its maneuver, then attacks.)
$ python3 engine/engine.py test 2 --why "bear bite vs Mara R3"
Ref: TEST · bear bite vs Mara R3 · +2 · [1,1]=4 → T1 DOOM
$ python3 engine/engine.py test 4 --why "wolf1 bite vs Mara R3 (+1, +3 flank)"
Ref: TEST · wolf1 bite vs Mara R3 (+1, +3 flank) · +4 · [3,1]=8 → T1
$ python3 engine/engine.py test 4 --why "wolf2 bite vs Mara R3 (+1, +3 flank), stood up first"
Ref: TEST · wolf2 bite vs Mara R3 (+1, +3 flank), stood up first · +4 · [2,9]=15 → T2
$ python3 ledger.py take 3
LEDGER: took 3 (AD 2→0, Stamina 17→16, wounds 0→0)
STATUS Stamina 16 · AD 0 · wounds 0/10 · uses Slashing 2 · UD torch 1
[REF]
Mara wheels on the nearest wolf and her sword bites into its shoulder. It shrieks, a thin high sound, and its leg buckles. It is bleeding badly and still it comes, snapping at her hip, but the jaws catch only the mail and shake loose, wet and frantic.

The bear lunges at her again. Its paw lands wrong in the slick of blood and gore by the carcass, and its great weight goes out from under it. It crashes onto its side across the flagstones and flails, bellowing, jaws clapping at nothing, claws throwing up chips of stone.

The second wolf has found its feet. It slams into her from the other side, and this time the teeth get through. Her armor is spent. A hot line of pain opens under the plate at her ribs and her breath goes short. The wounded wolf backs a half step, whining, eyes on the torch.

The bear heaves up onto its forelegs, still on the ground.

Ref: initiative d10=7 → crows act first · ATTACK sword at wolf1 R3, dim · S+3 · b · [1,6]=8(incl -2) → T2 · expertise used (Slashing 2 left) · HIT 7 dam · Ref: TEST · bear bite vs Mara R3 · +2 · [1,1]=4 → T1 DOOM · Ref: TEST · wolf1 bite vs Mara R3 (+1, +3 flank) · +4 · [3,1]=8 → T1 · Ref: TEST · wolf2 bite vs Mara R3 (+1, +3 flank), stood up first · +4 · [2,9]=15 → T2

Chapel nave · DT 3 · round 3 · Stamina 16 · wounds 0/10 · torch lit (dim) · bear down on its side, the hurt wolf wavering, the other wolf at her ribs

## Turn 4
[PLAYER] PLAYER [5/7]: I hit the closest wolf again.
[TOOLS]
$ python3 engine/engine.py init
Ref: initiative d10=5 → enemies act first
(Ref: enemies resolve first; bear stands as maneuver then bites. Mara's attack below was rolled before enemy resolution, applied after.)
$ python3 engine/engine.py test 2 --why "bear bite vs Mara R4, stood up first"
Ref: TEST · bear bite vs Mara R4, stood up first · +2 · [8,3]=13 → T2
$ python3 engine/engine.py test 4 --why "wolf1 bite vs Mara R4 (+1, +3 flank)"
Ref: TEST · wolf1 bite vs Mara R4 (+1, +3 flank) · +4 · [5,6]=15 → T2
$ python3 engine/engine.py test 4 --why "wolf2 bite vs Mara R4 (+1, +3 flank)"
Ref: TEST · wolf2 bite vs Mara R4 (+1, +3 flank) · +4 · [2,2]=8 → T1
$ python3 ledger.py take 6
LEDGER: took 6 (AD 0→0, Stamina 16→10, wounds 0→0)
STATUS Stamina 10 · AD 0 · wounds 0/10 · uses Slashing 1 · UD torch 1
$ python3 ledger.py take 3
LEDGER: took 3 (AD 0→0, Stamina 10→7, wounds 0→0)
STATUS Stamina 7 · AD 0 · wounds 0/10 · uses Slashing 1 · UD torch 1
$ python3 ledger.py attack --b 1 --exp --why "sword at wolf1 R4, dim"
ATTACK sword at wolf1 R4, dim · S+3 · b · [1,3]=5(incl -2) → T2 · expertise used (Slashing 1 left) · HIT 7 dam
STATUS Stamina 16 · AD 0 · wounds 0/10 · uses Slashing 1 · UD torch 1
(Ref: wolf1 3 Stamina, takes 7, dead. Note: the ledger status line above was the pre-damage state because the attack was rolled before the take calls.)
[REF]
The bear is up before she can breathe, shaking blood from its fur, and it comes in with its whole weight behind its jaws. Teeth bite through the last of her armor and into the meat of her side, hot and deep. The wounded wolf lunges with it, a low snapping rush that opens her forearm. The unhurt wolf snaps at the air beside her ear and misses.

Mara hacks down at the hurt wolf. The sword goes in at the neck and the animal drops across her boots without a sound, a gray heap shuddering once and still. Blood runs warm into the cracks between the stones.

One wolf left, circling to her left with its lips peeled back, and behind it the bear, tall and furious, its flank heaving. Her breath comes ragged. The torch gives a smoky gutter, and the shadows of the nave lunge and recoil along the broken walls.

Ref: initiative d10=5 → enemies act first · Ref: TEST · bear bite vs Mara R4, stood up first · +2 · [8,3]=13 → T2 · Ref: TEST · wolf1 bite vs Mara R4 (+1, +3 flank) · +4 · [5,6]=15 → T2 · Ref: TEST · wolf2 bite vs Mara R4 (+1, +3 flank) · +4 · [2,2]=8 → T1 · ATTACK sword at wolf1 R4, dim · S+3 · b · [1,3]=5(incl -2) → T2 · expertise used (Slashing 1 left) · HIT 7 dam

Chapel nave · DT 3 · round 4 · Stamina 7 · wounds 0/10 · torch lit (dim) · one wolf dead, bear on her, the last wolf circling
