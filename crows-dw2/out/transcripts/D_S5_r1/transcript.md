## Turn 1
[PLAYER] PLAYER [1/17]: I plant myself in the corridor mouth with the torch behind me, and wait for the first one to come into reach.
[TOOLS]
$ python3 engine/engine.py init
Ref: initiative d10=4 → enemies act first
$ python3 engine/engine.py test 2 --why "razorback 1 claws vs Mara"
Ref: TEST · razorback 1 claws vs Mara · +2 · [4,5]=11 → T1
$ python3 engine/engine.py test 2 --why "razorback 2 spine vs Mara"
Ref: TEST · razorback 2 spine vs Mara · +2 · [1,4]=7 → T1
[REF]
The scrape of bone on stone comes up the corridor ahead of the things themselves. Torchlight pushes a few paces into the dark behind you and shows you the first of them: a gaunt, hunched shape with a ridge of splintered spines down its back, dragging itself along the wall. It doesn't walk the last stretch. It springs, and its claws rake at the air where you stand, a hand's breadth short as you hold your ground. Behind it a second one rears up and flicks its back; a spine whistles past your ear and cracks against the cellar wall. Farther down the passage, past the reach of the light, more scraping, many of them, strung out in a slow column.

Ref: initiative d10=4 → enemies act first · TEST razorback claws [4,5]=11 → T1 (miss) · TEST razorback spine [1,4]=7 → T1 (miss)

Corridor mouth, cellar · DT 1 · round 1 · Stamina 17 · wounds 0/10 · torch lit · the first razorback is on you, and the next one is lining up another spine.

## Turn 2
[PLAYER] PLAYER [2/17]: I cut at the first one in reach.
[TOOLS]
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [6,6]=15 → T2 · HIT 7 dam
$ python3 engine/engine.py init
Ref: initiative d10=1 → enemies act first
$ python3 engine/engine.py test 2 --why "razorback 1 claws vs Mara"
Ref: TEST · razorback 1 claws vs Mara · +2 · [4,5]=11 → T1
$ python3 engine/engine.py test 2 --why "razorback 2 spine vs Mara"
Ref: TEST · razorback 2 spine vs Mara · +2 · [1,3]=6 → T1
[REF]
Your blade bites deep into the leaping thing's shoulder and comes away trailing grey, dry gristle. It shrieks, a sound like a hinge, and does not stop. The next moment it is on you again, claws slashing in a wide arc. You turn them with your guard and the strike glances off. Over its shoulder the second razorback flicks another spine, and this one skitters off the stone at your feet. The hurt one sags on its legs, one arm hanging, but its jaws keep working. The scraping in the dark grows louder: the column is closing, shapes shouldering in tight behind the first two.

Ledger: ATTACK attack · S+3 · [6,6]=15 → T2 · HIT 7 dam
Ref: initiative d10=1 → enemies act first · TEST razorback claws [4,5]=11 → T1 (miss) · TEST razorback spine [1,3]=6 → T1 (miss)

Corridor mouth, cellar · DT 1 · round 2 · Stamina 17 · wounds 0/10 · torch lit · the wounded razorback is still on you, and more shapes press in behind it.

## Turn 3
[PLAYER] PLAYER [3/17]: I hit the nearest one again.
[TOOLS]
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [7,1]=11 → T1 · MISS
$ python3 engine/engine.py init
Ref: initiative d10=5 → enemies act first
$ python3 ledger.py take 2
LEDGER: took 2 (AD 25→23, Stamina 17→17, wounds 0→0)
$ python3 engine/engine.py test 2 --why "razorback 1 claws vs Mara"
Ref: TEST · razorback 1 claws vs Mara · +2 · [1,4]=7 → T1
$ python3 engine/engine.py test 2 --why "razorback 2 spine vs Mara"
Ref: TEST · razorback 2 spine vs Mara · +2 · [9,9]=20 → T3
$ python3 engine/engine.py test 2 --why "razorback 3 spine vs Mara"
Ref: TEST · razorback 3 spine vs Mara · +2 · [10,8]=20 → T3
$ python3 ledger.py take 3
LEDGER: took 3 (AD 23→20, Stamina 17→17, wounds 0→0)
$ python3 ledger.py take 3
LEDGER: took 3 (AD 20→17, Stamina 17→17, wounds 0→0)
[REF]
Your swing goes wide and the wounded razorback twists inside it, raking you across the guard for a few scratches that the leather turns. Before you can reset, two spines come whistling out of the dark in the same breath and both find you, hammering into your armor with a wet crack. The attacker in front lurches closer, mouth working, its dead breath rank in the torchlight. The column behind it has bunched up, three, four shapes now, a tide of splintered backs shouldering for room in the narrow way.

