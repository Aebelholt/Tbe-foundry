"""Regenerate the map docs from maps/<id>.json so docs and engine never drift."""
import sys, json, engine
mid = sys.argv[1] if len(sys.argv) > 1 else "floating_manor"
M = engine.mapdata(mid); s = {"maps": {}}
LEG = open("map_legend.md").read()
names = {"ground": "Ground floor and island", "upper": "Upper floor", "crypt": "Crypt"}
def body(mode):
    return "\n".join(f"## {names.get(lv, lv)}\n\n```\n{engine.render(s, mid, lv, mode)}\n```\n" for lv in M["levels"])
ref = f"""# {M['title']}: Ref Maps

Ref only. Generated from `crows/engine/maps/{mid}.json`; edit the JSON, not this file. Numbers mark areas (the key is in `crows/src/crows_04_dungeons.txt`). Marks that differ from the player map: {', '.join(f"{lv} ({k}) `{v}`" for lv, d in M['levels'].items() for k, v in d['ref'].items())}.

{LEG}
## Links between maps

""" + "\n".join(f"- {l}" for l in M["links"]) + "\n\n" + open(f"notes_{mid}.md").read() + "\n" + body("ref")
pl = f"""# {M['title']}: Player Maps

The unlabeled survey map. Positions are (x,y).

{LEG}
""" + body("player")
open(f"out/{mid}_ref.md", "w").write(ref); open(f"out/{mid}_player.md", "w").write(pl)
print(len(ref), len(pl))
