/**
 * 右键菜单验收：用最小 React 替身加载真实的 client.js，不需要浏览器。
 *
 * 覆盖：
 * - 卡片右键 / Shift+F10 打开菜单
 * - 菜单项：打开、复制、置顶、重命名、分叉、下载、归档
 * - 运行中会话禁用归档；写服务缺失时降级禁用
 * - 归档确认、重命名对话框、剪贴板与导出探测
 * - 工作区卡片的菜单动作
 *
 * 运行：node test/menu.cjs
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const CLIENT = path.join(__dirname, '..', 'client.js');
const raw = fs.readFileSync(CLIENT, 'utf8');

let failed = 0;
function check(ok, label, extra) {
  if (ok) console.log('ok  :', label);
  else {
    console.error('FAIL:', label, extra === undefined ? '' : '-> ' + extra);
    failed += 1;
  }
}

/* ---------------- 迷你 hooks 运行时 ---------------- */

let currentInstance = null;
let instanceSeq = 0;
const instances = new Map();

function hooksOf() {
  if (!instances.has(currentInstance)) {
    instances.set(currentInstance, { id: ++instanceSeq, slots: [], cursor: 0 });
  }
  return instances.get(currentInstance);
}

function resetHooks() {
  for (const value of instances.values()) value.cursor = 0;
}

function resetInstances() {
  instances.clear();
}

const R = {
  Fragment: 'Fragment',
  createElement: (type, props, ...children) => {
    const p = props || {};
    if (children.length === 1) p.children = children[0];
    else if (children.length > 1) p.children = children;
    return { type, props: p, children };
  },
  useState: (init) => {
    const hooks = hooksOf();
    const index = hooks.cursor++;
    if (!(index in hooks.slots)) hooks.slots[index] = typeof init === 'function' ? init() : init;
    return [hooks.slots[index], (next) => {
      hooks.slots[index] = typeof next === 'function' ? next(hooks.slots[index]) : next;
    }];
  },
  useRef: (init) => {
    const hooks = hooksOf();
    const index = hooks.cursor++;
    if (!(index in hooks.slots)) hooks.slots[index] = { current: init };
    return hooks.slots[index];
  },
  useEffect: (fn) => {
    const hooks = hooksOf();
    const index = hooks.cursor++;
    if (hooks.slots[index] === 'ran') return;
    hooks.slots[index] = 'ran';
    try {
      fn();
    } catch (ignored) { /* 替身忽略 effect 异常（真实环境由组件自身兜底） */ }
  },
};

/* ---------------- 沙箱 ---------------- */

const clipboard = [];
const clicked = [];
const appended = [];
const openCalls = [];
const terminalCalls = [];
const added = { document: 0, window: 0 };

function jsonResponse(body, ok) {
  return {
    ok: ok !== false,
    status: ok === false ? 404 : 200,
    json: () => Promise.resolve(body),
  };
}

const defaultFetch = (url, init) => {
  const target = String(url);
  if (target.indexOf('activity-heat/open-terminal') !== -1) {
    try {
      terminalCalls.push(JSON.parse(init && init.body ? init.body : '{}'));
    } catch (ignored) { /* 忽略 */ }
    return Promise.resolve(jsonResponse({ ok: true }));
  }
  if (target.indexOf('open-in-app/apps') !== -1) {
    return Promise.resolve(jsonResponse({ apps: ['explorer', 'vscode', 'windowsterminal', 'gitbash'] }));
  }
  if (target.indexOf('open-in-app/open') !== -1) {
    try {
      openCalls.push(JSON.parse(init && init.body ? init.body : '{}'));
    } catch (ignored) { /* 忽略 */ }
    return Promise.resolve(jsonResponse({ ok: true }));
  }
  return Promise.resolve(jsonResponse({}));
};
let fetchImpl = defaultFetch;

