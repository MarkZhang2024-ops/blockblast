import { GameConfig } from '../config/GameConfig';
import { countFilled } from '../core/Board';
import { clamp } from '../core/MathUtil';
import type { BoardMetrics, Grid } from '../core/Types';

/**
 * 评估空间结构：占用、接近满的行列、空洞连通块和碎片化。
 * 只读棋盘。
 */
export function evaluateBoard(grid: Grid): BoardMetrics {
  const size = grid.length;
  const counts = countFilled(grid);
  const rowFill: number[] = [];
  const colFilled = new Array<number>(size).fill(0);
  for (let row = 0; row < size; row += 1) {
    let filled = 0;
    for (let col = 0; col < size; col += 1) {
      if (grid[row][col] !== 0) {
        filled += 1;
        colFilled[col] += 1;
      }
    }
    rowFill.push(size === 0 ? 0 : filled / size);
  }
  const colFill = colFilled.map((filled) => (size === 0 ? 0 : filled / size));
  const almost = GameConfig.evaluator.almostFullRatio;
  let almostFullRows = 0;
  let almostFullCols = 0;
  for (const fill of rowFill) {
    if (fill >= almost && fill < 1) almostFullRows += 1;
  }
  for (const fill of colFill) {
    if (fill >= almost && fill < 1) almostFullCols += 1;
  }

  const seen: boolean[][] = [];
  for (let row = 0; row < size; row += 1) seen.push(new Array<boolean>(size).fill(false));
  let holeComponents = 0;
  let largestHole = 0;
  let isolatedHoles = 0;
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (grid[row][col] !== 0 || seen[row][col]) continue;
      holeComponents += 1;
      let count = 0;
      const stack: Array<[number, number]> = [[row, col]];
      seen[row][col] = true;
      while (stack.length > 0) {
        const current = stack.pop();
        if (!current) break;
        count += 1;
        const neighbors: Array<[number, number]> = [
          [current[0] - 1, current[1]],
          [current[0] + 1, current[1]],
          [current[0], current[1] - 1],
          [current[0], current[1] + 1],
        ];
        for (const [nextRow, nextCol] of neighbors) {
          if (nextRow < 0 || nextCol < 0 || nextRow >= size || nextCol >= size) continue;
          if (seen[nextRow][nextCol] || grid[nextRow][nextCol] !== 0) continue;
          seen[nextRow][nextCol] = true;
          stack.push([nextRow, nextCol]);
        }
      }
      if (count > largestHole) largestHole = count;
      if (count === 1) isolatedHoles += 1;
    }
  }

  const empty = counts.empty;
  const componentPart = empty === 0 ? 0 : clamp((holeComponents - 1) / Math.max(1, empty * 0.45), 0, 1);
  const isolatedPart = empty === 0 ? 0 : clamp(isolatedHoles / empty, 0, 1);
  const fragmentation = componentPart * 0.65 + isolatedPart * 0.35;

  let edgeFilled = 0;
  let edgeTotal = 0;
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (row !== 0 && col !== 0 && row !== size - 1 && col !== size - 1) continue;
      edgeTotal += 1;
      if (grid[row][col] !== 0) edgeFilled += 1;
    }
  }

  return {
    occupancy: counts.total === 0 ? 0 : counts.filled / counts.total,
    emptyCount: empty,
    filledCount: counts.filled,
    rowFill,
    colFill,
    almostFullRows,
    almostFullCols,
    holeComponents,
    largestHole,
    isolatedHoles,
    fragmentation,
    edgePressure: edgeTotal === 0 ? 0 : edgeFilled / edgeTotal,
  };
}
