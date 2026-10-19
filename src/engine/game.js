// El juego: bucle, tiempo con pausa y velocidades, plano, interfaz, audio y guardado.
import * as S from '../sim/index.js';
import { FarmMap, WORLD } from '../art/map.js';
import { Camera, attachGestures } from './camera.js';
import { UI } from '../ui/ui.js';
import { titleScreen, introScreen, sleepScreen, confirmDialog, importDialog } from '../ui/screens.js';
import { paperDataURL } from '../art/paper.js';
import { SEASON_PAPER } from '../art/palette.js';
import { ITEM_BY_ID } from '../data/items.js';
import { MILESTONES } from '../data/milestones.js';
import { ZONE_BY_ID } from '../data/zones.js';
import { VOLUNTEER_BY_ID } from '../data/volunteers.js';
import { SEASONS } from '../data/seasons.js';
import * as Save from '../save/save.js';
import { audio } from '../audio/audio.js';
import { music } from '../audio/music.js';
import { bso } from '../audio/bso.js';
import { ambience, sfx } from '../audio/ambience.js';

export class Game {
  constructor() {
    this.canvas = document.getElementById('map');
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.cam = new Camera();
    this.map = new FarmMap();
    this.s = null;
    this.speed = 1;
    this.paused = false;
    this.settings = Save.loadSettings();
    this.ui = null;
    this.last = 0;
    this.saveTimer = 0;
    this.audioTimer = 0;
    this.lastDay = 0;
    this.lastThemeDay = 0;
    this.fps = { frames: 0, t: 0, value: 60 };
    window.__huerta = this; // para depurar y para los tests e2e
  }

  async boot() {
    this.applySettings(false);
    document.documentElement.style.setProperty('--paper', `url(${paperDataURL(512, '#f1e6cc', 5)})`);
    // Las tipografías manuscritas antes de dibujar el plano (con límite por si no hay red)
    if (document.fonts && document.fonts.load) {
      await Promise.race([
        Promise.all([document.fonts.load('700 20px Caveat'), document.fonts.load('20px Caveat'), document.fonts.load('18px "Patrick Hand"')]),
        new Promise((r) => setTimeout(r, 2500)),
      ]).catch(() => {});
    }
    this._bindGlobal();
    this.resize();
    requestAnimationFrame((t) => this.frame(t));
    this.showTitle();
  }

  // ── Pantallas ──
  showTitle() {
    this.s = null;
    if (this.ui) { this.ui.destroy(); this.ui = null; }
    const info = Save.savedInfo();
    const root = document.getElementById('ui');
    const el = titleScreen(root, {
      hasSave: !!info,
      savedText: info ? `día ${info.day}` : '',
      season: 2,
      onContinue: () => { this.unlockAudio(); const st = Save.load(); el.remove(); if (st) this.start(st); else this.showTitle(); },
      onNew: () => {
        this.unlockAudio();
        const go = () => { el.remove(); introScreen(root, () => this.start(S.createState(Date.now() % 2147483647))); };
        if (info) this.confirmRaw(root, 'Ya hay un cuaderno empezado. ¿Empezar uno nuevo? (Puedes exportar el actual desde Ajustes.)', go);
        else go();
      },
      onImport: () => {
        this.unlockAudio();
        importDialog(root, (txt) => { const st = Save.unpack(txt); el.remove(); this.start(st); });
      },
    });
    this.titleEl = el;
  }

  confirmRaw(root, text, yes) {
    confirmDialog(root, text, yes);
  }

  start(state) {
    this.s = state;
    S.migrate(state);
    state.asleep = null;
    this.speed = 1;
    this.paused = false;
    if (this.ui) this.ui.destroy();
    this.ui = new UI(this);
    this.hud = this.ui.hud;
    this.lastDay = state.day;
    this.cam = new Camera();
    this.layout();
    this.resize(true);
    this.rebuildMap();
    if (!state.flags.seasonSnap) { Save.saveSeasonSnapshot(state); state.flags.seasonSnap = state.day; }
    Save.save(state);
    if (!state.log.length) S.addLog(state, 'Abres la cancela con una llave grande. El gato te mira desde la fuente como si te estuviera esperando.', 'diary');
    this.ui.update(state);
  }

