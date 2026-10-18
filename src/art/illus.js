// Ilustraciones a boceto para eventos, recuerdos y la portada.
import { Pen, wash, blobPts, canopyPts, rgba, mix, INK } from './ink.js';
import { makeRng, hashStr } from './noise.js';
import { palette } from './palette.js';
import { encina, pino, eucalipto, adelfa, yuca, boulder, lavanda, grassTufts, mimosa, village } from './sketches.js';
import { singleCtx } from './map.js';
import { drawDeer } from './critters.js';

const W = 360, H = 210;

function setup(canvas, key, season, w = W, h = H) {
  const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
  canvas.width = w * dpr; canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const d = singleCtx(ctx, hashStr(key) + 3, palette(season), w, h);
  return { ctx, d };
}

// Bordes de la viñeta desvanecidos como acuarela que no llega al borde
function vignetteMask(ctx, w, h, seed) {
  const r = makeRng(seed);
  ctx.save();
  ctx.globalCompositeOperation = 'destination-in';
  const pts = blobPts(w / 2, h / 2, w * 0.47, h * 0.44, r, 0.07, 40);
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, w * 0.55);
  g.addColorStop(0, 'rgba(0,0,0,1)');
  g.addColorStop(0.75, 'rgba(0,0,0,0.9)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function sky(d, c1, c2, h = 120) {
  const { ctx } = d;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, rgba(c1, 0.55));
  g.addColorStop(1, rgba(c2, 0.25));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, d.w, h);
}

function hills(d, y = 140, color) {
  const pts = [[0, d.h], [0, y]];
  for (let x = 0; x <= d.w; x += 40) pts.push([x, y - 10 + Math.sin(x / 60) * 8 + d.r() * 4]);
  pts.push([d.w, d.h]);
  d.wash(pts, color || d.P.grass, { alpha: 0.4, spread: 3 });
  d.pen.set({ width: 1.1 });
  d.pen.curve(pts.slice(1, -1));
}

function sun(d, x, y, r, color = '#e8b040') {
  d.washBlob(x, y, r, r, color, { alpha: 0.6, edge: 0.3, grain: 0 });
  d.pen.set({ width: 1 });
  d.pen.ellipse(x, y, r, r, 0.03);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    d.pen.line(x + Math.cos(a) * (r + 4), y + Math.sin(a) * (r + 4), x + Math.cos(a) * (r + 11), y + Math.sin(a) * (r + 11));
  }
}

function cloud(d, x, y, s = 1, color = '#9aa3ad', alpha = 0.45) {
  const pts = [];
  for (let i = 0; i < 7; i++) pts.push(...blobPts(x + (i - 3) * 14 * s, y - Math.sin((i / 6) * Math.PI) * 10 * s, 14 * s, 10 * s, d.r, 0.1, 10));
  d.washBlob(x, y - 4 * s, 52 * s, 16 * s, color, { alpha, edge: 0.2 });
  d.pen.set({ width: 1 });
  d.pen.curve([[x - 50 * s, y + 6 * s], [x - 44 * s, y - 10 * s], [x - 22 * s, y - 18 * s], [x, y - 22 * s], [x + 24 * s, y - 16 * s], [x + 46 * s, y - 8 * s], [x + 52 * s, y + 6 * s]]);
  d.pen.line(x - 50 * s, y + 6 * s, x + 52 * s, y + 6 * s);
}

function rain(d, n = 60, x0 = 0, y0 = 40, w = W, h = 160, color = '#4a5a78') {
  d.pen.set({ width: 0.8, double: false, color });
  for (let i = 0; i < n; i++) {
    const x = x0 + d.r() * w, y = y0 + d.r() * h;
    d.pen.line(x, y, x - 3, y + 10);
  }
  d.pen.set({ width: 1.4, double: true, color: INK });
}

function person(d, x, y, s = 1, hat = true, color = '#7a5a3a') {
  const { pen } = d;
  pen.set({ width: 1.2 });
  pen.line(x - 3 * s, y, x - 2 * s, y - 16 * s);
  pen.line(x + 3 * s, y, x + 2 * s, y - 16 * s);
  const body = [[x - 6 * s, y - 15 * s], [x - 5 * s, y - 34 * s], [x + 5 * s, y - 34 * s], [x + 6 * s, y - 15 * s]];
  d.wash(body, color, { alpha: 0.55 });
  pen.path(body, true);
  pen.ellipse(x, y - 40 * s, 5 * s, 5.5 * s);
  if (hat) {
    pen.line(x - 9 * s, y - 44 * s, x + 9 * s, y - 44 * s);
    pen.path([[x - 5 * s, y - 44 * s], [x - 4 * s, y - 50 * s], [x + 4 * s, y - 50 * s], [x + 5 * s, y - 44 * s]], false);
  }
}

