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

## Turn 9
[PLAYER] PLAYER [9/14]: I go on to the next room.
[TOOLS]
$ python3 player.py S4
PLAYER [9/14]: I go on to the next room.
$ python3 ledger.py test S --e 0 --b 0 --why "force the swollen ossuary door with undead at her back"
TEST force the swollen ossuary door with undead at her back · S+3 · - · [9,9]=21 → T3
STATUS Stamina 17 · AD 20 · wounds 0/10 · uses Slashing 3 · UD torch 1
(DT 1 ends: three rooms explored)
$ python3 ledger.py ud torch
UD torch · [6] → 1→1
STATUS Stamina 17 · AD 20 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py enc --en 9
Ref: encounter d10=1 vs EN 9 → none
$ python3 engine/engine.py roll d6 --why "DT2 length (rooms)"
Ref: d6 [1]=1 · DT2 length (rooms)
[REF]
You set your shoulder to the swollen door and drive. Wood shrieks, the hinges let go their grip, and the slab swings wide onto a long low room. You stumble through into dry air and the smell of old marrow. Shelves climb the walls, stacked to the ceiling with bones sorted by kind: skulls grinning in rows, long bones bundled like kindling, ribs, jaws. The torch makes every hollow eye socket flicker. The razorbacks pour in after you, clicking over the threshold, claws scoring the doorframe, one springing to the top of a shelf and sending skulls clattering into the water. They have not tired, and they do not mean to.

Ref: d6 [1]=1 · DT2 length (rooms)

Ossuary · DT 2 (rooms 1) · Stamina 17 · AD 20 · wounds 0/10 · torch lit (UD 1) · three razorbacks spilling in behind you and one already above you on the shelf

## Turn 10
[PLAYER] PLAYER [10/14]: I go through the next door.
[TOOLS]
$ python3 player.py S4
PLAYER [10/14]: I go through the next door.
(DT 2 ends: one room explored)
$ python3 ledger.py ud torch
UD torch · [3] → 1→1
STATUS Stamina 17 · AD 20 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py enc --en 9
Ref: encounter d10=10 vs EN 9 → ENCOUNTER NOW
$ python3 engine/engine.py table undead_dungeon_encounters --why "DT2 end natural 10 encounter"
Ref: Undead Dungeon Encounters (F34) d10 [8]=8 → 1 undead D · DT2 end natural 10 encounter
$ python3 engine/engine.py roll d6 --why "DT3 length (rooms)"
Ref: d6 [5]=5 · DT3 length (rooms)
[REF]
The far door is a low arch of black iron, unlatched. You duck through with claws at your heels and the vault swallows the torchlight: a squat stone chamber, sarcophagi along both walls, lids askew. Two shapes stand waiting between them. One is a razorback like the others. The other is a head taller, long arms trailing to the floor, a longclaw whose talons are caked in old black, and it turns its skull toward you with something like patience. Above its shoulder a loop of leather cord hangs from a hook, knotted with tally notches, fresh cuts in the leather. Far behind you, back through the ossuary, something enormous drags itself across stone.

Ref: Undead Dungeon Encounters (F34) d10 [8]=8 → 1 undead D · DT2 end natural 10 encounter

Side vault · DT 3 (rooms 5) · Stamina 17 · AD 20 · wounds 0/10 · torch lit (UD 1) · the longclaw steps forward as the razorbacks crowd the arch behind you

