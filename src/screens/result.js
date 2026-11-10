import { h, btn, u, icon, jerseyEl } from '../ui/dom.js';
import { sayGroup, sfx } from '../core/audio.js';
import { XP_PER_DRILL, XP_WORKOUT_BONUS, stars } from '../domain/xp.js';
import { addHistory, listHistory, profileLevel } from '../domain/profiles.js';
import { REWARDS, statsOf, isUnlocked, nextXpReward } from '../domain/rewards.js';
import { rewardIcon } from '../ui/RewardIcon.js';
import { openPack } from '../domain/extras.js';
import { showCardReveal } from '../ui/CardReveal.js';
import { getProfile } from '../domain/profiles.js';

// Výsledek tréninku: hvězdy, XP (počítá se nahoru), postup k další odměně a oslava nově získaných odměn.
// Úroveň (level) se tady nemění, tu nastavuje rodič; hráč sbírá XP a odměny.
export default function result({ profile, workout, done, aborted }, { go }) {
  const el = h('section', 'screen');
  el.style.gap = u(1.1);
  el.style.overflow = 'hidden'; // konfety nesmí vytvářet posun
  const complete = !aborted && done >= workout.length;
  const xp = done * XP_PER_DRILL + (complete ? XP_WORKOUT_BONUS : 0);
  const st = done ? stars(done, workout.length) : 0;
  const durationSec = workout.slice(0, done).reduce((a, d) => a + d.durationSec, 0);
  const xpBefore = profile.xp || 0;
  const xpAfter = xpBefore + xp;
  const lv = profileLevel(profile);

  el.append(h('div', 'eyebrow', aborted ? 'Trénink ukončen' : 'Trénink dokončen'));
  const ttl = h('div', 'title', aborted ? 'Dobrá práce' : 'Výborně<span class="accent">!</span>'); ttl.style.fontSize = u(3.8); el.append(ttl);

  const starRow = h('div', 'flex gap-5');
  for (let i = 1; i <= 3; i++) {
    const on = i <= st;
    const s = h('div', '', icon(on ? 'star' : 'starO'));
    s.style.cssText = `font-size:${u(4.8)};color:${on ? 'var(--c-sun)' : 'rgba(255,255,255,.25)'};` +
      `${on ? 'filter:drop-shadow(0 0 14px rgba(var(--acc-rgb),.6));' : ''}animation:pop .6s ${0.2 + i * 0.22}s backwards`;
    s.firstChild.style.cssText = 'width:1em;height:1em';
    starRow.appendChild(s);
  }

  const xpEl = h('div', '', '+0');
  xpEl.style.cssText = `font-weight:800;font-size:${u(4.8)};letter-spacing:-0.05em;line-height:1;background:linear-gradient(180deg,var(--acc-soft),var(--c-sun));-webkit-background-clip:text;background-clip:text;color:transparent`;
  const unit = h('div', 'eyebrow', `XP · ${done} z ${workout.length} cviků`);

  // karta: dres, hráč a postup k další odměně
  const card = h('div', 'card flex items-center');
  card.style.cssText += `;cursor:default;gap:${u(2.4)};padding:${u(1.2)} ${u(3)};text-align:left`;
  card.append(jerseyEl(profile, 7.2));
  const box = h('div', 'flex flex-col');
  box.style.gap = u(0.7);
  box.append(h('div', 'eyebrow', `${profile.name} · level ${lv.level} · ${lv.rank}`));
  const nextName = h('div', '', ''); nextName.style.cssText = `font-weight:800;font-size:${u(2.2)};letter-spacing:-0.03em`;
  const bar = h('div', '');
  bar.style.cssText = `width:${u(36)};height:${u(1.2)};background:rgba(255,255,255,.1);border-radius:99px;overflow:hidden`;
  const fill = h('div', '');
  fill.style.cssText = 'width:0%;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--c-sun),var(--acc-soft));box-shadow:0 0 12px rgba(var(--acc-rgb),.55)';
  bar.append(fill);
  const remain = h('div', 'muted', ''); remain.style.fontSize = u(1.5);
  box.append(nextName, bar, remain);
  card.append(box);

  // nové odměny (rezervované místo, ať se rozvržení nehýbe)
  const gained = h('div', 'flex items-center justify-center');
  gained.style.cssText = `gap:${u(2)};min-height:${u(6.4)}`;

  const home = btn(`${icon('home')}Domů`, 'btn-primary', () => go('home', { profileId: profile.id }, { replace: true }), { auto: true });
  home.style.minHeight = u(6); home.style.fontSize = u(2.3);
  el.append(starRow, xpEl, unit, card, gained, home);

  // XP se počítá nahoru
  const t0 = performance.now(); const dur = 1100;
  const tick = (now) => {
    const k = Math.min(1, (now - t0) / dur);
    xpEl.innerHTML = `+${Math.round(xp * (1 - Math.pow(1 - k, 3)))}`;
    if (k < 1) requestAnimationFrame(tick);
  };
  setTimeout(() => requestAnimationFrame(tick), 500);

  const paintNext = (xpVal, animate) => {
    const nx = nextXpReward(xpVal);
    if (!nx) { nextName.textContent = 'Všechny odměny za XP máš!'; remain.textContent = `${xpVal} XP celkem`; fill.style.width = '100%'; return; }
    nextName.textContent = `Další: ${nx.reward.name}`;
    remain.textContent = `${xpVal} XP · ještě ${nx.remaining} XP`;
    fill.style.transition = animate ? 'width .9s cubic-bezier(.3,.7,.2,1)' : 'none';
    fill.style.width = `${Math.round(nx.progress * 100)}%`;
  };
  paintNext(xpBefore, false);

  (async () => {
    const hist = await listHistory(profile.id);
    const hand = profile.hand || 'right';
    const stBefore = statsOf(hist, hand, profile);
    const entry = { date: Date.now(), durationSec, xp, drills: workout.slice(0, done).map((d) => d.id), stars: st };
    const stAfter = done > 0 ? statsOf([entry, ...hist], hand, profile) : stBefore; // nové statistiky včetně právě dokončeného tréninku
    const fresh = REWARDS.filter((r) => !isUnlocked(r, xpBefore, stBefore) && isUnlocked(r, xpAfter, stAfter));
    const nxBefore = nextXpReward(xpBefore); const nxAfter = nextXpReward(xpAfter);
    const crossed = nxBefore && (!nxAfter || nxAfter.reward.id !== nxBefore.reward.id);

    if (done > 0) await addHistory(profile.id, { durationSec, xp, drills: workout.slice(0, done).map((d) => d.id), stars: st });

    // postup k další odměně: při překročení se lišta doplní a pokračuje na další odměnu
    setTimeout(() => {
      if (!crossed) { paintNext(xpAfter, true); return; }
      fill.style.transition = 'width .8s cubic-bezier(.3,.7,.2,1)'; fill.style.width = '100%';
      setTimeout(() => { paintNext(xpAfter, false); fill.style.width = '0%'; }, 1000);
      setTimeout(() => { fill.style.transition = 'width .8s cubic-bezier(.3,.7,.2,1)'; const nx = nextXpReward(xpAfter); fill.style.width = nx ? `${Math.round(nx.progress * 100)}%` : '100%'; }, 1080);
    }, 900);

    // balíček karet za dokončený trénink (otevře se po oslavě odměn)
    if (done > 0) {
      const fresh2 = await getProfile(profile.id);
      const pk = await openPack(fresh2);
      setTimeout(() => { if (el.isConnected) showCardReveal(el, pk, () => home.focus()); }, fresh.length ? 5200 : 3400);
    }

    // oslava nových odměn
    if (fresh.length) {
      setTimeout(() => {
        sfx('levelup'); sayGroup('reward');
        fresh.slice(0, 3).forEach((r, i) => {
          const item = h('div', 'flex items-center'); item.style.cssText = `gap:${u(1)};animation:pop .7s ${i * 0.25}s backwards`;
          item.append(rewardIcon(r, u(6)));
          const t = h('div', ''); t.style.cssText = 'display:flex;flex-direction:column;text-align:left';
          const a = h('div', 'eyebrow', 'Nová odměna'); a.style.color = 'var(--c-sun)'; a.style.fontSize = u(1.2);
          const b = h('div', '', r.name); b.style.cssText = `font-weight:800;font-size:${u(2)};letter-spacing:-0.02em`;
          t.append(a, b); item.append(t); gained.append(item);
        });
        if (card.animate) card.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.04)' }, { transform: 'scale(1)' }], { duration: 600, easing: 'ease-out' });
      }, 2100);
    }
  })();

  if (st > 0) {
    sfx('confetti'); sayGroup(complete ? 'end' : 'aborted');
    for (let i = 0; i < 40; i++) {
      const c = h('div');
      const col = ['var(--c-sun)', 'var(--acc-soft)', 'var(--acc-deep)', '#fff', '#fff'][i % 5];
      c.style.cssText = `position:absolute;top:-5%;left:${Math.random() * 100}%;width:${u(0.7)};height:${u(1.5)};background:${col};opacity:.85;border-radius:2px;` +
        `animation:fall ${2.8 + Math.random() * 2.5}s ${Math.random() * 1.5}s linear infinite;pointer-events:none`;
      el.appendChild(c);
    }
  }
  return el;
}
