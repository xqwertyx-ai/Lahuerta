import test from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../../src/sim/index.js';
import { ZONES } from '../../src/data/zones.js';
import { EVENTS } from '../../src/data/events.js';
import { ITEMS } from '../../src/data/items.js';
import { THEME, THEME_START } from '../../src/data/story.js';

const fresh = (seed = 7, o) => S.createState(seed, o);

test('el tiempo avanza por horas y el día cambia al amanecer', () => {
  const s = fresh();
  assert.equal(s.day, 1);
  assert.equal(s.hour, 7);
  S.advance(s, 22);           // 7:00 → 5:00 del día siguiente
  assert.equal(s.day, 1);
  S.advance(s, 1);            // 6:00 → amanece
  assert.equal(s.day, 2);
  assert.equal(Math.round(s.hour), 6);
});

test('un día dura dos minutos reales a x1', () => {
  assert.ok(Math.abs(S.HOURS_PER_SECOND * 120 - 24) < 1e-9);
});

test('un evento abierto detiene el tiempo', () => {
  const s = fresh();
  s.eventQueue.push('ciervos');
  const h = s.hour;
  S.advance(s, 5);
  assert.equal(s.hour, h);
  S.resolveEvent(s, 0);
  S.advance(s, 1);
  assert.notEqual(s.hour, h);
});

test('las zonas se deterioran y la maleza crece', () => {
  const s = fresh();
  const c0 = s.zones.cortijo.cons, w0 = s.zones.paseo.weeds;
  S.advance(s, 48);
  assert.ok(s.zones.cortijo.cons < c0);
  assert.ok(s.zones.paseo.weeds > w0);
  // las zonas borradas no cambian
  assert.equal(s.zones.huerta.cons, 0);
});

test('tareas: gastan jornales y materiales y suben la conservación', () => {
  const s = fresh();
  s.jornales = 3;
  const c0 = s.zones.cortijo.cons, cal0 = s.materials.cal, j0 = s.jornales;
  const r = S.doTask(s, 'cortijo', 'encalar');
  assert.ok(r.ok, r.text);
  assert.ok(s.zones.cortijo.cons > c0 + 10);
  assert.equal(s.materials.cal, cal0 - 1);
  assert.equal(s.jornales, j0 - 2);
  const r2 = S.doTask(s, 'cortijo', 'encalar');
  assert.equal(r2.ok, false, 'sin jornales suficientes no se puede');
});

test('la tarea de temporada se bloquea fuera de su estación', () => {
  const s = fresh(); // otoño
  const t = S.findTask('pozo', 'atar');
  s.zones.pozo.unlocked = true;
  s.cfg.startSeason = 3; // invierno
  assert.match(S.taskBlocker(s, 'pozo', t), /temporada/);
});

test('desbloquear una zona la vuelve a dibujar; su recuerdo espera al 100 %', () => {
  const s = fresh();
  s.jornales = 20;
  const r = S.unlockZone(s, 'huerta');
  assert.ok(r.ok, r.text);
  assert.ok(s.zones.huerta.unlocked);
  assert.ok(!s.items.includes('receta'));
  s.zones.huerta.cons = 100; S.checkItems(s);
  assert.ok(s.items.includes('receta'));
  // el colmenar necesita apicultura
  assert.match(S.unlockBlocker(s, 'colmenar'), /apicultura/);
});

test('los recuerdos solo salen con la zona al 100 % y de uno en uno', () => {
  const s = fresh();
  s.day = 30;
  s.zones.patio.cons = 80;
  s.jornales = 5;
  S.doTask(s, 'patio', 'barrer');
  assert.ok(s.zones.patio.everRestored);
  assert.ok(!s.items.includes('partitura1'));
  s.zones.patio.cons = 99.8; s.jornales = 5;
  S.doTask(s, 'patio', 'barrer');
  const got = ['partitura1', 'foto_fuente'].filter((id) => s.items.includes(id));
  assert.equal(got.length, 1);                 // uno por zona…
  s.day += 3; S.checkItems(s);
  assert.equal(['partitura1', 'foto_fuente'].filter((id) => s.items.includes(id)).length, 2);   // …y el siguiente días después
  assert.ok(S.themeNotesKnown(s) > THEME_START);
});

