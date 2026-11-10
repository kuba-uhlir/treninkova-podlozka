// Téma podle oblíbeného týmu: akcentní barva, záře pozadí a logo jako vodoznak. Bez týmu = černá + žlutá.
import teams from '../config/teams.json';

const DEFAULT = { primary: '#16C45A', secondary: '#38BDF8' }; // výchozí akcent: zelená jako tráva
export const listTeams = () => teams;
export const getTeam = (id) => teams.find((t) => t.id === id) || null;

const rgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const toHex = (c) => `#${c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;
const lum = ([r, g, b]) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

// HSL: akcent se upravuje přes světlost a sytost, ne mícháním s bílou (to dělalo barvy narůžovělé a vybledlé)
function toHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b); const mn = Math.min(r, g, b); const l = (mx + mn) / 2; const d = mx - mn;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function fromHsl(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s; const x = c * (1 - Math.abs(((h / 60) % 2) - 1)); const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}
/** První dostatečně sytá barva z kandidátů (bílé/šedé týmové barvy se přeskočí); vrací [h, s, l]. */
function pickHue(cands) {
  for (const c of cands) {
    if (!c) continue;
    const hsl = toHsl(rgb(c));
    if (hsl[1] >= 0.3 && hsl[2] > 0.06 && hsl[2] < 0.97) return hsl;
  }
  return toHsl(rgb(DEFAULT.primary));
}

export function applyTheme(team) {
  const root = document.documentElement;
  // akcent: sytá barva týmu na černém pozadí (sytost min. 78 %, světlost 44–56 %), světlá a tmavá varianta zůstávají sytě
  const [h, s0, l0] = pickHue([team && team.primary, team && team.secondary, DEFAULT.primary]);
  const s = clamp(s0, 0.78, 1); const l = clamp(l0, 0.44, 0.56);
  const prim = fromHsl(h, s, l);
  const soft = fromHsl(h, clamp(s, 0.8, 1), Math.min(0.68, l + 0.14));
  const deep = fromHsl(h, s, Math.max(0.3, l - 0.12));
  const hs = pickHue([team && team.secondary, team && team.primary, DEFAULT.secondary]);
  const sec = fromHsl(hs[0], clamp(hs[1], 0.7, 1), clamp(hs[2], 0.45, 0.58));
  const set = (k, v) => root.style.setProperty(k, v);
  set('--c-sun', toHex(prim));
  set('--acc-soft', toHex(soft));
  set('--acc-deep', toHex(deep));
  set('--acc-rgb', prim.map(Math.round).join(','));
  set('--sec-rgb', sec.map(Math.round).join(','));
  set('--on-acc', lum(prim) > 0.5 ? '#0A0A0C' : '#fff');
  const wm = document.getElementById('bgwm');
  if (wm) {
    wm.replaceChildren();
    if (team && team.logo) {
      const i = new Image();
      i.onload = () => wm.appendChild(i);
      i.src = team.logo;
    }
  }
}

/** Logo týmu (nebo monogram v barvách týmu, dokud logo chybí). */
export function teamLogo(team, size) {
  const d = document.createElement('div');
  d.style.cssText = `width:${size};height:${size};flex:none;position:relative;border-radius:var(--r-sm);display:flex;align-items:center;justify-content:center;` +
    `background:linear-gradient(135deg,${team.primary},${team.secondary});color:#fff;font-weight:800;font-size:calc(${size} * .4);overflow:hidden`;
  d.textContent = team.name.trim().charAt(0);
  if (team.logo) {
    const i = new Image();
    i.style.cssText = 'position:absolute;inset:8%;width:84%;height:84%;object-fit:contain';
    i.onload = () => { d.style.background = 'rgba(255,255,255,.06)'; d.textContent = ''; d.appendChild(i); };
    i.src = team.logo;
  }
  return d;
}