function piano(d, x, y, s = 1) {
  const { pen } = d;
  const w = 90 * s, h = 70 * s;
  d.wash([[x, y], [x + w, y], [x + w, y - h], [x, y - h]], '#5a3a26', { alpha: 0.6 });
  pen.set({ width: 1.5 });
  pen.rect(x, y - h, w, h);
  d.wash([[x - 4, y - 30 * s], [x + w + 4, y - 30 * s], [x + w + 4, y - 22 * s], [x - 4, y - 22 * s]], '#f6f1e6', { alpha: 0.95, edge: 0 });
  pen.rect(x - 4, y - 30 * s, w + 8, 8 * s);
  pen.set({ width: 0.6, double: false });
  for (let k = 0; k < 18; k++) pen.line(x - 4 + k * (w + 8) / 18, y - 30 * s, x - 4 + k * (w + 8) / 18, y - 22 * s);
  pen.set({ width: 1.2, double: true });
  pen.line(x + 6, y - 22 * s, x + 6, y);
  pen.line(x + w - 6, y - 22 * s, x + w - 6, y);
}

function notes(d, x, y, n = 5, color = INK) {
  const { pen } = d;
  pen.set({ width: 1.1, color });
  for (let i = 0; i < n; i++) {
    const nx = x + i * 22, ny = y - Math.sin(i * 1.3) * 14 - i * 6;
    d.washBlob(nx, ny, 4, 3, color, { alpha: 0.85, layers: 1, edge: 0, grain: 0 });
    pen.line(nx + 3.5, ny, nx + 3.5, ny - 18);
    if (i % 2 === 0) pen.curve([[nx + 3.5, ny - 18], [nx + 9, ny - 13], [nx + 8, ny - 7]]);
  }
  pen.set({ color: INK, width: 1.4 });
}

function envelope(d, x, y, w = 110, h = 70) {
  const { pen } = d;
  d.wash([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], '#f4ead2', { alpha: 0.9 });
  pen.set({ width: 1.3 });
  pen.rect(x, y, w, h);
  pen.path([[x, y], [x + w / 2, y + h * 0.55], [x + w, y]], false);
  d.washBlob(x + w - 16, y + 14, 8, 9, '#b8301f', { alpha: 0.5 });
  pen.rect(x + w - 24, y + 6, 16, 18);
}

function papers(d, x, y) {
  const { pen } = d;
  for (let i = 0; i < 3; i++) {
    const ox = x + i * 14, oy = y - i * 8;
    d.wash([[ox, oy], [ox + 100, oy + 4], [ox + 96, oy + 74], [ox - 4, oy + 70]], '#f6efdc', { alpha: 0.9 });
    pen.set({ width: 1.1 });
    pen.path([[ox, oy], [ox + 100, oy + 4], [ox + 96, oy + 74], [ox - 4, oy + 70]], true);
    pen.set({ width: 0.6, double: false });
    for (let k = 0; k < 6; k++) pen.line(ox + 8, oy + 14 + k * 9, ox + 80 - (k % 2) * 20, oy + 15 + k * 9);
    pen.set({ double: true });
  }
  // Sello
  d.washBlob(x + 90, y + 48, 16, 16, '#a0302a', { alpha: 0.4, edge: 0.6 });
  pen.set({ width: 1, color: '#7a2020' });
  pen.ellipse(x + 90, y + 48, 16, 16);
  pen.ellipse(x + 90, y + 48, 11, 11);
  pen.set({ color: INK });
}

