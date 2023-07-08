import { taskRegistry } from ".";
export const TASK_FARM_TREES = "farmTrees";

// TODO: perhaps a farm single tree, that is dedicated to chopping down a tree
taskRegistry[TASK_FARM_TREES] = {
  priority: 10,
  run: async () => {
    // run farming trees
    // TODO a specific level?, a specific place?
    // TODO: danger levels near target? add clear danger task?

    const treeDistance = 10;

    const trees = dw.entities
      .filter((entity) => entity.l === dw.character.l && entity.tree)
      .map((entity) => ({
        entity,
        distance: dw.distance(dw.character, entity),
      }))
      .filter(
        (x) =>
          x.entity &&
          ((x.entity.tree && x.distance <= treeDistance) || !x.entity.tree)
      )
      .sort((a, b) => a.distance - b.distance);

    const target = trees[0]?.entity;
    const distancetoTarget = dw.distance(dw.character, target);
    const inRange =
      distancetoTarget <= dw.c.defaultSkills.woodcutting.range; /* Attack */

    if (!inRange) {
      dw.move(target.x, target.y);
    }

    if (dw.isSkillReady("chop") && inRange) {
      dw.setTarget(target);
      console.log("chop", target);
      dw.emit("chop", { id: target.id });
    }
  },
};
