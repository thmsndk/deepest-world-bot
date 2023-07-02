dw.debug = 1;
const farmMobs = true;
const farmTrees = true;
const farmOre = false;
const farmGems = true;
const farmMissions = true;
const treeDistance = 10;

// 10,-16 mision table crafting

// go to spawn
function goHome() {
  dw.move(dw.character.spawn.x, dw.character.spawn.y);
}
// Add to console
top.goHome = goHome;

// old spawn {l:0,x:58,y:70}
const GEMS = ["amethyst", "ruby", "sapphire", "diamond", "emerald"];
function isGem(entity) {
  return GEMS.filter((g) => entity.md.indexOf(g) > -1)[0];
}

function getGemColor(entity) {
  const gem = GEMS.filter((g) => entity.md.indexOf(g) > -1)[0];
  switch (gem) {
    case "amethyst":
      return "#9966cc";
    case "ruby":
      return "#9B111E";
    case "sapphire":
      return "#0F52BA";
    case "diamond":
      return "#B9F2FF";
    case "emerald":
      return "#50C878";
    default:
      return "white";
  }
}

setInterval(async () => {
  drawingGroups["gems"] = [
    ...dw.entities
      .filter((e) => GEMS.some((g) => e.md.indexOf(g) > -1))
      .map((e) => ({
        type: "circle",
        point: { x: e.x, y: e.y },
        radius: 0.25,
        color: getGemColor(e),
        strokeWidth: 5,
      })),
  ];
  // TODO: don't enter too high lvl missions
  // Handle death in missions and joining it again

  const mailboxes = dw.entities.filter(
    (entity) => entity.md === "mailbox" && entity.storage.length > 0
  );

  //

  //   dw.moveItem(bagFrom, indexFrom, bagTo, indexTo, idFrom, idTo)
  // Your character bag names are: 'bag', 'crafting', 'abilities', 'abilityBag'.
  // Other objects bag names are: 'storage'.
  /*
  if you transfer from mailbox (fromId) to yourself (toId = undefined, no id required since the server already knows your id) 
  from mailbox (fromId) to a box (toId)
  from your character (fromId = undefined, since no id req) to a box (toId) 
  */

  // md === "missionBag"
  // dw.moveItem("storage", 0, "bag", 13, 4155 /* mail */, 17637 /* me */)

  // dw.moveItem("storage", 0, "bag", 13, 4155 /* mail */, 17637 /* mailId */)

  // if we have

  const missionBoards = dw.entities.filter(
    (entity) =>
      entity.ownerDbId === dw.character.dbId &&
      entity.md === "missionBoard" &&
      entity.storage.length > 0
  );

  // dw.character.bag.findIndex(b => b && b.md === "missionBag")
  // if we have a mission bag, we probably just completed a mission

  const missionBagIndex = dw.character.bag.findIndex(
    (b) => b && b.md === "missionBag"
  );

  if (missionBagIndex > -1 && !dw.character.combat) {
    // TODO: What if we don't have enoug bagspace to open it?
    dw.emit("openItem", { i: missionBagIndex });

    dw.emit("sortInv");

    // tp home for free
    dw.emit("unstuck");

    // TODO: add mission to missionBoard
  }

  if (dw.character.mission) {
    // const timeLeft = dw.character.mission.timeoutAt - new Date().getTime();
    // const shouldAbandonMission =
    //   dw.character.mission &&
    //   dw.character.mission.progress < 100 &&
    //   timeLeft <= 5 * 60000;
    // // TODO: teleport when timer is getting too low

    // if (shouldAbandonMission && missionBoards.length > 0) {
    //   // TODO should probably find the correct mission board to abandon
    //   dw.abandonMission();
    // }

    if (/*!shouldAbandonMission &&*/ missionBoards.length > 0) {
      const board = missionBoards[0];
      const inRange = dw.distance(dw.character, board) <= 2;
      if (!inRange) {
        dw.move(board.x, board.y);
        return;
      } else {
        dw.enterMission();
        return;
      }
    }
  } else {
    if (missionBoards.length > 0 && farmMissions) {
      const board = missionBoards[0];
      const boardInRange = dw.distance(dw.character, board) <= 2;

      const missionsInBag = dw.character.bag
        .map((b, bagIndex) => ({ item: b, bagIndex: bagIndex }))
        .filter(
          (x) =>
            x.item &&
            x.item.md.endsWith("Mission") &&
            x.item.qual <= 5 && // only auto add up to lvl 5 missions
            x.item.r < 3 &&
            !x.item.n
        );

      // populate missionboard
      if (missionsInBag.length > 0) {
        for (let index = 0; index < board.storage.length; index++) {
          const mission = board.storage[index];
          if (!mission) {
            if (!boardInRange) {
              dw.move(board.x, board.y);
              return;
            } else {
              const missionToAdd = missionsInBag.pop();
              dw.moveItem(
                "bag",
                missionToAdd.bagIndex,
                "storage",
                index,
                null,
                board.id
              );
            }
          }
          // TODO: do we have a mission below lvl 6 in our bag?

          // TODO: move into range of board
          // TODO add mission to board
        }

        // accept mission
        for (let index = 0; index < board.storage.length; index++) {
          const mission = board.storage[index];
          if (mission) {
            if (!boardInRange) {
              dw.move(board.x, board.y);
              return;
            } else {
              dw.acceptMission(board.id, index);
            }
            break;
          }
        }
      }
    }
  }

  // TODO z-index
  drawingGroups["spawnArea"] = [
    {
      type: "rectangle",
      point: { x: dw.character.spawn.x, y: dw.character.spawn.y },
      width: 5 * 96,
      height: 5 * 96,
      color: "#00FF00",
    },
    {
      type: "circle",
      point: { x: dw.character.spawn.x, y: dw.character.spawn.y },
      radius: 0.5,
      color: "#00FF00",
    },
  ];

  const grid = generateGrid();

  const targetingMe = dw.findClosestMonster(
    (entity) => entity.targetId === dw.character.id
  );

  const healthPercentage = dw.character.hp / dw.character.hpMax;
  const isLowHealth = healthPercentage < 0.25;

  if (healthPercentage < 0.75 /*&& !dw.character.gcd*/) {
    // dw.c.fx contains debuff/effect

    if (dw.isSkillReady(4) /* slowheal1 */ && !dw.character.fx["slowheal1"]) {
      console.log(
        "low health, slowheal1",
        healthPercentage,
        dw.character.hp,
        dw.character.hpMax
      );
      dw.useSkill(4, dw.character);
      //   dw.useSkill(3, { id: dw.character.id });
      //   dw.emit("skill", { md: "heal", i: 3, id: dw.character.id });
      return;
    }

    if (
      healthPercentage < 0.5 &&
      dw.isSkillReady(3) /* heal */ &&
      !dw.character.fx["heal"]
    ) {
      console.log(
        "low health, heal",
        healthPercentage,
        dw.character.hp,
        dw.character.hpMax
      );
      dw.useSkill(3, dw.character);
      //   dw.useSkill(3, { id: dw.character.id });
      //   dw.emit("skill", { md: "heal", i: 3, id: dw.character.id });
      return;
    }

    if (
      healthPercentage < 0.15 &&
      dw.isSkillReady(2) /* fastheal1 */ &&
      !dw.character.fx["fastheal1"]
    ) {
      console.log(
        "low health, fastheal1",
        healthPercentage,
        dw.character.hp,
        dw.character.hpMax
      );
      dw.useSkill(2, dw.character);
      // dw.useSkill(2, { i:2, id: dw.character.id });
      //   dw.emit("skill", { md: "fastheal1", i: 2, id: dw.character.id });
      return;
    }
  }

  if (isLowHealth && !targetingMe) {
    console.log(healthPercentage, dw.character.hp, dw.character.hpMax);
    return;
  }

  const closestEntity = dw.entities
    .filter(
      (entity) =>
        entity.l === dw.character.l &&
        ((farmMobs && entity.ai) ||
          (farmTrees && entity.tree) ||
          (farmOre && entity.ore) ||
          (farmGems && isGem(entity)))
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
    console.log("no target, drunken walk");
    drunkenWalk();
    return;
  }

  const distancetoTarget = dw.distance(dw.character, target);
  const los = hasLineOfSight(target);

  const start = snapToGrid(dw.character.x, dw.character.y, 0.5);
  // const neigbors = getNeighbors(start, grid);

  drawingGroups["targetPath"] = [
    // {
    //   type: "path",
    //   points: path,
    //   color: "#DA70D6",
    // },
    {
      type: "circle",
      point: { x: target.x, y: target.y },
      radius: 0.25,
      color: "#DA70D6",
    },
    {
      type: "line",
      startPoint: { x: dw.character.x, y: dw.character.y },
      endPoint: { x: target.x, y: target.y },
      color: !los ? "#F00" : "#00FF56",
    },
    // ...neigbors.map((tile) => ({
    //   type: "rectangle",
    //   point: { x: tile.x, y: tile.y },
    //   width: 0.5 * 96,
    //   height: 0.5 * 96,
    //   color: "#354acc",
    // })),
  ];

  const goal = snapToGrid(target.x, target.y, 0.5);

  if (!los) {
    console.log("no los", start, goal);
    // // TODO: pathfind and move to first point on path
    // const path = await findPath(start, goal, 0.5); // causes game to freeze sometimes, limit iterations?
    // drawingGroups["targetPath"].push({
    //   type: "path",
    //   points: path,
    //   color: "#DA70D6",
    //   strokeWidth: 4,
    // });

    // if (path.length > 1) {
    //   const firstPoint = path[1];

    //   dw.move(firstPoint.x, firstPoint.y);
    // }

    drunkenWalk();
    // moveToRandomValidPointNearCharacter(grid);
    return;
  }

  // const path = findLeastDangerousPath(grid, start, goal, 500);
  // const path = await findPath(start, goal, 0.5); // causes game to freeze sometimes, limit iterations?
  // drawingGroups["targetPath"].push({
  //   type: "path",
  //   points: path,
  //   color: "#DA70D6",
  //   strokeWidth: 4,
  // });

  if (target.ore) {
    const inRange =
      distancetoTarget <= dw.c.defaultSkills.mining.range; /* Attack */
    if (!inRange) {
      dw.move(target.x, target.y);
    }

    if (dw.isSkillReady("mine") && inRange) {
      dw.setTarget(target);
      // console.log("mine", target);
      dw.emit("mine", { id: target.id });
    }
  } else if (target.tree) {
    const inRange =
      distancetoTarget <= dw.c.defaultSkills.woodcutting.range; /* Attack */
    if (!inRange) {
      dw.move(target.x, target.y);
    }

    if (dw.isSkillReady("chop") && inRange) {
      dw.setTarget(target);
      // console.log("chop", target);
      dw.emit("chop", { id: target.id });
    }
  } else {
    let skillToUse = undefined;
    for (const skill of dw.character.skills) {
      if (!skill) continue;
      if (!skillToUse) {
        skillToUse = skill;
      }

      if (skillToUse && skillToUse !== skill) {
        const skillToUseDamage = Object.entries(dw.character.skills).reduce(
          (result, [key, value]) => {
            if (key.endsWith("Dmg")) {
              result += value;
            }
            return result;
          },
          0
        );

        const skillDamage = Object.entries(dw.character.skills).reduce(
          (result, [key, value]) => {
            if (key.endsWith("Dmg")) {
              result += value;
            }
            return result;
          },
          0
        );

        if (skillDamage > skillToUseDamage) {
          skillToUse = skill;
        }
      }
    }
    const inAttackRange = distancetoTarget <= skillToUse.range; /* Attack */
    if (!inAttackRange) {
      dw.move(target.x, target.y);
    } else {
      moveToRandomValidPointNearCharacter(grid);
    }

    // TODO: determine best skill to attack with from skillbar, most dmg? resistances?
    if (dw.isSkillReady(skillToUse.md) && inAttackRange) {
      dw.setTarget(target);
      // console.log("attack");
      dw.useSkill(skillToUse.md, target);
    }
  }
}, 500);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function findPath(
  start,
  goal,
  resolution = 0.5,
  maxOperations = 800,
  visualize = false
) {
  // console.log("findPath", start, goal);
  start = snapToGrid(start.x, start.y, resolution);
  goal = snapToGrid(goal.x, goal.y, resolution);

  // console.log("findPath snapped", start, goal);

  function getNeighbours(tile, tiles, resolution = 0.5) {
    if (!tile) return [];
    const neighbours = [];
    const { x, y } = tile;

    // Define possible movement directions
    const directions = [
      { dx: -1, dy: 0 }, // Left
      { dx: 1, dy: 0 }, // Right
      { dx: 0, dy: -1 }, // Up
      { dx: 0, dy: 1 }, // Down
      { dx: -1, dy: -1 }, // Diagonal: Top-left
      { dx: 1, dy: -1 }, // Diagonal: Top-right
      { dx: -1, dy: 1 }, // Diagonal: Bottom-left
      { dx: 1, dy: 1 }, // Diagonal: Bottom-right
    ];

    for (const direction of directions) {
      const nx = x + direction.dx * resolution;
      const ny = y + direction.dy * resolution;

      const neighbourKey = getKey(tile);
      const existingTile = tiles[neighbourKey];

      if (!existingTile) {
        const neighbourTile = snapToGrid(nx, ny, resolution);
        // TODO: collision detection? e.g. boxes and what not.
        // console.log("getNeighbours", { x, y }, neighbourTile);
        const terrain =
          nx && ny
            ? dw.getTerrainAt({ l: dw.character.l, x: nx, y: ny })
            : null;
        const isWalkable = terrain === 0; /* Air / Walkable */

        if (isWalkable) {
          tiles.set(neighbourKey, neighbourTile);
          neighbours.push(neighbourTile);
        }
      } else {
        neighbours.push(existingTile);
      }
    }

    return neighbours;
  }

  const openSet = new Set(); // Tiles to be evaluated
  const closedSet = new Set(); // Evaluated tiles
  const tiles = new Map();
  const gScores = {}; // Cost from start to each tile
  const fScores = {}; // Total estimated cost from start to end through each tile
  const previous = {}; // Stores the previous tile in the path

  function getKey({ x, y }) {
    return `${x}${y}`;
  }

  const startKey = getKey(start);
  gScores[startKey] = 0;
  fScores[startKey] = heuristicCost(start, goal); // Heuristic estimate for start

  tiles.set(startKey, start);
  openSet.add(start);

  function equalTiles(a, b) {
    return a.x === b.x && a.y === b.y;
  }
  let operations = 0;
  // Find the tile with the lowest fScore
  let current = null;
  let currentKey = null;
  try {
    // console.log("starting while loop");

    while (openSet.size > 0 && operations < maxOperations) {
      operations++;
      // await sleep(500);

      // console.log("openSet", openSet);

      let lowestFScore = Infinity;

      if (visualize) {
        drawingGroups["pathfinding"] = [
          {
            type: "circle",
            point: { x: start.x, y: start.y },
            radius: 0.25,
            color: "#00FF00",
          },
          {
            type: "circle",
            point: { x: goal.x, y: goal.y },
            radius: 0.25,
            color: "#FF00EA",
          },
        ];
      }

      for (const tile of openSet) {
        const key = getKey(tile);
        const fScore = fScores[key];
        // console.log(key, tile, )
        if (fScore < lowestFScore) {
          // console.log(`${fScore}<${lowestFScore} new current tile`, tile);
          lowestFScore = fScore;
          current = tile;
          currentKey = getKey(tile);
        }

        if (visualize) {
          drawingGroups["pathfinding"].push(
            // render open set
            {
              type: "rectangle",
              point: { x: tile.x, y: tile.y },
              width: resolution * 96,
              height: resolution * 96,
              color: "#FFFFFF",
            }
          );
        }
      }

      if (visualize) {
        drawingGroups["pathfinding"].push(
          // render current node
          {
            type: "rectangle",
            point: { x: dw.character.spawn.x, y: dw.character.spawn.y },
            width: resolution * 96,
            height: resolution * 96,
            color: "#00FF00",
          }
        );
      }

      // Exit the loop if destination reached or danger threshold exceeded
      // console.log(
      //   "Have we reached the end?",
      //   current,
      //   goal,
      //   current === goal,
      //   equalTiles(current, goal)
      // );
      // TODO: look up danger in danger grid.
      if (equalTiles(current, goal) /*|| current.danger > dangerThreshold*/) {
        // console.log("reached end");
        break;
      }

      // console.log("remove from open set", current, openSet.delete(current));
      closedSet.add(currentKey);

      const neighbours = getNeighbours(current, tiles, resolution);
      for (const neighbour of neighbours) {
        const neighbourKey = getKey(neighbour);

        // Skip neighbors already evaluated or with danger level exceeding the threshold
        if (
          closedSet.has(neighbourKey) /*|| neighbor.danger > dangerThreshold*/
        ) {
          continue;
        }

        if (visualize) {
          // TODO: render neigbours
          drawingGroups["pathfinding"].push(
            // render open set
            {
              type: "rectangle",
              point: { x: neighbour.x, y: neighbour.y },
              width: resolution * 96,
              height: resolution * 96,
              color: "#1F00FF",
            }
          );
        }

        const tentativeGScore = gScores[currentKey]; /*+ neighbor.danger*/

        if (!openSet.has(neighbour)) {
          openSet.add(neighbour);
        } else if (tentativeGScore >= gScores[neighbourKey]) {
          continue;
        }

        // Update scores and previous tile
        previous[neighbourKey] = current;
        gScores[neighbourKey] = tentativeGScore;
        fScores[neighbourKey] =
          gScores[neighbourKey] + heuristicCost(neighbour, goal);
      }
    }
  } catch (error) {
    console.error("failed while loop", error);
  }

  // console.log("Trace back the path");
  // Trace back the path
  const path = [];
  if (operations >= maxOperations) {
    console.warn(
      "too many operations, partial path found",
      operations,
      maxOperations,
      path
    );
  } else {
    current = goal;
  }

  while (current) {
    path.unshift(current);
    current = previous[getKey(current)];
  }

  // console.log("path", path);
  if (visualize) {
    drawingGroups["pathfinding"].push({
      type: "path",
      points: path,
      color: "#DA70D6",
      strokeWidth: 5,
    });
  }

  // await sleep(5000);

  return path;
}
// Add to console
top.findPath = findPath;

