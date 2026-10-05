## Turn 1
[PLAYER] PLAYER [1/14]: I enter the cellar by the stair and look the first room over before stepping in.
[TOOLS]
$ python3 engine/engine.py roll d6 --why "DT1 length (rooms)"
Ref: d6 [4]=4 · DT1 length (rooms)
[REF] The stair drops you into a low landing where the chapel's cellar has taken on water, a skin of black wet lying over the flagstones and shivering with each drip from above. Your torch throws a short orange circle. Claw marks, four parallel grooves, score the door frame ahead, deep enough to hold a fingernail of pale grit. The air has a stench of old rot, sweet and heavy, and it clings to the back of your throat. Nothing moves on the landing. Beyond the scarred frame a dark doorway breathes a colder draught, and somewhere past it water ticks steadily into water.

Ref: d6 [4]=4 · DT1 length (rooms)

Cellar landing · DT 1 (rooms 1/4) · Stamina 17 · wounds 0/10 · torch lit (UD 1) · the scarred doorway stands open ahead, and the draught is pulling your flame sideways

## Turn 2
[PLAYER] PLAYER [2/14]: I search the first room carefully, checking the floor and the shelves.
[TOOLS] (none; empty landing, no consequence, no roll)
[REF] You work the landing slowly, torch low. The floor is slick flag under an inch of cold water, and your boot finds nothing in it but grit and a bent nail. There are no shelves here, only a ledge of wet stone along one wall where something rotten has left a long dark stain. The claw grooves on the door frame run from knee height to well above your head, and the wood around them is soft and swollen. Whatever made them is not here now. The water on the landing stirs in small rings, though nothing has touched it. Past the frame, the next room waits in complete dark, and the draught carries the rot stench stronger than before.

Cellar landing · DT 1 (rooms 1/4) · Stamina 17 · wounds 0/10 · torch lit (UD 1) · the landing is bare, and the dark doorway is the only way on

## Turn 3
[PLAYER] PLAYER [3/14]: I step across the room to the far door.
[TOOLS] (none; Mara moves to area 2)
[REF] You wade the landing and duck under the clawed frame. The door beyond has rotted off one hinge and hangs against the wall, so you pass without touching it. The next room is a storeroom, long and low, ribs of fallen shelving heaped along its left side. Under one collapsed shelf a chest sits half buried, its iron bands rusted orange, one corner crushed beneath the weight of splintered planks. Charred black marks stain the lid and the stone around it, and a few pale grey embers lie scattered in the water like dead eyes. The rot smell is thinner here, replaced by old smoke. On the far wall a second doorway opens into black.

Storeroom · DT 1 (rooms 2/4) · Stamina 17 · wounds 0/10 · torch lit (UD 1) · the chest lies pinned under the shelf, with scorch marks and cold embers around it

## Turn 4
[PLAYER] PLAYER [4/14]: I deal with whatever comes through, sword first. Torch high.
[TOOLS] (none; nothing has come through, no attack to roll)
[REF] You raise the torch and settle the sword, and the storeroom answers with nothing at all. The flame lifts your shadow up the heaped shelving and the shadow stays alone. Then, from the far doorway, comes a dry sound: bone-hard scraping on stone, slow, stopping, starting again, the sound of something dragging a claw along a pillar as it passes. It is not coming closer. It is waiting in the dark beyond, patient in the way the dead are patient. The chest lies at your feet under its shelf, and the scorch marks around it look newer in the high light than they did a moment ago.

Storeroom · DT 1 (rooms 2/4) · Stamina 17 · wounds 0/10 · torch lit (UD 1) · something scrapes stone beyond the far doorway, and the chest is still untouched at your feet

## Turn 5
[PLAYER] PLAYER [5/14]: I press on the nearest one.
[TOOLS]
$ python3 engine/engine.py init
Ref: initiative d10=8 → crows act first
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [9,4]=16 → T2 · HIT 7 dam
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "Undead A1 claws vs Mara"
Ref: TEST · Undead A1 claws vs Mara · +2 · [1,5]=8 → T1
$ python3 engine/engine.py test 2 --why "Undead A2 leap+claws vs Mara"
Ref: TEST · Undead A2 leap+claws vs Mara · +2 · [6,5]=13 → T2
$ python3 ledger.py take 2
LEDGER: took 2 (AD 25→23, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 23 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF] You go through the far doorway into a crypt hall, pillars marching away into the dark, and the nearest of them hides a shape that unfolds as you come, a long grey thing, all spine and rag, claws raking up. Your blade meets it first and bites deep into its side, bone cracking, but the cut leaves you in the open and the hall stirs. The wounded thing swipes and finds only air. A second razorback drops from the dark above a sarcophagus lid in one long leap and rakes your shoulder, the claws skittering off your armor. A third stands motionless behind a far pillar, its spines lifting slowly like hackles.

