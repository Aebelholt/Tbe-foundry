## Turn 1
[PLAYER] PLAYER [1/7]: I hold the torch high and step in on the bear, sword out, and drive at it.
(roll on request: attack / Trade Blows with the bear, expertise only on a T1)
[TOOLS]
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [10,10]=23 → T3 CRIT · HIT 10 dam
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "bear bite vs Mara"
Ref: TEST · bear bite vs Mara · +2 · [6,9]=17 → T3
$ python3 ledger.py take 8   (bite 17+ = 6 dam, +2 Dangerous When Cornered since bear now at 10)
LEDGER: took 8 (AD 25→17, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 17 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py attack   (crit extra exchange)
ATTACK attack · S+3 · - · [9,2]=14 → T2 · HIT 7 dam
STATUS Stamina 17 · AD 17 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "bear bite vs Mara"
Ref: TEST · bear bite vs Mara · +2 · [3,10]=15 → T2
$ python3 ledger.py take 7   (bite 12-16 = 4 dam, +1, +2 cornered)
LEDGER: took 7 (AD 17→10, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 10 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
The torch hisses and throws her shadow long across the nave as Mara closes the gap. The bear rears off the carcass and she cuts it across the shoulder, a deep, heavy stroke that splits hide and meat. It roars, blood spattering the flagstones. Her second cut lands too, but shallower, and the bear is already on her, jaws snapping at her shield arm and then again at her ribs. Armor rings and buckles under the teeth. The beast sways, ropes of red running from its chest, its roar gone ragged and wet. Beyond it the two wolves have dropped their heads and come off the carcass, hackles up, stalking wide along the pews.

Ref: TEST · bear bite vs Mara · +2 · [6,9]=17 → T3 | Ref: TEST · bear bite vs Mara · +2 · [3,10]=15 → T2

Nave · DT 3 · Stamina 17 · wounds 0/10 · torch lit · the bear is in her face, bleeding, and the wolves are circling in.

## Turn 2
[PLAYER] PLAYER [2/7]: I keep pressing the bear and give it no room.
[TOOLS]
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [3,1]=7 → T1 · MISS
STATUS Stamina 17 · AD 10 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "bear bite vs Mara"
Ref: TEST · bear bite vs Mara · +2 · [1,4]=7 → T1
$ python3 engine/engine.py test 1 --why "wolf A bite vs Mara (Ref move, tier 1)"
Ref: TEST · wolf A bite vs Mara · +1 · [5,6]=12 → T2
$ python3 ledger.py take 4   (wolf bite 12-16 = 3, +1)
LEDGER: took 4 (AD 10→6, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 6 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
Mara lunges and her blade skates off the bear's thick skull, throwing sparks from the old stone behind it. The bear, bleeding and half mad, slaps wide with its jaws and finds nothing but air. But the move has cost her the angle. A gray shape comes in low from the pews on her left, all teeth and wet breath, and fastens a bite on her thigh guard. Leather crumples and a hot line of pain runs under it. The second wolf holds back near the pulpit, lips peeled, waiting its turn. The bear heaves, one forepaw dragging, red foam on its muzzle, and swings its head back around toward the light of her torch.

Ref: TEST · bear bite vs Mara · +2 · [1,4]=7 → T1 | Ref: TEST · wolf A bite vs Mara (Ref move, tier 1) · +1 · [5,6]=12 → T2

Nave · DT 3 · Stamina 17 · wounds 0/10 · torch lit · one wolf is hanging off her leg guard and the bear is turning back to her.

## Turn 3
[PLAYER] PLAYER [4/7]: I turn on the nearest wolf.
[TOOLS]
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [2,1]=6 → T1 DOOM · MISS
STATUS Stamina 17 · AD 6 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 1 --why "wolf A bite vs Mara"
Ref: TEST · wolf A bite vs Mara · +1 · [9,8]=18 → T3
$ python3 engine/engine.py test 1 --e 1 --why "wolf B bite vs Mara (Ref move, Pack Hunter edge)"
Ref: TEST · wolf B bite vs Mara (Ref move, Pack Hunter edge) · +1 · e · [7,9]=19 → T3
$ python3 ledger.py take 4   (wolf A bite 17+ = 4)
LEDGER: took 4 (AD 6→2, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 2 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 4   (wolf B bite 17+ = 4)
LEDGER: took 4 (AD 2→0, Stamina 17→15, wounds 0→0)
STATUS Stamina 15 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
Mara wheels on the wolf and her feet find the slick of the bear's blood. Her boot goes out from under her, the sword a bright stroke through nothing, and she drops to one knee on the flagstones with the torch flaring wildly overhead. The first wolf takes the opening and its jaws close on her forearm, teeth grating on the last of the plate. The second wolf comes in from the pulpit side, and its bite goes straight through the cracked leather at her flank. Both of them are on her now, shoulder to shoulder, snarling. Her armor is done; the cold of the stone is in her knee, and the next bite will be on flesh. The bear, three paces off and rocking on its feet, has not stopped breathing.

Ref: TEST · wolf A bite vs Mara · +1 · [9,8]=18 → T3 | Ref: TEST · wolf B bite vs Mara (Ref move, Pack Hunter edge) · +1 · e · [7,9]=19 → T3

Nave · DT 3 · Stamina 15 · wounds 0/10 · torch lit · both wolves are on her, she is down on one knee, and her armor is gone.

## Turn 4
[PLAYER] PLAYER [5/7]: I hit the closest wolf again.
[TOOLS]
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [7,1]=11 → T1 · MISS
STATUS Stamina 15 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 1 --e 1 --why "wolf A bite vs Mara (Pack Hunter edge)"
Ref: TEST · wolf A bite vs Mara (Pack Hunter edge) · +1 · e · [10,3]=16 → T2
$ python3 engine/engine.py test 2 --why "bear bite vs Mara (Ref move, tier 1)"
Ref: TEST · bear bite vs Mara (Ref move, tier 1) · +2 · [1,4]=7 → T1
$ python3 ledger.py take 4   (wolf bite 12-16 = 3, +1)
LEDGER: took 4 (AD 0→0, Stamina 15→11, wounds 0→0)
STATUS Stamina 11 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
Mara cuts at the nearest wolf from her knee, and it slips the stroke, the blade ringing off a pew end. Its jaws find her shoulder, no armor left to stop them, and the teeth go deep. She feels the heat of her own blood. The second wolf is snapping at her calf, pinning her low. From the nave's dark the bear lurches in, one great paw hauling it forward over the stones, and its jaws clap shut a hand's breadth from her face, so close that its carrion breath hits her. It is hurt badly, swaying, but not done. The torch gutters in her fist and smoke drifts under the broken vaults. The wolves hold her low and the bear is back in reach.

Ref: TEST · wolf A bite vs Mara (Pack Hunter edge) · +1 · e · [10,3]=16 → T2 | Ref: TEST · bear bite vs Mara (Ref move, tier 1) · +2 · [1,4]=7 → T1

Nave · DT 3 · Stamina 11 · wounds 0/10 · torch lit · wolves pin her low and the bear is back in reach with its jaws a hand from her face.

## Turn 5
[PLAYER] PLAYER [6/7]: I finish the last one standing.
[TOOLS]
$ python3 ledger.py attack   (Ref ruling: "last one standing" read as the bear, the only foe still on its feet and nearly dead; logged)
ATTACK attack · S+3 · - · [8,6]=17 → T3 · HIT 10 dam
STATUS Stamina 11 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
(bear 3 Stamina, dies; no foe attack from a dead foe; no unengaged live foe, crow tier 3, no Ref move)
[REF]
Mara drives up off her knee with the torch in one hand and the sword in the other, and the bear's head comes down into the arc of the blade. The stroke goes in under the jaw, through the thick of the neck, and the great animal folds with a grunt, its weight crashing across the pew behind it. Its paws scrape once at the stones and then are still. The two wolves flinch at the sound. They stay on her all the same, teeth bared and bloody, one gripping her sleeve, the other crouched for her leg, but their eyes slide to the fallen bear and back, and their growling has a shake in it. The torchlight jumps on their wet muzzles. Her breath comes loud in the vault, and blood runs warm down her arm.

Nave · DT 3 · Stamina 11 · wounds 0/10 · torch lit · the bear is dead and both wolves are on her, snarling and wary.

## Turn 6
[PLAYER] PLAYER [7/7]: I check the room and wipe the blood off my hands.
[TOOLS]
(Ref ruling, no roll: with the bear dead and Mara standing, the wolves flee a losing fight per system layer §4; no engaged foe attacks because Mara takes no hostile action and the pack has broken. Fight over, DT 3 ends.)
$ python3 ledger.py ud torch
UD torch · [4] → 1→1
STATUS Stamina 11 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py enc --en 9
Ref: encounter d10=4 vs EN 9 → none
[REF]
Mara lowers the sword, and that is enough. The wolves give up the fight all at once. The one at her sleeve lets go and slinks backward, belly low, and its mate follows, both of them staring at the dead bear as if it might rise. Then they bolt, claws skittering over the flagstones, and vanish through a gap in the north wall where the rubble has fallen in. Their howling thins out into the dark and is gone. Silence settles over the nave. The torch burns steady. Mara looks over the ruin: toppled pews, a cracked altar stone, the half eaten carcass where the animals were feeding, the bear lying in its own blood. She wipes her hands on her coat, and the cuffs come away dark and sticky. The dust is still settling, and somewhere deeper in the hold a loose stone clicks and rolls.

UD torch · [4] → 1→1 | Ref: encounter d10=4 vs EN 9 → none

Nave, west door at her back · end of DT 3 · Stamina 11 · wounds 0/10 · torch lit (UD 1) · a stone clicks somewhere deeper in the hold.

DONE
6 turns run (player script ended at 7/7; turn 1 and 2 of the crow's exchanges included a crit extra exchange).
