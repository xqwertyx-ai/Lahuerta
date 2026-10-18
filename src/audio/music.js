// Música generativa: piano tranquilo con mucho espacio, que cambia con la estación,
// la hora y la situación. Y el tema del pianista, que gana notas con cada partitura.
import { audio } from './audio.js';
import { THEME, THEME_TEMPO } from '../data/story.js';

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

// Nota de piano sintetizada: parciales con ligera inarmonicidad, martillo y caída exponencial
export function pianoNote(time, midi, vel = 0.5, dur = 3, dest = null) {
  const c = audio.ctx;
  if (!c) return;
  const out = dest || audio.musicIn;
  const f = mtof(midi);
  const g = c.createGain();
  const bright = c.createBiquadFilter();
  bright.type = 'lowpass';
  bright.frequency.setValueAtTime(Math.min(9000, f * (4 + vel * 6)), time);
  bright.frequency.exponentialRampToValueAtTime(Math.max(300, f * 1.5), time + dur);
  g.connect(bright).connect(out);
  const peak = 0.16 * vel * (midi > 84 ? 0.7 : 1);
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(peak, time + 0.006);
  g.gain.exponentialRampToValueAtTime(peak * 0.35, time + 0.25);
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  const partials = [[1, 1], [2.003, 0.42], [3.01, 0.18], [4.02, 0.08], [5.04, 0.04]];
  for (const [mul, amp] of partials) {
    const o = c.createOscillator();
    const og = c.createGain();
    o.type = 'sine';
    o.frequency.value = f * mul;
    o.detune.value = (Math.random() - 0.5) * 4;
    if (audio.wowDepth) audio.wowDepth.connect(o.detune);
    og.gain.value = amp;
    o.connect(og).connect(g);
    o.start(time);
    o.stop(time + dur + 0.05);
    o.onended = () => { try { audio.wowDepth && audio.wowDepth.disconnect(o.detune); } catch { /* ya */ } };
  }
  // Martillo
  if (audio.noise) {
    const n = c.createBufferSource();
    n.buffer = audio.noise;
    const nf = c.createBiquadFilter();
    nf.type = 'bandpass';
    nf.frequency.value = Math.min(6000, f * 3);
    nf.Q.value = 1.2;
    const ng = c.createGain();
    ng.gain.setValueAtTime(0.03 * vel, time);
    ng.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);
    n.connect(nf).connect(ng).connect(out);
    n.start(time, Math.random() * 2, 0.06);
  }
}

// Escalas y progresiones por estación (grados como semitonos desde la tónica)
const MOODS = [
  { // primavera — sol mayor, luminoso
    root: 55, scale: [0, 2, 4, 7, 9, 11, 12], tempo: 72,
    chords: [[0, 4, 7, 11], [7, 11, 14, 18], [9, 12, 16, 19], [5, 9, 12, 16]],
  },
  { // verano — fa lidio, cálido y lento
    root: 53, scale: [0, 2, 4, 6, 7, 9, 11], tempo: 64,
    chords: [[0, 4, 7, 11], [2, 6, 9, 14], [9, 12, 16, 19], [7, 11, 14, 17]],
  },
  { // otoño — re dórico, melancolía amable
    root: 50, scale: [0, 2, 3, 5, 7, 9, 10], tempo: 62,
    chords: [[0, 3, 7, 10], [5, 9, 12, 16], [10, 14, 17, 21], [7, 10, 14, 17]],
  },
  { // invierno — mi menor, escarcha
    root: 52, scale: [0, 2, 3, 5, 7, 8, 10], tempo: 56,
    chords: [[0, 3, 7, 10], [8, 12, 15, 19], [3, 7, 10, 14], [10, 14, 17, 21]],
  },
];

export class Music {
  constructor() {
    this.season = 2;
    this.hour = 12;
    this.on = true;
    this.beat = 0;
    this.nextTime = 0;
    this.chordIdx = 0;
    this.lastMel = 7;
    this.restBars = 0;
    this.themeUntil = 0;
    this.lofiGain = null;
    this.duck = 1;
  }

  start() {
    const c = audio.ctx;
    if (!c || this.timer) return;
    this.nextTime = c.currentTime + 0.3;
    this.timer = setInterval(() => this._schedule(), 90);
    this._startLofi();
  }

  setContext(season, hour, mood = 'calm') {
    this.season = season;
    this.hour = hour;
    this.situation = mood;
  }

  _schedule() {
    const c = audio.ctx;
    if (!c || c.state !== 'running') return;
    const ahead = c.currentTime + 0.35;
    while (this.nextTime < ahead) {
      this._beat(this.nextTime);
      const m = MOODS[this.season];
      const night = this.hour < 6 || this.hour > 21.5;
      const tempo = m.tempo * (night ? 0.85 : 1);
      this.nextTime += 60 / tempo;
      this.beat++;
    }
  }

