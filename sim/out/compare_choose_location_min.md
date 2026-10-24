# keys.choose_location_min: 0, 3, 4 vs native 4e (20000 fights per cell)

Skill column is the base Skill % before any bonus. Rounds = mean rounds to incapacitation.
Overrides: keys.firearm_bonus=20

## Summary

| choose_location_min | rounds vs 4e (median cell) | cells within 1.5x | unarmored within | armored within | near-useless | armor irrelevant |
|---|---|---|---|---|---|---|
| 0 | 1.05x | 63/75 | 15/15 | 48/60 | 2 | 18 |
| 3 | 1.04x | 63/75 | 15/15 | 48/60 | 2 | 17 |
| 4 | 1.05x | 70/75 | 15/15 | 55/60 | 2 | 17 |

## Per matchup

| weapon | target | skill | 4e_hit | 0_hit | 3_hit | 4_hit | 4e_rounds | 0_rounds | 0_vs_4e | 3_rounds | 3_vs_4e | 4_rounds | 4_vs_4e |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| M16A2 | no_armor | 30 | 48% | 45% | 45% | 45% | 3.3 | 3.7 | 1.14x | 3.7 | 1.14x | 3.7 | 1.14x |
| M16A2 | no_armor | 50 | 69% | 65% | 65% | 65% | 2.2 | 2.5 | 1.13x | 2.5 | 1.14x | 2.5 | 1.14x |
| M16A2 | no_armor | 70 | 79% | 85% | 85% | 85% | 1.8 | 1.9 | 1.02x | 1.9 | 1.02x | 1.9 | 1.02x |
| M16A2 | flak | 30 | 48% | 45% | 45% | 45% | 4.3 | 4.5 | 1.03x | 4.5 | 1.03x | 4.5 | 1.04x |
| M16A2 | flak | 50 | 69% | 65% | 65% | 65% | 2.7 | 2.9 | 1.07x | 2.9 | 1.07x | 2.9 | 1.07x |
| M16A2 | flak | 70 | 79% | 85% | 85% | 85% | 2.2 | 2.1 | 0.99x | 2.1 | 0.99x | 2.1 | 0.99x |
| M16A2 | flak_helmet | 30 | 48% | 45% | 45% | 45% | 4.7 | 5.0 | 1.08x | 5.0 | 1.07x | 5.0 | 1.06x |
| M16A2 | flak_helmet | 50 | 69% | 65% | 65% | 65% | 3.0 | 3.3 | 1.11x | 3.3 | 1.11x | 3.3 | 1.10x |
| M16A2 | flak_helmet | 70 | 79% | 85% | 85% | 85% | 2.3 | 2.4 | 1.04x | 2.4 | 1.04x | 2.4 | 1.04x |
| M16A2 | plate | 30 | 48% | 45% | 45% | 45% | 5.9 | 5.7 | 0.96x | 5.7 | 0.97x | 6.1 | 1.03x |
| M16A2 | plate | 50 | 69% | 65% | 65% | 65% | 3.7 | 3.5 | 0.94x | 3.5 | 0.94x | 3.6 | 0.98x |
| M16A2 | plate | 70 | 79% | 85% | 85% | 85% | 2.8 | 2.4 | 0.87x | 2.4 | 0.86x | 2.5 | 0.89x |
| M16A2 | plate_helmet | 30 | 48% | 45% | 45% | 45% | 7.1 | 6.5 | 0.92x | 6.5 | 0.93x | 6.9 | 0.98x |
| M16A2 | plate_helmet | 50 | 69% | 65% | 65% | 65% | 4.2 | 4.0 | 0.95x | 3.9 | 0.94x | 4.1 | 0.98x |
| M16A2 | plate_helmet | 70 | 79% | 85% | 85% | 85% | 3.0 | 2.8 | 0.90x | 2.8 | 0.90x | 2.8 | 0.93x |
| AK-74 | no_armor | 30 | 48% | 45% | 45% | 45% | 2.9 | 3.4 | 1.19x | 3.4 | 1.18x | 3.4 | 1.18x |
| AK-74 | no_armor | 50 | 69% | 65% | 65% | 65% | 2.0 | 2.3 | 1.17x | 2.3 | 1.16x | 2.3 | 1.16x |
| AK-74 | no_armor | 70 | 79% | 85% | 85% | 85% | 1.6 | 1.7 | 1.05x | 1.7 | 1.04x | 1.7 | 1.05x |
| AK-74 | flak | 30 | 48% | 46% | 45% | 45% | 3.7 | 4.0 | 1.07x | 4.0 | 1.08x | 4.1 | 1.08x |
| AK-74 | flak | 50 | 69% | 65% | 65% | 65% | 2.4 | 2.7 | 1.10x | 2.7 | 1.09x | 2.7 | 1.10x |
| AK-74 | flak | 70 | 79% | 85% | 85% | 85% | 2.0 | 2.0 | 1.01x | 2.0 | 1.01x | 2.0 | 1.01x |
| AK-74 | flak_helmet | 30 | 48% | 45% | 45% | 45% | 4.1 | 4.4 | 1.09x | 4.4 | 1.09x | 4.4 | 1.07x |
| AK-74 | flak_helmet | 50 | 69% | 65% | 65% | 65% | 2.6 | 3.0 | 1.13x | 3.0 | 1.13x | 2.9 | 1.12x |
| AK-74 | flak_helmet | 70 | 79% | 85% | 85% | 85% | 2.1 | 2.2 | 1.05x | 2.2 | 1.05x | 2.2 | 1.04x |
| AK-74 | plate | 30 | 48% | 45% | 45% | 45% | 5.2 | 5.2 | 1.01x | 5.3 | 1.02x | 5.6 | 1.08x |
| AK-74 | plate | 50 | 69% | 65% | 65% | 65% | 3.3 | 3.2 | 0.99x | 3.2 | 0.99x | 3.4 | 1.03x |
| AK-74 | plate | 70 | 79% | 84% | 85% | 85% | 2.5 | 2.3 | 0.91x | 2.3 | 0.91x | 2.3 | 0.93x |
| AK-74 | plate_helmet | 30 | 48% | 45% | 45% | 45% | 6.1 | 5.9 | 0.98x | 6.0 | 0.98x | 6.3 | 1.03x |
| AK-74 | plate_helmet | 50 | 69% | 65% | 65% | 65% | 3.7 | 3.7 | 0.98x | 3.7 | 0.99x | 3.8 | 1.02x |
| AK-74 | plate_helmet | 70 | 79% | 85% | 85% | 85% | 2.8 | 2.6 | 0.94x | 2.6 | 0.94x | 2.7 | 0.96x |
| M9 | no_armor | 30 | 48% | 45% | 45% | 45% | 6.2 | 5.2 | 0.85x | 5.3 | 0.85x | 5.2 | 0.85x |
| M9 | no_armor | 50 | 69% | 65% | 65% | 65% | 3.7 | 3.4 | 0.92x | 3.3 | 0.91x | 3.4 | 0.91x |
| M9 | no_armor | 70 | 79% | 85% | 85% | 85% | 2.7 | 2.4 | 0.87x | 2.4 | 0.87x | 2.4 | 0.88x |
| M9 | flak | 30 | 48% | 45% | 46% | 46% | 11.8 | 7.1 | 0.61x | 7.7 | 0.66x | 8.8 | 0.75x |
| M9 | flak | 50 | 69% | 65% | 65% | 65% | 7.0 | 4.3 | 0.61x | 4.5 | 0.65x | 4.9 | 0.71x |
| M9 | flak | 70 | 79% | 85% | 85% | 85% | 4.7 | 2.9 | 0.62x | 3.1 | 0.65x | 3.2 | 0.68x |
| M9 | flak_helmet | 30 | 48% | 45% | 45% | 45% | 15.8 | 8.1 | 0.51x | 9.1 | 0.58x | 10.6 | 0.67x |
| M9 | flak_helmet | 50 | 69% | 65% | 65% | 65% | 10.0 | 4.9 | 0.49x | 5.2 | 0.52x | 5.8 | 0.58x |
| M9 | flak_helmet | 70 | 79% | 85% | 85% | 85% | 6.4 | 3.4 | 0.52x | 3.5 | 0.55x | 3.8 | 0.59x |
| M9 | plate | 30 | 48% | 45% | 45% | 45% | 11.7 | 7.1 | 0.61x | 7.8 | 0.66x | 8.9 | 0.76x |
| M9 | plate | 50 | 69% | 65% | 65% | 65% | 7.3 | 4.3 | 0.59x | 4.6 | 0.63x | 4.9 | 0.67x |
| M9 | plate | 70 | 79% | 85% | 85% | 85% | 5.4 | 3.0 | 0.55x | 3.1 | 0.57x | 3.2 | 0.59x |
| M9 | plate_helmet | 30 | 48% | 45% | 45% | 45% | 15.8 | 8.1 | 0.51x | 9.1 | 0.57x | 10.6 | 0.67x |
| M9 | plate_helmet | 50 | 69% | 65% | 65% | 65% | 10.6 | 4.9 | 0.46x | 5.3 | 0.50x | 5.7 | 0.54x |
| M9 | plate_helmet | 70 | 79% | 85% | 85% | 85% | 7.7 | 3.4 | 0.44x | 3.5 | 0.46x | 3.7 | 0.49x |
| PKM | no_armor | 30 | 48% | 45% | 45% | 46% | 2.8 | 2.9 | 1.04x | 2.9 | 1.04x | 2.9 | 1.02x |
| PKM | no_armor | 50 | 69% | 65% | 65% | 65% | 1.8 | 2.0 | 1.11x | 2.0 | 1.10x | 2.0 | 1.11x |
| PKM | no_armor | 70 | 79% | 85% | 84% | 85% | 1.5 | 1.5 | 1.02x | 1.5 | 1.03x | 1.5 | 1.02x |
| PKM | flak | 30 | 48% | 45% | 45% | 45% | 2.9 | 3.2 | 1.12x | 3.2 | 1.13x | 3.2 | 1.12x |
| PKM | flak | 50 | 69% | 65% | 65% | 65% | 1.9 | 2.2 | 1.14x | 2.2 | 1.14x | 2.2 | 1.14x |
| PKM | flak | 70 | 79% | 85% | 85% | 84% | 1.6 | 1.6 | 1.03x | 1.6 | 1.03x | 1.6 | 1.03x |
| PKM | flak_helmet | 30 | 48% | 45% | 45% | 45% | 2.9 | 3.4 | 1.17x | 3.4 | 1.17x | 3.4 | 1.17x |
| PKM | flak_helmet | 50 | 69% | 65% | 65% | 65% | 1.9 | 2.3 | 1.19x | 2.3 | 1.18x | 2.3 | 1.19x |
| PKM | flak_helmet | 70 | 79% | 85% | 85% | 85% | 1.6 | 1.7 | 1.07x | 1.7 | 1.08x | 1.7 | 1.07x |
| PKM | plate | 30 | 48% | 45% | 45% | 45% | 3.2 | 3.6 | 1.11x | 3.6 | 1.12x | 3.6 | 1.10x |
| PKM | plate | 50 | 69% | 65% | 65% | 65% | 2.1 | 2.4 | 1.12x | 2.4 | 1.12x | 2.4 | 1.13x |
| PKM | plate | 70 | 79% | 85% | 85% | 85% | 1.7 | 1.8 | 1.01x | 1.8 | 1.02x | 1.8 | 1.01x |
| PKM | plate_helmet | 30 | 48% | 45% | 45% | 45% | 3.4 | 3.8 | 1.10x | 3.8 | 1.10x | 3.8 | 1.11x |
| PKM | plate_helmet | 50 | 69% | 65% | 65% | 65% | 2.2 | 2.5 | 1.14x | 2.5 | 1.14x | 2.6 | 1.14x |
| PKM | plate_helmet | 70 | 79% | 85% | 85% | 85% | 1.8 | 1.9 | 1.03x | 1.9 | 1.04x | 1.9 | 1.04x |
| M2HB | no_armor | 30 | 48% | 45% | 45% | 45% | 2.1 | 2.9 | 1.40x | 2.9 | 1.40x | 2.9 | 1.40x |
| M2HB | no_armor | 50 | 69% | 65% | 65% | 65% | 1.4 | 2.0 | 1.39x | 2.0 | 1.39x | 2.0 | 1.38x |
| M2HB | no_armor | 70 | 79% | 85% | 85% | 85% | 1.3 | 1.5 | 1.18x | 1.5 | 1.18x | 1.5 | 1.18x |
| M2HB | flak | 30 | 48% | 45% | 45% | 45% | 2.5 | 2.9 | 1.16x | 3.0 | 1.16x | 3.0 | 1.16x |
| M2HB | flak | 50 | 69% | 65% | 65% | 65% | 1.7 | 2.1 | 1.24x | 2.1 | 1.24x | 2.1 | 1.24x |
| M2HB | flak | 70 | 79% | 85% | 85% | 85% | 1.4 | 1.5 | 1.10x | 1.5 | 1.11x | 1.5 | 1.11x |
| M2HB | flak_helmet | 30 | 48% | 45% | 45% | 45% | 2.7 | 3.0 | 1.13x | 3.1 | 1.14x | 3.0 | 1.13x |
| M2HB | flak_helmet | 50 | 69% | 64% | 65% | 65% | 1.7 | 2.2 | 1.25x | 2.1 | 1.23x | 2.1 | 1.23x |
| M2HB | flak_helmet | 70 | 79% | 85% | 85% | 85% | 1.4 | 1.6 | 1.12x | 1.6 | 1.13x | 1.6 | 1.12x |
| M2HB | plate | 30 | 48% | 45% | 45% | 45% | 2.6 | 3.2 | 1.21x | 3.1 | 1.21x | 3.2 | 1.21x |
| M2HB | plate | 50 | 68% | 65% | 65% | 64% | 1.8 | 2.1 | 1.20x | 2.2 | 1.20x | 2.2 | 1.20x |
| M2HB | plate | 70 | 79% | 85% | 85% | 85% | 1.5 | 1.6 | 1.06x | 1.6 | 1.06x | 1.6 | 1.06x |
| M2HB | plate_helmet | 30 | 48% | 45% | 45% | 45% | 2.7 | 3.3 | 1.21x | 3.3 | 1.20x | 3.3 | 1.21x |
| M2HB | plate_helmet | 50 | 69% | 64% | 65% | 65% | 1.9 | 2.2 | 1.21x | 2.3 | 1.22x | 2.3 | 1.21x |
| M2HB | plate_helmet | 70 | 79% | 85% | 85% | 85% | 1.5 | 1.7 | 1.09x | 1.7 | 1.08x | 1.7 | 1.08x |

