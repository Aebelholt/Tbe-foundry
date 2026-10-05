## Turn 1
[PLAYER] PLAYER [1/9]: I plant myself in the corridor mouth with the torch behind me, and wait for the first one to come into reach.
[TOOLS] (none)
[REF] The torch hisses at your back and throws your shadow down the corridor ahead of you. Dust sifts from the ceiling with every dragging step. Two shapes come out of the dark first, medium-sized, hunched, ribs showing through grey skin, and along their spines run ridges of bone that click against the low stones as they lurch. They do not hurry. Behind them, further down the throat of the corridor, the torchlight gives out and more of that clicking carries, four more by the sound, strung out in a column. The nearer one lifts its head toward the warmth of the flame and its claws scrape a long line in the wall. It is three paces from you and closing.

Torch UD 1 · Cellar corridor mouth · Stamina 17 · wounds 0/10 · torch lit · the first razorback is three paces off, its claws rising

## Turn 2
[PLAYER] PLAYER [2/9]: I cut at the first one in reach.
[TOOLS]
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [4,4]=11 → T1 · MISS
$ python3 engine/engine.py test 2 --why "A1 claws (engaged)"
Ref: TEST · A1 claws (engaged) · +2 · [2,5]=9 → T1
$ python3 engine/engine.py test 2 --why "A2 claws (move: unengaged)"
Ref: TEST · A2 claws (move: unengaged) · +2 · [5,5]=12 → T2
$ python3 engine/engine.py test 2 --why "A3 spine (move: unengaged)"
Ref: TEST · A3 spine (move: unengaged) · +2 · [7,10]=19 → T3
$ python3 ledger.py take 3
LEDGER: took 3 (AD 25→22, Stamina 17→17, wounds 0→0)
$ python3 ledger.py take 3
LEDGER: took 3 (AD 22→19, Stamina 17→17, wounds 0→0)
[REF] Your blade skids off a shoulder knob of bone and the first razorback does not even flinch. The second one gathers itself and leaps, a clumsy, ugly bound that lands it beside its fellow with claws raking across your arm. Down the column, a ridge of spine flexes and a sliver of bone whips out of the dark and hammers into your ribs. Both blows ring off your armor and leave you sore, nothing worse. The two of them crowd the mouth of the corridor now, shoulder to shoulder, jaws working, and the torch flame bends toward them as if it wanted to leave you.

Ledger: ATTACK attack · S+3 · - · [4,4]=11 → T1 · MISS | Move: Escalate the situation | Ref: TEST A1 claws +2 [2,5]=9 → T1; A2 claws +2 [5,5]=12 → T2; A3 spine +2 [7,10]=19 → T3 | Ledger: took 3, took 3 (AD 19)

Cellar corridor mouth · Stamina 17 · AD 19 · wounds 0/10 · torch lit · two razorbacks pressing at the mouth, more spines flexing behind them

## Turn 3
[PLAYER] PLAYER [3/9]: I hit the nearest one again.
[TOOLS]
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [6,2]=11 → T1 · MISS
$ python3 engine/engine.py test 2 --why "A1 claws (engaged)"
Ref: TEST · A1 claws (engaged) · +2 · [2,10]=14 → T2
$ python3 engine/engine.py test 2 --why "A2 claws (move)"
Ref: TEST · A2 claws (move) · +2 · [10,2]=14 → T2
$ python3 engine/engine.py test 2 --why "A4 spine (move)"
Ref: TEST · A4 spine (move) · +2 · [4,7]=13 → T2
$ python3 ledger.py take 3  -> AD 19→16
$ python3 ledger.py take 3  -> AD 16→13
$ python3 ledger.py take 2  -> AD 13→11
[REF] You swing again and the nearest razorback simply leans into it, taking the blade on bone and shoving forward. Its claws drag down your guard, and its fellow hooks in from the side while a spine thumps against your armor from over their shoulders. The pressure drives you back a pace, off the lip of the corridor mouth and into the torchlit space behind it, where the flame gutters on the stone beside you. The ground you meant to hold is theirs now. The pair of them step into it, heads turning toward the torch, and the column behind them shuffles forward to fill the gap.

Ledger: ATTACK attack · S+3 · - · [6,2]=11 → T1 · MISS | Move: Require a cost or opportunity | Ref: TEST A1 claws +2 [2,10]=14 → T2; A2 claws +2 [10,2]=14 → T2; A4 spine +2 [4,7]=13 → T2 | Ledger: took 3, 3, 2 (AD 11)

Cellar, behind the corridor mouth · Stamina 17 · AD 11 · wounds 0/10 · torch lit · two razorbacks in your face and the others pouring in after them

