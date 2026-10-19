// Zonas: deterioro, maleza, tareas de mantenimiento, desbloqueo y restauración.
import { BALANCE } from '../data/balance.js';
import { ZONES, ZONE_BY_ID } from '../data/zones.js';
import { SEASONS, WEATHER } from '../data/seasons.js';
import { ITEMS } from '../data/items.js';
import { chance, roundP } from './rng.js';
import { seasonIndex } from './calendar.js';
import { addLog, signal, clamp, canAfford, payCost, addStock, missingOf, costLabel, labelOf } from './effects.js';
import { hasSkill, skillName, traitOf, volunteerJornales, infoOf, setZoneSkillMap } from './people.js';
import { giveItem, checkRevelation } from './mystery.js';
import { growBeds, autoGarden } from './garden.js';
import { damageOf, repair, stopped, agingFactor, difficulty } from './hardship.js';
import { checkTractor, tractorSaves } from './tractor.js';

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
  const global = agingFactor(s) * difficulty(s).decay;
  for (const z of ZONES) {
    const st = s.zones[z.id];
    if (!st.unlocked) continue;
    let care = 1;
    for (const v of s.volunteers) if (v.zone === z.id) care *= traitOf(v).decay || 1;
    const weedF = st.weeds != null ? 1 + st.weeds * BALANCE.weedDecayFactor : 1;
    // Lo que está impecable cuesta más mantenerlo; lo roto se estropea el doble
    const high = 1 + Math.max(0, st.cons - BALANCE.highConsFrom) * BALANCE.highConsDecay;
    const broken = damageOf(s, z.id) ? 1.8 : 1;
    let d = BALANCE.baseDecayPerDay * z.decay * season.decayMult * w.decay * weedF * care * high * broken * global;
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
  // Quien sabe del oficio ahorra un jornal en los trabajos largos
  let j = task.jornales - (taskSkillBonus(s, task) && task.jornales >= 3 ? 1 : 0);
  if (tractorSaves(s, task)) j -= 1;   // con el Pascuali, los trabajos de carga y arado van más rápido
  return Math.max(1, j);
}

// Devuelve null si se puede hacer, o el motivo si no
export function taskBlocker(s, zoneId, task) {
  const st = s.zones[zoneId];
  if (!st.unlocked) return 'Zona borrada del plano';
  const dmg = damageOf(s, zoneId);
  if (dmg) return 'Averiado: primero hay que repararlo';
  if (task.water && stopped(s, 'water', zoneId)) return 'No da agua: está averiado';
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
  if (task.id === 'carbon' && (s.materials.lena || 0) < 3) return 'Falta leña';
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
  let mult = skilled ? 1.4 : 1;
  // Un voluntario solo, cuidando una zona que no es de su oficio, rinde algo menos
  if (byVolunteer) {
    const v = s.volunteers.find((x) => x.id === byVolunteer);
    mult = v && infoOf(v).skill === task.skill ? 1.3 : 0.75;
  }
  const si = seasonIndex(s);
  if (task.seasonBonus && task.seasonBonus[si]) mult *= task.seasonBonus[si];
  const before = st.cons;
  const eff = task.effect || {};
  if (eff.cons) st.cons = clamp(st.cons + eff.cons * mult * diminish(st.cons), 0, 100);
  if (eff.weeds && st.weeds != null) st.weeds = clamp(st.weeds + eff.weeds * (skilled ? 1.3 : 1), 0, 100);
  if (eff.mood) s.mood = clamp(s.mood + eff.mood, 0, 100);
  if (task.water) s.water = clamp(s.water + task.water * (skilled ? 1.3 : 1), 0, 100);
  if (task.growBeds) growBeds(s, task.growBeds * (skilled ? 1.3 : 1));
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


  signal(s, 'task', { zone: zoneId, task: taskId, skilled });
  const gainTxt = gains.length ? ' (+' + gains.map(([k, v]) => `${v} ${labelOf(k)}`).join(', +') + ')' : '';
  return { ok: true, text: `${task.name}${gainTxt}`, skilled, delta: st.cons - before };
}

