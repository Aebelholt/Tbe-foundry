# TBE conversion sim (20000 fights per cell, max 30 rounds)

Rates are per attack. Rounds count only fights that ended in incapacitation.

## 1. TBE: hit, wound and incapacitation

| weapon | target | skill | hit_rate | wound_rate | wound_per_hit | armor_pen | incap_by_r3 | incap_ever | median_rounds | mean_rounds |
|---|---|---|---|---|---|---|---|---|---|---|
| M16A2 | no_armor | 30 | 26% | 26% | 100% | - | 32% | 100% | 5.0 | 6.8 |
| M16A2 | no_armor | 50 | 46% | 46% | 100% | - | 57% | 100% | 3.0 | 3.7 |
| M16A2 | no_armor | 70 | 65% | 65% | 100% | - | 78% | 100% | 2.0 | 2.5 |
| M16A2 | flak | 30 | 26% | 26% | 100% | 100% | 21% | 99% | 7.0 | 8.5 |
| M16A2 | flak | 50 | 45% | 45% | 100% | 100% | 45% | 100% | 4.0 | 4.5 |
| M16A2 | flak | 70 | 65% | 65% | 100% | 100% | 70% | 100% | 3.0 | 2.9 |
| M16A2 | flak_helmet | 30 | 26% | 26% | 100% | 100% | 17% | 99% | 8.0 | 9.1 |
| M16A2 | flak_helmet | 50 | 45% | 45% | 100% | 100% | 36% | 100% | 4.0 | 5.0 |
| M16A2 | flak_helmet | 70 | 65% | 65% | 100% | 100% | 64% | 100% | 3.0 | 3.3 |
| M16A2 | plate | 30 | 26% | 18% | 69% | 0% | 10% | 95% | 11.0 | 12.1 |
| M16A2 | plate | 50 | 45% | 37% | 82% | 0% | 33% | 100% | 5.0 | 5.7 |
| M16A2 | plate | 70 | 65% | 57% | 87% | 0% | 59% | 100% | 3.0 | 3.5 |
| M16A2 | plate_helmet | 30 | 26% | 18% | 68% | 14% | 5% | 93% | 13.0 | 13.5 |
| M16A2 | plate_helmet | 50 | 45% | 37% | 82% | 14% | 22% | 100% | 6.0 | 6.5 |
| M16A2 | plate_helmet | 70 | 65% | 57% | 88% | 14% | 50% | 100% | 3.0 | 3.9 |
| AK-74 | no_armor | 30 | 26% | 26% | 100% | - | 37% | 100% | 5.0 | 6.2 |
| AK-74 | no_armor | 50 | 45% | 45% | 100% | - | 62% | 100% | 3.0 | 3.4 |
| AK-74 | no_armor | 70 | 65% | 65% | 100% | - | 83% | 100% | 2.0 | 2.3 |
| AK-74 | flak | 30 | 26% | 26% | 100% | 100% | 27% | 100% | 6.0 | 7.5 |
| AK-74 | flak | 50 | 45% | 45% | 100% | 100% | 52% | 100% | 3.0 | 4.0 |
| AK-74 | flak | 70 | 65% | 65% | 100% | 100% | 76% | 100% | 2.0 | 2.7 |
| AK-74 | flak_helmet | 30 | 26% | 26% | 100% | 100% | 23% | 100% | 7.0 | 8.0 |
| AK-74 | flak_helmet | 50 | 45% | 45% | 100% | 100% | 44% | 100% | 4.0 | 4.5 |
| AK-74 | flak_helmet | 70 | 65% | 65% | 100% | 100% | 70% | 100% | 3.0 | 3.0 |
| AK-74 | plate | 30 | 26% | 19% | 73% | 0% | 12% | 97% | 10.0 | 11.1 |
| AK-74 | plate | 50 | 45% | 38% | 85% | 0% | 37% | 100% | 4.0 | 5.2 |
| AK-74 | plate | 70 | 65% | 58% | 90% | 0% | 63% | 100% | 3.0 | 3.2 |
| AK-74 | plate_helmet | 30 | 26% | 19% | 74% | 14% | 8% | 95% | 11.0 | 12.2 |
| AK-74 | plate_helmet | 50 | 45% | 38% | 85% | 14% | 27% | 100% | 5.0 | 6.0 |
| AK-74 | plate_helmet | 70 | 65% | 58% | 89% | 14% | 56% | 100% | 3.0 | 3.7 |
| M9 | no_armor | 30 | 26% | 26% | 100% | - | 20% | 99% | 8.0 | 9.5 |
| M9 | no_armor | 50 | 45% | 45% | 100% | - | 37% | 100% | 5.0 | 5.2 |
| M9 | no_armor | 70 | 65% | 65% | 100% | - | 59% | 100% | 3.0 | 3.3 |
| M9 | flak | 30 | 26% | 20% | 77% | 0% | 8% | 90% | 13.0 | 13.8 |
| M9 | flak | 50 | 45% | 39% | 87% | 0% | 23% | 100% | 6.0 | 7.1 |
| M9 | flak | 70 | 65% | 59% | 91% | 0% | 43% | 100% | 4.0 | 4.3 |
| M9 | flak_helmet | 30 | 26% | 19% | 74% | 0% | 3% | 87% | 15.0 | 15.6 |
| M9 | flak_helmet | 50 | 45% | 38% | 85% | 0% | 12% | 100% | 7.0 | 8.1 |
| M9 | flak_helmet | 70 | 65% | 58% | 90% | 0% | 31% | 100% | 4.0 | 4.9 |
| M9 | plate | 30 | 26% | 20% | 77% | 0% | 8% | 90% | 13.0 | 13.8 |
| M9 | plate | 50 | 45% | 39% | 87% | 0% | 22% | 100% | 6.0 | 7.1 |
| M9 | plate | 70 | 65% | 59% | 91% | 0% | 43% | 100% | 4.0 | 4.3 |
| M9 | plate_helmet | 30 | 26% | 19% | 74% | 0% | 2% | 87% | 15.0 | 15.6 |
| M9 | plate_helmet | 50 | 45% | 38% | 85% | 0% | 12% | 100% | 7.0 | 8.1 |
| M9 | plate_helmet | 70 | 65% | 58% | 90% | 0% | 31% | 100% | 4.0 | 4.9 |
| PKM | no_armor | 30 | 26% | 26% | 100% | - | 44% | 100% | 4.0 | 5.3 |
| PKM | no_armor | 50 | 45% | 45% | 100% | - | 71% | 100% | 2.0 | 2.9 |
| PKM | no_armor | 70 | 65% | 65% | 100% | - | 89% | 100% | 2.0 | 2.0 |
| PKM | flak | 30 | 26% | 26% | 100% | 100% | 38% | 100% | 5.0 | 5.8 |
| PKM | flak | 50 | 45% | 45% | 100% | 100% | 65% | 100% | 3.0 | 3.2 |
| PKM | flak | 70 | 65% | 65% | 100% | 100% | 86% | 100% | 2.0 | 2.2 |
| PKM | flak_helmet | 30 | 25% | 25% | 100% | 100% | 36% | 100% | 5.0 | 6.1 |
| PKM | flak_helmet | 50 | 45% | 45% | 100% | 100% | 62% | 100% | 3.0 | 3.4 |
| PKM | flak_helmet | 70 | 65% | 65% | 100% | 100% | 83% | 100% | 2.0 | 2.3 |
| PKM | plate | 30 | 25% | 25% | 100% | 100% | 32% | 100% | 5.0 | 6.7 |
| PKM | plate | 50 | 45% | 45% | 100% | 100% | 60% | 100% | 3.0 | 3.6 |
| PKM | plate | 70 | 65% | 65% | 100% | 100% | 81% | 100% | 2.0 | 2.4 |
| PKM | plate_helmet | 30 | 26% | 26% | 100% | 100% | 29% | 100% | 6.0 | 6.9 |
| PKM | plate_helmet | 50 | 45% | 45% | 100% | 100% | 55% | 100% | 3.0 | 3.8 |
| PKM | plate_helmet | 70 | 64% | 64% | 100% | 100% | 78% | 100% | 2.0 | 2.6 |
| M2HB | no_armor | 30 | 26% | 26% | 100% | - | 46% | 100% | 4.0 | 5.1 |
| M2HB | no_armor | 50 | 45% | 45% | 100% | - | 71% | 100% | 2.0 | 2.9 |
| M2HB | no_armor | 70 | 65% | 65% | 100% | - | 88% | 100% | 2.0 | 2.0 |
| M2HB | flak | 30 | 26% | 26% | 100% | 100% | 45% | 100% | 4.0 | 5.2 |
| M2HB | flak | 50 | 45% | 45% | 100% | 100% | 70% | 100% | 2.0 | 2.9 |
| M2HB | flak | 70 | 65% | 65% | 100% | 100% | 88% | 100% | 2.0 | 2.1 |
| M2HB | flak_helmet | 30 | 26% | 26% | 100% | 100% | 44% | 100% | 4.0 | 5.3 |
| M2HB | flak_helmet | 50 | 45% | 45% | 100% | 100% | 68% | 100% | 2.0 | 3.1 |
| M2HB | flak_helmet | 70 | 65% | 65% | 100% | 100% | 86% | 100% | 2.0 | 2.2 |
| M2HB | plate | 30 | 26% | 26% | 100% | 100% | 39% | 100% | 5.0 | 5.8 |
| M2HB | plate | 50 | 45% | 45% | 100% | 100% | 66% | 100% | 3.0 | 3.2 |
| M2HB | plate | 70 | 65% | 65% | 100% | 100% | 86% | 100% | 2.0 | 2.2 |
| M2HB | plate_helmet | 30 | 26% | 26% | 100% | 100% | 38% | 100% | 5.0 | 6.0 |
| M2HB | plate_helmet | 50 | 45% | 45% | 100% | 100% | 64% | 100% | 3.0 | 3.3 |
| M2HB | plate_helmet | 70 | 65% | 65% | 100% | 100% | 85% | 100% | 2.0 | 2.2 |

