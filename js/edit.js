// ステップ4：加工（フィルター・調整・スタンプ・フレーム）
import { TAU, mk, rrect, lin, rad, rng, R, clamp } from './util.js';

export const ADJ = [
  { id: 'bright', name: '明るさ', min: -50, max: 50 },
  { id: 'contrast', name: 'コントラスト', min: -50, max: 50 },
  { id: 'sat', name: '彩度', min: -100, max: 60 },
  { id: 'warm', name: 'あたたかみ', min: -50, max: 50 },
  { id: 'pink', name: 'ピンク', min: 0, max: 60 },
  { id: 'fade', name: 'フェード', min: 0, max: 60 },
  { id: 'soft', name: 'ふんわり', min: 0, max: 80 },
  { id: 'leak', name: '光もれ', min: 0, max: 80 },
  { id: 'grain', name: 'フィルム粒子', min: 0, max: 60 },
  { id: 'vignette', name: '周辺減光', min: 0, max: 80 },
];
const Z = () => Object.fromEntries(ADJ.map((a) => [a.id, 0]));
export const PRESETS = [
  { id: 'natural', name: 'ナチュラル', adj: {} },
  { id: 'sizzle', name: 'シズル感', adj: { bright: 5, contrast: 16, sat: 28, warm: 14, vignette: 18 } },
  { id: 'fuwa', name: 'ふんわり', adj: { bright: 18, contrast: -14, sat: -4, pink: 10, fade: 10, soft: 40 } },
  { id: 'yume', name: 'ゆめかわ', adj: { bright: 14, contrast: -10, sat: -12, pink: 34, fade: 16, soft: 30, leak: 20 } },
  { id: 'emo', name: 'エモフィルム', adj: { contrast: -6, sat: -16, warm: 18, fade: 26, grain: 26, vignette: 34, leak: 32 } },
  { id: 'cafe', name: '韓国カフェ', adj: { bright: 12, contrast: -12, sat: -26, warm: 12, fade: 20, soft: 12 } },
  { id: 'showa', name: '昭和レトロ', adj: { warm: 32, sat: -22, fade: 22, grain: 38, vignette: 44, contrast: 6 } },
  { id: 'cool', name: 'クリア', adj: { bright: 8, contrast: 8, warm: -22, sat: 6 } },
  { id: 'mono', name: 'モノクロ', adj: { sat: -100, contrast: 16, grain: 16, vignette: 20 } },
].map((p) => ({ ...p, adj: { ...Z(), ...p.adj } }));
export const zeroAdj = Z;

