// Ilustraciones a boceto de la finca, dibujadas a partir de las fotos de referencia.
// Cada función dibuja en coordenadas locales de su zona (0,0 → w,h) sobre dos capas:
//   d.pen → tinta (capa de líneas)      d.wash(...) → acuarela (capa de color)
import { canopyPts, blobPts, rgba, mix } from './ink.js';
import { GRANDCHILDREN } from '../data/family.js';

// ───────────────────────── Elementos reutilizables ─────────────────────────

export function groundShadow(d, x, y, rx, ry = rx * 0.28) {
  d.washBlob(x, y, rx, ry, '#6b5a48', { alpha: 0.16, layers: 2, edge: 0, grain: 0 });
}

// Mancha de suelo con bordes irregulares (nada de rectángulos)
export function groundPatch(d, x, y, w, h, color, alpha = 0.32, rad = 26) {
  const { r } = d;
  const pts = [];
  const step = 14;
  const push = (px, py) => pts.push([px + r.gauss() * 5, py + r.gauss() * 5]);
  for (let px = x + rad; px < x + w - rad; px += step) push(px, y);
  for (let a = -Math.PI / 2; a < 0; a += 0.35) push(x + w - rad + Math.cos(a) * rad, y + rad + Math.sin(a) * rad);
  for (let py = y + rad; py < y + h - rad; py += step) push(x + w, py);
  for (let a = 0; a < Math.PI / 2; a += 0.35) push(x + w - rad + Math.cos(a) * rad, y + h - rad + Math.sin(a) * rad);
  for (let px = x + w - rad; px > x + rad; px -= step) push(px, y + h);
  for (let a = Math.PI / 2; a < Math.PI; a += 0.35) push(x + rad + Math.cos(a) * rad, y + h - rad + Math.sin(a) * rad);
  for (let py = y + h - rad; py > y + rad; py -= step) push(x, py);
  for (let a = Math.PI; a < Math.PI * 1.5; a += 0.35) push(x + rad + Math.cos(a) * rad, y + rad + Math.sin(a) * rad);
  d.wash(pts, color, { alpha, spread: 5, edge: 0.12, grain: 0.002 });
  return pts;
}

export function encina(d, x, y, s = 1) {
  const { pen, r, P } = d;
  groundShadow(d, x + 4 * s, y, 26 * s);
  const cx = x + r.range(-3, 3) * s, cy = y - 27 * s;
  const pts = canopyPts(cx, cy, 27 * s, 16 * s, r, 9, 0.18);
  d.wash(pts, P.oak, { alpha: 0.55, spread: 2 * s });
  d.washBlob(cx + 6 * s, cy + 5 * s, 18 * s, 9 * s, P.foliageDark, { alpha: 0.25, edge: 0, grain: 0 });
  pen.set({ width: 1.2 * Math.sqrt(s), color: '#3b2a1c' });
  // Tronco retorcido
  pen.curve([[x - 3 * s, y], [x - 2 * s, y - 7 * s], [x - 5 * s, y - 13 * s], [x - 9 * s, y - 17 * s]]);
  pen.curve([[x + 3 * s, y], [x + 2 * s, y - 8 * s], [x + 5 * s, y - 13 * s], [x + 10 * s, y - 16 * s]]);
  pen.path(pts, true);
  // Textura de hojas: pequeños arcos
  pen.set({ width: 0.7 * Math.sqrt(s) });
  for (let i = 0; i < 7; i++) {
    const a = r() * Math.PI * 2, rr = r() * 0.7;
    const px = cx + Math.cos(a) * 20 * s * rr, py = cy + Math.sin(a) * 11 * s * rr;
    pen.curve([[px - 3 * s, py], [px, py - 2.5 * s], [px + 3 * s, py]]);
  }
  pen.set({ width: 1.4 });
}

export function olivo(d, x, y, s = 1) {
  const { pen, r, P } = d;
  groundShadow(d, x + 3 * s, y, 18 * s);
  const cx = x, cy = y - 20 * s;
  const pts = canopyPts(cx, cy, 18 * s, 12 * s, r, 7, 0.22);
  d.wash(pts, mix(P.oak, '#a3a68a', 0.5), { alpha: 0.5 });
  pen.set({ width: 1.1 });
  pen.curve([[x, y], [x + 2 * s, y - 6 * s], [x - 1 * s, y - 12 * s]]);
  pen.path(pts, true);
  pen.set({ width: 1.4 });
}

export function pino(d, x, y, s = 1) {
  const { pen, r, P } = d;
  groundShadow(d, x + 6 * s, y, 22 * s);
  const top = y - 150 * s;
  pen.set({ width: 1.8 * Math.sqrt(s) });
  pen.curve([[x - 2.5 * s, y], [x - 1 * s, y - 60 * s], [x + 2 * s, y - 110 * s], [x + 1 * s, top]]);
  pen.curve([[x + 2.5 * s, y], [x + 3 * s, y - 60 * s], [x + 4 * s, y - 110 * s], [x + 1.5 * s, top]]);
  // Mechones de agujas, alternos y cada vez más pequeños
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    const yy = y - 45 * s - t * 100 * s;
    const side = i % 2 ? 1 : -1;
    const len = (30 - t * 18) * s;
    const bx = x + side * len * 0.7, by = yy - 4 * s;
    pen.set({ width: 1.0 });
    pen.line(x + side * 2 * s, yy + 3 * s, bx, by);
    const pts = canopyPts(bx, by, len * 0.75, 7 * s * (1 - t * 0.4), r, 8, 0.3);
    d.wash(pts, P.pine, { alpha: 0.5, spread: 1.5 });
    pen.set({ width: 0.9 });
    pen.path(pts, true);
  }
  d.wash(canopyPts(x + 1 * s, top + 8 * s, 10 * s, 12 * s, r, 7, 0.3), P.pine, { alpha: 0.5 });
  pen.path(canopyPts(x + 1 * s, top + 8 * s, 10 * s, 12 * s, r, 7, 0.3), true);
  pen.set({ width: 1.4 });
}

export function eucalipto(d, x, y, s = 1) {
  const { pen, r, P } = d;
  groundShadow(d, x + 5 * s, y, 24 * s);
  const top = y - 120 * s;
  d.wash([[x - 4 * s, y], [x - 2 * s, top + 30 * s], [x + 3 * s, top + 30 * s], [x + 5 * s, y]], '#a8653a', { alpha: 0.35, edge: 0 });
  pen.set({ width: 1.5 });
  pen.curve([[x - 4 * s, y], [x - 3 * s, y - 50 * s], [x - 1 * s, top + 25 * s]]);
  pen.curve([[x + 5 * s, y], [x + 4 * s, y - 55 * s], [x + 3 * s, top + 25 * s]]);
  // Corteza que se pela
  pen.set({ width: 0.7 });
  for (let i = 0; i < 4; i++) {
    const yy = y - (10 + r() * 70) * s;
    pen.line(x - 2 * s, yy, x + 2 * s, yy - 6 * s);
  }
  // Copa colgante y abierta
  const blobs = [[-22, -95, 28, 22], [18, -105, 26, 20], [0, -118, 22, 16], [-8, -80, 20, 14], [24, -82, 18, 13]];
  for (const [dx, dy, rx, ry] of blobs) {
    const pts = canopyPts(x + dx * s, y + dy * s, rx * s, ry * s, r, 7, 0.28);
    d.wash(pts, mix(P.foliageDark, '#8ea08a', 0.45), { alpha: 0.42, spread: 2 });
  }
  pen.set({ width: 0.8 });
  for (let i = 0; i < 26; i++) {
    const a = r() * Math.PI * 2, rr = Math.sqrt(r());
    const px = x + Math.cos(a) * 34 * s * rr, py = y - 98 * s + Math.sin(a) * 24 * s * rr;
    pen.curve([[px, py], [px + 1.5 * s, py + 4 * s], [px + 0.5 * s, py + 8 * s]]);
  }
  pen.set({ width: 1.4 });
}

export function mimosa(d, x, y, s = 1) {
  const { pen, r, P } = d;
  groundShadow(d, x + 4 * s, y, 22 * s);
  pen.set({ width: 1.3 });
  pen.curve([[x, y], [x - 1 * s, y - 20 * s], [x + 3 * s, y - 34 * s]]);
  pen.line(x, y - 22 * s, x - 10 * s, y - 34 * s);
  const cx = x + 2 * s, cy = y - 50 * s;
  const pts = canopyPts(cx, cy, 30 * s, 24 * s, r, 11, 0.2);
  d.wash(pts, mix(P.foliage, '#5c7a44', 0.5), { alpha: 0.35 });
  d.wash(canopyPts(cx + 4 * s, cy - 4 * s, 26 * s, 19 * s, r, 10, 0.25), P.mimosa, { alpha: 0.55 });
  pen.set({ width: 0.9 });
  pen.path(pts, true);
  for (let i = 0; i < 40; i++) {
    const a = r() * 6.28, rr = Math.sqrt(r());
    pen.dot(cx + Math.cos(a) * 26 * s * rr, cy + Math.sin(a) * 20 * s * rr, 1.1 * s, '#9a7a10', 0.6);
  }
  pen.set({ width: 1.4 });
}

export function higuera(d, x, y, s = 1) {
  const { pen, r, P } = d;
  groundShadow(d, x + 3 * s, y, 26 * s);
  pen.set({ width: 1.2 });
  for (const dx of [-8, 0, 7]) pen.curve([[x + dx * 0.3 * s, y], [x + dx * s, y - 14 * s], [x + dx * 1.8 * s, y - 24 * s]]);
  const cx = x, cy = y - 32 * s;
  const pts = canopyPts(cx, cy, 30 * s, 18 * s, r, 8, 0.24);
  d.wash(pts, P.foliage, { alpha: 0.5 });
  pen.set({ width: 1.0 });
  pen.path(pts, true);
  // Hojas lobuladas
  pen.set({ width: 0.7 });
  for (let i = 0; i < 6; i++) {
    const px = cx + r.range(-20, 20) * s, py = cy + r.range(-10, 10) * s;
    pen.path([[px, py + 3 * s], [px - 3 * s, py - 1 * s], [px - 1 * s, py - 4 * s], [px, py - 2 * s], [px + 1 * s, py - 4 * s], [px + 3 * s, py - 1 * s]], true);
  }
  pen.set({ width: 1.4 });
}

