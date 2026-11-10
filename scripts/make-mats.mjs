// Vygeneruje JSON dalších podložek (podle fotek od uživatele) do src/config/mats/. Souřadnice jsou ve viewBoxu 150×100.
// Spuštění: node scripts/make-mats.mjs  (soubory pak jde ručně dolaďovat; `variants` = barevné provedení téže podložky)
import fs from 'node:fs';

const COLORS = { 1: '#FFFFFF', 2: '#FF9A3D', 3: '#FF5C6C', 4: '#34D88A', 5: '#38BDF8', 6: '#A78BFA' };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const zonesFrom = (c) => Object.entries(c).map(([id, [cx, cy]]) => ({ id: Number(id), label: String(id), color: COLORS[id], x: Math.round(clamp(cx / 1.5 - 9, 0, 82)), y: Math.round(clamp(cy - 11, 0, 78)), w: 18, h: 22 }));
const badgesFrom = (c, size, only) => Object.entries(c).filter(([id]) => !only || only.includes(Number(id))).map(([id, [cx, cy]]) => ({ zone: Number(id), x: +(cx - size / 2).toFixed(1), y: +(cy - size / 2).toFixed(1), w: size, h: size }));
const arr = (x1, y1, x2, y2, between, kind) => ({ x1, y1, x2, y2, ...(between ? { between } : {}), ...(kind ? { kind } : {}) });

function write(file, m) {
  const out = { widthCm: 90, heightCm: 60, viewBox: [150, 100], targets: [], arrowStyle: { shaft: 2.6, tip: 2.8 }, ...m };
  fs.writeFileSync(`src/config/mats/${file}.json`, JSON.stringify(out, null, 2));
  console.log('zapsáno', file);
}

// Šipky rozložení 3 4 5 / 2 1 6 (hodnoty se liší podle potisku)
const std = (o) => [
  arr(o.topL[0], o.top, o.topL[1], o.top, [3, 4]), arr(o.topR[0], o.top, o.topR[1], o.top, [4, 5]),
  arr(o.botL[0], o.bot, o.botL[1], o.bot, [2, 1]), arr(o.botR[0], o.bot, o.botR[1], o.bot, [1, 6]),
  arr(o.vl, o.vy[0], o.vl, o.vy[1], [3, 2]), arr(o.vr, o.vy[0], o.vr, o.vy[1], [5, 6]), arr(o.vc, o.vcy[0], o.vc, o.vcy[1], [4, 1]),
  arr(o.dl[0], o.dl[1], o.dl[2], o.dl[3], [3, 1]), arr(o.dr[0], o.dr[1], o.dr[2], o.dr[3], [5, 1]),
];

// 1) Maximize na černé (potisk: oboustranné šipky s dvojicí chevronů, čísla v kosočtvercích) + barevné varianty
{
  const c = { 3: [14.6, 27.3], 4: [75, 27.3], 5: [135.4, 27.3], 2: [14.6, 86.9], 1: [75, 86.9], 6: [135.4, 86.9] };
  const title = (deco) => [{ text: 'MAXIMIZE YOUR GAME', x: 72.5, y: 16.2, size: 5.4, color: '#fff', condense: 0.82, ...(deco ? { deco } : {}) }];
  const variant = (id, name, swatch, arrow, diamond, text, hint, deco = true) => ({ id, name, swatch, skin: { arrow, hint, badge: { shape: 'diamond', fill: diamond, text }, texts: title(deco ? arrow : null) } });
  write('maximize-black', {
    id: 'maximize-black', name: 'Maximize (černá)', note: 'Černá podložka s oboustrannými šipkami a čísly v kosočtvercích. Barevné varianty: tyrkysová, červená, žlutá, fialová.',
    zones: zonesFrom(c), badges: badgesFrom(c, 10.4), ball: { x: 75, y: 86.9, r: 10 }, logo: { none: true }, arrowStyle: { shaft: 5.2, tip: 2.8 },
    skin: { radius: 4.6, band: 'none', base: ['#0b0b0d', '#000'], arrowKind: 'chev', arrow: '#2EE6D6', arrowCut: '#000', hint: '#FFD400', printBall: false, badge: { shape: 'diamond', fill: '#fff', text: '#0b0b0d' }, texts: title(null) },
    variants: [
      variant('teal', 'Tyrkysová', '#2EE6D6', '#2EE6D6', '#FFFFFF', '#0b0b0d', '#FFD400', false),
      variant('red', 'Červená', '#E3262B', '#E3262B', '#7A1A1E', '#FFFFFF', '#FFFFFF'),
      variant('yellow', 'Žlutá', '#F6D117', '#F6D117', '#F6D117', '#111111', '#19D3FF'),
      variant('purple', 'Fialová', '#8B45E0', '#8B45E0', '#4A237F', '#FFFFFF', '#FFD400'),
    ],
    arrows: std({ top: 27.3, topL: [22.4, 69.1], topR: [82.8, 129.5], bot: 86.9, botL: [22.4, 69.1], botR: [82.8, 129.5], vl: 14.6, vr: 135.4, vy: [35.6, 78.8], vc: 75, vcy: [35.6, 78.8], dl: [22.4, 33.7, 67.2, 79.8], dr: [127.6, 33.7, 82.8, 79.8] }),
  });
}

