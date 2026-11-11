import { h, btn, u, icon } from '../ui/dom.js';
import { getProfile, profileLevel } from '../domain/profiles.js';
import { allDrills, workoutFromSelection, LEVEL_NAMES, TYPE_NAMES, drillType, weakFootOf, tempoFor, MAX_DRILL_LEVEL } from '../domain/trainer.js';
import { patternFor, getMat } from '../config/mats.js';
import { settings } from '../storage/index.js';
import { launch } from '../domain/extras.js';
import { drillDiagram } from '../ui/DrillDiagram.js';

// Výběr cviků ve dvou krocích: 1) dlaždice úrovní (Začátečník … Expert, s doporučením pro hráče),
// 2) cviky jedné úrovně s filtry a šipkami na sousední úrovně. Výběr se drží napříč úrovněmi; dole „Spustit“.
const FILTERS = [
  ['all', 'Vše'], ['ball', 'Míč'], ['jump', 'Přeskoky'], ['step', 'Kroky'], ['left', 'Levá noha'], ['right', 'Pravá noha'],
];
const passes = (d, f) => f === 'all' || (f === 'left' || f === 'right' ? d.foot === f : drillType(d) === f);

export default function drillsScreen({ profileId }, { go, back, onBack }) {
  const el = h('section', 'screen');
  el.style.justifyContent = 'flex-start';
  el.style.gap = u(1.6);
  el.style.padding = `${u(2)} ${u(3)}`;
  const sel = new Set();
  let view = 0;        // 0 = dlaždice úrovní, jinak číslo úrovně
  let filter = 'all';

  const head = h('div', 'w-full flex items-center justify-between');
  const ttl = h('div', 'flex flex-col gap-1');
  const bar = h('div', 'flex items-center gap-4');
  head.append(ttl, bar);
  const body = h('div', 'w-full');
  body.style.cssText = `flex:1;min-height:0;overflow-y:auto;padding:${u(0.6)} ${u(0.6)} ${u(1.5)}`;
  el.append(head, body);

  (async () => {
    const [p, s] = await Promise.all([getProfile(profileId), settings.load()]);
    const mat = getMat(s.matId);
    const weak = weakFootOf(p.hand);
    const recommended = Math.min(MAX_DRILL_LEVEL, Math.ceil(profileLevel(p).level / 2) + 1);
    const levels = [1, 2, 3, 4].filter((lv) => allDrills().some((d) => d.level === lv));
    const byLevel = (lv) => allDrills().filter((d) => d.level === lv);
    const selIn = (lv) => byLevel(lv).filter((d) => sel.has(d.id)).length;

    const backBtn = btn('', 'btn', () => goBack());
    const saveBtn = btn(`${icon('check')}Uložit`, 'btn', async () => {
      if (!sel.size) return;
      const cur = await settings.load(); const list = cur.customWorkouts || [];
      await settings.save({ customWorkouts: [...list, { id: Date.now().toString(36), name: `Můj trénink ${list.length + 1}`, ids: [...sel] }] });
      saveBtn.innerHTML = `${icon('check')}Uloženo`;
    });
    const startBtn = btn('', 'btn-primary', () => {
      if (!sel.size) return;
      launch(go, p, { profile: p, mat, workout: workoutFromSelection([...sel], s.workoutMin), tempoMul: tempoFor(s, profileLevel(p).level) });
    });
    [backBtn, saveBtn, startBtn].forEach((b) => { b.style.minHeight = u(5.4); b.style.minWidth = u(11); b.style.fontSize = u(1.8); b.style.padding = `0 ${u(2.2)}`; });
    bar.append(backBtn, saveBtn, startBtn);
    const refresh = () => {
      startBtn.innerHTML = `${icon('play')}Spustit${sel.size ? ` (${sel.size})` : ''}`;
      startBtn.style.opacity = sel.size ? 1 : 0.45;
      saveBtn.style.opacity = sel.size ? 1 : 0.45;
      saveBtn.innerHTML = `${icon('check')}Uložit`;
      backBtn.innerHTML = `${icon('back')}${view ? 'Úrovně' : 'Zpět'}`;
    };
    function goBack() { if (view) showLevels(); else back(); }
    onBack(goBack);

    const focusFirst = () => (body.querySelector('[data-autofocus]') || body.querySelector('[data-focusable]') || startBtn).focus();

    // ---- krok 1: dlaždice úrovní ----
    function showLevels() {
      view = 0; filter = 'all';
      ttl.replaceChildren(h('div', 'eyebrow', 'Vlastní trénink'), h('div', 'title', 'Vyber <span class="accent">úroveň</span>'));
      ttl.lastChild.style.fontSize = u(3.6);
      body.replaceChildren();
      const row = h('div', '');
      row.style.cssText = `display:grid;grid-template-columns:repeat(${levels.length},minmax(0,1fr));gap:${u(1.6)};height:100%;max-height:${u(46)};align-items:stretch`;
      levels.forEach((lv) => {
        const items = byLevel(lv);
        const t = btn('', 'card', () => showLevel(lv), { auto: lv === recommended });
        t.style.cssText += `;text-align:left;display:flex;flex-direction:column;gap:${u(0.9)};position:relative;padding:${u(1.8)};min-width:0;${lv === recommended ? 'border-color:var(--c-sun);' : ''}`;
        const types = ['ball', 'jump', 'step'].map((k) => [k, items.filter((d) => drillType(d) === k).length]).filter(([, n]) => n).map(([k, n]) => `${TYPE_NAMES[k]} ${n}`).join(' · ');
        const n = selIn(lv);
        t.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div class="eyebrow">Úroveň ${lv}</div>
            <img src="img/art/lv_${lv}.webp" alt="" draggable="false" style="width:${u(6.2)};height:${u(6.2)};object-fit:contain;margin:${u(-0.6)} ${u(-0.4)} ${u(-1.6)} 0;pointer-events:none">
          </div>
          <div style="font-weight:800;font-size:${u(3)};letter-spacing:-0.035em;line-height:1.05">${LEVEL_NAMES[lv]}</div>
          <div style="font-size:${u(1.8)};color:var(--c-sun);letter-spacing:.2em">${'●'.repeat(lv)}<span style="opacity:.3">${'●'.repeat(4 - lv)}</span></div>
          <div style="font-size:${u(1.7)};font-weight:600">${items.length} cviků</div>
          <div style="font-size:${u(1.4)};color:var(--c-mute);line-height:1.35">${types}</div>
          ${lv === recommended ? `<div style="align-self:flex-start;padding:${u(0.25)} ${u(1)};border-radius:99px;background:var(--c-sun);color:var(--on-acc);font-weight:800;font-size:${u(1.2)}">Doporučeno pro tebe</div>` : ''}
          <div class="prev" style="display:flex;gap:${u(0.6)};margin-top:auto"></div>
          <div style="font-size:${u(1.4)};color:${n ? 'var(--c-sun)' : 'var(--c-mute)'};font-weight:600">${n ? `Vybráno ${n}` : 'Nic nevybráno'}</div>`;
        const prev = t.querySelector('.prev');
        items.filter((d) => patternFor(d, mat)).slice(0, 3).forEach((d) => { const w = h('div', ''); w.style.cssText = 'flex:1;min-width:0'; w.append(drillDiagram(d, mat)); prev.append(w); });
        row.append(t);
      });
      body.append(row);
      refresh(); focusFirst();
    }

    // ---- krok 2: cviky jedné úrovně ----
    function showLevel(lv) {
      view = lv;
      ttl.replaceChildren(h('div', 'eyebrow', `Cviky › Úroveň ${lv}`), h('div', 'title', `${LEVEL_NAMES[lv]} <span class="accent">· ${byLevel(lv).length}</span>`));
      ttl.lastChild.style.fontSize = u(3.2);
      body.replaceChildren();

      const top = h('div', 'flex items-center justify-between');
      top.style.cssText += `;gap:${u(2)};margin-bottom:${u(1.4)};flex-wrap:wrap`;
      const chips = h('div', 'flex');
      chips.style.cssText = `gap:${u(0.8)};flex-wrap:wrap`;
      const chipBtns = FILTERS.filter(([k]) => k === 'all' || byLevel(lv).some((d) => passes(d, k))).map(([k, name]) => {
        const c = btn(name, 'btn', () => { filter = k; paintChips(); fillGrid(); });
        c.style.cssText += `;min-height:${u(4.2)};min-width:0;font-size:${u(1.5)};padding:0 ${u(1.6)}`;
        c.dataset.k = k; return c;
      });
      const paintChips = () => chipBtns.forEach((c) => { const on = c.dataset.k === filter; c.style.background = on ? 'var(--c-sun)' : ''; c.style.color = on ? 'var(--on-acc)' : ''; c.style.borderColor = on ? 'var(--c-sun)' : ''; });
      chips.append(...chipBtns);
      const nav = h('div', 'flex');
      nav.style.gap = u(0.8);
      const i = levels.indexOf(lv);
      const mkNav = (target, label) => { const b = btn(label, 'btn', () => { filter = 'all'; showLevel(target); }); b.style.cssText += `;min-height:${u(4.2)};min-width:0;font-size:${u(1.5)};padding:0 ${u(1.6)}`; return b; };
      if (i > 0) nav.append(mkNav(levels[i - 1], `◀ ${LEVEL_NAMES[levels[i - 1]]}`));
      if (i < levels.length - 1) nav.append(mkNav(levels[i + 1], `${LEVEL_NAMES[levels[i + 1]]} ▶`));
      top.append(chips, nav);

      const grid = h('div', '');
      grid.style.cssText = `display:grid;grid-template-columns:repeat(auto-fill,minmax(${u(17)},1fr));gap:${u(1.2)}`;
      body.append(top, grid);

      function fillGrid() {
        grid.replaceChildren();
        let first = true;
        byLevel(lv).filter((d) => passes(d, filter)).forEach((d) => {
          const ok = !!patternFor(d, mat);
          const c = btn('', 'card', () => { if (!ok) return; if (sel.has(d.id)) sel.delete(d.id); else sel.add(d.id); paint(); }, { auto: first && ok });
          if (first && ok) first = false;
          c.style.cssText += `;text-align:left;display:flex;flex-direction:column;gap:${u(.6)};padding:${u(1)};min-width:0;opacity:${ok ? 1 : 0.35}`;
          c.innerHTML = `<div class="eyebrow" style="font-size:${u(1.3)}">${TYPE_NAMES[drillType(d)]}${d.foot === 'left' ? ' · levá' : d.foot === 'right' ? ' · pravá' : ''}${d.foot === weak ? ' · <span style="color:var(--c-sun)">slabší noha</span>' : ''}</div>
            <div style="font-weight:800;font-size:${u(1.7)};letter-spacing:-0.03em;line-height:1.15">${d.name}</div>
            ${d.info ? `<div style="font-size:${u(1.3)};color:var(--c-mute);line-height:1.3">${d.info}</div>` : ''}
            <div style="display:flex;justify-content:flex-end;align-items:center;min-height:${u(2.4)}"><span class="tick"></span></div>`;
          c.prepend(drillDiagram(d, mat));
          const paint = () => {
            const on = sel.has(d.id);
            c.style.background = on ? 'linear-gradient(160deg, rgba(var(--acc-rgb),.28), rgba(var(--acc-rgb),.08))' : '';
            c.style.borderColor = on ? 'var(--c-sun)' : '';
            c.querySelector('.tick').innerHTML = on ? `<span style="color:var(--c-sun);font-size:${u(2.2)}">${icon('check')}</span>` : '';
            refresh();
          };
          paint();
          grid.append(c);
        });
        if (!grid.children.length) grid.append(h('div', 'muted', 'Tady nic není. Zkus jiný filtr.'));
      }
      paintChips(); fillGrid();
      refresh(); focusFirst();
    }

    showLevels();
  })();
  return el;
}
