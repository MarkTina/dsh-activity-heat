/**
 * locale 资源一致性校验。
 *
 * 浏览器侧只能内联字典，plugin manager 与文档读取的是 locale/*.json，
 * 所以这里强制三件事：
 * 1. client.js 的内联字典与 locale/zh.json、locale/en.json 的扁平内容完全一致；
 * 2. 两种语言的键集合一致，且每个键的 {占位符} 集合一致；
 * 3. meta.title / meta.description 存在且非空（插件管理器的展示来源）。
 *
 * 运行：node test/locale.cjs
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'client.js'), 'utf8');

let failed = 0;
function check(ok, label, extra) {
  if (ok) console.log('ok  :', label);
  else {
    console.error('FAIL:', label, extra === undefined ? '' : '-> ' + extra);
    failed += 1;
  }
}

const MARK = src.match(/var AH_I18N = \/\* AH_I18N_START \*\/([\s\S]*?)\/\* AH_I18N_END \*\//);
check(Boolean(MARK), 'client.js 存在内联字典区块');
const inline = MARK ? vm.runInNewContext('(' + MARK[1] + ')') : { zh: {}, en: {} };

/** 把嵌套对象压成 `a.b.c` 平表。 */
function flatten(source, prefix, out) {
  const result = out || {};
  const head = prefix ? prefix + '.' : '';
  for (const key of Object.keys(source)) {
    const value = source[key];
    const full = head + key;
    if (value && typeof value === 'object' && !Array.isArray(value)) flatten(value, full, result);
    else result[full] = value;
  }
  return result;
}

/** 抽取文案里的 {placeholder} 名，排序后拼成可比较的字符串。 */
function placeholders(text) {
  const found = [];
  const re = /\{(\w+)\}/g;
  let m;
  while ((m = re.exec(String(text))) !== null) found.push(m[1]);
  return found.sort().join(',');
}

const dicts = {};
for (const lang of ['zh', 'en']) {
  const json = JSON.parse(fs.readFileSync(path.join(root, 'locale', lang + '.json'), 'utf8'));
  const meta = json.meta || {};
  check(typeof meta.title === 'string' && meta.title.trim() !== '', lang + ': meta.title 非空');
  check(typeof meta.description === 'string' && meta.description.trim() !== '', lang + ': meta.description 非空');

  const expected = flatten(json);
  delete expected['meta.title'];
  delete expected['meta.description'];
  const actual = flatten(inline[lang] || {});
  dicts[lang] = expected;

  const expectedKeys = Object.keys(expected).sort();
  const actualKeys = Object.keys(actual).sort();
  const missing = expectedKeys.filter((k) => !(k in actual));
  const extra = actualKeys.filter((k) => !(k in expected));
  check(missing.length === 0, lang + ': 内联字典覆盖全部 JSON 键', missing.join(', '));
  check(extra.length === 0, lang + ': 内联字典没有 JSON 之外的键', extra.join(', '));

  const drifted = expectedKeys.filter((k) => k in actual && actual[k] !== expected[k]);
  check(drifted.length === 0, lang + ': 全部文案与 JSON 一致', drifted.slice(0, 5).join(', '));

  for (const key of expectedKeys) {
    const actualVars = placeholders(actual[key]);
    const expectedVars = placeholders(expected[key]);
    if (actualVars !== expectedVars) {
      check(false, lang + ': ' + key + ' 占位符一致', actualVars + ' vs ' + expectedVars);
    }
  }
}

const zhKeys = Object.keys(dicts.zh).sort();
const enKeys = Object.keys(dicts.en).sort();
check(zhKeys.join('\n') === enKeys.join('\n'), 'zh/en 键集合一致');

for (const key of zhKeys) {
  const zhVars = placeholders(dicts.zh[key]);
  const enVars = placeholders(dicts.en[key]);
  if (zhVars !== enVars) check(false, 'zh/en 占位符一致：' + key, zhVars + ' vs ' + enVars);
}

console.log(failed === 0 ? '\nLOCALE CHECK PASSED' : '\nLOCALE CHECK FAILED (' + failed + ')');
process.exitCode = failed === 0 ? 0 : 1;
