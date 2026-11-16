# 场景搭建说明

当前可运行场景是 `assets/scenes/Game.scene`。用 Creator 3.8.x 打开后直接预览即可。下面是这个场景的组成，以及需要手工重建时的步骤。

## 场景里已有的节点

| 节点 | 组件 | 说明 |
| --- | --- | --- |
| Scene | - | 场景名 `Game` |
| Canvas | UITransform、Canvas、Widget、GameApp | 设计尺寸 720×1280，锚点居中，Widget 四边对齐 |
| Canvas/Camera | Camera | 正交相机，orthoHeight 640，清屏色接近背景深蓝，可见性包含 UI_2D |

`GameApp` 挂在 Canvas 上，没有需要在检查器里拖拽的预制体引用。

Canvas 的位置是 `(360, 640, 0)`，对应设计分辨率中心。Widget 的 Align Mode 为 `ON_WINDOW_RESIZE`（序列化值 2），左右上下都对齐到父节点。

相机：

- Projection：Ortho
- Ortho Height：640
- Near / Far：1 / 2000
- Clear Flags：实体颜色 + 深度 + 模板
- Visibility：`1107296256`（UI_2D 与默认层）
- 本地位置：`(0, 0, 1000)`

项目设置里的设计分辨率是 720×1280，Fit Width 打开，Fit Height 关闭。这样竖屏手机会按宽度适配。

## 运行后由 GameApp 创建的节点

这些节点不写进场景文件，预览时才会出现：

| 节点 | 作用 |
| --- | --- |
| Background | 720×1280 背景 |
| Hud | 标题、分数、最高分、连击、音效、音乐、重开、难度 |
| Board | 一张 Graphics 绘制 8×8 棋盘、预览和消除闪光 |
| Tray | 三个槽位和待放置方块 |
| DragLayer | 拖动中的方块，位于托盘之上、结束界面之下 |
| GameOver | 全屏遮罩、分数和「再来一局」 |

坐标以 Canvas 中心为原点，y 向上：

- Hud 中心 y = 520
- Board 中心 y = 8，格子 56，间距 6，外框内边距 18
- Tray 中心 y = -500，三个槽的 x 为 -220、0、220

## 手工重建场景

如果场景资源丢失，可以在编辑器里重建，也可以重新执行 `node tools/generate-assets.mjs`。

手工步骤：

1. 新建场景，保存为 `assets/scenes/Game.scene`。
2. 确认层级中有 Canvas 和 Camera。没有的话使用 Creator 的 2D 场景模板。
3. 选中 Canvas，UITransform 设为 720×1280，锚点 (0.5, 0.5)。
4. 给 Canvas 添加 Widget，上、下、左、右都勾选，边距 0。
5. 把 Camera 的投影改为正交，Ortho Height 设为 640，清屏色设为深蓝。
6. 把 `assets/scripts/ui/GameApp.ts` 拖到 Canvas 上。
7. 保存场景并预览。

不要把棋盘逻辑写进额外的管理器。放置、生成和结束判断都在 `GameSession` 里，`GameApp` 只转发输入和刷新界面。
