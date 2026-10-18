// Motor de eventos: elige, encola y resuelve eventos definidos en data/events.js.
import { BALANCE } from '../data/balance.js';
import { EVENTS, EVENT_BY_ID } from '../data/events.js';
import { REVELATION } from '../data/story.js';
import { CAT_GIFTS, POSTCARDS } from '../data/texts.js';
import { PRODUCTS } from '../data/products.js';
import { ITEM_BY_ID } from '../data/items.js';
import { VOLUNTEER_BY_ID } from '../data/volunteers.js';
import { rand, chance, randInt, pick, weighted } from './rng.js';
import { seasonIndex, isSeasonStart, yearOf } from './calendar.js';
import { breakDown, canBreak, addMod, difficulty, taxDue, damageOf, stopped, takeLoan } from './hardship.js';
import { BILLS, DAMAGES } from '../data/hardships.js';
import { addLog, signal, clamp, canAfford, payCost, applyEffects, addStock, costLabel, missingOf, labelOf } from './effects.js';
import { avgCons, avgWeeds } from './farm.js';
import { giveItem, clue } from './mystery.js';
import { sellAllAt } from './economy.js';
import { departVolunteer, infoOf } from './people.js';
import { concert } from './tourism.js';

// Evento sintético de la revelación (sus textos están en story.js)
const REVELATION_EVENT = {
  id: 'revelacion', title: REVELATION.title, illus: 'revelacion', weight: 0,
  text: REVELATION.pages[0],
  pages: REVELATION.pages,
  options: [{
    label: 'Escuchar hasta el final',
    apply: (s) => {
      s.flags.revealed = true;
      signal(s, 'theme', { full: true, reveal: true });
      if (REVELATION.truth) addLog(s, `✎ El pianista: ${REVELATION.truth}`, 'family');
    },
    result: 'El tema del pianista ha sonado entero. La finca sigue; el cuaderno, también.',
  }],
};

export function eventDef(id) {
  if (id === 'revelacion') return REVELATION_EVENT;
  return EVENT_BY_ID[id];
}

// ── Elegibilidad ──
function eligible(s, e, h) {
  if (!e.weight) return false;
  if (e.seasons && !e.seasons.includes(seasonIndex(s))) return false;
  if (e.minDay && s.day < e.minDay) return false;
  const last = s.eventLast[e.id];
  if (e.once && last != null) return false;
  if (last != null && e.cooldown && s.day - last < e.cooldown) return false;
  if (e.cond && !e.cond(s, h)) return false;
  return true;
}

export function eligibleEvents(s) {
  const h = helpers(s);
  return EVENTS.filter((e) => eligible(s, e, h));
}

// Los contratiempos pesan más cada año y según la dificultad
export function crisisFactor(s) {
  return difficulty(s).crisis * (1 + (yearOf(s) - 1) * BALANCE.crisisGrowthPerYear);
}

function eventWeight(s, e) { return e.weight * (e.crisis ? crisisFactor(s) : 1); }

// ¿Alguna opción cuesta jornales? Entonces llega al amanecer, con el día por delante
export function needsJornales(e) { return e.options.some((o) => o.cost && o.cost.jornales); }

// Al amanecer se decide el evento del día. Si pide jornales, sale ya; si no, a una hora cualquiera.
export function planDay(s) {
  s.todayEvent = null;
  if (s.day - s.lastEventDay < BALANCE.eventMinGapDays) return;
  if (s.day < 2) return;
  if (!chance(s, BALANCE.eventChancePerDay)) return;
  const h = helpers(s);
  const list = EVENTS.filter((e) => eligible(s, e, h));
  const id = weighted(s, list.map((e) => [e.id, eventWeight(s, e)]));
  if (!id) return;
  const e = EVENT_BY_ID[id];
  const hour = e.when === 'tarde' ? 19 : needsJornales(e) ? BALANCE.dawnHour : randInt(s, 9, 17);
  s.todayEvent = { hour, id };
}

export function hourEvents(s, hour) {
  if (s.todayEvent && hour >= s.todayEvent.hour) {
    const { id } = s.todayEvent;
    s.todayEvent = null;
    const e = id && EVENT_BY_ID[id];
    if (e && (!e.cond || e.cond(s, helpers(s)))) queueEvent(s, id);
  }
}

export function queueEvent(s, id) {
  if (s.eventQueue.includes(id)) return;
  s.eventQueue.push(id);
  s.eventLast[id] = s.day;
  s.lastEventDay = s.day;
  signal(s, 'event', { id });
}

export function fireRisk(s) {
  const si = seasonIndex(s);
  if (si !== 1 && si !== 2) return 0;
  let p = BALANCE.fireBaseRisk + avgWeeds(s) * BALANCE.fireWeedFactor;
  if (s.weather === 'calor') p += BALANCE.fireHeatBonus;
  if (si === 2) p *= 0.4;
  if (s.zones.alberca.unlocked) p *= 1 - s.zones.alberca.cons / 300;
  if (s.water > 60) p *= 0.7;
  return Math.max(0, p);
}

