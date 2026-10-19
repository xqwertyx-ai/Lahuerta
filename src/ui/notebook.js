// El cuaderno: diario, despensa y mercado, gente, recuerdos, huéspedes, álbum y ajustes.
import { h, clear, bar, btn, fmtMoney, fmtNum, lamina } from './dom.js';
import { PRODUCTS, MATERIALS, ANIMALS, CHANNELS } from '../data/products.js';
import { VOLUNTEER_BY_ID, TRAITS, SKILLS } from '../data/volunteers.js';
import { ZONES, ZONE_BY_ID } from '../data/zones.js';
import { ITEMS } from '../data/items.js';
import { FAMILY } from '../data/family.js';
import { MILESTONES } from '../data/milestones.js';
import { UPGRADES } from '../data/tourism.js';
import { THEME } from '../data/story.js';
import { BALANCE } from '../data/balance.js';
import {
  unitPrice, sell, sellBlocker, channelOpen, basketCapacity, buyMaterial, hireEmployee, fireEmployee, bedsTotal,
  assignVolunteer, threads, themeNotesKnown, hypothesesRanked, upgradeBlocker, buildUpgrade, capacity, guestCount,
  WEEKDAYS, daysToMarket, isMarketDay, costLabel, dailyJornales, volunteerJornales, activityBlocker, doActivity, ACTIVITIES,
} from '../sim/index.js';
import { drawIcon } from '../art/illus.js';
import { sfx } from '../audio/ambience.js';
import {
  troubles, damages, upcomingBills, heatingNeed, feedNeed, feedStock, winterEstimate, reserveDays, buyPrice, taxableProfit, DIFFICULTY, difficulty, seasonIndex,
} from '../sim/index.js';
import { repairCard } from './troubles.js';

const TABS = [
  ['diario', 'Diario'], ['despensa', 'Despensa'], ['cuentas', 'Cuentas'], ['gente', 'Gente'], ['recuerdos', 'Recuerdos'],
  ['huespedes', 'Huéspedes'], ['album', 'Álbum'], ['ajustes', 'Ajustes'],
];

export class Notebook {
  constructor(root, game) {
    this.game = game;
    this.root = root;
    this.el = null;
    this.tab = 'diario';
    this.channel = 'coop';
    this.key = '';
  }

  get isOpen() { return !!this.el; }

  open(tab) {
    if (tab) this.tab = tab;
    if (!this.el) {
      this.el = h('section', { class: 'book paper', role: 'dialog', 'aria-label': 'Cuaderno' });
      this.root.append(this.el);
    }
    sfx('page');
    this.render(true);
  }

  close() {
    if (this.el) { this.el.remove(); this.el = null; sfx('paper'); }
  }

  update(s) {
    if (!this.el || this.tab === 'ajustes') return;
    const key = [this.tab, s.day, Math.round(s.money), s.jornales, s.log.length, s.items.length, s.volunteers.length,
      JSON.stringify(s.products), JSON.stringify(s.materials), s.guests.length, s.upgrades.length, s.milestones.length, this.channel, JSON.stringify(s.damages || {}), (s.mods || []).length].join('|');
    if (key === this.key) return;
    this.render();
  }

  render(resetScroll = false) {
    const s = this.game.s;
    const page = this.el.querySelector('.page');
    const scroll = !resetScroll && page ? page.scrollTop : 0;
    clear(this.el);
    this.key = '';
    const tabs = h('nav', { class: 'tabs', role: 'tablist' }, TABS.map(([id, name]) => h('button', {
      class: 'tab' + (this.tab === id ? ' on' : ''), role: 'tab',
      onclick: () => { this.tab = id; sfx('page'); this.render(true); },
    }, name)));
    const body = h('div', { class: 'page' });
    this.el.append(btn('✕', () => this.game.ui.closeBook(), { cls: 'icon small close' }), tabs, body);
    try { this['page_' + this.tab](body, s); } catch (e) { console.error(e); body.append(h('p', {}, 'Esta página se ha emborronado.')); }
    body.scrollTop = scroll;
    this.key = [this.tab, s.day, Math.round(s.money), s.jornales, s.log.length, s.items.length, s.volunteers.length,
      JSON.stringify(s.products), JSON.stringify(s.materials), s.guests.length, s.upgrades.length, s.milestones.length, this.channel, JSON.stringify(s.damages || {}), (s.mods || []).length].join('|');
  }

