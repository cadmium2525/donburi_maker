// 具材ライブラリ。すべてCanvasで手描き（手続き生成）しています。
// draw(c, r) は原点中心・シーン座標で描画。r は乱数（同じseedなら同じ見た目）
import { TAU, R, pick, blob, smooth, rrect, dots, gloss, lin, rad, strands, balls } from './util.js';

export const CATS = [
  { id: 'meat', name: 'お肉', icon: '🍖' },
  { id: 'egg', name: 'たまご', icon: '🥚' },
  { id: 'sea', name: '海鮮', icon: '🐟' },
  { id: 'fry', name: '天ぷら・揚げ', icon: '🍤' },
  { id: 'chuka', name: '中華・洋風', icon: '🥘' },
  { id: 'veg', name: '野菜・薬味', icon: '🥬' },
  { id: 'finish', name: 'タレ・仕上げ', icon: '🫙' },
];

export const ING = [];
const P = Math.PI;
function add(o) {
  ING.push(Object.assign({ kind: 'piece', S: 100, rot: P, shadow: 0.35, scale: 1, count: 1, spread: 0, step: 20 }, o));
}

/* ---------------- 共通パーツ ---------------- */
const CRUMB = ['#f8d68e', '#f2bf62', '#b2641b', '#87440f', '#fde6b2', '#e0a248'];

function texture(c, fn) { c.save(); c.globalCompositeOperation = 'source-atop'; fn(); c.restore(); }

function cutlet(c, r, o) {
  const { n, w, h } = o, tot = n * w;
  for (let i = 0; i < n; i++) {
    const k = (i - (n - 1) / 2) / (n / 2);
    const hh = h * (1 - k * k * 0.3) * R(r, 0.95, 1.04);
    const x = -tot / 2 + i * w, y = -hh / 2 + R(r, -5, 5) + k * k * o.curve * 10;
    c.save();
    c.translate(x + w / 2, y + hh / 2); c.rotate(R(r, -0.05, 0.05)); c.translate(-w / 2, -hh / 2);
    rrect(c, 0, 0, w - 2, hh, Math.min(16, w * 0.38));
    c.save(); c.clip();
    c.fillStyle = lin(c, 0, 0, w * 0.8, hh, o.crust); c.fillRect(0, 0, w, hh);
    dots(c, r, (w * hh) / 8, 0, 0, w, hh, CRUMB, 0.7, 2.6, 0.9);
    const fw = w * 0.3;
    c.fillStyle = lin(c, 0, 0, fw, 0, o.meat); c.fillRect(0, 0, fw, hh);
    dots(c, r, hh / 2, 0, 0, fw, hh, ['rgba(255,255,255,.5)', 'rgba(190,140,110,.25)'], 0.5, 1.6);
    if (o.fat) { c.fillStyle = 'rgba(255,250,236,.85)'; c.fillRect(0, 0, fw, hh * 0.12); }
    c.fillStyle = 'rgba(150,85,25,.8)'; c.fillRect(fw - 1.5, 0, 2.6, hh);
    c.fillStyle = lin(c, 0, 0, 0, hh, ['rgba(255,255,255,.18)', 'rgba(0,0,0,0)', 'rgba(60,20,0,.25)']); c.fillRect(0, 0, w, hh);
    c.restore(); c.restore();
  }
  gloss(c, -tot * 0.12, -h * 0.25, tot * 0.32, 12, 0.22, -0.1);
}

function sashimi(c, r, o) {
  const w = o.w || 92, h = o.h || 44;
  c.save(); c.rotate(R(r, -0.05, 0.05));
  const sk = R(r, 8, 14);
  c.beginPath();
  c.moveTo(-w / 2 + sk, -h / 2);
  c.quadraticCurveTo(0, -h / 2 - 4, w / 2, -h / 2 + 2);
  c.quadraticCurveTo(w / 2 + 3, 0, w / 2 - sk, h / 2);
  c.quadraticCurveTo(0, h / 2 + 4, -w / 2, h / 2 - 2);
  c.quadraticCurveTo(-w / 2 - 3, 0, -w / 2 + sk, -h / 2);
  c.closePath();
  c.fillStyle = lin(c, -w / 2, -h / 2, w / 2, h / 2, o.cols); c.fill();
  texture(c, () => {
    if (o.stripes) {
      c.strokeStyle = o.stripes; c.lineCap = 'round';
      for (let i = -6; i < 7; i++) {
        c.lineWidth = R(r, o.sw || 2, (o.sw || 2) * 2);
        const x = i * (o.gap || 12) + R(r, -2, 2);
        c.beginPath(); c.moveTo(x - 20, -h); c.quadraticCurveTo(x + R(r, -8, 8), 0, x + 20, h); c.stroke();
      }
    }
    if (o.band) { c.fillStyle = lin(c, 0, h / 2 - (o.bandW || 10), 0, h / 2, ['rgba(0,0,0,0)', o.band]); c.fillRect(-w, -h, w * 2, h * 2); }
    if (o.lines) { c.strokeStyle = o.lines; c.lineWidth = 1; for (let i = 0; i < 10; i++) { const y = R(r, -h / 2, h / 2); c.beginPath(); c.moveTo(-w / 2, y); c.lineTo(w / 2, y + R(r, -6, 6)); c.stroke(); } }
    c.fillStyle = lin(c, 0, -h / 2, 0, h / 2, ['rgba(255,255,255,.22)', 'rgba(255,255,255,0)', 'rgba(0,0,0,.18)']);
    c.fillRect(-w, -h, w * 2, h * 2);
  });
  gloss(c, -w * 0.15, -h * 0.18, w * 0.3, h * 0.12, 0.7, -0.08);
  gloss(c, w * 0.2, h * 0.05, w * 0.12, h * 0.06, 0.45);
  c.restore();
}

function batterTex(c, r, s) {
  texture(c, () => {
    dots(c, r, s * 6, -s, -s, s * 2, s * 2, ['rgba(255,240,190,.7)', 'rgba(190,120,40,.35)', 'rgba(255,250,220,.6)'], 0.6, 2.2);
  });
}
const BATTER = ['#fbe6ab', '#efc46c', '#d39a42'];

function batterAlong(c, r, path, rr, cols = BATTER) {
  const list = [];
  for (let i = 0; i < path.length; i++) {
    const [x, y] = path[i], rad0 = rr[i];
    // ギザギザの衣（はねたところ）
    for (let k = 0; k < 4; k++) {
      const a = r() * TAU;
      list.push({ x: x + Math.cos(a) * rad0 * R(r, 0.7, 1.05), y: y + Math.sin(a) * rad0 * R(r, 0.7, 1.05), r: R(r, 3, 7) });
    }
  }
  balls(c, list, cols);
  balls(c, path.map((p, i) => ({ x: p[0], y: p[1], r: rr[i] })), cols);
}

function egg(c, r, x, y, rr, cols = ['#ffd04a', '#ffad14', '#e88900']) {
  c.fillStyle = rad(c, x, y, rr, cols, x - rr * 0.3, y - rr * 0.35, 0);
  c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fill();
  gloss(c, x - rr * 0.35, y - rr * 0.38, rr * 0.38, rr * 0.22, 0.9, -0.5);
  gloss(c, x + rr * 0.35, y + rr * 0.35, rr * 0.15, rr * 0.08, 0.4, -0.5);
}

function leafPath(c, len, wid, serr, r) {
  // 中心線に沿ったギザギザ葉っぱ
  const pts = [];
  const n = 28;
  for (let i = 0; i <= n; i++) {
    const t = i / n, w = Math.sin(t * P) * wid * (t < 0.3 ? 0.9 + t : 1.2 - t * 0.4);
    const z = i % 2 === 0 ? 1 : 1 - serr;
    pts.push([t * len, -w * z]);
  }
  for (let i = n - 1; i > 0; i--) {
    const t = i / n, w = Math.sin(t * P) * wid * (t < 0.3 ? 0.9 + t : 1.2 - t * 0.4);
    const z = i % 2 === 0 ? 1 : 1 - serr;
    pts.push([t * len, w * z]);
  }
  c.beginPath();
  c.moveTo(0, 0);
  for (const p of pts) c.lineTo(p[0], p[1]);
  c.closePath();
}

function leaf(c, r, len, wid, cols, serr = 0.12) {
  leafPath(c, len, wid, serr, r);
  c.fillStyle = lin(c, 0, -wid, len, wid, cols); c.fill();
  texture(c, () => {
    c.strokeStyle = 'rgba(220,255,200,.45)'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(len * 0.95, 0); c.stroke();
    c.lineWidth = 0.9;
    for (let i = 1; i < 6; i++) {
      const x = (len * i) / 6.5;
      c.beginPath(); c.moveTo(x, 0); c.quadraticCurveTo(x + 6, -wid * 0.4, x + 12, -wid * 0.9); c.stroke();
      c.beginPath(); c.moveTo(x, 0); c.quadraticCurveTo(x + 6, wid * 0.4, x + 12, wid * 0.9); c.stroke();
    }
    c.fillStyle = 'rgba(0,40,0,.12)'; c.fillRect(0, 0, len, wid * 2);
  });
  gloss(c, len * 0.4, -wid * 0.3, len * 0.25, wid * 0.2, 0.25);
}

function sauceBlob(c, r, rx, ry, cols, o = {}) {
  blob(c, 0, 0, rx, ry, o.irr ?? 0.22, o.n ?? 11, r, r() * TAU);
  c.fillStyle = rad(c, 0, 0, Math.max(rx, ry) * 1.1, cols, -rx * 0.2, -ry * 0.2, 0);
  c.fill();
}

/* ---------------- お肉 ---------------- */
add({ id: 'katsu', name: 'とんかつ', cat: 'meat', S: 290, rot: 0.3,
  draw: (c, r) => cutlet(c, r, { n: 5, w: 47, h: 130, crust: ['#eab04f', '#c67a25', '#9c5517'], meat: ['#fbf1e4', '#efdcc6'], curve: 1.5, fat: true }) });
