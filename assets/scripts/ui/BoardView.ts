import { Graphics, Node } from 'cc';
import { GameConfig } from '../config/GameConfig';
import { boardSpan, cellAtPoint, cellRect } from '../core/GridGeometry';
import type { Cell, Grid } from '../core/Types';
import { drawEmptyCell, drawGem, drawRound } from './Draw';
import { createNode } from './Nodes';
import { Theme } from './Theme';

export interface BoardPreview {
  cells: Cell[];
  valid: boolean;
  clearRows: number[];
  clearCols: number[];
}

const POP_TIME = 0.16;
const FLASH_TIME = 0.24;

/**
 * 已落子的棋盘单独画在底层，只在棋盘变化时重画。
 * 缩放、预览和闪光画在上层，动画结束或出错时都会回到最终尺寸。
 */
export class BoardView {
  readonly node: Node;
  private readonly boardGraphics: Graphics;
  private readonly fxGraphics: Graphics;
  private readonly flashColor = Theme.flash.clone();
  private grid: Grid = [];
  private preview: BoardPreview | null = null;
  private hints: Cell[] = [];
  private pops = new Map<string, number>();
  private popElapsed = 0;
  private popFrames = 0;
  private flashAge = -1;
  private flashRows: number[] = [];
  private flashCols: number[] = [];
  private boardDirty = true;
  private fxDirty = true;

  constructor(parent: Node, x: number, y: number) {
    const span = boardSpan();
    const outer = span + GameConfig.visual.boardPadding * 2;
    this.node = createNode('Board', parent, outer, outer, x, y);
    const cells = createNode('Cells', this.node, outer, outer, 0, 0);
    const fx = createNode('Fx', this.node, outer, outer, 0, 0);
    this.boardGraphics = cells.addComponent(Graphics);
    this.fxGraphics = fx.addComponent(Graphics);
  }

  setGrid(grid: Grid): void {
    this.grid = grid;
    this.boardDirty = true;
  }

  setPreview(preview: BoardPreview | null): void {
    this.preview = preview;
    this.fxDirty = true;
  }

  setHints(hints: Cell[]): void {
    this.hints = hints;
    this.fxDirty = true;
  }

  playPlace(cells: readonly Cell[]): void {
    this.popElapsed = 0;
    this.popFrames = 0;
    for (const cell of cells) this.pops.set(`${cell.row},${cell.col}`, 0);
    this.boardDirty = true;
    this.fxDirty = true;
  }

  playClear(rows: readonly number[], cols: readonly number[]): void {
    if (rows.length === 0 && cols.length === 0) return;
    this.flashRows = rows.slice();
    this.flashCols = cols.slice();
    this.flashAge = 0;
    this.fxDirty = true;
  }

  /** 立刻结束缩放和闪光，棋盘按最终样子画出来。 */
  finishMotion(): void {
    this.pops.clear();
    this.popElapsed = 0;
    this.popFrames = 0;
    this.flashAge = -1;
    this.flashRows = [];
    this.flashCols = [];
    this.preview = null;
    this.hints = [];
    this.boardDirty = true;
    this.fxDirty = true;
  }

  cellAt(localX: number, localY: number): { row: number; col: number } | null {
    return cellAtPoint(localX, localY);
  }

  tick(dt: number): void {
    const step = Number.isFinite(dt) && dt > 0 ? dt : 0;
    try {
      this.advance(step);
      if (this.boardDirty) this.paintBoard();
      if (this.fxDirty) this.paintFx();
    } catch {
      this.recover();
    }
  }

  private advance(dt: number): void {
    if (this.pops.size > 0) {
      this.popElapsed += dt;
      this.popFrames += 1;
      const finished = this.popElapsed >= POP_TIME || this.popFrames > 20;
      if (finished) {
        this.pops.clear();
        this.popElapsed = 0;
        this.popFrames = 0;
        this.boardDirty = true;
      } else {
        for (const [key, age] of this.pops) this.pops.set(key, age + dt);
      }
      this.fxDirty = true;
    }
    if (this.flashAge >= 0) {
      this.flashAge += dt;
      this.fxDirty = true;
      if (this.flashAge > FLASH_TIME || this.flashAge < 0) {
        this.flashAge = -1;
        this.flashRows = [];
        this.flashCols = [];
      }
    }
  }

