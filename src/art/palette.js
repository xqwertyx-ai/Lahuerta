// Colores de las aguadas según la estación, y el tinte del papel según la hora.
import { mix } from './ink.js';

const BASE = {
  whitewash: '#f4efe4', wallShade: '#a9b4c2', tile: '#2f5f9e', tileLight: '#7fa6d6',
  roof: '#b8603a', roofDark: '#8a3f25', door: '#b8301f', iron: '#2b2420',
  granite: '#9c968c', graniteDark: '#6f6a62', water: '#5d8fa6', waterDeep: '#3d6a80',
  earth: '#b07a4a', redEarth: '#a65a35', path: '#c9a173', wood: '#8a6440',
  lavender: '#8a76b8', oleander: '#ffffff', oleanderPink: '#d97a92', mimosa: '#e9c430',
  pot: '#4f8a3a', yellow: '#e2b33a', hen: '#b3592a', sky: '#9cc3dc',
};

const SEASON = [
  { // primavera
    grass: '#8fb35a', grassDark: '#5f8a3a', foliage: '#6e9a45', foliageDark: '#476d2c', oak: '#55703a',
    pine: '#4f6b3f', ground: '#b9a06a', flowers: '#e8d34a', sky: '#9fc7e3', paper: '#efe4c6', accent: '#e07a8f',
  },
  { // verano
    grass: '#cdb46a', grassDark: '#a88d48', foliage: '#7b8f43', foliageDark: '#556a2e', oak: '#56683a',
    pine: '#536a3c', ground: '#d4b77c', flowers: '#e0a640', sky: '#8fbfdf', paper: '#f1e3bd', accent: '#d9a040',
  },
  { // otoño
    grass: '#a9a35e', grassDark: '#7f7a3e', foliage: '#b08a3a', foliageDark: '#7a6a2e', oak: '#56693c',
    pine: '#4e6640', ground: '#bf9a66', flowers: '#c2622f', sky: '#a3bfd0', paper: '#eedfbf', accent: '#c46a2c',
  },
  { // invierno
    grass: '#94a07c', grassDark: '#6c7a5c', foliage: '#7d8a6c', foliageDark: '#556450', oak: '#4e6347',
    pine: '#475f45', ground: '#a8a08e', flowers: '#c9d3dc', sky: '#b4c4cf', paper: '#e9e3d4', accent: '#8ea3b5',
  },
];

export function palette(season) {
  return { ...BASE, ...SEASON[season] };
}

// Tinte del momento del día sobre todo el plano
// Devuelve { color, alpha, mode } — se pinta encima con ese modo de mezcla
export function timeTint(hour, season) {
  const keys = [
    [0, '#1d2a52', 0.55], [4.5, '#1d2a52', 0.52], [6, '#e8a24a', 0.22], [7.5, '#f2c572', 0.12],
    [9, '#ffffff', 0], [17, '#ffffff', 0], [18.5, '#f0a050', 0.16], [20, '#c25a3a', 0.24],
    [21.2, '#2a3364', 0.42], [22.5, '#1d2a52', 0.55], [24, '#1d2a52', 0.55],
  ];
  let a = keys[0], b = keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (hour >= keys[i][0] && hour <= keys[i + 1][0]) { a = keys[i]; b = keys[i + 1]; break; }
  }
  const t = (hour - a[0]) / Math.max(0.001, b[0] - a[0]);
  let color = mix(a[1], b[1], t);
  let alpha = a[2] + (b[2] - a[2]) * t;
  // El invierno es más gris y el verano más pajizo a mediodía
  if (alpha < 0.05) {
    if (season === 3) { color = '#9fb0c0'; alpha = 0.08; }
    if (season === 1) { color = '#f0d590'; alpha = 0.07; }
  }
  return { color, alpha, night: hour < 5.5 || hour > 21 };
}

export const SEASON_PAPER = SEASON.map((s) => s.paper);
