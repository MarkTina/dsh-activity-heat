# AGENTS.md — dsh-activity-heat

DSH Web 插件：按"距最后一次活动的时间"算热度，标记最近活跃的会话与工作区。Host 半侧（`index.js`）提供一条 open-terminal 路由，其余逻辑在 `client.js`。

## 常用命令

```bash
npm test                 # panel / menu / shortcut / boot-timing / locale 五项自检
node --check client.js   # 改完先跑这个
node test/panel.cjs      # 只跑渲染与交互断言
node test/menu.cjs       # 只跑右键菜单的动作与降级断言
```

没有构建步骤：`client.js` 是手写的浏览器模块，直接改、直接测。

## 目录

```
index.js            Host 入口：open-terminal 路由（启动系统终端），其余留给 loader 挂载
client.js           全部 UI 逻辑 + 内联字典（状态视觉复用宿主 StateDot）
design.md           视觉与交互纲领（改 UI 前必读）
cordis.patch.yml    插入 activity-heat 行与默认配置
locale/zh.json      插件元数据 + 界面字典（与 client.js 内联字典由测试强制一致）
locale/en.json
test/               五项免依赖自检
```

## 改代码前必须知道

1. **factory 永不抛错**。`window.__ModuleLoader__.load({ factory })` 里任何异常都会让整个插件不显示，异常一律吞掉并降级。
2. **数字口径跟着宿主状态栏走**：轮次/步数用 `sessionStats`，tokens 与缓存用 `tokenUsage`，上下文用 `contextPressure`；不要用 `contextTimeline.current.total` 当累计用量。
3. **改完必须完全退出 DSH 再启动**。这是 `link:` 安装，刷新页面、开关插件都不会重新读模块。
4. **默认快捷键 `Ctrl+Alt+H`**，不要改回 `Ctrl+H`（保留键），也不要声明 Linux profile。
5. 界面文字一律走 `tt()`，字典改动要同时更新 `client.js` 内联字典与 `locale/*.json`。
6. **右键菜单/对话框必须 portal 到 `document.body`**：列表是 `overflow:auto` 容器，原地渲染会被裁剪。写操作逐项做能力检测（`uiWorkspace.pin/archive/fork`、`sessions.using`），缺方法只禁用对应项，不要让整份菜单消失或抛错。
7. **改 UI/UX 前先读 [design.md](design.md)**：颜色、动效、布局的红线（§2）不得违反；必须破例时先改纲领并写清理由。任何新偏差补进 §9「偏差记录」，否则同类问题会再次出现。

## 索引

- **[design.md](design.md)** — 视觉与交互纲领：风格定义、四条红线、色板 / 热度色阶 / 表面层级 / 动效 / 布局红线，以及历次偏差记录。**每次改 UI/UX 前先对照 §2 与 §9。**
- **[牢记事项.md](牢记事项.md)** — 踩过的坑合集：插件加载失败/崩溃、快捷键注册被拒、数字口径对不上、光带与浮层/菜单被裁剪。**动手前先扫一遍对应章节**。
- [README.md](README.md) / [README.zh.md](README.zh.md) — 功能、安装、配置、数据来源。
- [CHANGELOG.md](CHANGELOG.md) — 版本变更。

## 提交约定

- 提交信息用中文，`type: 摘要` 形式（feat / fix / refactor / docs / style）。
- 改功能时同步更新 README（中英两份）与 CHANGELOG。