add({ id: 'chickenkatsu', name: 'チキンカツ', cat: 'meat', S: 270, rot: 0.3,
  draw: (c, r) => cutlet(c, r, { n: 5, w: 42, h: 112, crust: ['#f2c46a', '#d79438', '#ad6b22'], meat: ['#fffaf0', '#f2e6d2'], curve: 2.5 }) });
add({ id: 'gyuniku', name: '牛肉(甘辛煮)', cat: 'meat', S: 130, scale: 1,
  draw: (c, r) => {
    blob(c, 0, 0, 52, 30, 0.3, 11, r);
    c.fillStyle = lin(c, -50, -30, 50, 30, ['#8d5634', '#6a3a20', '#55301a']); c.fill();
    texture(c, () => {
      for (let i = 0; i < 5; i++) {
        c.strokeStyle = `rgba(232,196,150,${R(r, 0.35, 0.65)})`; c.lineWidth = R(r, 2, 5);
        const y = R(r, -25, 25);
        c.beginPath(); c.moveTo(-60, y); c.bezierCurveTo(-20, y + R(r, -15, 15), 20, y + R(r, -15, 15), 60, y + R(r, -10, 10)); c.stroke();
      }
      for (let i = 0; i < 4; i++) {
        c.strokeStyle = 'rgba(40,15,5,.35)'; c.lineWidth = R(r, 2, 6);
        const x = R(r, -40, 40);
        c.beginPath(); c.moveTo(x, -35); c.quadraticCurveTo(x + R(r, -20, 20), 0, x + R(r, -10, 10), 35); c.stroke();
      }
      dots(c, r, 90, -55, -35, 110, 70, ['rgba(255,220,180,.25)', 'rgba(60,25,10,.3)'], 1, 2.5);
    });
    gloss(c, R(r, -15, 10), R(r, -12, 0), 24, 7, 0.5, R(r, -0.4, 0.4));
    gloss(c, R(r, 0, 25), R(r, 4, 14), 12, 4, 0.4);
  } });
add({ id: 'butabara', name: '豚バラ焼肉', cat: 'meat', S: 150,
  draw: (c, r) => {
    blob(c, 0, 0, 62, 24, 0.18, 12, r);
    c.fillStyle = '#b06a3a'; c.fill();
    texture(c, () => {
      let y = -30;
      while (y < 30) {
        const h = R(r, 4, 9), fat = r() < 0.45;
        c.fillStyle = fat ? '#eccb9b' : pick(r, ['#9e5a2c', '#b8703e', '#8a4a22']);
        c.beginPath(); c.moveTo(-70, y); c.bezierCurveTo(-20, y + R(r, -6, 6), 20, y + R(r, -6, 6), 70, y); c.lineTo(70, y + h); c.lineTo(-70, y + h); c.fill();
        y += h;
      }
      for (let i = 0; i < 9; i++) { c.fillStyle = `rgba(50,20,5,${R(r, 0.25, 0.5)})`; c.beginPath(); c.ellipse(R(r, -55, 55), R(r, -18, 18), R(r, 4, 10), R(r, 2, 5), r(), 0, TAU); c.fill(); }
      c.fillStyle = 'rgba(120,50,10,.25)'; c.fillRect(-70, -30, 140, 60);
    });
    gloss(c, -10, -8, 34, 6, 0.55, -0.05);
  } });
add({ id: 'torimomo', name: '鶏もも(煮)', cat: 'meat', S: 90,
  draw: (c, r) => {
    blob(c, 0, 0, 30, 24, 0.22, 9, r);
    c.fillStyle = rad(c, 0, 0, 34, ['#efcd99', '#d5a266', '#b07a3e']); c.fill();
    texture(c, () => {
      blob(c, R(r, -8, 8), R(r, -10, -2), 24, 14, 0.3, 9, r);
      c.fillStyle = 'rgba(244,214,150,.85)'; c.fill();
      dots(c, r, 40, -30, -25, 60, 50, ['rgba(255,240,200,.5)', 'rgba(150,90,40,.3)'], 1, 2.5);
      c.strokeStyle = 'rgba(150,90,40,.35)'; c.lineWidth = 1.2;
      for (let i = 0; i < 4; i++) { c.beginPath(); const y = R(r, -12, 15); c.moveTo(-25, y); c.quadraticCurveTo(0, y + R(r, -6, 6), 25, y + R(r, -4, 4)); c.stroke(); }
    });
    gloss(c, -8, -10, 12, 6, 0.6, -0.3);
  } });
add({ id: 'teriyaki', name: '照り焼きチキン', cat: 'meat', S: 200, rot: 0.5,
  draw: (c, r) => {
    for (let i = 0; i < 4; i++) {
      c.save(); c.translate(-54 + i * 34, R(r, -4, 4)); c.rotate(R(r, -0.08, 0.08));
      rrect(c, -18, -46, 34, 92, 14);
      c.fillStyle = lin(c, -18, 0, 18, 0, ['#f0d5a8', '#e2b57a']); c.fill();
      texture(c, () => {
        c.fillStyle = lin(c, 6, 0, 18, 0, ['rgba(110,50,15,0)', '#6a2d0e', '#3e1806']); c.fillRect(-20, -50, 40, 100);
        dots(c, r, 30, -18, -46, 34, 92, ['rgba(255,245,220,.5)', 'rgba(150,90,40,.3)'], 0.8, 2);
      });
      gloss(c, 12, -10, 4, 22, 0.6);
      c.restore();
    }
  } });
add({ id: 'karaage', name: '唐揚げ', cat: 'meat', S: 100,
  draw: (c, r) => {
    const list = [];
    for (let i = 0; i < 9; i++) { const a = r() * TAU, d = R(r, 0, 16); list.push({ x: Math.cos(a) * d, y: Math.sin(a) * d * 0.85, r: R(r, 14, 22) }); }
    balls(c, list, ['#e7a14a', '#c06620', '#86400f']);
    texture(c, () => dots(c, r, 140, -40, -40, 80, 80, ['rgba(255,210,130,.55)', 'rgba(90,30,5,.4)', 'rgba(240,170,80,.5)'], 0.8, 2.6));
    gloss(c, -8, -12, 12, 6, 0.55, -0.4);
  } });
add({ id: 'chashu', name: 'チャーシュー', cat: 'meat', S: 120,
  draw: (c, r) => {
    blob(c, 0, 0, 46, 40, 0.1, 10, r);
    c.fillStyle = '#6b3a1d'; c.fill();
    blob(c, R(r, -2, 2), R(r, -2, 2), 39, 33, 0.1, 10, r);
    c.fillStyle = rad(c, 0, 0, 40, ['#efc9a6', '#d99b73', '#b9724a']); c.fill();
    texture(c, () => {
      c.strokeStyle = 'rgba(255,244,228,.75)'; c.lineWidth = 6;
      c.beginPath(); c.arc(R(r, -5, 5), R(r, -5, 5), R(r, 12, 20), r() * TAU, r() * TAU + 3.5); c.stroke();
      c.lineWidth = 3; c.beginPath(); c.arc(0, 0, R(r, 24, 30), r() * TAU, r() * TAU + 2); c.stroke();
      dots(c, r, 60, -45, -40, 90, 80, ['rgba(255,230,210,.3)', 'rgba(140,70,40,.25)'], 1, 2.5);
    });
    gloss(c, -12, -14, 18, 8, 0.55, -0.4);
  } });
add({ id: 'soboro', name: '鶏そぼろ', cat: 'meat', kind: 'sprinkle', S: 12, count: 34, spread: 46, shadow: 0.2,
  draw: (c, r) => { blob(c, 0, 0, 4, 3.4, 0.35, 6, r); c.fillStyle = pick(r, ['#a5703f', '#8a5a2e', '#b8824e', '#7a4c25']); c.fill(); gloss(c, -1, -1, 1.6, 1, 0.5); } });
add({ id: 'roastbeef', name: 'ローストビーフ', cat: 'meat', S: 140,
  draw: (c, r) => {
    blob(c, 0, 0, 56, 36, 0.2, 10, r);
    c.fillStyle = rad(c, 0, 0, 58, ['#d23a4a', '#b52b3b', '#933037', [0.86, '#7a3a28'], [1, '#5c2c1a']]); c.fill();
    texture(c, () => {
      c.strokeStyle = 'rgba(255,200,200,.25)'; c.lineWidth = 2;
      for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-50, R(r, -20, 20)); c.quadraticCurveTo(0, R(r, -30, 30), 50, R(r, -20, 20)); c.stroke(); }
      c.strokeStyle = 'rgba(60,10,10,.3)'; c.lineWidth = 5;
      c.beginPath(); c.moveTo(R(r, -30, 0), -40); c.quadraticCurveTo(R(r, -10, 10), 0, R(r, 0, 30), 40); c.stroke();
    });
    gloss(c, -10, -12, 26, 8, 0.6, -0.2);
    gloss(c, 18, 8, 10, 4, 0.45);
  } });
add({ id: 'kakuni', name: '豚の角煮', cat: 'meat', S: 100,
  draw: (c, r) => {
    rrect(c, -32, -28, 64, 56, 10);
    c.fillStyle = '#7a3c18'; c.fill();
    texture(c, () => {
      const bands = [['#5a2a10', 9], ['#e8c59a', 8], ['#9a5a30', 9], ['#efcfa8', 7], ['#8a4a24', 10], ['#e5bf92', 7], ['#6a3214', 12]];
      let y = -30;
      for (const [col, h] of bands) { c.fillStyle = col; c.beginPath(); c.moveTo(-40, y); c.quadraticCurveTo(0, y + R(r, -3, 3), 40, y); c.lineTo(40, y + h); c.lineTo(-40, y + h); c.fill(); y += h; }
      c.fillStyle = 'rgba(100,40,5,.35)'; c.fillRect(-40, -30, 80, 60);
      c.fillStyle = lin(c, -32, 0, 32, 0, ['rgba(0,0,0,.25)', 'rgba(0,0,0,0)', 'rgba(0,0,0,.3)']); c.fillRect(-40, -30, 80, 60);
    });
    gloss(c, -8, -14, 20, 6, 0.75, -0.1);
    gloss(c, 14, 10, 8, 3, 0.5);
  } });
