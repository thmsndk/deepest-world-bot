/**
 * Things to automate
 * TODO farm trees to produce charcoal
 * TODO box upgrade to larger boxes
 * TODO: generate danger grid, always,
 * TODO: kite using danger grid.
 * TODO: party handling with my other char or other players
 */

import { registerConsoleCommands } from "./console";
import { addTask, process } from "./tasks";
import { defendSelf } from "./tasks/defend-self";
import { explore } from "./tasks/exploration";
import { selfHeal } from "./tasks/heal-self";
import { mission } from "./tasks/mission";
import { sleep } from "./utility";

dw.debug = 1;

async function run() {
  // Loop  state transitions that pushes a state onto the stack
  while (true) {
    // TODO: start, join, abandon mission
    // TODO: Farm trees
    // TODO: Farm ore
    // TODO: Farm mobs
    // auto Craft charcoal to a treshhold
    // craft iron bars?
    // disenchant items?

    addTask(explore());

    addTask(mission());

    addTask(defendSelf());

    // TODO: inventory full => 3 tasks goToSpawn,depositItems,returnToPosition

    addTask(selfHeal());

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
