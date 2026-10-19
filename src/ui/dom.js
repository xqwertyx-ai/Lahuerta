// Ayudas mínimas para construir la interfaz sin librerías.

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v;
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export const $ = (sel, root = document) => root.querySelector(sel);

export function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }

export function fmtMoney(v) {
  const n = Math.round(v * 100) / 100;
  return (Number.isInteger(n) ? String(n) : n.toFixed(2)).replace('.', ',');
}

export function fmtNum(v, dec = 0) {
  const n = Number(v) || 0;
  return (dec ? n.toFixed(dec) : String(Math.round(n))).replace('.', ',');
}

export function bar(value, cls = '') {
  return h('div', { class: 'bar ' + cls }, h('i', { style: { width: Math.max(0, Math.min(100, value)) + '%' } }));
}

export function btn(label, onclick, { cls = '', disabled = null, title = null } = {}) {
  const b = h('button', { class: 'btn ' + cls, onclick, title: disabled || title || null }, label);
  if (disabled) b.disabled = true;
  return b;
}

// Lámina con la imagen de un recuerdo (cuadros de Transi, fotos). Si no carga, se queda el icono.
export function lamina(it, fallback, cls = 'lamina') {
  const img = document.createElement('img');
  img.className = cls;
  img.alt = it.name;
  img.loading = 'lazy';
  img.src = `assets/cuadros/${it.image}.jpg`;
  img.addEventListener('error', () => { if (fallback) img.replaceWith(fallback); else img.remove(); });
  return img;
}
