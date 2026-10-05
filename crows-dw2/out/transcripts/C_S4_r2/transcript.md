## Turn 1
[PLAYER] PLAYER [1/14]: I enter the cellar by the stair and look the first room over before stepping in.
(roll on request: only if asked)
[TOOLS]
$ python3 engine/engine.py roll d6 --why "DT 1 length (rooms)"
Ref: d6 [2]=2 · DT 1 length (rooms)
[REF]
Black water laps at the lowest steps, and your torch throws a shaking orange circle over the stair landing. The stone is slick with wet. Deep scratches run down the door frame ahead, four parallel grooves, pale where the wood was torn open and never weathered. The air is thick with the sweet stench of old rot, strongest from the doorway. Nothing stirs on the landing. Somewhere past the door, water drips in a slow, patient rhythm, and something under it scrapes once, then is quiet.

Ref: d6 [2]=2 · DT 1 length (rooms)

Cellar, landing · DT 1 (rooms 1 of 2) · Stamina 17 · wounds 0/10 · torch lit (UD 1) · the clawed doorway waits, and the scraping beyond it has stopped

## Turn 2
[PLAYER] PLAYER [2/14]: I search the first room carefully, checking the floor and the shelves.
(roll on request: only if asked)
[TOOLS] (none; the landing is empty and a careful look carries no risk, so no roll)
[REF]
There are no shelves here, only bare wet stone and the rotten stub of a cresset bracket. You crouch with the torch low and read the floor. The slime on the flags is not smooth. A broad drag trail runs from the door out across the landing and down into the black water at the stair's foot, as though something heavy hauled itself out and, much later, hauled itself back. Beside it are narrow prints, three long toes and a fourth that splays, each pressed deep and each rimmed with a dark crust. Some are fresher than the others. The claw grooves on the frame sit at the height of your shoulder. The door stands ajar, a hand's width, breathing out the cold sweetness of rot.

Cellar, landing · DT 1 (rooms 1 of 2) · Stamina 17 · wounds 0/10 · torch lit (UD 1) · the door is ajar and the fresher prints lead through it

## Turn 3
[PLAYER] PLAYER [3/14]: I step across the room to the far door.
[TOOLS]
$ python3 ledger.py ud torch
UD torch · [1] → 1→0 · EXPIRED
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 0
$ python3 engine/engine.py enc --en 9
Ref: encounter d10=4 vs EN 9 → none
$ python3 engine/engine.py roll d6 --why "DT 2 length (rooms)"
Ref: d6 [4]=4 · DT 2 length (rooms)
[REF]
You cross the landing and ease the door wide. Beyond it lies a storeroom, low and long, its shelves slumped into one another. At the far end a heavy shelf has come down across a chest, pinning it under a litter of rotted planks and broken crockery. Your torch gives a last wet cough. The flame shrinks to a bead, steadies, and goes out. The dark that closes over you is total, and the drip of water now seems to come from every side. Behind you the stair is a faint grey memory. You hear the soft click of something small rolling across stone ahead, and then nothing, and the sweet rot smell leans in close.

Ref: encounter d10=4 vs EN 9 → none (UD torch: 1 → 0, expired)

Cellar, storeroom · DT 2 begins (4 rooms) · Stamina 17 · wounds 0/10 · no light, darkness · the torch is dead in your hand and something clicked in the black ahead

## Turn 4
[PLAYER] PLAYER [4/14]: I deal with whatever comes through, sword first. Torch high.
(roll on request: attack / Trade Blows)
[TOOLS] (none; no foe is in reach, so no attack is rolled)
[REF]
You stand with the blade out and wait. Nothing comes through. The raised torch is only a cold, charred stick, and it lights nothing. The click is not repeated. In its place, from the heaped shelf at the far end, comes a slow trickle and a creak of old wood settling, then the faint chime of a shard sliding down into the dark, which answers the sound you heard. The storeroom is only rot and weight. But beyond its far wall, through the stone, you catch a different sound, dry and rhythmic, like claws drawn along a pillar, one slow stroke and then another, pacing. The cold air seeping under the far door smells much stronger than the rest. In the black you can see the chest only as a shape you remember.

Cellar, storeroom · DT 2 (rooms 1 of 4) · Stamina 17 · wounds 0/10 · no light, darkness · claws scrape stone beyond the far wall, and the chest lies somewhere ahead

