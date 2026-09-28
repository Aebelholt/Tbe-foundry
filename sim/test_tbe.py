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


class Smoke(unittest.TestCase):
    def test_pipeline_runs(self):
        cfg = copy.deepcopy(CFG)
        cfg["run"]["trials"] = 200
        for w in cfg["run"]["weapons"]:
            cfg["weapon"][w].update(damage=2, crit=3, armor_mod=0, ammo_dice=2)   # fixture
        for a in cfg["armor"].values():
            a["rating"] = 2                                                       # fixture
        self.assertEqual(run.missing_values(cfg), [])
        rng = random.Random(0)
        w = run.tbe_weapon(cfg["weapon"]["M16A2"], cfg["keys"])
        rows = [run.cell("M16A2", w, 50, t, cfg, rng) for t in cfg["run"]["targets"]]
        self.assertGreater(rows[0]["incap_ever"], rows[2]["incap_ever"] - 0.05)
        run.flags(rows, cfg)


if __name__ == "__main__":
    unittest.main()