export function adelfa(d, x, y, s = 1, flower = '#ffffff') {
  const { pen, r, P } = d;
  const cx = x, cy = y - 16 * s;
  const pts = blobPts(cx, cy, 22 * s, 17 * s, r, 0.2, 26);
  d.wash(pts, P.foliageDark, { alpha: 0.5 });
  pen.set({ width: 1.0 });
  pen.path(pts, true);
  // Hojas lanceoladas
  pen.set({ width: 0.6 });
  for (let i = 0; i < 12; i++) {
    const a = r() * 6.28, rr = Math.sqrt(r()) * 0.8;
    const px = cx + Math.cos(a) * 20 * s * rr, py = cy + Math.sin(a) * 15 * s * rr;
    const ang = a + r.range(-0.5, 0.5);
    pen.line(px, py, px + Math.cos(ang) * 5 * s, py + Math.sin(ang) * 5 * s);
  }
  // Flores
  for (let i = 0; i < 9; i++) {
    const px = cx + r.range(-17, 17) * s, py = cy + r.range(-12, 8) * s;
    d.washBlob(px, py, 2.4 * s, 2.4 * s, flower, { alpha: 0.95, layers: 1, edge: 0, grain: 0 });
    pen.set({ width: 0.5 });
    pen.ellipse(px, py, 2.2 * s, 2.2 * s, 0.2);
  }
  pen.set({ width: 1.4 });
}

export function yuca(d, x, y, s = 1, trunk = 0) {
  const { pen, r, P } = d;
  pen.set({ width: 1.2 });
  const top = y - trunk * s;
  if (trunk) {
    d.wash([[x - 3 * s, y], [x - 2 * s, top], [x + 2 * s, top], [x + 3 * s, y]], P.wood, { alpha: 0.4, edge: 0 });
    pen.line(x - 3 * s, y, x - 2 * s, top);
    pen.line(x + 3 * s, y, x + 2 * s, top);
  }
  const leaves = 15;
  for (let i = 0; i < leaves; i++) {
    const a = -Math.PI * (0.05 + 0.9 * (i / (leaves - 1))) + r.range(-0.08, 0.08);
    const L = (16 + r() * 8) * s;
    const ex = x + Math.cos(a) * L, ey = top + Math.sin(a) * L * 0.95;
    d.wash([[x, top], [ex, ey], [x + Math.cos(a + 0.12) * L * 0.5, top + Math.sin(a + 0.12) * L * 0.5]], P.grassDark, { alpha: 0.45, edge: 0, grain: 0, spread: 0.5 });
    pen.set({ width: 0.9 });
    pen.line(x, top, ex, ey);
  }
  pen.set({ width: 1.4 });
}

export function lavanda(d, x, y, s = 1) {
  const { pen, r, P } = d;
  const pts = blobPts(x, y - 8 * s, 14 * s, 9 * s, r, 0.2, 18);
  d.wash(pts, mix(P.grassDark, '#8a9a8a', 0.4), { alpha: 0.45 });
  pen.set({ width: 0.6 });
  for (let i = 0; i < 14; i++) {
    const px = x + r.range(-12, 12) * s;
    const h = r.range(10, 18) * s;
    pen.line(px, y - 4 * s, px + r.range(-2, 2) * s, y - h);
    d.washBlob(px, y - h, 1.6 * s, 3.2 * s, P.lavender, { alpha: 0.8, layers: 1, edge: 0, grain: 0 });
  }
  pen.set({ width: 1.4 });
}

export function arbusto(d, x, y, s = 1, color) {
  const { pen, r, P } = d;
  const pts = blobPts(x, y - 7 * s, 13 * s, 8 * s, r, 0.25, 18);
  d.wash(pts, color || P.grassDark, { alpha: 0.45 });
  pen.set({ width: 0.8 });
  pen.path(pts, true);
  pen.set({ width: 1.4 });
}

export function boulder(d, x, y, rx, ry, rot = 0) {
  const { pen, r, P } = d;
  const pts = blobPts(x, y, rx, ry, r, 0.12, 20, rot);
  d.wash(pts, P.granite, { alpha: 0.45, spread: 1.5 });
  pen.set({ width: 1.2 });
  pen.path(pts, true);
  // Sombra rayada abajo a la derecha
  const shade = pts.filter((p) => p[1] > y - ry * 0.1 || p[0] > x + rx * 0.3);
  if (shade.length > 3) pen.hatch([[x, y], ...shade], { angle: -0.8, gap: 3.2, alpha: 0.5 });
  pen.set({ width: 1.4 });
}

export function grassTufts(d, x0, y0, w, h, n, color = '#5a6b35') {
  const { pen, r } = d;
  const old = pen.color;
  pen.set({ width: 0.7, double: false, color });
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * w, y = y0 + r() * h;
    pen.line(x, y, x - 2, y - 4 - r() * 3);
    pen.line(x + 1, y, x + 2, y - 5 - r() * 3);
  }
  pen.set({ width: 1.4, double: true, color: old });
}

export function leafLitter(d, x0, y0, w, h, n, colors) {
  const { r } = d;
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * w, y = y0 + r() * h;
    d.washBlob(x, y, 1.8 + r() * 1.6, 1 + r(), r.pick(colors), { alpha: 0.6, layers: 1, edge: 0.4, grain: 0, irregular: 0.3 });
  }
}

function tilePattern(d, x, y, w, h, color, cell = 5) {
  const { pen } = d;
  d.wash([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], color, { alpha: 0.55, spread: 0.6, edge: 0.2 });
  pen.set({ width: 0.45, double: false });
  for (let yy = y + cell; yy < y + h - 0.5; yy += cell) pen.line(x, yy, x + w, yy);
  for (let xx = x + cell; xx < x + w - 0.5; xx += cell) pen.line(xx, y, xx, y + h);
  // Motivo de cruz en cada azulejo
  for (let yy = y; yy < y + h - 1; yy += cell) {
    for (let xx = x; xx < x + w - 1; xx += cell) {
      pen.dot(xx + cell / 2, yy + cell / 2, 0.7, '#1c2f55', 0.6);
    }
  }
  pen.set({ width: 1.4, double: true });
}

function roofTiles(d, poly, rows = 6) {
  const { pen, P } = d;
  d.wash(poly, P.roof, { alpha: 0.55, spread: 1 });
  const [a, b, c, e] = poly; // a,b abajo · c,e arriba
  pen.set({ width: 0.6, double: false });
  for (let i = 1; i < rows; i++) {
    const t = i / rows;
    const x1 = a[0] + (e[0] - a[0]) * t, y1 = a[1] + (e[1] - a[1]) * t;
    const x2 = b[0] + (c[0] - b[0]) * t, y2 = b[1] + (c[1] - b[1]) * t;
    // Hilera de tejas: pequeños arcos
    const n = Math.max(3, Math.round(Math.hypot(x2 - x1, y2 - y1) / 7));
    for (let k = 0; k < n; k++) {
      const u0 = k / n, u1 = (k + 1) / n;
      const px0 = x1 + (x2 - x1) * u0, py0 = y1 + (y2 - y1) * u0;
      const px1 = x1 + (x2 - x1) * u1, py1 = y1 + (y2 - y1) * u1;
      pen.curve([[px0, py0], [(px0 + px1) / 2, (py0 + py1) / 2 + 2], [px1, py1]]);
    }
  }
  pen.set({ width: 1.4, double: true });
}

function ironGrille(d, x, y, w, h) {
  const { pen } = d;
  pen.set({ width: 0.8, color: '#2b2420' });
  for (let i = 1; i < 5; i++) pen.line(x + (w * i) / 5, y, x + (w * i) / 5, y + h);
  pen.line(x, y + h * 0.33, x + w, y + h * 0.33);
  pen.line(x, y + h * 0.66, x + w, y + h * 0.66);
  // Volutas
  pen.curve([[x + w * 0.35, y + h * 0.5], [x + w * 0.5, y + h * 0.42], [x + w * 0.65, y + h * 0.5], [x + w * 0.5, y + h * 0.58], [x + w * 0.35, y + h * 0.5]]);
  pen.rect(x, y, w, h);
  pen.set({ width: 1.4, color: '#3b2a1c' });
}

function maceta(d, x, y) {
  const { pen, P } = d;
  d.wash([[x - 3.5, y - 5], [x + 3.5, y - 5], [x + 2.5, y + 1], [x - 2.5, y + 1]], P.pot, { alpha: 0.8, edge: 0.4, grain: 0 });
  pen.set({ width: 0.7 });
  pen.path([[x - 3.5, y - 5], [x + 3.5, y - 5], [x + 2.5, y + 1], [x - 2.5, y + 1]], true);
  pen.set({ width: 1.4 });
}

function farola(d, x, y, h = 70) {
  const { pen } = d;
  pen.set({ width: 1.1 });
  pen.line(x - 1, y, x - 1, y - h);
  pen.line(x + 1, y, x + 1, y - h);
  pen.path([[x - 5, y - h], [x + 5, y - h], [x + 4, y - h - 10], [x - 4, y - h - 10]], true);
  pen.path([[x - 6, y - h - 10], [x, y - h - 15], [x + 6, y - h - 10]], false);
  d.washBlob(x, y - h - 5, 3, 4, '#f5e6a0', { alpha: 0.7, edge: 0, grain: 0 });
  pen.rect(x - 4, y - 3, 8, 3);
  pen.set({ width: 1.4 });
}

function estatuaSentada(d, x, y, s = 1) {
  const { pen, P } = d;
  d.wash([[x - 9 * s, y], [x + 9 * s, y], [x + 9 * s, y - 9 * s], [x - 9 * s, y - 9 * s]], P.granite, { alpha: 0.4 });
  pen.set({ width: 1.0 });
  pen.rect(x - 9 * s, y - 9 * s, 18 * s, 9 * s);
  // Figura sentada, abrazando las rodillas
  const fig = [[x - 6 * s, y - 9 * s], [x - 6 * s, y - 18 * s], [x - 3 * s, y - 25 * s], [x + 1 * s, y - 25 * s], [x + 3 * s, y - 20 * s], [x + 7 * s, y - 17 * s], [x + 7 * s, y - 9 * s]];
  d.wash(fig, '#d8d2c4', { alpha: 0.6 });
  pen.path(fig, false);
  pen.ellipse(x - 1 * s, y - 28 * s, 3.4 * s, 3.8 * s);
  pen.set({ width: 1.4 });
}

function leon(d, x, y, s = 1) {
  const { pen } = d;
  d.wash([[x - 7 * s, y], [x + 7 * s, y], [x + 7 * s, y - 6 * s], [x - 7 * s, y - 6 * s]], '#a29c90', { alpha: 0.4 });
  pen.set({ width: 1.0 });
  pen.rect(x - 7 * s, y - 6 * s, 14 * s, 6 * s);
  const body = [[x - 6 * s, y - 6 * s], [x - 5 * s, y - 16 * s], [x - 1 * s, y - 22 * s], [x + 4 * s, y - 20 * s], [x + 6 * s, y - 14 * s], [x + 6 * s, y - 6 * s]];
  d.wash(body, '#d8d2c4', { alpha: 0.6 });
  pen.path(body, false);
  // Melena
  pen.ellipse(x + 1 * s, y - 22 * s, 5.5 * s, 5 * s, 0.25);
  pen.set({ width: 1.4 });
}

