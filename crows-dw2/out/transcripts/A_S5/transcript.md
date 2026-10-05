## Turn 1
[PLAYER] PLAYER [1/17]: I plant myself in the corridor mouth with the torch behind me, and wait for the first one to come into reach.
(roll on request: none yet)
[TOOLS] (none)
[REF] The torch hisses at your back and throws your shadow down the corridor, long and thin, over wet flagstones. Past the reach of the light, something drags itself along the wall with a sound like a rake on slate. Then the first of them steps into the edge of the glow: gray hide split over a ridge of bone, jaw hanging loose, claws ticking on stone. A second slides in beside it, close enough that you can smell the cellar rot on its breath. Behind them the dark is crowded with the same ticking, four more, strung out in a column and not hurrying. The nearer one lowers its head toward you. Its hooked claws come up.

Status: Cellar corridor mouth · DT 1 · Stamina 17 · wounds 0/10 · torch lit, dim light · two razorbacks at your feet, four more in the dark behind, and the nearer one is already reaching.

## Turn 2
[PLAYER] PLAYER [2/17]: I cut at the first one in reach.
(roll on request: attack / Trade Blows)
[TOOLS]
$ python3 ledger.py attack --b 1
ATTACK attack · S+3 · b · [9,1]=11(incl -2) → T1 · MISS
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "U1 claws vs Mara"
Ref: TEST · U1 claws vs Mara · +2 · [1,10]=13 → T2
$ python3 ledger.py take 3
LEDGER: took 3 (AD 25→22, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 22 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "U3 spine vs Mara"
Ref: TEST · U3 spine vs Mara · +2 · [4,5]=11 → T1
$ python3 engine/engine.py test 2 --why "U4 spine vs Mara"
Ref: TEST · U4 spine vs Mara · +2 · [6,5]=13 → T2
$ python3 ledger.py take 2
LEDGER: took 2 (AD 20, Stamina 17, wounds 0)
STATUS Stamina 17 · AD 20 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF] Your blade sweeps low and the razorback is simply not there, its spine-ridged back rolling away from the cut. It comes back faster, claws hooking across your guard and raking the scale over your ribs with a shriek of metal. Two shapes in the dark behind it flex their backs, and bone spines whistle out of the column. One skitters off the stone beside your boot. The other thuds into your shoulder and sticks, a barbed needle caught in your armor. The torch gutters in the draft off the corridor.

Ref: TEST · U1 claws vs Mara · +2 · [1,10]=13 → T2 | Ref: TEST · U3 spine vs Mara · +2 · [4,5]=11 → T1 | Ref: TEST · U4 spine vs Mara · +2 · [6,5]=13 → T2
Status: Cellar corridor mouth · DT 1 · Stamina 17 · wounds 0/10 · torch lit, dim light · the first razorback is on you again, claws already coming back around, and the column is closing.

## Turn 3
[PLAYER] PLAYER [3/17]: I hit the nearest one again.
[TOOLS]
$ python3 ledger.py attack --b 1
ATTACK attack · S+3 · b · [10,2]=13(incl -2) → T2 · HIT 7 dam
STATUS Stamina 17 · AD 20 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "U1 claws vs Mara"
Ref: TEST · U1 claws vs Mara · +2 · [8,1]=11 → T1
[REF] This time the blade bites. It parts hide over the razorback's shoulder and sinks into dead meat with a wet crunch, and the thing screams through its loose jaw. Black ichor spatters the flagstones. It lunges anyway, claws raking, but you turn them on your guard and they scrape off harmlessly. Its fellow shuffles up behind it, shoulder to shoulder in the narrow corridor, and the ticking of the others carries on in the dark, a patient dry sound.

Ref: TEST · U1 claws vs Mara · +2 · [8,1]=11 → T1
Status: Cellar corridor mouth · DT 1 · Stamina 17 · wounds 0/10 · torch lit, dim light · the wounded razorback sways in front of you, hanging on, and its mate waits at its shoulder.

