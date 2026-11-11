import { h, btn, u, icon } from '../ui/dom.js';
import { getProfile } from '../domain/profiles.js';
import { allCards, RARITY, factOf, bioOf, bioSource } from '../domain/extras.js';
import { cardEl, flipCardEl } from '../ui/CardView.js';
import { applyTheme, getTeam } from '../ui/theme.js';

const KEY = 'cardsOwnOnly';
const loadOwn = () => { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } };
const saveOwn = (v) => { try { localStorage.setItem(KEY, v ? '1' : '0'); } catch (e) { /* bez úložiště */ } };

// Album karet: po vzácnosti, získané barevné, ostatní tmavé s otazníkem (nebo jen moje). OK na kartě ji zvětší a jde otočit (zajímavost).
export default function cards({ profileId }, { go, back, onBack }) {
  const el = h('section', 'screen');
  el.style.cssText += `;justify-content:flex-start;overflow-y:auto;gap:${u(1.6)}`;
  (async () => {
    const p = await getProfile(profileId);
    if (!p) return go('profiles', {}, { replace: true });
    applyTheme(getTeam(p.team));
    const own = p.cards || {};
    const list = allCards();
    const got = list.filter((c) => own[c.id]).length;
    let onlyOwn = loadOwn();

    const head = h('div', 'flex items-center justify-between w-full');
    const ttl = h('div', 'flex flex-col gap-1');
    ttl.append(h('div', 'eyebrow', 'Sběratelské karty · za každý trénink balíček'), h('div', 'title', `Karty <span class="accent">${got} z ${list.length}</span>`));
    const acts = h('div', 'flex'); acts.style.gap = u(1.4);
    const filt = btn('', 'btn', () => { onlyOwn = !onlyOwn; saveOwn(onlyOwn); paintFilter(); drawAll(); });
    filt.style.minHeight = u(6); filt.style.fontSize = u(1.9);
    const paintFilter = () => { filt.innerHTML = onlyOwn ? `${icon('grid')}Zobrazit všechny` : `${icon('check')}Jen moje karty`; };
    paintFilter();
    const bk = btn(`${icon('back')}Zpět`, 'btn-primary', () => back(), { auto: true });
    bk.style.minHeight = u(6); bk.style.fontSize = u(2.1);
    acts.append(filt, bk);
    head.append(ttl, acts); el.append(head);

    const body = h('div', 'flex flex-col w-full'); body.style.gap = u(1.6);
    el.append(body);

    const open = (c) => {
      // při otevřené kartě se pozadí nesmí posouvat (kolečko, dotyk, šipky) a nesmí z něj jít ovládat nic
      const top = el.scrollTop;
      el.style.overflowY = 'hidden'; head.inert = true; body.inert = true;
      const overlay = h('div', '');
      overlay.style.cssText = `position:absolute;left:0;right:0;top:${top}px;height:${el.clientHeight}px;z-index:30;display:flex;align-items:center;justify-content:center;gap:${u(4)};padding:0 ${u(4)};background:rgba(0,0,0,.92);backdrop-filter:blur(8px);animation:screen-in .3s ease backwards`;
      const side = h('div', 'flex flex-col'); side.style.cssText = `gap:${u(1.2)};max-width:${u(46)};text-align:left`;
      const r = RARITY[c.rarity];
      side.append(h('div', 'eyebrow', `${r.name} karta · ${own[c.id]}×`));
      const nm = h('div', 'title', c.name); nm.style.fontSize = u(4); side.append(nm);
      const card = flipCardEl(c, u(24), { text: factOf(c), count: own[c.id] });
      const bio = h('div', '', bioOf(c) || 'Slavný fotbalista, který se zapsal do historie hry.'); bio.style.cssText = `font-size:${u(1.75)};line-height:1.5;color:#fff;font-weight:500`;
      side.append(bio);
      if (bioSource(c)) { const so = h('div', 'muted', bioSource(c)); so.style.fontSize = u(1.2); side.append(so); }
      const tip = h('div', 'eyebrow', 'Klepni na kartu a otoč ji'); tip.style.fontSize = u(1.3);
      const closeCard = () => { overlay.remove(); el.style.overflowY = 'auto'; el.scrollTop = top; head.inert = false; body.inert = false; onBack(() => back()); };
      const close = btn(`${icon('back')}Zavřít`, 'btn', closeCard);
      onBack(closeCard); // Zpět na ovladači nejdřív zavře kartu
      close.style.minHeight = u(5.4); close.style.fontSize = u(1.9); close.style.alignSelf = 'flex-start';
      side.append(tip, close);
      overlay.append(card, side);
      el.appendChild(overlay); card.focus();
    };

    const drawAll = () => {
      body.replaceChildren();
      for (const rk of ['legend', 'epic', 'rare', 'common']) {
        let items = list.filter((c) => c.rarity === rk).sort((a, b) => b.rating - a.rating);
        const have = items.filter((c) => own[c.id]).length;
        const total = items.length;
        if (onlyOwn) items = items.filter((c) => own[c.id]);
        if (!items.length) continue;
        const r = RARITY[rk];
        const sec = h('div', 'flex flex-col w-full'); sec.style.gap = u(1);
        const lab = h('div', 'eyebrow', `${r.name} · ${have} z ${total}`); lab.style.color = r.a;
        const grid = h('div', ''); grid.style.cssText = `display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:${u(1.2)};justify-items:center`;
        for (const c of items) {
          const has = !!own[c.id];
          const b = btn('', '', () => { if (has) open(c); });
          b.style.cssText += `;background:none;border:none;padding:${u(0.4)};cursor:${has ? 'pointer' : 'default'};border-radius:${u(1)};width:100%;display:flex;justify-content:center`;
          b.append(cardEl(c, u(13.6), { locked: !has, count: own[c.id] }));
          grid.append(b);
        }
        sec.append(lab, grid); body.append(sec);
      }
      if (!body.children.length) body.append(h('div', 'muted', 'Zatím žádné karty. Za každý trénink dostaneš balíček!'));
    };
    drawAll();
    bk.focus();
  })();
  return el;
}
