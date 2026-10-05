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
