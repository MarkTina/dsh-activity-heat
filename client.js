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
 * 配色：统一用宿主主题的 --dsw-alias-brand-primary，靠不透明度表达热度。
 */
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

  /** 单色热度：同一主题色，用不透明度表达冷热。索引即等级。 */
  var HEAT_ALPHA = [0, 0.28, 0.4, 0.56, 0.76, 1];
  var HEAT_NAMES = ['冷却', '陈旧', '近期', '活跃', '温热', '炽热'];
  // 统一使用宿主主题的主品牌色（--dsw-alias-brand-primary 在 light/dark 下都可用）。
  // 注意：不要用 --dsw-alias-state-business-primary，宿主主题里没有这个令牌。
  var HEAT_INK = 'var(--dsw-alias-brand-primary, #3b82f6)';

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
    { id: 'all', label: '全部', level: null },
    { id: 'hot', label: '炽热', level: 5 },
    { id: 'warm', label: '温热', level: 4 },
    { id: 'active', label: '活跃', level: 3 },
    { id: 'recent', label: '近期', level: 2 },
    { id: 'stale', label: '陈旧', level: 1 },
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
    return HEAT_NAMES[Math.max(0, Math.min(5, level || 0))];
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
    if (delta < MINUTE) return '刚刚';
    if (delta < HOUR) return Math.floor(delta / MINUTE) + ' 分钟前';
    if (delta < DAY) return Math.floor(delta / HOUR) + ' 小时前';
    if (delta < 2 * DAY) return '昨天';
    if (delta < 7 * DAY) return Math.floor(delta / DAY) + ' 天前';
    return Math.floor(delta / (7 * DAY)) + ' 周前';
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

  /** 从 contextTimeline 投影读轮次 / tokens / 缓存命中率 / 上下文占比 / 提示词。 */
  function factsFromProjection(projections) {
    var out = {};
    try {
      var values = projections && projections.values;
      if (!values || typeof values !== 'object') return out;

      var timeline = values.contextTimeline;
      if (timeline && typeof timeline === 'object') {
        var counts = timeline.counts;
        var turns = counts && typeof counts.turns === 'number'
          ? counts.turns
          : (typeof timeline.turns === 'number' ? timeline.turns : undefined);
        if (typeof turns === 'number' && turns > 0) out.turns = turns;

        var current = timeline.current;
        var requests = Array.isArray(timeline.requests) ? timeline.requests : [];
        var lastRequest = requests.length > 0 ? requests[requests.length - 1] : undefined;
        var tokens = current && typeof current.total === 'number'
          ? current.total
          : (lastRequest && typeof lastRequest.total === 'number' ? lastRequest.total : undefined);
        if (typeof tokens === 'number' && tokens > 0) out.tokens = tokens;

        var ctxWindow = typeof timeline.contextWindow === 'number' && timeline.contextWindow > 0
          ? timeline.contextWindow
          : undefined;
        if (ctxWindow !== undefined && typeof tokens === 'number' && tokens >= 0) {
          out.contextPct = Math.max(0, Math.min(999, Math.round((tokens / ctxWindow) * 100)));
        }

        var cacheSource = lastRequest && typeof lastRequest.prompt === 'number'
          ? lastRequest
          : (timeline.last && typeof timeline.last.prompt === 'number' ? timeline.last : undefined);
        if (cacheSource && cacheSource.prompt > 0 && typeof cacheSource.cacheRead === 'number') {
          out.cacheRate = Math.max(0, Math.min(100, Math.round((cacheSource.cacheRead / cacheSource.prompt) * 100)));
        }

        var prompt = snippetOf(timeline.initialPrompt, 60)
          || snippetOf(timeline.lastUser, 60)
          || (timeline.lastReply ? snippetOf(timeline.lastReply.text, 60) : '');
        if (prompt) out.prompt = prompt;
      }

      var stats = values.sessionStats;
      if (stats && typeof stats === 'object') {
        if (out.tokens === undefined && typeof stats.totalTokens === 'number') out.tokens = stats.totalTokens;
        if (out.turns === undefined && typeof stats.turns === 'number') out.turns = stats.turns;
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
            : '未分组',
          level: 0,
          ratio: 0,
          at: undefined,
          count: 0,
          tokens: 0,
        };
        groups[key] = group;
        groupList.push(group);
      }
      group.count += 1;
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
    var width = props && typeof props.width === 'number' ? props.width : 64;
    var height = props && typeof props.height === 'number' ? props.height : 8;
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
              minWidth: 26,
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
      props && props.icon ? React.createElement('span', { style: { opacity: 0.55 } }, props.icon) : null,
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
        title: '该会话正在运行',
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
      React.createElement('span', {
        style: {
          display: 'block',
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: HEAT_INK,
          animation: 'ah-pulse 1.2s ease-in-out infinite',
        },
      }),
      '运行中',
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
              border: picked ? '1px solid ' + UI.textPrimary : '1px solid var(--dsw-alias-border-l1, rgba(127,127,127,0.22))',
              background: picked ? UI.cardBgHover : 'transparent',
              color: picked ? UI.textPrimary : UI.textSecondary,
              fontSize: '0.8em',
              lineHeight: '18px',
              cursor: 'pointer',
              font: 'inherit',
              fontWeight: picked ? 600 : 400,
              opacity: count === 0 && !picked ? 0.5 : 1,
            },
          },
          filter.label,
          React.createElement('span', { style: { fontSize: '0.92em', opacity: 0.65 } }, String(count)),
        );
      }),
    );
  }

  function SessionCard(props) {
    var hoverState = React.useState(false);
    var hover = hoverState[0];
    var setHover = hoverState[1];
    var session = props.session;
    var now = props.now;

    var meta = [];
    if (session.workspace) {
      meta.push(React.createElement('span', {
        key: 'ws',
        style: { maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
      }, session.workspace.title || basenameOf(session.workspace.path) || '未命名工作区'));
    }
    meta.push(React.createElement('span', { key: 'at' }, relativeOf(session.at, now)));
    if (typeof session.turns === 'number') {
      meta.push(React.createElement(MetaChip, { key: 'turns', icon: '⟳' }, session.turns + ' 轮'));
    }
    if (typeof session.tokens === 'number') {
      meta.push(React.createElement(MetaChip, { key: 'tokens', icon: '◈' }, compactNumber(session.tokens) + ' tokens'));
    }
    if (typeof session.cacheRate === 'number') {
      meta.push(React.createElement(MetaChip, { key: 'cache', icon: '⚡' }, '缓存 ' + session.cacheRate + '%'));
    }
    if (typeof session.contextPct === 'number') {
      meta.push(React.createElement(MetaChip, { key: 'ctx', icon: '◧' }, '上下文 ' + session.contextPct + '%'));
    }
    if (session.open) {
      meta.push(React.createElement(MetaChip, { key: 'open', icon: '●' }, '当前'));
    }

    var metaRow = [];
    for (var i = 0; i < meta.length; i += 1) {
      if (i > 0) metaRow.push(React.createElement('span', { key: 'sep' + i, style: { opacity: 0.35 } }, '·'));
      metaRow.push(meta[i]);
    }

    var children = [
      React.createElement('span', {
        key: 'bar',
        style: {
          flex: 'none',
          width: 3,
          alignSelf: 'stretch',
          borderRadius: 2,
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
        { key: 'meter', style: { flex: 'none', display: 'flex', alignItems: 'center', alignSelf: 'center' } },
        React.createElement(HeatMeter, { level: session.level, ratio: session.ratio, showLabel: true, width: 72, height: 8 }),
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
      // 运行中的卡片用不透明底色，遮住背后的跑马灯光带（半透明会透出来）。
      background: running
        ? (hover ? 'var(--dsw-alias-bg-layer-2, rgba(127,127,127,0.12))' : 'var(--dsw-alias-bg-base, #ffffff)')
        : (hover ? UI.cardBgHover : UI.cardBg),
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
        title: '打开「' + (session.title || session.id) + '」',
        style: buttonStyle,
      },
      children,
    );

    // 非运行中：保持原样，不引入任何额外 DOM
    if (!running) return cardButton;

    // 运行中：外层 2px 缝里露出旋转的 conic-gradient，形成环绕跑马灯；
    // 同时外层呼吸发光，让"正在跑"在整屏里一眼可见。
    return React.createElement(
      'div',
      {
        key: 'wrap',
        style: {
          position: 'relative',
          margin: '0 0 8px',
          padding: 2,
          borderRadius: UI.radius,
          overflow: 'hidden',
          background: 'var(--dsw-alias-bg-base, #ffffff)',
          animation: 'ah-breathe 2.4s ease-in-out infinite',
          isolation: 'isolate',
        },
      },
      // 跑马灯光带：尺寸取 200%，绕中心旋转，只有边缘 2px 会露出来
      React.createElement('span', {
        key: 'orbit',
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
            ' color-mix(in srgb, var(--dsw-alias-brand-primary) 95%, transparent) 310deg,' +
            ' color-mix(in srgb, var(--dsw-alias-brand-primary) 35%, transparent) 335deg,' +
            ' transparent 360deg)',
          animation: 'ah-orbit 2.2s linear infinite',
          pointerEvents: 'none',
          zIndex: 0,
        },
      }),
      cardButton,
    );
  }

  function GroupCard(props) {
    var hoverState = React.useState(false);
    var hover = hoverState[0];
    var setHover = hoverState[1];
    var group = props.group;
    var now = props.now;
    var rank = props.rank;
    var openable = group.workspaceId !== undefined;

    var metaBits = [group.count + ' 个会话', relativeOf(group.at, now)];
    if (group.tokens > 0) metaBits.push(compactNumber(group.tokens) + ' tokens');

    return React.createElement(
      'button',
      {
        type: 'button',
        disabled: !openable,
        onClick: props.onClick,
        onMouseEnter: function () { setHover(true); },
        onMouseLeave: function () { setHover(false); },
        onFocus: function () { setHover(true); },
        onBlur: function () { setHover(false); },
        title: openable ? '打开工作区「' + group.label + '」' : '未分组会话',
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          padding: '9px 14px',
          margin: '0 0 8px',
          border: UI.border,
          borderRadius: UI.radius,
          background: hover && openable ? UI.cardBgHover : UI.cardBg,
          cursor: openable ? 'pointer' : 'default',
          textAlign: 'left',
          font: 'inherit',
          color: 'inherit',
          transition: 'background 120ms ease',
        },
      },
      React.createElement(
        'span',
        { key: 'body', style: { display: 'flex', flexDirection: 'column', gap: 2, flex: '1 1 auto', minWidth: 0 } },
        React.createElement('span', {
          style: {
            color: UI.textPrimary,
            fontWeight: 500,
            fontSize: '0.92em',
            lineHeight: '20px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          },
        }, group.label),
        React.createElement('span', { style: { color: UI.textTertiary, fontSize: '0.76em', lineHeight: '16px' } }, metaBits.join(' · ')),
      ),
      React.createElement(
        'span',
        { key: 'right', style: { flex: 'none', display: 'flex', alignItems: 'center', gap: 8 } },
        React.createElement(HeatMeter, { level: group.level, ratio: group.ratio, showLabel: true, width: 72, height: 8 }),
        React.createElement('span', {
          style: {
            flex: 'none',
            minWidth: 24,
            padding: '0 5px',
            borderRadius: 5,
            fontSize: '0.7em',
            lineHeight: '18px',
            textAlign: 'center',
            color: UI.textSecondary,
            background: 'var(--dsw-alias-bg-layer-1, rgba(127,127,127,0.08))',
            border: '1px solid var(--dsw-alias-border-l1, rgba(127,127,127,0.18))',
            opacity: rank <= 3 ? 1 : 0.6,
          },
        }, '#' + rank),
      ),
    );
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
              background: picked ? UI.textPrimary : 'transparent',
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
    useMinuteTick();

    // 顶层：会话 / 工作区 两种对象切换
    var viewState = React.useState('sessions');
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

    var now = Date.now();

    if (!useSessions || !useWorkspaces) {
      return React.createElement('div', {
        style: { padding: '16px ' + UI.padX + 'px', color: UI.textSecondary },
      }, '宿主未提供会话数据。');
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
      React.createElement('div', { style: { fontWeight: 650, fontSize: '1.05em', color: UI.textPrimary } }, '最近活跃会话'),
      React.createElement(Segmented, {
        options: [
          { value: 'sessions', label: '会话 ' + model.total },
          { value: 'workspaces', label: '工作区 ' + model.workspaceCount },
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
      ? '该热度档位下暂无' + (view === 'sessions' ? '会话' : '工作区') + '。'
      : (view === 'sessions' ? '暂无最近活动。' : '暂无活跃工作区。');

    var list = React.createElement('div', {
      key: 'list',
      style: { display: 'flex', flexDirection: 'column', padding: '0 ' + UI.padX + 'px' },
    }, cards.length > 0
      ? cards
      : React.createElement('div', {
          style: { padding: '8px 0 14px', fontSize: '0.82em', color: UI.textTertiary },
        }, emptyText));

    var footer = null;
    if (view === 'workspaces' && filter === 'all' && model.groups.length > groupCount) {
      footer = React.createElement('div', {
        key: 'more',
        style: { padding: '2px ' + UI.padX + 'px 10px', fontSize: '0.76em', color: UI.textTertiary },
      }, '还有 ' + (model.groups.length - groupCount) + ' 个工作区未显示，可切换数量。');
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
        title: '正在运行',
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
      title: '热度 ' + level + '/5 · ' + relativeOf(at, now),
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
        React.createElement('span', null, '热度 ' + level + '/5 · ' + heatNameOf(level)),
      ),
      React.createElement('div', { key: 'at' }, '最后活动：' + relativeOf(at, now)),
    ];

    var statBits = [];
    if (typeof facts.turns === 'number') statBits.push(facts.turns + ' 轮');
    if (typeof facts.tokens === 'number') statBits.push(compactNumber(facts.tokens) + ' tokens');
    if (typeof facts.cacheRate === 'number') statBits.push('缓存 ' + facts.cacheRate + '%');
    if (typeof facts.contextPct === 'number') statBits.push('上下文 ' + facts.contextPct + '%');
    if (statBits.length > 0) {
      rows.push(React.createElement('div', { key: 'stats' }, statBits.join(' · ')));
    }

    if (group) {
      rows.push(React.createElement('div', { key: 'ws', style: { display: 'flex', alignItems: 'center', gap: 6 } },
        React.createElement(HeatMeter, { level: group.level, ratio: group.ratio, showLabel: false, width: 56, height: 7 }),
        React.createElement('span', null, '工作区「' + group.label + '」' + (rank === 1 ? '正热' : '排第 ' + rank)),
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
        label: function () { return '最近活跃会话'; },
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
                if (layout && typeof layout.selectPanel === 'function') {
                  layout.selectPanel('activity-heat');
                } else {
                  ahWarn('[activity-heat] layout.selectPanel unavailable');
                }
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

  /** 注入脉冲 keyframes，只注入一次（keyframes 无法内联声明）。 */
  function ensureStyles() {
    try {
      if (typeof document === 'undefined' || !document.head) return;
      if (document.getElementById('activity-heat-style')) return;
      var style = document.createElement('style');
      style.id = 'activity-heat-style';
      style.textContent = [
        '@keyframes ah-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(.82)}}',
        // 环绕跑马灯：一层超大 conic-gradient 在卡片背后匀速旋转，只从 2px 边缝露出
        '@keyframes ah-orbit{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}',
        // 呼吸外发光：让"正在运行"的卡片持续向外涌动
        '@keyframes ah-breathe{',
        '0%,100%{box-shadow:0 0 0 0 color-mix(in srgb, var(--dsw-alias-brand-primary) 0%, transparent)}',
        '50%{box-shadow:0 0 14px 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 45%, transparent)}',
        '}',
        '@media (prefers-reduced-motion: reduce){',
        '@keyframes ah-orbit{from{transform:rotate(0deg)}to{transform:rotate(0deg)}}',
        '@keyframes ah-breathe{0%,100%{box-shadow:none}50%{box-shadow:none}}',
        '}',
      ].join('');
      document.head.appendChild(style);
    } catch (ignored) {
      /* 样式注入失败不影响功能 */
    }
  }

  return {
    apply: function apply(ctx) {
      try {
        ensureStyles();
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
                { name: 'sidebar.session.row.leading', id: 'heat-row', order: 20, label: '热点' },
                SessionRowHeat,
              );
            });

            slots.inject('sidebar.session.row.hover', function () {
              return slots.register(
                { name: 'sidebar.session.row.hover', id: 'heat-hover', order: 20, label: '热度' },
                SessionHoverHeat,
              );
            });

            var injectProps = function () { return { ctx: ctx }; };

            slots.inject('sidebar.panellist', function () {
              return slots.register(
                { name: 'sidebar.panellist', id: 'activity-heat', order: 30, label: '最近活跃会话', inject: injectProps },
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