add({ id: 'hamburg', name: 'ハンバーグ', cat: 'meat', S: 160, rot: 0.6,
  draw: (c, r) => {
    blob(c, 0, 0, 64, 46, 0.08, 12, r);
    c.fillStyle = rad(c, 0, 0, 66, ['#7a4326', '#5a2c16', '#3e1c0c']); c.fill();
    texture(c, () => dots(c, r, 300, -66, -48, 132, 96, ['rgba(160,100,60,.4)', 'rgba(30,10,0,.4)', 'rgba(200,140,90,.25)'], 0.8, 2.4));
    blob(c, R(r, -6, 6), R(r, -6, 0), 44, 28, 0.25, 10, r);
    c.fillStyle = rad(c, 0, -4, 44, ['#5a200c', '#421607', '#2e0f05']); c.fill();
    gloss(c, -12, -12, 22, 7, 0.65, -0.2);
    gloss(c, 14, 4, 9, 4, 0.5);
  } });

/* ---------------- たまご ---------------- */
add({ id: 'tokitamago', name: '溶き卵(半熟とじ)', cat: 'egg', kind: 'sauce', S: 140, step: 30, shadow: 0.1,
  draw: (c, r) => {
    blob(c, 0, 0, 56, 46, 0.32, 14, r);
    c.fillStyle = rad(c, 0, 0, 58, ['rgba(255,214,70,.97)', 'rgba(252,206,60,.95)', 'rgba(245,200,90,.85)']); c.fill();
    texture(c, () => {
      for (let i = 0; i < 16; i++) {
        blob(c, R(r, -45, 45), R(r, -38, 38), R(r, 6, 20), R(r, 4, 12), 0.45, 8, r, r() * 6);
        c.fillStyle = pick(r, ['rgba(255,196,20,.9)', 'rgba(250,180,10,.8)', 'rgba(255,253,240,.9)', 'rgba(255,255,248,.8)', 'rgba(255,232,140,.8)']);
        c.fill();
      }
      c.strokeStyle = 'rgba(255,255,245,.85)'; c.lineWidth = 3; c.lineCap = 'round';
      for (let i = 0; i < 5; i++) { c.beginPath(); const x = R(r, -40, 30), y = R(r, -30, 30); c.moveTo(x, y); c.bezierCurveTo(x + 10, y - 12, x + 20, y + 12, x + R(r, 25, 40), y + R(r, -8, 8)); c.stroke(); }
      c.fillStyle = lin(c, 0, -46, 0, 46, ['rgba(255,255,255,.12)', 'rgba(0,0,0,0)', 'rgba(170,110,20,.18)']); c.fillRect(-70, -60, 140, 120);
    });
    for (let i = 0; i < 4; i++) gloss(c, R(r, -35, 35), R(r, -30, 30), R(r, 6, 12), R(r, 3, 5), 0.7, r());
  } });
add({ id: 'ranou', name: '卵黄(生)', cat: 'egg', S: 64, rot: 0, draw: (c, r) => egg(c, r, 0, 0, 23) });
add({ id: 'namatamago', name: '生卵(割り落とし)', cat: 'egg', S: 130, rot: 0.3,
  draw: (c, r) => {
    blob(c, 0, 0, 52, 44, 0.16, 10, r);
    c.fillStyle = 'rgba(245,240,215,.38)'; c.fill();
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2; c.stroke();
    blob(c, 4, 2, 32, 28, 0.12, 9, r);
    c.fillStyle = 'rgba(250,245,225,.35)'; c.fill();
    gloss(c, -22, -16, 14, 6, 0.6, -0.5);
    egg(c, r, 6, 4, 22);
  } });
add({ id: 'onsen', name: '温泉卵', cat: 'egg', S: 120, rot: 0.3,
  draw: (c, r) => {
    blob(c, 0, 0, 44, 38, 0.18, 10, r);
    c.fillStyle = rad(c, 0, 0, 46, ['rgba(255,255,252,.97)', 'rgba(252,250,242,.9)', 'rgba(240,236,224,.55)']); c.fill();
    egg(c, r, 3, 3, 21, ['#ffd768', '#f8b43a', '#e99a1c']);
    c.save(); c.beginPath(); c.arc(3, 3, 22, 0, TAU); c.clip();
    blob(c, R(r, -12, -2), R(r, -14, -4), 22, 16, 0.3, 8, r);
    c.fillStyle = 'rgba(255,255,250,.55)'; c.fill(); c.restore();
    gloss(c, -14, -14, 14, 6, 0.6, -0.5);
  } });
add({ id: 'medamayaki', name: '目玉焼き', cat: 'egg', S: 150, rot: 0.5,
  draw: (c, r) => {
    blob(c, 0, 0, 60, 50, 0.2, 11, r);
    c.fillStyle = '#c38a48'; c.fill();
    blob(c, 0, 0, 55, 45, 0.18, 11, r);
    c.fillStyle = rad(c, 0, 0, 58, ['#ffffff', '#fffdf6', '#f6efe0']); c.fill();
    texture(c, () => {
      c.strokeStyle = 'rgba(200,140,70,.6)'; c.lineWidth = 6;
      blob(c, 0, 0, 56, 46, 0.18, 11, r); c.stroke();
      dots(c, r, 30, -60, -50, 120, 100, ['rgba(220,200,170,.3)'], 1, 3);
    });
    egg(c, r, R(r, -6, 6), R(r, -6, 6), 22);
    gloss(c, -26, 14, 14, 5, 0.6);
  } });
add({ id: 'tamagoyaki', name: '厚焼き玉子', cat: 'egg', S: 100, rot: P,
  draw: (c, r) => {
    rrect(c, -36, -18, 72, 36, 8);
    c.fillStyle = lin(c, 0, -18, 0, 18, ['#ffe27a', '#f9d04a', '#efbd34']); c.fill();
    texture(c, () => {
      c.strokeStyle = 'rgba(230,170,40,.55)'; c.lineWidth = 1.4;
      for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(-36, i * 5); c.quadraticCurveTo(0, i * 5 + R(r, -2, 2), 36, i * 5); c.stroke(); }
      dots(c, r, 14, -36, -18, 72, 36, ['rgba(190,120,30,.35)'], 1.5, 4);
    });
    gloss(c, -10, -8, 18, 4, 0.45);
  } });
add({ id: 'kinshi', name: '錦糸卵', cat: 'egg', kind: 'sprinkle', S: 52, count: 12, spread: 44, shadow: 0.2,
  draw: (c, r) => { c.lineCap = 'round'; c.strokeStyle = pick(r, ['#f9d84a', '#f6cf33', '#fbe06e']); c.lineWidth = R(r, 3, 4.2); c.beginPath(); c.moveTo(-20, 0); c.quadraticCurveTo(0, R(r, -6, 6), 20, R(r, -3, 3)); c.stroke(); } });
add({ id: 'irotamago', name: '炒り卵', cat: 'egg', kind: 'sprinkle', S: 16, count: 26, spread: 44, shadow: 0.2,
  draw: (c, r) => { blob(c, 0, 0, 5, 4, 0.4, 7, r); c.fillStyle = pick(r, ['#f9d64a', '#f5c518', '#fbe27a']); c.fill(); gloss(c, -1, -1, 2, 1, 0.5); } });
add({ id: 'ajitama', name: '味玉(半分)', cat: 'egg', S: 84, rot: P,
  draw: (c, r) => {
    c.beginPath(); c.ellipse(0, 0, 34, 27, 0, 0, TAU);
    c.fillStyle = rad(c, 0, 0, 36, ['#f2e2c6', '#e2c08f', '#c89055']); c.fill();
    c.beginPath(); c.ellipse(1, 0, 18, 15, 0, 0, TAU);
    c.fillStyle = rad(c, 0, 0, 18, ['#ff9f1c', '#f08c0a', '#e6a52e']); c.fill();
    gloss(c, -3, -4, 8, 4, 0.75, -0.4);
    gloss(c, -14, -12, 9, 4, 0.4, -0.5);
  } });
add({ id: 'yudetamago', name: 'ゆで卵(半分)', cat: 'egg', S: 84, rot: P,
  draw: (c, r) => {
    c.beginPath(); c.ellipse(0, 0, 34, 27, 0, 0, TAU);
    c.fillStyle = rad(c, 0, 0, 36, ['#ffffff', '#fbf8f0', '#ece4d4']); c.fill();
    c.beginPath(); c.ellipse(1, 0, 17, 14, 0, 0, TAU);
    c.fillStyle = rad(c, 0, 0, 17, ['#fbe27a', '#f6d14a', '#ecc044']); c.fill();
    texture(c, () => dots(c, r, 40, -17, -14, 34, 28, ['rgba(255,240,170,.6)', 'rgba(220,170,40,.4)'], 0.8, 1.8));
    gloss(c, -14, -12, 9, 4, 0.45, -0.5);
  } });
add({ id: 'uzura', name: 'うずらの卵', cat: 'egg', kind: 'sprinkle', S: 40, count: 1, spread: 0, rot: P,
  draw: (c, r) => {
    c.beginPath(); c.ellipse(0, 0, 15, 12, 0, 0, TAU);
    c.fillStyle = rad(c, 0, 0, 16, ['#fffaf0', '#f0dfc0', '#d8b888'], -4, -4); c.fill();
    gloss(c, -5, -5, 6, 3, 0.8, -0.5);
  } });

/* ---------------- 海鮮 ---------------- */
add({ id: 'maguro', name: 'マグロ(赤身)', cat: 'sea', S: 112, rot: P,
  draw: (c, r) => sashimi(c, r, { cols: ['#c0172f', '#a10f25', '#850b1d'], lines: 'rgba(255,255,255,.06)' }) });
add({ id: 'chutoro', name: '中トロ', cat: 'sea', S: 112, rot: P,
  draw: (c, r) => sashimi(c, r, { cols: ['#ef7f8f', '#e0627a', '#c94b64'], stripes: 'rgba(255,236,236,.55)', gap: 13, sw: 1.6 }) });
