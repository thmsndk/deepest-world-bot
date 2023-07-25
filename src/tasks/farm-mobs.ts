import { TASK_STATE, TaskTuple, taskRegistry } from ".";
import { attackAndRandomWalk } from "../combat";
import { config } from "../config";
import { merge } from "../console";
import { Entity } from "../deepestworld";
import { sacItems } from "../disenchant";
import { drawingGroups } from "../draw";
import { GridMatrix, TargetPoint, hasLineOfSight } from "../grid";
import { sleep } from "../utility";
const TASK_NAME = "farm-mobs";

export function farmMobs(grid: GridMatrix, nonTraversableEntities: Array<Entity | TargetPoint>): TaskTuple {
  return [TASK_NAME, grid, nonTraversableEntities];
}

// Initialize config
if (config.farm_mobs === undefined) {
  config.farm_mobs = true;
}

taskRegistry[TASK_NAME] = {
  run: async (grid: GridMatrix, nonTraversableEntities: Array<Entity | TargetPoint>) => {
    if (dw.character.mission) {
      // on a mission, don't farm mobs.
      return TASK_STATE.DONE;
    }

    const getThreat = (entity: Entity): number => {
      const row = grid[Math.floor(entity.y)];
      if (row) {
        const tile = row[Math.floor(entity.x)];
        if (tile) {
          return tile.threat;
        }
      }
      return 0;
    };

    // skull 50% increase dmg and 100% increased life per skull
    // TODO: mission logic, monster missions is just killing missions
    const closestEntity = dw.entities
      .filter((entity) => entity.l === dw.character.l && entity.ai && entity.r === 0)
      .map((entity) => ({
        entity,
        distance: dw.distance(dw.character, entity),
        threat: getThreat(entity),
        los: hasLineOfSight(entity, dw.character, nonTraversableEntities),
      }))
      .sort((a, b) => {
        if (a.los !== b.los) {
          // los true before los false
          return Number(b.los) - Number(a.los);
        }
        // TODO: using threat makes it ping pong between targets
        // ascending by threat
        // if (Math.floor(a.threat) !== Math.floor(b.threat)) {
        //   return a.threat - b.threat;
        // }

        // ascending by distance
        return a.distance - b.distance;
      });

    // console.log(closestEntity);

    const target = closestEntity[0];

    if (!target) {
      return TASK_STATE.DONE;
    }

    // TODO: does it make sense to look at entities we don't have los for?
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

    // TODO: setting target in context would make things easier
    if (attackAndRandomWalk(grid, target) === 1) {
      return TASK_STATE.EVALUATE_NEXT_TICK; // To prevent exploration task overriding our movement.
    }

    return TASK_STATE.DONE;
  },
};