## Turn 4
[PLAYER] PLAYER [4/9]: I hit the nearest one again.
[TOOLS]
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [9,10]=22 → T3 CRIT · HIT 10 dam
(A1 Stamina 10 -> 0, destroyed; no counterattack from a dead foe. Crit grants an extra exchange.)
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [5,2]=10 → T1 · MISS
$ python3 engine/engine.py test 2 --why "A2 claws (engaged)"
Ref: TEST · A2 claws (engaged) · +2 · [1,3]=6 → T1
$ python3 engine/engine.py test 2 --why "A3 claws (move)"
Ref: TEST · A3 claws (move) · +2 · [8,7]=17 → T3
$ python3 engine/engine.py test 2 --why "A5 spine (move)"
Ref: TEST · A5 spine (move) · +2 · [10,5]=17 → T3
$ python3 ledger.py take 4  -> AD 11→7
$ python3 ledger.py take 3  -> AD 7→4
[REF] The blade comes round clean and takes the nearest razorback through the neck and into the spine. It folds, drops, and does not rise. You have a breath, and you spend it on a second swing at the one beside it, but your feet are wrong on the stone and the cut goes wide. The next two take the opening. A set of claws opens the armor across your flank and a spine comes whistling out of the column to punch into your shoulder. The leather there hangs in strips. Three left alive are crowding through the gap where the first one fell, one already at your elbow, and the torchlight catches wet teeth.

Ledger: ATTACK [9,10]=22 → T3 CRIT · HIT 10 dam; extra exchange ATTACK [5,2]=10 → T1 · MISS | Move: Take something away | Ref: TEST A2 claws +2 [1,3]=6 → T1; A3 claws +2 [8,7]=17 → T3; A5 spine +2 [10,5]=17 → T3 | Ledger: took 4, 3 (AD 4)

Cellar, behind the corridor mouth · Stamina 17 · AD 4 · wounds 0/10 · torch lit · one dead, five more coming, one at your elbow

## Turn 5
[PLAYER] PLAYER [6/9]: I keep cutting the nearest one.
[TOOLS]
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [8,9]=20 → T3 · HIT 10 dam
(A2 Stamina 10 -> 0, destroyed; no counterattack from a dead foe. Scene line: A3 10/10 engaged close; A4 10/10 unengaged near; A5 10/10 unengaged far; A6 10/10 unengaged far. Correction to Turn 4 prose: four razorbacks live after A1 and A2... see scene line; A1 dead, A2 now dead, four live.)
[REF] You step in under the clawing arm and put the whole weight of your shoulder behind the cut. The blade bites through the razorback's collarbone and keeps going, and the thing comes apart across your boots in a clatter of bone and dry meat. Four are left. The nearest, still wearing a scrap of a soldier's cloak, steps over the wreck without looking at it and rakes at your shoulder. The rest shuffle in behind it, spines lifting in a ripple down the column. Your sleeve is soaked with sweat inside what is left of your armor, and the torch hisses as someone's shadow falls across it.

Ledger: ATTACK attack · S+3 · - · [8,9]=20 → T3 · HIT 10 dam

Cellar, behind the corridor mouth · Stamina 17 · AD 4 · wounds 0/10 · torch lit · four left, the cloaked one raking at your shoulder

## Turn 6
[PLAYER] PLAYER [7/9]: I keep cutting the nearest one.
[TOOLS]
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [8,10]=21 → T3 · HIT 10 dam
(A3 Stamina 10 -> 0, destroyed; no counterattack from a dead foe. Scene line: A4 10/10 unengaged near; A5 10/10 unengaged far; A6 10/10 unengaged far.)
[REF] The cloaked one lunges and you cut it down at the knee, then through the neck as it drops, and the cloak goes up in a flap of dust. Three left. They have stopped shuffling. The nearest of them crouches at the edge of the torchlight, bone ridges flaring along its back, and the other two spread to either side of the corridor mouth, low and wary, spines pointed at you. They are no longer coming in a line. One of them lets out a dry rattle of a breath, and the sound runs back down the corridor and does not come back.

Ledger: ATTACK attack · S+3 · - · [8,10]=21 → T3 · HIT 10 dam

Cellar, behind the corridor mouth · Stamina 17 · AD 4 · wounds 0/10 · torch lit · three left, fanning out around you, the nearest crouched to spring

## Turn 7
[PLAYER] PLAYER [8/9]: I keep cutting the nearest one.
[TOOLS]
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [5,8]=16 → T2 · HIT 7 dam
(A4 moved to engaged close, Stamina 10 -> 3.)
$ python3 engine/engine.py test 2 --why "A4 claws (engaged)"
Ref: TEST · A4 claws (engaged) · +2 · [8,2]=12 → T2
$ python3 ledger.py take 3  -> AD 4→1
[REF] The nearest springs and you meet it halfway, the blade carving a deep gash across its chest and rattling ribs. It does not stop. It slams into you, and its claws open the last of the leather across your side, so that you feel cold air on skin where the armor was. It is hurt, listing, one arm dragging, but the other two have edged close enough that the torchlight shows their eyes, two dull points each, fixed on the flame behind you. Your arm aches to the elbow with every swing now.

Ledger: ATTACK attack · S+3 · - · [5,8]=16 → T2 · HIT 7 dam | Ref: TEST A4 claws +2 [8,2]=12 → T2 | Ledger: took 3 (AD 1)

Cellar, behind the corridor mouth · Stamina 17 · AD 1 · wounds 0/10 · torch lit · the wounded razorback still clawing at you, two more closing behind it
