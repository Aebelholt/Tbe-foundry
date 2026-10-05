## Turn 1
[PLAYER] PLAYER [1/14]: I enter the cellar by the stair and look the first room over before stepping in.
[TOOLS]
$ python3 engine/engine.py roll d6 --why "DT1 length (rooms)"
Ref: d6 [1]=1 · DT1 length (rooms)
(Mara's look over the landing is the one room; DT1 ends.)
$ python3 ledger.py ud torch
UD torch · [1] → 1→0 · EXPIRED
$ python3 engine/engine.py enc --en 9
Ref: encounter d10=10 vs EN 9 → ENCOUNTER NOW
$ python3 engine/engine.py table undead_dungeon_encounters --why "DT1 encounter now"
Ref: Undead Dungeon Encounters (F34) d10 [6]=6 → 1 undead C · DT1 encounter now
$ python3 engine/engine.py roll d6 --why "DT2 length (rooms)"
Ref: d6 [5]=5 · DT2 length (rooms)
[REF] The stair ends in black water to the ankle, cold enough to ache. Mara's torch shows her the landing: wet stone, pale claw furrows gouged deep into the door frame, and a stench of old rot that sits on the tongue. Nothing moves. Then the flame shrinks to a blue bead, sputters, and drowns in its own smoke. The dark closes over the cellar like a hand.
Somewhere ahead, water sloshes in a slow, regular rhythm, as if something is wading toward the stair and has been for some time. A dry click of bone on stone. Something thin and ridged scrapes along the frame, right where the claw marks are, and a long exhale rattles through a ribcage with no lungs behind it. It is perhaps ten paces off and it knows where she is.

Ref: encounter d10=10 vs EN 9 → ENCOUNTER NOW · Ref: Undead Dungeon Encounters (F34) d10 [6]=6 → 1 undead C

Stair landing · DT 2 (rooms 5) · Stamina 17 · wounds 0/10 · torch out, dark · something wades toward the landing, ten paces off, and the dark is total.

## Turn 2
[PLAYER] PLAYER [2/14]: I search the first room carefully, checking the floor and the shelves.
[TOOLS] (none; the landing is empty by the key, so the search turns up nothing and no roll is called. No Ref roll: foes act only through Trade Blows or Ref moves.)
[REF] Mara's hands go over the landing in the dark. Slick stone, a rotted rail, cold water over her boots, a shelf bracket furred with slime. Nothing else is here, no coin, no tool, not so much as a bone, and the search costs her the only thing she was short of.
The wading stops. Water streams off something that has just climbed up out of the flood and onto the landing stones. A rasp of ridged bone along the wall, a dry click, and then a smell of old rot that comes right into her face. It is in reach now, an arm's length off, close enough that she can hear the faint wet tick of its jaw working. It has not struck. It is waiting for her to move first, or for her to breathe wrong.

Stair landing · DT 2 (rooms 5) · Stamina 17 · wounds 0/10 · torch out, dark · an undead stands one pace from her in the black.


## Turn 3
[PLAYER] PLAYER [3/14]: I step across the room to the far door.
[TOOLS]
$ python3 ledger.py test A --b 1 --why "slip past undead in the dark to the far door"
TEST slip past undead in the dark to the far door · A+1 · b · [9,2]=10(incl -2) → T1
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 0
$ python3 engine/engine.py test 2 --why "undead C claws (Undead A block) as Mara slips past"
Ref: TEST · undead C claws (Undead A block) as Mara slips past · +2 · [8,8]=18 → T3
$ python3 ledger.py take 4
LEDGER: took 4 (AD 25→21, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 21 · wounds 0/10 · uses Slashing 3 · UD torch 0
[REF] Mara slides one foot out across the slick stone and the dark gives her nothing to judge by. The thing is closer than the sound of it. Her heel finds a drowned edge, her weight goes sideways, and the claws come out of the black at her ribs.
They rake across her armor with a shriek of bone on plate, four furrows of force that shove her back against the cold wall. Something wet and ridged brushes her cheek. The door is still across the room, a dozen steps of unseen floor, and the corpse now stands between her and it, the water running off its arms in thin trickles.
It leans in. A rattle comes out of the ribs, pleased, patient.

Move: Hurt them · Ref: TEST · undead C claws (Undead A block) as Mara slips past · +2 · [8,8]=18 → T3
Ledger: TEST slip past undead in the dark to the far door · A+1 · b · [9,2]=10(incl -2) → T1

Stair landing · DT 2 (rooms 5) · Stamina 17 · wounds 0/10 · torch out, dark · the undead is on her, between her and the far door, claws raised.


## Turn 4
[PLAYER] PLAYER [4/14]: I deal with whatever comes through, sword first. Torch high.
[TOOLS]
$ python3 ledger.py attack --b 2
ATTACK attack · S+3 · bb · [3,10]=16 → T1 · MISS
STATUS Stamina 17 · AD 21 · wounds 0/10 · uses Slashing 3 · UD torch 0
$ python3 engine/engine.py test 2 --why "undead C claws, Trade Blows exchange 1"
Ref: TEST · undead C claws, Trade Blows exchange 1 · +2 · [1,8]=11 → T1
[REF] The torch is a dead stick in her fist, but the sword is not. Mara cuts at the rattle in the dark and the blade finds only wet air and then the wall. Steel jars against the old stone and rings, loud in the cellar, and the shock runs up into her shoulder.
The thing's claws come back at her and slap harmlessly off the edge of her pauldron, a bad angle in the black. It has her measure now, though. The corpse shoulders in close, pinning her sword arm against the frame where the claw furrows are, and the smell of rot is thick enough to taste. She has no room to swing here. She would have to shove off the wall first.
Beyond it, farther down the cellar, something else drips and clicks.

Move: Require a cost or opportunity · Ref: TEST · undead C claws, Trade Blows exchange 1 · +2 · [1,8]=11 → T1
Ledger: ATTACK attack · S+3 · bb · [3,10]=16 → T1 · MISS

Stair landing · DT 2 (rooms 5) · Stamina 17 · wounds 0/10 · torch out, dark · undead C (10/10) in hand band, pinning her sword arm against the door frame.


## Turn 5
[PLAYER] PLAYER [5/14]: I press on the nearest one.
[TOOLS]
$ python3 ledger.py attack --b 2
ATTACK attack · S+3 · bb · [1,4]=8 → T1 · MISS
STATUS Stamina 17 · AD 21 · wounds 0/10 · uses Slashing 3 · UD torch 0
$ python3 engine/engine.py test 2 --why "undead C claws, Trade Blows exchange 2"
Ref: TEST · undead C claws, Trade Blows exchange 2 · +2 · [6,8]=16 → T2
$ python3 ledger.py take 3
LEDGER: took 3 (AD 21→18, Stamina 17→17, wounds 0/10)
STATUS Stamina 17 · AD 18 · wounds 0/10 · uses Slashing 3 · UD torch 0
[REF] Mara drives off the wall and into the corpse, sword low, and finds nothing but a wet shoulder of bone that gives like rotten wood and does not fall. The blade skids off a rib. She is blind, and her swing wanders.
Its claws come round in a short chop and bite through a gap in her armor, hard enough that she feels the cold of them against her side. Plate takes most of it, but the edge of her padding tears.
Then, out beyond the landing, the dripping stops. In its place comes a slow wading, heavier than before, and a second click of bone on stone, from the direction the clang of her sword carried. Another one is coming up out of the flood toward the sound of the fight. It is not hurrying. It does not need to.

Move: Escalate the situation · Ref: TEST · undead C claws, Trade Blows exchange 2 · +2 · [6,8]=16 → T2
Ledger: ATTACK attack · S+3 · bb · [1,4]=8 → T1 · MISS

Stair landing · DT 2 (rooms 5) · Stamina 17 · wounds 0/10 · torch out, dark · undead C (10/10) in hand; a second one wades toward the landing.