function catSketch(d, x, y, s = 1) {
  const { pen } = d;
  const body = blobPts(x, y - 14 * s, 18 * s, 14 * s, d.r, 0.05, 20);
  d.wash(body, '#ffffff', { alpha: 0.9, edge: 0 });
  pen.set({ width: 1.3 });
  pen.path(body, true);
  d.washBlob(x - 6 * s, y - 20 * s, 9 * s, 6 * s, '#84705a', { alpha: 0.7, edge: 0 });
  const hx = x + 10 * s, hy = y - 32 * s;
  d.washBlob(hx, hy, 10 * s, 9 * s, '#ffffff', { alpha: 0.95, edge: 0 });
  pen.ellipse(hx, hy, 10 * s, 9 * s);
  d.wash([[hx - 9 * s, hy - 4 * s], [hx - 7 * s, hy - 16 * s], [hx - 1 * s, hy - 8 * s]], '#84705a', { alpha: 0.8 });
  d.wash([[hx + 1 * s, hy - 8 * s], [hx + 7 * s, hy - 16 * s], [hx + 9 * s, hy - 4 * s]], '#84705a', { alpha: 0.8 });
  pen.path([[hx - 9 * s, hy - 4 * s], [hx - 7 * s, hy - 16 * s], [hx - 1 * s, hy - 8 * s]], false);
  pen.path([[hx + 1 * s, hy - 8 * s], [hx + 7 * s, hy - 16 * s], [hx + 9 * s, hy - 4 * s]], false);
  d.washBlob(hx, hy - 6 * s, 7 * s, 3 * s, '#84705a', { alpha: 0.6, edge: 0 });
  pen.dot(hx - 3.5 * s, hy - 1 * s, 1.4 * s, '#6e8c46');
  pen.dot(hx + 3.5 * s, hy - 1 * s, 1.4 * s, '#6e8c46');
  pen.dot(hx, hy + 2.5 * s, 1.2 * s, '#d88a8a');
  pen.set({ width: 0.6 });
  for (const k of [-1, 1]) { pen.line(hx + k * 3, hy + 3, hx + k * 12, hy + 1); pen.line(hx + k * 3, hy + 4, hx + k * 12, hy + 5); }
  pen.set({ width: 2.2, color: '#84705a' });
  pen.curve([[x - 16 * s, y - 8 * s], [x - 28 * s, y - 10 * s], [x - 26 * s, y - 26 * s]]);
  pen.set({ width: 1.4, color: INK });
}

function boar(d, x, y, s = 1) {
  const { pen } = d;
  // Cuerpo con cruz alta y lomo erizado, cabeza baja con hocico
  const body = [[x - 40 * s, y - 14 * s], [x - 38 * s, y - 30 * s], [x - 20 * s, y - 40 * s], [x + 4 * s, y - 44 * s], [x + 22 * s, y - 38 * s],
    [x + 32 * s, y - 30 * s], [x + 46 * s, y - 24 * s], [x + 54 * s, y - 18 * s], [x + 50 * s, y - 12 * s], [x + 34 * s, y - 12 * s], [x + 20 * s, y - 10 * s], [x - 30 * s, y - 10 * s]];
  d.wash(body, '#5a4636', { alpha: 0.75 });
  pen.set({ width: 1.4 });
  pen.curve(body, true);
  pen.hatch(body, { gap: 3.2, alpha: 0.45, angle: -1.2 });
  // Crines del lomo
  pen.set({ width: 1 });
  for (let i = 0; i < 9; i++) { const bx = x - 26 * s + i * 6 * s, by = y - 41 * s + Math.abs(i - 4) * 1.4 * s; pen.line(bx, by, bx - 2 * s, by - 6 * s); }
  // Oreja, ojo, colmillo y hocico
  pen.path([[x + 26 * s, y - 36 * s], [x + 28 * s, y - 46 * s], [x + 33 * s, y - 34 * s]], false);
  pen.dot(x + 38 * s, y - 25 * s, 1.6 * s, '#1a120c');
  d.washBlob(x + 53 * s, y - 15 * s, 3.5 * s, 4 * s, '#8a6a5a', { alpha: 0.9, edge: 0.5 });
  pen.set({ width: 1.6, color: '#f4ecdc' });
  pen.curve([[x + 46 * s, y - 13 * s], [x + 48 * s, y - 18 * s], [x + 45 * s, y - 21 * s]]);
  pen.set({ color: '#3b2a1c', width: 1.5 });
  // Patas finas
  for (const [lx, k] of [[-30, -1], [-20, 1], [16, -1], [26, 1]]) pen.curve([[x + lx * s, y - 11 * s], [x + (lx + k) * s, y - 2 * s], [x + (lx + k * 2) * s, y + 6 * s]]);
  // Cola
  pen.curve([[x - 39 * s, y - 26 * s], [x - 45 * s, y - 24 * s], [x - 44 * s, y - 18 * s]]);
}