function stones(d, x0, y0, w, h, rows = 3, size = 9) {
  const { pen, r, P } = d;
  for (let row = 0; row < rows; row++) {
    const yy = y0 + h - (row + 0.5) * (h / rows);
    let xx = x0 + r() * size * 0.5;
    while (xx < x0 + w - size * 0.5) {
      const sw = size * (0.7 + r() * 0.8), sh = (h / rows) * (0.75 + r() * 0.3);
      const pts = blobPts(xx + sw / 2, yy, sw / 2, sh / 2, r, 0.18, 9);
      d.wash(pts, r() < 0.5 ? P.granite : P.graniteDark, { alpha: 0.42, spread: 0.6, edge: 0.4, grain: 0.02 });
      pen.set({ width: 0.8 });
      pen.path(pts, true);
      xx += sw + 1;
    }
  }
  pen.set({ width: 1.4 });
}

// Marco de azulejo alrededor de una ventana (blanco con cenefa azul, como en la casa)
function tileFrame(d, x, y, w, h, b = 5) {
  const { pen, P } = d;
  const frame = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  d.wash(frame, '#eef0f2', { alpha: 0.95, spread: 0.4, edge: 0.15, grain: 0 });
  d.wash([[x, y], [x + w, y], [x + w, y + b], [x, y + b]], P.tile, { alpha: 0.35, edge: 0, grain: 0 });
  d.wash([[x, y + h - b], [x + w, y + h - b], [x + w, y + h], [x, y + h]], P.tile, { alpha: 0.35, edge: 0, grain: 0 });
  d.wash([[x, y], [x + b, y], [x + b, y + h], [x, y + h]], P.tile, { alpha: 0.3, edge: 0, grain: 0 });
  d.wash([[x + w - b, y], [x + w, y], [x + w, y + h], [x + w - b, y + h]], P.tile, { alpha: 0.3, edge: 0, grain: 0 });
  pen.set({ width: 0.4, double: false });
  for (let xx = x + b / 2; xx < x + w; xx += b) { pen.dot(xx, y + b / 2, 0.7, '#1c2f55', 0.7); pen.dot(xx, y + h - b / 2, 0.7, '#1c2f55', 0.7); }
  for (let yy = y + b * 1.5; yy < y + h - b; yy += b) { pen.dot(x + b / 2, yy, 0.7, '#1c2f55', 0.7); pen.dot(x + w - b / 2, yy, 0.7, '#1c2f55', 0.7); }
  pen.set({ width: 0.9, double: true });
  pen.rect(x, y, w, h);
  pen.set({ width: 1.4 });
}

// Cenefa estrecha de azulejo
function tileStrip(d, x, y, w, h) {
  const { pen, P } = d;
  d.wash([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], mix('#eef0f2', P.tile, 0.3), { alpha: 0.85, edge: 0, grain: 0 });
  pen.set({ width: 0.4, double: false });
  for (let xx = x + 2.5; xx < x + w; xx += 5) pen.dot(xx, y + h / 2, 0.75, '#1c2f55', 0.75);
  pen.line(x, y, x + w, y); pen.line(x, y + h, x + w, y + h);
  pen.set({ width: 1.4, double: true });
}

// Pilar de ladrillo visto
function brickPillar(d, x, y0, y1, w = 9) {
  const { pen } = d;
  d.wash([[x, y0], [x + w, y0], [x + w, y1], [x, y1]], '#b5654a', { alpha: 0.75, spread: 0.4, edge: 0.3 });
  pen.set({ width: 0.35, double: false });
  let row = 0;
  for (let y = y0 + 3; y < y1; y += 3, row++) {
    pen.line(x, y, x + w, y);
    const off = row % 2 ? w / 2 : 0;
    for (let xx = x + off; xx < x + w; xx += w) if (xx > x) pen.line(xx, y - 3, xx, y);
  }
  pen.set({ width: 1, double: true });
  pen.rect(x, y0, w, y1 - y0);
  pen.set({ width: 1.4 });
}

// Barandilla de hierro con barrotes y algún adorno
function railing(d, x0, x1, y, h) {
  const { pen } = d;
  pen.set({ width: 0.9, color: '#2b2420', double: false });
  pen.line(x0, y - h, x1, y - h);
  pen.line(x0, y - 2, x1, y - 2);
  for (let x = x0; x <= x1; x += 4.2) pen.line(x, y - h, x, y);
  for (let x = x0 + 12; x < x1 - 6; x += 24) pen.curve([[x - 2, y - 4], [x, y - 9], [x + 2, y - 4]]);
  pen.set({ width: 1.4, color: '#3b2a1c', double: true });
}

// Limpiatubos (arbusto de flores rojas en espiga) junto a la esquina de la casa
function callistemon(d, x, y, s = 1) {
  const { pen, r, P } = d;
  const pts = blobPts(x, y - 30 * s, 20 * s, 32 * s, r, 0.22, 24);
  d.wash(pts, P.foliageDark, { alpha: 0.45 });
  pen.set({ width: 0.9 });
  pen.path(pts, true);
  pen.set({ width: 0.6 });
  for (let i = 0; i < 18; i++) {
    const px = x + r.range(-15, 15) * s, py = y - r.range(8, 56) * s;
    pen.line(px, py, px + r.range(-3, 3), py - 4);
  }
  for (let i = 0; i < 9; i++) d.washBlob(x + r.range(-14, 14) * s, y - r.range(20, 58) * s, 1.6 * s, 3.6 * s, '#c8322a', { alpha: 0.85, layers: 1, edge: 0, grain: 0 });
  pen.set({ width: 1.4 });
}

// ───────────────────────── Zonas ─────────────────────────