function generateGrid(gridSize = 30, resolution = 0.5) {
  gridSize = gridSize * resolution;
  // Calculate the center of the grid
  const centerX = Math.floor(gridSize / 2);
  const centerY = Math.floor(gridSize / 2);

  // TODO: we could construct an actual matrix, unsure about decimals though, could also just be a Map?
  // Create a grid of walkable tiles centered around the character
  const grid = [];
  for (let i = 0; i < gridSize; i += resolution) {
    for (let j = 0; j < gridSize; j += resolution) {
      const { x, y } = snapToGrid(
        dw.character.x - centerX + i,
        dw.character.y - centerY + j,
        resolution
      );

      const terrain = dw.getTerrainAt({
        l: dw.character.l,
        x: x,
        y: y,
      });

      if (terrain > 0) continue;

      const tile = {
        x: x,
        y: y,
        danger: 0, // Initialize danger score for each tile
      };
      grid.push(tile);
    }
  }

  // Calculate danger score for each tile based on nearby entities
  const entities = dw.entities; // Assuming you have access to the list of entities
  entities.forEach((entity) => {
    if (!entity.ai) {
      return;
    }

    let dangerRadius = 2; // Adjust this value based on the desired radius of danger around entities
    let dangerIncrement = 1;

    if (entity.hostile && entity.targetId !== dw.character.id) {
      dangerRadius += 1;
      dangerIncrement = 2;
    }

    if (entity.hostile && entity.level > dw.character.level) {
      dangerRadius += (entity.level - dw.character.level) / 2;
      dangerIncrement = 2;
    }

    // TODO: adjust danger level with more than 1
    if (entity.l !== dw.character.l) return;
    grid.forEach((tile) => {
      const distance = Math.sqrt(
        Math.pow(tile.x - entity.x, 2) + Math.pow(tile.y - entity.y, 2)
      );
      if (distance <= dangerRadius) {
        tile.danger += dangerIncrement; // Increase the danger score within the radius
      }
    });
  });

  const getTileColor = ({ danger }) => {
    if (danger === 0) {
      return "white";
    }

    if (danger <= 1) {
      return "yellow";
    }

    if (danger === 2) {
      return "orange";
    }

    if (danger > 2) {
      return "red";
    }
  };
  // drawingGroups["dangerGrid"] = [
  //   ...grid.map((tile) => ({
  //     type: "rectangle",
  //     point: { x: tile.x, y: tile.y },
  //     width: resolution * 96,
  //     height: resolution * 96,
  //     color: getTileColor(tile),
  //   })),
  // ];
  return grid;
}
let lastDrunkDirection = null;
function drunkenWalk(resolution = 1) {
  // Define the character's initial position
  let { x, y } = dw.character;
  drawingGroups["drunkenWalk"] = [];

  if (lastDrunkDirection) {
    // keep going in the same direction if it is a valid direction
    const nx = x + lastDrunkDirection.dx;
    const ny = y + lastDrunkDirection.dy;
    // world coord to local coord
    // Math.floor(x) & 15
    // const goal = snapToGrid(nx, ny, resolution);
    // const goal = { x: Math.floor(nx) & 15, y: Math.floor(ny) & 15 };
    const goal = { x: nx, y: ny };
    const terrain = dw.getTerrainAt({
      l: dw.character.l,
      x: goal.x,
      y: goal.y,
    });
    const isWalkable = terrain === 0; /* Air / Walkable */
    // TODO: we can only move diagonally, if we can get there manhattan style

    drawingGroups["drunkenWalk"].push(
      // render open set
      {
        type: "rectangle",
        point: { x: goal.x, y: goal.y },
        width: 96,
        height: 96,
        color: isWalkable ? "#00FF00" : "#FF0000",
      }
    );

    if (isWalkable) {
      console.log("drunk move same direction", nx, ny, terrain);
      dw.move(nx, ny);
      return;
    }
  }

  // Determine the next move randomly
  let directions = [
    { dx: -1, dy: 0 }, // Left
    { dx: 1, dy: 0 }, // Right
    { dx: 0, dy: -1 }, // Up
    { dx: 0, dy: 1 }, // Down
    // { dx: -1, dy: -1 }, // Diagonal: Top-left
    // { dx: 1, dy: -1 }, // Diagonal: Top-right
    // { dx: -1, dy: 1 }, // Diagonal: Bottom-left
    // { dx: 1, dy: 1 }, // Diagonal: Bottom-right
  ];

  directions.filter(
    (pos) =>
      dw.getTerrainAt({
        l: dw.character.l,
        x: dw.character.x + pos.dx,
        y: dw.character.y + pos.dy,
      }) === 0 /* Air / Walkable */
  );

  drawingGroups["drunkenWalk"] = [
    ...directions.map(({ x, y }) => ({
      type: "rectangle",
      point: { x, y },
      width: 96,
      height: 96,
      color: "#1F00FF",
    })),
  ];

  lastDrunkDirection =
    directions[Math.floor(Math.random() * directions.length)];

  // Update the character's position
  x += lastDrunkDirection.dx;
  y += lastDrunkDirection.dy;

  // const goal = snapToGrid(x, y, resolution);
  const goal = { x: x, y: y };
  // const goal = { x: Math.floor(x) & 15, y: Math.floor(y) & 15 };
  drawingGroups["drunkenWalk"].push(
    // render open set
    {
      type: "rectangle",
      point: { x: goal.x, y: goal.y },
      width: 96,
      height: 96,
      color: "#00FF00",
    }
  );

  console.log("drunk move new direction", x, y, directions);
  dw.move(x, y);
}

