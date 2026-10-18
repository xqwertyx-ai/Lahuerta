// Cámara del plano: encaje en pantalla, arrastre, pellizco y rueda.
import { WORLD } from '../art/map.js';

export class Camera {
  constructor() {
    this.x = 0; this.y = 0; this.zoom = 1;
    this.vw = 1; this.vh = 1; this.dpr = 1;
    this.fit = 1;
    this.topInset = 0;   // espacio que ocupa el HUD
    this.rightInset = 0; // espacio del panel lateral
    this.bottomInset = 0;
  }

  resize(vw, vh, dpr) {
    const first = this.vw === 1;
    const cx = this.x + this.vw / this.zoom / 2, cy = this.y + this.vh / this.zoom / 2;
    this.vw = vw; this.vh = vh; this.dpr = dpr;
    this.fit = Math.min(vw / (WORLD.w + 40), (vh - this.topInset) / (WORLD.h + 40));
    // En pantallas estrechas (móvil en vertical) se empieza más cerca para que se lea
    this.minZoom = this.fit * 0.8;
    this.maxZoom = Math.max(this.fit * 4, 2.2);
    if (first) {
      const narrow = vw / vh < 1;
      // Vertical: cerca, centrado en el cortijo. Horizontal: el plano de lado a lado.
      this.zoom = narrow ? Math.min(this.maxZoom, (vh / WORLD.h) * 0.9) : Math.min(this.maxZoom, Math.max(this.fit, vw / (WORLD.w + 40)));
      this.centerOn(narrow ? 800 : WORLD.w / 2, narrow ? 640 : 560);
    } else {
      this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom));
      this.centerOn(cx, cy);
    }
  }

  centerOn(wx, wy) {
    this.x = wx - this.vw / this.zoom / 2;
    this.y = wy - (this.vh + this.topInset - this.bottomInset) / this.zoom / 2 + this.topInset / this.zoom;
    this.clamp();
  }

  clamp() {
    const z = this.zoom, vwW = this.vw / z, vhW = this.vh / z;
    const minX = -60, maxX = WORLD.w + 60 + this.rightInset / z - vwW;
    this.x = maxX < minX ? (minX + maxX) / 2 : Math.max(minX, Math.min(maxX, this.x));
    const minY = -20 - this.topInset / z, maxY = WORLD.h + 30 + this.bottomInset / z - vhW;
    this.y = maxY < minY ? (minY + maxY) / 2 : Math.max(minY, Math.min(maxY, this.y));
  }

  toWorld(sx, sy) { return [this.x + sx / this.zoom, this.y + sy / this.zoom]; }

  zoomAt(sx, sy, factor) {
    const [wx, wy] = this.toWorld(sx, sy);
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * factor));
    this.x = wx - sx / this.zoom;
    this.y = wy - sy / this.zoom;
    this.clamp();
  }

  pan(dx, dy) {
    this.x -= dx / this.zoom;
    this.y -= dy / this.zoom;
    this.clamp();
  }

  // Desliza suavemente hasta que un punto quede visible
  focus(wx, wy) {
    this._target = [wx, wy];
  }

  update(dt) {
    if (!this._target) return;
    const [tx, ty] = this._target;
    const vwW = (this.vw - this.rightInset) / this.zoom;
    const vhW = (this.vh - this.topInset - this.bottomInset) / this.zoom;
    const cx = this.x + vwW / 2, cy = this.y + this.topInset / this.zoom + vhW / 2;
    const k = Math.min(1, dt * 5);
    const nx = cx + (tx - cx) * k, ny = cy + (ty - cy) * k;
    this.x = nx - vwW / 2;
    this.y = ny - this.topInset / this.zoom - vhW / 2;
    this.clamp();
    if (Math.hypot(tx - nx, ty - ny) < 2) this._target = null;
  }
}

// Gestos sobre el lienzo: arrastrar, pellizcar, rueda y toque.
// En pantallas táctiles se usan eventos touch con preventDefault (algunos visores incrustados
// cancelan los punteros al arrastrar); el ratón usa eventos de puntero.
export function attachGestures(canvas, getCam, { onTap }) {
  // getCam: la cámara se recrea al empezar cada partida, así que siempre se pide la actual
  let moved = 0, start = null, last = null, lastPinch = 0;
  const begin = (x, y) => { moved = 0; start = [x, y, performance.now()]; last = [x, y]; getCam()._target = null; };
  const drag = (x, y) => {
    const dx = x - last[0], dy = y - last[1];
    last = [x, y];
    moved += Math.abs(dx) + Math.abs(dy);
    if (moved > 6) getCam().pan(dx, dy);
  };
  const end = (x, y) => {
    if (start && moved <= 10 && performance.now() - start[2] < 650) onTap(x, y);
    start = null;
  };
  // Táctil
  const tdist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (e.touches.length === 1) begin(e.touches[0].clientX, e.touches[0].clientY);
    if (e.touches.length === 2) { lastPinch = tdist(e.touches); moved += 100; }
  }, { passive: false });
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && last) drag(e.touches[0].clientX, e.touches[0].clientY);
    else if (e.touches.length >= 2) {
      const d = tdist(e.touches);
      const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2, my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      if (lastPinch > 0) getCam().zoomAt(mx, my, d / lastPinch);
      lastPinch = d;
      last = [mx, my];
    }
  }, { passive: false });
  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (e.touches.length === 0) {
      const t = e.changedTouches[0];
      end(t.clientX, t.clientY);
      lastPinch = 0;
    } else if (e.touches.length === 1) { last = [e.touches[0].clientX, e.touches[0].clientY]; lastPinch = 0; }
  }, { passive: false });
  canvas.addEventListener('touchcancel', () => { start = null; lastPinch = 0; });
  // Ratón y lápiz
  let down = false;
  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') return;
    down = true;
    try { canvas.setPointerCapture(e.pointerId); } catch { /* nada */ }
    begin(e.clientX, e.clientY);
  });
  canvas.addEventListener('pointermove', (e) => { if (down && e.pointerType !== 'touch') drag(e.clientX, e.clientY); });
  const up = (e) => { if (!down || e.pointerType === 'touch') return; down = false; end(e.clientX, e.clientY); };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', () => { down = false; start = null; });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    getCam().zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0015));
  }, { passive: false });
}
