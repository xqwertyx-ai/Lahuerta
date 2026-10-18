// El plano de la finca: capas cacheadas (papel, terreno, zonas) y elementos vivos
// (gato, animales, voluntarios, clima, luz). Lo estático solo se redibuja cuando cambia.
import { ZONES, ZONE_BY_ID, DECOR } from '../data/zones.js';
import { Pen, wash, blobPts, rgba, mix, INK, PENCIL, canopyPts } from './ink.js';
import { makeRng, hashStr } from './noise.js';
import { makePaper, makeCanvas } from './paper.js';
import { palette, timeTint } from './palette.js';
import { SKETCHES, village, compass, encina as encinaFree, arbusto as matorral } from './sketches.js';
import { Cat } from './cat.js';
import { drawHen, drawSheep, drawPig, drawFigure, drawDeer, drawBee } from './critters.js';

export const WORLD = { w: 1600, h: 1000 };
const PAD = 46;

const LABELS = {
  cortijo: [775, 534], patio: [770, 968], paseo: [1160, 760], almacen: [1475, 680], huerta: [330, 582],
  bosquete: [290, 818], dehesa: [250, 140], muros: [640, 462], alberca: [940, 184], colmenar: [1205, 134],
  corral: [1445, 140], piano: [1195, 424],
};

function drawCtx(ctx, seed, P, w, h) {
  const r = makeRng(seed);
  const pen = new Pen(ctx, seed + 1);
  return { pen, r, P, w, h, ctx };
}

// d con capas separadas de tinta y acuarela
function layeredCtx(inkCtx, washCtx, seed, P, w, h) {
  const r = makeRng(seed);
  const pen = new Pen(inkCtx, seed + 1);
  return {
    pen, r, P, w, h,
    wash: (pts, color, o) => wash(washCtx, pts, color, r, o),
    washBlob: (cx, cy, rx, ry, color, o = {}) => wash(washCtx, blobPts(cx, cy, rx, ry, r, o.irregular ?? 0.14, 24), color, r, o),
  };
}

// Mismo d pero todo en un único contexto (ilustraciones, título)
export function singleCtx(ctx, seed, P, w, h) {
  const d = drawCtx(ctx, seed, P, w, h);
  d.wash = (pts, color, o) => wash(ctx, pts, color, d.r, o);
  d.washBlob = (cx, cy, rx, ry, color, o = {}) => wash(ctx, blobPts(cx, cy, rx, ry, d.r, o.irregular ?? 0.14, 24), color, d.r, o);
  return d;
}

export class FarmMap {
  constructor() {
    this.scale = 1;
    this.season = -1;
    this.zl = {};        // capas por zona
    this.bg = null;      // papel + terreno + decorado
    this.static = null;  // bg + zonas compuestas
    this.dirty = true;
    this.cat = new Cat();
    this.effects = [];   // textos flotantes, trabajadores…
    this.selected = null;
    this.time = 0;
    this.labelFont = '"Caveat", "Segoe Print", cursive';
  }

  // Reconstruye todas las capas (al empezar, al cambiar de estación o de escala)
  build(season, scale) {
    this.season = season;
    this.scale = scale;
    const P = palette(season);
    this.P = P;
    const S = scale;
    // Fondo
    const bg = makeCanvas(WORLD.w * S, WORLD.h * S);
    const g = bg.getContext('2d');
    const paper = makePaper(bg.width, bg.height, { seed: 11, tone: P.paper, scale: S });
    g.drawImage(paper, 0, 0);
    g.setTransform(S, 0, 0, S, 0, 0);
    this._terrain(g, P);
    this.bg = bg;
    // Zonas: tinta y acuarela por separado
    for (const z of ZONES) {
      const w = (z.w + PAD * 2) * S, h = (z.h + PAD * 2) * S;
      const ink = makeCanvas(w, h), wsh = makeCanvas(w, h), comp = makeCanvas(w, h);
      const ic = ink.getContext('2d'), wc = wsh.getContext('2d');
      ic.setTransform(S, 0, 0, S, PAD * S, PAD * S);
      wc.setTransform(S, 0, 0, S, PAD * S, PAD * S);
      const d = layeredCtx(ic, wc, hashStr(z.id), P, z.w, z.h);
      try { SKETCHES[z.id]?.(d); } catch (e) { console.error('Boceto', z.id, e); }
      this.zl[z.id] = { ink, wash: wsh, comp, key: '' };
    }
    this.dirty = true;
  }

