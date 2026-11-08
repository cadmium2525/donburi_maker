// シーン合成（背景＋器＋ごはん＋具材）
import { rng, hash, mk, R, TAU } from './util.js';
import { ING_MAP } from './ingredients.js';
import { geom, DESIGN_MAP, drawBg, drawBowlBack, drawBowlFront, drawRice, riceInfo, ricePath, drawChopsticks, drawSteam } from './bowls.js';

export const PERSP = 0.8;
const SPR = 2;
export const NV = 4;
export const BASE = 1.45; // 具材の基準倍率（器に対するリアルな大きさ）
const sprites = new Map();

export function sprite(def, v) {
  const key = def.id + ':' + v;
  let s = sprites.get(key);
  if (s) return s;
  const P = def.S + 20, px = Math.ceil(P * SPR);
  const t = mk(px, px), tc = t.getContext('2d');
  tc.setTransform(SPR, 0, 0, SPR, px / 2, px / 2);
  def.draw(tc, rng(hash(def.id) + v * 7919));
  if (def.shadow > 0) {
    s = mk(px, px);
    const sc = s.getContext('2d');
    sc.shadowColor = `rgba(50,25,0,${def.shadow})`;
    sc.shadowBlur = 5 * SPR; sc.shadowOffsetY = 3 * SPR;
    sc.drawImage(t, 0, 0);
  } else s = t;
  sprites.set(key, s);
  return s;
}

export function drawItem(c, it) {
  const def = ING_MAP[it.id];
  if (!def) return;
  const spr = sprite(def, it.v % NV);
  const P = def.S + 20;
  c.save();
  c.translate(it.x, it.y);
  c.scale(it.s, it.s * PERSP);
  c.rotate(it.r);
  if (def.blend) c.globalCompositeOperation = def.blend;
  c.drawImage(spr, -P / 2, -P / 2, P, P);
  c.restore();
}

export function itemHit(it, x, y) {
  const def = ING_MAP[it.id];
  const rr = Math.max(14, def.S * it.s * 0.38);
  const dx = x - it.x, dy = (y - it.y) / PERSP;
  return dx * dx + dy * dy < rr * rr;
}

// 具材アイコン
const icons = new Map();
export function icon(def, size = 72) {
  if (icons.has(def.id)) return icons.get(def.id);
  const c = mk(size * 2, size * 2), x = c.getContext('2d');
  const r = rng(hash(def.id) + 5);
  let area = def.S;
  if (def.kind === 'sprinkle') area = Math.max(def.S * 1.6, (def.spread * 1.1 + def.S) * 0.9);
  if (def.kind === 'sauce') area = def.S < 60 ? 70 : def.S * 1.1;
  const k = (size * 2) / area;
  x.setTransform(k, 0, 0, k, size, size);
  const P = def.S + 20;
  const put = (px, py, v, rot = 0) => { x.save(); x.translate(px, py); x.rotate(rot); x.drawImage(sprite(def, v), -P / 2, -P / 2, P, P); x.restore(); };
  if (def.kind === 'sprinkle') {
    const n = Math.min(def.count, 16) || 1;
    for (let i = 0; i < n; i++) { const a = r() * TAU, d = Math.sqrt(r()) * def.spread * 0.6; put(Math.cos(a) * d, Math.sin(a) * d, i, r() * TAU); }
  } else if (def.kind === 'sauce' && def.S < 60) {
    for (let i = 0; i < 12; i++) put(-25 + i * 4.5, Math.sin(i / 2) * 8, i);
  } else put(0, 0, 0, def.id === 'katsu' || def.id === 'chickenkatsu' || def.id === 'unagi' || def.id === 'anago' ? 0 : -0.25);
  const url = c.toDataURL();
  icons.set(def.id, url);
  return url;
}

/* ---- 具材を置く ---- */
let hitCtx = null;
function inPath(p, x, y) { if (!hitCtx) hitCtx = mk(1, 1).getContext('2d'); return hitCtx.isPointInPath(p, x, y); }

