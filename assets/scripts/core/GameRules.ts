import { hasPlacement } from './Board';
import type { Grid, Piece } from './Types';

export function remainingPieces(tray: readonly (Piece | null)[]): Piece[] {
  const pieces: Piece[] = [];
  for (const piece of tray) {
    if (piece) pieces.push(piece);
  }
  return pieces;
}

/**
 * 托盘里还有方块，且每一块都找不到合法锚点时，对局结束。
 * 托盘已空表示即将发下一组，不算结束。
 */
export function isTrayBlocked(grid: Grid, tray: readonly (Piece | null)[]): boolean {
  const pieces = remainingPieces(tray);
  if (pieces.length === 0) return false;
  return pieces.every((piece) => !hasPlacement(grid, piece.cells));
}

export function isBoardFull(grid: Grid): boolean {
  for (const row of grid) {
    for (const value of row) {
      if (value === 0) return false;
    }
  }
  return true;
}