const MOTIFS = {
  niebla(d) {
    sky(d, '#c4c8c4', '#e4e6e0');
    hills(d, 150, '#b8bcb0');
    encina(d, 90, 172, 1.3); encina(d, 280, 166, 1.0);
    for (let i = 0; i < 6; i++) d.washBlob(30 + i * 62, 120 + (i % 2) * 22, 70, 16, '#f4f4ee', { alpha: 0.55 });
    d.pen.set({ width: 1.1 });
    d.pen.path([[160, 190], [160, 150], [215, 150], [215, 190]], false);   // el piano tapado
    d.pen.curve([[150, 152], [188, 138], [226, 152]]);
  },
  averia(d) {
    sky(d, '#9aa4b0', '#d8dce0');
    hills(d, 170, '#b8b498');
    const { pen } = d;
    d.wash([[90, 200], [90, 120], [270, 120], [270, 200]], '#f2ece0', { alpha: 0.9 });
    pen.set({ width: 1.3 });
    pen.path([[90, 200], [90, 120], [270, 120], [270, 200]], false);
    // Tejado con un hueco
    pen.path([[80, 122], [150, 78], [175, 92]], false);
    pen.path([[205, 92], [210, 78], [280, 122]], false);
    d.wash([[80, 122], [150, 78], [175, 92], [205, 92], [210, 78], [280, 122]], '#b06a48', { alpha: 0.45 });
    pen.set({ width: 0.9 });
    for (let i = 0; i < 5; i++) pen.line(176 + i * 7, 96 + (i % 2) * 6, 180 + i * 7, 110 + (i % 3) * 4); // vigas rotas
    // Escalera apoyada
    pen.set({ width: 1 });
    pen.line(300, 200, 262, 104); pen.line(314, 200, 276, 104);
    for (let k = 1; k < 7; k++) { const t = k / 7; pen.line(300 - 38 * t, 200 - 96 * t, 314 - 38 * t, 200 - 96 * t); }
    pen.path([[150, 200], [150, 160], [178, 160], [178, 200]], false);
    rain(d, 30, 150, 40, 120, 100);
  },
  furgoneta(d) {
    hills(d, 150);
    const { pen } = d;
    d.wash([[80, 180], [80, 120], [210, 120], [250, 145], [270, 150], [270, 180]], '#e8e2d0', { alpha: 0.9 });
    pen.set({ width: 1.3 });
    pen.path([[80, 180], [80, 120], [210, 120], [250, 145], [270, 150], [270, 180], [80, 180]], false);
    pen.path([[212, 126], [244, 146], [212, 146]], true);
    for (const x of [118, 232]) { d.washBlob(x, 182, 15, 15, '#3a3a3a', { alpha: 0.6 }); pen.ellipse(x, 182, 15, 15); }
    for (let i = 0; i < 5; i++) d.washBlob(60 - i * 10, 170 - i * 14, 10 + i * 5, 8 + i * 4, '#8890a8', { alpha: 0.3 - i * 0.04 });
  },
  helada(d) {
    sky(d, '#c8d6e2', '#eef2f4');
    hills(d, 150, '#c6ccc8');
    encina(d, 120, 170, 1.6); encina(d, 260, 160, 1.2);
    d.ctx.fillStyle = 'rgba(255,255,255,0.35)'; d.ctx.fillRect(0, 0, d.w, d.h);
    d.pen.set({ width: 0.9, color: '#5a7a9a' });
    for (let i = 0; i < 9; i++) {
      const x = 20 + d.r() * 320, y = 20 + d.r() * 90, r = 5 + d.r() * 4;
      for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI; d.pen.line(x - Math.cos(a) * r, y - Math.sin(a) * r, x + Math.cos(a) * r, y + Math.sin(a) * r); }
    }
    d.pen.set({ color: INK });
  },
  calor(d) {
    sky(d, '#f0c070', '#f8e8c0');
    hills(d, 150, '#d8b870');
    sun(d, 270, 55, 24);
    encina(d, 100, 175, 1.3);
    d.pen.set({ width: 0.9, color: '#a07030' });
    for (let i = 0; i < 4; i++) d.pen.curve([[40 + i * 70, 130], [55 + i * 70, 120], [70 + i * 70, 130], [85 + i * 70, 120]]);
    d.pen.set({ color: INK });
  },
  tormenta(d) {
    sky(d, '#5a5a7a', '#a0a0b8');
    hills(d, 160);
    cloud(d, 180, 60, 1.6, '#5a5a6a', 0.6);
    d.pen.set({ width: 2.2, color: '#c08a20' });
    d.pen.path([[200, 80], [186, 112], [204, 112], [188, 150]], false);
    d.pen.set({ color: INK });
    rain(d, 80, 60, 70, 260, 120);
  },
  sequia(d) {
    sky(d, '#e8c890', '#f4e4c4');
    sun(d, 290, 50, 22);
    d.wash([[0, 120], [W, 110], [W, H], [0, H]], '#c8a060', { alpha: 0.45 });
    d.pen.set({ width: 1 });
    for (let i = 0; i < 14; i++) {
      const x = 20 + d.r() * 320, y = 130 + d.r() * 60;
      d.pen.path([[x, y], [x + 10 + d.r() * 10, y + d.r() * 8 - 4], [x + 18 + d.r() * 12, y + 6]], false);
      d.pen.line(x + 10, y, x + 8, y + 12);
    }
  },
  dana(d) {
    sky(d, '#4a5a6a', '#8a9aa8');
    cloud(d, 120, 50, 1.3, '#4a4a5a', 0.6); cloud(d, 260, 60, 1.1, '#4a4a5a', 0.6);
    rain(d, 140, 0, 60, W, 150);
    d.wash([[0, 160], [W, 150], [W, H], [0, H]], '#5d8fa6', { alpha: 0.5 });
    boulder(d, 90, 180, 30, 14); boulder(d, 140, 186, 24, 10);
  },
  viento(d) {
    sky(d, '#a8c0d0', '#e0e8ec');
    hills(d, 160);
    d.pen.set({ width: 1.1 });
    for (let i = 0; i < 6; i++) {
      const y = 30 + i * 20;
      d.pen.curve([[20 + i * 10, y], [100, y - 6], [180, y + 4], [240, y - 4], [270, y - 16], [255, y - 24], [245, y - 14]]);
    }
    eucalipto(d, 300, 200, 1.1);
  },
  fuego(d) {
    sky(d, '#d89060', '#f0d0a0');
    hills(d, 150, '#a89058');
    d.washBlob(250, 100, 60, 70, '#6a5a50', { alpha: 0.5 });
    d.washBlob(260, 50, 40, 40, '#8a7a70', { alpha: 0.35 });
    d.washBlob(250, 145, 34, 10, '#e05a20', { alpha: 0.6 });
    encina(d, 90, 180, 1.4);
    d.pen.set({ width: 1 });
    d.pen.curve([[240, 150], [230, 110], [260, 70], [250, 30]]);
  },
  jabali(d) {
    hills(d, 120);
    grassTufts(d, 10, 130, 340, 70, 50);
    boar(d, 170, 186, 1.6);
    encina(d, 60, 150, 1.0);
  },
  plaga(d) {
    const { pen } = d;
    const leaf = [[60, 110], [160, 40], [290, 60], [310, 110], [220, 170], [100, 160]];
    d.wash(leaf, d.P.foliage, { alpha: 0.6 });
    pen.set({ width: 1.4 });
    pen.curve(leaf, true);
    pen.line(70, 110, 300, 90);
    for (let i = 0; i < 8; i++) pen.line(100 + i * 25, 104 - i * 1.5, 120 + i * 25, 70 + (i % 2) * 70);
    for (let i = 0; i < 30; i++) pen.dot(90 + d.r() * 200, 70 + d.r() * 80, 2.2, '#5a8a3a', 0.9);
  },
  bellota(d) {
    const { pen, P } = d;
    pen.set({ width: 1.3 });
    pen.curve([[20, 40], [120, 60], [220, 50], [340, 70]]);
    for (let i = 0; i < 4; i++) {
      const x = 70 + i * 70, y = 60 + Math.sin(i) * 6;
      const leaf = canopyPts(x, y + 22, 18, 8, d.r, 6, 0.4);
      d.wash(leaf, P.oak, { alpha: 0.6 });
      pen.path(leaf, true);
      const ax = x + 20, ay = y + 52;
      d.washBlob(ax, ay, 9, 13, '#9a6a30', { alpha: 0.8 });
      pen.ellipse(ax, ay, 9, 13);
      d.washBlob(ax, ay - 12, 11, 6, '#6a5030', { alpha: 0.8 });
      pen.ellipse(ax, ay - 12, 11, 6);
      pen.hatch(blobPts(ax, ay - 12, 11, 6, d.r, 0.05, 12), { cross: true, gap: 2.5 });
    }
  },
  enjambre(d) {
    const { pen } = d;
    pen.set({ width: 1.4 });
    pen.curve([[10, 50], [120, 60], [250, 40], [350, 50]]);
    d.washBlob(180, 100, 40, 48, '#8a6a30', { alpha: 0.6 });
    pen.ellipse(180, 100, 40, 48, 0.2);
    for (let i = 0; i < 60; i++) {
      const a = d.r() * 6.28, rr = 40 + d.r() * 60;
      pen.dot(180 + Math.cos(a) * rr, 100 + Math.sin(a) * rr * 0.7, 1.6, '#c09020', 0.9);
    }
  },
  ciervos(d) {
    sky(d, '#d8905a', '#f0d098', 130);
    hills(d, 130, '#8a7a4a');
    d.wash(blobPts(180, 175, 150, 22, d.r, 0.08, 30), '#5d8fa6', { alpha: 0.6 });
    eucalipto(d, 310, 160, 1.2);
    d.ctx.save(); d.ctx.translate(140, 160); d.ctx.scale(2.2, 2.2); drawDeer(d.ctx, 0, 0, 1, true); d.ctx.restore();
    d.ctx.save(); d.ctx.translate(200, 156); d.ctx.scale(2, 2); drawDeer(d.ctx, 0, 0, 1, false); d.ctx.restore();
  },
  gato(d) {
    d.wash([[0, 150], [W, 145], [W, H], [0, H]], '#c9b490', { alpha: 0.4 });
    for (let i = 0; i < 40; i++) d.pen.ellipse(d.r() * W, 155 + d.r() * 50, 2 + d.r() * 2, 1.4, 0.3);
    catSketch(d, 160, 175, 2.2);
    d.washBlob(250, 180, 14, 5, '#f4ead2', { alpha: 0.9 });
    d.pen.rect(238, 172, 26, 12);
  },
  feria(d) {
    const { pen } = d;
    pen.set({ width: 1 });
    for (let k = 0; k < 2; k++) {
      const y0 = 40 + k * 40;
      pen.curve([[0, y0], [180, y0 + 30], [360, y0]]);
      for (let i = 0; i < 12; i++) {
        const x = 15 + i * 30, y = y0 + Math.sin((x / 360) * Math.PI) * 30;
        const flag = [[x - 8, y], [x + 8, y], [x, y + 16]];
        d.wash(flag, ['#c0392b', '#e8b040', '#3a7ab0', '#2e8b57'][(i + k) % 4], { alpha: 0.7 });
        pen.path(flag, true);
      }
    }
    for (const [x, c] of [[90, '#b03050'], [180, '#3060a0'], [270, '#a06020']]) person(d, x, 200, 1.4, false, c);
  },
  vecinos(d) {
    hills(d, 120);
    for (let i = 0; i < 5; i++) {
      const x = 50 + i * 62;
      person(d, x, 195 - (i % 2) * 6, 1.5, i % 2 === 0, ['#7a5a3a', '#a04030', '#406a90', '#6a8a3a', '#8a5aa0'][i]);
      d.pen.set({ width: 1.3 });
      d.pen.line(x + 10, 140, x + 18, 196 - (i % 2) * 6);
      d.pen.path([[x + 4, 140], [x + 16, 136]], false);
    }
  },
  papeles(d) { papers(d, 110, 70); },
  inspector(d) {
    papers(d, 190, 90);
    person(d, 110, 200, 2.2, true, '#4a4a5a');
  },
  influencer(d) {
    person(d, 150, 200, 2.2, false, '#d06090');
    d.pen.set({ width: 1.5 });
    d.pen.line(170, 120, 230, 50);
    d.wash([[222, 30], [246, 34], [242, 72], [218, 68]], '#2a2a2a', { alpha: 0.7 });
    d.pen.path([[222, 30], [246, 34], [242, 72], [218, 68]], true);
    for (let i = 0; i < 6; i++) d.pen.dot(260 + d.r() * 70, 30 + d.r() * 80, 3, '#e05a7a', 0.8);
  },
  forastero(d) {
    hills(d, 130);
    const { pen } = d;
    pen.set({ width: 1.3 });
    for (let x = 30; x < 160; x += 18) pen.line(x, 200, x, 140);
    pen.line(26, 150, 164, 150); pen.line(26, 180, 164, 180);
    person(d, 230, 200, 2.2, true, '#5a4a3a');
    notes(d, 270, 70, 4);
  },
  carta(d) { envelope(d, 80, 60, 140, 90); notes(d, 250, 80, 3, '#6e5440'); },
  voluntario(d) {
    hills(d, 140);
    person(d, 170, 200, 2.4, true, '#406a90');
    d.wash([[188, 120], [212, 116], [214, 160], [190, 164]], '#8a6a40', { alpha: 0.7 });
    d.pen.path([[188, 120], [212, 116], [214, 160], [190, 164]], true);
    adelfa(d, 300, 200, 1.6);
  },
  concierto(d) {
    sky(d, '#e0a060', '#f4dcb0', 130);
    piano(d, 120, 190, 1.4);
    notes(d, 70, 70, 6);
    for (let i = 0; i < 4; i++) person(d, 262 + i * 24, 205 - (i % 2) * 6, 1.5, i % 2 === 1, ['#a04030', '#406a90', '#6a8a3a', '#8a5aa0'][i]);
  },
  revelacion(d) {
    sky(d, '#d8805a', '#f4d8a8', 140);
    hills(d, 140, '#8a7a4a');
    piano(d, 70, 196, 1.2);
    notes(d, 60, 60, 7, '#3b2a1c');
    d.ctx.save(); d.ctx.translate(250, 186); d.ctx.scale(2, 2); drawDeer(d.ctx, 0, 0, -1, true); d.ctx.restore();
    catSketch(d, 200, 205, 1.1);
  },
};