add({ id: 'salmon', name: 'サーモン', cat: 'sea', S: 112, rot: P,
  draw: (c, r) => sashimi(c, r, { cols: ['#ff9a5c', '#f97a3a', '#e8632a'], stripes: 'rgba(255,238,224,.85)', gap: 11, sw: 2 }) });
add({ id: 'hamachi', name: 'ハマチ', cat: 'sea', S: 112, rot: P,
  draw: (c, r) => sashimi(c, r, { cols: ['#f6ddd0', '#ecc6b4', '#e3b7a3'], band: '#b23a44', bandW: 14, stripes: 'rgba(255,255,255,.25)', gap: 16 }) });
add({ id: 'tai', name: '鯛', cat: 'sea', S: 112, rot: P,
  draw: (c, r) => sashimi(c, r, { cols: ['rgba(255,252,248,.95)', 'rgba(246,238,232,.92)', 'rgba(236,226,220,.9)'], band: '#e86d7b', bandW: 8, stripes: 'rgba(230,200,200,.3)', gap: 14, sw: 1 }) });
add({ id: 'ika', name: 'イカ', cat: 'sea', S: 112, rot: P,
  draw: (c, r) => {
    sashimi(c, r, { cols: ['#fffefb', '#f6f4ee', '#e9e6dc'], w: 96, h: 40 });
    c.strokeStyle = 'rgba(200,195,185,.6)'; c.lineWidth = 1;
    for (let i = -4; i <= 4; i++) { c.beginPath(); c.moveTo(i * 10 - 8, -16); c.lineTo(i * 10 + 8, 16); c.stroke(); }
  } });
add({ id: 'tako', name: 'タコ', cat: 'sea', S: 86, rot: P,
  draw: (c, r) => {
    blob(c, 0, 0, 34, 24, 0.1, 10, r);
    c.fillStyle = '#fbf3ec'; c.fill();
    texture(c, () => {
      c.fillStyle = lin(c, 0, -30, 0, 10, ['#7a1430', '#a8274a', 'rgba(220,120,140,0)']); c.fillRect(-40, -30, 80, 60);
      for (let i = 0; i < 5; i++) { c.fillStyle = 'rgba(255,230,230,.85)'; c.beginPath(); c.arc(-26 + i * 13, 18, 4, 0, TAU); c.fill(); c.strokeStyle = 'rgba(200,120,130,.6)'; c.stroke(); }
    });
    gloss(c, -8, -10, 14, 5, 0.6);
  } });
add({ id: 'amaebi', name: '甘エビ', cat: 'sea', S: 120, rot: P,
  draw: (c, r) => {
    c.beginPath();
    c.moveTo(-44, -6); c.quadraticCurveTo(-10, -22, 30, -10); c.quadraticCurveTo(38, -4, 34, 6);
    c.quadraticCurveTo(-8, 4, -42, 10); c.closePath();
    c.fillStyle = lin(c, 0, -20, 0, 10, ['rgba(255,170,170,.95)', 'rgba(255,140,150,.9)', 'rgba(250,200,200,.85)']); c.fill();
    texture(c, () => { c.strokeStyle = 'rgba(230,90,110,.5)'; c.lineWidth = 1.5; for (let i = 0; i < 6; i++) { const x = -32 + i * 11; c.beginPath(); c.moveTo(x, -18); c.quadraticCurveTo(x + 3, -4, x, 10); c.stroke(); } });
    c.fillStyle = '#e8434c';
    c.beginPath(); c.moveTo(32, -6); c.lineTo(50, -18); c.lineTo(46, 0); c.lineTo(52, 12); c.closePath(); c.fill();
    gloss(c, -10, -10, 18, 4, 0.75, -0.2);
  } });
add({ id: 'ikura', name: 'いくら', cat: 'sea', kind: 'sprinkle', S: 20, count: 14, spread: 26, shadow: 0.25, rot: P,
  draw: (c, r) => {
    const rr = R(r, 6.3, 7.4);
    c.fillStyle = rad(c, 0, 0, rr, ['#ff9a2e', '#f2600a', '#c63c00'], -1, -1, 0);
    c.beginPath(); c.arc(0, 0, rr, 0, TAU); c.fill();
    c.fillStyle = 'rgba(200,40,0,.6)'; c.beginPath(); c.arc(1.5, 1.5, 2, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.95)'; c.beginPath(); c.ellipse(-2.4, -2.6, 1.8, 1.1, -0.6, 0, TAU); c.fill();
  } });
add({ id: 'uni', name: 'うに', cat: 'sea', S: 80, rot: P,
  draw: (c, r) => {
    for (let i = 0; i < 3; i++) {
      c.save(); c.translate(-18 + i * 18, R(r, -3, 3)); c.rotate(R(r, -0.3, 0.3) + P / 2);
      blob(c, 0, 0, 26, 9, 0.12, 10, r);
      c.fillStyle = lin(c, 0, -10, 0, 10, ['#ffc34a', '#f59e1c', '#e2850c']); c.fill();
      texture(c, () => dots(c, r, 50, -26, -10, 52, 20, ['rgba(255,220,120,.7)', 'rgba(200,110,0,.4)'], 0.8, 1.8));
      gloss(c, -6, -3, 10, 2.5, 0.6);
      c.restore();
    }
  } });
add({ id: 'hotate', name: 'ホタテ', cat: 'sea', S: 80, rot: P,
  draw: (c, r) => {
    c.beginPath(); c.ellipse(0, 0, 30, 28, 0, 0, TAU);
    c.fillStyle = rad(c, 0, 0, 30, ['#fffaf0', '#f6ead6', '#e9d8bb']); c.fill();
    texture(c, () => { c.strokeStyle = 'rgba(220,200,170,.45)'; c.lineWidth = 1; for (let i = -28; i < 30; i += 4) { c.beginPath(); c.moveTo(i, -30); c.quadraticCurveTo(i + R(r, -3, 3), 0, i, 30); c.stroke(); } });
    gloss(c, -9, -10, 12, 6, 0.75, -0.4);
  } });
add({ id: 'negitoro', name: 'ネギトロ', cat: 'sea', S: 120, rot: P,
  draw: (c, r) => {
    blob(c, 0, 0, 46, 38, 0.25, 12, r);
    c.fillStyle = rad(c, 0, 0, 48, ['#f59aa4', '#e36f82', '#cf566c']); c.fill();
    texture(c, () => dots(c, r, 220, -50, -42, 100, 84, ['rgba(255,220,225,.5)', 'rgba(170,40,60,.35)', 'rgba(255,180,190,.6)'], 1, 3.2));
    gloss(c, -12, -12, 16, 7, 0.55, -0.4);
  } });