// Rendimiento decreciente: lo que ya está bien cuidado sube poco
export function diminish(cons) {
  if (cons < BALANCE.diminishFrom) return 1;
  return Math.max(BALANCE.diminishMin, 1 - (cons - BALANCE.diminishFrom) / BALANCE.diminishSpan);
}

// Cuánto subiría la conservación una tarea (para la interfaz)
export function taskGain(s, zoneId, task) {
  const st = s.zones[zoneId];
  let mult = taskSkillBonus(s, task) ? 1.4 : 1;
  const si = seasonIndex(s);
  if (task.seasonBonus && task.seasonBonus[si]) mult *= task.seasonBonus[si];
  return Math.min(100 - st.cons, (task.effect?.cons || 0) * mult * diminish(st.cons));
}

function countProduced(s, k, q) {
  if (s.stats.produced[k] !== undefined) s.stats.produced[k] += q;
}

// ── Desbloquear (volver a dibujar): un pequeño proyecto de varios jornales ──
export function unlockRequirement(s, zoneId) {
  const z = ZONE_BY_ID[zoneId];
  const req = (z.unlock || {}).requires || {};
  if (req.skill && !hasSkill(s, req.skill)) return `Hace falta alguien que sepa de ${skillName(req.skill)}`;
  if (req.zones) {
    for (const [id, min] of Object.entries(req.zones)) {
      if (!s.zones[id].unlocked) return `Antes hay que recuperar ${ZONE_BY_ID[id].name.toLowerCase()}`;
      if (s.zones[id].cons < min) return `Antes, ${ZONE_BY_ID[id].name.toLowerCase()} a ${min}`;
    }
  }
  return null;
}

export function unlockBlocker(s, zoneId, jornales = s.jornales) {
  const z = ZONE_BY_ID[zoneId];
  const st = s.zones[zoneId];
  if (!z || st.unlocked) return 'Ya está en el plano';
  const r = unlockRequirement(s, zoneId);
  if (r) return r;
  const u = z.unlock || {};
  if (!st.unlockWork && !canAfford(s, u.cost)) return 'Falta ' + missingOf(s, u.cost).map(labelOf).join(', ');
  if (jornales < 1) return 'No quedan jornales hoy';
  return null;
}

export function unlockTotal(zoneId) { return (ZONE_BY_ID[zoneId].unlock || {}).jornales || 1; }

export function unlockCostLabel(zoneId) {
  const u = ZONE_BY_ID[zoneId].unlock || {};
  const c = costLabel(u.cost || {});
  return `${u.jornales} jornales de trabajo en total` + (c ? ` · al empezar: ${c}` : '');
}

// Aporta jornales al proyecto (todos los que queden hoy, hasta terminar). by = voluntario (opcional)
export function unlockZone(s, zoneId, { by = null, budget = null } = {}) {
  const z = ZONE_BY_ID[zoneId];
  const st = s.zones[zoneId];
  const avail = budget != null ? budget : s.jornales;
  const b = unlockBlocker(s, zoneId, avail);
  if (b) return { ok: false, text: b };
  const u = z.unlock || {};
  if (!st.unlockWork) {
    payCost(s, u.cost);
    if (u.cost?.money) s.stats.spent += u.cost.money;
  }
  const total = unlockTotal(zoneId);
  const need = total - (st.unlockWork || 0);
  const put = Math.min(Math.floor(avail), need);
  if (budget == null) s.jornales -= put;
  st.unlockWork = (st.unlockWork || 0) + put;
  if (st.unlockWork < total) {
    signal(s, 'task', { zone: zoneId, task: 'unlock', skilled: false });
    return { ok: true, done: false, used: put, text: `${u.text}: ${st.unlockWork}/${total}`, delta: 0 };
  }
  st.unlocked = true;
  st.cons = z.start;
  if (st.weeds != null) st.weeds = 55;
  s.mood = clamp(s.mood + 4, 0, 100);
  addLog(s, `${z.name} vuelve a estar en el plano. ${z.desc}`, 'good');
  signal(s, 'unlock', { zone: zoneId });
  checkItems(s, zoneId);
  return { ok: true, done: true, used: put, text: `${z.name} vuelve al plano`, delta: 0 };
}

