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

## Turn 7
[PLAYER] PLAYER [7/14]: I open the next door and go in.
(roll on request: only if asked)
[TOOLS] (none; moving costs an exchange with no roll, and no one takes a free blow)
[REF]
She backs along the pillar line, feeling for the wall, and finds the far door by its cold iron ring. It opens inward with a shriek of dry hinges. She slips through and into a narrower dark that smells of chalk and old marrow. Underfoot something skitters and crunches. Along both walls, her hand brushes shelves, and on the shelves are rows of round, smooth things, skulls, and bundles of long bones tied with rotted cord. Behind her the razorbacks do not hesitate. The claw-footed scrabble of the nearer one comes through the doorway at her heels, and the hiss of a spine passes her ear and shatters a skull on the shelf in a puff of white dust. The ossuary is long and close, with no room to turn.

Ossuary · DT 2 (rooms 3 of 4) · Stamina 17 · wounds 0/10 · no light, darkness · a razorback at your heels and another throwing spines from the doorway

## Turn 8
[PLAYER] PLAYER [8/14]: I search the room for treasure and the way on.
(roll on request: only if asked)
[TOOLS]
$ python3 ledger.py test M --b 2 --why "search ossuary in darkness with razorbacks on her"
TEST search ossuary in darkness with razorbacks on her · M+0 · bb · [8,7]=15 → T1
STATUS Stamina 17 · AD 20 · wounds 0/10 · uses Slashing 3 · UD torch 0
$ python3 engine/engine.py test 2 --why "Undead A3 spine (unengaged, tier-1 move) vs Mara"
Ref: TEST · Undead A3 spine (unengaged, tier-1 move) vs Mara · +2 · [6,10]=18 → T3
$ python3 ledger.py take 3
LEDGER: took 3 (AD 20→17, Stamina 17→17, wounds 0/10)
STATUS Stamina 17 · AD 17 · wounds 0/10 · uses Slashing 3 · UD torch 0
[REF]
Mara works her hands along the shelves, tipping skulls aside, turning bundles of bone. Her fingers are numb with cold, and in the dark every skull is the same smooth shape. She finds nothing she can name. The shelves are too crowded and the work is too slow with the razorback breathing its dry rattle at her shoulder. A spine slams into her chest plate from the doorway, a hard, ringing blow that drives the air out of her, and then she realizes why the hits keep landing. She is standing in the narrow aisle where both of them can see her, and neither can be dodged. To search this room she must first get out of that line.

Move: Require a cost or opportunity (better position first)
Ref: TEST · Undead A3 spine (unengaged, tier-1 move) vs Mara · +2 · [6,10]=18 → T3

Ossuary · DT 2 (rooms 3 of 4) · Stamina 17 · wounds 0/10 · no light, darkness · one razorback at your shoulder, one in the doorway with a clear line to you

## Turn 9
[PLAYER] PLAYER [9/14]: I go on to the next room.
(roll on request: only if asked)
[TOOLS] (none for the move; DT 2 ends on entering its fourth room)
$ python3 ledger.py ud torch
UD torch · [] → 0→0 · EXPIRED
STATUS Stamina 17 · AD 17 · wounds 0/10 · uses Slashing 3 · UD torch 0
$ python3 engine/engine.py enc --en 9
Ref: encounter d10=7 vs EN 9 → none
$ python3 engine/engine.py roll d6 --why "DT 3 length (rooms)"
Ref: d6 [5]=5 · DT 3 length (rooms)
[REF]
She breaks along the shelves to the ossuary's far end and finds a low arch. She ducks through it and the floor drops two steps into a side vault, its air close and heavy and strangely warm. The shelves here are empty. The smell of rot is so thick it is almost a taste. Then something very large shifts in the dark ahead, a slow scrape of long claws on stone, and a second, lighter rattle answers it from the left. A voice that is not a voice, a wet, grinding breath, comes from a height above her head. Behind her the razorbacks pour in through the arch after her, and the vault fills with the sound of too many things closing.

Ref: encounter d10=7 vs EN 9 → none (UD torch: expired, nothing to roll)

Side vault · DT 3 begins (5 rooms) · Stamina 17 · wounds 0/10 · no light, darkness · a longclaw and a razorback ahead, two razorbacks pouring in behind you

