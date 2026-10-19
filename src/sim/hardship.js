// Contratiempos: averías y su reparación, avisos temporales de la economía, gastos fijos,
// leña para el invierno y comida para los animales.
import { DAMAGES, MODS, BILLS, HEATING, FEED, FOOD_SEASON, BUY_SEASON, DIFFICULTY } from '../data/hardships.js';
import { ZONES, ZONE_BY_ID } from '../data/zones.js';
import { UPGRADE_BY_ID } from '../data/tourism.js';
import { MATERIALS } from '../data/products.js';
import { seasonIndex, isSeasonStart, weekday, yearOf } from './calendar.js';
import { addLog, signal, clamp, canAfford, payCost, addStock, missingOf, labelOf, costLabel } from './effects.js';

export { DAMAGES, MODS, DIFFICULTY };

export function difficulty(s) { return DIFFICULTY[s.cfg?.difficulty] || DIFFICULTY.normal; }

// La finca envejece: cada año todo se estropea un poco más deprisa
export function agingFactor(s) {
  return 1 + Math.min(0.45, (yearOf(s) - 1) * difficulty(s).aging);
}

// ── Averías ──
export function damages(s) { return Object.values(s.damages || {}); }

export function damageOf(s, zoneId) {
  if (!s.damages) return null;
  for (const d of Object.values(s.damages)) if (DAMAGES[d.id].zone === zoneId) return d;
  return null;
}

export function isDamaged(s, zoneId) { return !!damageOf(s, zoneId); }

// ¿Hay alguna avería que pare esto? (beds, tourism, water, market, concerts, montanera, sow, find)
export function stopped(s, what, zoneId = null) {
  if (!s.damages) return false;
  for (const d of Object.values(s.damages)) {
    const def = DAMAGES[d.id];
    if (zoneId && def.zone !== zoneId) continue;
    if (def.stops[what]) return true;
  }
  return false;
}

export function canBreak(s, id) {
  const def = DAMAGES[id];
  if (!def || (s.damages && s.damages[id])) return false;
  if (def.zone && !s.zones[def.zone].unlocked) return false;
  if (def.zone && damageOf(s, def.zone)) return false;
  if (def.needsAnimals && !(s.animals[def.needsAnimals] > 0)) return false;
  if (id === 'tractor' && !(s.tractor && s.tractor.ready)) return false;
  return true;
}

export function breakDown(s, id) {
  if (!canBreak(s, id)) return false;
  const def = DAMAGES[id];
  if (!s.damages) s.damages = {};
  s.damages[id] = { id, work: 0, started: false, since: s.day };
  if (def.zone) {
    const z = s.zones[def.zone];
    z.cons = clamp(z.cons - def.hit, 0, 100);
  }
  // Consecuencias inmediatas
  if (id === 'tejado' && s.guests.length) {
    s.guests = [];
    s.rep = clamp(s.rep - 3, 0, 100);
    addLog(s, 'Los huéspedes se van antes de tiempo: no se puede dormir con goteras.', 'bad');
  }
  if (id === 'bancales' && Array.isArray(s.beds)) {
    for (const b of s.beds) { b.crop = null; b.growth = 0; b.ready = null; }
  }
  if (id === 'varroa' && s.animals.colmenas > 1) {
    const lost = Math.max(1, Math.round(s.animals.colmenas * 0.3));
    s.animals.colmenas -= lost;
    addLog(s, `Se pierden ${lost} ${lost === 1 ? 'colmena' : 'colmenas'}.`, 'bad');
  }
  if (id === 'gallinero' && s.animals.gallinas > 0) {
    const lost = Math.max(1, Math.round(s.animals.gallinas * 0.4));
    s.animals.gallinas -= lost;
    addLog(s, `El zorro se ha llevado ${lost} ${lost === 1 ? 'gallina' : 'gallinas'}.`, 'bad');
  }
  if (id === 'dehesa_quemada' && s.montanera > 0) s.montanera = Math.max(0, s.montanera - 0.25);
  addLog(s, `⚠ ${def.name}. ${def.text}`, 'bad');
  signal(s, 'damage', { id, zone: def.zone });
  return true;
}

