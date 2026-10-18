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
    this.minZoom = this.fit * 0.95;
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

// Gestos sobre el lienzo: arrastrar, pellizcar, rueda y toque
export function attachGestures(canvas, cam, { onTap }) {
  const pts = new Map();
  let moved = 0, start = null, lastPinch = 0;
  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 1) { moved = 0; start = [e.clientX, e.clientY, performance.now()]; }
    if (pts.size === 2) lastPinch = dist();
    cam._target = null;
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!pts.has(e.pointerId)) return;
    const prev = pts.get(e.pointerId);
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 1) {
      const dx = e.clientX - prev[0], dy = e.clientY - prev[1];
      moved += Math.abs(dx) + Math.abs(dy);
      if (moved > 6) cam.pan(dx, dy);
    } else if (pts.size === 2) {
      const d = dist();
      const [mx, my] = mid();
      if (lastPinch > 0) cam.zoomAt(mx, my, d / lastPinch);
      lastPinch = d;
      moved += 100;
    }
  });
  const up = (e) => {
    if (!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId);
    if (pts.size === 0 && start && moved <= 8 && performance.now() - start[2] < 600) {
      onTap(e.clientX, e.clientY);
    }
    if (pts.size < 2) lastPinch = 0;
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    cam.zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0015));
  }, { passive: false });
  function dist() {
    const [a, b] = [...pts.values()];
    return Math.hypot(a[0] - b[0], a[1] - b[1]);
  }
  function mid() {
    const [a, b] = [...pts.values()];
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  }
}
