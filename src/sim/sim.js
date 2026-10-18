// Simulación de la finca: avanza el tiempo hora a hora y reparte el día al amanecer.
// Es pura (sin DOM): se puede ejecutar en Node para tests y simulaciones de balance.
import { BALANCE } from '../data/balance.js';
import { SEASONS, WEATHER } from '../data/seasons.js';
import { MILESTONES } from '../data/milestones.js';
import { DIARY_LINES } from '../data/story.js';
import { rand, pick, weighted } from './rng.js';
import { seasonIndex, isSeasonStart, isMarketDay, yearOf, weekday } from './calendar.js';
import { addLog, signal, clamp } from './effects.js';
import { decayHour, avgCons, autoMaintain, restoredCount, checkItems } from './farm.js';
import { produceDay, montaneraDay, waterDay, rollPriceNoise, recoverPrices, spoilDay } from './economy.js';
import { gardenDay } from './garden.js';
import { tryArrival, feedVolunteers, dailyVolunteers, departVolunteer, payEmployees, dailyJornales } from './people.js';
import { planDay, hourEvents, systemEvents, queueEvent, resolveEvent } from './events.js';
import { checkRevelation } from './mystery.js';
import { TRAITS, VOLUNTEER_BY_ID } from '../data/volunteers.js';
import { tourismOpen, tourismDawn, tourismEvening, concertDue, appeal } from './tourism.js';

// Horas de juego por segundo real a velocidad x1
export const HOURS_PER_SECOND = 24 / BALANCE.realSecondsPerDay;

// ¿Está el tiempo detenido? (evento abierto o finca dormida)
export function isBlocked(s) {
  return s.asleep != null || s.eventQueue.length > 0;
}

// Avanza `hours` horas de juego (puede ser fraccionario). Se detiene si aparece un evento.
export function advance(s, hours) {
  let left = hours;
  let guard = 0;
  while (left > 1e-9 && !isBlocked(s) && guard++ < 10000) {
    const nextWhole = Math.floor(s.hour) + 1;
    const step = Math.min(left, nextWhole - s.hour);
    decayHour(s, step);
    s.hour += step;
    left -= step;
    if (s.hour >= nextWhole - 1e-9) {
      s.hour = nextWhole;
      if (s.hour >= 24) s.hour = 0;
      hourTick(s, Math.round(s.hour) % 24);
    }
  }
  return hours - left;
}

// Avanza días completos (para tests y balance). resolver(s) decide los eventos.
export function runDays(s, days, resolver = autoResolve) {
  const target = s.day + days;
  let guard = 0;
  while (s.day < target && !s.asleep && guard++ < days * 400) {
    if (s.eventQueue.length) { resolver(s); continue; }
    advance(s, 1);
  }
}

// Resolución automática: la primera opción que se pueda pagar
export function autoResolve(s) { return resolveEvent(s, 0); }

function hourTick(s, hour) {
  if (hour === BALANCE.dawnHour) dawn(s);
  if (hour === 10 && s.autoDone !== s.day) { s.autoDone = s.day; autoMaintain(s); }
  if (hour === 19 && concertDue(s) && s.flags.concertDay !== s.day) {
    s.flags.concertDay = s.day;
    queueEvent(s, 'concierto');
  }
  if (hour === 21) tourismEvening(s);
  if (hour === 20 && rand(s) < 0.25) addLog(s, pick(s, DIARY_LINES.atardecer), 'diary');
  hourEvents(s, hour);
}

