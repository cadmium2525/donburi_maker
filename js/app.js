import { mk, toast, rng, clamp } from './util.js';
import { CATS, ING, ING_MAP } from './ingredients.js';
import { SHAPES, DESIGNS, BGS, geom, drawBowlBack, drawBowlFront, drawRice, DESIGN_MAP } from './bowls.js';
import { renderBase, renderItems, renderFull, makeItems, itemHit, icon, surface, clampToSurface, baseKey, BASE } from './scene.js';
import { RiceStep, riceLabel } from './rice.js';
import { ADJ, PRESETS, zeroAdj, applyFilter, FRAMES, drawFrame, STICKERS, drawSticker, hitSticker } from './edit.js';
import { guessName, buildTags, buildText, TEMPLATES } from './share.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const DPR = () => Math.min(2, window.devicePixelRatio || 1);

const st = {
  design: 'urushi', shape: 'std', rice: 0, bg: 'wood', items: [], group: 0, ver: 0,
  edit: { preset: 'natural', adj: zeroAdj(), frame: 'none', frameColor: '#ffd6e2', chopsticks: true, steam: 0.7, stickers: [] },
  name: '', nameEdited: false, tags: [], tagOff: new Set(), custom: [], tpl: 0,
};
let step = 0;

/* =============== ステップ制御 =============== */
const STEP_INFO = {
  1: { cap: '器をえらんでね', next: 'ごはんへ ›' },
  2: { cap: '炊きたてごはん、どれくらい？', next: 'トッピングへ ›' },
  3: { cap: '好きな具材を好きなだけ！', next: '加工へ ›' },
  4: { cap: 'かわいく・おいしそうに加工', next: 'シェアへ ›' },
  5: { cap: 'できあがり！みんなに見せよう', next: '' },
};
function go(n) {
  if (n < 1) { showTitle(); return; }
  if (step === 2) rice.stop();
  step = n;
  $('#title').hidden = true; $('#work').hidden = false; $('#nav').hidden = false;
  $$('#steps li').forEach((li) => { const s = +li.dataset.step; li.classList.toggle('on', s === n); li.classList.toggle('done', s < n); });
  $$('.pane').forEach((p) => (p.hidden = +p.dataset.pane !== n));
  $('#stage').hidden = !(n === 1 || n === 3);
  $('#riceView').hidden = n !== 2;
  $('#editView').hidden = n !== 4;
  $('#finalImg').hidden = n !== 5;
  $('#stageInner').classList.toggle('wide', n === 2);
  $('#stageCaption').textContent = STEP_INFO[n].cap;
  $('#nextBtn').textContent = STEP_INFO[n].next;
  $('#nextBtn').style.visibility = n === 5 ? 'hidden' : 'visible';
  $('.panel').scrollTop = 0;
  requestAnimationFrame(() => {
    if (n === 1 || n === 3) renderStage(true);
    if (n === 2) { rice.start(); updateRiceUI(); }
    if (n === 3) { showCat(curCat); updateHint(); }
    if (n === 4) enterEdit();
    if (n === 5) enterShare();
  });
}
function showTitle() {
  if (step === 2) rice.stop();
  step = 0;
  $('#title').hidden = false; $('#work').hidden = true; $('#nav').hidden = true;
  $$('#steps li').forEach((li) => li.classList.remove('on', 'done'));
}
$('#startBtn').onclick = () => go(1);
$('#logoBtn').onclick = () => showTitle();
$('#backBtn').onclick = () => go(step - 1);
$('#nextBtn').onclick = () => {
  if (step === 2 && st.rice === 0) toast('ごはんなし…！それもまた一興🍚');
  go(step + 1);
};
$$('#steps li').forEach((li) => (li.onclick = () => { if (step > 0) go(+li.dataset.step); }));