add({ id: 'tobiko', name: 'とびっこ', cat: 'sea', kind: 'sprinkle', S: 7, count: 46, spread: 34, shadow: 0.15,
  draw: (c, r) => { c.fillStyle = rad(c, 0, 0, 2.6, ['#ffa04a', '#ff6a13', '#e24800'], -0.7, -0.7, 0); c.beginPath(); c.arc(0, 0, 2.4, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.9)'; c.fillRect(-1.1, -1.1, 0.8, 0.8); } });
add({ id: 'shirasu', name: 'しらす', cat: 'sea', kind: 'sprinkle', S: 30, count: 22, spread: 44, shadow: 0.15,
  draw: (c, r) => {
    c.lineCap = 'round'; c.strokeStyle = 'rgba(252,250,240,.95)'; c.lineWidth = 2.8;
    const b = R(r, -5, 5);
    c.beginPath(); c.moveTo(-11, 0); c.quadraticCurveTo(0, b, 11, R(r, -2, 2)); c.stroke();
    c.strokeStyle = 'rgba(210,200,180,.6)'; c.lineWidth = 0.8; c.stroke();
    c.fillStyle = '#222'; c.beginPath(); c.arc(-10, 0, 0.9, 0, TAU); c.fill();
  } });
add({ id: 'kani', name: 'カニ(脚)', cat: 'sea', S: 120, rot: P,
  draw: (c, r) => {
    rrect(c, -46, -10, 92, 20, 9);
    c.fillStyle = lin(c, 0, -10, 0, 10, ['#e84a35', '#f2795f', '#fff1e8', '#ffffff']); c.fill();
    texture(c, () => { c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1; for (let i = 0; i < 8; i++) { const y = R(r, 0, 9); c.beginPath(); c.moveTo(-46, y); c.lineTo(46, y + R(r, -1, 1)); c.stroke(); } dots(c, r, 30, -46, -10, 92, 8, ['rgba(180,30,20,.4)'], 0.6, 1.4); });
    gloss(c, -10, -5, 24, 2.5, 0.7);
  } });
add({ id: 'unagi', name: 'うなぎ蒲焼', cat: 'sea', S: 200, rot: 0.3,
  draw: (c, r) => {
    c.beginPath();
    c.moveTo(-78, -30); c.quadraticCurveTo(0, -40, 78, -28); c.quadraticCurveTo(84, 0, 76, 30);
    c.quadraticCurveTo(0, 38, -76, 30); c.quadraticCurveTo(-84, 0, -78, -30); c.closePath();
    c.fillStyle = lin(c, 0, -36, 0, 36, ['#3a1c0a', '#7a4214', '#8e5220', '#6b3a12', '#3e1e08']); c.fill();
    texture(c, () => {
      for (let i = 0; i < 26; i++) { c.fillStyle = `rgba(25,10,0,${R(r, 0.25, 0.6)})`; c.beginPath(); c.ellipse(R(r, -75, 75), R(r, -28, 28), R(r, 3, 12), R(r, 2, 6), r(), 0, TAU); c.fill(); }
      c.strokeStyle = 'rgba(200,130,60,.35)'; c.lineWidth = 2;
      for (let i = -7; i < 8; i++) { c.beginPath(); c.moveTo(i * 11, -34); c.quadraticCurveTo(i * 11 + 4, 0, i * 11, 34); c.stroke(); }
      c.fillStyle = 'rgba(30,15,5,.85)'; c.fillRect(-90, -40, 180, 6);
    });
    gloss(c, -20, -12, 50, 7, 0.65, -0.03);
    gloss(c, 30, 10, 22, 4, 0.45);
  } });
add({ id: 'anago', name: '穴子', cat: 'sea', S: 200, rot: 0.3,
  draw: (c, r) => {
    c.beginPath();
    c.moveTo(-80, -22); c.quadraticCurveTo(0, -30, 80, -18); c.quadraticCurveTo(86, 0, 78, 22);
    c.quadraticCurveTo(0, 28, -78, 22); c.quadraticCurveTo(-86, 0, -80, -22); c.closePath();
    c.fillStyle = lin(c, 0, -26, 0, 26, ['#8a5626', '#c08850', '#d4a06a', '#a46c38']); c.fill();
    texture(c, () => {
      dots(c, r, 80, -80, -24, 160, 48, ['rgba(255,230,190,.35)', 'rgba(90,50,20,.3)'], 1, 3);
      c.fillStyle = 'rgba(70,40,20,.6)'; c.fillRect(-90, -30, 180, 6);
    });
    gloss(c, -20, -8, 46, 5, 0.5);
  } });

/* ---------------- 天ぷら・揚げ ---------------- */
add({ id: 'ebiten', name: 'エビ天', cat: 'fry', S: 220, rot: P,
  draw: (c, r) => {
    const path = [], rr = [];
    for (let i = 0; i <= 12; i++) { const t = i / 12; path.push([-82 + t * 150, Math.sin(t * P) * -10 + R(r, -2, 2)]); rr.push(26 - t * 12 + R(r, -2, 2)); }
    batterAlong(c, r, path, rr);
    batterTex(c, r, 90);
    // しっぽ
    c.save(); c.translate(72, -2);
    c.fillStyle = lin(c, 0, -14, 26, 14, ['#c42a20', '#ef5a3a', '#a01810']);
    c.beginPath(); c.moveTo(-4, -4); c.quadraticCurveTo(14, -22, 30, -16); c.quadraticCurveTo(20, -4, 30, 2); c.quadraticCurveTo(20, 8, 30, 18); c.quadraticCurveTo(12, 20, -4, 6); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(90,0,0,.4)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, 0); c.lineTo(26, -12); c.moveTo(0, 2); c.lineTo(26, 14); c.stroke();
    gloss(c, 12, -8, 8, 3, 0.6, -0.5);
    c.restore();
  } });
add({ id: 'kakiage', name: 'かき揚げ', cat: 'fry', S: 160, rot: P,
  draw: (c, r) => {
    const list = [];
    for (let i = 0; i < 36; i++) { const a = r() * TAU, d = Math.sqrt(r()) * 50; list.push({ x: Math.cos(a) * d, y: Math.sin(a) * d * 0.9, r: R(r, 8, 16) }); }
    balls(c, list, BATTER);
    texture(c, () => {
      strands(c, r, { n: 18, len: [20, 40], w: 3.5, cols: ['#f08a24', '#e9771a'], spread: 46, curl: 0.4 });
      strands(c, r, { n: 10, len: [14, 26], w: 3, cols: ['#4f9a33', '#3f8a2a'], spread: 46, curl: 0.4 });
      strands(c, r, { n: 14, len: [20, 36], w: 4, cols: ['rgba(255,245,215,.7)'], spread: 46, curl: 0.6 });
    });
    const top = [];
    for (let i = 0; i < 14; i++) { const a = r() * TAU, d = Math.sqrt(r()) * 46; top.push({ x: Math.cos(a) * d, y: Math.sin(a) * d * 0.9, r: R(r, 4, 9) }); }
    balls(c, top, ['rgba(251,230,171,.9)', 'rgba(239,196,108,.9)', 'rgba(211,154,66,.9)']);
    batterTex(c, r, 60);
  } });
add({ id: 'nasuten', name: 'なす天', cat: 'fry', S: 130, rot: P,
  draw: (c, r) => {
    c.beginPath(); c.ellipse(0, 0, 50, 26, 0, 0, TAU);
    c.fillStyle = lin(c, 0, -26, 0, 26, ['#3b1d4a', '#5a2e6a', '#e8e0b0', '#efe6c0']); c.fill();
    texture(c, () => {
      c.strokeStyle = 'rgba(60,30,70,.8)'; c.lineWidth = 3;
      for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(-46, 0); c.quadraticCurveTo(0, i * 8, 46, i * 3); c.stroke(); }
      const list = []; for (let i = 0; i < 20; i++) list.push({ x: R(r, -46, 46), y: R(r, -22, 22), r: R(r, 4, 9) });
      c.globalAlpha = 0.55; balls(c, list, BATTER); c.globalAlpha = 1;
    });
    batterTex(c, r, 55);
    gloss(c, -10, -10, 20, 5, 0.4);
  } });
add({ id: 'kabochaten', name: 'かぼちゃ天', cat: 'fry', S: 120, rot: P,
  draw: (c, r) => {
    c.beginPath(); c.arc(0, 20, 46, P * 1.05, P * 1.95); c.arc(0, 20, 30, P * 1.92, P * 1.08, true); c.closePath();
    c.fillStyle = '#f2a33a'; c.fill();
    c.beginPath(); c.arc(0, 20, 46, P * 1.05, P * 1.95); c.strokeStyle = '#2f4a2a'; c.lineWidth = 5; c.stroke();
    texture(c, () => {
      const list = []; for (let i = 0; i < 18; i++) { const a = R(r, P * 1.05, P * 1.95), d = R(r, 30, 46); list.push({ x: Math.cos(a) * d, y: 20 + Math.sin(a) * d, r: R(r, 4, 8) }); }
      c.globalAlpha = 0.6; balls(c, list, BATTER); c.globalAlpha = 1;
    });
    batterTex(c, r, 50);
  } });
add({ id: 'shishitoten', name: 'ししとう天', cat: 'fry', S: 110, rot: P,
  draw: (c, r) => {
    c.beginPath(); c.moveTo(-40, 0); c.quadraticCurveTo(-10, -12, 34, -4); c.quadraticCurveTo(40, 2, 34, 6); c.quadraticCurveTo(-10, 12, -40, 0); c.closePath();
    c.fillStyle = lin(c, 0, -10, 0, 10, ['#6cae3a', '#3f7d22', '#2f6418']); c.fill();
    texture(c, () => { const list = []; for (let i = 0; i < 10; i++) list.push({ x: R(r, -36, 30), y: R(r, -8, 8), r: R(r, 3, 7) }); c.globalAlpha = 0.6; balls(c, list, BATTER); c.globalAlpha = 1; });
    c.strokeStyle = '#6b8a3a'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(36, 1); c.lineTo(48, -4); c.stroke();
    gloss(c, -8, -5, 16, 2.5, 0.5);
  } });
add({ id: 'maitaketen', name: '舞茸天', cat: 'fry', S: 120, rot: P,
  draw: (c, r) => {
    for (let i = 0; i < 9; i++) {
      c.save(); c.rotate(-1.2 + i * 0.3 + R(r, -0.1, 0.1)); c.translate(0, -18);
      blob(c, 0, -10, 18, 12, 0.3, 8, r);
      c.fillStyle = lin(c, 0, -22, 0, 4, ['#6b4a30', '#a07850', '#e8c47a']); c.fill();
      c.restore();
    }
    const list = []; for (let i = 0; i < 14; i++) list.push({ x: R(r, -24, 24), y: R(r, -16, 22), r: R(r, 4, 9) });
    balls(c, list, BATTER);
    batterTex(c, r, 50);
  } });
add({ id: 'chikuwaten', name: 'ちくわ天(磯辺)', cat: 'fry', S: 120, rot: P,
  draw: (c, r) => {
    rrect(c, -44, -15, 88, 30, 14);
    c.fillStyle = lin(c, 0, -15, 0, 15, ['#f2d88a', '#ddb257', '#c69a40']); c.fill();
    texture(c, () => { dots(c, r, 70, -44, -15, 88, 30, ['#3e7d2c', '#2e6820', '#5a9a3a'], 0.8, 1.8); dots(c, r, 60, -44, -15, 88, 30, ['rgba(255,240,190,.6)'], 0.8, 2); });
    c.fillStyle = '#d8b48a'; c.beginPath(); c.ellipse(44, 0, 6, 13, 0, 0, TAU); c.fill();
    c.fillStyle = '#5a3a20'; c.beginPath(); c.ellipse(44, 0, 3, 6, 0, 0, TAU); c.fill();
  } });
add({ id: 'tonsauce', name: 'とんかつソース', cat: 'fry', kind: 'sauce', S: 30, step: 6, shadow: 0.1,
  draw: (c, r) => { c.fillStyle = rad(c, 0, 0, 9, ['#4a2210', '#3b1a0a', 'rgba(50,20,5,.9)']); c.beginPath(); c.arc(0, 0, R(r, 7.5, 9), 0, TAU); c.fill(); gloss(c, -2, -3, 3, 1.5, 0.6); } });

/* ---------------- 中華・洋風 ---------------- */
add({ id: 'mabo', name: '麻婆豆腐', cat: 'chuka', kind: 'sauce', S: 150, step: 30, shadow: 0.06,
  draw: (c, r) => {
    sauceBlob(c, r, 60, 52, ['#d4501f', '#c23c14', '#b0300e']);
    texture(c, () => {
      dots(c, r, 120, -60, -55, 120, 110, ['rgba(110,40,15,.75)', 'rgba(150,60,20,.7)', 'rgba(90,30,10,.6)'], 1.2, 3.2);
    });
    for (let i = 0; i < 4; i++) {
      const x = R(r, -32, 28), y = R(r, -28, 24), s = R(r, 16, 22);
      c.fillStyle = '#f7e0c4'; c.fillRect(x, y, s, s);
      c.fillStyle = 'rgba(210,90,40,.35)'; c.fillRect(x, y + s * 0.65, s, s * 0.35);
      c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(x + 2, y + 2, s * 0.5, 2);
      c.fillStyle = 'rgba(200,60,20,.35)'; dots(c, r, 6, x, y, s, s, ['rgba(180,50,15,.5)'], 0.8, 1.6);
    }
    dots(c, r, 8, -40, -35, 80, 70, ['#4f9a33'], 2, 3.2);
    for (let i = 0; i < 4; i++) gloss(c, R(r, -40, 40), R(r, -36, 36), R(r, 6, 12), R(r, 2, 4), 0.7, r());
  } });
add({ id: 'tofu', name: '豆腐(角切り)', cat: 'chuka', kind: 'sprinkle', S: 40, count: 3, spread: 30, rot: 0.4,
  draw: (c, r) => {
    const s = R(r, 22, 26);
    c.fillStyle = '#fffcf2'; c.fillRect(-s / 2, -s / 2, s, s);
    c.fillStyle = '#ece4d2'; c.fillRect(-s / 2, s / 2 - 6, s, 6);
    c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(-s / 2 + 2, -s / 2 + 2, s - 6, 3);
  } });
add({ id: 'happosai', name: '中華あん(八宝菜)', cat: 'chuka', kind: 'sauce', S: 160, step: 34, shadow: 0.06,
  draw: (c, r) => {
    sauceBlob(c, r, 64, 56, ['rgba(222,160,80,.75)', 'rgba(200,130,50,.7)', 'rgba(170,100,30,.6)']);
    // 白菜
    for (let i = 0; i < 3; i++) { c.save(); c.translate(R(r, -30, 30), R(r, -25, 25)); c.rotate(r() * TAU); blob(c, 0, 0, 22, 12, 0.25, 8, r); c.fillStyle = lin(c, 0, -12, 0, 12, ['#f6f3d8', '#d8e8a8', '#a8cc6a']); c.fill(); c.restore(); }
    // にんじん
    for (let i = 0; i < 3; i++) { c.save(); c.translate(R(r, -35, 35), R(r, -30, 30)); c.rotate(r() * TAU); c.fillStyle = '#f07d1e'; c.fillRect(-10, -3, 20, 6); c.restore(); }
    // しいたけ
    for (let i = 0; i < 2; i++) { c.save(); c.translate(R(r, -30, 30), R(r, -25, 25)); c.rotate(r() * TAU); c.beginPath(); c.arc(0, 0, 10, P, TAU); c.closePath(); c.fillStyle = '#6b4426'; c.fill(); c.restore(); }
    // 絹さや
    for (let i = 0; i < 2; i++) { c.save(); c.translate(R(r, -30, 30), R(r, -25, 25)); c.rotate(r() * TAU); c.beginPath(); c.ellipse(0, 0, 16, 5, 0, 0, TAU); c.fillStyle = '#5cb83a'; c.fill(); c.restore(); }
    // エビ
    c.save(); c.translate(R(r, -20, 20), R(r, -20, 20)); c.strokeStyle = '#f7836a'; c.lineWidth = 8; c.lineCap = 'round'; c.beginPath(); c.arc(0, 0, 9, 0.4, P * 1.6); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 2; c.stroke(); c.restore();
    c.save(); c.globalAlpha = 0.45; sauceBlob(c, r, 60, 50, ['rgba(230,170,90,.5)', 'rgba(210,140,60,.4)', 'rgba(170,100,30,0)']); c.restore();
    for (let i = 0; i < 5; i++) gloss(c, R(r, -45, 45), R(r, -40, 40), R(r, 6, 14), R(r, 2, 4), 0.75, r());
  } });
add({ id: 'curry', name: 'カレー', cat: 'chuka', kind: 'sauce', S: 160, step: 32, shadow: 0.06,
  draw: (c, r) => {
    sauceBlob(c, r, 64, 54, ['#c47a2a', '#b06a20', '#a05e1a']);
    texture(c, () => dots(c, r, 80, -64, -56, 128, 112, ['rgba(90,40,10,.4)', 'rgba(230,160,70,.35)'], 1.5, 3.5));
    for (let i = 0; i < 3; i++) { const x = R(r, -35, 25), y = R(r, -30, 20), s = R(r, 16, 22); rrect(c, x, y, s, s * 0.9, 5); c.fillStyle = lin(c, x, y, x, y + s, ['#f4d488', '#e0b45c']); c.fill(); }
    for (let i = 0; i < 2; i++) { const x = R(r, -35, 30), y = R(r, -30, 25); c.beginPath(); c.ellipse(x, y, 10, 8, r(), 0, TAU); c.fillStyle = '#e8701c'; c.fill(); }
    for (let i = 0; i < 2; i++) { const x = R(r, -35, 30), y = R(r, -30, 25); blob(c, x, y, 11, 9, 0.3, 7, r); c.fillStyle = '#6b3a1c'; c.fill(); }
    for (let i = 0; i < 4; i++) gloss(c, R(r, -45, 45), R(r, -40, 40), R(r, 6, 12), R(r, 2, 4), 0.55, r());
  } });
add({ id: 'cheese', name: 'とろけるチーズ', cat: 'chuka', kind: 'sauce', S: 130, step: 28, shadow: 0.08,
  draw: (c, r) => {
    blob(c, 0, 0, 50, 42, 0.35, 14, r);
    c.fillStyle = rad(c, 0, 0, 52, ['#ffe27a', '#ffd04a', '#f5b82e']); c.fill();
    texture(c, () => {
      for (let i = 0; i < 6; i++) { c.fillStyle = `rgba(200,120,20,${R(r, 0.15, 0.35)})`; blob(c, R(r, -40, 40), R(r, -35, 35), R(r, 4, 10), R(r, 3, 7), 0.4, 7, r); c.fill(); }
    });
    for (let i = 0; i < 4; i++) gloss(c, R(r, -30, 30), R(r, -26, 26), R(r, 8, 14), R(r, 3, 5), 0.65, r());
  } });
add({ id: 'kimchi', name: 'キムチ', cat: 'chuka', S: 100, rot: P,
  draw: (c, r) => {
    for (let i = 0; i < 6; i++) {
      c.save(); c.translate(R(r, -18, 18), R(r, -16, 16)); c.rotate(r() * TAU);
      blob(c, 0, 0, R(r, 16, 26), R(r, 9, 14), 0.3, 8, r);
      c.fillStyle = lin(c, 0, -14, 0, 14, ['#e04a2a', '#c8301a', '#f0a080']); c.fill();
      texture(c, () => dots(c, r, 25, -26, -14, 52, 28, ['#a01a0a', '#ff6a3a'], 0.6, 1.6));
      gloss(c, -4, -3, 8, 2.5, 0.5);
      c.restore();
    }
  } });
add({ id: 'natto', name: '納豆', cat: 'chuka', S: 90, rot: P,
  draw: (c, r) => {
    for (let i = 0; i < 16; i++) {
      const a = r() * TAU, d = Math.sqrt(r()) * 24;
      const x = Math.cos(a) * d, y = Math.sin(a) * d;
      c.beginPath(); c.ellipse(x, y, 7, 5.5, r() * TAU, 0, TAU);
      c.fillStyle = rad(c, x, y, 8, ['#c48a40', '#a06a28', '#7a4c18'], x - 2, y - 2, 0); c.fill();
      gloss(c, x - 2, y - 2, 3, 1.5, 0.6);
    }
    strands(c, r, { n: 14, len: [10, 30], w: 0.8, cols: ['rgba(255,255,255,.55)'], spread: 26, curl: 1 });
  } });
add({ id: 'aonori', name: '青のり', cat: 'finish', kind: 'sprinkle', S: 5, count: 50, spread: 34, shadow: 0,
  draw: (c, r) => { c.fillStyle = pick(r, ['#2f7a2a', '#3e8e30', '#245f1f']); c.beginPath(); c.arc(0, 0, R(r, 0.8, 1.6), 0, TAU); c.fill(); } });

/* ---------------- 野菜・薬味 ---------------- */
add({ id: 'tamanegi', name: '玉ねぎ(煮)', cat: 'veg', kind: 'sprinkle', S: 70, count: 4, spread: 36, shadow: 0.12,
  draw: (c, r) => {
    c.lineCap = 'round';
    const a0 = R(r, 0, P), len = R(r, 1.2, 2);
    c.strokeStyle = 'rgba(222,180,110,.8)'; c.lineWidth = 7;
    c.beginPath(); c.arc(0, 0, R(r, 20, 28), a0, a0 + len); c.stroke();
    c.strokeStyle = 'rgba(255,240,200,.6)'; c.lineWidth = 2; c.stroke();
  } });
add({ id: 'aonegi', name: '青ねぎ(小口切り)', cat: 'veg', kind: 'sprinkle', S: 14, count: 16, spread: 40, shadow: 0.2,
  draw: (c, r) => {
    const s = R(r, 3.5, 5);
    c.beginPath(); c.ellipse(0, 0, s, s * R(r, 0.7, 1), r() * TAU, 0, TAU);
    c.fillStyle = 'rgba(200,232,160,.9)'; c.fill();
    c.strokeStyle = pick(r, ['#4f9a2c', '#3f8a22', '#62ac38']); c.lineWidth = 1.8; c.stroke();
  } });
add({ id: 'naganegi', name: '長ねぎ(斜め切り)', cat: 'veg', kind: 'sprinkle', S: 60, count: 3, spread: 40, shadow: 0.15,
  draw: (c, r) => {
    for (let k = 0; k < 4; k++) {
      c.beginPath(); c.ellipse(0, 0, 24 - k * 5, 9 - k * 2, 0, 0, TAU);
      c.fillStyle = k % 2 ? 'rgba(236,240,210,.9)' : 'rgba(205,225,160,.9)'; c.fill();
    }
    gloss(c, -6, -3, 8, 2, 0.6);
  } });
add({ id: 'shiraganegi', name: '白髪ねぎ', cat: 'veg', S: 100, rot: P, shadow: 0.25,
  draw: (c, r) => strands(c, r, { n: 70, len: [26, 46], w: 1.3, cols: ['rgba(255,255,250,.95)', 'rgba(240,248,225,.95)', 'rgba(225,240,200,.9)'], spread: 22, curl: 0.8 }) });
add({ id: 'mitsuba', name: '三つ葉', cat: 'veg', S: 110, rot: P, shadow: 0.25,
  draw: (c, r) => {
    c.strokeStyle = '#a8cf6a'; c.lineWidth = 3; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, 46); c.quadraticCurveTo(R(r, -8, 8), 20, 0, 4); c.stroke();
    for (const a of [-P / 2 - 0.9, -P / 2, -P / 2 + 0.9]) {
      c.save(); c.translate(0, 4); c.rotate(a + R(r, -0.12, 0.12));
      leaf(c, r, 34, 14, ['#6cb43a', '#4a9628', '#3a7e1e'], 0.18);
      c.restore();
    }
  } });