// ── Amanecer: el reparto del día ──
export function dawn(s) {
  s.day++;
  const si = seasonIndex(s);
  const season = SEASONS[si];

  // Tiempo
  s.weather = weighted(s, Object.entries(season.weather)) || 'sol';
  const w = WEATHER[s.weather];

  if (isSeasonStart(s)) {
    addLog(s, `${season.name}, año ${yearOf(s)}. ${season.note}`, 'season');
    signal(s, 'season', { season: si });
    s.flags.seasonStartDay = s.day;
  }

  // Gente
  const leaving = dailyVolunteers(s);
  for (const v of leaving) {
    const recentAsk = s.eventLast.quedarse != null && s.day - s.eventLast.quedarse < 12;
    if (v.happy >= 72 && !v.extended && !s.pendingLeave && !recentAsk) {
      s.pendingLeave = v.id;
      queueEvent(s, 'quedarse');
    } else if (v.id !== s.pendingLeave) {
      departVolunteer(s, v);
    }
  }
  tryArrival(s);
  feedVolunteers(s);
  if (weekday(s) === 0 && s.foodWeek > 0) {
    addLog(s, `Esta semana has gastado ${s.foodWeek} € en comida para los voluntarios. Con la huerta y las gallinas comerían de la finca.`, 'info');
    s.foodWeek = 0;
  }
  payEmployees(s);

  // Finca
  spoilDay(s);
  produceDay(s);
  gardenDay(s);
  montaneraDay(s);
  waterDay(s);
  rollPriceNoise(s);
  recoverPrices(s);
  tourismOpen(s);
  tourismDawn(s);

  // Ánimo
  let dm = (BALANCE.moodRestTarget - s.mood) * 0.02 * BALANCE.moodDailyDrift * 4 + w.mood;
  if (avgCons(s) < 30) dm += BALANCE.moodLowConservation;
  if (s.money < 0) dm += BALANCE.moodDebt;
  dm += restoredCount(s) * 0.15;
  for (const v of s.volunteers) dm += (VOL_MOOD(v));
  s.mood = clamp(s.mood + dm, 0, 100);

  // Recuerdos que esperaban su momento, y quizá la revelación
  checkItems(s);
  checkRevelation(s);

  // La fama no se sostiene sola: tiende a lo que la finca merece
  const repTarget = 5 + avgCons(s) * 0.25 + restoredCount(s) + appeal(s) * 4 + s.items.length * 0.3;
  if (s.rep > repTarget) s.rep = Math.max(repTarget, s.rep - BALANCE.repDecay - (s.rep - repTarget) * 0.02);

  // Jornales del día
  s.jornales = dailyJornales(s);

  // Derrota suave
  checkSleep(s);

  // Eventos
  planDay(s);
  systemEvents(s);
  if (isMarketDay(s)) addLog(s, 'Hoy es jueves: hay mercado en Fuente Obejuna.', 'info');
  if (rand(s) < 0.3) addLog(s, pick(s, DIARY_LINES.amanecer), 'diary');

  checkMilestones(s);
}

function VOL_MOOD(v) { return (TRAITS[VOLUNTEER_BY_ID[v.id].trait] || {}).mood || 0; }

// ── La finca se duerme ──
export function checkSleep(s) {
  if (s.money < BALANCE.debtLimit) {
    s.ruinDays++;
    if (s.ruinDays === BALANCE.ruinDaysToWarn) {
      addLog(s, 'Las cuentas no salen. Si sigue así una estación, la finca se dormirá.', 'bad');
      signal(s, 'warning', { kind: 'ruin' });
    }
  } else {
    s.ruinDays = 0;
  }
  if (s.day > 10 && avgCons(s) < BALANCE.abandonThreshold) {
    s.abandonDays++;
    if (s.abandonDays === 5) {
      addLog(s, 'La tinta se está borrando del cuaderno. La finca necesita cuidados.', 'bad');
      signal(s, 'warning', { kind: 'abandon' });
    }
  } else {
    s.abandonDays = Math.max(0, s.abandonDays - 2);
  }
  if (s.ruinDays >= BALANCE.ruinDaysToSleep) s.asleep = 'ruin';
  else if (s.abandonDays >= BALANCE.abandonDaysToSleep) s.asleep = 'abandon';
  if (s.asleep) signal(s, 'sleep', { kind: s.asleep });
}

export function checkMilestones(s) {
  for (const m of MILESTONES) {
    if (s.milestones.includes(m.id)) continue;
    let ok = false;
    try { ok = m.check(s); } catch { ok = false; }
    if (ok) {
      s.milestones.push(m.id);
      addLog(s, `Hito: ${m.name}. ${m.text}`, 'milestone');
      signal(s, 'milestone', { id: m.id });
    }
  }
}
