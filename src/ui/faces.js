import { h, btn, u, faceSrc, FACE_COUNT } from './dom.js';

/**
 * Přepínač vzhledu hráče: Dres (state.face = 0) nebo Avatar (state.face = číslo obličeje).
 * Naposledy zvolený obličej se pamatuje, takže přepnutí tam a zpět o volbu nepřijde.
 */
export function lookToggle(state, onChange) {
  const row = h('div', 'flex items-center gap-3');
  let last = state.face || 0;
  const bs = [];
  const mark = () => bs.forEach(([avatar, b]) => { const on = avatar === !!state.face; b.style.background = on ? 'var(--c-sun)' : ''; b.style.color = on ? 'var(--on-acc)' : ''; b.style.borderColor = on ? 'var(--c-sun)' : ''; });
  [[false, 'Dres'], [true, 'Avatar']].forEach(([avatar, label]) => {
    const b = btn(label, 'btn', () => {
      if (state.face) last = state.face;
      state.face = avatar ? (last || 1) : 0;
      mark(); onChange(avatar);
    });
    b.style.minHeight = u(4.6); b.style.minWidth = u(11); b.style.fontSize = u(1.8);
    bs.push([avatar, b]); row.append(b);
  });
  mark();
  return row;
}

/** Mřížka 24 avatarů (děti a zvířata). Výběr nastaví state.face a zavolá onPick(n). */
export function faceChooser(state, onPick, { cell = 5.9, cols = 8, autoFocus = false } = {}) {
  const grid = h('div', '');
  grid.style.cssText = `display:grid;grid-template-columns:repeat(${cols},${u(cell)});gap:${u(0.8)};justify-content:center`;
  const items = [];
  const mark = () => items.forEach(([n, b]) => {
    const on = n === state.face;
    b.style.borderColor = on ? 'var(--c-sun)' : '';
    b.style.background = on ? 'linear-gradient(160deg, rgba(var(--acc-rgb),.28), rgba(var(--acc-rgb),.08))' : '';
  });
  for (let n = 1; n <= FACE_COUNT; n++) {
    const b = btn('', 'card', () => { state.face = n; mark(); onPick(n); }, { auto: autoFocus && n === state.face });
    b.style.cssText += `;padding:${u(0.3)};border-radius:var(--r-btn);width:100%;min-width:0;aspect-ratio:1;display:flex;align-items:center;justify-content:center`;
    b.innerHTML = `<img src="${faceSrc(n)}" alt="" draggable="false" style="width:100%;height:100%;object-fit:contain">`;
    items.push([n, b]); grid.append(b);
  }
  mark();
  return grid;
}
