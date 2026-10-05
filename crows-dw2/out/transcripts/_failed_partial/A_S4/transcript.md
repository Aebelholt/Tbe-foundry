## Turn 1
[PLAYER] PLAYER [1/14]: I enter the cellar by the stair and look the first room over before stepping in.
[TOOLS]
$ python3 engine/engine.py roll d6 --why "DT1 length (rooms)"
Ref: d6 [5]=5 · DT1 length (rooms)
[REF]
The stair ends in a landing of black, sweating stone. Torchlight crawls over the walls and shows you the door frame ahead: four deep furrows gouged into the wood at the height of your chest, the splinters still pale. The air is thick with old rot, sweet and heavy, and water ticks somewhere below in the dark. Nothing moves on the landing. The door beyond hangs half open, and past it the stench thickens.

Ref: d6 [5]=5 · DT1 length (rooms)

Cellar, area 1 · DT 1 (rooms 1/5) · Stamina 17 · wounds 0/10 · torch lit (UD 1) · the half-open door and the smell behind it

## Turn 2
[PLAYER] PLAYER [2/14]: I search the first room carefully, checking the floor and the shelves.
[TOOLS] (none; empty room, time and no consequence, no roll. The careful search counts as a time block: rooms 2/5)
[REF]
You go over the landing inch by inch. The floor is slick flagstone with a skin of green slime, and your boots find nothing under it but grit and a few shed splinters. There are no shelves here, only iron brackets rusted to stubs in the wall. The claw marks on the door frame are fresh enough that the wood inside the grooves is still bright, and they were made from the far side, reaching through. Wet drag lines lead from the doorway toward the dark, long dried streaks in the slime. Your torch gutters once in a draft that smells of rot.

Cellar, area 1 · DT 1 (rooms 2/5) · Stamina 17 · wounds 0/10 · torch lit (UD 1) · the half-open door, drag lines leading through

## Turn 3
[PLAYER] PLAYER [3/14]: I step across the room to the far door.
[TOOLS] (none)
[REF]
The door swings wider under your hand, hinges shrieking once. Beyond it is a low storeroom, the ceiling hung with pale roots and drip. Along the left wall a long shelf has come down, planks and rotten crates heaped in a slope, and under the lowest edge of that pile the corner of an iron-banded chest shows, its lid just clear of the wreckage. Everything is soaked. A shallow skin of black water covers the floor and ripples out from your boot where you stand in the doorway. The drag lines end here, at the chest, and then there is a clean patch, as if something had been sitting against it.

Cellar, stair landing doorway · DT 1 (rooms 2/5) · Stamina 17 · wounds 0/10 · torch lit (UD 1) · the chest under the fallen shelf, one pace beyond the threshold

## Turn 4
[PLAYER] PLAYER [4/14]: I deal with whatever comes through, sword first. Torch high.
[TOOLS] (none; no foe is in reach, so no attack is rolled)
[REF]
You hold the blade low and the torch high, and the storeroom gives you everything it has. Nothing comes through. The black water settles around your boots, and the roots overhead drip in the light. Then, from beyond a second archway at the back of the room, comes a slow dry scrape, stone on stone, then a pause, then the scrape again. It is patient, like a claw testing a pillar. The chest sits one pace from you, and the sound sits a good deal farther, but the arch is open and nothing is stopping it from carrying.

Cellar, storeroom threshold (area 2) · DT 1 (rooms 2/5) · Stamina 17 · wounds 0/10 · torch lit (UD 1) · the scraping beyond the back arch

## Turn 5
[PLAYER] PLAYER [5/14]: I press on the nearest one.
[TOOLS] (none; Mara crosses the storeroom without touching the chest and enters area 3, rooms 4/5. Scene line: razorback 1 Stamina 10/10 unengaged close; razorback 2 10/10 unengaged near; razorback 3 10/10 unengaged near)
[REF]
You cross the flooded storeroom with the chest at your elbow and leave it be. Past the arch the ceiling lifts into a crypt hall, a double row of fat pillars marching into the dark, the water here ankle deep and black. The scraping stops the moment your torchlight touches the first pillar. Then a shape peels off the stone, a lean gray thing with its spine ridged and split like a rotted ship's keel, claws trailing a hand's width above the water. Two more shift behind the next pillars, drawing their limbs under them to spring. The nearest is close enough that you can see its jaw hanging loose and the ridged bone shivering along its back.

Cellar, crypt hall (area 3) · DT 1 (rooms 4/5) · Stamina 17 · wounds 0/10 · torch lit (UD 1) · three razorbacks, the nearest within a lunge of you

