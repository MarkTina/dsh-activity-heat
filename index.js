/**
 * @local/activity-heat — Host half.
 *
 * 浏览器侧（client.js）负责全部面板 UI；Host 侧提供三条小路由：
 * - `POST /activity-heat/open-terminal`：右键菜单「在终端中打开」，不依赖宿主
 *   open-in-app 的应用目录（有些机器上 catalog 解析不到 Windows Terminal）。
 * - `GET  /activity-heat/open-with/apps`：自己探测本机「能打开目录」的应用。
 * - `POST /activity-heat/open-with/open`：按应用 + 目录，用带路径参数的 argv
 *   启动，真实回报成败（修复宿主 catalog 缺 `{path}` 导致「提示成功但没打开」）。
 *
 * 所有路由遵循宿主既有约定：connection 的信任栅栏、application/json、64 KiB
 * 上限、只接受绝对且存在的目录；启动用 argv，不拼 shell。
 */

import { spawn } from 'node:child_process';
import { stat, readdir } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';

/** Plugin identity for loader rows. */
export const name = '@local/activity-heat';

/** Host services these routes need; the client half stays independent. */
export const inject = ['webServer', 'connection'];

const ROUTE_TERMINAL = '/activity-heat/open-terminal';
const ROUTE_APPS = '/activity-heat/open-with/apps';
const ROUTE_OPEN = '/activity-heat/open-with/open';
const MAX_BODY_BYTES = 64 * 1024;
const APPS_TTL_MS = 60 * 1000;

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(payload));
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      req.resume();
      return null;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, size).toString('utf8');
}

/**
 * 构造「干净」的子进程环境：删除宿主自带的 `ELECTRON_RUN_AS_NODE`。
 *
 * 本插件跑在 `dsh-desktop-host` 进程里，而该进程本身就是「Electron 当 Node 用」
 * （启动参数带 `--expose-internals <index.js>`，环境里有 `ELECTRON_RUN_AS_NODE=1`）。
 * 若 spawn 外部应用时不清理这个变量，Electron 系应用（VS Code / Cursor / Windsurf /
 * Zed …）会继承它 → 以 Node 模式运行、把目标目录当成脚本参数、几十毫秒内报错退出，
 * 完全不弹窗口；但 spawn 的 `spawn` 事件已经触发，路由照样回 200 → 前端 toast 假成功。
 */
function launcherEnv() {
  const env = Object.assign({}, process.env);
  delete env.ELECTRON_RUN_AS_NODE;
  return env;
}

/**
 * Spawn one launcher and wait for the OS to accept it (or fail with ENOENT).
 * Detached + ignore stdio: the app outlives this Host process.
 * `env: launcherEnv()` 保证被启动的 GUI 应用不会误继承宿主的 ELECTRON_RUN_AS_NODE。
 */
function trySpawn(command, args, options) {
  return new Promise((resolve) => {
    let settled = false;
    let child;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    try {
      child = spawn(command, args, Object.assign({
        detached: true,
        stdio: 'ignore',
        windowsHide: false,
        env: launcherEnv(),
      }, options || {}));
    } catch (error) {
      finish(false);
      return;
    }
    child.once('error', () => finish(false));
    child.once('spawn', () => {
      try { child.unref(); } catch (ignored) { /* ignore */ }
      finish(true);
    });
    const timer = setTimeout(() => {
      try { child.unref(); } catch (ignored) { /* ignore */ }
      finish(true);
    }, 1200);
    if (timer && typeof timer.unref === 'function') timer.unref();
  });
}

/**
 * 终端优先 Windows Terminal，其次 PowerShell 7（pwsh），最后 Windows PowerShell。
 * 其他平台给一个合理默认；找不到启动器时返回 false，由路由回 502。
 */
