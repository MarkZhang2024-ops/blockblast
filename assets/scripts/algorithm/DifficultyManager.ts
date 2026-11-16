import { GameConfig } from '../config/GameConfig';
import { clamp } from '../core/MathUtil';
import type { DifficultyBand, DifficultyState, PlayerHistory } from '../core/Types';

export function initialDifficulty(): DifficultyState {
  return difficultyFromScore(0);
}

/** 0–399 为 1 级，400–799 为 2 级，以此类推。 */
export function levelFromScore(score: number): number {
  const points = Math.max(0, Math.floor(score));
  return Math.floor(points / GameConfig.difficulty.pointsPerLevel) + 1;
}

export function bandFromLevel(level: number): DifficultyBand {
  if (level <= 1) return 'easy';
  if (level === 2) return 'normal';
  if (level === 3) return 'hard';
  return 'expert';
}

/** 等级只由当前分数决定。1 级简单，2 级普通，3 级困难，4 级起为专家。 */
export function difficultyFromScore(score: number): DifficultyState {
  const level = levelFromScore(score);
  const band = bandFromLevel(level);
  const value = level <= 1 ? 0.16 : level === 2 ? 0.4 : level === 3 ? 0.63 : clamp(0.8 + (level - 4) * 0.03, 0.8, 0.95);
  return { value, target: value, band };
}

export function emptyHistory(): PlayerHistory {
  return {
    recentClears: [],
    recentScores: [],
    stallMoves: 0,
    unplaceableStreak: 0,
    lastCompatibility: 1,
  };
}
