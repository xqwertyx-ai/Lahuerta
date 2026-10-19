// Contratiempos: averías que paran zonas, avisos que trastocan la economía, gastos fijos
// y las reservas que hay que guardar para el invierno. Todo por datos.

// ── Averías ──
// Una avería deja su zona parada (no produce y no admite cuidados) hasta que se repara.
// La reparación es un proyecto de varios jornales (puedes encargárselo a un voluntario),
// o se le puede pagar a un profesional del pueblo `pro` € por cada jornal que falte.
//   zone: zona afectada (null = no es de una zona: la furgoneta)
//   hit: conservación que pierde la zona al romperse
//   work: jornales de trabajo · cost: materiales y dinero al empezar
//   stops: además de la producción de su zona, qué más se para
//     beds (solo una cama), tourism (no hay huéspedes), water (no da agua), market (no se puede ir al mercado),
//     concerts, montanera, sow (no se puede sembrar), find (San Antonio deja de ayudar a encontrar)
//   worse: cada día sin empezar a repararla, la zona pierde esta conservación de más
export const DAMAGES = {
  tejado: {
    zone: 'cortijo', name: 'Tejado hundido', hit: 14, work: 8, cost: { piedra: 2, cal: 2 }, pro: 30,
    stops: { beds: true, tourism: true }, worse: 0.8,
    text: 'Se ha venido abajo un trozo del tejado. Llueve en la alcoba de arriba y no se puede dormir allí.',
  },
  muro: {
    zone: 'muros', name: 'Brecha en el muro', hit: 18, work: 6, cost: { piedra: 5 }, pro: 26,
    stops: { montanera: true }, worse: 0.6,
    text: 'Un tramo largo del muro está en el suelo. Los cerdos se escapan al monte de los vecinos.',
  },
  bancales: {
    zone: 'huerta', name: 'Bancales arrasados', hit: 16, work: 4, cost: {}, pro: 22,
    stops: { sow: true }, worse: 0.5,
    text: 'De los bancales no queda nada: barro, piedras y las cañas tumbadas. Hay que volver a levantarlos.',
  },
  dehesa_quemada: {
    zone: 'dehesa', name: 'Dehesa quemada', hit: 22, work: 10, cost: { herramientas: 1 }, pro: 24,
    stops: { montanera: true }, worse: 0.4,
    text: 'Medio pasto es ceniza. Hay que retirar lo quemado, abrir surcos y esperar que rebrote.',
  },
  bomba: {
    zone: 'pozo', name: 'Bomba del pozo rota', hit: 10, work: 3, cost: { money: 90 }, pro: 40,
    stops: { water: true }, worse: 0.3,
    text: 'La bomba del pozo ha dicho basta. Hace falta una pieza nueva y una tarde entera con la llave inglesa.',
  },
  tuberia: {
    zone: 'patio', name: 'Tubería reventada', hit: 10, work: 3, cost: { money: 25, herramientas: 0.5 }, pro: 30,
    stops: { water: true }, worse: 0.5,
    text: 'La helada ha reventado la tubería de la fuente. El patio está encharcado y la fuente, muda.',
  },
  alberca_grieta: {
    zone: 'alberca', name: 'Grieta en la alberca', hit: 14, work: 5, cost: { cal: 3 }, pro: 28,
    stops: { water: true }, worse: 0.6,
    text: 'Se ha abierto una grieta en el vaso de la alberca. El agua se va por debajo como por un colador.',
  },
  varroa: {
    zone: 'colmenar', name: 'Varroa en las colmenas', hit: 12, work: 4, cost: { money: 40 }, pro: 30,
    stops: {}, worse: 0.5, needsAnimals: 'colmenas',
    text: 'Las abejas salen torpes y con las alas arrugadas. Varroa. Hay que tratar colmena por colmena.',
  },
  gallinero: {
    zone: 'corral', name: 'Gallinero destrozado', hit: 12, work: 3, cost: { piedra: 2, herramientas: 0.25 }, pro: 26,
    stops: {}, worse: 0.5,
    text: 'El zorro ha entrado por debajo de la tela. Hay plumas por todo el corral y la valla está rota.',
  },
  espadana: {
    zone: 'ermita', name: 'Rayo en la espadaña', hit: 18, work: 7, cost: { cal: 3, piedra: 2 }, pro: 30,
    stops: { find: true }, worse: 0.4,
    text: 'Un rayo ha partido la espadaña de la ermita. La campana está en el suelo, entera de milagro.',
  },
  piano_humedad: {
    zone: 'piano', name: 'Humedad en el piano', hit: 14, work: 5, cost: { herramientas: 0.5 }, pro: 45,
    stops: { concerts: true }, worse: 0.6,
    text: 'Con tanta humedad, las teclas se han hinchado y se quedan hundidas. El piano no suena.',
  },
  procesionaria: {
    zone: 'bosquete', name: 'Procesionaria', hit: 10, work: 4, cost: { money: 15 }, pro: 24,
    stops: {}, worse: 0.4,
    text: 'Bolsones blancos en los pinos y filas de orugas por el suelo. Ni el gato se acerca.',
  },
  camino: {
    zone: 'paseo', name: 'Camino de acceso hundido', hit: 12, work: 6, cost: { piedra: 4 }, pro: 25,
    stops: { tourism: true }, worse: 0.4,
    text: 'El agua se ha comido el camino junto a las adelfas. Ningún coche sube hasta la casa.',
  },
  tractor: {
    zone: null, name: 'El Pascuali no arranca', hit: 0, work: 2, cost: { money: 40 }, pro: 35,
    stops: { tractor: true }, worse: 0,
    text: 'El Pascuali da dos vueltas de motor y se calla. Huele a gasoil y a algo quemado. Hasta que se arregle, todo a mano.',
  },
  furgoneta: {
    zone: null, name: 'Furgoneta averiada', hit: 0, work: 3, cost: { money: 60 }, pro: 45,
    stops: { market: true }, worse: 0,
    text: 'La furgoneta no arranca. Sin ella no hay manera de bajar al mercado con los cajones.',
  },
};

