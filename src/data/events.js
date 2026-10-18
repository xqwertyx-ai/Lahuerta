// Eventos de la finca. Todo por datos.
//
// weight: probabilidad relativa · seasons: estaciones en que puede pasar (0-3)
// once: solo una vez por partida · cooldown: días mínimos entre repeticiones
// cond(s, h): condición extra (s = estado, h = ayudas de la simulación)
// text: texto o función (s, h) → texto
// options: [{ label, cost, effects, apply(s, h), result }]
//   cost: { money, jornales, lena, piedra, cal, herramientas, <producto> } — si no llega, la opción se desactiva
//   effects: { money, mood, rep, materials:{}, products:{}, zones:{ id|all: delta }, weeds:{ id|all: delta },
//              flag, item, water }
//   result: texto que se escribe en el diario tras elegir

export const EVENTS = [
  // ───────────── Clima ─────────────
  {
    id: 'helada', title: 'Helada', illus: 'helada', weight: 5, seasons: [3], cooldown: 4,
    text: 'Amanece blanco. La escarcha ha mordido los muros y la huerta cruje como papel.',
    options: [
      { label: 'Tapar la huerta con paja', cost: { jornales: 1 }, effects: { zones: { huerta: -3 } }, result: 'La paja abriga los bancales. Lo peor pasa de largo.' },
      { label: 'Encender la chimenea y esperar', effects: { zones: { huerta: -12, muros: -6 }, mood: 3 }, result: 'Un día de manta y leña. La huerta lo nota.' },
    ],
  },
  {
    id: 'ola_calor', title: 'Ola de calor', illus: 'calor', weight: 5, seasons: [1], cooldown: 5,
    text: 'El aire tiembla sobre la dehesa. Las gallinas se esconden bajo la yuca y la alberca baja un palmo.',
    options: [
      { label: 'Regar al alba y sombrear', cost: { jornales: 2 }, effects: { zones: { huerta: 4 }, mood: -1 }, result: 'Madrugón y riego. La huerta aguanta.' },
      { label: 'Siesta larga, como manda la tradición', effects: { zones: { huerta: -10, alberca: -6 }, mood: 4, water: -10 }, result: 'Persianas bajadas hasta las siete. Algo se seca, pero el ánimo descansa.' },
    ],
  },
  {
    id: 'tormenta', title: 'Tormenta de verano', illus: 'tormenta', weight: 4, seasons: [1, 2], cooldown: 6,
    text: 'Truena detrás del pueblo. En un momento el patio es un río y el cielo, morado.',
    options: [
      { label: 'Salir a asegurar las tejas', cost: { jornales: 1 }, effects: { zones: { cortijo: -2 } }, result: 'Empapado, pero el tejado aguanta.' },
      { label: 'Mirarla desde la ventana', effects: { zones: { cortijo: -9, paseo: -5 }, mood: 2, water: 15 }, result: 'Una tormenta preciosa. Mañana habrá goteras.' },
    ],
  },
  {
    id: 'sequia', title: 'Sequía', illus: 'sequia', weight: 3, seasons: [1, 2], cooldown: 20,
    cond: (s) => s.water < 40,
    text: 'Hace semanas que no cae una gota. La tierra se abre en grietas y el pozo suena hueco.',
    options: [
      { label: 'Comprar una cuba de agua', cost: { money: 40 }, effects: { water: 30 }, result: 'El camión cisterna sube por el camino entre polvo.' },
      { label: 'Ahorrar agua: solo lo justo', effects: { zones: { huerta: -14, patio: -6 }, mood: -2 }, result: 'La huerta se resiente. La fuente calla unos días.' },
    ],
  },
  {
    id: 'dana', title: 'Gota fría', illus: 'dana', weight: 2, seasons: [2], cooldown: 30,
    text: 'Llueve como si el cielo se hubiera roto. El arroyo se desborda y arrastra parte del muro.',
    options: [
      { label: 'Hacer zanjas para desviar el agua', cost: { jornales: 3 }, effects: { zones: { muros: -6, huerta: -4 }, water: 25 }, result: 'Barro hasta las rodillas, pero el agua se va por donde debe.' },
      { label: 'Ponerse a salvo y esperar', effects: { zones: { muros: -18, huerta: -14, paseo: -8 }, water: 30 }, result: 'Cuando escampa, el paseo es un barrizal y el muro tiene un hueco nuevo.' },
    ],
  },
  {
    id: 'vendaval', title: 'Vendaval', illus: 'viento', weight: 3, seasons: [0, 2, 3], cooldown: 8,
    text: 'Sopla el poniente toda la noche. Por la mañana hay ramas por todas partes.',
    options: [
      { label: 'Recoger las ramas para leña', cost: { jornales: 1 }, effects: { materials: { lena: 3 }, zones: { bosquete: -4, paseo: -3 } }, result: 'Lo que el viento tira, la chimenea lo agradece.' },
      { label: 'Dejarlo para otro día', effects: { zones: { bosquete: -8, paseo: -6 }, weeds: { paseo: 10 } }, result: 'Las ramas se quedan donde cayeron.' },
    ],
  },

  // ───────────── Naturaleza ─────────────
  {
    id: 'incendio', title: 'Humo en el horizonte', illus: 'fuego', weight: 0, seasons: [1, 2], cooldown: 25,
    // Lo dispara la simulación según el riesgo de fuego (maleza, calor, alberca)
    text: (s, h) => h.avgWeeds() > 45
      ? 'Arde el monte al otro lado del arroyo. El viento trae ceniza y la maleza de la finca está seca y alta.'
      : 'Arde el monte al otro lado del arroyo. La finca está limpia y la columna de humo se aleja.',
    options: [
      { label: 'Abrir un cortafuegos a toda prisa', cost: { jornales: 3 }, apply: (s, h) => h.fire(0.35), result: 'Azada y sudor. El fuego se detiene en la raya que habéis abierto.' },
      { label: 'Avisar al pueblo y mojar los bordes', apply: (s, h) => h.fire(1), result: 'Llegan vecinos con mangueras. Algo se quema, pero la casa queda en pie.' },
    ],
  },
  {
    id: 'jabalies', title: 'Jabalíes', illus: 'jabali', weight: 4, seasons: [2, 3], cooldown: 8,
    cond: (s) => s.zones.huerta.unlocked,
    text: 'Esta noche han entrado jabalíes. Han hozado los bancales y han dejado la valla como un acordeón.',
    options: [
      { label: 'Reforzar la valla con piedra', cost: { jornales: 2, piedra: 2 }, effects: { zones: { huerta: -6 } }, flag: 'vallaJabali', result: 'Una valla que hasta un jabalí respetaría.' },
      { label: 'Resignarse y replantar', effects: { zones: { huerta: -15 }, mood: -2 }, result: 'Se han comido lo mejor. Ya crecerá.' },
    ],
  },
  {
    id: 'plaga', title: 'Pulgón', illus: 'plaga', weight: 3, seasons: [0, 1], cooldown: 10,
    cond: (s) => s.zones.huerta.unlocked || s.zones.bosquete.unlocked,
    text: 'Las hojas de la huerta y de la parra amanecen pegajosas. Pulgón, y mucho.',
    options: [
      { label: 'Jabón potásico, hoja a hoja', cost: { jornales: 2, money: 5 }, effects: { zones: { huerta: -2, bosquete: -2 } }, result: 'Paciencia de monje. La plaga se rinde.' },
      { label: 'Esperar a las mariquitas', effects: { zones: { huerta: -10, bosquete: -6 } }, result: 'Las mariquitas llegan… tarde.' },
    ],
  },
  {
    id: 'buen_ano_bellota', title: 'Buen año de bellota', illus: 'bellota', weight: 3, seasons: [2], once: false, cooldown: 40,
    text: 'Las encinas están cargadas como nunca. El suelo de la dehesa cruje de bellotas.',
    options: [
      { label: 'Recogerla a manos llenas', cost: { jornales: 2 }, effects: { products: { bellota: 12 } }, result: 'Doce sacos de bellota. Los cerdos del pueblo te envidian.' },
      { label: 'Dejarla para los animales del monte', effects: { mood: 3, rep: 1 }, result: 'Ciervos y grullas lo agradecen.' },
    ],
  },
  {
    id: 'enjambre', title: 'Un enjambre', illus: 'enjambre', weight: 3, seasons: [0, 1], cooldown: 20,
    text: 'Una nube zumbadora se ha posado en la rama baja de la higuera. Un enjambre buscando casa.',
    options: [
      { label: 'Recogerlo en una caja', cost: { jornales: 1 }, apply: (s, h) => { if (s.zones.colmenar.unlocked) { h.addAnimal('colmenas', 1); h.log('Una colmena más en el colmenar.'); } else { h.addMoney(25); h.log('Un apicultor del pueblo te da 25 € por el enjambre.'); } }, result: 'Con calma y sin miedo, como decía alguien.' },
      { label: 'Dejar que siga su camino', effects: { mood: 1 }, result: 'Al mediodía se ha ido, como vino.' },
    ],
  },
  {
    id: 'ciervos', title: 'Ciervos al atardecer', illus: 'ciervos', weight: 3, seasons: [0, 2, 3], cooldown: 9,
    text: (s) => s.items.includes('firma')
      ? 'Un ciervo y una cierva bajan a beber a la alberca. Es exactamente el cuadro de Transi, como si lo hubiera pintado esta tarde.'
      : 'Un ciervo y una cierva bajan a beber a la alberca. La escena te resulta extrañamente familiar.',
    options: [
      { label: 'Quedarse muy quieto mirando', effects: { mood: 6 }, apply: (s, h) => h.clue('transi', 0.5), result: 'Diez minutos sin respirar apenas. Luego se van entre las encinas.' },
      { label: 'Intentar dibujarlos', cost: { jornales: 1 }, effects: { mood: 4, rep: 1 }, apply: (s, h) => h.clue('transi', 1), result: 'El dibujo no se parece a nada. Pero entiendes por qué alguien pintaba esto.' },
    ],
  },
  {
    id: 'gato', title: 'El gato trae algo', illus: 'gato', weight: 0, cooldown: 3,
    // Lo dispara la simulación (el gato encuentra cosas)
    text: (s, h) => h.catGift().text,
    options: [
      { label: 'Darle las gracias (y una sardina)', apply: (s, h) => h.catGift().apply(), result: 'El gato acepta la sardina como un pago justo.' },
    ],
  },

  // ───────────── Pueblo ─────────────
  {
    id: 'romeria', title: 'Romería', illus: 'feria', weight: 4, seasons: [0], cooldown: 40,
    text: 'Pasan carretas adornadas camino de la ermita. Te invitan a unirte con lo que tengas.',
    options: [
      { label: 'Ir con una cesta de la finca', cost: { jornales: 1 }, apply: (s, h) => { const n = h.giveProducts(3); h.addRep(2 + n); h.addMood(5); }, result: 'Cantos, polvo y vino. Media comarca sabe ya que la finca vuelve a vivir.' },
      { label: 'Quedarse trabajando', effects: { mood: -2 }, result: 'Se oyen las sevillanas a lo lejos.' },
    ],
  },
  {
    id: 'feria', title: 'Feria de Fuente Obejuna', illus: 'feria', weight: 4, seasons: [1, 2], cooldown: 40,
    text: 'Es la feria del pueblo. Hay un puesto libre en la plaza y la cooperativa organiza un concurso.',
    options: [
      { label: 'Montar un puesto con productos', cost: { jornales: 2 }, apply: (s, h) => { const m = h.sellAllAt(1.25); h.addRep(3); h.log(`En la feria vendes por ${m} €.`); }, result: 'Feria, calor y conversación. Se agota casi todo.' },
      { label: 'Ir solo a bailar', effects: { mood: 8, money: -10 }, result: 'Churros, caseta y sevillanas hasta las tantas.' },
    ],
  },
  {
    id: 'todos_a_una', title: 'Todos a una', illus: 'vecinos', weight: 3, cooldown: 30,
    cond: (s, h) => h.avgCons() < 45 && s.day > 6,
    text: 'Aparecen vecinos de Ojuelos con azadas, cubos de cal y una tortilla. «Aquí nos ayudamos todos a una, como siempre.»',
    options: [
      { label: 'Aceptar la ayuda y poner el vino', cost: { money: 10 }, effects: { zones: { all: 9 }, mood: 10, rep: 3, flag: 'todosAUna' }, result: 'En un día se hace el trabajo de una semana. Fuenteovejuna, todos a una.' },
      { label: 'Darles las gracias, pero no hace falta', effects: { mood: 2, rep: -1 }, result: 'Se van algo dolidos. En los pueblos la ayuda no se rechaza.' },
    ],
  },
  {
    id: 'subvencion', title: 'Una subvención', illus: 'papeles', weight: 2, cooldown: 35, minDay: 8,
    text: 'La oficina comarcal abre ayudas para recuperar dehesas y muros de piedra seca. Hay que rellenar mucho papel.',
    options: [
      { label: 'Pasar el día con los formularios', cost: { jornales: 3 }, apply: (s, h) => h.later(5, 'subvencionPagada'), result: 'Sellos, fotocopias y un funcionario amable. Dicen que en unos días.' },
      { label: 'Que se lo den a otro', result: 'Hay cosas que no caben en un formulario.' },
    ],
  },
  {
    id: 'inspeccion', title: 'Inspección', illus: 'inspector', weight: 2, cooldown: 30, minDay: 10,
    cond: (s) => s.zones.corral.unlocked || s.guests.length > 0,
    text: (s) => `Un inspector de la Junta pregunta por ${s.guests.length ? 'los papeles de los huéspedes' : 'el corral y los animales'}. Mira todo con su carpeta.`,
    options: [
      { label: 'Enseñárselo todo con calma', apply: (s, h) => { const c = s.guests.length ? h.zoneCons('cortijo') : h.zoneCons('corral'); if (c >= 55) { h.addRep(2); h.log('«Todo en orden.» Hasta sonríe.'); } else { h.addMoney(-60); h.log('Multa de 60 €. «Arregle esto antes de la próxima.»'); } } },
      { label: 'Invitarle a un café primero', cost: { money: 2 }, apply: (s, h) => { const c = s.guests.length ? h.zoneCons('cortijo') : h.zoneCons('corral'); if (c >= 45) { h.addRep(2); h.log('Café, charla y «todo en orden».'); } else { h.addMoney(-40); h.log('El café ayuda, pero no tanto: 40 € de multa.'); } } },
    ],
  },
  {
    id: 'herencia', title: 'Papeleo de la herencia', illus: 'papeles', weight: 6, once: true, minDay: 3,
    text: 'Llega una carta del notario: falta una firma en los papeles de la herencia. Hay que bajar a Fuente Obejuna.',
    options: [
      { label: 'Bajar al notario', cost: { jornales: 2, money: 15 }, effects: { item: 'escritura' }, result: 'Entre los papeles, una escritura muy antigua. La finca ya tenía nombre.' },
      { label: 'Dejarlo para más adelante', apply: (s, h) => h.later(10, 'herenciaOtraVez'), result: 'El sobre se queda en la mesa, junto al frutero.' },
    ],
  },

  // ───────────── Visitantes ─────────────
  {
    id: 'influencer', title: 'Una visita sin avisar', illus: 'influencer', weight: 2, cooldown: 30, minDay: 15,
    text: 'Una chica con un palo de selfi y cuarenta mil seguidores se presenta en la puerta. «¿Puedo grabar aquí? Es tan auténtico…»',
    options: [
      { label: 'Enseñarle la finca', cost: { jornales: 1 }, apply: (s, h) => { const c = h.avgCons(); if (c >= 55) { h.addRep(8); h.log('El vídeo da la vuelta a internet. «La finca más bonita de Córdoba».'); } else { h.addRep(-3); h.log('El vídeo se titula «Ruinas con encanto». No es lo que esperabas.'); } } },
      { label: 'Pedirle amablemente que vuelva otro día', effects: { rep: 0 }, result: 'Se va a grabar al pueblo. Ella se lo pierde.' },
    ],
  },
  {
    id: 'forastero', title: 'Alguien pregunta por el pianista', illus: 'forastero', weight: 2, cooldown: 25, minDay: 6,
    text: 'Un señor mayor con sombrero se para en la cancela. «¿Es esta la huerta del pianista? Mi madre me contaba que aquí sonaba un piano por las tardes.»',
    options: [
      { label: 'Invitarle a un vaso de agua y escuchar', apply: (s, h) => { h.clue('musico', 1); h.addMood(3); h.log('«Sonaba al atardecer, y los que pasaban por el camino se paraban.» No sabe quién tocaba.'); } },
      { label: 'Preguntarle qué melodía era', apply: (s, h) => { h.clue('feliciano', 1); h.addThemeHint(); h.log('Tararea cuatro notas. Son las mismas que silbaba el abuelo.'); } },
    ],
  },
  {
    id: 'vecina', title: 'La vecina del camino', illus: 'vecinos', weight: 2, cooldown: 20, minDay: 4,
    text: 'Una vecina de Ojuelos trae higos de su higuera. «Tu abuela pintaba en el porche y tu abuelo silbaba en el corral. Qué casa más alegre era esta.»',
    options: [
      { label: 'Preguntarle por el piano', apply: (s, h) => { h.clue('transi', 1); h.addProduct('higos', 2); h.log('«¿El piano? Eso lo sabrá el gato», se ríe. Te deja dos kilos de higos.'); } },
      { label: 'Ofrecerle lo que haya en casa', apply: (s, h) => { h.giveProducts(1); h.addRep(2); h.addMood(3); h.log('Se va contenta. Mañana lo sabrá todo Ojuelos.'); } },
    ],
  },
  {
    id: 'cartero', title: 'El cartero', illus: 'carta', weight: 2, cooldown: 15, minDay: 5,
    text: 'El cartero sube en su moto. Trae una postal de un antiguo voluntario.',
    cond: (s) => s.stats.volunteersLeft > 0,
    options: [
      { label: 'Leerla en el patio', apply: (s, h) => { h.addMood(5); h.addRep(1); h.log(h.postcard()); } },
    ],
  },
  {
    id: 'quedarse', title: '¿Me puedo quedar?', illus: 'voluntario', weight: 0, cooldown: 0,
    // Lo dispara la simulación cuando un voluntario contento está a punto de irse
    text: (s, h) => h.leavingText(),
    options: [
      { label: 'Claro que sí', apply: (s, h) => h.extendStay(10), result: 'Se queda diez días más. El gato parece de acuerdo.' },
      { label: 'Despedirse con un abrazo', apply: (s, h) => h.letGo(), result: 'Le dejas en la parada del autobús con un tarro de lo que haya.' },
    ],
  },
  {
    id: 'subvencionPagada', title: 'Llega la subvención', illus: 'papeles', weight: 0,
    text: 'Una carta con membrete: la ayuda para la dehesa ha sido aprobada.',
    options: [ { label: 'Abrir el sobre', effects: { money: 260, mood: 6 }, result: '260 € para la dehesa y los muros. Hay funcionarios buenos.' } ],
  },
  {
    id: 'herenciaOtraVez', title: 'Otra vez el notario', illus: 'papeles', weight: 0,
    text: 'El notario insiste: sin esa firma, los papeles de la finca no estarán en regla.',
    options: [
      { label: 'Bajar al notario', cost: { jornales: 2, money: 15 }, effects: { item: 'escritura' }, result: 'Entre los papeles, una escritura muy antigua. La finca ya tenía nombre.' },
      { label: 'Ir otro día', apply: (s, h) => h.later(10, 'herenciaOtraVez') },
    ],
  },
  {
    id: 'concierto', title: 'Concierto al atardecer', illus: 'concierto', weight: 0,
    // Lo dispara la simulación los días de concierto con huéspedes
    text: (s) => `Cae la tarde. ${s.guests.length} ${s.guests.length === 1 ? 'huésped se sienta' : 'huéspedes se sientan'} en el cenador. El piano espera.`,
    options: [
      { label: 'Que suene', apply: (s, h) => h.concert(), result: 'Nadie habla mientras suena. Al final, solo se oyen los grillos.' },
    ],
  },
];

export const EVENT_BY_ID = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