export function drawIllus(canvas, key, season = 2) {
  const { ctx, d } = setup(canvas, key, season);
  try { (MOTIFS[key] || MOTIFS.carta)(d); } catch (e) { console.error('Ilustración', key, e); }
  vignetteMask(ctx, W, H, hashStr(key));
}

// ── Iconos de los recuerdos ──
const ICONS = {
  partitura(d) {
    const { pen } = d;
    d.wash([[14, 10], [86, 14], [82, 92], [10, 88]], '#f6efdc', { alpha: 0.95 });
    pen.set({ width: 1.1 });
    pen.path([[14, 10], [86, 14], [82, 92], [10, 88]], true);
    pen.set({ width: 0.5, double: false });
    for (let s = 0; s < 3; s++) for (let k = 0; k < 5; k++) pen.line(18, 24 + s * 22 + k * 3, 80, 25 + s * 22 + k * 3);
    for (let i = 0; i < 7; i++) pen.dot(24 + i * 8, 28 + (i % 3) * 3 + Math.floor(i / 3) * 22, 2.2, INK);
    pen.set({ double: true });
  },
  disco(d) {
    const { pen } = d;
    d.washBlob(50, 50, 38, 38, '#2a2420', { alpha: 0.85, irregular: 0.02 });
    pen.set({ width: 1.2 });
    pen.ellipse(50, 50, 38, 38, 0.02);
    pen.set({ width: 0.5 });
    for (let r = 14; r < 36; r += 4) pen.ellipse(50, 50, r, r, 0.02);
    d.washBlob(50, 50, 11, 11, '#f4ead2', { alpha: 0.95, irregular: 0.02 });
    pen.dot(50, 50, 1.6);
  },
  diario(d) {
    const { pen } = d;
    d.wash([[20, 12], [80, 12], [80, 90], [20, 90]], '#3a5a8a', { alpha: 0.75 });
    pen.set({ width: 1.3 });
    pen.rect(20, 12, 60, 78);
    pen.line(28, 12, 28, 90);
    pen.rect(40, 30, 30, 14);
  },
  llave(d) {
    const { pen } = d;
    pen.set({ width: 2.2, color: '#4a3a2a' });
    pen.ellipse(28, 50, 13, 13, 0.05);
    pen.line(41, 50, 88, 50);
    pen.line(76, 50, 76, 62); pen.line(84, 50, 84, 60);
    pen.set({ color: INK });
  },
  reloj(d) {
    const { pen } = d;
    d.washBlob(50, 54, 30, 30, '#c9a040', { alpha: 0.6, irregular: 0.02 });
    pen.set({ width: 1.4 });
    pen.ellipse(50, 54, 30, 30, 0.02);
    pen.ellipse(50, 54, 25, 25, 0.02);
    pen.line(50, 54, 50, 36); pen.line(50, 54, 62, 58);
    pen.ellipse(50, 20, 5, 4);
    d.ctx.fillStyle = rgba(INK, 0.8); d.ctx.font = '700 16px Caveat, cursive'; d.ctx.fillText('M', 45, 76);
  },
  carta(d) { envelope(d, 12, 22, 76, 54); },
  cuaderno(d) {
    const { pen } = d;
    d.wash([[18, 14], [82, 14], [82, 88], [18, 88]], '#8a5a3a', { alpha: 0.6 });
    pen.set({ width: 1.2 });
    pen.rect(18, 14, 64, 74);
    pen.set({ width: 0.5, double: false });
    for (let k = 0; k < 7; k++) pen.line(26, 26 + k * 8, 74, 26 + k * 8);
    pen.set({ double: true });
  },
  foto(d) {
    const { pen } = d;
    d.wash([[14, 16], [86, 18], [84, 86], [12, 84]], '#f4ecdc', { alpha: 0.95 });
    pen.set({ width: 1.1 });
    pen.path([[14, 16], [86, 18], [84, 86], [12, 84]], true);
    d.wash([[20, 22], [80, 24], [78, 70], [18, 68]], '#9a8a70', { alpha: 0.55 });
    person(d, 40, 66, 0.8, true, '#5a4a3a');
    person(d, 60, 66, 0.8, false, '#6a5a4a');
  },
  firma(d) {
    const { pen } = d;
    d.wash([[8, 20], [92, 20], [92, 80], [8, 80]], '#a07040', { alpha: 0.45 });
    pen.set({ width: 1.3 });
    pen.rect(8, 20, 84, 60);
    d.ctx.fillStyle = rgba('#3b2a1c', 0.9);
    d.ctx.font = 'italic 700 24px Caveat, cursive';
    d.ctx.fillText('Transi', 26, 64);
  },
  caja(d) {
    const { pen } = d;
    d.wash([[10, 30], [90, 30], [90, 80], [10, 80]], '#7a5a3a', { alpha: 0.6 });
    pen.set({ width: 1.2 });
    pen.rect(10, 30, 80, 50);
    const cols = ['#c0392b', '#e8b040', '#3a7ab0', '#2e8b57', '#a06aa0', '#c98a40'];
    cols.forEach((c, i) => { d.washBlob(22 + (i % 3) * 26, 46 + Math.floor(i / 3) * 20, 9, 6, c, { alpha: 0.8 }); pen.rect(13 + (i % 3) * 26, 40 + Math.floor(i / 3) * 20, 18, 12); });
  },
  boceto(d) {
    const { pen } = d;
    d.wash([[10, 14], [90, 16], [88, 86], [8, 84]], '#f6efdc', { alpha: 0.95 });
    pen.set({ width: 1 });
    pen.path([[10, 14], [90, 16], [88, 86], [8, 84]], true);
    d.ctx.save(); d.ctx.translate(40, 70); d.ctx.scale(1.1, 1.1); drawDeer(d.ctx, 0, 0, 1, true); d.ctx.restore();
    pen.set({ width: 0.5, double: false });
    for (let k = 0; k < 5; k++) pen.line(14, 22 + k * 2.5, 60, 22 + k * 2.5);
    pen.set({ double: true });
  },
  receta(d) {
    const { pen } = d;
    d.wash([[16, 10], [84, 12], [82, 90], [14, 88]], '#f6efdc', { alpha: 0.95 });
    pen.set({ width: 1 });
    pen.path([[16, 10], [84, 12], [82, 90], [14, 88]], true);
    pen.set({ width: 0.6, double: false });
    for (let k = 0; k < 7; k++) pen.line(22, 22 + k * 9, 74 - (k % 3) * 8, 22 + k * 9);
    pen.set({ double: true });
    d.washBlob(66, 74, 9, 8, '#d09030', { alpha: 0.6 });
  },
  panuelo(d) {
    const { pen } = d;
    const pts = [[14, 20], [86, 16], [82, 84], [18, 88]];
    d.wash(pts, '#e8c8c8', { alpha: 0.7 });
    pen.set({ width: 1 });
    pen.path(pts, true);
    pen.set({ width: 0.6, double: false });
    pen.path([[20, 26], [80, 22], [76, 78], [24, 82]], true);
    d.ctx.fillStyle = rgba('#7a3a4a', 0.8); d.ctx.font = '700 18px Caveat, cursive'; d.ctx.fillText('E. ♪', 36, 60);
    pen.set({ double: true });
  },
};

