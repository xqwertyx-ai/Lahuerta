# Guía del autor

Todo el contenido del juego está en `src/data/`. No hace falta tocar el código para cambiar textos, números o la historia.

## La verdad del pianista — `src/data/story.js`
- `HYPOTHESES`: las cinco hipótesis que aparecen en el cuaderno. Puedes cambiar sus textos o añadir más (cada objeto suma o resta peso con su campo `hyp`).
- `THEME`: la melodía del pianista (nota MIDI y duración en tiempos, compás de 3/4). `THEME_START` son las notas que ya se conocen al empezar.
- `REVELATION`: cuándo ocurre (objetos necesarios, piano a 80, día mínimo) y las páginas que se leen. Si algún día se descubre quién fue, escribe su nombre en `truth` y cambia las páginas.

## La familia — `src/data/family.js`
Manuel, Feliciano, Transi, Elisa y Loli. `intro` sale en el cuaderno y `complete` en el diario cuando se encuentran todos los objetos de su hilo. Los textos son provisionales y cotidianos a propósito: sustitúyelos por recuerdos reales. El único hecho real incorporado es que los cuadros los firma Transi.

## Los recuerdos — `src/data/items.js`
Cada objeto tiene zona, momento (`unlock` al recuperar la zona, `restore` al pasar de 70, `cons` al llegar a `at`, `task` mientras se trabaja, `cat` lo trae el gato, `event` por un evento), un día mínimo opcional (`minDay`), su texto, a qué hilo pertenece y cuánto apoya cada hipótesis. Las partituras llevan `score` (cuántas notas del tema añaden; entre todas deben completar las 24).

## Eventos — `src/data/events.js`
Probabilidad (`weight`), estaciones, condición, opciones con coste y consecuencias. Para un evento nuevo basta copiar uno parecido. Las ilustraciones disponibles están en `src/art/illus.js` (`MOTIFS`).

## Voluntarios — `src/data/volunteers.js`
Nombre, origen, oficio, rasgo, frases, historia y cuándo pueden llegar. Si alguno de verdad pasó por la finca, ¡ponlo!

## Números — `src/data/balance.js`
Duración del día, días por estación, dinero inicial, deterioro, maleza, precios, llegadas, agroturismo, umbrales de la «finca dormida». Después de cambiar algo: `node tools/balance.mjs 3 6` simula tres años con jugadores automáticos.

## Comandos
- `npm start` → servidor en http://localhost:8080
- `npm test` → tests de la simulación
- `npm run build` → `dist/index.html` de un solo archivo (más manifiesto, iconos y service worker para instalarlo)
- `python3 tests/e2e/smoke.py` → prueba completa en Chromium (fuente y build, escritorio y móvil)
- `python3 tools/icons.py` → vuelve a dibujar los iconos
