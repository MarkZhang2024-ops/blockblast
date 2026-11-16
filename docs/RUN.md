# 运行说明

## 环境

- Cocos Creator 3.8.x（本工程按 3.8.8 的场景和项目设置生成，3.8.4 及以上可以打开）
- 预览使用编辑器自带的浏览器或模拟器
- 运行测试需要 Node.js 18 以上。若系统没有 `node`，可以用编辑器或 Cursor 自带的 Node

## 打开游戏

1. 启动 Cocos Creator，选择「打开其他项目」，选中本目录 `BlockBlastPuzzle`。
2. 等待脚本和场景导入完成。首次打开会生成 `temp` 和 `library`，不要提交这两个目录。
3. 在资源管理器中双击 `assets/scenes/Game.scene`。
4. 层级里应能看到 `Canvas`，其上挂有 `GameApp`，子节点是 `Camera`。
5. 点击编辑器顶部的预览。设计分辨率是 720×1280，适配宽度。

`GameApp` 会在运行时创建背景、分数、棋盘、三个方块槽、拖动层和结束界面。不需要再把预制体拖到检查器上。

## 操作

- 按住底部方块拖到棋盘。松手时，合法位置会放下，不合法会回到槽位。
- 拖动过程中，可放置的参考点会显示白点，当前落点用绿色或红色预览，即将消除的行和列会高亮。
- 三个方块都用完后自动生成下一组。剩下的方块全部无法放置时结束。
- 「重开」和结束界面的「再来一局」会保留最高分。
- 「音效」「音乐」立即生效，并写入本地存档。音效和背景音乐由程序合成，不需要音频文件。

## 存档

键名是 `blockblast.puzzle.save.v1`，使用 Cocos 的 `sys.localStorage`。内容包括棋盘、剩余方块、分数、最高分、连击、难度、随机数状态和开关。

## 测试

在项目根目录执行：

```text
node tools/run-tests.mjs
```

脚本会：

1. 用 Cocos Creator 3.8.8 自带的 TypeScript 编译 `tsconfig.tests.json`。
2. 运行 `tests` 里的棋盘、前瞻、公平性和对局测试。
3. 用 `tsconfig.ui.json` 检查界面脚本的类型。

测试覆盖方块越界、碰撞、单行消除、多行多列同时消除、棋盘深拷贝、三块连续放置、生成公平性、难度平滑和游戏结束。

如果本机的 Creator 不在默认安装目录，把 `tools/run-tests.mjs` 里的 `tsc` 路径改成自己的 `typescript/bin/tsc`。

## 重新生成场景和预制体

源码变更后如果需要重写 `.meta`、场景和预制体：

```text
node tools/generate-assets.mjs
```

不要手改 `.meta` 里的 uuid，否则场景上的 `GameApp` 会丢失脚本引用。
