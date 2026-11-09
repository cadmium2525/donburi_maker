// 丼の採点（ほめる診断）
import { ING_MAP } from './ingredients.js';
import { guessName } from './share.js';

// 具材の色系統（彩り判定）
const COL = {
  red: ['maguro', 'roastbeef', 'umeboshi', 'tomato', 'benishoga', 'itotogarashi', 'kimchi', 'mabo', 'tako', 'kani', 'raayu', 'chutoro', 'amaebi'],
  orange: ['salmon', 'ikura', 'uni', 'tobiko', 'ninjin', 'kabochaten', 'curry', 'ebiten'],
  yellow: ['tokitamago', 'ranou', 'kinshi', 'irotamago', 'tamagoyaki', 'corn', 'takuan', 'cheese', 'medamayaki', 'onsen', 'namatamago', 'yudetamago', 'ajitama'],
  green: ['mitsuba', 'ooba', 'aonegi', 'naganegi', 'kyuri', 'avocado', 'lettuce', 'kaiware', 'kinusaya', 'okra', 'wasabi', 'cabbage', 'shishitoten', 'aonori', 'sansho'],
  white: ['tofu', 'ika', 'tai', 'hotate', 'shiraganegi', 'oroshi', 'tororo', 'shirasu', 'uzura', 'goma', 'mayo'],
  black: ['kizaminori', 'nori', 'kurogoma'],
  purple: ['nasuten'],
  pink: ['negitoro', 'hamachi', 'gari', 'chashu', 'katsuobushi'],
};
const COLOR_OF = {};
for (const [c, ids] of Object.entries(COL)) ids.forEach((i) => (COLOR_OF[i] = c));

// 定番丼の「あるとうれしい」具材
const RECIPES = {
  カツ丼: ['katsu', 'tokitamago', 'tamanegi', 'tsuyu', 'mitsuba'],
  チキンカツ丼: ['chickenkatsu', 'tokitamago', 'tamanegi', 'tsuyu', 'mitsuba'],
  親子丼: ['torimomo', 'tokitamago', 'tamanegi', 'tsuyu', 'mitsuba'],
  他人丼: ['gyuniku', 'tokitamago', 'tamanegi', 'tsuyu', 'mitsuba'],
  牛丼: ['gyuniku', 'tamanegi', 'tsuyu', 'benishoga', 'shichimi'],
  豚丼: ['butabara', 'tare', 'aonegi', 'goma'],
  天丼: ['ebiten', 'kakiage', 'nasuten', 'kabochaten', 'shishitoten', 'tare'],
  天とじ丼: ['ebiten', 'tokitamago', 'tsuyu', 'mitsuba'],
  かき揚げ丼: ['kakiage', 'tare'],
  海鮮丼: ['maguro', 'salmon', 'ikura', 'tamagoyaki', 'ooba', 'wasabi', 'shoyu'],
  豪華海鮮丼: ['maguro', 'chutoro', 'salmon', 'ikura', 'uni', 'amaebi', 'hotate', 'tamagoyaki', 'ooba', 'wasabi'],
  鉄火丼: ['maguro', 'kizaminori', 'wasabi', 'ooba', 'shoyu'],
  ネギトロ丼: ['negitoro', 'aonegi', 'kizaminori', 'wasabi', 'ranou'],
  鮭いくら親子丼: ['salmon', 'ikura', 'ooba', 'wasabi'],
  うな丼: ['unagi', 'tare', 'sansho'],
  麻婆丼: ['mabo', 'aonegi', 'sansho', 'raayu'],
  中華丼: ['happosai', 'uzura'],
  三色丼: ['soboro', 'irotamago', 'kinusaya', 'benishoga'],
  ロコモコ丼: ['hamburg', 'medamayaki', 'lettuce', 'tomato'],
  ローストビーフ丼: ['roastbeef', 'ranou', 'oroshi', 'kaiware'],
  しらす丼: ['shirasu', 'aonegi', 'kizaminori', 'ranou', 'shoyu'],
  チャーシュー丼: ['chashu', 'tare', 'aonegi', 'onsen'],
  唐揚げ丼: ['karaage', 'cabbage', 'mayo'],
  からマヨ丼: ['karaage', 'mayo', 'cabbage', 'aonegi'],
  照り焼きチキン丼: ['teriyaki', 'mayo', 'kizaminori', 'cabbage'],
  豚キムチ丼: ['butabara', 'kimchi', 'onsen', 'aonegi'],
  納豆丼: ['natto', 'aonegi', 'ranou', 'kizaminori'],
  卵かけごはん: ['ranou', 'shoyu'],
};

