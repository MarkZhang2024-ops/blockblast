import { _decorator, Component, Graphics } from 'cc';
import { drawGem } from './Draw';

const { ccclass, property } = _decorator;

/** 单格预制体。运行时棋盘使用合批绘制，这个组件供编辑器预制体使用。 */
@ccclass('CellView')
export class CellView extends Component {
  @property
  colorIndex = 1;

  onLoad(): void {
    const graphics = this.getComponent(Graphics) ?? this.addComponent(Graphics);
    if (!graphics) return;
    drawGem(graphics, -28, -28, 56, this.colorIndex, 1);
  }
}
