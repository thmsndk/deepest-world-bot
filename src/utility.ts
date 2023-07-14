import { Rectangle, drawingGroups } from "./draw";

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

interface Point {
  l: number;
  x: number;
  y: number;
}

export function hasLineOfSight(target: Point) {
  const straightPath = getTerrainInStraightLine(dw.character, target);
  return !straightPath.some((x) => x > 0 /* Air / Walkable */);
}

export function getTerrainInStraightLine(p1: Point, p2: Point) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const distance = Math.max(Math.abs(dx), Math.abs(dy));

  if (distance === 0) {
    return [];
  }

  // TODO: we can only move diagonally if there is an open tile towards it
  /**
   * We can not go from S to E here as both the west and the south tile of E is closed
   * C C C E
   * C O O C
   * S O C C
   */
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

type GridArray = Array<{ x: number; y: number; danger: number }>;
export function moveToRandomValidPointNearCharacter(grid: GridArray) {
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

export function generateGrid(gridSize = 30, resolution = 0.5) {
  gridSize = gridSize * resolution;
  // Calculate the center of the grid
  const centerX = Math.floor(gridSize / 2);
  const centerY = Math.floor(gridSize / 2);

  // TODO: we could construct an actual matrix, unsure about decimals though, could also just be a Map?
  // Create a grid of walkable tiles centered around the character
  const grid: GridArray = [];
  for (let i = 0; i < gridSize; i += resolution) {
    for (let j = 0; j < gridSize; j += resolution) {
      const { x, y } = snapToGrid(dw.character.x - centerX + i, dw.character.y - centerY + j, resolution);

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
      const distance = Math.sqrt(Math.pow(tile.x - entity.x, 2) + Math.pow(tile.y - entity.y, 2));
      if (distance <= dangerRadius) {
        tile.danger += dangerIncrement; // Increase the danger score within the radius
      }
    });
  });

  const getTileColor = ({ danger }: { danger: number }) => {
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
  drawingGroups["dangerGrid"] = [
    ...grid
      .filter((tile) => tile.danger > 0)
      .map<Rectangle>((tile) => ({
        type: "rectangle",
        point: { x: tile.x, y: tile.y },
        width: resolution * 96,
        height: resolution * 96,
        color: getTileColor(tile),
      })),
  ];
  return grid;
}

function snapToGrid(x: number, y: number, resolution = 0.5) {
  const snappedX = Math.round(x / resolution) * resolution;
  const snappedY = Math.round(y / resolution) * resolution;
  return { x: snappedX, y: snappedY };
}
