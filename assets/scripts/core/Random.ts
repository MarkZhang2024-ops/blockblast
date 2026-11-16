/**
 * 可保存状态的随机数。生成、旋转和颜色都走这里，保证同一存档可复现。
 */
export interface Rng {
  next: () => number;
  state: () => number;
}

export function mulberry32(seed: number): Rng {
  let state = seed >>> 0;
  return {
    next(): number {
      state |= 0;
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    state(): number {
      return state >>> 0;
    },
  };
}

export function rngFromState(state: number): Rng {
  return mulberry32(state >>> 0);
}
