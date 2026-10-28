# dsh-activity-heat · Recent Activity

> A DeepSeek Harness plugin that surfaces **the sessions and workspaces you most recently talked to**, using a heat score derived from elapsed time — so the conversation you just had never gets buried.

[English](README.md) | [中文](README.zh.md)

---

## Why

Sessions pile up in the DSH sidebar, nested inside workspace groups. The one you just spoke in is pushed out of sight within minutes.

This plugin computes a 0–100% heat score from **time since last activity** and expresses it in three places plus a panel — the more recent, the more visible.

## What you see

| Where | What it does |
|---|---|
| **Sidebar entry** | A heat-ring icon whose brightness follows the hottest session in the profile |
| **Session row leading cell (16px)** | A heat dot: blazing = solid + glow → warm = solid → active/recent = ring → stale = small dot → hidden after 7 days |
| **Session hover card** | `Heat 4/5 · Warm`, `Last active: 40 min ago`, `This workspace is hot` |
| **Main panel** | Sessions / Workspaces views, each with heat filters and a count selector |

### Panel

- **Top-level switch**: `Sessions 58` / `Workspaces 10` — no more mixed list
- **Count selector**: sessions `10 / 20 / 30 / 50`, workspaces `5 / 10 / 20`
- **Heat filter**: All / Blazing / Warm / Active / Recent / Stale, with live counts
- **Every card**: title and most recent prompt on the left; the workspace name sits above the heat meter on the right; relative time, turns, tokens, cache hit rate and context usage run along the bottom, and both percentages carry a mini progress bar (context turns amber above 60% and red above 85%)
- **Click to open**: a session row opens that session, a workspace row opens that workspace

### Running sessions are marked

Cards for sessions with `session.running === true` get:

- a `● Running` outlined pill before the title, led by the whale-tail mark (`assets/active.png`, inlined as a data URI and swaying on a CSS loop)
- an **orbiting light band** around the card border (`conic-gradient`, one turn per 2.2 s)
- a **breathing outer glow** (one cycle per 2.4 s)
- a solid blue dot in the sidebar row

Workspace cards get the same treatment when **any** session inside that workspace is running — same pill, same orbiting band, same breathing glow — so live work is visible from the Workspaces view too.

> `prefers-reduced-motion` is respected: with reduced motion enabled, all animation stops.

## Colors

Only host theme tokens are used — **no hard-coded colors** — so light and dark themes work automatically:

```css
--color-blue-500             /* heat color (blue, falls back to #3b82f6) */
--dsw-alias-bg-base          /* opaque card background (hides the orbit band) */
--dsw-alias-label-primary    /* primary text */
--dsw-alias-label-secondary  /* secondary text */
--dsw-alias-border-l1        /* separators and tracks */
```

Heat is expressed as **one blue hue at different opacities** (0.3 → 1.0) plus a partially filled meter. The host brand token reads near-black in light themes, so the plugin prefers the blue scale instead.

## Install

This plugin is installed as a local directory or a GitHub repository; it is **not published to npm** (`private: true`).

### Option 1 — GitHub (recommended)

```bash
# inside your DSH profile directory
cd ~/.dsh/profiles/<your-profile>
pnpm add github:MarkTina/dsh-activity-heat
```

Then append the package name to `dsh.profile.bundles` in that profile's `package.json`:

```json
"@local/activity-heat"
```

**Restart DSH** to load it. A page refresh only reloads the UI: the Host keeps its module generation, and toggling the plugin does not re-read changed files either. After editing a `link:` checkout you must quit DSH completely and start it again.

### Option 2 — Local checkout

```bash
cd ~/.dsh/profiles/<your-profile>
pnpm add link:/absolute/path/dsh-activity-heat
```

Add `@local/activity-heat` to `dsh.profile.bundles` the same way.

## Shortcut

Default **`Ctrl + Alt + H`** (`Cmd + Alt + H` on macOS) switches to the Recent Activity panel. Pressing it again while the panel is open returns you to the conversation you came from — the panel never replaces the session, so the toggle is a round trip.

Change it under **Settings → Shortcuts**, searching for “Recent Activity”.

> **Why not `Ctrl+H`?** The host treats `Ctrl` + `C/V/X/Z/Y/Q/H` as reserved system keys (browser history etc.), so a bare `Ctrl+H` default is rejected as `reserved`. Adding `alt` uses the web whitelist branch. For the same reason the plugin deliberately declares **no Linux profile** — on Linux `alt+control` is treated as reserved and would fail the whole registration. Linux users can bind a key in Settings.

