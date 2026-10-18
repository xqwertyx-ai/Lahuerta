// Objetos y recuerdos que aparecen al restaurar la finca.
//
// where: 'unlock' (al volver a dibujar la zona), 'restore' (al llegar a conservación 70),
//        'cons' (al llegar a la conservación indicada en at),
//        'cat' (lo trae el gato), 'event' (solo por un evento), 'task' (tarea en la zona)
// thread: a qué hilo del misterio pertenece (un familiar o 'pianista')
// hyp: cuánto apoya o descarta cada hipótesis sobre el pianista (ver story.js)
// score: si es una partitura, cuántas notas añade al tema del pianista
//
// ✎ AUTOR: textos provisionales, tiernos y sin hechos graves. Edítalos a tu gusto.

export const ITEMS = [
  // ── Pianista: partituras ──
  { id: 'partitura1', name: 'Una hoja de partitura doblada', thread: 'pianista', zone: 'patio', where: 'restore', score: 4, icon: 'partitura',
    text: 'Encajada bajo un azulejo suelto de la fuente. Ocho compases a lápiz, sin título. Al final, una sola palabra: «atardecer».',
    hyp: { musico: 1, transi: 1 } },
  { id: 'partitura2', name: 'Partitura con manchas de aceite', thread: 'pianista', zone: 'almacen', where: 'restore', score: 4, icon: 'partitura',
    text: 'Entre sacos de pienso. La letra de las notas es fina y apretada; la de los márgenes, redonda. Dos manos distintas.',
    hyp: { feliciano: 1, transi: 1 } },
  { id: 'partitura3', name: 'Partitura en el desván', thread: 'pianista', zone: 'cortijo', where: 'restore', score: 4, icon: 'partitura',
    text: 'Dentro de una caja de zapatos. Alguien tachó una nota y escribió encima otra, con prisa, como quien corrige una carta.',
    hyp: { musico: 1, mueble: -1 } },
  { id: 'partitura4', name: 'Partitura en la banqueta', thread: 'pianista', zone: 'piano', where: 'unlock', score: 4, icon: 'partitura',
    text: 'Bajo la tapa de la banqueta del piano. Está fechada en verano, sin año. Lleva un dibujo diminuto de un ciervo en una esquina.',
    hyp: { transi: 2, mueble: -1 } },
  { id: 'partitura5', name: 'Un trozo de partitura mordisqueado', thread: 'pianista', zone: null, where: 'cat', score: 2, icon: 'partitura',
    text: 'El gato lo deja a tus pies con mucha dignidad. Le faltan las esquinas, pero se leen cuatro notas.',
    hyp: {} },
  { id: 'partitura6', name: 'Partitura en la caja de fruta', thread: 'pianista', zone: 'bosquete', where: 'restore', score: 2, icon: 'partitura',
    text: 'Envuelta en papel de periódico dentro de la caja de fruta. Es el final de la melodía: las últimas notas, por fin.',
    hyp: { musico: 1, feliciano: 1 } },
  { id: 'disco', name: 'Un disco de pizarra sin etiqueta', thread: 'pianista', zone: 'almacen', where: 'unlock', icon: 'disco',
    text: 'En el centro, a pluma: «para tocar al atardecer». No hay gramófono en la casa. Todavía.',
    hyp: { musico: 1, mueble: 1 } },
  { id: 'diario', name: 'Un diario de tapas azules', thread: 'pianista', zone: 'piano', where: 'restore', icon: 'diario',
    text: 'Apuntes breves, sin nombre: «Hoy ha sonado bien.» «Llovió; no tocamos.» «Los ciervos han vuelto.» Siempre en plural.',
    hyp: { musico: 1, transi: 1, feliciano: 1, mueble: -2 } },

  // ── Manuel ──
  { id: 'llave', name: 'Una llave grande de hierro', thread: 'manuel', zone: 'muros', where: 'unlock', icon: 'llave',
    text: 'Aparece entre dos piedras del muro, envuelta en un trapo. Es demasiado grande para cualquier puerta de la casa.',
    hyp: { manuel: 1 } },
  { id: 'reloj', name: 'Un reloj de bolsillo parado', thread: 'manuel', zone: 'dehesa', where: 'restore', icon: 'reloj',
    text: 'Bajo el gran pino, medio enterrado. Las agujas marcan las ocho y diez. La tapa tiene grabada una M.',
    hyp: { manuel: 1 } },
  { id: 'escritura', name: 'Una escritura antigua', thread: 'manuel', zone: null, where: 'event', icon: 'carta',
    text: 'Entre los papeles de la herencia. La finca ya tenía nombre en la primera escritura: «la huerta del pianista».',
    hyp: { manuel: 2, feliciano: -1, transi: -1 } },

  // ── Feliciano ──
  { id: 'cuentas', name: 'El cuaderno de cuentas', thread: 'feliciano', zone: 'almacen', where: 'task', icon: 'cuaderno',
    text: 'Sacos de bellota, kilos de cal, jornales. En una esquina, a lápiz: «cuerdas del piano — pendiente».',
    hyp: { feliciano: 1, mueble: 1 } },
  { id: 'foto_fuente', name: 'Una foto de la fuente a medio hacer', thread: 'feliciano', zone: 'patio', where: 'cons', at: 50, icon: 'foto',
    text: 'Un hombre con boina, de espaldas, sujeta un azulejo azul. Al dorso: «Feliciano, la fuente, primer verano».',
    hyp: { feliciano: 1 } },

  // ── Transi ──
  { id: 'firma', name: 'La firma de los cuadros', thread: 'transi', zone: 'cortijo', where: 'cons', at: 50, icon: 'firma',
    text: 'Al descolgar los dos óleos para limpiarlos, lo lees despacio en la esquina: «Transi». Los pintó la abuela.',
    hyp: { transi: 2 } },
  { id: 'acuarelas', name: 'La caja de pinturas de Transi', thread: 'transi', zone: 'cortijo', where: 'task', icon: 'caja',
    text: 'Pastillas de color gastadas hasta el fondo. El ocre y el azul, casi terminados. Debajo, un papel con notas musicales dibujadas como pájaros.',
    hyp: { transi: 2 } },
  { id: 'boceto', name: 'Un boceto de los ciervos', thread: 'transi', zone: 'alberca', where: 'restore', icon: 'boceto',
    text: 'El estudio del segundo cuadro: los ciervos junto al agua. En el borde, a lápiz, un pentagrama sin terminar.',
    hyp: { transi: 1, musico: 1 } },

  // ── Elisa y Loli ──
  { id: 'carta', name: 'Una carta de Elisa', thread: 'elisa', zone: 'cortijo', where: 'restore', icon: 'carta',
    text: '«¿Sigue sonando el piano por las tardes? Aquí lo echo de menos. Dale un beso a Transi y otro al pino.»',
    hyp: { musico: 1, mueble: -1 } },
  { id: 'receta', name: 'La receta de membrillo de Loli', thread: 'loli', zone: 'huerta', where: 'unlock', icon: 'receta',
    text: 'Membrillo, azúcar, paciencia. Y al final: «remover despacio, con música, que sale mejor».',
    hyp: {} },
  { id: 'foto_hermanas', name: 'Una foto de tres hermanas', thread: 'loli', zone: 'paseo', where: 'restore', icon: 'foto',
    text: 'Tres mujeres de espaldas bajo las adelfas, mirando hacia el cenador. Una lleva un pañuelo, otra un cesto. La tercera, un cuaderno.',
    hyp: { transi: 1 } },
  { id: 'panuelo', name: 'Un pañuelo bordado', thread: 'elisa', zone: 'bosquete', where: 'unlock', icon: 'panuelo',
    text: 'Colgado de una rama de la higuera, descolorido. Bordadas, unas iniciales: E. y, más pequeño, una corchea.',
    hyp: { musico: 1 } },
];

export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
