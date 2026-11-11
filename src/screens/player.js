import { createMatView } from '../ui/MatView.js';
import { h, btn, u, icon, jerseyEl } from '../ui/dom.js';
import { say, sayGroup, stopVoice, voiceBusy, sfx, playMusic, stopMusic } from '../core/audio.js';
import { REST_SEC, beatMs, TYPE_NAMES, drillType, weakFootOf, tempoLabel } from '../domain/trainer.js';
import { patternFor, directionKey, zonePoint } from '../config/mats.js';

// Přehrávač tréninku: ukázka → 3-2-1-hraj → zóny v tempu → pauza → další cvik. OK = pauza, Back = nabídka ukončení.
// HUD: nahoře dres hráče + název cviku + segmentový postup tréninku + časovač; uprostřed podložka; dole fáze a nápověda.
const PREVIEW_SEC = 6;

export default function player({ profile, workout, mat: matCfg, tempoMul = 1 }, { go, onBack }) {
  const el = h('section', 'screen');
  el.style.cssText += `;justify-content:space-between;overflow:hidden;padding:${u(1.2)} ${u(3)} ${u(1.1)};gap:${u(0.7)}`;

  // ---- horní lišta ----
  const head = h('div', 'w-full flex items-center justify-between');
  head.style.gap = u(3);
  const left = h('div', 'flex items-center');
  left.style.gap = u(1.8);
  left.append(jerseyEl(profile, 5.6));
  const ttlBox = h('div', 'flex flex-col');
  ttlBox.style.gap = u(0.3);
  const counter = h('div', 'eyebrow');
  const title = h('div', '');
  title.style.cssText = `font-weight:800;font-size:${u(2.9)};letter-spacing:-0.03em;line-height:1.05`;
  const chips = h('div', 'flex');
  chips.style.cssText = `gap:${u(0.8)};margin-top:${u(0.5)}`;
  const task = h('div', ''); // co má hráč dělat (text k hlasu Trenéra)
  task.style.cssText = `font-size:${u(1.9)};font-weight:600;color:var(--c-chalk);opacity:.85;margin-top:${u(0.4)};max-width:${u(48)};line-height:1.25`;
  ttlBox.append(counter, title, chips, task);
  left.append(ttlBox);

  // segmenty postupu tréninku (jeden na cvik)
  const segs = h('div', 'flex flex-1');
  segs.style.cssText = `gap:${u(0.7)};max-width:${u(34)};min-width:${u(10)}`;
  const segFill = workout.map(() => {
    const s = h('div', '');
    s.style.cssText = `flex:1;height:${u(0.9)};border-radius:99px;background:rgba(255,255,255,.12);overflow:hidden`;
    const f = h('div', '');
    f.style.cssText = 'width:0%;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--c-sun),var(--acc-soft))';
    s.append(f); segs.append(s);
    return f;
  });

  // časovač (tenký kruh + číslo)
  const ring = h('div', 'relative');
  ring.style.cssText = `width:${u(10.5)};height:${u(10.5)};flex:none`;
  ring.innerHTML = `<svg viewBox="0 0 100 100" class="w-full h-full" style="transform:rotate(-90deg)"><defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--acc-soft)"/><stop offset="1" style="stop-color:var(--c-sun)"/></linearGradient></defs>
    <circle cx="50" cy="50" r="44" fill="none" stroke="#ffffff14" stroke-width="6"/>
    <circle id="arc" cx="50" cy="50" r="44" fill="none" stroke="url(#rg)" stroke-width="6" stroke-linecap="round" style="filter:drop-shadow(0 0 3px rgba(var(--acc-rgb),.6))" stroke-dasharray="276.46" stroke-dashoffset="0"/></svg>
    <div id="big" class="absolute inset-0 flex items-center justify-center font-extrabold" style="font-size:${u(4)};letter-spacing:-0.05em"></div>`;
  const arc = ring.querySelector('#arc');
  const big = ring.querySelector('#big');
  head.append(left, segs, ring);

  // ---- podložka přes celou střední část + velký odpočet nad ní ----
  const mid = h('div', 'w-full flex-1 flex items-center justify-center');
  mid.style.cssText += ';min-height:0;position:relative';
  const mat = createMatView({ mat: matCfg, room: true });
  mat.el.style.cssText = 'width:100%;height:100%';
  mid.appendChild(mat.el);
  const cd = h('div', '');
  cd.style.cssText = `position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;` +
    `font-weight:800;font-size:${u(30)};letter-spacing:-0.06em;color:#fff;text-shadow:0 0 ${u(6)} rgba(var(--acc-rgb),.7),0 ${u(.8)} ${u(4)} rgba(0,0,0,.8);opacity:0`;
  mid.appendChild(cd);

  // ---- spodní lišta ----
  const foot = h('div', 'w-full flex items-center justify-between');
  const pill = h('div', 'flex items-center');
  pill.style.cssText = `gap:${u(1.2)};padding:${u(0.7)} ${u(2.2)};border-radius:var(--r-btn);font-weight:800;font-size:${u(2.1)};letter-spacing:-0.01em;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06)`;
  const dot = h('span', '');
  dot.style.cssText = `width:${u(1.3)};height:${u(1.3)};border-radius:50%;background:var(--c-sun);flex:none`;
  const pillText = h('span', '');
  pill.append(dot, pillText);
  const hint = h('div', 'eyebrow'); hint.textContent = 'OK = pauza · Zpět = konec';
  foot.append(pill, hint);

  el.append(head, mid, foot);

  // ---- stav ----
  let idx = 0;
  let phase = 'preview'; // preview | countdown | play | rest
  let t = 0;             // ms ve fázi
  let paused = false;
  let beat = -1;
  let cdLast = 4;
  let curPass = 0;
  let done = 0;
  let last = performance.now();
  let overlay = null;
  let said = { almost: false, praise: 0, next: false };
  let slow = false; // ukázka znovu pomalu (šipka nahoru / klepnutí na nápovědu)

  const drill = () => workout[idx];
  const isTap = (d) => drillType(d) === 'ball' && patternFor(d, matCfg).every((z) => z === 1);
  const pat = (d) => patternFor(d, matCfg);
  // Jeden "úder" cviku; vrací klíč hlášky. Typ "jump" = míč stojí, hráč ho přeskakuje (vlevo/vpravo).
  const hi = (d, z, b, glideMs) => {
    const pt = pat(d);
    const next = pt.length > 1 ? pt[(b + 1) % pt.length] : null; // kam to půjde příště
    if (isTap(d)) { // míč stojí a hráč na něj jen klepe podrážkou: místo míče se ukazují chodidla
      const both = !d.foot || d.foot === 'both';
      mat.tap(both ? (b % 2 === 0 ? 'left' : 'right') : d.foot);
      return null; // během klepání se nehlásí "jedna, jedna…"
    }
    if (d.type === "jump") {
      const sides = d.sides || ["left", "right"];
      const side = sides[b % sides.length];
      mat.jump(side, glideMs);
      mat.hintSide(sides[(b + 1) % sides.length]); // šipka k další straně svítí a pulzuje
      return `side_${side}`;
    }
    if (d.type === "step" && d.feet !== "pair") {
      // Twister: levá a pravá noha střídavě, každá zvlášť
      // levá noha jen na levá čísla, pravá jen na pravá (nohy se nekříží); střed bere nohu, která tam byla předtím
      const side = (zz) => { const dx = zonePoint(matCfg, zz).x - matCfg.ball.x; return dx < -12 ? 'left' : dx > 12 ? 'right' : null; };
      const foot = (d.footSeq && d.footSeq[b % d.footSeq.length]) || side(z) || side(pt[(b - 1 + pt.length) % pt.length]) || (b % 2 === 0 ? 'left' : 'right');
      mat.step(z, foot, glideMs, next);
      return `zone_${z}`;
    }
    if (d.type === "step") mat.jump(z, glideMs); else mat.highlight(z, d.foot === "both" ? undefined : d.foot, glideMs);
    if (drillType(d) === 'ball') { // pracovní noha u míče: zadaná; u cviků na obě nohy jedna celou dobu, a až když míč přejde na druhou stranu podložky, přehodí se
      mat.ballFeet(z, workFoot(d, z), glideMs);
    }
    mat.hint(z, next);
    // u jednoduchých cviků se místo čísla hlásí směr (doleva, dopředu, šikmo…)
    if (d.call === 'direction' && pt.length > 1) { const k = directionKey(matCfg, pt[(b - 1 + pt.length) % pt.length], z); if (k) return k; }
    return `zone_${z}`;
  };
  // Pracovní noha u cviků "na obě nohy": převalování míče jednou nohou, druhá stojí; noha se mění jen při přechodu vlevo/vpravo
  let wf = null;
  const sideOf = (z) => { const dx = zonePoint(matCfg, z).x - matCfg.ball.x; return dx < -12 ? 'left' : dx > 12 ? 'right' : null; };
  const workFoot = (d, z) => {
    if (d.foot === 'left' || d.foot === 'right') return d.foot;
    const sd = sideOf(z);
    if (sd) wf = sd; else if (!wf) { const sides = new Set(pat(d).map(sideOf).filter(Boolean)); wf = sides.size === 1 ? [...sides][0] : (profile.hand === 'left' ? 'left' : 'right'); }
    return wf;
  };
  const glide = (ms) => Math.max(120, Math.min(450, ms * 0.6));
  const setArc = (frac) => arc.setAttribute('stroke-dashoffset', String(276.46 * (1 - Math.max(0, Math.min(1, frac)))));
  const setSeg = (frac) => segFill.forEach((f, i) => { f.style.width = `${(i < idx ? 1 : i === idx ? frac : 0) * 100}%`; });
  const setPill = (text, strong) => {
    pillText.textContent = text;
    pill.style.background = strong ? 'linear-gradient(180deg,var(--acc-soft),var(--c-sun))' : 'rgba(255,255,255,.06)';
    pill.style.color = strong ? 'var(--on-acc)' : 'var(--c-chalk)';
    dot.style.background = strong ? 'var(--on-acc)' : 'var(--c-sun)';
  };
  const flash = (text) => { // velké číslo / slovo přes podložku
    cd.textContent = text;
    if (cd.animate) cd.animate([{ opacity: 0, transform: 'scale(.55)' }, { opacity: 1, transform: 'scale(1.04)', offset: 0.28 }, { opacity: 0, transform: 'scale(1.12)' }], { duration: 950, easing: 'ease-out', fill: 'forwards' });
    else cd.style.opacity = 1;
  };
  const chipEl = (text) => {
    const c = h('div', '', text);
    c.style.cssText = `padding:${u(0.3)} ${u(1.2)};border-radius:var(--r-sm);font-size:${u(1.4)};font-weight:600;letter-spacing:.04em;text-transform:uppercase;border:1px solid rgba(255,255,255,.18);color:var(--c-mute)`;
    return c;
  };

  function enter(p, again = false) {
    phase = p; slow = p === 'preview' && again;
    hint.textContent = p === 'preview' ? 'OK = pauza · ↑ = ukázat pomalu · Zpět = konec' : 'OK = pauza · Zpět = konec'; t = 0; beat = -1; cdLast = 4; curPass = 0; wf = null; mat.reset();
    const d = drill();
    if (p === 'preview') {
      said = { almost: false, praise: 0, next: false };
      counter.textContent = `Cvik ${idx + 1} z ${workout.length}`;
      title.textContent = d.name;
      chips.replaceChildren(chipEl(TYPE_NAMES[drillType(d)]));
      if (drillType(d) === 'ball') {
        chips.append(chipEl(d.foot === 'left' ? 'Levá noha' : d.foot === 'right' ? 'Pravá noha' : 'Obě nohy'));
        if (d.foot === weakFootOf(profile.hand)) { const w = chipEl('Slabší noha'); w.style.color = 'var(--c-sun)'; w.style.borderColor = 'var(--c-sun)'; chips.append(w); }
      }
      chips.append(chipEl(tempoLabel(tempoMul)));
      task.textContent = d.info || '';
      // Trenér řekne název cviku a co má hráč dělat; slabší noha se připomene jen nakrátko
      if (!again) { say(`drill_${d.id}`, { kind: 'phrase' }); say(`task_${d.id}`, { kind: 'phrase' }); if (d.foot === weakFootOf(profile.hand)) sayGroup('weak'); }
      setPill(slow ? 'Ukázka pomalu' : 'Ukázka 1 ze 2', false); big.textContent = ''; setArc(1); setSeg(0);
    } else if (p === 'countdown') { setPill('Připrav se', false); task.textContent = ''; }
    else if (p === 'play') { setPill('Hraj!', true); }
    else if (p === 'rest') {
      done++; sfx('success'); if (workout[idx + 1]) sayGroup('rest'); setSeg(1);
      const nx = workout[idx + 1];
      setPill(nx ? `Odpočinek · další: ${nx.name}` : 'Hotovo!', false);
    }
  }

  function step(dt) {
    t += dt;
    const d = drill();
    if (phase === 'preview') {
      // ukázka proběhne dvakrát (po sobě, od začátku); jeden průchod = celé číslo vzorů, nejméně PREVIEW_SEC; "pomalu" je jediný průchod
      const bm = beatMs(d, tempoMul) * (slow ? 2.4 : 1.2);
      const cyc = (drillType(d) === 'jump' ? (d.sides || ['left', 'right']).length : Math.max(2, pat(d).length)) * bm;
      const passMs = slow ? 12000 : Math.max(PREVIEW_SEC * 1000, Math.ceil((PREVIEW_SEC * 1000) / cyc) * cyc);
      const passes = slow ? 1 : 2;
      const pvMs = passMs * passes;
      const pass = Math.min(passes - 1, Math.floor(t / passMs));
      if (pass !== curPass) { curPass = pass; beat = -1; wf = null; mat.reset(); if (!slow) setPill(`Ukázka ${pass + 1} ze 2`, false); }
      const b = Math.floor((t - pass * passMs) / bm);
      if (b !== beat) { beat = b; hi(d, pat(d)[b % pat(d).length], b, glide(bm)); }
      setArc(1 - t / pvMs);
      // odpočet začne, až dozní věty (nic se neusekne); nejvýš 7 s navíc
      if (t >= pvMs && (!voiceBusy() || t >= pvMs + 7000)) enter('countdown');
    } else if (phase === 'countdown') {
      const n = 3 - Math.floor(t / 1000);
      if (n !== cdLast && n >= 1) { cdLast = n; flash(String(n)); say(`countdown_${n}`, { kind: 'urgent' }); }
      if (n < 1) { flash('HRAJ'); sayGroup('go', { kind: 'urgent' }); enter('play'); }
    } else if (phase === 'play') {
      const total = d.durationSec * 1000;
      const bms = beatMs(d, tempoMul);
      const b = Math.floor(t / bms);
      if (b !== beat) {
        beat = b; const z = pat(d)[b % pat(d).length];
        const key = hi(d, z, b, glide(bms));
        dot.animate && dot.animate([{ transform: 'scale(1.9)', opacity: 1 }, { transform: 'scale(1)', opacity: 0.8 }], { duration: Math.min(300, bms * 0.7), easing: 'ease-out' });
        // hlášek je málo: jedna pochvala někde uprostřed a "už jen chvilku" před koncem, jinak jen povely
        const frac = t / total;
        const canPraise = bms >= 600; // u rychlých cviků pochvaly nepřerušují hlášení zón
        if (!said.almost && total - t <= 6000 && total >= 35000) { said.almost = true; sayGroup("almost", { kind: "phrase" }); }
        else if (canPraise && said.praise < 1 && frac >= 0.4 && Math.random() < 0.4) { said.praise++; sayGroup("praise", { kind: "phrase" }); }
        else if (key) say(key);
      }
      big.textContent = Math.max(0, Math.ceil((total - t) / 1000)); setArc(1 - t / total); setSeg(t / total);
      if (t >= total) enter('rest');
    } else if (phase === 'rest') {
      const total = REST_SEC * 1000;
      big.textContent = Math.max(0, Math.ceil((total - t) / 1000)); setArc(1 - t / total);
      if (!said.next && workout[idx + 1] && idx + 2 >= workout.length && total - t <= 4800) { said.next = true; sayGroup('last'); } // oznámí se jen poslední cvik
      if (t >= total || !workout[idx + 1]) {
        if (!workout[idx + 1]) return finish();
        idx++; enter('preview');
      }
    }
  }

  function finish(aborted = false) {
    clearInterval(timer); stopMusic(); if (aborted) stopVoice(); // dohrávající věta se na konci tréninku nesmí useknout
    go('result', { profile, workout, done, aborted }, { replace: true });
  }

  function setPaused(p) {
    paused = p;
    if (overlay) { overlay.remove(); overlay = null; }
    if (!p) { last = performance.now(); onBack(togglePauseMenu); sayGroup('resume'); return; }
    sayGroup('pause', { kind: 'urgent' });
    overlay = h('div', 'absolute inset-0 flex flex-col items-center justify-center gap-8');
    overlay.style.cssText += ';background:rgba(0,0,0,.82);z-index:10;backdrop-filter:blur(10px)';
    const tt = h('div', 'title', 'Pauza');
    const row = h('div', 'flex gap-8');
    const go1 = btn(`${icon('play')}Pokračovat`, 'btn-primary', () => setPaused(false), { auto: true });
    const stop = btn(`${icon('stop')}Ukončit`, 'btn', () => finish(true));
    row.append(go1, stop); overlay.append(tt, row); el.appendChild(overlay);
    overlay.addEventListener('click', (e) => e.stopPropagation());
    go1.focus();
    onBack(() => setPaused(false));
  }
  function togglePauseMenu() { setPaused(true); }

  // OK (Enter) mimo tlačítka = pauza; ovladač nemá žádný fokusovaný prvek, ale tělo reaguje
  el.tabIndex = 0;
  el.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !paused) { e.preventDefault(); setPaused(true); }
    else if (e.key === 'ArrowUp' && !paused && phase === 'preview') { e.preventDefault(); enter('preview', true); }
  });
  hint.style.cursor = 'pointer';
  hint.addEventListener('click', (e) => { if (phase === 'preview' && !paused) { e.stopPropagation(); enter('preview', true); } });
  el.addEventListener('click', () => { if (!paused) setPaused(true); });

  onBack(togglePauseMenu);
  const timer = setInterval(() => {
    const now = performance.now(); const dt = now - last; last = now;
    if (!paused) step(Math.min(dt, 250));
  }, 80);
  playMusic('bg_main');
  enter('preview');
  setTimeout(() => el.focus(), 0);
  return el;
}