  _terrain(g, P) {
    const r = makeRng(31);
    const d = singleCtx(g, 31, P, WORLD.w, WORLD.h);
    // Manchas generales de pasto y tierra
    d.wash(blobPts(800, 560, 760, 420, r, 0.05, 50), P.grass, { alpha: 0.12, spread: 10, edge: 0.05, grain: 0.0008 });
    d.wash(blobPts(960, 790, 360, 150, r, 0.1, 30), P.ground, { alpha: 0.14, spread: 6, edge: 0.05, grain: 0 });
    // Arroyo que baja del pueblo a la alberca
    const creek = [[860, 120], [900, 150], [905, 190], [930, 230]];
    const pen = d.pen;
    pen.set({ width: 1.1, color: '#4b6a80' });
    pen.curve(creek);
    pen.curve(creek.map(([x, y]) => [x + 6, y + 2]));
    pen.set({ color: INK });
    // Caminos de tierra (doble línea punteada)
    const roads = [
      [[930, 770], [960, 700], [1000, 640], [1060, 600], [1180, 640], [1300, 560], [1330, 440], [1420, 300], [1480, 160], [1500, 90], [1540, 40]],
      [[905, 600], [915, 520], [920, 450], [935, 395]],
      [[640, 680], [590, 660], [560, 600], [470, 560], [332, 530], [310, 470]],
      [[930, 820], [1150, 830], [1380, 800]],
      [[600, 860], [480, 900], [420, 905]],
      [[1060, 560], [1120, 470], [1180, 330], [1200, 300]],
    ];
    for (const road of roads) {
      d.wash([...road.map(([x, y]) => [x - 5, y]), ...road.slice().reverse().map(([x, y]) => [x + 5, y])], P.path, { alpha: 0.25, edge: 0, grain: 0, spread: 2 });
      pen.set({ width: 0.8, double: false, alpha: 0.7 });
      pen.curve(road.map(([x, y]) => [x - 5, y]));
      pen.curve(road.map(([x, y]) => [x + 5, y]));
    }
    pen.set({ width: 1.4, double: true, alpha: 1 });
    // Árboles y matas sueltas en los huecos del plano
    const loose = [[1010, 470, 'e', 0.8], [1080, 360, 'e', 0.7], [990, 560, 'a', 1], [620, 470, 'a', 0.9], [1340, 560, 'e', 0.9],
      [1350, 650, 'a', 1], [1270, 360, 'e', 0.75], [590, 760, 'a', 0.8], [960, 940, 'a', 0.9], [1150, 950, 'e', 0.7], [1240, 900, 'a', 1],
      [560, 990, 'a', 0.8], [1250, 300, 'a', 0.8], [800, 410, 'e', 0.7], [1050, 120, 'e', 0.6], [520, 400, 'a', 0.6]];
    for (const [x, y, k, s] of loose) {
      if (k === 'e') encinaFree(d, x, y, s); else matorral(d, x, y, s);
    }
    // El pueblo en lo alto
    g.save();
    g.translate(DECOR.village.x, DECOR.village.y);
    const dv = singleCtx(g, 77, P, DECOR.village.w, DECOR.village.h);
    village(dv);
    g.restore();
    // Rosa de los vientos y cartela
    compass(d, 1520, 945, 1);
    this._cartouche(g, d, P);
    // Escala
    pen.set({ width: 1 });
    pen.line(1290, 975, 1430, 975);
    for (let i = 0; i <= 4; i++) pen.line(1290 + i * 35, 971, 1290 + i * 35, 979);
    g.fillStyle = rgba(INK, 0.8);
    g.font = `16px ${this.labelFont}`;
    g.fillText('100 pasos', 1325, 966);
  }

