/**
 * 纯逻辑验收：加载真实的 client.js（用最小 React 替身），不需要浏览器。
 *
 * 覆盖：
 * - 四个 seat 的注册与 id
 * - 面板：会话/工作区视图、数量选择、热度筛选、卡片内容、点击跳转
 * - 热度：连续比例、单色、主题令牌
 * - 运行中：徽标、跑马灯层、行首实心点
 * - 日志：正式模式静默、测试模式输出
 *
 * 运行：node test/panel.cjs
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

/** 用指定 DEBUG 值加载插件。 */
function load(debug) {
  let plugin = null;
  const logs = [];
  const warns = [];
  const styles = [];

  const R = {
    createElement: (t, pr, ...c) => {
      const props = pr || {};
      if (c.length === 1) props.children = c[0];
      else if (c.length > 1) props.children = c;
      return { type: t, props, children: c };
    },
    useState: (v) => [typeof v === 'function' ? v() : v, () => {}],
    useEffect: () => {},
    Fragment: 'Fragment',
  };

  const sb = {
    console: {
      log: (...a) => logs.push(a.join(' ')),
      warn: (...a) => warns.push(a.join(' ')),
      error: () => {},
    },
    setTimeout,
    clearTimeout,
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
    document: {
      head: { appendChild: (el) => styles.push(el) },
      getElementById: () => null,
      createElement: () => ({ id: '', textContent: '' }),
    },
  };
  sb.window = sb;
  sb.globalThis = sb;
  sb.__ModuleLoader__ = {
    load: (def) => {
      plugin = def.factory((name) => {
        if (name === 'react') return R;
        throw new Error('unexpected module ' + name);
      });
    },
  };

  vm.createContext(sb);
  const src = raw.replace(
    'var ACTIVITY_HEAT_DEBUG = false;',
    'var ACTIVITY_HEAT_DEBUG = ' + (debug ? 'true' : 'false') + ';',
  );
  vm.runInContext(src, sb);

  return { plugin, logs, warns, styles, R };
}

/* ---------------- 固定测试数据 ---------------- */
const NOW = Date.now();
const byId = {
  run: { id: 'run', title: '运行中的会话', updatedAt: NOW - 2 * 60000, running: true, retainedBy: { mainView: 1 } },
  hot: { id: 'hot', title: '炽热会话', updatedAt: NOW - 5 * 60000 },
  warm: { id: 'warm', title: '温热会话', updatedAt: NOW - 30 * 60000 },
  active: { id: 'active', title: '活跃会话', updatedAt: NOW - 4 * 3600000 },
  recent: { id: 'recent', title: '近期会话', updatedAt: NOW - 30 * 3600000 },
  stale: { id: 'stale', title: '陈旧会话', updatedAt: NOW - 4 * 86400000 },
  blank: { id: 'blank', title: '', blank: true, updatedAt: NOW - 1000 },
  sub: { id: 'sub', title: '子代理', origin: 'subagent', updatedAt: NOW - 1000 },
  archived: { id: 'archived', title: '已归档', updatedAt: NOW - 1000 },
};
const sessions = {
  ids: Object.keys(byId),
  byId,
  projectionsBySession: {
    run: {
      values: {
        // 提示词来源（状态栏不展示提示词，仍取 contextTimeline）
        contextTimeline: {
          counts: { turns: 12 },
          current: { total: 1520000 },
          contextWindow: 2000000,
          requests: [{ prompt: 40000, cacheRead: 30000, total: 1520000 }],
          initialPrompt: '把面板做得更好看一点',
        },
        // 与宿主 composer 状态栏同源的三份投影
        sessionStats: { turns: 14, steps: 40, totalTokens: 1520000 },
        tokenUsage: {
          uncachedInputTokens: 200000,
          cacheReadTokens: 300000,
          cacheWriteTokens: 0,
          outputTokens: 10000,
        },
        contextPressure: { projectedTokens: 800000, contextWindow: 1000000 },
      },
    },
  },
};
const workspaces = {
  archivedSessionIds: ['archived'],
  items: [
    { workspaceId: 'w1', path: 'D:/p/alpha', title: 'alpha', sessionIds: ['run', 'hot', 'warm'] },
    { workspaceId: 'w2', path: 'D:/p/beta', title: '', sessionIds: ['active', 'recent'] },
    { workspaceId: 'w3', path: 'D:/p/gamma', title: 'gamma', sessionIds: ['stale'] },
  ],
};

const panelProps = {
  useSessions: (sel) => sel(sessions),
  useWorkspaces: (sel) => sel(workspaces),
};

