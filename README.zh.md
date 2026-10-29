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
| **会话标题** | 标题文字前一个小圆点：实心=温热/炽热，空心=活跃及更冷；冷会话是灰色，越热越蓝；活跃会话圆点轻微脉冲；超过 7 天不显示。行首格留给原生状态点与定时任务时钟 |
| **会话悬停卡** | `热度 4/5 · 温热`、`最后活动：40 分钟前`、`所在工作区「X」正热`；完成但没看过时多一个绿色「已完成」 |
| **中央面板** | 会话 / 工作区两个视图切换，各带热度筛选与数量选择 |

### 面板细节

- **顶层切换**：`会话 58` / `工作区 10`，不再是上下混排
- **顶部两级**：面板不再显示标题，视图切换（实底胶囊）直接打头／热度文字 tab（选中带下划线）／数量（淡文字「条数」）
- **数量可选**：会话 `10 / 20 / 30 / 50`，工作区 `5 / 10 / 20`
- **热度筛选**：全部 / 炽热 / 温热 / 活跃 / 近期 / 陈旧（带实时计数）
- **每张卡片**：底部按三组信息排布，组间用细竖线隔开——① 缓存命中率、上下文占比（各带迷你进度条）② 轮次、步数、tokens ③ 累计对话时长；组内用圆点分隔。「当前」是标题前的徽章，相对时间在右侧列，不占底部信息行。
- **已完成 · 未查看**：agent 跑完但还没看过的会话，卡片右侧显示绿色鲸尾 +「已完成」（与蓝色的「工作中」同一只鲸，一动一静）；打开会话即消失
- **等待回答**：agent 提问后还没回答的会话，卡片右侧显示**琥珀色鲸尾 +「等待回答」**，优先级高于「已完成」和「工作中」（数据来自宿主的 `userQuestions` 投影）
- **Token 明细**：悬浮 tokens 数值会展开明细卡——精确总量、缓存命中率、未缓存输入、缓存读取、缓存写入（非 0 时）与输出，与宿主的「Token 用量」弹窗同口径
- **耗时分布**：悬浮累计对话时长会展开小卡片——活跃时长、等待/思考/回复/工具参数/工具执行/其他的环形图、图例与按比例铺排的时间轴，数据来自 `contextTimeline.timing`，分段口径与宿主的耗时统计一致；浮层通过 portal 挂到 `document.body`，不会被滚动列表裁剪
- **右侧信息列**：固定 168px，自上而下是工作区名、热度计（含档位）、相对时间，多行之间不会错位
- **统一图标语言**：五个指标共用 12px 描边图标，全部取自 `currentColor`——不再有彩色 emoji
- **长列表可滚动**：列表限高，上下留 12px 让首尾卡片的呼吸光晕不被裁掉，块级布局（30–50 条也保持完整高度，不会被压扁），隐藏原生滚动条，右侧用浮动的 `⌃⌄` 提示还能上下滑
- **点击即跳转**：会话行打开该会话，工作区行打开该工作区
- **排序**：运行中的会话优先，其余按最后活动时间倒序；工作区视图先看「有没有会话在跑」，再按热度与时间

### 右键菜单

会话卡片上右键（或聚焦后按 `Shift+F10` / 菜单键）打开动作菜单：

| 动作 | 说明 |
|---|---|
| 打开会话 | 与单击一致 |
| 在终端中打开 | 用系统终端打开当前会话 / 工作区目录：Windows 依次尝试 Windows Terminal → PowerShell 7 → Windows PowerShell；macOS 用 Terminal；Linux 用 x-terminal-emulator |
| 在其他应用中打开… | 悬停自动展开二级菜单，第一项固定「在终端中打开」；其余列出宿主检测到的文件管理器 / 编辑器 / 终端 / Git 客户端，点选后在对应应用中打开当前会话的工作目录 |
| 复制会话 ID / 标题 / 最近提示词 / 工作目录 | 最近提示词取完整原文；剪贴板不可用时提示失败 |
| 置顶 / 取消置顶 | 写宿主侧栏顺序，本面板仍按热度排序 |
| 重命名… | 预填当前标题，空标题不可保存 |
| 分叉会话 | 在最后一个已完成轮次处创建分支，不导航 |
| 下载会话日志 | 走宿主的 `api/session.export`，未挂载导出包时提示不可用 |
| 归档会话 | 二次确认；运行中的会话禁用；成功后 6 秒内可撤销 |

