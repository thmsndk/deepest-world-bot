import { Rectangle, drawingGroups } from "./draw";
import { GridMatrix } from "./grid";

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

export function moveToClosestSafeSpot(grid: GridMatrix) {
  let lowestThreatScore: number | undefined = undefined;
  let safestPoints: Array<{ x: number; y: number; distance: number }> = [];
  for (const row in grid) {
    const y = Number(row);
    const columns = grid[row];
    if (!columns) continue;
    for (const column in columns) {
      const x = Number(column);
      const tile = columns[column];

      if (!tile) continue;

      if (tile.threat === Infinity) continue;

      const distance = dw.distance(dw.character, { x, y });
      if (distance > 5) continue;

      const los = hasLineOfSight({ l: dw.character.l, x, y });
      if (!los) continue;

      if (tile.threat !== Infinity && (!lowestThreatScore || tile.threat < lowestThreatScore)) {
        // clear previous safe spots
        safestPoints = [];
        lowestThreatScore = tile.threat;
        // console.log("new lowest threat found", lowestThreatScore, [x, y]);
      }

      if (tile.threat === lowestThreatScore) {
        console.log("adding low threat point", [x, y]);
        safestPoints.push({ x, y, distance });
      }
    }
  }

  // closest points ascending
  safestPoints.sort((a, b) => a.distance - b.distance);

  const safestPoint = safestPoints.shift();

  if (safestPoint) {
    // Move to the point, avoiding high-danger tiles
    dw.move(safestPoint.x, safestPoint.y);
  } else {
    console.log("no safest point found");
  }
}
