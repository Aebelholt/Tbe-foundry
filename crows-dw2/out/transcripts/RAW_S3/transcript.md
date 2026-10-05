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