  // ── Diario ──
  page_diario(el, s) {
    el.append(h('h2', {}, 'Diario de la finca'));
    const ul = h('ul', { class: 'log' });
    let day = -1;
    for (let i = s.log.length - 1; i >= 0; i--) {
      const l = s.log[i];
      if (l.d !== day) { day = l.d; ul.append(h('li', { class: 'day' }, `Día ${l.d}`)); }
      ul.append(h('li', { class: l.k }, l.t));
    }
    if (!s.log.length) ul.append(h('li', { class: 'diary' }, 'Página en blanco. Todavía.'));
    el.append(ul);
  }

  // ── Despensa y mercado ──
  page_despensa(el, s) {
    const g = this.game;
    el.append(h('h2', {}, 'Despensa y mercado'));
    const mk = isMarketDay(s) ? 'Hoy es jueves: el mercado de Fuente Obejuna está abierto.' : `El mercado abre los jueves (${daysToMarket(s) === 1 ? 'mañana' : `en ${daysToMarket(s)} días`}).`;
    el.append(h('p', { class: 'small muted' }, mk));
    const chans = h('div', { class: 'row' }, Object.entries(CHANNELS).map(([id, c]) => btn(c.name.replace(' de Fuente Obejuna', ''), () => { this.channel = id; this.render(); }, { cls: 'small' + (this.channel === id ? ' on' : '') })));
    el.append(chans, h('p', { class: 'small muted' }, CHANNELS[this.channel].desc + (this.channel === 'basket' && channelOpen(s, 'basket') ? ` Hoy aún quieren ${basketCapacity(s)}.` : '')));
    const tbl = h('table', { class: 'inv' }, h('tr', {}, h('th', {}, 'Producto'), h('th', {}, 'Tienes'), h('th', {}, 'Precio'), h('th', {}, '')));
    let any = true;
    const SECTIONS = { lechugas: 'De la huerta', higos: 'Frutales, monte y dehesa', huevos: 'De los animales', conservas: 'De la cocina' };
    for (const [k, p] of Object.entries(PRODUCTS)) {
      const q = Math.floor(s.products[k] || 0);
      if (SECTIONS[k]) tbl.append(h('tr', {}, h('td', { colspan: 4, style: { fontFamily: 'var(--title)', fontSize: '1.25em', paddingTop: '10px' } }, SECTIONS[k])));
      const price = unitPrice(s, k, this.channel);
      const why1 = sellBlocker(s, k, this.channel, 1);
      const whyAll = sellBlocker(s, k, this.channel, Math.max(1, this.channel === 'basket' ? Math.min(q, basketCapacity(s)) : q));
      const doSell = (n) => { const r = sell(s, k, n, this.channel); g.afterAction(r, null, 'coins'); this.render(); };
      tbl.append(h('tr', {},
        h('td', {}, p.name, h('div', { class: 'tiny muted' }, q ? p.unit + (p.spoil ? ' · fresco, se estropea' : '') : p.from || p.unit)),
        h('td', { class: 'num' }, q),
        h('td', { class: 'num' }, fmtMoney(price) + ' €'),
        h('td', {}, h('div', { class: 'row' },
          btn('1', () => doSell(1), { cls: 'small', disabled: q < 1 ? 'No tienes' : why1 }),
          btn('Todo', () => doSell(this.channel === 'basket' ? Math.min(q, basketCapacity(s)) : q), { cls: 'small', disabled: q < 1 ? 'No tienes' : whyAll })))));
    }
    if (!any) tbl.append(h('tr', {}, h('td', { colspan: 4, class: 'muted' }, 'La despensa está vacía. Cuida la finca y dará frutos.')));
    el.append(tbl);
    el.append(h('p', { class: 'tiny muted' }, 'Si vendes mucho de lo mismo en un sitio, el precio baja; se recupera en unos días.'));

    // Materiales
    const mt = h('table', { class: 'inv' }, h('tr', {}, h('th', {}, 'Material'), h('th', {}, 'Tienes'), h('th', {}, 'Comprar')));
    for (const [k, m] of Object.entries(MATERIALS)) mt.append(this._buyRow(s, k, m.name));
    el.append(h('div', { class: 'section' }, h('h3', {}, 'Materiales (cooperativa)'), mt,
      h('p', { class: 'tiny muted' }, 'La piedra también se recoge gratis en la dehesa; la leña, podando.')));

    // Animales
    const an = h('div', { class: 'pills' }, Object.entries(ANIMALS).map(([k, a]) => h('span', { class: 'pill' }, `${a.name}: ${s.animals[k] || 0}`)));
    el.append(h('div', { class: 'section' }, h('h3', {}, 'Animales'), an,
      h('p', { class: 'tiny muted' }, 'Se compran desde su zona en el plano (corral, dehesa, colmenar).')));
  }