/* =============== ステージ（器・トッピング） =============== */
const stage = $('#stage'), sctx = stage.getContext('2d');
let layer = mk(10, 10);
function stagePx() { return Math.round(Math.min(1400, (stage.clientWidth || 480) * DPR())); }
function renderStage(full) {
  const px = stagePx();
  if (stage.width !== px) { stage.width = stage.height = px; full = true; }
  if (layer.width !== px) { layer = mk(px, px); full = true; }
  if (full) {
    const lc = layer.getContext('2d');
    lc.setTransform(1, 0, 0, 1, 0, 0); lc.clearRect(0, 0, px, px);
    renderItems(lc, st.items, px / 1000);
  }
  composite();
}
function composite() {
  sctx.setTransform(1, 0, 0, 1, 0, 0);
  sctx.drawImage(renderBase(st, stage.width), 0, 0);
  sctx.drawImage(layer, 0, 0);
}
let selGrp = [];
function addItems(list) {
  st.items.push(...list); st.ver++;
  if (list.length && ING_MAP[list[0].id].kind !== 'sauce') selGrp = list;
  renderItems(layer.getContext('2d'), list, layer.width / 1000);
  composite();
}

/* ---- ① 器 ---- */
function bowlThumb(design, shape, size = 200) {
  const c = mk(size, size), x = c.getContext('2d');
  const g = geom(shape);
  const k = size / 860;
  x.setTransform(k, 0, 0, k, -70 * k, -(g.cy - 400) * k - 60 * k);
  const d = DESIGN_MAP[design];
  drawBowlBack(x, d, g, 1); drawBowlFront(x, d, g);
  return c.toDataURL();
}
function buildBowlUI() {
  const sl = $('#shapeList');
  sl.innerHTML = '';
  Object.entries(SHAPES).forEach(([id, s]) => {
    const b = document.createElement('button');
    b.className = 'chip' + (st.shape === id ? ' on' : ''); b.textContent = s.name;
    b.onclick = () => { st.shape = id; st.items = []; buildBowlUI(); renderStage(true); };
    sl.appendChild(b);
  });
  const bl = $('#bowlList');
  bl.innerHTML = '';
  DESIGNS.forEach((d) => {
    const b = document.createElement('button');
    b.className = 'bowl-card' + (st.design === d.id ? ' on' : '');
    b.innerHTML = `<img alt="" src="${bowlThumb(d.id, st.shape)}"><span>${d.name}</span>`;
    b.onclick = () => { st.design = d.id; $$('.bowl-card').forEach((e) => e.classList.remove('on')); b.classList.add('on'); renderStage(false); };
    bl.appendChild(b);
  });
}

/* ---- ② ごはん ---- */
const rice = new RiceStep($('#riceView'), st, () => updateRiceUI());
function updateRiceUI() {
  $('#riceG').textContent = st.rice;
  $('#riceL').textContent = riceLabel(st.rice);
  $('#riceK').textContent = Math.round(st.rice * 1.56);
  $('#riceC').textContent = (st.rice / 150).toFixed(1);
  $('#riceBar').style.width = (st.rice / 700) * 100 + '%';
}
$$('[data-rice]').forEach((b) => (b.onclick = () => {
  const v = b.dataset.rice;
  rice.set(v === 'reset' ? 0 : st.rice + +v);
}));