add({ id: 'ooba', name: '大葉', cat: 'veg', S: 140, rot: P, shadow: 0.2,
  draw: (c, r) => { c.translate(-52, 0); leaf(c, r, 108, 36, ['#4fa23a', '#2f7e24', '#226a1a'], 0.1); } });
add({ id: 'kizaminori', name: '刻み海苔', cat: 'veg', kind: 'sprinkle', S: 44, count: 22, spread: 46, shadow: 0.2,
  draw: (c, r) => { c.lineCap = 'butt'; c.strokeStyle = pick(r, ['#16201a', '#1e2b20', '#253325']); c.lineWidth = R(r, 2, 3); c.beginPath(); c.moveTo(-16, 0); c.quadraticCurveTo(0, R(r, -4, 4), 16, R(r, -2, 2)); c.stroke(); } });
add({ id: 'nori', name: '焼き海苔', cat: 'veg', S: 90, rot: P, shadow: 0.25,
  draw: (c, r) => {
    c.beginPath(); c.moveTo(-34, -32); c.lineTo(34, -30); c.lineTo(32, 32); c.lineTo(-32, 30); c.closePath();
    c.fillStyle = lin(c, -34, -32, 34, 32, ['#1d2b20', '#141c16', '#22322a']); c.fill();
    texture(c, () => dots(c, r, 120, -34, -32, 68, 64, ['rgba(60,90,60,.4)', 'rgba(0,0,0,.4)'], 0.8, 2.2));
    gloss(c, -10, -10, 20, 10, 0.12);
  } });
