import { Rectangle, drawingGroups } from "./draw";
import { hasLineOfSight } from "./utility";

export type GridMatrix = Array<
  Array<{
    threat: number;
  }>
>;

export function generateGrid(gridSize = 30, resolution = 0.5) {
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
          threat: getThreatLevel(x, y),
        };
      }
    }
  }

  drawingGroups["dangerGrid"] = [];

  for (let y = 0; y < grid.length; y += resolution) {
    const columns = grid[y];
    if (!columns) continue;
    for (let x = 0; x < columns?.length; x += resolution) {
      const tile = columns[x];

      if (!tile) continue;

      if (tile.threat <= 0) continue;

      drawingGroups["dangerGrid"].push({
        type: "rectangle",
        point: { x, y },
        width: resolution * 96,
        height: resolution * 96,
        // fillColor: getInterpolatedColor(tile.threat),
        fillColor: getColorByTreshhold(tile.threat),

        fillAlpha: 0.25,
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
  //   console.debug("generateGrid");
  //   console.table(grid);
  return grid;
}

function snapToGrid(x: number, y: number, resolution = 0.5) {
  const snappedX = Math.round(x / resolution) * resolution;
  const snappedY = Math.round(y / resolution) * resolution;
  return { x: snappedX, y: snappedY };
}

function getThreatLevel(x: number, y: number, maxDistance = 15) {
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

    const los = hasLineOfSight(entity);
    if (!los) {
      return 0;
    }

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
      { r: 255, g: 255, b: 255 }, // White
      { r: 255, g: 255, b: 0 }, // Yellow
      { r: 255, g: 0, b: 0 }, // Red
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

  // Convert the interpolated color to a hex string
  const hexColor = rgbToHex(startColor.r, startColor.g, startColor.b);

  return hexColor;
}

function getInterpolatedColor(
  number: number,
  config: GetColorConfig = {
    thresholds: [0, 50, 100],
    colors: [
      { r: 255, g: 255, b: 255 }, // White
      { r: 255, g: 255, b: 0 }, // Yellow
      { r: 255, g: 0, b: 0 }, // Red
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
