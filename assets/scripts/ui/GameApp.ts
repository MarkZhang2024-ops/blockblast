import { _decorator, Color, Component, EventTouch, Graphics, Node, UITransform, Vec3 } from 'cc';
import { GameSession } from '../game/GameSession';
import { hotCell } from '../core/Board';
import type { Cell } from '../core/Types';
import { AudioBus } from './AudioBus';
import { BoardView } from './BoardView';
import { CocosStore } from './CocosStore';
import { drawRound } from './Draw';
import { HudView } from './HudView';
import { createNode } from './Nodes';
import { OverlayView } from './OverlayView';
import { Theme, mixColor } from './Theme';
import { TrayView } from './TrayView';
import './CellView';
import './PieceView';

const { ccclass } = _decorator;

/**
 * 场景入口。负责把纯逻辑对局接到界面，不在逐帧循环里生成方块或搜索。
 */
@ccclass('GameApp')
export class GameApp extends Component {
  private session!: GameSession;
  private readonly audio = new AudioBus();
  private board!: BoardView;
  private tray!: TrayView;
  private hud!: HudView;
  private overlay!: OverlayView;
  private dragLayer!: Node;
  private hoverAnchor: Cell | null = null;
  private hot: Cell | null = null;
  private trayDirty = false;
  private overShown = false;

  onLoad(): void {
    this.session = GameSession.create(new CocosStore());
    this.audio.soundOn = this.session.isSoundOn();
    this.audio.musicOn = this.session.isMusicOn();
    this.paintBackground();
    this.hud = new HudView(this.node, {
      onRestart: () => this.restart(),
      onSound: () => this.toggleSound(),
      onMusic: () => this.toggleMusic(),
    });
    this.board = new BoardView(this.node, 0, 8);
    this.dragLayer = createNode('DragLayer', this.node, 0, 0, 0, 0);
    this.tray = new TrayView(this.node, this.dragLayer, {
      boardPoint: (event) => this.pointerToNode(event, this.board.node),
      layerPoint: (event, layer) => this.pointerToNode(event, layer),
    }, {
      canDrag: (index) => this.session.getStatus() === 'playing' && this.session.getTray()[index] !== null,
      onDragStart: (index) => this.onDragStart(index),
      onDragMove: (index, x, y) => this.onDragMove(index, x, y),
      onDragEnd: (index) => this.onDragEnd(index),
    });
    this.dragLayer.setSiblingIndex(this.node.children.length - 1);
    this.overlay = new OverlayView(this.node, () => this.restart());
    this.node.on(Node.EventType.TOUCH_START, () => this.audio.unlock(), this, true);
    this.refresh(true);
    this.board.tick(0);
  }

  update(dt: number): void {
    this.audio.tick(dt);
    this.hud.tick(dt);
    this.board.tick(dt);
    if (!this.trayDirty) return;
    this.trayDirty = false;
    this.tray.setTray(this.session.getTray());
  }

  private paintBackground(): void {
    const node = createNode('Background', this.node, 720, 1280, 0, 0);
    const graphics = node.addComponent(Graphics);
    const bands = 18;
    const height = 1280 / bands;
    for (let index = 0; index < bands; index += 1) {
      const color = mixColor(Theme.bgTop, Theme.bgBottom, index / (bands - 1));
      drawRound(graphics, -360, 640 - (index + 1) * height, 720, height + 1, 0, color);
    }
    drawRound(graphics, -250, 180, 180, 180, 90, new Color(255, 255, 255, 16));
    drawRound(graphics, 120, -80, 120, 120, 60, new Color(255, 255, 255, 12));
  }

  private refresh(rebuildTray: boolean): void {
    this.hud.sync(
      this.session.getScore(),
      this.session.getBest(),
      this.session.getCombo(),
      this.session.getLevel(),
      this.session.isSoundOn(),
      this.session.isMusicOn(),
    );
    this.board.setGrid(this.session.getGrid());
    this.board.setPreview(null);
    this.board.setHints([]);
    if (rebuildTray) this.tray.setTray(this.session.getTray());
    this.syncOverlay();
  }

