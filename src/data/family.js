// La familia de la finca. Siempre como recuerdo: nunca aparecen vivos en pantalla.
//
// ✎ AUTOR: los textos son provisionales y deliberadamente cotidianos. Cámbialos por
//   recuerdos reales cuando quieras; el juego solo usa los campos id, name y relation.
//   Hecho real incorporado: los cuadros de la casa los firma Transi.

export const FAMILY = [
  {
    id: 'manuel', name: 'El bisabuelo Manuel', relation: 'bisabuelo',
    intro: 'El primero que llamó «casa» a este sitio.',
    milestones: [
      'Alguien levantó estos muros cuando aquí solo había encinas.',
      'Manuel guardaba las cosas importantes bajo llave. Y la llave, bajo una piedra.',
      'Dicen que plantó el gran pino para saber volver desde el pueblo.',
    ],
  },
  {
    id: 'feliciano', name: 'El abuelo Feliciano', relation: 'abuelo',
    intro: 'Manos de cal y de tierra. Silbaba mientras trabajaba.',
    milestones: [
      'Las cuentas de Feliciano: sacos, jornales y, a veces, una nota al margen.',
      'La fuente del patio la empezó él, azulejo a azulejo.',
      'Silbaba siempre la misma melodía. Nadie sabía de dónde la había sacado.',
    ],
  },
  {
    id: 'transi', name: 'La abuela Transi', relation: 'abuela',
    intro: 'Pintaba. Los cuadros de la casa llevan su firma.',
    milestones: [
      'Los dos óleos de la casa los firma Transi: el pueblo sobre la dehesa y los ciervos al atardecer.',
      'En su caja de pinturas hay más que pinturas.',
      'Pintaba la alberca al atardecer, con los ciervos. Siempre a la misma hora.',
    ],
  },
  {
    id: 'elisa', name: 'La tía Elisa', relation: 'tía abuela',
    intro: 'Hermana de Transi. La que se acordaba de todos los cumpleaños.',
    milestones: [
      'Elisa escribía cartas largas aunque viviera a dos pasos.',
      'En sus cartas siempre hay una pregunta sin respuesta.',
    ],
  },
  {
    id: 'loli', name: 'La tía Loli', relation: 'tía abuela',
    intro: 'Hermana de Transi. Membrillo, risas y canciones en la cocina.',
    milestones: [
      'La receta de membrillo de Loli lleva una nota: «con música sale mejor».',
      'Tres hermanas en una foto, de espaldas al atardecer.',
    ],
  },
];

export const FAMILY_BY_ID = Object.fromEntries(FAMILY.map((f) => [f.id, f]));
