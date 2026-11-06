# Changelog

## 0.16.2 — 2026-11-06

- **侧栏原生会话右键菜单改为走宿主 `contextMenus` 菜单服务**：原来通过旧 `sidebar.workspaces.session.menu.item` 插槽自绘 `<button>`（`ah-side-action`），图标/字号/高度/间距/hover 与宿主原生菜单项不一致。现改为 `ctx.contextMenus.register({ target: 'session', order: 510, resolve })`，由宿主同一套 Menu 渲染 → 与内置项（置顶/重命名/分叉/复制 ID/在文件夹显示/归档）完全同源；动作顺序落在「在文件夹显示」之后、「归档」之前。
- **「在其他应用中打开…」改为原生二级级联**：动作改用 `children` 数组，宿主 `menuEntries` 自动转成原生 `submenu`，**hover 即展开，不再点击后关菜单再弹自绘浮层（二次点击）**。子菜单仍是「在终端中打开」固定第一项 + 文件管理器/编辑器/终端/其他分组。
- 图标通过 `contextMenu.icon` keyed slot 注册（复用现有内联 SVG，**不 require 任何 Harness Client 包**，符合 DESIGN §2 / PITFALLS 一.6）。老宿主无 `contextMenus` 服务时自动回退旧自绘项（二选一，不重复注册）。
- 打开动作仍走自研 Host 路由（`open-terminal` / `open-with/open`），提示按真实返回码（VETO D-002）；`pnpm test` 五项全绿。

## 0.16.1 — 2026-11-06

- **修复「在其他应用中打开」对 VS Code 等 Electron 应用永远打不开（却 toast 假成功）。** 根因：本插件运行在 `dsh-desktop-host` 进程内，该进程本身以 `ELECTRON_RUN_AS_NODE=1` 运行（Electron 当 Node 用）；`index.js` 的 `trySpawn` 用默认环境启动 `Code.exe <dir>` 时该变量被子进程继承 → 目标应用以 **Node 模式**运行、把目录当成脚本参数、几十毫秒内报错退出，**根本不开窗口**；但 `spawn` 的 `spawn` 事件已触发 → 路由回 `200` → 前端 toast「已在 VS Code 中打开」= 假成功。
- 修复：新增 `launcherEnv()`，启动外部应用时从子进程 env 中删除 `ELECTRON_RUN_AS_NODE`（`child_process.spawn` 显式传净环境）。影响全部 Electron 系应用（VS Code / Insiders / Cursor / Windsurf / Zed …）；`explorer` / 终端等非 Electron 项不受影响。
- 实测对照：同一 spawn 方式下，保留该变量时 `Code.exe` 64ms 退出、Code 进程数 0；清除后 Code 进程数 0→9、VS Code 窗口正常打开。
- `pnpm test` 五项全绿。

## 0.16.0 — 2026-11-06

- **外部背景支持一键开关**：配置中心新增「启用外部背景」复选框（`bgEnabled`，默认开）。关闭后不渲染背景元素、不加载背景脚本，面板回到纯色底；背景代码输入框置灰。配置持久化并纳入 JSON 导入/导出。
- `pnpm test` 五项全绿（392 条）。

## 0.15.1 — 2026-11-05

- 移除会话卡最左「工作区书签 rail」的独立淡底背景（`.ah-ws-tag` 的 `background` → `transparent`），与卡片主体融为一体；保留 1px 发丝分隔线与图标/名称，无工作区时同宽无底。
- `pnpm test` 五项全绿（391 条）。

## 0.15.0 — 2026-11-05

- **配置中心扩展**：设置页显示背景原地址链接（`https://www.kubai.design/pro-threads/`）；新增可调 **卡片间距（0–32px）/ 卡片圆角（0–24px）/ 背景不透明度（0–100%）**，实时生效并持久化（`cardGap`/`cardRadius`/`bgOpacity`）。卡片间距与圆角改由 CSS 变量 `--ah-card-gap` / `--ah-card-radius` 下发。
- **配置导入 / 导出（JSON）**：导出生成 `{bgEmbed,scrimColor,scrimOpacity,scrimBlur,cardGap,cardRadius,bgOpacity}` 的 JSON（写入文本框并尝试复制）；粘贴 JSON 点「导入」应用（再点保存持久化）。
- `pnpm test` 五项全绿（391 条）。

## 0.14.0 — 2026-11-05

- **背景与外观配置中心**：顶部右侧（筛选项行最右）新增齿轮入口 → 弹窗可编辑「背景嵌入代码」（粘贴 `script`+自定义标签即可切换场景）与「中间层颜色 / 不透明度 / 模糊度」；配置持久化到 `localStorage`（`bgEmbed`/`scrimColor`/`scrimOpacity`/`scrimBlur`），默认填入 pro-threads `mobius/palette=paper`。
- **背景与列表之间新增可配置中间层 `.ah-scrim`**：颜色遮罩 + `backdrop-filter: blur(px)`（默认白 45% / 10px），实时预览。
- **背景脚本缓存**：`ensureEmbedScript` 按 `src` 只注入一次（内存 `__embedLoaded` + 浏览器缓存），不重复下载 `embed.js`。
- **修复切换插件时的黑屏**：根因是 embed.js 的 `:host{background:#000}` + iframe `opacity:0` 直到场景 ready；现用 `.ah-threads-bg pro-threads{background:#f7f8fa !important}` 覆盖宿主黑底，切回不再闪黑。
- `pnpm test` 五项全绿（388 条）。

## 0.13.0 — 2026-11-05

- **面板背景嵌入 kubai087/pro-threads 场景（实验）**：新增 `ThreadsBackground`（`.ah-threads-bg` → `<pro-threads scene="mobius" settings="palette=paper" palette="paper">`），一次性加载 `https://cdn.jsdelivr.net/gh/kubai087/pro-threads@main/embed.js`；置于 `z-index:-1`、`pointer-events:none`，不遮挡也不拦截交互；离线 / CSP 拦截 / 加载失败时自动退回纯色底。属外部资源嵌入（VETO D-005 记录），非自绘 CSS 纹理。
- `pnpm test` 五项全绿（383 条，新增 pro-threads 断言）。

## 0.12.4 — 2026-11-05

- **会话列表 item 间距加大**：会话卡 / 工作区卡 / 运行中卡外框的底部间距由 8–10px 统一为 **12px**，缓解拥挤感（`margin-bottom`）。
- `pnpm test` 五项全绿（380 条）。

## 0.12.3 — 2026-11-05

- **移除面板渐变流动背景，恢复纯色底（浅色=纯白）。** 用户反馈渐变背景与 DSH 底色边界感重，要求「拿掉、换回纯白」。删除 `.ah-shell::before` 背景层与 `ah-bg-drift` 动画；`.ah-shell` 改为纯色底 `var(--dsw-alias-bg-base, #fff)`（深色主题取各自底色）。同步移除 reduced-motion 里的背景选择器与相关断言，DESIGN/VETO 例外回退（VETO D-003 失效 → D-004）。
- 保留 0.12.1 性能优化（静态卡不挂 backdrop、仅悬停单卡模糊/折射）。
- `pnpm test` 五项全绿（380 条）。

## 0.12.2 — 2026-11-05

