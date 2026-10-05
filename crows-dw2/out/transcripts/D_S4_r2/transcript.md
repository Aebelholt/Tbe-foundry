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