async function launchTerminal(dir) {
  if (process.platform === 'win32') {
    if (await trySpawn('wt.exe', ['-d', dir])) return true;
    // PATH 可能不含 WindowsApps（DSH 的启动环境）；再试一次 App Execution Alias 的绝对路径
    const wtPath = process.env.LOCALAPPDATA
      ? join(process.env.LOCALAPPDATA, 'Microsoft', 'WindowsApps', 'wt.exe')
      : '';
    if (wtPath && await trySpawn(wtPath, ['-d', dir])) return true;
    if (await trySpawn('pwsh.exe', ['-NoExit', '-WorkingDirectory', dir])) return true;
    // PowerShell 7 默认安装位置；PATH 没有 pwsh 时仍可用
    if (await trySpawn('C:\\Program Files\\PowerShell\\7\\pwsh.exe', ['-NoExit', '-WorkingDirectory', dir])) return true;
    const quoted = String(dir).replace(/'/g, "''");
    return trySpawn('powershell.exe', ['-NoExit', '-Command', "Set-Location -LiteralPath '" + quoted + "'"]);
  }
  if (process.platform === 'darwin') {
    return trySpawn('open', ['-a', 'Terminal', dir]);
  }
  return trySpawn('x-terminal-emulator', ['--working-directory', dir]);
}

/* ------------------------------------------------------------------ *
 * open-with：本机应用探测 + 带路径启动
 * ------------------------------------------------------------------ */

/** 展开 `${VAR}` 形式的环境变量；缺失的变量替换为空串。 */
function expandVars(input) {
  return String(input).replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (whole, name) => {
    const value = process.env[name];
    return value === undefined ? '' : value;
  });
}

async function isFile(filePath) {
  if (!filePath) return false;
  try {
    const info = await stat(filePath);
    return info.isFile();
  } catch (ignored) {
    return false;
  }
}

/** 在 PATH 里按 PATHEXT 找可执行文件（返回绝对路径或 null）。 */
async function findOnPath(name) {
  const pathValue = String(process.env.PATH || '');
  const sep = process.platform === 'win32' ? ';' : ':';
  const dirs = pathValue.split(sep).filter(Boolean);
  // 只认 .EXE：GUI 启动器用 .cmd/.bat 壳（如 code.CMD）无法被 detached spawn 直接执行，
  // 会产生「解析到了却启动失败」的假象；这类应用应通过 App Paths / 安装路径拿到真正 exe。
  const rawExts = process.platform === 'win32' ? ['.EXE'] : [''];
  const hasExt = /\.[A-Za-z0-9]+$/.test(name);
  for (const dir of dirs) {
    if (hasExt) {
      const candidate = join(dir, name);
      if (await isFile(candidate)) return candidate;
      continue;
    }
    for (const ext of rawExts) {
      const candidate = join(dir, name + ext);
      if (await isFile(candidate)) return candidate;
    }
  }
  return null;
}

/** 读 Windows `App Paths` 注册表（HKLM + HKCU），返回 exe 小写名 → 绝对路径。 */
async function readWindowsAppPaths() {
  const map = new Map();
  if (process.platform !== 'win32') return map;
  const bases = [
    'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths',
    'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths',
  ];
  for (const base of bases) {
    const output = await runCapture('reg.exe', ['query', base, '/s'], 2500);
    let currentExe = '';
    for (const line of output.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (/^HKEY_/i.test(trimmed)) {
        const keyMatch = trimmed.match(/App Paths\\([^\\]+)$/i);
        currentExe = keyMatch ? keyMatch[1].toLowerCase() : '';
        continue;
      }
      // 默认值行： (Default) REG_SZ C:\path\to.exe；本地化可能显示为 (默认)/(Ĭ��) 等
      const defMatch = trimmed.match(/^\([^)]*\)\s+REG_SZ\s+(.+)$/i);
      if (defMatch && currentExe) {
        map.set(currentExe, defMatch[1].trim());
        currentExe = '';
      }
    }
  }
  return map;
}

/** 运行一个命令并抓 stdout（用于 reg query）。失败返回空串。 */
function runCapture(command, args, timeoutMs) {
  return new Promise((resolve) => {
    let output = '';
    let settled = false;
    let child;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    try {
      child = spawn(command, args, { windowsHide: true });
    } catch (ignored) {
      finish('');
      return;
    }
    const timer = setTimeout(() => {
      try { child.kill(); } catch (ignored) { /* ignore */ }
      finish(output);
    }, typeof timeoutMs === 'number' ? timeoutMs : 1500);
    if (timer && typeof timer.unref === 'function') timer.unref();
    child.once('error', () => finish(''));
    if (child.stdout) child.stdout.on('data', (chunk) => { output += chunk.toString('utf8'); });
    child.once('close', () => {
      if (timer) clearTimeout(timer);
      finish(output);
    });
  });
}

