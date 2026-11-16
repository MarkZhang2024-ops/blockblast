import { normalizeCells } from '../core/Board';
import type { Cell, ShapeDef, ShapeTier } from '../core/Types';

interface RawShape {
  id: string;
  name: string;
  pairs: readonly number[];
  tier: ShapeTier;
  baseWeight: number;
}

function cellsOf(pairs: readonly number[]): Cell[] {
  const cells: Cell[] = [];
  for (let index = 0; index < pairs.length; index += 2) {
    cells.push({ row: pairs[index], col: pairs[index + 1] });
  }
  return normalizeCells(cells);
}

const RAW: readonly RawShape[] = [
  { id: 'mono', name: '单格', pairs: [0, 0], tier: 'small', baseWeight: 1.05 },
  { id: 'domino', name: '二连', pairs: [0, 0, 0, 1], tier: 'small', baseWeight: 1.4 },
  { id: 'trio', name: '三连', pairs: [0, 0, 0, 1, 0, 2], tier: 'medium', baseWeight: 1.35 },
  { id: 'corner', name: '小拐角', pairs: [0, 0, 0, 1, 1, 0], tier: 'small', baseWeight: 1.4 },
  { id: 'square', name: '方块', pairs: [0, 0, 0, 1, 1, 0, 1, 1], tier: 'medium', baseWeight: 1.45 },
  { id: 'line4', name: '四连', pairs: [0, 0, 0, 1, 0, 2, 0, 3], tier: 'medium', baseWeight: 1.1 },
  { id: 't4', name: 'T形', pairs: [0, 0, 0, 1, 0, 2, 1, 1], tier: 'medium', baseWeight: 1.25 },
  { id: 'l4', name: 'L形', pairs: [0, 0, 1, 0, 2, 0, 2, 1], tier: 'medium', baseWeight: 1.2 },
  { id: 's4', name: 'S形', pairs: [0, 1, 0, 2, 1, 0, 1, 1], tier: 'medium', baseWeight: 1.05 },
  { id: 'line5', name: '五连', pairs: [0, 0, 0, 1, 0, 2, 0, 3, 0, 4], tier: 'large', baseWeight: 0.72 },
  { id: 'plus', name: '十字', pairs: [0, 1, 1, 0, 1, 1, 1, 2, 2, 1], tier: 'large', baseWeight: 0.9 },
  { id: 'l5', name: '长L', pairs: [0, 0, 1, 0, 2, 0, 3, 0, 3, 1], tier: 'large', baseWeight: 0.82 },
  { id: 'u5', name: 'U形', pairs: [0, 0, 0, 2, 1, 0, 1, 1, 1, 2], tier: 'large', baseWeight: 0.78 },
  { id: 't5', name: '大T', pairs: [0, 0, 0, 1, 0, 2, 1, 1, 2, 1], tier: 'large', baseWeight: 0.76 },
  { id: 'p5', name: 'P形', pairs: [0, 0, 0, 1, 1, 0, 1, 1, 2, 0], tier: 'large', baseWeight: 0.8 },
  { id: 'rect6', name: '矩形', pairs: [0, 0, 0, 1, 0, 2, 1, 0, 1, 1, 1, 2], tier: 'large', baseWeight: 0.58 },
  { id: 'square9', name: '九宫', pairs: [0, 0, 0, 1, 0, 2, 1, 0, 1, 1, 1, 2, 2, 0, 2, 1, 2, 2], tier: 'large', baseWeight: 0.32 },
];

let catalog: readonly ShapeDef[] | null = null;

function buildCatalog(): readonly ShapeDef[] {
  return RAW.map((shape) => ({
    id: shape.id,
    name: shape.name,
    cells: cellsOf(shape.pairs),
    tier: shape.tier,
    baseWeight: shape.baseWeight,
  }));
}

export function getCatalog(): readonly ShapeDef[] {
  if (!catalog) catalog = buildCatalog();
  return catalog;
}

export function getShape(id: string): ShapeDef | null {
  for (const shape of getCatalog()) {
    if (shape.id === id) return shape;
  }
  return null;
}
