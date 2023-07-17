import { TASK_STATE, TaskTuple, taskRegistry } from ".";
import { attackAndRandomWalk } from "../combat";
import { Entity } from "../deepestworld";
import { drawingGroups } from "../draw";
import { GridMatrix } from "../grid";
import { hasLineOfSight } from "../utility";
const TASK_NAME = "defend-self";

export function defendSelf(grid: GridMatrix): TaskTuple {
  return [TASK_NAME, grid];
}

let target: { distance: number; entity: Entity } | undefined = undefined;
taskRegistry[TASK_NAME] = {
  run: async (grid: GridMatrix) => {
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

    const los = hasLineOfSight(target.entity, true);

    

    if (!los) {
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
