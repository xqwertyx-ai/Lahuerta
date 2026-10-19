// El tractor Pascuali: aparece con la huerta al 100 %, se arregla con jornales (o en el taller)
// y luego ahorra un jornal en los trabajos de carga y arado.
import { TRACTOR } from '../data/tractor.js';
import { BALANCE } from '../data/balance.js';
import { addLog, signal, canAfford, payCost, addStock, missingOf, labelOf, costLabel, clamp } from './effects.js';
import { stopped } from './hardship.js';

export { TRACTOR };

export function tractorState(s) {
  if (!s.tractor) s.tractor = { found: false, work: 0, started: false, ready: false };
  return s.tractor;
}

export function tractorReady(s) { return !!(s.tractor && s.tractor.ready); }

// ¿Ahorra un jornal en esta tarea? (solo si funciona y no está averiado)
export function tractorSaves(s, task) {
  return !!task.tractor && tractorReady(s) && !stopped(s, 'tractor');
}

export function checkTractor(s) {
  const t = tractorState(s);
  if (t.found) return;
  const st = s.zones[TRACTOR.zone];
  if (!st || !st.unlocked || Math.max(st.maxCons || 0, st.cons) < BALANCE.itemFullCons) return;
  t.found = true;
  addLog(s, `${TRACTOR.name}. ${TRACTOR.found}`, 'item');
  signal(s, 'tractor', { found: true });
}

export function tractorBlocker(s, jornales = s.jornales) {
  const t = tractorState(s);
  if (!t.found) return 'Todavía no ha aparecido';
  if (t.ready) return 'Ya funciona';
  if (!t.started && !canAfford(s, TRACTOR.cost)) return 'Falta ' + missingOf(s, TRACTOR.cost).map(labelOf).join(', ');
  if (jornales < 1) return 'No quedan jornales hoy';
  return null;
}

function finish(s) {
  const t = tractorState(s);
  t.ready = true;
  s.mood = clamp(s.mood + 6, 0, 100);
  addLog(s, TRACTOR.ready, 'good');
  signal(s, 'tractor', { ready: true });
}

export function repairTractor(s, { budget = null } = {}) {
  const avail = budget != null ? budget : s.jornales;
  const b = tractorBlocker(s, avail);
  if (b) return { ok: false, text: b };
  const t = tractorState(s);
  if (!t.started) { payCost(s, TRACTOR.cost); s.stats.spent += TRACTOR.cost.money || 0; t.started = true; }
  const put = Math.min(Math.floor(avail), TRACTOR.work - t.work);
  if (budget == null) s.jornales -= put;
  t.work += put;
  if (t.work >= TRACTOR.work) { finish(s); return { ok: true, done: true, text: 'El Pascuali arranca', delta: 0 }; }
  return { ok: true, done: false, used: put, text: `Arreglando el Pascuali: ${t.work}/${TRACTOR.work}`, delta: 0 };
}

export function tractorProCost(s) {
  const t = tractorState(s);
  return Math.round((TRACTOR.work - t.work) * TRACTOR.pro + (t.started ? 0 : TRACTOR.cost.money || 0));
}

export function tractorProBlocker(s) {
  const t = tractorState(s);
  if (!t.found) return 'Todavía no ha aparecido';
  if (t.ready) return 'Ya funciona';
  if (s.money < tractorProCost(s)) return 'No llega el dinero';
  if (!t.started && !canAfford(s, { herramientas: TRACTOR.cost.herramientas })) return 'Faltan herramientas';
  return null;
}

// Llevarlo al taller del pueblo: listo hoy, pero cuesta
export function tractorToWorkshop(s) {
  const b = tractorProBlocker(s);
  if (b) return { ok: false, text: b };
  const cost = tractorProCost(s);
  const t = tractorState(s);
  if (!t.started) { addStock(s, 'herramientas', -(TRACTOR.cost.herramientas || 0)); t.started = true; }
  addStock(s, 'money', -cost);
  s.stats.spent += cost;
  signal(s, 'coins', { amount: -cost });
  t.work = TRACTOR.work;
  finish(s);
  return { ok: true, done: true, text: `El taller del pueblo deja el Pascuali como nuevo (${cost} €)`, delta: 0 };
}

export function tractorCostLabel() {
  return `${TRACTOR.work} jornales · al empezar: ${costLabel(TRACTOR.cost)}`;
}