/**
 * Windows 应用目录：每个应用给出注册名（App Paths）、常见安装路径与 PATH 别名。
 * 打开时统一追加目标目录（这就是修复「VS Code 不生效」的关键）。
 */
const WIN_CATALOG = [
  { id: 'explorer', exe: 'explorer.exe', shellOpen: true },
  { id: 'vscode', exe: 'Code.exe', aliases: ['code'], candidates: [
    '${LOCALAPPDATA}/Programs/Microsoft VS Code/Code.exe',
    '${ProgramFiles}/Microsoft VS Code/Code.exe',
    '${ProgramW6432}/Microsoft VS Code/Code.exe',
  ] },
  { id: 'vscodeinsiders', exe: 'Code - Insiders.exe', aliases: ['code-insiders'], candidates: [
    '${LOCALAPPDATA}/Programs/Microsoft VS Code Insiders/Code - Insiders.exe',
    '${ProgramFiles}/Microsoft VS Code Insiders/Code - Insiders.exe',
  ] },
  { id: 'cursor', exe: 'Cursor.exe', aliases: ['cursor'], candidates: ['${LOCALAPPDATA}/Programs/cursor/Cursor.exe'] },
  { id: 'windsurf', exe: 'Windsurf.exe', aliases: ['windsurf'], candidates: ['${LOCALAPPDATA}/Programs/Windsurf/Windsurf.exe'] },
  { id: 'zed', exe: 'zed.exe', aliases: ['zed'] },
  { id: 'sublimetext', exe: 'sublime_text.exe', aliases: ['subl'], candidates: [
    '${ProgramFiles}/Sublime Text/sublime_text.exe',
    '${ProgramFiles}/Sublime Text 3/sublime_text.exe',
  ] },
  { id: 'androidstudio', exe: 'studio64.exe', candidates: ['${ProgramFiles}/Android/Android Studio/bin/studio64.exe'] },
  { id: 'intellijidea', exe: 'idea64.exe' },
  { id: 'pycharm', exe: 'pycharm64.exe' },
  { id: 'webstorm', exe: 'webstorm64.exe' },
  { id: 'phpstorm', exe: 'phpstorm64.exe' },
  { id: 'goland', exe: 'goland64.exe' },
  { id: 'rider', exe: 'rider64.exe' },
  { id: 'rustrover', exe: 'rustrover64.exe' },
  { id: 'windowsterminal', exe: 'wt.exe', terminalArgs: true, candidates: [
    '${LOCALAPPDATA}/Microsoft/WindowsApps/wt.exe',
  ] },
  { id: 'gitbash', exe: 'git-bash.exe', candidates: [
    '${ProgramFiles}/Git/git-bash.exe',
    '${ProgramW6432}/Git/git-bash.exe',
  ] },
  { id: 'wsl', exe: 'wsl.exe' },
];

/** JetBrains 产品通常装在 `%ProgramFiles%\JetBrains\<Product> <ver>\bin`，扫描最新版本。 */
async function findJetBrainsLauncher(exeName) {
  const roots = [process.env.ProgramFiles, process.env.ProgramW6432, process.env['ProgramFiles(x86)']]
    .filter(Boolean);
  for (const root of roots) {
    const base = join(root, 'JetBrains');
    let dirs;
    try { dirs = await readdir(base); } catch (ignored) { continue; }
    // 版本号越大越新，简单的字符串倒序够用
    dirs.sort((a, b) => b.localeCompare(a, 'en', { numeric: true }));
    for (const dir of dirs) {
      const candidate = join(base, dir, 'bin', exeName);
      if (await isFile(candidate)) return candidate;
    }
  }
  return null;
}

