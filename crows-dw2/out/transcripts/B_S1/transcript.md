## Turn 1
[PLAYER] PLAYER [1/7]: I hold the torch high and step in on the bear, sword out, and drive at it.
[TOOLS]
$ python3 ledger.py move S --why "Trade Blows vs bear"
MOVE Trade Blows vs bear · S+3 · - · [4,3]=10 → T3
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 4
LEDGER: took 4 (AD 25→21, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 21 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
The torch throws a low orange light across the nave and the bear comes up out of the carcass with red to its muzzle, not backing, not waiting. It meets you in three heavy strides. Your sword goes in under the shoulder with all your weight behind it and the animal screams, a sound too big for the room. Its jaws close on your shield-arm in the same breath, and the armor takes the bite with a crunch you feel in your teeth. Hot blood spatters the flagstones. Behind it the wolves have stopped feeding. They slide wide along the pews on either side, low and silent, eyes catching the torch.

Ref: Trade Blows (bear): inflict max damage (10) to the bear; bear bite suffers 4 (AD). MOVE Trade Blows vs bear · S+3 · - · [4,3]=10 → T3

Chapel nave, bear at hand (hurt, bleeding), wolves far and circling · DT 3 · Stamina 17 · AD 21 · torch lit · the bear is still on its feet and its jaws are working at you.

## Turn 2
[PLAYER] PLAYER [2/7]: I keep pressing the bear and give it no room.
(Note: this line was printed by player.py at the end of Turn 1's tool batch; it is resolved here as Turn 2's action.)
[TOOLS]
$ python3 ledger.py move S --why "Trade Blows vs bear"
MOVE Trade Blows vs bear · S+3 · - · [4,5]=12 → T3
STATUS Stamina 17 · AD 21 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 6
LEDGER: took 6 (AD 21→15, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 15 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
You do not give it the room. The bear lunges to close and you step into the lunge instead of away from it, sword driving up through the ribs where the first cut already opened it. The great body shudders against you. Its jaws snap at your guard anyway, wild now, and the bite comes down hard on your armor, harder than the first. Then the weight goes out of it. It folds sideways onto the flagstones and lies half across the carcass it was guarding, one claw still scraping at the stone.

The wolves have stopped circling. Both are low and close now, one at each flank, their lips drawn back from their teeth, the torch flickering in their eyes.

Ref: Trade Blows (bear): inflict max damage (10), the bear dies (Stamina 10 to 0); the bear's bite, Dangerous When Cornered, suffers 6 (AD). MOVE Trade Blows vs bear · S+3 · - · [4,5]=12 → T3

Chapel nave, bear dead, wolves far and closing from both flanks · DT 3 · Stamina 17 · AD 15 · torch lit · two wolves, one at each side, are about to spring.

## Turn 3
[PLAYER] PLAYER [4/7]: I turn on the nearest wolf.
(Note: this line was printed by player.py during Turn 2's batch, before Turn 2 was resolved; it is resolved here as Turn 3's action.)
[TOOLS]
$ python3 ledger.py move S --why "Trade Blows vs wolf 1"
MOVE Trade Blows vs wolf 1 · S+3 · - · [1,6]=10 → T3
STATUS Stamina 17 · AD 15 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 3
LEDGER: took 3 (AD 15→12, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 12 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
You wheel away from the dead bear and the nearer wolf launches itself at you. It is quick, all grey shoulder and gleaming teeth, but you are already turning with the sword low. The blade catches it in the chest mid-leap and the force of it throws the animal sideways. Its jaws still rake your armor as it goes by, a short hard bite that finds a gap at the hip. Then it hits the stone and does not get up.

The second wolf has stopped flanking and stands with its head dropped, a growl rolling in its throat. It is alone now. The torch gutters and steadies. The animal edges sideways, watching the sword, watching you.

Ref: Trade Blows (wolf 1): inflict max damage (10), wolf 1 dies (Stamina 10 to 0); wolf bite suffers 3 (AD). MOVE Trade Blows vs wolf 1 · S+3 · - · [1,6]=10 → T3

Chapel nave, bear and one wolf dead, last wolf close and growling · DT 3 · Stamina 17 · AD 12 · torch lit · the second wolf is gathering itself to come in.

## Turn 4
[PLAYER] PLAYER [5/7]: I hit the closest wolf again.
(Note: this line was printed by player.py during Turn 3's batch, before Turn 3 was resolved; it is resolved here as Turn 4's action. PLAYER [6/7] "I finish the last one standing." was also printed in that batch and is moot: the last wolf died here, so the scene ended.)
[TOOLS]
$ python3 ledger.py move S --why "Trade Blows vs wolf 2"
MOVE Trade Blows vs wolf 2 · S+3 · - · [6,3]=12 → T3
STATUS Stamina 17 · AD 12 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 3
LEDGER: took 3 (AD 12→9, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 9 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py ud torch
UD torch · [1] → 1→0 · EXPIRED
STATUS Stamina 17 · AD 9 · wounds 0/10 · uses Slashing 3 · UD torch 0
$ python3 engine/engine.py enc --en 9 --why "DT 3 end"
Ref: encounter d10=7 vs EN 9 → none · DT 3 end
[REF]
The last wolf comes in low and fast, going for the legs, and you meet it with the flat of your weight and the point of the sword. It yelps once. The blade goes through and the animal drops against your boots, shuddering, then still. Its teeth had already found the edge of your armor, a quick tearing bite, and you feel the plates give a little more.

Silence settles over the nave. The bear lies across its kill, the wolves where they fell. Then the torch sputters, a thin blue flame running down the last of the pitch, and it goes out in your hand. The dark comes down at once, thick with the smell of blood and old stone, and the only sound is your own breath rasping back at you from the pews.

Ref: Trade Blows (wolf 2): inflict max damage (10), wolf 2 dies (Stamina 10 to 0); wolf bite suffers 3 (AD). MOVE Trade Blows vs wolf 2 · S+3 · - · [6,3]=12 → T3 · DT 3 end: UD torch · [1] → 1→0 · EXPIRED · Ref: encounter d10=7 vs EN 9 → none

Chapel nave, all three animals dead · DT 3 ended, DT 4 begins · Stamina 17 · AD 9 · no light · the torch is dead in your hand and the dark has closed in around you.

DONE
Ran 4 turns (player.py script pointer ran ahead of resolution; all printed lines were accounted for, lines 3/7 skipped by the script's own conditions and 6/7 moot).