  _buyRow(s, k, name) {
    const g = this.game;
    const p = buyPrice(s, k);
    return h('tr', {},
      h('td', {}, name),
      h('td', { class: 'num' }, fmtNum(s.materials[k] || 0, (s.materials[k] % 1) ? 1 : 0)),
      h('td', {}, h('div', { class: 'row' },
        btn(`1 · ${fmtMoney(p)} €`, () => { g.afterAction(buyMaterial(s, k, 1), null, 'coins'); this.render(); }, { cls: 'small', disabled: s.money < p ? 'No llega' : null }),
        btn(`5 · ${fmtMoney(p * 5)} €`, () => { g.afterAction(buyMaterial(s, k, 5), null, 'coins'); this.render(); }, { cls: 'small', disabled: s.money < p * 5 ? 'No llega' : null }))));
  }

  // ── Cuentas: lo roto, los avisos, las reservas y los pagos ──
  page_cuentas(el, s) {
    const g = this.game;
    el.append(h('h2', {}, 'Cuentas y avisos'));
    // Averías
    const ds = damages(s);
    const box = h('div', { class: 'tasks' });
    for (const d of ds) box.append(repairCard(g, s, d.id, () => this.render()));
    el.append(h('div', { class: 'section' }, h('h3', {}, 'Lo que está roto'),
      ds.length ? box : h('p', { class: 'small muted' }, 'Nada roto, de momento. Atender los avisos a tiempo sale más barato que arreglar.')));
    // Avisos de la economía
    const mods = troubles(s).filter((t) => t.kind !== 'damage');
    el.append(h('div', { class: 'section' }, h('h3', {}, 'Avisos'),
      mods.length ? h('div', {}, mods.map((t) => h('div', { class: 'trouble ' + (t.bad === false ? 'good' : 'bad') },
        h('b', {}, t.name), t.days ? h('span', { class: 'small muted' }, ` · ${t.days === 1 ? 'hoy acaba' : `${t.days} días más`}`) : null,
        h('div', { class: 'small' }, t.text))))
        : h('p', { class: 'small muted' }, 'Sin novedades en la comarca.')));
    // Reservas para el invierno
    const si = seasonIndex(s);
    const w = winterEstimate(s);
    const lenaNeed = heatingNeed(s);
    const fNeed = feedNeed(s);
    const lena = s.materials.lena || 0;
    const feed = feedStock(s);
    const foodKeys = Object.keys(PRODUCTS).filter((k) => PRODUCTS[k].food);
    const food = foodKeys.reduce((a, k) => a + Math.floor(s.products[k] || 0) * PRODUCTS[k].food, 0);
    const foodNeed = s.volunteers.length * BALANCE.foodFromFarmPerVolunteer;
    const line = (label, have, need, extra) => {
      const days = reserveDays(have, need);
      return [h('span', {}, label, extra ? h('div', { class: 'tiny muted' }, extra) : null),
        h('span', { class: 'num' + (need > 0 && days < 5 ? ' warn' : '') }, need > 0 ? `${fmtNum(have, 0)} · ${days === Infinity ? '∞' : days} días` : fmtNum(have, 0))];
    };
    const mt = h('table', { class: 'inv' });
    mt.append(this._buyRow(s, 'lena', 'Leña'), this._buyRow(s, 'pienso', 'Pienso y paja'));
    el.append(h('div', { class: 'section' }, h('h3', {}, 'Reservas para el invierno'),
      h('div', { class: 'reserve small' },
        ...line('Leña para la chimenea', lena, lenaNeed, lenaNeed ? `Se gastan ${fmtNum(lenaNeed, 1)} cargas al día` : `Para el invierno harán falta unas ${w.lena}`),
        ...line('Heno y pienso para los animales', feed, fNeed, fNeed ? `Comen ${fmtNum(fNeed, 1)} al día (el campo no da)` : (w.feed ? `Para el invierno harán falta unas ${w.feed}` : 'Sin animales que alimentar')),
        ...line('Comida de la finca para la gente', food, foodNeed, 'Conservas, embutido y queso aguantan; lo fresco se estropea')),
      h('p', { class: 'tiny muted' }, si === 3 ? 'En invierno la leña y la comida se pagan caras.' : 'La leña se recoge en el bosquete y podando; el heno se siega en la dehesa en primavera. En invierno todo cuesta más.'),
      mt));
    // Pagos
    const bills = upcomingBills(s);
    el.append(h('div', { class: 'section' }, h('h3', {}, 'Próximos pagos'),
      h('table', { class: 'inv' }, bills.map((b) => h('tr', {},
        h('td', {}, b.name, h('div', { class: 'tiny muted' }, b.every)),
        h('td', { class: 'num' }, b.days === 1 ? 'mañana' : `en ${b.days} días`),
        h('td', { class: 'num' }, `${fmtMoney(b.amount)} €`)))),
      h('p', { class: 'tiny muted' }, `Beneficio desde la última declaración: ${fmtMoney(Math.round(taxableProfit(s)))} €. Los gastos fijos suben con cada zona en marcha, cada habitación y cada animal.${s.flags.placas ? ' Las placas solares abaratan la luz.' : ''}`)));
  }

