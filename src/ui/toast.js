// Notas emergentes sujetas al borde del cuaderno.
import { h } from './dom.js';

export class Toasts {
  constructor(root) {
    this.el = h('div', { class: 'toasts', 'aria-live': 'polite' });
    root.append(this.el);
  }

  show(text, kind = 'info', ms = 4200) {
    const t = h('div', { class: `toast paper ${kind}` }, text);
    this.el.append(t);
    while (this.el.children.length > 3) this.el.firstChild.remove();
    setTimeout(() => {
      t.classList.add('out');
      setTimeout(() => t.remove(), 450);
    }, ms);
  }
}