- **紧急修复：`@keyframes ah-bg-drift` 少写结束花括号，导致注入样式表后半段被整段吞掉。** 表现为主面板卡片失去玻璃/圆角/阴影（发灰）、侧栏入口 HeatRing 图标消失、背景渐变不显示——是性能改动引入的语法错误（不是删 UI）。补齐花括号后恢复。
- 面板背景改为更明显的浅蓝渐变（蓝 16%–26%）+ 16s `transform` 漂移，流动更可见，且仍是合成层动画。
- 背景**收拢为中部光晕、四边自然淡出为透明**（不再铺满到边），与 DSH 宿主底色平滑过渡、消除硬边界；漂移幅度收敛保证动画中四角始终透明。
- 自检新增「注入 CSS 花括号必须平衡」断言（380 条全绿），防止同类语法错误再次静默通过。
- `pnpm test` 五项全绿。

## 0.12.1 — 2026-11-05

- **修复会话列表滚动卡顿（性能）**：根因 ① 每张卡常驻 `backdrop-filter: … url(#svg)`（三重 `feDisplacementMap` 折射），N 张卡各带合成层；② 面板背景持续动画使每卡每帧重采样；③ 背景层 26px 大范围 `blur` 随 transform 每帧重算。优化：
  - **静态卡片不挂 `backdrop-filter`**（只保留着色 + 三重边缘光 + 体积投影；面板背景是自绘平滑渐变，透出着色即是玻璃观感）；**仅悬停的单张卡**启用 `blur(2px)+折射`；
  - 面板背景改为**纯 `transform` 合成动画**（移除 `background-position` 动画与 26px 大范围 `blur`），22s 交替；
  - 结果：静态/滚动时无卡片 backdrop 合成层、背景走 GPU 合成，列表滚动顺滑。
- `pnpm test` 五项全绿。

## 0.12.0 — 2026-11-05

- **面板浅色渐变流动背景**（`.ah-shell::before`）：低饱和浅蓝光斑（≤16%）缓慢漂移（30s 交替、blur 26px、`z-index:-1`），给卡片玻璃提供可模糊环境色，让纯白底也能看出透光质感；`prefers-reduced-motion` 下停。属 DESIGN §2 红线的显式例外（记入 VETO D-003），其余自绘背景仍禁止。
- **级联菜单安全三角区 + 三层延时**（手册 002）：悬停开子菜单 220ms 延时；指针落在「上一刻指针 → 子菜单近边两角」安全三角内时不误切；安全窗口每 80ms 复查、满 1200ms 切换；离开菜单 360ms 关闭；触摸立即；键盘 / ARIA 保持不变。
- **按钮按压手感**（手册 001 子集）：控件 / 菜单项 / 对话框 / 批量按钮按下整体下沉 1px（不新增变体、不用品牌色，遵循 VETO「统一玻璃控件」）。
- **观感修正（同 0.12.0）**：`.ah-shell` 撑满高度（`flex/height:100%`），背景**全覆盖**、会话列表下方不再纯白；背景改为 `background-position` + `transform` 双驱动、18s 交替，流动更明显；**运行中 / 活跃会话卡片也改为液态玻璃**，跑马灯光带用 `mask` 镂空成只描边框的环，不再透进卡内。
- `pnpm test` 五项全绿（新增背景层 / 流动关键帧 / 按压 / 安全三角等断言）。

## 0.11.0 — 2026-11-05

- **参照《999 个小技巧，让你 Vibe 的产品更有质感》设计手册做质感整改（010 / 011 / 007 / 004）**：
  - **010 液态玻璃对齐手册**：边宽改 `rim=max(4, min(44, 短边/3.5))`；边缘位移由线性改为 `1.1×rim×(1-d/rim)^2.6` 非线性衰减（边硬、内缘平滑归零）；深色玻璃亮度 `.92→.8`；文字着色深色由 `screen` 改 `plus-lighter`，并由材质显式给 `--ah-ink`（浅玻璃深墨 / 深玻璃浅墨）；hover 改为着色提亮约 14%（保留 ≤1px 位移、去掉大外发光）；新增 `@property` 颜色令牌过渡、`prefers-reduced-transparency`/`forced-colors` 实底回退、对比度「密度守卫」（不足加密度、不降墨色，目标 4.5:1）。
  - **明暗判定偏离手册第 7 条**：手册「<0.5 切浅色」在纯白/纯黑主题会生成「反相卡」（白底深卡、黑底亮卡），改为「背景亮 ≥0.5→浅色、暗 <0.5→深色」的保对比同向映射（记入 VETO-LIST）。
  - **011 动效曲线**：新增 `--ah-ease-out/-in/-overshoot`；卡片/菜单/对话框/toast 入场改 ease-out，浮层退场 ease-in，当前徽章 overshoot。
  - **004 圆角**：全站圆角对齐 4px 网格（4/8/12/16），`@supports corner-shape:superellipse(1.25)` 渐进增强（胶囊/圆形保持 round）。
  - **007 排版**：工作区两行标题加 `text-wrap: balance`，其余数字 `tabular-nums` / 省略已合规。
  - 运行中卡片仍保持实底、不套玻璃。
- `pnpm test` 五项全绿（panel 新增 plus-lighter、brightness .8、@property、无障碍媒体查询、rim `/3.5`、`^2.6`、阈值等断言）。

## 0.10.0 — 2026-11-05

- **活跃对话的 item 卡片改为「液态玻璃」材质**（会话卡 + 工作区卡共用 `.ah-card`；运行中卡片仍保持实底 + 自家动效语言，不套玻璃）。按需求的七个层次落地：
  - **投影**：多层体积投影（`0 10px 26px -12px` / `0 2px 6px`）+ 顶部受光，撑起卡片厚度。
  - **模糊与提亮**：`backdrop-filter: blur(2px) saturate(180%) brightness(1.06)`（浅色玻璃）/ `saturate(160%) brightness(.92)`（深色玻璃）。
  - **边缘折射**：浏览器侧用 canvas 生成「边缘一圈往内压、越靠边压得越狠、中间平整」的位移贴图，注入 SVG `feDisplacementMap`；三通道分别位移（R 比 B 多弯 `±15%` 形成色散）再 `feBlend screen` 合成；`backdrop-filter: url(#…)` 仅 Chrome/Edge 支持，用 `CSS.supports` 探到才启用，否则退回纯 blur。
  - **着色**：半透明色彩遮罩，透明度随背景复杂度在浅色 6%–22% / 深色 16%–38% 间自动调整。
  - **边缘光**：左上、右下各一道 + 再往内侧缩进一道（多层 inset box-shadow）。
  - **文字着色**：浅色玻璃用 `mix-blend-mode: multiply`（正片叠底）；深色玻璃用 `screen` 提亮（实测暗底上 `overlay` 会把浅色字压暗、不可读，故改用滤色，见 VETO-LIST 偏差记录）。
  - **亮度采样**：`elementsFromPoint` 读取卡片背后多个采样点的平均亮度与方差，`≥0.5` 切浅色玻璃、`<0.5` 切深色玻璃；`ResizeObserver` 随尺寸重建贴图，`MutationObserver` 随主题切换重算。
  - 参数：边宽 44px 在卡片上按每轴 ≤28% 收敛（否则 64px 高的小卡上下边带重叠、没有平整中心），边缘偏移 1.1×边宽，色散 ±15%。
  - 全链路 try/catch 降级：能力缺失 / 测试沙箱退回纯 CSS 玻璃，绝不向 factory 抛错。
