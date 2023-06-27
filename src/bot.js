dw.debug = 1;
const farmMobs = true;
const farmTrees = false;
const treeDistance = 10;

// go to spawn
//dw.move(dw.character.spawn.x,dw.character.spawn.y)

setInterval(() => {
  const targetingMe = dw.findClosestMonster(
    (entity) => entity.targetId === dw.character.id
  );

  const isLowHealth = dw.character.hp / dw.character.hpMax < 0.25;

  if (dw.character.hp / dw.character.hpMax < 0.75 /*&& !dw.character.gcd*/) {
    // dw.c.fx contains debuff/effect

    if (dw.isSkillReady(4) /* slowheal1 */ && !dw.character.fx["slowheal1"]) {
      console.log("low health, slowheal1");
      dw.useSkill(4, dw.character);
      //   dw.useSkill(3, { id: dw.character.id });
      //   dw.emit("skill", { md: "heal", i: 3, id: dw.character.id });
      return;
    }

    if (dw.isSkillReady(3) /* heal */ && !dw.character.fx["heal"]) {
      console.log("low health, heal");
      dw.useSkill(3, dw.character);
      //   dw.useSkill(3, { id: dw.character.id });
      //   dw.emit("skill", { md: "heal", i: 3, id: dw.character.id });
      return;
    }

    if (dw.isSkillReady(2) /* fastheal1 */ && !dw.character.fx["fastheal1"]) {
        console.log("low health, fastheal1");
        dw.useSkill(2, dw.character);
        // dw.useSkill(2, { i:2, id: dw.character.id });
        //   dw.emit("skill", { md: "fastheal1", i: 2, id: dw.character.id });
        return;
      }
  }

  if (isLowHealth && !targetingMe) {
    console.log(
      dw.character.hp / dw.character.hpMax,
      dw.character.hp,
      dw.character.hpMax
    );
    return;
  }

  const closestEntity = dw.entities
    .filter(
      (entity) =>
        entity.l === dw.character.l &&
        ((farmMobs && entity.ai) || (farmTrees && entity.tree))
    )
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

  const target = targetingMe ?? closestEntity[0]?.entity;

  if (!target) {
    console.log("no target");
    moveToRandomValidPointNearCharacter();
    return;
  }

  const distancetoTarget = dw.distance(dw.character, target);
  const los = hasLineOfSight(target);

  if (!los) {
    console.log("no los");
    moveToRandomValidPointNearCharacter();
    return;
  }

  if (target.tree) {
    const inRange =
      distancetoTarget <= dw.c.defaultSkills.woodcutting.range; /* Attack */
    if (!inRange) {
      dw.move(target.x, target.y);
    }

    if (dw.isSkillReady("chop") && inRange) {
      console.log("chop", target);
      dw.emit("chop", { id: target.id });
    }
  } else {
    const inAttackRange =
      distancetoTarget <= dw.character.skills[0].range; /* Attack */
    if (!inAttackRange) {
      dw.move(target.x, target.y);
    } else {
      moveToRandomValidPointNearCharacter();
    }

    if (dw.isSkillReady(0) && inAttackRange) {
      console.log("attack");
      dw.useSkill(0, target);
    }
  }
}, 500);

function moveToRandomValidPointNearCharacter() {
  // TODO: given dw.character with x and y properties construct a x by x grid of walkable tiles using dw.getTerrainAt({ x, y });
  // TODO: if an entity is on a tile, give that tile a higher danger as well as tiles in a radius around it
  // TODO: pick a random valid point with the lowest score and use dw.move(x,y) to move to that, making sure you don't cross tiles with high danger
  const character = dw.character; // Assuming you have access to the character object
  const gridSize = 10; // Adjust this value based on the desired size of the grid

  // Calculate the center of the grid
  const centerX = Math.floor(gridSize / 2);
  const centerY = Math.floor(gridSize / 2);

  // Create a grid of walkable tiles centered around the character
  const grid = [];
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const terrain = dw.getTerrainAt({
        l: dw.character.l,
        x: character.x - centerX + i,
        y: character.y - centerY + j,
      });
      const tile = {
        x: character.x - centerX + i,
        y: character.y - centerY + j,
        walkable: terrain === 0, // Assuming 0 represents walkable terrain
        danger: 0, // Initialize danger score for each tile
      };
      grid.push(tile);
    }
  }

  // Calculate danger score for each tile based on nearby entities
  const entities = dw.entities; // Assuming you have access to the list of entities
  entities.forEach((entity) => {
    let dangerRadius = 3; // Adjust this value based on the desired radius of danger around entities
    if (entity.hostile && entity.targetId !== dw.character.id) dangerRadius = 10;

    if (entity.l !== dw.character.l) return;
    grid.forEach((tile) => {
      const distance = Math.sqrt(
        Math.pow(tile.x - entity.x, 2) + Math.pow(tile.y - entity.y, 2)
      );
      if (distance <= dangerRadius) {
        tile.danger += 1; // Increase the danger score within the radius
      }
    });
  });

  // Find valid points with the lowest score
  const validPoints = grid.filter((tile) => tile.walkable);
  const lowestDanger = Math.min(...validPoints.map((tile) => tile.danger));
  const safestPoints = validPoints.filter(
    (tile) => tile.danger === lowestDanger
  );

  // Pick a random point from the safest points
  const randomIndex = Math.floor(Math.random() * safestPoints.length);
  const randomPoint = safestPoints[randomIndex];

  // Move to the random point, avoiding high-danger tiles
  dw.move(randomPoint.x, randomPoint.y); // Assuming dw.move(x, y) moves the character
}