test('el Pascuali aparece con la huerta al 100 % y ahorra jornales', () => {
  const s = fresh();
  for (const z of Object.values(s.zones)) z.unlocked = true;
  const cavar = S.findTask('huerta', 'cavar');
  assert.equal(S.taskJornales(s, cavar), 2);
  s.zones.huerta.cons = 100; S.checkItems(s);
  assert.ok(s.tractor.found && !s.tractor.ready);
  s.money = 500; s.jornales = 3;
  let r = S.repairTractor(s);
  assert.ok(r.ok && !r.done);
  s.jornales = 5;
  r = S.repairTractor(s);
  assert.ok(r.done && s.tractor.ready);
  assert.equal(S.taskJornales(s, cavar), 1);
  assert.equal(S.taskJornales(s, S.findTask('huerta', 'regar')), 1);
  S.breakDown(s, 'tractor');
  assert.equal(S.taskJornales(s, cavar), 2);   // averiado, todo a mano
});

test('vender baja el precio del canal y luego se recupera', () => {
  const s = fresh();
  s.products.huevos = 20;
  const p0 = S.unitPrice(s, 'huevos', 'coop');
  const r = S.sell(s, 'huevos', 10, 'coop');
  assert.ok(r.ok);
  assert.ok(s.money > 120);
  const p1 = S.unitPrice(s, 'huevos', 'coop');
  assert.ok(p1 < p0);
  for (let i = 0; i < 5; i++) S.recoverPrices(s);
  assert.ok(Math.abs(S.unitPrice(s, 'huevos', 'coop') - p0) < 0.01);
});

test('el mercado solo abre los jueves y las cestas solo con huéspedes', () => {
  const s = fresh();
  s.products.miel = 5;
  s.day = 1; // lunes
  assert.match(S.sellBlocker(s, 'miel', 'market'), /jueves/);
  s.day = 4; // jueves
  assert.equal(S.sellBlocker(s, 'miel', 'market'), null);
  assert.match(S.sellBlocker(s, 'miel', 'basket'), /huéspedes/);
});

test('llega un voluntario pronto y suma jornales', () => {
  const s = fresh();
  S.runDays(s, 2);
  assert.ok(s.stats.volunteersArrived >= 1);
  const v = s.volunteers[0];
  if (v) assert.ok(S.dailyJornales(s) >= 5);
});

test('un voluntario con zona encargada la cuida solo', () => {
  const s = fresh();
  S.arrive(s, 'iker');
  S.assignVolunteer(s, 'iker', 'paseo');
  s.zones.paseo.weeds = 80;
  const w0 = s.zones.paseo.weeds;
  S.autoMaintain(s);
  assert.ok(s.zones.paseo.weeds < w0 - 20);
});

test('la montanera engorda cerdos con bellota', () => {
  const s = fresh(3, { daysPerSeason: 6 });
  s.animals.cerdos = 2;
  s.products.bellota = 30;
  for (let i = 0; i < 20 && !s.stats.montaneras; i++) { S.montaneraDay(s); }
  assert.equal(s.stats.montaneras, 1);
  assert.equal(s.products.cerdo, 2);
});

test('todos los eventos tienen opciones válidas y se pueden resolver', () => {
  for (const e of EVENTS) {
    const s = fresh(11);
    s.zones.huerta.unlocked = true;
    s.volunteers.push({ id: 'lucia', arrived: 1, leaves: 1, happy: 80, zone: null });
    s.pendingLeave = 'lucia';
    s.volunteersSeen.push('lucia');
    s.pendingCat = 0;
    s.guests.push({ n: 1, nights: 1 });
    s.eventQueue.push(e.id);
    const v = S.currentEvent(s);
    assert.ok(v.title && typeof v.text === 'string' && v.text.length > 5, e.id);
    assert.ok(v.options.length >= 1, e.id);
    for (let i = 0; i < e.options.length; i++) {
      const s2 = structuredClone(s);
      const r = S.resolveEvent(s2, i);
      assert.ok(r, e.id + ' opción ' + i);
      assert.ok(Number.isFinite(s2.money) && Number.isFinite(s2.mood));
    }
  }
});

