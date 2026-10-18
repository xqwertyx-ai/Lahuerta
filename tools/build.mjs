// Build de un solo archivo: dist/index.html con todo el JS, el CSS y las tipografías dentro.
// Además deja en dist/ el manifiesto, el service worker y los iconos para instalarlo como PWA.
// Uso: node tools/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

// ── Empaquetador mínimo de módulos ES ──
const modules = new Map(); // ruta absoluta → { id, deps, code, exports }
let nextId = 0;

const IMPORT_RE = /^\s*import\s+([\s\S]*?)\s+from\s+['"](.+?)['"];?/gm;
const EXPORT_FROM_RE = /^\s*export\s+(\*|\{[\s\S]*?\})\s+from\s+['"](.+?)['"];?/gm;

function load(file) {
  if (modules.has(file)) return modules.get(file);
  const src = fs.readFileSync(file, 'utf8');
  const mod = { id: nextId++, file, deps: [], code: '', exports: [], stars: [], reexports: [] };
  modules.set(file, mod);
  const dir = path.dirname(file);
  let code = src;
  if (/\bimport\s*\(/.test(code.replace(/\/\/.*$/gm, ''))) throw new Error(`Import dinámico no soportado en ${file}`);
  // export … from
  code = code.replace(EXPORT_FROM_RE, (m, what, spec) => {
    const dep = load(path.resolve(dir, spec));
    mod.deps.push(dep);
    if (what === '*') mod.stars.push(dep);
    else {
      for (const part of what.slice(1, -1).split(',').map((x) => x.trim()).filter(Boolean)) {
        const [orig, alias] = part.split(/\s+as\s+/).map((x) => x.trim());
        mod.reexports.push([alias || orig, dep, orig]);
      }
    }
    return '';
  });
  // import … from
  code = code.replace(IMPORT_RE, (m, what, spec) => {
    const dep = load(path.resolve(dir, spec));
    mod.deps.push(dep);
    what = what.trim();
    if (what.startsWith('* as ')) return `const ${what.slice(5).trim()} = __m${dep.id};`;
    if (what.startsWith('{')) {
      const parts = what.slice(1, -1).split(',').map((x) => x.trim()).filter(Boolean)
        .map((p) => { const [a, b] = p.split(/\s+as\s+/).map((x) => x.trim()); return b ? `${a}: ${b}` : a; });
      return `const { ${parts.join(', ')} } = __m${dep.id};`;
    }
    throw new Error(`Import no soportado en ${file}: ${m}`);
  });
  // export declaraciones
  code = code.replace(/^export\s+(async\s+function|function\*?|class|const|let|var)\s+([A-Za-z_$][\w$]*)/gm, (m, kw, name) => {
    mod.exports.push(name);
    return `${kw} ${name}`;
  });
  // export { a, b as c };
  code = code.replace(/^export\s+\{([\s\S]*?)\};?/gm, (m, list) => {
    for (const part of list.split(',').map((x) => x.trim()).filter(Boolean)) {
      const [orig, alias] = part.split(/\s+as\s+/).map((x) => x.trim());
      mod.exports.push(alias ? `${alias}: ${orig}` : orig);
    }
    return '';
  });
  if (/^export\s/m.test(code)) throw new Error(`Export no soportado en ${file}: ${code.match(/^export\s.*$/m)[0]}`);
  mod.code = code;
  return mod;
}

function order(entry) {
  const out = [], state = new Map();
  const visit = (m, stack) => {
    if (state.get(m) === 2) return;
    if (state.get(m) === 1) throw new Error('Dependencia circular: ' + [...stack, m].map((x) => path.relative(ROOT, x.file)).join(' → '));
    state.set(m, 1);
    for (const d of m.deps) visit(d, [...stack, m]);
    state.set(m, 2);
    out.push(m);
  };
  visit(entry, []);
  return out;
}

function bundle(entryFile) {
  const entry = load(path.join(ROOT, entryFile));
  const list = order(entry);
  const parts = list.map((m) => {
    const ret = [
      ...m.stars.map((d) => `...__m${d.id}`),
      ...m.reexports.map(([name, d, orig]) => `${name}: __m${d.id}.${orig}`),
      ...m.exports,
    ];
    return `// ── ${path.relative(ROOT, m.file)} ──\nconst __m${m.id} = (() => {\n${m.code}\nreturn { ${ret.join(', ')} };\n})();`;
  });
  return { code: parts.join('\n\n'), count: list.length };
}

// ── CSS con las tipografías incrustadas ──
function inlineCss() {
  let css = read('src/ui/style.css');
  css = css.replace(/url\(['"]?\.\.\/\.\.\/fonts\/([\w.-]+)['"]?\)/g, (m, f) => {
    const b64 = fs.readFileSync(path.join(ROOT, 'fonts', f)).toString('base64');
    return `url(data:font/woff;base64,${b64})`;
  });
  return css;
}

function dataUri(file, mime) {
  return `data:${mime};base64,${fs.readFileSync(path.join(ROOT, file)).toString('base64')}`;
}

// ── Montaje ──
fs.mkdirSync(path.join(DIST, 'icons'), { recursive: true });
const { code, count } = bundle('src/main.js');
const version = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
let html = read('index.html');
html = html.replace(/<link rel="stylesheet" href="src\/ui\/style.css">/, () => `<style>\n${inlineCss()}\n</style>`);
html = html.replace(/<script type="module" src="src\/main.js"><\/script>/, () => `<script type="module">\n// La Huerta del Pianista · build ${version}\n${code.replace(/<\/script/gi, '<\\/script')}\n</script>`);
if (fs.existsSync(path.join(ROOT, 'icons/icon-192.png'))) {
  html = html.replace('<link rel="icon" href="icons/icon-192.png">', `<link rel="icon" href="${dataUri('icons/icon-192.png', 'image/png')}">`);
}
fs.writeFileSync(path.join(DIST, 'index.html'), html);
// PWA
for (const f of ['manifest.webmanifest']) fs.copyFileSync(path.join(ROOT, f), path.join(DIST, f));
for (const f of fs.readdirSync(path.join(ROOT, 'icons'))) fs.copyFileSync(path.join(ROOT, 'icons', f), path.join(DIST, 'icons', f));
fs.writeFileSync(path.join(DIST, 'sw.js'), read('sw.js').replace('__VERSION__', version));
const kb = (fs.statSync(path.join(DIST, 'index.html')).size / 1024).toFixed(0);
console.log(`dist/index.html · ${count} módulos · ${kb} KB · versión ${version}`);
