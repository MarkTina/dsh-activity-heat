const path = require('path');
/**
 * 回归测试：两个 bug 的根因都是"apply 在 slots 就绪前执行"。
 *   bug1：快捷键不注册（实际是整段 apply 提前 return）
 *   bug2：重启后插件不加载，必须手动开关一次
 *
 * 本测试模拟"slots 晚于 apply 就绪"，断言插件会等到服务到位后再注册，
 * 而不是永久放弃。
 */
const fs = require('fs');
const vm = require('vm');

const src = fs.readFileSync(path.join(__dirname, '..', 'client.js'), 'utf8');
let plugin;

const R = {
  createElement: (t, p, ...c) => {
    const props = p || {};
    if (c.length === 1) props.children = c[0];
    else if (c.length > 1) props.children = c;
    return { type: t, props, children: c };
  },
  useState: (v) => [typeof v === 'function' ? v() : v, () => {}],
  useEffect: () => {},
  Fragment: 'Fragment',
};
const sb = { console: { log() {}, warn() {}, error: console.error }, setInterval: () => 0, clearInterval: () => {}, Date };
sb.window = sb;
sb.__ModuleLoader__ = {
  load: (d) => {
    plugin = d.factory((n) => {
      if (n === 'react') return R;
      throw new Error('no ' + n);
    });
  },
};
vm.createContext(sb);
vm.runInContext(src, sb);

let failed = 0;
function assert(ok, label) {
  if (ok) console.log('ok  :', label);
  else {
    console.error('FAIL:', label);
    failed += 1;
  }
}

/* ---------- 场景 A：slots 晚于 apply 就绪（重启时的真实情况） ---------- */
const seatRegs = [];
const shortcutRegs = [];
let slotsReady = false;

const slotsService = {
  inject: (k, f) => f(),
  register: (o, C) => {
    seatRegs.push({ o, C });
    return () => {};
  },
};
const shortcuts = {
  register: (def) => {
    shortcutRegs.push(def);
    return () => {};
  },
};
const layout = { selectPanel: () => {} };
const services = {
  get slots() {
    return slotsReady ? slotsService : undefined;
  },
  shortcuts,
  layout,
};

const runEffect = (fn) => {
  const d = fn();
  return typeof d === 'function' ? d : () => {};
};

/** 模拟宿主：服务未就绪时不给 scope，就绪后补发一次。 */
let pendingCallbacks = [];
const ctx = {
  get: (n) => services[n],
  effect: runEffect,
  inject: (deps, cb) => {
    const missing = deps.filter((d) => services[d] === undefined);
    if (missing.length === 0) {
      cb({ ...services, get: (n) => services[n], effect: runEffect });
    } else {
      pendingCallbacks.push({ deps, cb });
      console.log('  (delayed) inject(' + deps.join(',') + ') waiting for', missing.join(','));
    }
    return () => {};
  },
};

plugin.apply(ctx);

assert(seatRegs.length === 0, 'slots 未就绪时暂时没有 seat（符合预期，没有崩溃）');
assert(shortcutRegs.length === 1, '快捷键不等 slots，apply 当场就注册了');
assert(pendingCallbacks.some((item) => item.deps.includes('slots')), 'slots 的注册被挂起等待，而不是永久放弃');
assert(pendingCallbacks.some((item) => item.deps.includes('locale')), 'locale 服务未就绪时同样挂起等待');

/* 服务就绪：宿主补发回调 */
slotsReady = true;
const waiting = pendingCallbacks;
pendingCallbacks = [];
for (const item of waiting) {
  const missing = item.deps.filter((d) => services[d] === undefined);
  if (missing.length === 0) item.cb({ ...services, get: (n) => services[n], effect: runEffect });
}

assert(
  seatRegs.map((r) => r.o.name).join(',') ===
    'sidebar.session.row.leading,sidebar.session.row.hover,sidebar.panellist,main',
  'slots 就绪后四个 seat 全部注册',
);
assert(shortcutRegs.length === 1, '快捷键没有被重复注册');

/* ---------- 场景 B：slots 一开始就绪（开关插件后的情况） ---------- */
const seatRegs2 = [];
const shortcutRegs2 = [];
const readyServices = {
  slots: {
    inject: (k, f) => f(),
    register: (o, C) => {
      seatRegs2.push({ o, C });
      return () => {};
    },
  },
  shortcuts: {
    register: (def) => {
      shortcutRegs2.push(def);
      return () => {};
    },
  },
  layout,
};
plugin.apply({
  get: (n) => readyServices[n],
  effect: runEffect,
  inject: (deps, cb) => {
    const missing = deps.filter((d) => readyServices[d] === undefined);
    if (missing.length === 0) cb({ ...readyServices, get: (n) => readyServices[n], effect: runEffect });
    return () => {};
  },
});

assert(seatRegs2.length === 4, 'slots 就绪时立即注册四个 seat');
assert(shortcutRegs2.length === 1, 'slots 就绪时快捷键也注册');
assert(shortcutRegs2[0].defaults['web:windows'].code === 'KeyH', '默认组合键为 KeyH（Ctrl+Alt+H）');

/* ---------- 场景 C：完全没有 ctx.inject（旧宿主） ---------- */
let threw = null;
try {
  plugin.apply({ get: () => undefined, effect: runEffect });
} catch (error) {
  threw = error;
}
assert(threw === null, 'ctx 没有 inject 时静默退出，不抛错');

console.log(failed === 0 ? '\nBOOT-TIMING REGRESSION PASSED' : '\nBOOT-TIMING REGRESSION FAILED (' + failed + ')');
process.exitCode = failed === 0 ? 0 : 1;
