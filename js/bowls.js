// 器・ごはん・背景の描画
import { TAU, R, rng, pick, lin, rad, gloss, dots, blob } from './util.js';

export const SHAPES = {
  std: { name: '定番', rx: 320, ry: 116, depth: 240, foot: 120, cy: 540, fill: 170, k: 0.42 },
  deep: { name: '深め', rx: 292, ry: 106, depth: 285, foot: 108, cy: 520, fill: 230, k: 0.44 },
  wide: { name: '平ため(海鮮向き)', rx: 360, ry: 132, depth: 168, foot: 150, cy: 560, fill: 120, k: 0.33 },
};
export function geom(shapeId) {
  const s = SHAPES[shapeId] || SHAPES.std;
  return { ...s, cx: 500, ix: s.rx - 13, iy: s.ry - 6.5 };
}

export const DESIGNS = [
  { id: 'urushi', name: '朱塗り(漆)', outer: ['#3a3230', '#0d0b0b'], inner: ['#cf3a24', '#8f1c12'], lip: ['#2a1a16', '#120a08'], foot: '#1a1210', pattern: 'goldline', gloss: 0.5 },
  { id: 'sometsuke', name: '藍の唐草', outer: ['#fdfdf8', '#e3e4dc'], inner: ['#fdfdf9', '#e6e5dd'], lip: ['#3550a0', '#22357a'], foot: '#e0d6c2', pattern: 'karakusa', pat: '#2d4596', gloss: 0.55, innerLine: '#2d4596' },
  { id: 'seigaiha', name: '青海波', outer: ['#eaf3f8', '#bcd3e4'], inner: ['#fcfcfa', '#e7e9e9'], lip: ['#4a7cb0', '#2f5d8e'], foot: '#d9d2c2', pattern: 'seigaiha', pat: '#3d6fa3', gloss: 0.5 },
  { id: 'sakura', name: 'さくら', outer: ['#fde6ec', '#f3bccb'], inner: ['#fffafb', '#f6e5e9'], lip: ['#f6b3c4', '#e48aa2'], foot: '#efd8d8', pattern: 'sakura', gloss: 0.5, innerLine: '#f2a1b5' },
  { id: 'yumekawa', name: 'ゆめかわ水玉', outer: ['#ece0ff', '#c6b0f2'], inner: ['#fffaff', '#efe6fb'], lip: ['#c8b2f6', '#a98ee6'], foot: '#e6dcf4', pattern: 'mizutama', gloss: 0.55 },
  { id: 'mint', name: 'ミントギンガム', outer: ['#e6f7f0', '#c3e6d8'], inner: ['#fbfffd', '#e6f3ee'], lip: ['#8fd3ba', '#62b898'], foot: '#d8ece2', pattern: 'gingham', pat: '#6cc0a2', gloss: 0.45 },
  { id: 'oribe', name: '織部', outer: ['#efe4cc', '#cdbb96'], inner: ['#f1e7d1', '#d7c9a8'], lip: ['#3c7a52', '#1f5a38'], foot: '#c7aa80', pattern: 'oribe', gloss: 0.35 },
  { id: 'kohiki', name: '粉引', outer: ['#f3eee4', '#d5ccbb'], inner: ['#f5f0e7', '#dcd2c2'], lip: ['#d9ccb6', '#bfae92'], foot: '#b89a74', pattern: 'speckle', gloss: 0.2 },
  { id: 'tenmoku', name: '天目', outer: ['#4a2c1a', '#160c07'], inner: ['#56341c', '#1c100a'], lip: ['#b07a40', '#7a4a20'], foot: '#a88a68', pattern: 'tenmoku', gloss: 0.6 },
  { id: 'wood', name: '木の器', outer: ['#b0723f', '#6d3d1c'], inner: ['#be7f45', '#7e4a22'], lip: ['#9a5e30', '#7a4520'], foot: '#6a3a1a', pattern: 'woodgrain', gloss: 0.25 },
  { id: 'black', name: '黒マット×金', outer: ['#3c3c3f', '#1a1a1c'], inner: ['#2e2e31', '#141416'], lip: ['#e8c76a', '#a9822e'], foot: '#26262a', pattern: 'none', gloss: 0.15 },
  { id: 'kutani', name: '九谷風', outer: ['#fbf8ef', '#e6dfcc'], inner: ['#fdfbf5', '#e9e3d4'], lip: ['#c8a040', '#9a7622'], foot: '#e0d4b8', pattern: 'kutani', gloss: 0.5 },
];
export const DESIGN_MAP = Object.fromEntries(DESIGNS.map((d) => [d.id, d]));

