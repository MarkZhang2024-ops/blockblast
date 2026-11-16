import { Color } from 'cc';
import { GameConfig } from '../config/GameConfig';

export const Theme = {
  bgTop: new Color(16, 20, 46, 255),
  bgBottom: new Color(42, 18, 62, 255),
  board: new Color(12, 16, 36, 255),
  boardEdge: new Color(86, 98, 168, 255),
  empty: new Color(34, 42, 74, 255),
  text: new Color(246, 248, 255, 255),
  muted: new Color(176, 186, 220, 255),
  gold: new Color(255, 214, 102, 255),
  good: new Color(116, 255, 188, 255),
  goodSoft: new Color(116, 255, 188, 150),
  badSoft: new Color(255, 96, 112, 150),
  flash: new Color(255, 246, 214, 220),
  hint: new Color(255, 255, 255, 110),
  lineGlow: new Color(255, 255, 255, 46),
  panel: new Color(18, 22, 48, 242),
  button: new Color(88, 104, 255, 255),
  buttonMute: new Color(62, 70, 112, 255),
  white: new Color(255, 255, 255, 255),
  shadow: new Color(0, 0, 0, 70),
};

const palette: Color[] = GameConfig.visual.palette.map((rgb) => new Color(rgb[0], rgb[1], rgb[2], 255));
const shades: Color[] = palette.map((color) => scaleColor(color, 0.68));
const lights: Color[] = palette.map((color) => mixWhite(color, 0.38));

export function pieceColor(index: number): Color {
  if (index <= 0) return Theme.empty;
  return palette[(index - 1) % palette.length];
}

export function pieceShade(index: number): Color {
  if (index <= 0) return Theme.empty;
  return shades[(index - 1) % shades.length];
}

export function pieceLight(index: number): Color {
  if (index <= 0) return Theme.white;
  return lights[(index - 1) % lights.length];
}

export function mixColor(from: Color, to: Color, t: number): Color {
  return new Color(
    Math.round(from.r + (to.r - from.r) * t),
    Math.round(from.g + (to.g - from.g) * t),
    Math.round(from.b + (to.b - from.b) * t),
    Math.round(from.a + (to.a - from.a) * t),
  );
}

function scaleColor(color: Color, amount: number): Color {
  return new Color(
    Math.round(color.r * amount),
    Math.round(color.g * amount),
    Math.round(color.b * amount),
    color.a,
  );
}

function mixWhite(color: Color, amount: number): Color {
  return new Color(
    Math.round(color.r + (255 - color.r) * amount),
    Math.round(color.g + (255 - color.g) * amount),
    Math.round(color.b + (255 - color.b) * amount),
    color.a,
  );
}

export function bandLabel(band: string): string {
  if (band === 'easy') return '简单';
  if (band === 'hard') return '困难';
  if (band === 'expert') return '专家';
  return '普通';
}
