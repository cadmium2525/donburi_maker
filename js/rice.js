// ステップ2：炊飯器からしゃもじでごはんをよそう
import { TAU, R, rng, mk, lin, rad, gloss, rrect, clamp } from './util.js';
import { geom, DESIGN_MAP, drawBg, drawBowlBack, drawBowlFront, drawRice, riceInfo, ricePath, grains } from './bowls.js';

const W = 1000, H = 680;
const POT = { cx: 255, cy: 360, rx: 150, ry: 54 };
const BOWL_S = 0.56, BOWL_X = 730, BOWL_Y = 470; // 器中心(500,cy)がここに来る
const CAP = 1650; // 5合

export function riceLabel(g) {
  if (g <= 0) return 'からっぽ';
  if (g < 120) return 'ちょっぴり';
  if (g < 200) return '少なめ';
  if (g < 290) return 'ふつう盛り';
  if (g < 380) return '大盛り';
  if (g < 480) return '特盛り';
  if (g < 600) return 'メガ盛り';
  return 'ギガ盛り…！';
}

export class RiceStep {
  constructor(canvas, st, onChange) {
    this.cv = canvas; this.st = st; this.onChange = onChange;
    this.c = canvas.getContext('2d');
    this.hit = mk(1, 1).getContext('2d');
    this.pointer = { x: 560, y: 330, inside: false };
    this.hold = null; // {from:'pot'|'bowl', t0, amount}
    this.fall = null;
    this.particles = [];
    this.bgCache = null; this.bgKey = '';
    this.running = false;
    this.bind();
  }
  get taken() { return this.st.rice; }
  resize() {
    const cssW = this.cv.clientWidth || 600;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const pw = Math.round(Math.min(1600, cssW * dpr));
    if (this.cv.width !== pw) { this.cv.width = pw; this.cv.height = Math.round((pw * H) / W); this.bgKey = ''; }
    this.k = this.cv.width / W;
  }
  start() { this.resize(); if (!this.running) { this.running = true; this.last = performance.now(); requestAnimationFrame((t) => this.loop(t)); } }
  stop() { this.running = false; }

  bowlToView(x, y) { return [BOWL_X + (x - 500) * BOWL_S, BOWL_Y + (y - this.g().cy) * BOWL_S]; }
  viewToBowl(x, y) { return [500 + (x - BOWL_X) / BOWL_S, this.g().cy + (y - BOWL_Y) / BOWL_S]; }
  g() { return geom(this.st.shape); }

  inPot(x, y) { const dx = (x - POT.cx) / POT.rx, dy = (y - POT.cy) / POT.ry; return dx * dx + dy * dy < 1.25; }
  inBowl(x, y) {
    const g = this.g(); const [bx, by] = this.viewToBowl(x, y);
    const info = riceInfo(g, this.st.rice);
    const top = info.type === 'dome' ? g.cy - g.iy - info.dome - 40 : g.cy - g.ry - 40;
    const dx = (bx - g.cx) / (g.rx + 30);
    return Math.abs(dx) < 1 && by > top && by < g.cy + g.depth;
  }
  bowlRiceHit(x, y) {
    if (this.st.rice <= 0) return false;
    const g = this.g(); const [bx, by] = this.viewToBowl(x, y);
    const p = ricePath(g, riceInfo(g, this.st.rice), 1.05);
    return this.hit.isPointInPath(p, bx, by) || (this.inBowl(x, y) && by < g.cy + g.iy);
  }

