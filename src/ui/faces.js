import { h, btn, u, jerseyEl, faceSrc, FACE_COUNT } from './dom.js';

/**
 * Výběr postavičky: první políčko = dres hráče (bez obličeje), pak 24 obličejů (děti a zvířata).
 * state.face se nastaví přímo (0 = dres), onPick se zavolá po každé volbě.
 */
export function faceChooser(state, onPick, { cell = 6.4, cols = 7, autoFocus = false } = {}) {
  const grid = h('div', '');
  grid.style.cssText = `display:grid;grid-template-columns:repeat(${cols},${u(cell)});gap:${u(0.8)};justify-content:center`;
  const items = [];
  const cur = () => state.face || 0;
  const mark = () => items.forEach(([n, b]) => {
    const on = n === cur();
    b.style.borderColor = on ? 'var(--c-sun)' : '';
    b.style.background = on ? 'linear-gradient(160deg, rgba(var(--acc-rgb),.28), rgba(var(--acc-rgb),.08))' : '';
  });
  for (let n = 0; n <= FACE_COUNT; n++) {
    const b = btn('', 'card', () => { state.face = n; mark(); onPick(n); }, { auto: autoFocus && n === cur() });
    b.style.cssText += `;padding:${u(0.3)};border-radius:var(--r-btn);width:100%;min-width:0;aspect-ratio:1;display:flex;align-items:center;justify-content:center`;
    if (n === 0) b.append(jerseyEl({ ...state, face: 0 }, cell * 0.78, { number: false }));
    else b.innerHTML = `<img src="${faceSrc(n)}" alt="" draggable="false" style="width:100%;height:100%;object-fit:contain">`;
    items.push([n, b]); grid.append(b);
  }
  mark();
  return grid;
}