  _cartouche(g, d, P) {
    const x = 40, y = 26, w = 380, h = 96;
    const pts = [[x, y], [x + w, y + 4], [x + w - 6, y + h], [x + 4, y + h - 3]];
    d.wash(pts, '#f4ead2', { alpha: 0.7, edge: 0.2 });
    d.pen.set({ width: 1.3 });
    d.pen.path(pts, true);
    d.pen.set({ width: 0.7 });
    d.pen.path([[x + 6, y + 6], [x + w - 6, y + 9], [x + w - 11, y + h - 6], [x + 9, y + h - 8]], true);
    g.fillStyle = rgba(INK, 0.92);
    g.font = `700 44px ${this.labelFont}`;
    g.fillText('La Huerta del Pianista', x + 18, y + 50);
    g.font = `20px ${this.labelFont}`;
    g.fillStyle = rgba(INK, 0.7);
    g.fillText('Ojuelos Bajos · Fuente Obejuna · plano de la finca', x + 22, y + 80);
  }

  // ¿Ha cambiado algo que obligue a recomponer una zona?
  sync(s) {
    for (const z of ZONES) {
      const st = s.zones[z.id];
      const key = st.unlocked ? `u${Math.round(st.cons / 4)}w${st.weeds == null ? '-' : Math.round(st.weeds / 10)}` : 'locked';
      const L = this.zl[z.id];
      if (L && L.key !== key) {
        L.key = key;
        this._compose(z, st);
        this.dirty = true;
      }
    }
    if (this.dirty) this._composeStatic(s);
  }

