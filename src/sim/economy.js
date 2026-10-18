// Producción, agua, montanera, mercado y compras.
import { BALANCE } from '../data/balance.js';
import { ZONES } from '../data/zones.js';
import { PRODUCTS, MATERIALS, ANIMALS } from '../data/products.js';
import { WEATHER } from '../data/seasons.js';
import { rand, roundP, randRange } from './rng.js';
import { seasonIndex, isMarketDay } from './calendar.js';
import { addLog, signal, clamp, addStock } from './effects.js';

// ── Producción diaria ──
export function produceDay(s) {
  const si = seasonIndex(s);
  const w = WEATHER[s.weather] || WEATHER.sol;
  const out = {};
  for (const z of ZONES) {
    const st = s.zones[z.id];
    if (!st.unlocked || !z.produce) continue;
    const q = st.cons / 100;
    for (const [k, arr] of Object.entries(z.produce)) {
      if (!Array.isArray(arr)) continue;
      let base = arr[si];
      if (!base) continue;
      if (k === 'queso') base *= s.animals[z.produce.perQueso] || 0;
      else if (z.produce.per && k !== 'queso') base *= s.animals[z.produce.per] || 0;
      if (z.id === 'huerta') {
        base *= 0.55 + 0.45 * s.water / 100;
        if (s.zones.alberca.unlocked) base *= 1 + s.zones.alberca.cons / 250;
      }
      // Los cerdos de montanera se comen la bellota de la dehesa
      let amount = base * q * w.prod;
      if (k === 'bellota' && s.animals.cerdos > 0) {
        const eaten = Math.min(amount, s.animals.cerdos * 0.5);
        s._bellotaEaten = (s._bellotaEaten || 0) + eaten;
        amount -= eaten;
      }
      const n = roundP(s, amount);
      if (n > 0) {
        addStock(s, k, n);
        out[k] = (out[k] || 0) + n;
        if (s.stats.produced[k] !== undefined) s.stats.produced[k] += n;
      }
    }
  }
  // Gurumelos: en otoño, tras la lluvia, si la dehesa está cuidada
  if (si === 2 && s.zones.dehesa.unlocked && (s.weather === 'lluvia' || s.water > 60) && rand(s) < 0.35 * s.zones.dehesa.cons / 100) {
    const n = 1 + Math.floor(rand(s) * 2);
    addStock(s, 'gurumelos', n);
    out.gurumelos = n;
    s.stats.produced.gurumelos += n;
    addLog(s, `Aparecen gurumelos bajo las jaras: ${n} ${n === 1 ? 'kilo' : 'kilos'}.`, 'good');
  }
  return out;
}

// ── Montanera: los cerdos engordan con bellota en otoño e invierno ──
export function montaneraDay(s) {
  if (!s.animals.cerdos) { s._bellotaEaten = 0; return; }
  const si = seasonIndex(s);
  if (si !== 2 && si !== 3) { s._bellotaEaten = 0; return; }
  const need = s.animals.cerdos * 0.5;
  let got = s._bellotaEaten || 0;
  // Si falta, comen de los sacos guardados
  if (got < need && s.products.bellota > 0) {
    const take = Math.min(s.products.bellota, Math.ceil(need - got));
    addStock(s, 'bellota', -take);
    got += take;
  }
  s._bellotaEaten = 0;
  const ratio = Math.min(1, got / need) * (0.5 + 0.5 * s.zones.dehesa.cons / 100);
  s.montanera = clamp(s.montanera + ratio / (s.cfg.daysPerSeason * 1.5), 0, 1);
  if (s.montanera >= 1) {
    const n = s.animals.cerdos;
    addStock(s, 'cerdo', n);
    s.animals.cerdos = 0;
    s.montanera = 0;
    s.stats.montaneras++;
    s.stats.produced.cerdo += n;
    addLog(s, `Termina la montanera: ${n} ${n === 1 ? 'cerdo ibérico' : 'cerdos ibéricos'} de bellota, listos para vender.`, 'good');
    signal(s, 'montanera', { n });
  }
}

// ── Agua (pozo y alberca) ──
export function waterDay(s) {
  const si = seasonIndex(s);
  const w = WEATHER[s.weather] || WEATHER.sol;
  let d = w.water || 0;
  d += [-1, -6, -2, 0][si];
  if (s.zones.alberca.unlocked) d += (s.zones.alberca.cons - 40) / 25;
  s.water = clamp(s.water + d, 0, 100);
}

// ── Precios ──
export function rollPriceNoise(s) {
  for (const k of Object.keys(PRODUCTS)) s.priceNoise[k] = randRange(s, 0.9, 1.1);
}

export function recoverPrices(s) {
  for (const ch of Object.keys(s.saturation)) {
    for (const k of Object.keys(s.saturation[ch])) {
      s.saturation[ch][k] = Math.max(0, s.saturation[ch][k] - BALANCE.priceRecoveryPerDay);
      if (s.saturation[ch][k] === 0) delete s.saturation[ch][k];
    }
  }
  s.basketSoldToday = 0;
}