  bind() {
    const pos = (e) => { const b = this.cv.getBoundingClientRect(); return [((e.clientX - b.left) / b.width) * W, ((e.clientY - b.top) / b.height) * H]; };
    this.cv.addEventListener('pointerdown', (e) => {
      const [x, y] = pos(e);
      this.pointer = { x, y, inside: true };
      if (this.fall) return;
      if (this.inPot(x, y)) { this.hold = { from: 'pot', t0: performance.now(), amount: 25 }; this.cv.setPointerCapture(e.pointerId); }
      else if (this.bowlRiceHit(x, y)) { this.hold = { from: 'bowl', t0: performance.now(), amount: Math.min(25, this.st.rice) }; this.cv.setPointerCapture(e.pointerId); }
      e.preventDefault();
    });
    this.cv.addEventListener('pointermove', (e) => { const [x, y] = pos(e); this.pointer = { x, y, inside: true }; });
    this.cv.addEventListener('pointerleave', () => { if (!this.hold) this.pointer.inside = false; });
    const up = (e) => {
      const [x, y] = pos(e);
      const h = this.hold; this.hold = null;
      if (!h) return;
      const amt = Math.round(h.amount);
      if (h.from === 'pot') {
        if (this.inBowl(x, y)) this.drop(x, y, amt, +1);
        else this.say('炊飯器にもどしたよ');
      } else {
        if (this.inPot(x, y) || !this.inBowl(x, y)) this.drop(x, y, amt, -1);
      }
      if (e.pointerType !== 'mouse') this.pointer.inside = false;
    };
    this.cv.addEventListener('pointerup', up);
    this.cv.addEventListener('pointercancel', () => { this.hold = null; });
  }
  say(t) { this.msg = { t, until: performance.now() + 1300 }; }
  drop(x, y, amt, sign) {
    const g = this.g(), info = riceInfo(g, this.st.rice);
    let tx, ty;
    if (sign > 0) { const top = info.type === 'dome' ? g.cy - g.iy - info.dome : g.cy; [tx, ty] = this.bowlToView(g.cx + R(Math.random, -60, 60), top + 20); }
    else { tx = POT.cx + R(Math.random, -50, 50); ty = POT.cy; }
    this.fall = { x0: x, y0: y, x1: tx, y1: ty, t0: performance.now(), dur: 320, amt, sign };
  }
  set(amount) {
    this.st.rice = clamp(Math.round(amount), 0, 700);
    this.onChange && this.onChange(this.st.rice);
  }

  drawCooker(c) {
    // ふた（奥）
    c.save();
    c.fillStyle = 'rgba(40,20,0,.25)';
    c.beginPath(); c.ellipse(POT.cx, 610, 200, 34, 0, 0, TAU); c.fill();
    c.fillStyle = lin(c, 60, 120, 450, 330, ['#ffffff', '#f2eee8', '#d9d3ca']);
    c.beginPath(); c.moveTo(80, 330); c.bezierCurveTo(70, 160, 140, 110, 255, 108); c.bezierCurveTo(370, 110, 440, 160, 430, 330); c.closePath(); c.fill();
    c.fillStyle = lin(c, 100, 140, 410, 320, ['#c8ccd2', '#eef0f3', '#aab0b8']);
    c.beginPath(); c.moveTo(110, 325); c.bezierCurveTo(105, 185, 160, 140, 255, 138); c.bezierCurveTo(350, 140, 405, 185, 400, 325); c.closePath(); c.fill();
    c.fillStyle = '#9aa0a8'; c.beginPath(); c.ellipse(255, 220, 26, 10, 0, 0, TAU); c.fill();
    gloss(c, 190, 180, 50, 16, 0.6, -0.4);
    // 本体
    rrect(c, 60, 320, 390, 280, 70);
    c.fillStyle = lin(c, 60, 0, 450, 0, ['#e8e3dc', '#ffffff', '#fbf9f6', '#ddd7cf']); c.fill();
    c.fillStyle = lin(c, 0, 320, 0, 600, ['rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,.12)']); c.fill();
    gloss(c, 130, 450, 26, 90, 0.7);
    // 操作パネル
    rrect(c, 170, 450, 170, 92, 22);
    c.fillStyle = lin(c, 0, 450, 0, 542, ['#f6dfe4', '#efc8d1']); c.fill();
    rrect(c, 190, 462, 130, 40, 10); c.fillStyle = '#3b4a3c'; c.fill();
    c.fillStyle = '#a8ffb0'; c.font = 'bold 22px "Zen Maru Gothic", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('炊きたて', 255, 483);
    for (let i = 0; i < 3; i++) { c.fillStyle = ['#ff8fa6', '#ffffff', '#ffd27a'][i]; c.beginPath(); c.arc(215 + i * 40, 523, 9, 0, TAU); c.fill(); }
    // 内釜
    c.beginPath(); c.ellipse(POT.cx, POT.cy - 6, POT.rx + 26, POT.ry + 14, 0, 0, TAU);
    c.fillStyle = lin(c, 0, POT.cy - 70, 0, POT.cy + 70, ['#f4f2ee', '#d6d0c8']); c.fill();
    c.beginPath(); c.ellipse(POT.cx, POT.cy - 4, POT.rx + 8, POT.ry + 6, 0, 0, TAU);
    c.fillStyle = lin(c, POT.cx - POT.rx, 0, POT.cx + POT.rx, 0, ['#6a6e74', '#c8ccd2', '#8a8e94']); c.fill();
    // ごはん
    const lvl = (this.st.rice / CAP) * 26;
    c.save();
    c.beginPath(); c.ellipse(POT.cx, POT.cy - 4, POT.rx, POT.ry, 0, 0, TAU); c.clip();
    c.fillStyle = '#3a3a3e'; c.fillRect(POT.cx - POT.rx, POT.cy - 70, POT.rx * 2, 140);
    c.beginPath(); c.ellipse(POT.cx, POT.cy + lvl, POT.rx - 2, POT.ry - 2, 0, 0, TAU); c.clip();
    c.fillStyle = '#f2ede0'; c.fillRect(POT.cx - POT.rx, POT.cy - 70, POT.rx * 2, 140);
    grains(c, rng(11), POT.cx - POT.rx, POT.cy - 70, POT.rx * 2, 140, 1.1, 0.62);
    c.fillStyle = rad(c, POT.cx, POT.cy + lvl, POT.rx, ['rgba(255,255,255,.1)', 'rgba(120,100,70,.08)', 'rgba(80,60,30,.35)']);
    c.fillRect(POT.cx - POT.rx, POT.cy - 70, POT.rx * 2, 140);
    c.fillStyle = lin(c, 0, POT.cy - POT.ry, 0, POT.cy, ['rgba(40,30,20,.45)', 'rgba(40,30,20,0)']);
    c.fillRect(POT.cx - POT.rx, POT.cy - 70, POT.rx * 2, 70);
    c.restore();
    c.restore();
  }

