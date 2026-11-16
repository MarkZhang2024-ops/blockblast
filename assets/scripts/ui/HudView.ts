import { Color, Node, tween, UIOpacity, Vec3 } from 'cc';
import { Theme } from './Theme';
import { createButton, createLabel, createNode, type TextButton } from './Nodes';

export interface HudActions {
  onRestart(): void;
  onSound(): void;
  onMusic(): void;
}

/** 分数、连击、难度和开关。分数显示值逐帧靠拢，不触发玩法搜索。 */
export class HudView {
  readonly node: Node;
  private readonly scoreLabel: ReturnType<typeof createLabel>;
  private readonly bestLabel: ReturnType<typeof createLabel>;
  private readonly comboLabel: ReturnType<typeof createLabel>;
  private readonly bandLabel: ReturnType<typeof createLabel>;
  private readonly soundButton: TextButton;
  private readonly musicButton: TextButton;
  private readonly comboNode: Node;
  private shownScore = 0;
  private targetScore = 0;
  private shownRounded = -1;

  constructor(parent: Node, actions: HudActions) {
    this.node = createNode('Hud', parent, 680, 220, 0, 520);
    createLabel('Title', this.node, 'BLOCK BLAST', 34, Theme.gold, 420, 46).node.setPosition(0, 78, 0);
    this.scoreLabel = createLabel('Score', this.node, '0', 40, Theme.text, 180, 52);
    this.bestLabel = createLabel('Best', this.node, '0', 40, Theme.gold, 180, 52);
    this.comboLabel = createLabel('Combo', this.node, '连击 0', 28, Theme.good, 180, 52);
    this.scoreLabel.node.setPosition(-210, 34, 0);
    this.bestLabel.node.setPosition(0, 34, 0);
    this.comboLabel.node.setPosition(210, 34, 0);
    this.comboNode = this.comboLabel.node;
    createLabel('ScoreCaption', this.node, '分数', 18, Theme.muted, 120, 24).node.setPosition(-210, -6, 0);
    createLabel('BestCaption', this.node, '最高', 18, Theme.muted, 120, 24).node.setPosition(0, -6, 0);
    this.soundButton = createButton('Sound', this.node, '音效 开', 120, 48, -220, -78, Theme.button, actions.onSound);
    this.musicButton = createButton('Music', this.node, '音乐 开', 120, 48, -70, -78, Theme.button, actions.onMusic);
    createButton('Restart', this.node, '重开', 120, 48, 80, -78, Theme.buttonMute, actions.onRestart);
    this.bandLabel = createLabel('Band', this.node, '等级 1', 24, Theme.text, 140, 48);
    this.bandLabel.node.setPosition(230, -78, 0);
  }

  sync(score: number, best: number, combo: number, level: number, soundOn: boolean, musicOn: boolean): void {
    if (this.shownRounded < 0) {
      this.shownScore = score;
      this.shownRounded = Math.round(score);
      this.scoreLabel.string = `${this.shownRounded}`;
    }
    this.targetScore = score;
    this.bestLabel.string = `${best}`;
    this.comboLabel.string = combo >= 2 ? `连击 ${combo}` : '连击 0';
    this.comboLabel.color = combo >= 2 ? Theme.gold : Theme.muted;
    this.bandLabel.string = `等级 ${Math.max(1, Math.floor(level))}`;
    this.soundButton.setText(soundOn ? '音效 开' : '音效 关');
    this.soundButton.setFill(soundOn ? Theme.button : Theme.buttonMute);
    this.musicButton.setText(musicOn ? '音乐 开' : '音乐 关');
    this.musicButton.setFill(musicOn ? Theme.button : Theme.buttonMute);
  }

  punchCombo(combo: number): void {
    if (combo < 2) return;
    this.comboNode.setScale(1.28, 1.28, 1);
    tween(this.comboNode).to(0.18, { scale: new Vec3(1, 1, 1) }).start();
  }

  floatScore(text: string, color: Color = Theme.gold): void {
    const label = createLabel('Float', this.node, text, 32, color, 220, 48);
    label.node.setPosition(0, -10, 0);
    const opacity = label.node.addComponent(UIOpacity);
    tween(label.node).by(0.65, { position: new Vec3(0, 64, 0) }).start();
    tween(opacity).to(0.65, { opacity: 0 }).call(() => label.node.destroy()).start();
  }

  tick(dt: number): void {
    this.shownScore += (this.targetScore - this.shownScore) * Math.min(1, dt * 8);
    if (Math.abs(this.targetScore - this.shownScore) < 0.4) this.shownScore = this.targetScore;
    const rounded = Math.round(this.shownScore);
    if (rounded !== this.shownRounded) {
      this.shownRounded = rounded;
      this.scoreLabel.string = `${rounded}`;
    }
  }
}
