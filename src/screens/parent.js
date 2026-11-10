import { h, btn, u, jerseyEl, icon } from '../ui/dom.js';
import { settings, storage } from '../storage/index.js';
import { listProfiles, deleteProfile, profileLevel, saveProfile } from '../domain/profiles.js';
import { MAX_LEVEL } from '../domain/xp.js';
import { setVolume, setVoiceStyle, setVoiceIndex, setVoiceMode, say, VOICE_STYLES, sayDemo } from '../core/audio.js';
import { listMats, getMat, setMatVariants } from '../config/mats.js';
import { createMatView } from '../ui/MatView.js';
import { LEVEL_NAMES } from '../domain/trainer.js';
import { applyTheme } from '../ui/theme.js';

// ---- PIN rodičů: žádný výchozí; při prvním vstupu do Rodičů si ho rodič vytvoří; při zapomenutí se obnoví po vyřešení kontrolního příkladu ----
export const pinOf = (s) => (s.pinCustom && s.pin ? s.pin : null);

/** Číselná klávesnice 3×4 ovladatelná šipkami + OK. extra = poslední tlačítko vpravo dole (potvrzení, zpět…). */
function keypad(onKey, extra, compact = false) {
  const grid = h('div', 'grid');
  grid.style.cssText += `;grid-template-columns:repeat(3,auto);gap:${u(1.2)}`;
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', extra].forEach((d, i) => {
    const b = btn(d, 'btn', () => onKey(d), { auto: i === 4 });
    b.style.minWidth = u(8); b.style.minHeight = compact ? u(5.2) : u(6.6);
    grid.append(b);
  });
  return grid;
}

// Zadání PINu
export function pinScreen({ next }, { go, back }) {
  const el = h('section', 'screen');
  settings.load().then((s0) => { if (!pinOf(s0)) go('setPin', { next, from: 'first' }, { replace: true }); }); // první vstup: nejdřív vytvořit PIN
  el.style.gap = u(1.6);
  el.append(h('div', 'eyebrow', 'Rodiče'), h('div', 'title', 'Zadej <span class="accent">PIN</span>'));
  let val = '';
  const dots = h('div', 'font-extrabold');
  dots.style.fontSize = u(3.6); dots.style.letterSpacing = '0.3em';
  const draw = (msg) => { dots.textContent = msg || ('●'.repeat(val.length) + '○'.repeat(4 - val.length)); };
  draw();
  const press = async (d) => {
    if (d === '↩') { back(); return; }
    if (d === '⌫') val = val.slice(0, -1);
    else if (val.length < 4) val += d;
    draw();
    if (val.length === 4) {
      const s = await settings.load();
      if (pinOf(s) && val === pinOf(s)) go(next, {}, { replace: true });
      else { val = ''; draw('Špatně'); setTimeout(draw, 800); }
    }
  };
  const forgot = btn('Zapomněl jsem PIN', 'btn', () => go('pinReset', { next }));
  forgot.style.cssText += `;min-height:${u(4.6)};min-width:0;font-size:${u(1.6)};padding:0 ${u(2)};opacity:.75;border-radius:var(--r-sm)`;
  el.append(dots, keypad(press, '↩'), forgot);
  return el;
}

