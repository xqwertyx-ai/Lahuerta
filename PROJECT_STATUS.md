# LA HUERTA DEL PIANISTA — Estado del proyecto

_Última actualización: 19 oct 2026 · v0.4_

## Resumen
Gestor de recursos casual y poético para navegador (móvil y escritorio). Cuidas una finca familiar real en Ojuelos Bajos (Fuente Obejuna, Córdoba): lo descuidado se destiñe y se borra del cuaderno; lo restaurado vuelve a entintarse y gana color. Voluntarios, producción de la dehesa, mercado, agroturismo, eventos y el misterio del pianista, con música generativa de piano. JavaScript con módulos ES, sin dependencias.

## ✅ COMPLETADO
- ✅ v0.4.1 — **Banda sonora grabada** del autor (`audio/bso.mp3`, piano, 3:35 en bucle) como música de fondo por el bus de «Música»; se aparta cuando suena el tema del pianista y se pausa con la página oculta. En Ajustes se puede volver al piano generativo. El archivo va aparte del HTML (no lo engorda)
- ✅ v0.4 — **Contratiempos y economía con tensión** (`src/data/hardships.js`, `src/sim/hardship.js`):
  - 13 **averías** que paran su zona (no produce ni admite cuidados) y a veces más cosas: tejado hundido (una sola cama, sin huéspedes), brecha en el muro y dehesa quemada (sin montanera), bancales arrasados, bomba del pozo / tubería / grieta de la alberca (sin agua), varroa, gallinero, espadaña, piano con humedad (sin conciertos), procesionaria, camino hundido (sin huéspedes) y furgoneta (sin mercado). Se reparan con un proyecto de varios jornales (encargable a un voluntario) o pagando a un profesional; sin atender, van a peor
  - Los eventos de contratiempo avisan antes: prevenir cuesta jornales hoy; esperar rompe algo. 23 contratiempos nuevos o endurecidos (temporal, helada negra, rayo, pedrisco, pozo, varroa, zorro, niebla, procesionaria, camino, furgoneta, robo, gripe…), más frecuentes cada año
  - **Avisos económicos** temporales: la cooperativa paga poco, mercado flojo, luz cara (o placas solares), carretera cortada, lengua azul, alerta porcina, pienso caro, reseñas de una estrella; y rachas buenas (puente festivo, aceite caro, feria del queso)
  - **Gastos fijos**: recibos cada lunes que crecen con la finca, contribución y seguro cada verano, declaración de la renta cada primavera sobre el beneficio; **préstamo** de la cooperativa en números rojos
  - **Guardar para el invierno**: leña para la chimenea (sin ella, frío: baja el ánimo, la alegría y la fama), heno (nueva tarea de siega en la dehesa) o pienso para los animales en verano e invierno (sin comida dejan de producir y hay que vender alguno), comida comprada y leña más caras en invierno
  - **Los eventos que piden jornales llegan al amanecer**, con el día entero por delante
  - Más reto: lo impecable cuesta más mantenerlo, la finca envejece cada año, el ánimo y la alegría de los voluntarios vuelven a su punto medio, la reputación no se queda en 100 sola, el agroturismo deja menos margen
  - Pestaña **Cuentas** (lo roto, avisos, reservas con días que aguantan, próximos pagos), chip de avisos en el HUD, tachones rojos en el plano y **dificultad** tranquila / normal / dura en Ajustes
