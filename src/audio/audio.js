// Motor de audio: buses separados (música, ambiente, efectos), reverberación generada,
// capa lo-fi y desbloqueo en iOS/Android (incluido el interruptor de silencio del iPhone).

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.ready = false;
    this.vol = { music: 0.7, ambience: 0.6, sfx: 0.7 };
    this.lofi = true;
    this.listeners = [];
  }

  init() {
    if (this.ctx) return this.ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { this.ctx = new AC({ latencyHint: 'playback' }); } catch { this.ctx = new AC(); }
    const c = this.ctx;
    this.master = c.createGain();
    this.master.gain.value = 2.0;
    // Compresor suave para que nada sature
    this.comp = c.createDynamicsCompressor();
    this.comp.threshold.value = -14; this.comp.ratio.value = 3; this.comp.attack.value = 0.01; this.comp.release.value = 0.3;
    this.master.connect(this.comp).connect(c.destination);
    this.bus = {};
    for (const k of ['music', 'ambience', 'sfx']) {
      const g = c.createGain();
      g.gain.value = this.vol[k];
      g.connect(this.master);
      this.bus[k] = g;
    }
    // Cadena de la música: filtro lo-fi + reverb
    this.musicIn = c.createGain();
    this.lofiFilter = c.createBiquadFilter();
    this.lofiFilter.type = 'lowpass';
    this.lofiFilter.frequency.value = this.lofi ? 3200 : 12000;
    this.reverb = c.createConvolver();
    this.reverb.buffer = this._impulse(3.2, 2.6);
    this.revGain = c.createGain();
    this.revGain.gain.value = 0.42;
    this.dry = c.createGain();
    this.dry.gain.value = 0.8;
    this.musicIn.connect(this.lofiFilter);
    this.lofiFilter.connect(this.dry).connect(this.bus.music);
    this.lofiFilter.connect(this.reverb);
    this.reverb.connect(this.revGain).connect(this.bus.music);
    // Reverb ligera para el ambiente y los efectos
    this.ambRev = c.createConvolver();
    this.ambRev.buffer = this._impulse(1.6, 3);
    this.ambRevGain = c.createGain();
    this.ambRevGain.gain.value = 0.25;
    this.ambRev.connect(this.ambRevGain).connect(this.bus.ambience);
    // Oscilador de «cinta»: leve desafinación para la capa lo-fi
    this.wow = c.createOscillator();
    this.wow.frequency.value = 0.35;
    this.wowDepth = c.createGain();
    this.wowDepth.gain.value = this.lofi ? 7 : 0;
    this.wow.connect(this.wowDepth);
    this.wow.start();
    this.noise = this._noiseBuffer(2.5);
    return c;
  }

  _impulse(seconds, decay) {
    const c = this.ctx;
    const len = Math.floor(c.sampleRate * seconds);
    const buf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  _noiseBuffer(seconds) {
    const c = this.ctx;
    const len = Math.floor(c.sampleRate * seconds);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  // Llamar en cada gesto del usuario hasta que el audio esté sonando
  unlock() {
    const c = this.init();
    if (!c) return;
    if (c.state !== 'running') {
      try { c.resume(); } catch { /* sigue */ }
      // Búfer vacío: desbloquea WebKit
      try {
        const b = c.createBuffer(1, 1, 22050);
        const src = c.createBufferSource();
        src.buffer = b;
        src.connect(c.destination);
        (src.start || src.noteOn).call(src, 0);
      } catch { /* sigue */ }
    }
    // Audio HTML con un segundo de silencio REAL: saca al Web Audio del canal de timbre
    // en iPhone, así suena aunque el interruptor de silencio esté activado.
    if (!this.htmlAudio) {
      try {
        const a = document.createElement('audio');
        a.setAttribute('playsinline', '');
        a.setAttribute('x-webkit-airplay', 'deny');
        a.loop = true;
        a.src = silentWav(1);
        a.volume = 0.01;
        this.htmlAudio = a;
      } catch { /* sin audio html */ }
    }
    if (this.htmlAudio && this.htmlAudio.paused) {
      const p = this.htmlAudio.play();
      if (p && p.catch) p.catch(() => {});
    }
    if (c.state === 'running' && !this.ready) {
      this.ready = true;
      for (const f of this.listeners) f();
    }
  }

  onReady(f) { if (this.ready) f(); else this.listeners.push(f); }

  get running() { return !!this.ctx && this.ctx.state === 'running'; }

  setVolume(bus, v) {
    this.vol[bus] = v;
    if (this.bus && this.bus[bus]) this.bus[bus].gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
  }

  setLofi(on) {
    this.lofi = on;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.lofiFilter.frequency.setTargetAtTime(on ? 3200 : 12000, t, 0.3);
    this.wowDepth.gain.setTargetAtTime(on ? 7 : 0, t, 0.3);
  }

  // Si la página se oculta, el audio se suspende para no gastar batería
  suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); }
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
}

// WAV PCM de 8 bits con `seconds` segundos de silencio de verdad (no un archivo vacío)
export function silentWav(seconds = 1) {
  const rate = 8000, n = Math.floor(rate * seconds);
  const bytes = new Uint8Array(44 + n);
  const dv = new DataView(bytes.buffer);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) bytes[o + i] = s.charCodeAt(i); };
  w(0, 'RIFF'); dv.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt ');
  dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
  dv.setUint32(24, rate, true); dv.setUint32(28, rate, true); dv.setUint16(32, 1, true); dv.setUint16(34, 8, true);
  w(36, 'data'); dv.setUint32(40, n, true);
  for (let i = 0; i < n; i++) bytes[44 + i] = 128;
  let bin = '';
  for (let i = 0; i < bytes.length; i += 4096) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 4096));
  return 'data:audio/wav;base64,' + btoa(bin);
}

export const audio = new AudioEngine();
