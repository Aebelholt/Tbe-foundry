"""Monte Carlo sweep: 4e weapons x 4e armor x attacker profile, resolved in
TBE and (for comparison) in native 4e.

    python3 sim/run.py                 # uses sim/config.toml
    python3 sim/run.py -c other.toml   # alternate key set
    python3 sim/run.py --trials 2000   # quick pass
"""
import argparse
import csv
import random
import statistics
import sys
import tomllib
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import native  # noqa: E402
import tbe  # noqa: E402

MISSING = "?"


def load(path):
    with open(path, "rb") as f:
        return tomllib.load(f)


def missing_values(cfg):
    """Every '?' reachable from the configured matchups."""
    out = []
    for w in cfg["run"]["weapons"]:
        stats = cfg["weapon"].get(w)
        if stats is None:
            out.append(f"weapon.{w}: not defined")
            continue
        out += [f"weapon.{w}.{k}" for k, v in stats.items() if v == MISSING]
    for t in cfg["run"]["targets"]:
        for a in cfg["target"][t]["wears"]:
            out += [f"armor.{a}.{k}" for k, v in cfg["armor"][a].items() if v == MISSING]
    out += [f"defender.{k}" for k, v in cfg["defender"].items() if v == MISSING]
    return list(dict.fromkeys(out))


def pct(attr, skill, keys):
    return keys["attribute_pct"][attr] + keys["skill_pct"][skill]


def tbe_weapon(stats, keys):
    return {"bonus": keys["firearm_bonus"] if stats.get("firearm", True) else 0,
            "dmg": stats["damage"] * keys["damage_mult"], "crit": stats["crit"],
            "cl_cost": max(stats["crit"] + keys["choose_location_extra"], keys["choose_location_min"]),
            "armor_mod": stats["armor_mod"], "ammo_dice": stats["ammo_dice"],
            "blast": stats.get("blast", 0)}


def armor_levels(target_name, cfg):
    """4e location -> armor level (only the best piece counts, PM p.72)."""
    lv = {}
    for a in cfg["target"][target_name]["wears"]:
        piece = cfg["armor"][a]
        lv[piece["location"]] = max(lv.get(piece["location"], 0), piece["rating"])
    return lv


def worn_ap(target_name, cfg):
    keys = cfg["keys"]
    return {tloc: lvl * keys["armor_mult"]
            for loc, lvl in armor_levels(target_name, cfg).items()
            for tloc in keys["location_map"][loc]}


# ------------------------------------------------------------------ TBE
def tbe_fight(weapon, skill, target_name, cfg, rng):
    d, keys = cfg["defender"], cfg["keys"]
    t = tbe.Target(toughness=d["toughness"], death_threshold=d["death_threshold"],
                   endurance=pct(d["str"], d["endurance_skill"], keys), worn_ap=worn_ap(target_name, cfg),
                   resolve_vs_shock=d["resolve_vs_shock"])
    dodge = pct(d["agl"], d["dodge_skill"], keys)
    log = []
    for rnd in range(1, cfg["run"]["max_rounds"] + 1):
        r = tbe.attack(t, weapon, skill + weapon["bonus"], dodge, cfg, rng)
        if weapon["blast"]:
            imp, wp = tbe.blast(t, weapon, dodge, cfg, rng)
            r["impaired"] |= imp
            r["wounded"] |= wp > 0
        log.append(r)
        if tbe.incapacitated(t, cfg["incapacitation"]):
            return rnd, log, t.dead
    return None, log, False