## Turn 4
[PLAYER] PLAYER [4/17]: I hit the nearest one again.
[TOOLS]
$ python3 ledger.py attack --b 1
ATTACK attack · S+3 · b · [2,4]=7(incl -2) → T1 · MISS
STATUS Stamina 17 · AD 20 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "U1 claws vs Mara"
Ref: TEST · U1 claws vs Mara · +2 · [9,3]=14 → T2
$ python3 ledger.py take 3
LEDGER: took 3 (AD 20→17, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 17 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "U5 spine vs Mara"
Ref: TEST · U5 spine vs Mara · +2 · [6,1]=9 → T1
$ python3 engine/engine.py test 2 --why "U6 spine vs Mara"
Ref: TEST · U6 spine vs Mara · +2 · [9,6]=17 → T3
$ python3 ledger.py take 3
LEDGER: took 3 (AD 17→14, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 14 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF] Your swing goes wide and clangs off the corridor wall, and the wounded razorback is inside it before you can recover. Claws drag across your armor and chew a groove in the plates. Behind it the column ripples. One spine glances away, another comes in hard and punches through the gap at your hip, a bone needle that bites even through the scale. The air in the corridor is thick with the smell of old blood and the torch is burning lower, its flame leaning toward the dark as if it wanted to leave.

Ref: TEST · U1 claws vs Mara · +2 · [9,3]=14 → T2 | Ref: TEST · U5 spine vs Mara · +2 · [6,1]=9 → T1 | Ref: TEST · U6 spine vs Mara · +2 · [9,6]=17 → T3
Status: Cellar corridor mouth · DT 1 · Stamina 17 · wounds 0/10 · torch lit and burning low, dim light · the wounded razorback is still at your guard, hooks drawn back for another rake.

## Turn 5
[PLAYER] PLAYER [6/17]: I keep cutting the nearest one.
[TOOLS]
$ python3 ledger.py attack --b 1
ATTACK attack · S+3 · b · [4,7]=12(incl -2) → T2 · HIT 7 dam
STATUS Stamina 17 · AD 14 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "U1 claws vs Mara"
Ref: TEST · U1 claws vs Mara · +2 · [9,2]=13 → T2   (void: U1 reached 0 Stamina on the crow's blow; no damage applied)
[REF] The blade takes the razorback through the collarbone and keeps going. It folds with a long dry rattle, claws still scrabbling at your guard, and then goes slack and slides down the wall, its spine plates clicking against the stone. The second one steps over it without a pause. Its hide is grayer, its jaw still whole, and it holds its claws low and wide as it comes. Past it the dark is full of the ticking of the other three, closer now, the column bunching up behind its leader.

Ref: TEST · U1 claws vs Mara · +2 · [9,2]=13 → T2 (void, target already down)
Status: Cellar corridor mouth · DT 1 · Stamina 17 · wounds 0/10 · torch lit and burning low, dim light · one razorback down, and the next is stepping over the body into reach.

## Turn 6
[PLAYER] PLAYER [7/17]: I keep cutting the nearest one.
[TOOLS]
$ python3 ledger.py attack --b 1
ATTACK attack · S+3 · b · [2,3]=6(incl -2) → T1 · MISS
STATUS Stamina 17 · AD 14 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "U2 claws vs Mara"
Ref: TEST · U2 claws vs Mara · +2 · [10,8]=20 → T3
$ python3 engine/engine.py test 2 --why "U3 spine vs Mara"
Ref: TEST · U3 spine vs Mara · +2 · [1,9]=12 → T2
$ python3 engine/engine.py test 2 --why "U4 spine vs Mara"
Ref: TEST · U4 spine vs Mara · +2 · [6,3]=11 → T1
$ python3 ledger.py take 4
LEDGER: took 4 (AD 14→10, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 10 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 2
LEDGER: took 2 (AD 10→8, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 8 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF] You overreach on the wet stone and the razorback slips inside your cut. Its claws come down across your chest in a hard hooked stroke that rings off your armor and leaves bright scars in the plate. A spine skips past your ear. Another hisses in and strikes your thigh, glancing off the scale with a sting. Your armor is taking a beating, and the dark behind this one is stirring. Three more shapes crowd toward the light, jostling, their ticking quickening into something like hunger.

Ref: TEST · U2 claws vs Mara · +2 · [10,8]=20 → T3 | Ref: TEST · U3 spine vs Mara · +2 · [1,9]=12 → T2 | Ref: TEST · U4 spine vs Mara · +2 · [6,3]=11 → T1
Status: Cellar corridor mouth · DT 1 · Stamina 17 · wounds 0/10 · torch lit and burning low, dim light · the razorback has you pinned against the wall with its claws out, and more are surging up behind it.

## Turn 7
[PLAYER] PLAYER [8/17]: I keep cutting the nearest one.
[TOOLS]
$ python3 ledger.py attack --b 1
ATTACK attack · S+3 · b · [7,1]=9(incl -2) → T1 · MISS
STATUS Stamina 17 · AD 8 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "U2 claws vs Mara"
Ref: TEST · U2 claws vs Mara · +2 · [8,1]=11 → T1
$ python3 engine/engine.py test 2 --why "U3 spine vs Mara"
Ref: TEST · U3 spine vs Mara · +2 · [7,9]=18 → T3
$ python3 engine/engine.py test 2 --why "U4 spine vs Mara"
Ref: TEST · U4 spine vs Mara · +2 · [2,8]=12 → T2
$ python3 ledger.py take 3
LEDGER: took 3 (AD 8→5, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 5 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 2
LEDGER: took 2 (AD 5→3, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 3 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF] The cut falls short, the razorback ducking under it with a twist of its spine plates. Its claws rake the air a hand's width from your face and you shove it off with your shoulder. Then the barbs come out of the dark in a spatter. One bites the plate over your belly and hangs there, trembling. A second clips your forearm and rings off the guard, leaving the buckle bent. Your armor is nearly through. Where the scale has come away, the padding beneath shows bare and gray, and the cold of the cellar reaches your skin.

Ref: TEST · U2 claws vs Mara · +2 · [8,1]=11 → T1 | Ref: TEST · U3 spine vs Mara · +2 · [7,9]=18 → T3 | Ref: TEST · U4 spine vs Mara · +2 · [2,8]=12 → T2
Status: Cellar corridor mouth · DT 1 · Stamina 17 · wounds 0/10 · torch lit and burning low, dim light · the razorback is back at your guard with the column pressing close behind it.

## Turn 8
[PLAYER] PLAYER [9/17]: I keep cutting the nearest one.
[TOOLS]
$ python3 ledger.py attack --b 1
ATTACK attack · S+3 · b · [2,4]=7(incl -2) → T1 · MISS
STATUS Stamina 17 · AD 3 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "U2 claws vs Mara"
Ref: TEST · U2 claws vs Mara · +2 · [3,10]=15 → T2
$ python3 engine/engine.py test 2 --why "U5 spine vs Mara"
Ref: TEST · U5 spine vs Mara · +2 · [9,9]=20 → T3
$ python3 engine/engine.py test 2 --why "U6 spine vs Mara"
Ref: TEST · U6 spine vs Mara · +2 · [10,10]=22 → T3 CRIT
$ python3 ledger.py take 3
LEDGER: took 3 (AD 3→0, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 3
LEDGER: took 3 (AD 0→0, Stamina 17→14, wounds 0→0)
STATUS Stamina 14 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 3
LEDGER: took 3 (AD 0→0, Stamina 14→11, wounds 0→0)
STATUS Stamina 11 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF] Your cut sprays sparks off the wall and the razorback bulls into you. Claws hook under the last of your armor and tear it half off your shoulder. Then two spines hammer in together, driven by something that wanted this, and the second one sinks deep, past padding, into meat. Warmth runs down your side. The scale hangs from you in ruins and there is nothing left between the corridor and your skin. The torch gutters. The razorback at your front is unmarked, and behind it the column stands shoulder to shoulder, ticking, eager.

Ref: TEST · U2 claws vs Mara · +2 · [3,10]=15 → T2 | Ref: TEST · U5 spine vs Mara · +2 · [9,9]=20 → T3 | Ref: TEST · U6 spine vs Mara · +2 · [10,10]=22 → T3 CRIT
Status: Cellar corridor mouth · DT 1 · Stamina 11 · wounds 0/10 · torch lit and burning low, dim light · the unmarked razorback is a claw's length from your throat, and no armor is left to turn the next blow.

## Turn 9
[PLAYER] PLAYER [10/17]: I keep cutting the nearest one.
[TOOLS]
$ python3 ledger.py attack --b 1
ATTACK attack · S+3 · b · [5,8]=14(incl -2) → T2 · HIT 7 dam
STATUS Stamina 11 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "U2 claws vs Mara"
Ref: TEST · U2 claws vs Mara · +2 · [8,4]=14 → T2
$ python3 ledger.py take 3
LEDGER: took 3 (AD 0→0, Stamina 11→8, wounds 0→0)
STATUS Stamina 8 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF] This one lands. The blade opens the razorback from hip to ribs and black ichor pours over the stone, and it staggers, one claw dragging. It still reaches you. The hooked fingers rake across your arm, peeling skin from the bone, and the pain is clean and bright. The thing is sagging now, jaw working, but its eyes stay on your throat. Behind it the others have stopped their ticking. They are waiting, and they know how little you have left.

Ref: TEST · U2 claws vs Mara · +2 · [8,4]=14 → T2
Status: Cellar corridor mouth · DT 1 · Stamina 8 · wounds 0/10 · torch lit and burning low, dim light · the gutted razorback is still upright, claws up, and it has not stopped coming.

## Turn 10
[PLAYER] PLAYER [11/17]: I keep cutting the nearest one.
[TOOLS]
$ python3 ledger.py attack --b 1
ATTACK attack · S+3 · b · [2,7]=10(incl -2) → T1 · MISS
STATUS Stamina 8 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "U2 claws vs Mara"
Ref: TEST · U2 claws vs Mara · +2 · [4,1]=7 → T1
$ python3 engine/engine.py test 2 --why "U3 spine vs Mara"
Ref: TEST · U3 spine vs Mara · +2 · [5,9]=16 → T2
$ python3 engine/engine.py test 2 --why "U4 spine vs Mara"
Ref: TEST · U4 spine vs Mara · +2 · [6,4]=12 → T2
$ python3 ledger.py take 2
LEDGER: took 2 (AD 0→0, Stamina 8→6, wounds 0→0)
STATUS Stamina 6 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 2
LEDGER: took 2 (AD 0→0, Stamina 6→4, wounds 0→0)
STATUS Stamina 4 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF] The gutted razorback falls against the wall as you swing, and the blade sweeps through empty air above it. Its claws find only your boot. Then a pair of spines come out of the dark together, quick and low. One drives into your thigh and the other pierces your side under the ribs, and your breath goes out of you in a rough bark. Your hands are slick and the torch is a low orange smear. You can hear your own heart over the ticking.

Ref: TEST · U2 claws vs Mara · +2 · [4,1]=7 → T1 | Ref: TEST · U3 spine vs Mara · +2 · [5,9]=16 → T2 | Ref: TEST · U4 spine vs Mara · +2 · [6,4]=12 → T2
Status: Cellar corridor mouth · DT 1 · Stamina 4 · wounds 0/10 · torch lit and burning low, dim light · the gutted razorback clings to your boot while two barbed spines hang from your side.

## Turn 11
[PLAYER] PLAYER [12/17]: I keep cutting the nearest one.
[TOOLS]
$ python3 ledger.py attack --b 1
ATTACK attack · S+3 · b · [6,9]=16(incl -2) → T2 · HIT 7 dam
STATUS Stamina 4 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF] The blade comes down through the razorback's spine and it stops with a dry crack, the claws falling slack from your boot. Two are down. The corpses lie crossed in the corridor mouth, and for a moment the passage is a plug of dead flesh. Beyond them four shapes come to the edge of the light and stand there in a column, spines flexed, heads low, and none of them is in a hurry. Your breath is loud. The torch gutters.

Status: Cellar corridor mouth · DT 1 · Stamina 4 · wounds 0/10 · torch lit and burning low, dim light · four razorbacks stand at the edge of the light, spines raised, and the nearest has begun to climb the bodies.

## Turn 12
[PLAYER] PLAYER [13/17]: I keep cutting the nearest one.
[TOOLS]
$ python3 ledger.py attack --b 1
ATTACK attack · S+3 · b · [6,3]=10(incl -2) → T1 · MISS
STATUS Stamina 4 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "U3 claws vs Mara"
Ref: TEST · U3 claws vs Mara · +2 · [1,9]=12 → T2
$ python3 engine/engine.py test 2 --why "U4 spine vs Mara"
Ref: TEST · U4 spine vs Mara · +2 · [6,9]=17 → T3
$ python3 ledger.py take 3
LEDGER: took 3 (AD 0→0, Stamina 4→1, wounds 0→0)
STATUS Stamina 1 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 3
LEDGER: took 3 (AD 0→0, Stamina 1→0, wounds 0→2)
STATUS Stamina 0 · AD 0 · wounds 2/10 · uses Slashing 3 · UD torch 1
[REF] The fresh razorback is over the bodies before your blade comes round, and the cut meets only its raised forearm, glancing. Its claws rip down your front. A spine from the column behind it hits you square in the chest and sticks, and something gives inside you. Your legs go loose. The corridor tilts and the torch light smears across the flagstones. You are standing in your own blood and it is warm, and the ticking in the dark has started up again.

Ref: TEST · U3 claws vs Mara · +2 · [1,9]=12 → T2 | Ref: TEST · U4 spine vs Mara · +2 · [6,9]=17 → T3
Status: Cellar corridor mouth · DT 1 · Stamina 0 · wounds 2/10 · torch lit and burning low, dim light · the fresh razorback is against you, claws already rising, and your legs are going.

## Turn 13
[PLAYER] PLAYER [14/17]: I keep cutting the nearest one.
[TOOLS]
$ python3 ledger.py attack --b 1
ATTACK attack · S+3 · b · [9,7]=17(incl -2) → T3 · HIT 10 dam
STATUS Stamina 0 · AD 0 · wounds 2/10 · uses Slashing 3 · UD torch 1
[REF] The cut comes up from the hip and takes the razorback under the jaw. Bone and gristle part and the head lolls back on a thread of hide, and the body drops across the other two. Three left. They are bunched at the edge of the torchlight, and one of them is already crawling over the pile with its claws spread, dragging its belly on the stone. You taste iron and your arm shakes on the grip. The torch is a coal in the gloom behind you, and the flame leans away.

Status: Cellar corridor mouth · DT 1 · Stamina 0 · wounds 2/10 · torch lit and burning low, dim light · three razorbacks left, and the nearest is scrabbling up the pile of its dead.

## Turn 14
[PLAYER] PLAYER [15/17]: I keep cutting the nearest one.
[TOOLS]
$ python3 ledger.py attack --b 1
ATTACK attack · S+3 · b · [10,7]=18(incl -2) → T3 · HIT 10 dam
STATUS Stamina 0 · AD 0 · wounds 2/10 · uses Slashing 3 · UD torch 1
[REF] The razorback is still pulling itself over the heap when your blade cleaves down through its skull. It flops and goes still across the other bodies, claws twitching once against the stone. Two remain. They hang back at the limit of the torchlight, close together, spines flexed and shivering, heads low. The corridor is a slaughterhouse and the floor is slick under your boots. The nearer one tilts its head, and the farther one lets out a thin shriek that echoes down the cellar.

Status: Cellar corridor mouth · DT 1 · Stamina 0 · wounds 2/10 · torch lit and burning low, dim light · two razorbacks left at the edge of the light, watching you over the heap of their dead.
