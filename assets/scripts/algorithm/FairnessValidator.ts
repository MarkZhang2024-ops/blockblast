import { evaluateBoard } from './BoardEvaluator';
import { searchSequence, type SearchResult } from './LookaheadSolver';
import { countPlaceablePieces } from './PlacementSolver';
import { clamp } from '../core/MathUtil';
import type { DifficultyBand, Grid, Piece } from '../core/Types';

export interface FairnessReport {
  accepted: boolean;
  reasons: string[];
  difficultyScore: number;
  placeableNow: number;
  requiredPath: number;
  search: SearchResult;
}

/**
 * 检查三个方块是否存在可连续放置的路径，并拒绝明显无法处理或和难度不匹配的组合。
 * 搜索在副本上进行。
 */
export function validateTrio(grid: Grid, pieces: readonly Piece[], band: DifficultyBand): FairnessReport {
  const metrics = evaluateBoard(grid);
  const search = searchSequence(grid, pieces);
  const placeableNow = countPlaceablePieces(grid, pieces);
  const requiredPath = requiredPlacements(band, metrics.occupancy, metrics.emptyCount);
  const reasons: string[] = [];

  if (metrics.emptyCount > 0 && placeableNow === 0) reasons.push('none-fit');
  if (search.maxPlaced < requiredPath) reasons.push('no-path');

  const maxSize = pieces.reduce((max, piece) => Math.max(max, piece.cells.length), 0);
  if (band === 'expert' && maxSize <= 2 && metrics.occupancy < 0.32 && metrics.emptyCount > 40) {
    reasons.push('too-easy');
  }
  if (
    search.maxPlaced >= requiredPath
    && search.remaining.fragmentation > 0.84
    && metrics.occupancy < 0.45
    && band !== 'expert'
    && band !== 'hard'
  ) {
    reasons.push('shreds-board');
  }

  const avgSize = pieces.reduce((sum, piece) => sum + piece.cells.length, 0) / Math.max(1, pieces.length);
  const tightness = 1 - clamp(placeableNow / Math.max(1, pieces.length), 0, 1);
  const sizePressure = clamp(avgSize / 6, 0, 1);
  const pathPressure = 1 - clamp(search.maxPlaced / Math.max(1, pieces.length), 0, 1);
  const difficultyScore = clamp(sizePressure * 0.5 + tightness * 0.2 + pathPressure * 0.3, 0, 1);

  return {
    accepted: reasons.length === 0,
    reasons,
    difficultyScore,
    placeableNow,
    requiredPath,
    search,
  };
}

function requiredPlacements(band: DifficultyBand, occupancy: number, emptyCount: number): number {
  if (emptyCount <= 3 || occupancy >= 0.82) return 1;
  if (band === 'hard' || band === 'expert') return 1;
  if (band === 'easy') return occupancy < 0.5 ? 3 : 2;
  return occupancy < 0.42 ? 3 : 2;
}