function bodyPath(g) {
  const { cx, cy, rx, depth, foot } = g;
  const p = new Path2D();
  p.moveTo(cx - rx, cy);
  p.bezierCurveTo(cx - rx, cy + depth * 0.62, cx - foot - rx * 0.14, cy + depth, cx - foot, cy + depth);
  p.lineTo(cx + foot, cy + depth);
  p.bezierCurveTo(cx + foot + rx * 0.14, cy + depth, cx + rx, cy + depth * 0.62, cx + rx, cy);
  p.ellipse(cx, cy, rx, g.ry, 0, 0, Math.PI, false);
  p.closePath();
  return p;
}

function drawPattern(c, d, g, r) {
  const { cx, cy, rx, depth } = g;
  const x0 = cx - rx, y0 = cy - 10, w = rx * 2, h = depth + 30;
  switch (d.pattern) {
    case 'goldline': {
      c.strokeStyle = 'rgba(214,170,70,.9)'; c.lineWidth = 3;
      c.beginPath(); c.ellipse(cx, cy + 14, rx * 0.985, g.ry * 1.02, 0, 0.05, Math.PI - 0.05); c.stroke();
      c.lineWidth = 1.5; c.beginPath(); c.ellipse(cx, cy + 24, rx * 0.97, g.ry * 1.03, 0, 0.08, Math.PI - 0.08); c.stroke();
      break;
    }
    case 'karakusa': {
      c.strokeStyle = d.pat; c.lineCap = 'round';
      for (let i = 0; i < 26; i++) {
        const x = x0 + R(r, 0, w), y = cy + g.ry * 0.7 + R(r, 0, depth * 0.8), s = R(r, 12, 22);
        c.lineWidth = R(r, 2.2, 3.4);
        c.beginPath();
        for (let t = 0; t < 14; t++) { const a = t * 0.55, rr = s * (1 - t / 16); c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8); }
        c.stroke();
        c.fillStyle = d.pat;
        c.beginPath(); c.ellipse(x + s * 1.1, y - s * 0.4, 6, 3, 0.6, 0, TAU); c.fill();
      }
      c.lineWidth = 3; c.beginPath(); c.ellipse(cx, cy + 16, rx * 0.99, g.ry * 1.02, 0, 0.04, Math.PI - 0.04); c.stroke();
      c.lineWidth = 2; c.beginPath(); c.ellipse(cx, cy + depth * 0.9, rx * 0.5, g.ry * 0.5, 0, 0.1, Math.PI - 0.1); c.stroke();
      break;
    }
    case 'seigaiha': {
      c.lineWidth = 2.4;
      const s = 34;
      for (let row = 0; row * s * 0.5 < h; row++) {
        for (let col = -1; col * s < w + s; col++) {
          const x = x0 + col * s + (row % 2 ? s / 2 : 0), y = y0 + row * s * 0.5 + s * 0.5;
          c.fillStyle = row % 2 ? '#dbe9f3' : '#eef5fa'; c.beginPath(); c.arc(x, y, s * 0.62, Math.PI, TAU); c.fill();
          for (let k = 1; k <= 3; k++) { c.strokeStyle = d.pat; c.globalAlpha = 0.8; c.beginPath(); c.arc(x, y, (s * 0.62 * k) / 3, Math.PI, TAU); c.stroke(); }
          c.globalAlpha = 1;
        }
      }
      break;
    }
    case 'sakura': {
      for (let i = 0; i < 24; i++) {
        const x = x0 + R(r, 0, w), y = cy + R(r, 20, depth), s = R(r, 10, 22);
        c.save(); c.translate(x, y); c.rotate(r() * TAU);
        for (let k = 0; k < 5; k++) {
          c.rotate(TAU / 5);
          c.fillStyle = r() < 0.5 ? '#ffffff' : '#ffd6e0';
          c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-s * 0.6, -s * 0.4, -s * 0.35, -s * 1.05, 0, -s * 0.85); c.bezierCurveTo(s * 0.35, -s * 1.05, s * 0.6, -s * 0.4, 0, 0); c.fill();
        }
        c.fillStyle = '#f58aa5'; c.beginPath(); c.arc(0, 0, s * 0.16, 0, TAU); c.fill();
        c.restore();
      }
      break;
    }
    case 'mizutama': {
      const cols = ['#ffd1e6', '#fff3b0', '#c9f2e6', '#ffffff', '#cfe3ff'];
      for (let i = 0; i < 70; i++) { c.fillStyle = pick(r, cols); c.beginPath(); c.arc(x0 + R(r, 0, w), cy + R(r, 5, depth), R(r, 6, 15), 0, TAU); c.fill(); }
      for (let i = 0; i < 12; i++) {
        const x = x0 + R(r, 0, w), y = cy + R(r, 20, depth), s = R(r, 6, 10);
        c.fillStyle = '#fff'; c.beginPath();
        for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU, rr = k % 2 ? s * 0.4 : s; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
        c.fill();
      }
      break;
    }
    case 'gingham': {
      const s = 30;
      c.fillStyle = d.pat;
      c.globalAlpha = 0.35;
      for (let x = x0; x < x0 + w; x += s * 2) c.fillRect(x, y0, s, h);
      for (let y = y0; y < y0 + h; y += s * 2) c.fillRect(x0, y, w, s);
      c.globalAlpha = 1;
      break;
    }
    case 'oribe': {
      c.fillStyle = lin(c, 0, cy, 0, cy + depth * 0.5, ['#2f7a50', '#3e8a5a', '#5a9a68']);
      c.beginPath(); c.moveTo(x0, y0);
      for (let x = x0; x <= x0 + w; x += 20) c.lineTo(x, cy + g.ry + R(r, 10, 60) * (r() < 0.25 ? 2 : 1));
      c.lineTo(x0 + w, y0); c.fill();
      c.strokeStyle = '#6a4424'; c.lineWidth = 3;
      for (let i = 0; i < 5; i++) {
        const x = cx - rx * 0.6 + i * rx * 0.3, y = cy + depth * 0.62;
        c.beginPath(); c.moveTo(x - 20, y); c.lineTo(x, y - 18); c.lineTo(x + 20, y); c.stroke();
        c.beginPath(); c.arc(x, y + 22, 7, 0, TAU); c.stroke();
      }
      break;
    }
    case 'speckle': dots(c, r, 220, x0, y0, w, h, ['rgba(110,80,50,.55)', 'rgba(70,50,30,.5)', 'rgba(160,120,80,.35)'], 0.6, 2.2); break;
    case 'tenmoku': {
      for (let i = 0; i < 160; i++) {
        const x = x0 + R(r, 0, w), y = cy + R(r, 0, depth * 0.3);
        c.strokeStyle = pick(r, ['rgba(200,130,70,.35)', 'rgba(230,170,100,.25)', 'rgba(90,50,20,.4)']);
        c.lineWidth = R(r, 1, 3); c.beginPath(); c.moveTo(x, y); c.lineTo(x + R(r, -6, 6), y + R(r, 40, 140)); c.stroke();
      }
      c.fillStyle = lin(c, 0, cy, 0, cy + 60, ['rgba(176,122,64,.9)', 'rgba(176,122,64,0)']); c.fillRect(x0, y0, w, 80);
      break;
    }
    case 'woodgrain': {
      for (let i = 0; i < 40; i++) {
        const y = y0 + R(r, 0, h);
        c.strokeStyle = `rgba(60,30,10,${R(r, 0.12, 0.35)})`; c.lineWidth = R(r, 1, 3);
        c.beginPath(); c.moveTo(x0, y);
        for (let x = x0; x <= x0 + w; x += 30) c.lineTo(x, y + Math.sin(x / R(r, 40, 90)) * 6);
        c.stroke();
      }
      break;
    }
    case 'kutani': {
      // 赤・緑・黄・紫の色絵
      c.fillStyle = '#c8402a'; c.fillRect(x0, cy + 4, w, 26);
      c.fillStyle = '#e8c040';
      for (let x = x0; x < x0 + w; x += 26) { c.beginPath(); c.arc(x, cy + 17, 6, 0, TAU); c.fill(); }
      for (let i = 0; i < 6; i++) {
        const x = cx - rx * 0.75 + i * rx * 0.3, y = cy + depth * 0.55;
        c.fillStyle = ['#2f7a50', '#5a3a8a', '#e8b030'][i % 3];
        c.beginPath(); c.arc(x, y, 30, 0, TAU); c.fill();
        c.strokeStyle = '#2a2a2a'; c.lineWidth = 2; c.stroke();
        c.fillStyle = '#c8402a'; c.beginPath(); c.arc(x, y, 12, 0, TAU); c.fill();
      }
      break;
    }
  }
}

