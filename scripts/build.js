// Builds dist/: one self-contained index.html plus PWA files.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

// Order matters: later files use names declared by earlier ones.
const JS = ['data', 'data-extra', 'world', 'rules-core', 'rules-actions', 'rules-extra', 'effects', 'mp', 'net', 'ui', 'ui-mp', 'graphics', 'boot'];
const js = JS.map(n => `// ===== ${n}.js =====\n` + read(`src/js/${n}.js`)).join('\n');

let body = read('src/body.html');
const head = [];
body = body.replace(/<link [^>]*>\s*/g, m => (head.push(m.trim()), ''));
body = body.replace(/<style>[\s\S]*?<\/style>\s*/, m => (head.push(m.trim()), ''));
body = body.replace('/*JS*/', () => js);

const pkg = JSON.parse(read('package.json'));
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0b0d12">
<meta name="description" content="Deepwell is an endless roguelike full of secrets: unknown potions, wands, rings, shuffled depths and monsters with hidden weaknesses.">
<meta property="og:title" content="Deepwell">
<meta property="og:description" content="An endless 8-bit roguelike. Decode the secrets of the well.">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Deepwell">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<title>Deepwell</title>
<style>html{color-scheme:dark;background:#0b0d12}body{margin:0}:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}[hidden]{display:none!important}</style>
${head.join('\n')}
</head>
<body>
${body}
</body>
</html>
`;

const version = crypto.createHash('sha1').update(html).digest('hex').slice(0, 10);
const dist = path.join(root, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
fs.writeFileSync(path.join(dist, 'index.html'), html);
fs.writeFileSync(path.join(dist, 'sw.js'), read('public/sw.js').replace('__VERSION__', version));
fs.writeFileSync(path.join(dist, '.nojekyll'), '');
(function copy(src, dst) {
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    if (e.name === 'sw.js') continue;
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) { fs.mkdirSync(d, { recursive: true }); copy(s, d); } else fs.copyFileSync(s, d);
  }
})(path.join(root, 'public'), dist);
console.log(`Built dist/ (${pkg.name} ${pkg.version}, ${(html.length / 1024).toFixed(0)} KB, cache ${version})`);
