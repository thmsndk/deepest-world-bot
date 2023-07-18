import { TASK_STATE, TaskTuple, taskRegistry } from ".";
import { attackAndRandomWalk } from "../combat";
import { Entity } from "../deepestworld";
import { drawingGroups } from "../draw";
import { hasLineOfSight, GridMatrix, TargetPoint } from "../grid";
const TASK_NAME = "defend-self";

export function defendSelf(grid: GridMatrix, nonTraversableEntities: Array<Entity | TargetPoint>): TaskTuple {
  return [TASK_NAME, grid, nonTraversableEntities];
}

let target: { distance: number; entity: Entity; los: boolean } | undefined = undefined;
taskRegistry[TASK_NAME] = {
  run: async (grid: GridMatrix, nonTraversableEntities: Array<Entity | TargetPoint>) => {
    // TODO: in range to attack target? then do so.
    // Not in range? pick the lowest health in range as a temp target

    const targetingMe = dw.entities
      .filter((entity) => entity.targetId === dw.character.id)
      .map((entity) => ({
        entity,
        distance: dw.distance(dw.character, entity),
        los: hasLineOfSight(entity, dw.character, nonTraversableEntities),
      }))
      .sort((a, b) => {
        if (a.los !== b.los) {
          // los true before los false
          return Number(b.los) - Number(a.los);
        }

        // ascending by distance
        return a.distance - b.distance;
      });

    if (targetingMe.length === 0) {
      return TASK_STATE.DONE;
    }

    target = targetingMe[0];
    // TODO stickyTarget

    drawingGroups["target"].push(
      {
        type: "circle",
        point: target.entity,
        radius: 0.25,
        color: target.los ? "#00FF00" : "red",
      },
      {
        type: "line",
        startPoint: dw.character,
        endPoint: target.entity,
        color: target.los ? "#00FF00" : "red",
      }
    );

    if (!target.los) {
      return TASK_STATE.DONE;
    }

    // TODO: if we have no line of sight, find a path? drunkenWalk?
    // should it return a subtask to be run? and then return to this task?

    if (attackAndRandomWalk(grid, target) === -1) {
      return TASK_STATE.DONE;
    }

    return TASK_STATE.EVALUATE_NEXT_TICK;
  },
};
