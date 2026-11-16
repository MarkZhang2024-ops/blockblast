import { GameConfig } from '../config/GameConfig';
import type { Anchor, Cell, Grid, PlacementResolution } from './Types';

export function createGrid(size = GameConfig.board.size, fill = 0): Grid {
  const grid: Grid = [];
  for (let row = 0; row < size; row += 1) {
    const line: number[] = [];
    for (let col = 0; col < size; col += 1) line.push(fill);
    grid.push(line);
  }
  return grid;
}

export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => row.slice());
}

export function gridsEqual(left: Grid, right: Grid): boolean {
  if (left.length !== right.length) return false;
  for (let row = 0; row < left.length; row += 1) {
    const a = left[row];
    const b = right[row];
    if (!b || a.length !== b.length) return false;
    for (let col = 0; col < a.length; col += 1) {
      if (a[col] !== b[col]) return false;
    }
  }
  return true;
}

export function inBounds(grid: Grid, row: number, col: number): boolean {
  return row >= 0 && col >= 0 && row < grid.length && col < grid[row].length;
}

export function normalizeCells(cells: readonly Cell[]): Cell[] {
  if (cells.length === 0) return [];
  let minRow = cells[0].row;
  let minCol = cells[0].col;
  for (const cell of cells) {
    if (cell.row < minRow) minRow = cell.row;
    if (cell.col < minCol) minCol = cell.col;
  }
  const shifted = cells.map((cell) => ({ row: cell.row - minRow, col: cell.col - minCol }));
  shifted.sort((a, b) => a.row - b.row || a.col - b.col);
  return shifted;
}

export function shapeSignature(cells: readonly Cell[]): string {
  return normalizeCells(cells).map((cell) => `${cell.row},${cell.col}`).join(';');
}

export function shapeBounds(cells: readonly Cell[]): { rows: number; cols: number } {
  let rows = 0;
  let cols = 0;
  for (const cell of cells) {
    if (cell.row + 1 > rows) rows = cell.row + 1;
    if (cell.col + 1 > cols) cols = cell.col + 1;
  }
  return { rows, cols };
}

/** 形状包围盒中心附近的格子，拖动时作为手指对准点。 */
export function hotCell(cells: readonly Cell[]): Cell {
  if (cells.length === 0) return { row: 0, col: 0 };
  const bounds = shapeBounds(cells);
  const targetRow = (bounds.rows - 1) / 2;
  const targetCol = (bounds.cols - 1) / 2;
  let best = cells[0];
  let bestDist = Number.POSITIVE_INFINITY;
  for (const cell of cells) {
    const rowDelta = cell.row - targetRow;
    const colDelta = cell.col - targetCol;
    const dist = rowDelta * rowDelta + colDelta * colDelta;
    if (dist < bestDist) {
      bestDist = dist;
      best = cell;
    }
  }
  return { row: best.row, col: best.col };
}

export function rotateCells(cells: readonly Cell[], turns: number): Cell[] {
  let current = cells.map((cell) => ({ row: cell.row, col: cell.col }));
  const steps = ((turns % 4) + 4) % 4;
  for (let step = 0; step < steps; step += 1) {
    current = current.map((cell) => ({ row: cell.col, col: -cell.row }));
  }
  return normalizeCells(current);
}

export function reflectCells(cells: readonly Cell[]): Cell[] {
  return normalizeCells(cells.map((cell) => ({ row: cell.row, col: -cell.col })));
}

export function uniqueOrientations(cells: readonly Cell[], includeReflections: boolean): Cell[][] {
  const seen = new Set<string>();
  const output: Cell[][] = [];
  const bases = [normalizeCells(cells)];
  if (includeReflections) bases.push(reflectCells(cells));
  for (const base of bases) {
    for (let turn = 0; turn < 4; turn += 1) {
      const rotated = rotateCells(base, turn);
      const signature = shapeSignature(rotated);
      if (seen.has(signature)) continue;
      seen.add(signature);
      output.push(rotated);
    }
  }
  return output;
}