test('los objetos referencian zonas e hilos que existen', () => {
  const zoneIds = new Set(ZONES.map((z) => z.id));
  const threads = new Set(['pianista', 'manuel', 'feliciano', 'transi', 'elisa', 'loli', 'finca']);
  for (const it of ITEMS) {
    if (it.zone) assert.ok(zoneIds.has(it.zone), it.id);
    assert.ok(threads.has(it.thread), it.id);
  }
  const scores = ITEMS.reduce((a, i) => a + (i.score || 0), 0);
  assert.equal(THEME_START + scores, THEME.length, 'las partituras completan el tema');
});

test('la revelación llega con todas las partituras, el diario, la firma y el piano', () => {
  const s = fresh();
  s.day = 120;
  for (const id of ['partitura1', 'partitura2', 'partitura3', 'partitura4', 'partitura5', 'partitura6', 'diario']) S.giveItem(s, id);
  assert.equal(s.eventQueue.includes('revelacion'), false);
  s.zones.piano.unlocked = true;
  s.zones.piano.cons = 85;
  S.giveItem(s, 'firma');
  assert.ok(s.eventQueue.includes('revelacion'));
  while (s.eventQueue.length) S.resolveEvent(s, 0);
  assert.ok(s.flags.revealed);
  assert.equal(S.themeNotesKnown(s), THEME.length);
});

test('la finca se duerme si se abandona, pero no antes de tiempo', () => {
  const s = fresh(5);
  S.runDays(s, 8);
  assert.equal(s.asleep, null);
  S.runDays(s, 120);
  assert.equal(s.asleep, 'abandon');
});

test('en números rojos tres semanas seguidas, la finca se duerme por ruina', () => {
  const s = fresh(5);
  for (const z of Object.values(s.zones)) if (z.unlocked) z.cons = 90;
  s.money = -500;
  for (let i = 0; i < 30 && !s.asleep; i++) S.checkSleep(s);
  assert.equal(s.asleep, 'ruin');
});

test('la simulación es determinista con la misma semilla', () => {
  const a = fresh(99), b = fresh(99);
  S.runDays(a, 30); S.runDays(b, 30);
  assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
});

test('el estado se puede guardar y cargar sin perder nada', () => {
  const s = fresh(4);
  S.runDays(s, 12);
  const copy = S.migrate(JSON.parse(JSON.stringify(s)));
  S.runDays(s, 5); S.runDays(copy, 5);
  assert.equal(copy.day, s.day);
  assert.equal(copy.money, s.money);
});

test('agroturismo: se abre con el cortijo cuidado y la reputación, y llegan huéspedes', () => {
  const s = fresh(8);
  s.zones.cortijo.cons = 90; s.rep = 40; s.money = 1000; s.jornales = 20;
  assert.ok(S.tourismOpen(s));
  const r = S.buildUpgrade(s, 'hab1');
  assert.ok(r.ok, r.text);
  let guests = 0;
  for (let i = 0; i < 30; i++) { S.tourismDawn(s); guests = Math.max(guests, s.stats.guests); }
  assert.ok(guests > 0);
  const m0 = s.money;
  if (S.guestCount(s)) { S.tourismEvening(s); assert.ok(s.money > m0); }
});

test('la revelación espera a su día aunque todo esté listo', () => {
  const s = fresh();
  for (const id of ['partitura1', 'partitura2', 'partitura3', 'partitura4', 'partitura5', 'partitura6', 'diario', 'firma']) S.giveItem(s, id);
  s.zones.piano.unlocked = true; s.zones.piano.cons = 90;
  assert.equal(s.eventQueue.includes('revelacion'), false);
  s.day = 100;
  S.checkRevelation(s);
  assert.ok(s.eventQueue.includes('revelacion'));
});

