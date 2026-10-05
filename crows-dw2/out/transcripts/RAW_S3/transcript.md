## Turn 1
[PLAYER] PLAYER [1/4]: It is dusk on the road home. I make camp off the road in the open and rest through the night, eating a ration.
(roll on request: Miasma RR (Mind) after the rest, only if the Ref asks)
[TOOLS]
$ python3 engine/engine.py enc
Ref: encounter d10=9 vs EN 9 → sign now, encounter within the next DT
$ python3 ledger.py test M --e 0 --b 0 --why "Miasma RR after outdoor rest"
TEST Miasma RR after outdoor rest · M+0 · - · [5,1]=6 → T1
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 engine/engine.py table miasma_effects --mod 1 --why "Miasma Effects, cruelty 1"
Ref: Miasma Effects (R28) d10+1 [5]=6 → 1st Effect: You enter a destructive rage and destroy one mundane item randomly chosen by the Ref from your backpack. 2nd Effect: Destroying something makes you feel good. You regain 3 Stamina or, if your Stamina is full, lose 1 wound. · Miasma Effects, cruelty 1
$ python3 engine/engine.py roll d10 --why "Miasma rage: which backpack slot (1-10) is destroyed"
Ref: d10 [7]=7 · Miasma rage: which backpack slot (1-10) is destroyed
[REF] The fire is a handful of coals and the night is wide and cold. You eat your ration, wrap yourself against a leaning wall of fieldstone, and sleep the four hours the road allows. Toward dawn the dreams turn red and tight in the chest. You wake on your feet with your hands full of wreckage, whatever was in the seventh slot of your pack torn to pieces, and a bright, ugly calm in you that you do not like. Out past the stone, beyond the near hedgerow, a light is moving where no farm should be: a lantern, swinging slowly, and under it the thin sound of someone calling a name over and over. Frost has not yet touched the grass, but there are fresh cart ruts in the verge that were not there at dusk.

Ref: encounter d10=9 vs EN 9 → sign now, encounter within the next DT
TEST Miasma RR after outdoor rest · M+0 · - · [5,1]=6 → T1
Ref: Miasma Effects (R28) d10+1 [5]=6 → 1st Effect: You enter a destructive rage and destroy one mundane item randomly chosen by the Ref from your backpack. 2nd Effect: Destroying something makes you feel good. You regain 3 Stamina or, if your Stamina is full, lose 1 wound. · Miasma Effects, cruelty 1
Ref: d10 [7]=7 · Miasma rage: which backpack slot (1-10) is destroyed