/* ---- ③ トッピング ---- */
let curCat = 'meat', sel = null, tool = 'put';
function buildCatTabs() {
  const t = $('#catTabs');
  CATS.forEach((c) => {
    const b = document.createElement('button');
    b.className = 'tab'; b.dataset.cat = c.id; b.innerHTML = `<span>${c.icon}</span>${c.name}`;
    b.onclick = () => showCat(c.id);
    t.appendChild(b);
  });
}
function showCat(id) {
  curCat = id;
  $$('#catTabs .tab').forEach((b) => b.classList.toggle('on', b.dataset.cat === id));
  const grid = $('#ingGrid');
  grid.innerHTML = '';
  const defs = ING.filter((d) => d.cat === id);
  defs.forEach((d) => {
    const b = document.createElement('button');
    b.className = 'ing' + (sel === d.id ? ' on' : '');
    b.dataset.id = d.id;
    b.innerHTML = `<span class="ico"></span><span class="nm">${d.name}</span>`;
    b.onclick = () => { sel = d.id; setTool('put'); $$('#ingGrid .ing').forEach((e) => e.classList.toggle('on', e === b)); updateHint(); };
    grid.appendChild(b);
  });
  // アイコンは少しずつ生成（重いので）
  let i = 0;
  const step2 = () => {
    if (curCat !== id) return;
    const t0 = performance.now();
    while (i < defs.length && performance.now() - t0 < 30) {
      const b = grid.children[i]; const img = new Image(); img.alt = ''; img.src = icon(defs[i]);
      b.querySelector('.ico').appendChild(img); i++;
    }
    if (i < defs.length) setTimeout(step2, 0);
  };
  step2();
}
function setTool(t) { tool = t; $$('#toolSeg button').forEach((b) => b.classList.toggle('on', b.dataset.tool === t)); updateHint(); }
$$('#toolSeg button').forEach((b) => (b.onclick = () => setTool(b.dataset.tool)));
function updateHint() {
  const h = $('#topHint');
  if (tool === 'move') { h.textContent = '✋ 具材をドラッグで移動。触った具材は「回転」ボタンで向きを変えられるよ'; return; }
  if (tool === 'erase') { h.textContent = '🧽 とりたい具材をタップ（なぞるとまとめて取れる）'; return; }
  const d = sel && ING_MAP[sel];
  if (!d) { h.textContent = '👆 まずは具材をえらんでね'; return; }
  h.innerHTML = `<b>${d.name}</b>：` + (d.kind === 'piece' ? 'タップしてのせてね（具材の上に重ねて、てんこ盛りもOK！）' : d.kind === 'sprinkle' ? 'タップ or なぞってパラパラ散らそう' : 'なぞってかけてね（とろ〜り）');
}
const sizeR = $('#sizeRange');

function scenePt(e) { const b = stage.getBoundingClientRect(); return [((e.clientX - b.left) / b.width) * 1000, ((e.clientY - b.top) / b.height) * 1000]; }
let drag = null, rafPending = false;
function scheduleFull() { if (rafPending) return; rafPending = true; requestAnimationFrame(() => { rafPending = false; renderStage(true); }); }
function place(x, y) {
  const d = ING_MAP[sel];
  addItems(makeItems(st, d, x, y, +sizeR.value, st.group));
}
function eraseAt(x, y) {
  for (let i = st.items.length - 1; i >= 0; i--) if (itemHit(st.items[i], x, y)) { st.items.splice(i, 1); st.ver++; scheduleFull(); return true; }
  return false;
}
stage.addEventListener('pointerdown', (e) => {
  if (step !== 3) return;
  e.preventDefault();
  const [x, y] = scenePt(e);
  stage.setPointerCapture(e.pointerId);
  if (tool === 'put') {
    if (!sel) { toast('下のリストから具材をえらんでね👇'); return; }
    st.group++;
    place(x, y);
    drag = { mode: 'put', lx: x, ly: y };
  } else if (tool === 'move') {
    for (let i = st.items.length - 1; i >= 0; i--) {
      const it = st.items[i];
      if (itemHit(it, x, y)) {
        // 同じグループ（散らしたもの）はまとめて動かす
        const grp = ING_MAP[it.id].kind === 'sprinkle' ? st.items.filter((o) => o.g === it.g && o.id === it.id) : [it];
        st.items = st.items.filter((o) => !grp.includes(o)).concat(grp);
        drag = { mode: 'move', grp, lx: x, ly: y }; selGrp = grp;
        scheduleFull();
        break;
      }
    }
  } else if (tool === 'erase') { eraseAt(x, y); drag = { mode: 'erase' }; }
});
stage.addEventListener('pointermove', (e) => {
  if (!drag || step !== 3) return;
  const [x, y] = scenePt(e);
  if (drag.mode === 'put') {
    const d = ING_MAP[sel];
    if (d.kind === 'piece') return;
    const sp = (d.kind === 'sauce' ? d.step : d.spread * 1.1) * +sizeR.value * BASE;
    const dist = Math.hypot(x - drag.lx, y - drag.ly);
    if (dist >= sp) {
      const n = Math.floor(dist / sp);
      for (let i = 1; i <= n; i++) place(drag.lx + ((x - drag.lx) * i) / n, drag.ly + ((y - drag.ly) * i) / n);
      drag.lx = x; drag.ly = y;
    }
  } else if (drag.mode === 'move') {
    const dx = x - drag.lx, dy = y - drag.ly;
    const surf = surface(st);
    for (const it of drag.grp) { if (it.h > 0) { it.x += dx; it.y += dy; } else { const [nx, ny] = clampToSurface(surf, it.x + dx, it.y + dy); it.x = nx; it.y = ny; } }
    drag.lx = x; drag.ly = y; st.ver++;
    scheduleFull();
  } else if (drag.mode === 'erase') eraseAt(x, y);
});
const endDrag = () => { drag = null; };
stage.addEventListener('pointerup', endDrag);
stage.addEventListener('pointercancel', endDrag);

