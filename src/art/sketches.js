// Ilustraciones a boceto de la finca, dibujadas a partir de las fotos de referencia.
// Cada función dibuja en coordenadas locales de su zona (0,0 → w,h) sobre dos capas:
//   d.pen → tinta (capa de líneas)      d.wash(...) → acuarela (capa de color)
import { canopyPts, blobPts, rgba, mix } from './ink.js';

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

// ───────────────────────── Zonas ─────────────────────────

export const SKETCHES = {
  cortijo(d) {
    const { pen, r, P } = d;
    const gy = 202;
    groundShadow(d, 140, gy + 2, 120, 10);
    // Fachada, lateral y tejado
    const front = [[40, 78], [192, 78], [192, gy], [40, gy]];
    const side = [[192, 78], [240, 60], [240, gy - 14], [192, gy]];
    d.wash(front, P.whitewash, { alpha: 1.0, spread: 0.8, edge: 0.2, grain: 0.002 });
    d.wash(side, mix(P.whitewash, P.wallShade, 0.5), { alpha: 0.95, spread: 0.8 });
    // Sombras de hojas sobre la cal (como en la foto)
    for (let i = 0; i < 9; i++) d.washBlob(r.range(130, 188), r.range(100, 190), r.range(5, 12), r.range(3, 6), P.wallShade, { alpha: 0.18, edge: 0, grain: 0 });
    pen.set({ width: 1.6 });
    pen.path(front, true);
    pen.path(side, false);
    pen.hatch(side, { angle: -1.1, gap: 4.5, alpha: 0.45 });
    // Tejado
    const roofF = [[32, 80], [200, 80], [178, 44], [58, 44]];
    const roofS = [[200, 80], [248, 62], [226, 30], [178, 44]];
    roofTiles(d, roofF, 5);
    d.wash(roofS, P.roofDark, { alpha: 0.5 });
    pen.path(roofF, true);
    pen.path(roofS, false);
    pen.hatch(roofS, { angle: 0.6, gap: 3.5, alpha: 0.4 });
    // Chimenea
    const ch = [[150, 46], [162, 46], [162, 26], [150, 26]];
    d.wash(ch, P.whitewash, { alpha: 0.7 });
    pen.path(ch, true);
    pen.line(147, 26, 165, 26);
    // Zócalo
    d.wash([[40, gy - 10], [192, gy - 10], [192, gy], [40, gy]], '#d9b8a8', { alpha: 0.5 });
    pen.set({ width: 0.8 });
    pen.line(40, gy - 10, 192, gy - 10);
    for (let x = 52; x < 192; x += 14) pen.line(x, gy - 10, x, gy);
    // Ventana de arriba: marco de azulejo, reja y macetas
    tilePattern(d, 86, 94, 42, 46, P.tile, 5.2);
    d.wash([[96, 100], [118, 100], [118, 134], [96, 134]], '#e8e4da', { alpha: 0.9, edge: 0 });
    pen.set({ width: 1.2 });
    pen.rect(96, 100, 22, 34);
    pen.set({ width: 0.6 });
    for (let yy = 104; yy < 134; yy += 3) pen.line(97, yy, 117, yy); // persiana
    ironGrille(d, 92, 98, 30, 40);
    maceta(d, 95, 139); maceta(d, 119, 139);
    // Puerta de abajo
    tilePattern(d, 92, 146, 46, 46, P.tile, 5.2);
    d.wash([[102, 152], [128, 152], [128, gy - 10], [102, gy - 10]], '#f2efe8', { alpha: 0.95, edge: 0 });
    pen.set({ width: 1.2 });
    pen.rect(102, 152, 26, gy - 162);
    pen.set({ width: 0.7 });
    pen.rect(106, 158, 18, 12);
    pen.rect(106, 174, 18, 14);
    pen.dot(124, 176, 1.1);
    // Farolillo sobre la puerta
    pen.rect(112, 136, 6, 7);
    d.washBlob(115, 140, 2.5, 3, '#f5e6a0', { alpha: 0.7, edge: 0, grain: 0 });
    // Ventanuco lateral
    pen.set({ width: 1.0 });
    pen.path([[210, 110], [222, 105], [222, 125], [210, 130]], true);
    // Farola blanca y arbusto de flores rojas
    farola(d, 258, gy + 2, 84);
    adelfa(d, 18, gy + 2, 0.85, '#c8322a');
  },

  patio(d) {
    const { pen, r, P } = d;
    const W = d.w, H = d.h;
    groundPatch(d, 4, 12, W - 8, H - 16, mix(P.path, '#c8b08a', 0.5), 0.42, 30);
    // Cantos rodados
    pen.set({ width: 0.5, double: false });
    for (let i = 0; i < 360; i++) {
      const x = 12 + r() * (W - 24), y = 22 + r() * (H - 32);
      pen.ellipse(x, y, 1.6 + r() * 1.6, 1 + r(), 0.3);
    }
    // Franjas de granito
    const strips = [[[14, 72], [W - 14, 44]], [[80, H - 12], [150, 20]], [[210, H - 12], [262, 18]]];
    for (const [[x1, y1], [x2, y2]] of strips) {
      const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
      const nx = -dy / L * 5, ny = dx / L * 5;
      const poly = [[x1 - nx, y1 - ny], [x2 - nx, y2 - ny], [x2 + nx, y2 + ny], [x1 + nx, y1 + ny]];
      d.wash(poly, '#d2cfc8', { alpha: 0.5, spread: 0.8, edge: 0.15, grain: 0 });
      pen.set({ width: 0.5, double: false, alpha: 0.6 });
      const n = Math.round(L / 16);
      for (let k = 0; k <= n; k++) {
        const t = k / n;
        pen.line(x1 + dx * t - nx * 0.8, y1 + dy * t - ny * 0.8, x1 + dx * t + nx * 0.8, y1 + dy * t + ny * 0.8);
      }
      pen.line(x1 - nx, y1 - ny, x2 - nx, y2 - ny);
      pen.line(x1 + nx, y1 + ny, x2 + nx, y2 + ny);
      pen.set({ alpha: 1 });
    }
    pen.set({ width: 1.4, double: true });
    // Fuente de azulejo azul
    const fx = 70, fy = 120;
    groundShadow(d, fx + 4, fy + 22, 54, 8);
    tilePattern(d, fx - 48, fy, 96, 20, P.tile, 6);
    pen.set({ width: 1.3 });
    pen.rect(fx - 48, fy, 96, 20);
    pen.path([[fx - 48, fy], [fx - 40, fy - 10], [fx + 56, fy - 10], [fx + 48, fy]], false);
    pen.line(fx + 56, fy - 10, fx + 56, fy + 10);
    pen.line(fx + 48, fy + 20, fx + 56, fy + 10);
    d.wash([[fx - 40, fy - 9], [fx + 54, fy - 9], [fx + 47, fy - 1], [fx - 46, fy - 1]], P.water, { alpha: 0.6 });
    // Rocalla con la figura sentada encima
    for (let i = 0; i < 6; i++) boulder(d, fx - 14 + r.range(-12, 12), fy - 16 - i * 4, r.range(6, 10), r.range(4, 6));
    estatuaSentada(d, fx - 12, fy - 36, 0.8);
    pen.set({ width: 0.7 });
    pen.curve([[fx - 4, fy - 52], [fx + 2, fy - 44], [fx + 4, fy - 30], [fx + 6, fy - 12]]); // chorro
    // León junto a las yucas y figura sobre pedestal con lavanda
    leon(d, 205, 84, 1.1);
    yuca(d, 180, 82, 0.9);
    lavanda(d, 270, 66, 1.1); lavanda(d, 298, 76, 1); lavanda(d, 286, 54, 0.9);
    estatuaSentada(d, 252, 92, 1);
    // Hojas secas
    leafLitter(d, 10, 20, W - 20, H - 30, 40, [P.flowers, '#c9a24a', '#9a6a35']);
  },

  paseo(d) {
    const { pen, r, P } = d;
    const W = d.w;
    // Camino de tierra
    const top = [], bot = [];
    for (let x = 0; x <= W; x += 30) {
      top.push([x, 52 + Math.sin(x / 70) * 4]);
      bot.push([x, 86 + Math.sin(x / 60 + 1) * 4]);
    }
    d.wash([...top, ...bot.slice().reverse()], P.path, { alpha: 0.5, spread: 2 });
    pen.set({ width: 1.1 });
    pen.curve(top); pen.curve(bot);
    // Sombras moteadas sobre el camino
    for (let i = 0; i < 16; i++) d.washBlob(r() * W, 60 + r() * 22, 8 + r() * 10, 3 + r() * 3, '#6b5a48', { alpha: 0.14, edge: 0, grain: 0 });
    // Túnel de árboles: copas arriba
    for (let x = 10; x < W; x += 34 + r() * 10) {
      if (r() < 0.55) adelfa(d, x, 52, 1.05);
      else {
        const cx = x, cy = 22;
        const pts = canopyPts(cx, cy, 26, 18, r, 8, 0.22);
        d.wash(pts, r() < 0.3 ? mix(P.foliage, P.flowers, 0.35) : P.foliage, { alpha: 0.5 });
        pen.set({ width: 1.0 });
        pen.path(pts, true);
        pen.line(cx - 1, 38, cx - 2, 54);
      }
    }
    // Abajo: yucas, arbustos y adelfas pequeñas
    for (let x = 20; x < W; x += 46 + r() * 20) {
      const k = r();
      if (k < 0.35) yuca(d, x, 116, 0.8);
      else if (k < 0.7) adelfa(d, x, 118, 0.75);
      else arbusto(d, x, 116, 1);
    }
    leafLitter(d, 0, 56, W, 28, 50, ['#b08a3a', '#8a6a30', P.flowers]);
    // Postes blancos
    pen.set({ width: 1.0 });
    for (const x of [30, 150]) { pen.line(x, 90, x, 70); pen.line(x + 2, 90, x + 2, 70); }
  },

  almacen(d) {
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
    // Campanario/chimenea en lo alto
    pen.rect(88, 46, 10, 18);
    pen.rect(86, 42, 14, 5);
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
      // Plantas
      for (let x = 52; x < W - 64; x += 12 + r() * 6) {
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
    // Parra sobre emparrado
    const px = 360, py = H - 16;
    pen.set({ width: 1.1 });
    for (const x of [px, px + 48]) pen.line(x, py, x, py - 46);
    pen.line(px - 6, py - 46, px + 54, py - 46);
    for (let x = px; x <= px + 48; x += 12) pen.line(x, py - 46, x + 4, py - 52);
    d.wash(canopyPts(px + 24, py - 50, 34, 10, r, 10, 0.3), P.foliage, { alpha: 0.5 });
    for (let i = 0; i < 5; i++) pen.dot(px + 6 + i * 9, py - 40, 2, '#5a3a6a', 0.7);
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