- `pnpm test` 五项全绿（panel 新增材质、折射滤镜、文字着色、边缘光、明暗切换等断言）。

## 0.9.0 — 2026-11-05

- **重做「在其他应用中打开…」：改为自研 Host 路由，修复 VS Code 打开不生效。** 旧实现依赖宿主 `open-in-app` catalog：`vscode` 的启动参数只有 `appPaths('Code.exe')`、缺 `{path}`，只激活/启动 Code 而不打开工作目录，但路由仍回 200 → 前端误报「已在 VS Code 中打开」。
  - `index.js` 新增 `GET /activity-heat/open-with/apps`：Windows 读 `App Paths` 注册表（HKLM+HKCU，本地化默认值标签兼容）+ 常见安装路径 + PATH（只认 `.EXE`），JetBrains 扫 `%ProgramFiles%\JetBrains`；macOS 扫 `/Applications`、`/System/Applications/Utilities`、`~/Applications` 的 `.app`；Linux 用 `xdg-open` + PATH。结果缓存 60s。
  - 新增 `POST /activity-heat/open-with/open`：按应用 + 目录解析**带目标目录**的 argv（`Code.exe <path>`、`pycharm64.exe <path>`、`explorer.exe <path>`、`wt.exe -d <path>`、`git-bash.exe --cd=<path>`、`wsl.exe --cd /mnt/c/...`、macOS `open -a "<App>" <path>`），用 `spawn` 的 `spawn`/`error` 事件判定真实成败，失败回非 2xx。
  - 客户端：面板「在其他应用中打开…」与**侧栏会话右键新增的同款入口**共用 `buildOpenWithMenuItems`；侧栏用自绘浮层（模块级 store + 常驻 HeatRing 宿主），二级菜单在宿主菜单关闭后仍可用；应用列表优先新路由、404/空回退旧 `open-in-app/apps`；toast 依据真实返回码（成功才说「已在 X 中打开」）。
  - 打开列表新增 `Git Bash` / `WSL`（归入终端类）；测试新增侧栏 open-with 断言，侧栏插件动作数 4→5。
- `pnpm test` 五项全绿。

## 0.8.0 — 2026-11-05（性能优化，进行中）

- **`buildModel` 走 `useMemo` 缓存**（面板 / 右栏 / 悬停卡）：deps（会话/工作区/状态/数量/范围/分钟节拍）不变就不重算，消除「任何 state 变化都全量建模」。
- **分钟节拍改全局单例 ticker**：面板、侧栏每一行、悬停卡共享一个 60s `setInterval`（原为每行一个），定时器数量 N → 1。
- **标题圆点样式写入合并到 rAF**：一帧只重写一次 `<style>`，消除 N 行触发的 O(n²) 字符串拼接；无 `requestAnimationFrame` 的测试环境同步写，输出不变。
- **`selectedSessionIds` 加 100ms 同帧微缓存**：面板 / 右栏 / 悬停同帧只查一次 `[data-row-key]` DOM。
- **卡片宽度观测改为全页共享一个 `ResizeObserver`**（原为每张卡一个），测试环境无 RO 时安全降级。
- **筛选计数改单次遍历分桶**（原每个热度档位各扫一遍 `allRows`，O(F×N) → O(N)）。
- **面板偏好持久化**：视图 / 数量 / 筛选 / 范围写入 `localStorage['activity-heat:prefs']`，重开面板保留；无 storage（隐私模式 / 测试）时静默回默认值。
- **F4 侧栏入口「已完成未查看」计数角标**：`sidebar.panellist` 的 HeatRing 右上角显示 `completionUnread` 会话数（0 隐藏、>99 显示 `99+`，蓝底白字；不新增面板区块）。
- 无布局 / 视觉分区改动（仅入口叠加小角标，不触发 DESIGN 红线）；`pnpm test` 五项全绿。

## 0.7.16 — 2026-11-04

- **修复冷启动不加载的真根因：`client.js` 顶层 `build` 被 combo 中其它插件（envhub）同名函数覆盖。** DSH 把同一 profile 的多个 `client.js` 拼进同一脚本作用域；`dsh-envhub` 也有 `function build()` 且排在我们之后，导致我们的 factory 实际调用 envhub 的 `build`、反复注册 envhub，本插件 `apply` 永不执行（探针：`module-loaded → factory` 后无 apply，envhub 日志重复 3 次）。修复：**整个 `client.js` 用 IIFE 包裹**，隔离全部顶层声明。探针复验冷启动：`module-loaded → build-ok → factory → apply → seats`。
- **不声明插件级 `inject:['slots']`**：本 DSH 版本 profile 静态 client entry 在 slots 服务就绪前创建，声明 inject 会让 fiber 停在 pending、冷启动不 apply；改为 `ctx.get('slots')` 轮询等待（`ctx.inject` 仅老宿主/测试兜底）。
- **项目统一改用 pnpm**：`package.json` 增加 `packageManager: pnpm@11.28.5`，提交 `pnpm-lock.yaml`；命令统一 `pnpm test` / `pnpm doctor:install`。
- 同步诊断文档、AGENTS、牢记事项、design、README；`pnpm test` 五项全绿。

## 0.7.15 — 2026-11-04

- **按 DSH 官方插件开发手册整改（`@deepseek-ai/dsh-agent-preset/skills/cordis-plugin-development/`）。** ①**移除 `require('@deepseek-ai/dsh-client-ui-primitives')`**：官方明确禁止加载任何 Harness Client 包，且抛错会把整个 slot 条目打空；状态点改本地 `StatusDot`、侧栏菜单/行按钮改自绘，全部用 `--dsw-alias-*` 主题令牌。②客户端注册形态对齐官方模板：`window.__ModuleLoader__.load({ id: 包名, factory })` 返回 `{ inject: ['slots'], apply(ctx) { ctx.slots.inject(...) } }`，`apply` 主路径直接用 `ctx.slots`。③`locale` 改为可选 `ctx.get('locale')` 探测，不再用 `ctx.inject` 自管依赖。④bundle 结构（`dsh.bundle.patch` + `cordis.patch.yml` 插行）与 `dsh.client` 声明保持官方形态。
- 同步更新 design.md、AGENTS.md、牢记事项 §一.6；`npm test` 五项全绿。

## 0.7.14 — 2026-11-03

- **修复「重启后插件不加载、要手动禁用/启用才生效」的真正根因：抢占了宿主的 single 席位。** 本插件把折叠徽章注册到 `sidebar.toggle.badge`，而该席位是 **single**、已被内置 `client-ui-settings-general` 的 `DesktopUpdateBadge` 以 priority 0 占用；同优先级重复注册会抛 `single slot "sidebar.toggle.badge" already has a registration at priority 0`。该异常发生在启动的 apply 链路里，会中断本插件其余席位注册，表现为整插件消失，手动开关（重新 apply）后才恢复。**移除 `sidebar.toggle.badge` 注册**（折叠徽章能力取消，入口保留侧栏「更多」菜单与 `/heat`）。
- 同时给贴底的 `shell.bottom` 显式 `priority: -1000`：它也是 single 席位，被内置 inspector 以 priority 0 占用，同优先级会注册失败（底部条不显示）；按“数值最低者渲染”规则用更低 priority 才能安全 shadow。
- 保留插件级 `inject: ['slots']` 与 `ctx.get('slots')` 取服务；`npm test` 五项全绿（含单席冲突与无 `ctx.inject` 的回归断言）。

