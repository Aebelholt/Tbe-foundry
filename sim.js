/* Monte Carlo combat audit: run the real TBE.resolve engine through full fights. */
const fs = require("fs");
global.foundry = {}; global.game = {}; global.canvas = {};
const TBE = eval(fs.readFileSync("macros/_lib.js", "utf8") + "; TBE");

const d = (n) => 1 + Math.floor(Math.random() * n);
const LOCS = ["Body", "R Arm", "L Arm", "R Leg", "L Leg", "Head"];
const locFromOnes = (o) => (o >= 1 && o <= 5 ? "Body" : o === 6 ? "R Arm" : o === 7 ? "L Arm" : o === 8 ? "R Leg" : o === 9 ? "L Leg" : "Head");

const bestiary = JSON.parse(fs.readFileSync("bestiary.json", "utf8"));
const creature = (name, dodgeOverride) => {
  const c = bestiary.find((x) => x.name === name);
  const sk = Object.fromEntries(c.skills.map((s) => [s.name, s.value]));
  const atk = c.attacks[0];
  const m = atk ? atk.match(/^([A-Za-z'\- ]+?)\s+(\d+)/) : null;
  const ap = {};
  for (const L of LOCS) {
    const row = c.armour.find((r) => r.loc === L);
    ap[L] = row ? Number(row.natural) : 0;
  }
  const shield = Math.max(0, ...c.armour.map((r) => Number(r.worn) || 0));
  const dmgM = atk ? atk.match(/Dmg\s+(\d+)/) : null;
  return {
    name, attack: m ? Number(m[2]) : 40, weaponDmg: dmgM ? Number(dmgM[1]) : 2,
    defence: dodgeOverride ?? sk["Dodge"] ?? 30,
    ap, shield, dt: Number(c.dt) || 10,
    tough: Number(String(c.toughness).replace("+", "")) || 0,
    init: Number(String(c.init).split("/")[0]) || 14, endurance: sk["Endurance"] ?? 40
  };
};

const pcTemplate = (melee, useCS, d20wound, soloTalent = true) => ({
  soloTalent,
  name: "PC" + melee, attack: melee, weaponDmg: 4, defence: melee, /* parry with weapon skill */
  ap: Object.fromEntries(LOCS.map((L) => [L, 3])), shield: 4, dt: 20, tough: 0,
  init: 10, endurance: 50, useCS, woundDie: d20wound ? 20 : 10, csCost: 3
});

function freshState(f) {
  return { wp: {}, imp: {}, total: 0, shock: false, dead: false,
    shieldAp: f.shield, ...f };
}

function strike(A, B, atkBonus = 0) {
  /* A attacks B. Returns nothing; mutates B. */
  const aRoll = d(100), bRoll = d(100);
  const a = TBE.resolve(aRoll, A.attack + atkBonus);
  const b = TBE.resolve(bRoll, B.defence);
  const aSL = a.success ? a.sl : 0, bSL = b.success ? b.sl : 0;
  const win = a.success && (aSL > bSL || (aSL === bSL && a.crit && !b.crit));
  if (!win) return;
  const dos = Math.max(0, aSL - bSL);
  const ones = aRoll % 10;
  const loc = locFromOnes(ones === 0 ? 10 : ones);
  let ap = B.ap[loc] ?? 0;
  const canCS = A.useCS && B.shieldAp > 0 && aSL >= (A.csCost ?? 3);
  if (!canCS) ap += B.shieldAp;
  const wp = Math.max(0, A.weaponDmg + dos - ap);
  if (wp <= 0) return;
  B.wp[loc] = (B.wp[loc] ?? 0) + wp;
  B.total += wp;
  if (B.total >= B.dt) { B.dead = true; return; }
  const die = B.woundDie ?? 10;
  const wd = d(die);
  const natTop = wd === die;
  if (!natTop && wd + B.tough <= B.wp[loc]) {
    B.imp[loc] = (B.imp[loc] ?? 0) + 1;
    if (B.imp[loc] >= 2) { B.shock = true; return; }
    if (loc === "Body") {
      const e = TBE.resolve(d(100), B.endurance);
      if (!e.success) B.shock = true;
    }
  }
}

function fight(pcF, foeFs) {
  const pc = freshState(pcF);
  const foes = foeFs.map(freshState);
  const pcInit = d(10) + pc.init;
  let pcFirst = pcInit >= Math.max(...foes.map((f) => f.init));
  for (let round = 1; round <= 60; round++) {
    const acts = pcFirst ? ["pc", "foes"] : ["foes", "pc"];
    for (const side of acts) {
      if (side === "pc") {
        const t = foes.find((f) => !f.dead && !f.shock);
        if (!t) return { win: true, rounds: round, pcWp: pc.total, pcShock: false };
        strike(pc, t);
      } else {
        const up = foes.filter((f) => !f.dead && !f.shock).length;
        /* RAW: each outnumbering attacker gets +20; Enhanced Defense (Solo) caps it at +10. */
        const bonus = up > 1 ? (pc.soloTalent ? 10 : 20) : 0;
        for (const f of foes) {
          if (f.dead || f.shock) continue;
          strike(f, pc, bonus);
          if (pc.dead || pc.shock) return { win: false, rounds: round, pcWp: pc.total, pcShock: pc.shock, pcDead: pc.dead };
        }
      }
    }
    if (foes.every((f) => f.dead || f.shock)) return { win: true, rounds: round, pcWp: pc.total };
  }
  return { win: false, rounds: 60, pcWp: pc.total, stalemate: true };
}

function runs(label, pcF, foeMaker, n = 20000) {
  let w = 0, r = 0, wp = 0, shock = 0, dead = 0, stale = 0;
  for (let i = 0; i < n; i++) {
    const res = fight(pcF, foeMaker());
    if (res.win) w++; else { if (res.pcShock) shock++; if (res.pcDead) dead++; if (res.stalemate) stale++; }
    r += res.rounds; wp += res.pcWp;
  }
  console.log(
    label.padEnd(52),
    "win " + ((100 * w) / n).toFixed(1) + "%",
    "| avg rounds " + (r / n).toFixed(1),
    "| avg WP taken " + (wp / n).toFixed(1),
    "| lost by shock " + ((100 * shock) / n).toFixed(1) + "% dead " + ((100 * dead) / n).toFixed(1) + "%" +
    (stale ? " stalled " + ((100 * stale) / n).toFixed(1) + "%" : "")
  );
}

console.log("=== One on one, starting PC (Melee 55, leather 3, medium shield 4, DT 20) ===");
const pc55 = () => pcTemplate(55, false, false);
const pc55cs = () => pcTemplate(55, true, false);
const pc55solo = () => pcTemplate(55, true, true); /* Solo Constitution d20 + uses CS */
runs("PC55 plain vs Rat, Giant", pc55(), () => [creature("Rat, Giant")]);
runs("PC55 plain vs Wolf", pc55(), () => [creature("Wolf")]);
runs("PC55 plain vs Hobgoblin", pc55(), () => [creature("Hobgoblin")]);
runs("PC55 plain vs Bandit", pc55(), () => [creature("Bandit")]);
runs("PC55 plain vs Bandit, Experienced", pc55(), () => [creature("Bandit, Experienced")]);

console.log("\n=== Does Circumvent Shield matter? (vs shielded Bandit) ===");
runs("PC55 never maneuvers", pc55(), () => [creature("Bandit")]);
runs("PC55 uses CS when SLs allow", pc55cs(), () => [creature("Bandit")]);

console.log("\n=== Does Solo Constitution (d20 Wound Die) matter? ===");
runs("PC55+CS, d10 wound die vs Bandit, Experienced", pc55cs(), () => [creature("Bandit, Experienced")]);
runs("PC55+CS, d20 wound die vs Bandit, Experienced", pc55solo(), () => [creature("Bandit, Experienced")]);

console.log("\n=== Numbers: the book says outnumbering kills. Prove it. ===");
const pcNoTalent = () => pcTemplate(55, true, true, false);
runs("PC55 vs 1 Bandit", pc55solo(), () => [creature("Bandit")]);
runs("PC55 vs 2 Bandits, RAW +20 each", pcNoTalent(), () => [creature("Bandit"), creature("Bandit")]);
runs("PC55 vs 3 Bandits, RAW +20 each", pcNoTalent(), () => [creature("Bandit"), creature("Bandit"), creature("Bandit")]);
runs("PC55 vs 2 Bandits, Enhanced Defense Solo +10", pc55solo(), () => [creature("Bandit"), creature("Bandit")]);
runs("PC55 vs 3 Bandits, Enhanced Defense Solo +10", pc55solo(), () => [creature("Bandit"), creature("Bandit"), creature("Bandit")]);
runs("PC55 vs 3 Wolves, RAW +20 each", pcNoTalent(), () => [creature("Wolf"), creature("Wolf"), creature("Wolf")]);

console.log("\n=== Veteran PC (Melee 70) ===");
const pc70 = () => pcTemplate(70, true, true);
runs("PC70+CS+d20 vs Bandit, Experienced", pc70(), () => [creature("Bandit, Experienced")]);
runs("PC70+CS+d20 vs Troll", pc70(), () => [creature("Troll")]);
runs("PC70+CS+d20 vs 2 Bandits", pc70(), () => [creature("Bandit"), creature("Bandit")]);

console.log("\n=== How do fights actually END? (mechanism share, PC55+CS vs Bandit) ===");
(() => {
  let byShock = 0, byDeath = 0, n = 20000;
  for (let i = 0; i < n; i++) {
    const pc = freshState(pc55cs());
    const foe = freshState(creature("Bandit"));
    let pcFirst = d(10) + pc.init >= foe.init;
    let done = null;
    for (let round = 1; round <= 60 && !done; round++) {
      for (const side of pcFirst ? ["pc", "foe"] : ["foe", "pc"]) {
        if (side === "pc") { strike(pc, foe); if (foe.dead) { done = "death"; break; } if (foe.shock) { done = "shock"; break; } }
        else { strike(foe, pc); if (pc.dead || pc.shock) { done = "pcdown"; break; } }
      }
    }
    if (done === "shock") byShock++; else if (done === "death") byDeath++;
  }
  console.log("Bandit falls by SHOCK " + ((100 * byShock) / n).toFixed(1) + "%, by DEATH THRESHOLD " + ((100 * byDeath) / n).toFixed(1) + "%");
})();
