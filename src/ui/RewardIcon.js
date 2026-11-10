// Ikony odměn (SVG): medaile se stuhou, pohár, zlatý míč, hvězda, plamen, kopačka, štít, koruna, hodiny a svítání.
// Hvězdy jsou přesně vycentrované (střed opsané kružnice hvězdy je v bodě 50 / 50.2). Zamčené odměny jsou tmavé siluety.
import { TIERS } from '../domain/rewards.js';

let n = 0;
const STAR = '50,22 57.4,40 76.8,41.4 62,54 66.8,73 50,62.6 33.2,73 38,54 23.2,41.4 42.6,40';
/** Hvězda se středem v (cx, cy) a měřítkem k. */
const star = (cx, cy, k, extra = '') => `<polygon points="${STAR}" transform="translate(${cx} ${cy}) scale(${k}) translate(-50 -50.2)" ${extra}/>`;

export function rewardIcon(r, size, { locked = false } = {}) {
  const t = TIERS[r.tier] || TIERS.bronze;
  const id = `ri${n++}`;
  const el = document.createElement('div');
  el.style.cssText = `width:${size};height:${size};flex:none;${locked ? 'opacity:.3;filter:grayscale(1) brightness(.8)' : `filter:drop-shadow(0 .6vmin 1.4vmin rgba(0,0,0,.5)) drop-shadow(0 0 1.6vmin ${t.a}55)`}`;
  const G = `url(#${id}g)`;
  const defs = `<defs><linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.a}"/><stop offset="1" stop-color="${t.b}"/></linearGradient>
    <linearGradient id="${id}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E5352B"/><stop offset="1" stop-color="#9E1B14"/></linearGradient></defs>`;
  const stroke = `stroke="${t.b}" stroke-width="2.2" stroke-linejoin="round"`;
  const white = 'fill="#fff" fill-opacity=".92"';
  let body = '';
  switch (r.kind) {
    case 'medal':
      body = `<polygon points="30,4 46,4 56,44 42,44" fill="url(#${id}r)"/><polygon points="54,4 70,4 58,44 44,44" fill="#F2F2F4"/>
        <circle cx="50" cy="64" r="30" fill="${G}" ${stroke}/>
        <circle cx="50" cy="64" r="23" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.6"/>
        ${star(50, 64, 0.72, `${white} stroke="${t.b}" stroke-width="1.4" stroke-linejoin="round"`)}`;
      break;
    case 'trophy':
      body = `<path d="M26 22 C10 22 10 48 32 52" fill="none" stroke="${G}" stroke-width="6" stroke-linecap="round"/>
        <path d="M74 22 C90 22 90 48 68 52" fill="none" stroke="${G}" stroke-width="6" stroke-linecap="round"/>
        <path d="M28 12 H72 V38 C72 58 60 66 50 68 C40 66 28 58 28 38 Z" fill="${G}" ${stroke}/>
        <rect x="45" y="66" width="10" height="14" fill="${t.b}"/><rect x="32" y="80" width="36" height="9" rx="2.6" fill="${G}" stroke="${t.b}" stroke-width="2"/>
        ${star(50, 38, 0.52, white)}`;
      break;
    case 'ball':
      body = `<circle cx="50" cy="50" r="38" fill="${G}" ${stroke}/>
        <polygon points="50,33 64,43 59,60 41,60 36,43" fill="${t.b}"/>
        <g stroke="${t.b}" stroke-width="2.2" stroke-linecap="round"><line x1="50" y1="33" x2="50" y2="14"/><line x1="64" y1="43" x2="82" y2="36"/><line x1="59" y1="60" x2="70" y2="76"/><line x1="41" y1="60" x2="30" y2="76"/><line x1="36" y1="43" x2="18" y2="36"/></g>
        <path d="M28 28 Q34 20 44 17" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>`;
      break;
    case 'flame':
      body = `<path d="M50 6 C56 26 80 34 74 62 C70 82 54 94 50 94 C46 94 30 82 26 62 C24 46 36 40 38 26 C44 32 48 22 50 6 Z" fill="${G}" ${stroke}/>
        <path d="M50 44 C54 56 66 60 62 74 C60 84 52 90 50 90 C48 90 40 84 38 74 C36 64 46 58 50 44 Z" fill="#fff" fill-opacity=".55"/>`;
      break;
    case 'boot':
      body = `<path d="M10 58 C10 50 20 48 26 44 L34 26 L50 26 L54 42 C66 44 86 50 90 60 L90 70 C90 74 87 77 83 77 L17 77 C13 77 10 74 10 70 Z" fill="${G}" ${stroke}/>
        <g stroke="#fff" stroke-opacity=".75" stroke-width="2.2" stroke-linecap="round"><line x1="38" y1="34" x2="48" y2="38"/><line x1="36" y1="41" x2="50" y2="46"/></g>
        <g fill="${t.b}"><rect x="20" y="77" width="9" height="9" rx="2"/><rect x="38" y="77" width="9" height="9" rx="2"/><rect x="56" y="77" width="9" height="9" rx="2"/><rect x="74" y="77" width="9" height="9" rx="2"/></g>`;
      break;
    case 'shield':
      body = `<path d="M50 8 L84 20 V48 C84 70 68 84 50 93 C32 84 16 70 16 48 V20 Z" fill="${G}" ${stroke}/>
        <path d="M50 16 L77 25 V48 C77 66 64 77 50 85 C36 77 23 66 23 48 V25 Z" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.6"/>
        ${star(50, 50, 0.78, `${white} stroke="${t.b}" stroke-width="1.2" stroke-linejoin="round"`)}`;
      break;
    case 'crown':
      body = `<path d="M12 74 L18 30 L36 52 L50 18 L64 52 L82 30 L88 74 Z" fill="${G}" ${stroke}/>
        <rect x="12" y="74" width="76" height="12" rx="3" fill="${G}" stroke="${t.b}" stroke-width="2"/>
        <circle cx="18" cy="28" r="4.5" fill="${t.a}" stroke="${t.b}" stroke-width="1.6"/><circle cx="50" cy="16" r="5" fill="${t.a}" stroke="${t.b}" stroke-width="1.6"/><circle cx="82" cy="28" r="4.5" fill="${t.a}" stroke="${t.b}" stroke-width="1.6"/>
        <circle cx="50" cy="80" r="3" fill="#fff" fill-opacity=".85"/><circle cx="30" cy="80" r="2.4" fill="#fff" fill-opacity=".7"/><circle cx="70" cy="80" r="2.4" fill="#fff" fill-opacity=".7"/>`;
      break;
    case 'clock': {
      const ticks = Array.from({ length: 12 }, (_, i) => { const a = (i * Math.PI) / 6; const r1 = i % 3 ? 24 : 21; return `<line x1="${(50 + Math.sin(a) * r1).toFixed(1)}" y1="${(50 - Math.cos(a) * r1).toFixed(1)}" x2="${(50 + Math.sin(a) * 27).toFixed(1)}" y2="${(50 - Math.cos(a) * 27).toFixed(1)}" stroke="${t.b}" stroke-width="${i % 3 ? 1.6 : 2.6}" stroke-linecap="round"/>`; }).join('');
      body = `<circle cx="50" cy="50" r="38" fill="${G}" ${stroke}/><circle cx="50" cy="50" r="30" fill="#fff" fill-opacity=".92"/>${ticks}
        <line x1="50" y1="50" x2="50" y2="29" stroke="#20242c" stroke-width="3.4" stroke-linecap="round"/><line x1="50" y1="50" x2="64" y2="58" stroke="#20242c" stroke-width="3.4" stroke-linecap="round"/><circle cx="50" cy="50" r="3.2" fill="${t.b}"/>`;
      break;
    }
    case 'sunrise': {
      const rays = Array.from({ length: 7 }, (_, i) => { const a = Math.PI + (i * Math.PI) / 6; return `<line x1="${(50 + Math.cos(a) * 33).toFixed(1)}" y1="${(66 + Math.sin(a) * 33).toFixed(1)}" x2="${(50 + Math.cos(a) * 44).toFixed(1)}" y2="${(66 + Math.sin(a) * 44).toFixed(1)}" stroke="${t.a}" stroke-width="4.2" stroke-linecap="round"/>`; }).join('');
      body = `${rays}<path d="M24 66 A26 26 0 0 1 76 66 Z" fill="${G}" ${stroke}/><line x1="12" y1="70" x2="88" y2="70" stroke="${t.b}" stroke-width="4.4" stroke-linecap="round"/>
        <line x1="26" y1="80" x2="74" y2="80" stroke="${t.b}" stroke-opacity=".55" stroke-width="3.4" stroke-linecap="round"/>`;
      break;
    }
    default: // star
      body = `${star(50, 52, 1.6, `fill="${G}" stroke="${t.b}" stroke-width="1.4" stroke-linejoin="round"`)}<path d="M36 38 L48 30" stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>`;
  }
  el.innerHTML = `<svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">${defs}${body}</svg>`;
  return el;
}
