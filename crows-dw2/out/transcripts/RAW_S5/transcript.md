## Turn 1
[PLAYER] PLAYER [1/17]: I plant myself in the corridor mouth with the torch behind me, and wait for the first one to come into reach.
(roll on request: none yet)
[TOOLS]
$ python3 engine/engine.py init
Ref: initiative d10=6 → crows act first
$ python3 engine/engine.py test 2 --why "U1 claws" (and U2 claws, U3-U6 spine; run in sequence)
Ref: TEST · U1 claws · +2 · [2,7]=11 → T1
Ref: TEST · U2 claws · +2 · [1,3]=6 → T1
Ref: TEST · U3 spine · +2 · [2,6]=10 → T1
Ref: TEST · U4 spine · +2 · [4,7]=13 → T2
Ref: TEST · U5 spine · +2 · [5,9]=16 → T2
Ref: TEST · U6 spine · +2 · [2,2]=6 → T1
$ python3 ledger.py take 1
LEDGER: took 1 (AD 25→24, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 24 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 1
LEDGER: took 1 (AD 24→23, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 23 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
Mara holds her ground and the corridor fills with the sound of them: dry scrabbling, a wet click of tendon, the scrape of too many hooked fingers on flagstone. The torch behind her throws her shadow long down the passage, and the first razorback shapes come into its edge at a run, spines raised along their ruined backs like a row of rusted nails.

Two of them reach her at once, one low along each wall, and the claws go wide. One rakes the air past her shield rim, the other overreaches and its arm hangs in the open beside her blade. Behind them the rest crowd up, and the air hums. Two thin bone spines skip off her armor with a hard tick, scattering splinters across the floor. Four more of the things hold back among the dark, rattling, waiting for room.

Both clawed ones stand within her reach, shoulder to shoulder in the mouth of the corridor, heads cocked toward the torchlight.

Ref: initiative d10=6 → crows act first | Ref: TEST · U1 claws · +2 · [2,7]=11 → T1 | Ref: TEST · U2 claws · +2 · [1,3]=6 → T1 | Ref: TEST · U3 spine · +2 · [2,6]=10 → T1 | Ref: TEST · U4 spine · +2 · [4,7]=13 → T2 | Ref: TEST · U5 spine · +2 · [5,9]=16 → T2 | Ref: TEST · U6 spine · +2 · [2,2]=6 → T1

Corridor cellar · Round 1 · Stamina 17 · wounds 0/10 · AD 23 · torch lit (1 UD) · two razorbacks at her shoulder, four spitting spines behind

## Turn 2
[PLAYER] PLAYER [2/17]: I cut at the first one in reach.
(roll on request: attack / Trade Blows)
[TOOLS]
$ python3 engine/engine.py init
Ref: initiative d10=2 → enemies act first
$ python3 engine/engine.py test 2 --why "U1 claws" (and U2 claws, U3-U6 spine; in sequence)
Ref: TEST · U1 claws · +2 · [7,6]=15 → T2
Ref: TEST · U2 claws · +2 · [10,5]=17 → T3
Ref: TEST · U3 spine · +2 · [5,2]=9 → T1
Ref: TEST · U4 spine · +2 · [7,2]=11 → T1
Ref: TEST · U5 spine · +2 · [3,9]=14 → T2
Ref: TEST · U6 spine · +2 · [7,5]=14 → T2
$ python3 ledger.py take 2
LEDGER: took 2 (AD 23→21, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 21 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 4
LEDGER: took 4 (AD 21→17, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 17 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 1
LEDGER: took 1 (AD 17→16, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 16 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 1
LEDGER: took 1 (AD 16→15, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 15 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [10,1]=14 → T2 · HIT 7 dam
STATUS Stamina 17 · AD 15 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
The dead move first. Two claws come in together, one scraping a bright line across her shield, the other hammering her armor hard enough to ring it like a bell. Thin spines whine in from the dark behind them and tick against her mail, two of them finding purchase and sticking there, quivering.

Mara cuts. The sword bites into the nearest razorback at the hip and the blade sinks deep, grinding through dry bone. It staggers, its torn side hanging, one arm hooked uselessly, but it does not fall. The stink of old grave-dirt rolls off it. Its jaw works soundlessly, and the dull glow behind its eyes holds on her.

Beyond it the others shuffle and shove, spines rising again along their backs. The torch gutters behind her, throwing the corridor into red and black, and the shapes in it will not stop coming.

Ref: initiative d10=2 → enemies act first | Ref: TEST · U1 claws · +2 · [7,6]=15 → T2 | Ref: TEST · U2 claws · +2 · [10,5]=17 → T3 | Ref: TEST · U3 spine · +2 · [5,2]=9 → T1 | Ref: TEST · U4 spine · +2 · [7,2]=11 → T1 | Ref: TEST · U5 spine · +2 · [3,9]=14 → T2 | Ref: TEST · U6 spine · +2 · [7,5]=14 → T2 | ATTACK attack · S+3 · - · [10,1]=14 → T2 · HIT 7 dam

Corridor cellar · Round 2 · Stamina 17 · wounds 0/10 · AD 15 · torch lit (1 UD) · the wounded razorback and its twin still hold the mouth

## Turn 3
[PLAYER] PLAYER [3/17]: I hit the nearest one again.
[TOOLS]
$ python3 engine/engine.py init
Ref: initiative d10=1 → enemies act first
$ python3 engine/engine.py test 2 --why "U1 claws" (and U2 claws, U3-U6 spine; in sequence)
Ref: TEST · U1 claws · +2 · [10,2]=14 → T2
Ref: TEST · U2 claws · +2 · [2,4]=8 → T1
Ref: TEST · U3 spine · +2 · [10,8]=20 → T3
Ref: TEST · U4 spine · +2 · [4,6]=12 → T2
Ref: TEST · U5 spine · +2 · [8,5]=15 → T2
Ref: TEST · U6 spine · +2 · [7,4]=13 → T2
$ python3 ledger.py take 2
LEDGER: took 2 (AD 15→13, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 13 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 3
LEDGER: took 3 (AD 13→10, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 10 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 1
LEDGER: took 1 (AD 10→9, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 9 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 1
LEDGER: took 1 (AD 9→8, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 8 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 1
LEDGER: took 1 (AD 8→7, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 7 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [1,3]=7 → T1 · MISS
STATUS Stamina 17 · AD 7 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 2   (U1 counters on Mara's melee miss: claws T2 = 2 dam, R20)
LEDGER: took 2 (AD 7→5, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 5 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
They come in ragged and fast. A claw scrapes her shield, a second skates off her pauldron, and bone spines hiss out of the dark and pepper her mail, one so hard it dents the plate beneath. Her armor is beginning to sound wrong, the ring of it gone flat and dull.

Mara swings for the wounded one and her blade clangs off the wall, the stroke dragged wide by a lurch of the thing's torn body. The razorback catches the opening at once and rakes her across the guard with a hooked hand, the claws screeching on steel. The torch behind her gutters low, and the red light shivers.

The two at her shoulders are still upright. The wounded one hangs half open from hip to ribs and still reaches for her. Behind them the spined shapes crowd tight against the walls, jostling for the angle.

Ref: initiative d10=1 → enemies act first | Ref: TEST · U1 claws · +2 · [10,2]=14 → T2 | Ref: TEST · U2 claws · +2 · [2,4]=8 → T1 | Ref: TEST · U3 spine · +2 · [10,8]=20 → T3 | Ref: TEST · U4 spine · +2 · [4,6]=12 → T2 | Ref: TEST · U5 spine · +2 · [8,5]=15 → T2 | Ref: TEST · U6 spine · +2 · [7,4]=13 → T2 | ATTACK attack · S+3 · - · [1,3]=7 → T1 · MISS

Corridor cellar · Round 3 · Stamina 17 · wounds 0/10 · AD 5 · torch lit (1 UD) · the wounded razorback is still on its feet and reaching

## Turn 4
[PLAYER] PLAYER [4/17]: I hit the nearest one again.
[TOOLS]
$ python3 engine/engine.py init
Ref: initiative d10=1 → enemies act first
$ python3 engine/engine.py test 2 --why "U1 claws" (and U2 claws, U3-U6 spine; in sequence)
Ref: TEST · U1 claws · +2 · [10,2]=14 → T2
Ref: TEST · U2 claws · +2 · [8,2]=12 → T2
Ref: TEST · U3 spine · +2 · [2,9]=13 → T2
Ref: TEST · U4 spine · +2 · [4,1]=7 → T1
Ref: TEST · U5 spine · +2 · [7,8]=17 → T3
Ref: TEST · U6 spine · +2 · [5,3]=10 → T1
$ python3 ledger.py take 2
LEDGER: took 2 (AD 5→3, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 3 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 2
LEDGER: took 2 (AD 3→1, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 1 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 1
LEDGER: took 1 (AD 1→0, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 3
LEDGER: took 3 (AD 0→0, Stamina 17→14, wounds 0→0)
STATUS Stamina 14 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [2,8]=13 → T2 · HIT 7 dam
STATUS Stamina 14 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
The armor gives out first. A claw hammers her shield, another drags across her ribs, and the last of the plate's strength goes with a flat crack. The spines keep coming through the red dark, and one punches in under the arm and finds the flesh beneath. Heat runs down her side. Nothing is left between her and them now but wool and skin.

Mara cuts again, and this time it lands. The wounded razorback takes the blade across the neck and the head tips and slides, the body folding at the knees. It drops against the wall and does not rise, a heap of old bone and tatters. Its glow gutters out of the sockets.

Five remain. The one at her other shoulder steps over the fallen and fills the gap, claws spread, spines trembling along its back. The torch behind her burns lower, the shadows leaning in.

Ref: initiative d10=1 → enemies act first | Ref: TEST · U1 claws · +2 · [10,2]=14 → T2 | Ref: TEST · U2 claws · +2 · [8,2]=12 → T2 | Ref: TEST · U3 spine · +2 · [2,9]=13 → T2 | Ref: TEST · U4 spine · +2 · [4,1]=7 → T1 | Ref: TEST · U5 spine · +2 · [7,8]=17 → T3 | Ref: TEST · U6 spine · +2 · [5,3]=10 → T1 | ATTACK attack · S+3 · - · [2,8]=13 → T2 · HIT 7 dam

Corridor cellar · Round 4 · Stamina 14 · wounds 0/10 · AD 0 · torch lit (1 UD) · five razorbacks left, one at her shoulder

## Turn 5
[PLAYER] PLAYER [6/17]: I keep cutting the nearest one.
[TOOLS]
$ python3 engine/engine.py init
Ref: initiative d10=3 → enemies act first
$ python3 engine/engine.py test 2 --why "U2 claws" (and U3 claws after stepping up, U4-U6 spine; in sequence)
Ref: TEST · U2 claws · +2 · [10,6]=18 → T3
Ref: TEST · U3 claws · +2 · [2,8]=12 → T2
Ref: TEST · U4 spine · +2 · [10,2]=14 → T2
Ref: TEST · U5 spine · +2 · [10,7]=19 → T3
Ref: TEST · U6 spine · +2 · [10,8]=20 → T3
$ python3 ledger.py take 4   (U2 T3 claws, damages Stamina: Lacerate, 1 laceration on Mara)
LEDGER: took 4 (AD 0→0, Stamina 14→10, wounds 0→0)
STATUS Stamina 10 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 2
LEDGER: took 2 (AD 0→0, Stamina 10→8, wounds 0→0)
STATUS Stamina 8 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 1
LEDGER: took 1 (AD 0→0, Stamina 8→7, wounds 0→0)
STATUS Stamina 7 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 3
LEDGER: took 3 (AD 0→0, Stamina 7→4, wounds 0→0)
STATUS Stamina 4 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py take 3
LEDGER: took 3 (AD 0→0, Stamina 4→1, wounds 0→0)
STATUS Stamina 1 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [6,8]=17 → T3 · HIT 10 dam
STATUS Stamina 1 · AD 0 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
Now it all lands. A claw rakes her flank and keeps raking, the hooked tips dragging down through cloth and into meat, and she feels a long red line open that does not close. A second razorback shoves into the gap beside the first and claws her once, hard. Spines come in a flurry from the dark and three of them find her, one in the thigh, one in the shoulder, one glancing off the ribs, each hot as a coal. The world narrows to breath and the torch's guttering red.

Mara cuts through it anyway. The blade takes the razorback that raked her square across the chest and drives clean through, the spine splitting, the whole thing coming apart in a rattle of bone that clatters off the walls. The glow in it goes out.

Four left. The one that stepped up is at her left shoulder, jaw hanging open, claws pulling back. The three behind it are tense and rattling, spines up.

Ref: initiative d10=3 → enemies act first | Ref: TEST · U2 claws · +2 · [10,6]=18 → T3 | Ref: TEST · U3 claws · +2 · [2,8]=12 → T2 | Ref: TEST · U4 spine · +2 · [10,2]=14 → T2 | Ref: TEST · U5 spine · +2 · [10,7]=19 → T3 | Ref: TEST · U6 spine · +2 · [10,8]=20 → T3 | ATTACK attack · S+3 · - · [6,8]=17 → T3 · HIT 10 dam

Corridor cellar · Round 5 · Stamina 1 · wounds 0/10 · AD 0 · laceration 1 · torch lit (1 UD) · four razorbacks left, one at her shoulder

## Turn 6
[PLAYER] PLAYER [7/17]: I keep cutting the nearest one.
[TOOLS]
$ python3 engine/engine.py init
Ref: initiative d10=1 → enemies act first
$ python3 engine/engine.py test 2 --why "U3 claws" (and U4-U6 spine; in sequence)
Ref: TEST · U3 claws · +2 · [1,6]=9 → T1
Ref: TEST · U4 spine · +2 · [4,2]=8 → T1
Ref: TEST · U5 spine · +2 · [1,7]=10 → T1
Ref: TEST · U6 spine · +2 · [8,7]=17 → T3
$ python3 ledger.py take 3
LEDGER: took 3 (AD 0→0, Stamina 1→0, wounds 0→2)
STATUS Stamina 0 · AD 0 · wounds 2/10 · uses Slashing 3 · UD torch 1
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [6,7]=16 → T2 · HIT 7 dam
STATUS Stamina 0 · AD 0 · wounds 2/10 · uses Slashing 3 · UD torch 1
[REF]
Her legs are shaking now. The claw that comes for her chest sweeps wide, and the two spines that follow tick harmlessly off the wall, but the last one drives into the meat of her thigh and out of the other side of her pack straps, and something inside her gives. Her belt-pouch is slick and wet. The pain does not stop. It builds, and it settles in her like a stone.

She cuts anyway. The nearest razorback takes the stroke across the ribs and reels back, split nearly through, the glow in it wavering like a bad candle. It clings to the wall, one arm dangling, but it is still reaching.

Three more rattle behind it, spines rising. Her torch gutters behind her. The red of it has gone thin and the dark leans in at the edges of the light. Her breath is loud in her own ears, and the wound beside her ribs is still running.

Ref: initiative d10=1 → enemies act first | Ref: TEST · U3 claws · +2 · [1,6]=9 → T1 | Ref: TEST · U4 spine · +2 · [4,2]=8 → T1 | Ref: TEST · U5 spine · +2 · [1,7]=10 → T1 | Ref: TEST · U6 spine · +2 · [8,7]=17 → T3 | ATTACK attack · S+3 · - · [6,7]=16 → T2 · HIT 7 dam

Corridor cellar · Round 6 · Stamina 0 · wounds 2/10 · AD 0 · laceration 1 · torch lit (1 UD) · four razorbacks left, one nearly split