## Configuration

Defaults live in `cordis.patch.yml`. To override, add a row with the same id to your profile's `cordis.patch.yml` (**config is replaced whole, not deep-merged — write every field**):

```yaml
- id: activity-heat
  config:
    hotMinutes: 10        # blazing window (minutes)
    warmMinutes: 60       # warm
    activeMinutes: 360    # active
    recentMinutes: 1440   # recent
    staleDays: 7          # stale (hidden beyond this)
    topCount: 8           # default rows in the panel
    tickSeconds: 60       # heat decay refresh interval
    showRowDots: true     # show the heat dot at the start of a session row
    showHoverHeat: true   # show the heat section in the hover card
```

## Data sources

Everything is read from **public host snapshots** — no private APIs, nothing written to the session log:

| Purpose | Source |
|---|---|
| Last activity time | `sessions.list.byId[id].updatedAt` (same as the sidebar row trailing time) |
| Title / draft / subagent / archive | the same `title` `blank` `origin`, plus `workspaces.list.archivedSessionIds` |
| Workspace membership | `workspaces.list.items[].sessionIds` (same mapping as the host `groupByWorkspace`) |
| Turns | `sessions.list.projectionsBySession[id].values.sessionStats.turns` — the value the composer activity pill reads |
| Tokens | `…values.tokenUsage` — billed input (`uncachedInputTokens + cacheReadTokens + cacheWriteTokens`) plus `outputTokens`, the same whole-log total as the composer usage pill |
| Cache hit rate | `…values.tokenUsage.cacheReadTokens / billed input`, using the host's own rounding (a partial hit never displays as 100%) |
| Context usage | `…values.contextPressure` — `projectedTokens ?? pressureTokens` over `contextWindow`, the value the composer context meter reads |
| Session prompt | `…values.contextTimeline` (`initialPrompt` / `lastUser` / `lastReply`) — the status bar does not show prompts |
| Running state | `sessions.list.byId[id].running` |

**Excluded**: archived sessions, subagent child sessions, blank draft sessions.

## Repository layout

The package follows the DSH bundle layout: a Host entry, a Web client entry, one loader patch, and exported display resources.

```
dsh-activity-heat/
├── index.js            Host half — mounts the package, no Host services
├── client.js           Web half — ModuleLoader factory, slots, locale
├── cordis.patch.yml    Bundle patch — inserts the activity-heat row + defaults
├── locale/
│   ├── zh.json         Plugin metadata + UI dictionary (Chinese)
│   └── en.json         Plugin metadata + UI dictionary (English)
├── icon.svg            Plugin icon (exported as ./icon)
├── assets/
│   └── active.png      Whale-tail badge for running sessions (inlined into client.js)
├── test/               Dependency-free self-checks, run with node
├── package.json        Manifest — dsh.bundle.patch, dsh.client, exports, files
├── README.md           This file
├── README.zh.md        Chinese README
├── CHANGELOG.md
└── LICENSE
```

Visible UI text is routed through the host **Client locale service** (`ctx.locale`), falling back to the bundled Chinese dictionary when the service is unavailable. The two locale JSON files carry the same keys; `node test/locale.cjs` keeps them and the inlined dictionary in sync.

## Debugging

Release builds log nothing. To trace the full chain, flip the switch at the top of `client.js` to `true` and reload the page:

```js
var ACTIVITY_HEAT_DEBUG = false;   // ← change to true
```

## Self-checks

The repo ships dependency-free logic tests that load the **real `client.js`** against a minimal React stand-in — no browser required:

```bash
node test/panel.cjs        # registration / sorting / filtering / rendering / click-through
node test/shortcut.cjs     # shortcut defaults against host reserved-key rules
node test/boot-timing.cjs  # restart timing: recovery when slots become ready late
node test/locale.cjs       # locale dictionaries and metadata stay in sync
node test/assets.cjs       # inlined running badge matches assets/active.png
```

`pnpm test` runs all four.

## Known limitations

- Turns, tokens, cache hit rate and context usage read `sessionStats`, `tokenUsage` and `contextPressure` — the same projections as the composer status bar, so the numbers match it exactly. Profiles that only expose `contextTimeline` fall back to its values; in that case the figures can differ from the status bar.
- No Linux default shortcut is declared; Linux users bind one in Settings.

## License

[MIT](LICENSE)