## Flags at choose_location_min = 0

- **ARMOR IRRELEVANT** M16A2 vs flak @ 70%: incap_by_r3 92% vs 95% unarmored (0.97x)
- **ARMOR IRRELEVANT** AK-74 vs flak @ 70%: incap_by_r3 94% vs 96% unarmored (0.97x)
- **ARMOR IRRELEVANT** AK-74 vs flak_helmet @ 70%: incap_by_r3 91% vs 96% unarmored (0.95x)
- **NEAR-USELESS** M9 vs flak_helmet @ 30%: incap_by_r3 12% vs 38% unarmored (0.32x)
- **NEAR-USELESS** M9 vs plate_helmet @ 30%: incap_by_r3 12% vs 38% unarmored (0.31x)
- **ARMOR IRRELEVANT** PKM vs flak @ 50%: incap_by_r3 85% vs 88% unarmored (0.97x)
- **ARMOR IRRELEVANT** PKM vs flak @ 70%: incap_by_r3 97% vs 98% unarmored (0.99x)
- **ARMOR IRRELEVANT** PKM vs flak_helmet @ 70%: incap_by_r3 97% vs 98% unarmored (0.99x)
- **ARMOR IRRELEVANT** PKM vs plate @ 70%: incap_by_r3 96% vs 98% unarmored (0.98x)
- **ARMOR IRRELEVANT** PKM vs plate_helmet @ 70%: incap_by_r3 95% vs 98% unarmored (0.97x)
- **ARMOR IRRELEVANT** M2HB vs flak @ 30%: incap_by_r3 70% vs 71% unarmored (0.99x)
- **ARMOR IRRELEVANT** M2HB vs flak @ 50%: incap_by_r3 87% vs 89% unarmored (0.99x)
- **ARMOR IRRELEVANT** M2HB vs flak @ 70%: incap_by_r3 98% vs 98% unarmored (1.00x)
- **ARMOR IRRELEVANT** M2HB vs flak_helmet @ 30%: incap_by_r3 68% vs 71% unarmored (0.96x)
- **ARMOR IRRELEVANT** M2HB vs flak_helmet @ 50%: incap_by_r3 86% vs 89% unarmored (0.97x)
- **ARMOR IRRELEVANT** M2HB vs flak_helmet @ 70%: incap_by_r3 97% vs 98% unarmored (0.99x)
- **ARMOR IRRELEVANT** M2HB vs plate @ 50%: incap_by_r3 86% vs 89% unarmored (0.97x)
- **ARMOR IRRELEVANT** M2HB vs plate @ 70%: incap_by_r3 97% vs 98% unarmored (0.99x)
- **ARMOR IRRELEVANT** M2HB vs plate_helmet @ 50%: incap_by_r3 85% vs 89% unarmored (0.95x)
- **ARMOR IRRELEVANT** M2HB vs plate_helmet @ 70%: incap_by_r3 97% vs 98% unarmored (0.99x)

