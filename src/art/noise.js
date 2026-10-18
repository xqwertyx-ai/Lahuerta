// Aleatoriedad para el dibujo (independiente de la simulación) y ruido suave.

export function makeRng(seed = 1) {
  let a = seed >>> 0 || 1;
  const r = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.range = (lo, hi) => lo + r() * (hi - lo);
  r.int = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  r.pick = (arr) => arr[Math.floor(r() * arr.length)];
  r.sign = () => (r() < 0.5 ? -1 : 1);
  r.gauss = () => (r() + r() + r() - 1.5) / 1.5;
  return r;
}

export function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// Ruido de valor 1D suave (para temblores de trazo)
export function noise1(seed) {
  const r = makeRng(seed);
  const N = 256;
  const v = new Float32Array(N);
  for (let i = 0; i < N; i++) v[i] = r() * 2 - 1;
  return (x) => {
    const i = Math.floor(x);
    const f = x - i;
    const a = v[i & (N - 1)], b = v[(i + 1) & (N - 1)];
    const t = f * f * (3 - 2 * f);
    return a + (b - a) * t;
  };
}

// Ruido 2D de valor (para manchas de papel)
export function noise2(seed) {
  const r = makeRng(seed);
  const N = 128;
  const v = new Float32Array(N * N);
  for (let i = 0; i < v.length; i++) v[i] = r();
  const at = (x, y) => v[(x & (N - 1)) + (y & (N - 1)) * N];
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1);
    return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
  };
}

export function fbm2(n2, x, y, oct = 4) {
  let s = 0, a = 0.5, f = 1, norm = 0;
  for (let i = 0; i < oct; i++) { s += a * n2(x * f, y * f); norm += a; a *= 0.5; f *= 2.03; }
  return s / norm;
}
