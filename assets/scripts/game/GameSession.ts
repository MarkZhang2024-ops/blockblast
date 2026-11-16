import { difficultyFromScore, emptyHistory, initialDifficulty, levelFromScore } from '../algorithm/DifficultyManager';
import { generateRound } from '../algorithm/GenerationPipeline';
import { countPlaceablePieces } from '../algorithm/PlacementSolver';
import { GameConfig } from '../config/GameConfig';
import { absoluteCells, cloneGrid, createGrid, hashGrid, listPlacements, resolvePlacement } from '../core/Board';
import { isBoardFull, isTrayBlocked, remainingPieces } from '../core/GameRules';
import { mulberry32, type Rng } from '../core/Random';
import { scoreMove } from '../core/ScoreSystem';
import { MemoryStore, type KeyValueStore } from '../core/Storage';
import type { Anchor, Cell, DifficultyState, Grid, Piece, PlayerHistory } from '../core/Types';

export interface Preview {
  valid: boolean;
  cells: Cell[];
  clearRows: number[];
  clearCols: number[];
}

export interface PlaceOutcome {
  placedCells: Cell[];
  clearedRows: number[];
  clearedCols: number[];
  clearedCellCount: number;
  gained: number;
  score: number;
  combo: number;
  lines: number;
  multiplier: number;
  gameOver: boolean;
  refilled: boolean;
}

export interface ResumeState {
  grid: Grid;
  tray: Array<Piece | null>;
  score: number;
  combo: number;
  difficulty: number;
  rng: number;
  recentClears: number[];
  recentScores: number[];
  stallMoves: number;
  unplaceableStreak: number;
  lastCompatibility: number;
  status: 'playing' | 'over';
  pieceSeq: number;
}

interface SaveGame {
  version: 1;
  best: number;
  soundOn: boolean;
  musicOn: boolean;
  resume: ResumeState | null;
}

/**
 * 对局状态机。生成和预览都不会写入这里持有的真实棋盘，只有放置成功才会替换棋盘引用。
 */
export class GameSession {
  private grid: Grid = createGrid();
  private tray: Array<Piece | null> = [null, null, null];
  private score = 0;
  private best = 0;
  private combo = 0;
  private status: 'playing' | 'over' = 'playing';
  private soundOn = true;
  private musicOn = true;
  private pieceSeq = 1;
  private difficulty: DifficultyState = initialDifficulty();
  private history: PlayerHistory = emptyHistory();
  private rng: Rng = mulberry32(1);

  private constructor(private readonly store: KeyValueStore) {}

  static create(store: KeyValueStore, seed = 1): GameSession {
    const session = new GameSession(store);
    const saved = readSave(store);
    if (saved) session.useSave(saved, seed);
    else session.startNew(seed);
    return session;
  }

  getGrid(): Grid {
    return this.grid;
  }

  getTray(): readonly (Piece | null)[] {
    return this.tray;
  }

  getScore(): number {
    return this.score;
  }

  getBest(): number {
    return this.best;
  }

  getCombo(): number {
    return this.combo;
  }

  getStatus(): 'playing' | 'over' {
    return this.status;
  }

  getLevel(): number {
    return levelFromScore(this.score);
  }

  getBand(): DifficultyState['band'] {
    return this.difficulty.band;
  }

  getDifficultyValue(): number {
    return this.difficulty.value;
  }

  isSoundOn(): boolean {
    return this.soundOn;
  }

  isMusicOn(): boolean {
    return this.musicOn;
  }

  setSoundOn(value: boolean): void {
    this.soundOn = value;
    this.persist();
  }

  setMusicOn(value: boolean): void {
    this.musicOn = value;
    this.persist();
  }

  preview(index: number, anchorRow: number, anchorCol: number): Preview {
    const piece = this.tray[index];
    if (!piece || this.status !== 'playing') {
      return { valid: false, cells: [], clearRows: [], clearCols: [] };
    }
    const resolved = resolvePlacement(this.grid, piece.cells, anchorRow, anchorCol, piece.color);
    if (!resolved) {
      return {
        valid: false,
        cells: absoluteCells(piece.cells, anchorRow, anchorCol),
        clearRows: [],
        clearCols: [],
      };
    }
    return {
      valid: true,
      cells: resolved.placedCells,
      clearRows: resolved.clearedRows,
      clearCols: resolved.clearedCols,
    };
  }