const KCAL = { katsu: 450, chickenkatsu: 380, gyuniku: 90, butabara: 110, torimomo: 50, teriyaki: 250, karaage: 90, chashu: 80, roastbeef: 60, kakuni: 160, hamburg: 300, unagi: 300, anago: 150, ebiten: 120, kakiage: 250, nasuten: 80, kabochaten: 80, shishitoten: 30, maitaketen: 60, chikuwaten: 90, mabo: 60, happosai: 40, curry: 70, cheese: 40, medamayaki: 100, namatamago: 80, onsen: 80, tokitamago: 25, tamagoyaki: 60, mayo: 2, tare: 1 };

const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));

export function judge(st) {
  const items = st.items;
  const name = st.name || guessName(items, st.rice);
  const base = name.replace(/^よくばり/, '');
  const ids = [...new Set(items.map((i) => i.id))];
  const n = ids.length;
  const maxH = items.reduce((m, i) => Math.max(m, i.h || 0), 0);
  const colors = new Set(ids.map((i) => COLOR_OF[i] || 'brown'));

  // ボリューム
  const volume = clamp(st.rice / 4 + items.length * 0.6 + maxH * 0.35, 0, 150);
  // 彩り
  const color = clamp(colors.size * 17 + (colors.has('green') ? 10 : 0) - (n === 0 ? 30 : 0));
  // 再現度
  const recipe = RECIPES[base];
  let repro;
  if (recipe) repro = clamp(55 + (recipe.filter((i) => ids.includes(i)).length / recipe.length) * 50);
  else if (base === 'オリジナル丼') repro = 20;
  else if (base === '白ごはん' || base === 'からっぽの丼') repro = 10;
  else repro = 65;
  // 独創性
  const original = clamp((base === 'オリジナル丼' ? 55 : 15) + n * 6 + (colors.size >= 5 ? 10 : 0));
  // 映え
  let spread = 0;
  if (items.length > 1) {
    const xs = items.map((i) => i.x), ys = items.map((i) => i.y);
    spread = (Math.max(...xs) - Math.min(...xs)) / 6 + (Math.max(...ys) - Math.min(...ys)) / 4;
  }
  const glossy = ids.filter((i) => ['ranou', 'ikura', 'tokitamago', 'onsen', 'tare', 'unagi', 'cheese', 'mabo'].includes(i)).length;
  const photo = clamp(25 + Math.min(40, spread * 0.5) + colors.size * 5 + glossy * 6 + (n > 25 ? -10 : 0));
  // 背徳度（カロリー）
  const kcal = Math.round(st.rice * 1.56 + items.reduce((s, it) => {
    const d = ING_MAP[it.id];
    return s + (KCAL[it.id] ?? (d.kind === 'sprinkle' ? 1 : d.kind === 'sauce' ? 8 : 25));
  }, 0));
  const haitoku = clamp(kcal / 15);

  const axes = [
    { k: 'volume', name: 'ボリューム', v: Math.round(Math.min(100, volume)) },
    { k: 'color', name: '彩り', v: Math.round(color) },
    { k: 'photo', name: '映え', v: Math.round(photo) },
    { k: 'repro', name: '再現度', v: Math.round(repro) },
    { k: 'original', name: '独創性', v: Math.round(original) },
    { k: 'haitoku', name: '背徳度', v: Math.round(haitoku) },
  ];
  // 総合：得意な項目を重視（どんな丼でもほめられるように）
  const sorted = axes.map((a) => a.v).sort((a, b) => b - a);
  let total = sorted[0] * 0.3 + sorted[1] * 0.25 + sorted[2] * 0.2 + sorted[3] * 0.12 + sorted[4] * 0.08 + sorted[5] * 0.05;
  total = 50 + total * 0.5;
  if (maxH > 120) total += 8;
  if (volume > 110) total += Math.round((volume - 100) / 4);
  if (recipe && repro >= 100) total += 5;
  if (n === 0) total = st.rice > 0 ? 77 : 3;
  total = Math.round(total);

  return { name, total, axes, kcal, title: titleFor({ base, n, maxH, st, axes, total, colors, ids }), comment: commentFor(ids, axes, { base, maxH, st, n }) };
}