  drawBowl(c) {
    const st = this.st, g = this.g(), d = DESIGN_MAP[st.design];
    c.save();
    c.translate(BOWL_X - 500 * BOWL_S, BOWL_Y - g.cy * BOWL_S); c.scale(BOWL_S, BOWL_S);
    drawBowlBack(c, d, g, 3);
    drawRice(c, d, g, st.rice);
    drawBowlFront(c, d, g);
    c.restore();
  }

  renderBg() {
    const key = [this.st.rice, this.st.design, this.st.shape, this.st.bg, this.cv.width].join('|');
    if (this.bgKey === key) return this.bgCache;
    const cv = this.bgCache && this.bgCache.width === this.cv.width ? this.bgCache : mk(this.cv.width, this.cv.height);
    const c = cv.getContext('2d');
    c.setTransform(this.k, 0, 0, this.k, 0, 0);
    c.save(); c.scale(1, H / W); drawBg(c, this.st.bg); c.restore();
    this.drawCooker(c);
    this.drawBowl(c);
    this.bgCache = cv; this.bgKey = key;
    return cv;
  }

  drawShamoji(c, x, y, load, rot) {
    c.save();
    c.translate(x, y); c.rotate(rot);
    c.fillStyle = 'rgba(40,20,0,.18)';
    c.beginPath(); c.ellipse(8, 14, 44, 54, 0, 0, TAU); c.fill();
    // 柄
    rrect(c, -11, 40, 22, 150, 11);
    c.fillStyle = lin(c, -11, 0, 11, 0, ['#e9e2d6', '#fffdf8', '#ddd4c6']); c.fill();
    // 先
    c.beginPath(); c.ellipse(0, 0, 44, 54, 0, 0, TAU);
    c.fillStyle = lin(c, -44, 0, 44, 0, ['#ebe5da', '#fffdf8', '#e2dace']); c.fill();
    c.fillStyle = 'rgba(200,190,175,.6)';
    for (let i = -3; i <= 3; i++) for (let j = -4; j <= 4; j++) { const px = i * 11 + (j % 2 ? 5 : 0), py = j * 11; if ((px * px) / 1600 + (py * py) / 2500 < 0.85) { c.beginPath(); c.arc(px, py, 2.2, 0, TAU); c.fill(); } }
    gloss(c, -16, -18, 14, 22, 0.6);
    if (load > 0) {
      const s = 0.35 + Math.min(1, load / 130) * 0.75;
      c.save(); c.beginPath(); c.ellipse(0, -2, 40 * s, 44 * s, 0, 0, TAU); c.clip();
      c.fillStyle = '#f2ede0'; c.fillRect(-50, -50, 100, 100);
      grains(c, rng(Math.round(load)), -50, -50, 100, 100, 1.2, 0.62);
      c.fillStyle = rad(c, -8, -10, 48 * s, ['rgba(255,255,255,.2)', 'rgba(120,100,70,.3)']); c.fillRect(-50, -50, 100, 100);
      c.restore();
    }
    c.restore();
  }

