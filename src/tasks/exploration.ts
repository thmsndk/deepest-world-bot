import { TASK_STATE, TaskTuple, taskRegistry } from ".";
import { sleep } from "../utility";
const TASK_NAME = "exploration";

export function explore(): TaskTuple {
  return [TASK_NAME];
}

taskRegistry[TASK_NAME] = {
  run: async () => {
    return await drunkenWalk();
  },
};

// TODO: a counter , random, with amount of walks before changing new direction, could also be time stamp of last new direction
let lastCharacterCoordinates = { x: dw.character.x, y: dw.character.y };
let lastDrunkDirection: { dx: number; dy: number };
let lastDrunkDirectionTimestamp = new Date();
async function drunkenWalk(resolution = 1) {
  // Define the character's initial position
  let { x, y } = dw.character;
  //   drawingGroups["drunkenWalk"] = [];

  const timeSinceLastDrunkDirection = new Date().getTime() - lastDrunkDirectionTimestamp.getTime();
  const walkedInSameDirectionForTooLong = timeSinceLastDrunkDirection > 10000; /* 10 seconds */ // TODO  random time period.

  const isSamePlace =
    lastCharacterCoordinates.x === dw.character.x &&
    lastCharacterCoordinates.y === dw.character.y &&
    timeSinceLastDrunkDirection > 5000; /* 5 seconds */

  if (isSamePlace) {
    console.warn(
      "STUCK? force new direction ",
      [lastCharacterCoordinates.x, lastCharacterCoordinates.y],
      [dw.character.x, dw.character.y],
      timeSinceLastDrunkDirection
    );
    await sleep(250);
  }

  if (lastDrunkDirection && !isSamePlace && !walkedInSameDirectionForTooLong) {
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

    // drawingGroups["drunkenWalk"].push(
    //   // render open set
    //   {
    //     type: "rectangle",
    //     point: { x: goal.x, y: goal.y },
    //     width: 96,
    //     height: 96,
    //     color: isWalkable ? "#00FF00" : "#FF0000",
    //   }
    // );

    if (isWalkable) {
      console.log("drunk move same direction", nx, ny, terrain);
      lastCharacterCoordinates = { x: dw.character.x, y: dw.character.y };
      dw.move(nx, ny);
      return TASK_STATE.EVALUATE_NEXT_TICK;
      //   return TASK_STATE.DONE;
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

  //   drawingGroups["drunkenWalk"] = [
  //     ...directions.map(({ x, y }) => ({
  //       type: "rectangle",
  //       point: { x, y },
  //       width: 96,
  //       height: 96,
  //       color: "#1F00FF",
  //     })),
  //   ];

  lastDrunkDirection = directions[Math.floor(Math.random() * directions.length)];
  lastDrunkDirectionTimestamp = new Date();

  // Update the character's position
  x += lastDrunkDirection.dx;
  y += lastDrunkDirection.dy;

  // const goal = snapToGrid(x, y, resolution);
  const goal = { x: x, y: y };
  // const goal = { x: Math.floor(x) & 15, y: Math.floor(y) & 15 };
  //   drawingGroups["drunkenWalk"].push(
  //     // render open set
  //     {
  //       type: "rectangle",
  //       point: { x: goal.x, y: goal.y },
  //       width: 96,
  //       height: 96,
  //       color: "#00FF00",
  //     }
  //   );

  console.log(
    "drunk move new direction",
    isSamePlace,
    walkedInSameDirectionForTooLong,
    timeSinceLastDrunkDirection,
    x,
    y,
    directions
  );
  dw.move(x, y);
  //   return TASK_STATE.EVALUATE_NEXT_TICK;
  return TASK_STATE.DONE;
}
