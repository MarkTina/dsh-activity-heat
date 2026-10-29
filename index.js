/**
 * @local/activity-heat — Host half.
 *
 * 浏览器侧（client.js）负责全部面板 UI；Host 侧只提供一条小路由
 * `POST /activity-heat/open-terminal`，让右键菜单的「在终端中打开」不依赖
 * 宿主 open-in-app 的应用目录（有些机器上 catalog 解析不到 Windows Terminal）。
 *
 * 路由遵循宿主既有约定：connection 的信任栅栏、application/json、64 KiB 上限、
 * 只接受绝对且存在的目录；启动用 argv，不拼 shell。
 */

import { spawn } from 'node:child_process';
import { stat } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';

/** Plugin identity for loader rows. */
export const name = '@local/activity-heat';

/** Host services this route needs; the client half stays independent. */
export const inject = ['webServer', 'connection'];

const ROUTE = '/activity-heat/open-terminal';
const MAX_BODY_BYTES = 64 * 1024;

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
 * Spawn one launcher and wait for the OS to accept it (or fail with ENOENT).
 * Detached + ignore stdio: the terminal outlives this Host process.
 */
function trySpawn(command, args) {
  return new Promise((resolve) => {
    let settled = false;
    let child;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    try {
      child = spawn(command, args, { detached: true, stdio: 'ignore', windowsHide: false });
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

/** Host loader entry: one authenticated route for the terminal action. */
export function apply(ctx) {
  try {
    const webServer = ctx.webServer || (typeof ctx.get === 'function' ? ctx.get('webServer') : undefined);
    const connection = ctx.connection || (typeof ctx.get === 'function' ? ctx.get('connection') : undefined);
    if (!webServer || typeof webServer.register !== 'function') return;

    const handler = async (req, res) => {
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
        return;
      }
      if (req.method !== 'POST') {
        res.statusCode = 405;
        res.setHeader('allow', 'POST');
        res.end();
        return;
      }
      const mediaType = String(req.headers['content-type'] || '').split(';', 1)[0].trim().toLowerCase();
      if (mediaType !== 'application/json') {
        sendJson(res, 415, { code: 'unsupported-media-type', message: 'content-type must be application/json' });
        return;
      }
      let text;
      try {
        text = await readBody(req);
      } catch (ignored) {
        sendJson(res, 400, { code: 'bad-request', message: 'request body unreadable' });
        return;
      }
      if (text === null) {
        sendJson(res, 413, { code: 'payload-too-large', message: 'request body is too large' });
        return;
      }
      let body;
      try {
        body = JSON.parse(text);
      } catch (ignored) {
        sendJson(res, 400, { code: 'bad-request', message: 'body must be JSON' });
        return;
      }
      const dir = body && typeof body.path === 'string' ? body.path : '';
      if (dir === '' || !isAbsolute(dir)) {
        sendJson(res, 400, { code: 'bad-request', message: 'path must be an absolute directory path' });
        return;
      }
      let info;
      try {
        info = await stat(dir);
      } catch (ignored) {
        info = null;
      }
      if (!info || !info.isDirectory()) {
        sendJson(res, 404, { code: 'not-found', message: 'directory does not exist: ' + dir });
        return;
      }
      const opened = await launchTerminal(dir);
      if (opened) sendJson(res, 200, { ok: true });
      else sendJson(res, 502, { code: 'launch-failed', message: 'no terminal launcher available' });
    };

    const register = () => webServer.register({ kind: 'exact', path: ROUTE, handler });
    if (typeof ctx.effect === 'function') ctx.effect(register, 'activity-heat: open-terminal route');
    else register();
  } catch (error) {
    // Host 路由不可用时只影响「在终端中打开」，不能让整个插件加载失败。
    try { console.warn('[activity-heat] open-terminal route unavailable:', error && error.message); } catch (ignored) { /* ignore */ }
  }
}
