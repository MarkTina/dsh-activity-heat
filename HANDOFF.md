# HANDOFF.md — dsh-activity-heat 连续性记录

> 新会话冷启动先读本文件。每次项目内容更新后，同步维护「当前现状与限制 / 待处理事项 / 决策记录」中相关部分。

## 项目心智模型

DSH（DeepSeek Harness）Web 插件「会话热度」：按「距最后一次活动的时间」计算热度，用侧栏入口、标题前热度圆点、悬停卡热度区标记最近活跃的会话与工作区。核心抽象是「热度（recency 分档）→ 视觉标识」，数据源取宿主 `sessionStats` / `tokenUsage` / `contextPressure` / `useSessionStatus`。边界：Host 半侧仅 `index.js` 一条 open-terminal 路由（启动系统终端），其余逻辑全在 `client.js`（手写浏览器模块，无构建步骤）。

## 设计原则

- **factory 永不抛错**：`__ModuleLoader__.load` 内任何异常都会让整个插件不显示，异常一律吞掉并降级。
- **数字口径跟宿主状态栏**：轮次/步数用 `sessionStats`、tokens/缓存用 `tokenUsage`、上下文用 `contextPressure`。
- **不抢宿主 single 席位、不 require Harness Client 包、不声明插件级 `inject:['slots']`**（详见决策记录）。
- **视觉红线**以 [DESIGN.md](DESIGN.md) §2 为准；动效/颜色/布局不许破例，破例先改纲领再改代码；设计返工对照 [VETO-LIST.md](VETO-LIST.md)。
- **右键菜单 / 对话框 / 浮层一律 portal 到 `document.body`**，写操作逐项能力检测。

## 当前现状与限制