function createSandbox() {
  const warns = [];
  const sb = {
    console: {
      log: () => {},
      warn: (...args) => warns.push(args.join(' ')),
      error: () => {},
    },
    setTimeout: () => 0,
    clearTimeout: () => {},
    setInterval: () => 0,
    clearInterval: () => {},
    Date,
    Math,
    JSON,
    Object,
    Array,
    String,
    Number,
    Boolean,
    RegExp,
    Error,
    Map,
    Set,
    Promise,
    encodeURIComponent,
    isFinite,
    document: {
      head: { appendChild: () => {} },
      body: {
        appendChild: (el) => appended.push(el),
        removeChild: () => {},
      },
      getElementById: () => null,
      createElement: (tag) => ({
        tagName: tag,
        style: {},
        value: '',
        setAttribute: () => {},
        appendChild: () => {},
        removeChild: () => {},
        click: () => { clicked.push(tag); },
      }),
      addEventListener: () => { added.document += 1; },
      removeEventListener: () => {},
      execCommand: () => true,
    },
    navigator: {
      clipboard: {
        writeText: (value) => {
          clipboard.push(String(value));
          return Promise.resolve();
        },
      },
    },
    fetch: (...args) => fetchImpl(...args),
    innerWidth: 1280,
    innerHeight: 800,
  };
  sb.window = sb;
  sb.globalThis = sb;
  sb.addEventListener = () => { added.window += 1; };
  sb.removeEventListener = () => {};
  sb.__ModuleLoader__ = {
    load: (definition) => {
      sb.plugin = definition.factory((name) => {
        if (name === 'react') return R;
        throw new Error('unexpected module ' + name);
      });
    },
  };
  vm.createContext(sb);
  vm.runInContext(raw, sb);
  return { sb, warns };
}

/* ---------------- 夹具 ---------------- */

const NOW = Date.now();
const byId = {
  hot: { id: 'hot', title: '炽热会话', updatedAt: NOW - 5 * 60000, cwd: 'D:/p/alpha' },
  run: { id: 'run', title: '运行中的会话', updatedAt: NOW - 2 * 60000, running: true, cwd: 'D:/p/alpha' },
  pinned: { id: 'pinned', title: '置顶会话', updatedAt: NOW - 20 * 60000, cwd: 'D:/p/beta' },
  untitled: { id: 'untitled', title: '', updatedAt: NOW - 3 * 60000 },
};
const sessionState = {
  ids: ['hot', 'run', 'pinned', 'untitled'],
  byId,
  projectionsBySession: {
    hot: { values: { contextTimeline: { lastUser: '完整的最近提示词' } } },
  },
};
const workspaceState = {
  archivedSessionIds: [],
  pinnedSessionIds: ['pinned'],
  items: [
    { workspaceId: 'w1', path: 'D:/p/alpha', title: 'alpha', sessionIds: ['hot', 'run'] },
    { workspaceId: 'w2', path: 'D:/p/beta', title: 'beta', sessionIds: ['pinned', 'untitled'] },
  ],
};

/* ---------------- 装配 ---------------- */

const env = createSandbox();
const regs = [];
const calls = [];

const services = {
  slots: {
    inject: (key, factory) => factory(),
    register: (options, Component) => {
      regs.push({ options, Component });
      return () => {};
    },
  },
  uiWorkspace: {
    openSession: (id) => calls.push(['open', id]),
    openWorkspace: (id) => calls.push(['openWorkspace', id]),
    startSession: (id) => calls.push(['startSession', id]),
    forkSession: (id) => {
      calls.push(['fork', id]);
      return Promise.resolve();
    },
    pinSession: (id) => {
      calls.push(['pin', id]);
      return Promise.resolve();
    },
    unpinSession: (id) => {
      calls.push(['unpin', id]);
      return Promise.resolve();
    },
    archiveSession: (id) => {
      calls.push(['archive', id]);
      return Promise.resolve();
    },
    unarchiveSession: (id) => {
      calls.push(['unarchive', id]);
      return Promise.resolve();
    },
  },
  sessions: {
    using: (id, options, fn) => {
      calls.push(['using', id]);
      const reference = {
        binding: { session: { rename: (title) => { calls.push(['rename', id, title]); return Promise.resolve(); } } },
      };
      return Promise.resolve({ ok: true, value: fn(reference) });
    },
  },
  shortcuts: { register: () => () => {}, catalog: { getSnapshot: () => [] } },
  layout: { selectPanel: () => {} },
};

