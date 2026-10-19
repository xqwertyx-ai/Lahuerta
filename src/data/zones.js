// Zonas de la finca. Coordenadas en el plano del cuaderno (mundo de 1600 x 1000).
//
// unlock: lo que cuesta «volver a dibujar» una zona borrada del papel. Es un pequeño proyecto:
//   jornales es el trabajo total (se va aportando en días distintos, tú o un voluntario encargado);
//   cost se paga al empezar.
//   requires.skill  → hace falta alguien con ese oficio en la finca
//   requires.zones  → conservación mínima de otras zonas
// tasks: mantenimiento. effect.cons sube la conservación, effect.weeds baja la maleza,
//   gain da materiales o productos, gainScaled los da multiplicados por conservación/100.
//   skill: un voluntario con ese oficio hace la tarea mejor (×1.5) y con un jornal menos.
// produce: producción diaria pasiva por estación [primavera, verano, otoño, invierno],
//   multiplicada por conservación/100 (y por animales si per está definido).

export const ZONES = [
  {
    id: 'cortijo', name: 'El cortijo', x: 640, y: 540, w: 270, h: 220,
    desc: 'Dos plantas encaladas, azulejo azul en la puerta y en la ventana, la reja con sus macetas verdes.',
    start: 42, unlocked: true, decay: 0.9, weeds: false,
    tasks: [
      { id: 'encalar', name: 'Encalar la fachada', jornales: 2, cost: { cal: 1 }, effect: { cons: 18 }, skill: 'pintura', notWeather: ['lluvia', 'tormenta', 'helada'] },
      { id: 'tejas', name: 'Arreglar las tejas', jornales: 2, cost: { herramientas: 0.25 }, effect: { cons: 14 }, skill: 'carpinteria' },
      { id: 'chimenea', name: 'Limpiar la chimenea', jornales: 1, effect: { cons: 7, mood: 2 }, seasons: [2, 3] },
      { id: 'herramientas', name: 'Reparar herramientas', jornales: 1, effect: { cons: 1 }, gain: { herramientas: 1 }, skill: 'carpinteria' },
    ],
  },
  {
    id: 'patio', name: 'Patio y fuente', x: 600, y: 770, w: 330, h: 180,
    desc: 'Cantos rodados con franjas de granito, la fuente de azulejo y sus estatuas: el león y la figura sentada.',
    start: 38, unlocked: true, decay: 1.0, weeds: false,
    tasks: [
      { id: 'barrer', name: 'Barrer la hojarasca', jornales: 1, effect: { cons: 8 }, seasonBonus: { 2: 1.25 } },
      { id: 'fuente', name: 'Cuidar la fuente', jornales: 1, cost: { cal: 0.25 }, effect: { cons: 11, mood: 1 }, skill: 'agua' },
      { id: 'lavanda', name: 'Recortar la lavanda', jornales: 1, effect: { cons: 6 }, gainScaled: { lavanda: 4 }, seasons: [1, 2] },
    ],
    produce: { lavanda: [0.3, 1.0, 0.3, 0] },
  },
  {
    id: 'paseo', name: 'Paseo de las adelfas', x: 950, y: 770, w: 420, h: 120,
    desc: 'Un camino de tierra bajo un túnel de árboles y adelfas blancas, con yucas a los lados.',
    start: 30, unlocked: true, decay: 1.0, weeds: true,
    tasks: [
      { id: 'desbrozar', name: 'Desbrozar el camino', jornales: 2, effect: { cons: 6, weeds: -45 }, skill: 'monte' },
      { id: 'adelfas', name: 'Podar las adelfas', jornales: 2, effect: { cons: 13 }, gain: { lena: 1 }, skill: 'monte' },
    ],
  },
  {
    id: 'ermita', name: 'Ermita de San Antonio', x: 1380, y: 690, w: 190, h: 210,
    desc: 'La ermita blanca dedicada a San Antonio, al final del paseo, con su reja roja de forja y la mimosa al lado.',
    start: 28, unlocked: false, decay: 0.8, weeds: false,
    unlock: { text: 'Abrir la reja, sacar los trastos y limpiar el altar', jornales: 12, cost: { herramientas: 1 } },
    tasks: [
      { id: 'barrer', name: 'Barrer y poner flores a San Antonio', jornales: 1, effect: { cons: 10, mood: 1 } },
      { id: 'encalar', name: 'Encalar la ermita', jornales: 2, cost: { cal: 1 }, effect: { cons: 16 }, skill: 'pintura', notWeather: ['lluvia', 'tormenta', 'helada'] },
      { id: 'reja', name: 'Pintar la reja roja', jornales: 2, cost: { money: 8 }, effect: { cons: 14 }, skill: 'pintura' },
      { id: 'campana', name: 'Arreglar la espadaña', jornales: 2, cost: { herramientas: 0.25 }, effect: { cons: 12 }, skill: 'albanileria' },
    ],
  },
  {
    id: 'huerta', name: 'La huerta', x: 110, y: 560, w: 440, h: 230,
    desc: 'Bancales de tierra roja junto al cortijo. Cada temporada se siembra lo suyo; con agua del pozo, da para comer y para vender.',
    start: 30, unlocked: false, decay: 1.2, weeds: true, beds: true,
    unlock: { text: 'Desbrozar y cavar los bancales', jornales: 14, cost: { herramientas: 0.5 } },
    tasks: [
      { id: 'cavar', name: 'Cavar y abonar', jornales: 2, tractor: true, effect: { cons: 15 }, skill: 'huerta' },
      { id: 'regar', name: 'Regar los bancales', jornales: 1, effect: { cons: 5 }, water: 6, growBeds: 0.15, skill: 'agua', notWeather: ['lluvia', 'tormenta'] },
      { id: 'desbrozar', name: 'Quitar malas hierbas', jornales: 1, effect: { cons: 4, weeds: -40 }, skill: 'huerta' },
    ],
  },
  {
    id: 'bosquete', name: 'El bosquete', x: 80, y: 820, w: 420, h: 165,
    desc: 'Acacias, higueras y eucaliptos. La hojarasca cruje; hay un rastrillo y una caja de fruta olvidados. Da leña y, con la humedad, setas.',
    start: 26, unlocked: false, decay: 1.0, weeds: true,
    unlock: { text: 'Abrir paso entre la hojarasca', jornales: 12, requires: { zones: { huerta: 1 } } },
    tasks: [
      { id: 'barrer', name: 'Rastrillar la hojarasca', jornales: 1, effect: { cons: 9, weeds: -20 }, seasonBonus: { 2: 1.4 } },
      { id: 'higueras', name: 'Podar higueras y eucaliptos', jornales: 2, effect: { cons: 13 }, gain: { lena: 2 }, seasons: [2, 3], skill: 'monte' },
      { id: 'lena', name: 'Recoger leña caída', jornales: 1, effect: { cons: 3 }, gain: { lena: 2 } },
      { id: 'setas', name: 'Buscar setas', jornales: 2, effect: { cons: 2 }, gainScaled: { setas: 4 }, seasons: [0, 2], skill: 'monte' },
    ],
    produce: { higos: [0, 1.6, 0.6, 0], setas: [0.2, 0, 0.5, 0.1] },
  },
  {
    id: 'dehesa', name: 'Dehesa de encinas', x: 60, y: 130, w: 700, h: 330,
    desc: 'Encinas viejas, berrocales de granito y un gran pino. Desde aquí se ve el pueblo blanco en lo alto.',
    start: 36, unlocked: true, decay: 0.7, weeds: true,
    tasks: [
      { id: 'podar', name: 'Podar encinas', jornales: 3, effect: { cons: 14 }, gain: { lena: 3 }, seasons: [2, 3], skill: 'monte' },
      { id: 'desbrozar', name: 'Desbrozar el pasto', jornales: 2, tractor: true, effect: { cons: 6, weeds: -50 }, skill: 'monte' },
      { id: 'bellota', name: 'Varear y recoger bellota', jornales: 2, tractor: true, effect: { cons: 2 }, gainScaled: { bellota: 5 }, seasons: [2] },
      { id: 'heno', name: 'Segar y empacar el heno', jornales: 2, tractor: true, effect: { cons: 3 }, gainScaled: { heno: 9 }, seasons: [0, 1], skill: 'ganado' },
      { id: 'piedra', name: 'Recoger piedra suelta', jornales: 1, effect: { cons: 2 }, gain: { piedra: 3 } },
      { id: 'carbon', name: 'Hacer carbón de encina', jornales: 2, cost: { lena: 3 }, effect: { cons: 1 }, gain: { carbon: 2 }, skill: 'monte' },
    ],
    produce: { bellota: [0, 0, 2.2, 0.6], aceite: [0, 0, 0, 0.7] },
  },
  {
    id: 'muros', name: 'Muros de piedra seca', x: 90, y: 470, w: 690, h: 70,
    desc: 'Piedra sobre piedra, sin argamasa. Cada invierno se cae un trozo y cada verano lo cubren las zarzas.',
    start: 25, unlocked: false, decay: 0.8, weeds: true,
    unlock: { text: 'Limpiar las zarzas y apilar la piedra caída', jornales: 21, cost: { piedra: 6 }, requires: { zones: { dehesa: 45 } } },
    tasks: [
      { id: 'rehacer', name: 'Rehacer un tramo', jornales: 3, tractor: true, cost: { piedra: 3 }, effect: { cons: 20 }, skill: 'albanileria', notWeather: ['helada'] },
      { id: 'zarzas', name: 'Quitar zarzas', jornales: 1, effect: { cons: 4, weeds: -40 }, skill: 'monte' },
    ],
  },
  {
    id: 'alberca', name: 'La alberca', x: 810, y: 190, w: 260, h: 200,
    desc: 'Agua quieta entre juncos. Al atardecer bajan los ciervos, como en el cuadro.',
    start: 24, unlocked: false, decay: 1.0, weeds: true,
    unlock: { text: 'Sacar el lodo y destapar el caño', jornales: 21, cost: { herramientas: 1, money: 40 }, requires: { zones: { muros: 1 } } },
    tasks: [
      { id: 'limpiar', name: 'Limpiar la alberca', jornales: 2, effect: { cons: 17, weeds: -30 }, skill: 'agua' },
      { id: 'fugas', name: 'Reparar las fugas', jornales: 2, cost: { cal: 1 }, effect: { cons: 12 }, skill: 'albanileria' },
    ],
  },
  {
    id: 'colmenar', name: 'El colmenar', x: 1100, y: 140, w: 210, h: 180,
    desc: 'Corchos y cajas entre romero y lavanda. Zumban aunque no los veas.',
    start: 30, unlocked: false, decay: 0.9, weeds: true,
    unlock: { text: 'Preparar el colmenar', jornales: 12, cost: { money: 20 }, requires: { skill: 'apicultura' } },
    tasks: [
      { id: 'revisar', name: 'Revisar las colmenas', jornales: 1, effect: { cons: 10 }, skill: 'apicultura' },
      { id: 'catar', name: 'Catar la miel', jornales: 2, effect: { cons: 3 }, gainPerAnimal: { miel: 1.5, animal: 'colmenas' }, seasons: [1], skill: 'apicultura' },
      { id: 'desbrozar', name: 'Desbrozar alrededor de las colmenas', jornales: 1, effect: { cons: 4, weeds: -40 }, skill: 'monte' },
    ],
    produce: { miel: [0.06, 0.12, 0.03, 0], per: 'colmenas' },
  },
  {
    id: 'corral', name: 'El corral', x: 1320, y: 150, w: 250, h: 270,
    desc: 'Gallinas rojas bajo la yuca, una rueda de carro y una valla que pide clavos.',
    start: 28, unlocked: false, decay: 1.1, weeds: false,
    unlock: { text: 'Arreglar la valla y el gallinero', jornales: 18, cost: { herramientas: 1, piedra: 4, money: 30 }, requires: { zones: { huerta: 1 } } },
    tasks: [
      { id: 'limpiar', name: 'Limpiar el corral', jornales: 1, effect: { cons: 10 }, skill: 'ganado' },
      { id: 'valla', name: 'Arreglar la valla', jornales: 2, cost: { herramientas: 0.25 }, effect: { cons: 14 }, skill: 'carpinteria' },
      { id: 'esquilar', name: 'Esquilar las ovejas', jornales: 2, effect: { cons: 2 }, gainPerAnimal: { lana: 1, animal: 'ovejas' }, seasons: [0], skill: 'ganado' },
    ],
    produce: { huevos: [0.09, 0.08, 0.06, 0.04], per: 'gallinas', queso: [0.07, 0.04, 0.02, 0.01], perQueso: 'ovejas' },
  },
  {
    id: 'pozo', name: 'El pozo y el emparrado', x: 942, y: 420, w: 132, h: 155,
    desc: 'Un pozo de brocal encalado bajo un emparrado de viña. Agua dulce y fresca para la huerta y la casa, y racimos al final del verano.',
    start: 30, unlocked: false, decay: 0.9, weeds: true,
    unlock: { text: 'Destapar el pozo y apuntalar el emparrado', jornales: 9, cost: { herramientas: 0.5 } },
    tasks: [
      { id: 'agua', name: 'Sacar agua del pozo', jornales: 1, effect: { cons: 2 }, water: 15 },
      { id: 'limpiar', name: 'Limpiar el pozo', jornales: 2, effect: { cons: 15 }, skill: 'agua' },
      { id: 'atar', name: 'Atar la parra', jornales: 1, effect: { cons: 8, weeds: -15 }, seasons: [0, 1], skill: 'huerta' },
      { id: 'podar', name: 'Podar la parra', jornales: 2, effect: { cons: 12 }, gain: { lena: 1 }, seasons: [2, 3], skill: 'huerta' },
      { id: 'vendimiar', name: 'Vendimiar el emparrado', jornales: 2, effect: { cons: 2 }, gainScaled: { uvas: 8 }, seasons: [1, 2] },
    ],
    produce: { uvas: [0, 0.4, 1.0, 0] },
  },
  {
    id: 'bancos', name: 'Los bancos de los nietos', x: 950, y: 898, w: 330, h: 78,
    desc: 'A lo largo del camino a la ermita, bancos de obra encalados con mosaico y el nombre de cada nieto.',
    start: 32, unlocked: true, decay: 0.8, weeds: false,
    tasks: [
      { id: 'encalar', name: 'Encalar los bancos', jornales: 2, cost: { cal: 1 }, effect: { cons: 16 }, skill: 'pintura', notWeather: ['lluvia', 'tormenta', 'helada'] },
      { id: 'teselas', name: 'Reponer las teselas del mosaico', jornales: 2, cost: { money: 10 }, effect: { cons: 14 }, skill: 'pintura' },
      { id: 'nombres', name: 'Repasar los nombres', jornales: 1, effect: { cons: 7, mood: 2 } },
    ],
  },
  {
    id: 'piano', name: 'El rincón del piano', x: 1080, y: 430, w: 230, h: 200,
    desc: 'Un cenador bajo los eucaliptos con un piano vertical tapado con una manta. Le faltan teclas y le sobra polvo.',
    start: 18, unlocked: false, decay: 0.8, weeds: false,
    unlock: { text: 'Destapar el piano y montar el cenador', jornales: 18, cost: { herramientas: 1, money: 60 }, requires: { zones: { cortijo: 65, ermita: 1 } } },
    tasks: [
      { id: 'limpiar', name: 'Quitar el polvo y la carcoma', jornales: 1, effect: { cons: 8 }, skill: 'carpinteria' },
      { id: 'afinar', name: 'Afinar el piano', jornales: 2, cost: { money: 15 }, effect: { cons: 16 }, skill: 'afinacion', needsSkillAbove: 50 },
      { id: 'tocar', name: 'Tocar un rato al atardecer', jornales: 1, effect: { cons: 2, mood: 6 }, minCons: 60 },
    ],
  },
];

export const ZONE_BY_ID = Object.fromEntries(ZONES.map((z) => [z.id, z]));

// Decorado del plano que no se gestiona: el pueblo en lo alto, caminos, el gran pino…
export const DECOR = {
  village: { x: 860, y: 18, w: 700, h: 110 },
  pine: { x: 640, y: 160 },
};
