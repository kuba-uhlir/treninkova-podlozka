import { h, btn, u, jerseyEl, icon, KIT_STYLES } from '../ui/dom.js';
import { faceChooser, lookToggle } from '../ui/faces.js';
import { listProfiles, createProfile, saveProfile, getProfile, COLORS, profileLevel } from '../domain/profiles.js';
import { sfx } from '../core/audio.js';
import { applyTheme, getTeam, listTeams, teamLogo } from '../ui/theme.js';

const tile = (inner) => `<div style="width:${u(9.5)};height:${u(9.5)};border-radius:50%;border:2px dashed rgba(255,255,255,.28);display:flex;align-items:center;justify-content:center;font-size:${u(3.8)}">${inner}</div>`;

// Výběr hráče: velké karty s dresem. Uvnitř nic zbytečného: hráči, nový hráč, host, a malé „Rodiče“.
export default function profiles(_p, { go }) {
  applyTheme(null);
  const el = h('section', 'screen gap-8');
  el.append(h('div', 'eyebrow', 'Fotbal · trénink'), h('div', 'title', 'Kdo dnes <span class="accent">trénuje</span>?'));
  const row = h('div', 'flex flex-wrap gap-6 justify-center');
  el.append(row);

  (async () => {
    const list = await listProfiles();
    list.forEach((p, i) => {
      const lv = profileLevel(p);
      const c = btn('', 'card flex flex-col items-center gap-3', () => { sfx('click'); go('home', { profileId: p.id }); }, { auto: i === 0 });
      c.style.width = u(16);
      c.append(jerseyEl(p, 10));
      const nm = h('div', '', p.name + (p.isGuest ? ' (host)' : ''));
      nm.style.cssText = `font-weight:800;font-size:${u(2.2)};letter-spacing:-0.03em`;
      const rk = h('div', 'eyebrow', `${lv.rank}`);
      c.append(nm, rk);
      row.append(c);
    });
    const add = btn('', 'card flex flex-col items-center gap-3', () => go('newPlayer'), { auto: list.length === 0 });
    add.style.width = u(16);
    add.innerHTML = `${tile(icon('plus'))}<div style="font-weight:600;font-size:${u(2.2)}">Nový hráč</div>`;
    const guest = btn('', 'card flex flex-col items-center gap-3', async () => {
      const p = await createProfile({ isGuest: true, avatar: Math.floor(Math.random() * KIT_STYLES.length), color: COLORS[Math.floor(Math.random() * COLORS.length)] });
      go('home', { profileId: p.id });
    });
    guest.style.width = u(16);
    guest.innerHTML = `${tile(icon('users'))}<div style="font-weight:600;font-size:${u(2.2)}">Host</div>`;
    row.append(add, guest);
    const parent = btn(`${icon('lock')}Rodiče`, 'btn', () => go('pin', { next: 'parent' }));
    parent.style.minHeight = u(5.6); parent.style.fontSize = u(1.9); parent.style.opacity = 0.85;
    el.append(parent);
    (el.querySelector('[data-autofocus]') || add).focus();
  })();
  return el;
}