export const SKETCHES = {
  cortijo(d) {
    // Según la foto: casa de dos plantas en L. Porche abajo con pilares de ladrillo, balcón corrido
    // con barandilla de hierro, ventanas con marco de azulejo azul y reja, farolillo, vigas bajo el
    // alero y zócalo de baldosa. A la derecha, el ala alta con dos macetas verdes en la reja.
    const { pen, r, P } = d;
    const gy = 204;
    groundShadow(d, 140, gy + 2, 130, 10);
    // ── Cuerpo principal (izquierda) ──
    const front = [[22, 74], [178, 74], [178, gy], [22, gy]];
    d.wash(front, P.whitewash, { alpha: 1.0, spread: 0.8, edge: 0.2, grain: 0.002 });
    // ── Ala alta (derecha), vista de lado ──
    const wing = [[178, 52], [252, 66], [252, gy - 6], [178, gy]];
    d.wash(wing, mix(P.whitewash, P.wallShade, 0.22), { alpha: 1.0, spread: 0.8, edge: 0.2 });
    // Sombras de hojas sobre la cal
    for (let i = 0; i < 12; i++) d.washBlob(r.range(26, 120), r.range(80, 196), r.range(5, 13), r.range(3, 6), P.wallShade, { alpha: 0.16, edge: 0, grain: 0 });
    pen.set({ width: 1.6 });
    pen.path(front, true);
    pen.path(wing, true);
    pen.hatch([[236, 70], [252, 66], [252, gy - 6], [236, gy - 4]], { angle: -1.1, gap: 4.5, alpha: 0.35 });
    // Tejados: faldón largo del cuerpo y el del ala
    const roofF = [[14, 76], [186, 76], [170, 50], [30, 50]];
    roofTiles(d, roofF, 4);
    pen.path(roofF, true);
    const roofW = [[172, 54], [258, 68], [250, 54], [180, 40]];
    d.wash(roofW, P.roofDark, { alpha: 0.5 });
    pen.path(roofW, true);
    pen.hatch(roofW, { angle: 0.5, gap: 3.5, alpha: 0.4 });
    // Vigas oscuras bajo el alero
    pen.set({ width: 1.1 });
    for (let x = 40; x < 176; x += 26) { d.wash([[x, 76], [x + 7, 76], [x + 7, 81], [x, 81]], '#2b2420', { alpha: 0.7, edge: 0, grain: 0 }); }
    // Chimenea
    const ch = [[150, 50], [162, 50], [162, 28], [150, 28]];
    d.wash(ch, P.whitewash, { alpha: 0.8 });
    pen.set({ width: 1.3 });
    pen.path(ch, true);
    pen.line(147, 28, 165, 28);
    // ── Planta alta: ventana con marco de azulejo y reja, puerta al balcón ──
    tileFrame(d, 104, 86, 40, 36, 5);
    d.wash([[110, 92], [138, 92], [138, 116], [110, 116]], '#3a3530', { alpha: 0.35, edge: 0 });
    ironGrille(d, 110, 92, 28, 24);
    tileFrame(d, 46, 86, 32, 36, 4);
    d.wash([[51, 91], [73, 91], [73, 122], [51, 122]], '#3a3530', { alpha: 0.4, edge: 0 });
    pen.set({ width: 1.0 });
    pen.rect(51, 91, 22, 31);
    // Farolillo entre las dos
    pen.set({ width: 0.9 });
    pen.line(91, 88, 91, 94);
    pen.path([[87, 94], [95, 94], [94, 104], [88, 104]], true);
    pen.path([[86, 94], [91, 90], [96, 94]], false);
    d.washBlob(91, 99, 2.6, 3.5, '#f5e6a0', { alpha: 0.75, edge: 0, grain: 0 });
    // ── Balcón corrido con barandilla de hierro y pilares de ladrillo ──
    const by = 124;
    d.wash([[22, by], [178, by], [178, by + 6], [22, by + 6]], mix(P.whitewash, P.wallShade, 0.35), { alpha: 0.9, edge: 0.2 });
    pen.set({ width: 1.1 });
    pen.line(22, by + 6, 178, by + 6);
    railing(d, 40, 172, by, 20);
    brickPillar(d, 30, by - 22, by + 2, 9);
    brickPillar(d, 166, by - 22, by + 2, 8);
    // Tira de azulejo bajo el balcón
    tileStrip(d, 22, by + 6, 156, 5);
    // ── Planta baja: porche con pilares de ladrillo ──
    d.wash([[22, by + 11], [92, by + 11], [92, gy - 9], [22, gy - 9]], '#5a4e44', { alpha: 0.32, edge: 0.1 });
    for (const x of [26, 56, 86]) brickPillar(d, x, by + 11, gy - 9, 9);
    // Cortina clara al fondo del porche
    d.wash([[63, by + 18], [83, by + 18], [83, gy - 10], [63, gy - 10]], '#efe9dc', { alpha: 0.85, edge: 0 });
    pen.set({ width: 0.5 });
    for (let x = 65; x < 83; x += 3) pen.line(x, by + 19, x, gy - 11);
    // Ventana baja con reja y cenefa de azulejo encima
    tileStrip(d, 104, by + 22, 48, 5);
    d.wash([[108, by + 30], [148, by + 30], [148, by + 60], [108, by + 60]], '#3a3530', { alpha: 0.35, edge: 0 });
    ironGrille(d, 108, by + 30, 40, 30);
    // Zócalo de baldosa
    d.wash([[22, gy - 9], [252, gy - 15], [252, gy - 6], [22, gy]], '#d9b48a', { alpha: 0.5 });
    pen.set({ width: 0.8 });
    pen.line(92, gy - 9, 178, gy - 9);
    for (let x = 100; x < 178; x += 12) pen.line(x, gy - 9, x, gy);
    // ── Ala: ventana con marco de azulejo, reja y dos macetas verdes; ventanuco abajo ──
    tileFrame(d, 196, 82, 36, 42, 5);
    d.wash([[202, 88], [226, 88], [226, 118], [202, 118]], '#3a3530', { alpha: 0.35, edge: 0 });
    ironGrille(d, 202, 88, 24, 30);
    maceta(d, 206, 112); maceta(d, 222, 112);
    tileFrame(d, 200, 150, 26, 24, 4);
    ironGrille(d, 205, 155, 16, 14);
    // ── Árbol grande de hoja amarilla a la izquierda (tapa la esquina) y arbusto de flores rojas ──
    pen.set({ width: 1.5 });
    pen.curve([[6, gy + 4], [8, 160], [4, 120], [10, 80]]);
    pen.curve([[16, gy + 4], [17, 160], [14, 120], [18, 84]]);
    const canopy = canopyPts(18, 54, 44, 34, r, 11, 0.25);
    d.wash(canopy, mix(P.foliage, P.mimosa, 0.35), { alpha: 0.42, spread: 2 });
    d.washBlob(30, 66, 24, 14, P.foliageDark, { alpha: 0.18, edge: 0, grain: 0 });
    pen.set({ width: 0.9 });
    pen.path(canopy, true);
    for (let i = 0; i < 16; i++) {
      const a = r() * 6.28, rr = Math.sqrt(r()) * 0.8;
      const px = 18 + Math.cos(a) * 40 * rr, py = 54 + Math.sin(a) * 30 * rr;
      pen.line(px, py, px + 3, py + 3);
    }
    callistemon(d, 262, gy + 2, 0.9);
    pen.set({ width: 1.4 });
  },

  patio(d) {
    // Según la foto: suelo de cantos rodados con franjas de granito que lo cuadriculan en rombos,
    // fuente cuadrada de azulejo blanco y azul con taza doble de piedra, figura sentada, lavanda,
    // hojas secas, y la mesa de tablero de ajedrez junto a los pilares.
    const { pen, r, P } = d;
    const W = d.w, H = d.h;
    const ground = groundPatch(d, 4, 10, W - 8, H - 14, mix(P.path, '#c8b08a', 0.5), 0.42, 30);
    // Cantos rodados
    pen.set({ width: 0.5, double: false });
    for (let i = 0; i < 420; i++) {
      const x = 12 + r() * (W - 24), y = 20 + r() * (H - 30);
      pen.ellipse(x, y, 1.5 + r() * 1.7, 0.9 + r() * 0.9, 0.3);
    }
    // Franjas de granito en dos direcciones (cuadrícula en rombo, como en la foto)
    // Recorta cada franja al suelo del patio (Liang-Barsky)
    const X0 = 22, X1 = W - 22, Y0 = 24, Y1 = H - 18;
    const clip = (x1, y1, x2, y2) => {
      let t0 = 0, t1 = 1;
      const dx = x2 - x1, dy = y2 - y1;
      for (const [p, q] of [[-dx, x1 - X0], [dx, X1 - x1], [-dy, y1 - Y0], [dy, Y1 - y1]]) {
        if (p === 0) { if (q < 0) return null; continue; }
        const u = q / p;
        if (p < 0) { if (u > t1) return null; if (u > t0) t0 = u; } else { if (u < t0) return null; if (u < t1) t1 = u; }
      }
      return [x1 + dx * t0, y1 + dy * t0, x1 + dx * t1, y1 + dy * t1];
    };
    const strip = (ax, ay, bx, by) => {
      const c = clip(ax, ay, bx, by);
      if (!c) return;
      const [x1, y1, x2, y2] = c;
      const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
      if (L < 12) return;
      const nx = -dy / L * 2.8, ny = dx / L * 2.8;
      d.wash([[x1 - nx, y1 - ny], [x2 - nx, y2 - ny], [x2 + nx, y2 + ny], [x1 + nx, y1 + ny]], '#d6d3cc', { alpha: 0.42, spread: 0.5, edge: 0.15, grain: 0 });
      pen.set({ width: 0.4, double: false, alpha: 0.4 });
      const n = Math.round(L / 10);
      for (let k = 0; k <= n; k++) {
        const t = k / n;
        pen.line(x1 + dx * t - nx, y1 + dy * t - ny, x1 + dx * t + nx, y1 + dy * t + ny);
      }
      pen.line(x1 - nx, y1 - ny, x2 - nx, y2 - ny);
      pen.line(x1 + nx, y1 + ny, x2 + nx, y2 + ny);
      pen.set({ alpha: 1 });
    };
    for (let k = -3; k < 6; k++) strip(20 + k * 96, H, 20 + k * 96 + 190, 0);
    for (let k = -1; k < 6; k++) strip(-60 + k * 96, 0, -60 + k * 96 + 190, H);
    // Bordillo de granito delante
    pen.set({ width: 0.6, double: false });
    for (let x = 30; x < W - 30; x += 12) pen.rect(x, H - 14, 10, 6);
    pen.set({ width: 1.4, double: true });
    // ── Fuente cuadrada de azulejo con taza doble ──
    const fx = 190, fy = 92, fw = 74, fh = 30;
    groundShadow(d, fx + fw / 2 + 4, fy + fh + 12, fw / 2 + 8, 7);
    // Lados de azulejo azul oscuro
    d.wash([[fx, fy + fh], [fx + fw, fy + fh], [fx + fw, fy + fh + 10], [fx, fy + fh + 10]], '#22346a', { alpha: 0.75 });
    // Borde de azulejo blanco con dibujo azul
    d.wash([[fx, fy], [fx + fw, fy], [fx + fw, fy + fh], [fx, fy + fh]], '#f2ede0', { alpha: 0.95 });
    pen.set({ width: 0.4, double: false });
    for (let x = fx; x <= fx + fw; x += 7.4) pen.line(x, fy, x, fy + 6), pen.line(x, fy + fh - 6, x, fy + fh);
    for (let x = fx + 3.7; x < fx + fw; x += 7.4) { pen.dot(x, fy + 3, 1, P.tile, 0.8); pen.dot(x, fy + fh - 3, 1, P.tile, 0.8); }
    for (let y = fy + 6; y < fy + fh - 6; y += 6) { pen.dot(fx + 3, y + 3, 1, P.tile, 0.8); pen.dot(fx + fw - 3, y + 3, 1, P.tile, 0.8); }
    pen.set({ width: 1.3, double: true });
    pen.rect(fx, fy, fw, fh + 10);
    pen.line(fx, fy + fh, fx + fw, fy + fh);
    // Agua verdosa
    const water = [[fx + 6, fy + 6], [fx + fw - 6, fy + 6], [fx + fw - 6, fy + fh - 6], [fx + 6, fy + fh - 6]];
    d.wash(water, mix(P.water, '#7a8a3a', 0.45), { alpha: 0.6 });
    pen.set({ width: 0.9 });
    pen.rect(fx + 6, fy + 6, fw - 12, fh - 12);
    // Taza doble de piedra con guijarros
    const cx = fx + fw / 2;
    pen.set({ width: 1.1 });
    pen.line(cx - 3, fy + fh - 8, cx - 3, fy - 16);
    pen.line(cx + 3, fy + fh - 8, cx + 3, fy - 16);
    d.wash([[cx - 3, fy + fh - 8], [cx + 3, fy + fh - 8], [cx + 3, fy - 16], [cx - 3, fy - 16]], P.granite, { alpha: 0.5, edge: 0 });
    for (const [ty, rx] of [[fy + 6, 17], [fy - 16, 11]]) {
      d.washBlob(cx, ty, rx, rx * 0.36, P.graniteDark, { alpha: 0.5 });
      pen.ellipse(cx, ty, rx, rx * 0.36, 0.08);
      for (let i = 0; i < 7; i++) pen.dot(cx + r.range(-rx, rx) * 0.85, ty + r.range(-1.5, 1.5), 0.9);
    }
    pen.set({ width: 0.6 });
    pen.curve([[cx, fy - 22], [cx - 5, fy - 24], [cx - 9, fy - 15]]); // agua que cae
    pen.curve([[cx, fy - 22], [cx + 5, fy - 24], [cx + 9, fy - 15]]);
    // Figura sentada sobre su pedestal, delante a la derecha, y la lavanda
    estatuaSentada(d, 248, 162, 0.85);
    lavanda(d, 286, 150, 1.25); lavanda(d, 312, 132, 1.1); lavanda(d, 300, 168, 1.0);
    // Mesa con tablero de ajedrez
    const tx = 92, ty = 74;
    d.wash([[tx, ty], [tx + 26, ty], [tx + 30, ty + 8], [tx + 4, ty + 8]], '#f4efe4', { alpha: 0.95 });
    pen.set({ width: 0.4, double: false });
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) if ((i + j) % 2) d.wash([[tx + i * 6.5 + j * 2, ty + j * 4], [tx + i * 6.5 + 6.5 + j * 2, ty + j * 4], [tx + i * 6.5 + 6.5 + (j + 1) * 2, ty + (j + 1) * 4], [tx + i * 6.5 + (j + 1) * 2, ty + (j + 1) * 4]], '#2b2420', { alpha: 0.75, edge: 0, grain: 0 });
    pen.set({ width: 0.9, double: true });
    pen.path([[tx, ty], [tx + 26, ty], [tx + 30, ty + 8], [tx + 4, ty + 8]], true);
    pen.line(tx + 4, ty + 8, tx + 2, ty + 24); pen.line(tx + 30, ty + 8, tx + 32, ty + 24);
    pen.line(tx + 26, ty, tx + 27, ty + 18);
    // Silla de hierro
    pen.set({ width: 0.8 });
    pen.path([[tx + 40, ty - 6], [tx + 40, ty + 22], [tx + 52, ty + 24], [tx + 52, ty + 4]], false);
    pen.line(tx + 40, ty + 10, tx + 52, ty + 12);
    // Muchas hojas secas, como en otoño
    leafLitter(d, 10, 18, W - 20, H - 28, 70, [P.flowers, '#c9a24a', '#9a6a35', '#b08a3a']);
    void ground;
  },

  paseo(d) {
    // Según la foto: camino de tierra bajo un túnel de árboles finos (ailantos y acacias) camino de
    // la ermita; leña apilada a un lado, un banco de piedra al pie de un árbol, sol entre las hojas.
    // Siguen las adelfas blancas que dan nombre al paseo, más bajas.
    const { pen, r, P } = d;
    const W = d.w;
    const top = [], bot = [];
    for (let x = 0; x <= W; x += 30) {
      top.push([x, 50 + Math.sin(x / 70) * 3]);
      bot.push([x, 88 + Math.sin(x / 60 + 1) * 3]);
    }
    d.wash([...top, ...bot.slice().reverse()], mix(P.path, '#8a6a4a', 0.25), { alpha: 0.5, spread: 2 });
    pen.set({ width: 1.0 });
    pen.curve(top); pen.curve(bot);
    // Sombras moteadas y manchas de sol
    for (let i = 0; i < 26; i++) d.washBlob(r() * W, 56 + r() * 26, 7 + r() * 12, 2.5 + r() * 3, '#5a4a38', { alpha: 0.16, edge: 0, grain: 0 });
    for (let i = 0; i < 8; i++) d.washBlob(r() * W, 60 + r() * 20, 6 + r() * 6, 2 + r() * 2, '#f6e6b0', { alpha: 0.35, edge: 0, grain: 0 });
    // Árboles finos a lo largo del lado de arriba: troncos oscuros que se inclinan hacia el camino
    for (let x = 14; x < W; x += 26 + r() * 22) {
      const lean = r.range(-6, 9);
      pen.set({ width: 1.1 });
      pen.curve([[x - 1.5, 52], [x - 1, 34], [x + lean * 0.6, 16], [x + lean, 2]]);
      pen.curve([[x + 1.5, 52], [x + 2, 34], [x + lean * 0.6 + 2, 16], [x + lean + 2, 2]]);
      pen.set({ width: 0.7 });
      pen.line(x + 1, 24, x - 8, 10);
      const cx = x + lean + r.range(-4, 4), cy = r.range(-14, 4);
      const pts = canopyPts(cx, cy, r.range(22, 34), r.range(14, 22), r, 10, 0.34);
      d.wash(pts, r() < 0.3 ? mix(P.foliage, P.mimosa, 0.3) : mix(P.foliage, '#7aa04a', 0.3), { alpha: 0.4, spread: 2 });
      pen.set({ width: 0.8 });
      pen.path(pts, true);
      for (let i = 0; i < 6; i++) { const px = cx + r.range(-18, 18), py = cy + r.range(-8, 8); pen.line(px, py, px + 3, py + 2); }
    }
    // Adelfas blancas bajitas entre los troncos
    for (let x = 40; x < W; x += 70 + r() * 30) adelfa(d, x, 52, 0.7);
    // Abajo: árboles más bajos y el banco de piedra al pie de uno
    for (let x = 30; x < W; x += 58 + r() * 24) {
      pen.set({ width: 1.1 });
      pen.line(x - 1.5, 118, x - 1, 94);
      pen.line(x + 1.5, 118, x + 2, 94);
      const pts = canopyPts(x + 1, 92, 16, 9, r, 8, 0.3);
      d.wash(pts, mix(P.foliage, '#7aa04a', 0.3), { alpha: 0.4 });
      pen.set({ width: 0.8 });
      pen.path(pts, true);
    }
    const bx = 300;
    d.wash([[bx, 104], [bx + 30, 102], [bx + 32, 108], [bx + 2, 110]], P.granite, { alpha: 0.6 });
    pen.set({ width: 1.0 });
    pen.path([[bx, 104], [bx + 30, 102], [bx + 32, 108], [bx + 2, 110]], true);
    pen.line(bx + 4, 110, bx + 4, 116); pen.line(bx + 28, 108, bx + 28, 114);
    // Leña apilada a la izquierda: cara de troncos redondos
    const lx = 6, ly = 92;
    d.wash([[lx, ly], [lx + 34, ly - 4], [lx + 36, ly + 22], [lx, ly + 24]], P.wood, { alpha: 0.35 });
    pen.set({ width: 0.7 });
    for (let row = 0; row < 4; row++) for (let k = 0; k < 6; k++) {
      const ox = lx + 4 + k * 5.4 + (row % 2) * 2.5, oy = ly + 2 + row * 5.6 - k * 0.5;
      d.washBlob(ox, oy, 2.5, 2.4, '#c08a5a', { alpha: 0.6, layers: 1, edge: 0.5, grain: 0 });
      pen.ellipse(ox, oy, 2.5, 2.4, 0.1);
    }
    pen.path([[lx, ly], [lx + 34, ly - 4], [lx + 36, ly + 22], [lx, ly + 24]], true);
    leafLitter(d, 0, 54, W, 30, 60, ['#b08a3a', '#8a6a30', P.flowers, '#c9a24a']);
    pen.set({ width: 1.4 });
  },

  ermita(d) {
    const { pen, r, P } = d;
    const gy = 192;
    groundShadow(d, 100, gy + 2, 84, 8);
    // Árbol sin hojas detrás a la izquierda
    pen.set({ width: 0.9 });
    const bx = 22;
    pen.curve([[bx, gy], [bx + 2, gy - 60], [bx - 4, gy - 120]]);
    for (let i = 0; i < 8; i++) {
      const yy = gy - 50 - i * 9, side = i % 2 ? 1 : -1;
      pen.line(bx, yy, bx + side * (16 + r() * 14), yy - 18 - r() * 10);
    }
    // Nave encalada con frontón
    const front = [[38, 102], [148, 102], [148, gy], [38, gy]];
    const gable = [[32, 104], [93, 62], [154, 104]];
    const side = [[148, 102], [176, 92], [176, gy - 8], [148, gy]];
    d.wash([...front], P.whitewash, { alpha: 1.0 });
    d.wash(gable, P.whitewash, { alpha: 1.0 });
    d.wash(side, mix(P.whitewash, P.wallShade, 0.5), { alpha: 0.95 });
    pen.set({ width: 1.5 });
    pen.path(front, true);
    pen.path(side, false);
    pen.hatch(side, { gap: 4.5, alpha: 0.4 });
    d.wash([[30, 106], [93, 60], [156, 106], [152, 108], [93, 66], [34, 108]], P.roof, { alpha: 0.7, edge: 0.3 });
    pen.path(gable, false);
    pen.path([[93, 62], [118, 54], [176, 92]], false);
    // Espadaña con su campanita y la cruz
    d.wash([[84, 66], [102, 66], [102, 40], [84, 40]], P.whitewash, { alpha: 1 });
    pen.path([[84, 66], [84, 40], [102, 40], [102, 66]], false);
    pen.path([[88, 58], [88, 48], [93, 44], [98, 48], [98, 58]], false);
    pen.set({ width: 1 });
    pen.curve([[90, 55], [93, 49], [96, 55]]);
    pen.dot(93, 56, 1.4);
    pen.set({ width: 1.4 });
    pen.line(93, 40, 93, 26);
    pen.line(88, 31, 98, 31);
    // Puerta roja de forja con arco apuntado
    const door = [[58, gy], [58, 132], [93, 112], [128, 132], [128, gy]];
    d.wash(door, P.door, { alpha: 0.62, spread: 1 });
    pen.set({ width: 1.3 });
    pen.path(door, false);
    pen.line(93, 113, 93, gy);
    pen.set({ width: 0.7, color: '#4a1a10' });
    for (let x = 64; x < 126; x += 7) pen.line(x, 128 + Math.abs(x - 93) * -0.2 + 8, x, gy - 2);
    for (let y = 140; y < gy; y += 14) pen.line(60, y, 126, y);
    pen.curve([[70, 150], [76, 144], [82, 150], [76, 156], [70, 150]]);
    pen.curve([[104, 150], [110, 144], [116, 150], [110, 156], [104, 150]]);
    pen.set({ color: '#3b2a1c', width: 1.4 });
    // Escalón de azulejo
    tilePattern(d, 50, gy - 2, 86, 6, P.tile, 4);
    // Ventanucos laterales
    pen.path([[156, 120], [162, 118], [162, 140], [156, 142]], true);
    // Mimosa en flor a la derecha
    mimosa(d, 172, gy + 4, 1.15);
  },

  huerta(d) {
    const { pen, r, P } = d;
    const W = d.w, H = d.h;
    groundPatch(d, 6, 12, W - 12, H - 18, P.redEarth, 0.32, 34);
    // Acequia a la izquierda
    const ditch = [[22, 10], [26, 70], [20, 140], [28, H - 6]];
    pen.set({ width: 1.0 });
    pen.curve(ditch);
    pen.curve(ditch.map(([x, y]) => [x + 9, y]));
    d.wash([...ditch, ...ditch.slice().reverse().map(([x, y]) => [x + 9, y])], P.water, { alpha: 0.5, edge: 0 });
    // Bancales
    for (let row = 0; row < 6; row++) {
      const y = 36 + row * 30;
      const pts = [];
      for (let x = 46; x <= W - 60; x += 40) pts.push([x, y + Math.sin(x / 50 + row) * 2]);
      d.wash([...pts.map(([x, yy]) => [x, yy - 7]), ...pts.slice().reverse().map(([x, yy]) => [x, yy + 7])], mix(P.redEarth, '#5a3420', 0.25), { alpha: 0.35, edge: 0.2, spread: 1 });
      pen.set({ width: 0.9 });
      pen.curve(pts.map(([x, yy]) => [x, yy + 7]));
      // Las plantas se dibujan en vivo según lo sembrado en cada bancal (map.js)
      for (let x = 52; false && x < W - 64; x += 12 + r() * 6) {
        const yy = y + Math.sin(x / 50 + row) * 2 - 2;
        const kind = row % 3;
        if (kind === 0) { // lechugas
          d.washBlob(x, yy, 4.5, 3.2, P.grass, { alpha: 0.7, layers: 1, edge: 0.5, grain: 0 });
          pen.set({ width: 0.6 }); pen.ellipse(x, yy, 4, 3, 0.25);
        } else if (kind === 1) { // tomateras con cañas
          pen.set({ width: 0.8 });
          pen.line(x, yy + 3, x + 2, yy - 15);
          d.washBlob(x + 1, yy - 7, 4, 7, P.grassDark, { alpha: 0.55, layers: 1, edge: 0, grain: 0 });
          if (r() < 0.6) pen.dot(x + 2, yy - 6, 1.5, '#c0392b', 0.85);
        } else { // brotes
          pen.set({ width: 0.7, color: '#4a5a28' });
          pen.line(x, yy + 2, x - 2, yy - 4); pen.line(x, yy + 2, x + 2, yy - 5);
          pen.set({ color: '#3b2a1c' });
        }
      }
    }
    // Carretilla amarilla (de la foto) y tronco
    const wx = W - 40, wy = H - 30;
    d.wash([[wx - 26, wy - 16], [wx + 8, wy - 18], [wx + 2, wy - 4], [wx - 22, wy - 4]], P.yellow, { alpha: 0.7 });
    pen.set({ width: 1.1 });
    pen.path([[wx - 26, wy - 16], [wx + 8, wy - 18], [wx + 2, wy - 4], [wx - 22, wy - 4]], true);
    pen.ellipse(wx - 20, wy + 2, 6, 6);
    pen.line(wx + 6, wy - 12, wx + 22, wy - 4);
    pen.line(wx + 2, wy - 4, wx + 4, wy + 6);
    d.washBlob(wx - 52, wy + 2, 12, 7, '#c0703a', { alpha: 0.6 });
    pen.ellipse(wx - 52, wy + 2, 12, 7);
    pen.ellipse(wx - 42, wy + 1, 3, 6, 0.1);
    // Espantapájaros
    const sx = W / 2 + 40, sy = 30;
    pen.line(sx, sy + 40, sx, sy);
    pen.line(sx - 14, sy + 12, sx + 14, sy + 12);
    pen.ellipse(sx, sy - 2, 5, 5);
    pen.path([[sx - 9, sy - 6], [sx + 9, sy - 6], [sx + 4, sy - 12], [sx - 4, sy - 12]], true);
    d.wash([[sx - 8, sy + 6], [sx + 8, sy + 6], [sx + 6, sy + 24], [sx - 6, sy + 24]], '#7a8ab0', { alpha: 0.5 });
  },

  bosquete(d) {
    const { pen, r, P } = d;
    const W = d.w, H = d.h;
    groundPatch(d, 0, 40, W, H - 38, mix(P.ground, '#8a6a40', 0.3), 0.26, 40);
    eucalipto(d, 40, H - 12, 1.0);
    eucalipto(d, 110, H - 22, 0.85);
    mimosa(d, 190, H - 16, 1.05);
    higuera(d, 270, H - 18, 1.1);
    higuera(d, 330, H - 34, 0.85);
    // Pila de leña y cesta de setas
    const px = 362, py = H - 10;
    pen.set({ width: 1.1 });
    for (let row = 0; row < 3; row++) {
      for (let k = 0; k < 4 - row; k++) {
        const lx = px + row * 7 + k * 14, ly = py - row * 11;
        d.washBlob(lx, ly, 7, 5.5, '#b8783a', { alpha: 0.65, layers: 1, edge: 0.4, grain: 0 });
        pen.ellipse(lx, ly, 7, 5.5, 0.1);
        pen.dot(lx, ly, 1.2, '#6a4020', 0.8);
      }
    }
    d.wash([[px + 62, py], [px + 84, py], [px + 88, py - 12], [px + 58, py - 12]], '#c9a060', { alpha: 0.6 });
    pen.path([[px + 62, py], [px + 84, py], [px + 88, py - 12], [px + 58, py - 12]], true);
    pen.curve([[px + 58, py - 12], [px + 73, py - 26], [px + 88, py - 12]]);
    for (let i = 0; i < 4; i++) { d.washBlob(px + 64 + i * 6, py - 14, 3.2, 2.2, '#c8742a', { alpha: 0.9, layers: 1, edge: 0.4, grain: 0 }); }
    // Troncos cortados, caja de fruta y rastrillo
    d.washBlob(150, H - 8, 14, 6, '#b8683a', { alpha: 0.6 });
    pen.ellipse(150, H - 8, 14, 6); pen.ellipse(162, H - 8, 3, 6, 0.1);
    const cx = 228, cy = H - 6;
    d.wash([[cx - 12, cy - 12], [cx + 12, cy - 12], [cx + 12, cy], [cx - 12, cy]], P.wood, { alpha: 0.4 });
    pen.rect(cx - 12, cy - 12, 24, 12);
    pen.set({ width: 0.7 });
    pen.line(cx - 12, cy - 6, cx + 12, cy - 6);
    for (let i = 0; i < 4; i++) pen.dot(cx - 7 + i * 5, cy - 14, 2, '#6a3a5a', 0.7);
    pen.set({ width: 1.1 });
    pen.line(250, H - 4, 268, H - 50);
    pen.path([[262, H - 52], [276, H - 46]], false);
    for (let i = 0; i < 4; i++) pen.line(263 + i * 4, H - 51 + i * 1.5, 261 + i * 4, H - 45 + i * 1.5);
    leafLitter(d, 0, H - 40, W, 36, 90, ['#b08a3a', '#9a6a35', '#c9a24a', '#8a7a4a']);
  },

  dehesa(d) {
    const { pen, r, P } = d;
    const W = d.w, H = d.h;
    d.wash(blobPts(W / 2, H / 2 + 10, W / 2 - 4, H / 2 - 8, r, 0.06, 40), P.grass, { alpha: 0.32, spread: 6, edge: 0.15 });
    // Senda
    pen.set({ width: 0.8, double: false });
    const path = [[W - 10, H - 20], [W - 160, H - 70], [W - 300, H - 90], [W - 420, H - 160], [W - 520, H - 190]];
    pen.curve(path);
    pen.curve(path.map(([x, y]) => [x + 3, y + 10]));
    pen.set({ width: 1.4, double: true });
    grassTufts(d, 10, 20, W - 20, H - 30, 140, mix(P.grassDark, '#3b2a1c', 0.4));
    // Jaras con flor blanca
    for (let i = 0; i < 10; i++) {
      const x = 20 + r() * (W - 60), y = 40 + r() * (H - 60);
      arbusto(d, x, y, 0.9, mix(P.grassDark, '#7a8a6a', 0.3));
      for (let k = 0; k < 3; k++) pen.dot(x + r.range(-8, 8), y - 8 + r.range(-4, 4), 1.4, '#ffffff', 0.9);
    }
    // Berrocales de granito
    const clusters = [[90, 250], [300, 120], [470, 270], [560, 80]];
    for (const [bx, by] of clusters) {
      const n = 3 + Math.floor(r() * 3);
      for (let k = 0; k < n; k++) boulder(d, bx + r.range(-24, 24), by + r.range(-10, 10), r.range(10, 22), r.range(8, 14), r.range(-0.3, 0.3));
    }
    // Olivos
    for (const [x, y] of [[620, 300], [655, 290], [640, 318]]) olivo(d, x, y, 0.9);
    // Encinas dispersas, ordenadas por profundidad
    const oaks = [];
    for (let i = 0; i < 17; i++) oaks.push([40 + r() * (W - 140), 60 + r() * (H - 70), 0.8 + r() * 0.6]);
    oaks.sort((a, b) => a[1] - b[1]);
    for (const [x, y, s] of oaks) encina(d, x, y, s);
    // El gran pino
    pino(d, 610, 250, 1.35);
  },

  muros(d) {
    const { pen, r, P } = d;
    const W = d.w;
    // Tramos de muro con algún hueco
    const gaps = [[230, 252], [480, 498]];
    let x = 4;
    for (const [g0, g1] of [...gaps, [W - 4, W]]) {
      stones(d, x, 18, g0 - x, 34, 3, 11);
      x = g1;
    }
    // Zarzas enredadas
    pen.set({ width: 0.7, color: '#4a3a24' });
    for (const zx of [120, 360, 600]) {
      for (let k = 0; k < 7; k++) {
        const a = r() * 6.28;
        pen.curve([[zx, 52], [zx + Math.cos(a) * 12, 40 + Math.sin(a) * 8], [zx + Math.cos(a + 1) * 18, 30 + Math.sin(a + 1) * 6]]);
      }
      d.washBlob(zx, 42, 18, 10, P.grassDark, { alpha: 0.3, edge: 0 });
    }
    pen.set({ color: '#3b2a1c', width: 1.4 });
    grassTufts(d, 0, 52, W, 14, 60);
  },

  alberca(d) {
    const { pen, r, P } = d;
    const W = d.w, H = d.h;
    // Fresno al fondo
    encina(d, 200, 62, 0.8);
    const water = blobPts(W / 2, H / 2 + 22, 96, 54, r, 0.1, 32);
    d.wash(water, P.water, { alpha: 0.55, spread: 1.5, edge: 0.4 });
    d.wash(blobPts(W / 2 + 10, H / 2 + 30, 64, 30, r, 0.15, 24), P.waterDeep, { alpha: 0.3, edge: 0, grain: 0 });
    pen.set({ width: 1.3 });
    pen.path(water, true);
    // Reflejos horizontales
    pen.set({ width: 0.6, double: false });
    for (let i = 0; i < 12; i++) {
      const yy = H / 2 + 2 + r() * 44, xx = W / 2 - 60 + r() * 100;
      pen.line(xx, yy, xx + 12 + r() * 20, yy);
    }
    pen.set({ double: true });
    // Piedras de la orilla
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + r() * 0.2;
      boulder(d, W / 2 + Math.cos(a) * 100, H / 2 + 22 + Math.sin(a) * 58, r.range(5, 9), r.range(4, 6));
    }
    // Juncos
    for (const [jx, jy] of [[34, 150], [52, 160], [210, 158], [228, 146]]) {
      pen.set({ width: 0.8, color: '#4a5a28' });
      for (let k = 0; k < 7; k++) {
        const dx = r.range(-8, 8);
        pen.curve([[jx + dx * 0.3, jy], [jx + dx * 0.7, jy - 14], [jx + dx, jy - 26 - r() * 10]]);
        if (k % 3 === 0) d.washBlob(jx + dx, jy - 28, 1.6, 4, '#6b4a2a', { alpha: 0.8, layers: 1, edge: 0, grain: 0 });
      }
    }
    pen.set({ color: '#3b2a1c', width: 1.4 });
    // Caño
    pen.rect(W / 2 - 4, 38, 8, 14);
    pen.line(W / 2, 52, W / 2 + 2, 66);
  },

  colmenar(d) {
    const { pen, r, P } = d;
    const W = d.w, H = d.h;
    groundPatch(d, 6, 36, W - 12, H - 40, mix(P.ground, P.grass, 0.4), 0.28, 34);
    // Romero y lavanda
    for (let i = 0; i < 6; i++) lavanda(d, 20 + r() * (W - 40), 50 + r() * (H - 70), 0.8);
    for (let i = 0; i < 4; i++) arbusto(d, 20 + r() * (W - 40), 60 + r() * (H - 70), 0.9, mix(P.grassDark, '#6a7a6a', 0.4));
    // Corchos (colmenas de corcho)
    const hives = [[40, 110], [78, 120], [116, 108], [60, 150]];
    for (const [hx, hy] of hives) {
      groundShadow(d, hx + 2, hy + 1, 12, 3);
      d.wash([[hx - 9, hy], [hx - 9, hy - 26], [hx + 9, hy - 26], [hx + 9, hy]], '#8a5a3a', { alpha: 0.5 });
      pen.set({ width: 1.1 });
      pen.line(hx - 9, hy, hx - 9, hy - 26);
      pen.line(hx + 9, hy, hx + 9, hy - 26);
      pen.ellipse(hx, hy - 26, 9, 3);
      pen.curve([[hx - 9, hy], [hx, hy + 3], [hx + 9, hy]]);
      pen.hatch([[hx - 9, hy], [hx - 9, hy - 26], [hx + 9, hy - 26], [hx + 9, hy]], { angle: 1.5, gap: 3, alpha: 0.4 });
      // Losa encima
      d.wash([[hx - 12, hy - 28], [hx + 12, hy - 28], [hx + 10, hy - 32], [hx - 10, hy - 32]], P.granite, { alpha: 0.5 });
      pen.path([[hx - 12, hy - 28], [hx + 12, hy - 28], [hx + 10, hy - 32], [hx - 10, hy - 32]], true);
    }
    // Cajas modernas
    for (const [bx, by] of [[160, 100], [170, 150]]) {
      d.wash([[bx - 12, by], [bx + 12, by], [bx + 12, by - 22], [bx - 12, by - 22]], '#e8d9a8', { alpha: 0.6 });
      pen.set({ width: 1.0 });
      pen.rect(bx - 12, by - 22, 24, 22);
      pen.line(bx - 12, by - 11, bx + 12, by - 11);
      pen.rect(bx - 14, by - 26, 28, 4);
      pen.line(bx - 4, by - 2, bx + 4, by - 2);
    }
  },

  corral(d) {
    const { pen, r, P } = d;
    const W = d.w, H = d.h;
    const yard = [[16, 70], [W - 16, 60], [W - 8, H - 12], [10, H - 8]];
    groundPatch(d, 14, 58, W - 24, H - 66, mix(P.ground, '#c9b490', 0.4), 0.34, 20);
    pen.stipple(yard, 0.012, 0.8, '#8a6a40');
    // Gallinero con tejado de teja
    const hx = 30, hy = 116;
    d.wash([[hx, hy], [hx + 70, hy], [hx + 70, hy - 36], [hx, hy - 36]], P.whitewash, { alpha: 0.95 });
    pen.set({ width: 1.3 });
    pen.rect(hx, hy - 36, 70, 36);
    roofTiles(d, [[hx - 6, hy - 34], [hx + 76, hy - 34], [hx + 66, hy - 52], [hx + 4, hy - 52]], 3);
    pen.path([[hx - 6, hy - 34], [hx + 76, hy - 34], [hx + 66, hy - 52], [hx + 4, hy - 52]], true);
    pen.rect(hx + 26, hy - 20, 14, 20);
    pen.line(hx + 40, hy, hx + 52, hy + 10);
    // Valla
    pen.set({ width: 1.0 });
    const fence = [[16, 70], [W - 16, 60], [W - 8, H - 12], [10, H - 8], [16, 70]];
    for (let i = 0; i < fence.length - 1; i++) {
      const [x1, y1] = fence[i], [x2, y2] = fence[i + 1];
      const n = Math.round(Math.hypot(x2 - x1, y2 - y1) / 22);
      for (let k = 0; k <= n; k++) {
        const t = k / n, px = x1 + (x2 - x1) * t, py = y1 + (y2 - y1) * t;
        pen.line(px, py, px, py - 14);
      }
      pen.line(x1, y1 - 11, x2, y2 - 11);
      pen.line(x1, y1 - 5, x2, y2 - 5);
    }
    // Yuca con rueda de carro roja (de la foto)
    yuca(d, W - 50, 150, 1.2, 26);
    const wx = W - 46, wy = 150;
    pen.set({ width: 1.2 });
    d.wash(blobPts(wx, wy - 18, 18, 18, r, 0.02, 30), '#b8301f', { alpha: 0.18, edge: 0, grain: 0 });
    pen.set({ color: '#7a2010' });
    pen.ellipse(wx, wy - 18, 18, 18, 0.02);
    pen.ellipse(wx, wy - 18, 16, 16, 0.02);
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      pen.set({ width: 0.8, color: '#a07a10' });
      pen.line(wx + Math.cos(a) * 4, wy - 18 + Math.sin(a) * 4, wx + Math.cos(a) * 15, wy - 18 + Math.sin(a) * 15);
    }
    d.washBlob(wx, wy - 18, 4.5, 4.5, P.yellow, { alpha: 0.9, layers: 1, edge: 0.4, grain: 0 });
    pen.set({ color: '#3b2a1c', width: 1.4 });
    // Comedero
    d.wash([[110, 200], [160, 200], [156, 210], [114, 210]], P.wood, { alpha: 0.5 });
    pen.path([[110, 200], [160, 200], [156, 210], [114, 210]], true);
    // Tocones (de la foto)
    for (const [tx, ty] of [[40, 210], [56, 214]]) {
      d.wash([[tx - 6, ty], [tx + 6, ty], [tx + 6, ty - 14], [tx - 6, ty - 14]], P.wood, { alpha: 0.45 });
      pen.rect(tx - 6, ty - 14, 12, 14);
      pen.ellipse(tx, ty - 14, 6, 2);
    }
  },

  pozo(d) {
    const { pen, r, P } = d;
    const W = d.w, H = d.h;
    groundPatch(d, 4, 60, W - 8, H - 64, mix(P.ground, '#bfae88', 0.4), 0.3, 24);
    // Emparrado: postes, vigas y la viña por encima
    pen.set({ width: 1.3 });
    for (const x of [14, W - 14]) {
      d.wash([[x - 3, H - 8], [x + 3, H - 8], [x + 3, 34], [x - 3, 34]], P.wood, { alpha: 0.5, edge: 0 });
      pen.line(x - 3, H - 8, x - 3, 34); pen.line(x + 3, H - 8, x + 3, 34);
    }
    pen.line(6, 34, W - 6, 34); pen.line(6, 40, W - 6, 40);
    for (let x = 18; x < W - 10; x += 16) pen.line(x, 32, x + 6, 26);
    d.wash(canopyPts(W / 2, 30, W / 2 - 2, 20, r, 14, 0.35), mix(P.foliage, '#6a8a3a', 0.4), { alpha: 0.55 });
    pen.set({ width: 0.8 });
    pen.path(canopyPts(W / 2, 30, W / 2 - 2, 20, r, 14, 0.35), true);
    // Pámpanos colgando y racimos
    for (let i = 0; i < 7; i++) {
      const x = 20 + i * 17 + r.range(-3, 3);
      pen.curve([[x, 42], [x + 3, 50], [x - 1, 58]]);
      if (i % 2 === 0) for (let k = 0; k < 5; k++) pen.dot(x + (k % 2) * 3 - 1, 50 + k * 2.4, 2.1, '#5a3a6a', 0.8);
    }
    // El pozo: brocal encalado, arco de hierro, polea y cubo
    const cx = W / 2, top = H - 50;
    groundShadow(d, cx + 4, H - 14, 36, 6);
    d.wash([[cx - 30, top], [cx + 30, top], [cx + 30, H - 18], [cx - 30, H - 18]], P.whitewash, { alpha: 1 });
    d.washBlob(cx, top, 30, 9, '#e8e4da', { alpha: 1, irregular: 0.03 });
    d.washBlob(cx, top, 22, 6, '#2a3a44', { alpha: 0.85, irregular: 0.03, edge: 0 });
    pen.set({ width: 1.4 });
    pen.ellipse(cx, top, 30, 9, 0.03);
    pen.ellipse(cx, top, 22, 6, 0.03);
    pen.line(cx - 30, top, cx - 30, H - 18);
    pen.line(cx + 30, top, cx + 30, H - 18);
    pen.curve([[cx - 30, H - 18], [cx, H - 12], [cx + 30, H - 18]]);
    pen.set({ width: 0.6, double: false });
    for (let k = 0; k < 6; k++) pen.line(cx - 26 + k * 10, top + 10, cx - 27 + k * 10, H - 16);
    pen.set({ width: 1.6, double: true, color: '#2b2420' });
    pen.curve([[cx - 26, top - 2], [cx - 18, top - 30], [cx, top - 38], [cx + 18, top - 30], [cx + 26, top - 2]]);
    pen.ellipse(cx, top - 32, 4, 4);
    pen.set({ width: 0.8 });
    pen.line(cx, top - 28, cx, top - 12);
    pen.set({ color: '#3b2a1c', width: 1.1 });
    d.wash([[cx - 6, top - 12], [cx + 6, top - 12], [cx + 5, top - 2], [cx - 5, top - 2]], '#8a8a8a', { alpha: 0.7 });
    pen.path([[cx - 6, top - 12], [cx + 6, top - 12], [cx + 5, top - 2], [cx - 5, top - 2]], true);
    // Cántaro junto al brocal
    d.washBlob(cx + 42, H - 22, 7, 9, '#c07a4a', { alpha: 0.75 });
    pen.ellipse(cx + 42, H - 22, 7, 9);
  },

  bancos(d) {
    // Según la foto: bancos bajos de piedra artificial, sin respaldo. Encima, un mosaico de trencadís:
    // cemento gris, esquinas de azulejo blanco con dibujo azul y rojo, chinas de azulejo azul
    // y el nombre de cada nieto hecho con trozos de azulejo blanco.
    const { pen, r, P } = d;
    const W = d.w, H = d.h;
    const names = GRANDCHILDREN.length ? GRANDCHILDREN : [];
    const n = Math.max(4, Math.min(6, names.length || 4));
    const gap = W / n;
    const bw = gap * 0.74;
    for (let i = 0; i < n; i++) {
      const x = i * gap + (gap - bw) / 2;
      const top = 26, th = 26, face = 7, legs = 10;
      groundShadow(d, x + bw / 2 + 3, top + th + face + legs, bw / 2 + 6, 5);
      // Patas acanaladas
      for (const lx of [x + 6, x + bw - 20]) {
        d.wash([[lx, top + th + face], [lx + 14, top + th + face], [lx + 14, top + th + face + legs], [lx, top + th + face + legs]], '#e4e0d6', { alpha: 1, edge: 0.2 });
        pen.set({ width: 0.9 });
        pen.rect(lx, top + th + face, 14, legs);
        pen.set({ width: 0.4 });
        for (let k = 3; k < 14; k += 3.5) pen.line(lx + k, top + th + face + 1, lx + k, top + th + face + legs - 1);
      }
      // Canto del asiento
      d.wash([[x, top + th], [x + bw, top + th], [x + bw, top + th + face], [x, top + th + face]], '#d8d4ca', { alpha: 1, edge: 0.2 });
      // Tablero de cemento
      const seat = [[x, top], [x + bw, top], [x + bw, top + th], [x, top + th]];
      d.wash(seat, '#c9c4b8', { alpha: 1, edge: 0.25 });
      // Esquinas de azulejo blanco con dibujo
      const cw = 11, chh = 8;
      for (const [cx0, cy0] of [[x + 1, top + 1], [x + bw - cw - 1, top + 1], [x + 1, top + th - chh - 1], [x + bw - cw - 1, top + th - chh - 1]]) {
        d.wash([[cx0, cy0], [cx0 + cw, cy0], [cx0 + cw, cy0 + chh], [cx0, cy0 + chh]], '#f4efe4', { alpha: 1, edge: 0, grain: 0 });
        pen.set({ width: 0.45, double: false, color: P.tile });
        pen.curve([[cx0 + 1.5, cy0 + chh - 1.5], [cx0 + cw * 0.3, cy0 + 2], [cx0 + cw * 0.7, cy0 + chh - 2], [cx0 + cw - 1.5, cy0 + 1.5]]);
        pen.dot(cx0 + cw / 2, cy0 + chh / 2, 0.8, '#b8402f', 0.8);
        pen.set({ color: '#3b2a1c', double: true });
      }
      // Chinas azules (y alguna amarilla)
      for (let k = 0; k < 16; k++) {
        const px = x + 13 + r() * (bw - 26), py = top + 3 + r() * (th - 6);
        d.washBlob(px, py, 1.2 + r() * 1.1, 1 + r() * 0.8, r() < 0.85 ? '#2340a8' : '#e2b33a', { alpha: 0.95, layers: 1, edge: 0.3, grain: 0, irregular: 0.35 });
      }
      // El nombre, en trozos de azulejo blanco (si aún no hay nombres, unos trazos sueltos)
      const name = names[i];
      if (name) {
        d.ctx.save();
        const fs = Math.min(17, (bw - 22) / Math.max(3, name.length) * 1.5);
        d.ctx.font = `900 ${fs}px "Patrick Hand", "Caveat", sans-serif`;
        d.ctx.textAlign = 'center';
        d.ctx.lineJoin = 'round';
        d.ctx.lineWidth = 1.2;
        d.ctx.strokeStyle = 'rgba(80,72,60,0.7)';
        d.ctx.fillStyle = '#fbf8f0';
        d.ctx.strokeText(name.toUpperCase(), x + bw / 2, top + th / 2 + fs * 0.36);
        d.ctx.fillText(name.toUpperCase(), x + bw / 2, top + th / 2 + fs * 0.36);
        // Grietas del trencadís sobre las letras
        d.ctx.strokeStyle = 'rgba(120,110,95,0.6)';
        d.ctx.lineWidth = 0.5;
        for (let k = 0; k < 6; k++) {
          const sx = x + 14 + r() * (bw - 28), sy = top + 6 + r() * (th - 12);
          d.ctx.beginPath(); d.ctx.moveTo(sx, sy); d.ctx.lineTo(sx + r.range(-4, 4), sy + r.range(3, 6)); d.ctx.stroke();
        }
        d.ctx.restore();
      } else {
        for (let k = 0; k < 4; k++) {
          const px = x + 16 + k * (bw - 32) / 4;
          d.wash([[px, top + 8], [px + 6, top + 7], [px + 7, top + th - 8], [px + 1, top + th - 7]], '#fbf8f0', { alpha: 0.95, edge: 0, grain: 0 });
        }
      }
      pen.set({ width: 1.2 });
      pen.path(seat, true);
      pen.rect(x, top + th, bw, face);
    }
    // Plantones de mimosa y hojas secas alrededor, como en la foto
    for (let i = 0; i <= n; i++) {
      const sx = i * gap + r.range(-6, 6), sy = 22 + r() * 10;
      pen.set({ width: 0.5, double: false, color: '#5a6b35' });
      pen.line(sx, sy + 12, sx + 1, sy);
      for (let k = 0; k < 5; k++) { pen.line(sx + 1, sy + k * 2.2, sx - 4, sy + k * 2.2 - 1); pen.line(sx + 1, sy + k * 2.2, sx + 6, sy + k * 2.2 - 1); }
      pen.set({ width: 1.4, double: true, color: '#3b2a1c' });
    }
    leafLitter(d, 0, 10, W, H - 14, 26, ['#9a6a35', '#b08a3a', '#c9a24a']);
  },

  piano(d) {
    const { pen, r, P } = d;
    const W = d.w, H = d.h;
    // Eucalipto grande detrás
    eucalipto(d, 34, H - 20, 1.2);
    // Cenador: postes y vigas
    const gy = H - 24;
    d.wash([[44, gy + 4], [W - 14, gy + 4], [W - 22, gy + 16], [52, gy + 16]], P.path, { alpha: 0.4 });
    pen.set({ width: 1.4 });
    for (const x of [58, W - 30]) {
      d.wash([[x - 3, gy], [x + 3, gy], [x + 3, gy - 96], [x - 3, gy - 96]], P.wood, { alpha: 0.5, edge: 0 });
      pen.line(x - 3, gy, x - 3, gy - 96);
      pen.line(x + 3, gy, x + 3, gy - 96);
    }
    pen.line(48, gy - 96, W - 20, gy - 96);
    pen.line(48, gy - 90, W - 20, gy - 90);
    for (let x = 60; x < W - 20; x += 14) pen.line(x, gy - 98, x + 6, gy - 104);
    // Enredadera encima
    d.wash(canopyPts((W + 30) / 2, gy - 104, (W - 50) / 2, 14, r, 14, 0.35), P.foliage, { alpha: 0.5 });
    pen.set({ width: 0.7 });
    for (let i = 0; i < 6; i++) {
      const x = 70 + r() * (W - 110);
      pen.curve([[x, gy - 92], [x + 3, gy - 80], [x - 2, gy - 70]]);
    }
    // Piano vertical
    const px = 92, py = gy, pw = 72, ph = 58;
    groundShadow(d, px + pw / 2, py + 2, 44, 5);
    d.wash([[px, py], [px + pw, py], [px + pw, py - ph], [px, py - ph]], '#5a3a26', { alpha: 0.6 });
    pen.set({ width: 1.5 });
    pen.rect(px, py - ph, pw, ph);
    pen.rect(px - 3, py - ph - 4, pw + 6, 4);
    // Teclado
    d.wash([[px - 4, py - 26], [px + pw + 4, py - 26], [px + pw + 4, py - 20], [px - 4, py - 20]], '#f6f1e6', { alpha: 0.95, edge: 0 });
    pen.set({ width: 0.9 });
    pen.rect(px - 4, py - 26, pw + 8, 6);
    pen.set({ width: 0.5, double: false });
    for (let k = 0; k < 20; k++) pen.line(px - 4 + k * 4, py - 26, px - 4 + k * 4, py - 20);
    for (let k = 0; k < 19; k++) if (k % 7 !== 2 && k % 7 !== 6) pen.dot(px - 2 + k * 4, py - 24.5, 1.1, '#1a1410', 0.95);
    pen.set({ double: true, width: 1.1 });
    // Atril y partitura
    pen.path([[px + 22, py - 30], [px + 50, py - 30], [px + 48, py - 44], [px + 24, py - 44]], true);
    pen.set({ width: 0.5, double: false });
    for (let k = 0; k < 4; k++) pen.line(px + 26, py - 41 + k * 2.5, px + 46, py - 41 + k * 2.5);
    pen.set({ double: true, width: 1.0 });
    // Patas
    pen.line(px + 4, py - 20, px + 4, py);
    pen.line(px + pw - 4, py - 20, px + pw - 4, py);
    // Banqueta
    d.wash([[px + 22, py - 10], [px + 50, py - 10], [px + 50, py - 14], [px + 22, py - 14]], '#7a4a2a', { alpha: 0.6 });
    pen.rect(px + 22, py - 14, 28, 4);
    pen.line(px + 25, py - 10, px + 25, py + 2);
    pen.line(px + 47, py - 10, px + 47, py + 2);
    // Candelabros
    for (const cx of [px + 6, px + pw - 6]) {
      pen.line(cx, py - ph - 4, cx, py - ph - 14);
      d.washBlob(cx, py - ph - 17, 1.8, 3, '#f5d070', { alpha: 0.8, layers: 1, edge: 0, grain: 0 });
    }
    // Sillas de los oyentes
    for (const sx of [W - 54, W - 76]) {
      pen.set({ width: 0.9 });
      pen.path([[sx, gy + 12], [sx, gy - 2], [sx + 12, gy - 2], [sx + 12, gy + 12]], false);
      pen.line(sx + 12, gy - 2, sx + 12, gy - 16);
    }
  },
};

