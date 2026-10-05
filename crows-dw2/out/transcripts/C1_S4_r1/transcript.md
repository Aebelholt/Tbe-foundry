## Turn 1
[PLAYER] PLAYER [1/14]: I enter the cellar by the stair and look the first room over before stepping in.
[TOOLS]
$ python3 player.py S4
PLAYER [1/14]: I enter the cellar by the stair and look the first room over before stepping in.
(roll on request: only if asked)
$ python3 engine/engine.py roll d6 --why "DT1 length (rooms)"
Ref: d6 [3]=3 · DT1 length (rooms)
[REF]
The chapel stair ends in black water-stain and cold. Your torch throws a shaking orange circle across the landing: wet stone, slick underfoot, a drain gutter choked with silt. Deep scratches run down the door frame ahead, four parallel grooves at the height of your ribs, old and dark. Something rotten hangs in the air, sweet and thick, the kind of stench that sits at the back of the throat. Water drips somewhere beyond the door. Nothing moves on the landing. The torch gutters once and steadies.

Ref: d6 [3]=3 · DT1 length (rooms)

Cellar landing · DT 1 (rooms 3) · Stamina 17 · wounds 0/10 · torch lit (UD 1) · the claw-scarred door stands ajar onto the dark and the smell is stronger there

## Turn 2
[PLAYER] PLAYER [2/14]: I search the first room carefully, checking the floor and the shelves.
[TOOLS]
$ python3 player.py S4
PLAYER [2/14]: I search the first room carefully, checking the floor and the shelves.
(roll on request: only if asked)
[REF]
You crouch and work the torchlight along the landing inch by inch. The silt in the gutter holds nothing but a few small bones, rat or bird, picked clean. No shelves here, only a row of rusted iron hooks in the wall, bare. The claw grooves on the door frame are deeper up close, and the wood inside them is pale and splintered, torn fresh enough that no rot has darkened it. The stench is stronger by the door, but the floor around it is clean of tracks; the water is too shallow and the silt too smooth to hold a print. Whatever scratched here did it long ago, or walks lightly. The landing has nothing else to give.

Cellar landing, searched · DT 1 (rooms 1 of 3) · Stamina 17 · wounds 0/10 · torch lit (UD 1) · beyond the door, the dripping stops, then starts again

## Turn 3
[PLAYER] PLAYER [3/14]: I step across the room to the far door.
[TOOLS]
$ python3 player.py S4
PLAYER [3/14]: I step across the room to the far door.
[REF]
The door gives with a wet groan and you pass through into a low storeroom. Ankle-deep black water laps at your boots and the torch smoke hangs under the vaulted ceiling. A heavy shelf has come down along the east wall, its planks split, jars and crockery drowned and shattered beneath it. Under the fallen timber the corner of an iron-bound chest juts out, lid slightly cocked, half pinned by a beam. The stench is fainter here. Something fine and gray dusts the floor around the chest, ash or old burnt matter, and a few cinders float on the water like dead insects. A second archway at the far end opens on darkness and a faint draft.

Storeroom · DT 1 (rooms 2 of 3) · Stamina 17 · wounds 0/10 · torch lit (UD 1) · the chest sits under the beam, close enough to touch

## Turn 4
[PLAYER] PLAYER [4/14]: I deal with whatever comes through, sword first. Torch high.
[TOOLS]
$ python3 player.py S4
PLAYER [4/14]: I deal with whatever comes through, sword first. Torch high.
(roll on request: attack / Trade Blows)
[REF]
Sword out, torch raised, you hold the storeroom's dark at arm's length. Nothing comes through. The water laps against your shins and settles. Then, from beyond the far archway, a sound: a dry, patient scrape, bone or horn dragged across stone, once, twice, then a long silence as if something listened back. The draft carries the rot stronger now, and the cinders around the chest stir in it and drift. Your torchlight does not reach the archway's far side. The scraping starts again, nearer than before, or only louder in the vaulted dark.

Storeroom · DT 1 (rooms 2 of 3) · Stamina 17 · wounds 0/10 · torch lit (UD 1) · something is dragging itself along the stone beyond the far archway

## Turn 5
[PLAYER] PLAYER [5/14]: I press on the nearest one.
[TOOLS]
$ python3 player.py S4
PLAYER [5/14]: I press on the nearest one.
[REF]
You wade through the archway toward the scraping and the vault opens around you: a crypt hall, pillars marching away into the dark, their bases thick with silt. Your torch finds the nearest thing before it finds the floor. A razor-spined corpse crouches in the lee of the first pillar, ribs flared like a broken fan, a long row of bone blades running down its back. It rises as the light touches it, clicking, and two more shapes unfold from behind the pillars beyond, one on each side, heads turning to the flame. The nearest is close enough that the rot of it fills your mouth. Its claws are already lifting.



