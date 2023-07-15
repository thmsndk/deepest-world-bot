import { TASK_STATE, TaskTuple, taskRegistry } from ".";
import { attackAndRandomWalk } from "../combat";
import { merge, sacItems } from "../console";
import { Entity } from "../deepestworld";
import { drawingGroups } from "../draw";
import { GridMatrix } from "../grid";
import { hasLineOfSight, sleep } from "../utility";
const TASK_NAME = "mission";

export function mission(grid: GridMatrix): TaskTuple {
  return [TASK_NAME, grid];
}

taskRegistry[TASK_NAME] = {
  run: async (grid: GridMatrix) => {
    // we can't really see if we are inside the mission, the best we can do is check if there is one of hour missionboards nearby
    const missionTables = dw.entities.filter(
      (entity) => entity.ownerDbId === dw.character.dbId && entity.md === "missionTable"
    );

    // TODO We could store  "last mission" and detect if dw.character.mission is no longer the same
    // if we have a mission bag, we probably just completed a mission
    const missionBagIndex = dw.character.bag.findIndex((b) => b && b.md === "missionBag");

    if (missionBagIndex > -1 && !dw.character.combat) {
      // TODO: What if we don't have enoug bagspace to open it?
      merge("wood", "rock", "ironOre", "skillOrb");

      dw.emit("openItem", { i: missionBagIndex });

      dw.emit("sortInv");

      // tp home for free
      dw.emit("unstuck");

      await sleep(5000);

      await sacItems();

      await sleep(5000);
    }

    if (missionTables.length > 0) {
      if (dw.character.mission) {
        // Join / Enter mission if we have a mission in progress
        const board = missionTables[0];
        const inRange = dw.distance(dw.character, board) <= 2;
        if (!inRange) {
          dw.move(board.x, board.y);
          return TASK_STATE.EVALUATE_NEXT_TICK;
        } else {
          dw.enterMission();
          // TODO: floodfill to detect if we are stuck and abandon
          return TASK_STATE.EVALUATE_NEXT_TICK;
        }
      } else {
        const board = missionTables[0];
        const boardInRange = dw.distance(dw.character, board) <= 2;

        const missionsInBag = dw.character.bag
          .map((b, bagIndex) => ({ item: b, bagIndex: bagIndex }))
          .filter(
            (x) =>
              x.item &&
              x.item.md.endsWith("Mission") &&
              x.item.qual < dw.character.level + 1 && // only auto add up to lvl 7 missions
              // x.item.r < 3 &&
              !x.item.n
          )
          .sort((a, b) => {
            if (a.item.r !== b.item.r) {
              // sort by rarity DESC
              return b.item.r - a.item.r;
            }

            // sort by level ASC, prefering low lvl missions
            return a.item.qual - b.item.qual;
          });

        // populate missionboard
        if (missionsInBag.length > 0) {
          // TODO: prioririze enchanted missions
          const boardHasMissions = board.storage.some((s) => s);

          // Only fill up board when it is empty, that way we run all missions
          if (!boardHasMissions) {
            for (let index = 0; index < board.storage.length; index++) {
              const mission = board.storage[index];
              if (!mission) {
                if (!boardInRange) {
                  dw.move(board.x, board.y);
                  return TASK_STATE.EVALUATE_NEXT_TICK;
                } else {
                  const missionToAdd = missionsInBag.shift();
                  if (!missionToAdd) break;
                  dw.moveItem("bag", missionToAdd.bagIndex, "storage", index, undefined, board.id);
                }
              }
              // TODO: do we have a mission below lvl 6 in our bag?

              // TODO: move into range of board
              // TODO add mission to board
            }
          }
        }

        // accept mission
        for (let index = 0; index < board.storage.length; index++) {
          const mission = board.storage[index];
          if (mission) {
            if (!boardInRange) {
              dw.move(board.x, board.y);
              return TASK_STATE.EVALUATE_NEXT_TICK;
            } else {
              dw.acceptMission(board.id, index);
              return TASK_STATE.EVALUATE_NEXT_TICK;
            }
            break;
          }
        }
      }
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

    // TODO: mission logic, monster missions is just killing missions
    const closestEntity = dw.entities
      .filter((entity) => entity.l === dw.character.l && entity.ai && entity.r < 2)
      .map((entity) => ({
        entity,
        distance: dw.distance(dw.character, entity),
        threat: getThreat(entity),
      }))
      .sort((a, b) => {
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

    const los = hasLineOfSight(target.entity);

    drawingGroups["targetPath"] = [
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
    ];

    // TODO: setting target in context would make things easier
    if (attackAndRandomWalk(grid, target) === 1) {
      return TASK_STATE.EVALUATE_NEXT_TICK; // To prevent exploration task overriding our movement.
    }

    return TASK_STATE.DONE;
  },
};
