// Drobné DOM helpery pro obrazovky.
export function h(tag, cls = '', html = '', attrs = {}) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  return e;
}

// Ikony: sada Lucide (ISC), generuje se do icons.js skriptem scripts/build-icons.mjs.
import { ICONS } from './icons.js';
// Nové neonové ikony jsou obrázky (assets/img/art/ic_*.webp, vyrábí scripts/build-art.mjs); co v sadě chybí, zůstává z Lucide.
const ART_ICONS = new Set(['play', 'stop', 'pause', 'back', 'plus', 'check', 'lock', 'gear', 'home', 'info', 'warn', 'trash', 'edit', 'camera', 'list', 'grid', 'trophy', 'star', 'users', 'profile', 'cards', 'swords', 'levels', 'ball']);
export const icon = (name) => {
  const art = name === 'starO' ? 'star' : name;
  if (ART_ICONS.has(art)) return `<img class="icon" src="img/art/ic_${art}.webp" alt="" draggable="false"${name === 'starO' ? ' style="opacity:.4"' : ''}>`;
  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;
};

/** Fokusovatelné tlačítko (D-pad + dotyk). Label může obsahovat ikonu: btn(`${icon('play')}Trénink`, ...) */
export function btn(label, cls, onClick, { auto = false } = {}) {
  const b = h('button', cls, label, { 'data-focusable': '', tabindex: '0', type: 'button' });
  if (auto) b.setAttribute('data-autofocus', '');
  b.onclick = onClick;
  return b;
}

export const u = (n) => `calc(var(--u) * ${n})`;

// Hráč = dres s číslem v barvách oblíbeného týmu (bez týmu: vlastní barva). Čtyři střihy dresu.
import { getTeam } from './theme.js';

