## Turn 1
[PLAYER] PLAYER [1/14]: I enter the cellar by the stair and look the first room over before stepping in.
(roll on request: only if asked)
[TOOLS]
$ python3 engine/engine.py roll d6 --why "DT1 length (rooms)"
Ref: d6 [6]=6 · DT1 length (rooms)
[REF]
You go down into the chapel cellar with the torch held ahead of you, and the dark pulls back only a few paces. Black water stands over the lowest steps and laps at the stone with a slow, oily sound. The landing is small and wet. Along the door frame ahead, four deep gouges run from knee height to above your head, pale where the wood was torn open. The air tastes of old rot, thick enough to sit on the tongue. Nothing moves. The torch spits once, and in its light the water shivers, though you have not stepped into it.

Ref: d6 [6]=6 · DT1 length (rooms)
Stair landing · DT 1 (rooms 1 of 6) · Stamina 17 · wounds 0/10 · torch lit, UD 1 · the claw-scarred door waits an arm's length away, and something beyond it drips.

## Turn 2
[PLAYER] PLAYER [2/14]: I search the first room carefully, checking the floor and the shelves.
(roll on request: only if asked)
[TOOLS] (none; empty room, time and no consequence, no roll)
[REF]
You work the landing slowly, torch low over the flagstones, then high along the walls. There are no shelves, only iron brackets rusted to stubs. The floor is silt and standing damp, and in it you find only your own boot prints and, near the door, a smear where something heavy was dragged through and out. The gouges on the frame are old, the splinters gone grey. The stench is strongest at the door's lower edge, where water seeps under it in a thin, steady line. Whatever lived here left nothing behind to take.

Stair landing · DT 1 (rooms 1 of 6) · Stamina 17 · wounds 0/10 · torch lit, UD 1 · the dragged smear leads under the door into the dark.

## Turn 3
[PLAYER] PLAYER [3/14]: I step across the room to the far door.
[TOOLS] (none; no roll)
[REF]
The door gives with a wet groan and you step through into a storeroom. Cold water covers your boots to the ankle. A long shelf has come down along the east wall, its planks split and slumped, and under the wreck sits an iron-banded chest, one corner pinned beneath a fallen beam. Around it the floor is scattered with black ash and a few dull red coals that should have drowned long ago and have not. They glow faintly in the damp, sullen as eyes. Sacks have rotted to heaps of grey pulp. The beam creaks as the settling water shifts around it.

Storeroom · DT 1 (rooms 2 of 6) · Stamina 17 · wounds 0/10 · torch lit, UD 1 · the chest sits under the beam, among the glowing coals.

## Turn 4
[PLAYER] PLAYER [4/14]: I deal with whatever comes through, sword first. Torch high.
(roll on request: attack / Trade Blows)
[TOOLS] (none; nothing is engaged, so no attack or Trade Blows is called for)
[REF]
You plant your feet, sword out, torch raised so the light reaches the corners. Nothing comes. The storeroom answers only with small sounds: the beam's slow creak, water ticking from the ceiling, the coals hissing where drops find them. Then, from the archway on the far side, a different sound. Dry and patient, a scrape of something hard drawn across stone, once, and then again a few heartbeats later, as though it keeps time. It is not close. The stench from the next chamber thickens, rot and cold iron. Whatever is out there has not yet noticed the light, or has and does not care. The chest waits at your feet.

Storeroom · DT 1 (rooms 2 of 6) · Stamina 17 · wounds 0/10 · torch lit, UD 1 · a slow scraping from the far archway, and the chest within reach.