## Flags at choose_location_min = 3

- **ARMOR IRRELEVANT** M16A2 vs flak @ 70%: incap_by_r3 91% vs 95% unarmored (0.96x)
- **ARMOR IRRELEVANT** AK-74 vs flak @ 70%: incap_by_r3 94% vs 96% unarmored (0.97x)
- **NEAR-USELESS** M9 vs flak_helmet @ 30%: incap_by_r3 9% vs 37% unarmored (0.25x)
- **NEAR-USELESS** M9 vs plate_helmet @ 30%: incap_by_r3 9% vs 37% unarmored (0.25x)
- **ARMOR IRRELEVANT** PKM vs flak @ 50%: incap_by_r3 85% vs 89% unarmored (0.96x)
- **ARMOR IRRELEVANT** PKM vs flak @ 70%: incap_by_r3 97% vs 98% unarmored (0.99x)
- **ARMOR IRRELEVANT** PKM vs flak_helmet @ 70%: incap_by_r3 96% vs 98% unarmored (0.98x)
- **ARMOR IRRELEVANT** PKM vs plate @ 70%: incap_by_r3 96% vs 98% unarmored (0.98x)
- **ARMOR IRRELEVANT** PKM vs plate_helmet @ 70%: incap_by_r3 95% vs 98% unarmored (0.97x)
- **ARMOR IRRELEVANT** M2HB vs flak @ 30%: incap_by_r3 70% vs 71% unarmored (0.98x)
- **ARMOR IRRELEVANT** M2HB vs flak @ 50%: incap_by_r3 88% vs 88% unarmored (0.99x)
- **ARMOR IRRELEVANT** M2HB vs flak @ 70%: incap_by_r3 98% vs 98% unarmored (1.00x)
- **ARMOR IRRELEVANT** M2HB vs flak_helmet @ 30%: incap_by_r3 68% vs 71% unarmored (0.96x)
- **ARMOR IRRELEVANT** M2HB vs flak_helmet @ 50%: incap_by_r3 86% vs 88% unarmored (0.98x)
- **ARMOR IRRELEVANT** M2HB vs flak_helmet @ 70%: incap_by_r3 98% vs 98% unarmored (0.99x)
- **ARMOR IRRELEVANT** M2HB vs plate @ 50%: incap_by_r3 86% vs 88% unarmored (0.97x)
- **ARMOR IRRELEVANT** M2HB vs plate @ 70%: incap_by_r3 97% vs 98% unarmored (0.99x)
- **ARMOR IRRELEVANT** M2HB vs plate_helmet @ 50%: incap_by_r3 84% vs 88% unarmored (0.95x)
- **ARMOR IRRELEVANT** M2HB vs plate_helmet @ 70%: incap_by_r3 97% vs 98% unarmored (0.99x)

