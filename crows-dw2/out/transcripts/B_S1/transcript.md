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

