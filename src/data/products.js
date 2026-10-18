// Productos, materiales y animales. Precios en euros.
// season: multiplicador de precio por estación [primavera, verano, otoño, invierno]

// group: 'huerta' para lo que sale de los bancales (sirve para las conservas)
// spoil: fracción que se estropea cada día si no se vende o se come (lo fresco no dura)
// from: de dónde sale (se muestra en la despensa cuando no tienes)
export const PRODUCTS = {
  // ── Huerta (bancales por temporada) ──
  lechugas:   { name: 'Lechugas', unit: 'cesta', price: 5, season: [0.9, 1.2, 1.1, 1.2], food: 1, basket: true, group: 'huerta', spoil: 0.12, from: 'Huerta, en primavera' },
  habas:      { name: 'Habas', unit: 'cesta', price: 6, season: [0.9, 1.2, 1.3, 1.0], food: 1, basket: true, group: 'huerta', spoil: 0.06, from: 'Huerta, en invierno y primavera' },
  tomates:    { name: 'Tomates', unit: 'cesta', price: 7, season: [1.3, 0.85, 1.0, 1.4], food: 1, basket: true, group: 'huerta', spoil: 0.1, from: 'Huerta, en verano' },
  pimientos:  { name: 'Pimientos', unit: 'cesta', price: 7, season: [1.3, 0.9, 1.0, 1.4], food: 1, basket: true, group: 'huerta', spoil: 0.08, from: 'Huerta, en verano' },
  calabazas:  { name: 'Calabazas', unit: 'pieza', price: 4, season: [1.2, 1.2, 0.9, 1.0], food: 1, basket: true, group: 'huerta', spoil: 0.02, from: 'Huerta, en otoño' },
  coles:      { name: 'Coles', unit: 'pieza', price: 3, season: [1.1, 1.3, 1.0, 0.9], food: 1, basket: true, group: 'huerta', spoil: 0.04, from: 'Huerta, en otoño e invierno' },
  ajos:       { name: 'Ajos', unit: 'ristra', price: 6, season: [1, 1, 1.1, 1.1], basket: true, group: 'huerta', spoil: 0.01, from: 'Huerta, en invierno' },
  // ── Frutales, monte y dehesa ──
  higos:      { name: 'Higos', unit: 'kilo', price: 4, season: [1.4, 0.9, 1.0, 1.5], food: 1, basket: true, spoil: 0.12, from: 'Higueras del bosquete, en verano' },
  uvas:       { name: 'Uvas del emparrado', unit: 'kilo', price: 3, season: [1.3, 1, 0.9, 1.3], food: 1, basket: true, spoil: 0.08, from: 'Emparrado del pozo, a final de verano' },
  setas:      { name: 'Setas (níscalos y de cardo)', unit: 'kilo', price: 12, season: [1.1, 1.3, 1, 1.1], food: 1, basket: true, spoil: 0.2, from: 'Bosquete, en otoño y primavera' },
  gurumelos:  { name: 'Gurumelos', unit: 'kilo', price: 22, season: [1.2, 1.2, 1, 1.1], basket: true, spoil: 0.2, from: 'Dehesa, en otoño tras la lluvia' },
  bellota:    { name: 'Bellota', unit: 'saco', price: 7, season: [1.2, 1.3, 0.85, 0.95], spoil: 0.01, from: 'Dehesa, en otoño' },
  aceite:     { name: 'Aceite de los olivos', unit: 'litro', price: 9, season: [1, 1.05, 1.1, 0.95], basket: true, from: 'Olivos de la dehesa, en invierno' },
  lavanda:    { name: 'Lavanda', unit: 'ramillete', price: 4, season: [1, 0.9, 1.1, 1.2], basket: true, spoil: 0.03, from: 'Patio, en verano' },
  lena:       { name: 'Leña de encina', unit: 'carga', price: 6, season: [0.8, 0.7, 1.1, 1.35], material: true, from: 'Podando y recogiendo en el monte' },
  heno:       { name: 'Heno', unit: 'paca', price: 3, season: [0.8, 1.1, 1.1, 1.4], from: 'Dehesa: segar en primavera y principios de verano' },
  carbon:     { name: 'Carbón de encina', unit: 'saco', price: 13, season: [0.85, 0.8, 1.1, 1.3], from: 'Dehesa: hacer carbón con leña' },
  // ── Animales ──
  huevos:     { name: 'Huevos', unit: 'docena', price: 3.5, season: [1, 1.05, 1, 1.1], food: 1, basket: true, spoil: 0.03, from: 'Corral, con gallinas' },
  queso:      { name: 'Queso de oveja', unit: 'pieza', price: 14, season: [0.95, 1, 1.05, 1.1], food: 2, basket: true, from: 'Corral, con ovejas' },
  lana:       { name: 'Lana', unit: 'vellón', price: 5, season: [0.9, 1, 1.05, 1.1], from: 'Corral: esquilar en primavera' },
  miel:       { name: 'Miel', unit: 'tarro', price: 9, season: [1.05, 0.95, 1, 1.15], basket: true, from: 'Colmenar, con colmenas' },
  cerdo:      { name: 'Cerdo ibérico de bellota', unit: 'animal', price: 240, season: [1, 1, 0.95, 1.1], from: 'Dehesa: montanera de otoño e invierno' },
  // ── De la cocina ──
  conservas:  { name: 'Conservas de la huerta', unit: 'tarro', price: 6, season: [1.1, 1, 1, 1.15], food: 1, basket: true, from: 'Cocina del cortijo, con verduras de la huerta' },
  mermelada:  { name: 'Mermelada de higo y uva', unit: 'tarro', price: 6, season: [1.05, 1, 1, 1.1], food: 1, basket: true, from: 'Cocina del cortijo, con higos o uvas' },
  embutido:   { name: 'Chorizo y salchichón', unit: 'ristra', price: 11, season: [1, 1, 1.05, 1.1], food: 2, basket: true, from: 'Matanza de un cerdo de montanera' },
  jamon:      { name: 'Jamón ibérico de bellota', unit: 'pieza', price: 160, season: [1, 0.95, 1.05, 1.15], basket: true, from: 'Matanza de un cerdo de montanera' },
};

// Materiales para el mantenimiento (la leña es a la vez producto y material)
export const MATERIALS = {
  lena:        { name: 'Leña', buy: 7 },
  piedra:      { name: 'Piedra', buy: 4 },
  cal:         { name: 'Cal', buy: 6 },
  herramientas:{ name: 'Herramientas', buy: 15 },
  pienso:      { name: 'Pienso y paja', buy: 4 },
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
