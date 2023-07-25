import { TASK_STATE, TaskTuple, taskRegistry } from ".";
import { attackAndRandomWalk } from "../combat";
import { config } from "../config";
import { merge } from "../console";
import { Entity } from "../deepestworld";
import { sacItems } from "../disenchant";
import { drawingGroups } from "../draw";
import { GridMatrix, TargetPoint, hasLineOfSight } from "../grid";
import { sleep } from "../utility";
const TASK_NAME = "mission";

export function mission(grid: GridMatrix, nonTraversableEntities: Array<Entity | TargetPoint>): TaskTuple {
  return [TASK_NAME, grid, nonTraversableEntities];
}

// Initialize config
if (config.mission_auto_add === undefined) {
  config.mission_auto_add = true;
}

if (config.mission_auto_accept === undefined) {
  config.mission_auto_accept = true;
}

if (config.mission_auto_enchant === undefined) {
  config.mission_auto_enchant = true;
}

if (config.mission_auto_enter === undefined) {
  config.mission_auto_enter = false;
}

taskRegistry[TASK_NAME] = {
  run: async (grid: GridMatrix, nonTraversableEntities: Array<Entity | TargetPoint>) => {
    // we can't really see if we are inside the mission, the best we can do is check if there is one of hour missionboards nearby
    const missionTables = dw.entities.filter((entity) => entity.owner && entity.md === "missionTable");

    // TODO We could store  "last mission" and detect if dw.character.mission is no longer the same
    // if we have a mission bag, we probably just completed a mission
    const missionBagIndex = dw.character.bag.findIndex((b) => b && b.md === "missionBag");

    if (missionBagIndex > -1 && !dw.character.combat) {
      // TODO: What if we don't have enoug bagspace to open it?
      merge("wood", "rock", "ironOre", "skillOrb");

      // tp home for free
      dw.emit("unstuck");

      await sleep(2000);

      await sacItems();

      await sleep(2000);

      dw.emit("openItem", { i: missionBagIndex });

      dw.emit("sortInv");
      await sleep(1000);

      // attempt to enchant missions
      if (config.mission_auto_enchant) {
        const missionsInBag = dw.character.bag
          .map((b, bagIndex) => ({ item: b, bagIndex: bagIndex }))
          .filter(
            (x) =>
              x.item &&
              x.item.md.endsWith("Mission") &&
              x.item.qual >= dw.character.level - 2 && // only auto enchant 2 less than your level
              !x.item.n
          );
        const altar = dw.entities.find((entity) => entity && entity.md === "enchantingDevice1" && entity.owner);

        if (altar) {
          // TODO: only enchant one mission? to not waste enchants? or make sure we pick the mission with the highest reward?
          for (const mission of missionsInBag) {
            // Move from altar to bag, in case something is already in there
            dw.moveItem("storage", 0, "bag", mission.bagIndex, altar.id);

            // Move mission from bag to altar
            dw.moveItem("bag", mission.bagIndex, "storage", 0, undefined, altar.id);
            await sleep(500);
            // TODO: detect materials and bail out when it can't be enchanted
            if (mission.item?.r === 0) {
              dw.emit("enchant", { id: altar.id, md: "randRarity" });
            }
            // dw.emit("enchant", { id: altar.id, md: "addRandMod" });
            // dw.emit("enchant", { id: altar.id, md: "addRandMod" });
            // dw.emit("enchant", { id: altar.id, md: "addRandMod" });
            await sleep(500);
            // Move enchanted mission from altar to bag
            dw.moveItem("storage", 0, "bag", mission.bagIndex, altar.id);
          }
        }
      }
    }

    if (missionTables.length > 0) {
      if (dw.character.mission) {
        // Join / Enter mission if we have a mission in progress
        if (config.mission_auto_enter) {
          const board = missionTables[0];
          const inRange = dw.distance(dw.character, board) <= 2;
          if (!inRange) {
            dw.move(board.x, board.y);
            return TASK_STATE.EVALUATE_NEXT_TICK;
          } else {
            dw.enterMission();
            // TODO: floodfill to detect if we are stuck and abandon
            await sleep(2000);
            return TASK_STATE.EVALUATE_NEXT_TICK;
          }
        }
      } else {
        const board = missionTables[0];
        const boardInRange = dw.distance(dw.character, board) <= 2;

        const missionsInBag = [];

        for (let index = 0; index < dw.character.bag.length; index++) {
          const item = dw.character.bag[index];
          if (!item) continue;
          if (!item.md.endsWith("Mission")) continue;
          // only auto add up to +1 char level
          if (item.qual > dw.character.level + 1) continue;
          missionsInBag.push({ item, bagIndex: index });
        }

        missionsInBag.sort((a, b) => {
          if (a.item.r !== b.item.r) {
            // sort by rarity DESC
            return b.item.r - a.item.r;
          }

          // sort by level DESC, prefering high lvl missions
          return b.item.qual - a.item.qual;
        });

        // populate missionboard
        if (missionsInBag.length > 0 && config.mission_auto_add) {
          const boardHasMissions = board.storage.some((s) => s);

          // Only fill up board when it is empty, that way we run all missions
          if (!boardHasMissions) {
            // for (let index = 0; index < board.storage.length; index++) {
            const index = 0; // ignore mission storage for now.
            const mission = board.storage[index];
            if (!mission) {
              if (!boardInRange) {
                dw.move(board.x, board.y);
                return TASK_STATE.EVALUATE_NEXT_TICK;
              } else {
                const missionToAdd = missionsInBag.shift();
                // if (!missionToAdd) break;
                if (missionToAdd) {
                  dw.moveItem("bag", missionToAdd.bagIndex, "storage", index, undefined, board.id);
                }
              }
            }
            // TODO: do we have a mission below lvl 6 in our bag?

            // TODO: move into range of board
            // TODO add mission to board
            // }
          }
        }

        // accept mission
        if (config.mission_auto_accept) {
          // for (let index = 0; index < board.storage.length; index++) {
          const index = 0; // we can only accept slot 0, more logic needs to be added to move from storage to slot 0
          const mission = board.storage[index];
          if (mission) {
            if (!boardInRange) {
              dw.move(board.x, board.y);
              return TASK_STATE.EVALUATE_NEXT_TICK;
            } else {
              dw.acceptMission(board.id, index);
              return TASK_STATE.EVALUATE_NEXT_TICK;
            }
          }
          // }
        }
      }
    }

    if (!dw.character.mission) {
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