## 0.7.13 — 2026-11-03

- **修复 DSH 重启后插件不自动加载（必须在插件列表里禁用再启用才生效）。** 根因：`dsh.client.immediately: true` 让客户端模块在重启时常早于 UI 的 `slots` 服务执行，而插件只在 `apply` 内部用 `ctx.inject(['slots'])` 异步等待；宿主的 client 运行时会把这种「apply 已完成但 fiber 仍在等激活」的插件判为 `waiting for activation` 并且不再重试，于是整插件不挂载，只有重新 apply（禁用/启用）才激活。改为**插件级 `inject: ['slots']`**，由 cordis 在槽位服务就绪后再调度 `apply`；`apply` 内直接使用 `ctx.slots` / `ctx.get('slots')`，并保留 `ctx.inject` 兜底以兼容老宿主。这同时也是 DSH facade 报错里给出的官方写法（`return { inject: ['slots'], apply(ctx) { ctx.slots.… } }`）。
- test/boot-timing 增加回归断言（插件必须声明 `inject: ['slots']`）；`npm test` 五项全绿。

## 0.7.12 — 2026-11-03

- **修复底部活跃会话栏与「会话信息」重叠：从 `conversation.composer.dock` 回退到贴底的 `shell.bottom`。** 宿主自己的会话统计（`activity` 轮次/步数/速度、`usage` token/缓存命中）就注册在 `conversation.composer.dock`，同挂该 dock 会让活跃会话标签与统计行挤在同一行、视觉重叠。改回**横跨三列下方整行**的 `shell.bottom`（默认组合不占用；被 inspector 占用时延迟 250ms 注册抢占），恢复「整条嵌在最下面、不重叠」；仍仅「运行中/等待」时出现、点击直达。
- design.md §9、README 中英同步；`npm test` 五项全绿。

## 0.7.11 — 2026-11-03

- **底部活跃会话栏改挂输入框下方的 `conversation.composer.dock`。** 之前 `shell.bottom` 被内置 inspector 占用、`shell.overlay` 又会悬浮遮挡输入框与其它插件。现挂到 list 可叠加的 `conversation.composer.dock`（定义即"输入框卡片下方的 ambient 条目"）：稳定显示活跃会话、点一下切换，不抢席位、不遮挡；仍仅「运行中/等待」会话时出现。
- design.md §9、README 中英同步；`npm test` 五项全绿。

## 0.7.10 — 2026-11-03

- **撤回悬浮方案，底部活动条改回贴底 `shell.bottom`。** 0.7.9 挂 `shell.overlay` 会浮在输入框 / 其它插件之上造成遮挡。现改回 `shell.bottom` 并**延迟 250ms 注册**，利用宿主「后注册优先级更高」的 shadow 规则抢占该 single 席位（**会覆盖内置 `dsh-experimental-inspector` 的底部面板**），渲染为贴底整条；仍仅「运行中/等待」时出现。
- design.md §9、README 中英同步；`npm test` 五项全绿。

## 0.7.9 — 2026-11-03

- **修复底部活动条不显示：改挂全局 `shell.overlay`。** 定位到宿主 `shell.bottom` 是 single 唯一席位、已被内置 `dsh-experimental-inspector` 占用，我们的注册被静默跳过。现在把底部活动条挂到全局可叠加的 `shell.overlay`，渲染为底部居中悬浮条——**不打开面板也能在底部点击切换**，仍只在有「运行中/等待」会话时出现。
- design.md §9、README 中英、test/panel & boot-timing（席位改 `shell.overlay`）同步；`npm test` 五项全绿。

## 0.7.8 — 2026-11-03

- **修复工作区段 / 状态的验收问题。** ① 宽屏（状态在右侧）时左栏只放名字却仍按「有状态」顶部对齐 → 改为按「状态是否真在左栏」判断，宽屏标题**垂直居中**；② 右侧状态列与热度区间距不足 → 加左右外边距；③ 响应式阈值 `720→960`：半屏（卡片宽 <960）状态回到**左栏名字下方**，全屏（≥960）才放右侧。
- design.md §4/§8/§9/§11、README 中英同步；`npm test` 五项全绿。

## 0.7.7 — 2026-11-03

- **工作区段再收窄并水平居中；会话状态按宽度响应式。** 左段宽度 `clamp(124,20,236)→clamp(104,16,196)`、图标与名及状态水平居中；用 `ResizeObserver` 量卡片宽度：**≥720px 时状态显示在右侧 66px 状态列（热度计左侧），<720px 时显示在工作区名下方**；名字保持单行省略。
- design.md §4/§8/§9/§11、README 中英同步；`npm test` 五项全绿。

## 0.7.6 — 2026-11-03

- **工作区段的图标/名字对齐、单行省略与居中规则。** 图标与工作区名垂直对齐；工作区名改为**单行省略**（过长显示省略号，悬停看全名）；**无会话状态时名字整卡垂直居中，有状态时顶部对齐、状态在其下方**。
- design.md §4/§8/§9/§11、README 中英同步；`npm test` 五项全绿。

## 0.7.5 — 2026-11-03

- **会话状态移到工作区名下方，去掉右侧独立状态列。** 把状态组件（点 + 文字，含可叠加的「N 子智能体运行中」）从卡片右侧 66px 状态列移到最左工作区段的名称下方；右侧只保留热度计 + 时间，正文区因此变宽。归档/空闲仍不显示状态。
- design.md §8/§9/§11、README 中英、test/panel.cjs（断言改为「无独立状态列 / 状态在工作区段」）同步；`npm test` 五项全绿。

## 0.7.4 — 2026-11-03

- **指标区字号调小、工作区名垂直居中。** meta 指标行字号 `0.88em→0.8em`、间距 `6→5`、行高 `23→22`，半屏宽度下不再换行；工作区段的名字由顶部对齐改为**整卡垂直居中**。
- design.md §4/§9/§11、README 中英同步；`npm test` 五项全绿。

## 0.7.3 — 2026-11-03

- **移除工作区段左缘的竖色条。** 按反馈去掉 `ah-ws-tag` 的 `border-left` 4px 色条（连同当前/运行时的蓝色内联），只保留淡底左段、文件夹图标、名字和右侧发丝分隔线。
- design.md §4/§8/§9/§11、README 中英同步；`npm test` 五项全绿。

## 0.7.2 — 2026-11-03

- **加宽并强化三段式最左「工作区段」。** 左段宽度 `clamp(96px,15%,172px)` → `clamp(124px,20%,236px)`，加淡底块与 4px 色条，工作区名字号 `.82em` / 字重 500 / 最多两行，更充分利用这块区域、更醒目；色条仍是中性灰、当前/进行中为品牌蓝。
- design.md §4/§8/§9/§11、README 中英同步；`npm test` 五项全绿。

## 0.7.1 — 2026-11-03

