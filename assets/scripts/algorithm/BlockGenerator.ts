import { GameConfig } from '../config/GameConfig';
import { uniqueOrientations } from '../core/Board';
import type { BoardMetrics, DifficultyBand, Piece, ShapeDef } from '../core/Types';

export function pickWeighted<T>(items: readonly T[], weightOf: (item: T, index: number) => number, rng: () => number): T {
  if (items.length === 0) {
    throw new Error('pickWeighted 需要至少一个候选');
  }
  let total = 0;
  const weights: number[] = [];
  for (let index = 0; index < items.length; index += 1) {
    const weight = Math.max(0, weightOf(items[index], index));
    weights.push(weight);
    total += weight;
  }
  if (total <= 0) {
    const index = Math.min(items.length - 1, Math.floor(rng() * items.length));
    return items[index];
  }
  let roll = rng() * total;
  for (let index = 0; index < items.length; index += 1) {
    roll -= weights[index];
    if (roll <= 0) return items[index];
  }
  return items[items.length - 1];
}

/**
 * 按难度和棋盘拥挤程度调整形状权重。小块在拥挤盘面上更常出现，专家盘更偏向大块。
 */
export function weightForShape(shape: ShapeDef, band: DifficultyBand, metrics: BoardMetrics): number {
  const size = shape.cells.length;
  let weight = shape.baseWeight;
  if (band === 'easy') {
    if (size <= 3) weight *= 1.55;
    if (size >= 5) weight *= 0.42;
  } else if (band === 'normal') {
    if (size >= 3 && size <= 4) weight *= 1.28;
    if (size >= 6) weight *= 0.7;
  } else if (band === 'hard') {
    if (size >= 4) weight *= 1.4;
    if (size <= 2) weight *= 0.55;
  } else {
    if (size >= 5) weight *= 1.75;
    if (size <= 2) weight *= 0.28;
    if (size === 9) weight *= 1.2;
  }
  if (metrics.fragmentation > 0.55 && size <= 3) weight *= 1.25;
  if (metrics.occupancy >= GameConfig.evaluator.crowdedOccupancy) {
    if (size <= 3) weight *= band === 'expert' ? 1.35 : 2.15;
    if (size >= 5) weight *= 0.4;
  }
  if (metrics.almostFullRows + metrics.almostFullCols >= 3 && size <= 4) weight *= 1.15;
  return Math.max(0.02, weight);
}

export function rollPiece(shape: ShapeDef, rng: () => number, uid: string): Piece {
  const orientations = uniqueOrientations(shape.cells, true);
  const index = Math.min(orientations.length - 1, Math.floor(rng() * orientations.length));
  const cells = orientations[index].map((cell) => ({ row: cell.row, col: cell.col }));
  const color = 1 + Math.floor(rng() * GameConfig.generator.colorCount);
  return {
    uid,
    shapeId: shape.id,
    name: shape.name,
    cells,
    color,
    tier: shape.tier,
  };
}

export function pieceFromCells(
  shape: ShapeDef,
  cells: readonly { row: number; col: number }[],
  rng: () => number,
  uid: string,
): Piece {
  return {
    uid,
    shapeId: shape.id,
    name: shape.name,
    cells: cells.map((cell) => ({ row: cell.row, col: cell.col })),
    color: 1 + Math.floor(rng() * GameConfig.generator.colorCount),
    tier: shape.tier,
  };
}
