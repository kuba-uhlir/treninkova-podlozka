import { RARITY } from '../domain/extras.js';
import G from './cardFrame.json';

const COUNTRY = { ARG: 'Argentina', POR: 'Portugalsko', FRA: 'Francie', NOR: 'Norsko', BRA: 'Brazílie', POL: 'Polsko', CRO: 'Chorvatsko', BEL: 'Belgie', EGY: 'Egypt', ENG: 'Anglie', ESP: 'Španělsko', KOR: 'Jižní Korea', SWE: 'Švédsko', NED: 'Nizozemsko', GER: 'Německo', CZE: 'Česko', ITA: 'Itálie' };
export const countryName = (c) => COUNTRY[c] || c;

// Rámeček karty (assets/img/art/card_frame_<vzácnost>.webp) je obrázek s průhledným oknem; rozměry okna, štítku a destičky jsou v cardFrame.json.
const P = (x) => `${(x * 100).toFixed(2)}%`;
const WIN = `left:${P(G.window.l)};top:${P(G.window.t)};right:${P(1 - G.window.r)};bottom:${P(1 - G.window.b)}`;
const frameImg = (rarity) => `<img src="img/art/card_frame_${rarity}.webp" alt="" draggable="false" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:3">`;
const plateText = (w, txt, color) => `<div style="position:absolute;left:${P(G.plate.l)};width:${P(G.plate.r - G.plate.l)};top:${P(G.plate.t)};height:${P(G.plate.b - G.plate.t)};display:flex;align-items:center;justify-content:center;z-index:4;` +
  `font-weight:800;font-size:calc(${w} * .034);letter-spacing:.16em;text-transform:uppercase;color:${color};white-space:nowrap;pointer-events:none">${txt}</div>`;
const winH = G.window.b - G.window.t;
const nameSize = (n) => (n.length > 17 ? '.058' : n.length > 14 ? '.066' : n.length > 11 ? '.076' : n.length > 9 ? '.086' : '.092');

/**
 * Fotbalová kartička 5:7: neonový rám podle vzácnosti (přebarvený obrázek), hodnocení ve štítku vlevo nahoře, fotka (nebo iniciály) v okně,
 * jméno a země dole nad destičkou s názvem vzácnosti. Epické a legendární karty mají lesklý přejezd. locked = tmavá siluetka (ještě nezískaná).
 */
export function cardEl(c, w, { locked = false, count = 0 } = {}) {
  const r = RARITY[c.rarity];
  const el = document.createElement('div');
  el.style.cssText = `position:relative;width:${w};aspect-ratio:5/7;flex:none;border-radius:calc(${w} * .07);overflow:hidden;background:#0c0e14;box-sizing:border-box;` +
    `box-shadow:0 calc(${w} * .03) calc(${w} * .1) rgba(0,0,0,.55)${locked ? '' : `,0 0 calc(${w} * .14) ${r.a}55`};${locked ? 'filter:grayscale(1) brightness(.5);' : ''}`;
  const win = document.createElement('div');
  win.style.cssText = `position:absolute;${WIN};overflow:hidden;border-radius:calc(${w} * .025);background:linear-gradient(180deg,#1b1f2a,#0c0e14)`;
  const initials = c.name.split(' ').map((x) => x[0]).slice(0, 2).join('');
  const photoBox = document.createElement('div');
  photoBox.style.cssText = `position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 35%,${r.a}66,transparent 70%);` +
    `font-weight:800;font-size:calc(${w} * .38);color:${r.a};letter-spacing:-0.05em`;
  photoBox.textContent = locked ? '?' : initials;
  if (c.photo && !locked) {
    const i = new Image();
    i.style.cssText = 'width:100%;height:100%;object-fit:cover;object-position:50% 18%';
    i.onload = () => { photoBox.textContent = ''; photoBox.style.background = '#000'; photoBox.appendChild(i); };
    i.src = `img/cards/${c.photo}`;
  }
  const fade = document.createElement('div');
  fade.style.cssText = 'position:absolute;inset:0;background:linear-gradient(180deg,transparent 52%,rgba(12,14,20,.96) 88%);pointer-events:none';
  const info = document.createElement('div');
  info.style.cssText = `position:absolute;left:0;right:0;bottom:${P((G.window.b - G.plate.t) / winH + 0.012)};display:flex;flex-direction:column;align-items:center;gap:calc(${w} * .012);padding:0 calc(${w} * .03);text-align:center`;
  info.innerHTML = `<div style="font-weight:800;font-size:calc(${w} * ${nameSize(c.name)});color:#fff;letter-spacing:-0.03em;line-height:1.1;white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis">${locked ? 'Neznámá karta' : c.name}</div>` +
    `<div style="font-weight:700;font-size:calc(${w} * .05);color:${r.a};letter-spacing:.14em;text-transform:uppercase">${locked ? '' : countryName(c.country)}</div>`;
  win.append(photoBox, fade, info);
  // hodnocení ve štítku a post pod ním
  const cx = (G.shield.l + G.shield.r) / 2; const cy = (G.shield.t + G.shield.b) / 2;
  const rate = document.createElement('div');
  rate.style.cssText = `position:absolute;left:${P(cx)};top:${P(cy)};transform:translate(-50%,-50%);z-index:4;font-weight:800;font-size:calc(${w} * .085);color:#fff;letter-spacing:-0.06em;line-height:1;pointer-events:none`;
  rate.textContent = locked ? '??' : c.rating;
  const pos = document.createElement('div');
  pos.style.cssText = `position:absolute;left:${P(G.window.l + 0.012)};top:${P(G.shield.b + 0.01)};z-index:4;font-weight:800;font-size:calc(${w} * .06);color:${r.a};letter-spacing:.08em;text-shadow:0 2px 8px rgba(0,0,0,.9);pointer-events:none`;
  pos.textContent = locked ? '' : c.pos;
  el.append(win, rate, pos);
  el.insertAdjacentHTML('beforeend', frameImg(c.rarity) + plateText(w, locked ? '' : r.name, r.a));
  if (count > 1) {
    const n = document.createElement('div');
    n.textContent = `×${count}`;
    n.style.cssText = `position:absolute;right:${P(1 - G.window.r + 0.014)};top:${P(G.window.t + 0.014)};z-index:4;padding:0 calc(${w} * .035);border-radius:99px;background:rgba(0,0,0,.65);color:#fff;font-weight:800;font-size:calc(${w} * .07)`;
    el.append(n);
  }
  if (!locked && (c.rarity === 'epic' || c.rarity === 'legend')) {
    const s = document.createElement('div');
    s.style.cssText = 'position:absolute;z-index:5;top:0;bottom:0;left:-60%;width:35%;pointer-events:none;transform:skewX(-18deg);background:linear-gradient(100deg,transparent,rgba(255,255,255,.35),transparent);animation:shine 4.2s ease-in-out infinite';
    el.append(s);
  }
  return el;
}