// Vytvoření / úprava hráče. Vlevo náhled dresu, jméno a číslo; vpravo tým (podle země) a střih dresu.
export function createProfileScreen({ guest = false, convertId = null, editId = null, initial = null, returnTo = 'home' }, { go, back }) {
  const editing = !!(editId || convertId);
  applyTheme(initial ? getTeam(initial.team) : null);
  const el = h('section', 'screen');
  el.style.cssText += ';justify-content:flex-start;overflow-y:auto;gap:' + u(2.4);
  el.append(h('div', 'eyebrow', guest ? 'Host' : 'Profil'), h('div', 'title', editing ? 'Upravit <span class="accent">hráče</span>' : guest ? 'Host' : 'Nový hráč'));

  const state = { avatar: 0, face: 0, color: COLORS[2], name: '', jersey: '', team: null, hand: 'right', color2: '#FFFFFF' };
  if (initial) Object.assign(state, {
    avatar: typeof initial.avatar === 'number' ? initial.avatar : 0, face: initial.face || 0, color: initial.color || COLORS[2],
    name: initial.isGuest ? '' : (initial.name || ''), jersey: initial.jersey || '', team: initial.team || null, hand: initial.hand || 'right', color2: initial.color2 || '#FFFFFF',
  });

  const cols = h('div', 'flex flex-wrap gap-8 justify-center items-start w-full');
  const left = h('div', 'flex flex-col items-center gap-4');
  const right = h('div', 'flex flex-col items-center gap-4');
  right.style.cssText = `max-width:${u(70)}`;

  // náhled dresu
  const preview = h('div', 'flex justify-center');
  const drawPrev = () => { preview.replaceChildren(jerseyEl(state, 14)); drawKits(); };

  const name = h('input', 'card font-bold text-center', '', { type: 'text', placeholder: 'Jméno', maxlength: 14, 'data-focusable': '', tabindex: '0' });
  name.style.cssText += `;font-size:${u(2.2)};width:${u(22)};border-radius:var(--r-btn)`;
  name.oninput = () => { state.name = name.value; drawPrev(); };

  // číslo dresu: − / + (pohodlné na D-pad), prázdné = bez čísla
  const jersey = h('div', 'flex flex-col items-center'); jersey.style.gap = u(0.8);
  const jrow = h('div', ''); jrow.style.cssText = `display:grid;grid-template-columns:${u(6)} 1fr ${u(6)};align-items:center;gap:${u(1)};width:${u(22)}`;
  const jval = h('div', 'font-extrabold text-center', '—');
  jval.style.cssText = `font-size:${u(3)};text-align:center;line-height:1;letter-spacing:-0.04em`;
  const bump = (d) => {
    const cur = state.jersey === '' ? 0 : Number(state.jersey);
    const nx = Math.max(0, Math.min(99, cur + d));
    state.jersey = nx === 0 && d < 0 ? '' : String(nx || (d > 0 ? 1 : 0));
    jval.textContent = state.jersey === '' ? '—' : state.jersey; drawPrev();
  };
  const jm = btn('−', 'btn', () => bump(-1)); jm.style.cssText += `;min-width:0;padding:0`;
  const jp = btn('+', 'btn', () => bump(1)); jp.style.cssText += `;min-width:0;padding:0`;
  jrow.append(jm, jval, jp);
  jersey.append(h('div', 'eyebrow', 'Číslo dresu'), jrow);
  // silnější noha: podle toho se v tréninku víc procvičuje ta slabší
  const handRow = h("div", "flex items-center gap-3");
  const handBtns = [];
  const markHand = () => handBtns.forEach(([v, b]) => { b.style.background = v === state.hand ? "var(--c-sun)" : ""; b.style.color = v === state.hand ? "var(--on-acc)" : ""; });
  [["right", "Pravák"], ["left", "Levák"]].forEach(([v, label]) => {
    const b = btn(label, "btn", () => { state.hand = v; markHand(); });
    b.style.minHeight = u(4.6); b.style.minWidth = u(10); b.style.fontSize = u(1.8);
    handBtns.push([v, b]); handRow.append(b);
  });
  markHand();
  left.append(preview, name, jersey, h("div", "eyebrow", "Silnější noha"), handRow);

  // střih dresu
  const kitRow = h('div', '');
  kitRow.style.cssText = `display:grid;grid-template-columns:repeat(6,${u(6)});gap:${u(0.9)};justify-content:center`;
  const kitBtns = [];
  KIT_STYLES.forEach((_, i) => {
    const b = btn('', 'card', () => { state.avatar = i; drawPrev(); });
    b.style.cssText += `;padding:${u(.6)};border-radius:var(--r-btn);width:100%;min-width:0;display:flex;align-items:center;justify-content:center`;
    kitBtns.push(b); kitRow.append(b);
  });
  const drawKits = () => kitBtns.forEach((b, i) => {
    b.replaceChildren(jerseyEl({ ...state, face: 0, avatar: i }, 5.4, { number: false }));
    b.style.borderColor = i === state.avatar ? 'var(--c-sun)' : '';
  });

  const kitBox = h('div', 'flex flex-col items-center gap-2');
  kitBox.append(h('div', 'eyebrow', 'Střih dresu'), kitRow);

  // vlastní barva (jen když není tým)
  const palette = `display:grid;grid-template-columns:repeat(7,${u(4)});gap:${u(1)};justify-content:center`;
  const colRow = h('div', '');
  colRow.style.cssText = palette;
  const colBtns = [];
  COLORS.forEach((c) => {
    const b = btn('', 'card', () => { state.color = c; drawPrev(); markCol(); });
    b.style.cssText += `;background:${c};width:100%;height:${u(4)};border-radius:var(--r-sm);padding:0;min-width:0;box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)`;
    colBtns.push([c, b]); colRow.append(b);
  });
  const markCol = () => colBtns.forEach(([c, b]) => { b.style.borderColor = c === state.color ? '#fff' : ''; });
  const col2Row = h("div", ""); col2Row.style.cssText = palette;
  const col2Btns = [];
  const markCol2 = () => col2Btns.forEach(([c, b]) => { b.style.borderColor = c === state.color2 ? "#fff" : ""; });
  COLORS.forEach((c) => {
    const b = btn("", "card", () => { state.color2 = c; drawPrev(); markCol2(); });
    b.style.cssText += `;background:${c};width:100%;height:${u(4)};border-radius:var(--r-sm);padding:0;min-width:0;box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)`;
    col2Btns.push([c, b]); col2Row.append(b);
  });
  const colBox = h("div", "flex flex-col items-center gap-2");
  colBox.append(h("div", "eyebrow", "Barva dresu"), colRow, h("div", "eyebrow", "Druhá barva (vzor, lemy)"), col2Row);
  const syncColBox = () => { colBox.style.display = state.team ? 'none' : 'flex'; kitBox.style.display = state.team || state.face ? 'none' : 'flex'; faceBox.style.display = state.face ? 'flex' : 'none'; };

  // oblíbený tým (přebarví menu a dres, logo do pozadí) seskupený podle země
  const all = listTeams();
  const countries = [...new Set(all.map((t) => t.country || 'Ostatní'))];
  const curT = getTeam(state.team);
  let country = curT ? (curT.country || 'Ostatní') : countries[0];
  const countryRow = h('div', 'flex gap-2 flex-wrap justify-center');
  const teamRow = h('div', 'flex gap-3 flex-wrap justify-center');
  let tcards = [];
  const markTeam = () => tcards.forEach(([id, b]) => { b.style.borderColor = id === state.team ? 'var(--c-sun)' : ''; });
  const pickTeam = (t) => { state.team = t ? t.id : null; applyTheme(t); markTeam(); syncColBox(); drawPrev(); };
  const cbtns = [];
  const markCountry = () => cbtns.forEach(([c, b]) => { b.style.background = c === country ? 'rgba(255,255,255,.14)' : ''; b.style.borderColor = c === country ? 'rgba(255,255,255,.5)' : ''; });
  const renderTeams = () => {
    teamRow.replaceChildren(); tcards = [];
    const none = btn('Bez týmu', 'btn', () => pickTeam(null)); none.style.minHeight = u(5.2); none.style.minWidth = u(9); none.style.fontSize = u(1.7);
    tcards.push([null, none]); teamRow.append(none);
    all.filter((t) => (t.country || 'Ostatní') === country).forEach((t) => {
      const b = btn('', 'card', () => pickTeam(t));
      b.style.cssText += `;padding:${u(.5)};border-radius:var(--r-btn);display:flex;align-items:center;gap:${u(.9)};padding-right:${u(1.5)}`;
      b.append(teamLogo(t, u(4)), h('span', '', t.name));
      b.lastChild.style.cssText = `font-weight:600;font-size:${u(1.7)}`;
      tcards.push([t.id, b]); teamRow.append(b);
    });
    markTeam();
  };
  countries.forEach((c) => {
    const b = btn(c, 'btn', () => { country = c; markCountry(); renderTeams(); });
    b.style.minHeight = u(4.4); b.style.minWidth = u(7); b.style.fontSize = u(1.6); b.style.padding = `0 ${u(1.8)}`;
    cbtns.push([c, b]); countryRow.append(b);
  });
  markCountry(); renderTeams();

  const faceBox = h('div', 'flex flex-col items-center gap-2');
  faceBox.append(faceChooser(state, () => drawPrev(), { cell: 5.4 }));
  const lookBox = h('div', 'flex flex-col items-center gap-2');
  lookBox.append(h('div', 'eyebrow', 'Vzhled hráče'), lookToggle(state, () => { syncColBox(); drawPrev(); }));
  right.append(h('div', 'eyebrow', 'Oblíbený tým'), countryRow, teamRow, lookBox, faceBox, kitBox, colBox);
  cols.append(left, right);

  const actions = h('div', 'flex gap-5');
  const ok = btn(`${icon('check')}Hotovo`, 'btn-primary', async () => {
    if (editing) {
      const p = await getProfile(editId || convertId);
      Object.assign(p, { name: state.name.trim() || p.name, avatar: state.avatar, face: state.face, color: state.color, color2: state.color2, jersey: state.jersey, team: state.team, hand: state.hand });
      if (convertId) p.isGuest = false;
      await saveProfile(p);
      if (returnTo === 'parent') go('parent', {}, { replace: true }); else go('home', { profileId: p.id }, { replace: true });
      return;
    }
    const p = await createProfile({ ...state, isGuest: guest });
    go('home', { profileId: p.id }, { replace: true });
  }, { auto: true });
  actions.append(ok, btn(`${icon('back')}Zpět`, 'btn', () => back()));

  name.value = state.name;
  jval.textContent = state.jersey === '' ? '—' : state.jersey;
  markCol(); markCol2(); syncColBox(); drawPrev();
  el.append(cols, actions);
  return el;
}
