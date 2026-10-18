// Agroturismo (fase 2). Mejoras que se construyen y actividades que se ofrecen.
// requires.zones: conservación mínima; requires.animals; requires.items; requires.skill
// capacity: plazas para huéspedes · appeal: atractivo · price: lo que paga cada huésped por día
// cost: lo que cuesta construirla (dinero, materiales y jornales)

export const UPGRADES = [
  { id: 'hab1', name: 'Primera habitación', kind: 'room', capacity: 2, appeal: 1,
    cost: { money: 140, cal: 2, jornales: 3 }, requires: { zones: { cortijo: 65 } },
    desc: 'La alcoba de arriba, encalada y con colcha de ganchillo.' },
  { id: 'hab2', name: 'Segunda habitación', kind: 'room', capacity: 2, appeal: 1,
    cost: { money: 240, cal: 2, piedra: 2, jornales: 4 }, requires: { zones: { cortijo: 75 }, upgrades: ['hab1'] },
    desc: 'La del patio, con ventana a la fuente.' },
  { id: 'hab3', name: 'Habitación del desván', kind: 'room', capacity: 2, appeal: 1.5,
    cost: { money: 380, cal: 3, herramientas: 1, jornales: 5 }, requires: { zones: { cortijo: 85 }, upgrades: ['hab2'] },
    desc: 'Vigas a la vista y una claraboya para ver estrellas sin salir de la cama.' },
  { id: 'glamping', name: 'Glamping bajo las encinas', kind: 'room', capacity: 3, appeal: 2,
    cost: { money: 320, lena: 3, jornales: 4 }, requires: { zones: { dehesa: 60 } },
    desc: 'Tres tiendas de lona cruda entre encinas centenarias.' },

  { id: 'taller_queso', name: 'Taller de queso', kind: 'activity', appeal: 1, price: 18,
    cost: { money: 60, jornales: 2 }, requires: { zones: { corral: 60 }, animals: { ovejas: 2 } },
    desc: 'Cuajo, paciencia y un queso que te llevas a casa.' },
  { id: 'taller_miel', name: 'Taller de miel', kind: 'activity', appeal: 1, price: 15,
    cost: { money: 50, jornales: 2 }, requires: { zones: { colmenar: 60 }, animals: { colmenas: 2 } },
    desc: 'Con careta y ahumador. La miel se prueba del panal.' },
  { id: 'taller_pan', name: 'Taller de pan', kind: 'activity', appeal: 1, price: 14,
    cost: { money: 70, lena: 2, jornales: 2 }, requires: { zones: { cortijo: 70 } },
    desc: 'Masa madre y horno de leña de encina.' },
  { id: 'taller_acuarela', name: 'Taller de acuarela', kind: 'activity', appeal: 1.5, price: 20,
    cost: { money: 40, jornales: 2 }, requires: { items: ['acuarelas'] },
    desc: 'Con la caja de Transi en la mesa, como homenaje. Se pinta el paseo de las adelfas.' },
  { id: 'ruta', name: 'Ruta por la dehesa', kind: 'activity', appeal: 1, price: 10,
    cost: { money: 30, jornales: 2 }, requires: { zones: { dehesa: 60, muros: 50 } },
    desc: 'Entre muros de piedra seca hasta el berrocal grande, con el pueblo al fondo.' },
  { id: 'estrellas', name: 'Observación de estrellas', kind: 'activity', appeal: 1.2, price: 12,
    cost: { money: 90, jornales: 1 }, requires: { zones: { dehesa: 50 } },
    desc: 'Un telescopio viejo y mantas sobre la hierba. Aquí la Vía Láctea se ve entera.' },
  { id: 'concierto', name: 'Conciertos al atardecer', kind: 'activity', appeal: 3, price: 25,
    cost: { money: 50, jornales: 2 }, requires: { zones: { piano: 80 } },
    desc: 'El piano del cenador vuelve a sonar cuando bajan los ciervos.' },
];

export const UPGRADE_BY_ID = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));

// Cuánto atrae cada estación (primavera, verano, otoño, invierno)
export const TOURISM_SEASON = [1.2, 1.0, 1.1, 0.6];
