// Cultivos de la huerta. Cada temporada se siembra lo suyo en los bancales y se recoge a los días.
// seasons: en qué estaciones se puede sembrar (0 primavera, 1 verano, 2 otoño, 3 invierno)
// days: días hasta estar listo con buena agua y la huerta cuidada · yield: lo que da un bancal

export const CROPS = {
  lechugas:  { name: 'Lechugas', seasons: [0], days: 5, yield: 6, color: '#7fb04a' },
  habas:     { name: 'Habas', seasons: [3, 0], days: 9, yield: 6, color: '#5f8a3a' },
  tomates:   { name: 'Tomates', seasons: [1], days: 7, yield: 8, color: '#c9412f' },
  pimientos: { name: 'Pimientos', seasons: [1], days: 8, yield: 6, color: '#3f8a2a' },
  calabazas: { name: 'Calabazas', seasons: [2], days: 9, yield: 5, color: '#d9852a' },
  coles:     { name: 'Coles', seasons: [2, 3], days: 8, yield: 5, color: '#8aa86a' },
  ajos:      { name: 'Ajos', seasons: [3], days: 11, yield: 6, color: '#e8e0c8' },
};

export const BEDS = 3;            // bancales de la huerta
export const SOW_JORNALES = 1;
export const HARVEST_JORNALES = 1;
export const OVERRIPE_DAYS = 4;   // días que aguanta lo maduro en la mata antes de echarse a perder

// Recetas de la cocina del cortijo
// in: ingredientes (group:huerta acepta cualquier verdura de la huerta) · out: lo que sale
export const RECIPES = [
  { id: 'conservas', name: 'Hacer conservas de la huerta', in: { 'group:huerta': 3 }, out: { conservas: 2 }, jornales: 1, skill: 'cocina',
    text: 'Botes hirviendo al baño maría y la cocina oliendo a verano.' },
  { id: 'mermelada', name: 'Hacer mermelada de higo o uva', in: { 'any:higos,uvas': 3 }, out: { mermelada: 2 }, jornales: 1, skill: 'cocina',
    text: 'A fuego lento, removiendo con cuchara de palo.' },
  { id: 'matanza', name: 'Hacer la matanza', in: { cerdo: 1 }, out: { jamon: 1, embutido: 6 }, jornales: 3, seasons: [2, 3], skill: 'cocina',
    text: 'Día de matanza con los vecinos: un jamón a curar en la sierra y ristras de chorizo y salchichón.' },
];