// Zapomenutý PIN: kontrolní příklad, který pětileté dítě nespočítá; po správné odpovědi se nastaví nový PIN
export function pinResetScreen({ next }, { go, back }) {
  const el = h('section', 'screen');
  el.style.gap = u(1.1);
  el.append(h('div', 'eyebrow', 'Zapomenutý PIN'), h('div', 'title', 'Jen pro <span class="accent">dospělé</span>'));
  const q = h('div', 'font-extrabold'); q.style.cssText = `font-size:${u(3.4)};letter-spacing:-0.03em`;
  const ans = h('div', 'font-extrabold'); ans.style.cssText = `font-size:${u(3.2)};min-height:${u(4)};color:var(--c-sun);letter-spacing:.1em`;
  const msg = h('div', 'muted'); msg.style.fontSize = u(1.7);
  let a = 0; let b = 0; let val = '';
  const ask = () => { a = 12 + Math.floor(Math.random() * 8); b = 6 + Math.floor(Math.random() * 4); val = ''; q.textContent = `Kolik je ${a} × ${b}?`; ans.textContent = '…'; };
  ask();
  msg.textContent = 'Odpověz správně a nastavíš si nový PIN.';
  const press = (d) => {
    if (d === '✓') {
      if (Number(val) === a * b) go('setPin', { next, from: 'reset' }, { replace: true });
      else { msg.textContent = 'To není správně, zkus nový příklad.'; ask(); }
      return;
    }
    if (d === '⌫') val = val.slice(0, -1); else if (val.length < 3) val += d;
    ans.textContent = val || '…';
  };
  const cancel = btn('Zpět', 'btn', () => back());
  cancel.style.cssText += `;min-height:${u(4.6)};min-width:0;font-size:${u(1.7)};padding:0 ${u(2)};border-radius:var(--r-sm)`;
  el.append(q, ans, keypad(press, '✓', true), msg, cancel);
  return el;
}

// Nastavení nového PINu: dvakrát za sebou (kontrola překlepu)
export function setPinScreen({ next = 'parent', from = 'settings' }, { go }) {
  const el = h('section', 'screen');
  el.style.gap = u(1.6);
  el.append(h('div', 'eyebrow', from === 'first' ? 'První vstup pro rodiče' : from === 'reset' ? 'Obnovení PINu' : 'Změna PINu'), h('div', 'title', from === 'first' ? 'Vytvoř si <span class="accent">PIN</span>' : 'Nový <span class="accent">PIN</span>'));
  const sub = h('div', 'muted'); sub.style.fontSize = u(1.8);
  let first = ''; let val = '';
  const dots = h('div', 'font-extrabold'); dots.style.cssText = `font-size:${u(3.6)};letter-spacing:.3em`;
  const draw = (m) => { dots.textContent = m || ('●'.repeat(val.length) + '○'.repeat(4 - val.length)); };
  const setStep = () => { sub.textContent = first ? 'Zadej PIN ještě jednou pro kontrolu.' : (from === 'first' ? 'Čtyřmístný PIN bude chránit nastavení pro rodiče. Neprozraď ho dětem.' : 'Vyber si čtyřmístný PIN (neprozraď ho dětem).'); };
  draw(); setStep();
  const press = async (d) => {
    if (d === '✕') { go(from === 'reset' || from === 'first' ? 'profiles' : 'parent', {}, { replace: true }); return; }
    if (d === '⌫') val = val.slice(0, -1); else if (val.length < 4) val += d;
    draw();
    if (val.length < 4) return;
    if (!first) { first = val; val = ''; draw(); setStep(); return; }
    if (val === first) {
      await settings.save({ pin: val, pinCustom: true });
      draw('Uloženo ✓'); setTimeout(() => go(next, {}, { replace: true }), 700);
    } else { first = ''; val = ''; draw('Nesedí'); setTimeout(() => { draw(); setStep(); }, 900); }
  };
  el.append(dots, sub, keypad(press, '✕'));
  return el;
}

