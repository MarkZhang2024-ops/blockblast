import { hasPlacement, listPlacements } from '../core/Board';
import type { Anchor, Cell, Grid } from '../core/Types';

/**
 * 合法锚点求解。只读棋盘，结果按从上到下、从左到右排列。
 */
export function findValidPlacements(grid: Grid, cells: readonly Cell[]): Anchor[] {
  return listPlacements(grid, cells);
}

export function countValidPlacements(grid: Grid, cells: readonly Cell[]): number {
  return listPlacements(grid, cells).length;
}

export function canPlaceShape(grid: Grid, cells: readonly Cell[]): boolean {
  return hasPlacement(grid, cells);
}

/** 一组方块里，当前就能放上去的数量。 */
export function countPlaceablePieces(grid: Grid, pieces: readonly { cells: readonly Cell[] }[]): number {
  let count = 0;
  for (const piece of pieces) {
    if (hasPlacement(grid, piece.cells)) count += 1;
  }
  return count;
}
