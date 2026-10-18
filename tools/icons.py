"""Genera los iconos de la PWA con el propio sistema de dibujo del juego.
Uso: python3 tools/icons.py   (levanta el servidor de desarrollo un momento)"""
import os, socket, subprocess, time
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
s = socket.socket(); s.bind(('127.0.0.1', 0)); port = s.getsockname()[1]; s.close()
srv = subprocess.Popen(['node', os.path.join(ROOT, 'tools', 'serve.mjs'), str(port), ROOT], stdout=subprocess.DEVNULL)
time.sleep(0.7)
PAGE = """<!doctype html><html><body style="margin:0"><canvas id=c></canvas><script type=module>
import { makePaper } from '/src/art/paper.js';
import { singleCtx } from '/src/art/map.js';
import { palette } from '/src/art/palette.js';
import { encina, pino } from '/src/art/sketches.js';
const q = new URLSearchParams(location.search); const N = +q.get('n'); const mask = q.get('mask');
const c = document.getElementById('c'); c.width = N; c.height = N;
const g = c.getContext('2d');
g.drawImage(makePaper(N, N, { seed: 3, tone: '#efe2c4', edges: !mask, scale: N / 512 }), 0, 0);
const k = N / 512; const pad = mask ? 0.62 : 0.86;
g.save(); g.translate(N * (1 - pad) / 2, N * (1 - pad) / 2); g.scale(k * pad, k * pad);
const d = singleCtx(g, 21, palette(2), 512, 512);
// Teclado de piano a plumilla bajo una encina, con el pino
d.wash([[60, 330], [452, 330], [452, 420], [60, 420]], '#5a3a26', { alpha: 0.75 });
d.pen.set({ width: 5 }); d.pen.rect(60, 330, 392, 90);
d.wash([[70, 390], [442, 390], [442, 412], [70, 412]], '#f6f1e6', { alpha: 0.95, edge: 0 });
d.pen.set({ width: 2.4, double: false });
for (let i = 0; i <= 14; i++) d.pen.line(70 + i * 26.5, 390, 70 + i * 26.5, 412);
for (let i = 0; i < 14; i++) if (i % 7 !== 2 && i % 7 !== 6) { g.fillStyle = '#1e1610'; g.fillRect(70 + i * 26.5 + 18, 390, 16, 13); }
encina(d, 210, 300, 4.4);
pino(d, 395, 320, 1.55);
g.restore();
document.title = 'ok';
</script></body></html>"""
os.makedirs(os.path.join(ROOT, 'icons'), exist_ok=True)
with open(os.path.join(ROOT, 'icons', '_gen.html'), 'w') as f: f.write(PAGE)
try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        for n, name, mask in ((192, 'icon-192.png', ''), (512, 'icon-512.png', ''), (512, 'icon-maskable-512.png', '1')):
            pg = b.new_page(viewport={'width': n, 'height': n})
            pg.goto(f'http://127.0.0.1:{port}/icons/_gen.html?n={n}&mask={mask}')
            pg.wait_for_function("document.title === 'ok'")
            pg.locator('#c').screenshot(path=os.path.join(ROOT, 'icons', name))
            pg.close()
            print('icons/' + name)
        b.close()
finally:
    os.remove(os.path.join(ROOT, 'icons', '_gen.html'))
    srv.terminate()