export function surface(st) {
  const g = geom(st.shape);
  const info = riceInfo(g, st.rice);
  return { g, info, path: ricePath(g, info, 0.93) };
}
export function clampToSurface(surf, x, y) {
  const { g, path } = surf;
  if (inPath(path, x, y)) return [x, y];
  const tx = g.cx, ty = surf.info.type === 'dome' ? g.cy - surf.info.dome * 0.5 : g.cy + g.iy * 0.2;
  for (let k = 1; k <= 12; k++) {
    const t = k / 12, nx = x + (tx - x) * t, ny = y + (ty - y) * t;
    if (inPath(path, nx, ny)) return [nx, ny];
  }
  return [tx, ty];
}

// 具材の厚み（積み重ね用）
function thick(it) {
  const d = ING_MAP[it.id];
  if (d.blend || d.shadow === 0) return 0;
  if (d.kind === 'sauce') return d.S < 60 ? 0.5 : 5 * it.s;
  if (d.kind === 'sprinkle') return Math.min(8, d.S * 0.25) * it.s;
  return (d.T ?? Math.min(40, d.S * 0.24)) * it.s;
}
// 指定位置の一番上の具材の高さ
export function stackAt(items, x, y) {
  let h = 0, t = 0;
  for (const it of items) {
    const top = (it.h || 0) + thick(it);
    if (top > h && itemHit(it, x, y)) { h = top; t = thick(it); }
  }
  return { h: Math.min(h, 420), t };
}

export function makeItems(st, def, x, y, size, group, r = Math.random) {
  size *= BASE;
  const surf = surface(st);
  const out = [];
  const all = st.items;
  const one = (px, py, sc) => {
    const sk = stackAt(all.concat(out), px, py);
    let cx = px, cy = py;
    if (sk.h > 0) cy = py - sk.t * 0.9; // 下の具材の上に重ねる（てんこ盛りOK）
    else [cx, cy] = clampToSurface(surf, px, py);
    out.push({ id: def.id, x: cx, y: cy, h: sk.h, s: sc, r: (r() * 2 - 1) * def.rot, v: Math.floor(r() * NV * 4), g: group });
  };
  if (def.kind === 'sprinkle') {
    const n = Math.max(1, Math.round(def.count * (0.6 + size * 0.4)));
    for (let i = 0; i < n; i++) {
      const a = r() * TAU, d = Math.sqrt(r()) * def.spread * size;
      one(x + Math.cos(a) * d, y + Math.sin(a) * d * PERSP, size * R(r, 0.85, 1.1) * def.scale);
    }
  } else {
    one(x, y, size * def.scale * R(r, 0.93, 1.07));
  }
  return out;
}

/* ---- 合成 ---- */
const baseCache = { key: '', canvas: null };
export function baseKey(st, px) { return [st.bg, st.design, st.shape, Math.round(st.rice), px].join('|'); }

export function renderBase(st, px) {
  const key = baseKey(st, px);
  if (baseCache.key === key) return baseCache.canvas;
  const cv = baseCache.canvas && baseCache.canvas.width === px ? baseCache.canvas : mk(px, px);
  const c = cv.getContext('2d');
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, px, px);
  const k = px / 1000;
  c.setTransform(k, 0, 0, k, 0, 0);
  drawBg(c, st.bg);
  const d = DESIGN_MAP[st.design], g = geom(st.shape);
  drawBowlBack(c, d, g, hash(st.design));
  drawRice(c, d, g, st.rice);
  drawBowlFront(c, d, g);
  baseCache.key = key; baseCache.canvas = cv;
  return cv;
}

export function renderItems(c, items, k) {
  c.setTransform(k, 0, 0, k, 0, 0);
  for (const it of items) drawItem(c, it);
}

// 完成シーン（加工用）
export function renderFull(st, px, opts = {}) {
  const cv = mk(px, px), c = cv.getContext('2d');
  c.drawImage(renderBase(st, px), 0, 0);
  const k = px / 1000;
  renderItems(c, st.items, k);
  c.setTransform(k, 0, 0, k, 0, 0);
  if (opts.chopsticks) drawChopsticks(c);
  if (opts.steam) {
    const g = geom(st.shape), info = riceInfo(g, st.rice);
    const top = info.type === 'dome' ? g.cy - g.iy - info.dome * 0.7 : g.cy - g.iy * 0.5;
    drawSteam(c, g.cx, top, g.rx, 5, opts.steam);
  }
  return cv;
}