// ───────────────────────── Decorado del plano ─────────────────────────

export function village(d) {
  const { pen, r, P } = d;
  const W = d.w, H = d.h;
  // Colina
  const hill = [[0, H], [W * 0.15, H * 0.62], [W * 0.4, H * 0.48], [W * 0.62, H * 0.5], [W * 0.85, H * 0.6], [W, H * 0.75], [W, H]];
  d.wash(hill, mix(P.grass, '#c8b890', 0.4), { alpha: 0.28, edge: 0.2 });
  pen.set({ width: 0.9 });
  pen.curve(hill.slice(0, 6));
  // Casas blancas apiñadas
  const houses = [];
  for (let i = 0; i < 26; i++) {
    const x = W * 0.12 + r() * W * 0.72;
    const top = H * 0.62 - Math.sin(((x / W) - 0.1) * Math.PI) * H * 0.22;
    houses.push([x, top + r() * 20, 14 + r() * 16, 10 + r() * 9]);
  }
  houses.sort((a, b) => a[1] - b[1]);
  for (const [x, y, w, h] of houses) {
    d.wash([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], P.whitewash, { alpha: 0.75, edge: 0.15, grain: 0 });
    d.wash([[x - 1, y], [x + w + 1, y], [x + w * 0.8, y - 5], [x + w * 0.2, y - 5]], P.roof, { alpha: 0.6, edge: 0.2, grain: 0 });
    pen.set({ width: 0.7 });
    pen.path([[x, y + h], [x, y], [x + w, y], [x + w, y + h]], false);
    pen.path([[x - 1, y], [x + w * 0.2, y - 5], [x + w * 0.8, y - 5], [x + w + 1, y]], false);
    if (r() < 0.5) pen.rect(x + w * 0.4, y + h * 0.35, 2.5, 3.5);
  }
  // Iglesia con campanario
  const cx = W * 0.46, cy = H * 0.3;
  d.wash([[cx, cy + 34], [cx + 30, cy + 34], [cx + 30, cy], [cx, cy]], P.whitewash, { alpha: 0.8 });
  d.wash([[cx + 6, cy], [cx + 22, cy], [cx + 22, cy - 26], [cx + 6, cy - 26]], P.whitewash, { alpha: 0.8 });
  pen.set({ width: 1.0 });
  pen.rect(cx, cy, 30, 34);
  pen.rect(cx + 6, cy - 26, 16, 26);
  pen.path([[cx + 4, cy - 26], [cx + 14, cy - 40], [cx + 24, cy - 26]], false);
  pen.rect(cx + 11, cy - 20, 6, 8);
  d.wash([[cx + 4, cy - 26], [cx + 14, cy - 40], [cx + 24, cy - 26]], P.roof, { alpha: 0.6 });
  // Árboles sueltos en la ladera
  for (let i = 0; i < 6; i++) {
    const x = r() * W, y = H * 0.7 + r() * H * 0.25;
    d.washBlob(x, y, 6, 4, P.oak, { alpha: 0.5, layers: 1, edge: 0.4, grain: 0 });
  }
}

// Rosa de los vientos
export function compass(d, x, y, s = 1) {
  const { pen } = d;
  pen.set({ width: 1.0 });
  pen.ellipse(x, y, 26 * s, 26 * s, 0.02);
  pen.ellipse(x, y, 20 * s, 20 * s, 0.02);
  const star = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 4 === 0 ? 34 * s : i % 2 === 0 ? 16 * s : 9 * s;
    star.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  d.wash(star, '#b8603a', { alpha: 0.35, edge: 0.3 });
  pen.path(star, true);
  pen.hatch([[x, y], star[0], star[1], star[2], star[3], star[4]], { gap: 2.5, alpha: 0.5 });
}

export function rgbaInk(a) { return rgba('#3b2a1c', a); }
