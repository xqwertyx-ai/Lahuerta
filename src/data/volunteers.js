// Voluntarios que llegan a la finca a cambio de cama y comida.
// skill: oficio (mejora las tareas con ese skill y desbloquea algunas zonas)
// trait: rasgo con un pequeño efecto (jornales extra, ánimo diario, reputación al marcharse…)
// cond: condición para que pueda llegar (opcional)
// g: 'f' o 'm' (para concordar los adjetivos del diario)

export const SKILLS = {
  pintura: 'pintura y cal',
  carpinteria: 'carpintería',
  huerta: 'huerta',
  albanileria: 'piedra y albañilería',
  apicultura: 'apicultura',
  ganado: 'ganado',
  monte: 'monte y poda',
  cocina: 'cocina',
  afinacion: 'afinación de pianos',
  agua: 'agua y riego',
  web: 'fotos y redes',
  musica: 'música',
};

export const TRAITS = {
  madrugadora: { name: 'Madrugadora', desc: '+1 jornal al día', jornales: 1 },
  alegre: { name: 'Alegre', desc: 'Sube el ánimo de la casa', mood: 0.8 },
  cuidadoso: { name: 'Cuidadoso', desc: 'Lo que toca dura más', decay: 0.85 },
  contador: { name: 'Cuentacuentos', desc: 'Atrae visitas al marcharse', repOnLeave: 4 },
  tragona: { name: 'De buen comer', desc: 'Come por dos', food: 2 },
  silencioso: { name: 'Silencioso', desc: 'Trabaja sin que se note', jornales: 0.5 },
  curiosa: { name: 'Curiosa', desc: 'Encuentra cosas olvidadas', findBonus: 0.08 },
  nostalgico: { name: 'Nostálgico', desc: 'Le gustan las historias de la casa', clueBonus: 1 },
};

export const VOLUNTEERS = [
  {
    id: 'lucia', g: 'f', name: 'Lucía', origin: 'Valencia', skill: 'pintura', trait: 'madrugadora',
    lines: ['Esta cal tiene memoria, ¿lo notas?', 'He dibujado al gato tres veces. Nunca se queda quieto.', 'La luz de aquí es otra cosa.'],
    story: 'Ilustradora. Dejó un estudio sin ventanas en Ruzafa para pintar con luz de verdad. Lleva una libreta llena de puertas.',
  },
  {
    id: 'jonas', g: 'm', name: 'Jonas', origin: 'Hamburgo', skill: 'carpinteria', trait: 'silencioso',
    lines: ['Holz ist geduldig. La madera tiene paciencia.', 'Esta viga aguanta otros cien años.', '¿Aquí siempre cantan tanto los pájaros?'],
    story: 'Carpintero de barcos. Quería ver un sitio donde la madera no huela a sal.',
  },
  {
    id: 'amara', g: 'f', name: 'Amara', origin: 'Dakar', skill: 'huerta', trait: 'alegre',
    lines: ['La tierra roja es la más agradecida.', 'Si le hablas al tomate, crece.', 'Mañana sembramos con la luna.'],
    story: 'Agrónoma. Sabe de semillas lo que otros saben de fútbol. Canta cuando riega.',
  },
  {
    id: 'tomas', g: 'm', name: 'Tomás', origin: 'Pozoblanco', skill: 'albanileria', trait: 'cuidadoso',
    lines: ['Piedra grande abajo, chica arriba. Y paciencia.', 'Mi padre levantaba muros como estos.', 'Esto lo hacía la gente de antes sin una gota de cemento.'],
    story: 'Albañil jubilado de un pueblo vecino. Viene «a echar una mano» y se queda a comer siempre.',
    cond: { minDay: 3 },
  },
  {
    id: 'mei', g: 'f', name: 'Mei', origin: 'Taipéi', skill: 'apicultura', trait: 'curiosa',
    lines: ['Las abejas saben quién está nervioso.', 'Huele a romero: buena miel este año.', 'He encontrado algo detrás de un corcho…'],
    story: 'Apicultora urbana en una azotea de doce pisos. Quería ver abejas que vuelan sobre encinas.',
    cond: { minDay: 6 },
  },
  {
    id: 'ros', g: 'f', name: 'Ros', origin: 'Cork', skill: 'ganado', trait: 'contador',
    lines: ['Sheep are the same everywhere. Testarudas.', 'Esta oveja se llama Dolores. Lo ha decidido ella.', 'Hay un queso que me sale de lujo.'],
    story: 'Pastora desde los nueve años. Cuenta historias de hadas irlandesas a las gallinas.',
    cond: { minDay: 5 },
  },
  {
    id: 'iker', g: 'm', name: 'Iker', origin: 'Bilbao', skill: 'monte', trait: 'madrugadora',
    lines: ['Monte limpio, monte vivo.', 'Esta encina tiene trescientos años, fijo.', 'Cortafuegos hecho. Ya puedo dormir tranquilo.'],
    story: 'Bombero forestal en excedencia. Sabe leer el viento y desbrozar como quien peina.',
  },
  {
    id: 'valentina', g: 'f', name: 'Valentina', origin: 'Rosario', skill: 'cocina', trait: 'tragona',
    lines: ['Con estos huevos hago una tortilla que te mueres.', '¿Quién quiere mate?', 'La comida es lo que hace que la gente vuelva.'],
    story: 'Cocinera. Viaja con un cuchillo, un termo y un cuaderno de recetas de abuelas de medio mundo.',
  },
  {
    id: 'emile', g: 'm', name: 'Émile', origin: 'Lyon', skill: 'afinacion', trait: 'nostalgico',
    lines: ['Un piano olvidado no está muerto, está dormido.', 'Esta tecla dice «la», pero quiere decir otra cosa.', 'Alguien tocaba aquí. Se nota en el desgaste del pedal.'],
    story: 'Afinador de pianos. Recorre pueblos buscando instrumentos que nadie escucha. Oyó hablar de «la huerta del pianista».',
    cond: { minDay: 12, zoneUnlocked: 'piano' },
  },
  {
    id: 'nadia', g: 'f', name: 'Nadia', origin: 'Fez', skill: 'agua', trait: 'cuidadoso',
    lines: ['El agua siempre encuentra el camino. Hay que dárselo.', 'En Fez las fuentes cantan. Esta también puede.', 'Riego por la tarde, que el sol se lo bebe.'],
    story: 'Ingeniera hidráulica. Le fascinan las acequias viejas y las fuentes de azulejo.',
    cond: { minDay: 4 },
  },
  {
    id: 'sven', g: 'm', name: 'Sven', origin: 'Gotemburgo', skill: 'web', trait: 'contador',
    lines: ['Mira qué foto del gato. Ya tiene seguidores.', 'Sin wifi también se vive. Más o menos.', 'Este atardecer no cabe en una pantalla.'],
    story: 'Programador quemado. Ha venido a desconectar, aunque haga fotos de todo.',
    cond: { minDay: 8 },
  },
  {
    id: 'carmen', g: 'f', name: 'Carmen', origin: 'Madrid', skill: 'musica', trait: 'nostalgico',
    lines: ['Esa melodía que tarareas… ¿de dónde la sacaste?', 'Fui maestra de música cuarenta años.', 'Una partitura rota sigue siendo una carta.'],
    story: 'Maestra de música jubilada. Llegó por un anuncio y por una corazonada.',
    cond: { minDay: 10 },
  },
];

export const VOLUNTEER_BY_ID = Object.fromEntries(VOLUNTEERS.map((v) => [v.id, v]));