function rotateSel(deg) {
  const live = selGrp.filter((it) => st.items.includes(it));
  if (!live.length) { toast('「うごかす」で具材をタップしてから回転してね'); return; }
  const a = (deg * Math.PI) / 180;
  if (live.length === 1) live[0].r += a;
  else {
    const cx = live.reduce((v, i) => v + i.x, 0) / live.length, cy = live.reduce((v, i) => v + i.y, 0) / live.length;
    for (const it of live) { const dx = it.x - cx, dy = (it.y - cy) / 0.8; it.x = cx + dx * Math.cos(a) - dy * Math.sin(a); it.y = cy + (dx * Math.sin(a) + dy * Math.cos(a)) * 0.8; it.r += a; }
  }
  st.ver++; scheduleFull();
}
$$('[data-rot]').forEach((b) => (b.onclick = () => rotateSel(+b.dataset.rot)));
$('#undoBtn').onclick = () => {
  if (!st.items.length) return;
  const g = Math.max(...st.items.map((i) => i.g));
  st.items = st.items.filter((i) => i.g !== g); st.ver++;
  renderStage(true);
};
$('#clearBtn').onclick = () => {
  if (!st.items.length) return;
  if (!confirm('のせた具材を全部とりますか？')) return;
  st.items = []; st.ver++; renderStage(true);
};