// ---- pomocné prvky nastavení: panely v mřížce, řádek = popisek + ovládání ----
const panel = (title) => {
  const p = h('div', '');
  p.style.cssText = `border:1px solid var(--line);border-radius:var(--r-card);background:linear-gradient(160deg,rgba(255,255,255,.06),rgba(255,255,255,.02));padding:${u(2)} ${u(2.4)};display:flex;flex-direction:column;gap:${u(1.4)};min-width:0`;
  p.append(h('div', 'eyebrow', title));
  return p;
};
const row = (label, control) => {
  // popisek nad ovládáním na celou šířku panelu (přepínače s víc volbami se nemačkají)
  const r = h("div", "");
  r.style.cssText = `display:flex;flex-direction:column;gap:${u(0.6)}`;
  const l = h("div", "", label);
  l.style.cssText = `font-weight:600;font-size:${u(1.6)};color:var(--c-mute)`;
  r.append(l, control);
  return r;
};
/** Přepínač (segmentová volba): všechny volby stejně široké v jedné řadě, aktivní zvýrazněná. */
const seg = (opts, cur, onSet, cols = opts.length) => {
  const box = h('div', '');
  box.style.cssText = `display:grid;grid-template-columns:repeat(${cols},minmax(0,1fr));gap:${u(0.5)};padding:${u(0.5)};border-radius:var(--r-btn);background:rgba(255,255,255,.05);border:1px solid var(--line)`;
  const bs = [];
  const mark = (v) => bs.forEach(([x, b]) => {
    b.style.background = x === v ? 'linear-gradient(180deg,var(--acc-soft),var(--c-sun))' : 'transparent';
    b.style.color = x === v ? 'var(--on-acc)' : 'var(--c-chalk)';
    b.style.fontWeight = x === v ? '800' : '600';
  });
  opts.forEach(([v, text]) => {
    const b = btn(text, 'btn', async () => { await onSet(v); mark(v); });
    b.style.cssText += `;min-width:0;min-height:${u(5)};font-size:${u(1.7)};padding:0 ${u(0.6)};border-radius:var(--r-sm);border-color:transparent;background:transparent;box-shadow:none`;
    bs.push([v, b]); box.append(b);
  });
  mark(cur);
  return box;
};
/** Hlasitost: − [lišta o 10 dílcích] + */
const volume = (get, set) => {
  const box = h('div', '');
  box.style.cssText = `display:grid;grid-template-columns:${u(5)} minmax(0,1fr) ${u(5)} ${u(5.5)};align-items:center;gap:${u(1)}`;
  const bar = h('div', '');
  bar.style.cssText = `display:grid;grid-template-columns:repeat(10,1fr);gap:${u(0.35)}`;
  const cells = Array.from({ length: 10 }, () => { const c = h('div', ''); c.style.cssText = `height:${u(1.8)};border-radius:${u(0.3)};background:rgba(255,255,255,.1)`; bar.append(c); return c; });
  const val = h('div', 'muted');
  val.style.cssText = `text-align:right;font-size:${u(1.7)};font-weight:600`;
  const paint = () => { const v = Math.round(get() * 10); cells.forEach((c, i) => { c.style.background = i < v ? 'var(--c-sun)' : 'rgba(255,255,255,.1)'; }); val.textContent = `${v * 10} %`; };
  const m = btn('−', 'btn', () => { set(-0.1); paint(); }); const p = btn('+', 'btn', () => { set(0.1); paint(); });
  [m, p].forEach((b) => { b.style.cssText += `;min-width:0;min-height:${u(5)};padding:0;border-radius:var(--r-sm);font-size:${u(2.2)}`; });
  paint();
  box.append(m, bar, p, val);
  return box;
};

