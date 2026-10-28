# Changelog

## 0.1.0 — 2026-10-28

First public layout of the plugin.

- Sidebar panel entry with a heat ring that follows the hottest session.
- Per-row heat dot on `sidebar.session.row.leading` (solid + glow → solid → ring → dot → hidden).
- Hover-card heat section on `sidebar.session.row.hover`.
- Recent Activity panel with Sessions / Workspaces views, count selectors and heat filters.
- Running-session badge, orbiting light band and breathing glow (reduced-motion aware).
- Zero-config defaults in `cordis.patch.yml`, overridable per profile.
- Default shortcut `Ctrl+Alt+H` (`Cmd+Alt+H` on macOS), no Linux default.
- Locale-aware UI text with bundled `zh`/`en` dictionaries and a Chinese fallback.
- Dependency-free self-checks under `test/`.