工作区卡片另有：打开工作区、在其他应用中打开…、在工作区中新开会话、复制工作区名称 / 路径。未分组卡片没有可执行动作，不响应右键。

菜单通过 portal 挂到 `document.body`，不会被滚动列表裁剪；方向键 + 回车可完成全部操作，`Esc` 或点击外部关闭，焦点回到原卡片。

### 正在运行的会话有专属标识

`session.running === true` 的卡片会获得：

- 卡片右侧留白处的**鲸尾 + 「工作中」**标识——鲸尾是 12 帧 GIF，靠自己的帧序列循环播放（不套 CSS 晃动），高度 28px
- 卡片外边框**环绕跑马灯光带**（`conic-gradient` 旋转，2.2s 一圈）
- 外层**呼吸外发光**（2.4s 一次）
- 外框常驻一圈**浅蓝细边框**：呼吸灯只调外发光，最淡的一刻边界仍然可见
- **热度按运行状态提升**：宿主的 `updatedAt` 只在轮次边界刷新，长任务运行中不会更新；所以运行中的会话一律按 5/5（炽热）计并排在列表最前，右侧仍显示真实的「最后活动」时间，悬停卡把热度文案写成「工作中」
- **行首标识完全交给宿主**：运行/待处理画原生 `StateDot`，有定时任务画时钟标记。插件不在行首放任何东西，热度只体现在标题前的小圆点

**工作区卡片**同理：只要该工作区里有任意一个会话正在运行，就显示同一套标识——同样的鲸尾「工作中」、同样的环绕跑马灯、同样的呼吸外发光，所以工作区视图里也能一眼看到活着的任务。

工作区卡片还会汇总所有**可加总**的指标：会话数、轮次、步数、tokens、累计对话时长；缓存命中率按该工作区的计费桶加权（不是百分比平均），上下文占比取最紧张的那个会话。不可汇总的内容——提示词、当前会话标记——不会带过来。

### 已完成但还没看的会话

`agent` 跑完、且用户还没打开过的会话，卡片右侧会出现**绿色鲸尾 +「已完成」**（静止矢量 + 3.2s 轻微呼吸）。它和「工作中」是同一只鲸尾——工作中是蓝色 GIF（动），已完成是绿色静止版（静），语义与视觉都成对。标记为已完成时**不再套运行中的跑马灯**，避免"已完成"外面还转着一圈光：

- **判定**：不是当前选中的会话、`updatedAt` 晚于本地查看水位，且**这一轮已结束**——`running === false`，或 `running` 仍为 true 但已 60 秒没有任何新活动（宿主有时会晚一拍才把 running 置回 false）；
- **当前会话**：用宿主侧栏选中行的 `_selected` 类判断，**不用** `retainedBy.mainView`——它是引用计数，会同时保留多个会话的引用，之前「当前」标在非当前会话上就是这个原因；
- **水位**：插件首次运行之前的历史会话自动视为已读，不会一装插件就满屏「已完成」；点击卡片、或从侧栏切过去（该行变成选中）即清零；
- **存储**：水位写在 `localStorage`（`activity-heat.seen.v1`），刷新后有效；Web 版每次启动端口会变、`localStorage` 换 origin 会整份丢失，这时退回「最近 30 分钟内结束的才算刚完成」的兜底；
- **边界**：宿主的 `SessionSummary` 没有未读字段，这是插件自己的判定；工作区卡片暂不显示该状态。