  _compose(z, st) {
    const L = this.zl[z.id];
    const c = L.comp.getContext('2d');
    const S = this.scale;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, L.comp.width, L.comp.height);
    if (!st.unlocked) {
      // Borrado: apenas un rastro de lápiz
      c.globalAlpha = 0.13;
      c.drawImage(L.ink, 0, 0);
      c.globalAlpha = 1;
      return;
    }
    const q = Math.max(0, Math.min(1, st.cons / 100));
    // Acuarela: se apaga y vira a sepia
    c.globalAlpha = 0.12 + 0.88 * Math.pow(q, 1.15);
    c.drawImage(L.wash, 0, 0);
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-atop';
    c.fillStyle = rgba('#b39a76', (1 - q) * 0.65);
    c.fillRect(0, 0, L.comp.width, L.comp.height);
    // Tinta: se destiñe
    c.globalCompositeOperation = 'source-over';
    c.globalAlpha = 0.26 + 0.74 * q;
    c.drawImage(L.ink, 0, 0);
    c.globalAlpha = 1;
    // Goma de borrar: frotones sobre lo descuidado
    const r = makeRng(hashStr(z.id) + 5);
    const n = Math.round((1 - q) * (1 - q) * 46);
    c.globalCompositeOperation = 'destination-out';
    c.setTransform(S, 0, 0, S, PAD * S, PAD * S);
    for (let i = 0; i < 46; i++) {
      const x = r() * z.w, y = r() * z.h, len = 20 + r() * 50, ang = -0.4 + r() * 0.8, wd = 8 + r() * 14;
      if (i >= n) continue;
      c.strokeStyle = `rgba(0,0,0,${0.25 + (1 - q) * 0.45})`;
      c.lineWidth = wd;
      c.lineCap = 'round';
      c.beginPath();
      for (let k = 0; k <= 6; k++) {
        const t = k / 6;
        const px = x + Math.cos(ang) * len * t, py = y + Math.sin(ang) * len * t + Math.sin(t * 9) * 3;
        k ? c.lineTo(px, py) : c.moveTo(px, py);
      }
      c.stroke();
    }
    c.globalCompositeOperation = 'source-over';
    // Maleza: matojos que invaden
    if (st.weeds != null && st.weeds > 20) {
      const pen = new Pen(c, hashStr(z.id) + 9);
      pen.set({ width: 0.8, double: false, color: '#5a5a2a', alpha: 0.8 });
      const rw = makeRng(hashStr(z.id) + 13);
      const count = Math.round((st.weeds - 20) / 80 * (z.w * z.h) / 1500);
      for (let i = 0; i < count; i++) {
        const x = rw() * z.w, y = rw() * z.h;
        for (let k = 0; k < 4; k++) {
          const a = -Math.PI / 2 + (rw() - 0.5) * 1.6;
          const L2 = 5 + rw() * 8;
          pen.line(x, y, x + Math.cos(a) * L2, y + Math.sin(a) * L2);
        }
      }
    }
    c.setTransform(1, 0, 0, 1, 0, 0);
  }

  _composeStatic(s) {
    const S = this.scale;
    if (!this.static || this.static.width !== this.bg.width || this.static.height !== this.bg.height) {
      this.static = makeCanvas(this.bg.width, this.bg.height);
    }
    const g = this.static.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(this.bg, 0, 0);
    // De arriba abajo, para que lo de delante tape lo de detrás
    const order = [...ZONES].sort((a, b) => (a.y + a.h) - (b.y + b.h));
    for (const z of order) {
      const L = this.zl[z.id];
      g.drawImage(L.comp, (z.x - PAD) * S, (z.y - PAD) * S);
    }
    // Rótulos
    g.setTransform(S, 0, 0, S, 0, 0);
    g.textAlign = 'center';
    for (const z of ZONES) {
      const st = s.zones[z.id];
      const [lx, ly] = LABELS[z.id];
      const q = st.unlocked ? st.cons / 100 : 0;
      g.font = `700 22px ${this.labelFont}`;
      g.fillStyle = st.unlocked ? rgba(INK, 0.55 + 0.4 * q) : rgba(PENCIL, 0.75);
      g.fillText(z.name, lx, ly);
      if (!st.unlocked) {
        g.font = `17px ${this.labelFont}`;
        g.fillText('borrado · tócalo para recuperarlo', lx, ly + 18);
        // Contorno a lápiz discontinuo
        g.save();
        g.setLineDash([6, 7]);
        g.strokeStyle = rgba(PENCIL, 0.55);
        g.lineWidth = 1.2;
        const pts = blobPts(z.x + z.w / 2, z.y + z.h / 2, z.w / 2, z.h / 2, makeRng(hashStr(z.id)), 0.05, 30);
        g.beginPath();
        pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
        g.closePath();
        g.stroke();
        g.restore();
      }
    }
    g.textAlign = 'left';
    g.setTransform(1, 0, 0, 1, 0, 0);
    this.dirty = false;
  }

  hitTest(wx, wy) {
    let best = null, bestArea = Infinity;
    for (const z of ZONES) {
      const m = 6;
      if (wx >= z.x - m && wx <= z.x + z.w + m && wy >= z.y - m && wy <= z.y + z.h + m) {
        const a = z.w * z.h;
        if (a < bestArea) { best = z.id; bestArea = a; }
      }
    }
    return best;
  }

  // Efectos de trabajo: figurita trabajando y texto flotante
  addWork(zoneId, text, skilled) {
    const z = ZONE_BY_ID[zoneId];
    if (!z) return;
    this.effects.push({ kind: 'work', x: z.x + z.w * (0.3 + Math.random() * 0.4), y: z.y + z.h * (0.55 + Math.random() * 0.3), t: 0, life: 4, text, skilled });
    this.cat.notice(z.x + z.w / 2, z.y + z.h * 0.8);
  }

  addFloat(x, y, text, color = INK) {
    this.effects.push({ kind: 'float', x, y, t: 0, life: 2.6, text, color });
  }

  // ── Dibujo por fotograma ──
  draw(ctx, cam, s, dt) {
    this.time += dt;
    const S = this.scale;
    ctx.save();
    ctx.setTransform(cam.dpr * cam.zoom, 0, 0, cam.dpr * cam.zoom, -cam.x * cam.dpr * cam.zoom, -cam.y * cam.dpr * cam.zoom);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.static, 0, 0, this.static.width / S, this.static.height / S);
    this._live(ctx, s, dt);
    this._light(ctx, s);
    this._weather(ctx, s, dt);
    this._selection(ctx);
    this._effects(ctx, dt);
    ctx.restore();
  }

  _live(ctx, s, dt) {
    const T = this.time;
    const hour = s.hour;
    const day = hour > 7 && hour < 20.5;
    // Gallinas y ovejas en el corral
    const corral = ZONE_BY_ID.corral;
    if (s.zones.corral.unlocked) {
      const hens = Math.min(10, s.animals.gallinas);
      for (let i = 0; i < hens; i++) {
        const r = makeRng(100 + i);
        const bx = corral.x + 40 + r() * (corral.w - 80), by = corral.y + 140 + r() * 110;
        const wob = day ? Math.sin(T * (0.5 + r()) + i) * 8 : 0;
        drawHen(ctx, bx + wob, by, (Math.sin(T * 3 + i * 7) > 0.6 && day) ? 1 : 0, Math.cos(T * 0.5 + i) > 0 ? 1 : -1);
      }
      const sheep = Math.min(8, s.animals.ovejas);
      for (let i = 0; i < sheep; i++) {
        const r = makeRng(200 + i);
        const bx = corral.x + 110 + r() * 100, by = corral.y + 180 + r() * 60;
        drawSheep(ctx, bx + Math.sin(T * 0.2 + i) * 6, by, Math.sin(T * 0.3 + i) > 0 ? 1 : -1);
      }
    }
    // Cerdos de montanera bajo las encinas
    if (s.animals.cerdos > 0) {
      const dz = ZONE_BY_ID.dehesa;
      for (let i = 0; i < Math.min(8, s.animals.cerdos); i++) {
        const r = makeRng(300 + i);
        const bx = dz.x + 80 + r() * 480 + Math.sin(T * 0.15 + i) * 30, by = dz.y + 120 + r() * 180;
        drawPig(ctx, bx, by, Math.cos(T * 0.15 + i) > 0 ? 1 : -1, 0.8 + s.montanera * 0.5);
      }
    }
    // Abejas
    if (s.zones.colmenar.unlocked && s.animals.colmenas > 0 && day) {
      const cz = ZONE_BY_ID.colmenar;
      for (let i = 0; i < 6 + s.animals.colmenas * 2; i++) {
        const a = T * (1 + (i % 3) * 0.4) + i * 2.1;
        drawBee(ctx, cz.x + 100 + Math.cos(a) * (30 + i * 3), cz.y + 90 + Math.sin(a * 1.3) * (20 + i * 2));
      }
    }
    // Ciervos en la alberca al atardecer
    if (s.zones.alberca.unlocked && hour >= 18.4 && hour <= 21 && (s.day % 3 === 0 || s.zones.alberca.cons > 70)) {
      const az = ZONE_BY_ID.alberca;
      const fade = Math.min(1, (hour - 18.4) * 2, (21 - hour) * 2);
      ctx.globalAlpha = Math.max(0, fade);
      drawDeer(ctx, az.x + 70, az.y + 120, 1, true);
      drawDeer(ctx, az.x + 100, az.y + 114, 1, false);
      ctx.globalAlpha = 1;
    }
    // Voluntarios en su zona (o cerca del cortijo)
    s.volunteers.forEach((v, i) => {
      const z = v.zone ? ZONE_BY_ID[v.zone] : ZONE_BY_ID.patio;
      const r = makeRng(hashStr(v.id));
      let x = z.x + z.w * (0.2 + r() * 0.6), y = z.y + z.h * (0.5 + r() * 0.4);
      const working = v.zone && day;
      if (!day) { x = ZONE_BY_ID.cortijo.x + 100 + i * 12; y = ZONE_BY_ID.cortijo.y + 214; }
      drawFigure(ctx, x, y, { hat: r() < 0.5, color: ['#a04030', '#406a90', '#6a8a3a', '#8a5aa0'][hashStr(v.id) % 4], work: working ? T * 4 + i : null, scale: 1 });
      if (this.showNames) {
        ctx.font = `14px ${this.labelFont}`;
        ctx.fillStyle = rgba(INK, 0.8);
        ctx.textAlign = 'center';
        ctx.fillText(v.id.charAt(0).toUpperCase() + v.id.slice(1), x, y + 14);
        ctx.textAlign = 'left';
      }
    });
    // El gato
    this.cat.update(dt, s);
    this.cat.draw(ctx);
    // Humo de chimenea en otoño e invierno
    if (this.season >= 2 || hour < 8 || hour > 19) {
      const cx = ZONE_BY_ID.cortijo.x + 156, cy = ZONE_BY_ID.cortijo.y + 24;
      for (let i = 0; i < 5; i++) {
        const t = ((T * 0.25 + i / 5) % 1);
        ctx.fillStyle = rgba('#8a8070', 0.22 * (1 - t));
        ctx.beginPath();
        ctx.arc(cx + Math.sin(t * 4 + i) * 6 + t * 14, cy - t * 50, 3 + t * 9, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  _light(ctx, s) {
    const tint = timeTint(s.hour, this.season);
    if (tint.alpha > 0.01) {
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = rgba(tint.color, Math.min(0.85, tint.alpha * 1.4));
      ctx.fillRect(-200, -200, WORLD.w + 400, WORLD.h + 400);
      ctx.restore();
    }
    // Luces de noche: ventanas del cortijo, farola y pueblo
    if (s.hour > 19.8 || s.hour < 6.8) {
      const k = s.hour > 19.8 ? Math.min(1, (s.hour - 19.8) / 1.2) : Math.min(1, (6.8 - s.hour) / 1);
      const lights = [[755, 657, 16], [757, 682, 10], [898, 744 - 70, 14]];
      if (s.zones.cortijo.cons > 30) lights.push([737, 617, 12]);
      const vx = DECOR.village.x, vy = DECOR.village.y;
      const r = makeRng(55);
      for (let i = 0; i < 14; i++) lights.push([vx + 90 + r() * 500, vy + 50 + r() * 40, 5]);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const [x, y, rad] of lights) {
        const g = ctx.createRadialGradient(x, y, 0, x, y, rad * 2.2);
        g.addColorStop(0, `rgba(255,200,110,${0.5 * k})`);
        g.addColorStop(1, 'rgba(255,200,110,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - rad * 2.2, y - rad * 2.2, rad * 4.4, rad * 4.4);
      }
      // Luciérnagas en verano y estrellas sobre el pueblo
      const T = this.time;
      if (this.season === 1 || this.season === 0) {
        for (let i = 0; i < 18; i++) {
          const a = T * 0.3 + i * 1.7;
          const x = 200 + (i * 83) % 1200 + Math.sin(a) * 20, y = 300 + (i * 131) % 600 + Math.cos(a * 1.3) * 14;
          const on = (Math.sin(T * 2 + i * 3) + 1) / 2;
          ctx.fillStyle = `rgba(230,255,140,${0.6 * on * k})`;
          ctx.beginPath(); ctx.arc(x, y, 1.8, 0, 6.28); ctx.fill();
        }
      }
      for (let i = 0; i < 40; i++) {
        const rr = makeRng(900 + i);
        const x = 450 + rr() * 1100, y = 6 + rr() * 60;
        const tw = 0.5 + 0.5 * Math.sin(T * (1 + rr() * 2) + i);
        ctx.fillStyle = `rgba(255,250,220,${0.55 * tw * k})`;
        ctx.fillRect(x, y, 1.6, 1.6);
      }
      ctx.restore();
    }
  }

  _weather(ctx, s, dt) {
    const T = this.time;
    const w = s.weather;
    if (w === 'lluvia' || w === 'tormenta') {
      const n = w === 'tormenta' ? 260 : 150;
      ctx.strokeStyle = rgba('#4a5a78', 0.35);
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const x = ((i * 97.3) % WORLD.w + T * 60) % WORLD.w;
        const y = ((i * 53.7) % WORLD.h + T * 520 * (0.8 + (i % 5) * 0.08)) % WORLD.h;
        ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 14);
      }
      ctx.stroke();
      if (w === 'tormenta' && Math.sin(T * 0.7) > 0.995) {
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(0, 0, WORLD.w, WORLD.h);
      }
    }
    if (w === 'niebla') {
      for (let i = 0; i < 6; i++) {
        const y = 200 + i * 130, x = ((T * 8 + i * 300) % (WORLD.w + 600)) - 300;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 380);
        g.addColorStop(0, 'rgba(245,242,235,0.42)');
        g.addColorStop(1, 'rgba(245,242,235,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - 380, y - 380, 760, 760);
      }
    }
    if (w === 'helada') {
      ctx.fillStyle = 'rgba(225,235,245,0.18)';
      ctx.fillRect(0, 0, WORLD.w, WORLD.h);
      for (let i = 0; i < 80; i++) {
        const x = (i * 211) % WORLD.w, y = (i * 137) % WORLD.h;
        const tw = Math.sin(T * 2 + i) > 0.7 ? 0.8 : 0.2;
        ctx.fillStyle = `rgba(255,255,255,${tw})`;
        ctx.fillRect(x, y, 2, 2);
      }
    }
    if (w === 'viento' || (this.season === 2 && w !== 'lluvia')) {
      // Hojas que vuelan
      const n = w === 'viento' ? 30 : 12;
      for (let i = 0; i < n; i++) {
        const sp = w === 'viento' ? 90 : 25;
        const x = ((i * 173) % WORLD.w + T * sp * (1 + (i % 3) * 0.3)) % WORLD.w;
        const y = ((i * 89) % WORLD.h + T * 18 + Math.sin(T + i) * 20) % WORLD.h;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(T * 2 + i);
        ctx.fillStyle = rgba(['#b0802a', '#9a5a20', '#c9a040'][i % 3], 0.75);
        ctx.beginPath();
        ctx.ellipse(0, 0, 4, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    if (w === 'calor') {
      ctx.fillStyle = `rgba(255,220,150,${0.06 + 0.03 * Math.sin(T * 2)})`;
      ctx.fillRect(0, 0, WORLD.w, WORLD.h);
    }
  }

  _selection(ctx) {
    if (!this.selected) return;
    const z = ZONE_BY_ID[this.selected];
    const pts = this._selPts && this._selPts.id === z.id ? this._selPts.pts : (this._selPts = { id: z.id, pts: blobPts(z.x + z.w / 2, z.y + z.h / 2, z.w / 2 + 14, z.h / 2 + 12, makeRng(hashStr(z.id) + 2), 0.04, 40) }).pts;
    const t = this.time;
    ctx.save();
    ctx.strokeStyle = rgba('#a0382a', 0.65 + 0.2 * Math.sin(t * 3));
    ctx.lineWidth = 2.2;
    ctx.setLineDash([10, 6]);
    ctx.lineDashOffset = -t * 20;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  _effects(ctx, dt) {
    const keep = [];
    for (const e of this.effects) {
      e.t += dt;
      if (e.t > e.life) continue;
      keep.push(e);
      const a = Math.min(1, (e.life - e.t) / 0.6, e.t / 0.2);
      if (e.kind === 'work') {
        ctx.globalAlpha = a;
        drawFigure(ctx, e.x, e.y, { hat: true, color: e.skilled ? '#406a90' : '#7a5a3a', work: e.t * 6, scale: 1.1 });
        ctx.globalAlpha = 1;
        // Chispas de tinta
        for (let i = 0; i < 3; i++) {
          const k = (e.t * 2 + i / 3) % 1;
          ctx.fillStyle = rgba(INK, 0.5 * (1 - k) * a);
          ctx.beginPath();
          ctx.arc(e.x + 10 + Math.sin(i * 2 + e.t * 3) * 8, e.y - 6 - k * 18, 1.6, 0, 6.28);
          ctx.fill();
        }
        if (e.text) this._floatText(ctx, e.x, e.y - 30 - e.t * 8, e.text, INK, a);
      } else if (e.kind === 'float') {
        this._floatText(ctx, e.x, e.y - e.t * 16, e.text, e.color, a);
      }
    }
    this.effects = keep;
  }

  _floatText(ctx, x, y, text, color, a) {
    ctx.font = `700 22px ${this.labelFont}`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = `rgba(245,236,214,${0.8 * a})`;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = rgba(color, a);
    ctx.fillText(text, x, y);
    ctx.textAlign = 'left';
  }
}

export { canopyPts, mix };
