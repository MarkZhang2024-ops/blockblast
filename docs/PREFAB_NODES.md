# 预制体和节点配置

运行时界面由代码绘制，保证打开场景就能玩。预制体和运行时节点使用同一套尺寸，方便在编辑器里查看，或以后改成预制体实例。

## 运行时节点

### Board

- 组件：UITransform + Graphics
- 外框边长：`8 * 56 + 7 * 6 + 18 * 2 = 526`
- 格子从左上角开始编号，行 0 在上
- 空格、已放置方块、合法位置白点、拖动预览和消除闪光都画在这一张 Graphics 上
- 拖动开始时计算一次合法锚点，移动过程中只做命中检测，不重新搜索

### Tray / Slot0..2

- 托盘 680×210
- 每个槽 192×176
- 方块格子 32，间距 4
- 方块节点带 UITransform 和 Graphics，触摸区域覆盖形状包围盒
- 拖动时把方块重新挂到 DragLayer，并保持世界坐标

### Hud

- 标题 `BLOCK BLAST`
- 分数、最高分、连击
- 按钮：音效、音乐、重开，尺寸 120×48
- 难度文字：等级 N，每 400 分一级

### GameOver

- 尺寸 720×1280，带 BlockInputEvents，避免结束时还能拖棋子
- 未结束时节点关闭
- 面板 560×460，包含本局分数、最高分和「再来一局」

## 预制体

| 预制体 | 根节点尺寸 | 组件 | 用途 |
| --- | --- | --- | --- |
| `assets/prefabs/Cell.prefab` | 56×56 | UITransform、CellView | 单格外观。`colorIndex` 从 1 开始，对应配置里的调色板 |
| `assets/prefabs/Piece.prefab` | 140×140 | UITransform、PieceView | 默认 2×2。运行时调用 `setPiece(cells, colorIndex)` 可换成任意形状 |
| `assets/prefabs/TraySlot.prefab` | 192×176 | UITransform | 空槽背景尺寸 |
| `assets/prefabs/GameOverPanel.prefab` | 560×460 | UITransform | 结束面板尺寸 |

`CellView` 和 `PieceView` 都在 `onLoad` 里用 Graphics 画圆角方块。当前 `GameApp` 不实例化这些预制体，避免预览依赖手动绑引用。

如果要改成预制体流程：

1. 把 `Cell.prefab` 的实例放进棋盘格子节点，调用方只改 `colorIndex`。
2. 把 `Piece.prefab` 的实例放进槽位，发牌时调用 `setPiece`。
3. 用 `TraySlot.prefab` 替换代码创建的 Slot。
4. 用 `GameOverPanel.prefab` 作为结束面板的底。

替换时保持上表的尺寸，拖动命中和棋盘吸附才不会错位。