// ¿Ha llegado alguna vez esta zona al 100 %? (entonces van saliendo sus recuerdos)
export function zoneFull(s, zoneId) {
  const st = s.zones[zoneId];
  return !!st && st.unlocked && Math.max(st.maxCons || 0, st.cons) >= BALANCE.itemFullCons;
}

// Días entre un recuerdo y el siguiente de la misma zona (San Antonio, que encuentra lo perdido, ayuda)
export function itemDripDays(s) {
  return BALANCE.itemDripDays - (s.zones.ermita.everRestored && !stopped(s, 'find') ? 1 : 0);
}

// ¿Está listo un objeto para aparecer? Solo con su zona al 100 %, ya es su momento y no ha salido otro hace poco
export function itemReady(s, it) {
  if (s.items.includes(it.id)) return false;
  if (it.where === 'matanza') return (s.stats.produced.jamon || 0) >= 1;
  if (!it.zone) return false;
  if (!['unlock', 'restore', 'cons', 'task', 'full'].includes(it.where)) return false;
  if (it.minDay && s.day < it.minDay) return false;
  if (!zoneFull(s, it.zone)) return false;
  const last = (s.itemDrip || {})[it.zone];
  return last == null || s.day - last >= itemDripDays(s);
}

// Da los objetos que ya tocan (como mucho uno por zona). Se llama tras cada acción y cada amanecer.
export function checkItems(s, zoneId = null) {
  if (!s.itemDrip) s.itemDrip = {};
  for (const it of ITEMS) {
    if (zoneId && it.zone !== zoneId && it.zone) continue;
    if (itemReady(s, it)) { giveItem(s, it.id); if (it.zone) s.itemDrip[it.zone] = s.day; }
  }
  checkTractor(s);
}

// Recuerdos que quedan por salir en una zona (para la interfaz)
export function pendingItems(s, zoneId) {
  return ITEMS.filter((it) => it.zone === zoneId && !s.items.includes(it.id) && it.where !== 'cat' && it.where !== 'event');
}

export function checkRestored(s, zoneId) {
  const st = s.zones[zoneId];
  st.maxCons = Math.max(st.maxCons || 0, st.cons);
  if (!st.everRestored && st.cons >= BALANCE.restoredThreshold) {
    st.everRestored = true;
    s.stats.restored++;
    s.mood = clamp(s.mood + BALANCE.moodPerRestoredZone * 3, 0, 100);
    const z = ZONE_BY_ID[zoneId];
    addLog(s, `${z.name} recupera el color. La tinta vuelve a ser negra y la acuarela, viva.`, 'good');
    signal(s, 'restored', { zone: zoneId });
  }
  checkItems(s, zoneId);
  checkRevelation(s);
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
    if (!v.zone || !s.zones[v.zone]) continue;
    if ((v.rest || 0) > 0) { v.lastWork = 'descansó'; continue; }
    const dmg = damageOf(s, v.zone);
    if (dmg) {
      // Encargado de una zona averiada: arrima el hombro en la reparación
      const r = repair(s, dmg.id, { by: v.id, budget: volunteerJornales(v) });
      v.lastWork = r.ok ? (r.done ? 'terminó la reparación' : 'trabajó en la reparación') : 'no pudo empezar la reparación (faltan materiales)';
      continue;
    }
    if (!s.zones[v.zone].unlocked) {
      // Encargado de recuperar una zona: aporta sus jornales al proyecto
      const r = unlockZone(s, v.zone, { by: v.id, budget: volunteerJornales(v) });
      if (r.ok) v.lastWork = r.done ? 'terminó de recuperar la zona' : 'trabajó en recuperar la zona';
      continue;
    }
    let budget = volunteerJornales(v);
    // En la huerta, primero recoger lo maduro y sembrar lo de temporada
    if (v.zone === 'huerta') {
      const used = autoGarden(s, budget);
      if (used) v.lastWork = 'recogió y sembró los bancales';
      budget -= used;
    }
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
