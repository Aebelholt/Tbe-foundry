## Turn 1
[PLAYER] PLAYER [1/13]: I hold the torch high and step in on the bear, sword out, and drive at it.
(roll on request: attack / Trade Blows with the bear, expertise only on a T1)
[TOOLS]
$ python3 engine/engine.py init
Ref: initiative d10=3 → enemies act first
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [1,2]=6 → T1 DOOM · MISS
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "bear bite vs Mara"
Ref: TEST · bear bite vs Mara · +2 · [9,5]=16 → T2
$ python3 ledger.py take 4
LEDGER: took 4 (AD 25→21, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 21 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 6
LEDGER: took 6 (AD 21→15, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 15 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
The bear does not wait for her. It rises off the carcass in one wet heave, jaws dripping, and the bite comes first, snapping at her ribs as she closes. Her mail screams and holds. Torchlight swings across the nave, and far down the pews two gray shapes lift their heads from the meat and begin to flow toward her between the broken benches.

Mara's blade comes in high and clumsy. The bear's shoulder turns it like a door swinging shut, and the sword skids off bone-thick hide with a ring that rattles the rafters. Before she can recover, a forepaw hammers her armor, rocking her back a full pace onto the threshold stones. Behind her the west door sags open, the dark corridor at her heels.

The bear huffs, sour breath rolling over the torch flame, and plants itself between her and the carcass.

Ref: initiative d10=3 → enemies act first · Ref: TEST · bear bite vs Mara · +2 · [9,5]=16 → T2 (bite 4) · counter on doom (bite T3, 6)
Nave doorway · DT 3 · Stamina 17 · wounds 0/10 · AD 15 · torch lit (UD 1) · the bear is on her, the wolves are closing down the pews

## Turn 2
[PLAYER] PLAYER [2/13]: I keep pressing the bear and give it no room.
[TOOLS]
$ python3 engine/engine.py init
Ref: initiative d10=1 → enemies act first
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [1,9]=13 → T2 · HIT 7 dam
STATUS Stamina 17 · AD 15 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "bear bite vs Mara"
Ref: TEST · bear bite vs Mara · +2 · [9,9]=20 → T3
$ python3 ledger.py take 6
LEDGER: took 6 (AD 15→9, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 9 · wounds 0/10 · uses Slashing 3 · UD torch 1
(Ref slip: player.py was called a second time in this turn with output discarded unseen; script line 3/13 was consumed and never read.)
[REF]
The bear goes first again, and this time it does not miss. Its jaws close across her shoulder guard and wrench, and the mail groans, links popping like frozen twigs. She feels the plates shift against her collarbone.

Then she is inside its reach and the sword bites. Steel opens the thick hide along the bear's flank and dark blood spatters the flagstones, hissing where it strikes the torch flame's spill. The bear screams, a hoarse, furious sound, and rears back with its lip peeled away from yellow teeth. It is hurt, and a hurt bear is worse than a fresh one.

Behind it the wolves have reached the edge of the torchlight. One slides left along the pews, the other right, low and silent, spreading to take her from both sides. Their eyes catch the flame like coins.

Ref: initiative d10=1 → enemies act first · Ref: TEST · bear bite vs Mara · +2 · [9,9]=20 → T3 (bite 6)
Nave, west door at her back · DT 3 · Stamina 17 · wounds 0/10 · AD 9 · torch lit (UD 1) · the bear rears wounded while two wolves circle to flank

## Turn 3
[PLAYER] PLAYER [5/13]: I hit the closest wolf again.
[TOOLS]
$ python3 engine/engine.py init
Ref: initiative d10=3 → enemies act first
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [8,2]=13 → T2 · HIT 7 dam
STATUS Stamina 17 · AD 9 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "bear bite vs Mara"
Ref: TEST · bear bite vs Mara · +2 · [3,7]=12 → T2
$ python3 engine/engine.py test 3 --why "wolf 1 bite vs Mara, flanking"
Ref: TEST · wolf 1 bite vs Mara, flanking · +3 · [4,7]=14 → T2
$ python3 engine/engine.py test 3 --why "wolf 2 bite vs Mara, flanking"
Ref: TEST · wolf 2 bite vs Mara, flanking · +3 · [6,5]=14 → T2
$ python3 ledger.py take 6   (bear T2 bite 4 +2 Dangerous When Cornered)
LEDGER: took 6 (AD 9→3, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 3 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 3
LEDGER: took 3 (AD 3→0, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 3
LEDGER: took 3 (AD 0→0, Stamina 17→14, wounds 0→0)
STATUS Stamina 14 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
(Ref note: the script's lines 3-4 were skipped by the earlier extra call; "closest wolf again" had no earlier wolf hit. Foes now: bear 13/20, wolf 1 3/10, wolf 2 10/10.)
[REF]
All three come at once. The bear's jaws find the already-broken shoulder guard and tear it open, and what is left of her armor goes slack and useless. One wolf hits her left thigh, the other her right forearm, teeth scraping through leather and into the meat beneath. The pain is bright and immediate. Her mail no longer turns anything.

She swings low at the nearer wolf and the blade opens it from hip to shoulder. It yelps, staggers sideways dragging a hind leg, and drops to its belly on the flagstones, still snarling but done with the fight in its eyes.

The bear, bleeding from its flank and furious past reason, drives its whole weight at her. The second wolf is already coiling to spring from the dark beside the font. The torch gutters in her fist, throwing her shadow wide and wild across the nave wall, and the west door is one step behind her heel.

Ref: initiative d10=3 → enemies act first · Ref: TEST · bear bite +2 [3,7]=12 → T2 · wolf bite +3 [4,7]=14 → T2 · wolf bite +3 [6,5]=14 → T2
Nave, west door at her back · DT 3 · Stamina 14 · wounds 0/10 · armor gone · torch lit (UD 1) · the bear, a crippled wolf, and a fresh wolf are all on her