## Turn 10
[PLAYER] PLAYER [10/14]: I go through the next door.
(roll on request: only if asked)
[TOOLS]
$ python3 ledger.py test A --b 2 --why "cross the dark side vault past longclaw and razorbacks to the far door"
TEST cross the dark side vault past longclaw and razorbacks to the far door · A+1 · bb · [9,3]=13 → T1
STATUS Stamina 17 · AD 17 · wounds 0/10 · uses Slashing 3 · UD torch 0
$ python3 engine/engine.py test 2 --why "Undead B claws (move: Hurt them) vs Mara"
Ref: TEST · Undead B claws (move: Hurt them) vs Mara · +2 · [1,9]=12 → T2
$ python3 engine/engine.py test 2 --why "Undead A2 spine (unengaged, tier-1 move) vs Mara"
Ref: TEST · Undead A2 spine (unengaged, tier-1 move) vs Mara · +2 · [1,9]=12 → T2
$ python3 ledger.py take 4
LEDGER: took 4 (AD 17→13, Stamina 17→17, wounds 0/10)
STATUS Stamina 17 · AD 13 · wounds 0/10 · uses Slashing 3 · UD torch 0
$ python3 ledger.py take 2
LEDGER: took 2 (AD 13→11, Stamina 17→17, wounds 0/10)
STATUS Stamina 17 · AD 11 · wounds 0/10 · uses Slashing 3 · UD torch 0
[REF]
Mara goes down the steps at a run and angles across the vault toward where she thinks the far wall stands. She does not reach it. A huge shape rises across her path, tall, lean, trailing clawed hands as long as her forearm. She feels the wind of its swing and twists, and the claws take her armor instead of her ribs, three shrieking furrows that tear a plate half loose. A thin spine whips out of the dark on her left and glances off the other shoulder. The longclaw is square in front of her, between her and a faint draft of cleaner air that she can feel on her face from somewhere beyond it. The three razorbacks are spreading behind her to cut the room.

Move: Hurt them
Ref: TEST · Undead B claws (move: Hurt them) vs Mara · +2 · [1,9]=12 → T2
Ref: TEST · Undead A2 spine (unengaged, tier-1 move) vs Mara · +2 · [1,9]=12 → T2

Side vault · DT 3 (rooms 1 of 5) · Stamina 17 · wounds 0/10 · no light, darkness · the longclaw blocks the way to the draft of clean air, three razorbacks closing behind

## Turn 11
[PLAYER] PLAYER [11/14]: I engage whatever is in the way, sword first.
(roll on request: attack / Trade Blows)
[TOOLS]
$ python3 ledger.py attack --b 2
ATTACK attack · S+3 · bb · [2,5]=10 → T1 · MISS
STATUS Stamina 17 · AD 11 · wounds 0/10 · uses Slashing 3 · UD torch 0
$ python3 engine/engine.py test 2 --why "Undead B claws (engaged) vs Mara"
Ref: TEST · Undead B claws (engaged) vs Mara · +2 · [3,1]=6 → T1
$ python3 engine/engine.py test 2 --why "Undead A3 spine (unengaged, tier-1 move) vs Mara"
Ref: TEST · Undead A3 spine (unengaged, tier-1 move) vs Mara · +2 · [7,5]=14 → T2
$ python3 ledger.py take 2
LEDGER: took 2 (AD 11→9, Stamina 17→17, wounds 0/10)
STATUS Stamina 17 · AD 9 · wounds 0/10 · uses Slashing 3 · UD torch 0
[REF]
Mara lunges at the great shape and her blade goes into the dark and meets a shelf upright instead. The old wood splits and the blade bites deep and sticks, and for one long breath she is hauling on a trapped sword while the longclaw rears over her. Its swing goes wild and rakes only the shelf above her head, spraying splinters. A spine slaps her from the side and bites through a joint in the plate. Her own cut has pinned her blade, and the thing is turning its long head, its jaws working with a dry crackle, to find her again by the sound of her breath. The draft of clean air is a single stride past it.

Move: Have it backfire (blade stuck in the shelf)
Ref: TEST · Undead B claws (engaged) vs Mara · +2 · [3,1]=6 → T1
Ref: TEST · Undead A3 spine (unengaged, tier-1 move) vs Mara · +2 · [7,5]=14 → T2

Side vault · DT 3 (rooms 1 of 5) · Stamina 17 · wounds 0/10 · no light, darkness · sword stuck in a shelf, the longclaw turning back on you

## Turn 12
[PLAYER] PLAYER [12/14]: I press the nearest.
(roll on request: attack / Trade Blows)
[TOOLS]
$ python3 ledger.py attack --b 2
ATTACK attack · S+3 · bb · [6,6]=15 → T1 · MISS
STATUS Stamina 17 · AD 9 · wounds 0/10 · uses Slashing 3 · UD torch 0
$ python3 engine/engine.py test 2 --why "Undead B claws (engaged) vs Mara"
Ref: TEST · Undead B claws (engaged) vs Mara · +2 · [1,6]=9 → T1
$ python3 engine/engine.py test 2 --why "Undead A4 spine (unengaged, tier-1 move) vs Mara"
Ref: TEST · Undead A4 spine (unengaged, tier-1 move) vs Mara · +2 · [7,8]=17 → T3
$ python3 ledger.py take 3
LEDGER: took 3 (AD 9→6, Stamina 17→17, wounds 0/10)
STATUS Stamina 17 · AD 6 · wounds 0/10 · uses Slashing 3 · UD torch 0
[REF]
Mara wrenches at the stuck blade and presses in on the longclaw, and her cut goes high and wide, and the heavy blade only grazes cold, dry hide. The thing does not even flinch. It flares its long hands wide and she sees, by the pale shine of its own eyes, that it is herding her. Two razorbacks have slipped around either side and a third sits on the steps she came down. One spine takes her square in the shoulder, ringing through the plate and leaving the armor hanging in pieces, and the cold now reaches her skin. The gap past the longclaw, where the clean air comes from, is closing as it shifts its stance, and she must go through it or be sealed in.

