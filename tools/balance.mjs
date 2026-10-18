// Simulación de balance: varias partidas de varios años con jugadores automáticos.
// Uso: node tools/balance.mjs [años=3] [partidas=6]
import * as S from '../src/sim/index.js';
import { ZONES, ZONE_BY_ID } from '../src/data/zones.js';
import { PRODUCTS, ANIMALS } from '../src/data/products.js';
import { UPGRADES } from '../src/data/tourism.js';
import { VOLUNTEER_BY_ID } from '../src/data/volunteers.js';
import { ITEMS } from '../src/data/items.js';

const YEARS = Number(process.argv[2] || 3);
const GAMES = Number(process.argv[3] || 6);

// ── Jugadores ──
// cuidadoso: juega cada día con cabeza · perezoso: entra uno de cada tres días · ausente: no hace nada
const PLAYERS = {
  cuidadoso: { every: 1, sells: true, builds: true },
  perezoso: { every: 3, sells: true, builds: false },
  ausente: { every: 0 },
};

function playDay(s, p) {
  if (!p.every || s.day % p.every !== 0) return;
  const si = S.seasonIndex(s);
  // Lo roto, primero: con dinero de sobra se llama a un profesional; si no, se arregla a mano
  for (const d of S.damages(s)) {
    const def = S.DAMAGES[d.id];
    if (!d.started) for (const [k, v] of Object.entries(def.cost)) if (k !== 'money' && (s.materials[k] || 0) < v && s.money > 40) S.buyMaterial(s, k, Math.ceil(v - (s.materials[k] || 0)));
    if (s.money > S.proCost(s, d.id) + 350 && !S.hireBlocker(s, d.id)) S.hireRepair(s, d.id);
    else if (p.builds && !S.repairBlocker(s, d.id)) S.repair(s, d.id);
    else if (!p.builds && s.jornales >= 3 && !S.repairBlocker(s, d.id)) S.repair(s, d.id, { budget: 3 }) && (s.jornales -= 3);
  }
  // Reservas para el invierno
  const win = S.winterEstimate(s);
  const lenaTarget = si === 1 || si === 2 ? win.lena : si === 3 ? S.heatingNeed(s) * 4 : 0;
  if ((s.materials.lena || 0) < lenaTarget && s.money > 120 && si !== 3) S.buyMaterial(s, 'lena', Math.min(5, Math.ceil(lenaTarget - s.materials.lena)));
  if (si === 3 && (s.materials.lena || 0) < S.heatingNeed(s) * 2 && s.money > 30) S.buyMaterial(s, 'lena', 2);
  const fneed = S.feedNeed(s);
  if (fneed > 0 && S.feedStock(s) < fneed * 4 && s.money > 30) S.buyMaterial(s, 'pienso', Math.ceil(fneed * 4));
  // Encargar zonas a los voluntarios: la peor cuidada que use su oficio, o la peor en general
  for (const v of s.volunteers) {
    if (v.zone && s.zones[v.zone].cons < 92) continue;
    const skill = VOLUNTEER_BY_ID[v.id].skill;
    const cands = ZONES.filter((z) => s.zones[z.id].unlocked && !s.volunteers.some((o) => o !== v && o.zone === z.id));
    cands.sort((a, b) => {
      const sa = a.tasks.some((t) => t.skill === skill) ? -25 : 0, sb = b.tasks.some((t) => t.skill === skill) ? -25 : 0;
      return (s.zones[a.id].cons + sa) - (s.zones[b.id].cons + sb);
    });
    if (cands[0]) S.assignVolunteer(s, v.id, cands[0].id);
  }
  // Huerta: recoger lo maduro y sembrar lo de temporada
  if (s.zones.huerta.unlocked) {
    S.beds(s).forEach((bed, i) => { if (!S.harvestBlocker(s, i)) S.harvest(s, i); });
    const crops = S.seasonalCrops(s);
    S.beds(s).forEach((bed, i) => { if (crops.length && !S.sowBlocker(s, i, crops[i % crops.length].id)) S.sow(s, i, crops[i % crops.length].id); });
    if (s.water < 40 && s.zones.pozo.unlocked && !S.taskBlocker(s, 'pozo', S.findTask('pozo', 'agua'))) S.doTask(s, 'pozo', 'agua');
  }
  // Cocina: conservas con lo que sobra, matanza si hay cerdo
  if (!S.recipeBlocker(s, 'matanza')) S.cook(s, 'matanza');
  while (!S.recipeBlocker(s, 'conservas') && ['lechugas', 'habas', 'tomates', 'pimientos', 'calabazas', 'coles', 'ajos'].reduce((a, k) => a + s.products[k], 0) > 8) S.cook(s, 'conservas');
  // Un rato libre de vez en cuando si hay voluntarios
  if (s.volunteers.length && s.mood < 60 && s.money > 50) for (const id of ['comida_finca', 'paseo', 'acuarela']) if (!S.activityBlocker(s, id)) { S.doActivity(s, id); break; }
  // Tareas: lo más rentable sobre lo más descuidado
  let guard = 0;
  while (s.jornales > 0 && guard++ < 20) {
    let best = null, bestScore = -1;
    for (const z of ZONES) {
      const st = s.zones[z.id];
      if (!st.unlocked) continue;
      for (const t of z.tasks) {
        if (S.taskBlocker(s, z.id, t)) continue;
        if (t.cost?.money && s.money < 60) continue;
        const e = t.effect || {};
        let sc = (e.cons || 0) * (100 - st.cons) / 100;
        if (e.weeds && st.weeds != null) sc += Math.max(0, st.weeds - 30) * -e.weeds / 80;
        if (t.gainScaled || t.gainPerAnimal) sc += 10;
        if (t.gain?.piedra && s.materials.piedra < 4) sc += 6;
        if (t.gain?.lena && (s.materials.lena || 0) < lenaTarget) sc += 9;
        if (t.gainScaled?.heno && (s.products.heno || 0) < win.feed * 1.5) sc += 12;
        sc /= S.taskJornales(s, t);
        if (sc > bestScore) { bestScore = sc; best = [z.id, t.id]; }
      }
    }
    if (!best || bestScore < 3) break;
    S.doTask(s, best[0], best[1]);
  }
  // Con lo que sobra, recuperar zonas (primero los proyectos ya empezados)
  const locked = ZONES.filter((z) => !s.zones[z.id].unlocked).sort((a, b) => (s.zones[b.id].unlockWork || 0) - (s.zones[a.id].unlockWork || 0));
  for (const z of locked) {
    if (s.jornales < 1) break;
    if (!S.unlockBlocker(s, z.id) && S.avgCons(s) > 35) S.unlockZone(s, z.id);
  }
  // Comprar materiales básicos
  if (s.materials.cal < 2 && s.money > 40) S.buyMaterial(s, 'cal', 2);
  if (s.materials.herramientas < 1.5 && s.money > 60) S.buyMaterial(s, 'herramientas', 1);
  // Vender: en el mercado los jueves, cestas si hay huéspedes, y la cooperativa si se acumula
  if (p.sells) {
    for (const k of Object.keys(PRODUCTS)) {
      let q = Math.floor(s.products[k]);
      const keep = PRODUCTS[k].food ? s.volunteers.length * 3 : k === 'heno' ? 9999 : 0;
      q -= keep;
      if (q <= 0) continue;
      if (S.channelOpen(s, 'basket') && PRODUCTS[k].basket) { const n = Math.min(q, S.basketCapacity(s)); if (n > 0) { S.sell(s, k, n, 'basket'); q -= n; } }
      if (q > 0 && S.isMarketDay(s)) { S.sell(s, k, Math.min(q, 8), 'market'); q = Math.floor(s.products[k]) - keep; }
      if (q > 12 || p.every > 1 || (k === 'cerdo' && q > 0) || (q > 0 && s.money < 20)) S.sell(s, k, q, 'coop');
    }
  }
  // Animales e inversiones
  const saving = s.flags.tourism && !s.upgrades.includes('hab1');   // ahorrar para la primera habitación
  if (s.money > 150 && !saving) {
    const wish = { gallinas: 8, colmenas: 4, ovejas: 4, cerdos: S.seasonIndex(s) === 2 ? 4 : 0 };
    for (const [k, n] of Object.entries(wish)) while ((s.animals[k] || 0) < n && !S.animalBlocker(s, k) && s.money > ANIMALS[k].price + 100) S.buyAnimal(s, k);
  }
  if (p.builds && s.flags.tourism) {
    for (const u of UPGRADES) if (!S.upgradeBlocker(s, u.id) && s.money > (u.cost.money || 0) + 120) S.buildUpgrade(s, u.id);
  }
  if (p.builds && s.money > 400 && s.employees < 1) S.hireEmployee(s);
  if (s.money < 50 && s.employees > 0) S.fireEmployee(s);
}