Ledger: ATTACK attack · S+3 · [7,1]=11 → T1 · MISS
Ref: initiative d10=5 → enemies act first · counter 2 dam (T2) · TEST claws [1,4]=7 → T1 · TEST spine [9,9]=20 → T3 (3 dam) · TEST spine [10,8]=20 → T3 (3 dam)

Corridor mouth, cellar · DT 1 · round 3 · Stamina 17 · wounds 0/10 · torch lit · three razorbacks have reach on you and a fourth is pushing up behind them.

## Turn 4
[PLAYER] PLAYER [4/17]: I hit the nearest one again.
[TOOLS]
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [3,9]=15 → T2 · HIT 7 dam
$ python3 engine/engine.py init
Ref: initiative d10=1 → enemies act first
$ python3 engine/engine.py test 2 --why "razorback 2 claws vs Mara"
Ref: TEST · razorback 2 claws vs Mara · +2 · [7,1]=10 → T1
$ python3 engine/engine.py test 2 --why "razorback 3 spine vs Mara"
Ref: TEST · razorback 3 spine vs Mara · +2 · [7,4]=13 → T2
$ python3 engine/engine.py test 2 --why "razorback 4 spine vs Mara"
Ref: TEST · razorback 4 spine vs Mara · +2 · [5,10]=17 → T3
$ python3 ledger.py take 1
LEDGER: took 1 (AD 17→16, Stamina 17→17, wounds 0→0)
$ python3 ledger.py take 3
LEDGER: took 3 (AD 16→13, Stamina 17→17, wounds 0→0)
[REF]
Your blade comes down through the razorback's collarbone and it folds, finally, collapsing in a clatter of dry bone that the torchlight swallows. There is no pause. Another is already stepping over the wreck, claws sweeping at your head, and you bat them aside. Two spines come out of the gloom together, one a bare sting that barely marks the leather, the other punching hard into your armor and rattling you to the teeth. The air behind them is thick with the dry scrape of more bodies. The corridor mouth is a shoulder-width of stone and you are the cork in it.

Ledger: ATTACK attack · S+3 · [3,9]=15 → T2 · HIT 7 dam
Ref: initiative d10=1 → enemies act first · TEST claws [7,1]=10 → T1 · TEST spine [7,4]=13 → T2 (1 dam) · TEST spine [5,10]=17 → T3 (3 dam)

Corridor mouth, cellar · DT 1 · round 4 · Stamina 17 · wounds 0/10 · torch lit · one razorback down; a fresh one claws at you while two more spit spines over its shoulder.

## Turn 5
[PLAYER] PLAYER [6/17]: I keep cutting the nearest one.
[TOOLS]
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [6,5]=14 → T2 · HIT 7 dam
$ python3 engine/engine.py init
Ref: initiative d10=2 → enemies act first
$ python3 engine/engine.py test 2 --why "razorback 2 claws vs Mara"
Ref: TEST · razorback 2 claws vs Mara · +2 · [8,7]=17 → T3
$ python3 engine/engine.py test 2 --why "razorback 3 spine vs Mara"
Ref: TEST · razorback 3 spine vs Mara · +2 · [4,9]=15 → T2
$ python3 engine/engine.py test 2 --why "razorback 4 spine vs Mara"
Ref: TEST · razorback 4 spine vs Mara · +2 · [7,6]=15 → T2
$ python3 ledger.py take 4
LEDGER: took 4 (AD 13→9, Stamina 17→17, wounds 0→0)
$ python3 ledger.py take 1
LEDGER: took 1 (AD 9→8, Stamina 17→17, wounds 0→0)
$ python3 ledger.py take 1
LEDGER: took 1 (AD 8→7, Stamina 17→17, wounds 0→0)
[REF]
The steel catches the new razorback across the ribs and a slab of grey flesh peels away, leaving it listing. It answers with a savage hooked slash that hammers into your armor and splits the leather along the shoulder, and the strap bites hard. Two more spines glance in, thin stings that skid along the plates. Your guard is wearing through, the straps loose and the padding crushed flat, and the thing in front of you is still coming, ragged and one-handed, its eyes fixed on the torch at your back. Beyond it the column has stopped shouldering and simply waits its turn, three pairs of dead eyes catching the light.

