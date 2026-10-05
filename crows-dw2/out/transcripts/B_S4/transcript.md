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
