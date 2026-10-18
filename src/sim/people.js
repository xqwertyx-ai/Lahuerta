// Voluntarios y empleados: llegadas, ánimo, comida, despedidas y encargos de zona.
import { BALANCE } from '../data/balance.js';
import { VOLUNTEERS, VOLUNTEER_BY_ID, TRAITS, SKILLS } from '../data/volunteers.js';
import { PRODUCTS } from '../data/products.js';
import { rand, chance, randInt, pick } from './rng.js';
import { addLog, signal, clamp, addStock } from './effects.js';
import { stopped, foodCostFactor } from './hardship.js';

// Concordancia: adj(v, 'contento') → contenta / contento
export function adj(info, word) { return info.g === 'f' ? word.replace(/o$/, 'a') : word; }

export function traitOf(v) { return TRAITS[VOLUNTEER_BY_ID[v.id].trait] || {}; }
export function infoOf(v) { return VOLUNTEER_BY_ID[v.id]; }

export function hasSkill(s, skill) {
  return s.volunteers.some((v) => infoOf(v).skill === skill);
}

export function skillName(skill) { return SKILLS[skill] || skill; }

export function bedsTotal(s) {
  if (stopped(s, 'beds')) return 1;   // con el tejado hundido solo queda una cama seca
  return BALANCE.bedsBase + Math.floor(s.zones.cortijo.cons * BALANCE.bedsPerCortijo);
}

export function volunteerJornales(v) {
  if ((v.rest || 0) > 0) return 0;     // de reposo
  return BALANCE.volunteerJornales + (traitOf(v).jornales || 0);
}

export function playerJornales(s) {
  let j = BALANCE.playerJornales;
  if (s.mood < 25) j -= 1;
  else if (s.mood > 75) j += 1;
  return Math.max(1, j);
}

// Jornales del día: tú + voluntarios sin encargo + empleados
export function dailyJornales(s) {
  let j = playerJornales(s) + s.employees * BALANCE.employeeJornales;
  for (const v of s.volunteers) if (!v.zone) j += volunteerJornales(v);
  return Math.floor(j);
}

// ── Llegadas ──
function canArrive(s, info) {
  if (s.volunteersSeen.includes(info.id)) return false;
  const c = info.cond || {};
  if (c.minDay && s.day < c.minDay) return false;
  if (c.zoneUnlocked && !s.zones[c.zoneUnlocked].unlocked) return false;
  return true;
}

export function arrivalChance(s) {
  let p = BALANCE.volunteerArrivalBase + s.rep * BALANCE.volunteerArrivalPerRep;
  if (s.day <= s.recommendUntil) p *= 1.6;
  if (s.day === 2 && s.stats.volunteersArrived === 0) p = 1; // el primero llega pronto
  return p;
}

export function tryArrival(s) {
  if (s.volunteers.length >= bedsTotal(s)) return null;
  if (!chance(s, arrivalChance(s))) return null;
  let pool = VOLUNTEERS.filter((v) => canArrive(s, v));
  if (!pool.length) {
    // Todos han pasado ya: vuelven los que se fueron contentos
    pool = VOLUNTEERS.filter((v) => s.flags['contento_' + v.id] && !s.volunteers.some((x) => x.id === v.id));
    if (!pool.length) return null;
  }
  // Prioriza oficios que hacen falta para desbloquear algo
  const needed = new Set();
  if (!s.zones.colmenar.unlocked) needed.add('apicultura');
  if (s.zones.piano.unlocked && s.zones.piano.cons >= 40) needed.add('afinacion');
  const weightedPool = pool.flatMap((v) => (needed.has(v.skill) ? [v, v, v] : [v]));
  const info = pick(s, weightedPool);
  return arrive(s, info.id);
}

export function arrive(s, id) {
  const info = VOLUNTEER_BY_ID[id];
  if (!info) return null;
  const [a, b] = BALANCE.volunteerStayDays;
  const v = { id, arrived: s.day, leaves: s.day + randInt(s, a, b), happy: 60, zone: null, extended: false };
  s.volunteers.push(v);
  if (!s.volunteersSeen.includes(id)) s.volunteersSeen.push(id);
  s.stats.volunteersArrived++;
  addLog(s, `Llega ${info.name}, de ${info.origin}. Sabe de ${skillName(info.skill)}. «${info.lines[0]}»`, 'volunteer');
  signal(s, 'volunteer', { id, arrive: true });
  return v;
}

// ── Comida ──
const FOOD_ORDER = Object.keys(PRODUCTS).filter((k) => PRODUCTS[k].food && k !== 'jamon').sort((a, b) => (PRODUCTS[b].spoil || 0) - (PRODUCTS[a].spoil || 0));