/** 装配一次 apply，返回注册结果与可复用上下文。 */
function boot(debug, opts) {
  const env = load(debug);
  const regs = [];
  const opened = [];
  const shortcutDefs = [];
  const layoutCalls = [];

  const services = {
    slots: {
      inject: (k, f) => f(),
      register: (o, C) => {
        regs.push({ o, C });
        return () => {};
      },
    },
    uiWorkspace: {
      openSession: (id) => opened.push('session:' + id),
      openWorkspace: (id) => opened.push('workspace:' + id),
    },
    shortcuts: {
      register: (d) => {
        shortcutDefs.push(d);
        return () => {};
      },
      catalog: { getSnapshot: () => [] },
    },
    layout: { selectPanel: (id) => layoutCalls.push(id) },
  };
  if (opts && opts.locale) services.locale = opts.locale;
  const runEffect = (fn) => {
    const d = fn();
    return typeof d === 'function' ? d : () => {};
  };

  env.plugin.apply({
    get: (n) => services[n],
    effect: runEffect,
    inject: (deps, cb) => {
      if (deps.every((d) => services[d] !== undefined)) {
        cb({ ...services, get: (n) => services[n], effect: runEffect });
      }
      return () => {};
    },
  });

  return { env, regs, opened, shortcutDefs, layoutCalls, services };
}

/** 递归展开函数组件，收集按钮、文本与指定组件 props。 */
function walk(node, out, depth) {
  if ((depth || 0) > 100 || node === null || node === undefined) return out;
  if (typeof node === 'string' || typeof node === 'number') {
    out.texts.push(String(node));
    return out;
  }
  if (Array.isArray(node)) {
    node.forEach((c) => walk(c, out, (depth || 0) + 1));
    return out;
  }
  if (typeof node !== 'object') return out;
  // 原生元素（div/span/button...）与组件都要收进 nodes，便于做结构断言
  out.nodes.push(node);
  if (typeof node.type === 'function') {
    out.components.push({ name: node.type.name, props: node.props });
    walk(node.type(node.props), out, (depth || 0) + 1);
    return out;
  }
  if (node.type === 'button') out.buttons.push(node);
  (node.children || []).forEach((c) => walk(c, out, (depth || 0) + 1));
  return out;
}
function collect(tree) {
  return walk(tree, { texts: [], buttons: [], components: [], nodes: [] }, 0);
}

