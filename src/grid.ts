import { Entity } from "./deepestworld";
import { Rectangle, drawingGroups } from "./draw";

export type GridMatrix = Array<
  Array<{
    threat: number;
  }>
>;

export function generateGrid(nonTraversableEntities: Array<Entity | TargetPoint>, gridSize = 50, resolution = 0.5) {
  gridSize = gridSize * resolution;
  // Calculate the center of the grid
  const centerX = dw.character.x - Math.floor(gridSize / 2);
  const centerY = dw.character.y - Math.floor(gridSize / 2);

  // TODO: we could construct an actual matrix, unsure about decimals though, could also just be a Map?
  // Create a grid of walkable tiles centered around the character
  const grid: GridMatrix = [];
  for (let i = 0; i < gridSize; i += resolution) {
    for (let j = 0; j < gridSize; j += resolution) {
      const { x, y } = snapToGrid(centerX + i, centerY + j, resolution);

      const terrain = dw.getTerrainAt({
        l: dw.character.l,
        x: x,
        y: y,
      });

      if (terrain > 0) continue;

      if (!grid[y]) {
        grid[y] = [];
      }

      if (!grid[y][x]) {
        grid[y][x] = {
          threat: getThreatLevel(x, y, nonTraversableEntities),
        };
      }
    }
  }

  // drawGrid(grid, resolution);
  // console.debug("generateGrid", grid);
  // console.table(grid);
  return grid;
}

function drawGrid(grid: GridMatrix, resolution: number) {
  drawingGroups["dangerGrid"] = [];

  for (const row in grid) {
    const y = Number(row);
    const columns = grid[row];
    if (!columns) continue;
    for (const column in columns) {
      const x = Number(column);
      const tile = columns[column];

      if (!tile) continue;

      //   if (tile.threat <= 0) continue;

      if (tile.threat <= 8) continue;

      drawingGroups["dangerGrid"].push({
        type: "rectangle",
        point: { x, y },
        width: resolution * 96,
        height: resolution * 96,
        // fillColor: getInterpolatedColor(tile.threat),
        fillColor: getColorByTreshhold(tile.threat),
      });
      drawingGroups["dangerGrid"].push({
        type: "text",
        point: { x, y },
        text: tile.threat.toFixed(2).toString(),
        lineWidth: 2,
        font: "12px arial",
      });
    }
  }
}

function snapToGrid(x: number, y: number, resolution = 0.5) {
  const snappedX = Math.round(x / resolution) * resolution;
  const snappedY = Math.round(y / resolution) * resolution;
  return { x: snappedX, y: snappedY };
}

function getThreatLevel(x: number, y: number, nonTraversableEntities: Array<Entity | TargetPoint>, maxDistance = 15) {
  let threat = 0;
  dw.entities.forEach((entity) => {
    if (!entity.ai) {
      return;
    }

    const distance = dw.distance({ x, y }, entity);

    // dw.targetId is our current target

    if (distance > maxDistance) {
      return 0;
    }

    // const los = hasLineOfSight(entity, dw.character, nonTraversableEntities);
    // if (!los) {
    //   return 0;
    // }

    threat += 5 / distance;

    if (entity.hostile) {
      threat += 10 / distance;
    }

    // We want a positive level difference to increase danger, as the entity is higher level than us, the closer it is to us, the more dangerous it is
    const levelDifference = entity.level - dw.character.level;
    if (levelDifference > 0) {
      const slope = -1;
      threat += levelDifference * (slope * distance + 10);
    }
    // We want a negative level difference to decrease danger, as the entity is lower level than us, the closer it is to us, the more "dangerous" it is

    // we want the skull danger to taper of the further away the distance
    // https://www.desmos.com/calculator/lxohoi6eu1
    // const skulls = entity.r;
    // threat += skulls * (-1 * distance + maxDistance);
  });

  return threat;
}

interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

export type GetColorConfig = {
  thresholds: number[];
  colors: Array<Color>;
};

function getColorByTreshhold(
  number: number,
  config: GetColorConfig = {
    thresholds: [0, 10, 20],
    colors: [
      { r: 255, g: 255, b: 255, a: 0.15 }, // White
      { r: 255, g: 255, b: 0, a: 0.4 }, // Yellow
      { r: 255, g: 0, b: 0, a: 0.4 }, // Red
    ],
  }
) {
  // Extract configuration values
  const { thresholds, colors } = config;

  // Find the appropriate range based on the given number
  let rangeIndex = 0;
  while (rangeIndex < thresholds.length - 1 && number >= thresholds[rangeIndex + 1]) {
    rangeIndex++;
  }

  // Get the colors for the current range
  const startColor = colors[rangeIndex];
  const { r, g, b, a } = startColor;

  //   const hexColor = rgbToHex(startColor.r, startColor.g, startColor.b);

  //   return hexColor;
  return `rgb(${r}, ${g}, ${b}, ${a})`;
}

