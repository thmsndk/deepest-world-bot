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

export function hasLineOfSight(target: Point, renderPath = false) {
  // const straightPath = getTerrainInStraightLine(dw.character, target);

  // return !straightPath.some((x) => x > 0 /* Air / Walkable */);

  return getWalkablePathInStraightLine(dw.character, target, renderPath);
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

export function getWalkablePathInStraightLine(p1: Point, p2: Point, renderPath = false) {
  // horizontal distance between the points.
  const dx = p2.x - p1.x;
  // vertical distance between the points.
  const dy = p2.y - p1.y;
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);
  const signX = dx === 0 ? 0 : dx > 0 ? 1 : -1;
  const signY = dy === 0 ? 0 : dy > 0 ? 1 : -1;

  let x = p1.x;
  let y = p1.y;
  const path: Point[] = [p1];

  drawingGroups["attackAndRandomWalkLOS"] = [];

  if (adx >= ady) {
    const slopeY = ady / adx;

    for (let i = 0; i < adx; i++) {
      const neighborX = Math.round(x + signX);
      const neighborY = Math.round(y + signY);

      const nextXIsWalkable = dw.getTerrainAt({ l: p1.l, x: neighborX, y }) === 0;
      const nextYIsWalkable = dw.getTerrainAt({ l: p1.l, x, y: neighborY }) === 0;
      const currentIsWalkable = dw.getTerrainAt({ l: p1.l, x: Math.round(x), y: Math.round(y) }) === 0;

      // drawingGroups["attackAndRandomWalkLOS"].push({
      //   type: "rectangle",
      //   point: { x, y },
      //   width: 96,
      //   height: 96,
      //   fillColor: currentIsWalkable ? "green" : "red",
      //   fillAlpha: 0.5,
      // });

      // drawingGroups["attackAndRandomWalkLOS"].push(
      //   {
      //     type: "rectangle",
      //     point: { x: neighborX, y },
      //     width: 96,
      //     height: 96,
      //     // fillColor: getInterpolatedColor(tile.threat),
      //     fillColor: nextXIsWalkable ? "green" : "red",
      //     fillAlpha: 0.5,
      //   },
      //   {
      //     type: "rectangle",
      //     point: { x, y: neighborY },
      //     width: 96,
      //     height: 96,
      //     // fillColor: getInterpolatedColor(tile.threat),
      //     fillColor: nextYIsWalkable ? "green" : "red",
      //     fillAlpha: 0.5,
      //   }
      // );

      if (!currentIsWalkable || (!nextXIsWalkable && !nextYIsWalkable)) {
        if (renderPath) {
          drawingGroups["attackAndRandomWalkLOS"].push(
            {
              type: "path",
              points: path,
              color: "green",
            },
            {
              type: "line",
              startPoint: path.length > 0 ? path[path.length - 1] : dw.character,
              endPoint: p2,
              color: "red",
            }
          );
        }

        return null; // Line of sight is blocked
      }

      path.push({ l: p1.l, x: Math.round(x), y: Math.round(y) });

      x += signX;
      y += signY * slopeY;
    }
  } else {
    const slopeX = adx / ady;

    for (let i = 0; i < ady; i++) {
      const neighborX = Math.round(x + signX);
      const neighborY = Math.round(y + signY);

      const nextXIsWalkable = dw.getTerrainAt({ l: p1.l, x: neighborX, y }) === 0;
      const nextYIsWalkable = dw.getTerrainAt({ l: p1.l, x, y: neighborY }) === 0;
      const currentIsWalkable = dw.getTerrainAt({ l: p1.l, x: Math.round(x), y: Math.round(y) }) === 0;

      // drawingGroups["attackAndRandomWalkLOS"].push({
      //   type: "rectangle",
      //   point: { x, y },
      //   width: 96,
      //   height: 96,
      //   fillColor: currentIsWalkable ? "green" : "red",
      //   fillAlpha: 0.5,
      // });

      // drawingGroups["attackAndRandomWalkLOS"].push(
      //   {
      //     type: "rectangle",
      //     point: { x: neighborX, y },
      //     width: 96,
      //     height: 96,
      //     // fillColor: getInterpolatedColor(tile.threat),
      //     fillColor: nextXIsWalkable ? "green" : "red",
      //     fillAlpha: 0.5,
      //   },
      //   {
      //     type: "rectangle",
      //     point: { x, y: neighborY },
      //     width: 96,
      //     height: 96,
      //     // fillColor: getInterpolatedColor(tile.threat),
      //     fillColor: nextYIsWalkable ? "green" : "red",
      //     fillAlpha: 0.5,
      //   }
      // );

      if (!currentIsWalkable || (!nextXIsWalkable && !nextYIsWalkable)) {
        if (renderPath) {
          drawingGroups["attackAndRandomWalkLOS"].push(
            {
              type: "path",
              points: path,
              color: "green",
            },
            {
              type: "line",
              startPoint: path.length > 0 ? path[path.length - 1] : dw.character,
              endPoint: p2,
              color: "red",
            }
          );
        }

        return null; // Line of sight is blocked
      }

      path.push({ l: p1.l, x: Math.round(x), y: Math.round(y) });

      x += signX * slopeX;
      y += signY;
    }
  }

  if (renderPath) {
    drawingGroups["attackAndRandomWalkLOS"].push({
      type: "path",
      points: path,
      color: "#00FF56",
    });
  }

  return path; // Return the path if line of sight is clear
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
        // console.log("adding low threat point", [x, y]);
        safestPoints.push({ x, y, distance });
      }
    }
  }

  // closest points ascending
  safestPoints.sort((a, b) => a.distance - b.distance);

  const safestPoint = safestPoints.shift();

  if (safestPoint) {
    const resolution = 0.5;
    drawingGroups["move"] = [
      {
        type: "rectangle",
        point: safestPoint,
        width: resolution * 96,
        height: resolution * 96,
        color: "#00FF56",
        strokeWidth: 3,
      },
    ];
    // Move to the point, avoiding high-danger tiles
    dw.move(safestPoint.x, safestPoint.y);
  } else {
    console.log("no safest point found");
  }
}
