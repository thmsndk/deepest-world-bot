/**
 * Things to automate
 * TODO farm trees to produce charcoal
 * TODO box upgrade to larger boxes
 * TODO: generate danger grid, always,
 * TODO: kite using danger grid.
 * TODO: party handling with my other char or other players
 */

import { addTask, process } from "./tasks";
import { selfHeal } from "./tasks/heal-self";

dw.debug = 1;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function run() {
  // Loop  state transitions that pushes a state onto the stack
  while (true) {
    // TODO: or perhaps introduce a priority queue, so we can add tasks in whatever order.
    const targetingMe = dw.findClosestMonster(
      (entity) => entity.targetId === dw.character.id
    );

    if (targetingMe) {
      // TODO: this makes us kill the closes target, instead of sticking to the same target
      addTask(["kill", targetingMe]);
    } else {
      // TODO: Farm trees
      // TODO: Farm ore
      // TODO: Farm mobs
      // auto Craft charcoal to a treshhold
      // craft iron bars?
      // disenchant items?
      // TODO: start, join, abandon mission
    }

    // TODO: inventory full => 3 tasks goToSpawn,depositItems,returnToPosition

    addTask(selfHeal());

    // TODO: update danger grid, should always be done, but we want to take the next task and process it after that
    // we don't want to farm while killing, unless we can't kill it

    // TODO add default tasks? farm tree, farm ore, farm friendly goo
    // run current state/task
    process();
    sleep(100);
  }
}

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

// storage placement
// https://discord.com/channels/1061772817529585775/1061772817529585777/1117636559085244537
// const sleep = ms => new Promise(r => setTimeout(r, ms));
// const spawnUpperLeftCorner = {x: 14, y: 2};
// let noBoxes = false;
// for (let col = 8; col < 12; ++col) {
//     for (let row = 5; row < 8; ++row) {
//         let indexBag = 0;
//         while (indexBag < dw.c.bag.length && (!dw.c.bag[indexBag] || dw.c.bag[indexBag].md !== 'box')) {
//             ++indexBag;
//         }
//         if (indexBag >= dw.c.bag.length) {
//             noBoxes = true;
//             break;
//         }

//         dw.emit('placeItem', {i: indexBag, x: spawnUpperLeftCorner.x + col * 0.44, y: spawnUpperLeftCorner.y + row * 0.22});
//         await sleep(500);
//     }
//     if (noBoxes) break;
// }

// box searcg
// https://discord.com/channels/1061772817529585775/1061772817529585777/1117638862475370607
// let indexBag = 0;
// while (indexBag < dw.c.bag.length && dw.c.bag[indexBag]) {
//     ++indexBag;
// }
// const GEMS = ['amethyst', 'ruby', 'sapphire', 'diamond', 'emerald'];
// const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
// const RINGS = GEMS.map((gem) => `t1${capitalize(gem)}Ring`);
// const AMULETS = GEMS.map((gem) => `t1${capitalize(gem)}Amulet`);
// for (let box of dw.entities.filter((e) => e.md === 'box' && Math.hypot(e.x - dw.c.x, e.y - dw.c.y) < 2.0)) {
//     if (indexBag >= dw.c.bag.length) break;
//     for (let indexStorage in box.storage) {
//         const item = box.storage[indexStorage];
//         if (!item) continue;
//         if (![...RINGS, ...AMULETS].includes(item.md)) continue;
//         console.log(`move ${item.md} from box (id=${box.id}, index=${indexStorage}), to inventory slot ${indexBag}`);
//         dw.moveItem('storage', parseInt(indexStorage), 'bag', indexBag, box.id);
//         ++indexBag;
//         while (indexBag < dw.c.bag.length && dw.c.bag[indexBag]) {
//             ++indexBag;
//         }
//         if (indexBag >= dw.c.bag.length) break;
//     }
// }

// ore: 1 for ore