**等待回答**是第三种状态：宿主的 `userQuestions` 投影里 `active` 非空（agent 提了问、你还没答）时，卡片右侧换成**琥珀色鲸尾 +「等待回答」**。它优先于「已完成」和「工作中」，同样不套跑马灯；问题回答后自动消失。三种状态是同一只鲸尾，颜色区分：蓝=工作中、绿=已完成、琥珀=等待回答。

> 尊重 `prefers-reduced-motion`：系统开启减少动态效果时，动画自动静止。

## 0.4–0.5 新增：不止一个面板

- **五态状态**：等待审批 / 计划待审 / 等待回答（`pendingInteraction.kind`），同为琥珀色鲸尾，优先级高于已完成与工作中。
- **范围视图**：会话视图顶部可切「常规 / 已归档 / 子代理」；归档行可直接恢复，子代理行归属父会话。
- **两处轻量入口**：折叠态徽章（需关注会话数）与侧栏「更多」菜单——不打开面板也能进入最近活跃。会话头角落位归 ui-sidebar-right 的右侧栏按钮所有，本插件不再争用。
- **底部活动条**：有运行中 / 等待处理会话时出现，点一下直达；没有活动时不占高度。
- **批量操作**：会话视图「选择」→ 归档所选 / 置顶所选 / 复制 ID；运行中会话走「停止并归档」。
- **侧栏原生行动作**：会话行「…」菜单新增 在终端中打开 / 复制标题 / 复制工作目录 / 下载日志；行尾悬停另有终端按钮。这些动作与面板共用同一张动作目录（`SESSION_ACTION_DEFS`）。
- **停止并归档**：运行中的会话不再只是禁用归档；确认框会列出仍在跑的回合 / 子代理 / 后台任务 / 定时提醒，确认后以 `stopActivity` 停止并归档（停止不可逆）。
- **右侧栏常驻**：右侧栏引导页选「最近活跃会话」即可把列表停靠在右栏。
- **`/heat` 命令**：输入 `/heat` 直接打开面板。

## 视觉与动效

表面质感只走宿主主题令牌 + `color-mix`，**不写死色值**，明暗主题自动适配：

```css
--color-blue-500             /* 热度主色（蓝色，回退 #3b82f6） */
--dsw-alias-bg-base          /* 运行中卡片的不透明底（遮住跑马灯光带） */
--dsw-specific-menu          /* 玻璃表面：宿主半透明菜单底（浅 #f8f9fa94 / 深 #43454a73） */
--dsw-menu-backdrop-filter   /* 背景磨砂：blur(40px) saturate(150%) */
--dsw-alias-label-primary    /* 主文字 */
--dsw-alias-label-secondary  /* 次要文字 */
--dsw-alias-border-l1        /* 分隔、轨道与玻璃描边 */
--dsw-alias-state-success-primary /* 已完成（未查看）的绿色 */
--ds-ease-in-out             /* 统一缓动曲线 */
```

三层结构：

1. **透明**：卡片、徽章、数量选择、筛选下划线都用半透明底（`color-mix(..., 70%, bg-base)`），叠在面板底色上，边缘是 1px 高光 + 发丝渐变描边；
2. **磨砂**：面板本身**不加任何背景渐变**，玻璃直接叠在宿主底色上；卡片悬停时淡入一层 `backdrop-filter`，悬浮浮层直接用宿主的 `--dsw-menu-backdrop-filter`；
3. **渐变**：迷你进度条、选中态、运行中跑马灯、热度竖条都是渐变。

热度只用 **三区间：浅灰 → 深灰 → 亮蓝**（`HEAT_TONES`）——浅灰对应冷却/陈旧/近期，深灰对应活跃，亮蓝对应温热/炽热。竖条**整条保持区间色**，只在顶部用同色 + 白提亮（`heatBarSurface`），再叠 1px 内高光与发丝玻璃边缘（`heatBarShadow`）——所以它像一根被打亮的玻璃条，下半段也不会融进白底。灰档用中性 `label` 令牌，浅色主题读作浅灰、深色主题读作暗灰，不需要按主题写两套。

