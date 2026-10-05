## Turn 1
[PLAYER] PLAYER [1/9]: I plant myself in the corridor mouth with the torch behind me, and wait for the first one to come into reach.
(roll on request: none yet)
[TOOLS]
$ python3 engine/engine.py roll d6 --why "DT 1 rooms"
Ref: d6 [5]=5 · DT 1 rooms
[REF] The torch hisses at your back and throws your shadow down the corridor like a spear. Beyond it the cellar stone sweats and the dark swallows the light a few paces out. Dry scraping comes toward you, claws dragging on flagstones, uneven and patient. Two shapes ease into the edge of the glow: gaunt, hunched things with ridges of bone-spine rising along their backs, jaws working on nothing. Behind them the scraping multiplies, four more sets of it, strung out in the black like beads on a cord. The first razorback lifts its head, sees the living warmth of you, and its spine bristles. The distance between you closes to a few strides.

Ref: d6 [5]=5 · DT 1 rooms
Cellar corridor mouth · DT 1 (rooms 5) · Stamina 17 · wounds 0/10 · torch lit, 1 UD · two razorbacks at the edge of the light, four more strung out behind them

## Turn 2
[PLAYER] PLAYER [2/9]: I cut at the first one in reach.
(roll on request: attack / Trade Blows)
[TOOLS]
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [7,3]=13 → T2 · HIT 7 dam
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "U1 claws"
Ref: TEST · U1 claws · +2 · [7,4]=13 → T2
$ python3 ledger.py take 3
LEDGER: took 3 (AD 25→22, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 22 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF] Your blade bites into the lead razorback's shoulder and a spray of grey, cold rot spatters the flagstones. It does not cry out. It simply lurches through the cut and rakes at you, claws scoring across your armor with a shriek of scraped metal. The blow rings through your arm, but nothing gets through to the skin. The wounded thing sags to one side, one arm hanging, the ridge of its spine twitching like a nest of knives. Its twin shuffles up at its shoulder, held back only by the narrowness of the stone. Further down the dark, the column keeps coming, the nearest of them close enough now that you can smell old earth and tallow.

ATTACK attack · S+3 · - · [7,3]=13 → T2 · HIT 7 dam / Ref: TEST · U1 claws · +2 · [7,4]=13 → T2 / LEDGER: took 3 (AD 25→22, Stamina 17→17, wounds 0→0)
Cellar corridor mouth · DT 1 (rooms 5) · Stamina 17 · wounds 0/10 · torch lit, 1 UD · the wounded razorback is still on you, the second at its shoulder

## Turn 3
[PLAYER] PLAYER [3/9]: I hit the nearest one again.
[TOOLS]
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [8,8]=19 → T3 · HIT 10 dam
STATUS Stamina 17 · AD 22 · wounds 0/10 · uses Slashing 3 · UD torch 1
(no foe attack rolled: the engaged foe, U1 at 3 Stamina, was destroyed by the 10 dam hit)
[REF] The second blow lands clean, a hard downward chop through the wounded razorback's neck and into the ridge of bone along its back. It comes apart like wet kindling, the pieces clattering across the stone and going still. The torchlight flickers across the spot where it fell. Its twin does not pause. It steps over the wreckage, spine bristling, and the dead air between you narrows to the length of a blade. Behind it the other four shapes have slowed and bunched in the corridor's throat, shoving for room, their claws scraping the walls. One of them lifts its head and the spines along its back shiver.

ATTACK attack · S+3 · - · [8,8]=19 → T3 · HIT 10 dam
Cellar corridor mouth · DT 1 (rooms 5) · Stamina 17 · wounds 0/10 · torch lit, 1 UD · one razorback down, the next stepping into your reach

## Turn 4
[PLAYER] PLAYER [4/9]: I hit the nearest one again.
[TOOLS]
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [3,8]=14 → T2 · HIT 7 dam
STATUS Stamina 17 · AD 22 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "U2 claws"
Ref: TEST · U2 claws · +2 · [2,5]=9 → T1
[REF] Your edge opens the second razorback from hip to ribs and it staggers, grey ichor pooling at its feet. Its answering swipe goes wide, claws screeching off the wall beside your head and showering you with grit. It is hurt badly, one leg buckling, but the thing still drives forward, jaw gaping, a dry rasp coming from somewhere deep in its chest. Over its shoulder the column has begun to spread. One of the far ones crouches, the spines on its back flaring, and you realize the bone ridges are aimed straight at you.

ATTACK attack · S+3 · - · [3,8]=14 → T2 · HIT 7 dam / Ref: TEST · U2 claws · +2 · [2,5]=9 → T1
Cellar corridor mouth · DT 1 (rooms 5) · Stamina 17 · wounds 0/10 · torch lit, 1 UD · the second razorback reels but holds, a spined one crouching behind it

## Turn 5
[PLAYER] PLAYER [6/9]: I keep cutting the nearest one.
[TOOLS]
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [1,2]=6 → T1 DOOM · MISS
STATUS Stamina 17 · AD 22 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "U2 claws"
Ref: TEST · U2 claws · +2 · [7,1]=10 → T1
$ python3 engine/engine.py test 2 --why "U3 spine"
Ref: TEST · U3 spine · +2 · [1,2]=5 → T1 DOOM
$ python3 engine/engine.py test 2 --why "U4 spine"
Ref: TEST · U4 spine · +2 · [2,5]=9 → T1
[REF] Your swing goes wrong. Your boot skids on the slick of grey ichor and the blade bites nothing but air, dragging you half a step off the mouth of the corridor and out of your set stance. The wounded razorback lunges into the gap and rakes at you, but its claws slap short of your chest. Spines whistle out of the dark behind it, one clipping the stone by your ear, another skittering off your pauldron with a flat tick and falling away. Neither finds flesh. Your torch gutters at your back, and the shadow of the thing in front of you leaps tall across the wall, claws spread. The two spined ones at the rear are crouched and ready to loose again.

