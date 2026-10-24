# TBE conversion sim (20000 fights per cell, max 30 rounds)

Rates are per attack. Rounds count only fights that ended in incapacitation.

## 1. TBE: hit, wound and incapacitation

| weapon | target | skill | hit_rate | wound_rate | wound_per_hit | armor_pen | incap_by_r3 | incap_ever | median_rounds | mean_rounds |
|---|---|---|---|---|---|---|---|---|---|---|
| M16A2 | no_armor | 30 | 26% | 26% | 100% | - | 32% | 100% | 5.0 | 6.8 |
| M16A2 | no_armor | 50 | 46% | 46% | 100% | - | 57% | 100% | 3.0 | 3.7 |
| M16A2 | no_armor | 70 | 65% | 65% | 100% | - | 78% | 100% | 2.0 | 2.5 |
| M16A2 | flak | 30 | 26% | 26% | 100% | 100% | 24% | 100% | 7.0 | 8.0 |
| M16A2 | flak | 50 | 45% | 45% | 100% | 100% | 47% | 100% | 4.0 | 4.3 |
| M16A2 | flak | 70 | 65% | 65% | 100% | 100% | 72% | 100% | 3.0 | 2.9 |
| M16A2 | flak_helmet | 30 | 26% | 26% | 100% | 100% | 20% | 100% | 7.0 | 8.5 |
| M16A2 | flak_helmet | 50 | 45% | 45% | 100% | 100% | 39% | 100% | 4.0 | 4.8 |
| M16A2 | flak_helmet | 70 | 65% | 65% | 100% | 100% | 66% | 100% | 3.0 | 3.2 |
| M16A2 | plate | 30 | 26% | 25% | 98% | 92% | 12% | 98% | 10.0 | 10.9 |
| M16A2 | plate | 50 | 45% | 45% | 99% | 93% | 35% | 100% | 5.0 | 5.3 |
| M16A2 | plate | 70 | 65% | 64% | 99% | 93% | 61% | 100% | 3.0 | 3.3 |
| M16A2 | plate_helmet | 30 | 26% | 25% | 98% | 94% | 9% | 97% | 11.0 | 11.8 |
| M16A2 | plate_helmet | 50 | 45% | 45% | 99% | 93% | 26% | 100% | 5.0 | 6.0 |
| M16A2 | plate_helmet | 70 | 65% | 64% | 99% | 93% | 53% | 100% | 3.0 | 3.7 |
| AK-74 | no_armor | 30 | 26% | 26% | 100% | - | 37% | 100% | 5.0 | 6.1 |
| AK-74 | no_armor | 50 | 45% | 45% | 100% | - | 62% | 100% | 3.0 | 3.4 |
| AK-74 | no_armor | 70 | 65% | 65% | 100% | - | 82% | 100% | 2.0 | 2.3 |
| AK-74 | flak | 30 | 26% | 26% | 100% | 100% | 29% | 100% | 6.0 | 7.1 |
| AK-74 | flak | 50 | 45% | 45% | 100% | 100% | 53% | 100% | 3.0 | 3.9 |
| AK-74 | flak | 70 | 65% | 65% | 100% | 100% | 77% | 100% | 2.0 | 2.6 |
| AK-74 | flak_helmet | 30 | 26% | 26% | 100% | 100% | 26% | 100% | 6.0 | 7.5 |
| AK-74 | flak_helmet | 50 | 45% | 45% | 100% | 100% | 47% | 100% | 4.0 | 4.3 |
| AK-74 | flak_helmet | 70 | 65% | 65% | 100% | 100% | 72% | 100% | 3.0 | 2.9 |
| AK-74 | plate | 30 | 26% | 25% | 98% | 92% | 15% | 98% | 9.0 | 10.0 |
| AK-74 | plate | 50 | 45% | 45% | 99% | 93% | 40% | 100% | 4.0 | 4.9 |
| AK-74 | plate | 70 | 65% | 64% | 99% | 92% | 66% | 100% | 3.0 | 3.1 |
| AK-74 | plate_helmet | 30 | 26% | 25% | 98% | 94% | 11% | 98% | 10.0 | 10.8 |
| AK-74 | plate_helmet | 50 | 45% | 45% | 99% | 94% | 30% | 100% | 5.0 | 5.6 |
| AK-74 | plate_helmet | 70 | 65% | 64% | 99% | 93% | 58% | 100% | 3.0 | 3.5 |
| M9 | no_armor | 30 | 26% | 26% | 100% | - | 19% | 99% | 8.0 | 9.7 |
| M9 | no_armor | 50 | 46% | 46% | 100% | - | 38% | 100% | 4.0 | 5.1 |
| M9 | no_armor | 70 | 65% | 65% | 100% | - | 59% | 100% | 3.0 | 3.4 |
| M9 | flak | 30 | 26% | 20% | 77% | 0% | 8% | 90% | 13.0 | 13.8 |
| M9 | flak | 50 | 45% | 39% | 87% | 0% | 22% | 100% | 6.0 | 7.1 |
| M9 | flak | 70 | 65% | 59% | 91% | 0% | 43% | 100% | 4.0 | 4.2 |
| M9 | flak_helmet | 30 | 26% | 19% | 74% | 0% | 3% | 87% | 15.0 | 15.6 |
| M9 | flak_helmet | 50 | 45% | 38% | 85% | 0% | 12% | 100% | 7.0 | 8.1 |
| M9 | flak_helmet | 70 | 65% | 58% | 89% | 0% | 31% | 100% | 4.0 | 4.9 |
| M9 | plate | 30 | 26% | 20% | 77% | 0% | 8% | 90% | 13.0 | 13.8 |
| M9 | plate | 50 | 45% | 39% | 87% | 0% | 22% | 100% | 6.0 | 7.1 |
| M9 | plate | 70 | 65% | 59% | 91% | 0% | 43% | 100% | 4.0 | 4.3 |
| M9 | plate_helmet | 30 | 26% | 19% | 74% | 0% | 2% | 87% | 15.0 | 15.7 |
| M9 | plate_helmet | 50 | 45% | 38% | 85% | 0% | 12% | 100% | 7.0 | 8.1 |
| M9 | plate_helmet | 70 | 65% | 58% | 90% | 0% | 31% | 100% | 4.0 | 4.9 |
| PKM | no_armor | 30 | 26% | 26% | 100% | - | 43% | 100% | 4.0 | 5.3 |
| PKM | no_armor | 50 | 45% | 45% | 100% | - | 70% | 100% | 2.0 | 2.9 |
| PKM | no_armor | 70 | 65% | 65% | 100% | - | 89% | 100% | 2.0 | 2.0 |
| PKM | flak | 30 | 26% | 26% | 100% | 100% | 39% | 100% | 5.0 | 5.7 |
| PKM | flak | 50 | 46% | 46% | 100% | 100% | 67% | 100% | 3.0 | 3.2 |
| PKM | flak | 70 | 65% | 65% | 100% | 100% | 86% | 100% | 2.0 | 2.1 |
| PKM | flak_helmet | 30 | 25% | 25% | 100% | 100% | 38% | 100% | 5.0 | 5.9 |
| PKM | flak_helmet | 50 | 45% | 45% | 100% | 100% | 63% | 100% | 3.0 | 3.3 |
| PKM | flak_helmet | 70 | 65% | 65% | 100% | 100% | 84% | 100% | 2.0 | 2.3 |
| PKM | plate | 30 | 26% | 26% | 100% | 100% | 34% | 100% | 5.0 | 6.4 |
| PKM | plate | 50 | 45% | 45% | 100% | 100% | 61% | 100% | 3.0 | 3.5 |
| PKM | plate | 70 | 65% | 65% | 100% | 100% | 83% | 100% | 2.0 | 2.3 |
| PKM | plate_helmet | 30 | 26% | 26% | 100% | 100% | 32% | 100% | 5.0 | 6.6 |
| PKM | plate_helmet | 50 | 45% | 45% | 100% | 100% | 58% | 100% | 3.0 | 3.6 |
| PKM | plate_helmet | 70 | 65% | 65% | 100% | 100% | 80% | 100% | 2.0 | 2.5 |
| M2HB | no_armor | 30 | 26% | 26% | 100% | - | 45% | 100% | 4.0 | 5.1 |
| M2HB | no_armor | 50 | 45% | 45% | 100% | - | 71% | 100% | 2.0 | 2.9 |
| M2HB | no_armor | 70 | 65% | 65% | 100% | - | 88% | 100% | 2.0 | 2.0 |
| M2HB | flak | 30 | 26% | 26% | 100% | 100% | 45% | 100% | 4.0 | 5.2 |
| M2HB | flak | 50 | 45% | 45% | 100% | 100% | 70% | 100% | 2.0 | 3.0 |
| M2HB | flak | 70 | 65% | 65% | 100% | 100% | 87% | 100% | 2.0 | 2.1 |
| M2HB | flak_helmet | 30 | 25% | 25% | 100% | 100% | 44% | 100% | 4.0 | 5.3 |
| M2HB | flak_helmet | 50 | 45% | 45% | 100% | 100% | 68% | 100% | 2.0 | 3.0 |
| M2HB | flak_helmet | 70 | 65% | 65% | 100% | 100% | 86% | 100% | 2.0 | 2.1 |
| M2HB | plate | 30 | 26% | 26% | 100% | 100% | 40% | 100% | 4.0 | 5.6 |
| M2HB | plate | 50 | 45% | 45% | 100% | 100% | 67% | 100% | 2.0 | 3.1 |
| M2HB | plate | 70 | 65% | 65% | 100% | 100% | 87% | 100% | 2.0 | 2.1 |
| M2HB | plate_helmet | 30 | 25% | 25% | 100% | 100% | 39% | 100% | 5.0 | 5.7 |
| M2HB | plate_helmet | 50 | 45% | 45% | 100% | 100% | 66% | 100% | 3.0 | 3.2 |
| M2HB | plate_helmet | 70 | 65% | 65% | 100% | 100% | 85% | 100% | 2.0 | 2.2 |

