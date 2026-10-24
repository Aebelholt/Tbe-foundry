"""Rule checks for the TBE engine, plus an end-to-end smoke run.

    python3 -m unittest sim/test_tbe.py

The weapon/armor numbers in the smoke test are FIXTURES to exercise the
pipeline, not 4e stats.
"""
import copy
import random
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import native  # noqa: E402
import run  # noqa: E402
import tbe  # noqa: E402

CFG = run.load(Path(__file__).parent / "config.toml")
R = CFG["tbe"]


def res(r, s):
    return tbe.resolve(r, s, R)


class Resolution(unittest.TestCase):
    def test_roll_under_and_sl(self):
        self.assertTrue(res(47, 50).success)
        self.assertEqual(res(47, 50).sl, 4)
        self.assertFalse(res(51, 50).success)

    def test_tens_zero_is_one_sl(self):
        self.assertEqual(res(7, 50).sl, 1)

    def test_criticals(self):
        self.assertTrue(res(33, 50).crit)
        self.assertEqual(res(33, 50).sl, 6)          # 3 + 3
        self.assertTrue(res(50, 50).crit)            # exact value
        self.assertEqual(res(50, 50).sl, 8)
        self.assertTrue(res(66, 50).crit_fail)

    def test_always_succeed_fail(self):
        self.assertTrue(res(5, 1).success)
        self.assertTrue(res(4, 0).success)
        self.assertTrue(res(5, 0).crit)              # crits on 05 at skill <= 0
        self.assertFalse(res(4, -10).crit)
        self.assertFalse(res(99, 150).success)
        self.assertFalse(res(100, 150).success)

    def test_99_100_exact_is_not_crit(self):
        self.assertFalse(res(99, 99).success)
        self.assertFalse(res(100, 100).success)

    def test_skill_over_100(self):
        r = res(47, 125)
        self.assertEqual(r.sl, 4 + 2)
        self.assertFalse(res(100, 125).crit_fail)


class Opposed(unittest.TestCase):
    def test_more_sl_wins_dos(self):
        self.assertEqual(tbe.opposed_attack(res(47, 50), res(21, 50)), (True, 2))

    def test_defender_fails(self):
        self.assertEqual(tbe.opposed_attack(res(47, 50), res(80, 50)), (True, 4))

    def test_tie_crit_then_die_then_skill(self):
        # 44 crit (4+3=7 SL) vs 71 at skill 80 (7 SL, not crit)
        self.assertEqual(tbe.opposed_attack(res(44, 50), res(71, 80)), (True, 0))
        self.assertEqual(tbe.opposed_attack(res(31, 50), res(38, 50)), (False, 0))
        self.assertEqual(tbe.opposed_attack(res(38, 60), res(38, 50)), (True, 0))

    def test_attacker_fails(self):
        self.assertEqual(tbe.opposed_attack(res(60, 50), None), (False, 0))


class Wounds(unittest.TestCase):
    def test_locations(self):
        self.assertEqual([tbe.general_location(i) for i in range(10)],
                         ["Head", "Body", "Body", "Body", "Body", "Body", "R Arm", "L Arm", "R Leg", "L Leg"])
        self.assertEqual(tbe.detail_location("R Leg", 7), "Knee")

    def test_ap_and_piercing(self):
        t = tbe.Target(0, 20, 30, {"Body": 9})
        w = {"armor_mod": -1}
        self.assertEqual(tbe.effective_ap(t, "Body", w, CFG["keys"], False, R), 6)
        self.assertEqual(tbe.effective_ap(t, "Body", w, CFG["keys"], True, R), 3)
        self.assertEqual(tbe.effective_ap(t, "Head", w, CFG["keys"], True, R), 0)
        self.assertEqual(tbe.effective_ap(t, "Body", {"armor_mod": 1}, CFG["keys"], False, R), 12)
        self.assertEqual(tbe.effective_ap(t, "Head", {"armor_mod": 1}, CFG["keys"], False, R), 0)

    def test_pierce_armor_needs_4_ap(self):
        t = tbe.Target(0, 20, 30, {"Body": 3})
        self.assertEqual(tbe.effective_ap(t, "Body", {"armor_mod": 0}, CFG["keys"], True, R), 3)

    def test_wound_die_natural_ten_avoids(self):
        class Fixed:
            def randint(self, a, b):
                return b
        t = tbe.Target(0, 99, 30, {})
        self.assertFalse(tbe.apply_wound(t, "R Leg", 50, Fixed(), R))

    def test_second_impairment_is_shock(self):
        class One:
            def randint(self, a, b):
                return 1
        t = tbe.Target(0, 99, 30, {})
        tbe.apply_wound(t, "R Leg", 5, One(), R)   # odd face -> prone
        self.assertTrue(t.prone and not t.shock)
        tbe.apply_wound(t, "R Leg", 1, One(), R)
        self.assertTrue(t.shock)

    def test_death_threshold(self):
        t = tbe.Target(0, 20, 30, {})
        tbe.apply_wound(t, "Body", 20, random.Random(1), R)
        self.assertTrue(t.dead)
        self.assertEqual(t.lethality_level, 7)