/* =============== ④ 加工 =============== */
const ev = $('#editView'), ectx = ev.getContext('2d');
let selSticker = -1;
const cache = { sceneKey: '', scene: null, procKey: '', proc: null };
function sceneKeyFor(N) { return [baseKey(st, N), st.ver, st.items.length, st.edit.chopsticks, st.edit.steam].join('|'); }
function getProcessed(N) {
  const sk = sceneKeyFor(N);
  if (cache.sceneKey !== sk) { cache.scene = renderFull(st, N, { chopsticks: st.edit.chopsticks, steam: st.edit.steam }); cache.sceneKey = sk; cache.procKey = ''; }
  const pk = sk + JSON.stringify(st.edit.adj);
  if (cache.procKey !== pk) { cache.proc = applyFilter(cache.scene, st.edit.adj); cache.procKey = pk; }
  return cache.proc;
}
function currentName() { return st.name || guessName(st.items, st.rice); }
function compose(c, N, showSel) {
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, N, N);
  drawFrame(c, st.edit.frame, N, getProcessed(N), currentName(), st.edit.frameColor);
  st.edit.stickers.forEach((s, i) => { if (s.type === 'title') s.v = currentName(); drawSticker(c, s, N, showSel && i === selSticker); });
}
function editPx() { return Math.round(Math.min(1080, (ev.clientWidth || 480) * DPR())); }
let editRaf = false;
function renderEdit() {
  if (editRaf) return; editRaf = true;
  requestAnimationFrame(() => {
    editRaf = false;
    const N = editPx();
    if (ev.width !== N) { ev.width = ev.height = N; }
    compose(ectx, N, true);
  });
}
function enterEdit() {
  if (!st.nameEdited) st.name = '';
  $('#nameInput').value = currentName();
  if (!st.edit._init) {
    st.edit._init = true;
    st.edit.stickers.push({ type: 'title', v: currentName(), x: 0.5, y: 0.1, size: 0.075, rot: -0.04, col: '#ff6f91' });
  }
  $('#titleChk').checked = st.edit.stickers.some((s) => s.type === 'title');
  buildPresets();
  syncAdj();
  updateSelTools();
  renderEdit();
}
function buildPresets() {
  const list = $('#presetList');
  list.innerHTML = '';
  const small = applyFilter(renderFull(st, 150, { chopsticks: st.edit.chopsticks, steam: st.edit.steam }), zeroAdj());
  PRESETS.forEach((p) => {
    const b = document.createElement('button');
    b.className = 'preset' + (st.edit.preset === p.id ? ' on' : '');
    b.innerHTML = `<img alt=""><span>${p.name}</span>`;
    b.querySelector('img').src = applyFilter(small, p.adj, 2).toDataURL('image/jpeg', 0.8);
    b.onclick = () => {
      st.edit.preset = p.id; st.edit.adj = { ...p.adj };
      $$('.preset').forEach((e) => e.classList.toggle('on', e === b));
      syncAdj(); renderEdit();
    };
    list.appendChild(b);
  });
}
function buildAdj() {
  const box = $('#adjList');
  ADJ.forEach((a) => {
    const row = document.createElement('label');
    row.className = 'slider';
    row.innerHTML = `<span>${a.name}</span><input type="range" min="${a.min}" max="${a.max}" step="1" data-adj="${a.id}"><output></output>`;
    const inp = row.querySelector('input');
    inp.oninput = () => { st.edit.adj[a.id] = +inp.value; row.querySelector('output').textContent = inp.value; renderEdit(); };
    box.appendChild(row);
  });
  $('#adjReset').onclick = () => { st.edit.adj = zeroAdj(); st.edit.preset = 'natural'; syncAdj(); buildPresets(); renderEdit(); };
}
function syncAdj() { $$('[data-adj]').forEach((i) => { i.value = st.edit.adj[i.dataset.adj]; i.nextElementSibling.textContent = i.value; }); }

function buildStamps() {
  const g = $('#stampList');
  STICKERS.forEach((s) => {
    const b = document.createElement('button');
    b.className = 'stamp ' + s.type;
    if (s.type === 'text') { b.textContent = s.v; b.style.background = s.col; }
    else if (s.type === 'emoji') b.textContent = s.v;
    else b.textContent = s.type === 'sparkle' ? '✦ キラキラ' : '♡ ハート散らし';
    b.onclick = () => {
      const r = Math.random;
      const size = s.type === 'emoji' ? 0.1 : s.type === 'text' ? 0.05 : 0.09;
      st.edit.stickers.push({ ...s, x: 0.25 + r() * 0.5, y: 0.2 + r() * 0.6, size, rot: (r() - 0.5) * 0.5 });
      selSticker = st.edit.stickers.length - 1;
      updateSelTools(); renderEdit();
    };
    g.appendChild(b);
  });
}
function updateSelTools() {
  const s = st.edit.stickers[selSticker];
  $('#selTools').classList.toggle('off', !s);
  if (s) { $('#stkSize').value = s.size; $('#stkRot').value = Math.round(((s.rot || 0) * 180) / Math.PI); }
}
$('#stkSize').oninput = (e) => { const s = st.edit.stickers[selSticker]; if (s) { s.size = +e.target.value; renderEdit(); } };
$('#stkRot').oninput = (e) => { const s = st.edit.stickers[selSticker]; if (s) { s.rot = (+e.target.value * Math.PI) / 180; renderEdit(); } };
$('#stkDel').onclick = () => {
  const s = st.edit.stickers[selSticker]; if (!s) return;
  st.edit.stickers.splice(selSticker, 1);
  if (s.type === 'title') $('#titleChk').checked = false;
  selSticker = -1; updateSelTools(); renderEdit();
};
$('#stkClear').onclick = () => { st.edit.stickers = st.edit.stickers.filter((s) => s.type === 'title'); selSticker = -1; updateSelTools(); renderEdit(); };

