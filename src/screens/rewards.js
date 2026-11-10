import { h, btn, u, icon } from '../ui/dom.js';
import { getProfile, listHistory } from '../domain/profiles.js';
import { REWARDS, CATEGORIES, UNIT_LABEL, statsOf, isUnlocked, rewardProgress, nextXpReward } from '../domain/rewards.js';
import { rewardIcon } from '../ui/RewardIcon.js';
import { applyTheme, getTeam } from '../ui/theme.js';

// Vitrína odměn po sekcích (za XP, tréninky, pravidelnost, dovednosti). Dlaždice jdou projet šipkami, obrazovka se posouvá.
// Získané svítí, ostatní jsou ztlumené a ukazují, kolik chybí.
export default function rewards({ profileId }, { go, back }) {
  const el = h('section', 'screen');
  el.style.cssText += `;justify-content:flex-start;overflow-y:auto;gap:${u(1.4)}`;
  (async () => {
    const p = await getProfile(profileId);
    if (!p) return go('profiles', {}, { replace: true });
    applyTheme(getTeam(p.team));
    const st = statsOf(await listHistory(p.id), p.hand || 'right', p);
    let onlyOwn = false; try { onlyOwn = localStorage.getItem('rewardsOwnOnly') === '1'; } catch (e) { /* bez úložiště */ }
    const xp = p.xp || 0;
    const got = REWARDS.filter((r) => isUnlocked(r, xp, st)).length;

    // záhlaví: nadpis vlevo, Zpět vpravo
    const head = h('div', 'flex items-center justify-between w-full');
    const ttlBox = h('div', 'flex flex-col gap-1');
    const ttl = h('div', 'title', `Odměny <span class="accent">${got} z ${REWARDS.length}</span>`); ttl.style.fontSize = u(3.4);
    ttlBox.append(h('div', 'eyebrow', `Vitrína · ${xp} XP · ${st.trainings} tréninků`), ttl);
    const bk = btn(`${icon('back')}Zpět`, 'btn-primary', () => back(), { auto: true });
    bk.style.minHeight = u(6); bk.style.fontSize = u(2.1);
    const filt = btn('', 'btn', () => { onlyOwn = !onlyOwn; try { localStorage.setItem('rewardsOwnOnly', onlyOwn ? '1' : '0'); } catch (e) { /* bez úložiště */ } paintFilter(); drawAll(); });
    filt.style.minHeight = u(6); filt.style.fontSize = u(1.9);
    const paintFilter = () => { filt.innerHTML = onlyOwn ? `${icon('grid')}Zobrazit všechny` : `${icon('check')}Jen získané`; };
    paintFilter();
    const acts = h('div', 'flex'); acts.style.gap = u(1.4); acts.append(filt, bk);
    head.append(ttlBox, acts);
    el.append(head);

    const nx = nextXpReward(xp);
    if (nx) {
      const box = h('div', 'flex items-center w-full'); box.style.gap = u(1.4);
      const lab = h('div', 'muted', `Další za XP: ${nx.reward.name}`); lab.style.cssText = `font-size:${u(1.6)};white-space:nowrap`;
      const bar = h('div', ''); bar.style.cssText = `flex:1;height:${u(1)};background:rgba(255,255,255,.1);border-radius:99px;overflow:hidden`;
      bar.innerHTML = `<div style="width:${Math.round(nx.progress * 100)}%;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--c-sun),var(--acc-soft));box-shadow:0 0 12px rgba(var(--acc-rgb),.5)"></div>`;
      const rem = h('div', 'muted', `ještě ${nx.remaining} XP`); rem.style.cssText = `font-size:${u(1.6)};white-space:nowrap`;
      box.append(lab, bar, rem); el.append(box);
    }

    const body = h('div', 'flex flex-col w-full'); body.style.gap = u(1.4); el.append(body);
    const drawAll = () => {
    body.replaceChildren();
    for (const cat of CATEGORIES) {
      const all = REWARDS.filter((r) => r.cat === cat.id);
      const list = onlyOwn ? all.filter((r) => isUnlocked(r, xp, st)) : all;
      if (!list.length) continue;
      const done = all.filter((r) => isUnlocked(r, xp, st)).length;
      const sec = h('div', 'flex flex-col w-full'); sec.style.gap = u(0.9);
      const lab = h('div', 'eyebrow', `${cat.name} · ${done} z ${all.length}`);
      const grid = h('div', '');
      grid.style.cssText = `display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:${u(0.9)}`;
      for (const r of list) {
        const on = isUnlocked(r, xp, st);
        const tile = btn('', 'card', () => {});
        tile.style.cssText += `;display:flex;flex-direction:column;align-items:center;text-align:center;gap:${u(0.4)};padding:${u(0.9)} ${u(0.5)} ${u(0.8)};min-width:0;cursor:default;` +
          `border-radius:var(--r-btn);border:1px solid ${on ? 'rgba(var(--acc-rgb),.55)' : 'var(--line)'};background:${on ? 'linear-gradient(160deg,rgba(var(--acc-rgb),.16),rgba(255,255,255,.03))' : 'rgba(255,255,255,.025)'}`;
        tile.append(rewardIcon(r, u(7), { locked: !on }));
        const nm = h('div', '', r.name);
        nm.style.cssText = `font-weight:800;font-size:${u(1.3)};line-height:1.15;letter-spacing:-0.02em;min-height:${u(3)};display:flex;align-items:center;color:${on ? '#fff' : 'var(--c-mute)'}`;
        const pr = rewardProgress(r, xp, st);
        const sub = h('div', 'muted', on ? 'Získáno' : (UNIT_LABEL[r.unit] ? `${Math.min(pr.value, pr.need)} / ${pr.need} ${UNIT_LABEL[r.unit]}` : r.desc));
        sub.style.cssText = `font-size:${u(1.1)};font-weight:600;line-height:1.2;${on ? 'color:var(--c-sun)' : ''}`;
        tile.append(nm, sub); grid.append(tile);
      }
      sec.append(lab, grid); body.append(sec);
    }
    if (!body.children.length) body.append(h('div', 'muted', 'Zatím žádná odměna. Dokonči trénink!'));
    };
    drawAll();
    bk.focus();
  })();
  return el;
}
