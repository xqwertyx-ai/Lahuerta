// La huerta por bancales: se siembra lo de cada temporada y se recoge a los días.
import { CROPS, BEDS, SOW_JORNALES, HARVEST_JORNALES, OVERRIPE_DAYS } from '../data/crops.js';
import { roundP } from './rng.js';
import { seasonIndex } from './calendar.js';
import { addLog, signal, clamp, addStock } from './effects.js';
import { hasSkill } from './people.js';
import { PRODUCTS } from '../data/products.js';

export function beds(s) {
  if (!Array.isArray(s.beds) || s.beds.length !== BEDS) {
    const old = Array.isArray(s.beds) ? s.beds : [];
    s.beds = Array.from({ length: BEDS }, (_, i) => old[i] || { crop: null, growth: 0, ready: null, left: 1 });
  }
  return s.beds;
}

export function seasonalCrops(s) {
  const si = seasonIndex(s);
  return Object.entries(CROPS).filter(([, c]) => c.seasons.includes(si)).map(([id, c]) => ({ id, ...c }));
}

export function sowBlocker(s, i, cropId, budget = s.jornales) {
  if (!s.zones.huerta.unlocked) return 'Primero hay que recuperar la huerta';
  const b = beds(s)[i];
  if (!b) return 'Ese bancal no existe';
  if (b.crop) return 'El bancal ya está sembrado';
  const c = CROPS[cropId];
  if (!c) return 'No se conoce esa semilla';
  if (!c.seasons.includes(seasonIndex(s))) return 'No es su temporada';
  if (budget < SOW_JORNALES) return 'No quedan jornales hoy';
  return null;
}

export function sow(s, i, cropId, { budget = null } = {}) {
  const why = sowBlocker(s, i, cropId, budget != null ? budget : s.jornales);
  if (why) return { ok: false, text: why };
  if (budget == null) s.jornales -= SOW_JORNALES;
  s.beds[i] = { crop: cropId, growth: 0, ready: null, left: 1, sown: s.day };
  signal(s, 'task', { zone: 'huerta', task: 'sembrar' });
  return { ok: true, used: SOW_JORNALES, text: `Siembras ${CROPS[cropId].name.toLowerCase()} en el bancal ${i + 1}` };
}

export function harvestBlocker(s, i, budget = s.jornales) {
  const b = beds(s)[i];
  if (!b || !b.crop) return 'Bancal vacío';
  if (b.ready == null) return 'Aún no está listo';
  if (budget < HARVEST_JORNALES) return 'No quedan jornales hoy';
  return null;
}

export function harvestAmount(s, i) {
  const b = beds(s)[i];
  if (!b || !b.crop) return 0;
  const c = CROPS[b.crop];
  const q = 0.6 + 0.4 * s.zones.huerta.cons / 100;
  return c.yield * q * (hasSkill(s, 'huerta') ? 1.25 : 1) * (b.left ?? 1);
}

export function harvest(s, i, { budget = null } = {}) {
  const why = harvestBlocker(s, i, budget != null ? budget : s.jornales);
  if (why) return { ok: false, text: why };
  if (budget == null) s.jornales -= HARVEST_JORNALES;
  const b = s.beds[i];
  const n = Math.max(1, roundP(s, harvestAmount(s, i)));
  addStock(s, b.crop, n);
  if (s.stats.produced[b.crop] !== undefined) s.stats.produced[b.crop] += n;
  s.stats.harvests = (s.stats.harvests || 0) + 1;
  const name = CROPS[b.crop].name.toLowerCase();
  s.beds[i] = { crop: null, growth: 0, ready: null, left: 1 };
  signal(s, 'task', { zone: 'huerta', task: 'recoger' });
  return { ok: true, used: HARVEST_JORNALES, text: `Recoges ${n} de ${name}`, gained: n };
}

// El riego adelanta lo sembrado
export function growBeds(s, amount) {
  for (const b of beds(s)) if (b.crop && b.ready == null) b.growth = Math.min(1, b.growth + amount / CROPS[b.crop].days * 3);
}

// Cada amanecer: crece lo sembrado, madura y, si nadie lo recoge, se pasa
export function gardenDay(s) {
  if (!s.zones.huerta.unlocked) return;
  const si = seasonIndex(s);
  const st = s.zones.huerta;
  for (let i = 0; i < beds(s).length; i++) {
    const b = s.beds[i];
    if (!b.crop) continue;
    const c = CROPS[b.crop];
    if (b.ready == null) {
      let rate = (0.6 + 0.4 * s.water / 100) * (0.7 + 0.3 * st.cons / 100) * (1 - (st.weeds || 0) / 300);
      if (!c.seasons.includes(si)) rate *= 0.5;      // fuera de su estación crece despacio
      if (s.weather === 'helada' && b.crop !== 'habas' && b.crop !== 'ajos' && b.crop !== 'coles') rate = 0;
      b.growth = clamp(b.growth + rate / c.days, 0, 1);
      if (b.growth >= 1) {
        b.ready = s.day;
        addLog(s, `Las ${c.name.toLowerCase()} del bancal ${i + 1} están listas para recoger.`, 'good');
        signal(s, 'ripe', { bed: i, crop: b.crop });
      }
    } else if (s.day - b.ready > OVERRIPE_DAYS) {
      b.left = (b.left ?? 1) * 0.75;
      if (b.left < 0.3) {
        addLog(s, `Las ${c.name.toLowerCase()} del bancal ${i + 1} se han pasado sin recoger.`, 'bad');
        s.beds[i] = { crop: null, growth: 0, ready: null, left: 1 };
      }
    }
  }
}

// Quien cuida la huerta recoge lo maduro y siembra lo de temporada. Devuelve los jornales usados.
export function autoGarden(s, budget) {
  let used = 0;
  for (let i = 0; i < beds(s).length; i++) {
    if (budget - used < HARVEST_JORNALES) break;
    if (!harvestBlocker(s, i, budget - used)) { harvest(s, i, { budget: budget - used }); used += HARVEST_JORNALES; }
  }
  const best = seasonalCrops(s).sort((a, b) => b.yield * priceOf(b.id) - a.yield * priceOf(a.id));
  for (let i = 0; i < beds(s).length && best.length; i++) {
    if (budget - used < SOW_JORNALES) break;
    // Variedad: alterna entre los cultivos de temporada
    const crop = best[i % best.length].id;
    if (!sowBlocker(s, i, crop, budget - used)) { sow(s, i, crop, { budget: budget - used }); used += SOW_JORNALES; }
  }
  return used;
}

function priceOf(id) { return PRODUCTS[id] ? PRODUCTS[id].price : 1; }
