import { Color, Graphics } from 'cc';
import { shapeBounds } from '../core/Board';
import type { Cell } from '../core/Types';
import { pieceColor, pieceLight, pieceShade, Theme } from './Theme';

export function drawRound(graphics: Graphics, x: number, y: number, width: number, height: number, radius: number, color: Color): void {
  graphics.fillColor = color;
  graphics.roundRect(x, y, width, height, radius);
  graphics.fill();
}

export function drawGem(graphics: Graphics, x: number, y: number, size: number, colorIndex: number, scale = 1): void {
  const drawSize = size * scale;
  const inset = (size - drawSize) / 2;
  const left = x + inset;
  const bottom = y + inset;
  const radius = Math.max(6, drawSize * 0.22);
  drawRound(graphics, left + 2, bottom - 3, drawSize, drawSize, radius, pieceShade(colorIndex));
  drawRound(graphics, left, bottom, drawSize, drawSize, radius, pieceColor(colorIndex));
  const lightW = Math.max(4, drawSize - 14);
  const lightH = Math.max(4, drawSize * 0.28);
  drawRound(graphics, left + 7, bottom + drawSize * 0.52, lightW, lightH, Math.min(8, lightH / 2), pieceLight(colorIndex));
}

export function drawShape(graphics: Graphics, cells: readonly Cell[], colorIndex: number, cell: number, gap: number): void {
  graphics.clear();
  if (cells.length === 0) return;
  const bounds = shapeBounds(cells);
  const stride = cell + gap;
  const width = bounds.cols * cell + Math.max(0, bounds.cols - 1) * gap;
  const height = bounds.rows * cell + Math.max(0, bounds.rows - 1) * gap;
  for (const item of cells) {
    const x = -width / 2 + item.col * stride;
    const y = height / 2 - cell - item.row * stride;
    drawGem(graphics, x, y, cell, colorIndex, 1);
  }
}

export function drawEmptyCell(graphics: Graphics, x: number, y: number, size: number): void {
  drawRound(graphics, x, y, size, size, 10, Theme.empty);
}
