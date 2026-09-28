# T2k 4e → TBE combat simulator

Monte Carlo test of the v1 conversion keys. 4e supplies the stats, TBE resolves the attack, damage and wounds.

```
python3 sim/run.py                    # full sweep, writes sim/out/report.md + results.csv
python3 sim/run.py --trials 2000      # quick pass
python3 -m unittest sim/test_tbe.py   # rule checks
```

Every key, rule constant, tactic and threshold lives in `config.toml`. `"?"` marks a 4e stat not yet supplied, and the run refuses to start until those are filled.

## Files
- `tbe.py`: TBE engine (d100, SL, crits, opposed cascade, two-die location, AP/Piercing, Wound Die + Toughness, impairment, Shock, DT)
- `run.py`: sweep, report, flags
- `test_tbe.py`: book-rule checks plus a pipeline smoke test (fixture numbers only)

## Readings to confirm
- Opposed tie-break follows TBE: Attack (checked against p.20 in the Foundry repo): SL, then critical, then higher die, then higher skill.
- Choose Location and Pierce Armor are gated on rolled SL, as in the attack macro. The attacker picks whichever legal set deals the most WP.
- Ammo-die extra hits deal base Dmg only (no DoS), roll a fresh general location, and take AP and the Wound Die separately.
- A +armor mod adds AP only where armor is worn (`plus_mod_hits_unarmored`).
- Weapon Piercing and the Pierce Armor maneuver stack (`pierce_stacks`).
- Incapacitated = Shock (incl. unconscious/Dying) or DT reached. Toggle others in `[incapacitation]`.
- 4e native comparison is not implemented: the 4e rules are not in the repo.