## Turn 5
[PLAYER] PLAYER [5/14]: I press on the nearest one.
(roll on request: attack / Trade Blows)
[TOOLS]
$ python3 ledger.py attack --b 2
ATTACK attack · S+3 · bb · [3,8]=14 → T1 · MISS
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 0
$ python3 engine/engine.py test 2 --why "Undead A1 claws (engaged) vs Mara"
Ref: TEST · Undead A1 claws (engaged) vs Mara · +2 · [3,5]=10 → T1
$ python3 engine/engine.py test 2 --why "Undead A2 spine (unengaged, tier-1 move) vs Mara"
Ref: TEST · Undead A2 spine (unengaged, tier-1 move) vs Mara · +2 · [7,3]=12 → T2
$ python3 ledger.py take 2
LEDGER: took 2 (AD 25→23, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 23 · wounds 0/10 · uses Slashing 3 · UD torch 0
[REF]
Mara crosses the storeroom by feel, leaves the chest to its shelf, and shoulders the far door. The crypt hall opens as a colder dark with a ceiling somewhere high. Pillars stand like trunks. The nearest shape unfolds from behind one with a dry rattle and is on her in a bound, a lean, ridged thing with a hunched spine and long fingers. She swings blind and cuts only air and stone-dust. Its claws rake past her, close but wide. Then a second shape, deeper among the pillars, flicks its back. Something small and hard hisses through the dark and cracks against her armor, stinging through the plates. A third rattle answers from farther back. There are three of them, and she cannot see any.

Move: Escalate the situation
Ref: TEST · Undead A1 claws (engaged) vs Mara · +2 · [3,5]=10 → T1
Ref: TEST · Undead A2 spine (unengaged, tier-1 move) vs Mara · +2 · [7,3]=12 → T2
ATTACK attack · S+3 · bb · [3,8]=14 → T1 · MISS

Crypt hall · DT 2 (rooms 2 of 4) · Stamina 17 · wounds 0/10 · no light, darkness · three razorbacks, one at your blade, two among the pillars throwing spines

## Turn 6
[PLAYER] PLAYER [6/14]: I finish them and move on to the next room.
(roll on request: attack / Trade Blows)
[TOOLS]
$ python3 ledger.py attack --b 2
ATTACK attack · S+3 · bb · [9,10]=22 → T3 CRIT · HIT 10 dam
STATUS Stamina 17 · AD 23 · wounds 0/10 · uses Slashing 3 · UD torch 0
(A1 Stamina 10 - 10 = 0, destroyed. Crit grants an extra exchange: engage A2.)
$ python3 ledger.py attack --b 2
ATTACK attack · S+3 · bb · [2,1]=6 → T1 DOOM · MISS
STATUS Stamina 17 · AD 23 · wounds 0/10 · uses Slashing 3 · UD torch 0
$ python3 engine/engine.py test 2 --why "Undead A2 claws (engaged) vs Mara"
Ref: TEST · Undead A2 claws (engaged) vs Mara · +2 · [7,4]=13 → T2
$ python3 engine/engine.py test 2 --why "Undead A3 spine (unengaged, tier-1 move) vs Mara"
Ref: TEST · Undead A3 spine (unengaged, tier-1 move) vs Mara · +2 · [2,4]=8 → T1
$ python3 ledger.py take 3
LEDGER: took 3 (AD 23→20, Stamina 17→17, wounds 0/10)
STATUS Stamina 17 · AD 20 · wounds 0/10 · uses Slashing 3 · UD torch 0
[REF]
Her second swing is the one that lands. The blade bites through the ridged back with a crack like a split branch, and the thing folds and comes apart across the flags, rattling and still. There is no time to breathe. She turns blind toward the sound of the next one and throws a wide, hungry cut that finds only a pillar. Steel rings on stone and the jar runs up her arm. The second razorback is already inside her guard, and its claws score her armor in three long, shrieking lines. Behind it the third leaps, a pale blur you only hear, and lands on the stone at her back. The way she came is now behind it, and its spines rattle as it settles.

Move: Take something away (the way back)
Ref: TEST · Undead A2 claws (engaged) vs Mara · +2 · [7,4]=13 → T2
Ref: TEST · Undead A3 spine (unengaged, tier-1 move) vs Mara · +2 · [2,4]=8 → T1
ATTACK attack · S+3 · bb · [9,10]=22 → T3 CRIT · HIT 10 dam
ATTACK attack · S+3 · bb · [2,1]=6 → T1 DOOM · MISS

Crypt hall · DT 2 (rooms 2 of 4) · Stamina 17 · wounds 0/10 · no light, darkness · one razorback dead, one raking at you, one at your back between you and the storeroom