## 2. Rounds to incapacitation, TBE vs native 4e

| weapon | target | skill | TBE_incap_by_r3 | 4e_incap_by_r3 | TBE_median_rounds | 4e_median_rounds | TBE_mean_rounds | 4e_mean_rounds |
|---|---|---|---|---|---|---|---|---|
| M16A2 | no_armor | 30 | 32% | 64% | 5.0 | 3.0 | 6.8 | 3.3 |
| M16A2 | no_armor | 50 | 57% | 86% | 3.0 | 2.0 | 3.7 | 2.2 |
| M16A2 | no_armor | 70 | 78% | 95% | 2.0 | 2.0 | 2.5 | 1.8 |
| M16A2 | flak | 30 | 24% | 45% | 7.0 | 4.0 | 8.0 | 4.3 |
| M16A2 | flak | 50 | 47% | 76% | 4.0 | 2.0 | 4.3 | 2.8 |
| M16A2 | flak | 70 | 72% | 90% | 3.0 | 2.0 | 2.9 | 2.2 |
| M16A2 | flak_helmet | 30 | 20% | 39% | 7.0 | 4.0 | 8.5 | 4.7 |
| M16A2 | flak_helmet | 50 | 39% | 71% | 4.0 | 3.0 | 4.8 | 3.0 |
| M16A2 | flak_helmet | 70 | 66% | 88% | 3.0 | 2.0 | 3.2 | 2.3 |
| M16A2 | plate | 30 | 12% | 31% | 10.0 | 5.0 | 10.9 | 5.9 |
| M16A2 | plate | 50 | 35% | 55% | 5.0 | 3.0 | 5.3 | 3.7 |
| M16A2 | plate | 70 | 61% | 74% | 3.0 | 2.0 | 3.3 | 2.8 |
| M16A2 | plate_helmet | 30 | 9% | 21% | 11.0 | 6.0 | 11.8 | 7.1 |
| M16A2 | plate_helmet | 50 | 26% | 46% | 5.0 | 4.0 | 6.0 | 4.2 |
| M16A2 | plate_helmet | 70 | 53% | 69% | 3.0 | 3.0 | 3.7 | 3.0 |
| AK-74 | no_armor | 30 | 37% | 70% | 5.0 | 2.0 | 6.1 | 2.9 |
| AK-74 | no_armor | 50 | 62% | 90% | 3.0 | 2.0 | 3.4 | 2.0 |
| AK-74 | no_armor | 70 | 82% | 96% | 2.0 | 1.0 | 2.3 | 1.6 |
| AK-74 | flak | 30 | 29% | 54% | 6.0 | 3.0 | 7.1 | 3.8 |
| AK-74 | flak | 50 | 53% | 81% | 3.0 | 2.0 | 3.9 | 2.5 |
| AK-74 | flak | 70 | 77% | 92% | 2.0 | 2.0 | 2.6 | 2.0 |
| AK-74 | flak_helmet | 30 | 26% | 50% | 6.0 | 4.0 | 7.5 | 4.1 |
| AK-74 | flak_helmet | 50 | 47% | 78% | 4.0 | 2.0 | 4.3 | 2.7 |
| AK-74 | flak_helmet | 70 | 72% | 90% | 3.0 | 2.0 | 2.9 | 2.1 |
| AK-74 | plate | 30 | 15% | 39% | 9.0 | 4.0 | 10.0 | 5.1 |
| AK-74 | plate | 50 | 40% | 63% | 4.0 | 3.0 | 4.9 | 3.3 |
| AK-74 | plate | 70 | 66% | 80% | 3.0 | 2.0 | 3.1 | 2.5 |
| AK-74 | plate_helmet | 30 | 11% | 29% | 10.0 | 5.0 | 10.8 | 6.1 |
| AK-74 | plate_helmet | 50 | 30% | 55% | 5.0 | 3.0 | 5.6 | 3.7 |
| AK-74 | plate_helmet | 70 | 58% | 75% | 3.0 | 2.0 | 3.5 | 2.8 |
| M9 | no_armor | 30 | 19% | 18% | 8.0 | 6.0 | 9.7 | 6.2 |
| M9 | no_armor | 50 | 38% | 53% | 4.0 | 3.0 | 5.1 | 3.7 |
| M9 | no_armor | 70 | 59% | 78% | 3.0 | 2.0 | 3.4 | 2.7 |
| M9 | flak | 30 | 8% | 3% | 13.0 | 11.0 | 13.8 | 11.8 |
| M9 | flak | 50 | 22% | 15% | 6.0 | 6.0 | 7.1 | 7.0 |
| M9 | flak | 70 | 43% | 36% | 4.0 | 4.0 | 4.2 | 4.8 |
| M9 | flak_helmet | 30 | 3% | 1% | 15.0 | 15.0 | 15.6 | 15.8 |
| M9 | flak_helmet | 50 | 12% | 6% | 7.0 | 9.0 | 8.1 | 10.0 |
| M9 | flak_helmet | 70 | 31% | 21% | 4.0 | 6.0 | 4.9 | 6.4 |
| M9 | plate | 30 | 8% | 3% | 13.0 | 11.0 | 13.8 | 11.7 |
| M9 | plate | 50 | 22% | 15% | 6.0 | 7.0 | 7.1 | 7.2 |
| M9 | plate | 70 | 43% | 31% | 4.0 | 5.0 | 4.3 | 5.4 |
| M9 | plate_helmet | 30 | 2% | 1% | 15.0 | 15.0 | 15.7 | 15.9 |
| M9 | plate_helmet | 50 | 12% | 6% | 7.0 | 10.0 | 8.1 | 10.5 |
| M9 | plate_helmet | 70 | 31% | 16% | 4.0 | 7.0 | 4.9 | 7.6 |
| PKM | no_armor | 30 | 43% | 73% | 4.0 | 2.0 | 5.3 | 2.8 |
| PKM | no_armor | 50 | 70% | 92% | 2.0 | 1.0 | 2.9 | 1.8 |
| PKM | no_armor | 70 | 89% | 97% | 2.0 | 1.0 | 2.0 | 1.5 |
| PKM | flak | 30 | 39% | 71% | 5.0 | 2.0 | 5.7 | 2.9 |
| PKM | flak | 50 | 67% | 91% | 3.0 | 2.0 | 3.2 | 1.9 |
| PKM | flak | 70 | 86% | 96% | 2.0 | 1.0 | 2.1 | 1.6 |
| PKM | flak_helmet | 30 | 38% | 71% | 5.0 | 2.0 | 5.9 | 2.9 |
| PKM | flak_helmet | 50 | 63% | 90% | 3.0 | 2.0 | 3.3 | 1.9 |
| PKM | flak_helmet | 70 | 84% | 96% | 2.0 | 1.0 | 2.3 | 1.6 |
| PKM | plate | 30 | 34% | 65% | 5.0 | 3.0 | 6.4 | 3.2 |
| PKM | plate | 50 | 61% | 87% | 3.0 | 2.0 | 3.5 | 2.1 |
| PKM | plate | 70 | 83% | 94% | 2.0 | 1.0 | 2.3 | 1.7 |
| PKM | plate_helmet | 30 | 32% | 62% | 5.0 | 3.0 | 6.6 | 3.4 |
| PKM | plate_helmet | 50 | 58% | 85% | 3.0 | 2.0 | 3.6 | 2.3 |
| PKM | plate_helmet | 70 | 80% | 94% | 2.0 | 2.0 | 2.5 | 1.8 |
| M2HB | no_armor | 30 | 45% | 86% | 4.0 | 2.0 | 5.1 | 2.1 |
| M2HB | no_armor | 50 | 71% | 97% | 2.0 | 1.0 | 2.9 | 1.5 |
| M2HB | no_armor | 70 | 88% | 99% | 2.0 | 1.0 | 2.0 | 1.3 |
| M2HB | flak | 30 | 45% | 78% | 4.0 | 2.0 | 5.2 | 2.5 |
| M2HB | flak | 50 | 70% | 94% | 2.0 | 1.0 | 3.0 | 1.7 |
| M2HB | flak | 70 | 87% | 98% | 2.0 | 1.0 | 2.1 | 1.4 |
| M2HB | flak_helmet | 30 | 44% | 75% | 4.0 | 2.0 | 5.3 | 2.7 |
| M2HB | flak_helmet | 50 | 68% | 93% | 2.0 | 1.0 | 3.0 | 1.8 |
| M2HB | flak_helmet | 70 | 86% | 98% | 2.0 | 1.0 | 2.1 | 1.4 |
| M2HB | plate | 30 | 40% | 76% | 4.0 | 2.0 | 5.6 | 2.6 |
| M2HB | plate | 50 | 67% | 92% | 2.0 | 1.0 | 3.1 | 1.8 |
| M2HB | plate | 70 | 87% | 97% | 2.0 | 1.0 | 2.1 | 1.5 |
| M2HB | plate_helmet | 30 | 39% | 74% | 5.0 | 2.0 | 5.7 | 2.7 |
| M2HB | plate_helmet | 50 | 66% | 92% | 3.0 | 1.0 | 3.2 | 1.8 |
| M2HB | plate_helmet | 70 | 85% | 97% | 2.0 | 1.0 | 2.2 | 1.6 |