export function drawBowlBack(c, d, g, seed = 1) {
  const r = rng(seed);
  const { cx, cy, rx, ry, depth, foot } = g;
  // テーブルへの影
  c.save();
  c.translate(cx, cy + depth + 18); c.scale(1, 0.22);
  c.fillStyle = rad(c, 0, 0, rx * 1.05, ['rgba(40,20,0,.42)', 'rgba(40,20,0,.22)', 'rgba(40,20,0,0)']);
  c.beginPath(); c.arc(0, 0, rx * 1.05, 0, TAU); c.fill();
  c.restore();
  // 高台
  c.beginPath();
  c.moveTo(cx - foot * 0.95, cy + depth - 6);
  c.lineTo(cx - foot * 0.9, cy + depth + 16);
  c.quadraticCurveTo(cx, cy + depth + 16 + foot * 0.2, cx + foot * 0.9, cy + depth + 16);
  c.lineTo(cx + foot * 0.95, cy + depth - 6); c.closePath();
  c.fillStyle = lin(c, cx - foot, 0, cx + foot, 0, [d.foot, '#ffffff22', d.foot]); c.fill();
  c.fillStyle = 'rgba(0,0,0,.25)'; c.fill();
  // 本体
  const body = bodyPath(g);
  c.fillStyle = lin(c, 0, cy, 0, cy + depth, d.outer);
  c.fill(body);
  c.save(); c.clip(body);
  drawPattern(c, d, g, r);
  c.fillStyle = lin(c, cx - rx, 0, cx + rx, 0, [[0, 'rgba(0,0,0,.32)'], [0.22, 'rgba(255,255,255,.12)'], [0.5, 'rgba(0,0,0,0)'], [0.85, 'rgba(0,0,0,.18)'], [1, 'rgba(0,0,0,.4)']]);
  c.fillRect(cx - rx, cy - 10, rx * 2, depth + 40);
  c.fillStyle = lin(c, 0, cy, 0, cy + depth, ['rgba(0,0,0,0)', 'rgba(0,0,0,.05)', 'rgba(0,0,0,.25)']);
  c.fillRect(cx - rx, cy - 10, rx * 2, depth + 40);
  gloss(c, cx - rx * 0.6, cy + depth * 0.38, 26, depth * 0.3, d.gloss, 0.25);
  gloss(c, cx + rx * 0.7, cy + depth * 0.3, 10, depth * 0.18, d.gloss * 0.5, -0.3);
  c.restore();
  // 内側
  c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, TAU);
  c.fillStyle = lin(c, 0, cy - ry, 0, cy + ry, d.inner); c.fill();
  c.save(); c.clip();
  c.fillStyle = rad(c, cx, cy + ry * 0.6, rx * 0.6, ['rgba(0,0,0,.25)', 'rgba(0,0,0,.08)', 'rgba(0,0,0,0)']);
  c.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
  if (d.innerLine) {
    c.strokeStyle = d.innerLine; c.lineWidth = 3;
    c.beginPath(); c.ellipse(cx, cy + 6, rx - 30, ry - 14, 0, Math.PI, TAU); c.stroke();
    c.lineWidth = 1.5; c.beginPath(); c.ellipse(cx, cy + 10, rx - 40, ry - 18, 0, Math.PI, TAU); c.stroke();
  }
  gloss(c, cx - rx * 0.25, cy - ry * 0.55, rx * 0.4, ry * 0.18, d.gloss * 0.6);
  c.restore();
  // 縁（全周）
  rimRing(c, d, g, false);
}