test('todos los objetos se pueden encontrar', () => {
  for (const it of ITEMS) {
    assert.ok(['full', 'cat', 'event'].includes(it.where), it.id);
    if (it.where === 'full') assert.ok(ZONES.some((z) => z.id === it.zone), it.id);
  }
  const s = fresh(2);
  s.day = 200;
  for (const z of Object.values(s.zones)) { z.unlocked = true; z.cons = 100; z.maxCons = 100; z.everRestored = true; }
  for (let i = 0; i < 20; i++) { S.checkItems(s); s.day += 3; }
  const pending = ITEMS.filter((i) => i.where === 'full' && !s.items.includes(i.id));
  assert.deepEqual(pending.map((i) => i.id), []);
});

test('recuperar una zona es un proyecto de varios jornales', () => {
  const s = fresh();
  s.jornales = 3;
  const r1 = S.unlockZone(s, 'ermita');
  assert.ok(r1.ok && !r1.done);
  assert.equal(s.zones.ermita.unlockWork, 3);
  assert.equal(s.jornales, 0);
  // Un voluntario encargado sigue el trabajo
  S.arrive(s, 'jonas');
  assert.ok(S.assignVolunteer(s, 'jonas', 'ermita'));
  for (let i = 0; i < 10; i++) S.autoMaintain(s);
  assert.ok(s.zones.ermita.unlocked);
});

test('rendimiento decreciente: lo bien cuidado sube menos', () => {
  assert.equal(S.diminish(20), 1);
  assert.ok(S.diminish(80) < 0.6);
  assert.ok(S.diminish(100) >= 0.25);
});

test('huerta: se siembra lo de temporada, crece con agua y se recoge', () => {
  const s = fresh(21);
  s.zones.huerta.unlocked = true; s.zones.huerta.cons = 80; s.water = 90; s.jornales = 10;
  // otoño: calabazas sí, tomates no
  assert.match(S.sowBlocker(s, 0, 'tomates'), /temporada/);
  assert.ok(S.sow(s, 0, 'calabazas').ok);
  assert.equal(S.beds(s)[0].crop, 'calabazas');
  for (let i = 0; i < 20 && S.beds(s)[0].ready == null; i++) { s.day++; S.gardenDay(s); }
  assert.notEqual(S.beds(s)[0].ready, null);
  const r = S.harvest(s, 0);
  assert.ok(r.ok && s.products.calabazas >= 3, JSON.stringify(r));
  assert.equal(S.beds(s)[0].crop, null);
});

test('lo maduro sin recoger se pasa', () => {
  const s = fresh(22);
  s.zones.huerta.unlocked = true;
  s.beds = [{ crop: 'coles', growth: 1, ready: 1, left: 1 }, { crop: null }, { crop: null }];
  for (let i = 0; i < 12; i++) { s.day++; S.gardenDay(s); }
  assert.equal(s.beds[0].crop, null);
});

test('cocina: conservas con verduras y matanza con un cerdo', () => {
  const s = fresh(23);
  s.jornales = 10; s.products.tomates = 2; s.products.pimientos = 2;
  assert.ok(S.cook(s, 'conservas').ok);
  assert.ok(s.products.conservas >= 2);
  assert.equal(s.products.tomates + s.products.pimientos, 1);
  s.products.cerdo = 1;
  assert.ok(S.cook(s, 'matanza').ok); // otoño: época de matanza
  assert.equal(s.products.jamon, 1);
  assert.ok(s.products.embutido >= 6);
});

test('ratos libres alegran a los voluntarios y tienen espera', () => {
  const s = fresh(24);
  S.arrive(s, 'lucia');
  const h0 = s.volunteers[0].happy, m0 = s.mood;
  assert.ok(S.doActivity(s, 'acuarela').ok);
  assert.ok(s.volunteers[0].happy > h0 && s.mood > m0);
  assert.match(S.activityBlocker(s, 'acuarela'), /dentro de/);
});