export function feedVolunteers(s) {
  let fedFromFarm = 0, paid = 0;
  for (const v of s.volunteers) {
    let need = BALANCE.foodFromFarmPerVolunteer * (traitOf(v).food || 1);
    for (const p of FOOD_ORDER) {
      if (need <= 0) break;
      const val = PRODUCTS[p].food || 1;
      while (need > 0 && s.products[p] >= 1) {
        addStock(s, p, -1);
        need -= val;
      }
    }
    if (need > 0) {
      const cost = Math.round(Math.ceil(need) * BALANCE.foodCostPerVolunteer * foodCostFactor(s));
      addStock(s, 'money', -cost);
      s.stats.spent += cost;
      s.foodWeek = (s.foodWeek || 0) + cost;
      s.stats.food = (s.stats.food || 0) + cost;
      paid += cost;
      v._fed = 0;
    } else {
      v._fed = 1;
      fedFromFarm++;
    }
  }
  return { fedFromFarm, paid };
}

// ── Ánimo de cada voluntario y despedidas ──
export function dailyVolunteers(s) {
  const cook = hasSkill(s, 'cocina') ? 1 : 0;
  const leaving = [];
  for (const v of s.volunteers) {
    const info = infoOf(v);
    // La alegría tiende a un punto medio: hay que cuidarla (buena cama, comida de la finca, ratos libres)
    let d = (BALANCE.happyRest - v.happy) * BALANCE.happyDrift;
    d += (s.zones.cortijo.cons - 60) / 40;      // la cama
    d += v._fed ? 0.6 : -0.8;                   // comer de la huerta (o de lata comprada)
    d += cook * 0.5;
    d += (s.mood - 55) / 40;
    if (v.zone && infoOf(v).skill && zoneUsesSkill(v.zone, info.skill)) d += 0.6;
    if (s.weather === 'tormenta' || s.weather === 'helada') d -= 0.5;
    if ((v.rest || 0) > 0) v.rest--;
    v.happy = clamp(v.happy + d + (rand(s) - 0.5), 0, 100);
    if (s.day >= v.leaves) leaving.push(v);
  }
  return leaving;
}

let ZONE_SKILLS = null;
export function setZoneSkillMap(map) { ZONE_SKILLS = map; }
function zoneUsesSkill(zoneId, skill) { return ZONE_SKILLS ? (ZONE_SKILLS[zoneId] || []).includes(skill) : false; }

export function departVolunteer(s, v) {
  const info = infoOf(v);
  const i = s.volunteers.indexOf(v);
  if (i < 0) return;
  s.volunteers.splice(i, 1);
  s.stats.volunteersLeft++;
  const t = traitOf(v);
  if (v.happy >= 60) {
    const rep = 2 + (t.repOnLeave || 0) + Math.round((v.happy - 60) / 15);
    s.rep = clamp(s.rep + rep, 0, 100);
    s.recommendUntil = Math.max(s.recommendUntil, s.day + 10);
    s.flags['contento_' + v.id] = true;
    addLog(s, `${info.name} se marcha ${adj(info, 'contento')}. «${pick(s, info.lines)}» Recomendará la finca (+${rep} de reputación).`, 'volunteer');
  } else if (v.happy < 35) {
    s.rep = clamp(s.rep - 2, 0, 100);
    addLog(s, `${info.name} se marcha antes de tiempo, algo ${adj(info, 'decepcionado')}. La cama era dura y la comida, poca.`, 'bad');
  } else {
    s.rep = clamp(s.rep + 1, 0, 100);
    addLog(s, `${info.name} se despide. Ha sido una buena temporada.`, 'volunteer');
  }
  signal(s, 'volunteer', { id: v.id, leave: true });
}

export function assignVolunteer(s, volunteerId, zoneId) {
  const v = s.volunteers.find((x) => x.id === volunteerId);
  if (!v) return false;
  // A una zona borrada solo se le puede encargar si su recuperación ya ha empezado
  if (zoneId && !s.zones[zoneId]?.unlocked && !(s.zones[zoneId]?.unlockWork > 0)) return false;
  v.zone = zoneId || null;
  return true;
}

// ── Empleados ──
export function hireEmployee(s) {
  if (s.employees >= 3) return { ok: false, text: 'Ya no caben más jornaleros en la casa.' };
  if (s.money < BALANCE.employeeWagePerDay * 3) return { ok: false, text: 'Hace falta dinero para pagar al menos tres días.' };
  s.employees++;
  addLog(s, `Contratas a un jornalero del pueblo (${BALANCE.employeeWagePerDay} € al día).`, 'info');
  return { ok: true };
}

export function fireEmployee(s) {
  if (s.employees <= 0) return { ok: false };
  s.employees--;
  addLog(s, 'Un jornalero vuelve al pueblo. Os despedís con un apretón de manos.', 'info');
  return { ok: true };
}

export function payEmployees(s) {
  if (!s.employees) return 0;
  const w = s.employees * BALANCE.employeeWagePerDay;
  addStock(s, 'money', -w);
  s.stats.spent += w;
  return w;
}
