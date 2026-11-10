import { h, btn, u, icon } from '../ui/dom.js';
import { getProfile, profileLevel } from '../domain/profiles.js';
import { workoutFromSelection, allDrills, tempoFor } from '../domain/trainer.js';
import { getMat } from '../config/mats.js';
import { settings } from '../storage/index.js';
import { launch } from '../domain/extras.js';
import { applyTheme, getTeam } from '../ui/theme.js';

// Moje tréninky: uložené sestavy cviků (vytvoří se ve „Cviky“ tlačítkem Uložit; smazat jde v Rodiče).
export default function myWorkouts({ profileId }, { go, back }) {
  const el = h('section', 'screen');
  el.style.cssText += `;justify-content:flex-start;gap:${u(2)};overflow-y:auto`;
  (async () => {
    const [p, s] = await Promise.all([getProfile(profileId), settings.load()]);
    if (!p) return go('profiles', {}, { replace: true });
    applyTheme(getTeam(p.team));
    const mat = getMat(s.matId);
    const list = s.customWorkouts || [];
    const head = h('div', 'flex items-center justify-between w-full');
    const ttl = h('div', 'flex flex-col gap-1'); ttl.append(h('div', 'eyebrow', 'Uložené sestavy'), h('div', 'title', 'Moje <span class="accent">tréninky</span>'));
    const bk = btn(`${icon('back')}Zpět`, 'btn-primary', () => back(), { auto: !list.length });
    bk.style.minHeight = u(6); bk.style.fontSize = u(2.1);
    head.append(ttl, bk); el.append(head);
    if (!list.length) {
      const e = h('div', 'muted', 'Zatím nic. Ve „Cviky“ vyber cviky a stiskni Uložit.'); e.style.fontSize = u(2); el.append(e);
      const g = btn(`${icon('grid')}Ke cvikům`, 'btn', () => go('drills', { profileId: p.id })); el.append(g);
    }
    const D = Object.fromEntries(allDrills().map((d) => [d.id, d]));
    const grid = h('div', 'w-full'); grid.style.cssText = `display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:${u(1.6)}`;
    list.forEach((w, i) => {
      const c = btn('', 'card', () => {
        const workout = workoutFromSelection(w.ids, s.workoutMin);
        if (workout.length) launch(go, p, { profile: p, mat, workout, tempoMul: tempoFor(s, profileLevel(p).level) });
      }, { auto: i === 0 });
      c.style.cssText += `;text-align:left;display:flex;flex-direction:column;gap:${u(0.6)};padding:${u(1.6)} ${u(2)}`;
      c.innerHTML = `<div style="font-weight:800;font-size:${u(2.6)};letter-spacing:-0.03em">${w.name}</div>
        <div style="font-size:${u(1.5)};color:var(--c-mute);line-height:1.35">${w.ids.map((id) => D[id] && D[id].name).filter(Boolean).join(' · ')}</div>
        <div style="color:var(--c-sun);font-weight:700;font-size:${u(1.6)}">${w.ids.length} cviků · ${s.workoutMin} min</div>`;
      grid.append(c);
    });
    el.append(grid);
  })();
  return el;
}
