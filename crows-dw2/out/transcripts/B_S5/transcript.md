## Turn 1
[PLAYER] PLAYER [1/9]: I plant myself in the corridor mouth with the torch behind me, and wait for the first one to come into reach.
(roll on request: none yet)
[TOOLS] (none; no roll called for, crow is waiting)
[REF] The torch hisses behind you and throws your shadow down the corridor, long and wavering. Dust sifts from the ceiling with each step out there. Wet scraping, then the click of too many claws on flagstone. Two shapes come out of the dark first, low and long-backed, ridges of bone standing along their spines like a row of rusted nails. They drag their hands as they walk. Their eyes catch the torchlight and hold it. Behind them, farther back where the light gives out, more of the same shuffle in a column, four more by the sound, close enough that the walls hum with it. The nearer two are ten paces off and closing, and the corridor is too narrow for them to pass each other.

Cellar corridor mouth · DT 1 · Stamina 17 · AD 25 · torch lit (UD 1) · two razorbacks ten paces out, four more behind them

## Turn 2
[PLAYER] PLAYER [2/9]: I cut at the first one in reach.
(roll on request: attack / Trade Blows)
[TOOLS]
$ python3 ledger.py move S --why "Trade Blows vs razorback 1"
MOVE Trade Blows vs razorback 1 · S+3 · - · [5,5]=13 → T3
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 2   (razorback claws 12-16 dmg 2, suffered at once; player script names no 10+ choice, ruled: max damage, logged)
LEDGER: took 2 (AD 25→23, Stamina 17→17, wounds 0→0)
[REF] The first razorback lunges the last pace and your sword meets it halfway. The blade goes in under the jaw and through the ridge of its neck, and the thing folds around the steel, still clawing. A hooked hand rakes your shield arm and skids off the armor with a shriek of metal before the corpse slides off the blade and drops across the corridor floor. Its bone spines click against the stone as it settles.

The second one comes over the body without breaking stride, jaws open and silent. Beyond it the column has stopped shuffling. Four sets of eyes shine in the dark, waiting their turn, and somewhere back there a dry rattle runs along the spines of the ones that are not yet in the light.

MOVE Trade Blows vs razorback 1 · S+3 · - · [5,5]=13 → T3
Cellar corridor mouth · DT 1 · Stamina 17 · AD 23 · torch lit (UD 1) · one razorback at your shield, four more behind it

## Turn 3
[PLAYER] PLAYER [3/9]: I hit the nearest one again.
[TOOLS]
$ python3 ledger.py move S --why "Trade Blows vs razorback 2"
MOVE Trade Blows vs razorback 2 · S+3 · - · [2,6]=11 → T3
STATUS Stamina 17 · AD 23 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 2   (razorback claws 12-16 dmg 2; same ruling, max damage chosen)
LEDGER: took 2 (AD 23→21, Stamina 17→17, wounds 0→0)
$ python3 engine/engine.py roll d6 --why "DT 1 length in rooms"
Ref: d6 [1]=1 · DT 1 length in rooms
[REF] You step in and put your weight behind it. The sword takes the second razorback across the chest, bone and rotten meat parting together, and it drops on top of the first with its jaw still working. Its claws got to your shield on the way down, a bright scrape and a jolt up to your elbow, but the armor holds.

The torchlight shows the column better now. Four more of them, shoulder to shoulder, the front two crowding the bodies. The nearest one stops to sniff at the dead, then climbs over them on all fours, spines rattling against the ceiling stones. Its head tilts at the torch behind you, and it licks its teeth. The last two hang back in the dark, but one of them is raising its arm toward you, the spines along its forearm lifting like a fan.

MOVE Trade Blows vs razorback 2 · S+3 · - · [2,6]=11 → T3
Cellar corridor mouth · DT 1 (rooms 1) · Stamina 17 · AD 21 · torch lit (UD 1) · four razorbacks left, one climbing the dead at your feet, one raising its spines