  newGame() {
    Save.clearSave();
    if (this.ui) this.ui.closeBook();
    const root = document.getElementById('ui');
    if (this.ui) { this.ui.destroy(); this.ui = null; }
    this.s = null;
    introScreen(root, () => this.start(S.createState(Date.now() % 2147483647)));
  }

  rebuildMap() {
    const season = S.seasonIndex(this.s);
    const scale = this.cacheScale();
    this.map.build(season, scale);
    this.map.sync(this.s);
    document.documentElement.style.setProperty('--paper-tone', SEASON_PAPER[season]);
  }

  cacheScale() {
    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    const dpr = Math.min(coarse ? 1.5 : 2, window.devicePixelRatio || 1);
    const mobile = Math.min(window.innerWidth, window.innerHeight) < 600;
    // Resolución de la caché: la del zoom con el que se suele mirar (sin pasarse en móviles)
    return Math.max(1, Math.min(mobile ? 1.6 : 2, dpr * Math.max(this.cam.zoom, this.cam.fit * 1.6)));
  }

  // ── Bucle ──
  frame(t) {
    requestAnimationFrame((tt) => this.frame(tt));
    const dt = Math.min(0.1, Math.max(0, (t - (this.last || t)) / 1000));
    this.last = t;
    this.fps.frames++; this.fps.t += dt;
    if (this.fps.t >= 1) { this.fps.value = this.fps.frames / this.fps.t; this.fps.frames = 0; this.fps.t = 0; }
    const s = this.s;
    const ctx = this.ctx;
    if (!s) { ctx.fillStyle = '#2b2018'; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); return; }
    const ui = this.ui;
    const bookPause = ui.book.isOpen && this.settings.pauseBook;
    if (this.skipping && (ui.blocking || s.asleep || s.day !== this.skipDay)) this.skipping = false;
    if (this.skipping) {
      // Pasar la noche: ocho horas de juego por segundo hasta el amanecer
      S.advance(s, dt * 8);
    } else if (!this.paused && this.speed > 0 && !ui.blocking && !bookPause && !s.asleep) {
      S.advance(s, dt * this.speed * S.HOURS_PER_SECOND);
    }
    this.handleSignals();
    if (s.eventQueue.length && !ui.blocking) this.openEvent();
    ui.pumpNotes();
    if (S.seasonIndex(s) !== this.map.season) this.rebuildMap();
    this.map.sync(s);
    this.cam.update(dt);
    // Dibujo
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#2b2018';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.map.showNames = this.settings.names;
    this.map.draw(ctx, this.cam, s, ui.blocking || bookPause ? dt * 0.3 : dt);
    ui.update(s);
    ui.tick(dt);
    // Audio y guardado
    this.audioTimer -= dt;
    if (this.audioTimer <= 0) { this.audioTimer = 0.5; this.updateAudio(); }
    if (s.day !== this.lastDay) { this.lastDay = s.day; this.onNewDay(); }
    this.saveTimer += dt;
    if (this.saveTimer > 20) { this.saveTimer = 0; Save.save(s); }
  }

  onNewDay() {
    const s = this.s;
    Save.save(s);
    if (S.isSeasonStart(s)) { Save.saveSeasonSnapshot(s); s.flags.seasonSnap = s.day; }
  }

  skipToDawn() {
    if (!this.s || this.s.asleep) return;
    this.skipping = true;
    this.skipDay = this.s.day;
    this.paused = false;
    sfx('page');
  }

  setSpeed(v) {
    if (v === 0) { this.paused = !this.paused; if (!this.paused && this.speed === 0) this.speed = 1; }
    else { this.speed = v; this.paused = false; }
    sfx('click');
    this.hud && this.hud.update(this.s);
  }

  // ── Eventos ──
  openEvent() {
    const s = this.s;
    const view = S.currentEvent(s);
    if (!view) return;
    this.ui.showEvent(view, S.seasonIndex(s), (i) => {
      const r = S.resolveEvent(s, i);
      if (r && r.result) this.ui.toast(r.result, 'info');
      this.ui.update(s);
    });
  }

  // Tras una acción del jugador
  afterAction(r, zoneId = null, sound = null) {
    if (!r) return;
    if (!r.ok) { this.ui.toast(r.text, 'bad'); sfx('click'); return; }
    if (zoneId) {
      const z = ZONE_BY_ID[zoneId];
      const label = r.delta > 0.5 ? `+${Math.round(r.delta)}` : (r.used && !r.done ? r.text.split(': ').pop() : '');
      this.map.addWork(zoneId, label, r.skilled);
      sfx(sound || (z && /muro|rehacer|tejas|herramientas/.test(r.text) ? 'tools' : 'pen'));
    } else if (sound) sfx(sound);
    if (r.text && !zoneId) this.ui.toast(r.text, 'good');
    this.ui.update(this.s);
    this.ui.zone.update(this.s, true);
  }

  handleSignals() {
    const s = this.s;
    const sigs = S.drainSignals(s);
    let coins = false;
    for (const g of sigs) {
      switch (g.type) {
        case 'item': this.ui.queueItemNote(g.id); break;
        case 'restored': {
          const z = ZONE_BY_ID[g.zone];
          this.ui.toast(`${z.name} recupera el color.`, 'good');
          this.map.addFloat(z.x + z.w / 2, z.y + z.h / 2, '¡Restaurada!', '#4f7a35');
          sfx('chime');
          break;
        }
        case 'unlock': sfx('chime'); break;
        case 'volunteer': {
          const v = VOLUNTEER_BY_ID[g.id];
          if (g.arrive) { this.ui.toast(`Llega ${v.name}, de ${v.origin}. Puedes encargarle una zona.`, 'good'); sfx('paper'); }
          else this.ui.toast(`${v.name} se ha marchado.`, 'info');
          break;
        }
        case 'milestone': {
          const m = MILESTONES.find((x) => x.id === g.id);
          if (m) this.ui.toast(`Hito: ${m.name}. ${m.text}`, 'good');
          sfx('stamp');
          break;
        }
        case 'season': this.ui.toast(`${SEASONS[g.season].name}. ${SEASONS[g.season].note}`, 'info'); sfx('page'); break;
        case 'coins': coins = true; break;
        case 'warning': {
          const W = {
            ruin: 'Las cuentas no salen. Vende algo, gasta menos o pide ayuda a la cooperativa.',
            abandon: 'La finca se está borrando. Necesita cuidados.',
            cold: 'No queda leña: en el cortijo hace frío. Mira «Cuentas» en el cuaderno.',
            feed: 'Los animales no tienen qué comer. Compra pienso o siega heno.',
          };
          this.ui.toast(W[g.kind] || W.abandon, 'bad'); sfx('warn'); break;
        }
        case 'damage': {
          const def = S.DAMAGES[g.id];
          this.ui.toast(`⚠ ${def.name}. ${def.zone ? 'Toca la zona para repararla.' : 'Míralo en «Cuentas».'}`, 'bad');
          if (def.zone) { const z = ZONE_BY_ID[def.zone]; this.map.addFloat(z.x + z.w / 2, z.y + z.h / 2, '¡Averiado!', '#a0382a'); }
          sfx('warn');
          break;
        }
        case 'repaired': {
          const def = S.DAMAGES[g.id];
          this.ui.toast(`Reparado: ${def.name.toLowerCase()}.`, 'good');
          if (def.zone) { const z = ZONE_BY_ID[def.zone]; this.map.addFloat(z.x + z.w / 2, z.y + z.h / 2, '¡Arreglado!', '#4f7a35'); }
          sfx('chime');
          break;
        }
        case 'sleep': this.goToSleep(g.kind); break;
        case 'theme': this.playTheme(!!g.full); break;
        case 'tourism': this.ui.toast('Ya puedes recibir huéspedes: mira «Huéspedes» en el cuaderno.', 'good'); sfx('stamp'); break;
        case 'guest': this.ui.toast(g.n === 1 ? 'Llega un huésped.' : 'Llegan huéspedes.', 'good'); break;
        case 'task': if (s.volunteers.length && Math.random() < 0.5) this.map.addWork(g.zone, '', g.skilled); break;
        default: break;
      }
    }
    if (coins) sfx('coins');
  }

  goToSleep(kind) {
    const snap = Save.loadSeasonSnapshot();
    Save.save(this.s);
    this.ui.closeBook();
    this.ui.closeZone();
    const root = document.getElementById('ui');
    const el = sleepScreen(root, kind, {
      canRetry: !!snap,
      onRetry: () => { el.remove(); const st = Save.loadSeasonSnapshot(); st.asleep = null; st.ruinDays = 0; st.abandonDays = 0; if (st.money < 0) st.money = 0; this.start(st); },
      onRestart: () => { el.remove(); this.newGame(); },
    });
  }

  // ── Toques sobre el plano ──
  onTap(sx, sy) {
    if (!this.s) return;
    this.unlockAudio();
    const [wx, wy] = this.cam.toWorld(sx, sy);
    if (this.map.cat.hit(wx, wy)) {
      this.map.cat.pet();
      ambience.meow(); setTimeout(() => ambience.purr(), 500);
      return;
    }
    const id = this.map.hitTest(wx, wy);
    if (id) {
      this.ui.openZone(id);
      const z = ZONE_BY_ID[id];
      this.cam.focus(z.x + z.w / 2, z.y + z.h / 2);
      this.map.cat.notice(z.x + z.w / 2, z.y + z.h * 0.8);
    } else if (this.ui.zone.isOpen) this.ui.closeZone();
  }

  // ── Disposición y tamaño ──
  layout() {
    if (!this.ui) return;
    const hudH = this.hud ? this.hud.height() : 70;
    this.cam.topInset = hudH;
    document.documentElement.style.setProperty('--hud-h', Math.round(hudH) + 'px');
    const panel = this.ui.zone.el;
    const open = this.ui.zone.isOpen;
    const landscape = window.innerWidth / window.innerHeight >= 1 && window.innerWidth >= 640;
    this.cam.rightInset = open && landscape ? panel.getBoundingClientRect().width + 20 : 0;
    this.cam.bottomInset = open && !landscape ? Math.min(window.innerHeight * 0.62, panel.scrollHeight) : 0;
    this.cam.clamp();
  }

  resize(force = false) {
    // El lienzo nunca pasa de 2× (1,5× en pantallas táctiles): en un dibujo a boceto no se nota y va más fluido
    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    const dpr = Math.min(coarse ? 1.5 : 2, window.devicePixelRatio || 1);
    const w = window.innerWidth, hgt = window.innerHeight;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(hgt * dpr);
    this.cam.resize(w, hgt, dpr);
    this.layout();
    if (this.s && this.map.bg) {
      const sc = this.cacheScale();
      if (force || Math.abs(sc - this.map.scale) > 0.3) this.rebuildMap();
    }
  }

  _bindGlobal() {
    attachGestures(this.canvas, () => this.cam, { onTap: (x, y) => this.onTap(x, y) });
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 200));
    const unlock = () => this.unlockAudio();
    window.addEventListener('pointerdown', unlock, true);
    window.addEventListener('keydown', unlock, true);
    window.addEventListener('touchend', unlock, true);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { if (this.s) Save.save(this.s); bso.pause(); audio.suspend(); }
      else { audio.resume(); setTimeout(() => bso.resume(), 200); }
    });
    window.addEventListener('pagehide', () => { if (this.s) Save.save(this.s); });
    window.addEventListener('pageshow', () => audio.resume());
    window.addEventListener('keydown', (e) => {
      if (!this.s || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      const k = e.key;
      if (k === ' ') { e.preventDefault(); this.setSpeed(0); }
      else if (k === '1' || k === '2' || k === '3') this.setSpeed(+k);
      else if (k === 'c' || k === 'C' || k === 'n' || k === 'N') this.ui.openBook();
      else if (k === 'Escape') { if (this.ui.book.isOpen) this.ui.closeBook(); else if (this.ui.zone.isOpen) this.ui.closeZone(); }
      else if (k === '+' || k === '=') this.cam.zoomAt(this.cam.vw / 2, this.cam.vh / 2, 1.2);
      else if (k === '-') this.cam.zoomAt(this.cam.vw / 2, this.cam.vh / 2, 1 / 1.2);
      else if (k === 'ArrowLeft') this.cam.pan(60, 0);
      else if (k === 'ArrowRight') this.cam.pan(-60, 0);
      else if (k === 'ArrowUp') this.cam.pan(0, 60);
      else if (k === 'ArrowDown') this.cam.pan(0, -60);
    });
  }

  // ── Audio ──
  unlockAudio() {
    audio.unlock();
    if (audio.running && !this._audioStarted) {
      this._audioStarted = true;
      bso.onFail = () => { music.silent = false; };
      bso.start();
      this.applySettings(false);
      music.start();
      ambience.start();
    } else if (audio.running) bso.resume();
  }

  updateAudio() {
    const s = this.s;
    if (!s || !audio.running) return;
    const season = S.seasonIndex(s);
    music.setContext(season, s.hour, S.avgCons(s) < 30 ? 'sad' : 'calm');
    ambience.update(s);
    // Al atardecer, cada pocos días, alguien tararea lo que se sabe del tema
    if (s.hour >= 19 && s.hour < 19.6 && s.day - this.lastThemeDay >= 3 && !s.eventQueue.length) {
      this.lastThemeDay = s.day;
      this.playTheme(!!s.flags.revealed);
    }
  }

  playTheme(full) {
    if (!audio.running) return;
    const dur = music.playTheme(S.themeNotesKnown(this.s || S.createState(1)), full);
    if (dur) bso.duck(dur + 2);
  }

  testSound() {
    this.unlockAudio();
    setTimeout(() => { sfx('chime'); this.playTheme(false); }, 120);
  }

  audioStatus() {
    if (!audio.ctx) return 'El sonido se activa al tocar la pantalla.';
    return audio.running ? 'El sonido está activo.' : 'El navegador mantiene el sonido bloqueado: toca de nuevo.';
  }

  applySettings(persist = true) {
    const st = this.settings;
    audio.setVolume('music', st.music);
    audio.setVolume('ambience', st.ambience);
    audio.setVolume('sfx', st.sfx);
    audio.setLofi(st.lofi);
    music.setLofi(st.lofi);
    bso.setEnabled(st.bso !== false);
    music.silent = bso.enabled && !bso.failed;
    document.documentElement.classList.toggle('big-text', !!st.bigText);
    if (persist) this.persistSettings();
    if (this.ui) setTimeout(() => this.layout(), 50);
  }

  persistSettings() { Save.saveSettings(this.settings); }

  toggleFullscreen() {
    const d = document;
    if (!d.fullscreenElement && !d.webkitFullscreenElement) {
      const el = d.documentElement;
      (el.requestFullscreen || el.webkitRequestFullscreen || (() => {})).call(el);
      try { screen.orientation && screen.orientation.lock && screen.orientation.lock('any').catch(() => {}); } catch { /* nada */ }
    } else {
      (d.exitFullscreen || d.webkitExitFullscreen || (() => {})).call(d);
    }
  }

  // ── Guardado ──
  exportSave() {
    if (!this.s) return;
    // Dentro de un marco (p. ej. publicado en claude.ai) las descargas no funcionan: se copia el texto
    let framed = false;
    try { framed = window.self !== window.top; } catch { framed = true; }
    if (framed) { this.copySave(); return; }
    Save.exportFile(this.s);
    this.ui.toast('Partida exportada.', 'good');
  }

  copySave() {
    if (!this.s) return;
    const txt = Save.pack(this.s);
    const done = () => this.ui.toast('Partida copiada. Guárdala donde quieras.', 'good');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, () => this.ui.toast('No se pudo copiar.', 'bad'));
    else this.ui.toast('Tu navegador no deja copiar; usa «Exportar».', 'bad');
  }

  importSave(text) {
    const st = Save.unpack(text);
    this.start(st);
    this.ui.toast('Partida cargada.', 'good');
  }
}

export { WORLD, ITEM_BY_ID };
