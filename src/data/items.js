// Objetos y recuerdos que aparecen al restaurar la finca.
//
// where: 'full' (al volver a dibujar la zona), 'restore' (al llegar a conservación 70),
//        'cons' (al llegar a la conservación indicada en at),
// minDay: no aparece antes de ese día (aunque se cumpla la condición; saldrá en cuanto llegue)
//        'cat' (lo trae el gato), 'event' (solo por un evento), 'task' (tarea en la zona)
// thread: a qué hilo del misterio pertenece (un familiar o 'pianista')
// hyp: cuánto apoya o descarta cada hipótesis sobre el pianista (ver story.js)
// score: si es una partitura, cuántas notas añade al tema del pianista
//
// ✎ AUTOR: textos provisionales, tiernos y sin hechos graves. Edítalos a tu gusto.

export const ITEMS = [
  // ── Pianista: partituras ──
  { id: 'partitura1', name: 'Una hoja de partitura doblada', thread: 'pianista', zone: 'patio', where: 'full', minDay: 6, score: 4, icon: 'partitura',
    text: 'Encajada bajo un azulejo suelto de la fuente. Ocho compases a lápiz, sin título. Al final, una sola palabra: «atardecer».',
    hyp: { musico: 1, transi: 1 } },
  { id: 'partitura2', name: 'Partitura junto al altar', thread: 'pianista', zone: 'ermita', where: 'full', minDay: 35, score: 4, icon: 'partitura',
    text: 'Doblada bajo la peana de San Antonio, entre cabos de vela. La letra de las notas es fina y apretada; la de los márgenes, redonda. Dos manos distintas.',
    hyp: { feliciano: 1, transi: 1 } },
  { id: 'partitura3', name: 'Partitura en el desván', thread: 'pianista', zone: 'cortijo', where: 'full', minDay: 20, score: 4, icon: 'partitura',
    text: 'Dentro de una caja de zapatos. Alguien tachó una nota y escribió encima otra, con prisa, como quien corrige una carta.',
    hyp: { musico: 1, mueble: -1 } },
  { id: 'partitura4', name: 'Partitura en la banqueta', thread: 'pianista', zone: 'piano', where: 'full', score: 4, icon: 'partitura',
    text: 'Bajo la tapa de la banqueta del piano. Está fechada en verano, sin año. Lleva un dibujo diminuto de un ciervo en una esquina.',
    hyp: { transi: 2, mueble: -1 } },
  { id: 'partitura5', name: 'Un trozo de partitura mordisqueado', thread: 'pianista', zone: null, where: 'cat', score: 2, icon: 'partitura',
    text: 'El gato lo deja a tus pies con mucha dignidad. Le faltan las esquinas, pero se leen cuatro notas.',
    hyp: {} },
  { id: 'partitura6', name: 'Partitura en la caja de fruta', thread: 'pianista', zone: 'bosquete', where: 'full', minDay: 45, score: 2, icon: 'partitura',
    text: 'Envuelta en papel de periódico dentro de la caja de fruta. Es el final de la melodía: las últimas notas, por fin.',
    hyp: { musico: 1, feliciano: 1 } },
  { id: 'disco', name: 'Un disco de pizarra sin etiqueta', thread: 'pianista', zone: 'ermita', where: 'full', icon: 'disco',
    text: 'Envuelto en un paño detrás de los bancos de la ermita. En el centro, a pluma: «para tocar al atardecer». No hay gramófono en la casa. Todavía.',
    hyp: { musico: 1, mueble: 1 } },
  { id: 'diario', name: 'Un diario de tapas azules', thread: 'pianista', zone: 'piano', where: 'full', minDay: 70, icon: 'diario',
    text: 'Apuntes breves, sin nombre: «Hoy ha sonado bien.» «Llovió; no tocamos.» «Los ciervos han vuelto.» Siempre en plural.',
    hyp: { musico: 1, transi: 1, feliciano: 1, mueble: -2 } },

  // ── Manuel ──
  { id: 'llave', name: 'Una llave grande de hierro', thread: 'manuel', zone: 'muros', where: 'full', icon: 'llave',
    text: 'Aparece entre dos piedras del muro, envuelta en un trapo. Es demasiado grande para cualquier puerta de la casa.',
    hyp: { manuel: 1 } },
  { id: 'reloj', name: 'Un reloj de bolsillo parado', thread: 'manuel', zone: 'dehesa', where: 'full', minDay: 25, icon: 'reloj',
    text: 'Bajo el gran pino, medio enterrado. Las agujas marcan las ocho y diez. La tapa tiene grabada una M.',
    hyp: { manuel: 1 } },
  { id: 'escritura', name: 'Una escritura antigua', thread: 'manuel', zone: null, where: 'event', icon: 'carta',
    text: 'Entre los papeles de la herencia. La finca ya tenía nombre en la primera escritura: «la huerta del pianista».',
    hyp: { manuel: 2, feliciano: -1, transi: -1 } },

  // ── Feliciano ──
  { id: 'cuentas', name: 'El cuaderno de cuentas', thread: 'feliciano', zone: 'cortijo', where: 'full', icon: 'cuaderno',
    text: 'Sacos de bellota, kilos de cal, jornales. En una esquina, a lápiz: «cuerdas del piano — pendiente».',
    hyp: { feliciano: 1, mueble: 1 } },
  { id: 'foto_fuente', name: 'Una foto de la fuente a medio hacer', thread: 'feliciano', zone: 'patio', where: 'full', minDay: 3, icon: 'foto',
    text: 'Un hombre con boina, de espaldas, sujeta un azulejo azul. Al dorso: «Feliciano, la fuente, primer verano».',
    hyp: { feliciano: 1 } },

  // ── Transi ──
  { id: 'firma', name: 'La firma de los cuadros', thread: 'transi', zone: 'cortijo', where: 'full', icon: 'firma',
    text: 'Al descolgar los dos óleos para limpiarlos, lo lees despacio en la esquina: «Transi». Los pintó la abuela.',
    hyp: { transi: 2 } },
  { id: 'acuarelas', name: 'La caja de pinturas de Transi', thread: 'transi', zone: 'cortijo', where: 'full', icon: 'caja',
    text: 'Pastillas de color gastadas hasta el fondo. El ocre y el azul, casi terminados. Debajo, un papel con notas musicales dibujadas como pájaros.',
    hyp: { transi: 2 } },
  { id: 'boceto', name: 'Un boceto de los ciervos', thread: 'transi', zone: 'alberca', where: 'full', minDay: 50, icon: 'boceto',
    text: 'El estudio del segundo cuadro: los ciervos junto al agua. En el borde, a lápiz, un pentagrama sin terminar.',
    hyp: { transi: 1, musico: 1 } },

  // ── Elisa y Loli ──
  { id: 'carta', name: 'Una carta de Elisa', thread: 'elisa', zone: 'cortijo', where: 'full', minDay: 30, icon: 'carta',
    text: '«¿Sigue sonando el piano por las tardes? Aquí lo echo de menos. Dale un beso a Transi y otro al pino.»',
    hyp: { musico: 1, mueble: -1 } },
  { id: 'receta', name: 'La receta de membrillo de Loli', thread: 'loli', zone: 'huerta', where: 'full', icon: 'receta',
    text: 'Membrillo, azúcar, paciencia. Y al final: «remover despacio, con música, que sale mejor».',
    hyp: {} },
  { id: 'foto_hermanas', name: 'Una foto de tres hermanas', thread: 'loli', zone: 'paseo', where: 'full', minDay: 18, icon: 'foto',
    text: 'Tres mujeres de espaldas bajo las adelfas, mirando hacia el cenador. Una lleva un pañuelo, otra un cesto. La tercera, un cuaderno.',
    hyp: { transi: 1 } },
  { id: 'panuelo', name: 'Un pañuelo bordado', thread: 'elisa', zone: 'bosquete', where: 'full', icon: 'panuelo',
    text: 'Colgado de una rama de la higuera, descolorido. Bordadas, unas iniciales: E. y, más pequeño, una corchea.',
    hyp: { musico: 1 } },
  // ── Los cuadros de Transi y la foto del abuelo ──
  { id: 'cuadro_pueblo', name: 'El cuadro del pueblo', thread: 'transi', zone: 'dehesa', where: 'full', icon: 'boceto', image: 'cuadro-pueblo',
    text: 'Óleo de Transi: Ojuelos en lo alto, los muros de piedra seca, las encinas y el gran pino a la derecha. Desde la dehesa se ve tal cual.',
    hyp: { transi: 1 } },
  { id: 'cuadro_ciervos', name: 'El cuadro de los ciervos', thread: 'transi', zone: 'alberca', where: 'full', minDay: 40, icon: 'boceto', image: 'cuadro-ciervos',
    text: 'Un ciervo y una cierva junto al agua, bajo un cielo de atardecer color miel. En la esquina, la firma: Transi.',
    hyp: { transi: 1, musico: 1 } },
  { id: 'cuadro_ermita', name: 'El cuadro de la ermita', thread: 'transi', zone: 'ermita', where: 'full', icon: 'boceto', image: 'cuadro-ermita',
    text: 'La ermita blanca entre almendros en flor, con el pueblo detrás y un árbol grande que se dobla con el viento. Firmado: Transi.',
    hyp: { transi: 1 } },
  { id: 'cuadro_banco', name: 'El cuadro del hombre del banco', thread: 'transi', zone: 'paseo', where: 'full', minDay: 30, icon: 'boceto', image: 'cuadro-hombre-banco',
    text: 'Un hombre con sombrero y barba descansa en un banco de madera, con un pañuelo rojo al cuello y la chaqueta azul a un lado. Pintado sobre tabla.',
    hyp: { musico: 1 } },
  { id: 'foto_olivo', name: 'Una foto del abuelo Feliciano', thread: 'feliciano', zone: 'dehesa', where: 'full', minDay: 20, icon: 'foto', image: 'foto-feliciano',
    text: 'El abuelo Feliciano, con sombrero de paja, sentado a la sombra de un olivo en pleno verano. Detrás, los árboles recién plantados.',
    hyp: { feliciano: 1 } },
  { id: 'reloj_sol', name: 'El reloj de sol de Transi', thread: 'transi', zone: 'barbacoa', where: 'full', icon: 'boceto', image: 'reloj-solar',
    text: 'En el pilar junto al camino, doce azulejos blancos con los números en azul rodean la sombra. Lo hizo la abuela Transi: la sombra va pasando de número en número a lo largo del día.',
    hyp: { transi: 1 } },
  { id: 'san_antonio', name: 'La imagen de San Antonio', thread: 'finca', zone: 'ermita', where: 'full', icon: 'foto', image: 'san-antonio',
    text: 'San Antonio con el Niño en brazos y un libro con azucenas, sobre su peana, entre dos candelabros de latón. El santo que encuentra lo perdido.',
    hyp: {} },
];

export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
