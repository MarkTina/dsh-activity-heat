# Changelog

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
