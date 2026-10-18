// Generador aleatorio con semilla (mulberry32). El estado vive en s.rng para que
// la partida sea reproducible y se pueda guardar.

export function rand(s) {
  s.rng = (s.rng + 0x6d2b79f5) | 0;
  let t = s.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function chance(s, p) { return rand(s) < p; }
export function randInt(s, a, b) { return a + Math.floor(rand(s) * (b - a + 1)); }
export function randRange(s, a, b) { return a + rand(s) * (b - a); }
export function pick(s, arr) { return arr[Math.floor(rand(s) * arr.length)]; }

// entries: [[clave, peso], …]
export function weighted(s, entries) {
  let total = 0;
  for (const [, w] of entries) total += Math.max(0, w);
  if (total <= 0) return null;
  let r = rand(s) * total;
  for (const [k, w] of entries) {
    r -= Math.max(0, w);
    if (r <= 0) return k;
  }
  return entries[entries.length - 1][0];
}

// Redondeo probabilístico: 2.3 → 2 (70 %) o 3 (30 %). Mantiene medias correctas con cantidades pequeñas.
export function roundP(s, x) {
  const f = Math.floor(x);
  return f + (rand(s) < x - f ? 1 : 0);
}
