// Podložka „Diamant“: šest čísel kolem dokola (1 2 3 nahoře, 6 5 4 dole), dva bílé klíny a uprostřed kosočtverec. Pět barevných provedení.
// Spuštění: node scripts/make-mat-diamond.mjs
import fs from 'node:fs';

const COLORS = { 1: '#FF5C6C', 2: '#34D88A', 3: '#38BDF8', 4: '#A78BFA', 5: '#FF9A3D', 6: '#FFFFFF' };
const c = { 1: [17.4, 13.6], 2: [74.4, 13.6], 3: [129.8, 13.6], 6: [17.4, 84], 5: [74.4, 84], 4: [129.8, 84] };
const zones = Object.entries(c).map(([id, [cx, cy]]) => ({ id: Number(id), label: String(id), color: COLORS[id], x: Math.round(Math.max(0, Math.min(82, cx / 1.5 - 9))), y: Math.round(Math.max(0, Math.min(78, cy - 11))), w: 18, h: 22 }));
const badges = Object.entries(c).map(([id, [cx, cy]]) => ({ zone: Number(id), x: +(cx - 4.9).toFixed(1), y: +(cy - 4.9).toFixed(1), w: 9.8, h: 9.8 }));
const mir = (pts) => pts.map(([x, y]) => [150 - x, y]);

const wedgeL = [[17.4, 21.5], [46.5, 48.5], [17.4, 77], [31.5, 48.5]];
const diamondL = [[74.4, 21], [46.8, 48.5], [74.4, 75.5]];
const diamondR = [[74.4, 21], [102, 48.5], [74.4, 75.5]];
const base = (skin, variants) => ({
  id: 'diamond-x', name: 'Diamant', widthCm: 90, heightCm: 60, viewBox: [150, 100], targets: [],
  note: 'Čísla 1 2 3 nahoře a 6 5 4 dole; klíny po stranách a kosočtverec uprostřed. Varianty: černá/tyrkysová, červená/žlutá, tyrkysová, šedá/žlutá, šedá/modrá.',
  zones, badges, ball: { x: 17.4, y: 13.6, r: 8.4 }, logo: { none: true }, arrowStyle: { shaft: 3.4, tip: 2.8 }, skin, variants,
  arrows: [
    { x1: 26.9, y1: 15.2, x2: 61.7, y2: 15.2, between: [1, 2], kind: 'stack', shaft: 4.2 },
    { x1: 85.5, y1: 15.2, x2: 121.8, y2: 15.2, between: [2, 3], kind: 'stack', shaft: 4.2 },
    { x1: 30, y1: 84.5, x2: 63.3, y2: 84.5, between: [6, 5], kind: 'line', shaft: 3.8 },
    { x1: 85.5, y1: 84.5, x2: 120.3, y2: 84.5, between: [5, 4], kind: 'line', shaft: 3.8 },
    { kind: 'poly', points: wedgeL, color: '$2', between: [1, 6], x1: 0, y1: 0, x2: 0, y2: 0 },
    { kind: 'poly', points: mir(wedgeL), color: '$2', between: [3, 4], x1: 0, y1: 0, x2: 0, y2: 0 },
    { kind: 'polyline', points: diamondL, color: '$d', shaft: 4.6, between: [2, 5], x1: 0, y1: 0, x2: 0, y2: 0 },
    { kind: 'polyline', points: diamondR, color: '$d', shaft: 4.6, between: [2, 5], x1: 0, y1: 0, x2: 0, y2: 0 },
  ],
});
const v = (id, name, swatch, bg, arrow, arrow2, diamond, hint, badgeFill, badgeText) => ({ id, name, swatch, skin: { base: bg, arrow, arrow2, diamond, hint, badge: { shape: 'diamond', fill: badgeFill, text: badgeText } } });

const skin = { radius: 4.6, band: 'none', base: ['#0b0b0d', '#000'], arrow: '#3FD0B0', arrow2: '#FFFFFF', diamond: '#3FD0B0', arrowCut: '#000', hint: '#FFD400', printBall: false, badge: { shape: 'diamond', fill: '#FFFFFF', text: '#0b0b0d' } };
const variants = [
  v('black-teal', 'Černá', '#3FD0B0', ['#0b0b0d', '#000'], '#3FD0B0', '#FFFFFF', '#3FD0B0', '#FFD400', '#FFFFFF', '#0b0b0d'),
  v('red-yellow', 'Červená', '#D62828', ['#C8242A', '#A81C21'], '#F6D117', '#FFFFFF', '#F6D117', '#FFFFFF', '#FFFFFF', '#111111'),
  v('teal', 'Tyrkysová', '#3DB89C', ['#40BC9F', '#34A98D'], '#FFFFFF', '#FFFFFF', '#101010', '#FFD400', '#FFFFFF', '#101010'),
  v('grey-yellow', 'Šedá žlutá', '#F6D117', ['#2F2F31', '#242426'], '#F6D117', '#FFFFFF', '#F6D117', '#19D3FF', '#FFFFFF', '#111111'),
  v('grey-blue', 'Šedá modrá', '#2D6FE0', ['#2F2F31', '#242426'], '#2D6FE0', '#FFFFFF', '#2D6FE0', '#FFD400', '#FFFFFF', '#111111'),
];
fs.writeFileSync('src/config/mats/diamond-x.json', JSON.stringify(base(skin, variants), null, 2));
console.log('zapsáno diamond-x');