### Native 4e detail

| weapon | target | skill | hit_rate | wound_rate | wound_per_hit | armor_pen | incap_by_r3 | incap_ever | median_rounds | mean_rounds |
|---|---|---|---|---|---|---|---|---|---|---|
| M16A2 | no_armor | 30 | 48% | 48% | 100% | - | 64% | 100% | 3.0 | 3.3 |
| M16A2 | no_armor | 50 | 68% | 68% | 100% | - | 86% | 100% | 2.0 | 2.2 |
| M16A2 | no_armor | 70 | 79% | 79% | 100% | - | 95% | 100% | 2.0 | 1.8 |
| M16A2 | flak | 30 | 48% | 48% | 100% | 100% | 45% | 100% | 4.0 | 4.3 |
| M16A2 | flak | 50 | 69% | 69% | 100% | 100% | 76% | 100% | 2.0 | 2.8 |
| M16A2 | flak | 70 | 79% | 79% | 100% | 100% | 90% | 100% | 2.0 | 2.2 |
| M16A2 | flak_helmet | 30 | 48% | 48% | 100% | 100% | 39% | 100% | 4.0 | 4.7 |
| M16A2 | flak_helmet | 50 | 69% | 69% | 100% | 100% | 71% | 100% | 3.0 | 3.0 |
| M16A2 | flak_helmet | 70 | 79% | 79% | 100% | 100% | 88% | 100% | 2.0 | 2.3 |
| M16A2 | plate | 30 | 48% | 32% | 67% | 13% | 31% | 100% | 5.0 | 5.9 |
| M16A2 | plate | 50 | 69% | 52% | 76% | 37% | 55% | 100% | 3.0 | 3.7 |
| M16A2 | plate | 70 | 79% | 67% | 85% | 58% | 74% | 100% | 2.0 | 2.8 |
| M16A2 | plate_helmet | 30 | 48% | 32% | 67% | 34% | 21% | 100% | 6.0 | 7.1 |
| M16A2 | plate_helmet | 50 | 69% | 53% | 76% | 53% | 46% | 100% | 4.0 | 4.2 |
| M16A2 | plate_helmet | 70 | 79% | 67% | 85% | 69% | 69% | 100% | 3.0 | 3.0 |
| AK-74 | no_armor | 30 | 47% | 47% | 100% | - | 70% | 100% | 2.0 | 2.9 |
| AK-74 | no_armor | 50 | 69% | 69% | 100% | - | 90% | 100% | 2.0 | 2.0 |
| AK-74 | no_armor | 70 | 79% | 79% | 100% | - | 96% | 100% | 1.0 | 1.6 |
| AK-74 | flak | 30 | 48% | 48% | 100% | 100% | 54% | 100% | 3.0 | 3.8 |
| AK-74 | flak | 50 | 69% | 69% | 100% | 100% | 81% | 100% | 2.0 | 2.5 |
| AK-74 | flak | 70 | 79% | 79% | 100% | 100% | 92% | 100% | 2.0 | 2.0 |
| AK-74 | flak_helmet | 30 | 48% | 48% | 100% | 100% | 50% | 100% | 4.0 | 4.1 |
| AK-74 | flak_helmet | 50 | 69% | 69% | 100% | 100% | 78% | 100% | 2.0 | 2.7 |
| AK-74 | flak_helmet | 70 | 79% | 79% | 100% | 100% | 90% | 100% | 2.0 | 2.1 |
| AK-74 | plate | 30 | 48% | 34% | 72% | 13% | 39% | 100% | 4.0 | 5.1 |
| AK-74 | plate | 50 | 69% | 55% | 80% | 36% | 63% | 100% | 3.0 | 3.3 |
| AK-74 | plate | 70 | 79% | 68% | 87% | 57% | 80% | 100% | 2.0 | 2.5 |
| AK-74 | plate_helmet | 30 | 48% | 35% | 72% | 34% | 29% | 100% | 5.0 | 6.1 |
| AK-74 | plate_helmet | 50 | 68% | 55% | 80% | 53% | 55% | 100% | 3.0 | 3.7 |
| AK-74 | plate_helmet | 70 | 79% | 69% | 86% | 68% | 75% | 100% | 2.0 | 2.8 |
| M9 | no_armor | 30 | 48% | 48% | 100% | - | 18% | 100% | 6.0 | 6.2 |
| M9 | no_armor | 50 | 69% | 69% | 100% | - | 53% | 100% | 3.0 | 3.7 |
| M9 | no_armor | 70 | 79% | 79% | 100% | - | 78% | 100% | 2.0 | 2.7 |
| M9 | flak | 30 | 48% | 28% | 58% | 0% | 3% | 99% | 11.0 | 11.8 |
| M9 | flak | 50 | 69% | 41% | 60% | 5% | 15% | 100% | 6.0 | 7.0 |
| M9 | flak | 70 | 79% | 53% | 67% | 20% | 36% | 100% | 4.0 | 4.8 |
| M9 | flak_helmet | 30 | 48% | 19% | 41% | 0% | 1% | 91% | 15.0 | 15.8 |
| M9 | flak_helmet | 50 | 69% | 30% | 44% | 5% | 6% | 100% | 9.0 | 10.0 |
| M9 | flak_helmet | 70 | 79% | 42% | 53% | 20% | 21% | 100% | 6.0 | 6.4 |
| M9 | plate | 30 | 48% | 28% | 58% | 0% | 3% | 99% | 11.0 | 11.7 |
| M9 | plate | 50 | 69% | 40% | 58% | 0% | 15% | 100% | 7.0 | 7.2 |
| M9 | plate | 70 | 79% | 46% | 58% | 0% | 31% | 100% | 5.0 | 5.4 |
| M9 | plate_helmet | 30 | 48% | 19% | 41% | 0% | 1% | 90% | 15.0 | 15.9 |
| M9 | plate_helmet | 50 | 69% | 29% | 42% | 1% | 6% | 99% | 10.0 | 10.5 |
| M9 | plate_helmet | 70 | 79% | 35% | 44% | 5% | 16% | 100% | 7.0 | 7.6 |
| PKM | no_armor | 30 | 48% | 48% | 100% | - | 73% | 100% | 2.0 | 2.8 |
| PKM | no_armor | 50 | 69% | 69% | 100% | - | 92% | 100% | 1.0 | 1.8 |
| PKM | no_armor | 70 | 79% | 79% | 100% | - | 97% | 100% | 1.0 | 1.5 |
| PKM | flak | 30 | 48% | 48% | 100% | 100% | 71% | 100% | 2.0 | 2.9 |
| PKM | flak | 50 | 68% | 68% | 100% | 100% | 91% | 100% | 2.0 | 1.9 |
| PKM | flak | 70 | 79% | 79% | 100% | 100% | 96% | 100% | 1.0 | 1.6 |
| PKM | flak_helmet | 30 | 48% | 48% | 100% | 100% | 71% | 100% | 2.0 | 2.9 |
| PKM | flak_helmet | 50 | 69% | 69% | 100% | 100% | 90% | 100% | 2.0 | 1.9 |
| PKM | flak_helmet | 70 | 79% | 79% | 100% | 100% | 96% | 100% | 1.0 | 1.6 |
| PKM | plate | 30 | 48% | 48% | 100% | 100% | 65% | 100% | 3.0 | 3.2 |
| PKM | plate | 50 | 69% | 69% | 100% | 100% | 87% | 100% | 2.0 | 2.1 |
| PKM | plate | 70 | 79% | 79% | 100% | 100% | 94% | 100% | 1.0 | 1.7 |
| PKM | plate_helmet | 30 | 48% | 48% | 100% | 100% | 62% | 100% | 3.0 | 3.4 |
| PKM | plate_helmet | 50 | 69% | 69% | 100% | 100% | 85% | 100% | 2.0 | 2.3 |
| PKM | plate_helmet | 70 | 79% | 79% | 100% | 100% | 94% | 100% | 2.0 | 1.8 |
| M2HB | no_armor | 30 | 48% | 48% | 100% | - | 86% | 100% | 2.0 | 2.1 |
| M2HB | no_armor | 50 | 69% | 69% | 100% | - | 97% | 100% | 1.0 | 1.5 |
| M2HB | no_armor | 70 | 79% | 79% | 100% | - | 99% | 100% | 1.0 | 1.3 |
| M2HB | flak | 30 | 48% | 48% | 100% | 100% | 78% | 100% | 2.0 | 2.5 |
| M2HB | flak | 50 | 69% | 69% | 100% | 100% | 94% | 100% | 1.0 | 1.7 |
| M2HB | flak | 70 | 79% | 79% | 100% | 100% | 98% | 100% | 1.0 | 1.4 |
| M2HB | flak_helmet | 30 | 48% | 48% | 100% | 100% | 75% | 100% | 2.0 | 2.7 |
| M2HB | flak_helmet | 50 | 69% | 69% | 100% | 100% | 93% | 100% | 1.0 | 1.8 |
| M2HB | flak_helmet | 70 | 79% | 79% | 100% | 100% | 98% | 100% | 1.0 | 1.4 |
| M2HB | plate | 30 | 48% | 48% | 100% | 100% | 76% | 100% | 2.0 | 2.6 |
| M2HB | plate | 50 | 69% | 69% | 100% | 100% | 92% | 100% | 1.0 | 1.8 |
| M2HB | plate | 70 | 79% | 79% | 100% | 100% | 97% | 100% | 1.0 | 1.5 |
| M2HB | plate_helmet | 30 | 48% | 48% | 100% | 100% | 74% | 100% | 2.0 | 2.7 |
| M2HB | plate_helmet | 50 | 69% | 69% | 100% | 100% | 92% | 100% | 1.0 | 1.8 |
| M2HB | plate_helmet | 70 | 79% | 79% | 100% | 100% | 97% | 100% | 1.0 | 1.6 |