Ledger: ATTACK attack · S+3 · [6,5]=14 → T2 · HIT 7 dam
Ref: initiative d10=2 → enemies act first · TEST claws [8,7]=17 → T3 (4 dam) · TEST spine [4,9]=15 → T2 (1 dam) · TEST spine [7,6]=15 → T2 (1 dam)

Corridor mouth, cellar · DT 1 · round 5 · Stamina 17 · wounds 0/10 · torch lit · the maimed razorback is still on you and your armor is nearly through.

## Turn 6
[PLAYER] PLAYER [7/17]: I keep cutting the nearest one.
[TOOLS]
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [7,3]=13 → T2 · HIT 7 dam
$ python3 engine/engine.py init
Ref: initiative d10=2 → enemies act first
$ python3 engine/engine.py test 2 --why "razorback 3 claws vs Mara"
Ref: TEST · razorback 3 claws vs Mara · +2 · [1,4]=7 → T1
$ python3 engine/engine.py test 2 --why "razorback 4 spine vs Mara"
Ref: TEST · razorback 4 spine vs Mara · +2 · [7,4]=13 → T2
$ python3 engine/engine.py test 2 --why "razorback 5 spine vs Mara"
Ref: TEST · razorback 5 spine vs Mara · +2 · [1,5]=8 → T1
$ python3 ledger.py take 1
LEDGER: took 1 (AD 7→6, Stamina 17→17, wounds 0→0)
[REF]
The maimed razorback takes your next stroke through the neck and goes down in pieces, and the corridor mouth is briefly yours. Not for long. Another scrambles over the heap, claws raking at nothing as you shift your weight, and a spine from the dark clips your armor with a faint tick. A second whistles harmlessly into the cellar behind you, and hisses where it strikes the torch's glow. Two of the six lie broken on the floor. The rest are closer than they were, the nearest near enough that you can smell the char on its hide.

Ledger: ATTACK attack · S+3 · [7,3]=13 → T2 · HIT 7 dam
Ref: initiative d10=2 → enemies act first · TEST claws [1,4]=7 → T1 · TEST spine [7,4]=13 → T2 (1 dam) · TEST spine [1,5]=8 → T1

Corridor mouth, cellar · DT 1 · round 6 · Stamina 17 · wounds 0/10 · torch lit · a fresh razorback is over the bodies and on you, with three more behind it.

## Turn 7
[PLAYER] PLAYER [8/17]: I keep cutting the nearest one.
[TOOLS]
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [4,7]=14 → T2 · HIT 7 dam
$ python3 engine/engine.py init
Ref: initiative d10=6 → crows act first
[REF]
You open the razorback's flank to the spine, and it staggers into the wall, one arm dragging, black ichor drooling from the wound. It is still standing, still reaching, hooked fingers scrabbling for your guard. For one breath the passage is quiet but for the dry rattle of their bodies and the hiss of the torch behind you. The three behind it have stopped hanging back. They crowd forward, spines lifted, and the lead one coils itself low as though to leap the cripple. The way is yours to take a breath in, but only just.

Ledger: ATTACK attack · S+3 · [4,7]=14 → T2 · HIT 7 dam
Ref: initiative d10=6 → crows act first

Corridor mouth, cellar · DT 1 · round 7 · Stamina 17 · wounds 0/10 · torch lit · the wounded razorback sags in front of you while three more bunch up behind it, ready to spring.

## Turn 8
[PLAYER] PLAYER [9/17]: I keep cutting the nearest one.
[TOOLS]
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [9,5]=17 → T3 · HIT 10 dam
$ python3 engine/engine.py test 2 --why "razorback 4 claws vs Mara"
Ref: TEST · razorback 4 claws vs Mara · +2 · [5,2]=9 → T1
$ python3 engine/engine.py test 2 --why "razorback 5 spine vs Mara"
Ref: TEST · razorback 5 spine vs Mara · +2 · [6,10]=18 → T3
$ python3 engine/engine.py test 2 --why "razorback 6 spine vs Mara"
Ref: TEST · razorback 6 spine vs Mara · +2 · [8,7]=17 → T3
$ python3 engine/engine.py init
Ref: initiative d10=4 → enemies act first
$ python3 ledger.py take 3
LEDGER: took 3 (AD 6→3, Stamina 17→17, wounds 0→0)
$ python3 ledger.py take 3
LEDGER: took 3 (AD 3→0, Stamina 17→17, wounds 0→0)
[REF]
You hit the crippled razorback with everything behind it and it comes apart at the hip, the two halves of it flopping into the dark. Three left. The nearest springs over the wreckage and claws at you, and you shoulder the blow away. But the two behind it let fly together, and both spines punch home, one after the other. Your armor groans, a strap parts, and something heavy slides off your shoulder and clatters to the stone. Whatever is left of its padding is gone. You can feel the next hit land on flesh.