/* ================= 1~5：主功能 ================= */
{
  const b = boot(false);
  const withCtx = { ...panelProps, ctx: { get: (n) => b.services[n] } };

  check(
    b.regs.map((r) => r.o.name).join(',') ===
      'sidebar.session.row.leading,sidebar.session.row.hover,sidebar.panellist,main',
    '注册四个 seat',
    b.regs.map((r) => r.o.name).join(','),
  );
  check(b.regs.find((r) => r.o.name === 'main').o.key === 'activity-heat', 'main 面板 key 与入口 id 一致');
  const panellist = b.regs.find((r) => r.o.name === 'sidebar.panellist');
  check(typeof panellist.o.label === 'function' && panellist.o.label() === '最近活跃会话', '侧栏入口名为「最近活跃会话」');
  check(panellist.o.locale === '@local/activity-heat', '侧栏入口声明 locale 命名空间');

  const panelReg = b.regs.find((r) => r.o.name === 'main');
  const injected = typeof panelReg.o.inject === 'function' ? panelReg.o.inject() : {};
  const c = collect(panelReg.C({ ...injected, ...withCtx }));
  const all = c.texts.join(' | ');
  const titled = c.buttons.filter((x) => x.props.title);

  check(all.indexOf('最近活跃会话') !== -1, '面板标题正确');
  check(all.indexOf('会话 6') !== -1, '显示会话总数 6（排除归档/子代理/空白）');
  check(all.indexOf('工作区 3') !== -1, '显示工作区总数');
  check(all.indexOf('子代理') === -1, '排除子代理会话');
  check(all.indexOf('已归档') === -1, '排除归档会话');

  const sessionCards = titled.filter((x) => String(x.props.title).indexOf('打开「') === 0);
  check(sessionCards.length === 6, '默认会话视图展示全部 6 个（默认上限 10）', sessionCards.length);

  const chips = c.buttons.filter((x) => {
    if (x.props.title) return false;
    const label = (x.children && x.children[0]) || '';
    return ['全部', '炽热', '温热', '活跃', '近期', '陈旧'].indexOf(String(label)) !== -1;
  });
  check(chips.length === 6, '热度筛选 6 档', chips.length);

  const segLabels = c.buttons.map((x) => String((x.children && x.children[0]) || ''));
  check(['10', '20', '30', '50'].every((v) => segLabels.indexOf(v) !== -1), '会话数量选项 10/20/30/50');

  check(all.indexOf('14 轮') !== -1, '轮次取宿主 sessionStats（与状态栏一致）');
  check(all.indexOf('510k tok') !== -1, 'tokens 取 tokenUsage 计费总量（与状态栏一致）');
  check(all.indexOf('缓存命中 60%') !== -1, '缓存命中率与状态栏同算法');
  check(all.indexOf('上下文 80%') !== -1, '上下文占比取 contextPressure（与状态栏一致）');
  check(all.indexOf('把面板做得更好看一点') !== -1, '显示最近提示词');
  check(all.indexOf('“') === -1, '提示词无引号');

  const wrappers = c.nodes.filter(
    (x) => x.props && typeof x.props.style === 'object' && String(x.props.style.animation || '').indexOf('ah-breathe') !== -1,
  );
  const orbits = c.nodes.filter(
    (x) => x.props && typeof x.props.style === 'object' && String(x.props.style.animation || '').indexOf('ah-orbit') !== -1,
  );
  check(wrappers.length === 1, '运行中卡片有呼吸外层', wrappers.length);
  check(orbits.length === 1, '运行中卡片有跑马灯光带', orbits.length);
  check(all.indexOf('运行中') !== -1, '显示「运行中」徽标');

  const meters = c.components.filter((x) => x.name === 'HeatMeter');
  check(meters.length > 0, '存在热度计', meters.length);
  check(meters.every((m) => typeof m.props.ratio === 'number'), '热度计都收到连续 ratio');
  const ratios = meters.map((m) => m.props.ratio);
  check(Math.max(...ratios) > 0.85, '最热的接近满格', Math.max(...ratios));
  check(Math.min(...ratios) < 0.5, '较冷的明显不满格', Math.min(...ratios));
  check(new Set(ratios.map((r) => r.toFixed(2))).size >= 4, '存在多档比例（连续刻度）');

  sessionCards[0].props.onClick();
  check(b.opened[0] && b.opened[0].indexOf('session:') === 0, '点击会话跳转', b.opened[0]);

  /* 行首热度点 */
  const rowReg = b.regs.find((r) => r.o.name === 'sidebar.session.row.leading');
  const dotOf = (id) => {
    const inj = typeof rowReg.o.inject === 'function' ? rowReg.o.inject() : {};
    const el = rowReg.C({ ...inj, sessionId: id, ...panelProps });
    if (el === null) return null;
    return typeof el.type === 'function' ? el.type(el.props) : el;
  };
  check(dotOf('run') && dotOf('run').props.title === '正在运行', '运行中的行首画实心点');
  const hotDot = dotOf('hot');
  check(hotDot && hotDot.props.style.opacity === 1, '炽热会话不透明度 1');
  check(String(hotDot.props.style.background).indexOf('--dsw-alias-brand-primary') !== -1, '热度色用主题品牌色');
  check(dotOf('archived') === null, '归档会话不画行首点');

  /* 悬停卡 */
  const hoverReg = b.regs.find((r) => r.o.name === 'sidebar.session.row.hover');
  const hoverInj = typeof hoverReg.o.inject === 'function' ? hoverReg.o.inject() : {};
  const hoverText = collect(hoverReg.C({ ...hoverInj, sessionId: 'warm', ...panelProps })).texts.join(' ');
  check(hoverText.indexOf('热度 4/5') !== -1, '悬停卡显示热度档位');
  check(hoverText.indexOf('最后活动') !== -1, '悬停卡显示最后活动');
  check(hoverText.indexOf('工作区') !== -1, '悬停卡显示工作区排名');

  /* 快捷键 */
  const sc = b.shortcutDefs[0];
  check(!!sc, '注册了快捷键');
  check(sc && sc.id === 'activity-heat.open', '快捷键 id 正确');
  check(sc && sc.label() === '最近活跃会话', '快捷键标签正确');
  check(sc && sc.defaults['web:windows'].code === 'KeyH', '默认键 KeyH');
  check(sc && sc.defaults['web:windows'].modifiers.join('+') === 'primary+alt', '修饰键 primary+alt');
  check(sc && !sc.defaults['web:linux'] && !sc.defaults['desktop:linux'], '不声明 linux profile');
  if (sc) sc.resolve({ target: null }).run();
  check(b.layoutCalls[0] === 'activity-heat', '快捷键切到面板');
}

/* ================= 6. 日志开关 ================= */
{
  const quiet = boot(false);
  check(
    quiet.env.logs.length === 0 && quiet.env.warns.length === 0,
    '正式模式完全静默',
    quiet.env.logs.length + '/' + quiet.env.warns.length,
  );

  const loud = boot(true);
  check(loud.env.logs.length > 0, '测试模式有日志输出', loud.env.logs.length);
  check(loud.env.logs.join(' ').indexOf('[activity-heat]') !== -1, '日志带统一前缀');
}