## Turn 5
[PLAYER] PLAYER [5/14]: I press on the nearest one.
[TOOLS]
$ echo "turn4: re-read blocks.md Undead A block (combat entry, first hostile act)" >> lookups.log
$ python3 ledger.py move S --why "Trade Blows vs nearest razorback, crypt hall"
MOVE Trade Blows vs nearest razorback, crypt hall · S+3 · - · [2,6]=11 → T3
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 2
LEDGER: took 2 (AD 25→23, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 23 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
You go through the archway toward the scraping and the cellar opens into a crypt hall, a row of fat pillars marching off into black. The torch finds the nearest pillar and a shape peels from behind it: lean, grey, spined along the back like a drowned pike, claws dragging a groove in the stone. It lunges as you close. Your sword meets it first, a hard swing that takes it across the neck and spine and drops it in pieces into the water. Its claws still rake your shield arm on the way down, scoring the plate and sending a bright shiver of cold up to the shoulder. Two more shapes unfold from the pillars beyond, one crouched with its spined back bristling toward you, the other already walking.

Crypt hall · DT 1 (rooms 3 of 6) · Stamina 17 · AD 23 · wounds 0/10 · torch lit, UD 1 · two razorbacks left, one stalking in, the other crouched with spines raised.

## Turn 6
[PLAYER] PLAYER [6/14]: I finish them and move on to the next room.
[TOOLS]
$ python3 ledger.py move S --why "Trade Blows vs razorback 2 (stalking in)"
MOVE Trade Blows vs razorback 2 (stalking in) · S+3 · - · [4,4]=11 → T3
STATUS Stamina 17 · AD 23 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 2
LEDGER: took 2 (AD 23→21, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 21 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py move S --why "Trade Blows vs razorback 3 (spined, crouched)"
MOVE Trade Blows vs razorback 3 (spined, crouched) · S+3 · - · [4,1]=8 → T2
STATUS Stamina 17 · AD 21 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 2
LEDGER: took 2 (AD 21→19, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 19 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
The second razorback comes in low and fast, and you meet it with the full weight of the blade. It folds in two against the nearest pillar and does not rise, though its claws score your breastplate once on the way down. The last one does not wait. It bounds off the pillar base, cuts through the torchlight at the edge of your reach, and your sword bites it across the ribs, a deep, ugly cut that should have ended it. It twists through the cut and rakes your side as it lands behind you, between you and the storeroom arch, spines rattling like dry reeds. It is hurt, dragging one leg, but it is not finished, and your back is to the wrong door.

Crypt hall · DT 1 (rooms 3 of 6) · Stamina 17 · AD 19 · wounds 0/10 · torch lit, UD 1 · the wounded razorback crouches behind you, claws scraping the flagstones.

## Turn 7
[PLAYER] PLAYER [7/14]: I open the next door and go in.
[TOOLS]
$ python3 ledger.py move A --why "Defy Danger: break away through the door with a razorback at her back"
MOVE Defy Danger: break away through the door with a razorback at her back · A+1 · - · [3,5]=9 → T2
STATUS Stamina 17 · AD 19 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
You turn your shoulder to the door and drag it open with the creature's breath on your neck. The hinges shriek. You are through before it can strike, but the sound is a signal, and the razorback leaps the last pace in a single scrabbling bound, landing hard on the threshold behind you. It has followed you into the ossuary. Shelves climb the walls to the ceiling, each one stacked with long bones, ribs sorted like firewood, skulls lined in rows with their jaws shut. The torchlight runs across hundreds of eye sockets. The creature crouches in the doorway, wounded leg trembling, spines up, its claws dragging a line through the dust of the dead.

Crypt hall left behind. Ossuary · DT 1 (rooms 4 of 6) · Stamina 17 · AD 19 · wounds 0/10 · torch lit, UD 1 · the razorback blocks the doorway at your back, snarling.

## Turn 8
[PLAYER] PLAYER [8/14]: I search the room for treasure and the way on.
(roll on request: only if asked)
[TOOLS]
$ python3 ledger.py take 2
LEDGER: took 2 (AD 19→17, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 17 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
You turn from the doorway to the shelves, and the razorback takes the gap. It crosses the dust in two scrabbling steps and rakes your hip and thigh as you reach for the nearest skull, its claws squealing across the plates. You get no further into the search than that. Bones shift on the shelf beside you and a rib slides loose and clatters in the water. The creature drags itself back a pace, the leg bleeding black onto the stone, then gathers to spring again. It has not run. It will not. Behind it the crypt hall is a long dark mouth, and somewhere beyond the next wall water drips on something hollow.

Ref move: Hurt Them (2 dam, AD first)
Ossuary · DT 1 (rooms 4 of 6) · Stamina 17 · AD 17 · wounds 0/10 · torch lit, UD 1 · the razorback gathers to spring, one leg dragging.

## Turn 9
[PLAYER] PLAYER [9/14]: I go on to the next room.
[TOOLS]
$ python3 ledger.py move A --why "Defy Danger: slip out of the ossuary toward the vault past the wounded razorback"
MOVE Defy Danger: slip out of the ossuary toward the vault past the wounded razorback · A+1 · - · [6,4]=11 → T3
STATUS Stamina 17 · AD 17 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
You step wide as it springs, the claws passing a hand's breadth from your hip, and you are through the far door before it can turn. It scrabbles in the bones behind you, crashing into a shelf, and a skull rolls across the floor. The vault beyond is low and long, a stone-lined cell with a ribbed ceiling. Water has gathered in the dip of the floor to the knee. Two shapes stand at the far end in the edge of your light. One is a razorback like the others. The other is larger, built heavier through the shoulder, with claws as long as your forearm that hang almost to the water. It lifts its head toward you, and it is not afraid of the torch.

Side vault · DT 1 (rooms 5 of 6) · Stamina 17 · AD 17 · wounds 0/10 · torch lit, UD 1 · the longclaw lifts its head and wades toward you, its razorback close behind.

## Turn 10
[PLAYER] PLAYER [10/14]: I go through the next door.
[TOOLS]
$ python3 ledger.py move A --why "Defy Danger: cross the flooded vault past the longclaw to the far door"
MOVE Defy Danger: cross the flooded vault past the longclaw to the far door · A+1 · - · [1,4]=6 → T1
STATUS Stamina 17 · AD 17 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 3
LEDGER: took 3 (AD 17→14, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 14 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
The door is in the wall past the pair, and the water does not let you hurry. You wade three steps and your foot finds a slick drop in the floor. You stumble to one knee, the torch dipping, and the longclaw is on you before the flame rights itself. One claw comes down across your back and shoulder with a sound like a shovel on slate, driving you into the wall. The other hand grips the door frame above you, a long grey arm barring the way out. The razorback behind it sets its spines and waits for its master to finish. The door is shut by that arm and by the creature standing in front of it.

Ref move: Hurt Them (3 dam, AD first)
Side vault · DT 1 (rooms 5 of 6) · Stamina 17 · AD 14 · wounds 0/10 · torch lit, UD 1 · the longclaw looms over you, arm across the door, razorback at its heel.

## Turn 11
[PLAYER] PLAYER [11/14]: I engage whatever is in the way, sword first.
(roll on request: attack / Trade Blows)
[TOOLS]
$ python3 ledger.py move S --why "Trade Blows vs longclaw (Undead B)"
MOVE Trade Blows vs longclaw (Undead B) · S+3 · - · [4,4]=11 → T3
STATUS Stamina 17 · AD 14 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 3
LEDGER: took 3 (AD 14→11, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 11 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
You come up off the knee with the sword already swinging. It takes the longclaw high across the chest and opens a gash that smokes with grave-cold, and the thing barely staggers. Its answer is a backhand that finds your ribs through the plate and throws you into the stone, scattering water, but the armor holds and you stay on your feet. The arm across the door has dropped. The longclaw stands half turned, head cocked, black fluid running down its chest. It is hurt and it is still coming. Behind it the razorback shifts its weight, looking for an angle past its master's shoulder.

Side vault · DT 1 (rooms 5 of 6) · Stamina 17 · AD 11 · wounds 0/10 · torch lit, UD 1 · the longclaw is bleeding but upright, the razorback circling for a line.

## Turn 12
[PLAYER] PLAYER [12/14]: I press the nearest.
[TOOLS]
$ python3 ledger.py move S --why "Trade Blows vs longclaw (nearest)"
MOVE Trade Blows vs longclaw (nearest) · S+3 · - · [2,4]=9 → T2
STATUS Stamina 17 · AD 11 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 3
LEDGER: took 3 (AD 11→8, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 8 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
You lunge into the gap and your blade goes in under its ribs, a shuddering, grinding cut that stops the longclaw cold and pulls a low sound from it like a pipe in wind. It does not fall. Its claws come down again as you close, raking your armor to the stitching, and the plate along your side gives out a sour crack. In that moment of closeness the razorback finds its line, slipping around the larger body and stepping up at your shoulder, spines flaring. The longclaw sways, very nearly spent, one hand tearing at the wall for balance. The water around your legs is going dark.

Side vault · DT 1 (rooms 5 of 6) · Stamina 17 · AD 8 · wounds 0/10 · torch lit, UD 1 · the longclaw swaying and nearly done, the razorback at your shoulder.

## Turn 13
[PLAYER] PLAYER [13/14]: I finish it and look for the exit.
[TOOLS]
$ python3 ledger.py move S --why "Trade Blows vs longclaw (finish)"
MOVE Trade Blows vs longclaw (finish) · S+3 · - · [2,2]=7 → T2
STATUS Stamina 17 · AD 8 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 3
LEDGER: took 3 (AD 8→5, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 5 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
You throw your weight behind the sword and drive it through the longclaw's breastbone. It hangs on the blade a heartbeat, its claws raking your armor one last time as it dies, then slides off into the dark water and does not move. The plate along your ribs is split and buckled and will not take much more. Over the corpse you see the exit. A low door on the vault's far wall, its frame cracked, with the first grey steps of a stair rising beyond. The razorback does not give you time to look at it long. It has its spines pointed at your face and its crouch is a coiled spring.

Side vault · DT 1 (rooms 5 of 6) · Stamina 17 · AD 5 · wounds 0/10 · torch lit, UD 1 · the longclaw is down, the exit stair stands open beyond it, and the razorback is about to spring.

