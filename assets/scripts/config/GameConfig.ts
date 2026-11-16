/**
 * 全局可调参数。算法、计分、难度和界面都从这里读取，避免散落魔法数。
 */
export const GameConfig = {
  board: {
    size: 8,
  },
  score: {
    /** 只放置、未消除时不得分。 */
    cell: 0,
    /** 被消除的每一格额外得分。交点只计一次。 */
    clearCell: 2,
    /** 每一条被消除的行或列。 */
    lineBonus: 12,
    /** 同一次消除里，从第二条线开始每条追加的奖励。 */
    multiLineBonus: 8,
    /** 连击每增加 1，倍率增加的数值。首消倍率为 1。 */
    comboStep: 0.5,
    maxMultiplier: 4,
  },
  difficulty: {
    /** 每累计这么多分，等级加 1。 */
    pointsPerLevel: 400,
    /** 新档开局难度，对应 1 级。 */
    initial: 0.16,
    /** 向目标难度靠拢的比例。 */
    smooth: 0.18,
    /** 每一轮难度数值允许的最大变化。 */
    maxStep: 0.06,
    /** value < easy 为简单，< normal 为普通，< hard 为困难，否则专家。 */
    bands: {
      easy: 0.28,
      normal: 0.52,
      hard: 0.75,
    },
    /** 近期得分归一化，用于把分数表现映射到 0~1。 */
    scoreNorm: 80,
    historyLimit: 8,
  },
  generator: {
    /** 每轮参与公平性筛选的候选组合数量。 */
    candidateCount: 12,
    /** 越小越贴近目标难度，越大越随机。 */
    selectionTemperature: 0.18,
    colorCount: 8,
  },
  lookahead: {
    /** 每一层保留的棋盘状态数。 */
    beamWidth: 3,
    /** 每个状态展开的放置分支数。 */
    branchLimit: 5,
    /** 单次搜索的展开上限，防止候选评估过重。 */
    maxNodes: 260,
  },
  evaluator: {
    /** 行或列填充率达到该值且未满，记为“接近消除”。 */
    almostFullRatio: 0.7,
    /** 占用率高于该值时，生成权重向小块倾斜。 */
    crowdedOccupancy: 0.72,
  },
  storageKey: 'blockblast.puzzle.save.v1',
  visual: {
    designWidth: 720,
    designHeight: 1280,
    cell: 56,
    gap: 6,
    boardPadding: 18,
    trayCell: 32,
    trayGap: 4,
    palette: [
      [255, 90, 122],
      [255, 159, 46],
      [255, 214, 74],
      [54, 214, 156],
      [46, 196, 255],
      [92, 126, 255],
      [184, 112, 255],
      [255, 110, 196],
    ],
  },
} as const;

export type PaletteRGB = readonly [number, number, number];
