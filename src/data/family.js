// La familia de la finca. Siempre como recuerdo: nunca aparecen vivos en pantalla.
//
// ✎ AUTOR: los textos son provisionales y deliberadamente cotidianos. Cámbialos por
//   recuerdos reales cuando quieras. intro sale en el cuaderno; complete, en el diario
//   cuando se encuentran todos los objetos de su hilo (ver items.js).
//   Hecho real incorporado: los cuadros de la casa los firma Transi.

export const FAMILY = [
  {
    id: 'manuel', name: 'El bisabuelo Manuel', relation: 'bisabuelo',
    intro: 'El primero que llamó «casa» a este sitio.',
    complete: 'Manuel guardaba las cosas importantes bajo llave, y la llave bajo una piedra. Dicen que plantó el gran pino para saber volver desde el pueblo.',
  },
  {
    id: 'feliciano', name: 'El abuelo Feliciano', relation: 'abuelo',
    intro: 'Manos de cal y de tierra. Silbaba mientras trabajaba.',
    complete: 'Feliciano levantó la fuente azulejo a azulejo y apuntaba en sus cuentas, entre sacos y jornales, las cuerdas del piano. Silbaba siempre la misma melodía.',
  },
  {
    id: 'transi', name: 'La abuela Transi', relation: 'abuela',
    intro: 'Pintaba. Los cuadros de la casa llevan su firma.',
    complete: 'Transi pintó el pueblo sobre la dehesa y los ciervos junto al agua, siempre a la misma hora. En los márgenes de sus bocetos dejaba pentagramas a medio hacer.',
  },
  {
    id: 'elisa', name: 'La tía Elisa', relation: 'tía abuela',
    intro: 'Hermana de Transi. La que se acordaba de todos los cumpleaños.',
    complete: 'Elisa escribía cartas largas y bordaba corcheas en los pañuelos. Desde lejos, lo que más echaba de menos era el piano de las tardes.',
  },
  {
    id: 'loli', name: 'La tía Loli', relation: 'tía abuela',
    intro: 'Hermana de Transi. Membrillo, risas y canciones en la cocina.',
    complete: 'Loli removía el membrillo con música, que sale mejor. En la foto de las tres hermanas, todas miran hacia el cenador.',
  },
];

export const FAMILY_BY_ID = Object.fromEntries(FAMILY.map((f) => [f.id, f]));
