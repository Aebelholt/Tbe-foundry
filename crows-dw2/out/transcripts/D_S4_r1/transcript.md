## Turn 1
[PLAYER] PLAYER [1/14]: I enter the cellar by the stair and look the first room over before stepping in.
[TOOLS]
$ python3 player.py S4
PLAYER [1/14]: I enter the cellar by the stair and look the first room over before stepping in.
(roll on request: only if asked)
$ python3 engine/engine.py roll d6 --why "DT1 length (rooms)"
Ref: d6 [5]=5 · DT1 length (rooms)
[REF]
The chapel stair ends in a landing slick with seep-water, the torch throwing your shadow long down the wet steps behind you. Deep gouges score the door frame ahead, four parallel lines at the height of your chest, old and dark. The stench of rot sits in the back of your throat, sweet and heavy. Nothing moves. Water ticks from the ceiling into a pool somewhere beyond the door, steady as a counted pulse, and the torch flame leans toward the dark opening as if something past it were drawing breath.

Ref: d6 [5]=5 · DT1 length (rooms)

Cellar, stair landing (area 1) · DT 1 (rooms 5) · Stamina 17 · wounds 0/10 · torch lit · the barred, clawed door stands ajar before you and the dripping beyond it has just stopped.

## Turn 2
[PLAYER] PLAYER [2/14]: I search the first room carefully, checking the floor and the shelves.
[TOOLS]
$ python3 player.py S4
PLAYER [2/14]: I search the first room carefully, checking the floor and the shelves.
(roll on request: only if asked)
[REF]
You go over the landing inch by inch. There are no shelves, only a bare stone ledge along one wall, furred with green slime and holding nothing. The floor is flagstone, cracked and sunk, and the water pooled in the low corner is black and still, a hand deep. In the slime on the ledge you find the same four-line gouges, and below them a smear of something dried brown that flakes under your thumb. Nothing is hidden here, no loose stone, no cord, no latch. Whatever lived in this landing left it long ago, and whatever it left behind stinks. The way on is the clawed door, and past it the dripping starts again, closer, as if the water had learned to walk.

Cellar, stair landing (area 1, searched) · DT 1 (rooms 1 of 5) · Stamina 17 · wounds 0/10 · torch lit · the door ahead stands open on a low, dripping dark.

## Turn 3
[PLAYER] PLAYER [3/14]: I step across the room to the far door.
[TOOLS]
$ python3 player.py S4
PLAYER [3/14]: I step across the room to the far door.
[REF]
The far door gives onto a low storeroom, and the dripping you heard is a seam in the vaulting letting water down in a thin silver thread. A long shelf has come away from the wall and lies slumped across the floor, planks split, jars burst and long since dry. Beneath its weight, the corner of an iron-banded chest shows, lid dusted with grit. A scatter of old embers lies in the hollow beside it, gray and cold-looking, banked against the chest's flank as though someone once kept it warm. The rot smell is thinner here, but under it runs something sharper, like burnt hair. Past the chest, the room narrows to an arch, and from beyond it comes a dry, patient clicking.

Cellar, storeroom (area 2) · DT 1 (rooms 2 of 5) · Stamina 17 · wounds 0/10 · torch lit · the clicking beyond the arch stops whenever your boots do.

