// 共通ユーティリティ
export const TAU = Math.PI * 2;

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export const R = (r, a, b) => a + (b - a) * r();
export const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function mk(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
  return c;
}

// なめらかな閉曲線
export function smooth(c, pts) {
  const n = pts.length;
  const mid = (i) => { const p = pts[i % n], q = pts[(i + 1) % n]; return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; };
  c.beginPath();
  const s = mid(n - 1);
  c.moveTo(s[0], s[1]);
  for (let i = 0; i < n; i++) { const p = pts[i], e = mid(i); c.quadraticCurveTo(p[0], p[1], e[0], e[1]); }
  c.closePath();
}
// いびつな丸
export function blob(c, cx, cy, rx, ry, irr, n, r, rot = 0) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rot, k = 1 + (r() * 2 - 1) * irr;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  smooth(c, pts);
}
export function rrect(c, x, y, w, h, rad) {
  rad = Math.min(rad, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + rad, y);
  c.arcTo(x + w, y, x + w, y + h, rad);
  c.arcTo(x + w, y + h, x, y + h, rad);
  c.arcTo(x, y + h, x, y, rad);
  c.arcTo(x, y, x + w, y, rad);
  c.closePath();
}
// 粒々テクスチャ
export function dots(c, r, n, x, y, w, h, cols, s0, s1, alpha = 1) {
  c.globalAlpha = alpha;
  for (let i = 0; i < n; i++) {
    c.fillStyle = pick(r, cols);
    const s = R(r, s0, s1);
    c.beginPath();
    c.ellipse(x + r() * w, y + r() * h, s, s * R(r, 0.45, 1), r() * TAU, 0, TAU);
    c.fill();
  }
  c.globalAlpha = 1;
}
// ツヤ
export function gloss(c, x, y, rx, ry, a = 0.5, rot = 0) {
  c.save();
  c.translate(x, y); c.rotate(rot); c.scale(Math.max(rx, 0.01), Math.max(ry, 0.01));
  const g = c.createRadialGradient(0, 0, 0, 0, 0, 1);
  g.addColorStop(0, `rgba(255,255,255,${a})`);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g;
  c.beginPath(); c.arc(0, 0, 1, 0, TAU); c.fill();
  c.restore();
}
function stops(g, s) {
  s.forEach((v, i) => Array.isArray(v) ? g.addColorStop(v[0], v[1]) : g.addColorStop(s.length === 1 ? 0 : i / (s.length - 1), v));
  return g;
}
export const lin = (c, x0, y0, x1, y1, s) => stops(c.createLinearGradient(x0, y0, x1, y1), s);
export const rad = (c, x, y, r1, s, x0 = x, y0 = y, r0 = 0) => stops(c.createRadialGradient(x0, y0, r0, x, y, r1), s);

// 細い繊維（ねぎ、紅しょうが、キャベツなど）
export function strands(c, r, o) {
  const { n, len, w, cols, spread, curl = 0.5, alpha = 1, sy = 1 } = o;
  c.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const a = r() * TAU, d = Math.sqrt(r()) * spread;
    const x = Math.cos(a) * d, y = Math.sin(a) * d * sy;
    const L = R(r, len[0], len[1]), th = o.dir != null ? o.dir + R(r, -o.dirJ, o.dirJ) : r() * TAU;
    const cu = (r() * 2 - 1) * curl;
    const x2 = x + Math.cos(th) * L, y2 = y + Math.sin(th) * L;
    const mx = (x + x2) / 2 + Math.cos(th + Math.PI / 2) * L * cu * 0.5;
    const my = (y + y2) / 2 + Math.sin(th + Math.PI / 2) * L * cu * 0.5;
    c.strokeStyle = pick(r, cols); c.globalAlpha = alpha;
    c.lineWidth = w * R(r, 0.7, 1.25);
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(mx, my, x2, y2); c.stroke();
  }
  c.globalAlpha = 1;
}

// 円をたくさん重ねた形（天ぷらの衣、唐揚げなど）
export function balls(c, list, cols) {
  for (const b of list) {
    c.fillStyle = rad(c, b.x, b.y, b.r, cols, b.x - b.r * 0.35, b.y - b.r * 0.4, 0);
    c.beginPath(); c.arc(b.x, b.y, b.r, 0, TAU); c.fill();
  }
}

export function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 2200);
}
