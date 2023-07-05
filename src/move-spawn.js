/**
 * move spawn v1.0
 * paste theese functions into developer console, or incorporate them in your code.
 * Then do the following
 * - go to current spawn
 * - persist current spawn somewhere so you can remember your old spawn oldSpawnPoint = dw.c.spawn
 * - saveSpawnEntities(dw.c.spawn)
 * - pick up as many things as you can
 * - go to new desired spawn
 * - dw.emit('setSpawn')
 * - placeItemsAtNewSpawn(oldSpawnPoint, dw.c.spawn)
 * - then go back to pick up more of your old spawn, return to your new spawn and run placeItemsAtNewSpawn again.
 */

// const oldSpawn = {
//   l: 0,
//   x: 58.76395570727661,
//   y: 70.55810452118975,
// };

// new spawn
// {
//     "l": 0,
//     "x": 34.791152779344785,
//     "y": 130.06244399528052
// }

// offset calculation {dx: -23.972802927931824, dy: 59.50433947409077}

// 1086740347 top left box hash
// {
//     "id": 90,
//     "x": 56.00095570727661,
//     "y": 68.00810452118975,
//     "hash": "1086740347"
//   }
// {i:0,x:Math.floor(dw.c.spawn.x -2),y:Math.floor(dw.c.spawn.y -2)}
// {i: 0, x: 32, y: 128}

// x 56.00095570727661 -23.972802927931824
// 32.028152779344786

// y 68.00810452118975 + 59.50433947409077
// 127.51244399528052

// dw.emit("placeItem",{i:0,x:32.028152779344786,y:127.51244399528052})
// 127 is wrong, that is above 128, we can place at 128 and higher values

// new calculation = {id: 223, x: 32.791152779344785, y: 128.06244399528052, hash: '1086740347'
// it's wrong though, the rows does not align

// new calculation 2
// const spawnOffset = calculateSpawnOffset(
//   {
//     l: 0,
//     x: 58.76395570727661,
//     y: 70.55810452118975,
//   },
//   { x: 56.00095570727661, y: 68.00810452118975 }
// );
// {dx: -1.99904429272339, dy: -1.9918954788102496}

// {
//   nx: Math.floor(c.spawn.x) + spawnOffset.dx,
//   ny: Math.floor(c.spawn.y) + spawnOffset.dy,
// }
// {nx: 32.00095570727661, ny: 128.00810452118975}

/*
placeItemsAtNewSpawn({
    l: 0,
    x: 58.76395570727661,
    y: 70.55810452118975,
  },dw.c.spawn)
*/

function generateHash(entity) {
  const hashedObject = JSON.stringify({
    md: entity.md,
    storage: entity.storage,
  });

  let hash = 0;
  for (let i = 0; i < hashedObject.length; i++) {
    const charCode = hashedObject.charCodeAt(i);
    hash = (hash << 5) - hash + charCode;
    hash |= 0;
  }

  return String(hash);
}

function calculateOffset(oldSpawn, entity) {
  const dx = entity.x - Math.floor(oldSpawn.x);
  const dy = entity.y - Math.floor(oldSpawn.y);

  return { dx, dy };
}

function saveSpawnEntities(spawnPoint) {
  // Generate a key using the old spawn point and a string
  const storageKey = `spawn_${spawnPoint.x}_${spawnPoint.y}_entities`;
  const entities = dw.entities
    .filter((entity) => entity.ownerDbId === dw.character.dbId)
    .map((entity) => ({
      id: entity.id,
      x: entity.x,
      y: entity.y,
      hash: generateHash(entity),
    }));
  console.log(spawnPoint, "was saved in localstorage", storageKey);
  dw.set(storageKey, entities);
}

// TODO: Pick up old spawn entities meyhod

async function placeItemsAtNewSpawn(oldSpawnPoint, newSpawnPoint) {
  // Generate a key using the old spawn point and a string
  const storageKey = `spawn_${oldSpawnPoint.x}_${oldSpawnPoint.y}_entities`;

  const oldSpawnEntities = dw.get(storageKey).reduce((result, entity) => {
    const { x, y, hash } = entity;

    if (!result[hash]) {
      result[hash] = [];
    }

    const spawnOffset = calculateOffset(oldSpawnPoint, entity);

    result[hash].push({
      x,
      y,
      nx: Math.floor(newSpawnPoint.x) + spawnOffset.dx,
      ny: Math.floor(newSpawnPoint.y) + spawnOffset.dy,
    });
    return result;
  }, {});

  // find existing placed entities and remove them from oldSpawnEntities.
  for (const entity of dw.entities) {
    if (entity.ownerDbId !== dw.character.dbId) continue;
    const { x, y } = entity;
    const hash = generateHash(entity);
    const positions = oldSpawnEntities[hash];
    if (!positions) continue;
    const alreadyPlacedItemIndex = positions.findIndex(
      ({ nx, ny }) => nx === x && ny === y
    );
    if (alreadyPlacedItemIndex > -1) {
      //   console.log(hash, entity.md, `already placed at`, [x, y], entity);
      positions.splice(alreadyPlacedItemIndex, 1);
      
      if (positions.length === 0) {
        delete oldSpawnEntities[hash];
      }
    }
  }

  // TODO: sort positions for smarter placement?
  //   console.log(spawnOffset, oldSpawnEntities);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // loop inventory and find matching entities
  for (let indexBag = 0; indexBag < dw.character.bag.length; indexBag++) {
    let item = dw.character.bag[indexBag];
    if (!item) continue;

    // stoneAnvil has an empty array as storage placed in world, but not as an item.
    if (!item.storage && !["missionBoard", "mailbox"].includes(item.md)) {
      item = { ...item };
      item.storage = []; // missionboard has 4 nulls in it when placed and when in inventory
    }

    const hash = generateHash(item);
    const positions = oldSpawnEntities[hash];
    if (!positions) continue;
    console.log(indexBag, item, hash, positions);
    const entity = positions.pop();
    if (entity) {
      console.log(
        hash,
        `was found from old spawn at bag index ${indexBag}`,
        entity
      );
      const { nx, ny } = entity;
      const inPlaceRange = dw.distance(dw.c, { x: nx, y: ny }) < 2;
      if (!inPlaceRange) {
        console.log("out of range for placement, moving to ", nx, ny);
        dw.move(nx, ny - 0.5);
        await sleep(3000);
      }
      console.log("placeItem", indexBag, nx, ny);
      dw.emit("placeItem", { i: indexBag, x: nx, y: ny });
      await sleep(500);
    }
    if (positions.length === 0) {
      delete oldSpawnEntities[hash];
    }
  }

  console.log("Missing Placements", oldSpawnEntities);
}