  anchorsFor(index: number): Anchor[] {
    const piece = this.tray[index];
    if (!piece || this.status !== 'playing') return [];
    return listPlacements(this.grid, piece.cells);
  }

  place(index: number, anchorRow: number, anchorCol: number): PlaceOutcome | null {
    if (this.status !== 'playing') return null;
    const piece = this.tray[index];
    if (!piece) return null;
    const resolved = resolvePlacement(this.grid, piece.cells, anchorRow, anchorCol, piece.color);
    if (!resolved) return null;

    this.grid = resolved.grid;
    const scored = scoreMove({
      placedCells: resolved.placedCells.length,
      clearedRows: resolved.clearedRows.length,
      clearedCols: resolved.clearedCols.length,
      clearedCellCount: resolved.clearedCellCount,
      combo: this.combo,
    });
    this.score += scored.gained;
    if (this.score > this.best) this.best = this.score;
    this.combo = scored.combo;
    this.tray[index] = null;
    this.pushHistory(scored.gained, scored.lines > 0);
    this.history.stallMoves = scored.lines > 0 ? 0 : this.history.stallMoves + 1;

    const left = remainingPieces(this.tray);
    this.history.lastCompatibility = left.length === 0 ? 1 : countPlaceablePieces(this.grid, left) / left.length;

    let refilled = false;
    let gameOver = false;
    if (left.length === 0) {
      refilled = this.refill();
      gameOver = !refilled;
    } else if (isTrayBlocked(this.grid, this.tray)) {
      this.finishBlocked();
      gameOver = true;
    }
    this.persist();
    return {
      placedCells: resolved.placedCells,
      clearedRows: resolved.clearedRows,
      clearedCols: resolved.clearedCols,
      clearedCellCount: resolved.clearedCellCount,
      gained: scored.gained,
      score: this.score,
      combo: this.combo,
      lines: scored.lines,
      multiplier: scored.multiplier,
      gameOver,
      refilled,
    };
  }

  restart(): void {
    const streak = this.history.unplaceableStreak;
    const nextSeed = (this.rng.state() ^ 0x9e3779b9) >>> 0;
    this.history = emptyHistory();
    this.history.unplaceableStreak = streak;
    this.score = 0;
    this.combo = 0;
    this.status = 'playing';
    this.grid = createGrid();
    this.tray = [null, null, null];
    this.rng = mulberry32(nextSeed || 1);
    this.refill();
    this.persist();
  }

  /** 测试和读档共用。棋盘和方块都会复制后再使用。 */
  applyResume(resume: ResumeState, best = this.best): void {
    this.best = Math.max(best, resume.score);
    this.grid = cloneGrid(resume.grid);
    this.tray = resume.tray.map((piece) => (piece ? clonePiece(piece) : null));
    this.score = resume.score;
    this.combo = resume.combo;
    this.difficulty = difficultyFromScore(resume.score);
    this.history = {
      recentClears: resume.recentClears.slice(),
      recentScores: resume.recentScores.slice(),
      stallMoves: resume.stallMoves,
      unplaceableStreak: resume.unplaceableStreak,
      lastCompatibility: resume.lastCompatibility,
    };
    this.rng = mulberry32(resume.rng || 1);
    this.pieceSeq = resume.pieceSeq;
    this.status = resume.status;
    if (this.status === 'playing' && remainingPieces(this.tray).length === 0 && !isBoardFull(this.grid)) {
      this.refill();
    } else if (this.status === 'playing' && (isBoardFull(this.grid) || isTrayBlocked(this.grid, this.tray))) {
      this.finishBlocked();
    }
  }

  private startNew(seed: number): void {
    this.rng = mulberry32(seed || 1);
    this.grid = createGrid();
    this.tray = [null, null, null];
    this.score = 0;
    this.combo = 0;
    this.status = 'playing';
    this.difficulty = initialDifficulty();
    this.history = emptyHistory();
    this.pieceSeq = 1;
    this.refill();
    this.persist();
  }

