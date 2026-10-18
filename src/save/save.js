// Guardado automático en localStorage, copia del inicio de estación y exportar/importar.
import { migrate, STATE_VERSION } from '../sim/state.js';

const KEY = 'huerta-del-pianista.save';
const SEASON_KEY = 'huerta-del-pianista.season';
const SETTINGS_KEY = 'huerta-del-pianista.settings';

function storage() {
  try { return window.localStorage; } catch { return null; }
}

function clean(s) {
  // Fuera lo que no se guarda (señales para la interfaz)
  const { _signals, ...rest } = s;
  return rest;
}

export function pack(s) {
  return JSON.stringify({ app: 'la-huerta-del-pianista', v: STATE_VERSION, savedAt: new Date().toISOString(), state: clean(s) });
}

export function unpack(text) {
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('El texto no es una partida válida.'); }
  const st = data && (data.state || data);
  if (!st || typeof st !== 'object' || !st.zones || typeof st.day !== 'number') throw new Error('No parece una partida de La Huerta del Pianista.');
  return migrate(st);
}

export function save(s) {
  const ls = storage();
  if (!ls) return false;
  try { ls.setItem(KEY, pack(s)); return true; } catch { return false; }
}

export function load() {
  const ls = storage();
  const t = ls && ls.getItem(KEY);
  if (!t) return null;
  try { return unpack(t); } catch { return null; }
}

export function hasSave() {
  const ls = storage();
  return !!(ls && ls.getItem(KEY));
}

export function savedInfo() {
  const ls = storage();
  const t = ls && ls.getItem(KEY);
  if (!t) return null;
  try { const d = JSON.parse(t); return { savedAt: d.savedAt, day: d.state.day }; } catch { return null; }
}

export function clearSave() {
  const ls = storage();
  if (!ls) return;
  ls.removeItem(KEY);
  ls.removeItem(SEASON_KEY);
}

export function saveSeasonSnapshot(s) {
  const ls = storage();
  if (!ls) return;
  try { ls.setItem(SEASON_KEY, pack(s)); } catch { /* sin espacio */ }
}

export function loadSeasonSnapshot() {
  const ls = storage();
  const t = ls && ls.getItem(SEASON_KEY);
  if (!t) return null;
  try { return unpack(t); } catch { return null; }
}

export function exportFile(s) {
  const blob = new Blob([pack(s)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `huerta-del-pianista-dia${s.day}.json`;
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

export function loadSettings() {
  const ls = storage();
  const def = { music: 0.7, ambience: 0.6, sfx: 0.7, lofi: true, pauseBook: true, names: false, bigText: false, seenTips: 0 };
  try { return { ...def, ...JSON.parse((ls && ls.getItem(SETTINGS_KEY)) || '{}') }; } catch { return def; }
}

export function saveSettings(o) {
  const ls = storage();
  if (!ls) return;
  try { ls.setItem(SETTINGS_KEY, JSON.stringify(o)); } catch { /* nada */ }
}
