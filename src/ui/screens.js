// Diálogos de eventos, confirmaciones, importación, portada, introducción y la finca dormida.
import { h, clear, btn } from './dom.js';
import { drawIllus, drawTitleArt } from '../art/illus.js';
import { INTRO, SLEEP } from '../data/texts.js';
import { sfx } from '../audio/ambience.js';

export function modal(root, content, { onClose = null, closable = false } = {}) {
  const card = h('div', { class: 'modal paper', role: 'dialog' }, content);
  const back = h('div', { class: 'modal-back' }, card);
  if (closable) back.addEventListener('click', (e) => { if (e.target === back) close(); });
  root.append(back);
  function close() { back.remove(); onClose && onClose(); }
  return { back, card, close };
}

// Evento: ilustración, texto y opciones
export function eventDialog(root, view, season, onChoose) {
  const cv = h('canvas', { class: 'illus', width: 360, height: 210 });
  const text = h('p', { class: 'text' }, view.text);
  const opts = h('div', { class: 'opts' });
  const content = h('div', {}, h('h2', {}, view.title), cv, text, opts);
  const m = modal(root, content);
  sfx('paper');
  drawIllus(cv, view.illus, season);
  let page = 0;
  const showOptions = () => {
    clear(opts);
    view.options.forEach((o, i) => {
      const b = btn([h('span', {}, o.label), o.cost ? h('span', { class: 'cost' }, o.cost) : null, o.disabled ? h('span', { class: 'why' }, o.disabled) : null], () => {
        sfx('pen');
        m.close();
        onChoose(i);
      }, { disabled: o.disabled });
      opts.append(b);
    });
  };
  if (view.pages && view.pages.length > 1) {
    const next = () => {
      page++;
      text.textContent = view.pages[page];
      sfx('page');
      if (page >= view.pages.length - 1) showOptions();
      else { clear(opts); opts.append(btn('Seguir', next)); }
    };
    opts.append(btn('Seguir', next));
  } else {
    showOptions();
  }
  return m;
}

export function confirmDialog(root, text, onYes) {
  const m = modal(root, h('div', {},
    h('p', { class: 'text' }, text),
    h('div', { class: 'opts' },
      btn('Sí', () => { m.close(); onYes(); }, { cls: 'primary' }),
      btn('Mejor no', () => m.close()))), { closable: true });
}

export function importDialog(root, onImport) {
  const ta = h('textarea', { placeholder: 'Pega aquí el texto de una partida exportada…' });
  const err = h('p', { class: 'small', style: { color: 'var(--red)' } });
  const file = h('input', { type: 'file', accept: '.json,application/json,text/plain', style: { display: 'none' },
    onchange: async (e) => { const f = e.target.files[0]; if (f) { ta.value = await f.text(); } } });
  const m = modal(root, h('div', {},
    h('h2', {}, 'Importar partida'),
    h('p', { class: 'small' }, 'Elige un archivo .json exportado o pega su contenido.'),
    file,
    h('div', { class: 'row' }, btn('Elegir archivo', () => file.click(), { cls: 'small' })),
    ta, err,
    h('div', { class: 'opts' },
      btn('Cargar', () => {
        try { onImport(ta.value.trim()); m.close(); } catch (e) { err.textContent = e.message; }
      }, { cls: 'primary' }),
      btn('Cancelar', () => m.close()))), { closable: true });
}

// Portada
export function titleScreen(root, { hasSave, savedText, onContinue, onNew, onImport, season }) {
  const art = h('canvas', { class: 'art' });
  const menu = h('div', { class: 'menu' });
  if (hasSave) menu.append(btn(['Continuar', savedText ? h('span', { class: 'tiny muted' }, savedText) : null], onContinue, { cls: 'primary' }));
  menu.append(btn('Nuevo cuaderno', onNew, { cls: hasSave ? '' : 'primary' }));
  menu.append(btn('Importar partida', onImport));
  const el = h('div', { class: 'screen paper' },
    art,
    h('div', {},
      h('h1', {}, 'La Huerta del Pianista'),
      h('p', { class: 'sub' }, 'Una finca en Ojuelos Bajos. Encinas, granito y una melodía incompleta.'),
      menu,
      h('p', { class: 'tiny muted', style: { marginTop: '12px' } }, 'Mejor con sonido. Se juega con el dedo o el ratón.')));
  root.append(el);
  requestAnimationFrame(() => {
    const r = art.getBoundingClientRect();
    drawTitleArt(art, Math.max(200, r.width), Math.max(120, r.height), season);
  });
  return el;
}

// Introducción breve antes de empezar
export function introScreen(root, onDone) {
  const lines = h('div', { class: 'lines' }, INTRO.map((t, i) => h('p', { style: { animationDelay: `${0.3 + i * 1.4}s` } }, t)));
  const go = btn('Abrir el cuaderno', () => { el.remove(); onDone(); }, { cls: 'primary' });
  go.style.opacity = '0';
  go.style.animation = `lineIn 1s ${0.3 + INTRO.length * 1.4}s forwards`;
  const skip = h('button', { class: 'link tiny', onclick: () => { el.remove(); onDone(); } }, 'saltar');
  const el = h('div', { class: 'screen paper' }, h('div', {}, h('h1', {}, 'Primera página'), lines, h('div', { class: 'menu', style: { margin: '18px auto 0' } }, go, skip)));
  root.append(el);
  return el;
}

// La finca se duerme
export function sleepScreen(root, kind, { canRetry, onRetry, onRestart }) {
  const t = SLEEP[kind] || SLEEP.abandon;
  const lines = h('div', { class: 'lines' }, t.lines.map((l, i) => h('p', { style: { animationDelay: `${0.4 + i * 1.5}s` } }, l)));
  const menu = h('div', { class: 'menu', style: { margin: '18px auto 0', opacity: 0, animation: `lineIn 1s ${0.4 + t.lines.length * 1.5}s forwards` } },
    canRetry ? btn(SLEEP.retry, onRetry, { cls: 'primary' }) : null,
    btn(SLEEP.restart, onRestart));
  const el = h('div', { class: 'screen paper' }, h('div', {}, h('h1', {}, t.title), lines, menu));
  root.append(el);
  return el;
}