export const KIT_STYLES = ['plain', 'stripes', 'hoops', 'sash', 'halves', 'pinstripes', 'band', 'chevron', 'checkers', 'raglan', 'diagonal', 'fade'];
let jid = 0;
const hexRgb = (hex) => { const n = parseInt(hex.replace('#', '').slice(0, 6), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const lumOf = (hex) => { const [r, g, b] = hexRgb(hex); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };
const mixHex = (hex, to, k) => { const c = hexRgb(hex); const t = hexRgb(to); return '#' + c.map((v, i) => Math.round(v + (t[i] - v) * k).toString(16).padStart(2, '0')).join(''); };

/** Barvy dresu hráče: tým má přednost, jinak vlastní barva + bílá. */
export function kitColors(p) {
  const team = getTeam(p.team);
  const primary = (team && team.primary) || p.color || '#FFD400';
  let secondary = (team && team.secondary) || p.color2 || '#FFFFFF';
  if (secondary.toLowerCase() === primary.toLowerCase()) secondary = lumOf(primary) > 0.5 ? '#111111' : '#FFFFFF';
  return { primary, secondary };
}

const BODY = 'M31 10 L13 21 L4 43 L20 51 L25 44 L25 91 Q50 97 75 91 L75 44 L80 51 L96 43 L87 21 L69 10 Q50 24 31 10 Z';

/** SVG dresu s číslem (nebo iniciálou). size v jednotkách --u. */
export function jerseyEl(p, size = 12, { number = true } = {}) {
  if (p.face) return faceEl(p, size, { number });
  const { primary, secondary } = kitColors(p);
  const team = getTeam(p.team);
  // tým určuje vzor dresu; bez týmu platí zvolený střih
  const style = (team && team.kit && KIT_STYLES.includes(team.kit)) ? team.kit : KIT_STYLES[(typeof p.avatar === 'number' ? p.avatar : 0) % KIT_STYLES.length];
  const id = 'jy' + (jid++);
  const txt = lumOf(primary) > 0.58 ? '#101012' : '#FFFFFF';
  const label = (p.jersey || (p.name || '').trim().charAt(0) || '').toString().toUpperCase().slice(0, 2);
  const S = secondary; const P = primary;
  const rects = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join("");
  const DECO = {
    plain: "",
    stripes: rects(5, (i) => `<rect x="${22 + i * 14}" y="0" width="7" height="100" fill="${S}" opacity=".92"/>`),
    hoops: rects(3, (i) => `<rect x="0" y="${46 + i * 17}" width="100" height="8" fill="${S}" opacity=".92"/>`),
    sash: `<polygon points="0,30 0,48 100,92 100,74" fill="${S}" opacity=".94"/>`,
    halves: `<rect x="50" y="0" width="50" height="100" fill="${S}"/>`,
    pinstripes: rects(12, (i) => `<rect x="${6 + i * 8}" y="0" width="2.2" height="100" fill="${S}" opacity=".75"/>`),
    band: `<rect x="38" y="0" width="24" height="100" fill="${S}" opacity=".95"/>`,
    chevron: `<polygon points="0,38 50,66 100,38 100,52 50,80 0,52" fill="${S}" opacity=".95"/>`,
    checkers: rects(8, (r) => rects(8, (c) => ((r + c) % 2 ? `<rect x="${c * 12.5}" y="${r * 12.5}" width="12.5" height="12.5" fill="${S}" opacity=".9"/>` : ""))),
    raglan: `<polygon points="0,0 32,0 50,30 68,0 100,0 100,42 80,52 74,40 74,100 26,100 26,40 20,52 0,42" fill="none"/><path d="M0 0 L38 0 L50 24 L62 0 L100 0 L100 46 L76 56 L72 30 L50 40 L28 30 L24 56 L0 46 Z" fill="${S}" opacity=".95"/>`,
    diagonal: rects(6, (i) => `<polygon points="${-30 + i * 28},100 ${-8 + i * 28},100 ${72 + i * 28},0 ${50 + i * 28},0" fill="${S}" opacity=".9"/>`),
    fade: `<defs><linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset=".35" stop-color="${S}" stop-opacity="0"/><stop offset="1" stop-color="${S}" stop-opacity=".95"/></linearGradient></defs><rect width="100" height="100" fill="url(#${id}f)"/>`,
  };
  const deco = DECO[style] || "";
  const noPlate = ["plain", "raglan", "fade"].includes(style);
  const numFill = txt;
  const plate = noPlate ? "" : `<rect x="32" y="40" width="36" height="32" rx="6" fill="${P}" opacity=".92"/>`;
  const el = h('div', 'shrink-0');
  el.style.cssText = `width:${u(size)};height:${u(size)};filter:drop-shadow(0 ${u(0.6)} ${u(1.6)} rgba(0,0,0,.55))`;
  el.innerHTML = `<svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
    <defs><clipPath id="${id}"><path d="${BODY}"/></clipPath>
      <linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></linearGradient></defs>
    <g clip-path="url(#${id})"><rect width="100" height="100" fill="${primary}"/>${deco}
      <rect x="0" y="40" width="26" height="14" fill="${secondary}" opacity=".0"/>
      <path d="M4 43 L20 51 L22 46 L7 38 Z" fill="${secondary}"/><path d="M96 43 L80 51 L78 46 L93 38 Z" fill="${secondary}"/>
      <rect width="100" height="100" fill="url(#${id}g)"/></g>
    <path d="M31 10 Q50 24 69 10" fill="none" stroke="${secondary}" stroke-width="4.2" stroke-linecap="round"/>
    <path d="${BODY}" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1"/>
    ${number ? plate : ''}
    ${team && team.logo && number && size >= 8 ? `<circle cx="68" cy="29" r="9.6" fill="#fff" opacity=".94"/><image href="${team.logo}" x="59.6" y="20.6" width="16.8" height="16.8" preserveAspectRatio="xMidYMid meet"/>` : ''}
    ${number ? `<text x="50" y="66" text-anchor="middle" font-family="Inter, sans-serif" font-weight="800" font-size="${label.length > 1 ? 30 : 36}" letter-spacing="-1.5" fill="${numFill}">${label}</text>` : ''}
  </svg>`;
  return el;
}

/** Postavička hráče (obličej z assets/img/art/av_NN.webp) s číslem dresu v barvě klubu v rohu. */
export const FACE_COUNT = 24;
export const faceSrc = (n) => `img/art/av_${String(n).padStart(2, '0')}.webp`;
export function faceEl(p, size = 12, { number = true } = {}) {
  const { primary } = kitColors(p);
  const label = (p.jersey || '').toString().slice(0, 2);
  const el = h('div', 'shrink-0');
  el.style.cssText = `position:relative;width:${u(size)};height:${u(size)};filter:drop-shadow(0 ${u(0.6)} ${u(1.6)} rgba(0,0,0,.55))`;
  el.innerHTML = `<img src="${faceSrc(p.face)}" alt="" draggable="false" style="width:100%;height:100%;object-fit:contain">`;
  if (number && label && size >= 5) {
    const b = h('div', '', label);
    b.style.cssText = `position:absolute;right:-2%;bottom:1%;min-width:${u(size * 0.3)};height:${u(size * 0.3)};padding:0 ${u(size * 0.04)};box-sizing:border-box;border-radius:99px;display:flex;align-items:center;justify-content:center;` +
      `background:${primary};color:${lumOf(primary) > 0.58 ? '#101012' : '#FFFFFF'};border:${u(0.25)} solid #0A0A0C;font-weight:800;font-size:${u(size * 0.16)};letter-spacing:-0.04em`;
    el.append(b);
  }
  return el;
}

/** Zpětná kompatibilita: avatar hráče = dres. */
export const avatarEl = (p, size = 12) => jerseyEl(p, size);
