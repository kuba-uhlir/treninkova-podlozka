// Globální prostorový focus manager pro D-pad (TV). Dotyk funguje přes běžné click události.
// Každý interaktivní prvek: [data-focusable] (+ tabindex=0). Nic bez fokusu.
const SEL = '[data-focusable]:not([disabled]):not([hidden])';
const DIRS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
let root = document;
const memory = new WeakMap(); // root -> naposledy fokusovaný prvek

const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
export const candidates = () => [...root.querySelectorAll(SEL)].filter(visible);
const center = (r) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });

export function pickNext(from, dir, list) {
  const a = from.getBoundingClientRect();
  const ac = center(a);
  let best = null;
  let bestScore = Infinity;
  for (const el of list) {
    if (el === from) continue;
    const b = el.getBoundingClientRect();
    const bc = center(b);
    const dx = bc.x - ac.x;
    const dy = bc.y - ac.y;
    let main; let cross;
    if (dir === 'left') { main = -dx; cross = Math.abs(dy); }
    else if (dir === 'right') { main = dx; cross = Math.abs(dy); }
    else if (dir === 'up') { main = -dy; cross = Math.abs(dx); }
    else { main = dy; cross = Math.abs(dx); }
    if (main <= 4) continue;
    const score = main + cross * 2.2; // boční odchylka je dražší než vzdálenost
    if (score < bestScore) { bestScore = score; best = el; }
  }
  return best;
}

export function focusEl(el) {
  if (!el) return;
  el.focus({ preventScroll: true });
  el.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  memory.set(root, el);
}

/** Po vykreslení obrazovky: fokus na [data-autofocus] nebo první prvek. */
export function focusInitial(scope = document) {
  root = scope;
  const el = scope.querySelector('[data-autofocus]') || candidates()[0];
  focusEl(el);
}

let backHandler = null;
export const onBack = (fn) => { backHandler = fn; };

function handleKey(e) {
  if (e.defaultPrevented) return;
  const dir = DIRS[e.key];
  if (dir) {
    e.preventDefault();
    const active = document.activeElement;
    const cur = active && active.matches && active.matches(SEL) ? active : null;
    const list = candidates();
    if (!cur) { focusEl(list.includes(memory.get(root)) ? memory.get(root) : list[0]); return; }
    focusEl(pickNext(cur, dir, list) || cur);
    return;
  }
  if (e.key === 'Enter' || e.key === ' ') { // DPAD_CENTER přichází jako Enter
    const cur = document.activeElement;
    if (cur && cur.matches && cur.matches(SEL)) { e.preventDefault(); cur.click(); }
    return;
  }
  if (e.key === 'Escape' || e.key === 'GoBack' || e.key === 'BrowserBack') {
    e.preventDefault();
    if (backHandler) backHandler();
  }
}

export function initFocus() {
  window.addEventListener('keydown', handleKey);
  document.addEventListener('pointerdown', (e) => {
    const t = e.target.closest && e.target.closest(SEL);
    if (t) focusEl(t);
  });
  // ztráta fokusu po překreslení → vrať ho
  document.addEventListener('focusout', () => setTimeout(() => {
    if (!document.activeElement || document.activeElement === document.body) focusInitial(root);
  }, 0));
}