function titleFor({ base, n, maxH, st, axes, total, colors, ids }) {
  const a = Object.fromEntries(axes.map((x) => [x.k, x.v]));
  if (n === 0 && st.rice === 0) return '空気を味わう求道者';
  if (n === 0) return '米本来の味の伝道師';
  if (maxH > 200) return 'てんこ盛りの神';
  if (st.rice >= 600) return 'ギガ盛りの覇者';
  if (n >= 15) return 'よくばり大魔王';
  if (base === 'オリジナル丼' && n >= 6) return '創作どんぶり界の異端児';
  if (a.repro >= 100) return `${base}職人`;
  if (st.items.filter((i) => i.id === 'tsuyu').length >= 6) return 'つゆだく職人';
  if (colors.size >= 6) return '彩りの魔術師';
  if (a.photo >= 85) return '映えどんぶりクリエイター';
  if (a.haitoku >= 90) return '背徳グルメの探求者';
  if (a.repro >= 80) return `${base}の名手`;
  if (total >= 85) return 'どんぶりマイスター';
  return 'ゆるっと丼びより';
}

const COMMENTS = {
  mitsuba: '三つ葉が全体をキュッと引き締めてる！', tokitamago: '卵のとろとろ加減がたまらない…', tsuyu: 'つゆがごはんに染みてて最高。', ikura: 'いくらのツヤが宝石みたい💎',
  uni: 'うにで一気に豪華さアップ！', ranou: '卵黄を崩す瞬間を想像しちゃう…', katsu: 'カツのサクッと感が伝わってくる！', ebiten: 'エビ天のしっぽまで愛おしい。',
  wasabi: 'わさびの添え方がわかってる。', benishoga: '紅しょうがの差し色、ナイス！', kizaminori: '刻み海苔で香りまで想像できる。', cheese: 'チーズのとろ〜りは正義。',
  mabo: '麻婆のしびれる辛さが聞こえてきそう🔥', unagi: 'うなぎの照りが食欲をそそる…', ooba: '大葉の緑が映えてる🌿', avocado: 'アボカドでおしゃれ度アップ！',
  mayo: 'マヨの背徳感、嫌いじゃない。', onsen: '温玉を乗せるセンス、さすが。', shichimi: '七味でピリッと大人の味。', karaage: '唐揚げのジューシーさが溢れてる！',
};
function commentFor(ids, axes, { base, maxH, st, n }) {
  const out = [];
  for (const i of ids) if (COMMENTS[i]) out.push(COMMENTS[i]);
  const pick = out.sort(() => Math.random() - 0.5).slice(0, 2);
  const a = Object.fromEntries(axes.map((x) => [x.k, x.v]));
  if (maxH > 120) pick.push('この高さ…重力に勝ってる！');
  else if (st.rice >= 450) pick.push('ごはんの量にやる気を感じる！');
  else if (st.rice > 0 && st.rice < 150) pick.push('少なめで上品にまとめたね。');
  if (base === 'オリジナル丼' && n > 0) pick.push('誰も見たことのない丼、誕生！');
  if (a.color >= 85) pick.push('色のバランスがとってもきれい。');
  if (n === 0) pick.push(st.rice > 0 ? 'あえての白ごはん。潔い！' : '…器が美しい。それで十分。');
  return pick.slice(0, 3).join('\n');
}

// レーダーチャート
export function drawRadar(cv, axes) {
  const c = cv.getContext('2d'), W = cv.width, cx = W / 2, cy = W / 2 + W * 0.02, R = W * 0.32;
  c.clearRect(0, 0, W, W);
  const pt = (i, r) => { const a = -Math.PI / 2 + (i * Math.PI * 2) / axes.length; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
  for (let k = 4; k >= 1; k--) {
    c.beginPath(); axes.forEach((_, i) => c.lineTo(...pt(i, (R * k) / 4))); c.closePath();
    c.fillStyle = k % 2 ? '#fff6f8' : '#ffe9ef'; c.fill(); c.strokeStyle = '#f6cdd8'; c.lineWidth = 1; c.stroke();
  }
  c.beginPath(); axes.forEach((a, i) => c.lineTo(...pt(i, (R * Math.max(4, a.v)) / 100))); c.closePath();
  c.fillStyle = 'rgba(255,111,145,.45)'; c.fill(); c.strokeStyle = '#ff6f91'; c.lineWidth = W * 0.008; c.stroke();
  c.font = `700 ${W * 0.05}px "Zen Maru Gothic", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
  axes.forEach((a, i) => {
    const [x, y] = pt(i, R + W * 0.1);
    c.fillStyle = '#5a3d3a'; c.fillText(a.name, x, y - W * 0.025);
    c.fillStyle = '#ff6f91'; c.fillText(a.v, x, y + W * 0.03);
  });
}