function edPt(e) { const b = ev.getBoundingClientRect(); return [(e.clientX - b.left) / b.width, (e.clientY - b.top) / b.height]; }
let edrag = null;
ev.addEventListener('pointerdown', (e) => {
  const [nx, ny] = edPt(e);
  const i = hitSticker(st.edit.stickers, nx, ny, ev.width);
  selSticker = i;
  if (i >= 0) {
    const s = st.edit.stickers.splice(i, 1)[0]; st.edit.stickers.push(s); selSticker = st.edit.stickers.length - 1;
    edrag = { dx: nx - s.x, dy: ny - s.y };
    ev.setPointerCapture(e.pointerId);
    if (s.type !== 'title' && !$('[data-etab="stamp"]').classList.contains('on')) showETab(s.type === 'title' ? 'text' : 'stamp');
  }
  updateSelTools(); renderEdit();
  e.preventDefault();
});
ev.addEventListener('pointermove', (e) => {
  if (!edrag) return;
  const s = st.edit.stickers[selSticker]; if (!s) return;
  const [nx, ny] = edPt(e);
  s.x = clamp(nx - edrag.dx, 0, 1); s.y = clamp(ny - edrag.dy, 0, 1);
  renderEdit();
});
ev.addEventListener('pointerup', () => (edrag = null));
ev.addEventListener('pointercancel', () => (edrag = null));

function buildFrames() {
  const fl = $('#frameList');
  FRAMES.forEach((f) => {
    const b = document.createElement('button');
    b.className = 'chip' + (st.edit.frame === f.id ? ' on' : ''); b.textContent = f.name;
    b.onclick = () => { st.edit.frame = f.id; $$('#frameList .chip').forEach((e) => e.classList.toggle('on', e === b)); renderEdit(); };
    fl.appendChild(b);
  });
  const cols = ['#ffd6e2', '#ffe9b8', '#d7f2e6', '#dcd6ff', '#cfe8ff', '#ffffff', '#3a3a3a'];
  const cl = $('#frameColors');
  cols.forEach((c) => {
    const b = document.createElement('button');
    b.className = 'swatch' + (st.edit.frameColor === c ? ' on' : ''); b.style.background = c; b.title = c;
    b.onclick = () => { st.edit.frameColor = c; $$('#frameColors .swatch').forEach((e) => e.classList.toggle('on', e === b)); renderEdit(); };
    cl.appendChild(b);
  });
}
function buildBg() {
  const bl = $('#bgList');
  BGS.forEach((bg) => {
    const b = document.createElement('button');
    b.className = 'chip' + (st.bg === bg.id ? ' on' : ''); b.textContent = bg.name;
    b.onclick = () => { st.bg = bg.id; $$('#bgList .chip').forEach((e) => e.classList.toggle('on', e === b)); buildPresets(); renderEdit(); };
    bl.appendChild(b);
  });
  $('#chopChk').onchange = (e) => { st.edit.chopsticks = e.target.checked; buildPresets(); renderEdit(); };
  $('#steamRange').oninput = (e) => { st.edit.steam = +e.target.value; renderEdit(); };
  $('#steamRange').onchange = () => buildPresets();
}
function buildTitleTab() {
  $('#nameInput').oninput = (e) => { st.name = e.target.value.trim(); st.nameEdited = !!st.name; renderEdit(); };
  $('#titleChk').onchange = (e) => {
    if (e.target.checked) st.edit.stickers.push({ type: 'title', v: currentName(), x: 0.5, y: 0.1, size: 0.075, rot: -0.04, col: '#ff6f91' });
    else st.edit.stickers = st.edit.stickers.filter((s) => s.type !== 'title');
    selSticker = -1; updateSelTools(); renderEdit();
  };
  const cols = ['#ff6f91', '#ff9f43', '#7c5cff', '#2bb39a', '#5a3d3a', '#ffffff'];
  const box = $('#titleColors');
  cols.forEach((c) => {
    const b = document.createElement('button'); b.className = 'swatch'; b.style.background = c;
    b.onclick = () => { const t = st.edit.stickers.find((s) => s.type === 'title'); if (t) { t.col = c; renderEdit(); } };
    box.appendChild(b);
  });
}
function showETab(id) {
  $$('#editTabs .tab').forEach((b) => b.classList.toggle('on', b.dataset.etab === id));
  $$('.etab').forEach((p) => p.classList.toggle('on', p.dataset.etab === id));
}
$$('#editTabs .tab').forEach((b) => (b.onclick = () => showETab(b.dataset.etab)));

