## Turn 1
[PLAYER] PLAYER [1/14]: I enter the cellar by the stair and look the first room over before stepping in.
(roll on request: only if asked)
[TOOLS]
$ python3 player.py S4
PLAYER [1/14]: I enter the cellar by the stair and look the first room over before stepping in.
(roll on request: only if asked)
$ python3 engine/engine.py roll d6 --why "DT1 length (rooms)"
Ref: d6 [4]=4 · DT1 length (rooms)
[REF] The chapel floor gives way to a stair that bends down into the dark, and the torch in Mara's fist hisses at the damp rising to meet it. Water beads on every step. At the bottom is a small landing of wet stone, slick as a fish's back, and the air is thick with the sweet stench of old rot. Deep gouges run down the oak frame of the door ahead, four parallel furrows at about the height of her chest, the splinters pale and not yet gone grey. Nothing moves on the landing. Somewhere past the door, water drips in a slow, patient count.

Ref: d6 [4]=4 · DT1 length (rooms)

Cellar landing · DT 1 (rooms 0 of 4) · Stamina 17 · wounds 0/10 · torch lit, 1 UD · the door ahead stands ajar, its claw-scored frame at her shoulder

## Turn 2
[PLAYER] PLAYER [2/14]: I search the first room carefully, checking the floor and the shelves.
(roll on request: only if asked)
[TOOLS]
$ python3 player.py S4
PLAYER [2/14]: I search the first room carefully, checking the floor and the shelves.
(roll on request: only if asked)
(no roll: the landing is empty and a look costs nothing; area 1 counted as explored, rooms 1 of 4)
[REF] Mara works the landing slowly, torch low. There are no shelves, only bare wet stone and a drain choked with black silt. The floor tells her more than any hiding place does. Between the stair and the door runs a wide, smeared track where something was dragged out of the water and into the dark beyond, and at its edges the silt is pocked with narrow, three-toed prints that do not match any boot. The claw marks on the frame are fresher up close, and a few threads of grey, rotted cloth cling in the splinters. The stench is stronger at the door. Past it, the dripping stops for a moment, then starts again, a little faster.

Cellar landing · DT 1 (rooms 1 of 4) · Stamina 17 · wounds 0/10 · torch lit, 1 UD · the dragged track leads through the door into the next room

## Turn 3
[PLAYER] PLAYER [3/14]: I step across the room to the far door.
[TOOLS]
$ python3 player.py S4
PLAYER [3/14]: I step across the room to the far door.
(no roll: rooms 2 of 4)
[REF] The door gives with a groan that the dark swallows, and Mara steps through into ankle-deep water so cold it bites through her boots. The torch shows a storeroom, low and long. Half the shelving has come down in a heap of black planks along the left wall, and under the worst of it, pinned at a slant, sits an iron-banded chest, its lid showing a hand's width above the timber. Dull orange crumbs of something glitter in the seams of the lid and along the floor around it, and they crackle faintly where her torchlight touches them. The water laps at the pile. A bubble rises, breaks, and the stench of rot thickens.

Storeroom · DT 1 (rooms 2 of 4) · Stamina 17 · wounds 0/10 · torch lit, 1 UD · the chest sits pinned under the shelf, glittering embers in its seams

## Turn 4
[PLAYER] PLAYER [4/14]: I deal with whatever comes through, sword first. Torch high.
(roll on request: attack / Trade Blows)
[TOOLS]
$ python3 player.py S4
PLAYER [4/14]: I deal with whatever comes through, sword first. Torch high.
(roll on request: attack / Trade Blows)
(no hostile act yet; no engine or Ledger roll; rooms stay 2 of 4)
[REF] Mara raises the torch to the level of her brow and sets her feet in the cold water, sword ready. Nothing comes through. The light climbs the walls and shows a second doorway at the far end of the storeroom, an arch with no door in it, and beyond it a long, pillared dark. From there, faintly, comes a sound like a wet knife being drawn slowly across a whetstone, once, twice, and then a patient silence that seems to be listening back. The embers in the chest's seams tick and spit as the torch passes over them. The water around her shins is slowly, steadily rising.