- 版本 **0.16.2**（2026-11-06），`pnpm test` 五项全绿。
- **0.16.2**：侧栏原生会话右键菜单从旧 `sidebar.workspaces.session.menu.item` 自绘项迁移到宿主 `contextMenus` 数据动作（UI 与原生同源），「在其他应用中打开…」用 `children` 成为原生二级级联（hover 展开、不再二次点击）；老宿主无该服务时回退旧自绘项（见 DR-20261106-14）。
- **0.16.1**：「在其他应用中打开」修复 Electron 类应用（VS Code 等）永远打不开的假成功——根因是宿主 `dsh-desktop-host` 进程自带 `ELECTRON_RUN_AS_NODE=1`，spawn 外部应用时被继承，目标应用以 Node 模式秒退、不开窗；`trySpawn` 现用 `launcherEnv()` 删除该变量（见 DR-20261106-13）。
- **0.16.0**：外部背景支持开关「启用外部背景」（`bgEnabled`，默认开）；关闭则不渲染背景、不加载脚本、回纯色底，并纳入 JSON 导入导出。
- **0.15.1**：移除会话卡最左「工作区书签 rail」独立淡底（`.ah-ws-tag` → `background:transparent`），与卡片主体融为一体；保留 1px 发丝分隔线。
- **0.15.0**：配置中心扩展——显示背景原地址链接；新增卡片间距/圆角/背景不透明度（`cardGap/cardRadius/bgOpacity`，CSS 变量 `--ah-card-gap/--ah-card-radius` 下发）；支持配置 **JSON 导入/导出**（`bgEmbed/scrimColor/scrimOpacity/scrimBlur/cardGap/cardRadius/bgOpacity`）。
- **0.14.0**：① 顶部右侧齿轮「背景与外观配置中心」：粘贴背景 embed 代码切换场景 + 中间层颜色/不透明度/模糊度，持久化到 localStorage（`bgEmbed/scrimColor/scrimOpacity/scrimBlur`）；② 背景与列表之间新增可配置中间层 `.ah-scrim`（颜色 + backdrop blur）；③ 背景脚本 `ensureEmbedScript` 按 src 只加载一次（缓存）；④ 修复切插件黑屏——embed.js 的 `:host{background:#000}` 用 `background:#f7f8fa !important` 覆盖。
- **0.13.0（实验）**：面板背景嵌入 kubai087/pro-threads 场景（`.ah-threads-bg` → `<pro-threads scene="mobius" palette="paper">`），CDN 加载 `embed.js`，`z-index:-2` / `pointer-events:none`；失败或 CSP 拦截退回纯色底。VETO D-005。依赖外网，离线无背景。
- **0.12.4**：列表 item 间距加大——会话卡 / 工作区卡 / 运行中卡外框底部间距由 8–10px 统一为 12px。
- **0.12.3**：按用户要求移除面板渐变流动背景（`.ah-shell::before` / `ah-bg-drift`），恢复**纯色底**（`--dsw-alias-bg-base`，浅色=白）；保持静态卡不挂 backdrop 的性能优化。VETO D-003（允许渐变背景）失效 → D-004（纯色底，禁自绘背景）。
- **0.12.2 热修**：上一步性能改动漏写 `@keyframes ah-bg-drift` 结束花括号 → 注入样式表后半段被吞，卡片玻璃/圆角/阴影、HeatRing 图标、背景渐变全失效（用户看到「UI 没了」）。已补齐，并新增「CSS 花括号平衡」自检断言；背景改为更明显浅蓝渐变（16%–26%）+16s transform 漂移。
- **0.12.1 性能**：静态卡片不挂 backdrop-filter、仅悬停单卡启用模糊/折射；背景改纯 transform 动画、去大面积 blur，修复列表滚动卡顿（DR-20261105-12）。
- **0.12.0 三项**：① 面板浅蓝渐变流动背景（`.ah-shell::before`，DESIGN §2 显式例外 / VETO D-003）；② 级联菜单安全三角区 + 220ms 开延时 / 80ms 复查 / 1200ms 安全窗口 / 360ms 关闭延时（手册 002）；③ 按钮按下整体下沉 1px（手册 001 子集）。详见 DR-20261105-11。
- **液态玻璃卡片（0.10.0 建，0.11.0 按设计手册精修）**：item 卡片（`.ah-card`，会话/工作区共用）七层液态玻璃；0.11.0 对齐手册 010（`rim=min(44,短边/3.5)`、偏移 `(1-d/rim)^2.6`、深色亮度 `.8`、文字 `plus-lighter` + `--ah-ink`、`@property`、`prefers-reduced-transparency`/`forced-colors`、密度守卫），并按手册 011/007/004 调整 easing、排版、4px 圆角 + 超椭圆。详见 DR-20261105-09/10 与 DESIGN §5。
- **「在其他应用中打开」已改为自研 Host 路由**（`index.js` 两条 `open-with` 路由 + `open-terminal`）：自己探测 Windows 注册表/macOS bundle，启动命令**带目标目录**，按真实成败 toast；面板与侧栏会话右键都能用（面板与侧栏均由 `contextMenus` 菜单服务注册，侧栏「在其他应用中打开…」为原生级联，见 DR-20261106-14；旧自绘浮层仅老宿主兜底）。这修复了之前「VS Code 提示打开成功其实没打开」。
- **性能批次已完成**：`buildModel` 走 `useMemo`（面板 / 右栏 / 悬停）、全局单例分钟 ticker、标题圆点样式 rAF 合并、`selectedSessionIds` 100ms 微缓存、全页共享 `ResizeObserver`、筛选计数单遍历、面板偏好持久化（`localStorage['activity-heat:prefs']`）。均不改 UI / 交互 / 视觉。
- **F4 已完成**：侧栏入口 HeatRing 右上角显示「已完成未查看」计数角标（0 隐藏、>99 显示 `99+`）；依赖宿主向 `sidebar.panellist` 注入 `useSessions/useWorkspaces/useSessionStatus`，缺失时降级为不显示（不影响图标）。
- 安装形态为 `link:`：**改完必须完全退出 DSH 再启动**，刷新页面 / 开关插件都不会重读模块。
- `client.js` 必须整体 **IIFE 包裹**：宿主把同 profile 多个插件 `client.js` 拼进同一脚本作用域，顶层函数名会互相覆盖（曾因 envhub 的 `build` 覆盖导致本插件永不 apply）。
- 折叠徽章能力已取消：`sidebar.toggle.badge` 是 single 席位，会被内置 `DesktopUpdateBadge` 占满同优先级而注册抛错、整插件加载失败。
- 底部活跃条挂 `shell.bottom`（single 席位，须 `priority:-1000` 才不被 inspector 覆盖）；不挂 `shell.overlay`（遮挡），也不挂 `conversation.composer.dock`（与宿主统计行重叠）。
- 鲸鱼 GIF 在 `prefers-reduced-motion: reduce` 下无法用 CSS 停（GIF 自动播放），只能隐藏。