  private recover(): void {
    this.pops.clear();
    this.popElapsed = 0;
    this.popFrames = 0;
    this.flashAge = -1;
    this.flashRows = [];
    this.flashCols = [];
    this.boardDirty = true;
    this.fxDirty = true;
    try {
      this.paintBoard();
      this.fxGraphics.clear();
      this.fxDirty = false;
    } catch {
      this.boardGraphics.clear();
      this.fxGraphics.clear();
      this.boardDirty = false;
      this.fxDirty = false;
    }
  }

  private paintBoard(): void {
    this.boardDirty = false;
    const graphics = this.boardGraphics;
    graphics.clear();
    const cell = GameConfig.visual.cell;
    const span = boardSpan();
    const outer = span + GameConfig.visual.boardPadding * 2;
    drawRound(graphics, -outer / 2, -outer / 2, outer, outer, 28, Theme.boardEdge);
    drawRound(graphics, -outer / 2 + 5, -outer / 2 + 5, outer - 10, outer - 10, 24, Theme.board);

    const size = this.grid.length || GameConfig.board.size;
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        const rect = cellRect(row, col);
        const value = this.grid[row]?.[col] ?? 0;
        if (value === 0 || this.pops.has(`${row},${col}`)) drawEmptyCell(graphics, rect.x, rect.y, cell);
        else drawGem(graphics, rect.x, rect.y, cell, value, 1);
      }
    }
  }

  private paintFx(): void {
    this.fxDirty = false;
    const graphics = this.fxGraphics;
    graphics.clear();
    const cell = GameConfig.visual.cell;
    const span = boardSpan();
    const size = this.grid.length || GameConfig.board.size;

    for (const [key, age] of this.pops) {
      const split = key.indexOf(',');
      const row = Number(key.slice(0, split));
      const col = Number(key.slice(split + 1));
      const value = this.grid[row]?.[col] ?? 0;
      if (value === 0) continue;
      const rect = cellRect(row, col);
      const scale = 0.55 + 0.45 * Math.min(1, age / POP_TIME);
      drawGem(graphics, rect.x, rect.y, cell, value, scale);
    }

    if (this.preview) {
      for (const row of this.preview.clearRows) this.drawBand(graphics, true, row, span, cell);
      for (const col of this.preview.clearCols) this.drawBand(graphics, false, col, span, cell);
      const color = this.preview.valid ? Theme.goodSoft : Theme.badSoft;
      for (const item of this.preview.cells) {
        if (item.row < 0 || item.col < 0 || item.row >= size || item.col >= size) continue;
        const rect = cellRect(item.row, item.col);
        drawRound(graphics, rect.x, rect.y, cell, cell, 10, color);
      }
    }

    graphics.fillColor = Theme.hint;
    for (const hint of this.hints) {
      if (hint.row < 0 || hint.col < 0 || hint.row >= size || hint.col >= size) continue;
      const rect = cellRect(hint.row, hint.col);
      graphics.circle(rect.x + cell / 2, rect.y + cell / 2, 5);
      graphics.fill();
    }

    if (this.flashAge >= 0) {
      this.flashColor.a = Math.max(0, Math.round(220 * (1 - this.flashAge / FLASH_TIME)));
      const rows = new Set(this.flashRows);
      const cols = new Set(this.flashCols);
      for (let row = 0; row < size; row += 1) {
        for (let col = 0; col < size; col += 1) {
          if (!rows.has(row) && !cols.has(col)) continue;
          const rect = cellRect(row, col);
          drawRound(graphics, rect.x, rect.y, cell, cell, 10, this.flashColor);
        }
      }
    }
  }

  private drawBand(graphics: Graphics, horizontal: boolean, index: number, span: number, cell: number): void {
    const rect = cellRect(horizontal ? index : 0, horizontal ? 0 : index);
    if (horizontal) drawRound(graphics, -span / 2, rect.y, span, cell, 8, Theme.lineGlow);
    else drawRound(graphics, rect.x, -span / 2, cell, span, 8, Theme.lineGlow);
  }
}
