// Zonas: deterioro, maleza, tareas de mantenimiento, desbloqueo y restauración.
import { BALANCE } from '../data/balance.js';
import { ZONES, ZONE_BY_ID } from '../data/zones.js';
import { SEASONS, WEATHER } from '../data/seasons.js';
import { ITEMS } from '../data/items.js';
import { chance, roundP } from './rng.js';
import { seasonIndex } from './calendar.js';
import { addLog, signal, clamp, canAfford, payCost, addStock, missingOf, costLabel, labelOf } from './effects.js';
import { hasSkill, skillName, traitOf, volunteerJornales, infoOf, setZoneSkillMap } from './people.js';
import { giveItem } from './mystery.js';

// Qué oficios usa cada zona (para el ánimo de los voluntarios encargados)
setZoneSkillMap(Object.fromEntries(ZONES.map((z) => [z.id, [...new Set(z.tasks.map((t) => t.skill).filter(Boolean))]])));

export function avgCons(s, onlyUnlocked = true) {
  let sum = 0, n = 0;
  for (const z of ZONES) {
    const st = s.zones[z.id];
    if (onlyUnlocked && !st.unlocked) continue;
    sum += st.cons; n++;
  }
  return n ? sum / n : 0;
}

export function avgWeeds(s) {
  let sum = 0, n = 0;
  for (const z of ZONES) {
    const st = s.zones[z.id];
    if (!st.unlocked || st.weeds == null) continue;
    sum += st.weeds; n++;
  }
  return n ? sum / n : 0;
}

export function restoredCount(s) {
  return ZONES.filter((z) => s.zones[z.id].unlocked && s.zones[z.id].cons >= BALANCE.restoredThreshold).length;
}

// ── Paso horario: deterioro y maleza ──
export function decayHour(s, hours = 1) {
  const season = SEASONS[seasonIndex(s)];
  const w = WEATHER[s.weather] || WEATHER.sol;
  for (const z of ZONES) {
    const st = s.zones[z.id];
    if (!st.unlocked) continue;
    let care = 1;
    for (const v of s.volunteers) if (v.zone === z.id) care *= traitOf(v).decay || 1;
    const weedF = st.weeds != null ? 1 + st.weeds * BALANCE.weedDecayFactor : 1;
    let d = BALANCE.baseDecayPerDay * z.decay * season.decayMult * w.decay * weedF * care;
    // El agua escasa castiga la huerta y la fuente
    if ((z.id === 'huerta' || z.id === 'patio') && s.water < 20) d *= 1.4;
    st.cons = clamp(st.cons - d * hours / 24, 0, 100);
    if (st.weeds != null) {
      st.weeds = clamp(st.weeds + BALANCE.weedGrowthPerDay * season.weedMult * w.weeds * hours / 24, 0, 100);
    }
  }
}

// ── Tareas ──
export function taskSkillBonus(s, task) {
  return task.skill && hasSkill(s, task.skill);
}

export function taskJornales(s, task) {
  const j = task.jornales - (taskSkillBonus(s, task) ? 1 : 0);
  return Math.max(1, j);
}

// Devuelve null si se puede hacer, o el motivo si no
export function taskBlocker(s, zoneId, task) {
  const st = s.zones[zoneId];
  if (!st.unlocked) return 'Zona borrada del plano';
  const si = seasonIndex(s);
  if (task.seasons && !task.seasons.includes(si)) {
    return 'Fuera de temporada (' + task.seasons.map((i) => SEASONS[i].name.toLowerCase()).join(', ') + ')';
  }
  if (task.notWeather && task.notWeather.includes(s.weather)) return `Hoy no: ${WEATHER[s.weather].name.toLowerCase()}`;
  if (task.minCons && st.cons < task.minCons) return `Necesita la zona a ${task.minCons}`;
  if (task.needsSkillAbove != null && st.cons >= task.needsSkillAbove && !hasSkill(s, task.skill)) {
    return `Hace falta alguien que sepa de ${skillName(task.skill)}`;
  }
  if (task.gainPerAnimal && !(s.animals[task.gainPerAnimal.animal] > 0)) return 'No hay animales';
  if (task.id === 'carbon' && zoneId === 'almacen' && (s.materials.lena || 0) < 3) return 'Falta leña';
  if (s.jornales < taskJornales(s, task)) return 'No quedan jornales hoy';
  if (!canAfford(s, task.cost)) return 'Falta ' + missingOf(s, task.cost).map(labelOf).join(', ');
  return null;
}