# ------------------------------------------------------------------ native 4e
def native_fight(stats, attr, skill, target_name, cfg, rng):
    n, d = cfg["native_4e"], cfg["defender"]
    hc = -(-(n["die_sizes"][d["str"]] + n["die_sizes"][d["agl"]]) // 4)
    t = native.Target(hit_capacity=hc, armor=armor_levels(target_name, cfg))
    log = []
    for rnd in range(1, cfg["run"]["max_rounds"] + 1):
        log.append(native.attack(t, stats, attr, skill, n, rng))
        if t.incapacitated:
            return rnd, log, t.dead
    return None, log, False


def summarise(results, n, by, extra):
    attacks = sum(len(log) for _, log, _ in results)
    hits = sum(r["hit"] for _, log, _ in results for r in log)
    wounds = sum(r["wounded"] for _, log, _ in results for r in log)
    rounds = [rnd for rnd, _, _ in results if rnd is not None]
    armored = sum(r["armored_primary"] for _, log, _ in results for r in log)
    pen = sum(r["armored_primary_pen"] for _, log, _ in results for r in log)
    row = dict(extra)
    row.update({
        "hit_rate": hits / attacks,
        "wound_rate": wounds / attacks,
        "wound_per_hit": wounds / hits if hits else 0.0,
        "armor_pen": pen / armored if armored else None,
        f"incap_by_r{by}": sum(r <= by for r in rounds) / n,
        "incap_ever": len(rounds) / n,
        "dead_share": sum(dead for _, _, dead in results) / n,
        "median_rounds": statistics.median(rounds) if rounds else None,
        "mean_rounds": statistics.fmean(rounds) if rounds else None,
    })
    return row


def sweep(cfg, with_native=True):
    rng = random.Random(cfg["run"]["seed"])
    n, by, keys = cfg["run"]["trials"], cfg["run"]["incap_by_round"], cfg["keys"]
    tbe_rows, nat_rows = [], []
    for wname in cfg["run"]["weapons"]:
        stats = cfg["weapon"][wname]
        w = tbe_weapon(stats, keys)
        for tname in cfg["run"]["targets"]:
            for attr, skill in cfg["run"]["attackers"]:
                s = pct(attr, skill, keys)
                base = {"weapon": wname, "target": tname, "skill": s, "profile": attr + skill}
                res = [tbe_fight(w, s, tname, cfg, rng) for _ in range(n)]
                tbe_rows.append(summarise(res, n, by, base))
                if with_native and cfg["native_4e"]["enabled"]:
                    res = [native_fight(stats, attr, skill, tname, cfg, rng) for _ in range(n)]
                    nat_rows.append(summarise(res, n, by, base))
                print(f"  {wname:6} {tname:13} {attr}{skill} ({s}%)", file=sys.stderr)
    return tbe_rows, nat_rows


# ------------------------------------------------------------------ report
def flags(rows, nat_rows, cfg):
    f = cfg["flags"]
    key = f"incap_by_r{cfg['run']['incap_by_round']}"
    armored = lambda r: bool(cfg["target"][r["target"]]["wears"])  # noqa: E731
    base = {(r["weapon"], r["skill"]): r for r in rows if not armored(r)}
    out = []
    for r in rows:
        tag = f"{r['weapon']} vs {r['target']} @ {r['skill']}%"
        b = base.get((r["weapon"], r["skill"]))
        if armored(r) and b:
            ratio = r[key] / b[key] if b[key] else 1.0
            if r["wound_per_hit"] < f["useless_wound_per_hit"]:
                out.append(("NEAR-USELESS", tag, f"only {r['wound_per_hit']:.0%} of hits wound"))
            elif ratio < f["useless_incap_ratio"]:
                out.append(("NEAR-USELESS", tag, f"{key} {r[key]:.0%} vs {b[key]:.0%} unarmored ({ratio:.2f}x)"))
            elif ratio >= f["irrelevant_incap_ratio"]:
                out.append(("ARMOR IRRELEVANT", tag, f"{key} {r[key]:.0%} vs {b[key]:.0%} unarmored ({ratio:.2f}x)"))
    for r, nr in zip(rows, nat_rows):
        a, b = r["mean_rounds"], nr["mean_rounds"]
        tag = f"{r['weapon']} vs {r['target']} @ {r['skill']}%"
        if a is None or b is None:
            if a != b:
                out.append(("DIVERGES FROM 4e", tag, f"mean rounds TBE {fmt('x_rounds', a)} vs 4e {fmt('x_rounds', b)}"))
        elif max(a, b) / min(a, b) >= f["native_rounds_ratio"]:
            out.append(("DIVERGES FROM 4e", tag, f"mean rounds TBE {a:.1f} vs 4e {b:.1f} ({a / b:.2f}x)"))
    return out


def fmt(col, v):
    if v is None:
        return "-"
    if col.endswith("_rounds"):
        return f"{v:.1f}"
    return f"{v:.0%}" if isinstance(v, float) else str(v)


def table(rows, cols):
    lines = ["| " + " | ".join(cols) + " |", "|" + "---|" * len(cols)]
    lines += ["| " + " | ".join(fmt(c, r[c]) for c in cols) + " |" for r in rows]
    return lines


def report(rows, nat_rows, flag_list, cfg, path):
    by = cfg["run"]["incap_by_round"]
    k = f"incap_by_r{by}"
    cols = ["weapon", "target", "skill", "hit_rate", "wound_rate", "wound_per_hit", "armor_pen", k, "incap_ever", "median_rounds", "mean_rounds"]
    L = [f"# TBE conversion sim ({cfg['run']['trials']} fights per cell, max {cfg['run']['max_rounds']} rounds)", "",
         "Rates are per attack. Rounds count only fights that ended in incapacitation.", "",
         "## 1. TBE: hit, wound and incapacitation", ""]
    L += table(rows, cols)
    if nat_rows:
        L += ["", "## 2. Rounds to incapacitation, TBE vs native 4e", ""]
        cmp = [{"weapon": r["weapon"], "target": r["target"], "skill": r["skill"],
                "TBE_" + k: r[k], "4e_" + k: nr[k],
                "TBE_median_rounds": r["median_rounds"], "4e_median_rounds": nr["median_rounds"],
                "TBE_mean_rounds": r["mean_rounds"], "4e_mean_rounds": nr["mean_rounds"]}
               for r, nr in zip(rows, nat_rows)]
        L += table(cmp, list(cmp[0]))
        L += ["", "### Native 4e detail", ""]
        L += table(nat_rows, cols)
    L += ["", "## 3. Flags", ""]
    L += [f"- **{kind}** {t}: {why}" for kind, t, why in flag_list] or ["- none"]
    Path(path).write_text("\n".join(L) + "\n")


def apply_override(cfg, item):
    """'keys.firearm_bonus=20' -> cfg['keys']['firearm_bonus'] = 20 (TOML value syntax)."""
    path, value = item.split("=", 1)
    *parents, leaf = path.split(".")
    node = cfg
    for p in parents:
        node = node[p]
    if leaf not in node:
        sys.exit(f"--set: unknown key {path}")
    node[leaf] = tomllib.loads(f"v = {value}")["v"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("-c", "--config", default=str(Path(__file__).parent / "config.toml"))
    ap.add_argument("--trials", type=int)
    ap.add_argument("--set", action="append", default=[], metavar="SECTION.KEY=VALUE",
                    help="override one config value for this run, e.g. keys.firearm_bonus=20")
    ap.add_argument("--out", help="output folder (default run.out_dir)")
    args = ap.parse_args()
    cfg = load(args.config)
    if args.trials:
        cfg["run"]["trials"] = args.trials
    for item in args.set:
        apply_override(cfg, item)
    if args.out:
        cfg["run"]["out_dir"] = args.out

    missing = missing_values(cfg)
    if missing:
        print("Cannot run: these values are still '?' in the config:")
        print("\n".join("  " + m for m in missing))
        sys.exit(2)

    rows, nat_rows = sweep(cfg)
    out = Path(cfg["run"]["out_dir"])
    out.mkdir(parents=True, exist_ok=True)
    for name, data in (("tbe_results.csv", rows), ("native_results.csv", nat_rows)):
        if data:
            with open(out / name, "w", newline="") as f:
                wr = csv.DictWriter(f, fieldnames=list(data[0]))
                wr.writeheader()
                wr.writerows(data)
    report(rows, nat_rows, flags(rows, nat_rows, cfg), cfg, out / "report.md")
    print(f"wrote {out / 'report.md'}")


if __name__ == "__main__":
    main()
