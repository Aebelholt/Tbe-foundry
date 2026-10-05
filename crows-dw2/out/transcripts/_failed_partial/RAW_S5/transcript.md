## Turn 1
[PLAYER] PLAYER [1/9]: I plant myself in the corridor mouth with the torch behind me, and wait for the first one to come into reach.
(roll on request: none yet)
[TOOLS]
- `python3 engine/engine.py init` → Ref: initiative d10=10 → crows act first
- (Mara readies; first undead to enter reach triggers her attack) `python3 ledger.py attack` → ATTACK attack · S+3 · - · [7,1]=11 → T1 · MISS / STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
- Ref: TEST · claws U1 (3,0) · +2 · [6,2]=10 → T1
- Ref: TEST · claws U2 (3,1) · +2 · [7,9]=18 → T3
- Ref: TEST · spine U3 (4,0) · +2 · [8,2]=12 → T2
- Ref: TEST · spine U4 (4,1) · +2 · [7,7]=16 → T2
- Ref: TEST · spine U5 (5,0) · +2 · [3,2]=7 → T1
- Ref: TEST · spine U6 (5,1) · +2 · [4,6]=12 → T2
- (counter 2 dam on melee miss + claws T3 4 + spines 1+1+1 = 9) `python3 ledger.py take 9` → LEDGER: took 9 (AD 25→16, Stamina 17→17, wounds 0→0) / STATUS Stamina 17 · AD 16 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
The first of them comes out of the dark at a dead run, all knuckled spine and hanging jaw, and Mara's swing catches nothing but the wall's shadow. It rakes back across her guard, hooking the leather. Its twin slams in beside it and tears a long furrow down her armor. Behind them the corridor fills with a dry clicking, and thin barbs whip out of the gloom, two, three, rattling off her shoulder and ribs. The torch at her back gutters in the draught, throwing her shadow long down the passage, over six pale shapes that don't stop to breathe.

Ref: initiative d10=10 → crows act first (round 1); undead attacks as rolled above, 9 damage total.

Cellar corridor, round 1 · DT n/a · Stamina 17 · wounds 0/10 · AD 16 · torch lit · two claws at your throat, four more crowding the passage behind them.

## Turn 2
[PLAYER] PLAYER [2/9]: I cut at the first one in reach.
(roll on request: attack / Trade Blows)
[TOOLS]
- `python3 engine/engine.py init` → Ref: initiative d10=1 → enemies act first
- `python3 ledger.py attack` → ATTACK attack · S+3 · - · [10,10]=23 → T3 CRIT · HIT 10 dam / STATUS Stamina 17 · AD 16 · wounds 0/10 · uses Slashing 3 · UD torch 1
- Ref: TEST · claws U1 (3,0) · +2 · [3,9]=14 → T2
- Ref: TEST · claws U2 (3,1) · +2 · [7,4]=13 → T2
- Ref: TEST · claws U3 leaped to (2,1) · +2 · [1,1]=4 → T1 DOOM
- Ref: TEST · spine U4 (4,0) · +2 · [6,5]=13 → T2
- Ref: TEST · spine U5 (5,0) · +2 · [6,6]=14 → T2
- Ref: TEST · spine U6 (5,1) · +2 · [7,5]=14 → T2
- (claws 2+2, spines 1+1+1 = 7; U3 doom miss, Mara counters at her T3 dmg 10 per ledger row) `python3 ledger.py take 7` → LEDGER: took 7 (AD 16→9, Stamina 17→17, wounds 0→0) / STATUS Stamina 17 · AD 9 · wounds 0/10 · uses Slashing 3 · UD torch 1
- (crit extra action) `python3 ledger.py attack` → ATTACK attack · S+3 · - · [5,6]=14 → T2 · HIT 7 dam / STATUS Stamina 17 · AD 9 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
They hit her first. Claws rake the leather twice, and the barbs from the dark patter in after them. One creature bounds clean over its fellows and comes down at her hip, jaw wide, and its claws go wild, skidding off the wall. Mara's blade is already moving. Her counter takes it through the ribs and it folds, breaking apart like wet kindling. Then her own cut lands on the first in reach, a crack of dead bone, and that one is simply gone. The second blow she throws on the follow-through bites deep into its twin's shoulder and the thing reels, hanging by a strip of tendon, still clicking.

