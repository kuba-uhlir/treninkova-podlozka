import { h, btn, u, icon } from '../ui/dom.js';
import { getProfile, profileLevel } from '../domain/profiles.js';
import { allDrills, workoutFromSelection, LEVEL_NAMES, TYPE_NAMES, drillType, weakFootOf, tempoFor } from '../domain/trainer.js';
import { patternFor, getMat } from '../config/mats.js';
import { settings } from '../storage/index.js';
import { launch } from '../domain/extras.js';
import { drillDiagram } from '../ui/DrillDiagram.js';

// Výběr cviků: karty od nejlehčích po nejtěžší; OK na kartě přepíná výběr, dole „Spustit“.
export default function drillsScreen({ profileId }, { go, back }) {
  const el = h('section', 'screen');
  el.style.justifyContent = 'flex-start';
  el.style.gap = u(2);
  const sel = new Set();

  const head = h('div', 'w-full flex items-center justify-between');
  const ttl = h('div', 'flex flex-col gap-1');
  ttl.append(h('div', 'eyebrow', 'Vlastní trénink'), h('div', 'title', 'Vyber <span class="accent">cviky</span>'));
  const bar = h('div', 'flex items-center gap-4');
  head.append(ttl, bar);

  const list = h('div', 'w-full');
  list.style.cssText = `flex:1;min-height:0;overflow-y:auto;padding:${u(1)} ${u(1.5)} ${u(2)};display:flex;flex-direction:column;gap:${u(2.5)}`;

  el.append(head, list);

  (async () => {
    const [p, s] = await Promise.all([getProfile(profileId), settings.load()]);
    const mat = getMat(s.matId);
    const weak = weakFootOf(p.hand);
    const startBtn = btn('', 'btn-primary', async () => {
      if (!sel.size) return;
      const workout = workoutFromSelection([...sel], s.workoutMin);
      launch(go, p, { profile: p, mat, workout, tempoMul: tempoFor(s, profileLevel(p).level) });
    });
    const refresh = () => {
      startBtn.innerHTML = `${icon('play')}Spustit${sel.size ? ` (${sel.size})` : ''}`;
      startBtn.style.opacity = sel.size ? 1 : 0.45;
    };
    refresh();
    const saveBtn = btn(`${icon('check')}Uložit`, 'btn', async () => {
      if (!sel.size) return;
      const cur = await settings.load(); const list = cur.customWorkouts || [];
      await settings.save({ customWorkouts: [...list, { id: Date.now().toString(36), name: `Můj trénink ${list.length + 1}`, ids: [...sel] }] });
      saveBtn.innerHTML = `${icon('check')}Uloženo`;
    });
    bar.append(btn(`${icon('back')}Zpět`, 'btn', () => back()), saveBtn, startBtn);

    let first = true;
    [1, 2, 3, 4].forEach((lv) => {
      const items = allDrills().filter((d) => d.level === lv);
      if (!items.length) return;
      const sec = h('div', 'flex flex-col gap-3');
      sec.append(h('div', 'eyebrow', `${LEVEL_NAMES[lv]} · úroveň ${lv}`));
      // pás karet: vždy 5 viditelných vedle sebe, ostatní se dosouvají doleva/doprava; mezi úrovněmi se chodí nahoru/dolů
      const grid = h('div', 'rail');
      grid.style.cssText = `display:flex;gap:${u(1.2)};overflow-x:auto;overflow-y:hidden;padding:${u(1)} ${u(0.5)} ${u(1.2)};scroll-snap-type:x proximity;scroll-padding:0 ${u(1)}`;
      items.forEach((d) => {
        const ok = !!patternFor(d, mat);
        const c = btn('', 'card', () => {
          if (!ok) return;
          if (sel.has(d.id)) sel.delete(d.id); else sel.add(d.id);
          paint();
        }, { auto: first && ok });
        if (first && ok) first = false;
        c.style.cssText += `;text-align:left;display:flex;flex-direction:column;gap:${u(.6)};padding:${u(1)};flex:0 0 calc((100% - ${u(4.8)}) / 5);min-width:0;scroll-snap-align:start;opacity:${ok ? 1 : 0.35}`;
        const dots = '●'.repeat(d.level) + '○'.repeat(4 - d.level);
        c.innerHTML = `<div class="eyebrow">${TYPE_NAMES[drillType(d)]}${d.foot === 'left' ? ' · levá' : d.foot === 'right' ? ' · pravá' : ''}${d.foot === weak ? ' · <span style="color:var(--c-sun)">slabší noha</span>' : ''}</div>
          <div style="font-weight:800;font-size:${u(1.8)};letter-spacing:-0.03em;line-height:1.15">${d.name}</div>
          ${d.info ? `<div style="font-size:${u(1.2)};color:var(--c-mute);line-height:1.3">${d.info}</div>` : ''}
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:${u(1.5)};color:var(--c-mute)"><span>${dots}</span><span class="tick"></span></div>`;
        c.prepend(drillDiagram(d, mat));
        const paint = () => {
          const on = sel.has(d.id);
          c.style.background = on ? 'linear-gradient(160deg, rgba(var(--acc-rgb),.28), rgba(var(--acc-rgb),.08))' : '';
          c.style.borderColor = on ? 'var(--c-sun)' : '';
          c.querySelector('.tick').innerHTML = on ? `<span style="color:var(--c-sun);font-size:${u(2.2)}">${icon('check')}</span>` : '';
          refresh();
        };
        grid.append(c);
      });
      sec.append(grid);
      list.append(sec);
    });
    (el.querySelector('[data-autofocus]') || startBtn).focus();
  })();
  return el;
}
