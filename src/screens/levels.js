import { h, btn, u, icon } from '../ui/dom.js';
import { getProfile, profileLevel } from '../domain/profiles.js';
import { RANKS, MAX_LEVEL, xpForLevel } from '../domain/xp.js';
import { applyTheme, getTeam } from '../ui/theme.js';

// Cesta: všech 12 úrovní jako trasa. Dosažené svítí barvou týmu, aktuální je zvýrazněná, další jsou ztlumené.
// Každá buňka má stejné rozvržení (štítek, kolečko, hodnost, XP, lišta), takže jsou kolečka na jedné ose.
export default function levels({ profileId }, { go, back }) {
  const el = h('section', 'screen');
  el.style.gap = u(1.3);
  (async () => {
    const p = await getProfile(profileId);
    if (!p) return go('profiles', {}, { replace: true });
    applyTheme(getTeam(p.team));
    const lv = profileLevel(p);
    const ttl = h('div', 'title', `${lv.rank} <span class="accent">· level ${lv.level}</span>`); ttl.style.fontSize = u(3.4);
    el.append(h('div', 'eyebrow', `Tvoje cesta · úroveň nastavuje rodič`), ttl);

    const grid = h('div', '');
    grid.style.cssText = `display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:${u(1.1)} ${u(1)};width:min(88vw,${u(96)});align-items:start`;
    for (let n = 1; n <= MAX_LEVEL; n++) {
      const reached = n < lv.level;
      const current = n === lv.level;
      const cell = h('div', 'flex flex-col items-center');
      cell.style.cssText = `gap:${u(0.7)};text-align:center;min-width:0`;

      const tag = h('div', 'eyebrow', 'Jsi tady');
      tag.style.cssText = `color:var(--c-sun);height:${u(1.8)};visibility:${current ? 'visible' : 'hidden'}`;

      const slot = h('div', 'flex items-center justify-center'); // pevná výška, kolečko je vždy uprostřed
      slot.style.cssText = `height:${u(7.6)};width:100%`;
      const sz = current ? 7.4 : 5.8;
      const node = h('div', '');
      node.style.cssText = `width:${u(sz)};height:${u(sz)};border-radius:var(--r-btn);display:flex;align-items:center;justify-content:center;` +
        `font-weight:800;font-size:${u(sz * 0.42)};letter-spacing:-0.04em;` + (current
          ? 'background:linear-gradient(160deg,var(--acc-soft),var(--c-sun));color:var(--on-acc);box-shadow:0 0 0 .5vmin #fff,0 0 4vmin rgba(var(--acc-rgb),.6)'
          : reached
            ? 'background:rgba(var(--acc-rgb),.22);color:var(--c-sun);border:2px solid var(--c-sun)'
            : 'background:rgba(255,255,255,.05);color:rgba(255,255,255,.35);border:2px dashed rgba(255,255,255,.18)');
      node.innerHTML = reached ? icon('check').replace('class="icon"', `class="icon" style="width:${u(sz * .5)};height:${u(sz * .5)}"`) : String(n);
      slot.append(node);

      const rank = h('div', '', RANKS[n - 1]);
      rank.style.cssText = `font-weight:${current ? 800 : 600};font-size:${u(1.7)};line-height:1.15;color:${current ? '#fff' : reached ? 'var(--c-chalk)' : 'var(--c-mute)'};letter-spacing:-0.02em;height:${u(2)}`;
      const xp = h('div', 'muted', n === 1 ? 'start' : `${xpForLevel(n)} XP`);
      xp.style.cssText = `font-size:${u(1.35)};height:${u(1.6)}`;

      const bar = h('div', '');
      bar.style.cssText = `width:${u(8)};height:${u(0.7)};background:rgba(255,255,255,.12);border-radius:99px;overflow:hidden;visibility:hidden`;
      bar.innerHTML = `<div style="width:${Math.round(lv.progress * 100)}%;height:100%;background:var(--c-sun)"></div>`;

      cell.append(tag, slot, rank, xp, bar);
      grid.append(cell);
    }
    const actions = h('div', 'flex gap-5');
    const bk = btn(`${icon('back')}Zpět`, 'btn-primary', () => back(), { auto: true }); bk.style.minHeight = u(6); bk.style.fontSize = u(2.2); actions.append(bk);
    el.append(grid, actions);
    el.querySelector('[data-autofocus]').focus();
  })();
  return el;
}
