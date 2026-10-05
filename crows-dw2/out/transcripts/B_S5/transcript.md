## Turn 1
[PLAYER] PLAYER [1/17]: I plant myself in the corridor mouth with the torch behind me, and wait for the first one to come into reach.
(roll on request: none yet)
[TOOLS] (none)
[REF] The torch hisses at your back and throws your shadow down the corridor, long and thin. Water drips somewhere in the dark. Then the scrape of bone on stone, uneven, dragging. Two shapes lurch into the edge of the light, razor ridges of spine standing up through grey skin, jaws hanging slack. Behind them, further down the black throat of the corridor, more scraping, a whole column of it, patient and ragged. The nearer one lifts its head toward the warmth of you. Its spines flex, and its claws click against the flagstones as it drags itself the last few paces.

Cellar corridor mouth · DT 1 · Stamina 17 · wounds 0/10 · torch lit (1 UD) · two razorbacks at the edge of the light, closing, four more behind in the dark

## Turn 2
[PLAYER] PLAYER [2/17]: I cut at the first one in reach.
(roll on request: attack / Trade Blows)
[TOOLS]
$ python3 ledger.py attack
ATTACK attack · S+3 · - · [2,6]=11 → T1 · MISS
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
(Ref error: `attack` is the tiered-variant roll; variant B resolves Trade Blows with `move`. That line is disregarded as a mis-invocation, noted here for audit.)
$ python3 ledger.py move S
MOVE move · S+3 · - · [6,2]=11 → T3
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
(Ruling: 10+ choice not specified by Player; ruled inflict max damage 7. Foe's 12-16 damage 2 suffered.)
$ python3 ledger.py take 2
LEDGER: took 2 (AD 25→23, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 23 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF] Your blade comes round low and fast. It bites through the first razorback's shoulder and the thing folds sideways, one arm hanging by grey strings, but it does not stop. Its claws rake down in the same breath and ring off your shield and mail, scoring bright lines in the steel. Behind it the second one shoulders closer, spines rattling, and you smell grave-earth and old iron. Far back in the corridor the column keeps coming, slow and sure, eyes catching the torchlight in a dull row.

Roll: Trade Blows · S · MOVE move · S+3 · - · [6,2]=11 → T3 · max damage dealt (7), 2 suffered

Cellar corridor mouth · DT 1 · Stamina 17 · AD 23 · wounds 0/10 · torch lit (1 UD) · one razorback torn and sagging at your blade, a second pressing in beside it

## Turn 3
[PLAYER] PLAYER [3/17]: I hit the nearest one again.
[TOOLS]
$ python3 ledger.py move S
MOVE move · S+3 · - · [4,6]=13 → T3
STATUS Stamina 17 · AD 23 · wounds 0/10 · uses Slashing 3 · UD torch 1
(Ruling: max damage 7 on the wounded razorback, 3 Stamina left, it dies; foe's 2 suffered at once.)
$ python3 ledger.py take 2
LEDGER: took 2 (AD 23→21, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 21 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF] The second stroke takes the ruined razorback across the neck and it drops, the spines going limp, the jaw still working once against the stone before it stills. But its claws had already found you in the last instant, and they screech off your shield rim, one more bright line in the steel. The second creature climbs over the wreck without a glance, planting a clawed foot on its fallen kin. It crouches there in the torchlight, spines flaring wide, and its leg muscles bunch under the grey hide.

Roll: Trade Blows · S · MOVE move · S+3 · - · [4,6]=13 → T3 · max damage dealt (7), 2 suffered

Cellar corridor mouth · DT 1 · Stamina 17 · AD 21 · wounds 0/10 · torch lit (1 UD) · one razorback down, the second crouched on the corpse and about to spring, four more in the column behind

## Turn 4
[PLAYER] PLAYER [4/17]: I hit the nearest one again.
[TOOLS]
$ python3 ledger.py move S
MOVE move · S+3 · - · [5,1]=9 → T2
STATUS Stamina 17 · AD 21 · wounds 0/10 · uses Slashing 3 · UD torch 1
(Ruling: 7-9, cost not specified by Player, ruled "fleeting opportunity": the next undead in the column closes to the front. Damage 4 dealt to razorback #2 (6/10 left), 2 suffered.)
$ python3 ledger.py take 2
LEDGER: took 2 (AD 21→19, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 19 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF] You cut as it springs, and the blade lands, but it lands badly, glancing off a ridge of spine and ripping a long strip of grey flesh rather than finding the core. The razorback hits your shield anyway with its full weight and claws scrape the steel as you shove it back. That heartbeat of shoving gives the column its opening. A third shape shuffles out of the dark at a stumbling run, close enough now to show cracked teeth and a rag of old uniform. The first thing you notice is that your torch is guttering a little, its light thinning on the stone behind you.

Roll: Trade Blows · S · MOVE move · S+3 · - · [5,1]=9 → T2 · 4 dealt, 2 suffered, opponent gains a fleeting opportunity

Cellar corridor mouth · DT 1 · Stamina 17 · AD 19 · wounds 0/10 · torch lit (1 UD) · wounded razorback in your face, a third at its shoulder, three more behind

## Turn 5
[PLAYER] PLAYER [6/17]: I keep cutting the nearest one.
[TOOLS]
$ python3 ledger.py move S
MOVE move · S+3 · - · [3,4]=10 → T3
STATUS Stamina 17 · AD 19 · wounds 0/10 · uses Slashing 3 · UD torch 1
(Ruling: max damage 7 kills razorback #2 (6 left); foe's 2 suffered.)
$ python3 ledger.py take 2
LEDGER: took 2 (AD 19→17, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 17 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF] The blade comes down through the wounded razorback's collarbone and clean out the far side. It collapses in two pieces across its dead kin, and the stink of opened grave rises hot. The third is already on you, its claws scraping a line across your shield face and skidding off the mail at your hip. Behind it, three more shapes press shoulder to shoulder in the narrow throat of the corridor, so tight that the one in front cannot back away even if it wished. The bodies underfoot are a low wall now, slick and uneven. You hear the third one's breath, though you know it has none.

Roll: Trade Blows · S · MOVE move · S+3 · - · [3,4]=10 → T3 · max damage dealt (7), 2 suffered

Cellar corridor mouth · DT 1 · Stamina 17 · AD 17 · wounds 0/10 · torch lit (1 UD) · two razorbacks down, a third in your face, three more packed behind it

## Turn 6
[PLAYER] PLAYER [7/17]: I keep cutting the nearest one.
[TOOLS]
$ python3 ledger.py move S
MOVE move · S+3 · - · [4,3]=10 → T3
STATUS Stamina 17 · AD 17 · wounds 0/10 · uses Slashing 3 · UD torch 1
(Ruling: max damage 7 on razorback #3 (3 left); foe's 2 suffered.)
$ python3 ledger.py take 2
(see output below)
[REF] You hack across its ribs and the razorback staggers, a flap of grey hide peeling away from the bone, spines rattling like dry reeds. It does not fall. It lunges again, and its claws score your shield with a dull shriek, shaking the arm behind it. Beyond its shoulder, the three in the column are working their way over the heaped dead, and the nearest has gotten a hand up onto the wall of bodies. The torchlight behind you gutters and steadies. Your boots slip on something wet.

Roll: Trade Blows · S · MOVE move · S+3 · - · [4,3]=10 → T3 · max damage dealt (7), 2 suffered

Cellar corridor mouth · DT 1 · Stamina 17 · AD 15 · wounds 0/10 · torch lit (1 UD) · third razorback torn but standing, three more climbing over the dead behind it

## Turn 7
[PLAYER] PLAYER [8/17]: I keep cutting the nearest one.
[TOOLS]
$ python3 ledger.py move S
MOVE move · S+3 · - · [5,5]=13 → T3
STATUS Stamina 17 · AD 15 · wounds 0/10 · uses Slashing 3 · UD torch 1
(Ruling: max damage 7 kills razorback #3; foe's 2 suffered.)
$ python3 ledger.py take 2
LEDGER: took 2 (AD 15→13, Stamina 17→17, wounds 0→0)
STATUS Stamina 17 · AD 13 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF] The razorback takes the stroke under the jaw and the light goes out of its eyes, but its dead weight pitches forward onto your shield and it pins the rim against your chest, claws raking once more across your mail as it goes down. You throw it off. The wall of bodies at your feet is knee high now. The next in the column crests it and comes down hard, spines flared, its claws finding your shield almost before your guard is back. Two more shuffle behind it. The torch behind you gives a small, hungry crackle.

Roll: Trade Blows · S · MOVE move · S+3 · - · [5,5]=13 → T3 · max damage dealt (7), 2 suffered

Cellar corridor mouth · DT 1 · Stamina 17 · AD 13 · wounds 0/10 · torch lit (1 UD) · three razorbacks down, a fourth on you over the heap of dead, two more behind it

## Turn 8
[PLAYER] PLAYER [9/17]: I keep cutting the nearest one.
[TOOLS]
$ python3 ledger.py move S
MOVE move · S+3 · - · [1,4]=8 → T2
STATUS Stamina 17 · AD 13 · wounds 0/10 · uses Slashing 3 · UD torch 1
(Ruling: 7-9, cost not specified by Player, ruled "lose or break something": the shield's grip strap tears, narrative only, no numeric change. Damage 4 dealt to razorback #4 (6/10 left), 2 suffered.)
$ python3 ledger.py take 2
(see output below)
[REF] Your sword bites in, a long ugly cut across the fourth razorback's chest, and it reels but stays upright, spines quivering. Its claws take the shield high and drag down, and the grip strap tears at the rivet with a crack. The shield hangs from your forearm by one stubborn buckle, swinging, banging against your hip. You feel the bones of your arm ring. Over the heaped dead, the last two undead wait their turn, jaws working, eyes fixed on you. The torch snaps and spits sparks.

Roll: Trade Blows · S · MOVE move · S+3 · - · [1,4]=8 → T2 · 4 dealt, 2 suffered, something breaks

Cellar corridor mouth · DT 1 · Stamina 17 · AD 11 · wounds 0/10 · torch lit (1 UD) · three razorbacks down, a fourth wounded and swaying at your blade, two more waiting behind it

## Turn 9
[PLAYER] PLAYER [10/17]: I keep cutting the nearest one.
[TOOLS]
$ python3 ledger.py move S
MOVE move · S+3 · - · [4,1]=8 → T2
STATUS Stamina 17 · AD 11 · wounds 0/10 · uses Slashing 3 · UD torch 1
(Ruling: 7-9, cost ruled "fleeting opportunity": the fifth undead reaches the front beside the fourth. Damage 4 dealt to razorback #4 (2/10 left), 2 suffered.)
$ python3 ledger.py take 2
(see output below)
[REF] You hack again and the razorback jerks, hide split to the ribs, one spine snapped off at the root. It keeps coming. Its claws rake across the torn shield and glance off your pauldron. The fifth one has climbed the dead and stands at the first one's shoulder now, close enough to reach past it, eyes locked on your sword arm. The air in the corridor is thick with grave-smell, and a spine skitters across the flagstones from somewhere you cannot see. Your shield hand is slick.

Roll: Trade Blows · S · MOVE move · S+3 · - · [4,1]=8 → T2 · 4 dealt, 2 suffered, opponent gains a fleeting opportunity

Cellar corridor mouth · DT 1 · Stamina 17 · AD 9 · wounds 0/10 · torch lit (1 UD) · the fourth razorback barely standing, the fifth at its shoulder, the sixth behind

## Turn 10
[PLAYER] PLAYER [11/17]: I keep cutting the nearest one.
[TOOLS]
$ python3 ledger.py move S
MOVE move · S+3 · - · [1,6]=10 → T3
STATUS Stamina 17 · AD 9 · wounds 0/10 · uses Slashing 3 · UD torch 1
(Ruling: max damage kills razorback #4 (2 left); foe's 2 suffered.)
$ python3 ledger.py take 2
(see output below)
[REF] The blade finishes it. The fourth razorback goes down across the others, and what is left of its claws drags one last time along your greave. The fifth does not wait. It steps over the pile, spines flat against its back, and comes at you with its mouth open, a low rattle in its chest. Behind it the sixth has stopped, head cocked, watching, almost patient. The wall of dead is chest high at the corridor's edge now and you stand on a slick of grave-water and old blood.

Roll: Trade Blows · S · MOVE move · S+3 · - · [1,6]=10 → T3 · max damage dealt (7), 2 suffered

Cellar corridor mouth · DT 1 · Stamina 17 · AD 7 · wounds 0/10 · torch lit (1 UD) · four razorbacks down, the fifth on you, the sixth hanging back in the dark

## Turn 11
[PLAYER] PLAYER [12/17]: I keep cutting the nearest one.
[TOOLS]
$ python3 ledger.py move S
MOVE move · S+3 · - · [4,4]=11 → T3
STATUS Stamina 17 · AD 7 · wounds 0/10 · uses Slashing 3 · UD torch 1
(Ruling: max damage 7 on razorback #5 (3 left); foe's 2 suffered.)
$ python3 ledger.py take 2
(see output below)
[REF] Your stroke opens the fifth razorback from hip to shoulder and it screams, a thin wet sound, spines bristling as it lurches. It claws back, hard, and the blow shivers through your mail and numbs your arm. You feel how thin the plates are getting over your ribs. The sixth undead takes a slow step forward at last, into the light, spines raised, a ridge of bone along its back catching the torch. It lifts a clawed hand almost politely, as if waiting for the other to fall.

Roll: Trade Blows · S · MOVE move · S+3 · - · [4,4]=11 → T3 · max damage dealt (7), 2 suffered

Cellar corridor mouth · DT 1 · Stamina 17 · AD 5 · wounds 0/10 · torch lit (1 UD) · the fifth razorback gutted and swaying on you, the last one stepping into the light behind it

## Turn 12
[PLAYER] PLAYER [13/17]: I keep cutting the nearest one.
[TOOLS]
$ python3 ledger.py move S
MOVE move · S+3 · - · [2,6]=11 → T3
STATUS Stamina 17 · AD 5 · wounds 0/10 · uses Slashing 3 · UD torch 1
(Ruling: max damage 7 kills razorback #5 (3 left); foe's 2 suffered.)
$ python3 ledger.py take 2
(see output below)
[REF] The fifth razorback folds under your blade and does not rise. Its claws still catch you on the way down, a hard scrape across the mail that leaves your arm trembling. The last of them steps over the dead without hurry and plants itself in front of you. It is the biggest of the six, or seems so, hide scarred with old burns, one spine broken and healed crooked. It looks at you. It looks at the torch behind you. Then it opens its jaws and a low clicking comes from deep in its chest, the sound of a thing counting.

Roll: Trade Blows · S · MOVE move · S+3 · - · [2,6]=11 → T3 · max damage dealt (7), 2 suffered

Cellar corridor mouth · DT 1 · Stamina 17 · AD 3 · wounds 0/10 · torch lit (1 UD) · five razorbacks down, the last one before you, clicking

## Turn 13
[PLAYER] PLAYER [14/17]: I keep cutting the nearest one.
[TOOLS]
$ python3 ledger.py move S
MOVE move · S+3 · - · [1,6]=10 → T3
STATUS Stamina 17 · AD 3 · wounds 0/10 · uses Slashing 3 · UD torch 1
(Ruling: max damage 7 on razorback #6 (3 left); foe's 2 suffered.)
$ python3 ledger.py take 2
(see output below)
[REF] The blade takes it across the chest and it staggers back a step, spines thrashing, a rattle going through the heap of dead behind it. It comes forward again anyway, claws raking, and the last of your mail's plates cracks along the seam with a sound you feel in your teeth. The clicking in its throat has risen to a scrape, almost a word. Torchlight shows the wet dark of its wounds. Whatever held it back before is gone now. Your sword arm is heavy and the ground is slick.

Roll: Trade Blows · S · MOVE move · S+3 · - · [1,6]=10 → T3 · max damage dealt (7), 2 suffered

Cellar corridor mouth · DT 1 · Stamina 17 · AD 1 · wounds 0/10 · torch lit (1 UD) · the last razorback torn and furious, your armor nearly gone

## Turn 14
[PLAYER] PLAYER [15/17]: I keep cutting the nearest one.
[TOOLS]
$ python3 ledger.py move S
MOVE move · S+3 · - · [6,5]=14 → T3
STATUS Stamina 17 · AD 1 · wounds 0/10 · uses Slashing 3 · UD torch 1
(Ruling: max damage 7 kills razorback #6 (3 left); foe's 2 suffered at once.)
$ python3 ledger.py take 2
(see output below)
[REF] You put everything into the stroke and the last razorback comes apart under it, spine and rib and grey hide, and goes down in a heap on top of its five kin. Its dying claws find the last of your armor and the last of the plate gives way, and the second scrape is the first that reaches skin, a hot line across your ribs. Then the corridor is silent. The torch crackles. Somewhere a drip of water falls into the dark. Nothing moves in the column. The only sound is your own breath, loud and ragged, and the smell of grave-earth thick in your throat.

Roll: Trade Blows · S · MOVE move · S+3 · - · [6,5]=14 → T3 · max damage dealt (7), 2 suffered

Cellar corridor mouth · DT 1 · Stamina 16 · AD 0 · wounds 0/10 · torch lit (1 UD) · all six razorbacks destroyed, the corridor silent
DONE
Ran 14 turns.
