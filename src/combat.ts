import { Entity } from "./deepestworld";
import { drawingGroups } from "./draw";
import { GridMatrix } from "./grid";
import { moveToClosestSafeSpot, getWalkablePathInStraightLine } from "./utility";

export function attackAndRandomWalk(grid: GridMatrix, target: { distance: number; entity: Entity; los: boolean }) {
  if (!target) {
    return true;
  }

  if (!target.los) {
    console.log("no line of sight", target.los);
    return -1;
  }

  let skillToUse = undefined;
  let skillToUseDamage = undefined;
  for (const skill of dw.character.skills) {
    if (!skill) continue;

    if (skillToUse !== skill) {
      const skillDamage = Object.entries(skill).reduce((result, [key, value]) => {
        if (key.endsWith("Dmg")) {
          result += value;
        }
        return result;
      }, 0);

      if (!skillToUseDamage || skillDamage > skillToUseDamage) {
        skillToUse = skill;
        skillToUseDamage = skillDamage;
      }
    }
  }

  if (!skillToUse) {
    console.warn("no skill to use");
    return -1;
  }

  const inAttackRange = target.distance <= skillToUse.range;
  if (!inAttackRange) {
    // TODO: pick a safe spot towards the target
    dw.move(target.entity.x, target.entity.y);
    return 1;
  }

  // TODO: should this be a subtask? grid should be a service or context we can access
  moveToClosestSafeSpot(grid);

  // TODO: determine best skill to attack with from skillbar, most dmg? resistances?
  if (dw.isSkillReady(skillToUse.md) && inAttackRange) {
    dw.setTarget(target.entity);
    // console.log("attack");
    dw.useSkill(skillToUse.md, target.entity);

    return 1;
  }
}
