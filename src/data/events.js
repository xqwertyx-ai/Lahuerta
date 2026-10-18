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
// crisis: true → contratiempo (más frecuente cada año y en dificultad dura)
// when: 'tarde' → sale al atardecer. Si alguna opción cuesta jornales, el evento llega al amanecer
//   (con el día por delante); si no, a cualquier hora.
// Ayudas de contratiempos (ver sim/events.js): h.breakDown(id) rompe algo (data/hardships.js),
//   h.mod(id, días) pone un aviso económico, h.hurtBeds(f), h.loseAnimals(k, f), h.restVolunteer(días)…

export const EVENTS = [
  // ───────────── Clima ─────────────
  {
    id: 'helada', title: 'Helada', illus: 'helada', weight: 5, seasons: [3], cooldown: 4,
    text: 'Amanece blanco. La escarcha ha mordido los muros y la huerta cruje como papel.',
    options: [
      { label: 'Tapar la huerta con paja', cost: { jornales: 1 }, effects: { zones: { huerta: -3 } }, apply: (s, h) => h.hurtBeds(0.1), result: 'La paja abriga los bancales. Lo peor pasa de largo.' },
      { label: 'Encender la chimenea y esperar', effects: { zones: { huerta: -12, muros: -6 }, mood: 2 }, apply: (s, h) => { h.hurtBeds(0.6); if (h.chance(0.3)) h.breakDown('tuberia'); }, result: 'Un día de manta y leña. La huerta lo nota.' },
    ],
  },
  {
    id: 'ola_calor', title: 'Ola de calor', illus: 'calor', weight: 5, seasons: [1], cooldown: 5,
    text: 'El aire tiembla sobre la dehesa. Las gallinas se esconden bajo la yuca y la alberca baja un palmo.',
    options: [
      { label: 'Regar al alba y sombrear', cost: { jornales: 2 }, effects: { zones: { huerta: 4 }, mood: -1 }, result: 'Madrugón y riego. La huerta aguanta.' },
      { label: 'Siesta larga, como manda la tradición', effects: { zones: { huerta: -10, alberca: -6 }, mood: 4, water: -10 }, apply: (s, h) => h.hurtBeds(0.35), result: 'Persianas bajadas hasta las siete. Algo se seca, pero el ánimo descansa.' },
    ],
  },
  {
    id: 'tormenta', title: 'Tormenta de verano', illus: 'tormenta', weight: 4, seasons: [1, 2], cooldown: 6,
    text: 'Truena detrás del pueblo. En un momento el patio es un río y el cielo, morado.',
    options: [
      { label: 'Salir a asegurar las tejas', cost: { jornales: 1 }, effects: { zones: { cortijo: -2 } }, result: 'Empapado, pero el tejado aguanta.' },
      { label: 'Mirarla desde la ventana', effects: { zones: { cortijo: -9, paseo: -5 }, mood: 2, water: 15 }, apply: (s, h) => { if (h.zoneCons('cortijo') < 65 && h.chance(0.5)) h.breakDown('tejado'); }, result: 'Una tormenta preciosa. Mañana habrá goteras.' },
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
    id: 'dana', title: 'Gota fría', illus: 'dana', weight: 2, crisis: true, seasons: [2], cooldown: 30,
    text: 'Llueve como si el cielo se hubiera roto. El arroyo se desborda y arrastra parte del muro.',
    options: [
      { label: 'Hacer zanjas para desviar el agua', cost: { jornales: 3 }, effects: { zones: { muros: -6, huerta: -4 }, water: 25 }, apply: (s, h) => h.hurtBeds(0.3), result: 'Barro hasta las rodillas, pero el agua se va por donde debe.' },
      { label: 'Ponerse a salvo y esperar', effects: { zones: { muros: -10, huerta: -8, paseo: -8 }, water: 30 }, apply: (s, h) => { h.breakDown('muro'); h.breakDown('bancales'); }, result: 'Cuando escampa, el paseo es un barrizal y el muro tiene un hueco nuevo.' },
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
    cond: (s) => s.zones.huerta.unlocked && !s.flags.vallaJabali,
    text: 'Esta noche han entrado jabalíes. Han hozado los bancales y han dejado la valla como un acordeón.',
    options: [
      { label: 'Reforzar la valla con piedra', cost: { jornales: 2, piedra: 2 }, effects: { zones: { huerta: -6 } }, apply: (s, h) => h.hurtBeds(0.2), flag: 'vallaJabali', result: 'Una valla que hasta un jabalí respetaría.' },
      { label: 'Resignarse y replantar', effects: { zones: { huerta: -15 }, mood: -2 }, apply: (s, h) => h.hurtBeds(0.8), result: 'Se han comido lo mejor. Ya crecerá.' },
    ],
  },
  {
    id: 'plaga', title: 'Pulgón', illus: 'plaga', weight: 3, seasons: [0, 1], cooldown: 10,
    cond: (s) => s.zones.huerta.unlocked || s.zones.bosquete.unlocked,
    text: 'Las hojas de la huerta y de la parra amanecen pegajosas. Pulgón, y mucho.',
    options: [
      { label: 'Jabón potásico, hoja a hoja', cost: { jornales: 2, money: 5 }, effects: { zones: { huerta: -2, bosquete: -2 } }, result: 'Paciencia de monje. La plaga se rinde.' },
      { label: 'Esperar a las mariquitas', effects: { zones: { huerta: -10, bosquete: -6 } }, apply: (s, h) => h.hurtBeds(0.5), result: 'Las mariquitas llegan… tarde.' },
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
    id: 'ciervos', title: 'Ciervos al atardecer', illus: 'ciervos', weight: 3, seasons: [0, 2, 3], cooldown: 9, when: 'tarde',
    text: (s) => s.items.includes('firma')
      ? 'Un ciervo y una cierva bajan a beber a la alberca. Es exactamente el cuadro de Transi, como si lo hubiera pintado esta tarde.'
      : 'Un ciervo y una cierva bajan a beber a la alberca. La escena te resulta extrañamente familiar.',
    options: [
      { label: 'Quedarse muy quieto mirando', effects: { mood: 6 }, apply: (s, h) => h.clue('transi', 0.5), result: 'Diez minutos sin respirar apenas. Luego se van entre las encinas.' },
      { label: 'Intentar dibujarlos', effects: { mood: 4, rep: 1 }, apply: (s, h) => h.clue('transi', 1), result: 'El dibujo no se parece a nada. Pero entiendes por qué alguien pintaba esto.' },
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

  // ───────────── Contratiempos ─────────────
  // Avisos: si se atienden a tiempo cuestan unos jornales; si no, algo se rompe y hay que repararlo.
  {
    id: 'temporal', title: 'Temporal', illus: 'averia', weight: 3, seasons: [2, 3], cooldown: 20, crisis: true,
    cond: (s, h) => h.canBreak('tejado'),
    text: 'Tres días de agua y viento. Esta noche la viga maestra del tejado ha crujido como un barco viejo.',
    options: [
      { label: 'Apuntalar la viga ya', cost: { jornales: 3, herramientas: 0.5 }, effects: { zones: { cortijo: -4 } }, result: 'Puntales, cuñas y mucho cuidado. La viga aguanta.' },
      { label: 'Esperar a que escampe', apply: (s, h) => h.breakDown('tejado'), result: 'De madrugada, un estruendo. Se ha hundido un trozo del tejado.' },
    ],
  },
  {
    id: 'helada_negra', title: 'Helada negra', illus: 'helada', weight: 3, seasons: [3], cooldown: 25, crisis: true,
    cond: (s, h) => h.canBreak('tuberia') || h.canBreak('alberca_grieta'),
    text: 'Anuncian ocho bajo cero. De las que revientan tuberías y abren piedras.',
    options: [
      { label: 'Vaciar tuberías, tapar la huerta y la alberca', cost: { jornales: 3 }, apply: (s, h) => h.hurtBeds(0.2), result: 'Un día entero de mantas, paja y grifos abiertos. Amanece blanco, pero todo entero.' },
      { label: 'Encender la chimenea y cruzar los dedos', apply: (s, h) => { h.hurtBeds(1); if (!h.breakDown('tuberia')) h.breakDown('alberca_grieta'); else if (h.chance(0.4)) h.breakDown('alberca_grieta'); }, result: 'Por la mañana, el patio es una pista de hielo y el agua sale por donde no debe.' },
    ],
  },
  {
    id: 'rayo', title: 'Tormenta seca', illus: 'tormenta', weight: 2, seasons: [1, 2], cooldown: 40, crisis: true,
    cond: (s, h) => h.canBreak('espadana'),
    text: 'Truena sin llover. Un rayo cae con un chasquido en la espadaña de la ermita y la campana rueda por el suelo.',
    options: [
      { label: 'Pedir ayuda a los vecinos para recoger', cost: { money: 15 }, apply: (s, h) => { h.breakDown('espadana'); h.helpRepair('espadana', 3); h.addRep(1); }, result: 'Suben con carretillas y un bocadillo. San Antonio tiene muchos devotos.' },
      { label: 'Recoger la campana y ver qué se puede hacer', apply: (s, h) => h.breakDown('espadana'), result: 'La campana está entera. La espadaña, no.' },
    ],
  },
  {
    id: 'granizo', title: 'Pedrisco', illus: 'tormenta', weight: 3, seasons: [0, 1], cooldown: 25, crisis: true,
    text: 'Cae granizo del tamaño de garbanzos durante diez minutos eternos. Suena como si tiraran piedras al tejado.',
    options: [
      { label: 'Salvar lo que se pueda de la huerta', cost: { jornales: 2 }, apply: (s, h) => { h.hurtBeds(0.5); h.mod('granizo', 7); }, result: 'Se salva la mitad. Los frutales, apedreados.' },
      { label: 'Esperar dentro a que pase', apply: (s, h) => { h.hurtBeds(1); h.mod('granizo', 14); }, effects: { zones: { huerta: -10, pozo: -6, bosquete: -5 } }, result: 'La huerta está hecha trizas y la parra, deshojada.' },
    ],
  },
  {
    id: 'pozo_ruido', title: 'El pozo hace un ruido raro', illus: 'sequia', weight: 3, seasons: [1, 2], cooldown: 30, crisis: true,
    cond: (s, h) => h.canBreak('bomba'),
    text: 'La bomba del pozo traquetea y escupe agua con barro. Así no va a durar mucho.',
    options: [
      { label: 'Bajar a mirarla ya', cost: { jornales: 2, money: 15 }, result: 'Una junta gastada y una piedrecita en el filtro. Arreglado a tiempo.' },
      { label: 'Ya aguantará', apply: (s, h) => h.breakDown('bomba'), result: 'Aguantó dos días. Ahora no da ni una gota.' },
    ],
  },
  {
    id: 'varroa_aviso', title: 'Abejas torpes', illus: 'enjambre', weight: 3, seasons: [0, 1, 2], cooldown: 30, crisis: true,
    cond: (s, h) => h.canBreak('varroa'),
    text: 'En la piquera hay abejas que no vuelan bien. Puede ser varroa, y si es, se extiende rápido.',
    options: [
      { label: 'Tratar todas las colmenas ya', cost: { jornales: 2, money: 25 }, effects: { zones: { colmenar: -4 } }, result: 'Ácido oxálico, humo y paciencia. Las colmenas se recuperan.' },
      { label: 'Esperar a ver', apply: (s, h) => h.breakDown('varroa'), result: 'Era varroa. Y se ha extendido.' },
    ],
  },
  {
    id: 'zorro', title: 'Huellas de zorro', illus: 'jabali', weight: 3, cooldown: 25, crisis: true,
    cond: (s, h) => s.animals.gallinas > 0 && h.canBreak('gallinero'),
    text: 'Junto al gallinero hay huellas finas y un agujero bajo la tela. Las gallinas no han querido salir.',
    options: [
      { label: 'Enterrar tela y reforzar el gallinero', cost: { jornales: 2, piedra: 1 }, result: 'Tela enterrada un palmo y piedras encima. Que lo intente ahora.' },
      { label: 'Cerrar bien la puerta esta noche', apply: (s, h) => { if (h.chance(0.75)) h.breakDown('gallinero'); }, result: 'Por la mañana se sabrá si ha bastado.' },
    ],
  },
  {
    id: 'humedad', title: 'Semana de niebla', illus: 'niebla', weight: 3, seasons: [2, 3], cooldown: 30, crisis: true,
    cond: (s, h) => s.zones.piano.unlocked && s.zones.piano.cons >= 35 && h.canBreak('piano_humedad'),
    text: 'La niebla se queda pegada a la dehesa una semana entera. En el cenador, el piano suda.',
    options: [
      { label: 'Taparlo y poner un brasero cerca', cost: { jornales: 1, lena: 2 }, result: 'Mantas, brasero y una vigilancia de abuela. El piano aguanta seco.' },
      { label: 'Ya se secará', apply: (s, h) => h.breakDown('piano_humedad'), result: 'Las teclas se han hinchado. Suena «tun» donde debía sonar un la.' },
    ],
  },
  {
    id: 'procesionaria', title: 'Bolsones en los pinos', illus: 'plaga', weight: 2, seasons: [3, 0], cooldown: 40, crisis: true,
    cond: (s, h) => h.canBreak('procesionaria'),
    text: 'En las copas de los pinos del bosquete hay bolsones blancos. Procesionaria. En unas semanas bajarán en fila.',
    options: [
      { label: 'Quitarlos con la pértiga', cost: { jornales: 2, money: 10 }, result: 'Con guantes, gafas y mucho cuidado. Al fuego, todos.' },
      { label: 'Dejarlo para la primavera', apply: (s, h) => h.breakDown('procesionaria'), result: 'Las orugas bajan antes de lo previsto. Nadie entra en el bosquete.' },
    ],
  },
  {
    id: 'camino', title: 'El camino se viene abajo', illus: 'dana', weight: 2, seasons: [2, 3], cooldown: 40, crisis: true,
    cond: (s, h) => s.flags.tourism && h.canBreak('camino'),
    text: 'Con tanta lluvia, el talud del camino junto a las adelfas se ha descalzado. Una rueda más y se hunde.',
    options: [
      { label: 'Echar piedra y apisonar hoy', cost: { jornales: 3, piedra: 3 }, effects: { zones: { paseo: 3 } }, result: 'Piedra, pisón y una carretilla que no para. El camino aguanta.' },
      { label: 'Poner un cartel de «despacio»', apply: (s, h) => h.breakDown('camino'), result: 'El cartel no ha servido de mucho. El camino se ha hundido.' },
    ],
  },
  {
    id: 'furgoneta', title: 'La furgoneta tose', illus: 'furgoneta', weight: 3, cooldown: 35, minDay: 8, crisis: true,
    cond: (s, h) => h.canBreak('furgoneta'),
    text: 'La furgoneta arranca a la tercera y echa un humo azul que no gusta nada.',
    options: [
      { label: 'Llevarla al taller del pueblo', cost: { money: 55 }, result: 'Bujías, filtro y un mecánico que habla mucho. Como nueva (casi).' },
      { label: 'Ya aguantará', apply: (s, h) => h.breakDown('furgoneta'), result: 'Aguantó hasta la cuesta del cortijo.' },
    ],
  },
  {
    id: 'ladrones', title: 'Han entrado en el cobertizo', illus: 'averia', weight: 2, cooldown: 40, minDay: 20, crisis: true,
    text: 'Esta noche alguien ha forzado el candado del cobertizo. Faltan herramientas y algún saco.',
    options: [
      { label: 'Poner cerradura nueva y apuntarlo todo', cost: { money: 25 }, effects: { materials: { herramientas: -1 } }, result: 'Una cerradura de las buenas. Y el perro de la vecina, que ladra a todo.' },
      { label: 'Preguntar en el bar del pueblo', apply: (s, h) => { if (h.chance(0.5)) h.log('Aparecen las herramientas junto a la cancela. Nadie sabe nada.'); else { h.addProduct('herramientas', -2); h.log('Nadie ha visto nada. Faltan dos juegos de herramientas.'); } }, result: 'En los pueblos todo se sabe… o no.' },
    ],
  },
  {
    id: 'gripe', title: 'Gripe en la casa', illus: 'voluntario', weight: 3, seasons: [2, 3], cooldown: 20, crisis: true,
    cond: (s) => s.volunteers.some((v) => !(v.rest > 0)),
    text: (s) => `Tos, mantas y caldo. Alguien de la casa tiene fiebre y no se puede levantar.`,
    options: [
      { label: 'Ir a la farmacia del pueblo y cuidarle', cost: { jornales: 1, money: 10 }, apply: (s, h) => { const v = h.restVolunteer(3); if (v) h.log(`${v.name} guarda cama tres días.`); }, result: 'Caldo de gallina, miel y paciencia.' },
      { label: 'Reposo y mucha agua', apply: (s, h) => { const v = h.restVolunteer(6); if (v) h.log(`${v.name} guarda cama casi una semana.`); }, result: 'La gripe se toma su tiempo.' },
    ],
  },

  // Economía: cambios que no se pueden evitar, solo aguantar o aprovechar
  {
    id: 'coop_baja', title: 'Carta de la cooperativa', illus: 'papeles', weight: 3, cooldown: 35, minDay: 10, crisis: true,
    text: 'Hay excedente en toda la comarca. La cooperativa avisa: durante dos semanas pagará mucho menos.',
    options: [
      { label: 'Guardar lo que aguante y vender en el mercado', apply: (s, h) => h.mod('coop_baja', 14), result: 'Lo fresco no espera. Lo demás, a la despensa.' },
    ],
  },
  {
    id: 'mercado_flojo', title: 'Camiones de fuera', illus: 'feria', weight: 2, cooldown: 35, minDay: 12, crisis: true,
    text: 'Llegan camiones con fruta y verdura de fuera, a precio de saldo. En el mercado nadie mira el puesto de la finca.',
    options: [
      { label: 'Aguantar', apply: (s, h) => h.mod('mercado_flojo', 10), result: 'Ya pasará. Lo de aquí sabe a otra cosa.' },
    ],
  },
  {
    id: 'luz_cara', title: 'La factura de la luz', illus: 'papeles', weight: 2, cooldown: 60, minDay: 25, crisis: true,
    cond: (s) => !s.flags.placas,
    text: 'Suben la luz y el gasoil. Los recibos de la finca van a pesar bastante más durante un mes.',
    options: [
      { label: 'Poner placas solares en el tejado del corral', cost: { money: 320, jornales: 2 }, flag: 'placas', apply: (s, h) => h.mod('luz_cara', 7), result: 'Placas al sol de Córdoba. Desde ahora, los recibos bajan para siempre.' },
      { label: 'Apretarse el cinturón', effects: { mood: -3 }, apply: (s, h) => h.mod('luz_cara', 28), result: 'Velas en la cena, que también es bonito.' },
    ],
  },
  {
    id: 'carretera', title: 'Obras en la carretera', illus: 'papeles', weight: 2, cooldown: 50, minDay: 20, crisis: true,
    text: 'Cortan la carretera de Fuente Obejuna una semana para asfaltar. Ni huéspedes ni mercado.',
    options: [
      { label: 'Aprovechar para trabajar en la finca', apply: (s, h) => h.mod('carretera', 7), result: 'Una semana de silencio total. Solo se oyen las máquinas, a lo lejos.' },
    ],
  },
  {
    id: 'lengua_azul', title: 'Lengua azul', illus: 'inspector', weight: 2, cooldown: 60, crisis: true,
    cond: (s) => s.animals.ovejas > 0,
    text: (s) => `Hay lengua azul en la comarca. La Junta obliga a vacunar y a tener las ovejas en cuarentena. Vacunar las ${s.animals.ovejas} cuesta ${s.animals.ovejas * 12} €.`,
    options: [
      { label: 'Vacunar a todas', apply: (s, h) => { h.addMoney(-12 * s.animals.ovejas); h.mod('lengua_azul', 8); }, result: 'Pinchazo a pinchazo. Una semana sin queso, pero todas sanas.' },
      { label: 'Solo cuarentena', apply: (s, h) => { h.mod('lengua_azul', 20); const n = h.loseAnimals('ovejas', 0.25); h.log(`Se pierden ${n === 1 ? 'una oveja' : n + ' ovejas'}.`); }, result: 'La cuarentena se alarga y alguna oveja no lo supera.' },
    ],
  },
  {
    id: 'peste', title: 'Alerta sanitaria porcina', illus: 'inspector', weight: 2, seasons: [2, 3], cooldown: 60, crisis: true,
    cond: (s) => s.animals.cerdos > 0 || s.products.cerdo > 0,
    text: 'Han detectado un brote en otra provincia. Los mataderos pagan la mitad hasta que se aclare.',
    options: [
      { label: 'Esperar sin vender', apply: (s, h) => h.mod('peste', 14), result: 'Los cerdos, a seguir comiendo bellota. Ya se venderán.' },
    ],
  },
  {
    id: 'pienso_caro', title: 'El pienso, por las nubes', illus: 'sequia', weight: 2, seasons: [1], cooldown: 40, crisis: true,
    cond: (s) => s.animals.ovejas + s.animals.gallinas > 0,
    text: 'Con la sequía, el pienso y la paja cuestan el doble en la cooperativa. Quien guardó heno en primavera respira.',
    options: [
      { label: 'Racionar', apply: (s, h) => h.mod('sequia_precio', 21), result: 'A partir de hoy, cada paca cuenta.' },
    ],
  },
  {
    id: 'mala_resena', title: 'Una estrella', illus: 'influencer', weight: 3, cooldown: 30, crisis: true,
    cond: (s, h) => s.flags.tourism && s.stats.guests > 4 && (s.zones.cortijo.cons < 75 || s.cold || h.damaged('cortijo') || h.damaged('paseo')),
    text: (s) => `Alguien ha dejado una reseña de una estrella: «${s.cold ? 'Pasamos un frío horrible, la chimenea apagada.' : 'Bonito, pero la casa se cae a trozos.'}»`,
    options: [
      { label: 'Contestar con cariño e invitarles a volver', cost: { jornales: 1 }, effects: { rep: -2 }, result: 'Una respuesta larga y sincera. Alguien escribe debajo: «Yo sí volvería».' },
      { label: 'Ignorarla', effects: { rep: -5 }, apply: (s, h) => h.mod('cancelaciones', 10), result: 'La reseña sube como la espuma. Llegan cancelaciones.' },
    ],
  },
  {
    id: 'prestamo', title: 'Números rojos', illus: 'papeles', weight: 8, cooldown: 45,
    cond: (s) => s.money < -40 && !s.loan,
    text: 'El director de la cooperativa te ve en la báscula y baja la voz: «Si os hace falta, os adelantamos algo. Ya lo devolvéis poco a poco».',
    options: [
      { label: 'Aceptar 300 € (11 cuotas de 30 €)', apply: (s, h) => h.takeLoan(300, 11, 30), result: 'Un apretón de manos y un papel firmado. Respiro.' },
      { label: 'No, ya saldremos', effects: { mood: -2 }, result: 'Toca vender lo que haya y apretarse.' },
    ],
  },
  {
    id: 'renta', title: 'La declaración de la renta', illus: 'papeles', weight: 0,
    // La dispara la simulación cada primavera si el año ha dado beneficio
    text: (s, h) => `Llega la primavera y, con ella, Hacienda. Por lo ganado este año toca pagar ${h.taxDue()} €.`,
    options: [
      { label: 'Llevársela al gestor (+40 €)', apply: (s, h) => h.payTax(40), result: 'El gestor lo deja todo en orden en media hora.' },
      { label: 'Hacerla una misma, a lápiz', cost: { jornales: 2 }, apply: (s, h) => h.payTax(0), result: 'Una mañana entera de papeles. Pero sale bien.' },
    ],
  },

  // Rachas buenas
  {
    id: 'puente', title: 'Puente festivo', illus: 'feria', weight: 3, seasons: [0, 2], cooldown: 30,
    cond: (s, h) => s.flags.tourism && !h.stopped('tourism'),
    text: 'Viene un puente largo. Llaman preguntando si queda alguna habitación libre.',
    options: [
      { label: 'Preparar las habitaciones', cost: { jornales: 1 }, apply: (s, h) => h.mod('puente', 5), result: 'Sábanas tendidas al sol y flores en cada mesilla.' },
      { label: 'Que vengan los que vengan', apply: (s, h) => h.mod('puente', 3) },
    ],
  },
  {
    id: 'aceite_caro', title: 'Mal año en Jaén', illus: 'bellota', weight: 2, seasons: [3], cooldown: 60,
    text: 'La sequía ha dejado los olivares de Jaén a medias. El aceite se paga como nunca.',
    options: [ { label: 'Que suba', apply: (s, h) => h.mod('aceite_caro', 21), result: 'Los olivos de la dehesa valen hoy su peso en oro.' } ],
  },
  {
    id: 'feria_queso', title: 'Feria del queso y la miel', illus: 'feria', weight: 2, seasons: [0], cooldown: 60,
    cond: (s) => s.animals.ovejas > 0 || s.animals.colmenas > 0,
    text: 'La comarca celebra su feria del queso y la miel. Llegan compradores de Córdoba y de Badajoz.',
    options: [ { label: 'Aprovecharla', apply: (s, h) => h.mod('feria_queso', 10), result: 'Quesos y tarros, mejor pagados estos días.' } ],
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
    id: 'san_antonio', title: 'Fiesta de San Antonio', illus: 'vecinos', weight: 7, seasons: [1], cooldown: 45,
    cond: (s) => s.zones.ermita.unlocked,
    text: (s) => s.zones.ermita.cons >= 60
      ? 'Es el día de San Antonio. Los vecinos suben por el paseo de las adelfas con flores para la ermita, que hoy luce blanca y con la reja recién pintada.'
      : 'Es el día de San Antonio. Algunos vecinos suben con flores, pero la ermita está desconchada y la reja oxidada. Nadie dice nada, aunque se nota.',
    options: [
      { label: 'Abrir la ermita y convidar a limonada', cost: { jornales: 1, money: 10 }, apply: (s, h) => { const c = h.zoneCons('ermita'); h.addRep(c >= 60 ? 4 : 1); h.addMood(6); if (c < 60) h.log('Alguien deja dicho que el año que viene trae cal.'); }, result: 'Flores, limonada y conversación bajo la mimosa hasta que cae el sol.' },
      { label: 'Poner unas flores y seguir trabajando', effects: { mood: 2 }, result: 'Un ramo de adelfas a los pies del santo. Que encuentre lo que haga falta.' },
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
    id: 'inspeccion', title: 'Inspección', illus: 'inspector', weight: 2, crisis: true, cooldown: 30, minDay: 10,
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