Ref: initiative d10=1 → enemies act first (round 2); two razorbacks destroyed, one at death's edge.

Cellar corridor, round 2 · DT n/a · Stamina 17 · wounds 0/10 · AD 9 · torch lit · a crippled one at (3,1), three more coming down the dark behind it.

## Turn 3
[PLAYER] PLAYER [3/9]: I hit the nearest one again.
[TOOLS]
- `python3 engine/engine.py init` → Ref: initiative d10=1 → enemies act first
- `python3 ledger.py attack` → ATTACK attack · S+3 · - · [7,4]=14 → T2 · HIT 7 dam / STATUS Stamina 17 · AD 9 · wounds 0/10 · uses Slashing 3 · UD torch 1
- Ref: TEST · claws U2 (3,1) · +2 · [10,10]=22 → T3 CRIT
- Ref: TEST · claws U4 moved to (3,0) · +2 · [3,3]=8 → T1
- Ref: TEST · spine U5 (5,0) · +2 · [2,6]=10 → T1
- Ref: TEST · spine U6 (5,1) · +2 · [5,1]=8 → T1
- Ref: TEST · claws U2 extra action (crit) · +2 · [4,8]=14 → T2
- (claws T3 4 + extra claws T2 2 = 6; Mara's attack kills U2 (7 vs 3 Stamina); U4 missed so Mara counters for her T2 7, U4 to 3) `python3 ledger.py take 6` → LEDGER: took 6 (AD 9→3, Stamina 17→17, wounds 0→0) / STATUS Stamina 17 · AD 3 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
The cripple lunges first, and this time it is fast and mean. Its claws open her armor along the collarbone, and before she can breathe it rakes again, lower. The leather is more tear than hide now, and she can feel the cold of the cellar air through it. A second one scrambles in on her left and swipes at nothing, off balance. Barbs spit past them and clatter harmlessly on the stone. Then Mara's blade comes round and the nearest one comes apart on it, and the counter she throws into the second one's chest cracks it to the spine. It sags against the wall, one arm dangling, hissing through a broken jaw.

Ref: initiative d10=1 → enemies act first (round 3); one razorback destroyed, another with three Stamina left.

Cellar corridor, round 3 · DT n/a · Stamina 17 · wounds 0/10 · AD 3 · torch lit · a broken one slumped at (3,0), two more pressing in behind it.

## Turn 4
[PLAYER] PLAYER [4/9]: I hit the nearest one again.
[TOOLS]
- `python3 engine/engine.py init` → Ref: initiative d10=6 → crows act first
- `python3 ledger.py attack` → ATTACK attack · S+3 · - · [1,2]=6 → T1 DOOM · MISS / STATUS Stamina 17 · AD 3 · wounds 0/10 · uses Slashing 3 · UD torch 1
- Ref: TEST · claws U4 (3,0) · +2 · [2,4]=8 → T1
- Ref: TEST · claws U5 moved to (3,1) · +2 · [6,5]=13 → T2
- Ref: TEST · claws U6 leaped to (2,1) · +2 · [9,10]=21 → T3 CRIT
- Ref: TEST · claws U6 extra action (crit) · +2 · [1,9]=12 → T2
- (doom: U4 counters at claws T3 4; U5 T2 2; U6 T3 4; U6 extra T2 2 = 12; U4's own claws missed, Mara counters T2 7 and destroys it) `python3 ledger.py take 12` → LEDGER: took 12 (AD 3→0, Stamina 17→8, wounds 0→0) / STATUS Stamina 8 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
Her cut goes wide, bad footing, and the broken one drives its claws into her side in answer, deep this time, past the last of the leather. The pain is hot and then cold. A second creature rakes her from the left, and a third bounds over the pile and lands at her hip and opens her again, once, twice, so fast the pain arrives together. Blood runs warm into her boot. Then the broken one lunges again and Mara's blade finds its skull on the way in, and it drops. Two remain, both close, and she is bleeding from the long cut under her ribs, a wet heat that tugs with every step she takes.

Ref: initiative d10=6 → crows act first (round 4); Mara's doom let the cripple counter, the rest as rolled; one razorback destroyed. A torn wound under the ribs keeps bleeding while she acts.

Cellar corridor, round 4 · DT n/a · Stamina 8 · wounds 0/10 · AD 0 · torch lit · one at (3,1), one at (2,1) hard against your hip.