/** Výběr podložky: dlaždice s malým náhledem (v aktuální barvě) a pod nimi barevná provedení vybrané podložky. */
function matPicker(s, mats) {
  const box = h('div', '');
  box.style.cssText = `display:flex;flex-direction:column;gap:${u(1)}`;
  const grid = h('div', ''); grid.style.cssText = `display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:${u(0.8)}`;
  const sw = h('div', ''); sw.style.cssText = `display:flex;flex-wrap:wrap;align-items:center;gap:${u(0.8)}`;
  s.matVariants = s.matVariants || {};
  const paint = () => {
    grid.replaceChildren(); sw.replaceChildren();
    mats.forEach((m) => {
      const on = m.id === s.matId;
      const b = btn('', 'card', async () => { s.matId = m.id; await settings.save({ matId: m.id }); paint(); });
      b.style.cssText += `;padding:${u(0.6)};display:flex;flex-direction:column;gap:${u(0.4)};border-radius:var(--r-sm);min-width:0;border-color:${on ? 'var(--c-sun)' : ''};background:${on ? 'rgba(var(--acc-rgb),.16)' : ''}`;
      const th = h('div', ''); th.style.cssText = 'width:100%;aspect-ratio:3/2;pointer-events:none';
      const v = createMatView({ mat: getMat(m.id), labels: true }); v.el.style.cssText = 'width:100%;height:100%'; th.append(v.el);
      const nm = h('div', '', m.name); nm.style.cssText = `font-size:${u(1.25)};font-weight:${on ? 800 : 600};line-height:1.15;color:${on ? '#fff' : 'var(--c-mute)'}`;
      b.append(th, nm); grid.append(b);
    });
    const cur = mats.find((m) => m.id === s.matId);
    if (cur && cur.variants && cur.variants.length) {
      sw.append(h('div', 'muted', 'Barva:'));
      sw.firstChild.style.fontSize = u(1.4);
      const act = s.matVariants[cur.id] || cur.variants[0].id;
      cur.variants.forEach((vr) => {
        const c = btn('', 'btn', async () => { s.matVariants = { ...s.matVariants, [cur.id]: vr.id }; await settings.save({ matVariants: s.matVariants }); setMatVariants(s.matVariants); paint(); });
        c.style.cssText += `;min-width:0;min-height:${u(4.4)};padding:0 ${u(1.2)};gap:${u(0.7)};font-size:${u(1.4)};border-radius:var(--r-sm);border-color:${vr.id === act ? 'var(--c-sun)' : ''}`;
        c.innerHTML = `<span style="width:${u(2.2)};height:${u(2.2)};border-radius:50%;background:${vr.swatch};border:1px solid rgba(255,255,255,.4);flex:none"></span>${vr.name}`;
        sw.append(c);
      });
    }
  };
  paint(); box.append(grid, sw);
  return box;
}