动效（全部在 `prefers-reduced-motion: reduce` 下关闭）：

- **切换**：面板出现、视图/筛选/数量变化时列表淡入，卡片按 `min(index, 8) × 20ms` 错峰；筛选下划线用 `scaleX` 从左生长；分段控件的底色平滑过渡；
- **悬停**：卡片上浮 1px + 柔和外发光，同时磨砂层淡入；按下轻微回弹；指标芯片浮出淡蓝胶囊底；热度条与热度计的光晕增强。**没有一闪而过的扫光**；
- **悬浮卡**：170ms 上浮淡入、130ms 反向退场（方向跟着上翻/下翻走）；耗时卡的环形图旋转归位，时间轴各段依次生长；
- **侧栏**：标题圆点改为径向渐变 + 柔光，所在行悬停时外扩一圈 3px 光环；入口环改 `conic-gradient`，悬停轻微提亮。

性能取舍：静态卡片**不做** `backdrop-filter`（50 条列表也不会掉帧），只有悬停的那一张和浮层真正磨砂；列表上下用渐变遮罩而不是 `mask`，避免破坏子元素的磨砂层。

## 安装

本插件以本地目录 / GitHub 仓库形式安装，**不发布到 npm**（`package.json` 保持 `private: true`）。

### 方式一：GitHub 安装（推荐）

```bash
# 在 DSH profile 目录下
cd ~/.dsh/profiles/<你的 profile>
pnpm add github:MarkTina/dsh-activity-heat#v0.5.3
```

建议**锁定 tag**（`#v0.5.3`）而不是跟随 `main`，这样仓库上后续的无关提交不会改变你实际运行的代码。升级时换 tag 再重启即可。

仓库必须是**公开**的；私有仓库需要先配好 token（`https://<token>@github.com/...`）或 SSH remote，`pnpm add` 才能拉取。

然后在 profile 的 `package.json` 的 `dsh.profile.bundles` 里追加：

```json
"@local/activity-heat"
```

**首次安装**通常会由宿主的 HMR 直接激活；如果列表里没出现，重启一次 DSH。**更新已安装的副本**（同路径、文件变了）则必须完全退出再启动：刷新页面只重载界面，开关插件也不会重新读取改动过的模块。

> Desktop profile 由 Electron 应用独占管理。请通过应用内的插件管理（GitHub / 本地目录）安装，不要在 `~/.dsh/profiles/desktop` 里直接跑 `pnpm`——那个目录归应用所有，手改会被拒绝或覆盖。

### 方式二：本地目录

```bash
cd ~/.dsh/profiles/<你的 profile>
pnpm add link:/绝对路径/dsh-activity-heat
```

同样把 `@local/activity-heat` 加进 `dsh.profile.bundles`。

## 快捷键

默认 **`Ctrl + Alt + H`**（macOS 为 `Cmd + Alt + H`），切换到「最近活跃会话」面板；面板已打开时再按一次，回到进入前所在的会话——面板不替换当前会话，所以是一次往返切换。

可在 **设置 → 快捷键** 搜「最近活跃」修改。

也可以输入 **`/heat`** 直接打开面板（宿主挂载命令服务时可用）。

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
    showRowDots: true     # 是否在会话标题前显示热度圆点
    showHoverHeat: true   # 是否在悬停卡显示热度段
