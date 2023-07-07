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
// important note, negative y goes upwards
function storagePlacement() {
  // dw.move(dw.character.spawn.x-2.5, dw.character.spawn.y-2,5)
  // console.log(dw.c.spawn, [dw.c.x,dw.c.y], [dw.c.x-dw.c.spawn.x,dw.c.y-dw.c.spawn.y])
  // 0.44 width of box
  dw.emit("placeItem", {
    i: 0,
    x: dw.character.spawn.x - 2.5 + 0.44,
    y: dw.character.spawn.y + 2.5,
  });

  // we can place a box4,box7 at this location, being the top left corner of hour spawn, seems like we can place anything there
  dw.emit("placeItem", {
    i: 0,
    x: dw.character.spawn.x - 2.763,
    y: dw.character.spawn.y - 2.55,
  }); // place box top left of spawn
  dw.emit("placeItem", {
    i: 0,
    x: dw.character.spawn.x - 2.763 + 0.44,
    y: dw.character.spawn.y - 2.55,
  }); // place box to the right of another box
  dw.emit("placeItem", {
    i: 0,
    x: dw.character.spawn.x - 2.763,
    y: dw.character.spawn.y - 2.55 + 0.29,
  }); // place box below another box
  /*
    {
        "l": 0,
        "x": 58.76395570727661,
        "y": 70.55810452118975
    }
    [
        55.97193820295522,
        67.92043364440632
    ]
    [
        -2.792017504321386,
        -2.6376708767834316
    ]
    */
  // storage placement
  dw.emit("placeItem", {
    i: 0,
    x: dw.character.spawn.x - 5,
    y: dw.character.spawn.y + 5,
  });
  // (dw.character.spawn.x-2.763)+(dw.character.spawn.x+2.763) = 117.52791141455322
  // ((dw.character.spawn.x-2.763)+(dw.character.spawn.x+2.763))/0.44 = 267.10888957853 columns?
  // there is a max of 18 rows and 12 columns

  // gnal — Today at 08:36
  // i wonder if you can fix those 1px spaces with the real hitbox: 0.4375, 0.28125

  // https://discord.com/channels/1061772817529585775/1061772817529585777/1117636559085244537
  //   left should be floor(spawn.x-2) 
  // places top left
  // dw.emit("placeItem",{i:0,x:Math.floor(dw.c.spawn.x -2),y:Math.floor(dw.c.spawn.y -2)})
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const spawnUpperLeftCorner = {
    x: Math.floor(dw.c.spawn.x -2),
    y: Math.floor(dw.c.spawn.y -2),
  };
  let noBoxes = false;
  // places rows before columns, max 18 rows
  for (let row = 18; row <= 18; row++) {
    console.log("row", row);
    for (let col = 1; col <= 12; col++) {
      let indexBag = 0;
      while (
        indexBag < dw.c.bag.length &&
        (!dw.c.bag[indexBag] || dw.c.bag[indexBag].md !== "box2")
      ) {
        ++indexBag;
      }
      if (indexBag >= dw.c.bag.length) {
        noBoxes = true;
        break;
      }
      const px = spawnUpperLeftCorner.x + (col - 1) * 0.44;
      const py = spawnUpperLeftCorner.y + (row - 1) * 0.29;
      // range too low?
      const inPlaceRange = dw.distance(dw.c, { x: px, y: py }) < 2;
      if (!inPlaceRange) {
        dw.move(px, py - 0.5); // TODO move half the distance
        await sleep(2000);
      }
      console.log("placeItem", indexBag, px, py);
      dw.emit("placeItem", { i: indexBag, x: px, y: py });
      await sleep(500);
    }
    if (noBoxes) break;
  }
}

// box searcg
// https://discord.com/channels/1061772817529585775/1061772817529585777/1117638862475370607
function boxSearch() {
  let indexBag = 0;
  while (indexBag < dw.c.bag.length && dw.c.bag[indexBag]) {
    ++indexBag;
  }
  const GEMS = ["amethyst", "ruby", "sapphire", "diamond", "emerald"];
  const capitalize = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1);
  const RINGS = GEMS.map((gem) => `t1${capitalize(gem)}Ring`);
  const AMULETS = GEMS.map((gem) => `t1${capitalize(gem)}Amulet`);
  for (let box of dw.entities.filter(
    (e) => e.md === "box" && Math.hypot(e.x - dw.c.x, e.y - dw.c.y) < 2.0
  )) {
    if (indexBag >= dw.c.bag.length) break;
    for (let indexStorage in box.storage) {
      const item = box.storage[indexStorage];
      if (!item) continue;
      if (![...RINGS, ...AMULETS].includes(item.md)) continue;
      console.log(
        `move ${item.md} from box (id=${box.id}, index=${indexStorage}), to inventory slot ${indexBag}`
      );
      dw.moveItem("storage", parseInt(indexStorage), "bag", indexBag, box.id);
      ++indexBag;
      while (indexBag < dw.c.bag.length && dw.c.bag[indexBag]) {
        ++indexBag;
      }
      if (indexBag >= dw.c.bag.length) break;
    }
  }
}
// ore: 1 for ore

// loot a specific from storages

// sacrifice specific items
let altar = dw.entities.find((e) => e && e.md === "sacAltar1");
dw.character.bag
  .map((b, bIndex) => ({ item: b, bIndex: bIndex }))
  .filter((x) => x.item && x.item.qual <= 5 && x.item.r < 3 && !x.item.n)
  .forEach((x) => {
    if (altar) {
      console.log("sacItem", { id: altar.id, i: x.bIndex });
      dw.emit("sacItem", { id: altar.id, i: x.bIndex });
    }
  });
  // TODO: empty out essence, merge and such