function rimRing(c, d, g, frontOnly) {
  const { cx, cy, rx, ry, ix, iy } = g;
  c.beginPath();
  if (frontOnly) {
    c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI, false);
    c.ellipse(cx, cy, ix, iy, 0, Math.PI, 0, true);
  } else {
    c.ellipse(cx, cy, rx, ry, 0, 0, TAU);
    c.ellipse(cx, cy, ix, iy, 0, TAU, 0, true);
  }
  c.closePath();
  c.fillStyle = lin(c, cx - rx, cy - ry, cx + rx, cy + ry, [d.lip[0], d.lip[1], d.lip[0]]);
  c.fill('evenodd');
  c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 2;
  c.beginPath(); c.ellipse(cx, cy, rx - 1, ry - 0.5, 0, frontOnly ? 0.35 : Math.PI * 1.05, frontOnly ? Math.PI * 0.75 : Math.PI * 1.7); c.stroke();
}

export function drawBowlFront(c, d, g) { rimRing(c, d, g, true); }

/* ---------- ごはん ---------- */
export function riceInfo(g, amount) {
  if (amount <= 0) return { type: 'empty' };
  if (amount < g.fill) {
    const t = amount / g.fill;
    return { type: 'low', t, cy: g.cy + (1 - t) * g.iy * 0.8, rx: g.ix * (0.6 + 0.4 * t), ry: g.iy * (0.6 + 0.4 * t) };
  }
  return { type: 'dome', dome: Math.min(330, (amount - g.fill) * g.k) };
}

