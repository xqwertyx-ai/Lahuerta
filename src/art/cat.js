// El gato de la finca: blanco con manchas atigradas. Te sigue, duerme al sol y a veces encuentra cosas.
import { ZONES, ZONE_BY_ID } from '../data/zones.js';

const SUN_SPOTS = [[700, 880], [860, 860], [600, 820], [820, 790]];
const WHITE = 'rgba(250,248,242,0.98)';
const TABBY = 'rgba(132,112,88,0.95)';
const STRIPE = 'rgba(80,64,48,0.8)';
const INK = 'rgba(59,42,28,0.92)';

export class Cat {
  constructor() {
    this.x = 860; this.y = 860;
    this.tx = this.x; this.ty = this.y;
    this.state = 'sleep';
    this.timer = 6;
    this.dir = 1;
    this.phase = 0;
    this.happy = 0;
  }

  goTo(x, y) {
    this.tx = x; this.ty = y;
    this.state = 'walk';
  }

  notice(x, y) {
    if (Math.random() < 0.55) this.goTo(x + (Math.random() - 0.5) * 60, y + 10 + Math.random() * 20);
  }

  pet() {
    this.happy = 2.5;
    if (this.state === 'walk') this.state = 'sit';
    this.timer = 4;
  }

  hit(x, y) { return Math.hypot(x - this.x, y - (this.y - 6)) < 18; }