export function repairTotal(id) { return DAMAGES[id].work; }
export function repairLeft(s, id) { const d = s.damages?.[id]; return d ? DAMAGES[id].work - d.work : 0; }
export function proCost(s, id) { return Math.round(repairLeft(s, id) * DAMAGES[id].pro * (0.85 + 0.15 * difficulty(s).bills)); }

export function repairBlocker(s, id, jornales = s.jornales) {
  const d = s.damages?.[id];
  if (!d) return 'No hay nada roto';
  const def = DAMAGES[id];
  if (!d.started && !canAfford(s, def.cost)) return 'Falta ' + missingOf(s, def.cost).map(labelOf).join(', ');
  if (jornales < 1) return 'No quedan jornales hoy';
  return null;
}

function finishRepair(s, id) {
  const def = DAMAGES[id];
  delete s.damages[id];
  if (def.zone) {
    const z = s.zones[def.zone];
    z.cons = clamp(z.cons + 6, 0, 100);
  }
  s.mood = clamp(s.mood + 5, 0, 100);
  s.stats.repairs = (s.stats.repairs || 0) + 1;
  addLog(s, `Reparado: ${def.name.toLowerCase()}. ${def.zone ? ZONE_BY_ID[def.zone].name + ' vuelve a funcionar.' : 'Todo vuelve a funcionar.'}`, 'good');
  signal(s, 'repaired', { id, zone: def.zone });
}

// Pone jornales en la reparación (todos los que queden hoy, hasta terminar). by = voluntario
export function repair(s, id, { by = null, budget = null } = {}) {
  const avail = budget != null ? budget : s.jornales;
  const b = repairBlocker(s, id, avail);
  if (b) return { ok: false, text: b };
  const def = DAMAGES[id];
  const d = s.damages[id];
  if (!d.started) {
    payCost(s, def.cost);
    if (def.cost.money) s.stats.spent += def.cost.money;
    d.started = true;
  }
  const put = Math.min(Math.floor(avail), def.work - d.work);
  if (budget == null) s.jornales -= put;
  d.work += put;
  if (d.work >= def.work) {
    finishRepair(s, id);
    return { ok: true, done: true, used: put, text: `${def.name}: reparado`, delta: 0 };
  }
  signal(s, 'task', { zone: def.zone || 'cortijo', task: 'repair', skilled: false });
  return { ok: true, done: false, used: put, text: `Reparando ${def.name.toLowerCase()}: ${d.work}/${def.work}`, delta: 0 };
}

// Lo que cuesta en total llamar a un profesional (incluido el material si aún no se ha comprado)
export function proTotal(s, id) {
  const d = s.damages?.[id];
  if (!d) return 0;
  return proCost(s, id) + (d.started ? 0 : DAMAGES[id].cost.money || 0);
}

export function hireBlocker(s, id) {
  const d = s.damages?.[id];
  if (!d) return 'No hay nada roto';
  const def = DAMAGES[id];
  const extra = d.started ? {} : def.cost;
  if (s.money < proTotal(s, id)) return 'No llega el dinero';
  const { money: _m, ...mats } = extra;
  if (!canAfford(s, mats)) return 'Falta ' + missingOf(s, mats).map(labelOf).join(', ');
  return null;
}

// Llamar a un profesional: lo termina hoy, pero cuesta
export function hireRepair(s, id) {
  const b = hireBlocker(s, id);
  if (b) return { ok: false, text: b };
  const def = DAMAGES[id];
  const d = s.damages[id];
  const cost = proCost(s, id);
  if (!d.started) { payCost(s, def.cost); if (def.cost.money) s.stats.spent += def.cost.money; }
  addStock(s, 'money', -cost);
  s.stats.spent += cost;
  signal(s, 'coins', { amount: -cost });
  finishRepair(s, id);
  return { ok: true, done: true, text: `Un profesional del pueblo lo arregla por ${cost} €`, delta: 0 };
}