// ピクセル処理
export function applyFilter(src, adj, seed = 1) {
  const w = src.width, h = src.height;
  const out = mk(w, h), c = out.getContext('2d');
  c.drawImage(src, 0, 0);
  // ふんわり（ソフトグロー）
  if (adj.soft > 0) {
    const sm = mk(Math.max(8, w / 14), Math.max(8, h / 14));
    const sc = sm.getContext('2d'); sc.imageSmoothingQuality = 'high';
    sc.drawImage(src, 0, 0, sm.width, sm.height);
    c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = (adj.soft / 100) * 0.75; c.imageSmoothingQuality = 'high';
    c.drawImage(sm, 0, 0, w, h); c.restore();
  }
  // 光もれ
  if (adj.leak > 0) {
    const a = adj.leak / 100;
    c.save(); c.globalCompositeOperation = 'screen';
    c.fillStyle = rad(c, w * 0.95, h * 0.05, w * 0.7, [`rgba(255,140,90,${a * 0.9})`, `rgba(255,120,160,${a * 0.4})`, 'rgba(255,120,160,0)']);
    c.fillRect(0, 0, w, h);
    c.fillStyle = rad(c, w * 0.02, h * 0.98, w * 0.5, [`rgba(255,220,140,${a * 0.5})`, 'rgba(255,220,140,0)']);
    c.fillRect(0, 0, w, h);
    c.restore();
  }
  const img = c.getImageData(0, 0, w, h), d = img.data;
  const br = adj.bright * 1.3, cf = (100 + adj.contrast) / 100, sat = 1 + adj.sat / 100;
  const wr = adj.warm * 0.45, pk = adj.pink * 0.5, fd = adj.fade / 100, gr = adj.grain * 0.9;
  const lut = new Float32Array(256);
  for (let i = 0; i < 256; i++) { let v = (i - 128) * cf + 128 + br; v = v * (1 - fd * 0.35) + fd * 60; lut[i] = v; }
  const r = rng(seed);
  for (let i = 0; i < d.length; i += 4) {
    let R0 = lut[d[i]], G0 = lut[d[i + 1]], B0 = lut[d[i + 2]];
    if (sat !== 1) { const gy = 0.299 * R0 + 0.587 * G0 + 0.114 * B0; R0 = gy + (R0 - gy) * sat; G0 = gy + (G0 - gy) * sat; B0 = gy + (B0 - gy) * sat; }
    R0 += wr + pk * 0.8; G0 += wr * 0.15 - pk * 0.25; B0 += -wr + pk * 0.5;
    if (gr) { const n = (r() - 0.5) * gr; R0 += n; G0 += n; B0 += n; }
    d[i] = R0; d[i + 1] = G0; d[i + 2] = B0;
  }
  c.putImageData(img, 0, 0);
  if (adj.vignette > 0) {
    c.save(); c.globalCompositeOperation = 'multiply';
    c.fillStyle = rad(c, w / 2, h / 2, w * 0.75, ['rgba(255,255,255,1)', [0.55, 'rgba(255,255,255,1)'], [1, `rgba(${255 - adj.vignette * 2.4},${255 - adj.vignette * 2.6},${255 - adj.vignette * 2.6},1)`]]);
    c.fillRect(0, 0, w, h); c.restore();
  }
  return out;
}

/* ---------- フレーム ---------- */
export const FRAMES = [
  { id: 'none', name: 'なし' },
  { id: 'white', name: '白フチ' },
  { id: 'polaroid', name: 'チェキ風' },
  { id: 'lace', name: 'ハートレース' },
  { id: 'film', name: 'フィルム' },
  { id: 'magazine', name: 'マガジン' },
];

export function frameRect(id, N) {
  switch (id) {
    case 'white': return { x: N * 0.045, y: N * 0.045, w: N * 0.91, h: N * 0.91, r: N * 0.03 };
    case 'polaroid': return { x: N * 0.08, y: N * 0.065, w: N * 0.84, h: N * 0.71, r: 4 };
    case 'lace': return { x: N * 0.09, y: N * 0.09, w: N * 0.82, h: N * 0.82, r: N * 0.06 };
    case 'film': return { x: N * 0.035, y: N * 0.13, w: N * 0.93, h: N * 0.74, r: 6 };
    default: return { x: 0, y: 0, w: N, h: N, r: 0 };
  }
}

function drawCover(c, img, rc) {
  const s = Math.max(rc.w / img.width, rc.h / img.height);
  const sw = rc.w / s, sh = rc.h / s;
  c.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2 - (img.height - sh) * 0.05, sw, sh, rc.x, rc.y, rc.w, rc.h);
}

function heart(c, x, y, s) {
  c.beginPath();
  c.moveTo(x, y + s * 0.3);
  c.bezierCurveTo(x, y - s * 0.1, x - s * 0.55, y - s * 0.15, x - s * 0.55, y + s * 0.2);
  c.bezierCurveTo(x - s * 0.55, y + s * 0.5, x - s * 0.1, y + s * 0.7, x, y + s * 0.9);
  c.bezierCurveTo(x + s * 0.1, y + s * 0.7, x + s * 0.55, y + s * 0.5, x + s * 0.55, y + s * 0.2);
  c.bezierCurveTo(x + s * 0.55, y - s * 0.15, x, y - s * 0.1, x, y + s * 0.3);
  c.closePath();
}

