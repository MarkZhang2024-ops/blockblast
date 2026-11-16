import { EventTouch, Graphics, Node, Tween, tween, Vec3 } from 'cc';
import { GameConfig } from '../config/GameConfig';
import { shapeBounds } from '../core/Board';
import type { Piece } from '../core/Types';
import { drawRound, drawShape } from './Draw';
import { createNode } from './Nodes';
import { Theme } from './Theme';

export interface TrayBridge {
  boardPoint(event: EventTouch): { x: number; y: number };
  layerPoint(event: EventTouch, layer: Node): { x: number; y: number };
}

export interface TrayHandlers {
  canDrag(index: number): boolean;
  onDragStart(index: number): void;
  onDragMove(index: number, boardX: number, boardY: number): void;
  onDragEnd(index: number): void;
}

/** 底部三个待放置方块。拖动开始时只通知一次，预览由外部用已缓存的合法位置绘制。 */
export class TrayView {
  readonly node: Node;
  private readonly slots: Node[] = [];
  private readonly pieces: Array<Node | null> = [null, null, null];
  private dragIndex = -1;
  private grabX = 0;
  private grabY = 0;
  private dragging = false;
  private queued: readonly (Piece | null)[] | null = null;

  constructor(
    parent: Node,
    private readonly dragLayer: Node,
    private readonly bridge: TrayBridge,
    private readonly handlers: TrayHandlers,
  ) {
    this.node = createNode('Tray', parent, 680, 210, 0, -500);
    const slotGraphics = this.node.addComponent(Graphics);
    const xs = [-220, 0, 220];
    for (let index = 0; index < 3; index += 1) {
      drawRound(slotGraphics, xs[index] - 96, -88, 192, 176, 22, Theme.board);
      const slot = createNode(`Slot${index}`, this.node, 192, 176, xs[index], 0);
      this.slots.push(slot);
    }
  }

  setTray(tray: readonly (Piece | null)[]): void {
    if (this.dragging) {
      this.queued = tray;
      return;
    }
    this.rebuild(tray);
  }

  cancel(): void {
    this.queued = null;
    this.releasePointer();
  }

  finishDrag(consumed: boolean): void {
    const index = this.dragIndex;
    this.dragging = false;
    this.dragIndex = -1;
    if (index >= 0) this.restorePiece(index, consumed);
    const pending = this.queued;
    this.queued = null;
    if (pending) this.rebuild(pending);
  }

  private createPiece(index: number, piece: Piece): Node {
    const cell = GameConfig.visual.trayCell;
    const gap = GameConfig.visual.trayGap;
    const bounds = shapeBounds(piece.cells);
    const width = bounds.cols * cell + Math.max(0, bounds.cols - 1) * gap;
    const height = bounds.rows * cell + Math.max(0, bounds.rows - 1) * gap;
    const node = createNode(`Piece${index}`, this.slots[index], Math.max(48, width), Math.max(48, height), 0, 0);
    const graphics = node.addComponent(Graphics);
    drawShape(graphics, piece.cells, piece.color, cell, gap);
    node.on(Node.EventType.TOUCH_START, (event: EventTouch) => this.onStart(index, event), this);
    node.on(Node.EventType.TOUCH_MOVE, (event: EventTouch) => this.onMove(index, event), this);
    node.on(Node.EventType.TOUCH_END, () => this.onEnd(index), this);
    node.on(Node.EventType.TOUCH_CANCEL, () => this.onEnd(index), this);
    return node;
  }

  private rebuild(tray: readonly (Piece | null)[]): void {
    for (let index = 0; index < 3; index += 1) {
      const previous = this.pieces[index];
      if (previous && previous.isValid) previous.destroy();
      const piece = tray[index];
      this.pieces[index] = piece ? this.createPiece(index, piece) : null;
    }
  }

  private onStart(index: number, event: EventTouch): void {
    if (this.dragging || !this.handlers.canDrag(index)) return;
    const piece = this.pieces[index];
    if (!piece) return;
    this.dragging = true;
    this.dragIndex = index;
    Tween.stopAllByTarget(piece);
    piece.setParent(this.dragLayer, true);
    const point = this.bridge.layerPoint(event, this.dragLayer);
    this.grabX = point.x - piece.position.x;
    this.grabY = point.y - piece.position.y;
    piece.setScale(1, 1, 1);
    this.handlers.onDragStart(index);
    this.onMove(index, event);
  }

  private onMove(index: number, event: EventTouch): void {
    if (!this.dragging || this.dragIndex !== index) return;
    const piece = this.pieces[index];
    if (!piece) return;
    const point = this.bridge.layerPoint(event, this.dragLayer);
    piece.setPosition(point.x - this.grabX, point.y - this.grabY, 0);
    const board = this.bridge.boardPoint(event);
    this.handlers.onDragMove(index, board.x, board.y);
  }

  private onEnd(index: number): void {
    if (!this.dragging || this.dragIndex !== index) return;
    this.handlers.onDragEnd(index);
  }

  private releasePointer(): void {
    const index = this.dragIndex;
    this.dragging = false;
    this.dragIndex = -1;
    if (index >= 0) this.restorePiece(index, false);
  }

  private restorePiece(index: number, consumed: boolean): void {
    const piece = this.pieces[index];
    if (!piece || !piece.isValid) return;
    Tween.stopAllByTarget(piece);
    piece.setScale(1, 1, 1);
    if (consumed) {
      piece.active = false;
      return;
    }
    piece.setParent(this.slots[index], true);
    tween(piece).to(0.14, { position: new Vec3(0, 0, 0) }).start();
  }
}