const CHANNEL_FACTOR = {
  coop: () => BALANCE.coopPriceFactor,
  market: () => BALANCE.marketPriceFactor,
  basket: () => BALANCE.basketPriceFactor,
};

export function channelOpen(s, ch) {
  if (ch === 'coop') return true;
  if (ch === 'market') return isMarketDay(s);
  if (ch === 'basket') return s.guests.length > 0;
  return false;
}

export function basketCapacity(s) {
  const guests = s.guests.reduce((a, g) => a + g.n, 0);
  return Math.max(0, guests * 3 - s.basketSoldToday);
}

export function unitPrice(s, product, ch) {
  const p = PRODUCTS[product];
  const si = seasonIndex(s);
  const sat = s.saturation[ch]?.[product] || 0;
  const noise = s.priceNoise[product] || 1;
  const repBonus = ch === 'basket' ? 1 + s.rep / 400 : 1;
  const v = p.price * p.season[si] * CHANNEL_FACTOR[ch]() * noise * repBonus * Math.max(0.35, 1 - sat);
  return Math.round(v * 100) / 100;
}

export function sellBlocker(s, product, ch, qty = 1) {
  if (!channelOpen(s, ch)) {
    if (ch === 'market') return 'El mercado abre los jueves';
    if (ch === 'basket') return 'No hay huéspedes';
  }
  if (ch === 'basket' && !PRODUCTS[product].basket) return 'No va en cesta';
  if (ch === 'basket' && basketCapacity(s) < qty) return 'Los huéspedes ya no quieren más hoy';
  if ((s.products[product] || 0) < qty) return 'No hay suficiente';
  return null;
}

export function sell(s, product, qty, ch) {
  qty = Math.floor(qty);
  if (qty <= 0) return { ok: false, text: 'Nada que vender' };
  const b = sellBlocker(s, product, ch, qty);
  if (b) return { ok: false, text: b };
  let total = 0;
  for (let i = 0; i < qty; i++) {
    total += unitPrice(s, product, ch);
    s.saturation[ch][product] = (s.saturation[ch][product] || 0) + BALANCE.saturationPerUnit * (PRODUCTS[product].price > 50 ? 3 : 1);
  }
  total = Math.round(total * 100) / 100;
  addStock(s, product, -qty);
  addStock(s, 'money', total);
  if (ch === 'basket') s.basketSoldToday += qty;
  s.stats.sales += qty;
  s.stats.earned += total;
  if (ch === 'market') s.stats.marketSales += qty;
  signal(s, 'coins', { amount: total });
  return { ok: true, total, text: `Vendes ${qty} ${PRODUCTS[product].unit}${qty > 1 ? 's' : ''} de ${PRODUCTS[product].name.toLowerCase()} por ${total.toFixed(2)} €` };
}

// Vende un poco de todo a un multiplicador (feria). Devuelve lo ganado.
export function sellAllAt(s, mult) {
  let total = 0;
  for (const k of Object.keys(PRODUCTS)) {
    const q = Math.floor(s.products[k] || 0);
    if (!q || k === 'cerdo') continue;
    const each = PRODUCTS[k].price * PRODUCTS[k].season[seasonIndex(s)] * mult;
    total += each * q;
    s.products[k] = 0;
    s.stats.sales += q;
  }
  total = Math.round(total);
  addStock(s, 'money', total);
  s.stats.earned += total;
  return total;
}

// ── Compras ──
export function buyMaterial(s, key, qty = 1) {
  const m = MATERIALS[key];
  if (!m) return { ok: false, text: '¿Qué es eso?' };
  const cost = m.buy * qty;
  if (s.money < cost) return { ok: false, text: 'No llega el dinero' };
  addStock(s, 'money', -cost);
  addStock(s, key, qty);
  s.stats.spent += cost;
  signal(s, 'coins', { amount: -cost });
  return { ok: true, text: `Compras ${qty} de ${m.name.toLowerCase()} (${cost} €)` };
}

export function animalBlocker(s, key) {
  const a = ANIMALS[key];
  if (!a) return 'Desconocido';
  if (!s.zones[a.zone].unlocked) return `Primero hay que recuperar ${a.zone === 'dehesa' ? 'la dehesa' : a.zone === 'colmenar' ? 'el colmenar' : 'el corral'}`;
  if ((s.animals[key] || 0) >= a.max) return 'No caben más';
  if (key === 'cerdos' && s.montanera > 0.05) return 'Espera a que acabe la montanera';
  if (s.money < a.price) return 'No llega el dinero';
  return null;
}

export function buyAnimal(s, key) {
  const b = animalBlocker(s, key);
  if (b) return { ok: false, text: b };
  const a = ANIMALS[key];
  addStock(s, 'money', -a.price);
  s.animals[key] = (s.animals[key] || 0) + 1;
  s.stats.spent += a.price;
  signal(s, 'coins', { amount: -a.price });
  const art = ['gallina', 'oveja', 'colmena'].includes(a.unit) ? 'una' : 'un';
  return { ok: true, text: `Compras ${art} ${a.unit} (${a.price} €)` };
}
