// Estado inicial de una partida. Todo es JSON serializable (se guarda tal cual).
import { BALANCE } from '../data/balance.js';
import { ZONES } from '../data/zones.js';
import { PRODUCTS } from '../data/products.js';
import { HYPOTHESES } from '../data/story.js';

export const STATE_VERSION = 1;

export function createState(seed = Date.now() % 2147483647, overrides = {}) {
  const cfg = {
    daysPerSeason: BALANCE.daysPerSeason,
    startSeason: BALANCE.startSeason,
    ...overrides,
  };
  const zones = {};
  for (const z of ZONES) {
    zones[z.id] = {
      cons: z.unlocked ? z.start : 0,
      weeds: z.weeds ? (z.unlocked ? 35 : 80) : null,
      unlocked: !!z.unlocked,
      everRestored: false,
    };
  }
  const products = {};
  for (const k of Object.keys(PRODUCTS)) products[k] = 0;
  Object.assign(products, BALANCE.start.products);

  const hyp = {};
  for (const h of HYPOTHESES) hyp[h.id] = h.start;

  return {
    version: STATE_VERSION,
    seed,
    rng: seed | 0,
    cfg,
    day: 1,
    hour: BALANCE.startHour,
    money: BALANCE.start.money,
    mood: BALANCE.start.mood,
    rep: BALANCE.start.reputation,
    water: 55,
    jornales: BALANCE.playerJornales,
    materials: { ...BALANCE.start.materials },
    products,
    zones,
    animals: { gallinas: 0, ovejas: 0, cerdos: 0, colmenas: 0 },
    montanera: 0,
    volunteers: [],          // [{ id, arrived, leaves, happy, zone, extended }]
    volunteersSeen: [],
    employees: 0,
    weather: 'sol',
    priceNoise: {},
    saturation: { coop: {}, market: {}, basket: {} },
    basketSoldToday: 0,
    items: [],
    hyp,
    themeHints: 0,
    upgrades: [],
    guests: [],              // [{ n, nights }]
    log: [],
    eventQueue: [],          // eventos pendientes de mostrar (el tiempo se detiene)
    todayEvent: null,        // { hour, id? }
    scheduled: [],           // [{ day, id }]
    eventLast: {},           // id → día en que ocurrió
    lastEventDay: -99,
    milestones: [],
    flags: {},
    recommendUntil: 0,
    ruinDays: 0,
    abandonDays: 0,
    asleep: null,
    autoDone: -1,
    stats: {
      tasks: 0, sales: 0, marketSales: 0, earned: 0, spent: 0,
      produced: Object.fromEntries(Object.keys(PRODUCTS).map((k) => [k, 0])),
      volunteersArrived: 0, volunteersLeft: 0, guests: 0, concerts: 0, montaneras: 0,
      events: 0, restored: 0,
    },
  };
}

// Completa partidas guardadas con versiones anteriores (campos nuevos con su valor por defecto)
export function migrate(s) {
  const fresh = createState(s.seed || 1, s.cfg);
  for (const k of Object.keys(fresh)) if (s[k] === undefined) s[k] = fresh[k];
  for (const k of Object.keys(fresh.zones)) if (!s.zones[k]) s.zones[k] = fresh.zones[k];
  for (const k of Object.keys(fresh.products)) if (s.products[k] === undefined) s.products[k] = 0;
  for (const k of Object.keys(fresh.stats)) if (s.stats[k] === undefined) s.stats[k] = fresh.stats[k];
  for (const k of Object.keys(fresh.stats.produced)) if (s.stats.produced[k] === undefined) s.stats.produced[k] = 0;
  for (const k of Object.keys(fresh.hyp)) if (s.hyp[k] === undefined) s.hyp[k] = fresh.hyp[k];
  s.version = STATE_VERSION;
  return s;
}
