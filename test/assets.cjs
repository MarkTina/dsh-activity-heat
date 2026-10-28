/**
 * 资源一致性校验：client.js 内联的「运行中」GIF 必须与 assets/active.gif 完全一致。
 *
 * 浏览器侧不能直接引用包内图片路径，所以徽标把 GIF 内联成 data URI；
 * 这里保证内联副本不会和源文件漂移，并校验 GIF 本身可用（格式、尺寸、体积）。
 *
 * 运行：node test/assets.cjs
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'client.js'), 'utf8');
const gif = fs.readFileSync(path.join(root, 'assets', 'active.gif'));

let failed = 0;
function check(ok, label, extra) {
  if (ok) console.log('ok  :', label);
  else {
    console.error('FAIL:', label, extra === undefined ? '' : '-> ' + extra);
    failed += 1;
  }
}

const match = src.match(/var ACTIVE_GIF = 'data:image\/gif;base64,([A-Za-z0-9+/=]+)';/);
check(Boolean(match), 'client.js 含内联 GIF 常量');

if (match) {
  const inline = Buffer.from(match[1], 'base64');
  check(inline.length === gif.length, '内联长度与文件一致', inline.length + ' vs ' + gif.length);
  check(inline.equals(gif), '内联字节与 assets/active.gif 一致');
}

const header = gif.slice(0, 6).toString('latin1');
check(header === 'GIF89a' || header === 'GIF87a', '文件是合法 GIF', header);
const width = gif.readUInt16LE(6);
const height = gif.readUInt16LE(8);
check(width === 32 && height === 32, 'GIF 尺寸 32x32', width + 'x' + height);
check(gif.length <= 32 * 1024, 'GIF 体积不超过 32 KiB', gif.length + ' bytes');

console.log(failed === 0 ? '\nASSET CHECK PASSED' : '\nASSET CHECK FAILED (' + failed + ')');
process.exitCode = failed === 0 ? 0 : 1;