test('lo fresco se estropea y las conservas no', () => {
  const s = fresh(25);
  s.products.lechugas = 20; s.products.conservas = 20;
  for (let i = 0; i < 10; i++) S.spoilDay(s);
  assert.ok(s.products.lechugas < 12);
  assert.equal(s.products.conservas, 20);
});

test('el pozo da agua', () => {
  const s = fresh(26);
  s.zones.pozo.unlocked = true; s.jornales = 3; s.water = 30;
  assert.ok(S.doTask(s, 'pozo', 'agua').ok);
  assert.ok(s.water >= 45);
});

test('todas las zonas con maleza tienen una tarea para quitarla', () => {
  for (const z of ZONES) if (z.weeds) assert.ok(z.tasks.some((t) => t.effect?.weeds < 0), z.id);
});

// ── Contratiempos ──
const unlockAll = (s) => { for (const z of ZONES) { s.zones[z.id].unlocked = true; s.zones[z.id].cons = 70; } };

test('los eventos que piden jornales llegan al amanecer, con el día por delante', () => {
  let dawnOnes = 0, total = 0;
  for (let seed = 1; seed < 400 && total < 60; seed++) {
    const s = fresh(seed);
    s.day = 20;
    S.planDay(s);
    if (!s.todayEvent) continue;
    total++;
    const e = EVENTS.find((x) => x.id === s.todayEvent.id);
    if (S.needsJornales(e)) { assert.equal(s.todayEvent.hour, 6, e.id); dawnOnes++; }
  }
  assert.ok(total > 20 && dawnOnes > 0);
});

test('una avería para la zona: no produce, no se cuida y se repara con jornales', () => {
  const s = fresh(3);
  unlockAll(s);
  s.animals.gallinas = 10;
  assert.ok(S.breakDown(s, 'gallinero'));
  assert.ok(S.isDamaged(s, 'corral'));
  const t = S.findTask('corral', 'limpiar');
  assert.match(S.taskBlocker(s, 'corral', t), /Averiado/);
  const before = s.products.huevos;
  S.produceDay(s);
  assert.equal(s.products.huevos, before);
  s.materials.piedra = 5; s.jornales = 2;
  let r = S.repair(s, 'gallinero');
  assert.ok(r.ok && !r.done);
  s.jornales = 5;
  r = S.repair(s, 'gallinero');
  assert.ok(r.done);
  assert.ok(!S.isDamaged(s, 'corral'));
  assert.equal(S.taskBlocker(s, 'corral', t), null);
});

test('se puede pagar a un profesional para reparar de golpe', () => {
  const s = fresh(4);
  unlockAll(s);
  S.breakDown(s, 'bomba');
  assert.ok(S.stopped(s, 'water', 'pozo'));
  s.money = 1000;
  const cost = S.proTotal(s, 'bomba');
  assert.ok(cost > 90);
  const r = S.hireRepair(s, 'bomba');
  assert.ok(r.ok);
  assert.equal(Math.round(s.money), 1000 - cost);
  assert.ok(!S.stopped(s, 'water', 'pozo'));
});

test('el tejado hundido deja una cama y cierra el agroturismo', () => {
  const s = fresh(5);
  s.zones.cortijo.cons = 90;
  assert.ok(S.bedsTotal(s) > 1);
  S.breakDown(s, 'tejado');
  assert.equal(S.bedsTotal(s), 1);
  assert.ok(S.stopped(s, 'tourism'));
});

test('lo roto sin atender va a peor', () => {
  const s = fresh(6);
  unlockAll(s);
  S.breakDown(s, 'muro');
  const c = s.zones.muros.cons;
  s.day += 6;
  S.hardshipDawn(s);
  assert.ok(s.zones.muros.cons < c);
});