## 演进方向

（暂无明确里程碑；以 CHANGELOG 版本演进为准。）

## 待处理事项

> 2026-11-05 用户决策：**S2/S3 结构重构暂不做（保留现状）**；**P6 卡片 memo 不做**；**F2/F3 暂不做**；**F4 已完成**（侧栏入口角标）。

1. （backlog）S2 拆 `ActivityPanel`、S3 数据层分域——需先决定是否引入 esbuild 构建。
2. （backlog）F2 热度算法可配置、F3 面板内搜索 + 排序切换。

## 决策记录

### DR-20261104-01：client.js 整体 IIFE 包裹

- **背景**：combo 把多个插件 `client.js` 拼进同一作用域，`dsh-envhub` 的同名 `build` 覆盖本插件，factory 实际调用别人的 build，本插件 apply 永不执行。
- **决策**：整个 `client.js` 用 IIFE 包裹，隔离全部顶层声明。
- **原因**：顶层函数名冲突是冷启动不加载的真根因（探针：`module-loaded → factory` 后无 apply）。
- **影响**：新增顶层代码须保持在 IIFE 内，禁止暴露全局函数名。
- **日期**：2026-11-04

### DR-20261104-02：不声明插件级 inject:['slots']

- **背景**：本 DSH 版本 profile 静态 client entry 在 slots 服务就绪前创建，声明 inject 会让 fiber 停在 pending、冷启动不 apply。
- **决策**：改用 `ctx.get('slots')` 轮询等待（`ctx.inject` 仅老宿主/测试兜底）。
- **原因**：避免冷启动 pending 不激活。
- **影响**：席位注册依赖轮询，不要再加插件级 `inject:['slots']`。
- **日期**：2026-11-04

### DR-20261104-03：统一使用 pnpm

- **背景**：包管理器不统一。
- **决策**：`package.json` 加 `packageManager: pnpm@11.28.5`，提交 `pnpm-lock.yaml`；命令统一 `pnpm test` / `pnpm doctor:install`。
- **原因**：锁版本、统一命令。
- **影响**：文档与新脚本一律用 pnpm，不用 npm。
- **日期**：2026-11-04

### DR-20261104-04：状态视觉改本地 StatusDot

- **背景**：官方规范禁止加载 Harness Client 包，且 `require('@deepseek-ai/dsh-client-ui-primitives')` 抛错会把整个 slot 条目打空。
- **决策**：状态点改本地 `StatusDot`，语义/数据对齐宿主 `useSessionStatus`；侧栏菜单 / 行按钮改自绘，全部用 `--dsw-alias-*` 主题令牌。
- **原因**：合规 + 避免抛错导致整条 slot 消失。
- **影响**：禁止 require 任何 Harness Client 包。
- **日期**：2026-11-04

### DR-20261103-05：移除 sidebar.toggle.badge 抢占

- **背景**：该席位是 single，被内置 `client-ui-settings-general` 的 `DesktopUpdateBadge` 以 priority 0 占用，同优先级重复注册抛错，中断 apply 链路致整插件消失。
- **决策**：移除该注册，折叠徽章能力取消（入口保留侧栏「更多」菜单与 `/heat`）。
- **原因**：single 席位冲突会导致整插件不加载。
- **影响**：不要再往 single 席位抢注册；确需覆盖用更低 priority。
- **日期**：2026-11-03

