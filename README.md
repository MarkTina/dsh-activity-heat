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
| **Session title** | A small dot before the title text: solid = warm/blazing, hollow = active and cooler. Cold sessions are grey, hotter ones turn blue; active sessions pulse gently; hidden after 7 days. The row-leading cell stays with the host's state dot and the schedule clock |
| **Session hover card** | `Heat 4/5 · Warm`, `Last active: 40 min ago`, `This workspace is hot`; a green *Done* label when the session finished unseen |
| **Main panel** | Sessions / Workspaces views, each with heat filters and a count selector |

### Panel

- **Top-level switch**: `Sessions 58` / `Workspaces 10` — no more mixed list
- **Two-tier toolbar**: the panel no longer draws a title; the filled Sessions/Workspaces switch leads, followed by the text-tab heat filter (underline on the active band) and a lightweight text count picker labelled *Count*
- **Count selector**: sessions `10 / 20 / 30 / 50`, workspaces `5 / 10 / 20`
- **Heat filter**: All / Blazing / Warm / Active / Recent / Stale, with live counts
- **Every card**: the bottom row is split into three groups divided by hairlines — ① cache hit rate + context usage (each with a mini progress bar) ② turns + steps + tokens ③ accumulated conversation time; items inside a group use a dot, groups are separated by a vertical rule. The `Current` state is a badge before the title, and the relative time lives in the right column, not the meta row.
- **Finished, not viewed**: a session the agent has finished but you have not opened shows a green whale tail plus **Done** in the card's right-hand column — the same whale as **Working**, one static and one animated. Opening the session clears it immediately.
- **Waiting for answer**: a session where the agent asked a question you have not answered shows an **amber whale tail plus Waiting** in the right-hand column; it outranks Done and Working (data from the host's `userQuestions` projection).
- **Token breakdown**: hovering the token figure opens a details card — exact total, cache hit rate, uncached input, cached input, cache write (when non-zero) and output, mirroring the host's "Token usage" dialog
- **Time breakdown**: hovering the conversation time opens a card with the active duration, a donut of wait / thinking / reply / tool-argument / tool-run / other, its legend and a proportional timeline strip — same source (`contextTimeline.timing`) and same segmentation as the host's timing panel; the card is portaled to `document.body` so the scrolling list can never clip it
- **Right column**: a fixed 168 px column stacks the workspace name (top), the heat meter with its level label (middle) and the relative time (bottom), so every row lines up
- **One icon language**: all five metrics share 12 px stroke icons drawn from `currentColor` — no colored emoji
- **Long lists scroll**: the list caps its height, keeps 12 px of vertical padding so the first/last card's glow is not clipped, uses block flow (30–50 rows keep full height instead of being squashed), hides its native scrollbar, and shows a floating `⌃⌄` handle on the right while more rows remain
- **Click to open**: a session row opens that session, a workspace row opens that workspace
- **Ordering**: running sessions come first, then sessions by last activity; the workspace view applies the same rule before heat and time

### Right-click menu

Right-click a session card (or focus it and press `Shift+F10` / the Menu key):

| Action | Notes |
|---|---|
| Open session | Same as clicking the card |
| Open in terminal | Opens the session/workspace directory in the system terminal: Windows tries Windows Terminal → PowerShell 7 → Windows PowerShell; macOS uses Terminal; Linux uses x-terminal-emulator |
| Open in… | Expands a submenu on hover (first row is always "Open in terminal"), then lists the host's probed file managers, editors, terminals and Git GUIs; picking one opens the session's working directory there |
| Copy session ID / title / latest prompt / working directory | The latest prompt is copied in full; clipboard failures are reported |
| Pin / unpin | Writes the host sidebar order; this panel keeps sorting by heat |
| Rename… | Prefilled with the current title; an empty title cannot be saved |
| Fork session | Creates a branch at the last completed turn without navigating |
| Download session log | Uses the host `api/session.export` route; reports unavailability when the export package is not mounted |
| Archive session | Confirmation first; disabled while the session is running; 6 s undo |

Workspace cards also offer open workspace, open in…, new session in workspace, and copy workspace name / path. Ungrouped cards have no actionable entries and ignore right-click.

The menu is portaled to `document.body` so the scrolling list cannot clip it; arrow keys plus Enter cover every action, `Esc` or an outside click closes it, and focus returns to the card.

### Running sessions are marked

Cards for sessions with `session.running === true` get:

- a whale-tail mark with a **Working** label in the card's right-hand whitespace — the mark is a 12-frame animated GIF that plays its own loop (no CSS wobble), 28 px tall
- an **orbiting light band** around the card border (`conic-gradient`, one turn per 2.2 s)
- a **breathing outer glow** (one cycle per 2.4 s)
- a **constant light-blue border** around the frame, so the card outline never disappears when the breathing glow is at its dimmest
- **heat follows the run state**: the host's `updatedAt` only advances at turn boundaries, so a long-running session keeps its old timestamp. Running sessions therefore count as heat 5/5 and sort first; the card still shows the real "last active" time and the hover card labels the heat "working"
- the row-leading cell is left entirely to the host: running/pending rows draw the native `StateDot`, sessions with scheduled tasks draw the clock marker, and the plugin puts nothing there. Heat shows only as the small dot before the title

Workspace cards get the same treatment when **any** session inside that workspace is running — same whale-tail label, same orbiting band, same breathing glow — so live work is visible from the Workspaces view too.

A workspace card also aggregates everything that can be summed: session count, turns, steps, tokens and total conversation time. Cache hit rate is weighted across the workspace's billing buckets (not an average of percentages), and context usage shows the most loaded session. Nothing that cannot be summarised — prompts, the current-session flag — is carried over.

### Finished but not viewed

A session the agent has finished, which you have not opened yet, shows a **green whale tail plus Done** (static vector, a 3.2 s breath) on the right of its card. It is the same tail as **Working** — blue animated GIF while running, green static copy when done. A Done card **drops the orbit band**, so a "finished" mark never sits inside a "running" frame:

- **Rule**: the session is not the one currently selected, its `updatedAt` is newer than the local seen watermark, and **this turn has ended** — `running === false`, or `running` is still true but nothing has changed for 60 seconds (the host can lag a beat before flipping it back).
- **Current session**: detected from the host sidebar's `_selected` class, **not** `retainedBy.mainView` — that is a reference count and can retain several sessions at once, which is why the `Current` badge previously landed on the wrong row.
- **Watermark**: sessions whose activity predates the plugin's first run count as already seen, so installing it does not flood the list with Done marks; clicking a card, or switching to the session from the sidebar (its row becomes selected), clears the mark.
- **Storage**: the watermark lives in `localStorage` (`activity-heat.seen.v1`) and survives refreshes. The Web build changes port on every launch, so `localStorage` changes origin and the watermark can be lost — in that case the plugin falls back to "finished within the last 30 minutes".
- **Caveat**: the host's `SessionSummary` has no unread field — this is the plugin's own bookkeeping. Workspace cards do not show the state.

**Waiting for answer** is the third state: when the host's `userQuestions` projection has a non-empty `active` (the agent asked something you have not answered), the card shows an **amber whale tail plus Waiting** instead. It outranks Done and Working, also drops the orbit band, and clears as soon as the question is answered. All three states share one whale tail and differ by colour: blue = working, green = done, amber = waiting.

> `prefers-reduced-motion` is respected: with reduced motion enabled, all animation stops.

## Look and motion

Every surface is built from host theme tokens plus `color-mix` — **no hard-coded colors** — so light and dark themes work automatically:

```css
--color-blue-500             /* heat color (blue, falls back to #3b82f6) */
--dsw-alias-bg-base          /* opaque card background (hides the orbit band) */
--dsw-specific-menu          /* glass surface: host translucent menu fill (light #f8f9fa94 / dark #43454a73) */
--dsw-menu-backdrop-filter   /* background blur: blur(40px) saturate(150%) */
--dsw-alias-label-primary    /* primary text */
--dsw-alias-label-secondary  /* secondary text */
--dsw-alias-border-l1        /* separators, tracks and glass hairlines */
--dsw-alias-state-success-primary /* the green "Done" mark */
--ds-ease-in-out             /* shared easing curve */
```

Three layers:

1. **Transparency** — cards, badges, the count picker and the filter underline use a translucent fill (`color-mix(..., 70%, bg-base)`) over the panel background, with a 1px top highlight and a hairline gradient border.
2. **Frosting** — the panel paints **no background gradient** of its own; the glass sits directly on the host's base colour. Hovering a card fades in a `backdrop-filter` layer; hover cards use the host's `--dsw-menu-backdrop-filter`.
3. **Gradients** — mini meters, selected states, the running orbit band and the heat bar are gradients.

Heat uses just **three bands — light grey → deep grey → bright blue** (`HEAT_TONES`): light grey for cold/stale/recent, deep grey for active, bright blue for warm/blazing. The bar **keeps its band colour for the full height** and only brightens toward the top (the same tone mixed with white, `heatBarSurface`), with a 1px inner highlight and a hairline glass edge (`heatBarShadow`) — so it reads as a lit glass rod, and the lower half no longer dissolves into the card. The grey steps use the neutral `label` tokens, which read as light grey in light themes and dark grey in dark themes — no per-theme colours.

Motion (all of it stops under `prefers-reduced-motion: reduce`):

- **Transitions** — the list fades in when the view, filter or count changes, with a `min(index, 8) × 20 ms` stagger; the filter underline grows with `scaleX`; segmented controls cross-fade their fill.
- **Hover** — cards lift 1px with a soft outer glow while the frosted layer fades in; pressing settles them back. Meta chips get a tinted capsule, and heat bars/meters glow a little brighter. There is **no one-shot sheen** any more.
- **Hover cards** — 170 ms pop-in and a 130 ms reverse pop-out (the direction follows the up/down flip); the timing donut rotates into place and the timeline segments grow in sequence.
- **Sidebar** — the title dot is a radial gradient with a soft glow and grows a 3px halo when its row is hovered; the entry ring uses a `conic-gradient` and brightens on hover.

Performance trade-off: static cards never run `backdrop-filter` (a 50-row list stays smooth) — only the hovered card and the popover are truly frosted. The list fades at its edges with gradient masks instead of `mask`, so the frosted children are not broken.

## Install

This plugin is installed as a local directory or a GitHub repository; it is **not published to npm** (`private: true`).

### Option 1 — GitHub (recommended)

```bash
# inside your DSH profile directory
cd ~/.dsh/profiles/<your-profile>
pnpm add github:MarkTina/dsh-activity-heat#v0.3.3
```

Pin a tag (`#v0.3.3`) rather than following `main`, so an unrelated commit cannot change what you run. To upgrade later, bump the tag and restart DSH.

The repository must be **public**; a private repo needs a token (`https://<token>@github.com/...` or an SSH remote) before `pnpm add` can fetch it.

Then append the package name to `dsh.profile.bundles` in that profile's `package.json`:

```json
"@local/activity-heat"
```

**First install** normally activates through the host's HMR — if the row does not appear, restart DSH once. **Updating an already-installed copy** (same path, changed files) always needs a full quit-and-relaunch: a page refresh only reloads the UI, and toggling the plugin does not re-read changed modules.

> Desktop profiles are managed by the Electron app. Install through its plugin manager (GitHub / local directory) rather than running `pnpm` inside `~/.dsh/profiles/desktop` — the app owns that directory and will reject or overwrite manual changes.

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
    showRowDots: true     # show the heat dot before a session title
    showHoverHeat: true   # show the heat section in the hover card
```

## Data sources

Everything is read from **public host snapshots** — no private APIs, nothing written to the session log:

| Purpose | Source |
|---|---|
| Last activity time | `sessions.list.byId[id].updatedAt` (same as the sidebar row trailing time) |
| Title / draft / subagent / archive | the same `title` `blank` `origin`, plus `workspaces.list.archivedSessionIds` |
| Workspace membership | `workspaces.list.items[].sessionIds` (same mapping as the host `groupByWorkspace`) |
| Turns / steps | `sessions.list.projectionsBySession[id].values.sessionStats.turns` / `.steps` — the values the composer activity pill reads |
| Tokens | `…values.tokenUsage` — billed input (`uncachedInputTokens + cacheReadTokens + cacheWriteTokens`) plus `outputTokens`, the same whole-log total as the composer usage pill |
| Cache hit rate | `…values.tokenUsage.cacheReadTokens / billed input`, using the host's own rounding (a partial hit never displays as 100%) |
| Context usage | `…values.contextPressure` — `projectedTokens ?? pressureTokens` over `contextWindow`, the value the composer context meter reads |
| Session prompt | `…values.contextTimeline` (`initialPrompt` / `lastUser` / `lastReply`) — the status bar does not show prompts |
| Conversation time & breakdown | `…values.contextTimeline.timing` (`wallMs` / `ttftMs` / `genMs` / `toolsMs` and the generation subdivisions) — the same source and segmentation as the host timing panel |
| Running state | `sessions.list.byId[id].running` |

**Excluded**: archived sessions, subagent child sessions, blank draft sessions.

## Repository layout

The package follows the DSH bundle layout: a Host entry, a Web client entry, one loader patch, and exported display resources.

```
dsh-activity-heat/
├── index.js            Host half — open-terminal route (launches the system terminal); otherwise mount-only
├── client.js           Web half — ModuleLoader factory, slots, locale
├── design.md           Visual/interaction charter — red lines and deviation log
├── cordis.patch.yml    Bundle patch — inserts the activity-heat row + defaults
├── locale/
│   ├── zh.json         Plugin metadata + UI dictionary (Chinese)
│   └── en.json         Plugin metadata + UI dictionary (English)
├── icon.svg            Plugin icon (exported as ./icon)
├── assets/
│   ├── active.gif      Animated whale-tail badge (inlined into client.js)
│   └── active.png      Static source frame for the GIF
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
node test/menu.cjs         # right-click menu: actions, confirmation, export probe, capability fallback
node test/shortcut.cjs     # shortcut defaults against host reserved-key rules
node test/boot-timing.cjs  # restart timing: recovery when slots become ready late
node test/locale.cjs       # locale dictionaries and metadata stay in sync
node test/assets.cjs       # inlined running badge matches assets/active.png
```

`npm test` runs all six.

## Known limitations

- Turns, tokens, cache hit rate and context usage read `sessionStats`, `tokenUsage` and `contextPressure` — the same projections as the composer status bar, so the numbers match it exactly. Profiles that only expose `contextTimeline` fall back to its values; in that case the figures can differ from the status bar.
- No Linux default shortcut is declared; Linux users bind one in Settings.
- The right-click menu does **not** delete sessions: the host only supports archiving, and archived sessions can be restored from the sidebar's archived view.
- Running sessions cannot be archived (the item is disabled with an explanation); after archiving, the panel re-sorts by heat.
- "Download session log" requires the host to mount `dsh-session-log-export`; without it the item reports unavailability instead of opening a 404 page.
- The host's native sidebar rows expose no right-click extension point, so the menu is offered on the central panel's cards only.
- `updatedAt` is the host's last-activity snapshot and does not refresh with tool steps or streaming output; the panel treats running sessions as maximum heat, which does not mean they just received a message.
- "Open in…" requires the host to mount `dsh-host-open-in-app` (`/open-in-app/apps` and `/open-in-app/open`); without it, over SSH, or when the directory is gone, the item is disabled or reports a failure. The host probes installed apps once at startup, so newly installed apps appear after a DSH restart.
- Terminals list terminal emulators only (Windows Terminal / Terminal / iTerm2 / Warp…); Git Bash is a shell, not a terminal emulator, so it is not shown.
- "Open in terminal" is implemented by the plugin's own Host route `POST /activity-heat/open-terminal`, independent of the host open-in-app catalog; Windows tries Windows Terminal → PowerShell 7 → Windows PowerShell, and reports a failure when none is available.

## License

[MIT](LICENSE)
