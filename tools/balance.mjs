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
  if (s.volunteers.length && s.mood < 60) for (const id of ['comida_finca', 'paseo', 'acuarela']) if (!S.activityBlocker(s, id)) { S.doActivity(s, id); break; }
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
      const keep = PRODUCTS[k].food ? s.volunteers.length * 3 : 0;
      q -= keep;
      if (q <= 0) continue;
      if (S.channelOpen(s, 'basket') && PRODUCTS[k].basket) { const n = Math.min(q, S.basketCapacity(s)); if (n > 0) { S.sell(s, k, n, 'basket'); q -= n; } }
      if (q > 0 && S.isMarketDay(s)) { S.sell(s, k, Math.min(q, 8), 'market'); q = Math.floor(s.products[k]) - keep; }
      if (q > 12 || (k === 'cerdo' && q > 0) || (q > 0 && s.money < 20)) S.sell(s, k, q, 'coop');
    }
  }
  // Animales e inversiones
  if (s.money > 150) {
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
    if (s.eventQueue.length) { S.resolveEvent(s, Math.floor(Math.random() * 2)); continue; }
    S.advance(s, 1);
    if (s.day !== lastDay) {
      lastDay = s.day;
      // juega a media mañana
      S.advance(s, 2);
      while (s.eventQueue.length) S.resolveEvent(s, 0);
      playDay(s, p);
      if (s.flags.revealed && !revealedDay) revealedDay = s.day;
      if ((s.day - 1) % s.cfg.daysPerSeason === 0) {
        rows.push({ day: s.day, money: Math.round(s.money), cons: Math.round(S.avgCons(s)), unlocked: ZONES.filter((z) => s.zones[z.id].unlocked).length, rep: Math.round(s.rep), vols: s.volunteers.length, items: s.items.length, guests: s.stats.guests });
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
    'misterio resuelto': `${out.filter((o) => o.revealedDay).length}/${out.length}` + (out.some((o) => o.revealedDay) ? ` (día ${Math.round(out.filter((o) => o.revealedDay).reduce((a, o) => a + o.revealedDay, 0) / out.filter((o) => o.revealedDay).length)})` : ''),
  };
  if (name === 'cuidadoso') {
    console.log(`\nEvolución por estación (cuidadoso, partida 1):`);
    console.table(out[0].rows);
    const missing = ITEMS.filter((i) => !out[0].s.items.includes(i.id)).map((i) => i.id);
    console.log('Objetos sin encontrar en la partida 1:', missing.join(', ') || 'ninguno');
  }
}
console.log(`\nResumen (${YEARS} años, ${GAMES} partidas por jugador):`);
console.table(summary);