- ✅ v0.3 — **El pozo y el emparrado** (agua dulce para la huerta y la casa, uvas y vendimia), **los bancos de los nietos** en el camino a la ermita (encalar, reponer teselas, repasar nombres; los nombres se escriben en `GRANDCHILDREN` de `src/data/family.js`), **huerta por bancales** (3 bancales: se siembra lo de cada estación —lechugas, habas, tomates, pimientos, calabazas, coles, ajos—, crece con agua y cuidado, se recoge y, si no, se pasa), **cocina del cortijo** (conservas, mermelada, matanza con jamón y embutido), **lo fresco se estropea**, el bosquete da **leña y setas**, desbroce del colmenar, **ratos libres** (acuarela, comidas, paseos, música, estrellas, baño, mosaico, candela, cine de verano) y la despensa enseña todos los productos y de dónde salen. Zoom solo con los dedos (sin botones)
- ✅ v0.2 — El «almacén de la puerta roja» es en realidad la **ermita de San Antonio**: nuevo nombre, espadaña con cruz, tareas propias (barrer y poner flores, encalar, pintar la reja, arreglar la espadaña), evento «Fiesta de San Antonio» en verano y, como el santo encuentra lo perdido, con la ermita restaurada aparecen recuerdos con más facilidad. Reparar herramientas pasa al cortijo y el carbón a la dehesa. Las partidas guardadas se convierten solas
- ✅ Repositorio propio: github.com/xqwertyx-ai/Lahuerta
- ✅ Fase 1 — Arquitectura (`src/engine`, `sim`, `data`, `art`, `audio`, `ui`, `scenes`→`ui/screens`, `save`, `tests`, `tools`) y bucle de tiempo: 1 día = 2 min reales, pausa y x1/x2/x3, el tiempo se detiene con un evento abierto o el cuaderno (opcional)
- ✅ Fase 2 — Trazo a mano propio (`art/ink.js`): líneas con temblor y presión, doble trazo, rayado, punteado, curvas, aguadas de acuarela con borde oscuro y granulado. Papel generado (`art/paper.js`): moteado, grano, fibras, aros de café, humedad, óxido, bordes gastados. Plano de la finca con las 12 zonas dibujadas a partir de las fotos (`art/sketches.js`): cortijo encalado con azulejo azul, reja y macetas, farola; patio de cantos rodados con franjas de granito, fuente de azulejo, león y figura sentada, lavanda; paseo de adelfas blancas y yucas; ermita de San Antonio, blanca, con reja roja, espadaña y mimosa; huerta con carretilla amarilla; bosquete de eucaliptos, mimosa, higueras y parra; dehesa de encinas con berrocales, olivos y el gran pino; muros de piedra seca; alberca con juncos; colmenar de corchos; corral con la rueda de carro roja bajo la yuca; cenador con el piano. Pueblo blanco en lo alto, arroyo, caminos, rosa de los vientos y cartela
- ✅ Metáfora visual: cada zona tiene capa de tinta y de acuarela; con poca conservación la acuarela se apaga y vira a sepia, la tinta se destiñe y aparecen frotones de goma; la maleza invade con matojos. Las zonas sin recuperar son un rastro de lápiz con contorno discontinuo que se va marcando mientras se recuperan
- ✅ Día y noche (amanecer dorado, noche azul tinta con luces en ventanas, farola, pueblo, estrellas y luciérnagas) y estaciones en el papel y las aguadas (verano pajizo, invierno gris escarcha, otoño ocre). Lluvia, niebla, helada, viento con hojas, calor, tormenta con relámpagos
- ✅ El gato blanco con manchas atigradas: pasea, te sigue a la zona que tocas, duerme al sol del patio y de noche en la puerta; si lo tocas, maúlla y ronronea. Gallinas, ovejas, cerdos de montanera, abejas, ciervos al atardecer, voluntarios trabajando y humo de chimenea
- ✅ Fase 3 — Zonas con conservación (0-100), maleza que acelera el deterioro, clima y estación; rendimiento decreciente (lo muy cuidado sube poco). Recuperar una zona borrada es un proyecto de varios jornales que se puede encargar a un voluntario
- ✅ Fase 4 — Recursos: dinero, jornales diarios, ánimo, reputación, materiales (leña, piedra, cal, herramientas) y productos. 34 tareas de mantenimiento por datos (encalar, tejas, desbrozar, podar encinas, muros, alberca, colmenas, esquileo…), con temporada, tiempo, oficio y costes
- ✅ Fase 5 — Producción por estación (hortalizas, higos, uvas, bellota, aceite, lavanda, miel, huevos, queso, lana, leña, carbón, gurumelos tras la lluvia) y montanera de cerdo ibérico. Mercado de Fuente Obejuna (jueves), cooperativa (siempre) y cestas a huéspedes; precios por estación, ruido diario y saturación que se recupera
- ✅ Fase 6 — 12 voluntarios con nombre, origen, oficio, rasgo, frases e historia; llegan si hay cama (según el cortijo), comen de la huerta o se compra comida, se encariñan, piden quedarse y, si se van contentos, recomiendan la finca. Se les encarga una zona y la cuidan solos. Jornaleros del pueblo a sueldo
- ✅ Fase 7 — 28 eventos por datos con ilustración a boceto propia: helada, ola de calor, tormenta, sequía, gota fría, vendaval, incendio (según maleza, calor y agua), jabalíes, pulgón, buen año de bellota, enjambre, ciervos al atardecer, el gato trae algo, romería, feria, «todos a una», fiesta de San Antonio, subvención, inspección, herencia, influencer, el forastero que pregunta por el pianista, la vecina, el cartero, «¿me puedo quedar?» y conciertos
- ✅ Fase 8 — Agroturismo: se abre con el cortijo cuidado y algo de fama; 3 habitaciones y glamping, talleres de queso, miel, pan y acuarela (con la caja de Transi), ruta por la dehesa, estrellas y conciertos al atardecer con el piano restaurado
- ✅ Fase 9 — Familia (Manuel, Feliciano y Transi, Elisa y Loli) en recuerdos: 20 objetos con icono propio, hilos por familiar, 5 hipótesis sobre el pianista que suben o se tachan con las pistas, y revelación final provisional y ambigua en `src/data/story.js`. Incorporado el dato real: los cuadros los firma Transi
- ✅ Fase 10 — Música generativa con Web Audio: piano sintetizado (parciales, martillo, reverb generada) por estación y hora, con mucho espacio; capa lo-fi opcional (vinilo, bombo y escobilla amortiguados, cinta desafinada); el tema del pianista (24 notas, 3/4) que gana notas con cada partitura y suena entero en los conciertos y al resolver el misterio. Ambiente: viento, lluvia, truenos, chicharras, grillos, fuente, pájaros, ovejas, cencerros, gallinas y el gato. Efectos de papel, pluma, sello, monedas y herramientas. Buses de música, ambiente y efectos con volumen. Desbloqueo en iOS (incluido el interruptor de silencio, con un WAV de silencio real) y Android
- ✅ Fase 11 — Interfaz de cuaderno: portada ilustrada, introducción, HUD de papel rasgado, nota con clip para cada zona, cuaderno con pestañas (diario, despensa y mercado, gente, recuerdos con pentagrama, huéspedes, álbum de hitos, ajustes), diálogos de eventos, notas emergentes, consejos iniciales. Tipografías de Google Fonts (Caveat y Patrick Hand) alojadas con el juego
- ✅ Fase 12 — Guardado automático (cada día de juego, cada 20 s y al salir), copia del inicio de la estación para retomar si «la finca se duerme», exportar a archivo, copiar al portapapeles e importar
- ✅ Derrota suave: ruina (tres semanas seguidas por debajo de −150 €) o abandono (conservación media < 22 durante una estación) → «la finca se duerme», página poética, retomar desde el inicio de la estación
- ✅ 17 hitos en el álbum y modo infinito
- ✅ Fase 13 — Móvil (vertical y horizontal, botones ≥ 44 px, gestos de arrastre y pellizco, zonas seguras) y PWA (manifiesto, iconos dibujados con el propio motor, service worker)
- ✅ Fase 14 — Balance con `node tools/balance.mjs [años] [partidas]` y jugadores automáticos (cuidadoso, perezoso, ausente)
- ✅ Fase 15 — Optimización: capas cacheadas (fondo, zonas) que solo se recomponen al cambiar, lienzo limitado a 2×, caché según el zoom; 60 FPS en escritorio y ~45 FPS en móvil con la CPU ×4 más lenta y sin GPU
- ✅ Fase 16 — Build de un solo archivo `dist/index.html` (~590 KB, con tipografías) + manifiesto, service worker e iconos en `dist/`
- ✅ Tests: 46 unitarios de la simulación (`npm test`) y e2e con Playwright en fuente y build, escritorio y móvil (`python3 tests/e2e/smoke.py`, 82 comprobaciones)

