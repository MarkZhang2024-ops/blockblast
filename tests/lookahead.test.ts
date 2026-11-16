import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getShape } from '../assets/scripts/algorithm/BlockCatalog';
import { searchSequence } from '../assets/scripts/algorithm/LookaheadSolver';
import { GameConfig } from '../assets/scripts/config/GameConfig';
import { cloneGrid, createGrid, gridsEqual, listPlacements, resolvePlacement } from '../assets/scripts/core/Board';
import type { Piece } from '../assets/scripts/core/Types';

function piece(id: string, uid: string, cells = getShape(id)?.cells): Piece {
  const shape = getShape(id);
  if (!shape || !cells) throw new Error(`缺少形状 ${id}`);
  return {
    uid,
    shapeId: shape.id,
    name: shape.name,
    cells: cells.map((cell) => ({ row: cell.row, col: cell.col })),
    color: 2,
    tier: shape.tier,
  };
}

test('三块可以按顺序放进空棋盘，搜索不改原棋盘', () => {
  const grid = createGrid();
  const last = GameConfig.board.size - 1;
  grid[last][last] = 6;
  const snapshot = cloneGrid(grid);
  const pieces = [piece('mono', 'a'), piece('domino', 'b'), piece('corner', 'c')];
  const search = searchSequence(grid, pieces);
  assert.equal(search.canPlaceAll, true);
  assert.equal(search.maxPlaced, 3);
  assert.equal(gridsEqual(grid, snapshot), true);

  let cursor = cloneGrid(grid);
  for (const item of pieces) {
    const anchors = listPlacements(cursor, item.cells);
    assert.ok(anchors.length > 0);
    const resolved = resolvePlacement(cursor, item.cells, anchors[0].anchorRow, anchors[0].anchorCol, item.color);
    assert.ok(resolved);
    cursor = resolved.grid;
  }
  assert.equal(gridsEqual(grid, snapshot), true);
  assert.equal(cursor[last][last], 6);
});

test('第三块在副本上放不下，搜索也不会改原棋盘', () => {
  const size = GameConfig.board.size;
  const grid = createGrid(size, 1);
  for (let row = 0; row < size; row += 1) {
    grid[row][row] = 0;
    grid[row][(row + 2) % size] = 0;
  }
  const snapshot = cloneGrid(grid);
  const pieces = [piece('mono', 'm1'), piece('mono', 'm2'), piece('square9', 'big')];
  const search = searchSequence(grid, pieces);
  assert.equal(search.maxPlaced, 2);
  assert.equal(search.canPlaceAll, false);
  assert.equal(gridsEqual(grid, snapshot), true);
  assert.ok(search.nodes > 0);
  assert.ok(search.nodes <= 800);

  let cursor = cloneGrid(grid);
  for (let index = 0; index < 2; index += 1) {
    const anchors = listPlacements(cursor, pieces[index].cells);
    assert.ok(anchors.length > 0);
    const resolved = resolvePlacement(cursor, pieces[index].cells, anchors[0].anchorRow, anchors[0].anchorCol, pieces[index].color);
    assert.ok(resolved);
    cursor = resolved.grid;
  }
  assert.equal(listPlacements(cursor, pieces[2].cells).length, 0);
  assert.equal(gridsEqual(grid, snapshot), true);
});
