import { h, u } from '../ui/dom.js';
import { sfx } from '../core/audio.js';
import { ballSvg } from '../ui/BallSvg.js';

// Úvodní animace při spuštění: míč se přikutálí a odrazí, nápis FOTBAL se poskládá po písmenech, pod ním se vykreslí žlutá čára.
// Jde přeskočit (OK / klik). Po skončení přejde na výběr hráče.
export default function intro(_p, { go }) {
  const el = h('section', 'screen');
  el.style.gap = u(2);
  el.style.cursor = 'pointer';

  const ballBox = h('div', '');
  ballBox.style.cssText = `width:${u(13)};height:${u(13)};opacity:0`;
  ballBox.innerHTML = ballSvg();
  ballBox.style.filter = 'drop-shadow(0 1.2vmin 1.6vmin rgba(0,0,0,.55))';

  const word = h('div', 'flex');
  word.style.cssText = `font-weight:800;font-size:${u(10)};letter-spacing:-0.06em;line-height:1`;
  const letters = [...'FOTBAL'].map((c) => { const s = h('span', '', c); s.style.cssText = 'display:inline-block;opacity:0'; word.append(s); return s; });
  const dot = h('span', '', '.'); dot.style.cssText = 'display:inline-block;opacity:0;color:var(--c-sun)'; word.append(dot);

  const line = h('div', '');
  line.style.cssText = `height:${u(0.6)};width:${u(46)};border-radius:99px;background:linear-gradient(90deg,transparent,var(--c-sun),var(--acc-soft),transparent);transform:scaleX(0);box-shadow:0 0 ${u(2)} rgba(var(--acc-rgb),.6)`;
  const sub = h('div', 'eyebrow', 'Tréninková podložka'); sub.style.opacity = 0;

  el.append(ballBox, word, line, sub);

  let done = false;
  const finish = () => { if (done) return; done = true; go('profiles', {}, { replace: true }); };

  // animace (Web Animations); bez podpory se rovnou přejde dál
  const A = (node, keyframes, opts) => (node.animate ? node.animate(keyframes, { fill: 'forwards', ...opts }) : null);
  const t0 = 150;
  // míč: vykutálí se zleva s otáčením a odrazem
  A(ballBox, [
    { opacity: 0, transform: 'translateX(-70vw) rotate(-540deg)', offset: 0 },
    { opacity: 1, transform: 'translateX(-4vw) rotate(-40deg)', offset: 0.55 },
    { opacity: 1, transform: 'translateX(0) translateY(-6vh) rotate(0deg)', offset: 0.7 },
    { opacity: 1, transform: 'translateX(0) translateY(0) rotate(0deg)', offset: 0.82 },
    { opacity: 1, transform: 'translateX(0) translateY(-2vh)', offset: 0.91 },
    { opacity: 1, transform: 'translateX(0) translateY(0)', offset: 1 },
  ], { duration: 1300, delay: t0, easing: 'cubic-bezier(.3,.7,.3,1)' });
  // písmena poskakují nahoru jedno po druhém
  [...letters, dot].forEach((l, i) => {
    A(l, [{ opacity: 0, transform: 'translateY(60%) scale(.8)' }, { opacity: 1, transform: 'translateY(-8%) scale(1.05)', offset: 0.65 }, { opacity: 1, transform: 'translateY(0) scale(1)' }],
      { duration: 480, delay: 900 + i * 85, easing: 'cubic-bezier(.2,.8,.2,1)' });
  });
  A(line, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 650, delay: 1500, easing: 'ease-out' });
  A(sub, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 500, delay: 1750 });
  // odchod: krátké zhasnutí
  const total = 2900;
  const out = setTimeout(() => { A(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 350 }); setTimeout(finish, 340); }, total);
  sfx('intro');

  // přeskočit klávesou nebo klikem
  const skip = () => { clearTimeout(out); finish(); };
  el.addEventListener('click', skip);
  el.tabIndex = 0;
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') { e.preventDefault(); skip(); } });
  setTimeout(() => el.focus(), 0);
  if (!el.animate) setTimeout(finish, 300);
  return el;
}
