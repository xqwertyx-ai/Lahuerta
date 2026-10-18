// Textos sueltos: introducción, regalos del gato, postales, la finca dormida, consejos.

export const INTRO = [
  'Ojuelos Bajos, una aldea de Fuente Obejuna. Dehesa, encinas y granito.',
  'La finca ha pasado de mano en mano dentro de la familia. Ahora es tuya, y está cansada.',
  'Nadie recuerda ya quién fue el pianista que le dio nombre.',
  'Cuídala sin prisa. Lo que se descuida se borra del papel; lo que se restaura vuelve a tener color.',
];

export const CAT_NAME = 'el gato';

// Regalos del gato. item: objeto del misterio (solo si no se tiene). effects: como en los eventos.
export const CAT_GIFTS = [
  { text: 'El gato deja a tus pies una lagartija, muy orgulloso. Está viva y se va corriendo.', effects: { mood: 2 } },
  { text: 'El gato trae una pluma de abubilla y la deja sobre el cuaderno.', effects: { mood: 3 } },
  { text: 'El gato aparece con un botón de nácar en la boca. Parece de una camisa de domingo.', effects: { mood: 2 } },
  { text: 'El gato te lleva, maullando, hasta un nido de gallina escondido bajo la yuca.', effects: { products: { huevos: 1 } } },
  { text: 'El gato trae algo de papel entre los dientes y lo deja a tus pies con mucha ceremonia.', item: 'partitura5', weight: 3 },
  { text: 'El gato ha encontrado una moneda antigua de cinco céntimos debajo del piano.', effects: { money: 2, mood: 2 } },
];

export const POSTCARDS = [
  '«Echo de menos el silencio de la dehesa. Saluda al gato de mi parte.» — {name}, desde {origin}',
  '«He contado la finca a todos mis amigos. Alguno irá pronto.» — {name}, desde {origin}',
  '«En el tren me acordé de los atardeceres. Gracias por todo.» — {name}, desde {origin}',
  '«Aquí llueve. Allí seguro que huele a encina.» — {name}, desde {origin}',
];

export const SLEEP = {
  ruin: {
    title: 'La finca se duerme',
    lines: [
      'Las deudas han crecido como las zarzas en el muro.',
      'Un día cierras la cancela con la llave grande y bajas al pueblo.',
      'La cal se va apagando. El paseo de las adelfas se cierra sobre sí mismo.',
      'Pero la finca no muere: duerme. Y el papel guarda la forma de las cosas.',
    ],
  },
  abandon: {
    title: 'La finca se duerme',
    lines: [
      'Una estación entera de abandono. La tinta se ha ido borrando del cuaderno.',
      'Ya casi no se distingue dónde estaba la huerta ni dónde acababa el muro.',
      'El gato sigue durmiendo al sol en el patio, como si nada.',
      'Las fincas, como las melodías, se pueden retomar donde se dejaron.',
    ],
  },
  retry: 'Retomar desde el inicio de la estación',
  restart: 'Empezar un cuaderno nuevo',
};

export const TIPS = [
  'Toca una zona del plano para cuidarla. Lo descuidado se destiñe.',
  'Los voluntarios pueden encargarse de una zona: la cuidan solos cada día.',
  'La maleza alta acelera el deterioro y aumenta el riesgo de incendio en verano.',
  'El mercado de Fuente Obejuna abre una vez por semana; la cooperativa, siempre.',
  'Restaurar una zona por encima de 70 suele desenterrar un recuerdo.',
  'Con el cortijo cuidado y algo de reputación, podrás abrir habitaciones a huéspedes.',
];