## Flags at choose_location_min = 4

- **ARMOR IRRELEVANT** M16A2 vs flak @ 70%: incap_by_r3 91% vs 95% unarmored (0.96x)
- **ARMOR IRRELEVANT** AK-74 vs flak @ 70%: incap_by_r3 94% vs 96% unarmored (0.97x)
- **ARMOR IRRELEVANT** AK-74 vs flak_helmet @ 70%: incap_by_r3 92% vs 96% unarmored (0.95x)
- **NEAR-USELESS** M9 vs flak_helmet @ 30%: incap_by_r3 7% vs 38% unarmored (0.18x)
- **NEAR-USELESS** M9 vs plate_helmet @ 30%: incap_by_r3 7% vs 38% unarmored (0.18x)
- **ARMOR IRRELEVANT** PKM vs flak @ 50%: incap_by_r3 85% vs 88% unarmored (0.96x)
- **ARMOR IRRELEVANT** PKM vs flak @ 70%: incap_by_r3 97% vs 98% unarmored (0.99x)
- **ARMOR IRRELEVANT** PKM vs flak_helmet @ 70%: incap_by_r3 97% vs 98% unarmored (0.99x)
- **ARMOR IRRELEVANT** PKM vs plate @ 70%: incap_by_r3 96% vs 98% unarmored (0.98x)
- **ARMOR IRRELEVANT** PKM vs plate_helmet @ 70%: incap_by_r3 95% vs 98% unarmored (0.97x)
- **ARMOR IRRELEVANT** M2HB vs flak @ 30%: incap_by_r3 70% vs 71% unarmored (0.99x)
- **ARMOR IRRELEVANT** M2HB vs flak @ 50%: incap_by_r3 87% vs 89% unarmored (0.99x)
- **ARMOR IRRELEVANT** M2HB vs flak @ 70%: incap_by_r3 98% vs 98% unarmored (1.00x)
- **ARMOR IRRELEVANT** M2HB vs flak_helmet @ 30%: incap_by_r3 68% vs 71% unarmored (0.96x)
- **ARMOR IRRELEVANT** M2HB vs flak_helmet @ 50%: incap_by_r3 86% vs 89% unarmored (0.97x)
- **ARMOR IRRELEVANT** M2HB vs flak_helmet @ 70%: incap_by_r3 97% vs 98% unarmored (0.99x)
- **ARMOR IRRELEVANT** M2HB vs plate @ 50%: incap_by_r3 85% vs 89% unarmored (0.96x)
- **ARMOR IRRELEVANT** M2HB vs plate @ 70%: incap_by_r3 97% vs 98% unarmored (0.99x)
- **ARMOR IRRELEVANT** M2HB vs plate_helmet @ 70%: incap_by_r3 97% vs 98% unarmored (0.99x)