export default function parent(_p, { go }) {
  applyTheme(null);
  const el = h('section', 'screen');
  el.style.cssText += `;overflow-y:auto;justify-content:flex-start;gap:${u(2)};align-items:stretch`;

  (async () => {
    const s = await settings.load();

    // záhlaví: nadpis vlevo, Zpět vpravo
    const head = h('div', 'flex items-center justify-between');
    const ttl = h('div', 'flex flex-col gap-1'); ttl.append(h('div', 'eyebrow', 'Nastavení'), h('div', 'title', 'Rodiče'));
    const exit = btn(`${icon('back')}Zpět`, 'btn-primary', () => go('profiles', {}, { replace: true }), { auto: true });
    exit.style.minHeight = u(6); exit.style.fontSize = u(2.2);
    head.append(ttl, exit);

    // panel Trénink
    const pTrain = panel('Trénink');
    const mats = listMats();
    pTrain.append(
      row('Podložka', matPicker(s, mats)),
      row('Obtížnost', seg([['auto', 'Auto'], ...Object.entries(LEVEL_NAMES).map(([k, v]) => [Number(k), v])], s.difficulty, (v) => settings.save({ difficulty: v }))),
      row('Tempo', seg([['auto', 'Auto'], [0.7, '0,7×'], [0.85, '0,85×'], [1, '1×'], [1.2, '1,2×'], [1.4, '1,4×']], s.tempoMode === 'manual' ? s.tempoMul : 'auto',
        (v) => (v === 'auto' ? settings.save({ tempoMode: 'auto' }) : settings.save({ tempoMode: 'manual', tempoMul: v })))),
      row('Délka tréninku', seg([[4, '4 min'], [6, '6 min'], [8, '8 min'], [10, '10 min']], s.workoutMin, (v) => settings.save({ workoutMin: v }))),
    );
    const hintT = h('div', 'muted', 'Auto: nováček má pomalejší tempo a lehčí cviky, s levelem se zrychluje.');
    hintT.style.fontSize = u(1.5);
    pTrain.append(hintT);

    // panel Zvuk
    const pSound = panel('Zvuk a hlas průvodce');
    pSound.append(row('Trenér', seg([['voice', 'Hlas Trenér'], ['beeps', 'Jen pípnutí'], ['off', 'Bez hlasu']], s.voiceMode || 'voice', async (v) => { await settings.save({ voiceMode: v }); setVoiceMode(v); if (v === 'beeps') { say('zone_2'); setTimeout(() => say('zone_5'), 260); } else if (v === 'voice') sayDemo(); })));
    if (Object.keys(VOICE_STYLES).length > 1) pSound.append(row('Hlas', seg(Object.entries(VOICE_STYLES).map(([k, v]) => [k, v.label]), s.voiceStyle, async (v) => { await settings.save({ voiceStyle: v }); setVoiceStyle(v); sayDemo(); })));
    const vol = (key, ch) => volume(() => s[key], (d) => { s[key] = Math.min(1, Math.max(0, Math.round((s[key] + d) * 10) / 10)); setVolume(ch, s[key]); settings.save({ [key]: s[key] }); });
    pSound.append(row('Hlasitost hlasu', vol('volVoice', 'voice')), row('Hudba', vol('volMusic', 'music')), row('Efekty', vol('volSfx', 'sfx')));

    const top = h('div', '');
    top.style.cssText = `display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,${u(46)}),1fr));gap:${u(2)}`;
    top.append(pTrain, pSound);

    // panel Hráči: karty v mřížce
    const pPlayers = panel('Hráči');
    const grid = h('div', '');
    grid.style.cssText = `display:grid;grid-template-columns:repeat(auto-fill,minmax(${u(26)},1fr));gap:${u(1.6)}`;
    const drawProfiles = async () => {
      grid.replaceChildren();
      const list = await listProfiles();
      if (!list.length) grid.append(h('div', 'muted', 'Zatím žádný hráč.'));
      for (const p of list) {
        const card = h('div', '');
        card.style.cssText = `display:flex;align-items:center;gap:${u(1.4)};padding:${u(1.2)};border:1px solid var(--line);border-radius:var(--r-btn);background:rgba(255,255,255,.03)`;
        card.append(jerseyEl(p, 7));
        const col = h('div', 'flex flex-col'); col.style.cssText = `gap:${u(0.8)};min-width:0;flex:1`;
        const nm = h('div', '', p.name + (p.isGuest ? ' (host)' : ''));
        nm.style.cssText = `font-weight:800;font-size:${u(2.1)};letter-spacing:-0.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis`;
        const rk = h('div', 'eyebrow', ''); rk.style.fontSize = u(1.2);
        // ruční úroveň: − / + nastaví XP na začátek předchozí/další úrovně (historie tréninků zůstane)
        const lvRow = h('div', ''); lvRow.style.cssText = `display:grid;grid-template-columns:${u(4.4)} minmax(0,1fr) ${u(4.4)};align-items:center;gap:${u(0.6)}`;
        const lvText = h('div', ''); lvText.style.cssText = `text-align:center;font-weight:700;font-size:${u(1.5)};line-height:1.2`;
        const paintLv = () => { const l = profileLevel(p); lvText.innerHTML = `Level ${l.level} · ${l.rank}<br><span style="color:var(--c-mute);font-weight:600;font-size:${u(1.2)}">${p.xp || 0} XP${l.suggested > l.level ? ` · <span style="color:var(--c-sun)">XP stačí na level ${l.suggested}</span>` : ''}</span>`; rk.textContent = ''; };
        const setLevel = async (delta) => {
          const cur = profileLevel(p).level;
          const target = Math.min(MAX_LEVEL, Math.max(1, cur + delta));
          p.level = target; // XP zůstávají, mění se jen úroveň (obtížnost a tempo)
          await saveProfile(p); paintLv();
        };
        const lm = btn('−', 'btn', () => setLevel(-1)); const lp = btn('+', 'btn', () => setLevel(1));
        [lm, lp].forEach((b) => { b.style.cssText += `;min-width:0;min-height:${u(4.4)};padding:0;border-radius:var(--r-sm);font-size:${u(2)}`; });
        lvRow.append(lm, lvText, lp); paintLv();
        const acts = h('div', 'flex flex-wrap'); acts.style.gap = u(0.6);
        const small = (b) => { b.style.cssText += `;min-height:${u(4.2)};min-width:0;font-size:${u(1.5)};padding:0 ${u(1.2)};border-radius:var(--r-sm)`; return b; };
        if (p.isGuest) acts.append(small(btn('Na stálého', 'btn', () => go('createProfile', { convertId: p.id, initial: p, returnTo: 'parent' }))));
        acts.append(small(btn(`${icon('edit')}Upravit`, 'btn', () => go('createProfile', { editId: p.id, initial: p, returnTo: 'parent' }))));
        const del = small(btn(`${icon('trash')}Smazat`, 'btn', async () => {
          if (del.dataset.sure) { await deleteProfile(p.id); drawProfiles(); return; }
          del.dataset.sure = '1'; del.innerHTML = 'Opravdu?'; del.style.color = '#FF6B6B';
        }));
        acts.append(del);
        col.append(nm, lvRow, acts);
        card.append(col);
        grid.append(card);
      }
    };
    await drawProfiles();
    pPlayers.append(grid);

    // panel Data
    const pData = panel('Data a zabezpečení');
    const changePin = btn('Změnit PIN', 'btn', () => go('setPin', { next: 'parent', from: 'settings' }));
    changePin.style.cssText += `;min-height:${u(5)};font-size:${u(1.8)};border-radius:var(--r-sm);align-self:flex-start`;
    const pinHint = h('div', 'muted', 'PIN chrání nastavení pro rodiče. Když ho zapomenete, obnovíte ho na obrazovce PINu přes „Zapomněl jsem PIN“.');
    pinHint.style.fontSize = u(1.5);
    pData.append(changePin, pinHint);
    const wipe = btn(`${icon('warn')}Smazat všechna data`, 'btn', async () => {
      if (wipe.dataset.sure) { await storage.clear(); go('profiles', {}, { replace: true }); return; }
      wipe.dataset.sure = '1'; wipe.innerHTML = 'Opravdu? Stiskni znovu'; wipe.style.color = '#FF6B6B';
    });
    wipe.style.cssText += `;min-height:${u(5)};font-size:${u(1.8)};border-radius:var(--r-sm);align-self:flex-start`;
    const hintD = h('div', 'muted', 'Smaže hráče, historii i nastavení. Nejde vrátit zpět.'); hintD.style.fontSize = u(1.5);
    pData.append(wipe, hintD);
    const about = btn(`${icon('check')}O aplikaci a licence`, 'btn', () => go('about'));
    about.style.cssText += `;min-height:${u(5)};font-size:${u(1.8)};border-radius:var(--r-sm);align-self:flex-start`;
    pData.append(about);

    // panel Vlastní tréninky: uložené sestavy se mažou tady
    const pCustom = panel('Vlastní tréninky');
    const cw = h('div', ''); cw.style.cssText = `display:grid;grid-template-columns:repeat(auto-fill,minmax(${u(30)},1fr));gap:${u(1.2)}`;
    const drawCw = async () => {
      cw.replaceChildren(); const list = (await settings.load()).customWorkouts || [];
      if (!list.length) cw.append(h('div', 'muted', 'Žádný uložený trénink. Ve „Cviky“ u hráče vyber cviky a stiskni Uložit.'));
      list.forEach((w) => {
        const c = h('div', ''); c.style.cssText = `display:flex;align-items:center;justify-content:space-between;gap:${u(1)};padding:${u(1)} ${u(1.4)};border:1px solid var(--line);border-radius:var(--r-btn);background:rgba(255,255,255,.03)`;
        c.append(h('div', '', `<b>${w.name}</b><br><span style="color:var(--c-mute);font-size:${u(1.4)}">${w.ids.length} cviků</span>`));
        const del = btn(`${icon('trash')}Smazat`, 'btn', async () => { if (del.dataset.sure) { const cur = (await settings.load()).customWorkouts || []; await settings.save({ customWorkouts: cur.filter((x) => x.id !== w.id) }); drawCw(); return; } del.dataset.sure = '1'; del.innerHTML = 'Opravdu?'; del.style.color = '#FF6B6B'; });
        del.style.cssText += `;min-height:${u(4.2)};min-width:0;font-size:${u(1.5)};padding:0 ${u(1.2)};border-radius:var(--r-sm)`;
        c.append(del); cw.append(c);
      });
    };
    await drawCw(); pCustom.append(cw);

    el.append(head, top, pPlayers, pCustom, pData);
    exit.focus();
  })();
  return el;
}
