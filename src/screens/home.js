import { h, btn, u, jerseyEl, icon } from '../ui/dom.js';
import { getProfile, listHistory, profileLevel } from '../domain/profiles.js';
import { buildWorkout, tempoFor } from '../domain/trainer.js';
import { settings } from '../storage/index.js';
import { sayGroup } from '../core/audio.js';
import { getMat } from '../config/mats.js';
import { applyTheme, getTeam, teamLogo } from '../ui/theme.js';
import { nextXpReward } from '../domain/rewards.js';
import { weekOf, WEEK_GOAL, challengeOf, challengeDone, completeChallenge, CHALLENGE_XP, launch } from '../domain/extras.js';

// Domů: hráč, hodnost a postup nahoře, jedno velké tlačítko „Trénink“, pod ním tři jednoduché dlaždice.
export default function home({ profileId }, { go }) {
  const el = h('section', 'screen');
  el.style.gap = u(1.4);
  (async () => {
    const p = await getProfile(profileId);
    if (!p) return go('profiles', {}, { replace: true });
    const lv = profileLevel(p);
    const team = getTeam(p.team);
    applyTheme(team);

    // hlavička: dres + jméno + hodnost + postup
    const top = h('div', 'flex items-center gap-6');
    top.append(jerseyEl(p, 11));
    const info = h('div', 'flex flex-col gap-2 items-start');
    const nameRow = h('div', 'flex items-center gap-4');
    nameRow.append(h('div', 'title', p.name));
    if (team) nameRow.append(teamLogo(team, u(5)));
    info.append(h('div', 'eyebrow', `Level ${lv.level} · ${lv.rank}`), nameRow);
    const nx = nextXpReward(p.xp || 0);
    const bar = h('div', '');
    bar.style.cssText = `width:${u(34)};height:${u(1.1)};background:rgba(255,255,255,.1);border-radius:99px;overflow:hidden`;
    bar.innerHTML = `<div style="width:${nx ? Math.round(nx.progress * 100) : 100}%;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--c-sun),var(--acc-soft));box-shadow:0 0 12px rgba(var(--acc-rgb),.55)"></div>`;
    const xpt = h('div', 'muted', nx ? `${p.xp || 0} XP · ${nx.reward.name} za ${nx.remaining} XP` : `${p.xp || 0} XP · všechny odměny za XP máš`);
    xpt.style.fontSize = u(1.7);
    info.append(bar, xpt);
    top.append(info);

    const start = btn(`${icon('play')}Trénink`, 'btn-primary', async () => {
      const s = await settings.load();
      sayGroup('welcome');
      const mat = getMat(s.matId);
      const workout = buildWorkout(s.workoutMin, lv.level, mat, s.difficulty, p.hand || 'right');
      if (workout.length) launch(go, p, { profile: p, mat, workout, tempoMul: tempoFor(s, lv.level) });
    }, { auto: true });
    start.style.cssText += `;font-size:${u(3.6)};min-width:${u(30)};min-height:${u(8.4)}`;

    // tři dlaždice
    const row = h('div', 'flex'); row.style.gap = u(1.6);
    const tile = (ic, label, fn) => {
      const b = btn('', 'card flex flex-col items-center justify-center gap-2', fn);
      b.style.cssText += `;width:${u(11.6)};min-width:0;min-height:0;padding:${u(1)} ${u(0.5)}`;
      b.innerHTML = `<div style="width:${u(5)};height:${u(5)};border-radius:${u(1.3)};display:flex;align-items:center;justify-content:center;font-size:${u(2.7)};color:var(--c-sun);background:linear-gradient(150deg,rgba(var(--acc-rgb),.30),rgba(var(--acc-rgb),.07));border:1px solid rgba(var(--acc-rgb),.38);box-shadow:0 0 ${u(1.6)} rgba(var(--acc-rgb),.18), inset 0 1px 0 rgba(255,255,255,.18)">${icon(ic)}</div><div style="font-weight:600;font-size:${u(1.6)}">${label}</div>`;
      return b;
    };
    row.append(
      tile('grid', 'Cviky', () => go('drills', { profileId: p.id })),
      tile('swords', 'Zápas', () => go('match', { profileId: p.id })),
      tile('list', 'Moje', () => go('myWorkouts', { profileId: p.id })),
      tile('cards', 'Karty', () => go('cards', { profileId: p.id })),
      tile('trophy', 'Odměny', () => go('rewards', { profileId: p.id })),
      tile('levels', 'Úrovně', () => go('levels', { profileId: p.id })),
      tile('profile', 'Profil', () => go('createProfile', { editId: p.id, initial: p, returnTo: 'home' })),
    );

    const hist0 = await listHistory(p.id);
    const week = weekOf(hist0);
    const wk = h('div', 'card'); wk.style.cssText += `;cursor:default;display:flex;align-items:center;gap:${u(0.8)};padding:${u(0.8)} ${u(1.4)};border-radius:var(--r-btn)`;
    const wl = h('div', 'flex flex-col'); wl.style.cssText = `text-align:left;gap:${u(0.3)};min-width:${u(9)}`;
    const nW = week.filter((d) => d.trained).length;
    wl.append(h('div', 'eyebrow', 'Tento týden'), h('div', '', `<span style="color:var(--c-sun);font-weight:800">${nW}</span> z ${WEEK_GOAL} tréninků`));
    wl.lastChild.style.cssText = `font-weight:700;font-size:${u(1.8)}`;
    wk.append(wl);
    week.forEach((d) => { const c = h('div', ''); c.style.cssText = `display:flex;flex-direction:column;align-items:center;gap:${u(0.2)};width:${u(6)};padding:${u(0.4)} 0;border-radius:var(--r-sm);${d.today ? 'border:1px solid var(--c-sun);background:rgba(var(--acc-rgb),.12)' : 'border:1px solid transparent'};${d.future ? 'opacity:.45' : ''}`; c.innerHTML = `<div style="font-size:${u(1.2)};font-weight:700;color:var(--c-mute);letter-spacing:.08em">${d.label}</div><div style="font-size:${u(1.6)};font-weight:700">${d.num}.${d.month}.</div><div style="font-size:${u(2.4)};display:flex;color:${d.trained ? 'var(--c-sun)' : 'rgba(255,255,255,.22)'};${d.trained ? 'filter:drop-shadow(0 0 8px rgba(var(--acc-rgb),.6))' : ''}">${icon(d.trained ? 'star' : 'starO')}</div>`; wk.append(c); });
    const ch = btn('', 'card', async () => { if (!challengeDone(p) && await completeChallenge(p)) { paintCh(); sayGroup('praise', { kind: 'phrase' }); } });
    ch.style.cssText += `;text-align:left;display:flex;flex-direction:column;gap:${u(0.5)};padding:${u(0.9)} ${u(1.4)};border-radius:var(--r-btn);width:${u(30)};min-width:0`;
    const paintCh = () => { const dn = challengeDone(p); ch.style.borderColor = dn ? 'var(--c-sun)' : ''; ch.innerHTML = `<div class="eyebrow" style="color:var(--c-sun)">Výzva dne · ${dn ? 'splněno' : `+${CHALLENGE_XP} XP`}</div><div style="font-weight:700;font-size:${u(1.45)};line-height:1.25">${challengeOf()}</div><div style="font-size:${u(1.3)};color:var(--c-mute)">${dn ? 'Skvělé, zítra bude nová výzva' : 'Až ji splníš, stiskni OK'}</div>`; };
    paintCh();
    const mid2 = h('div', 'flex items-stretch'); mid2.style.gap = u(1.6); mid2.append(wk, ch);

    // poslední trénink (jedna řádka) + přepnutí hráče v rohu
    const last = hist0[0];
    const hist = h('div', 'muted', last
      ? `Naposledy ${new Date(last.date).toLocaleDateString('cs-CZ')} · ${Math.round(last.durationSec / 6) / 10} min · <span style="color:var(--c-sun)">+${last.xp} XP</span>`
      : 'Ještě bez tréninku. Pojďme na první!');
    hist.style.fontSize = u(1.8);

    const sw = btn(`${icon('users')}Hráči`, 'btn', () => go('profiles', {}, { replace: true }));
    sw.style.cssText += `;position:absolute;top:${u(2.6)};left:${u(3)};min-height:${u(5)};min-width:0;font-size:${u(1.8)};padding:0 ${u(2.2)}`;

    el.append(sw, top, start, mid2, row, hist);
    start.focus();
  })();
  return el;
}
