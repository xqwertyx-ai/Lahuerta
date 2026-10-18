// Productos, materiales y animales. Precios en euros.
// season: multiplicador de precio por estación [primavera, verano, otoño, invierno]

export const PRODUCTS = {
  huevos:     { name: 'Huevos', unit: 'docena', price: 3.5, season: [1, 1.05, 1, 1.1], food: 1, basket: true },
  hortalizas: { name: 'Hortalizas', unit: 'cesta', price: 7, season: [1.1, 0.85, 1, 1.3], food: 1, basket: true },
  higos:      { name: 'Higos', unit: 'kilo', price: 4, season: [1.4, 0.9, 1.0, 1.5], food: 1, basket: true },
  uvas:       { name: 'Uvas de la parra', unit: 'kilo', price: 2.8, season: [1.3, 1, 0.9, 1.3], food: 1, basket: true },
  miel:       { name: 'Miel', unit: 'tarro', price: 9, season: [1.05, 0.95, 1, 1.15], basket: true },
  lana:       { name: 'Lana', unit: 'vellón', price: 5, season: [0.9, 1, 1.05, 1.1] },
  queso:      { name: 'Queso de oveja', unit: 'pieza', price: 14, season: [0.95, 1, 1.05, 1.1], food: 2, basket: true },
  bellota:    { name: 'Bellota', unit: 'saco', price: 7, season: [1.2, 1.3, 0.85, 0.95] },
  cerdo:      { name: 'Cerdo ibérico de bellota', unit: 'animal', price: 240, season: [1, 1, 0.95, 1.1] },
  lena:       { name: 'Leña de encina', unit: 'carga', price: 6, season: [0.8, 0.7, 1.1, 1.35], material: true },
  carbon:     { name: 'Carbón de encina', unit: 'saco', price: 13, season: [0.85, 0.8, 1.1, 1.3] },
  gurumelos:  { name: 'Gurumelos', unit: 'kilo', price: 22, season: [1.2, 1.2, 1, 1.1], basket: true },
  aceite:     { name: 'Aceite de los olivos', unit: 'litro', price: 9, season: [1, 1.05, 1.1, 0.95], basket: true },
  lavanda:    { name: 'Lavanda', unit: 'ramillete', price: 4, season: [1, 0.9, 1.1, 1.2], basket: true },
};

// Materiales para el mantenimiento (la leña es a la vez producto y material)
export const MATERIALS = {
  lena:        { name: 'Leña', buy: 7 },
  piedra:      { name: 'Piedra', buy: 4 },
  cal:         { name: 'Cal', buy: 6 },
  herramientas:{ name: 'Herramientas', buy: 15 },
};

// Animales: se compran en el mercado y viven en una zona
export const ANIMALS = {
  gallinas: { name: 'Gallinas', price: 8, zone: 'corral', max: 16, unit: 'gallina' },
  ovejas:   { name: 'Ovejas', price: 70, zone: 'corral', max: 10, unit: 'oveja' },
  cerdos:   { name: 'Cerdos ibéricos', price: 60, zone: 'dehesa', max: 8, unit: 'lechón' },
  colmenas: { name: 'Colmenas', price: 45, zone: 'colmenar', max: 10, unit: 'colmena' },
};

export const CHANNELS = {
  coop:   { name: 'Cooperativa', desc: 'Siempre abierta. Paga menos, pero lo compra todo.' },
  market: { name: 'Mercado de Fuente Obejuna', desc: 'Una vez por semana. Buen precio si no inundas el puesto.' },
  basket: { name: 'Cestas a visitantes', desc: 'Lo mejor pagado, pero solo si hay huéspedes en la finca.' },
};
