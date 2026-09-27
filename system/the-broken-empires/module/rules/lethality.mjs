/* Lethality Level (p.88): "A character's Lethality Level is equal to 1/3
 * of their Death Threshold, rounded up", plus a race's bonus (an Ogre's
 * +1), less any permanent penalty (sepsis). One owner: the actor's getter
 * and the character creation window both call this. */
export function lethalityLevel(dt, bonus = 0, penalty = 0) {
  const n = Number(dt) || 0;
  return n ? Math.max(0, Math.ceil(n / 3) + (Number(bonus) || 0) - (Number(penalty) || 0)) : 0;
}
