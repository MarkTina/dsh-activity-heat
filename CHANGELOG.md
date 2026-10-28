# Changelog

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
- Workspace cards are taller (roomier padding, larger title and meter) and their running state no longer leaks the orbit band as colour patches.
- Long session lists scroll with the native scrollbar hidden and a floating `⌃⌄` hint on the right.
- Session card meta now leads with the two percentages and pins the relative time to the far right.
- Cards show the accumulated conversation time; hovering it opens a time-breakdown card (donut, legend and proportional timeline) built from `contextTimeline.timing`.
- Blue heat palette instead of the host brand token, which reads near-black in light themes.
- The shortcut toggles: first press opens the panel, second press returns to the conversation you came from.
- Running sessions carry the whale-tail badge (`assets/active.png`) inlined as a data URI and swaying on a CSS loop.
- Dependency-free self-checks under `test/`.
