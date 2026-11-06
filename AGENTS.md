# AGENTS.md — dsh-activity-heat

DSH Web 插件：按"距最后一次活动的时间"算热度，标记最近活跃的会话与工作区。Host 半侧（`index.js`）提供一条 open-terminal 路由，其余逻辑在 `client.js`。

> **改 UI / 交互前必读 [DESIGN.md](DESIGN.md)（§2 红线）与 [VETO-LIST.md](VETO-LIST.md)（否决清单 + 历史偏差），机制层踩坑见 [PITFALLS.md](PITFALLS.md)**。命中条目即为红线。

## 冷启动读取顺序

1. 本文件（≤2 分钟）；
2. [HANDOFF.md](HANDOFF.md)：当前现状与限制 + 待处理事项 + 最近决策；
3. 相关记录：`DESIGN.md`（§2 红线）、`VETO-LIST.md`（按场景过滤否决条目）、`PITFALLS.md`（按章节过滤踩坑）；
4. `pnpm test`：失败先修环境，不动业务。

## plan 强制阅读范围（每次执行 plan 前必做）

> 每次进入 plan / 制定执行计划前，先让用户选择本次的文档强制阅读范围，再开始写计划。这是硬机制，不是建议。

1. **按相关度排序**：结合本次任务，对 `DESIGN.md` / `VETO-LIST.md` / `PITFALLS.md` / `HANDOFF.md` 排序（本文件恒读，不参与选择）。
2. **给出选项**：把最相关的 1–2 份作为选项第 1、第 2 项并标注「（推荐）」；其余文件随后列出；最后提供「不强制 AI 阅读」。
3. **用户选择**：用户可勾选 1 个或多个文件作为**强制阅读**范围，或选择「不强制 AI 阅读」。
4. **plan 开头声明**：`本次强制阅读范围：<文件列表>`，或 `本次不强制阅读`。
5. **执行约束**：强制阅读范围内的文件必须全文读完再动手；「推荐」只决定默认排序，仍须用户确认。

## 先草图后落码

- **触发**：新增区块/席位、信息层级或分区变化、状态视觉语义变化、交互入口变化（右键菜单项、快捷键、面板视图切换）。
- **不触发**：纯颜色 / 间距 / 圆角 / 单一图标替换、文案。
- **输出**：≤30 行 ASCII 草图，标清席位与宽度，1 个主推 + 最多 1 个备选，列「待确认 N 点」并给默认值。
- **「确认」仅指**：可以 / 按这个做 / 序号 / 修改后同意。**未回复不算确认，停住不落码**（`e10b053c` 的 B′ 事故即因未等确认就落码）。

## 常用命令

```bash
pnpm test                # panel / menu / shortcut / boot-timing / locale 五项自检
node --check client.js   # 改完先跑这个
pnpm doctor:install      # 检查 profile 是否真的 Junction 到本仓库且版本一致（重启前必查）
node test/panel.cjs      # 只跑渲染与交互断言
node test/menu.cjs       # 只跑右键菜单的动作与降级断言
```

没有构建步骤：`client.js` 是手写的浏览器模块，直接改、直接测。

## 目录

```
index.js            Host 入口：open-terminal 路由（启动系统终端），其余留给 loader 挂载
client.js           全部 UI 逻辑 + 内联字典（状态视觉用本地 StatusDot，主题令牌取色）
DESIGN.md           视觉与交互纲领（改 UI 前必读）
VETO-LIST.md        否决清单 + 设计偏差记录（改 UI 前对照）
PITFALLS.md         踩坑谨记（原「牢记事项.md」）
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
7. **改 UI/UX 前先读 [DESIGN.md](DESIGN.md)**：颜色、动效、布局的红线（§2）不得违反；必须破例时先改纲领并写清理由。任何新偏差补进 [VETO-LIST.md](VETO-LIST.md)，否则同类问题会再次出现。
8. **严格按 DSH 官方插件规范**（随包手册 `@deepseek-ai/dsh-agent-preset/skills/cordis-plugin-development/`）：bundle 用 `dsh.bundle.patch`、UI 插件声明 `dsh.client` + `./client`。但本 DSH 版本有两条实测约束：**不要声明插件级 `inject:['slots']`**（profile 静态 entry 会 pending、冷启动不 apply，改用 `ctx.get('slots')` 轮询）；**整个 `client.js` 必须用 IIFE 包裹**——宿主把多个插件的 client.js 拼进同一脚本作用域，顶层函数名（如 `build`）会互相覆盖（envhub 的 `build` 曾覆盖我们的，导致本插件永不 apply）。**禁止 require Harness Client 包**，不要抢宿主 single 席位。详见 [PITFALLS.md](PITFALLS.md) §一.6/§一.7。

## 验证规则（验收分级，本项目具体化）

| 档位 | 本项目怎么做 | 命令 / 入口 |
|---|---|---|
| A 真实运行 | 完全退出 DSH 再启动，打开面板看热度点 / 卡片 / 悬停卡 / 底部条 | 重启 DSH Web 后手动验收 |
| B 截图产物 | 面板截图、导出文件 | 截图 / 产物路径 |
| C 仅静态检查 | 语法检查 + 五项自检（构建 / 单测均属此档，不等于运行正确） | `node --check client.js && pnpm test` |
| D 未验证 | 明确写「未验证：<项>」 | — |

## 文档索引

- **[DESIGN.md](DESIGN.md)** — 设计准则：风格定义、四条红线、色板 / 热度色阶 / 表面层级 / 动效 / 布局红线。**每次改 UI/UX 前先对照 §2 红线。**
- **[VETO-LIST.md](VETO-LIST.md)** — 否决清单：被否方案 + 提炼红线，+ 附录 A 历史设计偏差（原 design.md §9 整表迁入）。**改 UI 前逐条对照。**
- **[PITFALLS.md](PITFALLS.md)** — 错误谨记：插件加载失败/崩溃、快捷键、数字口径、裁剪等踩坑，按章节分主题。**动手前先扫对应章节。**
- **[HANDOFF.md](HANDOFF.md)** — 连续性记忆：心智模型、设计原则、现状与限制、决策记录、待处理。
- [README.md](README.md) / [README.zh.md](README.zh.md) — 功能、安装、配置、数据来源。
- [CHANGELOG.md](CHANGELOG.md) — 版本变更。
- [docs/插件加载诊断与官方规范.md](docs/插件加载诊断与官方规范.md) — 插件加载问题诊断与官方规范对照。

## 提交约定

- 提交信息用中文，`type: 摘要` 形式（feat / fix / refactor / docs / style）。
- 改功能时同步更新 README（中英两份）与 CHANGELOG。
