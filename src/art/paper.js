// Papel antiguo generado por código: fibras, manchas de café y humedad, bordes gastados.
import { makeRng, noise2, fbm2 } from './noise.js';
import { rgba, mix, blobPts, wash } from './ink.js';

export function makeCanvas(w, h) {
  if (typeof OffscreenCanvas !== 'undefined' && !makeCanvas.forceDom) {
    try { return new OffscreenCanvas(Math.max(1, w | 0), Math.max(1, h | 0)); } catch { /* sigue */ }
  }
  const c = document.createElement('canvas');
  c.width = Math.max(1, w | 0);
  c.height = Math.max(1, h | 0);
  return c;
}

// Textura de grano repetible (se usa como patrón)
let grainTile = null;
function getGrain() {
  if (grainTile) return grainTile;
  const S = 256;
  const c = makeCanvas(S, S);
  const g = c.getContext('2d');
  const img = g.createImageData(S, S);
  const r = makeRng(77);
  for (let i = 0; i < S * S; i++) {
    const v = r();
    const k = i * 4;
    img.data[k] = 90; img.data[k + 1] = 70; img.data[k + 2] = 45;
    img.data[k + 3] = v < 0.5 ? Math.floor(v * 26) : 0;
  }
  g.putImageData(img, 0, 0);
  grainTile = c;
  return c;
}

// tone: color base del papel. edges: bordes gastados y viñeta (para la página del plano)
export function makePaper(w, h, { seed = 1, tone = '#efe2c4', edges = true, stains = true, scale = 1 } = {}) {
  const c = makeCanvas(w, h);
  const g = c.getContext('2d');
  const r = makeRng(seed);
  g.fillStyle = tone;
  g.fillRect(0, 0, w, h);

  // Moteado de baja frecuencia
  const sw = Math.max(8, Math.ceil(w / 10)), sh = Math.max(8, Math.ceil(h / 10));
  const small = makeCanvas(sw, sh);
  const sg = small.getContext('2d');
  const img = sg.createImageData(sw, sh);
  const n2 = noise2(seed * 13 + 1);
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const v = fbm2(n2, x / 9, y / 9, 4);
      const k = (x + y * sw) * 4;
      const dark = v > 0.5;
      img.data[k] = dark ? 120 : 255; img.data[k + 1] = dark ? 95 : 250; img.data[k + 2] = dark ? 60 : 235;
      img.data[k + 3] = Math.floor(Math.abs(v - 0.5) * 2 * 60);
    }
  }
  sg.putImageData(img, 0, 0);
  g.imageSmoothingEnabled = true;
  g.drawImage(small, 0, 0, w, h);

  // Grano
  const pat = g.createPattern(getGrain(), 'repeat');
  g.fillStyle = pat;
  g.fillRect(0, 0, w, h);

  // Fibras
  const fibers = Math.round((w * h) / 2200);
  g.lineCap = 'round';
  for (let i = 0; i < fibers; i++) {
    const x = r() * w, y = r() * h, L = (4 + r() * 16) * scale, a = r() * Math.PI;
    g.strokeStyle = r() < 0.7 ? rgba('#8b6a42', 0.05 + r() * 0.08) : rgba('#ffffff', 0.25);
    g.lineWidth = (0.4 + r() * 0.6) * scale;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(a) * L * 0.5 + r() * 4, y + Math.sin(a) * L * 0.5 + r() * 4, x + Math.cos(a) * L, y + Math.sin(a) * L);
    g.stroke();
  }

  if (stains) {
    // Manchas de humedad
    const hum = 2 + Math.floor(r() * 3);
    for (let i = 0; i < hum; i++) {
      const cx = r() * w, cy = r() * h, rad = (60 + r() * 160) * scale;
      wash(g, blobPts(cx, cy, rad, rad * (0.6 + r() * 0.5), r, 0.25, 30), '#b89a6a', r, { alpha: 0.10, layers: 2, spread: 4 * scale, edge: 0.9, grain: 0 });
    }
    // Aros de café
    const rings = r() < 0.8 ? 1 + Math.floor(r() * 2) : 0;
    for (let i = 0; i < rings; i++) coffeeRing(g, r() * w, r() * h, (28 + r() * 26) * scale, r);
    // Puntos de óxido (foxing)
    for (let i = 0; i < (w * h) / 40000; i++) {
      g.fillStyle = rgba('#9a6a3a', 0.08 + r() * 0.12);
      g.beginPath();
      g.arc(r() * w, r() * h, (0.6 + r() * 2.2) * scale, 0, Math.PI * 2);
      g.fill();
    }
  }

  if (edges) wornEdges(g, w, h, r, scale);
  return c;
}