export function ricePath(g, info, sx = 1) {
  const p = new Path2D();
  const { cx, cy } = g;
  if (info.type === 'empty') { p.ellipse(cx, cy + g.iy * 0.15, g.ix * 0.8 * sx, g.iy * 0.75 * sx, 0, 0, TAU); return p; }
  if (info.type === 'low') { p.ellipse(cx, info.cy, info.rx * sx, info.ry * sx, 0, 0, TAU); return p; }
  const ix = g.ix * sx, iy = g.iy * sx, d = info.dome, top = cy - g.iy - d * (sx < 1 ? 0.97 : 1);
  const peak = Math.min(0.12, d / 1800);
  p.moveTo(cx - ix, cy);
  p.ellipse(cx, cy, ix, iy, 0, Math.PI, 0, true);
  p.bezierCurveTo(cx + ix, cy - 0.552 * iy - 0.38 * d, cx + ix * 0.552 * (1 - peak), top, cx, top);
  p.bezierCurveTo(cx - ix * 0.552 * (1 - peak), top, cx - ix, cy - 0.552 * iy - 0.38 * d, cx - ix, cy);
  p.closePath();
  return p;
}

// ごはん粒テクスチャ（クリップ済み領域に描く）
export function grains(c, r, x, y, w, h, density = 1, scale = 1) {
  const n = Math.floor(((w * h) / 105) * density / (scale * scale));
  const cols = ['#fffefa', '#fdfbf4', '#f9f6ec', '#f4f0e4', '#ffffff'];
  c.lineWidth = 0.9 * scale;
  c.strokeStyle = 'rgba(150,135,110,.32)';
  for (let i = 0; i < n; i++) {
    const gx = x + r() * w, gy = y + r() * h;
    const L = R(r, 8, 10.5) * scale, W = R(r, 4.2, 5.4) * scale;
    c.fillStyle = pick(r, cols);
    c.beginPath(); c.ellipse(gx, gy, L, W, r() * TAU, 0, TAU);
    c.fill(); c.stroke();
  }
  // 粒のツヤ
  c.fillStyle = 'rgba(255,255,255,.75)';
  for (let i = 0; i < n * 0.25; i++) { c.beginPath(); c.ellipse(x + r() * w, y + r() * h, 3 * scale, 1.2 * scale, r() * TAU, 0, TAU); c.fill(); }
}