class DosModes(unittest.TestCase):
    def k(self, mode):
        keys = dict(CFG["keys"])
        keys["armor_dos_mode"] = mode
        return keys

    def test_linear_is_tbe_as_written(self):
        self.assertEqual(tbe.wound_wp(6, 1, 6, self.k("linear")), 1)

    def test_stepped(self):
        k = self.k("stepped")
        self.assertEqual([tbe.wound_wp(6, d, 6, k) for d in (1, 2, 3, 5, 6)], [0, 0, 3, 3, 6])
        self.assertEqual(tbe.wound_wp(6, 1, 0, k), 7)          # unarmored stays linear

    def test_gate(self):
        k = self.k("gate")
        self.assertEqual(tbe.wound_wp(6, 1, 6, k), 0)          # plate AR 2 needs DoS 2
        self.assertEqual(tbe.wound_wp(6, 2, 6, k), 2)
        self.assertEqual(tbe.wound_wp(6, 1, 3, k), 4)          # flak AR 1
        self.assertEqual(tbe.wound_wp(6, 0, 0, k), 6)


class Native(unittest.TestCase):
    N = CFG["native_4e"]

    def test_base_dice_and_steps(self):
        sz = self.N["die_sizes"]
        self.assertEqual(native.base_dice("A", "C", 0, sz), [12, 8])
        self.assertEqual(native.base_dice("A", "C", -2, sz), [8, 8])     # PM Urban Ops example
        self.assertEqual(native.base_dice("D", "D", -1, sz), [6])
        self.assertEqual(native.base_dice("D", "D", -3, sz), [6])
        self.assertEqual(native.base_dice("B", "F", 0, sz), [10])
        self.assertEqual(native.base_dice("A", "A", 2, sz), [12, 12])

    def test_armor_mod_and_penetration_limit(self):
        class Six:
            def randint(self, a, b):
                return 6 if b == 6 else 1
        t = native.Target(hit_capacity=4, armor={"Torso": 2})
        m9 = CFG["weapon"]["M9"]                       # dmg 1, armor +1 -> level 3
        self.assertEqual(native.apply_hit(t, m9, 5, Six(), self.N), 5)   # d6=6 is Head: unarmored, mod ignored
        t = native.Target(hit_capacity=4, armor={"Head": 2})
        self.assertEqual(native.apply_hit(t, m9, 5, Six(), self.N), 0)   # 1 <= 3-2: deflected
        t = native.Target(hit_capacity=4, armor={"Head": 1})
        self.assertEqual(native.apply_hit(t, m9, 5, Six(), self.N), 3)   # 5 - 2
        self.assertEqual(t.armor["Head"], 0)                             # ablated on a 6

    def test_incapacitation(self):
        t = native.Target(hit_capacity=4, armor={})
        native.apply_hit(t, {"damage": 2, "crit": 99, "armor_mod": 0}, 4, random.Random(0), self.N)
        self.assertTrue(t.incapacitated)


class Overrides(unittest.TestCase):
    def test_set_and_bonus(self):
        cfg = copy.deepcopy(CFG)
        run.apply_override(cfg, "keys.firearm_bonus=20")
        self.assertEqual(cfg["keys"]["firearm_bonus"], 20)
        self.assertEqual(run.tbe_weapon(cfg["weapon"]["M9"], cfg["keys"])["bonus"], 20)
        cfg["weapon"]["M9"]["firearm"] = False
        self.assertEqual(run.tbe_weapon(cfg["weapon"]["M9"], cfg["keys"])["bonus"], 0)

    def test_default_is_stepped(self):
        self.assertEqual(CFG["keys"]["armor_dos_mode"], "stepped")


class Smoke(unittest.TestCase):
    def test_pipeline_runs(self):
        cfg = copy.deepcopy(CFG)
        cfg["run"]["trials"] = 100
        cfg["run"]["weapons"] = ["M16A2"]
        self.assertEqual(run.missing_values(cfg), [])
        rows, nat = run.sweep(cfg)
        self.assertEqual(len(rows), len(nat))
        run.flags(rows, nat, cfg)


if __name__ == "__main__":
    unittest.main()
