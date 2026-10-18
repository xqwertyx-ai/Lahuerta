// Barra superior: fecha, hora, tiempo, recursos y velocidad.
import { h, fmtMoney } from './dom.js';
import { WEATHER } from '../data/seasons.js';
import { dateLabel, clockLabel, daysToMarket, isMarketDay } from '../sim/calendar.js';
import { dailyJornales } from '../sim/people.js';

export class Hud {
  constructor(root, game) {
    this.game = game;
    this.el = h('div', { class: 'hud paper', role: 'banner' });
    this.clock = h('div', { class: 'clock' });
    this.date = h('div', { class: 'date' });
    this.weather = h('div', { class: 'weather' });
    const when = h('div', { class: 'when' }, this.clock, this.date, this.weather);
    this.money = this._chip('€', 'dinero');
    this.jorn = this._chip('', 'jornales');
    this.mood = this._chip('', 'ánimo');
    this.rep = this._chip('', 'reputación');
    this.res = h('div', { class: 'res' }, this.money.el, this.jorn.el, this.mood.el, this.rep.el);
    this.speedBtns = [0, 1, 2, 3].map((v) => h('button', {
      'aria-label': v ? `Velocidad x${v}` : 'Pausa',
      onclick: () => { game.setSpeed(v); },
    }, v === 0 ? '❚❚' : '▶'.repeat(v)));
    const speed = h('div', { class: 'speed' }, this.speedBtns);
    const book = h('button', { class: 'btn icon', 'aria-label': 'Abrir el cuaderno', onclick: () => game.ui.openBook() }, '✎ Cuaderno');
    this.bookBtn = book;
    this.el.append(when, this.res, h('div', { class: 'ctrl' }, speed, book));
    root.append(this.el);
    this.last = '';
  }

  _chip(prefix, label) {
    const b = h('b');
    const el = h('span', { class: 'chip', title: label }, b, h('span', { class: 'lab' }, label));
    return { el, b, prefix };
  }

  update(s) {
    const w = WEATHER[s.weather] || WEATHER.sol;
    const market = isMarketDay(s) ? ' · hoy hay mercado' : daysToMarket(s) === 1 ? ' · mañana, mercado' : '';
    const key = [Math.floor(s.hour * 6), s.day, s.weather, Math.round(s.money), s.jornales, Math.round(s.mood), Math.round(s.rep), this.game.speed, this.game.paused].join('|');
    if (key === this.last) return;
    this.last = key;
    this.clock.textContent = clockLabel(s.hour);
    this.date.textContent = dateLabel(s);
    this.weather.textContent = `${w.icon} ${w.name}${market}`;
    this.money.b.textContent = fmtMoney(Math.round(s.money)) + ' €';
    this.money.el.classList.toggle('neg', s.money < 0);
    this.money.el.querySelector('.lab').textContent = 'dinero';
    const max = Math.max(s.jornales, dailyJornales(s));
    const full = Math.max(0, Math.floor(s.jornales));
    this.jorn.b.innerHTML = `<span class="dots">${'●'.repeat(Math.min(full, 12))}${'○'.repeat(Math.max(0, Math.min(12, max) - Math.min(full, 12)))}</span>`;
    this.mood.b.textContent = Math.round(s.mood);
    this.mood.el.classList.toggle('neg', s.mood < 30);
    this.rep.b.textContent = Math.round(s.rep);
    const sp = this.game.paused ? 0 : this.game.speed;
    this.speedBtns.forEach((b, i) => b.classList.toggle('on', i === sp));
  }

  height() { return this.el.getBoundingClientRect().height; }
}