export function repairCostLabel(s, id) {
  const def = DAMAGES[id];
  const d = s.damages?.[id];
  const c = costLabel(def.cost);
  return `${def.work} jornales de trabajo` + (c && !(d && d.started) ? ` · al empezar: ${c}` : '');
}

// ── Avisos (modificadores temporales) ──
export function addMod(s, id, days) {
  if (!MODS[id]) return;
  if (!s.mods) s.mods = [];
  const cur = s.mods.find((m) => m.id === id);
  if (cur) cur.until = Math.max(cur.until, s.day + days);
  else s.mods.push({ id, until: s.day + days });
  signal(s, 'mod', { id });
}

export function activeMods(s) { return (s.mods || []).filter((m) => m.until >= s.day); }

// Producto de un factor (coop, market, basket, bills, tourism) en todos los avisos activos
export function modFactor(s, key, sub = null) {
  let f = 1;
  for (const m of activeMods(s)) {
    const def = MODS[m.id];
    let v = def[key];
    if (sub != null) v = v && typeof v === 'object' ? v[sub] : undefined;
    if (typeof v === 'number') f *= v;
  }
  return f;
}

export function marketClosed(s) {
  if (stopped(s, 'market')) return 'La furgoneta está averiada';
  if (activeMods(s).some((m) => MODS[m.id].market === false)) return 'La carretera está cortada';
  return null;
}

// ── Gastos fijos ──
function rooms(s) { return s.upgrades.filter((id) => UPGRADE_BY_ID[id]?.kind === 'room').length; }
function unlockedZones(s) { return ZONES.filter((z) => s.zones[z.id].unlocked).length; }
function heads(s) { return Object.values(s.animals).reduce((a, n) => a + n, 0); }

// Préstamo de la cooperativa: dinero ahora, cuotas los lunes
export function takeLoan(s, amount = 300, weeks = 11, weekly = 30) {
  if (s.loan) return false;
  s.loan = { weekly, left: weeks };
  addStock(s, 'money', amount);
  signal(s, 'coins', { amount });
  addLog(s, `La cooperativa te presta ${amount} €. Se devuelven en ${weeks} cuotas de ${weekly} €, los lunes.`, 'info');
  return true;
}

export function weeklyBill(s) {
  const b = BILLS.weekly;
  const solar = s.flags && s.flags.placas ? 0.7 : 1;
  const v = (b.base + b.perZone * unlockedZones(s) + b.perRoom * rooms(s) + b.perAnimal * heads(s)) * difficulty(s).bills * modFactor(s, 'bills') * solar;
  return Math.round(v);
}

export function yearlyBill(s) {
  const b = BILLS.yearly;
  return Math.round((b.base + b.perZone * unlockedZones(s) + b.perRoom * rooms(s)) * difficulty(s).bills);
}

// Lo que se ha ganado limpio desde la última declaración
export function taxableProfit(s) {
  const t = s.taxBase || { earned: 0, spent: 0 };
  return Math.max(0, (s.stats.earned - t.earned) - (s.stats.spent - t.spent));
}

export function taxDue(s) { return Math.round(taxableProfit(s) * BILLS.tax.rate); }

function pay(s, amount, text) {
  addStock(s, 'money', -amount);
  s.stats.spent += amount;
  s.stats.bills = (s.stats.bills || 0) + amount;
  signal(s, 'coins', { amount: -amount });
  addLog(s, text, s.money < 0 ? 'bad' : 'info');
}