// 2) Goal Mat: zelený trávník, bílé šipky z řady chevronů s kosočtvercem uprostřed, čísla v kruzích
{
  const c = { 3: [11.5, 22.7], 4: [74.3, 22], 5: [139, 22.7], 2: [10.8, 88.7], 1: [75, 88.7], 6: [139, 88.7] };
  write('goal-mat-green', {
    id: 'goal-mat-green', name: 'Goal Mat (zelená)', note: 'Zelený trávník s bílými šipkami z chevronů a čísly v kruzích.',
    zones: zonesFrom(c), badges: badgesFrom(c, 12.6), ball: { x: 75, y: 88.7, r: 8.5 }, logo: { none: true }, arrowStyle: { shaft: 7.2, tip: 2.8 },
    skin: { radius: 1.2, band: 'none', base: ['#3E9B2B', '#2B7D1F'], stripes: { light: '#47A532', dark: '#388F27', count: 10 }, arrowKind: 'stack', arrow: '#FFFFFF', arrowCut: '#2F8A22', hint: '#19D3FF', printBall: false, badge: { shape: 'circle', fill: '#fff', text: '#111' }, texts: [{ text: 'GOAL MAT', x: 75, y: 12.6, size: 9, color: '#F7D21C' }] },
    arrows: std({ top: 22, topL: [26, 59.5], topR: [90, 123.5], bot: 88.7, botL: [26.3, 59.4], botR: [91.8, 124], vl: 10.8, vr: 139, vy: [38.7, 72], vc: 74.3, vcy: [38.7, 72], dl: [21.6, 35.3, 62, 74], dr: [125.6, 34.7, 87, 74] }),
  });
}

// 3) Maximize zelená: široké pruhy trávníku, bílé šipky se samostatnými chevrony, tečkované kroužky s čísly
{
  const c = { 3: [14.5, 20.6], 4: [74.8, 16.1], 5: [136.6, 20.6], 2: [14.5, 88.7], 1: [75.5, 84], 6: [134.4, 87.9] };
  write('maximize-green', {
    id: 'maximize-green', name: 'Maximize (zelená)', note: 'Zelené pruhy, bílé šipky a čísla v tečkovaných kroužcích; míč dole uprostřed.',
    zones: zonesFrom(c), badges: badgesFrom(c, 9.4, [2, 3, 4, 5, 6]), ball: { x: 75.5, y: 84, r: 8.2 }, logo: { none: true }, arrowStyle: { shaft: 3.4, tip: 2.8 },
    skin: { radius: 4, band: 'none', base: ['#3b9a2b', '#1f6e22'], stripes: { light: '#52AD34', dark: '#1F6E22', count: 7 }, arrowKind: 'barchev', arrow: '#FFFFFF', arrowCut: '#2c7f23', hint: '#19D3FF', badge: { shape: 'ring', fill: 'none', stroke: '#fff', text: '#fff' }, texts: [{ text: 'MAXIMIZE YOUR GAME', x: 75, y: 7.4, size: 5.6, color: '#fff', condense: 0.85 }] },
    arrows: std({ top: 14.8, topL: [26.9, 58], topR: [92, 122], bot: 91, botL: [26.9, 62], botR: [91.5, 125], vl: 7, vr: 142, vy: [31, 70], vc: 77, vcy: [30, 66], dl: [19.6, 28.2, 62.5, 75.8], dr: [128.6, 28, 90, 75.8] }),
  });
}

// 4) Modrá podložka (originál je na výšku, tady otočená o 90° na šířku): čísla 3 4 5 / 2 1 6
{
  const c = { 3: [11.7, 9.4], 4: [75.4, 9.4], 5: [138.7, 9.4], 2: [11.7, 88.2], 1: [75.4, 87], 6: [138.7, 87] };
  write('blue-tech', {
    id: 'blue-tech', name: 'Modrá (otočená na šířku)', note: 'Originál je na výšku; otočeno o 90° proti směru hodin, aby seděla na obrazovku. Čísla 3 4 5 nahoře a 2 1 6 dole.',
    zones: zonesFrom(c), badges: badgesFrom(c, 10), ball: { x: 75.4, y: 87, r: 9 }, logo: { none: true }, arrowStyle: { shaft: 4.6, tip: 2.8 },
    skin: { radius: 4, band: 'none', base: ['#0a1422', '#02060c'], arrowKind: 'chev', arrow: '#3CB4FF', arrowCut: '#02060c', hint: '#FFD400', printBall: false, badge: { shape: 'circle', fill: '#08121f', stroke: '#3CB4FF', strokeW: 1, text: '#fff' }, balls: [{ x: 27, y: 61, r: 8 }, { x: 119, y: 61, r: 8 }] },
    arrows: [
      arr(23.4, 9.4, 68, 9.4, [3, 4]), arr(82, 9.4, 126.6, 9.4, [4, 5]), arr(23.4, 88, 68, 88, [2, 1]), arr(82, 88, 126.6, 88, [1, 6]),
      arr(12.9, 22, 12.9, 64.6, [3, 2]), arr(142.9, 22, 142.9, 64.6, [5, 6]), arr(75.4, 22, 75.4, 74, [4, 1]),
      arr(28.1, 22.3, 64.4, 76.4, [3, 1]), arr(121.7, 21.1, 86.6, 76.4, [5, 1]),
    ],
  });
}

