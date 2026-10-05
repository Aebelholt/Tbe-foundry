## Turn 1
[PLAYER] PLAYER [1/14]: I enter the cellar by the stair and look the first room over before stepping in.
(roll on request: only if asked)
[TOOLS]
$ python3 player.py S4
PLAYER [1/14]: I enter the cellar by the stair and look the first room over before stepping in.
(roll on request: only if asked)
$ python3 engine/engine.py roll d6 --why "DT 1 length (rooms)"
Ref: d6 [4]=4 · DT 1 length (rooms)
[REF]
The stair drops you into a landing slick with seep water, the torch hissing in the damp. Gouges run down the door frame ahead, four parallel grooves cut deep into the wood at the height of your ribs. Under the rot-stench, something older and sweeter sits in the air. Nothing moves on the landing. Black water laps at the lowest step behind you, and beyond the splintered door a draught carries the smell of wet bone and a faint tick of dripping stone.

Ref: d6 [4]=4 · DT 1 length (rooms)

Where: cellar, landing · DT 1 (rooms 0/4) · Stamina 17 · wounds 0/10 · torch lit · the splintered door stands open on darkness

## Turn 2
[PLAYER] PLAYER [2/14]: I search the first room carefully, checking the floor and the shelves.
(roll on request: only if asked)
[TOOLS]
$ python3 player.py S4
PLAYER [2/14]: I search the first room carefully, checking the floor and the shelves.
(roll on request: only if asked)
[REF]
You work the landing by torchlight, crouched low. There are no shelves, only a rusted iron bracket where one once hung, and nothing under the silt but a rat's skull and a button of green bronze. The claw marks on the frame are old, the wood around them gone soft and black. Whatever made them stood taller than you and dragged its hand down hard enough to leave splinters curled like shavings.

Then the drip stops. In the quiet, from somewhere past the door, comes a slow dry scrape, like a heavy lid shifted a finger's width across stone. It does not come again. The torch gutters once and steadies.

Where: cellar, landing · DT 1 (rooms 1/4) · Stamina 17 · wounds 0/10 · torch lit · the scrape came from beyond the open door and has gone silent

## Turn 3
[PLAYER] PLAYER [3/14]: I step across the room to the far door.
[TOOLS]
$ python3 player.py S4
PLAYER [3/14]: I step across the room to the far door.
[REF]
The door gives onto a low storeroom, the ceiling close enough to touch. A shelf unit has come down across the back wall, planks split and jars burst long ago, and under its weight a small iron-banded chest sits wedged, one corner showing. Ankle-deep water pools in the corners. The floor near the chest is scorched in a ragged ring, old soot, and a few cold black coals lie scattered in the silt as if tipped from a brazier. Past the wreckage, a wide archway opens on a larger dark, and from it comes the same dry smell of stone dust.

Nothing stirs here. The chest is a short stride off, the archway a little farther.

Where: cellar, storeroom · DT 1 (rooms 2/4) · Stamina 17 · wounds 0/10 · torch lit · the chest under the shelf, the archway beyond

## Turn 4
[PLAYER] PLAYER [4/14]: I deal with whatever comes through, sword first. Torch high.
(roll on request: attack / Trade Blows)
[TOOLS]
$ python3 player.py S4
PLAYER [4/14]: I deal with whatever comes through, sword first. Torch high.
(roll on request: attack / Trade Blows)
$ python3 ledger.py attack --why "Trade Blows vs razorback 1"
ATTACK Trade Blows vs razorback 1 · S+3 · - · [6,4]=13 → T2 · HIT 7 dam
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "razorback 1 claws"
Ref: TEST · razorback 1 claws · +2 · [2,3]=7 → T1
[REF]
Torch high, you hold the doorway. The scrape comes again, nearer, and a shape unfolds from the dark of the archway: a lean, grey-skinned thing, hunched, a ridge of bone spines running down its back like a split comb. It lunges across the wet floor with its claws out. Your sword meets it first, a hard diagonal that opens its shoulder to the grey rot beneath. It staggers but does not cry out. Its claw rakes past your shield rim, a hand's width from your throat.

Behind it, two more shapes shift beyond the arch, spines rattling as they slide out from behind a pillar. They do not hurry. The wounded one is close enough to smell.

