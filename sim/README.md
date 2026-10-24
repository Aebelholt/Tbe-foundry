# T2k 4e → TBE combat simulator

Monte Carlo test of the v1 conversion keys. 4e supplies the stats, TBE resolves the attack, damage and wounds.

```
python3 sim/run.py                    # full sweep, writes sim/out/report.md + results.csv
python3 sim/run.py --trials 2000      # quick pass
python3 -m unittest sim/test_tbe.py   # rule checks
python3 sim/run.py --set keys.firearm_bonus=20 --out sim/out/b20   # one-off override
python3 sim/compare.py --vary keys.firearm_bonus=0,20             # A/B any key against 4e
```

Every key, rule constant, tactic and threshold lives in `config.toml`. `"?"` marks a 4e stat not yet supplied, and the run refuses to start until those are filled.

Sources: TBE rules from the Foundry bundle's verbatim book quotes and attack code; 4e stats and native rules from the Player's Manual (2022-08-04): weapons p.100/104, armor p.126, hit capacity p.16, base dice p.44-45, ranged fire and ammo dice p.63-66, damage, armor and crits p.72-76.

## Final keys (v2)
v1 keys plus: `firearm_bonus = 20`, `armor_dos_mode = "stepped"` (DoS through armor in steps of 3), Choose Location = 4e Crit + 2 SL, M9 `cl_cost = 6`.

Final sweep (`out/report.md`): TBE mean rounds to incapacitation are a median 1.04x native 4e, 72/75 matchups within 1.5x and 65/75 within 1.25x. Rifles and machine guns all land within 0.92-1.39x. The three misses are the M9 vs a vest plus helmet at 50-70% skill (0.58-0.63x, TBE faster); that gap persists with Choose Location switched off, so its cause sits elsewhere.

## Files
- `tbe.py`: TBE engine (d100, SL, crits, opposed cascade, two-die location, AP/Piercing, Wound Die + Toughness, impairment, Shock, DT)
- `native.py`: native 4e ranged fire (base dice, ammo dice, armor modifier, penetration limit, ablation, hit capacity, crit tables)
- `run.py`: sweep, report, flags
- `compare.py`: A/B one config value against native 4e (`compare_<key>.md/.csv`)
- `compare_dos.py`: armor DoS modes, maneuvers on and off (`dos_modes.md/.csv`)
- `test_tbe.py`: rule checks for both engines plus a smoke run
- `out/`: latest committed results (`report.md`, `tbe_results.csv`, `native_results.csv`)

## Readings to confirm
- Opposed tie-break follows TBE: Attack (checked against p.20 in the Foundry repo): SL, then critical, then higher die, then higher skill.
- Choose Location and Pierce Armor are gated on rolled SL, as in the attack macro. The attacker picks whichever legal set deals the most WP.
- Ammo-die extra hits deal base Dmg only (no DoS), roll a fresh general location, and take AP and the Wound Die separately.
- A +armor mod adds AP only where armor is worn (4e: "not applied if the target has no armor at all").
- Weapon Piercing and the Pierce Armor maneuver stack (`pierce_stacks`).
- TBE incapacitated = Shock (incl. unconscious/Dying) or DT reached. 4e incapacitated = hit capacity reached, or a crit that kills or leaves the target immobile.
- Both sides: one aimed attack per round at full RoF, SHORT range, no cover, no reloads or jams. TBE target Dodges; 4e ranged fire has no defence roll.