- **会话卡左侧「工作区展示区」改为两栏栅格的工作区书签 rail。** 去掉悬浮玻璃胶囊：左缘 3px 色条（默认中性灰，当前/进行中为品牌蓝）+ 11px 文件夹图标 + 工作区名（单行省略、悬停看全名），右侧 1px 发丝竖线与正文分隔，文字顶部与标题首行对齐；宽度 `clamp(96px,15%,172px)`；无工作区保留同宽 rail。左列不再漂浮、与正文形成稳定两栏。
- design.md §4/§8/§9/§11、README 中英、`test/panel.cjs`（新增 inner 断言）同步；`npm test` 五项全绿。

## 0.7.0 — 2026-11-02

- **运行中卡片底部加「DeepSeek 鲸鱼游动」特效。** `RunningFrame` 底部放 DeepSeek 鲸鱼群（Simple Icons 24×24 路径、`currentColor` 品牌蓝）：各自沿底边游、游出边界淡出并从另一侧淡入（不再生硬转身），头始终朝游动方向（向右 `scaleX(-1)` 镜像、向左原图），身体/尾巴 `ah-whale-wag` 轻摆；数量按已运行分钟数增长（首次渲染记起点、面板每分钟重渲染时 +1，最多 5 只、速度/相位各异）；`prefers-reduced-motion` 下停止。仅「运行中」卡片显示。
- **卡片边框更清晰、运行中边框加粗。** 普通卡片描边由 border-l1 72% 提到 92%（更明显）；运行中外框由 1px 加到 1.5px。
- **运行中边框改为「常亮高亮、不闪」。** 去掉呼吸与闪烁动画：边框常亮高亮（蓝 62%）+ 恒定辉光；动感仅保留光带旋转与底部鲸鱼。
- **工作中卡片加大上下内边距。** 运行中卡片内容上下留白加大（会话卡上 13/下 18、工作区卡上 14/下 20），底部鲸鱼不再挤到指标行。
- **底部鲸鱼改用录屏对齐的 GIF 动画，并左右往复游动。** 分析出 41 帧无缝循环（1.71s、透明底、头朝左），base64 内联替换原 SVG；**沿底边左右往复**：游到端点淡出、不可见时 `scaleX` 转身、反向游回，头始终朝当前方向；数量按**会话运行时长（`now − last-activity`）**计，每分钟 +1、最多 5（切视图/重进面板不再重置）。**新加入的鲸鱼用正延迟先隐藏、再从画面外滑入（不做淡入/由虚变实），不再中途凭空出现。** 游动速度改为恒定像素速度（约 75px/s），按卡片实测宽度计算时长，半屏/全屏一致，并整体放慢。`prefers-reduced-motion` 下隐藏。
- design.md §2/§7/§9/§11 同步；`npm test` 五项全绿。

## 0.6.1 — 2026-11-02

- **工作区名过长改为「自动换行 / 尽量完整展示」。** 会话卡左侧工作区胶囊宽度改为 `clamp(104px, 20%, 208px)`（随卡片自适应、同宽卡片等宽），名字过长自动换行（最多两行、超出省略），够宽时一行完整显示；工作区视图卡片（GroupCard）标题也允许两行换行、卡片占满整行宽度以尽量完整展示工作区名。
- design.md §4/§8/§9、README 中英同步；`npm test` 五项全绿。

## 0.6.0 — 2026-11-02

- **移除卡片左侧温度计，改为「工作区名胶囊」。** 会话卡片最左侧的竖向玻璃温度计（`VerticalHeatPipe`）被移除，替换为一枚圆角玻璃胶囊（`ah-ws-tag`）：11px 文件夹描边图标 + 工作区名。胶囊**宽度随卡片自适应**（`clamp(88px,14%,148px)`）、名字单行省略（窄屏截断、宽屏显示更多）、无工作区留同宽透明占位，保证整列左对齐；悬停看全名。工作区视图卡片标题本就是工作区名，不再重复放标签。
- **右侧信息列随之调整。** 原来右侧列顶部的「工作区名」删除（避免重复），列宽 168→110、改为两行（热度计 + 相对时间）；右侧 96px 横向热度计保留。
- design.md §4/§7/§8/§9/§11、README 中英、`test/panel.cjs`（断言改为「工作区标签 / 无温度计 / 右侧两行」）同步；`npm test` 五项全绿。

## 0.5.9 — 2026-11-02

- **卡片左侧热度条改为「玻璃温度计」并加宽到 12px。** 6px 的细管里气泡、水头、液面都渲染不出来，肉眼看只是一根灰/蓝色条。现在竖条做成一支玻璃温度计：底部一枚始终充满档位色的球泡（`ah-vpipe-bulb`）+ 玻璃管里按热度比例上涨的液柱（`ah-vpipe-fill`）+ 左右两道竖直玻璃反光（`ah-vpipe::before`）+ 液柱顶端的凹弯月面（`ah-vpipe-head`）；去掉上升气泡与「水头打不上来」，低热度就是低液柱 + 满色小球。仍不画刻度、色相仍走「浅灰 → 深灰 → 亮蓝」，右侧 96px 横向热度计保持不动。
- **温度计精修（拟物 + 动效，两轮）。** 先解决第一版的圆帽液面 / 无玻璃感 / 球泡像外挂珠子；再解决放大后白色实弧生硬、球泡像塑料弹珠。最终：液柱为圆柱截面 + 左偏反光 + 顶部表面暗化，液面是**发丝亮弧 + 凹陷暗弧的柔和凹月面**（去掉整块亮带），球泡是**径向球体 + 弧形反光 + 右下 fresnel 反光 + 底部透光**；并加三处克制液体动效（液面呼吸 / 液柱反光上流 / 球泡亮度呼吸，4.2s·3.4s·4.6s，减少动态下全停）。
- design.md §4/§7/§9/§11、README 中英两份同步；`test/panel.cjs` 改为断言「竖向玻璃温度计」并新增管宽 12px、球泡存在两项；`npm test` 五项全绿。

## 0.5.8 — 2026-10-31

- **顶部工具栏重排并统一材质。** 原来对象切换、范围、热度筛选、数量、选择全挤在一行，且三种材质混用（实心白块 / 裸文字 / 实蓝胶囊）。现在：
  - **布局拆两行**：主行＝对象切换 + 范围 + 数量/选择；筛选行＝热度 chip + 计数徽标（`.ah-filter-scroll` 横向可滚动，窄屏不换行）。
  - **一套玻璃控件表面**：`.ah-seg / .ah-count / .ah-tab` 共用同一组选择器——半透明玻璃底 70% + 发丝描边 `--border-l1 70%` + 顶部 1px 白高光；选中态**不换材质**，只叠加大蓝底（10~12%）+ 蓝边（34~42%）+ 蓝字。层级差异只来自强调强度（对象 42% ＞ 筛选 40% ＞ 范围/数量 34%）。
  - 移除「对象=白底分段组 + 范围=无底文字 + 筛选=实蓝胶囊」的材质混搭；同时移除旧的 `.ah-filterbar` 与下划线方案。
- design.md §5（材质统一 + 强调强度表）/§9（新增"顶栏材质不统一"偏差记录）/§11、README 中英两份同步；`npm test` 五项全绿。

## 0.5.7 — 2026-10-30