  // ── Gente ──
  page_gente(el, s) {
    const g = this.game;
    el.append(h('h2', {}, 'Gente de la finca'));
    el.append(h('p', { class: 'small' }, `Camas para voluntarios: ${s.volunteers.length} de ${bedsTotal(s)} (más camas cuanto mejor esté el cortijo). Jornales de hoy: ${dailyJornales(s)}.`));
    const grid = h('div', { class: 'grid' });
    for (const v of s.volunteers) {
      const info = VOLUNTEER_BY_ID[v.id];
      const trait = TRAITS[info.trait];
      const sel = h('select', { 'aria-label': 'Encargo', onchange: (e) => { assignVolunteer(s, v.id, e.target.value || null); sfx('pen'); this.render(); g.hud.update(s); } },
        h('option', { value: '' }, 'Ayuda donde haga falta (suma jornales)'),
        ZONES.filter((z) => s.zones[z.id].unlocked).map((z) => h('option', { value: z.id, selected: v.zone === z.id }, `Se encarga de: ${z.name}`)));
      grid.append(h('div', { class: 'card' },
        h('h3', {}, info.name),
        h('div', { class: 'small muted' }, `De ${info.origin} · sabe de ${SKILLS[info.skill]} · ${trait.name.toLowerCase()} (${trait.desc.toLowerCase()})`),
        h('p', { class: 'small' }, info.story),
        h('p', { class: 'small' }, `«${info.lines[(s.day + info.name.length) % info.lines.length]}»`),
        h('div', { class: 'statline small' }, h('span', {}, 'Contento'), h('span', {}, Math.round(v.happy))),
        bar(v.happy, v.happy >= 60 ? 'green' : ''),
        h('div', { class: 'small muted' }, `Se queda ${Math.max(0, v.leaves - s.day)} días más · ${volunteerJornales(v)} jornales al día`),
        v.lastWork && v.zone ? h('div', { class: 'tiny muted' }, `Esta mañana: ${v.lastWork}.`) : null,
        h('div', { style: { marginTop: '6px' } }, sel)));
    }
    if (!s.volunteers.length) grid.append(h('div', { class: 'card faded' }, h('p', {}, 'Ahora mismo no hay voluntarios. Llegan si hay cama libre y la finca tiene buena fama.')));
    el.append(grid);
    this._leisure(el, s);
    // Jornaleros
    el.append(h('div', { class: 'section' }, h('h3', {}, 'Jornaleros del pueblo'),
      h('p', { class: 'small' }, `Tienes ${s.employees}. Cada uno cuesta ${BALANCE.employeeWagePerDay} € al día y aporta ${BALANCE.employeeJornales} jornales.`),
      h('div', { class: 'row' },
        btn('Contratar', () => { g.afterAction(hireEmployee(s)); this.render(); }, { cls: 'small' }),
        btn('Despedir', () => { g.afterAction(fireEmployee(s)); this.render(); }, { cls: 'small', disabled: s.employees ? null : 'No hay nadie' }))));
    const gone = s.volunteersSeen.filter((id) => !s.volunteers.some((v) => v.id === id));
    if (gone.length) {
      el.append(h('div', { class: 'section' }, h('h3', {}, 'Pasaron por aquí'),
        h('div', { class: 'pills' }, gone.map((id) => h('span', { class: 'pill' }, `${VOLUNTEER_BY_ID[id].name}${s.flags['contento_' + id] ? ' ♥' : ''}`)))));
    }
  }

