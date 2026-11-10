// Složí ikony aplikace z balíčku Lucide (https://lucide.dev, licence ISC) do src/ui/icons.js.
// Spuštění: node scripts/build-icons.mjs  (po npm install; ikony jsou 24×24, čárové, zaoblené)
import fs from 'node:fs';

// název v aplikaci -> [soubor v Lucide, vyplnit tvar?]
const MAP = {
  play: ['play', true], stop: ['square', true], users: ['users'], lock: ['lock'], plus: ['plus'], check: ['check'], back: ['arrow-left'],
  edit: ['pencil'], grid: ['layout-grid'], trophy: ['trophy'], trash: ['trash-2'], camera: ['camera'], home: ['house'], warn: ['triangle-alert'],
  swords: ['swords'], list: ['list-checks'], cards: ['layers'], star: ['star', true], starO: ['star'],
  levels: ['chart-no-axes-column-increasing'], profile: ['user-round'], info: ['info'], ball: ['circle-dot'],
};

const dir = 'node_modules/lucide-static/icons';
const out = {};
for (const [name, [file, filled]] of Object.entries(MAP)) {
  const p = `${dir}/${file}.svg`;
  if (!fs.existsSync(p)) { console.log('CHYBÍ', file); continue; }
  const svg = fs.readFileSync(p, 'utf8');
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>[\s\S]*$/, '').replace(/\s+/g, ' ').trim();
  out[name] = `<g fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="${filled ? 1.6 : 2}" stroke-linecap="round" stroke-linejoin="round">${inner}</g>`;
}
const src = `// GENEROVÁNO skriptem scripts/build-icons.mjs z balíčku Lucide (ISC). Neupravovat ručně.\nexport const ICONS = ${JSON.stringify(out, null, 2)};\n`;
fs.writeFileSync('src/ui/icons.js', src);
console.log('ikon:', Object.keys(out).length);