// TODO: attack error: los , we need to determine if we have line of sight to a mob.
// TODO: pathfinding, find a path to a mob.

function getChunkKey(l, y, x) {
  return l + "." + Math.floor(y / 16) + "." + Math.floor(x / 16);
}

function worldCoordToLocalCoord(x) {
  return Math.floor(x) & 15;
}

// function getTerrainUnder(entity) {
//     const chunkKey = getChunkKey(entity.l-1, entity.y-1, entity.x);
//     const localY = worldCoordToLocalCoord(entity.y-1);
//     const localX = worldCoordToLocalCoord(entity.x);
//     return dw.chunks[chunkKey][0][localY][localX];
// }

// function findPath(from, to) {
//   const chunkKey = getChunkKey(dw.character.l, dw.character.y, dw.character.x);
//   // get my terrain info, then get neighbour terrain info
//   dw.getTerrainAt({ l: dw.character.l, x: dw.character.x, y: dw.character.y });
//   // 1 seems to be unwalkable / a wall
// }

//   [
//     "craft",
//     {
//       "id": 365,
//       "md": "workbench",
//       "max": 1
//     }
//   ]

// ["placeItem", { i: 6, x: 57.06254644358234, y: 69.46362541032049 }];

// ["skill", { md: "fastheal1", i: 2, id: 9814 }];

function getTerrainInStraightLine(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const distance = Math.max(Math.abs(dx), Math.abs(dy));

  const terrainArray = [];

  for (let i = 0; i <= distance; i++) {
    const x = p1.x + Math.round((dx * i) / distance);
    const y = p1.y + Math.round((dy * i) / distance);

    const terrain = dw.getTerrainAt({ l: p1.l, x, y });
    terrainArray.push(terrain);
  }

  //   console.log(terrainArray);

  return terrainArray;
}

function hasLineOfSight(target) {
  const straightPath = getTerrainInStraightLine(dw.character, target);
  return !straightPath.some((x) => x > 0 /* Air / Walkable */);
}

function findPath(p1, p2) {
  // Define helper functions

  // Heuristic function to estimate the distance between two points
  function heuristic(node) {
    const dx = Math.abs(node.x - p2.x);
    const dy = Math.abs(node.y - p2.y);
    return dx + dy;
  }

  // Function to check if a point is walkable
  function isWalkable(node) {
    const terrain = dw.getTerrainAt({ l: node.l, x: node.x, y: node.y });
    return terrain === 0;
  }

  // A* algorithm implementation
  function aStar() {
    const openSet = [p1]; // Nodes to be evaluated
    const cameFrom = {}; // Parent nodes for each node
    const gScore = { [getKey(p1)]: 0 }; // Cost from start node to each node
    const fScore = { [getKey(p1)]: heuristic(p1) }; // Estimated total cost from start node to goal

    while (openSet.length > 0) {
      // Find the node with the lowest fScore
      let currentNode = openSet.reduce((a, b) =>
        fScore[getKey(a)] < fScore[getKey(b)] ? a : b
      );

      if (
        currentNode.l === p2.l &&
        currentNode.x === p2.x &&
        currentNode.y === p2.y
      ) {
        // Reached the goal, reconstruct the path
        return reconstructPath(cameFrom, currentNode);
      }

      openSet.splice(openSet.indexOf(currentNode), 1); // Remove current node from openSet

      // Get the neighbors of the current node
      const neighbors = getNeighbors(currentNode);

      for (const neighbor of neighbors) {
        const neighborKey = getKey(neighbor);
        const tentativeGScore = gScore[getKey(currentNode)] + 1; // Assuming each step has a cost of 1

        if (!isWalkable(neighbor) || tentativeGScore >= gScore[neighborKey]) {
          continue; // Skip this neighbor
        }

        // This path is the best until now, record it
        cameFrom[neighborKey] = currentNode;
        gScore[neighborKey] = tentativeGScore;
        fScore[neighborKey] = tentativeGScore + heuristic(neighbor);

        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor); // Add neighbor to openSet
        }
      }
    }

    // No path found
    return null;
  }

  // Helper function to get a unique key for a node
  function getKey(node) {
    return `${node.l}-${node.x}-${node.y}`;
  }

  // Helper function to get the neighbors of a node
  function getNeighbors(node) {
    const neighbors = [];
    const offsets = [
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: -1 },
      { x: 0, y: 1 },
    ]; // Possible movement directions

    for (const offset of offsets) {
      const neighbor = {
        l: node.l,
        x: node.x + offset.x,
        y: node.y + offset.y,
      };
      neighbors.push(neighbor);
    }

    return neighbors;
  }

  // Helper function to reconstruct the path
  function reconstructPath(cameFrom, currentNode) {
    const path = [currentNode];
    let current = currentNode;

    while (cameFrom[getKey(current)]) {
      current = cameFrom[getKey(current)];
      path.unshift(current);
    }

    return path;
  }

  // Call the A* algorithm to find the path
  return aStar();
}

// // Usage example
// const p1 = { l: dw.character.l, x: dw.character.x, y: dw.character.y };
// const p2 = { l: desiredLevel, x: desiredX, y: desiredY };
// const path = findPath(p1, p2);

// if (path) {
//   console.log("Path found:", path);
// } else {
//   console.log("No path found.");
// }