  _leisure(el, s) {
    const g = this.game;
    const grid = h('div', { class: 'tasks' });
    for (const a of ACTIVITIES) {
      const why = activityBlocker(s, a.id);
      const cost = Object.entries(a.cost).map(([k, v]) => (k === 'food' ? `${v} de comida de la finca` : costLabel({ [k]: v }))).join(' · ');
      grid.append(h('div', { class: 'task' },
        h('div', { class: 'info' },
          h('div', { class: 'name' }, a.name),
          h('div', { class: 'meta' }, `${cost} → +${a.happy} alegría de los voluntarios, +${a.mood} ánimo`),
          why ? h('div', { class: 'why' }, why) : null),
        btn('Hacer', () => { g.afterAction(doActivity(s, a.id), null, 'chime'); this.render(); }, { disabled: why })));
    }
    el.append(h('div', { class: 'section' }, h('h3', {}, 'Ratos libres'),
      h('p', { class: 'small muted' }, 'Arte, música y sobremesas: suben el ánimo de la casa y la alegría de quien está de voluntario (y quien se va contento, recomienda la finca).'), grid));
  }

  // ── Recuerdos y misterio ──
  page_recuerdos(el, s) {
    const g = this.game;
    el.append(h('h2', {}, 'Recuerdos y el pianista'));
    // Tema
    const known = themeNotesKnown(s);
    const cv = h('canvas', { class: 'staff' });
    el.append(h('div', { class: 'card' },
      h('h3', {}, 'El tema del pianista'),
      h('p', { class: 'small muted' }, s.flags.revealed ? 'Completo. Por fin.' : `Conoces ${known} de ${THEME.length} notas. Cada partitura añade unas cuantas.`),
      cv,
      h('div', { class: 'row' }, btn('♪ Escuchar lo que hay', () => g.playTheme(false), { cls: 'small' }))));
    requestAnimationFrame(() => drawStaff(cv, known, s.flags.revealed));
    // Hipótesis
    const hyps = hypothesesRanked(s);
    el.append(h('div', { class: 'section' }, h('h3', {}, '¿Quién era el pianista?'),
      ...hyps.map((hy, i) => h('div', { class: 'hyp' + (hy.discarded ? ' discarded' : '') },
        h('span', { class: 't' }, `${i === 0 && !hy.discarded && s.items.length ? '→ ' : ''}${hy.title}`),
        h('div', { class: 'small muted' }, hy.text))),
      h('p', { class: 'tiny muted' }, 'Las pistas que encuentras inclinan la balanza. Lo tachado, de momento, no encaja.')));
    // Hilos
    const th = threads(s);
    el.append(h('div', { class: 'section' }, h('h3', {}, 'Hilos'),
      h('div', { class: 'pills' }, th.map((t) => h('span', { class: 'pill' }, `${t.name}: ${t.found}/${t.total}`)))));
    // Familia
    el.append(h('div', { class: 'section' }, h('h3', {}, 'La familia'),
      h('div', { class: 'grid' }, FAMILY.map((f) => h('div', { class: 'card' }, h('h3', {}, f.name), h('p', { class: 'small' }, f.intro))))));
    // Objetos
    const grid = h('div', { class: 'grid' });
    for (const it of ITEMS) {
      const have = s.items.includes(it.id);
      if (!have) continue;
      let icon = h('canvas', { class: 'icon-cv' });
      drawIcon(icon, it.icon, 64);
      if (it.image) {
        const fb = icon;
        icon = lamina(it, fb, 'lamina');
        icon.addEventListener('click', () => this.game.ui.showLamina(it));
        icon.title = 'Verla en grande';
      }
      grid.append(h('div', { class: 'card' + (it.image ? ' wide' : '') }, icon, h('h3', {}, it.name), h('p', { class: 'small' }, it.text),
        h('div', { class: 'tiny muted' }, it.zone ? `Encontrado en: ${ZONE_BY_ID[it.zone].name}` : 'Llegó por su cuenta')));
    }
    const missing = ITEMS.length - s.items.length;
    if (missing) grid.append(h('div', { class: 'card faded' }, h('h3', {}, `${missing} por encontrar`), h('p', { class: 'small' }, 'Cada zona guarda sus recuerdos: aparecen, de uno en uno, cuando la dejas al 100 %. El gato también ayuda.')));
    el.append(h('div', { class: 'section' }, h('h3', {}, 'Objetos'), grid));
  }

