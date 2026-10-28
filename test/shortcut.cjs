const path = require('path');
/**
 * 快捷键绑定合法性校验：完整复刻宿主 bindingIssue + isWebBindingAllowed 规则，
 * 在本地就把"保留键 / web 不支持"这类问题挡掉，避免再靠用户重载页面才发现。
 */
const fs = require('fs');

const src = fs.readFileSync(path.join(__dirname, '..', 'client.js'), 'utf8');

/* --- 从源码里取出我们声明的 binding 与 defaults --- */
const bindingMatch = src.match(/var binding = \{ code: '(\w+)', modifiers: \[([^\]]*)\] \};/);
if (!bindingMatch) throw new Error('binding not found in client.js');
const code = bindingMatch[1];
const modifiers = bindingMatch[2]
  .split(',')
  .map((x) => x.trim().replace(/['"]/g, ''))
  .filter(Boolean);

const defaultsBlock = src.match(/defaults: \{([\s\S]*?)\},/);
const profiles = defaultsBlock
  ? Array.from(defaultsBlock[1].matchAll(/'([a-z]+:[a-z]+)'/g)).map((m) => m[1])
  : [];

console.log('declared binding :', code, JSON.stringify(modifiers));
console.log('declared profiles:', profiles.join(', '));

/* --- 宿主规则复刻 --- */
const RESERVED_CODES = ['Escape', 'Tab', 'Space', 'Backspace', 'Delete', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
const RESERVED_PRIMARY = ['KeyC', 'KeyV', 'KeyX', 'KeyZ', 'KeyY', 'KeyQ', 'KeyH'];

function normalize(m, platform) {
  const out = new Set();
  for (const mod of m) {
    if (mod === 'primary') out.add(platform === 'macos' ? 'meta' : 'control');
    else out.add(mod);
  }
  return Array.from(out).sort();
}

function isWebBindingAllowed(b, platform) {
  const mods = b.modifiers;
  if (platform === 'windows' || platform === 'macos') {
    if (mods.length >= 3) return true;
    const primary = platform === 'macos' ? 'meta' : 'control';
    if (mods.length === 1 && ((['Comma', 'Backslash'].includes(b.code) && mods[0] === primary) || (b.code === 'Backquote' && mods[0] === 'control'))) return true;
    if (mods.length === 2 && mods.includes(primary) && (mods.includes('alt') || mods.includes('shift'))) return true;
  }
  // 通用白名单
  const keys = [
    { code: 'Slash', modifiers: ['primary'] },
    { code: 'Comma', modifiers: ['primary', 'shift'] },
    { code: 'Period', modifiers: ['primary', 'shift'] },
  ];
  return keys.some(
    (c) => c.code === b.code && JSON.stringify(normalize(c.modifiers, platform)) === JSON.stringify(mods),
  );
}

function bindingIssue(b, runtime, platform) {
  const mods = b.modifiers;
  if (runtime === 'desktop' && (platform === 'windows' || platform === 'macos')) return null;
  if (mods.length === 0 || mods.every((m) => m === 'shift')) return 'modifier-required';
  if ((platform === 'windows' || platform === 'macos') && mods.length >= 3) return null;
  if (runtime === 'web' && (platform === 'windows' || platform === 'macos') && isWebBindingAllowed(b, platform)) return null;
  const primary = mods.includes(platform === 'macos' ? 'meta' : 'control');
  if (
    RESERVED_CODES.includes(b.code) ||
    (b.code === 'Enter' && !mods.includes('alt')) ||
    (primary && RESERVED_PRIMARY.includes(b.code)) ||
    (primary && b.code === 'KeyA' && !mods.includes('shift')) ||
    (platform !== 'macos' && mods.includes('meta')) ||
    (platform === 'macos' && mods.includes('control') && mods.includes('meta')) ||
    (platform === 'macos' && mods.includes('alt') && !primary)
  ) {
    return 'reserved';
  }
  if (runtime === 'web' && !isWebBindingAllowed(b, platform)) return 'unsupported-browser';
  return null;
}

/* --- 逐个 profile 校验 --- */
let failed = 0;
for (const profile of profiles) {
  const [runtime, platform] = profile.split(':');
  const normalized = { code, modifiers: normalize(modifiers, platform) };
  const issue = bindingIssue(normalized, runtime, platform);
  if (issue === null) {
    console.log('ok   :', profile, '->', code, normalized.modifiers.join('+'));
  } else {
    console.error('FAIL :', profile, '->', issue);
    failed += 1;
  }
}

/* --- 保留键防回归：带 alt/shift 的组合会先通过 web 白名单短路，不算违规 --- */
if (RESERVED_PRIMARY.includes(code) && modifiers.includes('primary')) {
  const withAlt = { code, modifiers: normalize(modifiers, 'windows') };
  const webVerdict = bindingIssue(withAlt, 'web', 'windows');
  if (webVerdict === null) {
    console.log('ok   :', code, '是保留键，但带 alt 时已由 web 白名单放行');
  } else {
    console.error('FAIL : 使用了宿主保留键', code, '(', webVerdict, ')');
    failed += 1;
  }
} else {
  console.log('ok   :', code, '不在宿主保留键名单');
}

/* --- 声明 linux profile 会让 alt+control 被判 reserved --- */
if (profiles.some((p) => p.endsWith(':linux'))) {
  console.error('FAIL : 声明了 linux profile（alt+control 会被判 reserved）');
  failed += 1;
} else {
  console.log('ok   : 未声明 linux profile');
}

console.log(failed === 0 ? '\nSHORTCUT VALIDATION PASSED' : '\nSHORTCUT VALIDATION FAILED (' + failed + ')');
process.exitCode = failed === 0 ? 0 : 1;
