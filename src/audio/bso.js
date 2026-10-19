// Banda sonora grabada (audio/bso.mp3): suena en bucle por el bus de música, así respeta el
// volumen de «Música». Se aparta (baja) cuando alguien toca el tema del pianista y se pausa
// con la página oculta. Si el archivo no carga, vuelve la música generativa.
import { audio } from './audio.js';

export const BSO_SRC = 'audio/bso.mp3';
const LEVEL = 0.55;      // nivel de la grabación frente al ambiente y los efectos
const DUCK = 0.12;       // mientras suena el tema del pianista

export class Bso {
  constructor() {
    this.el = null;
    this.gain = null;
    this.enabled = true;
    this.failed = false;
    this.duckUntil = 0;
  }

  get active() { return this.enabled && !this.failed && !!this.el; }

  // Llamar tras un gesto del usuario, con el audio ya desbloqueado
  start() {
    const c = audio.ctx;
    if (!c || this.el || this.failed) { this._sync(); return; }
    try {
      const a = new Audio();
      a.src = BSO_SRC;
      a.loop = true;
      a.preload = 'auto';
      a.setAttribute('playsinline', '');
      a.addEventListener('error', () => { this.failed = true; this.onFail && this.onFail(); });
      const src = c.createMediaElementSource(a);
      this.gain = c.createGain();
      this.gain.gain.value = 0;
      src.connect(this.gain).connect(audio.bus.music);
      this.el = a;
    } catch {
      this.failed = true;
      return;
    }
    this._sync();
  }

  setEnabled(on) {
    this.enabled = on;
    this._sync();
  }

  _sync() {
    if (!this.el || !audio.ctx) return;
    const t = audio.ctx.currentTime;
    if (this.enabled && audio.running && !document.hidden) {
      if (this.el.paused) { const p = this.el.play(); if (p && p.catch) p.catch(() => {}); }
      this.gain.gain.cancelScheduledValues(t);
      this.gain.gain.setTargetAtTime(t < this.duckUntil ? LEVEL * DUCK : LEVEL, t, 1.2);
    } else {
      this.gain.gain.setTargetAtTime(0, t, 0.3);
      if (!this.el.paused) setTimeout(() => { if (!this.enabled || document.hidden || !audio.running) this.el.pause(); }, 900);
    }
  }

  // Baja la grabación `seconds` segundos (el tema del pianista suena encima) y luego vuelve
  duck(seconds) {
    if (!this.active || !audio.ctx) return;
    const t = audio.ctx.currentTime;
    this.duckUntil = t + seconds;
    this.gain.gain.cancelScheduledValues(t);
    this.gain.gain.setTargetAtTime(LEVEL * DUCK, t, 0.6);
    this.gain.gain.setTargetAtTime(LEVEL, t + seconds, 2);
  }

  pause() { if (this.el && !this.el.paused) this.el.pause(); }
  resume() { this._sync(); }
}

export const bso = new Bso();