Move: Make them choose (break through now, or be boxed in)
Ref: TEST · Undead B claws (engaged) vs Mara · +2 · [1,6]=9 → T1
Ref: TEST · Undead A4 spine (unengaged, tier-1 move) vs Mara · +2 · [7,8]=17 → T3

Side vault · DT 3 (rooms 1 of 5) · Stamina 17 · wounds 0/10 · no light, darkness · the gap beside the longclaw is closing, razorbacks flank you on both sides

## Turn 13
[PLAYER] PLAYER [13/14]: I finish it and look for the exit.
(roll on request: attack / Trade Blows)
[TOOLS]
$ python3 ledger.py attack --b 2
ATTACK attack · S+3 · bb · [6,10]=19 → T2 · HIT 7 dam
STATUS Stamina 17 · AD 6 · wounds 0/10 · uses Slashing 3 · UD torch 0
(Undead B Stamina 20 - 7 = 13/20)
$ python3 engine/engine.py test 2 --why "Undead B claws (engaged) vs Mara"
Ref: TEST · Undead B claws (engaged) vs Mara · +2 · [1,7]=10 → T1
[REF]
This time the blade finds it. Mara tears her sword free of the splintered shelf in the same pull and drives it up under the longclaw's ribs. Something wet and cold pours over her hand, and the creature gives a rasping shriek that is half a laugh. It does not fall. It staggers a half step, its claws sweeping the air where she stood, a hand's breadth short, and in that half step the gap opens. A hand's breadth of cold, cleaner air presses against her face from a low door just past its flank. It is hurt, and furious, and still between her and it. The razorbacks rattle close at her back, one more strike from reaching her.

Ref: TEST · Undead B claws (engaged) vs Mara · +2 · [1,7]=10 → T1
ATTACK attack · S+3 · bb · [6,10]=19 → T2 · HIT 7 dam

Side vault · DT 3 (rooms 1 of 5) · Stamina 17 · wounds 0/10 · no light, darkness · the longclaw reels with a wound in its ribs, the low door is one stride past its flank

## Turn 14
[PLAYER] PLAYER [14/14]: I take what I can carry and head for the stair.
(roll on request: only if asked)
[TOOLS]
$ python3 ledger.py test A --b 2 --why "slip past the staggered longclaw through the low door to the exit stair"
TEST slip past the staggered longclaw through the low door to the exit stair · A+1 · bb · [8,2]=11 → T1
STATUS Stamina 17 · AD 6 · wounds 0/10 · uses Slashing 3 · UD torch 0
$ python3 engine/engine.py test 2 --why "Undead B claws (move: Hurt them) vs Mara"
Ref: TEST · Undead B claws (move: Hurt them) vs Mara · +2 · [3,10]=15 → T2
$ python3 engine/engine.py test 2 --why "Undead A2 spine (unengaged, tier-1 move) vs Mara"
Ref: TEST · Undead A2 spine (unengaged, tier-1 move) vs Mara · +2 · [10,5]=17 → T3
$ python3 ledger.py take 4
LEDGER: took 4 (AD 6→2, Stamina 17→17, wounds 0/10)
STATUS Stamina 17 · AD 2 · wounds 0/10 · uses Slashing 3 · UD torch 0
$ python3 ledger.py take 3
LEDGER: took 3 (AD 2→0, Stamina 17→16, wounds 0/10)
STATUS Stamina 16 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 0
[REF]
Mara lunges for the low door and almost has it. The longclaw, reeling, throws out an arm without looking, and its claws catch her across the back of the shoulder. They go through the last of the shredded plate and score the leather beneath. Before she can steady, a spine hits her in the ribs from the dark with a hard, bruising crack, and for the first time she feels it through to the flesh. The armor is gone, hanging off her in strips. The low door is a hand's reach ahead, breathing the clean cold of the stair. The longclaw stands wounded between her and it, and the razorbacks are at her back, their rattle now all around her.

Move: Hurt them
Ref: TEST · Undead B claws (move: Hurt them) vs Mara · +2 · [3,10]=15 → T2
Ref: TEST · Undead A2 spine (unengaged, tier-1 move) vs Mara · +2 · [10,5]=17 → T3

Side vault · DT 3 (rooms 1 of 5) · Stamina 16 · wounds 0/10 · no light, darkness · armor gone, the longclaw wounded at the low door, three razorbacks at your back
DONE
Ran 14 turns (script ended at 14/14); Mara did not reach area 6.
