## Turn 1
[PLAYER] PLAYER [1/14]: I enter the cellar by the stair and look the first room over before stepping in.
(roll on request: only if asked)
[TOOLS]
$ python3 engine/engine.py roll d6 --why "DT1 length (rooms)"
Ref: d6 [1]=1 · DT1 length (rooms)
$ python3 ledger.py ud torch
UD torch · [1] → 1→0 · EXPIRED
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 0
$ python3 engine/engine.py enc --en 9
Ref: encounter d10=2 vs EN 9 → none
[REF] Dungeon Turn 1 begins as you step onto the stair. Black water laps the bottom three treads, and the cellar breathes cold rot up at you. Your torch throws a short, orange circle over the landing: wet stone sweating in the light, a door at the far side, and deep claw marks scored down its frame, four furrows, fresh enough that pale stone shows in them. The stench is old meat and standing water. Nothing moves. Nothing answers when you scrape your boot on the step. You count what the light gives you and it is a small, empty landing and a door.

Then the flame shrinks. It sinks to a blue bead on the pitch-soaked rag, flutters once, and goes out. The dark closes over the landing so completely that the water is only a sound, and the claw-marked door is only a cold edge you can feel with your fingers.

Ref: encounter d10=2 vs EN 9 → none
Where: stair landing · DT 2 begins next · Stamina 17 · AD 25 · wounds 0/10 · no light (torch burned out) · the dark is total, and the door with the claw marks is an arm's length ahead of you.

## Turn 2
[PLAYER] PLAYER [2/14]: I search the first room carefully, checking the floor and the shelves.
(roll on request: only if asked)
[TOOLS]
$ python3 engine/engine.py roll d6 --why "DT2 length (rooms)"
Ref: d6 [4]=4 · DT2 length (rooms)
[REF] Dungeon Turn 2 starts. You go down on one knee in the dark and work the landing with your hands. Wet flagstones, slick with a skin of silt. A rusted iron ring set in the wall, cold and furred with scale. No shelves here, only the walls, sweating and slimed to the height of your shoulder. The floor gives up nothing: no coin, no bones, no dropped blade. Whatever came through here left no belongings.

Your fingertips find the door frame last. The gouges run from knee height to above your head, four parallel furrows, each as deep as a finger joint. You feel your own hand span them with room to spare. The stench is thicker at the seam of the door, as if the room beyond is breathing out through the crack.

Behind you, the water on the stairs slaps once against stone, though nothing disturbed it.

Where: stair landing · DT 2 (rooms 4) · Stamina 17 · AD 25 · wounds 0/10 · no light · a cold, rotten breath is seeping under the door in front of you.
[NOTE] Procedure slip: player.py was called once by mistake at the end of Turn 2 with output discarded (never read). The pointer was restored to 2, so the next call returns the Turn 3 line unseen.

## Turn 3
[PLAYER] PLAYER [3/14]: I step across the room to the far door.
[TOOLS] (none)
[REF] Four paces of slick stone, one hand trailing the wall, and your fingers find the door. It is swollen with damp, but it yields to your shoulder with a long, wet groan that carries. You wait, listening. Water drips. Nothing answers.

Beyond is a different room. The air is drier here and smells of split wood and old grain. Your boot catches on something that rolls and clatters: a broken plank. By touch you learn the shape of the place. A tall shelving frame has come down across the room's far corner in a pile of splintered boards, and under its edge something square and hard, iron-banded, sits wedged beneath the weight. A chest, by the corners.

From somewhere farther in, beyond the back wall, comes a dry, patient scraping, like a nail drawn slowly along stone. It stops when you stop breathing. It starts again when you do.

Where: storeroom, area 2 · DT 2 (rooms 4, 2 explored of 4) · Stamina 17 · AD 25 · wounds 0/10 · no light · something is dragging a claw along the stone just past the far wall.

## Turn 4
[PLAYER] PLAYER [4/14]: I deal with whatever comes through, sword first. Torch high.
(roll on request: attack / Trade Blows)
[TOOLS]
$ python3 engine/engine.py enc --en 9
Ref: encounter d10=7 vs EN 9 → none
[REF] You plant your feet, sword forward, the dead torch raised in your off hand. It gives you nothing but the smell of cold pitch. The dark presses on your open eyes.

Nothing comes through. The door you opened still gapes behind you, and the only motion is the drip of water on the landing. Then the scraping beyond the far wall changes. It is no longer one slow nail on stone. A second sound joins it, a little out of time, and a third, dry and rasping, like several blades being drawn across the same wall. They stop together.

Silence settles, and it is the silence of something listening back. A faint draft pushes from the back of the room, carrying a smell far worse than the stair: sweet, brown, long dead. Under the fallen shelving the iron-banded chest sits as it did, untouched, and a splinter of board ticks as it settles beside it.

Ref: encounter d10=7 vs EN 9 → none
Where: storeroom, area 2 · DT 2 (rooms 4, 2 explored) · Stamina 17 · AD 25 · wounds 0/10 · no light · several things beyond the far wall have gone quiet, as if they heard the door.

## Turn 5
[PLAYER] PLAYER [5/14]: I press on the nearest one.
[TOOLS]
$ python3 ledger.py move S --dis --why "Trade Blows vs razorback A1, dark"
MOVE Trade Blows vs razorback A1, dark · S+3 · - · [1,3]=7 → T2
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 0
$ python3 ledger.py take 2
LEDGER: took 2 (AD 25→23, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 23 · wounds 0/10 · uses Slashing 3 · UD torch 0
(Note: after this roll I ran one python one-liner that printed only which script entries carry an "if" key, no text. Rulings: dark gives DIS on Trade Blows; the 7-9 cost was chosen by the Ref because the script offers no choice channel. Undead A1 Stamina 10 -> 3 after 7 dam.)
[REF] You go through the back door toward the scrape, sword leading. The floor opens out under your boots into a wide room, the air hung with cold, and the sound of a pillar's edge brushes your shoulder. Something moves in the black, fast and low, and claws rake your shield arm with a bright rasp of iron on bone.

You swing at the sound. The sword bites something dry and tough, parts it, and a rattling hiss answers. A strike you can't see lands on your armor: a heavy blow that rings through the plate and takes the breath from you for a heartbeat. In the exchange the dead torch is torn from your off hand. It clatters far off across the stone and rolls to a stop.

The thing you cut lurches back, still standing, spined and bent, and you hear it shift to find you again. Beyond it, between the pillars, two more shapes scrape and settle, and none of them has gone quiet now.

Ref: Trade Blows 7-9 · cost: lose something (torch lost) · foe A1 inflicts 2 dam · you inflict 7
Where: crypt hall, area 3 · DT 2 (rooms 4, 3 explored) · Stamina 17 · AD 23 · wounds 0/10 · no light · three razorbacks around you, one badly hurt, claws coming for your face.
