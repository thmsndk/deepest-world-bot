import { Entity } from "./deepestworld";
import { generateGrid, moveToRandomValidPointNearCharacter } from "./utility";

export function attackAndRandomWalk(target: { distance: number; entity: Entity }) {
  if (!target) {
    return true;
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
    return true;
  }

  const inAttackRange = target.distance <= skillToUse.range;
  if (!inAttackRange) {
    dw.move(target.entity.x, target.entity.y);
  } else {
    // TODO: should this be a subtask? grid should be a service or context we can access
    const grid = generateGrid();
    moveToRandomValidPointNearCharacter(grid);
  }

  // TODO: determine best skill to attack with from skillbar, most dmg? resistances?
  if (dw.isSkillReady(skillToUse.md) && inAttackRange) {
    dw.setTarget(target.entity);
    // console.log("attack");
    dw.useSkill(skillToUse.md, target.entity);
  }
}