  update(dt, s) {
    this.phase += dt;
    this.happy = Math.max(0, this.happy - dt);
    if (this.state === 'walk') {
      const dx = this.tx - this.x, dy = this.ty - this.y;
      const d = Math.hypot(dx, dy);
      const sp = 26;
      if (d < 2) {
        this.state = Math.random() < 0.5 ? 'sit' : 'groom';
        this.timer = 4 + Math.random() * 6;
      } else {
        this.x += (dx / d) * sp * dt;
        this.y += (dy / d) * sp * dt;
        this.dir = dx >= 0 ? 1 : -1;
      }
      return;
    }
    this.timer -= dt;
    if (this.timer > 0) return;
    const h = s.hour;
    if (h < 7 || h > 21.5) {
      // De noche, en la puerta del cortijo
      const c = ZONE_BY_ID.cortijo;
      if (Math.hypot(this.x - (c.x + 112), this.y - (c.y + 208)) > 10) this.goTo(c.x + 112, c.y + 208);
      else { this.state = 'sleep'; this.timer = 20; }
      return;
    }
    const r = Math.random();
    if (h > 13 && h < 17 && r < 0.6) {
      const [x, y] = SUN_SPOTS[Math.floor(Math.random() * SUN_SPOTS.length)];
      if (Math.hypot(this.x - x, this.y - y) < 10) { this.state = 'sleep'; this.timer = 25; }
      else this.goTo(x, y);
      return;
    }
    if (r < 0.35) { this.state = 'sleep'; this.timer = 15 + Math.random() * 15; return; }
    // Paseo a una zona viva
    const zs = ZONES.filter((z) => s.zones[z.id].unlocked);
    const z = zs[Math.floor(Math.random() * zs.length)];
    this.goTo(z.x + z.w * (0.2 + Math.random() * 0.6), z.y + z.h * (0.6 + Math.random() * 0.35));
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.dir, 1);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1;
    if (this.state === 'sleep') this._sleep(ctx);
    else if (this.state === 'walk') this._walk(ctx);
    else this._sit(ctx);
    if (this.happy > 0) {
      ctx.scale(this.dir, 1);
      ctx.fillStyle = `rgba(160,56,42,${Math.min(1, this.happy)})`;
      ctx.font = '700 14px "Caveat", cursive';
      ctx.fillText('♥', 6, -26 - (2.5 - this.happy) * 6);
    }
    ctx.restore();
  }

  _ears(ctx, hx, hy) {
    ctx.fillStyle = TABBY;
    ctx.beginPath(); ctx.moveTo(hx - 4, hy - 2); ctx.lineTo(hx - 3.5, hy - 7.5); ctx.lineTo(hx - 0.5, hy - 3.5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hx + 0.5, hy - 3.5); ctx.lineTo(hx + 3.5, hy - 7.5); ctx.lineTo(hx + 4, hy - 2); ctx.closePath(); ctx.fill(); ctx.stroke();
  }

  _head(ctx, hx, hy) {
    this._ears(ctx, hx, hy);
    ctx.fillStyle = WHITE;
    ctx.beginPath(); ctx.ellipse(hx, hy, 4.6, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Gorro atigrado y ojos verdes
    ctx.fillStyle = TABBY;
    ctx.beginPath(); ctx.ellipse(hx - 0.5, hy - 2.4, 3.6, 1.8, 0, Math.PI, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(110,140,70,0.95)';
    ctx.beginPath(); ctx.arc(hx + 1.6, hy - 0.4, 0.8, 0, 6.28); ctx.arc(hx - 1.4, hy - 0.4, 0.8, 0, 6.28); ctx.fill();
    ctx.fillStyle = 'rgba(220,140,140,0.95)';
    ctx.beginPath(); ctx.arc(hx + 0.2, hy + 1.2, 0.6, 0, 6.28); ctx.fill();
  }

  _sit(ctx) {
    const groom = this.state === 'groom';
    // Cola enroscada
    ctx.strokeStyle = TABBY; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(-5, -1); ctx.quadraticCurveTo(-12, -2, -10, -8); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 1;
    ctx.fillStyle = WHITE;
    ctx.beginPath(); ctx.ellipse(0, -6, 5.5, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = TABBY;
    ctx.beginPath(); ctx.ellipse(-2.5, -8, 2.5, 3.2, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-1, 0); ctx.lineTo(-1, -3); ctx.moveTo(2, 0); ctx.lineTo(2, -3); ctx.stroke();
    const bob = groom ? Math.sin(this.phase * 6) * 1.2 : 0;
    this._head(ctx, 2 + bob * 0.4, -15 + Math.abs(bob));
  }

  _walk(ctx) {
    const p = this.phase * 9;
    // Patas
    ctx.beginPath();
    ctx.moveTo(-5, -4); ctx.lineTo(-5 + Math.sin(p) * 2.5, 0);
    ctx.moveTo(-3, -4); ctx.lineTo(-3 - Math.sin(p) * 2.5, 0);
    ctx.moveTo(4, -4); ctx.lineTo(4 - Math.sin(p) * 2.5, 0);
    ctx.moveTo(6, -4); ctx.lineTo(6 + Math.sin(p) * 2.5, 0);
    ctx.stroke();
    // Cola alta
    ctx.strokeStyle = TABBY; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(-8, -7); ctx.quadraticCurveTo(-13, -11, -12, -17 + Math.sin(p * 0.5)); ctx.stroke();
    ctx.strokeStyle = STRIPE; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(-12.5, -12); ctx.lineTo(-10.5, -12); ctx.moveTo(-12.8, -15); ctx.lineTo(-11, -15); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 1;
    // Cuerpo
    ctx.fillStyle = WHITE;
    ctx.beginPath(); ctx.ellipse(0, -7, 9, 4.2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = TABBY;
    ctx.beginPath(); ctx.ellipse(-2, -9, 4, 2, 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-6.5, -6, 2, 1.6, 0, 0, Math.PI * 2); ctx.fill();
    this._head(ctx, 9, -11);
  }

  _sleep(ctx) {
    const br = Math.sin(this.phase * 1.5) * 0.4;
    ctx.fillStyle = WHITE;
    ctx.beginPath(); ctx.ellipse(0, -4, 8.5, 4.6 + br, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = TABBY;
    ctx.beginPath(); ctx.ellipse(-2, -6.5, 4, 2, 0, 0, Math.PI * 2); ctx.fill();
    // Cola alrededor
    ctx.strokeStyle = TABBY; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(-8, -3); ctx.quadraticCurveTo(-6, 2, 4, 1); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 1;
    // Cabeza escondida
    ctx.fillStyle = WHITE;
    ctx.beginPath(); ctx.ellipse(6, -4, 3.8, 3.2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = TABBY;
    ctx.beginPath(); ctx.moveTo(4, -6.5); ctx.lineTo(5, -9.5); ctx.lineTo(7, -7); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(7.5, -7); ctx.lineTo(9.5, -9); ctx.lineTo(9.6, -5.8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, -4); ctx.quadraticCurveTo(6, -3.3, 7, -4); ctx.stroke();
    // Zzz
    const t = (this.phase * 0.4) % 1;
    ctx.fillStyle = `rgba(59,42,28,${0.6 * (1 - t)})`;
    ctx.font = '12px "Caveat", cursive';
    ctx.fillText('z', 8 + t * 6, -10 - t * 12);
  }
}
