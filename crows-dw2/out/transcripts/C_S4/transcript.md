## Turn 1
[PLAYER] PLAYER [1/14]: I enter the cellar by the stair and look the first room over before stepping in.
[TOOLS]
$ python3 player.py S4
PLAYER [1/14]: I enter the cellar by the stair and look the first room over before stepping in.
(roll on request: only if asked)
$ python3 engine/engine.py roll d6 --why "DT 1 length (rooms)"
Ref: d6 [2]=2 · DT 1 length (rooms)
[REF] The stair ends in a low landing slick with seep water, and your torch throws a trembling orange circle across it. Wet stone sweats under the light. The door frame ahead is scored with four long parallel gouges, deep and fresh enough that pale dust still clings in the grooves, about the height of your shoulder. The air is thick with old rot, sweet and clotted, pooling at the foot of the stair. Nothing stirs. Water drips somewhere beyond the door, slow and regular, and under it there is another sound you cannot place, a faint dry ticking, like a nail tapped on bone.

Ref: d6 [2]=2 · DT 1 length (rooms)

Cellar landing · DT 1 (rooms 0/2) · Stamina 17 · wounds 0/10 · torch (UD 1) · The scored door frame stands open before you, and the ticking behind it has just stopped.

## Turn 2
[PLAYER] PLAYER [2/14]: I search the first room carefully, checking the floor and the shelves.
[TOOLS]
$ python3 player.py S4
PLAYER [2/14]: I search the first room carefully, checking the floor and the shelves.
(roll on request: only if asked)
[REF] There is little to search. The floor is flagstone under a skin of black silt, and your torch shows you the marks in it: drag trails, shallow and old, running from the stair foot to the door and none coming back. No shelves, only iron brackets rusted to stubs in the wall. In the corner a rat has died, or been left, its belly opened from throat to tail and its fur gone stiff with brown water. The claw gouges on the frame, seen close, were made from this side of the door, going out. The stench is strongest where the silt is thickest, and your boots leave clean prints in it, dark and wet, that anyone could follow.

Cellar landing, searched · DT 1 (rooms 1/2) · Stamina 17 · wounds 0/10 · torch (UD 1) · Past the scored frame a second room opens, and the dripping there has changed to something heavier, like a body shifting weight.

## Turn 3
[PLAYER] PLAYER [3/14]: I step across the room to the far door.
[TOOLS]
$ python3 player.py S4
PLAYER [3/14]: I step across the room to the far door.
$ python3 ledger.py ud torch   (DT 1 end)
UD torch · [4] → 1→1
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py enc --en 9   (DT 1 end)
Ref: encounter d10=8 vs EN 9 → none
$ python3 ledger.py status
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py roll d6 --why "DT 2 length (rooms)"
Ref: d6 [4]=4 · DT 2 length (rooms)
[REF] You wade the landing in four strides and push the door. It gives with a groan of swollen wood onto a long storeroom, and the torch finds it a piece at a time. Ruined shelving has come down along the left wall in a slope of rotten planks, and under the heaviest part of the pile the corner of an iron-banded chest shows, its lid pinned flat by a fallen shelf. Sacking has rotted to black lace on the floor. A steady drip falls from a crack in the ceiling into a puddle, and the sound is exactly what you heard from the stair. Beneath the sweet rot there is a sharper smell, scorched and sooty, as if something had burned down here once and been drowned. The room is quiet. The chest is six paces off.

Ref: encounter d10=8 vs EN 9 → none

Storeroom · DT 2 (rooms 0/4) · Stamina 17 · wounds 0/10 · torch (UD 1) · The chest sits pinned under the fallen shelf, and the soot smell is thickest around it.

## Turn 4
[PLAYER] PLAYER [4/14]: I deal with whatever comes through, sword first. Torch high.
[TOOLS]
$ python3 player.py S4
PLAYER [4/14]: I deal with whatever comes through, sword first. Torch high.
(roll on request: attack / Trade Blows)
[REF] You plant your feet at the mouth of the storeroom with the blade out and the torch lifted, and the light swings up the walls and shows you the room's second door, a low arch on the far side, black beyond the reach of the flame. Nothing comes through yours. The drip keeps its count. Then, from past that far arch, the dry ticking starts again, nearer than on the stair, and under it a slow scrape, something with hooked edges drawn across stone and let go. It is not hurrying. Somewhere in the dark a stone shifts, and the ticking stops dead, the way a listener stops. Your torch gutters once in a draught that smells of wet bone, drawn from the arch toward you.

Storeroom · DT 2 (rooms 0/4) · Stamina 17 · wounds 0/10 · torch (UD 1) · The far arch breathes cold bone-smell at you, and whatever scraped has gone silent, listening.

## Turn 5
[PLAYER] PLAYER [5/14]: I press on the nearest one.
[TOOLS]
$ python3 player.py S4
PLAYER [5/14]: I press on the nearest one.
(roll on request: attack / Trade Blows)   [read from stdout]
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [10,1]=14 → T2 · HIT 7 dam
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "Undead A1 claws vs Mara"
Ref: TEST · Undead A1 claws vs Mara · +2 · [4,3]=9 → T1
[REF] You cross the storeroom with the torch held high, step through the low arch, and the dark opens into a hall of squat pillars standing in black water to the ankle. Something gaunt unfolds from behind the nearest pillar, a grey, ridged back bowed over long forearms, claws hooked and dripping. It was waiting at the arch. Your sword bites in under the ribs as it lunges and drags a wet, tearing line through the grey, and it hisses like air from a bladder, its claws raking the wall of stone beside your head instead of you. Two more shapes shift out from the pillars beyond, low and patient, spines lifting along their backs, their ticking loud now in the open hall. The one before you sags on a side that no longer holds, still reaching.