function dateStr() {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export function drawFrame(c, id, N, photo, name, frameColor) {
  const rc = frameRect(id, N);
  const fc = frameColor || '#ffd6e2';
  if (id === 'none' || id === 'magazine') {
    drawCover(c, photo, rc);
    if (id === 'magazine') {
      c.fillStyle = lin(c, 0, 0, 0, N * 0.3, ['rgba(0,0,0,.35)', 'rgba(0,0,0,0)']); c.fillRect(0, 0, N, N * 0.3);
      c.fillStyle = lin(c, 0, N * 0.75, 0, N, ['rgba(0,0,0,0)', 'rgba(0,0,0,.35)']); c.fillRect(0, N * 0.75, N, N * 0.25);
      c.fillStyle = '#fff'; c.textAlign = 'left'; c.textBaseline = 'top';
      c.font = `italic 700 ${N * 0.085}px "Playfair Display", Georgia, serif`;
      c.fillText('DONBURI', N * 0.05, N * 0.04);
      c.font = `500 ${N * 0.026}px "Zen Maru Gothic", sans-serif`;
      c.fillText('my favorite bowl  vol.01', N * 0.055, N * 0.14);
      c.textAlign = 'right'; c.textBaseline = 'bottom';
      c.font = `700 ${N * 0.03}px "Zen Maru Gothic", sans-serif`;
      c.fillText(dateStr(), N * 0.95, N * 0.95);
    }
    return rc;
  }
  if (id === 'white') {
    c.fillStyle = '#fffdfb'; c.fillRect(0, 0, N, N);
  } else if (id === 'polaroid') {
    c.fillStyle = fc; c.fillRect(0, 0, N, N);
    c.fillStyle = 'rgba(255,255,255,.5)';
    for (let i = 0; i < 40; i++) { const r = rng(i + 3); c.beginPath(); c.arc(r() * N, r() * N, N * 0.008, 0, TAU); c.fill(); }
    c.save(); c.shadowColor = 'rgba(0,0,0,.18)'; c.shadowBlur = N * 0.02; c.shadowOffsetY = N * 0.006;
    c.fillStyle = '#fffefb'; c.fillRect(N * 0.045, N * 0.03, N * 0.91, N * 0.94); c.restore();
  } else if (id === 'lace') {
    c.fillStyle = fc; c.fillRect(0, 0, N, N);
    c.fillStyle = '#fff';
    const s = N * 0.05;
    for (let x = s / 2; x < N; x += s) { for (const y of [s * 0.5, N - s * 0.5]) { c.beginPath(); c.arc(x, y, s * 0.55, 0, TAU); c.fill(); } }
    for (let y = s / 2; y < N; y += s) { for (const x of [s * 0.5, N - s * 0.5]) { c.beginPath(); c.arc(x, y, s * 0.55, 0, TAU); c.fill(); } }
    c.fillStyle = fc;
    for (let x = s / 2; x < N; x += s) { for (const y of [s * 0.5, N - s * 0.5]) { c.beginPath(); c.arc(x, y, s * 0.16, 0, TAU); c.fill(); } }
    for (let y = s / 2; y < N; y += s) { for (const x of [s * 0.5, N - s * 0.5]) { c.beginPath(); c.arc(x, y, s * 0.16, 0, TAU); c.fill(); } }
    c.fillStyle = '#fff';
    rrect(c, N * 0.07, N * 0.07, N * 0.86, N * 0.86, N * 0.07); c.fill();
  } else if (id === 'film') {
    c.fillStyle = '#1b1715'; c.fillRect(0, 0, N, N);
    c.fillStyle = '#f2ece4';
    const hw = N * 0.03, hh = N * 0.045;
    for (let x = N * 0.02; x < N; x += N * 0.065) { rrect(c, x, N * 0.035, hw, hh, 3); c.fill(); rrect(c, x, N - N * 0.035 - hh, hw, hh, 3); c.fill(); }
    c.fillStyle = '#f0a040'; c.font = `700 ${N * 0.022}px monospace`; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText('DONBURI 400  ▶ 12', N * 0.04, N * 0.105);
    c.fillText('▶ 12A', N * 0.8, N * 0.895);
  }
  c.save();
  rrect(c, rc.x, rc.y, rc.w, rc.h, rc.r); c.clip();
  drawCover(c, photo, rc);
  c.restore();
  if (id === 'polaroid') {
    c.fillStyle = '#7a5a54'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `${N * 0.06}px "Yomogi", "Hachi Maru Pop", cursive`;
    c.fillText(name || 'my donburi', N / 2, N * 0.85);
    c.font = `${N * 0.026}px "Yomogi", "Zen Maru Gothic", sans-serif`;
    c.fillStyle = '#b08a84';
    c.fillText(dateStr() + '  #丼メーカー', N / 2, N * 0.915);
  }
  if (id === 'lace') {
    c.fillStyle = '#ff8fab';
    for (const [x, y] of [[0.09, 0.09], [0.91, 0.09], [0.09, 0.91], [0.91, 0.91]]) { heart(c, x * N, y * N - N * 0.03, N * 0.07); c.fill(); }
  }
  return rc;
}

/* ---------- スタンプ ---------- */
export const STICKERS = [
  { type: 'emoji', v: '💕' }, { type: 'emoji', v: '✨' }, { type: 'emoji', v: '🌸' }, { type: 'emoji', v: '🎀' },
  { type: 'emoji', v: '⭐' }, { type: 'emoji', v: '😋' }, { type: 'emoji', v: '🥢' }, { type: 'emoji', v: '🍚' },
  { type: 'emoji', v: '🔥' }, { type: 'emoji', v: '💯' }, { type: 'emoji', v: '🫶' }, { type: 'emoji', v: '🐣' },
  { type: 'emoji', v: '🍓' }, { type: 'emoji', v: '🧸' }, { type: 'emoji', v: '🌈' }, { type: 'emoji', v: '👑' },
  { type: 'text', v: 'おいしい♡', col: '#ff7a9a' }, { type: 'text', v: 'いただきます', col: '#ffb24d' },
  { type: 'text', v: '飯テロ注意', col: '#ff5a4d' }, { type: 'text', v: 'Yummy!', col: '#a58bf0' },
  { type: 'text', v: '自信作です', col: '#4fc3a1' }, { type: 'text', v: 'おうち丼', col: '#f48fb1' },
  { type: 'text', v: 'つゆだく♡', col: '#c9915a' }, { type: 'text', v: '大盛り！', col: '#ff8a3d' },
  { type: 'sparkle', v: 'キラキラ' }, { type: 'hearts', v: 'ハート散らし' },
];

function measureSticker(c, s, N) {
  const size = s.size * N;
  if (s.type === 'emoji') return { w: size, h: size };
  if (s.type === 'text' || s.type === 'title') {
    c.font = fontFor(s, size);
    const w = c.measureText(s.v).width;
    return s.type === 'title' ? { w: w + size * 0.4, h: size * 1.3 } : { w: w + size * 1.1, h: size * 1.7 };
  }
  return { w: size * 2.4, h: size * 2.4 };
}
function fontFor(s, size) {
  if (s.type === 'title') return `${size}px "Hachi Maru Pop", "Zen Maru Gothic", sans-serif`;
  return `700 ${size}px "Zen Maru Gothic", sans-serif`;
}

export function drawSticker(c, s, N, selected) {
  const size = s.size * N, x = s.x * N, y = s.y * N;
  c.save();
  c.translate(x, y); c.rotate(s.rot || 0);
  c.textAlign = 'center'; c.textBaseline = 'middle';
  const m = measureSticker(c, s, N);
  if (s.type === 'emoji') {
    c.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
    c.shadowColor = 'rgba(0,0,0,.18)'; c.shadowBlur = size * 0.08; c.shadowOffsetY = size * 0.04;
    c.fillText(s.v, 0, size * 0.05);
  } else if (s.type === 'text') {
    c.shadowColor = 'rgba(0,0,0,.18)'; c.shadowBlur = size * 0.2; c.shadowOffsetY = size * 0.08;
    rrect(c, -m.w / 2, -m.h / 2, m.w, m.h, m.h / 2);
    c.fillStyle = '#fff'; c.fill();
    c.shadowColor = 'transparent';
    rrect(c, -m.w / 2 + size * 0.14, -m.h / 2 + size * 0.14, m.w - size * 0.28, m.h - size * 0.28, m.h / 2);
    c.fillStyle = s.col; c.fill();
    c.font = fontFor(s, size); c.fillStyle = '#fff';
    c.fillText(s.v, 0, size * 0.04);
  } else if (s.type === 'title') {
    c.font = fontFor(s, size);
    c.lineJoin = 'round';
    c.lineWidth = size * 0.28; c.strokeStyle = '#fff';
    c.shadowColor = 'rgba(0,0,0,.2)'; c.shadowBlur = size * 0.15; c.shadowOffsetY = size * 0.05;
    c.strokeText(s.v, 0, 0);
    c.shadowColor = 'transparent';
    c.fillStyle = s.col || '#ff6f91'; c.fillText(s.v, 0, 0);
  } else if (s.type === 'sparkle') {
    const r = rng(7);
    for (let i = 0; i < 9; i++) {
      const px = R(r, -m.w / 2, m.w / 2), py = R(r, -m.h / 2, m.h / 2), ss = R(r, 0.15, 0.4) * size;
      c.fillStyle = i % 3 ? '#fff' : '#fff2a8';
      c.shadowColor = 'rgba(255,255,255,.9)'; c.shadowBlur = ss * 0.6;
      c.beginPath(); c.moveTo(px, py - ss); c.quadraticCurveTo(px, py, px + ss * 0.35, py); c.quadraticCurveTo(px, py, px, py + ss); c.quadraticCurveTo(px, py, px - ss * 0.35, py); c.quadraticCurveTo(px, py, px, py - ss); c.fill();
      c.beginPath(); c.moveTo(px - ss * 0.6, py); c.quadraticCurveTo(px, py, px, py - ss * 0.2); c.quadraticCurveTo(px, py, px + ss * 0.6, py); c.quadraticCurveTo(px, py, px, py + ss * 0.2); c.quadraticCurveTo(px, py, px - ss * 0.6, py); c.fill();
    }
  } else if (s.type === 'hearts') {
    const r = rng(11);
    for (let i = 0; i < 8; i++) {
      const px = R(r, -m.w / 2, m.w / 2), py = R(r, -m.h / 2, m.h / 2), ss = R(r, 0.2, 0.45) * size;
      c.fillStyle = ['#ff8fab', '#ffb3c8', '#ff6f91', '#fff'][i % 4];
      c.shadowColor = 'rgba(0,0,0,.12)'; c.shadowBlur = ss * 0.2;
      c.save(); c.translate(px, py); c.rotate(R(r, -0.5, 0.5)); heart(c, 0, -ss * 0.45, ss); c.fill(); c.restore();
    }
  }
  if (selected) {
    c.shadowColor = 'transparent';
    c.setLineDash([N * 0.01, N * 0.008]); c.lineWidth = Math.max(2, N * 0.003); c.strokeStyle = '#ff6f91';
    c.strokeRect(-m.w / 2 - 8, -m.h / 2 - 8, m.w + 16, m.h + 16);
  }
  c.restore();
  s._bb = { w: m.w + 16, h: m.h + 16 };
}

export function hitSticker(list, nx, ny, N) {
  for (let i = list.length - 1; i >= 0; i--) {
    const s = list[i]; if (!s._bb) continue;
    const dx = nx * N - s.x * N, dy = ny * N - s.y * N;
    const a = -(s.rot || 0);
    const lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a);
    if (Math.abs(lx) < s._bb.w / 2 && Math.abs(ly) < s._bb.h / 2) return i;
  }
  return -1;
}

export { clamp };