/* =============== ⑤ シェア =============== */
let finalBlob = null, finalUrl = null;
async function exportImage() {
  const N = 1080, c = mk(N, N);
  compose(c.getContext('2d'), N, false);
  return new Promise((res) => c.toBlob((b) => res(b), 'image/jpeg', 0.92));
}
function pageUrl() { return location.origin + location.pathname.replace(/index\.html$/, ''); }
function refreshTags() {
  const name = currentName();
  st.tags = [...buildTags(st, name), ...st.custom];
  st.tags = [...new Set(st.tags)];
  const box = $('#tagList'); box.innerHTML = '';
  st.tags.forEach((t) => {
    const b = document.createElement('button');
    b.className = 'chip tag' + (st.tagOff.has(t) ? '' : ' on'); b.textContent = '#' + t;
    b.onclick = () => { st.tagOff.has(t) ? st.tagOff.delete(t) : st.tagOff.add(t); b.classList.toggle('on'); refreshText(); };
    box.appendChild(b);
  });
}
function refreshText() {
  const tags = st.tags.filter((t) => !st.tagOff.has(t));
  $('#postText').value = buildText(st, currentName(), st.tpl, tags, pageUrl());
}
async function refreshImage() {
  finalBlob = await exportImage();
  if (finalUrl) URL.revokeObjectURL(finalUrl);
  finalUrl = URL.createObjectURL(finalBlob);
  $('#finalImg').src = finalUrl;
}
async function enterShare() {
  $('#shareName').value = currentName();
  refreshTags(); refreshText();
  await refreshImage();
}
let nameT = null;
$('#shareName').oninput = (e) => {
  st.name = e.target.value.trim(); st.nameEdited = !!st.name;
  refreshTags(); refreshText();
  clearTimeout(nameT); nameT = setTimeout(refreshImage, 400);
};
$('#tplBtn').onclick = () => { st.tpl = (st.tpl + 1) % TEMPLATES.length; refreshText(); };
$('#tagAddBtn').onclick = () => {
  const v = $('#tagAdd').value.replace(/^#+/, '').trim();
  if (!v) return;
  st.custom.push(v); $('#tagAdd').value = '';
  refreshTags(); refreshText();
};
$('#tagAdd').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); $('#tagAddBtn').click(); } });
function fileName() { const d = new Date(); return `donburi_${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.jpg`; }
async function copyText(silent) {
  try { await navigator.clipboard.writeText($('#postText').value); if (!silent) toast('投稿文をコピーしたよ📋'); return true; }
  catch { if (!silent) { $('#postText').select(); document.execCommand('copy'); toast('投稿文をコピーしたよ📋'); } return false; }
}
function download() {
  if (!finalBlob) return;
  const a = document.createElement('a');
  a.href = finalUrl; a.download = fileName();
  document.body.appendChild(a); a.click(); a.remove();
  toast('画像を保存したよ📸');
}
$('#saveBtn').onclick = download;
$('#copyBtn').onclick = () => copyText(false);
$('#shareBtn').onclick = async () => {
  if (!finalBlob) await refreshImage();
  const file = new File([finalBlob], fileName(), { type: 'image/jpeg' });
  const text = $('#postText').value;
  await copyText(true);
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], text, title: currentName() });
      toast('投稿文はコピー済み！貼り付けてね📋');
    } else if (navigator.share) {
      await navigator.share({ text, title: currentName(), url: pageUrl() });
    } else {
      download();
      toast('画像を保存＆投稿文をコピーしたよ！');
    }
  } catch (err) { if (err && err.name !== 'AbortError') { download(); } }
};
const openWin = (u) => window.open(u, '_blank', 'noopener');
$('#xBtn').onclick = () => { copyText(true); openWin('https://twitter.com/intent/tweet?text=' + encodeURIComponent($('#postText').value)); };
$('#threadsBtn').onclick = () => { copyText(true); openWin('https://www.threads.net/intent/post?text=' + encodeURIComponent($('#postText').value)); };
$('#lineBtn').onclick = () => openWin('https://line.me/R/share?text=' + encodeURIComponent($('#postText').value));
$('#againBtn').onclick = () => {
  if (!confirm('新しい丼をつくりますか？（いまの丼は消えます）')) return;
  Object.assign(st, { rice: 0, items: [], group: 0, ver: st.ver + 1, name: '', nameEdited: false, tagOff: new Set(), custom: [], tpl: 0 });
  st.edit = { preset: 'natural', adj: zeroAdj(), frame: 'none', frameColor: '#ffd6e2', chopsticks: true, steam: 0.7, stickers: [] };
  selSticker = -1;
  $('#chopChk').checked = true; $('#steamRange').value = 0.7;
  go(1);
};