test('los lunes se pagan los gastos fijos y crecen con la finca', () => {
  const s = fresh(8);
  const small = S.weeklyBill(s);
  unlockAll(s);
  assert.ok(S.weeklyBill(s) > small);
  s.day = 8;                      // lunes
  assert.equal(S.weekday(s), 0);
  const m = s.money;
  S.hardshipDawn(s);
  assert.ok(s.money < m);
});

test('en invierno la chimenea gasta leña; sin leña hace frío', () => {
  const s = fresh(9);
  s.day = 16;                     // invierno (empieza en otoño, 14 días por estación)
  assert.equal(S.seasonIndex(s), 3);
  s.materials.lena = 5;
  S.hardshipDawn(s);
  assert.ok(s.materials.lena < 5 && !s.cold);
  s.materials.lena = 0;
  const mood = s.mood;
  S.hardshipDawn(s);
  assert.ok(s.cold && s.mood < mood);
});

test('sin heno ni pienso, los animales dejan de producir', () => {
  const s = fresh(10);
  unlockAll(s);
  s.day = 16;
  s.animals.gallinas = 12;
  s.products.heno = 0; s.materials.pienso = 0;
  S.hardshipDawn(s);
  assert.ok(s.hungry);
  const h = s.products.huevos;
  for (let i = 0; i < 5; i++) S.produceDay(s);
  assert.equal(s.products.huevos, h);
  s.materials.pienso = 20;
  S.hardshipDawn(s);
  assert.ok(!s.hungry);
});

test('los avisos cambian precios y cierran el mercado', () => {
  const s = fresh(11);
  const p = S.unitPrice(s, 'lechugas', 'coop');
  S.addMod(s, 'coop_baja', 5);
  assert.ok(S.unitPrice(s, 'lechugas', 'coop') < p * 0.7);
  s.day = 4;                     // jueves
  assert.ok(S.channelOpen(s, 'market'));
  S.addMod(s, 'carretera', 3);
  assert.ok(!S.channelOpen(s, 'market'));
  s.day += 10;
  S.hardshipDawn(s);
  assert.equal(S.activeMods(s).length, 0);
});

test('el préstamo de la cooperativa se devuelve los lunes', () => {
  const s = fresh(12);
  s.money = -80;
  assert.ok(S.takeLoan(s, 300, 2, 30));
  assert.equal(s.money, 220);
  s.day = 8; S.hardshipDawn(s);
  s.day = 15; S.hardshipDawn(s);
  assert.equal(s.loan, null);
});

test('todas las averías y avisos que usan los eventos existen', () => {
  const src = EVENTS.map((e) => e.options.map((o) => String(o.apply || '')).join(' ')).join(' ');
  for (const m of src.matchAll(/breakDown\('([a-z_]+)'\)/g)) assert.ok(S.DAMAGES[m[1]], m[1]);
  for (const m of src.matchAll(/h\.mod\('([a-z_]+)'/g)) assert.ok(S.MODS[m[1]], m[1]);
});

test('una partida guardada antigua se completa con los contratiempos', () => {
  const s = fresh(13);
  delete s.damages; delete s.mods; delete s.taxBase; delete s.cfg.difficulty;
  const m = S.migrate(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(m.damages, {});
  assert.deepEqual(m.mods, []);
  assert.equal(m.cfg.difficulty, 'normal');
  S.runDays(m, 20);
  assert.ok(m.day >= 21);
});

test('la dificultad cambia la frecuencia de contratiempos y los gastos', () => {
  const a = fresh(14, { difficulty: 'tranquila' }), b = fresh(14, { difficulty: 'dura' });
  assert.ok(S.weeklyBill(a) < S.weeklyBill(b));
  assert.ok(S.crisisFactor(a) < S.crisisFactor(b));
});

test('un año entero con contratiempos sin errores', () => {
  const s = fresh(15);
  unlockAll(s);
  s.animals = { gallinas: 8, ovejas: 3, cerdos: 2, colmenas: 3 };
  s.money = 2000;
  S.runDays(s, 56, (st) => S.resolveEvent(st, 1));
  assert.ok(s.day >= 57 || s.asleep);
  assert.ok(Number.isFinite(s.money));
});
