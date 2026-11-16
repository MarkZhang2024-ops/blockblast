import { GameConfig } from '../config/GameConfig';

export interface CellRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function boardSpan(
  cell = GameConfig.visual.cell,
  gap = GameConfig.visual.gap,
  size = GameConfig.board.size,
): number {
  return size * cell + (size - 1) * gap;
}

/** 格子在棋盘节点内的左下角。节点锚点在中心，y 向上。 */
export function cellRect(
  row: number,
  col: number,
  cell = GameConfig.visual.cell,
  gap = GameConfig.visual.gap,
  size = GameConfig.board.size,
): CellRect {
  const span = boardSpan(cell, gap, size);
  const stride = cell + gap;
  return {
    x: -span / 2 + col * stride,
    y: span / 2 - cell - row * stride,
    w: cell,
    h: cell,
  };
}

/**
 * 把棋盘局部坐标吸附到最近的格子。指针离开棋盘一定距离后返回 null，方便取消拖动。
 */
export function cellAtPoint(
  localX: number,
  localY: number,
  cell = GameConfig.visual.cell,
  gap = GameConfig.visual.gap,
  size = GameConfig.board.size,
): { row: number; col: number } | null {
  const span = boardSpan(cell, gap, size);
  const left = -span / 2;
  const bottom = -span / 2;
  const margin = cell * 0.45;
  if (localX < left - margin || localY < bottom - margin) return null;
  if (localX > left + span + margin || localY > bottom + span + margin) return null;
  const stride = cell + gap;
  let col = Math.round((localX - left - cell / 2) / stride);
  let row = Math.round((span / 2 - cell / 2 - localY) / stride);
  if (col < 0) col = 0;
  if (row < 0) row = 0;
  if (col >= size) col = size - 1;
  if (row >= size) row = size - 1;
  return { row, col };
}
