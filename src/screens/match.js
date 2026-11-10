import { createMatView } from '../ui/MatView.js';
import { h, btn, u, icon, jerseyEl } from '../ui/dom.js';
import { say, sayGroup, sfx, stopVoice, voiceBusy } from '../core/audio.js';
import { getProfile, listProfiles, saveProfile, profileLevel } from '../domain/profiles.js';
import { allDrills, beatMs, tempoFor, drillType } from '../domain/trainer.js';
import { saveRecord, openPack } from '../domain/extras.js';
import { getMat, patternFor } from '../config/mats.js';
import { settings } from '../storage/index.js';
import { drillDiagram } from '../ui/DrillDiagram.js';
import { showCardReveal } from '../ui/CardReveal.js';
import { applyTheme, getTeam } from '../ui/theme.js';

// Zápas: samostatný režim mimo trénink. Kola (5× zóna podle hlasu), Na čas (jeden cvik 30 s, počet opakování = rekord) nebo obojí.
// Hraje jeden hráč, nebo se dva střídají (kamarád). Vyhrává víc bodů.
const ROUNDS = 5; const ROUND_SEC = 8; const TIMED_SEC = 30;
const MODES = [['rounds', 'Kola', 'Trenér zavolá číslo, trefíš ho míčem. Čím rychleji, tím víc bodů.'], ['timed', 'Na čas', 'Jeden cvik 30 sekund. Rodič zadá, kolik opakování se povedlo.'], ['combo', 'Kombinace', 'Nejdřív kola, potom cvik na čas. Body se sčítají.']];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export default function match({ profileId }, { go, back, onBack }) {
  const el = h('section', 'screen');
  el.style.cssText += `;overflow:hidden;gap:${u(1.4)}`;
  let alive = true;
  const timers = [];
  const leave = () => { alive = false; timers.forEach(clearInterval); stopVoice(); back(); };
  onBack(leave);
  const reset = (gap = 1.4) => { timers.splice(0).forEach(clearInterval); el.replaceChildren(); el.style.gap = u(gap); };
  const btnBig = (label, fn, auto = true) => { const b = btn(label, 'btn-primary', fn, { auto }); b.style.minHeight = u(6.4); b.style.fontSize = u(2.4); return b; };
  const awaitBtn = (label, extra) => new Promise((res) => { const b = btnBig(label, () => res(), true); el.append(b); if (extra) extra(); b.focus(); });

  (async () => {
    const me = await getProfile(profileId);
    if (!me) return go('profiles', {}, { replace: true });
    applyTheme(getTeam(me.team));
    const s = await settings.load();
    const mat = getMat(s.matId);
    const others = (await listProfiles()).filter((p) => p.id !== me.id);
    let mode = 'combo'; let friend = null;

    // ---------- nastavení ----------
    const setup = () => {
      reset(1.6);
      el.append(h('div', 'eyebrow', 'Zápas'), h('div', 'title', 'Co si <span class="accent">zahrajeme</span>?'));
      const modeRow = h('div', 'flex'); modeRow.style.gap = u(1.6);
      const modeBtns = MODES.map(([id, name, desc]) => {
        const b = btn('', 'card', () => { mode = id; paint(); });
        b.style.cssText += `;width:${u(27)};padding:${u(1.6)};display:flex;flex-direction:column;gap:${u(0.7)};min-height:${u(15)}`;
        b.innerHTML = `<div style="font-weight:800;font-size:${u(2.6)};letter-spacing:-0.03em">${name}</div><div style="font-size:${u(1.5)};color:var(--c-mute);line-height:1.3">${desc}</div>`;
        modeRow.append(b); return [id, b];
      });
      const who = h('div', 'flex flex-wrap items-center justify-center'); who.style.gap = u(1.2);
      const whoBtns = [[null, 'Hraju sám'], ...others.map((p) => [p, `S kamarádem: ${p.name}`])].map(([p, label]) => {
        const b = btn(label, 'btn', () => { friend = p; paint(); });
        b.style.cssText += `;min-height:${u(5.4)};font-size:${u(1.8)};padding:0 ${u(2.2)}`;
        who.append(b); return [p, b];
      });
      const paint = () => {
        modeBtns.forEach(([id, b]) => { const on = id === mode; b.style.borderColor = on ? 'var(--c-sun)' : ''; b.style.background = on ? 'linear-gradient(160deg,rgba(var(--acc-rgb),.28),rgba(var(--acc-rgb),.06))' : ''; });
        whoBtns.forEach(([p, b]) => { const on = p === friend; b.style.borderColor = on ? 'var(--c-sun)' : ''; b.style.background = on ? 'rgba(var(--acc-rgb),.22)' : ''; });
      };
      paint();
      const play = btnBig(`${icon('play')}Hrát`, () => run(), false);
      const bk = btn(`${icon('back')}Zpět`, 'btn', () => leave()); bk.style.minHeight = u(5.4);
      const bot = h('div', 'flex'); bot.style.gap = u(2); bot.append(bk, play);
      el.append(modeRow, h('div', 'eyebrow', 'Kdo hraje'), who, bot);
      modeBtns[2][1].focus();
    };

    // ---------- jedno kolo: zóna podle hlasu ----------
    const zoneIds = mat.zones.map((z) => z.id).filter((id) => id !== 1);
    const roundsPhase = async (r, mv, hud) => {
      let prev = -1;
      for (let i = 1; i <= ROUNDS && alive; i++) {
        let z; do { z = zoneIds[Math.floor(Math.random() * zoneIds.length)]; } while (z === prev && zoneIds.length > 1);
        prev = z;
        hud.round.textContent = `Kolo ${i} z ${ROUNDS}`;
        mv.reset(); mv.highlight(z, undefined, 220); mv.hint(1, z); say(`zone_${z}`, { kind: 'urgent' });
        const pts = await new Promise((res) => {
          const t0 = performance.now(); let doneRound = false;
          const fin = (v) => { if (doneRound) return; doneRound = true; clearInterval(tm); hud.hit.onclick = null; hud.miss.onclick = null; res(v); };
          const tm = setInterval(() => {
            const k = (performance.now() - t0) / (ROUND_SEC * 1000);
            hud.bar.style.width = `${Math.max(0, 100 - k * 100)}%`;
            if (k >= 1) fin(0);
          }, 80); timers.push(tm);
          hud.hit.onclick = () => { const e = (performance.now() - t0) / 1000; fin(e < 3.5 ? 3 : e < 6 ? 2 : 1); };
          hud.miss.onclick = () => fin(0);
        });
        if (!alive) return;
        r.points += pts; r.rounds += pts > 0 ? 1 : 0;
        hud.score.textContent = `${r.points} b.`;
        hud.say.textContent = pts === 3 ? 'Střela! +3' : pts === 2 ? 'Pěkné! +2' : pts === 1 ? 'Povedlo se! +1' : 'Příště to vyjde';
        hud.say.style.color = pts ? 'var(--c-sun)' : 'var(--c-mute)';
        if (pts) { sfx('success'); if (Math.random() < 0.5) sayGroup('praise', { kind: 'phrase' }); }
        await wait(1500);
        hud.say.textContent = '';
      }
    };

    // ---------- na čas: jeden cvik 30 s ----------
    const timedPhase = async (r, drill, level, hud) => {
      const mv = hud.mv; mv.reset();
      const tempo = tempoFor(s, level);
      const pt = patternFor(drill, mat); const bms = beatMs(drill, tempo);
      hud.round.textContent = `Na čas · ${drill.name}`;
      for (let n = 3; n >= 1 && alive; n--) { hud.say.textContent = String(n); hud.say.style.color = '#fff'; say(`countdown_${n}`, { kind: 'urgent' }); await wait(1000); }
      if (!alive) return;
      hud.say.textContent = 'HRAJ!'; sayGroup('go', { kind: 'urgent' }); setTimeout(() => { if (hud.say.textContent === 'HRAJ!') hud.say.textContent = ''; }, 900);
      await new Promise((res) => {
        const t0 = performance.now(); let b = -1;
        const tm = setInterval(() => {
          const t = performance.now() - t0; const k = t / (TIMED_SEC * 1000);
          hud.bar.style.width = `${Math.max(0, 100 - k * 100)}%`;
          hud.score.textContent = `${Math.max(0, Math.ceil(TIMED_SEC - t / 1000))} s`;
          const nb = Math.floor(t / bms);
          if (nb !== b) { b = nb; const z = pt[b % pt.length]; if (drillType(drill) === 'jump') { const sd = drill.sides || ['left', 'right']; mv.jump(sd[b % sd.length], 200); mv.hintSide(sd[(b + 1) % sd.length]); } else { mv.highlight(z, drill.foot === 'both' ? undefined : drill.foot, 160); mv.hint(z, pt.length > 1 ? pt[(b + 1) % pt.length] : null); } }
          if (k >= 1) { clearInterval(tm); res(); }
        }, 60); timers.push(tm);
      });
      if (!alive) return;
      hud.say.textContent = ''; sfx('success'); mv.reset();
      // rodič zadá počet opakování
      await new Promise((res) => {
        const box = h('div', 'flex flex-col items-center'); box.style.cssText = `position:absolute;inset:0;z-index:5;justify-content:center;gap:${u(1.6)};background:rgba(0,0,0,.85);backdrop-filter:blur(8px)`;
        let n = 0;
        const val = h('div', 'font-extrabold', '0'); val.style.cssText = `font-size:${u(14)};letter-spacing:-0.05em;color:var(--c-sun);line-height:1`;
        const row = h('div', 'flex'); row.style.gap = u(1.2);
        [['−5', -5], ['−1', -1], ['+1', 1], ['+5', 5]].forEach(([t, d], i) => {
          const b = btn(t, 'btn', () => { n = Math.max(0, n + d); val.textContent = String(n); }, { auto: i === 2 });
          b.style.cssText += `;min-width:${u(10)};min-height:${u(7)}`; row.append(b);
        });
        const ok = btnBig(`${icon('check')}Hotovo`, () => { r.count = n; box.remove(); res(); }, false);
        box.append(h('div', 'eyebrow', `${r.p.name} · ${drill.name}`), h('div', 'title', 'Kolik <span class="accent">opakování</span>?'), val, row, ok);
        el.appendChild(box); row.children[2].focus();
      });
    };

    // ---------- HUD (společný pro obě fáze) ----------
    const buildHud = (r, withButtons) => {
      reset(1);
      const top = h('div', 'w-full flex items-center justify-between');
      const left = h('div', 'flex items-center'); left.style.gap = u(1.6);
      left.append(jerseyEl(r.p, 5.4));
      const t = h('div', 'flex flex-col'); const round = h('div', 'eyebrow'); const nm = h('div', '', r.p.name);
      nm.style.cssText = `font-weight:800;font-size:${u(2.8)};letter-spacing:-0.03em`; t.append(round, nm); left.append(t);
      const score = h('div', 'font-extrabold'); score.style.cssText = `font-size:${u(4.4)};letter-spacing:-0.04em;color:var(--c-sun)`;
      top.append(left, score);
      const barWrap = h('div', ''); barWrap.style.cssText = `width:100%;height:${u(1)};background:rgba(255,255,255,.1);border-radius:99px;overflow:hidden`;
      const bar = h('div', ''); bar.style.cssText = 'width:100%;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--c-sun),var(--acc-soft))'; barWrap.append(bar);
      const mid = h('div', 'w-full'); mid.style.cssText = 'flex:1;min-height:0;position:relative';
      const mv = createMatView({ mat }); mv.el.style.cssText = 'width:100%;height:100%'; mid.append(mv.el);
      const sayEl = h('div', ''); sayEl.style.cssText = `position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;font-weight:800;font-size:${u(14)};letter-spacing:-0.05em;color:#fff;text-shadow:0 0 ${u(5)} rgba(var(--acc-rgb),.7),0 ${u(.6)} ${u(3)} rgba(0,0,0,.8)`;
      mid.append(sayEl);
      el.append(top, barWrap, mid);
      const hud = { round, score, bar, say: sayEl, mv };
      if (withButtons) {
        const row = h('div', 'flex'); row.style.gap = u(2);
        hud.hit = btn(`${icon('check')}Trefil`, 'btn-primary', () => {}, { auto: true });
        hud.miss = btn('Minul', 'btn', () => {});
        [hud.hit, hud.miss].forEach((b) => { b.style.minHeight = u(6.2); b.style.minWidth = u(22); b.style.fontSize = u(2.3); });
        row.append(hud.hit, hud.miss); el.append(row); hud.hit.focus();
      }
      return hud;
    };

    // ---------- celý zápas ----------
    const run = async () => {
      const players = [me, ...(friend ? [await getProfile(friend.id)] : [])];
      const results = players.map((p) => ({ p, points: 0, rounds: 0, count: 0, record: false }));
      const level = Math.max(...players.map((p) => profileLevel(p).level));
      let drill = null;
      if (mode !== 'rounds') {
        const pool = allDrills().filter((d) => drillType(d) === 'ball' && d.level <= Math.min(4, Math.ceil(level / 2) + 1) && patternFor(d, mat));
        drill = pool[Math.floor(Math.random() * pool.length)];
      }
      for (const r of results) {
        if (!alive) return;
        if (players.length > 1 || mode !== 'rounds') {
          reset(1.4);
          el.append(h('div', 'eyebrow', players.length > 1 ? 'Na řadě' : 'Připrav se'), jerseyEl(r.p, 12), h('div', 'title', r.p.name));
          if (drill && mode !== 'rounds') { const dd = h('div', 'flex flex-col items-center'); dd.style.cssText = `gap:${u(0.6)};max-width:${u(40)}`; dd.append(h('div', 'muted', `Cvik na čas: ${drill.name}`)); const dg = drillDiagram(drill, mat); dg.style.width = u(34); dd.append(dg); el.append(dd); }
          await awaitBtn(`${icon('play')}Začít`);
        }
        if (!alive) return;
        if (mode !== 'timed') { const hud = buildHud(r, true); await roundsPhase(r, hud.mv, hud); }
        if (!alive) return;
        if (mode !== 'rounds') { const hud = buildHud(r, false); await timedPhase(r, drill, profileLevel(r.p).level, hud); }
      }
      if (!alive) return;
      await finish(results, drill);
    };

    // ---------- výsledek ----------
    const finish = async (results, drill) => {
      for (const r of results) {
        r.score = (mode === 'timed' ? 0 : r.points) + (mode === 'rounds' ? 0 : r.count);
        r.xp = Math.min(60, 8 + r.score);
        r.p.xp = (r.p.xp || 0) + r.xp; r.p.matches = (r.p.matches || 0) + 1;
        if (drill && mode !== 'rounds') r.record = await saveRecord(r.p, drill.id, r.count);
      }
      const best = Math.max(...results.map((r) => r.score));
      const winners = results.filter((r) => r.score === best);
      const winner = results.length > 1 && winners.length === 1 ? winners[0] : null;
      if (winner) winner.p.matchWins = (winner.p.matchWins || 0) + 1;
      for (const r of results) await saveProfile(r.p);
      reset(1.8);
      el.style.overflow = 'hidden';
      sfx('confetti'); sayGroup(winner || results.length === 1 ? 'end' : 'half', { kind: 'phrase' });
      el.append(h('div', 'eyebrow', 'Konec zápasu'),
        h('div', 'title', results.length === 1 ? 'Výborně<span class="accent">!</span>' : winner ? `Vyhrává <span class="accent">${winner.p.name}</span>` : '<span class="accent">Remíza</span>'));
      const row = h('div', 'flex'); row.style.gap = u(3);
      for (const r of results) {
        const c = h('div', 'card flex flex-col items-center'); c.style.cssText += `;cursor:default;gap:${u(0.8)};padding:${u(1.8)} ${u(3)};min-width:${u(24)};${r === winner ? 'border-color:var(--c-sun)' : ''}`;
        c.append(jerseyEl(r.p, 8), h('div', '', r.p.name));
        c.lastChild.style.cssText = `font-weight:800;font-size:${u(2.4)}`;
        const big = h('div', '', String(r.score)); big.style.cssText = `font-weight:800;font-size:${u(7)};line-height:1;letter-spacing:-0.05em;color:var(--c-sun)`;
        c.append(big, h('div', 'muted', mode === 'rounds' ? `${r.rounds} z ${ROUNDS} zásahů` : mode === 'timed' ? `${r.count} opakování` : `${r.points} b. + ${r.count} opak.`), h('div', 'muted', `+${r.xp} XP`));
        if (r.record) { const rc = h('div', '', 'Nový rekord!'); rc.style.cssText = `font-weight:800;font-size:${u(1.7)};color:var(--c-sun)`; c.append(rc); }
        row.append(c);
      }
      const acts = h('div', 'flex'); acts.style.gap = u(2);
      const again = btn(`${icon('play')}Znovu`, 'btn', () => setup());
      const home = btn(`${icon('home')}Domů`, 'btn-primary', () => go('home', { profileId: me.id }, { replace: true }), { auto: true });
      [again, home].forEach((b) => { b.style.minHeight = u(6.2); b.style.fontSize = u(2.2); });
      acts.append(again, home); el.append(row, acts); home.focus();
      // karta pro vítěze (nebo pro hráče, který hrál sám)
      const prize = winner ? winner.p : results.length === 1 ? results[0].p : null;
      if (prize) { const pk = await openPack(prize); setTimeout(() => alive && showCardReveal(el, pk, () => home.focus()), 1600); }
    };

    setup();
  })();
  return el;
}