// ── Avisos: cambios temporales en la economía ──
// coop/market/basket: multiplican el precio de ese canal · price: { producto: factor }
// bills: multiplica los gastos fijos · tourism: multiplica la llegada de huéspedes (0 = ninguno)
// market: false cierra el mercado · prod: { producto: factor } de producción
export const MODS = {
  coop_baja:   { name: 'La cooperativa paga poco', desc: 'Hay excedente en la comarca: la cooperativa baja un 40 % lo que paga.', coop: 0.6, bad: true },
  mercado_flojo: { name: 'Mercado flojo', desc: 'Ha llegado fruta y verdura de fuera, muy barata. En el mercado se vende peor.', market: 0.7, bad: true },
  luz_cara:    { name: 'Sube la luz y el gasoil', desc: 'Los gastos fijos de la finca suben a la mitad más.', bills: 1.5, bad: true },
  carretera:   { name: 'Carretera cortada', desc: 'Obras en la carretera de Fuente Obejuna: no llegan huéspedes y no se puede bajar al mercado.', tourism: 0, market: false, bad: true },
  lengua_azul: { name: 'Lengua azul en la comarca', desc: 'Las ovejas, vacunadas y en cuarentena: no se hace queso.', prod: { queso: 0 }, bad: true },
  peste:       { name: 'Alerta sanitaria porcina', desc: 'Los mataderos compran el cerdo a la mitad mientras dure la alerta.', price: { cerdo: 0.5, jamon: 0.8, embutido: 0.8 }, bad: true },
  sequia_precio: { name: 'Pienso por las nubes', desc: 'Con la sequía, el pienso y la paja cuestan el doble.', buy: { pienso: 2 }, bad: true },
  cancelaciones: { name: 'Racha de cancelaciones', desc: 'Una mala reseña circula por internet. Llegan la mitad de huéspedes.', tourism: 0.5, bad: true },
  granizo:     { name: 'Frutales apedreados', desc: 'El granizo ha dejado la higuera y la parra sin fruta por un tiempo.', prod: { higos: 0, uvas: 0 }, bad: true },
  puente:      { name: 'Puente festivo', desc: 'Medio Córdoba busca casa rural: llegan muchos más huéspedes.', tourism: 1.7 },
  aceite_caro: { name: 'Buen precio del aceite', desc: 'Ha sido mal año en Jaén: el aceite se paga mucho mejor.', price: { aceite: 1.5 } },
  feria_queso: { name: 'Feria del queso', desc: 'El queso y la miel se venden mejor estos días.', price: { queso: 1.35, miel: 1.3 } },
};

// ── Gastos fijos ──
export const BILLS = {
  // Cada lunes: luz, agua, teléfono, gasoil y seguro. Sube con lo que tienes en marcha.
  weekly: { base: 6, perZone: 1.3, perRoom: 10, perAnimal: 0.2 },
  // Al empezar el verano: contribución (IBI), seguro agrario y cuota de la cooperativa
  yearly: { season: 1, base: 40, perZone: 7, perRoom: 25 },
  // Al empezar la primavera: la declaración de la renta (sobre lo ganado el año anterior)
  tax: { season: 0, rate: 0.18, gestor: 40 },
};

// ── El invierno ──
// Leña para la chimenea: cargas por día [primavera, verano, otoño, invierno]
// (más con voluntarios y huéspedes). Sin leña hace frío: baja el ánimo y la gente se queja.
export const HEATING = { perDay: [0, 0, 0.3, 0.75], perPerson: [0, 0, 0.05, 0.12] };
// Comida para los animales cuando el campo no da (verano seco e invierno): heno o pienso por cabeza y día.
// Si no hay, dejan de producir; si dura, hay que vender alguno.
export const FEED = {
  seasons: [1, 3],
  perHead: { gallinas: 0.03, ovejas: 0.22 },
  hungryDaysToSell: 4,
};
// Comida comprada para los voluntarios: más cara en invierno (la huerta da poco)
export const FOOD_SEASON = [1, 1, 1.15, 1.5];
// Precio de compra de materiales según estación (la leña en invierno, cara)
export const BUY_SEASON = { lena: [0.9, 0.8, 1.15, 1.7], pienso: [0.9, 1.2, 1, 1.25] };

// ── Dificultad ──
// crisis: frecuencia de los contratiempos · bills: gastos · decay: deterioro · aging: cuánto más
// se deteriora la finca cada año que pasa (la casa envejece)
export const DIFFICULTY = {
  tranquila: { name: 'Tranquila', desc: 'Pocos sustos y gastos pequeños.', crisis: 0.45, bills: 0.6, decay: 0.85, aging: 0.02 },
  normal:    { name: 'Normal', desc: 'La vida en el campo: hay años buenos y años de pedrisco.', crisis: 1, bills: 1, decay: 1, aging: 0.06 },
  dura:      { name: 'Dura', desc: 'Más averías, más gastos, menos margen.', crisis: 1.5, bills: 1.35, decay: 1.12, aging: 0.1 },
};