/* ================= 7. 样式注入 ================= */
{
  const b = boot(false);
  const css = b.env.styles[0] ? b.env.styles[0].textContent : '';
  check(b.env.styles.length === 1, '注入了一个 style 标签', b.env.styles.length);
  check(css.indexOf('ah-orbit') !== -1, '含跑马灯 keyframes');
  check(css.indexOf('ah-breathe') !== -1, '含呼吸 keyframes');
  check(css.indexOf('ah-pulse') !== -1, '含脉冲 keyframes');
  check(css.indexOf('prefers-reduced-motion') !== -1, '尊重减少动态偏好');
}

/* ================= 8. locale 服务 ================= */
{
  const registered = {};
  const localeService = {
    register(ns, dict) {
      registered[ns] = dict;
      return () => {};
    },
    bind(ns) {
      return (key, params) => {
        const table = (registered[ns] && registered[ns].en) || {};
        const text = table[key] !== undefined ? table[key] : key;
        return params
          ? text.replace(/\{(\w+)\}/g, (m, n) => (n in params ? String(params[n]) : m))
          : text;
      };
    },
  };

  const b = boot(false, { locale: localeService });
  const panelReg = b.regs.find((r) => r.o.name === 'main');
  const injected = typeof panelReg.o.inject === 'function' ? panelReg.o.inject() : {};
  const c = collect(panelReg.C({ ...injected, ...panelProps }));
  const all = c.texts.join(' | ');

  check(registered['@local/activity-heat'] !== undefined, 'locale: 注册了插件命名空间');
  check(all.indexOf('Recent Activity') !== -1, 'locale: 面板标题走英文');
  check(all.indexOf('Sessions 6') !== -1, 'locale: 会话计数走英文');
  check(all.indexOf('Workspaces 3') !== -1, 'locale: 工作区计数走英文');
  check(all.indexOf('Blazing') !== -1, 'locale: 热度档位走英文');

  const hoverReg = b.regs.find((r) => r.o.name === 'sidebar.session.row.hover');
  const hoverInj = typeof hoverReg.o.inject === 'function' ? hoverReg.o.inject() : {};
  const hoverText = collect(hoverReg.C({ ...hoverInj, sessionId: 'warm', ...panelProps })).texts.join(' ');
  check(hoverText.indexOf('Heat 4/5') !== -1, 'locale: 悬停卡走英文');

  const sc = b.shortcutDefs[0];
  check(sc && sc.label() === 'Recent Activity', 'locale: 快捷键标签走英文');
}

/* ================= 9. 状态栏同源 / 旧宿主回退 ================= */
{
  const b = boot(false);
  const reg = b.regs.find((r) => r.o.name === 'main');
  const injected = typeof reg.o.inject === 'function' ? reg.o.inject() : {};
  const render = (sessionState) => collect(reg.C({
    ...injected,
    useSessions: (sel) => sel(sessionState),
    useWorkspaces: (sel) => sel(workspaces),
  })).texts.join(' | ');

  /* 旧宿主：只有 contextTimeline，数字仍需显示 */
  const legacy = {
    ids: ['run'],
    byId: { run: byId.run },
    projectionsBySession: {
      run: {
        values: {
          contextTimeline: {
            counts: { turns: 12 },
            current: { total: 1520000 },
            contextWindow: 2000000,
            requests: [{ prompt: 40000, cacheRead: 30000, total: 1520000 }],
            initialPrompt: '把面板做得更好看一点',
          },
        },
      },
    },
  };
  const legacyText = render(legacy);
  check(legacyText.indexOf('12 轮') !== -1, '回退：轮次取 contextTimeline');
  check(legacyText.indexOf('1.5M tok') !== -1, '回退：tokens 取 contextTimeline');
  check(legacyText.indexOf('缓存命中 75%') !== -1, '回退：缓存命中率');
  check(legacyText.indexOf('上下文 76%') !== -1, '回退：上下文占比');

  /* 接近满命中：宿主口径不会四舍五入成 100% */
  const nearFull = {
    ids: ['run'],
    byId: { run: byId.run },
    projectionsBySession: {
      run: {
        values: {
          tokenUsage: {
            uncachedInputTokens: 1,
            cacheReadTokens: 999999,
            cacheWriteTokens: 0,
            outputTokens: 0,
          },
        },
      },
    },
  };
  const nearFullText = render(nearFull);
  check(nearFullText.indexOf('缓存命中 100%') === -1, '接近满命中不显示 100%');
  check(nearFullText.indexOf('99.9999') !== -1, '非满命中保留有效小数位');
}

console.log(failed === 0 ? '\nHARNESS PASSED' : '\nHARNESS FAILED (' + failed + ')');
process.exitCode = failed === 0 ? 0 : 1;