function runGame(seed, p) {
  const s = S.createState(seed);
  const rows = [];
  const totalDays = YEARS * 4 * s.cfg.daysPerSeason;
  let lastDay = s.day;
  let revealedDay = null;
  while (s.day <= totalDays && !s.asleep) {
    if (s.eventQueue.length) { S.resolveEvent(s, p.every === 1 || s.eventQueue[0] === 'prestamo' ? 0 : Math.floor(Math.random() * 2)); continue; }
    S.advance(s, 1);
    if (s.day !== lastDay) {
      lastDay = s.day;
      // juega a media mañana
      S.advance(s, 2);
      while (s.eventQueue.length) S.resolveEvent(s, p.every === 1 || s.eventQueue[0] === 'prestamo' ? 0 : Math.floor(Math.random() * 2));
      playDay(s, p);
      s._minMoney = Math.min(s._minMoney ?? 1e9, s.money);
      if (s.flags.revealed && !revealedDay) revealedDay = s.day;
      if ((s.day - 1) % s.cfg.daysPerSeason === 0) {
        rows.push({ day: s.day, money: Math.round(s.money), minMoney: Math.round(s._minMoney ?? s.money), dmg: s.stats.repairs || 0, bills: Math.round(s.stats.bills || 0), food: Math.round(s.stats.food || 0), earned: Math.round(s.stats.earned), spent: Math.round(s.stats.spent), lena: Math.round(s.materials.lena), tour: s.flags.tourism ? s.upgrades.length : '-', cort: Math.round(s.zones.cortijo.cons), mood: Math.round(s.mood), cons: Math.round(S.avgCons(s)), unlocked: ZONES.filter((z) => s.zones[z.id].unlocked).length, rep: Math.round(s.rep), vols: s.volunteers.length, items: s.items.length, guests: s.stats.guests });
      }
    }
  }
  return { s, rows, revealedDay };
}

