/**
 * 资源一致性校验：client.js 内联的「运行中」鲸尾徽标必须与 assets/active.png 完全一致。
 *
 * 浏览器侧不能直接引用包内图片路径，所以徽标把 PNG 内联成 data URI；
 * 这里保证内联副本不会和源文件漂移，并校验 PNG 本身可用（格式、尺寸、体积）。
 *
 * 运行：node test/assets.cjs
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'client.js'), 'utf8');
const png = fs.readFileSync(path.join(root, 'assets', 'active.png'));

let failed = 0;
function check(ok, label, extra) {
  if (ok) console.log('ok  :', label);
  else {
    console.error('FAIL:', label, extra === undefined ? '' : '-> ' + extra);
    failed += 1;
  }
}

const match = src.match(/var ACTIVE_TAIL = 'data:image\/png;base64,([A-Za-z0-9+/=]+)';/);
check(Boolean(match), 'client.js 含内联 PNG 常量');

if (match) {
  const inline = Buffer.from(match[1], 'base64');
  check(inline.length === png.length, '内联长度与文件一致', inline.length + ' vs ' + png.length);
  check(inline.equals(png), '内联字节与 assets/active.png 一致');
}

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
check(png.slice(0, 8).equals(SIGNATURE), '文件是合法 PNG');

const width = png.readUInt32BE(16);
const height = png.readUInt32BE(20);
check(width === 64 && height === 64, 'PNG 尺寸 64x64', width + 'x' + height);
check(png.length <= 32 * 1024, 'PNG 体积不超过 32 KiB', png.length + ' bytes');

check(src.indexOf('ah-tail') !== -1, '徽标使用 ah-tail 循环动画');
check(src.indexOf('@keyframes ah-tail') !== -1, '样式表定义了 ah-tail keyframes');

console.log(failed === 0 ? '\nASSET CHECK PASSED' : '\nASSET CHECK FAILED (' + failed + ')');
process.exitCode = failed === 0 ? 0 : 1;