/** Rub karty: stejný rám, uvnitř zajímavost o hráči a dole zdroj fotky. */
export function cardBackEl(c, w, text, source) {
  const r = RARITY[c.rarity];
  const el = document.createElement('div');
  el.style.cssText = `position:relative;width:${w};aspect-ratio:5/7;flex:none;border-radius:calc(${w} * .07);overflow:hidden;box-sizing:border-box;background:#0c0e14;` +
    `box-shadow:0 calc(${w} * .03) calc(${w} * .1) rgba(0,0,0,.55),0 0 calc(${w} * .14) ${r.a}55`;
  const credit = c.photo ? `Foto: ${(c.author || 'neuvedeno').slice(0, 40)}, ${c.license || ''}, Wikimedia Commons` : '';
  el.innerHTML = `<div style="position:absolute;${WIN};overflow:hidden;border-radius:calc(${w} * .025);background:radial-gradient(circle at 50% 0%,${r.a}33,transparent 60%),linear-gradient(180deg,#1b1f2a,#0c0e14);display:flex;flex-direction:column;align-items:center;padding:calc(${w} * .13) calc(${w} * .035) calc(${w} * .07);box-sizing:border-box;text-align:center;gap:calc(${w} * .022)">
    <div style="font-weight:800;font-size:calc(${w} * ${c.name.length > 15 ? '.075' : '.088'});color:#fff;letter-spacing:-0.03em;line-height:1.1">${c.name}</div>
    <div style="font-weight:700;font-size:calc(${w} * .045);color:var(--c-mute);letter-spacing:.1em;text-transform:uppercase">${countryName(c.country)} · ${c.pos} · ${c.rating}</div>
    <div style="width:35%;height:2px;background:${r.a};opacity:.7;margin:calc(${w} * .012) 0"></div>
    <div style="font-weight:700;font-size:calc(${w} * .054);color:#fff;line-height:1.3;flex:1;display:flex;align-items:center;min-height:0;overflow:hidden">${text || 'Slavný fotbalista, který se zapsal do historie hry.'}</div>
    <div style="font-size:calc(${w} * .03);color:var(--c-mute);line-height:1.3;opacity:.85">${[credit, source].filter(Boolean).join('<br>')}</div></div>` + frameImg(c.rarity) + plateText(w, r.name, r.a);
  return el;
}

/** Otočná karta: klepnutí nebo flip() přepne líc / rub. text = zajímavost na rubu. */
export function flipCardEl(c, w, { text = '', source = '', count = 0 } = {}) {
  const wrap = document.createElement('div');
  wrap.style.cssText = `position:relative;width:${w};aspect-ratio:5/7;flex:none;perspective:calc(${w} * 4);cursor:pointer`;
  const inner = document.createElement('div');
  inner.style.cssText = 'position:absolute;inset:0;transform-style:preserve-3d;transition:transform .7s cubic-bezier(.2,.8,.2,1)';
  const face = (node, back) => { node.style.position = 'absolute'; node.style.inset = '0'; node.style.width = '100%'; node.style.height = '100%'; node.style.aspectRatio = 'auto'; node.style.backfaceVisibility = 'hidden'; node.style.webkitBackfaceVisibility = 'hidden'; if (back) node.style.transform = 'rotateY(180deg)'; return node; };
  inner.append(face(cardEl(c, w, { count }), false), face(cardBackEl(c, w, text, source), true));
  wrap.append(inner);
  let flipped = false;
  wrap.flip = () => { flipped = !flipped; inner.style.transform = flipped ? 'rotateY(180deg)' : 'none'; return flipped; };
  wrap.setAttribute('data-focusable', ''); wrap.setAttribute('tabindex', '0'); wrap.style.outline = 'none'; wrap.style.borderRadius = `calc(${w} * .07)`;
  wrap.addEventListener('click', (e) => { e.stopPropagation(); wrap.flip(); });
  wrap.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); wrap.flip(); } });
  return wrap;
}