const ctx = { get: (name) => services[name] };

env.sb.plugin.apply({
  get: (name) => services[name],
  effect: (fn) => { fn(); },
  inject: (deps, callback) => { callback({ ...services, get: (name) => services[name] }); },
});

const panelReg = regs.find((entry) => entry.options.name === 'main');
const injected = panelReg.options.inject();

function render(overrides) {
  const out = { texts: [], buttons: [], nodes: [], components: [], errors: [] };
  resetHooks();
  currentInstance = 'panel';
  const tree = panelReg.Component(Object.assign({}, injected, {
    ctx,
    useSessions: (selector) => selector(sessionState),
    useWorkspaces: (selector) => selector(workspaceState),
  }, overrides || {}));
  walk(tree, 'panel', out);
  currentInstance = null;
  return out;
}

function walk(node, path, out) {
  if (node === null || node === undefined || node === false) return;
  if (typeof node === 'string' || typeof node === 'number') {
    out.texts.push(String(node));
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((child, index) => walk(child, path + '/' + index, out));
    return;
  }
  if (typeof node !== 'object') return;
  out.nodes.push(node);
  if (typeof node.type === 'function') {
    const name = node.type.name || 'Anonymous';
    out.components.push({ name, type: node.type, props: node.props, path });
    const previous = currentInstance;
    currentInstance = path + ':' + name;
    let child = null;
    try {
      child = node.type(node.props);
    } catch (error) {
      out.errors.push(error);
    }
    walk(child, currentInstance, out);
    currentInstance = previous;
    return;
  }
  if (node.type === 'button') out.buttons.push(node);
  const children = node.children || [];
  children.forEach((child, index) => walk(child, path + '/' + index, out));
}

function buttonsOf(tree) {
  const out = { texts: [], buttons: [], nodes: [], components: [], errors: [] };
  walk(tree, 'sub', out);
  return out.buttons;
}

function menuOf(view) {
  return view.components.find((entry) => entry.name === 'ContextMenu' && entry.props.open);
}

function itemsOf(menu) {
  return menu ? menu.props.items : [];
}

function cardByTitle(view, title) {
  return view.buttons.find((button) => {
    const label = String(button.props['aria-label'] || '');
    return label === '打开「' + title + '」';
  });
}

function rightClick(button) {
  const event = {
    preventDefault: () => {},
    clientX: 120,
    clientY: 140,
    currentTarget: {
      getBoundingClientRect: () => ({ left: 100, right: 400, top: 120, bottom: 160 }),
    },
  };
  button.props.onContextMenu(event);
}

function flush() {
  // 双层 setImmediate：先让 fetch/json 的微任务链落地，再恢复测试
  return new Promise((resolve) => setImmediate(() => setImmediate(resolve)));
}

function reset() {
  resetInstances();
  calls.length = 0;
  clipboard.length = 0;
  clicked.length = 0;
  appended.length = 0;
  openCalls.length = 0;
  terminalCalls.length = 0;
}

/* ---------------- 断言 ---------------- */