/** 解析一个 Windows 应用的启动命令；找不到返回 null。 */
async function resolveWinApp(app, appPaths) {
  if (app.shellOpen) {
    // 资源管理器由系统提供，始终可用；启动时直接用 explorer.exe <path>
    return { id: app.id, command: app.exe, argsFor: (p) => [p] };
  }
  let command = null;
  if (appPaths.has(app.exe.toLowerCase())) {
    const fromReg = appPaths.get(app.exe.toLowerCase());
    if (fromReg && await isFile(fromReg)) command = fromReg;
  }
  if (!command && Array.isArray(app.candidates)) {
    for (const raw of app.candidates) {
      const candidate = expandVars(raw);
      if (candidate && await isFile(candidate)) { command = candidate; break; }
    }
  }
  if (!command) {
    const names = [app.exe].concat(app.aliases || []);
    for (const name of names) {
      const found = await findOnPath(name);
      if (found) { command = found; break; }
    }
  }
  // JetBrains：App Paths 常缺失时退回 Program Files 扫描
  if (!command && /64\.exe$/i.test(app.exe)) {
    command = await findJetBrainsLauncher(app.exe);
  }
  if (!command) return null;
  return {
    id: app.id,
    command,
    argsFor: (p) => {
      if (app.terminalArgs) return ['-d', p];
      if (app.id === 'gitbash') return ['--cd=' + p];
      if (app.id === 'wsl') return ['--cd', toWslPath(p)];
      return [p];
    },
  };
}

/** Windows 路径 → WSL 的 /mnt/<drive>/... */
function toWslPath(winPath) {
  const value = String(winPath);
  const match = value.match(/^([A-Za-z]):[\\/](.*)$/);
  if (!match) return value.replace(/\\/g, '/');
  return '/mnt/' + match[1].toLowerCase() + '/' + match[2].replace(/\\/g, '/');
}

/** macOS 应用目录：按 .app bundle 名匹配。 */
const MAC_CATALOG = [
  { id: 'finder', finder: true },
  { id: 'terminal', bundle: 'Terminal.app', extraDirs: ['/System/Applications/Utilities', '/Applications/Utilities'] },
  { id: 'vscode', bundle: 'Visual Studio Code.app' },
  { id: 'vscodeinsiders', bundles: ['Visual Studio Code - Insiders.app'] },
  { id: 'cursor', bundle: 'Cursor.app' },
  { id: 'windsurf', bundle: 'Windsurf.app' },
  { id: 'zed', bundles: ['Zed.app', 'Zed Preview.app'] },
  { id: 'sublimetext', bundle: 'Sublime Text.app' },
  { id: 'xcode', bundle: 'Xcode.app' },
  { id: 'androidstudio', bundle: 'Android Studio.app' },
  { id: 'intellijidea', bundles: ['IntelliJ IDEA.app', 'IntelliJ IDEA Ultimate.app', 'IntelliJ IDEA CE.app'] },
  { id: 'pycharm', bundles: ['PyCharm.app', 'PyCharm Professional.app', 'PyCharm CE.app', 'PyCharm Community.app'] },
  { id: 'webstorm', bundle: 'WebStorm.app' },
  { id: 'phpstorm', bundle: 'PhpStorm.app' },
  { id: 'goland', bundle: 'GoLand.app' },
  { id: 'rider', bundles: ['Rider.app', 'JetBrains Rider.app'] },
  { id: 'rustrover', bundle: 'RustRover.app' },
  { id: 'iterm', bundle: 'iTerm.app' },
  { id: 'warp', bundle: 'Warp.app' },
  { id: 'ghostty', bundle: 'Ghostty.app' },
  { id: 'kitty', bundle: 'kitty.app' },
];

async function scanMacApps() {
  const found = new Map(); // bundleName -> full path
  const home = process.env.HOME || '';
  const roots = ['/Applications', '/System/Applications', home ? join(home, 'Applications') : ''].filter(Boolean);
  for (const root of roots) {
    let entries;
    try { entries = await readdir(root, { withFileTypes: true }); } catch (ignored) { continue; }
    for (const entry of entries) {
      if (!entry || !entry.name) continue;
      if (!/\.app$/i.test(entry.name)) continue;
      if (!found.has(entry.name)) found.set(entry.name, join(root, entry.name));
    }
  }
  // Utilities 子目录（Terminal 等）
  for (const dir of ['/System/Applications/Utilities', '/Applications/Utilities']) {
    let entries;
    try { entries = await readdir(dir, { withFileTypes: true }); } catch (ignored) { continue; }
    for (const entry of entries) {
      if (entry && /\.app$/i.test(entry.name) && !found.has(entry.name)) found.set(entry.name, join(dir, entry.name));
    }
  }
  return found;
}