  // ── Huéspedes ──
  page_huespedes(el, s) {
    const g = this.game;
    el.append(h('h2', {}, 'Agroturismo'));
    if (!s.flags.tourism) {
      const u = BALANCE.tourismUnlock;
      el.append(h('p', {}, 'Cuando el cortijo esté cuidado y la finca tenga algo de fama, podrás recibir huéspedes.'),
        h('div', { class: 'statline' }, h('span', {}, `Cortijo (${u.cortijo})`), h('span', {}, Math.round(s.zones.cortijo.cons))), bar(s.zones.cortijo.cons / u.cortijo * 100),
        h('div', { class: 'statline' }, h('span', {}, `Reputación (${u.reputation})`), h('span', {}, Math.round(s.rep))), bar(s.rep / u.reputation * 100));
      return;
    }
    el.append(h('p', { class: 'small' }, `Plazas: ${capacity(s)} · huéspedes ahora: ${guestCount(s)} · conciertos: ${s.stats.concerts} · huéspedes en total: ${s.stats.guests}`));
    const grid = h('div', { class: 'grid' });
    for (const u of UPGRADES) {
      const done = s.upgrades.includes(u.id);
      const why = done ? null : upgradeBlocker(s, u.id);
      grid.append(h('div', { class: 'card' + (done ? '' : why ? ' faded' : '') },
        h('h3', {}, u.name),
        h('p', { class: 'small' }, u.desc),
        h('div', { class: 'tiny muted' }, (u.capacity ? `${u.capacity} plazas · ` : '') + (u.price ? `${u.price} € por huésped · ` : '') + `atractivo +${u.appeal}`),
        done ? h('span', { class: 'stamp' }, 'Hecho') : h('div', {},
          h('div', { class: 'tiny' }, costLabel(u.cost)),
          why ? h('div', { class: 'tiny', style: { color: 'var(--red)' } }, why) : null,
          btn('Construir', () => { g.afterAction(buildUpgrade(s, u.id), null, 'tools'); this.render(); }, { cls: 'small', disabled: why }))));
    }
    el.append(grid);
  }

