import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getCatalog, getShape } from '../assets/scripts/algorithm/BlockCatalog';
import { pickWeighted } from '../assets/scripts/algorithm/BlockGenerator';
import { bandFromLevel, difficultyFromScore, initialDifficulty, levelFromScore } from '../assets/scripts/algorithm/DifficultyManager';
import { generateRound } from '../assets/scripts/algorithm/GenerationPipeline';
import { GameConfig } from '../assets/scripts/config/GameConfig';
import { uniqueOrientations } from '../assets/scripts/core/Board';
import { createGrid, hasPlacement, hashGrid, shapeSignature } from '../assets/scripts/core/Board';
import { mulberry32 } from '../assets/scripts/core/Random';

test('方块目录包含可旋转的不同形状', () => {
  const ids = new Set<string>();
  for (const shape of getCatalog()) {
    assert.equal(ids.has(shape.id), false);
    ids.add(shape.id);
    assert.ok(shape.cells.length > 0);
    for (const cell of shape.cells) {
      assert.ok(cell.row >= 0 && cell.col >= 0);
    }
  }
  assert.ok(ids.size >= 12);
  const domino = getShape('domino');
  assert.ok(domino);
  const orientations = uniqueOrientations(domino.cells, true);
  assert.ok(orientations.some((cells) => shapeSignature(cells) === '0,0;0,1'));
  assert.ok(orientations.some((cells) => shapeSignature(cells) === '0,0;1,0'));
});

test('加权随机不是固定顺序', () => {
  const rng = mulberry32(11);
  let heavy = 0;
  for (let index = 0; index < 240; index += 1) {
    const picked = pickWeighted(['large', 'small'], (item) => (item === 'large' ? 24 : 1), rng.next);
    if (picked === 'large') heavy += 1;
  }
  assert.ok(heavy > 180);

  const grid = createGrid();
  const before = hashGrid(grid);
  const signatures = new Set<string>();
  const difficulty = initialDifficulty();
  for (let index = 0; index < 10; index += 1) {
    const random = mulberry32(100 + index * 17);
    let serial = 0;
    const result = generateRound({
      grid,
      difficulty,
      rng: random.next,
      nextUid: () => `fair-${index}-${serial++}`,
    });
    assert.equal(result.pieces.length, 3);
    assert.ok(result.report.search.maxPlaced >= 1);
    assert.ok(result.pieces.some((item) => hasPlacement(grid, item.cells)));
    signatures.add(result.pieces.map((item) => item.shapeId).join('-'));
    assert.equal(hashGrid(grid), before);
  }
  assert.ok(signatures.size >= 4);

  const once = (seed: number): string => {
    const random = mulberry32(seed);
    let serial = 0;
    const result = generateRound({
      grid,
      difficulty,
      rng: random.next,
      nextUid: () => `same-${seed}-${serial++}`,
    });
    return result.pieces.map((item) => `${item.shapeId}:${shapeSignature(item.cells)}:${item.color}`).join('|');
  };
  assert.equal(once(7), once(7));
  assert.notEqual(once(7), once(8));
});

test('几乎放满时仍然给出至少一块可放置的方块', () => {
  const grid = createGrid(GameConfig.board.size, 1);
  grid[0][0] = 0;
  const before = hashGrid(grid);
  const random = mulberry32(99);
  let serial = 0;
  const result = generateRound({
    grid,
    difficulty: initialDifficulty(),
    rng: random.next,
    nextUid: () => `tight-${serial++}`,
  });
  assert.equal(result.pieces.length, 3);
  assert.ok(result.pieces.some((item) => hasPlacement(grid, item.cells)));
  assert.equal(hashGrid(grid), before);
});

test('分数每 400 分升一级', () => {
  assert.equal(levelFromScore(0), 1);
  assert.equal(levelFromScore(399), 1);
  assert.equal(levelFromScore(400), 2);
  assert.equal(levelFromScore(799), 2);
  assert.equal(levelFromScore(800), 3);
  assert.equal(levelFromScore(1200), 4);
  assert.equal(levelFromScore(2000), 6);
  assert.equal(bandFromLevel(1), 'easy');
  assert.equal(bandFromLevel(2), 'normal');
  assert.equal(bandFromLevel(3), 'hard');
  assert.equal(bandFromLevel(4), 'expert');
  assert.equal(bandFromLevel(8), 'expert');
  const first = difficultyFromScore(0);
  const second = difficultyFromScore(400);
  assert.equal(first.band, 'easy');
  assert.equal(second.band, 'normal');
  assert.ok(second.value > first.value);
  assert.equal(initialDifficulty().band, first.band);
  assert.ok(difficultyFromScore(5000).value <= 0.95);
});
