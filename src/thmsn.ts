/**
 * Things to automate
 * TODO farm trees to produce charcoal
 * TODO box upgrade to larger boxes
 * TODO: generate danger grid, always,
 * TODO: kite using danger grid.
 * TODO: party handling with my other char or other players
 */

import { registerConsoleCommands } from "./console";
import { Entity } from "./deepestworld";
import { drawingGroups, onDrawEnd } from "./draw";
import { drawNameplates } from "./draw-nameplates";
import { GridMatrix, TargetPoint, generateGrid, getNonTraversableEntities } from "./grid";
import { addTask, process } from "./tasks";
import { defendSelf } from "./tasks/defend-self";
import { explore } from "./tasks/exploration";
import { farmTrees } from "./tasks/farm-trees";
import { selfHeal } from "./tasks/heal-self";
import { inventory_ledger } from "./tasks/inventory-ledger";
import { mission } from "./tasks/mission";
import { sleep } from "./utility";

console.log(`INITIALIZING\n ${String.raw`__BANNER__`}`);

dw.debug = 1;
let grid: GridMatrix = [];
let nonTraversableEntities: Array<Entity | TargetPoint> = [];
async function run() {
  // Loop  state transitions that pushes a state onto the stack
  while (true) {
    drawingGroups["move"] = [];
    drawingGroups["targetPath"] = [];
    drawingGroups["target"] = [];

    // TODO: start, join, abandon mission
    // TODO: Farm trees
    // TODO: Farm ore
    // TODO: Farm mobs
    // auto Craft charcoal to a treshhold
    // craft iron bars?
    // disenchant items?

    addTask(explore());

    addTask(mission(grid, nonTraversableEntities));

    addTask(farmTrees(nonTraversableEntities));

    addTask(defendSelf(grid, nonTraversableEntities));

    // TODO: inventory full => 3 tasks goToSpawn,depositItems,returnToPosition

    addTask(selfHeal());

    addTask(inventory_ledger());

    // TODO: update danger grid, should always be done, but we want to take the next task and process it after that
    // we don't want to farm while killing, unless we can't kill it

    // TODO add default tasks? farm tree, farm ore, farm friendly goo
    // run tasks this tick
    await process();
    await sleep(250);
  }
}

void run();

registerConsoleCommands();
onDrawEnd();

setInterval(() => {
  drawNameplates();
}, 250);

setInterval(() => {
  try {
    nonTraversableEntities = getNonTraversableEntities();
    grid = generateGrid(nonTraversableEntities);
  } catch (error) {
    console.error("failed generating grid", error);
  }
}, 250);

// todo: use hit event instead
dw.on("diff", (data) => {
  // TODO: unsure about diff structure
  if (data.some((x) => x.id === dw.character.id && x.died)) {
    console.warn("WE DIED!", data);
    // presumeably at the data.x and data.y coordinates
    // store last death, and a we died state
    // TODO: deposit items
    // TODO: return to death location
    // addTask(selfDeath());
  }
});
