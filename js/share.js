// 丼の名前判定・投稿文・ハッシュタグ
import { ING_MAP } from './ingredients.js';
import { riceLabel } from './rice.js';

const SEA = ['maguro', 'chutoro', 'salmon', 'hamachi', 'tai', 'ika', 'tako', 'amaebi', 'ikura', 'uni', 'hotate', 'negitoro', 'tobiko', 'kani'];
const TEMPURA = ['ebiten', 'kakiage', 'nasuten', 'kabochaten', 'shishitoten', 'maitaketen', 'chikuwaten'];

export function guessName(items, rice) {
  const has = new Set(items.map((i) => i.id));
  const h = (...ids) => ids.some((i) => has.has(i));
  const all = (...ids) => ids.every((i) => has.has(i));
  const sea = SEA.filter((i) => has.has(i));
  const tem = TEMPURA.filter((i) => has.has(i));
  const egg = h('tokitamago');
  let n;
  if (has.size === 0) n = rice > 0 ? '白ごはん' : 'からっぽの丼';
  else if (h('katsu', 'chickenkatsu') && egg) n = h('katsu') ? 'カツ丼' : 'チキンカツ丼';
  else if (h('katsu', 'chickenkatsu') && h('tonsauce')) n = 'ソースカツ丼';
  else if (h('torimomo') && egg) n = '親子丼';
  else if (h('gyuniku', 'butabara') && egg) n = '他人丼';
  else if (tem.length && egg) n = '天とじ丼';
  else if (h('unagi')) n = h('kinshi') ? 'きんし丼' : 'うな丼';
  else if (h('mabo')) n = '麻婆丼';
  else if (h('happosai')) n = '中華丼';
  else if (h('curry')) n = h('katsu') ? 'カツカレー丼' : 'カレー丼';
  else if (sea.length >= 3) n = sea.length >= 6 ? '豪華海鮮丼' : '海鮮丼';
  else if (all('salmon', 'ikura')) n = '鮭いくら親子丼';
  else if (h('negitoro')) n = 'ネギトロ丼';
  else if (h('maguro', 'chutoro') && h('avocado')) n = 'マグロアボカド丼';
  else if (h('maguro') && sea.length === 1) n = '鉄火丼';
  else if (h('chutoro') && sea.length === 1) n = '中トロ丼';
  else if (h('uni') && h('ikura')) n = 'うにいくら丼';
  else if (h('uni')) n = 'うに丼';
  else if (h('ikura')) n = 'いくら丼';
  else if (h('salmon')) n = 'サーモン丼';
  else if (h('hotate')) n = 'ほたて丼';
  else if (h('kani')) n = 'かに丼';
  else if (h('amaebi')) n = '甘えび丼';
  else if (sea.length === 2) n = '二色丼';
  else if (sea.length === 1) n = ING_MAP[sea[0]].name.replace(/\(.+\)/, '') + '丼';
  else if (h('anago')) n = '穴子丼';
  else if (h('shirasu')) n = 'しらす丼';
  else if (tem.length) n = tem.length === 1 && h('kakiage') ? 'かき揚げ丼' : '天丼';
  else if (h('katsu')) n = 'とんかつ丼';
  else if (h('chickenkatsu')) n = 'チキンカツ丼';
  else if (h('gyuniku')) n = h('cheese') ? 'チーズ牛丼' : h('kimchi') ? 'キムチ牛丼' : '牛丼';
  else if (h('butabara')) n = h('kimchi') ? '豚キムチ丼' : '豚丼';
  else if (h('soboro')) n = h('irotamago') ? '三色丼' : 'そぼろ丼';
  else if (h('hamburg')) n = h('medamayaki') ? 'ロコモコ丼' : 'ハンバーグ丼';
  else if (h('roastbeef')) n = 'ローストビーフ丼';
  else if (h('chashu')) n = 'チャーシュー丼';
  else if (h('karaage')) n = h('mayo') ? 'からマヨ丼' : '唐揚げ丼';
  else if (h('teriyaki')) n = '照り焼きチキン丼';
  else if (h('kakuni')) n = '角煮丼';
  else if (h('torimomo')) n = '鶏丼';
  else if (h('natto')) n = '納豆丼';
  else if (h('tororo')) n = 'とろろ丼';
  else if (h('kimchi')) n = 'キムチ丼';
  else if (h('avocado')) n = 'アボカド丼';
  else if (h('namatamago', 'ranou') && has.size <= 4) n = '卵かけごはん';
  else if (h('medamayaki')) n = '目玉焼き丼';
  else if (h('katsuobushi')) n = 'おかか丼';
  else n = 'オリジナル丼';
  if (has.size >= 12 && !n.startsWith('豪華')) n = 'よくばり' + n;
  return n;
}

export function ingredientNames(items) {
  const seen = []; const set = new Set();
  for (const it of items) if (!set.has(it.id)) { set.add(it.id); seen.push(ING_MAP[it.id].name.replace(/\(.+\)/, '')); }
  return seen;
}

export function buildTags(st, name) {
  const tags = ['丼メーカー', name.replace(/[()（）\s]/g, ''), 'どんぶり', 'おうちごはん', '飯テロ', '丼活', '今日のごはん'];
  const lbl = riceLabel(st.rice);
  if (st.rice >= 290) tags.push(lbl.replace('…！', ''));
  const p = st.edit?.preset;
  if (p === 'yume') tags.push('ゆめかわ');
  if (p === 'emo' || p === 'showa') tags.push('エモい', 'フィルム風');
  if (p === 'cafe') tags.push('韓国カフェ風');
  if (p === 'fuwa') tags.push('ふんわり加工');
  ingredientNames(st.items).slice(0, 3).forEach((n) => tags.push(n));
  return [...new Set(tags)].filter(Boolean);
}

export const TEMPLATES = [
  (o) => `今日の丼は「${o.name}」🍚✨\nごはん${o.rice}g(${o.label})に、${o.list}をのせてみたよ♡\nどんぶりメーカーで作ってみてね🥢`,
  (o) => `🍚 ${o.name} 🍚\n━━━━━━━━━━\n🥢 ごはん：${o.rice}g（${o.label}）\n🥢 具材：${o.list}\n━━━━━━━━━━\n自分だけの丼つくった！`,
  (o) => `【飯テロ注意】\n${o.name}、完成しました🔥\n${o.list}…ぜんぶのせ😋\nごはんは${o.label}で！`,
  (o) => `ゆるっと丼づくり🌸\n本日の一杯は「${o.name}」です\n${o.list}\n#おいしい顔`,
];

export function buildText(st, name, tplIndex, tags, url) {
  const names = ingredientNames(st.items);
  const list = names.length ? (names.length > 7 ? names.slice(0, 7).join('・') + ' ほか' : names.join('・')) : '具なし（素材の味）';
  const body = TEMPLATES[tplIndex % TEMPLATES.length]({ name, rice: st.rice, label: riceLabel(st.rice), list });
  return `${body}\n\n${tags.map((t) => '#' + t).join(' ')}${url ? '\n' + url : ''}`;
}