## 🟡 EN PROGRESO
- 🟡 Balance con personas (v0.4): el jugador cuidadoso pasa por números rojos en el primer y segundo año, abre el agroturismo hacia el año 2 y acaba el tercero con ~1.000-2.000 € (antes ~5.700); el perezoso se duerme en ~3 de cada 10 partidas; el ausente, hacia el día 25. Falta probarlo jugando

## 🔴 PENDIENTE
- 🔴 Textos de la familia y la verdad del pianista: provisionales a propósito (`src/data/family.js`, `src/data/items.js`, `src/data/story.js`). Esperan recuerdos reales del autor
- 🔴 Activar GitHub Pages en el repositorio (Settings → Pages → rama main, carpeta /docs o raíz)
- 🔴 Medir en móviles reales de gama media

## 🐛 BUGS CONOCIDOS
- 🐛 Ninguno abierto. Corregidos: objetos de zonas iniciales que nunca salían, demasiados recuerdos el primer día, la columna del margen del cuaderno empujaba el pentagrama, juntas visibles en el papel de la interfaz

## Próxima tarea
Jugar unas cuantas estaciones con el autor → ajustar ritmo y precios → escribir los recuerdos reales.

## Decisiones técnicas
- Simulación pura sin DOM (`src/sim`), determinista con semilla: se prueba en Node y se simula el balance de años en menos de un segundo.
- Todo el contenido y los números en `src/data` (zonas, tareas, productos, eventos, voluntarios, familia, objetos, historia, hitos, agroturismo, balance).
- Interfaz en DOM (texto legible, accesible, botones grandes) sobre un único lienzo para el plano; el arte se dibuja una vez en capas y solo se recompone al cambiar (cubos de 4 puntos de conservación).
- Tipografías incluidas en `fonts/` (OFL) en vez de pedirlas a Google en cada visita: el juego funciona sin conexión.
- Audio 100 % generado en el navegador; nada de archivos.
- Empaquetador propio (`tools/build.mjs`) para el archivo único; sin pasos de compilación en desarrollo.

