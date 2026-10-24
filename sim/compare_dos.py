"""Side-by-side test of keys.armor_dos_mode against native 4e.

    python3 sim/compare_dos.py               # modes from run.dos_modes_compared
    python3 sim/compare_dos.py --trials 2000

Writes sim/out/dos_modes.md and dos_modes.csv. Every other key comes from
config.toml unchanged.
"""
import argparse
import copy
import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import run  # noqa: E402


def label(mode, maneuvers):
    return mode + ("" if maneuvers else "_noman")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("-c", "--config", default=str(Path(__file__).parent / "config.toml"))
    ap.add_argument("--trials", type=int)
    args = ap.parse_args()
    cfg = run.load(args.config)
    if args.trials:
        cfg["run"]["trials"] = args.trials
    missing = run.missing_values(cfg)
    if missing:
        sys.exit("Cannot run, still '?': " + ", ".join(missing))

    modes = [(m, man) for man in cfg["run"]["dos_compare_maneuvers"] for m in cfg["run"]["dos_modes_compared"]]
    k = f"incap_by_r{cfg['run']['incap_by_round']}"
    results = {}
    nat = None
    for mode, man in modes:
        c = copy.deepcopy(cfg)
        c["keys"]["armor_dos_mode"] = mode
        c["tactics"]["use_choose_location"] = c["tactics"]["use_pierce_armor"] = man
        print(f"mode {mode}, maneuvers {man}", file=sys.stderr)
        rows, nrows = run.sweep(c, with_native=nat is None)
        results[label(mode, man)] = rows
        nat = nat or nrows

    combined = []
    for i, nr in enumerate(nat):
        row = {"weapon": nr["weapon"], "target": nr["target"], "skill": nr["skill"],
               "4e_armor_pen": nr["armor_pen"], "4e_" + k: nr[k], "4e_mean_rounds": nr["mean_rounds"]}
        for m in results:
            r = results[m][i]
            row[m + "_armor_pen"] = r["armor_pen"]
            row[m + "_" + k] = r[k]
            row[m + "_mean_rounds"] = r["mean_rounds"]
            row[m + "_vs_4e"] = (r["mean_rounds"] / nr["mean_rounds"]
                                 if r["mean_rounds"] and nr["mean_rounds"] else None)
        combined.append(row)

    out = Path(cfg["run"]["out_dir"])
    out.mkdir(parents=True, exist_ok=True)
    with open(out / "dos_modes.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(combined[0]))
        w.writeheader()
        w.writerows(combined)

    def cell(col, v):
        if v is None:
            return "-"
        if col.endswith("_vs_4e"):
            return f"{v:.2f}x"
        return run.fmt(col, v)

    def table(cols, rows):
        L = ["| " + " | ".join(cols) + " |", "|" + "---|" * len(cols)]
        return L + ["| " + " | ".join(cell(c, r[c]) for c in cols) + " |" for r in rows]

    armored = [r for r in combined if cfg["target"][r["target"]]["wears"]]
    tol = cfg["flags"]["native_rounds_ratio"]
    L = [f"# Armor DoS modes vs native 4e ({cfg['run']['trials']} fights per cell)", "",
         "armor_pen = share of primary hits on fresh armor that wound (4e: before any ablation).",
         "Only keys.armor_dos_mode and the maneuver toggles vary; all other keys as in config.toml.",
         "`_noman` = Choose Location and Pierce Armor off. Native 4e has no called shots modelled.", "",
         "## Summary", "",
         "| mode | mean rounds vs 4e (median of cells) | cells within " + f"{tol}x" + " of 4e | armored cells within |",
         "|---|---|---|---|"]
    names = list(results)
    for m in names:
        ratios = sorted(r[m + "_vs_4e"] for r in combined if r[m + "_vs_4e"])
        within = sum(1 / tol < x < tol for x in ratios)
        aw = sum(1 / tol < r[m + "_vs_4e"] < tol for r in armored if r[m + "_vs_4e"])
        L.append(f"| {m} | {ratios[len(ratios) // 2]:.2f}x | {within}/{len(combined)} | {aw}/{len(armored)} |")
    L += ["", "## Primary-hit penetration on fresh armor", ""]
    L += table(["weapon", "target", "skill", "4e_armor_pen"] + [m + "_armor_pen" for m in names], armored)
    L += ["", "## Mean rounds to incapacitation", ""]
    L += table(["weapon", "target", "skill", "4e_mean_rounds"] +
               [c for m in names for c in (m + "_mean_rounds", m + "_vs_4e")], combined)
    (out / "dos_modes.md").write_text("\n".join(L) + "\n")
    print(f"wrote {out / 'dos_modes.md'}")


if __name__ == "__main__":
    main()
