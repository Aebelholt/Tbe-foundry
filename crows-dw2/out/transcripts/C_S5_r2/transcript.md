## Turn 1
[PLAYER] PLAYER [1/17]: I plant myself in the corridor mouth with the torch behind me, and wait for the first one to come into reach.
(roll on request: none yet)
[TOOLS] (none; no roll called for)
[REF]
The cellar breathes cold against your back, and the torch behind you throws your shadow long down the corridor. Out in the dark, claws drag on flagstone, a dry, rhythmic scrape that is more than one set of feet. Two shapes come out of the black first, hunched, spines raised along their backs like rusted fence nails, their jaws working on nothing. They stop at the edge of the torchlight and tilt their heads at you. Behind them the scraping goes on, a column of it, stretching back into the corridor, too many to count by sound alone.

The nearer one leans forward, shoulders bunching, and its spines quiver as if drawing a bow.

Where: cellar corridor mouth · DT — · Stamina 17 · wounds 0/10 · torch lit (UD 1) · two razorbacks at the edge of the light, spines trembling, more coming behind

## Turn 2
[PLAYER] PLAYER [2/17]: I cut at the first one in reach.
(roll on request: attack / Trade Blows)
[TOOLS]
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [2,1]=6 → T1 DOOM · MISS
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "razorback 1 claws (engaged)"
Ref: TEST · razorback 1 claws (engaged) · +2 · [1,9]=12 → T2
$ python3 engine/engine.py test 2 --why "Move: unengaged razorback A spine"
Ref: TEST · Move: unengaged razorback A spine · +2 · [3,10]=15 → T2
$ python3 engine/engine.py test 2 --why "Move: unengaged razorback B spine"
Ref: TEST · Move: unengaged razorback B spine · +2 · [2,6]=10 → T1
$ python3 ledger.py take 3
LEDGER: took 3 (AD 25→22, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 22 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 2
LEDGER: took 2 (AD 22→20, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 20 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
You lunge, and the razorback is simply not where your blade goes. It drops low, your edge scrapes stone and sparks, and the clawed hand comes up under your guard and rakes across your armor, hard enough to rattle your teeth. A spine whips out of the dark and cracks against your shoulder plate. A second spine goes wide and sings off the wall behind you.

Then the column breaks. The four far shapes stop shuffling and crouch, and with a sound like wet leather snapping taut they leap, one after another, over the heads of the first two. They land in a ragged line at the edge of your torchlight, six pale faces now, all turned to you, all of them hungry in the same patient way.

Ref: Move: Escalate the situation · claws [1,9]=12 → T2 (3 dam) · spine [3,10]=15 → T2 (2 dam) · spine [2,6]=10 → T1
Where: cellar corridor mouth · Stamina 17 · AD 20 · wounds 0/10 · torch lit (UD 1) · six razorbacks packed at the edge of the light, one at your blade

## Turn 3
[PLAYER] PLAYER [3/17]: I hit the nearest one again.
[TOOLS]
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [5,4]=12 → T2 · HIT 7 dam
STATUS Stamina 17 · AD 20 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "razorback 1 claws (engaged)"
Ref: TEST · razorback 1 claws (engaged) · +2 · [10,7]=19 → T3
$ python3 ledger.py take 4
LEDGER: took 4 (AD 20→16, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 16 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
Your blade bites this time. It opens the razorback from collarbone to ribs, and what spills out is dry as old sawdust, but the thing does not care. It folds around the wound and rakes you anyway, a full, vicious swipe across your chest. The armor takes it, groaning, rings knocked loose and a long bright scar cut through the leather.

It is hurt badly, swaying, spines flat against its back. The others have not moved. They watch from the edge of the light, heads tilted, patient, as if waiting to see how much of you the first one can wear down. The torch behind you spits and the flame leans toward the corridor.

Ref: TEST · razorback 1 claws (engaged) · +2 · [10,7]=19 → T3
Where: cellar corridor mouth · Stamina 17 · AD 16 · wounds 0/10 · torch lit (UD 1) · wounded razorback at your blade, five more waiting just past the light