  // ── Álbum ──
  page_album(el, s) {
    el.append(h('h2', {}, 'Álbum de hitos'));
    const grid = h('div', { class: 'grid' });
    for (const m of MILESTONES) {
      const done = s.milestones.includes(m.id);
      grid.append(h('div', { class: 'card' + (done ? '' : ' faded') },
        h('div', { class: 'row between' }, h('h3', {}, m.name), done ? h('span', { class: 'stamp' }, '✓') : null),
        h('p', { class: 'small' }, done ? m.text : '…')));
    }
    el.append(grid);
    const st = s.stats;
    el.append(h('div', { class: 'section' }, h('h3', {}, 'Cuentas del cuaderno'),
      h('p', { class: 'small' }, `Días: ${s.day} · tareas: ${st.tasks} · ganado: ${fmtMoney(Math.round(st.earned))} € · gastado: ${fmtMoney(Math.round(st.spent))} € · voluntarios: ${st.volunteersArrived} · zonas restauradas alguna vez: ${st.restored} · recuerdos: ${s.items.length}/${ITEMS.length}`)));
  }

  // ── Ajustes ──
  page_ajustes(el) {
    const g = this.game;
    const st = g.settings;
    el.append(h('h2', {}, 'Ajustes'));
    const slider = (key, label) => {
      const inp = h('input', { type: 'range', min: 0, max: 1, step: 0.05, value: st[key], 'aria-label': label,
        oninput: (e) => { st[key] = +e.target.value; g.applySettings(); } });
      return h('label', { class: 'setting' }, h('span', {}, label), h('span', { style: { flex: 1, maxWidth: '55%' } }, inp));
    };
    const check = (key, label, after) => h('label', { class: 'setting' }, h('span', {}, label),
      h('input', { type: 'checkbox', checked: !!st[key], onchange: (e) => { st[key] = e.target.checked; g.applySettings(); after && after(); } }));
    el.append(
      h('h3', {}, 'Sonido'),
      slider('music', 'Música'), slider('ambience', 'Ambiente'), slider('sfx', 'Efectos'),
      check('bso', 'Banda sonora grabada (si no, piano generativo)'),
      check('lofi', 'Capa lo-fi (vinilo, ritmo suave, cinta)'),
      h('div', { class: 'row', style: { margin: '8px 0' } }, btn('Probar sonido', () => g.testSound(), { cls: 'small' }),
        h('span', { class: 'small muted' }, g.audioStatus())),
      h('h3', {}, 'Juego'),
      check('pauseBook', 'Pausar el tiempo al abrir el cuaderno'),
      check('names', 'Mostrar el nombre de los voluntarios en el plano'),
      check('bigText', 'Letra más grande'),
      h('div', { class: 'row', style: { margin: '8px 0' } }, btn('Pantalla completa', () => g.toggleFullscreen(), { cls: 'small' })),
      h('h3', {}, 'Dificultad'),
      h('div', { class: 'row' }, Object.entries(DIFFICULTY).map(([id, d]) => btn(d.name, () => { g.s.cfg.difficulty = id; sfx('pen'); this.render(); }, { cls: 'small' + ((g.s.cfg.difficulty || 'normal') === id ? ' on' : '') }))),
      h('p', { class: 'small muted' }, difficulty(g.s).desc + ' Se puede cambiar en cualquier momento.'),
      h('h3', {}, 'Partida'),
      h('p', { class: 'small muted' }, 'Se guarda sola cada día de juego y al salir. Puedes llevarte una copia.'),
      h('div', { class: 'row' },
        btn('Exportar partida', () => g.exportSave(), { cls: 'small' }),
        btn('Copiar al portapapeles', () => g.copySave(), { cls: 'small' }),
        btn('Importar partida', () => g.ui.importDialog(), { cls: 'small' })),
      h('div', { class: 'row', style: { marginTop: '10px' } }, btn('Empezar un cuaderno nuevo', () => g.ui.confirm('¿Empezar de cero? La partida actual se perderá (expórtala antes si quieres conservarla).', () => g.newGame()), { cls: 'small' })),
      h('h3', { style: { marginTop: '14px' } }, 'Acerca de'),
      h('p', { class: 'small' }, 'La Huerta del Pianista. Una finca real de Ojuelos Bajos (Fuente Obejuna), dibujada a mano por código. Música generada en tu navegador.'),
      h('p', { class: 'tiny muted' }, 'Atajos: espacio = pausa · 1/2/3 = velocidad · C = cuaderno · Esc = cerrar · + / − = zoom.'),
    );
  }
}