## Turn 6
[PLAYER] PLAYER [6/14]: I finish them and move on to the next room.
[TOOLS]
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [10,4]=17 → T3 · HIT 10 dam
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
(razorback 1 dead; it never closed to act)
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [9,1]=13 → T2 · HIT 7 dam
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
(razorback 2 at 3/10)
$ python3 engine/engine.py test 2 --why "razorback 2 claws vs Mara"
Ref: TEST · razorback 2 claws vs Mara · +2 · [1,2]=5 → T1 DOOM
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [10,4]=17 → T3 · HIT 10 dam
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
(razorback 2 dead)
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [6,7]=16 → T2 · HIT 7 dam
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
(razorback 3 at 3/10)
$ python3 engine/engine.py test 2 --why "razorback 3 claws vs Mara"
Ref: TEST · razorback 3 claws vs Mara · +2 · [6,6]=14 → T2
$ python3 ledger.py take 3
LEDGER: took 3 (AD 25→22, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 22 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [5,1]=9 → T1 · MISS
STATUS Stamina 17 · AD 22 · wounds 0/10 · uses Slashing 3 · UD torch 1
(crow tier 1; no unengaged foe, Ref move is the engaged foe's attack)
$ python3 engine/engine.py test 2 --why "razorback 3 claws vs Mara"
Ref: TEST · razorback 3 claws vs Mara · +2 · [4,9]=15 → T2
$ python3 ledger.py take 3
LEDGER: took 3 (AD 22→19, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 19 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [10,5]=18 → T3 · HIT 10 dam
STATUS Stamina 17 · AD 19 · wounds 0/10 · uses Slashing 3 · UD torch 1
(razorback 3 dead; hall clear. Mara moves into area 4, rooms 5/5, DT 1 ends)
$ python3 ledger.py ud torch
UD torch · [1] → 1→0 · EXPIRED
STATUS Stamina 17 · AD 19 · wounds 0/10 · uses Slashing 3 · UD torch 0
$ python3 engine/engine.py enc --en 9
Ref: encounter d10=6 vs EN 9 → none
$ python3 engine/engine.py roll d6 --why "DT2 length (rooms)"
Ref: d6 [3]=3 · DT2 length (rooms)
[REF]
The first razorback dies on your first stroke, split from shoulder to ribs, and the second comes in under your guard and gets only a shriek out of its ruined jaw before you take its head. The third rakes your armor twice, each blow a hard punch you feel through the leather, and you answer with a cut that drops it into the black water. Silence returns, and the stench of rot sits heavier than before. You wade on through a low archway into a narrow chamber lined with shelves of stacked bones, skulls grinning in rows. Your torch gutters, shrinks to a blue bead, and goes out. The dark here is complete, and the water ticks loudly in it.

Ref: encounter d10=6 vs EN 9 → none

Cellar, ossuary (area 4) · DT 2 (rooms 0/3) · Stamina 17 · AD 19 · wounds 0/10 · no light (torch spent) · total darkness, the shelves unseen around you

## Turn 7
[PLAYER] PLAYER [7/14]: I open the next door and go in.
[TOOLS] (none; Mara feels her way through the ossuary to the far door and into area 5, DT 2 rooms 1/3. Scene line: longclaw Stamina 20/20 unengaged near; razorback Stamina 10/10 unengaged near. Mara is in darkness: double bane on attacks and searches)
[REF]
You grope along the shelves, knuckles knocking over bones that clatter and roll, and find the far door by the cold iron of its ring. It opens with a groan. The air beyond is colder and close, a vault with a low vaulted roof, and the dark in it is not empty. Something breathes in short wet sips ahead and to the left, and claws tick on stone, one set heavy and slow, the other quick and light. Water laps against a moving body. A longer rasp comes from deeper in, a sound like a blade drawn across a wet whetstone, and the heavy one stops dead, listening for you.

Cellar, side vault (area 5) · DT 2 (rooms 1/3) · Stamina 17 · AD 19 · wounds 0/10 · no light, darkness · two clawed things within a few strides of you, and they can see you

## Turn 8
[PLAYER] PLAYER [8/14]: I search the room for treasure and the way on.
[TOOLS]
$ python3 ledger.py test M --b 2 --why "search the vault in darkness for treasure and the way on"
TEST search the vault in darkness for treasure and the way on · M+0 · bb · [2,6]=8 → T1
STATUS Stamina 17 · AD 19 · wounds 0/10 · uses Slashing 3 · UD torch 0
(crow T1: Ref move; unengaged foes 2, ceil(2/3)=1 attacks: the longclaw. The search counts as a time block, DT 2 rooms 2/3)
$ python3 engine/engine.py test 2 --why "longclaw claws vs Mara (Ref move after crow T1)"
Ref: TEST · longclaw claws vs Mara (Ref move after crow T1) · +2 · [9,9]=20 → T3
$ python3 ledger.py take 5
LEDGER: took 5 (AD 19→14, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 14 · wounds 0/10 · uses Slashing 3 · UD torch 0
[REF]
You sweep your hands over the vault in the dark, over slick walls and cold niches that hold only dust and wet bone, and you find no edge of a door, no glint, nothing. The heavy claws stop ticking, and then they are very close. Something big drives into you from the left, a hook of raw force that crashes across your armor and shoves you off your feet and onto one knee in the black water. You smell rot breath, hear the long claws scrape the stone beside your head, and feel another hot rake of bone across the leather. The lighter thing is sliding around behind it, water lapping at its legs.

Ref: TEST · longclaw claws vs Mara · +2 · [9,9]=20 → T3

Cellar, side vault (area 5) · DT 2 (rooms 2/3) · Stamina 17 · AD 14 · wounds 0/10 · no light, darkness · the longclaw on top of you, the razorback circling to your flank

