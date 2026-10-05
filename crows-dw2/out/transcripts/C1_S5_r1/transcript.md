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

## Turn 4
[PLAYER] PLAYER [4/17]: I hit the nearest one again.
[TOOLS] python3 ledger.py attack -> ATTACK attack · S+3 · - · [6,5]=14 → T2 · HIT 7 dam
[REF] The second stroke goes through the crack the first one made. The razorback's spine bends, its jaw works soundlessly, and it slides off your blade and onto the flagstones, where it kicks twice and goes still. The corridor is clear for a heartbeat. Then the next shape comes, stepping over the body without looking down, spines lifting, and behind it the column bunches up, claws ticking on the stone. The air smells of cold ash and the torch behind you gives a thin, steady light on all their grey faces.

Status: Cellar corridor mouth · DT 1 · Stamina 17 · AD 22 · wounds 0/10 · torch lit (UD 1) · five left, the next one stepping over its dead packmate into reach.

## Turn 5
[PLAYER] PLAYER [6/17]: I keep cutting the nearest one.
[TOOLS] python3 ledger.py attack -> ATTACK attack · S+3 · - · [10,6]=19 → T3 · HIT 10 dam
[REF] You step into the cut and the blade goes through the razorback from collarbone to hip. It comes apart in two dry pieces, the spines rattling across the floor like thrown knives, and the torso slides off the leg. It never had time to raise a claw. The stench of it hits you a moment later, sweet and burnt. Four shapes are left in the column now, closer than before, shoving past each other in the narrow stone throat. The foremost drags a hand along the wall as it comes, leaving a long wet streak, and its eyes catch the torchlight.

Status: Cellar corridor mouth · DT 1 · Stamina 17 · AD 22 · wounds 0/10 · torch lit (UD 1) · four left, the foremost almost on you.

## Turn 6
[PLAYER] PLAYER [7/17]: I keep cutting the nearest one.
[TOOLS] python3 ledger.py attack -> ATTACK attack · S+3 · - · [3,7]=13 → T2 · HIT 7 dam
python3 engine/engine.py test 2 --why "undead #3 claws" -> Ref: TEST · undead #3 claws · +2 · [5,7]=14 → T2
python3 ledger.py take 3 -> LEDGER: took 3 (AD 22→19, Stamina 17→17, wounds 0→0)
[REF] The blade opens the foremost one across the belly and it keeps coming anyway, trailing dark ropes of itself, fingers hooked. It slams into you shoulder first and rakes down your arm. Plate screams under the claws and a shower of paint chips scatters across your boots. You smell its breath, a cold cellar-damp sourness. It is badly hurt, swaying, but its eyes have not left your throat. Over its shoulder the three behind are lined up like men at a market door, waiting their turn, and one of them lifts a hand to its own back.

Ref: TEST · undead #3 claws · +2 · [5,7]=14 → T2
Status: Cellar corridor mouth · DT 1 · Stamina 17 · AD 19 · wounds 0/10 · torch lit (UD 1) · a gutted razorback clawing at you, three behind it with spines up.

## Turn 7
[PLAYER] PLAYER [8/17]: I keep cutting the nearest one.
[TOOLS] python3 ledger.py attack -> ATTACK attack · S+3 · - · [1,8]=12 → T2 · HIT 7 dam
[REF] You cut low and the wounded thing's knee goes. It drops against your shins, claws still scrabbling for purchase, and you finish it with a short chop that rings off the flagstones. Its spines clatter in the dark. The air thickens with ash smell. The torch behind you sputters and a drop of burning pitch hisses on the floor. Three shapes remain in the throat of the corridor, and the nearest one has stopped to look at the dead, head cocked, then at you. It opens its jaw wide and a thin dry keening comes out, answered from somewhere deeper in the cellar.

Status: Cellar corridor mouth · DT 1 · Stamina 17 · AD 19 · wounds 0/10 · torch lit (UD 1) · three left; something deeper in the cellar just answered their call.

## Turn 8
[PLAYER] PLAYER [9/17]: I keep cutting the nearest one.
[TOOLS] python3 ledger.py attack -> ATTACK attack · S+3 · - · [2,4]=9 → T1 · MISS
python3 engine/engine.py test 2 --why "undead #4 claws (engaged)" -> Ref: TEST · undead #4 claws (engaged) · +2 · [2,9]=13 → T2
python3 engine/engine.py test 2 --why "undead #5 spine (unengaged), Move: Escalate the situation" -> Ref: TEST · undead #5 spine (unengaged), Move: Escalate the situation · +2 · [7,3]=12 → T2
python3 ledger.py take 3 -> LEDGER: took 3 (AD 19→16, Stamina 17→17, wounds 0→0)
python3 ledger.py take 2 -> LEDGER: took 2 (AD 16→14, Stamina 17→17, wounds 0→0)
[REF] Your cut falls short, the razorback ducking inside it, and now the narrow stone throat works against you. It crowds your guard and rakes you twice across the plates while the one behind it, no longer content to wait, leaps up onto the dead and fires a spine straight over its packmate's shoulder. The barb punches through the gap in your armor at the hip and sticks there, quivering. The sixth stays back in the dark, only its pale eyes showing. The torch at your back gutters in a draft you cannot feel.

Move: Escalate the situation (unengaged: undead #5) · Ref: TEST · undead #4 claws (engaged) · +2 · [2,9]=13 → T2 · Ref: TEST · undead #5 spine (unengaged) · +2 · [7,3]=12 → T2
Status: Cellar corridor mouth · DT 1 · Stamina 17 · AD 14 · wounds 0/10 · torch lit (UD 1) · one razorback on you, another perched on the dead ready to fire again.