/* =============== タイトル画面のサンプル丼 =============== */
function sampleBowl() {
  const s = { design: 'urushi', shape: 'std', rice: 330, bg: 'wood', items: [] };
  const r = rng(42);
  const put = (id, x, y, size = 1) => s.items.push(...makeItems(s, ING_MAP[id], x, y, size, 1, r));
  for (let i = 0; i < 9; i++) put('tsuyu', 340 + r() * 320, 400 + r() * 130, 0.8);
  for (let i = 0; i < 5; i++) put('tamanegi', 350 + r() * 300, 410 + r() * 110, 0.8);
  put('katsu', 500, 455, 0.95);
  for (let i = 0; i < 8; i++) put('tokitamago', 360 + r() * 280, 405 + r() * 120, 0.6);
  put('mitsuba', 560, 430, 0.7); put('mitsuba', 440, 485, 0.65);
  const cv = $('#titleBowl');
  const N = Math.round(Math.min(900, (cv.clientWidth || 300) * DPR()));
  const full = renderFull(s, N, { chopsticks: true, steam: 0.8 });
  cv.width = cv.height = N;
  cv.getContext('2d').drawImage(full, 0, 0);
}

/* =============== 初期化 =============== */
buildBowlUI(); buildCatTabs(); buildAdj(); buildStamps(); buildFrames(); buildBg(); buildTitleTab();
$('#chopChk').checked = true; $('#steamRange').value = 0.7;
showETab('filter');
const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
fontsReady.then(() => { sampleBowl(); if (step === 4) renderEdit(); });
let rt = null;
window.addEventListener('resize', () => {
  clearTimeout(rt);
  rt = setTimeout(() => { if (step === 1 || step === 3) renderStage(false); if (step === 4) renderEdit(); }, 150);
});

/* ダブルタップズーム禁止 */
document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
let lastTouch = 0;
document.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - lastTouch < 350 && !e.target.closest('input, textarea')) e.preventDefault();
  lastTouch = now;
}, { passive: false });
