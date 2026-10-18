// Ambiente: viento en las encinas, lluvia, chicharras, grillos, fuente, pájaros,
// ovejas, cencerros, gallinas y el gato. Y los efectos de papel, pluma, sello y monedas.
import { audio } from './audio.js';

function noiseSrc(loop = true) {
  const c = audio.ctx;
  const s = c.createBufferSource();
  s.buffer = audio.noise;
  s.loop = loop;
  return s;
}

function env(g, t, a, peak, d) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}

export class Ambience {
  constructor() {
    this.layers = {};
    this.started = false;
    this.target = {};
    this.nextEvent = 0;
  }

  start() {
    const c = audio.ctx;
    if (!c || this.started) return;
    this.started = true;
    const out = audio.bus.ambience;
    const mk = (name, build) => {
      const g = c.createGain();
      g.gain.value = 0;
      build(g);
      g.connect(out);
      if (name !== 'cicadas') g.connect(audio.ambRev);
      this.layers[name] = g;
    };
    // Viento: ruido filtrado con un barrido lento
    mk('wind', (g) => {
      const n = noiseSrc();
      const f = c.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 420; f.Q.value = 0.7;
      const lfo = c.createOscillator(); lfo.frequency.value = 0.07;
      const lg = c.createGain(); lg.gain.value = 260;
      lfo.connect(lg).connect(f.frequency);
      const amp = c.createGain(); amp.gain.value = 0.7;
      const lfo2 = c.createOscillator(); lfo2.frequency.value = 0.11;
      const lg2 = c.createGain(); lg2.gain.value = 0.3;
      lfo2.connect(lg2).connect(amp.gain);
      n.connect(f).connect(amp).connect(g);
      n.start(); lfo.start(); lfo2.start();
    });
    // Lluvia
    mk('rain', (g) => {
      const n = noiseSrc();
      const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7000;
      n.connect(hp).connect(lp).connect(g);
      n.start();
    });
    // Chicharras: ruido agudo modulado muy rápido
    mk('cicadas', (g) => {
      const n = noiseSrc();
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 5200; f.Q.value = 9;
      const am = c.createGain(); am.gain.value = 0.5;
      const lfo = c.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 42;
      const lg = c.createGain(); lg.gain.value = 0.5;
      lfo.connect(lg).connect(am.gain);
      const swell = c.createOscillator(); swell.frequency.value = 0.09;
      const sg = c.createGain(); sg.gain.value = 0.35;
      swell.connect(sg).connect(am.gain);
      n.connect(f).connect(am).connect(g);
      n.start(); lfo.start(); swell.start();
    });
    // Fuente: burbujeo
    mk('fountain', (g) => {
      const n = noiseSrc();
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 1.4;
      const lfo = c.createOscillator(); lfo.type = 'triangle'; lfo.frequency.value = 5.3;
      const lg = c.createGain(); lg.gain.value = 500;
      lfo.connect(lg).connect(f.frequency);
      n.connect(f).connect(g);
      n.start(); lfo.start();
    });
    // Grillos: se programan como eventos (ver tick)
    mk('crickets', () => {});
    this.timer = setInterval(() => this._tick(), 120);
  }

  // Ajusta los niveles según el estado de la finca
  update(s) {
    if (!this.started) return;
    const h = s.hour, w = s.weather;
    const season = Math.floor((s.day - 1) / s.cfg.daysPerSeason + s.cfg.startSeason) % 4;
    const night = h < 6 || h > 21.5;
    this.season = season; this.hour = h; this.weather = w; this.state = s;
    this.target = {
      wind: w === 'viento' ? 0.32 : w === 'tormenta' ? 0.28 : season === 3 ? 0.1 : 0.05,
      rain: w === 'lluvia' ? 0.22 : w === 'tormenta' ? 0.36 : 0,
      cicadas: season === 1 && h > 11 && h < 19.5 && w !== 'lluvia' ? 0.05 : 0,
      fountain: s.zones.patio.cons > 45 && s.water > 15 ? 0.025 * (s.zones.patio.cons / 100) : 0,
      crickets: night && season !== 3 && w !== 'lluvia' ? 1 : 0,
    };
    const c = audio.ctx;
    for (const [k, v] of Object.entries(this.target)) {
      if (k === 'crickets') continue;
      this.layers[k].gain.setTargetAtTime(v, c.currentTime, 1.5);
    }
  }