export function drawRice(c, d, g, amount, seed = 7) {
  const info = riceInfo(g, amount);
  if (info.type === 'empty') return info;
  const r = rng(seed);
  const p = ricePath(g, info);
  c.save();
  if (info.type === 'low') { c.beginPath(); c.ellipse(g.cx, g.cy, g.ix, g.iy, 0, 0, TAU); c.clip(); }
  c.clip(p);
  const top = info.type === 'dome' ? g.cy - g.iy - info.dome : info.cy - info.ry;
  const bot = info.type === 'dome' ? g.cy + g.iy : info.cy + info.ry;
  c.fillStyle = lin(c, 0, top, 0, bot, ['#fbf9f2', '#efe9da', '#d9d0bb']);
  c.fillRect(g.cx - g.rx, top - 10, g.rx * 2, bot - top + 20);
  grains(c, r, g.cx - g.rx, top - 10, g.rx * 2, bot - top + 20, 1.05);
  // 立体感
  if (info.type === 'dome') {
    const d0 = info.dome;
    c.fillStyle = rad(c, g.cx - g.ix * 0.25, top + (d0 + g.iy) * 0.35, g.ix * 0.75, ['rgba(255,255,250,.35)', 'rgba(255,255,250,.08)', 'rgba(255,255,250,0)']);
    c.fillRect(g.cx - g.rx, top - 10, g.rx * 2, bot - top + 20);
    c.fillStyle = lin(c, 0, g.cy - g.iy * 0.4, 0, g.cy + g.iy, ['rgba(120,95,60,0)', 'rgba(120,95,60,.12)', 'rgba(110,85,50,.35)']);
    c.fillRect(g.cx - g.rx, g.cy - g.iy, g.rx * 2, g.iy * 2.2);
    c.fillStyle = lin(c, g.cx - g.ix, 0, g.cx + g.ix, 0, [[0, 'rgba(110,85,50,.25)'], [0.2, 'rgba(110,85,50,0)'], [0.8, 'rgba(110,85,50,0)'], [1, 'rgba(110,85,50,.3)']]);
    c.fillRect(g.cx - g.rx, top - 10, g.rx * 2, bot - top + 20);
  } else {
    c.fillStyle = rad(c, g.cx, info.cy, info.rx, ['rgba(255,255,250,.1)', 'rgba(120,95,60,.05)', 'rgba(110,85,50,.3)']);
    c.fillRect(g.cx - g.rx, top - 10, g.rx * 2, bot - top + 20);
    c.fillStyle = lin(c, 0, g.cy - g.iy, 0, g.cy, ['rgba(60,40,20,.3)', 'rgba(60,40,20,0)']);
    c.fillRect(g.cx - g.rx, g.cy - g.iy, g.rx * 2, g.iy);
  }
  c.restore();
  return info;
}

/* ---------- 背景 ---------- */
export const BGS = [
  { id: 'wood', name: '木のテーブル' },
  { id: 'gingham', name: 'ギンガム' },
  { id: 'marble', name: '大理石' },
  { id: 'pastel', name: 'パステル' },
  { id: 'linen', name: 'リネン' },
  { id: 'tatami', name: '畳' },
  { id: 'dark', name: 'ダーク' },
];

