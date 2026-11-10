import { RARITY } from '../domain/extras.js';

const COUNTRY = { ARG: 'Argentina', POR: 'Portugalsko', FRA: 'Francie', NOR: 'Norsko', BRA: 'Brazílie', POL: 'Polsko', CRO: 'Chorvatsko', BEL: 'Belgie', EGY: 'Egypt', ENG: 'Anglie', ESP: 'Španělsko', KOR: 'Jižní Korea', SWE: 'Švédsko', NED: 'Nizozemsko', GER: 'Německo', CZE: 'Česko', ITA: 'Itálie' };
export const countryName = (c) => COUNTRY[c] || c;

/**
 * Fotbalová kartička 5:7: barevný rám podle vzácnosti, hodnocení a post vlevo nahoře, fotka (nebo iniciály),
 * jméno a země dole. Epické a legendární karty mají lesklý přejezd. locked = tmavá siluetka (ještě nezískaná).
 */
export function cardEl(c, w, { locked = false, count = 0 } = {}) {
  const r = RARITY[c.rarity];
  const el = document.createElement('div');
  el.style.cssText = `position:relative;width:${w};aspect-ratio:5/7;flex:none;border-radius:calc(${w} * .07);overflow:hidden;` +
    `background:linear-gradient(155deg,${r.a},${r.b} 70%,#0b0b10);padding:calc(${w} * .035);box-sizing:border-box;` +
    `box-shadow:0 calc(${w} * .03) calc(${w} * .1) rgba(0,0,0,.55)${locked ? '' : `,0 0 calc(${w} * .14) ${r.a}55`};${locked ? 'filter:grayscale(1) brightness(.5);' : ''}`;
  const inner = document.createElement('div');
  inner.style.cssText = `position:relative;width:100%;height:100%;border-radius:calc(${w} * .05);overflow:hidden;background:linear-gradient(180deg,#1b1f2a,#0c0e14)`;
  const initials = c.name.split(' ').map((x) => x[0]).slice(0, 2).join('');
  const photoBox = document.createElement('div');
  photoBox.style.cssText = `position:absolute;inset:0 0 28% 0;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 35%,${r.a}66,transparent 70%);` +
    `font-weight:800;font-size:calc(${w} * .38);color:${r.a};letter-spacing:-0.05em`;
  photoBox.textContent = locked ? '?' : initials;
  if (c.photo && !locked) {
    const i = new Image();
    i.style.cssText = 'width:100%;height:100%;object-fit:cover;object-position:50% 18%';
    i.onload = () => { photoBox.textContent = ''; photoBox.style.background = '#000'; photoBox.appendChild(i); };
    i.src = `img/cards/${c.photo}`;
  }
  const fade = document.createElement('div');
  fade.style.cssText = 'position:absolute;inset:0 0 28% 0;background:linear-gradient(180deg,transparent 60%,rgba(12,14,20,.95));pointer-events:none';
  const rate = document.createElement('div');
  rate.style.cssText = `position:absolute;left:calc(${w} * .05);top:calc(${w} * .04);display:flex;flex-direction:column;align-items:center;line-height:1;text-shadow:0 2px 8px rgba(0,0,0,.8)`;
  rate.innerHTML = `<div style="font-weight:800;font-size:calc(${w} * .2);color:#fff;letter-spacing:-0.05em">${locked ? '??' : c.rating}</div><div style="font-weight:800;font-size:calc(${w} * .075);color:${r.a};letter-spacing:.08em">${locked ? '' : c.pos}</div>`;
  const info = document.createElement('div');
  info.style.cssText = `position:absolute;left:0;right:0;bottom:0;height:28%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:calc(${w} * .015);padding:0 calc(${w} * .04);text-align:center;background:linear-gradient(180deg,rgba(12,14,20,.95),#0c0e14)`;
  info.innerHTML = `<div style="font-weight:800;font-size:calc(${w} * ${c.name.length > 15 ? '.082' : '.1'});color:#fff;letter-spacing:-0.03em;line-height:1.1;white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis">${locked ? 'Neznámá karta' : c.name}</div>` +
    `<div style="font-weight:700;font-size:calc(${w} * .062);color:${r.a};letter-spacing:.14em;text-transform:uppercase">${locked ? '' : `${countryName(c.country)} · ${r.name}`}</div>`;
  inner.append(photoBox, fade, rate, info);
  if (count > 1) {
    const n = document.createElement('div');
    n.textContent = `×${count}`;
    n.style.cssText = `position:absolute;right:calc(${w} * .04);top:calc(${w} * .04);padding:0 calc(${w} * .035);border-radius:99px;background:rgba(0,0,0,.65);color:#fff;font-weight:800;font-size:calc(${w} * .07)`;
    inner.append(n);
  }
  el.append(inner);
  if (!locked && (c.rarity === 'epic' || c.rarity === 'legend')) {
    const s = document.createElement('div');
    s.style.cssText = 'position:absolute;top:0;bottom:0;left:-60%;width:35%;pointer-events:none;transform:skewX(-18deg);background:linear-gradient(100deg,transparent,rgba(255,255,255,.35),transparent);animation:shine 4.2s ease-in-out infinite';
    el.append(s);
  }
  return el;
}

/** Rub karty: rám podle vzácnosti, zajímavost o hráči a dole zdroj fotky. */
export function cardBackEl(c, w, text, source) {
  const r = RARITY[c.rarity];
  const el = document.createElement('div');
  el.style.cssText = `position:relative;width:${w};aspect-ratio:5/7;flex:none;border-radius:calc(${w} * .07);overflow:hidden;box-sizing:border-box;padding:calc(${w} * .035);` +
    `background:linear-gradient(155deg,${r.a},${r.b} 70%,#0b0b10);box-shadow:0 calc(${w} * .03) calc(${w} * .1) rgba(0,0,0,.55),0 0 calc(${w} * .14) ${r.a}55`;
  const credit = c.photo ? `Foto: ${(c.author || 'neuvedeno').slice(0, 40)}, ${c.license || ''}, Wikimedia Commons` : '';
  el.innerHTML = `<div style="position:relative;width:100%;height:100%;border-radius:calc(${w} * .05);overflow:hidden;background:radial-gradient(circle at 50% 0%,${r.a}33,transparent 60%),linear-gradient(180deg,#1b1f2a,#0c0e14);display:flex;flex-direction:column;align-items:center;padding:calc(${w} * .07) calc(${w} * .07) calc(${w} * .05);box-sizing:border-box;text-align:center;gap:calc(${w} * .03)">
    <div style="font-weight:800;font-size:calc(${w} * .075);color:${r.a};letter-spacing:.14em;text-transform:uppercase">${r.name}</div>
    <div style="font-weight:800;font-size:calc(${w} * ${c.name.length > 15 ? '.088' : '.1'});color:#fff;letter-spacing:-0.03em;line-height:1.1">${c.name}</div>
    <div style="font-weight:700;font-size:calc(${w} * .055);color:var(--c-mute);letter-spacing:.12em;text-transform:uppercase">${countryName(c.country)} · ${c.pos} · ${c.rating}</div>
    <div style="width:35%;height:2px;background:${r.a};opacity:.7;margin:calc(${w} * .02) 0"></div>
    <div style="font-weight:700;font-size:calc(${w} * .066);color:#fff;line-height:1.35;flex:1;display:flex;align-items:center">${text || 'Slavný fotbalista, který se zapsal do historie hry.'}</div>
    <div style="font-size:calc(${w} * .036);color:var(--c-mute);line-height:1.3;opacity:.85">${[credit, source].filter(Boolean).join('<br>')}</div></div>`;
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