  _tick() {
    const c = audio.ctx;
    if (!c || c.state !== 'running' || !this.state) return;
    const t = c.currentTime;
    const s = this.state;
    if (this.target.crickets && Math.random() < 0.55) this._cricket(t + Math.random() * 0.1);
    if (t < this.nextEvent) return;
    this.nextEvent = t + 1.5 + Math.random() * 4;
    const h = this.hour;
    const day = h > 6.5 && h < 20.5;
    const r = Math.random();
    if (day && this.weather !== 'lluvia' && this.weather !== 'tormenta' && r < 0.35) this._bird(t);
    else if (s.animals.ovejas > 0 && s.zones.corral.unlocked && r < 0.5) (Math.random() < 0.5 ? this._bleat(t) : this._bell(t));
    else if (s.animals.gallinas > 0 && day && r < 0.65) this._cluck(t);
    else if (this.weather === 'tormenta' && r < 0.8) this._thunder(t);
    else if (r < 0.72 && Math.random() < 0.25) this.meow(t);
  }

  _cricket(t) {
    const c = audio.ctx;
    const o = c.createOscillator();
    o.frequency.value = 4400 + Math.random() * 300;
    const g = c.createGain();
    g.gain.value = 0;
    o.connect(g).connect(audio.bus.ambience);
    for (let i = 0; i < 3; i++) {
      const tt = t + i * 0.045;
      g.gain.setValueAtTime(0, tt);
      g.gain.linearRampToValueAtTime(0.012, tt + 0.008);
      g.gain.linearRampToValueAtTime(0, tt + 0.03);
    }
    o.start(t); o.stop(t + 0.2);
  }

  _bird(t) {
    const c = audio.ctx;
    const n = 2 + Math.floor(Math.random() * 4);
    const base = 2600 + Math.random() * 1600;
    for (let i = 0; i < n; i++) {
      const o = c.createOscillator();
      const g = c.createGain();
      const tt = t + i * (0.09 + Math.random() * 0.05);
      o.frequency.setValueAtTime(base * (1 + Math.random() * 0.2), tt);
      o.frequency.exponentialRampToValueAtTime(base * (0.7 + Math.random() * 0.6), tt + 0.07);
      env(g, tt, 0.01, 0.02, 0.07);
      o.connect(g).connect(audio.bus.ambience);
      g.connect(audio.ambRev);
      o.start(tt); o.stop(tt + 0.1);
    }
  }

  _bleat(t) {
    const c = audio.ctx;
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(330 + Math.random() * 60, t);
    const vib = c.createOscillator(); vib.frequency.value = 7;
    const vg = c.createGain(); vg.gain.value = 18;
    vib.connect(vg).connect(o.frequency);
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1100; f.Q.value = 3;
    const g = c.createGain();
    env(g, t, 0.05, 0.035, 0.7);
    o.connect(f).connect(g).connect(audio.bus.ambience);
    g.connect(audio.ambRev);
    o.start(t); vib.start(t); o.stop(t + 0.8); vib.stop(t + 0.8);
  }

  _bell(t) {
    const c = audio.ctx;
    const f0 = 900 + Math.random() * 200;
    for (const [m, a] of [[1, 0.03], [2.76, 0.015], [5.4, 0.008]]) {
      const o = c.createOscillator();
      const g = c.createGain();
      o.frequency.value = f0 * m;
      env(g, t, 0.003, a, 0.5);
      o.connect(g).connect(audio.bus.ambience);
      o.start(t); o.stop(t + 0.6);
    }
  }

  _cluck(t) {
    const c = audio.ctx;
    for (let i = 0; i < 3; i++) {
      const o = c.createOscillator();
      o.type = 'triangle';
      const g = c.createGain();
      const tt = t + i * 0.13;
      o.frequency.setValueAtTime(520, tt);
      o.frequency.exponentialRampToValueAtTime(380, tt + 0.06);
      env(g, tt, 0.005, 0.03, 0.07);
      o.connect(g).connect(audio.bus.ambience);
      o.start(tt); o.stop(tt + 0.1);
    }
  }

  _thunder(t) {
    const c = audio.ctx;
    const n = noiseSrc(false);
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 220;
    const g = c.createGain();
    env(g, t, 0.15, 0.5, 2.6);
    n.connect(f).connect(g).connect(audio.bus.ambience);
    n.start(t, 0, 2.5);
  }