## 3. Flags

- **NEAR-USELESS** M16A2 vs plate_helmet @ 30%: incap_by_r3 9% vs 32% unarmored (0.27x)
- **NEAR-USELESS** AK-74 vs plate_helmet @ 30%: incap_by_r3 11% vs 37% unarmored (0.31x)
- **NEAR-USELESS** M9 vs flak_helmet @ 30%: incap_by_r3 3% vs 19% unarmored (0.13x)
- **NEAR-USELESS** M9 vs flak_helmet @ 50%: incap_by_r3 12% vs 38% unarmored (0.30x)
- **NEAR-USELESS** M9 vs plate_helmet @ 30%: incap_by_r3 2% vs 19% unarmored (0.13x)
- **NEAR-USELESS** M9 vs plate_helmet @ 50%: incap_by_r3 12% vs 38% unarmored (0.30x)
- **ARMOR IRRELEVANT** PKM vs flak @ 70%: incap_by_r3 86% vs 89% unarmored (0.97x)
- **ARMOR IRRELEVANT** M2HB vs flak @ 30%: incap_by_r3 45% vs 45% unarmored (0.99x)
- **ARMOR IRRELEVANT** M2HB vs flak @ 50%: incap_by_r3 70% vs 71% unarmored (0.98x)
- **ARMOR IRRELEVANT** M2HB vs flak @ 70%: incap_by_r3 87% vs 88% unarmored (0.99x)
- **ARMOR IRRELEVANT** M2HB vs flak_helmet @ 30%: incap_by_r3 44% vs 45% unarmored (0.97x)
- **ARMOR IRRELEVANT** M2HB vs flak_helmet @ 50%: incap_by_r3 68% vs 71% unarmored (0.96x)
- **ARMOR IRRELEVANT** M2HB vs flak_helmet @ 70%: incap_by_r3 86% vs 88% unarmored (0.98x)
- **ARMOR IRRELEVANT** M2HB vs plate @ 70%: incap_by_r3 87% vs 88% unarmored (0.98x)
- **ARMOR IRRELEVANT** M2HB vs plate_helmet @ 70%: incap_by_r3 85% vs 88% unarmored (0.96x)
- **DIVERGES FROM 4e** M16A2 vs no_armor @ 30%: mean rounds TBE 6.8 vs 4e 3.3 (2.07x)
- **DIVERGES FROM 4e** M16A2 vs no_armor @ 50%: mean rounds TBE 3.7 vs 4e 2.2 (1.66x)
- **DIVERGES FROM 4e** M16A2 vs flak @ 30%: mean rounds TBE 8.0 vs 4e 4.3 (1.84x)
- **DIVERGES FROM 4e** M16A2 vs flak @ 50%: mean rounds TBE 4.3 vs 4e 2.8 (1.57x)
- **DIVERGES FROM 4e** M16A2 vs flak_helmet @ 30%: mean rounds TBE 8.5 vs 4e 4.7 (1.82x)
- **DIVERGES FROM 4e** M16A2 vs flak_helmet @ 50%: mean rounds TBE 4.8 vs 4e 3.0 (1.61x)
- **DIVERGES FROM 4e** M16A2 vs plate @ 30%: mean rounds TBE 10.9 vs 4e 5.9 (1.84x)
- **DIVERGES FROM 4e** M16A2 vs plate_helmet @ 30%: mean rounds TBE 11.8 vs 4e 7.1 (1.66x)
- **DIVERGES FROM 4e** AK-74 vs no_armor @ 30%: mean rounds TBE 6.1 vs 4e 2.9 (2.08x)
- **DIVERGES FROM 4e** AK-74 vs no_armor @ 50%: mean rounds TBE 3.4 vs 4e 2.0 (1.73x)
- **DIVERGES FROM 4e** AK-74 vs flak @ 30%: mean rounds TBE 7.1 vs 4e 3.8 (1.88x)
- **DIVERGES FROM 4e** AK-74 vs flak @ 50%: mean rounds TBE 3.9 vs 4e 2.5 (1.59x)
- **DIVERGES FROM 4e** AK-74 vs flak_helmet @ 30%: mean rounds TBE 7.5 vs 4e 4.1 (1.84x)
- **DIVERGES FROM 4e** AK-74 vs flak_helmet @ 50%: mean rounds TBE 4.3 vs 4e 2.7 (1.61x)
- **DIVERGES FROM 4e** AK-74 vs plate @ 30%: mean rounds TBE 10.0 vs 4e 5.1 (1.96x)
- **DIVERGES FROM 4e** AK-74 vs plate_helmet @ 30%: mean rounds TBE 10.8 vs 4e 6.1 (1.78x)
- **DIVERGES FROM 4e** AK-74 vs plate_helmet @ 50%: mean rounds TBE 5.6 vs 4e 3.7 (1.51x)
- **DIVERGES FROM 4e** M9 vs no_armor @ 30%: mean rounds TBE 9.7 vs 4e 6.2 (1.57x)
- **DIVERGES FROM 4e** M9 vs plate_helmet @ 70%: mean rounds TBE 4.9 vs 4e 7.6 (0.64x)
- **DIVERGES FROM 4e** PKM vs no_armor @ 30%: mean rounds TBE 5.3 vs 4e 2.8 (1.90x)
- **DIVERGES FROM 4e** PKM vs no_armor @ 50%: mean rounds TBE 2.9 vs 4e 1.8 (1.62x)
- **DIVERGES FROM 4e** PKM vs flak @ 30%: mean rounds TBE 5.7 vs 4e 2.9 (1.99x)
- **DIVERGES FROM 4e** PKM vs flak @ 50%: mean rounds TBE 3.2 vs 4e 1.9 (1.65x)
- **DIVERGES FROM 4e** PKM vs flak_helmet @ 30%: mean rounds TBE 5.9 vs 4e 2.9 (2.05x)
- **DIVERGES FROM 4e** PKM vs flak_helmet @ 50%: mean rounds TBE 3.3 vs 4e 1.9 (1.72x)
- **DIVERGES FROM 4e** PKM vs plate @ 30%: mean rounds TBE 6.4 vs 4e 3.2 (1.98x)
- **DIVERGES FROM 4e** PKM vs plate @ 50%: mean rounds TBE 3.5 vs 4e 2.1 (1.63x)
- **DIVERGES FROM 4e** PKM vs plate_helmet @ 30%: mean rounds TBE 6.6 vs 4e 3.4 (1.93x)
- **DIVERGES FROM 4e** PKM vs plate_helmet @ 50%: mean rounds TBE 3.6 vs 4e 2.3 (1.62x)
- **DIVERGES FROM 4e** M2HB vs no_armor @ 30%: mean rounds TBE 5.1 vs 4e 2.1 (2.45x)
- **DIVERGES FROM 4e** M2HB vs no_armor @ 50%: mean rounds TBE 2.9 vs 4e 1.5 (1.99x)
- **DIVERGES FROM 4e** M2HB vs no_armor @ 70%: mean rounds TBE 2.0 vs 4e 1.3 (1.59x)
- **DIVERGES FROM 4e** M2HB vs flak @ 30%: mean rounds TBE 5.2 vs 4e 2.5 (2.07x)
- **DIVERGES FROM 4e** M2HB vs flak @ 50%: mean rounds TBE 3.0 vs 4e 1.7 (1.76x)
- **DIVERGES FROM 4e** M2HB vs flak_helmet @ 30%: mean rounds TBE 5.3 vs 4e 2.7 (1.98x)
- **DIVERGES FROM 4e** M2HB vs flak_helmet @ 50%: mean rounds TBE 3.0 vs 4e 1.8 (1.74x)
- **DIVERGES FROM 4e** M2HB vs plate @ 30%: mean rounds TBE 5.6 vs 4e 2.6 (2.15x)
- **DIVERGES FROM 4e** M2HB vs plate @ 50%: mean rounds TBE 3.1 vs 4e 1.8 (1.75x)
- **DIVERGES FROM 4e** M2HB vs plate_helmet @ 30%: mean rounds TBE 5.7 vs 4e 2.7 (2.11x)
- **DIVERGES FROM 4e** M2HB vs plate_helmet @ 50%: mean rounds TBE 3.2 vs 4e 1.8 (1.73x)