ATTACK attack · S+3 · - · [10,1]=14 → T2 · HIT 7 dam | Ref: TEST · Undead A1 claws vs Mara · +2 · [4,3]=9 → T1

Crypt hall · DT 2 (rooms 1/4) · Stamina 17 · wounds 0/10 · torch (UD 1) · One razorback is hooked and sagging at your blade, two more are circling out from the pillars.

## Turn 6
[PLAYER] PLAYER [6/14]: I finish them and move on to the next room.
[TOOLS]
$ python3 player.py S4
PLAYER [6/14]: I finish them and move on to the next room.
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [3,6]=12 → T2 · HIT 7 dam
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
(A1 Stamina 3 -> destroyed; no engaged foe left to roll; scene: A2 10/10 unengaged near; A3 10/10 unengaged near)
[REF] The razorback lunges one last time and you meet it at the neck. The blade goes through the grey cords with a sound like wet rope parting, and the thing folds into the water and does not rise, its claws still opening and closing on nothing. The ticking behind it falters. The other two do not rush. They slide wide around the pillars to either side of the black water, one left and one right, spines fanned and trembling, taking the measure of the lit circle you carry. The hall is long, the far end lost, but a second arch shows there, and you cannot reach it without passing between them. The nearest one lowers its head and its spine clicks, once, aimed at your face.

ATTACK attack · S+3 · - · [3,6]=12 → T2 · HIT 7 dam

Crypt hall · DT 2 (rooms 1/4) · Stamina 17 · wounds 0/10 · torch (UD 1) · Two razorbacks flank you across the black water and the nearest has its spines aimed at your face.

## Turn 7
[PLAYER] PLAYER [7/14]: I open the next door and go in.
[TOOLS]
$ python3 player.py S4
PLAYER [7/14]: I open the next door and go in.
(no roll: moving further than one band costs the exchange, no roll; scene: A2 10/10 engaged close (leapt in); A3 10/10 unengaged near)
[REF] You wade into the hall, torch out ahead, the water dragging at your boots, and the far arch is a long way off past the pillars. You make it eight paces. The razorback on your left drops its shoulder and leaps, a coiled grey shape against the torchlight, and lands in the water square in your path with a flat slap, claws held low and wide. It has put itself between you and the arch. Behind you the other one has stopped circling and now stands in the arch you came through, spines up, so that the way back is shut as well. The hall smells of cold wet bone, and the three-clawed hands of the thing before you flex in the light, close enough that you could count the hooked tips.

Crypt hall · DT 2 (rooms 1/4) · Stamina 17 · wounds 0/10 · torch (UD 1) · A razorback blocks the far arch at arm's length and its twin stands behind you in the way you came.

## Turn 8
[PLAYER] PLAYER [8/14]: I search the room for treasure and the way on.
[TOOLS]
$ python3 player.py S4
PLAYER [8/14]: I search the room for treasure and the way on.
(roll on request: only if asked)
$ python3 ledger.py test M --why "search the hall with two razorbacks on her"
TEST search the hall with two razorbacks on her · M+0 · - · [2,5]=7 → T1
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "Undead A2 claws vs Mara"
Ref: TEST · Undead A2 claws vs Mara · +2 · [10,8]=20 → T3
$ python3 engine/engine.py test 2 --why "Undead A3 spine vs Mara"
Ref: TEST · Undead A3 spine vs Mara · +2 · [10,7]=19 → T3
$ python3 ledger.py take 4
LEDGER: took 4 (AD 25→21, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 21 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 3
LEDGER: took 3 (AD 21→18, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 18 · wounds 0/10 · uses Slashing 3 · UD torch 1
(scene: A2 10/10 engaged close; A3 10/10 unengaged near, in the arch behind. Move: Hurt them)
[REF] You turn your eyes to the walls and the water instead of the claws, and the hall punishes it at once. You have time to see one thing, a niche in the nearest pillar with a pale shape in it, before the razorback in front of you rakes down across your guard and the armor shrieks along its seams, plates bent and jolted against your ribs. In the same breath a barb snaps from the spines of the one behind you and strikes your back with a ringing crack, and you are driven a step forward into the water. Neither has drawn blood, but the metal has taken it, scored and dented. Nothing else in the hall gives itself up while those two live. The pale shape in the niche is only a skull.

Ref: TEST · Undead A2 claws vs Mara · +2 · [10,8]=20 → T3 | Ref: TEST · Undead A3 spine vs Mara · +2 · [10,7]=19 → T3 | Move: Hurt them

Crypt hall · DT 2 (rooms 1/4) · Stamina 17 · wounds 0/10 · torch (UD 1) · One razorback holds the far arch at arm's length and the other has you by the back, and your armor is ringing.

