import { h, btn, u, icon, jerseyEl } from '../ui/dom.js';
import { say, sfx, stopVoice } from '../core/audio.js';
import { WARMUP, markWarmup } from '../domain/extras.js';

// Rozcvička: 5 krátkých kroků po 20 s, jen při prvním tréninku dne (pak se předá dál do přehrávače). Jde přeskočit.
export default function warmup({ profile, next }, { go, onBack }) {
  const el = h('section', 'screen');
  el.style.gap = u(1.6);
  let i = 0; let t = 0; let timer = null; let finished = false;

  const eyebrow = h('div', 'eyebrow');
  const ttl = h('div', 'title'); ttl.style.fontSize = u(5.4);
  const txt = h('div', 'muted'); txt.style.fontSize = u(2.2);
  const ring = h('div', 'relative'); ring.style.cssText = `width:${u(15)};height:${u(15)}`;
  ring.innerHTML = `<svg viewBox="0 0 100 100" style="width:100%;height:100%;transform:rotate(-90deg)"><circle cx="50" cy="50" r="44" fill="none" stroke="#ffffff14" stroke-width="6"/><circle id="wa" cx="50" cy="50" r="44" fill="none" stroke="var(--c-sun)" stroke-width="6" stroke-linecap="round" stroke-dasharray="276.46" style="filter:drop-shadow(0 0 4px rgba(var(--acc-rgb),.6))"/></svg><div id="wn" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:${u(6)};letter-spacing:-0.05em"></div>`;
  const arc = ring.querySelector('#wa'); const num = ring.querySelector('#wn');
  const segs = h('div', 'flex'); segs.style.gap = u(0.8);
  const fills = WARMUP.map(() => { const s = h('div', ''); s.style.cssText = `width:${u(7)};height:${u(0.9)};border-radius:99px;background:rgba(255,255,255,.12);overflow:hidden`; const f = h('div', ''); f.style.cssText = 'width:0;height:100%;background:var(--c-sun)'; s.append(f); segs.append(s); return f; });
  const skip = btn('Přeskočit rozcvičku', 'btn', () => end(), { auto: true });
  skip.style.cssText += `;min-height:${u(5.4)};font-size:${u(1.9)}`;
  el.append(jerseyEl(profile, 6), eyebrow, ttl, txt, ring, segs, skip);

  const show = () => {
    const w = WARMUP[i]; t = 0;
    eyebrow.textContent = `Rozcvička · krok ${i + 1} z ${WARMUP.length}`; ttl.textContent = w.name; txt.textContent = w.text;
    fills.forEach((f, k) => { f.style.width = k < i ? '100%' : '0'; });
    say(`wu_${i + 1}`, { kind: 'phrase' });
  };
  async function end() {
    if (finished) return; finished = true; clearInterval(timer); stopVoice();
    await markWarmup(profile);
    go('player', next, { replace: true });
  }
  timer = setInterval(() => {
    t += 100;
    const w = WARMUP[i]; const k = Math.min(1, t / (w.sec * 1000));
    arc.setAttribute('stroke-dashoffset', String(276.46 * k)); num.textContent = Math.max(0, Math.ceil(w.sec - t / 1000));
    fills[i].style.width = `${k * 100}%`;
    if (k >= 1) { sfx('success'); i++; if (i >= WARMUP.length) end(); else show(); }
  }, 100);
  onBack(() => { clearInterval(timer); end(); });
  show();
  return el;
}