  meow(t = audio.ctx && audio.ctx.currentTime) {
    const c = audio.ctx;
    if (!c) return;
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(520, t);
    o.frequency.linearRampToValueAtTime(820, t + 0.18);
    o.frequency.linearRampToValueAtTime(480, t + 0.5);
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 4;
    f.frequency.setValueAtTime(900, t);
    f.frequency.linearRampToValueAtTime(1600, t + 0.2);
    f.frequency.linearRampToValueAtTime(800, t + 0.5);
    const g = c.createGain();
    env(g, t, 0.06, 0.05, 0.45);
    o.connect(f).connect(g).connect(audio.bus.ambience);
    o.start(t); o.stop(t + 0.6);
  }

  purr() {
    const c = audio.ctx;
    if (!c) return;
    const t = c.currentTime;
    const n = noiseSrc(false);
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 180;
    const am = c.createGain(); am.gain.value = 0.5;
    const lfo = c.createOscillator(); lfo.frequency.value = 24;
    const lg = c.createGain(); lg.gain.value = 0.5;
    lfo.connect(lg).connect(am.gain);
    const g = c.createGain();
    env(g, t, 0.3, 0.35, 1.8);
    n.connect(f).connect(am).connect(g).connect(audio.bus.ambience);
    n.start(t, 0, 2.2); lfo.start(t); lfo.stop(t + 2.2);
  }
}

// ── Efectos ──
export function sfx(name) {
  const c = audio.ctx;
  if (!c || c.state !== 'running') return;
  const t = c.currentTime + 0.01;
  const out = audio.bus.sfx;
  const noise = (dur, type, freq, q, peak, a = 0.01, offset = Math.random()) => {
    const n = noiseSrc(false);
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain();
    env(g, t, a, peak, dur);
    n.connect(f).connect(g).connect(out);
    n.start(t, offset, dur + a + 0.05);
    return f;
  };
  const tone = (freq, dur, peak, type = 'sine', at = 0) => {
    const o = c.createOscillator(); o.type = type; o.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t + at);
    g.gain.exponentialRampToValueAtTime(peak, t + at + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + at + dur);
    o.connect(g).connect(out);
    o.start(t + at); o.stop(t + at + dur + 0.05);
    return o;
  };
  switch (name) {
    case 'paper': {
      const f = noise(0.22, 'bandpass', 2500, 0.8, 0.12, 0.04);
      f.frequency.setValueAtTime(1500, t); f.frequency.exponentialRampToValueAtTime(4500, t + 0.2);
      break;
    }
    case 'page': noise(0.35, 'bandpass', 1800, 0.6, 0.1, 0.08); break;
    case 'pen': {
      for (let i = 0; i < 5; i++) {
        const n = noiseSrc(false);
        const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 3000 + Math.random() * 2000;
        const g = c.createGain();
        const tt = t + i * 0.06 + Math.random() * 0.02;
        g.gain.setValueAtTime(0.0001, tt);
        g.gain.exponentialRampToValueAtTime(0.05, tt + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.05);
        n.connect(f).connect(g).connect(out);
        n.start(tt, Math.random(), 0.08);
      }
      break;
    }
    case 'stamp': {
      const o = tone(140, 0.25, 0.3);
      o.frequency.exponentialRampToValueAtTime(55, t + 0.2);
      noise(0.05, 'lowpass', 1200, 0.7, 0.2, 0.002);
      break;
    }
    case 'coins':
      [0, 0.07, 0.16].forEach((at, i) => { tone(2300 + i * 380 + Math.random() * 100, 0.35, 0.06, 'sine', at); tone(5100 + i * 300, 0.15, 0.02, 'sine', at); });
      break;
    case 'tools':
      [[420, 0.05], [1130, 0.03], [2210, 0.02]].forEach(([f, a]) => tone(f, 0.3, a, 'triangle'));
      noise(0.08, 'bandpass', 3000, 2, 0.08, 0.002);
      break;
    case 'click': tone(1200, 0.04, 0.04, 'triangle'); break;
    case 'chime':
      [0, 4, 7, 12].forEach((iv, i) => tone(523.25 * Math.pow(2, iv / 12), 1.2, 0.05, 'sine', i * 0.09));
      break;
    case 'item':
      [12, 7, 16, 19].forEach((iv, i) => tone(392 * Math.pow(2, iv / 12), 1.4, 0.045, 'sine', i * 0.12));
      break;
    case 'warn': tone(220, 0.6, 0.06, 'triangle'); tone(207, 0.6, 0.05, 'triangle', 0.25); break;
    default: break;
  }
}

export const ambience = new Ambience();
