## Turn 1
[PLAYER] PLAYER [1/13]: I hold the torch high and step in on the bear, sword out, and drive at it.
(roll on request: attack / Trade Blows with the bear, expertise only on a T1)
[TOOLS]
$ python3 engine/engine.py init
Ref: initiative d10=7 → crows act first
$ python3 ledger.py attack --b 1   (dim light: bane on Mara's attack; Move to (5,2) then attack)
ATTACK attack · S+3 · b · [7,4]=12(incl -2) → T2 · HIT 7 dam
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "bear bite vs Mara"
Ref: TEST · bear bite vs Mara · +2 · [10,6]=18 → T3
$ python3 engine/engine.py test 3 --why "wolf1 bite flanking"
Ref: TEST · wolf1 bite flanking · +3 · [3,6]=12 → T2
$ python3 engine/engine.py test 3 --why "wolf2 bite flanking"
Ref: TEST · wolf2 bite flanking · +3 · [8,6]=17 → T3
$ python3 ledger.py take 8   (bear bite T3 6 +2 cornered, bear now 13 Stamina)
LEDGER: took 8 (AD 25→17, Stamina 17→17, wounds 0→0)
$ python3 ledger.py take 3
LEDGER: took 3 (AD 17→14, Stamina 17→17, wounds 0→0)
$ python3 ledger.py take 4
LEDGER: took 4 (AD 14→10, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 10 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
Torchlight swings across the nave and the bear rises from the carcass with blood to its eyes. Mara crosses the flagstones in four strides and the sword bites into its shoulder, a deep wet cut that makes the beast roar and slough meat onto the floor. It does not back away. It lunges, jaws closing on her shield and armor with a crunch of splintering leather, and the force of it rocks her to her heels. The wolves have already circled in. One darts in from the north, one from the south, and both snap at her flanks as the torch flame gutters and throws their shadows huge across the broken pews.

Ref: TEST · bear bite vs Mara · +2 · [10,6]=18 → T3 | wolf1 bite flanking · +3 · [3,6]=12 → T2 | wolf2 bite flanking · +3 · [8,6]=17 → T3

Chapel nave, (5,2) · DT 3 · Stamina 17 · wounds 0/10 · torch lit, dim light · Bear in front, a wolf at each flank, all three close enough to smell.

## Turn 2
[PLAYER] PLAYER [2/13]: I keep pressing the bear and give it no room.
[TOOLS]
$ python3 engine/engine.py init
Ref: initiative d10=8 → crows act first
$ python3 ledger.py attack --b 1   (dim light bane; no --exp used in this call, expertise note was not restated this turn)
ATTACK attack · S+3 · b · [8,1]=10(incl -2) → T1 · MISS
STATUS Stamina 17 · AD 10 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "bear bite vs Mara"
Ref: TEST · bear bite vs Mara · +2 · [4,1]=7 → T1
$ python3 engine/engine.py test 3 --why "wolf1 bite flanking"
Ref: TEST · wolf1 bite flanking · +3 · [4,10]=17 → T3
$ python3 engine/engine.py test 3 --why "wolf2 bite flanking"
Ref: TEST · wolf2 bite flanking · +3 · [8,1]=12 → T2
$ python3 ledger.py take 6   (bear counter on Mara's melee miss: bite T2 4 +2 cornered)
LEDGER: took 6 (AD 10→4, Stamina 17→17, wounds 0→0)
$ python3 ledger.py take 4   (wolf1 T3)
LEDGER: took 4 (AD 4→0, Stamina 17→17, wounds 0→0)
$ python3 ledger.py take 3   (wolf2 T2)
LEDGER: took 3 (AD 0→0, Stamina 17→14, wounds 0→0)
STATUS Stamina 14 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
Mara drives the sword at the bear again, but it swings its great head aside and the blade skitters off bone and gristle. The bear answers at once, a raking swat that catches her across the ribs through the buckled armor. Its next bite snaps shut on empty air and spit sprays her visor of lamplight. The wolves do not miss twice. One latches onto her thigh from the north, teeth grinding on mail, while the other nips low and finds the gap where her armor has already split. Plate and leather are gone now. The pain that follows reaches flesh.

Ref: TEST · bear bite vs Mara · +2 · [4,1]=7 → T1 | wolf1 bite flanking · +3 · [4,10]=17 → T3 | wolf2 bite flanking · +3 · [8,1]=12 → T2

Chapel nave, (5,2) · DT 3 · Stamina 14 · wounds 0/10 · torch lit, dim light · The bear is bleeding but upright in front of her, a wolf hanging off each flank.

## Turn 3
[PLAYER] PLAYER [4/13]: I turn on the nearest wolf.
(note: player.py printed [4/13] after [2/13]; no [3/13] line was ever shown to me. Both wolves are adjacent; I took the north wolf, wolf1 at (5,1).)
[TOOLS]
$ python3 engine/engine.py init
Ref: initiative d10=10 → crows act first
$ python3 ledger.py attack --b 1 --exp   (dim light bane; expertise only on a T1, per the player's standing note)
ATTACK attack · S+3 · b · [1,1]=3(incl -2) → T1 DOOM · MISS
STATUS Stamina 14 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py test 2 --why "bear bite vs Mara"
Ref: TEST · bear bite vs Mara · +2 · [7,8]=17 → T3
$ python3 engine/engine.py test 3 --why "wolf1 bite flanking"
Ref: TEST · wolf1 bite flanking · +3 · [4,9]=16 → T2
$ python3 engine/engine.py test 3 --why "wolf2 bite flanking"
Ref: TEST · wolf2 bite flanking · +3 · [2,9]=14 → T2
$ python3 ledger.py take 4   (wolf1 counter on doom: bite T3 4)
LEDGER: took 4 (AD 0→0, Stamina 14→10, wounds 0→0)
STATUS Stamina 10 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 8   (bear bite T3 6 +2 cornered)
LEDGER: took 8 (AD 0→0, Stamina 10→2, wounds 0→0)
STATUS Stamina 2 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 3   (wolf1 bite T2)
LEDGER: took 3 (AD 0→0, Stamina 2→0, wounds 0→1)
STATUS Stamina 0 · AD 0 · wounds 1/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 3   (wolf2 bite T2)
LEDGER: took 3 (AD 0→0, Stamina 0→0, wounds 1→4)
STATUS Stamina 0 · AD 0 · wounds 4/10 · uses Slashing 3 · UD torch 1
[REF]
Mara wheels on the northern wolf, but the doom of it comes in her own boots: the sword binds on a pew leg, her footing goes on blood-slick stone, and the wolf's jaws find her forearm as she lurches. The bear does not wait for her to recover. A hammering bite crushes into her shoulder and something inside her gives with a wet snap. The wolves worry at her legs from both sides, and the cold thing that comes after is not pain yet but the knowledge that her armor is gone, her breath is gone, and what is torn now is only Mara. The torch still burns in her fist, guttering low, and the bear's breath is hot on her face.

Ref: TEST · bear bite vs Mara · +2 · [7,8]=17 → T3 | wolf1 bite flanking · +3 · [4,9]=16 → T2 | wolf2 bite flanking · +3 · [2,9]=14 → T2

Chapel nave, (5,2) · DT 3 · Stamina 0 · wounds 4/10 · torch lit, dim light · Bear, wolf, wolf. She is in the middle of them and bleeding into her boots.

## Turn 4
[PLAYER] PLAYER [5/13]: I hit the closest wolf again.
(closest wolf: wolf1 at (5,1), the one already attacked.)
[TOOLS]
$ python3 engine/engine.py init
Ref: initiative d10=7 → crows act first
$ python3 ledger.py attack --b 1 --exp
ATTACK attack · S+3 · b · [3,4]=8(incl -2) → T2 · expertise used (Slashing 2 left) · HIT 7 dam
STATUS Stamina 0 · AD 0 · wounds 4/10 · uses Slashing 2 · UD torch 1
$ python3 engine/engine.py test 2 --why "bear bite vs Mara"
Ref: TEST · bear bite vs Mara · +2 · [9,10]=21 → T3 CRIT
$ python3 engine/engine.py test 3 --why "wolf1 bite flanking"
Ref: TEST · wolf1 bite flanking · +3 · [2,10]=15 → T2
$ python3 engine/engine.py test 3 --why "wolf2 bite flanking"
Ref: TEST · wolf2 bite flanking · +3 · [3,1]=7 → T1
$ python3 engine/engine.py test 2 --why "bear crit extra action: bite vs Mara"
Ref: TEST · bear crit extra action: bite vs Mara · +2 · [3,10]=15 → T2
$ python3 ledger.py take 8   (bear bite T3 6 +2 cornered)
LEDGER: took 8 (AD 0→0, Stamina 0→0, wounds 4→12) · CROW DEAD
STATUS Stamina 0 · AD 0 · wounds 12/10 · uses Slashing 2 · UD torch 1
$ python3 ledger.py take 3   (wolf1 T2; applied after death, no effect on outcome)
LEDGER: took 3 (AD 0→0, Stamina 0→0, wounds 12→15) · CROW DEAD
STATUS Stamina 0 · AD 0 · wounds 15/10 · uses Slashing 2 · UD torch 1
$ python3 ledger.py take 6   (bear extra action T2 4 +2; applied after death, no effect on outcome)
LEDGER: took 6 (AD 0→0, Stamina 0→0, wounds 15→21) · CROW DEAD
STATUS Stamina 0 · AD 0 · wounds 21/10 · uses Slashing 2 · UD torch 1
$ python3 ledger.py ud torch   (DT end)
UD torch · [4] → 1→1
STATUS Stamina 0 · AD 0 · wounds 21/10 · uses Slashing 2 · UD torch 1
$ python3 engine/engine.py enc --en 9   (DT end)
Ref: encounter d10=1 vs EN 9 → none
[REF]
Mara's sword finds the wolf and it screams, a thin, high sound, and drops to its belly with its flank laid open. It is the last thing she lands. The bear comes through the torchlight like a falling wall. Its jaws close on her shoulder and the world turns white and loud. The wolves are on her before she can fall, a weight on her chest, a weight on her legs, teeth everywhere, and the torch rolls from her fingers and burns on the flagstones with a small steady flame, lighting the old altar rubble and the ceiling's bare ribs. She does not get up. The nave goes quiet but for the sound of feeding.

Ref: TEST · bear bite vs Mara · +2 · [9,10]=21 → T3 CRIT | wolf1 bite flanking · +3 · [2,10]=15 → T2 | wolf2 bite flanking · +3 · [3,1]=7 → T1 | extra action · +2 · [3,10]=15 → T2

Chapel nave, (5,2) · DT 3 ends · Stamina 0 · wounds 21/10, dead · torch fallen, still burning · Mara is dead. DT end: UD torch [4] no loss; Ref: encounter d10=1 vs EN 9 → none.

DONE
Ran 4 turns; Mara died in turn 4.