### DR-20261103-06：底部活跃条用 shell.bottom（priority -1000）

- **背景**：`shell.bottom` 是 single，被内置 `dsh-experimental-inspector` 以 priority 0 占用；`shell.overlay` 会遮挡，`conversation.composer.dock` 与宿主统计行重叠。
- **决策**：挂 `shell.bottom` 并显式 `priority: -1000`，延迟注册抢占。
- **原因**：「数值最低者渲染」规则下更低 priority 才能安全 shadow。
- **影响**：仍仅「运行中/等待」时出现；改席位前先确认不遮挡。
- **日期**：2026-11-03

### DR-20261105-07：性能批次优先做「输出不变」的渲染优化

- **背景**：审查发现 4 个常驻视图各自无缓存全量建模、侧栏每行一个 60s 定时器、零 `React.memo`。
- **决策**：先做不改渲染树 / 交互的优化（`useMemo` 缓存、全局 ticker、rAF 合并、共享 ResizeObserver、计数单遍历、偏好持久化），全部以 `pnpm test` 五项绿为门槛；重构类（S2/S3）与新增 UI（F2/F3/F4）另立并先确认。
- **原因**：228 条渲染断言 + 极简 React 替身，任何可观测输出变化都会破坏验收；低风险项可立刻见效。
- **影响**：新增 `React.useMemo/useCallback/useRef` 使用须同步增强测试替身（已做）；无 storage 时 `savePrefs` 不写内存缓存，避免偏好跨测试场景泄漏。
- **日期**：2026-11-05

### DR-20261105-08：open-with 改为自研 Host 路由 + 侧栏浮层

- **背景**：用户实测「VS Code 打开不生效，toast 说成功其实没打开」。根因是宿主 `open-in-app` catalog 的 `vscode` 启动参数缺 `{path}`，且路由仍回 200。用户要求自己识别本机能打开工程的软件、二级菜单选择、按路径正确打开。
- **决策**：`index.js` 新增 `GET /activity-heat/open-with/apps`（探测）与 `POST /activity-heat/open-with/open`（带路径 spawn、真实成败）；`client.js` 的 `buildOpenWithMenuItems` 面板子菜单与侧栏浮层共用；侧栏入口用**模块级 store + 常驻 HeatRing 宿主**渲染自绘浮层，绕开「宿主菜单关闭即卸载 slot 组件」。旧 `open-in-app` 路由仅作 apps 探测的兜底。
- **原因**：打开类动作的正确性必须由我们自己保证（命令带目录 + 真实返回码），不能再依赖宿主 catalog 的缺参实现。
- **影响**：`PITFALLS.md §12` 旧「复用宿主 open-in-app」结论已被 D-002 覆盖；新增 `wsl`/`gitbash` 进打开列表；测试侧栏动作数 4→5。
- **日期**：2026-11-05

### DR-20261105-09：item 卡片改液态玻璃材质

- **背景**：用户要求把活跃对话的 item 卡片做成液态玻璃，并给了七层规格与推荐参数（浅色白 6–22% / blur2 / sat180 / bright1.06；深色 rgb(20,20,24) 16–38% / sat160 / bright0.8；折射边宽 44px、偏移 1.1×、色散 ±15%）。
- **决策**：`.ah-card`（会话/工作区共用）套七层玻璃；浏览器侧 `glassBuildMap` 生成「边缘内压」位移贴图，`glassEnsureFilter` 注入 SVG `feDisplacementMap` 三通道（R/B 差 ±15% 做色散，`feBlend screen` 合成），仅 `CSS.supports('backdrop-filter','url(#a)')` 为真时启用；`glassSampleBackdrop` 用 `elementsFromPoint` 采样多点亮度/方差切浅/深玻璃并调着色透明度。纯 CSS 兜底保证无 JS 也有基础玻璃。运行中卡片不套玻璃。
- **原因**：真实 Chromium（DSH Web=Electron）支持 `backdrop-filter:url()`，可实现真实折射；但 Safari/Firefox 不支持，必须探测降级；测试沙箱无 DOM/canvas，必须 try/catch 静默。
- **影响**：三处与字面需求的偏差（深色文字 overlay→screen；亮度阈值改「保对比」映射；边宽按尺寸收敛）已记入 VETO-LIST 附录 A。新增 `glassDecorate` 依赖 `ResizeObserver`/`MutationObserver`，缺失时安全降级。性能：每张卡一个 backdrop 合成层 + 每尺寸一个 filter；默认 10 张无压力，50 张需留意。
- **日期**：2026-11-05

