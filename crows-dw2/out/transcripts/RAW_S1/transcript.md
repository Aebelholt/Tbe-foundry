## Turn 1
[PLAYER] PLAYER [1/7]: I hold the torch high and step in on the bear, sword out, and drive at it.
(roll on request: attack / Trade Blows with the bear, expertise only on a T1)
[TOOLS]
$ python3 engine/engine.py init
Ref: initiative d10=1 → enemies act first
$ python3 engine/engine.py test 2 --why "bear bite vs Mara R1"
Ref: TEST · bear bite vs Mara R1 · +2 · [8,3]=13 → T2
$ python3 engine/engine.py test 4 --why "wolf1 bite vs Mara R1 (+1 bite, +3 pack flank)"
Ref: TEST · wolf1 bite vs Mara R1 (+1 bite, +3 pack flank) · +4 · [6,1]=11 → T1
$ python3 engine/engine.py test 4 --why "wolf2 bite vs Mara R1 (+1 bite, +3 pack flank)"
Ref: TEST · wolf2 bite vs Mara R1 (+1 bite, +3 pack flank) · +4 · [8,9]=21 → T3
$ python3 ledger.py take 4
LEDGER: took 4 (AD 25→21, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 21 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 4
LEDGER: took 4 (AD 21→17, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 17 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py attack --b 1 --why "sword at bear, dim light bane"
ATTACK sword at bear, dim light bane · S+3 · b · [4,8]=13(incl -2) → T2 · HIT 7 dam
STATUS Stamina 17 · AD 17 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
The torch hisses as Mara lifts it, and the whole nave jerks toward the light. The bear gets there first, a brown wall of wet fur that crosses the flagstones faster than anything that size should, and its jaws close on her shield arm and shoulder with a crunch of leather and steel. The wolves come low and split, one down each side of her, so the door at her back is suddenly the only thing behind her. One wolf snaps at her thigh and finds only air. The other hits her flank and hangs on for a heartbeat, snarling through a mouthful of mail.

Mara drives forward anyway. Her sword cuts across the bear's chest and comes away dark. The animal bellows, rears, and a gout of blood patters over the carcass it was feeding on. It does not back off. It lowers its head, hackles up, hot breath fogging the torchlight.

Ref: initiative d10=1 → enemies act first · Ref: TEST · bear bite vs Mara R1 · +2 · [8,3]=13 → T2 · Ref: TEST · wolf1 bite vs Mara R1 (+1 bite, +3 pack flank) · +4 · [6,1]=11 → T1 · Ref: TEST · wolf2 bite vs Mara R1 (+1 bite, +3 pack flank) · +4 · [8,9]=21 → T3 · ATTACK sword at bear, dim light bane · S+3 · b · [4,8]=13(incl -2) → T2 · HIT 7 dam

Chapel nave · DT 3 · round 1 · Stamina 17 · wounds 0/10 · torch lit (dim) · the bear is on her, a wolf at each flank, the door at her back
