# dsh-activity-heat · 会话热度（最近活跃）

> 一个 DeepSeek Harness 插件：用「热度」把**最近发生过对话的会话和工作区**顶到眼前，不用在几十个分区里翻找。

[English](README.md) | 中文

---

## 它解决什么问题

DSH 的侧栏里会话越攒越多，分区一层套一层。刚聊过的会话很快被刷下去，找回来要翻半天。

这个插件的做法是：按**距最后一次活动的时间**算出 0–100% 的热度，然后用三层视觉把「热」表达出来——越近越醒目。

## 三处可见 + 一个面板

| 位置 | 表现 |
|---|---|
| **侧栏入口** | 热度环图标，亮度跟随全场最热会话 |
| **会话行首 16px 格** | 热度点：炽热=实心带光晕 → 温热=实心 → 活跃/近期=描边环 → 陈旧=小点 → 超过 7 天不显示 |
| **会话悬停卡** | `热度 4/5 · 温热`、`最后活动：40 分钟前`、`所在工作区「X」正热` |
| **中央面板** | 会话 / 工作区两个视图切换，各带热度筛选与数量选择 |

### 面板细节

- **顶层切换**：`会话 58` / `工作区 10`，不再是上下混排
- **数量可选**：会话 `10 / 20 / 30 / 50`，工作区 `5 / 10 / 20`
- **热度筛选**：全部 / 炽热 / 温热 / 活跃 / 近期 / 陈旧（带实时计数）
- **每张卡片**：底部依次是缓存命中率、上下文占比（各带迷你进度条），然后是轮次、tokens 与累计对话时长；相对时间贴在最右侧
- **耗时分布**：悬浮累计对话时长会展开小卡片——活跃时长、等待/思考/回复/工具参数/工具执行/其他的环形图、图例与按比例铺排的时间轴，数据来自 `contextTimeline.timing`，分段口径与宿主的耗时统计一致
- **右侧信息列**：工作区名（上）与热度计（下）共用固定 168px 列，档位文字固定宽度右对齐，多行之间不会错位
- **统一图标语言**：五个指标共用 12px 描边图标，全部取自 `currentColor`——不再有彩色 emoji
- **长列表可滚动**：列表限高、块级布局（30–50 条也保持完整高度，不会被压扁）、隐藏原生滚动条，右侧用浮动的 `⌃⌄` 提示还能上下滑
- **点击即跳转**：会话行打开该会话，工作区行打开该工作区

### 正在运行的会话有专属标识

`session.running === true` 的卡片会获得：

- 卡片右侧留白处的**鲸尾 + 「工作中」**标识（`assets/active.png` 内联为 data URI，由 CSS 做摆动、上浮与呼吸——不再用标题前的小徽章）
- 卡片外边框**环绕跑马灯光带**（`conic-gradient` 旋转，2.2s 一圈）
- 外层**呼吸外发光**（2.4s 一次）
- 侧栏行首画蓝色实心点

**工作区卡片**同理：只要该工作区里有任意一个会话正在运行，就显示同一套标识——同样的鲸尾「工作中」、同样的环绕跑马灯、同样的呼吸外发光，所以工作区视图里也能一眼看到活着的任务。

> 尊重 `prefers-reduced-motion`：系统开启减少动态效果时，动画自动静止。

## 配色

只用宿主主题令牌，**不写死色值**，因此自动适配明/暗主题：

```css
--color-blue-500             /* 热度主色（蓝色，回退 #3b82f6） */
--dsw-alias-bg-base          /* 卡片不透明底（遮住跑马灯光带） */
--dsw-alias-label-primary    /* 主文字 */
--dsw-alias-label-secondary  /* 次要文字 */
--dsw-alias-border-l1        /* 分隔与轨道 */
```

热度用**同一个色相的不同不透明度**表达（0.3 → 1.0），配合可部分填充的刻度条。不用五彩，视觉更收束。

## 安装

本插件以本地目录 / GitHub 仓库形式安装，**不发布到 npm**（`package.json` 保持 `private: true`）。

### 方式一：GitHub 安装（推荐）

```bash
# 在 DSH profile 目录下
cd ~/.dsh/profiles/<你的 profile>
pnpm add github:MarkTina/dsh-activity-heat
```

然后在 profile 的 `package.json` 的 `dsh.profile.bundles` 里追加：

```json
"@local/activity-heat"
```

**重启 DSH** 才会加载。刷新页面只重载界面，Host 的模块代际不会变；开关插件也不会重新读取改动过的文件。改过 `link:` 目录后必须完全退出 DSH 再启动。

### 方式二：本地目录

```bash
cd ~/.dsh/profiles/<你的 profile>
pnpm add link:/绝对路径/dsh-activity-heat
```

同样把 `@local/activity-heat` 加进 `dsh.profile.bundles`。

## 快捷键

默认 **`Ctrl + Alt + H`**（macOS 为 `Cmd + Alt + H`），切换到「最近活跃会话」面板；面板已打开时再按一次，回到进入前所在的会话——面板不替换当前会话，所以是一次往返切换。

可在 **设置 → 快捷键** 搜「最近活跃」修改。

