## Turn 1
[PLAYER] PLAYER [1/14]: I enter the cellar by the stair and look the first room over before stepping in.
[TOOLS]
$ python3 player.py S4
PLAYER [1/14]: I enter the cellar by the stair and look the first room over before stepping in.
(roll on request: only if asked)
$ python3 engine/engine.py roll d6 --why "DT 1 length (rooms)"
Ref: d6 [1]=1 · DT 1 length (rooms)
$ python3 ledger.py ud torch
UD torch · [4] → 1→1
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py enc --en 9
Ref: encounter d10=10 vs EN 9 → ENCOUNTER NOW
$ python3 engine/engine.py table undead_dungeon_encounters --why "DT1 encounter now"
Ref: Undead Dungeon Encounters (F34) d10 [5]=5 → 1d6 undead A and 1d6 undead B · DT1 encounter now
$ python3 engine/engine.py roll d6 --why "number of undead A"
Ref: d6 [2]=2 · number of undead A
$ python3 engine/engine.py roll d6 --why "number of undead B"
Ref: d6 [5]=5 · number of undead B
[REF] DT 1 begins as Mara steps onto the cellar stair. Wet stone sheens in the torchlight. Claw marks score the door frame, deep and fresh-edged, and the stench of old rot sits thick in the throat. The landing is empty, and the one room is read in a breath.

Then the dark below answers. Wet scraping, a dry clatter of something leaping from stone to stone, and a low hiss that does not stop for breath. Pale shapes slide into the edge of the torchlight, hunched and long-armed, spines raised along their backs like split ribs. Two of them are lean and quick. Five more are bigger, with claws as long as a man's forearm. They are coming up the passage toward the light, toward her.

Ref: encounter d10=10 vs EN 9 → ENCOUNTER NOW

Ref: Undead Dungeon Encounters (F34) d10 [5]=5 → 1d6 undead A and 1d6 undead B · DT1 encounter now

Stair landing · DT 1 (room 1 of 1 done, DT ends) · Stamina 17 · wounds 0/10 · torch 1 UD · seven undead closing in the passage, claws scraping stone, the stair at her back.

## Turn 2
[PLAYER] PLAYER [2/14]: I search the first room carefully, checking the floor and the shelves.
[TOOLS]
$ python3 player.py S4
PLAYER [2/14]: I search the first room carefully, checking the floor and the shelves.
(roll on request: only if asked)
$ python3 engine/engine.py init
Ref: initiative d10=7 → crows act first
$ python3 engine/engine.py test 2 --why "undead B1 spine (ranged 10) at Mara"
Ref: TEST · undead B1 spine (ranged 10) at Mara · +2 · [8,2]=12 → T2
$ python3 engine/engine.py test 2 --why "undead B2 spine (ranged 10) at Mara"
Ref: TEST · undead B2 spine (ranged 10) at Mara · +2 · [8,4]=14 → T2
$ python3 engine/engine.py test 2 --why "undead B3 spine (ranged 10) at Mara"
Ref: TEST · undead B3 spine (ranged 10) at Mara · +2 · [8,10]=20 → T3
$ python3 engine/engine.py test 2 --why "undead B4 spine (ranged 10) at Mara"
Ref: TEST · undead B4 spine (ranged 10) at Mara · +2 · [3,5]=10 → T1
$ python3 engine/engine.py test 2 --why "undead B5 spine (ranged 10) at Mara"
Ref: TEST · undead B5 spine (ranged 10) at Mara · +2 · [1,6]=9 → T1
$ python3 ledger.py take 8
LEDGER: took 8 (AD 25→17, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 17 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF] Mara crouches over the landing, and the search is short work. Bare wet stone, the claw-scored frame, a rind of slime on the lowest step. Nothing else is here.

She has not finished looking when the dark shrieks. The two lean ones spring forward in long, broken leaps and land crouched at the torchlight's edge, a few strides off, claws dragging. The larger five hang back in the passage and arch their backs. Bone splinters hiss out of the gloom. One skips off the wall. Two thud into her armor, and a third punches clean through a gap and rings off her plate with a wet crack.

