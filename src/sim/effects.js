// Utilidades compartidas por la simulación: diario, señales para la interfaz,
// costes y efectos declarativos.
import { PRODUCTS, MATERIALS } from '../data/products.js';

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export function addLog(s, text, kind = 'info') {
  s.log.push({ d: s.day, h: Math.floor(s.hour), t: text, k: kind });
  if (s.log.length > 160) s.log.splice(0, s.log.length - 160);
}

// Señales para la interfaz y el audio (se vacían cada fotograma; no se guardan)
export function signal(s, type, data = {}) {
  if (!s._signals) s._signals = [];
  s._signals.push({ type, ...data });
  if (s._signals.length > 50) s._signals.shift();
}

export function drainSignals(s) {
  const out = s._signals || [];
  s._signals = [];
  return out;
}

const isMaterial = (k) => k in MATERIALS;
const isProduct = (k) => k in PRODUCTS;

export function stockOf(s, key) {
  if (key === 'money') return s.money;
  if (key === 'jornales') return s.jornales;
  if (isMaterial(key)) return s.materials[key] || 0;
  if (isProduct(key)) return s.products[key] || 0;
  return 0;
}

// ¿Llega para pagar este coste? (el dinero puede quedar en negativo solo con el gasto de comida; aquí no)
export function canAfford(s, cost = {}) {
  for (const [k, v] of Object.entries(cost)) {
    if (!v) continue;
    if (k === 'money') { if (s.money < v) return false; continue; }
    if (stockOf(s, k) + 1e-9 < v) return false;
  }
  return true;
}

export function missingOf(s, cost = {}) {
  const out = [];
  for (const [k, v] of Object.entries(cost)) {
    if (!v) continue;
    if (stockOf(s, k) + 1e-9 < v) out.push(k);
  }
  return out;
}

export function payCost(s, cost = {}) {
  for (const [k, v] of Object.entries(cost)) {
    if (!v) continue;
    addStock(s, k, -v);
  }
}

export function addStock(s, key, v) {
  if (key === 'money') { s.money = Math.round((s.money + v) * 100) / 100; return; }
  if (key === 'jornales') { s.jornales = Math.max(0, s.jornales + v); return; }
  if (isMaterial(key)) { s.materials[key] = Math.max(0, Math.round(((s.materials[key] || 0) + v) * 100) / 100); return; }
  if (isProduct(key)) { s.products[key] = Math.max(0, Math.round(((s.products[key] || 0) + v) * 100) / 100); }
}

// Efectos declarativos de eventos (ver data/events.js)
export function applyEffects(s, eff = {}, h) {
  if (eff.money) addStock(s, 'money', eff.money);
  if (eff.mood) s.mood = clamp(s.mood + eff.mood, 0, 100);
  if (eff.rep) s.rep = clamp(s.rep + eff.rep, 0, 100);
  if (eff.water) s.water = clamp(s.water + eff.water, 0, 100);
  if (eff.materials) for (const [k, v] of Object.entries(eff.materials)) addStock(s, k, v);
  if (eff.products) for (const [k, v] of Object.entries(eff.products)) addStock(s, k, v);
  if (eff.zones) {
    for (const [id, d] of Object.entries(eff.zones)) {
      const list = id === 'all' ? Object.keys(s.zones) : [id];
      for (const zid of list) {
        const z = s.zones[zid];
        if (z && z.unlocked) z.cons = clamp(z.cons + d, 0, 100);
      }
    }
  }
  if (eff.weeds) {
    for (const [id, d] of Object.entries(eff.weeds)) {
      const list = id === 'all' ? Object.keys(s.zones) : [id];
      for (const zid of list) {
        const z = s.zones[zid];
        if (z && z.unlocked && z.weeds != null) z.weeds = clamp(z.weeds + d, 0, 100);
      }
    }
  }
  if (eff.flag) s.flags[eff.flag] = true;
  if (eff.item && h) h.giveItem(eff.item);
}

export const NAMES = {
  money: '€', jornales: 'jornales', lena: 'leña', piedra: 'piedra', cal: 'cal', herramientas: 'herramientas',
};

export function labelOf(key) {
  if (NAMES[key]) return NAMES[key];
  if (PRODUCTS[key]) return PRODUCTS[key].name.toLowerCase();
  return key;
}

export function costLabel(cost = {}) {
  const parts = [];
  for (const [k, v] of Object.entries(cost)) {
    if (!v) continue;
    if (k === 'money') parts.push(`${v} €`);
    else if (k === 'jornales') parts.push(`${v} ${v === 1 ? 'jornal' : 'jornales'}`);
    else parts.push(`${fmtQty(v)} ${labelOf(k)}`);
  }
  return parts.join(' · ');
}

export function fmtQty(v) {
  if (Math.abs(v - Math.round(v)) < 0.01) return String(Math.round(v));
  if (v < 1) return v === 0.25 ? '¼' : v === 0.5 ? '½' : v.toFixed(2);
  return v.toFixed(1);
}