add({ id: 'benishoga', name: '紅しょうが', cat: 'veg', S: 70, rot: P, shadow: 0.25,
  draw: (c, r) => strands(c, r, { n: 20, len: [14, 26], w: 2.6, cols: ['#e3243e', '#d01a34', '#f03a52'], spread: 14, curl: 0.5 }) });
add({ id: 'gari', name: 'ガリ', cat: 'veg', S: 80, rot: P,
  draw: (c, r) => {
    for (let i = 0; i < 3; i++) {
      c.save(); c.translate(R(r, -10, 10), R(r, -8, 8)); c.rotate(r() * TAU);
      blob(c, 0, 0, 22, 14, 0.2, 9, r);
      c.fillStyle = 'rgba(250,200,198,.85)'; c.fill();
      c.strokeStyle = 'rgba(230,150,150,.5)'; c.lineWidth = 0.8;
      for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(-18, k * 4); c.lineTo(18, k * 4 + 2); c.stroke(); }
      c.restore();
    }
  } });
add({ id: 'wasabi', name: 'わさび', cat: 'veg', S: 50, rot: P,
  draw: (c, r) => {
    blob(c, 0, 0, 18, 15, 0.25, 9, r);
    c.fillStyle = rad(c, 0, 0, 18, ['#b8d86a', '#9ac24a', '#7aa634'], -4, -4); c.fill();
    texture(c, () => dots(c, r, 40, -18, -15, 36, 30, ['rgba(220,240,160,.6)', 'rgba(70,110,30,.4)'], 0.6, 1.6));
  } });
add({ id: 'kyuri', name: 'きゅうり(輪切り)', cat: 'veg', kind: 'sprinkle', S: 46, count: 3, spread: 40,
  draw: (c, r) => {
    c.beginPath(); c.arc(0, 0, 17, 0, TAU); c.fillStyle = '#e4f0c4'; c.fill();
    c.lineWidth = 3; c.strokeStyle = '#2e6b1f'; c.stroke();
    for (let i = 0; i < 3; i++) { c.save(); c.rotate((i * TAU) / 3); c.beginPath(); c.ellipse(0, -6, 3.5, 6, 0, 0, TAU); c.fillStyle = 'rgba(200,225,150,.9)'; c.fill(); c.restore(); }
    gloss(c, -5, -6, 6, 3, 0.6);
  } });
add({ id: 'avocado', name: 'アボカド', cat: 'veg', S: 130, rot: P,
  draw: (c, r) => {
    for (let i = 0; i < 4; i++) {
      c.save(); c.translate(-30 + i * 18, 0); c.rotate(R(r, -0.05, 0.05));
      c.beginPath(); c.ellipse(0, 0, 16, 44, 0, 0, TAU);
      c.fillStyle = lin(c, -16, 0, 16, 0, ['#cfe274', '#b6d25a', '#8db43a']); c.fill();
      c.strokeStyle = '#2e4a1a'; c.lineWidth = 3; c.beginPath(); c.ellipse(0, 0, 16, 44, 0, -P / 2, P / 2); c.stroke();
      gloss(c, -4, -10, 4, 18, 0.5);
      c.restore();
    }
  } });
add({ id: 'tomato', name: 'ミニトマト(半分)', cat: 'veg', kind: 'sprinkle', S: 46, count: 2, spread: 34,
  draw: (c, r) => {
    c.beginPath(); c.arc(0, 0, 17, 0, TAU); c.fillStyle = '#e0302a'; c.fill();
    c.beginPath(); c.arc(0, 0, 14, 0, TAU); c.fillStyle = '#f06a5a'; c.fill();
    for (let i = 0; i < 3; i++) { c.save(); c.rotate((i * TAU) / 3 + 0.3); c.beginPath(); c.ellipse(0, -7, 4.5, 6, 0, 0, TAU); c.fillStyle = 'rgba(255,170,140,.9)'; c.fill(); dots(c, r, 3, -2, -10, 4, 6, ['#f6e08a'], 0.8, 1.2); c.restore(); }
    gloss(c, -6, -7, 7, 3, 0.7, -0.5);
  } });
add({ id: 'cabbage', name: 'キャベツ千切り', cat: 'veg', S: 120, rot: P, shadow: 0.2,
  draw: (c, r) => strands(c, r, { n: 70, len: [28, 50], w: 2.2, cols: ['#e8f4c8', '#d4ebaa', '#c2e08a', '#f4f8e2'], spread: 26, curl: 0.4 }) });
add({ id: 'lettuce', name: 'レタス', cat: 'veg', S: 140, rot: P, shadow: 0.2,
  draw: (c, r) => {
    blob(c, 0, 0, 56, 44, 0.12, 30, r);
    c.fillStyle = rad(c, 0, 10, 60, ['#dff2a8', '#a8d860', '#6cb43a']); c.fill();
    texture(c, () => {
      c.strokeStyle = 'rgba(240,255,220,.6)'; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(0, 50); c.lineTo(0, -30); c.stroke();
      c.lineWidth = 1.2;
      for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(0, 40 - i * 15); c.quadraticCurveTo(-20, 30 - i * 15, -45, 20 - i * 18); c.stroke(); c.beginPath(); c.moveTo(0, 40 - i * 15); c.quadraticCurveTo(20, 30 - i * 15, 45, 20 - i * 18); c.stroke(); }
    });
    gloss(c, -14, -10, 20, 10, 0.3);
  } });
add({ id: 'kaiware', name: '貝割れ大根', cat: 'veg', S: 100, rot: P, shadow: 0.2,
  draw: (c, r) => {
    for (let i = 0; i < 12; i++) {
      const a = R(r, -0.6, 0.6) - P / 2, L = R(r, 30, 42);
      const x2 = Math.cos(a) * L, y2 = 22 + Math.sin(a) * L;
      c.strokeStyle = 'rgba(250,252,240,.95)'; c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(R(r, -4, 4), 24); c.quadraticCurveTo(x2 * 0.4, 0, x2, y2); c.stroke();
      c.fillStyle = pick(r, ['#5aa83a', '#6cba44']);
      c.beginPath(); c.ellipse(x2 - 3, y2, 4, 3, -0.5, 0, TAU); c.fill();
      c.beginPath(); c.ellipse(x2 + 3, y2, 4, 3, 0.5, 0, TAU); c.fill();
    }
  } });
add({ id: 'shiitake', name: 'しいたけ(煮)', cat: 'veg', S: 64, rot: P,
  draw: (c, r) => {
    c.beginPath(); c.arc(0, 0, 25, 0, TAU);
    c.fillStyle = rad(c, 0, 0, 26, ['#8a5a32', '#6b4426', '#4a2c14'], -6, -6); c.fill();
    c.strokeStyle = 'rgba(240,215,170,.85)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(-12, -12); c.lineTo(12, 12); c.moveTo(12, -12); c.lineTo(-12, 12); c.stroke();
    gloss(c, -8, -9, 9, 4, 0.55, -0.5);
  } });
add({ id: 'kinusaya', name: '絹さや', cat: 'veg', kind: 'sprinkle', S: 60, count: 2, spread: 34,
  draw: (c, r) => {
    c.beginPath(); c.moveTo(-24, 0); c.quadraticCurveTo(0, -12, 24, -2); c.quadraticCurveTo(0, 10, -24, 0); c.closePath();
    c.fillStyle = lin(c, 0, -8, 0, 8, ['#8ad65a', '#5cb83a', '#3e9a28']); c.fill();
    for (let i = 0; i < 4; i++) gloss(c, -12 + i * 8, -1, 4, 3, 0.35);
  } });
add({ id: 'corn', name: 'コーン', cat: 'veg', kind: 'sprinkle', S: 12, count: 14, spread: 32, shadow: 0.2,
  draw: (c, r) => { rrect(c, -3.6, -3.2, 7.2, 6.4, 2.5); c.fillStyle = lin(c, 0, -3, 0, 3, ['#ffe066', '#f7c934', '#e5a91a']); c.fill(); gloss(c, -1, -1.5, 2, 1, 0.8); } });