function moveToRandomValidPointNearCharacter(grid) {
  // TODO: given dw.character with x and y properties construct a x by x grid of walkable tiles using dw.getTerrainAt({ x, y });
  // TODO: if an entity is on a tile, give that tile a higher danger as well as tiles in a radius around it
  // TODO: pick a random valid point with the lowest score and use dw.move(x,y) to move to that, making sure you don't cross tiles with high danger

  // Find valid points with the lowest score
  const lowestDanger = Math.min(...grid.map((tile) => tile.danger));
  const safestPoints = grid.filter((tile) => tile.danger === lowestDanger);

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

function getTerrainInStraightLine(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const distance = Math.max(Math.abs(dx), Math.abs(dy));
  if (distance === 0) {
    return [];
  }

  const terrainArray = [];

  for (let i = 0; i <= distance; i++) {
    const x = p1.x + Math.round((dx * i) / distance);
    const y = p1.y + Math.round((dy * i) / distance);
    // console.log("getTerrainInStraightLine", distance, { l: p1.l, x, y });
    if (x && y) {
      const terrain = dw.getTerrainAt({ l: p1.l, x, y });

      terrainArray.push(terrain);
    }
  }

  //   console.log(terrainArray);

  return terrainArray;
}

function hasLineOfSight(target) {
  const straightPath = getTerrainInStraightLine(dw.character, target);
  return !straightPath.some((x) => x > 0 /* Air / Walkable */);
}

function getNeighbors(tile, grid, resolution = 0.5) {
  const neighbors = [];
  const { x, y } = tile;

  // Define possible movement directions
  const directions = [
    { dx: -1, dy: 0 }, // Left
    { dx: 1, dy: 0 }, // Right
    { dx: 0, dy: -1 }, // Up
    { dx: 0, dy: 1 }, // Down
    { dx: -1, dy: -1 }, // Diagonal: Top-left
    { dx: 1, dy: -1 }, // Diagonal: Top-right
    { dx: -1, dy: 1 }, // Diagonal: Bottom-left
    { dx: 1, dy: 1 }, // Diagonal: Bottom-right
  ];

  for (const direction of directions) {
    const nx = x + direction.dx * resolution;
    const ny = y + direction.dy * resolution;

    // Check if the neighboring tile is within the grid bounds
    // if (nx >= 0 && nx < grid[0].length && ny >= 0 && ny < grid.length) {
    const neighbor = grid.find((t) => t.x === nx && t.y === ny); // inefficient, should tiles contain links to neighbours?
    if (neighbor) {
      neighbors.push(neighbor);
    }
    // }
  }

  return neighbors;
}

function snapToGrid(x, y, resolution = 0.5) {
  const snappedX = Math.round(x / resolution) * resolution;
  const snappedY = Math.round(y / resolution) * resolution;
  return { x: snappedX, y: snappedY };
}

// Helper function to calculate the heuristic cost
function heuristicCost(tileA, tileB) {
  // Manhattan distance heuristic
  const dx = Math.abs(tileA.x - tileB.x);
  const dy = Math.abs(tileA.y - tileB.y);
  return dx + dy;
}
