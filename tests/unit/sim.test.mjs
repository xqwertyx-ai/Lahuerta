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
  const t = S.findTask('huerta', 'sembrar');
  s.zones.huerta.unlocked = true;
  s.cfg.startSeason = 3; // invierno
  assert.match(S.taskBlocker(s, 'huerta', t), /temporada/);
});

test('desbloquear una zona la vuelve a dibujar y puede dar un recuerdo', () => {
  const s = fresh();
  s.jornales = 10;
  const r = S.unlockZone(s, 'huerta');
  assert.ok(r.ok, r.text);
  assert.ok(s.zones.huerta.unlocked);
  assert.ok(s.items.includes('receta'));
  // el colmenar necesita apicultura
  assert.match(S.unlockBlocker(s, 'colmenar'), /apicultura/);
});

test('restaurar una zona por encima de 70 da su objeto', () => {
  const s = fresh();
  s.day = 30;
  s.zones.patio.cons = 69;
  s.jornales = 5;
  S.doTask(s, 'patio', 'barrer');
  assert.ok(s.zones.patio.everRestored);
  assert.ok(s.items.includes('partitura1'));
  assert.ok(S.themeNotesKnown(s) > THEME_START);
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
  const threads = new Set(['pianista', 'manuel', 'feliciano', 'transi', 'elisa', 'loli']);
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

test('en números rojos durante una estación, la finca se duerme por ruina', () => {
  const s = fresh(5);
  for (const z of Object.values(s.zones)) if (z.unlocked) z.cons = 90;
  s.money = -500;
  for (let i = 0; i < 20 && !s.asleep; i++) S.checkSleep(s);
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
    assert.ok(['unlock', 'restore', 'cons', 'task', 'cat', 'event'].includes(it.where), it.id);
    if (it.where === 'cons') assert.ok(it.at > 0 && it.zone, it.id);
    if (['unlock', 'restore', 'cons', 'task'].includes(it.where)) assert.ok(it.zone, it.id);
    if (it.where === 'unlock') assert.equal(ZONES.find((z) => z.id === it.zone).unlocked, false, it.id + ': su zona empieza desbloqueada');
  }
  const s = fresh(2);
  s.day = 200;
  for (const z of Object.values(s.zones)) { z.unlocked = true; z.cons = 100; z.maxCons = 100; z.everRestored = true; }
  S.checkItems(s);
  const pending = ITEMS.filter((i) => ['unlock', 'restore', 'cons'].includes(i.where) && !s.items.includes(i.id));
  assert.deepEqual(pending.map((i) => i.id), []);
});

test('recuperar una zona es un proyecto de varios jornales', () => {
  const s = fresh();
  s.jornales = 3;
  const r1 = S.unlockZone(s, 'almacen');
  assert.ok(r1.ok && !r1.done);
  assert.equal(s.zones.almacen.unlockWork, 3);
  assert.equal(s.jornales, 0);
  // Un voluntario encargado sigue el trabajo
  S.arrive(s, 'jonas');
  assert.ok(S.assignVolunteer(s, 'jonas', 'almacen'));
  for (let i = 0; i < 4; i++) S.autoMaintain(s);
  assert.ok(s.zones.almacen.unlocked);
});

test('rendimiento decreciente: lo bien cuidado sube menos', () => {
  assert.equal(S.diminish(20), 1);
  assert.ok(S.diminish(80) < 0.6);
  assert.ok(S.diminish(100) >= 0.25);
});
