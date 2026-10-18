// ✎ ARCHIVO DEL AUTOR — El misterio del pianista.
//
// Aquí está la verdad del juego. Ahora mismo contiene un final PROVISIONAL, ambiguo a
// propósito, para que el autor escriba el definitivo cuando quiera. Nada de lo que hay
// aquí son hechos reales salvo uno: los cuadros de la casa los firma Transi.
//
// Cómo funciona:
//  · Cada objeto encontrado suma o resta peso a las hipótesis (campo hyp en items.js).
//  · El cuaderno muestra las hipótesis ordenadas; las que bajan de 0 aparecen tachadas.
//  · Cuando se cumplen las condiciones de `revelation.requires`, ocurre la revelación:
//    suena el tema completo y aparece la página `revelation.pages`.

export const HYPOTHESES = [
  { id: 'musico', title: 'Un músico de paso', text: 'Alguien llegó con un piano o a buscar uno, tocó unos veranos y se fue. El nombre se quedó.', start: 1 },
  { id: 'feliciano', title: 'El abuelo Feliciano', text: 'Silbaba siempre la misma melodía. ¿Y si de joven la tocaba?', start: 1 },
  { id: 'transi', title: 'La abuela Transi', text: 'Pintaba el atardecer. Quizá también lo escribía en pentagramas.', start: 0 },
  { id: 'mueble', title: 'Nadie: era el piano', text: 'Un piano que nadie sabía tocar dio nombre a la finca, como un apodo.', start: 1 },
  { id: 'manuel', title: 'El nombre es más antiguo', text: 'Puede que la finca ya se llamara así cuando llegó el bisabuelo Manuel.', start: 0 },
];

// El tema del pianista: [nota MIDI, duración en tiempos]. Compás de 3/4, re menor.
// Empieza con THEME_START notas conocidas (las que silba todo el mundo en el pueblo);
// cada partitura añade las notas indicadas en su campo score.
export const THEME = [
  [69, 1], [74, 1], [76, 1], [77, 2], [76, 1],
  [74, 1], [72, 1], [69, 1], [67, 3],
  [65, 1], [67, 1], [69, 1], [72, 2], [70, 1],
  [69, 1], [67, 1], [65, 1], [64, 3],
  [62, 1], [65, 1], [69, 1], [74, 2], [73, 1], [74, 3],
];
export const THEME_START = 4;
export const THEME_TEMPO = 66; // negras por minuto

export const REVELATION = {
  requires: {
    items: ['partitura1', 'partitura2', 'partitura3', 'partitura4', 'partitura5', 'partitura6', 'diario', 'firma'],
    zones: { piano: 80 },
    minDay: 100,   // no antes del día 100 (casi dos años): el misterio se cuece despacio
  },
  title: 'El tema completo',
  pages: [
    'Esta tarde, con todas las hojas sobre el atril, el tema ha sonado entero por primera vez.',
    'Es la melodía que silbaba el abuelo. La que estaba dibujada como pájaros en la caja de pinturas de Transi. La que Elisa echaba de menos en sus cartas.',
    'En el diario siempre se escribe en plural: «hoy ha sonado bien», «no tocamos». Quizá el pianista nunca fue uno solo.',
    'Quizá fue la costumbre de la casa: sentarse al atardecer, cuando bajan los ciervos, y dejar que alguien —quien fuera— tocara.',
    'La finca sigue sin decirte un nombre. Pero esta tarde, mientras sonaba, el gato se ha quedado quieto. Y eso ya es mucho decir.',
  ],
  // ✎ Escribe aquí el nombre de verdad si algún día se descubre. Si se deja en null,
  //   el final se queda ambiguo.
  truth: null,
};

// Frases sueltas del diario del jugador, por momento del día. Se eligen al azar.
export const DIARY_LINES = {
  amanecer: ['Amanece dorado sobre la dehesa.', 'El gallo se adelanta, como siempre.', 'Niebla en la alberca. El pino asoma como un faro.'],
  atardecer: ['El sol se esconde detrás de los eucaliptos.', 'Hora de los ciervos. Hora del piano, decía alguien.', 'El pueblo se enciende allá arriba, ventana a ventana.'],
  noche: ['Noche azul tinta. Grillos.', 'Se oye la fuente, aunque no se la vea.', 'El gato ha vuelto a dormir en la ventana.'],
};
