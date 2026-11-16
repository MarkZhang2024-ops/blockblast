import { GameConfig } from '../config/GameConfig';

export interface ScoreInput {
  placedCells: number;
  clearedRows: number;
  clearedCols: number;
  clearedCellCount: number;
  /** 本次放置之前的连击数。 */
  combo: number;
}

export interface ScoreOutput {
  gained: number;
  combo: number;
  lines: number;
  multiplier: number;
}

/** 只有被消除的方块才计分。没消除时得分为 0，连击也中断。 */
export function scoreMove(input: ScoreInput): ScoreOutput {
  const cfg = GameConfig.score;
  const lines = input.clearedRows + input.clearedCols;
  if (lines <= 0 || input.clearedCellCount <= 0) {
    return { gained: 0, combo: 0, lines: 0, multiplier: 1 };
  }
  const combo = input.combo + 1;
  const multiplier = Math.min(cfg.maxMultiplier, 1 + (combo - 1) * cfg.comboStep);
  const extraLines = Math.max(0, lines - 1);
  const clearPoints = input.clearedCellCount * cfg.clearCell
    + lines * cfg.lineBonus
    + extraLines * cfg.multiLineBonus;
  return {
    gained: Math.round(clearPoints * multiplier),
    combo,
    lines,
    multiplier,
  };
}