  spawnSteam(dt) {
    const rate = 0.03 * dt;
    if (Math.random() < rate) this.particles.push({ x: POT.cx + R(Math.random, -110, 110), y: POT.cy - 10, r: R(Math.random, 14, 26), life: 0, max: R(Math.random, 1600, 2600), ph: Math.random() * TAU });
    if (this.st.rice > 0 && Math.random() < rate * 0.5) {
      const g = this.g(), info = riceInfo(g, this.st.rice);
      const top = info.type === 'dome' ? g.cy - g.iy - info.dome * 0.8 : g.cy;
      const [vx, vy] = this.bowlToView(g.cx + R(Math.random, -150, 150), top);
      this.particles.push({ x: vx, y: vy, r: R(Math.random, 10, 18), life: 0, max: R(Math.random, 1200, 2000), ph: Math.random() * TAU });
    }
  }

  loop(t) {
    if (!this.running) return;
    const dt = Math.min(50, t - this.last); this.last = t;
    this.resize();
    const c = this.c;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(this.renderBg(), 0, 0);
    c.setTransform(this.k, 0, 0, this.k, 0, 0);
    // 湯気
    this.spawnSteam(dt);
    c.save(); c.globalCompositeOperation = 'screen';
    this.particles = this.particles.filter((p) => (p.life += dt) < p.max);
    for (const p of this.particles) {
      const u = p.life / p.max;
      const x = p.x + Math.sin(u * 5 + p.ph) * 18 * u, y = p.y - u * 220, rr = p.r * (1 + u * 2.4);
      c.fillStyle = rad(c, x, y, rr, [`rgba(255,255,255,${0.22 * Math.sin(u * Math.PI)})`, 'rgba(255,255,255,0)']);
      c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fill();
    }
    c.restore();
    // すくい中
    const h = this.hold;
    if (h) {
      const p = this.pointer;
      const inSrc = h.from === 'pot' ? this.inPot(p.x, p.y) : this.bowlRiceHit(p.x, p.y);
      if (inSrc) {
        const max = h.from === 'pot' ? 140 : Math.min(140, this.st.rice);
        h.amount = Math.min(max, h.amount + dt * 0.11);
      }
    }
    // 落下アニメ
    const f = this.fall;
    if (f) {
      const u = Math.min(1, (t - f.t0) / f.dur);
      const x = f.x0 + (f.x1 - f.x0) * u, y = f.y0 + (f.y1 - f.y0) * u - Math.sin(u * Math.PI) * 60;
      const s = 0.35 + Math.min(1, f.amt / 130) * 0.75;
      c.save(); c.beginPath(); c.ellipse(x, y, 38 * s * 0.56, 30 * s * 0.56, 0, 0, TAU); c.clip();
      c.fillStyle = '#f4efe2'; c.fillRect(x - 40, y - 40, 80, 80);
      grains(c, rng(5), x - 40, y - 40, 80, 80, 1.2, 0.4);
      c.restore();
      if (u >= 1) {
        this.fall = null;
        this.set(this.st.rice + f.sign * f.amt);
        this.say(f.sign > 0 ? `ぽふっ +${f.amt}g` : `もどした -${f.amt}g`);
      }
    }
    // しゃもじ
    const p = this.pointer;
    const active = !!this.hold || (p.inside && !this.fall);
    const sx = active ? p.x + 6 : 470, sy = active ? p.y + 4 : 440;
    const rot = active ? -0.55 : -0.25;
    if (!this.fall) this.drawShamoji(c, sx, sy, this.hold ? this.hold.amount : 0, rot);
    if (this.hold) {
      c.font = 'bold 30px "Zen Maru Gothic", sans-serif'; c.textAlign = 'center';
      c.lineWidth = 6; c.strokeStyle = '#fff'; c.fillStyle = '#e8577a';
      const txt = (this.hold.from === 'pot' ? '+' : '−') + Math.round(this.hold.amount) + 'g';
      c.strokeText(txt, sx, sy - 74); c.fillText(txt, sx, sy - 74);
    }
    if (this.msg && t < this.msg.until) {
      const a = Math.min(1, (this.msg.until - t) / 300);
      c.globalAlpha = a;
      c.font = 'bold 32px "Zen Maru Gothic", sans-serif'; c.textAlign = 'center';
      c.lineWidth = 7; c.strokeStyle = '#fff'; c.fillStyle = '#7a4a3a';
      c.strokeText(this.msg.t, BOWL_X, 110); c.fillText(this.msg.t, BOWL_X, 110);
      c.globalAlpha = 1;
    }
    requestAnimationFrame((tt) => this.loop(tt));
  }
}
