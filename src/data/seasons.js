// Estaciones y clima. Los pesos del tiempo son relativos dentro de cada estación.

export const SEASONS = [
  {
    id: 'primavera', name: 'Primavera', adj: 'primaveral',
    weedMult: 1.8, decayMult: 0.9,
    weather: { sol: 5, nubes: 3, lluvia: 3, viento: 1.5, tormenta: 0.3 },
    note: 'La dehesa se cubre de flores y la hierba crece sin pedir permiso.',
  },
  {
    id: 'verano', name: 'Verano', adj: 'veraniego',
    weedMult: 0.7, decayMult: 1.1,
    weather: { sol: 7, calor: 3, nubes: 1, tormenta: 0.6, viento: 0.6 },
    note: 'Las chicharras cuentan las horas. La paja cruje bajo los pies.',
  },
  {
    id: 'otono', name: 'Otoño', adj: 'otoñal',
    weedMult: 1.0, decayMult: 1.0,
    weather: { sol: 4, nubes: 3, lluvia: 3, viento: 1.5, niebla: 1.2 },
    note: 'Caen las bellotas y huele a tierra mojada.',
  },
  {
    id: 'invierno', name: 'Invierno', adj: 'invernal',
    weedMult: 0.3, decayMult: 1.2,
    weather: { sol: 3, nubes: 3, lluvia: 2.5, helada: 2.2, niebla: 1.5, viento: 1 },
    note: 'Escarcha en los muros y humo de encina en la chimenea.',
  },
];

// Efectos de cada tiempo sobre el día
export const WEATHER = {
  sol:      { name: 'Despejado', icon: '☀', decay: 1.0, weeds: 1.0, prod: 1.0, mood: 0.25, visitors: 1.1 },
  nubes:    { name: 'Nublado', icon: '☁', decay: 1.0, weeds: 1.0, prod: 0.95, mood: 0, visitors: 1.0 },
  lluvia:   { name: 'Lluvia', icon: '☂', decay: 1.25, weeds: 1.4, prod: 1.05, mood: -0.3, visitors: 0.7, water: 12 },
  tormenta: { name: 'Tormenta', icon: '⚡', decay: 1.8, weeds: 1.2, prod: 0.9, mood: -1, visitors: 0.5, water: 18 },
  calor:    { name: 'Calor', icon: '☼', decay: 1.3, weeds: 0.6, prod: 0.85, mood: -0.6, visitors: 0.9, water: -10, fire: true },
  viento:   { name: 'Viento', icon: '≋', decay: 1.2, weeds: 1.0, prod: 0.95, mood: -0.2, visitors: 0.9 },
  helada:   { name: 'Helada', icon: '❄', decay: 1.4, weeds: 0.2, prod: 0.7, mood: -0.4, visitors: 0.8 },
  niebla:   { name: 'Niebla', icon: '░', decay: 1.05, weeds: 1.0, prod: 0.95, mood: 0.2, visitors: 0.8 },
};