(async function run() {
  reset();
  let view = render();
  // 应用目录是异步探测的（GET open-in-app/apps）；等它写入 state 后重新渲染
  await flush();
  await flush();
  view = render();
  check(view.errors.length === 0, '面板渲染无异常', view.errors[0] && view.errors[0].message);

  const hot = cardByTitle(view, '炽热会话');
  check(Boolean(hot), '找到会话卡片');
  check(hot && typeof hot.props.onContextMenu === 'function', '卡片挂载了右键处理');
  check(hot && typeof hot.props.onKeyDown === 'function', '卡片支持键盘打开菜单');

  rightClick(hot);
  view = render();
  let menu = menuOf(view);
  check(Boolean(menu), '右键后菜单打开');
  let items = itemsOf(menu);
  const ids = items.map((item) => item.id);
  check(ids.indexOf('open') !== -1 && ids.indexOf('copy-id') !== -1, '菜单包含打开与复制 ID');
  check(ids.indexOf('rename') !== -1 && ids.indexOf('fork') !== -1, '菜单包含重命名与分叉');
  check(ids.indexOf('download') !== -1 && ids.indexOf('archive') !== -1, '菜单包含下载与归档');
  check(ids[ids.length - 1] === 'archive', '归档排在最后（危险区）');
  check(items.some((item) => item.separatorBefore), '菜单带分组分隔');

  const untitled = cardByTitle(view, 'untitled');
  rightClick(untitled);
  view = render();
  items = itemsOf(menuOf(view));
  check(items.find((item) => item.id === 'copy-title').disabled === true, '无标题时禁用复制标题');

  const runCard = cardByTitle(view, '运行中的会话');
  rightClick(runCard);
  view = render();
  items = itemsOf(menuOf(view));
  const runArchive = items.find((item) => item.id === 'archive');
  check(runArchive.disabled === true, '运行中会话禁用归档');
  check(runArchive.hint === '正在运行，请先停止', '运行中归档显示原因');

  /* 复制 */
  reset();
  view = render();
  rightClick(cardByTitle(view, '炽热会话'));
  view = render();
  itemsOf(menuOf(view)).find((item) => item.id === 'copy-id').onSelect();
  await flush();
  check(clipboard[0] === 'hot', '复制会话 ID', clipboard[0]);

  reset();
  view = render();
  rightClick(cardByTitle(view, '炽热会话'));
  view = render();
  itemsOf(menuOf(view)).find((item) => item.id === 'copy-prompt').onSelect();
  await flush();
  check(clipboard[0] === '完整的最近提示词', '复制最近提示词取完整原文', clipboard[0]);

  reset();
  view = render();
  rightClick(cardByTitle(view, '炽热会话'));
  view = render();
  itemsOf(menuOf(view)).find((item) => item.id === 'copy-cwd').onSelect();
  await flush();
  check(clipboard[0] === 'D:/p/alpha', '复制工作目录', clipboard[0]);

  /* 置顶状态 */
  reset();
  view = render();
  rightClick(cardByTitle(view, '置顶会话'));
  view = render();
  const pinnedItem = itemsOf(menuOf(view)).find((item) => item.id === 'pin');
  check(pinnedItem.label === '取消置顶', '已置顶时文案为取消置顶', pinnedItem.label);
  pinnedItem.onSelect();
  await flush();
  check(calls.some((call) => call[0] === 'unpin' && call[1] === 'pinned'), '取消置顶调用 unpinSession');

  reset();
  view = render();
  rightClick(cardByTitle(view, '炽热会话'));
  view = render();
  itemsOf(menuOf(view)).find((item) => item.id === 'pin').onSelect();
  await flush();
  check(calls.some((call) => call[0] === 'pin' && call[1] === 'hot'), '置顶调用 pinSession');

  /* 分叉 */
  reset();
  view = render();
  rightClick(cardByTitle(view, '炽热会话'));
  view = render();
  itemsOf(menuOf(view)).find((item) => item.id === 'fork').onSelect();
  await flush();
  check(calls.some((call) => call[0] === 'fork' && call[1] === 'hot'), '分叉调用 forkSession');

  /* 归档确认 */
  reset();
  view = render();
  rightClick(cardByTitle(view, '炽热会话'));
  view = render();
  itemsOf(menuOf(view)).find((item) => item.id === 'archive').onSelect();
  view = render();
  const confirm = view.components.find((entry) => entry.name === 'ConfirmArchive' && entry.props.open);
  check(Boolean(confirm), '点击归档打开确认框');
  const confirmButtons = buttonsOf(confirm.type(confirm.props));
  const confirmButton = confirmButtons.find((button) => String((button.children && button.children[0]) || '') === '归档');
  check(Boolean(confirmButton), '确认框有归档按钮');
  confirmButton.props.onClick();
  await flush();
  check(calls.some((call) => call[0] === 'archive' && call[1] === 'hot'), '确认后调用 archiveSession');

  /* 重命名 */
  reset();
  view = render();
  rightClick(cardByTitle(view, '炽热会话'));
  view = render();
  itemsOf(menuOf(view)).find((item) => item.id === 'rename').onSelect();
  view = render();
  const rename = view.components.find((entry) => entry.name === 'RenameDialog' && entry.props.open);
  check(Boolean(rename), '点击重命名打开输入框');
  check(rename.props.value === '炽热会话', '重命名预填当前标题', rename.props.value);
  rename.props.onChange('新的标题');
  view = render();
  const rename2 = view.components.find((entry) => entry.name === 'RenameDialog' && entry.props.open);
  rename2.props.onSave();
  await flush();
  check(calls.some((call) => call[0] === 'using' && call[1] === 'hot'), '重命名走 sessions.using');
  check(calls.some((call) => call[0] === 'rename' && call[1] === 'hot' && call[2] === '新的标题'), '重命名提交新标题');

  /* 下载日志 */
  reset();
  view = render();
  rightClick(cardByTitle(view, '炽热会话'));
  view = render();
  itemsOf(menuOf(view)).find((item) => item.id === 'download').onSelect();
  await flush();
  check(clicked.indexOf('a') !== -1, '导出探测通过后触发下载链接');
  check(appended.length > 0, '下载链接挂到 body 上');

  /* 导出不可用 */
  reset();
  fetchImpl = () => Promise.resolve({ ok: false, status: 404 });
  view = render();
  rightClick(cardByTitle(view, '炽热会话'));
  view = render();
  itemsOf(menuOf(view)).find((item) => item.id === 'download').onSelect();
  await flush();
  check(clicked.indexOf('a') === -1, '导出路由 404 时不触发下载');
  view = render();
  const toast = view.components.find((entry) => entry.name === 'PanelToast').props.toast;
  check(toast && toast.tone === 'error', '导出失败给出错误提示');
  fetchImpl = defaultFetch;

  /* Escape / 键盘触发 */
  reset();
  view = render();
  rightClick(cardByTitle(view, '炽热会话'));
  view = render();
  const openMenu = menuOf(view);
  let closed = false;
  const menuProps = Object.assign({}, openMenu.props, { onClose: () => { closed = true; } });
  const menuTree = openMenu.type(menuProps);
  const menuSurface = { texts: [], buttons: [], nodes: [], components: [], errors: [] };
  walk(menuTree, 'menu', menuSurface);
  const surface = menuSurface.nodes.find((node) => node.props && node.props.role === 'menu');
  check(Boolean(surface), '菜单节点带 role=menu');
  surface.props.onKeyDown({ key: 'Escape', preventDefault: () => {} });
  check(closed === true, 'Escape 关闭菜单');

  reset();
  view = render();
  const hotCard = cardByTitle(view, '炽热会话');
  hotCard.props.onKeyDown({ key: 'F10', shiftKey: true, preventDefault: () => {} });
  view = render();
  check(Boolean(menuOf(view)), 'Shift+F10 打开菜单');

  /* 服务缺失 */
  reset();
  const savedWorkspace = services.uiWorkspace;
  services.uiWorkspace = { openSession: () => {} };
  const savedSessions = services.sessions;
  services.sessions = undefined;
  view = render();
  rightClick(cardByTitle(view, '炽热会话'));
  view = render();
  items = itemsOf(menuOf(view));
  check(items.find((item) => item.id === 'pin').disabled === true, '缺 pin 方法时禁用置顶');
  check(items.find((item) => item.id === 'rename').disabled === true, '缺 sessions 服务时禁用重命名');
  check(items.find((item) => item.id === 'fork').disabled === true, '缺 fork 方法时禁用分叉');
  services.uiWorkspace = savedWorkspace;
  services.sessions = savedSessions;

  /* 工作区卡片 */
  reset();
  view = render({ initialView: 'workspaces' });
  const groupCard = view.buttons.find((button) => String(button.props['aria-label'] || '').indexOf('打开工作区「alpha」') === 0);
  check(Boolean(groupCard), '找到工作区卡片');
  groupCard.props.onContextMenu({
    preventDefault: () => {},
    clientX: 60,
    clientY: 80,
    currentTarget: { getBoundingClientRect: () => ({ left: 40, top: 60, bottom: 90 }) },
  });
  view = render({ initialView: 'workspaces' });
  items = itemsOf(menuOf(view));
  check(items.some((item) => item.id === 'new-session'), '工作区菜单包含新开会话');
  items.find((item) => item.id === 'new-session').onSelect();
  await flush();
  check(calls.some((call) => call[0] === 'startSession' && call[1] === 'w1'), '新开会话调用 startSession');
  items.find((item) => item.id === 'copy-path').onSelect();
  await flush();
  check(clipboard.indexOf('D:/p/alpha') !== -1, '复制工作区路径');

  /* 运行中会话：热度与排序 */
  reset();
  const longState = {
    ids: ['longrun', 'newest'],
    byId: {
      longrun: { id: 'longrun', title: '长跑会话', updatedAt: Date.now() - 90 * 60000, running: true },
      newest: { id: 'newest', title: '刚聊过', updatedAt: Date.now() - 60000 },
    },
    projectionsBySession: {},
  };
  const longWorkspaces = {
    archivedSessionIds: [],
    items: [{ workspaceId: 'w', path: 'D:/w', title: 'w', sessionIds: ['longrun', 'newest'] }],
  };
  view = render({
    useSessions: (selector) => selector(longState),
    useWorkspaces: (selector) => selector(longWorkspaces),
  });
  const ordered = view.buttons.filter(
    (button) => String(button.props['aria-label'] || '').indexOf('打开「') === 0,
  );
  check(
    ordered[0] && String(ordered[0].props['aria-label']).indexOf('长跑会话') !== -1,
    '运行中的会话排在更近的空闲会话之前',
  );

  reset();
  const soloState = {
    ids: ['longrun'],
    byId: {
      longrun: { id: 'longrun', title: '长跑会话', updatedAt: Date.now() - 90 * 60000, running: true },
    },
    projectionsBySession: {},
  };
  const soloWorkspaces = {
    archivedSessionIds: [],
    items: [{ workspaceId: 'w', path: 'D:/w', title: 'w', sessionIds: ['longrun'] }],
  };
  view = render({
    useSessions: (selector) => selector(soloState),
    useWorkspaces: (selector) => selector(soloWorkspaces),
  });
  const soloMeters = view.components.filter((entry) => entry.name === 'HeatMeter');
  check(
    soloMeters.length === 1 && soloMeters[0].props.level === 5,
    '运行中的长任务仍按最高热度 5 显示',
  );

  /* 在终端中打开（不依赖 open-in-app 应用目录） */
  reset();
  view = render();
  rightClick(cardByTitle(view, '炽热会话'));
  view = render();
  const terminalItem = itemsOf(menuOf(view)).find((item) => item.id === 'terminal');
  check(Boolean(terminalItem), '菜单包含「在终端中打开」');
  check(terminalItem && terminalItem.disabled === false, '有绝对目录时终端项可用');
  check(terminalItem && terminalItem.label === '在终端中打开', '终端项文案正确');
  terminalItem.onSelect();
  await flush();
  check(terminalCalls.some((call) => call.path === 'D:/p/alpha'), 'POST activity-heat/open-terminal');

  /* 工作区的终端项 */
  reset();
  view = render({ initialView: 'workspaces' });
  const alphaCardTerminal = view.buttons.find(
    (button) => String(button.props['aria-label'] || '').indexOf('打开工作区「alpha」') === 0,
  );
  alphaCardTerminal.props.onContextMenu({
    preventDefault: () => {},
    clientX: 60,
    clientY: 80,
    currentTarget: { getBoundingClientRect: () => ({ left: 40, top: 60, bottom: 90 }) },
  });
  view = render({ initialView: 'workspaces' });
  itemsOf(menuOf(view)).find((item) => item.id === 'terminal').onSelect();
  await flush();
  check(terminalCalls.some((call) => call.path === 'D:/p/alpha'), '工作区终端路径正确');

  /* 在其他应用中打开 */
  reset();
  const appIds = ['explorer', 'vscode', 'windowsterminal', 'gitbash'];
  view = render({ initialApps: appIds });
  rightClick(cardByTitle(view, '炽热会话'));
  view = render({ initialApps: appIds });
  const openWithItem = itemsOf(menuOf(view)).find((item) => item.id === 'open-with');
  check(Boolean(openWithItem), '菜单包含「在其他应用中打开…」');
  check(openWithItem && openWithItem.disabled === false, '检测到应用后「打开方式」可用');
  check(openWithItem && Array.isArray(openWithItem.submenu), '「在其他应用中打开…」带二级菜单');
  const pickerItems = openWithItem && openWithItem.submenu ? openWithItem.submenu : [];
  const pickerLabels = pickerItems.map((item) => item.label);
  check(pickerLabels[0] === '在终端中打开', '终端固定在第一项', pickerLabels[0]);
  check(pickerLabels[1] === '在文件资源管理器中打开', '文件管理器排在其后', pickerLabels[1]);
  check(pickerLabels.indexOf('在VS Code中打开') !== -1, '编辑器在列表中');
  check(pickerLabels.indexOf('在Windows Terminal中打开') !== -1, '终端在列表中');
  check(pickerLabels.indexOf('在Git Bash中打开') === -1, 'Git Bash 不作为终端显示');
  pickerItems.find((item) => item.label === '在终端中打开').onSelect();
  await flush();
  check(terminalCalls.some((call) => call.path === 'D:/p/alpha'), '二级列表的终端项可用');
  pickerItems.find((item) => item.label === '在VS Code中打开').onSelect();
  await flush();
  check(
    openCalls.some((call) => call.app === 'vscode' && call.path === 'D:/p/alpha'),
    '调用 open-in-app/open 并带上应用与目录',
  );

  /* 工作区卡片的打开方式 */
  reset();
  view = render({ initialView: 'workspaces', initialApps: appIds });
  const alphaCard = view.buttons.find(
    (button) => String(button.props['aria-label'] || '').indexOf('打开工作区「alpha」') === 0,
  );
  check(Boolean(alphaCard), '找到工作区卡片（打开方式）');
  alphaCard.props.onContextMenu({
    preventDefault: () => {},
    clientX: 60,
    clientY: 80,
    currentTarget: { getBoundingClientRect: () => ({ left: 40, top: 60, bottom: 90 }) },
  });
  view = render({ initialView: 'workspaces', initialApps: appIds });
  const groupOpenWith = itemsOf(menuOf(view)).find((item) => item.id === 'open-with');
  const groupSubmenu = groupOpenWith && groupOpenWith.submenu ? groupOpenWith.submenu : [];
  groupSubmenu.find((item) => item.label === '在VS Code中打开').onSelect();
  await flush();
  check(
    openCalls.some((call) => call.app === 'vscode' && call.path === 'D:/p/alpha'),
    '工作区路径传给 open-in-app/open',
  );

  console.log(failed === 0 ? '\nMENU CHECK PASSED' : '\nMENU CHECK FAILED (' + failed + ')');
  process.exitCode = failed === 0 ? 0 : 1;
})();
