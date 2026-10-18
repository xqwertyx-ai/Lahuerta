// Pequeños seres vivos del plano, dibujados en vivo con pocos trazos.
const INK = 'rgba(59,42,28,0.9)';

function inkLine(ctx, w = 1) { ctx.strokeStyle = INK; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; }

export function drawHen(ctx, x, y, peck = 0, dir = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  inkLine(ctx, 0.9);
  ctx.fillStyle = 'rgba(179,89,42,0.85)';
  ctx.beginPath();
  ctx.ellipse(0, -5, 6, 4.2, -0.15, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  // Cola
  ctx.beginPath(); ctx.moveTo(-5, -6); ctx.lineTo(-9, -11); ctx.lineTo(-7, -4); ctx.closePath(); ctx.fill(); ctx.stroke();
  // Cabeza
  const hy = peck ? -3 : -9, hx = peck ? 7 : 5;
  ctx.beginPath(); ctx.arc(hx, hy, 2.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c0302a';
  ctx.beginPath(); ctx.arc(hx, hy - 2.4, 1.3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#d0a020';
  ctx.beginPath(); ctx.moveTo(hx + 2, hy); ctx.lineTo(hx + 4, hy + 0.6); ctx.stroke();
  inkLine(ctx, 0.7);
  ctx.beginPath(); ctx.moveTo(-1, -1); ctx.lineTo(-1, 2); ctx.moveTo(2, -1); ctx.lineTo(2, 2); ctx.stroke();
  ctx.restore();
}

export function drawSheep(ctx, x, y, dir = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  inkLine(ctx, 0.9);
  ctx.beginPath(); ctx.moveTo(-5, -2); ctx.lineTo(-5, 3); ctx.moveTo(4, -2); ctx.lineTo(4, 3); ctx.stroke();
  ctx.fillStyle = 'rgba(248,244,232,0.95)';
  ctx.beginPath();
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    ctx.arc(Math.cos(a) * 7, -6 + Math.sin(a) * 4, 3, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, -6, 8.5, 5.5, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = 'rgba(50,40,32,0.9)';
  ctx.beginPath(); ctx.ellipse(9, -8, 3, 2.3, 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function drawPig(ctx, x, y, dir = 1, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir * s, s);
  inkLine(ctx, 0.9);
  ctx.fillStyle = 'rgba(70,55,52,0.9)';
  ctx.beginPath(); ctx.ellipse(0, -5, 9, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(8, -7); ctx.lineTo(13, -5); ctx.lineTo(8, -2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(6, -9); ctx.lineTo(8, -12); ctx.lineTo(9, -8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-5, -1); ctx.lineTo(-5, 2); ctx.moveTo(4, -1); ctx.lineTo(4, 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-9, -6); ctx.quadraticCurveTo(-12, -8, -11, -4); ctx.stroke();
  ctx.restore();
}

export function drawBee(ctx, x, y) {
  ctx.fillStyle = 'rgba(220,170,40,0.95)';
  ctx.beginPath(); ctx.ellipse(x, y, 1.8, 1.2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath(); ctx.ellipse(x - 0.5, y - 1.6, 1.2, 0.8, -0.4, 0, Math.PI * 2); ctx.fill();
}

export function drawDeer(ctx, x, y, dir = 1, stag = true) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  inkLine(ctx, 1);
  ctx.fillStyle = 'rgba(120,80,48,0.9)';
  ctx.beginPath();
  ctx.moveTo(-12, -14); ctx.quadraticCurveTo(0, -18, 10, -15); ctx.lineTo(12, -9); ctx.quadraticCurveTo(0, -6, -12, -9); ctx.closePath();
  ctx.fill(); ctx.stroke();
  // Patas
  ctx.beginPath();
  for (const lx of [-10, -7, 7, 10]) { ctx.moveTo(lx, -9); ctx.lineTo(lx + (lx > 0 ? 1 : -1), 2); }
  ctx.stroke();
  // Cuello y cabeza (bebiendo o mirando)
  ctx.beginPath(); ctx.moveTo(9, -15); ctx.lineTo(14, -26); ctx.lineTo(18, -25); ctx.lineTo(14, -13); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(18, -27, 4, 2.5, 0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  if (stag) {
    ctx.beginPath();
    ctx.moveTo(16, -29); ctx.lineTo(13, -38); ctx.lineTo(10, -42); ctx.moveTo(13, -38); ctx.lineTo(16, -42);
    ctx.moveTo(18, -29); ctx.lineTo(20, -38); ctx.lineTo(18, -43); ctx.moveTo(20, -38); ctx.lineTo(24, -41);
    ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(16, -29); ctx.lineTo(14, -33); ctx.moveTo(18, -29); ctx.lineTo(19, -33); ctx.stroke();
  }
  ctx.restore();
}

// Figurita de persona a plumilla. work = fase de la animación de trabajo (o null)
export function drawFigure(ctx, x, y, { hat = false, color = '#7a5a3a', work = null, scale = 1 } = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  inkLine(ctx, 1);
  // Piernas
  ctx.beginPath(); ctx.moveTo(-2, -8); ctx.lineTo(-3, 0); ctx.moveTo(2, -8); ctx.lineTo(3, 0); ctx.stroke();
  // Cuerpo con camisa de color
  ctx.fillStyle = color + 'cc';
  ctx.beginPath(); ctx.moveTo(-4, -8); ctx.lineTo(-3, -18); ctx.lineTo(3, -18); ctx.lineTo(4, -8); ctx.closePath(); ctx.fill(); ctx.stroke();
  // Cabeza
  ctx.fillStyle = 'rgba(240,220,190,0.95)';
  ctx.beginPath(); ctx.arc(0, -21.5, 3.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  if (hat) { ctx.beginPath(); ctx.moveTo(-5.5, -23.5); ctx.lineTo(5.5, -23.5); ctx.moveTo(-3, -23.5); ctx.lineTo(-2.5, -27); ctx.lineTo(2.5, -27); ctx.lineTo(3, -23.5); ctx.stroke(); }
  // Brazos y herramienta
  if (work != null) {
    const a = Math.sin(work) * 0.9;
    const hx = 4 + Math.cos(-0.6 + a) * 8, hy = -16 + Math.sin(-0.6 + a) * 8;
    ctx.beginPath(); ctx.moveTo(3, -16); ctx.lineTo(hx, hy); ctx.moveTo(-3, -16); ctx.lineTo(hx - 2, hy + 1); ctx.stroke();
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(hx - 4, hy - 6); ctx.lineTo(hx + 6, hy + 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hx + 4, hy + 10); ctx.lineTo(hx + 9, hy + 9); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(-3, -16); ctx.lineTo(-5, -9); ctx.moveTo(3, -16); ctx.lineTo(5, -9); ctx.stroke();
  }
  ctx.restore();
}
