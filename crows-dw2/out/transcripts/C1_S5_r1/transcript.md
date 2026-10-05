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

## Turn 9
[PLAYER] PLAYER [10/17]: I keep cutting the nearest one.
[TOOLS] python3 ledger.py attack -> ATTACK attack · S+3 · - · [6,1]=10 → T1 · MISS
python3 engine/engine.py test 2 --why "undead #4 claws (engaged)" -> Ref: TEST · undead #4 claws (engaged) · +2 · [1,9]=12 → T2
python3 engine/engine.py test 2 --why "undead #6 spine (unengaged), Move: Require a cost or opportunity" -> Ref: TEST · undead #6 spine (unengaged), Move: Require a cost or opportunity · +2 · [2,8]=12 → T2
python3 ledger.py ud torch -> UD torch · [6] → 1→1
python3 ledger.py take 3 -> LEDGER: took 3 (AD 14→11, Stamina 17→17, wounds 0→0)
python3 ledger.py take 2 -> LEDGER: took 2 (AD 11→9, Stamina 17→17, wounds 0→0)
[REF] You swing and the razorback is simply not where the blade lands. It has slid under your arm and hangs on your side, claws working at the plates. To clear it you have to turn your back toward the torch, and the flame leans and flares as your cloak drags through it. The light holds, barely, but the pitch is burning fast. The sixth steps out of the dark at last and sends a spine across the corridor, rattling off your pauldron, bright against the dark. Metal is giving in a dozen places. The armor will not last long at this rate.

Move: Require a cost or opportunity (unengaged: undead #6) · Ref: TEST · undead #4 claws (engaged) · +2 · [1,9]=12 → T2 · Ref: TEST · undead #6 spine (unengaged) · +2 · [2,8]=12 → T2
Status: Cellar corridor mouth · DT 1 · Stamina 17 · AD 9 · wounds 0/10 · torch lit (UD 1, die held) · one razorback clinging to you, two more behind it.

## Turn 10
[PLAYER] PLAYER [11/17]: I keep cutting the nearest one.
[TOOLS] python3 ledger.py attack -> ATTACK attack · S+3 · - · [1,9]=13 → T2 · HIT 7 dam
python3 engine/engine.py test 2 --why "undead #4 claws" -> Ref: TEST · undead #4 claws · +2 · [5,6]=13 → T2
python3 ledger.py take 3 -> LEDGER: took 3 (AD 9→6, Stamina 17→17, wounds 0→0)
[REF] You drive your elbow back and the blade after it, pinning the thing against the wall and opening its side to the ribs. It shrieks, a high cracked sound, and still gets a hand free and drags it across your breastplate. The plate dents inward and a bright tear runs through the lacquer. What is left of your armor hangs loose and rattling. The razorback is sagging, but the two behind it are close now and the nearer one has its spines flat and its weight forward, the way a dog sits before it runs.

Ref: TEST · undead #4 claws · +2 · [5,6]=13 → T2
Status: Cellar corridor mouth · DT 1 · Stamina 17 · AD 6 · wounds 0/10 · torch lit (UD 1) · a razorback pinned and sagging, two more crowding behind it.

## Turn 11
[PLAYER] PLAYER [12/17]: I keep cutting the nearest one.
[TOOLS] python3 ledger.py attack -> ATTACK attack · S+3 · - · [8,10]=21 → T3 · HIT 10 dam
[REF] The blade comes down through the pinned thing's neck with a sound like a splitting log. The head rolls under the dead and the rest of it hangs on your steel a moment before it falls. You wrench the sword free and put your back square to the corridor mouth again. Two are left. The nearer one has stopped perched on the pile of its fellows and tilts its head at you, spines up along its shoulders like a cat's hackles, claws opening and closing. The other stands behind it in the dark, still. The torch pops. A thread of black smoke curls up from it.

Status: Cellar corridor mouth · DT 1 · Stamina 17 · AD 6 · wounds 0/10 · torch lit (UD 1) · two left, one crouched on the dead and ready to spring.

## Turn 12
[PLAYER] PLAYER [13/17]: I keep cutting the nearest one.
[TOOLS] python3 ledger.py attack -> ATTACK attack · S+3 · - · [8,6]=17 → T3 · HIT 10 dam
[REF] It springs and you meet it in the air. The blade takes it under the jaw and out through the crown, and it lands in a heap with its claws still twitching, a spine snapped off against the wall. The last razorback does not charge. It stands in the corridor beyond the bodies, gaunt and patient, and slowly sets its feet apart on the slick stone, spines rising one by one along its back. The torch behind you has burned low, the light shrinking on the floor. At the edge of it the thing lowers its head and a long thread of dark drool runs from its jaw to the flagstones.

Status: Cellar corridor mouth · DT 1 · Stamina 17 · AD 6 · wounds 0/10 · torch lit (UD 1, burning low) · one left, the last razorback, poised in the failing light.

## Turn 13
[PLAYER] PLAYER [14/17]: I keep cutting the nearest one.
[TOOLS] python3 ledger.py attack -> ATTACK attack · S+3 · - · [5,7]=15 → T2 · HIT 7 dam
python3 engine/engine.py test 2 --why "undead #6 claws" -> Ref: TEST · undead #6 claws · +2 · [2,7]=11 → T1
[REF] It leaps at last, clearing the dead in one bound, and you meet it with the edge. The blade bites deep into its shoulder and drags a long grey wound across the chest. It comes on regardless, claws swinging, but they go wide and rake only the stone beside your leg. It is hurt now, badly, listing to one side with its jaw hanging. It does not flee. It crouches against your shins, hands up, spines shivering, and the torchlight shows what is left of its face.

Ref: TEST · undead #6 claws · +2 · [2,7]=11 → T1
Status: Cellar corridor mouth · DT 1 · Stamina 17 · AD 6 · wounds 0/10 · torch lit (UD 1) · the last razorback, wounded and crouched against you.

## Turn 14
[PLAYER] PLAYER [15/17]: I keep cutting the nearest one.
[TOOLS] python3 ledger.py attack -> ATTACK attack · S+3 · - · [5,5]=13 → T2 · HIT 7 dam
[REF] The blade comes down once more and the last razorback stops mid-breath. Its spines fall flat, its claws unclench, and it folds slowly onto the heap of its fellows. Nothing moves in the corridor. The scraping is gone. Only the torch crackles at your back, low and orange, and the smoke of it hangs under the vault with the smell of ash. Six bodies lie in the stone throat, grey and ruined. Far down the corridor, past the reach of the light, something small and wet drips, steady as a clock.

Status: Cellar corridor mouth · DT 1 · Stamina 17 · AD 6 · wounds 0/10 · torch lit (UD 1) · all six razorbacks down; the corridor beyond is dark and dripping.
DONE
Ran 14 turns (player script indices 1-4, 6-15); all six undead destroyed, Mara alive.