## Turn 11
[PLAYER] PLAYER [11/14]: I engage whatever is in the way, sword first.
(roll on request: attack / Trade Blows)
[TOOLS]
$ python3 player.py S4
PLAYER [11/14]: I engage whatever is in the way, sword first.
(roll on request: attack / Trade Blows)
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [7,5]=15 → T2 · HIT 7 dam
STATUS Stamina 17 · AD 20 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "B longclaw claws vs Mara"
Ref: TEST · B longclaw claws vs Mara · +2 · [7,8]=17 → T3
$ python3 ledger.py take 5
LEDGER: took 5 (AD 20→15, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 15 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
You go in low and fast and your blade bites the longclaw under the ribs, parting dry sinew and sending a spray of gray dust across the torchlight. It does not so much as stagger. Its answer comes in a long, sweeping rake that your plates catch and shriek under, the talons ripping a bright strip out of the armor and hammering you back against the arch. Behind you the razorbacks crowd the doorway, claws scraping on your shoulder plates. The longclaw lifts its arm again, black talons dripping, and the vault goes still around it.

Ref: TEST · B longclaw claws vs Mara · +2 · [7,8]=17 → T3
ATTACK attack · S+3 · - · [7,5]=15 → T2 · HIT 7 dam

Side vault · DT 3 (rooms 5) · Stamina 17 · AD 15 · wounds 0/10 · torch lit (UD 1) · the longclaw is in hand with claws raised, razorbacks pressing your back
(note: Ref called player.py for turn 12 before writing turn 11 to transcript; Ref error, line recorded below as Turn 12)

## Turn 12
[PLAYER] PLAYER [12/14]: I press the nearest.
[TOOLS]
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [7,6]=16 → T2 · HIT 7 dam
STATUS Stamina 17 · AD 15 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "B longclaw claws vs Mara"
Ref: TEST · B longclaw claws vs Mara · +2 · [2,5]=9 → T1
[REF]
You step into the swing before it finishes and drive your sword into the longclaw's chest. Something inside cracks like a dry branch. The thing shudders and its claws sweep past your head, a hand's breadth wide, fouling the air with grave dust. A rib comes away and clatters into the water. It is bent now, one arm hanging, jaw working soundlessly, and still it stays on its feet and still it is between you and the vault's back wall. At your back a razorback's claws click against your plates, patient, waiting for you to turn.

Ref: TEST · B longclaw claws vs Mara · +2 · [2,5]=9 → T1
ATTACK attack · S+3 · - · [7,6]=16 → T2 · HIT 7 dam

Side vault · DT 3 (rooms 5) · Stamina 17 · AD 15 · wounds 0/10 · torch lit (UD 1) · the longclaw is cracked and swaying but still standing in hand, razorbacks at your back

## Turn 13
[PLAYER] PLAYER [13/14]: I finish it and look for the exit.
[TOOLS]
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [8,3]=14 → T2 · HIT 7 dam
STATUS Stamina 17 · AD 15 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "B longclaw claws vs Mara"
Ref: TEST · B longclaw claws vs Mara · +2 · [4,3]=9 → T1
[REF]
The third stroke takes the longclaw across the throat-bones and the whole frame comes apart, skull bouncing off a sarcophagus lid, talons skittering over stone, then only a heap of gray dust and brown bone in the shallows. The vault does not go quiet. The razorbacks in the arch shriek and shove past the wreck of their leader, and the one that was waiting between the sarcophagi crouches to leap. Past it, at the vault's back wall, a narrow stair climbs out of the water into a cold draft that smells of rain and open air. It is perhaps a dozen paces away, with bone blades between you and it.

Ref: TEST · B longclaw claws vs Mara · +2 · [4,3]=9 → T1
ATTACK attack · S+3 · - · [8,3]=14 → T2 · HIT 7 dam

Side vault · DT 3 (rooms 5) · Stamina 17 · AD 15 · wounds 0/10 · torch lit (UD 1) · four razorbacks converge and the exit stair waits a dozen paces past them

## Turn 14
[PLAYER] PLAYER [14/14]: I take what I can carry and head for the stair.
[TOOLS]
$ python3 player.py S4
PLAYER [14/14]: I take what I can carry and head for the stair.
[REF]
Nothing in the vault is worth the carrying; the sarcophagi are split and empty, their lids gone to grit. You go for the stair with a shoulder lowered. The razorbacks flank you in a clicking rush, one leaping a sarcophagus to land beside you, spines grating against your plates, none yet finding a gap. The water runs shallower, then gives out to bare stone, and the draft hits your face, wet and clean. You reach the foot of the stair with the dead at your heels. Overhead the dark thins to gray, and from the steps above comes a dry scrape, bone on stone, before anything shows.

Cellar exit stair · DT 3 (rooms 5) · Stamina 17 · AD 15 · wounds 0/10 · torch lit (UD 1) · the draft is on your face and four razorbacks are on your heels at the stair's foot

DONE
Ran 14 turns (player script ended; Mara reached area 6 with DT 3 in progress).