  private onDragStart(index: number): void {
    const piece = this.session.getTray()[index];
    if (!piece) return;
    this.hot = hotCell(piece.cells);
    const hints = this.session.anchorsFor(index).map((anchor) => ({
      row: anchor.anchorRow + this.hot!.row,
      col: anchor.anchorCol + this.hot!.col,
    }));
    this.board.setHints(hints);
    this.hoverAnchor = null;
  }

  private onDragMove(index: number, x: number, y: number): void {
    if (!this.hot) return;
    const cell = this.board.cellAt(x, y);
    if (!cell) {
      this.hoverAnchor = null;
      this.board.setPreview(null);
      return;
    }
    const anchor = { row: cell.row - this.hot.row, col: cell.col - this.hot.col };
    const preview = this.session.preview(index, anchor.row, anchor.col);
    this.hoverAnchor = preview.valid ? anchor : null;
    this.board.setPreview(preview);
  }

  private onDragEnd(index: number): void {
    const anchor = this.hoverAnchor;
    this.hoverAnchor = null;
    this.hot = null;
    this.board.setPreview(null);
    this.board.setHints([]);
    if (!anchor) {
      this.tray.finishDrag(false);
      return;
    }
    const outcome = this.session.place(index, anchor.row, anchor.col);
    if (!outcome) {
      this.tray.finishDrag(false);
      return;
    }
    this.tray.finishDrag(true);
    this.board.playPlace(outcome.placedCells);
    this.board.playClear(outcome.clearedRows, outcome.clearedCols);
    this.board.setGrid(this.session.getGrid());
    this.audio.unlock();
    this.audio.playPlace();
    if (outcome.lines > 0) this.audio.playClear(outcome.lines);
    if (outcome.combo >= 2) {
      this.audio.playCombo(outcome.combo);
      this.hud.punchCombo(outcome.combo);
    }
    if (outcome.gained > 0) this.hud.floatScore(`+${outcome.gained}`);
    this.hud.sync(
      this.session.getScore(),
      this.session.getBest(),
      this.session.getCombo(),
      this.session.getLevel(),
      this.session.isSoundOn(),
      this.session.isMusicOn(),
    );
    this.trayDirty = true;
    this.syncOverlay();
  }

  private restart(): void {
    this.tray.cancel();
    this.board.finishMotion();
    this.hoverAnchor = null;
    this.hot = null;
    this.session.restart();
    this.audio.unlock();
    this.audio.playButton();
    this.overShown = false;
    this.refresh(true);
  }

  private toggleSound(): void {
    const next = !this.session.isSoundOn();
    this.session.setSoundOn(next);
    this.audio.soundOn = next;
    this.audio.unlock();
    this.audio.playButton();
    this.refresh(false);
  }

  private toggleMusic(): void {
    const next = !this.session.isMusicOn();
    this.session.setMusicOn(next);
    this.audio.musicOn = next;
    this.audio.unlock();
    if (!next) this.audio.tick(0);
    this.audio.playButton();
    this.refresh(false);
  }

  private syncOverlay(): void {
    if (this.session.getStatus() !== 'over') {
      this.overShown = false;
      this.overlay.hide();
      return;
    }
    this.overlay.show(this.session.getScore(), this.session.getBest());
    if (!this.overShown) {
      this.overShown = true;
      this.audio.playGameOver();
    }
  }

  private pointerToNode(event: EventTouch, target: Node): { x: number; y: number } {
    const transform = target.getComponent(UITransform);
    if (!transform) return { x: 0, y: 0 };
    const ui = event.getUILocation();
    const local = transform.convertToNodeSpaceAR(new Vec3(ui.x, ui.y, 0));
    return { x: local.x, y: local.y };
  }
}
