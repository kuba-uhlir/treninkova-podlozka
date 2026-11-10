import { h, btn, u, icon } from './dom.js';
import { flipCardEl } from './CardView.js';
import { RARITY, factOf, bioOf, bioSource } from '../domain/extras.js';
import { sfx } from '../core/audio.js';

/** Odhalení získané karty přes celou obrazovku (otočení karty, záře podle vzácnosti). Po „Super“ se zavolá onDone. */
export function showCardReveal(parent, { card, isNew, count = 1 }, onDone) {
  const r = RARITY[card.rarity];
  const ov = h('div', '');
  ov.style.cssText = `position:absolute;inset:0;z-index:30;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${u(1.6)};` +
    `background:radial-gradient(circle at 50% 45%,${r.a}33,rgba(0,0,0,.94) 65%);backdrop-filter:blur(8px);animation:screen-in .4s ease backwards`;
  const eyebrow = h('div', 'eyebrow', isNew ? 'Nová karta!' : `Už ji máš · ×${count}`);
  eyebrow.style.color = r.a; eyebrow.style.fontSize = u(2);
  const wrap = h('div', '');
  wrap.style.cssText = 'perspective:' + u(90);
  const c = flipCardEl(card, u(21), { text: factOf(card) });
  c.style.animation = 'cardflip 1s cubic-bezier(.2,.8,.2,1) backwards';
  wrap.append(c);
  const ok = btn(`${icon('check')}Super`, 'btn-primary', () => { ov.remove(); onDone && onDone(); }, { auto: true });
  ok.style.minHeight = u(6); ok.style.fontSize = u(2.2);
  const bio = h('div', '', bioOf(card)); bio.style.cssText = `font-size:${u(1.55)};line-height:1.45;color:#fff;max-width:${u(40)};text-align:left`;
  const src = h('div', 'muted', bioSource(card)); src.style.fontSize = u(1.1);
  const tip = h('div', 'eyebrow', 'Klepni na kartu a otoč ji'); tip.style.fontSize = u(1.3);
  const side = h('div', 'flex flex-col'); side.style.cssText = `gap:${u(1)};max-width:${u(40)};align-items:flex-start`;
  side.append(h('div', 'title', card.name), bio, src, tip, ok);
  side.firstChild.style.fontSize = u(3.2);
  const row = h('div', 'flex items-center'); row.style.gap = u(4); row.append(wrap, side);
  ov.append(eyebrow, row);
  parent.appendChild(ov);
  sfx('levelup');
  ok.focus();
  return ov;
}
