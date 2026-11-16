import { BlockInputEvents, Color, Graphics, Node } from 'cc';
import { drawRound } from './Draw';
import { createButton, createLabel, createNode } from './Nodes';
import { Theme } from './Theme';

/** 游戏结束遮罩。隐藏时关闭节点，避免挡住棋盘拖动。 */
export class OverlayView {
  readonly node: Node;
  private readonly scoreLabel: ReturnType<typeof createLabel>;
  private readonly bestLabel: ReturnType<typeof createLabel>;

  constructor(parent: Node, onRestart: () => void) {
    this.node = createNode('GameOver', parent, 720, 1280, 0, 0);
    this.node.addComponent(BlockInputEvents);
    const dim = this.node.addComponent(Graphics);
    drawRound(dim, -360, -640, 720, 1280, 0, new Color(4, 6, 18, 180));
    const panel = createNode('Panel', this.node, 560, 460, 0, 20);
    const panelGraphics = panel.addComponent(Graphics);
    drawRound(panelGraphics, -280, -230, 560, 460, 28, Theme.panel);
    createLabel('Heading', panel, '游戏结束', 48, Theme.gold, 420, 70).node.setPosition(0, 140, 0);
    createLabel('ScoreCaption', panel, '本局分数', 22, Theme.muted, 240, 32).node.setPosition(0, 60, 0);
    this.scoreLabel = createLabel('Score', panel, '0', 56, Theme.text, 360, 72);
    this.scoreLabel.node.setPosition(0, 8, 0);
    this.bestLabel = createLabel('Best', panel, '最高 0', 26, Theme.gold, 360, 40);
    this.bestLabel.node.setPosition(0, -58, 0);
    createButton('Again', panel, '再来一局', 240, 64, 0, -150, Theme.button, onRestart);
    this.node.active = false;
  }

  show(score: number, best: number): void {
    this.scoreLabel.string = `${score}`;
    this.bestLabel.string = `最高 ${best}`;
    this.node.active = true;
  }

  hide(): void {
    this.node.active = false;
  }
}