The leapers shuffle sideways, spreading to either side of the stair, and all seven pairs of eyes hold on her.

Ref: initiative d10=7 → crows act first; B spines TEST +2: [8,2]=12 T2, [8,4]=14 T2, [8,10]=20 T3, [3,5]=10 T1, [1,6]=9 T1

Stair landing · DT 2 begins next (roll pending) · Stamina 17 · AD 17 · wounds 0/10 · torch 1 UD · two razorbacks a leap from her, five longclaws spitting spines from the passage.

## Turn 3
[PLAYER] PLAYER [3/14]: I step across the room to the far door.
[TOOLS]
$ python3 player.py S4
PLAYER [3/14]: I step across the room to the far door.
(roll on request: only if asked)
$ python3 engine/engine.py roll d6 --why "DT 2 length (rooms)"
Ref: d6 [2]=2 · DT 2 length (rooms)
$ python3 engine/engine.py init
Ref: initiative d10=9 → crows act first
$ python3 engine/engine.py test 2 --why "undead A1 claws at Mara"
Ref: TEST · undead A1 claws at Mara · +2 · [3,1]=6 → T1
$ python3 engine/engine.py test 2 --why "undead A2 claws at Mara"
Ref: TEST · undead A2 claws at Mara · +2 · [2,4]=8 → T1
$ python3 engine/engine.py test 2 --why "undead B1 spine at Mara"
Ref: TEST · undead B1 spine at Mara · +2 · [1,2]=5 → T1 DOOM
$ python3 engine/engine.py test 2 --why "undead B2 spine at Mara"
Ref: TEST · undead B2 spine at Mara · +2 · [2,1]=5 → T1 DOOM
$ python3 engine/engine.py test 2 --why "undead B3 spine at Mara"
Ref: TEST · undead B3 spine at Mara · +2 · [9,3]=14 → T2
$ python3 engine/engine.py test 2 --why "undead B4 spine at Mara"
Ref: TEST · undead B4 spine at Mara · +2 · [2,7]=11 → T1
$ python3 engine/engine.py test 2 --why "undead B5 spine at Mara"
Ref: TEST · undead B5 spine at Mara · +2 · [7,2]=11 → T1
$ python3 engine/engine.py roll d10 --why "ranged miss friendly fire parity B1doom (odd = ally hit)"
Ref: d10 [3]=3 · ranged miss friendly fire parity B1doom (odd = ally hit)
$ python3 engine/engine.py roll d10 --why "ranged miss friendly fire parity B2doom (odd = ally hit)"
Ref: d10 [6]=6 · ranged miss friendly fire parity B2doom (odd = ally hit)
$ python3 engine/engine.py roll d10 --why "ranged miss friendly fire parity B4 (odd = ally hit)"
Ref: d10 [1]=1 · ranged miss friendly fire parity B4 (odd = ally hit)
$ python3 engine/engine.py roll d10 --why "ranged miss friendly fire parity B5 (odd = ally hit)"
Ref: d10 [7]=7 · ranged miss friendly fire parity B5 (odd = ally hit)
$ python3 engine/engine.py roll d6 --why "random ally hit by B1 (1=A1 2=A2 3-6=other B's in order)"
Ref: d6 [2]=2 · random ally hit by B1 (1=A1 2=A2 3-6=other B's in order)
$ python3 engine/engine.py roll d6 --why "random ally hit by B4 (1=A1 2=A2 3-6=other B's in order)"
Ref: d6 [2]=2 · random ally hit by B4 (1=A1 2=A2 3-6=other B's in order)
$ python3 engine/engine.py roll d6 --why "random ally hit by B5 (1=A1 2=A2 3-6=other B's in order)"
Ref: d6 [4]=4 · random ally hit by B5 (1=A1 2=A2 3-6=other B's in order)
$ python3 ledger.py take 2
LEDGER: took 2 (AD 17→15, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 15 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF] Mara crosses the landing in a few quick strides and fetches up against the far door, wet wood under her shoulder. The leapers come after her in a scrabble of claws, both swiping at the air where she was a heartbeat ago and raking only the stone. Behind them the longclaws loose another volley, and it goes wrong. Two of the splinters go wide and smack into the hunched back of the nearest razorback, which jerks and screeches and turns its head to snap at the dark. A third spine finds Mara's armor and skips away.

The leaper nursing its wounds is leaking black fluid down its ribs and holding one arm tight to its chest. The other is still reaching. Its claws are an arm's length from her back. The longclaws shoulder forward, filling the passage behind them.

Ref: A claws +2: [3,1]=6 T1, [2,4]=8 T1; B spines +2: [1,2]=5 T1 DOOM, [2,1]=5 T1 DOOM, [9,3]=14 T2, [2,7]=11 T1, [7,2]=11 T1 (init d10=9 crows first)

Stair landing, far door · DT 2 (room 1 of 2) · Stamina 17 · wounds 0/10 · torch 1 UD · two razorbacks on her heels, five longclaws pressing up the passage.

## Turn 4
[PLAYER] PLAYER [4/14]: I deal with whatever comes through, sword first. Torch high.
[TOOLS]
$ python3 player.py S4
PLAYER [4/14]: I deal with whatever comes through, sword first. Torch high.
(roll on request: attack / Trade Blows)
$ python3 engine/engine.py init
Ref: initiative d10=2 → enemies act first
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [7,4]=14 → T2 · HIT 7 dam
STATUS Stamina 17 · AD 15 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "undead A1 claws at Mara"
Ref: TEST · undead A1 claws at Mara · +2 · [3,6]=11 → T1
$ python3 engine/engine.py test 2 --why "undead A2 claws at Mara"
Ref: TEST · undead A2 claws at Mara · +2 · [9,1]=12 → T2
$ python3 engine/engine.py test 2 --why "undead B1 spine at Mara"
Ref: TEST · undead B1 spine at Mara · +2 · [2,8]=12 → T2
$ python3 engine/engine.py test 2 --why "undead B2 spine at Mara"
Ref: TEST · undead B2 spine at Mara · +2 · [1,2]=5 → T1 DOOM
$ python3 engine/engine.py test 2 --why "undead B3 spine at Mara"
Ref: TEST · undead B3 spine at Mara · +2 · [2,10]=14 → T2
$ python3 engine/engine.py test 2 --why "undead B4 spine at Mara"
Ref: TEST · undead B4 spine at Mara · +2 · [7,5]=14 → T2
$ python3 engine/engine.py test 2 --why "undead B5 spine at Mara"
Ref: TEST · undead B5 spine at Mara · +2 · [2,10]=14 → T2
$ python3 engine/engine.py roll d10 --why "ranged miss parity B2 doom (odd = ally hit)"
Ref: d10 [7]=7 · ranged miss parity B2 doom (odd = ally hit)
$ python3 engine/engine.py roll d6 --why "random ally hit by B2 (1=A1 2=A2 3=B1 4=B3 5=B4 6=B5)"
Ref: d6 [2]=2 · random ally hit by B2 (1=A1 2=A2 3=B1 4=B3 5=B4 6=B5)
$ python3 ledger.py take 10
LEDGER: took 10 (AD 15→5, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 5 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF] The enemy moves first. A razorback lunges and rakes her ribs, and its twin hacks wide. Behind them the longclaws spit another storm of bone. Four splinters find her, a rattle of blows that wears her plate down to bare scraps. A fifth, loosed carelessly by a longclaw that is shrieking at nothing, tears across the wounded razorback's neck and spills it, twitching, onto the stones.

Then the torch swings high and the sword comes down on the last razorback in reach. Steel bites deep into its shoulder and it reels, black fluid spilling, one arm hanging, and still it hisses and crouches to spring.

Her armor is nearly gone. The longclaws are close enough now that she can smell them, rot and old iron, and the passage behind them is a wall of pale backs and clicking claws.

Ref: initiative d10=2 → enemies act first

Stair landing, far door · DT 2 (room 1 of 2) · Stamina 17 · wounds 0/10 · torch 1 UD · one razorback badly hurt before her, five longclaws a few strides back, armor nearly stripped.

## Turn 5
[PLAYER] PLAYER [5/14]: I press on the nearest one.
[TOOLS]
$ python3 player.py S4
PLAYER [5/14]: I press on the nearest one.
$ python3 engine/engine.py init
Ref: initiative d10=9 → crows act first
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [9,7]=19 → T3 · HIT 10 dam
STATUS Stamina 17 · AD 5 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "undead B1 spine at Mara"
Ref: TEST · undead B1 spine at Mara · +2 · [2,6]=10 → T1
$ python3 engine/engine.py test 2 --why "undead B2 spine at Mara"
Ref: TEST · undead B2 spine at Mara · +2 · [7,9]=18 → T3
$ python3 engine/engine.py test 2 --why "undead B3 spine at Mara"
Ref: TEST · undead B3 spine at Mara · +2 · [4,10]=16 → T2
$ python3 engine/engine.py test 2 --why "undead B4 spine at Mara"
Ref: TEST · undead B4 spine at Mara · +2 · [8,7]=17 → T3
$ python3 engine/engine.py test 2 --why "undead B5 spine at Mara"
Ref: TEST · undead B5 spine at Mara · +2 · [3,2]=7 → T1
$ python3 engine/engine.py roll d10 --why "ranged miss parity B1 (odd = ally hit)"
Ref: d10 [9]=9 · ranged miss parity B1 (odd = ally hit)
$ python3 engine/engine.py roll d10 --why "ranged miss parity B5 (odd = ally hit)"
Ref: d10 [3]=3 · ranged miss parity B5 (odd = ally hit)
$ python3 ledger.py take 10
LEDGER: took 10 (AD 5→0, Stamina 17→12, wounds 0→0)
STATUS Stamina 12 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py roll d4 --why "ally hit by B1 (1=B2 2=B3 3=B4 4=B5), 2 dam"
Ref: d4 [1]=1 · ally hit by B1 (1=B2 2=B3 3=B4 4=B5), 2 dam
$ python3 engine/engine.py roll d4 --why "ally hit by B5 (1=B1 2=B2 3=B3 4=B4), 2 dam"
Ref: d4 [3]=3 · ally hit by B5 (1=B1 2=B2 3=B3 4=B4), 2 dam
[REF] Mara drives forward and her blade takes the wounded razorback under the jaw. It goes down in a spill of black and does not rise.

There is no breath to take. Bone splinters come out of the dark in a hail. One tears her sleeve, one whips past her ear, and two hit home with the hard crack of nails into wood. Her armor is gone now. Cold, wet pain runs down her arm to the wrist, and the stone under her boots is no longer dry.

Two more splinters go astray and stick in the longclaws' own flanks. They do not even flinch. The five of them come on together, hunched shoulder to shoulder, the nearest one a stride and a half away with its claws spread.

Ref: initiative d10=9 → crows act first; B spines +2: [2,6]=10 T1, [7,9]=18 T3, [4,10]=16 T2, [8,7]=17 T3, [3,2]=7 T1

Stair landing, far door · DT 2 (room 1 of 2) · Stamina 12 · wounds 0/10 · torch 1 UD · no armor left, five longclaws closing to claw range.

## Turn 6
[PLAYER] PLAYER [6/14]: I finish them and move on to the next room.
[TOOLS]
$ python3 player.py S4
PLAYER [6/14]: I finish them and move on to the next room.
$ python3 engine/engine.py init
Ref: initiative d10=2 → enemies act first
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [9,8]=20 → T3 · HIT 10 dam
STATUS Stamina 12 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "undead B1 claws at Mara"
Ref: TEST · undead B1 claws at Mara · +2 · [5,9]=16 → T2
$ python3 engine/engine.py test 2 --why "undead B2 claws at Mara"
Ref: TEST · undead B2 claws at Mara · +2 · [4,6]=12 → T2
$ python3 engine/engine.py test 2 --why "undead B3 claws at Mara"
Ref: TEST · undead B3 claws at Mara · +2 · [3,5]=10 → T1
$ python3 engine/engine.py test 2 --why "undead B4 claws at Mara"
Ref: TEST · undead B4 claws at Mara · +2 · [10,8]=20 → T3
$ python3 engine/engine.py test 2 --why "undead B5 claws at Mara"
Ref: TEST · undead B5 claws at Mara · +2 · [9,1]=12 → T2
$ python3 ledger.py take 14
LEDGER: took 14 (AD 0→0, Stamina 12→0, wounds 0→2)
STATUS Stamina 0 · AD 0 · wounds 2/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 4 --p
LEDGER: took 4P (AD 0→0, Stamina 0→0, wounds 2→6)
STATUS Stamina 0 · AD 0 · wounds 6/10 · uses Slashing 3 · UD torch 1
[REF] The longclaws reach her all at once. Claws open her shoulder, her flank, her thigh. The big one on her left drives a hooked blow through the gap in her guard and she feels the flesh part like wet cloth. Each wound weeps and keeps weeping, a bright thread of lacerations down her body.

She cuts the nearest one hard across the chest, and black fluid sheets down its ribs. Then she shoves through the door with her shoulder and strains into the next room, and every stride tears the lacerations wider. Blood runs off her fingertips. There is nothing left in her to take a blow.

Beyond the door is a low storeroom, wet and cramped. A shelf has collapsed across the far wall and pinned an iron-bound chest beneath its splintered boards. Behind her the longclaws scrabble at the doorway, claws chewing the frame, the hiss rising.

Ref: initiative d10=2 → enemies act first; B claws +2: [5,9]=16 T2, [4,6]=12 T2, [3,5]=10 T1, [10,8]=20 T3, [9,1]=12 T2

Storeroom · DT 2 (room 2 of 2, next area ends it) · Stamina 0 · wounds 6/10 · torch 1 UD · five longclaws at the door behind her, one cut deep, lacerations bleeding her with every move.

## Turn 7
[PLAYER] PLAYER [7/14]: I open the next door and go in.
[TOOLS]
$ python3 player.py S4
PLAYER [7/14]: I open the next door and go in.
$ python3 engine/engine.py init
Ref: initiative d10=1 → enemies act first
$ python3 engine/engine.py test 2 --why "undead B1 claws at Mara"
Ref: TEST · undead B1 claws at Mara · +2 · [3,2]=7 → T1
$ python3 engine/engine.py test 2 --why "undead B2 claws at Mara"
Ref: TEST · undead B2 claws at Mara · +2 · [8,4]=14 → T2
$ python3 engine/engine.py test 2 --why "undead B3 claws at Mara"
Ref: TEST · undead B3 claws at Mara · +2 · [2,3]=7 → T1
$ python3 engine/engine.py test 2 --why "undead B4 claws at Mara"
Ref: TEST · undead B4 claws at Mara · +2 · [2,8]=12 → T2
$ python3 engine/engine.py test 2 --why "undead B5 claws at Mara"
Ref: TEST · undead B5 claws at Mara · +2 · [2,4]=8 → T1
$ python3 ledger.py take 6
LEDGER: took 6 (AD 0→0, Stamina 0→0, wounds 6→12) · CROWS DEAD
STATUS Stamina 0 · AD 0 · wounds 12/10 · uses Slashing 3 · UD torch 1
[REF] The enemy moves first. The longclaws pour through the doorway in a rush of pale limbs. Two of them catch her as she reaches for the far door, and the claws sink in under her ribs and across her back. Her fingers slip on the wet latch and find only air.

The torch drops. It rolls across the flagstones, sputters, and gutters in a puddle of black water. The cellar goes dark around the sound of her breathing, which gets shorter, and then does not come again.

Stone is cold under her cheek. The claws are still working, and the hiss of the longclaws is the last thing she knows.

Ref: initiative d10=1 → enemies act first; B claws +2: [3,2]=7 T1, [8,4]=14 T2, [2,3]=7 T1, [2,8]=12 T2, [2,4]=8 T1

Storeroom · DT 2 · Stamina 0 · wounds 12/10 · Mara is dead.

DONE
Ran 7 turns; Mara died on turn 7.
