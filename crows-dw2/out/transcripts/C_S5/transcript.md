## Turn 1
[PLAYER] PLAYER [1/17]: I plant myself in the corridor mouth with the torch behind me, and wait for the first one to come into reach.
(roll on request: none yet)
[TOOLS] python3 player.py S5 -> (as above); python3 ledger.py status not re-run
[REF] The torch hisses at your back and throws your shadow down the corridor ahead of you. Wet stone, old mortar dust. Something drags along the flagstones out there, and then a second something, a dry scrape of long bone-claws on rock. Two shapes step into the edge of the light, gray and ridged along the spine like split barrels, their jaws hanging loose. Behind them the dark is full of the same scraping, a column of it, shuffling closer. The nearer one lifts its head toward the heat of the torch and its spine-ridge bristles. It leans forward and comes on, claws ticking.

Cellar corridor mouth · combat, no DT count · Stamina 17 · wounds 0/10 · torch lit (UD 1) · the nearest razorback is a stride from reach

## Turn 2
[PLAYER] PLAYER [2/17]: I cut at the first one in reach.
(roll on request: attack / Trade Blows)
[TOOLS] python3 ledger.py attack
ATTACK attack · S+3 · - · [5,7]=15 → T2 · HIT 7 dam
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
python3 engine/engine.py test 2 --why "razorback A1 claws"
Ref: TEST · razorback A1 claws · +2 · [7,3]=12 → T2
python3 ledger.py take 3
LEDGER: took 3 (AD 25→22, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 22 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF] Your blade bites deep into the razorback's shoulder and black grit spills from the cut. It does not slow. Its claws rake across your guard and rattle on your armor, scoring the plates and leaving a bright scar in the metal. Behind it, the second razorback has slid up beside the wall, a body-length off, head low. Further back the column keeps coming, four more shapes in the gloom, spines clicking like dry reeds.

Ref: TEST · razorback A1 claws · +2 · [7,3]=12 → T2

Cellar corridor mouth · combat · Stamina 17 · wounds 0/10 · torch lit (UD 1) · the wounded razorback is still on you, the second is edging along the wall

## Turn 3
[PLAYER] PLAYER [3/17]: I hit the nearest one again.
[TOOLS] python3 ledger.py attack
ATTACK attack · S+3 · - · [9,5]=17 → T3 · HIT 10 dam
STATUS Stamina 17 · AD 22 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF] The second stroke takes the razorback through the neck and the head leaves its shoulders with a sound like a snapped branch. The body folds, claws still twitching, and slides against the wall. There is no time to breathe. The second razorback steps over the wreck without a glance and crouches in the torchlight, close enough that you can see the stitched seams along its ribs. The four behind have bunched up in the narrow throat of the corridor, pushing, spines rattling against each other. One of them coughs out a thin whistle and its barbs lift toward you.

Cellar corridor mouth · combat · Stamina 17 · wounds 0/10 · torch lit (UD 1) · a second razorback crouches within reach, four more bunched behind it

## Turn 4
[PLAYER] PLAYER [4/17]: I hit the nearest one again.
[TOOLS] python3 ledger.py attack
ATTACK attack · S+3 · - · [8,9]=20 → T3 · HIT 10 dam
STATUS Stamina 17 · AD 22 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF] Your swing opens the crouching razorback from collarbone to hip. It drops without a sound, its stitched ribs splitting and spilling dust and old rags across the flags. Two down. The corridor mouth is littered now, and the next one has to climb over the heap to reach you, claws scrabbling for purchase on its own dead. The torch gutters in a draft that smells of rot and wet iron. Behind the climber a second razorback hangs back in the dark, spine-ridge lifting and lowering, and two more press up behind it, their eyes catching the light like coins in a well.

Cellar corridor mouth · combat · Stamina 17 · wounds 0/10 · torch lit (UD 1) · a third razorback is scrabbling over the dead toward you

## Turn 5
[PLAYER] PLAYER [6/17]: I keep cutting the nearest one.
[TOOLS] python3 ledger.py attack
ATTACK attack · S+3 · - · [8,2]=13 → T2 · HIT 7 dam
STATUS Stamina 17 · AD 22 · wounds 0/10 · uses Slashing 3 · UD torch 1
python3 engine/engine.py test 2 --why "razorback A3 claws"
Ref: TEST · razorback A3 claws · +2 · [7,9]=18 → T3
python3 ledger.py take 4
LEDGER: took 4 (AD 22→18, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 18 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF] Your blade sinks into the climbing razorback's flank and it screams, a thin whistling sound, still coming. Its claws take you across the chest in a wide slash that bites the armor plates hard and leaves them hanging a little looser than before. Dust drifts down from the ceiling. The wounded razorback is perched on the heap of its dead kin, half its side hanging open, and the one behind it has found a gap along the wall and is pushing forward, spines trembling.

Ref: TEST · razorback A3 claws · +2 · [7,9]=18 → T3

Cellar corridor mouth · combat · Stamina 17 · wounds 0/10 · torch lit (UD 1) · the hurt razorback is on you and a fourth is slipping along the wall

## Turn 6
[PLAYER] PLAYER [7/17]: I keep cutting the nearest one.
[TOOLS] python3 ledger.py attack
ATTACK attack · S+3 · - · [6,10]=19 → T3 · HIT 10 dam
STATUS Stamina 17 · AD 18 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF] The blow lands clean and the razorback comes apart at the hip, the lower half skidding into the wall. Three are down. The fourth is already on the heap, quick, nothing like the lumbering ones before it, and its jaw is working as if it were tasting the air around you. Its claws are held low and wide. Past it, the last two crowd in the doorway of the dark, one of them with its spine-ridge flared and pointed at your face, a long ratchet of bone sliding in its back.

