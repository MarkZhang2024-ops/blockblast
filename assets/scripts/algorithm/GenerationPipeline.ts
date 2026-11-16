import { GameConfig } from '../config/GameConfig';
import { cloneGrid, hasPlacement, uniqueOrientations } from '../core/Board';
import { getCatalog } from './BlockCatalog';
import { pickWeighted, pieceFromCells, rollPiece, weightForShape } from './BlockGenerator';
import { evaluateBoard } from './BoardEvaluator';
import { validateTrio, type FairnessReport } from './FairnessValidator';
import type { DifficultyState, Grid, Piece, ShapeDef } from '../core/Types';

export interface GenerationRequest {
  grid: Grid;
  difficulty: DifficultyState;
  rng: () => number;
  nextUid: () => string;
}

export interface GenerationResult {
  pieces: Piece[];
  source: 'pool' | 'relaxed' | 'rescue';
  examined: number;
  kept: number;
  report: FairnessReport;
}

interface Candidate {
  pieces: Piece[];
  report: FairnessReport;
}

/**
 * 先加权随机产出多组候选，再在副本上做公平性筛选，最后在合格组里按目标难度随机抽取。
 */
export function generateRound(request: GenerationRequest): GenerationResult {
  const sourceGrid = cloneGrid(request.grid);
  const metrics = evaluateBoard(sourceGrid);
  const catalog = getCatalog();
  const examined: Candidate[] = [];
  const count = GameConfig.generator.candidateCount;

  for (let index = 0; index < count; index += 1) {
    const pieces = [0, 1, 2].map(() => {
      const shape = pickWeighted(catalog, (entry) => weightForShape(entry, request.difficulty.band, metrics), request.rng);
      return rollPiece(shape, request.rng, request.nextUid());
    });
    examined.push({ pieces, report: validateTrio(sourceGrid, pieces, request.difficulty.band) });
  }

  const accepted = examined.filter((candidate) => candidate.report.accepted);
  if (accepted.length > 0) {
    const chosen = choose(accepted, request.difficulty.value, request.rng);
    return { pieces: chosen.pieces, source: 'pool', examined: examined.length, kept: accepted.length, report: chosen.report };
  }

  const relaxed = examined.filter((candidate) => candidate.report.placeableNow > 0 && candidate.report.reasons.indexOf('none-fit') < 0);
  if (relaxed.length > 0) {
    const chosen = choose(relaxed, request.difficulty.value, request.rng);
    return { pieces: chosen.pieces, source: 'relaxed', examined: examined.length, kept: relaxed.length, report: chosen.report };
  }

  const rescued = rescueTrio(sourceGrid, request);
  const report = validateTrio(sourceGrid, rescued, request.difficulty.band);
  return { pieces: rescued, source: 'rescue', examined: examined.length, kept: 0, report };
}

function choose(pool: readonly Candidate[], target: number, rng: () => number): Candidate {
  const temperature = GameConfig.generator.selectionTemperature;
  return pickWeighted(pool, (candidate) => {
    const distance = Math.abs(candidate.report.difficultyScore - target);
    return Math.exp(-distance / Math.max(0.04, temperature));
  }, rng);
}

function rescueTrio(grid: Grid, request: GenerationRequest): Piece[] {
  const metrics = evaluateBoard(grid);
  const options: Array<{ shape: ShapeDef; cells: Piece['cells']; weight: number }> = [];
  for (const shape of getCatalog()) {
    const weight = weightForShape(shape, request.difficulty.band, metrics);
    for (const orientation of uniqueOrientations(shape.cells, true)) {
      if (!hasPlacement(grid, orientation)) continue;
      options.push({
        shape,
        cells: orientation.map((cell) => ({ row: cell.row, col: cell.col })),
        weight,
      });
    }
  }
  if (options.length === 0) {
    const mono = getCatalog().find((shape) => shape.id === 'mono');
    if (!mono) return [];
    return [0, 1, 2].map(() => pieceFromCells(mono, mono.cells, request.rng, request.nextUid()));
  }
  return [0, 1, 2].map(() => {
    const picked = pickWeighted(options, (option) => option.weight, request.rng);
    return pieceFromCells(picked.shape, picked.cells, request.rng, request.nextUid());
  });
}
