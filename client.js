/**
 * @local/activity-heat — 会话热度（最近活跃）
 *
 * 架构要点：整个 factory 包在 try/catch 里。任何意外（React 缺失、宿主 API 变更、
 * 我自己的 bug）都只会让插件退化为"不显示"，绝不会向 boot 闸门抛错。
 * 这一条是整个插件最重要的约束——之前所有崩溃都源于让异常逃出 factory。
 *
 * 数据来源（宿主公开快照，非私有 API）：
 * - sessions.list.byId[id]：title / updatedAt / blank / origin / retainedBy
 * - sessions.list.projectionsBySession[id].values.contextTimeline：
 *   counts.turns、current.total、contextWindow、requests[].prompt/cacheRead
 * - workspaces.list.items[].sessionIds：会话归属
 *
 * 配色：统一用蓝色专用色阶（blue 500 档），靠不透明度表达热度。
 */
/**
 * ===== 界面字典 =====
 *
 * 界面文案的唯一来源是 `locale/zh.json` 与 `locale/en.json`（plugin manager 也从
 * 这里读 meta.title / meta.description）。浏览器侧不能直接 require JSON，所以在
 * 这里内联同一份字典，并由 `node test/locale.cjs` 强制两份内容保持一致。
 *
 * 键在运行时被扁平化：`panel.title`、`relative.minutes` 等，与
 * `ctx.locale.bind(ns)` 的插值语法 `{name}` 一致。
 */
var AH_I18N = /* AH_I18N_START */ {
  zh: {
    nav: '最近活跃会话',
    panel: {
      title: '最近活跃会话',
      sessionsCount: '会话 {count}',
      workspacesCount: '工作区 {count}',
      empty: '暂无最近活动。',
      emptyFilteredSessions: '该热度档位下暂无会话。',
      emptyFilteredWorkspaces: '该热度档位下暂无工作区。',
      emptyWorkspaces: '暂无活跃工作区。',
      moreGroups: '还有 {count} 个工作区未显示，可切换数量。',
      noHostData: '宿主未提供会话数据。',
    },
    filter: { all: '全部' },
    level: {
      hot: '炽热',
      warm: '温热',
      active: '活跃',
      recent: '近期',
      stale: '陈旧',
      cold: '冷却',
    },
    hover: {
      heat: '热度 {level}/5 · {name}',
      lastActive: '最后活动：{time}',
      workspaceRank: '工作区「{name}」排第 {rank}',
      workspaceHot: '工作区「{name}」正热',
      noData: '暂无活动记录',
    },
    dot: { tooltip: '热度 {level}/5 · {time}' },
    running: {
      label: '运行中',
      title: '该会话正在运行',
      short: '正在运行',
    },
    fact: {
      turns: '{n} 轮',
      tokens: '{n} tok',
      cache: '缓存命中 {n}%',
      context: '上下文 {n}%',
      current: '当前',
    },
    timing: {
      title: '耗时统计',
      total: '活跃时长',
      ttft: '模型等待',
      gen: '模型生成',
      reasoning: '模型思考',
      text: '模型回复',
      toolArgs: '工具参数',
      tools: '工具执行',
      other: '其他开销',
      speed: '输出速度 {tps} tok/s',
      empty: '暂无耗时数据',
    },
    group: { sessions: '{count} 个会话' },
    workspace: {
      untitled: '未命名工作区',
      ungrouped: '未分组',
      ungroupedTitle: '未分组会话',
    },
    card: {
      openSessionTitle: '打开「{title}」',
      openWorkspaceTitle: '打开工作区「{name}」',
    },
    sidebar: { rowLabel: '热点', hoverLabel: '热度' },
    shortcut: { label: '最近活跃会话' },
    relative: {
      now: '刚刚',
      minutes: '{n} 分钟前',
      hours: '{n} 小时前',
      yesterday: '昨天',
      days: '{n} 天前',
      weeks: '{n} 周前',
      longAgo: '很久以前',
      unknown: '未知',
    },
  },
  en: {
    nav: 'Recent Activity',
    panel: {
      title: 'Recent Activity',
      sessionsCount: 'Sessions {count}',
      workspacesCount: 'Workspaces {count}',
      empty: 'No recent activity.',
      emptyFilteredSessions: 'No sessions in this heat band.',
      emptyFilteredWorkspaces: 'No workspaces in this heat band.',
      emptyWorkspaces: 'No active workspaces.',
      moreGroups: '{count} more workspaces are hidden — raise the count to show them.',
      noHostData: 'Session data is not available.',
    },
    filter: { all: 'All' },
    level: {
      hot: 'Blazing',
      warm: 'Warm',
      active: 'Active',
      recent: 'Recent',
      stale: 'Stale',
      cold: 'Cold',
    },
    hover: {
      heat: 'Heat {level}/5 · {name}',
      lastActive: 'Last active: {time}',
      workspaceRank: 'Workspace “{name}” ranks #{rank}',
      workspaceHot: 'Workspace “{name}” is hot',
      noData: 'No activity recorded',
    },
    dot: { tooltip: 'Heat {level}/5 · {time}' },
    running: {
      label: 'Running',
      title: 'This session is running',
      short: 'Running',
    },
    fact: {
      turns: '{n} turns',
      tokens: '{n} tok',
      cache: 'Cache hit {n}%',
      context: 'context {n}%',
      current: 'Current',
    },
    timing: {
      title: 'Time breakdown',
      total: 'Active time',
      ttft: 'Model wait',
      gen: 'Generation',
      reasoning: 'Thinking',
      text: 'Reply',
      toolArgs: 'Tool arguments',
      tools: 'Tool run',
      other: 'Other',
      speed: '{tps} tok/s',
      empty: 'No timing data',
    },
    group: { sessions: '{count} sessions' },
    workspace: {
      untitled: 'Untitled workspace',
      ungrouped: 'Ungrouped',
      ungroupedTitle: 'Ungrouped sessions',
    },
    card: {
      openSessionTitle: 'Open “{title}”',
      openWorkspaceTitle: 'Open workspace “{name}”',
    },
    sidebar: { rowLabel: 'Heat', hoverLabel: 'Heat' },
    shortcut: { label: 'Recent Activity' },
    relative: {
      now: 'just now',
      minutes: '{n} min ago',
      hours: '{n} h ago',
      yesterday: 'yesterday',
      days: '{n} d ago',
      weeks: '{n} w ago',
      longAgo: 'a long time ago',
      unknown: 'unknown',
    },
  },
} /* AH_I18N_END */;

/**
 * ===== 调试开关 =====
 * 硬编码的测试模式。默认 false：所有诊断日志都不输出（正式版行为）。
 * 排查问题时把它改成 true，然后刷新页面，控制台会打印完整链路日志。
 */
var ACTIVITY_HEAT_DEBUG = false;

/** 仅测试模式下输出；正式版完全静默。 */
function ahLog() {
  if (!ACTIVITY_HEAT_DEBUG) return;
  try {
    console.log.apply(console, ['[activity-heat]'].concat([].slice.call(arguments)));
  } catch (ignored) {}
}

/** 仅测试模式下输出 warning；正式版完全静默。 */
function ahWarn() {
  if (!ACTIVITY_HEAT_DEBUG) return;
  try {
    console.warn.apply(console, ['[activity-heat]'].concat([].slice.call(arguments)));
  } catch (ignored) {}
}

window.__ModuleLoader__.load({
  id: '@local/activity-heat',
  factory(require) {
    'use strict';

    try {
      return build(require);
    } catch (error) {
      // 关键防线：factory 永不抛出。
      ahWarn('[activity-heat] factory failed, plugin disabled:', error && error.message);
      return { apply: function noop() {} };
    }
  },
});

