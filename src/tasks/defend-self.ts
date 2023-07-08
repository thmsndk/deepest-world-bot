import { TASK_STATE, TaskTuple, taskRegistry } from ".";
import { Entity } from "../deepestworld";
import { generateGrid, hasLineOfSight, moveToRandomValidPointNearCharacter } from "../utility";
const TASK_NAME = "defend-self";

export function defendSelf(): TaskTuple {
  return [TASK_NAME];
}

let target: { distance: number; entity: Entity } | undefined = undefined;
taskRegistry[TASK_NAME] = {
  run: () => {
    // TODO: in range to attack target? then do so.
    // Not in range? pick the lowest health in range as a temp target

    const targetingMe = dw.entities
      .filter((entity) => entity.targetId === dw.character.id)
      .map((entity) => ({
        entity,
        distance: dw.distance(dw.character, entity),
      }))
      .sort((a, b) => a.distance - b.distance);

    if (targetingMe.length === 0) {
      return TASK_STATE.DONE;
    }

    target = targetingMe[0];
    // TODO stickyTarget

    const los = hasLineOfSight(target.entity);

    // TODO: draw line of sight
    // // drawingGroups["targetPath"] = [
    // //   // {
    // //   //   type: "path",
    // //   //   points: path,
    // //   //   color: "#DA70D6",
    // //   // },
    // //   {
    // //     type: "circle",
    // //     point: { x: target.x, y: target.y },
    // //     radius: 0.25,
    // //     color: "#DA70D6",
    // //   },
    // //   {
    // //     type: "line",
    // //     startPoint: { x: dw.character.x, y: dw.character.y },
    // //     endPoint: { x: target.x, y: target.y },
    // //     color: !los ? "#F00" : "#00FF56",
    // //   },
    // //   // ...neigbors.map((tile) => ({
    // //   //   type: "rectangle",
    // //   //   point: { x: tile.x, y: tile.y },
    // //   //   width: 0.5 * 96,
    // //   //   height: 0.5 * 96,
    // //   //   color: "#354acc",
    // //   // })),
    // // ];

    if (!los) {
      return TASK_STATE.DONE;
    }

    // TODO: if we have no line of sight, find a path? drunkenWalk?
    // should it return a subtask to be run? and then return to this task?

    // TODO: attack target
    // TODO: kite target
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
      return TASK_STATE.DONE;
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

    return TASK_STATE.EVALUATE_NEXT_TICK;
  },
};