Ledger: ATTACK attack · S+3 · [9,5]=17 → T3 · HIT 10 dam
Ref: initiative d10=4 → enemies act first · TEST claws [5,2]=9 → T1 · TEST spine [6,10]=18 → T3 (3 dam) · TEST spine [8,7]=17 → T3 (3 dam)

Corridor mouth, cellar · DT 1 · round 8 · Stamina 17 · wounds 0/10 · torch lit · three razorbacks left, your armor is gone, and the lead one is on you again.

## Turn 9
[PLAYER] PLAYER [10/17]: I keep cutting the nearest one.
[TOOLS]
$ python3 engine/engine.py test 2 --why "razorback 4 claws vs Mara"
Ref: TEST · razorback 4 claws vs Mara · +2 · [1,9]=12 → T2
$ python3 engine/engine.py test 2 --why "razorback 5 spine vs Mara"
Ref: TEST · razorback 5 spine vs Mara · +2 · [9,4]=15 → T2
$ python3 engine/engine.py test 2 --why "razorback 6 spine vs Mara"
Ref: TEST · razorback 6 spine vs Mara · +2 · [10,6]=18 → T3
$ python3 ledger.py take 2
LEDGER: took 2 (AD 0→0, Stamina 17→15, wounds 0→0)
$ python3 ledger.py take 1
LEDGER: took 1 (AD 0→0, Stamina 15→14, wounds 0→0)
$ python3 ledger.py take 3
LEDGER: took 3 (AD 0→0, Stamina 14→11, wounds 0→0)
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [8,8]=19 → T3 · HIT 10 dam
$ python3 engine/engine.py init
Ref: initiative d10=8 → crows act first
[REF]
The lead razorback's claws find you first, and this time there is nothing between them and you. They rake across your ribs, hot and wet, and a spine, then a second, stings into your side and thigh. You feel the cold go in. Then your blade comes round in a clean, brutal arc and takes the thing's head off at the neck. The body folds. The others scrabble over their fallen, and the nearest is only now straightening and drawing its claws back, close enough that its breath fouls the torch smoke.

Ledger: ATTACK attack · S+3 · - · [8,8]=19 → T3 · HIT 10 dam
Ref: TEST claws [1,9]=12 → T2 (2 dam) · TEST spine [9,4]=15 → T2 (1 dam) · TEST spine [10,6]=18 → T3 (3 dam) · initiative d10=8 → crows act first

Corridor mouth, cellar · DT 1 · round 8 · Stamina 11 · wounds 0/10 · torch lit · two razorbacks left, and you have the first move next round.

## Turn 10
[PLAYER] PLAYER [11/17]: I keep cutting the nearest one.
[TOOLS]
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [7,10]=20 → T3 · HIT 10 dam
$ python3 engine/engine.py test 2 --why "razorback 6 claws vs Mara"
Ref: TEST · razorback 6 claws vs Mara · +2 · [2,3]=7 → T1
$ python3 engine/engine.py init
Ref: initiative d10=3 → enemies act first
[REF]
You step into the nearest razorback before it can finish drawing back, and the blade goes in under the ribs and out through the spine. It drops with its claws still open. Only one left. It wades over the fallen, swinging a hooked hand that you ride aside with a twist of the shoulder, and the claws score the stone where you stood. Its back is bristling, its jaw hanging open, and what is left of the column behind it is nothing but dark and the dry creak of settling bone. There is blood running down your side, and the torch behind you gutters low.

Ledger: ATTACK attack · S+3 · [7,10]=20 → T3 · HIT 10 dam
Ref: TEST claws [2,3]=7 → T1 (miss) · initiative d10=3 → enemies act first

Corridor mouth, cellar · DT 1 · round 10 · Stamina 11 · wounds 0/10 · torch lit (guttering) · one razorback left, at arm's reach, and it moves before you do.