export function findTask(zoneId, taskId) {
  return ZONE_BY_ID[zoneId]?.tasks.find((t) => t.id === taskId);
}

export function doTask(s, zoneId, taskId, { byVolunteer = null } = {}) {
  const zone = ZONE_BY_ID[zoneId];
  const task = findTask(zoneId, taskId);
  if (!zone || !task) return { ok: false, text: 'Tarea desconocida' };
  const jcost = taskJornales(s, task);
  if (!byVolunteer) {
    const b = taskBlocker(s, zoneId, task);
    if (b) return { ok: false, text: b };
    s.jornales -= jcost;
  }
  payCost(s, task.cost);
  if (task.cost?.money) s.stats.spent += task.cost.money;

  const st = s.zones[zoneId];
  const skilled = taskSkillBonus(s, task);
  let mult = skilled ? 1.5 : 1;
  const si = seasonIndex(s);
  if (task.seasonBonus && task.seasonBonus[si]) mult *= task.seasonBonus[si];
  const before = st.cons;
  const eff = task.effect || {};
  if (eff.cons) st.cons = clamp(st.cons + eff.cons * mult, 0, 100);
  if (eff.weeds && st.weeds != null) st.weeds = clamp(st.weeds + eff.weeds * (skilled ? 1.3 : 1), 0, 100);
  if (eff.mood) s.mood = clamp(s.mood + eff.mood, 0, 100);
  const gains = [];
  if (task.gain) for (const [k, v] of Object.entries(task.gain)) { addStock(s, k, v); gains.push([k, v]); }
  if (task.gainScaled) {
    for (const [k, v] of Object.entries(task.gainScaled)) {
      const q = roundP(s, v * (0.3 + 0.7 * before / 100) * (skilled ? 1.25 : 1));
      if (q > 0) { addStock(s, k, q); gains.push([k, q]); countProduced(s, k, q); }
    }
  }
  if (task.gainPerAnimal) {
    const { animal, ...rest } = task.gainPerAnimal;
    for (const [k, v] of Object.entries(rest)) {
      const q = roundP(s, v * s.animals[animal] * (0.4 + 0.6 * before / 100));
      if (q > 0) { addStock(s, k, q); gains.push([k, q]); countProduced(s, k, q); }
    }
  }
  for (const [k, v] of gains) if (k === 'carbon') countProduced(s, k, v);
  s.stats.tasks++;
  checkRestored(s, zoneId);

  // A veces, mientras trabajas, aparece algo olvidado
  const taskItems = ITEMS.filter((it) => it.where === 'task' && it.zone === zoneId && !s.items.includes(it.id));
  if (taskItems.length && st.cons >= 55 && s.day >= 4) {
    let p = 0.22;
    for (const v of s.volunteers) p += traitOf(v).findBonus || 0;
    if (chance(s, p)) giveItem(s, taskItems[0].id);
  }

  signal(s, 'task', { zone: zoneId, task: taskId, skilled });
  const gainTxt = gains.length ? ' (+' + gains.map(([k, v]) => `${v} ${labelOf(k)}`).join(', +') + ')' : '';
  return { ok: true, text: `${task.name}${gainTxt}`, skilled, delta: st.cons - before };
}

function countProduced(s, k, q) {
  if (s.stats.produced[k] !== undefined) s.stats.produced[k] += q;
}

// ── Desbloquear (volver a dibujar) ──
export function unlockBlocker(s, zoneId) {
  const z = ZONE_BY_ID[zoneId];
  const st = s.zones[zoneId];
  if (!z || st.unlocked) return 'Ya está en el plano';
  const u = z.unlock || {};
  const req = u.requires || {};
  if (req.skill && !hasSkill(s, req.skill)) return `Hace falta alguien que sepa de ${skillName(req.skill)}`;
  if (req.zones) {
    for (const [id, min] of Object.entries(req.zones)) {
      if (!s.zones[id].unlocked || s.zones[id].cons < min) return `Antes, ${ZONE_BY_ID[id].name.toLowerCase()} a ${min}`;
    }
  }
  if (s.jornales < (u.jornales || 0)) return 'No quedan jornales hoy';
  if (!canAfford(s, u.cost)) return 'Falta ' + missingOf(s, u.cost).map(labelOf).join(', ');
  return null;
}