async function resolveMacApps() {
  const bundles = await scanMacApps();
  const resolved = new Map();
  for (const app of MAC_CATALOG) {
    if (app.finder) {
      resolved.set(app.id, { id: app.id, command: 'open', argsFor: (p) => [p] });
      continue;
    }
    const names = app.bundles || [app.bundle];
    let bundlePath = null;
    for (const name of names) {
      if (!name) continue;
      if (bundles.has(name)) { bundlePath = bundles.get(name); break; }
    }
    if (!bundlePath) continue;
    resolved.set(app.id, { id: app.id, command: 'open', argsFor: (p) => ['-a', bundlePath, p] });
  }
  return resolved;
}

/** Linux 兜底：文件管理器 + PATH 里能找到的常见编辑器/终端。 */
const LINUX_CATALOG = [
  { id: 'filemanager', command: 'xdg-open', argsFor: (p) => [p] },
  { id: 'vscode', command: 'code', argsFor: (p) => [p] },
  { id: 'vscodeinsiders', command: 'code-insiders', argsFor: (p) => [p] },
  { id: 'cursor', command: 'cursor', argsFor: (p) => [p] },
  { id: 'windsurf', command: 'windsurf', argsFor: (p) => [p] },
  { id: 'zed', command: 'zed', argsFor: (p) => [p] },
  { id: 'sublimetext', command: 'subl', argsFor: (p) => [p] },
  { id: 'gnometerminal', command: 'gnome-terminal', argsFor: (p) => ['--working-directory', p] },
  { id: 'konsole', command: 'konsole', argsFor: (p) => ['--workdir', p] },
];

async function resolveLinuxApps() {
  const resolved = new Map();
  for (const app of LINUX_CATALOG) {
    const found = await findOnPath(app.command);
    if (found) resolved.set(app.id, { id: app.id, command: found, argsFor: app.argsFor });
  }
  return resolved;
}

/* 探测结果缓存：开菜单/点击共用，避免每次扫注册表。 */
let cachedResolved = null;
let cachedResolvedAt = 0;

async function resolveApps(force) {
  const now = Date.now();
  if (!force && cachedResolved && now - cachedResolvedAt < APPS_TTL_MS) {
    return cachedResolved;
  }
  let resolved;
  if (process.platform === 'win32') {
    const appPaths = await readWindowsAppPaths();
    resolved = new Map();
    for (const app of WIN_CATALOG) {
      const entry = await resolveWinApp(app, appPaths);
      if (entry) resolved.set(app.id, entry);
    }
  } else if (process.platform === 'darwin') {
    resolved = await resolveMacApps();
  } else {
    resolved = await resolveLinuxApps();
  }
  cachedResolved = resolved;
  cachedResolvedAt = now;
  return resolved;
}

/** 解析 JSON 请求体并校验目录，返回 { dir } 或 { error }。 */
async function parseDirBody(req, res) {
  const mediaType = String(req.headers['content-type'] || '').split(';', 1)[0].trim().toLowerCase();
  if (mediaType !== 'application/json') {
    sendJson(res, 415, { code: 'unsupported-media-type', message: 'content-type must be application/json' });
    return { error: true };
  }
  let text;
  try {
    text = await readBody(req);
  } catch (ignored) {
    sendJson(res, 400, { code: 'bad-request', message: 'request body unreadable' });
    return { error: true };
  }
  if (text === null) {
    sendJson(res, 413, { code: 'payload-too-large', message: 'request body is too large' });
    return { error: true };
  }
  let body;
  try {
    body = JSON.parse(text);
  } catch (ignored) {
    sendJson(res, 400, { code: 'bad-request', message: 'body must be JSON' });
    return { error: true };
  }
  const dir = body && typeof body.path === 'string' ? body.path : '';
  if (dir === '' || !isAbsolute(dir)) {
    sendJson(res, 400, { code: 'bad-request', message: 'path must be an absolute directory path' });
    return { error: true };
  }
  let info;
  try {
    info = await stat(dir);
  } catch (ignored) {
    info = null;
  }
  if (!info || !info.isDirectory()) {
    sendJson(res, 404, { code: 'not-found', message: 'directory does not exist: ' + dir });
    return { error: true };
  }
  return { dir, body };
}

