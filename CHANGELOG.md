# Changelog

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