  _beat(t) {
    const c = audio.ctx;
    if (!this.on || t < this.themeUntil) { this._lofiBeat(t, true); return; }
    const m = MOODS[this.season];
    const h = this.hour;
    const night = h < 6 || h > 21.5;
    const dawn = h >= 6 && h < 8.5;
    const dusk = h >= 18.5 && h <= 21.5;
    const inBar = this.beat % 4;
    const barN = Math.floor(this.beat / 4);
    if (inBar === 0) {
      if (barN % 2 === 0) this.chordIdx = (this.chordIdx + (Math.random() < 0.8 ? 1 : 2)) % m.chords.length;
      if (this.restBars > 0) this.restBars--;
      else if (Math.random() < 0.12) this.restBars = 1;
      // Acorde arpegiado, suave y grave
      if (this.restBars === 0 || barN % 4 === 0) {
        const ch = m.chords[this.chordIdx];
        const base = m.root - 12 + (night ? -0 : 0);
        const roll = dawn ? 0.11 : 0.05;
        pianoNote(t, base + ch[0] - 12, 0.32, 5);
        ch.forEach((iv, i) => {
          if (night && i === 3) return;
          pianoNote(t + 0.04 + i * roll, base + iv + (i > 1 ? 0 : 0), 0.22 + Math.random() * 0.06, 4.5);
        });
      }
    }
    this._lofiBeat(t, false);
    if (this.restBars > 0) return;
    // Melodía: pocas notas, por grados conjuntos, con silencios
    let p = night ? 0.18 : dawn ? 0.42 : dusk ? 0.33 : 0.3;
    if (this.situation === 'sad') p *= 0.7;
    if (Math.random() < p) {
      const step = [-2, -1, -1, 1, 1, 2, 0, 3, -3][Math.floor(Math.random() * 9)];
      this.lastMel = Math.max(0, Math.min(13, this.lastMel + step));
      const oct = Math.floor(this.lastMel / 7);
      const deg = m.scale[this.lastMel % 7];
      const midi = m.root + 12 + deg + oct * 12 + (night ? -12 : 0);
      pianoNote(t + (Math.random() < 0.3 ? 60 / m.tempo / 2 : 0), midi, 0.3 + Math.random() * 0.18, 3.5);
    }
  }

  // ── Capa lo-fi: crujido de vinilo y un ritmo muy amortiguado ──
  _startLofi() {
    const c = audio.ctx;
    const len = c.sampleRate * 3;
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const r = Math.random();
      d[i] = r < 0.0009 ? (Math.random() * 2 - 1) * 0.9 : (Math.random() * 2 - 1) * 0.015;
    }
    const src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const hp = c.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 900;
    this.crackle = c.createGain();
    this.crackle.gain.value = audio.lofi ? 0.22 : 0;
    src.connect(hp).connect(this.crackle).connect(audio.bus.music);
    src.start();
    this.beatGain = c.createGain();
    this.beatGain.gain.value = audio.lofi ? 1 : 0;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 900;
    this.beatGain.connect(lp).connect(audio.bus.music);
  }

  setLofi(on) {
    const c = audio.ctx;
    if (!c || !this.crackle) return;
    this.crackle.gain.setTargetAtTime(on ? 0.22 : 0, c.currentTime, 0.4);
    this.beatGain.gain.setTargetAtTime(on ? 1 : 0, c.currentTime, 0.4);
  }

  _lofiBeat(t, quiet) {
    if (!audio.lofi || !this.beatGain) return;
    const night = this.hour < 6.5 || this.hour > 22;
    if (night) return;
    const c = audio.ctx;
    const inBar = this.beat % 4;
    const vol = quiet ? 0.4 : 1;
    if (inBar === 0 || (inBar === 2 && Math.random() < 0.6)) {
      // Bombo blando
      const o = c.createOscillator();
      const g = c.createGain();
      o.frequency.setValueAtTime(95, t);
      o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.16 * vol, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.connect(g).connect(this.beatGain);
      o.start(t); o.stop(t + 0.4);
    }
    // Escobilla en los contratiempos
    const n = c.createBufferSource();
    n.buffer = audio.noise;
    const f = c.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 3000; f.Q.value = 0.8;
    const g = c.createGain();
    const tt = t + 60 / MOODS[this.season].tempo / 2;
    g.gain.setValueAtTime(0.0001, tt);
    g.gain.exponentialRampToValueAtTime((inBar % 2 ? 0.05 : 0.03) * vol, tt + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.16);
    n.connect(f).connect(g).connect(audio.bus.music);
    n.start(tt, Math.random() * 2, 0.2);
  }

  // ── El tema del pianista ──
  // known: cuántas notas se conocen. Las desconocidas son silencio (la melodía queda incompleta).
  playTheme(known = THEME.length, full = false) {
    const c = audio.ctx;
    if (!c || c.state !== 'running') return 0;
    const spb = 60 / (THEME_TEMPO * (full ? 1 : 0.92));
    let t = c.currentTime + 0.6;
    const start = t;
    const root = 50; // re
    const bass = [0, 0, 7, 5, 3, 3, 0, 7];
    let beat = 0, bar = -1;
    THEME.forEach(([midi, dur], i) => {
      const curBar = Math.floor(beat / 3);
      if (curBar !== bar) {
        bar = curBar;
        const b = root - 12 + bass[bar % bass.length];
        pianoNote(t, b, full ? 0.3 : 0.22, spb * 3.5);
        if (full || i < known) pianoNote(t + 0.05, b + 12 + (bar % 2 ? 3 : 7), 0.16, spb * 3);
      }
      if (i < known || full) pianoNote(t, midi, 0.42 + (dur > 1 ? 0.06 : 0), spb * dur * 1.8 + 0.6);
      t += spb * dur;
      beat += dur;
    });
    // Final suspendido (si está incompleto) o resuelto
    if (full) { pianoNote(t, 62, 0.35, 5); pianoNote(t, 50, 0.28, 6); pianoNote(t + 0.06, 57, 0.2, 6); }
    this.themeUntil = t + 1.2;
    return t - start;
  }
}

export const music = new Music();
