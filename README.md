# Block Blast Puzzle

Cocos Creator 3.8.x 竖屏休闲益智游戏。棋盘 8×8，每轮三个方块，拖动放置，行列填满后消除。

逻辑层不依赖 `cc`。界面只负责输入、绘制和音效。预测搜索都在棋盘副本上执行，不会每帧搜索。

## 目录

```text
assets/scenes/Game.scene          可直接预览的场景
assets/prefabs/                   Cell、Piece、TraySlot、GameOverPanel
assets/scripts/config/            全部可调参数
assets/scripts/core/              棋盘、计分、规则、存档接口、随机数
assets/scripts/algorithm/         目录、加权生成、放置、评估、前瞻、难度、公平性
assets/scripts/game/GameSession.ts 对局状态机
assets/scripts/ui/                Cocos 界面、拖动、音效、本地存档
tests/                            边界、碰撞、消除、复制、三块模拟、公平性、结束判断
docs/                             场景、预制体、运行和算法参数说明
tools/generate-assets.mjs         生成场景、预制体和 meta
tools/run-tests.mjs               编译并运行测试，再做界面类型检查
```

## 运行

用 Cocos Creator 3.8.x 打开本目录，打开 `assets/scenes/Game.scene`，点击预览。设计分辨率 720×1280，宽度适配。

更细的步骤见 [docs/RUN.md](docs/RUN.md)。场景节点见 [docs/SCENE_SETUP.md](docs/SCENE_SETUP.md)，预制体见 [docs/PREFAB_NODES.md](docs/PREFAB_NODES.md)，参数见 [docs/ALGORITHM_PARAMS.md](docs/ALGORITHM_PARAMS.md)。