> **为什么不是 `Ctrl+H`？** 宿主把 `Ctrl` + `C/V/X/Z/Y/Q/H` 列为系统保留键（浏览器历史记录等），单独按会被判定为 `reserved` 并拒绝注册。加上 `alt` 后走 web 白名单分支才合法。同理，插件**刻意不声明 Linux profile**——Linux 下 `alt+control` 会被判保留键，声明它会导致整次注册失败。Linux 用户可在设置页自行绑定。

## 配置

默认值在 `cordis.patch.yml`。覆盖时在 profile 的 `cordis.patch.yml` 里加同名 id 的行（**config 是整体替换，不深合并，需写全字段**）：

```yaml
- id: activity-heat
  config:
    hotMinutes: 10        # 炽热窗口（分钟）
    warmMinutes: 60       # 温热
    activeMinutes: 360    # 活跃
    recentMinutes: 1440   # 近期
    staleDays: 7          # 陈旧（超过即不再显示）
    topCount: 8           # 面板默认展示条数
    tickSeconds: 60       # 热度衰减刷新间隔
    showRowDots: true     # 是否在会话行首显示热度点
    showHoverHeat: true   # 是否在悬停卡显示热度段
```

## 数据来源

全部读取宿主**公开快照**，不碰私有 API，不写会话日志：

| 用途 | 来源 |
|---|---|
| 最近活动时间 | `sessions.list.byId[id].updatedAt`（与侧栏行尾时间同源） |
| 标题 / 草稿 / 子代理 / 归档 | 同上的 `title` `blank` `origin` 与 `workspaces.list.archivedSessionIds` |
| 工作区归属 | `workspaces.list.items[].sessionIds`（与宿主 `groupByWorkspace` 同一映射） |
| 轮次 | `sessions.list.projectionsBySession[id].values.sessionStats.turns`——与 composer 活动胶囊同源 |
| tokens | `…values.tokenUsage`——计费输入（`uncachedInputTokens + cacheReadTokens + cacheWriteTokens`）加 `outputTokens`，与 composer 用量胶囊同源的整段日志总量 |
| 缓存命中率 | `…values.tokenUsage.cacheReadTokens / 计费输入`，沿用宿主的取整规则（非满命中不会显示成 100%） |
| 上下文占比 | `…values.contextPressure`——`projectedTokens ?? pressureTokens` 除以 `contextWindow`，与 composer 上下文环同源 |
| 最近提示词 | `…values.contextTimeline`（`initialPrompt` / `lastUser` / `lastReply`）——状态栏不展示提示词 |
| 累计时长与耗时分布 | `…values.contextTimeline.timing`（`wallMs` / `ttftMs` / `genMs` / `toolsMs` 及生成段细分）——与宿主耗时统计同源同口径 |
| 运行状态 | `sessions.list.byId[id].running` |

**排除**：已归档会话、subagent 子会话、空白草稿会话。

## 仓库结构

按 DSH bundle 规范组织：一个 Host 入口、一个 Web 客户端入口、一个 loader patch，以及导出的展示资源。

```
dsh-activity-heat/
├── index.js            Host 半侧——只负责挂载包，不注册 Host 服务
├── client.js           Web 半侧——ModuleLoader factory、slots、locale
├── cordis.patch.yml    Bundle patch——插入 activity-heat 行与默认配置
├── locale/
│   ├── zh.json         插件元数据 + UI 字典（中文）
│   └── en.json         插件元数据 + UI 字典（英文）
├── icon.svg            插件图标（以 ./icon 导出）
├── assets/
│   └── active.png      运行中徽标的鲸尾标识（内联进 client.js）
├── test/               免依赖自检，用 node 直接运行
├── package.json        清单——dsh.bundle.patch、dsh.client、exports、files
├── README.md           英文 README
├── README.zh.md        本文件
├── CHANGELOG.md
└── LICENSE
```

界面文案统一走宿主的 **Client locale 服务**（`ctx.locale`），服务不可用时回退到随包的中文字典。两份 locale JSON 与内联字典共用同一套键，`node test/locale.cjs` 负责校验它们保持一致。

## 调试

正式版**不输出任何日志**。排查时把 `client.js` 顶部的开关改成 `true`，刷新页面即可看到完整链路日志：

```js
var ACTIVITY_HEAT_DEBUG = false;   // ← 改成 true
```

## 自检

仓库自带纯逻辑测试，用最小 React 替身加载**真实的 `client.js`**，不需要浏览器：

```bash
node test/panel.cjs        # 注册 / 排序 / 过滤 / 渲染 / 点击跳转
node test/shortcut.cjs     # 快捷键绑定是否符合宿主保留键规则
node test/boot-timing.cjs  # 重启时序：slots 晚就绪时能否恢复
node test/locale.cjs       # locale 字典与元数据是否同步
node test/assets.cjs       # 内联鲸尾图与 assets/active.png 是否一致
```

`pnpm test` 会依次跑完这四项。

## 已知限制

- 轮次、tokens、缓存命中率与上下文占比读 `sessionStats`、`tokenUsage`、`contextPressure`——与 composer 底部状态栏同源，数字完全对得上。只提供 `contextTimeline` 的旧 profile 会回退到它的字段，此时数字可能与状态栏不同。
- 快捷键不声明 Linux 默认值，Linux 用户需在设置页自行绑定。

## 许可

[MIT](LICENSE)