export function unlockCostLabel(zoneId) {
  const u = ZONE_BY_ID[zoneId].unlock || {};
  return costLabel({ jornales: u.jornales, ...(u.cost || {}) });
}

export function unlockZone(s, zoneId) {
  const b = unlockBlocker(s, zoneId);
  if (b) return { ok: false, text: b };
  const z = ZONE_BY_ID[zoneId];
  const u = z.unlock || {};
  s.jornales -= u.jornales || 0;
  payCost(s, u.cost);
  if (u.cost?.money) s.stats.spent += u.cost.money;
  const st = s.zones[zoneId];
  st.unlocked = true;
  st.cons = z.start;
  if (st.weeds != null) st.weeds = 55;
  s.mood = clamp(s.mood + 3, 0, 100);
  addLog(s, `${z.name} vuelve a estar en el plano. ${z.desc}`, 'good');
  signal(s, 'unlock', { zone: zoneId });
  const it = ITEMS.find((i) => i.where === 'unlock' && i.zone === zoneId && !s.items.includes(i.id));
  if (it) giveItem(s, it.id);
  return { ok: true, text: `${z.name} vuelve al plano` };
}

export function checkRestored(s, zoneId) {
  const st = s.zones[zoneId];
  for (const it of ITEMS) {
    if (it.where === 'cons' && it.zone === zoneId && st.cons >= it.at && !s.items.includes(it.id)) giveItem(s, it.id);
  }
  if (st.everRestored || st.cons < BALANCE.restoredThreshold) return;
  st.everRestored = true;
  s.stats.restored++;
  s.mood = clamp(s.mood + BALANCE.moodPerRestoredZone * 3, 0, 100);
  const z = ZONE_BY_ID[zoneId];
  addLog(s, `${z.name} recupera el color. La tinta vuelve a ser negra y la acuarela, viva.`, 'good');
  signal(s, 'restored', { zone: zoneId });
  const it = ITEMS.find((i) => i.where === 'restore' && i.zone === zoneId && !s.items.includes(i.id));
  if (it && chance(s, BALANCE.itemChanceOnRestore)) giveItem(s, it.id);
}

// ── Voluntarios con zona encargada: la cuidan solos ──
function bestTaskFor(s, zoneId) {
  const zone = ZONE_BY_ID[zoneId];
  const st = s.zones[zoneId];
  let best = null, bestScore = -1;
  for (const t of zone.tasks) {
    const b = taskBlocker({ ...s, jornales: 99 }, zoneId, t);
    if (b) continue;
    if (t.cost?.money) continue;               // no gastan dinero por su cuenta
    let ok = true;
    for (const [k, v] of Object.entries(t.cost || {})) if ((s.materials[k] ?? s.products[k] ?? 0) < v * 2) ok = false;
    if (!ok) continue;
    const e = t.effect || {};
    let score = (e.cons || 0) * (st.cons < 95 ? 1 : 0.1);
    if (e.weeds && st.weeds != null) score += Math.max(0, st.weeds - 25) * (-e.weeds) / 60;
    if (t.gainScaled || t.gainPerAnimal) score += 8;
    if (t.gain) score += 2;
    score /= t.jornales;
    if (score > bestScore) { bestScore = score; best = t; }
  }
  return best;
}

export function autoMaintain(s) {
  for (const v of s.volunteers) {
    if (!v.zone || !s.zones[v.zone]?.unlocked) continue;
    let budget = volunteerJornales(v);
    let guard = 0;
    const done = [];
    while (budget >= 1 && guard++ < 6) {
      const t = bestTaskFor(s, v.zone);
      if (!t) break;
      const cost = taskJornales(s, t);
      if (cost > budget + 0.01) break;
      budget -= cost;
      const r = doTask(s, v.zone, t.id, { byVolunteer: v.id });
      if (r.ok) done.push(t.name.toLowerCase());
    }
    if (done.length) v.lastWork = done.join(', ');
  }
}