Crypt hall · DT 1 (rooms 3 of 3) · Stamina 17 · wounds 0/10 · torch lit (UD 1) · the nearest razorback is a single step off your torch hand and rising

## Turn 6
[PLAYER] PLAYER [6/14]: I finish them and move on to the next room.
[TOOLS]
$ python3 player.py S4
PLAYER [6/14]: I finish them and move on to the next room.
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [6,2]=11 → T1 · MISS
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "A1 claws vs Mara"
Ref: TEST · A1 claws vs Mara · +2 · [8,2]=12 → T2
$ python3 engine/engine.py test 2 --why "A2 claws (Move attack) vs Mara"
Ref: TEST · A2 claws (Move attack) vs Mara · +2 · [6,1]=9 → T1
$ python3 ledger.py take 3
LEDGER: took 3 (AD 25→22, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 22 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
Your blade cuts only air and gray silt as the nearest razorback twists aside, quick as a cat for something dead. Its claws rake down across your armor, three hard scrapes that spark and push you back a step, and the plates take the worst of it. Before you can set your feet, a second corpse comes bounding off its pillar in a long, impossible leap, landing in the shallows at your flank and sending black water up over your knees. It swipes and misses, ribs rattling. The third hangs back among the columns, spines lifting along its back, watching the torch.

Move: Escalate the situation
Ref: TEST · A1 claws vs Mara · +2 · [8,2]=12 → T2
Ref: TEST · A2 claws (Move attack) vs Mara · +2 · [6,1]=9 → T1
ATTACK attack · S+3 · - · [6,2]=11 → T1 · MISS
LEDGER: took 3 (AD 25→22, Stamina 17→17, wounds 0→0)

Crypt hall · DT 1 (rooms 3 of 3) · Stamina 17 · AD 22 · wounds 0/10 · torch lit (UD 1) · two razorbacks at your throat and a third pulling its spines taut behind the pillars

## Turn 7
[PLAYER] PLAYER [7/14]: I open the next door and go in.
[TOOLS]
$ python3 player.py S4
PLAYER [7/14]: I open the next door and go in.
[REF]
The next door is an iron-banded slab at the far end of the hall, a long wade past the pillars with the dead at your back. You go for it. The razorbacks do not let you go: one leaps clean over a pillar and lands ahead of you, the other splashes close behind, claws clicking on your armor plates without finding purchase. At the door you heave on the ring and the swollen wood grinds, only a hand's width, then sticks fast in the damp. Bone-white blades quiver along the spines at your shoulder. Behind the leaper, the third shape slides out into your torchlight, closing.

Crypt hall, far door stuck · DT 1 (rooms 3 of 3) · Stamina 17 · AD 22 · wounds 0/10 · torch lit (UD 1) · a razorback in front, one at your back, the door barely open and the wood fighting you

## Turn 8
[PLAYER] PLAYER [8/14]: I search the room for treasure and the way on.
(roll on request: only if asked)
[TOOLS]
$ python3 player.py S4
PLAYER [8/14]: I search the room for treasure and the way on.
(roll on request: only if asked)
$ python3 ledger.py test M --e 0 --b 1 --why "search the hall while three undead press her"
TEST search the hall while three undead press her · M+0 · b · [6,1]=5(incl -2) → T1
STATUS Stamina 17 · AD 22 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "A3 spine (Move attack, unengaged) vs Mara"
Ref: TEST · A3 spine (Move attack, unengaged) vs Mara · +2 · [3,7]=12 → T2
$ python3 ledger.py take 2
LEDGER: took 2 (AD 22→20, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 20 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
You try to read the hall with three dead things breathing rot on you, and the torchlight skips off every surface: pillar bases, silt, a toppled sarcophagus lid, none of it holding still long enough to mean anything. A gap between two columns might be an alcove or only shadow. The stuck door is the one thing that is certain. Behind you the third razorback stops, all its spines swinging to point at you, and looses them: a spray of bone needles that hisses across the water. One pricks through a gap in your armor and bites at the join of your shoulder, shallow but cold. The others crowd closer.

Move: Hurt them
Ref: TEST · A3 spine (Move attack, unengaged) vs Mara · +2 · [3,7]=12 → T2
TEST search the hall while three undead press her · M+0 · b · [6,1]=5(incl -2) → T1
LEDGER: took 2 (AD 22→20, Stamina 17→17, wounds 0→0)

Crypt hall · DT 1 (rooms 3 of 3) · Stamina 17 · AD 20 · wounds 0/10 · torch lit (UD 1) · all three razorbacks on you and the stuck door at your back

