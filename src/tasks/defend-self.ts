import { TASK_STATE, TaskTuple, taskRegistry } from ".";
import { attackAndRandomWalk } from "../combat";
import { Entity } from "../deepestworld";
import { drawingGroups } from "../draw";
import { generateGrid, hasLineOfSight, moveToRandomValidPointNearCharacter } from "../utility";
const TASK_NAME = "defend-self";

export function defendSelf(): TaskTuple {
  return [TASK_NAME];
}

let target: { distance: number; entity: Entity } | undefined = undefined;
taskRegistry[TASK_NAME] = {
  run: async () => {
    drawingGroups["targetPath"] = [];
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

    drawingGroups["targetPath"] = [
      // {
      //   type: "path",
      //   points: path,
      //   color: "#DA70D6",
      // },
      {
        type: "circle",
        point: { x: target.entity.x, y: target.entity.y },
        radius: 0.25,
        color: "#DA70D6",
      },
      {
        type: "line",
        startPoint: { x: dw.character.x, y: dw.character.y },
        endPoint: { x: target.entity.x, y: target.entity.y },
        color: !los ? "#F00" : "#00FF56",
      },
      // ...neigbors.map((tile) => ({
      //   type: "rectangle",
      //   point: { x: tile.x, y: tile.y },
      //   width: 0.5 * 96,
      //   height: 0.5 * 96,
      //   color: "#354acc",
      // })),
    ];

    if (!los) {
      return TASK_STATE.DONE;
    }

    // TODO: if we have no line of sight, find a path? drunkenWalk?
    // should it return a subtask to be run? and then return to this task?

    if (attackAndRandomWalk(target) === -1) {
      return TASK_STATE.DONE;
    }

    return TASK_STATE.EVALUATE_NEXT_TICK;
  },
};
