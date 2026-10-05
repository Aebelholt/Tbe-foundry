## Turn 1
[PLAYER] PLAYER [1/17]: I plant myself in the corridor mouth with the torch behind me, and wait for the first one to come into reach.
(roll on request: none yet)
[TOOLS] python3 player.py S5 -> (above); python3 ledger.py status -> STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF] The torch hisses at your back and throws your shadow down the corridor, long and thin across wet flagstones. Something dry drags along the stone ahead, then stops, then drags again. Two shapes come out of the dark at the edge of the light, hunched, their spines standing up along their backs like rusted fence nails. They move in jerks, heads tilted as if listening to your breathing. Behind them the corridor is full of the same dry scraping, a column of it, farther back than the torchlight reaches. The nearer one lowers itself onto its knuckles, and the muscles in its legs coil.

Status: Cellar corridor mouth · DT 1 · Stamina 17 · wounds 0/10 · torch lit (UD 1) · two shapes at the edge of the light, the nearer crouched to spring.

## Turn 2
[PLAYER] PLAYER [2/17]: I cut at the first one in reach.
(roll on request: attack / Trade Blows)
[TOOLS] python3 ledger.py attack -> ATTACK attack · S+3 · - · [1,2]=6 → T1 DOOM · MISS
python3 engine/engine.py test 2 --why "undead #2 spine attack (unengaged), Move: Have it backfire" -> Ref: TEST · undead #2 spine attack (unengaged), Move: Have it backfire · +2 · [1,8]=11 → T1
[REF] The first one springs before your blade is fully up. You cut at the dark shape and the edge bites the corridor wall instead, stone shrieking against steel, your arm jarred to the shoulder and your guard hanging open. The thing lands in the mouth of the corridor close enough to smell, rot and old smoke, its claws opening. Behind it the second drops a spine from its back and flicks it at you. The barb snaps against the stone beside your head and clatters away, and the torch behind you gutters and steadies. The rest of the column has not stopped. More scraping, closer now.

Move: Have it backfire (unengaged: undead #2) · Ref: TEST · undead #2 spine attack (unengaged), Move: Have it backfire · +2 · [1,8]=11 → T1
Status: Cellar corridor mouth · DT 1 · Stamina 17 · wounds 0/10 · torch lit (UD 1) · one razorback on you, a second behind it with spines raised.

## Turn 3
[PLAYER] PLAYER [3/17]: I hit the nearest one again.
[TOOLS] python3 ledger.py attack -> ATTACK attack · S+3 · - · [10,3]=16 → T2 · HIT 7 dam
python3 engine/engine.py test 2 --why "undead #1 claws" -> Ref: TEST · undead #1 claws · +2 · [6,5]=13 → T2
python3 ledger.py take 3 -> LEDGER: took 3 (AD 25→22, Stamina 17→17, wounds 0→0)
[REF] Your blade comes back round and takes the razorback across the ribs. Something gives with a wet crack and the thing folds around the cut, grey ichor spilling down its flank, still coming. It rakes at you in answer, claws screeching across your armor and leaving bright scratches in the plates. You feel the weight of it through the straps. Behind it the second one shifts its weight from foot to foot, waiting for a gap to open, spines trembling. Farther back the column keeps shuffling forward, a patient dry sound in the dark.

Ref: TEST · undead #1 claws · +2 · [6,5]=13 → T2
Status: Cellar corridor mouth · DT 1 · Stamina 17 · AD 22 · wounds 0/10 · torch lit (UD 1) · the wounded razorback is still in your face.