Ref: TEST · Undead A1 claws vs Mara · +2 · [1,5]=8 → T1
Ref: TEST · Undead A2 leap+claws vs Mara · +2 · [6,5]=13 → T2
ATTACK attack · S+3 · - · [9,4]=16 → T2 · HIT 7 dam
LEDGER: took 2 (AD 25→23, Stamina 17→17, wounds 0/10)

Crypt hall · DT 1 (rooms 3/4) · round 2 · Stamina 17 · wounds 0/10 · torch lit (UD 1) · the wounded razorback hisses at your blade-arm while the second one crouches at your shoulder and the third lifts its spines

## Turn 6
[PLAYER] PLAYER [6/14]: I finish them and move on to the next room.
[TOOLS]
$ python3 engine/engine.py init
Ref: initiative d10=6 → crows act first
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [2,3]=8 → T1 · MISS
STATUS Stamina 17 · AD 23 · wounds 0/10 · uses Slashing 3 · UD torch 1
(melee miss: Undead A1 counters at its claws T2 = 2 dam)
$ python3 ledger.py take 2
LEDGER: took 2 (AD 23→21, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 21 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "Undead A1 claws vs Mara"
Ref: TEST · Undead A1 claws vs Mara · +2 · [7,5]=14 → T2
$ python3 engine/engine.py test 2 --why "Undead A2 claws vs Mara"
Ref: TEST · Undead A2 claws vs Mara · +2 · [7,2]=11 → T1
$ python3 engine/engine.py test 2 --why "Undead A3 spine vs Mara"
Ref: TEST · Undead A3 spine vs Mara · +2 · [1,3]=6 → T1
$ python3 ledger.py take 2
LEDGER: took 2 (AD 21→19, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 19 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF] Your swing goes wide and the wounded razorback ducks inside it, claws stitching a hot line across your ribs as your own guard opens. You turn to meet it and it rakes you again, mail screaming under the points. The second thing lunges for your throat and slides off your shoulder strap, and the third flings a spine that skips off a pillar and rattles away across the flags. None of them has run. The hall is full of the sound of dry claws on stone and your own breath, and the nearest razorback is still on its feet, one side stove in, grinning at you through a face with too many teeth.

Ref: TEST · Undead A1 claws vs Mara · +2 · [7,5]=14 → T2
Ref: TEST · Undead A2 claws vs Mara · +2 · [7,2]=11 → T1
Ref: TEST · Undead A3 spine vs Mara · +2 · [1,3]=6 → T1
ATTACK attack · S+3 · - · [2,3]=8 → T1 · MISS
LEDGER: took 2 + 2 (AD 23→19, Stamina 17→17, wounds 0/10)

Crypt hall · DT 1 (rooms 3/4) · round 3 · Stamina 17 · wounds 0/10 · torch lit (UD 1) · three razorbacks still stand around you, the nearest one barely holding together

## Turn 7
[PLAYER] PLAYER [7/14]: I open the next door and go in.
[TOOLS]
$ python3 engine/engine.py init
Ref: initiative d10=10 → crows act first
(Mara: Move + open door, two maneuvers, no roll)
$ python3 engine/engine.py test 2 --why "Undead A1 leap+claws vs Mara"
Ref: TEST · Undead A1 leap+claws vs Mara · +2 · [4,8]=14 → T2
$ python3 engine/engine.py test 2 --why "Undead A2 leap+claws vs Mara"
Ref: TEST · Undead A2 leap+claws vs Mara · +2 · [5,6]=13 → T2
$ python3 engine/engine.py test 2 --why "Undead A3 spine vs Mara"
Ref: TEST · Undead A3 spine vs Mara · +2 · [8,8]=18 → T3
$ python3 ledger.py take 2
LEDGER: took 2 (AD 19→17, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 17 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 2
LEDGER: took 2 (AD 17→15, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 15 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 3
LEDGER: took 3 (AD 15→12, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 12 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF] You break from the knot of them and cross the hall at a run, torch streaming, pillars flashing past on both sides. The far door is old oak gone green; you throw your shoulder into it and it grinds inward on a room of shelves and pale stacked shapes. You have the door open. Behind you the razorbacks come in one long bound, claws catching your back and flank, and a flung spine punches through your guard and bites deep into your armor. Mail rings, plates dent. All three are close now, the broken one scrabbling over a toppled pillar to reach you, and the open door yawns before you with bones stacked to the ceiling.

Ref: TEST · Undead A1 leap+claws vs Mara · +2 · [4,8]=14 → T2
Ref: TEST · Undead A2 leap+claws vs Mara · +2 · [5,6]=13 → T2
Ref: TEST · Undead A3 spine vs Mara · +2 · [8,8]=18 → T3
LEDGER: took 2 + 2 + 3 (AD 19→12, Stamina 17→17, wounds 0/10)

Crypt hall doorway · DT 1 (rooms 3/4) · round 4 · Stamina 17 · wounds 0/10 · torch lit (UD 1) · the ossuary door stands open ahead, and the three razorbacks are on your back