// 5) CitySports: černá, tyrkysové šipky, míče v rozích (bez čísel; čísla jsou jen malá nápověda)
{
  const c = { 1: [74.5, 86], 2: [13, 87], 3: [13, 14], 4: [74.5, 49], 5: [137, 13], 6: [137.5, 87] };
  const num = (id, x, y) => ({ text: String(id), x, y: y + 1.8, size: 5, color: '#4FD8D0' });
  write('citysports', {
    id: 'citysports', name: 'CitySports (černá)', note: 'Míče v rozích a uprostřed; čísla zón 1–6 jsou jen malá nápověda (na podložce nejsou).',
    zones: zonesFrom(c), badges: [], ball: { x: 74.5, y: 86, r: 7.4 }, logo: { text: 'CITYSPORTS', x: 75, y: 29, plain: true }, arrowStyle: { shaft: 2.6, tip: 2.8 },
    skin: { radius: 3, band: 'none', base: ['#18191c', '#0b0b0d'], arrowKind: 'line', arrow: '#4FD8D0', arrowCut: '#0b0b0d', hint: '#FFD400', printBall: false,
      balls: [{ x: 13, y: 14, r: 8.2 }, { x: 137, y: 13.2, r: 8.2 }, { x: 13, y: 87, r: 8.2 }, { x: 137.5, y: 87, r: 8.2 }, { x: 74.5, y: 86, r: 7.4 }, { x: 74.5, y: 49, r: 15.5 }],
      texts: [num(3, 25, 22), num(5, 125, 22), num(2, 25, 80), num(6, 125, 80), num(4, 96, 50), num(1, 86, 82)] },
    arrows: [
      arr(23, 8.6, 126, 8.6, [3, 5], 'line'), arr(23, 16, 126, 16, null, 'line'),
      arr(22, 27, 62, 78, [3, 1], 'line'), arr(128, 27, 88, 78, [5, 1], 'line'),
      arr(8.3, 70, 8.3, 42, [2, 3], 'tri'), arr(15.8, 70, 15.8, 42, null, 'tri'), arr(132.8, 70, 132.8, 42, [6, 5], 'tri'), arr(140.5, 70, 140.5, 42, null, 'tri'),
      arr(22.5, 91.5, 58, 91.5, [2, 1], 'tri'), arr(126.5, 91.5, 91, 91.5, [6, 1], 'tri'), arr(74.5, 77, 74.5, 66, [1, 4], 'line'),
    ],
  });
}

// 6) Barevné puky: černá podložka s pěti barevnými body a bílými cestami
{
  const c = { 1: [72, 62], 2: [24.5, 74.6], 3: [33.2, 29.4], 4: [109, 26.2], 5: [118.8, 58.5] };
  write('color-dots', {
    id: 'color-dots', name: 'Barevné puky', note: 'Černá podložka s pěti barevnými body (zóny 1–5) a bílými cestami; zóna 6 tu není, cviky s ní se přeskočí.',
    zones: zonesFrom(c).map((z) => ({ ...z, ballAt: { x: c[z.id][0], y: c[z.id][1] } })), badges: [], ball: { x: 72, y: 62, r: 8 }, logo: { none: true }, arrowStyle: { shaft: 3.6, tip: 2.8 },
    skin: { radius: 1.6, band: 'none', base: ['#050505', '#000'], arrowKind: 'barchev', arrow: '#FFFFFF', arrowCut: '#000', hint: '#FFD400', printBall: false,
      dots: [{ x: 24.5, y: 74.6, r: 7.4, color: '#E5468C' }, { x: 33.2, y: 29.4, r: 7.4, color: '#3B3FB5' }, { x: 109, y: 26.2, r: 7.4, color: '#E1732B' }, { x: 118.8, y: 58.5, r: 7.4, color: '#F2C22E' }, { x: 72, y: 62, r: 7.4, color: '#1E8DB0' }],
      texts: [{ text: '∞', x: 72, y: 45, size: 28, color: '#fff', weight: 500 }] },
    arrows: [
      arr(12.3, 52, 12.3, 84, [3, 2]), arr(15.8, 86.6, 45.8, 86.6, [2, 1]), arr(132.7, 52, 132.7, 84, [5, 1]), arr(126, 86.6, 100, 86.6, [5, 1]),
      arr(15, 30, 71, 88, [3, 1]), arr(128, 30, 72, 88, [4, 1]), arr(15.8, 12.7, 128, 12.7, [3, 4]),
    ],
  });
}