function build(require) {
  var React;
  try {
    React = require('react');
  } catch (error) {
    ahWarn('[activity-heat] React unavailable:', error && error.message);
    return { apply: function noop() {} };
  }

  var MINUTE = 60000;
  var HOUR = 60 * MINUTE;
  var DAY = 24 * HOUR;

  /** 字典命名空间，与 package name 一致（宿主按此注册与绑定）。 */
  var NS = '@local/activity-heat';

  /** 把嵌套字典压成 `a.b.c` 形式的平表，供 t() 与 ctx.locale 使用。 */
  function flattenDict(source, prefix, out) {
    var result = out || {};
    var head = prefix ? prefix + '.' : '';
    for (var key in source) {
      if (!Object.prototype.hasOwnProperty.call(source, key)) continue;
      var value = source[key];
      var path = head + key;
      if (value && typeof value === 'object') flattenDict(value, path, result);
      else result[path] = value;
    }
    return result;
  }

  var ZH = flattenDict(AH_I18N.zh, '', {});
  var EN = flattenDict(AH_I18N.en, '', {});

  /** 替换 `{name}` 占位符。 */
  function formatText(text, params) {
    if (!params) return text;
    return String(text).replace(/\{(\w+)\}/g, function (match, name) {
      return Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match;
    });
  }

  /** 宿主 locale 的绑定翻译函数；服务不可用时为 null，tt() 退回内置中文。 */
  var activeT = null;

  /** main slot 里当前是否显示着本插件的面板（用于快捷键二次切换）。 */
  var panelVisible = false;

  /** 运行中徽标：官方鲸尾图（assets/active.png 的内联副本），由 CSS 做循环摆动。 */
  var ACTIVE_TAIL = 'data:image/png;base64,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';

  /**
   * 界面文案统一入口。宿主 locale 服务可用时走它的字典（随语言切换实时更新），
   * 否则退回随包的中文字典——测试与降级场景都保持可读的文案。
   */
  function tt(key, params) {
    if (activeT) {
      try {
        var translated = activeT(key, params);
        if (translated !== undefined && translated !== null && translated !== key) return translated;
      } catch (ignored) { /* 字典异常时退回内置中文 */ }
    }
    var fallback = Object.prototype.hasOwnProperty.call(ZH, key) ? ZH[key] : key;
    return formatText(fallback, params);
  }

  /** 单色热度：同一主题色，用不透明度表达冷热。索引即等级。 */
  var HEAT_ALPHA = [0, 0.28, 0.4, 0.56, 0.76, 1];
  var LEVEL_KEYS = ['cold', 'stale', 'recent', 'active', 'warm', 'hot'];
  // 蓝色色阶令牌在 light/dark 下都可用；不再用偏黑的 brand 令牌（读起来发闷）。
  // 注意：不要用 --dsw-alias-state-business-primary，宿主主题里没有这个令牌。
  // 热量主色：宿主的 brand 令牌在浅色主题下偏黑，读起来发闷；优先取蓝色色阶令牌，
  // 最后才退回 brand。
  var HEAT_INK = 'var(--color-blue-500, #3b82f6)';

  var LEVELS = [
    { max: 10 * MINUTE, level: 5 },
    { max: HOUR, level: 4 },
    { max: 6 * HOUR, level: 3 },
    { max: DAY, level: 2 },
    { max: 7 * DAY, level: 1 },
  ];

  var UI = {
    padX: 18,
    radius: 10,
    cardBg: 'var(--dsw-alias-bg-layer-1, rgba(127,127,127,0.06))',
    cardBgHover: 'var(--dsw-alias-bg-layer-2, rgba(127,127,127,0.12))',
    border: '1px solid var(--dsw-alias-border-l1, rgba(127,127,127,0.18))',
    textPrimary: 'var(--dsw-alias-label-primary)',
    textSecondary: 'var(--dsw-alias-label-secondary)',
    textTertiary: 'var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary))',
  };

  var FILTERS = [
    { id: 'all', labelKey: 'filter.all', level: null },
    { id: 'hot', labelKey: 'level.hot', level: 5 },
    { id: 'warm', labelKey: 'level.warm', level: 4 },
    { id: 'active', labelKey: 'level.active', level: 3 },
    { id: 'recent', labelKey: 'level.recent', level: 2 },
    { id: 'stale', labelKey: 'level.stale', level: 1 },
  ];

  /* ---------------- 纯函数 ---------------- */

  function heatLevelOf(elapsedMs) {
    if (typeof elapsedMs !== 'number' || !isFinite(elapsedMs)) return 0;
    for (var i = 0; i < LEVELS.length; i += 1) {
      if (elapsedMs <= LEVELS[i].max) return LEVELS[i].level;
    }
    return 0;
  }

  /**
   * 连续热度比例 0..1：把"距今多久"映射成可部分填充的刻度。
   * 分段线性，让每个档位内部也有可见差异（不再总是满格）。
   */
  function heatRatioOf(elapsedMs) {
    if (typeof elapsedMs !== 'number' || !isFinite(elapsedMs)) return 0;
    var age = Math.max(0, elapsedMs);
    if (age <= 10 * MINUTE) return 0.92 + 0.08 * (1 - age / (10 * MINUTE));
    if (age <= HOUR) return 0.72 + 0.2 * (1 - (age - 10 * MINUTE) / (HOUR - 10 * MINUTE));
    if (age <= 6 * HOUR) return 0.5 + 0.22 * (1 - (age - HOUR) / (5 * HOUR));
    if (age <= DAY) return 0.3 + 0.2 * (1 - (age - 6 * HOUR) / (18 * HOUR));
    if (age <= 7 * DAY) return 0.08 + 0.22 * (1 - (age - DAY) / (6 * DAY));
    return 0;
  }

  function heatAlphaOf(level) {
    return HEAT_ALPHA[Math.max(0, Math.min(5, level || 0))];
  }

  function heatNameOf(level) {
    return tt('level.' + LEVEL_KEYS[Math.max(0, Math.min(5, level || 0))]);
  }

  function lastActiveOf(summary) {
    if (!summary || typeof summary !== 'object') return undefined;
    var raw = summary.updatedAt;
    if (typeof raw === 'number' && isFinite(raw)) return raw;
    if (typeof raw === 'string') {
      var parsed = Date.parse(raw);
      return isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  }

  function relativeOf(ms, now) {
    if (typeof ms !== 'number') return '';
    var delta = Math.max(0, now - ms);
    if (delta < MINUTE) return tt('relative.now');
    if (delta < HOUR) return tt('relative.minutes', { n: Math.floor(delta / MINUTE) });
    if (delta < DAY) return tt('relative.hours', { n: Math.floor(delta / HOUR) });
    if (delta < 2 * DAY) return tt('relative.yesterday');
    if (delta < 7 * DAY) return tt('relative.days', { n: Math.floor(delta / DAY) });
    return tt('relative.weeks', { n: Math.floor(delta / (7 * DAY)) });
  }

  function titleOf(summary, id) {
    if (!summary || summary.blank === true) return '';
    var title = summary.displayTitle || summary.title || '';
    return typeof title === 'string' ? title.trim() : '';
  }

  function basenameOf(value) {
    if (typeof value !== 'string' || value === '') return '';
    var parts = value.split(/[\\/]+/).filter(Boolean);
    return parts.length > 0 ? parts[parts.length - 1] : '';
  }

  /**
   * 紧凑数字：1.2k / 612k / 1.2M / 3.4B。
   *
   * 关键：先按数值定单位，再看四舍五入后是否"进位到下一个单位"。
   * 例如 999999 若直接 (v/1000).toFixed(0) 会得到 "1000k"，
   * 这里会被提升为 "1M"；1e9 以上用 B，避免出现 "1234.6M" 这种难读的写法。
   */
  function compactNumber(value) {
    var n = typeof value === 'number' ? value : Number(value);
    if (!isFinite(n) || n <= 0) return '';
    if (n < 1000) return String(Math.round(n));

    var UNITS = [
      { limit: 1e3, div: 1, suffix: '' },
      { limit: 1e6, div: 1e3, suffix: 'k' },
      { limit: 1e9, div: 1e6, suffix: 'M' },
      { limit: Infinity, div: 1e9, suffix: 'B' },
    ];

    for (var i = 0; i < UNITS.length; i += 1) {
      if (n >= UNITS[i].limit) continue;
      var scaled = n / UNITS[i].div;
      // 小于 10 保留 1 位小数（1.2k），否则取整（612k）
      var text = scaled < 10
        ? String(Math.round(scaled * 10) / 10)
        : String(Math.round(scaled));
      // 四舍五入后达到 1000，说明该进位了，交给下一个单位
      if (Number(text) >= 1000 && UNITS[i + 1]) continue;
      return text + UNITS[i].suffix;
    }
    return String(Math.round(n));
  }

  function snippetOf(value, n) {
    if (typeof value !== 'string') return '';
    var line = value.replace(/\s+/g, ' ').trim();
    if (line === '') return '';
    return line.length > n ? line.slice(0, n) + '…' : line;
  }

  /**
   * 缓存命中率的显示取整，与宿主 composer 用量 pill 完全同算法：
   * 整百分比四舍五入，但「非满命中」绝不四舍五入成 100。
   */
  function roundedPercentUnits(cacheReadTokens, denominator, decimalPlaces) {
    var scale = (decimalPlaces === 0 ? 1 : 10) * 100;
    var doubledScale = scale * 2;
    var denominatorQuotient = Math.floor(denominator / doubledScale);
    var denominatorRemainder = denominator % doubledScale;
    var lower = 0;
    var upper = scale;
    while (lower < upper) {
      var candidate = Math.floor((lower + upper + 1) / 2);
      var factor = candidate * 2 - 1;
      if (cacheReadTokens >= factor * denominatorQuotient
        + Math.ceil(factor * denominatorRemainder / doubledScale)) lower = candidate;
      else upper = candidate - 1;
    }
    return lower;
  }

  function displayPercentUnits(units, decimalPlaces) {
    if (decimalPlaces === 0) return String(units);
    var whole = Math.floor(units / 10);
    var tenths = units % 10;
    return tenths === 0 ? String(whole) : whole + '.' + tenths;
  }

  /** 返回宿主状态栏同款缓存命中率文本；无计费输入时返回 undefined。 */
  function cacheHitTextOf(cacheReadTokens, promptTokens) {
    if (!(promptTokens > 0)) return undefined;
    if (cacheReadTokens >= promptTokens) return '100';
    var roundedUnits = roundedPercentUnits(cacheReadTokens, promptTokens, 0);
    if (roundedUnits < 100) return displayPercentUnits(roundedUnits, 0);

    var distinguishingPlaces = 1;
    var scaledDoubleGap = (promptTokens - cacheReadTokens) * 200;
    var denominatorTens = Math.floor(promptTokens / 10);
    while (scaledDoubleGap <= denominatorTens) {
      scaledDoubleGap *= 10;
      distinguishingPlaces += 1;
    }
    var denominatorOnes = promptTokens % 10;
    var roundedLoss = 5;
    for (var loss = 1; loss < 5; loss += 1) {
      var factor = loss * 2 + 1;
      var threshold = factor * denominatorTens + Math.floor(factor * denominatorOnes / 10);
      if (scaledDoubleGap <= threshold) {
        roundedLoss = loss;
        break;
      }
    }
    return '99.' + new Array(distinguishingPlaces).join('9') + (10 - roundedLoss);
  }

  function numberAt(source, key) {
    if (!source || typeof source !== 'object') return undefined;
    var value = source[key];
    return typeof value === 'number' && isFinite(value) ? value : undefined;
  }

  /**
   * 读取 `contextTimeline.timing`（与 dsh-context 的「耗时统计」同源），
   * 按它的口径把活跃时长切成 等待 / 生成（思考·回复·工具参数）/ 工具执行 / 其他。
   */
  function timingOf(timeline) {
    var raw = timeline && timeline.timing;
    if (!raw || typeof raw !== 'object') return undefined;
    var wall = numberAt(raw, 'wallMs');
    if (wall === undefined || wall <= 0) return undefined;
    var ttft = Math.min(numberAt(raw, 'ttftMs') || 0, wall);
    var gen = Math.max(0, Math.min(numberAt(raw, 'genMs') || 0, wall - ttft));
    var tools = Math.max(0, Math.min(numberAt(raw, 'toolsMs') || 0, wall - ttft - gen));
    return {
      wallMs: wall,
      ttftMs: ttft,
      genMs: gen,
      toolsMs: tools,
      otherMs: Math.max(0, wall - ttft - gen - tools),
      reasoningMs: numberAt(raw, 'reasoningMs') || 0,
      textMs: numberAt(raw, 'textMs') || 0,
      toolArgMs: numberAt(raw, 'toolArgMs') || 0,
      calls: numberAt(raw, 'calls') || 0,
      toolCalls: numberAt(raw, 'toolCalls') || 0,
      speedMs: numberAt(raw, 'speedMs') || 0,
      speedTokens: numberAt(raw, 'speedTokens') || 0,
    };
  }

  /**
   * 从会话投影读轮次 / tokens / 缓存命中率 / 上下文占比 / 提示词。
   *
   * 前三项必须与 **宿主 composer 底部状态栏** 同源，否则两边数字对不上：
   * - 轮次：`sessionStats.turns`
   * - tokens：`tokenUsage` 的三个计费输入桶 + 输出（整段日志累计）
   * - 缓存命中：`tokenUsage.cacheReadTokens / 计费输入`
   * - 上下文占比：`contextPressure.projectedTokens ?? pressureTokens / contextWindow`
   * 提示词仍来自 `contextTimeline`（状态栏不展示提示词）。
   * 宿主未提供这些投影时，回退到旧版 `contextTimeline` 的字段。
   */
  function factsFromProjection(projections) {
    var out = {};
    try {
      var values = projections && projections.values;
      if (!values || typeof values !== 'object') return out;

      var timeline = values.contextTimeline;
      if (timeline && typeof timeline === 'object') {
        var prompt = snippetOf(timeline.initialPrompt, 60)
          || snippetOf(timeline.lastUser, 60)
          || (timeline.lastReply ? snippetOf(timeline.lastReply.text, 60) : '');
        if (prompt) out.prompt = prompt;
        var timing = timingOf(timeline);
        if (timing) out.timing = timing;
      }

      var fromStatusBar = false;

      var stats = values.sessionStats;
      if (stats && typeof stats === 'object') {
        var statsTurns = numberAt(stats, 'turns');
        if (statsTurns !== undefined && statsTurns > 0) {
          out.turns = statsTurns;
          fromStatusBar = true;
        }
      }

      var usage = values.tokenUsage;
      if (usage && typeof usage === 'object') {
        var uncached = numberAt(usage, 'uncachedInputTokens') || 0;
        var cacheRead = numberAt(usage, 'cacheReadTokens') || 0;
        var cacheWrite = numberAt(usage, 'cacheWriteTokens') || 0;
        var output = numberAt(usage, 'outputTokens') || 0;
        var billed = uncached + cacheRead + cacheWrite;
        if (billed > 0 || output > 0) {
          out.tokens = billed + output;
          fromStatusBar = true;
        }
        var cacheText = cacheHitTextOf(cacheRead, billed);
        if (cacheText !== undefined) out.cacheRate = cacheText;
      }

      var pressure = values.contextPressure;
      if (pressure && typeof pressure === 'object') {
        var used = numberAt(pressure, 'projectedTokens');
        if (used === undefined) used = numberAt(pressure, 'pressureTokens');
        var pressureWindow = numberAt(pressure, 'contextWindow');
        if (used !== undefined && used >= 0 && pressureWindow !== undefined && pressureWindow > 0) {
          out.contextPct = Math.max(0, Math.min(100, Math.round((used / pressureWindow) * 100)));
          fromStatusBar = true;
        }
      }

      // 旧宿主兜底：只提供 contextTimeline 时保持原有字段语义。
      if (!fromStatusBar && timeline && typeof timeline === 'object') {
        var counts = timeline.counts;
        var legacyTurns = counts && typeof counts.turns === 'number'
          ? counts.turns
          : (typeof timeline.turns === 'number' ? timeline.turns : undefined);
        if (typeof legacyTurns === 'number' && legacyTurns > 0) out.turns = legacyTurns;

        var current = timeline.current;
        var requests = Array.isArray(timeline.requests) ? timeline.requests : [];
        var lastRequest = requests.length > 0 ? requests[requests.length - 1] : undefined;
        var legacyTokens = current && typeof current.total === 'number'
          ? current.total
          : (lastRequest && typeof lastRequest.total === 'number' ? lastRequest.total : undefined);
        if (typeof legacyTokens === 'number' && legacyTokens > 0) out.tokens = legacyTokens;

        var legacyWindow = numberAt(timeline, 'contextWindow');
        if (legacyWindow !== undefined && legacyWindow > 0 && typeof legacyTokens === 'number' && legacyTokens >= 0) {
          out.contextPct = Math.max(0, Math.min(100, Math.round((legacyTokens / legacyWindow) * 100)));
        }

        var cacheSource = lastRequest && typeof lastRequest.prompt === 'number'
          ? lastRequest
          : (timeline.last && typeof timeline.last.prompt === 'number' ? timeline.last : undefined);
        if (cacheSource && cacheSource.prompt > 0 && typeof cacheSource.cacheRead === 'number') {
          var legacyCache = cacheHitTextOf(cacheSource.cacheRead, cacheSource.prompt);
          if (legacyCache !== undefined) out.cacheRate = legacyCache;
        }
      }
    } catch (error) {
      /* 投影结构未知时静默降级 */
    }
    return out;
  }

  function compareByRecency(a, b) {
    var av = a.at === undefined ? -1 : a.at;
    var bv = b.at === undefined ? -1 : b.at;
    if (bv !== av) return bv - av;
    return String(a.id).localeCompare(String(b.id));
  }

  /** 派生活动模型。 */
  function buildModel(sessionState, workspaceState, now, topCount, groupCount) {
    var limitTop = typeof topCount === 'number' && topCount > 0 ? topCount : 8;
    var limitGroups = typeof groupCount === 'number' && groupCount > 0 ? groupCount : 20;
    var ids = sessionState && Array.isArray(sessionState.ids) ? sessionState.ids : [];
    var byId = (sessionState && sessionState.byId) || {};
    var projections = (sessionState && sessionState.projectionsBySession) || {};
    var archivedList = workspaceState && Array.isArray(workspaceState.archivedSessionIds)
      ? workspaceState.archivedSessionIds
      : [];
    var items = workspaceState && Array.isArray(workspaceState.items) ? workspaceState.items : [];

    var archivedOf = {};
    for (var a = 0; a < archivedList.length; a += 1) archivedOf[String(archivedList[a])] = true;

    var workspaceOf = {};
    for (var w = 0; w < items.length; w += 1) {
      var item = items[w];
      if (!item || !Array.isArray(item.sessionIds)) continue;
      for (var s = 0; s < item.sessionIds.length; s += 1) {
        workspaceOf[String(item.sessionIds[s])] = item;
      }
    }

    var sessions = [];
    for (var i = 0; i < ids.length; i += 1) {
      var id = ids[i];
      if (archivedOf[String(id)]) continue;
      var summary = byId[id];
      if (!summary || summary.origin === 'subagent') continue;
      var at = lastActiveOf(summary);
      var facts = factsFromProjection(projections[id]);
      sessions.push({
        id: id,
        title: titleOf(summary, id),
        blank: summary.blank === true,
        at: at,
        level: at === undefined ? 0 : heatLevelOf(now - at),
        ratio: at === undefined ? 0 : heatRatioOf(now - at),
        workspace: workspaceOf[String(id)] || null,
        open: Boolean(summary.retainedBy && summary.retainedBy.mainView > 0),
        running: summary.running === true,
        turns: facts.turns,
        tokens: facts.tokens,
        prompt: facts.prompt,
        cacheRate: facts.cacheRate,
        contextPct: facts.contextPct,
        timing: facts.timing,
      });
    }
    sessions.sort(compareByRecency);

    var groups = {};
    var groupList = [];
    for (var g = 0; g < sessions.length; g += 1) {
      var session = sessions[g];
      if (session.blank || session.at === undefined) continue;
      var key = session.workspace ? String(session.workspace.workspaceId) : '\u0000ungrouped';
      var group = groups[key];
      if (!group) {
        group = {
          key: key,
          workspaceId: session.workspace ? session.workspace.workspaceId : undefined,
          workspace: session.workspace,
          label: session.workspace
            ? (session.workspace.title || basenameOf(session.workspace.path) || String(session.workspace.workspaceId))
            : tt('workspace.ungrouped'),
          level: 0,
          ratio: 0,
          at: undefined,
          count: 0,
          tokens: 0,
          running: false,
        };
        groups[key] = group;
        groupList.push(group);
      }
      group.count += 1;
      if (session.running === true) group.running = true;
      if (typeof session.tokens === 'number') group.tokens += session.tokens;
      if (group.at === undefined || (session.at !== undefined && session.at > group.at)) {
        group.at = session.at;
        group.level = session.level;
        group.ratio = session.ratio;
      }
    }

    groupList.sort(function (x, y) {
      if (y.level !== x.level) return y.level - x.level;
      return (y.at || 0) - (x.at || 0);
    });

    var rankOf = {};
    for (var r = 0; r < groupList.length; r += 1) rankOf[groupList[r].key] = r + 1;

    var withTime = [];
    for (var t = 0; t < sessions.length; t += 1) {
      if (sessions[t].at !== undefined && !sessions[t].blank) withTime.push(sessions[t]);
    }

    var cold = 0;
    for (var c = 0; c < groupList.length; c += 1) {
      if (groupList[c].level <= 1) cold += 1;
    }

    return {
      total: withTime.length,
      allSessions: withTime,
      top: withTime.slice(0, limitTop),
      groups: groupList,
      shownGroups: groupList.slice(0, limitGroups),
      rankOf: rankOf,
      hottest: withTime.length > 0 ? withTime[0].level : 0,
      workspaceCount: items.length,
      coldCount: cold,
    };
  }

  /* ---------------- 组件 ---------------- */

  /**
   * 热度计：一根加粗的横向轨道，内部按比例填充。
   * 同时用两件事表达热度：
   * 1. 填充宽度（刻度比例，来自 heatRatioOf，不再是"满格或空"）；
   * 2. 填充颜色深浅（越热越实、越冷越淡）。
   * @param props.ratio - 0..1 连续比例
   * @param props.level - 0..5 档位（决定色深与文字）
   * @param props.showLabel - 是否在右侧显示档位文字
   * @param props.width - 轨道宽度，默认 64
   */
  function HeatMeter(props) {
    var level = Math.max(0, Math.min(5, (props && props.level) || 0));
    var ratio = typeof props.ratio === 'number' ? Math.max(0, Math.min(1, props.ratio)) : heatAlphaOf(level);
    var showLabel = props && props.showLabel === true;
    var width = props && typeof props.width === 'number' ? props.width : 76;
    var height = props && typeof props.height === 'number' ? props.height : 10;
    // 色深：同一主题蓝，用 opacity 表达冷热（0.28 → 1）
    var fillOpacity = 0.3 + ratio * 0.7;
    var ticks = [];
    // 5 个刻度分隔线，帮助读出"填充到第几格"
    for (var t = 1; t <= 4; t += 1) {
      ticks.push(React.createElement('span', {
        key: 'tick' + t,
        style: {
          position: 'absolute',
          left: (t * 20) + '%',
          top: 0,
          bottom: 0,
          width: 1,
          background: 'var(--dsw-alias-bg-layer-1, rgba(0,0,0,0.35))',
          opacity: 0.5,
        },
      }));
    }
    var track = React.createElement(
      'span',
      {
        style: {
          position: 'relative',
          display: 'block',
          width: width,
          height: height,
          borderRadius: 999,
          background: 'var(--dsw-alias-border-l1, rgba(127,127,127,0.22))',
          overflow: 'hidden',
          flex: 'none',
        },
      },
      React.createElement('span', {
        style: {
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: Math.round(ratio * 100) + '%',
          background: HEAT_INK,
          opacity: fillOpacity,
          borderRadius: 999,
          transition: 'width 200ms ease, opacity 200ms ease',
        },
      }),
      ticks,
    );

    return React.createElement(
      'span',
      { style: { display: 'inline-flex', alignItems: 'center', gap: 8, flex: 'none' } },
      track,
      showLabel
        ? React.createElement('span', {
            style: {
              fontSize: '0.74em',
              lineHeight: '18px',
              color: UI.textSecondary,
              opacity: 0.55 + ratio * 0.45,
              // 固定宽度 + 右对齐：档位字长短不同也不会推着轨道左右晃
              width: 30,
              textAlign: 'right',
              flex: 'none',
            },
          }, heatNameOf(level))
        : null,
    );
  }

  function RowHeatDot(props) {
    var level = Math.max(0, Math.min(5, (props && props.level) || 0));
    if (level <= 0) return null;
    var filled = level >= 4;
    return React.createElement('span', {
      title: props && props.title,
      'aria-hidden': 'true',
      style: {
        display: 'inline-block',
        flex: 'none',
        width: 7 + level,
        height: 7 + level,
        borderRadius: '50%',
        boxSizing: 'border-box',
        background: filled ? HEAT_INK : 'transparent',
        border: filled ? 'none' : '1.5px solid ' + HEAT_INK,
        opacity: heatAlphaOf(level),
      },
    });
  }

  function HeatRing(props) {
    var size = props && typeof props.size === 'number' && props.size > 0 ? props.size : 18;
    var level = Math.max(1, Math.min(5, (props && props.level) || 1));
    var active = props && props.active === true;
    var alpha = heatAlphaOf(level);
    return React.createElement(
      'span',
      {
        'aria-hidden': 'true',
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size,
          height: size,
          flex: 'none',
          position: 'relative',
        },
      },
      React.createElement('span', {
        style: {
          position: 'absolute',
          width: Math.round(size * 0.92),
          height: Math.round(size * 0.92),
          borderRadius: '50%',
          border: '1.5px solid ' + HEAT_INK,
          opacity: active ? Math.min(1, alpha * 0.7 + 0.2) : alpha * 0.45,
          boxSizing: 'border-box',
        },
      }),
      React.createElement('span', {
        style: {
          display: 'block',
          width: Math.max(4, Math.round(size * (0.26 + level * 0.06))),
          height: Math.max(4, Math.round(size * (0.26 + level * 0.06))),
          borderRadius: '50%',
          background: HEAT_INK,
          opacity: active ? 1 : alpha,
        },
      }),
    );
  }

  /**
   * 迷你进度条：4px 高的小轨道，按比例填充。
   * 缓存命中率与上下文占比除了数字之外，再给一段长度可读。
   */
  function MiniMeter(props) {
    var ratio = typeof props.ratio === 'number' && isFinite(props.ratio)
      ? Math.max(0, Math.min(1, props.ratio))
      : 0;
    var width = typeof props.width === 'number' ? props.width : 44;
    return React.createElement(
      'span',
      {
        'aria-hidden': 'true',
        style: {
          position: 'relative',
          display: 'inline-block',
          width: width,
          height: 4,
          marginLeft: 2,
          borderRadius: 999,
          background: 'var(--dsw-alias-border-l1, rgba(127,127,127,0.22))',
          overflow: 'hidden',
          flex: 'none',
          verticalAlign: 'middle',
        },
      },
      React.createElement('span', {
        style: {
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: Math.round(ratio * 100) + '%',
          background: props.color || HEAT_INK,
          opacity: 0.9,
          borderRadius: 999,
        },
      }),
    );
  }

  /** 上下文占比分档色：宽裕=蓝，偏高=琥珀，接近上限=红。 */
  function contextMeterColor(pct) {
    if (typeof pct !== 'number') return HEAT_INK;
    if (pct >= 85) return 'var(--dsw-alias-state-error-primary, #ef4444)';
    if (pct >= 60) return 'var(--dsw-alias-state-warn-primary, #f59e0b)';
    return HEAT_INK;
  }

  /**
   * 指标图标：统一 12px、1.3 描边、currentColor 的线条画风。
   * 用 SVG 而不是 emoji——emoji 会带彩色和不同的字重，和周围文字不在一个体系里。
   */
  function MetricIcon(props) {
    var name = props && props.name;
    var common = {
      width: 12,
      height: 12,
      viewBox: '0 0 12 12',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 1.3,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      'aria-hidden': 'true',
      style: { display: 'block' },
    };
    var inner;
    if (name === 'turns') {
      inner = [
        React.createElement('path', { key: 'arc', d: 'M9.8 6.2A4 4 0 1 1 6 2' }),
        React.createElement('path', { key: 'head', d: 'M6 0.6 8.6 2 6 3.6' }),
      ];
    } else if (name === 'tokens') {
      inner = React.createElement('path', { d: 'M6 1.4 10.6 6 6 10.6 1.4 6z' });
    } else if (name === 'cache') {
      inner = React.createElement('path', { d: 'M6.8 1 2.8 6.6h2.5L5.2 11l4-5.8H6.6z' });
    } else if (name === 'context') {
      inner = [
        React.createElement('rect', { key: 'box', x: 1.6, y: 1.6, width: 8.8, height: 8.8, rx: 1.4 }),
        React.createElement('path', { key: 'ticks', d: 'M6 3.4v5.2M3.4 6h5.2' }),
      ];
    } else if (name === 'duration') {
      inner = [
        React.createElement('circle', { key: 'dial', cx: 6, cy: 6, r: 4.4 }),
        React.createElement('path', { key: 'hand', d: 'M6 3.5V6l1.8 1.3' }),
      ];
    } else {
      inner = React.createElement('circle', { cx: 6, cy: 6, r: 2.6, stroke: 'none', fill: 'currentColor' });
    }
    return React.createElement('svg', common, inner);
  }

  /** 累计时长文本：12s / 46m20s / 1h12m。 */
  function pad2(value) {
    return value < 10 ? '0' + value : String(value);
  }

  function durationText(ms) {
    if (typeof ms !== 'number' || !isFinite(ms) || ms <= 0) return '';
    var total = Math.round(ms / 1000);
    if (total < 60) return total + 's';
    var mins = Math.floor(total / 60);
    var secs = total % 60;
    if (mins < 60) return mins + 'm' + (secs > 0 ? pad2(secs) + 's' : '');
    var hours = Math.floor(mins / 60);
    var rest = mins % 60;
    return hours + 'h' + (rest > 0 ? pad2(rest) + 'm' : '');
  }

  /** 耗时分段，口径与 dsh-context 的「耗时统计」一致。 */
  function timingSegments(timing) {
    var segs = [];
    segs.push({
      key: 'ttft',
      label: tt('timing.ttft'),
      ms: timing.ttftMs,
      color: 'var(--color-blue-500, #3b82f6)',
    });
    var detailed = timing.reasoningMs > 0 || timing.textMs > 0 || timing.toolArgMs > 0;
    if (detailed) {
      var used = 0;
      var push = function (key, label, ms, color) {
        var take = Math.max(0, Math.min(ms, timing.genMs - used));
        if (take > 0) segs.push({ key: key, label: label, ms: take, color: color });
        used += take;
      };
      push('reasoning', tt('timing.reasoning'), timing.reasoningMs, 'var(--color-violet-500, #8b5cf6)');
      push('text', tt('timing.text'), timing.textMs, 'var(--color-pink-500, #ec4899)');
      push('toolarg', tt('timing.toolArgs'), timing.toolArgMs, 'var(--color-amber-500, #f59e0b)');
    } else if (timing.genMs > 0) {
      segs.push({ key: 'gen', label: tt('timing.gen'), ms: timing.genMs, color: 'var(--color-violet-500, #8b5cf6)' });
    }
    if (timing.toolsMs > 0) {
      segs.push({ key: 'tools', label: tt('timing.tools'), ms: timing.toolsMs, color: 'var(--color-teal-500, #14b8a6)' });
    }
    if (timing.otherMs > 0) {
      segs.push({ key: 'other', label: tt('timing.other'), ms: timing.otherMs, color: 'var(--color-slate-400, #94a3b8)' });
    }
    return segs;
  }

  /** 悬浮卡：活跃时长 + 环形分布 + 图例 + 时间轴。 */
  function TimingCard(props) {
    var timing = props.timing;
    var anchor = props.anchor || {};
    var width = 300;
    var viewportWidth = typeof window !== 'undefined' && window.innerWidth ? window.innerWidth : 1280;
    var left = typeof anchor.left === 'number' ? anchor.left : 24;
    if (left + width > viewportWidth - 12) left = viewportWidth - width - 12;
    if (left < 12) left = 12;
    var above = typeof anchor.top === 'number' && anchor.top > 300;
    var top = above ? anchor.top - 8 : (typeof anchor.bottom === 'number' ? anchor.bottom + 8 : 120);

    var segments = timingSegments(timing);
    var wall = timing.wallMs || 1;

    var stop = 0;
    var parts = [];
    for (var i = 0; i < segments.length; i += 1) {
      var seg = segments[i];
      var from = stop / wall * 360;
      stop += seg.ms;
      var to = stop / wall * 360;
      parts.push(seg.color + ' ' + from + 'deg ' + to + 'deg');
    }

    var speed = timing.speedMs > 0 && timing.speedTokens >= 0
      ? Math.round(timing.speedTokens / (timing.speedMs / 1000))
      : null;

    var rows = segments.map(function (row) {
      var pct = Math.round(row.ms / wall * 100);
      return React.createElement('div', {
        key: row.key,
        style: { display: 'flex', alignItems: 'center', gap: 6, lineHeight: '18px', fontSize: 11.5 },
      },
        React.createElement('span', { style: { width: 8, height: 8, borderRadius: 2, background: row.color, flex: 'none' } }),
        React.createElement('span', {
          style: {
            color: UI.textSecondary, flex: '1 1 auto', minWidth: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          },
        }, row.label),
        React.createElement('span', { style: { color: UI.textPrimary, fontVariantNumeric: 'tabular-nums' } }, durationText(row.ms)),
        React.createElement('span', {
          style: { color: UI.textTertiary, fontVariantNumeric: 'tabular-nums', width: 34, textAlign: 'right' },
        }, pct + '%'),
      );
    });

    var strip = React.createElement('div', {
      'aria-hidden': 'true',
      style: { display: 'flex', gap: 1, height: 6, borderRadius: 999, overflow: 'hidden', marginTop: 10 },
    }, segments.map(function (row) {
      return React.createElement('span', {
        key: row.key,
        style: { flexGrow: row.ms, flexBasis: 0, background: row.color },
      });
    }));

    return React.createElement('div', {
      style: {
        position: 'fixed',
        left: left,
        top: top,
        transform: above ? 'translateY(-100%)' : 'none',
        width: width,
        zIndex: 1200,
        padding: '12px 14px',
        borderRadius: 10,
        background: 'var(--dsw-alias-bg-base, #ffffff)',
        border: '1px solid var(--dsw-alias-border-l1, rgba(127,127,127,0.22))',
        boxShadow: '0 8px 28px rgba(0,0,0,0.16)',
        color: UI.textPrimary,
        pointerEvents: 'none',
      },
    },
      React.createElement('div', { style: { display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 } },
        React.createElement('span', { style: { fontSize: '0.8em', fontWeight: 600 } }, tt('timing.title')),
        React.createElement('span', { style: { color: UI.textTertiary, fontSize: '0.72em' } }, tt('timing.total')),
        React.createElement('span', {
          style: { marginLeft: 'auto', fontVariantNumeric: 'tabular-nums', fontSize: '0.86em', fontWeight: 600 },
        }, durationText(wall)),
        speed !== null
          ? React.createElement('span', { style: { color: UI.textTertiary, fontSize: '0.72em' } }, tt('timing.speed', { tps: speed }))
          : null,
      ),
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 12 } },
        React.createElement('span', {
          'aria-hidden': 'true',
          style: {
            position: 'relative',
            flex: 'none',
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'conic-gradient(' + (parts.length ? parts.join(',') : 'transparent 0deg 360deg') + ')',
          },
        },
          React.createElement('span', {
            style: {
              position: 'absolute',
              inset: 10,
              borderRadius: '50%',
              background: 'var(--dsw-alias-bg-base, #ffffff)',
            },
          }),
        ),
        React.createElement('div', {
          style: { flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 },
        }, rows),
      ),
      strip,
    );
  }

  /** 累计对话时长胶囊：悬浮时展开耗时分布卡。 */
  function DurationChip(props) {
    var state = React.useState(null);
    var anchor = state[0];
    var setAnchor = state[1];
    var ref = React.useRef ? React.useRef(null) : { current: null };

    var show = function () {
      var el = ref.current;
      if (!el || typeof el.getBoundingClientRect !== 'function') return;
      var box = el.getBoundingClientRect();
      setAnchor({ left: box.left, top: box.top, bottom: box.bottom });
    };
    var hide = function () { setAnchor(null); };

    return React.createElement('span', {
      ref: ref,
      onMouseEnter: show,
      onMouseLeave: hide,
      onFocus: show,
      onBlur: hide,
      style: { display: 'inline-flex', alignItems: 'center', gap: 3, cursor: 'help' },
    },
      React.createElement(MetricIcon, { name: 'duration' }),
      durationText(props.timing.wallMs),
      anchor ? React.createElement(TimingCard, { timing: props.timing, anchor: anchor }) : null,
    );
  }

  function MetaChip(props) {
    return React.createElement(
      'span',
      {
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 3,
          padding: 0,
          lineHeight: '20px',
          fontSize: '0.86em',
          color: UI.textSecondary,
          background: 'transparent',
          border: 'none',
          flex: 'none',
        },
      },
      props && props.icon ? React.createElement('span', { style: { opacity: 0.6, display: 'inline-flex' } }, props.icon) : null,
      props && props.children,
    );
  }

  /**
   * 「运行中」标识：品牌色脉冲圆点 + 文字。
   * 表示"此刻还在跑"，与"最近活动过"的热度是两回事，所以用描边胶囊独立表达。
   */
  function RunningBadge(props) {
    var compact = props && props.compact === true;
    return React.createElement(
      'span',
      {
        title: tt('running.title'),
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: compact ? '0 4px' : '0 6px',
          borderRadius: 4,
          fontSize: compact ? '0.7em' : '0.74em',
          lineHeight: '18px',
          color: HEAT_INK,
          border: '1px solid ' + HEAT_INK,
          background: 'transparent',
          fontWeight: 600,
          flex: 'none',
        },
      },
      React.createElement('img', {
        src: ACTIVE_TAIL,
        alt: '',
        'aria-hidden': 'true',
        width: 18,
        height: 18,
        style: {
          display: 'block',
          width: 18,
          height: 18,
          transformOrigin: '55% 65%',
          animation: 'ah-tail 1.8s ease-in-out infinite',
          filter: 'drop-shadow(0 0 3px color-mix(in srgb, var(--color-blue-500, #3b82f6) 70%, transparent))',
        },
      }),
      tt('running.label'),
    );
  }

  function FilterBar(props) {
    var active = props && props.active;
    var counts = (props && props.counts) || {};
    var onPick = props && props.onPick;
    return React.createElement(
      'div',
      { style: { display: 'flex', flexWrap: 'wrap', gap: 6, padding: '4px ' + UI.padX + 'px 10px' } },
      FILTERS.map(function (filter) {
        var picked = active === filter.id;
        var count = counts[filter.id] || 0;
        return React.createElement(
          'button',
          {
            key: filter.id,
            type: 'button',
            onClick: function () { if (onPick) onPick(filter.id); },
            style: {
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 10px',
              borderRadius: 999,
              border: picked ? '1px solid ' + HEAT_INK : '1px solid var(--dsw-alias-border-l1, rgba(127,127,127,0.22))',
              background: picked ? 'color-mix(in srgb, var(--color-blue-500, #3b82f6) 12%, transparent)' : 'transparent',
              color: picked ? HEAT_INK : UI.textSecondary,
              fontSize: '0.8em',
              lineHeight: '18px',
              cursor: 'pointer',
              font: 'inherit',
              fontWeight: picked ? 600 : 400,
              opacity: count === 0 && !picked ? 0.5 : 1,
            },
          },
          tt(filter.labelKey),
          React.createElement('span', { style: { fontSize: '0.92em', opacity: 0.65 } }, String(count)),
        );
      }),
    );
  }

  /**
   * 运行中卡片的通用外框：2px 缝里露出环绕跑马灯，外层同时呼吸发光。
   * 会话卡片与工作区卡片共用这一份，保证两处的动效完全一致。
   */
  function RunningFrame(props) {
    return React.createElement(
      'div',
      {
        style: {
          position: 'relative',
          margin: '0 0 8px',
          padding: 1.5,
          borderRadius: UI.radius,
          overflow: 'hidden',
          background: 'var(--dsw-alias-bg-base, #ffffff)',
          animation: 'ah-breathe 2.4s ease-in-out infinite',
          isolation: 'isolate',
        },
      },
      // 跑马灯光带：尺寸取 200%，绕中心旋转，只有边缘 2px 会露出来
      React.createElement('span', {
        'aria-hidden': 'true',
        style: {
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: '220%',
          height: '220%',
          marginLeft: '-110%',
          marginTop: '-110%',
          background:
            'conic-gradient(from 0deg,' +
            ' transparent 0deg, transparent 250deg,' +
            ' color-mix(in srgb, var(--color-blue-500, #3b82f6) 72%, transparent) 310deg,' +
            ' color-mix(in srgb, var(--color-blue-500, #3b82f6) 20%, transparent) 335deg,' +
            ' transparent 360deg)',
          animation: 'ah-orbit 2.2s linear infinite',
          pointerEvents: 'none',
          zIndex: 0,
        },
      }),
      props.children,
    );
  }

  function SessionCard(props) {
    var hoverState = React.useState(false);
    var hover = hoverState[0];
    var setHover = hoverState[1];
    var session = props.session;
    var now = props.now;

    // 所属工作区移到卡片右侧；左侧 meta 只保留时间与用量
    var workspaceName = session.workspace
      ? (session.workspace.title || basenameOf(session.workspace.path) || tt('workspace.untitled'))
      : '';

    // 信息顺序：两个百分比在前，用量居中，相对时间收到最右
    var meta = [];
    if (session.cacheRate !== undefined && session.cacheRate !== '') {
      var cachePct = Number(session.cacheRate);
      meta.push(React.createElement(MetaChip, { key: 'cache', icon: React.createElement(MetricIcon, { name: 'cache' }) },
        tt('fact.cache', { n: session.cacheRate }),
        React.createElement(MiniMeter, {
          ratio: isFinite(cachePct) ? cachePct / 100 : 0,
          color: HEAT_INK,
        }),
      ));
    }
    if (typeof session.contextPct === 'number') {
      meta.push(React.createElement(MetaChip, { key: 'ctx', icon: React.createElement(MetricIcon, { name: 'context' }) },
        tt('fact.context', { n: session.contextPct }),
        React.createElement(MiniMeter, {
          ratio: session.contextPct / 100,
          color: contextMeterColor(session.contextPct),
        }),
      ));
    }
    if (typeof session.turns === 'number') {
      meta.push(React.createElement(MetaChip, { key: 'turns', icon: React.createElement(MetricIcon, { name: 'turns' }) }, tt('fact.turns', { n: session.turns })));
    }
    if (typeof session.tokens === 'number') {
      meta.push(React.createElement(MetaChip, { key: 'tokens', icon: React.createElement(MetricIcon, { name: 'tokens' }) }, tt('fact.tokens', { n: compactNumber(session.tokens) })));
    }
    if (session.timing && typeof session.timing.wallMs === 'number' && session.timing.wallMs > 0) {
      meta.push(React.createElement(DurationChip, { key: 'dur', timing: session.timing }));
    }
    if (session.open) {
      meta.push(React.createElement(MetaChip, { key: 'open', icon: React.createElement(MetricIcon, { name: 'current' }) }, tt('fact.current')));
    }

    var metaRow = [];
    for (var i = 0; i < meta.length; i += 1) {
      if (i > 0) metaRow.push(React.createElement('span', { key: 'sep' + i, style: { opacity: 0.35 } }, '·'));
      metaRow.push(meta[i]);
    }
    // 相对时间单独收尾：不加分隔符，用 auto margin 贴到行尾
    metaRow.push(React.createElement('span', {
      key: 'at',
      style: { marginLeft: 'auto', paddingLeft: 10, minWidth: 58, textAlign: 'right', whiteSpace: 'nowrap', opacity: 0.9 },
    }, relativeOf(session.at, now)));

    var children = [
      React.createElement('span', {
        key: 'bar',
        style: {
          flex: 'none',
          // 加粗的竖向热度条：宽度从 3px 提到 6px，圆角同步
          width: 6,
          alignSelf: 'stretch',
          borderRadius: 3,
          marginLeft: 8,
          background: HEAT_INK,
          opacity: 0.3 + (typeof session.ratio === 'number' ? session.ratio : heatAlphaOf(session.level)) * 0.7,
        },
      }),
      React.createElement(
        'span',
        { key: 'body', style: { display: 'flex', flexDirection: 'column', gap: 3, flex: '1 1 auto', minWidth: 0 } },
        React.createElement(
          'span',
          { style: { display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 } },
          session.running ? React.createElement(RunningBadge, null) : null,
          React.createElement('span', {
            style: {
              color: UI.textPrimary,
              fontWeight: 500,
              fontSize: '0.94em',
              lineHeight: '20px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            },
          }, session.title || session.id),
        ),
        session.prompt
          ? React.createElement('span', {
              style: {
                color: UI.textSecondary,
                fontSize: '0.78em',
                lineHeight: '16px',
                opacity: 0.75,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              },
            }, session.prompt)
          : null,
        React.createElement('span', {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: UI.textSecondary,
            fontSize: '0.86em',
            lineHeight: '22px',
            flexWrap: 'wrap',
          },
        }, metaRow),
      ),
      React.createElement(
        'span',
        {
          key: 'right',
          style: {
            flex: 'none',
            width: 168,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            alignSelf: 'stretch',
            paddingTop: 1,
            paddingBottom: 1,
          },
        },
        // 第一行固定给工作区名，第二行固定给热度计：两行分别对齐标题行与 meta 行
        workspaceName
          ? React.createElement('span', {
              style: {
                width: '100%',
                textAlign: 'right',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '0.76em',
                lineHeight: '18px',
                color: UI.textTertiary,
              },
            }, workspaceName)
          : React.createElement('span', { style: { lineHeight: '18px' } }),
        React.createElement(HeatMeter, { level: session.level, ratio: session.ratio, showLabel: true, width: 96, height: 10 }),
      ),
    ];

    var running = session.running === true;

    var buttonStyle = {
      display: 'flex',
      alignItems: 'stretch',
      gap: 12,
      width: '100%',
      padding: '10px 14px 10px 0',
      // 运行中时由外层容器控制间距和边框，按钮自身不再留 margin
      margin: running ? 0 : '0 0 8px',
      border: running ? 'none' : UI.border,
      borderRadius: running ? Math.max(2, UI.radius - 2) : UI.radius,
      // 运行中的卡片必须是实底；hover 的浅蓝用叠加渐变，不碰底色透明度
      background: running ? 'var(--dsw-alias-bg-base, #ffffff)' : (hover ? UI.cardBgHover : UI.cardBg),
      backgroundImage: running && hover
        ? 'linear-gradient(rgba(59,130,246,0.07), rgba(59,130,246,0.07))'
        : 'none',
      cursor: 'pointer',
      textAlign: 'left',
      font: 'inherit',
      color: 'inherit',
      overflow: 'hidden',
      transition: 'background 120ms ease',
      position: 'relative',
      zIndex: 1,
    };

    var cardButton = React.createElement(
      'button',
      {
        type: 'button',
        onClick: props.onClick,
        onMouseEnter: function () { setHover(true); },
        onMouseLeave: function () { setHover(false); },
        onFocus: function () { setHover(true); },
        onBlur: function () { setHover(false); },
        title: tt('card.openSessionTitle', { title: session.title || session.id }),
        style: buttonStyle,
      },
      children,
    );

    // 非运行中：保持原样，不引入任何额外 DOM
    if (!running) return cardButton;

    // 运行中：与会话卡片共用同一套外框（跑马灯 + 呼吸发光）
    return React.createElement(RunningFrame, null, cardButton);
  }

  function GroupCard(props) {
    var hoverState = React.useState(false);
    var hover = hoverState[0];
    var setHover = hoverState[1];
    var group = props.group;
    var now = props.now;
    var rank = props.rank;
    var openable = group.workspaceId !== undefined;
    var running = group.running === true;

    var metaBits = [tt('group.sessions', { count: group.count }), relativeOf(group.at, now)];
    if (group.tokens > 0) metaBits.push(tt('fact.tokens', { n: compactNumber(group.tokens) }));

    var cardButton = React.createElement(
      'button',
      {
        type: 'button',
        disabled: !openable,
        onClick: props.onClick,
        onMouseEnter: function () { setHover(true); },
        onMouseLeave: function () { setHover(false); },
        onFocus: function () { setHover(true); },
        onBlur: function () { setHover(false); },
        title: openable ? tt('card.openWorkspaceTitle', { name: group.label }) : tt('workspace.ungroupedTitle'),
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          width: '100%',
          padding: '12px 16px',
          // 运行中时由外层容器控制间距和边框，按钮自身不再留 margin
          margin: running ? 0 : '0 0 10px',
          border: running ? 'none' : UI.border,
          borderRadius: running ? Math.max(2, UI.radius - 2) : UI.radius,
          // 关键：按钮必须在跑马灯之上（定位 + z-index），否则旋转的色带会盖在卡片上。
          position: running ? 'relative' : undefined,
          zIndex: running ? 1 : undefined,
          overflow: 'hidden',
          // 运行中的卡片必须是实底；hover 的浅蓝用叠加渐变，不碰底色透明度
          background: running ? 'var(--dsw-alias-bg-base, #ffffff)' : (hover && openable ? UI.cardBgHover : UI.cardBg),
          backgroundImage: running && hover
            ? 'linear-gradient(rgba(59,130,246,0.07), rgba(59,130,246,0.07))'
            : 'none',
          cursor: openable ? 'pointer' : 'default',
          textAlign: 'left',
          font: 'inherit',
          color: 'inherit',
          transition: 'background 120ms ease',
        },
      },
      React.createElement('span', {
        key: 'bar',
        style: {
          flex: 'none',
          width: 6,
          alignSelf: 'stretch',
          borderRadius: 3,
          background: HEAT_INK,
          opacity: 0.3 + (typeof group.ratio === 'number' ? group.ratio : heatAlphaOf(group.level)) * 0.7,
        },
      }),
      React.createElement(
        'span',
        { key: 'body', style: { display: 'flex', flexDirection: 'column', gap: 2, flex: '1 1 auto', minWidth: 0 } },
        React.createElement('span', {
          style: { display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 },
        },
          running ? React.createElement(RunningBadge, { compact: true }) : null,
          React.createElement('span', {
            style: {
              color: UI.textPrimary,
              fontWeight: 500,
              fontSize: '0.98em',
              lineHeight: '22px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            },
          }, group.label),
        ),
        React.createElement('span', { style: { color: UI.textTertiary, fontSize: '0.8em', lineHeight: '18px' } }, metaBits.join(' · ')),
      ),
      React.createElement(
        'span',
        { key: 'right', style: { flex: 'none', display: 'flex', alignItems: 'center', gap: 10 } },
        React.createElement(HeatMeter, { level: group.level, ratio: group.ratio, showLabel: true, width: 100, height: 11 }),
        React.createElement('span', {
          style: {
            flex: 'none',
            minWidth: 26,
            padding: '1px 6px',
            borderRadius: 6,
            fontSize: '0.74em',
            lineHeight: '20px',
            textAlign: 'center',
            color: UI.textSecondary,
            background: 'var(--dsw-alias-bg-layer-1, rgba(127,127,127,0.08))',
            border: '1px solid var(--dsw-alias-border-l1, rgba(127,127,127,0.18))',
            opacity: rank <= 3 ? 1 : 0.6,
          },
        }, '#' + rank),
      ),
    );

    // 工作区里有正在跑的会话时，与会话卡片使用同一套运行中动效
    if (!running) return cardButton;
    return React.createElement(RunningFrame, null, cardButton);
  }

  function useMinuteTick() {
    var state = React.useState(0);
    React.useEffect(function () {
      var timer = setInterval(function () { state[1](function (v) { return v + 1; }); }, 60000);
      return function () { clearInterval(timer); };
    }, []);
    return state[0];
  }

  /** 分段切换控件：一组胶囊，选中项实底。 */
  function Segmented(props) {
    var options = props && props.options ? props.options : [];
    var value = props && props.value;
    var onChange = props && props.onChange;
    var compact = props && props.compact === true;
    return React.createElement(
      'span',
      { style: { display: 'inline-flex', alignItems: 'center', gap: 2, flex: 'none' } },
      options.map(function (option) {
        var picked = value === option.value;
        return React.createElement(
          'button',
          {
            key: String(option.value),
            type: 'button',
            onClick: function () { if (onChange) onChange(option.value); },
            style: {
              padding: compact ? '1px 7px' : '3px 9px',
              borderRadius: 6,
              border: '1px solid ' + (picked ? 'transparent' : 'var(--dsw-alias-border-l1, rgba(127,127,127,0.22))'),
              background: picked ? HEAT_INK : 'transparent',
              color: picked ? 'var(--dsw-alias-bg-base, #ffffff)' : UI.textSecondary,
              fontSize: compact ? '0.74em' : '0.78em',
              lineHeight: compact ? '16px' : '18px',
              cursor: 'pointer',
              font: 'inherit',
              fontWeight: picked ? 600 : 400,
            },
          },
          option.label,
        );
      }),
    );
  }

  function ActivityPanel(props) {
    var useSessions = props && props.useSessions;
    var useWorkspaces = props && props.useWorkspaces;
    // 首次渲染的视图；宿主不传时默认会话视图（测试可直接从工作区视图进入）
    var initialView = props && props.initialView === 'workspaces' ? 'workspaces' : 'sessions';
    // 面板挂载期间才显示在 main slot；快捷键靠这个标记做「进入 / 返回」二次切换。
    React.useEffect(function () {
      panelVisible = true;
      return function () { panelVisible = false; };
    }, []);
    useMinuteTick();

    // 顶层：会话 / 工作区 两种对象切换
    var viewState = React.useState(initialView);
    var view = viewState[0];
    var setView = viewState[1];
    // 数量：会话 10/20/30/50，工作区 5/10/20
    var topState = React.useState(10);
    var topCount = topState[0];
    var setTopCount = topState[1];
    var groupState = React.useState(5);
    var groupCount = groupState[0];
    var setGroupCount = groupState[1];
    // 热度筛选（两种视图共用）
    var filterState = React.useState('all');
    var filter = filterState[0];
    var setFilter = filterState[1];

    // 列表滚动：隐藏原生滚动条，靠右侧的浮动提示告诉用户还能上下滑。
    var listRef = React.useRef ? React.useRef(null) : { current: null };
    var scrollState = React.useState(false);
    var canScroll = scrollState[0];
    var setCanScroll = scrollState[1];
    React.useEffect(function () {
      var el = listRef.current;
      if (!el) return undefined;
      var measure = function () {
        setCanScroll(el.scrollHeight > el.clientHeight + 4);
      };
      measure();
      var cleanups = [];
      if (typeof window !== 'undefined' && window.addEventListener) {
        window.addEventListener('resize', measure);
        cleanups.push(function () { window.removeEventListener('resize', measure); });
      }
      if (typeof ResizeObserver !== 'undefined') {
        var observer = new ResizeObserver(measure);
        observer.observe(el);
        cleanups.push(function () { observer.disconnect(); });
      }
      return function () {
        for (var i = 0; i < cleanups.length; i += 1) cleanups[i]();
      };
    }, [view, filter, topCount, groupCount]);

    var now = Date.now();

    if (!useSessions || !useWorkspaces) {
      return React.createElement('div', {
        style: { padding: '16px ' + UI.padX + 'px', color: UI.textSecondary },
      }, tt('panel.noHostData'));
    }

    var sessionState = useSessions(function (state) { return state; });
    var workspaceState = useWorkspaces(function (state) { return state; });
    // 一次性构建全量，两个视图按需切片，避免切换时重算两遍
    var model = buildModel(sessionState, workspaceState, now, topCount, groupCount);
    var uiWorkspace = props && props.ctx ? props.ctx.get('uiWorkspace') : undefined;

    function openSession(sessionId) {
      try {
        if (uiWorkspace && typeof uiWorkspace.openSession === 'function') uiWorkspace.openSession(sessionId);
        else ahWarn('[activity-heat] uiWorkspace.openSession unavailable');
      } catch (error) {
        ahWarn('[activity-heat] openSession failed:', error && error.message);
      }
    }

    function openWorkspace(workspaceId) {
      try {
        if (workspaceId !== undefined && uiWorkspace && typeof uiWorkspace.openWorkspace === 'function') {
          uiWorkspace.openWorkspace(workspaceId);
        }
      } catch (error) {
        ahWarn('[activity-heat] openWorkspace failed:', error && error.message);
      }
    }

    /** 当前视图的数据源（按数量上限切片后再按热度筛选）。 */
    var allRows = view === 'sessions'
      ? model.allSessions.slice(0, topCount)
      : model.groups.slice(0, groupCount);

    var wanted = null;
    if (filter !== 'all') {
      for (var q = 0; q < FILTERS.length; q += 1) {
        if (FILTERS[q].id === filter) wanted = FILTERS[q].level;
      }
    }
    var rows = wanted === null
      ? allRows
      : allRows.filter(function (row) { return row.level === wanted; });

    var counts = { all: allRows.length };
    for (var f = 0; f < FILTERS.length; f += 1) {
      if (FILTERS[f].level === null) continue;
      var lv = FILTERS[f].level;
      counts[FILTERS[f].id] = allRows.filter(function (row) { return row.level === lv; }).length;
    }

    ahLog('[activity-heat] panel view=' + view + ' rows=' + rows.length + '/' + allRows.length +
      ' totalSessions=' + model.total + ' groups=' + model.groups.length + ' filter=' + filter);

    /* ---------- 顶部：标题 + 对象切换 ---------- */
    var header = React.createElement('div', {
      key: 'head',
      style: { display: 'flex', alignItems: 'center', gap: 10, padding: '16px ' + UI.padX + 'px 8px' },
    },
      React.createElement('div', { style: { fontWeight: 650, fontSize: '1.05em', color: UI.textPrimary } }, tt('panel.title')),
      React.createElement(Segmented, {
        options: [
          { value: 'sessions', label: tt('panel.sessionsCount', { count: model.total }) },
          { value: 'workspaces', label: tt('panel.workspacesCount', { count: model.workspaceCount }) },
        ],
        value: view,
        onChange: setView,
      }),
      React.createElement('span', { style: { flex: '1 1 auto' } }),
      // 数量切换：会话 10/20/30/50，工作区 5/10/20
      React.createElement(Segmented, {
        compact: true,
        options: view === 'sessions'
          ? [{ value: 10, label: '10' }, { value: 20, label: '20' }, { value: 30, label: '30' }, { value: 50, label: '50' }]
          : [{ value: 5, label: '5' }, { value: 10, label: '10' }, { value: 20, label: '20' }],
        value: view === 'sessions' ? topCount : groupCount,
        onChange: function (value) {
          if (view === 'sessions') setTopCount(value);
          else setGroupCount(value);
        },
      }),
    );

    /* ---------- 热度筛选 ---------- */
    var filterBar = React.createElement(FilterBar, {
      key: 'filters',
      active: filter,
      counts: counts,
      onPick: setFilter,
    });

    /* ---------- 列表 ---------- */
    var cards = [];
    if (view === 'sessions') {
      cards = rows.map(function (session) {
        return React.createElement(SessionCard, {
          key: session.id,
          session: session,
          now: now,
          onClick: function () { openSession(session.id); },
        });
      });
    } else {
      cards = rows.map(function (group) {
        return React.createElement(GroupCard, {
          key: 'g-' + group.key,
          group: group,
          now: now,
          rank: model.rankOf[group.key],
          onClick: function () { openWorkspace(group.workspaceId); },
        });
      });
    }

    var emptyText = filter !== 'all'
      ? tt(view === 'sessions' ? 'panel.emptyFilteredSessions' : 'panel.emptyFilteredWorkspaces')
      : tt(view === 'sessions' ? 'panel.empty' : 'panel.emptyWorkspaces');

    var emptyHint = React.createElement('div', {
      style: { padding: '8px 0 14px', fontSize: '0.82em', color: UI.textTertiary },
    }, emptyText);

    // 隐藏原生滚动条（.ah-list 由 ensureStyles 注入），右侧浮标提示可以上下滑动。
    var scrollHint = canScroll
      ? React.createElement('span', {
          'aria-hidden': 'true',
          style: {
            position: 'absolute',
            right: 4,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            padding: '7px 4px',
            borderRadius: 999,
            background: 'var(--dsw-alias-bg-layer-2, rgba(127,127,127,0.12))',
            border: '1px solid var(--dsw-alias-border-l1, rgba(127,127,127,0.18))',
            color: UI.textTertiary,
            pointerEvents: 'none',
            opacity: 0.92,
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          },
        },
          React.createElement('span', { style: { fontSize: 10, lineHeight: '10px' } }, '⌃'),
          React.createElement('span', {
            style: { width: 1, height: 12, background: 'currentColor', opacity: 0.35 },
          }),
          React.createElement('span', { style: { fontSize: 10, lineHeight: '10px' } }, '⌄'),
        )
      : null;

    var list = React.createElement('div', {
      key: 'list',
      style: { position: 'relative', display: 'flex', flexDirection: 'column', minHeight: 0, flex: '1 1 auto' },
    },
      React.createElement('div', {
        ref: listRef,
        className: 'ah-list',
        style: {
          // 块级流：卡片保持自身高度，数量多时滚动而不是被 flex 压扁
          display: 'block',
          padding: '0 ' + UI.padX + 'px',
          maxHeight: 'calc(100vh - 236px)',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
        },
      }, cards.length > 0 ? cards : emptyHint),
      scrollHint,
    );

    var footer = null;
    if (view === 'workspaces' && filter === 'all' && model.groups.length > groupCount) {
      footer = React.createElement('div', {
        key: 'more',
        style: { padding: '2px ' + UI.padX + 'px 10px', fontSize: '0.76em', color: UI.textTertiary },
      }, tt('panel.moreGroups', { count: model.groups.length - groupCount }));
    }

    return React.createElement('div', {
      style: { display: 'flex', flexDirection: 'column', paddingBottom: 16 },
    }, [header, filterBar, list, footer]);
  }

  function SessionRowHeat(props) {
    var sessionId = props && props.sessionId;
    if (!sessionId) return null;
    useMinuteTick();
    var useSessions = props && props.useSessions;
    var useWorkspaces = props && props.useWorkspaces;
    var summary = useSessions
      ? useSessions(function (state) { return state && state.byId ? state.byId[sessionId] : undefined; })
      : undefined;
    var archived = useWorkspaces
      ? useWorkspaces(function (state) {
          return state && Array.isArray(state.archivedSessionIds)
            ? state.archivedSessionIds.indexOf(sessionId) !== -1
            : false;
        })
      : false;
    if (archived) return null;
    var at = lastActiveOf(summary);
    if (at === undefined) return null;
    var now = Date.now();
    var level = heatLevelOf(now - at);
    if (summary && summary.running === true) {
      return React.createElement('span', {
        'aria-hidden': 'true',
        title: tt('running.short'),
        style: {
          display: 'inline-block',
          flex: 'none',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: HEAT_INK,
        },
      });
    }
    if (level <= 0) return null;
    return React.createElement(RowHeatDot, {
      level: level,
      title: tt('dot.tooltip', { level: level, time: relativeOf(at, now) }),
    });
  }

  function SessionHoverHeat(props) {
    var sessionId = props && props.sessionId;
    if (!sessionId) return null;
    useMinuteTick();
    var useSessions = props && props.useSessions;
    var useWorkspaces = props && props.useWorkspaces;
    var summary = useSessions
      ? useSessions(function (state) { return state && state.byId ? state.byId[sessionId] : undefined; })
      : undefined;
    var at = lastActiveOf(summary);
    if (at === undefined) return null;

    var sessionState = useSessions ? useSessions(function (state) { return state; }) : null;
    var workspaceState = useWorkspaces ? useWorkspaces(function (state) { return state; }) : null;
    var now = Date.now();
    var level = heatLevelOf(now - at);
    var model = sessionState && workspaceState ? buildModel(sessionState, workspaceState, now) : null;
    var facts = sessionState && sessionState.projectionsBySession
      ? factsFromProjection(sessionState.projectionsBySession[sessionId])
      : {};

    var group = null;
    if (model) {
      for (var i = 0; i < model.groups.length; i += 1) {
        var candidate = model.groups[i];
        if (candidate.workspace && Array.isArray(candidate.workspace.sessionIds)
          && candidate.workspace.sessionIds.indexOf(sessionId) !== -1) {
          group = candidate;
          break;
        }
      }
    }
    var rank = group ? model.rankOf[group.key] : undefined;

    var rows = [
      React.createElement('div', { key: 'heat', style: { display: 'flex', alignItems: 'center', gap: 6 } },
        summary && summary.running === true
          ? React.createElement(RunningBadge, { compact: true })
          : React.createElement(RowHeatDot, { level: level, title: '' }),
        React.createElement('span', null, tt('hover.heat', { level: level, name: heatNameOf(level) })),
      ),
      React.createElement('div', { key: 'at' }, tt('hover.lastActive', { time: relativeOf(at, now) })),
    ];

    var statBits = [];
    if (typeof facts.turns === 'number') statBits.push(tt('fact.turns', { n: facts.turns }));
    if (typeof facts.tokens === 'number') statBits.push(tt('fact.tokens', { n: compactNumber(facts.tokens) }));
    if (facts.cacheRate !== undefined && facts.cacheRate !== '') statBits.push(tt('fact.cache', { n: facts.cacheRate }));
    if (typeof facts.contextPct === 'number') statBits.push(tt('fact.context', { n: facts.contextPct }));
    if (statBits.length > 0) {
      rows.push(React.createElement('div', { key: 'stats' }, statBits.join(' · ')));
    }

    if (group) {
      rows.push(React.createElement('div', { key: 'ws', style: { display: 'flex', alignItems: 'center', gap: 6 } },
        React.createElement(HeatMeter, { level: group.level, ratio: group.ratio, showLabel: false, width: 64, height: 8 }),
        React.createElement('span', null, rank === 1
          ? tt('hover.workspaceHot', { name: group.label })
          : tt('hover.workspaceRank', { name: group.label, rank: rank })),
      ));
    }

    return React.createElement('div', {
      style: { display: 'flex', flexDirection: 'column', gap: 3, fontSize: '0.85em', color: 'var(--dsw-alias-label-secondary)' },
    }, rows);
  }

  /* ---------------- 快捷键 ---------------- */

  /**
   * 注册"打开最近活跃会话面板"的快捷键。
   *
   * 调试要点（这次每一步都打日志，便于定位到底卡在哪）：
   * 1. 先 `ctx.get('shortcuts')` 立即探测；拿到就注册，拿不到再 `ctx.inject` 等待。
   *    之前只用 inject，如果该服务在本页面根本没提供，回调永远不触发、也就没有任何日志。
   * 2. `register()` 内部会校验所有已声明 profile 的默认键；任一非法就整体抛错。
   *    宿主把 primary + C/V/X/Z/Y/Q/H 视为保留键，所以不能用 Ctrl+H / Ctrl+R 之外的这些。
   * 3. 每次失败都打印宿主返回的原文（例如 "Reserved shortcut default" / "Conflicting shortcut defaults"）。
   */
  /**
   * 注册「打开最近活跃会话」面板的快捷键。
   *
   * 宿主规则（已从 dsh-api-remote-access 的 bindingIssue / isWebBindingAllowed 核实）：
   * - primary + C/V/X/Z/Y/Q/H 是保留键（浏览器/系统占用），Ctrl+H 单独按会被拒；
   * - web runtime 只接受 Ctrl+/、Ctrl+,、Ctrl+Shift+,、Ctrl+Shift+. ，
   *   以及 Ctrl+Alt+key / Ctrl+Shift+key（两个修饰键）；
   * - 注册时会对**每个已声明的 profile** 逐个校验，任一不合法则整体抛错，
   *   所以不能把 linux profile 一起声明（linux 下 alt+control 会被判 reserved）。
   *
   * 结论：用 Ctrl+Alt+H，只声明 windows/macos 四个 profile。
   * 诊断：先用 ctx.get 探测，拿不到再 ctx.inject 等待；每步都打日志。
   */
  function registerShortcut(ctx) {
    var done = false;

    function attempt(shortcuts, source) {
      if (done || !shortcuts || typeof shortcuts.register !== 'function') {
        if (!shortcuts) ahWarn('[activity-heat] shortcut: service missing via ' + source);
        return false;
      }

      var binding = { code: 'KeyH', modifiers: ['primary', 'alt'] };
      var definition = {
        id: 'activity-heat.open',
        label: function () { return tt('shortcut.label'); },
        aliases: ['最近活跃', '最近活跃会话', 'recent activity', 'activity heat'],
        defaults: {
          'desktop:macos': binding,
          'desktop:windows': binding,
          'web:macos': binding,
          'web:windows': binding,
        },
        regions: ['page', 'editable', 'terminal'],
        modals: [],
        resolve: function () {
          return {
            status: 'handled',
            run: function () {
              try {
                var layout = typeof ctx.get === 'function' ? ctx.get('layout') : undefined;
                if (!layout || typeof layout.selectPanel !== 'function') {
                  ahWarn('[activity-heat] layout.selectPanel unavailable');
                  return;
                }
                // 二次切换：已在面板里就回到进入前的会话（Conversation），否则进入面板。
                // 面板本身不会替换当前会话，所以 selectPanel(null) 自然回到原来那一个。
                layout.selectPanel(panelVisible ? null : 'activity-heat');
              } catch (error) {
                ahWarn('[activity-heat] shortcut run failed:', error && error.message);
              }
            },
          };
        },
      };

      try {
        var run = function () { return shortcuts.register(definition); };
        if (typeof ctx.effect === 'function') ctx.effect(run, 'activity-heat: shortcut');
        else run();

        done = true;

        var count = -1;
        try {
          if (shortcuts.catalog && typeof shortcuts.catalog.getSnapshot === 'function') {
            count = shortcuts.catalog.getSnapshot().length;
          }
        } catch (ignored) { /* 目录读取失败不影响注册结果 */ }

        ahLog('[activity-heat] shortcut OK via ' + source +
          ' · id=activity-heat.open · Ctrl+Alt+H · catalogSize=' + count);
        return true;
      } catch (error) {
        ahWarn('[activity-heat] shortcut register failed via ' + source + ': ' + (error && error.message));
        return false;
      }
    }

    /* 1) 立即探测：服务已在就直接注册，避免 inject 永不回调时毫无线索 */
    try {
      var direct = typeof ctx.get === 'function' ? ctx.get('shortcuts') : undefined;
      ahLog('[activity-heat] shortcut probe ctx.get("shortcuts") -> ' + (direct ? 'object' : String(direct)));
      if (attempt(direct, 'ctx.get')) return;
    } catch (error) {
      ahWarn('[activity-heat] shortcut probe threw:', error && error.message);
    }

    /* 2) 等待服务就绪 */
    if (typeof ctx.inject !== 'function') {
      ahWarn('[activity-heat] shortcut: ctx.inject unavailable');
      return;
    }
    try {
      ctx.inject(['shortcuts'], function (scope) {
        ahLog('[activity-heat] shortcut: inject callback fired');
        var service = (scope && scope.shortcuts)
          || (scope && typeof scope.get === 'function' ? scope.get('shortcuts') : undefined);
        attempt(service, 'ctx.inject');
      });
      ahLog('[activity-heat] shortcut: subscribed, waiting for service');
    } catch (error) {
      ahWarn('[activity-heat] shortcut inject failed:', error && error.message);
    }
  }

  /* ---------------- 插件体 ---------------- */

  /**
   * 注入脉冲 keyframes，只注入一次（keyframes 无法内联声明）。
   * 由 apply 以 ctx.effect 挂载，插件卸载时移除，避免热重载后残留两个 style。
   * @returns 清理函数（宿主调用时移除本次注入的 style）。
   */
  function ensureStyles() {
    try {
      if (typeof document === 'undefined' || !document.head) return undefined;
      if (document.getElementById('activity-heat-style')) return undefined;
      var style = document.createElement('style');
      style.id = 'activity-heat-style';
      style.textContent = [
        '@keyframes ah-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(.82)}}',
        // 环绕跑马灯：一层超大 conic-gradient 在卡片背后匀速旋转，只从 2px 边缝露出
        '@keyframes ah-orbit{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}',
        // 呼吸外发光：让"正在运行"的卡片持续向外涌动
        '@keyframes ah-breathe{',
        '0%,100%{box-shadow:0 0 0 0 color-mix(in srgb, var(--color-blue-500, #3b82f6) 0%, transparent)}',
        '50%{box-shadow:0 0 14px 2px color-mix(in srgb, var(--color-blue-500, #3b82f6) 45%, transparent)}',
        '}',
        // 鲸尾徽标：轻微摆动 + 呼吸缩放，让「正在跑」看起来是活的
        '@keyframes ah-tail{0%,100%{transform:rotate(-8deg) scale(.96)}50%{transform:rotate(8deg) scale(1.1)}}',
        '@media (prefers-reduced-motion: reduce){',
        '@keyframes ah-orbit{from{transform:rotate(0deg)}to{transform:rotate(0deg)}}',
        '@keyframes ah-breathe{0%,100%{box-shadow:none}50%{box-shadow:none}}',
        '@keyframes ah-tail{0%,100%{transform:none}50%{transform:none}}',
        '}',
        // 列表自身的滚动条隐藏：保留滚动能力，右侧用浮标提示可以上下滑
        '.ah-list{scrollbar-width:none;-ms-overflow-style:none;}',
        '.ah-list::-webkit-scrollbar{width:0;height:0;display:none;}',
      ].join('');
      document.head.appendChild(style);
      return function disposeStyles() {
        try {
          if (style.parentNode) style.parentNode.removeChild(style);
        } catch (ignored) { /* 宿主已移除时忽略 */ }
      };
    } catch (ignored) {
      /* 样式注入失败不影响功能 */
      return undefined;
    }
  }

  return {
    apply: function apply(ctx) {
      try {
        if (typeof ctx.effect === 'function') ctx.effect(ensureStyles, 'activity-heat: styles');
        else ensureStyles();

        /* 界面字典注册到宿主 locale 服务；服务缺失时 tt() 自动退回内置中文。 */
        try {
          if (typeof ctx.inject === 'function') {
            ctx.inject(['locale'], function (scope) {
              try {
                var locale = scope && (scope.locale
                  || (typeof scope.get === 'function' ? scope.get('locale') : undefined));
                if (!locale || typeof locale.register !== 'function') return;
                var register = function () { return locale.register(NS, { zh: ZH, en: EN }); };
                if (typeof ctx.effect === 'function') ctx.effect(register, 'activity-heat: locale');
                else register();
                if (typeof locale.bind === 'function') activeT = locale.bind(NS);
              } catch (error) {
                ahWarn('[activity-heat] locale registration failed:', error && error.message);
              }
            });
          }
        } catch (error) {
          ahWarn('[activity-heat] locale inject failed:', error && error.message);
        }

        if (typeof ctx.inject !== 'function') {
          ahWarn('[activity-heat] ctx.inject unavailable; plugin skipped');
          return;
        }

        // slots 用 ctx.inject 等待就绪：重启时客户端插件常常早于 client-modules 执行，
        // 用 ctx.get 一次性读取会拿到 undefined 并永久放弃（这就是"重启不加载"的原因）。
        ctx.inject(['slots'], function (scope) {
          try {
            var slots = scope && scope.slots;
            if (!slots || typeof slots.inject !== 'function' || typeof slots.register !== 'function') {
              ahWarn('[activity-heat] slots scope incomplete; retry on next activation');
              return;
            }

            slots.inject('sidebar.session.row.leading', function () {
              return slots.register(
                {
                  name: 'sidebar.session.row.leading',
                  id: 'heat-row',
                  order: 20,
                  locale: NS,
                  label: function () { return tt('sidebar.rowLabel'); },
                },
                SessionRowHeat,
              );
            });

            slots.inject('sidebar.session.row.hover', function () {
              return slots.register(
                {
                  name: 'sidebar.session.row.hover',
                  id: 'heat-hover',
                  order: 20,
                  locale: NS,
                  label: function () { return tt('sidebar.hoverLabel'); },
                },
                SessionHoverHeat,
              );
            });

            var injectProps = function () { return { ctx: ctx }; };

            slots.inject('sidebar.panellist', function () {
              return slots.register(
                {
                  name: 'sidebar.panellist',
                  id: 'activity-heat',
                  order: 30,
                  locale: NS,
                  label: function () { return tt('nav'); },
                  inject: injectProps,
                },
                HeatRing,
              );
            });

            slots.inject('main', function () {
              return slots.register({ name: 'main', key: 'activity-heat', inject: injectProps }, ActivityPanel);
            });

            ahLog('[activity-heat] seats registered: row.leading + row.hover + panellist + main');
          } catch (error) {
            ahWarn('[activity-heat] seat registration failed:', error && error.message);
          }
        });

        registerShortcut(ctx);
      } catch (error) {
        ahWarn('[activity-heat] apply failed:', error && error.message);
      }
    },
  };
}