- **热度条改为“管道水流 + 挡板涌浪”，并去掉分段刻度。** 热度计（`HeatMeter`）、卡片左侧热度竖条、悬停卡竖向热度条统一为连续填充：轨道与水体按**圆柱截面**处理（上下压暗、中间提亮），水体是档位色 + 液面渐变并整体轻微晃荡（`ah-water-sloshl`）；焦散集中在管腔中部偏上持续前移（`ah-water-flow`），水面微光在偏上位置水平起伏（`ah-water-surface`），填充末端是一道上下留边、居中的亮水墙并带涌浪与周期涟漪（`ah-water-head` / `ah-water-surge` / `ah-water-ripple`）；竖向条不再套横向“冲击”，而是做成**水位管**：水位按热度比例从底部上涨，水中有上升气泡、水面有亮水头（`ah-bubbles` / `ah-vpipe-surge`）；水位低于 30% 时水头反复冲一下就落回去，模拟“水源不足、上不去”（`ah-vpipe-sputter`）。颜色仍走「浅灰 → 深灰 → 亮蓝」热力色阶；卡片热度计高度 10→12、悬停卡 6→8，让水流细节可见。`prefers-reduced-motion` 下全部停止。移除 `ah-meter-tick` 刻度与相关样式。
- design.md §2/§4/§7/§9/§11、README 中英两份同步；`npm test` 五项仍全绿。

## 0.5.6 — 2026-10-30

- **会话状态全面对齐 dsh 原生。** 语义标签、视觉状态、可叠加状态与数据源都改为宿主契约：语义采用「进行中 / 等待审批 / 计划待审 / 等待回答 / 已完成 / 空闲」六态，视觉复用宿主 `Primitives.StateDot`（蓝转圈 / 橙点 / 绿点 / 灰点），并支持「N 个子智能体运行中」叠加；数据源改为 `useSessionStatus`（`running` / `pendingInteraction` / `completionUnread`），本地查看水位仅在该会话快照缺失时兜底。
- **移除自绘鲸尾状态标。** 删除 `WorkingTag / DoneTag / PendingTag` 与 `active.gif` 内联资源及其自检；侧栏悬停卡的状态行交由宿主原生渲染，插件不再重复状态文字。
- **文档与测试同步。** design.md §2/§6/§7/§8/§9/§11、README 中英两份、AGENTS.md 与 locale 字典更新；panel 断言改为校验原生状态点与标签，并新增 running / completionUnread / 子智能体叠加等覆盖。

## 0.5.5 — 2026-10-29

- **重绘插件图标（`icon.svg`，白色系）。** 从原来的极简“环+点”改为“会话行 + 热度圆点”：右侧三条长度/深浅递减的会话行代表侧栏会话列表，最上面（最近活跃）那行前是一个带同色脉冲环与极淡热晕的蓝色圆点——对应插件真正在做的事（在列表里标出最近活跃的会话）。底色改为白色圆角卡片 + 极淡描边，适配浅色界面；只有“热度”用品牌蓝 `#3b82f6`，会话文本用中性 slate 灰阶，符合 design.md 的“一个色相只表达一件事”。

## 0.5.4 — 2026-10-29

- **修复侧栏标题圆点/圆环"像被边缘截断"（光晕左侧被裁）。** 根因有两层：① 本环境把 `border-radius:50%` 渲染成 squircle（超椭圆），小圆点四边发平；② 更关键：圆点原来画在 `_title::before` 上，而宿主会话标题 `.wnFoaW_title` 是 `overflow:hidden`，长标题 hover 跑马灯时还会加左 12px 渐隐 `mask-image`——圆点贴着标题内容盒左缘，外发光向左溢出的部分被直接裁掉，跑马灯时圆点本身也会被淡掉。现在把圆点改画在**会话行的 `::before`**（行不裁剪、不参与标题 mask），并给标题加 `padding-left:13px` 占位，文字位置与原来完全一致；同时补 `corner-shape:round`、空心态去掉会填满内圈的 `inset 0 0 4px` 内发光。

## 0.5.3 — 2026-10-29

- **侧栏菜单项改用宿主原生 `MenuItemButton`。** 在 Module Loader lane 下通过 `require('@deepseek-ai/dsh-client-ui-primitives')` 取宿主原生菜单组件，行高、字号、图标槽位、悬停底色与 `separatorBefore` 分隔线完全跟随原生菜单，不再靠手调像素；取不到 primitives 时退回自绘按钮（`AH_CSS` 的 `ah-side-action`）。

## 0.5.2 — 2026-10-29

- **侧栏动作与原生菜单视觉对齐。** 插件动作的文字与图标统一使用 `--dsw-alias-label-primary`（不再继承成灰色），字号改为继承宿主菜单、行内边距 6×8、图标与文字间距 8px，与原生行保持一致。
- **分组分隔线。** 第一个插件动作（在终端中打开）上方增加一条与菜单同宽的发丝分隔线，把宿主内置动作（置顶/重命名/分叉/归档/复制 ID）与插件附加动作分开。

## 0.5.1 — 2026-10-29

- **侧栏行动作补齐图标。** 0.5.0 新增的「在终端中打开 / 复制标题 / 复制工作目录 / 下载会话日志」只有文字，与宿主原生菜单项不对齐；现在补上 16px、1.4 描边、`currentColor` 的内联 SVG 图标，并把行高与图标间距对齐原生菜单行（`menu.cjs` 增加图标回归断言）。

## 0.5.0 — 2026-10-29

**P0 — 会话管理动作下沉与停止归档**

- **侧栏原生行动作面。** `sidebar.workspaces.session.menu.item` 新增「在终端中打开 / 复制标题 / 复制工作目录 / 下载会话日志」，`sidebar.workspaces.session.row.action` 新增行尾终端按钮；每个席位独立 `safeRegister`，未声明的 slot 只跳过，不影响其他席位。
- **停止并归档。** 运行中会话的归档项改为「停止并归档…」；确认框展示宿主 `WorkspaceActiveSessionError.activity` 归一后的活动清单，确认后调用 `archiveSession(id, { stopActivity: true })`。普通归档行为不变。
- **动作目录统一。** 新增 `SESSION_ACTION_DEFS` 作为 id / 文案 / 顺序的单一来源，面板与侧栏共用；侧栏动作统一走 `runSidebarSessionAction`。
- 测试覆盖：侧栏动作注册、行菜单 4 项 + 行按钮 1 个、停止并归档 `stopActivity` 传参、运行中菜单改名。

## 0.4.1 — 2026-10-29

- **修复启动崩溃（`import failed`）。** 0.4.0 在 `apply` 阶段新增了多个 slot / 服务注册，旧结构把它们放在同一个 `try` 里：任意一个席位冲突（尤其 `conversation.session.header.corner`，该 single slot 已被 ui-sidebar-right 的右侧栏按钮占用）都会中断整段注册并让插件启动失败。现在每个席位独立 `try/catch`，失败只跳过该项，不影响面板与入口。
- **不再为可选服务建立 inject 依赖。** `commandUi` / `sidebarRightTabs` 改为 `ctx.get` 轮询；服务缺失时既不挂起插件，也不拖垮启动。
- **激活失败可见。** factory / apply / 席位注册失败改为 `console.error` 输出堆栈，后续崩溃能在 crash log 里直接定位，而不是只显示 “see console”。
- **移除会话头角落按钮。** 该 single slot 归 ui-sidebar-right 所有；轻量入口保留折叠态徽章与侧栏「更多」菜单。
- 崩溃恢复会把它从 profile 的 `dsh.profile.bundles` 里移除；重新启用时需把 `@local/activity-heat` 加回该数组。

