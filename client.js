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
 * 键在运行时被扁平化：`panel.sessionsCount`、`relative.minutes` 等，与
 * `ctx.locale.bind(ns)` 的插值语法 `{name}` 一致。
 */
var AH_I18N = /* AH_I18N_START */ {
  zh: {
    nav: '最近活跃会话',
    panel: {
      sessionsCount: '会话 {count}',
      workspacesCount: '工作区 {count}',
      countLabel: '条数',
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
      heatLevel: '热度 {level}/5',
      heatRunning: '热度 {level}/5 · 工作中',
      lastActive: '最后活动：{time}',
      workspaceRank: '工作区「{name}」排第 {rank}',
      workspaceHot: '工作区「{name}」正热',
      noData: '暂无活动记录',
    },
    field: {
      turns: '轮次',
      tokens: 'Tokens',
      cache: '缓存命中',
      context: '上下文',
    },
    dot: { tooltip: '热度 {level}/5 · {time}' },
    running: {
      label: '运行中',
      title: '该会话正在运行',
      short: '正在运行',
      working: '工作中',
    },
    status: {
      done: '已完成',
      doneTitle: '该会话已完成，尚未查看',
      awaiting: '等待回答',
      awaitingTitle: '该会话在等待你的回答',
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
    menu: {
      openSession: '打开会话',
      openWorkspace: '打开工作区',
      newSessionInWorkspace: '在工作区中新开会话',
      copyId: '复制会话 ID',
      copyTitle: '复制标题',
      copyPrompt: '复制最近提示词',
      copyCwd: '复制工作目录',
      copyWorkspaceName: '复制工作区名称',
      copyWorkspacePath: '复制工作区路径',
      pin: '置顶会话',
      unpin: '取消置顶',
      rename: '重命名…',
      fork: '分叉会话',
      downloadLog: '下载会话日志',
      archive: '归档会话',
      archiveRunningHint: '正在运行，请先停止',
      unavailable: '当前宿主不支持',
      openTerminal: '在终端中打开',
      openWith: '在其他应用中打开…',
      openWithUnavailable: '未检测到可用的应用',
      openWithNoPath: '该会话没有可打开的目录',
    },
    toast: {
      copied: '已复制',
      pin: '已在侧栏置顶',
      unpin: '已取消置顶',
      renamed: '已重命名',
      forked: '已创建分支',
      archived: '已归档',
      unarchived: '已恢复',
      undo: '撤销',
      openedWith: '已在 {app} 中打开',
      terminalOpened: '已打开终端',
    },
    dialog: {
      archiveTitle: '归档会话？',
      archiveBody: '「{title}」会从最近活跃列表移除，可在侧栏的已归档会话中恢复。',
      archiveConfirm: '归档',
      archiving: '归档中…',
      renameTitle: '重命名会话',
      renamePlaceholder: '会话标题',
      save: '保存',
      cancel: '取消',
      saving: '保存中…',
      emptyTitle: '标题不能为空',
    },
    error: {
      copy: '复制失败',
      pin: '置顶失败',
      unpin: '取消置顶失败',
      rename: '重命名失败',
      fork: '分叉失败',
      archive: '归档失败',
      unarchive: '恢复失败',
      export: '当前安装不支持导出',
      running: '会话仍在运行，无法归档',
      start: '新建会话失败',
      openWith: '打开失败',
      openTerminal: '打开终端失败',
    },
    openWith: {
      title: '打开方式',
      item: '在{app}中打开',
    },
    app: {
      explorer: '文件资源管理器',
      finder: '访达',
      filemanager: '文件管理器',
      vscode: 'VS Code',
      vscodeinsiders: 'VS Code Insiders',
      cursor: 'Cursor',
      windsurf: 'Windsurf',
      zed: 'Zed',
      sublimetext: 'Sublime Text',
      xcode: 'Xcode',
      androidstudio: 'Android Studio',
      intellijidea: 'IntelliJ IDEA',
      pycharm: 'PyCharm',
      webstorm: 'WebStorm',
      phpstorm: 'PhpStorm',
      goland: 'GoLand',
      rider: 'Rider',
      rustrover: 'RustRover',
      terminal: '终端',
      windowsterminal: 'Windows Terminal',
      iterm: 'iTerm2',
      warp: 'Warp',
      ghostty: 'Ghostty',
      kitty: 'kitty',
      gnometerminal: 'GNOME Terminal',
      konsole: 'Konsole',
      fork: 'Fork',
      sourcetree: 'Sourcetree',
      github: 'GitHub Desktop',
      tower: 'Tower',
      gitkraken: 'GitKraken',
      smartgit: 'SmartGit',
      sublimemerge: 'Sublime Merge',
    },
  },
  en: {
    nav: 'Recent Activity',
    panel: {
      sessionsCount: 'Sessions {count}',
      workspacesCount: 'Workspaces {count}',
      countLabel: 'Count',
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
      heatLevel: 'Heat {level}/5',
      heatRunning: 'Heat {level}/5 · working',
      lastActive: 'Last active: {time}',
      workspaceRank: 'Workspace “{name}” ranks #{rank}',
      workspaceHot: 'Workspace “{name}” is hot',
      noData: 'No activity recorded',
    },
    field: {
      turns: 'Turns',
      tokens: 'Tokens',
      cache: 'Cache',
      context: 'Context',
    },
    dot: { tooltip: 'Heat {level}/5 · {time}' },
    running: {
      label: 'Running',
      title: 'This session is running',
      short: 'Running',
      working: 'Working',
    },
    status: {
      done: 'Done',
      doneTitle: 'Finished, not viewed yet',
      awaiting: 'Waiting',
      awaitingTitle: 'This session is waiting for your answer',
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
    menu: {
      openSession: 'Open session',
      openWorkspace: 'Open workspace',
      newSessionInWorkspace: 'New session in workspace',
      copyId: 'Copy session ID',
      copyTitle: 'Copy title',
      copyPrompt: 'Copy latest prompt',
      copyCwd: 'Copy working directory',
      copyWorkspaceName: 'Copy workspace name',
      copyWorkspacePath: 'Copy workspace path',
      pin: 'Pin session',
      unpin: 'Unpin session',
      rename: 'Rename…',
      fork: 'Fork session',
      downloadLog: 'Download session log',
      archive: 'Archive session',
      archiveRunningHint: 'Running — stop it first',
      unavailable: 'Not supported by this host',
      openTerminal: 'Open in terminal',
      openWith: 'Open in…',
      openWithUnavailable: 'No compatible app detected',
      openWithNoPath: 'This session has no directory to open',
    },
    toast: {
      copied: 'Copied',
      pin: 'Pinned in the sidebar',
      unpin: 'Unpinned',
      renamed: 'Renamed',
      forked: 'Branch created',
      archived: 'Archived',
      unarchived: 'Restored',
      undo: 'Undo',
      openedWith: 'Opened in {app}',
      terminalOpened: 'Terminal opened',
    },
    dialog: {
      archiveTitle: 'Archive this session?',
      archiveBody: '“{title}” leaves the recent list and can be restored from archived sessions in the sidebar.',
      archiveConfirm: 'Archive',
      archiving: 'Archiving…',
      renameTitle: 'Rename session',
      renamePlaceholder: 'Session title',
      save: 'Save',
      cancel: 'Cancel',
      saving: 'Saving…',
      emptyTitle: 'Title cannot be empty',
    },
    error: {
      copy: 'Copy failed',
      pin: 'Pin failed',
      unpin: 'Unpin failed',
      rename: 'Rename failed',
      fork: 'Fork failed',
      archive: 'Archive failed',
      unarchive: 'Restore failed',
      export: 'Export is not available in this installation',
      running: 'The session is still running and cannot be archived',
      start: 'New session failed',
      openWith: 'Open failed',
      openTerminal: 'Failed to open a terminal',
    },
    openWith: {
      title: 'Open with',
      item: 'Open in {app}',
    },
    app: {
      explorer: 'File Explorer',
      finder: 'Finder',
      filemanager: 'File manager',
      vscode: 'VS Code',
      vscodeinsiders: 'VS Code Insiders',
      cursor: 'Cursor',
      windsurf: 'Windsurf',
      zed: 'Zed',
      sublimetext: 'Sublime Text',
      xcode: 'Xcode',
      androidstudio: 'Android Studio',
      intellijidea: 'IntelliJ IDEA',
      pycharm: 'PyCharm',
      webstorm: 'WebStorm',
      phpstorm: 'PhpStorm',
      goland: 'GoLand',
      rider: 'Rider',
      rustrover: 'RustRover',
      terminal: 'Terminal',
      windowsterminal: 'Windows Terminal',
      iterm: 'iTerm2',
      warp: 'Warp',
      ghostty: 'Ghostty',
      kitty: 'kitty',
      gnometerminal: 'GNOME Terminal',
      konsole: 'Konsole',
      fork: 'Fork',
      sourcetree: 'Sourcetree',
      github: 'GitHub Desktop',
      tower: 'Tower',
      gitkraken: 'GitKraken',
      smartgit: 'SmartGit',
      sublimemerge: 'Sublime Merge',
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

  /**
   * 热度色阶（低 → 高）：灰 → 深灰 → 灰蓝 → 蓝 → 亮蓝。
   *
   * 低档刻意不用蓝色：中性的 label 令牌在浅色主题下是浅灰、在深色主题下是暗灰，
   * 同一个公式在两种主题里分别读作"浅灰"和"灰黑"，不需要按主题写两套。
   * 高档再用蓝色，让"热"在列表里一眼可辨。
   *
   * 低档的透明度不要压太低：竖条是靠"整条都有颜色"撑质感的，30% 的灰在
   * 白底上几乎看不见，看起来就像一根没渲染完的条。
   */
  var HEAT_TONES = [
    'color-mix(in srgb, var(--dsw-alias-label-tertiary, #7f8287) 42%, transparent)',
    'color-mix(in srgb, var(--dsw-alias-label-tertiary, #7f8287) 64%, transparent)',
    'color-mix(in srgb, var(--dsw-alias-label-secondary, #545557) 84%, transparent)',
    'color-mix(in srgb, var(--color-blue-500, #3b82f6) 52%, var(--dsw-alias-label-tertiary, #7f8287))',
    'color-mix(in srgb, var(--color-blue-500, #3b82f6) 82%, var(--color-blue-400, #60a5fa))',
    'var(--color-blue-500, #3b82f6)',
  ];

  /**
   * 竖条表面：整条保持档位色，只有顶部用同色 + 白提亮，像一根被光打到的玻璃条。
   *
   * 之前试过"主色 → 纯白"，结果下半截和白底融在一起、整条只剩顶端一点颜色。
   * 现在改成"顶部提亮 → 62% 处回到主色 → 底部保持主色"，不再掺白到消失。
   */
  function heatBarSurface(tone) {
    return 'linear-gradient(180deg, color-mix(in srgb, ' + tone + ' 74%, #fff) 0%, '
      + tone + ' 62%, ' + tone + ' 100%)';
  }

  /** 竖条的光影：顶部 1px 高光 + 发丝玻璃边缘，高温档再加外发光。 */
  function heatBarShadow(tone, level) {
    return 'inset 0 1px 0 rgba(255,255,255,.55), inset 0 0 0 0.5px rgba(255,255,255,.18)'
      + (level >= 4 ? ', 0 0 10px ' + tone : '');
  }

  function heatToneOf(level) {
    return HEAT_TONES[Math.max(0, Math.min(5, level || 0))];
  }

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
    textPrimary: 'var(--dsw-alias-label-primary)',
    textSecondary: 'var(--dsw-alias-label-secondary)',
    textTertiary: 'var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary))',
  };

  /**
   * ===== 视觉类名 =====
   *
   * 表面质感（半透明、磨砂、渐变、过渡、悬停）全部写在注入的 CSS 里，
   * 内联 style 只负责布局尺寸。原因：
   * 1. 伪元素（::-before/::-after）无法内联，而玻璃高光与扫光都靠它；
   * 2. `:hover`/`:focus-visible`/`prefers-reduced-motion` 只能在样式表里表达；
   * 3. 悬停效果交给 CSS 后，卡片不再为 hover 触发 React 重渲染。
   *
   * 类名集中在这里声明，避免各组件里散落拼写错误。
   */
  var AH = {
    shell: 'ah-shell',
    card: 'ah-card',
    cardRunning: 'ah-card--running',
    cardGroup: 'ah-card--group',
    chip: 'ah-chip',
    meterTrack: 'ah-meter-track',
    meterFill: 'ah-meter-fill',
    meterTick: 'ah-meter-tick',
    miniTrack: 'ah-mini-track',
    miniFill: 'ah-mini-fill',
    tab: 'ah-tab',
    seg: 'ah-seg',
    count: 'ah-count',
    badge: 'ah-current-badge',
    doneTag: 'ah-done-tag',
    doneGlyph: 'ah-done-glyph',
    awaitingTag: 'ah-awaiting-tag',
    awaitingGlyph: 'ah-awaiting-glyph',
    popover: 'ah-popover',
    popoverInner: 'ah-popover-inner',
    ring: 'ah-ring',
    stripSeg: 'ah-strip-seg',
    heatRing: 'ah-heat-ring',
    heatRingArc: 'ah-heat-ring-arc',
    heatRingCore: 'ah-heat-ring-core',
    scrollHint: 'ah-scroll-hint',
    empty: 'ah-empty',
    listInner: 'ah-list-inner',
    listMaskTop: 'ah-list-mask ah-list-mask--top',
    listMaskBottom: 'ah-list-mask ah-list-mask--bottom',
    filterBar: 'ah-filterbar',
    heatBar: 'ah-heat-bar',
    menu: 'ah-menu',
    menuItem: 'ah-menu-item',
    menuLabel: 'ah-menu-label',
    menuHint: 'ah-menu-hint',
    menuSep: 'ah-menu-sep',
    toast: 'ah-toast',
    toastAction: 'ah-toast-action',
    dialog: 'ah-dialog',
    dialogTitle: 'ah-dialog-title',
    dialogText: 'ah-dialog-text',
    dialogInput: 'ah-dialog-input',
    dialogError: 'ah-dialog-error',
    dialogActions: 'ah-dialog-actions',
    dialogButton: 'ah-dialog-button',
  };

  /**
   * ===== 注入样式 =====
   *
   * 配色只走宿主令牌 + color-mix，明暗主题自动适配；每个 var() 都带回退值，
   * 宿主换主题或删令牌时仍能画出一个可用的灰度玻璃。
   *
   * 关键取舍：
   * - 卡片静态不做 backdrop-filter（50 张卡同时模糊会掉帧），只在 ::before 里
   *   淡入磨砂层，悬停时才真正消耗 GPU；
   * - 运行中卡片（ah-card--running）保持不透明底，否则跑马灯光带会从卡片里透出来；
   * - 入场动画只动 opacity，不动 transform，避免盖掉悬停的 translateY。
   */
  var AH_CSS = [
    /* ---------- 局部令牌 ---------- */
    '.ah-shell{',
    '--ah-hi:rgba(255,255,255,.10);',
    '--ah-blur:blur(16px) saturate(130%);',
    '--ah-ease:var(--ds-ease-in-out, cubic-bezier(.4,0,.2,1));',
    'position:relative;isolation:isolate;',
    'animation:ah-shell-in 200ms ease both;',
    '}',
    'body[data-ds-dark-theme] .ah-shell{--ah-hi:rgba(255,255,255,.06);}',

    /* ---------- 面板外壳：不加背景渐变，直接叠在宿主底色上 ---------- */
    '@keyframes ah-shell-in{from{opacity:0}to{opacity:1}}',

    /* ---------- 卡片：玻璃表面 ---------- */
    '.ah-card{',
    'position:relative;z-index:1;overflow:hidden;',
    'border:1px solid color-mix(in srgb, var(--dsw-alias-border-l1, rgba(127,127,127,.18)) 72%, transparent);',
    'background-color:color-mix(in srgb, var(--dsw-specific-menu, rgba(127,127,127,.10)) 70%, var(--dsw-alias-bg-base, #fff));',
    'background-image:linear-gradient(180deg, var(--ah-hi, rgba(255,255,255,.10)), transparent 46%);',
    'box-shadow:0 1px 2px rgba(0,0,0,.03);',
    'transition:border-color 200ms var(--ah-ease), box-shadow 240ms var(--ah-ease),',
    'background-color 200ms var(--ah-ease), transform 180ms var(--ah-ease);',
    'animation:ah-card-in 240ms ease both;',
    '}',
    '.ah-card>*{position:relative;z-index:1;}',
    /* 磨砂层：悬停时淡入，静态零开销 */
    '.ah-card::before{',
    'content:"";position:absolute;inset:0;border-radius:inherit;z-index:0;pointer-events:none;',
    'background-image:linear-gradient(180deg, var(--ah-hi, rgba(255,255,255,.10)), transparent 60%);',
    'backdrop-filter:var(--ah-blur);-webkit-backdrop-filter:var(--ah-blur);',
    'opacity:0;transition:opacity 220ms var(--ah-ease);',
    '}',
    /* 斜向扫光已移除：悬停只保留轻微上浮、外发光与磨砂淡入 */
    '@media (hover: hover){',
    '.ah-card:hover{border-color:color-mix(in srgb, var(--color-blue-500, #3b82f6) 28%, var(--dsw-alias-border-l1, rgba(127,127,127,.18)));',
    'box-shadow:0 8px 20px -10px color-mix(in srgb, var(--color-blue-500, #3b82f6) 34%, transparent), inset 0 1px 0 var(--ah-hi, rgba(255,255,255,.10));',
    'transform:translateY(-1px);}',
    '.ah-card:hover::before{opacity:1;}',
    '.ah-card:active{transform:translateY(0) scale(.995);}',
    '}',
    '.ah-card:focus-visible{outline:2px solid var(--dsw-focus-ring-color, var(--color-blue-500, #3b82f6));outline-offset:1px;}',
    '@keyframes ah-card-in{from{opacity:0}to{opacity:1}}',

    /* 运行中卡片：实底遮住跑马灯，取消玻璃 */
    '.ah-card--running{',
    'background-color:var(--dsw-alias-bg-base, #fff);',
    'background-image:none;border:none;box-shadow:none;',
    'animation:none;transition:none;transform:none;',
    '}',
    '.ah-card--running::before{display:none;}',
    '.ah-card--running:hover{transform:none;box-shadow:none;}',
    'body[data-ds-dark-theme] .ah-card{background-image:linear-gradient(180deg, rgba(255,255,255,.06), transparent 46%);}',

    /* ---------- 热度条（主色由内联按档位给，再渐变到纯白） ---------- */
    '.ah-heat-bar{',
    'flex:none;align-self:stretch;border-radius:4px;',
    'transition:filter 220ms var(--ah-ease), box-shadow 220ms var(--ah-ease);',
    '}',
    '.ah-card:hover .ah-heat-bar{filter:brightness(1.12) saturate(1.05);}',

    /* ---------- 热度计 / 迷你条 ---------- */
    '.ah-meter-track{position:relative;display:block;border-radius:999px;overflow:hidden;flex:none;',
    'background:color-mix(in srgb, var(--dsw-alias-border-l1, rgba(127,127,127,.22)) 66%, transparent);',
    'box-shadow:inset 0 1px 2px rgba(0,0,0,.10);}',
    '.ah-meter-fill{position:absolute;left:0;top:0;bottom:0;border-radius:999px;',
    'background-image:linear-gradient(90deg, transparent, rgba(255,255,255,.16));',
    'transition:width 200ms var(--ah-ease), opacity 200ms var(--ah-ease), background-color 260ms var(--ah-ease), filter 220ms var(--ah-ease);}',
    '.ah-meter-tick{position:absolute;top:0;bottom:0;width:1px;background:var(--dsw-alias-bg-layer-1, rgba(0,0,0,.35));opacity:.45;}',
    '.ah-mini-track{position:relative;display:inline-block;border-radius:999px;overflow:hidden;flex:none;vertical-align:middle;',
    'background:color-mix(in srgb, var(--dsw-alias-border-l1, rgba(127,127,127,.22)) 66%, transparent);',
    'box-shadow:inset 0 1px 1px rgba(0,0,0,.08);}',
    '.ah-mini-fill{position:absolute;left:0;top:0;bottom:0;border-radius:999px;opacity:.92;',
    'background-image:linear-gradient(90deg, transparent, rgba(255,255,255,.22));}',
    '.ah-card:hover .ah-meter-fill{box-shadow:0 0 9px color-mix(in srgb, var(--color-blue-500, #3b82f6) 55%, transparent);}',

    /* ---------- 顶部：筛选 tab / 分段 / 数量 ---------- */
    '.ah-filterbar{position:relative;border-bottom:1px solid color-mix(in srgb, var(--dsw-alias-border-l1, rgba(127,127,127,.18)) 65%, transparent);}',
    '.ah-filterbar::after{content:"";position:absolute;left:18px;right:18px;bottom:-1px;height:1px;pointer-events:none;',
    'background:linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-blue-500, #3b82f6) 26%, transparent) 30%, color-mix(in srgb, var(--color-blue-500, #3b82f6) 26%, transparent) 70%, transparent);}',
    '.ah-tab{position:relative;border:none;background:transparent;font:inherit;cursor:pointer;',
    'color:var(--dsw-alias-label-secondary);transition:color 180ms var(--ah-ease);}',
    '.ah-tab::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:2px;border-radius:1px;',
    'background:linear-gradient(90deg, transparent, var(--color-blue-500, #3b82f6) 26%, var(--color-blue-500, #3b82f6) 74%, transparent);',
    'transform:scaleX(0);transform-origin:left center;opacity:0;',
    'transition:transform 220ms var(--ah-ease), opacity 220ms var(--ah-ease);}',
    '.ah-tab[data-active="true"]{color:var(--color-blue-500, #3b82f6);font-weight:600;}',
    '.ah-tab[data-active="true"]::after{transform:scaleX(1);opacity:1;}',
    '@media (hover: hover){',
    '.ah-tab:hover{color:var(--dsw-alias-label-primary);}',
    '.ah-tab:hover::after{transform:scaleX(.42);opacity:.45;}',
    '.ah-tab[data-active="true"]:hover::after{transform:scaleX(1);opacity:1;}',
    '}',
    '.ah-seg{border:1px solid transparent;border-radius:7px;background-color:transparent;font:inherit;cursor:pointer;font-weight:400;',
    'color:var(--dsw-alias-label-secondary);',
    'transition:background-color 180ms var(--ah-ease), color 180ms var(--ah-ease), border-color 180ms var(--ah-ease), box-shadow 180ms var(--ah-ease);}',
    '.ah-seg[data-active="false"]{border-color:color-mix(in srgb, var(--dsw-alias-border-l1, rgba(127,127,127,.22)) 55%, transparent);}',
    '.ah-seg[data-active="true"]{color:#fff;font-weight:600;',
    'background-color:var(--color-blue-500, #3b82f6);',
    'background-image:linear-gradient(135deg, color-mix(in srgb, var(--color-blue-600, #2563eb) 86%, #000), var(--color-blue-500, #3b82f6) 55%, color-mix(in srgb, var(--color-blue-400, #60a5fa) 72%, var(--color-blue-500, #3b82f6)));',
    'box-shadow:inset 0 1px 0 rgba(255,255,255,.28), 0 2px 8px -2px color-mix(in srgb, var(--color-blue-500, #3b82f6) 48%, transparent);}',
    '@media (hover: hover){',
    '.ah-seg:hover{background-color:color-mix(in srgb, var(--color-blue-500, #3b82f6) 7%, transparent);}',
    '.ah-seg[data-active="true"]:hover{background-color:var(--color-blue-500, #3b82f6);}',
    '}',
    '.ah-count{position:relative;isolation:isolate;border:1px solid transparent;border-radius:6px;background:transparent;font:inherit;cursor:pointer;',
    'color:var(--dsw-alias-label-tertiary);transition:color 160ms var(--ah-ease);}',
    '.ah-count::before{content:"";position:absolute;inset:0;z-index:-1;border-radius:inherit;pointer-events:none;opacity:0;',
    'border:1px solid color-mix(in srgb, var(--color-blue-500, #3b82f6) 20%, transparent);',
    'background-image:linear-gradient(135deg, color-mix(in srgb, var(--color-blue-500, #3b82f6) 16%, transparent), transparent 72%);',
    'transition:opacity 180ms var(--ah-ease);}',
    '.ah-count[data-active="true"]{color:var(--color-blue-500, #3b82f6);font-weight:600;}',
    '.ah-count[data-active="true"]::before{opacity:1;}',
    '@media (hover: hover){.ah-count:hover{color:var(--dsw-alias-label-secondary);}}',

    /* ---------- 徽章 / 芯片 ---------- */
    '.ah-current-badge{border:1px solid color-mix(in srgb, var(--color-blue-500, #3b82f6) 40%, transparent);',
    'background-color:color-mix(in srgb, var(--color-blue-500, #3b82f6) 10%, transparent);',
    'background-image:linear-gradient(135deg, rgba(255,255,255,.18), transparent 62%);',
    'box-shadow:inset 0 1px 0 rgba(255,255,255,.22);color:var(--color-blue-500, #3b82f6);}',
    /* 已完成（未查看）：绿色系；等待回答：琥珀色。两者与蓝色的热度 / 运行中明确区分 */
    '.ah-done-tag{color:var(--dsw-alias-state-success-primary, #22c55e);}',
    '.ah-done-glyph{filter:drop-shadow(0 0 4px color-mix(in srgb, var(--dsw-alias-state-success-primary, #22c55e) 42%, transparent));',
    'animation:ah-done-breathe 3.2s ease-in-out infinite;}',
    '.ah-awaiting-tag{color:var(--dsw-alias-state-warn-primary, #f59e0b);}',
    '.ah-awaiting-glyph{filter:drop-shadow(0 0 4px color-mix(in srgb, var(--dsw-alias-state-warn-primary, #f59e0b) 42%, transparent));',
    'animation:ah-done-breathe 3.2s ease-in-out infinite;}',
    '@keyframes ah-done-breathe{0%,100%{opacity:.72;transform:scale(.96)}50%{opacity:1;transform:scale(1.05)}}',
    '.ah-chip{border:1px solid transparent;border-radius:6px;padding:1px 5px;margin:-1px -1px;',
    'color:var(--dsw-alias-label-secondary);',
    'transition:background-color 160ms var(--ah-ease), border-color 160ms var(--ah-ease), color 160ms var(--ah-ease);}',
    '@media (hover: hover){',
    '.ah-chip:hover{background-color:color-mix(in srgb, var(--color-blue-500, #3b82f6) 8%, transparent);',
    'border-color:color-mix(in srgb, var(--color-blue-500, #3b82f6) 16%, transparent);color:var(--dsw-alias-label-primary);}',
    '}',

    /* ---------- 悬浮浮层 ---------- */
    '.ah-popover{',
    'border:.5px solid color-mix(in srgb, var(--dsw-alias-border-l1, rgba(127,127,127,.22)) 80%, transparent);',
    'border-radius:var(--dsw-radius-lg, 14px);',
    'background-color:color-mix(in srgb, var(--dsw-specific-menu, rgba(127,127,127,.12)) 88%, var(--dsw-alias-bg-base, #fff));',
    'backdrop-filter:var(--dsw-menu-backdrop-filter, blur(18px) saturate(140%));',
    '-webkit-backdrop-filter:var(--dsw-menu-backdrop-filter, blur(18px) saturate(140%));',
    'box-shadow:var(--dsw-shadow-lv3, 0 12px 32px rgba(0,0,0,.16)), inset 0 1px 0 rgba(255,255,255,.20);',
    '}',
    '.ah-popover-inner{display:flex;flex-direction:column;--ah-pop-y:4px;',
    'animation:ah-pop-in 170ms cubic-bezier(.22,1,.36,1) both;}',
    '.ah-popover[data-closing="true"] .ah-popover-inner{animation:ah-pop-out 130ms ease-in both;}',
    '@keyframes ah-pop-in{from{opacity:0;transform:translateY(var(--ah-pop-y, 4px)) scale(.985)}to{opacity:1;transform:none}}',
    '@keyframes ah-pop-out{from{opacity:1;transform:none}to{opacity:0;transform:translateY(calc(var(--ah-pop-y, 4px) * -.6)) scale(.99)}}',
    '@keyframes ah-ring-in{from{opacity:.35;transform:rotate(-90deg) scale(.92)}to{opacity:1;transform:rotate(0) scale(1)}}',
    '@keyframes ah-strip-grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}',
    '.ah-ring{animation:ah-ring-in 300ms cubic-bezier(.22,1,.36,1) both;}',
    '.ah-strip-seg{transform-origin:left center;animation:ah-strip-grow 280ms cubic-bezier(.22,1,.36,1) both;}',
    'body[data-ds-dark-theme] .ah-popover{box-shadow:0 16px 40px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.08);}',

    /* ---------- 右键菜单 / 确认框 / 提示 ---------- */
    '.ah-menu{',
    'border:.5px solid color-mix(in srgb, var(--dsw-alias-border-l1, rgba(127,127,127,.22)) 80%, transparent);',
    'border-radius:12px;padding:6px;',
    'background-color:color-mix(in srgb, var(--dsw-specific-menu, rgba(127,127,127,.12)) 92%, var(--dsw-alias-bg-base, #fff));',
    'backdrop-filter:var(--dsw-menu-backdrop-filter, blur(18px) saturate(140%));',
    '-webkit-backdrop-filter:var(--dsw-menu-backdrop-filter, blur(18px) saturate(140%));',
    'box-shadow:var(--dsw-shadow-lv3, 0 12px 32px rgba(0,0,0,.16)), inset 0 1px 0 rgba(255,255,255,.20);',
    'animation:ah-menu-in 120ms var(--ah-ease) both;',
    '}',
    '@keyframes ah-menu-in{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:none}}',
    '.ah-menu-item{display:flex;align-items:center;gap:8px;width:100%;min-height:30px;padding:5px 9px;',
    'border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-label-primary);',
    'font:inherit;text-align:left;cursor:pointer;',
    'transition:background-color 120ms var(--ah-ease),color 120ms var(--ah-ease);}',
    '.ah-menu-item[data-active="true"]{background-color:color-mix(in srgb, var(--color-blue-500, #3b82f6) 10%, transparent);}',
    '.ah-menu-item[aria-disabled="true"]{opacity:.42;cursor:default;}',
    '.ah-menu-item[data-danger="true"]{color:color-mix(in srgb, var(--color-red-500, #ef4444) 78%, var(--dsw-alias-label-primary));}',
    '.ah-menu-item[data-danger="true"][data-active="true"]{background-color:color-mix(in srgb, var(--color-red-500, #ef4444) 12%, transparent);}',
    '.ah-menu-label{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.82em;line-height:20px;}',
    '.ah-menu-hint{flex:none;max-width:96px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;',
    'color:var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));font-size:.7em;}',
    '.ah-menu-sep{height:1px;margin:5px 7px;background:color-mix(in srgb, var(--dsw-alias-border-l1, rgba(127,127,127,.22)) 80%, transparent);}',
    '.ah-dialog{position:fixed;left:50%;top:18%;transform:translateX(-50%);z-index:2200;',
    'width:min(320px, calc(100vw - 32px));padding:14px 16px;',
    'border:.5px solid color-mix(in srgb, var(--dsw-alias-border-l1, rgba(127,127,127,.22)) 80%, transparent);',
    'border-radius:14px;',
    'background-color:color-mix(in srgb, var(--dsw-specific-menu, rgba(127,127,127,.12)) 92%, var(--dsw-alias-bg-base, #fff));',
    'backdrop-filter:var(--dsw-menu-backdrop-filter, blur(18px) saturate(140%));',
    '-webkit-backdrop-filter:var(--dsw-menu-backdrop-filter, blur(18px) saturate(140%));',
    'box-shadow:var(--dsw-shadow-lv3, 0 16px 40px rgba(0,0,0,.22)), inset 0 1px 0 rgba(255,255,255,.20);',
    'animation:ah-menu-in 140ms var(--ah-ease) both;}',
    '.ah-dialog-title{font-size:.9em;font-weight:650;color:var(--dsw-alias-label-primary);}',
    '.ah-dialog-text{margin-top:6px;font-size:.78em;line-height:19px;color:var(--dsw-alias-label-secondary);}',
    '.ah-dialog-input{margin-top:10px;width:100%;box-sizing:border-box;padding:6px 8px;border-radius:8px;',
    'border:1px solid color-mix(in srgb, var(--dsw-alias-border-l1, rgba(127,127,127,.22)) 80%, transparent);',
    'background-color:color-mix(in srgb, var(--dsw-alias-bg-base, #fff) 72%, transparent);',
    'color:var(--dsw-alias-label-primary);font:inherit;font-size:.82em;outline:none;}',
    '.ah-dialog-input:focus{border-color:color-mix(in srgb, var(--color-blue-500, #3b82f6) 55%, transparent);}',
    '.ah-dialog-error{margin-top:8px;font-size:.74em;color:color-mix(in srgb, var(--color-red-500, #ef4444) 80%, var(--dsw-alias-label-primary));}',
    '.ah-dialog-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:14px;}',
    '.ah-dialog-button{padding:4px 10px;border-radius:8px;',
    'border:1px solid color-mix(in srgb, var(--dsw-alias-border-l1, rgba(127,127,127,.22)) 80%, transparent);',
    'background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:.78em;cursor:pointer;}',
    '.ah-dialog-button[data-primary="true"]{border-color:transparent;background-color:var(--color-blue-500, #3b82f6);color:#fff;font-weight:600;}',
    '.ah-dialog-button[data-primary="true"][data-danger="true"]{background-color:color-mix(in srgb, var(--color-red-500, #ef4444) 88%, #000);}',
    '.ah-dialog-button:disabled{opacity:.5;cursor:default;}',
    '.ah-toast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:2200;',
    'display:flex;align-items:center;gap:10px;max-width:min(420px, calc(100vw - 32px));padding:7px 12px;border-radius:10px;',
    'border:.5px solid color-mix(in srgb, var(--dsw-alias-border-l1, rgba(127,127,127,.22)) 80%, transparent);',
    'background-color:color-mix(in srgb, var(--dsw-specific-menu, rgba(127,127,127,.12)) 92%, var(--dsw-alias-bg-base, #fff));',
    'backdrop-filter:var(--dsw-menu-backdrop-filter, blur(18px) saturate(140%));',
    '-webkit-backdrop-filter:var(--dsw-menu-backdrop-filter, blur(18px) saturate(140%));',
    'box-shadow:var(--dsw-shadow-lv3, 0 12px 32px rgba(0,0,0,.18)), inset 0 1px 0 rgba(255,255,255,.20);',
    'color:var(--dsw-alias-label-primary);font-size:.78em;',
    'animation:ah-toast-in 160ms var(--ah-ease) both;}',
    '@keyframes ah-toast-in{from{opacity:0;transform:translate(-50%,6px)}to{opacity:1;transform:translate(-50%,0)}}',
    '.ah-toast[data-tone="error"]{color:color-mix(in srgb, var(--color-red-500, #ef4444) 78%, var(--dsw-alias-label-primary));}',
    '.ah-toast-action{border:0;background:transparent;color:var(--color-blue-500, #3b82f6);font:inherit;font-size:.95em;font-weight:600;cursor:pointer;padding:0;}',

    /* ---------- 侧栏入口环 ---------- */
    '.ah-heat-ring{transition:filter 200ms var(--ah-ease);}',
    '.ah-heat-ring-arc{background:conic-gradient(from -90deg,',
    'color-mix(in srgb, var(--color-blue-500, #3b82f6) 14%, transparent) 0deg,',
    'color-mix(in srgb, var(--color-blue-500, #3b82f6) 55%, transparent) 250deg,',
    'var(--color-blue-500, #3b82f6) 360deg);',
    'mask:radial-gradient(farthest-side, transparent calc(100% - 1.8px), #000 calc(100% - 1.6px));',
    '-webkit-mask:radial-gradient(farthest-side, transparent calc(100% - 1.8px), #000 calc(100% - 1.6px));}',
    '.ah-heat-ring-core{background-image:radial-gradient(circle at 34% 30%, color-mix(in srgb, #fff 32%, var(--color-blue-500, #3b82f6)), var(--color-blue-500, #3b82f6));',
    'box-shadow:0 0 6px color-mix(in srgb, var(--color-blue-500, #3b82f6) 45%, transparent);}',
    '@media (hover: hover){.ah-heat-ring:hover{filter:brightness(1.14) saturate(1.08);}}',

    /* ---------- 宿主行悬停卡：从固定深色改为跟随主题 ----------
     * 宿主的 HoverCard 硬编码 --dsw-hovercard-bg:#2C2C2E，并用 #fff/#cfd3d6 写死标题/时间/
     * 状态的文字色（类名 wnFoaW_hoverTitle 等）。插件内容用的是主题 token，在深色卡上
     * 反而变成深字低对比。这里用 :has(.ah-hover-content) 精确定位"装了本插件内容的卡"，
     * 把底色与宿主那几行文字一起改回主题色。宿主升级若改了 local 名，需要同步这些选择器。
     */
    '[class*="_card_"]:has(.ah-hover-content){--dsw-hovercard-bg:var(--dsw-alias-bg-base, #fff);',
    'color:var(--dsw-alias-label-primary);}',
    '[class*="_card_"]:has(.ah-hover-content) [class*="_hoverTitle"]{color:var(--dsw-alias-label-primary);}',
    '[class*="_card_"]:has(.ah-hover-content) [class*="_hoverPath"],',
    '[class*="_card_"]:has(.ah-hover-content) [class*="_hoverTime"],',
    '[class*="_card_"]:has(.ah-hover-content) [class*="_hoverStatus"]{color:var(--dsw-alias-label-secondary);}',

    /* ---------- 列表与空态 ---------- */
    '.ah-list-inner{animation:ah-fade-in 220ms ease both;}',
    '.ah-empty{animation:ah-fade-in 260ms ease both;}',
    '@keyframes ah-fade-in{from{opacity:0}to{opacity:1}}',
    '.ah-list-mask{position:absolute;left:0;right:0;height:14px;z-index:2;pointer-events:none;}',
    '.ah-list-mask--top{top:0;background:linear-gradient(to bottom, color-mix(in srgb, var(--dsw-alias-bg-base, #fff) 90%, transparent), transparent);}',
    '.ah-list-mask--bottom{bottom:0;background:linear-gradient(to top, color-mix(in srgb, var(--dsw-alias-bg-base, #fff) 90%, transparent), transparent);}',
    '.ah-scroll-hint{position:absolute;z-index:3;background-color:color-mix(in srgb, var(--dsw-specific-menu, rgba(127,127,127,.12)) 72%, transparent);',
    'backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);',
    'border:.5px solid color-mix(in srgb, var(--dsw-alias-border-l1, rgba(127,127,127,.2)) 70%, transparent);}',

    /* ---------- 运行中：跑马灯与呼吸 ---------- */
    '@keyframes ah-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(.82)}}',
    '@keyframes ah-orbit{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}',
    '@keyframes ah-breathe{',
    '0%,100%{box-shadow:0 0 0 0 color-mix(in srgb, var(--color-blue-500, #3b82f6) 0%, transparent)}',
    '50%{box-shadow:0 0 14px 2px color-mix(in srgb, var(--color-blue-500, #3b82f6) 45%, transparent)}',
    '}',
    '@keyframes ah-dot-pulse{',
    '0%,100%{opacity:.55;transform:scale(.85);box-shadow:0 0 0 0 color-mix(in srgb, var(--color-blue-500, #3b82f6) 0%, transparent)}',
    '50%{opacity:1;transform:scale(1.15);box-shadow:0 0 6px 1px color-mix(in srgb, var(--color-blue-500, #3b82f6) 32%, transparent)}',
    '}',

    /* ---------- 列表滚动条 ---------- */
    '.ah-list{scrollbar-width:none;-ms-overflow-style:none;}',
    '.ah-list::-webkit-scrollbar{width:0;height:0;display:none;}',

    /* ---------- 减少动态 ---------- */
    '@media (prefers-reduced-motion: reduce){',
    '@keyframes ah-orbit{from{transform:rotate(0deg)}to{transform:rotate(0deg)}}',
    '@keyframes ah-breathe{0%,100%{box-shadow:none}50%{box-shadow:none}}',
    '@keyframes ah-dot-pulse{0%,100%{opacity:.8;transform:none;box-shadow:none}50%{opacity:1;transform:none;box-shadow:none}}',
    '@keyframes ah-done-breathe{0%,100%{opacity:1;transform:none}50%{opacity:1;transform:none}}',
    '.ah-shell,.ah-card,.ah-card::before,.ah-list-inner,.ah-empty,',
    '.ah-tab::after,.ah-seg,.ah-count::before,.ah-popover-inner,.ah-ring,.ah-strip-seg,.ah-heat-ring,.ah-done-glyph,.ah-awaiting-glyph,',
    '.ah-menu,.ah-dialog,.ah-toast{',
    'animation:none!important;transition:none!important;}',
    '.ah-card:hover{transform:none;box-shadow:none;}',
    '[data-row-key^="session:"] [class*="_title"]::before{animation:none!important}',
    '}',
  ].join('');

  var FILTERS = [
    { id: 'all', labelKey: 'filter.all', level: null },
    { id: 'hot', labelKey: 'level.hot', level: 5 },
    { id: 'warm', labelKey: 'level.warm', level: 4 },
    { id: 'active', labelKey: 'level.active', level: 3 },
    { id: 'recent', labelKey: 'level.recent', level: 2 },
    { id: 'stale', labelKey: 'level.stale', level: 1 },
  ];

  /* ---------------- 查看水位（已完成 · 未查看） ---------------- */

  /**
   * 宿主的 `SessionSummary` 只有 updatedAt / running / blank 等字段，**没有未读标记**，
   * 所以「agent 跑完但还没看」由插件自己记：
   *
   * - 第一次运行插件时记下 `bootAt`；
   * - 早于 `bootAt` 的历史会话视为已读（不会一装插件就满屏「已完成」）；
   * - `updatedAt` 晚于 `bootAt`、且晚于本地查看水位的会话 → 已完成未查看；
   * - 会话被打开（`retainedBy.mainView > 0`）或用户尚未打开过它时，水位推进到 `updatedAt`。
   *
   * 状态存 localStorage，刷新/重启后仍然有效；拿不到 storage（隐私模式、测试沙箱）
   * 时退回内存，功能不受影响，只是重启后丢失。
   */
  var SEEN_KEY = 'activity-heat.seen.v1';
  var seenState = null;

  /**
   * `running === true` 但多久没有新活动就视为"已经结束"。
   *
   * 宿主在部分场景下会把 `running` 留到会话被打开或空闲回收之前，单纯等
   * `running === false` 会让「已完成」永远不出现。60 s 内没有任何活动更新，
   * 基本可以认为这一轮已经结束；一旦有新活动，`updatedAt` 变新就会自动
   * 切回「工作中」。
   */
  var DONE_IDLE_MS = 60 * 1000;

  /**
   * 没有本地水位时（首次运行、或 Web 版端口变化导致 localStorage 换 origin），
   * 只把最近 30 分钟内结束的会话当作「刚完成」。超过这个窗口的会话默认算已读，
   * 避免一装插件就满屏「已完成」。
   */
  var DONE_RECENT_MS = 30 * 60 * 1000;

  /**
   * 宿主侧栏里"真正被选中"的会话集合。
   *
   * 不能用 `retainedBy.mainView > 0`：它是引用计数，主视图可能同时保留多个
   * 会话的引用（截图里「当前」标在非当前会话上就是这个原因）。宿主给选中行
   * 加的类是 CSS Module 的 `xxx_selected`，这里一次性把 `[data-row-key]` 读出来。
   *
   * @returns 选中 id 集合；无 DOM 或不支持查询时返回 null（调用方退回旧信号）。
   */
  function selectedSessionIds() {
    try {
      if (typeof document === 'undefined' || typeof document.querySelectorAll !== 'function') return null;
      var rows = document.querySelectorAll('[data-row-key^="session:"]');
      var out = {};
      for (var i = 0; i < rows.length; i += 1) {
        var row = rows[i];
        if (!/(^|\s)\S*_selected(\s|$)/.test(' ' + String(row.className || '') + ' ')) continue;
        var key = String(row.getAttribute('data-row-key') || '').slice('session:'.length);
        if (key) out[key] = true;
      }
      return out;
    } catch (ignored) {
      return null;
    }
  }

  /**
   * 单个会话是否"真正在侧栏被选中"（当前正在看的那一个）。
   * 没有 DOM（测试、降级）时退回 `retainedBy.mainView`，保持旧行为。
   */
  function isSelectedRow(sessionId, fallback) {
    try {
      if (typeof document === 'undefined' || typeof document.querySelector !== 'function') {
        return Boolean(fallback);
      }
      var row = document.querySelector('[data-row-key="session:' + cssString(sessionId) + '"]');
      if (!row) return false;
      return /(^|\s)\S*_selected(\s|$)/.test(' ' + String(row.className || '') + ' ');
    } catch (ignored) {
      return Boolean(fallback);
    }
  }

  function seenStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
    } catch (ignored) { /* 隐私模式访问即抛 */ }
    return null;
  }

  function loadSeenState() {
    if (seenState) return seenState;
    var state = { bootAt: Date.now(), seen: {} };
    var store = seenStorage();
    try {
      var raw = store ? store.getItem(SEEN_KEY) : null;
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (typeof parsed.bootAt === 'number' && isFinite(parsed.bootAt)) state.bootAt = parsed.bootAt;
          if (parsed.seen && typeof parsed.seen === 'object') state.seen = parsed.seen;
        }
      } else if (store) {
        store.setItem(SEEN_KEY, JSON.stringify(state));
      }
    } catch (ignored) { /* 坏数据直接重建 */ }
    seenState = state;
    return state;
  }

  function persistSeen() {
    var store = seenStorage();
    try {
      if (store && seenState) store.setItem(SEEN_KEY, JSON.stringify(seenState));
    } catch (ignored) { /* 配额满/禁用：内存态继续工作 */ }
  }

  /** 该会话最后一次被查看时的 updatedAt；从未记录返回 undefined。 */
  function seenAtOf(sessionId) {
    var state = loadSeenState();
    var value = state.seen[String(sessionId)];
    return typeof value === 'number' && isFinite(value) ? value : undefined;
  }

  /** 记录查看水位（只前进，不回退）。返回是否真的写入了新值。 */
  function markSeen(sessionId, at, deferPersist) {
    if (typeof at !== 'number' || !isFinite(at)) return false;
    var state = loadSeenState();
    var key = String(sessionId);
    var current = state.seen[key];
    if (typeof current === 'number' && current >= at) return false;
    state.seen[key] = at;
    if (deferPersist !== true) persistSeen();
    return true;
  }

  /**
   * 会话是否「已完成但没看过」。
   * @param running - 宿主 summary.running
   * @param open - 是否真的是当前选中的会话（见 selectedSessionIds）
   * @param now - 当前时间，用于判断"运行中但已静止"
   */
  function doneUnseenOf(sessionId, at, running, open, now) {
    if (open === true) return false;
    if (typeof at !== 'number' || !isFinite(at)) return false;
    // 运行中但 60s 没有任何新活动，视为这一轮已经结束
    if (running === true && (typeof now !== 'number' || now - at < DONE_IDLE_MS)) return false;
    var state = loadSeenState();
    var seen = state.seen[String(sessionId)];
    if (typeof seen === 'number') return at > seen;
    if (at > state.bootAt) return true;
    // 水位丢了（Web 版端口变化 = 换 origin）：最近 30 分钟内结束的仍算「刚完成」
    return typeof now === 'number' && now - at <= DONE_RECENT_MS;
  }

  /**
   * 批量推进水位：
   * - 历史会话（活动早于插件首次运行）标记为已读；
   * - 当前打开的会话，水位跟到最新活动。
   * 只写有变化的条目，避免每次渲染都碰 localStorage。
   */
  function syncSeenForSessions(sessions) {
    try {
      var state = loadSeenState();
      var dirty = false;
      for (var i = 0; i < sessions.length; i += 1) {
        var item = sessions[i];
        if (!item || typeof item.at !== 'number') continue;
        var seen = state.seen[String(item.id)];
        if (typeof seen === 'number') {
          if (item.open === true && item.at > seen && markSeen(item.id, item.at, true)) dirty = true;
          continue;
        }
        // 只把"早于首次运行且已过 recent 窗口"的会话记为已读；
        // 最近 30 分钟内结束的留给「已完成」提示，避免重启后全被吞掉。
        var age = Date.now() - item.at;
        if (item.at <= state.bootAt && age > DONE_RECENT_MS && markSeen(item.id, item.at, true)) dirty = true;
      }
      // 一次批量落盘，避免首次启动时为几十个历史会话各写一遍 localStorage
      if (dirty) persistSeen();
    } catch (ignored) { /* 水位失败不影响面板 */ }
  }

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

      // 「等待回答」：宿主 userQuestions 投影的 active 非空 = 有未回答的问题
      var userQuestions = values.userQuestions;
      if (userQuestions && Array.isArray(userQuestions.active) && userQuestions.active.length > 0) {
        out.awaiting = true;
      }

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
    // 一次查询拿到"真正被选中"的会话；没有 DOM 时退回 retainedBy（测试/降级）
    var selected = selectedSessionIds();
    var hasSelection = selected !== null;
    for (var i = 0; i < ids.length; i += 1) {
      var id = ids[i];
      if (archivedOf[String(id)]) continue;
      var summary = byId[id];
      if (!summary || summary.origin === 'subagent') continue;
      var at = lastActiveOf(summary);
      var facts = factsFromProjection(projections[id]);
      var open = hasSelection
        ? selected[String(id)] === true
        : Boolean(summary.retainedBy && summary.retainedBy.mainView > 0);
      var running = summary.running === true;
      // 宿主的 updatedAt 只在一轮开始/结束刷新，长任务运行中不会更新；
      // 因此"正在工作"不能只按时间算，否则会被 10 分钟前的空闲会话压下去。
      // 运行中的会话按最高热度计（level 5），真实时间仍留给右侧的"最后活动"。
      var age = at === undefined ? undefined : now - at;
      var level = running ? 5 : (age === undefined ? 0 : heatLevelOf(age));
      var ratio = running
        ? Math.max(0.92, age === undefined ? 0 : heatRatioOf(age))
        : (age === undefined ? 0 : heatRatioOf(age));
      sessions.push({
        id: id,
        title: titleOf(summary, id),
        blank: summary.blank === true,
        at: at,
        level: level,
        ratio: ratio,
        workspace: workspaceOf[String(id)] || null,
        cwd: typeof summary.cwd === 'string' ? summary.cwd : '',
        open: open,
        running: running,
        done: doneUnseenOf(id, at, running, open, now),
        awaiting: facts.awaiting === true,
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
    sessions.sort(function (x, y) {
      // 正在工作的会话优先；同为运行时再按最近活动时间
      if (x.running !== y.running) return x.running ? -1 : 1;
      return compareByRecency(x, y);
    });

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

    // 有会话在跑的工作区同样提到最前，并让热度计与成员的最高热度一致
    for (var gr = 0; gr < groupList.length; gr += 1) {
      if (groupList[gr].running) {
        groupList[gr].level = 5;
        groupList[gr].ratio = Math.max(groupList[gr].ratio, 0.92);
      }
    }
    groupList.sort(function (x, y) {
      if (x.running !== y.running) return x.running ? -1 : 1;
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

    // 幂等推进查看水位：历史会话记为已读、当前打开的会话跟到最新活动。
    // 放在这里是为了让"只开面板、侧栏行没渲染"的场景也能正常清零「已完成」。
    syncSeenForSessions(withTime);

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

  /* ---------------- 标题下划线（热度） ---------------- */

  /**
   * 热度改用「会话标题文字前一个小圆点」表达，不再占用行首 16px 格。
   *
   * 为什么彻底离开行首格：这一格除了宿主的原生状态点（非 idle 行由宿主绘制），
   * 还会被「定时任务」插件用来画时钟标记（它同样占用 `sidebar.session.row.leading`）。
   * 插件在这里再放任何可见元素，都会和状态点或时钟并排拥挤。
   *
   * 做法：行首 slot 仍然注册，但组件只借这个 seat 读到本行 sessionId 与热度，
   * 把规则写进一个 `<style id="activity-heat-title-dot">`，然后 `return null`——
   * 行首不渲染任何可见节点；圆点画在标题元素的 `::before` 上，不新增 DOM、不占布局。
   */
  var titleFlowLevels = {};
  var titleFlowStyle = null;

  /** CSS 属性值里的引号/反斜杠转义（data-row-key 用双引号包裹）。 */
  function cssString(value) {
    return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  var ACTIVE_MIN_LEVEL = 3; // ≥「活跃」档（近 6 小时内）才加闪动

  /**
   * 单个会话的热度标记规则：在**标题文字前面**画一个小圆点。
   *
   * 位置：用标题元素自身的 `::before`，所以圆点紧贴标题文字，属于标题盒内，
   * **不占用行首 16px 格**，也就不会和原生状态点、定时任务时钟挤在一起。
   * 热度表达：
   * - 颜色深浅：透明度 35%→100%，越热越深、越接近纯蓝；
   * - 实心/空心：level ≥ 4（温热/炽热）实心，低档空心描边；
   * - 动效只给活跃会话（level ≥ 3）：圆点做轻微的呼吸脉冲。
   */
  function titleFlowRule(id, level) {
    var solid = level >= 4;
    // 圆点也走同一套热度色阶：冷会话是灰点，越热越蓝
    var ink = heatToneOf(level);
    var halo = 'color-mix(in srgb, ' + ink + ' 55%, transparent)';
    var rowKey = '[data-row-key="session:' + cssString(id) + '"]';
    var selector = rowKey + ' [class*="_title"]::before';
    var css = selector + '{'
      + 'content:"";'
      + 'display:inline-block;'
      + 'box-sizing:border-box;'
      + 'width:7px;'
      + 'height:7px;'
      + 'border-radius:50%;'
      + 'margin-right:6px;'
      + 'vertical-align:middle;'
      // 视觉微调：vertical-align:middle 对中文字形会偏低约 2px，
      // 用 position:relative 上移对齐字形中轴（不用 transform，避免与脉冲动画冲突）
      + 'position:relative;'
      + 'top:-2px;'
      // 实心点在高光方向上再叠一层径向渐变，让它是"有厚度的玻璃珠"而不是纯色块
      + (solid
        ? 'background:' + ink + ';'
          + 'background-image:radial-gradient(circle at 34% 30%, color-mix(in srgb, #fff 36%, transparent), transparent 62%);'
          + 'border:none;'
          + 'box-shadow:0 0 6px ' + ink + ';'
        : 'background:transparent;border:1.5px solid ' + ink + ';'
          + 'box-shadow:inset 0 0 4px ' + halo + ';')
      + '}';
    if (level >= ACTIVE_MIN_LEVEL) {
      var duration = (2.6 - level * 0.16).toFixed(2);
      css += selector + '{animation:ah-dot-pulse ' + duration + 's ease-in-out infinite;}';
    }
    // 行悬浮：圆点外扩一圈柔光。用 box-shadow 而不是 transform，
    // 因为活跃会话的脉冲动画已经占用了 transform，改它会打架。
    css += rowKey + ':hover [class*="_title"]::before{'
      + 'box-shadow:0 0 0 3px ' + halo + ', 0 0 8px ' + ink + ';'
      + 'filter:brightness(1.12);'
      + '}';
    return css;
  }

  /** 把所有已登记会话的热度规则拼成一个 style 标签（增量更新）。 */
  function syncTitleFlowStyles() {
    try {
      if (typeof document === 'undefined' || !document.head) return;
      var css = '';
      for (var id in titleFlowLevels) {
        if (!Object.prototype.hasOwnProperty.call(titleFlowLevels, id)) continue;
        var level = titleFlowLevels[id];
        if (level > 0) css += titleFlowRule(id, level);
      }
      if (css === '') {
        if (titleFlowStyle && titleFlowStyle.parentNode) titleFlowStyle.parentNode.removeChild(titleFlowStyle);
        titleFlowStyle = null;
        return;
      }
      if (!titleFlowStyle) titleFlowStyle = document.getElementById('activity-heat-title-dot');
      if (!titleFlowStyle) {
        titleFlowStyle = document.createElement('style');
        titleFlowStyle.id = 'activity-heat-title-dot';
        document.head.appendChild(titleFlowStyle);
      }
      titleFlowStyle.textContent = css;
    } catch (ignored) {
      /* 样式注入失败不影响功能 */
    }
  }

  /** 登记/清除某个会话的热度级别，并刷新下划线样式。 */
  function setTitleFlowLevel(sessionId, level) {
    var key = String(sessionId);
    if (level > 0) titleFlowLevels[key] = level;
    else delete titleFlowLevels[key];
    syncTitleFlowStyles();
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
    // 色深：颜色本身已按档位从灰过渡到蓝，透明度只做轻微衰减
    var tone = heatToneOf(level);
    var fillOpacity = 0.62 + ratio * 0.38;
    var ticks = [];
    // 5 个刻度分隔线，帮助读出"填充到第几格"
    for (var t = 1; t <= 4; t += 1) {
      ticks.push(React.createElement('span', {
        key: 'tick' + t,
        className: AH.meterTick,
        style: { left: (t * 20) + '%' },
      }));
    }
    var track = React.createElement(
      'span',
      {
        className: AH.meterTrack,
        style: {
          width: width,
          height: height,
        },
      },
      React.createElement('span', {
        className: AH.meterFill,
        style: {
          width: Math.round(ratio * 100) + '%',
          opacity: fillOpacity,
          backgroundColor: tone,
          boxShadow: level >= 4 ? '0 0 6px ' + tone : 'none',
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

  /**
   * 悬停卡热度条：把热度画成一根竖向温度条（约 2.5px 宽，高度 8→18px）。
   *
   * 只用于会话悬停卡内部（`sidebar.session.row.hover`），作为档位的可视化补充；
   * 侧栏行首已改为「标题下划线流动光线」（见 titleFlowRule），不再在行首格画任何标记，
   * 以免与原生状态点、定时任务时钟抢占同一个 16px 格。
   * @param props.level - 0..5 档位（<=0 不渲染）
   * @param props.title - 原生 tooltip 文本
   * @param props.width - 容器宽，默认 16
   * @param props.height - 容器高，默认 20
   * @param props.align - 'start'（默认）| 'center'
   */
  function RowHeatBar(props) {
    var level = Math.max(0, Math.min(5, (props && props.level) || 0));
    if (level <= 0) return null;
    var width = props && typeof props.width === 'number' ? props.width : 16;
    var height = props && typeof props.height === 'number' ? props.height : 20;
    var align = props && props.align === 'center' ? 'center' : 'flex-start';
    var barWidth = 2.5;
    var barHeight = Math.min(height - 2, Math.round(6 + level * 2.4));
    return React.createElement(
      'span',
      {
        title: props && props.title,
        'aria-hidden': 'true',
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: align,
          width: width,
          height: height,
          boxSizing: 'border-box',
          flex: 'none',
        },
      },
      React.createElement('span', {
        style: {
          width: barWidth,
          height: barHeight,
          borderRadius: 999,
          // 竖直温度条：整条保持档位色，只在顶部提亮
          backgroundImage: heatBarSurface(heatToneOf(level)),
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.55), inset 0 0 0 0.5px rgba(255,255,255,.18)'
            + (level >= 4 ? ', 0 0 6px ' + heatToneOf(level) : ''),
          flex: 'none',
          transition: 'height 200ms ease, opacity 200ms ease',
        },
      }),
    );
  }

  function HeatRing(props) {
    var size = props && typeof props.size === 'number' && props.size > 0 ? props.size : 18;
    var level = Math.max(1, Math.min(5, (props && props.level) || 1));
    var active = props && props.active === true;
    return React.createElement(
      'span',
      {
        className: AH.heatRing,
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
        className: AH.heatRingArc,
        style: {
          position: 'absolute',
          width: Math.round(size * 0.92),
          height: Math.round(size * 0.92),
          borderRadius: '50%',
          // 环本身用 conic-gradient 画（见 AH_CSS），这里只保留尺寸与轻重
          opacity: active ? 0.95 : 0.62,
          boxSizing: 'border-box',
        },
      }),
      React.createElement('span', {
        className: AH.heatRingCore,
        style: {
          display: 'block',
          width: Math.max(4, Math.round(size * (0.26 + level * 0.06))),
          height: Math.max(4, Math.round(size * (0.26 + level * 0.06))),
          borderRadius: '50%',
          opacity: active ? 1 : 0.9,
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
        className: AH.miniTrack,
        style: {
          width: width,
          height: 4,
          marginLeft: 2,
        },
      },
      React.createElement('span', {
        className: AH.miniFill,
        style: {
          width: Math.round(ratio * 100) + '%',
          // 用 backgroundColor 而不是 background，避免简写把 CSS 里的高光渐变重置掉
          backgroundColor: props.color || HEAT_INK,
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
    }, segments.map(function (row, index) {
      return React.createElement('span', {
        key: row.key,
        className: AH.stripSeg,
        style: {
          flexGrow: row.ms,
          flexBasis: 0,
          backgroundColor: row.color,
          animationDelay: (index * 40) + 'ms',
        },
      });
    }));

    return React.createElement('div', {
      className: AH.popover,
      'data-closing': props.closing ? 'true' : 'false',
      style: {
        position: 'fixed',
        left: left,
        top: top,
        transform: above ? 'translateY(-100%)' : 'none',
        width: 300,
        zIndex: 2000,
        padding: '12px 14px',
        color: UI.textPrimary,
        pointerEvents: 'none',
        // 入场方向跟着浮层翻上去/翻下去走
        '--ah-pop-y': above ? '-4px' : '4px',
      },
    },
      // 外层负责定位 transform，入场动画放在内层，避免 translateY(-100%) 被覆盖
      React.createElement('div', { className: AH.popoverInner },
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
          className: AH.ring,
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
      ),
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
  /** 浮层退场时长（与 AH_CSS 里的 ah-pop-out 保持一致）。 */
  var HOVER_EXIT_MS = 130;

  function HoverCard(props) {
    var state = React.useState(null);
    var anchor = state[0];
    var setAnchor = state[1];
    var closingState = React.useState(false);
    var closing = closingState[0];
    var setClosing = closingState[1];
    var ref = React.useRef ? React.useRef(null) : { current: null };
    var timerRef = React.useRef ? React.useRef(null) : { current: null };

    var clearTimer = function () {
      if (!timerRef.current) return;
      try { clearTimeout(timerRef.current); } catch (ignored) { /* ignore */ }
      timerRef.current = null;
    };

    // 卸载时清掉待执行的关闭定时器，避免对已卸载的组件 setState
    React.useEffect(function () {
      return function () { clearTimer(); };
    }, []);

    var show = function () {
      clearTimer();
      setClosing(false);
      var el = ref.current;
      if (!el || typeof el.getBoundingClientRect !== 'function') return;
      var box = el.getBoundingClientRect();
      setAnchor({ left: box.left, top: box.top, bottom: box.bottom });
    };
    // 先让浮层播放 130ms 退场动画，再真正卸载；期间再悬浮会取消关闭
    var hide = function () {
      clearTimer();
      setClosing(true);
      timerRef.current = setTimeout(function () {
        timerRef.current = null;
        setAnchor(null);
        setClosing(false);
      }, HOVER_EXIT_MS);
    };

    var card = anchor && props.render ? props.render(anchor, closing) : null;
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
      className: AH.popover,
      'data-closing': props.closing ? 'true' : 'false',
      style: {
        position: 'fixed',
        left: pos.left,
        top: pos.top,
        transform: pos.transform,
        width: 260,
        zIndex: 2000,
        padding: '12px 14px',
        color: UI.textPrimary,
        pointerEvents: 'none',
        '--ah-pop-y': pos.transform !== 'none' ? '-4px' : '4px',
      },
    },
      React.createElement('div', { className: AH.popoverInner },
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
          background: 'linear-gradient(90deg, transparent, var(--dsw-alias-border-l1, rgba(127,127,127,0.22)) 22%, var(--dsw-alias-border-l1, rgba(127,127,127,0.22)) 78%, transparent)',
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
      ),
    );
  }

  /** 累计对话时长胶囊：悬浮时展开耗时分布卡。 */
  function DurationChip(props) {
    return React.createElement(HoverCard, {
      render: function (anchor, closing) {
        return React.createElement(TimingCard, { timing: props.timing, anchor: anchor, closing: closing });
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
      render: function (anchor, closing) {
        return React.createElement(TokensCard, { parts: parts, anchor: anchor, closing: closing });
      },
    },
      React.createElement(MetricIcon, { name: 'tokens' }),
      tt('fact.tokens', { n: compactNumber(parts.total) }),
    );
  }

  /** 「当前」徽章：挂在会话标题前，不占底部信息行。 */
  function CurrentBadge() {
    return React.createElement('span', {
      className: AH.badge,
      style: {
        flex: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        padding: '0 6px',
        borderRadius: 5,
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
        className: AH.chip,
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
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
  /** 工作中 / 已完成两个状态图标的统一尺寸，避免两边大小再次漂移。 */
  function statusIconSize(compact) {
    return compact ? 22 : 28;
  }

  function WorkingTag(props) {
    var stacked = props && props.stacked === true;
    var compact = props && props.compact === true;
    var size = statusIconSize(compact);
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
          textShadow: '0 0 10px color-mix(in srgb, var(--color-blue-500, #3b82f6) 42%, transparent)',
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

  /**
   * 「已完成」标识：agent 已经跑完、但用户还没看过结果的会话。
   *
   * 颜色刻意用宿主的 success 绿色，与蓝色的热度 / 运行中区分开；
   * 只做一个 3.2s 的轻微呼吸，`prefers-reduced-motion` 下静止。
   * 用 aria-label 而不是 title，避免原生 tooltip 盖住悬停卡。
   */
  /** 已完成状态的鲸尾：与「工作中」的鲸鱼同源，取官方姿态的静止版。 */
  var DONE_TAIL_PATH = 'M 97 60 L 102 61 L 107 63 L 110 66 L 114 69 L 118 71 L 122 73 L 127 75 L 132 76 L 136 78 L 142 79 L 147 80 L 152 82 L 157 83 L 161 85 L 165 88 L 169 90 L 173 93 L 177 95 L 180 98 L 183 102 L 186 105 L 189 108 L 191 113 L 193 117 L 197 118 L 202 117 L 208 117 L 215 117 L 221 117 L 226 118 L 232 119 L 236 121 L 241 123 L 246 124 L 250 126 L 255 128 L 259 130 L 265 131 L 270 132 L 275 133 L 282 133 L 287 132 L 291 134 L 295 137 L 297 141 L 297 148 L 295 152 L 292 155 L 289 159 L 287 163 L 283 166 L 281 170 L 278 173 L 274 176 L 270 178 L 267 181 L 263 184 L 258 185 L 253 187 L 249 189 L 244 190 L 238 191 L 233 192 L 226 192 L 221 193 L 215 193 L 208 193 L 202 193 L 197 194 L 193 197 L 192 202 L 192 207 L 192 213 L 193 218 L 194 224 L 195 229 L 196 234 L 196 241 L 197 246 L 198 252 L 198 258 L 198 264 L 197 270 L 191 270 L 184 270 L 181 267 L 182 262 L 181 256 L 181 250 L 180 245 L 180 238 L 179 233 L 178 227 L 177 222 L 176 217 L 175 211 L 175 205 L 176 199 L 177 194 L 179 190 L 182 186 L 185 183 L 188 180 L 193 178 L 198 177 L 205 177 L 211 177 L 216 176 L 223 176 L 229 176 L 234 175 L 240 174 L 245 173 L 250 171 L 254 169 L 258 167 L 262 164 L 266 162 L 269 158 L 272 155 L 275 152 L 273 149 L 267 149 L 263 147 L 257 146 L 253 144 L 248 142 L 243 141 L 239 139 L 234 137 L 230 135 L 224 134 L 219 133 L 213 133 L 206 133 L 201 134 L 196 135 L 190 136 L 185 135 L 181 132 L 179 128 L 178 123 L 175 119 L 173 115 L 170 111 L 167 108 L 164 105 L 159 103 L 155 101 L 151 99 L 146 97 L 142 95 L 136 94 L 131 93 L 126 92 L 121 90 L 117 88 L 113 86 L 108 84 L 104 82 L 101 82 L 100 87 L 100 93 L 101 99 L 103 103 L 105 108 L 107 112 L 110 115 L 113 119 L 116 122 L 118 126 L 122 129 L 125 132 L 129 135 L 132 138 L 136 140 L 140 143 L 143 146 L 147 149 L 150 152 L 153 155 L 156 159 L 158 163 L 160 167 L 162 172 L 162 178 L 160 183 L 159 188 L 157 192 L 155 197 L 153 201 L 151 206 L 149 210 L 147 214 L 145 219 L 144 224 L 142 228 L 141 234 L 140 239 L 138 244 L 137 249 L 137 255 L 136 261 L 135 266 L 134 271 L 128 270 L 122 270 L 119 266 L 120 261 L 120 255 L 121 249 L 122 244 L 123 238 L 124 233 L 125 228 L 127 223 L 128 218 L 130 214 L 132 209 L 134 205 L 136 200 L 138 196 L 140 192 L 142 187 L 144 183 L 145 177 L 144 172 L 142 168 L 139 164 L 136 161 L 133 158 L 129 155 L 125 153 L 121 150 L 118 147 L 115 144 L 111 141 L 108 138 L 105 135 L 102 131 L 99 128 L 96 124 L 94 120 L 91 117 L 89 112 L 87 108 L 86 102 L 84 98 L 84 92 L 84 85 L 85 80 L 86 75 L 88 70 L 90 66 L 93 62 Z';

  /**
   * 静态状态尾标：同一只鲸尾，variant 决定颜色与文案。
   * - done：绿色「已完成」
   * - awaiting：琥珀色「等待回答」
   * 尺寸与「工作中」共用 statusIconSize()，不再各写一套。
   */
  function StatusTailTag(props) {
    var stacked = props && props.stacked === true;
    var compact = props && props.compact === true;
    var isDone = (props && props.variant) !== 'awaiting';
    var size = statusIconSize(compact);
    return React.createElement(
      'span',
      {
        className: isDone ? AH.doneTag : AH.awaitingTag,
        role: 'img',
        'aria-label': tt(isDone ? 'status.doneTitle' : 'status.awaitingTitle'),
        style: {
          display: 'inline-flex',
          flexDirection: stacked ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: stacked ? 3 : 5,
          fontSize: stacked ? '0.78em' : '0.8em',
          fontWeight: 700,
          lineHeight: '16px',
          whiteSpace: 'nowrap',
          flex: 'none',
        },
      },
      React.createElement(
        'svg',
        {
          className: isDone ? AH.doneGlyph : AH.awaitingGlyph,
          width: size,
          height: size,
          viewBox: '84 60 213 211',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 2,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': 'true',
          style: { display: 'block', flex: 'none' },
        },
        React.createElement('path', { d: DONE_TAIL_PATH, fill: 'currentColor', stroke: 'none' }),
      ),
      tt(isDone ? 'status.done' : 'status.awaiting'),
    );
  }

  function DoneTag(props) {
    return React.createElement(StatusTailTag, {
      variant: 'done',
      stacked: props && props.stacked === true,
      compact: props && props.compact === true,
    });
  }

  function AwaitingTag(props) {
    return React.createElement(StatusTailTag, {
      variant: 'awaiting',
      stacked: props && props.stacked === true,
      compact: props && props.compact === true,
    });
  }

  function FilterBar(props) {
    var active = props && props.active;
    var counts = (props && props.counts) || {};
    var onPick = props && props.onPick;
    return React.createElement(
      'div',
      {
        className: AH.filterBar,
        style: {
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 16,
          padding: '2px ' + UI.padX + 'px 8px',
        },
      },
      FILTERS.map(function (filter) {
        var picked = active === filter.id;
        var count = counts[filter.id] || 0;
        return React.createElement(
          'button',
          {
            key: filter.id,
            type: 'button',
            onClick: function () { if (onPick) onPick(filter.id); },
            className: AH.tab,
            'data-active': picked ? 'true' : 'false',
            style: {
              display: 'inline-flex',
              alignItems: 'baseline',
              gap: 4,
              padding: '2px 0',
              marginBottom: -1,
              borderRadius: 0,
              fontSize: '0.8em',
              lineHeight: '18px',
              cursor: 'pointer',
              font: 'inherit',
              // 注意：放在 font 之后，否则会被 font 简写重置成 inherit
              fontWeight: picked ? 600 : 400,
              opacity: count === 0 && !picked ? 0.45 : 1,
            },
          },
          tt(filter.labelKey),
          React.createElement('span', { style: { fontSize: '0.78em', opacity: 0.6 } }, String(count)),
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
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)',
          animation: 'ah-breathe 2.4s ease-in-out infinite',
          isolation: 'isolate',
        },
      },
      // 跑马灯光带：尺寸取 200%，绕中心旋转，只有边缘 2px 会露出来。
      // 蓝→青→紫的渐变让光带在旋转时有色温变化，边缘轻微模糊，避免硬边。
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
            ' transparent 0deg, transparent 238deg,' +
            ' color-mix(in srgb, var(--color-cyan-400, #22d3ee) 48%, transparent) 282deg,' +
            ' color-mix(in srgb, var(--color-blue-500, #3b82f6) 86%, transparent) 312deg,' +
            ' color-mix(in srgb, var(--color-violet-500, #8b5cf6) 24%, transparent) 340deg,' +
            ' transparent 360deg)',
          filter: 'blur(2px)',
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

  /* ---------------- 右键菜单：纯函数与动作 ---------------- */

  var MENU_WIDTH = 232;
  var MENU_MAX_HEIGHT = 420;
  /** 最近一次打开菜单的触发卡片：关闭/执行后把焦点还回去。 */
  var lastMenuTrigger = null;

  /**
   * 菜单的视口定位：右下越界时翻转或夹紧。
   * 右键坐标可能正好在屏幕边缘，键盘触发则用卡片的矩形。
   */
  function menuPosition(x, y, width, height) {
    var viewportWidth = 1280;
    var viewportHeight = 800;
    try {
      if (typeof window !== 'undefined') {
        if (window.innerWidth) viewportWidth = window.innerWidth;
        if (window.innerHeight) viewportHeight = window.innerHeight;
      }
    } catch (ignored) { /* 测试沙箱没有视口，用默认值 */ }
    var left = typeof x === 'number' && isFinite(x) ? x : 12;
    var top = typeof y === 'number' && isFinite(y) ? y : 12;
    if (left + width > viewportWidth - 8) left = viewportWidth - width - 8;
    if (left < 8) left = 8;
    if (top + height > viewportHeight - 8) top = top - height;
    if (top < 8) top = 8;
    return { left: left, top: top };
  }

  function menuHeightOf(items) {
    var height = 12;
    for (var i = 0; i < items.length; i += 1) {
      if (items[i].separatorBefore) height += 9;
      // 提示文字在右侧同一行，不额外增高
      height += 30;
    }
    return Math.min(height, MENU_MAX_HEIGHT);
  }

  /** 菜单/对话框挂到 body：列表是 overflow 容器，原地渲染会被裁掉。 */
  function portalLayer(node) {
    try {
      if (ReactDOM && typeof ReactDOM.createPortal === 'function'
        && typeof document !== 'undefined' && document.body) {
        return ReactDOM.createPortal(node, document.body);
      }
    } catch (ignored) { /* 没有 react-dom 时退回原位渲染 */ }
    return node;
  }

  function firstEnabledIndex(items) {
    for (var i = 0; i < items.length; i += 1) {
      if (!items[i].disabled) return i;
    }
    return 0;
  }

  function stepEnabledIndex(items, from, delta) {
    if (!items || items.length === 0) return 0;
    var index = from;
    for (var step = 0; step < items.length; step += 1) {
      index = (index + delta + items.length) % items.length;
      if (!items[index].disabled) return index;
    }
    return from;
  }

  /**
   * 复制文本：优先 async clipboard，失败退回旧式 execCommand。
   * 返回 Promise<boolean>，调用方据此给成功/失败提示。
   */
  function copyText(text) {
    var value = String(text === undefined || text === null ? '' : text);
    if (value === '') return Promise.resolve(false);
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard
        && typeof navigator.clipboard.writeText === 'function') {
        return navigator.clipboard.writeText(value).then(function () {
          return true;
        }, function () {
          return fallbackCopyText(value);
        });
      }
    } catch (ignored) { /* 退回 execCommand */ }
    return Promise.resolve(fallbackCopyText(value));
  }

  function fallbackCopyText(value) {
    try {
      if (typeof document === 'undefined' || !document.body) return false;
      var area = document.createElement('textarea');
      area.value = value;
      area.setAttribute('readonly', 'readonly');
      area.style.position = 'fixed';
      area.style.left = '-9999px';
      document.body.appendChild(area);
      if (area.select) area.select();
      var ok = typeof document.execCommand === 'function' ? document.execCommand('copy') : false;
      document.body.removeChild(area);
      return Boolean(ok);
    } catch (ignored) {
      return false;
    }
  }

  /** 与宿主 Session Header 的「下载 Session 日志」同一条文档相对路由。 */
  function exportLogUrlOf(sessionId) {
    return 'api/session.export?sessionId=' + encodeURIComponent(String(sessionId)) + '&includeDescendants=true';
  }

  /**
   * 按需探测导出路由：宿主没挂载 session-log-export 时 HEAD 会 404，
   * 此时不发起下载，只提示不可用（避免浏览器落到一个 404 标签页）。
   */
  function downloadSessionLog(sessionId) {
    var url = exportLogUrlOf(sessionId);
    var check;
    try {
      check = typeof fetch === 'function'
        ? fetch(url, { method: 'HEAD' }).then(function (response) {
            return Boolean(response && response.ok);
          }, function () {
            return false;
          })
        : Promise.resolve(false);
    } catch (ignored) {
      check = Promise.resolve(false);
    }
    return check.then(function (available) {
      if (!available) return false;
      try {
        if (typeof document === 'undefined') return false;
        var link = document.createElement('a');
        link.href = url;
        link.rel = 'noopener';
        link.download = '';
        if (document.body && document.body.appendChild) {
          document.body.appendChild(link);
          if (link.click) link.click();
          document.body.removeChild(link);
        } else if (link.click) {
          link.click();
        }
        return true;
      } catch (ignored) {
        return false;
      }
    });
  }

  /** 宿主公开方法的逐项能力检测：升级后缺哪个就只禁用哪个菜单项。 */
  function capabilitiesOf(uiWorkspace, sessions) {
    var service = uiWorkspace && typeof uiWorkspace === 'object' ? uiWorkspace : {};
    return {
      open: typeof service.openSession === 'function',
      openWorkspace: typeof service.openWorkspace === 'function',
      startSession: typeof service.startSession === 'function',
      fork: typeof service.forkSession === 'function',
      pin: typeof service.pinSession === 'function',
      unpin: typeof service.unpinSession === 'function',
      archive: typeof service.archiveSession === 'function',
      unarchive: typeof service.unarchiveSession === 'function',
      rename: Boolean(sessions && typeof sessions.using === 'function'),
    };
  }

  /** 完整提示词只在动作发生时读取，避免把全文塞进每 60 秒重建的模型。 */
  function promptRawOf(sessionState, sessionId) {
    try {
      var projections = sessionState && sessionState.projectionsBySession
        ? sessionState.projectionsBySession[sessionId]
        : undefined;
      var values = projections && projections.values;
      var timeline = values && values.contextTimeline;
      if (!timeline || typeof timeline !== 'object') return '';
      if (typeof timeline.lastUser === 'string' && timeline.lastUser.trim() !== '') return timeline.lastUser;
      if (typeof timeline.initialPrompt === 'string' && timeline.initialPrompt.trim() !== '') return timeline.initialPrompt;
    } catch (ignored) { /* 投影结构未知时静默 */ }
    return '';
  }

  /* ---------------- 在其他应用中打开 ---------------- */

  /**
   * 宿主 open-in-app 目录的分组：文件管理器 / 编辑器 / 终端 / 其他。
   * 只影响菜单排序，不影响可用性——具体有哪些应用由 GET open-in-app/apps 回答。
   */
  var OPEN_WITH_FILE_MANAGERS = { explorer: true, finder: true, filemanager: true };
  var OPEN_WITH_EDITORS = {
    vscode: true, vscodeinsiders: true, cursor: true, windsurf: true, zed: true,
    sublimetext: true, xcode: true, androidstudio: true,
    intellijidea: true, pycharm: true, webstorm: true, phpstorm: true,
    goland: true, rider: true, rustrover: true,
  };
  var OPEN_WITH_TERMINALS = {
    // 只收终端模拟器；gitbash 是 shell，不算「终端」，由 buildOpenWithItems 过滤掉
    terminal: true, windowsterminal: true, iterm: true,
    warp: true, ghostty: true, kitty: true, gnometerminal: true, konsole: true,
  };

  function openWithGroupRank(id) {
    if (OPEN_WITH_FILE_MANAGERS[id]) return 0;
    if (OPEN_WITH_EDITORS[id]) return 1;
    if (OPEN_WITH_TERMINALS[id]) return 2;
    return 3;
  }

  /** 应用名走插件自己的 app.<id> 字典；未知 id 原样显示（宿主目录可能比插件新）。 */
  function appLabelOf(id) {
    var key = 'app.' + id;
    var text = tt(key);
    return text === key ? String(id) : text;
  }

  /** open-in-app 只接受存在的绝对目录；相对路径直接禁用菜单项。 */
  function isAbsolutePath(value) {
    if (typeof value !== 'string' || value === '') return false;
    if (/^[a-zA-Z]:[\\/]/.test(value)) return true;
    if (value.charAt(0) === '/') return true;
    if (/^\\\\[^\\]+\\/.test(value)) return true;
    return false;
  }

  /* ---------------- 右键菜单：组件 ---------------- */

  function ContextMenu(props) {
    var items = props && Array.isArray(props.items) ? props.items : [];
    var open = Boolean(props && props.open);
    var activeState = React.useState(firstEnabledIndex(items));
    var active = activeState[0];
    var setActive = activeState[1];
    var surfaceRef = React.useRef ? React.useRef(null) : { current: null };

    // 外部点击 / 滚动 / 缩放都要关闭；portal 到 body 后这些事件不会冒泡进列表。
    React.useEffect(function () {
      if (!open) return undefined;
      var onPointer = function (event) {
        var surface = surfaceRef.current;
        if (surface && surface.contains && event && event.target && surface.contains(event.target)) return;
        if (props.onClose) props.onClose();
      };
      // 菜单自己滚（应用多时）不能把自己关掉；只有外层列表/页面滚动才关闭
      var onScroll = function (event) {
        var surface = surfaceRef.current;
        if (surface && event && event.target && surface.contains && surface.contains(event.target)) return;
        if (props.onClose) props.onClose();
      };
      var onResize = function () { if (props.onClose) props.onClose(); };
      var cleanups = [];
      try {
        if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
          document.addEventListener('pointerdown', onPointer, true);
          cleanups.push(function () { document.removeEventListener('pointerdown', onPointer, true); });
        }
        if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
          window.addEventListener('scroll', onScroll, true);
          window.addEventListener('resize', onResize);
          cleanups.push(function () { window.removeEventListener('scroll', onScroll, true); });
          cleanups.push(function () { window.removeEventListener('resize', onResize); });
        }
      } catch (ignored) { /* 沙箱没有事件系统 */ }
      return function () {
        for (var i = 0; i < cleanups.length; i += 1) cleanups[i]();
      };
    }, [open]);

    React.useEffect(function () {
      if (!open) return;
      // 每次打开都从第一个可用项开始，避免沿用上一次的高亮位置
      setActive(firstEnabledIndex(items));
      var surface = surfaceRef.current;
      if (surface && typeof surface.focus === 'function') {
        try { surface.focus(); } catch (ignored) { /* ignore */ }
      }
    }, [open]);

    if (!open || items.length === 0) return null;

    var pos = menuPosition(props.x, props.y, MENU_WIDTH, menuHeightOf(items));

    function onKeyDown(event) {
      if (!event) return;
      var key = event.key;
      if (key === 'Escape') {
        event.preventDefault();
        if (props.onClose) props.onClose();
        return;
      }
      if (key === 'ArrowDown') {
        event.preventDefault();
        setActive(stepEnabledIndex(items, active, 1));
        return;
      }
      if (key === 'ArrowUp') {
        event.preventDefault();
        setActive(stepEnabledIndex(items, active, -1));
        return;
      }
      if (key === 'Home') {
        event.preventDefault();
        setActive(firstEnabledIndex(items));
        return;
      }
      if (key === 'End') {
        event.preventDefault();
        var last = items.length - 1;
        for (var i = items.length - 1; i >= 0; i -= 1) {
          if (!items[i].disabled) { last = i; break; }
        }
        setActive(last);
        return;
      }
      if (key === 'Enter' || key === ' ') {
        event.preventDefault();
        var item = items[active];
        if (item && !item.disabled && item.onSelect) item.onSelect();
        return;
      }
      if (key === 'Tab' && props.onClose) props.onClose();
    }

    var nodes = [];
    for (var index = 0; index < items.length; index += 1) {
      var item = items[index];
      if (item.separatorBefore) {
        nodes.push(React.createElement('div', {
          key: 'sep-' + item.id,
          role: 'separator',
          className: AH.menuSep,
        }));
      }
      nodes.push(React.createElement('button', {
        key: item.id,
        id: index === active ? 'ah-menu-active' : undefined,
        type: 'button',
        role: 'menuitem',
        tabIndex: -1,
        'aria-disabled': item.disabled ? 'true' : undefined,
        'data-danger': item.danger ? 'true' : undefined,
        'data-active': index === active ? 'true' : 'false',
        className: AH.menuItem,
        onClick: function (selected) {
          return function () {
            if (selected.disabled) return;
            if (selected.onSelect) selected.onSelect();
          };
        }(item),
        onMouseEnter: function (hovered) {
          return function () { setActive(hovered); };
        }(index),
      }, [
        React.createElement('span', { key: 'label', className: AH.menuLabel }, item.label),
        item.hint
          ? React.createElement('span', { key: 'hint', className: AH.menuHint }, item.hint)
          : null,
      ]));
    }

    var surface = React.createElement('div', {
      ref: surfaceRef,
      role: 'menu',
      tabIndex: -1,
      'aria-activedescendant': 'ah-menu-active',
      'aria-label': props.label,
      className: AH.menu,
      style: {
        position: 'fixed',
        left: pos.left,
        top: pos.top,
        width: MENU_WIDTH,
        maxHeight: 'min(60vh, ' + MENU_MAX_HEIGHT + 'px)',
        overflowY: 'auto',
        zIndex: 2100,
        outline: 'none',
      },
      onKeyDown: onKeyDown,
      onContextMenu: function (event) { event.preventDefault(); },
    }, nodes);

    return portalLayer(surface);
  }

  function ConfirmArchive(props) {
    if (!props || !props.open) return null;
    var pending = props.pending === true;
    var session = props.session || {};
    var title = session.title || session.id || '';
    return portalLayer(React.createElement('div', {
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': tt('dialog.archiveTitle'),
      className: AH.dialog,
    }, [
      React.createElement('div', { key: 'title', className: AH.dialogTitle }, tt('dialog.archiveTitle')),
      React.createElement('div', { key: 'body', className: AH.dialogText }, tt('dialog.archiveBody', { title: title })),
      props.error ? React.createElement('div', { key: 'error', className: AH.dialogError }, props.error) : null,
      React.createElement('div', { key: 'actions', className: AH.dialogActions }, [
        React.createElement('button', {
          key: 'cancel',
          type: 'button',
          className: AH.dialogButton,
          disabled: pending,
          onClick: props.onCancel,
        }, tt('dialog.cancel')),
        React.createElement('button', {
          key: 'confirm',
          type: 'button',
          className: AH.dialogButton,
          'data-primary': 'true',
          'data-danger': 'true',
          disabled: pending,
          onClick: props.onConfirm,
        }, pending ? tt('dialog.archiving') : tt('dialog.archiveConfirm')),
      ]),
    ]));
  }

  function RenameDialog(props) {
    if (!props || !props.open) return null;
    var pending = props.pending === true;
    var value = typeof props.value === 'string' ? props.value : '';
    var canSave = value.trim() !== '' && !pending;

    function onKeyDown(event) {
      if (!event) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        if (props.onCancel) props.onCancel();
        return;
      }
      if (event.key === 'Enter' && canSave && props.onSave) {
        event.preventDefault();
        props.onSave();
      }
    }

    return portalLayer(React.createElement('div', {
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': tt('dialog.renameTitle'),
      className: AH.dialog,
    }, [
      React.createElement('div', { key: 'title', className: AH.dialogTitle }, tt('dialog.renameTitle')),
      React.createElement('input', {
        key: 'input',
        className: AH.dialogInput,
        value: value,
        placeholder: tt('dialog.renamePlaceholder'),
        autoFocus: true,
        disabled: pending,
        onChange: function (event) {
          if (props.onChange) props.onChange(event && event.target ? event.target.value : '');
        },
        onKeyDown: onKeyDown,
      }),
      props.error ? React.createElement('div', { key: 'error', className: AH.dialogError }, props.error) : null,
      React.createElement('div', { key: 'actions', className: AH.dialogActions }, [
        React.createElement('button', {
          key: 'cancel',
          type: 'button',
          className: AH.dialogButton,
          disabled: pending,
          onClick: props.onCancel,
        }, tt('dialog.cancel')),
        React.createElement('button', {
          key: 'save',
          type: 'button',
          className: AH.dialogButton,
          'data-primary': 'true',
          disabled: !canSave,
          onClick: function () { if (canSave && props.onSave) props.onSave(); },
        }, pending ? tt('dialog.saving') : tt('dialog.save')),
      ]),
    ]));
  }

  function PanelToast(props) {
    if (!props || !props.open || !props.toast) return null;
    var toast = props.toast;
    return portalLayer(React.createElement('div', {
      role: 'status',
      'aria-live': 'polite',
      'data-tone': toast.tone === 'error' ? 'error' : 'info',
      className: AH.toast,
    }, [
      React.createElement('span', { key: 'text' }, toast.text),
      toast.actionLabel && typeof toast.onAction === 'function'
        ? React.createElement('button', {
            key: 'action',
            type: 'button',
            className: AH.toastAction,
            onClick: toast.onAction,
          }, toast.actionLabel)
        : null,
    ]));
  }

  function SessionCard(props) {
    var session = props.session;
    var now = props.now;
    // 入场错峰：同一批渲染的卡片依次淡入，最多累加到 160ms
    var enterDelay = (typeof props.index === 'number' ? Math.min(props.index, 8) : 0) * 20;

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
    if (groupC.length) groups.push(groupC);

    // 组内用圆点分隔，组间用竖线 + 更大留白，让同类信息聚在一起
    var metaRow = renderMetaGroups(groups);

    // 卡片右侧的状态列：工作中（蓝）/ 已完成（绿），两者互斥
    var statusColumnStyle = {
      flex: 'none',
      width: 66,
      alignSelf: 'stretch',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };

    var barTone = heatToneOf(session.level);

    var children = [
      React.createElement('span', {
        key: 'bar',
        className: AH.heatBar,
        style: {
          width: 6,
          marginLeft: 8,
          // 整条保持档位色，只在顶部提亮；见 heatBarSurface 的注释
          backgroundImage: heatBarSurface(barTone),
          boxShadow: heatBarShadow(barTone, session.level),
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
      // 三态互斥，优先级：等待回答 > 已完成 > 工作中。
      // 都落在卡片右侧的留白里（不用标题前的小徽章）。
      session.awaiting === true
        ? React.createElement('span', {
            key: 'awaiting',
            style: statusColumnStyle,
          }, React.createElement(AwaitingTag, { stacked: true }))
        : (session.done === true
          ? React.createElement('span', {
              key: 'done',
              style: statusColumnStyle,
            }, React.createElement(DoneTag, { stacked: true }))
          : (session.running === true
            ? React.createElement('span', {
                key: 'working',
                style: statusColumnStyle,
              }, React.createElement(WorkingTag, { stacked: true }))
            : null)),
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
        React.createElement('span', {
          style: {
            width: '100%',
            textAlign: 'right',
            fontSize: '0.8em',
            lineHeight: '18px',
            color: UI.textTertiary,
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
          },
        }, relativeOf(session.at, now)),
      ),
    ];

    var running = session.running === true;
    // 已完成 / 等待回答的会话不再套运行中外框 / 跑马灯
    var activeRunning = running && session.done !== true && session.awaiting !== true;

    var buttonStyle = {
      display: 'flex',
      alignItems: 'stretch',
      gap: 12,
      width: '100%',
      padding: '10px 14px 10px 0',
      // 运行中时由外层容器控制间距和边框，按钮自身不再留 margin
      margin: activeRunning ? 0 : '0 0 8px',
      borderRadius: activeRunning ? Math.max(2, UI.radius - 2) : UI.radius,
      cursor: 'pointer',
      textAlign: 'left',
      font: 'inherit',
      color: 'inherit',
      overflow: 'hidden',
      position: 'relative',
      zIndex: 1,
      animationDelay: enterDelay + 'ms',
    };
    // 运行中的卡片由 RunningFrame 提供外框，按钮自身不要边框
    if (activeRunning) buttonStyle.border = 'none';

    var cardButton = React.createElement(
      'button',
      {
        type: 'button',
        onClick: props.onClick,
        // 用 aria-label 而不是 title：原生 tooltip 会在悬停时长胶囊时浮出来挡住耗时卡
        'aria-label': tt('card.openSessionTitle', { title: session.title || session.id }),
        className: activeRunning ? AH.card + ' ' + AH.cardRunning : AH.card,
        style: buttonStyle,
        // 右键与 Shift+F10 / 菜单键都能打开同一份菜单；右键菜单由 portal 渲染，不会被列表裁剪
        onContextMenu: props.onOpenMenu
          ? function (event) { event.preventDefault(); props.onOpenMenu(event); }
          : undefined,
        onKeyDown: props.onOpenMenu
          ? function (event) {
              if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
                event.preventDefault();
                props.onOpenMenu(event);
              }
            }
          : undefined,
      },
      children,
    );

    var menuNode = props.menuItems && props.menuItems.length
      ? React.createElement(ContextMenu, {
          open: props.menuOpen === true,
          items: props.menuItems,
          x: props.menuX,
          y: props.menuY,
          label: session.title || session.id,
          onClose: props.onMenuClose,
        })
      : null;

    // 非运行中：不引入额外 DOM；菜单关闭时 ContextMenu 自己返回 null
    var frame = activeRunning ? React.createElement(RunningFrame, null, cardButton) : cardButton;
    if (!menuNode) return frame;
    return React.createElement(React.Fragment, null, frame, menuNode);
  }

  function GroupCard(props) {
    var group = props.group;
    var now = props.now;
    var rank = props.rank;
    var openable = group.workspaceId !== undefined;
    var running = group.running === true;
    var enterDelay = (typeof props.index === 'number' ? Math.min(props.index, 8) : 0) * 20;

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
        'aria-label': openable ? tt('card.openWorkspaceTitle', { name: group.label }) : tt('workspace.ungroupedTitle'),
        className: running
          ? AH.card + ' ' + AH.cardGroup + ' ' + AH.cardRunning
          : AH.card + ' ' + AH.cardGroup,
        'data-openable': openable ? 'true' : 'false',
        // 未分组卡片（openable=false）没有可执行动作，不挂右键
        onContextMenu: openable && props.onOpenMenu
          ? function (event) { event.preventDefault(); props.onOpenMenu(event); }
          : undefined,
        onKeyDown: openable && props.onOpenMenu
          ? function (event) {
              if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
                event.preventDefault();
                props.onOpenMenu(event);
              }
            }
          : undefined,
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          width: '100%',
          padding: '12px 16px',
          // 运行中时由外层容器控制间距和边框，按钮自身不再留 margin
          margin: running ? 0 : '0 0 10px',
          borderRadius: running ? Math.max(2, UI.radius - 2) : UI.radius,
          // 关键：按钮必须在跑马灯之上（定位 + z-index），否则旋转的色带会盖在卡片上。
          position: running ? 'relative' : undefined,
          zIndex: running ? 1 : undefined,
          overflow: 'hidden',
          cursor: openable ? 'pointer' : 'default',
          textAlign: 'left',
          font: 'inherit',
          color: 'inherit',
          animationDelay: enterDelay + 'ms',
        },
      },
      React.createElement('span', {
        key: 'bar',
        className: AH.heatBar,
        style: {
          width: 6,
          backgroundImage: heatBarSurface(heatToneOf(group.level)),
          boxShadow: heatBarShadow(heatToneOf(group.level), group.level),
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
            background: 'color-mix(in srgb, var(--dsw-specific-menu, rgba(127,127,127,0.08)) 62%, transparent)',
            border: '1px solid color-mix(in srgb, var(--dsw-alias-border-l1, rgba(127,127,127,0.18)) 68%, transparent)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10)',
            opacity: rank <= 3 ? 1 : 0.6,
          },
        }, '#' + rank),
      ),
    );

    var menuNode = props.menuItems && props.menuItems.length
      ? React.createElement(ContextMenu, {
          open: props.menuOpen === true,
          items: props.menuItems,
          x: props.menuX,
          y: props.menuY,
          label: group.label,
          onClose: props.onMenuClose,
        })
      : null;

    // 工作区里有正在跑的会话时，与会话卡片使用同一套运行中动效
    var frame = running ? React.createElement(RunningFrame, null, cardButton) : cardButton;
    if (!menuNode) return frame;
    return React.createElement(React.Fragment, null, frame, menuNode);
  }

  function useMinuteTick() {
    var state = React.useState(0);
    React.useEffect(function () {
      var timer = setInterval(function () { state[1](function (v) { return v + 1; }); }, 60000);
      return function () { clearInterval(timer); };
    }, []);
    return state[0];
  }

  /** 分段切换控件：一组胶囊，选中项实底（表面与过渡见 AH_CSS）。 */
  function Segmented(props) {
    var options = props && props.options ? props.options : [];
    var value = props && props.value;
    var onChange = props && props.onChange;
    var compact = props && props.compact === true;
    var text = props && props.variant === 'text';
    return React.createElement(
      'span',
      { style: { display: 'inline-flex', alignItems: 'center', gap: text ? 2 : 2, flex: 'none' } },
      options.map(function (option) {
        var picked = value === option.value;
        var style = text
          ? {
            padding: '2px 5px',
            borderRadius: 6,
            // 数量选择保持"无底色、无边框"的语义：选中态的玻璃底由 .ah-count::before 画，
            // 内联的 transparent 只是为了让这份语义在外部仍然可读（也便于测试断言）。
            border: '1px solid transparent',
            background: 'transparent',
            fontSize: '0.78em',
            lineHeight: '18px',
            cursor: 'pointer',
            font: 'inherit',
            // 放在 font 之后：font 简写会把字重重置成继承值
            fontWeight: picked ? 600 : 400,
          }
          : {
            padding: compact ? '1px 7px' : '3px 9px',
            borderRadius: 7,
            fontSize: compact ? '0.74em' : '0.78em',
            lineHeight: compact ? '16px' : '18px',
            cursor: 'pointer',
            font: 'inherit',
            fontWeight: picked ? 600 : 400,
          };
        return React.createElement(
          'button',
          {
            key: String(option.value),
            type: 'button',
            onClick: function () { if (onChange) onChange(option.value); },
            className: text ? AH.count : AH.seg,
            'data-active': picked ? 'true' : 'false',
            style: style,
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

    // 右键菜单 / 归档确认 / 重命名 / 轻量提示：面板级单例，卡片只负责触发
    var menuState = React.useState(null);
    var menu = menuState[0];
    var setMenu = menuState[1];
    var dialogState = React.useState(null);
    var dialog = dialogState[0];
    var setDialog = dialogState[1];
    var renameDraftState = React.useState('');
    var renameDraft = renameDraftState[0];
    var setRenameDraft = renameDraftState[1];
    var toastState = React.useState(null);
    var toast = toastState[0];
    var setToast = toastState[1];
    // 宿主 open-in-app 目录（本机实际安装的应用）与「打开方式」浮层。
    // initialApps 只给测试注入用（与 initialView 同策略），生产始终从探测开始。
    var initialApps = props && Array.isArray(props.initialApps) ? props.initialApps : null;
    var appsState = React.useState(initialApps && initialApps.length > 0 ? initialApps : []);
    var apps = appsState[0];
    var setApps = appsState[1];
    var openWithState = React.useState(null);
    var openWith = openWithState[0];
    var setOpenWith = openWithState[1];

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

    /* ---------------- 右键菜单：服务、动作与菜单项 ---------------- */

    var sessionsService = props && props.ctx ? props.ctx.get('sessions') : undefined;
    var caps = capabilitiesOf(uiWorkspace, sessionsService);
    var pinnedIds = workspaceState && Array.isArray(workspaceState.pinnedSessionIds)
      ? workspaceState.pinnedSessionIds
      : [];

    function notify(text, tone, actionLabel, onAction) {
      setToast({
        key: Date.now() + Math.random(),
        text: text,
        tone: tone === 'error' ? 'error' : 'info',
        actionLabel: actionLabel,
        onAction: onAction,
      });
    }

    // 提示自动消失：错误停留更久，带撤销动作的多留一会儿。
    React.useEffect(function () {
      if (!toast) return undefined;
      var timer = setTimeout(function () {
        setToast(null);
      }, toast.tone === 'error' ? 5000 : (toast.actionLabel ? 6000 : 3000));
      return function () { clearTimeout(timer); };
    }, [toast]);

    // 宿主挂载 open-in-app 时才有应用目录；失败或空列表时「打开方式」禁用而不是消失。
    // 页面可能早于 Host 路由就绪，做 3 次退避重试，避免一次 404 就永久空白。
    React.useEffect(function () {
      var cancelled = false;
      var attempts = 0;
      var timer = null;

      function retry() {
        if (cancelled || attempts >= 3) return;
        timer = setTimeout(load, 800 * attempts);
      }

      function load() {
        if (cancelled) return;
        attempts += 1;
        try {
          if (typeof fetch !== 'function') return;
          fetch('open-in-app/apps').then(function (response) {
            return response && response.ok && typeof response.json === 'function'
              ? response.json()
              : null;
          }).then(function (body) {
            if (cancelled) return;
            if (!body || !Array.isArray(body.apps)) {
              retry();
              return;
            }
            ahLog('[activity-heat] open-in-app apps:', body.apps);
            setApps(body.apps.filter(function (id) {
              return typeof id === 'string' && id !== '';
            }));
          }, function () {
            ahWarn('[activity-heat] open-in-app apps request failed (attempt ' + attempts + ')');
            retry();
          });
        } catch (ignored) { /* fetch 不可用 */ }
      }

      load();
      return function () {
        cancelled = true;
        if (timer) clearTimeout(timer);
      };
    }, []);

    function closeMenu() {
      setMenu(null);
      try {
        if (lastMenuTrigger && lastMenuTrigger.isConnected !== false
          && typeof lastMenuTrigger.focus === 'function') {
          // preventScroll：焦点回到卡片时不要把列表滚走
          lastMenuTrigger.focus({ preventScroll: true });
        }
      } catch (ignored) { /* 卡片已被移除时忽略 */ }
      lastMenuTrigger = null;
    }

    function openMenuFor(kind, payload, event) {
      lastMenuTrigger = event && event.currentTarget ? event.currentTarget : null;
      var x = 12;
      var y = 12;
      try {
        if (event && typeof event.clientX === 'number' && (event.clientX !== 0 || event.clientY !== 0)) {
          x = event.clientX;
          y = event.clientY;
        } else if (event && event.currentTarget
          && typeof event.currentTarget.getBoundingClientRect === 'function') {
          var rect = event.currentTarget.getBoundingClientRect();
          x = rect.left + 12;
          y = rect.bottom - 4;
        }
      } catch (ignored) { /* 用默认坐标 */ }
      setMenu({
        kind: kind,
        // 会话用 id，工作区用 workspaceId（Ungrouped 没有 workspaceId，卡片本身不可右键）
        id: payload ? (payload.id !== undefined ? payload.id : payload.workspaceId) : undefined,
        payload: payload,
        x: x,
        y: y,
      });
    }

    function copyWithToast(value) {
      copyText(value).then(function (ok) {
        if (ok) notify(tt('toast.copied'));
        else notify(tt('error.copy'), 'error');
      });
    }

    function togglePin(session) {
      var pinned = pinnedIds.indexOf(session.id) !== -1;
      var method = pinned ? 'unpinSession' : 'pinSession';
      if (!uiWorkspace || typeof uiWorkspace[method] !== 'function') {
        notify(tt('menu.unavailable'), 'error');
        return;
      }
      try {
        Promise.resolve(uiWorkspace[method](session.id)).then(function () {
          notify(pinned ? tt('toast.unpin') : tt('toast.pin'));
        }, function (reason) {
          ahWarn('[activity-heat] pin failed:', reason && reason.message);
          notify(tt(pinned ? 'error.unpin' : 'error.pin'), 'error');
        });
      } catch (error) {
        ahWarn('[activity-heat] pin failed:', error && error.message);
        notify(tt(pinned ? 'error.unpin' : 'error.pin'), 'error');
      }
    }

    function forkSession(session) {
      if (!uiWorkspace || typeof uiWorkspace.forkSession !== 'function') {
        notify(tt('menu.unavailable'), 'error');
        return;
      }
      try {
        Promise.resolve(uiWorkspace.forkSession(session.id)).then(function () {
          // 与宿主一致：分叉成功不导航，只提示分支已创建
          notify(tt('toast.forked'));
        }, function (reason) {
          ahWarn('[activity-heat] fork failed:', reason && reason.message);
          notify(tt('error.fork'), 'error');
        });
      } catch (error) {
        ahWarn('[activity-heat] fork failed:', error && error.message);
        notify(tt('error.fork'), 'error');
      }
    }

    function archiveErrorText(reason) {
      var message = reason && reason.message ? String(reason.message) : '';
      return /active|running|busy|activity/i.test(message) ? tt('error.running') : tt('error.archive');
    }

    function restoreArchived(sessionId) {
      if (!uiWorkspace || typeof uiWorkspace.unarchiveSession !== 'function') return;
      try {
        Promise.resolve(uiWorkspace.unarchiveSession(sessionId)).then(function () {
          notify(tt('toast.unarchived'));
        }, function (reason) {
          ahWarn('[activity-heat] unarchive failed:', reason && reason.message);
          notify(tt('error.unarchive'), 'error');
        });
      } catch (error) {
        ahWarn('[activity-heat] unarchive failed:', error && error.message);
        notify(tt('error.unarchive'), 'error');
      }
    }

    function openRename(session) {
      setRenameDraft(session.title || '');
      setDialog({ kind: 'rename', session: session, pending: false, error: '' });
    }

    function submitRename() {
      if (!dialog || dialog.kind !== 'rename') return;
      var target = dialog.session;
      var next = String(renameDraft || '').trim();
      if (next === '') {
        setDialog({ kind: 'rename', session: target, pending: false, error: tt('dialog.emptyTitle') });
        return;
      }
      if (!sessionsService || typeof sessionsService.using !== 'function') {
        setDialog({ kind: 'rename', session: target, pending: false, error: tt('menu.unavailable') });
        return;
      }
      setDialog({ kind: 'rename', session: target, pending: true, error: '' });
      var settle = function (ok, message) {
        if (ok) {
          setDialog(null);
          notify(tt('toast.renamed'));
          return;
        }
        setDialog({ kind: 'rename', session: target, pending: false, error: message || tt('error.rename') });
      };
      try {
        // 与宿主行菜单同一条路径：临时 reference + session.rename
        Promise.resolve(sessionsService.using(target.id, { source: 'workspaceOperation' }, function (reference) {
          return reference.binding.session.rename(next);
        })).then(function (result) {
          if (result && result.ok === false) {
            ahWarn('[activity-heat] rename rejected:', result.error && result.error.message);
            settle(false, tt('error.rename'));
            return;
          }
          settle(true);
        }, function (reason) {
          ahWarn('[activity-heat] rename failed:', reason && reason.message);
          settle(false, tt('error.rename'));
        });
      } catch (error) {
        ahWarn('[activity-heat] rename failed:', error && error.message);
        settle(false, tt('error.rename'));
      }
    }

    function confirmArchive() {
      if (!dialog || dialog.kind !== 'archive') return;
      var target = dialog.session;
      if (!uiWorkspace || typeof uiWorkspace.archiveSession !== 'function') {
        setDialog({ kind: 'archive', session: target, pending: false, error: tt('menu.unavailable') });
        return;
      }
      setDialog({ kind: 'archive', session: target, pending: true, error: '' });
      try {
        Promise.resolve(uiWorkspace.archiveSession(target.id)).then(function () {
          setDialog(null);
          notify(tt('toast.archived'), 'info', tt('toast.undo'), function () {
            restoreArchived(target.id);
          });
        }, function (reason) {
          ahWarn('[activity-heat] archive failed:', reason && reason.message);
          setDialog({
            kind: 'archive',
            session: target,
            pending: false,
            error: archiveErrorText(reason),
          });
        });
      } catch (error) {
        ahWarn('[activity-heat] archive failed:', error && error.message);
        setDialog({ kind: 'archive', session: target, pending: false, error: tt('error.archive') });
      }
    }

    function downloadLog(session) {
      downloadSessionLog(session.id).then(function (ok) {
        if (!ok) notify(tt('error.export'), 'error');
      });
    }

    function startSessionIn(workspaceId) {
      if (!uiWorkspace || typeof uiWorkspace.startSession !== 'function') {
        notify(tt('menu.unavailable'), 'error');
        return;
      }
      try {
        uiWorkspace.startSession(workspaceId);
      } catch (error) {
        ahWarn('[activity-heat] startSession failed:', error && error.message);
        notify(tt('error.start'), 'error');
      }
    }

    function closeOpenWith() {
      setOpenWith(null);
      try {
        if (lastMenuTrigger && lastMenuTrigger.isConnected !== false
          && typeof lastMenuTrigger.focus === 'function') {
          lastMenuTrigger.focus({ preventScroll: true });
        }
      } catch (ignored) { /* 卡片已被移除时忽略 */ }
      lastMenuTrigger = null;
    }

    function openWithFor(path, label) {
      var anchor = menu || { x: 12, y: 12 };
      setMenu(null);
      setOpenWith({ path: path, label: label, x: anchor.x, y: anchor.y });
    }

    /** 「打开方式」列表：终端固定第一项；其余按文件管理器 → 编辑器 → 终端 → 其他排序，组间加分隔。 */
    function buildOpenWithItems(target) {
      var path = target && target.path;
      // 宿主 catalog 可能解析不到 windowsterminal，不能因此让列表里没有终端
      var items = [{
        id: 'terminal',
        label: tt('menu.openTerminal'),
        disabled: !isAbsolutePath(path),
        hint: !isAbsolutePath(path) ? tt('menu.openWithNoPath') : undefined,
        onSelect: function () { closeOpenWith(); openTerminal(path); },
      }];
      var ordered = apps.filter(function (id) {
        // Git Bash 是 shell，不是终端模拟器；「终端」只列 Windows Terminal / Terminal 这一类
        return id !== 'gitbash';
      }).slice().sort(function (a, b) {
        return openWithGroupRank(a) - openWithGroupRank(b);
      });
      var lastGroup = -1;
      ordered.forEach(function (id) {
        var group = openWithGroupRank(id);
        items.push({
          id: 'app-' + id,
          label: tt('openWith.item', { app: appLabelOf(id) }),
          separatorBefore: lastGroup !== -1 && group !== lastGroup,
          disabled: !isAbsolutePath(path),
          onSelect: function () { openInApp(id, path); },
        });
        lastGroup = group;
      });
      return items;
    }

    function openTerminal(path) {
      closeMenu();
      try {
        if (typeof fetch !== 'function' || !isAbsolutePath(path)) {
          notify(tt('error.openTerminal'), 'error');
          return;
        }
        fetch('activity-heat/open-terminal', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ path: path }),
        }).then(function (response) {
          return Boolean(response && response.ok);
        }, function () {
          return false;
        }).then(function (ok) {
          if (ok) notify(tt('toast.terminalOpened'));
          else notify(tt('error.openTerminal'), 'error');
        });
      } catch (error) {
        ahWarn('[activity-heat] open terminal failed:', error && error.message);
        notify(tt('error.openTerminal'), 'error');
      }
    }

    function openInApp(appId, path) {
      closeOpenWith();
      try {
        if (typeof fetch !== 'function' || !isAbsolutePath(path)) {
          notify(tt('error.openWith'), 'error');
          return;
        }
        fetch('open-in-app/open', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ app: appId, path: path }),
        }).then(function (response) {
          return Boolean(response && response.ok);
        }, function () {
          return false;
        }).then(function (ok) {
          if (ok) notify(tt('toast.openedWith', { app: appLabelOf(appId) }));
          else notify(tt('error.openWith'), 'error');
        });
      } catch (error) {
        ahWarn('[activity-heat] open in app failed:', error && error.message);
        notify(tt('error.openWith'), 'error');
      }
    }

    function runSessionAction(actionId, session) {
      if (!session) return;
      if (actionId === 'open') { closeMenu(); markSeen(session.id, session.at); openSession(session.id); return; }
      if (actionId === 'copy-id') { closeMenu(); copyWithToast(session.id); return; }
      if (actionId === 'copy-title') { closeMenu(); copyWithToast(session.title); return; }
      if (actionId === 'copy-prompt') {
        closeMenu();
        copyWithToast(promptRawOf(sessionState, session.id));
        return;
      }
      if (actionId === 'copy-cwd') { closeMenu(); copyWithToast(session.cwd); return; }
      if (actionId === 'pin') { closeMenu(); togglePin(session); return; }
      if (actionId === 'rename') { closeMenu(); openRename(session); return; }
      if (actionId === 'fork') { closeMenu(); forkSession(session); return; }
      if (actionId === 'download') { closeMenu(); downloadLog(session); return; }
      if (actionId === 'archive') {
        closeMenu();
        setDialog({ kind: 'archive', session: session, pending: false, error: '' });
      }
    }

    function runGroupAction(actionId, group) {
      if (!group) return;
      if (actionId === 'open') { closeMenu(); openWorkspace(group.workspaceId); return; }
      if (actionId === 'new-session') { closeMenu(); startSessionIn(group.workspaceId); return; }
      if (actionId === 'copy-name') { closeMenu(); copyWithToast(group.label); return; }
      if (actionId === 'copy-path') {
        closeMenu();
        copyWithToast(group.workspace && group.workspace.path);
      }
    }

    function buildSessionItems(session) {
      var pinned = pinnedIds.indexOf(session.id) !== -1;
      var pinDisabled = pinned ? !caps.unpin : !caps.pin;
      var items = [];
      items.push({
        id: 'open',
        label: tt('menu.openSession'),
        disabled: !caps.open,
        hint: caps.open ? undefined : tt('menu.unavailable'),
        onSelect: function () { runSessionAction('open', session); },
      });
      items.push({
        id: 'terminal',
        label: tt('menu.openTerminal'),
        disabled: !isAbsolutePath(session.cwd),
        hint: !isAbsolutePath(session.cwd) ? tt('menu.openWithNoPath') : undefined,
        onSelect: function () { openTerminal(session.cwd); },
      });
      items.push({
        id: 'open-with',
        label: tt('menu.openWith'),
        disabled: apps.length === 0 || !isAbsolutePath(session.cwd),
        hint: apps.length === 0
          ? tt('menu.openWithUnavailable')
          : (!isAbsolutePath(session.cwd) ? tt('menu.openWithNoPath') : undefined),
        onSelect: function () { openWithFor(session.cwd, session.title || session.id); },
      });
      items.push({
        id: 'copy-id',
        label: tt('menu.copyId'),
        separatorBefore: true,
        onSelect: function () { runSessionAction('copy-id', session); },
      });
      items.push({
        id: 'copy-title',
        label: tt('menu.copyTitle'),
        disabled: !session.title,
        onSelect: function () { runSessionAction('copy-title', session); },
      });
      items.push({
        id: 'copy-prompt',
        label: tt('menu.copyPrompt'),
        disabled: !session.prompt,
        onSelect: function () { runSessionAction('copy-prompt', session); },
      });
      items.push({
        id: 'copy-cwd',
        label: tt('menu.copyCwd'),
        disabled: !session.cwd,
        onSelect: function () { runSessionAction('copy-cwd', session); },
      });
      items.push({
        id: 'pin',
        label: tt(pinned ? 'menu.unpin' : 'menu.pin'),
        separatorBefore: true,
        disabled: pinDisabled,
        hint: pinDisabled ? tt('menu.unavailable') : undefined,
        onSelect: function () { runSessionAction('pin', session); },
      });
      items.push({
        id: 'rename',
        label: tt('menu.rename'),
        disabled: !caps.rename,
        hint: caps.rename ? undefined : tt('menu.unavailable'),
        onSelect: function () { runSessionAction('rename', session); },
      });
      items.push({
        id: 'fork',
        label: tt('menu.fork'),
        disabled: !caps.fork,
        hint: caps.fork ? undefined : tt('menu.unavailable'),
        onSelect: function () { runSessionAction('fork', session); },
      });
      items.push({
        id: 'download',
        label: tt('menu.downloadLog'),
        separatorBefore: true,
        onSelect: function () { runSessionAction('download', session); },
      });
      var running = session.running === true;
      var archiveDisabled = running || !caps.archive;
      items.push({
        id: 'archive',
        label: tt('menu.archive'),
        separatorBefore: true,
        danger: true,
        disabled: archiveDisabled,
        hint: running
          ? tt('menu.archiveRunningHint')
          : (!caps.archive ? tt('menu.unavailable') : undefined),
        onSelect: function () { runSessionAction('archive', session); },
      });
      return items;
    }

    function buildGroupItems(group) {
      var hasWorkspace = group.workspaceId !== undefined;
      var items = [];
      items.push({
        id: 'open',
        label: tt('menu.openWorkspace'),
        disabled: !caps.openWorkspace,
        hint: caps.openWorkspace ? undefined : tt('menu.unavailable'),
        onSelect: function () { runGroupAction('open', group); },
      });
      var workspacePath = group.workspace && group.workspace.path;
      items.push({
        id: 'terminal',
        label: tt('menu.openTerminal'),
        disabled: !isAbsolutePath(workspacePath),
        hint: !isAbsolutePath(workspacePath) ? tt('menu.openWithNoPath') : undefined,
        onSelect: function () { openTerminal(workspacePath); },
      });
      items.push({
        id: 'open-with',
        label: tt('menu.openWith'),
        disabled: apps.length === 0 || !isAbsolutePath(workspacePath),
        hint: apps.length === 0
          ? tt('menu.openWithUnavailable')
          : (!isAbsolutePath(workspacePath) ? tt('menu.openWithNoPath') : undefined),
        onSelect: function () { openWithFor(workspacePath, group.label); },
      });
      items.push({
        id: 'new-session',
        label: tt('menu.newSessionInWorkspace'),
        separatorBefore: true,
        disabled: !hasWorkspace || !caps.startSession,
        hint: !hasWorkspace
          ? tt('menu.unavailable')
          : (!caps.startSession ? tt('menu.unavailable') : undefined),
        onSelect: function () { runGroupAction('new-session', group); },
      });
      items.push({
        id: 'copy-name',
        label: tt('menu.copyWorkspaceName'),
        separatorBefore: true,
        onSelect: function () { runGroupAction('copy-name', group); },
      });
      items.push({
        id: 'copy-path',
        label: tt('menu.copyWorkspacePath'),
        disabled: !(group.workspace && group.workspace.path),
        onSelect: function () { runGroupAction('copy-path', group); },
      });
      return items;
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

    /* ---------- 顶部：标题 + 对象切换 + 数量 ---------- */
    // 标题已经去掉：视图切换直接作为第一层，把纵向空间留给列表
    var header = React.createElement('div', {
      key: 'head',
      style: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px ' + UI.padX + 'px 4px' },
    },
      React.createElement(Segmented, {
        options: [
          { value: 'sessions', label: tt('panel.sessionsCount', { count: model.total }) },
          { value: 'workspaces', label: tt('panel.workspacesCount', { count: model.workspaceCount }) },
        ],
        value: view,
        onChange: setView,
      }),
      React.createElement('span', { style: { flex: '1 1 auto' } }),
      // 数量：最次要的工具，改成无边框文字，避免和上面的视图/下面的筛选撞脸
      React.createElement('span', {
        style: { fontSize: '0.76em', color: UI.textTertiary, flex: 'none' },
      }, tt('panel.countLabel')),
      React.createElement(Segmented, {
        variant: 'text',
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
      cards = rows.map(function (session, index) {
        return React.createElement(SessionCard, {
          key: session.id,
          session: session,
          now: now,
          index: index,
          onClick: function () {
            // 点击打开即视为已读，立刻清掉「已完成」
            markSeen(session.id, session.at);
            openSession(session.id);
          },
          menuItems: buildSessionItems(session),
          menuOpen: Boolean(menu && menu.kind === 'session' && menu.id === session.id),
          menuX: menu ? menu.x : 0,
          menuY: menu ? menu.y : 0,
          onOpenMenu: function (event) { openMenuFor('session', session, event); },
          onMenuClose: closeMenu,
        });
      });
    } else {
      cards = rows.map(function (group, index) {
        return React.createElement(GroupCard, {
          key: 'g-' + group.key,
          group: group,
          now: now,
          index: index,
          rank: model.rankOf[group.key],
          onClick: function () { openWorkspace(group.workspaceId); },
          menuItems: buildGroupItems(group),
          menuOpen: Boolean(menu && menu.kind === 'group' && menu.id === group.workspaceId),
          menuX: menu ? menu.x : 0,
          menuY: menu ? menu.y : 0,
          onOpenMenu: function (event) { openMenuFor('group', group, event); },
          onMenuClose: closeMenu,
        });
      });
    }

    var emptyText = filter !== 'all'
      ? tt(view === 'sessions' ? 'panel.emptyFilteredSessions' : 'panel.emptyFilteredWorkspaces')
      : tt(view === 'sessions' ? 'panel.empty' : 'panel.emptyWorkspaces');

    var emptyHint = React.createElement('div', {
      className: AH.empty,
      style: { padding: '8px 0 14px', fontSize: '0.82em', color: UI.textTertiary },
    }, emptyText);

    // 隐藏原生滚动条（.ah-list 由 ensureStyles 注入），右侧浮标提示可以上下滑动。
    var scrollHint = canScroll
      ? React.createElement('span', {
          'aria-hidden': 'true',
          className: AH.scrollHint,
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
            color: UI.textTertiary,
            pointerEvents: 'none',
            opacity: 0.92,
          },
        },
          React.createElement('span', { style: { fontSize: 10, lineHeight: '10px' } }, '⌃'),
          React.createElement('span', {
            style: { width: 1, height: 12, background: 'currentColor', opacity: 0.35 },
          }),
          React.createElement('span', { style: { fontSize: 10, lineHeight: '10px' } }, '⌄'),
        )
      : null;

    // 列表内容整体淡入：视图 / 筛选 / 数量变化时靠 key 重挂载来重播
    var listKey = view + '|' + filter + '|' + (view === 'sessions' ? topCount : groupCount);

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
      },
        React.createElement('div', { key: listKey, className: AH.listInner },
          cards.length > 0 ? cards : emptyHint),
      ),
      // 上下边缘的柔和遮罩：让滚动内容"淡出"到面板底色，而不是被硬切
      canScroll ? React.createElement('span', { key: 'maskTop', 'aria-hidden': 'true', className: AH.listMaskTop }) : null,
      canScroll ? React.createElement('span', { key: 'maskBottom', 'aria-hidden': 'true', className: AH.listMaskBottom }) : null,
      scrollHint,
    );

    var footer = null;
    if (view === 'workspaces' && filter === 'all' && model.groups.length > groupCount) {
      footer = React.createElement('div', {
        key: 'more',
        style: { padding: '2px ' + UI.padX + 'px 10px', fontSize: '0.76em', color: UI.textTertiary },
      }, tt('panel.moreGroups', { count: model.groups.length - groupCount }));
    }

    // 对话框与提示常驻渲染，open=false 时组件自己返回 null（状态集中在面板，便于键盘/测试）
    var archiveNode = React.createElement(ConfirmArchive, {
      open: Boolean(dialog && dialog.kind === 'archive'),
      session: dialog ? dialog.session : undefined,
      pending: Boolean(dialog && dialog.pending),
      error: dialog ? dialog.error : undefined,
      onCancel: function () { setDialog(null); },
      onConfirm: confirmArchive,
    });
    var renameNode = React.createElement(RenameDialog, {
      open: Boolean(dialog && dialog.kind === 'rename'),
      value: renameDraft,
      pending: Boolean(dialog && dialog.pending),
      error: dialog ? dialog.error : undefined,
      onChange: setRenameDraft,
      onCancel: function () { setDialog(null); },
      onSave: submitRename,
    });
    var toastNode = React.createElement(PanelToast, { open: Boolean(toast), toast: toast });
    var openWithNode = React.createElement(ContextMenu, {
      open: Boolean(openWith),
      items: openWith ? buildOpenWithItems(openWith) : [],
      x: openWith ? openWith.x : 0,
      y: openWith ? openWith.y : 0,
      label: tt('openWith.title'),
      onClose: closeOpenWith,
    });

    return React.createElement('div', {
      className: AH.shell,
      style: { display: 'flex', flexDirection: 'column', paddingBottom: 16 },
    }, [header, filterBar, list, footer, archiveNode, renameNode, toastNode, openWithNode]);
  }

  function SessionRowHeat(props) {
    var sessionId = props && props.sessionId;
    if (!sessionId) return null;
    useMinuteTick();
    var useSessions = props && props.useSessions;
    var useWorkspaces = props && props.useWorkspaces;

    // 宿主数据读取全部兜底：本组件一旦在渲染期抛错，会被宿主判定为
    // "slot entry crashed" 并把整个插件停用，所以任何异常都必须吞掉。
    var summary;
    var archived = false;
    try {
      summary = useSessions
        ? useSessions(function (state) { return state && state.byId ? state.byId[sessionId] : undefined; })
        : undefined;
    } catch (ignored) { summary = undefined; }
    try {
      archived = useWorkspaces
        ? useWorkspaces(function (state) {
            return state && Array.isArray(state.archivedSessionIds)
              ? state.archivedSessionIds.indexOf(sessionId) !== -1
              : false;
          })
        : false;
    } catch (ignored) { archived = false; }

    var at = lastActiveOf(summary);
    var level = 0;
    if (!archived && summary && summary.running !== true && at !== undefined) {
      level = heatLevelOf(Date.now() - at);
    }

    // 侧栏行常驻，是推进"查看水位"最及时的入口：真正选中的会话立即算已读。
    // 在 effect 里重新读一次 DOM，避免拿到上一帧的选中状态。
    React.useEffect(function () {
      try {
        if (archived) return;
        var open = isSelectedRow(sessionId, summary && summary.retainedBy && summary.retainedBy.mainView > 0);
        syncSeenForSessions([{ id: sessionId, at: at, open: open }]);
      } catch (ignored) { /* 水位失败不影响侧栏 */ }
    }, [sessionId, at, archived]);

    // 把热度写进标题下方的背景线；卸载时撤销该会话的规则。
    React.useEffect(function () {
      try {
        setTitleFlowLevel(sessionId, level);
      } catch (ignored) { /* 样式同步失败不影响侧栏 */ }
      return function () {
        try { setTitleFlowLevel(sessionId, 0); } catch (ignored) { /* ignore */ }
      };
    }, [sessionId, level]);

    // 行首格完全让给原生状态点与定时任务时钟：这里不渲染任何可见节点。
    return null;
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
    var running = summary && summary.running === true;
    var facts = sessionState && sessionState.projectionsBySession
      ? factsFromProjection(sessionState.projectionsBySession[sessionId])
      : {};
    var awaiting = facts.awaiting === true;
    var isOpen = isSelectedRow(sessionId, summary && summary.retainedBy && summary.retainedBy.mainView > 0);
    var done = doneUnseenOf(sessionId, at, running, isOpen, now);
    // 与面板卡片同一口径：运行中按最高热度显示
    var level = running ? 5 : heatLevelOf(now - at);
    var model = sessionState && workspaceState ? buildModel(sessionState, workspaceState, now) : null;

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

    // 状态行：状态标签自带文字与颜色；没有状态时才显示档位名。
    // 等待回答由宿主 hover 卡底部自带的那行表达，这里不再重复。
    var stateTag = null;
    if (done) {
      stateTag = React.createElement(DoneTag, { compact: true });
    } else if (running && !awaiting) {
      stateTag = React.createElement(WorkingTag, { compact: true });
    }

    var header = React.createElement('div', {
      key: 'head',
      style: { display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 },
    },
      stateTag || React.createElement(RowHeatBar, { level: level, title: '', width: 10, height: 16, align: 'center' }),
      stateTag
        ? null
        : React.createElement('span', {
            style: {
              color: 'var(--dsw-alias-label-secondary)', whiteSpace: 'nowrap',
              overflow: 'hidden', textOverflow: 'ellipsis',
            },
          }, heatNameOf(level)),
      React.createElement('span', {
        style: {
          marginLeft: 'auto', color: 'var(--dsw-alias-label-tertiary)',
          fontVariantNumeric: 'tabular-nums', flex: 'none',
        },
      }, tt('hover.heatLevel', { level: level })),
    );

    var meterRow = React.createElement('div', {
      key: 'meter',
      style: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 },
    }, React.createElement(HeatMeter, {
      level: level,
      // 运行中按最高档显示，填充也接近满格，避免"档位炽热、进度条只有一半"
      ratio: running ? 0.96 : heatRatioOf(now - at),
      showLabel: true,
      width: 118,
      height: 6,
    }));

    function divider(key) {
      return React.createElement('span', {
        key: key,
        'aria-hidden': 'true',
        style: {
          display: 'block', height: 1, margin: '5px 0',
          background: 'color-mix(in srgb, var(--dsw-alias-label-tertiary) 26%, transparent)',
        },
      });
    }

    var cells = [];
    if (typeof facts.turns === 'number') cells.push([tt('field.turns'), tt('fact.turns', { n: facts.turns })]);
    if (typeof facts.tokens === 'number') cells.push([tt('field.tokens'), tt('fact.tokens', { n: compactNumber(facts.tokens) })]);
    if (facts.cacheRate !== undefined && facts.cacheRate !== '') cells.push([tt('field.cache'), tt('fact.cache', { n: facts.cacheRate })]);
    if (typeof facts.contextPct === 'number') cells.push([tt('field.context'), tt('fact.context', { n: facts.contextPct })]);

    var grid = cells.length > 0
      ? React.createElement('div', {
          key: 'stats',
          style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 14px' },
        }, cells.map(function (cell, index) {
          return React.createElement('span', {
            key: index,
            style: { display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 },
          },
            React.createElement('span', {
              style: {
                fontSize: '0.72em', color: 'var(--dsw-alias-label-tertiary)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              },
            }, cell[0]),
            React.createElement('span', {
              style: {
                fontSize: '0.9em', color: 'var(--dsw-alias-label-primary)',
                fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
                overflow: 'hidden', textOverflow: 'ellipsis',
              },
            }, cell[1]),
          );
        }))
      : null;

    var workspaceRow = group
      ? React.createElement('div', {
          key: 'ws',
          style: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, minWidth: 0 },
        },
          React.createElement('span', {
            'aria-hidden': 'true',
            style: { flex: 'none', width: 3, height: 13, borderRadius: 2, background: heatToneOf(group.level), opacity: 0.9 },
          }),
          React.createElement('span', {
            style: {
              minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis',
              whiteSpace: 'nowrap', color: 'var(--dsw-alias-label-secondary)',
            },
          }, rank === 1
            ? tt('hover.workspaceHot', { name: group.label })
            : tt('hover.workspaceRank', { name: group.label, rank: rank })),
        )
      : null;

    var footer = React.createElement('div', {
      key: 'at',
      style: { marginTop: 4, fontSize: '0.76em', color: 'var(--dsw-alias-label-tertiary)' },
    }, tt('hover.lastActive', { time: relativeOf(at, now) }));

    return React.createElement('div', {
      className: 'ah-hover-content',
      style: {
        display: 'flex', flexDirection: 'column', fontSize: '0.84em',
        color: 'var(--dsw-alias-label-secondary)', minWidth: 0,
      },
    }, [
      header,
      meterRow,
      cells.length > 0 ? divider('d1') : null,
      grid,
      group ? divider('d2') : null,
      workspaceRow,
      footer,
    ]);
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
      style.textContent = AH_CSS;
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
