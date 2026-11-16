export type Grid = number[][];

export interface Cell {
  row: number;
  col: number;
}

export type ShapeTier = 'small' | 'medium' | 'large';

export interface ShapeDef {
  id: string;
  name: string;
  cells: readonly Cell[];
  tier: ShapeTier;
  baseWeight: number;
}

export interface Piece {
  uid: string;
  shapeId: string;
  name: string;
  cells: Cell[];
  color: number;
  tier: ShapeTier;
}

export type DifficultyBand = 'easy' | 'normal' | 'hard' | 'expert';

export interface DifficultyState {
  value: number;
  band: DifficultyBand;
  target: number;
}

export interface PlayerHistory {
  recentClears: number[];
  recentScores: number[];
  stallMoves: number;
  unplaceableStreak: number;
  lastCompatibility: number;
}

export interface BoardMetrics {
  occupancy: number;
  emptyCount: number;
  filledCount: number;
  rowFill: number[];
  colFill: number[];
  almostFullRows: number;
  almostFullCols: number;
  holeComponents: number;
  largestHole: number;
  isolatedHoles: number;
  fragmentation: number;
  edgePressure: number;
}

export interface PlacementResolution {
  grid: Grid;
  placedCells: Cell[];
  clearedRows: number[];
  clearedCols: number[];
  clearedCellCount: number;
}

export interface Anchor {
  anchorRow: number;
  anchorCol: number;
}
