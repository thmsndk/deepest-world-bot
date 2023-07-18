import { TASK_STATE, TaskTuple, taskRegistry } from ".";
import { config } from "../config";
import { merge } from "../console";
import { hasLineOfSight, sleep } from "../utility";
export const TASK_NAME = "farm-trees";

export function farmTrees(): TaskTuple {
  return [TASK_NAME];
}

// TODO: perhaps a farm single tree, that is dedicated to chopping down a tree
taskRegistry[TASK_NAME] = {
  priority: 10,
  run: async () => {
    if (!config.collect_wood_low_threshold) {
      return TASK_STATE.DONE;
    }
    // run farming trees
    // TODO a specific level?, a specific place?
    // TODO: danger levels near target? add clear danger task?
    // const minTreeLevel = Math.max(1, Math.min(dw.c.professions.woodcutting.level, dw.c.professions.woodworking.level) - 4);
    // const minStoneLevel = Math.max(1, Math.min(dw.c.professions.stoneworking.level, dw.c.professions.mining.level) - 4);

    if (await depositIfInventoryFull()) {
      return TASK_STATE.EVALUATE_NEXT_TICK;
    }

    const treeDistance = 10;

    const trees = dw.entities
      .filter((entity) => entity.l === dw.character.l && entity.tree && hasLineOfSight(entity))
      .map((entity) => ({
        entity,
        distance: dw.distance(dw.character, entity),
      }))
      .sort((a, b) => a.distance - b.distance);

    if (trees.length === 0) {
      return TASK_STATE.DONE;
    }

    const target = trees[0]?.entity;
    const distancetoTarget = dw.distance(dw.character, target);
    const inRange = distancetoTarget <= dw.c.defaultSkills.woodcutting.range; /* Attack */

    if (!inRange) {
      dw.move(target.x, target.y);
      return TASK_STATE.EVALUATE_NEXT_TICK;
    }

    if (dw.isSkillReady("chop") && inRange) {
      dw.setTarget(target);
      console.log("chop", target);
      dw.emit("chop", { id: target.id });
      return TASK_STATE.EVALUATE_NEXT_TICK;
    }

    if (inRange) {
      return TASK_STATE.EVALUATE_NEXT_TICK;
    }

    return TASK_STATE.DONE;
  },
};

async function depositIfInventoryFull() {
  // TODO: inventory full? return and deposit wood
  const freeSpace = dw.character.bag.filter((x) => !x).length;
  if (freeSpace === 0) {
    console.log("farm-trees: merging wood");
    merge("wood");

    // TODO: tp home for free if there is no space after merge
    console.log("farm-trees: unstuck");
    dw.emit("unstuck");

    await sleep(2000);

    // deposit wood in spawn
    for (let bagIndex = 0; bagIndex < dw.character.bag.length; bagIndex++) {
      const item = dw.character.bag[bagIndex];
      if (!item) continue;
      if (item.md !== "wood") continue;

      // TODO: find a box with wood and free space
      // TODO: handle auto stacking
      const boxesWithFreeSpace = dw.entities.filter(
        (entity) => entity && entity.md.startsWith("box") && entity.owner && entity.storage.filter((x) => !x).length > 0
      );

      console.log("farm-trees: finding box for ", item, boxesWithFreeSpace);

      const box = boxesWithFreeSpace.pop();

      if (box) {
        // move item from character to box
        for (let boxIndex = 0; boxIndex < box.storage.length; boxIndex++) {
          const boxItem = box.storage[boxIndex];
          if (boxItem) continue;
          // TODO: move into range of box.
          const inRange = dw.distance(dw.c, box) < 2;

          if (!inRange) {
            console.log("out of range for moveItem, moving to ", box);
            dw.move(box.x, box.y);
            await sleep(5000);
          }
          console.log(`move ${item.md} from bag index=${bagIndex}, to box (id=${box.id}, index=${boxIndex})`);
          dw.moveItem("bag", bagIndex, "storage", boxIndex, undefined, box.id);
          await sleep(100);
          break;
        }
      }
    }
    return true;
  }
}
