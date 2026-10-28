# Changelog

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
