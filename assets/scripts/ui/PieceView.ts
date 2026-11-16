import { _decorator, Component, Graphics } from 'cc';
import { GameConfig } from '../config/GameConfig';
import type { Cell } from '../core/Types';
import { drawShape } from './Draw';

const { ccclass } = _decorator;

/** 方块预制体。默认画出 2x2，调用 setPiece 可以换成任意形状。 */
@ccclass('PieceView')
export class PieceView extends Component {
  private cells: Cell[] = [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 1, col: 0 },
    { row: 1, col: 1 },
  ];
  private colorIndex = 6;

  onLoad(): void {
    this.redraw();
  }

  setPiece(cells: readonly Cell[], colorIndex: number): void {
    this.cells = cells.map((cell) => ({ row: cell.row, col: cell.col }));
    this.colorIndex = colorIndex;
    this.redraw();
  }

  private redraw(): void {
    const graphics = this.getComponent(Graphics) ?? this.addComponent(Graphics);
    if (!graphics) return;
    drawShape(graphics, this.cells, this.colorIndex, GameConfig.visual.trayCell, GameConfig.visual.trayGap);
  }
}
