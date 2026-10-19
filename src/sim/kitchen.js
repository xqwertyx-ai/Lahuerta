// La cocina del cortijo (conservas, mermelada, matanza) y los ratos libres.
import { RECIPES } from '../data/crops.js';
import { PRODUCTS } from '../data/products.js';
import { ACTIVITIES, ACTIVITY_BY_ID } from '../data/activities.js';
import { WEATHER } from '../data/seasons.js';
import { ZONE_BY_ID } from '../data/zones.js';
import { seasonIndex } from './calendar.js';
import { addLog, signal, clamp, addStock, canAfford, payCost, labelOf } from './effects.js';
import { hasSkill, infoOf } from './people.js';

export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

// Productos que valen para un ingrediente ('group:huerta', 'any:higos,uvas' o un producto)
export function ingredientOptions(key) {
  if (key.startsWith('group:')) { const g = key.slice(6); return Object.keys(PRODUCTS).filter((k) => PRODUCTS[k].group === g); }
  if (key.startsWith('any:')) return key.slice(4).split(',');
  return [key];
}

export function ingredientLabel(key) {
  if (key.startsWith('group:huerta')) return 'verduras de la huerta';
  if (key.startsWith('any:')) return ingredientOptions(key).map(labelOf).join(' o ');
  return labelOf(key);
}

function available(s, key) {
  return ingredientOptions(key).reduce((a, k) => a + Math.floor(s.products[k] || 0), 0);
}

export function recipeJornales(s, r) {
  return Math.max(1, r.jornales - (r.skill && hasSkill(s, r.skill) && r.jornales >= 2 ? 1 : 0));
}

export function recipeBlocker(s, id) {
  const r = RECIPE_BY_ID[id];
  if (!r) return 'Receta desconocida';
  if (r.seasons && !r.seasons.includes(seasonIndex(s))) return 'No es la época';
  for (const [k, n] of Object.entries(r.in)) if (available(s, k) < n) return `Faltan ${ingredientLabel(k)}`;
  if (s.jornales < recipeJornales(s, r)) return 'No quedan jornales hoy';
  return null;
}

export function cook(s, id) {
  const why = recipeBlocker(s, id);
  if (why) return { ok: false, text: why };
  const r = RECIPE_BY_ID[id];
  s.jornales -= recipeJornales(s, r);
  for (const [k, n] of Object.entries(r.in)) {
    let need = n;
    // Primero lo que más se estropea
    const opts = ingredientOptions(k).sort((a, b) => (PRODUCTS[b].spoil || 0) - (PRODUCTS[a].spoil || 0));
    for (const p of opts) {
      const take = Math.min(need, Math.floor(s.products[p] || 0));
      addStock(s, p, -take);
      need -= take;
      if (!need) break;
    }
  }
  const mult = r.skill && hasSkill(s, r.skill) ? 1.5 : 1;
  const got = [];
  for (const [k, n] of Object.entries(r.out)) {
    const q = Math.round(n * (k === 'jamon' ? 1 : mult));
    addStock(s, k, q);
    if (s.stats.produced[k] !== undefined) s.stats.produced[k] += q;
    got.push(`${q} ${labelOf(k)}`);
  }
  addLog(s, `${r.name}: ${got.join(', ')}. ${r.text}`, 'good');
  signal(s, 'task', { zone: 'cortijo', task: id });
  return { ok: true, text: `${r.name}: ${got.join(', ')}` };
}

// ── Ratos libres ──
function foodTotal(s) {
  return Object.keys(PRODUCTS).filter((k) => PRODUCTS[k].food).reduce((a, k) => a + Math.floor(s.products[k] || 0), 0);
}

export function activityCostOk(s, cost) {
  const { food = 0, ...rest } = cost;
  if (food && foodTotal(s) < food) return false;
  return canAfford(s, rest);
}

export function activityBlocker(s, id) {
  const a = ACTIVITY_BY_ID[id];
  if (!a) return 'Desconocida';
  const last = (s.activityLast || {})[id];
  if (last != null && s.day - last < a.cooldown) return `Otra vez dentro de ${a.cooldown - (s.day - last)} días`;
  const r = a.requires || {};
  if (r.seasons && !r.seasons.includes(seasonIndex(s))) return r.seasonWhy || 'No es la estación';
  if (r.notWeather && r.notWeather.includes(s.weather)) return `Hoy no: ${WEATHER[s.weather].name.toLowerCase()}`;
  if (r.zones) for (const [z, min] of Object.entries(r.zones)) {
    if (!s.zones[z].unlocked || s.zones[z].cons < min) return `Hace falta ${ZONE_BY_ID[z].name.toLowerCase()} a ${min}`;
  }
  if (!activityCostOk(s, a.cost)) {
    if (a.cost.food) return 'Falta comida de la finca';
    if (a.cost.jornales && s.jornales < a.cost.jornales) return 'No quedan jornales hoy';
    return 'Falta ' + Object.keys(a.cost).filter((k) => k !== 'food').map(labelOf).join(', ');
  }
  return null;
}

export function doActivity(s, id) {
  const why = activityBlocker(s, id);
  if (why) return { ok: false, text: why };
  const a = ACTIVITY_BY_ID[id];
  const { food = 0, ...rest } = a.cost;
  payCost(s, rest);
  if (rest.money) s.stats.spent += rest.money;
  let need = food;
  const foods = Object.keys(PRODUCTS).filter((k) => PRODUCTS[k].food).sort((x, y) => (PRODUCTS[y].spoil || 0) - (PRODUCTS[x].spoil || 0));
  for (const k of foods) { while (need > 0 && s.products[k] >= 1) { addStock(s, k, -1); need--; } }
  s.activityLast = s.activityLast || {};
  s.activityLast[id] = s.day;
  for (const v of s.volunteers) v.happy = clamp(v.happy + a.happy, 0, 100);
  s.mood = clamp(s.mood + a.mood, 0, 100);
  if (a.zoneCare) for (const [z, d] of Object.entries(a.zoneCare)) if (s.zones[z].unlocked) s.zones[z].cons = clamp(s.zones[z].cons + d, 0, 100);
  s.stats.activities = (s.stats.activities || 0) + 1;
  const who = s.volunteers.length ? ` (${s.volunteers.map((v) => infoOf(v).name).join(', ')})` : '';
  addLog(s, `${a.name}${who}. ${a.text}`, 'good');
  signal(s, 'activity', { id });
  return { ok: true, text: a.name };
}

export { ACTIVITIES };