add({ id: 'takuan', name: 'たくあん', cat: 'veg', kind: 'sprinkle', S: 56, count: 2, spread: 30,
  draw: (c, r) => {
    c.beginPath(); c.arc(0, 8, 22, P, TAU); c.closePath();
    c.fillStyle = rad(c, 0, 8, 22, ['#fbe58a', '#f4d03f', '#e6b82a']); c.fill();
    c.strokeStyle = 'rgba(220,170,30,.5)'; c.lineWidth = 1; c.beginPath(); c.arc(0, 8, 14, P, TAU); c.stroke();
    gloss(c, -6, 0, 8, 3, 0.5);
  } });
add({ id: 'umeboshi', name: '梅干し', cat: 'veg', S: 56, rot: P,
  draw: (c, r) => {
    blob(c, 0, 0, 20, 19, 0.08, 10, r);
    c.fillStyle = rad(c, 0, 0, 22, ['#e63a4a', '#c0172b', '#8e0c1c'], -5, -5); c.fill();
    texture(c, () => { c.strokeStyle = 'rgba(90,0,10,.35)'; c.lineWidth = 1.2; for (let i = 0; i < 8; i++) { c.beginPath(); c.moveTo(R(r, -18, 18), R(r, -18, 18)); c.quadraticCurveTo(R(r, -18, 18), R(r, -18, 18), R(r, -18, 18), R(r, -18, 18)); c.stroke(); } });
    gloss(c, -6, -7, 7, 4, 0.7, -0.5);
  } });
add({ id: 'okra', name: 'オクラ', cat: 'veg', kind: 'sprinkle', S: 26, count: 4, spread: 34,
  draw: (c, r) => {
    const pts = []; for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU, d = i % 2 ? 7 : 10; pts.push([Math.cos(a) * d, Math.sin(a) * d]); }
    smooth(c, pts); c.fillStyle = '#4f9a2c'; c.fill();
    c.beginPath(); c.arc(0, 0, 6.5, 0, TAU); c.fillStyle = '#c8e6a0'; c.fill();
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; c.fillStyle = '#fff'; c.beginPath(); c.arc(Math.cos(a) * 3.8, Math.sin(a) * 3.8, 1.3, 0, TAU); c.fill(); }
  } });
add({ id: 'ninjin', name: 'にんじん(花形)', cat: 'veg', kind: 'sprinkle', S: 40, count: 2, spread: 34,
  draw: (c, r) => {
    const pts = []; for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU, d = i % 2 ? 9 : 15; pts.push([Math.cos(a) * d, Math.sin(a) * d]); }
    smooth(c, pts); c.fillStyle = rad(c, 0, 0, 15, ['#ffa040', '#f07d1e', '#d8620e']); c.fill();
    gloss(c, -4, -4, 5, 3, 0.5);
  } });
add({ id: 'oroshi', name: '大根おろし', cat: 'veg', S: 80, rot: P,
  draw: (c, r) => {
    blob(c, 0, 0, 30, 24, 0.25, 10, r);
    c.fillStyle = rad(c, 0, 0, 30, ['rgba(255,255,252,.97)', 'rgba(245,245,236,.9)', 'rgba(230,230,215,.8)']); c.fill();
    texture(c, () => strands(c, r, { n: 50, len: [4, 10], w: 1, cols: ['rgba(255,255,255,.9)', 'rgba(210,215,200,.6)'], spread: 26 }));
  } });
add({ id: 'tororo', name: 'とろろ', cat: 'veg', kind: 'sauce', S: 120, step: 34, shadow: 0.1,
  draw: (c, r) => {
    sauceBlob(c, r, 48, 40, ['rgba(255,255,248,.9)', 'rgba(248,246,235,.85)', 'rgba(235,232,215,.7)']);
    for (let i = 0; i < 6; i++) { const x = R(r, -30, 30), y = R(r, -25, 25), s = R(r, 1.5, 3.5); c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 0.8; c.beginPath(); c.arc(x, y, s, 0, TAU); c.stroke(); }
    for (let i = 0; i < 3; i++) gloss(c, R(r, -30, 30), R(r, -25, 25), R(r, 8, 14), R(r, 3, 5), 0.7, r());
  } });

/* ---------------- タレ・仕上げ ---------------- */
add({ id: 'tsuyu', name: '丼つゆ(つゆだく)', cat: 'finish', kind: 'sauce', S: 120, step: 30, shadow: 0, blend: 'multiply',
  draw: (c, r) => {
    blob(c, 0, 0, 50, 44, 0.25, 11, r);
    c.fillStyle = rad(c, 0, 0, 52, ['rgba(190,120,55,.6)', 'rgba(195,130,65,.45)', 'rgba(210,150,90,0)']); c.fill();
  } });
add({ id: 'tare', name: '甘辛ダレ', cat: 'finish', kind: 'sauce', S: 30, step: 3.5, shadow: 0.05,
  draw: (c, r) => { c.fillStyle = rad(c, 0, 0, 6, ['rgba(150,70,20,.82)', 'rgba(120,52,14,.8)', 'rgba(100,42,10,.7)']); c.beginPath(); c.arc(0, 0, R(r, 4, 5.2), 0, TAU); c.fill(); gloss(c, -1.2, -1.6, 2, 1, 0.75); } });
add({ id: 'shoyu', name: '醤油', cat: 'finish', kind: 'sauce', S: 30, step: 6, shadow: 0, blend: 'multiply',
  draw: (c, r) => { c.fillStyle = 'rgba(80,35,10,.6)'; c.beginPath(); c.arc(0, 0, R(r, 6, 8), 0, TAU); c.fill(); } });
add({ id: 'mayo', name: 'マヨネーズ', cat: 'finish', kind: 'sauce', S: 24, step: 4, shadow: 0.25,
  draw: (c, r) => { c.fillStyle = rad(c, 0, 0, 6, ['#fffbe6', '#fbf0c8', '#efe0a8'], -1.5, -1.5); c.beginPath(); c.arc(0, 0, 5.5, 0, TAU); c.fill(); gloss(c, -1.5, -2, 2.2, 1, 0.9); } });
add({ id: 'raayu', name: 'ラー油', cat: 'finish', kind: 'sauce', S: 30, step: 10, shadow: 0,
  draw: (c, r) => { c.fillStyle = 'rgba(225,60,10,.55)'; blob(c, 0, 0, 9, 8, 0.3, 7, r); c.fill(); dots(c, r, 3, -5, -5, 10, 10, ['rgba(140,20,0,.7)'], 0.8, 1.4); gloss(c, -2, -2, 3, 1.5, 0.6); } });
add({ id: 'shichimi', name: '七味', cat: 'finish', kind: 'sprinkle', S: 5, count: 44, spread: 30, shadow: 0,
  draw: (c, r) => { c.fillStyle = pick(r, ['#d42a1a', '#e85a1a', '#b81a10', '#2a2a2a', '#4f7a2a', '#f0a030']); c.beginPath(); c.ellipse(0, 0, R(r, 0.8, 1.6), R(r, 0.6, 1.2), r() * TAU, 0, TAU); c.fill(); } });
add({ id: 'sansho', name: '山椒', cat: 'finish', kind: 'sprinkle', S: 5, count: 34, spread: 24, shadow: 0,
  draw: (c, r) => { c.fillStyle = pick(r, ['#6b7a3a', '#8a7a4a', '#5a6a2a']); c.beginPath(); c.arc(0, 0, R(r, 0.7, 1.3), 0, TAU); c.fill(); } });
add({ id: 'goma', name: '白ごま', cat: 'finish', kind: 'sprinkle', S: 7, count: 32, spread: 40, shadow: 0.1,
  draw: (c, r) => { c.beginPath(); c.ellipse(0, 0, 2.6, 1.5, 0, 0, TAU); c.fillStyle = '#f3e6c4'; c.fill(); c.strokeStyle = 'rgba(150,120,70,.6)'; c.lineWidth = 0.5; c.stroke(); } });
add({ id: 'kurogoma', name: '黒ごま', cat: 'finish', kind: 'sprinkle', S: 7, count: 28, spread: 40, shadow: 0.1,
  draw: (c, r) => { c.beginPath(); c.ellipse(0, 0, 2.6, 1.5, 0, 0, TAU); c.fillStyle = '#2a2622'; c.fill(); gloss(c, -0.8, -0.4, 1, 0.5, 0.6); } });
add({ id: 'katsuobushi', name: 'かつお節', cat: 'finish', kind: 'sprinkle', S: 34, count: 10, spread: 34, shadow: 0.15,
  draw: (c, r) => {
    blob(c, 0, 0, R(r, 9, 14), R(r, 4, 7), 0.45, 8, r, r() * TAU);
    c.fillStyle = pick(r, ['rgba(222,170,140,.9)', 'rgba(210,150,120,.9)', 'rgba(235,190,160,.9)']); c.fill();
    c.strokeStyle = 'rgba(160,90,70,.45)'; c.lineWidth = 0.6; c.stroke();
  } });
add({ id: 'tenkasu', name: '天かす', cat: 'finish', kind: 'sprinkle', S: 16, count: 18, spread: 40, shadow: 0.2,
  draw: (c, r) => { blob(c, 0, 0, R(r, 3, 6), R(r, 3, 5), 0.45, 7, r); c.fillStyle = rad(c, 0, 0, 6, ['#f6d27a', '#e8b85a', '#c98a32']); c.fill(); } });
add({ id: 'itotogarashi', name: '糸唐辛子', cat: 'finish', S: 80, rot: P, shadow: 0.2,
  draw: (c, r) => strands(c, r, { n: 26, len: [20, 40], w: 0.9, cols: ['#d8261a', '#e8401a', '#b8160c'], spread: 12, curl: 0.9 }) });

export const ING_MAP = Object.fromEntries(ING.map((d) => [d.id, d]));
