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

## Turn 6
[PLAYER] PLAYER [6/14]: I finish them and move on to the next room.
[TOOLS]
$ python3 player.py S4
PLAYER [6/14]: I finish them and move on to the next room.
$ python3 engine/engine.py init
Ref: initiative d10=9 → crows act first
$ python3 ledger.py attack --b 1 --why "sword vs razorback 1 (3 Stamina), torch dim"
ATTACK sword vs razorback 1 (3 Stamina), torch dim · S+3 · b · [2,5]=8(incl -2) → T1 · MISS
STATUS Stamina 17 · AD 10 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 2   (razorback 1 counter, claws T2)
LEDGER: took 2 (AD 10→8, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 8 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "razorback 1 claws"
Ref: TEST · razorback 1 claws · +2 · [9,8]=19 → T3
$ python3 engine/engine.py test 2 --why "razorback 2 spine"
Ref: TEST · razorback 2 spine · +2 · [3,2]=7 → T1
$ python3 engine/engine.py test 2 --why "razorback 3 spine"
Ref: TEST · razorback 3 spine · +2 · [6,3]=11 → T1
$ python3 ledger.py take 4   (claws T3; AD absorbs all, no Stamina damage so no laceration)
LEDGER: took 4 (AD 8→4, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 4 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
Your sword goes in low and wide, and the torch's shadow cheats you again. The razorback ducks the blade, and the answering rake is slow, half-hearted, a counter against the plate. Then it surges up and puts all its weight behind a real blow. The claws hit your breastplate with a crack, and the last of the good scale gives way across your ribs. The metal is a ruin now, plates gaping and rattling. Behind it the other two loose their spines, but one throws wild into the pillar and the other whistles past your ear into the dark of the storeroom. Chips of bone tick off the stone. The wounded razorback is bleeding gray down its flank, still on the chest, its whole attention on the torch hand. Beneath its claws the chest lid has shifted a finger's width, and a thin line of orange light seeps through the crack.

ATTACK sword vs razorback 1 (3 Stamina), torch dim · S+3 · b · [2,5]=8(incl -2) → T1 · MISS
Ref: initiative d10=9 → crows act first · Ref: TEST · razorback 1 claws · +2 · [9,8]=19 → T3 · Ref: TEST · razorback 2 spine · +2 · [3,2]=7 → T1 · Ref: TEST · razorback 3 spine · +2 · [6,3]=11 → T1

Cellar, storeroom (area 2), combat round 3 done · DT 1 (rooms 2 of 5) · Stamina 17 · wounds 0/10 · AD 4 · torch lit · the chest lid is shifting under the razorback's claws and the embers inside are waking.

## Turn 7
[PLAYER] PLAYER [7/14]: I open the next door and go in.
[TOOLS]
$ python3 player.py S4
PLAYER [7/14]: I open the next door and go in.
$ python3 engine/engine.py init
Ref: initiative d10=9 → crows act first
(razorback 1 tears the chest lid open on its own action: embers disturbed, printed trap, Agility RR for each creature in the room: Mara and razorback 1; razorbacks 2 and 3 hold the arch, outside the room)
$ python3 ledger.py test A --why "Agility RR embers explode"
TEST Agility RR embers explode · A+1 · - · [5,10]=16 → T2
STATUS Stamina 17 · AD 4 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py read floating_manor_a11_embers_explode 16
Floating Manor area 11: embers explosion (D17) 16 → 4 dam
note: Agility RR for each creature in the room if the embers are disturbed.
$ python3 ledger.py take 4
LEDGER: took 4 (AD 4→0, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 1 --why "razorback 1 Agility RR embers"
Ref: TEST · razorback 1 Agility RR embers · +1 · [8,9]=18 → T3
$ python3 engine/engine.py read floating_manor_a11_embers_explode 18
Floating Manor area 11: embers explosion (D17) 18 → No effect
$ python3 engine/engine.py test 2 --why "razorback 1 claws"
Ref: TEST · razorback 1 claws · +2 · [10,3]=15 → T2
$ python3 engine/engine.py test 2 --why "razorback 2 spine"
Ref: TEST · razorback 2 spine · +2 · [10,6]=18 → T3
$ python3 engine/engine.py test 2 --why "razorback 3 spine"
Ref: TEST · razorback 3 spine · +2 · [8,2]=12 → T2
$ python3 ledger.py take 2   (claws T2)
LEDGER: took 2 (AD 0→0, Stamina 17→15, wounds 0→0)
STATUS Stamina 15 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 3   (spine T3)
LEDGER: took 3 (AD 0→0, Stamina 15→12, wounds 0→0)
STATUS Stamina 12 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 1   (spine T2)
LEDGER: took 1 (AD 0→0, Stamina 12→11, wounds 0→0)
STATUS Stamina 11 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
You throw your weight toward the arch and find it full of razorbacks. There is no door to open, only the dark archway packed with bone and hooked claws, and the way through is theirs. Before you can find another route the wounded one on the chest bares its teeth and slams its claws under the lid. The iron bands shriek and the chest bursts open. The embers inside flare white and the whole storeroom goes off in your face. You turn into the blast, and the heat takes the last of your armor in one roar of scorched plate, leaving only cloth and skin. The razorback on the chest shrugs the fire off like rain. It sets on you at once. Its claws find you, and the two behind lace your ribs with bone nails. They bleed you where the metal was.

TEST Agility RR embers explode · A+1 · - · [5,10]=16 → T2 · 4 dam
Ref: initiative d10=9 → crows act first · Ref: TEST · razorback 1 Agility RR embers · +1 · [8,9]=18 → T3 · Ref: TEST · razorback 1 claws · +2 · [10,3]=15 → T2 · Ref: TEST · razorback 2 spine · +2 · [10,6]=18 → T3 · Ref: TEST · razorback 3 spine · +2 · [8,2]=12 → T2

Cellar, storeroom (area 2), combat round 4 done · DT 1 (rooms 2 of 5) · Stamina 11 · wounds 0/10 · AD 0 · torch lit · the razorback sways on the burst chest with a ruined claw, the arch is still full behind it, and you are bleeding through cloth.

## Turn 8
[PLAYER] PLAYER [8/14]: I search the room for treasure and the way on.
[TOOLS]
$ python3 player.py S4
PLAYER [8/14]: I search the room for treasure and the way on.
(roll on request: only if asked)
$ python3 engine/engine.py init
Ref: initiative d10=7 → crows act first
$ python3 ledger.py test M --b 1 --why "search storeroom in dim light under attack"
TEST search storeroom in dim light under attack · M+0 · b · [4,9]=11(incl -2) → T1
STATUS Stamina 11 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
(T1 non-attack: Move: Take something away)
$ python3 engine/engine.py test 2 --why "razorback 1 claws"
Ref: TEST · razorback 1 claws · +2 · [9,4]=15 → T2
$ python3 engine/engine.py test 2 --why "razorback 2 spine"
Ref: TEST · razorback 2 spine · +2 · [7,1]=10 → T1
$ python3 engine/engine.py test 2 --why "razorback 3 spine"
Ref: TEST · razorback 3 spine · +2 · [7,7]=16 → T2
$ python3 ledger.py take 2   (claws T2)
LEDGER: took 2 (AD 0→0, Stamina 11→9, wounds 0→0)
STATUS Stamina 9 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 1   (spine T2)
LEDGER: took 1 (AD 0→0, Stamina 9→8, wounds 0→0)
STATUS Stamina 8 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
You hold the torch low and sweep the burst chest with its light, but the glare is poor, the water seep runs everywhere, and the razorback squatting on the chest will not give up its seat. Shards of scorched shelf-plank and wet ash fill the floor. A dull gleam shows through the ash, coin or brass, you cannot tell, and the claws that rake across it scatter it into the black pool by the wall. Whatever the chest held is going down the drain, one coin at a time, under the creature's feet. The creature takes your search for an opening and comes at you, claws tearing cloth and flesh. One spine from behind goes wide. Another finds your thigh. The arch behind the beast is still packed with dark shapes, and nothing in this room leads out except through them.

Move: Take something away
TEST search storeroom in dim light under attack · M+0 · b · [4,9]=11(incl -2) → T1
Ref: initiative d10=7 → crows act first · Ref: TEST · razorback 1 claws · +2 · [9,4]=15 → T2 · Ref: TEST · razorback 2 spine · +2 · [7,1]=10 → T1 · Ref: TEST · razorback 3 spine · +2 · [7,7]=16 → T2

Cellar, storeroom (area 2), combat round 5 done · DT 1 (rooms 2 of 5) · Stamina 8 · wounds 0/10 · AD 0 · torch lit · the wounded razorback crouches over the scattering coins and hisses at your torch.

## Turn 9
[PLAYER] PLAYER [9/14]: I go on to the next room.
[TOOLS]
$ python3 player.py S4
PLAYER [9/14]: I go on to the next room.
$ python3 engine/engine.py init
Ref: initiative d10=3 → enemies act first
$ python3 engine/engine.py test 2 --why "razorback 1 claws"
Ref: TEST · razorback 1 claws · +2 · [10,1]=13 → T2
$ python3 engine/engine.py test 2 --why "razorback 2 spine"
Ref: TEST · razorback 2 spine · +2 · [3,6]=11 → T1
$ python3 engine/engine.py test 2 --why "razorback 3 spine"
Ref: TEST · razorback 3 spine · +2 · [7,8]=17 → T3
$ python3 ledger.py take 2   (claws T2)
LEDGER: took 2 (AD 0→0, Stamina 8→6, wounds 0→0)
STATUS Stamina 6 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 3   (spine T3)
LEDGER: took 3 (AD 0→0, Stamina 6→3, wounds 0→0)
STATUS Stamina 3 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py test A --b 1 --why "slip past razorbacks 2 and 3 through the arch, dim light"
TEST slip past razorbacks 2 and 3 through the arch, dim light · A+1 · b · [3,2]=4(incl -2) → T1
STATUS Stamina 3 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
(T1 non-attack: Move: Have it backfire; Mara goes prone)
[REF]
They strike first. The razorback on the chest rakes your side, and a bone nail from the arch punches into your thigh and stays. You are bleeding fast now. You lower your shoulder and drive for the arch anyway, between two shapes that give no ground. The torch hand swings wide and the flame stutters against the dripping wall. Your boot finds the seep-slick floor and goes out from under you. You hit the flagstone on one hip, torch rolling in your fist, and a hooked claw comes down on the stone where your head was a heartbeat before. Water soaks your cloth. Three razorbacks crowd the light above you, their ribs rattling, their jaws open, and one of them is dragging a boot of yours toward the dark.

Move: Have it backfire
TEST slip past razorbacks 2 and 3 through the arch, dim light · A+1 · b · [3,2]=4(incl -2) → T1
Ref: initiative d10=3 → enemies act first · Ref: TEST · razorback 1 claws · +2 · [10,1]=13 → T2 · Ref: TEST · razorback 2 spine · +2 · [3,6]=11 → T1 · Ref: TEST · razorback 3 spine · +2 · [7,8]=17 → T3

Cellar, storeroom (area 2), combat round 6 done · DT 1 (rooms 2 of 5) · Stamina 3 · wounds 0/10 · AD 0 · torch lit · you are prone on the wet stone with all three razorbacks over you.

## Turn 10
[PLAYER] PLAYER [10/14]: I go through the next door.
[TOOLS]
$ python3 player.py S4
PLAYER [10/14]: I go through the next door.
$ python3 engine/engine.py init
Ref: initiative d10=4 → enemies act first
$ python3 engine/engine.py test 2 --why "razorback 1 claws"
Ref: TEST · razorback 1 claws · +2 · [1,5]=8 → T1
$ python3 engine/engine.py test 2 --why "razorback 2 spine"
Ref: TEST · razorback 2 spine · +2 · [3,10]=15 → T2
$ python3 engine/engine.py test 2 --why "razorback 3 spine"
Ref: TEST · razorback 3 spine · +2 · [2,2]=6 → T1
(razorback 1 claws miss: Mara's counter, sword T2 = 4 + S 3 = 7 dam, same as the Ledger's T2 attack row; razorback 1 Stamina 3 -> destroyed)
$ python3 ledger.py take 1   (razorback 2 spine T2)
LEDGER: took 1 (AD 0→0, Stamina 3→2, wounds 0→0)
STATUS Stamina 2 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
You are on the floor, and you do not stay there. The razorback above you lunges and misses, claws scraping stone, and your sword is already coming up under its ribs. The blade goes in to the hilt and the thing folds off the blade, spilling gray fluid, and stops. A spine hisses past your face and another burns across your shoulder, tearing cloth, but you are up, one knee, then your feet, the torch still burning in your hand. Two remain, side by side in the arch, their spines flaring. The way you meant to take is theirs. They will not let you through, and blood is running warm down your leg into the water. The second one tilts its skull toward your torch and clicks its jaws, patient, counting.

Ref: initiative d10=4 → enemies act first · Ref: TEST · razorback 1 claws · +2 · [1,5]=8 → T1 · Ref: TEST · razorback 2 spine · +2 · [3,10]=15 → T2 · Ref: TEST · razorback 3 spine · +2 · [2,2]=6 → T1

Cellar, storeroom (area 2), combat round 7 done · DT 1 (rooms 2 of 5) · Stamina 2 · wounds 0/10 · AD 0 · torch lit · two razorbacks hold the arch with their spines drawn, and one more hit will open you to wounds.