// Pentagrama con las notas conocidas del tema
export function drawStaff(cv, known, full) {
  const w = cv.clientWidth || 600, hgt = 90;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = w * dpr; cv.height = hgt * dpr;
  const c = cv.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.strokeStyle = 'rgba(59,42,28,0.6)';
  c.lineWidth = 1;
  const top = 22, gap = 8;
  for (let i = 0; i < 5; i++) {
    c.beginPath();
    for (let x = 8; x <= w - 8; x += 12) c.lineTo(x, top + i * gap + Math.sin(x * 0.05 + i) * 0.6);
    c.stroke();
  }
  // Clave de sol estilizada
  c.font = '44px serif';
  c.fillStyle = 'rgba(59,42,28,0.8)';
  c.fillText('𝄞', 8, top + 36);
  const steps = { 62: -1, 64: 0, 65: 1, 67: 2, 69: 3, 70: 3.5, 71: 4, 72: 5, 73: 5.5, 74: 6, 76: 7, 77: 8 };
  const n = THEME.length;
  const x0 = 46, dx = (w - x0 - 14) / n;
  THEME.forEach(([m], i) => {
    const st = steps[m] ?? 3;
    const y = top + 4 * gap - st * (gap / 2);
    const x = x0 + i * dx + dx / 2;
    if (i < known || full) {
      c.fillStyle = 'rgba(59,42,28,0.9)';
      c.beginPath(); c.ellipse(x, y, 4.2, 3.2, -0.35, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(x + 3.6, y); c.lineTo(x + 3.6, y - 20); c.stroke();
    } else {
      c.strokeStyle = 'rgba(138,123,106,0.5)';
      c.setLineDash([2, 2]);
      c.beginPath(); c.ellipse(x, y, 4.2, 3.2, -0.35, 0, Math.PI * 2); c.stroke();
      c.setLineDash([]);
      c.strokeStyle = 'rgba(59,42,28,0.6)';
    }
  });
  if (!full && known < n) {
    c.fillStyle = 'rgba(138,123,106,0.8)';
    c.font = '16px Caveat, cursive';
    c.fillText('…', x0 + known * dx + dx * 0.2, top + 52);
  }
}

export { WEEKDAYS };
