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

## Turn 4
[PLAYER] PLAYER [4/9]: I hit the nearest one again.
[TOOLS]
$ python3 ledger.py move S --why "Trade Blows vs razorback 3"
MOVE Trade Blows vs razorback 3 · S+3 · - · [2,4]=9 → T2
STATUS Stamina 17 · AD 21 · wounds 0/10 · uses Slashing 3 · UD torch 1
(7-9, player script names no cost; ruled: grant a fleeting opportunity. Razorback 3 takes 7 (10 to 3); claws 12-16 dmg 2 suffered at once)
$ python3 ledger.py take 2
LEDGER: took 2 (AD 21→19, Stamina 17→17, wounds 0→0)
$ python3 engine/engine.py test 2 --why "razorback 4 spine at Mara (fleeting opportunity)"
Ref: TEST · razorback 4 spine at Mara (fleeting opportunity) · +2 · [7,4]=13 → T2
(spine 12-16 = 1 dam)
$ python3 ledger.py take 1
LEDGER: took 1 (AD 19→18, Stamina 17→17, wounds 0→0)
[REF] The razorback climbs the heap and meets you at the corridor mouth. Your cut is hurried, the footing wrong on the slick bodies, and the blade bites deep into its shoulder but does not stop it. It hooks your shield rim and tugs, its breath cold and foul in your face. The claws skate off your armor again.

While it has you pinned and busy, the one behind it lets its spines fly. A tiny barbed splinter whips past the first one's ear and punches into your breastplate with a spiteful ping, catching in a seam of the plate. The wounded razorback pulls back a half step, shoulder hanging open and black, and the two at the rear shuffle up to take its place. The bodies at your feet make an uneven step, and you can feel it under your heel.

Ref: TEST · razorback 4 spine at Mara (fleeting opportunity) · +2 · [7,4]=13 → T2
Cellar corridor mouth · DT 1 (rooms 1) · Stamina 17 · AD 18 · torch lit (UD 1) · four razorbacks left, one badly cut, one with spines raised

## Turn 5
[PLAYER] PLAYER [6/9]: I keep cutting the nearest one.
[TOOLS]
$ python3 ledger.py move S --why "Trade Blows vs razorback 3 (wounded, 3 Stamina)"
MOVE Trade Blows vs razorback 3 (wounded, 3 Stamina) · S+3 · - · [5,4]=12 → T3
STATUS Stamina 17 · AD 18 · wounds 0/10 · uses Slashing 3 · UD torch 1
(10+, max damage ruled as before; the nearest foe is the fresh razorback 5 that stepped up, not the wounded one that withdrew; razorback 5 destroyed; claws 2 suffered)
$ python3 ledger.py take 2
LEDGER: took 2 (AD 18→16, Stamina 17→17, wounds 0→0)
(PROCEDURE NOTE: Ref called player.py a second time by mistake at this point, before writing the turn; it consumed script entry 7, "I keep cutting the nearest one", unread by the Ref. Next call returns entry 8.)
[REF] The new one comes in low and fast, skipping the stumbling climb over the dead. You meet it at the lip of the heap and the sword goes through its throat and out the back of its neck. It makes a sound like a bellows with a hole in it and falls apart across your boots, claws still raking your shield on the way down. They do no more than scrape paint off the plate.

That leaves three. The one you cut earlier hangs back in the dark with its shoulder gaping, still on its feet and watching you, spines low. Another waits a step behind it, its arm half raised. The last stands at the very edge of the light, head cocked at the torch, as if working out what it is.

MOVE Trade Blows vs razorback 3 (wounded, 3 Stamina) · S+3 · - · [5,4]=12 → T3
Cellar corridor mouth · DT 1 (rooms 1) · Stamina 17 · AD 16 · torch lit (UD 1) · three razorbacks left, one badly cut, one with spines half raised

## Turn 6
[PLAYER] PLAYER [8/9]: I keep cutting the nearest one.
[TOOLS]
$ python3 ledger.py move S --why "Trade Blows vs razorback 3 (3 Stamina)"
MOVE Trade Blows vs razorback 3 (3 Stamina) · S+3 · - · [6,2]=11 → T3
STATUS Stamina 17 · AD 16 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 2   (10+, max damage ruled as before; razorback 3 destroyed; claws 2 suffered)
LEDGER: took 2 (AD 16→14, Stamina 17→17, wounds 0→0)
[REF] The wounded one has not gone far, only a pace back into the shadow, and when you step to the lip of the heap it comes at you with its bad shoulder dragging. It swings anyway, a clumsy hooked blow that catches the edge of your shield and rings it like a bell. Your answer is shorter and surer. The sword takes it behind the jaw and it goes down in a loose pile, spines scraping on stone.

Two left. They do not rush. The one with the half-raised arm slides sideways along the wall and the other keeps to the center, and between them the corridor is a pair of low shapes and four pinpoints of reflected torchlight. A thin rattle runs along their backs, like a dry seed pod being shaken. The heap of the dead lies between you and them, and your torch behind you gutters once in a draught from somewhere down the cellar.

MOVE Trade Blows vs razorback 3 (3 Stamina) · S+3 · - · [6,2]=11 → T3
Cellar corridor mouth · DT 1 (rooms 1) · Stamina 17 · AD 14 · torch lit (UD 1) · two razorbacks left, spread along the corridor beyond the dead
