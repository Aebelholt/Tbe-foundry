"""A/B test one config value against native 4e.

    python3 sim/compare.py --vary keys.firearm_bonus=0,20
    python3 sim/compare.py --vary keys.armor_dos_step=2,3,4 --set tactics.defender_dodges=false

Every other value comes from config.toml (plus any --set). Writes
<out_dir>/compare_<key>.md and .csv.
"""
import argparse
import copy
import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import run  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("-c", "--config", default=str(Path(__file__).parent / "config.toml"))
    ap.add_argument("--vary", required=True, metavar="SECTION.KEY=V1,V2,...")
    ap.add_argument("--set", action="append", default=[], metavar="SECTION.KEY=VALUE")
    ap.add_argument("--trials", type=int)
    args = ap.parse_args()
    cfg = run.load(args.config)
    if args.trials:
        cfg["run"]["trials"] = args.trials
    for item in args.set:
        run.apply_override(cfg, item)
    key, values = args.vary.split("=", 1)
    values = values.split(",")
    missing = run.missing_values(cfg)
    if missing:
        sys.exit("Cannot run, still '?': " + ", ".join(missing))

    k = f"incap_by_r{cfg['run']['incap_by_round']}"
    variants, nat, fl = {}, None, {}
    for v in values:
        c = copy.deepcopy(cfg)
        run.apply_override(c, f"{key}={v}")
        print(f"{key} = {v}", file=sys.stderr)
        rows, nrows = run.sweep(c, with_native=nat is None)
        nat = nat or nrows
        variants[v] = rows
        fl[v] = run.flags(rows, nat, c)

    leaf = key.split(".")[-1]
    combined = []
    for i, nr in enumerate(nat):
        row = {"weapon": nr["weapon"], "target": nr["target"], "skill": nr["skill"],
               "4e_hit": nr["hit_rate"], "4e_" + k: nr[k], "4e_rounds": nr["mean_rounds"]}
        for v, rows in variants.items():
            r = rows[i]
            row[f"{v}_hit"] = r["hit_rate"]
            row[f"{v}_{k}"] = r[k]
            row[f"{v}_rounds"] = r["mean_rounds"]
            row[f"{v}_vs_4e"] = r["mean_rounds"] / nr["mean_rounds"] if r["mean_rounds"] and nr["mean_rounds"] else None
        combined.append(row)

    out = Path(cfg["run"]["out_dir"])
    out.mkdir(parents=True, exist_ok=True)
    with open(out / f"compare_{leaf}.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(combined[0]))
        w.writeheader()
        w.writerows(combined)

    def cell(col, val):
        if val is None:
            return "-"
        if col.endswith("_vs_4e"):
            return f"{val:.2f}x"
        if col.endswith("_rounds"):
            return f"{val:.1f}"
        return run.fmt(col, val)

    tol = cfg["flags"]["native_rounds_ratio"]
    armored = lambda r: bool(cfg["target"][r["target"]]["wears"])  # noqa: E731
    L = [f"# {key}: {', '.join(values)} vs native 4e ({cfg['run']['trials']} fights per cell)", "",
         "Skill column is the base Skill % before any bonus. Rounds = mean rounds to incapacitation.",
         "Overrides: " + (", ".join(args.set) or "none"), "",
         "## Summary", "",
         f"| {leaf} | rounds vs 4e (median cell) | cells within {tol}x | unarmored within | armored within | near-useless | armor irrelevant |",
         "|---|---|---|---|---|---|---|"]
    for v in values:
        ratios = sorted(r[f"{v}_vs_4e"] for r in combined if r[f"{v}_vs_4e"])
        ok = lambda r: r[f"{v}_vs_4e"] and 1 / tol < r[f"{v}_vs_4e"] < tol  # noqa: E731
        unarm = [r for r in combined if not armored(r)]
        arm = [r for r in combined if armored(r)]
        kinds = [f[0] for f in fl[v]]
        L.append(f"| {v} | {ratios[len(ratios) // 2]:.2f}x | {sum(map(ok, combined))}/{len(combined)} | "
                 f"{sum(map(ok, unarm))}/{len(unarm)} | {sum(map(ok, arm))}/{len(arm)} | "
                 f"{kinds.count('NEAR-USELESS')} | {kinds.count('ARMOR IRRELEVANT')} |")
    cols = ["weapon", "target", "skill", "4e_hit"] + [f"{v}_hit" for v in values] + \
           ["4e_rounds"] + [c for v in values for c in (f"{v}_rounds", f"{v}_vs_4e")]
    L += ["", "## Per matchup", "", "| " + " | ".join(cols) + " |", "|" + "---|" * len(cols)]
    L += ["| " + " | ".join(cell(c, r[c]) for c in cols) + " |" for r in combined]
    for v in values:
        L += ["", f"## Flags at {leaf} = {v}", ""]
        L += [f"- **{kind}** {t}: {why}" for kind, t, why in fl[v] if kind != "DIVERGES FROM 4e"] or ["- none"]
    (out / f"compare_{leaf}.md").write_text("\n".join(L) + "\n")
    print(f"wrote {out / f'compare_{leaf}.md'}")


if __name__ == "__main__":
    main()