export function absoluteCells(cells: readonly Cell[], anchorRow: number, anchorCol: number): Cell[] {
  return cells.map((cell) => ({ row: cell.row + anchorRow, col: cell.col + anchorCol }));
}

/**
 * 边界与碰撞同时判断。形状格子只要越界或落到已有方块上，就不能放置。
 * 不修改棋盘。
 */
export function canPlace(grid: Grid, cells: readonly Cell[], anchorRow: number, anchorCol: number): boolean {
  if (cells.length === 0) return false;
  for (const cell of cells) {
    const row = cell.row + anchorRow;
    const col = cell.col + anchorCol;
    if (!inBounds(grid, row, col)) return false;
    if (grid[row][col] !== 0) return false;
  }
  return true;
}

export function findFullLines(grid: Grid): { rows: number[]; cols: number[] } {
  const size = grid.length;
  const rows: number[] = [];
  const cols: number[] = [];
  for (let row = 0; row < size; row += 1) {
    let full = true;
    for (let col = 0; col < size; col += 1) {
      if (grid[row][col] === 0) {
        full = false;
        break;
      }
    }
    if (full) rows.push(row);
  }
  for (let col = 0; col < size; col += 1) {
    let full = true;
    for (let row = 0; row < size; row += 1) {
      if (grid[row][col] === 0) {
        full = false;
        break;
      }
    }
    if (full) cols.push(col);
  }
  return { rows, cols };
}

/**
 * 同时清除多行多列。行和列交点上的格子只清除一次。
 * 返回新棋盘，调用方传入的棋盘保持不变。
 */
export function clearLines(
  grid: Grid,
  rows: readonly number[],
  cols: readonly number[],
): { grid: Grid; clearedCells: number } {
  const rowSet = new Set(rows);
  const colSet = new Set(cols);
  const next = cloneGrid(grid);
  let clearedCells = 0;
  const size = grid.length;
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (next[row][col] !== 0 && (rowSet.has(row) || colSet.has(col))) {
        next[row][col] = 0;
        clearedCells += 1;
      }
    }
  }
  return { grid: next, clearedCells };
}

export function resolvePlacement(
  grid: Grid,
  cells: readonly Cell[],
  anchorRow: number,
  anchorCol: number,
  color: number,
): PlacementResolution | null {
  if (!canPlace(grid, cells, anchorRow, anchorCol)) return null;
  const placed = cloneGrid(grid);
  const placedCells = absoluteCells(cells, anchorRow, anchorCol);
  for (const cell of placedCells) placed[cell.row][cell.col] = color;
  const lines = findFullLines(placed);
  const cleared = clearLines(placed, lines.rows, lines.cols);
  return {
    grid: cleared.grid,
    placedCells,
    clearedRows: lines.rows,
    clearedCols: lines.cols,
    clearedCellCount: cleared.clearedCells,
  };
}

export function hashGrid(grid: Grid): string {
  const parts: string[] = [];
  for (const row of grid) {
    let mask = 0;
    for (let col = 0; col < row.length; col += 1) {
      if (row[col] !== 0) mask |= 1 << col;
    }
    parts.push(mask.toString(36));
  }
  return parts.join('.');
}

export function countFilled(grid: Grid): { filled: number; empty: number; total: number } {
  let filled = 0;
  let total = 0;
  for (const row of grid) {
    for (const value of row) {
      total += 1;
      if (value !== 0) filled += 1;
    }
  }
  return { filled, empty: total - filled, total };
}

/** 快速判断是否存在至少一个锚点，找到就返回。 */
export function hasPlacement(grid: Grid, cells: readonly Cell[]): boolean {
  const size = grid.length;
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (canPlace(grid, cells, row, col)) return true;
    }
  }
  return false;
}

export function listPlacements(grid: Grid, cells: readonly Cell[]): Anchor[] {
  const size = grid.length;
  const anchors: Anchor[] = [];
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (canPlace(grid, cells, row, col)) anchors.push({ anchorRow: row, anchorCol: col });
    }
  }
  return anchors;
}
