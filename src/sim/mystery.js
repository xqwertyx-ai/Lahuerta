// La familia y el misterio del pianista: objetos, hilos, hipótesis y el tema.
import { ITEMS, ITEM_BY_ID } from '../data/items.js';
import { FAMILY, FAMILY_BY_ID } from '../data/family.js';
import { HYPOTHESES, THEME, THEME_START, REVELATION } from '../data/story.js';
import { addLog, signal } from './effects.js';
import { traitOf } from './people.js';

export function giveItem(s, id) {
  const it = ITEM_BY_ID[id];
  if (!it || s.items.includes(id)) return false;
  s.items.push(id);
  let bonus = 0;
  for (const v of s.volunteers) bonus += traitOf(v).clueBonus || 0;
  for (const [h, d] of Object.entries(it.hyp || {})) {
    if (s.hyp[h] !== undefined) s.hyp[h] += d + (d > 0 ? bonus * 0.25 : 0);
  }
  addLog(s, `Encuentras ${lowerFirst(it.name)}. ${it.text}`, 'item');
  signal(s, 'item', { id });
  // Hitos de cada hilo familiar
  if (it.thread !== 'pianista') {
    const fam = FAMILY_BY_ID[it.thread];
    const n = threadCount(s, it.thread);
    const line = fam && fam.milestones[Math.min(n, fam.milestones.length) - 1];
    if (line) addLog(s, `✎ ${fam.name}: ${line}`, 'family');
  }
  if (it.score) signal(s, 'theme', { full: false });
  checkRevelation(s);
  return true;
}

export function clue(s, hyp, amount = 1) {
  if (s.hyp[hyp] !== undefined) s.hyp[hyp] += amount;
}

export function threadCount(s, thread) {
  return s.items.filter((id) => ITEM_BY_ID[id]?.thread === thread).length;
}

export function threadTotal(thread) {
  return ITEMS.filter((i) => i.thread === thread).length;
}

export function threads(s) {
  const list = [{ id: 'pianista', name: 'El pianista' }, ...FAMILY.map((f) => ({ id: f.id, name: f.name }))];
  return list.map((t) => ({ ...t, found: threadCount(s, t.id), total: threadTotal(t.id) }));
}

export function themeNotesKnown(s) {
  if (s.flags.revealed) return THEME.length;
  let n = THEME_START + Math.min(2, s.themeHints || 0);
  for (const id of s.items) n += ITEM_BY_ID[id]?.score || 0;
  return Math.min(THEME.length, n);
}

export function hypothesesRanked(s) {
  return HYPOTHESES.map((h) => ({ ...h, weight: s.hyp[h.id] ?? 0, discarded: (s.hyp[h.id] ?? 0) < 0 }))
    .sort((a, b) => b.weight - a.weight);
}

export function revelationReady(s) {
  if (s.flags.revealed || s.flags.revelationQueued) return false;
  const r = REVELATION.requires;
  if (r.items && !r.items.every((id) => s.items.includes(id))) return false;
  if (r.zones) for (const [id, min] of Object.entries(r.zones)) if (s.zones[id].cons < min) return false;
  return true;
}

export function checkRevelation(s) {
  if (!revelationReady(s)) return false;
  s.flags.revelationQueued = true;
  s.eventQueue.push('revelacion');
  return true;
}

function lowerFirst(t) { return t.charAt(0).toLowerCase() + t.slice(1); }
