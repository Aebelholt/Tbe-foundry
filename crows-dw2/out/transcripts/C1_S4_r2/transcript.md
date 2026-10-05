## Turn 1
[PLAYER] PLAYER [1/14]: I enter the cellar by the stair and look the first room over before stepping in.
[TOOLS] `python3 engine/engine.py roll d6 --why "DT 1 length (rooms)"` -> Ref: d6 [4]=4 · DT 1 length (rooms)
[REF] The stair drops into cold air that tastes of wet iron. Your torch throws a short orange circle on the landing: black water stands in the low corners, skinned with grease, and the walls weep. Deep claw marks score the door frame ahead, four parallel furrows at the height of your ribs, the wood around them swollen and dark. Beneath the damp there is a thick, sweet stench of old rot, strongest near the door. Nothing on the landing moves. Water ticks somewhere past the frame, slow, like a counted breath. The torch gutters once and steadies.

Ref: d6 [4]=4 · DT 1 length (rooms)

Where: stair landing (area 1) · DT 1 (rooms 1/4) · Stamina 17 · wounds 0/10 · torch lit · the door ahead, clawed and stinking, stands ajar a hand's width.

## Turn 2
[PLAYER] PLAYER [2/14]: I search the first room carefully, checking the floor and the shelves.
[TOOLS] (none; the landing is empty, no test called)
[REF] There are no shelves on the landing, only bare stone, but you work the torch low along the floor and find what the water hides. Under the grease lie old drag marks, wide and shallow, running from the clawed door toward the stair, as if something heavy was hauled up and let go. Your own boots leave the only clean prints. Nothing else: no coin, no scrap, no bones. The claw furrows on the frame, up close, are packed with a black crust that flakes under your thumbnail and smells of the stench itself. Past the door, the dripping goes on, and under it comes a faint dry scrape, once, and then not again.

Status: stair landing (area 1) · DT 1 (rooms 1/4) · Stamina 17 · wounds 0/10 · torch lit · something scraped beyond the door, and the gap is wide enough to pass through.

## Turn 3
[PLAYER] PLAYER [3/14]: I step across the room to the far door.
[TOOLS] (none; no test called)
[REF] The door gives with a wet groan and you pass through into a storeroom, low and long, the ceiling sagging with damp. Shelving lines both walls. On the left it has collapsed in a heap of rotten planks, and under the heap, half pinned, sits an iron-banded chest, its lid furred with pale mold. Jars have burst across the floor and the sweet stench is thinner here, mixed with the smell of old smoke. Scorch marks blacken the nearest planks and the flagstones around the chest, as though something burned here long before the water came. The scrape you heard does not come again. Ahead, across the room, a second doorway stands open on darkness, and cold air breathes out of it.

Where: storeroom (area 2) · DT 1 (rooms 2/4) · Stamina 17 · wounds 0/10 · torch lit · the chest sits under the planks, and the far doorway breathes at you.

## Turn 4
[PLAYER] PLAYER [4/14]: I deal with whatever comes through, sword first. Torch high.
[TOOLS] (none; no foe is in reach, so no Trade Blows; no roll called)
[REF] You plant your feet, blade level, torch raised until the heat licks your wrist. Nothing comes through. The storeroom holds its breath with you: water dripping, a plank settling in the heap by the chest, a jar rolling a slow half-circle and stopping. Then, beyond the far doorway, bone clicks on stone, soft and patient, from somewhere deeper than your light reaches. The sound moves a little to the left and stops, the way a thing stops when it has noticed the light and is deciding. The torch flame leans toward that doorway, drawn by the draught, and shows you the first pale curve of a pillar out in the dark. Nobody has crossed to you. Whatever is out there is waiting for you to be the one who moves.

Where: storeroom (area 2) · DT 1 (rooms 2/4) · Stamina 17 · wounds 0/10 · torch lit · bone clicks beyond the far doorway, and the chest sits untouched at your elbow.