Storeroom · DT 1 (rooms 2 of 4) · Stamina 17 · wounds 0/10 · torch lit, 1 UD · something scrapes in the pillared hall beyond the arch

## Turn 5
[PLAYER] PLAYER [5/14]: I press on the nearest one.
[TOOLS]
$ python3 player.py S4
PLAYER [5/14]: I press on the nearest one.
$ python3 engine/engine.py init
Ref: initiative d10=6 → crows act first
$ python3 ledger.py attack --why "round 1, nearest undead A"
ATTACK round 1, nearest undead A · S+3 · - · [10,10]=23 → T3 CRIT · HIT 10 dam
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
(Undead A #1 Stamina 10 - 10 = 0, destroyed. Crit: Mara has an extra action this round. Rooms 3 of 4.)
[REF] Mara wades through the arch and the pillared hall opens around her torchlight, a forest of fat stone columns standing in black water. A shape peels away from the nearest pillar, a gaunt, hunched thing with a ridge of bone down its back and hooked hands trailing in the flood. She is on it before it finishes standing. The sword takes it low under the ribs and comes up through the spine, and the razorback comes apart in two wet halves that slide beneath the surface and do not rise. The torch gutters, steadies. Behind the next two pillars, two more humped silhouettes lift their heads together, and the water between them and her begins to ripple.

Ref: initiative d10=6 → crows act first

Crypt hall · DT 1 (rooms 3 of 4) · Stamina 17 · wounds 0/10 · torch lit, 1 UD · two razorbacks rising from behind the pillars, and her sword is already moving

## Turn 6
[PLAYER] PLAYER [6/14]: I finish them and move on to the next room.
[TOOLS]
$ python3 player.py S4
PLAYER [6/14]: I finish them and move on to the next room.
$ python3 ledger.py attack --why "round 1 extra action (crit), undead A #2"
ATTACK round 1 extra action (crit), undead A #2 · S+3 · - · [4,5]=12 → T2 · HIT 7 dam
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "round 1 undead A #2 claws"
Ref: TEST · round 1 undead A #2 claws · +2 · [8,1]=11 → T1
$ python3 engine/engine.py test 2 --why "round 1 undead A #3 claws"
Ref: TEST · round 1 undead A #3 claws · +2 · [9,3]=14 → T2
$ python3 ledger.py take 2
LEDGER: took 2 (AD 25→23, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 23 · wounds 0/10 · uses Slashing 3 · UD torch 1
(Undead A #2 Stamina 10 - 7 = 3. Undead A #3 Stamina 10. Round 1 done; round 2 next, initiative to be rolled.)
[REF] The second razorback comes out of the water in a rush and the blade is waiting for it, opening it from hip to shoulder in a spray of black fluid. It staggers but keeps its feet, hooked hands lifting. It swings once and its claws hiss through the air where Mara's face was a heartbeat before. The third is already past the pillar and on her flank. Its claws rake across her armor with a shriek of iron on bone, and she feels the weight of it through the plates. The torch still burns. The wounded one is leaking and slow, its ribs showing through a gash. The unhurt one is crouched at her side, bony back arched, spines lifting like hackles.

Ref: TEST · round 1 undead A #2 claws · +2 · [8,1]=11 → T1 | Ref: TEST · round 1 undead A #3 claws · +2 · [9,3]=14 → T2 | LEDGER: took 2 (AD 25→23, Stamina 17→17, wounds 0→0)

Crypt hall · DT 1 (rooms 3 of 4) · Stamina 17 · wounds 0/10 · torch lit, 1 UD · a bleeding razorback in front of her and a fresh one at her flank
## Turn 7
[PLAYER] PLAYER [7/14]: I open the next door and go in.
[TOOLS]
$ python3 engine/engine.py init
Ref: initiative d10=9 → crows act first
$ python3 player.py S4
PLAYER [7/14]: I open the next door and go in.
(ruling: opening the door and stepping through are her two maneuvers; no printed opportunity-attack trigger for disengaging, none made. The undead follow and act after her, each moving then clawing.)
$ python3 engine/engine.py test 2 --why "round 2 undead A #2 claws (follows into ossuary)"
Ref: TEST · round 2 undead A #2 claws (follows into ossuary) · +2 · [3,8]=13 → T2
$ python3 engine/engine.py test 2 --why "round 2 undead A #3 claws (follows into ossuary)"
Ref: TEST · round 2 undead A #3 claws (follows into ossuary) · +2 · [2,2]=6 → T1
$ python3 ledger.py take 2
LEDGER: took 2 (AD 23→21, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 21 · wounds 0/10 · uses Slashing 3 · UD torch 1
(Rooms 4 of 4: DT 1 ends. Hot card re-read.)
$ python3 ledger.py ud torch
UD torch · [2] → 1→0 · EXPIRED
STATUS Stamina 17 · AD 21 · wounds 0/10 · uses Slashing 3 · UD torch 0
$ python3 engine/engine.py enc --en 9
Ref: encounter d10=3 vs EN 9 → none
[REF] Mara hauls the far door inward and goes through it into a long, low chamber lined with shelves, and every shelf is stacked with bones, skulls grinning in rows above the waterline. She does not get to look at any of it. The razorbacks come in at her heels, splashing, and the nearer one catches her across the shoulder with a hooked hand, the claws skidding off steel. The other lunges and finds only air. Then the torch gives a last small cough, the flame shrinks to a blue bead, and goes out. The dark is total, wet, and full of the sound of breathing that is not breathing. Claws click on stone to her left, and something sweet and rotten leans close.

Ref: TEST · round 2 undead A #2 claws · +2 · [3,8]=13 → T2 | Ref: TEST · round 2 undead A #3 claws · +2 · [2,2]=6 → T1 | UD torch · [2] → 1→0 · EXPIRED | Ref: encounter d10=3 vs EN 9 → none

Ossuary · DT 1 ended, DT 2 next (rooms 0) · Stamina 17 · wounds 0/10 · dark, torch out · a razorback's claws click an arm's length to her left
## Turn 8
[PLAYER] PLAYER [8/14]: I search the room for treasure and the way on.
(roll on request: only if asked)
[TOOLS]
$ python3 player.py S4
PLAYER [8/14]: I search the room for treasure and the way on.
(roll on request: only if asked)
$ python3 engine/engine.py roll d6 --why "DT2 length (rooms)"
Ref: d6 [2]=2 · DT2 length (rooms)
$ python3 engine/engine.py init
Ref: initiative d10=10 → crows act first
$ python3 ledger.py test M --b 2 --why "search ossuary in darkness (double bane)"
TEST search ossuary in darkness (double bane) · M+0 · bb · [2,2]=4 → T1
STATUS Stamina 17 · AD 21 · wounds 0/10 · uses Slashing 3 · UD torch 0
(ruling: search interrupted by the attackers at T1; the DT block is not spent, no retry until circumstances change.)
$ python3 engine/engine.py test 2 --why "round 3 undead A #2 claws"
Ref: TEST · round 3 undead A #2 claws · +2 · [6,9]=17 → T3
$ python3 engine/engine.py test 2 --why "round 3 undead A #3 claws"
Ref: TEST · round 3 undead A #3 claws · +2 · [10,2]=14 → T2
$ python3 ledger.py take 4
LEDGER: took 4 (AD 21→17, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 17 · wounds 0/10 · uses Slashing 3 · UD torch 0
$ python3 ledger.py take 2
LEDGER: took 2 (AD 17→15, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 15 · wounds 0/10 · uses Slashing 3 · UD torch 0
(Lacerate needs Stamina damage; AD absorbed it, none applied.)
[REF] Mara sweeps her free hand along the nearest shelf and finds only bone, dry and brittle, skulls rolling under her fingers with a hollow clatter. She cannot see her own hand. A shelf edge, a slick floor, the stink of rot, and nothing she can name as treasure or a way on. The search is cut short. Claws hammer her armor from two sides and one finds a seam, a hard, grinding hit that numbs her arm to the elbow. The second raking blow follows, higher up, shrieking off her pauldron. She feels air stir on her face as something leans in again, and the clatter of shifting skulls tells her one of them has climbed a shelf behind her.

Ref: d6 [2]=2 · DT2 length (rooms) | Ref: initiative d10=10 → crows act first | TEST search ossuary in darkness (double bane) · M+0 · bb · [2,2]=4 → T1 | Ref: TEST · round 3 undead A #2 claws · +2 · [6,9]=17 → T3 | Ref: TEST · round 3 undead A #3 claws · +2 · [10,2]=14 → T2

Ossuary · DT 2 (rooms 0 of 2) · Stamina 17 · wounds 0/10 · dark, torch out · two razorbacks on her, one above and behind her on the shelves
## Turn 9
[PLAYER] PLAYER [9/14]: I go on to the next room.
[TOOLS]
$ python3 player.py S4
PLAYER [9/14]: I go on to the next room.
$ python3 engine/engine.py init
Ref: initiative d10=8 → crows act first
(Mara moves into area 5; vault undead B and A close and strike with the two followers. Rooms 1 of 2 in DT 2.)
$ python3 engine/engine.py test 2 --why "round 4 undead A #2 (3 Stamina) claws"
Ref: TEST · round 4 undead A #2 (3 Stamina) claws · +2 · [6,10]=18 → T3
$ python3 engine/engine.py test 2 --why "round 4 undead A #3 claws"
Ref: TEST · round 4 undead A #3 claws · +2 · [10,7]=19 → T3
$ python3 engine/engine.py test 2 --why "round 4 undead vault A #4 claws"
Ref: TEST · round 4 undead vault A #4 claws · +2 · [8,1]=11 → T1
$ python3 engine/engine.py test 2 --why "round 4 undead vault B claws"
Ref: TEST · round 4 undead vault B claws · +2 · [4,9]=15 → T2
$ python3 ledger.py take 4
LEDGER: took 4 (AD 15→11, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 11 · wounds 0/10 · uses Slashing 3 · UD torch 0
$ python3 ledger.py take 4
LEDGER: took 4 (AD 11→7, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 7 · wounds 0/10 · uses Slashing 3 · UD torch 0
$ python3 ledger.py take 3
LEDGER: took 3 (AD 7→4, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 4 · wounds 0/10 · uses Slashing 3 · UD torch 0
[REF] Mara shoulders through the next doorway by feel and the flood gives way to a stone floor that rings underfoot. The vault is bigger than the room behind, and it is not empty. A heavy shape drops from above and rakes her armor, and something taller and quicker than the others hits her from the right with claws like fence spikes. Behind her, the two razorbacks pile through the door and pound at her back, one blow, then the other, and the plates ring. The leader's claws are longer than the rest, and she can hear them scrape her buckles. Her armor is nearly stripped, a stuttering, dented rattle. A second, smaller shape clicks in the dark and finds nothing. Four of them now, and all of them can see her.

Ref: TEST · round 4 undead A #2 (3 Stamina) claws · +2 · [6,10]=18 → T3 | Ref: TEST · round 4 undead A #3 claws · +2 · [10,7]=19 → T3 | Ref: TEST · round 4 undead vault A #4 claws · +2 · [8,1]=11 → T1 | Ref: TEST · round 4 undead vault B claws · +2 · [4,9]=15 → T2

Side vault · DT 2 (rooms 1 of 2) · Stamina 17 · wounds 0/10 · dark, torch out · four undead around her, armor nearly gone
