import { h, btn, u, jerseyEl, icon, KIT_STYLES } from '../ui/dom.js';
import { createProfile, COLORS } from '../domain/profiles.js';
import { applyTheme, getTeam, listTeams, teamLogo } from '../ui/theme.js';
import { sfx } from '../core/audio.js';

// Průvodce vytvořením hráče: jméno → číslo dresu → silnější noha → klub nebo vlastní dres (vzor, barvy) → shrnutí.
// Vlevo je stále živý náhled dresu, vpravo vždy jen jeden krok a dole Zpět / Další.
const LETTERS = 'AÁBCČDĎEÉĚFGHIÍJKLMNŇOÓPQRŘSŠTŤUÚŮVWXYÝZŽ'.split('');

export default function newPlayer(_p, { go, back, onBack }) {
  applyTheme(null);
  const state = { name: '', jersey: '', hand: 'right', team: null, mode: null, avatar: 0, color: COLORS[2], color2: '#FFFFFF' };
  let step = 0;
  const stepsFor = () => (state.team || state.mode === 'club' ? ['name', 'number', 'hand', 'club', 'done'] : ['name', 'number', 'hand', 'club', 'kit', 'colors', 'done']);
  const TITLES = { name: 'Jak se jmenuješ?', number: 'Jaké máš číslo dresu?', hand: 'Kterou nohou kopeš lépe?', club: 'Máš oblíbený klub?', kit: 'Vyber si střih dresu', colors: 'Vyber barvy dresu', done: 'Hotovo, můžeme trénovat!' };

  const el = h('section', 'screen');
  el.style.cssText += `;justify-content:space-between;gap:${u(1.2)};padding:${u(2)} ${u(3)} ${u(1.8)}`;

  // záhlaví s kroky
  const head = h('div', 'flex flex-col items-center w-full'); head.style.gap = u(0.7);
  const eyebrow = h('div', 'eyebrow');
  const title = h('div', 'title'); title.style.fontSize = u(3.6);
  const dots = h('div', 'flex'); dots.style.gap = u(0.7);
  head.append(eyebrow, title, dots);

  // tělo: náhled dresu vlevo, krok vpravo
  const body = h('div', 'flex flex-1 items-center justify-center w-full'); body.style.cssText += `;gap:${u(5)};min-height:0`;
  const left = h('div', 'flex flex-col items-center'); left.style.cssText = `gap:${u(0.8)};width:${u(24)};flex:none`;
  const prev = h('div', '');
  const prevName = h('div', ''); prevName.style.cssText = `font-weight:800;font-size:${u(2.6)};letter-spacing:-0.03em;min-height:${u(3.2)}`;
  const prevTeam = h('div', 'flex items-center'); prevTeam.style.cssText = `gap:${u(0.8)};min-height:${u(4)}`;
  left.append(prev, prevName, prevTeam);
  const panel = h('div', 'flex flex-col items-center'); panel.style.cssText = `gap:${u(1)};width:${u(62)};min-width:0`;
  body.append(left, panel);

  // dolní lišta
  const nav = h('div', 'flex w-full justify-center'); nav.style.gap = u(3);
  const backBtn = btn(`${icon('back')}Zpět`, 'btn', () => prevStep());
  const nextBtn = btn('', 'btn-primary', () => nextStep());
  [backBtn, nextBtn].forEach((b) => { b.style.minHeight = u(6); b.style.fontSize = u(2.2); });
  nav.append(backBtn, nextBtn);
  el.append(head, body, nav);

  const drawPrev = () => {
    prev.replaceChildren(jerseyEl({ ...state, name: state.name || '' }, 17));
    prevName.textContent = state.name || '';
    prevTeam.replaceChildren();
    const t = getTeam(state.team);
    if (t) { prevTeam.append(teamLogo(t, u(3.6))); const s = h('span', 'muted', t.name); s.style.fontSize = u(1.7); prevTeam.append(s); }
  };
  const steps = () => stepsFor();
  const canNext = () => (steps()[step] === 'name' ? state.name.trim().length > 0 : steps()[step] !== 'club' || state.mode !== null);

  function nextStep() {
    const id = steps()[step];
    if (id === 'done') { finish(); return; }
    if (!canNext()) return;
    step = Math.min(step + 1, steps().length - 1); render();
  }
  function prevStep() { if (step === 0) { back(); return; } step -= 1; render(); }
  async function finish() {
    nextBtn.disabled = true;
    const p = await createProfile({ name: state.name.trim() || 'Hráč', jersey: state.jersey, hand: state.hand, team: state.team, avatar: state.avatar, color: state.color, color2: state.color2 });
    sfx('success');
    go('home', { profileId: p.id }, { replace: true });
  }

  // ---- kroky ----
  const stepName = () => {
    const field = h('div', ''); field.style.cssText = `min-width:${u(34)};text-align:center;font-weight:800;font-size:${u(4)};letter-spacing:-0.03em;border-bottom:3px solid var(--c-sun);padding:${u(0.2)} ${u(2)};min-height:${u(5.6)}`;
    const paint = () => { field.textContent = state.name || ' '; field.style.opacity = state.name ? 1 : 0.4; if (!state.name) field.textContent = 'jméno'; drawPrev(); nextBtn.style.opacity = canNext() ? 1 : 0.45; };
    const add = (c) => {
      if (state.name.length >= 14) return;
      const lower = !state.name || state.name.endsWith(' ') ? c : c.toLowerCase();
      state.name += lower; paint();
    };
    const grid = h('div', ''); grid.style.cssText = `display:grid;grid-template-columns:repeat(11,${u(4.6)});gap:${u(0.6)};justify-content:center`;
    LETTERS.forEach((c, i) => { const b = btn(c, 'btn', () => add(c), { auto: i === 0 }); b.style.cssText += `;min-width:0;min-height:${u(4.4)};padding:0;font-size:${u(2)};border-radius:var(--r-sm)`; grid.append(b); });
    const row = h('div', 'flex'); row.style.gap = u(1);
    const sp = btn('mezera', 'btn', () => { if (state.name && !state.name.endsWith(' ') && state.name.length < 14) { state.name += ' '; paint(); } });
    const del = btn('⌫ smazat', 'btn', () => { state.name = state.name.slice(0, -1); paint(); });
    [sp, del].forEach((b) => { b.style.cssText += `;min-height:${u(4.4)};min-width:${u(16)};font-size:${u(1.8)};border-radius:var(--r-sm)`; row.append(b); });
    panel.append(field, grid, row);
    // fyzická klávesnice funguje také
    const onKey = (e) => {
      if (!el.isConnected || steps()[step] !== 'name') { window.removeEventListener('keydown', onKey); return; }
      if (e.key === 'Backspace') { state.name = state.name.slice(0, -1); paint(); e.preventDefault(); }
      else if (e.key.length === 1 && /\p{L}/u.test(e.key)) { add(e.key.toLocaleUpperCase('cs')); e.preventDefault(); }
      else if (e.key === ' ' && document.activeElement && document.activeElement.tagName !== 'BUTTON') { sp.click(); e.preventDefault(); }
    };
    window.addEventListener('keydown', onKey);
    paint();
  };

  const stepNumber = () => {
    const big = h('div', ''); big.style.cssText = `font-weight:800;font-size:${u(9)};letter-spacing:-0.05em;line-height:1;min-height:${u(9.5)};color:var(--c-sun)`;
    const paint = () => { big.textContent = state.jersey || '—'; drawPrev(); };
    const grid = h('div', ''); grid.style.cssText = `display:grid;grid-template-columns:repeat(3,${u(8)});gap:${u(1)}`;
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'bez'].forEach((d, i) => {
      const label = d === 'bez' ? 'bez čísla' : d;
      const b = btn(label, 'btn', () => {
        if (d === '⌫') state.jersey = state.jersey.slice(0, -1);
        else if (d === 'bez') state.jersey = '';
        else if (state.jersey.length < 2) state.jersey = (state.jersey + d).replace(/^0+(?=\d)/, '');
        paint();
      }, { auto: i === 4 });
      b.style.cssText += `;min-width:0;min-height:${u(5.4)};padding:0;font-size:${d === 'bez' ? u(1.5) : u(2.6)};border-radius:var(--r-btn)`;
      grid.append(b);
    });
    panel.append(big, grid); paint();
  };

  const stepHand = () => {
    const row = h('div', 'flex'); row.style.gap = u(3);
    const cards = [];
    const mark = () => cards.forEach(([v, c]) => { c.style.borderColor = v === state.hand ? 'var(--c-sun)' : ''; c.style.background = v === state.hand ? 'linear-gradient(160deg,rgba(var(--acc-rgb),.28),rgba(var(--acc-rgb),.06))' : ''; });
    [['right', 'Pravá', 'Pravák'], ['left', 'Levá', 'Levák']].forEach(([v, big, small], i) => {
      const c = btn('', 'card', () => { state.hand = v; mark(); }, { auto: v === state.hand });
      c.style.cssText += `;width:${u(21)};padding:${u(3)} ${u(2)};display:flex;flex-direction:column;gap:${u(0.8)};align-items:center`;
      c.innerHTML = `<div style="font-weight:800;font-size:${u(4.4)};letter-spacing:-0.04em">${big}</div><div style="font-weight:600;font-size:${u(2)};color:var(--c-mute)">${small}</div>`;
      cards.push([v, c]); row.append(c);
    });
    const note = h('div', 'muted', 'Podle toho se bude víc trénovat slabší noha.'); note.style.fontSize = u(1.8);
    panel.append(row, note); mark();
  };

  const stepClub = () => {
    const modes = h('div', 'flex'); modes.style.gap = u(2);
    const mbtn = {};
    const markMode = () => Object.entries(mbtn).forEach(([k, b]) => { b.style.borderColor = k === state.mode ? 'var(--c-sun)' : ''; b.style.background = k === state.mode ? 'linear-gradient(160deg,rgba(var(--acc-rgb),.25),rgba(var(--acc-rgb),.05))' : ''; });
    const lower = h('div', 'flex flex-col items-center w-full'); lower.style.gap = u(0.8);
    const setMode = (m) => { state.mode = m; if (m === 'custom') { state.team = null; applyTheme(null); } markMode(); nextBtn.style.opacity = 1; drawPrev(); renderLower(); };
    [['club', 'Klub nebo reprezentace'], ['custom', 'Vlastní dres']].forEach(([k, label], i) => {
      const b = btn(label, 'card', () => setMode(k), { auto: i === 0 });
      b.style.cssText += `;width:${u(26)};padding:${u(1.6)} ${u(1)};font-weight:800;font-size:${u(2.2)}`;
      mbtn[k] = b; modes.append(b);
    });
    const renderLower = () => {
      lower.replaceChildren();
      if (state.mode === 'custom') { const t = h('div', 'muted', 'Dres si poskládáš v dalších krocích.'); t.style.fontSize = u(1.8); lower.append(t); return; }
      if (state.mode !== 'club') { const t = h('div', 'muted', 'Vyber, jestli fandíš nějakému týmu.'); t.style.fontSize = u(1.8); lower.append(t); return; }
      const all = listTeams();
      const countries = [...new Set(all.map((t) => t.country || 'Ostatní'))];
      const cur = getTeam(state.team);
      let country = cur ? (cur.country || 'Ostatní') : countries[0];
      const crow = h('div', 'flex flex-wrap justify-center'); crow.style.gap = u(0.5);
      const teams = h('div', ''); teams.style.cssText = `display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:${u(0.7)};width:100%;max-height:${u(19)};overflow-y:auto;padding:${u(0.4)}`;
      const cb = [];
      const markC = () => cb.forEach(([c, b]) => { b.style.background = c === country ? 'rgba(255,255,255,.16)' : ''; b.style.borderColor = c === country ? 'rgba(255,255,255,.55)' : ''; });
      const tc = [];
      const markT = () => tc.forEach(([id, b]) => { b.style.borderColor = id === state.team ? 'var(--c-sun)' : ''; });
      const fill = () => {
        teams.replaceChildren(); tc.length = 0;
        all.filter((t) => (t.country || 'Ostatní') === country).forEach((t) => {
          const b = btn('', 'card', () => { state.team = t.id; applyTheme(t); markT(); drawPrev(); });
          b.style.cssText += `;padding:${u(0.5)} ${u(0.8)};display:flex;align-items:center;gap:${u(0.8)};text-align:left;border-radius:var(--r-btn)`;
          b.append(teamLogo(t, u(4)), h('span', '', t.name)); b.lastChild.style.cssText = `font-weight:700;font-size:${u(1.5)};line-height:1.15`;
          tc.push([t.id, b]); teams.append(b);
        });
        markT();
      };
      countries.forEach((c) => {
        const b = btn(c, 'btn', () => { country = c; markC(); fill(); });
        b.style.cssText += `;min-height:${u(3.8)};min-width:0;padding:0 ${u(1.3)};font-size:${u(1.4)};border-radius:var(--r-sm)`;
        cb.push([c, b]); crow.append(b);
      });
      markC(); fill();
      lower.append(crow, teams);
    };
    panel.append(modes, lower); markMode(); renderLower();
    nextBtn.style.opacity = state.mode ? 1 : 0.45;
  };

  const stepKit = () => {
    const grid = h('div', ''); grid.style.cssText = `display:grid;grid-template-columns:repeat(6,${u(8.6)});gap:${u(1)};justify-content:center`;
    const bs = [];
    const mark = () => bs.forEach((b, i) => { b.style.borderColor = i === state.avatar ? 'var(--c-sun)' : ''; });
    KIT_STYLES.forEach((_, i) => {
      const b = btn('', 'card', () => { state.avatar = i; mark(); drawPrev(); drawKits(); }, { auto: i === state.avatar });
      b.style.cssText += `;padding:${u(0.8)};border-radius:var(--r-btn);width:100%;min-width:0;display:flex;align-items:center;justify-content:center`;
      bs.push(b); grid.append(b);
    });
    const drawKits = () => bs.forEach((b, i) => b.replaceChildren(jerseyEl({ ...state, avatar: i }, 6.4, { number: false })));
    drawKits(); mark();
    panel.append(grid);
  };

  const stepColors = () => {
    const sw = (lab, key) => {
      const box = h('div', 'flex flex-col items-center'); box.style.gap = u(0.6);
      box.append(h('div', 'eyebrow', lab));
      const g = h('div', ''); g.style.cssText = `display:grid;grid-template-columns:repeat(7,${u(5)});gap:${u(0.8)};justify-content:center`;
      const items = [];
      const mark = () => items.forEach(([c, b]) => { b.style.borderColor = c === state[key] ? '#fff' : ''; b.style.transform = ''; });
      COLORS.forEach((c, i) => {
        const b = btn('', 'card', () => { state[key] = c; mark(); drawPrev(); }, { auto: key === 'color' && i === 0 });
        b.style.cssText += `;background:${c};width:100%;height:${u(4.4)};border-radius:var(--r-sm);padding:0;min-width:0;box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)`;
        items.push([c, b]); g.append(b);
      });
      mark(); box.append(g); return box;
    };
    panel.append(sw('Barva dresu', 'color'), sw('Druhá barva (vzor, lemy)', 'color2'));
  };

  const stepDone = () => {
    const rows = [['Jméno', state.name || 'Hráč'], ['Číslo', state.jersey || 'bez čísla'], ['Silnější noha', state.hand === 'left' ? 'Levá (levák)' : 'Pravá (pravák)'], ['Dres', getTeam(state.team) ? getTeam(state.team).name : 'Vlastní dres']];
    const list = h('div', 'flex flex-col'); list.style.cssText = `gap:${u(0.8)};min-width:${u(40)}`;
    rows.forEach(([k, v]) => {
      const r = h('div', 'flex justify-between'); r.style.cssText = `gap:${u(3)};padding:${u(0.9)} ${u(2)};border-radius:var(--r-btn);border:1px solid var(--line);background:rgba(255,255,255,.03)`;
      const a = h('span', 'muted', k); a.style.fontSize = u(1.8); const b = h('span', '', v); b.style.cssText = `font-weight:800;font-size:${u(2.2)}`;
      r.append(a, b); list.append(r);
    });
    panel.append(list);
  };

  function render() {
    const id = steps()[step];
    panel.replaceChildren();
    eyebrow.textContent = `Nový hráč · krok ${step + 1} z ${steps().length}`;
    title.textContent = TITLES[id];
    dots.replaceChildren(...steps().map((_, i) => { const d = h('div', ''); d.style.cssText = `width:${i === step ? u(3.2) : u(1)};height:${u(1)};border-radius:99px;background:${i <= step ? 'var(--c-sun)' : 'rgba(255,255,255,.18)'};transition:width .25s`; return d; }));
    nextBtn.innerHTML = id === 'done' ? `${icon('check')}Vytvořit hráče` : 'Další';
    nextBtn.style.opacity = 1; nextBtn.disabled = false;
    drawPrev();
    ({ name: stepName, number: stepNumber, hand: stepHand, club: stepClub, kit: stepKit, colors: stepColors, done: stepDone })[id]();
    onBack(() => prevStep());
    const first = el.querySelector('[data-autofocus]') || (id === 'done' ? nextBtn : nextBtn);
    first.focus();
  }

  render();
  return el;
}