// Próximos pagos (para la interfaz)
export function upcomingBills(s) {
  const out = [];
  const toMonday = (7 - weekday(s)) % 7 || 7;
  out.push({ name: 'Luz, agua, gasoil y seguro', days: toMonday, amount: weeklyBill(s), every: 'cada lunes' });
  if (s.loan) out.push({ name: `Préstamo (quedan ${s.loan.left} cuotas)`, days: toMonday, amount: s.loan.weekly, every: 'cada lunes' });
  const dps = s.cfg.daysPerSeason;
  const left = dps - ((s.day - 1) % dps);
  const si = seasonIndex(s);
  const toSeason = (target) => left + ((target - si - 1 + 4) % 4) * dps;
  out.push({ name: 'Contribución, seguro agrario y cooperativa', days: toSeason(BILLS.yearly.season), amount: yearlyBill(s), every: 'cada verano' });
  out.push({ name: 'Declaración de la renta (estimada)', days: toSeason(BILLS.tax.season), amount: taxDue(s), every: 'cada primavera' });
  return out.sort((a, b) => a.days - b.days);
}

// ── Invierno: leña y comida de los animales ──
export function heatingNeed(s, si = seasonIndex(s)) {
  const people = s.volunteers.length + s.guests.reduce((a, g) => a + g.n, 0);
  return HEATING.perDay[si] + HEATING.perPerson[si] * people;
}

export function feedNeed(s, si = seasonIndex(s)) {
  if (!FEED.seasons.includes(si)) return 0;
  let n = 0;
  for (const [k, v] of Object.entries(FEED.perHead)) n += (s.animals[k] || 0) * v;
  return n;
}

export function feedStock(s) { return (s.products.heno || 0) + (s.materials.pienso || 0); }

// Días que aguantan las reservas (para la interfaz)
export function reserveDays(stock, need) { return need > 0 ? Math.floor(stock / need) : Infinity; }

// Lo que hará falta en toda la próxima estación fría (para avisar con tiempo)
export function winterEstimate(s) {
  const dps = s.cfg.daysPerSeason;
  const people = s.volunteers.length + 1;
  const lena = Math.round((HEATING.perDay[3] + HEATING.perPerson[3] * people) * dps + HEATING.perDay[2] * dps / 2);
  let feed = 0;
  for (const [k, v] of Object.entries(FEED.perHead)) feed += (s.animals[k] || 0) * v * dps;
  return { lena, feed: Math.round(feed) };
}

export function buyPrice(s, key) {
  const m = MATERIALS[key];
  const f = BUY_SEASON[key] ? BUY_SEASON[key][seasonIndex(s)] : 1;
  return Math.round(m.buy * f * modFactor(s, 'buy', key) * 100) / 100;
}

export function foodCostFactor(s) { return FOOD_SEASON[seasonIndex(s)]; }

function heatDay(s) {
  const need = heatingNeed(s);
  s.cold = false;
  if (need <= 0) return;
  const have = s.materials.lena || 0;
  if (have >= need) { addStock(s, 'lena', -need); s.coldDays = 0; return; }
  addStock(s, 'lena', -have);
  s.cold = true;
  s.coldDays = (s.coldDays || 0) + 1;
  s.mood = clamp(s.mood - 3, 0, 100);
  for (const v of s.volunteers) v.happy = clamp(v.happy - 2.5, 0, 100);
  if (s.coldDays === 1 || s.coldDays % 4 === 0) {
    addLog(s, 'No queda leña: la chimenea está apagada y en el cortijo hace un frío que pela. Hay que recoger o comprar leña.', 'bad');
    signal(s, 'warning', { kind: 'cold' });
  }
}