Ref: TEST · U2 claws · +2 · [7,1]=10 → T1 / Ref: TEST · U3 spine · +2 · [1,2]=5 → T1 DOOM / Ref: TEST · U4 spine · +2 · [2,5]=9 → T1
Cellar corridor mouth · DT 1 (rooms 5) · Stamina 17 · wounds 0/10 · torch lit, 1 UD · the wounded razorback is in your face, spines coming from the dark

## Turn 6
[PLAYER] PLAYER [7/9]: I keep cutting the nearest one.
[TOOLS]
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [2,5]=10 → T1 · MISS
STATUS Stamina 17 · AD 22 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "U2 claws"
Ref: TEST · U2 claws · +2 · [7,1]=10 → T1
$ python3 engine/engine.py test 2 --why "U3 spine"
Ref: TEST · U3 spine · +2 · [6,2]=10 → T1
$ python3 engine/engine.py test 2 --why "U5 spine"
Ref: TEST · U5 spine · +2 · [6,9]=17 → T3
$ python3 ledger.py take 3
LEDGER: took 3 (AD 22→19, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 19 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF] The razorback ducks under your stroke and your edge only scrapes the wall. It claws back, and again the swipe finds nothing but empty air. Then a spine hisses out of the dark and slams into your chest plate with a bright crack, hard enough to punch the wind from you and rattle the metal. It does not pierce, but the dent is deep and you feel the shock to the bone. Another spine sings past your cheek. The column behind has spread along the corridor now, three of them in a loose fan, bone ridges flared, all of them aimed at the one warm thing in the light. The wounded one in front of you drools grey and keeps coming.

Ref: TEST · U2 claws · +2 · [7,1]=10 → T1 / Ref: TEST · U3 spine · +2 · [6,2]=10 → T1 / Ref: TEST · U5 spine · +2 · [6,9]=17 → T3
ATTACK attack · S+3 · - · [2,5]=10 → T1 · MISS / LEDGER: took 3 (AD 22→19, Stamina 17→17, wounds 0→0)
Cellar corridor mouth · DT 1 (rooms 5) · Stamina 17 · wounds 0/10 · torch lit, 1 UD · the wounded razorback crowds you, spines flaring from the dark

## Turn 7
[PLAYER] PLAYER [8/9]: I keep cutting the nearest one.
[TOOLS]
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [7,4]=14 → T2 · HIT 7 dam
STATUS Stamina 17 · AD 19 · wounds 0/10 · uses Slashing 3 · UD torch 1
(no foe attack rolled: the engaged foe, U2 at 3 Stamina, was destroyed by the 7 dam hit)
[REF] This time the blade finds the gap beneath the razorback's ribs and rips upward. The thing folds around the steel, claws scrabbling once at your vambrace, then slides off the edge and collapses across its fellow's remains. For a breath the corridor mouth is clear. The torch pops behind you and light spills out over two heaps of ruined bone. Four shapes remain, close now, picking their way over the stone with spines raised and heads low, no longer bunched, no longer hesitating. The nearest is only a few strides away. It opens its jaws and the dry click of its teeth carries down the cellar.

ATTACK attack · S+3 · - · [7,4]=14 → T2 · HIT 7 dam
Cellar corridor mouth · DT 1 (rooms 5) · Stamina 17 · wounds 0/10 · torch lit, 1 UD · four razorbacks left, advancing over the dead

## Turn 8
[PLAYER] PLAYER [9/9]: I finish the last of them and breathe.
[TOOLS]
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [5,2]=10 → T1 · MISS
STATUS Stamina 17 · AD 19 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "U3 claws"
Ref: TEST · U3 claws · +2 · [10,7]=19 → T3
$ python3 engine/engine.py test 2 --why "U4 spine"
Ref: TEST · U4 spine · +2 · [6,5]=13 → T2
$ python3 ledger.py take 4
LEDGER: took 4 (AD 19→15, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 15 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 2
LEDGER: took 2 (AD 15→13, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 13 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF] You swing for the finish, but the next razorback is not the weakened thing you cut down. It rolls inside the arc, and your blade clangs off the stone. Its claws come back hard across your breastplate, tearing a bright seam in the metal, and a second spine lands a moment later with a dull thump against your ribs, rattling you. Nothing has broken through, but the armor is chewed and ringing now. And you cannot finish the last of them, because there are still four, ragged and low, their dry jaws clicking as they fan out over the bone-heap. The nearest is close enough that its breath stinks of old earth.

ATTACK attack · S+3 · - · [5,2]=10 → T1 · MISS / Ref: TEST · U3 claws · +2 · [10,7]=19 → T3 / Ref: TEST · U4 spine · +2 · [6,5]=13 → T2 / LEDGER: took 4 then 2 (AD 19→13, Stamina 17→17, wounds 0→0)
Cellar corridor mouth · DT 1 (rooms 5) · Stamina 17 · wounds 0/10 · torch lit, 1 UD · four razorbacks left, one on you, the rest fanned behind

(player.py after Turn 8 returned PLAYER [9/9] again, the same line as Turn 8: script exhausted, no new action. Stopped.)
DONE
8 turns run (script ended at its final line; 4 of 6 undead still live, Mara alive).