## 2. Rounds to incapacitation, TBE vs native 4e

| weapon | target | skill | TBE_incap_by_r3 | 4e_incap_by_r3 | TBE_median_rounds | 4e_median_rounds | TBE_mean_rounds | 4e_mean_rounds |
|---|---|---|---|---|---|---|---|---|
| M16A2 | no_armor | 30 | 32% | 64% | 5.0 | 3.0 | 6.8 | 3.3 |
| M16A2 | no_armor | 50 | 57% | 86% | 3.0 | 2.0 | 3.7 | 2.2 |
| M16A2 | no_armor | 70 | 78% | 95% | 2.0 | 2.0 | 2.5 | 1.8 |
| M16A2 | flak | 30 | 21% | 45% | 7.0 | 4.0 | 8.5 | 4.3 |
| M16A2 | flak | 50 | 45% | 76% | 4.0 | 2.0 | 4.5 | 2.8 |
| M16A2 | flak | 70 | 70% | 90% | 3.0 | 2.0 | 2.9 | 2.2 |
| M16A2 | flak_helmet | 30 | 17% | 40% | 8.0 | 4.0 | 9.1 | 4.6 |
| M16A2 | flak_helmet | 50 | 36% | 71% | 4.0 | 3.0 | 5.0 | 3.0 |
| M16A2 | flak_helmet | 70 | 64% | 88% | 3.0 | 2.0 | 3.3 | 2.3 |
| M16A2 | plate | 30 | 10% | 31% | 11.0 | 5.0 | 12.1 | 5.9 |
| M16A2 | plate | 50 | 33% | 55% | 5.0 | 3.0 | 5.7 | 3.7 |
| M16A2 | plate | 70 | 59% | 74% | 3.0 | 2.0 | 3.5 | 2.8 |
| M16A2 | plate_helmet | 30 | 5% | 22% | 13.0 | 6.0 | 13.5 | 7.1 |
| M16A2 | plate_helmet | 50 | 22% | 46% | 6.0 | 4.0 | 6.5 | 4.2 |
| M16A2 | plate_helmet | 70 | 50% | 68% | 3.0 | 3.0 | 3.9 | 3.0 |
| AK-74 | no_armor | 30 | 37% | 70% | 5.0 | 2.0 | 6.2 | 2.9 |
| AK-74 | no_armor | 50 | 62% | 90% | 3.0 | 2.0 | 3.4 | 2.0 |
| AK-74 | no_armor | 70 | 83% | 96% | 2.0 | 1.0 | 2.3 | 1.6 |
| AK-74 | flak | 30 | 27% | 54% | 6.0 | 3.0 | 7.5 | 3.8 |
| AK-74 | flak | 50 | 52% | 81% | 3.0 | 2.0 | 4.0 | 2.4 |
| AK-74 | flak | 70 | 76% | 92% | 2.0 | 2.0 | 2.7 | 2.0 |
| AK-74 | flak_helmet | 30 | 23% | 49% | 7.0 | 4.0 | 8.0 | 4.1 |
| AK-74 | flak_helmet | 50 | 44% | 78% | 4.0 | 2.0 | 4.5 | 2.6 |
| AK-74 | flak_helmet | 70 | 70% | 91% | 3.0 | 2.0 | 3.0 | 2.1 |
| AK-74 | plate | 30 | 12% | 40% | 10.0 | 4.0 | 11.1 | 5.1 |
| AK-74 | plate | 50 | 37% | 63% | 4.0 | 3.0 | 5.2 | 3.3 |
| AK-74 | plate | 70 | 63% | 80% | 3.0 | 2.0 | 3.2 | 2.5 |
| AK-74 | plate_helmet | 30 | 8% | 28% | 11.0 | 5.0 | 12.2 | 6.2 |
| AK-74 | plate_helmet | 50 | 27% | 55% | 5.0 | 3.0 | 6.0 | 3.7 |
| AK-74 | plate_helmet | 70 | 56% | 75% | 3.0 | 2.0 | 3.7 | 2.8 |
| M9 | no_armor | 30 | 20% | 18% | 8.0 | 6.0 | 9.5 | 6.2 |
| M9 | no_armor | 50 | 37% | 52% | 5.0 | 3.0 | 5.2 | 3.7 |
| M9 | no_armor | 70 | 59% | 78% | 3.0 | 2.0 | 3.3 | 2.7 |
| M9 | flak | 30 | 8% | 3% | 13.0 | 11.0 | 13.8 | 11.8 |
| M9 | flak | 50 | 23% | 16% | 6.0 | 6.0 | 7.1 | 7.0 |
| M9 | flak | 70 | 43% | 36% | 4.0 | 4.0 | 4.3 | 4.8 |
| M9 | flak_helmet | 30 | 3% | 1% | 15.0 | 15.0 | 15.6 | 15.8 |
| M9 | flak_helmet | 50 | 12% | 6% | 7.0 | 9.0 | 8.1 | 10.0 |
| M9 | flak_helmet | 70 | 31% | 21% | 4.0 | 6.0 | 4.9 | 6.4 |
| M9 | plate | 30 | 8% | 3% | 13.0 | 11.0 | 13.8 | 11.7 |
| M9 | plate | 50 | 22% | 15% | 6.0 | 6.0 | 7.1 | 7.2 |
| M9 | plate | 70 | 43% | 31% | 4.0 | 5.0 | 4.3 | 5.3 |
| M9 | plate_helmet | 30 | 2% | 1% | 15.0 | 15.0 | 15.6 | 15.8 |
| M9 | plate_helmet | 50 | 12% | 6% | 7.0 | 10.0 | 8.1 | 10.5 |
| M9 | plate_helmet | 70 | 31% | 15% | 4.0 | 7.0 | 4.9 | 7.7 |
| PKM | no_armor | 30 | 44% | 73% | 4.0 | 2.0 | 5.3 | 2.8 |
| PKM | no_armor | 50 | 71% | 92% | 2.0 | 1.0 | 2.9 | 1.8 |
| PKM | no_armor | 70 | 89% | 97% | 2.0 | 1.0 | 2.0 | 1.5 |
| PKM | flak | 30 | 38% | 71% | 5.0 | 2.0 | 5.8 | 2.9 |
| PKM | flak | 50 | 65% | 90% | 3.0 | 2.0 | 3.2 | 1.9 |
| PKM | flak | 70 | 86% | 97% | 2.0 | 1.0 | 2.2 | 1.6 |
| PKM | flak_helmet | 30 | 36% | 71% | 5.0 | 2.0 | 6.1 | 2.9 |
| PKM | flak_helmet | 50 | 62% | 90% | 3.0 | 2.0 | 3.4 | 1.9 |
| PKM | flak_helmet | 70 | 83% | 96% | 2.0 | 1.0 | 2.3 | 1.6 |
| PKM | plate | 30 | 32% | 65% | 5.0 | 3.0 | 6.7 | 3.2 |
| PKM | plate | 50 | 60% | 86% | 3.0 | 2.0 | 3.6 | 2.1 |
| PKM | plate | 70 | 81% | 95% | 2.0 | 1.0 | 2.4 | 1.7 |
| PKM | plate_helmet | 30 | 29% | 61% | 6.0 | 3.0 | 6.9 | 3.4 |
| PKM | plate_helmet | 50 | 55% | 85% | 3.0 | 2.0 | 3.8 | 2.2 |
| PKM | plate_helmet | 70 | 78% | 94% | 2.0 | 2.0 | 2.6 | 1.8 |
| M2HB | no_armor | 30 | 46% | 85% | 4.0 | 2.0 | 5.1 | 2.1 |
| M2HB | no_armor | 50 | 71% | 97% | 2.0 | 1.0 | 2.9 | 1.4 |
| M2HB | no_armor | 70 | 88% | 99% | 2.0 | 1.0 | 2.0 | 1.3 |
| M2HB | flak | 30 | 45% | 78% | 4.0 | 2.0 | 5.2 | 2.5 |
| M2HB | flak | 50 | 70% | 94% | 2.0 | 1.0 | 2.9 | 1.7 |
| M2HB | flak | 70 | 88% | 98% | 2.0 | 1.0 | 2.1 | 1.4 |
| M2HB | flak_helmet | 30 | 44% | 75% | 4.0 | 2.0 | 5.3 | 2.7 |
| M2HB | flak_helmet | 50 | 68% | 93% | 2.0 | 1.0 | 3.1 | 1.8 |
| M2HB | flak_helmet | 70 | 86% | 98% | 2.0 | 1.0 | 2.2 | 1.4 |
| M2HB | plate | 30 | 39% | 76% | 5.0 | 2.0 | 5.8 | 2.6 |
| M2HB | plate | 50 | 66% | 92% | 3.0 | 1.0 | 3.2 | 1.8 |
| M2HB | plate | 70 | 86% | 97% | 2.0 | 1.0 | 2.2 | 1.5 |
| M2HB | plate_helmet | 30 | 38% | 74% | 5.0 | 2.0 | 6.0 | 2.7 |
| M2HB | plate_helmet | 50 | 64% | 92% | 3.0 | 1.0 | 3.3 | 1.8 |
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
| M16A2 | flak_helmet | 30 | 48% | 48% | 100% | 100% | 40% | 100% | 4.0 | 4.6 |
| M16A2 | flak_helmet | 50 | 69% | 69% | 100% | 100% | 71% | 100% | 3.0 | 3.0 |
| M16A2 | flak_helmet | 70 | 79% | 79% | 100% | 100% | 88% | 100% | 2.0 | 2.3 |
| M16A2 | plate | 30 | 48% | 32% | 67% | 13% | 31% | 100% | 5.0 | 5.9 |
| M16A2 | plate | 50 | 69% | 52% | 76% | 36% | 55% | 100% | 3.0 | 3.7 |
| M16A2 | plate | 70 | 79% | 67% | 84% | 58% | 74% | 100% | 2.0 | 2.8 |
| M16A2 | plate_helmet | 30 | 48% | 32% | 67% | 34% | 22% | 100% | 6.0 | 7.1 |
| M16A2 | plate_helmet | 50 | 69% | 52% | 76% | 52% | 46% | 100% | 4.0 | 4.2 |
| M16A2 | plate_helmet | 70 | 79% | 67% | 84% | 68% | 68% | 100% | 3.0 | 3.0 |
| AK-74 | no_armor | 30 | 48% | 48% | 100% | - | 70% | 100% | 2.0 | 2.9 |
| AK-74 | no_armor | 50 | 69% | 69% | 100% | - | 90% | 100% | 2.0 | 2.0 |
| AK-74 | no_armor | 70 | 80% | 80% | 100% | - | 96% | 100% | 1.0 | 1.6 |
| AK-74 | flak | 30 | 48% | 48% | 100% | 100% | 54% | 100% | 3.0 | 3.8 |
| AK-74 | flak | 50 | 69% | 69% | 100% | 100% | 81% | 100% | 2.0 | 2.4 |
| AK-74 | flak | 70 | 78% | 78% | 100% | 100% | 92% | 100% | 2.0 | 2.0 |
| AK-74 | flak_helmet | 30 | 48% | 48% | 100% | 100% | 49% | 100% | 4.0 | 4.1 |
| AK-74 | flak_helmet | 50 | 69% | 69% | 100% | 100% | 78% | 100% | 2.0 | 2.6 |
| AK-74 | flak_helmet | 70 | 79% | 79% | 100% | 100% | 91% | 100% | 2.0 | 2.1 |
| AK-74 | plate | 30 | 48% | 35% | 72% | 13% | 40% | 100% | 4.0 | 5.1 |
| AK-74 | plate | 50 | 69% | 55% | 80% | 36% | 63% | 100% | 3.0 | 3.3 |
| AK-74 | plate | 70 | 79% | 69% | 87% | 58% | 80% | 100% | 2.0 | 2.5 |
| AK-74 | plate_helmet | 30 | 48% | 34% | 72% | 34% | 28% | 100% | 5.0 | 6.2 |
| AK-74 | plate_helmet | 50 | 69% | 55% | 80% | 52% | 55% | 100% | 3.0 | 3.7 |
| AK-74 | plate_helmet | 70 | 79% | 69% | 87% | 68% | 75% | 100% | 2.0 | 2.8 |
| M9 | no_armor | 30 | 48% | 48% | 100% | - | 18% | 100% | 6.0 | 6.2 |
| M9 | no_armor | 50 | 68% | 68% | 100% | - | 52% | 100% | 3.0 | 3.7 |
| M9 | no_armor | 70 | 79% | 79% | 100% | - | 78% | 100% | 2.0 | 2.7 |
| M9 | flak | 30 | 48% | 28% | 58% | 0% | 3% | 99% | 11.0 | 11.8 |
| M9 | flak | 50 | 69% | 41% | 60% | 6% | 16% | 100% | 6.0 | 7.0 |
| M9 | flak | 70 | 79% | 53% | 67% | 20% | 36% | 100% | 4.0 | 4.8 |
| M9 | flak_helmet | 30 | 48% | 19% | 41% | 0% | 1% | 91% | 15.0 | 15.8 |
| M9 | flak_helmet | 50 | 69% | 30% | 44% | 5% | 6% | 100% | 9.0 | 10.0 |
| M9 | flak_helmet | 70 | 79% | 42% | 53% | 20% | 21% | 100% | 6.0 | 6.4 |
| M9 | plate | 30 | 48% | 28% | 58% | 0% | 3% | 99% | 11.0 | 11.7 |
| M9 | plate | 50 | 69% | 40% | 58% | 0% | 15% | 100% | 6.0 | 7.2 |
| M9 | plate | 70 | 79% | 46% | 58% | 0% | 31% | 100% | 5.0 | 5.3 |
| M9 | plate_helmet | 30 | 48% | 19% | 41% | 0% | 1% | 90% | 15.0 | 15.8 |
| M9 | plate_helmet | 50 | 69% | 29% | 42% | 1% | 6% | 99% | 10.0 | 10.5 |
| M9 | plate_helmet | 70 | 79% | 35% | 44% | 5% | 15% | 100% | 7.0 | 7.7 |
| PKM | no_armor | 30 | 48% | 48% | 100% | - | 73% | 100% | 2.0 | 2.8 |
| PKM | no_armor | 50 | 69% | 69% | 100% | - | 92% | 100% | 1.0 | 1.8 |
| PKM | no_armor | 70 | 79% | 79% | 100% | - | 97% | 100% | 1.0 | 1.5 |
| PKM | flak | 30 | 48% | 48% | 100% | 100% | 71% | 100% | 2.0 | 2.9 |
| PKM | flak | 50 | 68% | 68% | 100% | 100% | 90% | 100% | 2.0 | 1.9 |
| PKM | flak | 70 | 79% | 79% | 100% | 100% | 97% | 100% | 1.0 | 1.6 |
| PKM | flak_helmet | 30 | 48% | 48% | 100% | 100% | 71% | 100% | 2.0 | 2.9 |
| PKM | flak_helmet | 50 | 69% | 69% | 100% | 100% | 90% | 100% | 2.0 | 1.9 |
| PKM | flak_helmet | 70 | 79% | 79% | 100% | 100% | 96% | 100% | 1.0 | 1.6 |
| PKM | plate | 30 | 48% | 48% | 100% | 100% | 65% | 100% | 3.0 | 3.2 |
| PKM | plate | 50 | 69% | 69% | 100% | 100% | 86% | 100% | 2.0 | 2.1 |
| PKM | plate | 70 | 79% | 79% | 100% | 100% | 95% | 100% | 1.0 | 1.7 |
| PKM | plate_helmet | 30 | 48% | 48% | 100% | 100% | 61% | 100% | 3.0 | 3.4 |
| PKM | plate_helmet | 50 | 69% | 69% | 100% | 100% | 85% | 100% | 2.0 | 2.2 |
| PKM | plate_helmet | 70 | 80% | 80% | 100% | 100% | 94% | 100% | 2.0 | 1.8 |
| M2HB | no_armor | 30 | 47% | 47% | 100% | - | 85% | 100% | 2.0 | 2.1 |
| M2HB | no_armor | 50 | 69% | 69% | 100% | - | 97% | 100% | 1.0 | 1.4 |
| M2HB | no_armor | 70 | 79% | 79% | 100% | - | 99% | 100% | 1.0 | 1.3 |
| M2HB | flak | 30 | 49% | 49% | 100% | 100% | 78% | 100% | 2.0 | 2.5 |
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

