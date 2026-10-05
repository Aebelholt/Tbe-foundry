## Turn 1
[PLAYER] PLAYER [1/4]: I find Orla in the long hall and ask her straight out for a loan of 200 gc, repayable at the next cycle.
[TOOLS]
$ python3 ledger.py status
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
$ python3 player.py S2b
PLAYER [1/4]: I find Orla in the long hall and ask her straight out for a loan of 200 gc, repayable at the next cycle.
[REF]
Orla Venn is at the end of the long hall with a stock book open under one elbow and a pen behind her ear, ink dark on both cuffs. She does not look up until you have finished the question. Then she closes the book, slowly, and looks at you for a good while.

"Two hundred. Straight out, no story first. I will say that for you." She taps the cover. "Do you know what the last cart off the north road carried? Neither do I, because it never came in. The shelves behind me are thinner than they look, Crow."

She glances at the door, then back. "I do not say no to a delve that might bring coin home. I do not say yes to a promise that is only air, either. Tell me what you would put against it."

Her hand stays flat on the closed book, waiting.

Status: The long hall, the village (home, unnamed) · village day · Stamina 17 · wounds 0/10 · daylight through the high windows · Orla waits for what you will put against the loan

## Turn 2
[PLAYER] PLAYER [2/4]: I try to move her with an honest argument: the vault will pay the village back, and I will bring back whatever I find that is hers.
(roll on request: Pull Strings, approach persuade. The Ref must call this roll.)
[TOOLS]
$ python3 ledger.py test M --e 0 --b 0 --why "Pull Strings, persuade, Orla Venn"
TEST Pull Strings, persuade, Orla Venn · M+0 · - · [8,6]=14 → T2
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
Orla listens without interrupting, her thumb worrying the corner of the stock book. When you finish, she breathes out through her nose, not quite a laugh.

"That is an honest argument, and I would sooner have it than a boast." She pulls the pen from behind her ear and turns it over. "I believe you mean it. Meaning it does not fill my shelves."

She leans in, voice dropping. "My husband kept a tally ledger. Brown cloth, his mark on the spine. It went into a vault with him, in a manner of speaking, and I have wanted it back longer than I have wanted coin. Bring me that. Not whatever you find. That."

Her eyes are steady now, and tired in a way the ink does not hide. "And the two hundred comes back to me in coin, at the next cycle, whatever the delve gives you."

TEST Pull Strings, persuade, Orla Venn · M+0 · - · [8,6]=14 → T2

Status: The long hall, the village (home, unnamed) · village day · Stamina 17 · wounds 0/10 · daylight through the high windows · Orla has named her price and waits on your answer

## Turn 3
[PLAYER] PLAYER [3/4]: While she answers I watch her closely to see whether she is telling me the whole truth about the store's money.
(roll on request: Sense Motive. The Ref must call this roll.)
[TOOLS]
$ python3 ledger.py test M --e 0 --b 0 --why "Sense Motive, Orla Venn"
TEST Sense Motive, Orla Venn · M+0 · - · [8,6]=14 → T2
STATUS Stamina 17 · AD 25 · wounds 0/10 · uses Slashing 3 · UD torch 1
[REF]
You watch her while she talks, and what you see is a woman with nothing to hide who hates having to say it. Her eyes stay on yours. Her jaw tightens only when the word "coin" comes up, and her hand drifts to the stock book as if it might pull the numbers into line.

She is not lying, and she is not softening anything. The store's cash is short, truly short, since the cart was lost on the road. Two hundred is more than she can spare without something coming back to her, and the ledger is the something. The shortfall is not a trick to drive the price up. It is the reason she has a price at all.

"You are looking at me like a woman counting my change," Orla says, dry. "Count away. It is all true, and I would rather you knew it before you walked out of that door with my coin."

TEST Sense Motive, Orla Venn · M+0 · - · [8,6]=14 → T2

Status: The long hall, the village (home, unnamed) · village day · Stamina 17 · wounds 0/10 · daylight through the high windows · Orla's terms stand: the brown ledger back, two hundred repaid in coin at the next cycle

## Turn 4
[PLAYER] PLAYER [4/4]: I accept whatever terms she names and shake on it.
[TOOLS]
$ python3 player.py S2b
PLAYER [4/4]: I accept whatever terms she names and shake on it.
[REF]
Orla looks at your offered hand a moment, as if checking it for ink of its own. Then she takes it, her grip dry and quick, once up and once down.

"Done." She opens the stock book, finds a page near the back, and writes a line in a small, fast hand. "Two hundred out, two hundred in at the next cycle, and a brown cloth ledger with his mark on the spine. I have written it where the village can read it, so neither of us gets to forget."

She unlocks a drawer under the counter and counts out the coin onto the wood in stacks of ten, lips moving. It takes a while. When the last stack is down she pushes the lot across and does not let go of the final one right away.

"Bring it home, Crow. The ledger first, whatever else you carry. And the vault is not kind. Come back whole."

Status: The long hall, the village (home, unnamed) · village day · Stamina 17 · wounds 0/10 · daylight through the high windows · 200 gc on the counter in front of you, Orla's hand still on the last stack

DONE
Ran 4 turns; scene ended with Orla agreeing to terms.