// Eventos que dispara la propia simulación cada amanecer
export function systemEvents(s) {
  const last = s.eventLast.incendio;
  if ((last == null || s.day - last > 25) && chance(s, fireRisk(s))) queueEvent(s, 'incendio');
  const lastCat = s.eventLast.gato;
  if (s.day > 3 && (lastCat == null || s.day - lastCat >= 3) && chance(s, BALANCE.catFindChancePerDay * (s.zones.ermita.everRestored ? 1.5 : 1))) {
    s.pendingCat = chooseCatGift(s);
    queueEvent(s, 'gato');
  }
  // La declaración de la renta, cada primavera
  if (isSeasonStart(s) && seasonIndex(s) === BILLS.tax.season && s.day > 1) {
    if (taxDue(s) > 0) queueEvent(s, 'renta');
    else s.taxBase = { earned: s.stats.earned, spent: s.stats.spent };
  }
  // Programados (subvención, notario, avisos que van a más…)
  const due = s.scheduled.filter((x) => x.day <= s.day);
  s.scheduled = s.scheduled.filter((x) => x.day > s.day);
  for (const x of due) queueEvent(s, x.id);
}

function chooseCatGift(s) {
  const entries = CAT_GIFTS.map((g, i) => [i, g.item ? (s.items.includes(g.item) ? 0 : (g.weight || 1)) : 1]);
  return weighted(s, entries);
}

// ── Ayudas para los eventos (h en data/events.js) ──
export function helpers(s) {
  const h = {
    avgCons: () => avgCons(s),
    avgWeeds: () => avgWeeds(s),
    zoneCons: (id) => s.zones[id].cons,
    has: (id) => s.items.includes(id),
    log: (t, k = 'event') => addLog(s, t, k),
    addMoney: (v) => { addStock(s, 'money', v); signal(s, 'coins', { amount: v }); },
    addRep: (v) => { s.rep = clamp(s.rep + v, 0, 100); },
    addMood: (v) => { s.mood = clamp(s.mood + v, 0, 100); },
    addProduct: (k, v) => addStock(s, k, v),
    addAnimal: (k, v) => { s.animals[k] = (s.animals[k] || 0) + v; },
    giveItem: (id) => giveItem(s, id),
    clue: (hyp, amt) => clue(s, hyp, amt),
    addThemeHint: () => { s.themeHints = (s.themeHints || 0) + 1; signal(s, 'theme', { full: false }); },
    later: (days, id) => s.scheduled.push({ day: s.day + days, id }),
    sellAllAt: (m) => sellAllAt(s, m),
    // Regala hasta n unidades de lo que haya; devuelve cuántos tipos distintos
    giveProducts: (n) => {
      const have = Object.keys(PRODUCTS).filter((k) => k !== 'cerdo' && s.products[k] >= 1);
      let types = 0;
      for (let i = 0; i < n && have.length; i++) {
        const k = have.splice(randInt(s, 0, have.length - 1), 1)[0];
        addStock(s, k, -1); types++;
      }
      return types;
    },
    fire: (sev) => {
      const w = avgWeeds(s);
      const dmg = sev * (5 + w * 0.35);
      for (const id of ['dehesa', 'muros', 'bosquete', 'paseo']) {
        const z = s.zones[id];
        if (!z.unlocked) continue;
        z.cons = clamp(z.cons - dmg, 0, 100);
        if (z.weeds != null) z.weeds = clamp(z.weeds * 0.3, 0, 100);
      }
      s.mood = clamp(s.mood - sev * 6, 0, 100);
      if (dmg > 8) addLog(s, 'Huele a ceniza durante días. La dehesa tardará en sanar.', 'bad');
      if (dmg > 14) breakDown(s, 'dehesa_quemada');
    },
    catGift: () => {
      const g = CAT_GIFTS[s.pendingCat ?? 0];
      return {
        text: g.text,
        apply: () => {
          if (g.item) giveItem(s, g.item);
          if (g.effects) applyEffects(s, g.effects, h);
          s.pendingCat = null;
        },
      };
    },
    postcard: () => {
      const pool = s.volunteersSeen.filter((id) => !s.volunteers.some((v) => v.id === id));
      const v = VOLUNTEER_BY_ID[pick(s, pool.length ? pool : s.volunteersSeen)];
      return pick(s, POSTCARDS).replace('{name}', v ? v.name : 'Alguien').replace('{origin}', v ? v.origin : 'lejos');
    },
    leavingText: () => {
      const v = s.volunteers.find((x) => x.id === s.pendingLeave);
      if (!v) return 'Alguien quería decirte algo, pero ya se ha ido.';
      const info = infoOf(v);
      return `${info.name} tenía que irse hoy, pero se ha quedado mirando el patio. «¿Te importa si me quedo unos días más? Aquí se está…» Y no termina la frase.`;
    },
    extendStay: (days) => {
      const v = s.volunteers.find((x) => x.id === s.pendingLeave);
      if (v) { v.leaves = s.day + days; v.extended = true; v.happy = clamp(v.happy + 5, 0, 100); }
      s.pendingLeave = null;
    },
    letGo: () => {
      const v = s.volunteers.find((x) => x.id === s.pendingLeave);
      if (v) departVolunteer(s, v);
      s.pendingLeave = null;
    },
    concert: () => concert(s),
    // Contratiempos
    breakDown: (id) => breakDown(s, id),
    canBreak: (id) => canBreak(s, id),
    damaged: (zoneId) => !!damageOf(s, zoneId),
    stopped: (what, zoneId) => stopped(s, what, zoneId),
    mod: (id, days) => addMod(s, id, days),
    taxDue: () => taxDue(s),
    takeLoan: (a, w, q) => takeLoan(s, a, w, q),
    payTax: (extra = 0) => {
      const v = taxDue(s) + extra;
      addStock(s, 'money', -v); s.stats.spent += v; s.stats.bills = (s.stats.bills || 0) + v;
      signal(s, 'coins', { amount: -v });
      s.taxBase = { earned: s.stats.earned, spent: s.stats.spent };
      addLog(s, `Pagas ${v} € a Hacienda.`, 'info');
    },
    loseAnimals: (k, frac) => {
      const n = Math.min(s.animals[k] || 0, Math.max(1, Math.round((s.animals[k] || 0) * frac)));
      s.animals[k] = (s.animals[k] || 0) - n;
      return n;
    },
    loseProduct: (k, frac) => { const n = Math.floor((s.products[k] || 0) * frac); addStock(s, k, -n); return n; },
    loseStock: (frac) => {
      let n = 0;
      for (const k of Object.keys(PRODUCTS)) { const q = Math.floor((s.products[k] || 0) * frac); if (q > 0 && !['cerdo', 'jamon'].includes(k)) { addStock(s, k, -q); n += q; } }
      return n;
    },
    restVolunteer: (days) => {
      const v = s.volunteers.filter((x) => !(x.rest > 0))[0];
      if (!v) return null;
      v.rest = days;
      return infoOf(v);
    },
    chance: (p) => chance(s, p),
    // Los vecinos echan una mano: adelantan trabajo de una reparación
    helpRepair: (id, n) => { const d = s.damages && s.damages[id]; if (d) d.work = Math.min(DAMAGES[id].work - 1, d.work + n); },
    clearBeds: () => { for (const b of s.beds || []) { b.crop = null; b.growth = 0; b.ready = null; } },
    hurtBeds: (f) => { for (const b of s.beds || []) if (b.crop) { b.growth = Math.max(0, b.growth * (1 - f)); if (b.ready != null && f > 0.5) { b.crop = null; b.ready = null; b.growth = 0; } } },
  };
  return h;
}