- **NEAR-USELESS** M16A2 vs plate @ 30%: incap_by_r3 10% vs 32% unarmored (0.32x)
- **NEAR-USELESS** M16A2 vs plate_helmet @ 30%: incap_by_r3 5% vs 32% unarmored (0.16x)
- **NEAR-USELESS** AK-74 vs plate_helmet @ 30%: incap_by_r3 8% vs 37% unarmored (0.21x)
- **NEAR-USELESS** M9 vs flak_helmet @ 30%: incap_by_r3 3% vs 20% unarmored (0.13x)
- **NEAR-USELESS** M9 vs flak_helmet @ 50%: incap_by_r3 12% vs 37% unarmored (0.31x)
- **NEAR-USELESS** M9 vs plate_helmet @ 30%: incap_by_r3 2% vs 20% unarmored (0.12x)
- **NEAR-USELESS** M9 vs plate_helmet @ 50%: incap_by_r3 12% vs 37% unarmored (0.32x)
- **ARMOR IRRELEVANT** PKM vs flak @ 70%: incap_by_r3 86% vs 89% unarmored (0.96x)
- **ARMOR IRRELEVANT** M2HB vs flak @ 30%: incap_by_r3 45% vs 46% unarmored (0.98x)
- **ARMOR IRRELEVANT** M2HB vs flak @ 50%: incap_by_r3 70% vs 71% unarmored (0.99x)
- **ARMOR IRRELEVANT** M2HB vs flak @ 70%: incap_by_r3 88% vs 88% unarmored (1.00x)
- **ARMOR IRRELEVANT** M2HB vs flak_helmet @ 30%: incap_by_r3 44% vs 46% unarmored (0.96x)
- **ARMOR IRRELEVANT** M2HB vs flak_helmet @ 50%: incap_by_r3 68% vs 71% unarmored (0.96x)
- **ARMOR IRRELEVANT** M2HB vs flak_helmet @ 70%: incap_by_r3 86% vs 88% unarmored (0.98x)
- **ARMOR IRRELEVANT** M2HB vs plate @ 70%: incap_by_r3 86% vs 88% unarmored (0.97x)
- **ARMOR IRRELEVANT** M2HB vs plate_helmet @ 70%: incap_by_r3 85% vs 88% unarmored (0.97x)
- **DIVERGES FROM 4e** M16A2 vs no_armor @ 30%: mean rounds TBE 6.8 vs 4e 3.3 (2.07x)
- **DIVERGES FROM 4e** M16A2 vs no_armor @ 50%: mean rounds TBE 3.7 vs 4e 2.2 (1.66x)
- **DIVERGES FROM 4e** M16A2 vs flak @ 30%: mean rounds TBE 8.5 vs 4e 4.3 (1.95x)
- **DIVERGES FROM 4e** M16A2 vs flak @ 50%: mean rounds TBE 4.5 vs 4e 2.8 (1.63x)
- **DIVERGES FROM 4e** M16A2 vs flak_helmet @ 30%: mean rounds TBE 9.1 vs 4e 4.6 (1.97x)
- **DIVERGES FROM 4e** M16A2 vs flak_helmet @ 50%: mean rounds TBE 5.0 vs 4e 3.0 (1.69x)
- **DIVERGES FROM 4e** M16A2 vs plate @ 30%: mean rounds TBE 12.1 vs 4e 5.9 (2.04x)
- **DIVERGES FROM 4e** M16A2 vs plate @ 50%: mean rounds TBE 5.7 vs 4e 3.7 (1.52x)
- **DIVERGES FROM 4e** M16A2 vs plate_helmet @ 30%: mean rounds TBE 13.5 vs 4e 7.1 (1.91x)
- **DIVERGES FROM 4e** M16A2 vs plate_helmet @ 50%: mean rounds TBE 6.5 vs 4e 4.2 (1.55x)
- **DIVERGES FROM 4e** AK-74 vs no_armor @ 30%: mean rounds TBE 6.2 vs 4e 2.9 (2.12x)
- **DIVERGES FROM 4e** AK-74 vs no_armor @ 50%: mean rounds TBE 3.4 vs 4e 2.0 (1.72x)
- **DIVERGES FROM 4e** AK-74 vs flak @ 30%: mean rounds TBE 7.5 vs 4e 3.8 (1.97x)
- **DIVERGES FROM 4e** AK-74 vs flak @ 50%: mean rounds TBE 4.0 vs 4e 2.4 (1.66x)
- **DIVERGES FROM 4e** AK-74 vs flak_helmet @ 30%: mean rounds TBE 8.0 vs 4e 4.1 (1.96x)
- **DIVERGES FROM 4e** AK-74 vs flak_helmet @ 50%: mean rounds TBE 4.5 vs 4e 2.6 (1.70x)
- **DIVERGES FROM 4e** AK-74 vs plate @ 30%: mean rounds TBE 11.1 vs 4e 5.1 (2.17x)
- **DIVERGES FROM 4e** AK-74 vs plate @ 50%: mean rounds TBE 5.2 vs 4e 3.3 (1.58x)
- **DIVERGES FROM 4e** AK-74 vs plate_helmet @ 30%: mean rounds TBE 12.2 vs 4e 6.2 (1.99x)
- **DIVERGES FROM 4e** AK-74 vs plate_helmet @ 50%: mean rounds TBE 6.0 vs 4e 3.7 (1.60x)
- **DIVERGES FROM 4e** M9 vs no_armor @ 30%: mean rounds TBE 9.5 vs 4e 6.2 (1.55x)
- **DIVERGES FROM 4e** M9 vs plate_helmet @ 70%: mean rounds TBE 4.9 vs 4e 7.7 (0.64x)
- **DIVERGES FROM 4e** PKM vs no_armor @ 30%: mean rounds TBE 5.3 vs 4e 2.8 (1.89x)
- **DIVERGES FROM 4e** PKM vs no_armor @ 50%: mean rounds TBE 2.9 vs 4e 1.8 (1.61x)
- **DIVERGES FROM 4e** PKM vs flak @ 30%: mean rounds TBE 5.8 vs 4e 2.9 (2.04x)
- **DIVERGES FROM 4e** PKM vs flak @ 50%: mean rounds TBE 3.2 vs 4e 1.9 (1.67x)
- **DIVERGES FROM 4e** PKM vs flak_helmet @ 30%: mean rounds TBE 6.1 vs 4e 2.9 (2.10x)
- **DIVERGES FROM 4e** PKM vs flak_helmet @ 50%: mean rounds TBE 3.4 vs 4e 1.9 (1.74x)
- **DIVERGES FROM 4e** PKM vs plate @ 30%: mean rounds TBE 6.7 vs 4e 3.2 (2.08x)
- **DIVERGES FROM 4e** PKM vs plate @ 50%: mean rounds TBE 3.6 vs 4e 2.1 (1.67x)
- **DIVERGES FROM 4e** PKM vs plate_helmet @ 30%: mean rounds TBE 6.9 vs 4e 3.4 (2.01x)
- **DIVERGES FROM 4e** PKM vs plate_helmet @ 50%: mean rounds TBE 3.8 vs 4e 2.2 (1.70x)
- **DIVERGES FROM 4e** M2HB vs no_armor @ 30%: mean rounds TBE 5.1 vs 4e 2.1 (2.40x)
- **DIVERGES FROM 4e** M2HB vs no_armor @ 50%: mean rounds TBE 2.9 vs 4e 1.4 (2.01x)
- **DIVERGES FROM 4e** M2HB vs no_armor @ 70%: mean rounds TBE 2.0 vs 4e 1.3 (1.59x)
- **DIVERGES FROM 4e** M2HB vs flak @ 30%: mean rounds TBE 5.2 vs 4e 2.5 (2.06x)
- **DIVERGES FROM 4e** M2HB vs flak @ 50%: mean rounds TBE 2.9 vs 4e 1.7 (1.76x)
- **DIVERGES FROM 4e** M2HB vs flak_helmet @ 30%: mean rounds TBE 5.3 vs 4e 2.7 (1.99x)
- **DIVERGES FROM 4e** M2HB vs flak_helmet @ 50%: mean rounds TBE 3.1 vs 4e 1.8 (1.74x)
- **DIVERGES FROM 4e** M2HB vs flak_helmet @ 70%: mean rounds TBE 2.2 vs 4e 1.4 (1.51x)
- **DIVERGES FROM 4e** M2HB vs plate @ 30%: mean rounds TBE 5.8 vs 4e 2.6 (2.22x)
- **DIVERGES FROM 4e** M2HB vs plate @ 50%: mean rounds TBE 3.2 vs 4e 1.8 (1.77x)
- **DIVERGES FROM 4e** M2HB vs plate_helmet @ 30%: mean rounds TBE 6.0 vs 4e 2.7 (2.18x)
- **DIVERGES FROM 4e** M2HB vs plate_helmet @ 50%: mean rounds TBE 3.3 vs 4e 1.8 (1.76x)
