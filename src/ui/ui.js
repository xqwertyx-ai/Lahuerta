// Coordinador de la interfaz: HUD, panel de zona, cuaderno, notas y diálogos.
import { h } from './dom.js';
import { Hud } from './hud.js';
import { ZonePanel } from './zonePanel.js';
import { Notebook } from './notebook.js';
import { Toasts } from './toast.js';
import { eventDialog, confirmDialog, importDialog, modal } from './screens.js';
import { drawIcon } from '../art/illus.js';
import { ITEM_BY_ID } from '../data/items.js';
import { TIPS } from '../data/texts.js';
import { sfx } from '../audio/ambience.js';
import { btn } from './dom.js';

export class UI {
  constructor(game) {
    this.game = game;
    this.root = document.getElementById('ui');
    this.layer = h('div', { class: 'game-ui' });
    this.root.append(this.layer);
    this.hud = new Hud(this.layer, game);
    this.zone = new ZonePanel(this.layer, game);
    this.book = new Notebook(this.layer, game);
    this.toasts = new Toasts(this.layer);
    this.modalOpen = null;
    this.noteQueue = [];
    this.hint = h('div', { class: 'hint paper', style: { opacity: 0 } });
    this.layer.append(this.hint);
    this.tipIndex = 0;
    this.tipTimer = 6;
  }

  destroy() { this.layer.remove(); }

  get blocking() { return !!this.modalOpen; }

  openZone(id) {
    this.zone.open(id);
    this.game.map.selected = id;
    sfx('paper');
    this.game.layout();
  }

  closeZone() {
    this.zone.close();
    this.game.map.selected = null;
    this.game.layout();
  }

  openBook(tab) {
    if (this.book.isOpen && !tab) { this.closeBook(); return; }
    this.book.open(tab);
  }

  closeBook() { this.book.close(); }

  toast(text, kind) { this.toasts.show(text, kind); }

  confirm(text, yes) { confirmDialog(this.layer, text, yes); }

  importDialog() { importDialog(this.layer, (txt) => this.game.importSave(txt)); }

  // Evento de la simulación
  showEvent(view, season, onChoose) {
    if (this.modalOpen) return false;
    this.modalOpen = eventDialog(this.layer, view, season, (i) => { this.modalOpen = null; onChoose(i); });
    return true;
  }

  // Notas de recuerdos encontrados: una cada vez
  queueItemNote(id) { this.noteQueue.push(id); }

  pumpNotes() {
    if (this.modalOpen || !this.noteQueue.length) return;
    const id = this.noteQueue.shift();
    const it = ITEM_BY_ID[id];
    if (!it) return;
    const cv = h('canvas', { style: { display: 'block', margin: '6px auto' } });
    drawIcon(cv, it.icon, 96);
    const m = modal(this.layer, h('div', {},
      h('h2', {}, 'Un recuerdo'),
      cv,
      h('h3', { style: { textAlign: 'center', fontSize: '1.5em' } }, it.name),
      h('p', { class: 'text' }, it.text),
      h('div', { class: 'opts' },
        btn('Guardarlo en el cuaderno', () => { this.modalOpen = null; m.close(); sfx('pen'); }, { cls: 'primary' }),
        it.score ? btn('♪ Probar las notas nuevas', () => { this.game.playTheme(false); }) : null)));
    this.modalOpen = m;
    sfx('item');
  }

  // Consejos para empezar
  tick(dt) {
    if (this.tipIndex >= TIPS.length || this.game.settings.seenTips > this.tipIndex + 0) {
      this.tipIndex = Math.max(this.tipIndex, this.game.settings.seenTips);
    }
    if (this.tipIndex >= TIPS.length) return;
    this.tipTimer -= dt;
    if (this.tipTimer <= 0) {
      if (this.hint.style.opacity === '1') {
        this.hint.style.opacity = '0';
        this.tipIndex++;
        this.game.settings.seenTips = this.tipIndex;
        this.game.persistSettings();
        this.tipTimer = 30;
      } else if (!this.modalOpen && !this.book.isOpen && !this.zone.isOpen) {
        this.hint.textContent = TIPS[this.tipIndex];
        this.hint.style.opacity = '1';
        this.tipTimer = 9;
      }
    }
  }

  update(s) {
    if (this.zone.isOpen && this.hint.style.opacity === '1') { this.hint.style.opacity = '0'; this.tipTimer = 4; }
    this.hud.update(s);
    this.zone.update(s);
    this.book.update(s);
  }
}
