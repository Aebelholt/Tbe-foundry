#!/usr/bin/env python3
"""Build ../tables_wyrd.json from the paraphrased data. Run: python3 build_tables.py"""
import json, os
import data_a as A, data_b as B
SRC = "W&W"
def even(n, sides):
    """n entries over a die with `sides` faces; returns (lo,hi) ranges"""
    out, lo = [], 1
    for i in range(n):
        hi = round((i + 1) * sides / n)
        out.append((lo, hi)); lo = hi + 1
    return out
def table(tid, title, src, die, texts, note=None):
    sides = int(die[1:])
    rng = even(len(texts), sides) if len(texts) != sides else [(i, i) for i in range(1, sides + 1)]
    t = dict(id=tid, title=title, src=src, die=die, mod=None,
             entries=[dict(lo=lo, hi=hi, text=x) for (lo, hi), x in zip(rng, texts)])
    if note: t["note"] = note
    return t
HOUSE = "Paraphrased from Into the Wyrd and Wild (private use, all rights reserved by the publisher). Crows conversions marked 'Crows:' are HOUSE proposals, not printed Crows rules."
T = []
T.append(table("wyrd_locations", "A Hundred Wyrd Locations", "W&W 224-237", "d100", A.LOCATIONS, HOUSE + " Use as a POI or a place on a hex."))
T.append(table("wyrd_hazards", "Wyrd hazards and traps", "W&W 208-213", "d100", B.HAZARDS, HOUSE + " 21 entries spread over d100. Roll `table wyrd_hazards`, then the crow's test is a Crows RR with the stat shown."))
T.append(table("wyrd_flora", "Wild flora", "W&W 200-203", "d20", B.FLORA, HOUSE + " Effects are qualitative; the Ref rules any number and logs it."))
T.append(table("wyrd_diseases", "Wilderness diseases", "W&W 204-207", "d12", B.DISEASES, HOUSE + " Crows prints no disease rule. House procedure: at each rest end the crow makes a Strength RR; tier 3 counts as a success toward the cure; tier 1 worsens the disease one step."))
T.append(table("wyrd_body_search", "I search the body and find", "W&W 214", "d50", A.BODY, HOUSE))
T.append(table("wyrd_trails", "Random trails and paths", "W&W 215", "d50", A.TRAILS, HOUSE))
T.append(table("wyrd_dungeon_prefix", "Wilderness dungeon name: first word", "W&W 216", "d50", A.NAME_PREFIX, HOUSE + " Roll prefix and suffix separately: `prefix of suffix` (the suffix already includes its 'of' or 'of the')."))
T.append(table("wyrd_dungeon_suffix", "Wilderness dungeon name: suffix", "W&W 216", "d50", A.NAME_SUFFIX, HOUSE))
T.append(table("wyrd_dungeon_danger", "Wilderness dungeon: the danger", "W&W 217", "d50", A.DANGER, HOUSE))
T.append(table("wyrd_dungeon_secret", "Wilderness dungeon: the secret or treasure", "W&W 217", "d50", A.SECRET, HOUSE))
T.append(table("wyrd_call_of_the_wild", "The Call of the Wild (a lasting change)", "W&W 22-24", "d50", B.CALL, HOUSE + " Suggested trigger for a Crows game: a crow who has gone through a Miasma Effects result of 13+, or survived a legendary creature. Flavour first; the Ref rules any mechanical effect and logs it."))
T.append(table("wyrd_madness_quirk", "Madness: quirks", "W&W 26", "d6", B.QUIRK, HOUSE + " Texture for a crow or NPC at a given cruelty level (R27)."))
T.append(table("wyrd_madness_mad", "Madness: mad", "W&W 27", "d6", B.MAD, HOUSE))
T.append(table("wyrd_madness_deep", "Madness: deep", "W&W 27-28", "d6", B.DEEP, HOUSE))
T.append(table("wyrd_hallucination", "Hallucination", "W&W 211", "d6", B.HALLU, HOUSE))
T.append(table("wyrd_skull_children_prank", "Skull Children prank (per night)", "W&W 212", "d6", B.PRANK, HOUSE))
T.append(table("wyrd_moon_special", "Special moon", "W&W 21", "d6", B.MOON_SPECIAL, HOUSE + " Special moons replace a full moon at the Ref's discretion."))
T.append(table("wyrd_moon_names", "Moon names (flavour)", "W&W 21", "d10", B.MOON_NAMES, HOUSE))
T.append(table("wyrd_lost_return", "Where you end up when found again", "W&W 25", "d8", B.LOST_RETURN, HOUSE))
T.append(table("wyrd_hunt_track", "Hunt: tracking result (per day)", "W&W 16", "d6", B.HUNT_TRACK, HOUSE))
T.append(table("wyrd_hunt_major", "Hunt: major setback", "W&W 17", "d10", B.HUNT_MAJOR, HOUSE + " Resources scaled to Crows (rations, UD, wounds, expertise uses)."))
T.append(table("wyrd_hunt_minor", "Hunt: minor setback", "W&W 17", "d10", B.HUNT_MINOR, HOUSE))
T.append(table("wyrd_hunt_boon", "Hunt: boon", "W&W 17", "d8", B.HUNT_BOON, HOUSE))
T.append(table("wyrd_goods_uncommon", "Cleaning a body: uncommon good", "W&W 19", "d10", B.GOODS_UNCOMMON, HOUSE + " Flavour for a harvest rest activity (R15). Prices and crafting use Crows' (C36, C42)."))
T.append(table("wyrd_goods_rare", "Cleaning a body: rare good", "W&W 19", "d10", B.GOODS_RARE, HOUSE))
T.append(table("wyrd_task_minor", "Patron bargain: minor task", "W&W 143", "d10", B.TASK_MINOR, HOUSE + " Quest seeds for a patron like Ei-Criomoran."))
T.append(table("wyrd_task_major", "Patron bargain: major task", "W&W 143", "d10", B.TASK_MAJOR, HOUSE))
T.append(table("wyrd_task_grand", "Patron bargain: grand task", "W&W 143", "d10", B.TASK_GRAND, HOUSE))
T.append(table("wyrd_lord_title", "Lord of the Broken Court: title", "W&W 139", "d4", B.LORD_TITLE, HOUSE))
T.append(table("wyrd_lord_name", "Lord of the Broken Court: name", "W&W 139", "d6", B.LORD_NAME, HOUSE))
T.append(table("wyrd_lord_claim", "Lord of the Broken Court: claim", "W&W 139", "d8", B.LORD_CLAIM, HOUSE))
T.append(table("wyrd_lord_desc", "Lord of the Broken Court: appearance", "W&W 139", "d10", B.LORD_DESC, HOUSE))
T.append(table("wyrd_lord_notes", "Lord of the Broken Court: notes", "W&W 139", "d12", B.LORD_NOTES, HOUSE))
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "tables_wyrd.json")
json.dump(T, open(out, "w"), indent=1, ensure_ascii=False)
print("wrote", len(T), "tables,", sum(len(t["entries"]) for t in T), "entries")
