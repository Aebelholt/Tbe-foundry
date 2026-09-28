"""Monte Carlo sweep: 4e weapons x 4e armor x attacker skill, resolved in TBE.

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
    if cfg["native_4e"]["enabled"]:
        out += [f"native_4e.{k}" for k, v in cfg["native_4e"].items() if v == MISSING]
    return list(dict.fromkeys(out))


def skill_pct(spec, keys):
    return keys["attribute_pct"][spec["attribute"]] + keys["skill_pct"][spec["skill"]]


def tbe_weapon(stats, keys):
    return {"dmg": stats["damage"] * keys["damage_mult"], "crit": stats["crit"],
            "armor_mod": stats["armor_mod"], "ammo_dice": stats["ammo_dice"],
            "blast": stats.get("blast", 0)}


def worn_ap(target_name, cfg):
    ap = {}
    for a in cfg["target"][target_name]["wears"]:
        piece = cfg["armor"][a]
        for loc in piece["locations"]:
            ap[loc] = max(ap.get(loc, 0), piece["rating"] * cfg["keys"]["armor_mult"])
    return ap


def fight(weapon, skill, target_name, cfg, rng):
    d = cfg["defender"]
    keys = cfg["keys"]
    t = tbe.Target(toughness=d["toughness"], death_threshold=d["death_threshold"],
                   endurance=skill_pct(d["endurance"], keys), worn_ap=worn_ap(target_name, cfg),
                   resolve_vs_shock=d["resolve_vs_shock"])
    dodge = skill_pct(d["dodge"], keys)
    log = []
    for rnd in range(1, cfg["run"]["max_rounds"] + 1):
        r = tbe.attack(t, weapon, skill, dodge, cfg, rng)
        if weapon["blast"]:
            imp, wp = tbe.blast(t, weapon, dodge, cfg, rng)
            r["impaired"] |= imp
            r["wounded"] |= wp > 0
        log.append(r)
        if tbe.incapacitated(t, cfg["incapacitation"]):
            return rnd, log, t
    return None, log, t


def cell(wname, weapon, skill, target_name, cfg, rng):
    n = cfg["run"]["trials"]
    by = cfg["run"]["incap_by_round"]
    attacks = hits = wounds = imps = 0
    rounds, incap_by, deaths = [], 0, 0
    for _ in range(n):
        rnd, log, t = fight(weapon, skill, target_name, cfg, rng)
        attacks += len(log)
        hits += sum(r["hit"] for r in log)
        wounds += sum(r["wounded"] for r in log)
        imps += sum(r["impaired"] for r in log)
        if rnd is not None:
            rounds.append(rnd)
            incap_by += rnd <= by
            deaths += t.dead
    return {
        "weapon": wname, "target": target_name, "skill": skill,
        "hit_rate": hits / attacks,
        "wound_rate": wounds / attacks,
        "wound_per_hit": wounds / hits if hits else 0.0,
        "impair_rate": imps / attacks,
        f"incap_by_r{by}": incap_by / n,
        "incap_ever": len(rounds) / n,
        "dead_share": deaths / n,
        "mean_rounds": statistics.fmean(rounds) if rounds else None,
        "median_rounds": statistics.median(rounds) if rounds else None,
    }


def flags(rows, cfg):
    f = cfg["flags"]
    key = f"incap_by_r{cfg['run']['incap_by_round']}"
    base = {(r["weapon"], r["skill"]): r for r in rows if not cfg["target"][r["target"]]["wears"]}
    out = []
    for r in rows:
        if not cfg["target"][r["target"]]["wears"]:
            continue
        b = base.get((r["weapon"], r["skill"]))
        if b is None:
            continue
        ratio = r[key] / b[key] if b[key] else 1.0
        tag = f"{r['weapon']} vs {r['target']} @ skill {r['skill']}"
        if r["wound_per_hit"] < f["useless_wound_per_hit"]:
            out.append(("NEAR-USELESS", tag, f"only {r['wound_per_hit']:.0%} of hits wound"))
        elif ratio < f["useless_incap_ratio"]:
            out.append(("NEAR-USELESS", tag, f"{key} {r[key]:.0%} vs {b[key]:.0%} unarmored ({ratio:.2f}x)"))
        elif ratio >= f["irrelevant_incap_ratio"]:
            out.append(("ARMOR IRRELEVANT", tag, f"{key} {r[key]:.0%} vs {b[key]:.0%} unarmored ({ratio:.2f}x)"))
    return out


def fmt(col, v):
    if v is None:
        return "-"
    if col.endswith("_rounds"):
        return f"{v:.1f}"
    return f"{v:.0%}" if isinstance(v, float) else str(v)


def report(rows, flag_list, cfg, path):
    by = cfg["run"]["incap_by_round"]
    cols = ["weapon", "target", "skill", "hit_rate", "wound_rate", "wound_per_hit", "impair_rate",
            f"incap_by_r{by}", "incap_ever", "median_rounds", "mean_rounds"]
    lines = [f"# TBE conversion sim ({cfg['run']['trials']} fights per cell, max {cfg['run']['max_rounds']} rounds)", "",
             "Rates are per attack; rounds count only fights that ended in incapacitation.", "",
             "| " + " | ".join(cols) + " |", "|" + "---|" * len(cols)]
    for r in rows:
        lines.append("| " + " | ".join(fmt(c, r[c]) for c in cols) + " |")
    lines += ["", "## Flags", ""]
    lines += [f"- **{k}** {t}: {why}" for k, t, why in flag_list] or ["- none"]
    if not cfg["native_4e"]["enabled"]:
        lines += ["", "## 4e native comparison", "", "Not run: native 4e resolution is not implemented yet."]
    Path(path).write_text("\n".join(lines) + "\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("-c", "--config", default=str(Path(__file__).parent / "config.toml"))
    ap.add_argument("--trials", type=int)
    args = ap.parse_args()
    cfg = load(args.config)
    if args.trials:
        cfg["run"]["trials"] = args.trials

    missing = missing_values(cfg)
    if missing:
        print("Cannot run: these values are still '?' in the config:")
        print("\n".join("  " + m for m in missing))
        sys.exit(2)

    rng = random.Random(cfg["run"]["seed"])
    rows = []
    for wname in cfg["run"]["weapons"]:
        w = tbe_weapon(cfg["weapon"][wname], cfg["keys"])
        for tname in cfg["run"]["targets"]:
            for skill in cfg["run"]["skills"]:
                rows.append(cell(wname, w, skill, tname, cfg, rng))
                print(f"  {wname:8} {tname:12} skill {skill}", file=sys.stderr)

    out = Path(cfg["run"]["out_dir"])
    out.mkdir(parents=True, exist_ok=True)
    with open(out / "results.csv", "w", newline="") as f:
        wr = csv.DictWriter(f, fieldnames=list(rows[0]))
        wr.writeheader()
        wr.writerows(rows)
    fl = flags(rows, cfg)
    report(rows, fl, cfg, out / "report.md")
    print((out / "report.md").read_text())


if __name__ == "__main__":
    main()