export function coffeeRing(g, cx, cy, rad, r) {
  for (let k = 0; k < 3; k++) {
    g.strokeStyle = rgba('#7a4f26', 0.07 + r() * 0.06);
    g.lineWidth = 1 + r() * 3;
    g.beginPath();
    const start = r() * Math.PI * 2, span = Math.PI * (1.3 + r() * 0.7);
    for (let a = 0; a <= span; a += 0.08) {
      const rr = rad + Math.sin(a * 3 + k) * 1.5 + k;
      const x = cx + Math.cos(start + a) * rr, y = cy + Math.sin(start + a) * rr;
      a ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.stroke();
  }
  g.fillStyle = rgba('#a07040', 0.035);
  g.beginPath();
  g.arc(cx, cy, rad, 0, Math.PI * 2);
  g.fill();
}

function wornEdges(g, w, h, r, scale) {
  // Viñeta tostada
  const m = Math.min(w, h);
  const vg = g.createRadialGradient(w / 2, h / 2, m * 0.35, w / 2, h / 2, Math.hypot(w, h) * 0.56);
  vg.addColorStop(0, 'rgba(120,80,40,0)');
  vg.addColorStop(1, 'rgba(110,70,30,0.32)');
  g.fillStyle = vg;
  g.fillRect(0, 0, w, h);
  // Borde quemado irregular
  const band = 14 * scale;
  for (const side of [0, 1, 2, 3]) {
    const len = side % 2 === 0 ? w : h;
    for (let i = 0; i < len; i += 6 * scale) {
      const d = band * (0.3 + r() * 0.9);
      g.fillStyle = rgba('#7a5530', 0.05 + r() * 0.07);
      if (side === 0) g.fillRect(i, 0, 7 * scale, d);
      if (side === 1) g.fillRect(w - d, i, d, 7 * scale);
      if (side === 2) g.fillRect(i, h - d, 7 * scale, d);
      if (side === 3) g.fillRect(0, i, d, 7 * scale);
    }
  }
  // Muescas: pequeños mordiscos del borde
  g.save();
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 26; i++) {
    const side = Math.floor(r() * 4);
    const t = r();
    const x = side === 1 ? w : side === 3 ? 0 : t * w;
    const y = side === 0 ? 0 : side === 2 ? h : t * h;
    g.beginPath();
    g.arc(x, y, (1.5 + r() * 5) * scale, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}

// Azulejo de papel para fondos de la interfaz (DOM)
// Se repite en espejo (2 × 2) para que no se vean las juntas entre azulejos
export function paperDataURL(size = 512, tone = '#f1e6cc', seed = 5) {
  const half = size / 2;
  const c = makePaper(half, half, { seed, tone, edges: false, stains: false });
  const out = document.createElement('canvas');
  out.width = size; out.height = size;
  const g = out.getContext('2d');
  g.drawImage(c, 0, 0);
  g.save(); g.translate(size, 0); g.scale(-1, 1); g.drawImage(c, 0, 0); g.restore();
  g.save(); g.translate(0, size); g.scale(1, -1); g.drawImage(c, 0, 0); g.restore();
  g.save(); g.translate(size, size); g.scale(-1, -1); g.drawImage(c, 0, 0); g.restore();
  return out.toDataURL('image/jpeg', 0.86);
}

export { mix };