## Turn 5
[PLAYER] PLAYER [5/14]: I press on the nearest one.
[TOOLS]
`python3 ledger.py attack` -> ATTACK attack · S+3 · - · [6,7]=16 → T2 · HIT 7 dam
`python3 ledger.py attack` status -> STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
`python3 engine/engine.py test 2 --why "Undead A1 claws"` -> Ref: TEST · Undead A1 claws · +2 · [6,9]=17 → T3
`python3 ledger.py take 4` -> LEDGER: took 4 (AD 25→21, Stamina 17→17, wounds 0→0) / STATUS Stamina 17 · AD 21 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF] You cross the doorway into a wide crypt hall, pillars marching away into the black. The nearest pillar gives up a razor-backed shape, gray skin stretched over a ridge of spines, and it comes off the stone to meet you. Your blade bites its shoulder and takes a slab of dead flesh with it. It does not cry out. Its claws rake back across your armor in a wet arc, shrieking on the plates and leaving bright scores in the metal, but nothing reaches you. Beyond it, two more shapes slide from behind farther pillars, spines rattling, and stop at the edge of the light, watching.

Ref: TEST · Undead A1 claws · +2 · [6,9]=17 → T3
Foes: A1 Stamina 3/10 [engaged] close · A2 Stamina 10/10 [unengaged] near · A3 Stamina 10/10 [unengaged] near

Where: crypt hall (area 3) · DT 1 (rooms 3/4) · Stamina 17 · wounds 0/10 · torch lit · the wounded razorback is in your face, and two more wait to flank.

## Turn 6
[PLAYER] PLAYER [6/14]: I finish them and move on to the next room.
[TOOLS]
`python3 ledger.py attack` -> ATTACK attack · S+3 · - · [5,5]=13 → T2 · HIT 7 dam / STATUS Stamina 17 · AD 21 · wounds 0/10 · uses Slashing 3 · UD torch 1
(A1 Stamina 3 → 0, destroyed before it can answer; no foe attack roll this exchange)
[REF] You step into the wounded razorback and drive the blade down through the ridge of its spine. It folds, claws scrabbling once at your boot, and goes still, a heap of gray hide and dry bone. The other two do not wait for it to stop. The nearer one drops low behind a pillar and comes around it at a crouch, spines flaring, the second sliding wide to your left to put the pillar between you and your torch. They move like things that learned the hall's corners long ago. The stench is heavy enough now to taste. The one on the right opens its jaw, and a rattling hiss rolls out of it.

Ref: (none; A1 destroyed, no foe roll)

Where: crypt hall (area 3) · DT 1 (rooms 3/4) · Stamina 17 · wounds 0/10 · torch lit · two razorbacks circle the pillars, and the right-hand one has just drawn its spines back to loose them.

## Turn 7
[PLAYER] PLAYER [7/14]: I open the next door and go in.
[TOOLS]
(crossing to the door with two foes alive costs the exchange, no roll; area 4 entered = room 4/4, DT 1 ends)
`python3 ledger.py ud torch` -> UD torch · [5] → 1→1 / STATUS Stamina 17 · AD 21 · wounds 0/10 · uses Slashing 3 · UD torch 1
`python3 engine/engine.py enc --en 9` -> Ref: encounter d10=4 vs EN 9 → none
`python3 engine/engine.py roll d6 --why "DT 2 length (rooms)"` -> Ref: d6 [4]=4 · DT 2 length (rooms)
[REF] You back and then turn for the far door, shoulder first, and the hall closes behind your heels. A spine goes past your ear and cracks against a pillar, a bone-white sliver ringing on the stone. The latch gives; you throw the door wide and step through, torch swinging. Beyond is a narrow ossuary, shelf upon shelf of stacked skulls and long bones climbing to the ceiling, grinning at the light. The razorbacks are on your trail, claws scraping at the threshold, no more than a stride or two behind. Your first dungeon turn is over; the torch burns on, none the worse. Dust shifts down from the shelves as the claws come.

Ref: encounter d10=4 vs EN 9 → none
Ref: d6 [4]=4 · DT 2 length (rooms)

Where: ossuary (area 4) · DT 2 (rooms 1/4) · Stamina 17 · wounds 0/10 · torch lit · two razorbacks are at the doorway behind you, one with spines drawn.