  private useSave(saved: SaveGame, fallbackSeed: number): void {
    this.best = saved.best;
    this.soundOn = saved.soundOn;
    this.musicOn = saved.musicOn;
    if (saved.resume) this.applyResume(saved.resume, saved.best);
    else this.startNew(fallbackSeed);
  }

  private refill(): boolean {
    if (isBoardFull(this.grid)) {
      this.finishBlocked();
      return false;
    }
    this.difficulty = difficultyFromScore(this.score);
    const before = hashGrid(this.grid);
    const generated = generateRound({
      grid: this.grid,
      difficulty: this.difficulty,
      rng: () => this.rng.next(),
      nextUid: () => {
        const uid = `p${this.pieceSeq}`;
        this.pieceSeq += 1;
        return uid;
      },
    });
    if (hashGrid(this.grid) !== before) {
      throw new Error('生成过程修改了真实棋盘');
    }
    this.tray = generated.pieces.map((piece) => clonePiece(piece));
    const left = remainingPieces(this.tray);
    this.history.lastCompatibility = left.length === 0 ? 0 : countPlaceablePieces(this.grid, left) / left.length;
    if (isTrayBlocked(this.grid, this.tray)) {
      this.finishBlocked();
      return false;
    }
    this.history.unplaceableStreak = 0;
    return true;
  }

  private finishBlocked(): void {
    this.status = 'over';
    this.history.unplaceableStreak += 1;
  }

  private pushHistory(gained: number, cleared: boolean): void {
    this.history.recentScores.push(gained);
    this.history.recentClears.push(cleared ? 1 : 0);
    const limit = GameConfig.difficulty.historyLimit;
    while (this.history.recentScores.length > limit) this.history.recentScores.shift();
    while (this.history.recentClears.length > limit) this.history.recentClears.shift();
  }

  private persist(): void {
    const save: SaveGame = {
      version: 1,
      best: this.best,
      soundOn: this.soundOn,
      musicOn: this.musicOn,
      resume: {
        grid: cloneGrid(this.grid),
        tray: this.tray.map((piece) => (piece ? clonePiece(piece) : null)),
        score: this.score,
        combo: this.combo,
        difficulty: this.difficulty.value,
        rng: this.rng.state(),
        recentClears: this.history.recentClears.slice(),
        recentScores: this.history.recentScores.slice(),
        stallMoves: this.history.stallMoves,
        unplaceableStreak: this.history.unplaceableStreak,
        lastCompatibility: this.history.lastCompatibility,
        status: this.status,
        pieceSeq: this.pieceSeq,
      },
    };
    try {
      this.store.set(GameConfig.storageKey, JSON.stringify(save));
    } catch {
      // 存储不可用时保持对局继续。
    }
  }
}

function clonePiece(piece: Piece): Piece {
  return {
    uid: piece.uid,
    shapeId: piece.shapeId,
    name: piece.name,
    cells: piece.cells.map((cell) => ({ row: cell.row, col: cell.col })),
    color: piece.color,
    tier: piece.tier,
  };
}

function readSave(store: KeyValueStore): SaveGame | null {
  const raw = store.get(GameConfig.storageKey);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SaveGame>;
    if (!parsed || parsed.version !== 1 || typeof parsed.best !== 'number') return null;
    return {
      version: 1,
      best: parsed.best,
      soundOn: parsed.soundOn !== false,
      musicOn: parsed.musicOn !== false,
      resume: parsed.resume && isResume(parsed.resume) ? parsed.resume : null,
    };
  } catch {
    return null;
  }
}

function isResume(value: ResumeState): boolean {
  if (!value || !Array.isArray(value.grid) || value.grid.length !== GameConfig.board.size) return false;
  for (const row of value.grid) {
    if (!Array.isArray(row) || row.length !== GameConfig.board.size) return false;
  }
  if (!Array.isArray(value.tray) || value.tray.length !== 3) return false;
  for (const piece of value.tray) {
    if (piece === null) continue;
    if (!piece || !Array.isArray(piece.cells)) return false;
  }
  return value.status === 'playing' || value.status === 'over';
}

export function createMemorySession(seed: number): GameSession {
  return GameSession.create(new MemoryStore(), seed);
}
