// Agroturismo: mejoras, huéspedes, actividades y conciertos.
import { BALANCE } from '../data/balance.js';
import { UPGRADES, UPGRADE_BY_ID, TOURISM_SEASON } from '../data/tourism.js';
import { WEATHER } from '../data/seasons.js';
import { ZONE_BY_ID } from '../data/zones.js';
import { rand, randInt, chance } from './rng.js';
import { seasonIndex } from './calendar.js';
import { addLog, signal, clamp, canAfford, payCost, addStock, missingOf, labelOf } from './effects.js';
import { hasSkill } from './people.js';

export function tourismOpen(s) {
  if (s.flags.tourism) return true;
  const u = BALANCE.tourismUnlock;
  if (s.zones.cortijo.cons >= u.cortijo && s.rep >= u.reputation) {
    s.flags.tourism = true;
    addLog(s, 'La finca está lista para recibir huéspedes. Se abre la página del agroturismo en el cuaderno.', 'good');
    signal(s, 'tourism', {});
    return true;
  }
  return false;
}

export function capacity(s) {
  return s.upgrades.reduce((a, id) => a + (UPGRADE_BY_ID[id]?.capacity || 0), 0);
}

export function appeal(s) {
  return s.upgrades.reduce((a, id) => a + (UPGRADE_BY_ID[id]?.appeal || 0), 0);
}

export function guestCount(s) { return s.guests.reduce((a, g) => a + g.n, 0); }

export function upgradeBlocker(s, id) {
  const u = UPGRADE_BY_ID[id];
  if (!u) return 'Desconocida';
  if (s.upgrades.includes(id)) return 'Ya hecha';
  if (!s.flags.tourism) return 'Aún no hay agroturismo';
  const r = u.requires || {};
  if (r.zones) for (const [z, min] of Object.entries(r.zones)) {
    if (!s.zones[z].unlocked || s.zones[z].cons < min) return `Necesita ${ZONE_BY_ID[z].name.toLowerCase()} a ${min}`;
  }
  if (r.animals) for (const [a, n] of Object.entries(r.animals)) if ((s.animals[a] || 0) < n) return `Necesita ${n} ${a}`;
  if (r.items) for (const it of r.items) if (!s.items.includes(it)) return 'Falta encontrar algo';
  if (r.upgrades) for (const up of r.upgrades) if (!s.upgrades.includes(up)) return `Antes: ${UPGRADE_BY_ID[up].name.toLowerCase()}`;
  if (r.skill && !hasSkill(s, r.skill)) return 'Falta alguien que sepa hacerlo';
  const { jornales = 0, ...cost } = u.cost;
  if (s.jornales < jornales) return 'No quedan jornales hoy';
  if (!canAfford(s, cost)) return 'Falta ' + missingOf(s, cost).map(labelOf).join(', ');
  return null;
}

export function buildUpgrade(s, id) {
  const b = upgradeBlocker(s, id);
  if (b) return { ok: false, text: b };
  const u = UPGRADE_BY_ID[id];
  const { jornales = 0, ...cost } = u.cost;
  s.jornales -= jornales;
  payCost(s, cost);
  s.stats.spent += cost.money || 0;
  s.upgrades.push(id);
  addLog(s, `${u.name}: ${u.desc}`, 'good');
  signal(s, 'build', { id });
  return { ok: true, text: u.name };
}

// Al amanecer: se van los que acaban su estancia, llegan nuevos
export function tourismDawn(s) {
  // Despedidas
  const stay = [];
  for (const g of s.guests) {
    g.nights--;
    if (g.nights > 0) { stay.push(g); continue; }
    const vis = (s.zones.cortijo.cons + s.zones.patio.cons + s.zones.paseo.cons) / 3;
    const sat = 50 + (vis - 50) * 0.6 + appeal(s) * 3 + (s.mood - 50) * 0.2 + (rand(s) - 0.5) * 20 + (g.fed ? 5 : 0);
    const dr = clamp(Math.round((sat - 50) / 12), -3, 4);
    s.rep = clamp(s.rep + dr, 0, 100);
    if (dr > 1) addLog(s, `Se despiden unos huéspedes encantados: «Volveremos en ${['primavera', 'verano', 'otoño', 'invierno'][randInt(s, 0, 3)]}».`, 'good');
    else if (dr < 0) addLog(s, 'Unos huéspedes se van con cara de pocos amigos. «Muy bonito, pero…»', 'bad');
  }
  s.guests = stay;
  if (!s.flags.tourism) return;
  const cap = capacity(s) - guestCount(s);
  if (cap <= 0) return;
  const si = seasonIndex(s);
  const w = WEATHER[s.weather] || WEATHER.sol;
  const expected = (BALANCE.visitorBase + s.rep * BALANCE.visitorPerRep) * (1 + Math.min(8, appeal(s)) * 0.1) * TOURISM_SEASON[si] * w.visitors * (s.zones.cortijo.cons / 100);
  let free = cap;
  let tries = Math.floor(expected) + (rand(s) < expected % 1 ? 1 : 0);
  while (tries-- > 0 && free > 0) {
    const n = Math.min(free, randInt(s, 1, 2));
    s.guests.push({ n, nights: randInt(s, 1, 3) });
    free -= n;
    s.stats.guests += n;
    addLog(s, n === 1 ? 'Llega un huésped con una maleta pequeña y ganas de silencio.' : 'Llega una pareja de huéspedes. Preguntan por el gato antes que por la habitación.', 'good');
    signal(s, 'guest', { n });
  }
}

// Al anochecer: los huéspedes pagan noche y actividades
export function tourismEvening(s) {
  const n = guestCount(s);
  if (!n) return 0;
  let total = n * BALANCE.nightPrice * (0.8 + s.rep / 300);
  // Cada huésped hace, como mucho, una actividad al día
  const acts = s.upgrades.map((id) => UPGRADE_BY_ID[id]).filter((u) => u.kind === 'activity' && u.id !== 'concierto');
  if (acts.length) for (let i = 0; i < n; i++) if (chance(s, 0.5)) total += acts[randInt(s, 0, acts.length - 1)].price;
  // Desayuno, sábanas y luz
  total -= n * BALANCE.guestCostPerNight;
  total = Math.round(total);
  addStock(s, 'money', total);
  s.stats.earned += total;
  signal(s, 'coins', { amount: total });
  addLog(s, `Los huéspedes pagan la noche y las actividades: ${total} €.`, 'info');
  return total;
}

export function concertDue(s) {
  return s.upgrades.includes('concierto') && guestCount(s) > 0 && s.day % 4 === 0;
}

export function concert(s) {
  const n = guestCount(s);
  const money = Math.round(n * (UPGRADE_BY_ID.concierto.price + s.rep / 10));
  addStock(s, 'money', money);
  s.stats.earned += money;
  s.rep = clamp(s.rep + 2, 0, 100);
  s.mood = clamp(s.mood + 6, 0, 100);
  s.stats.concerts++;
  addLog(s, `Concierto al atardecer: ${money} € y muchos aplausos.`, 'good');
  signal(s, 'theme', { full: true, concert: true });
}

export { UPGRADES };