Camp off the road, open country · travel day (day's walk from home) · Stamina 17 · wounds 0/10 · light dawn-grey · the lantern in the hedgerow is coming nearer

## Turn 2
[PLAYER] PLAYER [2/4]: I walk in to the village at dawn and report to the steward.
[TOOLS]
$ python3 engine/engine.py travel normal
Ref: travel day 1 · normal · 2 hexes · EN 7
Ref: travel encounter d10=7 vs EN 7 → encounter today, Ref picks when
Ref: Travel Encounters (F1) d100 [61]=61 → Monster from Nearby
$ python3 engine/engine.py table any_monster_encounter
Ref: Any Monster Encounter (F1) d10 [4]=4 → Blood Dungeon Encounters
$ python3 engine/engine.py table blood_dungeon_encounters
Ref: Blood Dungeon Encounters (F32) d6 [3]=3 → 1 blood creature B
[REF] You leave the ashes and take the road at first light. The lantern keeps pace behind the hedge, never closer than a bowshot, never farther. The calling goes on, a woman's voice, patient, saying a name that is not yours. Nothing in the grass moves where the light passes, and the ruts you saw have no wheel-marks inside them, only a smear like something dragged. You do not answer it. By midday the old curtain wall of the village stands up out of the haze, grey, lichened, whole, and the voice stops at the last field boundary as though a rope had gone taut. When you look back the lantern hangs alone over the empty furrows, then gutters out. The gate-bar lifts for you. Inside, the general store has its shutters half open and ink-stained cuffs are leaning on the counter: the steward, Orla Venn, looking up from a ledger with the face of someone who has not slept either. "Back, then. Sit. Tell me what the road cost."

Ref: travel day 1 · normal · 2 hexes · EN 7
Ref: travel encounter d10=7 vs EN 7 → encounter today, Ref picks when
Ref: Travel Encounters (F1) d100 [61]=61 → Monster from Nearby
Ref: Any Monster Encounter (F1) d10 [4]=4 → Blood Dungeon Encounters
Ref: Blood Dungeon Encounters (F32) d6 [3]=3 → 1 blood creature B

General store, the village (unnamed) · travel day ends, cycle day 1/10 · Stamina 17 · wounds 0/10 · light daylight · Orla Venn waits for your report

## Turn 3
[PLAYER] PLAYER [3/4]: I spend the ten days quietly resting and repairing, and do not found or upgrade any institution and spend nothing at merchants.
[TOOLS]
$ python3 engine/engine.py cycle 0
Ref: cycle end · Prosperity 0 → -1 (nothing raised it, C45) · set it in the Ledger
Ref: next Village Event rolled: d10-1 [8]=7 · sealed until it lands
SEALED: next Village Event (C46-47) [sealed; not shown]
[REF] Orla takes what you tell her, nods once, and goes back to her columns. The ten days pass the way days do behind a wall that holds. You sleep under a roof, eat at a table, and the red calm drains out of you by the third morning until only the memory of tearing things apart remains. You oil the leather, work out the dents in the shield, and sit in the sun with your back to the stone. Nothing is built. Nothing is bought. The coin stays where it is and so does the village, and by the tenth evening the shutters on the lower lane are more patched than painted and the well-rope is a knot of mends. Word comes down from the north gate in the idle way word does: someone on the old road has been hammering at the toll house for days, setting beams where beams were never meant to go, and the smoke from it does not look like cooking. A cart that left for the ford has not come back. The tenth bell rings, a thin one, and the cycle turns over.

Ref: cycle end · Prosperity 0 → -1 (nothing raised it, C45) · set it in the Ledger
Ref: next Village Event rolled: d10-1 [8]=7 · sealed until it lands

The village (unnamed) · cycle day 10/10 ends, new cycle begins · Stamina 17 · wounds 0/10 · Prosperity -1 · light evening · the toll-house smoke stands over the north road

## Turn 4
[PLAYER] PLAYER [4/4]: The cycle turns. I ask around what changed in the village.
[TOOLS]
$ python3 engine/engine.py event
Ref: Village Event lands (d10-1 [8]=7): A merchant institution has a small surplus. Treat them as 1 level higher until the end of the cycle.
[REF] Asking is easy; everyone is awake with the new cycle and glad to talk. The baker says the lower lane smells of fresh tallow, and she is right: the general store's back door stands propped open and crates are being walked in off a mule from somewhere that was not on anyone's mind a week ago. Shelves that were bare at the top are full to the beam, lamp oil, nails, cheap cloth, a stack of salt in paper. A boy hauling a sack tells you the stewards say a trader came through short of buyers and sold at a loss. Orla Venn stands in the doorway with her arms folded, ink on her cuffs, counting the crates with her lips and not smiling. "Stock is not coin," she says to nobody. "Do not let anyone tell you the store is flush." Past the roofs, up at the north gate, the watch has doubled and the toll-house smoke is still standing in the evening, thin and straight as a nail.

Ref: Village Event lands (d10-1 [8]=7): A merchant institution has a small surplus. Treat them as 1 level higher until the end of the cycle.

The village (unnamed) · cycle day 1/10 · Stamina 17 · wounds 0/10 · Prosperity -1 · light evening · Orla is waiting to see if you will speak to her

DONE
Ran 4 turns.