## 0.4.0 — 2026-10-29

**P1 — 状态语义与触达面**

- **五态状态。** 「等待回答」扩展为三种「等待用户处理」：**等待审批 / 计划待审 / 等待回答**，数据来自宿主的 `pendingInteraction.kind`（approval / plan-review / question），拿不到时退回 `userQuestions` 投影。三者共用同一只琥珀色鲸尾（一个色相只表达“需要你动手”），只换文案与无障碍名称。
- **范围视图。** 会话视图顶部新增 **常规 / 已归档 / 子代理** 切换：已归档行可直接「恢复会话」，子代理行按父会话归属展示；默认仍是常规（排除归档/子代理/空白）。
- **轻量触达。** 折叠态徽章（`sidebar.toggle.badge`，显示需要关注的会话数）与侧栏「更多」菜单入口（`sidebar.panellist.actions`）——不打开中央面板也能进入最近活跃。会话头角落按钮因与 ui-sidebar-right 的 single slot 冲突，0.4.1 已移除。

**P2 — 监控、批量与命令**

- **底部活动条**（`shell.bottom`）：只在存在「运行中 / 等待处理」会话时占位，横向列出最多 6 个，点击直接打开；没有活动时不预留高度。
- **批量操作**：会话视图新增「选择」模式，可多选后 **归档所选 / 置顶所选 / 复制 ID**；运行中的会话批量归档走 `archiveSession(id, { stopActivity: true })`。
- **右侧栏常驻面板**：注册 `sidebarRightTabs` 类型与 `sidebar.right.pane.tab` 正文，把最近活跃会话停靠在右栏（从右侧栏引导页选择「最近活跃会话」打开），不占主面板。
- **`/heat` 命令**：通过 `ctx.commandUi` 注册客户端命令，`/heat` 直接进入最近活跃面板。
- 测试扩展到 21 组断言，覆盖五态、范围视图、三件套、底部条、批量、右侧栏与命令。

## 0.3.3 — 2026-10-29

- **Three heat bands.** The six-step grey → blue ramp (whose grey-blue middle read muddy in light themes) collapses to three bands: light grey (cold/stale/recent), deep grey (active) and bright blue (warm/blazing).
- **Running cards keep their outline.** The running frame now has a constant light-blue border; the 2.4 s breathing animation only varies the outer glow, so the card boundary never disappears at its dimmest.

## 0.3.2 — 2026-10-29

- **"Open in…" is a hover submenu.** The app picker now expands to the right of its parent row on hover (or `→`), instead of requiring a click and a second floating menu. Moving to another row closes it; `←`/`Esc` returns to the parent. The first row stays "Open in terminal", independent of the host catalog.

## 0.3.1 — 2026-10-29

- **Terminal stays visible in the picker.** The "Open in…" submenu now pins "Open in terminal" as its first row, so it is available even when the host `open-in-app` catalog cannot resolve Windows Terminal. It calls the plugin's own `POST /activity-heat/open-terminal` (Windows Terminal → PowerShell 7 → Windows PowerShell).

## 0.3.0 — 2026-10-28

- **Running sessions rank first.** The host's `updatedAt` only advances at turn boundaries, so a long-running session could sit behind an idle one touched minutes ago. Running sessions now count as heat 5/5 and sort ahead of idle sessions; the card keeps the real "last active" time and the hover card labels the heat "working".
- **Right-click menu on session cards.** Right-click (or focus the card and press `Shift+F10` / the Menu key) opens an action menu: open, copy session ID / title / latest prompt / working directory, pin or unpin, rename, fork, download the session log, and archive behind a confirmation. Running sessions cannot be archived; a successful archive offers a 6 s undo.
- **Workspace cards** get a smaller menu: open, new session in the workspace, copy the workspace name or path. Ungrouped cards have no actionable entries and ignore right-click.
- **Open in another app.** Session and workspace cards gain "Open in…", listing the host's probed file managers, editors, terminals and Git GUIs (`GET /open-in-app/apps`). Picking one POSTs `{ app, path }` to the host's `open-in-app/open` route; the list is grouped and localized, and an empty catalog disables the item instead of opening an empty menu. Git Bash is a shell, not a terminal emulator, so it is filtered out of the list.
- **Open in terminal.** A dedicated item opens the session/workspace directory in the system terminal, independent of the host open-in-app catalog: Windows tries Windows Terminal (`wt -d`), then PowerShell 7 (`pwsh -WorkingDirectory`), then Windows PowerShell; macOS uses Terminal; Linux uses `x-terminal-emulator`. Backed by a small authenticated Host route `POST /activity-heat/open-terminal` that accepts only an absolute existing directory and spawns argv without a shell.
- **Capability fallback.** Every action is probed against the host's public `uiWorkspace` / `sessions` services; a missing method only disables that item with a reason, never the whole menu or the plugin. The log download probes `api/session.export` before opening a download, so an unmounted export package reports unavailability instead of a 404 page.
- **Menu mechanics.** The menu and the archive/rename dialogs portal to `document.body`, clamp/flip to the viewport, close on outside click, scroll or `Esc`, return focus to the card, and support arrow keys, `Home`/`End` and `Enter`. All copy is localized in Chinese and English.
- **Tests.** New `test/menu.cjs` covers the menu actions, confirmation flow, export probe and capability fallback; `npm test` now runs six suites.

## 0.2.0 — 2026-10-28

