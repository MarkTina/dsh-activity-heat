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
    range: { active: '常规', archived: '已归档', subagent: '子代理' },
    hover: {
      heat: '热度 {level}/5 · {name}',
      heatLevel: '热度 {level}/5',
      heatRunning: '热度 {level}/5 · 进行中',
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
    status: {
      running: '进行中',
      idle: '空闲',
      waitingApproval: '等待审批',
      planReview: '计划待审',
      waitingAnswer: '等待回答',
      completed: '已完成',
      subagentsRunning: { one: '{n} 个子智能体运行中', other: '{n} 个子智能体运行中' },
      compact: { approval: '待审批', planReview: '计划待审', answer: '待回答', subagents: '{n} 子智能体' },
      runningTitle: '该会话正在运行',
      idleTitle: '该会话空闲',
      waitingApprovalTitle: '该会话在等待你的授权',
      planReviewTitle: '该会话的计划在等待你审阅',
      waitingAnswerTitle: '该会话在等待你的回答',
      completedTitle: '该会话已完成，尚未查看',
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
    badge: { title: '{count} 个会话需要关注' },
    bottom: { title: '活跃会话 {count}', more: '+{count}', open: '打开「{title}」' },
    batch: {
      select: '选择',
      exit: '退出选择',
      count: '已选 {count}',
      archive: '归档所选',
      pin: '置顶所选',
      copy: '复制 ID',
      archived: '已归档 {count} 个会话',
      pinned: '已置顶 {count} 个会话',
    },
    tokens: {
      title: 'Token 用量',
      cacheHit: '缓存命中',
      uncached: '未缓存输入',
      cacheRead: '缓存读取',
      cacheWrite: '缓存写入',
      output: '输出',
    },
    shortcut: { label: '最近活跃会话' },
    command: { openLabel: '最近活跃会话', openDesc: '打开最近活跃会话面板' },
    rightbar: { title: '最近活跃', guideTitle: '最近活跃会话', guideDesc: '把最近活跃会话停靠在右侧栏', empty: '暂无最近活动' },
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
      stopArchive: '停止并归档…',
      stopArchiveHint: '先停止进行中的回合、子代理、后台任务与定时提醒',
      unarchive: '恢复会话',
      archivedOpenHint: '已归档，请先恢复',
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
      archivedStopped: '已停止并归档',
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
      stopArchiveTitle: '停止并归档？',
      stopArchiveBody: '「{title}」仍在运行。继续会先停止它进行中的回合、子代理、后台任务与定时提醒，然后归档；停止不可逆。',
      stopArchiveConfirm: '停止并归档',
      stopping: '正在停止…',
      activityTitle: '仍在运行的工作',
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
      gitbash: 'Git Bash',
      wsl: 'WSL',
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
    range: { active: 'Active', archived: 'Archived', subagent: 'Subagents' },
    hover: {
      heat: 'Heat {level}/5 · {name}',
      heatLevel: 'Heat {level}/5',
      heatRunning: 'Heat {level}/5 · running',
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
    status: {
      running: 'Running',
      idle: 'Idle',
      waitingApproval: 'Waiting for approval',
      planReview: 'Plan awaiting review',
      waitingAnswer: 'Waiting for answer',
      completed: 'Completed',
      subagentsRunning: { one: '{n} subagent running', other: '{n} subagents running' },
      compact: { approval: 'Approval', planReview: 'Plan review', answer: 'Answer', subagents: '{n} subagents' },
      runningTitle: 'This session is running',
      idleTitle: 'This session is idle',
      waitingApprovalTitle: 'This session is waiting for your approval',
      planReviewTitle: 'This session plan is waiting for review',
      waitingAnswerTitle: 'This session is waiting for your answer',
      completedTitle: 'Finished, not viewed yet',
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
    badge: { title: '{count} sessions need attention' },
    bottom: { title: 'Active {count}', more: '+{count}', open: 'Open “{title}”' },
    batch: {
      select: 'Select',
      exit: 'Exit select',
      count: '{count} selected',
      archive: 'Archive selected',
      pin: 'Pin selected',
      copy: 'Copy IDs',
      archived: 'Archived {count} sessions',
      pinned: 'Pinned {count} sessions',
    },
    tokens: {
      title: 'Token usage',
      cacheHit: 'Cache hit',
      uncached: 'Uncached input',
      cacheRead: 'Cached input',
      cacheWrite: 'Cache write',
      output: 'Output',
    },
    shortcut: { label: 'Recent Activity' },
    command: { openLabel: 'Recent Activity', openDesc: 'Open the recent activity panel' },
    rightbar: { title: 'Recent Activity', guideTitle: 'Recent Activity', guideDesc: 'Dock recently active sessions in the right sidebar', empty: 'No recent activity' },
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
      stopArchive: 'Stop and archive…',
      stopArchiveHint: 'Stops the running turn, subagents, jobs and schedules first',
      unarchive: 'Restore session',
      archivedOpenHint: 'Archived — restore it first',
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
      archivedStopped: 'Stopped and archived',
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
      stopArchiveTitle: 'Stop and archive?',
      stopArchiveBody: '“{title}” is still running. Continuing stops its running turn, subagents, jobs and schedules first, then archives it; stopping is irreversible.',
      stopArchiveConfirm: 'Stop and archive',
      stopping: 'Stopping…',
      activityTitle: 'Still running',
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
      gitbash: 'Git Bash',
      wsl: 'WSL',
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
(function () {
'use strict';

// 整个插件包在 IIFE 里：宿主会把多个插件的 client.js 直接拼进同一个 combo 脚本，
// 顶层函数名（例如 `build`）会互相覆盖；envhub 也有 `function build()`，曾导致我们的
// factory 实际调用到 envhub 的 build、本插件永不 apply。IIFE 隔离所有顶层声明。

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
      // 关键防线：factory 永不抛出；但激活失败必须留下可诊断的错误。
      try { console.error('[activity-heat] factory failed, plugin disabled:', error && (error.stack || error.message)); } catch (ignored) {}
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

  // 官方规范（practices.md §UI）：不要 require 任何 Harness Client 包
  // （如 @deepseek-ai/dsh-client-ui-primitives）——它们无预警变更，且抛错会把整个
  // slot 条目打空。全部 UI 改用本地组件 + 宿主主题令牌（--dsw-alias-*）。

  var MINUTE = 60000;
  var HOUR = 60 * MINUTE;
  var DAY = 24 * HOUR;

  /** 字典命名空间，与 package name 一致（宿主按此注册与绑定）。 */
  var NS = '@local/activity-heat';
  /** 右侧栏 tab 类型身份：类型 id 与 kind 都由本插件拥有。 */
  var RIGHTBAR_ID = '@local/activity-heat/active';
  var RIGHTBAR_KIND = 'activity-heat.active';

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
  /** 三区间热度色：亮蓝（4/5 温热·炽热）、深灰（3 活跃）、浅灰（0/1/2 冷却·陈旧·近期）。 */
  var HEAT_LIGHT = 'color-mix(in srgb, var(--dsw-alias-label-tertiary, #7f8287) 58%, transparent)';
  var HEAT_DEEP = 'color-mix(in srgb, var(--dsw-alias-label-secondary, #545557) 92%, transparent)';
  var HEAT_BLUE = 'var(--color-blue-500, #3b82f6)';
  var HEAT_TONES = [
    HEAT_LIGHT, HEAT_LIGHT, HEAT_LIGHT,
    HEAT_DEEP,
    HEAT_BLUE, HEAT_BLUE,
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

  function heatToneOf(level) {
    return HEAT_TONES[Math.max(0, Math.min(5, level || 0))];
  }

  /** DeepSeek 鲸鱼循环动画：由录屏对齐的 41 帧无缝循环 GIF（透明背景、头朝左、48px 高）；运行中卡片底部游动用。 */
  var WHALE_GIF = 'data:image/gif;base64,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';

  var LEVELS = [
    { max: 10 * MINUTE, level: 5 },
    { max: HOUR, level: 4 },
    { max: 6 * HOUR, level: 3 },
    { max: DAY, level: 2 },
    { max: 7 * DAY, level: 1 },
  ];

  var UI = {
    padX: 18,
    radius: 12,
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
    whale: 'ah-whale',
    cardGroup: 'ah-card--group',
    chip: 'ah-chip',
    wsTag: 'ah-ws-tag',
    wsTagInner: 'ah-ws-tag-inner',
    wsTagText: 'ah-ws-tag-text',
    meterTrack: 'ah-meter-track',
    meterFill: 'ah-meter-fill',
    waterV: 'ah-water-v',
    waterHead: 'ah-water-head',
    vpipe: 'ah-vpipe',
    vpipeFill: 'ah-vpipe-fill',
    vpipeHead: 'ah-vpipe-head',
    vpipeBulb: 'ah-vpipe-bulb',
    miniTrack: 'ah-mini-track',
    miniFill: 'ah-mini-fill',
    tab: 'ah-tab',
    seg: 'ah-seg',
    count: 'ah-count',
    badge: 'ah-current-badge',
    statusDot: 'ah-status-dot',
    statusTag: 'ah-status-tag',
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
    primaryRow: 'ah-primary-row',
    secondaryRow: 'ah-secondary-row',
    filterScroll: 'ah-filter-scroll',
    countGroup: 'ah-count-group',
    countLabel: 'ah-count-label',
    segGroup: 'ah-seg-group',
    tabCount: 'ah-tab-count',
    menu: 'ah-menu',
    menuItem: 'ah-menu-item',
    menuLabel: 'ah-menu-label',
    menuHint: 'ah-menu-hint',
    menuArrow: 'ah-menu-arrow',
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
   * - 运行中卡片（ah-card--running）同样走玻璃；跑马灯光带用环形 mask 限制在边框，不会透进卡内；
   * - 入场动画只动 opacity，不动 transform，避免盖掉悬停的 translateY。
   */
  var AH_CSS = [
    /* ---------- 局部令牌 ---------- */
    '.ah-shell{',
    '--ah-hi:rgba(255,255,255,.10);',
    '--ah-blur:blur(16px) saturate(130%);',
    '--ah-ease:var(--ds-ease-in-out, cubic-bezier(.4,0,.2,1));',
    /* 按用途分曲线：入场 ease-out / 退场 ease-in / 原地 ease-in-out / 小确认 overshoot */
    '--ah-ease-out:cubic-bezier(.2,.8,.2,1);',
    '--ah-ease-in:cubic-bezier(.4,0,1,1);',
    '--ah-ease-overshoot:cubic-bezier(.34,1.56,.64,1);',
    'position:relative;isolation:isolate;overflow:hidden;',
    'display:flex;flex-direction:column;flex:1 1 auto;height:100%;min-height:100%;box-sizing:border-box;',
    'background-color:var(--dsw-alias-bg-base, #fff);',
    'animation:ah-shell-in 200ms var(--ah-ease-out) both;',
    '}',
    'body[data-ds-dark-theme] .ah-shell{--ah-hi:rgba(255,255,255,.06);background-color:var(--dsw-alias-bg-base, #1c1c1e);}',

    /* 背景层(z-index:-2) / 中间层(z-index:-1)：都在内容之下、底色之上，不挡交互 */
    '.ah-threads-bg{position:absolute;inset:0;z-index:-2;overflow:hidden;pointer-events:none;}',
    '.ah-threads-bg pro-threads{display:block;width:100%;height:100%;pointer-events:none;background:#f7f8fa !important;}',
    '.ah-scrim{position:absolute;inset:0;z-index:-1;pointer-events:none;}',
    'body[data-ds-dark-theme] .ah-threads-bg{opacity:.6;}',

    '@keyframes ah-shell-in{from{opacity:0}to{opacity:1}}',

    /* ---------- 卡片：液态玻璃表面 ----------
       分层：① 体积投影 ② 背景模糊+提亮(backdrop-filter) ③ 半透明着色(--ah-tint)
       ④ 边缘光：左上 / 右下 / 内侧缩进 ⑤ 文字着色(mix-blend-mode) ⑥ SVG 折射(JS 注入 url())
       明暗由 JS 采样真实背景亮度切 class；此处是纯 CSS 兜底（无 JS 也有玻璃）。
       颜色只走 var()/color-mix，硬编码色值仅作 fallback。 */
    /* @property：注册材质颜色令牌，让明暗 / hover 切换平滑过渡（不支持则被忽略） */
    '@property --ah-tint{syntax:"<color>";inherits:false;initial-value:transparent;}',
    '@property --ah-tint-hover{syntax:"<color>";inherits:false;initial-value:transparent;}',
    '@property --ah-ink{syntax:"<color>";inherits:true;initial-value:#14141a;}',
    '@property --ah-edge-tl{syntax:"<color>";inherits:false;initial-value:rgba(255,255,255,.6);}',
    '@property --ah-edge-br{syntax:"<color>";inherits:false;initial-value:rgba(0,0,0,.2);}',
    '.ah-card{',
    '--ah-glass-white:var(--dsw-alias-bg-base, #fff);',
    '--ah-glass-ink:#14141a;',
    /* 墨色（ink）：默认跟随主题；浅/深玻璃各自覆盖，让文字带背景色又保证可读 */
    '--ah-ink:var(--dsw-alias-label-primary);',
    '--ah-ink-soft:var(--dsw-alias-label-secondary);',
    '--ah-ink-faint:var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));',
    '--ah-tint:color-mix(in srgb, var(--ah-glass-white, #fff) 16%, transparent);',
    '--ah-tint-hover:color-mix(in srgb, var(--ah-glass-white, #fff) 30%, transparent);',
    '--ah-glass-filter:blur(2px) saturate(180%) brightness(1.06);',
    '--ah-edge-tl:color-mix(in srgb, #fff 72%, transparent);',
    '--ah-edge-br:color-mix(in srgb, #000 14%, transparent);',
    '--ah-edge-in:color-mix(in srgb, var(--ah-glass-white, #fff) 12%, transparent);',
    'position:relative;z-index:1;overflow:hidden;',
    'border:1px solid color-mix(in srgb, var(--dsw-alias-border-l1, rgba(127,127,127,.30)) 92%, transparent);',
    'background-color:var(--ah-tint);',
    'background-image:none;',
    'color:var(--ah-ink);',
    'box-shadow:',
    '0 10px 26px -12px color-mix(in srgb, #000 42%, transparent),',
    '0 2px 6px color-mix(in srgb, #000 10%, transparent),',
    'inset 1px 1px 0 var(--ah-edge-tl),',
    'inset -1px -1px 0 var(--ah-edge-br),',
    'inset 0 0 0 1px var(--ah-edge-in),',
    'inset 0 1px 16px color-mix(in srgb, var(--ah-glass-white, #fff) 7%, transparent);',
    'transition:border-color 200ms var(--ah-ease), box-shadow 240ms var(--ah-ease),',
    'background-color 220ms var(--ah-ease), transform 180ms var(--ah-ease);',
    'animation:ah-card-in 240ms var(--ah-ease-out, cubic-bezier(.2,.8,.2,1)) both;',
    '}',
    '.ah-card>*{position:relative;z-index:1;}',
    /* 深色主题（暗背景）兜底 → 深色玻璃（亮度 0.8，边缘光约三分之一强度，描边更深） */
    'body[data-ds-dark-theme] .ah-card{',
    '--ah-tint:color-mix(in srgb, var(--ah-glass-ink, #14141a) 30%, transparent);',
    '--ah-tint-hover:color-mix(in srgb, var(--ah-glass-ink, #14141a) 44%, transparent);',
    '--ah-glass-filter:blur(2px) saturate(160%) brightness(.8);',
    '--ah-edge-tl:color-mix(in srgb, #fff 30%, transparent);',
    '--ah-edge-br:color-mix(in srgb, #000 30%, transparent);',
    '--ah-ink:#f5f5f7;',
    '--ah-ink-soft:color-mix(in srgb,#f5f5f7 80%,transparent);',
    '--ah-ink-faint:color-mix(in srgb,#f5f5f7 62%,transparent);',
    '}',
    /* JS 采样后按真实背景亮度覆盖（优先于主题兜底） */
    '.ah-card--glass-light{',
    '--ah-tint:color-mix(in srgb, var(--ah-glass-white, #fff) 16%, transparent);',
    '--ah-tint-hover:color-mix(in srgb, var(--ah-glass-white, #fff) 30%, transparent);',
    '--ah-glass-filter:blur(2px) saturate(180%) brightness(1.06);',
    '--ah-edge-tl:color-mix(in srgb, #fff 72%, transparent);',
    '--ah-edge-br:color-mix(in srgb, #000 14%, transparent);',
    '--ah-ink:#14141a;',
    '--ah-ink-soft:color-mix(in srgb,#14141a 76%,transparent);',
    '--ah-ink-faint:color-mix(in srgb,#14141a 58%,transparent);',
    '}',
    '.ah-card--glass-dark{',
    '--ah-tint:color-mix(in srgb, var(--ah-glass-ink, #14141a) 32%, transparent);',
    '--ah-tint-hover:color-mix(in srgb, var(--ah-glass-ink, #14141a) 46%, transparent);',
    '--ah-glass-filter:blur(2px) saturate(160%) brightness(.8);',
    '--ah-edge-tl:color-mix(in srgb, #fff 30%, transparent);',
    '--ah-edge-br:color-mix(in srgb, #000 30%, transparent);',
    '--ah-ink:#f5f5f7;',
    '--ah-ink-soft:color-mix(in srgb,#f5f5f7 80%,transparent);',
    '--ah-ink-faint:color-mix(in srgb,#f5f5f7 62%,transparent);',
    '}',
    /* 文字着色：浅色玻璃用正片叠底（multiply）；深色玻璃用叠加提亮（plus-lighter） */
    '.ah-card--glass-light .ah-card-title,.ah-card--glass-light .ah-card-sub,',
    '.ah-card--glass-light .ah-card-meta,.ah-card--glass-light .ah-card-time{mix-blend-mode:multiply;}',
    '.ah-card--glass-dark .ah-card-title,.ah-card--glass-dark .ah-card-sub,',
    '.ah-card--glass-dark .ah-card-meta,.ah-card--glass-dark .ah-card-time{mix-blend-mode:plus-lighter;}',
    /* 顶部受光：静态一层，非扫光（VETO：禁止悬浮扫光） */
    '.ah-card::before{',
    'content:"";position:absolute;inset:0;border-radius:inherit;z-index:0;pointer-events:none;',
    'background-image:linear-gradient(180deg, var(--ah-edge-tl, rgba(255,255,255,.5)), transparent 42%);',
    'opacity:.35;transition:opacity 220ms var(--ah-ease);',
    '}',
    '@media (hover: hover){',
    '.ah-card:hover{border-color:color-mix(in srgb, var(--color-blue-500, #3b82f6) 26%, var(--dsw-alias-border-l1, rgba(127,127,127,.18)));',
    'background-color:var(--ah-tint-hover, var(--ah-tint));',
    'box-shadow:0 8px 22px -16px color-mix(in srgb, #000 34%, transparent),0 2px 6px color-mix(in srgb, #000 10%, transparent),inset 1px 1px 0 var(--ah-edge-tl),inset -1px -1px 0 var(--ah-edge-br),inset 0 0 0 1px var(--ah-edge-in);',
    'transform:translateY(-1px);-webkit-backdrop-filter:var(--ah-glass-filter);backdrop-filter:var(--ah-glass-filter);}',
    '.ah-card:hover::before{opacity:.55;}',
    /* 悬停的单张卡才启用「模糊 + 边缘折射」，静态列表零 backdrop 开销（滚动不卡） */
    '.ah-card--refract:hover{-webkit-backdrop-filter:var(--ah-glass-filter);backdrop-filter:var(--ah-glass-filter) var(--ah-lg-url, blur(0px));}',
    '.ah-card:active{transform:translateY(0) scale(.995);}',
    '}',
    '.ah-card:focus-visible{outline:2px solid var(--dsw-focus-ring-color, var(--color-blue-500, #3b82f6));outline-offset:1px;}',
    '@keyframes ah-card-in{from{opacity:0}to{opacity:1}}',
    /* 连续圆角（超椭圆）渐进增强：Chrome/Edge 139+ 生效，其它浏览器忽略并保留普通圆角 */
    '@supports (corner-shape: superellipse(1.25)){',
    '.ah-card,.ah-popover,.ah-menu,.ah-dialog,.ah-toast,.ah-seg,.ah-count,.ah-chip,.ah-menu-item,.ah-dialog-input,.ah-dialog-button,.ah-current-badge{corner-shape:superellipse(1.25);}',
    '.ah-tab,.ah-meter-track,.ah-meter-fill,.ah-water-head,.ah-water-head::after,.ah-mini-track,.ah-mini-fill,.ah-status-dot{corner-shape:round;}',
    '}',

    /* 运行中卡片：也走液态玻璃（跑马灯光带已用环形遮罩限制在边框，不会透进卡内） */
    '.ah-card--running{',
    'background-color:var(--ah-tint);',
    'background-image:none;border:none;box-shadow:none;',
    'animation:none;transition:none;transform:none;',
    '}',
    '.ah-card--running::before{display:none;}',
    '.ah-card--running:hover{transform:none;box-shadow:none;}',
    /* 无障碍回退：减少透明 / 强制颜色时，玻璃退化为同色不透明实底 */
    '@media (prefers-reduced-transparency: reduce){',
    '.ah-card{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;}',
    '.ah-card--glass-light{background-color:color-mix(in srgb, var(--ah-glass-white, #fff) 94%, transparent);}',
    '.ah-card--glass-dark{background-color:color-mix(in srgb, var(--ah-glass-ink, #14141a) 94%, transparent);}',
    'body[data-ds-dark-theme] .ah-card{background-color:color-mix(in srgb, var(--ah-glass-ink, #14141a) 94%, transparent);}',
    '}',
    '@media (forced-colors: active){',
    '.ah-card{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;border:1px solid ButtonBorder;background-color:Canvas;color:CanvasText;}',
    '.ah-card::before{display:none;}',
    '.ah-card--glass-light,.ah-card--glass-dark{background-color:Canvas;color:CanvasText;}',
    '}',
    /* 运行中卡片底部：DeepSeek 鲸鱼群——沿底边左右往复游动，靠划出画面外进出，每分钟多一只 */
    '.ah-whale{position:absolute;bottom:-6px;left:-40px;width:30px;height:26px;z-index:3;pointer-events:none;',
    'will-change:left;animation-iteration-count:infinite;animation-timing-function:linear;animation-fill-mode:both;}',
    '.ah-whale img{display:block;width:100%;height:100%;object-fit:contain;}',
    /* 左右往复：靠「划出画面外」进出（不做透明度渐变）；到端点外侧瞬间转身(scaleX)再反向游回 */
    '@keyframes ah-whale-pingpong{',
    '0%{left:-40px;transform:scaleX(-1)}',
    '42%{left:calc(100% + 6px);transform:scaleX(-1)}',
    '42.001%{left:calc(100% + 6px);transform:scaleX(1)}',
    '92%{left:-40px;transform:scaleX(1)}',
    '92.001%{left:-40px;transform:scaleX(-1)}',
    '100%{left:-40px;transform:scaleX(-1)}}',

    /* ---------- 热度条：管道水流 + 挡板涌浪（无刻度） ---------- */
    /* 管道（轨道）：上下压暗、中间提亮，像一根圆柱管 */
    '.ah-meter-track{position:relative;display:block;border-radius:999px;overflow:hidden;flex:none;',
    'background:linear-gradient(180deg, rgba(0,0,0,.10), rgba(255,255,255,.10) 30%, rgba(255,255,255,.06) 55%, rgba(0,0,0,.13)), color-mix(in srgb, var(--dsw-alias-border-l1, rgba(127,127,127,.22)) 56%, transparent);',
    'box-shadow:inset 0 1.5px 3px rgba(0,0,0,.18), inset 0 -1.5px 3px rgba(0,0,0,.12), inset 0 0 0 .5px rgba(255,255,255,.24);}',
    '.ah-meter-track::before{content:"";position:absolute;z-index:3;left:6px;right:6px;top:2px;height:2px;border-radius:999px;',
    'background:linear-gradient(90deg,transparent,rgba(255,255,255,.16),transparent);pointer-events:none;}',
    /* 水体：圆柱截面（中间亮、上下暗），并整体轻微晃荡 */
    '.ah-meter-fill{position:absolute;left:0;top:0;bottom:0;border-radius:999px;overflow:hidden;',
    'background-image:linear-gradient(180deg, color-mix(in srgb, currentColor 76%, #000) 0%, color-mix(in srgb, currentColor 70%, #fff) 34%, color-mix(in srgb, currentColor 92%, #fff) 50%, color-mix(in srgb, currentColor 70%, #fff) 66%, color-mix(in srgb, currentColor 80%, #000) 100%);',
    'background-size:100% 220%;background-position:0 0;',
    'box-shadow:inset 0 1px 0 rgba(255,255,255,.22), inset 0 -1px 0 rgba(0,0,0,.18);',
    'animation:ah-water-sloshl 2.6s ease-in-out infinite;',
    'transition:width 260ms var(--ah-ease), opacity 200ms var(--ah-ease), color 260ms var(--ah-ease), filter 220ms var(--ah-ease);}',
    '@keyframes ah-water-sloshl{0%,100%{background-position:0 0%}50%{background-position:0 35%}}',
    /* 水流：焦散集中在管腔中部偏上，整体前移（不是尖锐条纹） */
    '.ah-meter-fill::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:1;',
    'background-image:radial-gradient(34% 55% at 26% 50%, rgba(255,255,255,.42), transparent 64%),',
    'radial-gradient(30% 48% at 58% 48%, rgba(255,255,255,.28), transparent 62%),',
    'radial-gradient(26% 42% at 84% 52%, rgba(255,255,255,.20), transparent 62%);',
    'background-size:240% 100%;animation:ah-water-flow 1.6s linear infinite;}',
    /* 水面微光：放在管腔偏上的位置，水平居中起伏 */
    '.ah-meter-fill::after{content:"";position:absolute;left:0;right:0;top:32%;height:2px;pointer-events:none;opacity:.9;',
    'background-image:linear-gradient(90deg, transparent, rgba(255,255,255,.85) 42%, transparent);',
    'background-size:55% 100%;background-repeat:no-repeat;animation:ah-water-surface 2.2s ease-in-out infinite;}',
    '@keyframes ah-water-flow{from{background-position:0% 0}to{background-position:-140% 0}}',
    '@keyframes ah-water-surface{0%{background-position:-60% 0}50%{background-position:80% 0}100%{background-position:-60% 0}}',
    /* 挡板处水涌：上下留边的一道居中亮水墙，带辉光与周期涟漪 */
    '.ah-water-head{position:absolute;top:2px;bottom:2px;right:0;width:min(24%,38px);pointer-events:none;z-index:2;',
    'border-radius:0 999px 999px 0;transform-origin:right center;',
    'background-image:linear-gradient(90deg, transparent 0%, rgba(255,255,255,.06) 24%, rgba(255,255,255,.30) 62%, rgba(255,255,255,.80) 100%);',
    'box-shadow:inset -2px 0 0 rgba(255,255,255,.85), 0 0 8px color-mix(in srgb, currentColor 55%, transparent);',
    'animation:ah-water-surge 1.4s ease-in-out infinite;}',
    '.ah-water-head::after{content:"";position:absolute;right:-2px;top:50%;width:10px;height:10px;margin-top:-5px;border-radius:50%;',
    'border:1.5px solid rgba(255,255,255,.55);pointer-events:none;',
    'animation:ah-water-ripple 1.6s ease-out infinite;}',
    '@keyframes ah-water-surge{0%,100%{transform:scaleX(.90) scaleY(.85);opacity:.55}50%{transform:scaleX(1.04) scaleY(1.03);opacity:1}}',
    '@keyframes ah-water-ripple{0%{transform:scale(.30);opacity:.90}70%{transform:scale(1.5);opacity:0}100%{opacity:0}}',
    /* 竖向热度条：水在细管里向上涌，顶端亮水头 */
    '.ah-water-v{position:relative;overflow:hidden;}',
    '.ah-water-v::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:.85;',
    'background-image:radial-gradient(120% 55% at 30% 12%, rgba(255,255,255,.32), transparent 60%),',
    'radial-gradient(120% 45% at 70% 40%, rgba(255,255,255,.20), transparent 60%);',
    'background-size:100% 200%;animation:ah-water-flow-y 2s linear infinite;}',
    '.ah-water-v::after{content:"";position:absolute;left:0;right:0;top:0;height:3px;border-radius:999px 999px 0 0;pointer-events:none;',
    'background-image:linear-gradient(180deg, rgba(255,255,255,.95), rgba(255,255,255,.10));',
    'box-shadow:0 0 7px color-mix(in srgb, currentColor 60%, transparent);',
    'animation:ah-water-surge-y 1.4s ease-in-out infinite;}',
    '@keyframes ah-water-flow-y{from{background-position:0 0}to{background-position:0 -140%}}',
    '@keyframes ah-water-surge-y{0%,100%{height:2px;opacity:.55}50%{height:7px;opacity:1}}',
    /* 竖向玻璃温度计：玻璃管 + 液柱（凹弯月面）+ 底部球泡，带克制的液体动效（不画刻度） */
    '.ah-vpipe{position:relative;display:block;border-radius:999px;overflow:visible;flex:none;',
    /* 管腔：极淡中性底，玻璃壁厚靠描边与反光体现（低档也整根可见，§2 红线2） */
    'background:linear-gradient(180deg, rgba(255,255,255,.14), rgba(255,255,255,0) 26%), color-mix(in srgb, var(--dsw-alias-border-l1, rgba(127,127,127,.30)) 30%, var(--dsw-alias-bg-base, #fff));',
    'box-shadow:inset 0 0 0 .5px rgba(255,255,255,.5), inset 1.2px 0 1.6px rgba(0,0,0,.10), inset -1.2px 0 1.6px rgba(0,0,0,.12), 0 0 0 .75px color-mix(in srgb, var(--dsw-alias-border-l1, #7f8287) 66%, transparent);}',
    /* 玻璃反光（在液体之上）：左强高光 + 右侧次高光 + 顶部圆头受光 */
    '.ah-vpipe::before{content:"";position:absolute;z-index:5;left:0;right:0;top:0;bottom:0;border-radius:999px;pointer-events:none;',
    'background:radial-gradient(70% 16% at 50% 5%, rgba(255,255,255,.62), transparent 72%),linear-gradient(90deg, rgba(255,255,255,.6) 0%, rgba(255,255,255,.14) 12%, rgba(255,255,255,0) 36%, rgba(0,0,0,.05) 56%, rgba(255,255,255,.05) 80%, rgba(255,255,255,.42) 93%, rgba(255,255,255,.12) 100%);}',
    /* 液柱：圆柱截面（左右暗、中偏亮），顶部近平（液面另画），底部圆 */
    '.ah-vpipe-fill{position:absolute;left:1px;right:1px;bottom:0;border-radius:2px 2px 999px 999px;overflow:hidden;',
    'background-image:linear-gradient(90deg, color-mix(in srgb, currentColor 76%, #000) 0%, color-mix(in srgb, currentColor 86%, #fff) 26%, currentColor 52%, color-mix(in srgb, currentColor 84%, #fff) 78%, color-mix(in srgb, currentColor 82%, #000) 100%);',
    'background-size:100% 100%;',
    'box-shadow:inset 0 3px 4px -2px rgba(0,0,0,.22), inset 0 0 0 .5px rgba(255,255,255,.16);',
    'transition:height 380ms cubic-bezier(.22,1,.36,1);}',
    /* 液体里的玻璃反光：一条左偏竖光 + 极缓的上下流动（拟物：液体折射） */
    '.ah-vpipe-fill::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:.85;',
    'background-image:linear-gradient(90deg, transparent 10%, rgba(255,255,255,.42) 22%, rgba(255,255,255,.05) 34%, transparent 46%),linear-gradient(180deg, rgba(255,255,255,.12), transparent 40%, rgba(0,0,0,.10));',
    'background-size:100% 220%;animation:ah-vpipe-liquid 4.2s ease-in-out infinite;}',
    '@keyframes ah-vpipe-liquid{0%,100%{background-position:0 0}50%{background-position:0 12%}}',
    /* 液面：柔和的凹月面——发丝亮弧 + 下方凹陷暗弧，上方保留空气，不用整块亮带 */
    '.ah-vpipe-head{position:absolute;left:-1px;right:-1px;top:0;height:4px;pointer-events:none;z-index:3;',
    'transform-origin:center top;animation:ah-vpipe-breathe 3.4s ease-in-out infinite;}',
    /* 凹陷暗弧：液面下方的内部阴影 */
    '.ah-vpipe-head::before{content:"";position:absolute;left:0;right:0;top:1.5px;height:3px;border-radius:0 0 50% 50% / 0 0 100% 100%;',
    'box-shadow:inset 0 -1.2px 2.4px rgba(0,0,0,.24);opacity:.6;}',
    /* 液面反光：发丝级亮弧，两端淡出、轻微模糊 */
    '.ah-vpipe-head::after{content:"";position:absolute;left:0;right:0;top:-.5px;height:3px;pointer-events:none;',
    'border-bottom:1px solid rgba(255,255,255,.70);border-radius:0 0 50% 50% / 0 0 100% 100%;',
    'filter:blur(.35px);opacity:.95;}',
    '@keyframes ah-vpipe-breathe{0%,100%{transform:translateY(-.4px) scaleY(.94);opacity:.92}50%{transform:translateY(.4px) scaleY(1);opacity:1}}',
    /* 底部球泡：玻璃球里的液体——小面积柔和反射 + 沿左上边缘的弧光 + fresnel 暗边 */
    '.ah-vpipe-bulb{position:absolute;left:50%;bottom:-2px;width:15px;height:15px;margin-left:-7.5px;z-index:6;pointer-events:none;',
    'border-radius:50%;corner-shape:round;',
    'background-image:radial-gradient(circle at 33% 27%, color-mix(in srgb, currentColor 28%, #fff) 0%, color-mix(in srgb, currentColor 72%, #fff) 10%, currentColor 38%, color-mix(in srgb, currentColor 80%, #000) 82%, color-mix(in srgb, currentColor 54%, #000) 100%);',
    'box-shadow:inset 0 0 2.6px .7px rgba(0,0,0,.28), inset 0 1px 1.2px rgba(255,255,255,.5), inset -1.4px -1.6px 2.4px rgba(255,255,255,.22), inset 0 -1px 1.4px rgba(255,255,255,.14), 0 0 0 .5px rgba(0,0,0,.18), 0 1px 2px rgba(0,0,0,.20);',
    'animation:ah-vpipe-bulbglow 4.6s ease-in-out infinite;}',
    /* 左上弧形反光：沿边缘的一条亮弧，而不是一团白斑 */
    '.ah-vpipe-bulb::after{content:"";position:absolute;left:16%;top:12%;width:40%;height:34%;border-radius:50%;pointer-events:none;transform:rotate(-24deg);',
    'background:radial-gradient(closest-side at 54% 40%, rgba(255,255,255,.82), rgba(255,255,255,.22) 56%, rgba(255,255,255,0) 82%);}',
    /* 底部内反光（透光感） */
    '.ah-vpipe-bulb::before{content:"";position:absolute;left:22%;right:22%;bottom:12%;height:22%;border-radius:50%;pointer-events:none;',
    'background:radial-gradient(closest-side, rgba(255,255,255,.42), rgba(255,255,255,0));}',
    '@keyframes ah-vpipe-bulbglow{0%,100%{filter:brightness(1)}50%{filter:brightness(1.06)}}',
    /* 工作区段（三段式最左）：整卡等高、加宽；图标 + 名，与正文用发丝线分隔（无独立底色，融入卡片主体） */
    '.ah-ws-tag{display:flex;flex-direction:column;justify-content:center;align-items:center;flex:none;align-self:stretch;width:clamp(104px, 16%, 196px);box-sizing:border-box;',
    'padding:0 12px 0 12px;',
    'border-right:1px solid color-mix(in srgb, var(--dsw-alias-border-l1, rgba(127,127,127,.22)) 55%, transparent);',
    'background:transparent;}',
    '.ah-ws-tag-inner{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;min-width:0;color:var(--dsw-alias-label-secondary);}',
    '.ah-ws-tag-inner svg{flex:none;opacity:.7;}',
    /* 名字单行省略（太长显示省略号，悬停 title 看全名） */
    '.ah-ws-tag-text{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.82em;line-height:20px;font-weight:500;color:var(--dsw-alias-label-secondary);}',
    /* 无工作区：保留同宽与分隔线 */
    '.ah-ws-tag--empty{background:transparent;}',
    '.ah-mini-track{position:relative;display:inline-block;border-radius:999px;overflow:hidden;flex:none;vertical-align:middle;',
    'background:color-mix(in srgb, var(--dsw-alias-border-l1, rgba(127,127,127,.22)) 58%, transparent);',
    'box-shadow:inset 0 1px 1px rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,.20);}',
    '.ah-mini-fill{position:absolute;left:0;top:0;bottom:0;border-radius:999px;opacity:.92;',
    'background-image:linear-gradient(180deg, rgba(255,255,255,.40), rgba(255,255,255,0) 55%, rgba(0,0,0,.08));',
    'box-shadow:inset 0 1px 0 rgba(255,255,255,.40);}',
    '.ah-card:hover .ah-meter-fill{box-shadow:inset 0 1px 0 rgba(255,255,255,.28), 0 0 10px color-mix(in srgb, var(--color-blue-500, #3b82f6) 42%, transparent);}',

    /* ---------- 顶部：筛选 tab / 分段 / 数量 ---------- */
    /* ---------- 顶部工具栏：统一「玻璃表面」语言 ----------
     * 三段（对象 / 范围 / 数量）与筛选 chip 共用同一套控件表面：
     *   - 未选中：半透明玻璃底 70% + 发丝描边 + 顶部 1px 高光（与卡片同源）
     *   - 选中：同一块玻璃 + 蓝色描边与淡蓝底（不换风格，只强化）
     * 只有强调强度不同（对象 > 筛选 > 范围/数量），不出现“实心白块 / 裸文字 / 实蓝胶囊”三种材质。
     */
    '.ah-toolbar{position:relative;}',
    '.ah-primary-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;row-gap:10px;',
    'padding:14px 18px 0;}',
    /* 分段组：只是一条"轨道缝"，不再用灰底块；成员自己就是玻璃胶囊 */
    '.ah-seg-group{display:inline-flex;align-items:center;gap:4px;flex:none;}',
    /* 公用的玻璃控件表面（对象 / 范围 / 数量 / 筛选 都走它） */
    '.ah-seg,.ah-count,.ah-tab{position:relative;border:1px solid color-mix(in srgb, var(--dsw-alias-border-l1, rgba(127,127,127,.22)) 70%, transparent);',
    'border-radius:8px;background-color:color-mix(in srgb, var(--dsw-specific-menu, rgba(127,127,127,.10)) 70%, var(--dsw-alias-bg-base, #fff));',
    'background-image:linear-gradient(135deg, rgba(255,255,255,.14), transparent 62%);',
    'box-shadow:inset 0 1px 0 rgba(255,255,255,.22);',
    'font:inherit;font-weight:500;color:var(--dsw-alias-label-secondary);cursor:pointer;white-space:nowrap;',
    'transition:background-color 170ms var(--ah-ease), color 170ms var(--ah-ease), border-color 170ms var(--ah-ease), box-shadow 170ms var(--ah-ease);}',
    /* 选中：同一玻璃 + 蓝边/淡蓝底；对象层最重，范围/数量更轻，筛选 chip 介于其间 */
    '.ah-seg[data-active="true"]{color:var(--color-blue-500, #3b82f6);font-weight:600;',
    'background-color:color-mix(in srgb, var(--color-blue-500, #3b82f6) 12%, transparent);',
    'border-color:color-mix(in srgb, var(--color-blue-500, #3b82f6) 42%, transparent);',
    'box-shadow:inset 0 1px 0 rgba(255,255,255,.26), 0 1px 2px rgba(0,0,0,.05);}',
    '.ah-count[data-active="true"]{color:var(--color-blue-500, #3b82f6);font-weight:600;',
    'background-color:color-mix(in srgb, var(--color-blue-500, #3b82f6) 10%, transparent);',
    'border-color:color-mix(in srgb, var(--color-blue-500, #3b82f6) 34%, transparent);}',
    '@media (hover: hover){',
    '.ah-seg[data-active="false"]:hover,.ah-count[data-active="false"]:hover,.ah-tab[data-active="false"]:hover{',
    'color:var(--dsw-alias-label-primary);',
    'border-color:color-mix(in srgb, var(--color-blue-500, #3b82f6) 26%, transparent);',
    'background-color:color-mix(in srgb, var(--color-blue-500, #3b82f6) 7%, transparent);}',
    '}',
    /* 筛选 chip：同一玻璃表面，圆角更圆、带计数徽标 */
    '.ah-secondary-row{display:flex;align-items:center;gap:6px;padding:9px 18px 10px;',
    'border-bottom:1px solid color-mix(in srgb, var(--dsw-alias-border-l1, rgba(127,127,127,.18)) 55%, transparent);}',
    '.ah-filter-scroll{display:flex;align-items:center;gap:6px;flex:1 1 auto;min-width:0;overflow-x:auto;',
    'scrollbar-width:none;padding-bottom:2px;}',
    '.ah-filter-scroll::-webkit-scrollbar{display:none;}',
    '.ah-tab{display:inline-flex;align-items:center;gap:6px;flex:none;border-radius:999px;}',
    '.ah-tab[data-active="true"]{color:var(--color-blue-500, #3b82f6);font-weight:600;',
    'background-color:color-mix(in srgb, var(--color-blue-500, #3b82f6) 12%, transparent);',
    'border-color:color-mix(in srgb, var(--color-blue-500, #3b82f6) 40%, transparent);',
    'box-shadow:inset 0 1px 0 rgba(255,255,255,.26), 0 1px 2px rgba(0,0,0,.05);}',
    '.ah-tab-count{font-size:0.82em;font-weight:500;opacity:.72;font-variant-numeric:tabular-nums;}',
    '.ah-tab[data-active="true"] .ah-tab-count{opacity:.9;}',
    '.ah-tab[data-empty="true"]{opacity:.55;}',
    '.ah-count-label{font-size:0.76em;color:var(--dsw-alias-label-tertiary);flex:none;}',
    /* 配置中心入口（顶部右侧齿轮） */
    '.ah-settings-btn{flex:none;display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;padding:0;margin-left:4px;border:1px solid transparent;border-radius:8px;background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer;font-size:14px;line-height:1;}',
    '@media (hover:hover){.ah-settings-btn:hover{background-color:color-mix(in srgb, var(--color-blue-500, #3b82f6) 8%, transparent);border-color:color-mix(in srgb, var(--color-blue-500, #3b82f6) 16%, transparent);color:var(--dsw-alias-label-primary);}}',
    '.ah-count-group,.ah-seg-group{display:inline-flex;align-items:center;gap:4px;flex:none;}',

    /* ---------- 徽章 / 芯片 ---------- */
    '.ah-current-badge{border:1px solid color-mix(in srgb, var(--color-blue-500, #3b82f6) 40%, transparent);',
    'background-color:color-mix(in srgb, var(--color-blue-500, #3b82f6) 10%, transparent);',
    'background-image:linear-gradient(135deg, rgba(255,255,255,.18), transparent 62%);',
    'box-shadow:inset 0 1px 0 rgba(255,255,255,.22);color:var(--color-blue-500, #3b82f6);animation:ah-badge-pop 240ms var(--ah-ease-overshoot, cubic-bezier(.34,1.56,.64,1)) both;}',
    '@keyframes ah-badge-pop{0%{opacity:0;transform:scale(.6)}60%{opacity:1;transform:scale(1.08)}100%{opacity:1;transform:scale(1)}}',
    /* 状态点 / 状态标签：颜色与形态交给宿主 StateDot，这里只提供布局 */
    '.ah-status-dot{display:inline-flex;align-items:center;justify-content:center;flex:none;border-radius:50%;corner-shape:round;}',
    '.ah-status-tag{display:inline-flex;align-items:center;justify-content:center;gap:5px;font-weight:700;line-height:16px;white-space:nowrap;flex:none;}',
    '.ah-chip{border:1px solid transparent;border-radius:8px;padding:1px 5px;margin:-1px -1px;',
    'color:var(--dsw-alias-label-secondary);',
    'transition:background-color 160ms var(--ah-ease), border-color 160ms var(--ah-ease), color 160ms var(--ah-ease);}',
    '@media (hover: hover){',
    '.ah-chip:hover{background-color:color-mix(in srgb, var(--color-blue-500, #3b82f6) 8%, transparent);',
    'border-color:color-mix(in srgb, var(--color-blue-500, #3b82f6) 16%, transparent);color:var(--dsw-alias-label-primary);}',
    '}',
    /* 按压手感（手册 001 子集）：控件 / 菜单 / 对话框 / 批量按钮按下整体下沉 1px（不新增变体、不用品牌色） */
    '.ah-seg:active,.ah-count:active,.ah-tab:active,.ah-menu-item:active,.ah-dialog-button:active,.ah-chip:active,.ah-batch button:active{transform:translateY(1px);}',

    /* ---------- 悬浮浮层 ---------- */
    '.ah-popover{',
    'border:.5px solid color-mix(in srgb, var(--dsw-alias-border-l1, rgba(127,127,127,.22)) 80%, transparent);',
    'border-radius:var(--dsw-radius-lg, 16px);',
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
    'animation:ah-menu-in 120ms var(--ah-ease-out, cubic-bezier(.2,.8,.2,1)) both;',
    '}',
    '@keyframes ah-menu-in{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:none}}',
    '.ah-menu-item{display:flex;align-items:center;gap:8px;width:100%;min-height:30px;padding:5px 9px;',
    'border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary);',
    'font:inherit;text-align:left;cursor:pointer;',
    'transition:background-color 120ms var(--ah-ease),color 120ms var(--ah-ease);}',
    '.ah-menu-item[data-active="true"]{background-color:color-mix(in srgb, var(--color-blue-500, #3b82f6) 10%, transparent);}',
    '.ah-menu-item[aria-disabled="true"]{opacity:.42;cursor:default;}',
    '.ah-menu-item[data-danger="true"]{color:color-mix(in srgb, var(--color-red-500, #ef4444) 78%, var(--dsw-alias-label-primary));}',
    '.ah-menu-item[data-danger="true"][data-active="true"]{background-color:color-mix(in srgb, var(--color-red-500, #ef4444) 12%, transparent);}',
    '.ah-menu-label{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.82em;line-height:20px;}',
    '.ah-menu-hint{flex:none;max-width:96px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;',
    'color:var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));font-size:.7em;}',
    '.ah-menu-arrow{flex:none;margin-left:4px;color:var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));font-size:1em;line-height:20px;}',
    '.ah-menu-sep{height:1px;margin:5px 7px;background:color-mix(in srgb, var(--dsw-alias-border-l1, rgba(127,127,127,.22)) 80%, transparent);}',
    '.ah-dialog{position:fixed;left:50%;top:18%;transform:translateX(-50%);z-index:2200;',
    'width:min(320px, calc(100vw - 32px));padding:14px 16px;',
    'border:.5px solid color-mix(in srgb, var(--dsw-alias-border-l1, rgba(127,127,127,.22)) 80%, transparent);',
    'border-radius:16px;',
    'background-color:color-mix(in srgb, var(--dsw-specific-menu, rgba(127,127,127,.12)) 92%, var(--dsw-alias-bg-base, #fff));',
    'backdrop-filter:var(--dsw-menu-backdrop-filter, blur(18px) saturate(140%));',
    '-webkit-backdrop-filter:var(--dsw-menu-backdrop-filter, blur(18px) saturate(140%));',
    'box-shadow:var(--dsw-shadow-lv3, 0 16px 40px rgba(0,0,0,.22)), inset 0 1px 0 rgba(255,255,255,.20);',
    'animation:ah-menu-in 140ms var(--ah-ease-out, cubic-bezier(.2,.8,.2,1)) both;}',
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
    'display:flex;align-items:center;gap:10px;max-width:min(420px, calc(100vw - 32px));padding:7px 12px;border-radius:12px;',
    'border:.5px solid color-mix(in srgb, var(--dsw-alias-border-l1, rgba(127,127,127,.22)) 80%, transparent);',
    'background-color:color-mix(in srgb, var(--dsw-specific-menu, rgba(127,127,127,.12)) 92%, var(--dsw-alias-bg-base, #fff));',
    'backdrop-filter:var(--dsw-menu-backdrop-filter, blur(18px) saturate(140%));',
    '-webkit-backdrop-filter:var(--dsw-menu-backdrop-filter, blur(18px) saturate(140%));',
    'box-shadow:var(--dsw-shadow-lv3, 0 12px 32px rgba(0,0,0,.18)), inset 0 1px 0 rgba(255,255,255,.20);',
    'color:var(--dsw-alias-label-primary);font-size:.78em;',
    'animation:ah-toast-in 160ms var(--ah-ease-out, cubic-bezier(.2,.8,.2,1)) both;}',
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

    /* ---------- 侧栏原生行菜单：插件动作对齐宿主原生行 ---------- */
    '.ah-side-action{color:var(--dsw-alias-label-primary, inherit);background:transparent;border:0;font:inherit;}',
    '.ah-side-action:hover{background:var(--dsw-alias-interactive-bg-hover, color-mix(in srgb, currentColor 8%, transparent));}',
    '.ah-side-action[aria-disabled="true"]{opacity:.45;cursor:default;}',
    '.ah-side-action--group{position:relative;margin-top:7px;}',
    '.ah-side-action--group::before{content:"";position:absolute;left:-8px;right:-8px;top:-4px;height:1px;',
    'background:color-mix(in srgb, var(--dsw-alias-border-l1, rgba(127,127,127,.18)) 72%, transparent);}',

    /* ---------- 减少动态 ---------- */
    '@media (prefers-reduced-motion: reduce){',
    '@keyframes ah-orbit{from{transform:rotate(0deg)}to{transform:rotate(0deg)}}',
    '@keyframes ah-breathe{0%,100%{box-shadow:none}50%{box-shadow:none}}',
    '@keyframes ah-dot-pulse{0%,100%{opacity:.8;transform:none;box-shadow:none}50%{opacity:1;transform:none;box-shadow:none}}',
    '@keyframes ah-done-breathe{0%,100%{opacity:1;transform:none}50%{opacity:1;transform:none}}',
    '.ah-shell,.ah-card,.ah-card::before,.ah-list-inner,.ah-empty,',
    '.ah-tab::after,.ah-seg,.ah-count::before,.ah-popover-inner,.ah-ring,.ah-strip-seg,.ah-heat-ring,.ah-meter-fill,.ah-meter-fill::before,.ah-meter-fill::after,.ah-water-head,.ah-water-head::after,.ah-water-v::before,.ah-water-v::after,.ah-vpipe-fill,.ah-vpipe-fill::before,.ah-vpipe-head,.ah-vpipe-bulb,.ah-whale,',
    '.ah-menu,.ah-dialog,.ah-toast,.ah-current-badge{',
    'animation:none!important;transition:none!important;}',
    '.ah-card:hover{transform:none;box-shadow:none;}',
    '.ah-whale{display:none!important;}',
    '[data-row-key^="session:"]::before{animation:none!important}',
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

  /* =========================================================================
   * ===== 液态玻璃材质引擎（浏览器侧增强） =====
   *
   * 纯 CSS 已经给了基础玻璃（体积投影 / 模糊提亮 / 着色 / 三重边缘光）。
   * 这里在浏览器里追加两件 CSS 做不到的事：
   *   1) 用 canvas 生成「边缘往内压」的位移贴图，注入 SVG feDisplacementMap：
   *        - 三通道各跑一次位移（R 比 B 多弯一点 = 色散），再 feBlend screen 合成；
   *        - 通过 backdrop-filter: url(#id) 折射真实背景（仅 Chrome/Edge 支持，探到才用）。
   *   2) 读取卡片背后多个采样点的平均亮度与复杂度：
   *        - 平均亮度决定浅色 / 深色玻璃；复杂度决定着色遮罩的透明度（6%~22% / 16%~38%）。
   *
   * 全部包在 try/catch 里：能力缺失（旧浏览器 / 测试沙箱无 DOM）时静默退回纯 CSS，
   * 绝不向 factory 抛错（否则整个插件不显示）。
   * ========================================================================= */
  var GLASS = {
    band: 44,            // 边宽 px
    edgeFactor: 1.1,     // 边缘偏移 = 1.1 × 边宽
    disp: 0.15,          // 色散 ±15%
    tintLight: [0.06, 0.22],
    tintDark: [0.16, 0.38],
    filterLight: 'blur(2px) saturate(180%) brightness(1.06)',
    filterDark: 'blur(2px) saturate(160%) brightness(.8)',
    support: null, defs: null, filters: {}, cards: [], ro: null, mo: null,
  };

  function glassSupportsUrl() {
    if (GLASS.support !== null) return GLASS.support;
    try {
      GLASS.support = !!(typeof CSS !== 'undefined' && CSS.supports
        && CSS.supports('backdrop-filter', 'url(#a)'));
    } catch (ignored) { GLASS.support = false; }
    return GLASS.support;
  }

  /** 生成位移贴图：中心中性(128)，四周一圈往里压，越靠边压得越狠、内侧平滑归零。
      R→X 位移，G→Y 位移。边宽 = max(4, min(44, 短边/3.5))；强度按【1 - d/rim】^2.6 非线性衰减。 */
  function glassBuildMap(w, h) {
    try {
      var cw = Math.max(2, Math.round(w)), ch = Math.max(2, Math.round(h));
      var canvas = document.createElement('canvas');
      canvas.width = cw; canvas.height = ch;
      var ctx = canvas.getContext && canvas.getContext('2d');
      if (!ctx) return null;
      var img = ctx.createImageData(cw, ch);
      var d = img.data;
      var rim = Math.max(4, Math.min(GLASS.band, Math.min(cw, ch) / 3.5));
      var fall = function (dist) {
        var t = 1 - dist / rim;
        return t > 0 ? Math.pow(t, 2.6) : 0;
      };
      for (var y = 0; y < ch; y += 1) {
        for (var x = 0; x < cw; x += 1) {
          var dl = x, dr = cw - 1 - x, dt = y, db = ch - 1 - y, ux = 0, uy = 0;
          if (dl < rim) ux += fall(dl);   // 左缘向右（朝内）
          if (dr < rim) ux -= fall(dr);   // 右缘向左
          if (dt < rim) uy += fall(dt);   // 上缘向下
          if (db < rim) uy -= fall(db);   // 下缘向上
          if (ux > 1) ux = 1; else if (ux < -1) ux = -1;
          if (uy > 1) uy = 1; else if (uy < -1) uy = -1;
          var i = (y * cw + x) * 4;
          d[i] = Math.round(128 + ux * 127);
          d[i + 1] = Math.round(128 + uy * 127);
          d[i + 2] = 128; d[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      return canvas.toDataURL('image/png');
    } catch (ignored) { return null; }
  }

  function glassEnsureDefs() {
    try {
      if (GLASS.defs && GLASS.defs.ownerDocument && GLASS.defs.ownerDocument.documentElement
        && GLASS.defs.ownerDocument.documentElement.contains(GLASS.defs)) {
        return GLASS.defs;
      }
    } catch (ignored) { /* 掉出 DOM，重建 */ }
    try {
      if (!document.body) return null;
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('id', 'ah-liquid-glass-defs');
      svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
      svg.setAttribute('aria-hidden', 'true');
      svg.style.cssText = 'position:absolute;left:-9999px;top:-9999px;pointer-events:none;';
      document.body.appendChild(svg);
      GLASS.defs = svg;
      return svg;
    } catch (ignored) { return null; }
  }

  /** 按卡片尺寸取/建一个 SVG filter（同尺寸共用），返回 filter id。 */
  function glassEnsureFilter(w, h) {
    if (!glassSupportsUrl()) return null;
    var key = Math.round(w) + 'x' + Math.round(h);
    if (GLASS.filters[key]) return GLASS.filters[key];
    var defs = glassEnsureDefs();
    if (!defs) return null;
    var map = glassBuildMap(w, h);
    if (!map) return null;
    try {
      var ns = 'http://www.w3.org/2000/svg';
      var id = 'ah-lg-' + key;
      // 位移强度按手册边宽走（min(44, 短边/3.5)，floor 4），避免小卡片整张扭曲
      var rim = Math.max(4, Math.min(GLASS.band, Math.min(w, h) / 3.5));
      var S = 2 * rim * GLASS.edgeFactor; // 实际位移 = scale·(v/255-0.5)，满幅 ≈ scale/2
      var filter = document.createElementNS(ns, 'filter');
      filter.setAttribute('id', id);
      filter.setAttribute('x', '-8%'); filter.setAttribute('y', '-8%');
      filter.setAttribute('width', '116%'); filter.setAttribute('height', '116%');
      filter.setAttribute('color-interpolation-filters', 'sRGB');
      var mk = function (tag, attrs) {
        var e = document.createElementNS(ns, tag);
        for (var k in attrs) { if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]); }
        // feImage 的 href 在部分实现里认 xlink:href，两个都设最稳
        if (tag === 'feImage' && attrs.href) {
          try { e.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', attrs.href); } catch (ignored) {}
        }
        filter.appendChild(e);
      };
      mk('feImage', { href: map, result: 'map', preserveAspectRatio: 'none', x: '0', y: '0', width: String(Math.round(w)), height: String(Math.round(h)) });
      mk('feDisplacementMap', { in: 'SourceGraphic', in2: 'map', scale: (S * (1 + GLASS.disp)).toFixed(2), xChannelSelector: 'R', yChannelSelector: 'G', result: 'dR' });
      mk('feColorMatrix', { in: 'dR', type: 'matrix', values: '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0', result: 'r' });
      mk('feDisplacementMap', { in: 'SourceGraphic', in2: 'map', scale: S.toFixed(2), xChannelSelector: 'R', yChannelSelector: 'G', result: 'dG' });
      mk('feColorMatrix', { in: 'dG', type: 'matrix', values: '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0', result: 'g' });
      mk('feDisplacementMap', { in: 'SourceGraphic', in2: 'map', scale: (S * (1 - GLASS.disp)).toFixed(2), xChannelSelector: 'R', yChannelSelector: 'G', result: 'dB' });
      mk('feColorMatrix', { in: 'dB', type: 'matrix', values: '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0', result: 'b' });
      mk('feBlend', { in: 'r', in2: 'g', mode: 'screen', result: 'rg' });
      mk('feBlend', { in: 'rg', in2: 'b', mode: 'screen' });
      defs.appendChild(filter);
      GLASS.filters[key] = id;
      return id;
    } catch (ignored) { return null; }
  }

  function glassParseColor(str) {
    try {
      var m = String(str || '').match(/rgba?\(([^)]+)\)/i);
      if (!m) return null;
      var parts = m[1].split(/[,\s\/]+/).filter(function (s) { return s.length; }).map(Number);
      if (parts.length < 3 || isNaN(parts[0])) return null;
      return { r: parts[0] || 0, g: parts[1] || 0, b: parts[2] || 0, a: parts.length > 3 ? parts[3] : 1 };
    } catch (ignored) { return null; }
  }

  function glassRelLuma(c) {
    var f = function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  }

  /** 沿祖先链找第一个有非透明背景的元素，得到一个有效底色。 */
  function glassEffectiveBg(el) {
    try {
      var node = el;
      while (node && node.nodeType === 1) {
        var cs = window.getComputedStyle(node);
        var c = glassParseColor(cs && cs.backgroundColor);
        if (c && c.a > 0.02) return c;
        node = node.parentElement;
      }
    } catch (ignored) { /* 拿不到就返回 null */ }
    return null;
  }

  /** 读取卡片背后多个采样点的平均亮度(0..1)与复杂度(0..1)。 */
  function glassSampleBackdrop(cardEl) {
    var fallback = function () {
      var dark = false;
      try { dark = document.body && document.body.hasAttribute('data-ds-dark-theme'); } catch (ignored) {}
      return { luma: dark ? 0.12 : 0.9, complexity: 0.5 };
    };
    try {
      var rect = cardEl.getBoundingClientRect();
      if (!rect || rect.width < 4 || rect.height < 4) return fallback();
      var pts = [[0.12, 0.22], [0.5, 0.5], [0.88, 0.22], [0.12, 0.78], [0.88, 0.78]];
      var lumas = [];
      for (var i = 0; i < pts.length; i += 1) {
        var x = rect.left + rect.width * pts[i][0];
        var y = rect.top + rect.height * pts[i][1];
        var stack = [];
        try { stack = document.elementsFromPoint(x, y) || []; } catch (ignored) { stack = []; }
        var bg = null;
        for (var j = 0; j < stack.length; j += 1) {
          var node = stack[j];
          if (node === cardEl || (cardEl.contains && cardEl.contains(node))) continue;
          bg = glassEffectiveBg(node);
          if (bg) break;
        }
        if (!bg) bg = glassEffectiveBg(document.body);
        if (bg) lumas.push(glassRelLuma(bg));
      }
      if (!lumas.length) return fallback();
      var mean = 0, i2;
      for (i2 = 0; i2 < lumas.length; i2 += 1) mean += lumas[i2];
      mean /= lumas.length;
      var variance = 0;
      for (i2 = 0; i2 < lumas.length; i2 += 1) variance += (lumas[i2] - mean) * (lumas[i2] - mean);
      variance /= lumas.length;
      var sd = Math.sqrt(variance);
      return { luma: mean, complexity: Math.min(1, sd * 3.2) };
    } catch (ignored) { return fallback(); }
  }

  /** 给一张卡片套上液态玻璃：采样→切明暗→算着色透明度→装折射 filter。幂等。 */
  function glassDecorate(cardEl, force) {
    try {
      if (!cardEl || !cardEl.classList) return;
      var w = cardEl.clientWidth || 0, h = cardEl.clientHeight || 0;
      var sizeKey = Math.round(w) + 'x' + Math.round(h);
      if (!force && cardEl.dataset.ahGlass === '1' && cardEl.dataset.ahGlassSize === sizeKey) return;

      var sample = glassSampleBackdrop(cardEl);
      // 保对比映射：背景亮(≥0.5)→浅色玻璃(深墨 multiply)；背景暗(<0.5)→深色玻璃(浅墨 plus-lighter)。
      // 注：手册第 7 条写「<0.5 切浅色」，但纯白/纯黑主题下会生成「反相卡」（白底深卡、黑底亮卡），
      //     违反 DESIGN §1「安静中性底 + 克制玻璃」，故按场景明暗同向选取（见 VETO-LIST）。
      var light = sample.luma >= 0.5;
      cardEl.classList.toggle('ah-card--glass-light', light);
      cardEl.classList.toggle('ah-card--glass-dark', !light);
      cardEl.classList.add('ah-card--glass');

      // 着色密度：先按背景复杂度落在推荐区间，再做「对比度守卫」——不足时加密度、不降墨色
      var range = light ? GLASS.tintLight : GLASS.tintDark;
      var alpha = range[0] + (range[1] - range[0]) * sample.complexity;
      var bright = light ? 1.06 : 0.8;            // 对应 backdrop-filter 的 brightness
      var bgL = Math.min(1, Math.max(0, sample.luma * bright));
      var tintLuma = light ? 1 : 0.0065;          // 白着色 / 近墨着色
      var inkLuma = light ? 0.0065 : 0.93;        // 浅玻璃→深墨；深玻璃→浅墨
      var effL = bgL * (1 - alpha) + tintLuma * alpha;
      var contrast = (Math.max(effL, inkLuma) + 0.05) / (Math.min(effL, inkLuma) + 0.05);
      while (contrast < 4.5 && alpha < 0.92) {
        alpha = Math.min(0.92, alpha + 0.02);
        effL = bgL * (1 - alpha) + tintLuma * alpha;
        contrast = (Math.max(effL, inkLuma) + 0.05) / (Math.min(effL, inkLuma) + 0.05);
      }
      var hoverA = Math.min(0.96, alpha + 0.14);  // hover 提亮约 14%
      var tintRgb = light ? '255,255,255' : '20,20,24';
      try {
        cardEl.style.setProperty('--ah-tint', 'rgba(' + tintRgb + ',' + alpha.toFixed(3) + ')');
        cardEl.style.setProperty('--ah-tint-hover', 'rgba(' + tintRgb + ',' + hoverA.toFixed(3) + ')');
      } catch (ignored) {}

      var id = glassEnsureFilter(w, h);
      if (id) {
        // 只登记折射 URL；实际 backdrop 只在悬停单卡时由 CSS 启用（静态零开销）
        try { cardEl.style.setProperty('--ah-lg-url', 'url(#' + id + ')'); } catch (ignored) {}
        cardEl.classList.add('ah-card--refract');
      }

      cardEl.dataset.ahGlass = '1';
      cardEl.dataset.ahGlassSize = sizeKey;

      // 尺寸变化（半屏/全屏、字体回流）时重建贴图，让边缘折射对齐几何
      if (!cardEl.__ahRO) {
        try {
          if (typeof ResizeObserver === 'function') {
            var ro = new ResizeObserver(function () { glassDecorate(cardEl, true); });
            ro.observe(cardEl);
            cardEl.__ahRO = ro;
          }
        } catch (ignored) { /* 无 RO 就只在下次渲染时更新 */ }
      }
      if (GLASS.cards.indexOf(cardEl) === -1) GLASS.cards.push(cardEl);
    } catch (ignored) { /* 单卡失败不影响其它卡 */ }
  }

  /** 遍历一个子树里的所有卡片并套玻璃；首次调用时启动主题监听。 */
  function enhanceGlassCards(root) {
    try {
      if (!root || !root.querySelectorAll) return;
      glassStartThemeWatch();
      // 清理已卸载的卡片，断开它们的尺寸观察，避免长会话里观察器累积
      for (var p = GLASS.cards.length - 1; p >= 0; p -= 1) {
        var old = GLASS.cards[p];
        if (!old || !old.isConnected) {
          try { if (old && old.__ahRO) old.__ahRO.disconnect(); } catch (ignored) {}
          GLASS.cards.splice(p, 1);
        }
      }
      var cards = root.querySelectorAll('.ah-card');
      for (var i = 0; i < cards.length; i += 1) glassDecorate(cards[i], false);
    } catch (ignored) { /* 整体失败静默降级 */ }
  }

  function glassRefreshAll() {
    var list = GLASS.cards.slice();
    for (var i = 0; i < list.length; i += 1) glassDecorate(list[i], true);
  }

  function glassStartThemeWatch() {
    if (GLASS.mo || typeof MutationObserver !== 'function' || !document.body) return;
    try {
      GLASS.mo = new MutationObserver(function () {
        if (GLASS.queued) return;
        GLASS.queued = true;
        var run = function () { GLASS.queued = false; glassRefreshAll(); };
        // 主题/class 变化可能连带其它属性抖动，合并到下一帧再统一重算
        if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run); else run();
      });
      GLASS.mo.observe(document.body, { attributes: true, attributeFilter: ['data-ds-dark-theme', 'class'] });
    } catch (ignored) { GLASS.mo = null; }
  }

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
  var selectedCacheAt = 0;
  var selectedCacheVal = null;
  function selectedSessionIds() {
    try {
      if (typeof document === 'undefined' || typeof document.querySelectorAll !== 'function') return null;
      // 同一帧内面板 / 右栏 / 悬停卡都会调它；做 100ms 微缓存，避免重复的 DOM 查询。
      // 选中高亮由宿主绘制，插件只用来判断「当前会话」，100ms 延迟无感。
      var nowMs = Date.now();
      if (selectedCacheVal !== null && nowMs - selectedCacheAt < 100) return selectedCacheVal;
      var rows = document.querySelectorAll('[data-row-key^="session:"]');
      var out = {};
      for (var i = 0; i < rows.length; i += 1) {
        var row = rows[i];
        if (!/(^|\s)\S*_selected(\s|$)/.test(' ' + String(row.className || '') + ' ')) continue;
        var key = String(row.getAttribute('data-row-key') || '').slice('session:'.length);
        if (key) out[key] = true;
      }
      selectedCacheAt = nowMs;
      selectedCacheVal = out;
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
  /**
   * 从客户端状态域（useSessionStatus / uiSession）取出"等待用户处理"的分类。
   * 宿主的 pendingInteraction.kind 只有三种：approval / plan-review / question。
   * 读不到状态域时返回 undefined，由调用方退回 userQuestions 投影。
   */
  function pendingKindOf(status) {
    try {
      var kind = status && status.pendingInteraction && status.pendingInteraction.kind;
      if (kind === 'approval' || kind === 'plan-review' || kind === 'question') return kind;
    } catch (ignored) { /* 状态结构未知时静默降级 */ }
    return undefined;
  }

  /**
   * 归一化宿主会话状态快照（useSessionStatus 的 map.get(id)）：
   * { running, pendingInteraction:{kind}, completionUnread }。
   * 返回 { hasSnapshot, running?, pending?, completionUnread? }；字段缺失时由调用方兜底。
   */
  function nativeStatusOf(statusOf, id) {
    var out = {};
    try {
      var status = typeof statusOf === 'function' ? statusOf(id) : undefined;
      if (status && typeof status === 'object') {
        out.hasSnapshot = true;
        if (typeof status.running === 'boolean') out.running = status.running;
        out.pending = pendingKindOf(status);
        if (typeof status.completionUnread === 'boolean') out.completionUnread = status.completionUnread;
      }
    } catch (ignored) { /* 状态域异常时静默降级 */ }
    return out;
  }

  /** 正在运行的直接子智能体数量（与宿主 workspace 的 runningChildCount 同口径）。 */
  function runningChildCount(id, projections, byId, statusOf) {
    try {
      var proj = projections && projections[id];
      var catalog = proj && proj.values && proj.values.subagentCatalog;
      if (!Array.isArray(catalog)) return 0;
      var count = 0;
      for (var i = 0; i < catalog.length; i += 1) {
        var child = catalog[i];
        if (!child || child.id === undefined) continue;
        var cs = nativeStatusOf(statusOf, child.id);
        var cr = typeof cs.running === 'boolean'
          ? cs.running
          : (byId && byId[child.id] ? byId[child.id].running === true : false);
        if (cr === true) count += 1;
      }
      return count;
    } catch (ignored) { return 0; }
  }

  /**
   * 生成与宿主 sessionStatuses() 同构的状态项列表，供所有展示面统一消费。
   * 每项：{ state, key, params?, ariaKey, kind?, additive? }。
   * 优先级：pending（审批＞计划＞回答）＞ running ＞ 子智能体 ＞ 已完成 ＞ 空闲。
   */
  function statusItemsOf(facts) {
    var items = [];
    var pending = facts.pending;
    var sub = facts.runningSubagentCount > 0;
    var subKey = facts.runningSubagentCount === 1
      ? 'status.subagentsRunning.one'
      : 'status.subagentsRunning.other';
    var subParams = { n: facts.runningSubagentCount };
    if (pending) {
      var pk = pending === 'approval' ? 'waitingApproval'
        : (pending === 'plan-review' ? 'planReview' : 'waitingAnswer');
      items.push({ state: 'warning', key: 'status.' + pk, kind: pending, ariaKey: 'status.' + pk + 'Title' });
    } else if (facts.running === true) {
      items.push({ state: 'ongoing', key: 'status.running', ariaKey: 'status.runningTitle' });
    } else if (sub) {
      items.push({ state: 'ongoing', key: subKey, params: subParams, ariaKey: subKey });
    }
    if (items.length === 0 && facts.completionUnread === true) {
      items.push({ state: 'done', key: 'status.completed', ariaKey: 'status.completedTitle' });
    }
    if (items.length === 0) {
      items.push({ state: 'idle', key: 'status.idle', ariaKey: 'status.idleTitle' });
    }
    if (sub && items[0].key.indexOf('status.subagentsRunning') !== 0) {
      items.push({ state: 'ongoing', key: subKey, params: subParams, ariaKey: subKey, additive: true });
    }
    return items;
  }

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
  function buildModel(sessionState, workspaceState, now, topCount, groupCount, opts) {
    opts = opts || {};
    // 范围：常规（排除归档/子代理）/ 已归档 / 子代理；非 sessions 视图一律走常规。
    var range = opts.range === 'archived' || opts.range === 'subagent' ? opts.range : 'active';
    // 状态读取器：由宿主 useSessionStatus 注入，拿不到时退回 userQuestions 投影。
    var statusOf = typeof opts.statusOf === 'function' ? opts.statusOf : undefined;
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
      var summary = byId[id];
      if (!summary) continue;
      var isArchived = archivedOf[String(id)] === true;
      var isSubagent = summary.origin === 'subagent';
      if (range === 'active') {
        if (isArchived || isSubagent) continue;
      } else if (range === 'archived') {
        if (!isArchived || isSubagent) continue;
      } else if (!isSubagent) {
        continue;
      }
      if (range !== 'active' && summary.blank === true) continue;
      var at = lastActiveOf(summary);
      var facts = factsFromProjection(projections[id]);
      var open = hasSelection
        ? selected[String(id)] === true
        : Boolean(summary.retainedBy && summary.retainedBy.mainView > 0);
      // 数据源以宿主 useSessionStatus 为准；字段缺失时才退回归一化前的兜底。
      var native = nativeStatusOf(statusOf, id);
      var running = typeof native.running === 'boolean' ? native.running : summary.running === true;
      var pending = native.pending;
      // pendingInteraction 读不到（没有状态域 / 该会话不在快照里）才退回 userQuestions 投影。
      if (!pending && native.hasSnapshot !== true && facts.awaiting === true) pending = 'question';
      var runningSubagentCount = runningChildCount(id, projections, byId, statusOf);
      // 已完成：宿主 completionUnread 为主；拿不到该字段时才用本地查看水位兜底。
      var completionUnread = typeof native.completionUnread === 'boolean'
        ? native.completionUnread
        : doneUnseenOf(id, at, running, open, now);
      var statusItems = statusItemsOf({
        pending: pending,
        running: running,
        runningSubagentCount: runningSubagentCount,
        completionUnread: completionUnread,
      });
      var primaryState = statusItems[0].state;
      // 宿主的 updatedAt 只在一轮开始/结束刷新，长任务运行中不会更新；
      // 因此"正在工作"不能只按时间算，否则会被 10 分钟前的空闲会话压下去。
      // 运行中的会话按最高热度计（level 5），真实时间仍留给右侧的"最后活动"。
      var age = at === undefined ? undefined : now - at;
      var level = primaryState === 'ongoing' ? 5 : (age === undefined ? 0 : heatLevelOf(age));
      var ratio = primaryState === 'ongoing'
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
        runningSubagentCount: runningSubagentCount,
        done: completionUnread,
        pending: pending,
        statusItems: statusItems,
        primaryState: primaryState,
        awaiting: pending === 'question' || facts.awaiting === true,
        archived: isArchived,
        subagent: isSubagent,
        parentSessionId: typeof summary.parentSessionId === 'string' ? summary.parentSessionId : undefined,
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
      // 进行中（含子智能体在跑）优先；同为运行时再按最近活动时间
      var xo = x.primaryState === 'ongoing';
      var yo = y.primaryState === 'ongoing';
      if (xo !== yo) return xo ? -1 : 1;
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
      if (session.primaryState === 'ongoing') group.running = true;
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

  /* ---------------- 标题前圆点（热度） ---------------- */

  /**
   * 热度改用「会话标题文字前一个小圆点」表达，不再占用行首 16px 格。
   *
   * 为什么彻底离开行首格：这一格除了宿主的原生状态点（非 idle 行由宿主绘制），
   * 还会被「定时任务」插件用来画时钟标记（它同样占用 `sidebar.session.row.leading`）。
   * 插件在这里再放任何可见元素，都会和状态点或时钟并排拥挤。
   *
   * 做法：行首 slot 仍然注册，但组件只借这个 seat 读到本行 sessionId 与热度，
   * 把规则写进一个 `<style id="activity-heat-title-dot">`，然后 `return null`——
   * 行首不渲染任何可见节点；圆点画在**会话行**的 `::before` 上（用标题 `padding-left`
   * 占位，视觉上仍在标题文字前），不新增 DOM、不占行首格。
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
   * 位置：圆点画在**会话行**的 `::before` 上（不是标题元素），再用标题的
   * `padding-left` 把它占的 7px + 6px 间距让出来——视觉上仍是"标题前的小圆点"，
   * 但避开了标题 `overflow:hidden` 的裁剪与跑马灯 mask 的渐隐（见函数内注释）。
   * **不占用行首 16px 格**，所以不会和原生状态点、定时任务时钟挤在一起。
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
    // 圆点画在**会话行**的 ::before 上，而不是标题元素的 ::before。
    //
    // 原因（宿主 Rows.module.css 已核实）：会话标题 `.wnFoaW_title` 是
    // `overflow:hidden; white-space:nowrap; text-overflow:ellipsis`，而且 hover
    // 长标题时会横向跑马灯、并加 `mask-image: linear-gradient(90deg,transparent,#000 12px)`
    // 把左侧 12px 渐隐。圆点若贴在标题内容盒左边缘（原来的 `_title::before`），
    // ① 向外发光向左溢出的部分会被 `overflow:hidden` 直接裁掉；
    // ② 跑马灯时左 12px 的 mask 还会把圆点本身一起淡掉。
    // 行元素没有 overflow 裁剪、也不参与标题的跑马灯 mask，画在行上就都安全。
    //
    // 位置：行内左缘 = padding-inline-start(8 + --dsh-workspace-indent) + 前导格 16px
    // + 标题 margin-left 4px；圆点左缘落在这里（即标题文字原来的起点）。
    // 同时给标题加 13px 左内边距，把圆点 7px + 间距 6px 的位置让出来——文字位置与
    // 原来 `::before` 占位时完全一致，不会移动。
    var css = rowKey + '{position:relative;}'
      + rowKey + ' [class*="_title"]{padding-left:13px;}'
      + rowKey + '::before{'
      + 'content:"";'
      + 'position:absolute;'
      + 'left:calc(var(--dsh-workspace-indent, 0px) + 28px);'
      + 'top:50%;'
      // 用 margin 而不是 transform 垂直居中：活跃会话的 ah-dot-pulse 动画占用了
      // transform，若这里也写 transform:translateY(-50%) 会被动画覆盖、圆点上跳。
      + 'margin-top:-3.5px;'
      + 'box-sizing:border-box;'
      + 'width:7px;'
      + 'height:7px;'
      + 'border-radius:50%;'
      // 宿主把圆角一律画成 squircle（超椭圆），它自己的圆形组件都显式写
      // `corner-shape:round`；不写的话 7px 小圆会被画成"圆角方块"。
      + 'corner-shape:round;'
      + 'pointer-events:none;'
      // 实心点在高光方向上再叠一层径向渐变，让它是"有厚度的玻璃珠"而不是纯色块
      + (solid
        ? 'background:' + ink + ';'
          + 'background-image:radial-gradient(circle at 34% 30%, color-mix(in srgb, #fff 36%, transparent), transparent 62%);'
          + 'border:none;'
          + 'box-shadow:0 0 6px ' + ink + ';'
        // 空心环去掉原来的 `inset 0 0 4px` 内发光：7px 小圆的内圈只有 4px，
        // 4px 模糊的内阴影几乎把内圈填满，空心环会糊成一坨。
        : 'background:transparent;border:1.5px solid ' + ink + ';'
          + 'box-shadow:none;')
      + '}';
    if (level >= ACTIVE_MIN_LEVEL) {
      var duration = (2.6 - level * 0.16).toFixed(2);
      css += rowKey + '::before{animation:ah-dot-pulse ' + duration + 's ease-in-out infinite;}';
    }
    // 行悬浮：圆点外扩一圈柔光。用 box-shadow 而不是 transform，
    // 因为活跃会话的脉冲动画已经占用了 transform，改它会打架。
    css += rowKey + ':hover::before{'
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

  /**
   * 合并同一帧内的多次样式重写：侧栏 N 行在挂载/更新时会各调一次
   * setTitleFlowLevel，若每次都全量重拼 style 文本就是 O(n²)。有 rAF 时
   * 只在下一帧写一次；无 rAF（测试环境）时同步写，保证断言可见。
   */
  var titleFlowFlushQueued = false;
  function scheduleTitleFlowSync() {
    if (typeof requestAnimationFrame !== 'function') {
      syncTitleFlowStyles();
      return;
    }
    if (titleFlowFlushQueued) return;
    titleFlowFlushQueued = true;
    try {
      requestAnimationFrame(function () {
        titleFlowFlushQueued = false;
        syncTitleFlowStyles();
      });
    } catch (ignored) {
      titleFlowFlushQueued = false;
      syncTitleFlowStyles();
    }
  }

  /** 登记/清除某个会话的热度级别，并刷新下划线样式。 */
  function setTitleFlowLevel(sessionId, level) {
    var key = String(sessionId);
    if (level > 0) titleFlowLevels[key] = level;
    else delete titleFlowLevels[key];
    scheduleTitleFlowSync();
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
    var fillStyle = {
      width: Math.round(ratio * 100) + '%',
      opacity: fillOpacity,
      color: tone,
      backgroundColor: tone,
    };
    // 高温档加同色辉光；管道水流、水头与涌浪由 CSS 负责
    if (level >= 4) {
      fillStyle.boxShadow = 'inset 0 1px 0 rgba(255,255,255,.48), 0 0 12px color-mix(in srgb, ' + tone + ' 45%, transparent)';
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
        style: fillStyle,
      },
        React.createElement('span', { className: AH.waterHead }),
      ),
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
   * 竖向玻璃温度计热度条：液柱按 ratio 从底部上涨，底部是一枚档位色球泡，
   * 液面是一道凹弯月面；低热度就是低液柱（不再模拟“水头打不上来”）。
   * @param props.level - 0..5 档位（决定颜色）
   * @param props.ratio - 0..1 液位
   * @param props.width - 管宽，默认 12
   * @param props.stretch - true 时随父容器拉伸（卡片左侧那一根）
   * @param props.height - 非拉伸模式下的管高
   */
  function VerticalHeatPipe(props) {
    var level = Math.max(0, Math.min(5, (props && props.level) || 0));
    var ratio = typeof props.ratio === 'number' && isFinite(props.ratio)
      ? Math.max(0, Math.min(1, props.ratio))
      : heatAlphaOf(level);
    var width = props && typeof props.width === 'number' ? props.width : 12;
    var tone = heatToneOf(level);
    // 留一点最低液位，避免低档时看起来是一根空管
    var pct = Math.max(4, Math.round(ratio * 100));
    var outerStyle = { width: width };
    if (props && props.stretch === true) outerStyle.alignSelf = 'stretch';
    else outerStyle.height = props && typeof props.height === 'number' ? props.height : 20;
    if (props && props.style) {
      for (var k in props.style) {
        if (Object.prototype.hasOwnProperty.call(props.style, k)) outerStyle[k] = props.style[k];
      }
    }
    return React.createElement(
      'span',
      { className: AH.vpipe, style: outerStyle, 'aria-hidden': 'true' },
      React.createElement(
        'span',
        {
          className: AH.vpipeFill,
          style: { height: pct + '%', color: tone, backgroundColor: tone },
        },
        React.createElement('span', { className: AH.vpipeHead }),
      ),
      // 温度计底部球泡：始终充满档位色，像水银球一样与液柱连成一体
      React.createElement('span', {
        className: AH.vpipeBulb,
        style: { color: tone, backgroundColor: tone },
      }),
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
        className: AH.waterV,
        style: {
          width: barWidth,
          height: barHeight,
          borderRadius: 999,
          color: heatToneOf(level),
          // 竖直温度条：整条保持档位色，管道水流与顶端水头由 .ah-water-v 负责
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
    // F4：侧栏入口的「已完成未查看」计数角标（0 时隐藏）。数据拿不到时静默为 0。
    useMinuteTick();
    var unreadCount = 0;
    try {
      var useSessions = props && props.useSessions;
      var useWorkspaces = props && props.useWorkspaces;
      var useSessionStatus = props && props.useSessionStatus;
      if (typeof useSessions === 'function') {
        var sessionState = useSessions(function (s) { return s; });
        var wsState = typeof useWorkspaces === 'function' ? useWorkspaces(function (s) { return s; }) : null;
        var statusMap = null;
        try { statusMap = typeof useSessionStatus === 'function' ? useSessionStatus(function (s) { return s; }) : null; } catch (ignored) { statusMap = null; }
        var statusOf = statusMap && typeof statusMap.get === 'function' ? function (sid) { return statusMap.get(sid); } : undefined;
        var archivedSet = {};
        if (wsState && Array.isArray(wsState.archivedSessionIds)) {
          for (var ai = 0; ai < wsState.archivedSessionIds.length; ai += 1) archivedSet[String(wsState.archivedSessionIds[ai])] = true;
        }
        var ids = sessionState && Array.isArray(sessionState.ids) ? sessionState.ids : [];
        var byId = (sessionState && sessionState.byId) || {};
        var openSet = selectedSessionIds();
        for (var hi = 0; hi < ids.length; hi += 1) {
          var hid = ids[hi];
          var hsummary = byId[hid];
          if (!hsummary || hsummary.blank === true || hsummary.origin === 'subagent') continue;
          if (archivedSet[String(hid)]) continue;
          var hnative = nativeStatusOf(statusOf, hid);
          if (hnative.completionUnread !== true) continue;
          if (openSet && openSet[String(hid)] === true) continue;
          unreadCount += 1;
        }
      }
    } catch (ignored) { unreadCount = 0; }
    var badge = unreadCount > 0
      ? React.createElement('span', {
          key: 'unread',
          title: tt('badge.title', { count: unreadCount }),
          style: {
            position: 'absolute',
            top: -2,
            right: -2,
            minWidth: 14,
            height: 14,
            padding: '0 3px',
            borderRadius: 999,
            boxSizing: 'border-box',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 9,
            lineHeight: '14px',
            fontWeight: 600,
            color: '#fff',
            background: 'var(--color-blue-500, #3b82f6)',
            boxShadow: '0 0 0 1px color-mix(in srgb, var(--dsw-alias-bg-base, #fff) 80%, transparent)',
            pointerEvents: 'none',
          },
        }, unreadCount > 99 ? '99+' : String(unreadCount))
      : null;
    var ring = React.createElement(
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
      badge,
    );
    return React.createElement(React.Fragment, null, ring, React.createElement(OpenWithLayerHost));
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
   * 状态点：本地绘制（用宿主主题令牌），与宿主 StateDot 的形态/颜色语义一致。
   * 官方规范禁止 require Harness Client 包，因此这里不引用宿主 primitives。
   */
  function StatusDot(props) {
    var state = (props && props.state) || 'idle';
    var size = props && props.size;
    var d = size || (state === 'ongoing' ? 14 : 10);
    var color = state === 'warning'
      ? 'var(--dsw-alias-state-warn-primary, #f59e0b)'
      : state === 'done'
        ? 'var(--dsw-alias-state-success-primary, #22c55e)'
        : state === 'idle'
          ? 'var(--dsw-alias-label-tertiary, #9ca3af)'
          : 'var(--color-blue-500, #3b82f6)';
    return React.createElement('span', {
      className: AH.statusDot,
      'data-state': state,
      'aria-hidden': 'true',
      style: {
        display: 'inline-flex', width: d, height: d, flex: 'none', borderRadius: 999,
        background: state === 'ongoing' ? 'transparent' : color,
        border: state === 'ongoing' ? '2px solid ' + color : 'none',
        boxSizing: 'border-box',
      },
    });
  }

  /**
   * 状态标签 = 状态点 + 原生文案。item = { state, key, params, ariaKey }。
   * key 直接是宿主对齐的 status.* 字典键（进行中 / 等待审批 / 计划待审 / 等待回答 / 已完成）。
   */
  function StatusTag(props) {
    var items = props && props.items ? props.items : [];
    var item = items[0];
    if (!item) return null;
    var stacked = props && props.stacked === true;
    var compact = props && props.compact === true;
    var label = tt(item.key, item.params);
    var aria = tt(item.ariaKey || (item.key + 'Title'), item.params);
    return React.createElement(
      'span',
      {
        className: AH.statusTag,
        role: 'img',
        'aria-label': aria,
        'data-state': item.state,
        style: {
          flexDirection: stacked ? 'column' : 'row',
          gap: stacked ? 3 : 5,
          fontSize: compact ? '0.76em' : (stacked ? '0.78em' : '0.8em'),
        },
      },
      React.createElement(StatusDot, { state: item.state, size: compact ? 12 : undefined }),
      React.createElement('span', null, label),
    );
  }

  /**
   * 可叠加状态：N 个子智能体运行中。与主状态并列，不替代主状态。
   * compact 时用短文案（卡片 66px 列），完整文案仍放进 aria-label。
   */
  function SubagentTag(props) {
    var count = props && props.count;
    if (!count) return null;
    var key = count === 1 ? 'status.subagentsRunning.one' : 'status.subagentsRunning.other';
    var full = tt(key, { n: count });
    var label = props.compact ? tt('status.compact.subagents', { n: count }) : full;
    return React.createElement(
      'span',
      {
        className: AH.statusTag,
        role: 'img',
        'aria-label': full,
        'data-state': 'ongoing',
        style: {
          flexDirection: props && props.stacked === true ? 'column' : 'row',
          gap: 4,
          fontSize: props && props.compact ? '0.7em' : '0.74em',
          color: 'var(--dsw-alias-label-secondary)',
        },
      },
      React.createElement(StatusDot, { state: 'ongoing', size: props && props.compact ? 10 : 12 }),
      React.createElement('span', null, label),
    );
  }

  /* ---------------- 轻量触达席位的组件（P1-6） ---------------- */

  /**
   * 侧栏折叠态顶部徽章：只做状态提示，不承载点击。
   * 统计"需要你关注"的会话数（运行中 + 等待审批/计划/回答）。
   * 拿不到 useSessions 时直接不渲染，避免在未知宿主上凭空多一个点。
   */
  function ToggleBadge(props) {
    var useSessions = props && props.useSessions;
    if (!useSessions) return null;
    var state;
    try { state = useSessions(function (s) { return s; }); } catch (ignored) { state = null; }
    var ids = state && Array.isArray(state.ids) ? state.ids : [];
    var byId = (state && state.byId) || {};
    var statuses = null;
    try {
      statuses = props && props.useSessionStatus
        ? props.useSessionStatus(function (s) { return s; })
        : null;
    } catch (ignored) { statuses = null; }
    var statusOfF = statuses && typeof statuses.get === 'function'
      ? function (sid) { return statuses.get(sid); }
      : undefined;
    var count = 0;
    for (var i = 0; i < ids.length; i += 1) {
      var summary = byId[ids[i]];
      if (!summary) continue;
      var native = nativeStatusOf(statusOfF, ids[i]);
      var runningNow = typeof native.running === 'boolean' ? native.running : summary.running === true;
      var subCount = runningChildCount(ids[i], (state && state.projectionsBySession) || {}, byId, statusOfF);
      if (native.pending || runningNow || subCount > 0) count += 1;
    }
    if (count <= 0) return null;
    return React.createElement('span', {
      className: 'ah-collapse-badge',
      role: 'status',
      'aria-label': tt('badge.title', { count: count }),
      style: {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        minWidth: 16, height: 16, padding: '0 4px', borderRadius: 999,
        fontSize: 10, lineHeight: '16px', fontWeight: 700,
        color: '#fff', background: 'var(--color-blue-500, #3b82f6)',
        boxShadow: '0 0 6px color-mix(in srgb, var(--color-blue-500, #3b82f6) 45%, transparent)',
        flex: 'none',
      },
    }, String(count));
  }

  /** 侧栏「更多」菜单里的一行：打开最近活跃面板。 */
  function PanellistAction(props) {
    var onOpen = props && props.onOpen;
    if (typeof onOpen !== 'function') return null;
    return React.createElement('button', {
      type: 'button',
      role: 'menuitem',
      className: 'ah-more-item',
      onClick: function () {
        try { if (typeof props.onDismiss === 'function') props.onDismiss(); } catch (ignored) { /* ignore */ }
        try { onOpen('activity-heat'); } catch (ignored) { /* ignore */ }
      },
      style: {
        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
        padding: '6px 10px', border: 'none', borderRadius: 6,
        background: 'transparent', color: 'inherit', font: 'inherit',
        fontSize: '0.86em', textAlign: 'left', cursor: 'pointer',
      },
    }, React.createElement(HeatRing, { size: 14, level: 4 }), tt('nav'));
  }

  /**
   * 底部活跃会话栏（shell.bottom，贴 DSH 整页底部）：只有存在「运行中 / 等待处理」的会话时才出现。
   * 横向列出最多 6 个，点击直接打开；没有活动时返回 null，不预留高度。
   */
  function BottomActivityBar(props) {
    var useSessions = props && props.useSessions;
    var useWorkspaces = props && props.useWorkspaces;
    if (!useSessions) return null;
    var state;
    try { state = useSessions(function (s) { return s; }); } catch (ignored) { return null; }
    if (!state || !Array.isArray(state.ids)) return null;
    var byId = state.byId || {};
    var archived = {};
    try {
      var ws = useWorkspaces ? useWorkspaces(function (s) { return s; }) : null;
      if (ws && Array.isArray(ws.archivedSessionIds)) {
        for (var a = 0; a < ws.archivedSessionIds.length; a += 1) {
          archived[String(ws.archivedSessionIds[a])] = true;
        }
      }
    } catch (ignored) { /* 归档集缺失不影响 */ }
    var statuses = null;
    try {
      statuses = props && props.useSessionStatus
        ? props.useSessionStatus(function (s) { return s; })
        : null;
    } catch (ignored) { statuses = null; }

    var statusOfF = statuses && typeof statuses.get === 'function'
      ? function (sid) { return statuses.get(sid); }
      : undefined;
    var live = [];
    for (var i = 0; i < state.ids.length; i += 1) {
      var id = state.ids[i];
      var summary = byId[id];
      if (!summary || summary.blank === true || summary.origin === 'subagent') continue;
      if (archived[String(id)]) continue;
      var native = nativeStatusOf(statusOfF, id);
      var runningNow = typeof native.running === 'boolean' ? native.running : summary.running === true;
      var subCount = runningChildCount(id, state.projectionsBySession || {}, byId, statusOfF);
      var pending = native.pending;
      if (!runningNow && !pending && subCount <= 0) continue;
      var items = statusItemsOf({
        pending: pending, running: runningNow, runningSubagentCount: subCount, completionUnread: false,
      });
      live.push({
        id: id, title: titleOf(summary, id), at: lastActiveOf(summary),
        running: items[0].state === 'ongoing', pending: pending, state: items[0].state,
      });
    }
    if (live.length === 0) return null;
    live.sort(function (x, y) {
      if (x.running !== y.running) return x.running ? -1 : 1;
      return (y.at || 0) - (x.at || 0);
    });
    var shown = live.slice(0, 6);
    var ctx = props && props.ctx;
    var uiWorkspace = ctx && typeof ctx.get === 'function' ? ctx.get('uiWorkspace') : undefined;

    var chips = shown.map(function (item) {
      return React.createElement('button', {
        key: item.id,
        type: 'button',
        className: 'ah-bottom-chip',
        'aria-label': tt('bottom.open', { title: item.title }),
        onClick: function () {
          try {
            if (uiWorkspace && typeof uiWorkspace.openSession === 'function') uiWorkspace.openSession(item.id);
          } catch (ignored) { /* 打开失败不影响其他 chip */ }
        },
        style: {
          display: 'inline-flex', alignItems: 'center', gap: 5, flex: 'none',
          maxWidth: 200, padding: '2px 8px', borderRadius: 999,
          border: '1px solid color-mix(in srgb, var(--color-blue-500, #3b82f6) 24%, transparent)',
          background: 'color-mix(in srgb, var(--color-blue-500, #3b82f6) 10%, transparent)',
          color: 'var(--dsw-alias-label-secondary)', font: 'inherit', fontSize: '0.78em',
          lineHeight: '18px', cursor: 'pointer', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
        },
      },
        React.createElement(StatusDot, { state: item.state, size: 8 }),
        item.title,
      );
    });

    return React.createElement('div', {
      className: 'ah-bottom-bar',
      style: {
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 12px', minHeight: 32, boxSizing: 'border-box',
        borderTop: '1px solid color-mix(in srgb, var(--dsw-alias-border-l1, rgba(127,127,127,0.18)) 70%, transparent)',
        background: 'color-mix(in srgb, var(--dsw-specific-menu, rgba(127,127,127,0.08)) 88%, transparent)',
        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        overflowX: 'auto', overflowY: 'hidden',
      },
    },
      React.createElement('span', {
        style: { flex: 'none', fontSize: '0.76em', color: 'var(--dsw-alias-label-tertiary)', whiteSpace: 'nowrap' },
      }, tt('bottom.title', { count: live.length })),
      chips,
      live.length > shown.length
        ? React.createElement('span', {
            style: { flex: 'none', fontSize: '0.76em', color: 'var(--dsw-alias-label-tertiary)' },
          }, tt('bottom.more', { count: live.length - shown.length }))
        : null,
    );
  }

  /**
   * 右侧栏常驻面板（sidebar.right.pane.tab）：把最近活跃会话停靠在右栏，
   * 不占主面板。数据源与中央面板共用 buildModel；拿不到 root hooks 时显示占位。
   */
  function RightbarActivityPanel(props) {
    var useSessions = props && props.useSessions;
    var useWorkspaces = props && props.useWorkspaces;
    var ctx = props && props.ctx;
    if (!useSessions) {
      return React.createElement('div', {
        style: { padding: '12px 14px', fontSize: '0.82em', color: 'var(--dsw-alias-label-tertiary)' },
      }, tt('rightbar.empty'));
    }
    var state;
    try { state = useSessions(function (s) { return s; }); } catch (ignored) { state = null; }
    var ws;
    try {
      ws = useWorkspaces ? useWorkspaces(function (s) { return s; }) : { archivedSessionIds: [], items: [] };
    } catch (ignored) { ws = { archivedSessionIds: [], items: [] }; }
    var statuses = null;
    try {
      statuses = props && props.useSessionStatus ? props.useSessionStatus(function (s) { return s; }) : null;
    } catch (ignored) { statuses = null; }
    var statusOf = statuses && typeof statuses.get === 'function'
      ? function (statusId) { return statuses.get(statusId); }
      : undefined;
    var now = Date.now();
    var model = React.useMemo(function () {
      return buildModel(state || { ids: [], byId: {}, projectionsBySession: {} }, ws, now, 12, 5, { statusOf: statusOf });
    }, [state, ws, statuses]);
    var rows = model.allSessions.slice(0, 12);
    var uiWorkspace = ctx && typeof ctx.get === 'function' ? ctx.get('uiWorkspace') : undefined;

    if (rows.length === 0) {
      return React.createElement('div', {
        style: { padding: '12px 14px', fontSize: '0.82em', color: 'var(--dsw-alias-label-tertiary)' },
      }, tt('rightbar.empty'));
    }

    var items = rows.map(function (item) {
      var primary = item.statusItems && item.statusItems[0];
      var state = primary ? primary.state : 'idle';
      var sub;
      if (primary && state !== 'idle') {
        sub = tt(primary.key, primary.params);
        if (item.statusItems.length > 1) {
          var extra = item.statusItems[1];
          sub += ' · ' + tt(extra.key, extra.params);
        }
      } else {
        sub = tt('hover.lastActive', { time: relativeOf(item.at, now) });
      }
      return React.createElement('button', {
        key: item.id,
        type: 'button',
        className: 'ah-rightbar-row',
        'aria-label': tt('card.openSessionTitle', { title: item.title || item.id }),
        onClick: function () {
          try {
            if (uiWorkspace && typeof uiWorkspace.openSession === 'function') uiWorkspace.openSession(item.id);
          } catch (ignored) { /* ignore */ }
        },
        style: {
          display: 'flex', flexDirection: 'column', gap: 1, width: '100%',
          padding: '6px 8px', border: 'none', borderRadius: 6, background: 'transparent',
          color: 'inherit', font: 'inherit', textAlign: 'left', cursor: 'pointer',
        },
      },
        React.createElement('span', {
          style: { display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 },
        },
          React.createElement(StatusDot, { state: state, size: 8 }),
          React.createElement('span', {
            style: {
              minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              fontSize: '0.86em', color: 'var(--dsw-alias-label-primary)',
            },
          }, item.title || item.id),
        ),
        React.createElement('span', {
          style: {
            paddingLeft: 12, fontSize: '0.74em', color: 'var(--dsw-alias-label-tertiary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          },
        }, sub),
      );
    });

    return React.createElement('div', {
      className: 'ah-rightbar',
      style: {
        display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 6px',
        height: '100%', boxSizing: 'border-box', overflowY: 'auto',
      },
    }, items);
  }

  /** 会话头角落按钮：一键进入最近活跃面板（与 Session 日志控件同排）。 */
  function SessionHeaderCorner(props) {
    var ctx = props && props.ctx;
    return React.createElement('button', {
      type: 'button',
      className: 'ah-corner-button',
      'aria-label': tt('nav'),
      title: tt('nav'),
      onClick: function () {
        try {
          var layout = ctx && typeof ctx.get === 'function' ? ctx.get('layout') : undefined;
          if (layout && typeof layout.selectPanel === 'function') layout.selectPanel('activity-heat');
        } catch (ignored) { /* 宿主未挂载 layout 时忽略 */ }
      },
      style: {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 28, height: 28, padding: 0, border: 'none', borderRadius: 8,
        background: 'transparent', color: 'var(--dsw-alias-label-secondary)',
        cursor: 'pointer', flex: 'none',
      },
    }, React.createElement(HeatRing, { size: 16, level: 4 }));
  }

  function FilterBar(props) {
    var active = props && props.active;
    var counts = (props && props.counts) || {};
    var onPick = props && props.onPick;
    return React.createElement(
      'div',
      { className: AH.secondaryRow },
      React.createElement(
        'div',
        { className: AH.filterScroll },
        FILTERS.map(function (filter) {
          var picked = active === filter.id;
          var count = counts[filter.id] || 0;
          var empty = count === 0 && !picked;
          return React.createElement(
            'button',
            {
              key: filter.id,
              type: 'button',
              onClick: function () { if (onPick) onPick(filter.id); },
              className: AH.tab,
              'data-active': picked ? 'true' : 'false',
              'data-empty': empty ? 'true' : 'false',
              style: {
                padding: '3px 11px',
                fontSize: '0.78em',
                lineHeight: '18px',
                cursor: 'pointer',
                font: 'inherit',
                // 放在 font 之后，否则会被 font 简写重置成 inherit
                fontWeight: picked ? 600 : 500,
              },
            },
            tt(filter.labelKey),
            React.createElement('span', { className: AH.tabCount }, String(count)),
          );
        }),
      ),
    );
  }

  /**
   * 运行中卡片的通用外框：环形 mask 让跑马灯只描 1.5px 边框，卡内是玻璃；外层同时发光。
   * 会话卡片与工作区卡片共用这一份，保证两处的动效完全一致。
   */
  function RunningFrame(props) {
    // 量卡片宽度：横跨时间 = 距离/固定速度，宽度变化时速度保持一致（半屏/全屏统一），并放慢
    var frameRef = React.useRef ? React.useRef(null) : { current: null };
    var widthState = React.useState(480);
    var frameW = widthState[0];
    var setFrameW = widthState[1];
    React.useEffect(function () {
      if (typeof ResizeObserver === 'undefined' || !frameRef.current) return undefined;
      try {
        var ro = new ResizeObserver(function (entries) {
          for (var i = 0; i < entries.length; i += 1) {
            var w = entries[i].contentRect && entries[i].contentRect.width;
            if (w) setFrameW(w);
          }
        });
        ro.observe(frameRef.current);
        return function () { try { ro.disconnect(); } catch (e) { /* ignore */ } };
      } catch (e) { return undefined; }
    }, []);

    // 底部鲸鱼群：数量按「本次运行已持续时长」计算（props.elapsedMs，来自会话 last-activity），
    // 这样切视图/重进面板都不会重置；每分钟 +1，最多 5。
    var elapsedMs = (props && typeof props.elapsedMs === 'number' && isFinite(props.elapsedMs)) ? Math.max(0, props.elapsedMs) : 0;
    var whaleCount = Math.max(1, Math.min(5, 1 + Math.floor(elapsedMs / 60000)));
    // 固定像素速度：一个来回 ≈ 2×(卡片宽+46)；75px/s，越慢动作链越清楚
    var tripPx = 2 * (Math.max(200, frameW) + 46);
    var durSec = Math.max(6, Math.min(60, tripPx / 75));
    var whaleNodes = [];
    for (var wi = 0; wi < whaleCount; wi += 1) {
      whaleNodes.push(React.createElement('span', {
        key: 'whale' + wi,
        className: AH.whale,
        'aria-hidden': 'true',
        style: {
          animationName: 'ah-whale-pingpong',
          animationDuration: durSec.toFixed(2) + 's',
          // 正延迟：新鲸鱼先隐藏，轮到它时从边缘淡入游进来（不会中途凭空出现）；各只错峰
          animationDelay: (wi * 1.8).toFixed(2) + 's',
        },
      }, React.createElement('img', {
        src: WHALE_GIF, alt: '', draggable: false, 'aria-hidden': 'true',
        style: { width: '100%', height: '100%', display: 'block', objectFit: 'contain' },
      })));
    }
    return React.createElement(
      'div',
      {
        ref: frameRef,
        style: {
          position: 'relative',
          margin: '0 0 var(--ah-card-gap, 12px)',
          padding: 1.5,
          borderRadius: 'var(--ah-card-radius, 12px)',
          overflow: 'hidden',
          // 常亮高亮蓝边框（一直高亮，配合下方闪烁辉光）
          border: '1.5px solid color-mix(in srgb, var(--color-blue-500, #3b82f6) 62%, transparent)',
          boxSizing: 'border-box',
          background: 'transparent',
          boxShadow: '0 0 10px 1px color-mix(in srgb, var(--color-blue-500, #3b82f6) 42%, transparent), inset 0 1px 0 rgba(255,255,255,0.12)',
          isolation: 'isolate',
        },
      },
      // 跑马灯光带：用 mask 镂空成「只描边框的环」，绕中心旋转只在 1.5px 边框露出，
      // 这样卡片内部可以是玻璃、不会被光带透进来。
      React.createElement('span', {
        key: 'ring',
        'aria-hidden': 'true',
        style: {
          position: 'absolute', inset: 0, borderRadius: 'inherit', padding: 1.5, boxSizing: 'border-box',
          WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor',
          mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          maskComposite: 'exclude',
          overflow: 'hidden', pointerEvents: 'none', zIndex: 3,
        },
      },
        React.createElement('span', {
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
          },
        }),
      ),
      props.children,
      // 底部游动的 DeepSeek 鲸鱼群（仅运行中卡片；每分钟多一只，最多 5 只）
      whaleNodes,
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

  /** 子菜单定位：默认贴父项右侧；右侧空间不足时翻到左侧。 */
  function submenuPosition(anchor, width, height) {
    var viewportWidth = 1280;
    var viewportHeight = 800;
    try {
      if (typeof window !== 'undefined') {
        if (window.innerWidth) viewportWidth = window.innerWidth;
        if (window.innerHeight) viewportHeight = window.innerHeight;
      }
    } catch (ignored) { /* 测试沙箱没有视口，用默认值 */ }
    var left = anchor && typeof anchor.right === 'number' ? anchor.right - 2 : 12;
    if (left + width > viewportWidth - 8) {
      left = anchor && typeof anchor.left === 'number' ? anchor.left - width + 2 : viewportWidth - width - 8;
    }
    if (left < 8) left = 8;
    var top = anchor && typeof anchor.top === 'number' ? anchor.top - 6 : 12;
    if (top + height > viewportHeight - 8) top = viewportHeight - height - 8;
    if (top < 8) top = 8;
    return { left: left, top: top };
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
  /**
   * 统一会话动作目录（P0-3）。
   * 面板右键菜单、侧栏原生行菜单、侧栏行操作按钮都从这一张表取 id / 文案 / 顺序，
   * 避免三处各写一套导致漂移。`sidebarMenu` / `sidebarRow` 标记该动作是否也挂到侧栏。
   */
  var SESSION_ACTION_DEFS = [
    { id: 'open', labelKey: 'menu.openSession', order: 10 },
    { id: 'terminal', labelKey: 'menu.openTerminal', order: 20, needsCwd: true, sidebarMenu: true, sidebarRow: true, groupStart: true },
    { id: 'open-with', labelKey: 'menu.openWith', order: 30, needsCwd: true, sidebarMenu: true },
    { id: 'copy-id', labelKey: 'menu.copyId', order: 40, separatorBefore: true },
    { id: 'copy-title', labelKey: 'menu.copyTitle', order: 50, sidebarMenu: true },
    { id: 'copy-prompt', labelKey: 'menu.copyPrompt', order: 60 },
    { id: 'copy-cwd', labelKey: 'menu.copyCwd', order: 70, needsCwd: true, sidebarMenu: true },
    { id: 'pin', labelKey: 'menu.pin', order: 80, separatorBefore: true },
    { id: 'rename', labelKey: 'menu.rename', order: 90 },
    { id: 'fork', labelKey: 'menu.fork', order: 100 },
    { id: 'download', labelKey: 'menu.downloadLog', order: 110, separatorBefore: true, sidebarMenu: true },
    { id: 'archive', labelKey: 'menu.archive', order: 120, separatorBefore: true, danger: true },
    { id: 'restore', labelKey: 'menu.unarchive', order: 130, separatorBefore: true, archivedOnly: true },
  ];
  var SESSION_ACTION_BY_ID = {};
  for (var _sa = 0; _sa < SESSION_ACTION_DEFS.length; _sa += 1) {
    SESSION_ACTION_BY_ID[SESSION_ACTION_DEFS[_sa].id] = SESSION_ACTION_DEFS[_sa];
  }

  /** 侧栏行菜单/行按钮共用的会话摘要读取（依赖宿主注入 useSessions）。 */
  function sidebarSummaryOf(props, sessionId) {
    try {
      if (!props || typeof props.useSessions !== 'function') return undefined;
      return props.useSessions(function (state) {
        return state && state.byId ? state.byId[sessionId] : undefined;
      });
    } catch (ignored) { return undefined; }
  }

  /** 侧栏动作共用执行器：只做不依赖面板状态的轻量动作。 */
  function runSidebarSessionAction(actionId, ctx, sessionId, displayTitle, summary) {
    var path = summary && typeof summary.cwd === 'string' ? summary.cwd : '';
    if (actionId === 'terminal') {
      if (!isAbsolutePath(path) || typeof fetch !== 'function') return false;
      try {
        fetch('activity-heat/open-terminal', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ path: path }),
        });
      } catch (ignored) { /* 静默：侧栏无面板级 toast */ }
      return true;
    }
    if (actionId === 'copy-title') {
      copyText(displayTitle || sessionId);
      return true;
    }
    if (actionId === 'copy-cwd') {
      if (path) copyText(path);
      return true;
    }
    if (actionId === 'download') {
      downloadSessionLog(sessionId);
      return true;
    }
    return false;
  }

  /** 侧栏会话行菜单里的一行：点击后关闭宿主菜单并执行对应动作。 */
  /**
   * 侧栏行菜单动作图标：与宿主原生菜单同规格（16px、1.4 描边、currentColor），
   * 不用 emoji、不写死颜色（DESIGN.md §2 / PITFALLS.md「图标不要用 emoji」）。
   */
  function SidebarActionIcon(actionId, size) {
    var s = typeof size === 'number' && size > 0 ? size : 16;
    var shared = {
      width: s, height: s, viewBox: '0 0 16 16', fill: 'none',
      stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round',
      'aria-hidden': 'true', style: { display: 'block', flex: 'none' },
    };
    if (actionId === 'copy-title') {
      return React.createElement('svg', shared,
        React.createElement('rect', { x: 5.5, y: 5.5, width: 8, height: 8, rx: 1.2 }),
        React.createElement('path', { d: 'M10.5 5.5v-2a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2' }),
      );
    }
    if (actionId === 'copy-cwd') {
      return React.createElement('svg', shared,
        React.createElement('path', { d: 'M2.5 4.6a1 1 0 0 1 1-1h3l1.4 1.5h4.6a1 1 0 0 1 1 1v5.8a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1z' }),
      );
    }
    if (actionId === 'download') {
      return React.createElement('svg', shared,
        React.createElement('path', { d: 'M8 2.5v7.2M5.4 7.2 8 9.8l2.6-2.6M3 12.7h10' }),
      );
    }
    if (actionId === 'open-with') {
      // 「在其他应用中打开」：方框 + 右上外部箭头
      return React.createElement('svg', shared,
        React.createElement('path', { d: 'M9.5 2.5h4v4' }),
        React.createElement('path', { d: 'M13.5 2.5 7.8 8.2' }),
        React.createElement('path', { d: 'M12 9.5v3a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3' }),
      );
    }
    // terminal（默认）
    return React.createElement('svg', shared,
      React.createElement('path', { d: 'M2.5 3.5h11v9h-11z' }),
      React.createElement('path', { d: 'M4.6 6.4l2 1.6-2 1.6M8.2 9.6h3.2' }),
    );
  }

  function makeSidebarMenuRow(def) {
    var actionId = def.id;
    function SidebarMenuRow(props) {
      var summary = sidebarSummaryOf(props, props.sessionId);
      var path = summary && typeof summary.cwd === 'string' ? summary.cwd : '';
      var disabled = def.needsCwd === true && !isAbsolutePath(path);
      if (actionId === 'copy-title' && !(props && props.displayTitle)) disabled = true;
      var closeMenu = function () {
        try {
          if (props && typeof props.useMenuOpenState === 'function') {
            var pair = props.useMenuOpenState();
            if (pair && typeof pair[1] === 'function') pair[1](false);
          }
        } catch (ignored) { /* 宿主菜单不可控时忽略 */ }
      };
      var activate = function (event) {
        if (disabled) return;
        var rect = null;
        try {
          if (event && event.currentTarget && typeof event.currentTarget.getBoundingClientRect === 'function') {
            rect = event.currentTarget.getBoundingClientRect();
          }
        } catch (ignored) { rect = null; }
        closeMenu();
        if (actionId === 'open-with') {
          openSidebarOpenWith(path, rect);
          return;
        }
        runSidebarSessionAction(actionId, props && props.ctx, props.sessionId, props && props.displayTitle, summary);
      };
      return React.createElement('button', {
        type: 'button',
        role: 'menuitem',
        className: def.groupStart === true ? 'ah-side-action ah-side-action--group' : 'ah-side-action',
        'aria-disabled': disabled ? 'true' : undefined,
        onClick: activate,
        style: {
          display: 'flex', alignItems: 'center', width: '100%', gap: 8,
          minHeight: 32, boxSizing: 'border-box',
          padding: '6px 8px', border: 'none', borderRadius: 6, background: 'transparent',
          color: 'var(--dsw-alias-label-primary, inherit)',
          font: 'inherit', fontSize: 'inherit', lineHeight: '20px',
          textAlign: 'left', whiteSpace: 'nowrap',
          cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.45 : 1,
        },
      }, [
        SidebarActionIcon(actionId, 16),
        React.createElement('span', { key: 'label', style: { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' } }, tt(def.labelKey)),
      ]);
    }
    return SidebarMenuRow;
  }

  /** 侧栏会话行尾的「在终端中打开」图标按钮。 */
  function SidebarTerminalRowAction(props) {
    var summary = sidebarSummaryOf(props, props && props.sessionId);
    var path = summary && typeof summary.cwd === 'string' ? summary.cwd : '';
    var disabled = !isAbsolutePath(path);
    return React.createElement('button', {
      type: 'button',
      className: 'ah-side-row-action',
      'aria-label': tt('menu.openTerminal'),
      title: tt('menu.openTerminal'),
      'aria-disabled': disabled ? 'true' : undefined,
      onClick: function (event) {
        try { if (event && typeof event.stopPropagation === 'function') event.stopPropagation(); } catch (ignored) {}
        if (disabled) return;
        runSidebarSessionAction('terminal', props && props.ctx, props.sessionId, props && props.displayTitle, summary);
      },
      style: {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 24, height: 24, padding: 0, border: 'none', borderRadius: 6,
        background: 'transparent', color: 'var(--dsw-alias-label-secondary)',
        cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.4 : 1, flex: 'none',
      },
    }, SidebarActionIcon('terminal', 14));
  }

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
    // 终端模拟器 + 能在指定目录开 shell 的环境（Git Bash / WSL 打开的是终端，不是编辑器）
    terminal: true, windowsterminal: true, iterm: true,
    warp: true, ghostty: true, kitty: true, gnometerminal: true, konsole: true,
    gitbash: true, wsl: true,
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

  /* ---------------- 在其他应用中打开：共享数据与浮层 ---------------- */

  var OPEN_WITH_APPS_ROUTE = 'activity-heat/open-with/apps';
  var OPEN_WITH_OPEN_ROUTE = 'activity-heat/open-with/open';
  var OPEN_WITH_FALLBACK_APPS_ROUTE = 'open-in-app/apps';

  var openWithAppsCache = null;
  var openWithAppsLoading = null;

  function normalizeAppList(value) {
    if (!Array.isArray(value)) return null;
    var out = [];
    for (var i = 0; i < value.length; i += 1) {
      if (typeof value[i] === 'string' && value[i] !== '') out.push(value[i]);
    }
    return out;
  }

  function fetchAppList(url) {
    return new Promise(function (resolve) {
      try {
        if (typeof fetch !== 'function') { resolve(null); return; }
        fetch(url).then(function (response) {
          return response && response.ok && typeof response.json === 'function'
            ? response.json()
            : null;
        }).then(function (body) {
          resolve(body && Array.isArray(body.apps) ? normalizeAppList(body.apps) : null);
        }, function () { resolve(null); });
      } catch (ignored) { resolve(null); }
    });
  }

  /** 探测应用列表：优先本插件 Host 路由，失败回退旧宿主 open-in-app（避免退化）。 */
  function loadOpenWithApps() {
    if (openWithAppsCache) return Promise.resolve(openWithAppsCache);
    if (openWithAppsLoading) return openWithAppsLoading;
    openWithAppsLoading = fetchAppList(OPEN_WITH_APPS_ROUTE).then(function (primary) {
      if (primary && primary.length > 0) return primary;
      return fetchAppList(OPEN_WITH_FALLBACK_APPS_ROUTE).then(function (fallback) {
        return fallback || [];
      });
    }).then(function (list) {
      openWithAppsCache = list || [];
      openWithAppsLoading = null;
      return openWithAppsCache;
    }, function () {
      openWithAppsCache = [];
      openWithAppsLoading = null;
      return openWithAppsCache;
    });
    return openWithAppsLoading;
  }

  /** 请求在一个应用中打开目录（Host 回报真实成败），返回 Promise<boolean>。 */
  function openInAppRequest(appId, path) {
    try {
      if (typeof fetch !== 'function' || !isAbsolutePath(path)) return Promise.resolve(false);
      return fetch(OPEN_WITH_OPEN_ROUTE, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ app: appId, path: path }),
      }).then(function (response) {
        return Boolean(response && response.ok);
      }, function () { return false; });
    } catch (ignored) { return Promise.resolve(false); }
  }

  /** 请求在系统终端打开目录（Host 路由），返回 Promise<boolean>。 */
  function openTerminalRequest(path) {
    try {
      if (typeof fetch !== 'function' || !isAbsolutePath(path)) return Promise.resolve(false);
      return fetch('activity-heat/open-terminal', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ path: path }),
      }).then(function (response) {
        return Boolean(response && response.ok);
      }, function () { return false; });
    } catch (ignored) { return Promise.resolve(false); }
  }

  /**
   * 统一的「打开方式」菜单项构建器：终端固定第一项，其余按
   * 文件管理器 → 编辑器 → 终端 → 其他 分组。面板子菜单与侧栏浮层共用，避免两套漂移。
   * opts: { onNotify(text, tone), onClose() }。
   */
  function buildOpenWithMenuItems(path, apps, opts) {
    opts = opts || {};
    var canOpen = isAbsolutePath(path);
    var notifier = typeof opts.onNotify === 'function' ? opts.onNotify : function () {};
    var closer = typeof opts.onClose === 'function' ? opts.onClose : function () {};
    var items = [{
      id: 'terminal',
      label: tt('menu.openTerminal'),
      disabled: !canOpen,
      hint: !canOpen ? tt('menu.openWithNoPath') : undefined,
      onSelect: function () {
        closer();
        openTerminalRequest(path).then(function (ok) {
          if (ok) notifier(tt('toast.terminalOpened'));
          else notifier(tt('error.openTerminal'), 'error');
        });
      },
    }];
    var ordered = (apps || []).filter(function (id) {
      return typeof id === 'string' && id !== '';
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
        disabled: !canOpen,
        onSelect: function () {
          closer();
          openInAppRequest(id, path).then(function (ok) {
            if (ok) notifier(tt('toast.openedWith', { app: appLabelOf(id) }));
            else notifier(tt('error.openWith'), 'error');
          });
        },
      });
      lastGroup = group;
    });
    return items;
  }

  /* 侧栏二级浮层：模块级 store（宿主菜单关闭后浮层仍存活）+ 常驻宿主组件渲染。 */
  var openWithLayerState = null;
  var openWithLayerSubs = [];
  function notifyOpenWithLayer() {
    for (var i = 0; i < openWithLayerSubs.length; i += 1) {
      try { openWithLayerSubs[i](); } catch (ignored) { /* ignore */ }
    }
  }
  function openOpenWithLayer(state) { openWithLayerState = state; notifyOpenWithLayer(); }
  function closeOpenWithLayer() { openWithLayerState = null; notifyOpenWithLayer(); }
  function useOpenWithLayer() {
    var tick = React.useState(0);
    React.useEffect(function () {
      var bump = function () { tick[1](function (n) { return n + 1; }); };
      openWithLayerSubs.push(bump);
      return function () {
        var at = openWithLayerSubs.indexOf(bump);
        if (at >= 0) openWithLayerSubs.splice(at, 1);
      };
    }, []);
    return openWithLayerState;
  }

  /* 侧栏没有 PanelToast，给浮层动作补一条跟随的轻提示。 */
  var openWithToastState = null;
  var openWithToastSubs = [];
  var openWithToastTimer = null;
  function notifyOpenWithToast() {
    for (var i = 0; i < openWithToastSubs.length; i += 1) {
      try { openWithToastSubs[i](); } catch (ignored) { /* ignore */ }
    }
  }
  function showOpenWithToast(text, tone) {
    openWithToastState = { text: text, tone: tone === 'error' ? 'error' : 'info' };
    notifyOpenWithToast();
    if (openWithToastTimer) { try { clearTimeout(openWithToastTimer); } catch (ignored) { /* ignore */ } }
    openWithToastTimer = setTimeout(function () {
      openWithToastState = null;
      openWithToastTimer = null;
      notifyOpenWithToast();
    }, tone === 'error' ? 5000 : 3000);
  }
  function useOpenWithToast() {
    var tick = React.useState(0);
    React.useEffect(function () {
      var bump = function () { tick[1](function (n) { return n + 1; }); };
      openWithToastSubs.push(bump);
      return function () {
        var at = openWithToastSubs.indexOf(bump);
        if (at >= 0) openWithToastSubs.splice(at, 1);
      };
    }, []);
    return openWithToastState;
  }

  /** 侧栏点击「在其他应用中打开…」：先关闭宿主菜单，再在点击位置弹出浮层。 */
  function openSidebarOpenWith(path, anchorRect) {
    if (!isAbsolutePath(path)) return;
    loadOpenWithApps().then(function (apps) {
      var items = buildOpenWithMenuItems(path, apps, { onNotify: showOpenWithToast, onClose: closeOpenWithLayer });
      var width = MENU_WIDTH;
      var height = menuHeightOf(items);
      var x = anchorRect && typeof anchorRect.right === 'number' ? anchorRect.right + 4 : 12;
      var y = anchorRect && typeof anchorRect.top === 'number' ? anchorRect.top : 12;
      var pos = menuPosition(x, y, width, height);
      openOpenWithLayer({ items: items, x: pos.left, y: pos.top });
    });
  }

  /** 常驻宿主：渲染侧栏浮层 + 轻提示（挂在 HeatRing 上，侧栏可见时常驻）。 */
  function OpenWithLayerHost() {
    var layer = useOpenWithLayer();
    var toast = useOpenWithToast();
    var nodes = [];
    if (layer) {
      nodes.push(React.createElement(ContextMenu, {
        key: 'layer',
        open: true,
        items: layer.items,
        x: layer.x,
        y: layer.y,
        label: tt('openWith.title'),
        onClose: closeOpenWithLayer,
      }));
    }
    if (toast) {
      nodes.push(React.createElement(PanelToast, { key: 'toast', open: true, toast: toast }));
    }
    if (nodes.length === 0) return null;
    return React.createElement(React.Fragment, null, nodes);
  }

  /* ---------------- 侧栏原生会话菜单：contextMenus 数据动作 ----------------

   * 迁移原因（用户 2026-11-06 提出）：
   *   1) 旧 `sidebar.workspaces.session.menu.item` 是自绘组件行（ah-side-action），
   *      图标 / 字号 / 高度 / 间距 / hover 与宿主原生菜单项对不上；
   *   2) 侧栏「在其他应用中打开…」只能点击后关菜单再弹自绘浮层（二次点击）。
   * 改用宿主 `contextMenus` 菜单服务后：动作由宿主同一套 Menu 渲染（与原生项完全同源），
   * `children` 由宿主转换成原生二级级联子菜单（hover 展开，无需二次点击）。
   * 注意红线：不 require 任何 Harness Client 包（DESIGN §2 / PITFALLS 一.6），只通过
   * `ctx.get('contextMenus')` 使用服务；服务缺失时回退旧的自绘组件项。
   */

  /** 已解析到的 contextMenus 服务（供动作回调里的 notify 使用）。 */
  var sessionMenuService = null;
  /** resolve 时读取会话 cwd/标题需要 ctx。 */
  var sessionMenuCtx = null;
  /** 图标 key → SidebarActionIcon 的动作 id。 */
  var SESSION_MENU_ICONS = {
    'activity-heat.terminal': 'terminal',
    'activity-heat.open-with': 'open-with',
    'activity-heat.copy-title': 'copy-title',
    'activity-heat.copy-cwd': 'copy-cwd',
    'activity-heat.download': 'download',
    'activity-heat.app': 'open-with',
  };

  function safeCtxGet(ctx, name) {
    try { return ctx && typeof ctx.get === 'function' ? ctx.get(name) : undefined; } catch (ignored) { return undefined; }
  }

  /** 从宿主 sessions 服务快照读会话摘要（cwd 等）；拿不到返回 undefined。 */
  function sessionSummaryOfService(sessionId) {
    var sessions = safeCtxGet(sessionMenuCtx, 'sessions');
    var list = sessions && sessions.list;
    if (!list) return undefined;
    try {
      var snap = typeof list.getSnapshot === 'function' ? list.getSnapshot() : undefined;
      return snap && snap.byId ? snap.byId[sessionId] : undefined;
    } catch (ignored) { return undefined; }
  }

  function notifySessionMenu(text, ok) {
    try {
      if (sessionMenuService && typeof sessionMenuService.notify === 'function') {
        sessionMenuService.notify(text, ok === true);
      }
    } catch (ignored) { /* 提示失败不影响动作 */ }
  }

  function runTerminalMenuAction(path) {
    openTerminalRequest(path).then(function (ok) {
      notifySessionMenu(ok ? tt('toast.terminalOpened') : tt('error.openTerminal'), ok);
    });
  }

  function runOpenInAppMenuAction(appId, path) {
    openInAppRequest(appId, path).then(function (ok) {
      notifySessionMenu(ok ? tt('toast.openedWith', { app: appLabelOf(appId) }) : tt('error.openWith'), ok);
    });
  }

  /**
   * 「在其他应用中打开」的二级动作：终端固定第一项，其余按
   * 文件管理器 → 编辑器 → 终端 → 其他 分组，组间加分隔线。
   */
  function buildOpenWithContextActions(path) {
    var canOpen = isAbsolutePath(path);
    var out = [{
      id: 'terminal',
      label: tt('menu.openTerminal'),
      icon: { key: 'activity-heat.terminal' },
      disabled: !canOpen,
      run: function () { runTerminalMenuAction(path); },
    }];
    var ordered = (openWithAppsCache || []).filter(function (id) {
      return typeof id === 'string' && id !== '';
    }).slice().sort(function (a, b) {
      return openWithGroupRank(a) - openWithGroupRank(b);
    });
    var lastGroup = -1;
    ordered.forEach(function (id) {
      var group = openWithGroupRank(id);
      out.push({
        id: 'app-' + id,
        label: tt('openWith.item', { app: appLabelOf(id) }),
        icon: { key: 'activity-heat.app' },
        separatorBefore: lastGroup !== -1 && group !== lastGroup,
        disabled: !canOpen,
        run: function () { runOpenInAppMenuAction(id, path); },
      });
      lastGroup = group;
    });
    return out;
  }

  /** 会话 target → 5 个插件动作（宿主每次打开菜单时调用 resolve）。 */
  function resolveSessionMenuActions(target) {
    var sessionId = target && target.sessionId;
    var summary = sessionSummaryOfService(sessionId);
    var path = summary && typeof summary.cwd === 'string' ? summary.cwd : '';
    var canCwd = isAbsolutePath(path);
    var title = target && target.displayTitle ? String(target.displayTitle) : '';
    return [
      {
        id: 'terminal',
        label: tt('menu.openTerminal'),
        icon: { key: 'activity-heat.terminal' },
        disabled: !canCwd,
        run: function () { runTerminalMenuAction(path); },
      },
      {
        id: 'open-with',
        label: tt('menu.openWith'),
        icon: { key: 'activity-heat.open-with' },
        disabled: !canCwd,
        children: buildOpenWithContextActions(path),
      },
      {
        id: 'copy-title',
        label: tt('menu.copyTitle'),
        icon: { key: 'activity-heat.copy-title' },
        disabled: !title,
        run: function () {
          copyText(title).then(function (ok) {
            notifySessionMenu(ok ? tt('toast.copied') : tt('menu.unavailable'), ok);
          });
        },
      },
      {
        id: 'copy-cwd',
        label: tt('menu.copyCwd'),
        icon: { key: 'activity-heat.copy-cwd' },
        disabled: !path,
        run: function () {
          copyText(path).then(function (ok) {
            notifySessionMenu(ok ? tt('toast.copied') : tt('menu.unavailable'), ok);
          });
        },
      },
      {
        id: 'download',
        label: tt('menu.downloadLog'),
        icon: { key: 'activity-heat.download' },
        run: function () {
          downloadSessionLog(sessionId).then(function (ok) {
            if (!ok) notifySessionMenu(tt('menu.unavailable'), false);
          });
        },
      },
    ];
  }

  /** 把图标 key 注册到宿主 contextMenu.icon（复用现有内联 SVG，不引宿主包）。 */
  function registerSessionMenuIcons(slots) {
    Object.keys(SESSION_MENU_ICONS).forEach(function (key) {
      var actionId = SESSION_MENU_ICONS[key];
      try {
        slots.inject('contextMenu.icon', function () {
          try {
            return slots.register({ name: 'contextMenu.icon', key: key }, function SessionMenuIcon() {
              return SidebarActionIcon(actionId, 16);
            });
          } catch (ignored) { return undefined; }
        });
      } catch (ignored) { /* 老宿主没有该席位时跳过 */ }
    });
  }

  /**
   * 服务优先安装会话菜单：拿到 contextMenus 就注册数据动作；等不到（老宿主）才
   * 调用 onFallback 注册旧的自绘组件项。任何异常都吞掉，绝不影响其它席位。
   */
  function installSessionMenu(ctx, slots, onFallback) {
    sessionMenuCtx = ctx;
    var tries = 0;
    function attempt() {
      var cm = safeCtxGet(ctx, 'contextMenus');
      if (cm && typeof cm.register === 'function') {
        sessionMenuService = cm;
        try {
          var run = function () {
            return cm.register({
              id: 'activity-heat.session',
              target: 'session',
              order: 510,
              resolve: resolveSessionMenuActions,
            });
          };
          if (typeof ctx.effect === 'function') ctx.effect(run, 'activity-heat: session menu');
          else run();
          if (slots) registerSessionMenuIcons(slots);
          try { loadOpenWithApps(); } catch (ignored) { /* 预取失败不影响菜单 */ }
          return;
        } catch (error) {
          ahWarn('[activity-heat] contextMenus.register failed:', error && error.message);
        }
      }
      tries += 1;
      if (tries > 90) { if (onFallback) onFallback(); return; }
      var raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : null;
      if (raf) { raf(attempt); return; }
      if (typeof setTimeout === 'function') { setTimeout(attempt, 16); return; }
      if (onFallback) onFallback();
    }
    attempt();
  }

  /* ---------------- 右键菜单：组件 ---------------- */

  function ContextMenu(props) {
    var items = props && Array.isArray(props.items) ? props.items : [];
    var open = Boolean(props && props.open);
    var activeState = React.useState(firstEnabledIndex(items));
    var active = activeState[0];
    var setActive = activeState[1];
    var surfaceRef = React.useRef ? React.useRef(null) : { current: null };
    var itemRefs = React.useRef ? React.useRef([]) : { current: [] };
    var submenuState = React.useState(null);
    var submenu = submenuState[0];
    var setSubmenu = submenuState[1];

    /* 级联菜单「安全三角 + 三层延时」（手册 002）：
       - 打开延时 220ms；安全窗口每 80ms 复查、满 1200ms 也切换；离开菜单 360ms 后关闭。
       - 三角区：以「上一刻」指针为顶点，连到子菜单近边的上下两角；区内移动不误切。 */
    var cascadeRef = React.useRef ? React.useRef(null) : { current: null };
    if (!cascadeRef.current) {
      cascadeRef.current = { openTimer: 0, safeTimer: 0, safeTick: 0, closeTimer: 0, pending: null, history: [] };
    }
    var CASC = cascadeRef.current;
    function clearOne(name) {
      if (CASC[name]) { try { clearTimeout(CASC[name]); } catch (ignored) {} CASC[name] = 0; }
    }
    function clearAllTimers() {
      clearOne('openTimer'); clearOne('safeTimer'); clearOne('closeTimer');
      if (CASC.safeTick) { try { clearInterval(CASC.safeTick); } catch (ignored) {} CASC.safeTick = 0; }
      CASC.pending = null;
    }
    function recordPointer(x, y) {
      CASC.history.push({ x: x, y: y });
      if (CASC.history.length > 2) CASC.history.shift();
    }
    function pointInTriangle(px, py, a, b, c) {
      var d1 = (px - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (py - b[1]);
      var d2 = (px - c[0]) * (b[1] - c[1]) - (b[0] - c[0]) * (py - c[1]);
      var d3 = (px - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (py - a[1]);
      var neg = d1 < 0 || d2 < 0 || d3 < 0;
      var pos = d1 > 0 || d2 > 0 || d3 > 0;
      return !(neg && pos);
    }
    function inSafeZone(px, py) {
      if (!submenu) return false;
      var h = CASC.history;
      if (h.length < 2) return false;
      var apex = h[h.length - 2];                       // 用「上一刻」位置，避免三角塌陷
      var r = { x: submenu.x, y: submenu.y, w: MENU_WIDTH, h: menuHeightOf(submenu.items) };
      var nearX = (apex.x < r.x + r.w / 2) ? r.x : r.x + r.w; // 子菜单在右→近边左沿；在左→近边右沿
      return pointInTriangle(px, py,
        [apex.x, apex.y], [nearX, r.y], [nearX, r.y + r.h]);
    }
    function cancelSafe() {
      clearOne('safeTimer');
      if (CASC.safeTick) { try { clearInterval(CASC.safeTick); } catch (ignored) {} CASC.safeTick = 0; }
      CASC.pending = null;
    }
    function scheduleOpen(index, element, subItems, delay) {
      clearOne('openTimer');
      var d = delay === undefined ? 220 : delay;
      CASC.openTimer = setTimeout(function () { CASC.openTimer = 0; openSubmenu(index, element, subItems); }, d);
    }
    function onItemHover(index, item, event) {
      var el = event && event.currentTarget;
      var hasPt = event && typeof event.clientX === 'number';
      if (hasPt) recordPointer(event.clientX, event.clientY);
      setActive(index);
      var hasSub = Boolean(item && item.submenu && item.submenu.length);
      var touch = event && event.pointerType === 'touch';
      if (hasSub) {
        // 子菜单已开、且指针在安全三角内：先不切，等离开三角或满 1200ms 再切
        if (submenu && hasPt && inSafeZone(event.clientX, event.clientY)) {
          CASC.pending = { index: index, element: el, items: item.submenu };
          if (!CASC.safeTick && typeof setInterval === 'function') {
            CASC.safeTick = setInterval(function () {
              var last = CASC.history[CASC.history.length - 1];
              var p = CASC.pending;
              if (!p) { try { clearInterval(CASC.safeTick); } catch (ignored) {} CASC.safeTick = 0; return; }
              if (last && !inSafeZone(last.x, last.y)) {
                try { clearInterval(CASC.safeTick); } catch (ignored) {} CASC.safeTick = 0;
                CASC.pending = null; clearOne('safeTimer'); openSubmenu(p.index, p.element, p.items);
              }
            }, 80);
          }
          clearOne('safeTimer');
          CASC.safeTimer = setTimeout(function () {
            CASC.safeTimer = 0;
            var p = CASC.pending; CASC.pending = null;
            if (CASC.safeTick) { try { clearInterval(CASC.safeTick); } catch (ignored) {} CASC.safeTick = 0; }
            if (p) openSubmenu(p.index, p.element, p.items);
          }, 1200);
          return;
        }
        cancelSafe();
        if (touch) { openSubmenu(index, el, item.submenu); return; }
        scheduleOpen(index, el, item.submenu, 220);
      } else {
        cancelSafe();
        clearOne('openTimer');
        if (submenu) {
          CASC.openTimer = setTimeout(function () { CASC.openTimer = 0; setSubmenu(null); }, touch ? 0 : 220);
        }
      }
    }

    function openSubmenu(index, element, subItems) {
      if (!subItems || subItems.length === 0) return;
      cancelSafe(); clearOne('openTimer');
      var rect = element && typeof element.getBoundingClientRect === 'function'
        ? element.getBoundingClientRect()
        : { left: 0, right: 0, top: 0, bottom: 0 };
      var position = submenuPosition(rect, MENU_WIDTH, menuHeightOf(subItems));
      setSubmenu({ index: index, items: subItems, x: position.left, y: position.top });
    }

    // 外部点击 / 滚动 / 缩放都要关闭；portal 到 body 后这些事件不会冒泡进列表。
    React.useEffect(function () {
      if (!open) return undefined;
      var onPointer = function (event) {
        var surface = surfaceRef.current;
        if (surface && surface.contains && event && event.target && surface.contains(event.target)) return;
        // 点在任意一层菜单（含子菜单）里都不关闭父层，由那一层自己处理
        if (event && event.target && typeof event.target.closest === 'function'
          && event.target.closest('[data-ah-menu]')) return;
        if (props.onClose) props.onClose();
      };
      // 菜单自己滚（应用多时）不能把自己关掉；只有外层列表/页面滚动才关闭
      var onScroll = function (event) {
        var surface = surfaceRef.current;
        if (surface && event && event.target && surface.contains && surface.contains(event.target)) return;
        // 子菜单自己滚动时不要关掉父菜单
        if (event && event.target && typeof event.target.closest === 'function'
          && event.target.closest('[data-ah-menu]')) return;
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
        clearAllTimers();
      };
    }, [open]);

    React.useEffect(function () {
      if (!open) return;
      // 每次打开都从干净状态开始：清掉残留子菜单、从第一个可用项高亮
      setSubmenu(null);
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
        if (submenu) { setSubmenu(null); return; }
        if (props.onClose) props.onClose();
        return;
      }
      if (key === 'ArrowRight') {
        var subItem = items[active];
        if (subItem && subItem.submenu && subItem.submenu.length) {
          event.preventDefault();
          openSubmenu(active, itemRefs.current[active], subItem.submenu);
        }
        return;
      }
      if (key === 'ArrowLeft') {
        if (submenu) { event.preventDefault(); setSubmenu(null); }
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
        if (!item || item.disabled) return;
        if (item.submenu && item.submenu.length) {
          openSubmenu(active, itemRefs.current[active], item.submenu);
          return;
        }
        if (item.onSelect) item.onSelect();
        return;
      }
      if (key === 'Tab' && props.onClose) props.onClose();
    }

    var nodes = [];
    for (var index = 0; index < items.length; index += 1) {
      var item = items[index];
      var hasSubmenu = Boolean(item.submenu && item.submenu.length);
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
        ref: function (position) {
          return function (element) { itemRefs.current[position] = element; };
        }(index),
        'aria-disabled': item.disabled ? 'true' : undefined,
        'aria-haspopup': hasSubmenu ? 'menu' : undefined,
        'aria-expanded': hasSubmenu && submenu && submenu.index === index ? 'true' : undefined,
        'data-danger': item.danger ? 'true' : undefined,
        'data-active': index === active ? 'true' : 'false',
        className: AH.menuItem,
        onClick: function (selected, position) {
          return function (event) {
            if (selected.disabled) return;
            if (selected.submenu && selected.submenu.length) {
              openSubmenu(position, event && event.currentTarget, selected.submenu);
              return;
            }
            if (selected.onSelect) selected.onSelect();
          };
        }(item, index),
        onMouseEnter: function (hovered, selected, position) {
          return function (event) {
            onItemHover(hovered, selected, event);
          };
        }(index, item, index),
      }, [
        React.createElement('span', { key: 'label', className: AH.menuLabel }, item.label),
        hasSubmenu
          ? React.createElement('span', { key: 'arrow', className: AH.menuArrow, 'aria-hidden': 'true' }, '›')
          : (item.hint
            ? React.createElement('span', { key: 'hint', className: AH.menuHint }, item.hint)
            : null),
      ]));
    }

    var surface = React.createElement('div', {
      ref: surfaceRef,
      role: 'menu',
      tabIndex: -1,
      'aria-activedescendant': 'ah-menu-active',
      'aria-label': props.label,
      'data-ah-menu': 'true',
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
      onPointerMove: function (event) {
        if (event && typeof event.clientX === 'number') recordPointer(event.clientX, event.clientY);
      },
      onMouseEnter: function () { clearOne('closeTimer'); },
      onMouseLeave: function (event) {
        var rt = event && event.relatedTarget;
        if (rt && typeof rt.closest === 'function' && rt.closest('[data-ah-menu]')) return;
        clearOne('closeTimer');
        CASC.closeTimer = setTimeout(function () {
          CASC.closeTimer = 0;
          if (props.onClose) props.onClose();
        }, 360);
      },
    }, nodes);

    var layer = portalLayer(surface);
    if (!submenu) return layer;

    var subLayer = React.createElement(ContextMenu, {
      open: true,
      items: submenu.items,
      x: submenu.x,
      y: submenu.y,
      label: tt('openWith.title'),
      onClose: function () { setSubmenu(null); },
    });
    return React.createElement(React.Fragment, null, layer, subLayer);
  }

  function ConfirmArchive(props) {
    if (!props || !props.open) return null;
    var pending = props.pending === true;
    var stop = props.stop === true;
    var activity = Array.isArray(props.activity) ? props.activity : [];
    var session = props.session || {};
    var title = session.title || session.id || '';
    return portalLayer(React.createElement('div', {
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': tt(stop ? 'dialog.stopArchiveTitle' : 'dialog.archiveTitle'),
      className: AH.dialog,
    }, [
      React.createElement('div', { key: 'title', className: AH.dialogTitle },
        tt(stop ? 'dialog.stopArchiveTitle' : 'dialog.archiveTitle')),
      React.createElement('div', { key: 'body', className: AH.dialogText },
        tt(stop ? 'dialog.stopArchiveBody' : 'dialog.archiveBody', { title: title })),
      activity.length > 0
        ? React.createElement('div', { key: 'activity', className: AH.dialogText, style: { marginTop: 6 } }, [
            React.createElement('div', { key: 'label', style: { fontWeight: 600, marginBottom: 4 } }, tt('dialog.activityTitle')),
            React.createElement('ul', { key: 'list', style: { margin: 0, paddingLeft: 18 } },
              activity.slice(0, 8).map(function (line, index) {
                return React.createElement('li', { key: index, style: { lineHeight: '18px' } }, line);
              })),
          ])
        : null,
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
        }, pending
          ? tt(stop ? 'dialog.stopping' : 'dialog.archiving')
          : tt(stop ? 'dialog.stopArchiveConfirm' : 'dialog.archiveConfirm')),
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

  /* 背景与外观配置中心：背景 embed 代码 + 中间层颜色/不透明度/模糊度。 */
  function SettingsDialog(props) {
    var jsonState = React.useState('');
    var jsonText = jsonState[0];
    var setJson = jsonState[1];
    if (!props || !props.open) return null;
    var v = props.value || {};
    var alpha = v.scrimOpacity == null ? 0.45 : Number(v.scrimOpacity);
    var blur = v.scrimBlur == null ? 10 : Number(v.scrimBlur);
    var gap = v.cardGap == null ? 12 : Number(v.cardGap);
    var radius = v.cardRadius == null ? 12 : Number(v.cardRadius);
    var bgOpacity = v.bgOpacity == null ? 1 : Number(v.bgOpacity);
    var set = function (patch) { if (props.onChange) props.onChange(Object.assign({}, v, patch)); };
    var rowStyle = { display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, fontSize: '0.78em', color: 'var(--dsw-alias-label-secondary)' };
    var valStyle = { width: 46, textAlign: 'right' };
    var doExport = function () {
      try {
        var out = {
          bgEnabled: v.bgEnabled !== false,
          bgEmbed: v.bgEmbed || '',
          scrimColor: v.scrimColor || '#ffffff',
          scrimOpacity: v.scrimOpacity == null ? 0.45 : Number(v.scrimOpacity),
          scrimBlur: v.scrimBlur == null ? 10 : Number(v.scrimBlur),
          cardGap: v.cardGap == null ? 12 : Number(v.cardGap),
          cardRadius: v.cardRadius == null ? 12 : Number(v.cardRadius),
          bgOpacity: v.bgOpacity == null ? 1 : Number(v.bgOpacity),
        };
        var text = JSON.stringify(out, null, 2);
        setJson(text);
        try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text); } catch (ignored) {}
      } catch (ignored) { /* ignore */ }
    };
    var doImport = function () {
      try {
        var obj = JSON.parse(jsonText);
        if (obj && typeof obj === 'object' && props.onImport) props.onImport(obj);
      } catch (ignored) { /* 非法 JSON 忽略 */ }
    };
    return portalLayer(React.createElement('div', {
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': '背景与外观设置',
      className: AH.dialog,
      style: { width: 'min(480px, calc(100vw - 32px))', maxHeight: 'min(84vh, 720px)', overflowY: 'auto' },
    }, [
      React.createElement('div', { key: 'title', className: AH.dialogTitle }, '背景与外观设置'),
      React.createElement('label', { key: 'enable-row', style: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: '0.8em', cursor: 'pointer', color: 'var(--dsw-alias-label-secondary)' } }, [
        React.createElement('input', { key: 'cb', type: 'checkbox', checked: v.bgEnabled !== false, onChange: function (e) { set({ bgEnabled: !!(e && e.target && e.target.checked) }); } }),
        React.createElement('span', { key: 't' }, '启用外部背景（关闭则使用纯色底、不加载背景脚本）'),
      ]),
      React.createElement('div', { key: 'bg-label', className: AH.dialogText, style: { marginTop: 10 } }, '背景嵌入代码（script + 自定义标签，留空则无背景）'),
      React.createElement('textarea', {
        key: 'bg',
        className: AH.dialogInput,
        value: v.bgEmbed || '',
        spellCheck: false,
        disabled: v.bgEnabled === false,
        placeholder: '粘贴形如 <script type="module" src="https://.../embed.js"></script> 与 <pro-threads ...></pro-threads>',
        style: { minHeight: 96, fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: '0.72em', lineHeight: '1.5', whiteSpace: 'pre', resize: 'vertical', opacity: v.bgEnabled === false ? 0.5 : 1 },
        onChange: function (e) { set({ bgEmbed: e && e.target ? e.target.value : '' }); },
      }),
      React.createElement('div', { key: 'origin', className: AH.dialogText, style: { marginTop: 6, fontSize: '0.74em' } }, [
        '背景原地址：',
        React.createElement('a', {
          key: 'a', href: 'https://www.kubai.design/pro-threads/', target: '_blank', rel: 'noreferrer',
          style: { color: 'var(--color-blue-500, #3b82f6)', textDecoration: 'underline' },
        }, 'https://www.kubai.design/pro-threads/'),
      ]),
      React.createElement('div', { key: 'mid-label', className: AH.dialogText, style: { marginTop: 12 } }, '中间层（位于背景与列表之间）'),
      React.createElement('div', { key: 'color-row', style: rowStyle }, [
        React.createElement('span', { key: 'lab' }, '颜色'),
        React.createElement('input', { key: 'color', type: 'color', value: v.scrimColor || '#ffffff', onChange: function (e) { set({ scrimColor: e && e.target ? e.target.value : '#ffffff' }); }, style: { width: 40, height: 26, border: 'none', background: 'transparent', cursor: 'pointer' } }),
        React.createElement('span', { key: 'alpha-lab', style: { marginLeft: 8 } }, '不透明度'),
        React.createElement('input', { key: 'alpha', type: 'range', min: 0, max: 100, value: Math.round(alpha * 100), onChange: function (e) { set({ scrimOpacity: (Number(e && e.target ? e.target.value : 45)) / 100 }); }, style: { flex: '1 1 auto' } }),
        React.createElement('span', { key: 'alpha-val', style: valStyle }, Math.round(alpha * 100) + '%'),
      ]),
      React.createElement('div', { key: 'blur-row', style: rowStyle }, [
        React.createElement('span', { key: 'lab' }, '模糊度'),
        React.createElement('input', { key: 'blur', type: 'range', min: 0, max: 40, value: blur, onChange: function (e) { set({ scrimBlur: Number(e && e.target ? e.target.value : 10) }); }, style: { flex: '1 1 auto' } }),
        React.createElement('span', { key: 'blur-val', style: valStyle }, blur + 'px'),
      ]),
      React.createElement('div', { key: 'ui-label', className: AH.dialogText, style: { marginTop: 12 } }, '卡片与列表'),
      React.createElement('div', { key: 'gap-row', style: rowStyle }, [
        React.createElement('span', { key: 'lab' }, '卡片间距'),
        React.createElement('input', { key: 'gap', type: 'range', min: 0, max: 32, value: gap, onChange: function (e) { set({ cardGap: Number(e && e.target ? e.target.value : 12) }); }, style: { flex: '1 1 auto' } }),
        React.createElement('span', { key: 'gap-val', style: valStyle }, gap + 'px'),
      ]),
      React.createElement('div', { key: 'radius-row', style: rowStyle }, [
        React.createElement('span', { key: 'lab' }, '卡片圆角'),
        React.createElement('input', { key: 'radius', type: 'range', min: 0, max: 24, value: radius, onChange: function (e) { set({ cardRadius: Number(e && e.target ? e.target.value : 12) }); }, style: { flex: '1 1 auto' } }),
        React.createElement('span', { key: 'radius-val', style: valStyle }, radius + 'px'),
      ]),
      React.createElement('div', { key: 'bgop-row', style: rowStyle }, [
        React.createElement('span', { key: 'lab' }, '背景不透明度'),
        React.createElement('input', { key: 'bgop', type: 'range', min: 0, max: 100, value: Math.round(bgOpacity * 100), onChange: function (e) { set({ bgOpacity: (Number(e && e.target ? e.target.value : 100)) / 100 }); }, style: { flex: '1 1 auto' } }),
        React.createElement('span', { key: 'bgop-val', style: valStyle }, Math.round(bgOpacity * 100) + '%'),
      ]),
      React.createElement('div', { key: 'json-label', className: AH.dialogText, style: { marginTop: 12 } }, '导入 / 导出（JSON）'),
      React.createElement('textarea', {
        key: 'json',
        className: AH.dialogInput,
        value: jsonText,
        spellCheck: false,
        placeholder: '「导出 JSON」生成当前配置；粘贴 JSON 后点「导入」应用（再点保存持久化）',
        style: { minHeight: 72, fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: '0.7em', lineHeight: '1.45', whiteSpace: 'pre', resize: 'vertical' },
        onChange: function (e) { setJson(e && e.target ? e.target.value : ''); },
      }),
      React.createElement('div', { key: 'json-actions', style: { display: 'flex', gap: 8, marginTop: 8 } }, [
        React.createElement('button', { key: 'exp', type: 'button', className: AH.dialogButton, onClick: doExport }, '导出 JSON'),
        React.createElement('button', { key: 'imp', type: 'button', className: AH.dialogButton, onClick: doImport }, '导入 JSON'),
      ]),
      React.createElement('div', { key: 'actions', className: AH.dialogActions, style: { marginTop: 16 } }, [
        React.createElement('button', { key: 'reset', type: 'button', className: AH.dialogButton, onClick: function () { if (props.onReset) props.onReset(); } }, '恢复默认'),
        React.createElement('button', { key: 'cancel', type: 'button', className: AH.dialogButton, onClick: props.onCancel }, '取消'),
        React.createElement('button', { key: 'save', type: 'button', className: AH.dialogButton, 'data-primary': 'true', onClick: function () { if (props.onSave) props.onSave(); } }, '保存'),
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

  /* 面板背景：按配置渲染外部自定义元素（如 pro-threads），脚本只加载一次（浏览器/内存双缓存）。 */
  function ThreadsBackground(props) {
    var cfg = props && props.config;
    React.useEffect(function () {
      try { if (cfg && cfg.src) ensureEmbedScript(cfg.src); } catch (ignored) { /* ignore */ }
    }, [cfg && cfg.src]);
    if (!cfg || !cfg.tag) return null;
    var elProps = {};
    for (var k in cfg.attrs) {
      if (Object.prototype.hasOwnProperty.call(cfg.attrs, k)) elProps[k] = cfg.attrs[k];
    }
    elProps.key = 'thread';
    elProps.style = { width: '100%', height: '100%', display: 'block' };
    return React.createElement(cfg.tag, elProps);
  }

  /* 共享 ResizeObserver：整页只创建一个实例观察所有卡片，避免「每卡一个 observer」。
     无 ResizeObserver（测试 / 老环境）时返回 noop，调用方逻辑不变。 */
  var sharedCardRO = null;
  var sharedCardCallbacks = null;
  function observeCardWidth(el, cb) {
    if (typeof ResizeObserver === 'undefined' || !el) return function () {};
    if (!sharedCardRO) {
      sharedCardRO = new ResizeObserver(function (entries) {
        for (var i = 0; i < entries.length; i += 1) {
          var fn = sharedCardCallbacks.get(entries[i].target);
          if (fn) {
            var w = entries[i].contentRect && entries[i].contentRect.width;
            if (w) { try { fn(w); } catch (ignored) { /* ignore */ } }
          }
        }
      });
      sharedCardCallbacks = new Map();
    }
    sharedCardCallbacks.set(el, cb);
    try { sharedCardRO.observe(el); } catch (ignored) { /* ignore */ }
    return function () {
      try { sharedCardCallbacks.delete(el); sharedCardRO.unobserve(el); } catch (ignored) { /* ignore */ }
    };
  }

  function SessionCard(props) {
    var session = props.session;
    var now = props.now;
    // 入场错峰：同一批渲染的卡片依次淡入，最多累加到 160ms
    var enterDelay = (typeof props.index === 'number' ? Math.min(props.index, 8) : 0) * 20;

    // 量卡片宽度：宽时状态放右侧（2 号位），窄时放左侧工作区段（1 号位）
    var cardRef = React.useRef ? React.useRef(null) : { current: null };
    var cardWidthState = React.useState(0);
    var cardW = cardWidthState[0];
    var setCardW = cardWidthState[1];
    React.useEffect(function () {
      if (!cardRef.current) return undefined;
      // 共享一个全页 ResizeObserver，而非每张卡各建一个。
      return observeCardWidth(cardRef.current, function (w) { setCardW(w); });
    }, []);
    var showStatusRight = cardW >= 960;

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

    // 会话是否有可见状态（归档/空闲不显示）
    var hasStatus = session.archived !== true && session.primaryState !== 'idle';

    // 状态栈：主状态（原生六态）+ 可叠加的「N 子智能体」；两处复用同一份
    var statusStack = function (mt) {
      if (!hasStatus) return null;
      return React.createElement('span', {
        key: 'st',
        style: { display: 'flex', flexDirection: 'column', gap: 2, marginTop: mt, alignItems: 'center', maxWidth: '100%', minWidth: 0 },
      },
        session.statusItems[0].key.indexOf('status.subagentsRunning') === 0
          ? React.createElement(SubagentTag, { count: session.runningSubagentCount, compact: true, stacked: true })
          : React.createElement(StatusTag, { items: session.statusItems, stacked: true }),
        session.statusItems.length > 1
          ? React.createElement(SubagentTag, { count: session.runningSubagentCount, compact: true, stacked: true })
          : null);
    };

    var children = [
      props && props.selectMode
        ? React.createElement('span', {
            key: 'sel',
            'aria-hidden': 'true',
            style: {
              flex: 'none', width: 16, height: 16, marginTop: 2, borderRadius: 4,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, lineHeight: '16px', color: '#fff',
              background: props.selected ? 'var(--color-blue-500, #3b82f6)' : 'transparent',
              border: '1px solid color-mix(in srgb, var(--color-blue-500, #3b82f6) 55%, transparent)',
            },
          }, props.selected ? '✓' : '')
        : null,
      React.createElement('span', {
        key: 'ws',
        className: AH.wsTag + (workspaceName ? '' : ' ah-ws-tag--empty'),
        title: workspaceName || undefined,
        style: { marginLeft: 8, justifyContent: (hasStatus && !showStatusRight) ? 'flex-start' : 'center' },
      },
        workspaceName
          ? React.createElement('span', { key: 'inner', className: AH.wsTagInner },
              React.createElement('svg', {
                viewBox: '0 0 16 16', width: 11, height: 11, fill: 'none',
                stroke: 'currentColor', strokeWidth: 1.4, strokeLinejoin: 'round', strokeLinecap: 'round',
                'aria-hidden': 'true', style: { flex: 'none', opacity: 0.6 },
              }, React.createElement('path', { d: 'M2 4.6c0-.8.6-1.4 1.4-1.4h2.7l1.3 1.6h4.2c.8 0 1.4.6 1.4 1.4v4.4c0 .8-.6 1.4-1.4 1.4H3.4C2.6 11.9 2 11.3 2 10.5z' })),
              React.createElement('span', { className: AH.wsTagText }, workspaceName))
          : null,
        // 窄时状态放在工作区名下方（宽时移到右侧 2 号位）
        (hasStatus && !showStatusRight) ? statusStack(4) : null,
      ),
      React.createElement(
        'span',
        { key: 'body', style: { display: 'flex', flexDirection: 'column', gap: 3, flex: '1 1 auto', minWidth: 0 } },
        React.createElement(
          'span',
          { style: { display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 } },
          session.open ? React.createElement(CurrentBadge) : null,
          React.createElement('span', {
            className: 'ah-card-title',
            style: {
              color: 'var(--ah-ink, ' + UI.textPrimary + ')',
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
              className: 'ah-card-sub',
              style: {
                color: 'var(--ah-ink-soft, ' + UI.textSecondary + ')',
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
          className: 'ah-card-meta',
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            color: 'var(--ah-ink-soft, ' + UI.textSecondary + ')',
            // 整行统一一个字号，chip 全部继承，不再各自覆盖；小一号避免半屏换行
            fontSize: '0.8em',
            lineHeight: '22px',
            flexWrap: 'wrap',
          },
        }, metaRow),
      ),
      (hasStatus && showStatusRight)
        ? React.createElement('span', {
            key: 'status',
            style: { flex: 'none', width: 66, alignSelf: 'stretch', display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', justifyContent: 'center', marginRight: 12, marginLeft: 4 },
          }, statusStack(0))
        : null,
      React.createElement(
        'span',
        {
          key: 'right',
          style: {
            flex: 'none',
            width: 110,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: 4,
            alignSelf: 'stretch',
            paddingTop: 1,
            paddingBottom: 1,
          },
        },
        // 两行：热度计（上）→ 相对时间（下）；工作区名已移到卡片最左侧
        React.createElement(HeatMeter, { level: session.level, ratio: session.ratio, showLabel: true, width: 96, height: 12 }),
        React.createElement('span', {
          className: 'ah-card-time',
          style: {
            width: '100%',
            textAlign: 'right',
            fontSize: '0.8em',
            lineHeight: '18px',
            color: 'var(--ah-ink-faint, ' + UI.textTertiary + ')',
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
          },
        }, relativeOf(session.at, now)),
      ),
    ];

    var running = session.primaryState === 'ongoing';
    // 等待用户处理 / 已完成不套运行中外框；进行中才套
    var activeRunning = running;

    var buttonStyle = {
      display: 'flex',
      alignItems: 'stretch',
      gap: 12,
      width: '100%',
      padding: activeRunning ? '13px 14px 18px 0' : '10px 14px 10px 0',
      // 运行中时由外层容器控制间距和边框，按钮自身不再留 margin
      margin: activeRunning ? 0 : '0 0 var(--ah-card-gap, 12px)',
      borderRadius: 'var(--ah-card-radius, 12px)',
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
        ref: cardRef,
        onClick: props && props.selectMode ? props.onToggleSelect : props.onClick,
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
    var runElapsed = (typeof session.at === 'number' && typeof now === 'number') ? Math.max(0, now - session.at) : 0;
    var frame = activeRunning ? React.createElement(RunningFrame, { elapsedMs: runElapsed }, cardButton) : cardButton;
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
          padding: running ? '14px 16px 20px' : '12px 16px',
          // 运行中时由外层容器控制间距和边框，按钮自身不再留 margin
          margin: running ? 0 : '0 0 var(--ah-card-gap, 12px)',
          borderRadius: 'var(--ah-card-radius, 12px)',
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
      React.createElement(
        'span',
        { key: 'body', style: { display: 'flex', flexDirection: 'column', gap: 2, flex: '1 1 auto', minWidth: 0 } },
        React.createElement('span', {
          style: { display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 },
        },
          running ? React.createElement(StatusTag, {
            compact: true,
            items: [{ state: 'ongoing', key: 'status.running', ariaKey: 'status.runningTitle' }],
          }) : null,
          React.createElement('span', {
            className: 'ah-card-title',
            style: {
              color: 'var(--ah-ink, ' + UI.textPrimary + ')',
              fontWeight: 500,
              fontSize: '0.98em',
              lineHeight: '22px',
              flex: '1 1 auto',
              minWidth: 0,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              whiteSpace: 'normal',
              overflowWrap: 'anywhere',
              textWrap: 'balance',
            },
          }, group.label),
        ),
        React.createElement('span', {
          className: 'ah-card-meta',
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            color: 'var(--ah-ink-soft, ' + UI.textSecondary + ')',
            fontSize: '0.8em',
            lineHeight: '22px',
            flexWrap: 'wrap',
          },
        }, metaRow),
      ),
      React.createElement(
        'span',
        { key: 'right', style: { flex: 'none', display: 'flex', alignItems: 'center', gap: 10 } },
        React.createElement(HeatMeter, { level: group.level, ratio: group.ratio, showLabel: true, width: 100, height: 12 }),
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
    var runElapsed = (typeof group.at === 'number' && typeof now === 'number') ? Math.max(0, now - group.at) : 0;
    var frame = running ? React.createElement(RunningFrame, { elapsedMs: runElapsed }, cardButton) : cardButton;
    if (!menuNode) return frame;
    return React.createElement(React.Fragment, null, frame, menuNode);
  }

  /* 全局分钟节拍：面板、侧栏每一行、悬停卡共享同一个 60s 定时器，
     避免「每行一个 setInterval」。订阅者数组惰性创建，组件卸载时退订。 */
  var minuteListeners = null;
  var minuteTimer = null;
  var minuteValue = 0;
  function subscribeMinute(listener) {
    if (!minuteListeners) minuteListeners = [];
    minuteListeners.push(listener);
    if (minuteTimer === null && typeof setInterval === 'function') {
      try {
        minuteTimer = setInterval(function () {
          minuteValue += 1;
          var snapshot = minuteListeners.slice();
          for (var i = 0; i < snapshot.length; i += 1) {
            try { snapshot[i](minuteValue); } catch (ignored) { /* 单个订阅异常不影响其它 */ }
          }
        }, 60000);
      } catch (ignored) { minuteTimer = null; }
    }
    return function () {
      if (!minuteListeners) return;
      var idx = minuteListeners.indexOf(listener);
      if (idx >= 0) minuteListeners.splice(idx, 1);
    };
  }

  function useMinuteTick() {
    var state = React.useState(minuteValue);
    React.useEffect(function () {
      return subscribeMinute(function (value) { state[1](value); });
    }, []);
    return state[0];
  }

  /* 用户偏好（视图 / 数量 / 筛选 / 范围）：localStorage 持久化，重开面板保留；
     拿不到 storage（隐私模式 / 测试沙箱）时静默退回默认值。 */
  var PREFS_KEY = 'activity-heat:prefs';
  var prefsCache = null;
  function prefsStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
    } catch (ignored) { /* 隐私模式访问即抛 */ }
    return null;
  }
  function loadPrefs() {
    if (prefsCache) return prefsCache;
    var out = {};
    var store = prefsStorage();
    try {
      var raw = store ? store.getItem(PREFS_KEY) : null;
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') out = parsed;
      }
    } catch (ignored) { /* 坏数据直接忽略 */ }
    prefsCache = out;
    return out;
  }
  function savePrefs(patch) {
    var store = prefsStorage();
    // 没有持久化能力（隐私模式 / 测试沙箱）时不写内存缓存：避免偏好跨场景泄漏，
    // 每次重开都回到默认值，符合「无 storage」的预期。
    if (!store) return;
    var p = loadPrefs();
    var changed = false;
    for (var k in patch) {
      if (!Object.prototype.hasOwnProperty.call(patch, k)) continue;
      if (p[k] !== patch[k]) { p[k] = patch[k]; changed = true; }
    }
    if (!changed) return;
    try { store.setItem(PREFS_KEY, JSON.stringify(p)); } catch (ignored) { /* 配额满：忽略 */ }
  }
  function prefOf(key, fallback, validate) {
    var v = loadPrefs()[key];
    if (v === undefined) return fallback;
    return validate ? (validate(v) ? v : fallback) : v;
  }

  /* ===== 背景嵌入配置（pro-threads 可切换）+ 中间层（颜色/模糊）+ 脚本缓存 ===== */
  var DEFAULT_BG_EMBED = '<script type="module" src="https://cdn.jsdelivr.net/gh/kubai087/pro-threads@main/embed.js"><' + '/script>\n<pro-threads scene="mobius" settings="palette=paper" style="height: 100vh"></pro-threads>';
  var __embedLoaded = {};
  function ensureEmbedScript(src) {
    try {
      if (!src || typeof document === 'undefined' || !document.createElement) return;
      if (__embedLoaded[src]) return;
      var scripts = document.querySelectorAll ? document.querySelectorAll('script[data-ah-embed]') : [];
      for (var i = 0; i < scripts.length; i += 1) {
        if (scripts[i].src === src || scripts[i].getAttribute('src') === src) { __embedLoaded[src] = 1; return; }
      }
      var s = document.createElement('script');
      s.type = 'module'; s.async = true; s.src = src;
      try { s.setAttribute('data-ah-embed', '1'); } catch (ignored) {}
      (document.head || document.documentElement).appendChild(s);
      __embedLoaded[src] = 1;
    } catch (ignored) { /* 离线 / CSP：无背景 */ }
  }
  function parseEmbedConfig(html) {
    try {
      if (typeof DOMParser === 'undefined' || typeof html !== 'string' || html.trim() === '') return null;
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var script = doc.querySelector ? doc.querySelector('script[src]') : null;
      var nodes = doc.body ? doc.body.children : [];
      var el = null;
      for (var i = 0; i < nodes.length; i += 1) {
        var tag = String(nodes[i].tagName || '').toLowerCase();
        if (tag.indexOf('-') !== -1) { el = nodes[i]; break; }
      }
      if (!el) return null;
      var attrs = {};
      for (var j = 0; j < el.attributes.length; j += 1) {
        var a = el.attributes[j];
        if (a.name !== 'style') attrs[a.name] = a.value;
      }
      return { src: script ? (script.getAttribute('src') || '') : '', tag: String(el.tagName).toLowerCase(), attrs: attrs };
    } catch (ignored) { return null; }
  }
  function hexToRgba(hex, alpha) {
    try {
      var h = String(hex || '').replace('#', '');
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      var a = alpha == null ? 0.45 : Math.max(0, Math.min(1, Number(alpha)));
      if (h.length !== 6) return 'rgba(255,255,255,' + a + ')';
      var r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
      return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
    } catch (ignored) { return 'rgba(255,255,255,0.45)'; }
  }

  /** 分段切换控件：一组胶囊，选中项实底（表面与过渡见 AH_CSS）。 */
  function Segmented(props) {
    var options = props && props.options ? props.options : [];
    var value = props && props.value;
    var onChange = props && props.onChange;
    var compact = props && props.compact === true;
    var text = props && props.variant === 'text';
    var buttons = options.map(function (option) {
      var picked = value === option.value;
      var style = text
        ? {
          padding: '3px 9px',
          fontSize: '0.78em',
          lineHeight: '18px',
          cursor: 'pointer',
          font: 'inherit',
          // 放在 font 之后：font 简写会把字重重置成继承值
          fontWeight: picked ? 600 : 500,
        }
        : {
          padding: compact ? '2px 9px' : '4px 13px',
          fontSize: compact ? '0.74em' : '0.8em',
          lineHeight: compact ? '16px' : '20px',
          cursor: 'pointer',
          font: 'inherit',
          fontWeight: picked ? 600 : 500,
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
    });
    // 非文字分段（对象切换）套一层胶囊基底，形成清晰的"分段组"层级；文字分段（范围/数量）裸排布
    return React.createElement(
      'span',
      { className: text ? AH.countGroup : AH.segGroup },
      buttons,
    );
  }

  function ActivityPanel(props) {
    var useSessions = props && props.useSessions;
    var useWorkspaces = props && props.useWorkspaces;
    // 首次渲染的视图：测试/宿主显式传入优先，其次读上次偏好，最后默认会话视图
    var initialView = props && props.initialView === 'workspaces'
      ? 'workspaces'
      : (props && props.initialView === 'sessions' ? 'sessions' : prefOf('view', 'sessions', function (v) { return v === 'sessions' || v === 'workspaces'; }));
    // 首次渲染的范围；测试可直接进入已归档 / 子代理视图；否则读偏好
    var initialRange = props && (props.initialRange === 'archived' || props.initialRange === 'subagent')
      ? props.initialRange
      : (props && props.initialRange === 'active' ? 'active' : prefOf('range', 'active', function (v) { return v === 'active' || v === 'archived' || v === 'subagent'; }));
    // 面板挂载期间才显示在 main slot；快捷键靠这个标记做「进入 / 返回」二次切换。
    React.useEffect(function () {
      panelVisible = true;
      return function () { panelVisible = false; };
    }, []);
    var minuteTick = useMinuteTick();

    // 顶层：会话 / 工作区 两种对象切换
    var viewState = React.useState(initialView);
    var view = viewState[0];
    var setView = viewState[1];
    // 数量：会话 10/20/30/50，工作区 5/10/20
    var topState = React.useState(function () { return prefOf('topCount', 10, function (v) { return v === 10 || v === 20 || v === 30 || v === 50; }); });
    var topCount = topState[0];
    var setTopCount = topState[1];
    var groupState = React.useState(function () { return prefOf('groupCount', 5, function (v) { return v === 5 || v === 10 || v === 20; }); });
    var groupCount = groupState[0];
    var setGroupCount = groupState[1];
    // 热度筛选（两种视图共用）
    var filterState = React.useState(function () { return prefOf('filter', 'all', function (v) { return typeof v === 'string' && v !== ''; }); });
    var filter = filterState[0];
    var setFilter = filterState[1];
    // 范围：常规 / 已归档 / 子代理（仅会话视图生效）
    var rangeState = React.useState(initialRange);
    var range = rangeState[0];
    var setRange = rangeState[1];
    // 批量选择（仅会话视图）
    var selectState = React.useState(props && props.initialSelectMode === true);
    var selectMode = selectState[0];
    var setSelectMode = selectState[1];
    var initialSelected = props && Array.isArray(props.initialSelected) ? props.initialSelected : [];
    var selectedState = React.useState(function () {
      var map = {};
      for (var si = 0; si < initialSelected.length; si += 1) map[String(initialSelected[si])] = true;
      return map;
    });
    var selected = selectedState[0];
    var setSelected = selectedState[1];

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
    // 背景 / 中间层 / UI 配置（持久化到 localStorage）；open 控制配置中心弹窗
    var cfgState = React.useState(function () {
      return {
        open: false,
        bgEnabled: prefOf('bgEnabled', true),
        bgEmbed: prefOf('bgEmbed', DEFAULT_BG_EMBED),
        scrimColor: prefOf('scrimColor', '#ffffff'),
        scrimOpacity: prefOf('scrimOpacity', 0.45),
        scrimBlur: prefOf('scrimBlur', 10),
        cardGap: prefOf('cardGap', 12),
        cardRadius: prefOf('cardRadius', 12),
        bgOpacity: prefOf('bgOpacity', 1),
      };
    });
    var cfg = cfgState[0];
    var setCfg = cfgState[1];
    var readCfgPrefs = function () {
      return {
        bgEnabled: prefOf('bgEnabled', true),
        bgEmbed: prefOf('bgEmbed', DEFAULT_BG_EMBED),
        scrimColor: prefOf('scrimColor', '#ffffff'),
        scrimOpacity: prefOf('scrimOpacity', 0.45),
        scrimBlur: prefOf('scrimBlur', 10),
        cardGap: prefOf('cardGap', 12),
        cardRadius: prefOf('cardRadius', 12),
        bgOpacity: prefOf('bgOpacity', 1),
      };
    };
    var openSettings = function () { setCfg(Object.assign({}, cfg, { open: true })); };
    var closeSettings = function () { var base = readCfgPrefs(); base.open = false; setCfg(base); };
    var saveSettings = function () {
      savePrefs({
        bgEnabled: cfg.bgEnabled, bgEmbed: cfg.bgEmbed, scrimColor: cfg.scrimColor, scrimOpacity: cfg.scrimOpacity, scrimBlur: cfg.scrimBlur,
        cardGap: cfg.cardGap, cardRadius: cfg.cardRadius, bgOpacity: cfg.bgOpacity,
      });
      setCfg(Object.assign({}, cfg, { open: false }));
    };
    var resetSettings = function () {
      setCfg({ open: true, bgEnabled: true, bgEmbed: DEFAULT_BG_EMBED, scrimColor: '#ffffff', scrimOpacity: 0.45, scrimBlur: 10, cardGap: 12, cardRadius: 12, bgOpacity: 1 });
    };
    var importSettings = function (obj) {
      if (!obj || typeof obj !== 'object') return;
      var next = Object.assign({}, cfg, { open: true });
      var num = function (v) { return v != null && !isNaN(Number(v)) ? Number(v) : null; };
      var clampN = function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };
      if (typeof obj.bgEmbed === 'string') next.bgEmbed = obj.bgEmbed;
      if (typeof obj.bgEnabled === 'boolean') next.bgEnabled = obj.bgEnabled;
      if (typeof obj.scrimColor === 'string') next.scrimColor = obj.scrimColor;
      var so = num(obj.scrimOpacity); if (so !== null) next.scrimOpacity = clampN(so, 0, 1);
      var sb = num(obj.scrimBlur); if (sb !== null) next.scrimBlur = clampN(sb, 0, 40);
      var cg = num(obj.cardGap); if (cg !== null) next.cardGap = clampN(cg, 0, 32);
      var cr = num(obj.cardRadius); if (cr !== null) next.cardRadius = clampN(cr, 0, 24);
      var bo = num(obj.bgOpacity); if (bo !== null) next.bgOpacity = clampN(bo, 0, 1);
      setCfg(next);
    };
    // 宿主 open-in-app 目录（本机实际安装的应用）与「打开方式」浮层。
    // initialApps 只给测试注入用（与 initialView 同策略），生产始终从探测开始。
    var initialApps = props && Array.isArray(props.initialApps) ? props.initialApps : null;
    var appsState = React.useState(initialApps && initialApps.length > 0 ? initialApps : []);
    var apps = appsState[0];
    var setApps = appsState[1];

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

    // 液态玻璃：列表/视图/数量/分钟刷新后，把材质套到新的卡片上。
    // 尺寸与主题变化由材质引擎内部的 ResizeObserver / MutationObserver 处理。
    React.useEffect(function () {
      try { enhanceGlassCards(listRef.current); } catch (ignored) { /* 降级为纯 CSS 玻璃 */ }
    }, [view, filter, topCount, groupCount, range, minuteTick]);

    // 选择变化写入偏好（重开面板时恢复）；测试环境无 storage 时 savePrefs 静默跳过。
    React.useEffect(function () { savePrefs({ view: view }); }, [view]);
    React.useEffect(function () { savePrefs({ topCount: topCount }); }, [topCount]);
    React.useEffect(function () { savePrefs({ groupCount: groupCount }); }, [groupCount]);
    React.useEffect(function () { savePrefs({ filter: filter }); }, [filter]);
    React.useEffect(function () { savePrefs({ range: range }); }, [range]);

    var now = Date.now();

    if (!useSessions || !useWorkspaces) {
      return React.createElement('div', {
        style: { padding: '16px ' + UI.padX + 'px', color: UI.textSecondary },
      }, tt('panel.noHostData'));
    }

    var sessionState = useSessions(function (state) { return state; });
    var workspaceState = useWorkspaces(function (state) { return state; });
    // 客户端状态域：能拿到就用 pendingInteraction 区分审批 / 计划审阅 / 提问
    var useSessionStatus = props && props.useSessionStatus;
    var statusMap = useSessionStatus ? useSessionStatus(function (state) { return state; }) : null;
    var statusOf = statusMap && typeof statusMap.get === 'function'
      ? function (statusId) { return statusMap.get(statusId); }
      : undefined;
    var effectiveRange = view === 'sessions' ? range : 'active';
    // 一次性构建全量，两个视图按需切片；useMemo 缓存，deps 不变不重算。
    // now/statusOf 不入 deps：由 minuteTick（每分钟）与 statusMap 驱动刷新。
    var model = React.useMemo(function () {
      return buildModel(sessionState, workspaceState, now, topCount, groupCount, {
        range: effectiveRange,
        statusOf: statusOf,
      });
    }, [sessionState, workspaceState, effectiveRange, topCount, groupCount, statusMap, minuteTick]);
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

    // 应用目录由本插件 Host 路由探测（activity-heat/open-with/apps）；失败时
    // loadOpenWithApps 内部回退旧宿主 open-in-app，避免退化。initialApps 仅测试注入。
    React.useEffect(function () {
      if (initialApps && initialApps.length > 0) {
        openWithAppsCache = initialApps.slice();
        setApps(initialApps.slice());
        return undefined;
      }
      var cancelled = false;
      loadOpenWithApps().then(function (ids) {
        if (cancelled) return;
        ahLog('[activity-heat] open-with apps:', ids);
        setApps(ids || []);
      });
      return function () { cancelled = true; };
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

    /** 把宿主 WorkspaceActiveSessionError.activity 归一成可读的一行行文字。 */
    function activityLinesOf(reason) {
      var raw = reason && reason.activity;
      var out = [];
      function push(item) {
        if (item === undefined || item === null) return;
        if (typeof item === 'string') { if (item) out.push(item); return; }
        if (typeof item !== 'object') { out.push(String(item)); return; }
        if (Array.isArray(item.items)) { item.items.forEach(push); return; }
        if (Array.isArray(item.entries)) { item.entries.forEach(push); return; }
        var label = item.title || item.label || item.name || item.kind || item.id;
        if (label) out.push(String(label) + (typeof item.count === 'number' ? ' ×' + item.count : ''));
      }
      try {
        if (Array.isArray(raw)) raw.forEach(push);
        else if (raw && typeof raw === 'object') {
          Object.keys(raw).forEach(function (key) {
            var value = raw[key];
            if (Array.isArray(value)) value.forEach(push);
            else push(value);
          });
        }
      } catch (ignored) { /* 结构未知时返回已收集部分 */ }
      return out;
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
      var stop = dialog.stop === true;
      var previousActivity = Array.isArray(dialog.activity) ? dialog.activity : [];
      if (!uiWorkspace || typeof uiWorkspace.archiveSession !== 'function') {
        setDialog({ kind: 'archive', session: target, pending: false, error: tt('menu.unavailable'), stop: stop, activity: previousActivity });
        return;
      }
      setDialog({ kind: 'archive', session: target, pending: true, error: '', stop: stop, activity: previousActivity });
      try {
        // 运行中的会话走宿主的「停止并归档」；先不停止地试一次时，
        // 宿主会拒绝并在 reason.activity 里列出仍在跑的工作，据此升级为停止确认。
        var job = stop
          ? uiWorkspace.archiveSession(target.id, { stopActivity: true })
          : uiWorkspace.archiveSession(target.id);
        Promise.resolve(job).then(function () {
          setDialog(null);
          notify(tt(stop ? 'toast.archivedStopped' : 'toast.archived'), 'info', tt('toast.undo'), function () {
            restoreArchived(target.id);
          });
        }, function (reason) {
          ahWarn('[activity-heat] archive failed:', reason && reason.message);
          var lines = activityLinesOf(reason);
          if (!stop && lines.length > 0) {
            setDialog({ kind: 'archive', session: target, pending: false, error: '', stop: true, activity: lines });
            return;
          }
          setDialog({
            kind: 'archive',
            session: target,
            pending: false,
            error: archiveErrorText(reason),
            stop: stop,
            activity: lines,
          });
        });
      } catch (error) {
        ahWarn('[activity-heat] archive failed:', error && error.message);
        setDialog({ kind: 'archive', session: target, pending: false, error: tt('error.archive'), stop: stop, activity: previousActivity });
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

    /* ---------------- 批量操作 ---------------- */

    function toggleSelect(sessionId) {
      setSelected(function (prev) {
        var next = Object.assign({}, prev);
        var key = String(sessionId);
        if (next[key]) delete next[key];
        else next[key] = true;
        return next;
      });
    }

    function selectedSessions() {
      return model.allSessions.filter(function (s) { return selected[String(s.id)] === true; });
    }

    function batchArchive() {
      if (!uiWorkspace || typeof uiWorkspace.archiveSession !== 'function') {
        notify(tt('menu.unavailable'), 'error');
        return;
      }
      var list = selectedSessions();
      if (list.length === 0) return;
      for (var i = 0; i < list.length; i += 1) {
        (function (session) {
          try {
            // 运行中的会话走「停止并归档」，与宿主行菜单一致
            var job = session.running === true
              ? uiWorkspace.archiveSession(session.id, { stopActivity: true })
              : uiWorkspace.archiveSession(session.id);
            if (job && typeof job.then === 'function') {
              job.then(function () {}, function (reason) {
                ahWarn('[activity-heat] batch archive failed:', reason && reason.message);
              });
            }
          } catch (error) {
            ahWarn('[activity-heat] batch archive failed:', error && error.message);
          }
        })(list[i]);
      }
      setSelectMode(false);
      setSelected({});
      notify(tt('batch.archived', { count: list.length }));
    }

    function batchPin() {
      if (!uiWorkspace || typeof uiWorkspace.pinSession !== 'function') {
        notify(tt('menu.unavailable'), 'error');
        return;
      }
      var list = selectedSessions();
      if (list.length === 0) return;
      for (var i = 0; i < list.length; i += 1) {
        (function (session) {
          try {
            var job = uiWorkspace.pinSession(session.id);
            if (job && typeof job.then === 'function') {
              job.then(function () {}, function (reason) {
                ahWarn('[activity-heat] batch pin failed:', reason && reason.message);
              });
            }
          } catch (error) {
            ahWarn('[activity-heat] batch pin failed:', error && error.message);
          }
        })(list[i]);
      }
      setSelectMode(false);
      setSelected({});
      notify(tt('batch.pinned', { count: list.length }));
    }

    function batchCopyIds() {
      var list = selectedSessions();
      if (list.length === 0) return;
      copyWithToast(list.map(function (s) { return s.id; }).join('\n'));
    }

    /** 「打开方式」子菜单：与侧栏浮层共用同一构建器，保证分组 / 文案一致。 */
    function buildOpenWithItems(target) {
      return buildOpenWithMenuItems(target && target.path, apps, {
        onNotify: notify,
        onClose: closeMenu,
      });
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

    function runSessionAction(actionId, session) {
      if (!session) return;
      if (actionId === 'restore') { closeMenu(); restoreArchived(session.id); return; }
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
        setDialog({ kind: 'archive', session: session, pending: false, error: '', stop: false, activity: [] });
        return;
      }
      if (actionId === 'stop-archive') {
        closeMenu();
        setDialog({ kind: 'archive', session: session, pending: false, error: '', stop: true, activity: [] });
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
      var archivedRow = session.archived === true;
      var items = [];
      items.push({
        id: 'open',
        label: tt('menu.openSession'),
        disabled: !caps.open || archivedRow,
        hint: archivedRow ? tt('menu.archivedOpenHint') : (caps.open ? undefined : tt('menu.unavailable')),
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
        submenu: buildOpenWithItems({ path: session.cwd }),
        disabled: !isAbsolutePath(session.cwd),
        hint: !isAbsolutePath(session.cwd) ? tt('menu.openWithNoPath') : undefined,
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
      var archiveDisabled = !caps.archive || archivedRow;
      items.push({
        id: 'archive',
        label: tt(running ? 'menu.stopArchive' : 'menu.archive'),
        separatorBefore: true,
        danger: true,
        disabled: archiveDisabled,
        hint: archivedRow
          ? tt('menu.archivedOpenHint')
          : (!caps.archive
            ? tt('menu.unavailable')
            : (running ? tt('menu.stopArchiveHint') : undefined)),
        onSelect: function () { runSessionAction(running ? 'stop-archive' : 'archive', session); },
      });
      if (archivedRow) {
        items.push({
          id: 'restore',
          label: tt('menu.unarchive'),
          separatorBefore: true,
          disabled: !caps.unarchive,
          hint: caps.unarchive ? undefined : tt('menu.unavailable'),
          onSelect: function () { runSessionAction('restore', session); },
        });
      }
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
        submenu: buildOpenWithItems({ path: workspacePath }),
        disabled: !isAbsolutePath(workspacePath),
        hint: !isAbsolutePath(workspacePath) ? tt('menu.openWithNoPath') : undefined,
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
    // 单次遍历分桶：避免每个热度档位各扫一遍 allRows（原 O(F×N)）。
    var levelBuckets = {};
    for (var cf = 0; cf < FILTERS.length; cf += 1) {
      if (FILTERS[cf].level !== null) levelBuckets[FILTERS[cf].level] = 0;
    }
    for (var cr = 0; cr < allRows.length; cr += 1) {
      var rowLevel = allRows[cr].level;
      if (Object.prototype.hasOwnProperty.call(levelBuckets, rowLevel)) levelBuckets[rowLevel] += 1;
    }
    for (var cf2 = 0; cf2 < FILTERS.length; cf2 += 1) {
      if (FILTERS[cf2].level === null) continue;
      counts[FILTERS[cf2].id] = levelBuckets[FILTERS[cf2].level] || 0;
    }

    ahLog('[activity-heat] panel view=' + view + ' rows=' + rows.length + '/' + allRows.length +
      ' totalSessions=' + model.total + ' groups=' + model.groups.length + ' filter=' + filter);

    /* ---------- 顶部：标题 + 对象切换 + 数量 ---------- */
    // 标题已经去掉：主行放「对象切换 + 范围 + 数量/选择」，次行放热度筛选。
    // 两行分工，避免所有控件挤在一行导致层级不清、观感发紧。
    var header = React.createElement('div', {
      key: 'head',
      className: AH.primaryRow,
    },
      React.createElement(Segmented, {
        options: [
          { value: 'sessions', label: tt('panel.sessionsCount', { count: model.total }) },
          { value: 'workspaces', label: tt('panel.workspacesCount', { count: model.workspaceCount }) },
        ],
        value: view,
        onChange: setView,
      }),
      view === 'sessions'
        ? React.createElement(Segmented, {
            variant: 'text',
            options: [
              { value: 'active', label: tt('range.active') },
              { value: 'archived', label: tt('range.archived') },
              { value: 'subagent', label: tt('range.subagent') },
            ],
            value: range,
            onChange: setRange,
          })
        : null,
      React.createElement('span', { style: { flex: '1 1 auto' } }),
      // 数量：最次要的工具，改成无边框文字，避免和上面的视图/下面的筛选撞脸
      React.createElement('span', { className: AH.countLabel }, tt('panel.countLabel')),
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
      view === 'sessions'
        ? React.createElement('button', {
            type: 'button',
            className: 'ah-select-toggle',
            'data-active': selectMode ? 'true' : 'false',
            onClick: function () {
              if (selectMode) setSelected({});
              setSelectMode(!selectMode);
            },
            style: {
              flex: 'none', border: 'none', background: 'transparent', cursor: 'pointer',
              font: 'inherit', fontSize: '0.76em', padding: '2px 4px', borderRadius: 6,
              color: selectMode ? 'var(--color-blue-500, #3b82f6)' : UI.textTertiary,
            },
          }, tt(selectMode ? 'batch.exit' : 'batch.select'))
        : null,
      React.createElement('button', {
        key: 'settings',
        type: 'button',
        className: 'ah-settings-btn',
        'aria-label': '背景与外观设置',
        onClick: openSettings,
      }, '⚙'),
    );

    /* ---------- 热度筛选 ---------- */
    var filterBar = React.createElement(FilterBar, {
      key: 'filters',
      active: filter,
      counts: counts,
      onPick: setFilter,
    });

    // 顶部整块：主行 + 次行，作为一个 sticky-free 的固定头部
    var toolbar = React.createElement('div', { key: 'toolbar', className: AH.toolbar }, [header, filterBar]);

    /* ---------- 批量操作条 ---------- */
    var batchBar = null;
    if (view === 'sessions' && selectMode) {
      var selectedCount = 0;
      for (var sk in selected) {
        if (Object.prototype.hasOwnProperty.call(selected, sk) && selected[sk]) selectedCount += 1;
      }
      var batchButton = function (label, onClick, danger) {
        return React.createElement('button', {
          type: 'button',
          onClick: onClick,
          style: {
            flex: 'none', padding: '2px 8px', borderRadius: 6, cursor: 'pointer',
            font: 'inherit', fontSize: '0.76em', lineHeight: '18px',
            border: '1px solid color-mix(in srgb, ' + (danger ? 'var(--color-red-500, #ef4444)' : 'var(--color-blue-500, #3b82f6)') + ' 30%, transparent)',
            background: 'transparent',
            color: danger ? 'var(--color-red-500, #ef4444)' : 'var(--color-blue-500, #3b82f6)',
          },
        }, label);
      };
      batchBar = React.createElement('div', {
        key: 'batch',
        className: 'ah-batch',
        style: { display: 'flex', alignItems: 'center', gap: 6, padding: '4px ' + UI.padX + 'px 8px' },
      },
        React.createElement('span', { style: { fontSize: '0.76em', color: UI.textSecondary, flex: 'none' } },
          tt('batch.count', { count: selectedCount })),
        React.createElement('span', { style: { flex: '1 1 auto' } }),
        batchButton(tt('batch.archive'), batchArchive, true),
        batchButton(tt('batch.pin'), batchPin, false),
        batchButton(tt('batch.copy'), batchCopyIds, false),
      );
    }

    /* ---------- 列表 ---------- */
    var cards = [];
    if (view === 'sessions') {
      cards = rows.map(function (session, index) {
        return React.createElement(SessionCard, {
          key: session.id,
          session: session,
          now: now,
          index: index,
          selectMode: selectMode,
          selected: selected[session.id] === true,
          onToggleSelect: function () { toggleSelect(session.id); },
          onClick: function () {
            // 归档视图里点击不是「打开」，而是恢复（宿主对已归档会话不提供直接打开）
            if (session.archived === true) { restoreArchived(session.id); return; }
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
      stop: Boolean(dialog && dialog.stop === true),
      activity: dialog && Array.isArray(dialog.activity) ? dialog.activity : [],
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

    var bgConfig = cfg.bgEnabled === false ? null : parseEmbedConfig(cfg.bgEmbed);
    var bgNode = cfg.bgEnabled === false ? null : React.createElement('div', {
      key: 'threads',
      className: 'ah-threads-bg',
      'aria-hidden': 'true',
      style: { opacity: cfg.bgOpacity == null ? 1 : cfg.bgOpacity },
    }, bgConfig ? React.createElement(ThreadsBackground, { config: bgConfig }) : null);
    var scrimNode = React.createElement('div', {
      key: 'scrim',
      className: 'ah-scrim',
      'aria-hidden': 'true',
      style: {
        backgroundColor: hexToRgba(cfg.scrimColor, cfg.scrimOpacity),
        WebkitBackdropFilter: 'blur(' + Number(cfg.scrimBlur || 0) + 'px)',
        backdropFilter: 'blur(' + Number(cfg.scrimBlur || 0) + 'px)',
      },
    });
    var settingsNode = React.createElement(SettingsDialog, {
      open: Boolean(cfg.open),
      value: cfg,
      onChange: function (next) { setCfg(next); },
      onCancel: closeSettings,
      onSave: saveSettings,
      onReset: resetSettings,
      onImport: importSettings,
    });

    return React.createElement('div', {
      className: AH.shell,
      style: {
        display: 'flex', flexDirection: 'column', paddingBottom: 16,
        '--ah-card-gap': (Number(cfg.cardGap == null ? 12 : cfg.cardGap)) + 'px',
        '--ah-card-radius': (Number(cfg.cardRadius == null ? 12 : cfg.cardRadius)) + 'px',
      },
    }, [bgNode, scrimNode, toolbar, batchBar, list, footer, archiveNode, renameNode, settingsNode, toastNode]);
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
    // 运行状态与原生同源（useSessionStatus）；拿不到时退回 summary.running。
    var useSessionStatus = props && props.useSessionStatus;
    var statusMap = null;
    try {
      statusMap = useSessionStatus ? useSessionStatus(function (state) { return state; }) : null;
    } catch (ignored) { statusMap = null; }
    var statusOf = statusMap && typeof statusMap.get === 'function'
      ? function (statusId) { return statusMap.get(statusId); }
      : undefined;
    var native = nativeStatusOf(statusOf, sessionId);
    var running = typeof native.running === 'boolean'
      ? native.running
      : (summary && summary.running === true);
    var facts = sessionState && sessionState.projectionsBySession
      ? factsFromProjection(sessionState.projectionsBySession[sessionId])
      : {};
    // 与面板卡片同一口径：运行中按最高热度显示
    var level = running ? 5 : heatLevelOf(now - at);
    var model = React.useMemo(function () {
      return sessionState && workspaceState
        ? buildModel(sessionState, workspaceState, now, 12, 5, { statusOf: statusOf })
        : null;
    }, [sessionState, workspaceState, statusMap]);

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

    // 状态行由宿主 SessionHoverContent 原生渲染（StateDot + 原生标签）；
    // 插件这里只放热度，绝不重复状态文字（DESIGN.md §8）。
    var header = React.createElement('div', {
      key: 'head',
      style: { display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 },
    },
      React.createElement(RowHeatBar, { level: level, title: '', width: 10, height: 16, align: 'center' }),
      React.createElement('span', {
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
      height: 8,
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
  /** 打开/关闭最近活跃面板的统一入口（命令、角落按钮共用）。 */
  function openActivityPanel(ctx, visible) {
    try {
      var layout = ctx && typeof ctx.get === 'function' ? ctx.get('layout') : undefined;
      if (!layout || typeof layout.selectPanel !== 'function') {
        ahWarn('[activity-heat] layout.selectPanel unavailable');
        return;
      }
      layout.selectPanel(visible ? null : 'activity-heat');
    } catch (error) {
      ahWarn('[activity-heat] openActivityPanel failed:', error && error.message);
    }
  }

  /**
   * 注册 `/heat` 斜杠命令（ctx.commandUi）。命令属于会话作用域，
   * 触发后进入面板；宿主未挂载命令服务时静默跳过。
   */
  /**
   * 注册右侧栏 tab 类型（ctx.sidebarRightTabs）。正文由 `sidebar.right.pane.tab`
   * 同 key 的 seat 提供；用户从右侧栏引导页选择「最近活跃会话」打开。
   */
  function registerRightbar(ctx) {
    var done = false;

    function attempt(tabs, source) {
      if (done || !tabs || typeof tabs.register !== 'function') return false;
      try {
        tabs.register({
          id: RIGHTBAR_ID,
          kind: RIGHTBAR_KIND,
          priority: 'extension',
          title: function () { return tt('rightbar.title'); },
          guide: [{
            id: 'activity-heat-open',
            order: 20,
            title: function () { return tt('rightbar.guideTitle'); },
            description: function () { return tt('rightbar.guideDesc'); },
          }],
        });
        done = true;
        ahLog('[activity-heat] rightbar tab registered via ' + source);
        return true;
      } catch (error) {
        ahWarn('[activity-heat] rightbar tab register failed via ' + source + ': ' + (error && error.message));
        return false;
      }
    }

    try {
      var direct = typeof ctx.get === 'function' ? ctx.get('sidebarRightTabs') : undefined;
      if (attempt(direct, 'ctx.get')) return;
    } catch (error) {
      ahWarn('[activity-heat] rightbar probe threw:', error && error.message);
    }
    // 可选服务：只做 ctx.get 轮询，避免 inject 依赖把插件挂起。
    var tries = 0;
    function poll() {
      if (done || tries >= 20) return;
      tries += 1;
      try {
        if (attempt(typeof ctx.get === 'function' ? ctx.get('sidebarRightTabs') : undefined, 'ctx.get#' + tries)) return;
      } catch (ignored) { /* 服务未就绪 */ }
      try { setTimeout(poll, 300); } catch (ignored) { /* 无定时器 */ }
    }
    poll();
  }

  function registerCommands(ctx) {
    var done = false;

    function attempt(commandUi, source) {
      if (done || !commandUi || typeof commandUi.register !== 'function') return false;
      try {
        commandUi.register({
          name: 'heat',
          available: function () { return true; },
          label: function () { return tt('command.openLabel'); },
          description: function () { return tt('command.openDesc'); },
          ui: {
            kind: 'action',
            run: function () { openActivityPanel(ctx, false); },
          },
        });
        done = true;
        ahLog('[activity-heat] command /heat registered via ' + source);
        return true;
      } catch (error) {
        ahWarn('[activity-heat] command register failed via ' + source + ': ' + (error && error.message));
        return false;
      }
    }

    try {
      var direct = typeof ctx.get === 'function' ? ctx.get('commandUi') : undefined;
      if (attempt(direct, 'ctx.get')) return;
    } catch (error) {
      ahWarn('[activity-heat] command probe threw:', error && error.message);
    }
    // 可选服务：只做 ctx.get 轮询，绝不为它建立 inject 依赖（避免服务缺失时把插件挂起）。
    var tries = 0;
    function poll() {
      if (done || tries >= 20) return;
      tries += 1;
      try {
        if (attempt(typeof ctx.get === 'function' ? ctx.get('commandUi') : undefined, 'ctx.get#' + tries)) return;
      } catch (ignored) { /* 服务未就绪 */ }
      try { setTimeout(poll, 300); } catch (ignored) { /* 无定时器 */ }
    }
    poll();
  }

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
    // 注意：不要声明插件级 inject:['slots']。实测本 DSH 版本里 profile 静态 client
    // entry 会在 slots 服务就绪前创建，声明 inject 会让 fiber 停在 pending，冷启动
    // 永远不调用 apply（只有 HMR/手动开关才恢复）。改为 apply 内用 ctx.get('slots')
    // 轮询等待（受控 ctx 允许 ctx.get），就绪后注册。
    apply: function apply(ctx) {
      try {
        if (typeof ctx.effect === 'function') ctx.effect(ensureStyles, 'activity-heat: styles');
        else ensureStyles();

        /* 界面字典注册到宿主 locale 服务；服务缺失时 tt() 自动退回内置中文。
           官方规范：可选服务用 ctx.get 探测（缺失即跳过），不用 ctx.inject 自管依赖。 */
        try {
          var locale = typeof ctx.get === 'function' ? ctx.get('locale') : (ctx && ctx.locale);
          if (locale && typeof locale.register === 'function') {
            var registerLocale = function () { return locale.register(NS, { zh: ZH, en: EN }); };
            if (typeof ctx.effect === 'function') ctx.effect(registerLocale, 'activity-heat: locale');
            else registerLocale();
            if (typeof locale.bind === 'function') activeT = locale.bind(NS);
          }
        } catch (error) {
          ahWarn('[activity-heat] locale registration failed:', error && error.message);
        }

        // 官方 UI 插件规范：返回 { inject: ['slots'], apply(ctx) }，cordis 会在
        // apply 前把 slots 服务注入就绪；这里直接使用 ctx.slots，不再自管依赖。
        function registerSeats(slots) {
          try {
            if (!slots || typeof slots.inject !== 'function' || typeof slots.register !== 'function') {
              ahWarn('[activity-heat] slots service incomplete; registration skipped');
              return;
            }

            /**
             * 单席位注册隔离：任何一个 slot 名不存在 / 与宿主冲突，只跳过这一项，
             * 不能连累其余席位（尤其不能连累 main 面板）。
             */
            var injectProps = function () { return { ctx: ctx }; };

            function safeRegister(slotName, factory) {
              try {
                slots.inject(slotName, function () {
                  try { return factory(); } catch (error) {
                    try { console.error('[activity-heat] seat "' + slotName + '" failed:', error && (error.stack || error.message)); } catch (ignored) {}
                    return undefined;
                  }
                });
              } catch (error) {
                try { console.error('[activity-heat] slots.inject("' + slotName + '") failed:', error && (error.stack || error.message)); } catch (ignored) {}
              }
            }

            safeRegister('sidebar.session.row.leading', function () {
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

            safeRegister('sidebar.session.row.hover', function () {
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

            // 注意：不要再注册 `sidebar.toggle.badge`。它是宿主 **single** 席位，
            // 已被内置 `client-ui-settings-general` 的 DesktopUpdateBadge 占用；
            // 同优先级重复注册会抛 “single slot ... already has a registration”，
            // 在启动链路里会让本插件的 apply 中断 → 表现为「重启后插件不加载、
            // 手动禁用/启用才恢复」。折叠态徽章能力因此移除，入口改由「更多」菜单承担。

            // 「更多」菜单里的一行入口
            safeRegister('sidebar.panellist.actions', function () {
              return slots.register(
                {
                  name: 'sidebar.panellist.actions',
                  id: 'heat-more',
                  order: 30,
                  locale: NS,
                  label: function () { return tt('nav'); },
                  inject: injectProps,
                },
                PanellistAction,
              );
            });

            // 注意：`conversation.session.header.corner` 已被 ui-sidebar-right 的
            // 右侧栏展开按钮占用（single slot，同优先级重复注册会抛错），这里不再抢。
            // 会话内的入口改由侧栏「更多」菜单与折叠徽章承担。

            // 底部活跃会话栏：贴 DSH 整页底部（shell.bottom single 席位，横跨三列下方的整行）。
            // 注意不要挂 conversation.composer.dock：宿主自己的「会话信息」（activity 轮次/步数/速度
            // 与 usage token/缓存命中）就注册在该 dock 里，我们的条目会和它们挤在同一行 → 重叠。
            // shell.bottom 默认组合不占用；万一被内置 experimental-inspector 占住，宿主按
            // 「后注册优先级更高」shadow，故延迟注册以稳定占住底部（浏览器环境）。
            safeRegister('shell.bottom', function () {
              var doRegister = function () {
                try {
                  slots.register(
                    {
                      name: 'shell.bottom',
                      id: 'heat-bottom',
                      order: 20,
                      // shell.bottom 是 single 席位，内置 inspector 以 priority 0 占用；
                      // 用更低的 priority 才能 shadow 它（slot 规则：数值最低者渲染），
                      // 同优先级会抛 “already has a registration”。
                      priority: -1000,
                      locale: NS,
                      label: function () { return tt('bottom.title', { count: 0 }); },
                      inject: injectProps,
                    },
                    BottomActivityBar,
                  );
                } catch (err) {
                  try { console.error('[activity-heat] shell.bottom register failed:', err && err.message); } catch (e) { /* ignore */ }
                }
              };
              // 浏览器里延迟注册以“后注册=更高优先级”占住可能被 inspector 占用的 single 席位；
              // 测试环境（无 ResizeObserver）立即注册，便于断言捕获。
              if (typeof ResizeObserver === 'undefined') doRegister();
              else if (typeof setTimeout === 'function') setTimeout(doRegister, 250);
              else doRegister();
            });

            safeRegister('sidebar.panellist', function () {
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

            safeRegister('main', function () {
              return slots.register({ name: 'main', key: 'activity-heat', inject: injectProps }, ActivityPanel);
            });

            // 右侧栏 tab 正文：key 与 registerRightbar 的类型 id 一致
            safeRegister('sidebar.right.pane.tab', function () {
              return slots.register(
                { name: 'sidebar.right.pane.tab', key: RIGHTBAR_ID, inject: injectProps },
                RightbarActivityPanel,
              );
            });

            // 侧栏原生会话行菜单：优先用宿主 contextMenus 数据动作（UI 与原生同源 +
            // children 自动成为原生二级级联子菜单）；只有老宿主没有该服务时才回退
            // 到旧的自绘组件项（ah-side-action）。
            var sidebarMenuDefs = [];
            for (var _sm = 0; _sm < SESSION_ACTION_DEFS.length; _sm += 1) {
              if (SESSION_ACTION_DEFS[_sm].sidebarMenu === true) sidebarMenuDefs.push(SESSION_ACTION_DEFS[_sm]);
            }
            installSessionMenu(ctx, slots, function registerLegacySessionMenu() {
              sidebarMenuDefs.forEach(function (def) {
                safeRegister('sidebar.workspaces.session.menu.item', function () {
                  return slots.register({
                    name: 'sidebar.workspaces.session.menu.item',
                    id: 'ah-' + def.id,
                    order: 500 + def.order,
                    locale: NS,
                    label: function () { return tt(def.labelKey); },
                    inject: injectProps,
                  }, makeSidebarMenuRow(def));
                });
              });
            });

            // 侧栏行尾悬停按钮：在终端中打开（宿主内置 row action 不含它）
            safeRegister('sidebar.workspaces.session.row.action', function () {
              return slots.register({
                name: 'sidebar.workspaces.session.row.action',
                id: 'ah-terminal-row',
                order: 500,
                locale: NS,
                label: function () { return tt('menu.openTerminal'); },
                inject: injectProps,
              }, SidebarTerminalRowAction);
            });

            ahLog('[activity-heat] seats registered: row.leading + row.hover + more + bottom + panellist + main + rightbar.tab + sidebar.session.actions');
          } catch (error) {
            ahWarn('[activity-heat] seat registration failed:', error && error.message);
          }
        }

        // 官方模板用 inject:['slots']，但在本 DSH 版本里 profile 静态 client entry 会在
        // slots 服务就绪前创建；声明 inject 会让 fiber 停在 pending，冷启动永不 apply。
        // 因此不声明 inject，改为用受控 ctx 允许的 ctx.get('slots') 等待就绪；老宿主/
        // 测试环境没有 ctx.get 时，退回 ctx.inject(['slots']) 订阅一次。
        var slotsDone = false;
        function tryRegisterSeats(attempt) {
          if (slotsDone) return;
          var s;
          try { s = typeof ctx.get === 'function' ? ctx.get('slots') : undefined; } catch (error) { s = undefined; }
          if (s && typeof s.inject === 'function' && typeof s.register === 'function') {
            slotsDone = true;
            registerSeats(s);
            return;
          }
          if (attempt === 0) {
            var canInject = false;
            try { canInject = typeof ctx.inject === 'function'; } catch (error) { canInject = false; }
            if (canInject) {
              try {
                ctx.inject(['slots'], function (scope) {
                  var s2 = scope && (scope.slots || (typeof scope.get === 'function' ? scope.get('slots') : undefined));
                  if (!slotsDone && s2 && typeof s2.register === 'function') {
                    slotsDone = true;
                    registerSeats(s2);
                  }
                });
              } catch (error) { /* 受控 facade 不暴露 ctx.inject */ }
            }
          }
          if (attempt >= 900) return;
          var raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : null;
          if (raf) { raf(function () { tryRegisterSeats(attempt + 1); }); return; }
          try {
            if (typeof MessageChannel === 'function') {
              var ch = new MessageChannel();
              ch.port1.onmessage = function () { tryRegisterSeats(attempt + 1); };
              ch.port2.postMessage(0);
            } else if (typeof setTimeout === 'function') {
              setTimeout(function () { tryRegisterSeats(attempt + 1); }, 16);
            }
          } catch (error) { /* no scheduler */ }
        }
        tryRegisterSeats(0);

        // 可选初始化各自隔离：任一服务缺失都不应中断其余，更不能让整插件不激活。
        try { registerShortcut(ctx); } catch (error) { ahWarn('[activity-heat] shortcut init failed:', error && error.message); }
        try { registerCommands(ctx); } catch (error) { ahWarn('[activity-heat] commands init failed:', error && error.message); }
        try { registerRightbar(ctx); } catch (error) { ahWarn('[activity-heat] rightbar init failed:', error && error.message); }
      } catch (error) {
        try { console.error('[activity-heat] apply failed:', error && (error.stack || error.message)); } catch (ignored) {}
      }
    },
  };
}

})();
