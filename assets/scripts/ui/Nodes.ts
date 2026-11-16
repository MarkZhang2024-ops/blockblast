import {
  Color,
  EventTouch,
  Graphics,
  HorizontalTextAlignment,
  Label,
  Layers,
  Node,
  Overflow,
  UITransform,
  VerticalTextAlignment,
} from 'cc';
import { drawRound } from './Draw';

export function createNode(name: string, parent: Node, width: number, height: number, x = 0, y = 0): Node {
  const node = new Node(name);
  node.layer = Layers.Enum.UI_2D;
  const transform = node.addComponent(UITransform);
  transform.setContentSize(width, height);
  node.setPosition(x, y, 0);
  parent.addChild(node);
  return node;
}

export function createLabel(
  name: string,
  parent: Node,
  text: string,
  fontSize: number,
  color: Color,
  width: number,
  height: number,
): Label {
  const node = createNode(name, parent, width, height, 0, 0);
  const label = node.addComponent(Label);
  label.useSystemFont = true;
  label.fontFamily = 'Microsoft YaHei';
  label.string = text;
  label.fontSize = fontSize;
  label.lineHeight = fontSize + 6;
  label.color = color;
  label.horizontalAlign = HorizontalTextAlignment.CENTER;
  label.verticalAlign = VerticalTextAlignment.CENTER;
  label.overflow = Overflow.SHRINK;
  label.isBold = fontSize >= 28;
  return label;
}

export interface TextButton {
  node: Node;
  label: Label;
  setText(text: string): void;
  setFill(color: Color): void;
}

export function createButton(
  name: string,
  parent: Node,
  text: string,
  width: number,
  height: number,
  x: number,
  y: number,
  fill: Color,
  onClick: () => void,
): TextButton {
  const node = createNode(name, parent, width, height, x, y);
  const graphics = node.addComponent(Graphics);
  const paint = (color: Color): void => {
    graphics.clear();
    drawRound(graphics, -width / 2, -height / 2, width, height, 16, color);
  };
  paint(fill);
  const label = createLabel('Text', node, text, 22, Color.WHITE, width - 8, height);
  node.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
    event.propagationStopped = true;
    onClick();
  }, node);
  return {
    node,
    label,
    setText(value: string): void {
      label.string = value;
    },
    setFill(color: Color): void {
      paint(color);
    },
  };
}
