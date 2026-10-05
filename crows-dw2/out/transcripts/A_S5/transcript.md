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