function getInterpolatedColor(
  number: number,
  config: GetColorConfig = {
    thresholds: [0, 50, 100],
    colors: [
      { r: 255, g: 255, b: 255, a: 0.15 }, // White
      { r: 255, g: 255, b: 0, a: 0.5 }, // Yellow
      { r: 255, g: 0, b: 0, a: 0.5 }, // Red
    ],
  }
) {
  // Extract configuration values
  const { thresholds, colors } = config;

  // Find the appropriate range based on the given number
  let rangeIndex = 0;
  while (rangeIndex < thresholds.length - 1 && number >= thresholds[rangeIndex + 1]) {
    rangeIndex++;
    console.log(rangeIndex, thresholds.length, number);
  }

  // Calculate the position within the range
  const rangeStart = thresholds[rangeIndex];
  const rangeEnd = thresholds[rangeIndex + 1];
  const position = (number - rangeStart) / (rangeEnd - rangeStart);

  // Get the colors for the current range
  const startColor = colors[rangeIndex];
  const endColor = colors[Math.min(rangeIndex + 1, thresholds.length - 1)];

  if (!startColor || !endColor) {
    console.warn(rangeIndex, startColor, endColor, colors);
    return "#0000FF";
  }

  // Interpolate between the start and end colors
  const interpolatedColor = interpolateColor(startColor, endColor, position);

  // Convert the interpolated color to a hex string
  const hexColor = rgbToHex(interpolatedColor.r, interpolatedColor.g, interpolatedColor.b);

  return hexColor;
}

// Function to interpolate between two RGB colors
function interpolateColor(startColor: Color, endColor: Color, position: number) {
  const r = Math.round(startColor.r + (endColor.r - startColor.r) * position);
  const g = Math.round(startColor.g + (endColor.g - startColor.g) * position);
  const b = Math.round(startColor.b + (endColor.b - startColor.b) * position);

  return { r, g, b };
}

// Function to convert RGB values to a hex string
function rgbToHex(r: number, g: number, b: number) {
  const componentToHex = (c: number) => {
    const hex = c.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

export interface TargetPoint {
  x: number;
  y: number;
}

interface MapPoint {
  l: number;
  x: number;
  y: number;
}
// How wide to treat terrain for line of sight checks
let terrainThickness = 0.7;

function sqr(x: number) {
  return x * x;
}
function dist2(v: TargetPoint, w: TargetPoint) {
  return sqr(v.x - w.x) + sqr(v.y - w.y);
}
function distToSegmentSquared(p: TargetPoint, v: TargetPoint, w: TargetPoint) {
  var l2 = dist2(v, w);
  if (l2 == 0) return dist2(p, v);
  var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return dist2(p, {
    x: v.x + t * (w.x - v.x),
    y: v.y + t * (w.y - v.y),
  });
}

function distToSegment(p: TargetPoint, v: TargetPoint, w: TargetPoint) {
  return Math.sqrt(distToSegmentSquared(p, v, w));
}

/**
 * If any nonTraversableEntity is too close to the line segment between from and target, we do not have line of sight
 * @param target
 * @param from
 * @param nonTraversableEntities
 * @returns
 */
export function hasLineOfSight(
  target: MapPoint | Entity,
  from: { l: number; x: number; y: number } = dw.character,
  nonTraversableEntities: Array<Entity | TargetPoint>
) {
  if (dw.getTerrainAt({ l: from.l, x: target.x, y: target.y }) > 0) {
    return false;
  }

  for (let entity of nonTraversableEntities) {
    let thickCheck = terrainThickness;

    // skip the entity target, e.g. we don't care that the tree we are looking for is "blocking";
    if ("id" in entity && "id" in target && entity.id === target.id) continue;

    // blocking entities treated as half as big as terrain
    if ("id" in entity && entity.id) thickCheck = terrainThickness / 2;
    if (distToSegment(entity, from, target) < thickCheck) {
      return false;
    }
  }

  return true;
}

const gridWidth = 24; // in-game units, this captures the area entities load in
const gridHeight = 16;

export function getNonTraversableEntities() {
  let nonTraversableEntities: Array<Entity | TargetPoint> = dw.entities.filter(
    (e) => !e.ai && !e.player && !e.ore && !e.md.includes("portal")
  );

  // walk thru chunks and add everything that is not 0
  const characterMapLevel = dw.character.l.toString();
  let chunkPropertyKeys = Object.keys(dw.chunks).filter((k) => k.startsWith(characterMapLevel));
  for (let k of chunkPropertyKeys) {
    let r = Number(k.split(".")[2]);
    let c = Number(k.split(".")[1]);
    for (let i = 0; i < 16; ++i) {
      for (let j = 0; j < 16; ++j) {
        if (dw.chunks[k][0][i][j] > 0) {
          let x = r * 16 + j;
          let y = c * 16 + i;

          // Don't care about terrain out of the grid area
          if (dw.distance({ x: x, y: y }, dw.c) > gridWidth) continue;

          nonTraversableEntities.push({ x: x + terrainThickness / 2, y: y + terrainThickness / 2 });
        }
      }
    }
  }

  return nonTraversableEntities;
}

function getTileInfo(x: number, y: number, radius: number, monsters: Entity[], nonTraversableEntities: TargetPoint[]) {
  // monsters exists so we don't have to iterate ALL entities, all the time
  let nearMonsters = monsters.filter((m) => dw.distance({ x: x, y: y }, m) < radius);
  // let target = dw.findEntities((entity) => entity.id === dw.targetId).shift()
}
