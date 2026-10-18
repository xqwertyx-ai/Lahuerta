// Trazo «a mano»: líneas con temblor, doble trazo, rayado y aguadas de acuarela.
// Todo se dibuja sobre capas cacheadas, nunca por fotograma.
import { makeRng, noise1 } from './noise.js';

// ── Color ──
export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgba(hex, a = 1) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}
export function mix(h1, h2, t) {
  const a = hexToRgb(h1), b = hexToRgb(h2);
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

export const INK = '#3b2a1c';       // sepia oscuro
export const INK_LIGHT = '#6e5440';
export const PENCIL = '#8a7b6a';

// ── Pluma ──
export class Pen {
  constructor(ctx, seed = 1) {
    this.ctx = ctx;
    this.rng = makeRng(seed);
    this.n = noise1(seed * 7 + 3);
    this.t = 0;
    this.color = INK;
    this.width = 1.4;
    this.wobble = 1.0;
    this.alpha = 1;
    this.double = true;
  }
  set(o) { Object.assign(this, o); return this; }

  // Puntos temblorosos a lo largo de un segmento
  _points(x1, y1, x2, y2) {
    const r = this.rng;
    const dx = x2 - x1, dy = y2 - y1;
    const L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L;
    const steps = Math.max(2, Math.ceil(L / 7));
    const bow = r.gauss() * Math.min(L * 0.02, 6) * this.wobble;
    const t0 = -r() * 0.03, t1 = 1 + r() * 0.03;
    const pts = [];
    this.t += 13.7;
    for (let i = 0; i <= steps; i++) {
      const u = t0 + (t1 - t0) * (i / steps);
      const j = this.n(this.t + u * L / 22) * 1.1 * this.wobble + Math.sin(Math.PI * u) * bow;
      pts.push([x1 + dx * u + nx * j, y1 + dy * u + ny * j]);
    }
    return pts;
  }

  _stroke(pts, w, a) {
    const c = this.ctx;
    c.strokeStyle = rgba(this.color, a * this.alpha);
    c.lineCap = 'round';
    c.lineJoin = 'round';
    const n = pts.length - 1;
    // Presión: más fino en los extremos
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n;
      c.lineWidth = Math.max(0.35, w * (0.45 + 0.55 * Math.sin(Math.PI * Math.min(1, u * 1.15))));
      c.beginPath();
      c.moveTo(pts[i][0], pts[i][1]);
      c.lineTo(pts[i + 1][0], pts[i + 1][1]);
      c.stroke();
    }
  }

  line(x1, y1, x2, y2) {
    this._stroke(this._points(x1, y1, x2, y2), this.width, 0.92);
    if (this.double) {
      const o = this.width * 0.6;
      this._stroke(this._points(x1 + this.rng.gauss() * o, y1 + this.rng.gauss() * o, x2 + this.rng.gauss() * o, y2 + this.rng.gauss() * o), this.width * 0.6, 0.45);
    }
    return this;
  }

  // Polilínea (closed = cierra la figura)
  path(pts, closed = false) {
    if (pts.length < 2) return this;
    const P = closed ? [...pts, pts[0]] : pts;
    const all = [];
    for (let i = 0; i < P.length - 1; i++) {
      const seg = this._points(P[i][0], P[i][1], P[i + 1][0], P[i + 1][1]);
      if (i > 0) seg.shift();
      all.push(...seg);
    }
    this._stroke(all, this.width, 0.92);
    if (this.double) {
      const o = this.width * 0.7;
      const shifted = P.map(([x, y]) => [x + this.rng.gauss() * o, y + this.rng.gauss() * o]);
      const all2 = [];
      for (let i = 0; i < shifted.length - 1; i++) {
        const seg = this._points(shifted[i][0], shifted[i][1], shifted[i + 1][0], shifted[i + 1][1]);
        if (i > 0) seg.shift();
        all2.push(...seg);
      }
      this._stroke(all2, this.width * 0.55, 0.4);
    }
    return this;
  }

  // Curva suave a mano por puntos de control (Catmull-Rom muestreada)
  curve(pts, closed = false) {
    return this.path(smoothPts(pts, closed, 6), false);
  }

  ellipse(cx, cy, rx, ry, irregular = 0.04) {
    const pts = blobPts(cx, cy, rx, ry, this.rng, irregular, Math.max(10, Math.round((rx + ry) / 3)));
    return this.path(pts, true);
  }

  rect(x, y, w, h) { return this.path([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], true); }

  // Rayado dentro de un polígono
  hatch(poly, { angle = -0.9, gap = 4, cross = false, width = null, alpha = 0.6 } = {}) {
    const c = this.ctx;
    c.save();
    c.beginPath();
    poly.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
    c.clip();
    const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
    const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
    const cx = (minx + maxx) / 2, cy = (miny + maxy) / 2;
    const R = Math.hypot(maxx - minx, maxy - miny) / 2 + 4;
    const saved = { w: this.width, d: this.double, a: this.alpha };
    this.width = width || this.width * 0.55;
    this.double = false;
    this.alpha = saved.a * alpha;
    const sets = cross ? [angle, angle + 1.2] : [angle];
    for (const ang of sets) {
      const ca = Math.cos(ang), sa = Math.sin(ang);
      for (let d = -R; d <= R; d += gap * (0.8 + this.rng() * 0.4)) {
        const px = cx - sa * d, py = cy + ca * d;
        this.line(px - ca * R, py - sa * R, px + ca * R, py + sa * R);
      }
    }
    this.width = saved.w; this.double = saved.d; this.alpha = saved.a;
    c.restore();
    return this;
  }

  // Punteado (grava, arena, flores)
  stipple(poly, density = 0.02, size = 1.1, color = null) {
    const c = this.ctx;
    const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
    const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
    const n = Math.round((maxx - minx) * (maxy - miny) * density);
    c.save();
    c.beginPath();
    poly.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
    c.clip();
    c.fillStyle = rgba(color || this.color, 0.7 * this.alpha);
    for (let i = 0; i < n; i++) {
      const x = minx + this.rng() * (maxx - minx), y = miny + this.rng() * (maxy - miny);
      c.beginPath();
      c.arc(x, y, size * (0.5 + this.rng()), 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
    return this;
  }

  dot(x, y, r = 1.2, color = null, a = 0.85) {
    const c = this.ctx;
    c.fillStyle = rgba(color || this.color, a * this.alpha);
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
    return this;
  }
}

// ── Formas ──
export function blobPts(cx, cy, rx, ry, rng, irregular = 0.12, n = 22, rot = 0) {
  const pts = [];
  const ph = rng() * Math.PI * 2, ph2 = rng() * Math.PI * 2;
  const k1 = 2 + Math.floor(rng() * 3), k2 = 5 + Math.floor(rng() * 4);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const m = 1 + irregular * (0.6 * Math.sin(k1 * a + ph) + 0.4 * Math.sin(k2 * a + ph2)) + irregular * 0.3 * (rng() - 0.5);
    const x = Math.cos(a) * rx * m, y = Math.sin(a) * ry * m;
    pts.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
  }
  return pts;
}

// Contorno festoneado de copa de árbol
export function canopyPts(cx, cy, rx, ry, rng, bumps = 9, depth = 0.16) {
  const pts = [];
  const n = bumps * 5;
  const ph = rng() * 6.28;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const b = Math.abs(Math.sin((a * bumps) / 2 + ph));
    const m = 1 - depth + depth * b * 1.2 + (rng() - 0.5) * 0.05;
    pts.push([cx + Math.cos(a) * rx * m, cy + Math.sin(a) * ry * m]);
  }
  return pts;
}