function feedDay(s) {
  const need = feedNeed(s);
  s.hungry = false;
  if (need <= 0) { s.hungryDays = 0; return; }
  let left = need;
  const fromHeno = Math.min(left, s.products.heno || 0);
  addStock(s, 'heno', -fromHeno); left -= fromHeno;
  const fromPienso = Math.min(left, s.materials.pienso || 0);
  addStock(s, 'pienso', -fromPienso); left -= fromPienso;
  if (left < need * 0.25) { s.hungryDays = 0; return; }
  s.hungry = true;
  s.hungryDays = (s.hungryDays || 0) + 1;
  if (s.hungryDays === 1) {
    addLog(s, 'Los animales no tienen qué comer: el campo está seco y no queda heno ni pienso. Dejan de dar huevos y leche.', 'bad');
    signal(s, 'warning', { kind: 'feed' });
  }
  if (s.hungryDays >= FEED.hungryDaysToSell) {
    s.hungryDays = 0;
    if (s.animals.ovejas > 0) {
      s.animals.ovejas--; addStock(s, 'money', 35);
      addLog(s, 'Sin comida para todas, hay que vender una oveja a un ganadero del pueblo, por poco dinero (35 €).', 'bad');
    } else if (s.animals.gallinas > 1) {
      const n = Math.min(s.animals.gallinas, 3);
      s.animals.gallinas -= n;
      addLog(s, `Sin pienso, hay que regalar ${n} gallinas a una vecina que sí tiene.`, 'bad');
    }
  }
}

// ── Al amanecer ──
export function hardshipDawn(s) {
  if (!s.damages) s.damages = {};
  if (!s.mods) s.mods = [];
  // Avisos que caducan
  const ending = s.mods.filter((m) => m.until < s.day);
  s.mods = s.mods.filter((m) => m.until >= s.day);
  for (const m of ending) addLog(s, `Se acabó: ${MODS[m.id].name.toLowerCase()}.`, MODS[m.id].bad ? 'good' : 'info');
  // Lo roto, si no se empieza a arreglar, va a peor
  for (const d of damages(s)) {
    const def = DAMAGES[d.id];
    if (def.zone && !d.started && s.day - d.since > 3) {
      const z = s.zones[def.zone];
      z.cons = clamp(z.cons - def.worse, 0, 100);
    }
  }
  s.mood = clamp(s.mood - damages(s).length * 0.5, 0, 100);
  // Gastos
  if (weekday(s) === 0 && s.day > 1) {
    pay(s, weeklyBill(s), `Lunes: luz, agua, gasoil y seguro. Pagas ${weeklyBill(s)} €.`);
    if (s.loan && s.loan.left > 0) {
      s.loan.left--;
      pay(s, s.loan.weekly, `Cuota del préstamo de la cooperativa: ${s.loan.weekly} € (${s.loan.left ? `quedan ${s.loan.left}` : 'era la última'}).`);
      if (!s.loan.left) s.loan = null;
    }
  }
  const si = seasonIndex(s);
  if (isSeasonStart(s) && s.day > 1) {
    if (si === BILLS.yearly.season) pay(s, yearlyBill(s), `Llega el recibo de la contribución, el seguro agrario y la cuota de la cooperativa: ${yearlyBill(s)} €.`);
    if (si === 2) {
      const w = winterEstimate(s);
      addLog(s, `Llega el otoño. Para pasar el invierno harán falta unas ${w.lena} cargas de leña${w.feed ? ` y ${w.feed} de heno o pienso para los animales` : ''}. Mejor guardarlo antes del frío: en invierno todo es más caro.`, 'info');
    }
  }
  heatDay(s);
  feedDay(s);
}

// Para la interfaz: lista de problemas en marcha
export function troubles(s) {
  const out = [];
  for (const d of damages(s)) {
    const def = DAMAGES[d.id];
    out.push({ kind: 'damage', id: d.id, zone: def.zone, name: def.name, text: def.text, work: d.work, total: def.work });
  }
  for (const m of activeMods(s)) {
    const def = MODS[m.id];
    out.push({ kind: 'mod', id: m.id, name: def.name, text: def.desc, days: m.until - s.day + 1, bad: !!def.bad });
  }
  if (s.cold) out.push({ kind: 'cold', name: 'Sin leña', text: 'La chimenea está apagada. Recoge leña en el bosquete o cómprala.' });
  if (s.hungry) out.push({ kind: 'feed', name: 'Animales sin comida', text: 'Siega heno en primavera o compra pienso en la cooperativa.' });
  return out;
}

