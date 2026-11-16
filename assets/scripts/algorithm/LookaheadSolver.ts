import { GameConfig } from '../config/GameConfig';
import { cloneGrid, hashGrid, listPlacements, resolvePlacement } from '../core/Board';
import { evaluateBoard } from './BoardEvaluator';
import type { Anchor, BoardMetrics, Cell, Grid, Piece } from '../core/Types';

export interface SearchResult {
  maxPlaced: number;
  canPlaceAll: boolean;
  ordersTried: number;
  nodes: number;
  pruned: number;
  bestScore: number;
  bestLines: number;
  remaining: BoardMetrics;
  cacheHits: number;
}

interface RankedAnchor extends Anchor {
  score: number;
}

/**
 * 有限宽度的分层搜索。每个顺序在棋盘副本上模拟，真实棋盘不会被写入。
 * 放置列表按棋盘占用哈希和形状签名缓存，同一轮搜索内复用。
 */
export function searchSequence(grid: Grid, pieces: readonly Piece[]): SearchResult {
  const root = cloneGrid(grid);
  const cfg = GameConfig.lookahead;
  const cache = new Map<string, Anchor[]>();
  let nodes = 0;
  let pruned = 0;
  let cacheHits = 0;
  let bestPlaced = 0;
  let bestScore = 0;
  let bestLines = 0;
  let bestGrid: Grid = root;

  const orders = permutations(pieces.map((_, index) => index));

  const anchorsFor = (source: Grid, cells: readonly Cell[]): Anchor[] => {
    const key = `${hashGrid(source)}|${cells.map((cell) => `${cell.row},${cell.col}`).join(';')}`;
    const cached = cache.get(key);
    if (cached) {
      cacheHits += 1;
      return cached;
    }
    const found = listPlacements(source, cells);
    cache.set(key, found);
    return found;
  };

  for (const order of orders) {
    let beam: Array<{ grid: Grid; placed: number; lines: number; score: number }> = [
      { grid: root, placed: 0, lines: 0, score: 0 },
    ];
    for (let depth = 0; depth < order.length; depth += 1) {
      if (nodes >= cfg.maxNodes) {
        pruned += 1;
        break;
      }
      const piece = pieces[order[depth]];
      const next: Array<{ grid: Grid; placed: number; lines: number; score: number }> = [];
      for (const state of beam) {
        const ranked = rankAnchors(state.grid, piece.cells, anchorsFor(state.grid, piece.cells));
        nodes += 1;
        if (ranked.length === 0) {
          if (better(state.placed, state.score, bestPlaced, bestScore)) {
            bestPlaced = state.placed;
            bestScore = state.score;
            bestLines = state.lines;
            bestGrid = state.grid;
          }
          continue;
        }
        const chosen = ranked.slice(0, cfg.branchLimit);
        if (ranked.length > chosen.length) pruned += ranked.length - chosen.length;
        for (const anchor of chosen) {
          if (nodes >= cfg.maxNodes) {
            pruned += 1;
            break;
          }
          const resolved = resolvePlacement(state.grid, piece.cells, anchor.anchorRow, anchor.anchorCol, piece.color);
          nodes += 1;
          if (!resolved) continue;
          const lines = resolved.clearedRows.length + resolved.clearedCols.length;
          const entry = {
            grid: resolved.grid,
            placed: state.placed + 1,
            lines: state.lines + lines,
            score: state.score + anchor.score,
          };
          if (better(entry.placed, entry.score, bestPlaced, bestScore)) {
            bestPlaced = entry.placed;
            bestScore = entry.score;
            bestLines = entry.lines;
            bestGrid = entry.grid;
          }
          next.push(entry);
        }
      }
      if (next.length === 0) break;
      next.sort((a, b) => b.placed - a.placed || b.score - a.score);
      if (next.length > cfg.beamWidth) {
        pruned += next.length - cfg.beamWidth;
        beam = next.slice(0, cfg.beamWidth);
      } else {
        beam = next;
      }
    }
  }

  return {
    maxPlaced: bestPlaced,
    canPlaceAll: bestPlaced === pieces.length && pieces.length > 0,
    ordersTried: orders.length,
    nodes,
    pruned,
    bestScore,
    bestLines,
    remaining: evaluateBoard(bestGrid),
    cacheHits,
  };
}

function better(placed: number, score: number, bestPlaced: number, bestScore: number): boolean {
  return placed > bestPlaced || (placed === bestPlaced && score > bestScore);
}

function rankAnchors(grid: Grid, cells: readonly Cell[], anchors: readonly Anchor[]): RankedAnchor[] {
  const ranked: RankedAnchor[] = [];
  for (const anchor of anchors) {
    ranked.push({ ...anchor, score: quickPlacementScore(grid, cells, anchor.anchorRow, anchor.anchorCol) });
  }
  ranked.sort((a, b) => b.score - a.score || a.anchorRow - b.anchorRow || a.anchorCol - b.anchorCol);
  return ranked;
}

/** 不复制棋盘，只估算这次放置能补满的行列。 */
export function quickPlacementScore(grid: Grid, cells: readonly Cell[], anchorRow: number, anchorCol: number): number {
  const size = grid.length;
  const rowHits = new Map<number, number>();
  const colHits = new Map<number, number>();
  for (const cell of cells) {
    const row = cell.row + anchorRow;
    const col = cell.col + anchorCol;
    rowHits.set(row, (rowHits.get(row) ?? 0) + 1);
    colHits.set(col, (colHits.get(col) ?? 0) + 1);
  }
  let lines = 0;
  for (const [row, hits] of rowHits) {
    let empty = 0;
    for (let col = 0; col < size; col += 1) if (grid[row][col] === 0) empty += 1;
    if (empty === hits) lines += 1;
  }
  for (const [col, hits] of colHits) {
    let empty = 0;
    for (let row = 0; row < size; row += 1) if (grid[row][col] === 0) empty += 1;
    if (empty === hits) lines += 1;
  }
  return lines * 100 + cells.length;
}

function permutations(items: number[]): number[][] {
  if (items.length <= 1) return [items.slice()];
  const result: number[][] = [];
  for (let index = 0; index < items.length; index += 1) {
    const head = items[index];
    const rest = items.slice(0, index).concat(items.slice(index + 1));
    for (const tail of permutations(rest)) result.push([head, ...tail]);
  }
  return result;
}