export function smoothPts(pts, closed = false, seg = 6) {
  const out = [];
  const n = pts.length;
  const get = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    for (let j = 0; j < seg; j++) {
      const t = j / seg, t2 = t * t, t3 = t2 * t;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  out.push(closed ? out[0] : pts[n - 1]);
  return out;
}

// ── Acuarela ──
// Varias capas translúcidas con bordes temblorosos, borde más oscuro y granulado.
export function wash(ctx, pts, color, rng, { alpha = 0.32, layers = 3, spread = 2.5, edge = 0.35, grain = 0.006 } = {}) {
  if (!pts || pts.length < 3) return;
  for (let l = 0; l < layers; l++) {
    ctx.fillStyle = rgba(color, alpha / layers * 1.6);
    ctx.beginPath();
    pts.forEach(([x, y], i) => {
      const jx = x + rng.gauss() * spread, jy = y + rng.gauss() * spread;
      i ? ctx.lineTo(jx, jy) : ctx.moveTo(jx, jy);
    });
    ctx.closePath();
    ctx.fill();
  }
  if (edge > 0) {
    ctx.strokeStyle = rgba(mix(color, '#2a1a10', 0.25), alpha * edge);
    ctx.lineWidth = 1.3;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    pts.forEach(([x, y], i) => {
      const jx = x + rng.gauss() * spread * 0.6, jy = y + rng.gauss() * spread * 0.6;
      i ? ctx.lineTo(jx, jy) : ctx.moveTo(jx, jy);
    });
    ctx.closePath();
    ctx.stroke();
  }
  if (grain > 0) {
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
    const n = Math.min(600, Math.round((maxx - minx) * (maxy - miny) * grain));
    ctx.save();
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = rgba(mix(color, '#2a1a10', 0.35), alpha * 0.5);
    for (let i = 0; i < n; i++) {
      ctx.fillRect(minx + rng() * (maxx - minx), miny + rng() * (maxy - miny), 0.9 + rng(), 0.9 + rng());
    }
    ctx.restore();
  }
}

export function washBlob(ctx, cx, cy, rx, ry, color, rng, o = {}) {
  wash(ctx, blobPts(cx, cy, rx, ry, rng, o.irregular ?? 0.14, 26), color, rng, o);
}

export function washRect(ctx, x, y, w, h, color, rng, o = {}) {
  wash(ctx, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], color, rng, o);
}

// Degradado suave de acuarela (cielos, suelos)
export function washGradient(ctx, x, y, w, h, c1, c2, alpha = 0.3) {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, rgba(c1, alpha));
  g.addColorStop(1, rgba(c2, alpha));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}