- **Glass surfaces.** Cards, the Current badge, the count picker and the filter underline are now translucent — a `color-mix` of the host's `--dsw-specific-menu` over `--dsw-alias-bg-base`, with a 1px top highlight and a hairline gradient border. Light and dark themes follow the tokens; the dark theme only lowers the highlight and deepens the shadow.
- **No background wash.** The panel paints **no gradient of its own** — glass surfaces sit directly on the host's base colour. (An earlier blue/violet/teal aurora, then a blue → white one, read as stray colour and was removed.) Hovering a card still fades in a `backdrop-filter` layer; hover cards use the host's `--dsw-menu-backdrop-filter`. Cards stay translucent at rest without paying for a filter.
- **Gradients everywhere.** The filter underline, selected segments/counts, hover glow and running orbit band are gradients.
- **Heat in colour.** The heat bar and the heat meter step through **grey → dark grey → grey-blue → blue → bright blue** (`HEAT_TONES`) instead of one flat blue, so cold sessions recede and hot ones pop. The bar keeps its tier colour for the full height and only brightens toward the top (the same tone mixed with white), with a 1px inner highlight and a hairline glass edge. Earlier attempts — solid blocks, then a gradient into pure white — either read like a sticker or made the lower half vanish into the card, which is why the surface is now "lit rod" rather than "fade to white". The low steps use the neutral `label` tokens, which read as light grey in light themes and dark grey in dark ones.
- **No panel title.** The "Recent Activity" heading is gone; the Sessions/Workspaces switch now leads the toolbar, reclaiming a row of vertical space.
- **Done, not viewed.** A session the agent finished but you have not opened shows a **green whale tail plus Done** on the right of its card — the same tail as **Working** (blue animated GIF while running, green static vector when finished). The host's `SessionSummary` has no unread field, so the plugin keeps its own seen watermark in `localStorage` (`activity-heat.seen.v1`), seeds pre-existing sessions on first run, and clears a session when its card is clicked or its sidebar row becomes selected. "Currently selected" comes from the sidebar row's `_selected` class (not `retainedBy.mainView`, which is a reference count that can stick to several rows); a session with `running` still true but no activity for 60 s counts as finished, and a Done card drops the orbit band so "finished" never sits inside a "running" frame. If the Web build hands out a new port and the watermark is lost, anything finished in the last 30 minutes is treated as new.
- **Waiting for answer.** A third state next to Working/Done: when the host's `userQuestions` projection has a non-empty `active`, the card shows an **amber whale tail plus Waiting** (same tail, amber tint). It outranks Done and Working and also drops the orbit band, since the agent is waiting on you rather than generating.
- **Sidebar hover card rebuilt.** The `sidebar.session.row.hover` card is no longer a stack of ` · `-joined lines. It is now: a status row (icon + state + heat number on the right), a heat meter, a 2×2 metric grid (label above value), a workspace line and a small "last active" footer — same width, far less cramped. A status name is never rendered twice.
- **Hover details.** Cards lift 1px with a soft outer glow while the frosted layer fades in, and settle back on press. Meta chips reveal a tinted capsule; heat bars and meters glow a little; the title dot grows a 3 px halo when its sidebar row is hovered. The one-shot diagonal sheen is **removed** — it read as a flash and repeated on every card.
- **Hover cards.** 170 ms pop-in and a 130 ms reverse pop-out (the direction follows the up/down flip), with the timing donut rotating into place and the timeline segments growing in sequence. The card is frosted, with a `--dsw-shadow-lv3` lift. The sidebar row hover card is the host's `HoverCard`, which hard-codes a dark `#2C2C2E` surface and white text; the plugin now overrides `--dsw-hovercard-bg` and the host's title/path/time/status colours (scoped with `:has(.ah-hover-content)`) so it follows the theme — a white card in light mode.
- Running cards keep an opaque background so the orbit band never bleeds through, and every new animation/transition stops under `prefers-reduced-motion`.
- **Design charter.** Added `design.md` — the style statement, four red lines, heat ramp, surface layers, motion timings, layout invariants, a deviation log of what drifted and why, and a checklist every UI change has to pass. `AGENTS.md` now points at it before any UI/UX work.

## 0.1.2 — 2026-10-28

- Heat in the sidebar is now a **small dot before each session title** (the title element's `::before`), replacing the underline. It sits inside the title box, so it occupies no cell and never crowds the host's native `StateDot` or the schedule clock.
- Heat is encoded by **color depth and solid vs. hollow**: solid for warm/blazing (level ≥ 4), hollow outline below that, with the blue getting deeper as the session is hotter. Active sessions (level ≥ 3) pulse gently; `prefers-reduced-motion` stops the pulse.
- The panel's top toolbar is now **three tiers**: title + a filled Sessions/Workspaces switch, a **text-tab heat filter** with an underline on the active band, and a lightweight **text count picker** labelled *Count*. Card list is unchanged.

## 0.1.1 — 2026-10-28

- Heat in the sidebar is now a **persistent underline beneath each session title** instead of any mark in the row-leading cell. The leading cell is shared with the host's native `StateDot` (non-idle rows) and the schedule plugin's clock marker, so anything the plugin drew there crowded them. The underline adds no DOM and occupies no cell: the row-leading slot is kept only to read the session id/heat and write a stylesheet rule, and its component returns `null`.
- The line is a **background line** with symmetric 5 px vertical padding (so it sits clear of the title, never shifts text, and is not clipped by the title's `overflow:hidden`). Its **color depth encodes heat** (pale blue → strong blue); only active sessions (level ≥ 3, within ~6 h) sweep a 200%-wide gradient to create a gentle shimmer. `prefers-reduced-motion` stops the sweep.
- Running/pending sessions draw nothing extra — their state is the host's native dot.

## 0.1.0 — 2026-10-28

First public layout of the plugin.

- Sidebar panel entry with a heat ring that follows the hottest session.
- Per-row heat dot on `sidebar.session.row.leading` (solid + glow → solid → ring → dot → hidden).
- Hover-card heat section on `sidebar.session.row.hover`.
- Recent Activity panel with Sessions / Workspaces views, count selectors and heat filters.
- Running-session badge, orbiting light band and breathing glow (reduced-motion aware).
- Workspace cards show the same running treatment when any session in that workspace is running.
- Zero-config defaults in `cordis.patch.yml`, overridable per profile.
- Default shortcut `Ctrl+Alt+H` (`Cmd+Alt+H` on macOS), no Linux default.
- Locale-aware UI text with bundled `zh`/`en` dictionaries and a Chinese fallback.
- Panel and hover-card figures (turns, tokens, cache hit rate, context usage) come from the same projections as the composer status bar — `sessionStats`, `tokenUsage` and `contextPressure` — with a `contextTimeline` fallback for older profiles.
- Session cards put the workspace name in the right-hand column, above the heat meter.
- Cache hit rate and context usage each carry a mini progress bar; context turns amber above 60% and red above 85%.
- All five metric icons share one 12 px stroke set drawn from `currentColor`, replacing the colored emoji.
- Workspace cards are taller and aggregate the summable metrics: sessions, turns, steps, tokens and total conversation time, with bucket-weighted cache hit rate and the highest context usage in the group. Their running state no longer leaks the orbit band as colour patches.
- Long session lists scroll with the native scrollbar hidden and a floating `⌃⌄` hint on the right.
- Session card meta reads as three hairline-separated groups: ① cache hit rate + context usage ② turns + steps + tokens ③ accumulated time. The relative time sits in the right column's third row, above the meta row.
- The `Current` state moved out of the meta row into a small badge before the session title.
- Running sessions drop the outlined pill: the whale-tail mark plus a "Working" label now sits in the card's right-hand whitespace. The mark is a 12-frame GIF that plays its own loop (no CSS transform), 28 px tall. Hover cards and workspace rows reuse the same label.
- The scrolling list keeps 12 px of vertical padding, so the running card's breathing glow is no longer clipped at the top or bottom edge.
- The card's right column is a fixed 168 px; heat level labels have a fixed width so meters stop shifting between rows.
- Cards show the accumulated conversation time; hovering it opens a time-breakdown card (donut, legend and proportional timeline) built from `contextTimeline.timing`.
- Hovering the token figure opens a details card: exact total, cache hit rate, uncached input, cached input, cache write (when non-zero) and output.
- The breakdown card is portaled to `document.body` and flips above the anchor when space runs out, so top-of-list rows and the viewport bottom no longer clip it. Card buttons use `aria-label` instead of `title`, so no native tooltip pops over the card.
- Blue heat palette instead of the host brand token, which reads near-black in light themes.
- The shortcut toggles: first press opens the panel, second press returns to the conversation you came from.
- Running sessions carry the whale-tail badge (`assets/active.png`) inlined as a data URI and swaying on a CSS loop.
- Dependency-free self-checks under `test/`.