export function drawIcon(canvas, key, size = 64) {
  const { ctx, d } = setup(canvas, 'icon-' + key, 2, 100, 100);
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';
  try { (ICONS[key] || ICONS.carta)(d); } catch (e) { console.error('Icono', key, e); }
}

// ── Portada: el cortijo con el pino y el pueblo ──
export function drawTitleArt(canvas, w, h, season = 2) {
  const { ctx, d } = setup(canvas, 'portada', season, w, h);
  const s = Math.min(w / 700, h / 400);
  ctx.save();
  ctx.translate((w - 700 * s) / 2, (h - 400 * s) / 2);
  ctx.scale(s, s);
  d.w = 700; d.h = 400;
  sky(d, d.P.sky, '#f4ead2', 260);
  // Pueblo blanco en lo alto de su colina, al fondo
  ctx.save();
  ctx.translate(250, 108);
  const dv = { ...d, w: 420, h: 130 };
  village(dv);
  ctx.restore();
  hills(d, 230, d.P.grass);
  // Muro de piedra y encinas
  for (let i = 0; i < 6; i++) encina(d, 60 + i * 110 + d.r() * 30, 280 + d.r() * 20, 1 + d.r() * 0.4);
  boulder(d, 600, 330, 40, 24); boulder(d, 640, 345, 26, 16);
  pino(d, 560, 330, 1.6);
  mimosa(d, 120, 360, 1.4);
  yuca(d, 210, 380, 1.4);
  lavanda(d, 470, 380, 1.4);
  adelfa(d, 400, 385, 1.3);
  ctx.restore();
  vignetteMask(ctx, w, h, 9);
}

export { W as ILLUS_W, H as ILLUS_H };
