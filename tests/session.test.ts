import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getShape } from '../assets/scripts/algorithm/BlockCatalog';
import { createMemorySession, GameSession, type ResumeState } from '../assets/scripts/game/GameSession';
import { isTrayBlocked } from '../assets/scripts/core/GameRules';
import { GameConfig } from '../assets/scripts/config/GameConfig';
import { createGrid, hashGrid } from '../assets/scripts/core/Board';
import { MemoryStore } from '../assets/scripts/core/Storage';
import type { Piece } from '../assets/scripts/core/Types';

function mono(uid: string): Piece {
  return {
    uid,
    shapeId: 'mono',
    name: '单格',
    cells: [{ row: 0, col: 0 }],
    color: 1,
    tier: 'small',
  };
}

function square(uid: string): Piece {
  const shape = getShape('square');
  if (!shape) throw new Error('缺少方块');
  return {
    uid,
    shapeId: shape.id,
    name: shape.name,
    cells: shape.cells.map((cell) => ({ row: cell.row, col: cell.col })),
    color: 4,
    tier: shape.tier,
  };
}

function resume(partial: Pick<ResumeState, 'grid' | 'tray' | 'score' | 'status'>): ResumeState {
  return {
    grid: partial.grid,
    tray: partial.tray,
    score: partial.score,
    combo: 0,
    difficulty: 0.34,
    rng: 3,
    recentClears: [],
    recentScores: [],
    stallMoves: 0,
    unplaceableStreak: 0,
    lastCompatibility: 1,
    status: partial.status,
    pieceSeq: 20,
  };
}

test('所有剩余方块都不能放置时游戏结束', () => {
  const size = GameConfig.board.size;
  const blocked = createGrid(size, 1);
  blocked[0][0] = 0;
  assert.equal(isTrayBlocked(blocked, [square('a'), square('b'), null]), true);
  assert.equal(isTrayBlocked(blocked, [mono('m'), null, null]), false);
  assert.equal(isTrayBlocked(blocked, [null, null, null]), false);

  const session = createMemorySession(4);
  session.applyResume(resume({
    grid: blocked,
    tray: [square('a'), square('b'), null],
    score: 12,
    status: 'playing',
  }));
  assert.equal(session.getStatus(), 'over');

  const open = createGrid(size, 1);
  for (let row = 0; row < size; row += 1) {
    open[row][row] = 0;
    open[row][(row + 2) % size] = 0;
  }
  const playing = createMemorySession(5);
  playing.applyResume(resume({
    grid: open,
    tray: [mono('m'), square('s1'), square('s2')],
    score: 0,
    status: 'playing',
  }));
  assert.equal(playing.getStatus(), 'playing');
  const before = hashGrid(playing.getGrid());
  assert.equal(playing.preview(1, 0, 0).valid, false);
  assert.equal(hashGrid(playing.getGrid()), before);
  assert.equal(playing.place(1, 0, 0), null);
  assert.equal(playing.getScore(), 0);
  const outcome = playing.place(0, 0, 0);
  assert.ok(outcome);
  assert.equal(outcome.lines, 0);
  assert.equal(outcome.gameOver, true);
  assert.equal(playing.getStatus(), 'over');
  assert.equal(playing.place(0, 2, 2), null);
});

test('重新开始保留最高分，存档可以恢复棋盘', () => {
  const first = createMemorySession(21);
  const second = createMemorySession(22);
  const left = first.getTray().map((item) => item?.shapeId).join(',');
  const right = second.getTray().map((item) => item?.shapeId).join(',');
  assert.notEqual(left, '');
  assert.notEqual(left, right);

  const session = createMemorySession(8);
  session.applyResume(resume({
    grid: createGrid(),
    tray: [mono('a'), mono('b'), mono('c')],
    score: 50,
    status: 'playing',
  }));
  assert.equal(session.getBest(), 50);
  assert.equal(session.getStatus(), 'playing');
  session.restart();
  assert.equal(session.getScore(), 0);
  assert.equal(session.getBest(), 50);
  assert.equal(session.getStatus(), 'playing');
  assert.equal(session.getTray().filter((item) => item !== null).length, 3);

  const store = new MemoryStore();
  const saved = GameSession.create(store, 15);
  const anchor = saved.anchorsFor(0)[0];
  assert.ok(anchor);
  const placed = saved.place(0, anchor.anchorRow, anchor.anchorCol);
  assert.ok(placed);
  assert.equal(placed.gained, 0);
  const loaded = GameSession.create(store, 1);
  assert.equal(loaded.getScore(), saved.getScore());
  assert.equal(loaded.getBest(), saved.getBest());
  assert.equal(hashGrid(loaded.getGrid()), hashGrid(saved.getGrid()));
  assert.equal(loaded.getStatus(), saved.getStatus());
});