/** Host loader entry: authenticated routes for terminal + open-with. */
export function apply(ctx) {
  try {
    const webServer = ctx.webServer || (typeof ctx.get === 'function' ? ctx.get('webServer') : undefined);
    const connection = ctx.connection || (typeof ctx.get === 'function' ? ctx.get('connection') : undefined);
    if (!webServer || typeof webServer.register !== 'function') return;

    const guard = (req, res, method) => {
      let rejection;
      try {
        rejection = connection && typeof connection.requestRejection === 'function'
          ? connection.requestRejection(req)
          : undefined;
      } catch (ignored) {
        rejection = 403;
      }
      if (rejection !== undefined) {
        res.statusCode = rejection;
        res.end();
        return false;
      }
      if (req.method !== method) {
        res.statusCode = 405;
        res.setHeader('allow', method);
        res.end();
        return false;
      }
      return true;
    };

    const terminalHandler = async (req, res) => {
      if (!guard(req, res, 'POST')) return;
      const parsed = await parseDirBody(req, res);
      if (parsed.error) return;
      const opened = await launchTerminal(parsed.dir);
      if (opened) sendJson(res, 200, { ok: true });
      else sendJson(res, 502, { code: 'launch-failed', message: 'no terminal launcher available' });
    };

    const appsHandler = async (req, res) => {
      if (!guard(req, res, 'GET')) return;
      let resolved;
      try {
        resolved = await resolveApps(false);
      } catch (error) {
        sendJson(res, 502, { code: 'probe-failed', message: error && error.message ? error.message : 'probe failed' });
        return;
      }
      sendJson(res, 200, { apps: Array.from(resolved.keys()) });
    };

    const openHandler = async (req, res) => {
      if (!guard(req, res, 'POST')) return;
      const parsed = await parseDirBody(req, res);
      if (parsed.error) return;
      const appId = parsed.body && typeof parsed.body.app === 'string' ? parsed.body.app : '';
      if (appId === '') {
        sendJson(res, 400, { code: 'bad-request', message: 'app is required' });
        return;
      }
      let resolved;
      try {
        resolved = await resolveApps(false);
      } catch (ignored) {
        resolved = new Map();
      }
      let entry = resolved.get(appId);
      if (!entry) {
        // 缓存里没有：强制重探一次（可能刚装好 / 缓存过期）
        try { resolved = await resolveApps(true); } catch (ignored) { resolved = new Map(); }
        entry = resolved.get(appId);
      }
      if (!entry) {
        sendJson(res, 404, { code: 'app-not-found', message: 'no launcher for app: ' + appId });
        return;
      }
      let args;
      try {
        args = entry.argsFor(parsed.dir);
      } catch (ignored) {
        args = [parsed.dir];
      }
      const launched = await trySpawn(entry.command, args);
      if (launched) {
        sendJson(res, 200, { ok: true });
      } else {
        // 启动失败：让缓存失效，下次重新探测（可能被卸载/移动）
        cachedResolved = null;
        sendJson(res, 502, { code: 'launch-failed', message: 'failed to launch ' + appId });
      }
    };

    const registrations = [
      [ROUTE_TERMINAL, terminalHandler],
      [ROUTE_APPS, appsHandler],
      [ROUTE_OPEN, openHandler],
    ];
    for (const [path, handler] of registrations) {
      const register = () => webServer.register({ kind: 'exact', path, handler });
      if (typeof ctx.effect === 'function') ctx.effect(register, 'activity-heat: ' + path);
      else register();
    }
  } catch (error) {
    // Host 路由不可用时只影响「在终端中打开 / 在其他应用中打开」，不能让整个插件加载失败。
    try { console.warn('[activity-heat] host routes unavailable:', error && error.message); } catch (ignored) { /* ignore */ }
  }
}