### DR-20261105-10：按设计手册做质感整改（010 / 011 / 007 / 004）

- **背景**：用户给出《999 个小技巧，让你 Vibe 的产品更有质感》设计手册，要求对照现有插件梳理可改点并整改。
- **决策**：010 液态玻璃全量对齐手册（rim `min(44,短边/3.5)`、偏移 `^2.6`、深色亮度 `.8`、文字 `plus-lighter`+`--ah-ink`、`@property`、无障碍回退、密度守卫）；011 新增 `--ah-ease-out/-in/-overshoot` 按用途分曲线；004 圆角 4px 网格 + `corner-shape:superellipse` 渐进增强；007 标题 `text-wrap:balance`。003/005/006/008 判定不适用。P2（002 级联菜单安全三角区、001 按钮按压子集、009 浮层选型）本次未做，列为待确认。
- **原因**：手册是通用产品建议，需甄别与本项目 DESIGN 红线 / 现有功能的冲突，避免为「照做」破坏可读性与既有视觉语言。
- **影响**：唯一实质偏离是手册 010 第 7 条「<0.5 切浅色」——纯白/纯黑主题会产生反相卡，改为保对比同向映射并记入 VETO；`plus-lighter` 需 Chromium（DSH Web 满足）。`test/panel.cjs` 新增 7 条材质断言。
- **日期**：2026-11-05

### DR-20261105-11：面板流动背景 / 级联菜单安全三角 / 按钮按压

- **背景**：用户要求 ① 加浅色渐变流动背景以便看出玻璃质感；② 实现级联菜单安全三角区；③ 做按钮按压手感。
- **决策**：① `.ah-shell::before` 低饱和浅蓝光斑 30s 漂移（蓝 ≤16%、blur 26px、`z-index:-1`、reduced-motion 停），作为 DESIGN §2「面板不自绘背景」的显式例外（VETO D-003）；② `ContextMenu` 加安全三角（上一刻指针→子菜单近边两角）+ 220ms 开延时 + 80ms/1200ms 安全窗口 + 360ms 关闭延时，触摸立即，保留键盘/ARIA；③ 控件/菜单/对话框/批量按钮 `:active` 下沉 1px。
- **原因**：纯白底 backdrop-filter 无可模糊内容、玻璃不可见；级联菜单斜移易误触；按压反馈提升可操作感。
- **影响**：面板背景为唯一自绘例外（已记 VETO；旧「面板不自绘背景」结论不再对面板整体生效，仅限此例外）；级联菜单改 hover 行为，`test/menu.cjs` 不模拟 hover 故无需改；新增面板断言（背景层/流动/按压/安全三角）。后续修正：`.ah-shell` 撑满高度使背景全覆盖；背景双驱动流动更明显；运行中/活跃卡也改玻璃、跑马灯用环形 mask 只描边框。
- **日期**：2026-11-05

### DR-20261105-12：修复会话列表滚动卡顿（性能）

- **背景**：用户反馈会话列表「卡卡的」。
- **决策**：静态卡片不再挂 `backdrop-filter`（保留着色+边缘+投影，背景自绘平滑渐变），**仅悬停单卡**启用 `blur+折射`；面板背景改纯 `transform` 合成动画、移除 `background-position` 动画与 26px 大面积 `blur`。
- **原因**：每卡常驻 `backdrop-filter … url(#svg)`（三重 feDisplacementMap）+ 背景持续动画导致每卡每帧重采样 + 大面积 blur 每帧重算；这是滚动卡顿主因。
- **影响**：静态/滚动无卡片 backdrop 合成层；视觉上靠着色+边缘+投影仍呈玻璃；需要真玻璃模糊时悬停即得。后续若仍卡，优先查 RunningFrame 鲸鱼 GIF 数量与 `mix-blend-mode` 混合层。
- **日期**：2026-11-05