## Arquitectura
```
index.html, manifest.webmanifest, sw.js, icons/, fonts/
src/main.js                 arranque
src/engine/game.js          bucle, velocidades, señales, guardado, audio, toques
src/engine/camera.js        cámara, arrastre, pellizco, rueda
src/sim/                    simulación pura: state, sim (horas y amanecer), calendar, farm (zonas, tareas,
                            recuperación), economy (producción, montanera, agua, mercado), people (voluntarios,
                            jornaleros, comida), tourism, mystery, events, effects, rng
src/data/                   balance, seasons, zones, products, volunteers, events, family, items, story,
                            tourism, milestones, texts
src/art/                    noise, ink (trazo y acuarela), paper, palette, sketches (la finca), map (plano y
                            capas), cat, critters, illus (eventos, recuerdos, portada)
src/audio/                  audio (motor, buses, desbloqueo), music (piano generativo, lo-fi, tema), ambience
                            (ambiente y efectos)
src/ui/                     style.css, dom, hud, zonePanel, notebook, screens, toast, ui
src/save/save.js            guardado, estación, exportar/importar, ajustes
tests/unit/                 node --test
tests/e2e/smoke.py          Playwright
tools/                      serve.mjs, build.mjs, balance.mjs, icons.py
docs/AUTOR.md               cómo editar la historia, la familia y el contenido
```