Ref: TEST · razorback 1 claws · +2 · [2,3]=7 → T1

Where: cellar, storeroom (arch to crypt hall) · DT 1 (rooms 2/4) · Stamina 17 · wounds 0/10 · torch lit · a gashed razorback at your blade, two more behind it

## Turn 5
[PLAYER] PLAYER [5/14]: I press on the nearest one.
[TOOLS]
$ python3 player.py S4
PLAYER [5/14]: I press on the nearest one.
$ python3 ledger.py attack --why "Trade Blows vs razorback 1"
ATTACK Trade Blows vs razorback 1 · S+3 · - · [6,1]=10 → T1 · MISS
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "razorback 1 claws"
Ref: TEST · razorback 1 claws · +2 · [7,7]=16 → T2
$ python3 ledger.py take 3
LEDGER: took 3 (AD 25→22, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 22 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "razorback 2 spine (unengaged, crow T1 move)"
Ref: TEST · razorback 2 spine (unengaged, crow T1 move) · +2 · [3,9]=14 → T2
$ python3 ledger.py take 2
LEDGER: took 2 (AD 22→20, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 20 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
You step in and cut, but the thing drops its wounded shoulder and your blade scrapes only wet stone and gristle. Its claws come back across your guard and rattle off your armor, hard enough to jar your teeth. Over its shoulder, the second shape flicks its back and a bone spine whips out of the ridge and cracks against your breastplate, glancing off with a bright scratch.

The first creature is hurt, its arm hanging at a wrong angle, and still it comes on, mouth working soundlessly. The other two hold back in the arch, spines rising and falling like breathing. The torch spits as drips fall from the ceiling.

Ref: TEST · razorback 1 claws · +2 · [7,7]=16 → T2; TEST · razorback 2 spine (unengaged, crow T1 move) · +2 · [3,9]=14 → T2

Where: cellar, storeroom (arch to crypt hall) · DT 1 (rooms 2/4) · Stamina 17 · wounds 0/10 · torch lit · the hurt razorback is on you and a spine-thrower waits behind it

## Turn 6
[PLAYER] PLAYER [6/14]: I finish them and move on to the next room.
[TOOLS]
$ python3 player.py S4
PLAYER [6/14]: I finish them and move on to the next room.
$ python3 ledger.py attack --why "Trade Blows vs razorback 1"
ATTACK Trade Blows vs razorback 1 · S+3 · - · [5,9]=17 → T3 · HIT 10 dam
STATUS Stamina 17 · AD 20 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "razorback 1 claws"
Ref: TEST · razorback 1 claws · +2 · [7,10]=19 → T3
$ python3 ledger.py take 4
LEDGER: took 4 (AD 20→16, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 16 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
You go in low and put the whole weight of your shoulder behind the blade. It punches through the ribs and out of the creature's back, and the thing folds around the steel. Even as it dies its claws rake down across your plate, and the armor shrieks and splits along a seam. Then it drops, and the sword drags free of it with a sound like tearing wet cloth.

Two razorbacks remain at the arch, shoulder to shoulder, spines raised and rattling. The nearer crouches to spring. The other, farther back in the dark of the crypt hall, turns its head slowly, following your torch.

Ref: TEST · razorback 1 claws · +2 · [7,10]=19 → T3

Where: cellar, storeroom (arch to crypt hall) · DT 1 (rooms 2/4) · Stamina 17 · wounds 0/10 · torch lit · two razorbacks at the arch, one crouched to leap

## Turn 7
[PLAYER] PLAYER [7/14]: I open the next door and go in.
[TOOLS]
$ python3 player.py S4
PLAYER [7/14]: I open the next door and go in.
[REF]
There is no door, only the broad arch, and the razorbacks fill it. You shoulder forward into the crypt hall and they give ground a step, no more, spines flaring. The hall opens around you, a long vault of sweating stone with a double row of thick pillars marching into the dark, stone slabs on both sides cracked open and empty. The torch throws your shadow far across the floor and makes the pillars seem to lean.

The nearer razorback is at your hip now, close enough that its breath smells of cold earth. The second slips sideways behind a pillar, a bony ridge showing above the stone. Water drips somewhere in the vault. Ahead, at the far end, a second archway stands dimly lit by nothing at all.

Where: cellar, crypt hall · DT 1 (rooms 3/4) · Stamina 17 · wounds 0/10 · torch lit · a razorback at your hip, the other sliding behind a pillar


## Turn 8
[PLAYER] PLAYER [8/14]: I search the room for treasure and the way on.
(roll on request: only if asked)
[TOOLS]
$ python3 player.py S4
PLAYER [8/14]: I search the room for treasure and the way on.
(roll on request: only if asked)
$ python3 ledger.py test M --b 1 --why "search crypt hall with foes at hip"
TEST search crypt hall with foes at hip · M+0 · b · [10,10]=18(incl -2) → T3 CRIT
STATUS Stamina 17 · AD 16 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
You keep the razorback in the edge of your eye and read the hall anyway. The slabs hold nothing but dust and a few green coins fused to the stone, worthless. But the floor tells you the rest: two grey trails scuffed through the silt, one to each pillar, and a worn path of bare stone that leads under the far arch toward a smell of old bone. The creature at your hip lunges, and you are already turning. The claws find only air and the crypt's cold.

The razorback's gaze is on your torch, not on you. Its partner behind the pillar has shifted to flank, and you see exactly where it will have to step to do it.

Where: cellar, crypt hall · DT 1 (rooms 3/4) · Stamina 17 · wounds 0/10 · torch lit · one razorback at your hip, its partner circling the pillar at your flank

## Turn 9
[PLAYER] PLAYER [9/14]: I go on to the next room.
[TOOLS]
$ python3 player.py S4
PLAYER [9/14]: I go on to the next room.
$ python3 ledger.py ud torch
UD torch · [5] → 1→1
STATUS Stamina 17 · AD 16 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py enc --en 9
Ref: encounter d10=2 vs EN 9 → none
$ python3 engine/engine.py roll d6 --why "DT 2 length (rooms)"
Ref: d6 [1]=1 · DT 2 length (rooms)
[REF]
You take the worn path and the razorbacks take it with you, one at your heel, one gliding along the pillars, keeping its distance. Under the far arch the air turns dry and sour. You are in a narrow ossuary, walls of shelves from floor to ceiling, each shelf stacked with long bones and skulls grinning in rows, some gone yellow, some black. A skull on a low shelf near the arch has a dull glint in one eye socket.

The torch burns steady, the flame small. Behind you the two creatures crowd the arch, spines scraping the stone. The first is already through, close at your back.

Ref: UD torch · [5] → 1→1; Ref: encounter d10=2 vs EN 9 → none; Ref: d6 [1]=1 · DT 2 length (rooms)

Where: cellar, ossuary · DT 2 (rooms 0/1) · Stamina 17 · wounds 0/10 · torch lit · a razorback through the arch at your back, its partner behind it

## Turn 10
[PLAYER] PLAYER [10/14]: I go through the next door.
[TOOLS]
$ python3 player.py S4
PLAYER [10/14]: I go through the next door.
$ python3 ledger.py ud torch
UD torch · [3] → 1→1
STATUS Stamina 17 · AD 16 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py enc --en 9
Ref: encounter d10=6 vs EN 9 → none
$ python3 engine/engine.py roll d6 --why "DT 3 length (rooms)"
Ref: d6 [4]=4 · DT 3 length (rooms)
[REF]
You leave the skull and its glint behind and push through a low iron-bound door at the ossuary's end. The razorbacks come after you, one hard on your heels. The door opens on a side vault, a squat chamber of stacked stone coffins, lids slid aside. In the middle of the floor, a bigger creature stands waiting, taller than the others, shoulders hunched, claws that reach nearly to its knees. Its spine ridge is a row of black hooks. A razorback stands beside it, head cocked toward your light.

The big one does not look at you. It looks at the door you came through, and at what follows you in.

Ref: encounter d10=6 vs EN 9 → none; Ref: d6 [4]=4 · DT 3 length (rooms)

Where: cellar, side vault · DT 3 (rooms 0/4) · Stamina 17 · wounds 0/10 · torch lit · a longclaw and a razorback ahead, two razorbacks crowding the door at your back

## Turn 11
[PLAYER] PLAYER [11/14]: I engage whatever is in the way, sword first.
(roll on request: attack / Trade Blows)
[TOOLS]
$ python3 player.py S4
PLAYER [11/14]: I engage whatever is in the way, sword first.
(roll on request: attack / Trade Blows)
$ python3 ledger.py attack --why "Trade Blows vs longclaw"
ATTACK Trade Blows vs longclaw · S+3 · - · [2,9]=14 → T2 · HIT 7 dam
STATUS Stamina 17 · AD 16 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "longclaw claws"
Ref: TEST · longclaw claws · +2 · [1,5]=8 → T1
[REF]
You go for the tall one, driving in under its guard. The sword bites across its ribs, a deep wet cut that spills grey rot over the stone. It rocks back, then rakes at you with claws as long as daggers, but you are inside the reach of the swing and the hooks scrape harmlessly past your shoulder, sparking on your plate. It makes no sound, only draws a long breath through its torn chest.

Behind you the razorbacks flood into the vault, their spines clicking. One splits left along the coffins. The other holds at your back, claws opening and closing. The leader straightens, wounded and furious, and the blade of your sword runs black.

Ref: TEST · longclaw claws · +2 · [1,5]=8 → T1

Where: cellar, side vault · DT 3 (rooms 0/4) · Stamina 17 · wounds 0/10 · torch lit · the wounded longclaw squares up while razorbacks close in behind and beside you

## Turn 12
[PLAYER] PLAYER [12/14]: I press the nearest.
[TOOLS]
$ python3 player.py S4
PLAYER [12/14]: I press the nearest.
$ python3 ledger.py attack --why "Trade Blows vs longclaw"
ATTACK Trade Blows vs longclaw · S+3 · - · [2,4]=9 → T1 · MISS
STATUS Stamina 17 · AD 16 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "longclaw claws"
Ref: TEST · longclaw claws · +2 · [8,1]=11 → T1
$ python3 engine/engine.py test 2 --why "razorback 2 claws (unengaged, crow T1 move)"
Ref: TEST · razorback 2 claws (unengaged, crow T1 move) · +2 · [1,7]=10 → T1
[REF]
You lunge at the leader, but your boots slip in the wet, and the stroke goes wide of the grey ribs. It answers with a backhand that your shield catches, and the blow rings up your arm. From behind, one of the razorbacks drives its claws at your kidney and finds only the angle of your armor, scraping a long bright line across the plate.

The longclaw bares black gums. For a moment you have all four of them in the torchlight, the leader before you, one razorback crowding your back, one slipping along the coffins to your left, and the last hanging by the door, spines flaring. The torch gutters in a draught from somewhere.

Ref: TEST · longclaw claws · +2 · [8,1]=11 → T1; Ref: TEST · razorback 2 claws (unengaged, crow T1 move) · +2 · [1,7]=10 → T1

Where: cellar, side vault · DT 3 (rooms 0/4) · Stamina 17 · wounds 0/10 · torch lit · the leader squares up, razorbacks at your back, flank and the door

## Turn 13
[PLAYER] PLAYER [13/14]: I finish it and look for the exit.
[TOOLS]
$ python3 player.py S4
PLAYER [13/14]: I finish it and look for the exit.
$ python3 ledger.py attack --why "Trade Blows vs longclaw"
ATTACK Trade Blows vs longclaw · S+3 · - · [10,8]=21 → T3 · HIT 10 dam
STATUS Stamina 17 · AD 16 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "longclaw claws"
Ref: TEST · longclaw claws · +2 · [6,3]=11 → T1
[REF]
You step through the leader's guard and cut upward, and the blade goes in under the jaw and out through the ridge of black hooks. It reels, spilling grey rot, one clawed hand scrabbling at the ruin of its throat, but it is still on its feet. Its backhand comes late and slow and glances off your shield with no force behind it.

It is not dead. It stands with its head cocked at a wrong angle, and the three razorbacks press in around you, one at your back and two on your flanks, spines rattling. Beyond the leader, past the toppled coffins, a narrow stair climbs into dark, a draught of cleaner air coming down it. The way out is there, and every step of it runs past the longclaw.

Ref: TEST · longclaw claws · +2 · [6,3]=11 → T1

Where: cellar, side vault · DT 3 (rooms 0/4) · Stamina 17 · wounds 0/10 · torch lit · the mauled longclaw stands between you and the stair, razorbacks at your back and flanks