### DR-20261106-13：启动外部应用时清除 ELECTRON_RUN_AS_NODE

- **背景**：用户实测「在其他应用中打开」在 VS Code 中一次都没打开成功，toast 却时成时败。排查发现本插件运行在 `dsh-desktop-host`（进程命令 `DeepSeek Harness.exe --expose-internals .../dsh-desktop-host/lib/index.js`，监听 Web 端口），该进程环境含 `ELECTRON_RUN_AS_NODE=1`（Electron 当 Node 用）；对照 GUI 主进程 32548 则不含。
- **根因**：`index.js` 的 `trySpawn` 用默认 `process.env` spawn `Code.exe <dir>`，子进程继承 `ELECTRON_RUN_AS_NODE=1` → Code.exe 以 Node 模式把目录当脚本、约 64ms 报错退出、不开窗口；但 Node 的 `spawn` 事件已触发 → 路由回 200 → 前端 toast 假成功。对照实测：保留变量时 Code 进程数 0、64ms 退出；删除后 Code 进程数 0→9、窗口正常打开。
- **决策**：`trySpawn` 显式传 `env: launcherEnv()`（复制 `process.env` 后 `delete ELECTRON_RUN_AS_NODE`）；open-with 与 open-terminal 共用，非 Electron 应用无副作用。
- **影响**：任何「从插件启动外部进程」都必须走 `trySpawn`/`launcherEnv`，禁止直接 `spawn` 继承默认 env；若宿主再引入污染 GUI 子进程的变量，也在 `launcherEnv` 统一剔除。
- **日期**：2026-11-06

### DR-20261106-14：侧栏会话菜单迁移到宿主 contextMenus（原生 UI + 原生级联）

- **背景**：用户指出侧栏会话右键里插件注册的动作项 UI 与原生菜单项不一致（图标/字号/高度/间距/hover 对不上），且「在其他应用中打开…」是点击后关菜单再弹自绘浮层（二次点击），要求改成悬停级联。
- **决策**：`client.js` 新增 `installSessionMenu`：`ctx.get('contextMenus')` 可用时调用 `ctx.contextMenus.register({ id:'activity-heat.session', target:'session', order:510, resolve })`，由宿主同一套 Menu 渲染 5 个动作（terminal / open-with / copy-title / copy-cwd / download，顺序落在内置 reveal(500) 与 archive(600) 之间）；`open-with` 用 `children` 数组，宿主 `menuEntries` 自动转成原生 `submenu`。图标经 `contextMenu.icon` keyed slot 注册（复用内联 SVG，**不 require 任何 Harness Client 包**）。老宿主无该服务时回退旧自绘项（二选一，不重复注册）。
- **原因**：宿主 `contextMenus` 是官方推荐的结构化菜单贡献方式，UI 与内置项同源，且天然支持 `children` 级联；旧插槽是组件贡献，只能自绘、无法原生级联。
- **影响**：打开动作仍走自研 Host 路由并按真实返回码提示（VETO D-002）；`test/panel.cjs` / `test/menu.cjs` 改为断言 `contextMenus.register` 与 `resolve` 输出（含 `children` 子菜单）及动作执行；旧自绘浮层代码仅为老宿主兜底保留。需完全重启 DSH 后真实点击验收。
- **日期**：2026-11-06

<!-- fresh-meta
last-updated: 2026-11-06
trigger-reason: 侧栏会话菜单迁移到宿主 contextMenus（0.16.2，DR-20261106-14）
updated-by: lead
next-review: 重启 DSH 后真实右键验证菜单 UI 与二级级联
-->
