# AGENTS.md — dsh-activity-heat

DSH Web 插件：按"距最后一次活动的时间"算热度，标记最近活跃的会话与工作区。Host 半侧（`index.js`）只负责挂载，全部逻辑在 `client.js`。

## 常用命令

```bash
npm test                 # panel / shortcut / boot-timing / locale / assets 五项自检
node --check client.js   # 改完先跑这个
node test/panel.cjs      # 只跑渲染与交互断言
```

没有构建步骤：`client.js` 是手写的浏览器模块，直接改、直接测。

## 目录

```
index.js            Host 入口（no-op，只让 loader 挂载包）
client.js           全部 UI 逻辑 + 内联字典 + 内联鲸尾 GIF
cordis.patch.yml    插入 activity-heat 行与默认配置
locale/zh.json      插件元数据 + 界面字典（与 client.js 内联字典由测试强制一致）
locale/en.json
assets/active.gif   运行中徽标动图（内联副本由 test/assets.cjs 校验）
test/               五项免依赖自检
```

## 改代码前必须知道

1. **factory 永不抛错**。`window.__ModuleLoader__.load({ factory })` 里任何异常都会让整个插件不显示，异常一律吞掉并降级。
2. **数字口径跟着宿主状态栏走**：轮次/步数用 `sessionStats`，tokens 与缓存用 `tokenUsage`，上下文用 `contextPressure`；不要用 `contextTimeline.current.total` 当累计用量。
3. **改完必须完全退出 DSH 再启动**。这是 `link:` 安装，刷新页面、开关插件都不会重新读模块。
4. **默认快捷键 `Ctrl+Alt+H`**，不要改回 `Ctrl+H`（保留键），也不要声明 Linux profile。
5. 界面文字一律走 `tt()`，字典改动要同时更新 `client.js` 内联字典与 `locale/*.json`。

## 索引

- **[牢记事项.md](牢记事项.md)** — 踩过的坑合集：插件加载失败/崩溃、快捷键注册被拒、数字口径对不上、光带与浮层被裁剪。**动手前先扫一遍对应章节**。
- [README.md](README.md) / [README.zh.md](README.zh.md) — 功能、安装、配置、数据来源。
- [CHANGELOG.md](CHANGELOG.md) — 版本变更。

## 提交约定

- 提交信息用中文，`type: 摘要` 形式（feat / fix / refactor / docs / style）。
- 改功能时同步更新 README（中英两份）与 CHANGELOG。