export function drawBg(c, id, size = 1000) {
  const r = rng(99);
  const S = size;
  switch (id) {
    case 'gingham': {
      c.fillStyle = '#fff6f7'; c.fillRect(0, 0, S, S);
      const s = S / 16;
      c.fillStyle = 'rgba(246,140,170,.38)';
      for (let x = 0; x < S; x += s * 2) c.fillRect(x, 0, s, S);
      for (let y = 0; y < S; y += s * 2) c.fillRect(0, y, S, s);
      c.globalAlpha = 0.08; c.strokeStyle = '#a05070'; c.lineWidth = 1;
      for (let y = 0; y < S; y += 4) { c.beginPath(); c.moveTo(0, y); c.lineTo(S, y); c.stroke(); }
      c.globalAlpha = 1;
      break;
    }
    case 'marble': {
      c.fillStyle = lin(c, 0, 0, S, S, ['#f7f5f2', '#ebe8e4', '#f4f2ef']); c.fillRect(0, 0, S, S);
      for (let i = 0; i < 16; i++) {
        c.strokeStyle = `rgba(140,140,150,${R(r, 0.08, 0.3)})`; c.lineWidth = R(r, 0.8, 4);
        c.beginPath(); let x = R(r, -200, S), y = R(r, -200, S); c.moveTo(x, y);
        for (let k = 0; k < 6; k++) { const nx = x + R(r, 60, 200), ny = y + R(r, 40, 200); c.quadraticCurveTo(x + R(r, -60, 60), y + R(r, -60, 60), nx, ny); x = nx; y = ny; }
        c.stroke();
      }
      dots(c, r, 600, 0, 0, S, S, ['rgba(150,150,160,.12)'], 0.5, 2);
      break;
    }
    case 'pastel': {
      c.fillStyle = lin(c, 0, 0, S, S, ['#ffe3ee', '#fbe6f6', '#e7defe']); c.fillRect(0, 0, S, S);
      const s = S / 14;
      for (let y = 0; y < S + s; y += s) for (let x = 0; x < S + s; x += s) {
        const ox = (Math.round(y / s) % 2) * s / 2;
        c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(x + ox, y, s * 0.12, 0, TAU); c.fill();
      }
      break;
    }
    case 'linen': {
      c.fillStyle = '#ece3d3'; c.fillRect(0, 0, S, S);
      c.lineWidth = 1;
      for (let i = 0; i < S; i += 3) {
        c.strokeStyle = `rgba(150,130,100,${R(r, 0.05, 0.16)})`; c.beginPath(); c.moveTo(0, i); c.lineTo(S, i + R(r, -2, 2)); c.stroke();
        c.strokeStyle = `rgba(255,255,255,${R(r, 0.05, 0.2)})`; c.beginPath(); c.moveTo(i, 0); c.lineTo(i + R(r, -2, 2), S); c.stroke();
      }
      break;
    }
    case 'tatami': {
      c.fillStyle = lin(c, 0, 0, S, S, ['#d6d89a', '#c4c784']); c.fillRect(0, 0, S, S);
      for (let y = 0; y < S; y += 7) { c.fillStyle = `rgba(120,120,50,${R(r, 0.08, 0.2)})`; c.fillRect(0, y, S, 2.5); }
      for (let x = 0; x < S; x += 60) { c.fillStyle = 'rgba(120,120,60,.12)'; c.fillRect(x, 0, 1.5, S); }
      c.fillStyle = '#2f3b2c'; c.fillRect(0, S * 0.08, S, S * 0.05);
      c.fillStyle = 'rgba(200,180,120,.5)'; for (let x = 0; x < S; x += 24) c.fillRect(x, S * 0.095, 12, 4);
      break;
    }
    case 'dark': {
      c.fillStyle = rad(c, S * 0.5, S * 0.45, S * 0.8, ['#3a3940', '#26252a', '#18171b']); c.fillRect(0, 0, S, S);
      dots(c, r, 1500, 0, 0, S, S, ['rgba(255,255,255,.04)', 'rgba(0,0,0,.25)'], 0.6, 2.2);
      break;
    }
    default: { // wood
      c.fillStyle = lin(c, 0, 0, 0, S, ['#d6a674', '#bd8655']); c.fillRect(0, 0, S, S);
      const bh = S / 4;
      for (let b = 0; b < 4; b++) {
        const y0 = b * bh;
        c.fillStyle = `rgba(${b % 2 ? '255,230,200' : '90,50,20'},${R(r, 0.04, 0.1)})`; c.fillRect(0, y0, S, bh);
        for (let i = 0; i < 26; i++) {
          const y = y0 + R(r, 0, bh);
          c.strokeStyle = `rgba(100,55,20,${R(r, 0.08, 0.28)})`; c.lineWidth = R(r, 0.6, 2.4);
          c.beginPath(); c.moveTo(0, y);
          const f = R(r, 80, 260), a = R(r, 2, 7), ph = r() * TAU;
          for (let x = 0; x <= S; x += 20) c.lineTo(x, y + Math.sin(x / f + ph) * a);
          c.stroke();
        }
        if (r() < 0.6) { const kx = R(r, 100, S - 100), ky = y0 + R(r, 30, bh - 30); for (let k = 1; k < 6; k++) { c.strokeStyle = 'rgba(90,45,15,.18)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(kx, ky, k * 10, k * 4, 0, 0, TAU); c.stroke(); } }
        c.fillStyle = 'rgba(60,30,10,.45)'; c.fillRect(0, y0 + bh - 2, S, 3);
        c.fillStyle = 'rgba(255,240,220,.2)'; c.fillRect(0, y0 + bh + 1, S, 2);
      }
      const v = rad(c, S / 2, S / 2, S * 0.75, ['rgba(255,240,220,.12)', 'rgba(0,0,0,0)', 'rgba(40,20,0,.25)']);
      c.fillStyle = v; c.fillRect(0, 0, S, S);
    }
  }
}

/* ---------- 小物 ---------- */
export function drawChopsticks(c) {
  // 箸置き
  c.save();
  c.translate(870, 870); c.rotate(-0.62);
  c.fillStyle = 'rgba(40,20,0,.25)'; c.beginPath(); c.ellipse(4, 14, 36, 10, 0, 0, TAU); c.fill();
  c.fillStyle = lin(c, 0, -10, 0, 12, ['#fdfaf2', '#e2dccd']);
  c.beginPath(); c.ellipse(0, 0, 34, 12, 0, 0, TAU); c.fill();
  c.fillStyle = '#f2a1b5'; c.beginPath(); c.arc(-8, -2, 4, 0, TAU); c.arc(8, -2, 4, 0, TAU); c.fill();
  c.restore();
  for (let k = 0; k < 2; k++) {
    c.save();
    c.translate(600 + k * 22, 990 + k * 8); c.rotate(-0.62);
    c.fillStyle = 'rgba(40,20,0,.25)'; c.fillRect(0, 8, 470, 9);
    c.beginPath(); c.moveTo(0, -6); c.lineTo(470, -2.4); c.lineTo(470, 2.4); c.lineTo(0, 6); c.closePath();
    c.fillStyle = lin(c, 0, -6, 0, 6, ['#a8643a', '#7a3e1c', '#5a2a10']); c.fill();
    c.fillStyle = '#c8402a'; c.fillRect(20, -6, 120, 12);
    c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(0, -4, 470, 1.6);
    c.restore();
  }
}

// 静止画用の湯気
export function drawSteam(c, cx, topY, w, seed = 3, alpha = 1) {
  const r = rng(seed);
  c.save();
  c.globalCompositeOperation = 'screen';
  for (let k = 0; k < 5; k++) {
    let x = cx + R(r, -w * 0.4, w * 0.4), y = topY + R(r, 0, 30);
    const ph = r() * TAU, amp = R(r, 15, 35);
    for (let i = 0; i < 40; i++) {
      const t = i / 40;
      const xx = x + Math.sin(t * 6 + ph) * amp * t;
      const yy = y - t * R(r, 230, 330);
      const rr = 14 + t * 46;
      c.fillStyle = rad(c, xx, yy, rr, [`rgba(255,255,255,${0.09 * (1 - t) * alpha})`, 'rgba(255,255,255,0)']);
      c.beginPath(); c.arc(xx, yy, rr, 0, TAU); c.fill();
    }
  }
  c.restore();
}

export { blob };
