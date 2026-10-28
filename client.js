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
      working: '工作中',
    },
    fact: {
      turns: '{n} 轮',
      steps: '{n} 步',
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
    tokens: {
      title: 'Token 用量',
      cacheHit: '缓存命中',
      uncached: '未缓存输入',
      cacheRead: '缓存读取',
      cacheWrite: '缓存写入',
      output: '输出',
    },
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
      working: 'Working',
    },
    fact: {
      turns: '{n} turns',
      steps: '{n} steps',
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
    tokens: {
      title: 'Token usage',
      cacheHit: 'Cache hit',
      uncached: 'Uncached input',
      cacheRead: 'Cached input',
      cacheWrite: 'Cache write',
      output: 'Output',
    },
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

  // 浮层用 portal 挂到 body：列表是 overflow 容器，靠 fixed 定位仍可能
  // 被祖先的裁剪/层叠上下文截断，portal 出去最稳；宿主没提供 react-dom 时退回原样。
  var ReactDOM = null;
  try {
    ReactDOM = require('react-dom');
  } catch (error) {
    ReactDOM = null;
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

  /** 运行中徽标：官方鲸尾动图（assets/active.gif 的内联副本），播放器自己逐帧走。 */
  var ACTIVE_TAIL = 'data:image/gif;base64,R0lGODlhSABIAIEAAAAAADuC9iVj6wAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQJCQAAACwAAAAASABIAAAI/wABCBxIsKDBgwgTKly4UADDhxAjShRAkaLEixgnVrSYsaNHghtDfhyJMaRIkigZmlyZsqXBlTAdVnQ50iSAmDBpZjx5E2dOnRB5CvT5E6hCoSCJbjTacOnRoTiZJkSqsqjUpDMvWr0KNetOqlfBBhVrlGxVp1wHmm2qFKjNr0q9pnxbMi5akizr2pVbc+3UvXc/5qXpsy9dwjFfOhx7WKfPAIGPDna8N2LOxZTbapycObHWrZ0bMxbt1u9fzqUjfzYtmDVb1XNdP5RtmXRrvihBG8at1nPWqIh59wTsOTjHgsSBh1acHHXsyM1FYl6OnOzv42Ghw04rmTdt7mC/c2oVKz678PJSyW/nzhx7deHs209/7z7+QbPoU9enP98+/9f9+dfVfv8JKN9ZBPrnV34uLbgee7ZhlWB8pjH43IQSBmgfaxbi9WBv8EH44YAaUjjicBiOx+GJTHUoIIsGxijjjDTWaOONGQUEACH5BAkJAAAALAIAAgBCAEEAgQAAADuC9iVj6wAAAAj/AAEIFEBQgMCDCBMqXMiwocOFBQs+nEixosOIES1q3NgQI0aOIEF6HCkxpEmGJFNKJHgypEcAKlO23PhxYMyRMy3WPHgTZ86HOxMatBnzJ9CMFFmSNNoRqcalTBUGfTo1KkynHF9a5VlVZ1ejX5OGzalVpMyoZWn2ZNnSZ9a1bE26pQq3pFmsdOvGVTs2r8q7aX/+vSogAF6ucwXr3YvwrFW9TaE+Xns0MdOeEx1PHho4suXNdit+vtwXZWewp8UeRr3aa2jSrV2/Jls6c2zCjCEaTM03N9G/mGnPxr24tujDxSXP7Jp8NOChjYNi9i13dV/qsH0b34p4+HbuxE0PWwcvnvr3ranPg4Yu9Tb539jVZ2fffvz77vTrY79/3T340vIJtx9895WXn34HFgigf+gxGGBbDjK43nH2/Sfhg9VVGJ2GDXJIYIEbDogfiCNSKCJaEpLYlIoTBQQAIfkECQkAAAAsAgACAEIAQACBAAAAO4L2JWPrAAAACP8AAQgUQFCAwIMIEypcyLChw4UFCwIw+LCixYsQI0bEyLEjQ40gCXocyTGkSYoiSapEeLLlxpUkNU50GRJmR5kDZ9KUaPMiToU7efZ0+LOhyJZDiRa1aDKp0ZclazoFCvXm0qk6U44EiZXlVYxcuw6sapXs1LBbvyaVWvak06YegwqNiTaq3LltzVa8q3Yv27h8tQoMgPeg256B/xqG+zbxR8Zn7z48HHmnX8WNKU+GLDar4M2YsdZlOlp0X6WnYZYGm1rlarufh76GHVt1a9KFWdLWCzi3Z7KWEetNzHnlVeKh6eZGztu1WeYUK9f+Onvt8Oadqfq+nd3zY9/dE6pO5d65L3mx5rGHP33eNHjv4Z++hx9ffOr21ufTr79YP37Z6u3HX3Vj6dfVbf/ZhGCABzKYFX9eGShgfNwlaJyDFionYYZpSTjheh7qNlVAACH5BAkJAAAALAIAAQBCAEEAgQAAADuC9iVj6wAAAAj/AAEIFChAwMCDCBMqXMiwYcOCEB1KnEjxIcSLFTNqtHgx4saPGzuKLAiAJMiTC0eq7IiyZUmMK1W6/IiRYMyRMyuyPHhTZM6JOxOa7PmTo0eJMYumDEpRplKhNTPifIqQqVSrT33SjEr1JVeNWJVqDRn251SyR7uevbrWbNumPb+ilQs07titZY3aTVvVJNS7dffivBiArlfAYAXfXPq2pWK+PFdmFexQ8uS4SJ1S9YuYcefLkBkabFz0c+W8M01nNuxSdWC/YlnrlH3S9WvYqVHPDg1Ss2PZhonmLPuYNF7IxY0fN/g3Oe7fcp0/zx16rOWuh6frxh6Z93buNr3TWwafnXlz8+Q9o+/LO3346e/Xux+I+jv2+uO5686vdrx90PKdNx978HVXIHjb/Vdafgq61Z6BAZL3XYPD8cdfbA9COGB8cGW4mYUXVughfSFSdyCBEep3IopPBQQAIfkECQkAAAAsAgABAEIAQgCBAAAAO4L2JWPrAAAACP8AAQgUQFCAwIMIEypcyLChw4UFCz6cSLGiw4gRLWrc2BCjR4IcQ2r8SNKgyJMMS6o0iRIlRgArPbYM+XJgzJozK+IcaDNmTp0ZH6r8SVFmUZJEhQa1+DFpx6VMjTpNuHNk1alSN17FCtVqV65fgYZNmjXqWKJNOW51mtbrTZAtkbp9C1doyrZH6cotGCBsybl630KUCzjw38F4cxquq3AoW70TCZPt2VNi3rVgLV8+ixbzU88zy5rVPBUm6IunRYrWyvnkatakf76GHdvlbNosQ9/Gbfuw7LGLdwNGHDy3Yr/FS68ubvx3bdOQSx9cnlp65ebXrY/GDp2x9s/Pu3NX/44Qc3Xps88r56w+83jx5MF7p9pa++n61u/jXx++/P7H9bXn3HzEvZcffgIe159/Cx7YYHbx0fdgZRFKSGCBFV5n4HT/DbghhxMC+CGEGdLUYYmDTRUQACH5BAkJAAAALAIAAQBCAEIAgQAAADuC9iVj6wAAAAj/AAEIFEBQgMCDCBMqXMiwocOFBSMafEixokWIEgte3MiRYcaPHUNu/EhyosiTGEuWRMkSgESXKl+27CjzYEyNM0dG9Hgzp8WaDVX6pJjxJ8mhDoFWBIk0JUGOTJsmVLq0qFSEVqFSbbq1Ks6rA7Pq/Ao26kWxUo9qJXvVrNGbO5+KVHsW7lG5AwOwten2od2/aMP2DQq4MF6sdIkaBkw4MMunhf0Ongk5pmLHbbsqTAwW5s63mn1iTjqacmjSn9Oelrw3Z2nQJkWv9nrYdOrHt3G/rpub5krXvcdy1l176uLYtlt7Nqw6+HHkwJ1H7ryVOfXqs68rz669uGDvnTd3WuWeWfly6OGNB/+OPj1f8+fdNwbPXr5T+vHtq8f/Xf/+9ojB1x2A7/FXnoD5+TcbebIhmKB+C64XXoQOciVhgAY2l+GD7u1WH4QX/uffcrxtOKKIJ65l4kUBAQAh+QQJCQAAACwCAAAAQgBDAIEAAAA7gvYlY+sAAAAI/wABCAQgoODAgwgTKlzIsGHDghAdSpxI8SHEixUzarR4MeLGjxs7ijQIsqTDkSgFmFyJsCPBlCpZssQoEKZHmSFpDrR5E+dElwp5xvR5EijDlEQlilSKMmnRnhyXOg2qk+LIqQmlVryKdafRjFq7hrX6FStXsGWnnt2aNmlTtFWzkhyaM+5PoUg/rmWKF+bLggHoyh37tK/ho3ujGu6LmHBjv38XP7ZLlLFikl1fem3b0rFYz505O008GfNn0AtRzyTNF2pl1YrNiiZLeSXsu65Lvl2du+5t2r1x75Y5+/JvtsEjS3Zbe3Fyk46dZ45+OLNywTWFWt+c+7hsysW3K1tPXVt89ublzXsOP100+9PB3383PZi++fPJ5Y+erZ/58/H3HRRefzjBRiBx6XGHnXjsHcibfVT9p1aC+C24XYMUTighgPf95qBuGVYYIH7IQTiicBaeWFiKJQUEACH5BAkJAAAALAIAAABCAEMAgQAAADuC9iVj6wAAAAj/AAEIFEBQgMCDCBMqXMiwocOFBQs+nEixosOIES1q3NgQI0aOIEF6HBmy5MSRHk2qZPgRJcGVMAFkHOhSYkyOHxHWfHlTY06FO3tWTAkxqNCLP1m6PIrU5kmUTIs6pQg1qs6kT4lapTmVKsmtMrF6nQlWq0WzUb/6FJuQZ0m1Q7EaFcn24c67YTfCzXq379m9dvsKJhig69W6Sv0ONnyY7FjEYQU3dcz0Jd7JbsFyRSuVclnOnRmnBR06s1XAHVHfXLrW82rVfE3HrBoScm3Yf0XTxZ1bduuas13HnbuSNNDBRyEv1q2y7nLmJkEv1hzZMHLq0mlTbyzb+Pbs0LELWLctXjT5z+OFb69uMLHv9cbPn1bPfv1x+vIrK6eP/j13+/8FFp5+/NUHIHvtYXaggQL6t9V5+fUEYYEEOnhQhK8NyOB38mFYXIcUChXihvZZGOCCvyV4U0AAIfkECQkAAAAsAgAAAEIAQwCBAAAAO4L2JWPrAAAACP8AAQgUQFCAwIMIEypcyLChw4UFCz6cSLGiw4gSLWrc2BBjRI4gQ3r8GLJkxZEeTapkiBEASoIrY7Yc+NJgzJIzada8CTKnzpo2eVJMqRAoTKETfUJ8ifShUpZMmy7NmDSqVIRET468mvCp061cfx7VmDVsWa0kzXqtmhbrWotnh7Y0SpVjXLZ0wdptizav1b515fqlK5jv178u6QYI3PVuR8ZQ8150zFPyY8pCjR5+K1XvZcNqOR/0HFr0aMw3UW5ErVL1XtAySZOF3Vr2atqvbd+GDFdzbN6fCafmPJj1bOCJi4+tDFv58sxeB4c9bRjo9KmQTV+Pa7z0c7HX8X5bTz4+vFve2r0HbYw8vOP0VynD7/x2flPiuKdjtg+9Pfn15oG3GYABmsbfb/4duJJ2Ctbm338BnlceexN6V1iF8eVHHYb0PQhhhN01KJKGGxK4nYcfRtgTihoFBAAh+QQJCQAAACwCAAAAQgBDAIEAAAA7gvYlY+sAAAAI/wABCBQgQKDBgwgTKlzIsCFDghAdSpxI0SHEiBUzamx4sePGjyA7egRJkqLIkyVTLjyJUqVLACJhsiz4suRImTMJ1tx4c2BOjDsl9jz4U2dQixcf/jzKMWnTnEwVDlXKMirCqUhbWsVptGLVrVxpatRqFavQmFvRju05M6Var0XbhjT7NC5ZuE4z2i26lu7KvVDx+k34lXDcAGffHt1bF2jZuI27guUbGSxRuZHFWg4rmWpey3c9O348+KrixaGzft6JWW/pj637jrYZmORr0bHnzv4LeDdsur1T6+5sMLhHzSqxGideUzlj0FMLbza8+3ba6KunU2dunXT17NqLg1sPG543c/LlTY/vjno8+vQ+3bMP6nd+8/r2XZ5Wfx6678v/TeaeeAF61x+BBxqInFQDGjhRfm41GF+CUb22n4AFIrigfxROuOF1EnpY3oXbfQiiiSXCN5CKCQUEACH5BAkJAAAALAIAAQBCAEIAgQAAADuC9iVj6wAAAAj/AAEIFEBQgMCDCBMqXMiwocOFBQs+nEixosOIES1q3NgQI0aOIEF6zBiyZMWRHk2qZPgRJcGVMD8OdCkRpkiSB2nitElRJkKdO3l29PkTaE2hLIMqNIo06dGHOpsuVQoVpdSiVC+OvIr1JcetXAGkvJmV59iNRs+SLas1LVGNYOG6jSuX7dC5du96RYuXbk+1J/fq9Vv1bVOdAQRDBCyVadu8Kx0/VnwVaGHDla1ehmyT8GLGmTF/Fi3U82TKZjXXfVpaNV/OPWeCXm2wpNvIbPu6tk1a9+yvWX3/Bs5atvDDSvGGzWmY9PKEzWGHZez8OfPiYqWHxl7duujuz79rTkcefDzS3uZTlwXP1fnw5dXZk8fetbZ16Hnln8+fHjf9+vfhx99/00Gmn3qoTdUfbwQCGKBx9m32IISBNdgYZwf6ZyGFD8q34YUJTghAQAAh+QQJCQAAACwCAAEAQgBCAIEAAAA7gvYlY+sAAAAI/wABCBRAUIDAgwgTKlzIsKHDhQULPpxIsaLDiAQtatz4EGNEjiBDevwYsmTFkR5NqmSIEQDKjCtXthz4UqLLmBtnuqw5EudJkgd5pvTZUSdCoUCJQky6VKjSpjAnOn16lClFlFSrWr06NOtOmxx7eu2a0yhVsxaRkg2L9qdasCDXun0Lt+xWqXTbcq2bNu/donpjvmQbWHDNvoVl1gzAV2tixVNZivX69fDFyVkjN8RK2XFjhZw7V/4MGnNmuYD/GkadmrTK0HZdl4RNOGpcgzRHy8b71+/g13d9/wbeWLhpk2iNsxZpNW/lnUrbPhY9uvRu6nKni5aumrpuqLi9S03+rJ2y3vKng3ff3nu9+cDonxZezl52fJ/0q4v3zNv2/sf34QSge/INeF2B1wUImX+bEUiUdgoiR2CEs03oIH4WHohhhgx2RuF/GnYWEAA7';

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
        var statsSteps = numberAt(stats, 'steps');
        if (statsSteps !== undefined && statsSteps > 0) {
          out.steps = statsSteps;
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
        var cacheText = cacheHitTextOf(cacheRead, billed);
        if (billed > 0 || output > 0) {
          out.tokens = billed + output;
          // 悬浮卡要逐项展示，四个桶原样保留
          out.tokenParts = {
            uncached: uncached,
            cacheRead: cacheRead,
            cacheWrite: cacheWrite,
            output: output,
            total: billed + output,
            cacheHit: cacheText !== undefined ? cacheText : '',
          };
          fromStatusBar = true;
        }
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
        steps: facts.steps,
        tokens: facts.tokens,
        tokenParts: facts.tokenParts,
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
          turns: 0,
          steps: 0,
          wallMs: 0,
          cacheRead: 0,
          billed: 0,
          maxContextPct: undefined,
          running: false,
        };
        groups[key] = group;
        groupList.push(group);
      }
      group.count += 1;
      if (session.running === true) group.running = true;
      if (typeof session.tokens === 'number') group.tokens += session.tokens;
      if (typeof session.turns === 'number') group.turns += session.turns;
      if (typeof session.steps === 'number') group.steps += session.steps;
      if (session.timing && typeof session.timing.wallMs === 'number') group.wallMs += session.timing.wallMs;
      if (session.tokenParts) {
        // 缓存命中必须按桶加权，直接平均各会话的百分比会失真
        group.cacheRead += session.tokenParts.cacheRead;
        group.billed += session.tokenParts.uncached + session.tokenParts.cacheRead + session.tokenParts.cacheWrite;
      }
      if (typeof session.contextPct === 'number') {
        group.maxContextPct = group.maxContextPct === undefined
          ? session.contextPct
          : Math.max(group.maxContextPct, session.contextPct);
      }
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
              fontSize: '0.8em',
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
    var width = typeof props.width === 'number' ? props.width : 46;
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
    } else if (name === 'sessions') {
      // 两叠卡片：表示"会话数"
      inner = [
        React.createElement('rect', { key: 'back', x: 1.4, y: 1.8, width: 6.4, height: 7.6, rx: 1.2 }),
        React.createElement('path', { key: 'front', d: 'M4.4 4.2h5c.7 0 1.2.5 1.2 1.2v5' }),
      ];
    } else if (name === 'steps') {
      // 三级台阶：表示"步"
      inner = React.createElement('path', { d: 'M2.4 9.6h2.4V7.2h2.4V4.8h2.4' });
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

  /**
   * 浮层定位：默认贴锚点下方，空间不够就翻到上方，左右夹在视口内。
   * @param anchor - {left, top, bottom} 锚点的视口坐标
   * @param width - 浮层宽度
   * @param height - 浮层估算高度
   */
  function cardPosition(anchor, width, height) {
    var viewportWidth = typeof window !== 'undefined' && window.innerWidth ? window.innerWidth : 1280;
    var viewportHeight = typeof window !== 'undefined' && window.innerHeight ? window.innerHeight : 800;
    var left = typeof anchor.left === 'number' ? anchor.left : 24;
    if (left + width > viewportWidth - 12) left = viewportWidth - width - 12;
    if (left < 12) left = 12;
    var above = typeof anchor.top === 'number' && anchor.top > height + 16;
    var top = above ? anchor.top - 8 : (typeof anchor.bottom === 'number' ? anchor.bottom + 8 : 120);
    if (!above && top + height > viewportHeight && typeof anchor.top === 'number') {
      above = true;
      top = anchor.top - 8;
    }
    return { left: left, top: top, transform: above ? 'translateY(-100%)' : 'none' };
  }

  /** 悬浮卡：活跃时长 + 环形分布 + 图例 + 时间轴。 */
  function TimingCard(props) {
    var timing = props.timing;
    var pos = cardPosition(props.anchor || {}, 300, 230);
    var left = pos.left;
    var top = pos.top;
    var above = pos.transform !== 'none';

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
        width: 300,
        zIndex: 2000,
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

  /** 精确整数：120,613,984 这样的千分位，用于明细卡。 */
  function exactNumber(value) {
    var n = typeof value === 'number' && isFinite(value) ? Math.round(value) : 0;
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /**
   * 通用悬浮容器：读锚点坐标 → portal 到 body → 由 render(anchor) 产出浮层。
   * 浮层统一脱离滚动容器，避免被列表裁掉。
   */
  function HoverCard(props) {
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

    var card = anchor && props.render ? props.render(anchor) : null;
    if (card && ReactDOM && typeof ReactDOM.createPortal === 'function'
      && typeof document !== 'undefined' && document.body) {
      card = ReactDOM.createPortal(card, document.body);
    }

    return React.createElement('span', {
      ref: ref,
      onMouseEnter: show,
      onMouseLeave: hide,
      onFocus: show,
      onBlur: hide,
      style: { display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'help' },
    }, props.children, card);
  }

  /** 悬浮卡：Token 用量明细（缓存命中 + 三个计费输入桶 + 输出）。 */
  function TokensCard(props) {
    var parts = props.parts;
    var pos = cardPosition(props.anchor || {}, 260, 210);
    var rows = [
      { key: 'hit', label: tt('tokens.cacheHit'), value: parts.cacheHit !== '' ? parts.cacheHit + '%' : '—' },
      { key: 'uncached', label: tt('tokens.uncached'), value: exactNumber(parts.uncached) + ' tok' },
      { key: 'read', label: tt('tokens.cacheRead'), value: exactNumber(parts.cacheRead) + ' tok' },
      { key: 'write', label: tt('tokens.cacheWrite'), value: exactNumber(parts.cacheWrite) + ' tok' },
      { key: 'out', label: tt('tokens.output'), value: exactNumber(parts.output) + ' tok' },
    ].filter(function (row) {
      return row.key !== 'write' || parts.cacheWrite > 0;
    });

    return React.createElement('div', {
      style: {
        position: 'fixed',
        left: pos.left,
        top: pos.top,
        transform: pos.transform,
        width: 260,
        zIndex: 2000,
        padding: '12px 14px',
        borderRadius: 10,
        background: 'var(--dsw-alias-bg-base, #ffffff)',
        border: '1px solid var(--dsw-alias-border-l1, rgba(127,127,127,0.22))',
        boxShadow: '0 8px 28px rgba(0,0,0,0.16)',
        color: UI.textPrimary,
        pointerEvents: 'none',
      },
    },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 6 } },
        React.createElement(MetricIcon, { name: 'tokens' }),
        React.createElement('span', { style: { fontSize: '0.8em', fontWeight: 600 } }, tt('tokens.title')),
        React.createElement('span', {
          style: { marginLeft: 'auto', fontVariantNumeric: 'tabular-nums', fontSize: '0.86em', fontWeight: 600 },
        }, exactNumber(parts.total) + ' tok'),
      ),
      React.createElement('div', {
        'aria-hidden': 'true',
        style: {
          height: 1,
          background: 'var(--dsw-alias-border-l1, rgba(127,127,127,0.22))',
          margin: '8px 0 6px',
        },
      }),
      rows.map(function (row) {
        return React.createElement('div', {
          key: row.key,
          style: {
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 12,
            lineHeight: '22px',
            fontSize: 11.5,
          },
        },
          React.createElement('span', { style: { color: UI.textSecondary } }, row.label),
          React.createElement('span', { style: { fontVariantNumeric: 'tabular-nums' } }, row.value),
        );
      }),
    );
  }

  /** 累计对话时长胶囊：悬浮时展开耗时分布卡。 */
  function DurationChip(props) {
    return React.createElement(HoverCard, {
      render: function (anchor) {
        return React.createElement(TimingCard, { timing: props.timing, anchor: anchor });
      },
    },
      React.createElement(MetricIcon, { name: 'duration' }),
      durationText(props.timing.wallMs),
    );
  }

  /** Token 用量胶囊：悬浮时展开明细卡。 */
  function TokensChip(props) {
    var parts = props.parts;
    return React.createElement(HoverCard, {
      render: function (anchor) {
        return React.createElement(TokensCard, { parts: parts, anchor: anchor });
      },
    },
      React.createElement(MetricIcon, { name: 'tokens' }),
      tt('fact.tokens', { n: compactNumber(parts.total) }),
    );
  }

  /** 「当前」徽章：挂在会话标题前，不占底部信息行。 */
  function CurrentBadge() {
    return React.createElement('span', {
      style: {
        flex: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        padding: '0 6px',
        borderRadius: 4,
        border: '1px solid rgba(59,130,246,0.45)',
        background: 'rgba(59,130,246,0.10)',
        color: HEAT_INK,
        fontSize: '0.68em',
        lineHeight: '16px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      },
    },
      React.createElement(MetricIcon, { name: 'current' }),
      tt('fact.current'),
    );
  }

  function MetaChip(props) {
    return React.createElement(
      'span',
      {
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: 0,
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
   * 「工作中」标识：官方鲸尾动图 + 文字，替代原来的描边小徽章。
   * 动画是 GIF 自己的帧序列，这里不加任何 transform，避免整张图被"晃"。
   */
  function WorkingTag(props) {
    var stacked = props && props.stacked === true;
    var compact = props && props.compact === true;
    var size = compact ? 22 : 28;
    return React.createElement(
      'span',
      {
        title: tt('running.title'),
        style: {
          display: 'inline-flex',
          flexDirection: stacked ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: stacked ? 3 : 6,
          color: HEAT_INK,
          fontSize: stacked ? '0.78em' : '0.8em',
          fontWeight: 700,
          lineHeight: '16px',
          whiteSpace: 'nowrap',
          flex: 'none',
        },
      },
      React.createElement('img', {
        src: ACTIVE_TAIL,
        alt: '',
        'aria-hidden': 'true',
        width: size,
        height: size,
        style: {
          display: 'block',
          width: size,
          height: size,
          filter: 'drop-shadow(0 0 4px color-mix(in srgb, var(--color-blue-500, #3b82f6) 55%, transparent))',
        },
      }),
      tt('running.working'),
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

  /** 把分组后的 chip 铺成一行：组内圆点、组间竖线。会话卡与工作区卡共用。 */
  function renderMetaGroups(groups) {
    var row = [];
    for (var g = 0; g < groups.length; g += 1) {
      if (g > 0) {
        row.push(React.createElement('span', {
          key: 'divider' + g,
          'aria-hidden': 'true',
          style: {
            flex: 'none',
            width: 1,
            height: 12,
            alignSelf: 'center',
            margin: '0 5px',
            background: 'var(--dsw-alias-border-l1, rgba(127,127,127,0.3))',
          },
        }));
      }
      for (var j = 0; j < groups[g].length; j += 1) {
        if (j > 0) row.push(React.createElement('span', { key: 'sep' + g + '_' + j, style: { opacity: 0.3 } }, '·'));
        row.push(groups[g][j]);
      }
    }
    return row;
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

    // 三组信息：① 缓存命中 / 上下文 ② 轮次 / tokens ③ 累计耗时 / 当前
    var groups = [];

    var groupA = [];
    if (session.cacheRate !== undefined && session.cacheRate !== '') {
      var cachePct = Number(session.cacheRate);
      groupA.push(React.createElement(MetaChip, { key: 'cache', icon: React.createElement(MetricIcon, { name: 'cache' }) },
        tt('fact.cache', { n: session.cacheRate }),
        React.createElement(MiniMeter, {
          ratio: isFinite(cachePct) ? cachePct / 100 : 0,
          color: HEAT_INK,
        }),
      ));
    }
    if (typeof session.contextPct === 'number') {
      groupA.push(React.createElement(MetaChip, { key: 'ctx', icon: React.createElement(MetricIcon, { name: 'context' }) },
        tt('fact.context', { n: session.contextPct }),
        React.createElement(MiniMeter, {
          ratio: session.contextPct / 100,
          color: contextMeterColor(session.contextPct),
        }),
      ));
    }
    if (groupA.length) groups.push(groupA);

    var groupB = [];
    if (typeof session.turns === 'number') {
      groupB.push(React.createElement(MetaChip, { key: 'turns', icon: React.createElement(MetricIcon, { name: 'turns' }) }, tt('fact.turns', { n: session.turns })));
    }
    if (typeof session.steps === 'number') {
      groupB.push(React.createElement(MetaChip, { key: 'steps', icon: React.createElement(MetricIcon, { name: 'steps' }) }, tt('fact.steps', { n: session.steps })));
    }
    if (session.tokenParts && typeof session.tokenParts.total === 'number') {
      groupB.push(React.createElement(TokensChip, { key: 'tokens', parts: session.tokenParts }));
    } else if (typeof session.tokens === 'number') {
      groupB.push(React.createElement(MetaChip, { key: 'tokens', icon: React.createElement(MetricIcon, { name: 'tokens' }) }, tt('fact.tokens', { n: compactNumber(session.tokens) })));
    }
    if (groupB.length) groups.push(groupB);

    var groupC = [];
    if (session.timing && typeof session.timing.wallMs === 'number' && session.timing.wallMs > 0) {
      groupC.push(React.createElement(DurationChip, { key: 'dur', timing: session.timing }));
    }
    if (session.at !== undefined) {
      groupC.push(React.createElement('span', {
        key: 'at',
        style: { whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' },
      }, relativeOf(session.at, now)));
    }
    if (groupC.length) groups.push(groupC);

    // 组内用圆点分隔，组间用竖线 + 更大留白，让同类信息聚在一起
    var metaRow = renderMetaGroups(groups);

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
          session.open ? React.createElement(CurrentBadge) : null,
          React.createElement('span', {
            style: {
              color: UI.textPrimary,
              fontWeight: 500,
              fontSize: '0.94em',
              lineHeight: '20px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: '1 1 auto',
              minWidth: 0,
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
            // 整行统一一个字号，chip 全部继承，不再各自覆盖
            fontSize: '0.88em',
            lineHeight: '23px',
            flexWrap: 'wrap',
          },
        }, metaRow),
      ),
      // 运行中：鲸鱼 + 工作中，落在卡片右侧的留白里（不用标题前的小徽章）
      session.running === true
        ? React.createElement('span', {
            key: 'working',
            style: {
              flex: 'none',
              width: 66,
              alignSelf: 'stretch',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            },
          }, React.createElement(WorkingTag, { stacked: true }))
        : null,
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
        // 三行：工作区名（上）→ 热度计（中）→ 相对时间（下）
        workspaceName
          ? React.createElement('span', {
              style: {
                width: '100%',
                textAlign: 'right',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '0.8em',
                lineHeight: '20px',
                color: UI.textTertiary,
              },
            }, workspaceName)
          : React.createElement('span', { style: { lineHeight: '20px' } }),
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
        // 用 aria-label 而不是 title：原生 tooltip 会在悬停时长胶囊时浮出来挡住耗时卡
        'aria-label': tt('card.openSessionTitle', { title: session.title || session.id }),
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

    // 工作区是汇总视图：能加总的（缓存/上下文/轮次/步数/tokens/耗时）才展示
    var groups = [];

    var groupA = [];
    if (group.billed > 0) {
      var cacheText = cacheHitTextOf(group.cacheRead, group.billed);
      if (cacheText !== undefined) {
        var cachePct = Number(cacheText);
        groupA.push(React.createElement(MetaChip, { key: 'cache', icon: React.createElement(MetricIcon, { name: 'cache' }) },
          tt('fact.cache', { n: cacheText }),
          React.createElement(MiniMeter, {
            ratio: isFinite(cachePct) ? cachePct / 100 : 0,
            color: HEAT_INK,
          }),
        ));
      }
    }
    if (typeof group.maxContextPct === 'number') {
      groupA.push(React.createElement(MetaChip, { key: 'ctx', icon: React.createElement(MetricIcon, { name: 'context' }) },
        tt('fact.context', { n: group.maxContextPct }),
        React.createElement(MiniMeter, {
          ratio: group.maxContextPct / 100,
          color: contextMeterColor(group.maxContextPct),
        }),
      ));
    }
    if (groupA.length) groups.push(groupA);

    var groupB = [
      React.createElement(MetaChip, { key: 'sessions', icon: React.createElement(MetricIcon, { name: 'sessions' }) },
        tt('group.sessions', { count: group.count })),
    ];
    if (group.turns > 0) {
      groupB.push(React.createElement(MetaChip, { key: 'turns', icon: React.createElement(MetricIcon, { name: 'turns' }) }, tt('fact.turns', { n: group.turns })));
    }
    if (group.steps > 0) {
      groupB.push(React.createElement(MetaChip, { key: 'steps', icon: React.createElement(MetricIcon, { name: 'steps' }) }, tt('fact.steps', { n: group.steps })));
    }
    if (group.tokens > 0) {
      groupB.push(React.createElement(MetaChip, { key: 'tokens', icon: React.createElement(MetricIcon, { name: 'tokens' }) }, tt('fact.tokens', { n: compactNumber(group.tokens) })));
    }
    groups.push(groupB);

    var groupC = [];
    if (group.wallMs > 0) {
      groupC.push(React.createElement('span', {
        key: 'dur',
        style: { display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' },
      },
        React.createElement(MetricIcon, { name: 'duration' }),
        durationText(group.wallMs),
      ));
    }
    groupC.push(React.createElement('span', {
      key: 'at',
      style: { whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' },
    }, relativeOf(group.at, now)));
    groups.push(groupC);

    var metaRow = renderMetaGroups(groups);

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
        'aria-label': openable ? tt('card.openWorkspaceTitle', { name: group.label }) : tt('workspace.ungroupedTitle'),
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
          running ? React.createElement(WorkingTag, { compact: true }) : null,
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
        React.createElement('span', {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: UI.textSecondary,
            fontSize: '0.88em',
            lineHeight: '23px',
            flexWrap: 'wrap',
          },
        }, metaRow),
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
          // 上下留出光晕的呼吸空间：overflow 容器会裁掉卡片外发光，
          // 首尾卡片贴着边缘时动效就看不全了
          padding: '12px ' + UI.padX + 'px',
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
          ? React.createElement(WorkingTag, { compact: true })
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
        // 鲸尾徽标由 GIF 自己的帧序列驱动，这里不再注册动画
        '@media (prefers-reduced-motion: reduce){',
        '@keyframes ah-orbit{from{transform:rotate(0deg)}to{transform:rotate(0deg)}}',
        '@keyframes ah-breathe{0%,100%{box-shadow:none}50%{box-shadow:none}}',
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