## Turn 4
[PLAYER] PLAYER [4/14]: I deal with whatever comes through, sword first. Torch high.
[TOOLS]
$ python3 player.py S4
PLAYER [4/14]: I deal with whatever comes through, sword first. Torch high.
(roll on request: attack / Trade Blows)
$ python3 engine/engine.py init
Ref: initiative d10=9 → crows act first
$ python3 ledger.py attack --b 1 --why "sword vs razorback 1, torch dim"
ATTACK sword vs razorback 1, torch dim · S+3 · b · [7,2]=10(incl -2) → T1 · MISS
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 2   (razorback 1 counter, A claws T2 = 2 dam, blocks.md)
LEDGER: took 2 (AD 25→23, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 23 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "razorback 1 claws"
Ref: TEST · razorback 1 claws · +2 · [8,4]=14 → T2
$ python3 engine/engine.py test 2 --why "razorback 2 spine"
Ref: TEST · razorback 2 spine · +2 · [5,9]=16 → T2
$ python3 engine/engine.py test 2 --why "razorback 3 spine"
Ref: TEST · razorback 3 spine · +2 · [3,7]=12 → T2
$ python3 ledger.py take 2   (claws T2)
LEDGER: took 2 (AD 23→21, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 21 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 1   (spine T2)
LEDGER: took 1 (AD 21→20, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 20 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 1   (spine T2)
LEDGER: took 1 (AD 20→19, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 19 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
The clicking stops, and the arch fills. A razorback unfolds from behind the pillar, all spine and rib, and comes across the chest in one low leap, claws first. You are ready for it. Torch high, your sword sweeps in, but the flame throws the shadows wrong and the blade bites only air. The thing's reply is quick and mean. Its claws rake your armor and rip scale from the plate. Behind it two more crouch in the arch, backs bristling, and their spines snap free in a dry rattle and strike your shield and shoulder with a sound like thrown nails. The metal holds, mostly. Water falls in its silver thread behind you. Three of them, then, and the torch in your left hand is what they are all looking at.

ATTACK sword vs razorback 1, torch dim · S+3 · b · [7,2]=10(incl -2) → T1 · MISS
Ref: initiative d10=9 → crows act first · Ref: TEST · razorback 1 claws · +2 · [8,4]=14 → T2 · Ref: TEST · razorback 2 spine · +2 · [5,9]=16 → T2 · Ref: TEST · razorback 3 spine · +2 · [3,7]=12 → T2

Cellar, storeroom (area 2), combat round 1 done · DT 1 (rooms 2 of 5) · Stamina 17 · wounds 0/10 · AD 19 · torch lit · a razorback crouches atop the chest, claws dripping, the other two shuffling forward behind it.

## Turn 5
[PLAYER] PLAYER [5/14]: I press on the nearest one.
[TOOLS]
$ python3 player.py S4
PLAYER [5/14]: I press on the nearest one.
$ python3 engine/engine.py init
Ref: initiative d10=8 → crows act first
$ python3 ledger.py attack --b 1 --why "sword vs razorback 1, torch dim"
ATTACK sword vs razorback 1, torch dim · S+3 · b · [6,5]=12(incl -2) → T2 · HIT 7 dam
STATUS Stamina 17 · AD 19 · wounds 0/10 · uses Slashing 3 · UD torch 1
(razorback 1: Stamina 10 -> 3)
$ python3 engine/engine.py test 2 --why "razorback 1 claws"
Ref: TEST · razorback 1 claws · +2 · [4,9]=15 → T2
$ python3 engine/engine.py test 2 --why "razorback 2 spine"
Ref: TEST · razorback 2 spine · +2 · [5,9]=16 → T2
$ python3 engine/engine.py test 2 --why "razorback 3 spine"
Ref: TEST · razorback 3 spine · +2 · [9,10]=21 → T3 CRIT
$ python3 engine/engine.py test 2 --why "razorback 3 spine, extra action from crit"
Ref: TEST · razorback 3 spine, extra action from crit · +2 · [10,5]=17 → T3
$ python3 ledger.py take 2   (claws T2)
LEDGER: took 2 (AD 19→17, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 17 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 1   (spine T2)
LEDGER: took 1 (AD 17→16, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 16 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 3   (spine T3)
LEDGER: took 3 (AD 16→13, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 13 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 3   (spine T3, crit extra action)
LEDGER: took 3 (AD 13→10, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 10 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
You step in under the thing's reach and the sword comes around true, opening the razorback from hip to ribs. Gray fluid slops over the chest lid and the creature screams, a thin sound like a hinge, but it does not fall. It rakes you again, claws sparking on your plate. The two behind are not waiting. Their spines rattle out in a double volley, and the second archer's throw lands square, a whole fan of bone nails hammering your shield. It spits another before you can breathe, and that one lands as well. Your armor is wrecked now, scale hanging in strips, and something cold is working its way through the gaps. The wounded one is wavering, one claw hanging, but it holds its place on the chest and watches the torch.

ATTACK sword vs razorback 1, torch dim · S+3 · b · [6,5]=12(incl -2) → T2 · HIT 7 dam
Ref: initiative d10=8 → crows act first · Ref: TEST · razorback 1 claws · +2 · [4,9]=15 → T2 · Ref: TEST · razorback 2 spine · +2 · [5,9]=16 → T2 · Ref: TEST · razorback 3 spine · +2 · [9,10]=21 → T3 CRIT · Ref: TEST · razorback 3 spine (extra action) · +2 · [10,5]=17 → T3

Cellar, storeroom (area 2), combat round 2 done · DT 1 (rooms 2 of 5) · Stamina 17 · wounds 0/10 · AD 10 · torch lit · the wounded razorback sways on the chest within reach, and your armor will not take many more volleys.

