import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameConfig } from '../assets/scripts/config/GameConfig';
import {
  canPlace,
  clearLines,
  cloneGrid,
  createGrid,
  findFullLines,
  gridsEqual,
  hasPlacement,
  resolvePlacement,
} from '../assets/scripts/core/Board';
import { cellAtPoint, cellRect } from '../assets/scripts/core/GridGeometry';
import { scoreMove } from '../assets/scripts/core/ScoreSystem';

test('方块越界不能放置', () => {
  const grid = createGrid();
  const domino = [{ row: 0, col: 0 }, { row: 0, col: 1 }];
  const vertical = [{ row: 0, col: 0 }, { row: 1, col: 0 }];
  const last = GameConfig.board.size - 1;
  assert.equal(canPlace(grid, domino, 0, last), false);
  assert.equal(canPlace(grid, vertical, last, 0), false);
  assert.equal(canPlace(grid, domino, -1, 0), false);
  assert.equal(canPlace(grid, [{ row: 0, col: 0 }], GameConfig.board.size, 0), false);
  assert.equal(canPlace(grid, domino, last, last - 1), true);
  assert.equal(canPlace(grid, vertical, last - 1, last), true);
});

test('方块与已有格子碰撞不能放置', () => {
  const grid = createGrid();
  grid[2][2] = 4;
  const before = cloneGrid(grid);
  assert.equal(canPlace(grid, [{ row: 0, col: 0 }], 2, 2), false);
  assert.equal(canPlace(grid, [{ row: 0, col: 0 }, { row: 0, col: 1 }], 2, 1), false);
  assert.equal(canPlace(grid, [{ row: 0, col: 0 }], 2, 3), true);
  assert.equal(resolvePlacement(grid, [{ row: 0, col: 0 }], 2, 2, 1), null);
  assert.equal(gridsEqual(grid, before), true);
});

test('填满一行后消除，且不改动原棋盘', () => {
  const grid = createGrid();
  for (let col = 0; col < GameConfig.board.size; col += 1) grid[4][col] = 2;
  const lines = findFullLines(grid);
  assert.deepEqual(lines.rows, [4]);
  assert.deepEqual(lines.cols, []);
  const cleared = clearLines(grid, lines.rows, lines.cols);
  assert.equal(cleared.clearedCells, GameConfig.board.size);
  assert.equal(cleared.grid[4][0], 0);
  assert.equal(grid[4][0], 2);
  assert.equal(cleared.grid[3][0], 0);
});

test('多行多列同时消除时交点只计一次', () => {
  const size = GameConfig.board.size;
  const grid = createGrid();
  for (let col = 0; col < size; col += 1) {
    grid[0][col] = 1;
    grid[1][col] = 1;
  }
  for (let row = 0; row < size; row += 1) grid[row][0] = 1;
  const lines = findFullLines(grid);
  assert.deepEqual(lines.rows, [0, 1]);
  assert.deepEqual(lines.cols, [0]);
  const cleared = clearLines(grid, lines.rows, lines.cols);
  assert.equal(cleared.clearedCells, size * 3 - 2);
  assert.equal(cleared.grid[0][5], 0);
  assert.equal(cleared.grid[1][0], 0);
  assert.equal(cleared.grid[6][0], 0);
  assert.equal(cleared.grid[6][3], 0);
  assert.equal(grid[0][5], 1);
  const scored = scoreMove({
    placedCells: 1,
    clearedRows: lines.rows.length,
    clearedCols: lines.cols.length,
    clearedCellCount: cleared.clearedCells,
    combo: 0,
  });
  assert.equal(scored.lines, 3);
  assert.ok(scored.gained > size * 3 - 2);
  const placedOnly = scoreMove({
    placedCells: 4,
    clearedRows: 0,
    clearedCols: 0,
    clearedCellCount: 0,
    combo: 2,
  });
  assert.equal(placedOnly.gained, 0);
  assert.equal(placedOnly.combo, 0);
});

test('放置后同时消除行和列', () => {
  const size = GameConfig.board.size;
  const last = size - 1;
  const grid = createGrid();
  for (let col = 0; col < last; col += 1) grid[last][col] = 3;
  for (let row = 0; row < last; row += 1) grid[row][last] = 3;
  const resolved = resolvePlacement(grid, [{ row: 0, col: 0 }], last, last, 5);
  assert.ok(resolved);
  assert.deepEqual(resolved.clearedRows, [last]);
  assert.deepEqual(resolved.clearedCols, [last]);
  assert.equal(resolved.clearedCellCount, size * 2 - 1);
  assert.equal(resolved.grid[last][0], 0);
  assert.equal(resolved.grid[0][last], 0);
  assert.equal(grid[last][1], 3);
  assert.equal(grid[last][last], 0);
});

test('棋盘复制是深拷贝', () => {
  const grid = createGrid();
  grid[1][2] = 7;
  const copy = cloneGrid(grid);
  copy[1][2] = 0;
  copy[3][3] = 4;
  assert.equal(grid[1][2], 7);
  assert.equal(grid[3][3], 0);
  assert.equal(gridsEqual(grid, copy), false);
  const again = cloneGrid(grid);
  assert.equal(gridsEqual(grid, again), true);
});

test('棋盘坐标能回到同一格', () => {
  const rect = cellRect(3, 6);
  const hit = cellAtPoint(rect.x + rect.w / 2, rect.y + rect.h / 2);
  assert.deepEqual(hit, { row: 3, col: 6 });
  assert.equal(cellAtPoint(0, 4000), null);
  assert.equal(hasPlacement(createGrid(), [{ row: 0, col: 0 }]), true);
});