```

## 数据来源

全部读取宿主**公开快照**，不碰私有 API，不写会话日志：

| 用途 | 来源 |
|---|---|
| 最近活动时间 | `sessions.list.byId[id].updatedAt`（与侧栏行尾时间同源） |
| 标题 / 草稿 / 子代理 / 归档 | 同上的 `title` `blank` `origin` 与 `workspaces.list.archivedSessionIds` |
| 工作区归属 | `workspaces.list.items[].sessionIds`（与宿主 `groupByWorkspace` 同一映射） |
| 轮次 / 步数 | `sessions.list.projectionsBySession[id].values.sessionStats.turns` / `.steps`——与 composer 活动胶囊同源 |
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
├── index.js            Host 半侧——open-terminal 路由（启动系统终端），其余只负责挂载
├── client.js           Web 半侧——ModuleLoader factory、slots、locale
├── design.md           视觉与交互纲领——改 UI 前必读的红线与偏差记录
├── cordis.patch.yml    Bundle patch——插入 activity-heat 行与默认配置
├── locale/
│   ├── zh.json         插件元数据 + UI 字典（中文）
│   └── en.json         插件元数据 + UI 字典（英文）
├── icon.svg            插件图标（以 ./icon 导出）
├── assets/
│   ├── active.gif      鲸尾动图（内联进 client.js）
│   └── active.png      动图的静态源帧
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
node test/menu.cjs         # 右键菜单：动作、确认框、导出探测、服务降级
node test/shortcut.cjs     # 快捷键绑定是否符合宿主保留键规则
node test/boot-timing.cjs  # 重启时序：slots 晚就绪时能否恢复
node test/locale.cjs       # locale 字典与元数据是否同步
node test/assets.cjs       # 内联鲸尾图与 assets/active.png 是否一致
```

`npm test` 会依次跑完这六项。

## 已知限制

- 轮次、tokens、缓存命中率与上下文占比读 `sessionStats`、`tokenUsage`、`contextPressure`——与 composer 底部状态栏同源，数字完全对得上。只提供 `contextTimeline` 的旧 profile 会回退到它的字段，此时数字可能与状态栏不同。
- 快捷键不声明 Linux 默认值，Linux 用户需在设置页自行绑定。
- 右键菜单**不提供删除会话**：宿主只支持归档，没有删除入口；归档后可在侧栏的已归档会话里恢复。
- 运行中的会话归档菜单变为「停止并归档…」：确认框会列出仍在跑的回合 / 子代理 / 后台任务 / 定时提醒，确认后先停止它们（不可逆）再归档；归档成功后本面板按热度重新排布。
- 「下载会话日志」依赖宿主挂载 `dsh-session-log-export`；未挂载时点击只提示不可用，不会打开 404 页面。
- 宿主侧栏原生会话行没有右键事件，但提供 `sidebar.workspaces.session.menu.item` / `.row.action` 两个扩展席位；本插件的终端 / 复制 / 下载动作挂在这里，置顶 / 重命名 / 分叉 / 归档仍用宿主自带项，中央面板卡片右键保留全部动作。
- `updatedAt` 是宿主「最后一次活动」快照，运行中的会话不会随工具步骤/流式输出实时刷新；面板因此把运行中视为最高热度，但这不代表它刚刚有新消息。
- 「在其他应用中打开」依赖宿主挂载 `dsh-host-open-in-app`（`/open-in-app/apps` 与 `/open-in-app/open`）；未挂载、SSH 部署或目录不存在时菜单项禁用或提示失败。可用应用由宿主在启动时探测，新装应用需重启 DSH 才出现。
- 终端只列终端模拟器（Windows Terminal / Terminal / iTerm2 / Warp 等）；Git Bash 这类 shell 不算「终端」，不会出现在列表里。
- 「在终端中打开」由插件自己的 Host 路由 `POST /activity-heat/open-terminal` 实现，不依赖 `open-in-app` 应用目录；Windows 依次尝试 Windows Terminal → PowerShell 7 → Windows PowerShell，均不可用时提示失败。

- 等待审批 / 计划待审依赖宿主的 `pendingInteraction`；旧宿主只提供 `userQuestions`，两者会统一显示为「等待回答」。
- 右侧栏常驻面板与 `/heat` 命令依赖宿主挂载 `sidebarRightTabs` / `commandUi`；未挂载时对应入口不出现，不影响其他功能。
- 批量归档运行中的会话走 `stopActivity`，停止不可逆。

## 许可

[MIT](LICENSE)