const summary = {};
for (const [name, p] of Object.entries(PLAYERS)) {
  const out = [];
  for (let g = 0; g < GAMES; g++) out.push(runGame(1000 + g * 77, p));
  const asleep = out.filter((o) => o.s.asleep);
  if (process.env.WHY && asleep.length) for (const o of asleep) { console.log(`\n${name} · semilla ${o.s.seed} se durmió el día ${o.s.day} (${o.s.asleep}):`); for (const l of o.s.log.slice(-25)) console.log(`  d${l.d} ${l.t}`); }
  const avg = (f) => (out.reduce((a, o) => a + f(o), 0) / out.length);
  summary[name] = {
    durmió: `${asleep.length}/${out.length}` + (asleep.length ? ` (día medio ${Math.round(asleep.reduce((a, o) => a + o.s.day, 0) / asleep.length)}, ${asleep.map((o) => o.s.asleep).join(',')})` : ''),
    'dinero final': Math.round(avg((o) => o.s.money)),
    'conservación': Math.round(avg((o) => S.avgCons(o.s))),
    zonas: avg((o) => ZONES.filter((z) => o.s.zones[z.id].unlocked).length).toFixed(1),
    reputación: Math.round(avg((o) => o.s.rep)),
    recuerdos: `${avg((o) => o.s.items.length).toFixed(1)}/${ITEMS.length}`,
    hitos: avg((o) => o.s.milestones.length).toFixed(1),
    huéspedes: Math.round(avg((o) => o.s.stats.guests)),
    montaneras: avg((o) => o.s.stats.montaneras).toFixed(1),
    'reparaciones': avg((o) => o.s.stats.repairs || 0).toFixed(1),
    'gastos fijos': Math.round(avg((o) => o.s.stats.bills || 0)),
    'ánimo': Math.round(avg((o) => o.s.mood)),
    'misterio resuelto': `${out.filter((o) => o.revealedDay).length}/${out.length}` + (out.some((o) => o.revealedDay) ? ` (día ${Math.round(out.filter((o) => o.revealedDay).reduce((a, o) => a + o.revealedDay, 0) / out.filter((o) => o.revealedDay).length)})` : ''),
  };
  if (process.env.SHOW === name) { console.log(`\nEvolución (${name}, partida 1):`); console.table(out[0].rows); }
  if (name === 'cuidadoso') {
    console.log(`\nEvolución por estación (cuidadoso, partida 1):`);
    console.table(out[0].rows);
    const missing = ITEMS.filter((i) => !out[0].s.items.includes(i.id)).map((i) => i.id);
    console.log('Objetos sin encontrar en la partida 1:', missing.join(', ') || 'ninguno');
  }
}
console.log(`\nResumen (${YEARS} años, ${GAMES} partidas por jugador):`);
console.table(summary);