Cellar corridor mouth · combat · Stamina 17 · wounds 0/10 · torch lit (UD 1) · a fourth razorback is on you, a fifth has its spines aimed at your face

## Turn 7
[PLAYER] PLAYER [8/17]: I keep cutting the nearest one.
[TOOLS] python3 ledger.py attack
ATTACK attack · S+3 · - · [5,1]=9 → T1 · MISS
STATUS Stamina 17 · AD 18 · wounds 0/10 · uses Slashing 3 · UD torch 1
python3 engine/engine.py test 2 --why "razorback A4 claws"
Ref: TEST · razorback A4 claws · +2 · [5,7]=14 → T2
python3 engine/engine.py test 2 --why "razorback A5 spine (Move: Escalate)"
Ref: TEST · razorback A5 spine (Move: Escalate) · +2 · [10,3]=15 → T2
python3 ledger.py take 3
LEDGER: took 3 (AD 18→15, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 15 · wounds 0/10 · uses Slashing 3 · UD torch 1
python3 ledger.py take 2
LEDGER: took 2 (AD 15→13, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 13 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF] Your cut goes wide and the razorback slips inside it, dragging its claws down your arm and across your ribs. The armor takes it, loudly. Then the fifth one does something the others did not: it crouches and springs, clearing the heap and the fourth's back, and a spine whips out from its ridge and rattles off your breastplate as it lands at your flank. Two of them now, one at each shoulder, the torch throwing your shadow wide between them. Past the heap the last razorback waits at the edge of the light, still, watching.

Ref: TEST · razorback A4 claws · +2 · [5,7]=14 → T2
Ref: TEST · razorback A5 spine (Move: Escalate) · +2 · [10,3]=15 → T2
Move: Escalate the situation

Cellar corridor mouth · combat · Stamina 17 · wounds 0/10 · torch lit (UD 1) · two razorbacks pressing at your shoulders, the last holding back in the dark

## Turn 8
[PLAYER] PLAYER [9/17]: I keep cutting the nearest one.
[TOOLS] python3 ledger.py attack
ATTACK attack · S+3 · - · [3,4]=10 → T1 · MISS
STATUS Stamina 17 · AD 13 · wounds 0/10 · uses Slashing 3 · UD torch 1
python3 engine/engine.py test 2 --why "razorback A4 claws"
Ref: TEST · razorback A4 claws · +2 · [8,5]=15 → T2
python3 engine/engine.py test 2 --why "razorback A5 claws (Move: Take something away)"
Ref: TEST · razorback A5 claws · +2 · [4,3]=9 → T1
python3 ledger.py take 3
LEDGER: took 3 (AD 13→10, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 10 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF] You cut high and the razorback ducks under it. Its claws catch your armor and shave off a curl of metal. At your flank the second one swipes and misses, and the blade of its reach drags your sleeve instead. But the pair of them have closed the corridor mouth between them. Your back is nearly to the wall now, the heap of dead at your feet, the torch crackling on its bracket and its light thinning. The last razorback has not moved. It stands at the far edge of the light, and there is no way past the two in front of it except through them.

Ref: TEST · razorback A4 claws · +2 · [8,5]=15 → T2
Ref: TEST · razorback A5 claws (Move: Take something away) · +2 · [4,3]=9 → T1
Move: Take something away

Cellar corridor mouth · combat · Stamina 17 · wounds 0/10 · torch lit (UD 1) · two razorbacks at your shoulders, your back near the wall

## Turn 9
[PLAYER] PLAYER [10/17]: I keep cutting the nearest one.
[TOOLS] python3 ledger.py attack
ATTACK attack · S+3 · - · [1,1]=5 → T1 DOOM · MISS
STATUS Stamina 17 · AD 10 · wounds 0/10 · uses Slashing 3 · UD torch 1
python3 engine/engine.py test 2 --e 1 --why "razorback A4 claws, crow off balance (doom ruling)"
Ref: TEST · razorback A4 claws, crow off balance (doom ruling) · +2 · e · [5,5]=14 → T2
python3 engine/engine.py test 2 --e 1 --why "razorback A5 claws (Move: Have it backfire)"
Ref: TEST · razorback A5 claws (Move: Have it backfire) · +2 · e · [9,3]=16 → T2
python3 ledger.py take 3
LEDGER: took 3 (AD 10→7, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 7 · wounds 0/10 · uses Slashing 3 · UD torch 1
python3 ledger.py take 3
LEDGER: took 3 (AD 7→4, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 4 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF] Your swing is wild. Your boot comes down on a dead razorback's slick ribs and slides, and your own blade rings off the wall in a shower of sparks. You catch yourself, barely, but you are off balance and both of them are in, claws raking over your shoulder and down your side. The armor groans, and in one place it splits clean through, the plate dangling from a strap. Cold air from the corridor touches the skin beneath. The last razorback has finally started forward, slowly, its claws clicking on the stone.

Ref: TEST · razorback A4 claws, crow off balance (doom ruling) · +2 · e · [5,5]=14 → T2
Ref: TEST · razorback A5 claws (Move: Have it backfire) · +2 · e · [9,3]=16 → T2
Move: Have it backfire

Cellar corridor mouth · combat · Stamina 17 · wounds 0/10 · torch lit (UD 1) · armor nearly gone, two razorbacks tearing at you, the third coming
