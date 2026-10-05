# Paraphrased from Into the Wyrd and Wild (private use; all rights reserved by the publisher).
# "Crows:" parts are HOUSE conversions: an RR stat, and damage dice at the printed-Crows scale (1d6 to 2d6). Tier 3 on the RR avoids the effect, tier 2 gives the lesser result, tier 1 the full effect.
HAZARDS = [
"Amoeba Bog: still clean water that is one giant amoeba; it lashes at anyone near and digests flesh. Detect: the water shimmers like jelly. Avoid: throw bait to distract it. Crows: A RR each exchange in reach; tier 1 1d6 acid, tier 2 half",
"Blistering Ivy: star-leaved ivy; touch gives painful blisters for days. Detect: nature knowledge or experience. Avoid: no skin contact; herbal soap cures. Crows: S RR; tier 1 a bane on tests for 1d3 DT-days, tier 2 one test",
"Bonemeal Quicksand: scree of animated bones; harmless if you keep moving, drags you down if you stop. Detect: anything dropped sinks. Avoid: cross without stopping. Crows: A RR; tier 1 pinned then dragged under, 2d6 crushing a turn until two tier 3 RRs; tier 2 pinned",
"Cutting Scrawl: carved runes that hurt and wipe the last hour from your mind if read. Detect: magic, or reading it. Avoid: close your eyes. Crows: M RR; tier 1 1d6 psychic and lose the last hour, tier 2 lose the hour",
"Doom Stones: a standing stone with a bound fiend that presses on minds nearby. Detect: soft horrid voices. Avoid: holy symbol; holy water for an hour. Crows: M RR; tier 1 one random madness, tier 2 a level of cruelty (Miasma, R27) for the day",
"Drowning Pond: animals sing a charming chord so you walk in and drown. Detect: music too perfect; skeletons in the weeds. Avoid: sing worse, or better. Crows: M RR after a minute; tier 1 compelled to the pond bottom, tier 2 one stumble in",
"Euphoria Stream: warm teal stream whose drug absorbs through skin. Detect: drug-den air; drowning flies. Avoid: no skin contact. Crows: S RR after a minute; tier 1 happy and useless for an hour, tier 2 a bane for the hour",
"Fen of Thievery: a gold-flecked fen that picks pockets. Detect: items on the floor; grasping water. Avoid: pay a coin first; keep valuables dry. Crows: A RR; tier 1 lose 1d3 loose items, tier 2 lose one",
"Flensing Grass: silver chest-high blades that slice anyone crossing. Detect: it twitches; sliced animals at its base. Avoid: fire frightens it. Crows: A RR each turn inside; tier 1 2d6 piercing, tier 2 1d6",
"Gallowlurks: noose-vines of a limpet creature that hoist you by the neck. Detect: intestine-like coils. Avoid: trigger from a distance. Crows: A RR; tier 1 hoisted and 1d6 strangle a turn until free, tier 2 caught but not lifted",
"Gluttonous Tree: carnivorous root bed that pins and crushes. Detect: slow roots, bloody bones. Avoid: climb above, or throw 100 lb of meat. Crows: S RR; tier 1 pinned and 1d6 a turn until you break free, tier 2 pinned one turn",
"Hallucinogenic Moss: purple moss that spores hallucinations. Detect: nature knowledge. Avoid: crude mask, hold breath. Crows: S RR; tier 1 an hour of hallucination (roll the table), tier 2 half an hour",
"Hideous Totems: rusted-blade totems that curse a trail so you loop back. Detect: malicious magic. Avoid: leave a weapon impaled in it. Crows: no RR; the party loops for half an hour unless it leaves a weapon",
"Hungry Lilies: blood-red lilies that bleed prey dry. Detect: tiny clicking teeth. Avoid: garlic. Crows: A RR each turn inside; tier 1 bleeding 1d4 a round until staunched, tier 2 one cut",
"Papa Sleep: a corpse dragging a grandfather clock, singing a lullaby of sleep. Detect: drowsiness and a song. Avoid: offer to repair the clock; fixing it earns a magic ring. Crows: M RR; tier 1 falls asleep, tier 2 awake but a bane until rest",
"Reaper's Fingers: bone-coloured toxic fungi; touch sickens, repeat touches kill. Detect: nature knowledge. Avoid: no skin contact. Crows: S RR per touch; tier 1 nauseated an hour (bane), second touch unconscious, third touch Stamina 0",
"Skull Children: masked spirit-children who haunt travellers with pranks nightly. Detect: laughing and skull masks in the dark. Avoid: give a toy or sweet. Crows: no RR; each night roll the prank table",
"Spite Beds: a bone bed that radiates hatred into the mind. Detect: nausea, dying vermin sounds. Avoid: holy water or sanctified salt. Crows: M RR; tier 1 dizzy (attacks vs you gain an edge) for an hour, a second RR to avoid rage; tier 2 dizzy only",
"Stink Stalks: child-high fungal stalks whose spores attract predators. Detect: bait smell. Avoid: sneak (they sense vibration). Crows: A RR; tier 1 double the encounter checks for 1d12 hours, tier 2 one extra check",
"Volatile Cadaver: bloated corpses that burst on touch with shrapnel and disease. Detect: pulsing seams. Avoid: throw a stone from afar. Crows: A RR; tier 1 2d6 and a disease roll, tier 2 1d6",
"Wyrd Flare: reality warps; entering gives a random effect from the Wyrd magic chart. Detect: magic-sense; Wyrd-attuned know. Avoid: carry a Wild Elf piece. Crows: no RR; the Ref rules a strange effect (no table in this build)",
]
FLORA = [
"Banshee Morel: skull-headed mushroom that wails and deafens when threatened; dried, a trumpet",
"Beedlesprouts: amber buds; eating them lets you hear the trees sing, shrill near predators",
"Boletus Posterum: pink lattice mushroom; poisonous, gives visions of the near future",
"Canticle Holly: blue-leaf tree with glowing berries; sleeping near it eases fatigue; berries make Saints' Respite",
"Carol Trees: silver-leaved conifers whose song heals but can lull you into endless sleep",
"Coal-nettle: foul black shrub that burns hard; ground fine it is explosive powder",
"Dame's Seal: elegant crimson-veined flower prized by nobles and alchemists",
"Deer Weed: antler-like leafless sprout that can pass as antler to the unskilled",
"Dirkberry: thorn bush hiding berries for fighters' brandy and a mind-freeing wine",
"Elf-ear: grass blade that whistles; attracts some wildlife when used as a whistle",
"Gristle Pear: warty tree with fat-and-gristle fruit; one feeds an adult for a day",
"Kingsleep Moss: soft turquoise moss; a night's rest on it is deeply restorative",
"Knitting Onion: onion that revives the unconscious like smelling salts",
"Night Cherry: black cherries causing an hour-long coma; extract is Red Slumber poison",
"Obsequy Ragwort: funeral flower; a body buried with it will not rise as undead",
"Pissboils: foul fungus that bursts into caustic liquid; causes memory loss, attracts predators, used to etch metal",
"Plump Friars: sweet berries; brewed into an illegal euphoria elixir",
"Ring Root: boiled it feeds; raw it helps neutralise poison",
"Scribe's Birch: bark peels as vellum-like sheets",
"Swineweed: stalk that burns into thick smoke causing blindness for hours",
]
DISEASES = [
"The Bleeding: you bleed from every orifice; bleeding damage is worse; can be transfused. Cure: two successes in a row, or a transfusion",
"Etch Mites: burrowing mites carve half-words and drawings into your skin; constant itching. Cure: three successes, or a full shave and lye bath",
"Fleshspawn: flesh grows out of control; each day you gain bulk until you burst. Cure: three successes in a row, or brown recluse venom; excess flesh can be cooked and eaten",
"Mind Drift: your soul leaves your body for an hour at a time, leaving it helpless. Cure: two successes in a day, or a day asleep under a Carol Tree",
"Mire Creeps: spore-filled skin balls that burst in heat for damage and spread. Cure: three successes in a row, or Pissboil salve",
"Treewylding: you slowly become a tree; saves only delay it; no cure but divine or great Wyrd intervention",
"Saint Agrella's Wart: swelling warts spread across the body, slowing and stiffening you. Cure: three successes, or a scalding herbal bath, leeching and wart removal",
"Scribe's Bane: you lose the ability to read and write. Cure: two successes in a row, or an eaten, ground spellbook paste",
"Spell-Scum: casters' spells come out random. Cure: two successes in a row, or an Oracle Sludge elixir",
"Vein Nettle: needle pain flares every few hours and makes every test harder. Cure: two successes in a day, or distilled Gristle Pear juice and weak acid",
"Whittle Worms: parasites eat nerves; you lose pain and then sight, taste, hearing, smell. Cure: two successes in a row, or a week-long surgery",
"The Wretches: your organs rot and you vomit them up, losing vitality. Cure: three successes in a row, or holy birch tea",
]
CALL = [
"you read by eating the page","bark hardens your skin but dulls your hands","paranoia that the moon is watching","seedlings sprout in your skin","you can smell and taste spilled blood nearby",
"you sense nearby heartbeats","you echolocate by clicking","you despise towns and civilisation","your body wastes to a corpse-like look","you never forget a smell",
"your body hair grows thick","you wake exactly when you meant to","you accept your own insignificance and feel little suffering","twitchy eyes see tiny details and traps","antlers grow from your skull",
"you smell magic","a terrible word lives in your gut and must be shouted daily","you avoid caravans and merchants","you must eat every part of your prey","you predict tomorrow's weather from a treetop",
"you carve symbols into trees or they appear on you","the trees sing to you directions and warnings","a terrifying ghost follows you and warns of ambush","your ears hear every small noise and deafen easily","you can learn the language of the dark between trees",
"your flesh regrows fast but sprouts horrors","your fingernails become claws","fungus in your gut neutralises poison but you must eat double","your limbs lengthen and you gallop on all fours","slitted cat eyes",
"monthly dreams point to a demigod","you cannot digest cooked food","you can howl in terror","you must resist devouring the newly dead","you will not sleep on the ground",
"you go voiceless and read body language and scent","your skeleton goes feral: a longer skull, fangs, longer limbs","you can speak to vermin","you cannot show your face","sharp fangs grow and must be pried out weekly",
"your mind feels little; you resist madness and mind effects","you suddenly know how to build one random artifact","your eyes go pale and iris-less","your blood heals those who drink it","sigils and glyphs appear on your skin",
"your strength follows the moon's fullness","you hear treasure calling","your skin slowly takes on your surroundings' colour","you understand Fangspek, the Ravager tongue","your hair grows a foot a day, tough as silk rope",
]
assert len(CALL)==50
QUIRK = ["Totem Maker: you build grotesque effigies and must hunt for their parts","Scratches: you scratch and carve your own skin","Repeat, Repeat: you must repeat phrases and small acts until they are right","Filthy: you stop bathing or grooming","Idle Chatter: you talk constantly to animals, objects and the sky","Autocannibalism: you eat pieces of yourself"]
MAD = ["Into the Dark: you must press on and find what hides in the Wilds","Offerings: you must feed the Wilds a meal and supplies each night, and no one may stop you","Book of Flesh: you must carve patterns into your own skin","Moon's Lover: sunlight burns; you prefer the night","Sinner's Ghosts: ghosts of those you killed follow and want you dead","Eschew the Shield: you refuse armour and shields"]
DEEP = ["The Weak Are Meat: the fallen are your rightful food, friends included","I'm Home: you will never leave the Wilds again","We're All Just Beasts: you drop language and decency","Metal Is a Sin: no metal may touch you, and you destroy it","The Grand Ritual: you are architect of a vast ritual and nothing may stop you","Too Much Skin: you must remove your skin and find others who dance flayed"]
HALLU = ["a friend is your worst enemy","you are surrounded by what you fear most","everything is on fire","the ground is swallowing you","the trees shout insults","the Skulk is watching you"]
PRANK = ["pilfered food: some of your rations are eaten","firebug: oil on your clothes that ignites at a spark","stones thrown at you through the day","thieving hands take some coin or items","hide-and-seek: a great monster is lured to you","bored: they leave and the haunting ends"]
MOON_SPECIAL = ["Blood Moon: encounters and their numbers double; red glow, smell of copper","Demented Moon: madness and mind effects are harder to resist; manic racing light","Conjurer's Moon: magic is stronger but may backfire; aurora shimmer","Gentle Moon: healing doubled and emotions calm; warm steady light","Sower's Moon: life grows rapidly and out of control; spore and spawn in the air","Ref's choice (or none)"]
MOON_NAMES = ["Morislathe: penny-small, jade, flickers","Grun: fist-sized, ghost-pale, hums when full","Auloi: apple-sized, fuchsia, shattered with drifting pieces","Lukattab: fills the sky, corpse-blue, craters like faces","Chandri: wagon-wheel yellow, warm when full","Maane: grapefruit-sized, bone white with red dust, surface changes yearly","Kuut: dark grey, distance and size vary widely","Baretkh: hand-mirror grey with dark holes","Selenea: coin-sized rusted copper with geometric shapes","Goa Kuys: twin moons (roll again for each)"]
LOST_RETURN = ["exactly where you started","a ruined camp with dead adventurers and some of their goods","a burned hut with an unspoiled root cellar of food and strong drink","a rocky den with some stashed gold","a river clearing with a wary, helpful fisherman","standing stones with piles of burnt bodies and a warning in blood","a tree with a lady's face, lit candles and offerings","a shack of crazed monks offering strange meat and dark stories"]
HUNT_TRACK = ["Major setback","Minor setback","Mark, and a minor setback","Mark","Double marks","Double marks, and a boon"]
HUNT_MAJOR = ["Ambush: bandits or ravagers who have followed you strike","Utterly lost: lost for 1d20 days","Maddening Wilds: 1d4 of you roll on the Call of the Wild table","Cursed grove: this stretch of Wilds hosts horror and danger","The beast awakens: an ancient creature wakes in its territory","Stumbled into a court of powerful beings in the middle of something","Crippling injury that persists until medical aid: the crow takes a wound that rests do not remove","The hunters become the hunted: the quarry turns on you","Supplies destroyed: lose 1d6 rations, and a UD die","'Not another step': make camp now and the party loses its expertise uses this rest"]
HUNT_MINOR = ["Lost supplies: lose 1d6 rations","Sleepless night: 1d4 of you gain a bane on tests until a rest completes","Vermin nest: low-level vermin hungry for travellers","Lost the tracks: lost for 1d6 days","Arduous terrain: spend a ration or take a bane on the next travel test","Unfriendly locals: ruffians or xenophobes; bloodshed possible","Horrid quagmire: a fetid swamp, slow if avoided, dangerous if crossed","Cutting flora: blood-tasting brush, 1d6 to each","Hostile fauna: a wild animal seeks you (roll the animal encounter table for the habitat)","Rot pit: offal and disease; roll a disease on a tier 1 Strength RR"]
HUNT_BOON = ["Hospice: a remote cabin; the party takes a full rest safely","Hidden cache: 1d6 rations and a little coin","The trail revealed: an extra mark","Friendly hunters offer a trade for news and supplies","Healing spring: bathing removes a wound","Magic grove: healing fruit or a wondrous item (Ref's call)","Unhindered: wildlife ignores you for the day","Mysterious guide offers help for a price"]
GOODS_UNCOMMON = ["a handful of organs of a strange sort","tight springy tendons","healthy unbroken bones","an unscathed skull","a fresh heart","delicious bone marrow","undamaged organs","a good hide","very clean teeth","a still-wet tongue"]
GOODS_RARE = ["an organ that writhes like an earthworm","a bone that hums when struck","an eye whose colours shift in the light","nervous tissue that clings and twists like ivy","a preposterously perfect pelt","a heart that twitches in the moonlight","bile that eats metal and nothing else","a live vestigial twin","a brain that seems to whisper","a row of teeth fused together"]
TASK_MINOR = ["root out a den of rabid coyotes","clear a trail of underbrush","protect a deer giving birth","purify a water source","move a ravenous fish out of a pond","help a village with its harvest","cure a pack of animals","defeat a small camp of Ravagers","stop a cannibalistic hunter","return a spellbook to its owner"]
TASK_MAJOR = ["fend off a pack of Primal Skaals","stop a Rittermotte mad with bloodlust","find an artifact hidden in the Wilds","steal a treasure from a Bauik hive","defuse a dispute between a village and the Wilds","save a rare species of bird","join the fight against a wildfire","stem the spread of a disease","close a portal leaking evil","destroy the meeting place of a cabal of evil druids"]
TASK_GRAND = ["slay a mad Linnorm","broker peace between a country and the Wilds","trap the Skulk","prevent the Sorrow-Hunt","perform an ancient and powerful ritual","save a captive from a Wild Elf fortress","find a long-lost demigod","find and burn the most ancient Curseweald","stop a pandemic of Treewylding","find the beating heart of the Wilds"]
LORD_TITLE = ["Earl/Earless","Baron/Baroness","Count/Countess","Duke/Duchess"]
LORD_NAME = ["Argamel","Cail'lundol","Madadh","Lup-Laicom","Fenn","Borriean"]
LORD_CLAIM = ["The Thrice Stitched","First of the Seers","Speaker for the Nightmare","The Sevenfold Alpha","Of the Elder Sap","The Silver Singer","Keeper of the Bones","The Sorrow-Song"]
LORD_DESC = ["a giant wolf in jewels and a crown","a headless human with green fire from the wound","two mortals stitched at the waist who speak in unison","a beautiful head nested in writhing vines","a blinding white glowing elk","an elegant skeleton woven with red and gold silk","a swarm of spiders with gems in their abdomens","the severed head of a beast that moves and talks","a black frog riding a glorious deer","whispers and humming"]
LORD_NOTES = ["despises mortal civilisation","mourns a long-dead love","patrols the Wilds' edge","demands tribute from mortals","fights unnatural horrors","personal guardian of the Lady","grudge against Ravagers","rules the swamps","record-keeper of the Wilds","speaks for the trees","secretly helps those in need","lost the Lady's favour"]