## Turn 11
[PLAYER] PLAYER [12/17]: I keep cutting the nearest one.
[TOOLS]
$ python3 engine/engine.py test 2 --why "razorback 6 claws vs Mara"
Ref: TEST · razorback 6 claws vs Mara · +2 · [4,9]=15 → T2
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [5,3]=11 → T1 · MISS
$ python3 ledger.py take 2
LEDGER: took 2 (AD 0→0, Stamina 11→9, wounds 0→0)
$ python3 ledger.py take 2
LEDGER: took 2 (AD 0→0, Stamina 9→7, wounds 0→0)
$ python3 engine/engine.py init
Ref: initiative d10=8 → crows act first
[REF]
The last razorback's claws find your ribs again, and this time they bite deep, the sting of it running up under your arm. You swing back and miss, your blade skipping off a spine. It twists inside your guard and rakes you a second time with the backhand. Warm blood is sheeting down your leg now, and every breath stabs. The thing is hurt, though, its hide scored and dry, bristling with the broken stubs of its own spines. It crouches, the torchlight in its eyes, and there is nothing behind it now but empty dark.

Ledger: ATTACK attack · S+3 · [5,3]=11 → T1 · MISS
Ref: TEST claws [4,9]=15 → T2 (2 dam) · counter 2 dam (T2) · initiative d10=8 → crows act first

Corridor mouth, cellar · DT 1 · round 11 · Stamina 7 · wounds 0/10 · torch lit · the last razorback crouches at arm's reach, and you have the first move.

## Turn 12
[PLAYER] PLAYER [13/17]: I keep cutting the nearest one.
[TOOLS]
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [5,6]=14 → T2 · HIT 7 dam
$ python3 engine/engine.py test 2 --why "razorback 6 claws vs Mara"
Ref: TEST · razorback 6 claws vs Mara · +2 · [1,7]=10 → T1
$ python3 engine/engine.py init
Ref: initiative d10=3 → enemies act first
[REF]
Your blade drives into its chest and the razorback jerks, spilling grey fluid down its front. It lashes out with a ragged swing and misses wide, the claws only fanning the air by your shoulder. It is slower now, its movements stuttering, and the rattle in its throat has become a wet, broken sound. Its eyes still track you, though, and the spines along its spine are lifting. It is the last of them. The dark beyond it is quiet at last, and the torch hisses behind you.

Ledger: ATTACK attack · S+3 · [5,6]=14 → T2 · HIT 7 dam
Ref: TEST claws [1,7]=10 → T1 (miss) · initiative d10=3 → enemies act first

Corridor mouth, cellar · DT 1 · round 12 · Stamina 7 · wounds 0/10 · torch lit · the last razorback is badly hurt and still swaying toward you.

## Turn 13
[PLAYER] PLAYER [14/17]: I keep cutting the nearest one.
[TOOLS]
$ python3 engine/engine.py test 2 --why "razorback 6 claws vs Mara"
Ref: TEST · razorback 6 claws vs Mara · +2 · [6,7]=15 → T2
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [10,10]=23 → T3 CRIT · HIT 10 dam
$ python3 ledger.py take 2
LEDGER: took 2 (AD 0→0, Stamina 7→5, wounds 0→0)
$ python3 ledger.py ud torch
UD torch · [3] → 1→1
$ python3 engine/engine.py enc
Ref: encounter d10=1 vs EN 9 → none
[REF]
The razorback's claws rake across your forearm in a last ragged swing, and the pain is a bright white line. Then your blade comes down and takes it across the throat, through the neck and clean into the wall behind. The head rolls. The body stands a heartbeat longer, then folds in on itself, the spine-ridge cracking like kindling as it collapses onto the others. Six lie in the passage mouth. The corridor is silent except for the hiss of the torch and the sound of your own breath tearing in and out. The cellar air is cold on the blood drying down your side, and beyond the pile of bone the dark runs on, empty.

Ledger: ATTACK attack · S+3 · [10,10]=23 → T3 CRIT · HIT 10 dam
Ref: TEST claws [6,7]=15 → T2 (2 dam) · encounter d10=1 vs EN 9 → none

Corridor mouth, cellar · DT 1 ended · Stamina 5 · wounds 0/10 · torch lit (1 UD) · all six razorbacks destroyed, and the dark beyond the corridor is quiet.

DONE
Ran 13 turns (player script lines 1-14 of 17 used; all six razorbacks destroyed, crow alive).
