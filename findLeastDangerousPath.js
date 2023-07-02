
/**
 *
 * gScores: This object stores the cost from the start tile to each tile on the grid. Initially, all scores are set to Infinity except for the start tile, which is set to 0. As the algorithm progresses, the actual cost from the start to each tile is updated.
 * fScores: This object stores the total estimated cost from the start tile to the end tile through each tile on the grid. It is the sum of the gScore (actual cost from the start) and the heuristic estimate from the current tile to the end tile. Initially, all scores are set to Infinity except for the start tile, which is set to the heuristic estimate.
 * In each iteration of the A* algorithm, the tile with the lowest fScore is chosen for evaluation. The fScore acts as a priority value, guiding the search towards tiles that are likely to lead to the least dangerous path.
 * The gScore is updated for each neighbor of the current tile based on the cumulative danger level from the start tile to the current tile. If a better (lower) gScore is found for a neighbor, it means that the current path to that neighbor is less dangerous, and the gScore and fScore are updated accordingly.
 * The fScore is updated by adding the gScore to the heuristic estimate for each neighbor. This gives an estimate of the total cost from the start to the end through the current neighbor.
 * @param {*} grid
 * @param {*} start
 * @param {*} end
 * @param {*} dangerThreshold
 * @returns
 */
function findLeastDangerousPath(grid, p1, p2, dangerThreshold) {
    const openSet = new Set(); // Tiles to be evaluated
    const closedSet = new Set(); // Evaluated tiles
    const gScores = {}; // Cost from start to each tile
    const fScores = {}; // Total estimated cost from start to end through each tile
    const previous = {}; // Stores the previous tile in the path
  
    const start = grid.find((t) => t.x === p1.x && t.y === p1.y);
    const end = grid.find((t) => t.x === p2.x && t.y === p2.y);
    // console.log("findLeastDangerousPath", p1, start, p2, end, grid);
  
    // Initialize scores
    for (const tile of grid) {
      gScores[tile] = Infinity;
      fScores[tile] = Infinity;
      previous[tile] = null;
    }
  
    gScores[start] = 0;
    fScores[start] = heuristicCost(start, end); // Heuristic estimate for start
  
    openSet.add(start);
  
    while (openSet.size > 0) {
      // Find the tile with the lowest fScore
      let current = null;
      let lowestFScore = Infinity;
  
      for (const tile of openSet) {
        if (fScores[tile] < lowestFScore) {
          lowestFScore = fScores[tile];
          current = tile;
        }
      }
  
      // Exit the loop if destination reached or danger threshold exceeded
      if (current === end || current.danger > dangerThreshold) {
        break;
      }
  
      openSet.delete(current);
      closedSet.add(current);
  
      const neighbors = getNeighbors(current, grid);
      for (const neighbor of neighbors) {
        // Skip neighbors already evaluated or with danger level exceeding the threshold
        if (closedSet.has(neighbor) || neighbor.danger > dangerThreshold) {
          continue;
        }
  
        const tentativeGScore = gScores[current] + neighbor.danger;
  
        if (!openSet.has(neighbor)) {
          openSet.add(neighbor);
        } else if (tentativeGScore >= gScores[neighbor]) {
          continue;
        }
  
        // Update scores and previous tile
        previous[neighbor] = current;
        gScores[neighbor] = tentativeGScore;
        fScores[neighbor] = gScores[neighbor] + heuristicCost(neighbor, end);
      }
    }
  
    // Trace back the path
    const path = [];
    let current = end;
  
    while (current !== null) {
      path.unshift(current);
      current = previous[current];
    }
  
    return path;
  }

  // Helper function to calculate the heuristic cost
function heuristicCost(tileA, tileB) {
    // Manhattan distance heuristic
    const dx = Math.abs(tileA.x - tileB.x);
    const dy = Math.abs(tileA.y - tileB.y);
    return dx + dy;
  }
  
  