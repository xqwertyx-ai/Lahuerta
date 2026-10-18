// Calendario: día absoluto → estación, año, día de la semana.
import { SEASONS } from '../data/seasons.js';

export const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
export const MARKET_WEEKDAY = 3; // jueves

export function seasonIndex(s, day = s.day) {
  const d = Math.floor((day - 1) / s.cfg.daysPerSeason);
  return (s.cfg.startSeason + d) % 4;
}

export function yearOf(s, day = s.day) {
  const seasonsElapsed = Math.floor((day - 1) / s.cfg.daysPerSeason) + s.cfg.startSeason;
  return 1 + Math.floor(seasonsElapsed / 4) - Math.floor(s.cfg.startSeason / 4);
}

export function dayOfSeason(s, day = s.day) { return ((day - 1) % s.cfg.daysPerSeason) + 1; }
export function weekday(s, day = s.day) { return (day - 1) % 7; }
export function isMarketDay(s, day = s.day) { return weekday(s, day) === MARKET_WEEKDAY; }
export function daysToMarket(s) { return (MARKET_WEEKDAY - weekday(s) + 7) % 7; }
export function isSeasonStart(s, day = s.day) { return dayOfSeason(s, day) === 1; }
export function season(s) { return SEASONS[seasonIndex(s)]; }

// Momento del día para el arte y la música
export function timeOfDay(hour) {
  if (hour < 5.5 || hour >= 21.5) return 'noche';
  if (hour < 8) return 'amanecer';
  if (hour < 18.5) return 'dia';
  return 'atardecer';
}

export function dateLabel(s) {
  return `${WEEKDAYS[weekday(s)]} ${dayOfSeason(s)} · ${season(s).name} · Año ${yearOf(s)}`;
}

export function clockLabel(hour) {
  const h = Math.floor(hour) % 24;
  const m = Math.floor((hour - Math.floor(hour)) * 60 / 10) * 10;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
