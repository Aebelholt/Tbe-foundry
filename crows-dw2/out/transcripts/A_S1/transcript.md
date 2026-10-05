## Turn 1
[PLAYER] PLAYER [1/7]: I hold the torch high and step in on the bear, sword out, and drive at it.
(roll on request: attack / Trade Blows with the bear, expertise only on a T1)
[TOOLS]
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [10,10]=23 → T3 CRIT · HIT 10 dam
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "bear bite vs Mara"
Ref: TEST · bear bite vs Mara · +2 · [6,9]=17 → T3
$ python3 ledger.py take 8   (bite 17+ = 6 dam, +2 Dangerous When Cornered since bear now at 10)
LEDGER: took 8 (AD 25→17, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 17 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py attack   (crit extra exchange)
ATTACK attack · S+3 · - · [9,2]=14 → T2 · HIT 7 dam
STATUS Stamina 17 · AD 17 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "bear bite vs Mara"
Ref: TEST · bear bite vs Mara · +2 · [3,10]=15 → T2
$ python3 ledger.py take 7   (bite 12-16 = 4 dam, +1, +2 cornered)
LEDGER: took 7 (AD 17→10, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 10 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
The torch hisses and throws her shadow long across the nave as Mara closes the gap. The bear rears off the carcass and she cuts it across the shoulder, a deep, heavy stroke that splits hide and meat. It roars, blood spattering the flagstones. Her second cut lands too, but shallower, and the bear is already on her, jaws snapping at her shield arm and then again at her ribs. Armor rings and buckles under the teeth. The beast sways, ropes of red running from its chest, its roar gone ragged and wet. Beyond it the two wolves have dropped their heads and come off the carcass, hackles up, stalking wide along the pews.

Ref: TEST · bear bite vs Mara · +2 · [6,9]=17 → T3 | Ref: TEST · bear bite vs Mara · +2 · [3,10]=15 → T2

Nave · DT 3 · Stamina 17 · wounds 0/10 · torch lit · the bear is in her face, bleeding, and the wolves are circling in.