// ── Vista y resolución para la interfaz ──
export function currentEvent(s) {
  const id = s.eventQueue[0];
  if (!id) return null;
  const e = eventDef(id);
  if (!e) { s.eventQueue.shift(); return currentEvent(s); }
  const h = helpers(s);
  const text = typeof e.text === 'function' ? e.text(s, h) : e.text;
  return {
    id: e.id, title: e.title, illus: e.illus, text, pages: e.pages || null,
    options: e.options.map((o) => ({
      label: o.label,
      cost: o.cost ? costLabel(o.cost) : '',
      disabled: o.cost && !canAfford(s, o.cost) ? 'Falta ' + missingOf(s, o.cost).map(labelOf).join(', ') : null,
    })),
  };
}

export function resolveEvent(s, index = 0) {
  const id = s.eventQueue[0];
  if (!id) return null;
  const e = eventDef(id);
  let opt = e.options[index];
  if (!opt || (opt.cost && !canAfford(s, opt.cost))) {
    // Si no se puede pagar, se toma la primera opción gratuita
    opt = e.options.find((o) => !o.cost || canAfford(s, o.cost)) || e.options[e.options.length - 1];
  }
  const h = helpers(s);
  s.eventQueue.shift();
  addLog(s, `${e.title}. ${opt.result || ''}`.trim(), 'event');
  if (opt.cost) payCost(s, opt.cost);
  if (opt.effects) applyEffects(s, opt.effects, h);
  if (opt.flag) s.flags[opt.flag] = true;
  if (opt.apply) opt.apply(s, h);
  s.stats.events++;
  signal(s, 'resolved', { id: e.id });
  return { title: e.title, result: opt.result || '' };
}
